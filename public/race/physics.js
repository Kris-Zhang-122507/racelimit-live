// Car physics for the racing game: a "bicycle" model (front and rear axle) with tyre slip,
// downforce and drag, a 2026-style power unit (combustion + battery), 8 gears, brakes with ABS,
// traction control, kerbs, run-off and walls. Pure maths, no three.js.

const G = 9.81, RHO = 1.225;

// 2026 car, roughly: 768 kg minimum + fuel; about 1,000 hp when the battery is deploying
export const CAR = {
  m: 800, a: 1.87, b: 1.53, h: 0.22, Iz: 1050,
  aero: { corner: { cl: 5.2, cd: 1.3 }, straight: { cl: 3.4, cd: 0.72 } }, aeroFront: 0.41,
  // The car is set up to understeer (run wide) at the limit instead of spinning: the wider rear tyres have
  // a lot more grip than the fronts and don't lose grip past their limit (Cr 1), the centre of gravity is
  // low, and the brakes are biased to the front, so even hard trail-braking keeps the rear planted.
  mu: 1.95, muRear: 1.45, Bf: 12, Br: 17, Cf: 1.45, Cr: 1.0,
  // ...but for pulling away and braking the rear tyres are ordinary: a real F1 car is traction-limited
  // to about 1.2 g off the line (0-100 km/h in about 2.6 s)
  muRearX: 1.0,
  tops: [100, 140, 176, 211, 246, 281, 317, 356], // km/h in each gear at 12,000 rpm
  shiftRpm: 11800, limiter: 12500, idle: 4000,
  // electric motor: 350 kW is the 2026 maximum; the car's normal map uses less so the battery lasts a lap,
  // and "overtake" (Space) lets the full 350 kW out and keeps it going to higher speeds
  pIce: 400e3, pErs: 260e3, pErsBoost: 350e3, battery: 4e6, harvest: 350e3, eff: 0.92,
  bias: 0.62, steerLow: 0.34,
};

// What the car can do, measured on a skid pad with this model (used by the AI to plan speeds)
export const ENVELOPE = {
  a0: 17.5, a1: 0.00606, vmax: 95,
  brake: (v) => 16.5 + 0.0078 * v * v,
  accel: (v) => Math.max(0.5, Math.min(10.5 + 0.002 * v * v, (0.92 * 600e3) / (800 * Math.max(v, 1))) - 0.0008 * v * v - 0.12),
};

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

// ---------- tyres ----------
// Three dry compounds for the weekend (Pirelli's soft / medium / hard colours). Each tyre has a
// temperature and wear: grip is best inside the compound's temperature window, drops when it's cold
// or overheating and as the rubber wears. Sliding a cold tyre grains it (a little grip lost until it
// cleans up), cooking it blisters it (lost for good), locking a wheel flat-spots it.
export const COMPOUNDS = {
  soft: { name: "Soft", letter: "S", color: "#E8002D", grip: 1.045, wear: 1.9, heat: 1.08, window: [85, 110] },
  medium: { name: "Medium", letter: "M", color: "#FFD12E", grip: 1.0, wear: 1.0, heat: 1.0, window: [90, 118] },
  hard: { name: "Hard", letter: "H", color: "#F0F0F0", grip: 0.965, wear: 0.6, heat: 0.9, window: [96, 126] },
};
export const TYRE_NAMES = ["front left", "front right", "rear left", "rear right"];
export function fitTyres(c, compound = "medium", temp = 70) { // 70 °C: what the 2026 tyre blankets allow
  c.compound = compound; c.tyres = [0, 1, 2, 3].map(() => ({ wear: 0, temp, grain: 0, blister: 0, flat: 0 })); c.tyreLaps = 0;
}
export function tyreGrip(t, compound) {
  const C = COMPOUNDS[compound] ?? COMPOUNDS.medium, [lo, hi] = C.window, T = t.temp;
  const fT = T < lo ? 1 - Math.min(0.16, (lo - T) * 0.0032) : T > hi ? 1 - Math.min(0.14, (T - hi) * 0.004) : 1;
  const fW = 1 - 0.1 * t.wear ** 1.6 - (t.wear > 0.85 ? (t.wear - 0.85) * 1.2 : 0);
  return C.grip * fT * fW * (1 - 0.03 * t.grain) * (1 - 0.05 * t.blister) * (1 - 0.012 * t.flat);
}
export const TY = { qs: 4, kF: 1.8, kR: 1.8, cool: 0.012, s0: 0.03, over: 0.08 };
function updateTyres(c, dt, u) {
  const C = COMPOUNDS[c.compound] ?? COMPOUNDS.medium, [lo, hi] = C.window, au = Math.abs(u);
  // heat put into the rubber by sliding: sideways force × slip angle × speed, plus driving and braking
  // (small slip angles, like the tiny corrections on a straight, hardly heat the rubber at all)
  const sF = Math.max(0, c.slipF - TY.s0), sR = Math.max(0, c.slipR - TY.s0);
  const pF = Math.abs(c.fyf ?? 0) * sF * au + Math.abs(c.fxf ?? 0) * 0.015 * au + (c.lockF ? 30000 : 0);
  const pR = Math.abs(c.fyr ?? 0) * sR * au + Math.abs(c.fxr ?? 0) * 0.015 * au + (c.lockR ? 30000 : 0) + c.spin * 60000;
  const out = (c.ay ?? 0) > 0 ? 1 : 0; // turning left → the right-hand tyres are on the outside and work harder
  for (let k = 0; k < 4; k++) {
    const t = c.tyres[k], front = k < 2, P = (front ? pF : pR) * ((k % 2 === out) ? 0.62 : 0.38);
    // The temperature is the rubber's core, which takes many corners to warm up and doesn't jump with
    // every slide: most of the sliding energy goes into the surface, the track and the air, and the harder
    // a tyre is worked the less of the extra reaches the core (so a twitchy keyboard driver runs a few
    // degrees hotter, not 100 °C hotter). Cooling goes up with speed (air) and with temperature.
    const q = P / 1000, qIn = TY.qs * (1 - Math.exp(-q / TY.qs)); // kW, saturating
    const cool = TY.cool * (t.temp - 25) * (1 + au / 25) * (1 + Math.max(0, t.temp - hi) * TY.over);
    t.temp += (qIn * (front ? TY.kF : TY.kR) * C.heat - cool) * dt;
    const hot = Math.max(0, t.temp - hi);
    t.wear = Math.min(1, t.wear + C.wear * (Math.min(q, 40) * 3e-5 + au * 1.5e-7) * (1 + hot * 0.04) * dt);
    // graining: sliding hard on a tyre that's still well under its window; it cleans up once warm
    if (t.temp < lo - 12 && (front ? c.slipF : c.slipR) > 0.14 && au > 10) t.grain = Math.min(1, t.grain + dt * 0.05); else if (t.temp > lo - 4) t.grain = Math.max(0, t.grain - dt * 0.02);
    // blistering: only after the core has been well over its window for a long while (minutes, not seconds)
    if (t.temp > hi + 15) t.blister = Math.min(1, t.blister + dt * 0.0025 * (1 + (t.temp - hi - 15) / 8));
    if ((front && c.lockF) || (!front && c.lockR)) t.flat = Math.min(1, t.flat + dt * 1.5);
  }
}
// grip (× the track's) and rolling drag (in g, plus a part that grows with speed) of what's under the car
const SURF_NAMES = ["grass", "tarmac", "gravel", "street"];
export const SURFACES = {
  track: { mu: 1, drag: 0, dragV: 0 }, kerb: { mu: 0.95, drag: 0, dragV: 0 }, apron: { mu: 0.92, drag: 0.01, dragV: 0 }, tarmac: { mu: 0.9, drag: 0.012, dragV: 0 }, street: { mu: 0.9, drag: 0.012, dragV: 0 },
  grass: { mu: 0.55, drag: 0.06, dragV: 0.0018 }, gravel: { mu: 0.42, drag: 0.32, dragV: 0.0075 },
};
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function newCar(tr, i = 0, lat = 0, back = 0) {
  const j = tr.wrap(i - back);
  const x = tr.X[j] + tr.LX[j] * lat, z = tr.Z[j] + tr.LZ[j] * lat;
  return {
    x, z, y: tr.Y[j], yaw: Math.atan2(tr.TX[j], tr.TZ[j]), u: 0, v: 0, r: 0,
    gear: 1, rpm: CAR.idle, ers: CAR.battery, idx: j, lat, s: tr.dist[j],
    steer: 0, throttle: 0, brake: 0, aeroMode: "corner", shiftT: 0, ax: 0, ay: 0, pitch: 0, roll: 0,
    surface: "track", kerb: false, spin: 0, lockF: false, lockR: false, impact: 0, reverse: false, wheelRot: 0, slipF: 0, slipR: 0,
    deploying: false, harvesting: false, overtake: false, offTrack: false, revT: 0, hit: null, assist: 0, inBarrier: false, onPit: false, pidx: 0, pitLimiter: false,
  };
}

const iceShape = (rpm) => (rpm < 10500 ? clamp(0.3 + (0.7 * (rpm - 4000)) / 6500, 0.3, 1) : rpm < CAR.limiter ? 1 - ((rpm - 10500) / 2000) * 0.08 : 0);
const rpmFor = (kmh, g) => (12000 * kmh) / CAR.tops[g - 1];

// Which road the car is on: the track, or the pit lane (a road of its own, see buildPitRoad). The car can
// only cross between them where there's no wall: where the pit entry leaves the track and where the
// exit joins it. c.idx always follows the track (for timing); c.pidx follows the pit road.
function roadFor(c, tr) {
  const P = tr.pitRoad;
  c.idx = tr.nearestFrom(c.x, c.z, c.idx, c.onPit ? 60 : 30);
  if (!P) { c.onPit = false; return tr; }
  if (c.onPit) {
    c.pidx = P.nearestFrom(c.x, c.z, c.pidx, 30);
    c.idx = tr.nearestFrom(c.x, c.z, tr.wrap(Math.round(P.mj[c.pidx])), 12); // the bit of track beside this bit of pit lane
    const f = P.frame(c.x, c.z, c.pidx), towards = P.tk === 0 ? f.lat : -f.lat; // + = towards the track
    if ((!P.bar[c.pidx] && towards > P.HW + 0.4) || (c.pidx === 0 && f.along < -1) || (c.pidx === P.N - 1 && f.along > 1)) c.onPit = false;
  } else {
    const pj = P.fromMain[c.idx];
    if (pj >= 0) {
      const p = P.nearestFrom(c.x, c.z, pj, 25);
      if (!P.bar[p]) {
        const fm = tr.frame(c.x, c.z, c.idx), f = P.frame(c.x, c.z, p), towards = P.tk === 0 ? f.lat : -f.lat;
        if (Math.sign(fm.lat) === P.side && Math.abs(fm.lat) > tr.half + 0.3 && towards <= P.HW + 0.2) { c.onPit = true; c.pidx = p; }
      }
    }
  }
  return c.onPit ? P : tr;
}

// input: { throttle 0..1, brake 0..1, steer -1..1 (+ = left), up, down (one-shot gear requests) }
// opts: { auto (gears), abs, tc, aeroAuto, stability (steering + slide help) }
export function stepCar(c, input, track, dt, opts = {}) {
  const { auto = true, abs = true, tc = true, aeroAuto = true, stability = true } = opts;
  const P = CAR;
  // ---- where are we: on the track or in the pit lane ----
  const tr = roadFor(c, track), ix = c.onPit ? c.pidx : c.idx;
  const f = tr.frame(c.x, c.z, ix);
  c.y = f.y;
  if (c.onPit) { const fm = track.frame(c.x, c.z, c.idx); c.lat = fm.lat; c.s = fm.s; } else { c.lat = f.lat; c.s = f.s; }
  // pit lane speed limiter (80 km/h between the lines), switched on and off automatically
  c.pitLimiter = c.onPit && tr.dist[ix] >= tr.limitFrom && tr.dist[ix] <= tr.limitTo;
  const half = tr.half, run = tr.run, alat = Math.abs(c.onPit ? f.lat : c.lat);
  const kerbHere = tr.kerb?.[ix] ?? 0;
  c.kerb = alat > half - 0.6 && alat < half + 1.6 && (kerbHere & (f.lat > 0 ? 1 : 2)) !== 0;
  c.offTrack = alat > half + 0.95; // all four wheels over the white line
  // beyond the white line: the kerb, then a strip of tarmac (the apron), then the run-off itself, which is
  // grass (slippery, slows you a bit), gravel (very little grip, and it drags the car to a stop fast),
  // painted tarmac or a street circuit's road
  const sk = f.lat >= 0 ? 0 : 1, ap = tr.apron ? tr.apron[sk][ix] : 0;
  c.surface = alat <= half ? "track" : c.kerb ? "kerb" : !tr.surf || alat <= half + 0.6 + ap ? "apron" : SURF_NAMES[tr.surf[sk][ix]];
  const SM = SURFACES[c.surface] ?? SURFACES.apron, au0 = Math.abs(c.u);
  const surfMu = SM.mu, surfDrag = Math.min(0.95, SM.drag + SM.dragV * au0) * P.m * G * Math.min(1, au0 / 2);

  // ---- inputs, smoothed ----
  const thr = clamp(input.throttle, 0, 1), brk = clamp(input.brake, 0, 1);
  const thrRate = thr > c.throttle ? (input.analog ? 14 : 5) : 16; // a keyboard can't feather, so it squeezes in over ~0.2 s
  c.throttle += (thr - c.throttle) * clamp(dt * thrRate, 0, 1);
  c.brake += (brk - c.brake) * clamp(dt * 18, 0, 1);
  const u = c.u, speed = Math.hypot(c.u, c.v), kmh = Math.max(0, u) * 3.6;
  const dMax = P.steerLow / (1 + Math.max(0, u - 8) / (input.analog ? 36 : 27)) + 0.14 * clamp(1 - Math.abs(u) / 14, 0, 1); // full lock below ~30 km/h, a bit more at walking pace (hairpins, the pit lane), less as speed rises
  let target = clamp(input.steer, -1, 1) * dMax;
  // steering help: never ask the front tyres for more than their best slip angle, measured from the
  // direction the front of the car is really moving. When the rear slides this turns into countersteer.
  c.assist = 0;
  if (stability && u > 8) {
    const beta = Math.atan2(c.v + P.a * c.r, u), aPk = 0.135;
    const lo = beta - aPk, hi = beta + aPk, t0 = target;
    target = clamp(target, Math.max(-dMax * 1.6, lo), Math.min(dMax * 1.6, hi));
    if (input.steer === 0) { const rearSlide = Math.atan2(c.v - P.b * c.r, u); if (Math.abs(rearSlide) > 0.06) target += clamp(rearSlide * 0.6, -0.08, 0.08); }
    c.assist = Math.abs(target - t0);
  }
  // keys turn the wheel at a steady rate that gets slower with speed (≈0.3 s to the limit), and let it
  // come back to the middle twice as fast; a controller stick moves it directly
  const back = Math.abs(target) < Math.abs(c.steer) || target * c.steer < 0;
  const rate = input.analog ? 3.5 * P.steerLow : Math.max(0.3, 1.3 / (1 + Math.max(0, u) / 25)) * (back ? 2 : 1);
  c.steer += clamp(target - c.steer, -rate * dt, rate * dt);
  const delta = c.steer;

  // ---- aero: 2026 straight mode opens on straights at full throttle, closes on braking ----
  if (aeroAuto) {
    let straight = true; for (let k = 0; k < 160 && straight; k += 8) if (Math.abs(tr.K[tr.wrap(ix + k)]) > 0.0045) straight = false;
    if (c.aeroMode === "corner" && straight && c.throttle > 0.95 && kmh > 170 && alat < half) c.aeroMode = "straight";
    else if (c.aeroMode === "straight" && (c.brake > 0.05 || c.throttle < 0.6 || !straight)) c.aeroMode = "corner";
  } else if (input.aero) c.aeroMode = c.aeroMode === "corner" && c.brake < 0.05 ? "straight" : "corner";
  const A = P.aero[c.aeroMode];
  const q = 0.5 * RHO * (track.rho ?? 1) * u * u, down = q * A.cl, drag = q * A.cd; // thinner air at altitude: less of both

  // ---- loads ----
  const L = P.a + P.b;
  const transfer = (P.m * c.ax * P.h) / L;
  // banking: the car is pressed into a banked corner (more load on the tyres the faster it goes round),
  // and gravity pulls it down the slope (see below)
  const bk = !c.onPit && track.bank ? track.bank[c.idx] : 0;
  const bankLoad = bk ? Math.cos(bk) + Math.max(0, -Math.sign(bk) * (c.ay ?? 0) / G) * Math.sin(Math.abs(bk)) : 1;
  const Fzf = Math.max(200, ((P.m * G * P.b) / L) * bankLoad + down * P.aeroFront - transfer);
  const Fzr = Math.max(200, ((P.m * G * P.a) / L) * bankLoad + down * (1 - P.aeroFront) + transfer);
  const sens = (Fz, Fz0) => clamp(1 - 0.04 * (Fz / Fz0 - 1), 0.8, 1.05);
  const gF = c.tyres ? (tyreGrip(c.tyres[0], c.compound) + tyreGrip(c.tyres[1], c.compound)) / 2 : 1, gR = c.tyres ? (tyreGrip(c.tyres[2], c.compound) + tyreGrip(c.tyres[3], c.compound)) / 2 : 1;
  const Df = P.mu * surfMu * gF * Fzf * sens(Fzf, (P.m * G * P.b) / L);
  const Dr = P.mu * P.muRear * surfMu * gR * Fzr * sens(Fzr, (P.m * G * P.a) / L);
  const Drx = Dr * (P.muRearX / P.muRear); // what the rear tyres can do along the car (drive, brakes)

  // ---- gears ----
  c.shiftT = Math.max(0, c.shiftT - dt);
  if (!c.reverse) {
    if (auto) {
      if (c.gear < 8 && rpmFor(kmh, c.gear) > P.shiftRpm && c.shiftT <= 0) { c.gear++; c.shiftT = 0.05; }
      else if (c.gear > 1 && rpmFor(kmh, c.gear - 1) < 10800 && c.shiftT <= 0) { c.gear--; c.shiftT = 0.1; }
    }
    if (input.up && c.gear < 8) { c.gear++; c.shiftT = 0.05; }
    if (input.down && c.gear > 1 && rpmFor(kmh, c.gear - 1) < P.limiter - 100) { c.gear--; c.shiftT = 0.08; }
  }
  const rpmRaw = rpmFor(kmh, c.gear);
  c.rpm = Math.max(P.idle + c.throttle * 3000 * (1 - smooth(0, 60, kmh)), Math.min(rpmRaw, P.limiter + 50));

  // ---- power unit ----
  // 2026 rules: the electric motor's power tapers off from 290 km/h and is gone by 355 km/h
  c.overtake = !!input.boost && c.ers > 0.08 * P.battery && c.throttle > 0.5 && !c.pitLimiter;
  const vmaxErs = 355 / 3.6, taperFrom = c.overtake ? 325 : 290, taper = clamp((vmaxErs - u) / ((355 - taperFrom) / 3.6), 0, 1);
  c.deploying = c.throttle > 0.9 && c.ers > 0 && u > 3 && !c.reverse;
  const pIce = c.throttle * P.pIce * iceShape(c.rpm) * (rpmRaw > P.limiter ? 0 : 1);
  const soc = c.ers / P.battery, mode = soc > 0.7 ? 1 : soc > 0.25 ? 0.25 + ((soc - 0.25) / 0.45) * 0.75 : soc; // the car's computer spreads the energy over the lap
  const pErs = c.deploying ? (c.overtake ? P.pErsBoost : P.pErs * mode) * taper : 0; // what the battery could give (it's charged for what's used, below)
  // "super clipping": with the battery getting low, the end of a long straight is used to recharge it at
  // full throttle, which costs some speed (at Spa in 2026 about 328 → 316 km/h before Les Combes)
  const clipping = c.throttle > 0.9 && u > 318 / 3.6 && c.ers < 0.45 * P.battery;
  const clipCost = clipping ? 130e3 * clamp((u - 318 / 3.6) / 5, 0, 1) : 0;
  let Fdrive = c.shiftT > 0.02 ? 0 : (P.eff * (pIce + pErs - clipCost)) / Math.max(u, 4);
  if (c.throttle < 0.05 && u > 2) Fdrive = -(350 + 1100 * (c.rpm / 12000)); // engine braking (gentle, so lifting mid-corner doesn't spin you)
  if (c.pitLimiter && u > 79.5 / 3.6 && Fdrive > 0) Fdrive = 0; // the limiter holds the car at 80

  // ---- reverse: stop, keep holding the brake for a moment, then it backs up ----
  if (!c.reverse && Math.abs(u) < 0.6 && c.brake > 0.5 && c.throttle < 0.05) { c.revT += dt; if (c.revT > 0.25) { c.reverse = true; c.gear = 1; } } else if (!c.reverse) c.revT = 0;
  if (c.reverse && (c.throttle > 0.05 || u > 0.8)) { c.reverse = false; c.revT = 0; }

  // ---- longitudinal tyre forces (drive or engine braking + brakes), limited by grip ----
  const Fb = Math.abs(u) > 0.6 && !c.reverse ? c.brake * (Df + Dr) * Math.sign(u) : 0;
  let Fxf = -Fb * P.bias, Fxr = Fdrive - Fb * (1 - P.bias);
  c.spin = 0; c.lockF = c.lockR = false;
  // traction control and ABS always keep back enough grip for cornering: at least what the tyre is
  // making now plus a margin, so getting on the power out of a corner can't snap the rear round
  // (below ~30 km/h the car moves like it's on rails, see the end, so the slip-model side forces there are
  // only nominal and mustn't eat the grip for pulling away while the wheel is turned)
  const wLow = smooth(3, 9, Math.abs(u));
  const fyrNow = Math.abs(c.fyr ?? 0) * wLow, fyfNow = Math.abs(c.fyf ?? 0) * wLow;
  const keepR = Math.min(Dr * 0.97, Math.max(1.3 * fyrNow, 0.5 * Dr)), keepF = Math.min(Df * 0.97, Math.max(1.2 * fyfNow, 0.4 * Df));
  const roomR = Drx * Math.sqrt(Math.max(0, 1 - (keepR / Dr) ** 2)), roomF = Math.sqrt(Math.max(0, Df * Df - keepF * keepF));
  if (Fxr > 0) {
    let lim = tc ? Math.max(roomR, 0.25 * Drx) : Drx;
    // stability help: ease the power while the rear is sliding
    if (stability) { const ar0 = Math.abs(Math.atan2(c.v - P.b * c.r, Math.max(Math.abs(u), 5))) * wLow; lim *= clamp(1 - (ar0 - 0.07) * 7, 0.25, 1); }
    if (Fxr > lim) { if (!tc && Fxr > Drx) c.spin = clamp((Fxr - Drx) / Drx, 0, 1); Fxr = c.spin ? Drx * 0.7 : lim; }
  }
  if (-Fxf > Df * 0.92 || (abs && -Fxf > Math.max(roomF, 0.6 * Df))) { if (abs) Fxf = -Math.min(Df * 0.92, Math.max(roomF, 0.6 * Df)); else if (-Fxf > Df) { Fxf = -Df * 0.85; c.lockF = true; } }
  if (-Fxr > Drx * 0.86 || (abs && -Fxr > Math.max(roomR, 0.45 * Drx))) { if (abs) Fxr = -Math.min(Drx * 0.86, Math.max(roomR, 0.45 * Drx)); else if (-Fxr > Drx) { Fxr = -Drx * 0.85; c.lockR = true; } }
  // the battery only pays for the power the tyres actually put down (the engine's share comes first), so
  // wheelspin-limited launches don't waste it
  if (pErs > 0 && Fxr > 0) c.ers = Math.max(0, c.ers - Math.min(pErs, Math.max(0, (Fxr * Math.max(u, 4)) / P.eff - pIce)) * dt);
  const Fbr = Math.max(0, -Fxr);
  // battery charges under braking and when lifting
  // battery: charges under braking (the motor works as a generator), a little when lifting, and by
  // "super-clipping" at full throttle at the very end of long straights, like the 2026 cars
  const clip = clipping; c.clipping = clipping;
  c.harvesting = u > 5 && (c.brake > 0.05 || c.throttle < 0.9 || clip);
  const pHarv = c.brake > 0.05 ? P.harvest * Math.min(1, c.brake * 2) : clip ? clipCost : c.throttle < 0.05 ? 250e3 : c.throttle < 0.9 && u > 15 ? 120e3 : 0;
  if (c.harvesting) c.ers = Math.min(P.battery, c.ers + pHarv * dt);

  // reversing: about 0.8 g back to ~35 km/h (a real F1 reverse gear is slow, this is kinder)
  if (c.reverse) { Fxf = 0; Fxr = u > -9.5 ? -6500 * c.brake : 0; }

  // ---- lateral tyre forces (slip angle, limited by what's left after braking/accelerating) ----
  const ue = Math.max(Math.abs(u), 5) * Math.sign(u || 1);
  const af = Math.atan2(c.v + P.a * c.r, Math.abs(ue)) - delta * Math.sign(ue);
  const ar = Math.atan2(c.v - P.b * c.r, Math.abs(ue));
  const pac = (alpha, D, B, C) => D * Math.sin(C * Math.atan(B * alpha));
  const Dyf = Math.sqrt(Math.max((c.lockF ? 0.15 : 1) * Df * Df - Fxf * Fxf, (0.12 * Df) ** 2));
  const Dyr = Dr * Math.sqrt(Math.max((c.lockR ? 0.35 : 1) - (Fxr / Drx) ** 2, 0.12 ** 2)); // the friction "ellipse"

  const Fyf = -pac(af, Dyf, P.Bf, P.Cf), Fyr = -pac(ar, Dyr, P.Br, P.Cr);
  c.slipF = Math.abs(af); c.slipR = Math.abs(ar); c.fyf = Fyf; c.fyr = Fyr; c.fxf = Fxf; c.fxr = Fxr;
  if (c.tyres) updateTyres(c, dt, u);

  // ---- slope, drag, rolling ----
  const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
  const along = fx * tr.TX[ix] + fz * tr.TZ[ix];
  const Fgrav = -P.m * G * tr.slope[ix] * along;
  // down the banking: towards the lower side (bk > 0 = the left side higher, so it pulls to the right)
  const gB = bk ? -P.m * G * Math.sin(bk) : 0, gBx = gB * (track.LX[c.idx] * fx + track.LZ[c.idx] * fz), gBy = gB * (track.LX[c.idx] * Math.cos(c.yaw) - track.LZ[c.idx] * Math.sin(c.yaw));
  const Fres = Math.sign(u) * (drag + 0.012 * P.m * G + surfDrag);

  // ---- integrate (body frame: u forward, v left, r = left yaw rate) ----
  const cd = Math.cos(delta), sd = Math.sin(delta);
  const FX = Fxf * cd - Fyf * sd * wLow + Fxr - Fres + Fgrav + gBx; // (the steered front tyre's side force only slows the car once it's really rolling)
  const FY = Fyf * cd + Fxf * sd + Fyr + gBy;
  let MZ = P.a * (Fyf * cd + Fxf * sd) - P.b * Fyr;
  // stability help (like the assist in racing games): if the car starts rotating faster than its grip
  // allows, or the rear slides, a correcting turn force calms it down — so a quick flick doesn't spin you
  if (stability && u > 8) {
    const rLim = (0.95 * (17.5 + 0.006 * u * u)) / u, rRef = clamp((u * Math.tan(delta)) / L, -rLim, rLim);
    const err = c.r - rRef, slide = Math.abs(ar) > 0.08 || Math.abs(c.r) > rLim;
    if (slide) MZ -= clamp(err * P.Iz * 9, -9000, 9000);
  }
  const w = smooth(3, 9, Math.abs(u)); // below ~30 km/h blend into a simple no-slip model
  let du = FX / P.m + c.r * c.v, dv = FY / P.m - c.r * u, dr = MZ / P.Iz;
  c.u += du * dt;
  // brakes hold the car at walking pace instead of letting it creep
  if (!c.reverse && c.brake > 0.1 && Math.abs(c.u) < 0.6) c.u -= Math.sign(c.u) * Math.min(Math.abs(c.u), 6 * c.brake * dt);
  if (!c.reverse && c.u < 0 && c.brake > 0 && Fdrive <= 0) c.u = Math.max(c.u, 0);
  c.v = w * (c.v + dv * dt) + (1 - w) * c.v * Math.max(0, 1 - dt * 8);
  const rKin = (c.u * Math.tan(delta)) / L;
  c.r = w * (c.r + dr * dt) + (1 - w) * rKin;
  c.ax = du; c.ay = FY / P.m;

  // ---- move ----
  c.yaw += c.r * dt;
  const lx = Math.cos(c.yaw), lz = -Math.sin(c.yaw), nfx = Math.sin(c.yaw), nfz = Math.cos(c.yaw);
  c.x += (nfx * c.u + lx * c.v) * dt; c.z += (nfz * c.u + lz * c.v) * dt;

  // ---- walls ----
  c.impact = 0; c.hit = null;
  const f2 = tr.frame(c.x, c.z, ix), side = f2.lat >= 0 ? 0 : 1;
  // how far the car's outline reaches towards the wall (nose 3.3 m ahead of the centre, tail 2.4 m behind, 1 m each side)
  const sgn0 = Math.sign(f2.lat) || 1, oX = sgn0 * tr.LX[ix], oZ = sgn0 * tr.LZ[ix];
  const dF = nfx * oX + nfz * oZ, dL = lx * oX + lz * oZ, rr = Math.max(1.0, Math.max(3.3 * dF, -2.4 * dF) + 1.0 * Math.abs(dL));
  const wb = tr.wall ? tr.wall[side][ix] : half + run + 0.6, soft = tr.wallType?.[side][ix] === 1;
  // Tecpro: the blocks get pushed back and squashed where they've been hit (and stay that way), up to
  // what the rows can take; behind that is a concrete wall
  const dent = soft && tr.dent ? tr.dent[side][ix] : 0, crush = soft ? (tr.crush?.[side][ix] ?? 0.8) : 0;
  const face = wb + dent - rr, backW = wb + crush - rr, alat2 = Math.abs(f2.lat);
  const wasIn = c.inBarrier; c.inBarrier = false;
  if (alat2 > face) {
    const sgn = Math.sign(f2.lat), nX = -sgn * tr.LX[ix], nZ = -sgn * tr.LZ[ix]; // points back to the track
    let VX = nfx * c.u + lx * c.v, VZ = nfz * c.u + lz * c.v;
    const vn = VX * nX + VZ * nZ, tX = tr.TX[ix], tZ = tr.TZ[ix], vt = VX * tX + VZ * tZ;
    if (soft && vn < -0.4 && alat2 < backW) {
      // pushing into the foam: it slows the car hard (more the less room is left) and grips its sides
      c.inBarrier = true;
      const room = Math.max(0.05, backW - alat2), A = clamp((vn * vn) / (1.6 * room), 300, 900), dv = Math.min(-vn, A * dt);
      VX += dv * nX; VZ += dv * nZ;
      const grab = Math.min(1, dt * 1.0); VX -= vt * grab * tX; VZ -= vt * grab * tZ;
      c.u = VX * nfx + VZ * nfz; c.v = VX * lx + VZ * lz; c.r *= Math.max(0, 1 - dt * 6);
      // the barrier's new face is where the car is now; neighbouring blocks get dragged back too
      const d = Math.min(crush, alat2 + rr - wb), arr = tr.dent?.[side];
      if (arr) for (let j = -5; j <= 5; j++) { const k = tr.wrap(ix + j), v = d * Math.exp(-((j / 2.6) ** 2)); if (v > arr[k]) arr[k] = v; }
      if (!wasIn) c.impact = -vn;
      c.hit = { idx: ix, side, speed: -vn, along: vt, soft: true, dent: d };
    } else {
      // concrete, armco, the pit wall, or Tecpro already squashed flat: a proper wall
      const lim = soft ? Math.min(face, backW) : face, push = alat2 - lim;
      if (push > 0) { c.x += nX * push; c.z += nZ * push; }
      if (vn < 0) {
        c.impact = -vn; c.hit = { idx: ix, side, speed: -vn, along: vt, soft };
        const e = soft ? 0.05 : 0.3; VX -= (1 + e) * vn * nX; VZ -= (1 + e) * vn * nZ;
        const scrub = Math.max(soft ? 0.4 : 0.55, 1 - (soft ? 0.06 : 0.04) * -vn); VX *= scrub; VZ *= scrub;
        c.u = VX * nfx + VZ * nfz; c.v = VX * lx + VZ * lz; c.r *= 0.4;
      }
    }
  }

  // ---- visuals ----
  // (the body's dive/squat and roll on its springs — small on an F1 car, it's stiffly sprung)
  c.pitch += (clamp(-c.ax * 0.0011, -0.016, 0.012) - c.pitch) * clamp(dt * 7, 0, 1);
  c.roll += (clamp(c.ay * 0.0006, -0.014, 0.014) - c.roll) * clamp(dt * 7, 0, 1);
  c.wheelRot += (c.u / CAR_R) * dt;
  return c;
}
const CAR_R = 0.352;

// reset onto the track centre, pointing the right way
export function resetCar(c, tr) {
  const j = c.idx; c.x = tr.X[j]; c.z = tr.Z[j]; c.yaw = Math.atan2(tr.TX[j], tr.TZ[j]);
  c.u = c.v = c.r = 0; c.gear = 1; c.reverse = false; c.steer = 0; c.revT = 0; c.onPit = false; c.inBarrier = false;
}

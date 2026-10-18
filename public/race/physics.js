// Car physics for the racing game: a "bicycle" model (front and rear axle) with tyre slip,
// downforce and drag, a 2026-style power unit (combustion + battery), 8 gears, brakes with ABS,
// traction control, kerbs, run-off and walls. Pure maths, no three.js.

const G = 9.81, RHO = 1.225;

// 2026 car, roughly: 768 kg minimum + fuel; about 1,000 hp when the battery is deploying
export const CAR = {
  m: 800, a: 1.87, b: 1.53, h: 0.3, Iz: 1050,
  aero: { corner: { cl: 5.2, cd: 1.3 }, straight: { cl: 3.4, cd: 0.78 } }, aeroFront: 0.43,
  mu: 1.95, muRear: 1.05, Bf: 12, Br: 17, C: 1.45, // wider rear tyres: more grip and stiffer, so the car is stable
  tops: [86, 128, 166, 200, 234, 266, 300, 346], // km/h in each gear at 12,000 rpm
  shiftRpm: 11800, limiter: 12500, idle: 4000,
  pIce: 400e3, pErs: 350e3, battery: 4e6, harvest: 350e3, eff: 0.92,
  bias: 0.58, steerLow: 0.34,
};

// What the car can do, measured on a skid pad with this model (used by the AI to plan speeds)
export const ENVELOPE = {
  a0: 17.5, a1: 0.00606, vmax: 95,
  brake: (v) => 16.5 + 0.0078 * v * v,
  accel: (v) => Math.max(0.5, Math.min(10.5 + 0.002 * v * v, (0.92 * 600e3) / (800 * Math.max(v, 1))) - 0.0008 * v * v - 0.12),
};

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function newCar(tr, i = 0, lat = 0, back = 0) {
  const j = tr.wrap(i - back);
  const x = tr.X[j] + tr.LX[j] * lat, z = tr.Z[j] + tr.LZ[j] * lat;
  return {
    x, z, y: tr.Y[j], yaw: Math.atan2(tr.TX[j], tr.TZ[j]), u: 0, v: 0, r: 0,
    gear: 1, rpm: CAR.idle, ers: CAR.battery, idx: j, lat, s: tr.dist[j],
    steer: 0, throttle: 0, brake: 0, aeroMode: "corner", shiftT: 0, ax: 0, ay: 0, pitch: 0, roll: 0,
    surface: "track", kerb: false, spin: 0, lockF: false, lockR: false, impact: 0, reverse: false, wheelRot: 0, slipF: 0, slipR: 0,
    deploying: false, harvesting: false, offTrack: false,
  };
}

const iceShape = (rpm) => (rpm < 10500 ? clamp(0.3 + (0.7 * (rpm - 4000)) / 6500, 0.3, 1) : rpm < CAR.limiter ? 1 - ((rpm - 10500) / 2000) * 0.08 : 0);
const rpmFor = (kmh, g) => (12000 * kmh) / CAR.tops[g - 1];

// input: { throttle 0..1, brake 0..1, steer -1..1 (+ = left), up, down (one-shot gear requests) }
// opts: { auto (gears), abs, tc, aeroAuto, steerAssist }
export function stepCar(c, input, tr, dt, opts = {}) {
  const { auto = true, abs = true, tc = true, aeroAuto = true } = opts;
  const P = CAR;
  // ---- where are we on the track ----
  c.idx = tr.nearestFrom(c.x, c.z, c.idx, 30);
  const f = tr.frame(c.x, c.z, c.idx);
  c.lat = f.lat; c.y = f.y; c.s = f.s;
  const half = tr.half, run = tr.run, alat = Math.abs(c.lat);
  const kerbHere = tr.kerb?.[c.idx] ?? 0;
  c.kerb = alat > half - 0.6 && alat < half + 1.6 && (kerbHere & (c.lat > 0 ? 1 : 2)) !== 0;
  c.offTrack = alat > half + 0.95; // all four wheels over the white line
  c.surface = alat <= half ? "track" : c.kerb ? "kerb" : "runoff";
  const surfMu = c.surface === "track" ? 1 : c.surface === "kerb" ? 0.95 : 0.8;
  const surfDrag = c.surface === "runoff" ? 0.06 * P.m * G : 0;

  // ---- inputs, smoothed ----
  const thr = clamp(input.throttle, 0, 1), brk = clamp(input.brake, 0, 1);
  c.throttle += (thr - c.throttle) * clamp(dt * 14, 0, 1);
  c.brake += (brk - c.brake) * clamp(dt * 18, 0, 1);
  const u = c.u, speed = Math.hypot(c.u, c.v), kmh = Math.max(0, u) * 3.6;
  const dMax = P.steerLow / (1 + Math.max(0, u) / (input.analog ? 40 : 30));
  const target = clamp(input.steer, -1, 1) * dMax;
  const rate = (input.analog ? 3.5 : 1.6) * P.steerLow;
  c.steer += clamp(target - c.steer, -rate * dt, rate * dt);
  const delta = c.steer;

  // ---- aero: 2026 straight mode opens on straights at full throttle, closes on braking ----
  if (aeroAuto) {
    let straight = true; for (let k = 0; k < 160 && straight; k += 8) if (Math.abs(tr.K[tr.wrap(c.idx + k)]) > 0.0045) straight = false;
    if (c.aeroMode === "corner" && straight && c.throttle > 0.95 && kmh > 170 && alat < half) c.aeroMode = "straight";
    else if (c.aeroMode === "straight" && (c.brake > 0.05 || c.throttle < 0.6 || !straight)) c.aeroMode = "corner";
  } else if (input.aero) c.aeroMode = c.aeroMode === "corner" && c.brake < 0.05 ? "straight" : "corner";
  const A = P.aero[c.aeroMode];
  const q = 0.5 * RHO * u * u, down = q * A.cl, drag = q * A.cd;

  // ---- loads ----
  const L = P.a + P.b;
  const transfer = (P.m * c.ax * P.h) / L;
  const Fzf = Math.max(200, (P.m * G * P.b) / L + down * P.aeroFront - transfer);
  const Fzr = Math.max(200, (P.m * G * P.a) / L + down * (1 - P.aeroFront) + transfer);
  const sens = (Fz, Fz0) => clamp(1 - 0.04 * (Fz / Fz0 - 1), 0.8, 1.05);
  const Df = P.mu * surfMu * Fzf * sens(Fzf, (P.m * G * P.b) / L);
  const Dr = P.mu * P.muRear * surfMu * Fzr * sens(Fzr, (P.m * G * P.a) / L);

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
  const vmaxErs = 345 / 3.6, taper = clamp((vmaxErs - u) / ((345 - 290) / 3.6), 0, 1);
  c.deploying = c.throttle > 0.9 && c.ers > 0 && u > 3 && !c.reverse;
  const pIce = c.throttle * P.pIce * iceShape(c.rpm) * (rpmRaw > P.limiter ? 0 : 1);
  const soc = c.ers / P.battery, mode = soc > 0.7 ? 1 : soc > 0.25 ? 0.25 + ((soc - 0.25) / 0.45) * 0.75 : soc; // the car's computer spreads the energy over the lap
  const pErs = c.deploying ? P.pErs * taper * mode : 0;
  c.ers = Math.max(0, c.ers - pErs * dt);
  const clipCost = c.throttle > 0.9 && u > 305 / 3.6 && c.ers < 0.8 * P.battery ? 200e3 * clamp((u - 305 / 3.6) / 6, 0, 1) : 0;
  let Fdrive = c.shiftT > 0.02 ? 0 : (P.eff * (pIce + pErs - clipCost)) / Math.max(u, 4);
  if (c.throttle < 0.05 && u > 2) Fdrive = -(700 + 2200 * (c.rpm / 12000)); // engine braking

  // ---- longitudinal tyre forces (drive or engine braking + brakes), limited by grip ----
  const Fb = u > 1 ? c.brake * (Df + Dr) : 0;
  let Fxf = -Fb * P.bias, Fxr = Fdrive - Fb * (1 - P.bias);
  c.spin = 0; c.lockF = c.lockR = false;
  // traction control and ABS leave room for the cornering force the tyre is already making
  const roomR = Math.sqrt(Math.max(Dr * Dr - (c.fyr ?? 0) ** 2, (0.35 * Dr) ** 2)), roomF = Math.sqrt(Math.max(Df * Df - (c.fyf ?? 0) ** 2, (0.45 * Df) ** 2));
  if (Fxr > roomR * 0.95) { if (tc) Fxr = roomR * 0.95; else if (Fxr > Dr) { c.spin = clamp((Fxr - Dr) / Dr, 0, 1); Fxr = Dr * 0.8; } }
  if (-Fxf > Math.min(Df * 0.92, roomF)) { if (abs) Fxf = -Math.min(Df * 0.92, roomF); else if (-Fxf > Df) { Fxf = -Df * 0.85; c.lockF = true; } }
  if (-Fxr > Math.min(Dr * 0.86, roomR * 0.9)) { if (abs) Fxr = -Math.min(Dr * 0.86, roomR * 0.9); else if (-Fxr > Dr) { Fxr = -Dr * 0.85; c.lockR = true; } }
  const Fbr = Math.max(0, -Fxr);
  // battery charges under braking and when lifting
  // battery: charges under braking (the motor works as a generator), a little when lifting, and by
  // "super-clipping" at full throttle at the very end of long straights, like the 2026 cars
  const clip = c.throttle > 0.9 && u > 305 / 3.6 && c.ers < 0.8 * P.battery;
  c.harvesting = u > 5 && (c.brake > 0.05 || c.throttle < 0.9 || clip);
  const pHarv = c.brake > 0.05 ? P.harvest * Math.min(1, c.brake * 2) : clip ? 200e3 * clamp((u - 305 / 3.6) / 6, 0, 1) : c.throttle < 0.05 ? 250e3 : c.throttle < 0.9 && u > 15 ? 120e3 : 0;
  if (c.harvesting) c.ers = Math.min(P.battery, c.ers + pHarv * dt);

  // reverse: hold brake when stopped
  if (u < 0.3 && c.brake > 0.5 && c.throttle < 0.05) c.reverse = true;
  if (c.reverse && (c.throttle > 0.05 || u > 0.5)) c.reverse = false;
  if (c.reverse) { Fxf = 0; Fxr = u > -4 ? -2600 * c.brake : 0; }

  // ---- lateral tyre forces (slip angle, limited by what's left after braking/accelerating) ----
  const ue = Math.max(Math.abs(u), 5) * Math.sign(u || 1);
  const af = Math.atan2(c.v + P.a * c.r, Math.abs(ue)) - delta * Math.sign(ue);
  const ar = Math.atan2(c.v - P.b * c.r, Math.abs(ue));
  const pac = (alpha, D, B) => D * Math.sin(P.C * Math.atan(B * alpha));
  const Dyf = Math.sqrt(Math.max((c.lockF ? 0.15 : 1) * Df * Df - Fxf * Fxf, (0.12 * Df) ** 2));
  const Dyr = Math.sqrt(Math.max((c.lockR || c.spin > 0.2 ? 0.35 : 1) * Dr * Dr - Fxr * Fxr, (0.12 * Dr) ** 2));
  const Fyf = -pac(af, Dyf, P.Bf), Fyr = -pac(ar, Dyr, P.Br);
  c.slipF = Math.abs(af); c.slipR = Math.abs(ar); c.fyf = Fyf; c.fyr = Fyr;

  // ---- slope, drag, rolling ----
  const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
  const along = fx * tr.TX[c.idx] + fz * tr.TZ[c.idx];
  const Fgrav = -P.m * G * tr.slope[c.idx] * along;
  const Fres = Math.sign(u) * (drag + 0.012 * P.m * G + surfDrag);

  // ---- integrate (body frame: u forward, v left, r = left yaw rate) ----
  const cd = Math.cos(delta), sd = Math.sin(delta);
  const FX = Fxf * cd - Fyf * sd + Fxr - Fres + Fgrav;
  const FY = Fyf * cd + Fxf * sd + Fyr;
  const MZ = P.a * (Fyf * cd + Fxf * sd) - P.b * Fyr;
  const w = smooth(3, 9, Math.abs(u)); // below ~30 km/h blend into a simple no-slip model
  let du = FX / P.m + c.r * c.v, dv = FY / P.m - c.r * u, dr = MZ / P.Iz;
  c.u += du * dt;
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
  c.impact = 0;
  const wall = half + run - 1.0;
  const f2 = tr.frame(c.x, c.z, c.idx);
  if (Math.abs(f2.lat) > wall) {
    const sgn = Math.sign(f2.lat), nX = -sgn * tr.LX[c.idx], nZ = -sgn * tr.LZ[c.idx]; // points back to the track
    const push = Math.abs(f2.lat) - wall; c.x += nX * push; c.z += nZ * push;
    let VX = nfx * c.u + lx * c.v, VZ = nfz * c.u + lz * c.v;
    const vn = VX * nX + VZ * nZ;
    if (vn < 0) {
      c.impact = -vn;
      VX -= 1.3 * vn * nX; VZ -= 1.3 * vn * nZ;
      const scrub = Math.max(0.55, 1 - 0.04 * -vn); VX *= scrub; VZ *= scrub;
      c.u = VX * nfx + VZ * nfz; c.v = VX * lx + VZ * lz; c.r *= 0.4;
    }
  }

  // ---- visuals ----
  c.pitch += (clamp(-c.ax * 0.0022, -0.03, 0.03) - c.pitch) * clamp(dt * 6, 0, 1);
  c.roll += (clamp(c.ay * 0.0012, -0.025, 0.025) - c.roll) * clamp(dt * 6, 0, 1);
  c.wheelRot += (c.u / CAR_R) * dt;
  return c;
}
const CAR_R = 0.352;

// reset onto the track centre, pointing the right way
export function resetCar(c, tr) {
  const j = c.idx; c.x = tr.X[j]; c.z = tr.Z[j]; c.yaw = Math.atan2(tr.TX[j], tr.TZ[j]);
  c.u = c.v = c.r = 0; c.gear = 1; c.reverse = false; c.steer = 0;
}

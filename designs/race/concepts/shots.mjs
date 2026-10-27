// Shots staged inside the game. `setup` runs in the page with K (kit.js) after the game is paused.
const H = `const sgn = (x) => (x >= 0 ? 1 : -1);
  const face = (i, o) => { const s = -sgn(o); return Math.atan2(K.tr.LX[i] * s, K.tr.LZ[i] * s); }; // stand at o, look at the track
  const C = (n, before = 30) => K.corner(n) ?? K.nextCorner(before).i;
  const half = K.tr.half;`;
const shot = (name, track, setup, o = {}) => ({ name, track, place: o.place ?? 300, speed: o.speed ?? 0, cam: o.cam ?? "chase", setup: H + setup });

// wet track: glossy dark water either side of a drier racing line
const WET = `
  const wet = (d0, d1) => {
    K.ribbon(d0, d1, (i) => (K.off(i) + 1.0 + half) / 2, (i) => Math.max(0.1, half - (K.off(i) + 1.0)), 0x1A1F27, { lit: true, rough: 0.05, metal: 0.6, opacity: 0.62 });
    K.ribbon(d0, d1, (i) => (K.off(i) - 1.0 - half) / 2, (i) => Math.max(0.1, half + (K.off(i) - 1.0)), 0x1A1F27, { lit: true, rough: 0.05, metal: 0.6, opacity: 0.62 });
    K.ribbon(d0, d1, (i) => K.off(i), 2.0, 0x2A2E35, { lit: true, rough: 0.35, metal: 0.2, opacity: 0.25 });
  };`;

export const SHOTS = [
  // ===== list 1 =====
  shot("s-weather", "spa", WET + `
    const iC = C(1); K.placeBefore(iC, 150); K.hideLine(); K.chase();
    wet(-10, 200);
    for (const [d, o, w, l] of [[10, half - 2.2, 3.2, 7], [19, -half + 2.4, 3.0, 6], [30, half - 2.8, 3.8, 9]]) { K.patch(d, o, w, l, 0xA9BCD2, { opacity: 0.55, y: 0.06, order: 5, round: true }); K.patch(d + l * 0.18, o + w * 0.1, w * 0.55, l * 0.45, 0xD5E2F0, { opacity: 0.35, y: 0.065, order: 6, round: true }); }
    K.anchor("puddle", K.ahead(10, half - 2.2, 0.1)); K.anchor("dry", K.ahead(12, null, 0.1));`),
  shot("s-rubber", "spa", `
    const iC = C(1); K.place(iC, K.off(iC));
    const p = K.at(iC, 0); K.cam(K.V(p.x, p.y + 70, p.z - 45), K.V(p.x, p.y, p.z + 45), 55);
    K.hideLine();
    K.ribbon(-160, 160, (i) => K.off(i), 1.9, 0x0A0B0D, { opacity: 0.55, step: 1.2 });
    let r = 3; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let k = 0; k < 220; k++) { const d = -40 + rnd() * 170, i = K.idx(d), lo = K.off(i), side = rnd() < 0.5 ? 1 : -1, o = lo + side * (2.4 + rnd() * 4.5); if (Math.abs(o) > half - 0.3) continue; K.disc(K.at(i, o), 0.06 + rnd() * 0.07, 0x15161A, { y: 0.06 }); }
    K.anchor("rubber", K.ahead(-70, null, 0.1)); { const i = K.idx(60); K.anchor("marbles", K.at(i, K.off(i) + 4.5 * sgn(-K.off(i)), 0.1)); }`, { place: 380 }),
  shot("s-debris", "monza", `
    const iC = C(1); K.placeBefore(iC, 260); K.hideLine(); K.chase({ up: 2.9, ahead: 9 });
    const cols = [0xFFA51F, 0x16171B, 0x2A2C30, 0xFFA51F, 0x16171B, 0xC8C8C8, 0x16171B];
    [[6.5, -1.4, 0.75], [8.5, 1.5, 0.55], [10.5, 0.4, 1.0], [13, -2.6, 0.7], [15.5, 2.3, 0.8], [18, -0.6, 0.6], [22, 1.2, 0.7]].forEach(([d, o, s], k) => K.debris(d, o, s, cols[k], k + 2));
    { const i = K.idx(11.5), p = K.at(i, -1.1, 0.14); K.box(p, [1.1, 0.28, 0.5], 0x16171B, [0, K.yaw(i) + 0.7, 0.15]); K.box(K.at(i, -1.1, 0.3), [0.7, 0.06, 0.48], 0xFFA51F, [0, K.yaw(i) + 0.7, 0.15]); K.anchor("endplate", K.at(i, -1.1, 0.45)); }
    { const i = K.idx(26), o = half + 3, p = K.at(i, o); K.person(p, face(i, o), { suit: 0xFF7A1A, pose: "wave", flag: 0xF2C230, helmet: false }); K.panel(K.at(K.idx(29), o), face(i, o), 0xF2C230); K.anchor("marshal", K.at(i, o, 2.4)); }`),
  shot("s-night", "singapore", `
    const iC = C(7); K.placeBefore(iC, 140); K.hideLine(); K.chase();
    K.car("AXIOM", 16, null); K.car("VELOCE", 33, null);`),
  shot("s-marshals", "silverstone", `
    const iC = C(15); K.placeBefore(iC, 260); K.hideLine(); K.chase({ back: 7, up: 2.4, fov: 60 });
    for (const [d, side, col, n] of [[7, 1, 0xF2C230, "y"], [15, -1, 0x2FD27A, "g"]]) {
      const i = K.idx(d), o = side * (half + 2.6), p = K.at(i, o);
      K.person(p, face(i, o), { suit: 0xFF7A1A, pose: "wave", flag: col, helmet: false });
      K.person(K.at(K.idx(d + 2.5), o + side * 1.2), face(i, o), { suit: 0xFF7A1A, helmet: false });
      K.panel(K.at(K.idx(d - 4), o), face(i, o), col);
      K.anchor(n, K.at(i, o, 2.9));
    }`),
  shot("s-school", "spa", `
    const iC = C(1); K.placeBefore(iC, 108); K.hideLine(); K.chase({ back: 11, up: 5.2, ahead: 32, fov: 54 });
    const dA = K.dTo(iC), dB = dA - 88;
    K.patch(dB, 0, half * 2 - 0.4, 1.6, 0xE8002D, { opacity: 0.92 });
    K.board(K.at(K.idx(dB), half + 1.6), K.yaw(K.idx(dB)) + Math.PI, "100", { w: 1.1, hh: 0.8 });
    K.anchor("brake", K.ahead(dB, 0, 0.3));
    for (const [d, s] of [[dA - 26, 1.6], [dA, 1.6], [dA + 36, 1.6]]) { const i = K.idx(d), o = K.off(i); K.cone(d, o + sgn(o) * 1.4, s); }
    const ia = K.idx(dA); K.anchor("apex", K.at(ia, K.off(ia) + sgn(K.off(ia)) * 1.4, 1.2));
    K.ribbon(3, dA + 55, (i) => K.off(i), 0.55, 0x5AA9FF, { opacity: 0.95, dash: 3 });`),
  shot("s-ghost", "monza", `
    const iC = C(1); K.placeBefore(iC, 300); K.hideLine(); K.chase();
    const g = K.car("RACELIMIT", 5.5, K.c.lat + 2.1, { ghost: true }); K.anchor("ghost", K.ahead(5.5, K.c.lat + 2.1, 1.4));`),
  shot("s-broadcast", "spa", `
    const iC = C(1); const s = sgn(K.off(iC)); K.place(K.idx(10, iC), K.off(K.idx(10, iC))); K.hideLine();
    K.car("VELOCE", 9, null); K.car("AXIOM", 19, null); K.car("NOVA", -10, null);
    const pos = K.at(K.idx(40), s * (half + 9), 13), look = K.at(K.idx(6), 0, 0.6); K.cam(pos, look, 32);`),
  shot("s-split1", "spa", `
    const iC = C(5); K.placeBefore(iC, 520); K.hideLine(); K.chase(); K.car("AXIOM", 17, K.c.lat - 1.2); K.anchor("p2", K.ahead(17, K.c.lat - 1.2, 1.4));`),
  shot("s-split2", "spa", `
    const iC = C(5); K.placeBefore(iC, 503); K.hideLine(); const ck = K.me.userData.ck; K.camCar([0, 1.2, ck - 0.62], [0, 0.75, ck + 20], 62); K.car("RACELIMIT", -17, K.c.lat + 1.2);`, { cam: "tcam" }),
  shot("s-radio", "spa", `
    const iC = C(5); K.placeBefore(iC, 480); K.hideLine(); K.car("VELOCE", 36, null);`, { cam: "cockpit" }),

  // ===== list 2 =====
  shot("s-gforce", "silverstone", `const iC = C(9); K.place(iC, K.off(iC)); K.hideLine();`, { cam: "cockpit" }),
  shot("s-brakes", "singapore", `
    const iC = C(7); K.placeBefore(iC, 55); K.hideLine(); K.chase({ back: 6, up: 1.6, ahead: 4, fov: 52 }); await K.frames(2);
    for (const w of ["rl", "rr"]) K.anchor(w, K.wheel(K.me, w));`),
  shot("s-fuel", "monza", `
    const iC = C(1); K.placeBefore(iC, 218); K.hideLine(); K.chase({ up: 2.6, ahead: 9 });
    const dL = K.dTo(iC) - 200; K.patch(dL, 0, half * 2 - 0.4, 2.4, 0x5AA9FF, { opacity: 0.95 });
    for (const m of [200, 150, 100]) { const i = K.idx(K.dTo(iC) - m); K.board(K.at(i, half + 1.8), K.yaw(i) + Math.PI, String(m), { w: 1.1, hh: 0.8 }); }
    K.anchor("lift", K.ahead(dL, 0, 0.3));`),
  shot("s-porpoise", "monza", `
    const iC = C(1); K.placeBefore(iC, 450); K.hideLine(); K.chase({ back: 6.2, up: 1.3, ahead: 6, fov: 54 }); K.sparks(K.me, 160);
    K.me.position.y += 0.0; K.anchor("sparks", K.me.localToWorld(K.V(0, 0.1, K.me.userData.zr - 1.2)));`),
  shot("s-flatspot", "zandvoort", `
    const iC = C(1); K.placeBefore(iC, 95); K.hideLine(); K.chase();
    const d0 = K.dTo(iC) - 70, d1 = K.dTo(iC) - 18;
    for (const s of [-0.8, 0.8]) K.ribbon(d0, d1, (i) => K.off(i) + s, (i, t) => 0.3 - t * 0.08, 0x111215, { opacity: 0.7, step: 0.6 });
    K.anchor("skid", K.ahead(d0 + 6, null, 0.1));`),
  shot("s-defend", "interlagos", `
    const iC = C(1); const j = K.placeBefore(iC, 210, 0.2); K.hideLine();
    K.camCar([0, 7.5, -27], [0, 0, 14], 46);
    K.car("VELOCE", -7, -2.2);
    K.ribbon(-34, -6, (i, t) => 1.6 - 1.4 * t, 0.35, 0xFFB547, { opacity: 0.95, dash: 2 });
    K.ribbon(-6, 30, (i, t) => 0.2 - 2.2 * Math.min(1, t * 1.6), 0.35, 0xFF5A5A, { opacity: 0.95, dash: 2 });
    K.anchor("move2", K.ahead(18, -1.9, 0.2)); K.anchor("brd", K.ahead(-7, -2.2, 1.2));`),
  shot("s-redflag", "silverstone", `
    K.hideLine(); K.placePit(150, 0); K.camCar([2.2, 4.2, -13], [0, 0.4, 12], 52);
    [["AXIOM", 158], ["VELOCE", 167], ["NOVA", 176]].forEach(([t, s]) => K.pitCar(t, s));
    { const q = K.pitAt(200, 3.5); K.panel(q.p, q.yaw + Math.PI, 0xE8002D); K.anchor("panel", K.V(q.p.x, q.p.y + 2.4, q.p.z)); }`),
  shot("s-tow", "monza", `
    const iC = C(1); K.placeBefore(iC, 330); K.hideLine(); K.chase({ fov: 54 });
    for (const [t, d, o] of [["NOVA", 12, -1.3], ["HALCYON", 21, 1.8], ["VORTEX", 30, -0.7], ["AXIOM", 41, 2.0]]) { K.car(t, d, K.c.lat + o); K.anchor(t, K.ahead(d, K.c.lat + o, 1.3)); }`),
  shot("s-photo", "monte-carlo", `K.hideLine(); K.camCar([2.7, 0.55, 3.9], [0, 0.45, 0.2], 36); await K.frames(2); K.anchor("car", K.me.localToWorld(K.V(0, 0.5, 0)));`, { place: 1200 }),
  shot("s-ticker", "silverstone", `
    const iC = C(15); K.placeBefore(iC, 330); K.hideLine(); K.chase();
    K.car("VELOCE", 11.5, K.c.lat - 1.7); K.car("NOVA", 10.8, K.c.lat + 1.8); K.anchor("battle", K.ahead(11.5, K.c.lat, 1.6));`),

  // ===== list 3 =====
  shot("s-crowd", "spa", `K.hideLine(); K.chase(); K.car("NOVA", 3.5, K.c.lat - 3.7); K.anchor("slv", K.ahead(3.5, K.c.lat - 3.7, 1.2));`, { place: 300, speed: 200 }),
  shot("s-podium", "silverstone", `
    K.hideLine(); K.hideCar();
    const i0 = K.idx(26), y0 = K.yaw(i0), back = y0 + Math.PI, P = (o, h = 0, d = 26) => K.at(K.idx(d), o, h);
    const block = (o, h, col) => K.box(P(o, h / 2), [1.7, h, 1.5], col, [0, y0, 0], { rough: 0.5 });
    K.box(P(0, 0.1, 27), [12, 0.2, 7], 0x1A1E27, [0, y0, 0], { rough: 0.7 }); block(0, 1.1, 0x2A2F3B); block(1.75, 0.75, 0x343A48); block(-1.75, 0.5, 0x343A48);
    K.text(P(0, 0.55, 25.2), back, 0.6, 0.6, (x, W, Hh) => { x.fillStyle = "#FFB547"; x.font = "bold " + Math.round(Hh * 0.8) + "px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("1", W / 2, Hh / 2); });
    K.text(P(0, 3.4, 29.5), back, 11, 4.2, (x, W, Hh) => { const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, "#1A1E27"); g.addColorStop(1, "#0E1117"); x.fillStyle = g; x.fillRect(0, 0, W, Hh); x.fillStyle = "#FFB547"; x.font = "bold " + Math.round(Hh * 0.1) + "px Arial, sans-serif"; x.textAlign = "center"; x.fillText("RACELIMIT GRAND PRIX · SILVERSTONE", W / 2, Hh * 0.2); x.fillStyle = "#E8EAF0"; x.font = "bold " + Math.round(Hh * 0.07) + "px Arial, sans-serif"; x.fillText("RACE WINNER", W / 2, Hh * 0.32); x.strokeStyle = "#FFB547"; x.lineWidth = Hh * 0.01; x.strokeRect(W * 0.03, Hh * 0.05, W * 0.94, Hh * 0.9); }, { lit: true });
    const pp = (o, h, suit, helmet, pose) => K.person(P(o, h), back, { suit, helmet: false, cap: helmet, pose });
    pp(0, 1.1, 0xFFA51F, 0x16171B, "both"); pp(1.75, 0.75, 0x16245C, 0xF2C230, "wave"); pp(-1.75, 0.5, 0xC8102E, 0xF2F2F2, "wave");
    { const t = P(0.35, 3.25); K.mesh(new THREE.CylinderGeometry(0.16, 0.07, 0.36, 20), K.std(0xD8B04A, { metal: 1, rough: 0.25 }), t); K.mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.12, 12), K.std(0xD8B04A, { metal: 1, rough: 0.25 }), K.V(t.x, t.y - 0.24, t.z)); }
    let r = 5; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const L = [K.tr.LX[i0], K.tr.LZ[i0]], F = [K.tr.TX[i0], K.tr.TZ[i0]];
    for (let k = 0; k < 60; k++) { const t = k / 60, o = 1.6 - t * 2.6, h = 2.7 + Math.sin(t * Math.PI) * 1.6, p = P(o, h, 25.6 - t * 0.6); K.mesh(new THREE.SphereGeometry(0.035 + rnd() * 0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0xF6EDC4, transparent: true, opacity: 0.75 - t * 0.4, roughness: 0.2 }), p).castShadow = false; }
    const cc = [0xFFB547, 0xE8EAF0, 0x5AA9FF, 0x2FD27A, 0xFF5A6A];
    for (let k = 0; k < 160; k++) { const o = (rnd() - 0.5) * 12, h = 1.5 + rnd() * 5, d = 22 + rnd() * 7; K.mesh(new THREE.PlaneGeometry(0.09, 0.05), new THREE.MeshBasicMaterial({ color: cc[k % 5], side: THREE.DoubleSide }), P(o, h, d), [rnd() * 6, rnd() * 6, rnd() * 6]); }
    K.cam(P(0, 2.0, 12.5), P(0, 2.3, 27), 46);`, { place: 30 }),
  shot("s-gridwalk", "silverstone", `
    K.hideLine(); K.place(K.c.idx, 2.4); K.blankets(K.me);
    K.car("VELOCE", 8, -2.4); K.car("AXIOM", 16, 2.4); K.car("NOVA", 24, -2.4); K.car("KESTREL", 32, 2.4);
    const i0 = K.c.idx;
    K.person(K.at(K.idx(1.2), 3.9), face(i0, 3.9), { suit: 0xFFA51F, helmet: false, cap: 0x16171B });
    K.person(K.at(K.idx(-2.0), 3.7), face(i0, 3.7) + 0.6, { suit: 0x16171B, helmet: false, cap: 0xFFA51F });
    K.umbrella(K.at(K.idx(0.8), 1.3), 0xFFA51F);
    K.person(K.at(K.idx(9.5), -4.2), face(i0, -4.2), { suit: 0xC8102E, helmet: false, cap: 0xF2F2F2 });
    K.umbrella(K.at(K.idx(8.8), -1.2), 0xC8102E);
    K.camCar([-4.3, 1.75, -5.5], [-0.8, 0.7, 9], 52); K.anchor("you", K.ahead(0, 2.4, 1.6));`, { place: 30 }),
  shot("s-dash", "spa", `const ck = K.me.userData.ck; K.camCar([0, 0.86, ck - 0.12], [0, 0.54, ck + 0.42], 38);`, { place: 2500, speed: 120, cam: "cockpit" }),
  shot("s-suspension", "spa", `K.hideLine(); const zf = K.me.userData.zf; K.camCar([1.55, 0.62, zf + 2.6], [0.45, 0.33, zf - 0.1], 38);`, { place: 2500 }),
  shot("s-haze", "monza", `
    const iC = C(1); K.placeBefore(iC, 330); K.hideLine(); K.chase({ fov: 54 });
    K.car("NOVA", 11.5, K.c.lat + 0.3); K.anchor("car", K.ahead(11.5, K.c.lat + 0.3, 0.7)); K.anchor("haze", K.ahead(8.2, K.c.lat + 0.3, 0.55));`),
  shot("s-dirty", "spa", `K.hideLine(); K.camCar([2.3, 1.15, -3.6], [0, 0.55, 0.4], 38);`, { place: 300 }),
  shot("s-dirtymask", "spa", `K.hideLine(); K.camCar([2.3, 1.15, -3.6], [0, 0.55, 0.4], 38); K.maskOnly();`, { place: 300 }),
  shot("s-crewcam", "silverstone", `
    K.hideLine(); K.placePit(150, 0); await K.frames(2); const me = K.me; me.updateMatrixWorld();
    const yaw = K.c.yaw, W = (w) => K.wheel(me, w);
    for (const w of ["fl", "fr", "rl", "rr"]) { const p = W(w), side = w[1] === "l" ? 1 : -1, q = me.localToWorld(me.worldToLocal(p.clone()).add(K.V(side * 0.75, 0, 0))); q.y -= K.me.userData.E.r; K.person(q, yaw - side * Math.PI / 2, { suit: 0xFFA51F, helmet: 0x16171B, pose: "kneel", gun: true }); }
    { const q = me.localToWorld(K.V(0, 0, me.userData.zf + 2.1)); q.y = W("fl").y - me.userData.E.r; K.person(q, yaw + Math.PI, { suit: 0xFFA51F, helmet: 0x16171B, pose: "kneel" }); }
    { const q = me.localToWorld(K.V(1.9, 0, me.userData.zf + 1.2)); q.y = W("fl").y - me.userData.E.r; K.person(q, yaw - 2.4, { suit: 0x16171B, helmet: false, cap: 0xFFA51F, pose: "lolli" }); K.anchor("go", K.V(q.x, q.y + 2.2, q.z)); }
    K.camCar([0.9, 1.5, me.userData.zf + 6.4], [0, 0.35, -0.6], 48);`),

  // ===== new ideas =====
  shot("n-realrace", "singapore", `const iC = C(7); K.placeBefore(iC, 160); K.hideLine(); K.chase(); K.car("VELOCE", 11, K.c.lat - 1.4); K.car("NOVA", 21, K.c.lat + 1.1); K.car("AXIOM", 33, K.c.lat - 0.3);`),
  shot("n-explain", "spa", `
    const iC = C(5); K.placeBefore(iC, 520); K.hideLine(); K.chase(); K.car("AXIOM", 18, null);
    for (const side of [1, -1]) { const i = K.idx(13), o = side * (half + 1.8); K.panel(K.at(i, o), face(i, o), 0xF2C230); K.board(K.at(K.idx(15.5), o), face(i, o), "VSC", { w: 1.2, hh: 0.8, h: 2.4, bg: "#F2C230", fg: "#16171B" }); if (side === 1) K.anchor("vsc", K.at(i, o, 2.8)); }`),
  shot("n-spotter", "monza", `const iC = C(1); K.placeBefore(iC, 300); K.hideLine(); K.car("VELOCE", 3.0, K.c.lat + 3.0); K.anchor("side", K.ahead(3.0, K.c.lat + 3.0, 0.8));`, { cam: "cockpit" }),
  shot("n-migration", "spa", `const iC = C(1); K.placeBefore(iC, 110); K.hideLine();`, { cam: "cockpit" }),
  shot("n-wind", "silverstone", `
    const iC = C(15); K.placeBefore(iC, 300); K.hideLine(); K.chase({ back: 10.5, up: 3.3 });
    { const i = K.idx(26), o = half + 4.5; K.windsock(K.at(i, o), K.yaw(i) - 0.9); K.anchor("sock", K.at(i, o, 6.6)); }
    for (const d of [34, 46, 58]) { const i = K.idx(d), o = -(half + 4.5); K.flagpole(K.at(i, o), K.yaw(i) - 0.9 + Math.PI / 2, [0xFFB547, 0x5AA9FF, 0xE8EAF0][d % 3], 0.5); }`),
  shot("n-kerbs", "monza", `
    const iC = C(1); K.placeBefore(iC, 70); K.hideLine();
    const s = sgn(K.off(iC)), i1 = K.idx(18, iC);
    for (let k = -6; k <= 6; k++) { const i = K.idx(k * 1.3, iC), p = K.at(i, s * (half + 1.5), 0); const m = K.mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.2, 16, 1, false, 0, Math.PI), K.std(0xF2C230, { rough: 0.5 }), p, [0, K.yaw(i), Math.PI / 2]); m.rotation.order = "YXZ"; m.rotation.set(0, K.yaw(i), Math.PI / 2); }
    K.anchor("sausage", K.at(iC, s * (half + 1.6), 0.4));
    { const d0 = K.dTo(iC) - 14; K.ribbon(d0, d0 + 46, (i) => -s * (half + 2.4), 4.0, 0x2E7D5B, { lit: true, rough: 0.5 }); K.anchor("paint", K.at(K.idx(8, iC), -s * (half + 2.4), 0.1)); }
    K.anchor("rumble", K.at(K.idx(-10, iC), s * (half + 0.4), 0.1));
    K.cam(K.at(K.idx(-16, iC), -s * 1.0, 2.0), K.at(K.idx(3, iC), s * (half - 0.5), 0.1), 64);`),
  shot("n-blankets", "silverstone", `
    K.hideLine(); K.placePit(150, 0); await K.frames(2); K.blankets(K.me, 0x9C1C24);
    K.person(K.me.localToWorld(K.V(1.6, 0, 0.6)).setY(K.c.y), K.c.yaw - Math.PI / 2, { suit: 0xFFA51F, helmet: false, cap: 0x16171B });
    K.camCar([2.9, 1.3, 3.6], [0, 0.4, -0.2], 44); K.anchor("blanket", K.wheel(K.me, "fl"));`),
  shot("n-mirror", "spa", `const iC = C(3); const j = K.idx(-60, iC); K.place(j, K.off(j), Math.PI); K.hideLine(); K.chase();`),
  shot("n-trackwalk", "spa", `
    const iC = C(1); K.hideCar(); K.hideLine();
    const s = sgn(K.off(iC)), dB = -75;
    for (const [m, t] of [[150, "150"], [100, "100"], [50, "50"]]) { const i = K.idx(-m, iC); K.board(K.at(i, -s * (half + 1.6)), K.yaw(i) + Math.PI, t, { w: 1.1, hh: 0.8 }); if (m === 100) K.anchor("board", K.at(i, -s * (half + 1.6), 1.6)); }
    K.anchor("apex", K.at(iC, s * (half - 0.3), 0.3));
    const ic = K.idx(-118, iC); K.cam(K.at(ic, -s * (half - 1.4), 1.7), K.at(K.idx(-10, iC), s * 1.5, 0.8), 62);`),
  shot("n-museum", "silverstone", `
    K.hideLine(); const g = K.group(); const base = K.at(K.c.idx, 0, 0), yaw = K.c.yaw;
    K.hideWorld([g]); K.scene.background = new THREE.Color(0x0B0D12); K.scene.fog = null;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), K.std(0x08090C, { rough: 0.92, metal: 0.0 })); fl.rotation.x = -Math.PI / 2; fl.position.copy(base).add(K.V(0, 0.002, 0)); fl.receiveShadow = true; g.add(fl);
    const eras = [[1998, "VELOCE"], [2009, "AXIOM"], [2014, "MERIDIAN"], [2017, "NOVA"], [2022, "VORTEX"]];
    K.me.visible = false;
    eras.concat([[2026, "RACELIMIT"]]).forEach(([era, team], k) => { const a = yaw + (k - 2.5) * 0.36, R = 15, p = base.clone().add(K.V(Math.sin(a) * R, 0, Math.cos(a) * R));
      K.box(K.V(p.x, p.y + 0.12, p.z), [3.4, 0.24, 6.6], 0x2A2F3B, [0, a + Math.PI / 2 + 0.2, 0], { rough: 0.4 });
      const car = K.car(team, 0, 0, { era, pos: K.V(p.x, p.y + 0.24, p.z), yaw: a + Math.PI / 2 + 0.2 + Math.PI });
      const lt = new THREE.SpotLight(0xFFF2E0, 90, 16, 0.5, 0.6, 1.4); lt.position.set(p.x, p.y + 7, p.z); lt.target.position.set(p.x, p.y, p.z); g.add(lt.target); g.add(lt); K.anchor("e" + era, K.V(p.x, p.y + 1.6, p.z)); });
    K.cam(base.clone().add(K.V(Math.sin(yaw) * -6, 6.5, Math.cos(yaw) * -6)), base.clone().add(K.V(Math.sin(yaw) * 14, 0.2, Math.cos(yaw) * 14)), 58);`, { place: 30 }),
  shot("n-pa", "spa", `
    K.hideLine(); K.chase();
    for (const [d, side] of [[16, -1], [42, -1]]) { const i = K.idx(d), o = side * (half + 2.2), p = K.at(i, o);
      K.mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.6, 8), K.std(0x8C939E, { metal: 0.6 }), K.V(p.x, p.y + 2.3, p.z));
      for (const [dy, r] of [[4.3, 0.4], [3.75, -0.4]]) { const b = K.box(K.V(p.x, p.y + dy, p.z), [0.5, 0.42, 0.42], 0x1A1C22, [0, face(i, o) + r, 0]); }
      if (d === 16) K.anchor("speaker", K.V(p.x, p.y + 4.6, p.z)); }`, { place: 300, speed: 200 }),
  shot("n-sound", "monte-carlo", `const iC = C(9, 30); K.placeBefore(iC, 40); K.hideLine(); K.chase();`),
  // the live TV / spectator views
  shot("tv-1", "silverstone", `
    const iC = C(1); const s = sgn(K.off(iC)); K.place(K.idx(6, iC), K.off(K.idx(6, iC))); K.hideLine();
    K.car("VELOCE", 8, null); K.car("AXIOM", 17, null); K.car("NOVA", -9, null); K.car("KESTREL", -19, null);
    K.cam(K.at(K.idx(46), -s * (half + 15), 7), K.at(K.idx(2), 0, 0.6), 28); K.anchor("you", K.ahead(0, null, 1.6)); K.anchor("p2", K.ahead(8, null, 1.6));`),
  shot("tv-2", "silverstone", `
    const iC = C(1); const s = sgn(K.off(iC)); K.place(K.idx(6, iC), K.off(K.idx(6, iC))); K.hideLine();
    K.car("VELOCE", 8, null); K.car("AXIOM", 17, null); K.car("NOVA", -9, null); K.car("KESTREL", -19, null);
    const p = K.ahead(0, 0, 0); K.cam(K.V(p.x - 40, p.y + 55, p.z - 40), K.ahead(4, null, 0), 40); K.anchor("you", K.ahead(0, null, 1.6));`),
  // seasons and time of day
  shot("se-dawn", "spa", `K.hideLine(); K.chase(); K.light({ sunCol: 0xFFB070, sun: 1.5, hemi: [0xF2C6A0, 0x4A4038, 0.55], fog: 0xE6C9A8, fogD: 0.0016, skyEl: 3, skyAz: 95, turb: 10, ray: 3.5 });`, { place: 300 }),
  shot("se-autumn", "silverstone", `K.hideLine(); K.chase(); const pal = [0xC8641E, 0xD9922B, 0xB8471C, 0xE0B040, 0x9C5A28].map((x) => new THREE.Color(x));
    K.scene.traverse((m) => { if (m.isInstancedMesh && m.material?.map && m.material.flatShading) { m.material = m.material.clone(); m.material.map = null; m.material.color.set(0xffffff); m.material.needsUpdate = true; for (let j = 0; j < m.count; j++) m.setColorAt(j, pal[(j * 7) % pal.length]); m.instanceColor.needsUpdate = true; } }); K.light({ sunCol: 0xFFE2B8, sun: 2.0, fog: 0xD8CBB8, fogD: 0.0006 });`, { place: 1500 }),
  shot("se-sunset", "yas-marina-circuit", `K.hideLine(); K.chase();`, { place: 1500 }),
];

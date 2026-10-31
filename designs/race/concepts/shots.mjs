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
  // ===== list 5 =====
  shot("l5-ladder", "silverstone", `
    K.hideLine(); K.hideCar();
    const rows = [[-3.2, "NOVA", 2009, 0.8], [0, "KESTREL", 2017, 0.9], [3.2, "RACELIMIT", 2026, 1]];
    for (const [o, t, era, sc] of rows) { const g = K.car(t, 10, o, { era }); g.scale.setScalar(sc); K.anchor("c" + era, K.ahead(10, o, 1.35 * sc)); }
    K.cam(K.ahead(19.5, -2.2, 1.6), K.ahead(9.5, 0, 0.35), 44);`, { place: 30 }),
  shot("l5-speedtrap", "monza", `
    const iC = C(1); K.placeBefore(iC, 300); K.hideLine(); K.chase();
    K.car("VORTEX", 9, K.c.lat + 0.4);
    const i = K.idx(19), w = half + 1.5;
    for (const sd of [-1, 1]) { const p = K.at(i, sd * w); K.box(K.V(p.x, p.y + 3, p.z), [0.3, 6, 0.3], 0x8C939E, [0, K.yaw(i), 0], { metal: 0.5 }); }
    { const p = K.at(i, 0, 6.1); K.box(p, [0.35, 0.5, w * 2 + 0.6], 0x2A2F3B, [0, K.yaw(i) + Math.PI / 2, 0]);
      K.text(K.at(K.idx(18.7), 0, 6.1), K.yaw(i) + Math.PI, 8, 1.1, (x, W, Hh) => { x.fillStyle = "#16181F"; x.fillRect(0, 0, W, Hh); x.fillStyle = "#FFB547"; x.font = "bold " + Math.round(Hh * 0.62) + "px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("SPEED TRAP · NORTHWIND", W / 2, Hh / 2); });
      K.anchor("trap", K.at(i, 0, 6.6)); }
    K.anchor("vortex", K.ahead(9, K.c.lat + 0.4, 1.3));`),
  shot("l5-media", "silverstone", `
    K.hideLine(); K.hideCar(); const q = K.pitAt(150, 0), y = q.yaw, f = K.V(Math.sin(y), 0, Math.cos(y)), l = K.V(Math.cos(y), 0, -Math.sin(y)), P = (a, b, h = 0) => q.p.clone().addScaledVector(f, a).addScaledVector(l, b).add(K.V(0, h, 0));
    K.text(P(3.1, 0, 1.45), y + Math.PI, 6.2, 2.9, (x, W, Hh) => { x.fillStyle = "#14171E"; x.fillRect(0, 0, W, Hh); const names = ["RACELIMIT", "NORTHWIND", "ARCLIGHT", "TIDELINE", "QUILLON", "BLUEFERN"], cols = ["#FFB547", "#7FC4FF", "#FF8A5A", "#6EE7D8", "#F2C230", "#9BE3A0"]; x.textAlign = "center"; x.textBaseline = "middle"; let k = 0; for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const n = (r * 4 + c + r) % 6; x.fillStyle = cols[n]; x.font = "bold " + Math.round(Hh * 0.06) + "px Arial, sans-serif"; x.fillText(names[n], (c + 0.5 + (r % 2) * 0.5 - 0.25) * W / 4, (r + 0.5) * Hh / 6); } }, { lit: true });
    const d = K.person(P(1.9, 0), y + Math.PI, { suit: 0xFFA51F, helmet: false, cap: 0x16171B });
    for (const [b, c, suit] of [[1.35, 0xE8002D, 0x2A2F3B], [-1.4, 0x16245C, 0x4A5060]]) { K.person(P(0.9, b), y + (b > 0 ? 0.9 : -0.9), { suit, helmet: false, cap: 0x1A1C22 });
      const hand = P(1.05, b * 0.8, 1.35), tip = P(1.6, b * 0.14, 1.62), mid = hand.clone().lerp(tip, 0.5), len = hand.distanceTo(tip);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, len, 6), K.std(0x2A2F3B)); st.position.copy(mid); st.quaternion.setFromUnitVectors(K.V(0, 1, 0), tip.clone().sub(hand).normalize()); K.scene.add(st);
      K.mesh(new THREE.SphereGeometry(0.05, 12, 8), K.std(0x1A1C22, { rough: 0.9 }), tip); K.mesh(new THREE.SphereGeometry(0.055, 12, 8), K.std(c), tip.clone().lerp(hand, 0.12)); }
    K.cam(P(-2.9, 0.1, 1.6), P(1.9, 0, 1.4), 44); K.anchor("driver", P(1.9, 0, 2.05));`),
  shot("l5-pack", "suzuka", `
    const iC = C(1); K.placeBefore(iC, 260); K.hideLine(); K.chase({ back: 8, up: 2.8 });
    [["AXIOM", 8, -1.6], ["VELOCE", 13, 1.7], ["NOVA", 19, -1.2], ["HALCYON", 26, 1.4]].forEach(([t, d, o]) => { K.car(t, d, K.c.lat + o); K.anchor(t, K.ahead(d, K.c.lat + o, 1.3)); });`),
  shot("l5-visor", "spa", WET + `
    const iC = C(5); K.placeBefore(iC, 480); K.hideLine(); wet(-5, 120); K.car("VELOCE", 22, null);`, { cam: "cockpit" }),
  shot("l5-bag", "monza", `
    const iC = C(1); K.placeBefore(iC, 400); K.hideLine(); await K.frames(2);
    const me = K.me, ck = me.userData.ck; me.updateMatrixWorld();
    const geo = new THREE.PlaneGeometry(0.42, 0.3, 10, 8), pa = geo.attributes.position; let r = 11; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let k = 0; k < pa.count; k++) pa.setZ(k, (rnd() - 0.5) * 0.07 + Math.sin(pa.getX(k) * 18) * 0.02); geo.computeVertexNormals();
    const bag = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xF2F2EE, roughness: 0.35, transparent: true, opacity: 0.88, side: THREE.DoubleSide }));
    bag.position.set(0.52, 0.56, ck + 0.34); bag.rotation.set(0.1, 0.15, 0.05); me.add(bag);
    K.camCar([2.2, 1.05, ck + 2.6], [0.45, 0.5, ck + 0.1], 34); K.anchor("bag", me.localToWorld(K.V(0.52, 0.62, ck + 0.34)));`),
  shot("l5-groundhog", "montreal", `
    const iC = C(2, 60); K.placeBefore(iC, 140); K.hideLine(); K.chase();
    const i = K.idx(8.5), o = K.c.lat + 2.0, p = K.at(i, o, 0.03), g = new THREE.Group(); g.position.copy(p); g.rotation.y = K.yaw(i) + Math.PI + 0.4; g.scale.setScalar(1.6); K.scene.add(g);
    const fur = K.std(0x7A5A3A, { rough: 0.95 }), dark = K.std(0x3A2A1C, { rough: 0.9 });
    K.mesh(new THREE.CapsuleGeometry(0.13, 0.16, 6, 12), fur, K.V(0, 0.22, 0), [-0.25, 0, 0], g);
    K.mesh(new THREE.SphereGeometry(0.1, 14, 10), fur, K.V(0, 0.46, 0.06), [0, 0, 0], g);
    for (const sx of [-1, 1]) { K.mesh(new THREE.SphereGeometry(0.03, 8, 6), dark, K.V(sx * 0.06, 0.54, 0.04), [0, 0, 0], g); K.mesh(new THREE.CapsuleGeometry(0.025, 0.08, 4, 6), fur, K.V(sx * 0.07, 0.32, 0.12), [1.1, 0, 0], g); K.mesh(new THREE.SphereGeometry(0.014, 6, 4), K.std(0x111111), K.V(sx * 0.035, 0.49, 0.15), [0, 0, 0], g); }
    K.mesh(new THREE.SphereGeometry(0.025, 8, 6), K.std(0x2A1C14), K.V(0, 0.45, 0.16), [0, 0, 0], g);
    K.anchor("hog", K.at(i, o, 1.2));
    { const j = K.idx(22), oo = half + 2.6; K.person(K.at(j, oo), face(j, oo), { suit: 0xFF7A1A, pose: "wave", flag: 0xF2C230, helmet: false }); K.panel(K.at(K.idx(25), oo), face(j, oo), 0xF2C230); K.anchor("marshal", K.at(j, oo, 2.6)); }`),
  shot("l5-stall", "silverstone", `
    K.hideLine(); K.place(K.c.idx, 2.4);
    [["VELOCE", 8, -2.4], ["AXIOM", 16, 2.4], ["NOVA", 24, -2.4], ["KESTREL", 32, 2.4], ["HALCYON", -8, -2.4]].forEach(([t, d, o]) => K.car(t, d, o));
    const i = K.idx(5.2), o = -2.4; K.person(K.at(i, o - 0.9), K.yaw(i) + Math.PI, { suit: 0xFF7A1A, pose: "wave", flag: 0xF2C230, helmet: false });
    K.person(K.at(K.idx(5.6), o + 1.1), K.yaw(i) + Math.PI, { suit: 0xFF7A1A, pose: "both", helmet: false });
    K.anchor("stalled", K.ahead(8, -2.4, 1.6)); K.chase({ back: 8.5, up: 3.2, ahead: 14 });`, { place: 30 }),
  shot("l5-weighin", "silverstone", `
    K.hideLine(); K.placePit(150, 0); await K.frames(2); const y = K.c.yaw, f = K.V(Math.sin(y), 0, Math.cos(y)), l = K.V(Math.cos(y), 0, -Math.sin(y)), base = K.V(K.c.x, K.c.y, K.c.z), P = (a, b, h = 0) => base.clone().addScaledVector(f, a).addScaledVector(l, b).add(K.V(0, h, 0));
    K.box(P(0, 0, 0.04), [2.4, 0.08, 6.2], 0x3A4150, [0, y, 0], { rough: 0.4, metal: 0.4 }); K.c.y += 0.08;
    K.box(P(0, 1.9, 0.6), [0.12, 1.2, 0.12], 0x2A2F3B, [0, y, 0]);
    K.text(P(0, 1.9, 1.45), y - Math.PI / 2, 1.7, 0.55, (x, W, Hh) => { x.fillStyle = "#05070A"; x.fillRect(0, 0, W, Hh); x.fillStyle = "#6EE7A8"; x.font = "bold " + Math.round(Hh * 0.34) + "px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("801.6 kg", W / 2, Hh * 0.56); });
    K.person(P(1.8, -1.6), y + 2.4, { suit: 0xE8EAF0, helmet: false, cap: 0x16245C }); K.person(P(-1.4, 1.8), y - 1.0, { suit: 0xE8EAF0, helmet: false, cap: 0x16245C });
    K.camCar([-3.3, 1.9, 4.2], [0.4, 0.35, -0.2], 46); K.anchor("scale", P(0, 1.9, 1.75)); K.anchor("plank", P(0, 0, 0.2));`),
  shot("l5-sim", "silverstone", `
    K.hideLine(); const g = K.group(); K.hideWorld([g]); K.scene.background = new THREE.Color(0x07080B); K.scene.fog = null;
    const y = K.c.yaw, f = K.V(Math.sin(y), 0, Math.cos(y)), l = K.V(Math.cos(y), 0, -Math.sin(y)), base = K.V(K.c.x, K.c.y, K.c.z), P = (a, b, h = 0) => base.clone().addScaledVector(f, a).addScaledVector(l, b).add(K.V(0, h, 0));
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), K.std(0x0D0F14, { rough: 0.6 })); fl.rotation.x = -Math.PI / 2; fl.position.copy(P(0, 0, 0.001)); g.add(fl);
    const pano = (x, W, Hh) => { const sk = x.createLinearGradient(0, 0, 0, Hh * 0.5); sk.addColorStop(0, "#7FA6D6"); sk.addColorStop(1, "#D7E3EE"); x.fillStyle = sk; x.fillRect(0, 0, W, Hh); x.fillStyle = "#3E8A3A"; x.fillRect(0, Hh * 0.46, W, Hh); const vx = W / 2, vy = Hh * 0.46;
      x.fillStyle = "#5A5F68"; x.beginPath(); x.moveTo(vx - 6, vy); x.lineTo(vx + 6, vy); x.lineTo(W * 0.78, Hh); x.lineTo(W * 0.22, Hh); x.fill();
      for (let k = 0; k < 14; k++) { const t0 = k / 14, t1 = (k + 1) / 14, e = (t) => t * t; x.fillStyle = k % 2 ? "#E8EAF0" : "#D8202A"; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(vx + s * (6 + (W * 0.28) * e(t0)), vy + (Hh - vy) * e(t0)); x.lineTo(vx + s * (6 + (W * 0.28) * e(t1)), vy + (Hh - vy) * e(t1)); x.lineTo(vx + s * (6 + (W * 0.31) * e(t1)), vy + (Hh - vy) * e(t1)); x.lineTo(vx + s * (6 + (W * 0.31) * e(t0)), vy + (Hh - vy) * e(t0)); x.fill(); } }
      x.fillStyle = "#2F6A2C"; for (let k = 0; k < 40; k++) { const tx = (k * 137) % W, th = 20 + (k * 53) % 40; x.beginPath(); x.moveTo(tx, vy); x.lineTo(tx + 14, vy - th); x.lineTo(tx + 28, vy); x.fill(); } };
    const N = 5, R = 5.2;
    for (let k = 0; k < N; k++) { const a = (k - (N - 1) / 2) * 0.42, pos = P(Math.cos(a) * R + 0.4, Math.sin(a) * R, 1.25); K.text(pos, y + Math.PI + a, 2.25, 1.9, (x, W, Hh) => { x.save(); x.translate(-(N - 1 - k) * W, 0); pano(x, W * N, Hh); x.restore(); }); }
    K.box(P(-1.2, -2.6, 0.45), [1.6, 0.9, 0.7], 0x1A1C22, [0, y, 0]); for (const b of [-0.5, 0.5]) { const m = K.box(P(-1.2, -2.6 + b * 0.8, 1.15), [0.7, 0.45, 0.04], 0x0A0C10, [0, y + Math.PI / 2 - 0.3, 0]); m.material.emissive = new THREE.Color(0x2A4A7A); m.material.emissiveIntensity = 0.8; }
    K.person(P(-1.9, -2.6), y + Math.PI / 2 + 0.2, { suit: 0x16171B, helmet: false, cap: 0xFFA51F });
    const lt = new THREE.PointLight(0xBFD4FF, 30, 12, 1.5); lt.position.copy(P(3, 0, 2.5)); g.add(lt);
    K.camCar([2.6, 2.7, -5.2], [0, 0.6, 3.5], 52);`, { place: 30 }),
  shot("l5-mexico", "mexico-city", `const iC = C(13, 40); K.placeBefore(iC, 120); K.hideLine(); K.chase();`),
  shot("l5-headlook", "spa", `const iC = C(1); K.placeBefore(iC, 45); K.hideLine(); const ck = K.me.userData.ck; K.camCar([0, 0.83, ck - 0.14], [-4.2, 0.32, ck + 12], 66);`, { cam: "cockpit" }),
  shot("l5-lockup", "zandvoort", `
    const iC = C(1); K.placeBefore(iC, 55); K.hideLine(); await K.frames(2); const me = K.me, E = me.userData.E, zf = me.userData.zf; me.updateMatrixWorld();
    const w = me.worldToLocal(K.wheel(me, "fl"));
    let r = 5; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280); for (let k = 0; k < 46; k++) { const t = rnd(), m = new THREE.Mesh(new THREE.SphereGeometry(0.1 + t * 0.5, 16, 12), new THREE.MeshStandardMaterial({ color: 0xE9EBEF, transparent: true, opacity: 0.2 - t * 0.14, roughness: 1, depthWrite: false })); m.position.set(w.x + 0.05 + t * 0.4 + (rnd() - 0.5) * 0.25, 0.1 + t * 0.5 + (rnd() - 0.5) * 0.15, w.z - 0.05 - t * 3.4 + (rnd() - 0.5) * 0.3); me.add(m); }
    K.camCar([3.2, 1.0, zf + 3.6], [0.6, 0.35, zf - 0.6], 42); K.anchor("fl", K.wheel(me, "fl"));`),
  // ===== list 6 =====
  shot("l6-safetycar", "silverstone", `
    const iC = C(15); K.placeBefore(iC, 330); K.hideLine(); K.hideCar();
    K.safetyCar(K.ahead(0, K.c.lat, 0.0), K.yaw(K.c.idx));
    [["AXIOM", -8.5], ["VELOCE", -16.5], ["RACELIMIT", -24.5], ["NOVA", -32.5], ["HALCYON", -40.5]].forEach(([t, d]) => K.car(t, d, K.c.lat));
    K.cam(K.ahead(9, K.c.lat - 4.2, 1.6), K.ahead(-13, K.c.lat, 0.6), 46); K.anchor("sc", K.ahead(0, K.c.lat, 1.8)); K.anchor("leader", K.ahead(-8.5, K.c.lat, 1.3));`),
  shot("l6-train", "monza", `
    const iC = C(1); K.placeBefore(iC, 330); K.hideLine(); K.chase({ fov: 54 });
    [["AXIOM", 9, -0.6], ["VELOCE", 17, 0.7], ["NOVA", 25, -0.3], ["HALCYON", 33, 0.5], ["ORBITA", 41, -0.4]].forEach(([t, d, o]) => { K.car(t, d, K.c.lat + o); K.anchor(t, K.ahead(d, K.c.lat + o, 1.3)); });`),
  shot("l6-replay3d", "singapore", `
    const iC = C(7); K.place(K.idx(-30, iC), K.off(K.idx(-30, iC))); K.hideLine(); const s = sgn(K.off(iC));
    [["AXIOM", 26], ["VELOCE", 16], ["NOVA", 7], ["KESTREL", -3], ["HALCYON", -14], ["VORTEX", -26]].forEach(([t, d]) => K.car(t, d, null));
    K.cam(K.at(K.idx(40), s * (half + 14), 18), K.ahead(4, null, 0.5), 40); K.anchor("lead", K.ahead(26, null, 1.4));`),
  shot("l6-concept", "silverstone", `
    K.hideLine(); const g = K.group(); const base = K.at(K.c.idx, 0, 0), yaw = K.c.yaw;
    K.hideWorld([g]); K.scene.background = new THREE.Color(0x0B0D12); K.scene.fog = null; K.me.visible = false;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), K.std(0x08090C, { rough: 0.92 })); fl.rotation.x = -Math.PI / 2; fl.position.copy(base).add(K.V(0, 0.002, 0)); g.add(fl);
    const spot = (p) => { const lt = new THREE.SpotLight(0xFFF2E0, 110, 16, 0.55, 0.6, 1.4); lt.position.set(p.x, p.y + 7, p.z); lt.target.position.copy(p); g.add(lt, lt.target); };
    const put = (k, team, era) => { const a = yaw + (k - 1) * 0.5, p = base.clone().add(K.V(Math.sin(a) * 12, 0, Math.cos(a) * 12)); K.box(K.V(p.x, p.y + 0.12, p.z), [3.4, 0.24, 6.4], 0x2A2F3B, [0, a + Math.PI / 2 + 0.25, 0], { rough: 0.4 }); spot(p); const c = K.car(team, 0, 0, { era, pos: K.V(p.x, p.y + 0.24, p.z), yaw: a + Math.PI / 2 + 0.25 + Math.PI }); c.updateMatrixWorld(); K.anchor("c" + k, K.V(p.x, p.y + 1.7, p.z)); return c; };
    { const c = put(0, "NOVA", 1998), E = c.userData.E, f = K.wheel(c, "fl"), fr = K.wheel(c, "fr"); for (const w of [f, fr]) { const lp = c.worldToLocal(w.clone()); lp.z += 0.95; const m = new THREE.Mesh(new THREE.CylinderGeometry(E.r * 0.72, E.r * 0.72, 0.24, 24), K.std(0x15161A, { rough: 0.9 })); m.position.copy(lp); m.position.y = E.r * 0.72; m.rotation.z = Math.PI / 2; c.add(m); } }
    { const c = put(1, "VORTEX", 1998), zr = c.userData.zr; const fan = new THREE.Group(); fan.position.set(0, 0.42, zr - 0.62); c.add(fan); fan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 32, 1, true), K.std(0x2A2F3B, { side: THREE.DoubleSide }))); fan.children[0].rotation.x = Math.PI / 2; for (let b = 0; b < 6; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.02), K.std(0x9AA1AA, { metal: 0.7 })); bl.rotation.z = b * Math.PI / 3; bl.position.set(Math.sin(b * Math.PI / 3) * 0.18, Math.cos(b * Math.PI / 3) * 0.18, 0); fan.add(bl); } }
    { const c = put(2, "AXIOM", 1998), zf = c.userData.zf, zr = c.userData.zr; for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, zf - zr - 1.4), K.std(0xF2C230)); m.position.set(sx * 0.62, 0.1, (zf + zr) / 2); c.add(m); } }
    K.cam(base.clone().add(K.V(Math.sin(yaw) * 2.5, 3.2, Math.cos(yaw) * 2.5)), base.clone().add(K.V(Math.sin(yaw) * 12, 0.4, Math.cos(yaw) * 12)), 60);`, { place: 30 }),
  shot("l6-cockpit", "monza", `const iC = C(1); K.placeBefore(iC, 360); K.hideLine(); K.car("VELOCE", 30, null);`, { cam: "cockpit" }),
  shot("l6-era09", "monza", `
    const iC = C(1); K.placeBefore(iC, 330); K.hideLine(); K.hideCar(); const c = K.car("AXIOM", 0, K.c.lat, { era: 2009 }); c.updateMatrixWorld();
    K.cam(c.localToWorld(K.V(-5.6, 2.1, -0.8)), c.localToWorld(K.V(0, 0.5, -0.4)), 42);
    K.anchor("cockpit", c.localToWorld(K.V(0, 0.95, c.userData.ck - 0.1))); K.anchor("rear", c.localToWorld(K.V(0, 0.95, c.userData.zr - 0.75)));`),
  shot("l6-grid", "silverstone", `
    K.hideLine(); K.place(K.c.idx, 2.4);
    [["AXIOM", 16, 2.4], ["VELOCE", 8, -2.4], ["NOVA", -8, -2.4], ["KESTREL", -16, 2.4], ["HALCYON", 24, -2.4]].forEach(([t, d, o]) => K.car(t, d, o));
    K.chase({ back: 6.5, up: 1.6, ahead: 12, fov: 58 });`, { place: 30 }),
  shot("l6-rewind", "spa", `
    const iC = C(1); const s = sgn(K.off(iC)); const j = K.idx(18, iC); K.place(j, -s * (half + 5), 2.2 * s); K.hideLine();
    K.smoke(K.at(j, -s * (half + 3.5), 0.4), 14, 4, 0xC9B79A, { size: 1.1, opacity: 0.22, seed: 4 });
    K.cam(K.at(K.idx(8, iC), -s * 1.0, 3.2), K.at(j, -s * (half + 5), 0.6), 44); K.anchor("car", K.at(j, -s * (half + 5), 1.2));`),
  shot("l6-bigscreen", "silverstone", `
    const iC = C(15); K.placeBefore(iC, 300); K.hideLine(); K.chase();
    const i = K.idx(24), o = half + 7, p = K.at(i, o, 0), yw = face(i, o);
    K.box(K.V(p.x, p.y + 3, p.z), [0.4, 6, 0.4], 0x2A2F3B, [0, yw, 0]);
    K.box(K.V(p.x, p.y + 7.6, p.z), [12.6, 7.4, 0.5], 0x15171C, [0, yw, 0]);
    const f = K.V(Math.sin(yw), 0, Math.cos(yw));
    K.text(K.V(p.x, p.y + 7.6, p.z).addScaledVector(f, 0.27), yw, 12, 6.75, (x, W, Hh) => {
      const sk = x.createLinearGradient(0, 0, 0, Hh * 0.45); sk.addColorStop(0, "#9DBBDD"); sk.addColorStop(1, "#DCE6EE"); x.fillStyle = sk; x.fillRect(0, 0, W, Hh); x.fillStyle = "#3E8A3A"; x.fillRect(0, Hh * 0.45, W, Hh);
      x.fillStyle = "#5A5F68"; x.beginPath(); x.moveTo(W * 0.46, Hh * 0.45); x.lineTo(W * 0.54, Hh * 0.45); x.lineTo(W * 0.95, Hh); x.lineTo(W * 0.05, Hh); x.fill();
      const car = (cx, cy, sc, col) => { x.fillStyle = "#16171B"; x.fillRect(cx - 70 * sc, cy - 10 * sc, 140 * sc, 40 * sc); x.fillStyle = col; x.fillRect(cx - 45 * sc, cy - 40 * sc, 90 * sc, 50 * sc); x.fillRect(cx - 80 * sc, cy - 55 * sc, 160 * sc, 18 * sc); x.fillStyle = "#0B0D12"; for (const s2 of [-1, 1]) x.fillRect(cx + s2 * 75 * sc - 22 * sc, cy - 20 * sc, 44 * sc, 55 * sc); };
      car(W * 0.5, Hh * 0.6, 1.2, "#C8102E"); car(W * 0.5, Hh * 0.86, 2.0, "#FFA51F");
      x.fillStyle = "rgba(11,13,18,.88)"; x.fillRect(W * 0.03, Hh * 0.05, W * 0.3, Hh * 0.2); x.fillStyle = "#FFB547"; x.font = "bold " + Math.round(Hh * 0.08) + "px Arial"; x.fillText("P3  KIRI", W * 0.05, Hh * 0.17); x.fillStyle = "#E8EAF0"; x.font = "bold " + Math.round(Hh * 0.05) + "px Arial"; x.fillText("+0.8 to BRD", W * 0.05, Hh * 0.23);
      x.fillStyle = "#E8002D"; x.fillRect(W * 0.85, Hh * 0.06, W * 0.12, Hh * 0.08); x.fillStyle = "#fff"; x.font = "bold " + Math.round(Hh * 0.055) + "px Arial"; x.fillText("● LIVE", W * 0.865, Hh * 0.12); }, { lit: false });
    K.anchor("screen", K.V(p.x, p.y + 11.5, p.z)); K.car("VELOCE", 12, K.c.lat - 0.6);`),
  shot("l6-donuts", "singapore", `
    K.hideLine(); const j = K.c.idx; K.place(j, 0, 1.9);
    const g = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.1, 48), new THREE.MeshBasicMaterial({ color: 0x0B0B0D, transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); g.rotation.x = -Math.PI / 2; const c0 = K.at(j, 0.8, 0.07); g.position.copy(c0); K.scene.add(g);
    const g2 = g.clone(); g2.scale.setScalar(0.82); K.scene.add(g2);
    K.smoke(K.at(j, 0, 0.3), 70, 7, 0xE9EBEF, { size: 1.0, opacity: 0.22, rise: 2.5, seed: 9 });
    for (const [d, o, h, col, r] of [[50, -40, 60, 0xFFB547, 16], [70, 30, 70, 0x5AA9FF, 14], [40, 10, 85, 0xFF5A6A, 12], [90, -10, 55, 0x2FD27A, 13]]) K.firework(K.at(K.idx(d), o, h), r, col, 90, d);
    K.cam(K.at(K.idx(-10), 3.5, 3.4), K.at(K.idx(8), 0, 3.5), 62); K.anchor("car", K.at(j, 0, 1.4));`),
  shot("l6-crowd", "zandvoort", `
    const iC = C(1); K.placeBefore(iC, 120); K.hideLine(); K.chase();
    for (const [d, o] of [[30, 1], [55, 1], [80, 1], [40, -1], [70, -1]]) { const i = K.idx(d), p = K.at(i, o * (half + 14), 3); K.smoke(p, 90, 7, 0xFF8A2A, { size: 1.3, opacity: 0.16, rise: 14, seed: d }); }
    for (const d of [20, 34, 48, 62]) { const i = K.idx(d), o = half + 6; K.flagpole(K.at(i, o), K.yaw(i) + 1.2, 0xFF7A1A, 0.6); }
    K.anchor("smoke", K.at(K.idx(55), half + 14, 8));`),
  shot("l6-easter", "spa", `
    const iC = C(1); const s = sgn(K.off(iC)); K.place(K.idx(-40, iC), 0); K.hideLine();
    const i = K.idx(8, iC), p = K.at(i, s * (half + 3.2), 0.9), g = new THREE.Group(); g.position.copy(p); g.rotation.y = face(i, s * (half + 3.2)); K.scene.add(g);
    const y = K.std(0xF2C230, { rough: 0.35 }); K.mesh(new THREE.SphereGeometry(0.45, 20, 14), y, K.V(0, 0, 0), [0, 0, 0], g).scale.set(1, 0.8, 1.25); K.mesh(new THREE.SphereGeometry(0.3, 20, 14), y, K.V(0, 0.5, 0.35), [0, 0, 0], g);
    K.mesh(new THREE.ConeGeometry(0.1, 0.3, 12), K.std(0xFF7A1A), K.V(0, 0.48, 0.7), [Math.PI / 2, 0, 0], g); for (const sx of [-1, 1]) K.mesh(new THREE.SphereGeometry(0.045, 8, 6), K.std(0x111111), K.V(sx * 0.13, 0.6, 0.6), [0, 0, 0], g);
    K.mesh(new THREE.BoxGeometry(0.42, 0.12, 0.2), K.std(0x16171B), K.V(0, 0.82, 0.32), [0, 0, 0], g);
    K.cam(K.at(K.idx(-2, iC), s * (half - 1.5), 1.6), K.at(i, s * (half + 3.2), 1.0), 34); K.anchor("duck", K.at(i, s * (half + 3.2), 1.9));`),
  shot("l6-classic98", "monza", `
    const iC = C(1); K.placeBefore(iC, 360); K.hideLine(); K.hideCar(); const c = K.car("VELOCE", 0, K.c.lat, { era: 1998 }); c.updateMatrixWorld(); K.car("AXIOM", 26, null, { era: 1998 });
    K.cam(c.localToWorld(K.V(0, 1.18, c.userData.ck - 0.6)), c.localToWorld(K.V(0, 0.8, c.userData.ck + 20)), 60);`),
  shot("l6-team", "spa", `const iC = C(5); K.placeBefore(iC, 480); K.hideLine(); K.chase(); K.car("RACELIMIT", 13, K.c.lat - 1.4); K.anchor("mate", K.ahead(13, K.c.lat - 1.4, 1.4));`),
  // ===== list 7 =====
  shot("l7-stack", "silverstone", `
    K.hideLine(); K.hideCar(); const q1 = K.pitAt(150, 0), q2 = K.pitAt(141, 0);
    const a = K.car("RACELIMIT", 0, 0, { pos: q1.p, yaw: q1.yaw }), b = K.car("RACELIMIT", 0, 0, { pos: q2.p, yaw: q2.yaw }); a.updateMatrixWorld();
    for (const w of ["fl", "fr", "rl", "rr"]) { const p = K.wheel(a, w), side = w[1] === "l" ? 1 : -1, qq = a.localToWorld(a.worldToLocal(p.clone()).add(K.V(side * 0.75, 0, 0))); qq.y = q1.p.y; K.person(qq, q1.yaw - side * Math.PI / 2, { suit: 0xFFA51F, helmet: 0x16171B, pose: "kneel", gun: true }); }
    K.person(a.localToWorld(K.V(0, 0, a.userData.zf + 1.9)).setY(q1.p.y), q1.yaw + Math.PI, { suit: 0xFFA51F, helmet: 0x16171B, pose: "kneel" });
    K.cam(a.localToWorld(K.V(-7.5, 6.5, -10)), a.localToWorld(K.V(0, 0.2, -4.6)), 48); K.anchor("a", a.localToWorld(K.V(0, 1.3, 0))); K.anchor("b", b.localToWorld(K.V(0, 1.3, 0)));`),
  shot("l7-yas", "yas-marina-circuit", `const iC = C(9, 40); K.placeBefore(iC, 160); K.hideLine(); K.chase();`, { place: 1500 }),
  shot("l7-restart", "silverstone", `
    const iC = C(15); K.placeBefore(iC, 330); K.hideLine();
    [["VELOCE", -6.8, 0.6], ["NOVA", -13.5, -0.5], ["AXIOM", -20, 0.7], ["KESTREL", -26.5, -0.4]].forEach(([t, d, o]) => K.car(t, d, K.c.lat + o));
    K.camCar([-3.2, 1.6, 8.5], [0, 0.6, -9], 48); K.anchor("you", K.ahead(0, K.c.lat, 1.3)); K.anchor("pack", K.ahead(-13.5, K.c.lat - 0.5, 1.3));`),
  shot("l7-hot", "lusail", `const iC = C(1); K.placeBefore(iC, 280); K.hideLine(); K.car("NOVA", 26, null);`, { cam: "cockpit" }),
  shot("l7-karts", "zandvoort", `
    const iC = C(1); K.placeBefore(iC, 60); K.hideLine(); K.hideCar();
    [[0, 0.2, 0xFFA51F, 0x16171B], [5, -1.6, 0x16B8A6, 0xF2F3F5], [9.5, 1.2, 0xC8102E, 0xF2F3F5], [14, -0.4, 0x5B2A86, 0xF2C230], [19, 1.0, 0x0F4D3A, 0xF2F3F5]].forEach(([d, o, c, h]) => K.kart(K.ahead(d, K.c.lat + o), K.yaw(K.idx(d)) + 0.05, c, h));
    K.cam(K.ahead(-4.5, K.c.lat + 1.2, 1.25), K.ahead(9, K.c.lat, 0.3), 50); K.anchor("you", K.ahead(0, K.c.lat + 0.2, 1.1));`),
  shot("l7-paddock", "silverstone", `
    K.hideLine(); const g = K.group(); K.hideWorld([g]); K.scene.background = new THREE.Color(0xB9CBDD); K.me.visible = false;
    const y = K.c.yaw, f = K.V(Math.sin(y), 0, Math.cos(y)), l = K.V(Math.cos(y), 0, -Math.sin(y)), base = K.V(K.c.x, K.c.y, K.c.z), P = (a, b, h = 0) => base.clone().addScaledVector(f, a).addScaledVector(l, b).add(K.V(0, h, 0));
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), K.std(0x3E434B, { rough: 0.95 })); fl.rotation.x = -Math.PI / 2; fl.position.copy(P(0, 0, 0.001)); g.add(fl);
    for (const sd of [-1, 1]) { K.box(P(30, sd * 5.6, 0.01), [0.18, 0.02, 80], 0xF2C230, [0, y, 0]); K.box(P(30, sd * 6.1, 0.06), [0.8, 0.12, 80], 0x8A9099, [0, y, 0]); }
    for (let a = 2; a < 60; a += 7) for (const sd of [-1, 1]) { const q = P(a + (sd > 0 ? 3 : 0), sd * 5.0); K.mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.55, 12), K.std(0x2A2F3B), K.V(q.x, q.y + 0.27, q.z)); K.mesh(new THREE.SphereGeometry(0.45, 12, 8), K.std(0x3F7A3A, { rough: 0.9 }), K.V(q.x, q.y + 0.85, q.z)); }
    const teams = [["AXIOM", "#16245C", "#F2C230"], ["VELOCE", "#C8102E", "#F2F2F2"], ["NOVA", "#16B8A6", "#0E0F12"], ["RACELIMIT", "#FFA51F", "#16171B"], ["KESTREL", "#0F4D3A", "#9BE33A"], ["HALCYON", "#F2F3F5", "#121316"]];
    teams.forEach(([n, c1, c2], k) => { const side = k % 2 ? -1 : 1, a = 8 + Math.floor(k / 2) * 17, p = P(a, side * 9.5, 0); const b = K.box(K.V(p.x, p.y + 3.5, p.z), [15, 7, 6], new THREE.Color(c1).getHex(), [0, y + Math.PI / 2, 0], { rough: 0.35, metal: 0.2 });
      K.box(K.V(p.x, p.y + 4.8, p.z), [15.1, 0.5, 6.1], new THREE.Color(c2).getHex(), [0, y + Math.PI / 2, 0]); K.box(K.V(p.x, p.y + 1.6, p.z).addScaledVector(l, -side * 3.02), [13, 2.6, 0.06], 0x10141C, [0, y + Math.PI / 2, 0], { rough: 0.1, metal: 0.6 });
      K.text(K.V(p.x, p.y + 6.0, p.z).addScaledVector(l, -side * 3.06), y + (side > 0 ? -Math.PI / 2 : Math.PI / 2), 8, 1.0, (x, W, Hh) => { x.fillStyle = c1; x.fillRect(0, 0, W, Hh); x.fillStyle = c2; x.font = "bold " + Math.round(Hh * 0.7) + "px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(n, W / 2, Hh / 2); }, { lit: true });
      K.box(K.V(p.x, p.y + 3.4, p.z).addScaledVector(l, -side * 3.03), [13, 0.9, 0.05], 0x1C2A3A, [0, y + Math.PI / 2, 0], { rough: 0.05, metal: 0.7 });
      const t = P(a - 3.5, side * 5.9); K.umbrella(t, new THREE.Color(c1).getHex()); K.mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16), K.std(0xE8EAF0), K.V(t.x, t.y + 0.75, t.z)); K.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6), K.std(0x2A2F3B), K.V(t.x, t.y + 0.37, t.z));
      K.flagpole(P(a + 6.8, side * 6.2), y + (side > 0 ? 0 : Math.PI), new THREE.Color(c1).getHex(), 0.4); });
    for (const [a, b, c, cap] of [[6, 1.5, 0xFFA51F, 0x16171B], [9, -2.2, 0x16245C, 0xF2C230], [14, 0.6, 0xC8102E, 0xF2F2F2], [20, -1, 0x2A2F3B, 0x2A2F3B], [24, 2.4, 0x16B8A6, 0x0E0F12], [11, 3.2, 0xE8EAF0, 0x2A2F3B]]) K.person(P(a, b), y + (b > 0 ? 2.6 : 3.6), { suit: c, helmet: false, cap });
    const sun = new THREE.DirectionalLight(0xFFF2E0, 2.2); sun.position.copy(P(-20, 30, 40)); sun.target.position.copy(P(10, 0)); g.add(sun, sun.target); g.add(new THREE.HemisphereLight(0xC8DAF0, 0x55604E, 0.8));
    K.cam(P(-6, 0.4, 1.75), P(28, 0, 2.4), 54);`, { place: 30 }),
  shot("l7-flypast", "silverstone", `
    K.hideLine(); K.place(K.c.idx, 2.4);
    [["AXIOM", 8, -2.4], ["VELOCE", 16, 2.4], ["NOVA", 24, -2.4], ["KESTREL", 32, 2.4], ["HALCYON", -8, -2.4]].forEach(([t, d, o]) => K.car(t, d, o));
    const y = K.yaw(K.c.idx) + 0.5; [[0, 0, 0xFFA51F], [-9, -6, 0xE8EAF0], [9, -6, 0x5AA9FF], [-18, -12, 0xFFA51F], [18, -12, 0xE8EAF0]].forEach(([x, z, c]) => { const p = K.ahead(70 + z, x, 42); K.jet(p, y, 0xE8EAF0, c, 50); });
    K.cam(K.ahead(-9, -4.5, 1.7), K.ahead(50, 0, 24), 66); K.anchor("jets", K.ahead(70, 0, 44));`, { place: 30 }),
  shot("l7-crane", "monte-carlo", `
    const iC = C(1, 40); const s = sgn(K.off(iC)); K.hideLine(); K.hideCar(); K.place(K.idx(-50, iC), 0);
    const j = K.idx(-5, iC), o = s * (half + 1.6), cr = K.crane(K.at(j, o + s * 5.5, 0), face(j, o + s * 5.5) + Math.PI, 5, 6);
    const tip = cr.tip(), car = K.car("VORTEX", 0, 0, { pos: K.V(tip.x, tip.y - 4.2, tip.z), yaw: K.yaw(j) + 0.6 }); car.rotation.z = 0.08; car.updateMatrixWorld();
    for (const w of ["fl", "fr", "rl", "rr"]) K.line3(tip, K.wheel(car, w), 0x2A2F3B, 0.015);
    for (const [d, oo] of [[3, o - s * 1.2], [6, o - s * 2.5]]) { const i = K.idx(d, j); K.person(K.at(i, oo), K.yaw(i) + 1.2, { suit: 0xFF7A1A, helmet: false, cap: 0xFF7A1A }); }
    K.cam(K.at(K.idx(-24, iC), -s * 1.5, 2.2), K.at(j, o, 2.6), 54); K.anchor("car", K.V(tip.x, tip.y - 3.4, tip.z)); K.anchor("crane", tip);`),
  shot("l7-ghost", "spa", `const iC = C(5); K.placeBefore(iC, 480); K.hideLine(); K.chase(); K.car("RACELIMIT", 8, K.c.lat + 1.6, { ghost: true }); K.anchor("ghost", K.ahead(8, K.c.lat + 1.6, 1.4));`),
  shot("l7-swap", "silverstone", `
    K.hideLine(); K.placePit(150, 0); await K.frames(2); const me = K.me; me.updateMatrixWorld();
    const p1 = me.localToWorld(K.V(1.1, 0, me.userData.ck - 0.1)); p1.y = K.c.y; K.person(p1, K.c.yaw - Math.PI / 2, { suit: 0xFFA51F, helmet: 0xFFA51F, pose: "wave" });
    const p2 = me.localToWorld(K.V(1.9, 0, me.userData.ck + 0.9)); p2.y = K.c.y; K.person(p2, K.c.yaw - Math.PI / 2 - 0.4, { suit: 0x16245C, helmet: 0x16245C });
    for (const w of ["fl", "fr", "rl", "rr"]) { const p = K.wheel(me, w), side = w[1] === "l" ? 1 : -1; if (side > 0 && w[0] === "f") continue; const qq = me.localToWorld(me.worldToLocal(p.clone()).add(K.V(side * 0.75, 0, 0))); qq.y = K.c.y; K.person(qq, K.c.yaw - side * Math.PI / 2, { suit: 0xFFA51F, helmet: 0x16171B, pose: "kneel", gun: true }); }
    K.camCar([4.6, 1.9, 4.4], [0.6, 0.6, -0.4], 44); K.anchor("out", p1.clone().add(K.V(0, 2.0, 0))); K.anchor("in", p2.clone().add(K.V(0, 2.0, 0)));`),
  // ===== list 8 =====
  shot("l8-oil", "spa", `
    const iC = C(5); K.placeBefore(iC, 480); K.hideLine(); K.chase();
    K.patch(10, K.c.lat - 0.5, 3.4, 8, 0x0E0E12, { opacity: 0.82, order: 5, round: true }); K.patch(17, K.c.lat + 0.7, 2.6, 6, 0x0E0E12, { opacity: 0.78, order: 5, round: true }); K.patch(12.5, K.c.lat + 0.1, 1.2, 4.2, 0x0E0E12, { opacity: 0.7, order: 5, round: true, rot: 0.25 }); K.patch(11, K.c.lat - 0.2, 1.6, 3.5, 0x4A3A78, { opacity: 0.3, order: 6, round: true, y: 0.07 }); K.patch(16.5, K.c.lat + 0.9, 0.9, 2.2, 0x2A5A6A, { opacity: 0.3, order: 6, round: true, y: 0.07 });
    K.anchor("oil", K.ahead(10, K.c.lat - 0.5, 0.1));
    const i = K.idx(16), oo = half + 2.4; K.person(K.at(i, oo), face(i, oo), { suit: 0xFF7A1A, helmet: false, pose: "wave", flagDraw: (x, W, Hh) => { for (let k = 0; k < 10; k++) { x.fillStyle = k % 2 ? "#E8002D" : "#F2C230"; x.fillRect(k * W / 10, 0, W / 10 + 1, Hh); } } });
    K.anchor("flag", K.at(i, oo, 2.9));
    { const j = K.idx(26), o2 = -(half + 1.5); const c = K.car("KESTREL", 26, o2); K.smoke(K.at(j, o2, 1.0), 26, 3, 0xD8DADF, { size: 0.9, opacity: 0.25, rise: 6, seed: 5 }); K.anchor("blown", K.at(j, o2, 1.6)); }`),
  shot("l8-storm", "silverstone", `
    K.hideLine(); K.placePit(150, 0); await K.frames(2);
    K.light({ sunCol: 0x8A96A8, sun: 0.45, hemi: [0x4A5466, 0x22262E, 0.55], fog: 0x3A4250, fogD: 0.004, skyEl: 8, turb: 20, ray: 0.3 });
    K.camCar([2.4, 1.5, -6.5], [0, 0.6, 6], 56);`),
  shot("l8-impede", "monza", `
    const iC = C(1); K.placeBefore(iC, 380); K.hideLine(); K.car("VELOCE", -9.5, K.c.lat - 0.2);
    K.camCar([1.4, 3.4, -21], [0, 0.4, 2], 46); K.anchor("you", K.ahead(0, K.c.lat, 1.3)); K.anchor("fast", K.ahead(-9.5, K.c.lat - 0.2, 1.3));`),
  shot("l8-multi", "spa", `
    const iC = C(5); K.placeBefore(iC, 480); K.hideLine(); K.chase();
    [["VELOCE", 10, -1.4, 1998], ["AXIOM", 18, 1.5, 2009], ["NOVA", 27, -0.6, 2017]].forEach(([t, d, o, era]) => { K.car(t, d, K.c.lat + o, { era }); K.anchor("e" + era, K.ahead(d, K.c.lat + o, 1.3)); });`),
  shot("l8-pitboard", "silverstone", `
    K.hideLine(); K.hideCar(); const P0 = K.tr.pitRoad, mid = Math.floor(P0.N / 2); let best = 0, bd = 1e9; for (let i = 0; i < K.tr.N; i++) { const d = (K.tr.X[i] - P0.X[mid]) ** 2 + (K.tr.Z[i] - P0.Z[mid]) ** 2; if (d < bd) { bd = d; best = i; } }
    const ps = sgn((P0.X[mid] - K.tr.X[best]) * K.tr.LX[best] + (P0.Z[mid] - K.tr.Z[best]) * K.tr.LZ[best]);
    const j = K.idx(-60, best); K.place(j, K.off(j)); const c = K.car("VELOCE", 0, K.c.lat, { era: 1998 });
    c.updateMatrixWorld(); const camP = c.localToWorld(K.V(0, 1.18, c.userData.ck - 0.6));
    const i = K.idx(11), oo = ps * (half + 1.2), p = K.at(i, oo), fy = Math.atan2(camP.x - p.x, camP.z - p.z); K.person(p, fy, { suit: 0xC8102E, helmet: false, cap: 0xF2F2F2, pose: "both" });
    K.text(K.at(i, oo, 2.0).add(K.V(Math.sin(fy) * 0.45, 0, Math.cos(fy) * 0.45)), fy, 1.4, 1.6, (x, W, Hh) => { x.fillStyle = "#16171B"; x.fillRect(0, 0, W, Hh); x.fillStyle = "#F2F3F5"; x.font = "bold " + Math.round(Hh * 0.2) + "px Arial"; x.textAlign = "center"; x.fillText("P3", W / 2, Hh * 0.27); x.fillStyle = "#FFB547"; x.fillText("+2.4", W / 2, Hh * 0.55); x.fillStyle = "#F2F3F5"; x.fillText("L23", W / 2, Hh * 0.85); }, { lit: true });
    K.cam(camP, K.at(i, oo * 0.8, 1.7), 34); K.anchor("board", K.at(i, oo, 3.0));`),
  shot("l8-classic", "monza", `
    const iC = C(1); K.placeBefore(iC, 360); K.hideLine(); K.hideCar(); const c = K.car("VELOCE", 0, K.c.lat, { era: 1998 }); c.updateMatrixWorld();
    K.cam(c.localToWorld(K.V(-2.6, 1.15, 2.4)), c.localToWorld(K.V(0, 0.55, 0.1)), 40);`),
  shot("l8-testing", "sakhir", `
    const iC = C(1); K.placeBefore(iC, 260); K.hideLine(); K.hideCar();
    const c = K.car("RACELIMIT", 0, K.c.lat, { livery: { body: "#1A1C22", accent: "#F2F3F5", stripe: "#8C939E", style: "chevron" } }); c.updateMatrixWorld();
    K.car("AXIOM", 34, null, { livery: { body: "#2A2F3B", accent: "#C3C9D4", stripe: "#16171B", style: "split" } });
    K.cam(c.localToWorld(K.V(-3.4, 1.3, 3.0)), c.localToWorld(K.V(0, 0.5, 0)), 42);`),
  shot("l8-crew", "silverstone", `
    K.hideLine(); K.placePit(150, 0); await K.frames(2); const me = K.me; me.updateMatrixWorld();
    for (const w of ["fl", "fr", "rl", "rr"]) { const p = K.wheel(me, w), side = w[1] === "l" ? 1 : -1; for (const dz of [0, -0.7]) { const qq = me.localToWorld(me.worldToLocal(p.clone()).add(K.V(side * (0.75 + Math.abs(dz) * 0.6), 0, dz))); qq.y = K.c.y; K.person(qq, K.c.yaw - side * Math.PI / 2, { suit: 0xFFA51F, helmet: 0x16171B, pose: dz ? undefined : "kneel", gun: !dz }); } }
    K.person(me.localToWorld(K.V(0, 0, me.userData.zf + 1.9)).setY(K.c.y), K.c.yaw + Math.PI, { suit: 0xFFA51F, helmet: 0x16171B, pose: "kneel" });
    K.person(me.localToWorld(K.V(0, 0, me.userData.zr - 1.3)).setY(K.c.y), K.c.yaw, { suit: 0xFFA51F, helmet: 0x16171B, pose: "kneel" });
    K.camCar([0.01, 9.5, 0.6], [0, 0, 0.2], 46);`),
  shot("l8-driver", "spa", `
    const iC = C(1); K.placeBefore(iC, 40); K.hideLine(); await K.frames(2); const sw = window.__sw; if (sw) sw.rotation.z += 0.55;
    const ck = K.me.userData.ck; K.camCar([0.95, 1.05, ck + 1.0], [0, 0.72, ck - 0.25], 40); K.anchor("helmet", K.me.localToWorld(K.V(0, 0.95, ck - 0.25))); K.anchor("wheel", K.me.localToWorld(K.V(0, 0.62, ck + 0.25)));`),
  shot("l8-halloween", "singapore", `
    const iC = C(7); K.placeBefore(iC, 140); K.hideLine(); K.chase(); K.light({ sunCol: 0xFFB070, sun: 1.0, hemi: [0xC07040, 0x2A2C33, 0.6], fog: 0x2A1608, fogD: 0.0012 });
    for (let k = 0; k < 14; k++) { const d = 8 + k * 6, sd = k % 2 ? 1 : -1, i = K.idx(d); K.pumpkin(K.at(i, sd * (half + 0.9), 0), 1.4); }`),
  shot("l8-festive", "silverstone", `
    const iC = C(15); K.placeBefore(iC, 330); K.hideLine(); K.hideCar(); K.light({ sunCol: 0xFFC48A, sun: 1.3, fog: 0xD8DDE6, fogD: 0.0009, skyEl: 6, skyAz: 220 });
    const c = K.car("RACELIMIT", 0, K.c.lat, { livery: { body: "#B3121F", accent: "#F2F3F5", stripe: "#1F7A3A", style: "stripe" } }); c.updateMatrixWorld();
    K.cam(c.localToWorld(K.V(-3, 1.2, 3.2)), c.localToWorld(K.V(0, 0.5, 0)), 42);`),
  shot("l8-cruise", "spa", `
    const iC = C(3); const s = sgn(K.off(iC)); const j = K.idx(-30, iC); K.place(j, -s * (half + 3.5), 0.4 * s); K.hideLine();
    K.cam(K.at(K.idx(-46, iC), -s * (half - 1), 2.2), K.at(j, -s * (half + 3.5), 1.5), 46); K.anchor("car", K.at(j, -s * (half + 3.5), 1.3));`),
  shot("l8-parade", "silverstone", `
    K.hideLine(); K.hideCar(); const j = K.idx(40); const t = K.truck(K.at(j, 0.6, 0), K.yaw(j), { color: 0xF2F3F5 }); t.updateMatrixWorld();
    { const q = t.localToWorld(K.V(0.2, 1.35, -4.1)); K.person(q, K.yaw(j), { suit: 0x2A2F3B, helmet: false, cap: 0x16171B }); const cm = t.localToWorld(K.V(0.45, 3.0, -3.95)); K.box(cm, [0.26, 0.3, 0.6], 0x16171B, [0, K.yaw(j), 0], { rough: 0.4 }); }
    const drivers = [[0xFFA51F, 0x16171B], [0x16245C, 0xF2C230], [0xC8102E, 0xF2F2F2], [0x16B8A6, 0x0E0F12], [0x0F4D3A, 0x9BE33A], [0xF2F3F5, 0x121316], [0xFF7A1A, 0x1C3F8C], [0x5B2A86, 0xC9CED6]];
    drivers.forEach(([suit, cap], k) => { const x = (k % 2 ? -0.6 : 0.6), z = 1.2 - Math.floor(k / 2) * 1.35; const p = t.localToWorld(K.V(x, 1.35, z)); K.person(p, K.yaw(j) + (x > 0 ? -1.1 : 1.1), { suit, helmet: false, cap, pose: k % 3 ? "wave" : "both" }); });
    K.cam(K.at(K.idx(53), half - 1.2, 1.5), t.localToWorld(K.V(0, 2.1, -0.2)), 40); K.anchor("truck", t.localToWorld(K.V(0, 3.8, -1)));`, { place: 30 }),
];
SHOTS.push(...(await import("./shots9.mjs?" + Date.now())).MORE);

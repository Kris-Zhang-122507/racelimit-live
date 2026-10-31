// Shots for concept lists 9–11 (same helpers as shots.mjs). Setup code runs in the game page with K (kit.js).
// No "${" inside the setup strings: they are template literals evaluated here.
const H = `const sgn = (x) => (x >= 0 ? 1 : -1);
  const face = (i, o) => { const s = -sgn(o); return Math.atan2(K.tr.LX[i] * s, K.tr.LZ[i] * s); };
  const C = (n, before = 30) => K.corner(n) ?? K.nextCorner(before).i;
  const half = K.tr.half;
  const look = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);`;
const shot = (name, track, setup, o = {}) => ({ name, track, place: o.place ?? 300, speed: 0, cam: o.cam ?? "chase", setup: H + setup });

// a made-up room built on the spot (the circuit hidden): P(a, b, h) = a metres forward, b to the left, h up
const ROOM = `
  K.hideLine(); const g = K.group(); K.hideWorld([g]); K.me.visible = false; K.scene.fog = null;
  { const sk = K.findSky(); if (sk) sk.visible = false; }
  const y = K.c.yaw, f = K.V(Math.sin(y), 0, Math.cos(y)), l = K.V(Math.cos(y), 0, -Math.sin(y)), base = K.V(K.c.x, K.c.y, K.c.z);
  const P = (a, b, h = 0) => base.clone().addScaledVector(f, a).addScaledVector(l, b).add(K.V(0, h, 0));
  const floor = (col, rough = 0.6, metal = 0) => { const fl = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), K.std(col, { rough, metal })); fl.rotation.x = -Math.PI / 2; fl.position.copy(P(0, 0, 0.002)); fl.receiveShadow = true; g.add(fl); return fl; };
  const wallX = (a, b, w, h, col, o = {}) => K.box(P(a, b, h / 2 + (o.y ?? 0)), [w, h, o.d ?? 0.2], col, [0, y, 0], o);
  const wallZ = (a, b, w, h, col, o = {}) => K.box(P(a, b, h / 2 + (o.y ?? 0)), [o.d ?? 0.2, h, w], col, [0, y, 0], o);
  const lamp = (a, b, h, int = 40, col = 0xFFF2E0, dist = 30) => { const lt = new THREE.PointLight(col, int, dist, 1.4); lt.position.copy(P(a, b, h)); g.add(lt); return lt; };
  const spot = (from, to, int = 120, col = 0xFFF2E0, ang = 0.5) => { const lt = new THREE.SpotLight(col, int, 60, ang, 0.6, 1.2); lt.position.copy(from); lt.target.position.copy(to); g.add(lt, lt.target); return lt; };
  const sign = (a, b, h, w, hh, yawAdd, draw, lit = false) => K.text(P(a, b, h), y + yawAdd, w, hh, draw, { lit });
  const carAt = (team, a, b, yawAdd = 0, opt = {}) => { const cc = K.car(team, 0, 0, { ...opt, pos: P(a, b, opt.h ?? 0), yaw: y + yawAdd }); cc.updateMatrixWorld(); return cc; };
  const who = (a, b, yawAdd, o = {}) => K.person(P(a, b, o.h ?? 0), y + yawAdd, o);
  const T = (txt, fg, bgc, font = 0.6) => (x, W, Hh) => { x.fillStyle = bgc; x.fillRect(0, 0, W, Hh); x.fillStyle = fg; x.font = "bold " + Math.round(Hh * font) + "px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, W / 2, Hh / 2); };
  const stands = (cc) => { for (const w of ["fl", "fr", "rl", "rr"]) { const q = K.wheel(cc, w); K.box(K.V(q.x, base.y + 0.12, q.z), [0.3, 0.24, 0.3], 0x2A2F3B, [0, y, 0], { metal: 0.6 }); } };
  const tyres = (a, b, n, col = 0x16171B) => { for (let k = 0; k < n; k++) K.mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.34, 24), K.std(col, { rough: 0.9 }), P(a, b, 0.17 + k * 0.35)); };`;

// a team garage: back wall at a = -8, open to the pit lane at a = +5, the car at (0, 0) facing out
const GARAGE = `
  floor(0x3A3F48, 0.3, 0.15); K.scene.background = new THREE.Color(0x9FB3C8);
  wallX(-8, 0, 9.2, 4.6, 0x1C2230); for (const s of [-1, 1]) wallZ(-1.5, s * 4.6, 13, 4.6, 0x22283A);
  K.box(P(-1.5, 0, 4.7), [9.4, 0.2, 13.2], 0x15181F, [0, y, 0]);
  wallX(-7.85, 0, 9, 0.5, 0xFFA51F, { y: 2.6, d: 0.05 }); for (const s of [-1, 1]) wallZ(-1.5, s * 4.45, 12.6, 0.5, 0xFFA51F, { y: 2.6, d: 0.05 });
  sign(-7.84, 0, 3.6, 4.2, 0.6, 0, T("RACELIMIT", "#FFA51F", "#1C2230", 0.7));
  K.box(P(5, 0, 4.3), [9.4, 0.8, 0.3], 0x16171B, [0, y, 0]);
  tyres(-6.8, 3.6, 4); tyres(-6.8, 2.8, 4); tyres(-6.8, -3.6, 3, 0x1A1C22);
  K.box(P(-4.5, -4.0, 0.5), [0.8, 1.0, 1.6], 0xC8102E, [0, y, 0], { rough: 0.4 }); K.box(P(-4.5, 4.0, 0.5), [0.8, 1.0, 1.6], 0x2A2F3B, [0, y, 0], { rough: 0.4 });
  lamp(-2, 0, 4.2, 70); lamp(2.5, 0, 4.2, 50); lamp(-6, 0, 4.2, 40);`;

const WET = `
  const wet = (d0, d1) => {
    K.ribbon(d0, d1, (i) => (K.off(i) + 1.0 + half) / 2, (i) => Math.max(0.1, half - (K.off(i) + 1.0)), 0x1A1F27, { lit: true, rough: 0.05, metal: 0.6, opacity: 0.62 });
    K.ribbon(d0, d1, (i) => (K.off(i) - 1.0 - half) / 2, (i) => Math.max(0.1, half + (K.off(i) - 1.0)), 0x1A1F27, { lit: true, rough: 0.05, metal: 0.6, opacity: 0.62 });
    K.ribbon(d0, d1, (i) => K.off(i), 2.0, 0x2A2E35, { lit: true, rough: 0.35, metal: 0.2, opacity: 0.25 });
  };`;

const TEAMS = `const TM = ["AXIOM", "VELOCE", "NOVA", "KESTREL", "HALCYON", "VORTEX", "ORBITA", "MERIDIAN", "BRAVO"];`;

export const MORE = [
  // ===== list 9 =====
  shot("l9-reverse", "silverstone", TEAMS + `
    K.hideLine(); K.place(K.c.idx, 2.4);
    for (let k = 0; k < 11; k++) K.car(TM[k % TM.length], 8 * (k + 1), k % 2 ? 2.4 : -2.4);
    K.chase({ back: 8, up: 3.6, ahead: 40, ly: 0.2, fov: 52 });
    K.anchor("you", K.ahead(0, 2.4, 1.4)); K.anchor("pole", K.ahead(88, -2.4, 1.3));`, { place: 30 }),
  shot("l9-puncture", "spa", `
    const iC = C(5); K.placeBefore(iC, 420); K.hideLine(); K.hideCar();
    const c = K.car("RACELIMIT", 0, K.c.lat); c.rotation.z = -0.07; c.position.y -= 0.06; c.updateMatrixWorld();
    const E = c.userData.E, sx = E.tr + E.wr / 2 - 0.05, zr = c.userData.zr;
    const sp = K.sparks(c, 110); sp.position.x = sx - 0.05;
    for (let k = 0; k < 12; k++) K.debris(-2.2 - k * 0.7, K.c.lat + 0.9 + Math.sin(k * 1.7) * 0.5, 0.1 + (k % 3) * 0.05, 0x111113, k + 3);
    for (let k = 0; k < 3; k++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.7 - k * 0.15), K.std(0x111113, { rough: 0.9 })); st.position.set(sx + 0.12, E.r * (0.4 + k * 0.3), zr - 0.45); st.rotation.set(0.5 + k * 0.4, 0.4, 0.3 * k); c.add(st); }
    K.cam(c.localToWorld(K.V(3.2, 2.5, -10.5)), c.localToWorld(K.V(0.3, 0.3, -1.5)), 44);
    K.anchor("flat", K.wheel(c, "rl")); K.anchor("bits", K.ahead(-5.5, K.c.lat + 0.9, 0.1));`),
  shot("l9-flowvis", "silverstone", `
    const iC = C(15); K.placeBefore(iC, 260); K.hideLine(); K.hideCar();
    const c = K.car("RACELIMIT", 0, K.c.lat); c.updateMatrixWorld(); const zf = c.userData.zf;
    const rk = new THREE.Group(); rk.position.set(0, 0, zf - 0.78); c.add(rk);
    const m = K.std(0x2A2F3B, { metal: 0.7, rough: 0.35 }), tp = K.std(0xC3C9D4, { metal: 0.8, rough: 0.25 });
    for (const s of [-1, 1]) { for (const px of [0.44, 1.08]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.03), m); post.position.set(s * px, 0.42, 0); rk.add(post); }
      for (let r = 0; r < 4; r++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.022, 0.028), m); bar.position.set(s * 0.76, 0.16 + r * 0.15, 0); rk.add(bar);
        for (let k = 0; k < 8; k++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.15, 6), tp); t.rotation.x = Math.PI / 2; t.position.set(s * (0.47 + k * 0.083), 0.16 + r * 0.15, 0.08); rk.add(t); } } }
    K.cam(c.localToWorld(K.V(3.4, 1.05, zf + 1.4)), c.localToWorld(K.V(0.5, 0.42, zf - 1.0)), 40);
    K.anchor("rake", c.localToWorld(K.V(0.76, 0.66, zf - 0.78)));`),
  shot("l9-banners", "zandvoort", `
    const iC = C(1); K.placeBefore(iC, 110); K.hideLine(); K.chase({ fov: 62, back: 6, up: 1.8 });
    const B = [["GO KIRI! #27", "#FFFFFF", "#E8701A"], ["KIRI ARMY", "#FFE14D", "#16171B"], ["27 FOR THE WIN", "#FFFFFF", "#1C3F8C"], ["WE LOVE KIRI", "#F2F3F5", "#C8102E"], ["FLY KIRI FLY", "#FFA51F", "#16171B"], ["#27 #27 #27", "#16171B", "#F2C230"]];
    B.forEach(([t, bgc, fg], k) => { const side = k % 2 ? -1 : 1, d = 9 + k * 6, i = K.idx(d), o = side * (half + 3.0), p = K.at(i, o, 1.9);
      K.text(p, face(i, o) + (k % 3 - 1) * 0.1 - side * 0.35, 5.2, 1.6, (x, W, Hh) => { x.fillStyle = bgc; x.fillRect(0, 0, W, Hh); x.strokeStyle = fg; x.lineWidth = Hh * 0.05; x.strokeRect(Hh * 0.07, Hh * 0.07, W - Hh * 0.14, Hh - Hh * 0.14); x.fillStyle = fg; x.font = "bold italic " + Math.round(Hh * 0.5) + "px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.save(); x.translate(W / 2, Hh / 2); x.rotate(-0.04 + k * 0.015); x.fillText(t, 0, 0); x.restore(); }, { lit: true });
      for (const e of [-2.4, 2.4]) { const q = p.clone().add(K.V(Math.cos(face(i, o)) * e, -1.9, -Math.sin(face(i, o)) * e)); K.box(K.V(q.x, q.y + 1.3, q.z), [0.06, 2.6, 0.06], 0x8C939E); }
      if (k < 2) K.anchor("b" + k, K.at(i, o, 2.7)); });
    for (let k = 0; k < 12; k++) { const side = k % 2 ? -1 : 1, i = K.idx(10 + k * 4), o = side * (half + 4.4); K.person(K.at(i, o), face(i, o), { suit: [0xFF7A1A, 0x16245C, 0xF2F3F5, 0xFFA51F][k % 4], helmet: false, cap: 0xFF7A1A, pose: k % 2 ? "both" : "wave" }); }`),
  shot("l9-twoseater", "monza", `
    const iC = C(1); K.placeBefore(iC, 300); K.hideLine(); K.hideCar();
    const c = K.car("RACELIMIT", 0, K.c.lat); c.updateMatrixWorld(); const ck = c.userData.ck;
    const hump = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.55, 6, 16), K.std(0xFFA51F, { rough: 0.35 })); hump.rotation.x = Math.PI / 2; hump.position.set(0, 0.8, ck - 1.35); c.add(hump);
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14), K.std(0x1C3F8C, { rough: 0.3 })); h2.position.set(0, 1.14, ck - 1.38); c.add(h2);
    const v2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.04), K.std(0x10141C, { rough: 0.1, metal: 0.4 })); v2.position.set(0, 1.15, ck - 1.25); c.add(v2);
    K.cam(c.localToWorld(K.V(4.4, 1.6, ck + 1.2)), c.localToWorld(K.V(0, 0.75, ck - 1.0)), 40);
    K.anchor("driver", c.localToWorld(K.V(0, 1.12, ck - 0.55))); K.anchor("guest", c.localToWorld(K.V(0, 1.3, ck - 1.38)));`),
  shot("l9-drag", "monza", `
    K.hideLine(); K.hideCar(); K.place(K.c.idx, 0);
    K.car("RACELIMIT", 0, 2.3); K.car("VELOCE", 0, -2.3);
    const i0 = K.idx(10), y0 = K.yaw(i0), L = K.at(i0, -half - 0.6), R = K.at(i0, half + 0.6), lv = K.V(Math.cos(y0), 0, -Math.sin(y0)), fv = K.V(Math.sin(y0), 0, Math.cos(y0));
    for (const p of [L, R]) K.box(K.V(p.x, p.y + 3.2, p.z), [0.3, 6.4, 0.3], 0x2A2F3B);
    const mid = L.clone().lerp(R, 0.5); K.box(K.V(mid.x, mid.y + 6.0, mid.z), [2 * half + 1.6, 0.9, 0.5], 0x16171B, [0, y0, 0]);
    const red = new THREE.MeshBasicMaterial({ color: 0xE8002D, toneMapped: false });
    for (let k = 0; k < 5; k++) for (const r of [0, 1]) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), red); m.position.copy(mid).addScaledVector(lv, (k - 2) * 0.9).add(K.V(0, 6.17 - r * 0.38, 0)).addScaledVector(fv, -0.27); m.rotation.y = y0 + Math.PI; K.scene.add(m); }
    const it = K.idx(330), pt = K.at(it, 0, 5.4);
    K.text(pt, K.yaw(it) + Math.PI, 11, 1.5, (x, W, Hh) => { x.fillStyle = "#16171B"; x.fillRect(0, 0, W, Hh); x.fillStyle = "#FFB547"; x.font = "bold " + Math.round(Hh * 0.62) + "px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("SPEED TRAP · 330 m", W / 2, Hh / 2); });
    for (const s of [-1, 1]) { const q = K.at(it, s * (half + 0.6)); K.box(K.V(q.x, q.y + 2.7, q.z), [0.3, 5.4, 0.3], 0x2A2F3B); }
    K.cam(K.ahead(-8.5, 0, 1.5), K.ahead(40, 0, 2.2), 50);
    K.anchor("you", K.ahead(0, 2.3, 1.3)); K.anchor("rival", K.ahead(0, -2.3, 1.3)); K.anchor("lights", K.V(mid.x, mid.y + 6.6, mid.z)); K.anchor("trap", K.at(it, 0, 6.3));`, { place: 30 }),

  // ===== list 10 =====
  shot("l10-medical", "silverstone", `
    const iC = C(3); K.placeBefore(iC, 200); K.hideLine(); K.hideCar();
    K.safetyCar(K.ahead(0, K.c.lat), K.yaw(K.c.idx), { label: "MEDICAL CAR", color: 0xF2F3F5, stripe: 0x2FA35A, lightA: 0x3A7BFF, lightB: 0xFFB020 });
    [["AXIOM", 24, -2], ["VELOCE", 28, 2], ["NOVA", 34, -0.5], ["KESTREL", 40, 2.6], ["HALCYON", 45, -2.4], ["VORTEX", 51, 0.6], ["ORBITA", 58, -1.8], ["MERIDIAN", 64, 2.2], ["BRAVO", 71, -0.4]].forEach(([t, d, o]) => K.car(t, d, K.c.lat + o));
    K.cam(K.ahead(-8.5, K.c.lat + 1.4, 2.5), K.ahead(22, K.c.lat, 0.8), 50); K.anchor("med", K.ahead(0, K.c.lat, 1.8)); K.anchor("pack", K.ahead(34, K.c.lat - 0.5, 1.4));`),
  shot("l10-tunnel", "monte-carlo", `
    let ti = -1; const TT = K.tr.tunnel; if (TT) for (let i = 0; i < K.tr.N; i++) if (TT[i] > 0.99) { ti = i; break; }
    if (ti < 0) ti = C(12); const j = K.idx(150, ti); K.place(j, K.off(j)); K.hideLine(); K.chase({ fov: 60 });
    K.car("VELOCE", 30, null); K.anchor("car", K.ahead(0, null, 1.3)); K.anchor("ahead", K.ahead(30, null, 1.3));`),
  shot("l10-sand", "sakhir", `
    const iC = C(1); K.placeBefore(iC, 220); K.hideLine(); K.chase();
    let r = 5; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let k = 0; k < 80; k++) { const d = 4 + rnd() * 110, i = K.idx(d), o = K.off(i) + (rnd() - 0.5) * half * 1.6; if (Math.abs(o) > half - 0.6) continue; K.patch(d, o, 0.5 + rnd() * 1.4, 4 + rnd() * 9, 0xE0BE84, { opacity: 0.18 + rnd() * 0.25, round: true, rot: 1.1 + (rnd() - 0.5) * 0.4, order: 3 + (k % 3) }); }
    for (const [d, s] of [[30, 1], [60, 1], [95, -1], [45, -1]]) K.smoke(K.at(K.idx(d), s * (half + 5), 0.5), 30, 10, 0xD9C29A, { size: 1.6, opacity: 0.11, rise: 2, seed: d });
    K.anchor("sand", K.ahead(22, null, 0.1));`),
  shot("l10-fog", "spa", `
    const iC = C(5); K.placeBefore(iC, 520); K.hideLine(); K.chase();
    { const sk = K.findSky(); if (sk) sk.visible = false; } K.scene.background = new THREE.Color(0xC4CAD1);
    K.light({ fog: 0xC4CAD1, fogD: 0.017, sun: 0.5, hemi: [0xDDE3EA, 0x6A7468, 1.0] });
    const i = K.idx(34), o = half + 2.2; K.person(K.at(i, o), face(i, o), { suit: 0xFF7A1A, helmet: false, cap: 0xFF7A1A }); K.panel(K.at(K.idx(36), o + 0.8), face(K.idx(36), o), 0xE8002D);
    K.anchor("post", K.at(i, o, 3.2));`),
  shot("l10-launch", "silverstone", ROOM + `
    K.scene.background = new THREE.Color(0x07080B); floor(0x0C0D11, 0.35, 0.3);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.4, 0.35, 64), K.std(0x1A1E27, { rough: 0.3, metal: 0.5 })); st.position.copy(P(14, 0, 0.17)); g.add(st);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.3, 0.05, 8, 96), new THREE.MeshBasicMaterial({ color: 0xFFA51F, toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.copy(P(14, 0, 0.36)); g.add(ring);
    carAt("RACELIMIT", 14, 0, -2.3, { h: 0.35 });
    sign(25, 0, 6.6, 16, 9, Math.PI, (x, W, Hh) => { const gr = x.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, "#2A1A06"); gr.addColorStop(1, "#0B0D12"); x.fillStyle = gr; x.fillRect(0, 0, W, Hh); x.fillStyle = "#FFA51F"; x.font = "bold " + Math.round(Hh * 0.36) + "px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("RL27", W / 2, Hh * 0.44); x.fillStyle = "#E8EAF0"; x.font = "bold " + Math.round(Hh * 0.08) + "px Arial"; x.fillText("RACELIMIT · SEASON 2027", W / 2, Hh * 0.76); });
    for (const s of [-1, 1]) spot(P(7, s * 8, 9), P(14, 0, 0.6), 420, 0xFFF2E0, 0.38);
    spot(P(14, 0, 12), P(14, 0, 0), 300, 0xFFC680, 0.45);
    K.smoke(P(14, 0, 0.3), 40, 13, 0xC9CED6, { size: 1.6, opacity: 0.05, rise: 0.4, seed: 4 });
    for (let k = 0; k < 20; k++) { const sd = k % 2 ? -1 : 1, r = Math.floor(k / 2); who(6 + (r % 5) * 1.3, sd * (7.4 + Math.floor(r / 5) * 1.2), sd > 0 ? -1.2 : 1.2, { suit: [0x2A2F3B, 0x3A3F4B, 0x1C2230][k % 3], helmet: false, cap: 0x16171B }); }
    K.cam(P(2.5, -1.0, 3.3), P(14, 0, 1.4), 48); K.anchor("car", P(14, 0, 2.0)); K.anchor("screen", P(25, 0, 11.3));`, { place: 30 }),
  shot("l10-fanzone", "silverstone", ROOM + `
    K.scene.background = new THREE.Color(0xB9CBDD); floor(0x6F7D62, 0.95);
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(36, 22), K.std(0x7E848C, { rough: 0.9 })); pad.rotation.x = -Math.PI / 2; pad.rotation.z = 0; pad.position.copy(P(10, 0, 0.01)); pad.rotation.set(-Math.PI / 2, 0, y); g.add(pad);
    for (const [a, b] of [[8, -5], [8, 5], [16, -5], [16, 5]]) K.box(P(a, b, 1.6), [0.12, 3.2, 0.12], 0xC3C9D4, [0, y, 0], { metal: 0.5 });
    K.box(P(12, 0, 3.35), [10.6, 0.3, 8.6], 0xFFA51F, [0, y, 0]);
    sign(7.66, 0, 2.95, 8, 0.62, Math.PI, T("RACELIMIT FAN ZONE", "#16171B", "#FFA51F", 0.62));
    K.box(P(12, 0, 0.42), [5, 0.84, 1.0], 0xE8EAF0, [0, y, 0]);
    sign(11.48, 0, 0.5, 4.6, 0.5, Math.PI, T("SIGNING · KIRI #27 · 15:00", "#E8EAF0", "#16171B", 0.5));
    who(13.1, 0.7, Math.PI, { suit: 0xFFA51F, helmet: false, cap: 0x16171B, pose: "wave" }); who(13.2, -1.6, Math.PI, { suit: 0x16171B, helmet: false, cap: 0xFFA51F });
    const cols = [0xFF7A1A, 0x16245C, 0xF2F3F5, 0xC8102E, 0x2FD27A, 0xFFA51F, 0x5B2A86, 0x16B8A6, 0xF2C230, 0x3A3F4B, 0xFF7A1A, 0x1C3F8C, 0xE8EAF0, 0xFFA51F];
    for (let k = 0; k < 14; k++) { const a = 10.9 - k * 0.78, b = 0.4 - k * 0.62 + Math.sin(k * 1.7) * 0.2; K.person(P(a, b), look(P(a, b), P(12, 0.4)), { suit: cols[k], helmet: false, cap: cols[(k + 3) % 14], flag: k % 4 === 1 ? 0xFFA51F : undefined }); }
    for (const [a, b] of [[20, 6], [22, -8]]) K.umbrella(P(a, b), 0xFFA51F);
    K.cam(P(3.5, 7.5, 2.8), P(11, -1.0, 1.0), 52); K.anchor("driver", P(13.1, 0.7, 2.3)); K.anchor("queue", P(7.0, -4.6, 2.1));`, { place: 30 }),
  shot("l10-garage", "silverstone", ROOM + GARAGE + `
    const c = carAt("RACELIMIT", 0, 0); const ck = c.userData.ck;
    K.box(P(2.8, 0, 2.45), [2.6, 0.06, 0.06], 0x2A2F3B, [0, y, 0], { metal: 0.6 });
    const scr = (b, draw) => { K.box(P(2.82, b, 1.95), [1.12, 0.7, 0.06], 0x0B0D12, [0, y, 0]); sign(2.78, b, 1.95, 1.04, 0.62, Math.PI, draw); };
    scr(0.6, (x, W, Hh) => { x.fillStyle = "#0B0D12"; x.fillRect(0, 0, W, Hh); x.font = "bold " + Math.round(Hh * 0.085) + "px Arial"; const rows = [["1", "OKA", "1:26.88"], ["2", "BRD", "1:27.04"], ["3", "SLV", "1:27.19"], ["4", "KIRI", "1:27.31"], ["5", "ISH", "1:27.52"], ["6", "VRG", "1:27.66"], ["7", "DEL", "1:27.90"]]; x.fillStyle = "#FFB547"; x.fillText("FP2 · TIMING", W * 0.05, Hh * 0.1); rows.forEach((r, k) => { x.fillStyle = r[1] === "KIRI" ? "#FFB547" : "#E8EAF0"; x.fillText(r[0], W * 0.05, Hh * (0.24 + k * 0.11)); x.fillText(r[1], W * 0.18, Hh * (0.24 + k * 0.11)); x.fillText(r[2], W * 0.62, Hh * (0.24 + k * 0.11)); }); });
    scr(-0.6, (x, W, Hh) => { const sk = x.createLinearGradient(0, 0, 0, Hh * 0.5); sk.addColorStop(0, "#9DBBDD"); sk.addColorStop(1, "#DCE6EE"); x.fillStyle = sk; x.fillRect(0, 0, W, Hh); x.fillStyle = "#3E8A3A"; x.fillRect(0, Hh * 0.5, W, Hh); x.fillStyle = "#5A5F68"; x.beginPath(); x.moveTo(W * 0.45, Hh * 0.5); x.lineTo(W * 0.55, Hh * 0.5); x.lineTo(W * 0.9, Hh); x.lineTo(W * 0.1, Hh); x.fill(); x.fillStyle = "#C8102E"; x.fillRect(W * 0.44, Hh * 0.66, W * 0.12, Hh * 0.08); x.fillStyle = "#E8002D"; x.fillRect(W * 0.8, Hh * 0.05, W * 0.16, Hh * 0.1); x.fillStyle = "#fff"; x.font = "bold " + Math.round(Hh * 0.08) + "px Arial"; x.fillText("LIVE", W * 0.83, Hh * 0.13); });
    who(2.2, 1.6, -Math.PI / 2 - 0.5, { suit: 0x16171B, helmet: false, cap: 0xFFA51F }); who(2.1, -1.7, Math.PI / 2 + 0.4, { suit: 0xFFA51F, helmet: false, cap: 0x16171B, pose: "kneel" });
    K.cam(c.localToWorld(K.V(0, 1.2, ck - 0.62)), P(2.8, 0, 1.8), 62); K.anchor("screen", P(2.8, 0.6, 2.4)); K.anchor("tv", P(2.8, -0.6, 2.4));`, { place: 30 }),
  shot("l10-hill", "spa", `
    const iE = C(2); K.hideLine(); K.hideCar(); K.place(K.idx(-10, iE), K.off(K.idx(-10, iE)));
    const hay = K.std(0xD9B65A, { rough: 1 }), geo = new THREE.CylinderGeometry(0.55, 0.55, 1.2, 18);
    for (let d = -40; d < 140; d += 1.3) for (const s of [-1, 1]) { const i = K.idx(d, iE), o = s * (half + 0.5), m = new THREE.Mesh(geo, hay); m.position.copy(K.at(i, o, 0.55)); m.rotation.set(Math.PI / 2, K.yaw(i), 0, "YXZ"); m.castShadow = m.receiveShadow = true; K.scene.add(m); }
    for (let k = 0; k < 22; k++) { const s = k % 2 ? -1 : 1, i = K.idx(-20 + k * 6, iE), o = s * (half + 2.2 + (k % 3) * 0.6); K.person(K.at(i, o), face(i, o), { suit: [0x16245C, 0xE8EAF0, 0x2A6B3A, 0xC8102E, 0x3A3F4B][k % 5], helmet: false, cap: [0xF2C230, 0x16171B, 0xE8EAF0][k % 3], pose: k % 4 ? undefined : "wave" }); }
    const car = K.car("VELOCE", 0, 0, { era: 1998, pos: K.at(K.idx(10, iE), K.off(K.idx(10, iE))), yaw: K.yaw(K.idx(10, iE)) });
    K.cam(K.at(K.idx(-24, iE), 1.5, 1.3), K.at(K.idx(45, iE), 0, 5), 50); K.anchor("car", K.at(K.idx(10, iE), K.off(K.idx(10, iE)), 1.3)); K.anchor("bales", K.at(K.idx(6, iE), half + 0.5, 1.3));`),
  shot("l10-demo", "monte-carlo", `
    const iC = C(1, 40); K.hideLine(); K.hideCar(); const j = K.idx(-80, iC); K.place(j, 0);
    const c = K.car("RACELIMIT", 0, 0.3, { turn: 0.15 }); c.updateMatrixWorld(); const zr = c.userData.zr;
    K.smoke(c.localToWorld(K.V(0, 0.4, zr - 3.4)), 50, 5.5, 0xE6E8EC, { size: 1.1, opacity: 0.14, rise: 2.6, seed: 3 });
    for (const s of [-0.8, 0.8]) K.patch(-5, 0.3 + s, 0.35, 8, 0x0B0B0D, { opacity: 0.6 });
    const cols = [0xFFA51F, 0xE8EAF0, 0x16245C, 0xC8102E, 0x3A3F4B, 0x2FD27A, 0xFF7A1A, 0x5B2A86];
    for (let k = 0; k < 44; k++) { const s = k % 2 ? -1 : 1, i = K.idx(-22 + (k >> 1) * 2.0), o = s * (half + 1.2 + (k % 3) * 0.75); K.person(K.at(i, o), face(i, o), { suit: cols[k % 8], helmet: false, cap: cols[(k + 3) % 8], pose: k % 5 === 0 ? "both" : (k % 3 === 0 ? "wave" : undefined), flag: k % 7 === 2 ? 0xFFA51F : undefined }); }
    K.cam(K.at(K.idx(13), -1.6, 1.7), K.at(K.idx(-3), 0.3, 0.8), 50); K.anchor("car", K.ahead(0, 0.3, 1.4)); K.anchor("crowd", K.at(K.idx(-8), -(half + 2.2), 2.3));`),

  // ===== list 11 =====
  shot("l11-fireup", "silverstone", ROOM + GARAGE + `
    const c = carAt("RACELIMIT", 0, 0, 0, { h: 0.24 }); stands(c); const zr = c.userData.zr;
    K.box(P(-3.7, 0, 0.5), [0.8, 0.7, 0.7], 0x2A2F3B, [0, y, 0], { metal: 0.5 }); K.box(P(-3.7, 0, 0.95), [0.5, 0.2, 0.4], 0xFFA51F, [0, y, 0]);
    K.line3(P(-3.3, 0, 0.7), c.localToWorld(K.V(0, 0.45, zr - 0.35)), 0x16171B, 0.04);
    for (const s of [-1, 1]) { K.box(P(0.2, s * 2.4, 0.5), [0.6, 1.0, 0.6], 0x8C1820, [0, y, 0]); K.line3(P(0.2, s * 2.1, 0.8), c.localToWorld(K.V(s * 0.62, 0.55, 0)), 0x2A2F3B, 0.05); }
    who(-4.3, 0.6, 0.3, { suit: 0xFFA51F, helmet: false, cap: 0x16171B }); who(-1.2, 1.9, -Math.PI / 2, { suit: 0x16171B, helmet: false, cap: 0xFFA51F }); who(1.8, -1.9, Math.PI / 2 + 0.3, { suit: 0xFFA51F, helmet: false, cap: 0x16171B }); who(-5.6, -2.6, 0.6, { suit: 0x16171B, helmet: false, cap: 0x16171B });
    K.cam(P(-6.9, 3.5, 2.3), P(-0.4, -0.2, 0.6), 52); K.anchor("starter", P(-3.7, 0, 1.15)); K.anchor("heat", P(0.2, 2.4, 1.1));`, { place: 30 }),
  shot("l11-install", "silverstone", `
    K.hideLine(); const P0 = K.tr.pitRoad, Lt = P0.dist[P0.N - 1]; K.placePit(Lt - 55, 0); await K.frames(2); K.chase({ fov: 58, up: 2.3 });
    K.anchor("car", K.V(K.c.x, K.c.y + 1.4, K.c.z));`),
  shot("l11-flap", "silverstone", `
    K.hideLine(); K.hideCar(); const q = K.pitAt(150, 0); const a = K.car("RACELIMIT", 0, 0, { pos: q.p, yaw: q.yaw }); a.updateMatrixWorld();
    for (const w of ["fl", "fr", "rl", "rr"]) { const p = K.wheel(a, w), side = w[1] === "l" ? 1 : -1, qq = a.localToWorld(a.worldToLocal(p.clone()).add(K.V(side * 0.75, 0, 0))); qq.y = q.p.y; K.person(qq, q.yaw - side * Math.PI / 2, { suit: 0xFFA51F, helmet: 0x16171B, pose: "kneel", gun: true }); }
    const zf = a.userData.zf; K.person(a.localToWorld(K.V(0, 0, zf + 2.0)).setY(q.p.y), q.yaw + Math.PI, { suit: 0xFFA51F, helmet: 0x16171B });
    K.person(a.localToWorld(K.V(0.72, 0, zf + 1.0)).setY(q.p.y), q.yaw + Math.PI - 0.9, { suit: 0xFFA51F, helmet: 0x16171B, pose: "kneel" });
    K.box(a.localToWorld(K.V(0.52, 0.3, zf + 0.82)), [0.04, 0.04, 0.32], 0xC3C9D4, [0.4, q.yaw + 0.6, 0], { metal: 0.85, rough: 0.2 });
    K.cam(a.localToWorld(K.V(-3.0, 2.1, zf + 3.8)), a.localToWorld(K.V(0.45, 0.3, zf + 0.6)), 44);
    K.anchor("flap", a.localToWorld(K.V(0.55, 0.32, zf + 0.82)));`),
  shot("l11-wave", "spa", `
    const iC = C(5); K.placeBefore(iC, 460); K.hideLine(); K.hideCar();
    const me = K.car("RACELIMIT", 0, K.c.lat + 1.2); me.updateMatrixWorld(); const ck = me.userData.ck;
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.5, 4, 8), K.std(0xFFA51F, { rough: 0.8 })); arm.position.set(-0.33, 1.22, ck - 0.55); arm.rotation.set(0, 0, 0.55); me.add(arm);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), K.std(0x16171B)); glove.position.set(-0.5, 1.5, ck - 0.55); glove.scale.set(1, 1.3, 0.6); me.add(glove);
    K.car("MERIDIAN", -2.5, K.c.lat - 2.2);
    K.cam(me.localToWorld(K.V(-0.4, 2.2, -8.4)), me.localToWorld(K.V(-0.8, 0.9, 2)), 50);
    K.anchor("hand", me.localToWorld(K.V(-0.5, 1.6, ck - 0.55))); K.anchor("back", K.ahead(-2.5, K.c.lat - 2.2, 1.3));`),
  shot("l11-support", "monza", `
    const iC = C(1); K.placeBefore(iC, 320); K.hideLine(); K.hideCar();
    const L = [[0, 0, { body: "#2E6BFF", accent: "#F2F3F5" }], [9, -1.4, { body: "#E8002D", accent: "#F2C230" }], [16, 1.3, { body: "#2FD27A", accent: "#16171B" }], [24, -0.4, { body: "#F2F3F5", accent: "#5B2A86" }], [32, 1.0, { body: "#FF7A1A", accent: "#16245C" }]];
    const cs = L.map(([d, o, lv]) => { const cc = K.car("NOVA", d, K.c.lat + o, { era: 2009, livery: lv }); cc.scale.setScalar(0.9); return cc; });
    const a = cs[0]; a.updateMatrixWorld(); K.cam(a.localToWorld(K.V(0, 2.0, -6.4)), a.localToWorld(K.V(0, 0.8, 6)), 56);
    K.anchor("lead", K.ahead(32, K.c.lat + 1.0, 1.2)); K.anchor("you", K.ahead(0, K.c.lat, 1.3));`),
  shot("l11-drones", "lusail", `
    const iC = C(1); K.placeBefore(iC, 420); K.hideLine();
    const cv = document.createElement("canvas"); cv.width = 330; cv.height = 70; const x = cv.getContext("2d"); x.fillStyle = "#fff"; x.font = "bold 44px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NIGHT RACE", 165, 36);
    x.fillRect(45, 60, 240, 5);
    const dd = x.getImageData(0, 0, 330, 70).data, ctr = K.ahead(140, 0, 80), yw = K.yaw(K.idx(160)), lv = K.V(Math.cos(yw), 0, -Math.sin(yw));
    const mw = new THREE.MeshBasicMaterial({ color: 0xFFE7C0, toneMapped: false }), mo = new THREE.MeshBasicMaterial({ color: 0xFFA51F, toneMapped: false }), geo = new THREE.SphereGeometry(0.5, 8, 6);
    for (let v = 0; v < 70; v += 3) for (let u = 0; u < 330; u += 3) if (dd[(v * 330 + u) * 4 + 3] > 128) { const m = new THREE.Mesh(geo, v > 55 ? mo : mw); m.position.copy(ctr).addScaledVector(lv, -(u - 165) * 0.42).add(K.V(0, -(v - 35) * 0.42, 0)); K.scene.add(m); }
    K.camCar([0, 1.3, -6.5], [0, 16, 30], 70); K.anchor("drones", ctr.clone().add(K.V(0, 11, 0)));`),
  shot("l11-lines", "spa", WET + `
    const iC = C(5); K.placeBefore(iC, 420); K.hideLine(); wet(-10, 220);
    { const sk = K.findSky(); if (sk) sk.visible = false; } K.scene.background = new THREE.Color(0x9AA4B0); K.light({ sun: 0.3, hemi: [0xA9B4C2, 0x3A4048, 0.9], fog: 0x9AA4B0, fogD: 0.009 });
    const s = -1; K.place(K.c.idx, s * (half - 1.0)); K.chase({ x: 0.4 });
    K.ribbon(-6, 140, s * (half - 0.22), 0.34, 0xCFE6FF, { lit: true, rough: 0.02, metal: 0.7, opacity: 0.55, y: 0.04 });
    K.anchor("line", K.ahead(14, s * (half - 0.22), 0.1)); K.anchor("car", K.ahead(0, s * (half - 1.0), 1.3));`),
  shot("l11-cooldown", "silverstone", ROOM + `
    K.scene.background = new THREE.Color(0x0E1117); floor(0x2A2F3B, 0.8);
    wallX(8, 0, 12, 3.6, 0x1C2230); wallZ(2, 6, 14, 3.6, 0x22283A); wallZ(2, -6, 14, 3.6, 0x22283A);
    K.box(P(7.9, 0, 1.9), [3.4, 2.0, 0.08], 0x0B0D12, [0, y, 0]);
    sign(7.84, 0, 1.9, 3.2, 1.8, Math.PI, (x, W, Hh) => { const sk = x.createLinearGradient(0, 0, 0, Hh * 0.45); sk.addColorStop(0, "#9DBBDD"); sk.addColorStop(1, "#DCE6EE"); x.fillStyle = sk; x.fillRect(0, 0, W, Hh); x.fillStyle = "#3E8A3A"; x.fillRect(0, Hh * 0.45, W, Hh); x.fillStyle = "#5A5F68"; x.beginPath(); x.moveTo(W * 0.42, Hh * 0.45); x.lineTo(W * 0.58, Hh * 0.45); x.lineTo(W * 0.98, Hh); x.lineTo(W * 0.02, Hh); x.fill();
      const car = (cx, cy, sc, col) => { x.fillStyle = "#16171B"; x.fillRect(cx - 70 * sc, cy - 10 * sc, 140 * sc, 40 * sc); x.fillStyle = col; x.fillRect(cx - 45 * sc, cy - 40 * sc, 90 * sc, 50 * sc); x.fillRect(cx - 80 * sc, cy - 55 * sc, 160 * sc, 18 * sc); };
      car(W * 0.44, Hh * 0.62, 0.8, "#C8102E"); car(W * 0.58, Hh * 0.8, 1.3, "#FFA51F");
      x.fillStyle = "rgba(11,13,18,.85)"; x.fillRect(W * 0.03, Hh * 0.05, W * 0.24, Hh * 0.13); x.fillStyle = "#FFB547"; x.font = "bold " + Math.round(Hh * 0.08) + "px Arial"; x.fillText("REPLAY", W * 0.05, Hh * 0.14); });
    K.box(P(3.2, 0, 0.25), [3.8, 0.5, 1.0], 0x3A4150, [0, y, 0], { rough: 0.9 }); K.box(P(2.62, 0, 0.75), [3.8, 0.9, 0.25], 0x3A4150, [0, y, 0], { rough: 0.9 });
    for (const s of [-1, 1]) K.box(P(3.1, s * 2.0, 0.45), [0.25, 0.9, 1.2], 0x3A4150, [0, y, 0], { rough: 0.9 });
    [[1.1, 0xC8102E, 0xF2F2F2], [0, 0xFFA51F, 0x16171B], [-1.1, 0x16245C, 0xF2C230]].forEach(([b, s1, cp]) => who(3.25, b, 0, { suit: s1, helmet: false, cap: cp, h: -0.5 }));
    K.box(P(5.3, 0, 0.22), [2.2, 0.44, 0.8], 0x16171B, [0, y, 0]); for (const b of [-0.6, 0, 0.6]) K.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 10), K.std(0x7FC4FF, { opacity: 0.7 }), P(5.3, b, 0.56));
    lamp(4, 0, 3.4, 28); lamp(1, 3, 3.2, 14);
    K.cam(P(0.4, -2.4, 2.1), P(6.2, 0.5, 1.3), 52); K.anchor("tv", P(7.85, 0, 2.95)); K.anchor("p1", P(3.25, 0, 1.55));`, { place: 30 }),
  shot("l11-walk", "zandvoort", `
    const iC = C(1); const s = sgn(K.off(iC)); K.hideLine(); K.hideCar(); K.place(K.idx(-60, iC), 0);
    const j = K.idx(-8, iC), oc = -s * (half + 4.5); K.car("RACELIMIT", 0, 0, { pos: K.at(j, oc), yaw: K.yaw(j) + 0.7 }); K.smoke(K.at(j, oc, 0.8), 18, 2.5, 0xD8DADF, { size: 0.8, opacity: 0.2, rise: 3, seed: 2 });
    const i2 = K.idx(-24, iC), od = -s * (half + 2.4); K.person(K.at(i2, od), K.yaw(i2) + Math.PI, { suit: 0xFFA51F, helmet: false, cap: 0x16171B, pose: "wave" });
    const im = K.idx(-6, iC); K.person(K.at(im, oc + s * 1.6), face(im, oc) + 0.5, { suit: 0xE8501A, helmet: false, cap: 0xE8501A });
    K.cam(K.at(K.idx(-32, iC), -s * (half - 1.0), 1.6), K.at(K.idx(-18, iC), od, 1.0), 50);
    K.anchor("driver", K.at(i2, od, 2.2)); K.anchor("car", K.at(j, oc, 1.4));`),
  shot("l11-record", "silverstone", `
    const iC = C(15); K.placeBefore(iC, 300); K.hideLine(); K.chase();
    const i = K.idx(26), o = half + 7, p = K.at(i, o, 0), yw = face(i, o);
    K.box(K.V(p.x, p.y + 3, p.z), [0.4, 6, 0.4], 0x2A2F3B, [0, yw, 0]); K.box(K.V(p.x, p.y + 7.6, p.z), [12.6, 7.4, 0.5], 0x15171C, [0, yw, 0]);
    const fv = K.V(Math.sin(yw), 0, Math.cos(yw));
    K.text(K.V(p.x, p.y + 7.6, p.z).addScaledVector(fv, 0.27), yw, 12, 6.75, (x, W, Hh) => { x.fillStyle = "#0B0D12"; x.fillRect(0, 0, W, Hh); x.fillStyle = "#7A3CFF"; x.fillRect(0, 0, W, Hh * 0.2); x.fillStyle = "#fff"; x.font = "bold " + Math.round(Hh * 0.11) + "px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NEW LAP RECORD", W / 2, Hh * 0.1); x.fillStyle = "#FFB547"; x.font = "bold " + Math.round(Hh * 0.27) + "px Arial"; x.fillText("1:26.104", W / 2, Hh * 0.45); x.fillStyle = "#E8EAF0"; x.font = "bold " + Math.round(Hh * 0.1) + "px Arial"; x.fillText("KIRI · RACELIMIT · #27", W / 2, Hh * 0.69); x.fillStyle = "#9AA3B2"; x.font = "bold " + Math.round(Hh * 0.07) + "px Arial"; x.fillText("old record 1:27.097 · OKA · 2025", W / 2, Hh * 0.86); });
    K.anchor("screen", K.V(p.x, p.y + 11.5, p.z));`),
  shot("l11-rebuild", "silverstone", ROOM + GARAGE + `
    K.scene.background = new THREE.Color(0x05060A); K.light({ sun: 0.12, hemi: [0x2A3040, 0x0A0B0E, 0.2] });
    const c = carAt("RACELIMIT", 0, 0, 0, { h: 0.24 }); stands(c);
    K.box(P(3.0, 2.1, 0.1), [1.9, 0.12, 0.55], 0x16171B, [0, y + 0.3, 0]); for (const s of [-1, 1]) K.box(P(3.0 + s * 0.3, 2.1 + s * 0.85, 0.3), [0.05, 0.4, 0.6], 0xFFA51F, [0, y + 0.3, 0]);
    K.mesh(new THREE.ConeGeometry(0.25, 1.6, 14), K.std(0xFFA51F, { rough: 0.4 }), P(-4.6, -3.0, 0.26), [Math.PI / 2, 0, y], );
    sign(-7.84, 2.6, 3.7, 1.7, 0.62, 0, T("02:40", "#FF6B6B", "#0B0D12", 0.75));
    who(1.6, 1.6, -Math.PI / 2 - 0.3, { suit: 0x16171B, helmet: false, cap: 0xFFA51F, pose: "kneel" }); who(-1.0, -1.7, Math.PI / 2, { suit: 0xFFA51F, helmet: false, cap: 0x16171B }); who(-3.0, 1.8, -Math.PI / 2, { suit: 0x16171B, helmet: false, cap: 0x16171B }); who(2.6, -1.6, Math.PI, { suit: 0xFFA51F, helmet: false, cap: 0x16171B, pose: "kneel" });
    lamp(0, 0, 2.8, 60, 0xFFE8C8, 12); lamp(2.5, 1.5, 1.2, 18, 0xFFFFFF, 6);
    K.cam(P(6.2, -2.6, 2.6), P(-2.0, 0.6, 0.9), 52); K.anchor("clock", P(-7.84, 2.6, 4.1)); K.anchor("car", P(0, 0, 1.4));`, { place: 30 }),
  shot("l11-corner", "spa", `
    const iC = C(5); K.placeBefore(iC, 95); K.hideLine(); K.chase({ fov: 54 });
    const s = sgn(K.off(iC)); const i = K.idx(-40, iC), o = -s * (half + 5), p = K.at(i, o), yw = K.yaw(i) + Math.PI - s * 0.45;
    for (const k of [-1, 1]) { const q = p.clone().add(K.V(Math.cos(yw) * k * 4.0, 0, -Math.sin(yw) * k * 4.0)); K.box(K.V(q.x, q.y + 2.2, q.z), [0.25, 4.4, 0.25], 0x2A2F3B); }
    K.text(K.V(p.x, p.y + 4.6, p.z), yw, 9.6, 3.0, (x, W, Hh) => { x.fillStyle = "#F2F3F5"; x.fillRect(0, 0, W, Hh); x.fillStyle = "#FFA51F"; x.fillRect(0, Hh * 0.76, W, Hh * 0.24); x.fillStyle = "#16171B"; x.font = "bold " + Math.round(Hh * 0.5) + "px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("KIRI", W / 2, Hh * 0.39); x.font = "bold " + Math.round(Hh * 0.15) + "px Arial"; x.fillText("TURN 5", W / 2, Hh * 0.88); }, { lit: true });
    K.anchor("sign", K.V(p.x, p.y + 6.2, p.z));`),
  shot("l11-doc", "silverstone", ROOM + GARAGE + `
    const c = carAt("RACELIMIT", 0, 0);
    const dr = who(2.2, 2.0, -Math.PI * 0.7, { suit: 0xFFA51F, helmet: false, cap: 0x16171B });
    const op = P(4.4, 0.2), opp = K.person(op, look(op, P(2.2, 2.0)), { suit: 0x2A2F3B, helmet: false, cap: 0x16171B }); opp.updateMatrixWorld();
    K.box(opp.localToWorld(K.V(0.3, 1.62, 0.2)), [0.24, 0.28, 0.62], 0x16171B, [0, look(op, P(2.2, 2.0)), 0]);
    const bp = P(4.6, 1.6), bm = K.person(bp, look(bp, P(2.2, 2.0)), { suit: 0x3A3F4B, helmet: false, cap: 0x3A3F4B, pose: "both" });
    K.line3(P(4.5, 1.6, 2.0), P(2.6, 2.1, 2.7), 0x2A2F3B, 0.02); K.mesh(new THREE.CapsuleGeometry(0.07, 0.24, 4, 8), K.std(0x5A5F68, { rough: 1 }), P(2.55, 2.1, 2.62), [0, 0, Math.PI / 2]);
    K.line3(P(3.6, 3.4, 0), P(3.6, 3.4, 1.9), 0x2A2F3B, 0.025); K.mesh(new THREE.BoxGeometry(0.7, 0.45, 0.05), new THREE.MeshBasicMaterial({ color: 0xFFF6E8 }), P(3.6, 3.4, 2.0), [0, look(P(3.6, 3.4), P(2.2, 2.0)), 0]);
    K.cam(P(6.6, 4.4, 2.3), P(3.0, 1.0, 1.3), 50); K.anchor("crew", P(4.4, 0.2, 2.4)); K.anchor("driver", P(2.2, 2.0, 2.2));`, { place: 30 }),
  shot("l11-factory", "silverstone", ROOM + `
    K.scene.background = new THREE.Color(0xB9C1CC); floor(0xB8BEC7, 0.25, 0.1);
    wallX(22, 0, 34, 9, 0xD9DDE3); wallZ(5, 12, 36, 9, 0xCDD2D9); wallZ(5, -12, 36, 9, 0xCDD2D9);
    sign(21.86, 0, 7.4, 16, 1.1, Math.PI, T("RACELIMIT TECHNOLOGY CENTRE", "#16171B", "#D9DDE3", 0.6));
    K.box(P(21.85, 0, 3.1), [9, 4.4, 0.08], 0x10141C, [0, y, 0], { rough: 0.05, metal: 0.6 });
    sign(21.78, 0, 3.1, 8.6, 4.0, Math.PI, (x, W, Hh) => { x.fillStyle = "#0E1117"; x.fillRect(0, 0, W, Hh); x.strokeStyle = "#2A3140"; x.lineWidth = 6; for (let k = 1; k < 8; k++) { x.beginPath(); x.moveTo(W * k / 8, 0); x.lineTo(W / 2 + (W * k / 8 - W / 2) * 0.3, Hh * 0.3); x.stroke(); } x.fillStyle = "#FFA51F"; x.fillRect(W * 0.3, Hh * 0.62, W * 0.4, Hh * 0.1); x.fillStyle = "#16171B"; x.fillRect(W * 0.25, Hh * 0.7, W * 0.5, Hh * 0.08); x.fillStyle = "#7FC4FF"; x.font = "bold " + Math.round(Hh * 0.1) + "px Arial"; x.textAlign = "center"; x.fillText("WIND TUNNEL · 60% MODEL", W / 2, Hh * 0.2); });
    K.box(P(10, 0, 0.18), [3.6, 0.36, 6.4], 0x1C2230, [0, y - 0.6, 0], { rough: 0.3 }); carAt("RACELIMIT", 10, 0, -0.6, { h: 0.36 });
    K.box(P(11, 9.4, 1.6), [2.0, 3.2, 6.0], 0xBFD6E8, [0, y, 0], { opacity: 0.25, rough: 0.05 }); K.box(P(11, 9.4, 0.15), [2.0, 0.3, 6.0], 0x16171B, [0, y, 0]);
    const gold = K.std(0xD4A23A, { metal: 1, rough: 0.25 }); for (let k = 0; k < 6; k++) { const a = 8.6 + k * 0.95, hh = 0.3 + (k % 3) * 0.25; K.mesh(new THREE.CylinderGeometry(0.12, 0.2, hh, 16), gold, P(a, 9.4, 0.3 + hh / 2)); K.mesh(new THREE.SphereGeometry(0.2, 16, 12), gold, P(a, 9.4, 0.3 + hh + 0.15)); K.mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 16), gold, P(a, 9.4, 1.8 + (k % 2) * 0.2)); }
    K.box(P(12, -8.5, 0.35), [1.4, 0.7, 2.2], 0x16171B, [0, y, 0]); K.box(P(11.6, -8.5, 0.9), [1.0, 0.8, 0.3], 0x2A2F3B, [0, y, 0]);
    for (const [db, yaw] of [[0, Math.PI], [1.5, Math.PI - 0.5], [-1.5, Math.PI + 0.5]]) sign(13.6, -8.5 + db, 1.6, 1.5, 0.9, yaw, (x, W, Hh) => { const sk = x.createLinearGradient(0, 0, 0, Hh * 0.5); sk.addColorStop(0, "#9DBBDD"); sk.addColorStop(1, "#DCE6EE"); x.fillStyle = sk; x.fillRect(0, 0, W, Hh); x.fillStyle = "#3E8A3A"; x.fillRect(0, Hh * 0.5, W, Hh); x.fillStyle = "#5A5F68"; x.beginPath(); x.moveTo(W * 0.45, Hh * 0.5); x.lineTo(W * 0.55, Hh * 0.5); x.lineTo(W * 0.95, Hh); x.lineTo(W * 0.05, Hh); x.fill(); });
    who(5.5, 1.4, -0.3, { suit: 0x16171B, helmet: false, cap: 0x16171B }); who(4.8, 0.2, 0, { suit: 0xFFA51F, helmet: false, cap: 0x16171B });
    lamp(8, 0, 8, 30, 0xFFFFFF, 30); lamp(16, 6, 8, 20, 0xFFFFFF, 24); lamp(16, -6, 8, 20, 0xFFFFFF, 24);
    K.cam(P(2.5, 0.8, 2.7), P(12.5, 0, 1.5), 60); K.anchor("car", P(10, 0, 1.7)); K.anchor("trophies", P(11, 9.4, 3.4)); K.anchor("sim", P(12.5, -8.5, 2.4)); K.anchor("tunnel", P(21.8, 0, 5.4));`, { place: 30 }),
  shot("l11-ice", "silverstone", ROOM + `
    K.scene.background = new THREE.Color(0xC9D6E2); K.scene.fog = new THREE.FogExp2(0xC9D6E2, 0.008); floor(0xF0F4F8, 0.95);
    const E0 = P(40, 0), A = 34, B = 22, at = (th, r, h = 0) => P(40 + A * r * Math.cos(th), B * r * Math.sin(th), h);
    const ice = new THREE.Mesh(new THREE.CircleGeometry(1, 96), K.std(0xB8D2E6, { rough: 0.06, metal: 0.15 })); ice.scale.set(B * 1.02, A * 1.02, 1); ice.rotation.set(-Math.PI / 2, y, 0, "YXZ"); ice.position.copy(E0).add(K.V(0, 0.01, 0)); g.add(ice);
    const snow = K.std(0xFAFCFF, { rough: 1 });
    const bank = (r, n) => { for (let k = 0; k < n; k++) { const th = (k / n) * Math.PI * 2, p = at(th, r, 0.3), p2 = at(th + 0.02, r, 0.3); const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 1.1), snow); m.position.copy(p); m.rotation.y = look(p, p2) + Math.PI / 2; m.castShadow = m.receiveShadow = true; g.add(m); } };
    bank(1.04, 120); bank(0.58, 70);
    for (let k = 0; k < 70; k++) { const th = (k / 70) * Math.PI * 2 + 0.03, r = 1.25 + (k % 4) * 0.12, p = at(th, r); K.mesh(new THREE.ConeGeometry(1.5, 5.5, 8), K.std(0x2C4A34, { rough: 0.9 }), p.clone().add(K.V(0, 3.1, 0))); K.mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 6), K.std(0x4A3A2A), p.clone().add(K.V(0, 0.3, 0))); }
    const th = Math.PI + 0.42, cp = at(th, 0.8), cp2 = at(th + 0.05, 0.8); const car = K.car("RACELIMIT", 0, 0, { pos: cp, yaw: look(cp, cp2) + 0.6 }); car.updateMatrixWorld();
    K.smoke(car.localToWorld(K.V(0.6, 0.3, car.userData.zr - 1.0)), 40, 3.2, 0xF6F9FC, { size: 0.7, opacity: 0.28, rise: 1.0, seed: 6 });
    for (let k = 0; k < 10; k++) { const p = at(Math.PI + 0.1 + k * 0.08, 1.12); K.person(p, look(p, E0), { suit: [0xC8102E, 0x16245C, 0xFFA51F, 0x2A6B3A][k % 4], helmet: false, cap: 0xF2F3F5, pose: k % 3 ? undefined : "wave" }); }
    K.cam(at(Math.PI + 0.62, 1.28, 6.5), at(Math.PI + 0.25, 0.5, 0.5), 50); K.anchor("car", cp.clone().add(K.V(0, 1.4, 0)));`, { place: 30 }),
];

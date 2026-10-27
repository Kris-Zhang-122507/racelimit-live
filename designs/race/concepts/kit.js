// Runs inside the racing game page (public/race/) to stage concept shots: other cars, lines and objects laid on the
// real track in 3D, people, a free camera, and screen positions of things for the labels drawn over the picture.
const THREE = await import("three");
const ver = new URL(document.querySelector('script[src*="main.js"]').src).searchParams.get("v");
const CarM = await import(`./car.js?v=${ver}`);
const TD = await import(`./trackdata.js?v=${ver}`);
const R = window.__race, tr = R.tr, c = R.c, scene = window.__scene, car = window.__car, cam = window.__cam;
const line = TD.racingLine(tr);
const N = tr.N;
const wrap = (i) => ((Math.round(i) % N) + N) % N;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const K = { THREE, tr, c, scene, me: car, cam, line, anchorsRaw: {} };

// ---------- freezing the game ----------
K.pause = () => { if (K.paused) return; K.paused = true; for (const t of ["keydown", "keyup"]) dispatchEvent(new KeyboardEvent(t, { code: "Escape", key: "Escape" })); };
// remember the scene so each shot can be undone before the next one
K.snapshot = () => { const objs = new Set(), vis = new Map(); scene.traverse((m) => { objs.add(m); vis.set(m, m.visible); });
  K._snap = { objs, vis, bg: scene.background, fog: scene.fog, c: { x: c.x, y: c.y, z: c.z, yaw: c.yaw, idx: c.idx, lat: c.lat, onPit: c.onPit } }; };
K.restore = () => { const S = K._snap; if (!S) return; const extra = []; scene.traverse((m) => { if (!S.objs.has(m)) extra.push(m); }); for (const m of extra) m.parent?.remove(m);
  scene.traverse((m) => { if (S.vis.has(m)) m.visible = S.vis.get(m); }); scene.background = S.bg; scene.fog = S.fog; Object.assign(c, S.c); K.anchorsRaw = {}; camSet = null; };
K.frames = (n = 3) => new Promise((res) => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });

// ---------- where things are ----------
K.idx = (d, from = c.idx) => { // the track point d metres along from `from`
  const len = tr.len ?? tr.dist[N - 1];
  let s = (tr.dist[from] + d) % len; if (s < 0) s += len;
  let lo = 0, hi = N - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (tr.dist[m] < s) lo = m + 1; else hi = m; }
  return lo;
};
K.off = (i) => line.off[wrap(i)];                         // the racing line's offset from the centre
K.lat = () => c.lat ?? 0;
K.at = (i, o = 0, h = 0) => { i = wrap(i); return V(tr.X[i] + tr.LX[i] * o, tr.yAt(i, o) + h, tr.Z[i] + tr.LZ[i] * o); };
K.yaw = (i) => { i = wrap(i); return Math.atan2(tr.TX[i], tr.TZ[i]); };
K.ahead = (d, o = null, h = 0) => { const i = K.idx(d); return K.at(i, o ?? K.off(i), h); };

// ---------- markings on the road ----------
const lift = (i, o) => { const a = Math.abs(o), hh = tr.half; return a < hh / 2 ? 0.05 - (a / (hh / 2)) * 0.015 : Math.max(0, 0.035 - ((a - hh / 2) / (hh / 2 + 0.6)) * 0.035); };
const roadMat = (color, o = {}) => {
  const base = { color, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 };
  const m = o.lit ? new THREE.MeshStandardMaterial({ ...base, roughness: o.rough ?? 0.9, metalness: o.metal ?? 0 }) : new THREE.MeshBasicMaterial(base);
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
  return m;
};
// a strip along the track from d0 to d1 metres ahead; off(i) gives its centre, width w (or w(i))
K.ribbon = (d0, d1, off, w, color, o = {}) => {
  const i0 = K.idx(d0), steps = []; let i = i0; const len = Math.abs(d1 - d0), dir = d1 >= d0 ? 1 : -1;
  for (let s = 0; s <= len + 0.01; s += o.step ?? 0.8) steps.push(K.idx(d0 + dir * s));
  const pos = [], idx = [];
  steps.forEach((k, n) => {
    const oc = typeof off === "function" ? off(k, n / (steps.length - 1)) : off, ww = typeof w === "function" ? w(k, n / (steps.length - 1)) : w;
    for (const side of [-0.5, 0.5]) { const oo = oc + side * ww; pos.push(tr.X[k] + tr.LX[k] * oo, tr.yAt(k, oo) + lift(k, oo) + (o.y ?? 0.03), tr.Z[k] + tr.LZ[k] * oo); }
    if (n) { const a = (n - 1) * 2; if (!o.dash || Math.floor(n / o.dash) % 2 === 0) idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, roadMat(color, o)); m.renderOrder = 2; m.receiveShadow = !!o.lit; scene.add(m); return m;
};
// a rectangle lying on the road at d metres ahead, o across
K.patch = (d, o, w, l, color, opt = {}) => {
  const i = K.idx(d), p = K.at(i, o, lift(i, o) + (opt.y ?? 0.035)), geo = opt.round ? new THREE.CircleGeometry(0.5, 40).scale(w, l, 1) : new THREE.PlaneGeometry(w, l), m = new THREE.Mesh(geo, roadMat(color, opt));
  m.rotation.set(-Math.PI / 2, K.yaw(i) + (opt.rot ?? 0), 0, "YXZ");
  m.position.copy(p); m.renderOrder = opt.order ?? 2; scene.add(m); return m;
};
K.disc = (p, r, color, opt = {}) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 10), roadMat(color, opt)); m.rotation.x = -Math.PI / 2; m.position.copy(p); m.position.y += opt.y ?? 0.06; m.renderOrder = 2; scene.add(m); return m; };

// ---------- solid things ----------
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, emissive: o.emissive ? new THREE.Color(o.emissive) : undefined, emissiveIntensity: o.ei ?? 1, transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide });
K.mesh = (geo, mat, p, rot = [0, 0, 0], parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.copy(p); m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
K.std = std;
K.cone = (d, o, s = 1) => { const i = K.idx(d), p = K.at(i, o, lift(i, o)); const g = new THREE.Group(); g.position.copy(p);
  K.mesh(new THREE.ConeGeometry(0.17 * s, 0.6 * s, 16), std(0xFF6A14, { rough: 0.5 }), V(0, 0.32 * s, 0), [0, 0, 0], g);
  K.mesh(new THREE.CylinderGeometry(0.105 * s, 0.13 * s, 0.09 * s, 16), std(0xF2F3F5), V(0, 0.34 * s, 0), [0, 0, 0], g);
  K.mesh(new THREE.BoxGeometry(0.44 * s, 0.03 * s, 0.44 * s), std(0x1A1A1A), V(0, 0.015 * s, 0), [0, 0, 0], g); scene.add(g); return p; };
// broken bits of carbon and paint
K.debris = (d, o, size, color, seed = 1) => { const i = K.idx(d), p = K.at(i, o, lift(i, o) + 0.02); let r = seed * 9301 + 49297;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const shape = new THREE.Shape(); const n = 5 + Math.floor(rnd() * 3);
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, rr = size * (0.5 + rnd() * 0.6); const x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.6; k ? shape.lineTo(x, y) : shape.moveTo(x, y); }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02 + size * 0.04, bevelEnabled: false });
  const m = K.mesh(geo, std(color, { rough: 0.45 }), p, [-Math.PI / 2 + (rnd() - 0.5) * 0.4, rnd() * 6.28, (rnd() - 0.5) * 0.4]); return p; };
// a person: suit colour, helmet or cap, a pose
K.person = (p, yaw, o = {}) => {
  const g = new THREE.Group(), suit = std(o.suit ?? 0xFF7A1A, { rough: 0.8 }), skin = std(0xD9A57E, { rough: 0.7 }), dark = std(o.boots ?? 0x1A1C22, { rough: 0.8 });
  const s = o.scale ?? 1, kneel = o.pose === "kneel";
  const leg = (x) => { if (kneel) { K.mesh(new THREE.CapsuleGeometry(0.075, 0.38, 4, 8), suit, V(x, 0.2, -0.1), [Math.PI / 2, 0, 0], g); K.mesh(new THREE.CapsuleGeometry(0.075, 0.36, 4, 8), suit, V(x, 0.3, 0.12), [0.3, 0, 0], g); } else K.mesh(new THREE.CapsuleGeometry(0.08, 0.72, 4, 8), suit, V(x, 0.48, 0), [0, 0, 0], g); K.mesh(new THREE.BoxGeometry(0.12, 0.08, 0.26), dark, V(x, 0.04, kneel ? -0.32 : 0.05), [0, 0, 0], g); };
  leg(-0.11); leg(0.11);
  const hip = kneel ? 0.52 : 0.95;
  K.mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 10), suit, V(0, hip + 0.3, 0), [0, 0, 0], g);
  const head = V(0, hip + 0.8, 0);
  if (o.helmet !== false) { K.mesh(new THREE.SphereGeometry(0.15, 16, 12), std(o.helmet ?? 0xF2F3F5, { rough: 0.3 }), head, [0, 0, 0], g); K.mesh(new THREE.BoxGeometry(0.2, 0.07, 0.04), std(0x10141C, { rough: 0.1, metal: 0.4 }), V(0, head.y + 0.01, 0.13), [0, 0, 0], g); }
  else { K.mesh(new THREE.SphereGeometry(0.12, 16, 12), skin, head, [0, 0, 0], g); K.mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 16), std(o.cap ?? o.suit ?? 0xFF7A1A), V(0, head.y + 0.08, 0), [0, 0, 0], g); }
  const arm = (x, up) => K.mesh(new THREE.CapsuleGeometry(0.06, 0.55, 4, 8), suit, V(x, hip + (up ? 0.75 : 0.32), up ? 0.05 : 0), [up ? 0.15 : 0, 0, up ? (x > 0 ? 0.25 : -0.25) : (x > 0 ? 0.12 : -0.12)], g);
  arm(-0.27, o.pose === "wave" || o.pose === "both"); arm(0.27, o.pose === "both" || o.pose === "lolli");
  if (o.flag) { K.mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 6), std(0x8C939E, { metal: 0.6 }), V(-0.33, hip + 1.35, 0.05), [0, 0, 0.2], g);
    K.mesh(new THREE.PlaneGeometry(1.0, 0.68), std(o.flag, { rough: 0.7, side: THREE.DoubleSide, emissive: o.flag, ei: 0.25 }), V(-0.62, hip + 1.6, 0.05), [0, 0.2, -0.05], g); }
  if (o.pose === "lolli") { K.mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6), std(0x2A2F3B), V(0.4, hip + 0.9, 0.3), [0.6, 0, -0.2], g); K.mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 24), std(0x2FD27A, { emissive: 0x2FD27A, ei: 0.8 }), V(0.55, hip + 1.45, 0.75), [Math.PI / 2 - 0.6, 0, 0], g); }
  if (o.gun) K.mesh(new THREE.BoxGeometry(0.1, 0.12, 0.35), std(0x2A2F3B, { metal: 0.5 }), V(0, hip + 0.35, 0.3), [0, 0, 0], g);
  g.position.copy(p); g.rotation.y = yaw; g.scale.setScalar(s); scene.add(g); return g;
};
// a marshal's LED flag panel on a post
K.panel = (p, yaw, color) => { const g = new THREE.Group(); K.mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), std(0x8C939E, { metal: 0.6 }), V(0, 1.1, 0), [0, 0, 0], g);
  K.mesh(new THREE.BoxGeometry(1.1, 0.75, 0.12), std(0x15171C), V(0, 2.35, 0), [0, 0, 0], g);
  K.mesh(new THREE.PlaneGeometry(0.98, 0.64), new THREE.MeshBasicMaterial({ color }), V(0, 2.35, 0.065), [0, 0, 0], g);
  g.position.copy(p); g.rotation.y = yaw; scene.add(g); return g; };
K.box = (p, size, color, rot = [0, 0, 0], o = {}) => K.mesh(new THREE.BoxGeometry(...size), std(color, o), p, rot);
K.text = (p, yaw, w, h, draw, o = {}) => { // a sign: draw(ctx, W, H) onto a canvas
  const cv = document.createElement("canvas"); cv.width = Math.round(w * 200); cv.height = Math.round(h * 200); draw(cv.getContext("2d"), cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), o.lit ? new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide }) : new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }));
  m.position.copy(p); m.rotation.y = yaw; scene.add(m); return m; };

// ---------- other cars ----------
K.TEAMS = CarM.TEAMS;
K.car = (team, d, o = null, opt = {}) => {
  const t = CarM.TEAMS.find((x) => x.team === team) ?? CarM.TEAMS[1];
  const g = CarM.f1car({ era: opt.era ?? 2026, team: t.team, body: t.body, accent: t.accent, stripe: t.stripe, number: t.number, helmet: t.helmet, tcam: "#111", aero: "corner", compound: opt.compound ?? "#F2C230", compoundName: "C · MEDIUM" });
  const i = opt.pit ? null : K.idx(d), oo = o ?? K.off(i ?? 0);
  if (opt.pos) { g.position.copy(opt.pos); g.rotation.y = opt.yaw ?? 0; }
  else { g.position.copy(K.at(i, oo, lift(i, oo))); g.rotation.set(0, K.yaw(i) + (opt.turn ?? 0), 0, "YXZ"); }
  if (opt.ghost) g.traverse((m) => { if (m.isMesh) { m.material = new THREE.MeshStandardMaterial({ color: 0x7FC4FF, emissive: 0x2A6AB8, emissiveIntensity: 0.6, transparent: true, opacity: 0.5, depthWrite: false, roughness: 0.3 }); m.castShadow = false; } });
  g.traverse((m) => { if (m.isMesh && !opt.ghost) m.castShadow = m.receiveShadow = true; });
  scene.add(g); return g;
};
// world position of a car's wheel (fl, fr, rl, rr) — for labels
K.wheel = (g, which) => { const E = g.userData.E, f = which[0] === "f"; g.updateMatrixWorld(); return g.localToWorld(V((which[1] === "l" ? 1 : -1) * ((f ? E.tf : E.tr) + (f ? E.wf : E.wr) / 2 - 0.05), E.r, f ? g.userData.zf : g.userData.zr)); };

// ---------- the player's car and the camera ----------
K.hideCar = () => { car.visible = false; };
K.hideLine = () => { scene.traverse((m) => { if (m.isMesh && m.renderOrder === 1 && m.material?.vertexColors) m.visible = false; }); };
K.place = (i, o, yawAdd = 0) => { const p = K.at(i, o); c.x = p.x; c.z = p.z; c.y = tr.yAt(wrap(i), o); c.yaw = K.yaw(i) + yawAdd; c.idx = wrap(i); c.lat = o; };
K.placePit = (s, o = 0) => { const P = tr.pitRoad; let i = 0; while (i < P.N - 1 && P.dist[i] < s) i++;
  const lx = P.TZ[i], lz = -P.TX[i]; c.x = P.X[i] + lx * o; c.z = P.Z[i] + lz * o; c.y = P.Y[i]; c.yaw = Math.atan2(P.TX[i], P.TZ[i]); c.onPit = true; return { i, P }; };
K.pitAt = (s, o = 0) => { const P = tr.pitRoad; let i = 0; while (i < P.N - 1 && P.dist[i] < s) i++; return { p: V(P.X[i] + P.TZ[i] * o, P.Y[i], P.Z[i] - P.TX[i] * o), yaw: Math.atan2(P.TX[i], P.TZ[i]) }; };
let camSet = null;
const origUpd = cam.updateProjectionMatrix.bind(cam);
cam.updateProjectionMatrix = function () { if (camSet) { const s = camSet(); this.position.copy(s.pos); this.up.set(0, 1, 0); this.lookAt(s.look); if (s.roll) this.rotateZ(s.roll); this.fov = s.fov ?? 50; this.near = s.near ?? 0.05; } origUpd(); };
K.cam = (pos, look, fov = 50, o = {}) => { camSet = () => ({ pos, look, fov, ...o }); };
// relative to the player's car: x left(+)/right(−), y up, z forward
K.camCar = (lp, ll, fov = 50, o = {}) => { camSet = () => { car.updateMatrixWorld(); return { pos: car.localToWorld(V(...lp)), look: car.localToWorld(V(...ll)), fov, ...o }; }; };
K.camOff = () => { camSet = null; };

// ---------- light and season ----------
K.findSky = () => { let s = null; scene.traverse((m) => { if (m.material?.uniforms?.sunPosition) s = m; }); return s; };
K.light = (o) => { scene.traverse((m) => {
  if (m.isDirectionalLight) { if (o.sunCol != null) m.color.set(o.sunCol); if (o.sun != null) m.intensity = o.sun; }
  if (m.isHemisphereLight && o.hemi) { m.color.set(o.hemi[0]); m.groundColor.set(o.hemi[1]); m.intensity = o.hemi[2]; } });
  if (o.fog) { scene.fog.color.set(o.fog); if (o.fogD) scene.fog.density = o.fogD; }
  const sky = K.findSky(); if (sky && o.skyEl != null) { const u = sky.material.uniforms; u.sunPosition.value.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - o.skyEl), THREE.MathUtils.degToRad(o.skyAz ?? 140)); if (o.turb) u.turbidity.value = o.turb; if (o.ray) u.rayleigh.value = o.ray; } };
K.recolorGreens = (fn) => { const seen = new Set(); scene.traverse((m) => { const ms = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : []; for (const mat of ms) { if (!mat?.color || seen.has(mat) || mat.map) continue; const { r, g, b } = mat.color; if (g > r * 1.25 && g > b * 1.15) { seen.add(mat); fn(mat); } } }); };

// ---------- for the labels ----------
K.anchor = (name, p) => { K.anchorsRaw[name] = p.clone ? p.clone() : p; return p; };
K.project = () => { cam.updateMatrixWorld(); const out = {}; for (const [k, p] of Object.entries(K.anchorsRaw)) { const v = p.clone().project(cam); out[k] = [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight), v.z < 1 ? 1 : 0]; } return out; };

// a silhouette of the player's car only (white on black), for masks
K.maskOnly = () => { scene.traverse((m) => { if (m.isMesh || m.isPoints || m.isLine || m.isSprite) { let p = m, inCar = false; while (p) { if (p === car) inCar = true; p = p.parent; } if (!inCar) m.visible = false; else m.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, toneMapped: false }); } }); scene.background = new THREE.Color(0); scene.fog = null; };

window.K = K;
// distance ahead to track point i, and the next corner's apex
K.dTo = (i) => { const len = tr.len ?? tr.dist[N - 1]; let d = tr.dist[wrap(i)] - tr.dist[c.idx]; if (d < 0) d += len; return d; };
K.nextCorner = (min = 20) => { const cs = (tr.corners ?? []).map((k) => ({ ...k, d: K.dTo(k.i) })).filter((k) => k.d > min).sort((a, b) => a.d - b.d); return cs[0]; };
// ---------- more staging helpers ----------
K.corner = (n) => (tr.corners ?? []).find((k) => k.n === n)?.i;
K.placeBefore = (i, m, o = null) => { const j = K.idx(-m, wrap(i)); K.place(j, o ?? K.off(j)); return j; };
// the usual chase view, fixed to the car (the game's own chase camera lags behind after the car is moved)
K.chase = (o = {}) => K.camCar([o.x ?? 0, o.up ?? 2.1, -(o.back ?? 7)], [o.lx ?? 0, o.ly ?? 0.9, o.ahead ?? 5], o.fov ?? 58);
K.pitCar = (team, s, o = 0, opt = {}) => { const q = K.pitAt(s, o); return K.car(team, 0, 0, { ...opt, pos: q.p, yaw: q.yaw }); };
K.group = () => { const g = new THREE.Group(); scene.add(g); return g; };
// hide the whole circuit (for studio shots); keep = objects to leave visible
K.hideWorld = (keep = []) => { const keepSet = new Set(); for (const k of keep) k.traverse((m) => keepSet.add(m)); scene.children.forEach((ch) => { if (!keepSet.has(ch) && !ch.isLight && ch !== car) ch.visible = false; }); };
K.windsock = (p, yaw) => { const g = new THREE.Group(); K.mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 8), std(0xC3C9D4, { metal: 0.6 }), V(0, 3, 0), [0, 0, 0], g);
  for (let k = 0; k < 5; k++) K.mesh(new THREE.CylinderGeometry(0.42 - k * 0.06, 0.36 - k * 0.06, 0.55, 16, 1, true), std(k % 2 ? 0xF2F3F5 : 0xFF6A14, { side: THREE.DoubleSide }), V(0, 0, 0.3 + k * 0.55), [Math.PI / 2 + 0.12, 0, 0], g).position.y = 5.8 - k * 0.07;
  g.position.copy(p); g.rotation.y = yaw; scene.add(g); return g; };
K.flagpole = (p, yaw, color, wave = 0.3) => { const g = new THREE.Group(); K.mesh(new THREE.CylinderGeometry(0.04, 0.04, 5, 8), std(0xC3C9D4, { metal: 0.6 }), V(0, 2.5, 0), [0, 0, 0], g);
  const geo = new THREE.PlaneGeometry(1.6, 1, 12, 1); const pa = geo.attributes.position; for (let k = 0; k < pa.count; k++) { const x = pa.getX(k) + 0.8; pa.setZ(k, Math.sin(x * 3) * 0.12 * x); } geo.computeVertexNormals();
  K.mesh(geo, std(color, { side: THREE.DoubleSide, rough: 0.8 }), V(0.8, 4.4, 0), [0, wave, 0], g); g.position.copy(p); g.rotation.y = yaw; scene.add(g); return g; };
K.umbrella = (p, color) => { const g = new THREE.Group(); K.mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.1, 6), std(0x2A2F3B), V(0, 1.05, 0), [0, 0, 0], g);
  K.mesh(new THREE.ConeGeometry(1.1, 0.45, 16, 1, true), std(color, { side: THREE.DoubleSide }), V(0, 2.1, 0), [0, 0, 0], g); g.position.copy(p); scene.add(g); return g; };
// tyre blankets wrapped round a car's wheels
K.blankets = (g, color = 0x8C1820) => { const E = g.userData.E; for (const w of ["fl", "fr", "rl", "rr"]) { const p = g.worldToLocal(K.wheel(g, w)), f = w[0] === "f", W = (f ? E.wf : E.wr) + 0.06;
  K.mesh(new THREE.CylinderGeometry(E.r + 0.035, E.r + 0.035, W, 24), std(color, { rough: 0.95 }), p, [0, 0, Math.PI / 2], g);
  K.mesh(new THREE.CylinderGeometry(E.r - 0.02, E.r - 0.02, W + 0.02, 24, 1, true), std(0x1A1C22, { rough: 0.95, side: THREE.DoubleSide }), p, [0, 0, Math.PI / 2], g); } };
// sparks from the plank under a car
K.sparks = (g, n = 70) => { const grp = new THREE.Group(); const mk = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const mat = mk(0xFFB040), mat2 = mk(0xFFF4D0); let r = 7; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let k = 0; k < n; k++) { const l = 0.05 + rnd() * 0.28; const m = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, l), k % 3 ? mat : mat2); m.position.set((rnd() - 0.5) * 0.7, 0.02 + rnd() * rnd() * 0.3, g.userData.zr - 0.15 - rnd() * 1.7); m.rotation.set(-0.08 - rnd() * 0.35, (rnd() - 0.5) * 0.5, 0); grp.add(m); }
  g.add(grp); return grp; };
// a sign with text on a post
K.board = (p, yaw, txt, o = {}) => K.text(V(p.x, p.y + (o.h ?? 1.2), p.z), yaw, o.w ?? 0.9, o.hh ?? 0.9, (x, W, H) => { x.fillStyle = o.bg ?? "#F2F3F5"; x.fillRect(0, 0, W, H); x.fillStyle = o.fg ?? "#16171B"; x.font = `700 ${Math.round(H * (o.fs ?? 0.5))}px Barlow, Arial`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, W / 2, H / 2); }, { lit: true });
K.V = V;

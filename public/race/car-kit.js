// Concept car v4: a much more detailed 2022–25 style car, still built from code.
// z forward, y up, metres; origin on the ground, middle of the wheelbase.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

try { await Promise.all(["700 120px BC", "600 40px JB", "600 40px B"].map((f) => document.fonts.load(f))); } catch {}

function canvas(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; }
function tex(c, { srgb = true, rx = 1, ry = 1 } = {}) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t; }
function normalFrom(hf, w, h, k) {
  return canvas(w, h, (g) => { const img = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const H = (xx, yy) => hf[((yy + h) % h) * w + ((xx + w) % w)]; const dx = (H(x + 1, y) - H(x - 1, y)) * k, dy = (H(x, y + 1) - H(x, y - 1)) * k; const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4; img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); });
}

// ---------- shared textures ----------
// carbon twill: 16 cells across, 2x2 twill
const CW = 256, cell = 16, cH = new Float32Array(CW * CW);
const carbonC = canvas(CW, CW, (g) => {
  const img = g.createImageData(CW, CW);
  for (let y = 0; y < CW; y++) for (let x = 0; x < CW; x++) {
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell), horiz = ((cx + cy) % 4) < 2;
    const f = horiz ? (y % cell) / cell : (x % cell) / cell, ridge = Math.sin(f * Math.PI);
    cH[y * CW + x] = ridge * (horiz ? 1 : 0.85);
    const v = 18 + ridge * (horiz ? 26 : 14) + Math.random() * 3, i = (y * CW + x) * 4;
    img.data[i] = v; img.data[i + 1] = v + 1; img.data[i + 2] = v + 3; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
});
const carbonMap = tex(carbonC), carbonN = tex(normalFrom(cH, CW, CW, 0.8), { srgb: false });
export const carbon = new THREE.MeshPhysicalMaterial({ map: carbonMap, normalMap: carbonN, normalScale: new THREE.Vector2(0.35, 0.35), roughness: 0.32, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.15, side: THREE.DoubleSide });
const carbonMatte = new THREE.MeshStandardMaterial({ map: carbonMap, normalMap: carbonN, normalScale: new THREE.Vector2(0.25, 0.25), roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });

const tyreTex = {};
function tyreMap(compound, label, grooves = false) {
  const key = compound + label + grooves; if (tyreTex[key]) return tyreTex[key];
  const W = 1024, H = 256;
  const c = canvas(W, H, (g) => {
    g.fillStyle = "#1B1C1F"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? "0,0,0" : "70,70,72"},${Math.random() * 0.12})`; g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 8, 1); }
    // tread scrubbing: a lighter, grainy band across the middle
    const grd = g.createLinearGradient(0, H * 0.3, 0, H * 0.7); grd.addColorStop(0, "rgba(60,60,62,0)"); grd.addColorStop(0.5, "rgba(60,60,62,.55)"); grd.addColorStop(1, "rgba(60,60,62,0)"); g.fillStyle = grd; g.fillRect(0, H * 0.3, W, H * 0.4);
    // coloured compound bands near both rims, and sidewall lettering
    g.fillStyle = compound; for (const r of [0.80, 0.16]) g.fillRect(0, H * r, W, H * 0.045);
    g.fillStyle = "rgba(230,230,230,.85)"; g.font = "700 16px BC"; g.textBaseline = "middle";
    for (const r of [0.89, 0.09]) for (let k = 0; k < 3; k++) g.fillText(label, k * W / 3 + 40, H * r);
    if (grooves) { g.fillStyle = "#08090A"; for (const r of [0.38, 0.46, 0.54, 0.62]) g.fillRect(0, H * r, W, 5); }
  });
  return (tyreTex[key] = tex(c));
}

function helmetMap(a, b) {
  return tex(canvas(512, 256, (g, w, h) => {
    g.fillStyle = "#F3F3F3"; g.fillRect(0, 0, w, h);
    g.fillStyle = a; g.fillRect(0, h * 0.18, w, h * 0.12); g.fillRect(0, h * 0.62, w, h * 0.3);
    g.fillStyle = b; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(k * w / 6, h * 0.62); g.lineTo(k * w / 6 + 40, h * 0.62); g.lineTo(k * w / 6 + 10, h * 0.92); g.lineTo(k * w / 6 - 30, h * 0.92); g.fill(); }
  }));
}

// side-projected livery: u from z, v from y (so stripes stay sharp on any mesh)
const LZ0 = -3, LZ1 = 3.3, LY = 1.3;
function liveryMap({ body, accent, stripe, style = "split" }) {
  const W = 2048, H = 512, X = (z) => ((z - LZ0) / (LZ1 - LZ0)) * W, Y = (y) => (1 - y / LY) * H;
  return tex(canvas(W, H, (g) => {
    g.fillStyle = body; g.fillRect(0, 0, W, H);
    const yl = (z) => (z > 2.2 ? 0.34 - (z - 2.2) * 0.12 : z > -0.3 ? 0.34 + Math.max(0, 0.3 - z) * 0.02 : 0.35 + (-0.3 - z) ** 1.3 * 0.2);
    const band = (fnTop, fnBot, col) => { g.beginPath(); for (let z = LZ0; z <= LZ1; z += 0.02) g.lineTo(X(z), Y(fnTop(z))); for (let z = LZ1; z >= LZ0; z -= 0.02) g.lineTo(X(z), Y(fnBot(z))); g.closePath(); g.fillStyle = col; g.fill(); };
    const line = (fn, col, w, z0 = LZ0, z1 = LZ1) => { g.lineWidth = w; g.strokeStyle = col; g.beginPath(); for (let z = z0; z <= z1; z += 0.02) g.lineTo(X(z), Y(fn(z))); g.stroke(); };
    if (style === "split") { band(yl, () => 0, accent); line((z) => yl(z) + 0.03, stripe, 9); line((z) => 0.7 - (z + 0.5) * 0.12 - Math.sin((z + 0.5) * 1.2) * 0.03, stripe, 5, -0.5, 2.0); g.fillStyle = accent; g.fillRect(X(2.85), 0, W - X(2.85), H); }
    if (style === "stripe") { band((z) => 0.62 - z * 0.035, (z) => 0.47 - z * 0.035, accent); line((z) => 0.65 - z * 0.035, stripe, 6); line((z) => 0.44 - z * 0.035, stripe, 6); band(() => 0.2, () => 0, "#111215"); }
    if (style === "fade") { const gr = g.createLinearGradient(X(2.6), 0, X(-1.6), 0); gr.addColorStop(0, body); gr.addColorStop(1, accent); g.fillStyle = gr; g.fillRect(0, 0, W, H); line((z) => 0.5 + Math.sin(z * 1.4) * 0.12, stripe, 14, -1.5, 2.8); band(() => 0.22, () => 0, "#111215"); }
    if (style === "chevron") { g.fillStyle = accent; for (let k = 0; k < 5; k++) { const z = -0.6 + k * 0.32; g.beginPath(); g.moveTo(X(z), Y(0.2)); g.lineTo(X(z + 0.14), Y(0.2)); g.lineTo(X(z + 0.44), Y(0.95)); g.lineTo(X(z + 0.3), Y(0.95)); g.fill(); } band(() => 0.25, () => 0, accent); g.fillStyle = stripe; g.fillRect(X(2.5), Y(0.5), X(3.3) - X(2.5), Y(0.42) - Y(0.5)); }
    if (style === "dual") { g.fillStyle = accent; g.beginPath(); g.moveTo(X(LZ1), 0); g.lineTo(X(0.6), 0); g.lineTo(X(-0.2), H); g.lineTo(X(LZ1), H); g.fill(); line((z) => 0.95 - (z - 0.2) * 0.9, stripe, 10, -0.2, 0.75); band(() => 0.2, () => 0, "#111215"); }
    for (let i = 0; i < 20000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; g.fillRect(Math.random() * W, Math.random() * H, 1, 1); }
  }));
}
function decal(text, { color = "#FFFFFF", w = 512, h = 128, font = "700 100px BC", italic = false, align = "center", bg = null } = {}) {
  const c = canvas(w, h, (g) => { if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } g.fillStyle = color; g.font = (italic ? "italic " : "") + font; g.textAlign = align; g.textBaseline = "middle"; g.fillText(text, align === "center" ? w / 2 : 8, h / 2 + 4); });
  const t = tex(c); return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false });
}

// ---------- geometry helpers ----------
const CR = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
const DEF = { x: 0, n: 3, bw: 1, tw: 1 };
function smooth(keys, per = 6) {
  keys = keys.map((k) => ({ ...DEF, ...k })); const f = Object.keys(keys[0]), out = [];
  for (let i = 0; i < keys.length - 1; i++) for (let j = 0; j < per; j++) { const t = j / per, o = {}; const a = keys[Math.max(i - 1, 0)], b = keys[i], c = keys[i + 1], d = keys[Math.min(i + 2, keys.length - 1)]; for (const k of f) o[k] = CR(a[k], b[k], c[k], d[k], t); out.push(o); }
  out.push(keys[keys.length - 1]); return out;
}
function ring(s, R) {
  const pts = [], e = 2 / s.n;
  for (let k = 0; k < R; k++) {
    const a = (k / R) * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), sn = Math.sin(a);
    let x = Math.sign(c) * Math.abs(c) ** e * (s.w / 2);
    x *= sn < 0 ? 1 - (1 - s.bw) * Math.abs(sn) ** 0.8 : 1 - (1 - s.tw) * sn ** 0.8;
    pts.push([x + s.x, s.yc + (sn >= 0 ? s.ht : s.hb) * Math.sign(sn) * Math.abs(sn) ** e]);
  }
  return pts;
}
function loft(keys, { R = 64, per = 6, uvFn = null, hole = null, capStart = true, capEnd = true } = {}) {
  const secs = smooth(keys, per), pos = [], idx = [];
  for (const s of secs) for (const [x, y] of ring(s, R)) pos.push(x, y, s.z);
  for (let j = 0; j < secs.length - 1; j++) for (let k = 0; k < R; k++) { const a = j * R + k, b = j * R + ((k + 1) % R), c = a + R, d = b + R; if (hole) { let cx = 0, cy = 0, cz = 0; for (const v of [a, b, c, d]) { cx += pos[v * 3] / 4; cy += pos[v * 3 + 1] / 4; cz += pos[v * 3 + 2] / 4; } if (hole(cx, cy, cz)) continue; } idx.push(a, b, c, b, d, c); }
  const cap = (j, front) => { const ci = pos.length / 3, s = secs[j]; pos.push(s.x, s.yc + (s.ht - s.hb) / 2, s.z); for (let k = 0; k < R; k++) { const a = j * R + k, b = j * R + ((k + 1) % R); front ? idx.push(ci, a, b) : idx.push(ci, b, a); } };
  if (capStart) cap(0, false); if (capEnd) cap(secs.length - 1, true);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(...(uvFn ? uvFn(pos[i], pos[i + 1], pos[i + 2]) : [(pos[i + 2] - LZ0) / (LZ1 - LZ0), pos[i + 1] / LY]));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
// a wing element: stations across the span, each an airfoil section with its own height, chord and pitch
function wing(stations, { P = 12, camber = 0.05 } = {}) {
  const loop = []; for (let i = 0; i <= P; i++) loop.push([(1 - Math.cos((Math.PI * i) / P)) / 2, 1]); for (let i = P - 1; i >= 1; i--) loop.push([(1 - Math.cos((Math.PI * i) / P)) / 2, -1]);
  const M = loop.length, pos = [], uv = [], idx = [];
  const th = (u, t) => 5 * t * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4);
  for (const s of stations) for (const [u, side] of loop) {
    const zl = -u * s.c, yl = (-camber * Math.sin(Math.PI * u) + side * th(u, s.t ?? 0.1)) * s.c;
    const ca = Math.cos(s.a), sa = Math.sin(s.a), dy = yl * ca - zl * sa, dz = zl * ca + yl * sa, ro = s.roll ?? 0;
    pos.push(s.x + dy * Math.sin(ro), s.y + dy * Math.cos(ro), s.z + dz); uv.push((s.x + s.y) * 10, u * s.c * 10);
  }
  for (let j = 0; j < stations.length - 1; j++) for (let k = 0; k < M; k++) { const a = j * M + k, b = j * M + ((k + 1) % M), c = a + M, d = b + M; idx.push(a, b, c, b, d, c); }
  for (const j of [0, stations.length - 1]) { const ci = pos.length / 3; let cx = 0, cy = 0, cz = 0; for (let k = 0; k < M; k++) { cx += pos[(j * M + k) * 3]; cy += pos[(j * M + k) * 3 + 1]; cz += pos[(j * M + k) * 3 + 2]; } pos.push(cx / M, cy / M, cz / M); uv.push(0, 0); for (let k = 0; k < M; k++) idx.push(ci, j * M + k, j * M + ((k + 1) % M)); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); g.userData.uvDone = true; return g;
}
export function boxUV(geo, k = 10) {
  if (geo.userData.uvDone) return geo; if (!geo.attributes.normal) geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal, uv = [];
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); const x = p.getX(i), y = p.getY(i), z = p.getZ(i); uv.push(...(ax >= ay && ax >= az ? [z * k, y * k] : ay >= az ? [x * k, z * k] : [x * k, y * k])); }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.userData.uvDone = true; return geo;
}
const span = (x0, x1, n, fn) => { const out = []; for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; out.push({ x, ...fn(x) }); } return out; };
function plate(pts, depth) { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], p[1]); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.003, bevelSegments: 1, curveSegments: 12 }); g.translate(0, 0, -depth / 2); g.rotateY(-Math.PI / 2); return g; } // shape in (z, y), thickness along x

// an oval tube along a path (halo, struts): a = half-width sideways, b = half-height
function sweep(points, a, b, segs = 64, rs = 14) {
  const curve = new THREE.CatmullRomCurve3(points), pos = [], idx = [], up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPointAt(t), T = curve.getTangentAt(t);
    let side = new THREE.Vector3().crossVectors(T, up); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    const nrm = new THREE.Vector3().crossVectors(side, T).normalize();
    for (let k = 0; k < rs; k++) { const q = (k / rs) * Math.PI * 2; pos.push(p.x + side.x * a * Math.cos(q) + nrm.x * b * Math.sin(q), p.y + side.y * a * Math.cos(q) + nrm.y * b * Math.sin(q), p.z + side.z * a * Math.cos(q) + nrm.z * b * Math.sin(q)); }
  }
  for (let i = 0; i < segs; i++) for (let k = 0; k < rs; k++) { const A = i * rs + k, B = i * rs + ((k + 1) % rs), C = A + rs, D = B + rs; idx.push(A, C, B, B, C, D); }
  for (const [i, f] of [[0, 1], [segs, 0]]) { const ci = pos.length / 3, p = curve.getPointAt(i / segs); pos.push(p.x, p.y, p.z); for (let k = 0; k < rs; k++) f ? idx.push(ci, i * rs + k, i * rs + ((k + 1) % rs)) : idx.push(ci, i * rs + ((k + 1) % rs), i * rs + k); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a front wing cascade: each flap starts just above and slightly ahead of the trailing edge of the one below,
// so the slot gaps stay tight; outboard, every element turns up harder and curls into the endplate
function cascade(W, { z0, chords = [0.34, 0.17, 0.13, 0.1], baseY = 0.07, rise = 0.05, sweepBack = 0.13, a0 = 0.05, step = 0.3, stepOut = 0.2, open = [0, 0, 0, 0], from = [0, 0, 0.12, 0.13], N = 44 }) {
  const els = chords.map(() => []);
  for (let i = 0; i <= N; i++) {
    const x = -W + (2 * W * i) / N, rr = Math.min(1, Math.abs(x) / W), r = Math.max(0, (Math.abs(x) - 0.22) / (W - 0.22));
    let y = baseY + rise * rr * rr, z = z0 - sweepBack * rr * rr, a = a0 + 0.07 * rr;
    for (let k = 0; k < chords.length; k++) {
      const c = chords[k] * (1 - 0.18 * rr) * (k ? 1 : 1 - 0.1 * r);
      els[k].push({ x, y, z, c, a, t: k ? 0.065 : 0.075 });
      const teZ = z - c * Math.cos(a), teY = y + c * Math.sin(a);
      z = teZ + 0.028; y = teY + 0.012;
      a += (step + stepOut * r ** 1.5) * (1 - (open[k + 1] ?? 0));
    }
  }
  return els.map((st, k) => from[k] ? [st.filter((p) => p.x <= -from[k]), st.filter((p) => p.x >= from[k])] : [st]);
}
// a rear wing whose tips roll down 90° and carry on down to form the endplates (2022+ shape)
function rollWing(W, { y0, z, c, a, R = 0.11, drop = 0.24, flatTip = true, n = 18 }) {
  const st = [];
  const push = (x, y, roll, f) => st.push({ x, y, z, c, a: flatTip ? a * (1 - f) + 0.02 * f : a, roll, t: 0.09 });
  for (const sgn of [-1, 1]) {
    const part = [];
    for (let k = 0; k <= 4; k++) { const f = k / 4; part.push([sgn * W, y0 - R - drop * (1 - f), sgn * Math.PI / 2, 1]); }
    for (let k = 1; k <= 8; k++) { const th = (Math.PI / 2) * (1 - k / 8); part.push([sgn * (W - R + R * Math.sin(th)), y0 - R + R * Math.cos(th), sgn * th, th / (Math.PI / 2)]); }
    if (sgn < 0) part.forEach((q) => push(...q));
    else { for (let k = 1; k < n; k++) { const x = -(W - R) + (2 * (W - R) * k) / n; push(x, y0, 0, 0); } part.reverse().forEach((q) => push(...q)); }
  }
  return st;
}

// ---------- steering wheel (2026 style) ----------
// Drawn at 5 px per mm. Origin at the wheel centre, x right, y up as the driver sees it.
// Shape: a wide top with button "ears", a screen in the middle, three dials at the bottom, and grips that hang down at the sides.
const MM = 5, FW = 300, FH = 200;
export const WHEEL_BTN = [
  // [label, colour, x, y, radius]
  ["N", "#2FD27A", -86, 30, 8], ["PIT", "#FF8A1F", 86, 30, 8],
  ["DRS", "#2D6BFF", -112, 50, 5.5], ["RADIO", "#FFD23F", -96, 56, 5.5], ["OT", "#E8002D", 112, 50, 5.5], ["MARK", "#9B59FF", 96, 56, 5.5],
  ["BOX", "#E8002D", -66, 48, 5], ["OK", "#C3C9D4", 66, 48, 5],
  ["+1", "#C3C9D4", -66, 12, 5], ["-1", "#C3C9D4", 66, 12, 5],
  ["BB-", "#5A6170", -92, 6, 5], ["BB+", "#5A6170", 92, 6, 5],
  ["CHRG", "#2FD27A", -62, -14, 4.5], ["WET", "#2D6BFF", 62, -14, 4.5],
];
const ROTARY = [["STRAT", -40, -40, 12, ["#2FD27A", "#FFD23F", "#FF8A1F", "#E8002D"]], ["MODE", 0, -44, 17, ["#2D6BFF", "#2FD27A", "#FFD23F", "#FF8A1F", "#E8002D", "#9B59FF"]], ["DIFF", 40, -40, 12, ["#E8EAF0", "#C3C9D4", "#9AA3B2"]]];
const OUTLINE = (() => {
  // clockwise from the top left; grips are the parts below y = -10 at |x| > 104
  const pts = [[-96, 74], [96, 74], [118, 70], [128, 58], [136, 34], [142, 6], [142, -40], [138, -78], [128, -94], [114, -96], [104, -86], [102, -50], [96, -28], [80, -40], [64, -62], [40, -70], [0, -72], [-40, -70], [-64, -62], [-80, -40], [-96, -28], [-102, -50], [-104, -86], [-114, -96], [-128, -94], [-138, -78], [-142, -40], [-142, 6], [-136, 34], [-128, 58], [-118, 70]];
  return pts;
})();
function wheelFace(emissiveOnly = false) {
  return canvas(FW * MM, FH * MM, (g, w, h) => {
    const X = (x) => (x + FW / 2) * MM, Y = (y) => (FH / 2 - y) * MM, R = (r) => r * MM;
    g.fillStyle = emissiveOnly ? "#000" : "#141518"; g.fillRect(0, 0, w, h);
    if (!emissiveOnly) {
      for (let y = 0; y < h; y += 10) for (let x = 0; x < w; x += 10) { g.fillStyle = ((x + y) / 10) % 4 < 2 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.08)"; g.fillRect(x, y, 10, 10); }
      // rubber on the grips
      for (const s of [-1, 1]) { g.fillStyle = "#1d1e21"; g.beginPath(); g.moveTo(X(s * 104), Y(-4)); g.lineTo(X(s * 144), Y(-4)); g.lineTo(X(s * 144), Y(-98)); g.lineTo(X(s * 100), Y(-98)); g.fill(); }
    }
    const txt = (t, x, y, size, col, align = "center", font = "JB", wgt = 600) => { g.fillStyle = col; g.font = `${wgt} ${R(size)}px ${font}`; g.textAlign = align; g.textBaseline = "middle"; g.fillText(t, X(x), Y(y)); };
    const label = (t, x, y, size = 3.6, col = "#E6E8EC") => { if (!emissiveOnly) txt(t, x, y, size, col, "center", "BC", 700); };
    // shift lights (12 on top) plus blue flag lights at each end
    for (let k = 0; k < 12; k++) { const x = -55 + k * 10, c = k < 4 ? "#2BFF6A" : k < 8 ? "#FF2B2B" : "#3B7BFF", lit = k < 7; g.beginPath(); g.arc(X(x), Y(66), R(3.2), 0, 7); g.fillStyle = lit ? c : emissiveOnly ? "#000" : "#2a2c31"; g.fill(); }
    for (const s of [-1, 1]) { g.beginPath(); g.arc(X(s * 74), Y(66), R(2.6), 0, 7); g.fillStyle = emissiveOnly ? "#000" : "#24304a"; g.fill(); }
    // screen
    const sx0 = -52, sx1 = 52, sy0 = -4, sy1 = 58;
    g.fillStyle = "#030405"; g.fillRect(X(sx0), Y(sy1), R(sx1 - sx0), R(sy1 - sy0));
    const cell = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(X(x), Y(y), R(ww), R(hh)); };
    // top strip: lap time, delta
    cell(sx0 + 1, sy1 - 1, 50, 9, "#0f1a12"); txt("1:46.882", sx0 + 26, sy1 - 5.5, 5.4, "#6EE7A8");
    cell(sx0 + 53, sy1 - 1, 50, 9, "#0f1a12"); txt("-0.142", sx0 + 78, sy1 - 5.5, 5.8, "#2FD27A");
    // centre: gear and speed
    txt("8", 0, 30, 26, "#FFFFFF", "center", "BC", 700); txt("291", 0, 10, 6, "#C3C9D4");
    // left column
    [["ERS", "78", "#2FD27A"], ["BB", "56.5", "#E8EAF0"], ["TYRE", "96", "#FFB547"]].forEach(([k, v, c], i) => { const y = 42 - i * 14; cell(sx0 + 1, y + 5, 28, 12, "#11151b"); txt(k, sx0 + 3, y + 1.5, 3.6, "#9AA3B2", "left", "BC", 700); txt(v, sx0 + 27, y - 2, 5.4, c, "right"); });
    // right column
    [["DIFF", "7", "#E8EAF0"], ["FUEL", "+0.2", "#2FD27A"], ["POS", "P5", "#FFB547"]].forEach(([k, v, c], i) => { const y = 42 - i * 14; cell(sx1 - 29, y + 5, 28, 12, "#11151b"); txt(k, sx1 - 27, y + 1.5, 3.6, "#9AA3B2", "left", "BC", 700); txt(v, sx1 - 3, y - 2, 5.4, c, "right"); });
    // bottom: battery bar + energy mode
    cell(sx0 + 1, 2, sx1 - sx0 - 2, 5, "#11151b"); cell(sx0 + 1, 2, (sx1 - sx0 - 2) * 0.78, 5, "#2FD27A"); txt("ATTACK", 0, -0.5, 3.2, "#0B0D12", "center", "BC", 700);
    if (emissiveOnly) return;
    // printed rings + labels for buttons
    for (const [t, c, x, y, r] of WHEEL_BTN) { g.beginPath(); g.arc(X(x), Y(y), R(r + 1.4), 0, 7); g.fillStyle = "#08090b"; g.fill(); label(t, x, y - r - 3.4); }
    // dials: coloured position marks around each
    for (const [t, x, y, r, cols] of ROTARY) { const n = cols.length * 2; for (let k = 0; k < n; k++) { const a0 = -Math.PI * 0.8 + (k / n) * Math.PI * 1.6, a1 = a0 + (Math.PI * 1.6) / n * 0.8; g.beginPath(); g.arc(X(x), Y(y), R(r + 4), -a1 - Math.PI / 2, -a0 - Math.PI / 2); g.lineWidth = R(3); g.strokeStyle = cols[k % cols.length]; g.stroke(); } label(t, x, y + r + 8.5, 3.6, "#FFB547"); }
    // thumb toggles near the grips
    for (const s of [-1, 1]) { g.fillStyle = "#E6C619"; g.fillRect(X(s * 98 - 4), Y(-8), R(8), R(14)); label(s < 0 ? "TORQ" : "ENG", s * 98, -26); }
  });
}
let faceTex = null, faceEm = null;
export function buildWheel(helmet) {
  const sw = new THREE.Group(), mm = (v) => v / 1000;
  if (!faceTex) { faceTex = tex(wheelFace(false)); faceEm = tex(wheelFace(true)); for (const t of [faceTex, faceEm]) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
  const sh = new THREE.Shape(); OUTLINE.forEach(([x, y], i) => (i ? sh.lineTo(mm(x), mm(y)) : sh.moveTo(mm(x), mm(y))));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.024, bevelEnabled: true, bevelSize: 0.005, bevelThickness: 0.005, bevelSegments: 3, curveSegments: 12 });
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) * 1000 + FW / 2) / FW, (pos.getY(i) * 1000 + FH / 2) / FH);
  geo.translate(0, 0, -0.012);
  sw.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: faceTex, emissiveMap: faceEm, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.45, metalness: 0.1 })));
  // rubber grips: thick, rounded, running down each side
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.95 });
  const gloveM = new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.85 });
  for (const s of [-1, 1]) {
    sw.add(new THREE.Mesh(sweep([new THREE.Vector3(s * 0.124, 0.004, 0.002), new THREE.Vector3(s * 0.122, -0.045, 0.004), new THREE.Vector3(s * 0.118, -0.088, 0.002)], 0.022, 0.026, 20, 14), rubber));
    const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.055, 6, 12), gloveM); palm.position.set(s * 0.122, -0.045, -0.006); sw.add(palm);
    const band = new THREE.Mesh(new THREE.CapsuleGeometry(0.0265, 0.01, 4, 12), new THREE.MeshStandardMaterial({ color: helmet[0], roughness: 0.8 })); band.position.set(s * 0.122, -0.082, -0.006); sw.add(band);
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.035, 4, 8), gloveM); thumb.position.set(s * 0.1, -0.008, 0.016); thumb.rotation.z = s * 0.5; sw.add(thumb);
    for (const [y, l] of [[0.02, 0.09], [-0.035, 0.08]]) { const pd = new THREE.Mesh(boxUV(new RoundedBoxGeometry(l, 0.03, 0.004, 2, 0.002)), carbon); pd.position.set(s * 0.1, y, -0.032); pd.rotation.z = s * -0.2; sw.add(pd); }
  }
  for (const [, c, x, y, r] of WHEEL_BTN) { const b = new THREE.Mesh(new THREE.CylinderGeometry(mm(r - 0.4), mm(r), mm(4), 20), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 0.8 })); b.rotation.x = Math.PI / 2; b.position.set(mm(x), mm(y), 0.0185); sw.add(b); }
  const knurl = new THREE.MeshStandardMaterial({ color: 0x2a2c31, metalness: 0.6, roughness: 0.4 });
  for (const [, x, y, r] of ROTARY) { const k = new THREE.Mesh(new THREE.CylinderGeometry(mm(r - 1), mm(r), mm(9), 24), knurl); k.rotation.x = Math.PI / 2; k.position.set(mm(x), mm(y), 0.021); sw.add(k); const ptr = new THREE.Mesh(new THREE.BoxGeometry(mm(2), mm(r * 0.8), mm(1)), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 })); ptr.position.set(mm(x + r * 0.3), mm(y + r * 0.35), 0.0258); ptr.rotation.z = -0.7; sw.add(ptr); }
  for (const s of [-1, 1]) { const tg = new THREE.Mesh(new RoundedBoxGeometry(mm(7), mm(12), mm(6), 2, mm(1.5)), new THREE.MeshPhysicalMaterial({ color: 0xE6C619, roughness: 0.3, clearcoat: 0.8 })); tg.position.set(mm(s * 98), mm(-15), 0.019); sw.add(tg); }
  for (let k = 0; k < 12; k++) { const led = new THREE.Mesh(new THREE.SphereGeometry(mm(3.2), 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: k < 4 ? 0x22FF55 : k < 8 ? 0xFF2222 : 0x3377FF, emissiveIntensity: k < 7 ? 2.5 : 0.1, transparent: true, opacity: 0.9 })); led.rotation.x = Math.PI / 2; led.position.set(mm(-55 + k * 10), mm(66), 0.0172); sw.add(led); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0x8E949C, metalness: 0.9, roughness: 0.3 })); hub.rotation.x = Math.PI / 2; hub.position.set(0, 0, -0.04); sw.add(hub);
  return sw;
}

// ---------- eras ----------
// wb wheelbase, fo/ro overhangs, tf/tr half-track, r tyre radius, rim radius, wf/wr tyre widths
export const ERAS = {
  1998: { label: "1998–2008", wb: 3.05, fo: 1.05, ro: 0.8, tf: 0.71, tr: 0.69, r: 0.33, rim: 0.165, wf: 0.27, wr: 0.36, grooves: true, nose: "high", fw: "v10", rw: "classic", pods: "box", bargeboards: true, chimneys: true, airbox: 1.1, beam: true, horns: true, flipups: true },
  2009: { label: "2009–2013", wb: 3.2, fo: 1.15, ro: 0.8, tf: 0.72, tr: 0.7, r: 0.33, rim: 0.165, wf: 0.245, wr: 0.325, nose: "high", fw: "wide", fwW: 0.9, rw: "tall", pods: "box", bargeboards: true, airbox: 1.06, beam: true },
  2014: { label: "2014–2016", wb: 3.4, fo: 1.15, ro: 0.8, tf: 0.72, tr: 0.7, r: 0.33, rim: 0.165, wf: 0.245, wr: 0.325, nose: "finger", fw: "wide", fwW: 0.85, rw: "tall", pods: "box", bargeboards: true, airbox: 1.0, monkey: true, ears: true },
  2017: { label: "2017–2021", wb: 3.6, fo: 1.3, ro: 0.85, tf: 0.81, tr: 0.79, r: 0.33, rim: 0.165, wf: 0.305, wr: 0.405, halo: true, nose: "mid", fw: "wide", fwW: 1.0, rw: "low", pods: "tapered", fin: "big", bargeboards: true, monkey: true, airbox: 1.0, ears: true, twing: true },
  2022: { label: "2022–2025", wb: 3.6, fo: 1.5, ro: 0.9, tf: 0.81, tr: 0.78, r: 0.362, rim: 0.229, wf: 0.3, wr: 0.4, covers: true, deflectors: true, halo: true, nose: "low", fw: "swept", rw: "spoon", pods: "ground", fin: "small", beam: true, airbox: 1.0, hoop: "blade", fences: true },
  2026: { label: "2026", wb: 3.4, fo: 1.38, ro: 0.86, tf: 0.78, tr: 0.76, r: 0.352, rim: 0.229, wf: 0.275, wr: 0.37, halo: true, nose: "low", fw: "active", rw: "active", pods: "ground", fin: "small", airbox: 0.98, hoop: "blade", boards: true, tcam: "wing" },
};
const NOSES = {
  low: [[0, 0.54, 0.48, 0.15, 0.33], [0.3, 0.36, 0.43, 0.11, 0.24], [0.55, 0.26, 0.35, 0.085, 0.16], [0.8, 0.19, 0.26, 0.06, 0.1], [0.94, 0.15, 0.19, 0.045, 0.06], [1, 0.07, 0.165, 0.02, 0.03]],
  high: [[0, 0.54, 0.52, 0.15, 0.3], [0.3, 0.38, 0.51, 0.11, 0.2], [0.55, 0.28, 0.5, 0.09, 0.13], [0.8, 0.2, 0.48, 0.07, 0.09], [0.94, 0.14, 0.46, 0.05, 0.06], [1, 0.06, 0.45, 0.02, 0.03]],
  finger: [[0, 0.54, 0.52, 0.15, 0.3], [0.3, 0.38, 0.5, 0.11, 0.2], [0.55, 0.28, 0.47, 0.09, 0.12], [0.68, 0.2, 0.42, 0.07, 0.08], [0.76, 0.09, 0.3, 0.035, 0.035], [0.9, 0.075, 0.25, 0.028, 0.028], [1, 0.05, 0.23, 0.015, 0.02]],
  mid: [[0, 0.54, 0.5, 0.15, 0.3], [0.3, 0.38, 0.46, 0.11, 0.2], [0.55, 0.3, 0.4, 0.09, 0.14], [0.8, 0.26, 0.34, 0.07, 0.1], [0.94, 0.21, 0.31, 0.05, 0.07], [1, 0.13, 0.3, 0.03, 0.04]],
};

export function f1car(o = {}) {
  const { era = 2022, body = "#FFA51F", accent = "#16171B", stripe = "#F4F4F4", style = "split", team = "RACELIMIT", compound = "#FFD23F", compoundName = "C4 · SOFT", number = "27", helmet = ["#FFA51F", "#16171B"], tcam = "#111", damage = {}, aero = "corner", drs = false, wheel = true } = o;
  const E = ERAS[era], g = new THREE.Group();
  const onWing = E.fw === "swept" || E.fw === "active", noseIn = onWing ? 0.33 : 0.14;
  const zf = E.wb / 2, zr = -E.wb / 2, ck = zf - 1.55, tipZ = zf + E.fo - noseIn, tailZ = zr - E.ro + 0.22;
  g.userData = { era, ck, zf, zr, E };
  const liv = new THREE.MeshPhysicalMaterial({ map: liveryMap({ body, accent, stripe, style }), roughness: 0.38, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.1, envMapIntensity: 0.75 });
  const paint = new THREE.MeshPhysicalMaterial({ color: body, roughness: 0.38, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.1, envMapIntensity: 0.75, side: THREE.DoubleSide });
  const dark = new THREE.MeshPhysicalMaterial({ color: accent, roughness: 0.42, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.15, envMapIntensity: 0.7, side: THREE.DoubleSide });
  const black = new THREE.MeshStandardMaterial({ color: 0x07080A, roughness: 0.85, side: THREE.DoubleSide });
  const isC = (m) => m === carbon || m === carbonMatte;
  const add = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { if (isC(m)) boxUV(geo); const ob = new THREE.Mesh(geo, m); ob.position.set(x, y, z); ob.rotation.set(rx, ry, rz); ob.castShadow = ob.receiveShadow = true; g.add(ob); return ob; };
  const arm = (a, b, w, h, m = carbon) => { a = new THREE.Vector3(...a); b = new THREE.Vector3(...b); const geo = new RoundedBoxGeometry(w, h, a.distanceTo(b), 2, Math.min(w, h) / 2.2); const ob = new THREE.Mesh(isC(m) ? boxUV(geo) : geo, m); ob.position.copy(a).lerp(b, 0.5); ob.lookAt(b); ob.castShadow = true; g.add(ob); return ob; };
  const old = era < 2017, narrow = E.tf < 0.75;

  // ---- tub, nose and engine cover ----
  const rs = (ck - tailZ) / (0.25 + 2.56), RZ = (z) => ck + (z - 0.25) * rs;
  const keys = [
    { z: RZ(-2.56), w: 0.16, yc: 0.36, ht: 0.07, hb: 0.07 },
    { z: RZ(-2.25), w: 0.26, yc: 0.4, ht: 0.12, hb: 0.12 },
    { z: RZ(-1.8), w: 0.34, yc: 0.47, ht: 0.2, hb: 0.28, n: 2.6 },
    { z: RZ(-1.25), w: 0.44, yc: 0.53, ht: 0.27, hb: 0.37, n: 2.8 },
    { z: RZ(-0.7), w: 0.52, yc: 0.57, ht: 0.3, hb: 0.44, n: 2.8, tw: 0.5 },
    { z: RZ(-0.25), w: 0.66, yc: 0.57, ht: 0.25, hb: 0.45, n: 3.2, tw: 0.62 },
    { z: ck, w: 0.74, yc: 0.55, ht: 0.22, hb: 0.43, n: 3.6 },
    { z: ck + 0.45, w: 0.64, yc: 0.49, ht: 0.15, hb: 0.37, n: 3.4 },
  ];
  const n0 = ck + 0.9;
  for (const [t, w, yc, ht, hb] of NOSES[E.nose]) keys.push({ z: n0 + (tipZ - n0) * t, w, yc, ht, hb, n: 2.4 + (1 - t) * 0.8 });
  const secAt = (z) => { const k = keys; if (z <= k[0].z) return k[0]; for (let i = 0; i < k.length - 1; i++) if (z <= k[i + 1].z) { const f = (z - k[i].z) / (k[i + 1].z - k[i].z), o = {}; for (const q of ["w", "yc", "ht", "hb"]) o[q] = k[i][q] + (k[i + 1][q] - k[i][q]) * f; return o; } return k[k.length - 1]; };
  const inHole = (x, y, z) => y > 0.66 && ((z - (ck - 0.01)) / 0.355) ** 2 + (x / (z > ck ? 0.17 : 0.19)) ** 2 < 1;
  add(loft(keys, { R: 80, per: 8, hole: inHole }), liv);
  // airbox / roll hoop
  const ab = E.airbox, camM = new THREE.MeshPhysicalMaterial({ color: tcam, roughness: 0.3, clearcoat: 0.8 });
  let inletKey, crest;
  if (E.hoop === "blade") {
    // tall, narrow roll structure: a rounded-triangle intake at the front, sides falling away into the engine cover
    inletKey = { z: ck - 0.42, w: 0.2, yc: 0.935, ht: 0.135, hb: 0.11, n: 2.4, tw: 0.1 };
    add(loft([{ z: ck - 1.8, w: 0.1, yc: 0.72, ht: 0.03, hb: 0.08 }, { z: ck - 1.25, w: 0.2, yc: 0.84, ht: 0.07, hb: 0.15, n: 2.6, tw: 0.4 }, { z: ck - 0.8, w: 0.21, yc: 0.92, ht: 0.12, hb: 0.15, n: 2.4, tw: 0.14 }, inletKey], { R: 64, per: 6 }), liv);
    crest = [inletKey.yc + inletKey.ht, ck - 0.5];
  } else {
    inletKey = { z: ck - 0.4, w: 0.22, yc: ab - 0.09, ht: 0.11, hb: 0.075, n: 2.6, tw: 0.22 };
    add(loft([{ z: ck - 1.6, w: 0.1, yc: ab - 0.2, ht: 0.03, hb: 0.06 }, { z: ck - 1.1, w: 0.24, yc: ab - 0.12, ht: 0.07, hb: 0.13, n: 2.6, tw: 0.5 }, { z: ck - 0.62, w: 0.27, yc: ab - 0.095, ht: 0.105, hb: 0.11, n: 2.6, tw: 0.3 }, inletKey], { R: 56, per: 6 }), liv);
    crest = [ab + 0.02, ck - 0.55];
    if (E.ears) for (const s of [-1, 1]) { // small side inlets for the coolers (2014–21)
      add(loft([{ z: ck - 0.95, x: s * 0.15, w: 0.02, yc: ab - 0.17, ht: 0.01, hb: 0.01 }, { z: ck - 0.65, x: s * 0.15, w: 0.07, yc: ab - 0.17, ht: 0.04, hb: 0.03, n: 2.6 }, { z: ck - 0.5, x: s * 0.15, w: 0.07, yc: ab - 0.17, ht: 0.04, hb: 0.03, n: 2.6 }], { R: 24, per: 4 }), liv);
      add(new THREE.CircleGeometry(1, 20).scale(0.028, 0.03, 1), black, s * 0.15, ab - 0.17, ck - 0.495);
    }
  }
  { // inlet opening with a dark frame (the roll structure) around it
    const sh = new THREE.Shape(); ring({ ...DEF, ...inletKey, x: 0, yc: 0, w: inletKey.w * 0.78, ht: inletKey.ht * 0.78, hb: inletKey.hb * 0.78 }, 48).forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
    add(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 1 }), 0, inletKey.yc, inletKey.z + 0.003);
    const lip = ring({ ...DEF, ...inletKey, x: 0, w: inletKey.w * 0.88, ht: inletKey.ht * 0.88, hb: inletKey.hb * 0.88 }, 48).map(([x, y]) => new THREE.Vector3(x, y, inletKey.z + 0.004));
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lip, true), 64, E.hoop === "blade" ? 0.016 : 0.011, 8, true), E.hoop === "blade" ? dark : liv);
  }
  // T-camera
  if (era < 2009) {
    const [ty, tz] = crest; const tc = loft([{ z: tz - 0.18, w: 0.016, yc: ty + 0.02, ht: 0.005, hb: 0.005 }, { z: tz - 0.08, w: 0.07, yc: ty + 0.02, ht: 0.022, hb: 0.02, n: 2.4 }, { z: tz + 0.04, w: 0.08, yc: ty + 0.022, ht: 0.026, hb: 0.022, n: 2.6 }, { z: tz + 0.08, w: 0.03, yc: ty + 0.022, ht: 0.008, hb: 0.008 }], { R: 32, per: 6 });
    add(tc, camM);
  } else {
    // the modern "T": a small aerofoil bar on a short neck, with two camera pods sitting on top
    const [ty, tz] = crest;
    add(loft([{ z: tz - 0.1, w: 0.018, yc: ty + 0.015, ht: 0.02, hb: 0.02, n: 2.2 }, { z: tz, w: 0.026, yc: ty + 0.018, ht: 0.024, hb: 0.024, n: 2.2 }, { z: tz + 0.05, w: 0.018, yc: ty + 0.02, ht: 0.02, hb: 0.02, n: 2.2 }], { R: 20, per: 4 }), camM);
    add(wing(span(-0.13, 0.13, 10, (x) => ({ y: ty + 0.045 - Math.abs(x) * 0.04, z: tz + 0.06, c: 0.085, a: 0.04, t: 0.14 })), { P: 10, camber: 0.02 }), camM);
    for (const s of [-1, 1]) { add(new RoundedBoxGeometry(0.02, 0.026, 0.05, 2, 0.008), camM, s * 0.055, ty + 0.064, tz + 0.03); add(new THREE.CircleGeometry(0.006, 12), new THREE.MeshStandardMaterial({ color: 0x050507, metalness: 0.8, roughness: 0.05 }), s * 0.055, ty + 0.066, tz + 0.0555); }
  }
  // fin
  if (E.fin === "big") { add(plate([[ck - 0.6, ab + 0.02], [tailZ - 0.2, 0.98], [tailZ - 0.25, 0.6], [ck - 1.6, 0.7], [ck - 0.7, 0.86]], 0.012), paint); }
  else if (E.fin === "small") add(plate([[ck - 0.7, ab + 0.02], [tailZ + 0.55, 0.85], [tailZ + 0.35, 0.72], [tailZ + 0.34, 0.5], [ck - 1.55, 0.7], [ck - 0.75, 0.86]], 0.012), paint);
  if (E.fin) for (const s of [-1, 1]) add(new THREE.PlaneGeometry(0.34, 0.1), decal(number, { color: "#FFFFFF", w: 256, h: 96, font: "700 86px BC", italic: true }), s * 0.009, 0.85, ck - 1.7, 0, s * Math.PI / 2, 0).castShadow = false;

  // ---- sidepods ----
  const P = (z, x, w, yc, ht, hb, n, bw) => ({ z, x, w, yc, ht, hb, n, bw });
  for (const s of [-1, 1]) {
    let podKeys, inlet;
    if (E.pods === "ground") {
      podKeys = [P(tailZ + 0.95, 0.28, 0.1, 0.26, 0.03, 0.07, 3, 1), P(tailZ + 1.27, 0.36, 0.2, 0.29, 0.04, 0.1, 3.4, 0.7), P(ck - 1.2, 0.44, 0.3, 0.35, 0.05, 0.15, 4, 0.55), P(ck - 0.8, 0.5, 0.4, 0.43, 0.065, 0.2, 4.6, 0.42), P(ck - 0.35, 0.55, 0.47, 0.51, 0.08, 0.23, 5.2, 0.32), P(ck + 0.1, 0.57, 0.48, 0.575, 0.08, 0.21, 5.6, 0.27), P(ck + 0.4, 0.57, 0.42, 0.615, 0.075, 0.13, 5.2, 0.4), P(ck + 0.55, 0.55, 0.32, 0.63, 0.062, 0.07, 4.2, 0.8)];
      inlet = { z: ck + 0.553, y: 0.63, w: 0.26, ht: 0.045, hb: 0.045 };
    } else if (E.pods === "tapered") {
      podKeys = [P(tailZ + 0.95, 0.27, 0.1, 0.26, 0.04, 0.08, 3, 1), P(tailZ + 1.3, 0.34, 0.2, 0.3, 0.07, 0.15, 3.4, 0.8), P(ck - 1.1, 0.44, 0.32, 0.37, 0.12, 0.24, 3.8, 0.75), P(ck - 0.55, 0.53, 0.42, 0.44, 0.17, 0.3, 4.2, 0.72), P(ck - 0.05, 0.57, 0.42, 0.5, 0.2, 0.36, 4.6, 0.72), P(ck + 0.2, 0.57, 0.38, 0.53, 0.18, 0.34, 4.6, 0.75)];
      inlet = { z: ck + 0.205, y: 0.6, w: 0.26, ht: 0.1, hb: 0.06 };
    } else {
      const x = narrow ? 0.5 : 0.55;
      podKeys = [P(tailZ + 0.95, 0.27, 0.12, 0.27, 0.05, 0.1, 3, 1), P(tailZ + 1.35, 0.34, 0.24, 0.31, 0.1, 0.18, 3.6, 1), P(ck - 1.05, x - 0.05, 0.36, 0.38, 0.17, 0.27, 4.6, 1), P(ck - 0.5, x, 0.44, 0.42, 0.2, 0.31, 5, 1), P(ck + 0.15, x, 0.46, 0.43, 0.21, 0.32, 5.2, 1), P(ck + 0.45, x, 0.44, 0.44, 0.19, 0.3, 5, 1)];
      inlet = { z: ck + 0.455, y: 0.47, w: 0.34, ht: 0.13, hb: 0.17 };
    }
    podKeys = podKeys.map((k) => ({ ...k, x: s * k.x }));
    add(loft(podKeys, { R: 64, per: 6 }), liv);
    const last = podKeys[podKeys.length - 1];
    const mouth = new THREE.Shape(); ring({ ...DEF, x: 0, w: inlet.w, yc: 0, ht: inlet.ht, hb: inlet.hb, n: 5, bw: 0.85, z: 0 }, 40).forEach(([x, y], i) => (i ? mouth.lineTo(x, y) : mouth.moveTo(x, y)));
    add(new THREE.ShapeGeometry(mouth), black, last.x, inlet.y, inlet.z);
    const mid = podKeys.reduce((a, k) => (Math.abs(k.x) + k.w / 2 > Math.abs(a.x) + a.w / 2 ? k : a));
    if (E.pods === "ground") {
      const lipR = ring({ ...DEF, x: 0, w: inlet.w + 0.03, yc: 0, ht: inlet.ht + 0.012, hb: inlet.hb + 0.012, n: 5, bw: 0.85, z: 0 }, 40).map(([x, y]) => new THREE.Vector3(last.x + x, inlet.y + y, inlet.z + 0.006 + Math.max(0, y) * 0.25)); // top of the lip leans forward
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lipR, true), 64, 0.012, 8, true), liv);
      for (let k = 0; k < 4; k++) add(new RoundedBoxGeometry(0.13, 0.008, 0.026, 1, 0.003), black, s * (Math.abs(mid.x) + 0.02), 0.6 - k * 0.012, ck - 0.5 - k * 0.06, -0.32); // cooling gills
      if (E.boards) for (let k = 0; k < 3; k++) { const bz = ck + 0.72 + k * 0.05, bx = 0.6 + k * 0.08; const bd = add(plate([[bz - 0.16, 0.09], [bz + 0.16, 0.09], [bz + 0.12, 0.22 + k * 0.02], [bz - 0.1, 0.27 + k * 0.02]], 0.008), carbon, s * bx, 0, 0); bd.rotation.y = s * 0.22; } // wheel-wake boards (2026)
      if (E.fences) for (let k = 0; k < 4; k++) add(plate([[ck + 0.85, 0.06], [ck + 1.12, 0.06], [ck + 1.1, 0.13], [ck + 0.88, 0.12]], 0.006), carbon, s * (0.28 + k * 0.1), 0, 0).rotation.y = s * (0.05 + k * 0.04); // floor fences
    } else for (let k = 0; k < 5; k++) add(new RoundedBoxGeometry(0.18, 0.012, 0.035, 1, 0.005), black, s * (Math.abs(last.x) - 0.02), last.yc + last.ht - 0.02 - k * 0.014, ck - 0.4 - k * 0.07, -0.25);
    add(new THREE.PlaneGeometry(0.62, 0.11), decal(team, { color: stripe, w: 512, h: 96, font: "700 78px BC" }), s * (Math.abs(mid.x) + mid.w / 2 + 0.004), mid.yc, mid.z - 0.05, 0, s * Math.PI / 2, 0).castShadow = false;
    if (E.chimneys) { add(new RoundedBoxGeometry(0.1, 0.16, 0.16, 2, 0.03), liv, s * 0.5, 0.66, ck - 0.85); add(new THREE.CylinderGeometry(0.035, 0.04, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x6E5E52, metalness: 1, roughness: 0.35 }), s * 0.42, 0.66, ck - 1.15); }
    // mirrors
    const mz = E.halo ? ck + 0.2 : ck + 0.3, mx = E.halo ? 0.56 : 0.47, my = E.halo ? 0.83 : 0.78;
    const hous = loft([{ z: mz + 0.07, x: s * mx, w: 0.12, yc: my, ht: 0.012, hb: 0.012, n: 2.4 }, { z: mz + 0.04, x: s * mx, w: 0.19, yc: my, ht: 0.03, hb: 0.03, n: 3.2 }, { z: mz, x: s * mx, w: 0.2, yc: my, ht: 0.036, hb: 0.036, n: 4 }, { z: mz - 0.022, x: s * mx, w: 0.2, yc: my, ht: 0.036, hb: 0.036, n: 4.4 }], { R: 40, per: 5 });
    add(hous, dark);
    add(new THREE.PlaneGeometry(0.18, 0.062), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.02 }), s * mx, my, mz - 0.0225, 0, Math.PI, 0);
    add(sweep([new THREE.Vector3(s * (mx - 0.07), my - 0.03, mz + 0.01), new THREE.Vector3(s * (mx - 0.13), my - 0.02, mz + 0.0), new THREE.Vector3(s * (E.halo ? 0.37 : 0.4), E.halo ? 0.86 : 0.7, E.halo ? ck + 0.02 : mz + 0.05)], 0.008, 0.016, 16, 8), carbon);
    add(sweep([new THREE.Vector3(s * (mx + 0.04), my - 0.035, mz + 0.01), new THREE.Vector3(s * (mx + 0.03), 0.74, mz + 0.06), new THREE.Vector3(s * (mx - 0.02), E.pods === "ground" ? 0.66 : 0.63, mz + 0.12)], 0.007, 0.018, 16, 8), carbon);
    add(wing(span(s > 0 ? mx - 0.08 : -mx - 0.08, s > 0 ? mx + 0.08 : -mx + 0.08, 4, () => ({ y: my - 0.055, z: mz + 0.05, c: 0.07, a: 0.15, t: 0.08 }))), carbon);
    if (E.horns) { const hn = add(plate([[ck + 0.05, 0.62], [ck - 0.12, 0.62], [ck - 0.14, 0.76], [ck + 0.02, 0.72]], 0.01), paint, s * 0.34, 0, 0); hn.rotation.z = s * 0.25; add(wing(span(s > 0 ? 0.3 : -0.42, s > 0 ? 0.42 : -0.3, 4, () => ({ y: 0.76, z: ck - 0.02, c: 0.12, a: 0.3, t: 0.08 }))), paint); }
    if (E.flipups) { add(wing(span(s > 0 ? 0.42 : -0.6, s > 0 ? 0.6 : -0.42, 6, () => ({ y: 0.58, z: zr + 0.62, c: 0.13, a: 0.45, t: 0.08 }))), carbon); add(plate([[zr + 0.66, 0.5], [zr + 0.48, 0.5], [zr + 0.48, 0.66], [zr + 0.64, 0.62]], 0.008), carbon, s * 0.6, 0, 0); }
    // bargeboards in front of the pods
    if (E.bargeboards) for (let k = 0; k < (era >= 2017 ? 5 : 3); k++) { const zb = ck + 0.55 + k * 0.1, xb = 0.42 + k * 0.06; const pl = add(plate([[zb, 0.08], [zb + 0.38, 0.08], [zb + 0.34, era >= 2017 ? 0.42 : 0.32], [zb + 0.05, era >= 2017 ? 0.38 : 0.28]], 0.008), carbon, s * xb, 0, 0); pl.rotation.y = s * 0.12; }
  }

  // ---- cockpit, headrest, driver (sits lower: only the top of the helmet shows) ----
  add(loft([{ z: ck - 0.4, w: 0.4, yc: 0.6, ht: 0.2, hb: 0.16, n: 3 }, { z: ck + 0.1, w: 0.38, yc: 0.58, ht: 0.18, hb: 0.15, n: 3 }, { z: ck + 0.38, w: 0.3, yc: 0.5, ht: 0.12, hb: 0.1, n: 3 }], { R: 40, per: 4, hole: (x, y) => y > 0.64 && Math.abs(x) < 0.15 }), new THREE.MeshStandardMaterial({ color: 0x0B0C0E, roughness: 0.95, side: THREE.DoubleSide }));
  { const rim = []; for (let k = 0; k <= 48; k++) { const a = (k / 48) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); const zz = ck - 0.01 + sn * 0.37, hw = 0.2 * (sn > 0 ? 1 - 0.32 * sn ** 2 : 1); rim.push(new THREE.Vector3(Math.sign(c) * Math.abs(c) ** 0.6 * hw, 0.787 - Math.max(0, sn) ** 1.2 * 0.115, zz)); } add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 96, 0.011, 10, true), new THREE.MeshStandardMaterial({ color: 0x18191C, roughness: 0.9 })); }
  add(sweep([new THREE.Vector3(-0.19, 0.77, ck - 0.1), new THREE.Vector3(-0.19, 0.795, ck - 0.2), new THREE.Vector3(-0.15, 0.81, ck - 0.31), new THREE.Vector3(0, 0.82, ck - 0.36), new THREE.Vector3(0.15, 0.81, ck - 0.31), new THREE.Vector3(0.19, 0.795, ck - 0.2), new THREE.Vector3(0.19, 0.77, ck - 0.1)], 0.045, 0.05, 48, 14), new THREE.MeshStandardMaterial({ color: 0x1B1C20, roughness: 0.8 }));
  const hm = new THREE.MeshPhysicalMaterial({ map: helmetMap(...helmet), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
  const hy = 0.79, hz = ck - 0.15;
  const helm = add(new THREE.SphereGeometry(0.14, 40, 28), hm, 0, hy, hz); helm.rotation.y = Math.PI / 2; helm.scale.set(1.13, 0.95, 1); helm.userData.helmet = true;
  const vis = add(new THREE.SphereGeometry(0.143, 40, 20, -Math.PI * 0.32, Math.PI * 0.64, Math.PI * 0.4, Math.PI * 0.17), new THREE.MeshPhysicalMaterial({ color: 0x0A0A0C, roughness: 0.03, metalness: 0.7, clearcoat: 1 }), 0, hy, hz, -0.12, 0, 0); vis.scale.set(1.01, 0.96, 1.14); vis.userData.helmet = true;
  // steering wheel: a real-style wheel — printed face with labelled buttons, six rotaries, shift lights, a busy screen, grips and paddles
  if (wheel) {
    const sw = buildWheel(helmet); sw.position.set(0, 0.645, ck + 0.27); sw.rotation.set(0.6, Math.PI, 0); g.add(sw);
    sw.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.wheel = true; } });
    g.userData.steering = sw;
    for (const s of [-1, 1]) arm([s * 0.18, 0.66, ck - 0.14], [s * 0.13, 0.64, ck + 0.22], 0.062, 0.062, new THREE.MeshStandardMaterial({ color: helmet[1] === "#16171B" ? 0x22252B : helmet[1], roughness: 0.85 })).userData.wheel = true;
  }
  // halo
  if (E.halo) {
    const hp = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.36, 0.72, ck - 0.3), new THREE.Vector3(-0.36, 0.89, ck - 0.02), new THREE.Vector3(-0.26, 0.96, ck + 0.3), new THREE.Vector3(0, 0.98, ck + 0.44), new THREE.Vector3(0.26, 0.96, ck + 0.3), new THREE.Vector3(0.36, 0.89, ck - 0.02), new THREE.Vector3(0.36, 0.72, ck - 0.3)]);
    add(sweep(hp.getPoints(40), 0.042, 0.024, 96, 18), dark);
    add(sweep([new THREE.Vector3(0, 0.975, ck + 0.42), new THREE.Vector3(0, 0.93, ck + 0.55), new THREE.Vector3(0, 0.82, ck + 0.64), new THREE.Vector3(0, 0.7, ck + 0.7)], 0.022, 0.034, 24, 12), dark);
    for (const s of [-1, 1]) add(sweep([new THREE.Vector3(s * 0.35, 0.74, ck - 0.29), new THREE.Vector3(s * 0.36, 0.7, ck - 0.34), new THREE.Vector3(s * 0.33, 0.64, ck - 0.38)], 0.03, 0.03, 8, 10), dark);
  }

  // ---- floor, plank, diffuser ----
  const fx = (E.tf + 0.09) / 0.9, fz0 = tailZ + 0.4, fz1 = ck + 1.1;
  const fl = new THREE.Shape(); const F = (x, z) => [x * fx, z];
  const pts = [F(-0.5, fz0), F(0.5, fz0), F(0.86, fz0 + 0.8), F(0.9, fz1 - 0.9), F(0.5, fz1), F(-0.5, fz1), F(-0.9, fz1 - 0.9), F(-0.86, fz0 + 0.8)];
  fl.moveTo(...pts[0]); for (const p of pts.slice(1)) fl.lineTo(...p);
  const flG = new THREE.ExtrudeGeometry(fl, { depth: 0.025, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.008, bevelSegments: 2 }); flG.rotateX(Math.PI / 2);
  { const uv = flG.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 10, uv.getY(i) * 10); flG.userData.uvDone = true; }
  add(flG, carbonMatte, 0, 0.1, 0);
  add(new THREE.BoxGeometry(0.3, 0.012, fz1 - fz0 - 0.6), new THREE.MeshStandardMaterial({ color: 0x9C7A4E, roughness: 0.9 }), 0, 0.066, (fz0 + fz1) / 2);
  if (E.pods === "ground") for (const s of [-1, 1]) { const ew = new THREE.Mesh(boxUV(new RoundedBoxGeometry(0.03, 0.05, 1.6, 2, 0.012)), carbon); ew.position.set(s * 0.87 * fx, 0.15, ck - 0.7); ew.rotation.z = s * 0.5; g.add(ew); }
  add(new RoundedBoxGeometry(0.98 * fx, 0.03, 0.55, 2, 0.01), carbonMatte, 0, 0.17, tailZ + 0.25, -0.42);
  for (const x of [-0.42, -0.2, 0.2, 0.42]) add(new THREE.BoxGeometry(0.008, 0.2, 0.5), carbonMatte, x * fx, 0.18, tailZ + 0.27, -0.2);
  add(new THREE.CylinderGeometry(0.048, 0.052, 0.22, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x6E5E52, metalness: 1, roughness: 0.32, side: THREE.DoubleSide }), 0, 0.45, tailZ + 0.11, Math.PI / 2);
  const rainM = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xFF1010, emissiveIntensity: damage.rain ? 3 : 0.2 });
  if (era >= 2026) add(new THREE.TorusGeometry(0.04, 0.009, 8, 32), rainM, 0, 0.36, tailZ - 0.01); else add(new RoundedBoxGeometry(0.12, 0.05, 0.02, 2, 0.008), rainM, 0, 0.37, tailZ - 0.01);

  // ---- front wing ----
  const fwZ = tipZ + noseIn; // leading edge
  const elems = (list, W) => { for (const e of list) { const st = (x) => { const r = Math.min(1, Math.abs(x) / W); return { y: e.y0 + (e.dy ?? 0) * r ** 3 + (e.mid ?? 0) * (1 - r) ** 1.5, z: e.z0 - (e.sweep ?? 0.08) * r * r, c: e.c * (1 - (e.taper ?? 0.15) * r), a: e.a0 + (e.da ?? 0) * r * r, t: 0.09 }; }; if (!e.from) add(wing(span(-W, W, 40, st)), e.mat); else for (const s of [-1, 1]) add(wing(span(s > 0 ? e.from : -W, s > 0 ? W : -e.from, 24, st)), e.mat); } };
  if (damage.frontWing !== false) {
    if (E.fw === "swept" || E.fw === "active") {
      const act = E.fw === "active", open = act && aero === "straight", W = act ? 0.93 : 0.98;
      const els = cascade(W, { z0: fwZ, chords: act ? [0.33, 0.17, 0.13, 0.1] : [0.35, 0.17, 0.13, 0.1], open: open ? [0, 0, 0.75, 0.75] : [0, 0, 0, 0] });
      const mats = [carbon, carbon, paint, dark];
      els.forEach((parts, k) => parts.forEach((st) => st.length > 1 && add(wing(st, { P: 14, camber: 0.06 }), mats[k])));
      // endplate: wraps the tips of all four elements, low at the front and tall at the back, canted out a little
      for (const s of [-1, 1]) {
        const tipSt = els.map((parts) => { const st = parts[parts.length - 1]; return s > 0 ? st[st.length - 1] : parts[0][0]; });
        const m = tipSt[0], t3 = tipSt[3], te = (q) => [q.z - q.c * Math.cos(q.a), q.y + q.c * Math.sin(q.a)];
        const [tz, ty] = te(t3);
        const pl = add(plate([[m.z + 0.02, m.y - 0.035], [tz - 0.06, m.y - 0.035], [tz - 0.07, ty - 0.02], [tz - 0.02, ty + 0.035], [t3.z + 0.02, t3.y + 0.04], [tipSt[1].z + 0.02, tipSt[1].y + 0.04], [m.z + 0.04, m.y + 0.03]], 0.01), carbon, s * (W + 0.006), 0, 0);
        pl.rotation.z = -s * 0.06;
        const cu = add(plate([[m.z + 0.03, 0], [tz - 0.04, 0], [tz - 0.05, 0.06], [m.z + 0.06, 0.045]], 0.008), carbon, s * (W + 0.012), m.y - 0.035, 0); cu.rotation.z = -s * 1.15; // foot curling outwards
        add(wing([{ x: s * (W - 0.1), y: m.y - 0.03, z: m.z - 0.05, c: 0.3, a: 0.02, t: 0.05 }, { x: s * (W + 0.02), y: m.y - 0.03, z: m.z - 0.05, c: 0.3, a: 0.02, t: 0.05 }], { P: 8 }), carbon); // footplate
      }
    } else if (E.fw === "wide") {
      const W = E.fwW;
      elems([{ y0: 0.075, z0: fwZ, c: 0.3, a0: 0.04, sweep: 0.03, taper: 0, mat: carbon }, { y0: 0.115, dy: 0.05, z0: fwZ - 0.24, c: 0.2, a0: 0.35, da: 0.15, from: 0.27, sweep: 0.02, taper: 0, mat: paint }, { y0: 0.17, dy: 0.07, z0: fwZ - 0.38, c: 0.15, a0: 0.65, da: 0.15, from: 0.32, sweep: 0.02, taper: 0, mat: dark }, { y0: 0.225, dy: 0.08, z0: fwZ - 0.48, c: 0.11, a0: 0.95, da: 0.1, from: 0.4, sweep: 0.02, taper: 0, mat: carbon }], W);
      for (const s of [-1, 1]) { add(plate([[fwZ - 0.5, 0.02], [fwZ + 0.03, 0.02], [fwZ + 0.03, 0.15], [fwZ - 0.12, 0.25], [fwZ - 0.5, 0.25]], 0.012), paint, s * (W + 0.006), 0, 0); add(new THREE.BoxGeometry(0.12, 0.01, 0.62), carbon, s * (W - 0.05), 0.03, fwZ - 0.29); if (era >= 2017) for (const yy of [0.14, 0.24]) add(new THREE.BoxGeometry(0.14, 0.008, 0.12), carbon, s * (W + 0.07), yy, fwZ - 0.05, 0.25); }
    } else {
      const W = 0.72;
      elems([{ y0: 0.09, mid: 0.08, z0: fwZ, c: 0.28, a0: 0.06, sweep: 0.02, taper: 0, mat: carbon }, { y0: 0.14, mid: 0.08, z0: fwZ - 0.24, c: 0.17, a0: 0.45, sweep: 0.02, taper: 0, mat: paint }], W);
      for (const s of [-1, 1]) add(plate([[fwZ - 0.4, 0.04], [fwZ + 0.03, 0.04], [fwZ + 0.03, 0.15], [fwZ - 0.1, 0.22], [fwZ - 0.4, 0.22]], 0.012), paint, s * (W + 0.006), 0, 0);
    }
    // nose to wing: pylons on the older cars; on 2022+ cars the nose sits on the middle element with two short mountings
    const noseLow = E.nose === "high" || E.nose === "mid";
    if (onWing) for (const s of [-1, 1]) add(new RoundedBoxGeometry(0.014, 0.05, 0.1, 2, 0.005), carbon, s * 0.045, 0.125, tipZ + 0.0);
    else for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.018, noseLow ? 0.3 : 0.14, 0.2), carbon, s * 0.08, noseLow ? 0.28 : 0.18, fwZ - 0.3);
  }
  // rear wing
  const rwZ = tailZ - 0.06;
  const tip = (x, W, lim, drop) => (Math.abs(x) > lim ? ((Math.abs(x) - lim) / (W - lim)) ** 2 * drop : 0);
  const ep = (W, pts, m = carbon) => { for (const s of [-1, 1]) add(plate(pts, 0.016), m, s * W, 0, 0); };
  const louvres = (W, z0, y0, n) => { for (const s of [-1, 1]) for (let k = 0; k < n; k++) add(new THREE.BoxGeometry(0.004, 0.008, 0.16), black, s * (W + 0.01), y0 + k * 0.035, z0); };
  if (E.rw === "spoon" || E.rw === "active") {
    const act = E.rw === "active", open = act ? aero === "straight" : drs;
    const W = act ? 0.5 : 0.52;
    // main plane: on 2022–25 cars its tips curl down into the endplates; 2026 cars have flat endplates
    if (act) {
      add(wing(span(-W, W, 30, () => ({ y: 0.87, z: rwZ, c: 0.36, a: open ? 0.04 : 0.14, t: 0.1 })), { P: 14, camber: 0.07 }), carbon);
      ep(W + 0.008, [[rwZ + 0.05, 0.52], [rwZ - 0.48, 0.52], [rwZ - 0.54, 0.64], [rwZ - 0.55, 0.99], [rwZ - 0.48, 1.05], [rwZ - 0.1, 1.05], [rwZ + 0.02, 1.0], [rwZ + 0.06, 0.92]]);
    } else add(wing(rollWing(W, { y0: 0.89, z: rwZ, c: 0.38, a: open ? 0.03 : 0.13, R: 0.1, drop: 0.3 }), { P: 14, camber: 0.07 }), carbon);
    // top flap (DRS / straight mode opens it)
    const flapA = open ? 0.06 : 0.62, fZ = rwZ - 0.3, fY = 0.89 + (open ? 0.085 : 0.05);
    add(wing(span(-(W - 0.02), W - 0.02, 30, (x) => ({ y: fY - (Math.abs(x) > W - 0.12 ? ((Math.abs(x) - (W - 0.12)) / 0.1) ** 2 * 0.03 : 0), z: fZ, c: 0.22, a: flapA, t: 0.09 })), { P: 12, camber: 0.05 }), paint);
    // the main plane's rolled tips form the endplates; the trailing part of each carries a rain light
    for (const sg of [-1, 1]) add(new THREE.BoxGeometry(0.012, 0.18, 0.02), new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xFF1010, emissiveIntensity: damage.rain ? 2.5 : 0.12 }), sg * (W + 0.02), 0.62, rwZ - 0.36);
  } else if (E.rw === "low") {
    const W = 0.525;
    add(wing(span(-W, W, 24, () => ({ y: 0.8, z: rwZ, c: 0.4, a: 0.1, t: 0.1 }))), carbon);
    add(wing(span(-W, W, 24, () => ({ y: 0.92, z: rwZ - 0.3, c: 0.24, a: drs ? 0.05 : 0.6, t: 0.09 }))), paint);
    ep(W + 0.008, [[rwZ + 0.1, 0.45], [rwZ - 0.55, 0.45], [rwZ - 0.6, 1.06], [rwZ - 0.1, 1.06], [rwZ + 0.12, 0.7]], paint); louvres(W + 0.008, rwZ - 0.3, 0.55, 6);
  } else if (E.rw === "tall") {
    const W = 0.375;
    add(wing(span(-W, W, 20, () => ({ y: 0.9, z: rwZ, c: 0.36, a: 0.12, t: 0.1 }))), carbon);
    add(wing(span(-W, W, 20, () => ({ y: 1.0, z: rwZ - 0.28, c: 0.22, a: drs ? 0.05 : 0.6, t: 0.09 }))), paint);
    ep(W + 0.008, [[rwZ + 0.05, 0.34], [rwZ - 0.52, 0.34], [rwZ - 0.52, 1.12], [rwZ + 0.05, 1.12]], paint); louvres(W + 0.008, rwZ - 0.2, 0.45, 8);
  } else {
    const W = 0.5;
    for (const [y, z, c, a] of [[0.8, rwZ, 0.3, 0.12], [0.86, rwZ - 0.22, 0.18, 0.5], [0.93, rwZ - 0.34, 0.12, 0.85]]) add(wing(span(-W, W, 20, () => ({ y, z, c, a, t: 0.1 }))), y > 0.82 ? paint : carbon);
    ep(W + 0.008, [[rwZ + 0.08, 0.42], [rwZ - 0.5, 0.42], [rwZ - 0.5, 1.0], [rwZ + 0.08, 1.0]], paint);
  }
  for (const s of [-1, 1]) add(new THREE.PlaneGeometry(0.34, 0.085), decal(team, { color: s ? "#FFFFFF" : body, w: 512, h: 128, font: "700 92px BC" }), s * (E.rw === "tall" ? 0.392 : E.rw === "low" ? 0.542 : E.rw === "active" ? 0.528 : 0.548), E.rw === "spoon" || E.rw === "active" ? 0.66 : 0.84, rwZ - 0.17, 0, s * Math.PI / 2, 0).castShadow = false;
  if (E.beam) { add(wing(span(-0.45, 0.45, 16, () => ({ y: 0.53, z: rwZ - 0.08, c: 0.15, a: 0.2, t: 0.1 }))), carbon); add(wing(span(-0.45, 0.45, 16, () => ({ y: 0.61, z: rwZ - 0.24, c: 0.12, a: 0.5, t: 0.1 }))), carbon); }
  if (E.twing) { add(wing(span(-0.26, 0.26, 10, () => ({ y: 1.0, z: rwZ + 0.42, c: 0.09, a: 0.3, t: 0.1 }))), carbon); add(wing(span(-0.26, 0.26, 10, () => ({ y: 1.05, z: rwZ + 0.38, c: 0.07, a: 0.45, t: 0.1 }))), carbon); add(new THREE.BoxGeometry(0.02, 0.12, 0.06), carbon, 0, 0.96, rwZ + 0.38); }
  if (E.monkey) add(wing(span(-0.2, 0.2, 8, () => ({ y: 0.5, z: rwZ + 0.25, c: 0.12, a: 0.4, t: 0.1 }))), carbon);
  add(new RoundedBoxGeometry(0.035, 0.42, 0.12, 2, 0.012), carbon, 0, 0.66, rwZ - 0.1);
  if (E.rw === "low" || E.rw === "tall") add(new RoundedBoxGeometry(0.06, 0.07, 0.16, 2, 0.02), dark, 0, E.rw === "tall" ? 1.05 : 0.97, rwZ - 0.2);
  else if (E.rw === "spoon") add(loft([{ z: rwZ - 0.02, w: 0.01, yc: 0.95, ht: 0.005, hb: 0.005 }, { z: rwZ - 0.1, w: 0.045, yc: 0.95, ht: 0.03, hb: 0.03, n: 2.4 }, { z: rwZ - 0.3, w: 0.045, yc: 0.95, ht: 0.03, hb: 0.03, n: 2.4 }, { z: rwZ - 0.36, w: 0.01, yc: 0.95, ht: 0.005, hb: 0.005 }], { R: 24, per: 4 }), dark);
  else if (E.rw === "active") { // actuator pod on a stalk above the flap
    add(new RoundedBoxGeometry(0.022, 0.12, 0.05, 2, 0.008), dark, 0, 1.0, rwZ - 0.36);
    add(loft([{ z: rwZ - 0.24, w: 0.012, yc: 1.075, ht: 0.006, hb: 0.006 }, { z: rwZ - 0.3, w: 0.05, yc: 1.075, ht: 0.03, hb: 0.03, n: 2.4 }, { z: rwZ - 0.42, w: 0.05, yc: 1.075, ht: 0.03, hb: 0.03, n: 2.4 }, { z: rwZ - 0.46, w: 0.014, yc: 1.075, ht: 0.008, hb: 0.008 }], { R: 24, per: 4 }), paint);
  }

  // ---- wheels and suspension ----
  const rubber = new THREE.MeshStandardMaterial({ map: tyreMap(compound, compoundName, E.grooves), roughness: 0.78 });
  const rimM = new THREE.MeshStandardMaterial({ color: era < 2017 ? 0x9AA0A8 : 0x2A2D33, metalness: 0.9, roughness: 0.25 });
  const coverM = new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.3, metalness: 0.3, clearcoat: 0.8 });
  const nutM = new THREE.MeshStandardMaterial({ color: 0xE11B22, metalness: 0.6, roughness: 0.35 });
  const R = E.r, RIM = E.rim;
  const prof = (w) => { const side = R - RIM; return [[RIM + 0.002, -w / 2 + 0.012], [RIM + side * 0.15, -w / 2 - 0.002], [RIM + side * 0.45, -w / 2 - 0.009], [RIM + side * 0.72, -w / 2 - 0.005], [R - 0.012, -w / 2 + 0.012], [R - 0.004, -w / 2 + 0.035], [R - 0.001, -w / 2 + 0.07], [R, 0], [R - 0.001, w / 2 - 0.07], [R - 0.004, w / 2 - 0.035], [R - 0.012, w / 2 - 0.012], [RIM + side * 0.72, w / 2 + 0.005], [RIM + side * 0.45, w / 2 + 0.009], [RIM + side * 0.15, w / 2 + 0.002], [RIM + 0.002, w / 2 - 0.012]].map(([r, y]) => new THREE.Vector2(r, y)); };
  for (const [x, z, w, front] of [[-E.tf, zf, E.wf, true], [E.tf, zf, E.wf, true], [-E.tr, zr, E.wr, false], [E.tr, zr, E.wr, false]]) {
    const s = Math.sign(x), wg = new THREE.Group(); wg.position.set(x, R, z);
    if (front && damage.tilt && s === damage.tiltSide) { wg.rotation.z = damage.tilt; wg.rotation.y = damage.tilt * 1.6; wg.position.x += s * 0.08; }
    const tg = new THREE.LatheGeometry(prof(w), 72); tg.rotateZ(Math.PI / 2);
    const tm = new THREE.Mesh(tg, rubber); tm.castShadow = tm.receiveShadow = true; wg.add(tm);
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(RIM + 0.003, RIM + 0.003, w * 0.9, 48, 1, true), rimM); lip.rotation.z = Math.PI / 2; wg.add(lip);
    if (E.covers) { const cov = new THREE.Mesh(new THREE.CylinderGeometry(RIM - 0.001, RIM - 0.014, 0.02, 48), coverM); cov.rotation.z = Math.PI / 2; cov.position.x = s * (w / 2 - 0.02); wg.add(cov); const r2 = new THREE.Mesh(new THREE.TorusGeometry(RIM * 0.7, 0.006, 6, 48), new THREE.MeshStandardMaterial({ color: body, roughness: 0.4 })); r2.rotation.y = Math.PI / 2; r2.position.x = s * (w / 2 - 0.005); wg.add(r2); }
    else { const dish = new THREE.Mesh(new THREE.CylinderGeometry(RIM * 0.98, RIM * 0.5, 0.05, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x15161A, roughness: 0.6, side: THREE.DoubleSide })); dish.rotation.z = Math.PI / 2; dish.position.x = s * (w / 2 - 0.05); wg.add(dish); for (let k = 0; k < 10; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.012, RIM * 0.85, 0.022), rimM); const a = (k / 10) * Math.PI * 2; sp.position.set(s * (w / 2 - 0.035), Math.cos(a) * RIM * 0.5, Math.sin(a) * RIM * 0.5); sp.rotation.x = -a; wg.add(sp); } }
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 6), nutM); nut.rotation.z = Math.PI / 2; nut.position.x = s * (w / 2 + 0.005); wg.add(nut);
    const duct = new THREE.Mesh(boxUV(new THREE.CylinderGeometry(RIM * 0.85, RIM * 0.9, 0.12, 32)), carbonMatte); duct.rotation.z = Math.PI / 2; duct.position.x = -s * (w / 2 + 0.03); wg.add(duct);
    if (front && E.deflectors) { const def = new THREE.Mesh(boxUV(new THREE.CylinderGeometry(R + 0.033, R + 0.033, 0.24, 24, 1, true, Math.PI * 0.18, Math.PI * 0.42)), carbon); def.rotation.z = Math.PI / 2; def.castShadow = true; wg.add(def); }
    if (front && !E.covers && era < 2022) for (let k = 0; k < 3; k++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.006, 0.12), carbon); fin.position.set(-s * (w / 2 + 0.08), 0.06 + k * 0.05, 0.12); fin.rotation.z = s * 0.2; wg.add(fin); }
    g.add(wg);
    const ux = x - s * (w / 2 + 0.06);
    if (front && damage.tilt && s === damage.tiltSide) continue;
    // inboard ends sit on the side of the chassis (front) or gearbox (rear), worked out from the body shape at that point
    const pick = (zz, up) => { const c = front ? secAt(zz) : { w: 0.3, yc: 0.4, ht: 0.12, hb: 0.12 }; const hx = Math.max(0.06, c.w / 2 * 0.9); return up ? [s * hx, Math.min(c.yc + c.ht * 0.35, 0.62), zz] : [s * hx * 0.9, Math.max(c.yc - c.hb * 0.7, 0.16), zz]; };
    const zA = z + (front ? 0.24 : 0.22), zB = z - (front ? 0.24 : 0.26);
    arm(pick(zA, true), [ux, 0.52, z], 0.07, 0.022); arm(pick(zB, true), [ux, 0.52, z], 0.07, 0.022);
    arm(pick(zA + 0.04, false), [ux, 0.2, z], 0.07, 0.022); arm(pick(zB - 0.04, false), [ux, 0.2, z], 0.07, 0.022);
    { const c = front ? secAt(z + 0.14) : { w: 0.3, yc: 0.4 }; arm([s * c.w / 2 * 0.95, c.yc, z + (front ? 0.14 : -0.14)], [ux, 0.38, z + (front ? 0.14 : -0.14)], 0.05, 0.018); } // track rod
    { const [px, py] = pick(z - 0.06, true); arm([ux + s * 0.02, 0.24, z], [px * 0.85, py + 0.02, z - 0.06], 0.045, 0.03); } // push/pull rod
  }
  return g;
}
export const TEAMS = [
  { team: "RACELIMIT", body: "#FFA51F", accent: "#16171B", stripe: "#F4F4F4", style: "split", number: "27", helmet: ["#FFA51F", "#16171B"] },
  { team: "VELOCE", body: "#C8102E", accent: "#F2F2F2", stripe: "#111111", style: "stripe", number: "16", helmet: ["#C8102E", "#F2F2F2"] },
  { team: "KESTREL", body: "#0F4D3A", accent: "#9BE33A", stripe: "#F2F2F2", style: "fade", number: "14", helmet: ["#0F4D3A", "#9BE33A"] },
  { team: "NOVA", body: "#16B8A6", accent: "#0E0F12", stripe: "#F2F2F2", style: "chevron", number: "63", helmet: ["#16B8A6", "#0E0F12"] },
  { team: "AXIOM", body: "#16245C", accent: "#F2C230", stripe: "#E8002D", style: "dual", number: "1", helmet: ["#16245C", "#F2C230"] },
  { team: "HALCYON", body: "#F2F3F5", accent: "#121316", stripe: "#E8002D", style: "stripe", number: "31", helmet: ["#F2F3F5", "#121316"] },
  { team: "VORTEX", body: "#FF7A1A", accent: "#1C3F8C", stripe: "#7FD3FF", style: "split", number: "81", helmet: ["#FF7A1A", "#1C3F8C"] },
  { team: "ORBITA", body: "#5B2A86", accent: "#C9CED6", stripe: "#FF4FA3", style: "chevron", number: "22", helmet: ["#5B2A86", "#C9CED6"] },
  { team: "MERIDIAN", body: "#8C939E", accent: "#0B8F86", stripe: "#0E0F12", style: "split", number: "44", helmet: ["#8C939E", "#0B8F86"] },
  { team: "BRAVO", body: "#101114", accent: "#C9A23A", stripe: "#C9A23A", style: "dual", number: "10", helmet: ["#101114", "#C9A23A"] },
];

export { loft, wing, sweep, cascade, rollWing, plate, ring, DEF, tex, canvas, decal, liveryMap, tyreMap, helmetMap, carbonMatte, span, smooth };

// RaceLimit race car (from the concept car v5): built per era from research.
// z forward, y up, metres; origin on the ground at the middle of the wheelbase.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { loft, wing, sweep, cascade, rollWing, plate, ring, DEF, tex, canvas, decal, liveryMap, tyreMap, helmetMap, carbon, carbonMatte, boxUV, span } from "./car-kit.js?v=mvfe7n37";

// ---------- eras ----------
// wb wheelbase, fo front overhang to the front wing leading edge, ro rear overhang, tf/tr half track,
// r tyre radius, rim radius, wf/wr tyre widths
export const ERAS = {
  1998: { label: "1998–2008", wb: 3.05, fo: 1.0, ro: 0.8, tf: 0.71, tr: 0.69, r: 0.33, rim: 0.165, wf: 0.29, wr: 0.36, grooves: true, nose: "high98", fw: "spoon98", rw: "twoTier", pods: "box98", airbox: "oval", chimneys: true, winglets: true, barge: 3, rimCol: 0x9AA0A8 },
  2009: { label: "2009–2013", wb: 3.2, fo: 1.1, ro: 0.8, tf: 0.72, tr: 0.7, r: 0.33, rim: 0.165, wf: 0.245, wr: 0.325, nose: "high09", fw: "wide09", rw: "tall", beam: true, pods: "box", airbox: "oval", fin: "big", barge: 3, rimCol: 0x23262C },
  2014: { label: "2014–2016", wb: 3.4, fo: 1.15, ro: 0.8, tf: 0.72, tr: 0.7, r: 0.33, rim: 0.165, wf: 0.245, wr: 0.325, nose: "low16", fw: "wide14", rw: "tall", monkey: true, pods: "box", airbox: "tall", barge: 3, rimCol: 0x23262C },
  2017: { label: "2017–2021", wb: 3.6, fo: 1.25, ro: 0.85, tf: 0.81, tr: 0.79, r: 0.33, rim: 0.165, wf: 0.305, wr: 0.405, halo: true, nose: "narrow", fw: "wide19", rw: "low", beam: true, pods: "tapered", fin: "mid", barge: 6, airbox: "arch", rimCol: 0x23262C },
  2022: { label: "2022–2025", wb: 3.6, fo: 1.45, ro: 0.9, tf: 0.81, tr: 0.78, r: 0.362, rim: 0.229, wf: 0.3, wr: 0.4, covers: true, deflectors: true, halo: true, nose: "low22", fw: "swept22", rw: "spoon", beam: true, pods: "ground", fin: "small", airbox: "arch", edgeWing: true, rimCol: 0x23262C },
  2026: { label: "2026", wb: 3.4, fo: 1.38, ro: 0.86, tf: 0.78, tr: 0.76, r: 0.352, rim: 0.229, wf: 0.275, wr: 0.37, halo: true, nose: "mid26", fw: "active26", rw: "active26", pods: "ground26", fin: "small", airbox: "arch", wakeBoards: true, rimCol: 0x2A2D33 },
};

// noses: stations from the front bulkhead (zf - 0.45) to the tip, as [t 0..1 from bulkhead to tip, w, yc, ht, hb]
const NOSES = {
  high98: [[0.0, 0.42, 0.47, 0.14, 0.24], [0.3, 0.32, 0.45, 0.1, 0.15], [0.7, 0.22, 0.41, 0.07, 0.09], [0.92, 0.13, 0.39, 0.045, 0.05], [1, 0.05, 0.38, 0.02, 0.02]],
  high09: [[0.0, 0.42, 0.5, 0.13, 0.24], [0.3, 0.32, 0.5, 0.1, 0.15], [0.7, 0.24, 0.49, 0.075, 0.1], [0.92, 0.15, 0.48, 0.05, 0.06], [1, 0.06, 0.47, 0.02, 0.03]],
  low16: [[0.0, 0.42, 0.46, 0.15, 0.24], [0.3, 0.32, 0.4, 0.12, 0.16], [0.65, 0.25, 0.27, 0.08, 0.09], [0.9, 0.2, 0.21, 0.055, 0.055], [1, 0.12, 0.19, 0.03, 0.03]],
  narrow: [[0.0, 0.4, 0.48, 0.15, 0.24], [0.3, 0.28, 0.44, 0.11, 0.15], [0.7, 0.18, 0.35, 0.07, 0.08], [0.92, 0.12, 0.3, 0.045, 0.05], [1, 0.05, 0.29, 0.02, 0.02]],
  low22: [[0.0, 0.44, 0.47, 0.16, 0.25], [0.3, 0.33, 0.41, 0.13, 0.16], [0.65, 0.24, 0.31, 0.09, 0.1], [0.9, 0.15, 0.24, 0.05, 0.055], [1, 0.05, 0.21, 0.015, 0.025]],
  long26: [[0.0, 0.44, 0.47, 0.16, 0.25], [0.3, 0.33, 0.41, 0.13, 0.16], [0.65, 0.24, 0.3, 0.09, 0.1], [0.9, 0.15, 0.23, 0.05, 0.055], [1, 0.05, 0.2, 0.015, 0.025]],
  mid26: [[0.0, 0.42, 0.47, 0.16, 0.25], [0.3, 0.32, 0.42, 0.13, 0.16], [0.65, 0.24, 0.33, 0.09, 0.1], [0.9, 0.16, 0.27, 0.055, 0.06], [1, 0.06, 0.25, 0.02, 0.03]],
};
// how far the nose tip sits behind the front wing leading edge
const NOSE_BACK = { high98: 0.06, high09: 0.1, low16: 0.04, narrow: 0.1, low22: 0.02, mid26: 0.3, long26: 0.03 };

// the cross-section of a superellipse key at height y: half-width (0 if outside)
function halfWidthAt(k, y) {
  const n = k.n ?? 3, dy = y - k.yc, h = dy >= 0 ? k.ht : k.hb;
  const f = Math.abs(dy) / h; if (f >= 1) return 0;
  let w = (k.w / 2) * (1 - f ** n) ** (1 / n);
  if (dy < 0 && k.bw != null) w *= 1 - (1 - k.bw) * f ** 0.8;
  if (dy >= 0 && k.tw != null) w *= 1 - (1 - k.tw) * f ** 0.8;
  return w;
}
function keyAt(keys, z) {
  const ks = [...keys].sort((a, b) => a.z - b.z);
  if (z <= ks[0].z) return ks[0]; if (z >= ks[ks.length - 1].z) return ks[ks.length - 1];
  let i = 0; while (ks[i + 1].z < z) i++;
  const a = ks[i], b = ks[i + 1], t = (z - a.z) / (b.z - a.z), o = { z };
  for (const f of ["w", "yc", "ht", "hb", "x"]) o[f] = (a[f] ?? 0) + ((b[f] ?? 0) - (a[f] ?? 0)) * t;
  o.n = (a.n ?? 3) + ((b.n ?? 3) - (a.n ?? 3)) * t; return o;
}
// a loft with an open front and a dark cavity behind it, so inlets have real depth
function inletLoft(keys, { R = 56, per = 6, depth = 0.22, inset = 0.8, outer, inner }) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(loft(keys, { R, per, capEnd: false }), outer); g.add(shell);
  const f = keys[keys.length - 1], ins = (k) => ({ ...k, w: k.w * inset, ht: k.ht * inset, hb: k.hb * inset });
  const cav = new THREE.Mesh(loft([{ ...ins(f), z: f.z - depth }, { ...ins(f), z: f.z - 0.005 }], { R, per: 2, capEnd: false }), inner); g.add(cav);
  // lip joining the outer edge to the cavity
  const a = ring({ ...DEF, ...f }, R), b = ring({ ...DEF, ...ins(f) }, R), pos = [], idx = [];
  for (let i = 0; i < R; i++) { pos.push(a[i][0], a[i][1], f.z, b[i][0], b[i][1], f.z - 0.004); const j = (i + 1) % R; idx.push(i * 2, j * 2, i * 2 + 1, i * 2 + 1, j * 2, j * 2 + 1); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); lg.setIndex(idx); lg.computeVertexNormals();
  const luv = []; for (let i = 0; i < pos.length; i += 3) luv.push((pos[i + 2] + 3) / 6.3, pos[i + 1] / 1.3); lg.setAttribute("uv", new THREE.Float32BufferAttribute(luv, 2));
  g.add(new THREE.Mesh(lg, outer));
  g.traverse((m) => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
  return g;
}

// what you'd see in a mirror: sky, trees, the track behind and a car following (painted, like a racing game's mirror)
const _mirror = {};
function mirrorTex(s) {
  if (_mirror[s]) return _mirror[s];
  const t = tex(canvas(360, 124, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.45); sky.addColorStop(0, "#AFC4D8"); sky.addColorStop(1, "#D9E2EA"); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = "#24442A"; for (let x = 0; x < w; x += 9) { const th = 18 + ((x * 37) % 23); g.beginPath(); g.moveTo(x - 6, h * 0.5); g.lineTo(x + 3, h * 0.5 - th); g.lineTo(x + 12, h * 0.5); g.fill(); }
    g.fillStyle = "#3E7A4A"; g.fillRect(0, h * 0.5, w, h * 0.5);
    g.fillStyle = "#4A4E55"; g.beginPath(); g.moveTo(s > 0 ? w * 0.1 : -w * 0.2, h); g.lineTo(s > 0 ? w * 1.2 : w * 0.9, h); g.lineTo(w * (s > 0 ? 0.55 : 0.45) + 12, h * 0.52); g.lineTo(w * (s > 0 ? 0.55 : 0.45) - 12, h * 0.52); g.fill();
    g.fillStyle = "#C8102E"; g.fillRect(w * (s > 0 ? 0.4 : 0.5), h * 0.62, 26, 9); g.fillStyle = "#111"; g.fillRect(w * (s > 0 ? 0.4 : 0.5) - 4, h * 0.6, 34, 4);
    // the car's own bodywork in the corner of the mirror
    g.fillStyle = "#C88A26"; g.beginPath(); g.moveTo(s > 0 ? 0 : w, h); g.lineTo(s > 0 ? 0 : w, h * 0.55); g.quadraticCurveTo(s > 0 ? w * 0.18 : w * 0.82, h * 0.7, s > 0 ? w * 0.3 : w * 0.7, h); g.fill();
    g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(0, 0, w, h);
  }));
  return (_mirror[s] = t);
}

export function f1car(o = {}) {
  const { era = 2022, body = "#FFA51F", accent = "#16171B", stripe = "#F4F4F4", style = "split", team = "RACELIMIT", compound = "#FFD23F", compoundName = "C4 · SOFT", number = "27", helmet = ["#FFA51F", "#16171B"], tcam = "#111", damage = {}, aero = "corner", drs = false, wheel = true, glow = 0, finish = "gloss", rimColor = null, downforce = "med", podStyle = "downwash", noseStyle = "standard", cooling = null, sponsor = null, exGlow = 0, flame = 0 } = o;
  const E = { ...ERAS[era], ...(era === 2026 && noseStyle === "long" ? { nose: "long26" } : {}) }, g = new THREE.Group();
  const zf = E.wb / 2, zr = -E.wb / 2, ck = zf - 1.55, fwZ = zf + E.fo, tailZ = zr - E.ro + 0.22, rwZ = tailZ - 0.06;
  const tipZ = fwZ - NOSE_BACK[E.nose];
  g.userData = { era, ck, zf, zr, E };
  const liv = new THREE.MeshPhysicalMaterial({ map: liveryMap({ body, accent, stripe, style }), roughness: 0.38, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.1, envMapIntensity: 0.75 });
  const paint = new THREE.MeshPhysicalMaterial({ color: body, roughness: 0.38, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.1, envMapIntensity: 0.75, side: THREE.DoubleSide });
  const dark = new THREE.MeshPhysicalMaterial({ color: accent, roughness: 0.42, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.15, envMapIntensity: 0.7, side: THREE.DoubleSide });
  { const FIN = { gloss: {}, matte: { roughness: 0.66, clearcoat: 0, envMapIntensity: 0.45 }, satin: { roughness: 0.5, clearcoat: 0.12 }, chrome: { metalness: 0.95, roughness: 0.14, clearcoat: 0.6, envMapIntensity: 1.1 } }[finish] || {}; Object.assign(liv, FIN); Object.assign(paint, FIN); }
  const black = new THREE.MeshStandardMaterial({ color: 0x07080A, roughness: 0.85, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: 0x6E5E52, metalness: 1, roughness: 0.32, side: THREE.DoubleSide });
  const isC = (m) => m === carbon || m === carbonMatte;
  const add = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { if (isC(m)) boxUV(geo); const ob = new THREE.Mesh(geo, m); ob.position.set(x, y, z); ob.rotation.set(rx, ry, rz); ob.castShadow = ob.receiveShadow = true; g.add(ob); return ob; };
  const arm = (a, b, w, h, m = carbon) => { a = new THREE.Vector3(...a); b = new THREE.Vector3(...b); const geo = new RoundedBoxGeometry(w, h, a.distanceTo(b), 2, Math.min(w, h) / 2.2); const ob = new THREE.Mesh(isC(m) ? boxUV(geo) : geo, m); ob.position.copy(a).lerp(b, 0.5); ob.lookAt(b); ob.castShadow = true; g.add(ob); return ob; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------- tub: gearbox cover → engine cover → cockpit → chassis (stays tall to the front axle) → nose ----------
  const keys = [
    { z: tailZ, w: 0.16, yc: 0.37, ht: 0.07, hb: 0.07 },
    { z: tailZ + 0.3, w: 0.26, yc: 0.41, ht: 0.12, hb: 0.12 },
    { z: zr + 0.15, w: 0.34, yc: 0.46, ht: 0.19, hb: 0.26, n: 2.6 },
    { z: zr + 0.75, w: 0.44, yc: 0.52, ht: 0.26, hb: 0.36, n: 2.8, tw: 0.45 },
    { z: ck - 0.75, w: 0.52, yc: 0.56, ht: 0.3, hb: 0.43, n: 2.8, tw: 0.45 },
    { z: ck - 0.3, w: 0.66, yc: 0.57, ht: 0.25, hb: 0.45, n: 3.2, tw: 0.6 },
    { z: ck, w: 0.7, yc: 0.55, ht: 0.22, hb: 0.43, n: 3.6 },
    { z: ck + 0.45, w: 0.6, yc: 0.51, ht: 0.15, hb: 0.37, n: 3.4 },
  ];
  const nb = zf - 0.45;
  for (const [t, w, yc, ht, hb] of NOSES[E.nose]) keys.push({ z: nb + (tipZ - nb) * t, w, yc, ht, hb, n: 2.4 + (1 - t) * 0.9 });
  const inHole = (x, y, z) => y > 0.64 && ((z - (ck + 0.04)) / 0.42) ** 2 + (x / (z > ck ? 0.18 : 0.19)) ** 2 < 1;
  add(loft(keys, { R: 88, per: 8, hole: inHole }), liv).userData.extTub = true;
  // the driver's view uses its own front section (nose only) so the cockpit surround can replace the shoulders
  { const nk = keys.filter((k) => k.z >= ck + 0.45); const nm = add(loft(nk, { R: 88, per: 8 }), liv); nm.userData.cockpitOnly = true; nm.visible = false; }
  const tubAt = (z) => keyAt(keys, z);
  // a point on the side of the tub at (z, y), pushed in a little so parts look attached
  const onTub = (s, y, z, inset = 0.012) => { const k = tubAt(z); const yy = Math.min(k.yc + k.ht * 0.85, Math.max(k.yc - k.hb * 0.85, y)); return [s * Math.max(0.02, halfWidthAt({ ...k, n: k.n }, yy) - inset), yy, z]; };
  // engine-cover cooling louvres (garage option): none / 4 / 9 slots each side
  if (cooling) { const n = { closed: 0, normal: 4, max: 9 }[cooling] ?? 0; for (const sd of [-1, 1]) for (let k = 0; k < n; k++) { const z = ck - 0.82 - k * 0.07, kk = tubAt(z), p = onTub(sd, kk.yc + kk.ht * 0.5, z, 0.002); const m = add(new RoundedBoxGeometry(0.012, 0.1, 0.028, 1, 0.004), black, ...p); m.rotation.z = -sd * 0.55; } }

  // ---------- airbox / roll hoop and the T-camera ----------
  if (E.airbox === "arch") {
    // a tall, pointed arch: the roll hoop, with the engine air inlet underneath it
    const hz = ck - 0.42, top = 0.98;
    const frontKey = { z: hz, w: 0.22, yc: top - 0.13, ht: 0.13, hb: 0.12, n: 2.3, tw: 0.1, bw: 0.9 };
    const keysA = [{ z: ck - 1.5, w: 0.12, yc: 0.79, ht: 0.03, hb: 0.07, tw: 0.4 }, { z: ck - 1.05, w: 0.22, yc: 0.83, ht: 0.07, hb: 0.12, n: 2.5, tw: 0.25 }, { z: hz - 0.3, w: 0.25, yc: top - 0.15, ht: 0.12, hb: 0.15, n: 2.4, tw: 0.15, bw: 0.9 }, frontKey];
    g.add(inletLoft(keysA, { outer: liv, inner: black, depth: 0.25, inset: 0.86 }));
    // T-camera: a flat T-shaped wing on a short stem on top of the hoop, with the two camera lenses
    const tcm = new THREE.MeshPhysicalMaterial({ color: tcam, roughness: 0.3, clearcoat: 0.8 });
    add(new RoundedBoxGeometry(0.016, 0.03, 0.06, 2, 0.005), tcm, 0, top + 0.005, hz - 0.08);
    add(wing(span(-0.13, 0.13, 10, () => ({ y: top + 0.025, z: hz - 0.02, c: 0.12, a: 0.04, t: 0.16 })), { P: 10, camber: 0.01 }), tcm);
    for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.011, 0.013, 0.03, 14), tcm, s * 0.035, top + 0.045, hz - 0.05); add(new THREE.CircleGeometry(0.009, 14), new THREE.MeshStandardMaterial({ color: 0x050507, metalness: 0.8, roughness: 0.05 }), s * 0.035, top + 0.045, hz - 0.05 + 0.016, 0, 0, 0); }
  } else {
    // older cars: a big rounded inlet right behind the driver's head, T-cam as a bar on top
    const tall = E.airbox === "tall", hz = ck - 0.42, top = tall ? 1.02 : 0.98;
    const frontKey = { z: hz, w: tall ? 0.22 : 0.26, yc: top - 0.1, ht: 0.1, hb: tall ? 0.11 : 0.09, n: 2.4, tw: 0.5 };
    g.add(inletLoft([{ z: ck - 1.45, w: 0.12, yc: 0.78, ht: 0.03, hb: 0.07 }, { z: ck - 1.0, w: 0.24, yc: 0.83, ht: 0.07, hb: 0.12, n: 2.6, tw: 0.4 }, { ...frontKey, z: hz - 0.22 }, frontKey], { outer: liv, inner: black, depth: 0.25, inset: 0.75 }));
    const tcm = new THREE.MeshPhysicalMaterial({ color: tcam, roughness: 0.3, clearcoat: 0.8 });
    add(new RoundedBoxGeometry(0.2, 0.04, 0.09, 2, 0.015), tcm, 0, top + 0.03, hz - 0.12);
  }
  // engine cover fin with the race number
  if (E.fin) {
    const h = E.fin === "big" ? 0.98 : E.fin === "mid" ? 0.9 : 0.86, back = E.fin === "big" ? tailZ - 0.1 : tailZ + 0.4;
    add(plate([[ck - 1.0, 0.86], [back + 0.1, h], [back, h - 0.08], [back + 0.05, 0.55], [ck - 1.6, 0.7]], 0.01), paint);
    for (const s of [-1, 1]) add(new THREE.PlaneGeometry(0.3, 0.09), decal(number, { color: "#FFFFFF", w: 256, h: 96, font: "700 86px BC", italic: true }), s * 0.008, 0.8, (ck - 1.6 + back) / 2, 0, s * Math.PI / 2, 0).castShadow = false;
  }

  // ---------- sidepods: they blend into the tub, with an open inlet that has depth ----------
  const P = (z, x, w, yc, ht, hb, n = 3, bw = 1, tw = 1) => ({ z, x, w, yc, ht, hb, n, bw, tw });
  let podDef;
  if (E.pods === "ground26") podDef = { keys: [P(tailZ + 0.95, 0.24, 0.12, 0.27, 0.03, 0.08, 3, 1), P(tailZ + 1.3, 0.33, 0.26, 0.31, 0.05, 0.12, 3.4, 0.7), P(ck - 1.15, 0.43, 0.42, 0.37, 0.07, 0.16, 4, 0.55), P(ck - 0.75, 0.47, 0.52, 0.44, 0.1, 0.2, 4.6, 0.45), P(ck - 0.3, 0.48, 0.58, 0.51, 0.11, 0.22, 5.4, 0.4), P(ck + 0.02, 0.5, 0.6, 0.55, 0.11, 0.18, 6, 0.45), P(ck + 0.3, 0.5, 0.58, 0.56, 0.1, 0.11, 7, 0.75)], depth: 0.3, inset: 0.9 };
  else if (E.pods === "ground") podDef = { keys: [P(tailZ + 0.95, 0.24, 0.12, 0.27, 0.03, 0.08, 3, 1), P(tailZ + 1.3, 0.34, 0.26, 0.31, 0.045, 0.12, 3.4, 0.7), P(ck - 1.2, 0.43, 0.4, 0.36, 0.055, 0.16, 4, 0.6), P(ck - 0.8, 0.47, 0.5, 0.44, 0.07, 0.21, 4.6, 0.5), P(ck - 0.35, 0.5, 0.58, 0.52, 0.085, 0.23, 5.2, 0.4), P(ck + 0.1, 0.5, 0.62, 0.57, 0.08, 0.19, 5.6, 0.35), P(ck + 0.42, 0.5, 0.62, 0.6, 0.05, 0.06, 6, 0.8)], depth: 0.3, inset: 0.86 };
  else if (E.pods === "tapered") podDef = { keys: [P(tailZ + 0.95, 0.24, 0.12, 0.26, 0.04, 0.08, 3, 1), P(tailZ + 1.3, 0.32, 0.22, 0.3, 0.07, 0.15, 3.4, 0.8), P(ck - 1.1, 0.4, 0.36, 0.37, 0.12, 0.24, 3.8, 0.75), P(ck - 0.55, 0.46, 0.48, 0.44, 0.17, 0.3, 4.2, 0.7), P(ck - 0.05, 0.48, 0.5, 0.5, 0.2, 0.34, 4.6, 0.7), P(ck + 0.22, 0.48, 0.46, 0.53, 0.17, 0.3, 4.6, 0.75)], depth: 0.3, inset: 0.75 };
  else if (E.pods === "box98") podDef = { keys: [P(tailZ + 0.9, 0.24, 0.14, 0.27, 0.05, 0.1, 3, 1), P(tailZ + 1.3, 0.32, 0.28, 0.3, 0.1, 0.18, 3.6, 1), P(ck - 1.0, 0.42, 0.44, 0.36, 0.18, 0.27, 4.6, 1), P(ck - 0.4, 0.46, 0.5, 0.4, 0.21, 0.31, 5, 1), P(ck + 0.15, 0.46, 0.52, 0.41, 0.22, 0.32, 5.4, 1), P(ck + 0.42, 0.46, 0.5, 0.41, 0.2, 0.3, 5.4, 1)], depth: 0.3, inset: 0.8 };
  else podDef = { keys: [P(tailZ + 0.9, 0.24, 0.14, 0.27, 0.05, 0.1, 3, 1), P(tailZ + 1.3, 0.32, 0.26, 0.31, 0.1, 0.18, 3.6, 0.9), P(ck - 1.05, 0.42, 0.4, 0.38, 0.17, 0.27, 4.6, 0.85), P(ck - 0.5, 0.46, 0.48, 0.42, 0.2, 0.31, 5, 0.85), P(ck + 0.1, 0.47, 0.5, 0.43, 0.21, 0.32, 5.2, 0.85), P(ck + 0.4, 0.47, 0.48, 0.44, 0.19, 0.3, 5, 0.85)], depth: 0.3, inset: 0.78 };
  if (podStyle === "slim") podDef = { ...podDef, keys: podDef.keys.map((k) => ({ ...k, w: k.w * 0.68, x: k.x * 0.9, ht: k.ht * 0.8 })), inset: 0.7 };
  else if (podStyle === "wide") podDef = { ...podDef, keys: podDef.keys.map((k) => ({ ...k, w: k.w * 1.12, x: k.x * 1.04, ht: k.ht * 1.4, hb: k.hb * 1.08 })) };
  for (const s of [-1, 1]) {
    const pk = podDef.keys.map((k) => ({ ...k, x: s * k.x }));
    g.add(inletLoft(pk, { outer: liv, inner: black, depth: podDef.depth, inset: podDef.inset }));
    const front = pk[pk.length - 1], mid = pk.reduce((a, k) => (Math.abs(k.x) + k.w / 2 > Math.abs(a.x) + a.w / 2 ? k : a));
    // an overhanging top lip on the newer cars ("overbite")
    if (E.pods === "ground") add(wing(span(front.x - front.w * 0.42, front.x + front.w * 0.42, 10, () => ({ y: front.yc + front.ht - 0.008, z: front.z + 0.06, c: 0.08, a: -0.05, t: 0.12 })), { P: 8, camber: 0.02 }), liv);
    // cooling louvres on the top surface
    for (let k = 0; k < 6; k++) add(new RoundedBoxGeometry(0.15, 0.008, 0.026, 1, 0.003), black, s * (Math.abs(mid.x) + 0.05), mid.yc + mid.ht * 0.6 - k * 0.012, mid.z - 0.12 - k * 0.055, -0.3);
    add(new THREE.PlaneGeometry(0.6, 0.1), decal(team, { color: stripe, w: 512, h: 96, font: "700 78px BC" }), s * (Math.abs(mid.x) + mid.w / 2 + 0.004), mid.yc - 0.02, mid.z - 0.05, 0, s * Math.PI / 2, 0).castShadow = false;
    if (sponsor) add(new THREE.PlaneGeometry(0.44, 0.055), decal(sponsor.text, { color: sponsor.color || stripe, w: 640, h: 80, font: "700 64px B" }), s * (Math.abs(mid.x) + mid.w / 2 + 0.005), mid.yc + 0.058, mid.z - 0.05, 0, s * Math.PI / 2, 0).castShadow = false;
    // 1998–2008 extras: chimneys and flip-up winglets in front of the rear wheels
    if (E.chimneys) { add(new RoundedBoxGeometry(0.09, 0.14, 0.15, 2, 0.03), liv, s * 0.44, 0.66, ck - 0.95); add(new THREE.CylinderGeometry(0.03, 0.035, 0.1, 12), metal, s * 0.4, 0.64, ck - 1.2); }
    if (E.winglets) { add(plate([[zr + 0.45, 0.42], [zr + 0.85, 0.45], [zr + 0.85, 0.62], [zr + 0.55, 0.6]], 0.01), carbon, s * 0.52, 0, 0); add(wing(span(s > 0 ? 0.38 : -0.52, s > 0 ? 0.52 : -0.38, 4, () => ({ y: 0.6, z: zr + 0.8, c: 0.12, a: 0.4, t: 0.08 }))), carbon); }
    // 2026 wheel-wake boards on the floor in front of the sidepods
    if (E.wakeBoards) { const pl = add(plate([[ck + 0.55, 0.08], [ck + 0.98, 0.08], [ck + 0.92, 0.32], [ck + 0.6, 0.36]], 0.008), carbon, s * 0.62, 0, 0); pl.rotation.y = s * 0.1; }
    // bargeboards (older eras): a row of vanes behind the front wheels
    if (E.barge) for (let k = 0; k < E.barge; k++) { const zb = ck + 0.5 + k * (0.5 / E.barge), xb = 0.44 + k * 0.035; const pl = add(plate([[zb, 0.08], [zb + 0.32, 0.08], [zb + 0.29, era >= 2017 ? 0.42 - k * 0.02 : 0.32], [zb + 0.04, era >= 2017 ? 0.38 - k * 0.02 : 0.28]], 0.006), carbon, s * xb, 0, 0); pl.rotation.y = s * 0.1; }

    // mirrors: an aero housing on two slim struts
    const mz = E.halo ? ck + 0.4 : ck + 0.3, mx = E.halo ? 0.55 : 0.47, my = E.halo ? 0.8 : 0.77;
    add(loft([{ z: mz + 0.07, x: s * mx, w: 0.12, yc: my, ht: 0.012, hb: 0.012, n: 2.4 }, { z: mz + 0.04, x: s * mx, w: 0.19, yc: my, ht: 0.03, hb: 0.03, n: 3.2 }, { z: mz, x: s * mx, w: 0.2, yc: my, ht: 0.036, hb: 0.036, n: 4 }, { z: mz - 0.022, x: s * mx, w: 0.2, yc: my, ht: 0.036, hb: 0.036, n: 4.4 }], { R: 40, per: 5 }), dark);
    add(new THREE.PlaneGeometry(0.18, 0.062), new THREE.MeshBasicMaterial({ map: mirrorTex(s), toneMapped: true }), s * mx, my, mz - 0.0225, 0, Math.PI, 0);
    add(sweep([V(s * (mx - 0.07), my - 0.03, mz + 0.01), V(s * (mx - 0.13), my - 0.01, mz + 0.02), V(s * (E.halo ? 0.33 : 0.38), E.halo ? 0.92 : 0.7, E.halo ? ck + 0.17 : mz + 0.05)], 0.006, 0.014, 16, 8), carbon);
    add(sweep([V(s * (mx + 0.04), my - 0.035, mz + 0.01), V(s * (mx + 0.03), my - 0.08, mz + 0.06), V(s * (mx - 0.02), front.yc + front.ht - 0.01, mz + 0.12)], 0.007, 0.018, 16, 8), carbon);
  }

  // ---------- cockpit surround: the bodywork rises up either side of the driver to about eye level
  // (2018+ cars have tall cockpit sides; the halo legs and mirrors sit on top of them)
  if (E.halo) {
    for (const s of [-1, 1]) {
      const T = (z, top, x, w, ht, hb, n = 3.6, tw = 0.82) => ({ z, x: s * x, w, yc: top - ht, ht, hb, n, bw: 1, tw });
      const sk = [T(ck - 0.62, 0.66, 0.29, 0.18, 0.05, 0.14, 3), T(ck - 0.4, 0.745, 0.31, 0.24, 0.07, 0.2), T(ck - 0.12, 0.76, 0.31, 0.25, 0.07, 0.21), T(ck + 0.18, 0.74, 0.3, 0.24, 0.065, 0.2), T(ck + 0.45, 0.68, 0.27, 0.2, 0.05, 0.16), T(ck + 0.72, 0.6, 0.2, 0.12, 0.03, 0.1, 3, 1)];
      add(loft(sk, { R: 48, per: 6 }), liv).userData.surround = true;
      // dark padding on the inside face, running along the opening
      const pad = []; for (let k = 0; k <= 12; k++) { const t = k / 12, z = ck - 0.42 + t * 0.95, kk = keyAt(sk, z); pad.push(V(s * (Math.abs(kk.x) - kk.w * 0.47), kk.yc + kk.ht * 0.3, z)); }
      add(sweep(pad, 0.022, 0.035, 40, 12), new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 1 })).userData.surround = true;
    }
  }
  // ---------- cockpit, headrest, driver ----------
  add(loft([{ z: ck - 0.4, w: 0.4, yc: 0.6, ht: 0.2, hb: 0.16, n: 3 }, { z: ck + 0.1, w: 0.38, yc: 0.58, ht: 0.18, hb: 0.15, n: 3 }, { z: ck + 0.47, w: 0.3, yc: 0.5, ht: 0.12, hb: 0.1, n: 3 }], { R: 40, per: 4, hole: (x, y) => y > 0.6 && Math.abs(x) < 0.15 }), new THREE.MeshStandardMaterial({ color: 0x0B0C0E, roughness: 0.95, side: THREE.DoubleSide })).userData.inner = true;
  { const rim = []; for (let k = 0; k <= 48; k++) { const a = (k / 48) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); const zz = ck + 0.04 + sn * 0.43, hw = 0.205 * (sn > 0 ? 1 - 0.3 * sn ** 2 : 1); rim.push(V(Math.sign(c) * Math.abs(c) ** 0.6 * hw, 0.787 - Math.max(0, sn) ** 1.2 * 0.13, zz)); } add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 96, 0.011, 10, true), new THREE.MeshStandardMaterial({ color: 0x18191C, roughness: 0.9 })).userData.lid = true; }
  add(sweep([V(-0.19, 0.77, ck - 0.1), V(-0.19, 0.795, ck - 0.2), V(-0.15, 0.81, ck - 0.31), V(0, 0.82, ck - 0.36), V(0.15, 0.81, ck - 0.31), V(0.19, 0.795, ck - 0.2), V(0.19, 0.77, ck - 0.1)], 0.045, 0.05, 48, 14), new THREE.MeshStandardMaterial({ color: 0x1B1C20, roughness: 0.8 }));
  {
    const cf = new THREE.MeshStandardMaterial({ map: carbon.map, normalMap: carbon.normalMap, color: 0x4A4D52, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide });
    const suede = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 1, side: THREE.DoubleSide });
    // inner side walls of the tub, following the opening down into the cockpit
    for (const s of [-1, 1]) {
      const pos = [], idx = [], uv = [], N = 16;
      for (let k = 0; k <= N; k++) { const t = k / N, z = ck - 0.3 + t * 0.76, hw = 0.195 - 0.045 * t * t, top = 0.765 - Math.max(0, (t - 0.45) / 0.55) ** 1.2 * 0.13; pos.push(s * hw, top, z, s * (hw - 0.04), 0.46, z); uv.push(z * 40, top * 40, z * 40, 0.46 * 40); if (k < N) { const o = k * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); } }
      const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); wg.setIndex(idx); wg.computeVertexNormals();
      const wall = new THREE.Mesh(wg, cf); wall.userData.uvDone = true; wall.userData.inner = true; g.add(wall);
      // padded side pad along the opening beside the driver's shoulders
      add(sweep([V(s * 0.17, 0.765, ck - 0.3), V(s * 0.172, 0.77, ck - 0.08), V(s * 0.168, 0.762, ck + 0.12)], 0.028, 0.032, 24, 12), suede).userData.inner = true;
      // the edge of the opening on each side (black trim), running forward to the front of the cockpit
      const tr = []; for (let k = 0; k <= 20; k++) { const t = k / 20, z = ck - 0.28 + t * 0.74, hw = 0.2 - 0.05 * t * t, y = 0.768 - Math.max(0, (t - 0.45) / 0.55) ** 1.2 * 0.13; tr.push(V(s * hw, y, z)); }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tr), 40, 0.008, 8), suede);
      // knees under the front cowl
      add(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshStandardMaterial({ color: helmet[1] === "#16171B" ? 0x22252B : helmet[1], roughness: 0.85 }), s * 0.08, 0.53, ck + 0.5).scale.set(1, 0.8, 1.4);
    }
    // front cowl: the carbon lip at the front of the opening that the steering column comes out of
    add(loft([{ z: ck + 0.42, w: 0.3, yc: 0.62, ht: 0.05, hb: 0.08, n: 3 }, { z: ck + 0.5, w: 0.27, yc: 0.63, ht: 0.035, hb: 0.08, n: 3 }], { R: 32, per: 3 }), cf);
    // (the steering column is hidden behind the wheel)
    // seat back and belts behind/below the driver
    add(new RoundedBoxGeometry(0.34, 0.3, 0.06, 3, 0.02), suede, 0, 0.6, ck - 0.3).rotation.x = -0.35;
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.05, 0.3, 0.006), new THREE.MeshStandardMaterial({ color: 0x9E1B1B, roughness: 0.9 }), s * 0.07, 0.66, ck - 0.18, -0.6, 0, s * 0.15);
  }
  const hm = new THREE.MeshPhysicalMaterial({ map: helmetMap(...helmet), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
  const hy = 0.79, hz2 = ck - 0.15;
  const helm = add(new THREE.SphereGeometry(0.14, 40, 28), hm, 0, hy, hz2); helm.rotation.y = Math.PI / 2; helm.scale.set(1.13, 0.95, 1); helm.userData.helmet = true;
  const vis = add(new THREE.SphereGeometry(0.143, 40, 20, -Math.PI * 0.32, Math.PI * 0.64, Math.PI * 0.4, Math.PI * 0.17), new THREE.MeshPhysicalMaterial({ color: 0x0A0A0C, roughness: 0.03, metalness: 0.7, clearcoat: 1 }), 0, hy, hz2, -0.12, 0, 0); vis.scale.set(1.01, 0.96, 1.14); vis.userData.helmet = true;
  // ---------- cockpit surround: only drawn in the driver's view ----------
  // The exterior tub is shaped for looking at the car from outside. From the driver's eyes you need the real thing:
  // high shoulders either side of you that slope down towards the nose, a wide opening with a padded black edge.
  {
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const z0 = ck - 0.42, z1 = ck + 0.95, NT = 46, NU = 22;
    const rimX = (z) => { const t = (z - (ck - 0.42)) / 0.98; if (t >= 1) return 0; return Math.max(0, (0.185 - 0.03 * sm(0.3, 0.8, t)) * Math.sqrt(Math.max(0, 1 - Math.max(0, (t - 0.82) / 0.18) ** 2))); };
    const topY = (z) => 0.745 - 0.15 * sm(ck + 0.0, ck + 0.75, z);
    const outX = (z) => 0.6 - 0.36 * sm(ck + 0.2, ck + 0.95, z);
    const shellM = new THREE.MeshPhysicalMaterial({ color: body, roughness: 0.42, metalness: 0.0, clearcoat: 0.25, clearcoatRoughness: 0.15, envMapIntensity: 0.5, side: THREE.FrontSide }); 
    const padM = new THREE.MeshStandardMaterial({ color: 0x0C0D10, roughness: 0.95, side: THREE.DoubleSide });
    // inside of the cockpit sides: same paint, a little darker (it's in shade)
    const innerM = new THREE.MeshStandardMaterial({ map: carbon.map, color: 0x3A3D44, roughness: 0.6, side: THREE.DoubleSide });
    // the driver's upper arms and shoulders in the race suit
    const suit = new THREE.MeshStandardMaterial({ color: helmet[1] === "#16171B" ? 0x1C1E23 : helmet[1], roughness: 0.85 });
    void suit;
    for (const s of [-1, 1]) {
      const pos = [], idx = [], uvs = [];
      for (let i = 0; i <= NT; i++) {
        const z = z0 + ((z1 - z0) * i) / NT, rx = rimX(z), ox = outX(z), ty = topY(z);
        for (let j = 0; j <= NU; j++) {
          const u = j / NU, x = rx + (ox - rx) * Math.min(u / 0.8, 1);
          // across: nearly flat, then rolls over the shoulder and down the outside
          let y = ty + 0.03 * Math.min(u / 0.8, 1) ** 1.3, xx = x;
          if (u > 0.8) { const a = ((u - 0.8) / 0.2) * Math.PI / 2; xx = ox + Math.sin(a) * 0.05; y = ty + 0.03 - (1 - Math.cos(a)) * 0.05 - ((u - 0.8) / 0.2) ** 2 * 0.25; }
          pos.push(s * xx, y, z); uvs.push(u, i / NT);
        }
      }
      for (let i = 0; i < NT; i++) for (let j = 0; j < NU; j++) { const a = i * (NU + 1) + j, b = a + 1, c = a + NU + 1, d = c + 1; s > 0 ? idx.push(a, c, b, b, c, d) : idx.push(a, b, c, b, d, c); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); sg.setIndex(idx); sg.computeVertexNormals();
      const sh = add(sg, shellM); sh.castShadow = false; sh.userData.cockpitOnly = true; sh.visible = false;
      // padded black edge along the opening, and a dark inner wall dropping into the cockpit
      const edge = [], wall = [], widx = [];
      let n = 0;
      for (let i = 0; i <= NT; i++) { const z = z0 + ((z1 - z0) * i) / NT, rx = rimX(z); if (rx < 0.02) continue; edge.push(V(s * rx, topY(z) + 0.008, z)); wall.push(s * rx, topY(z), z, s * (rx - 0.015), topY(z) - 0.14, z); n++; }
      for (let k = 0; k < n - 1; k++) { const o = k * 2; widx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
      const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wall, 3)); wg.setIndex(widx); wg.computeVertexNormals();
      const wm = add(wg, innerM); wm.userData.cockpitOnly = true; wm.visible = false;
      const em = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge.filter((v) => v.z > ck + 0.3)), 48, 0.005, 8), padM); em.userData.cockpitOnly = true; em.visible = false;
      { const d = add(new THREE.PlaneGeometry(0.42, 0.075), decal(team, { color: stripe, w: 512, h: 92, font: "700 80px BC" }), s * 0.42, topY(ck + 0.45) + 0.032, ck + 0.45, -Math.PI / 2, 0, Math.PI + s * 0.35); d.userData.cockpitOnly = true; d.visible = false; d.castShadow = false; }
      // a dark floor inside the opening so you don't see through to the track
      if (s > 0) { const fl = add(new THREE.PlaneGeometry(0.46, 0.7), padM, 0, 0.5, ck + 0.2, -Math.PI / 2, 0, 0); fl.userData.cockpitOnly = true; fl.visible = false; }
      // shoulder pads either side of the helmet
      const pd = add(sweep([V(s * 0.2, 0.78, ck - 0.5), V(s * 0.205, 0.8, ck - 0.36), V(s * 0.2, 0.79, ck - 0.24)], 0.035, 0.04, 24, 12), padM); pd.userData.cockpitOnly = true; pd.visible = false;
    }
  }
  if (wheel) {
    const sw = buildWheel26(helmet); sw.position.set(0, 0.635, ck + 0.33); sw.rotation.set(0.6, Math.PI, 0); g.add(sw);
    sw.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.wheel = true; } });
    g.userData.steering = sw;
    for (const s of [-1, 1]) arm([s * 0.2, 0.48, ck + 0.0], [s * 0.12, 0.575, ck + 0.36], 0.06, 0.06, new THREE.MeshStandardMaterial({ color: helmet[1] === "#16171B" ? 0x22252B : helmet[1], roughness: 0.85 })).userData.wheel = true;
  }
  if (E.halo) {
    const hp = new THREE.CatmullRomCurve3([V(-0.36, 0.72, ck - 0.3), V(-0.36, 0.89, ck - 0.02), V(-0.26, 0.96, ck + 0.3), V(0, 0.98, ck + 0.44), V(0.26, 0.96, ck + 0.3), V(0.36, 0.89, ck - 0.02), V(0.36, 0.72, ck - 0.3)]);
    add(sweep(hp.getPoints(40), 0.042, 0.024, 96, 18), dark);
    // the centre pillar lands on top of the chassis
    const pz = ck + 0.7, pk = tubAt(pz);
    add(sweep([V(0, 0.975, ck + 0.42), V(0, 0.93, ck + 0.55), V(0, pk.yc + pk.ht + 0.08, pz - 0.04), V(0, pk.yc + pk.ht - 0.01, pz + 0.02)], 0.022, 0.034, 24, 12), dark);
    for (const s of [-1, 1]) add(sweep([V(s * 0.35, 0.74, ck - 0.29), V(s * 0.36, 0.7, ck - 0.34), V(s * 0.33, 0.64, ck - 0.38)], 0.03, 0.03, 8, 10), dark);
  }

  // ---------- floor, plank, diffuser, rear lights ----------
  const fx = (E.tf + 0.09) / 0.9, fz0 = tailZ + 0.4, fz1 = ck + 1.1;
  const fl = new THREE.Shape(); const F = (x, z) => [x * fx, z];
  const pts = [F(-0.5, fz0), F(0.5, fz0), F(0.86, fz0 + 0.8), F(0.9, fz1 - 0.9), F(0.5, fz1), F(-0.5, fz1), F(-0.9, fz1 - 0.9), F(-0.86, fz0 + 0.8)];
  fl.moveTo(...pts[0]); for (const p of pts.slice(1)) fl.lineTo(...p);
  const flG = new THREE.ExtrudeGeometry(fl, { depth: 0.025, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.008, bevelSegments: 2 }); flG.rotateX(Math.PI / 2);
  { const uv = flG.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 10, uv.getY(i) * 10); flG.userData.uvDone = true; }
  add(flG, carbonMatte, 0, 0.1, 0);
  add(new THREE.BoxGeometry(0.3, 0.012, fz1 - fz0 - 0.6), new THREE.MeshStandardMaterial({ color: 0x9C7A4E, roughness: 0.9 }), 0, 0.066, (fz0 + fz1) / 2);
  if (E.edgeWing) for (const s of [-1, 1]) { const ew = new THREE.Mesh(boxUV(new RoundedBoxGeometry(0.03, 0.05, 1.6, 2, 0.012)), carbon); ew.position.set(s * 0.87 * fx, 0.15, ck - 0.7); ew.rotation.z = s * 0.5; g.add(ew); }
  const diffH = era === 2026 ? 0.24 : 0.17;
  // diffuser: rises towards the back, with vertical fences, so it reads as tunnels from behind
  add(new RoundedBoxGeometry(0.98 * fx, 0.02, 0.6, 2, 0.008), carbonMatte, 0, 0.1 + diffH * 0.5, tailZ + 0.24, 0.42);
  for (const x of [-0.47, -0.22, 0.22, 0.47]) { const fz = new THREE.Shape(); fz.moveTo(tailZ + 0.54, 0.1); fz.lineTo(tailZ - 0.02, 0.1); fz.lineTo(tailZ - 0.02, 0.12 + diffH); fz.lineTo(tailZ + 0.54, 0.12); fz.lineTo(tailZ + 0.54, 0.1); const fg = new THREE.ExtrudeGeometry(fz, { depth: 0.008, bevelEnabled: false }); fg.translate(0, 0, -0.004); fg.rotateY(-Math.PI / 2); add(fg, carbonMatte, x * fx, 0, 0); }
  add(new THREE.CylinderGeometry(0.048, 0.052, 0.22, 24, 1, true), metal, 0, 0.45, tailZ + 0.11, Math.PI / 2);
  // rain light: a ring of LEDs on 2022+, a bar before
  const rl = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xFF1010, emissiveIntensity: damage.rain ? 3 : 0.25 });
  if (era >= 2022) add(new THREE.TorusGeometry(0.032, 0.008, 8, 24), rl, 0, 0.34, tailZ - 0.01); else add(new RoundedBoxGeometry(0.12, 0.05, 0.02, 2, 0.008), rl, 0, 0.34, tailZ - 0.01);
  // central exhaust above the rain light (turbo era); it can glow with heat and spit a small flame on overrun
  if (era >= 2014) {
    const exM = new THREE.MeshStandardMaterial({ color: 0x6A5A50, metalness: 0.9, roughness: 0.35, side: THREE.DoubleSide, emissive: new THREE.Color(1, 0.32, 0.06), emissiveIntensity: exGlow * 2.5 });
    const ey = 0.47, ez = tailZ - 0.02;
    add(new THREE.CylinderGeometry(0.056, 0.062, 0.2, 32, 1, true), exM, 0, ey, ez + 0.08, Math.PI / 2);
    add(new THREE.TorusGeometry(0.058, 0.007, 10, 32), exM, 0, ey, ez - 0.02);
    add(new THREE.CircleGeometry(0.052, 32), new THREE.MeshBasicMaterial({ color: exGlow > 0.3 ? 0x3A1406 : 0x050505 }), 0, ey, ez + 0.06, 0, Math.PI, 0);
    if (flame > 0) {
      // a soft plume: glowing sprites shrinking and cooling along the jet (blue-white core at the pipe, orange tips)
      const glowTex = (inner, outer) => tex(canvas(128, 128, (cg, w, h) => { const gr = cg.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, "rgba(0,0,0,0)"); cg.fillStyle = gr; cg.fillRect(0, 0, w, h); }));
      const tHot = glowTex("rgba(235,245,255,1)", "rgba(120,170,255,.55)"), tMid = glowTex("rgba(255,240,190,1)", "rgba(255,150,40,.6)"), tOut = glowTex("rgba(255,170,60,.9)", "rgba(255,70,10,.45)");
      const L = 0.5 * flame;
      for (let k = 0; k < 14; k++) { const t = k / 13, map = t < 0.15 ? tHot : t < 0.5 ? tMid : tOut; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95 - t * 0.55 })); const sz = 0.09 + Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) * 0.16 * flame - t * 0.05; sp.scale.set(sz, sz, 1); sp.position.set((Math.sin(k * 2.1) * 0.012) * t, ey + t * 0.02, ez - 0.03 - t * L); g.add(sp); }
      const pl = new THREE.PointLight(0xFF7A2A, 1.1 * flame, 1.6, 2); pl.position.set(0, ey, ez - 0.25); g.add(pl);
    }
  }

  // ---------- front wing ----------
  const mats4 = [carbon, carbon, paint, dark, carbon];
  const fwEndplate = (W, els, s, tall = 0.04, foot = true) => {
    const tipSt = els.map((parts) => { const st = parts[parts.length - 1]; return s > 0 ? st[st.length - 1] : parts[0][0]; });
    const m = tipSt[0], tl = tipSt[tipSt.length - 1], te = (q) => [q.z - q.c * Math.cos(q.a), q.y + q.c * Math.sin(q.a)];
    const [tz, ty] = te(tl);
    const pl = add(plate([[m.z + 0.02, m.y - 0.035], [tz - 0.06, m.y - 0.035], [tz - 0.07, ty - 0.02], [tz - 0.02, ty + tall], [tl.z + 0.02, tl.y + tall], [m.z + 0.04, m.y + 0.03]], 0.01), carbon, s * (W + 0.006), 0, 0);
    pl.rotation.z = -s * 0.06;
    if (foot) add(wing([{ x: s * (W - 0.1), y: m.y - 0.03, z: m.z - 0.05, c: 0.3, a: 0.02, t: 0.05 }, { x: s * (W + 0.02), y: m.y - 0.03, z: m.z - 0.05, c: 0.3, a: 0.02, t: 0.05 }], { P: 8 }), carbon);
  };
  const buildFW = (W, opts, matsList = mats4) => { const els = cascade(W, opts); els.forEach((parts, k) => parts.forEach((st) => st.length > 1 && add(wing(st, { P: 14, camber: 0.06 }), matsList[k] ?? carbon))); return els; };
  if (damage.frontWing !== false) {
    if (E.fw === "active26") {
      // three elements; the top two are the active flaps; the nose is mounted on the middle element
      const W = 0.9, open = aero === "straight";
      const els = buildFW(W, { z0: fwZ, chords: [0.36, 0.2, 0.15], baseY: 0.075, rise: 0.06, sweepBack: 0.12, open: open ? [0, 0.85, 0.85] : [0, 0, 0], from: [0, 0, 0] }, [carbon, paint, dark]);
      for (const s of [-1, 1]) {
        fwEndplate(W, els, s, 0.12);
        // nose mounts onto the middle element
        add(new RoundedBoxGeometry(0.012, 0.08, 0.1, 2, 0.004), carbon, s * 0.055, 0.2, tipZ + 0.06);
      }
    } else if (E.fw === "swept22") {
      const W = 0.98;
      const els = buildFW(W, { z0: fwZ, chords: [0.35, 0.17, 0.13, 0.1] });
      for (const s of [-1, 1]) fwEndplate(W, els, s, 0.04);
    } else if (E.fw === "wide19") {
      // 2019–21: wide, five elements, simple flat endplates
      const W = 1.0;
      const els = buildFW(W, { z0: fwZ, chords: [0.3, 0.15, 0.12, 0.1, 0.08], baseY: 0.075, rise: 0.04, sweepBack: 0.06, step: 0.26, stepOut: 0.12, from: [0, 0.24, 0.24, 0.24, 0.24] });
      for (const s of [-1, 1]) { const tip = els[0][0]; void tip; add(plate([[fwZ - 0.62, 0.03], [fwZ + 0.03, 0.03], [fwZ + 0.03, 0.16], [fwZ - 0.25, 0.27], [fwZ - 0.62, 0.28]], 0.01), carbon, s * (W + 0.006), 0, 0); }
    } else if (E.fw === "wide14" || E.fw === "wide09") {
      // 2009–16: very wide, neutral middle section, flaps only outboard, cascade winglets near the endplates
      const W = E.fw === "wide09" ? 0.9 : 0.825;
      buildFW(W, { z0: fwZ, chords: [0.3, 0.2, 0.15, 0.11], baseY: 0.08, rise: 0.02, sweepBack: 0.03, step: 0.35, stepOut: 0.08, from: [0, 0.25, 0.3, 0.38] }, [carbon, paint, dark, carbon]);
      for (const s of [-1, 1]) {
        add(plate([[fwZ - 0.5, 0.03], [fwZ + 0.03, 0.03], [fwZ + 0.03, 0.1], [fwZ - 0.15, 0.2], [fwZ - 0.5, 0.21]], 0.01), carbon, s * (W + 0.006), 0, 0);
        add(wing(span(s > 0 ? W - 0.25 : -W + 0.05, s > 0 ? W - 0.05 : -W + 0.25, 6, () => ({ y: 0.25, z: fwZ - 0.25, c: 0.12, a: 0.5, t: 0.08 }))), carbon);
      }
    } else {
      // 1998–2008: smaller wing hung under the high nose; raised neutral centre section
      const W = 0.7;
      for (const [y0, z0, c, a, m] of [[0.1, fwZ, 0.3, 0.06, carbon], [0.15, fwZ - 0.26, 0.17, 0.45, paint]]) add(wing(span(-W, W, 40, (x) => { const r = Math.min(1, Math.abs(x) / 0.25); return { y: y0 + 0.07 * (1 - r) ** 2, z: z0, c, a, t: 0.09 }; })), m);
      for (const s of [-1, 1]) add(plate([[fwZ - 0.38, 0.05], [fwZ + 0.02, 0.05], [fwZ + 0.02, 0.13], [fwZ - 0.1, 0.19], [fwZ - 0.38, 0.2]], 0.01), paint, s * (W + 0.006), 0, 0);
    }
    // pylons from the nose down to the wing (high noses)
    if (E.nose === "high98" || E.nose === "high09" || E.nose === "narrow") { const nz = fwZ - 0.25, nk = tubAt(Math.min(nz, tipZ - 0.05)); for (const s of [-1, 1]) add(plate([[nz - 0.15, 0.12], [nz + 0.12, 0.12], [nz + 0.08, nk.yc], [nz - 0.15, nk.yc]], 0.012), carbon, s * 0.07, 0, 0); }
    else if (E.fw !== "active26") for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.014, 0.12, 0.18), carbon, s * 0.06, 0.16, tipZ - 0.15);
  }

  // ---------- rear wing ----------
  const louvres = (W, z0, y0, n) => { for (const s of [-1, 1]) for (let k = 0; k < n; k++) add(new THREE.BoxGeometry(0.004, 0.008, 0.16), black, s * (W + 0.01), y0 + k * 0.035, z0); };
  const centrePillar = (yTop) => add(plate([[tailZ + 0.1, 0.4], [tailZ - 0.04, 0.44], [rwZ - 0.12, yTop], [rwZ + 0.02, yTop]], 0.03), carbon);
  const swanNeck = (x, yTop, zTop) => add(sweep([V(x, 0.45, tailZ + 0.12), V(x, 0.62, tailZ - 0.05), V(x, yTop + 0.05, zTop - 0.32), V(x, yTop + 0.05, zTop - 0.12), V(x, yTop + 0.01, zTop - 0.08)], 0.012, 0.03, 32, 10), carbon);
  const pod = (y, z) => add(loft([{ z: z + 0.04, w: 0.01, yc: y, ht: 0.005, hb: 0.005 }, { z: z - 0.04, w: 0.05, yc: y, ht: 0.035, hb: 0.03, n: 2.4 }, { z: z - 0.24, w: 0.05, yc: y, ht: 0.035, hb: 0.03, n: 2.4 }, { z: z - 0.3, w: 0.012, yc: y, ht: 0.006, hb: 0.006 }], { R: 24, per: 4 }), dark);
  let rwDecalX = 0.54, rwDecalY = 0.84;
  if (E.rw === "active26") {
    // 2026: conventional wing between flat endplates, on two swan-neck pylons; the flap opens on straights
    const W = 0.5, open = aero === "straight", DF = { low: { c: 0.82, a: 0.3 }, med: { c: 1, a: 1 }, high: { c: 1.18, a: 1.5 } }[downforce] || { c: 1, a: 1 };
    add(wing(span(-W, W, 30, () => ({ y: 0.86, z: rwZ, c: 0.36 * DF.c, a: open ? 0.03 : 0.14 * DF.a, t: 0.1 })), { P: 14, camber: 0.07 }), carbon);
    if (downforce === "high") add(wing(span(-0.2, 0.2, 10, () => ({ y: 0.6, z: rwZ + 0.18, c: 0.13, a: 0.45, t: 0.1 })), { P: 10, camber: 0.06 }), carbon); // extra "monkey seat" winglet
    const fY = open ? 0.97 : 0.95;
    add(wing(span(-W, W, 30, () => ({ y: fY, z: rwZ - 0.3 * DF.c, c: 0.22 * DF.c, a: open ? 0.04 : 0.62 * DF.a, t: 0.09 })), { P: 12, camber: 0.05 }), paint);
    for (const s of [-1, 1]) {
      // endplate: a flat panel with a raked leading edge, curving down towards the diffuser
      add(plate([[rwZ + 0.06, 1.04], [rwZ - 0.48, 1.04], [rwZ - 0.53, 0.98], [rwZ - 0.53, 0.72], [rwZ - 0.38, 0.6], [rwZ - 0.12, 0.64], [rwZ + 0.06, 0.8]], 0.012), carbon, s * (W + 0.008), 0, 0);
      add(new THREE.BoxGeometry(0.012, 0.16, 0.02), rl, s * (W + 0.018), 0.86, rwZ - 0.52); // ERS status light
      swanNeck(s * 0.05, 0.86 + 0.05, rwZ);
    }
    add(new THREE.BoxGeometry(0.16, 0.012, 0.05), carbon, 0, 0.62, tailZ + 0.0); // neutral stay between the pylons
    pod(fY + 0.06, rwZ - 0.2); rwDecalX = W + 0.016; rwDecalY = 0.8;
  } else if (E.rw === "spoon") {
    const W = 0.52;
    add(wing(rollWing(W, { y0: 0.89, z: rwZ, c: 0.38, a: drs ? 0.03 : 0.13, R: 0.1, drop: 0.3 }), { P: 14, camber: 0.07 }), carbon);
    const fY = 0.89 + (drs ? 0.085 : 0.05);
    add(wing(span(-(W - 0.02), W - 0.02, 30, (x) => ({ y: fY - (Math.abs(x) > W - 0.12 ? ((Math.abs(x) - (W - 0.12)) / 0.1) ** 2 * 0.03 : 0), z: rwZ - 0.3, c: 0.22, a: drs ? 0.06 : 0.62, t: 0.09 })), { P: 12, camber: 0.05 }), paint);
    swanNeck(0, 0.94, rwZ); pod(fY + 0.06, rwZ - 0.2);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.012, 0.18, 0.02), rl, s * (W + 0.02), 0.62, rwZ - 0.36);
    rwDecalX = 0.548; rwDecalY = 0.66;
  } else if (E.rw === "low") {
    const W = 0.475;
    add(wing(span(-W, W, 24, () => ({ y: 0.8, z: rwZ, c: 0.42, a: 0.1, t: 0.1 }))), carbon);
    add(wing(span(-W, W, 24, () => ({ y: 0.92, z: rwZ - 0.32, c: 0.24, a: drs ? 0.05 : 0.6, t: 0.09 }))), paint);
    for (const s of [-1, 1]) add(plate([[rwZ + 0.1, 0.45], [rwZ - 0.58, 0.42], [rwZ - 0.62, 1.04], [rwZ - 0.12, 1.04], [rwZ + 0.12, 0.72]], 0.012), paint, s * (W + 0.008), 0, 0);
    louvres(W + 0.008, rwZ - 0.32, 0.55, 5); centrePillar(0.8); pod(0.98, rwZ - 0.22); rwDecalX = W + 0.016;
  } else if (E.rw === "tall") {
    const W = 0.375;
    add(wing(span(-W, W, 20, () => ({ y: 0.88, z: rwZ, c: 0.38, a: 0.14, t: 0.1 }))), carbon);
    add(wing(span(-W, W, 20, () => ({ y: 1.0, z: rwZ - 0.3, c: 0.24, a: drs ? 0.05 : 0.62, t: 0.09 }))), paint);
    for (const s of [-1, 1]) add(plate([[rwZ + 0.06, 0.3], [rwZ - 0.55, 0.3], [rwZ - 0.55, 1.12], [rwZ + 0.06, 1.12]], 0.012), paint, s * (W + 0.008), 0, 0);
    louvres(W + 0.008, rwZ - 0.22, 0.45, 8); centrePillar(0.88); pod(1.06, rwZ - 0.22); rwDecalX = W + 0.016;
  } else {
    // 1998–2008: an upper multi-element wing and a lower wing, between big endplates
    const W = 0.5;
    for (const [y, z, c, a, m] of [[0.8, rwZ, 0.3, 0.12, carbon], [0.87, rwZ - 0.24, 0.18, 0.5, paint], [0.95, rwZ - 0.37, 0.12, 0.85, paint], [0.5, rwZ + 0.05, 0.22, 0.2, carbon]]) add(wing(span(-W, W, 20, () => ({ y, z, c, a, t: 0.1 }))), m);
    for (const s of [-1, 1]) add(plate([[rwZ + 0.08, 0.42], [rwZ - 0.46, 0.42], [rwZ - 0.46, 0.98], [rwZ - 0.3, 1.0], [rwZ + 0.06, 0.92]], 0.012), paint, s * (W + 0.008), 0, 0);
    centrePillar(0.5); rwDecalX = W + 0.016;
  }
  for (const s of [-1, 1]) add(new THREE.PlaneGeometry(0.34, 0.085), decal(team, { color: "#FFFFFF", w: 512, h: 128, font: "700 92px BC" }), s * rwDecalX, rwDecalY, rwZ - 0.24, 0, s * Math.PI / 2, 0).castShadow = false;
  if (E.beam) { add(wing(span(-0.45, 0.45, 16, () => ({ y: 0.53, z: rwZ - 0.08, c: 0.15, a: 0.2, t: 0.1 }))), carbon); add(wing(span(-0.45, 0.45, 16, () => ({ y: 0.61, z: rwZ - 0.24, c: 0.12, a: 0.5, t: 0.1 }))), carbon); }
  if (E.monkey) add(wing(span(-0.2, 0.2, 8, () => ({ y: 0.5, z: rwZ + 0.25, c: 0.12, a: 0.4, t: 0.1 }))), carbon);

  // ---------- wheels and suspension (inboard ends sit on the tub / gearbox) ----------
  const rubber = new THREE.MeshStandardMaterial({ map: tyreMap(compound, compoundName, E.grooves), roughness: 0.78 });
  const rimM = new THREE.MeshStandardMaterial({ color: rimColor ?? E.rimCol, metalness: 0.9, roughness: 0.25 });
  const coverM = new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.3, metalness: 0.3, clearcoat: 0.8 });
  const nutM = new THREE.MeshStandardMaterial({ color: 0xE11B22, metalness: 0.6, roughness: 0.35 });
  const R = E.r, RIM = E.rim;
  const prof = (w) => { const sd = R - RIM; return [[RIM + 0.002, -w / 2 + 0.012], [RIM + sd * 0.15, -w / 2 - 0.002], [RIM + sd * 0.45, -w / 2 - 0.009], [RIM + sd * 0.72, -w / 2 - 0.005], [R - 0.012, -w / 2 + 0.012], [R - 0.004, -w / 2 + 0.035], [R - 0.001, -w / 2 + 0.07], [R, 0], [R - 0.001, w / 2 - 0.07], [R - 0.004, w / 2 - 0.035], [R - 0.012, w / 2 - 0.012], [RIM + sd * 0.72, w / 2 + 0.005], [RIM + sd * 0.45, w / 2 + 0.009], [RIM + sd * 0.15, w / 2 + 0.002], [RIM + 0.002, w / 2 - 0.012]].map(([r, y]) => new THREE.Vector2(r, y)); };
  for (const [x, z, w, front] of [[-E.tf, zf, E.wf, true], [E.tf, zf, E.wf, true], [-E.tr, zr, E.wr, false], [E.tr, zr, E.wr, false]]) {
    const s = Math.sign(x), wg = new THREE.Group(); wg.position.set(x, R, z);
    if (front && damage.tilt && s === damage.tiltSide) { wg.rotation.z = damage.tilt; wg.rotation.y = damage.tilt * 1.6; wg.position.x += s * 0.08; }
    const tg = new THREE.LatheGeometry(prof(w), 72); tg.rotateZ(Math.PI / 2);
    const tm = new THREE.Mesh(tg, rubber); tm.castShadow = tm.receiveShadow = true; wg.add(tm);
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(RIM + 0.003, RIM + 0.003, w * 0.9, 48, 1, true), rimM); lip.rotation.z = Math.PI / 2; wg.add(lip);
    if (E.covers) { const cov = new THREE.Mesh(new THREE.CylinderGeometry(RIM - 0.001, RIM - 0.014, 0.02, 48), coverM); cov.rotation.z = Math.PI / 2; cov.position.x = s * (w / 2 - 0.02); wg.add(cov); }
    else { const dish = new THREE.Mesh(new THREE.CylinderGeometry(RIM * 0.98, RIM * 0.5, 0.05, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x15161A, roughness: 0.6, side: THREE.DoubleSide })); dish.rotation.z = Math.PI / 2; dish.position.x = s * (w / 2 - 0.05); wg.add(dish); for (let k = 0; k < 10; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.012, RIM * 0.85, 0.022), rimM); const a = (k / 10) * Math.PI * 2; sp.position.set(s * (w / 2 - 0.035), Math.cos(a) * RIM * 0.5, Math.sin(a) * RIM * 0.5); sp.rotation.x = -a; wg.add(sp); } }
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 6), nutM); nut.rotation.z = Math.PI / 2; nut.position.x = s * (w / 2 + 0.005); wg.add(nut);
    const duct = new THREE.Mesh(boxUV(new THREE.CylinderGeometry(RIM * 0.85, RIM * 0.9, 0.12, 32)), carbonMatte); duct.rotation.z = Math.PI / 2; duct.position.x = -s * (w / 2 + 0.03); wg.add(duct);
    // brake disc and caliper inside the rim; glows orange when hot
    { const hot = front ? glow : glow * 0.7, discM = new THREE.MeshStandardMaterial({ color: 0x3A3632, roughness: 0.6, metalness: 0.4, emissive: new THREE.Color(1, 0.33, 0.06), emissiveIntensity: hot * 5, toneMapped: hot < 0.05 });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(RIM * 0.82, RIM * 0.82, 0.032, 40), discM); disc.rotation.z = Math.PI / 2; disc.position.x = s * (w / 2 - 0.09); wg.add(disc);
      for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.006, 0.006), new THREE.MeshStandardMaterial({ color: 0x111111 })); d.position.set(s * (w / 2 - 0.09), Math.cos(a) * RIM * 0.6, Math.sin(a) * RIM * 0.6); wg.add(d); }
      const cal = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.13, 0.08, 2, 0.015), new THREE.MeshStandardMaterial({ color: 0x1A1B1F, roughness: 0.4, metalness: 0.5 })); cal.position.set(s * (w / 2 - 0.09), RIM * 0.62, -RIM * 0.25); wg.add(cal);
      if (hot > 0.05) { const pl = new THREE.PointLight(0xFF6A1A, hot * 1.6, 1.6, 2); pl.position.set(s * (w / 2 - 0.05), 0, 0); wg.add(pl); } }
    if (front && E.deflectors) { const def = new THREE.Mesh(boxUV(new THREE.CylinderGeometry(R + 0.033, R + 0.033, 0.24, 24, 1, true, Math.PI * 0.18, Math.PI * 0.42)), carbon); def.rotation.z = Math.PI / 2; def.castShadow = true; wg.add(def); }
    g.add(wg); (g.userData.wheels ??= []).push({ group: wg, front, side: s });
    if (front && damage.tilt && s === damage.tiltSide) continue;
    const ux = x - s * (w / 2 + 0.06);
    if (front) {
      // front: pickups on the sides of the chassis, upper pair high, lower pair low
      const up = (dz) => onTub(s, tubAt(z + dz).yc + tubAt(z + dz).ht * 0.55, z + dz), lo = (dz) => onTub(s, tubAt(z + dz).yc - tubAt(z + dz).hb * 0.6, z + dz);
      arm(up(0.25), [ux, R + 0.17, z], 0.06, 0.02); arm(up(-0.28), [ux, R + 0.17, z], 0.06, 0.02);
      arm(lo(0.32), [ux, R - 0.15, z], 0.06, 0.02); arm(lo(-0.3), [ux, R - 0.15, z], 0.06, 0.02);
      arm(onTub(s, tubAt(z + 0.1).yc, z + 0.1), [ux, R + 0.02, z + 0.12], 0.045, 0.018); // track rod
      arm([ux + s * 0.02, R - 0.12, z - 0.02], up(-0.12), 0.04, 0.028); // push rod
    } else {
      // rear: pickups on the gearbox casing
      const gz = z, gk = tubAt(gz), gx = (y) => [s * Math.max(0.06, halfWidthAt(gk, y) - 0.01), y];
      arm([...gx(gk.yc + gk.ht * 0.3), gz + 0.22], [ux, R + 0.16, z], 0.06, 0.02); arm([...gx(gk.yc + gk.ht * 0.3), gz - 0.2], [ux, R + 0.16, z], 0.06, 0.02);
      arm([...gx(gk.yc - gk.hb * 0.5), gz + 0.26], [ux, R - 0.15, z], 0.06, 0.02); arm([...gx(gk.yc - gk.hb * 0.5), gz - 0.22], [ux, R - 0.15, z], 0.06, 0.02);
      arm([...gx(gk.yc), gz - 0.15], [ux, R, z - 0.14], 0.045, 0.018);
      arm([ux + s * 0.02, R + 0.14, z + 0.02], [...gx(gk.yc - gk.hb * 0.4), gz + 0.15], 0.04, 0.028); // pull rod
      // driveshaft
      const ds = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, Math.abs(ux) - 0.08, 10), metal); ds.rotation.z = Math.PI / 2; ds.position.set((ux + s * 0.08) / 2, R, z); g.add(ds);
    }
  }
  return g;
}

// ---------- steering wheel (2026 style): yoke shape with long grips, coloured buttons, three rotaries ----------
const MM = 5, FX0 = -150, FX1 = 150, FY0 = -135, FY1 = 82, FW = FX1 - FX0, FH = FY1 - FY0;
export const WHEEL26_BTN = [
  // left shoulder
  ["DRS", "#2D6BFF", -104, 50], ["N", "#2FD27A", -82, 40], ["PL", "#FFD23F", -116, 26], ["RADIO", "#FFD23F", -92, 18], ["BOX", "#E8002D", -112, 0], ["OK", "#E8EAF0", -88, -8],
  // right shoulder
  ["OT", "#FF8A1F", 104, 50], ["P", "#FF8A1F", 82, 40], ["MARK", "#9B59FF", 116, 26], ["+1", "#C3C9D4", 92, 18], ["-1", "#C3C9D4", 112, 0], ["BB", "#2D6BFF", 88, -8],
  // above the grips
  ["CHRG", "#2FD27A", -100, -28], ["DIFF", "#E8EAF0", 100, -28],
];
function wheelFace26(emissiveOnly) {
  return canvas(FW * MM, FH * MM, (g, w, h) => {
    const X = (x) => (x - FX0) * MM, Y = (y) => (FY1 - y) * MM, R = (r) => r * MM;
    if (!emissiveOnly) { g.fillStyle = "#151619"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 10) for (let x = 0; x < w; x += 10) { g.fillStyle = ((x + y) / 10) % 4 < 2 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.08)"; g.fillRect(x, y, 10, 10); } } else { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); }
    const label = (t, x, y, size = 4, col = "#E6E8EC") => { if (emissiveOnly) return; g.fillStyle = col; g.font = `700 ${R(size)}px BC`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, X(x), Y(y)); };
    const txt = (t, x, y, size, col, align = "left", font = "JB") => { g.fillStyle = col; g.font = `600 ${R(size)}px ${font}`; g.textAlign = align; g.textBaseline = "middle"; g.fillText(t, X(x), Y(y)); };
    // shift lights across the top
    for (let k = 0; k < 15; k++) { const x = -56 + k * 8, lit = k < 9, c = k < 5 ? "#2BFF6A" : k < 10 ? "#FF2B2B" : "#3B7BFF"; g.beginPath(); g.arc(X(x), Y(70), R(2.8), 0, 7); g.fillStyle = lit ? c : emissiveOnly ? "#000" : "#2a2c31"; g.fill(); }
    // screen: a grid of numbers like the real ones
    const sx0 = -62, sx1 = 62, sy0 = 4, sy1 = 62;
    g.fillStyle = "#020304"; g.fillRect(X(sx0), Y(sy1), R(sx1 - sx0), R(sy1 - sy0));
    g.strokeStyle = "#1f2a33"; g.lineWidth = R(0.5); for (const [a, b, c, d] of [[sx0, 36, sx1, 36], [sx0, 20, sx1, 20], [-20, sy1, -20, sy0], [20, sy1, 20, sy0]]) { g.beginPath(); g.moveTo(X(a), Y(b)); g.lineTo(X(c), Y(d)); g.stroke(); }
    txt("1:45.887", sx0 + 2, 57, 4.4, "#2FD27A"); txt("+0.00", sx1 - 2, 57, 4.4, "#2FD27A", "right"); txt("S2 31.204", 0, 57, 3.6, "#FF6B6B", "center");
    txt("8", 0, 28, 24, "#FFFFFF", "center", "BC");
    txt("100", -58, 45, 6.5, "#E8EAF0"); txt("BB 56", -58, 28, 4.4, "#FFB547"); txt("13", -58, 13, 5.5, "#FF6B6B");
    txt("9", 58, 45, 6.5, "#E8EAF0", "right"); txt("-2.0", 58, 28, 4.4, "#FFB547", "right"); txt("14", 58, 13, 5.5, "#FF6B6B", "right");
    txt("94", -58, 7, 3.4, "#9AA3B2"); txt("ERS 78%", 0, 8, 4, "#6EE7A8", "center"); txt("105", 58, 7, 3.4, "#9AA3B2", "right");
    g.fillStyle = "#2FD27A"; g.fillRect(X(-18), Y(15), R(36 * 0.78), R(2.5)); g.strokeStyle = "#2FD27A"; g.strokeRect(X(-18), Y(15), R(36), R(2.5));
    if (emissiveOnly) return;
    for (const [t, c, x, y] of WHEEL26_BTN) { g.beginPath(); g.arc(X(x), Y(y), R(6.2), 0, 7); g.fillStyle = "#08090b"; g.fill(); label(t, x, y - 9.5, 3.4); }
    // three rotaries: MODE, the big multi-coloured strategy one, and TRQ
    const rot = (x, y, r, labs, cols, name) => { g.beginPath(); g.arc(X(x), Y(y), R(r + 1.5), 0, 7); g.fillStyle = "#0b0c0e"; g.fill(); labs.forEach((l, k) => { const a = -Math.PI * 0.8 + (k / (labs.length - 1)) * Math.PI * 1.6; const lx = x + Math.sin(a) * (r + 6), ly = y + Math.cos(a) * (r + 6); g.beginPath(); g.arc(X(lx), Y(ly), R(3.2), 0, 7); g.fillStyle = cols[k % cols.length]; g.fill(); g.fillStyle = "#0b0c0e"; g.font = `700 ${R(2.6)}px BC`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(l, X(lx), Y(ly)); }); label(name, x, y - r - 11, 3.4, "#FFB547"); };
    rot(-38, -42, 8, ["1", "2", "3", "4", "5", "6", "7", "8"], ["#C3C9D4"], "MODE");
    rot(0, -48, 11, ["RACE", "QUAL", "SC", "LAP", "PIT", "OT", "CHG", "DEF", "WET", "SAFE"], ["#FFD23F", "#2FD27A", "#5AA9FF", "#FF6B6B", "#C59BFF", "#FFB547"], "STRATEGY");
    rot(38, -42, 8, ["1", "2", "3", "4", "5", "6", "7", "8"], ["#C3C9D4"], "TRQ");
    // small toggles at the grip tops
    for (const [x, t] of [[-62, "ENT"], [62, "EXIT"]]) { g.beginPath(); g.arc(X(x), Y(-20), R(5), 0, 7); g.fillStyle = "#0b0c0e"; g.fill(); label(t, x, -29, 3.2, "#9AA3B2"); }
  });
}
let face26 = null, face26e = null;
export function buildWheel26(helmet = ["#FFA51F", "#16171B"]) {
  const sw = new THREE.Group(), mm = (v) => v / 1000;
  if (!face26) { face26 = tex(wheelFace26(false)); face26e = tex(wheelFace26(true)); for (const t of [face26, face26e]) t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
  // outline (as the driver sees it): flat top, shoulders with buttons, two long grips going down, open between them
  const sh = new THREE.Shape(), P = (x, y) => [mm(x), mm(y)];
  sh.moveTo(...P(-70, 80)); sh.lineTo(...P(70, 80)); sh.quadraticCurveTo(...P(92, 80), ...P(106, 68));
  sh.quadraticCurveTo(...P(130, 50), ...P(136, 24)); sh.quadraticCurveTo(...P(142, -10), ...P(140, -50)); sh.lineTo(...P(138, -112)); sh.quadraticCurveTo(...P(136, -132), ...P(116, -132));
  sh.quadraticCurveTo(...P(96, -132), ...P(94, -112)); sh.lineTo(...P(92, -70)); sh.quadraticCurveTo(...P(70, -64), ...P(56, -72)); sh.quadraticCurveTo(...P(30, -78), ...P(0, -78));
  sh.quadraticCurveTo(...P(-30, -78), ...P(-56, -72)); sh.quadraticCurveTo(...P(-70, -64), ...P(-92, -70)); sh.lineTo(...P(-94, -112)); sh.quadraticCurveTo(...P(-96, -132), ...P(-116, -132));
  sh.quadraticCurveTo(...P(-136, -132), ...P(-138, -112)); sh.lineTo(...P(-140, -50)); sh.quadraticCurveTo(...P(-142, -10), ...P(-136, 24)); sh.quadraticCurveTo(...P(-130, 50), ...P(-106, 68)); sh.quadraticCurveTo(...P(-92, 80), ...P(-70, 80));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 3, curveSegments: 16 });
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) * 1000 - FX0) / FW, (pos.getY(i) * 1000 - FY0) / FH);
  geo.translate(0, 0, -0.011);
  sw.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: face26, emissiveMap: face26e, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.45, metalness: 0.1 })));
  // rubber grips over the two long handles, and gloves holding them
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.95 }), gloveM = new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.85 });
  for (const s of [-1, 1]) {
    const grip = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.088, 0.034, 4, 0.014), rubber); grip.position.set(s * 0.117, -0.086, 0); sw.add(grip);
    const grip2 = new THREE.Mesh(new RoundedBoxGeometry(0.036, 0.05, 0.03, 4, 0.012), rubber); grip2.position.set(s * 0.132, -0.02, 0); grip2.rotation.z = s * 0.08; sw.add(grip2);
    // glove: palm behind the grip, four fingers wrapped round the front, thumb on the face, cuff
    const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.07, 6, 12), gloveM); palm.position.set(s * 0.122, -0.07, -0.024); palm.scale.set(1.15, 1, 0.9); sw.add(palm);
    for (let f = 0; f < 4; f++) { const fg = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.0115, 8, 16, Math.PI * 1.1), gloveM); fg.rotation.set(0, Math.PI / 2, 0); fg.rotation.z = 0; fg.position.set(s * 0.12, -0.05 - f * 0.022, 0.0); fg.rotateX(-Math.PI * 0.55); sw.add(fg); }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.04, 4, 8), gloveM); thumb.position.set(s * 0.098, -0.03, 0.02); thumb.rotation.z = s * 0.7; sw.add(thumb);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x2A2D33, roughness: 0.8 })); cuff.position.set(s * 0.125, -0.13, -0.04); cuff.rotation.x = 0.5; sw.add(cuff);
    const band = new THREE.Mesh(new THREE.CapsuleGeometry(0.0265, 0.012, 4, 12), new THREE.MeshStandardMaterial({ color: helmet[0], roughness: 0.8 })); band.position.set(s * 0.12, -0.105, -0.016); sw.add(band);
    for (const [y, l] of [[0.035, 0.09], [-0.01, 0.08]]) { const pd = new THREE.Mesh(boxUV(new RoundedBoxGeometry(l, 0.028, 0.004, 2, 0.002)), carbon); pd.position.set(s * 0.1, y, -0.03); pd.rotation.z = s * -0.25; sw.add(pd); }
  }
  for (const [, c, x, y] of WHEEL26_BTN) { const b = new THREE.Mesh(new THREE.CylinderGeometry(mm(5), mm(5.6), mm(4), 20), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 0.8 })); b.rotation.x = Math.PI / 2; b.position.set(mm(x), mm(y), 0.0165); sw.add(b); }
  const knurl = new THREE.MeshStandardMaterial({ color: 0x8E949C, metalness: 0.9, roughness: 0.3 });
  for (const [x, y, r] of [[-38, -42, 8], [0, -48, 11], [38, -42, 8], [-62, -20, 4.5], [62, -20, 4.5]]) { const rr = new THREE.Mesh(new THREE.CylinderGeometry(mm(r), mm(r + 0.5), mm(9), 24), knurl); rr.rotation.x = Math.PI / 2; rr.position.set(mm(x), mm(y), 0.016); sw.add(rr); const ptr = new THREE.Mesh(new THREE.BoxGeometry(mm(1.4), mm(r * 0.7), mm(1)), new THREE.MeshStandardMaterial({ color: 0xFFB547, emissive: 0xFFB547, emissiveIntensity: 0.4 })); ptr.position.set(mm(x), mm(y + r * 0.35), 0.021); sw.add(ptr); }
  for (let k = 0; k < 15; k++) { const led = new THREE.Mesh(new THREE.SphereGeometry(mm(2.8), 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: k < 5 ? 0x22FF55 : k < 10 ? 0xFF2222 : 0x3377FF, emissiveIntensity: k < 9 ? 2.5 : 0.1 })); led.rotation.x = Math.PI / 2; led.position.set(mm(-56 + k * 8), mm(70), 0.0152); sw.add(led); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.05, 20), knurl); hub.rotation.x = Math.PI / 2; hub.position.set(0, 0, -0.04); sw.add(hub);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), new THREE.MeshBasicMaterial({ color: 0x050506, side: THREE.DoubleSide })); back.position.set(0, -0.14, -0.06); sw.add(back);
  return sw;
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

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

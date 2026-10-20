// The real surroundings of a circuit, from OpenStreetMap (lined up with the track by
// scripts/race-align.mjs; tr.map): buildings at their real size and height, lakes, harbours, the sea and
// swimming pools, woods and single trees, the track's tunnels, bridges that carry roads and footpaths
// over the track, and the track's own bridges. Map data © OpenStreetMap contributors (ODbL).
import * as THREE from "three";

let seed = 4242; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const hash = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
function pointInPoly(x, y, P) { let inside = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; } return inside; }
const area = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return Math.abs(a / 2); };
const centroid = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];

// window facades by day and lit at night (shared with the made-up buildings in trackprops.js)
export const FACADES = {
  glass: { bg: "#5F7F98", win: (g, x, y) => { g.fillStyle = `rgb(${70 + rnd() * 30},${105 + rnd() * 30},${130 + rnd() * 30})`; g.fillRect(x, y, 19, 30); g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(x, y, 19, 4); }, dx: 21, dy: 32 },
  office: { bg: "#B9BEC6", win: (g, x, y) => { g.fillStyle = rnd() < 0.15 ? "#3A4656" : "#5C6B7E"; g.fillRect(x, y, 14, 20); }, dx: 21, dy: 32 },
  flats: { bg: "#D8CDB8", win: (g, x, y) => { g.fillStyle = "#4C5563"; g.fillRect(x + 2, y + 4, 12, 16); g.fillStyle = "#EFE8DA"; g.fillRect(x - 2, y + 22, 22, 4); }, dx: 24, dy: 32 },
  brick: { bg: "#8E5A45", win: (g, x, y) => { g.fillStyle = "#2E3440"; g.fillRect(x + 3, y + 6, 10, 15); g.fillStyle = "#C9B79F"; g.fillRect(x + 2, y + 21, 12, 2); }, dx: 21, dy: 32 },
  metal: { bg: "#C3C8CE", win: (g, x, y) => { if (rnd() < 0.25) { g.fillStyle = "#56606E"; g.fillRect(x, y + 8, 18, 8); } g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(x + 19, y, 2, 32); }, dx: 21, dy: 32 },
};
export function facadeMaterials({ tex, canvas, isNight, dusk }) {
  const facTex = (k, lit) => tex(canvas(256, 512, (g, w, h) => {
    const F = FACADES[k]; g.fillStyle = lit ? "#000" : F.bg; g.fillRect(0, 0, w, h);
    if (!lit && k === "brick") for (let y = 0; y < h; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < w; x += 12) { g.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.1})`; g.fillRect(x, y, 11, 5); }
    for (let y = 8; y < h; y += F.dy) for (let x = 6; x < w - 8; x += F.dx) {
      if (lit) { if (k !== "metal" && rnd() < (k === "glass" ? 0.4 : 0.5)) { g.fillStyle = k === "glass" ? `rgba(200,225,255,${0.6 + rnd() * 0.4})` : `rgba(255,${200 + rnd() * 40},${120 + rnd() * 60},1)`; g.fillRect(x + 1, y + 1, F.dx - 8, 18); } }
      else F.win(g, x, y);
    }
    if (!lit) { g.fillStyle = F.bg; g.fillRect(w - 4, h - 4, 4, 4); } // (the corner the roofs use: plain)
  }));
  const mats = {};
  for (const k of Object.keys(FACADES)) {
    const day = facTex(k, false), nightT = isNight || dusk ? facTex(k, true) : null;
    mats[k] = new THREE.MeshStandardMaterial({ map: day, vertexColors: true, color: isNight ? 0x3A3F48 : 0xFFFFFF, roughness: k === "glass" ? 0.25 : 0.75, metalness: k === "glass" ? 0.5 : k === "metal" ? 0.3 : 0.05, emissiveMap: nightT, emissive: nightT ? 0xFFFFFF : 0x000000, emissiveIntensity: isNight ? 1.5 : nightT ? 0.45 : 0 });
  }
  return mats;
}

// ---------- before the terrain is built: how high the water is, and where the ground has to go under it ----------
export function prepareMap(tr) {
  const M = tr.map; if (!M) return;
  const { N, X, Z, Y } = tr, carve = (tr.carveExtra ??= []);
  // the water's level: a little below the lowest bit of track nearby (a harbour quay, a lakeside straight)
  const levelNear = (pts, reach, below) => { let lo = Infinity; for (let i = 0; i < N; i += 4) { for (let k = 0; k < pts.length; k += Math.max(1, Math.floor(pts.length / 40))) { const [x, z] = pts[k]; if ((X[i] - x) ** 2 + (Z[i] - z) ** 2 < reach * reach) { lo = Math.min(lo, Y[i]); break; } } } return (lo === Infinity ? Math.min(...Y) - 2 : lo) - below; };
  const fill = (P, step, h) => { const xs = P.map((p) => p[0]), zs = P.map((p) => p[1]); for (let x = Math.min(...xs); x <= Math.max(...xs); x += step) for (let z = Math.min(...zs); z <= Math.max(...zs); z += step) if (pointInPoly(x, z, P)) carve.push([x, z, h]); for (const [x, z] of P) carve.push([x, z, h]); };
  tr.water = [];
  for (const a of M.areas) {
    if (a.k !== "water" && a.k !== "pool") continue;
    const pool = a.k === "pool", ar = area(a.p); if (ar < (pool ? 30 : 200)) continue;
    const level = levelNear(a.p, pool ? 80 : 220, pool ? 0.9 : 1.6);
    tr.water.push({ p: a.p, level, pool }); fill(a.p, 5, level - (pool ? 1.6 : 2.2));
  }
  if (M.sea) {
    const S = M.sea, pts = S.rows.filter((_, k) => k % 7 === 0).map(([iz, a]) => [S.x0 + (a + 0.5) * S.cell, S.z0 + (iz + 0.5) * S.cell]);
    S.level = levelNear(pts, 260, 1.8);
    for (const [iz, a, n] of S.rows) for (let ix = a; ix <= a + n; ix++) for (const dz of [0, 1]) carve.push([S.x0 + ix * S.cell, S.z0 + (iz + dz) * S.cell, S.level - 3]);
  }
  // under the track's own bridges the ground drops away
  for (const [a, b] of M.bridges ?? []) for (let i = a; i <= b; i += 2) for (let o = -tr.half - 3; o <= tr.half + 3; o += 3) carve.push([X[i] + tr.LX[i] * o, Z[i] + tr.LZ[i] * o, Y[i] - 7]);
}

// ---------- the meshes ----------
export function buildMap(ctx) {
  const { tr, group, tex, canvas, groundAt, strip, sided, inKeepOut, clearOfPit, isNight, dusk, sideK, conc } = ctx;
  const M = tr.map, { N, X, Z, Y, LX, LZ, TX, TZ } = tr, W = tr.wall;
  const blockHash = new Map(), BC = 30;
  const block = (x, z, r) => { for (let a = Math.floor((x - r) / BC); a <= Math.floor((x + r) / BC); a++) for (let b = Math.floor((z - r) / BC); b <= Math.floor((z + r) / BC); b++) { const k = a * 100003 + b; if (!blockHash.has(k)) blockHash.set(k, []); blockHash.get(k).push([x, z, r]); } };
  const blocked = (x, z, pad = 0) => { for (const [bx, bz, r] of blockHash.get(Math.floor(x / BC) * 100003 + Math.floor(z / BC)) ?? []) if ((bx - x) ** 2 + (bz - z) ** 2 < (r + pad) ** 2) return true; return false; };
  if (!M) return { blocked, buildings: 0, treeSpots: [] };
  const cellsOf = (list, size, key) => { const cells = new Map(); for (const t of list) { const c = key(t), k = Math.floor(c[0] / size) * 10007 + Math.floor(c[1] / size); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(t); } return [...cells.values()]; };

  // ---------- buildings ----------
  const mats = facadeMaterials({ tex, canvas, isNight, dusk });
  const TYPE_H = { house: 7, detached: 7, semidetached_house: 7, terrace: 9, bungalow: 4.5, apartments: 21, residential: 15, commercial: 16, office: 22, retail: 8, supermarket: 7, industrial: 10, warehouse: 11, hangar: 12, garage: 3.5, garages: 3.5, shed: 3, hut: 3, kiosk: 3, roof: 5, carport: 3.5, grandstand: 14, church: 18, cathedral: 26, hotel: 32, public: 14, civic: 14, government: 16, school: 11, university: 15, hospital: 22, train_station: 12, stadium: 22, parking: 12, service: 4, transformer_tower: 6, construction: 8 };
  const STYLE = (b, h, x, z) => {
    const t = b.b ?? "yes";
    if (["industrial", "warehouse", "hangar", "garage", "garages", "shed", "hut", "service", "roof", "carport", "grandstand", "parking", "stadium", "construction", "transformer_tower"].includes(t)) return "metal";
    if (["church", "cathedral", "chapel"].includes(t)) return "brick";
    if (["house", "detached", "semidetached_house", "terrace", "bungalow", "apartments", "residential", "dormitory"].includes(t)) return h > 40 ? "glass" : hash(x, z) < 0.25 ? "brick" : "flats";
    if (h > 34) return hash(x, z) < 0.7 ? "glass" : "office";
    return ["office", "flats", "brick", "office", "flats"][Math.floor(hash(x, z) * 5)];
  };
  const city = tr.cfg.scenery === "city";
  const parts = new Map(); // style → list of {pos, nor, uv, col}
  const get = (k) => { if (!parts.has(k)) parts.set(k, []); return parts.get(k); };
  const bd = [];
  let nB = 0;
  for (const b of M.buildings) {
    let P = b.p; if (P.length < 3) continue;
    const [cx, cz] = centroid(P), ar = area(P);
    // never on the pits, the garages, the stands or the pit road
    if (inKeepOut(cx, cz, 2) || P.some(([x, z]) => inKeepOut(x, z, 1) || !clearOfPit(x, z, 2))) continue;
    let h = b.h ?? TYPE_H[b.b] ?? (ar < 80 ? 5 : ar < 300 ? (city ? 14 : 8) : city ? 22 : 11);
    if (!b.h) h *= 0.8 + hash(cx, cz) * 0.45;
    let base = Math.min(...P.map(([x, z]) => groundAt(x, z).h)) - 0.2;
    if (b.mh) base += b.mh;
    if (b.tun) { let bi = 0, bdd = Infinity; for (let i = 0; i < N; i += 2) { const d = (X[i] - cx) ** 2 + (Z[i] - cz) ** 2; if (d < bdd) { bdd = d; bi = i; } } base = Math.max(base, Y[bi] + 7.6); }
    const slab = b.b === "roof" || b.b === "carport";
    const bottom = slab ? base + Math.max(2.8, h - 1) : base - 3, top = base + h;
    const style = STYLE(b, h, cx, cz), L = get(Math.floor(cx / 450) * 10007 + Math.floor(cz / 450) + "|" + style);
    // tint: the map's colour if it has one, otherwise a little variety
    const tint = new THREE.Color(1, 1, 1); if (b.c) { try { tint.set(b.c); tint.lerp(new THREE.Color(1, 1, 1), 0.35); } catch {} } else tint.setHSL(0.08 + hash(cz, cx) * 0.5, 0.06 + hash(cx * 3, cz) * 0.1, 0.8 + hash(cx, cz * 7) * 0.18);
    // make the outline counter-clockwise seen from above, so the walls face out
    let sa = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) sa += (P[j][0] - P[i][0]) * (P[j][1] + P[i][1]);
    if (sa > 0) P = P.slice().reverse();
    const pos = [], nor = [], uv = [], col = []; let u = 0;
    for (let i = 0; i < P.length; i++) {
      const [x0, z0] = P[i], [x1, z1] = P[(i + 1) % P.length], dx = x1 - x0, dz = z1 - z0, L2 = Math.hypot(dx, dz); if (L2 < 0.05) continue;
      let nx = -dz / L2, nz = dx / L2; if (pointInPoly((x0 + x1) / 2 + nx * 0.2, (z0 + z1) / 2 + nz * 0.2, P)) { nx = -nx; nz = -nz; }
      const quad = [[x0, bottom, z0, u, 0], [x1, bottom, z1, u + L2, 0], [x1, top, z1, u + L2, top - bottom], [x0, top, z0, u, top - bottom]];
      // two triangles, wound to face (nx, nz)
      const ex = x1 - x0, ez = z1 - z0, cxn = -ez * (top - bottom), czn = ex * (top - bottom), ok = cxn * nx + czn * nz > 0;
      for (const t of ok ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]) { const q = quad[t]; pos.push(q[0], q[1], q[2]); nor.push(nx, 0, nz); uv.push(q[3] / 24, (q[4] + (bottom - base)) / 48); col.push(tint.r, tint.g, tint.b); }
      u += L2;
    }
    // the roof (and, for a canopy, its underside)
    const tri = THREE.ShapeUtils.triangulateShape(P.map(([x, z]) => new THREE.Vector2(x, z)), []);
    for (const [a, b2, c] of tri) {
      const A = P[a], B = P[b2], Cc = P[c], up = (B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0]) < 0; // (y-up normal when the 2D cross product in x/z is negative)
      for (const q of up ? [A, B, Cc] : [A, Cc, B]) { pos.push(q[0], top, q[1]); nor.push(0, 1, 0); uv.push(0.995, 0.995); col.push(0.42, 0.43, 0.45); }
      if (slab) for (const q of up ? [A, Cc, B] : [A, B, Cc]) { pos.push(q[0], bottom, q[1]); nor.push(0, -1, 0); uv.push(0.995, 0.995); col.push(0.5, 0.5, 0.52); }
    }
    L.push({ pos, nor, uv, col }); nB++;
    block(cx, cz, Math.sqrt(ar / Math.PI) + 2); bd.push([cx, cz]);
  }
  for (const [key, list] of parts) {
    const style = key.split("|")[1], pos = [], nor = [], uv = [], col = [];
    for (const p of list) { pos.push(...p.pos); nor.push(...p.nor); uv.push(...p.uv); col.push(...p.col); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mats[style]); m.receiveShadow = true; m.castShadow = false; group.add(m);
  }

  // ---------- water: lakes, rivers, harbours and pools; the sea ----------
  const waterN = tex(canvas(256, 256, (g, w, h) => { const img = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, a = Math.sin(x * 0.11 + Math.sin(y * 0.05) * 2) * 0.5 + Math.sin(y * 0.17 + x * 0.03) * 0.5; img.data[i] = 128 + a * 22; img.data[i + 1] = 128 + Math.cos(x * 0.07 + y * 0.09) * 22; img.data[i + 2] = 255; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); }), false);
  waterN.repeat.set(0.05, 0.05);
  const waterM = new THREE.MeshStandardMaterial({ color: isNight ? 0x0C2235 : 0x2C5E78, roughness: 0.12, metalness: 0.25, normalMap: waterN, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.2 });
  const poolM = new THREE.MeshStandardMaterial({ color: 0x3FB5D8, roughness: 0.1, metalness: 0.1, normalMap: waterN, normalScale: new THREE.Vector2(0.15, 0.15) });
  const rimM = new THREE.MeshStandardMaterial({ color: 0xE9ECEF, roughness: 0.7 });
  // a competition pool seen from above: bright water over a pale floor, dark lane lines with T-ends
  const lanesT = tex(canvas(512, 256, (g2, w, h) => { const gr = g2.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#45C3E4"); gr.addColorStop(0.5, "#5ACDE8"); gr.addColorStop(1, "#45C3E4"); g2.fillStyle = gr; g2.fillRect(0, 0, w, h); g2.fillStyle = "#1E5C8C"; for (let k = 1; k < 8; k++) { const y = (k / 8) * h; g2.fillRect(w * 0.06, y - 3, w * 0.88, 6); g2.fillRect(w * 0.06, y - 10, 6, 20); g2.fillRect(w * 0.94 - 6, y - 10, 6, 20); } g2.fillRect(w * 0.06, 0, 4, h); g2.fillRect(w * 0.94 - 4, 0, 4, h); }));
  const poolLanesM = new THREE.MeshStandardMaterial({ map: lanesT, roughness: 0.08, metalness: 0.05, normalMap: waterN, normalScale: new THREE.Vector2(0.08, 0.08) });
  for (const w of tr.water ?? []) {
    const P = w.p, tri = THREE.ShapeUtils.triangulateShape(P.map(([x, z]) => new THREE.Vector2(x, z)), []), pos = [], uv = [];
    for (const [a, b, c] of tri) for (const q of [P[a], P[c], P[b]]) { pos.push(q[0], w.level, q[1]); uv.push(q[0], q[1]); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    // (make sure it faces up)
    if (g.attributes.normal.getY(0) < 0) { const p2 = g.attributes.position.array; for (let i = 0; i < p2.length; i += 9) for (let k = 0; k < 3; k++) { const t = p2[i + 3 + k]; p2[i + 3 + k] = p2[i + 6 + k]; p2[i + 6 + k] = t; } g.computeVertexNormals(); }
    // (a big pool gets lane lines along its length and a paved deck round it)
    const big = w.pool && area(P) > 250;
    if (big) {
      let bl = 0, ang = 0; for (let i = 0; i < P.length; i++) { const [x0, z0] = P[i], [x1, z1] = P[(i + 1) % P.length], L = Math.hypot(x1 - x0, z1 - z0); if (L > bl) { bl = L; ang = Math.atan2(z1 - z0, x1 - x0); } }
      const ca = Math.cos(-ang), sa = Math.sin(-ang), loc = P.map(([x, z]) => [x * ca - z * sa, x * sa + z * ca]);
      const u0 = Math.min(...loc.map((q) => q[0])), u1 = Math.max(...loc.map((q) => q[0])), v0 = Math.min(...loc.map((q) => q[1])), v1 = Math.max(...loc.map((q) => q[1]));
      const ua = g.attributes.uv.array, pa = g.attributes.position.array;
      for (let i = 0, j = 0; i < pa.length; i += 3, j += 2) { const x = pa[i], z = pa[i + 2]; ua[j] = (x * ca - z * sa - u0) / (u1 - u0); ua[j + 1] = (x * sa + z * ca - v0) / (v1 - v0); }
      const deck = [], o = 3.2, n = P.length, cw = (() => { let a = 0; for (let i = 0, j = n - 1; i < n; j = i++) a += (P[j][0] - P[i][0]) * (P[j][1] + P[i][1]); return a > 0 ? 1 : -1; })();
      const outP = P.map((q, i) => { const a = P[(i + n - 1) % n], b = P[(i + 1) % n], n1 = [q[1] - a[1], a[0] - q[0]], n2 = [b[1] - q[1], q[0] - b[0]], l1 = Math.hypot(...n1) || 1, l2 = Math.hypot(...n2) || 1, nx = n1[0] / l1 + n2[0] / l2, nz = n1[1] / l1 + n2[1] / l2, l = Math.hypot(nx, nz) || 1; return [q[0] - (cw * nx / l) * o, q[1] - (cw * nz / l) * o]; });
      for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], c = outP[(i + 1) % n], d = outP[i]; for (const q of [a, b, c, a, c, d]) deck.push(q[0], w.level + 0.32, q[1]); }
      const gd = new THREE.BufferGeometry(); gd.setAttribute("position", new THREE.Float32BufferAttribute(deck, 3)); gd.computeVertexNormals();
      group.add(new THREE.Mesh(gd, new THREE.MeshStandardMaterial({ color: 0xD9D6CF, roughness: 0.85, side: THREE.DoubleSide })));
    }
    const m = new THREE.Mesh(g, big ? poolLanesM : w.pool ? poolM : waterM); m.receiveShadow = true; group.add(m);
    if (w.pool) { // a white edge round the pool
      const pos2 = []; for (let i = 0; i < P.length; i++) { const [x0, z0] = P[i], [x1, z1] = P[(i + 1) % P.length]; pos2.push(x0, w.level + 0.3, z0, x1, w.level + 0.3, z1, x1, w.level - 0.4, z1, x0, w.level + 0.3, z0, x1, w.level - 0.4, z1, x0, w.level - 0.4, z0); }
      const g2 = new THREE.BufferGeometry(); g2.setAttribute("position", new THREE.Float32BufferAttribute(pos2, 3)); g2.computeVertexNormals(); group.add(new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ color: 0xDDE6EA, roughness: 0.6, side: THREE.DoubleSide })));
    }
    for (let k = 0; k < P.length; k += 2) block(P[k][0], P[k][1], 4);
    const [cx, cz] = centroid(P); block(cx, cz, Math.sqrt(area(P) / Math.PI));
  }
  if (M.sea) {
    const S = M.sea, pos = [], uv = [];
    for (const [iz, a, n] of S.rows) { const x0 = S.x0 + a * S.cell, x1 = S.x0 + (a + n) * S.cell, z0 = S.z0 + iz * S.cell, z1 = z0 + S.cell; pos.push(x0, S.level, z0, x0, S.level, z1, x1, S.level, z1, x0, S.level, z0, x1, S.level, z1, x1, S.level, z0); uv.push(x0, z0, x0, z1, x1, z1, x0, z0, x1, z1, x1, z0); for (let x = x0; x < x1; x += 24) block(x, z0 + 4, 14); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    if (g.attributes.normal.getY(0) < 0) { const p2 = g.attributes.position.array; for (let i = 0; i < p2.length; i += 9) for (let k = 0; k < 3; k++) { const t = p2[i + 3 + k]; p2[i + 3 + k] = p2[i + 6 + k]; p2[i + 6 + k] = t; } g.computeVertexNormals(); }
    const m = new THREE.Mesh(g, waterM); m.receiveShadow = true; group.add(m);
  }

  // ---------- tunnels: walls up to a roof, lights along the roof, the portals ----------
  if (M.tunnels?.length) {
    const lightG = new THREE.BoxGeometry(0.5, 0.08, 1.6), lightM = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFE9C4, emissiveIntensity: 2.2 }), spots = [];
    const tunM = new THREE.MeshStandardMaterial({ color: 0xBFC3C8, roughness: 0.85, side: THREE.DoubleSide });
    // (Monaco's tunnel is open on the harbour side: a row of square pillars under the roof's edge instead of a wall)
    const open = tr.cfg.tunnelOpen, pillars = [];
    for (const [a, b] of M.tunnels) {
      const H = 6.4, wl = (i) => W[0][i], wr = (i) => W[1][i];
      const prof = (i) => open === "left" ? [[-wr(i), 0], [-wr(i), H], [-wr(i) - 0.5, H + 1.6], [wl(i) + 1.7, H + 1.6], [wl(i) + 1.7, H - 0.9], [wl(i) + 0.2, H - 0.9]] : open === "right" ? [[-wr(i) - 0.2, H - 0.9], [-wr(i) - 1.7, H - 0.9], [-wr(i) - 1.7, H + 1.6], [wl(i) + 0.5, H + 1.6], [wl(i), H], [wl(i), 0]] : [[-wr(i), 0], [-wr(i), H], [-wr(i) - 0.5, H + 1.6], [wl(i) + 0.5, H + 1.6], [wl(i), H], [wl(i), 0]];
      strip(a, b, (i) => prof(i).reverse(), tunM, { vScale: 6 }).castShadow = true; // (its shadow darkens the inside round the car)
      if (open) for (let i = a + 4; i < b - 2; i += 8) pillars.push([i, open === "left" ? wl(i) + 1.0 : -(wr(i) + 1.0), H]);
      for (let i = a + 3; i < b; i += 7) spots.push(i);
      // portal faces: a band of wall above each opening
      for (const [e, dir] of [[a, -1], [b, 1]]) strip(e, e + 1, (i) => [[-wr(i) - 3, H], [-wr(i) - 3, H + 6], [wl(i) + 3, H + 6], [wl(i) + 3, H]].reverse(), tunM, { vScale: 6 });
    }
    if (pillars.length) {
      const pg = new THREE.BoxGeometry(1.3, 1, 1.5), pm = new THREE.InstancedMesh(pg, tunM, pillars.length), m = new THREE.Matrix4(), qq = new THREE.Quaternion(), upv = new THREE.Vector3(0, 1, 0);
      pillars.forEach(([i, o, H], j) => { qq.setFromAxisAngle(upv, Math.atan2(TX[i], TZ[i])); const y0 = Y[i] - 0.3, h = H - 0.9 + 0.3; m.compose(new THREE.Vector3(X[i] + LX[i] * o, y0 + h / 2 + (tr.bankH ? tr.bankH(i, o) : 0), Z[i] + LZ[i] * o), qq, new THREE.Vector3(1, h, 1)); pm.setMatrixAt(j, m); });
      pm.castShadow = true; pm.receiveShadow = true; group.add(pm);
    }
    const im = new THREE.InstancedMesh(lightG, lightM, spots.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    spots.forEach((i, j) => { q.setFromAxisAngle(up, Math.atan2(TX[i], TZ[i])); m4.compose(new THREE.Vector3(X[i], Y[i] + 6.3, Z[i]), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(j, m4); });
    group.add(im);
  }

  // ---------- bridges: the track's own (decks under it), and roads and footpaths crossing over it ----------
  const deckM = new THREE.MeshStandardMaterial({ color: 0x9EA3A8, roughness: 0.8, side: THREE.DoubleSide }), railM = new THREE.MeshStandardMaterial({ color: 0x6B7078, metalness: 0.5, roughness: 0.5 });
  const trackBridges = [...(M.bridges ?? [])];
  for (const c of tr.crossings) if (!trackBridges.some(([a, b]) => c.up >= a - 20 && c.up <= b + 20)) trackBridges.push([c.up - 30, c.up + 30]);
  for (const [a, b] of trackBridges) {
    strip(a, b, (i) => [[-W[1][i] - 0.4, -0.05], [-W[1][i] - 0.4, -1.7], [W[0][i] + 0.4, -1.7], [W[0][i] + 0.4, -0.05]].reverse(), deckM, { vScale: 6 });
    // piers at each end, down to the ground
    for (const e of [a, b]) for (const s of [1, -1]) { const o = s * (W[sideK(s)][e] - 0.5), x = X[e] + LX[e] * o, z = Z[e] + LZ[e] * o, gy = groundAt(x, z).h, h = Y[e] - 1.7 - gy; if (h > 0.5) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, h, 1.4), deckM); p.position.set(x, gy + h / 2, z); group.add(p); } }
  }
  // the streets round the circuit, at ground level (stopping at the circuit's fences), and the flyovers and
  // bridges among them raised on piers (high enough over the track)
  if (M.roads?.length) {
    const roadM = new THREE.MeshStandardMaterial({ color: isNight ? 0x2E3136 : 0x4A4D53, roughness: 0.93, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const bridgeM = new THREE.MeshStandardMaterial({ color: isNight ? 0x5C6066 : 0x9A9FA5, roughness: 0.85, side: THREE.DoubleSide });
    const ground = new Map(), deck = [], piers = [];
    const dens = (pts, step) => { const out = []; for (let k = 0; k < pts.length - 1; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / step)); for (let j = 0; j < n; j++) out.push([x0 + ((x1 - x0) * j) / n, z0 + ((z1 - z0) * j) / n]); } out.push(pts[pts.length - 1]); return out; };
    const ribbon = (pts, ys, w, list, thick = 0) => {
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, nx = (-(z1 - z0) / L) * (w / 2), nz = ((x1 - x0) / L) * (w / 2), y0 = ys[k], y1 = ys[k + 1];
        const A = [x0 + nx, y0, z0 + nz], B = [x1 + nx, y1, z1 + nz], Cc = [x1 - nx, y1, z1 - nz], D = [x0 - nx, y0, z0 - nz];
        list.push(...A, ...B, ...Cc, ...A, ...Cc, ...D); // (faces up)
        if (thick) { const dn = (p) => [p[0], p[1] - thick, p[2]]; list.push(...dn(A), ...dn(Cc), ...dn(B), ...dn(A), ...dn(D), ...dn(Cc)); for (const [P1, P2] of [[A, B], [Cc, D]]) { const u1 = [P1[0], P1[1] + 1.0, P1[2]], u2 = [P2[0], P2[1] + 1.0, P2[2]]; list.push(...P1, ...P2, ...dn(P2), ...P1, ...dn(P2), ...dn(P1), ...P1, ...u1, ...P2, ...P2, ...u1, ...u2); } } // (sides, and a parapet along each edge)
      }
    };
    for (const r of M.roads) {
      const pts = dens(r.p, 4);
      if (!r.b) {
        // ground level: only the bits clear of the circuit and the pits
        let run = [];
        const flush = () => { if (run.length > 1) { const key = Math.floor(run[0][0] / 500) * 10007 + Math.floor(run[0][1] / 500); if (!ground.has(key)) ground.set(key, []); ribbon(run, run.map(([x, z]) => groundAt(x, z).h + 0.1), r.w, ground.get(key)); } run = []; };
        for (const q of pts) { if (ctx.clearOfTrack(q[0], q[1], 1.5 + r.w / 2) && !inKeepOut(q[0], q[1], 1)) run.push(q); else flush(); }
        flush();
      } else {
        // raised: above the ground by its layer, and with room for the cars wherever it passes over the circuit
        const ys = pts.map(([x, z]) => { let y = groundAt(x, z).h + 6.5 * Math.max(1, r.l); const n = tr.nearestGlobal(x, z, 3); if (n.i >= 0 && n.d2 < 60 * 60) y = Math.max(y, Y[n.i] + 7.8 + 6 * (Math.max(1, r.l) - 1)); return y; });
        for (let pass = 0; pass < 4; pass++) for (let k = 1; k < ys.length - 1; k++) ys[k] = Math.max(ys[k], (ys[k - 1] + ys[k + 1]) / 2);
        ribbon(pts, ys, r.w, deck, 1.2);
        for (let k = 0; k < pts.length; k += 8) { const [x, z] = pts[k]; if (ctx.clearOfTrack(x, z, 1.2) && clearOfPit(x, z, 1)) piers.push([x, z, groundAt(x, z).h, ys[k] - 1.2]); }
      }
    }
    for (const list of ground.values()) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(list, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, roadM); m.receiveShadow = true; group.add(m); }
    if (deck.length) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(deck, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, bridgeM); m.castShadow = m.receiveShadow = true; group.add(m); }
    if (piers.length) {
      const pg = new THREE.CylinderGeometry(0.7, 0.8, 1, 8); pg.translate(0, 0.5, 0);
      const im = new THREE.InstancedMesh(pg, bridgeM, piers.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      piers.forEach(([x, z, y0, y1], j) => { m4.compose(new THREE.Vector3(x, y0 - 0.5, z), q, new THREE.Vector3(1, Math.max(0.5, y1 - y0 + 0.5), 1)); im.setMatrixAt(j, m4); });
      im.castShadow = true; group.add(im);
    }
  }
  for (const c of M.crossings ?? []) {
    if (!c.over || c.p.length < 2) continue;
    const foot = ["footway", "path", "steps", "cycleway", "pedestrian", "bridleway"].includes(c.k); if (!foot) continue; // (roads are drawn above)
    const w = 3, y = Y[c.i] + 6.2, t = 0.6;
    // the deck as a box ribbon along the road, only over the circuit (and a little beyond its barriers)
    const keep = c.p.filter(([x, z]) => { let bd2 = Infinity, bi = 0; for (let i = 0; i < N; i += 2) { const d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < bd2) { bd2 = d; bi = i; } } return Math.sqrt(bd2) < Math.max(W[0][bi], W[1][bi]) + 10; });
    if (keep.length < 2) continue;
    const pos = []; const quad = (a, b, c2, d) => pos.push(...a, ...b, ...c2, ...a, ...c2, ...d);
    for (let k = 0; k < keep.length - 1; k++) {
      const [x0, z0] = keep[k], [x1, z1] = keep[k + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, nx = (-(z1 - z0) / L) * (w / 2), nz = ((x1 - x0) / L) * (w / 2);
      const A = [x0 + nx, y, z0 + nz], B = [x1 + nx, y, z1 + nz], Cc = [x1 - nx, y, z1 - nz], D = [x0 - nx, y, z0 - nz];
      quad(A, D, Cc, B); quad([A[0], y - t, A[2]], [B[0], y - t, B[2]], [Cc[0], y - t, Cc[2]], [D[0], y - t, D[2]]);
      quad(A, B, [B[0], y - t, B[2]], [A[0], y - t, A[2]]); quad(D, [D[0], y - t, D[2]], [Cc[0], y - t, Cc[2]], Cc);
      for (const s of [1, -1]) { const ox = nx * s, oz = nz * s; quad([x0 + ox, y, z0 + oz], [x1 + ox, y, z1 + oz], [x1 + ox, y + (foot ? 1.3 : 1.0), z1 + oz], [x0 + ox, y + (foot ? 1.3 : 1.0), z0 + oz]); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: foot ? 0x8F959C : 0xA3A8AD, roughness: 0.8, side: THREE.DoubleSide })); m.castShadow = true; m.receiveShadow = true; group.add(m);
    // piers at the ends of the span (outside the barriers)
    for (const [x, z] of [keep[0], keep[keep.length - 1]]) { const gy = groundAt(x, z).h, h = y - t - gy; if (h > 0.5) { const p = new THREE.Mesh(new THREE.BoxGeometry(foot ? 0.6 : 1.6, h, foot ? 0.6 : w * 0.8), railM); p.position.set(x, gy + h / 2, z); p.rotation.y = Math.atan2(keep[1][0] - keep[0][0], keep[1][1] - keep[0][1]); group.add(p); } }
  }

  // ---------- where trees really are: single trees, and spots scattered through the woods ----------
  const treeSpots = (M.trees ?? []).map(([x, z]) => ({ x, z }));
  const woods = M.areas.filter((a) => a.k === "wood" || a.k === "scrub").map((a) => ({ ...a, ar: area(a.p) }));
  const totalWood = woods.reduce((s, a) => s + a.ar, 0);
  for (const w of woods) { const xs = w.p.map((p) => p[0]), zs = w.p.map((p) => p[1]), n = Math.min(3000, Math.round((w.ar / Math.max(totalWood, 1)) * Math.min(9000, totalWood / 70))); let got = 0, tries = 0; while (got < n && tries++ < n * 6) { const x = Math.min(...xs) + rnd() * (Math.max(...xs) - Math.min(...xs)), z = Math.min(...zs) + rnd() * (Math.max(...zs) - Math.min(...zs)); if (pointInPoly(x, z, w.p)) { treeSpots.push({ x, z, scrub: w.k === "scrub" }); got++; } } }
  return { blocked, buildings: nB, treeSpots };
}

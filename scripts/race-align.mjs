// Lines the OpenStreetMap data (data/race-osm/<slug>.json, from race-osm.mjs) up with the game's track
// and writes what the game loads: public/data/race-world/<slug>.json — buildings, water, the sea, pools,
// gravel traps and other surfaces, trees and woods, bridges and tunnels, all in the track's own
// coordinates (metres, the same frame as trackdata.js's X/Z).
//
// The game's track comes from F1's own map, whose frame isn't north-up. So this finds the rotation,
// mirror, scale and shift that put the track on top of the real road: first a coarse search scored on a
// distance map of the raceway (or, for street circuits, of all roads), then a few rounds of point
// matching (ICP) to fine-tune it.
//
// Run: node scripts/race-align.mjs [slugs…]   (no network needed; runs locally or in Actions)
// Map data © OpenStreetMap contributors, ODbL.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;
const { CIRCUITS, buildTrack } = await import(ROOT + "public/race/trackdata.js");
const OUT = ROOT + "public/data/race-world";
mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2).filter((a) => !a.startsWith("--")), verbose = process.argv.includes("--v");
const r1 = (v) => Math.round(v * 10) / 10;

const FOOT = new Set(["footway", "path", "steps", "cycleway", "pedestrian", "bridleway", "corridor", "elevator", "platform"]);
const ROADW = { motorway: 11, trunk: 10, primary: 10, secondary: 9, tertiary: 8, motorway_link: 7, trunk_link: 7, primary_link: 7, secondary_link: 7, tertiary_link: 7, residential: 7, unclassified: 7, service: 4.5, living_street: 6, footway: 3, path: 3, steps: 3, cycleway: 3, pedestrian: 5 }; // metres, one mapped way

// ---------- geometry helpers ----------
function pointInPoly(x, y, P) { let inside = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; } return inside; }
const polyArea = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return Math.abs(a / 2); };
function densify(pts, step) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / step)); for (let k = 0; k < n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, (x1 - x0) / (L || 1), (y1 - y0) / (L || 1)]); } if (pts.length) { const l = pts[pts.length - 1], p = pts[pts.length - 2] ?? l, L = Math.hypot(l[0] - p[0], l[1] - p[1]) || 1; out.push([l[0], l[1], (l[0] - p[0]) / L, (l[1] - p[1]) / L]); } return out; }
class Hash { constructor(cell) { this.c = cell; this.m = new Map(); } key(x, y) { return Math.floor(x / this.c) * 100003 + Math.floor(y / this.c); } add(x, y, v) { const k = this.key(x, y); if (!this.m.has(k)) this.m.set(k, []); this.m.get(k).push(v); } near(x, y, r = 1) { const gx = Math.floor(x / this.c), gy = Math.floor(y / this.c), out = []; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) { const l = this.m.get((gx + a) * 100003 + gy + b); if (l) for (const v of l) out.push(v); } return out; } }

for (const [id, cfg] of Object.entries(CIRCUITS)) {
  if (only.length && !only.includes(id) && !only.includes(cfg.slug)) continue;
  const src = `${ROOT}data/race-osm/${cfg.slug}.json`;
  if (!existsSync(src)) { console.log(`${id}: no OSM data yet`); continue; }
  const osm = JSON.parse(readFileSync(src, "utf8"));
  let real = null; try { real = JSON.parse(readFileSync(`${ROOT}public/data/race/${cfg.slug}.json`, "utf8")); } catch {}
  // (without the escape roads: those are cut short at runtime where these buildings stand)
  const tr = buildTrack(JSON.parse(readFileSync(`${ROOT}public/data/tracks/${cfg.slug}.json`, "utf8")), { ...cfg, noEscape: true }, real);
  const { N, X, Z } = tr;

  // ---------- which roads to fit to: the raceway if it's mapped well enough, otherwise every road ----------
  const roadsAll = osm.roads.filter((r) => !r.area && !FOOT.has(r.k));
  const race = osm.roads.filter((r) => r.k === "race" && !r.area);
  const len = (rs) => rs.reduce((a, r) => a + r.p.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r.p[i - 1][0], p[1] - r.p[i - 1][1]) : 0), 0), 0);
  const useRace = len(race) > tr.len * 0.55;
  // fit the track to a set of roads: returns the transform, the mean distance and the share within 8 m
  const toOsm = (x, z, P) => { const dx = (x - P.tx) / P.s, dz = (z - P.tz) / P.s, c = Math.cos(-P.th), s = Math.sin(-P.th), u = c * dx - s * dz, v = (s * dx + c * dz) * P.m; return [u, -v]; };
  const toWorld = (e, n, P) => { const u = e, v = -n * P.m, c = Math.cos(P.th), s = Math.sin(P.th); return [P.s * (c * u - s * v) + P.tx, P.s * (s * u + c * v) + P.tz]; };
  const fitTo = (fitRoads) => {
    const R = osm.radius, C = 4, G = Math.ceil((2 * R) / C) + 1;
    // distance map (m) to the nearest fit road, by chamfer distance transform
    const D = new Float32Array(G * G).fill(1e6);
    for (const r of fitRoads) for (const [x, y] of densify(r.p, C / 2)) { const gx = Math.round((x + R) / C), gy = Math.round((y + R) / C); if (gx >= 0 && gy >= 0 && gx < G && gy < G) D[gy * G + gx] = 0; }
    const s2 = Math.SQRT2 * C;
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) { let v = D[y * G + x]; if (x) v = Math.min(v, D[y * G + x - 1] + C); if (y) { v = Math.min(v, D[(y - 1) * G + x] + C); if (x) v = Math.min(v, D[(y - 1) * G + x - 1] + s2); if (x < G - 1) v = Math.min(v, D[(y - 1) * G + x + 1] + s2); } D[y * G + x] = v; }
    for (let y = G - 1; y >= 0; y--) for (let x = G - 1; x >= 0; x--) { let v = D[y * G + x]; if (x < G - 1) v = Math.min(v, D[y * G + x + 1] + C); if (y < G - 1) { v = Math.min(v, D[(y + 1) * G + x] + C); if (x < G - 1) v = Math.min(v, D[(y + 1) * G + x + 1] + s2); if (x) v = Math.min(v, D[(y + 1) * G + x - 1] + s2); } D[y * G + x] = v; }
    const dAt = (e, n) => { const gx = Math.round((e + R) / C), gy = Math.round((n + R) / C); return gx < 0 || gy < 0 || gx >= G || gy >= G ? 60 : Math.min(D[gy * G + gx], 60); };

    // ---------- coarse search: rotation, mirror and shift (scale 1: the track is already scaled to its real length) ----------
    // world = s·Rot(θ)·Mir·W0 + T, where W0 = (e, −n) and Mir = diag(1, m)
    const pts = []; for (let i = 0; i < N; i += Math.max(1, Math.floor(N / 160))) pts.push([X[i], Z[i]]);
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const score = (P, list = pts) => { let a = 0; for (const [x, z] of list) { const [e, n] = toOsm(x, z, P); a += Math.min(dAt(e, n), 25); } return a / list.length; };
    let cands = [];
    // (F1's map frame turns out to be north-up and not mirrored at every circuit we could check, so only a
    // few degrees either way are searched — that keeps a patchy map from pulling the fit somewhere silly)
    for (const m of [1]) for (let deg = -8; deg <= 8; deg += 1) {
      const th = (deg * Math.PI) / 180, c = Math.cos(-th), s = Math.sin(-th);
      const off = pts.map(([x, z]) => { const dx = x - cx, dz = z - cz, u = c * dx - s * dz, v = (s * dx + c * dz) * m; return [u, -v]; });
      for (let oe = -1100; oe <= 1100; oe += 25) for (let on = -1100; on <= 1100; on += 25) {
        let a = 0; for (let k = 0; k < off.length; k++) { a += Math.min(dAt(off[k][0] + oe, off[k][1] + on), 25); if (a > 22 * off.length) break; }
        a /= off.length; if (cands.length < 8 || a < cands[cands.length - 1].sc) { cands.push({ sc: a, th, m, oe, on }); cands.sort((p, q) => p.sc - q.sc); cands = cands.slice(0, 8); }
      }
    }
    // the shift that puts the track's centre at (oe, on): T = centre − Rot·Mir·W0(oe, on)
    const fromCand = (k) => { const P = { th: k.th, m: k.m, s: 1, tx: 0, tz: 0 }; const [wx, wz] = toWorld(k.oe, k.on, P); P.tx = cx - wx; P.tz = cz - wz; return P; };
    // refine each candidate: finer rotation and shift, then ICP with scale
    const roadPts = new Hash(8); for (const r of fitRoads) for (const q of densify(r.p, 2)) roadPts.add(q[0], q[1], q);
    const ptsAll = []; for (let i = 0; i < N; i += 4) ptsAll.push([X[i], Z[i]]);
    let best = null;
    for (const k of cands.slice(0, 5)) {
      let P = fromCand(k), sc = score(P);
      for (const [dth, dt] of [[1.5, 12], [0.5, 4], [0.15, 1.5]]) for (let it = 0; it < 3; it++) {
        for (const d of [-dth, dth]) { const Q = { ...P, th: P.th + (d * Math.PI) / 180 }; const s0 = score(Q); if (s0 < sc) { P = Q; sc = s0; } }
        for (const [ax, az] of [[dt, 0], [-dt, 0], [0, dt], [0, -dt]]) { const Q = { ...P, tx: P.tx + ax, tz: P.tz + az }; const s0 = score(Q); if (s0 < sc) { P = Q; sc = s0; } }
      }
      // ICP (similarity, Umeyama) on matched pairs within 15 m
      for (let it = 0; it < 12; it++) {
        const A = [], B = [];
        for (const [x, z] of ptsAll) { const [e, n] = toOsm(x, z, P); let bq = null, bd = 15 * 15; for (const q of roadPts.near(e, n, 2)) { const d = (q[0] - e) ** 2 + (q[1] - n) ** 2; if (d < bd) { bd = d; bq = q; } } if (bq) { A.push([x, z]); B.push([bq[0], -bq[1] * P.m]); } }
        if (A.length < 30) break;
        const ma = [0, 0], mb = [0, 0]; for (let i = 0; i < A.length; i++) { ma[0] += A[i][0]; ma[1] += A[i][1]; mb[0] += B[i][0]; mb[1] += B[i][1]; } ma[0] /= A.length; ma[1] /= A.length; mb[0] /= B.length; mb[1] /= B.length;
        let sxx = 0, sxy = 0, ss = 0; for (let i = 0; i < A.length; i++) { const bx = B[i][0] - mb[0], by = B[i][1] - mb[1], ax = A[i][0] - ma[0], ay = A[i][1] - ma[1]; sxx += bx * ax + by * ay; sxy += bx * ay - by * ax; ss += bx * bx + by * by; }
        const th = Math.atan2(sxy, sxx), s = Math.max(0.93, Math.min(1.07, Math.hypot(sxx, sxy) / ss)), c = Math.cos(th), sn = Math.sin(th);
        P = { th, m: P.m, s, tx: ma[0] - s * (c * mb[0] - sn * mb[1]), tz: ma[1] - s * (sn * mb[0] + c * mb[1]) };
      }
      sc = score(P, ptsAll);
      if (!best || sc < best.sc) best = { P, sc };
    }
    const P0 = best.P;
    let within = 0; for (const [x, z] of ptsAll) { const [e, n] = toOsm(x, z, P0); if (dAt(e, n) < 8) within++; }
    const fit0 = within / ptsAll.length;
    return { P: P0, sc: best.sc, fit: fit0 };
  };
  // the raceway when it's mapped; if that fits badly (a part-mapped raceway), every road, whichever fits better
  let res = fitTo(useRace ? race : roadsAll), usedRace = useRace;
  if (useRace && res.fit < 0.9) { const alt = fitTo(roadsAll); if (alt.fit > res.fit + 0.05) { res = alt; usedRace = false; } }
  const { P, fit } = res, best = res;
  console.log(`${id.padEnd(19)} fit to ${usedRace ? "raceway" : "roads"}: mean ${best.sc.toFixed(1)} m, ${(fit * 100).toFixed(0)}% within 8 m · rot ${((P.th * 180) / Math.PI).toFixed(1)}° mirror ${P.m < 0} scale ${P.s.toFixed(3)}`);
  const good = fit > 0.6;

  // ---------- the track itself: where is it in a tunnel or on a bridge, and what crosses over or under it ----------
  const W = (e, n) => toWorld(e, n, P);
  const trackHash = new Hash(10); for (let i = 0; i < N; i += 2) trackHash.add(X[i], Z[i], i);
  const nearestTrack = (x, z, r = 2) => { let bi = -1, bd = Infinity; for (const i of trackHash.near(x, z, r)) { const d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < bd) { bd = d; bi = i; } } return { i: bi, d: Math.sqrt(bd) }; };
  const tunnel = new Uint8Array(N), onBridge = new Uint8Array(N);
  const crossings = [];
  if (good) {
    const along = osm.roads.filter((r) => !r.area && (r.tunnel || r.bridge));
    for (const r of along) {
      const dp = densify(r.p.map(([e, n]) => W(e, n)), 2);
      // the track's own road (parallel and on top of it) in a tunnel or on a bridge…
      const hits = []; for (const [x, z, dx, dz] of dp) { const n = nearestTrack(x, z); if (n.i < 0) continue; const par = Math.abs(dx * tr.TX[n.i] + dz * tr.TZ[n.i]); hits.push({ x, z, i: n.i, d: n.d, par }); }
      // (a road under a street circuit can run in a tunnel right beneath it: only circuits that really have a
      // tunnel get one, and bridges have to follow the track closely)
      const mine = r.tunnel ? (cfg.tunnel ? hits.filter((h) => h.d < tr.half + 3 && h.par > 0.85) : []) : hits.filter((h) => h.d < tr.half * 0.8 + 1 && h.par > 0.9);
      if (mine.length > hits.length * 0.6 && mine.length >= 10 && (r.k === "race" || !usedRace)) {
        for (const h of mine) for (let d = -3; d <= 3; d++) (r.tunnel ? tunnel : onBridge)[tr.wrap(h.i + d)] = 1; continue;
      }
      // …or another road crossing it (over the track on a bridge, or under it in a tunnel)
      if (r.k === "race") continue;
      const cross = hits.find((h) => h.d < tr.half + 1 && h.par < 0.75);
      if (!cross) continue;
      const near = dp.filter(([x, z]) => Math.hypot(x - cross.x, z - cross.z) < 70).map(([x, z]) => [r1(x), r1(z)]);
      crossings.push({ i: cross.i, over: r.bridge ? 1 : 0, k: r.k, w: ROADW[r.k] ?? 8, layer: r.layer ?? (r.bridge ? 1 : -1), p: near, name: r.name });
    }
  }
  // (gaps of up to 40 m in the map's tagging are closed)
  const ranges = (flags) => { const out = []; let a = -1; for (let i = 0; i <= N; i++) { const f = i < N && flags[i]; if (f && a < 0) a = i; if (!f && a >= 0) { if (i - a > 15) { if (out.length && a - out[out.length - 1][1] < 40) out[out.length - 1][1] = i - 1; else out.push([a, i - 1]); } a = -1; } } return out; };

  // ---------- run-off surfaces from the map: gravel traps, tarmac, grass, per metre and side ----------
  const surfAreas = osm.areas.filter((a) => ["gravel", "sand", "paved", "grass"].includes(a.k)).map((a) => ({ k: a.k, p: a.p.map(([e, n]) => W(e, n)) }));
  const aHash = new Hash(40); surfAreas.forEach((a, n) => { const xs = a.p.map((p) => p[0]), zs = a.p.map((p) => p[1]); a.bb = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]; for (let x = Math.floor(a.bb[0] / 40); x <= Math.floor(a.bb[2] / 40); x++) for (let z = Math.floor(a.bb[1] / 40); z <= Math.floor(a.bb[3] / 40); z++) aHash.add(x * 40 + 1, z * 40 + 1, n); });
  const surfAt = (x, z) => { for (const n of aHash.near(x, z, 0)) { const a = surfAreas[n]; if (x < a.bb[0] || x > a.bb[2] || z < a.bb[1] || z > a.bb[3]) continue; if (pointInPoly(x, z, a.p)) return a.k; } return null; };
  const gravelMapped = surfAreas.filter((a) => (a.k === "gravel" || a.k === "sand") && a.bb && Math.min(...a.p.map(([x, z]) => nearestTrack(x, z, 3).d)) < 60).length;
  // per side (0 = left, 1 = right): [code, apron m, far edge m] — code 0 grass, 1 tarmac, 2 gravel; 255 = not known
  const run = [new Uint8Array(N).fill(255), new Uint8Array(N).fill(255)], apron = [new Float32Array(N), new Float32Array(N)], far = [new Float32Array(N), new Float32Array(N)];
  if (good && gravelMapped >= 2) {
    for (let i = 0; i < N; i++) for (const [k, sg] of [[0, 1], [1, -1]]) {
      let g0 = -1, g1 = -1, paved = 0, n = 0;
      for (let o = tr.half + 1; o <= tr.half + 45; o += 1.5) {
        const x = X[i] + tr.LX[i] * o * sg, z = Z[i] + tr.LZ[i] * o * sg, nt = nearestTrack(x, z, 2); if (nt.i >= 0 && Math.min(Math.abs(nt.i - i), N - Math.abs(nt.i - i)) > 60 && nt.d < o - 2) break; // reached another part of the track
        const s = surfAt(x, z); n++;
        if (s === "gravel" || s === "sand") { if (g0 < 0) g0 = o; g1 = o; } else if (s === "paved" && g0 < 0) paved++;
        else if (g0 >= 0 && o - g1 > 4) break;
      }
      if (g0 >= 0 && g0 - tr.half < 20) { run[k][i] = 2; apron[k][i] = Math.max(0.5, g0 - tr.half - 0.6); far[k][i] = g1 + 1.5; }
      else if (paved > 3) { run[k][i] = 1; far[k][i] = tr.half + paved * 1.5; }
      else run[k][i] = 0;
    }
  }
  const rle = (arr, ap, fr) => { const out = []; let s = 0; for (let i = 1; i <= N; i++) if (i === N || arr[i] !== arr[s] || Math.abs(ap[i] - ap[s]) > 1 || Math.abs(fr[i] - fr[s]) > 2) { out.push([s, i - s, arr[s], r1(ap[s]), r1(fr[s])]); s = i; } return out; };

  // ---------- buildings, water, the sea, woods and trees, in the track's frame, near enough to matter ----------
  const distTrack = (x, z) => nearestTrack(x, z, 3).d; // (≤ ~45 m found; further returns Infinity)
  const bbox = { x0: Math.min(...X) - 700, x1: Math.max(...X) + 700, z0: Math.min(...Z) - 700, z1: Math.max(...Z) + 700 };
  const inBox = ([x, z]) => x > bbox.x0 && x < bbox.x1 && z > bbox.z0 && z < bbox.z1;
  // distance from the track (10 m cells), to thin out the far-off buildings: everything close by, only the
  // bigger ones further away (a city like São Paulo has tens of thousands)
  const DC = 10, dnx = Math.ceil((bbox.x1 - bbox.x0) / DC), dnz = Math.ceil((bbox.z1 - bbox.z0) / DC), TD = new Float32Array(dnx * dnz).fill(1e9), dq = [];
  for (let i = 0; i < N; i += 3) { const ix = Math.floor((X[i] - bbox.x0) / DC), iz = Math.floor((Z[i] - bbox.z0) / DC), c = iz * dnx + ix; if (TD[c] > 0) { TD[c] = 0; dq.push(c); } }
  for (let h = 0; h < dq.length; h++) { const c = dq[h], ix = c % dnx, iz = (c - ix) / dnx; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = ix + a, z = iz + b; if (x < 0 || z < 0 || x >= dnx || z >= dnz) continue; const k = z * dnx + x; if (TD[k] > TD[c] + DC) { TD[k] = TD[c] + DC; dq.push(k); } } }
  const trackDist = (x, z) => { const ix = Math.floor((x - bbox.x0) / DC), iz = Math.floor((z - bbox.z0) / DC); return ix < 0 || iz < 0 || ix >= dnx || iz >= dnz ? 1e9 : TD[iz * dnx + ix]; };
  const buildings = [];
  if (good) for (const b of osm.buildings) {
    const p = b.p.map(([e, n]) => W(e, n)); if (!p.every(inBox)) continue;
    const a = polyArea(p); if (a < 12) continue;
    const td = trackDist(p[0][0], p[0][1]), big = a > 600 || (b.h ?? 0) > 22;
    if (td > 650 || (td > 300 && !big) || (td > 140 && a < 150 && !(b.h > 15))) continue;
    // keep the track clear: corners of a building that reach into the barrier zone (real buildings often stand
    // right behind the barriers, and the fit is a metre or two out) are pulled back behind the fence; a building
    // whose middle is in the zone goes, unless it stands over a tunnel
    const zone = (i, x, z) => { const lat = (x - X[i]) * tr.LX[i] + (z - Z[i]) * tr.LZ[i]; return tr.wall[lat >= 0 ? 0 : 1][i] + 2.6; };
    const [ccx, ccz] = [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
    const nc = nearestTrack(ccx, ccz, 2); let tun = nc.i >= 0 && nc.d < tr.half + tr.run + 6 && tunnel[nc.i] === 1;
    if (!tun && nc.i >= 0 && nc.d < zone(nc.i, ccx, ccz) + 2) continue;
    if (!tun) for (const v of p) { const nt = nearestTrack(v[0], v[1], 2); if (nt.i < 0) continue; const zd = zone(nt.i, v[0], v[1]); if (nt.d < zd) { const dx = v[0] - X[nt.i], dz = v[1] - Z[nt.i], L = Math.hypot(dx, dz) || 1; v[0] = X[nt.i] + (dx / L) * zd; v[1] = Z[nt.i] + (dz / L) * zd; } }
    // (and none of its walls may cross the track between its corners — a long hall the circuit runs past or through)
    if (!tun) { let cross = false; for (let k = 0; k < p.length && !cross; k++) { const a = p[k], b = p[(k + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 2.5); for (let j = 1; j < n && !cross; j++) { const x = a[0] + ((b[0] - a[0]) * j) / n, z = a[1] + ((b[1] - a[1]) * j) / n, nt = nearestTrack(x, z, 2); if (nt.i >= 0 && nt.d < zone(nt.i, x, z) - 1) cross = true; } } if (cross) continue; }
    const h = b.h ?? null;
    buildings.push({ p: p.map(([x, z]) => [r1(x), r1(z)]), ...(h ? { h } : {}), ...(b.mh ? { mh: b.mh } : {}), ...(b.b ? { b: b.b } : {}), ...(b.c ? { c: b.c } : {}), ...(b.roof ? { roof: b.roof } : {}), ...(tun ? { tun: 1 } : {}), ...(b.part ? { part: 1 } : {}) });
  }
  // the streets and roads round the circuit (not the circuit itself, not tunnels, not paths): at ground level, or
  // raised where they're bridges and flyovers
  const ROADK = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link", "residential", "unclassified", "living_street", "service"]);
  const roads = [];
  if (good) for (const r of osm.roads) {
    if (!ROADK.has(r.k) || r.tunnel || r.area || (usedRace ? false : false)) continue;
    const p = r.p.map(([e, n]) => W(e, n)); if (!p.some(inBox)) continue;
    const near = Math.min(...p.map(([x, z]) => trackDist(x, z)));
    if (near > (r.k === "service" ? 160 : 450)) continue;
    roads.push({ k: r.k, w: ROADW[r.k] ?? 7, p: p.map(([x, z]) => [r1(x), r1(z)]), ...(r.bridge ? { b: 1, l: r.layer ?? 1 } : {}) });
  }
  const areas = [];
  if (good) for (const a of osm.areas) {
    if (!["water", "pool", "wood", "scrub", "gravel", "sand", "paved", "grass"].includes(a.k)) continue;
    const p = a.p.map(([e, n]) => W(e, n)); if (!p.some(inBox)) continue;
    areas.push({ k: a.k, p: p.map(([x, z]) => [r1(x), r1(z)]), ...(a.w ? { w: a.w } : {}), ...(a.name ? { name: a.name } : {}) });
  }
  const trees = good ? osm.trees.map(([e, n]) => W(e, n)).filter(inBox).filter(([x, z]) => !(distTrack(x, z) < tr.half + tr.run + 4)).map(([x, z]) => [r1(x), r1(z)]) : [];
  // the sea: the map's coastline has the land on its left; flood the water side within the box (8 m cells)
  let sea = null;
  const coast = good ? osm.lines.filter((l) => l.k === "coastline") : [];
  if (coast.length) {
    const SC = 4, nx = Math.ceil((bbox.x1 - bbox.x0) / SC), nz = Math.ceil((bbox.z1 - bbox.z0) / SC), M = new Uint8Array(nx * nz); // 1 = coast, 2 = sea
    const cell = (x, z) => { const ix = Math.floor((x - bbox.x0) / SC), iz = Math.floor((z - bbox.z0) / SC); return ix < 0 || iz < 0 || ix >= nx || iz >= nz ? -1 : iz * nx + ix; };
    const seeds = [];
    // (a coastline that stops short of the box's edge — the rest wasn't downloaded — is carried on straight
    // out past the edge, so the flood can't leak round its end)
    const ends = new Map(), kE = (p) => Math.round(p[0]) + "," + Math.round(p[1]);
    for (const l of coast) for (const p of [l.p[0], l.p[l.p.length - 1]]) ends.set(kE(p), (ends.get(kE(p)) ?? 0) + 1);
    for (const l of coast) for (const [a, b] of [[l.p[1], l.p[0]], [l.p[l.p.length - 2], l.p[l.p.length - 1]]]) {
      if (!a || ends.get(kE(b)) > 1) continue; // joined to another piece of coastline
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ext = [b, [b[0] + ((b[0] - a[0]) / L) * 3000, b[1] + ((b[1] - a[1]) / L) * 3000]];
      for (const [x, z] of densify(ext.map(([e, n]) => W(e, n)), 2)) { const c = cell(x, z); if (c >= 0) M[c] = 1; }
    }
    for (const l of coast) {
      const wp = l.p.map(([e, n]) => W(e, n)); for (const [x, z] of densify(wp, 2)) { const c = cell(x, z); if (c >= 0) M[c] = 1; }
      // points 10 m to the right (water) and left (land) of the coastline's direction, in the map's own frame
      for (let i = 0; i < l.p.length - 1; i++) { const [e0, n0] = l.p[i], [e1, n1] = l.p[i + 1], L = Math.hypot(e1 - e0, n1 - n0) || 1, me = (e0 + e1) / 2, mn = (n0 + n1) / 2, re = ((n1 - n0) / L) * 10, rn = (-(e1 - e0) / L) * 10; seeds.push([W(me + re, mn + rn), 1], [W(me - re, mn - rn), -1]); }
    }
    // split the box into the pieces the coastline cuts it into; a piece is sea if more of the coastline's
    // water-side points than land-side points fall in it (so a few pieces drawn the wrong way round don't matter)
    const comp = new Int32Array(nx * nz).fill(-1), votes = [];
    for (let c0 = 0; c0 < M.length; c0++) {
      if (M[c0] !== 0 || comp[c0] >= 0) continue;
      const id = votes.length; votes.push(0); const st = [c0]; comp[c0] = id;
      while (st.length) { const c = st.pop(), ix = c % nx, iz = (c - ix) / nx; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = ix + a, z = iz + b; if (x < 0 || z < 0 || x >= nx || z >= nz) continue; const k = z * nx + x; if (M[k] === 0 && comp[k] < 0) { comp[k] = id; st.push(k); } } }
    }
    for (const [[x, z], v] of seeds) { const c = cell(x, z); if (c >= 0 && comp[c] >= 0) votes[comp[c]] += v; }
    for (let c = 0; c < M.length; c++) if (comp[c] >= 0 && votes[comp[c]] > 0) M[c] = 2;
    // (if the flood leaked onto the land the coastline was broken: drop it. A leak shows as track well away
    // from the shore — more than 24 m — counted as sea; a quayside straight right by the water doesn't count)
    const far = new Uint16Array(nx * nz).fill(65535), q = []; for (let c = 0; c < M.length; c++) if (M[c] === 1) { far[c] = 0; q.push(c); }
    for (let h = 0; h < q.length; h++) { const c = q[h], ix = c % nx, iz = (c - ix) / nx; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = ix + a, z = iz + b; if (x < 0 || z < 0 || x >= nx || z >= nz) continue; const k = z * nx + x; if (far[k] > far[c] + 1) { far[k] = far[c] + 1; q.push(k); } } }
    let wet = 0; for (let i = 0; i < N; i += 10) { const c = cell(X[i], Z[i]); if (c >= 0 && M[c] === 2 && far[c] * SC > 24) wet++; }
    if (process.env.SEA_DEBUG) { const img = Buffer.alloc(nx * nz); for (let c = 0; c < M.length; c++) img[c] = M[c] === 1 ? 0 : M[c] === 2 ? 90 : 230; for (let i = 0; i < N; i += 2) { const c = cell(X[i], Z[i]); if (c >= 0) img[c] = 160; } writeFileSync(process.env.SEA_DEBUG, Buffer.concat([Buffer.from(`P5 ${nx} ${nz} 255\n`), img])); }
    if (wet < 3) { const rows = []; for (let iz = 0; iz < nz; iz++) { let ix = 0; while (ix < nx) { if (M[iz * nx + ix] === 2) { const a = ix; while (ix < nx && M[iz * nx + ix] === 2) ix++; rows.push([iz, a, ix - a]); } else ix++; } } sea = { x0: r1(bbox.x0), z0: r1(bbox.z0), cell: SC, rows }; }
    else console.log(`  (sea flood leaked onto the track — skipped)`);
  }
  const out = { slug: cfg.slug, fit: { mean: r1(best.sc), within8: Math.round(fit * 100) / 100, roads: usedRace ? "raceway" : "roads", rot: r1((P.th * 180) / Math.PI), mirror: P.m < 0, scale: Math.round(P.s * 1000) / 1000 }, good, tunnels: ranges(tunnel), bridges: ranges(onBridge), crossings, roads, runoff: run[0][0] === 255 && run[1][0] === 255 ? null : [rle(run[0], apron[0], far[0]), rle(run[1], apron[1], far[1])], buildings, areas, trees, sea, race: good ? race.map((r) => r.p.map(([e, n]) => W(e, n).map(r1))) : [], attribution: "Map data © OpenStreetMap contributors (ODbL)" };
  writeFileSync(`${OUT}/${cfg.slug}.json`, JSON.stringify(out));
  console.log(`  ${good ? "" : "POOR FIT, scenery not used · "}${buildings.length} buildings, ${areas.length} areas (${areas.filter((a) => a.k === "water").length} water, ${areas.filter((a) => a.k === "pool").length} pools, ${areas.filter((a) => a.k === "gravel" || a.k === "sand").length} gravel/sand, ${areas.filter((a) => a.k === "wood").length} woods), ${trees.length} trees, sea ${sea ? sea.rows.length + " rows" : "none"}, tunnels ${JSON.stringify(out.tunnels)}, bridges ${JSON.stringify(out.bridges)}, ${crossings.length} crossings, ${roads.length} roads, run-off from map: ${out.runoff ? "yes (" + gravelMapped + " traps)" : "no"}`);
}

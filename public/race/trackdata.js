// Track data for the racing game: turns a circuit outline (the same files the timing pages use)
// into a smooth centre line with one sample per metre, plus height, direction, curvature and
// distance. Pure maths, no three.js, so the physics and tests can use it too.

// Circuits the game can build. `elev` is a rough height profile in metres at numbered corners
// ([corner, height]; corner 0 = start line). Only Spa for now; the rest come next.
export const CIRCUITS = {
  spa: {
    slug: "spa-francorchamps", name: "Spa-Francorchamps", short: "Spa", country: "Belgium", lengthM: 7004, laps: 44,
    elev: [[0, 0], [1, 3], [2, -19], [3, -4], [4, 16], [5, 40], [8, 20], [10, -8], [12, -24], [14, -60], [15, -63], [17, -40], [18, -6]],
    names: { 1: "La Source", 2: "Eau Rouge", 3: "Raidillon", 5: "Les Combes", 8: "Bruxelles", 10: "Pouhon", 12: "Fagnes", 14: "Stavelot", 17: "Blanchimont", 18: "Bus Stop" },
    sectors: [0.32, 0.71], scenery: "forest", half: 7.5, run: 13,
    // pit lane: on the right of the start/finish straight, in the infield towards La Source
    // (metres from the start line; the pit exit runs on past La Source in real life)
    // (pit entry is in the middle of the Bus Stop chicane; the garages line the straight where the grid is)
    pit: { side: "right", from: -235, to: 300, garages: [-185, 140] },
  },
};

const wrap = (i, n) => ((i % n) + n) % n;

// centripetal Catmull–Rom through a closed list of 2D points
function catmull(points, perSeg = 12) {
  const n = points.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[wrap(i - 1, n)], p1 = points[i], p2 = points[wrap(i + 1, n)], p3 = points[wrap(i + 2, n)];
    const tj = (ti, a, b) => ti + Math.max(1e-4, Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5);
    const t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
    for (let k = 0; k < perSeg; k++) {
      const t = t1 + ((t2 - t1) * k) / perSeg;
      const L = (a, b, ta, tb) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
      const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  return out;
}

// moving average over a closed loop of 2D points
function smoothLoop(pts, r) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) { let x = 0, y = 0; for (let k = -r; k <= r; k++) { const p = pts[wrap(i + k, n)]; x += p[0]; y += p[1]; } out.push([x / (2 * r + 1), y / (2 * r + 1)]); }
  return out;
}

// resample a closed polyline to `n` points evenly spaced by length
function resample(pts, n) {
  const m = pts.length, cum = [0];
  for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % m]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const total = cum[m], out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (k / n) * total;
    while (cum[j + 1] < s) j++;
    const a = pts[j], b = pts[(j + 1) % m], t = (s - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]);
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

// Build the track. `raw` is the outline file ({ points, corners }), `cfg` an entry of CIRCUITS.
export function buildTrack(raw, cfg) {
  const pts0 = smoothLoop(raw.points.map((p) => [p[0], p[1]]), 1);
  const dense = catmull(pts0, 12);
  let per = 0; for (let i = 0; i < dense.length; i++) { const a = dense[i], b = dense[(i + 1) % dense.length]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  const S = cfg.lengthM / per; // metres per outline unit
  const N = Math.round(cfg.lengthM); // one sample per metre
  let pts = resample(dense, N);
  const cx = pts.reduce((a, p) => a + p[0], 0) / N, cy = pts.reduce((a, p) => a + p[1], 0) / N;
  pts = pts.map(([x, y]) => [(x - cx) * S, (y - cy) * S]);
  pts = smoothLoop(smoothLoop(pts, 4), 4); // remove the pixel steps of the outline
  const X = new Float32Array(N), Z = new Float32Array(N), Y = new Float32Array(N);
  for (let i = 0; i < N; i++) { X[i] = pts[i][0]; Z[i] = pts[i][1]; }

  // corners → nearest sample (outline corners use the same 0..1000 box as the points)
  const xs = raw.points.map((p) => p[0]), ys = raw.points.map((p) => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys), size = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
  const corners = (raw.corners ?? []).map((c) => {
    const ux = ((minX + (c.p[0] / 1000) * size) - cx) * S, uz = ((minY + (c.p[1] / 1000) * size) - cy) * S;
    let best = 0, bd = Infinity; for (let i = 0; i < N; i++) { const d = (X[i] - ux) ** 2 + (Z[i] - uz) ** 2; if (d < bd) { bd = d; best = i; } }
    return { n: c.n, i: best, name: cfg.names?.[c.n] ?? `Turn ${c.n}` };
  });
  const cIdx = Object.fromEntries(corners.map((c) => [c.n, c.i]));

  // height: smooth steps between the known corner heights, then a long smoothing pass
  if (cfg.elev) {
    const knots = cfg.elev.map(([n, h]) => [n === 0 ? 0 : cIdx[n], h]).filter(([i]) => i != null).sort((a, b) => a[0] - b[0]);
    knots.push([N, knots[0][1]]);
    for (let i = 0; i < N; i++) { let k = 0; while (k < knots.length - 2 && knots[k + 1][0] <= i) k++; const [i0, h0] = knots[k], [i1, h1] = knots[k + 1], t = (i - i0) / Math.max(1, i1 - i0), s = t * t * (3 - 2 * t); Y[i] = h0 + (h1 - h0) * s; }
    for (let pass = 0; pass < 3; pass++) { const c = Float32Array.from(Y); for (let i = 0; i < N; i++) { let a = 0; for (let k = -40; k <= 40; k++) a += c[wrap(i + k, N)]; Y[i] = a / 81; } }
  }

  // direction (unit, in the ground plane), left normal, distance, curvature (1/m, + = turning left)
  const TX = new Float32Array(N), TZ = new Float32Array(N), LX = new Float32Array(N), LZ = new Float32Array(N), K = new Float32Array(N), slope = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = wrap(i - 1, N), b = wrap(i + 1, N), dx = X[b] - X[a], dz = Z[b] - Z[a], l = Math.hypot(dx, dz) || 1;
    TX[i] = dx / l; TZ[i] = dz / l; LX[i] = TZ[i]; LZ[i] = -TX[i];
    slope[i] = (Y[b] - Y[a]) / l;
  }
  for (let i = 0; i < N; i++) {
    const w = 8, a = wrap(i - w, N), b = wrap(i + w, N);
    const cross = TX[a] * TZ[b] - TZ[a] * TX[b], dot = TX[a] * TX[b] + TZ[a] * TZ[b];
    K[i] = Math.atan2(cross, dot) / (2 * w);
  }
  // kerbs through the corners, both sides (bit 1 = left, bit 2 = right)
  const kerb = new Uint8Array(N);
  for (let k = 0; k < N;) {
    if (Math.abs(K[k]) > 0.006) { let e = k; while (e < k + N && Math.abs(K[wrap(e, N)]) > 0.004) e++; if (e - k > 12) for (let j = k - 20; j <= e + 20; j++) kerb[wrap(j, N)] = 3; k = e + 1; } else k++;
  }
  const dist = new Float32Array(N); for (let i = 1; i < N; i++) dist[i] = dist[i - 1] + Math.hypot(X[i] - X[i - 1], Z[i] - Z[i - 1]);
  const len = dist[N - 1] + Math.hypot(X[0] - X[N - 1], Z[0] - Z[N - 1]);

  // spatial grid for fast "where am I" lookups
  const CELL = 25, grid = new Map(), key = (gx, gz) => gx * 100003 + gz;
  for (let i = 0; i < N; i += 2) { const k = key(Math.floor(X[i] / CELL), Math.floor(Z[i] / CELL)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
  const nearestGlobal = (x, z, r = 2) => { const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL); let best = -1, bd = Infinity; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (const i of grid.get(key(gx + a, gz + b)) ?? []) { const d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < bd) { bd = d; best = i; } } return { i: best, d2: bd }; };

  // local search from a known index (fast, for cars that move a few metres per frame)
  const nearestFrom = (x, z, i0, span = 40) => { let best = i0, bd = Infinity; for (let k = -span; k <= span; k++) { const i = wrap(i0 + k, N), d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < bd) { bd = d; best = i; } } return best; };
  // signed sideways offset from the centre line (+ = left) and height at a point near sample i
  const frame = (x, z, i) => {
    const j = wrap(i + 1, N), h = wrap(i - 1, N);
    const dx = x - X[i], dz = z - Z[i], along = dx * TX[i] + dz * TZ[i];
    const k = along >= 0 ? j : h, t = Math.min(1, Math.abs(along));
    const y = Y[i] + (Y[k] - Y[i]) * t;
    return { lat: dx * LX[i] + dz * LZ[i], along, y, s: dist[i] + along };
  };

  const tr = { cfg, N, len, X, Y, Z, TX, TZ, LX, LZ, K, slope, dist, kerb, corners, cIdx, half: cfg.half ?? 7.5, run: cfg.run ?? 13, nearestGlobal, nearestFrom, frame, wrap: (i) => wrap(i, N) };
  computeWalls(tr);
  return tr;
}

// Where the barriers are on each side (distance from the centre line, per metre of track) and what
// kind they are: 1 = Tecpro blocks (soft, in the corners), 0 = armco (straights), 2 = pit wall.
// Where two parts of the track run close together, the barrier sits half-way between them.
function computeWalls(tr) {
  const { N, X, Z, LX, LZ, kerb } = tr, half = tr.half, def = half + tr.run + 0.6;
  const wall = [new Float32Array(N).fill(def), new Float32Array(N).fill(def)]; // [left, right]
  const type = [new Uint8Array(N), new Uint8Array(N)];
  const lapGap = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  for (let i = 0; i < N; i += 2) {
    for (const [k, s] of [[0, 1], [1, -1]]) {
      for (let o = half + 2; o < def * 2 + half; o += 1.5) {
        const n = tr.nearestGlobal(X[i] + LX[i] * o * s, Z[i] + LZ[i] * o * s, 1);
        if (n.i >= 0 && lapGap(n.i, i) > 120 && n.d2 < half * half) { const w = Math.max(half + 2, (o + half) / 2 - 0.5); wall[k][i] = Math.min(wall[k][i], w); break; }
      }
      if (i + 1 < N) wall[k][i + 1] = wall[k][i];
    }
  }
  // no sudden steps: take the closest wall nearby, then smooth it
  for (const w of wall) {
    const m = Float32Array.from(w); for (let i = 0; i < N; i++) { let v = m[i]; for (let k = -25; k <= 25; k++) v = Math.min(v, m[wrap(i + k, N)]); w[i] = v; }
    for (let pass = 0; pass < 2; pass++) { const c = Float32Array.from(w); for (let i = 0; i < N; i++) { let a = 0; for (let k = -12; k <= 12; k++) a += c[wrap(i + k, N)]; w[i] = Math.min(c[i], a / 25); } }
  }
  // Tecpro where a car would go off: within 60 m of a kerbed corner
  for (let i = 0; i < N; i++) { let near = false; for (let k = -60; k <= 60 && !near; k += 10) if (kerb[wrap(i + k, N)]) near = true; if (near) type[0][i] = type[1][i] = 1; }
  // the pit wall
  const pit = tr.cfg.pit;
  if (pit) {
    const k = pit.side === "left" ? 0 : 1;
    for (let d = pit.from; d <= pit.to; d++) { const i = wrap(d, N); wall[k][i] = half + 3; type[k][i] = 2; }
    tr.pit = { side: k === 0 ? 1 : -1, k, from: pit.from, to: pit.to, garages: pit.garages, wallOff: half + 3, laneIn: half + 3.6, laneOut: half + 17 };
  }
  tr.wall = wall; tr.wallType = type;
  tr.wallAt = (i, lat) => wall[lat >= 0 ? 0 : 1][i];
}

// The fastest speed (m/s) the car can take at each sample, from the corner's curvature and the car's
// grip envelope (lateral = a0 + a1·v²), then limited by how hard it can accelerate and brake.
// Used by the AI drivers and the lap simulator.
export function speedProfile(tr, env, margin = 0.92) {
  const { N, K } = tr, v = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let kk = 0; for (let w = -6; w <= 6; w++) kk = Math.max(kk, Math.abs(K[tr.wrap(i + w)]));
    const den = kk - margin * env.a1;
    v[i] = den <= 0 ? env.vmax : Math.min(env.vmax, Math.sqrt((margin * env.a0) / den));
  }
  const step = (i) => tr.dist[(i + 1) % N] - tr.dist[i] + (i === N - 1 ? tr.len : 0) || 1;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i <= N; i++) { const j = i % N, k = i - 1; v[j] = Math.min(v[j], Math.sqrt(v[k] ** 2 + 2 * env.accel(v[k]) * step(k))); }
    for (let i = N - 1; i >= 0; i--) { const j = (i + 1) % N; v[i] = Math.min(v[i], Math.sqrt(v[j] ** 2 + 2 * env.brake(v[j]) * margin * step(i))); }
  }
  return v;
}

// A racing line: bend a flexible strip as little as possible inside the track edges (the
// minimum-curvature line drivers use: wide on entry, clip the apex, wide on exit).
export function racingLine(tr, margin = 1.3) {
  const { N, X, Z, LX, LZ } = tr, lim = tr.half - margin, off = new Float32Array(N);
  const qx = new Float32Array(N), qz = new Float32Array(N);
  const upd = () => { for (let i = 0; i < N; i++) { qx[i] = X[i] + LX[i] * off[i]; qz[i] = Z[i] + LZ[i] * off[i]; } };
  for (const [s, iters] of [[48, 150], [24, 150], [12, 150], [6, 150]]) {
    for (let it = 0; it < iters; it++) {
      upd();
      for (let i = 0; i < N; i++) {
        // minimise the bend: the point the 4 neighbours (at this scale) would put it at
        const a = tr.wrap(i - s), b = tr.wrap(i + s), a2 = tr.wrap(i - 2 * s), b2 = tr.wrap(i + 2 * s);
        const mx = (4 * (qx[a] + qx[b]) - (qx[a2] + qx[b2])) / 6, mz = (4 * (qz[a] + qz[b]) - (qz[a2] + qz[b2])) / 6;
        const want = (mx - X[i]) * LX[i] + (mz - Z[i]) * LZ[i];
        off[i] = Math.max(-lim, Math.min(lim, off[i] + (want - off[i]) * 0.5));
      }
    }
  }
  // light smoothing so the line has no kinks
  for (let pass = 0; pass < 4; pass++) { const c = Float32Array.from(off); for (let i = 0; i < N; i++) { let a = 0; for (let k = -3; k <= 3; k++) a += c[tr.wrap(i + k)]; off[i] = Math.max(-lim, Math.min(lim, a / 7)); } }
  upd();
  const K = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const w = 8, a = tr.wrap(i - w), b = tr.wrap(i + w), c = i;
    const t1x = qx[c] - qx[a], t1z = qz[c] - qz[a], t2x = qx[b] - qx[c], t2z = qz[b] - qz[c];
    K[i] = Math.atan2(t1x * t2z - t1z * t2x, t1x * t2x + t1z * t2z) / (Math.hypot(t1x, t1z) / 2 + Math.hypot(t2x, t2z) / 2);
  }
  return { off, x: qx, z: qz, K };
}

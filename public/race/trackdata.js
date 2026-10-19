// Track data for the racing game: turns a circuit into a smooth centre line with one sample per
// metre, plus height, direction, curvature, distance, walls and the pit lane. Pure maths, no
// three.js, so the physics and tests can use it too.
//
// Where we have it (public/data/race/<slug>.json, fetched by scripts/race-tracks.mjs), the shape is
// the official track map, the heights are where real cars went on their fastest laps, and the pit
// lane follows real cars through a real pit stop. Otherwise the outline the timing pages use is
// scaled to the official length, with a rough height profile.

// Every circuit the game can build. lengthM and laps are the official figures. half = half the track
// width (m); run = run-off before the barriers on a permanent circuit; street = walls right by the
// track. scenery and time pick the surroundings and the light (the night races are lit).
// names: what the corners are called (corner number → name), where they're well known.
// runoff: what's beyond the kerbs on a permanent circuit — "mixed" (the default: gravel traps on the
// outside of the fast corners, tarmac elsewhere), "gravel" (gravel on the outside of most corners) or
// "tarmac" (big painted tarmac run-offs). bank: banked corners, by corner number (c) or metres from the
// line (at), in degrees.
export const CIRCUITS = {
  melbourne: { slug: "melbourne", name: "Albert Park", short: "Melbourne", country: "Australia", cc: "AU", lengthM: 5278, laps: 58, half: 6.2, run: 6, street: true, runoff: "gravel", scenery: "park", time: "day" },
  shanghai: { slug: "shanghai", name: "Shanghai International Circuit", short: "Shanghai", country: "China", cc: "CN", lengthM: 5451, laps: 56, half: 7.5, run: 16, scenery: "plains", time: "day", runoff: "tarmac",
    // F1's position data has no positions in this pit lane, so it's laid out by hand: on the right, in
    // after the last corner, out before Turn 1
    pit: { side: "right", entry: -300, lane: [-230, 300], exit: [330, 400], garages: [-150, 150], limit: [-240, 300] } },
  suzuka: { slug: "suzuka", name: "Suzuka", short: "Suzuka", country: "Japan", cc: "JP", lengthM: 5807, laps: 53, half: 6, run: 9, scenery: "park", time: "day", runoff: "gravel",
    names: { 3: "S Curves", 7: "Dunlop", 8: "Degner 1", 9: "Degner 2", 11: "Hairpin", 13: "Spoon", 15: "130R", 16: "Casio Triangle" } },
  miami: { slug: "miami", name: "Miami International Autodrome", short: "Miami", country: "USA", cc: "US", lengthM: 5412, laps: 57, half: 6.5, run: 4, street: true, scenery: "tropical", time: "day", runoff: "tarmac" },
  montreal: { slug: "montreal", name: "Circuit Gilles Villeneuve", short: "Montreal", country: "Canada", cc: "CA", lengthM: 4361, laps: 70, half: 5.8, run: 4, street: true, scenery: "park", time: "day", runoff: "gravel",
    names: { 1: "Virage Senna", 10: "L'Épingle", 14: "Wall of Champions" } },
  "monte-carlo": { slug: "monte-carlo", name: "Circuit de Monaco", short: "Monaco", country: "Monaco", cc: "MC", lengthM: 3337, laps: 78, half: 4.6, run: 1.6, street: true, scenery: "city", time: "day",
    names: { 1: "Sainte Dévote", 3: "Massenet", 4: "Casino", 5: "Mirabeau", 6: "Grand Hotel Hairpin", 8: "Portier", 9: "Tunnel", 10: "Nouvelle Chicane", 12: "Tabac", 13: "Swimming Pool", 17: "La Rascasse", 19: "Anthony Noghès" } },
  catalunya: { slug: "catalunya", name: "Circuit de Barcelona-Catalunya", short: "Barcelona", country: "Spain", cc: "ES", lengthM: 4657, laps: 66, half: 6.5, run: 14, scenery: "plains", time: "day" },
  spielberg: { slug: "spielberg", name: "Red Bull Ring", short: "Spielberg", country: "Austria", cc: "AT", lengthM: 4318, laps: 71, half: 7, run: 14, scenery: "alpine", time: "day", names: { 1: "Niki Lauda" } },
  silverstone: { slug: "silverstone", name: "Silverstone", short: "Silverstone", country: "Great Britain", cc: "GB", lengthM: 5891, laps: 52, half: 7.5, run: 16, scenery: "countryside", time: "day",
    names: { 1: "Abbey", 2: "Farm", 3: "Village", 4: "The Loop", 5: "Aintree", 6: "Brooklands", 7: "Luffield", 8: "Woodcote", 9: "Copse", 10: "Maggotts", 11: "Becketts", 13: "Chapel", 15: "Stowe", 16: "Vale", 18: "Club" } },
  spa: { slug: "spa-francorchamps", name: "Spa-Francorchamps", short: "Spa", country: "Belgium", cc: "BE", lengthM: 7004, laps: 44, half: 7.5, run: 13, scenery: "forest", time: "day",
    elev: [[0, 0], [1, 3], [2, -19], [3, -4], [4, 16], [5, 40], [8, 20], [10, -8], [12, -24], [14, -60], [15, -63], [17, -40], [18, -6]],
    names: { 1: "La Source", 2: "Eau Rouge", 3: "Raidillon", 5: "Les Combes", 8: "Bruxelles", 10: "Pouhon", 12: "Fagnes", 14: "Stavelot", 17: "Blanchimont", 18: "Bus Stop" },
    sectors: [0.32, 0.71],
    // used only if the real pit lane data is missing: the entry leaves the Bus Stop in the middle,
    // the exit goes round the inside of La Source and joins on the way down to Eau Rouge
    pit: { side: "right", entry: -248, lane: [-175, 285], apex: [325, 415], exit: [520, 640], garages: [-150, 150], limit: [-195, 285] } },
  hungaroring: { slug: "hungaroring", name: "Hungaroring", short: "Hungaroring", country: "Hungary", cc: "HU", lengthM: 4381, laps: 70, half: 6, run: 10, scenery: "countryside", time: "day" },
  zandvoort: { slug: "zandvoort", name: "Zandvoort", short: "Zandvoort", country: "Netherlands", cc: "NL", lengthM: 4259, laps: 72, half: 5.5, run: 8, scenery: "dunes", time: "day", runoff: "gravel",
    // the banked corners: Hugenholtz (Turn 3, 19°) and Arie Luyendyk (Turn 14, 18°)
    bank: [{ c: 3, deg: 19 }, { c: 14, deg: 18 }],
    names: { 1: "Tarzan", 3: "Hugenholtz", 7: "Scheivlak", 14: "Arie Luyendyk" } },
  monza: { slug: "monza", name: "Monza", short: "Monza", country: "Italy", cc: "IT", lengthM: 5793, laps: 53, half: 6.5, run: 12, scenery: "park", time: "day",
    names: { 1: "Variante del Rettifilo", 3: "Curva Grande", 4: "Variante della Roggia", 6: "Lesmo 1", 7: "Lesmo 2", 8: "Variante Ascari", 11: "Parabolica" } },
  madring: { slug: "madring", name: "Madring", short: "Madrid", country: "Spain", cc: "ES", lengthM: 5416, laps: 57, half: 6.5, run: 4, street: true, scenery: "city", time: "day", runoff: "tarmac",
    // La Monumental (Turn 12): 550 m, about 270°, banked up to a 24% gradient (13.5°)
    bank: [{ at: 2745, deg: 13.5 }] },
  baku: { slug: "baku", name: "Baku City Circuit", short: "Baku", country: "Azerbaijan", cc: "AZ", lengthM: 6003, laps: 51, half: 5.5, run: 2.5, street: true, scenery: "city", time: "day", names: { 8: "Castle" } },
  "kuala-lumpur": { slug: "kuala-lumpur", name: "Sepang International Circuit", short: "Sepang", country: "Malaysia", cc: "MY", lengthM: 5543, laps: 56, half: 8, run: 16, scenery: "tropical", time: "day", runoff: "tarmac" },
  singapore: { slug: "singapore", name: "Marina Bay", short: "Singapore", country: "Singapore", cc: "SG", lengthM: 4940, laps: 62, half: 5.5, run: 2.5, street: true, scenery: "city", time: "night" },
  austin: { slug: "austin", name: "Circuit of the Americas", short: "Austin", country: "USA", cc: "US", lengthM: 5513, laps: 56, half: 7.5, run: 16, scenery: "plains", time: "day", runoff: "tarmac" },
  "mexico-city": { slug: "mexico-city", name: "Autódromo Hermanos Rodríguez", short: "Mexico City", country: "Mexico", cc: "MX", lengthM: 4304, laps: 71, half: 6.5, run: 10, scenery: "park", time: "day", altitude: 2240, names: { 12: "Foro Sol", 17: "Peraltada" } },
  interlagos: { slug: "interlagos", name: "Interlagos", short: "São Paulo", country: "Brazil", cc: "BR", lengthM: 4309, laps: 71, half: 6, run: 9, scenery: "park", time: "day",
    names: { 1: "Senna S", 3: "Curva do Sol", 4: "Descida do Lago", 6: "Ferradura", 8: "Laranjinha", 9: "Pinheirinho", 10: "Bico de Pato", 11: "Mergulho", 12: "Junção", 15: "Arquibancadas" } },
  "las-vegas": { slug: "las-vegas", name: "Las Vegas Strip Circuit", short: "Las Vegas", country: "USA", cc: "US", lengthM: 6201, laps: 50, half: 6.5, run: 3, street: true, scenery: "city", time: "night" },
  lusail: { slug: "lusail", name: "Lusail International Circuit", short: "Lusail", country: "Qatar", cc: "QA", lengthM: 5419, laps: 57, half: 6.5, run: 16, scenery: "desert", time: "night" },
  "yas-marina-circuit": { slug: "yas-marina-circuit", name: "Yas Marina", short: "Abu Dhabi", country: "UAE", cc: "AE", lengthM: 5281, laps: 58, half: 7.5, run: 14, scenery: "desert", time: "dusk", runoff: "tarmac" },
  sakhir: { slug: "sakhir", name: "Bahrain International Circuit", short: "Bahrain", country: "Bahrain", cc: "BH", lengthM: 5412, laps: 57, half: 7.5, run: 16, scenery: "desert", time: "night", runoff: "tarmac" },
  jeddah: { slug: "jeddah", name: "Jeddah Corniche Circuit", short: "Jeddah", country: "Saudi Arabia", cc: "SA", lengthM: 6174, laps: 50, half: 6, run: 2.5, street: true, scenery: "desert", time: "night" },
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

// Build the track. `raw` is the outline file ({ points, corners }), `cfg` an entry of CIRCUITS, `real`
// the real data file (or null).
export function buildTrack(raw, cfg, real = null) {
  const N = Math.round(cfg.lengthM); // one sample per metre
  // no official map line (a brand-new circuit)? Then the shape comes from where the cars went
  if (real && !(real.map?.x?.length > 50) && real.laps?.length) {
    const lap = real.laps.reduce((a, b) => (b.pts.length > a.pts.length ? b : a));
    const pts = lap.pts.filter((p) => p[3] >= (lap.startAt ?? 0) && p[3] <= (lap.startAt ?? 0) + lap.time);
    real = { ...real, map: { x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), corners: [] }, fromLap: true };
  }
  const useReal = !!(real?.map?.x?.length > 50 && real.laps?.length);
  let pts, S, cx, cy, toPlane; // toPlane: source x, y → this track's ground plane (before scaling)
  if (useReal) {
    // F1 coordinates have y pointing "north"; the ground plane here has z pointing the other way
    toPlane = (x, y) => [x, -y];
    let P = real.map.x.map((x, i) => toPlane(x, real.map.y[i]));
    if (Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 5) P.pop();
    // the lap starts at the timing line, and runs the way the cars go
    const lap = real.laps[0], at = (t) => { const L = lap.pts; let k = 0; while (k < L.length - 2 && L[k + 1][3] < t) k++; const a = L[k], b = L[k + 1], f = Math.max(0, Math.min(1, (t - a[3]) / Math.max(1e-3, b[3] - a[3]))); return toPlane(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); };
    const near = (q) => { let bi = 0, bd = Infinity; P.forEach((p, i) => { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi; };
    const s0 = at(lap.startAt ?? 0), n0 = near(s0), n1 = near(at((lap.startAt ?? 0) + 5));
    if (((n1 - n0 + P.length) % P.length) > P.length / 2) P.reverse();
    const m0 = near(s0); P = [...P.slice(m0), ...P.slice(0, m0)];
    const dense = catmull(smoothLoop(P, 1), 6);
    let per = 0; for (let i = 0; i < dense.length; i++) { const a = dense[i], b = dense[(i + 1) % dense.length]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    S = cfg.lengthM / per;
    pts = resample(dense, N);
    // start exactly at the line
    let bi = 0, bd = Infinity; pts.forEach((p, i) => { const d = (p[0] - s0[0]) ** 2 + (p[1] - s0[1]) ** 2; if (d < bd) { bd = d; bi = i; } }); pts = [...pts.slice(bi), ...pts.slice(0, bi)];
    cx = pts.reduce((a, p) => a + p[0], 0) / N; cy = pts.reduce((a, p) => a + p[1], 0) / N;
    pts = smoothLoop(pts.map(([x, y]) => [(x - cx) * S, (y - cy) * S]), 2);
  } else {
    const pts0 = smoothLoop(raw.points.map((p) => [p[0], p[1]]), 1);
    const dense = catmull(pts0, 12);
    let per = 0; for (let i = 0; i < dense.length; i++) { const a = dense[i], b = dense[(i + 1) % dense.length]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    S = cfg.lengthM / per;
    pts = resample(dense, N);
    cx = pts.reduce((a, p) => a + p[0], 0) / N; cy = pts.reduce((a, p) => a + p[1], 0) / N;
    pts = smoothLoop(smoothLoop(pts.map(([x, y]) => [(x - cx) * S, (y - cy) * S]), 4), 4); // remove the pixel steps of the outline
  }
  const X = new Float32Array(N), Z = new Float32Array(N), Y = new Float32Array(N);
  for (let i = 0; i < N; i++) { X[i] = pts[i][0]; Z[i] = pts[i][1]; }
  const world = useReal ? (x, y) => { const [a, b] = toPlane(x, y); return [(a - cx) * S, (b - cy) * S]; } : null;

  // spatial grid for fast "where am I" lookups (rebuilt by geometry() if the line moves)
  const CELL = 25, grid = new Map(), key = (gx, gz) => gx * 100003 + gz;
  const nearestGlobal = (x, z, r = 2) => { const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL); let best = -1, bd = Infinity; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (const i of grid.get(key(gx + a, gz + b)) ?? []) { const d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < bd) { bd = d; best = i; } } return { i: best, d2: bd }; };
  const TX = new Float32Array(N), TZ = new Float32Array(N), LX = new Float32Array(N), LZ = new Float32Array(N), K = new Float32Array(N), slope = new Float32Array(N), kerb = new Uint8Array(N), dist = new Float32Array(N);
  let len = 0;
  // direction (unit, in the ground plane), left normal, distance, curvature (1/m, + = turning right), kerbs
  function geometry() {
    grid.clear(); for (let i = 0; i < N; i += 2) { const k = key(Math.floor(X[i] / CELL), Math.floor(Z[i] / CELL)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
    for (let i = 0; i < N; i++) {
      const a = wrap(i - 1, N), b = wrap(i + 1, N), dx = X[b] - X[a], dz = Z[b] - Z[a], l = Math.hypot(dx, dz) || 1;
      TX[i] = dx / l; TZ[i] = dz / l; LX[i] = TZ[i]; LZ[i] = -TX[i];
      slope[i] = (Y[b] - Y[a]) / l;
    }
    for (let i = 0; i < N; i++) {
      const w = 8, a = wrap(i - w, N), b = wrap(i + w, N);
      K[i] = Math.atan2(TX[a] * TZ[b] - TZ[a] * TX[b], TX[a] * TX[b] + TZ[a] * TZ[b]) / (2 * w);
    }
    // kerbs through the corners, both sides (bit 1 = left, bit 2 = right)
    kerb.fill(0);
    for (let k = 0; k < N;) {
      if (Math.abs(K[k]) > 0.006) { let e = k; while (e < k + N && Math.abs(K[wrap(e, N)]) > 0.004) e++; if (e - k > 12) for (let j = k - 20; j <= e + 20; j++) kerb[wrap(j, N)] = 3; k = e + 1; } else k++;
    }
    dist[0] = 0; for (let i = 1; i < N; i++) dist[i] = dist[i - 1] + Math.hypot(X[i] - X[i - 1], Z[i] - Z[i - 1]);
    len = dist[N - 1] + Math.hypot(X[0] - X[N - 1], Z[0] - Z[N - 1]);
  }
  geometry();

  // corners
  let corners;
  if (useReal && real.map.corners?.length) corners = real.map.corners.map((c) => { const [x, z] = world(c.x, c.y), n = nearestGlobal(x, z, 3); return { n: c.n, l: c.l, i: n.i, name: cfg.names?.[c.n] ?? `Turn ${c.n}${c.l || ""}` }; }).filter((c) => c.i >= 0);
  else if (!useReal) {
    const xs = raw.points.map((p) => p[0]), ys = raw.points.map((p) => p[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys), size = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
    corners = (raw.corners ?? []).map((c) => {
      const ux = ((minX + (c.p[0] / 1000) * size) - cx) * S, uz = ((minY + (c.p[1] / 1000) * size) - cy) * S;
      let best = 0, bd = Infinity; for (let i = 0; i < N; i++) { const d = (X[i] - ux) ** 2 + (Z[i] - uz) ** 2; if (d < bd) { bd = d; best = i; } }
      return { n: c.n, i: best, name: cfg.names?.[c.n] ?? `Turn ${c.n}` };
    });
  } else corners = [];
  const cIdx = Object.fromEntries(corners.map((c) => [c.n, c.i]));

  // height. Real: where the cars went on their fastest laps (averaged over the laps, smoothed).
  // Otherwise: smooth steps between known corner heights.
  if (useReal) {
    const sum = new Float64Array(N), cnt = new Uint16Array(N);
    for (const lap of real.laps) for (const [x, y, z] of lap.pts) { const [wx, wz] = world(x, y), n = nearestGlobal(wx, wz, 2); if (n.i >= 0 && n.d2 < 400) { for (let d = -3; d <= 3; d++) { const j = wrap(n.i + d, N); sum[j] += z * S; cnt[j]++; } } }
    const have = []; for (let i = 0; i < N; i++) if (cnt[i]) { Y[i] = sum[i] / cnt[i]; have.push(i); }
    if (have.length) for (let h = 0; h < have.length; h++) { const a = have[h], b = have[(h + 1) % have.length], gap = wrap(b - a, N); for (let d = 1; d < gap; d++) Y[wrap(a + d, N)] = Y[a] + (Y[b] - Y[a]) * (d / gap); }
    for (let pass = 0; pass < 3; pass++) { const c = Float32Array.from(Y); for (let i = 0; i < N; i++) { let a = 0; for (let k = -25; k <= 25; k++) a += c[wrap(i + k, N)]; Y[i] = a / 51; } }
    const y0 = Y[0]; for (let i = 0; i < N; i++) Y[i] -= y0;
  } else if (cfg.elev) {
    const knots = cfg.elev.map(([n, h]) => [n === 0 ? 0 : cIdx[n], h]).filter(([i]) => i != null).sort((a, b) => a[0] - b[0]);
    knots.push([N, knots[0][1]]);
    for (let i = 0; i < N; i++) { let k = 0; while (k < knots.length - 2 && knots[k + 1][0] <= i) k++; const [i0, h0] = knots[k], [i1, h1] = knots[k + 1], t = (i - i0) / Math.max(1, i1 - i0), s = t * t * (3 - 2 * t); Y[i] = h0 + (h1 - h0) * s; }
    for (let pass = 0; pass < 3; pass++) { const c = Float32Array.from(Y); for (let i = 0; i < N; i++) { let a = 0; for (let k = -40; k <= 40; k++) a += c[wrap(i + k, N)]; Y[i] = a / 81; } }
  }
  geometry(); // slopes need the heights

  // banked corners: the cross-slope (radians, + = the left side higher) — see computeBank
  const bank = new Float32Array(N), BANKW = (cfg.half ?? 7.5) + 2;
  const bankH = (i, o) => (bank[i] ? Math.tan(bank[i]) * Math.max(-BANKW, Math.min(BANKW, o)) : 0); // height at offset o (+ = left)
  // local search from a known index (fast, for cars that move a few metres per frame)
  const nearestFrom = (x, z, i0, span = 40) => { let best = i0, bd = Infinity; for (let k = -span; k <= span; k++) { const i = wrap(i0 + k, N), d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < bd) { bd = d; best = i; } } return best; };
  // signed sideways offset from the centre line (+ = left) and height at a point near sample i
  const frame = (x, z, i) => {
    const j = wrap(i + 1, N), h = wrap(i - 1, N);
    const dx = x - X[i], dz = z - Z[i], along = dx * TX[i] + dz * TZ[i];
    const k = along >= 0 ? j : h, t = Math.min(1, Math.abs(along));
    const lat = dx * LX[i] + dz * LZ[i], y = Y[i] + (Y[k] - Y[i]) * t + bankH(i, lat);
    return { lat, along, y, s: dist[i] + along };
  };

  const tr = { cfg, N, len, X, Y, Z, TX, TZ, LX, LZ, K, slope, dist, kerb, corners, cIdx, half: cfg.half ?? 7.5, run: cfg.run ?? 13, street: !!cfg.street, nearestGlobal, nearestFrom, frame, wrap: (i) => wrap(i, N), real: useReal, world, S, bank, bankH, yAt: (i, o) => Y[i] + bankH(i, o) };
  // thinner air at altitude (Mexico City): less downforce and drag
  tr.rho = cfg.altitude ? Math.exp(-cfg.altitude / 8400) : 1;
  let pitCfg = useReal && real.pits?.length ? derivePit(tr, real) : null;
  if (pitCfg) {
    // The real "centre line" is where the cars drove, which on the pit straight can hug the pit wall.
    // Slide the track over (smoothly) where it would overlap the pit wall; the pit lane stays put.
    const sd = pitCfg.side === "left" ? 1 : -1, HW = 3.2, WALL = 0.45, need = new Float32Array(N);
    const offAt = knotFn(pitCfg.knots);
    for (let j = Math.ceil(pitCfg.lane[0]); j <= pitCfg.lane[1]; j++) need[wrap(j, N)] = Math.max(0, tr.half + 1.4 + HW + WALL - offAt(j));
    const shift = new Float32Array(N); for (let i = 0; i < N; i++) { let m = 0; for (let d = -90; d <= 90; d += 3) m = Math.max(m, need[wrap(i + d, N)] * (1 - Math.abs(d) / 110)); shift[i] = m; }
    for (let pass = 0; pass < 3; pass++) { const c = Float32Array.from(shift); for (let i = 0; i < N; i++) { let a = 0; for (let d = -20; d <= 20; d++) a += c[wrap(i + d, N)]; shift[i] = a / 41; } }
    if (shift.some((v) => v > 0.05)) {
      for (let i = 0; i < N; i++) { X[i] -= sd * shift[i] * LX[i]; Z[i] -= sd * shift[i] * LZ[i]; }
      pitCfg.knots = pitCfg.knots.map(([j, o]) => [j, o + shift[wrap(Math.round(j), N)]]);
      pitCfg.box.o += shift[wrap(Math.round(pitCfg.box.j), N)]; pitCfg.garageFront += Math.max(...pitCfg.knots.map(([j]) => shift[wrap(Math.round(j), N)]));
      geometry(); tr.len = len;
    }
  }
  tr.len = len;
  computeBank(tr);
  computeWalls(tr);
  pitCfg ??= cfg.pit;
  if (pitCfg) buildPitRoad(tr, pitCfg);
  return tr;
}
// nearest track sample to (x, z), searching only a little back and further forward from i0: a pit lane
// runs the same way as the track, so this never jumps to the other leg of a hairpin or chicane
function nearestAhead(tr, x, z, i0, back, ahead) { let best = i0, bd = Infinity; for (let d = -back; d <= ahead; d++) { const i = tr.wrap(i0 + d), q = (tr.X[i] - x) ** 2 + (tr.Z[i] - z) ** 2; if (q < bd) { bd = q; best = i; } } return best; }
const knotFn = (K) => (j) => { if (j <= K[0][0]) return K[0][1]; if (j >= K[K.length - 1][0]) return K[K.length - 1][1]; let n = 0; while (n < K.length - 2 && j > K[n + 1][0]) n++; const [j0, o0] = K[n], [j1, o1] = K[n + 1]; return o0 + (o1 - o0) * ((j - j0) / Math.max(1e-6, j1 - j0)); };

// The pit lane from real pit stops: which side it's on, where it leaves and rejoins the track, how far
// from the track it runs, where the speed limit starts and ends (where the cars slow down to the limit
// and speed up again) and where the garages are (around where the cars stopped).
function derivePit(tr, real) {
  const { N, X, Z, LX, LZ, half } = tr, stops = [], why = [];
  for (const ps of real.pits) {
    const P = [];
    // which bit of track each sample is beside: searched along from the previous one (like the car does),
    // so in a chicane it doesn't jump to the other half of the corner
    let prevJ = -1;
    for (const [x, y, , t] of ps.pts) {
      const [wx, wz] = tr.world(x, y); let j;
      if (prevJ < 0) { const n = tr.nearestGlobal(wx, wz, 5); if (n.i < 0 || n.d2 > 150 * 150) continue; j = n.i; } else j = nearestAhead(tr, wx, wz, prevJ, 1, 160);
      const d2 = (wx - X[j]) ** 2 + (wz - Z[j]) ** 2; if (d2 > 150 * 150) { prevJ = -1; continue; }
      prevJ = j; P.push({ x: wx, z: wz, t, j, lat: (wx - X[j]) * LX[j] + (wz - Z[j]) * LZ[j] });
    }
    if (P.length < 40) { why.push("few points"); continue; }
    P[0].J = P[0].j;
    for (let k = 1; k < P.length; k++) { let d = P[k].j - P[k - 1].j; if (d > N / 2) d -= N; if (d < -N / 2) d += N; P[k].J = P[k - 1].J + d; }
    // speed over a couple of seconds (single samples are too jittery)
    for (let k = 0; k < P.length; k++) { const a = P[Math.max(0, k - 4)], b = P[Math.min(P.length - 1, k + 4)]; P[k].v = Math.hypot(b.x - a.x, b.z - a.z) / Math.max(0.2, b.t - a.t); }
    // the stop itself: the slowest moment while the car was in the pit lane
    for (let k = 0; k < P.length; k++) { const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)]; P[k].v1 = Math.hypot(b.x - a.x, b.z - a.z) / Math.max(0.1, b.t - a.t); }
    let sk = -1; for (let k = 2; k < P.length - 2; k++) if (Math.abs(P[k].lat) > 4 && (sk < 0 || P[k].v1 < P[sk].v1)) sk = k;
    if (sk < 0 || P[sk].v1 > 4) { why.push(`no stop (${sk < 0 ? "no samples" : P[sk].v1.toFixed(1) + " m/s"})`); continue; }
    const side = Math.sign(P[sk].lat) || 1; for (const p of P) p.o = side * p.lat;
    if (P[sk].o < 4) { why.push("box on track?"); continue; }
    const edge = Math.min(half - 1.5, P[sk].o * 0.5);
    let a = sk; while (a > 0 && P[a - 1].o > edge) a--;
    let b = sk; while (b < P.length - 1 && P[b + 1].o > edge) b++;
    if (a === 0 || b === P.length - 1) { why.push("ends not seen"); continue; }
    // speed-limit zone: slowed to the limit (≤ 85 km/h) before the box, sped up after it
    const fast = (k) => P[k].v > 25.5 && (P[k + 1]?.v ?? 99) > 25.5 && (P[k - 1]?.v ?? 99) > 25.5; // over ~92 km/h for a while
    let la = sk; while (la > a && !fast(la - 1)) la--;
    let lb = sk; while (lb < b && !fast(lb + 1)) lb++;
    const base = P[sk].J;
    // the road itself: where the car went, from a little before it left the track to a little after it
    // rejoined, without the swerve into and out of its box
    const a2 = a, b2 = b, path = [];
    for (let k = a2; k <= b2; k++) if (k === a2 || k === b2 || (Math.hypot(P[k].x - P[sk].x, P[k].z - P[sk].z) > 22 && P[k].v1 > 12)) path.push([P[k].x, P[k].z]);
    let gaps = 0; for (let k = a2 + 1; k <= b2; k++) gaps = Math.max(gaps, Math.hypot(P[k].x - P[k - 1].x, P[k].z - P[k - 1].z));
    stops.push({ side, P: P.slice(a, b + 1).map((p) => ({ J: p.J - base, o: p.o })), entry: P[a].J - base, exit: P[b].J - base, limit: [P[la].J - base, P[lb].J - base], box: { o: P[sk].o, x: P[sk].x, z: P[sk].z }, at: P[sk].j, path: path.filter(Boolean), gaps, n: b2 - a2 });
  }
  if (!stops.length) { tr.pitWhy = why; return null; }
  // the stops agree on the side; take middle values
  const side = Math.sign(stops.reduce((a, s) => a + s.side, 0)) || 1, good = stops.filter((s) => s.side === side);
  const med = (xs) => xs.slice().sort((p, q) => p - q)[Math.floor(xs.length / 2)];
  const ref = good[0], shift = (s) => { let d = s.at - ref.at; if (d > N / 2) d -= N; if (d < -N / 2) d += N; return d; }; // relative to the first stop's box
  const bins = new Map();
  for (const s of good) { const sh = shift(s); for (const p of s.P) { const bin = Math.round((p.J + sh) / 4) * 4; if (!bins.has(bin)) bins.set(bin, []); bins.get(bin).push(p.o); } }
  let K = [...bins.entries()].sort((p, q) => p[0] - q[0]).map(([J, os]) => [J, med(os)]);
  // smooth it, and don't let it swing sideways faster than a road would (no kinks a car can't follow)
  for (let pass = 0; pass < 3; pass++) K = K.map(([J], i) => { let a = 0, n = 0; for (let d = -3; d <= 3; d++) { const k = K[i + d]; if (k) { a += k[1]; n++; } } return [J, a / n]; });
  for (let pass = 0; pass < 4; pass++) for (let i = 1; i < K.length; i++) { const dj = K[i][0] - K[i - 1][0], lim = 0.3 * dj; if (K[i][1] - K[i - 1][1] > lim) K[i][1] = K[i - 1][1] + lim; if (K[i - 1][1] - K[i][1] > lim) K[i - 1][1] = K[i][1] + lim; }
  const entry = med(good.map((s) => s.entry + shift(s))), exit = med(good.map((s) => s.exit + shift(s)));
  const limit = [med(good.map((s) => s.limit[0] + shift(s))), med(good.map((s) => s.limit[1] + shift(s)))];
  const boxes = good.map((s) => shift(s)), boxO = med(good.map((s) => s.box.o));
  // in metres from the start line, the way the lap runs (the box between −N/2 and N/2)
  let base = ref.at; if (base > N / 2) base -= N;
  const abs = (J) => J + base;
  K = K.filter(([J]) => J >= entry && J <= exit).map(([J, o]) => [abs(J), o]);
  K.unshift([abs(entry) - 30, half - 2.5]); K.push([abs(exit) + 30, half - 2.5]);
  const lane = K.filter(([, o]) => o > half + 3.6), fast = med(lane.map(([, o]) => o)) ?? half + 6.7;
  // garages: centred on where the cars stopped, along the speed-limited part
  const lim = [abs(limit[0]), abs(limit[1])], mid = abs(med(boxes)), half2 = Math.max(110, Math.min(170, (lim[1] - lim[0]) / 2 - 15));
  let gar = [Math.max(abs(entry) + 70, mid - half2), Math.min(abs(exit) - 70, mid + half2)];
  if (gar[1] < gar[0] + 120) gar = [mid - 90, mid + 90];
  // the road follows the stop with the most even position data
  const best = good.slice().sort((p, q) => p.gaps - q.gaps)[0];
  return {
    side: side > 0 ? "left" : "right", entry: abs(entry) - 30, exit: [abs(exit), abs(exit) + 30], lane: [lane[0]?.[0] ?? abs(entry), lane[lane.length - 1]?.[0] ?? abs(exit)],
    limit: lim, garages: gar, knots: K, box: { j: base, o: boxO, x: best.box.x, z: best.box.z }, garageFront: Math.max(boxO + 3.4, fast + 3.2 + 4), fromData: true,
    path: best.path, boxFromLane: Math.max(4.5, boxO - fast),
  };
}

// Banked corners (cfg.bank): the track tilts across, the outside of the corner higher. Each one reaches
// along the corner as far as it keeps turning, easing in and out over the last 40 m.
function computeBank(tr) {
  const { N, K, bank } = tr; bank.fill(0);
  const Kav = (i, r) => { let a = 0; for (let d = -r; d <= r; d++) a += K[tr.wrap(i + d)]; return a / (2 * r + 1); };
  for (const b of tr.cfg.bank ?? []) {
    let apex = b.c != null ? tr.cIdx[b.c] : b.at; if (apex == null) continue;
    // the middle of the corner can be a little off the corner's marker: take the tightest point nearby
    let best = apex; for (let d = -80; d <= 80; d += 2) if (Math.abs(Kav(apex + d, 6)) > Math.abs(Kav(best, 6))) best = tr.wrap(apex + d);
    apex = best; const sg = Math.sign(Kav(apex, 10)) || 1, rad = (b.deg * Math.PI) / 180; // K > 0 turns right: the left (outside) goes up
    let a = 0; while (a < 500 && sg * Kav(apex - a, 8) > 0.0035) a++;
    let e = 0; while (e < 500 && sg * Kav(apex + e, 8) > 0.0035) e++;
    for (let d = -a - 40; d <= e + 40; d++) {
      const f = d < -a ? (d + a + 40) / 40 : d > e ? (e + 40 - d) / 40 : 1, sm = f * f * (3 - 2 * f), j = tr.wrap(apex + d);
      if (Math.abs(sg * rad * sm) > Math.abs(bank[j])) bank[j] = sg * rad * sm;
    }
  }
}

// What's beside the track on each side, per metre: the barrier's distance from the centre line, what kind
// it is (0 = armco, 1 = Tecpro blocks (soft), 2 = pit wall, 3 = concrete street wall), and the run-off
// before it: a tarmac apron (m beyond the white line) then the main surface (0 = grass, 1 = tarmac,
// 2 = gravel, 3 = street). On a permanent circuit the run-off gets wider on the outside of the fast
// corners (where a car would really go off). Where two parts of the track run close together the
// barrier sits half-way between them, and on the inside of tight corners it stays close enough that it
// can't fold over onto the track.
export const SURF = ["grass", "tarmac", "gravel", "street"];
const ENV_ROUGH = { a0: 17.5, a1: 0.00606, vmax: 95, brake: (v) => 16.5 + 0.0078 * v * v, accel: (v) => Math.max(0.5, Math.min(10.5 + 0.002 * v * v, 690 / Math.max(v, 1)) - 0.0008 * v * v - 0.12) };
function computeWalls(tr) {
  const { N, X, Z, LX, LZ, kerb, K } = tr, half = tr.half, cfg = tr.cfg, style = cfg.runoff ?? "mixed", street = tr.street;
  const wrapI = tr.wrap, vp = speedProfile(tr, ENV_ROUGH, 0.95);
  // for every metre: is it at a corner, which side is the outside, and how fast the cars come through
  const outside = new Int8Array(N), corner = new Uint8Array(N), vz = new Float32Array(N), kmax = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let sumK = 0, near = false; for (let k = -60; k <= 60; k += 6) { const j = wrapI(i + k); if (kerb[j]) near = true; sumK += K[j]; }
    corner[i] = near ? 1 : 0; outside[i] = sumK > 0.01 ? 0 : sumK < -0.01 ? 1 : -1; // K > 0 turns right: the outside is the left (0)
    let v = 0; for (let k = -90; k <= 20; k += 5) v = Math.max(v, vp[wrapI(i + k)]); vz[i] = v * 3.6;
    let km = 0; for (let k = -14; k <= 14; k += 2) km = Math.max(km, Math.abs(K[wrapI(i + k)])); kmax[i] = km;
  }
  const want = [new Float32Array(N), new Float32Array(N)], apron = [new Float32Array(N), new Float32Array(N)], surf = [new Uint8Array(N), new Uint8Array(N)];
  for (let i = 0; i < N; i++) for (const k of [0, 1]) {
    const out = corner[i] && outside[i] === k, inn = corner[i] && outside[i] === 1 - k, fast = vz[i] > 170;
    let extra = 0, ap = 1, su = 0;
    if (street) {
      su = 3; ap = 0;
      if (style === "gravel" && out && fast) { su = 2; ap = 1.5; extra = Math.min(10, (vz[i] - 150) * 0.08); }
    } else {
      if (out) extra = Math.max(0, Math.min(28, (vz[i] - 120) * 0.17));
      if (style === "tarmac") { su = out || inn ? 1 : 0; ap = out ? 3 : inn ? 2 : 3; }
      else if (style === "gravel") { su = out ? 2 : 0; ap = out ? 2.5 : inn ? 1.5 : 1; }
      else { su = out && fast ? 2 : out ? 1 : 0; ap = out ? 3 : inn ? 1.5 : 1; }
    }
    want[k][i] = half + tr.run + extra + 0.6; apron[k][i] = ap; surf[k][i] = su;
  }
  // the run-off widens and narrows gradually
  for (const w of want) {
    const m = Float32Array.from(w); for (let i = 0; i < N; i++) { let v = m[i]; for (let k = -40; k <= 40; k += 2) v = Math.max(v, m[wrapI(i + k)] - Math.abs(k) * 0.12); w[i] = v; }
    for (let pass = 0; pass < 2; pass++) { const c = Float32Array.from(w); for (let i = 0; i < N; i++) { let a = 0; for (let k = -15; k <= 15; k++) a += c[wrapI(i + k)]; w[i] = a / 31; } }
  }
  // limits: other parts of the track nearby, and the inside of tight corners
  const lim = [new Float32Array(N).fill(1e9), new Float32Array(N).fill(1e9)];
  const lapGap = (a, b) => { const d = Math.abs(a - b); return Math.min(d, N - d); };
  for (let i = 0; i < N; i += 2) {
    for (const [k, s] of [[0, 1], [1, -1]]) {
      for (let o = half + 2; o < want[k][i] * 2 + half; o += 1.5) {
        const n = tr.nearestGlobal(X[i] + LX[i] * o * s, Z[i] + LZ[i] * o * s, 1);
        if (n.i >= 0 && lapGap(n.i, i) > 120 && n.d2 < half * half) { lim[k][i] = Math.max(half + 2, (o + half) / 2 - 0.5); break; }
      }
      // the inside of a bend (K > 0 turns right: the inside is the right, k = 1)
      const ins = K[i] > 0 ? 1 : 0;
      if (k === ins && kmax[i] > 0.004) lim[k][i] = Math.min(lim[k][i], Math.max(Math.min(half + tr.run + 0.6, half + 2.2), 0.8 / kmax[i] - 3.5));
      if (i + 1 < N) lim[k][i + 1] = lim[k][i];
    }
  }
  for (const l of lim) { const m = Float32Array.from(l); for (let i = 0; i < N; i++) { let v = m[i]; for (let k = -25; k <= 25; k++) v = Math.min(v, m[wrapI(i + k)]); l[i] = v; } }
  const wall = [new Float32Array(N), new Float32Array(N)];
  for (const k of [0, 1]) {
    const w = wall[k]; for (let i = 0; i < N; i++) w[i] = Math.min(want[k][i], lim[k][i]);
    for (let pass = 0; pass < 2; pass++) { const c = Float32Array.from(w); for (let i = 0; i < N; i++) { let a = 0; for (let d = -12; d <= 12; d++) a += c[wrapI(i + d)]; w[i] = Math.min(c[i], a / 25); } }
    // the apron and the surface beyond it have to fit before the barrier; very short patches of a surface
    // are merged into what's around them
    for (let i = 0; i < N; i++) { apron[k][i] = Math.min(apron[k][i], Math.max(0, w[i] - half - 1.6)); if (w[i] - half - apron[k][i] < 2.5 && surf[k][i] === 2) surf[k][i] = 1; }
    const sf = surf[k]; for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N;) { let e = i; while (e < i + N && sf[wrapI(e)] === sf[i]) e++; if (e - i < 25) { const prev = sf[wrapI(i - 1)]; for (let j = i; j < e; j++) sf[wrapI(j)] = prev; } i = e; }
    { const c = Float32Array.from(apron[k]); for (let i = 0; i < N; i++) { let a = 0; for (let d = -10; d <= 10; d++) a += c[wrapI(i + d)]; apron[k][i] = Math.min(Math.max(0, w[i] - half - 1.6), a / 21); } }
  }
  // what the barriers are. Permanent circuits: Tecpro where a car would go off (within 60 m of a kerbed
  // corner), armco on the straights. Street circuits: concrete walls, with Tecpro only on the outside of
  // the corners.
  const type = [new Uint8Array(N), new Uint8Array(N)];
  for (let i = 0; i < N; i++) {
    let near = false, outL = false, outR = false;
    for (let k = -60; k <= 60; k += 10) { const j = wrapI(i + k); if (kerb[j]) { near = true; if (K[j] > 0.004) outL = true; if (K[j] < -0.004) outR = true; } }
    if (street) { type[0][i] = near && outL ? 1 : 3; type[1][i] = near && outR ? 1 : 3; }
    else if (near) type[0][i] = type[1][i] = 1;
  }
  tr.wall = wall; tr.wallType = type; tr.apron = apron; tr.surf = surf;
  tr.wallAt = (i, lat) => wall[lat >= 0 ? 0 : 1][i];
}

// The pit lane is a road of its own: a line of samples one metre apart with its own walls. From real
// data it follows where a car really went through the pit lane; otherwise it's laid out as an offset
// from the track's centre line. Where it meets the track at each end there's no wall between them, so a
// car can drive from one onto the other; along the rest a concrete pit wall separates them (which also
// becomes the track's wall on that side).
function buildPitRoad(tr, P0) {
  let P = P0;
  const { N, X, Y, Z, LX, LZ, half } = tr, s = P.side === "left" ? 1 : -1, k = s > 0 ? 0 : 1;
  const HW = 3.2, WALL = 0.45; // half the fast lane; pit wall thickness
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const apex = P.apex ?? [Infinity, -Infinity];
  let pts;
  if (P.path?.length > 8) {
    // real: smooth the car's path (a curve through the points, then a gentle average), then one point a metre
    // lead in from the track and out onto it again, following the track for a bit so the road joins smoothly
    const lead = (q, dir) => {
      const n = tr.nearestGlobal(q[0], q[1], 6).i, o0 = s * ((q[0] - X[n]) * LX[n] + (q[1] - Z[n]) * LZ[n]), out = [], m0 = half - 2.5;
      for (const d of [70, 56, 42, 28, 14]) { const j = wrap(n + dir * d, N), f = (70 - d) / 70, o = s * (m0 + (o0 - m0) * f * f * (3 - 2 * f)); out.push([X[j] + LX[j] * o, Z[j] + LZ[j] * o]); }
      return dir < 0 ? out : out.reverse();
    };
    const src = [...lead(P.path[0], -1), ...P.path, ...lead(P.path[P.path.length - 1], 1)], open = [src[0], ...src, src[src.length - 1]], dense = [];
    for (let i = 1; i < open.length - 2; i++) {
      const p0 = open[i - 1], p1 = open[i], p2 = open[i + 1], p3 = open[i + 2];
      for (let t = 0; t < 1; t += 0.1) { const t2 = t * t, t3 = t2 * t; dense.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
    }
    dense.push(src[src.length - 1]);
    const one = [dense[0]]; let acc = 0; for (let n = 1; n < dense.length; n++) { acc += Math.hypot(dense[n][0] - dense[n - 1][0], dense[n][1] - dense[n - 1][1]); if (acc >= 1) { one.push(dense[n]); acc = 0; } }
    let sm2 = one; for (let pass = 0; pass < 4; pass++) sm2 = sm2.map((p, i) => { if (i < 3 || i > sm2.length - 4) return p; let x = 0, z = 0; for (let d = -3; d <= 3; d++) { x += sm2[i + d][0]; z += sm2[i + d][1]; } return [x / 7, z / 7]; });
    // which bit of track each point is beside, counted continuously from the start line
    let prev = null; pts = sm2.map(([x, z]) => { let j = prev == null ? tr.nearestGlobal(x, z, 6).i : nearestAhead(tr, x, z, wrap(Math.round(prev), N), 0, 150); if (prev != null) { let d = j - wrap(Math.round(prev), N); if (d > N / 2) d -= N; if (d < -N / 2) d += N; j = prev + d; } else if (j > N / 2) j -= N; prev = j; return { x, z, j }; });
    for (const p of pts) { const i = wrap(Math.round(p.j), N); p.y = Y[i]; p.o = s * ((p.x - X[i]) * LX[i] + (p.z - Z[i]) * LZ[i]); }
  } else {
    // drawn by hand (round the inside of a hairpin the lane narrows a little so its wall can stay clear of the kerb)
    const HWA = 2.3, laneC = half + 3 + WALL + HW, apexO = half + 3.0 + WALL + HWA, mergeO = half - 1.5;
    const knots = P.knots ?? [[P.entry, mergeO], [P.lane[0], laneC], [P.lane[1], laneC], [apex[0], apexO], [apex[1], apexO], [P.exit[0], laneC], [P.exit[1], mergeO]];
    const offAt = (j) => { let n = 0; while (n < knots.length - 2 && j > knots[n + 1][0]) n++; const [j0, o0] = knots[n], [j1, o1] = knots[n + 1]; return o0 + (o1 - o0) * sm(j0, j1, j); };
    const raw = [];
    for (let j = P.entry; j <= P.exit[1]; j += 0.25) {
      const i0 = wrap(Math.floor(j), N), i1 = wrap(i0 + 1, N), f = j - Math.floor(j), o = offAt(j) * s;
      raw.push({ x: X[i0] + (X[i1] - X[i0]) * f + (LX[i0] + (LX[i1] - LX[i0]) * f) * o, z: Z[i0] + (Z[i1] - Z[i0]) * f + (LZ[i0] + (LZ[i1] - LZ[i0]) * f) * o, j, y: Y[i0] + (Y[i1] - Y[i0]) * f, o: offAt(j), hw: P.apex ? HW - (HW - HWA) * sm(apex[0] - 50, apex[0], j) * (1 - sm(apex[1], apex[1] + 50, j)) : HW });
    }
    pts = [raw[0]]; let acc = 0;
    for (let n = 1; n < raw.length; n++) { acc += Math.hypot(raw[n].x - raw[n - 1].x, raw[n].z - raw[n - 1].z); if (acc >= 1) { pts.push(raw[n]); acc = 0; } }
  }
  const M = pts.length, PX = new Float32Array(M), PY = new Float32Array(M), PZ = new Float32Array(M), mj = new Float32Array(M), PO = new Float32Array(M);
  pts.forEach((p, n) => { PX[n] = p.x; PY[n] = p.y; PZ[n] = p.z; mj[n] = p.j; PO[n] = p.o; });
  { const c = Float32Array.from(PY); for (let i = 0; i < M; i++) { let a = 0, n = 0; for (let d = -10; d <= 10; d++) { const q = i + d; if (q >= 0 && q < M) { a += c[q]; n++; } } PY[i] = a / n; } }
  const cl = (i) => Math.max(0, Math.min(M - 1, i));
  const TX = new Float32Array(M), TZ = new Float32Array(M), PLX = new Float32Array(M), PLZ = new Float32Array(M), K = new Float32Array(M), slope = new Float32Array(M), dist = new Float32Array(M);
  for (let i = 0; i < M; i++) { const a = cl(i - 1), b = cl(i + 1), dx = PX[b] - PX[a], dz = PZ[b] - PZ[a], l = Math.hypot(dx, dz) || 1; TX[i] = dx / l; TZ[i] = dz / l; PLX[i] = TZ[i]; PLZ[i] = -TX[i]; slope[i] = (PY[b] - PY[a]) / l; if (i) dist[i] = dist[i - 1] + Math.hypot(PX[i] - PX[i - 1], PZ[i] - PZ[i - 1]); }
  for (let i = 0; i < M; i++) { const a = cl(i - 6), b = cl(i + 6); K[i] = Math.atan2(TX[a] * TZ[b] - TZ[a] * TX[b], TX[a] * TX[b] + TZ[a] * TZ[b]) / Math.max(1, dist[b] - dist[a]); }
  const distAtMain = (j) => { let best = 0, bd = Infinity; for (let i = 0; i < M; i++) { const q = Math.abs(mj[i] - j); if (q < bd) { bd = q; best = i; } } return dist[best]; };
  const limitFrom = distAtMain(P.limit[0]), limitTo = distAtMain(P.limit[1]);
  // The garages: one straight row, all of it inside the speed limit (with room to pull in and out at the
  // ends), on the straightest part of the pit lane, and as close as that allows to where the real cars stopped.
  {
    // (the longest row, up to 320 m, that turns less than about 6° end to end; a shorter one where the lane bends)
    const room = 28, span = limitTo - limitFrom - 2 * room;
    const boxD = P.box ? distAtMain(P.box.j) : (distAtMain(P.garages[0]) + distAtMain(P.garages[1])) / 2;
    const at = (d) => { let i = 0; while (i < M - 1 && dist[i] < d) i++; return i; };
    let pick = null;
    for (const L of [320, 290, 260, 230, 200, 175, 150, 130]) {
      const Lg = Math.max(110, Math.min(L, span)); let best = null;
      for (let d0 = limitFrom + room; d0 + Lg <= Math.max(limitFrom + room + Lg, limitTo - room) + 0.01; d0 += 4) {
        const a = at(d0), b = at(d0 + Lg); let turn = 0, kk = 0, km = 0; for (let i = a; i <= b; i++) { turn += K[i] * (i > a ? dist[i] - dist[i - 1] : 0); kk = Math.max(kk, Math.abs(K[i])); km += Math.abs(tr.K[wrap(Math.round(mj[i]), N)]); }
        // (and beside a straight bit of the track, so they don't look like they're round a corner from the car)
        const score = Math.abs(turn) * 60 + kk * 400 + km * 25 + Math.abs(d0 + Lg / 2 - boxD) / 80;
        if (!best || score < best.score) best = { score, a, b, turn: Math.abs(turn) + km * 0.5 };
      }
      if (best && (!pick || best.turn < pick.turn)) pick = best;
      if (pick && pick.turn < 0.1) break;
    }
    if (pick) P = { ...P, garages: [mj[pick.a], mj[pick.b]] };
  }
  // walls, as distances from the pit road's middle: tk = the side facing the track, gk = the garages' side
  const tk = s > 0 ? 1 : 0, gk = 1 - tk, inG = (j) => j >= P.garages[0] - 24 && j <= P.garages[1] + 24; // (the wall ramps in beyond the garages, not in front of them)
  const gWall = P.path ? HW + (P.boxFromLane ?? 6) + 3.4 : null; // garage doors from the lane's middle (real)
  const bar = new Uint8Array(M), hws = new Float32Array(M), wall = [new Float32Array(M), new Float32Array(M)], type = [new Uint8Array(M).fill(2), new Uint8Array(M).fill(2)];
  for (let i = 0; i < M; i++) {
    const o = PO[i], hw = pts[i].hw ?? HW; hws[i] = hw;
    bar[i] = o - hw - WALL >= half + 1.2 ? 1 : 0; // room for a wall between the track and the lane
    wall[tk][i] = bar[i] ? hw : 40;
    const tight = Math.abs(K[i]) > 0.06 || (mj[i] > apex[0] - 40 && mj[i] < apex[1] + 40);
    wall[gk][i] = inG(mj[i]) ? (gWall ?? half + 17 - o) : tight ? hw + 4.2 : hw + 1.6;
  }
  { // ramps, not steps
    const m = Float32Array.from(wall[gk]); for (let i = 0; i < M; i++) { let v = m[i]; for (let d = -10; d <= 10; d++) v = Math.min(v, m[cl(i + d)]); wall[gk][i] = v; }
    for (let pass = 0; pass < 2; pass++) { const c = Float32Array.from(wall[gk]); for (let i = 0; i < M; i++) { let a = 0; for (let d = -8; d <= 8; d++) a += c[cl(i + d)]; wall[gk][i] = Math.min(c[i], a / 17); } }
  }
  // what that does to the track: the pit wall (or the pit road's outer wall, where they merge) becomes
  // the track's wall on that side, for every metre of track beside the pit road
  const fromMain = new Int32Array(N).fill(-1);
  const j0 = Math.ceil(Math.min(...mj)), j1 = Math.floor(Math.max(...mj));
  for (let j = j0, p = 0; j <= j1; j++) {
    let bp = 0, bd = Infinity; for (let q = Math.max(0, p - 40); q < Math.min(M, p + 400); q++) { const d = Math.abs(mj[q] - j); if (d < bd) { bd = d; bp = q; } } p = bp;
    if (bd > 3) continue;
    const wj = wrap(j, N);
    fromMain[wj] = p;
    tr.wall[k][wj] = bar[p] ? PO[p] - hws[p] - WALL : Math.max(half + 1.5, Math.min(tr.wall[k][wj], PO[p] + wall[gk][p])); tr.wallType[k][wj] = 2;
    tr.apron[k][wj] = 0; tr.surf[k][wj] = tr.street ? 3 : 1;
  }
  // no kerb on the pit side where the cars cross between the track and the pit lane (they'd have to drive
  // over it), from a little before the pit lane leaves the track to a little after it joins again
  const kb = k === 0 ? 1 : 2;
  for (let j = j0 - 40; j <= j1 + 40; j++) { const wj = wrap(j, N), p = fromMain[wj]; if (p < 0 || !bar[p] || j < j0 + 60 || j > j1 - 60) tr.kerb[wj] &= ~kb; }
  const frame = (x, z, i) => {
    const dx = x - PX[i], dz = z - PZ[i], along = dx * TX[i] + dz * TZ[i], j = cl(along >= 0 ? i + 1 : i - 1), t = Math.min(1, Math.abs(along));
    return { lat: dx * PLX[i] + dz * PLZ[i], along, y: PY[i] + (PY[j] - PY[i]) * t, s: dist[i] + along };
  };
  const nearestFrom = (x, z, i0, span = 30) => { let best = cl(i0), bd = Infinity; for (let d = -span; d <= span; d++) { const i = cl(i0 + d), q = (PX[i] - x) ** 2 + (PZ[i] - z) ** 2; if (q < bd) { bd = q; best = i; } } return best; };
  const laneOut = gWall != null ? null : half + 17;
  tr.pitRoad = {
    N: M, X: PX, Y: PY, Z: PZ, TX, TZ, LX: PLX, LZ: PLZ, K, slope, dist, len: dist[M - 1], mj, off: PO, bar, hw: hws, wall, wallType: type, kerb: new Uint8Array(M),
    half: 40, run: 0, HW, WALL, side: s, k, tk, gk, fromMain, frame, nearestFrom, wrap: cl,
    limitFrom, limitTo, garages: P.garages, box: P.box ?? null, fromData: !!P.path,
  };
  // the simple description scenery placement uses (how far out from the track the pit buildings reach)
  let reach = 0; for (let i = 0; i < M; i++) if (inG(mj[i])) reach = Math.max(reach, PO[i] + wall[gk][i]);
  tr.pit = { side: s, k, from: Math.min(...mj), to: Math.max(...mj), garages: P.garages, wallOff: half + 3, laneIn: half + 3 + WALL, laneOut: laneOut ?? (reach || half + 17) };
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

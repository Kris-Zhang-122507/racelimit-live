// Builds the 3D circuit from the track data: asphalt, white lines, kerbs, run-off, barriers,
// catch fencing, terrain that follows the track's height, trees, grandstands, the pit building,
// the start gantry and brake boards. Everything is generated, nothing is downloaded.
import * as THREE from "three";

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// ---------- generated textures ----------
function canvas(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function normalFrom(height, w, h, strength) {
  return canvas(w, h, (g) => { const img = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, l = height[y * w + ((x - 1 + w) % w)], r = height[y * w + ((x + 1) % w)], u = height[((y - 1 + h) % h) * w + x], d = height[((y + 1) % h) * w + x]; const nx = (l - r) * strength, ny = (u - d) * strength, n = Math.hypot(nx, ny, 1); img.data[i * 4] = (nx / n * 0.5 + 0.5) * 255; img.data[i * 4 + 1] = (ny / n * 0.5 + 0.5) * 255; img.data[i * 4 + 2] = (1 / n * 0.5 + 0.5) * 255; img.data[i * 4 + 3] = 255; } g.putImageData(img, 0, 0); });
}
function textures() {
  const AW = 512, agg = new Float32Array(AW * AW).map(() => Math.random() ** 3);
  const asphalt = tex(canvas(AW, AW, (g) => { const img = g.createImageData(AW, AW); for (let i = 0; i < AW * AW; i++) { const x = i % AW, rub = Math.exp(-(((x / AW) - 0.5) ** 2) / 0.03) * 16; const v = 62 + agg[i] * 66 - rub + (Math.random() - 0.5) * 10; img.data[i * 4] = v; img.data[i * 4 + 1] = v + 1; img.data[i * 4 + 2] = v + 4; img.data[i * 4 + 3] = 255; } g.putImageData(img, 0, 0); }));
  const asphaltN = tex(normalFrom(agg, AW, AW, 2.2), false);
  const kerb = tex(canvas(128, 512, (g, w, h) => { g.fillStyle = "#C8161A"; g.fillRect(0, 0, w, h / 2); g.fillStyle = "#F1F1EE"; g.fillRect(0, h / 2, w, h / 2); for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(30,30,30,${Math.random() * 0.16})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 4, 1 + Math.random() * 10); } g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, h / 2 - 2, w, 3); g.fillRect(0, h - 2, w, 2); }));
  const grassH = new Float32Array(256 * 256).map(() => Math.random());
  const grass = tex(canvas(256, 256, (g, w, h) => { const img = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const y = Math.floor(i / w), stripe = Math.floor(y / 64) % 2 ? 3 : -2, n = (grassH[i] - 0.5) * 22; img.data[i * 4] = 60 + n * 0.6 + stripe * 0.5; img.data[i * 4 + 1] = 106 + n + stripe; img.data[i * 4 + 2] = 46 + n * 0.4; img.data[i * 4 + 3] = 255; } g.putImageData(img, 0, 0); }));
  const grassN = tex(normalFrom(grassH, 256, 256, 2.5), false);
  const runoff = tex(canvas(256, 256, (g, w, h) => { const img = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = (Math.random() - 0.5) * 16 + agg[i] * 22; img.data[i * 4] = 52 + v; img.data[i * 4 + 1] = 74 + v; img.data[i * 4 + 2] = 88 + v; img.data[i * 4 + 3] = 255; } g.putImageData(img, 0, 0); }));
  const fence = tex(canvas(64, 64, (g) => { g.strokeStyle = "rgba(170,175,180,1)"; g.lineWidth = 2; for (let k = -64; k < 128; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 64, 64); g.stroke(); g.beginPath(); g.moveTo(k + 64, 0); g.lineTo(k, 64); g.stroke(); } }));
  const needle = tex(canvas(128, 128, (g, w, h) => { g.fillStyle = "#2E4A26"; g.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { const x = Math.random() * w, y = Math.random() * h, l = 3 + Math.random() * 7, v = 30 + Math.random() * 60; g.strokeStyle = `rgb(${v * 0.55},${v + 20},${v * 0.45})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y + l); g.stroke(); } }));
  const seats = tex(canvas(512, 128, (g) => { for (let y = 0; y < 128; y += 5) for (let x = 0; x < 512; x += 3) { g.fillStyle = ["#B92E2A", "#E8EAF0", "#1F4E9A", "#F0C419", "#2E7D32", "#FF8000", "#30343C", "#C9C9C9"][Math.floor(Math.random() * 8)]; g.fillRect(x, y, 2, 4); } }));
  const checker = tex(canvas(64, 16, (g) => { for (let x = 0; x < 64; x += 8) for (let y = 0; y < 16; y += 8) { g.fillStyle = (x + y) / 8 % 2 ? "#111" : "#F2F2F2"; g.fillRect(x, y, 8, 8); } }));
  return { asphalt, asphaltN, kerb, grass, grassN, runoff, fence, needle, seats, checker };
}

export function buildCircuit(tr, scene, { profile } = {}) {
  const T = textures(), { N, X, Y, Z, LX, LZ, TX, TZ, dist, kerb } = tr, half = tr.half, run = tr.run;
  const at = tr.wrap;
  const group = new THREE.Group(); scene.add(group);
  // which side is the inside of the lap (for the pits and the main grandstand)
  let cx = 0, cz = 0; for (let i = 0; i < N; i += 10) { cx += X[i]; cz += Z[i]; } cx /= N / 10; cz /= N / 10;
  const inside = (X[0] - cx) * -LX[0] + (Z[0] - cz) * -LZ[0] > 0 ? 1 : -1; // +1: the inside is to the left of the start line

  // a strip along the track with a cross-section profile [[offset, height], …] from index a to b
  function strip(a, b, prof, mat, { vScale = 10, uScale = 1, colors = null } = {}) {
    const M = prof.length, pos = [], uv = [], idx = [];
    for (let k = 0; k <= b - a; k++) {
      const i = at(a + k), d = dist[i] + (a + k >= N ? tr.len : 0) - (a + k < 0 ? tr.len : 0);
      for (let m = 0; m < M; m++) { const [o, h] = prof[m]; pos.push(X[i] + LX[i] * o, Y[i] + h, Z[i] + LZ[i] * o); uv.push((m / (M - 1)) * uScale, d / vScale); }
      if (k < b - a) for (let m = 0; m < M - 1; m++) { const o = k * M + m; idx.push(o, o + M, o + 1, o + 1, o + M, o + M + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    if (colors) g.setAttribute("color", new THREE.Float32BufferAttribute(colors(pos.length / 3), 3));
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; group.add(m); return m;
  }
  // runs of the lap where `test(i)` holds, as [start, end] index pairs (end may pass N)
  function runs(test, minLen = 1) {
    const out = []; let s = -1;
    let start = 0; while (start < N && test(start)) start++; // begin outside a run so runs don't split at the line
    for (let k = start; k < start + N; k++) { const ok = test(at(k)); if (ok && s < 0) s = k; if ((!ok || k === start + N - 1) && s >= 0) { if (k - s >= minLen) out.push([s, k]); s = -1; } }
    if (start === N) out.push([0, N]);
    return out;
  }

  // ---------- asphalt, lines, start line, grid ----------
  T.asphalt.repeat.set(1, 1);
  const asphaltMat = new THREE.MeshStandardMaterial({ map: T.asphalt, normalMap: T.asphaltN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.9 });
  strip(0, N, [[-half - 0.6, 0.0], [-half / 2, 0.035], [0, 0.05], [half / 2, 0.035], [half + 0.6, 0.0]], asphaltMat, { vScale: 6 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xF2F2EE, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  strip(0, N, [[half - 0.32, 0.012], [half - 0.12, 0.012]], lineMat); strip(0, N, [[-half + 0.12, 0.012], [-half + 0.32, 0.012]], lineMat);
  { // chequered start line and the grid boxes behind it
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, 1.0), new THREE.MeshStandardMaterial({ map: T.checker, roughness: 0.6 }));
    T.checker.repeat.set(half * 2 / 2, 0.25);
    sl.position.set(X[0], Y[0] + 0.06, Z[0]);
    sl.rotation.set(-Math.PI / 2, 0, Math.atan2(TX[0], TZ[0])); group.add(sl);
    const box = new THREE.MeshStandardMaterial({ color: 0xEDEDED, roughness: 0.6 });
    for (let p = 0; p < 20; p++) {
      const i = at(-14 - p * 8), side = p % 2 ? -1 : 1, o = side * half * 0.45;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.18), box); m.rotation.set(-Math.PI / 2, 0, Math.atan2(TX[i], TZ[i])); m.position.set(X[i] + LX[i] * o, Y[i] + 0.055, Z[i] + LZ[i] * o); group.add(m);
    }
  }

  // ---------- kerbs (raised, rounded) ----------
  const kerbMat = new THREE.MeshStandardMaterial({ map: T.kerb, roughness: 0.55 });
  const kerbProf = (side) => { const pts = []; for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push([side * (half - 0.05 + u * 1.55), 0.008 + 0.07 * Math.sin(Math.min(1, u * 1.15) * Math.PI / 2) ** 0.8 - (u > 0.9 ? (u - 0.9) * 0.6 : 0)]); } return side > 0 ? pts : pts.reverse(); };
  const kerbRuns = runs((i) => kerb[i] !== 0, 10);
  for (const [a, b] of kerbRuns) { strip(a, b, kerbProf(1), kerbMat, { vScale: 6 }); strip(a, b, kerbProf(-1), kerbMat, { vScale: 6 }); }

  // ---------- run-off: painted asphalt in the corners, grass on the straights ----------
  const runMat = new THREE.MeshStandardMaterial({ map: T.runoff, roughness: 0.92 });
  const grassMat = new THREE.MeshStandardMaterial({ map: T.grass, normalMap: T.grassN, roughness: 1 });
  T.grass.repeat.set(1, 1);
  const cornerish = (i) => { for (let k = -60; k <= 60; k += 10) if (kerb[at(i + k)]) return true; return false; };
  for (const [a, b] of runs(cornerish, 2)) for (const s of [1, -1]) strip(a, b, s > 0 ? [[half + 0.6, -0.005], [half + run + 0.6, -0.03]] : [[-half - run - 0.6, -0.03], [-half - 0.6, -0.005]], runMat, { vScale: 12 });
  for (const [a, b] of runs((i) => !cornerish(i), 2)) for (const s of [1, -1]) strip(a, b, s > 0 ? [[half + 0.6, -0.005], [half + run + 0.6, -0.04]] : [[-half - run - 0.6, -0.04], [-half - 0.6, -0.005]], grassMat, { vScale: 8, uScale: 3 });

  // ---------- barriers: Tecpro blocks in corners, armco on straights, catch fence everywhere ----------
  const wallOff = half + run + 0.6;
  {
    const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.45, 1.0, 0.85), new THREE.MeshStandardMaterial({ roughness: 0.55 }), 8000);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0); let nb = 0;
    for (const side of [1, -1]) {
      for (const [a, b] of runs(cornerish, 2)) {
        let last = -9;
        for (let k = a; k < b; k++) { const i = at(k), d = dist[i] + (k >= N ? tr.len : 0); if (d - last < 1.5) continue; last = d; q.setFromAxisAngle(up, Math.atan2(TX[i], TZ[i]) + Math.PI / 2); const o = side * (wallOff + 0.2); m4.compose(new THREE.Vector3(X[i] + LX[i] * o, Y[i] + 0.5, Z[i] + LZ[i] * o), q, new THREE.Vector3(1, 1, 1)); if (nb < 8000) { blocks.setMatrixAt(nb, m4); blocks.setColorAt(nb++, col.set(Math.floor(d / 1.5) % 2 ? 0x1F4FB4 : 0xEDEFF2)); } }
      }
    }
    blocks.count = nb; blocks.instanceColor.needsUpdate = true; group.add(blocks);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xC9CED4, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide });
    for (const [a, b] of runs((i) => !cornerish(i), 2)) for (const side of [1, -1]) for (const yy of [0.45, 0.8]) strip(a, b, side > 0 ? [[wallOff, yy], [wallOff, yy + 0.32]] : [[-wallOff, yy + 0.32], [-wallOff, yy]], armMat, { vScale: 4 });
    const fenceMat = new THREE.MeshStandardMaterial({ map: T.fence, alphaTest: 0.45, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 });
    T.fence.repeat.set(1, 1);
    for (const side of [1, -1]) strip(0, N, side > 0 ? [[wallOff + 1.6, 0], [wallOff + 1.6, 4.0]] : [[-wallOff - 1.6, 4.0], [-wallOff - 1.6, 0]], fenceMat, { vScale: 3, uScale: 1.3 });
    const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 4.2, 4, 1, true), new THREE.MeshStandardMaterial({ color: 0x8A9098, metalness: 0.8, roughness: 0.35 }), 6000); let np = 0;
    for (const side of [1, -1]) for (let i = 0; i < N; i += 6) { const o = side * (wallOff + 1.6); m4.makeTranslation(X[i] + LX[i] * o, Y[i] + 2.1, Z[i] + LZ[i] * o); if (np < 6000) posts.setMatrixAt(np++, m4); }
    posts.count = np; group.add(posts);
  }

  // ---------- terrain: follows the track, rolling away from it ----------
  const samples = []; for (let i = 0; i < N; i += 25) samples.push(i);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < N; i += 10) { minX = Math.min(minX, X[i]); maxX = Math.max(maxX, X[i]); minZ = Math.min(minZ, Z[i]); maxZ = Math.max(maxZ, Z[i]); }
  const PAD = 450; minX -= PAD; maxX += PAD; minZ -= PAD; maxZ += PAD;
  // coarse height field (inverse-distance from the track), then fine detail near the track
  const CS = 50, cw = Math.ceil((maxX - minX) / CS) + 1, ch = Math.ceil((maxZ - minZ) / CS) + 1, coarse = new Float32Array(cw * ch);
  for (let gz = 0; gz < ch; gz++) for (let gx = 0; gx < cw; gx++) { const x = minX + gx * CS, z = minZ + gz * CS; let ws = 0, hs = 0; for (const i of samples) { const d2 = (X[i] - x) ** 2 + (Z[i] - z) ** 2 + 400; const w = 1 / (d2 * d2); ws += w; hs += w * Y[i]; } coarse[gz * cw + gx] = hs / ws; }
  const coarseAt = (x, z) => { const fx = (x - minX) / CS, fz = (z - minZ) / CS, ix = Math.min(cw - 2, Math.max(0, Math.floor(fx))), iz = Math.min(ch - 2, Math.max(0, Math.floor(fz))), tx = fx - ix, tz = fz - iz; const a = coarse[iz * cw + ix], b = coarse[iz * cw + ix + 1], c = coarse[(iz + 1) * cw + ix], d = coarse[(iz + 1) * cw + ix + 1]; return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz; };
  const nearInfo = (x, z) => { const n = tr.nearestGlobal(x, z, 3); return n.i < 0 ? { d: 999, y: coarseAt(x, z) } : { d: Math.sqrt(n.d2), y: Y[n.i] }; };
  const hills = (x, z) => Math.sin(x * 0.004) * 9 + Math.cos(z * 0.0033) * 11 + Math.sin((x + z) * 0.009) * 3;
  const corridor = wallOff + 3;
  const groundAt = (x, z) => { const { d, y } = nearInfo(x, z); const far = coarseAt(x, z) + hills(x, z), t = smoothstep(corridor, corridor + 160, d); return { h: (y - 0.3) * (1 - t) + far * t, d }; };
  {
    const STEP = 8, nx = Math.ceil((maxX - minX) / STEP), nz = Math.ceil((maxZ - minZ) / STEP);
    const g = new THREE.PlaneGeometry(nx * STEP, nz * STEP, nx, nz); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, uv = g.attributes.uv, col = [];
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) + (minX + maxX) / 2, z = pos.getZ(i) + (minZ + maxZ) / 2, { h } = groundAt(x, z); pos.setY(i, h); uv.setXY(i, x / 5, z / 5); const v = 0.88 + Math.sin(x * 0.03) * Math.cos(z * 0.025) * 0.08 + (Math.random() - 0.5) * 0.05; col.push(v * 0.97, v, v * 0.92); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: T.grass, normalMap: T.grassN, vertexColors: true, roughness: 1 }));
    m.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2); m.receiveShadow = true; group.add(m);
    // a big skirt beyond the terrain so the horizon isn't empty
    const skirt = new THREE.Mesh(new THREE.RingGeometry(Math.max(maxX - minX, maxZ - minZ) * 0.55, 9000, 64, 1), new THREE.MeshStandardMaterial({ color: 0x3E5A34, roughness: 1 }));
    skirt.rotation.x = -Math.PI / 2; skirt.position.set((minX + maxX) / 2, coarseAt((minX + maxX) / 2, (minZ + maxZ) / 2) - 6, (minZ + maxZ) / 2); group.add(skirt);
  }

  // ---------- trees (instanced firs) ----------
  {
    const mat = new THREE.MeshStandardMaterial({ map: T.needle, roughness: 0.95 }); T.needle.repeat.set(2, 2);
    const tiers = [0, 1, 2].map((t) => new THREE.InstancedMesh(new THREE.ConeGeometry(3.4 - t * 0.9, 4.2, 7, 1, true), mat, 7000));
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 4, 5, 1, true), new THREE.MeshStandardMaterial({ color: 0x4A3826, roughness: 1 }), 7000);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(), up = new THREE.Vector3(0, 1, 0); let n = 0;
    for (let k = 0; k < 60000 && n < 7000; k++) {
      const i = Math.floor(rnd() * N), side = rnd() < 0.5 ? -1 : 1, off = side * (corridor + 6 + rnd() ** 1.7 * 330);
      const x = X[i] + LX[i] * off, z = Z[i] + LZ[i] * off, { h, d } = groundAt(x, z); if (d < corridor + 5) continue;
      if (Math.hypot(x - X[0], z - Z[0]) < 220) continue; // keep the paddock area open
      const s = 0.8 + rnd() * 0.9; c.setHSL(0.28 + rnd() * 0.06, 0.25 + rnd() * 0.15, 0.36 + rnd() * 0.14);
      for (let t = 0; t < 3; t++) { q.setFromAxisAngle(up, rnd() * 6); m4.compose(new THREE.Vector3(x, h + (4 + t * 2.6) * s, z), q, new THREE.Vector3(s, s, s)); tiers[t].setMatrixAt(n, m4); tiers[t].setColorAt(n, c); }
      m4.compose(new THREE.Vector3(x, h + 2 * s, z), q, new THREE.Vector3(s, s, s)); trunks.setMatrixAt(n, m4); n++;
    }
    for (const t of tiers) { t.count = n; t.instanceColor.needsUpdate = true; group.add(t); }
    trunks.count = n; group.add(trunks);
  }

  // ---------- grandstands: along the main straight and at the two biggest corners ----------
  const stand = (i, side, len = 120, rows = 14) => {
    const g = new THREE.Group(), seatMat = new THREE.MeshStandardMaterial({ map: T.seats, roughness: 0.9 });
    for (let r = 0; r < rows; r++) { const step = new THREE.Mesh(new THREE.BoxGeometry(len, 0.8, 1.6), seatMat); step.position.set(0, r * 0.8 + 0.4, r * 1.6); g.add(step); }
    const back = new THREE.Mesh(new THREE.BoxGeometry(len, rows * 0.8 + 3, 0.4), new THREE.MeshStandardMaterial({ color: 0x2A2E36, roughness: 0.8 })); back.position.set(0, (rows * 0.8 + 3) / 2, rows * 1.6 + 0.3); g.add(back);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 2, 0.5, rows * 1.6 + 6), new THREE.MeshStandardMaterial({ color: 0xE3E6EA, metalness: 0.5, roughness: 0.35 })); roof.position.set(0, rows * 0.8 + 4, rows * 1.6 / 2 - 1); g.add(roof);
    for (const x of [-len / 2, 0, len / 2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, rows * 0.8 + 4, 0.5), roof.material); p.position.set(x, (rows * 0.8 + 4) / 2, -2); g.add(p); }
    const o = side * (wallOff + 8);
    g.position.set(X[i] + LX[i] * o, groundAt(X[i] + LX[i] * o, Z[i] + LZ[i] * o).h, Z[i] + LZ[i] * o);
    g.lookAt(X[i], g.position.y, Z[i]); g.rotateY(Math.PI); group.add(g);
  };
  stand(at(-120), -inside, 150, 16);
  const big = [...tr.corners].sort((a, b) => Math.abs(tr.K[b.i]) - Math.abs(tr.K[a.i])).slice(0, 2);
  for (const c of big) stand(at(c.i + 30), Math.sign(tr.K[c.i]) > 0 ? -1 : 1, 90, 12);

  // ---------- pit building with team garages (made-up teams), beside the main straight ----------
  {
    const teams = ["RACELIMIT", "AXIOM", "HALCYON", "VORTEX", "NOVA", "KESTREL GP", "MERIDIAN", "ORBIT", "TALON", "SOLSTICE"];
    const cols = ["#FFA51F", "#5AA9FF", "#C9B6FF", "#FF6B3A", "#7FE0B8", "#F5C518", "#E8EAF0", "#FF5A8A", "#9BDB4F", "#3FA0FF"];
    const len = 300, i0 = at(-40 - len), o = inside * (wallOff + 24);
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(len, 9, 16), new THREE.MeshStandardMaterial({ color: 0xE8EAEE, roughness: 0.6 })); body.position.set(0, 4.5, 0); g.add(body);
    for (let k = 0; k < 10; k++) {
      const x = -len / 2 + 20 + k * 36;
      const door = new THREE.Mesh(new THREE.PlaneGeometry(26, 5), new THREE.MeshStandardMaterial({ color: 0x16181D, roughness: 0.8 })); door.position.set(x, 2.6, -8.01); door.rotation.y = Math.PI; g.add(door);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(26, 1.6), new THREE.MeshBasicMaterial({ map: tex(canvas(512, 64, (cg, w, h) => { cg.fillStyle = "#16181D"; cg.fillRect(0, 0, w, h); cg.fillStyle = cols[k]; cg.fillRect(0, h - 6, w, 6); cg.fillStyle = "#F2F2F2"; cg.font = "700 40px BC"; cg.textAlign = "center"; cg.textBaseline = "middle"; cg.fillText(teams[k], w / 2, h / 2 - 2); })) })); sign.position.set(x, 6.4, -8.02); sign.rotation.y = Math.PI; g.add(sign);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 4, 0.6, 22), new THREE.MeshStandardMaterial({ color: 0xBFC4CB, metalness: 0.4, roughness: 0.4 })); roof.position.set(0, 9.3, -2); g.add(roof);
    // pit lane surface in front of the garages
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(len, 14), new THREE.MeshStandardMaterial({ map: T.asphalt, roughness: 0.9 })); lane.rotation.x = -Math.PI / 2; lane.position.set(0, 0.04, -15); g.add(lane);
    const mid = at(i0 + len / 2);
    g.position.set(X[mid] + LX[mid] * o, Y[mid] - 0.2, Z[mid] + LZ[mid] * o);
    // face the track: the garages' open side (-z) points at the track
    g.lookAt(X[mid], g.position.y, Z[mid]); g.rotateY(Math.PI);
    group.add(g);
  }

  // ---------- start gantry with the five lights ----------
  {
    const g = new THREE.Group(), w = half * 2 + 6, mat = new THREE.MeshStandardMaterial({ color: 0x1A1C22, metalness: 0.5, roughness: 0.4 });
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.5, 0.5), mat); p.position.set(s * w / 2, 3.75, 0); g.add(p); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 1.0, 0.6), mat); beam.position.set(0, 7.2, 0); g.add(beam);
    const lights = [];
    for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xFF1A1A, emissiveIntensity: 0 })); l.position.set(-1.2 + k * 0.6, 7.2, -0.31); l.rotation.y = Math.PI; g.add(l); lights.push(l); }
    g.position.set(X[at(8)], Y[at(8)], Z[at(8)]); g.rotation.y = Math.atan2(TX[0], TZ[0]); group.add(g);
    group.userData.startLights = lights;
  }

  // ---------- brake boards (150 / 100 / 50 m) before the big stops ----------
  if (profile) {
    const boardMat = (n) => new THREE.MeshStandardMaterial({ map: tex(canvas(160, 200, (g) => { g.fillStyle = "#F2F2F2"; g.fillRect(0, 0, 160, 200); g.fillStyle = "#16181C"; g.font = "700 96px BC"; g.textAlign = "center"; g.fillText(String(n), 80, 140); })), roughness: 0.6 });
    const mats = { 150: boardMat(150), 100: boardMat(100), 50: boardMat(50) };
    for (let i = 0; i < N; i++) {
      const v0 = profile[i], v1 = profile[at(i + 1)];
      if (v0 > 70 && v1 < v0 - 0.02 && profile[at(i - 1)] <= v0 + 0.001) {
        let j = i; while (profile[at(j + 1)] < profile[at(j)] && j - i < 600) j++;
        if (v0 - profile[at(j)] < 25) continue;
        const side = Math.sign(tr.K[at(j)]) > 0 ? -1 : 1; // on the outside of the corner
        for (const d of [150, 100, 50]) { const k = at(i + Math.max(0, (j - i) - d)), b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.08), mats[d]); const o = side * (half + 2.2); b.position.set(X[k] + LX[k] * o, Y[k] + 1.1, Z[k] + LZ[k] * o); b.rotation.y = Math.atan2(TX[k], TZ[k]) + Math.PI; group.add(b); }
        i = j;
      }
    }
  }
  return { group, groundAt, inside };
}

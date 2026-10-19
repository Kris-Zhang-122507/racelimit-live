// Builds the 3D circuit from the track data: asphalt, white lines, kerbs, run-off, barriers
// (Tecpro blocks that get pushed back when you hit them, armco, the pit wall), catch fencing,
// terrain that follows the track's height, trees, grandstands, the pit lane and garages, the
// start gantry and brake boards. Everything is generated, nothing is downloaded.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

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
  // one row of a grandstand seen from the track: seats, and people in them (about 2/3 full)
  const crowd = tex(canvas(1024, 64, (g, w, h) => {
    g.fillStyle = "#3A3F4A"; g.fillRect(0, 0, w, h);
    const shirts = ["#C8102E", "#F2F2F2", "#1F4E9A", "#F5C518", "#FF8000", "#2E7D32", "#16171B", "#8E9AAF", "#E0457B", "#27F4D2"], skin = ["#F1C9A5", "#D9A27E", "#A86F4C", "#6B4430", "#E8B994"];
    for (let x = 0; x < w; x += 12.8) {
      g.fillStyle = ["#2F5BA8", "#C93030", "#E8E8E8"][Math.floor(x / 256) % 3]; g.fillRect(x + 1, 30, 11, 30); // seat back
      if (Math.random() < 0.68) { const sx = x + 2 + Math.random() * 2; g.fillStyle = shirts[Math.floor(Math.random() * shirts.length)]; g.fillRect(sx, 22 + Math.random() * 4, 9, 34); g.fillStyle = skin[Math.floor(Math.random() * skin.length)]; g.beginPath(); g.arc(sx + 4.5, 16 + Math.random() * 3, 4.5, 0, 7); g.fill(); if (Math.random() < 0.3) { g.fillStyle = shirts[Math.floor(Math.random() * shirts.length)]; g.fillRect(sx, 9 + Math.random() * 3, 9, 4); } }
    }
    g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, 58, w, 6);
  }));
  const concrete = tex(canvas(128, 128, (g, w, h) => { const img = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 168 + (Math.random() - 0.5) * 22; img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v + 3; img.data[i * 4 + 3] = 255; } g.putImageData(img, 0, 0); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 0, 2, h); }));
  const checker = tex(canvas(64, 16, (g) => { for (let x = 0; x < 64; x += 8) for (let y = 0; y < 16; y += 8) { g.fillStyle = (x + y) / 8 % 2 ? "#111" : "#F2F2F2"; g.fillRect(x, y, 8, 8); } }));
  return { asphalt, asphaltN, kerb, grass, grassN, runoff, fence, needle, crowd, concrete, checker };
}

export function buildCircuit(tr, scene, { profile } = {}) {
  const T = textures(), { N, X, Y, Z, LX, LZ, TX, TZ, dist, kerb } = tr, half = tr.half;
  const at = tr.wrap, W = tr.wall, WT = tr.wallType, pit = tr.pit;
  const sideK = (s) => (s > 0 ? 0 : 1); // +1 = left → wall[0], −1 = right → wall[1]
  const group = new THREE.Group(); scene.add(group);
  const keepOut = []; // rectangles (centre, half-sizes, angle) where nothing else may go: pits, stands

  // a strip along the track with a cross-section [[offset, height], …] from index a to b;
  // `prof` can also be a function of the track index
  function strip(a, b, prof, mat, { vScale = 10, uScale = 1 } = {}) {
    const P0 = typeof prof === "function" ? prof(at(a)) : prof, M = P0.length, pos = [], uv = [], idx = [];
    for (let k = 0; k <= b - a; k++) {
      const i = at(a + k), d = dist[i] + (a + k >= N ? tr.len : 0) - (a + k < 0 ? tr.len : 0), pr = typeof prof === "function" ? prof(i) : prof;
      for (let m = 0; m < M; m++) { const [o, h] = pr[m]; pos.push(X[i] + LX[i] * o, Y[i] + h, Z[i] + LZ[i] * o); uv.push((m / (M - 1)) * uScale, d / vScale); }
      if (k < b - a) for (let m = 0; m < M - 1; m++) { const o = k * M + m; idx.push(o, o + M, o + 1, o + 1, o + M, o + M + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; group.add(m); return m;
  }
  // runs of the lap where `test(i)` holds, as [start, end] index pairs (end may pass N)
  function runs(test, minLen = 1) {
    const out = []; let s = -1;
    let start = 0; while (start < N && test(start)) start++;
    for (let k = start; k < start + N; k++) { const ok = test(at(k)); if (ok && s < 0) s = k; if ((!ok || k === start + N - 1) && s >= 0) { if (k - s >= minLen) out.push([s, k]); s = -1; } }
    if (start === N) out.push([0, N]);
    return out;
  }
  // mirror a profile for the right-hand side so triangles face up
  const sided = (s, pts) => (s > 0 ? pts : pts.map(([o, h]) => [-o, h]).reverse());

  // ---------- asphalt, lines, start line, grid ----------
  const asphaltMat = new THREE.MeshStandardMaterial({ map: T.asphalt, normalMap: T.asphaltN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.9 });
  strip(0, N, [[-half - 0.6, 0.0], [-half / 2, 0.035], [0, 0.05], [half / 2, 0.035], [half + 0.6, 0.0]], asphaltMat, { vScale: 6 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xF2F2EE, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  strip(0, N, [[half - 0.32, 0.012], [half - 0.12, 0.012]], lineMat); strip(0, N, [[-half + 0.12, 0.012], [-half + 0.32, 0.012]], lineMat);
  {
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, 1.0), new THREE.MeshStandardMaterial({ map: T.checker, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
    T.checker.repeat.set(half * 2 / 2, 0.25);
    sl.position.set(X[0], Y[0] + 0.06, Z[0]); sl.rotation.set(-Math.PI / 2, 0, Math.atan2(TX[0], TZ[0])); group.add(sl);
    const box = new THREE.MeshStandardMaterial({ color: 0xEDEDED, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
    for (let p = 0; p < 20; p++) { const i = at(-14 - p * 8), o = (p % 2 ? -1 : 1) * half * 0.45; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.18), box); m.rotation.set(-Math.PI / 2, 0, Math.atan2(TX[i], TZ[i])); m.position.set(X[i] + LX[i] * o, Y[i] + 0.055, Z[i] + LZ[i] * o); group.add(m); }
  }

  // ---------- kerbs ----------
  const kerbMat = new THREE.MeshStandardMaterial({ map: T.kerb, roughness: 0.55 });
  const kerbProf = (side) => { const pts = []; for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push([side * (half - 0.05 + u * 1.55), 0.008 + 0.07 * Math.sin(Math.min(1, u * 1.15) * Math.PI / 2) ** 0.8 - (u > 0.9 ? (u - 0.9) * 0.6 : 0)]); } return side > 0 ? pts : pts.reverse(); };
  for (const [a, b] of runs((i) => kerb[i] !== 0, 10)) { strip(a, b, kerbProf(1), kerbMat, { vScale: 6 }); strip(a, b, kerbProf(-1), kerbMat, { vScale: 6 }); }

  // ---------- run-off up to the barrier: painted asphalt in the corners, grass on the straights ----------
  const runMat = new THREE.MeshStandardMaterial({ map: T.runoff, roughness: 0.92 });
  const grassMat = new THREE.MeshStandardMaterial({ map: T.grass, normalMap: T.grassN, roughness: 1 });
  for (const s of [1, -1]) {
    const k = sideK(s), prof = (i) => sided(s, [[half + 0.6, -0.005], [W[k][i] + 0.6, -0.03]]);
    for (const [a, b] of runs((i) => WT[k][i] !== 0, 2)) strip(a, b, prof, runMat, { vScale: 12 });
    for (const [a, b] of runs((i) => WT[k][i] === 0, 2)) strip(a, b, prof, grassMat, { vScale: 8, uScale: 3 });
  }

  // ---------- barriers ----------
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  // Tecpro: rounded plastic blocks strapped together, two rows deep, alternating colours
  // blocks are grouped into short sections (one instanced mesh each) so only the sections in view get drawn
  const tec = { blocks: [], chunks: [], active: new Set() };
  {
    const blockG = new RoundedBoxGeometry(1.46, 1.02, 0.78, 1, 0.12);
    const strapG = (() => { const parts = [new THREE.BoxGeometry(1.48, 0.07, 0.8), new THREE.BoxGeometry(1.48, 0.07, 0.8)]; parts[0].translate(0, 0.28, 0); parts[1].translate(0, -0.22, 0); const g = new THREE.BufferGeometry(); const pos = [], nor = [], idx = []; let base = 0; for (const p of parts) { pos.push(...p.attributes.position.array); nor.push(...p.attributes.normal.array); for (const v of p.index.array) idx.push(v + base); base += p.attributes.position.count; } g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g; })();
    const MAX = 12000, blockM = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.0 }), strapM = new THREE.MeshStandardMaterial({ color: 0x1A1B1F, roughness: 0.8 });
    const palette = [0xEDEFF2, 0x1F4FB4, 0xEDEFF2, 0xC8202A];
    for (const s of [1, -1]) {
      const k = sideK(s);
      for (const [a, b] of runs((i) => WT[k][i] === 1, 2)) {
        // space the blocks along the barrier itself (on the outside of a hairpin it is much longer than the centre line)
        let lx = Infinity, lz = Infinity;
        for (let kk = a; kk < b; kk++) {
          const i = at(kk), d = dist[i] + (kk >= N ? tr.len : 0), ox = X[i] + LX[i] * s * W[k][i], oz = Z[i] + LZ[i] * s * W[k][i];
          if ((ox - lx) ** 2 + (oz - lz) ** 2 < 1.47 * 1.47) continue; lx = ox; lz = oz;
          // a second row on the outside of the corners, where cars actually go off
          const outside = (k === 1 && tr.K[i] > 0.002) || (k === 0 && tr.K[i] < -0.002);
          for (const row of outside ? [0, 1] : [0]) {
            if (tec.blocks.length >= MAX) break;
            const o = s * (W[k][i] + 0.4 + row * 0.82);
            const pos = new THREE.Vector3(X[i] + LX[i] * o, Y[i] + 0.51, Z[i] + LZ[i] * o), rot = new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(TX[i], TZ[i]) + Math.PI / 2);
            tec.blocks.push({ i, k, d, row, base: pos.clone(), rot: rot.clone(), off: new THREE.Vector3(), vel: new THREE.Vector3(), spin: 0, yaw: 0, tilt: 0, tiltV: 0, out: new THREE.Vector3(LX[i] * s, 0, LZ[i] * s), color: palette[Math.floor(d / 1.5 + row) % palette.length] });
          }
        }
      }
    }
    const byChunk = new Map();
    tec.blocks.forEach((b, n) => { const key = b.k * 1000 + Math.floor(b.d / 120); if (!byChunk.has(key)) byChunk.set(key, []); byChunk.get(key).push(n); });
    for (const list of byChunk.values()) {
      const mesh = new THREE.InstancedMesh(blockG, blockM, list.length), straps = new THREE.InstancedMesh(strapG, strapM, list.length), ch = { mesh, straps, dirty: false };
      list.forEach((n, j) => { const b = tec.blocks[n]; b.chunk = ch; b.slot = j; m4.compose(b.base, b.rot, new THREE.Vector3(1, 1, 1)); mesh.setMatrixAt(j, m4); straps.setMatrixAt(j, m4); mesh.setColorAt(j, col.set(b.color)); });
      mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); straps.computeBoundingSphere(); mesh.boundingSphere.radius += 4; straps.boundingSphere.radius += 4;
      mesh.receiveShadow = true; group.add(mesh, straps); tec.chunks.push(ch);
    }
    // concrete wall behind the blocks
    const conc = new THREE.MeshStandardMaterial({ map: T.concrete, roughness: 0.85, side: THREE.DoubleSide });
    for (const s of [1, -1]) { const k = sideK(s); for (const [a, b] of runs((i) => WT[k][i] === 1, 2)) strip(a, b, (i) => sided(s, [[W[k][i] + 1.75, 0], [W[k][i] + 1.75, 1.2], [W[k][i] + 2.05, 1.2]]), conc, { vScale: 4 }); }
  }
  // armco: two rails on posts
  {
    const armMat = new THREE.MeshStandardMaterial({ color: 0xC9CED4, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide });
    const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), new THREE.MeshStandardMaterial({ color: 0x8A9098, metalness: 0.6, roughness: 0.5 }), 6000); let np = 0;
    for (const s of [1, -1]) {
      const k = sideK(s);
      for (const [a, b] of runs((i) => WT[k][i] === 0, 2)) {
        for (const yy of [0.42, 0.78]) strip(a, b, (i) => sided(s, [[W[k][i], yy], [W[k][i], yy + 0.3]]).map((p) => p), armMat, { vScale: 4 });
        for (let kk = a; kk < b; kk += 4) { const i = at(kk), o = s * (W[k][i] + 0.12); m4.makeTranslation(X[i] + LX[i] * o, Y[i] + 0.45, Z[i] + LZ[i] * o); if (np < 6000) posts.setMatrixAt(np++, m4); }
      }
    }
    posts.count = np; group.add(posts);
  }
  // catch fence behind every barrier (the pit wall has its own)
  {
    const fenceMat = new THREE.MeshStandardMaterial({ map: T.fence, alphaTest: 0.45, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 });
    const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 4.2, 4, 1, true), new THREE.MeshStandardMaterial({ color: 0x8A9098, metalness: 0.8, roughness: 0.35 }), 6000); let np = 0;
    const fo = (k, i) => W[k][i] + (WT[k][i] === 1 ? 2.0 : 1.6);
    for (const s of [1, -1]) {
      const k = sideK(s);
      for (const [a, b] of runs((i) => WT[k][i] !== 2, 2)) {
        strip(a, b, (i) => sided(s, [[fo(k, i), 0], [fo(k, i), 4.0]]), fenceMat, { vScale: 3, uScale: 1.3 });
        for (let kk = a; kk < b; kk += 6) { const i = at(kk), o = s * fo(k, i); m4.makeTranslation(X[i] + LX[i] * o, Y[i] + 2.1, Z[i] + LZ[i] * o); if (np < 6000) posts.setMatrixAt(np++, m4); }
      }
    }
    posts.count = np; group.add(posts);
  }

  // ---------- pit lane, pit wall and garages ----------
  if (pit) {
    const s = pit.side, k = pit.k, from = pit.from, to = pit.to;
    const conc = new THREE.MeshStandardMaterial({ map: T.concrete, roughness: 0.85, side: THREE.DoubleSide });
    // pit wall with a tall debris fence
    strip(from, to, (i) => sided(s, [[pit.wallOff, 0], [pit.wallOff, 1.1], [pit.wallOff + 0.45, 1.1], [pit.wallOff + 0.45, 0]]), conc, { vScale: 4 });
    const pf = new THREE.MeshStandardMaterial({ map: T.fence, alphaTest: 0.45, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 });
    strip(from, to, sided(s, [[pit.wallOff + 0.2, 1.1], [pit.wallOff + 0.2, 4.2]]), pf, { vScale: 3, uScale: 0.8 });
    // the lane itself, pointed at each end where it joins the track
    const laneW = (i) => { const d = ((dist[i] - dist[at(from)] + tr.len) % tr.len), len = to - from; return smoothstep(0, 70, d) * smoothstep(0, 70, len - d); };
    strip(from, to, (i) => sided(s, [[pit.wallOff + 0.45, 0.0], [pit.wallOff + 0.45 + (pit.laneOut - pit.wallOff) * Math.max(0.05, laneW(i)), 0.0]]), asphaltMat, { vScale: 6 });
    strip(from + 70, to - 70, sided(s, [[pit.laneOut - 6.2, 0.012], [pit.laneOut - 6.0, 0.012]]), lineMat); // fast lane / working lane line
    // garages: a long two-storey building following the straight, ten made-up teams
    const teams = ["RACELIMIT", "AXIOM", "HALCYON", "VORTEX", "NOVA", "KESTREL GP", "MERIDIAN", "ORBIT", "TALON", "SOLSTICE"];
    const cols = ["#FFA51F", "#5AA9FF", "#C9B6FF", "#FF6B3A", "#7FE0B8", "#F5C518", "#E8EAF0", "#FF5A8A", "#9BDB4F", "#3FA0FF"];
    const [g0, g1] = pit.garages, segLen = (g1 - g0) / 10, depth = 18;
    const wallM = new THREE.MeshStandardMaterial({ color: 0xE8EAEE, roughness: 0.6 }), glassM = new THREE.MeshStandardMaterial({ color: 0x223044, metalness: 0.4, roughness: 0.15 }), doorM = new THREE.MeshStandardMaterial({ color: 0x15171C, roughness: 0.8 }), roofM = new THREE.MeshStandardMaterial({ color: 0xBFC4CB, metalness: 0.4, roughness: 0.4 });
    for (let t = 0; t < 10; t++) {
      const i = at(Math.round(g0 + (t + 0.5) * segLen)), o = s * (pit.laneOut + depth / 2);
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.2, 11, depth), wallM); body.position.y = 5.5; g.add(body);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(segLen - 4, 5), doorM); door.position.set(0, 2.6, depth / 2 + 0.01); g.add(door);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(segLen, 2.6), glassM); glass.position.set(0, 8.2, depth / 2 + 0.02); g.add(glass);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(segLen - 4, 1.4), new THREE.MeshBasicMaterial({ map: tex(canvas(512, 64, (cg, w, h) => { cg.fillStyle = "#16181D"; cg.fillRect(0, 0, w, h); cg.fillStyle = cols[t]; cg.fillRect(0, h - 6, w, 6); cg.fillStyle = "#F2F2F2"; cg.font = "700 40px BC, sans-serif"; cg.textAlign = "center"; cg.textBaseline = "middle"; cg.fillText(teams[t], w / 2, h / 2 - 2); })) }));
      sign.position.set(0, 5.9, depth / 2 + 0.03); g.add(sign);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.4, 0.5, depth + 6), roofM); roof.position.set(0, 11.2, 2); g.add(roof);
      g.position.set(X[i] + LX[i] * o, Y[i], Z[i] + LZ[i] * o);
      g.lookAt(X[i], Y[i], Z[i]); // +z of the group (the doors) faces the track
      g.traverse((m) => { if (m.isMesh) { m.castShadow = m !== sign; m.receiveShadow = true; } });
      group.add(g);
    }
    const mid = at(Math.round((g0 + g1) / 2));
    keepOut.push({ x: X[mid] + LX[mid] * s * (pit.laneOut + depth / 2), z: Z[mid] + LZ[mid] * s * (pit.laneOut + depth / 2), hl: (g1 - g0) / 2 + 30, hw: depth / 2 + 20, ang: Math.atan2(TX[mid], TZ[mid]) });
  }

  // ---------- terrain: follows the track, rolling away from it ----------
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < N; i += 10) { minX = Math.min(minX, X[i]); maxX = Math.max(maxX, X[i]); minZ = Math.min(minZ, Z[i]); maxZ = Math.max(maxZ, Z[i]); }
  const PAD = 450; minX -= PAD; maxX += PAD; minZ -= PAD; maxZ += PAD;
  const samples = []; for (let i = 0; i < N; i += 25) samples.push(i);
  const CS = 50, cw = Math.ceil((maxX - minX) / CS) + 1, ch = Math.ceil((maxZ - minZ) / CS) + 1, coarse = new Float32Array(cw * ch);
  for (let gz = 0; gz < ch; gz++) for (let gx = 0; gx < cw; gx++) { const x = minX + gx * CS, z = minZ + gz * CS; let ws = 0, hs = 0; for (const i of samples) { const d2 = (X[i] - x) ** 2 + (Z[i] - z) ** 2 + 400; const w = 1 / (d2 * d2); ws += w; hs += w * Y[i]; } coarse[gz * cw + gx] = hs / ws; }
  const coarseAt = (x, z) => { const fx = (x - minX) / CS, fz = (z - minZ) / CS, ix = Math.min(cw - 2, Math.max(0, Math.floor(fx))), iz = Math.min(ch - 2, Math.max(0, Math.floor(fz))), tx = fx - ix, tz = fz - iz; const a = coarse[iz * cw + ix], b = coarse[iz * cw + ix + 1], c = coarse[(iz + 1) * cw + ix], d = coarse[(iz + 1) * cw + ix + 1]; return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz; };
  const hills = (x, z) => Math.sin(x * 0.004) * 9 + Math.cos(z * 0.0033) * 11 + Math.sin((x + z) * 0.009) * 3;
  // the ground right by the track sits just under it (out to the barrier, or the garages by the pits);
  // further out it blends between nearby parts of the track, then into rolling hills
  const groundAt = (x, z) => {
    const n = tr.nearestGlobal(x, z, 3);
    if (n.i < 0) return { h: coarseAt(x, z) + hills(x, z), d: 999 };
    const i = n.i, d = Math.sqrt(n.d2), lat = (x - X[i]) * LX[i] + (z - Z[i]) * LZ[i], k = lat >= 0 ? 0 : 1;
    let flat = W[k][i] + 3; if (pit && k === pit.k && WT[k][i] === 2) flat = pit.laneOut + 26;
    const far = coarseAt(x, z) + hills(x, z), t = smoothstep(flat, flat + 160, d);
    return { h: (Y[i] - 0.3) * (1 - t) + far * t, d, flat };
  };
  {
    const STEP = 8, nx = Math.ceil((maxX - minX) / STEP), nz = Math.ceil((maxZ - minZ) / STEP);
    const g = new THREE.PlaneGeometry(nx * STEP, nz * STEP, nx, nz); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, uv = g.attributes.uv, colA = [];
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) + (minX + maxX) / 2, z = pos.getZ(i) + (minZ + maxZ) / 2, { h } = groundAt(x, z); pos.setY(i, h); uv.setXY(i, x / 5, z / 5); const v = 0.88 + Math.sin(x * 0.03) * Math.cos(z * 0.025) * 0.08 + (Math.random() - 0.5) * 0.05; colA.push(v * 0.97, v, v * 0.92); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: T.grass, normalMap: T.grassN, vertexColors: true, roughness: 1 }));
    m.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2); m.receiveShadow = true; group.add(m);
    const skirt = new THREE.Mesh(new THREE.RingGeometry(Math.max(maxX - minX, maxZ - minZ) * 0.55, 9000, 64, 1), new THREE.MeshStandardMaterial({ color: 0x3E5A34, roughness: 1 }));
    skirt.rotation.x = -Math.PI / 2; skirt.position.set((minX + maxX) / 2, coarseAt((minX + maxX) / 2, (minZ + maxZ) / 2) - 6, (minZ + maxZ) / 2); group.add(skirt);
  }

  // ---------- grandstands: only where the whole stand is clear of the track and the pits ----------
  const inPits = (x, z, pad) => { if (!pit) return false; const n = tr.nearestGlobal(x, z, 3); if (n.i < 0) return false; const i = n.i, lat = (x - X[i]) * LX[i] + (z - Z[i]) * LZ[i]; return Math.sign(lat) === pit.side && WT[pit.k][i] === 2 && Math.abs(lat) < pit.laneOut + 18 + pad; };
  const inKeepOut = (x, z, pad = 0) => inPits(x, z, pad) || keepOut.some((r) => { const dx = x - r.x, dz = z - r.z, c = Math.cos(r.ang), s2 = Math.sin(r.ang); const al = dx * s2 + dz * c, ac = dx * c - dz * s2; return Math.abs(al) < r.hl + pad && Math.abs(ac) < r.hw + pad; });
  const clearOfTrack = (x, z, margin) => { const n = tr.nearestGlobal(x, z, 3); if (n.i < 0) return true; const i = n.i, lat = (x - X[i]) * LX[i] + (z - Z[i]) * LZ[i], k = lat >= 0 ? 0 : 1; return Math.sqrt(n.d2) > W[k][i] + margin; };
  function makeStand(len, rows) {
    const g = new THREE.Group(), rise = 0.45, run = 0.85, H = rows * rise, D = rows * run;
    const ct = T.crowd.clone(); ct.needsUpdate = true; ct.repeat.set(len / 40, rows);
    const slopeLen = Math.hypot(H, D), face = new THREE.Mesh(new THREE.PlaneGeometry(len, slopeLen), new THREE.MeshStandardMaterial({ map: ct, roughness: 0.9 }));
    face.position.set(0, 1 + H / 2, D / 2); face.rotation.set(Math.atan2(D, H), Math.PI, 0); g.add(face); // slopes up and back, facing the track
    const shell = new THREE.MeshStandardMaterial({ color: 0x2A2E36, roughness: 0.8 });
    const front = new THREE.Mesh(new THREE.BoxGeometry(len, 1, 0.3), new THREE.MeshStandardMaterial({ map: T.concrete, roughness: 0.85 })); front.position.set(0, 0.5, 0); g.add(front);
    const back = new THREE.Mesh(new THREE.BoxGeometry(len, H + 4, 0.4), shell); back.position.set(0, (H + 4) / 2, D + 0.3); g.add(back);
    const sideShape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(D, 0), new THREE.Vector2(D, H + 1), new THREE.Vector2(0, 1)]);
    for (const sx of [-1, 1]) { const sw = new THREE.Mesh(new THREE.ExtrudeGeometry(sideShape, { depth: 0.3, bevelEnabled: false }), shell); sw.rotation.y = -Math.PI / 2; sw.position.set(sx * len / 2 + (sx > 0 ? 0.3 : 0), 0, 0); g.add(sw); }
    const roofM = new THREE.MeshStandardMaterial({ color: 0xE3E6EA, metalness: 0.5, roughness: 0.35 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 2, 0.4, D + 4), roofM); roof.position.set(0, H + 5, D / 2 - 1); g.add(roof);
    for (let x = -len / 2; x <= len / 2 + 0.1; x += len / Math.max(1, Math.round(len / 40))) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, H + 5, 0.4), roofM); p.position.set(x, (H + 5) / 2, D + 0.1); g.add(p); }
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return { g, D };
  }
  function tryStand(i, s, len, rows) {
    const k = sideK(s), D = rows * 0.85, ang = Math.atan2(TX[i], TZ[i]);
    for (const extra of [6, 14, 26, 40]) {
      const o = W[k][i] + extra, cx = X[i] + LX[i] * s * (o + D / 2), cz = Z[i] + LZ[i] * s * (o + D / 2);
      let ok = true;
      for (let a = -0.5; a <= 0.5 && ok; a += 0.05) for (const b of [-0.5, 0, 0.5]) { const px = cx + TX[i] * a * len + LX[i] * s * b * D, pz = cz + TZ[i] * a * len + LZ[i] * s * b * D; if (!clearOfTrack(px, pz, 4) || inKeepOut(px, pz, 4)) { ok = false; break; } }
      if (!ok) continue;
      const { g } = makeStand(len, rows), fx = X[i] + LX[i] * s * o, fz = Z[i] + LZ[i] * s * o;
      g.position.set(fx, groundAt(fx, fz).h + 0.25, fz);
      g.lookAt(fx - LX[i] * s, g.position.y, fz - LZ[i] * s); g.rotateY(Math.PI); // the open front faces the track
      group.add(g);
      keepOut.push({ x: cx, z: cz, hl: len / 2 + 4, hw: D / 2 + 6, ang });
      return true;
    }
    return false;
  }
  {
    const opp = pit ? -pit.side : -1;
    tryStand(at(-150), opp, 150, 20); // opposite the pits
    const corners = [...tr.corners].sort((a, b) => Math.abs(tr.K[b.i]) - Math.abs(tr.K[a.i]));
    let placed = 0;
    for (const c of corners) { if (placed >= 4) break; const outside = tr.K[c.i] > 0 ? -1 : 1; if (tryStand(c.i, outside, 90, 14) || tryStand(at(c.i - 60), outside, 80, 12)) placed++; }
  }

  // ---------- trees (instanced firs), kept away from the track, pits and stands ----------
  {
    const mat = new THREE.MeshStandardMaterial({ map: T.needle, roughness: 0.95 }); T.needle.repeat.set(2, 2);
    const tierG = [0, 1, 2].map((t) => new THREE.ConeGeometry(3.4 - t * 0.9, 4.2, 7, 1, true)), trunkG = new THREE.CylinderGeometry(0.25, 0.4, 4, 5, 1, true), trunkM = new THREE.MeshStandardMaterial({ color: 0x4A3826, roughness: 1 });
    const trees = []; const c = new THREE.Color(); let n = 0;
    for (let kk = 0; kk < 60000 && n < 7000; kk++) {
      const i = Math.floor(rnd() * N), s = rnd() < 0.5 ? -1 : 1, off = s * (W[sideK(s)][i] + 9 + rnd() ** 1.7 * 330);
      const x = X[i] + LX[i] * off, z = Z[i] + LZ[i] * off, gd = groundAt(x, z); if (gd.d < (gd.flat ?? 0) + 5 || inKeepOut(x, z, 8) || !clearOfTrack(x, z, 6)) continue;
      const sc = 0.8 + rnd() * 0.9; c.setHSL(0.28 + rnd() * 0.06, 0.25 + rnd() * 0.15, 0.36 + rnd() * 0.14);
      trees.push({ x, z, h: gd.h, sc, col: c.getHex(), yaw: rnd() * 6 }); n++;
    }
    const cells = new Map(); for (const t of trees) { const key = Math.floor(t.x / 300) * 10007 + Math.floor(t.z / 300); if (!cells.has(key)) cells.set(key, []); cells.get(key).push(t); }
    for (const list of cells.values()) {
      const tiers = tierG.map((g) => new THREE.InstancedMesh(g, mat, list.length)), trunks = new THREE.InstancedMesh(trunkG, trunkM, list.length);
      list.forEach((t, j) => { for (let k = 0; k < 3; k++) { q.setFromAxisAngle(up, t.yaw + k); m4.compose(new THREE.Vector3(t.x, t.h + (4 + k * 2.6) * t.sc, t.z), q, new THREE.Vector3(t.sc, t.sc, t.sc)); tiers[k].setMatrixAt(j, m4); tiers[k].setColorAt(j, c.setHex(t.col)); } m4.compose(new THREE.Vector3(t.x, t.h + 2 * t.sc, t.z), q, new THREE.Vector3(t.sc, t.sc, t.sc)); trunks.setMatrixAt(j, m4); });
      for (const m of [...tiers, trunks]) { if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); m.boundingSphere.radius += 8; group.add(m); }
    }
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
    const boardMat = (n) => new THREE.MeshStandardMaterial({ map: tex(canvas(160, 200, (g) => { g.fillStyle = "#F2F2F2"; g.fillRect(0, 0, 160, 200); g.fillStyle = "#16181C"; g.font = "700 96px BC, sans-serif"; g.textAlign = "center"; g.fillText(String(n), 80, 140); })), roughness: 0.6 });
    const mats = { 150: boardMat(150), 100: boardMat(100), 50: boardMat(50) };
    for (let i = 0; i < N; i++) {
      const v0 = profile[i], v1 = profile[at(i + 1)];
      if (v0 > 70 && v1 < v0 - 0.02 && profile[at(i - 1)] <= v0 + 0.001) {
        let j = i; while (profile[at(j + 1)] < profile[at(j)] && j - i < 600) j++;
        if (v0 - profile[at(j)] < 25) continue;
        const s = Math.sign(tr.K[at(j)]) > 0 ? -1 : 1;
        for (const d of [150, 100, 50]) { const kk = at(i + Math.max(0, (j - i) - d)), b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.08), mats[d]); const o = s * (half + 2.2); b.position.set(X[kk] + LX[kk] * o, Y[kk] + 1.1, Z[kk] + LZ[kk] * o); b.rotation.y = Math.atan2(TX[kk], TZ[kk]) + Math.PI; group.add(b); }
        i = j;
      }
    }
  }

  // ---------- Tecpro reacting to hits: blocks near the impact slide back, twist, and the hardest hits
  // knock one loose. They stay where they end up (like the real thing) until the session restarts. ----------
  const barriers = {
    hit(h) {
      if (!h || !h.soft || h.speed < 1.5) return;
      const d0 = dist[h.idx], reach = 3 + Math.min(6, h.speed * 0.25);
      for (let n = 0; n < tec.blocks.length; n++) {
        const b = tec.blocks[n]; if (b.k !== h.side) continue;
        let dd = b.d - d0; if (dd > tr.len / 2) dd -= tr.len; if (dd < -tr.len / 2) dd += tr.len;
        if (Math.abs(dd) > reach) continue;
        const f = Math.exp(-((dd / (reach * 0.55)) ** 2)) * (b.row ? 0.7 : 1), push = Math.min(6, h.speed * 0.13 * f);
        b.vel.addScaledVector(b.out, push); b.vel.addScaledVector(new THREE.Vector3(TX[b.i], 0, TZ[b.i]), Math.sign(h.along || 0) * push * 0.2);
        b.spin += (Math.random() - 0.5) * push * 0.25 + dd * 0.012 * push;
        if (h.speed > 30 && f > 0.8 && b.row === 0) { b.vel.y += Math.min(3, h.speed * 0.05); b.tiltV += (Math.random() - 0.5) * 2.5; }
        tec.active.add(n);
      }
    },
    update(dt) {
      if (!tec.active.size) return;
      const e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3(), rot = new THREE.Quaternion();
      for (const n of tec.active) {
        const b = tec.blocks[n];
        b.off.addScaledVector(b.vel, dt); b.yaw += b.spin * dt; b.tilt += b.tiltV * dt;
        if (b.off.y > 0) b.vel.y -= 9.81 * dt; else { b.off.y = 0; if (b.vel.y < 0) b.vel.y = 0; b.tiltV *= 0.5; }
        const fr = b.off.y > 0 ? 0.2 : 9; // sliding friction on the ground
        const hv = Math.hypot(b.vel.x, b.vel.z), dv = Math.min(hv, fr * dt * 1.6); if (hv > 1e-4) { b.vel.x -= (b.vel.x / hv) * dv; b.vel.z -= (b.vel.z / hv) * dv; }
        b.spin *= Math.max(0, 1 - dt * 4); b.tiltV *= Math.max(0, 1 - dt * 2);
        // the wall behind stops the back row; blocks can't sink into it
        const outD = b.off.x * b.out.x + b.off.z * b.out.z, lim = b.row ? 0.45 : 1.2;
        if (outD > lim) { b.off.addScaledVector(b.out, lim - outD); const vo = b.vel.x * b.out.x + b.vel.z * b.out.z; if (vo > 0) b.vel.addScaledVector(b.out, -vo); }
        // and they can't slide more than a couple of metres along the barrier
        const tx = TX[b.i], tz = TZ[b.i], alongD = b.off.x * tx + b.off.z * tz; if (Math.abs(alongD) > 2) { b.off.x -= tx * (alongD - Math.sign(alongD) * 2); b.off.z -= tz * (alongD - Math.sign(alongD) * 2); b.vel.x *= 0.3; b.vel.z *= 0.3; }
        pos.copy(b.base).add(b.off); rot.copy(b.rot).multiply(new THREE.Quaternion().setFromEuler(e.set(b.tilt, b.yaw, 0)));
        m4.compose(pos, rot, sc); b.chunk.mesh.setMatrixAt(b.slot, m4); b.chunk.straps.setMatrixAt(b.slot, m4); b.chunk.dirty = true;
        if (Math.hypot(b.vel.x, b.vel.y, b.vel.z) < 0.02 && Math.abs(b.spin) < 0.01 && b.off.y <= 0 && Math.abs(b.tiltV) < 0.01) tec.active.delete(n);
      }
      for (const ch of tec.chunks) if (ch.dirty) { ch.mesh.instanceMatrix.needsUpdate = true; ch.straps.instanceMatrix.needsUpdate = true; ch.dirty = false; }
    },
    reset() {
      for (let n = 0; n < tec.blocks.length; n++) { const b = tec.blocks[n]; if (!b.off.lengthSq() && !b.yaw && !b.tilt) continue; b.off.set(0, 0, 0); b.vel.set(0, 0, 0); b.yaw = b.tilt = b.spin = b.tiltV = 0; m4.compose(b.base, b.rot, new THREE.Vector3(1, 1, 1)); b.chunk.mesh.setMatrixAt(b.slot, m4); b.chunk.straps.setMatrixAt(b.slot, m4); b.chunk.dirty = true; }
      tec.active.clear(); for (const ch of tec.chunks) if (ch.dirty) { ch.mesh.instanceMatrix.needsUpdate = true; ch.straps.instanceMatrix.needsUpdate = true; ch.dirty = false; }
    },
  };
  return { group, groundAt, barriers };
}

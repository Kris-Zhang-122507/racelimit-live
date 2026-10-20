// Builds the 3D circuit from the track data: asphalt, white lines, kerbs, run-off, barriers
// (Tecpro rows that squash and stay dented when you hit them, armco, the pit wall), catch fencing,
// terrain that follows the track's height, trees, grandstands, the pit lane and garages, the
// start gantry and brake boards. Everything is generated, nothing is downloaded.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { addProps } from "./trackprops.js?v=mvh86vc8";
import { prepareMap, buildMap } from "./trackworld.js?v=mvh86vc8";

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
  const runoff = tex(canvas(256, 256, (g, w, h) => { const img = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = (Math.random() - 0.5) * 16 + agg[i] * 22; img.data[i * 4] = 64 + v; img.data[i * 4 + 1] = 76 + v; img.data[i * 4 + 2] = 88 + v; img.data[i * 4 + 3] = 255; } g.putImageData(img, 0, 0); }));
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
  // sand (desert and dune circuits), tree leaves, and the windows of city buildings (by day and lit at night)
  const sandH = new Float32Array(256 * 256).map(() => Math.random());
  const sand = tex(canvas(256, 256, (g, w, h) => { const img = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const n = (sandH[i] - 0.5) * 18, y = Math.floor(i / w), rip = Math.sin(y * 0.18 + Math.sin(i % w * 0.05) * 2) * 4; img.data[i * 4] = 196 + n + rip; img.data[i * 4 + 1] = 168 + n + rip; img.data[i * 4 + 2] = 124 + n * 0.8 + rip; img.data[i * 4 + 3] = 255; } g.putImageData(img, 0, 0); }));
  const sandN = tex(normalFrom(sandH, 256, 256, 1.6), false);
  const leaf = tex(canvas(128, 128, (g, w, h) => { g.fillStyle = "#3D6B2E"; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = 40 + Math.random() * 70; g.fillStyle = `rgb(${v * 0.6},${v + 25},${v * 0.4})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 1 + Math.random() * 2, Math.random() * 3, 0, 7); g.fill(); } }));
  const windows = (lit) => tex(canvas(256, 512, (g, w, h) => {
    g.fillStyle = lit ? "#000" : "#B9BEC6"; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 32) for (let x = 6; x < w; x += 21) { const on = Math.random(); g.fillStyle = lit ? (on < 0.55 ? `rgba(255,${200 + Math.random() * 40},${120 + Math.random() * 60},1)` : "#000") : on < 0.15 ? "#3A4656" : "#5C6B7E"; g.fillRect(x, y, 14, 20); }
  }));
  // gravel traps: stones of a few sizes and shades; the apron: plain, slightly lighter tarmac
  const GW = 256, gH = new Float32Array(GW * GW);
  const gravel = tex(canvas(GW, GW, (g, w, h) => {
    g.fillStyle = "#9A9186"; g.fillRect(0, 0, w, h);
    for (let n = 0; n < 5200; n++) {
      const x = Math.random() * w, y = Math.random() * h, r = 0.8 + Math.random() ** 2 * 3.2, v = 110 + Math.random() * 110, warm = Math.random() * 18;
      g.fillStyle = `rgb(${v + warm},${v + warm * 0.6},${v - 6})`; g.beginPath(); g.ellipse(x, y, r, r * (0.6 + Math.random() * 0.4), Math.random() * 3, 0, 7); g.fill();
      for (let yy = Math.max(0, Math.floor(y - r)); yy < Math.min(h, y + r); yy++) for (let xx = Math.max(0, Math.floor(x - r)); xx < Math.min(w, x + r); xx++) { const d = Math.hypot(xx - x, yy - y) / r; if (d < 1) gH[yy * w + xx] = Math.max(gH[yy * w + xx], Math.sqrt(1 - d * d) * (0.5 + r / 8)); }
    }
  }));
  const gravelN = tex(normalFrom(gH, GW, GW, 3.2), false);
  const apron = tex(canvas(256, 256, (g, w, h) => { const img = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 84 + agg[i] * 50 + (Math.random() - 0.5) * 10; img.data[i * 4] = v; img.data[i * 4 + 1] = v + 1; img.data[i * 4 + 2] = v + 3; img.data[i * 4 + 3] = 255; } g.putImageData(img, 0, 0); }));
  return { gravel, gravelN, apron, asphalt, asphaltN, kerb, grass, grassN, runoff, fence, needle, crowd, concrete, checker, sand, sandN, leaf, windowsDay: windows(false), windowsNight: windows(true) };
}

// (materials the Unity export classifies by name: rl_ground_* get colliders and a surface type)
const named = (n, m) => { m.name = n; return m; };
export function buildCircuit(tr, scene, { profile, team } = {}) {
  const T = textures(), { N, X, Y, Z, LX, LZ, TX, TZ, dist, kerb } = tr, half = tr.half;
  const at = tr.wrap, W = tr.wall, WT = tr.wallType, pit = tr.pit;
  const sideK = (s) => (s > 0 ? 0 : 1); // +1 = left → wall[0], −1 = right → wall[1]
  const hAt = (i, o) => Y[i] + (tr.bankH ? tr.bankH(i, o) : 0); // the ground's height at offset o (+ = left) beside sample i (banked corners tilt)

  // ---------- floodlights (night races, and Abu Dhabi at dusk): where the lamps are, and how brightly lit the
  // ground is anywhere — pools of light under the lamps, darker in between. The poles themselves are built
  // in trackprops.js. ----------
  const isNight = tr.cfg.time === "night", lit = isNight || tr.cfg.time === "dusk", lamps = [], lampGrid = new Map(), LG = 40;
  if (lit) {
    for (let i = 0; i < N; i += 24) for (const s of [1, -1]) {
      if ((i / 24 + (s > 0 ? 0 : 1)) % 2) continue; // staggered: each side every 48 m
      const k = sideK(s); if (WT[k][i] === 2 || tr.tunnel?.[i] > 0) continue; // not along the pit wall, nor in a tunnel
      const base = W[k][i] + (WT[k][i] === 1 ? 2.8 : WT[k][i] === 3 ? 1.3 : 2.4), reach = Math.min(4, base - half - 0.5);
      const px = X[i] + LX[i] * s * base, pz = Z[i] + LZ[i] * s * base, py = hAt(i, s * base);
      // the lamps are aimed at the track: the middle of their pool of light is on the near half of the track
      const aim = s * half * 0.35;
      lamps.push({ i, s, px, pz, py, hx: X[i] + LX[i] * s * (base - reach), hz: Z[i] + LZ[i] * s * (base - reach), hy: py + 15 + Math.min(8, (base - half) * 0.25), ax: X[i] + LX[i] * aim, az: Z[i] + LZ[i] * aim });
    }
    lamps.forEach((l, n) => { const key = Math.floor(l.ax / LG) * 100003 + Math.floor(l.az / LG); if (!lampGrid.has(key)) lampGrid.set(key, []); lampGrid.get(key).push(n); });
  }
  const lightAt = (x, z) => {
    let sum = 0; const gx = Math.floor(x / LG), gz = Math.floor(z / LG);
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const n of lampGrid.get((gx + a) * 100003 + gz + b) ?? []) { const l = lamps[n], d2 = (l.ax - x) ** 2 + (l.az - z) ** 2; sum += Math.exp(-d2 / (2 * 12 * 12)); }
    return isNight ? 0.3 + 0.95 * Math.min(1.25, sum) : 0.9 + 0.15 * Math.min(1, sum);
  };
  // vertex colours carrying that light, for a ribbon's positions (and, inside a tunnel, the gloom: `rows`
  // gives each vertex's track sample)
  const hasTunnel = tr.tunnel?.some((v) => v > 0);
  const lightUp = (g, mat, pos, rows) => {
    if (!lit && !hasTunnel && !mat.vertexColors) return; // (a material that already uses them needs them on every mesh)
    const c = new Float32Array(pos.length);
    for (let v = 0; v < pos.length; v += 3) { const L = (lit ? lightAt(pos[v], pos[v + 2]) : 1) * (rows ? 1 - 0.7 * tr.tunnel[rows[v / 3]] : 1); c[v] = L; c[v + 1] = L; c[v + 2] = L * 0.97; }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3)); if (!mat.vertexColors) { mat.vertexColors = true; mat.needsUpdate = true; }
  };
  prepareMap(tr); // (the water's level and where the ground must go under it, before the terrain is built)
  const group = new THREE.Group(); group.name = "RL_Circuit"; scene.add(group);
  const keepOut = []; // rectangles (centre, half-sizes, angle) where nothing else may go: pits, stands

  // a strip along the track with a cross-section [[offset, height], …] from index a to b;
  // `prof` can also be a function of the track index
  function strip(a, b, prof, mat, { vScale = 10, uScale = 1 } = {}) {
    const P0 = typeof prof === "function" ? prof(at(a)) : prof, M = P0.length, pos = [], uv = [], idx = [], rows = [];
    for (let k = 0; k <= b - a; k++) {
      const i = at(a + k), d = dist[i] + (a + k >= N ? tr.len : 0) - (a + k < 0 ? tr.len : 0), pr = typeof prof === "function" ? prof(i) : prof;
      for (let m = 0; m < M; m++) { const [o, h] = pr[m]; pos.push(X[i] + LX[i] * o, hAt(i, o) + h, Z[i] + LZ[i] * o); uv.push((m / (M - 1)) * uScale, d / vScale); rows.push(i); }
      if (k < b - a) for (let m = 0; m < M - 1; m++) { const o = k * M + m; idx.push(o, o + M, o + 1, o + 1, o + M, o + M + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    lightUp(g, mat, pos, rows);
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
  const asphaltMat = named("rl_ground_track", new THREE.MeshStandardMaterial({ map: T.asphalt, normalMap: T.asphaltN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.9 }));
  strip(0, N, [[-half - 0.6, 0.0], [-half / 2, 0.035], [0, 0.05], [half / 2, 0.035], [half + 0.6, 0.0]], asphaltMat, { vScale: 6 });
  const lineMat = named("rl_ground_line", new THREE.MeshStandardMaterial({ color: 0xF2F2EE, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  strip(0, N, [[half - 0.32, 0.012], [half - 0.12, 0.012]], lineMat); strip(0, N, [[-half + 0.12, 0.012], [-half + 0.32, 0.012]], lineMat);
  {
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, 1.0), new THREE.MeshStandardMaterial({ map: T.checker, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
    T.checker.repeat.set(half * 2 / 2, 0.25);
    sl.position.set(X[0], Y[0] + 0.06, Z[0]); sl.rotation.set(-Math.PI / 2, 0, Math.atan2(TX[0], TZ[0])); group.add(sl);
    const box = new THREE.MeshStandardMaterial({ color: 0xEDEDED, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
    for (let p = 0; p < 20; p++) { const i = at(-14 - p * 8), o = (p % 2 ? -1 : 1) * half * 0.45; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.18), box); m.rotation.set(-Math.PI / 2, 0, Math.atan2(TX[i], TZ[i])); m.position.set(X[i] + LX[i] * o, Y[i] + 0.055, Z[i] + LZ[i] * o); group.add(m); }
  }

  // ---------- kerbs ----------
  const kerbMat = named("rl_ground_kerb", new THREE.MeshStandardMaterial({ map: T.kerb, roughness: 0.55 }));
  const kerbProf = (side) => { const pts = []; for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push([side * (half - 0.05 + u * 1.55), 0.008 + 0.07 * Math.sin(Math.min(1, u * 1.15) * Math.PI / 2) ** 0.8 - (u > 0.9 ? (u - 0.9) * 0.6 : 0)]); } return side > 0 ? pts : pts.reverse(); };
  for (const [a, b] of runs((i) => (kerb[i] & 1) !== 0, 10)) strip(a, b, kerbProf(1), kerbMat, { vScale: 6 }); // left (bit 1)
  for (const [a, b] of runs((i) => (kerb[i] & 2) !== 0, 10)) strip(a, b, kerbProf(-1), kerbMat, { vScale: 6 }); // right (bit 2)

  // ---------- run-off up to the barrier (see computeWalls): a tarmac apron just past the kerb, then grass,
  // a gravel trap, painted tarmac or (street circuits) the road ----------
  const SC = tr.cfg.scenery ?? "forest", sandy = SC === "desert" || SC === "dunes", night = tr.cfg.time === "night", dusk = tr.cfg.time === "dusk";
  const runMat = named("rl_ground_runoff", new THREE.MeshStandardMaterial({ map: T.runoff, roughness: 0.92 }));
  const grassMat = named("rl_ground_grass", sandy ? new THREE.MeshStandardMaterial({ map: T.sand, normalMap: T.sandN, roughness: 1 }) : new THREE.MeshStandardMaterial({ map: T.grass, normalMap: T.grassN, roughness: 1 }));
  const streetMat = named("rl_ground_street", new THREE.MeshStandardMaterial({ map: T.asphalt, normalMap: T.asphaltN, normalScale: new THREE.Vector2(0.4, 0.4), color: 0xC9CCD2, roughness: 0.92 }));
  const gravelMat = named("rl_ground_gravel", new THREE.MeshStandardMaterial({ map: T.gravel, normalMap: T.gravelN, normalScale: new THREE.Vector2(1.2, 1.2), color: sandy ? 0xF2DDB8 : 0xFFFFFF, roughness: 1 }));
  const apronMat = named("rl_ground_apron", new THREE.MeshStandardMaterial({ map: T.apron, normalMap: T.asphaltN, normalScale: new THREE.Vector2(0.35, 0.35), roughness: 0.9 }));
  const SURF_MAT = [grassMat, runMat, gravelMat, streetMat], AP = tr.apron, SF = tr.surf;
  // (escape roads: the run-off's own surface up to where the road starts, then the road out to the barrier)
  const ESC = tr.esc, escMat = named("rl_ground_escape", new THREE.MeshStandardMaterial({ map: T.asphalt, normalMap: T.asphaltN, normalScale: new THREE.Vector2(0.4, 0.4), color: 0xB4B8BF, roughness: 0.93 }));
  for (const s of [1, -1]) {
    const k = sideK(s), e0 = half + 0.6, ap = (i) => (AP ? AP[k][i] : 0), es = (i) => (ESC ? ESC[k][i] : 0);
    for (const [a, b] of runs((i) => ap(i) > 0.05 && SF?.[k][i] !== 3, 2)) strip(a, b, (i) => sided(s, [[e0, -0.005], [e0 + ap(i), -0.008]]), apronMat, { vScale: 8 });
    for (let code = 0; code < 4; code++) {
      const h = code === 2 ? -0.06 : -0.02, end = (i) => (es(i) > e0 + ap(i) + 0.5 ? es(i) : es(i) ? e0 + ap(i) + 0.5 : W[k][i] + 0.6);
      const prof = (i) => sided(s, [[e0 + ap(i), code === 2 ? -0.01 : -0.008], [Math.min(end(i) - 0.05, e0 + ap(i) + (code === 2 ? 0.35 : 0.01)), h], [end(i), h - 0.01]]);
      for (const [a, b] of runs((i) => (SF ? SF[k][i] : WT[k][i] === 3 ? 3 : WT[k][i] === 0 ? 0 : 1) === code, 2)) strip(a, b, prof, SURF_MAT[code], { vScale: code === 0 ? 8 : code === 2 ? 5 : 12, uScale: code === 0 ? 3 : code === 2 ? 2 : 1 });
    }
    if (ESC) for (const [a, b] of runs((i) => es(i) > 0, 4)) strip(a, b, (i) => { const e1 = Math.max(es(i), e0 + ap(i) + 0.5); return sided(s, [[e1, -0.012], [W[k][i] + 0.6, -0.022]]); }, escMat, { vScale: 10 });
  }

  // ---------- barriers ----------
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(0, 0, 0, "YXZ");
  // Tecpro, like the real thing: grey "pill" modules (rounded ends, an oval dip in the top) about 1.5 m
  // long, 0.5 m deep and 1.1 m tall, lined up in rows with red spacers between the rows and a sponsor
  // banner across the front. Three rows on the outside of corners, two elsewhere, a concrete wall behind.
  // When a car goes in, the rows get pushed back and squashed and stay that way (tr.dent, shared with
  // the physics). Modules are grouped into ~120 m sections, one instanced mesh each, so only the
  // sections in view (and near the camera) get drawn.
  const ROWD = 0.5, GAP = 0.16, PITCH = ROWD + GAP, MODL = 1.5, MODH = 1.1;
  tr.dent = [new Float32Array(N), new Float32Array(N)]; tr.crush = [new Float32Array(N), new Float32Array(N)];
  const tecRows = [new Uint8Array(N), new Uint8Array(N)];
  for (const k of [0, 1]) for (let i = 0; i < N; i++) {
    if (WT[k][i] !== 1) continue;
    let out = false; for (let j = -40; j <= 40 && !out; j += 4) { const kk = tr.K[at(i + j)]; if ((k === 1 && kk < -0.002) || (k === 0 && kk > 0.002)) out = true; /* K > 0 turns right, so its outside is the left */ }
    tecRows[k][i] = out ? 3 : 2; tr.crush[k][i] = tecRows[k][i] * ROWD * 0.62 + (tecRows[k][i] - 1) * GAP; // how far the rows can be squashed
  }
  const tecBack = (k, i) => (tecRows[k][i] || 2) * PITCH - GAP; // depth of the rows
  const fo = (k, i) => W[k][i] + (WT[k][i] === 1 ? tecBack(k, i) + 0.6 : WT[k][i] === 3 ? 0.3 : 1.6); // where the catch fence is
  const tec = { blocks: [], chunks: [], banners: [], dirty: new Set(), cullR: 480 };
  {
    // one module: an extruded "stadium" outline plus a darker oval on top (vertex colours; each block's
    // instance colour tints it)
    const moduleG = (() => {
      const r = ROWD / 2, L = MODL, sh = new THREE.Shape();
      sh.moveTo(-L / 2 + r, -r); sh.lineTo(L / 2 - r, -r); sh.absarc(L / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(-L / 2 + r, r); sh.absarc(-L / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
      const pos = [], nor = [], colA = [];
      const add = (g, colourAt) => { const P = g.attributes.position, Nn = g.attributes.normal; for (let v = 0; v < P.count; v += 3) { if (Nn.getY(v) < -0.9 && Nn.getY(v + 1) < -0.9) continue; for (let q = 0; q < 3; q++) { pos.push(P.getX(v + q), P.getY(v + q), P.getZ(v + q)); nor.push(Nn.getX(v + q), Nn.getY(v + q), Nn.getZ(v + q)); const c = colourAt(P.getY(v + q)); colA.push(c, c, c * 1.02); } } };
      // the moulded plastic body (no bottom: nobody sees it), a bit grubby towards the ground
      const body = new THREE.ExtrudeGeometry(sh, { depth: MODH, bevelEnabled: false, curveSegments: 4 }); body.rotateX(-Math.PI / 2);
      add(body, (y) => (y < 0.01 ? 0.55 : 1));
      // the strap that ties each row together: a dark band round the module
      const outline = sh.getPoints(4), band = [];
      for (let k = 0; k < outline.length; k++) {
        const p0 = outline[k], p1 = outline[(k + 1) % outline.length], grow = 1.012;
        const q = (p, y) => [p.x * grow, y, -p.y * grow], A = q(p0, 0.52), B = q(p1, 0.52), C = q(p1, 0.6), D = q(p0, 0.6);
        band.push(...A, ...B, ...C, ...A, ...C, ...D);
      }
      const bandG = new THREE.BufferGeometry(); bandG.setAttribute("position", new THREE.Float32BufferAttribute(band, 3)); bandG.computeVertexNormals(); add(bandG, () => 0.16);
      // the oval dip on top, with a lighter rim
      const rim = new THREE.CircleGeometry(1, 14).toNonIndexed(); rim.rotateX(-Math.PI / 2); rim.scale(L * 0.37, 1, r * 0.72); rim.translate(0, MODH + 0.002, 0); add(rim, () => 0.78);
      const dip = new THREE.CircleGeometry(1, 14).toNonIndexed(); dip.rotateX(-Math.PI / 2); dip.scale(L * 0.32, 1, r * 0.6); dip.translate(0, MODH + 0.004, 0); add(dip, () => 0.42);
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3));
      return g;
    })();
    const spacerG = new RoundedBoxGeometry(0.34, 1.0, GAP + 0.02, 1, 0.04); spacerG.translate(0, 0.5 + 0.04, 0);
    const modM = named("rl_tecpro", new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0 })), spacerM = named("rl_tecpro_spacer", new THREE.MeshStandardMaterial({ color: 0xB0242A, roughness: 0.6 }));
    const MAX = 16000;
    for (const s of [1, -1]) {
      const k = sideK(s);
      for (const [a, b] of runs((i) => WT[k][i] === 1, 2)) {
        // space the modules evenly along the barrier itself (round the outside of a hairpin it is much
        // longer than the centre line), end to end with a small gap
        const pts = [];
        for (let kk = a; kk <= b; kk++) { const i = at(kk); pts.push({ i, d: dist[i] + (kk >= N ? tr.len : 0), x: X[i] + LX[i] * s * W[k][i], z: Z[i] + LZ[i] * s * W[k][i] }); }
        let segA = 0, acc = 0;
        for (let target = MODL / 2; ; target += MODL + 0.04) {
          while (segA < pts.length - 1) { const sl = Math.hypot(pts[segA + 1].x - pts[segA].x, pts[segA + 1].z - pts[segA].z); if (acc + sl >= target) break; acc += sl; segA++; }
          if (segA >= pts.length - 1) break;
          const p0 = pts[segA], p1 = pts[segA + 1], sl = Math.hypot(p1.x - p0.x, p1.z - p0.z) || 1, f = (target - acc) / sl;
          const pt = f < 0.5 ? p0 : p1, i = pt.i, d = p0.d + (p1.d - p0.d) * f;
          const yaw = Math.atan2(p1.x - p0.x, p1.z - p0.z) + Math.PI / 2, rows = tecRows[k][i] || 2;
          // where along the centre-line index this module's middle is (it sits between two indices)
          const ex = p0.x + (p1.x - p0.x) * f - (X[i] + LX[i] * s * W[k][i]), ez = p0.z + (p1.z - p0.z) * f - (Z[i] + LZ[i] * s * W[k][i]);
          for (let row = 0; row < rows; row++) {
            if (tec.blocks.length >= MAX) break;
            const shade = 0.12 + ((Math.sin(d * 12.9898 + row * 78.233) * 43758.5453) % 1 + 1) % 1 * 0.045;
            tec.blocks.push({ i, k, s, d, row, rows, w: W[k][i], ex, ez, yaw, twist: 0, color: new THREE.Color(shade, shade + 0.01, shade + 0.025), spacer: row > 0 });
          }
        }
      }
    }
    const byChunk = new Map();
    tec.blocks.forEach((bl, n) => { const key = bl.k * 1000 + Math.floor(bl.d / 120); if (!byChunk.has(key)) byChunk.set(key, []); byChunk.get(key).push(n); });
    for (const list of byChunk.values()) {
      const nSp = list.filter((n) => tec.blocks[n].spacer).length;
      const mesh = new THREE.InstancedMesh(moduleG, modM, list.length), spacers = new THREE.InstancedMesh(spacerG, spacerM, Math.max(1, nSp)), ch = { mesh, spacers, dirty: false, list };
      let sp = 0;
      list.forEach((n, j) => { const bl = tec.blocks[n]; bl.chunk = ch; bl.slot = j; if (bl.spacer) bl.spSlot = sp++; mesh.setColorAt(j, bl.color); poseBlock(bl); });
      spacers.count = sp;
      mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); spacers.computeBoundingSphere(); mesh.boundingSphere.radius += 4; spacers.boundingSphere.radius += 4;
      ch.center = mesh.boundingSphere.center.clone(); ch.radius = mesh.boundingSphere.radius;
      mesh.receiveShadow = true; group.add(mesh, spacers); tec.chunks.push(ch);
    }
    // concrete wall behind the rows
    const conc = new THREE.MeshStandardMaterial({ map: T.concrete, roughness: 0.85, side: THREE.DoubleSide });
    for (const s of [1, -1]) { const k = sideK(s); for (const [a, b] of runs((i) => WT[k][i] === 1, 2)) strip(a, b, (i) => sided(s, [[W[k][i] + tecBack(k, i) + 0.06, 0], [W[k][i] + tecBack(k, i) + 0.06, 1.3], [W[k][i] + tecBack(k, i) + 0.36, 1.3]]), conc, { vScale: 4 }); }
    // the banner across the front row: made-up sponsors
    const sponsors = [["NORTHWIND", "#1D4E89", "#F2F4F7"], ["ARCLIGHT", "#F2F4F7", "#E2502B"], ["TIDELINE", "#0E7C7B", "#F2F4F7"], ["QUILLON", "#16181D", "#F5C518"], ["BLUEFERN", "#F2F4F7", "#2E7D4F"], ["RACELIMIT", "#16181D", "#FFA51F"]];
    const bannerTex = tex(canvas(2048, 128, (g, w, h) => {
      const seg = w / sponsors.length;
      sponsors.forEach(([name, bg, fg], n) => { g.fillStyle = bg; g.fillRect(n * seg, 0, seg, h); g.fillStyle = fg; g.font = "700 76px BC, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name, n * seg + seg / 2, h / 2 + 3); g.fillRect(n * seg + 18, h - 16, seg - 36, 5); });
      g.fillStyle = "rgba(0,0,0,.25)"; for (let n = 0; n <= sponsors.length; n++) g.fillRect(n * seg - 1, 0, 2, h);
    }));
    const bannerM = new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.75, side: THREE.DoubleSide });
    const BANNER_LEN = 42; // metres for one run of all the sponsors
    for (const s of [1, -1]) {
      const k = sideK(s);
      for (const [a, b] of runs((i) => WT[k][i] === 1 || WT[k][i] === 3, 6)) {
        const idx = [], pos = [], uv = [], ind = [];
        let along = 0, px = null, pz = null;
        for (let kk = a; kk <= b; kk++) {
          const i = at(kk), o = s * (W[k][i] - 0.025), x = X[i] + LX[i] * o, z = Z[i] + LZ[i] * o;
          if (px !== null) along += Math.hypot(x - px, z - pz); px = x; pz = z;
          const u = (s > 0 ? along : -along) / BANNER_LEN; // flipped on the right so the words read the right way round
          const yb = hAt(i, o); pos.push(x, yb + 0.14, z, x, yb + 0.98, z); uv.push(u, 0.02, u, 0.98); idx.push(i);
          if (kk < b) { const v = (kk - a) * 2; ind.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ind); g.computeVertexNormals();
        const m = new THREE.Mesh(g, bannerM); m.receiveShadow = true; m.name = "RL_TecproBanner"; m.userData.tec = { k, idx }; group.add(m); // (the Unity export keeps only the bits in front of plain walls: Unity makes its own on Tecpro)
        tec.banners.push({ k, s, idx, mesh: m });
      }
    }
  }
  // where a module sits: the rows between the dent and the concrete are squashed evenly, so the front
  // face is exactly where the physics says the barrier now is; hit modules are also knocked a bit crooked
  function poseBlock(bl) {
    const i = bl.i, D = Math.max(tr.dent[bl.k][i], tr.dent[bl.k][at(i - 1)], tr.dent[bl.k][at(i + 1)]);
    const T0 = bl.rows * PITCH - GAP, sq = Math.max(0.2, (T0 - D) / T0);
    const o = bl.s * (bl.w + D + bl.row * PITCH * sq + (ROWD * sq) / 2), yaw = bl.yaw + bl.twist * Math.min(1, D / 0.4);
    _p.set(X[i] + LX[i] * o + bl.ex, hAt(i, o), Z[i] + LZ[i] * o + bl.ez); _q.setFromAxisAngle(up, yaw);
    _s.set(1, 1, sq); m4.compose(_p, _q, _s); bl.chunk.mesh.setMatrixAt(bl.slot, m4);
    if (bl.spacer) { const os = bl.s * (bl.w + D + (bl.row * PITCH - GAP / 2) * sq); _p.set(X[i] + LX[i] * os + bl.ex, hAt(i, os), Z[i] + LZ[i] * os + bl.ez); _q.setFromAxisAngle(up, bl.yaw); m4.compose(_p, _q, _s); bl.chunk.spacers.setMatrixAt(bl.spSlot, m4); }
    bl.chunk.dirty = true;
  }
  // armco: two rails on posts
  {
    const armMat = named("rl_armco", new THREE.MeshStandardMaterial({ color: 0xC9CED4, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide }));
    const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), new THREE.MeshStandardMaterial({ color: 0x8A9098, metalness: 0.6, roughness: 0.5 }), 6000); let np = 0;
    for (const s of [1, -1]) {
      const k = sideK(s);
      for (const [a, b] of runs((i) => WT[k][i] === 0, 2)) {
        for (const yy of [0.42, 0.78]) strip(a, b, (i) => sided(s, [[W[k][i], yy], [W[k][i], yy + 0.3]]).map((p) => p), armMat, { vScale: 4 });
        for (let kk = a; kk < b; kk += 4) { const i = at(kk), o = s * (W[k][i] + 0.12); m4.makeTranslation(X[i] + LX[i] * o, hAt(i, o) + 0.45, Z[i] + LZ[i] * o); if (np < 6000) posts.setMatrixAt(np++, m4); }
      }
    }
    posts.count = np; group.add(posts);
  }
  // street circuits: concrete walls (painted, with the sponsor band) and a tall catch fence on top
  {
    const sw = new THREE.MeshStandardMaterial({ map: T.concrete, color: 0xF0F1F3, roughness: 0.8, side: THREE.DoubleSide });
    for (const s of [1, -1]) { const k = sideK(s); for (const [a, b] of runs((i) => WT[k][i] === 3, 2)) strip(a, b, (i) => sided(s, [[W[k][i], 0], [W[k][i], 1.05], [W[k][i] + 0.6, 1.05], [W[k][i] + 0.6, 0]]), sw, { vScale: 4 }); }
  }
  // catch fence behind every barrier (the pit wall has its own)
  {
    const fenceMat = named("rl_fence", new THREE.MeshStandardMaterial({ map: T.fence, alphaTest: 0.45, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 }));
    const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 4.2, 4, 1, true), new THREE.MeshStandardMaterial({ color: 0x8A9098, metalness: 0.8, roughness: 0.35 }), 6000); let np = 0;
    for (const s of [1, -1]) {
      const k = sideK(s);
      for (const [a, b] of runs((i) => WT[k][i] !== 2 && !(tr.tunnel?.[i] > 0.3), 2)) { // (none inside a tunnel)
        strip(a, b, (i) => sided(s, [[fo(k, i), 0], [fo(k, i), 4.0]]), fenceMat, { vScale: 3, uScale: 1.3 });
        for (let kk = a; kk < b; kk += 6) { const i = at(kk), o = s * fo(k, i); m4.makeTranslation(X[i] + LX[i] * o, hAt(i, o) + 2.1, Z[i] + LZ[i] * o); if (np < 6000) posts.setMatrixAt(np++, m4); }
      }
    }
    posts.count = np; group.add(posts);
  }

  // ---------- pit lane: its own road (tr.pitRoad), the pit wall, garages, boxes and the speed-limit lines ----------
  const pitInfo = { boxes: [] };
  if (tr.pitRoad) {
    const R = tr.pitRoad, M = R.N, s = pit.side, tk = R.tk, ts = tk === 0 ? 1 : -1; // ts: sign of "towards the track" in pit-road terms
    const cl = (i) => Math.max(0, Math.min(M - 1, i));
    // a ribbon along the pit road with a cross-section [[offset, height], …] (offsets in the pit road's own
    // left/right terms, listed right to left); `prof` may be a function of the sample
    const pstrip = (a, b, prof, mat, { vScale = 10, uScale = 1, lift = 0 } = {}) => {
      const pos = [], uv = [], idx = []; let M0 = 0;
      for (let n = a; n <= b; n++) {
        const i = cl(n), pr = typeof prof === "function" ? prof(i) : prof; M0 = pr.length;
        for (let m = 0; m < M0; m++) { const [o, h] = pr[m]; pos.push(R.X[i] + R.LX[i] * o, R.Y[i] + h + lift, R.Z[i] + R.LZ[i] * o); uv.push((m / (M0 - 1)) * uScale, R.dist[i] / vScale); }
        if (n < b) for (let m = 0; m < M0 - 1; m++) { const o = (n - a) * M0 + m; idx.push(o, o + M0, o + 1, o + 1, o + M0, o + M0 + 1); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      lightUp(g, mat, pos);
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; group.add(m); return m;
    };
    const order = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse()); // right to left, so faces point up
    const prunsP = (test) => { const out = []; let a = -1; for (let i = 0; i <= M; i++) { const ok = i < M && test(i); if (ok && a < 0) a = i; if (!ok && a >= 0) { if (i - a > 1) out.push([a, i - 1]); a = -1; } } return out; };
    const conc = new THREE.MeshStandardMaterial({ map: T.concrete, roughness: 0.85, side: THREE.DoubleSide });
    // (garTrack: the garages stand on the track's side of the lane — Monaco; GS is the garages' side, gDoor where their doors are)
    const garTrack = !!R.garTrack, GS = garTrack ? ts : -ts, inGar = (i) => R.mj[i] >= R.garages[0] - 24 && R.mj[i] <= R.garages[1] + 24;
    const gOut = (i) => R.wall[R.gk][i], gDoor = (i) => (garTrack ? R.wall[R.tk][i] : gOut(i));
    const tIn = (i) => (garTrack && inGar(i) ? R.wall[R.tk][i] : R.bar[i] ? R.hw[i] : R.hw[i] + 0.3);
    // the surface: from the pit wall (or the track's edge where they merge) out to the garages / outer wall
    pstrip(0, M - 1, (i) => order([[ts * tIn(i), 0.0], [-ts * gOut(i), 0.0]]), asphaltMat, { vScale: 6, lift: 0.012 });
    // white lines: along the edge on the track side where they merge (you mustn't cross it), the fast
    // lane / working lane line by the garages, and the speed-limit lines across the lane
    for (const [a, b] of prunsP((i) => !R.bar[i])) pstrip(a, b, (i) => order([[ts * (R.hw[i] + 0.05), 0.02], [ts * (R.hw[i] + 0.3), 0.02]]), lineMat, { lift: 0.012 });
    const gIdx = []; for (let i = 0; i < M; i++) if (R.mj[i] >= R.garages[0] && R.mj[i] <= R.garages[1]) gIdx.push(i);
    if (gIdx.length) pstrip(gIdx[0], gIdx[gIdx.length - 1], order([[GS * (R.hw[gIdx[0]] - 0.05), 0.02], [GS * (R.hw[gIdx[0]] + 0.15), 0.02]]), lineMat, { lift: 0.012 });
    const limitLine = (d, label) => {
      let i = 0; while (i < M - 1 && R.dist[i] < d) i++;
      pstrip(i, i + 1, order([[ts * tIn(i), 0.022], [-ts * gOut(i), 0.022]]), lineMat, { lift: 0.012 });
      // a sign on the pit wall side: the speed limit
      const sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.06), new THREE.MeshStandardMaterial({ map: tex(canvas(128, 128, (g) => { g.fillStyle = "#F4F4F4"; g.fillRect(0, 0, 128, 128); g.lineWidth = 12; g.strokeStyle = label === "end" ? "#16181D" : "#C8161A"; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke(); g.fillStyle = "#16181D"; g.font = "700 50px BC, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("80", 64, 67); if (label === "end") { g.lineWidth = 8; g.beginPath(); g.moveTo(26, 102); g.lineTo(102, 26); g.stroke(); } })), roughness: 0.6 }));
      const o = -ts * (gOut(i) - 0.4); sign.position.set(R.X[i] + R.LX[i] * o, R.Y[i] + 1.6, R.Z[i] + R.LZ[i] * o); sign.rotation.y = Math.atan2(R.TX[i], R.TZ[i]) + Math.PI; group.add(sign);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), new THREE.MeshStandardMaterial({ color: 0x8A9098 })); post.position.set(sign.position.x, R.Y[i] + 0.55, sign.position.z); group.add(post);
    };
    limitLine(R.limitFrom, "start"); limitLine(R.limitTo, "end");
    // the pit wall between the track and the lane, with a debris fence along the garages
    // (each end of the pit wall gets a striped crash cushion, like the real ones)
    const noseM = new THREE.MeshStandardMaterial({ map: tex(canvas(64, 64, (g) => { g.fillStyle = "#F5C518"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#16181D"; for (let k = -64; k < 128; k += 22) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 11, 0); g.lineTo(k + 11 - 64, 64); g.lineTo(k - 64, 64); g.fill(); } })), roughness: 0.6 });
    for (const [a, b] of prunsP((i) => R.bar[i] && !(garTrack && inGar(i)))) {
      pstrip(a, b, (i) => order([[ts * R.hw[i], 0], [ts * R.hw[i], 1.1], [ts * (R.hw[i] + R.WALL), 1.1], [ts * (R.hw[i] + R.WALL), 0]]), conc, { vScale: 4 });
      for (const [e, dir] of [[a, -1], [b, 1]]) {
        const o = ts * (R.hw[e] + R.WALL / 2), nose = new THREE.Mesh(new RoundedBoxGeometry(0.95, 1.1, 2.2, 2, 0.3), noseM);
        nose.position.set(R.X[e] + R.LX[e] * o - R.TX[e] * dir * 1.0, R.Y[e] + 0.55, R.Z[e] + R.LZ[e] * o - R.TZ[e] * dir * 1.0); nose.rotation.y = Math.atan2(R.TX[e], R.TZ[e]); nose.castShadow = true; group.add(nose);
      }
    }
    const pf = new THREE.MeshStandardMaterial({ map: T.fence, alphaTest: 0.45, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5 });
    if (gIdx.length) pstrip(Math.max(0, gIdx[0] - 40), Math.min(M - 1, gIdx[gIdx.length - 1] + 40), (i) => (garTrack ? [[-ts * (gOut(i) + 0.1), 1.0], [-ts * (gOut(i) + 0.1), 4.0]] : [[ts * (R.hw[i] + 0.2), 1.1], [ts * (R.hw[i] + 0.2), 4.2]]), pf, { vScale: 3, uScale: 0.8 });
    // the outer wall where there are no garages (with the garages on the track side, all the way)
    for (const [a, b] of prunsP((i) => garTrack || !(R.mj[i] >= R.garages[0] && R.mj[i] <= R.garages[1]))) pstrip(a, b, (i) => order([[-ts * gOut(i), 0], [-ts * gOut(i), 1.0], [-ts * (gOut(i) + 0.4), 1.0]]), conc, { vScale: 4 });
    // garages: ten made-up teams, facing the lane, with a painted box in front of each
    const teams = ["RACELIMIT", "AXIOM", "HALCYON", "VORTEX", "NOVA", "KESTREL GP", "MERIDIAN", "ORBIT", "TALON", "SOLSTICE"];
    const cols = ["#FFA51F", "#5AA9FF", "#C9B6FF", "#FF6B3A", "#7FE0B8", "#F5C518", "#E8EAF0", "#FF5A8A", "#9BDB4F", "#3FA0FF"];
    // your team gets the first garage (nearest the pit entry)
    if (team && team.team !== "RACELIMIT") { const k = teams.indexOf(team.team); if (k > 0) { [teams[0], teams[k]] = [teams[k], teams[0]]; [cols[0], cols[k]] = [cols[k], cols[0]]; } else { teams[0] = team.team; cols[0] = team.body; } }
    const [g0, g1] = pit.garages, segLen = (g1 - g0) / 10;
    // (on the track side the garages are only as deep as the room between the track's barrier and the lane allows)
    const depthAt = (pg) => (garTrack ? Math.max(7, Math.min(18, R.off[pg] - gDoor(pg) - (W[pit.k][at(Math.round(R.mj[pg]))] + 1.2))) : 18), depth = 18;
    const wallM = named("rl_concrete", new THREE.MeshStandardMaterial({ color: 0xE8EAEE, roughness: 0.6 })), glassM = new THREE.MeshStandardMaterial({ color: 0x223044, metalness: 0.4, roughness: 0.15 }), doorM = new THREE.MeshStandardMaterial({ color: 0x15171C, roughness: 0.8 }), roofM = new THREE.MeshStandardMaterial({ color: 0xBFC4CB, metalness: 0.4, roughness: 0.4 });
    pitInfo.garageRow = { at: [], out: [], depth, cols, len: g1 - g0, trackSide: garTrack };
    const pitAt = (j) => { let pi = 0, bd = Infinity; for (let n = 0; n < M; n++) { const q2 = Math.abs(R.mj[n] - j); if (q2 < bd) { bd = q2; pi = n; } } return pi; };
    for (let t = 0; t < 10; t++) {
      // each garage stands behind its stretch of the pit lane, doors facing the lane
      const pg = pitAt(g0 + (t + 0.5) * segLen), depth = depthAt(pg), og = GS * (gDoor(pg) + depth / 2);
      pitInfo.garageRow.at.push(pg); pitInfo.garageRow.out.push(gOut(pg));
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.2, 11, depth), wallM); body.position.y = 5.5; g.add(body);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(segLen - 4, 5), doorM); door.position.set(0, 2.6, depth / 2 + 0.01); g.add(door);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(segLen, 2.6), glassM); glass.position.set(0, 8.2, depth / 2 + 0.02); g.add(glass);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(segLen - 4, 1.4), new THREE.MeshBasicMaterial({ map: tex(canvas(512, 64, (cg, w, h) => { cg.fillStyle = "#16181D"; cg.fillRect(0, 0, w, h); cg.fillStyle = cols[t]; cg.fillRect(0, h - 6, w, 6); cg.fillStyle = "#F2F2F2"; cg.font = "700 40px BC, sans-serif"; cg.textAlign = "center"; cg.textBaseline = "middle"; cg.fillText(teams[t], w / 2, h / 2 - 2); })) }));
      sign.position.set(0, 5.9, depth / 2 + 0.03); g.add(sign);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.4, 0.5, depth + 3), roofM); roof.position.set(0, 11.2, 1); g.add(roof);
      g.position.set(R.X[pg] + R.LX[pg] * og, R.Y[pg], R.Z[pg] + R.LZ[pg] * og);
      g.lookAt(R.X[pg], R.Y[pg], R.Z[pg]); // +z of the group (the doors) faces the lane
      g.traverse((m) => { if (m.isMesh) { m.castShadow = m !== sign; m.receiveShadow = true; } });
      group.add(g);
      // the pit box: a painted rectangle in the working lane in front of the garage
      const pi = pg;
      const bo = GS * (R.hw[pi] + (gDoor(pi) - R.hw[pi]) * 0.45), bx = R.X[pi] + R.LX[pi] * bo, bz = R.Z[pi] + R.LZ[pi] * bo;
      const box = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 6.4), new THREE.MeshStandardMaterial({ map: tex(canvas(64, 128, (cg, w, h) => { cg.fillStyle = "rgba(0,0,0,0)"; cg.clearRect(0, 0, w, h); cg.strokeStyle = cols[t]; cg.lineWidth = 5; cg.strokeRect(3, 3, w - 6, h - 6); cg.fillStyle = cols[t]; cg.fillRect(6, h * 0.5 - 2, w - 12, 4); })), transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3 }));
      box.rotation.set(-Math.PI / 2, 0, Math.atan2(R.TX[pi], R.TZ[pi])); box.position.set(bx, R.Y[pi] + 0.03, bz); group.add(box);
      pitInfo.boxes.push({ team: teams[t], color: cols[t], x: bx, z: bz, pidx: pi, yaw: Math.atan2(R.TX[pi], R.TZ[pi]) });
    }
    { const pm = pitAt((g0 + g1) / 2), om = GS * (gDoor(pm) + depthAt(pm) / 2); keepOut.push({ x: R.X[pm] + R.LX[pm] * om, z: R.Z[pm] + R.LZ[pm] * om, hl: (g1 - g0) / 2 + 30, hw: depth / 2 + 20, ang: Math.atan2(R.TX[pm], R.TZ[pm]) }); }
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
  let terrainH = null; // the terrain mesh's heights once it's built (carved under the roads), see below
  const groundAt = (x, z) => { const g = groundRaw(x, z); if (terrainH) { const t = terrainH(x, z); if (t != null && t < g.h) g.h = t; } return g; };
  const groundRaw = (x, z) => {
    const n = tr.nearestGlobal(x, z, 3);
    if (n.i < 0) return { h: coarseAt(x, z) + hills(x, z), d: 999 };
    const i = n.i, d = Math.sqrt(n.d2), lat = (x - X[i]) * LX[i] + (z - Z[i]) * LZ[i], k = lat >= 0 ? 0 : 1;
    let flat = W[k][i] + 3; if (pit && k === pit.k && WT[k][i] === 2) flat = pit.laneOut + 26;
    const far = coarseAt(x, z) + hills(x, z), t = smoothstep(flat, flat + 160, d);
    return { h: (hAt(i, lat) - 0.3) * (1 - t) + far * t, d, flat };
  };
  {
    const STEP = 8, nx = Math.ceil((maxX - minX) / STEP), nz = Math.ceil((maxZ - minZ) / STEP);
    const g = new THREE.PlaneGeometry(nx * STEP, nz * STEP, nx, nz); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, uv = g.attributes.uv, colA = [];
    const x0 = (minX + maxX) / 2 - (nx * STEP) / 2, z0 = (minZ + maxZ) / 2 - (nz * STEP) / 2, H = new Float32Array((nx + 1) * (nz + 1));
    for (let iz = 0; iz <= nz; iz++) for (let ix = 0; ix <= nx; ix++) H[iz * (nx + 1) + ix] = groundRaw(x0 + ix * STEP, z0 + iz * STEP).h;
    // carve: wherever there's a road surface (the track out to its barriers, the pit lane, the garages),
    // the four corners of the terrain square it's in go below it, so the ground can never poke through
    const carve = (x, z, hs) => { const fx = (x - x0) / STEP, fz = (z - z0) / STEP, ix = Math.floor(fx), iz = Math.floor(fz); if (ix < 0 || iz < 0 || ix >= nx || iz >= nz) return; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const k = (iz + b) * (nx + 1) + ix + a; if (H[k] > hs) H[k] = hs; } };
    for (let i = 0; i < N; i += 2) for (const s of [1, -1]) { const k = sideK(s), lim = W[k][i] + 6; for (let o = 0; o <= lim; o += 2.5) { const oo = s * Math.min(o, lim); carve(X[i] + LX[i] * oo, Z[i] + LZ[i] * oo, hAt(i, oo) - 0.4); } }
    if (tr.pitRoad) { const R = tr.pitRoad; for (let i = 0; i < R.N; i += 2) { const out = Math.max(R.wall[0][i] === 40 ? R.hw[i] : R.wall[0][i], R.wall[1][i] === 40 ? R.hw[i] : R.wall[1][i]) + 4; for (let o = -out; o <= out; o += 2.5) carve(R.X[i] + R.LX[i] * o, R.Z[i] + R.LZ[i] * o, R.Y[i] - 0.4); } }
    for (const c of tr.carveExtra ?? []) carve(c[0], c[1], c[2]); // (water and the like, see trackprops)
    terrainH = (x, z) => { const fx = (x - x0) / STEP, fz = (z - z0) / STEP, ix = Math.floor(fx), iz = Math.floor(fz); if (ix < 0 || iz < 0 || ix >= nx || iz >= nz) return null; const tx = fx - ix, tz = fz - iz, a = H[iz * (nx + 1) + ix], b = H[iz * (nx + 1) + ix + 1], c = H[(iz + 1) * (nx + 1) + ix], d = H[(iz + 1) * (nx + 1) + ix + 1]; return Math.max(a, b, c, d) === Math.min(a, b, c, d) ? a : a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz; };
    tr.terrain = { H, x0, z0, nx, nz, STEP };
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) + (minX + maxX) / 2, z = pos.getZ(i) + (minZ + maxZ) / 2, ix = Math.round((x - x0) / STEP), iz = Math.round((z - z0) / STEP), h = H[iz * (nx + 1) + ix]; pos.setY(i, h); uv.setXY(i, x / 5, z / 5); const v = (0.88 + Math.sin(x * 0.03) * Math.cos(z * 0.025) * 0.08 + (Math.random() - 0.5) * 0.05) * (lit ? lightAt(x, z) : 1); colA.push(v * 0.97, v, v * 0.92); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3)); g.computeVertexNormals();
    // (in a city the ground between the buildings is paved, not grass)
    const m = new THREE.Mesh(g, named("rl_ground_terrain", new THREE.MeshStandardMaterial({ map: SC === "city" ? T.apron : sandy ? T.sand : T.grass, normalMap: SC === "city" ? T.asphaltN : sandy ? T.sandN : T.grassN, vertexColors: true, roughness: 1, color: SC === "city" ? 0xD8D6D0 : 0xFFFFFF })));
    m.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2); m.receiveShadow = true; group.add(m);
    const skirt = new THREE.Mesh(new THREE.RingGeometry(Math.max(maxX - minX, maxZ - minZ) * 0.55, 9000, 64, 1), new THREE.MeshStandardMaterial({ color: sandy ? 0xB59A6E : 0x3E5A34, roughness: 1 }));
    skirt.rotation.x = -Math.PI / 2; skirt.position.set((minX + maxX) / 2, coarseAt((minX + maxX) / 2, (minZ + maxZ) / 2) - 6, (minZ + maxZ) / 2); group.add(skirt);
  }

  // ---------- grandstands: only where the whole stand is clear of the track and the pits ----------
  const inPits = (x, z, pad) => { if (!pit) return false; const n = tr.nearestGlobal(x, z, 3); if (n.i < 0) return false; const i = n.i, lat = (x - X[i]) * LX[i] + (z - Z[i]) * LZ[i]; return Math.sign(lat) === pit.side && WT[pit.k][i] === 2 && Math.abs(lat) < pit.laneOut + 18 + pad; };
  const inKeepOut = (x, z, pad = 0) => inPits(x, z, pad) || keepOut.some((r) => { const dx = x - r.x, dz = z - r.z, c = Math.cos(r.ang), s2 = Math.sin(r.ang); const al = dx * s2 + dz * c, ac = dx * c - dz * s2; return Math.abs(al) < r.hl + pad && Math.abs(ac) < r.hw + pad; });
  // the pit road (where it runs on its own away from the track, too)
  const pitGrid = new Map(), PC = 25, RR = tr.pitRoad;
  if (RR) for (let i = 0; i < RR.N; i += 2) { const key = Math.floor(RR.X[i] / PC) * 100003 + Math.floor(RR.Z[i] / PC); if (!pitGrid.has(key)) pitGrid.set(key, []); pitGrid.get(key).push(i); }
  const clearOfPit = (x, z, margin) => { if (!RR) return true; const gx = Math.floor(x / PC), gz = Math.floor(z / PC); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const i of pitGrid.get((gx + a) * 100003 + gz + b) ?? []) { const r = Math.max(RR.hw[i] + 3, RR.wall[RR.gk][i]) + margin; if ((RR.X[i] - x) ** 2 + (RR.Z[i] - z) ** 2 < r * r) return false; } return true; };
  const clearOfTrack = (x, z, margin) => { if (!clearOfPit(x, z, margin)) return false; const n = tr.nearestGlobal(x, z, 3); if (n.i < 0) return true; const i = n.i, lat = (x - X[i]) * LX[i] + (z - Z[i]) * LZ[i], k = lat >= 0 ? 0 : 1; return Math.sqrt(n.d2) > W[k][i] + margin; };
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
    for (const c of corners) { if (placed >= 4) break; const outside = tr.K[c.i] > 0 ? 1 : -1; /* K > 0 turns right: the outside is on the left */ if (tryStand(c.i, outside, 90, 14) || tryStand(at(c.i - 60), outside, 80, 12)) placed++; }
  }

  // ---------- the real surroundings from OpenStreetMap: buildings, water, tunnels, bridges (trackworld.js) ----------
  const mapRes = buildMap({ tr, group, tex, canvas, groundAt, strip, sided, inKeepOut, clearOfPit, clearOfTrack, isNight, dusk: tr.cfg.time === "dusk", sideK });
  // ---------- buildings, floodlights, marshals, billboards, bridges, the paddock… (trackprops.js) ----------
  const props = addProps({ mapRes, tr, group, tex, canvas, hAt, sideK, clearOfTrack, inKeepOut, keepOut, groundAt, fenceOff: 2, fo, lit, isNight, lamps, pitInfo });

  // ---------- scenery: trees, palms or bushes depending on the circuit, kept away from the track, the pits,
  // the stands and the buildings (far enough that even the biggest crown stays behind the fence). Grouped in 300 m cells so only what's in view is drawn. ----------
  {
    // how much of what, per kind of place
    const MIX = {
      forest: { fir: 7000 }, alpine: { fir: 4200, leafy: 1400 }, park: { leafy: 4500, fir: 500 }, countryside: { leafy: 1800 },
      plains: { leafy: 900 }, tropical: { palm: 1600, leafy: 2200 }, desert: { palm: 380 }, dunes: { bush: 2200, leafy: 300 },
      city: { palm: tr.cfg.cc === "MC" || tr.cfg.cc === "SG" || tr.cfg.cc === "US" || tr.cfg.cc === "ES" ? 300 : 0, leafy: tr.cfg.cc === "AZ" ? 250 : 120 },
    }[SC] ?? { fir: 4000 };
    // where the map says trees really are (single trees, woods) go first, shared out between the kinds of tree;
    // with plenty of those only a few more are scattered at random
    const spots = mapRes.treeSpots.slice(); for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
    const mixTotal = Object.values(MIX).reduce((a, b) => a + (b || 0), 0) || 1; let spotPtr = 0;
    const place = (count, near, far, gap) => {
      const out = []; let tries = 0;
      const share = Math.round((spots.length * count) / mixTotal), end = Math.min(spots.length, spotPtr + share);
      for (; spotPtr < end && out.length < count; spotPtr++) {
        const { x, z } = spots[spotPtr], gd = groundAt(x, z);
        if (gd.d < (gd.flat ?? 0) + gap || inKeepOut(x, z, gap + 3) || !clearOfTrack(x, z, gap + 1) || props.blocked(x, z, gap) || mapRes.blocked(x, z, gap * 0.5)) continue;
        out.push({ x, z, h: gd.h, sc: 0.75 + rnd() * 0.8, yaw: rnd() * 6.283, r: rnd() });
      }
      if (spots.length > 400) count = out.length + Math.round(count * 0.2);
      while (out.length < count && tries++ < count * 12) {
        const i = Math.floor(rnd() * N), s = rnd() < 0.5 ? -1 : 1, off = s * (W[sideK(s)][i] + near + rnd() ** 1.7 * far);
        const x = X[i] + LX[i] * off, z = Z[i] + LZ[i] * off, gd = groundAt(x, z); if (gd.d < (gd.flat ?? 0) + gap || inKeepOut(x, z, gap + 3) || !clearOfTrack(x, z, gap + 1) || props.blocked(x, z, gap) || mapRes.blocked(x, z, gap)) continue;
        out.push({ x, z, h: gd.h, sc: 0.75 + rnd() * 0.8, yaw: rnd() * 6.283, r: rnd() });
      }
      return out;
    };
    const cellsOf = (list, size = 300) => { const cells = new Map(); for (const t of list) { const key = Math.floor(t.x / size) * 10007 + Math.floor(t.z / size); if (!cells.has(key)) cells.set(key, []); cells.get(key).push(t); } return [...cells.values()]; };
    const add = (m, pad = 8) => { if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); m.boundingSphere.radius += pad; group.add(m); };
    const V = new THREE.Vector3(), Sv = new THREE.Vector3(), c = new THREE.Color();
    const trunkM = new THREE.MeshStandardMaterial({ color: 0x4A3826, roughness: 1 });
    // firs
    if (MIX.fir) {
      const mat = new THREE.MeshStandardMaterial({ map: T.needle, roughness: 0.95 }); T.needle.repeat.set(2, 2);
      const tierG = [0, 1, 2].map((t) => new THREE.ConeGeometry(3.4 - t * 0.9, 4.2, 7, 1, true)), trunkG = new THREE.CylinderGeometry(0.25, 0.4, 4, 5, 1, true);
      for (const list of cellsOf(place(MIX.fir, 9, 330, 7))) {
        const tiers = tierG.map((g) => new THREE.InstancedMesh(g, mat, list.length)), trunks = new THREE.InstancedMesh(trunkG, trunkM, list.length);
        list.forEach((t, j) => { c.setHSL(0.28 + t.r * 0.06, 0.25 + t.r * 0.15, 0.36 + (1 - t.r) * 0.14); for (let k = 0; k < 3; k++) { q.setFromAxisAngle(up, t.yaw + k); m4.compose(V.set(t.x, t.h + (4 + k * 2.6) * t.sc, t.z), q, Sv.setScalar(t.sc)); tiers[k].setMatrixAt(j, m4); tiers[k].setColorAt(j, c); } m4.compose(V.set(t.x, t.h + 2 * t.sc, t.z), q, Sv.setScalar(t.sc)); trunks.setMatrixAt(j, m4); });
        for (const m of [...tiers, trunks]) add(m);
      }
    }
    // broad-leaved trees and bushes: a trunk and a lumpy round crown
    for (const [kind, count] of [["leafy", MIX.leafy], ["bush", MIX.bush]]) {
      if (!count) continue;
      const bush = kind === "bush", leafM = new THREE.MeshStandardMaterial({ map: T.leaf, roughness: 0.95, flatShading: true });
      const crownG = new THREE.IcosahedronGeometry(1, 1); { const p = crownG.attributes.position; for (let v = 0; v < p.count; v++) { const f = 0.85 + Math.sin(p.getX(v) * 7.1 + p.getZ(v) * 5.3) * 0.12 + Math.cos(p.getY(v) * 6.7) * 0.08; p.setXYZ(v, p.getX(v) * f, p.getY(v) * f * 0.85, p.getZ(v) * f); } crownG.computeVertexNormals(); }
      const trunkG = new THREE.CylinderGeometry(0.22, 0.35, 1, 5, 1, true);
      for (const list of cellsOf(place(count, bush ? 4 : 8, bush ? 160 : 300, bush ? 4.5 : 8))) {
        const crowns = new THREE.InstancedMesh(crownG, leafM, list.length), trunks = bush ? null : new THREE.InstancedMesh(trunkG, trunkM, list.length);
        list.forEach((t, j) => {
          const r = bush ? 1.2 + t.r * 1.4 : 3 + t.r * 2.6, th = bush ? 0 : 2.5 + t.r * 2.5;
          c.setHSL(0.22 + t.r * 0.1, sandy ? 0.22 : 0.35, (sandy ? 0.32 : 0.3) + (1 - t.r) * 0.12);
          q.setFromAxisAngle(up, t.yaw); m4.compose(V.set(t.x, t.h + th + r * 0.75, t.z), q, Sv.set(r, r, r)); crowns.setMatrixAt(j, m4); crowns.setColorAt(j, c);
          if (trunks) { m4.compose(V.set(t.x, t.h + th / 2 + 0.3, t.z), q, Sv.set(1, th + 0.6, 1)); trunks.setMatrixAt(j, m4); }
        });
        add(crowns); if (trunks) add(trunks);
      }
    }
    // palms: a tall thin trunk and a crown of drooping fronds
    if (MIX.palm) {
      const frondG = (() => { const parts = []; for (let f = 0; f < 7; f++) { const g = new THREE.ConeGeometry(0.55, 4.2, 3, 1, true); g.translate(0, 2.1, 0); g.rotateX(1.25 + (f % 2) * 0.25); g.rotateY((f / 7) * Math.PI * 2); parts.push(g.toNonIndexed()); } const pos = []; for (const g of parts) pos.push(...g.attributes.position.array); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g; })();
      const palmTrunk = new THREE.CylinderGeometry(0.16, 0.26, 1, 6, 1, true), frondM = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.9, side: THREE.DoubleSide, flatShading: true }), barkM = new THREE.MeshStandardMaterial({ color: 0x8A7558, roughness: 1 });
      for (const list of cellsOf(place(MIX.palm, SC === "desert" ? 6 : 7, SC === "desert" ? 90 : 220, 6))) {
        const crowns = new THREE.InstancedMesh(frondG, frondM, list.length), trunks = new THREE.InstancedMesh(palmTrunk, barkM, list.length);
        list.forEach((t, j) => { const ht = 7 + t.r * 7; c.setHSL(0.24 + t.r * 0.06, 0.45, 0.28 + t.r * 0.1); q.setFromAxisAngle(up, t.yaw); m4.compose(V.set(t.x, t.h + ht / 2, t.z), q, Sv.set(1, ht, 1)); trunks.setMatrixAt(j, m4); m4.compose(V.set(t.x, t.h + ht, t.z), q, Sv.setScalar(0.9 + t.r * 0.3)); crowns.setMatrixAt(j, m4); crowns.setColorAt(j, c); });
        add(crowns); add(trunks);
      }
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
        const s = Math.sign(tr.K[at(j)]) > 0 ? 1 : -1; // on the outside of the approach
        for (const d of [150, 100, 50]) { const kk = at(i + Math.max(0, (j - i) - d)), b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.08), mats[d]); const o = s * (half + 2.2); b.position.set(X[kk] + LX[kk] * o, hAt(kk, o) + 1.1, Z[kk] + LZ[kk] * o); b.rotation.y = Math.atan2(TX[kk], TZ[kk]) + Math.PI; group.add(b); }
        i = j;
      }
    }
  }

  // ---------- Tecpro reacting to hits: the physics squashes tr.dent where the car goes in; here the
  // modules, spacers and banner nearby are moved to match. They stay that way until the session restarts. ----------
  const barriers = {
    hit(h) {
      if (!h || !h.soft) return;
      const d0 = dist[h.idx];
      for (const bl of tec.blocks) {
        if (bl.k !== h.side) continue;
        let dd = bl.d - d0; if (dd > tr.len / 2) dd -= tr.len; if (dd < -tr.len / 2) dd += tr.len;
        if (Math.abs(dd) > 8) continue;
        // a glancing hit drags the modules round a little in the direction the car was going
        const tw = Math.max(-0.28, Math.min(0.28, (0.05 + Math.abs(h.along || 0) * 0.005) * (((bl.d * 7.31 + bl.row * 3.7) % 2) < 1 ? 1 : -1)));
        if (Math.abs(tw) > Math.abs(bl.twist)) bl.twist = tw;
        tec.dirty.add(bl);
      }
      for (const bn of tec.banners) if (bn.k === h.side) bn.dirty = true;
    },
    update() {
      if (tec.dirty.size) { for (const bl of tec.dirty) poseBlock(bl); tec.dirty.clear(); }
      for (const ch of tec.chunks) if (ch.dirty) { ch.mesh.instanceMatrix.needsUpdate = true; ch.spacers.instanceMatrix.needsUpdate = true; ch.dirty = false; }
      for (const bn of tec.banners) if (bn.dirty) {
        const p = bn.mesh.geometry.attributes.position, dent = tr.dent[bn.k];
        bn.idx.forEach((i, n) => { const o = bn.s * (W[bn.k][i] + dent[i] - 0.025); for (const v of [n * 2, n * 2 + 1]) { p.setX(v, X[i] + LX[i] * o); p.setZ(v, Z[i] + LZ[i] * o); } });
        p.needsUpdate = true; bn.dirty = false;
      }
    },
    // only draw barrier sections near the camera (they're small; far away they're just pixels)
    cull(cam) { const r2 = tec.cullR * tec.cullR; for (const ch of tec.chunks) { const v = ch.center.distanceToSquared(cam) < (tec.cullR + ch.radius) ** 2 || ch.center.distanceToSquared(cam) < r2; ch.mesh.visible = ch.spacers.visible = v; } },
    reset() {
      tr.dent[0].fill(0); tr.dent[1].fill(0);
      for (const bl of tec.blocks) { bl.twist = 0; poseBlock(bl); }
      for (const bn of tec.banners) bn.dirty = true;
      barriers.update();
    },
  };
  return { group, groundAt, barriers, pitInfo };
}

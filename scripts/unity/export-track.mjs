// Exports a circuit and the car from the web game for the Unity version:
//   unity/com.racelimit.game/Tracks/<slug>/<slug>.glb   the whole circuit as the web game builds it (track, kerbs,
//        run-off, walls, terrain, real buildings, trees…), plus invisible wall strips for collisions (material
//        "rl_col_wall") and four axis markers (RL_O / RL_X / RL_Y / RL_Z, 100 m apart) so Unity can work out how the
//        importer turned the axes
//   unity/com.racelimit.game/Tracks/<slug>/<slug>.track.json   the centre line, widths and walls (for lap timing,
//        resets, the minimap), in the same (three.js) coordinates as the markers
//   unity/com.racelimit.game/Cars/car.glb   the car, wheels named RL_Wheel_FL/FR/RL/RR
// Ground materials are named rl_ground_<surface> in trackmesh.js; Unity gives those colliders and a surface type.
// Needs the local server: (cd public && python3 -m http.server 8791). Run: node scripts/unity/export-track.mjs spa
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const ROOT = new URL("../../", import.meta.url).pathname, OUT = ROOT + "unity/com.racelimit.game/";
const id = process.argv[2] || "spa", BASE = process.env.BASE || "http://localhost:8791/";
const THREE_EX = process.env.THREE_EX; // folder holding three r160 examples/jsm (GLTFExporter.js and utils/)
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 800, height: 450 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.route("**/vendor/three/addons/exporters/GLTFExporter.js", (r) => r.fulfill({ contentType: "text/javascript", body: readFileSync(THREE_EX + "/exporters/GLTFExporter.js") }));
await p.route("**/vendor/three/addons/utils/TextureUtils.js", (r) => r.fulfill({ contentType: "text/javascript", body: readFileSync(THREE_EX + "/utils/TextureUtils.js") }));
await p.goto(`${BASE}race/index.html?track=${id}&place=0&speed=0&cam=chase`);
await p.waitForFunction(() => window.__race && window.__circuit && document.getElementById("loading").hidden, null, { timeout: 240000 });
await p.waitForTimeout(1500);
const res = await p.evaluate(async () => {
  const THREE = await import("three"), { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
  const { tr } = window.__race, G = window.__circuit, r2 = (v) => Math.round(v * 100) / 100, r1 = (v) => Math.round(v * 10) / 10;
  // ---- the circuit: everything visible, minus what glTF can't carry (points, sprites, lines, custom shaders) ----
  const drop = [];
  G.traverse((o) => { if (o.isPoints || o.isSprite || o.isLine || o.material?.isShaderMaterial || o.material?.isPointsMaterial) drop.push(o); else o.visible = true; });
  for (const o of drop) o.parent?.remove(o);
  G.traverse((o) => { o.userData = {}; });
  // instanced scenery (Tecpro modules, spacers, trees…) baked into ordinary meshes, one per 150 m square, so Unity
  // gets a few hundred objects instead of tens of thousands; the busiest shapes simplified to the same size first
  const simplify = (g, mat) => {
    const t = (g.index ? g.index.count : g.attributes.position.count) / 3; if (t <= 40) return g;
    g.computeBoundingBox(); const bb = g.boundingBox, sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z, c = new THREE.Vector3(); bb.getCenter(c);
    let ng;
    if (mat.name === "rl_tecpro") { // a low-poly pill: 8 outline points with smooth side normals and a flat top (24 vertices)
      const L = Math.max(sx, sz), D = Math.min(sx, sz), r = D / 2, ol = [];
      for (let k = 0; k <= 3; k++) { const a = -Math.PI / 2 + (k / 3) * Math.PI; ol.push([L / 2 - r + Math.cos(a) * r, Math.sin(a) * r, Math.cos(a), Math.sin(a)]); }
      for (let k = 0; k <= 3; k++) { const a = Math.PI / 2 + (k / 3) * Math.PI; ol.push([-L / 2 + r + Math.cos(a) * r, Math.sin(a) * r, Math.cos(a), Math.sin(a)]); }
      const P = [], Nn = [], I = [], y0 = bb.min.y, y1 = bb.max.y, n = ol.length, along = sz > sx;
      const put = (u, w, y, nu, nw) => { if (along) P.push(w + c.x, y, u + c.z), Nn.push(nw, 0, nu); else P.push(u + c.x, y, w + c.z), Nn.push(nu, 0, nw); };
      for (const [u, w, nu, nw] of ol) { put(u, w, y0, nu, nw); put(u, w, y1, nu, nw); }
      for (let k = 0; k < n; k++) { const a0 = 2 * k, a1 = 2 * ((k + 1) % n); I.push(a0, a1, a0 + 1, a0 + 1, a1, a1 + 1); }
      const t0 = P.length / 3; for (const [u, w] of ol) { if (along) P.push(w + c.x, y1, u + c.z); else P.push(u + c.x, y1, w + c.z); Nn.push(0, 1, 0); }
      for (let k = 1; k < n - 1; k++) I.push(t0, t0 + k + 1, t0 + k);
      ng = new THREE.BufferGeometry(); ng.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); ng.setAttribute("normal", new THREE.Float32BufferAttribute(Nn, 3)); ng.setIndex(I);
      // (winding: make every triangle face along its normal)
      const pa = ng.attributes.position, na = ng.attributes.normal, ia = ng.index.array, A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(), Nv = new THREE.Vector3();
      for (let t = 0; t < ia.length; t += 3) { A.fromBufferAttribute(pa, ia[t]); B.fromBufferAttribute(pa, ia[t + 1]); Cc.fromBufferAttribute(pa, ia[t + 2]); const fn = B.sub(A).cross(Cc.sub(A)); Nv.fromBufferAttribute(na, ia[t]); if (fn.dot(Nv) < 0) { const tmp = ia[t + 1]; ia[t + 1] = ia[t + 2]; ia[t + 2] = tmp; } }
      return ng;
    } else if (g.type === "BoxGeometry") { ng = new THREE.BoxGeometry(sx, sy, sz); ng.translate(c.x, c.y, c.z); }
    else return g;
    return ng.index ? ng : ng;
  };
  const bake = [];
  G.updateMatrixWorld(true);
  G.traverse((o) => { if (o.isInstancedMesh) bake.push(o); });
  // (one merged mesh per material and 150 m square, in the circuit's own frame)
  const acc = new Map(), gInv = new THREE.Matrix4().copy(G.matrixWorld).invert();
  for (const im of bake) {
    const g0 = simplify(im.geometry, im.material), g = g0;
    const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, col = g.attributes.color, idx = g.index ? g.index.array : Array.from({ length: pos.count }, (_, i) => i);
    const m4 = new THREE.Matrix4(), w4 = new THREE.Matrix4(), nm = new THREE.Matrix3(), ic = new THREE.Color(), p3 = new THREE.Vector3(), n3 = new THREE.Vector3(), base4 = new THREE.Matrix4().multiplyMatrices(gInv, im.matrixWorld);
    for (let k = 0; k < im.count; k++) {
      im.getMatrixAt(k, m4); w4.multiplyMatrices(base4, m4); nm.getNormalMatrix(w4); if (im.instanceColor) im.getColorAt(k, ic); else ic.setRGB(1, 1, 1);
      p3.setFromMatrixPosition(w4); const key = im.material.uuid + "|" + Math.floor(p3.x / 150) + "," + Math.floor(p3.z / 150);
      if (!acc.has(key)) acc.set(key, { mat: im.material, P: [], N: [], U: [], C: [], I: [], hasUV: !!uv });
      const A = acc.get(key), b0 = A.P.length / 3;
      for (let q = 0; q < pos.count; q++) {
        p3.fromBufferAttribute(pos, q).applyMatrix4(w4); A.P.push(p3.x, p3.y, p3.z);
        if (nor) n3.fromBufferAttribute(nor, q).applyMatrix3(nm).normalize(); else n3.set(0, 1, 0); A.N.push(n3.x, n3.y, n3.z);
        if (A.hasUV) A.U.push(uv ? uv.getX(q) : 0, uv ? uv.getY(q) : 0);
        A.C.push((col ? col.getX(q) : 1) * ic.r, (col ? col.getY(q) : 1) * ic.g, (col ? col.getZ(q) : 1) * ic.b);
      }
      for (const t of idx) A.I.push(b0 + t);
    }
    if (im.instanceColor || col) im.material.vertexColors = true;
    im.parent.remove(im);
  }
  for (const A of acc.values()) {
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(A.P, 3)); bg.setAttribute("normal", new THREE.Float32BufferAttribute(A.N, 3));
    if (A.hasUV) bg.setAttribute("uv", new THREE.Float32BufferAttribute(A.U, 2)); bg.setAttribute("color", new THREE.Float32BufferAttribute(A.C, 3)); bg.setIndex(A.I);
    const mesh = new THREE.Mesh(bg, A.mat); mesh.name = (A.mat.name || "scenery") + "_baked"; G.add(mesh);
  }
  // collision walls: a 2.5 m strip along every barrier (the track's both sides, the pit lane's), breaking where it's open
  const colMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, name: "rl_col_wall" }), col = new THREE.Group(); col.name = "RL_Collision";
  const wallStrip = (n, pt, closed, name) => {
    let run = [];
    const flush = () => { if (run.length > 1) { const pos = [], idx = []; run.forEach(([x, y, z], k) => { pos.push(x, y - 0.6, z, x, y + 1.9, z); if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); }); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, colMat); m.name = name; col.add(m); } run = []; };
    for (let i = 0; i <= n; i++) { if (!closed && i === n) break; const q = pt(i % n); if (!q) { flush(); continue; } run.push(q); if (run.length >= 400) { const last = run[run.length - 1]; flush(); run.push(last); } }
    flush();
  };
  for (const [k, s] of [[0, 1], [1, -1]]) wallStrip(tr.N, (i) => { const o = s * tr.wall[k][i]; return [tr.X[i] + tr.LX[i] * o, tr.yAt(i, o), tr.Z[i] + tr.LZ[i] * o]; }, true, k ? "RL_Wall_R" : "RL_Wall_L");
  const P = tr.pitRoad;
  if (P) for (const [k, s] of [[0, 1], [1, -1]]) wallStrip(P.N, (i) => { const w = P.wall[k][i]; if (w >= 40) return null; const o = s * w; return [P.X[i] + P.LX[i] * o, P.Y[i], P.Z[i] + P.LZ[i] * o]; }, false, k ? "RL_PitWall_R" : "RL_PitWall_L");
  G.add(col);
  const marks = [["RL_O", 0, 0, 0], ["RL_X", 100, 0, 0], ["RL_Y", 0, 100, 0], ["RL_Z", 0, 0, 100]].map(([n, x, y, z]) => { const o = new THREE.Object3D(); o.name = n; o.position.set(x, y, z); G.add(o); return o; });
  const ex = new GLTFExporter(), toB64 = (buf) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const glb = await ex.parseAsync(G, { binary: true, onlyVisible: false, maxTextureSize: 1024 });
  // ---- the car, at the origin facing +Z, wheels named ----
  const car = window.__car, saved = { p: car.position.clone(), q: car.quaternion.clone() };
  car.position.set(0, 0, 0); car.quaternion.identity(); car.updateMatrixWorld(true);
  for (const w of car.userData.wheels ?? []) { const pv = w.group.parent, wp = new THREE.Vector3(); w.group.getWorldPosition(wp); const nm = `${wp.z > 0 ? "F" : "R"}${wp.x > 0 ? "L" : "R"}`; pv.name = "RL_Wheel_" + nm; w.group.name = "RL_WheelSpin_" + nm; }
  // (what the cockpit view hides or shows, and where the driver's eyes are, kept as names before the userData goes)
  const ck = car.userData.ck ?? 0; let hn = 0;
  car.traverse((o) => { if (o.userData.helmet || o.userData.lid || o.userData.inner || o.userData.extTub) o.name = "RL_HideInCockpit_" + hn++; else if (o.userData.cockpitOnly) o.name = "RL_CockpitOnly_" + hn++; });
  car.traverse((o) => { o.userData = {}; });
  const carDrop = []; car.traverse((o) => { if (o.isPoints || o.isSprite || o.isLine || o.material?.isShaderMaterial) carDrop.push(o); });
  for (const o of carDrop) o.parent?.remove(o);
  car.name = "RL_Car";
  const carGlb = await ex.parseAsync(car, { binary: true, onlyVisible: true, maxTextureSize: 1024 });
  car.position.copy(saved.p); car.quaternion.copy(saved.q);
  // ---- the track data ----
  // (flat arrays, so Unity's JsonUtility can read them)
  const A = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const pk = P ? A(Math.ceil(P.N / 2), (k) => k * 2) : [];
  const data = {
    slug: tr.cfg.slug, name: tr.cfg.name, half: tr.half, len: r1(tr.len), street: !!tr.street, n: tr.N,
    x: A(tr.N, (i) => r2(tr.X[i])), y: A(tr.N, (i) => r2(tr.Y[i])), z: A(tr.N, (i) => r2(tr.Z[i])), wallL: A(tr.N, (i) => r1(tr.wall[0][i])), wallR: A(tr.N, (i) => r1(tr.wall[1][i])),
    corners: tr.corners.map((c) => ({ n: c.n, name: c.name, i: c.i })),
    hasPit: !!P, pitLimitFrom: P ? r1(P.limitFrom) : 0, pitLimitTo: P ? r1(P.limitTo) : 0, pitX: pk.map((i) => r2(P.X[i])), pitY: pk.map((i) => r2(P.Y[i])), pitZ: pk.map((i) => r2(P.Z[i])), pitDist: pk.map((i) => r1(P.dist[i])),
    carEyeZ: Math.round(ck * 1000) / 1000, wheelRadius: 0.352,
    note: "x,y,z in three.js metres: Unity maps them with the RL_O/X/Y/Z markers in the .glb. wallL/wallR: barrier distance from the centre line.",
  };
  return { glb: toB64(glb), car: toB64(carGlb), data: JSON.stringify(data), info: { tris: (() => { let t = 0; G.traverse((o) => { if (o.isMesh) t += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); }); return Math.round(t); })(), dropped: drop.length } };
});
const slug = JSON.parse(res.data).slug, dir = OUT + "Tracks/" + slug + "/";
mkdirSync(dir, { recursive: true }); mkdirSync(OUT + "Cars", { recursive: true });
writeFileSync(dir + slug + ".glb", Buffer.from(res.glb, "base64"));
// (squeezed with gltfpack when it's there: 16-bit positions, 8-bit normals — KHR_mesh_quantization, which glTFast reads —
// and meshes sharing a material merged; names, materials and extras kept. Spa: ~77 MB → ~38 MB)
if (process.env.GLTFPACK) { const { execFileSync } = await import("node:child_process"); execFileSync("node", [process.env.GLTFPACK, "-i", dir + slug + ".glb", "-o", dir + slug + ".glb", "-kn", "-km", "-ke"], { stdio: "inherit" }); }
writeFileSync(dir + slug + ".track.json", res.data);
writeFileSync(OUT + "Cars/car.glb", Buffer.from(res.car, "base64"));
console.log(slug, "glb", (Buffer.from(res.glb, "base64").length / 1e6).toFixed(1), "MB", "car", (Buffer.from(res.car, "base64").length / 1e6).toFixed(1), "MB", JSON.stringify(res.info));
await b.close();

// Renders the Track Builder's output (the JSON Program.cs writes) with three.js, from a few cameras.
// node render.mjs <meshes.json> <outPrefix> [cam …]   cam = "name:index:height:back:ahead" or "top"
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const [file, out, ...cams] = process.argv.slice(2);
const ROOT = new URL("../../../", import.meta.url).pathname;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on("pageerror", (e) => console.log("ERR", e.message)); p.on("console", (m) => { if (m.type() !== "warning") console.log(m.text()); });
await p.route("http://x/**", (r) => {
  const u = new URL(r.request().url()).pathname;
  if (u === "/d.json") return r.fulfill({ body: readFileSync(file), contentType: "application/json" });
  if (u === "/three.js") return r.fulfill({ body: readFileSync(ROOT + "public/vendor/three/three.module.min.js"), contentType: "text/javascript" });
  return r.fulfill({ contentType: "text/html", body: `<html><body style="margin:0"><script type="importmap">{"imports":{"three":"/three.js"}}</script><script type="module">
import * as THREE from "three";
const D = await (await fetch("/d.json")).json();
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setSize(1280, 720); R.shadowMap.enabled = true; R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(R.domElement);
const S = new THREE.Scene(); S.background = new THREE.Color(0xBCD2E8); S.fog = new THREE.Fog(0xBCD2E8, 400, 2600);
S.add(new THREE.HemisphereLight(0xE4EEF8, 0x56603F, 1.15)); const sun = new THREE.DirectionalLight(0xFFF2DC, 2.2); sun.position.set(-300, 600, -200); S.add(sun);
const tex = (draw, w = 128, h = 128, rep = [1, 1]) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(...rep); return t; };
const noise = (base, v) => (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < w * h / 3; i++) { const k = (Math.random() - 0.5) * v; g.fillStyle = "rgba(" + (k > 0 ? "255,255,255," : "0,0,0,") + Math.abs(k) + ")"; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } };
const C = {
  rl_ground_track: { color: 0x4A4D53 }, rl_ground_track_pit: { color: 0x55585E }, rl_ground_line: { color: 0xF2F2F2 }, rl_ground_line_paint: { color: 0xF4F4F4 },
  rl_ground_runoff: { color: 0x5C626C }, rl_ground_gravel: { color: 0xC9B48A }, rl_ground_gravel_sand: { color: 0xE3D3A6 }, rl_ground_grass: { color: 0x4F8A35 },
  rl_concrete: { color: 0xC4C1B8 }, rl_armco: { color: 0xC9CED4, metalness: 0.6, roughness: 0.35 }, rl_post: { color: 0x7C838C }, rl_fence: { color: 0x9AA3AD, transparent: true, opacity: 0.35 },
  rl_garage: { color: 0xE6E8EC }, rl_garage_door: { color: 0x1A1D22 }, rl_ground_kerb: { color: 0xC62B2F },
};
for (const m of D.meshes) {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(m.v, 3)); g.setIndex(m.t); g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide, ...(C[m.mat] ?? { color: 0xff00ff }) });
  if (m.mat === "rl_ground_kerb") { const uv = []; for (let i = 0; i < m.v.length / 3; i++) uv.push(0, Math.floor(i / 2)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); mat.map = tex((c, w, h) => { c.fillStyle = "#C62B2F"; c.fillRect(0, 0, w, h); c.fillStyle = "#F2F2F2"; c.fillRect(0, h / 2, w, h / 2); }, 8, 8, [1, 0.5]); mat.color.set(0xffffff); }
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = m.mat.includes("line") ? 2 : 0; if (m.mat.includes("line") || m.mat.includes("kerb")) { mat.polygonOffset = true; mat.polygonOffsetFactor = -2; } S.add(mesh);
}
// terrain
{ const T = D.terrain, n = T.res, g = new THREE.PlaneGeometry(T.s[0], T.s[2], n - 1, n - 1); g.rotateX(-Math.PI / 2); const pa = g.attributes.position;
  for (let zi = 0; zi < n; zi++) for (let xi = 0; xi < n; xi++) { const i = zi * n + xi; pa.setXYZ(i, T.o[0] + xi * T.s[0] / (n - 1), T.o[1] + T.h[zi * n + xi] * T.s[1], T.o[2] + zi * T.s[2] / (n - 1)); }
  g.computeVertexNormals(); S.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x5A8F3C, roughness: 1 }))); }
// trees
{ const cone = new THREE.ConeGeometry(2.6, 9, 7); cone.translate(0, 6, 0); const im = new THREE.InstancedMesh(cone, new THREE.MeshStandardMaterial({ color: 0x24502A }), D.trees.length / 3); const m4 = new THREE.Matrix4();
  for (let i = 0; i < D.trees.length / 3; i++) { m4.makeTranslation(D.trees[3 * i], D.trees[3 * i + 1], D.trees[3 * i + 2]); im.setMatrixAt(i, m4); } S.add(im); }
// Tecpro (as boxes, blue and white, the rows from the data)
{ const cx = D.cx, n = cx.length / 3, box = new THREE.BoxGeometry(0.55, 1.2, 1.0); box.translate(0, 0.6, 0); const list = [[], []];
  for (let i = 0; i < n; i += 1) for (let k = 0; k < 2; k++) { const rows = D.tec[4 * i + k]; if (!rows) continue; const j = (i + 1) % n, h = (i - 1 + n) % n; const fx = cx[3 * j] - cx[3 * h], fz = cx[3 * j + 2] - cx[3 * h + 2], L = Math.hypot(fx, fz), lx = -fz / L, lz = fx / L, s = k ? -1 : 1, w = D.tec[4 * i + 2 + k];
    for (let r = 0; r < rows; r++) { const o = s * (w + r * 0.58 + 0.275); list[(i + r) & 1].push([cx[3 * i] + lx * o, cx[3 * i + 1], cx[3 * i + 2] + lz * o, Math.atan2(fx, fz)]); } }
  [0x2E5FAE, 0xE9ECEF].forEach((col, q) => { const im = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ color: col }), list[q].length); const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(); list[q].forEach(([x, y, z, a], i) => { qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a); m4.compose(new THREE.Vector3(x, y, z), qq, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); }); S.add(im); }); }
const cam = new THREE.PerspectiveCamera(55, 16 / 9, 0.3, 8000);
window.shoot = (spec) => { const cx = D.cx, n = cx.length / 3;
  S.fog = spec === "top" ? null : new THREE.Fog(0xBCD2E8, 400, 2600);
  if (spec === "top") { let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; for (let i = 0; i < n; i++) { mnx = Math.min(mnx, cx[3 * i]); mxx = Math.max(mxx, cx[3 * i]); mnz = Math.min(mnz, cx[3 * i + 2]); mxz = Math.max(mxz, cx[3 * i + 2]); } cam.position.set((mnx + mxx) / 2, 2600, (mnz + mxz) / 2 + 1); cam.up.set(0, 0, -1); cam.lookAt((mnx + mxx) / 2, 0, (mnz + mxz) / 2); cam.fov = 45; }
  else { const [, i0, hh, bk, ah] = spec.split(":").map(Number); const i = ((i0 % n) + n) % n, a = ((i - bk) % n + n) % n, t = (i + ah) % n; cam.up.set(0, 1, 0); cam.fov = 55; cam.position.set(cx[3 * a], cx[3 * a + 1] + hh, cx[3 * a + 2]); cam.lookAt(cx[3 * t], cx[3 * t + 1] + 1, cx[3 * t + 2]); }
  cam.updateProjectionMatrix(); R.render(S, cam); };
window.ready = true;
</script></body></html>` });
});
await p.goto("http://x/index.html");
await p.waitForFunction(() => window.ready, null, { timeout: 300000 });
for (const c of cams) { const name = c.split(":")[0]; await p.evaluate((s) => window.shoot(s), c); await p.screenshot({ path: `${out}-${name}.png` }); }
await b.close();

// RaceLimit Race — step 1: one car at Spa. Drive with the keyboard or a controller.
import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { CIRCUITS, buildTrack, speedProfile, racingLine } from "./trackdata.js?v=mvdq8sd5";
import { newCar, stepCar, resetCar, ENVELOPE } from "./physics.js?v=mvdq8sd5";
import { buildCircuit } from "./trackmesh.js?v=mvdq8sd5";
import { createInput } from "./input.js?v=mvdq8sd5";
import { createHud } from "./hud.js?v=mvdq8sd5";
import { createEngineAudio } from "./audio.js?v=mvdq8sd5";
import { mergeCar } from "./optimize.js?v=mvdq8sd5";
import { sfx } from "../games/sfx.js?v=mvdq8sd5";
import { load, save } from "../games/common.js?v=mvdq8sd5";

const q = new URLSearchParams(location.search);
const circuitId = q.get("track") && CIRCUITS[q.get("track")] ? q.get("track") : "spa";
const CFG = CIRCUITS[circuitId];
const $ = (id) => document.getElementById(id);
const status = (t) => { $("loadText").textContent = t; return new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))); };
const settings = Object.assign({ auto: true, abs: true, tc: true, line: "full", camera: "chase", quality: "high" }, load("race.settings", {}));
const saveSettings = () => save("race.settings", settings);

// ---------- renderer, sky, light ----------
const view = $("view");
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, settings.quality === "high" ? 1.5 : 1));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.78;
renderer.outputColorSpace = THREE.SRGBColorSpace;
view.prepend(renderer.domElement);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(58, 1, 0.05, 12000);
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 36), THREE.MathUtils.degToRad(140));
{
  const sky = new Sky(); sky.scale.setScalar(10000);
  const u = sky.material.uniforms; u.turbidity.value = 6; u.rayleigh.value = 2.4; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.8; u.sunPosition.value.copy(sunDir);
  scene.add(sky);
  const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene(), s2 = new Sky(); s2.scale.setScalar(1000);
  for (const k of ["turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG"]) s2.material.uniforms[k].value = u[k].value;
  s2.material.uniforms.sunPosition.value.copy(sunDir); env.add(s2);
  scene.environment = pm.fromScene(env, 0.02).texture;
}
scene.fog = new THREE.FogExp2(0xB9C9D8, 0.00042);
const sun = new THREE.DirectionalLight(0xFFF2E0, 2.5);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 300 });
scene.add(sun, sun.target, new THREE.HemisphereLight(0xC8DAF0, 0x55604E, 0.5));

function applyQuality() { const hi = settings.quality !== "low"; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, hi ? 1.5 : 1)); sun.castShadow = hi; resize(); }
function resize() { const w = view.clientWidth, h = view.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener("resize", resize); applyQuality();

// ---------- track ----------
await status("Loading the circuit…");
const raw = await (await fetch(`../data/tracks/${CFG.slug}.json`)).json();
const tr = buildTrack(raw, CFG);
const line = racingLine(tr);
const vp = speedProfile({ ...tr, K: line.K }, ENVELOPE, 0.95);
await status("Building the track…");
buildCircuit(tr, scene, { profile: vp });

// racing line: a thin strip on the asphalt, coloured green / yellow / red by how fast you're going
const crown = (o) => { const a = Math.abs(o), h = tr.half; return a < h / 2 ? 0.05 - (a / (h / 2)) * 0.015 : Math.max(0, 0.035 - ((a - h / 2) / (h / 2 + 0.6)) * 0.035); };
const lineMesh = (() => {
  const N = tr.N, pos = new Float32Array((N + 1) * 2 * 3), col = new Float32Array((N + 1) * 2 * 3), idx = [];
  for (let k = 0; k <= N; k++) {
    const i = k % N, o = line.off[i], y = tr.Y[i] + crown(o) + 0.014;
    for (const [m, w] of [[0, -0.24], [1, 0.24]]) { const p = (k * 2 + m) * 3; pos[p] = line.x[i] + tr.LX[i] * w; pos[p + 1] = y; pos[p + 2] = line.z[i] + tr.LZ[i] * w; col[p] = 0.2; col[p + 1] = 0.85; col[p + 2] = 0.45; }
    if (k < N) idx.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 1, k * 2 + 2, k * 2 + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.renderOrder = 1; scene.add(m); return m;
})();
function colourLine(c) {
  const attr = lineMesh.geometry.attributes.color, a = attr.array, u = Math.max(0, c.u), N = tr.N;
  for (let k = -40; k < 420; k++) {
    const i = tr.wrap(c.idx + k), v = vp[i], braking = settings.line === "braking";
    let r = 0.2, g = 0.85, b = 0.45;
    if (u > v + 1.5) { r = 0.95; g = 0.2; b = 0.18; } else if (u > v - 6) { r = 0.98; g = 0.78; b = 0.15; } else if (braking) { r = g = b = -1; }
    for (const kk of i === 0 ? [i, N] : [i]) for (const m of [0, 1]) { const p = (kk * 2 + m) * 3; if (r < 0) { a[p] = a[p + 1] = a[p + 2] = 0; } else { a[p] = r; a[p + 1] = g; a[p + 2] = b; } }
  }
  attr.needsUpdate = true;
}
const applyLineMode = () => { lineMesh.visible = settings.line !== "off"; lineMesh.material.blending = settings.line === "braking" ? THREE.AdditiveBlending : THREE.NormalBlending; };
applyLineMode();

// ---------- the car ----------
await status("Building the car…");
const { f1car } = await import("./car.js?v=mvdq8sd5");
const livery = { era: 2026, team: "RACELIMIT", body: "#FFA51F", accent: "#16171B", stripe: "#F4F4F4", number: "27", helmet: ["#FFA51F", "#16171B"], tcam: "#111" };
const car = f1car({ ...livery, aero: "corner" });
{
  // the 2026 wings move: build the "straight mode" car too and keep its flaps, hidden, in the same places
  const other = f1car({ ...livery, aero: "straight" }), a = [], b = [];
  car.traverse((m) => m.isMesh && a.push(m)); other.traverse((m) => m.isMesh && b.push(m));
  if (a.length === b.length) for (let k = 0; k < a.length; k++) {
    const pa = a[k].geometry.attributes.position, pb = b[k].geometry.attributes.position;
    if (pa.count !== pb.count) continue;
    let diff = false; for (let j = 0; j < pa.array.length && !diff; j += 97) if (Math.abs(pa.array[j] - pb.array[j]) > 1e-4) diff = true;
    if (diff || a[k].rotation.x !== b[k].rotation.x) { a[k].userData.aero = "corner"; b[k].userData.aero = "straight"; b[k].visible = false; a[k].parent.add(b[k]); }
  }
}
const CK = car.userData.ck;
car.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; if (m.material?.clearcoat !== undefined) { m.material.envMapIntensity = 0.4; m.material.clearcoat = Math.min(m.material.clearcoat, 0.3); } } });
// wheels: a steering pivot around each wheel so the front ones can turn while they spin
const wheels = (car.userData.wheels ?? []).map((w) => { const pivot = new THREE.Group(); pivot.position.copy(w.group.position); w.group.parent.add(pivot); pivot.add(w.group); w.group.position.set(0, 0, 0); return { ...w, pivot }; });
const merged = mergeCar(car, [...wheels.map((w) => w.pivot), car.userData.steering]);
for (const w of wheels) mergeCar(w.group); if (car.userData.steering) mergeCar(car.userData.steering);
scene.add(car);
let aeroShown = "corner";
const showAero = (mode) => { if (mode === aeroShown) return; aeroShown = mode; car.traverse((m) => { if (m.userData.aero) m.visible = m.userData.aero === mode; }); };
let cockpitShown = false;
const showCockpit = (on) => { if (on === cockpitShown) return; cockpitShown = on; car.traverse((m) => { if (m.userData.helmet || m.userData.lid || m.userData.inner || m.userData.extTub) m.visible = !on; if (m.userData.cockpitOnly) m.visible = on; }); };

// ---------- game state ----------
const hud = createHud($("hud"), tr);
const input = createInput();
let audio = null;
const c = newCar(tr, tr.wrap(-14), tr.half * 0.45);
const VIEWS = ["chase", "far", "tcam", "cockpit"];
let viewMode = VIEWS.includes(q.get("cam")) ? q.get("cam") : VIEWS.includes(settings.camera) ? settings.camera : "chase";
const best = load(`race.best.${circuitId}`, null); // { time, trace: [seconds at every 25 m] }
const T = { lap: 1, running: false, now: 0, lapStart: 0, lastLap: null, bestLap: best?.time ?? null, invalid: false, sectors: [null, null, null], delta: null, trace: [], bestTrace: best?.trace ?? null, bestSectors: [null, null, null], secStart: 0, nextSec: 0, offT: 0 };
const secAt = [CFG.sectors[0] * tr.len, CFG.sectors[1] * tr.len, tr.len];
let phase = "menu", lightsT = 0, lightsOutAt = 0, paused = false, lastS = c.s, wrongT = 0;

function startLights() {
  phase = "lights"; lightsT = 0; lightsOutAt = 5 + 0.4 + Math.random() * 2.2; hud.lights(0);
  Object.assign(c, newCar(tr, tr.wrap(-14), tr.half * 0.45)); lastS = c.s;
  Object.assign(T, { lap: 1, running: false, lapStart: 0, invalid: false, sectors: [null, null, null], delta: null, trace: [], nextSec: 0, offT: 0, half: false, standing: true });
}
function lapDone() {
  const time = T.now - T.lapStart;
  T.lastLap = time;
  if (T.standing) hud.message(`Lap ${fmtT(time)} (from the grid)`, 2.5);
  else if (!T.invalid && (T.bestLap == null || time < T.bestLap)) {
    const first = T.bestLap == null; T.bestLap = time; T.bestTrace = T.trace.slice();
    save(`race.best.${circuitId}`, { time, trace: T.bestTrace, at: Date.now() });
    hud.message(first ? `Lap time ${fmtT(time)}` : `New best lap ${fmtT(time)}`, 3, "good");
  } else if (T.invalid) hud.message("Lap deleted: track limits", 2.5, "bad");
  else hud.message(`Lap ${fmtT(time)}  (+${(time - T.bestLap).toFixed(3)})`, 2.5);
  T.lap++; T.lapStart = T.now; T.invalid = false; T.trace = []; T.nextSec = 0; T.secStart = T.now; T.offT = 0; T.standing = false;
}
const fmtT = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(3).padStart(6, "0")}`;
function timing(dt) {
  if (!T.running) return;
  const s = c.s;
  // crossing the line (forwards)
  if (s > tr.len * 0.5 && s < tr.len * 0.6) T.half = true; // must get round the lap before the line counts
  if (lastS > tr.len * 0.9 && s < tr.len * 0.1 && c.u > 0 && T.half) {
    T.half = false;
    if (T.nextSec === 2) { const st = T.now - T.secStart; secDone(2, st); }
    lapDone();
  } else if (T.nextSec < 2 && s >= secAt[T.nextSec] && lastS < secAt[T.nextSec] && s - lastS < 100) { secDone(T.nextSec, T.now - T.secStart); T.nextSec++; T.secStart = T.now; }
  lastS = s;
  const slot = Math.floor(s / 25); if (T.trace[slot] == null && s < tr.len - 1 && !T.standing) T.trace[slot] = T.now - T.lapStart;
  T.delta = !T.standing && T.bestTrace?.[slot] != null && slot > 0 ? T.now - T.lapStart - T.bestTrace[slot] : null;
  // track limits: all four wheels off for a moment deletes the lap
  if (c.offTrack) { T.offT += dt; if (T.offT > 0.25 && !T.invalid) { T.invalid = true; hud.message("Track limits: lap deleted", 2.2, "bad"); } } else T.offT = 0;
}
function secDone(i, time) {
  if (i === 0) T.sectors = [null, null, null];
  const bestS = T.bestSectors[i], cls = T.invalid ? "inv" : bestS == null || time < bestS ? "purple" : "yellow";
  if (!T.invalid && (bestS == null || time < bestS)) T.bestSectors[i] = time;
  T.sectors[i] = { time, cls };
}

// ---------- menus ----------
const menu = $("menu"), pauseEl = $("pause");
function syncSettingsUI() {
  for (const el of document.querySelectorAll("[data-set]")) { const [k, v] = el.dataset.set.split("="); el.setAttribute("aria-pressed", String(String(settings[k]) === v)); }
  $("muteBtn").textContent = audio?.muted() ?? load("muted", false) ? "Sound: off" : "Sound: on";
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-set]"); if (!b) return;
  const [k, v] = b.dataset.set.split("="); settings[k] = v === "true" ? true : v === "false" ? false : v; saveSettings();
  if (k === "line") applyLineMode(); if (k === "camera") viewMode = v; if (k === "quality") applyQuality(); syncSettingsUI();
});
$("muteBtn").addEventListener("click", () => { const m = !(audio?.muted() ?? load("muted", false)); if (audio) audio.setMuted(m); else save("muted", m); syncSettingsUI(); });
$("startBtn").addEventListener("click", () => { menu.hidden = true; audio ??= createEngineAudio(); audio.resume(); startLights(); });
$("resumeBtn").addEventListener("click", () => setPause(false));
$("restartBtn").addEventListener("click", () => { setPause(false); startLights(); });
function setPause(p) { paused = p; pauseEl.hidden = !p; if (p) syncSettingsUI(); }
syncSettingsUI();
$("bestLine").textContent = best ? `Your best here: ${fmtT(best.time)}` : "No lap set here yet";
$("loading").hidden = true; menu.hidden = false;
if (q.get("auto") === "1") $("startBtn").click();
if (q.get("place")) { const i = tr.wrap(+q.get("place")); Object.assign(c, newCar(tr, i, line.off[i])); c.u = (+q.get("speed") || 0) / 3.6; c.gear = 6; phase = "race"; hud.lights(-1); T.running = true; menu.hidden = true; audio ??= createEngineAudio(); lastS = c.s; }

// ---------- autopilot (for testing and the menu backdrop): follows the racing line ----------
function autopilot() {
  const ld = 8 + Math.max(c.u, 0) * 0.5, j = tr.wrap(c.idx + Math.round(ld));
  const dx = line.x[j] - c.x, dz = line.z[j] - c.z, fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), lx = Math.cos(c.yaw), lz = -Math.sin(c.yaw);
  const fwd = dx * fx + dz * fz, left = dx * lx + dz * lz, delta = Math.atan2(2 * 3.4 * left, fwd * fwd + left * left), dMax = 0.34 / (1 + Math.max(0, c.u) / 40);
  const vt = vp[tr.wrap(c.idx + 3 + Math.round(c.u * 0.15))] * 0.97;
  return { steer: Math.max(-1, Math.min(1, delta / dMax)), throttle: Math.max(0, Math.min(1, (vt - c.u) * 0.6 + 0.2)), brake: Math.max(0, Math.min(1, (c.u - vt) * 0.8)), analog: true };
}
window.__cam = cam; window.__race = { c, tr, T, get phase() { return phase; }, autopilot: q.get("autopilot") === "1", view: (v) => (viewMode = v), frames: 0, ms: 0, merged };

// ---------- loop ----------
const tmpV = new THREE.Vector3(), tmpL = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
let camInit = false, lastT = performance.now(), acc = 0, prevGear = 1, simT = 0;
const STEP = 1 / 240, WARP = +q.get("warp") || 0; // warp: seconds of simulation per frame (testing only)
function frame(now) {
  requestAnimationFrame(frame);
  window.__race.frames++;
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  const inp = input.poll();
  if (inp.pause && phase !== "menu") setPause(!paused);
  if (inp.mute && audio) { audio.setMuted(!audio.muted()); syncSettingsUI(); }
  if (inp.camera) { viewMode = VIEWS[(VIEWS.indexOf(viewMode) + 1) % VIEWS.length]; settings.camera = viewMode; saveSettings(); }
  if (inp.line) { settings.line = { full: "braking", braking: "off", off: "full" }[settings.line]; saveSettings(); applyLineMode(); hud.message(`Racing line: ${settings.line}`, 1.2); }
  const opts = { auto: settings.auto, abs: settings.abs, tc: settings.tc, aeroAuto: true };
  if (!paused && phase !== "menu") {
    // start lights
    if (phase === "lights") {
      lightsT += dt;
      const n = Math.min(5, Math.floor(lightsT));
      if (n !== hud._n && n > 0) { hud._n = n; hud.lights(n); sfx.light(); }
      if (lightsT >= lightsOutAt) { phase = "race"; hud.lights(-1); hud._n = 0; T.running = true; T.lapStart = T.now; T.secStart = T.now; hud.message("GO!", 1, "good"); }
    }
    if (inp.reset && phase === "race") { resetCar(c, tr); hud.message("Back on track", 1); }
    acc += WARP || dt;
    let drive = window.__race.autopilot ? autopilot() : inp;
    if (phase === "lights") drive = { ...drive, brake: 1, steer: 0 };
    let n = 0;
    while (acc >= STEP && n < (WARP ? WARP * 240 + 2 : 10)) {
      let i2 = n === 0 ? drive : { ...drive, up: false, down: false };
      if (window.__race.autopilot && n % 4 === 0) { i2 = autopilot(); if (phase === "lights") i2.brake = 1; drive = i2; }
      stepCar(c, i2, tr, STEP, opts);
      if (phase === "lights") { c.u = Math.min(c.u, 0); c.v = 0; c.r = 0; lightsT += WARP ? STEP : 0; if (WARP && lightsT >= lightsOutAt) { phase = "race"; hud.lights(-1); T.running = true; T.lapStart = T.now; T.secStart = T.now; } }
      T.now += STEP; simT += STEP; timing(STEP);
      if (c.impact > 3 && audio) audio.thump(c.impact);
      acc -= STEP; n++;
    }
    if (!WARP && n >= 10) acc = 0;
    if (c.gear !== prevGear) { audio?.shift(); prevGear = c.gear; }
    // wrong way
    const along = Math.sin(c.yaw) * tr.TX[c.idx] + Math.cos(c.yaw) * tr.TZ[c.idx];
    wrongT = along < -0.3 && c.u > 3 ? wrongT + dt : 0;
    if (wrongT > 1.2) { hud.message("Wrong way — press R to reset", 1.5, "bad"); wrongT = -2; }
  }
  // ----- car pose -----
  const kerbJ = c.kerb ? (Math.random() - 0.5) * 0.012 * Math.min(1, c.u / 20) : 0;
  const along = Math.sin(c.yaw) * tr.TX[c.idx] + Math.cos(c.yaw) * tr.TZ[c.idx];
  const slopePitch = -Math.atan(tr.slope[c.idx] * along);
  const surfY = Math.abs(c.lat) < tr.half + 0.6 ? crown(c.lat) : c.kerb ? 0.06 : -0.01;
  car.position.set(c.x, c.y + surfY + kerbJ, c.z);
  car.rotation.set(slopePitch + c.pitch, c.yaw, c.roll, "YXZ");
  for (const w of wheels) { w.group.rotation.x = c.wheelRot; if (w.front) w.pivot.rotation.y = c.steer; }
  if (car.userData.steering) car.userData.steering.rotation.z = -c.steer * 4.2;
  showAero(c.aeroMode);
  // ----- camera -----
  const fwd = tmpV.set(Math.sin(c.yaw), 0, Math.cos(c.yaw));
  const k = 1 - Math.exp(-dt * 7);
  const v = inp.back ? "back" : viewMode;
  if (WARP) camInit = false;
  showCockpit(v === "cockpit");
  if (v === "cockpit" || v === "tcam") {
    car.updateMatrixWorld();
    const eye = v === "cockpit" ? new THREE.Vector3(0, 0.83, CK - 0.14) : new THREE.Vector3(0, 1.2, CK - 0.62);
    cam.position.copy(car.localToWorld(eye));
    cam.lookAt(car.localToWorld(v === "cockpit" ? new THREE.Vector3(0, 0.3, CK + 14) : new THREE.Vector3(0, 0.75, CK + 20)));
    cam.fov = v === "cockpit" ? 66 : 62; cam.near = 0.02; camInit = false;
  } else {
    const back = v === "far" ? 10.5 : v === "back" ? -6 : 7.0, up = v === "far" ? 3.3 : v === "back" ? 1.8 : 2.1;
    const want = tmpL.set(c.x, c.y, c.z).addScaledVector(fwd, -back).add(new THREE.Vector3(0, up, 0));
    if (!camInit || v === "back") { camPos.copy(want); camInit = v !== "back"; } else camPos.lerp(want, k);
    cam.position.copy(camPos);
    camLook.set(c.x, c.y + 0.9, c.z).addScaledVector(fwd, v === "back" ? -20 : 5);
    cam.lookAt(camLook);
    cam.fov = 56 + Math.min(10, Math.max(0, c.u) * 0.09); cam.near = 0.1;
  }
  cam.updateProjectionMatrix();
  // ----- light follows the car -----
  sun.target.position.set(c.x, c.y, c.z); sun.position.copy(sun.target.position).addScaledVector(sunDir, 120);
  if (lineMesh.visible) colourLine(c);
  hud.update(c, T, opts);
  audio?.update(c, { paused: paused || phase === "menu", view: v });
  const r0 = performance.now(); renderer.render(scene, cam); window.__race.ms = performance.now() - r0; window.__race.info = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
}
requestAnimationFrame(frame);

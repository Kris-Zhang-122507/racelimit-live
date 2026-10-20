// RaceLimit Race — step 1: one car at Spa. Drive with the keyboard or a controller.
import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { CIRCUITS, buildTrack, speedProfile, racingLine } from "./trackdata.js?v=mvh86vc8";
import { newCar, stepCar, resetCar, ENVELOPE, CAR, COMPOUNDS, fitTyres, TYRE_NAMES } from "./physics.js?v=mvh86vc8";
import { buildCircuit } from "./trackmesh.js?v=mvh86vc8";
import { createInput } from "./input.js?v=mvh86vc8";
import { createHud } from "./hud.js?v=mvh86vc8";
import { createEngineAudio } from "./audio.js?v=mvh86vc8";
import { mergeCar } from "./optimize.js?v=mvh86vc8";
import { sfx } from "../games/sfx.js?v=mvh86vc8";
import { load, save } from "../games/common.js?v=mvh86vc8";

const q = new URLSearchParams(location.search);
const settings = Object.assign({ auto: true, abs: true, tc: true, stability: true, line: "full", camera: "chase", quality: "high", engine: "raw", hud: "normal", hudInfo: "full" }, load("race.settings", {}));
// (the display went back to normal size once it showed more: "bigger" was meant as "more on it")
if (!settings.hudV) { settings.hud = "normal"; settings.hudV = 2; }
// the on-screen display's size (Settings): every panel is scaled together
const applyHud = () => document.documentElement.style.setProperty("--hud", { normal: 1, large: 1.2, xl: 1.4 }[settings.hud] ?? 1);
applyHud();
const saveSettings = () => save("race.settings", settings);
// ---------- what to drive: the menus (skipped when the address says what, for testing) ----------
const { f1car, drawWheelScreen, TEAMS, setTyreLook } = await import("./car.js?v=mvh86vc8");
let choice;
if (q.get("track") || q.get("place") || q.get("auto")) choice = { track: q.get("track") && CIRCUITS[q.get("track")] ? q.get("track") : "spa", session: q.get("session") || (q.get("auto") ? "grid" : "practice") };
else { document.getElementById("loading").hidden = true; const { openMenus } = await import("./menu.js?v=mvh86vc8"); choice = await openMenus({ CIRCUITS, settings, saveSettings, TEAMS }); document.getElementById("loading").hidden = false; }
const circuitId = choice.track, CFG = CIRCUITS[circuitId], SESSION = choice.session;
document.title = `${CFG.short} · Race — RaceLimit Live`;
const $ = (id) => document.getElementById(id);
const status = (t) => { $("loadText").textContent = t; return new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))); };

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
// the light: daytime, dusk (Abu Dhabi) or a night race under floodlights
const TIME = CFG.time ?? "day";
const LIGHT = {
  day: { sunEl: 36, sunAz: 140, sunCol: 0xFFF2E0, sun: 2.5, hemi: [0xC8DAF0, 0x55604E, 0.5], fog: 0xB9C9D8, fogD: 0.00042, exposure: 0.78, sky: { turbidity: 6, rayleigh: 2.4, mieCoefficient: 0.004, mieDirectionalG: 0.8 } },
  dusk: { sunEl: 5, sunAz: 250, sunCol: 0xFFB27A, sun: 1.7, hemi: [0xF2C6A0, 0x4A4038, 0.65], fog: 0xD8A98A, fogD: 0.0005, exposure: 0.72, sky: { turbidity: 9, rayleigh: 3.2, mieCoefficient: 0.006, mieDirectionalG: 0.85 } },
  // at night the "sun" is the floodlights: high up, white, softer shadows; the sky itself is dark
  night: { sunEl: 68, sunAz: 120, sunCol: 0xEEF2FF, sun: 1.25, hemi: [0x9FB4DA, 0x2A2C33, 0.85], fog: 0x0A0F1C, fogD: 0.0007, exposure: 1.0, skyEl: -6, sky: { turbidity: 2, rayleigh: 0.6, mieCoefficient: 0.002, mieDirectionalG: 0.7 } },
}[TIME];
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - LIGHT.sunEl), THREE.MathUtils.degToRad(LIGHT.sunAz));
const skySun = LIGHT.skyEl != null ? new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - LIGHT.skyEl), THREE.MathUtils.degToRad(LIGHT.sunAz)) : sunDir;
renderer.toneMappingExposure = LIGHT.exposure;
{
  const sky = new Sky(); sky.scale.setScalar(10000);
  const u = sky.material.uniforms; for (const k in LIGHT.sky) u[k].value = LIGHT.sky[k]; u.sunPosition.value.copy(skySun);
  if (TIME === "night") {
    // a night sky: deep blue overhead, lighter towards the horizon where the city and the floodlights glow
    scene.background = new THREE.Color(0x070A13);
    const glow = CFG.scenery === "city" ? [0.42, 0.3, 0.32] : [0.2, 0.25, 0.42];
    const dome = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0.01, 0.015, 0.04) }, mid: { value: new THREE.Color(0.06, 0.09, 0.19) }, hor: { value: new THREE.Color(...glow) } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 hor; varying vec3 vP; void main(){ float y = max(vP.y, 0.0); vec3 c = mix(hor, mid, smoothstep(0.0, 0.12, y)); c = mix(c, top, smoothstep(0.12, 0.6, y)); gl_FragColor = vec4(c, 1.0); }",
    }));
    dome.renderOrder = -1; dome.onBeforeRender = () => dome.position.copy(cam.position); scene.add(dome);
  } else scene.add(sky);
  const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene(), s2 = new Sky(); s2.scale.setScalar(1000);
  for (const k of ["turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG"]) s2.material.uniforms[k].value = u[k].value;
  s2.material.uniforms.sunPosition.value.copy(TIME === "night" ? sunDir : skySun); env.add(s2);
  scene.environment = pm.fromScene(env, 0.02).texture;
  if (TIME === "night") scene.environmentIntensity = 0.35;
}
scene.fog = new THREE.FogExp2(LIGHT.fog, LIGHT.fogD);
const sun = new THREE.DirectionalLight(LIGHT.sunCol, LIGHT.sun);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 300 });
scene.add(sun, sun.target, new THREE.HemisphereLight(...LIGHT.hemi));

function applyQuality() { const hi = settings.quality !== "low"; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, hi ? 1.5 : 1)); sun.castShadow = hi; resize(); }
function resize() { const w = view.clientWidth, h = view.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener("resize", resize); applyQuality();

// ---------- track ----------
await status("Loading the circuit…");
const raw = await (await fetch(`../data/tracks/${CFG.slug}.json`)).json();
// the real shape, heights and pit lane (from F1's position data), if we have them for this circuit
const real = await fetch(`../data/race/${CFG.slug}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
// and its real surroundings from OpenStreetMap, lined up with the track (buildings, water, tunnels, gravel traps…)
const map = await fetch(`../data/race-world/${CFG.slug}.json?v=mvh86vc8`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const tr = buildTrack(raw, CFG, real, map);
const line = racingLine(tr);
const vp = speedProfile({ ...tr, K: line.K }, ENVELOPE, 0.95);
// for the racing line's colours: the most you can carry into each corner (braking a fair bit less hard than the car
// can, so the red starts early enough to react to), without the limit on how fast it can accelerate out of the last
// one — so a straight never shows red just because you came out of a corner well
const vpCue = speedProfile({ ...tr, K: line.K }, { ...ENVELOPE, accel: () => 1e4, brake: (v) => ENVELOPE.brake(v) * 0.72 }, 0.93);
await status("Building the track…");
const myTeam = TEAMS.find((t) => t.team === load("race.team", "RACELIMIT")) ?? TEAMS[0];
const circuit = buildCircuit(tr, scene, { profile: vp, team: myTeam });

// racing line: a thin strip on the asphalt, coloured green / yellow / red by how fast you're going
const crown = (o) => { const a = Math.abs(o), h = tr.half; return a < h / 2 ? 0.05 - (a / (h / 2)) * 0.015 : Math.max(0, 0.035 - ((a - h / 2) / (h / 2 + 0.6)) * 0.035); };
const lineMesh = (() => {
  const N = tr.N, pos = new Float32Array((N + 1) * 2 * 3), col = new Float32Array((N + 1) * 2 * 3), idx = [];
  for (let k = 0; k <= N; k++) {
    const i = k % N, o = line.off[i];
    for (const [m, w] of [[0, -0.27], [1, 0.27]]) { const p = (k * 2 + m) * 3, y = tr.yAt(i, o + w) + crown(o) + 0.022; pos[p] = line.x[i] + tr.LX[i] * w; pos[p + 1] = y; pos[p + 2] = line.z[i] + tr.LZ[i] * w; col[p] = 0.2; col[p + 1] = 0.85; col[p + 2] = 0.45; }
    if (k < N) idx.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 1, k * 2 + 2, k * 2 + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.82, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
  m.renderOrder = 1; scene.add(m); return m;
})();
// The whole lap is coloured every frame, ahead of the car by the speed you'll be doing when you get there if you stay
// flat out from here (and brake only where you have to): red where that's more than you can take, amber just before.
// So every braking zone shows at its full length from far away, not only once you're already going fast enough.
function colourLine(c) {
  const attr = lineMesh.geometry.attributes.color, a = attr.array, u = Math.max(0, c.u), N = tr.N, braking = settings.line === "braking";
  let up = u;
  for (let k = -40; k < N - 40; k++) {
    const i = tr.wrap(c.idx + k), v = vpCue[i], s = k < 0 ? u : up;
    let r = 0.2, g = 0.85, b = 0.45;
    const lim = v < ENVELOPE.vmax - 1; // (a corner, or braking for one, limits the speed here)
    if (lim && s > v + 0.5) { r = 0.95; g = 0.2; b = 0.18; } else if (lim && s > v - 9) { r = 0.98; g = 0.78; b = 0.15; } else if (braking) { r = g = b = -1; }
    if (k >= 0) { const ds = tr.dist[tr.wrap(i + 1)] - tr.dist[i]; up = Math.min(up, v); up = Math.sqrt(up * up + 2 * ENVELOPE.accel(up) * (ds > 0 ? ds : 1)); }
    for (const kk of i === 0 ? [i, N] : [i]) for (const m of [0, 1]) { const p = (kk * 2 + m) * 3; if (r < 0) { a[p] = a[p + 1] = a[p + 2] = 0; } else { a[p] = r; a[p + 1] = g; a[p + 2] = b; } }
  }
  attr.needsUpdate = true;
}
const applyLineMode = () => { lineMesh.visible = settings.line !== "off"; lineMesh.material.blending = settings.line === "braking" ? THREE.AdditiveBlending : THREE.NormalBlending; };
applyLineMode();

// ---------- the car ----------
await status("Building the car…");
const team = TEAMS.find((t) => t.team === load("race.team", "RACELIMIT")) ?? TEAMS[0];
const livery = { era: 2026, team: team.team, body: team.body, accent: team.accent, stripe: team.stripe, number: team.number, helmet: team.helmet, tcam: "#111" };
const startTyre = COMPOUNDS[load("race.tyre", "medium")] ? load("race.tyre", "medium") : "medium";
const tyreLabel = (k) => `C · ${COMPOUNDS[k].name.toUpperCase()}`;
const car = f1car({ ...livery, aero: "corner", compound: COMPOUNDS[startTyre].color, compoundName: tyreLabel(startTyre) });
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
// the driver's arms: each hangs from its shoulder and follows the glove on the steering wheel
const arms = [];
car.updateMatrixWorld(true);
car.traverse((m) => { if (m.isMesh && m.userData.wheel && !isInside(m, car.userData.steering)) arms.push(m); });
function isInside(o, root) { for (let p = o; p; p = p.parent) if (p === root) return true; return false; }
const armRig = arms.map((m) => {
  const len = m.geometry.parameters?.depth ?? 0.37, dir = new THREE.Vector3(0, 0, 1).applyQuaternion(m.quaternion);
  const shoulder = m.position.clone().addScaledVector(dir, -len / 2), pivot = new THREE.Group();
  pivot.position.copy(shoulder); car.add(pivot); pivot.add(m); m.position.set(0, 0, len / 2); m.quaternion.identity();
  pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  return { pivot, mesh: m, len, side: Math.sign(shoulder.x) };
});
const merged = mergeCar(car, [...wheels.map((w) => w.pivot), car.userData.steering, ...armRig.map((a) => a.pivot)]);
for (const w of wheels) mergeCar(w.group); if (car.userData.steering) mergeCar(car.userData.steering);
// suspension: everything except the wheels sits on a "body" that moves on springs (dives under braking,
// squats when accelerating, rolls in corners, rides the bumps and sinks with downforce); the wheels stay on the road
const body = new THREE.Group();
for (const ch of [...car.children]) if (!wheels.some((w) => w.pivot === ch)) body.add(ch);
car.add(body);
const susp = { y: null, v: 0 };
scene.add(car);
let aeroShown = "corner";
const showAero = (mode) => { if (mode === aeroShown) return; aeroShown = mode; car.traverse((m) => { if (m.userData.aero) m.visible = m.userData.aero === mode; }); };
let cockpitShown = false;
const showCockpit = (on) => { if (on === cockpitShown) return; cockpitShown = on; car.traverse((m) => { if (m.userData.helmet || m.userData.lid || m.userData.inner || m.userData.extTub) m.visible = !on; if (m.userData.cockpitOnly) m.visible = on; }); };

// ---------- sparks: the plank and skid blocks scraping the ground at high speed, more over bumps,
// compressions and kerbs. Short glowing streaks thrown out behind the car. ----------
const SPK = 240, spk = { pos: new Float32Array(SPK * 3), vel: new Float32Array(SPK * 3), life: new Float32Array(SPK), max: new Float32Array(SPK), next: 0, acc: 0 };
const spkGeo = new THREE.BufferGeometry(), spkLine = new Float32Array(SPK * 6), spkCol = new Float32Array(SPK * 6);
spkGeo.setAttribute("position", new THREE.BufferAttribute(spkLine, 3)); spkGeo.setAttribute("color", new THREE.BufferAttribute(spkCol, 3));
const sparks = new THREE.LineSegments(spkGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
sparks.frustumCulled = false; scene.add(sparks);
const _sp = new THREE.Vector3();
function updateSparks(c, dt) {
  const u = Math.max(0, c.u), i = c.idx, bump = Math.abs(tr.slope[tr.wrap(i + 3)] - tr.slope[tr.wrap(i - 3)]);
  const rate = c.onPit || u < 60 ? 0 : (u - 60) * (0.5 + bump * 260 + (c.kerb ? 2.5 : 0) + (c.surface === "track" ? 0 : -0.5)) * 1.1;
  spk.acc += Math.max(0, rate) * dt;
  while (spk.acc >= 1) {
    spk.acc -= 1; const n = spk.next; spk.next = (n + 1) % SPK;
    _sp.set((Math.random() - 0.5) * 0.7, 0.04, -1.0 - Math.random() * 1.1); car.localToWorld(_sp);
    spk.pos.set([_sp.x, _sp.y, _sp.z], n * 3);
    const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), keep = 0.45 + Math.random() * 0.3, side = (Math.random() - 0.5) * 6;
    spk.vel.set([fx * u * keep + Math.cos(c.yaw) * side, 0.8 + Math.random() * 2.6, fz * u * keep - Math.sin(c.yaw) * side], n * 3);
    spk.life[n] = spk.max[n] = 0.18 + Math.random() * 0.32;
  }
  for (let n = 0; n < SPK; n++) {
    const p = n * 3, l = n * 6;
    if (spk.life[n] <= 0) { spkLine.fill(0, l, l + 6); spkCol.fill(0, l, l + 6); continue; }
    spk.life[n] -= dt; spk.vel[p + 1] -= 9.8 * dt;
    for (let a = 0; a < 3; a++) spk.pos[p + a] += spk.vel[p + a] * dt;
    const t = Math.max(0, spk.life[n] / spk.max[n]), tail = 0.018;
    spkLine[l] = spk.pos[p]; spkLine[l + 1] = spk.pos[p + 1]; spkLine[l + 2] = spk.pos[p + 2];
    spkLine[l + 3] = spk.pos[p] - spk.vel[p] * tail; spkLine[l + 4] = spk.pos[p + 1] - spk.vel[p + 1] * tail; spkLine[l + 5] = spk.pos[p + 2] - spk.vel[p + 2] * tail;
    const b = (TIME === "night" ? 1.6 : 1.1) * t; spkCol.set([b, b * 0.82, b * 0.45, b * 0.7, b * 0.32, b * 0.08], l);
  }
  spkGeo.attributes.position.needsUpdate = true; spkGeo.attributes.color.needsUpdate = true;
}

// ---------- game state ----------
const SESSION_NAME = { practice: "Practice", hotlap: "Hot laps", daily: "Daily challenge", grid: "Race start" }[SESSION] ?? "";
const hud = createHud($("hud"), tr, { vp, session: SESSION_NAME, circuit: CFG.name });
const applyHudInfo = () => hud.setSimple(settings.hudInfo === "simple");
applyHudInfo();
const input = createInput();
let audio = null;
const c = newCar(tr, tr.wrap(-14), tr.half * 0.45);
const VIEWS = ["chase", "far", "tcam", "cockpit"];
let viewMode = VIEWS.includes(q.get("cam")) ? q.get("cam") : VIEWS.includes(settings.camera) ? settings.camera : "chase";
const best = load(`race.best.${circuitId}`, null); // { time, trace: [seconds at every 25 m] }
const T = { lap: 1, running: false, now: 0, lapStart: 0, lastLap: null, bestLap: best?.time ?? null, invalid: false, sectors: [null, null, null], delta: null, trace: [], bestTrace: best?.trace ?? null, bestSectors: [null, null, null], secStart: 0, nextSec: 0, offT: 0 };
const SECT = CFG.sectors ?? [0.33, 0.67], secAt = [SECT[0] * tr.len, SECT[1] * tr.len, tr.len];
let pitStop = null, wasLimiter = false, wasPit = false; // pit lane state (see pits())
let wheelDrawnAt = 0, tyreWarned = {}, nextTyre = startTyre;
let phase = "menu", lightsT = 0, lightsOutAt = 0, paused = false, lastS = c.s, wrongT = 0;

function startLights() {
  phase = "lights"; lightsT = 0; lightsOutAt = 5 + 0.4 + Math.random() * 2.2; hud.lights(0);
  Object.assign(c, newCar(tr, tr.wrap(-14), tr.half * 0.45)); lastS = c.s; circuit.barriers.reset(); pitStop = null; fitTyres(c, startTyre, 70); tyreWarned = {};
  Object.assign(T, { lap: 1, running: false, lapStart: 0, invalid: false, sectors: [null, null, null], delta: null, trace: [], nextSec: 0, offT: 0, half: false, standing: true });
}
// sessions. practice: start in your garage's box and drive out of the pit lane; hot laps (and the daily
// challenge): a rolling start on the way to the line. Either way the first lap starts at the line.
function startSession() {
  circuit.barriers.reset(); pitStop = null; hud.lights(-1); phase = "race";
  const box = circuit.pitInfo?.boxes?.[0], R = tr.pitRoad;
  if (SESSION === "practice" && box && R) {
    const i = tr.nearestGlobal(box.x, box.z, 4).i;
    Object.assign(c, newCar(tr, i >= 0 ? i : 0, 0));
    c.x = box.x; c.z = box.z; c.yaw = box.yaw; c.onPit = true; c.pidx = box.pidx; c.y = R.Y[box.pidx];
    pitStop = { t: 0, dur: 0, done: true }; // already in the box: no stop until you've left it
  } else {
    const i = tr.wrap(-650); Object.assign(c, newCar(tr, i, line.off[i])); c.u = vp[i] * 0.95;
    c.gear = 1; while (c.gear < 8 && (12000 * c.u * 3.6) / CAR.tops[c.gear - 1] > 11200) c.gear++;
  }
  // tyres: from the blankets in the garage (70 °C), or already warm on a flying lap
  fitTyres(c, startTyre, SESSION === "practice" ? 70 : 92); setTyreLook(car, COMPOUNDS[startTyre].color, tyreLabel(startTyre)); tyreWarned = {};
  lastS = c.s;
  Object.assign(T, { lap: 0, running: true, lapStart: T.now, invalid: false, sectors: [null, null, null], delta: null, trace: [], nextSec: 0, offT: 0, half: true, standing: false, outLap: true });
  hud.message(SESSION === "practice" ? "Practice: drive out of the pit lane" : SESSION === "daily" ? `Daily challenge: ${CFG.short} — one flying lap counts` : "Hot laps: the clock starts at the line", 3);
}
function lapDone() {
  const time = T.now - T.lapStart;
  if (SESSION === "daily" && !T.invalid) { const key = `race.daily.${new Date().toISOString().slice(0, 10)}`, prev = load(key, null); if (prev == null || time < prev) save(key, time); }
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
  if (lastS > tr.len * 0.9 && s < tr.len * 0.1 && c.u > 0 && T.half && T.outLap && c.onPit) { lastS = s; return; } // crossing the line in the pit lane doesn't start a timed lap
  if (lastS > tr.len * 0.9 && s < tr.len * 0.1 && c.u > 0 && T.half && T.outLap) {
    // the out lap ends at the line: from here every lap is timed
    Object.assign(T, { outLap: false, half: false, lap: 1, lapStart: T.now, secStart: T.now, nextSec: 0, trace: [], invalid: false, sectors: [null, null, null] });
    hud.message("Timed lap", 1.4, "good"); lastS = s; return;
  } else if (lastS > tr.len * 0.9 && s < tr.len * 0.1 && c.u > 0 && T.half) {
    T.half = false;
    if (T.nextSec === 2) { const st = T.now - T.secStart; secDone(2, st); }
    lapDone();
  } else if (T.nextSec < 2 && s >= secAt[T.nextSec] && lastS < secAt[T.nextSec] && s - lastS < 100) { secDone(T.nextSec, T.now - T.secStart); T.nextSec++; T.secStart = T.now; }
  lastS = s;
  if (T.outLap) { lastS = s; return; }
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
const pauseEl = $("pause");
function syncSettingsUI() {
  for (const el of document.querySelectorAll("[data-set]")) { const [k, v] = el.dataset.set.split("="); el.setAttribute("aria-pressed", String(String(settings[k]) === v)); }
  $("muteBtn").textContent = audio?.muted() ?? load("muted", false) ? "Sound: off" : "Sound: on";
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-set]"); if (!b) return;
  const [k, v] = b.dataset.set.split("="); settings[k] = v === "true" ? true : v === "false" ? false : v; saveSettings();
  if (k === "line") applyLineMode(); if (k === "camera") viewMode = v; if (k === "quality") applyQuality(); if (k === "hud") applyHud(); if (k === "hudInfo") applyHudInfo(); if (k === "engine") audio?.setEngine(v); syncSettingsUI();
});
$("muteBtn").addEventListener("click", () => { const m = !(audio?.muted() ?? load("muted", false)); if (audio) audio.setMuted(m); else save("muted", m); syncSettingsUI(); });
$("resumeBtn").addEventListener("click", () => setPause(false));
$("restartBtn").addEventListener("click", () => { setPause(false); if (SESSION === "grid") startLights(); else startSession(); });
$("menuBtn").addEventListener("click", () => { location.href = location.pathname; });
function setPause(p) { paused = p; pauseEl.hidden = !p; if (p) syncSettingsUI(); }
syncSettingsUI();
$("loading").hidden = true;
// sound needs a click or key press first (browsers' rule); the menu click usually counts
audio ??= createEngineAudio({ engine: settings.engine }); audio.resume();
addEventListener("pointerdown", () => audio?.resume(), { once: true }); addEventListener("keydown", () => audio?.resume(), { once: true });
if (SESSION === "grid") startLights(); else startSession();
if (q.get("place")) { const i = tr.wrap(+q.get("place")); Object.assign(c, newCar(tr, i, line.off[i])); c.u = (+q.get("speed") || 0) / 3.6; c.gear = 6; phase = "race"; hud.lights(-1); T.running = true; T.outLap = false; T.half = false; lastS = c.s; }

// ---------- autopilot (for testing and the menu backdrop): follows the racing line ----------
function autopilot() {
  const ld = 8 + Math.max(c.u, 0) * 0.5, j = tr.wrap(c.idx + Math.round(ld));
  const dx = line.x[j] - c.x, dz = line.z[j] - c.z, fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), lx = Math.cos(c.yaw), lz = -Math.sin(c.yaw);
  const fwd = dx * fx + dz * fz, left = dx * lx + dz * lz, delta = Math.atan2(2 * 3.4 * left, fwd * fwd + left * left), dMax = 0.34 / (1 + Math.max(0, c.u) / 40);
  const vt = vp[tr.wrap(c.idx + 3 + Math.round(c.u * 0.15))] * 0.97;
  return { steer: Math.max(-1, Math.min(1, delta / dMax)), throttle: Math.max(0, Math.min(1, (vt - c.u) * 0.6 + 0.2)), brake: Math.max(0, Math.min(1, (c.u - vt) * 0.8)), analog: true };
}
window.__scene = scene; window.__car = car; window.__circuit = circuit.group; window.__cam = cam; window.__sw = car.userData.steering; window.__race = { c, tr, T, get phase() { return phase; }, autopilot: q.get("autopilot") === "1", view: (v) => (viewMode = v), frames: 0, ms: 0, merged, get audio() { return audio?.kind?.(); } };

// ---------- loop ----------
const tmpV = new THREE.Vector3(), tmpL = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
let camInit = false, lastT = performance.now(), acc = 0, prevGear = 1, simT = 0;

addEventListener("keydown", (e) => { if (!pitStop || pitStop.done) return; const k = { Digit1: "soft", Digit2: "medium", Digit3: "hard", Numpad1: "soft", Numpad2: "medium", Numpad3: "hard" }[e.code]; if (k) { nextTyre = k; hud.tyreChoice(k); } });
document.addEventListener("click", (e) => { const b = e.target.closest("[data-tyre]"); if (b && pitStop && !pitStop.done) { nextTyre = b.dataset.tyre; hud.tyreChoice(nextTyre); } });
// ---------- pit lane: limiter messages, and a stop in our box (RACELIMIT, the first garage) ----------
function pits(dt) {
  if (c.pitLimiter !== wasLimiter) {
    if (c.pitLimiter) hud.message(c.u * 3.6 > 82 ? `Pit limiter on — you came in at ${Math.round(c.u * 3.6)} km/h!` : "Pit limiter on · 80 km/h", 2.2, c.u * 3.6 > 82 ? "bad" : "");
    else if (c.onPit) hud.message("Limiter off", 1.2);
    wasLimiter = c.pitLimiter;
  }
  if (c.onPit !== wasPit) { if (c.onPit && !c.pitLimiter) hud.message("Pit lane", 1.2); wasPit = c.onPit; }
  // tyre warnings (each once per set)
  if (c.tyres) c.tyres.forEach((ty, k) => {
    const say = (key, text, kind = "bad") => { if (!tyreWarned[key + k]) { tyreWarned[key + k] = true; hud.message(text, 3, kind); } };
    if (ty.flat > 0.35) say("flat", `Flat spot on the ${TYRE_NAMES[k]} — you'll feel it shake`);
    if (ty.blister > 0.25) say("blister", `Blistering on the ${TYRE_NAMES[k]}: it's too hot, ease off`);
    if (ty.grain > 0.5) say("grain", `Graining on the ${TYRE_NAMES[k]}: sliding while cold. It'll clean up`, "");
    if (ty.wear > 0.75) say("worn", `${TYRE_NAMES[k][0].toUpperCase() + TYRE_NAMES[k].slice(1)} tyre nearly worn out: box soon`);
  });
  const box = circuit.pitInfo?.boxes?.[0];
  if (!box) return;
  const dBox = Math.hypot(c.x - box.x, c.z - box.z);
  if (!pitStop && c.onPit && dBox < 3.2 && Math.abs(c.u) < 0.8 && phase === "race") { pitStop = { t: 0, dur: 2.1 + Math.random() * 0.9, done: false }; nextTyre = c.compound; hud.tyreChoice(nextTyre); }
  if (pitStop && !pitStop.done) {
    pitStop.t += dt; c.u = c.v = c.r = 0;
    if (pitStop.t >= pitStop.dur) {
      pitStop.done = true; hud.tyreChoice(null);
      fitTyres(c, nextTyre, 70); setTyreLook(car, COMPOUNDS[nextTyre].color, tyreLabel(nextTyre)); tyreWarned = {};
      hud.message(`Stop: ${pitStop.dur.toFixed(1)} s · new ${COMPOUNDS[nextTyre].name.toLowerCase()}s · go go go!`, 2.4, "good");
    }
  }
  if (pitStop?.done && dBox > 8) pitStop = null;
}
const EYE = q.get("eye") ? q.get("eye").split(",").map(Number) : null; // testing: camera offset from the car
const STEP = 1 / 240, WARP = +q.get("warp") || 0; // warp: seconds of simulation per frame (testing only)
function frame(now) {
  requestAnimationFrame(frame);
  window.__race.frames++;
  const dt = Math.max(0, Math.min(0.1, (now - lastT) / 1000)); lastT = now; // the first frame can be stamped before the page clock started
  const inp = input.poll();
  if (inp.pause && phase !== "menu") setPause(!paused);
  if (inp.mute && audio) { audio.setMuted(!audio.muted()); syncSettingsUI(); }
  if (inp.camera) { viewMode = VIEWS[(VIEWS.indexOf(viewMode) + 1) % VIEWS.length]; settings.camera = viewMode; saveSettings(); }
  if (inp.info) { settings.hudInfo = settings.hudInfo === "simple" ? "full" : "simple"; saveSettings(); applyHudInfo(); syncSettingsUI(); }
  if ((inp.biasUp || inp.biasDown) && phase !== "menu") { c.bias = Math.round(Math.max(0.5, Math.min(0.7, (c.bias ?? CAR.bias) + (inp.biasUp ? 0.005 : -0.005))) * 1000) / 1000; hud.message(`Brake bias ${(c.bias * 100).toFixed(1)}% front`, 1.1); }
  if (inp.line) { settings.line = { full: "braking", braking: "off", off: "full" }[settings.line]; saveSettings(); applyLineMode(); hud.message(`Racing line: ${settings.line}`, 1.2); }
  const opts = { auto: settings.auto, abs: settings.abs, tc: settings.tc, stability: settings.stability, aeroAuto: true, compounds: COMPOUNDS };
  if (!paused && phase !== "menu") {
    // start lights
    if (phase === "lights") {
      lightsT += dt;
      const n = Math.min(5, Math.floor(lightsT));
      if (n !== hud._n && n > 0) { hud._n = n; hud.lights(n); sfx.light(); }
      if (lightsT >= lightsOutAt) { phase = "race"; hud.lights(-1); hud._n = 0; T.running = true; T.lapStart = T.now; T.secStart = T.now; hud.message("GO!", 1, "good"); }
    }
    if (inp.reset && phase === "race") { resetCar(c, tr); pitStop = null; hud.message("Back on track", 1); }
    acc += WARP || dt;
    let drive = window.__race.autopilot ? autopilot() : inp;
    if (phase === "lights") drive = { ...drive, brake: 1, steer: 0 };
    if (pitStop && !pitStop.done) drive = { ...drive, throttle: 0, brake: 1, steer: 0, up: false, down: false }; // the crew has the car
    let n = 0;
    while (acc >= STEP && n < (WARP ? WARP * 240 + 2 : 10)) {
      let i2 = n === 0 ? drive : { ...drive, up: false, down: false };
      if (window.__race.autopilot && n % 4 === 0) { i2 = autopilot(); if (phase === "lights") i2.brake = 1; drive = i2; }
      stepCar(c, i2, tr, STEP, opts);
      if (phase === "lights") { c.u = Math.min(c.u, 0); c.v = 0; c.r = 0; lightsT += WARP ? STEP : 0; if (WARP && lightsT >= lightsOutAt) { phase = "race"; hud.lights(-1); T.running = true; T.lapStart = T.now; T.secStart = T.now; } }
      T.now += STEP; simT += STEP; timing(STEP);
      if (c.hit) { circuit.barriers.hit(c.hit); if (c.impact > 3 && audio) audio.thump(c.impact); }
      acc -= STEP; n++;
    }
    if (!WARP && n >= 10) acc = 0;
    if (c.gear !== prevGear) { audio?.shift(c.gear > prevGear); prevGear = c.gear; }
    pits(dt);
    // wrong way
    const RD = c.onPit ? tr.pitRoad : tr, ri = c.onPit ? c.pidx : c.idx;
    const along = Math.sin(c.yaw) * RD.TX[ri] + Math.cos(c.yaw) * RD.TZ[ri];
    wrongT = along < -0.3 && c.u > 3 ? wrongT + dt : 0;
    if (wrongT > 1.2) { hud.message("Wrong way — press R to reset", 1.5, "bad"); wrongT = -2; }
  }
  // ----- car pose -----
  const flat = c.tyres ? Math.max(...c.tyres.map((ty) => ty.flat)) : 0;
  const kerbJ = (c.kerb ? (Math.random() - 0.5) * 0.012 * Math.min(1, c.u / 20) : c.surface === "gravel" ? (Math.random() - 0.5) * 0.012 * Math.min(1, c.u / 10) : 0) + (flat > 0.2 ? Math.sin(simT * c.u * 2.9) * 0.004 * flat * Math.min(1, c.u / 30) : 0);
  const along = Math.sin(c.yaw) * tr.TX[c.idx] + Math.cos(c.yaw) * tr.TZ[c.idx];
  const slopePitch = -Math.atan(tr.slope[c.idx] * along);
  const surfY = c.onPit ? 0.012 : Math.abs(c.lat) < tr.half + 0.6 ? crown(c.lat) : c.kerb ? 0.06 : c.surface === "gravel" ? -0.06 : -0.01;
  const groundY = c.y + surfY + kerbJ;
  car.position.set(c.x, groundY, c.z);
  // the road's own tilt (a banked corner, and the run-off beside it), smoothly — no snapping at the track's edge
  const bankRoll = !c.onPit && tr.bankSlope ? tr.bankSlope(c.idx, c.lat) * along : 0;
  car.rotation.set(slopePitch, c.yaw, bankRoll, "YXZ");
  {
    // the body on its springs (about 3 Hz, well damped): follows the road height, sinks a little with downforce
    const h = Math.min(dt, 1 / 30), target = groundY - 0.014 * Math.min(1, (Math.max(0, c.u) / 85) ** 2);
    if (susp.y == null || Math.abs(susp.y - target) > 0.5 || WARP) { susp.y = target; susp.v = 0; }
    for (let k = 0; k < 4; k++) { const a = 360 * (target - susp.y) - 17 * susp.v; susp.v += a * (h / 4); susp.y += susp.v * (h / 4); }
    body.position.y = Math.max(-0.045, Math.min(0.035, susp.y - groundY));
    body.rotation.set(c.pitch, 0, c.roll);
  }
  for (const w of wheels) { w.group.rotation.x = c.wheelRot; if (w.front) w.pivot.rotation.y = c.steer; }
  const sw = car.userData.steering;
  if (sw) {
    sw.rotation.z = c.steer * 4.2; // turning left turns the wheel anticlockwise
    if (armRig.length && viewMode === "cockpit" && !inp.back) {
      sw.updateMatrix(); car.updateMatrixWorld(true);
      for (const a of armRig) {
        // the glove on this side: the wheel is turned round to face the driver, so its x is mirrored
        const wrist = sw.localToWorld(new THREE.Vector3(-a.side * 0.125, -0.13, -0.04)); a.pivot.parent.worldToLocal(wrist);
        const d = wrist.sub(a.pivot.position), L = d.length();
        a.pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize()); a.mesh.scale.z = L / a.len; a.mesh.position.z = L / 2;
      }
    }
  }
  showAero(c.aeroMode);
  // the steering wheel's screen (only redrawn when you can see it, about 15 times a second)
  if ((viewMode === "cockpit" || viewMode === "tcam") && now - (wheelDrawnAt || 0) > 66) {
    wheelDrawnAt = now;
    drawWheelScreen(car.userData.steering, { rpm: c.rpm, shiftRpm: CAR.shiftRpm, gear: c.reverse ? "R" : c.u < 0.5 && c.throttle < 0.05 && !T.running ? "N" : String(c.gear), kmh: Math.abs(c.u) * 3.6,
      lapTime: T.running ? T.now - T.lapStart : 0, delta: T.delta, lap: T.lap, ers: c.ers / CAR.battery, deploy: c.deploying, harvest: c.harvesting, clip: c.clipping, overtake: c.overtake,
      limiter: c.pitLimiter, onPit: c.onPit, tyres: c.tyres ? c.tyres.map((ty) => ({ wear: 1 - ty.wear, temp: ty.temp })) : null, compound: c.compound ? COMPOUNDS[c.compound] : null, brakeBias: Math.round(CAR.bias * 100), gearMode: settings.auto ? "AUTO" : "MANUAL" });
  }
  // ----- camera -----
  const fwd = tmpV.set(Math.sin(c.yaw), 0, Math.cos(c.yaw));
  const k = 1 - Math.exp(-dt * 7);
  const v = inp.back ? "back" : viewMode;
  if (WARP) camInit = false;
  showCockpit(v === "cockpit");
  if (v === "cockpit" || v === "tcam") {
    car.updateMatrixWorld();
    const eye = v === "cockpit" ? new THREE.Vector3(0, 0.83, CK - 0.14) : new THREE.Vector3(0, 1.2, CK - 0.62);
    cam.position.copy(body.localToWorld(eye)); // (the driver's head moves with the body)
    cam.lookAt(body.localToWorld(v === "cockpit" ? new THREE.Vector3(0, 0.3, CK + 14) : new THREE.Vector3(0, 0.75, CK + 20)));
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
  const eye = window.__eye || EYE; // testing: a fixed camera offset from the car
  if (eye) { cam.position.set(c.x + eye[0], c.y + eye[1], c.z + eye[2]); cam.lookAt(c.x + (eye[3] || 0), c.y, c.z + (eye[4] || 0)); cam.fov = 55; cam.near = 0.5; }
  cam.updateProjectionMatrix();
  // ----- light follows the car -----
  sun.target.position.set(c.x, c.y, c.z); sun.position.copy(sun.target.position).addScaledVector(sunDir, 120);
  if (lineMesh.visible) colourLine(c);
  if (!paused) updateSparks(c, Math.min(dt, 0.05));
  circuit.barriers.update(Math.min(dt, 0.05)); circuit.barriers.cull(cam.position);
  hud.update(c, T, opts);
  audio?.update(c, { paused, view: v, dt });
  const r0 = performance.now(); renderer.render(scene, cam); window.__race.ms = performance.now() - r0; window.__race.info = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
}
requestAnimationFrame(frame);

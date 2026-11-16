// Exports the cars of every era and the teams' liveries from the web game for the Unity version:
//   unity/com.racelimit.game/Cars/car_<era>.glb       one car per era (1998, 2009, 2014, 2017, 2022, 2026), in RACELIMIT colours;
//        wheels RL_Wheel_FL/FR/RL/RR, the steering wheel RL_Steering and its screen RL_WheelScreen,
//        materials rl_livery (the painted bodywork, textured), rl_paint (body colour) and rl_accent (second colour)
//   unity/com.racelimit.game/Runtime/Resources/RL_Liveries/<TEAM>.png   each made-up team's livery texture, which Unity
//        puts on rl_livery (and tints rl_paint / rl_accent) when that team is chosen
// Needs the local server: (cd public && python3 -m http.server 8791), and THREE_EX as for export-track.mjs.
// Run: node scripts/unity/export-cars.mjs
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const ROOT = new URL("../../", import.meta.url).pathname, OUT = ROOT + "unity/com.racelimit.game/";
const BASE = process.env.BASE || "http://localhost:8791/", THREE_EX = process.env.THREE_EX;
const ERAS = (process.argv[2] ? process.argv[2].split(",") : ["1998", "2009", "2014", "2017", "2022", "2026"]);
mkdirSync(OUT + "Cars", { recursive: true }); mkdirSync(OUT + "Runtime/Resources/RL_Liveries", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let first = true;
for (const era of ERAS) {
  const p = await b.newPage({ viewport: { width: 800, height: 450 } });
  p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.route("**/vendor/three/addons/exporters/GLTFExporter.js", (r) => r.fulfill({ contentType: "text/javascript", body: readFileSync(THREE_EX + "/exporters/GLTFExporter.js") }));
  await p.route("**/vendor/three/addons/utils/TextureUtils.js", (r) => r.fulfill({ contentType: "text/javascript", body: readFileSync(THREE_EX + "/utils/TextureUtils.js") }));
  await p.goto(`${BASE}race/index.html?track=monza&place=0&speed=0&cam=chase&era=${era}`);
  await p.waitForFunction(() => window.__race && window.__car && document.getElementById("loading").hidden, null, { timeout: 240000 });
  await p.waitForTimeout(1000);
  const res = await p.evaluate(async (wantLiveries) => {
    const THREE = await import("three"), { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
    const car = window.__car, sw = window.__sw;
    car.position.set(0, 0, 0); car.quaternion.identity(); car.updateMatrixWorld(true);
    for (const w of car.userData.wheels ?? []) { const pv = w.group.parent, wp = new THREE.Vector3(); w.group.getWorldPosition(wp); const nm = `${wp.z > 0 ? "F" : "R"}${wp.x > 0 ? "L" : "R"}`; pv.name = "RL_Wheel_" + nm; w.group.name = "RL_WheelSpin_" + nm; }
    let hn = 0;
    car.traverse((o) => { if (o.userData.helmet || o.userData.lid || o.userData.inner || o.userData.extTub) o.name = "RL_HideInCockpit_" + hn++; else if (o.userData.cockpitOnly) o.name = "RL_CockpitOnly_" + hn++; });
    if (sw) { sw.rotation.z = 0; sw.name = "RL_Steering"; const st = sw.userData.screen?.tex; sw.traverse((o) => { if (o.isMesh && st && o.material?.map === st) o.name = "RL_WheelScreen"; }); }
    const info = { ck: car.userData.ck ?? 0, wheel: !!sw, screen: false, mats: {} };
    car.traverse((o) => { if (o.name === "RL_WheelScreen") info.screen = true; if (o.isMesh) for (const m of [].concat(o.material)) if (m?.name?.startsWith("rl_")) info.mats[m.name] = 1; });
    car.traverse((o) => { o.userData = {}; });
    const drop = []; car.traverse((o) => { if (o.isPoints || o.isSprite || o.isLine || o.material?.isShaderMaterial) drop.push(o); });
    for (const o of drop) o.parent?.remove(o);
    car.name = "RL_Car";
    const toB64 = (buf) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
    const glb = await new GLTFExporter().parseAsync(car, { binary: true, onlyVisible: true, maxTextureSize: 1024 });
    const liveries = {};
    if (wantLiveries) {
      const src = [...document.querySelectorAll("script")].map((s) => s.textContent).join("") + (await (await fetch("main.js")).text());
      const v = (src.match(/car\.js\?v=([a-z0-9]+)/) || [])[1];
      const { TEAMS } = await import("./car.js" + (v ? "?v=" + v : "")), kit = await import((await (await fetch("car.js")).text()).match(/"(\.\/car-kit\.js[^"]*)"/)[1]);
      for (const t of TEAMS) { const tx = kit.liveryMap({ body: t.body, accent: t.accent, stripe: t.stripe, style: t.style }); liveries[t.team] = { png: tx.image.toDataURL("image/png").split(",")[1], body: t.body, accent: t.accent, stripe: t.stripe, number: t.number }; }
    }
    return { glb: toB64(glb), info, liveries };
  }, first);
  writeFileSync(OUT + `Cars/car_${era}.glb`, Buffer.from(res.glb, "base64"));
  for (const [team, l] of Object.entries(res.liveries)) writeFileSync(OUT + `Runtime/Resources/RL_Liveries/${team}.png`, Buffer.from(l.png, "base64"));
  if (first) console.log("teams", JSON.stringify(Object.fromEntries(Object.entries(res.liveries).map(([k, v]) => [k, [v.body, v.accent, v.stripe, v.number]]))));
  console.log(era, (res.glb.length * 0.75 / 1e6).toFixed(1) + " MB", JSON.stringify(res.info));
  first = false; await p.close();
}
await b.close();

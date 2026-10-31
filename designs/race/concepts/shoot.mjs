// node shoot.mjs [names…] — stages the shots in shots.mjs inside the game: one page per circuit, each shot staged,
// photographed (bg/<name>.png + bg/<name>.json label positions) and undone before the next.
import { chromium } from "playwright";
import fs from "node:fs";
const { SHOTS } = await import("./shots.mjs?" + Date.now());
const kit = fs.readFileSync("kit.js", "utf8");
const names = process.argv.slice(2);
const todo = SHOTS.filter((s) => (names.length ? names.includes(s.name) : !fs.existsSync(`bg/${s.name}.png`)));
// group: shots on the same circuit share a page; mask shots get their own (they change the car's materials)
const groups = new Map();
for (const s of todo) { const k = s.track + (s.name.includes("mask") ? "#" + s.name : ""); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(s); }
const queue = [...groups.values()].sort((a, b) => b.length - a.length);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
async function group(list) {
  const t0 = Date.now(), first = list[0], p = await b.newPage({ viewport: { width: +(process.env.VW || 1600), height: +(process.env.VH || 900) } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.addInitScript(() => { try { localStorage.setItem("racelimit.games.race.settings", JSON.stringify({ auto: true, abs: true, tc: true, stability: true, line: "full", camera: "chase", quality: "high", engine: "raw", hud: "normal", hudInfo: "full", hudV: 2 })); } catch {} });
  await p.goto(`http://localhost:8791/race/index.html?track=${first.track}&place=${first.place ?? 300}&speed=0&cam=chase`);
  await p.waitForFunction(() => window.__race && document.getElementById("loading").hidden, null, { timeout: 400000 });
  await p.addStyleTag({ content: "#hud,.overlay,#touch,.touch{display:none!important}" });
  await p.addScriptTag({ type: "module", content: kit });
  await p.waitForFunction(() => window.K, null, { timeout: 120000 });
  await p.evaluate(async () => { window.K.pause(); await window.K.frames(2); window.K.snapshot(); });
  console.log(`[${first.track}] loaded in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  for (const s of list) {
    const t1 = Date.now();
    try {
      await p.evaluate(async ({ code, place, cam }) => {
        const K = window.K; K.restore(); window.__race.view(cam);
        if (place != null) { const i = K.tr.wrap(place); K.place(i, K.off(i)); }
        await K.frames(2);
        await new Function("K", "THREE", `return (async () => { ${code} })()`)(K, K.THREE);
      }, { code: s.setup ?? "", place: s.place ?? null, cam: s.cam ?? "chase" });
      await p.evaluate(() => window.K.frames(4));
      const anchors = await p.evaluate(() => window.K.project());
      await p.screenshot({ path: `bg/${s.name}${process.env.SUF || ""}.png`, timeout: 300000 });
      fs.writeFileSync(`bg/${s.name}${process.env.SUF || ""}.json`, JSON.stringify(anchors));
      console.log(" ", s.name, ((Date.now() - t1) / 1000).toFixed(0) + "s", JSON.stringify(anchors), [...new Set(errs)].slice(0, 2).join(" | "));
    } catch (e) { console.log("  FAIL", s.name, e.message.split("\n")[0]); }
    errs.length = 0;
  }
  await p.close();
}
const conc = Number(process.env.CONC || 2);
await Promise.all(Array.from({ length: conc }, async () => { while (queue.length) await group(queue.shift()); }));
await b.close();

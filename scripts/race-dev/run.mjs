import { chromium } from "playwright";
const O = process.env.OUT || "shots"; (await import("node:fs")).mkdirSync(O, { recursive: true });
const url = process.argv[2] || "race/index.html?auto=1&autopilot=1";
const shots = (process.argv[3] || "8").split(",").map(Number);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on("pageerror", (e) => errs.push("ERR " + e.message)); p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(m.type() + " " + m.text()); });
const t0 = Date.now();
await p.goto((process.env.BASE || "http://localhost:8791/") + "" + url);
try { await p.waitForFunction(() => window.__race && document.getElementById("loading").hidden, null, { timeout: 180000 }); } catch (e) { console.log("load timeout"); }
console.log("loaded in", Date.now() - t0, "ms");
let k = 0;
for (const s of shots) {
  await p.waitForTimeout(s * 1000);
  const st = await p.evaluate(() => { const r = window.__race; return r ? { frames: r.frames, ms: Math.round(r.ms), merged: r.merged, info: r.info, phase: r.phase, kmh: Math.round(r.c.u * 3.6), gear: r.c.gear, idx: r.c.idx, lat: +r.c.lat.toFixed(1), lap: r.T.lap, t: +(r.T.now).toFixed(1), last: r.T.lastLap } : null; });
  console.log("shot", k, JSON.stringify(st));
  await p.screenshot({ path: `${O}/g${k++}.png`, timeout: 180000 });
}
console.log(errs.slice(0, 15).join("\n"));
await b.close();

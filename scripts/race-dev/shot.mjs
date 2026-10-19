// Screenshots from chosen spots, including from above: node shot.mjs 'name|id|place|speed|cam|eye' …
// eye = "dx,dy,dz,lookdx,lookdz" (a fixed camera offset from the car, see main.js). OUT, BASE, CHROMIUM as in tracks.mjs.
import { chromium } from "playwright";
const O = process.env.OUT || "shots"; (await import("node:fs")).mkdirSync(O, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const spec of process.argv.slice(2)) {
  const [name, id, place = "300", speed = "0", cam = "chase", eye = "", extra = ""] = spec.split("|");
  const p = await b.newPage({ viewport: { width: +(process.env.W || 1280), height: +(process.env.H || 720) } });
  const errs = []; p.on("pageerror", (e) => errs.push("ERR " + e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto(`${process.env.BASE || "http://localhost:8791/"}race/index.html?track=${id}&place=${place}&speed=${speed}&cam=${cam}${eye ? "&eye=" + eye : ""}${extra}`);
  try { await p.waitForFunction(() => window.__race && document.getElementById("loading").hidden, null, { timeout: 180000 }); } catch { errs.push("load timeout"); }
  const f0 = await p.evaluate(() => window.__race?.frames ?? 0);
  const tw = Date.now(); while ((await p.evaluate(() => window.__race?.frames ?? 0)) < f0 + 3 && Date.now() - tw < 90000) await p.waitForTimeout(300);
  const st = await p.evaluate(() => { const r = window.__race; return r ? { kmh: Math.round(r.c.u * 3.6), idx: r.c.idx, lat: +r.c.lat.toFixed(1), onPit: r.c.onPit } : null; });
  console.log(name, JSON.stringify(st), [...new Set(errs)].slice(0, 6).join(" | "));
  await p.screenshot({ path: `${O}/${name}.png`, timeout: 240000 });
  await p.close();
}
await b.close();

import { chromium } from "playwright";
const O = process.env.OUT || "shots"; (await import("node:fs")).mkdirSync(O, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const spec of process.argv.slice(2)) {
  const [id, place = "300", speed = "150", cam = "chase"] = spec.split(":");
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on("pageerror", (e) => errs.push("ERR " + e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  const t0 = Date.now();
  await p.goto(place === "hot" ? `${process.env.BASE || "http://localhost:8791/"}race/index.html?track=${id}&session=hotlap&cam=${cam}` : `${process.env.BASE || "http://localhost:8791/"}race/index.html?track=${id}&place=${place}&speed=${speed}&cam=${cam}`);
  try { await p.waitForFunction(() => window.__race && document.getElementById("loading").hidden, null, { timeout: 120000 }); } catch { errs.push("load timeout"); }
  const f0 = await p.evaluate(() => window.__race?.frames ?? 0);
  const tw = Date.now(); while ((await p.evaluate(() => window.__race?.frames ?? 0)) < f0 + 2 && Date.now() - tw < 60000) await p.waitForTimeout(300);
  const st = await p.evaluate(() => { const r = window.__race; return r ? { kmh: Math.round(r.c.u * 3.6), idx: r.c.idx, lat: +r.c.lat.toFixed(1), tris: r.info?.tris, calls: r.info?.calls } : null; });
  console.log(id, `${Date.now() - t0}ms`, JSON.stringify(st), [...new Set(errs)].slice(0, 6).join(" | "));
  await p.screenshot({ path: `${O}/t-${id}.png`, timeout: 240000 });
  await p.close();
}
await b.close();

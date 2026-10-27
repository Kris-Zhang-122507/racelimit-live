// node bgshot.mjs 'name|id|place|speed|cam|eye|extra' — game screenshot without the HUD (1600x900)
import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const fs = await import("node:fs");
const queue = process.argv.slice(2).filter((s) => !fs.existsSync(`bg/${s.split("|")[0]}.png`));
async function one(spec) {
  const [name, id, place = "300", speed = "0", cam = "chase", eye = "", extra = ""] = spec.split("|");
  const t0 = Date.now();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`http://localhost:8791/race/index.html?track=${id}&place=${place}&speed=${speed}&cam=${cam}${eye ? "&eye=" + eye : ""}${extra}`);
  try { await p.waitForFunction(() => window.__race && document.getElementById("loading").hidden, null, { timeout: 300000 }); } catch { errs.push("load timeout"); }
  await p.addStyleTag({ content: "#hud,.overlay,#touch,.touch{display:none!important}" });
  const f0 = await p.evaluate(() => window.__race?.frames ?? 0);
  const tw = Date.now(); while ((await p.evaluate(() => window.__race?.frames ?? 0)) < f0 + 4 && Date.now() - tw < 120000) await p.waitForTimeout(300);
  await p.screenshot({ path: `bg/${name}.png`, timeout: 300000 });
  console.log(name, ((Date.now() - t0) / 1000).toFixed(0) + "s", errs.slice(0, 3).join(" | "));
  await p.close();
}
await Promise.all([0, 1].map(async () => { while (queue.length) { const s = queue.shift(); try { await one(s); } catch (e) { console.log("FAIL", s, e.message.split("\n")[0]); } } }));
await b.close();

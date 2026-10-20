// Screenshots from any point, e.g. along the pit lane: node shotat.mjs 'name|id|where|height|back|ahead' …
// where = "p:<metres along the pit lane>" or "t:<track index>[@lateral offset]"; the camera sits `back` metres behind
// that point, `height` up, looking `ahead` metres forward. OUT, BASE, CHROMIUM as in tracks.mjs.
import { chromium } from "playwright";
const O = process.env.OUT || "shots"; (await import("node:fs")).mkdirSync(O, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium", args: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const spec of process.argv.slice(2)) {
  const [name, id, where = "t:0", height = "6", back = "20", ahead = "30"] = spec.split("|");
  const p = await b.newPage({ viewport: { width: +(process.env.W || 1280), height: +(process.env.H || 720) } });
  const errs = []; p.on("pageerror", (e) => errs.push("ERR " + e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto(`${process.env.BASE || "http://localhost:8791/"}race/index.html?track=${id}&place=0&speed=0&cam=chase&eye=0,5,0,0,0`);
  try { await p.waitForFunction(() => window.__race && document.getElementById("loading").hidden, null, { timeout: 180000 }); } catch { errs.push("load timeout"); }
  const info = await p.evaluate(([where, h, bk, ah]) => {
    const { c, tr } = window.__race; let x, y, z, tx, tz;
    if (where.startsWith("p:")) {
      const P = tr.pitRoad, s = +where.slice(2); let i = 0; while (i < P.N - 1 && P.dist[i] < s) i++;
      x = P.X[i]; y = P.Y[i]; z = P.Z[i]; tx = P.TX[i]; tz = P.TZ[i];
    } else {
      const [ti, lo = "0"] = where.slice(2).split("@"), i = tr.wrap(+ti), o = +lo;
      x = tr.X[i] + tr.LX[i] * o; y = tr.Y[i]; z = tr.Z[i] + tr.LZ[i] * o; tx = tr.TX[i]; tz = tr.TZ[i];
    }
    const cx = x - tx * bk, cz = z - tz * bk, lx = x + tx * ah, lz = z + tz * ah;
    // the camera code looks at the car's height, so aim relative to the car
    window.__eye = [cx - c.x, y + h - c.y, cz - c.z, lx - c.x, lz - c.z];
    return { x: Math.round(x), z: Math.round(z) };
  }, [where, +height, +back, +ahead]);
  const f0 = await p.evaluate(() => window.__race?.frames ?? 0);
  const tw = Date.now(); while ((await p.evaluate(() => window.__race?.frames ?? 0)) < f0 + 3 && Date.now() - tw < 90000) await p.waitForTimeout(300);
  console.log(name, JSON.stringify(info), [...new Set(errs)].slice(0, 6).join(" | "));
  await p.screenshot({ path: `${O}/${name}.png`, timeout: 240000 });
  await p.close();
}
await b.close();

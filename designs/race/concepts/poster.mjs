// node poster.mjs [w p s] — cuts the car out of each hero shot with its mask, then renders poster.html at each size
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
const sizes = process.argv.slice(2).length ? process.argv.slice(2) : ["w", "p", "s"];
const dims = { w: [1920, 1080], p: [1080, 1350], s: [1080, 1920] };
for (const s of sizes) execFileSync("python3", ["-c", `
from PIL import Image, ImageFilter
a = Image.open('bg/p-hero-${s}.png').convert('RGB'); m = Image.open('bg/p-heromask-${s}.png').convert('RGB')
r, g, b = m.split()
al = Image.eval(g, lambda v: 255 if v > 150 else 0)
al = Image.composite(al, Image.new('L', m.size, 0), Image.eval(r, lambda v: 255 if v < 120 else 0))
al = al.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
a.putalpha(al); a.save('bg/p-car-${s}.png')
`]);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--headless=new"] });
for (const s of sizes) {
  const [w, h] = dims[s];
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto(`http://localhost:8795/poster.html?size=${s}`);
  await p.waitForLoadState("networkidle"); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `poster-${s}.png` });
  console.log(s, "ok"); await p.close();
}
await b.close();

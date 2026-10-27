// node render.mjs list1 [screen…] — renders concept screens to out/<list>-<screen>.png
import { chromium } from "playwright";
import fs from "node:fs";
const [list, ...only] = process.argv.slice(2);
fs.mkdirSync("out", { recursive: true });
const src = fs.readFileSync(`${list}.js`, "utf8");
const names = only.length ? only : [...src.matchAll(/^S\.(\w+) = /gm)].map((m) => m[1]);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--headless=new"] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
for (const n of names) {
  await p.goto(`http://localhost:8795/${list}.html?screen=${n}`);
  await p.waitForLoadState("networkidle"); await p.evaluate(() => document.fonts.ready);
  // anything sticking out of the page or overlapping text boxes?
  const over = await p.evaluate(() => [...document.querySelectorAll(".hudbox,.panel")].filter((e) => { const r = e.getBoundingClientRect(); return r.right > 1601 || r.bottom > 901 || e.scrollHeight > e.clientHeight + 2; }).map((e) => (e.className + " " + e.textContent.trim().slice(0, 40))));
  await p.screenshot({ path: `out/${list}-${n}.png` });
  console.log(n, over.length ? "OVERFLOW: " + over.join(" || ") : "ok");
}
await b.close();

// for each circuit: how far the pit road's surface is above/below the track's where they overlap (entry and exit), in cm
const ROOT = new URL("../../", import.meta.url).pathname;
import { readFileSync } from "node:fs";
const mapFor = (cfg) => { try { return JSON.parse(readFileSync(ROOT + "public/data/race-world/" + cfg.slug + ".json", "utf8")); } catch { return null; } };
const R = ROOT + "public/race/", D = ROOT + "public/data/";
const { CIRCUITS, buildTrack } = await import(R + "trackdata.js?" + Date.now());
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CIRCUITS);
let worst = 0;
for (const id of ids) {
  const cfg = CIRCUITS[id], raw = JSON.parse(readFileSync(D + "tracks/" + cfg.slug + ".json", "utf8")); let real = null; try { real = JSON.parse(readFileSync(D + "race/" + cfg.slug + ".json", "utf8")); } catch {}
  const tr = buildTrack(raw, cfg, real, mapFor(cfg)), P = tr.pitRoad; if (!P) continue;
  let mIn = 0, mOut = 0, kink = 0;
  for (let i = 0; i < P.N; i++) {
    const g = tr.nearestGlobal(P.X[i], P.Z[i]), j = g.i ?? g, o = (P.X[i] - tr.X[j]) * tr.LX[j] + (P.Z[i] - tr.Z[j]) * tr.LZ[j];
    if (Math.abs(o) > tr.half + 2.5) continue;                      // not on the track's tarmac here
    const al = (P.X[i] - tr.X[j]) * tr.TX[j] + (P.Z[i] - tr.Z[j]) * tr.TZ[j], j2 = tr.wrap(j + (al >= 0 ? 1 : -1)), f = Math.min(1, Math.abs(al) / (Math.hypot(tr.X[j2] - tr.X[j], tr.Z[j2] - tr.Z[j]) || 1));
    const d = Math.abs(P.Y[i] - (tr.yAt(j, o) * (1 - f) + tr.yAt(j2, o) * f)) * 100; if (!Number.isFinite(d)) continue;
    if (i < P.N / 2) mIn = Math.max(mIn, d); else mOut = Math.max(mOut, d);
  }
  for (let i = 2; i < P.N - 2; i++) kink = Math.max(kink, Math.abs(P.Y[i + 1] - 2 * P.Y[i] + P.Y[i - 1]) * 100);
  worst = Math.max(worst, mIn, mOut);
  console.log(id.padEnd(20), "entry", mIn.toFixed(1).padStart(6), "cm   exit", mOut.toFixed(1).padStart(6), "cm   sharpest kink", kink.toFixed(1), "cm/m²");
}
console.log("worst", worst.toFixed(1), "cm");

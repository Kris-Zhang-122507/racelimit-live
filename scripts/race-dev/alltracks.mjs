// build every circuit from the real data and print a summary
const ROOT = new URL("../../", import.meta.url).pathname; // the repo
import { readFileSync, existsSync } from "node:fs";
const R = ROOT + "public/race/", D = ROOT + "public/data/";
const { CIRCUITS, buildTrack } = await import(R + "trackdata.js?" + Date.now());
const only = process.argv[2];
for (const [id, cfg] of Object.entries(CIRCUITS)) {
  if (only && id !== only) continue;
  const raw = JSON.parse(readFileSync(D + "tracks/" + cfg.slug + ".json", "utf8")), real = existsSync(D + "race/" + cfg.slug + ".json") ? JSON.parse(readFileSync(D + "race/" + cfg.slug + ".json", "utf8")) : null;
  const t0 = Date.now(); let tr;
  try { tr = buildTrack(raw, cfg, real); } catch (e) { console.log(id, "FAILED", e.message, e.stack.split("\n")[1]); continue; }
  const P = tr.pitRoad;
  let ymin = Infinity, ymax = -Infinity; for (let i = 0; i < tr.N; i++) { ymin = Math.min(ymin, tr.Y[i]); ymax = Math.max(ymax, tr.Y[i]); }
  let kmax = 0; if (P) for (let i = 5; i < P.N - 5; i++) kmax = Math.max(kmax, Math.abs(P.K[i]));
  const c1 = tr.corners.find((c) => c.n === 1);
  console.log(`${id.padEnd(18)} ${Date.now() - t0}ms real=${tr.real} dY=${(ymax - ymin).toFixed(0)}m T1@${c1?.i ?? "-"} ` + (P ? `pit ${P.side > 0 ? "L" : "R"} entry ${Math.round(tr.pit.from)} exit ${Math.round(tr.pit.to)} lim ${P.limitFrom.toFixed(0)}-${P.limitTo.toFixed(0)}m of ${P.len.toFixed(0)} gar ${tr.pit.garages.map(Math.round)} front ${tr.pit.laneOut.toFixed(1)} minR ${(1 / kmax).toFixed(1)} walled ${P.bar.reduce((a, b) => a + b, 0)}m` : "NO PIT " + (tr.pitWhy ?? []).join(",")));
}

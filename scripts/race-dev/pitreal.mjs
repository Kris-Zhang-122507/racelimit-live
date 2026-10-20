// for each circuit: drive the whole pit lane (from the entry, through the limiter, out the exit) with a path follower
const ROOT = new URL("../../", import.meta.url).pathname; // the repo
import { readFileSync } from "node:fs";
const mapFor = (cfg) => { try { return JSON.parse(readFileSync(new URL("../../public/data/race-world/" + cfg.slug + ".json", import.meta.url), "utf8")); } catch { return null; } }; // the map data, if there is any
const R = ROOT + "public/race/", D = ROOT + "public/data/";
const { CIRCUITS, buildTrack } = await import(R + "trackdata.js?" + Date.now());
const { newCar, stepCar } = await import(R + "physics.js?" + Date.now());
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CIRCUITS);
for (const id of ids) {
  const cfg = CIRCUITS[id], raw = JSON.parse(readFileSync(D + "tracks/" + cfg.slug + ".json", "utf8")); let real = null; try { real = JSON.parse(readFileSync(D + "race/" + cfg.slug + ".json", "utf8")); } catch {}
  const tr = buildTrack(raw, cfg, real, mapFor(cfg)), P = tr.pitRoad, N = tr.N;
  if (!P) { console.log(id, "no pit"); continue; }
  // path: 300 m of track before the pit road starts (on the pit side), the pit road, then 300 m of track
  const path = [], j0 = Math.round(P.mj[0]), j1 = Math.round(P.mj[P.N - 1]);
  for (let j = j0 - 300; j < j0; j++) { const i = tr.wrap(j), o = P.side * (tr.half - 2); let km = 0; for (let d = -10; d <= 10; d++) km = Math.max(km, Math.abs(tr.K[tr.wrap(i + d)])); path.push([tr.X[i] + tr.LX[i] * o, tr.Z[i] + tr.LZ[i] * o, Math.min(55, Math.sqrt(10 / Math.max(km, 1e-4)))]); }
  for (let i = 0; i < P.N; i++) { let km = 0; for (let d = -8; d <= 8; d++) km = Math.max(km, Math.abs(P.K[Math.max(0, Math.min(P.N - 1, i + d))])); path.push([P.X[i], P.Z[i], Math.min(P.dist[i] > P.limitFrom - 80 && P.dist[i] < P.limitTo ? 21 : 40, Math.sqrt(6 / Math.max(km, 1e-3)))]); }
  for (let j = j1 + 1; j < j1 + 300; j++) { const i = tr.wrap(j), o = P.side * (tr.half - 2.5); let km = 0; for (let d = -10; d <= 10; d++) km = Math.max(km, Math.abs(tr.K[tr.wrap(i + d)])); path.push([tr.X[i] + tr.LX[i] * o, tr.Z[i] + tr.LZ[i] * o, Math.min(55, Math.sqrt(10 / Math.max(km, 1e-4)))]); }
  const i0 = tr.wrap(j0 - 300), c = newCar(tr, i0, P.side * (tr.half - 2)); c.u = 40; c.gear = 5;
  let pi = 0, t = 0, hits = 0, maxHit = 0, ev = [], wasPit = false, lim = false, limMax = 0;
  for (let step = 0; step < 240 * 150 && pi < path.length - 6; step++) {
    let best = pi, bd = Infinity; for (let k = pi; k < Math.min(path.length, pi + 80); k++) { const d = (path[k][0] - c.x) ** 2 + (path[k][1] - c.z) ** 2; if (d < bd) { bd = d; best = k; } } pi = best;
    const la = Math.min(path.length - 1, pi + 5 + Math.round(c.u * (c.onPit ? 0.15 : 0.3))), [tx, tz] = path[la], vt = Math.min(...path.slice(pi, pi + 25).map((p) => p[2]));
    const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), lx = Math.cos(c.yaw), lz = -Math.sin(c.yaw), dx = tx - c.x, dz = tz - c.z;
    stepCar(c, { steer: Math.max(-1, Math.min(1, Math.atan2(dx * lx + dz * lz, dx * fx + dz * fz) * 4)), throttle: c.u < vt - 0.5 ? 1 : 0, brake: c.u > vt + 2 ? 0.8 : 0, analog: true }, tr, 1 / 240, {});
    t += 1 / 240;
    if (c.impact > 0.5) { hits++; maxHit = Math.max(maxHit, c.impact); if (hits < 3) ev.push(`hit ${c.impact.toFixed(1)}m/s pit=${c.onPit} p${c.pidx}/j${c.idx}`); }
    if (c.onPit !== wasPit) { ev.push(c.onPit ? `in@p${c.pidx}` : `out@j${c.idx}`); wasPit = c.onPit; }
    if (c.pitLimiter) limMax = Math.max(limMax, c.u * 3.6);
    if (c.pitLimiter !== lim) { lim = c.pitLimiter; ev.push(lim ? "lim+" : "lim-"); }
  }
  console.log(id.padEnd(18), pi >= path.length - 6 ? "made it" : `STUCK at ${pi}/${path.length} (p${c.pidx}, pit=${c.onPit})`, `t=${t.toFixed(0)}s hits=${hits} max=${maxHit.toFixed(1)} limiter max ${limMax.toFixed(0)}`, ev.join(" "));
}

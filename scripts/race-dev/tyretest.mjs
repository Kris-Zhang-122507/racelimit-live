// smooth driver laps on medium tyres from 70 °C: tyre temps, wear and lap times lap by lap
const ROOT = new URL("../../", import.meta.url).pathname; // the repo
import { readFileSync } from "node:fs";
const mapFor = (cfg) => { try { return JSON.parse(readFileSync(new URL("../../public/data/race-world/" + cfg.slug + ".json", import.meta.url), "utf8")); } catch { return null; } }; // the map data, if there is any
const R = ROOT + "public/race/";
const { CIRCUITS, buildTrack, speedProfile, racingLine } = await import(R + "trackdata.js?" + Date.now());
const { newCar, stepCar, ENVELOPE, fitTyres } = await import(R + "physics.js?" + Date.now());
const cfg = CIRCUITS[process.env.TRACK || "spa"], raw = JSON.parse(readFileSync(ROOT + "public/data/tracks/" + cfg.slug + ".json", "utf8")), real = JSON.parse(readFileSync(ROOT + "public/data/race/" + cfg.slug + ".json", "utf8"));
const tr = buildTrack(raw, cfg, real, mapFor(cfg)), line = racingLine(tr), vp = speedProfile({ ...tr, K: line.K }, ENVELOPE, +(process.env.M || 0.95));
const c = newCar(tr, tr.wrap(-30), line.off[tr.wrap(-30)]); fitTyres(c, process.env.C || "medium", 70);
const dt = 1 / 240; let t = 0, lastS = c.s, lapStart = null, laps = 0, out = [];
while (laps < +(process.env.LAPS || 6) && t < 2000) {
  const ld = 8 + Math.max(c.u, 0) * 0.5, j = tr.wrap(c.idx + Math.round(ld)), dx = line.x[j] - c.x, dz = line.z[j] - c.z, fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), lx = Math.cos(c.yaw), lz = -Math.sin(c.yaw);
  const fwd = dx * fx + dz * fz, left = dx * lx + dz * lz, delta = Math.atan2(2 * 3.4 * left, fwd * fwd + left * left), dMax = 0.34 / (1 + Math.max(0, c.u - 8) / 36);
  const vt = vp[tr.wrap(c.idx + 3 + Math.round(c.u * 0.15))];
  stepCar(c, { steer: Math.max(-1, Math.min(1, delta / dMax)), throttle: Math.max(0, Math.min(1, (vt - c.u) * 0.6 + 0.2)), brake: Math.max(0, Math.min(1, (c.u - vt) * 0.8)), analog: true }, tr, dt, {});
  t += dt;
  if (lastS > tr.len * 0.9 && c.s < tr.len * 0.1) { if (lapStart != null) { laps++; out.push(`lap ${laps}: ${(t - lapStart).toFixed(2)}s temps ${c.tyres.map((y) => y.temp.toFixed(0)).join("/")} wear ${c.tyres.map((y) => (y.wear * 100).toFixed(1)).join("/")}% grain ${c.tyres.map((y) => y.grain.toFixed(2)).join("/")}`); } lapStart = t; }
  lastS = c.s;
}
console.log(cfg.short, process.env.C || "medium"); console.log(out.join("\n"));

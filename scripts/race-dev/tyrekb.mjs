// keyboard-style driver (on/off keys) with tyres fitted: prints tyre temps every few seconds, and
// when each tyre first goes over its window and first blisters. TRACK=spa C=medium node tyrekb.mjs [opts] [aggr]
const ROOT = new URL("../../", import.meta.url).pathname;
import { readFileSync } from "node:fs";
const mapFor = (cfg) => { try { return JSON.parse(readFileSync(new URL("../../public/data/race-world/" + cfg.slug + ".json", import.meta.url), "utf8")); } catch { return null; } }; // the map data, if there is any
const R = ROOT + "public/race/";
const { CIRCUITS, buildTrack, speedProfile, racingLine } = await import(R + "trackdata.js?" + Date.now());
const { newCar, stepCar, ENVELOPE, fitTyres, COMPOUNDS } = await import(R + "physics.js?" + Date.now());
const cfg = CIRCUITS[process.env.TRACK || "spa"], raw = JSON.parse(readFileSync(ROOT + "public/data/tracks/" + cfg.slug + ".json", "utf8")); let realD = null; try { realD = JSON.parse(readFileSync(ROOT + "public/data/race/" + cfg.slug + ".json", "utf8")); } catch {}
const tr = buildTrack(raw, cfg, realD, mapFor(cfg)), line = racingLine(tr), vp = speedProfile({ ...tr, K: line.K }, ENVELOPE, 0.92);
const opts = JSON.parse(process.argv[2] || "{}"), aggr = +(process.argv[3] || 1.0);
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const comp = process.env.C || "medium", hi = COMPOUNDS[comp].window[1];
const c = newCar(tr, tr.N - 30, 0); fitTyres(c, comp, 70);
const dt = 1 / 240; let t = 0, steerKey = 0, holdT = 0, nextP = 0, firstHot = null, firstBl = null, maxT = 0;
const T = +(process.env.SECS || 240);
while (t < T) {
  const ld = 10 + Math.max(c.u, 0) * 0.45, j = tr.wrap(c.idx + Math.round(ld));
  const dx = line.x[j] - c.x, dz = line.z[j] - c.z, fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), lx = Math.cos(c.yaw), lz = -Math.sin(c.yaw);
  const ang = Math.atan2(dx * lx + dz * lz, dx * fx + dz * fz);
  holdT -= dt; if (holdT <= 0) { holdT = 0.05 + rnd() * 0.05; steerKey = ang > 0.012 ? 1 : ang < -0.012 ? -1 : 0; }
  const vt = vp[tr.wrap(c.idx + 3 + Math.round(c.u * 0.15))] * aggr;
  stepCar(c, { steer: steerKey, throttle: c.u < vt - 1 ? 1 : 0, brake: c.u > vt + 2 ? 1 : 0, analog: false }, tr, dt, opts);
  t += dt;
  const mt = Math.max(...c.tyres.map((y) => y.temp)); maxT = Math.max(maxT, mt);
  if (firstHot == null && mt > hi) firstHot = t; if (firstBl == null && c.tyres.some((y) => y.blister > 0)) firstBl = t;
  if (t >= nextP) { nextP += 10; console.log(t.toFixed(0) + "s", Math.round(c.u * 3.6) + "km/h", "temps", c.tyres.map((y) => y.temp.toFixed(0)).join("/"), "wear", c.tyres.map((y) => (y.wear * 100).toFixed(1)).join("/"), "blister", c.tyres.map((y) => y.blister.toFixed(2)).join("/")); }
}
console.log(cfg.short, comp, "max temp", maxT.toFixed(0), "first over window", firstHot?.toFixed(1), "first blister", firstBl?.toFixed(1));

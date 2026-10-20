// keyboard-style test driver: steering, throttle and brake are on/off only (like arrow keys)
const ROOT = new URL("../../", import.meta.url).pathname; // the repo
import { readFileSync } from "node:fs";
const mapFor = (cfg) => { try { return JSON.parse(readFileSync(new URL("../../public/data/race-world/" + cfg.slug + ".json", import.meta.url), "utf8")); } catch { return null; } }; // the map data, if there is any
const R = ROOT + "public/race/";
const { CIRCUITS, buildTrack, speedProfile, racingLine } = await import(R + "trackdata.js?" + Date.now());
const { newCar, stepCar, ENVELOPE, CAR } = await import(R + "physics.js?" + Date.now()); Object.assign(CAR, JSON.parse(process.env.CAR || "{}"));
const cfg = { ...CIRCUITS[process.env.TRACK || "spa"], noSnap: !!process.env.NOSNAP, noEscape: !!process.env.NOESC }, raw = JSON.parse(readFileSync(ROOT + "public/data/tracks/" + cfg.slug + ".json", "utf8")); let realD = null; try { realD = JSON.parse(readFileSync(ROOT + "public/data/race/" + cfg.slug + ".json", "utf8")); } catch {}
const tr = buildTrack(raw, cfg, realD, mapFor(cfg)), line = racingLine(tr), vp = speedProfile({ ...tr, K: line.K }, ENVELOPE, 0.92);
const opts = JSON.parse(process.argv[2] || "{}"), aggr = +(process.argv[3] || 1.0), seedArg = +(process.argv[4] || 1);
let seed = seedArg; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const c = newCar(tr, tr.N - 30, 0);
const dt = 1 / 240; let t = 0, laps = 0, lapStart = null, lastS = c.s;
let spins = 0, spinning = false, offs = 0, off = false, hits = 0, maxRear = 0;
let steerKey = 0, holdT = 0;
for (let step = 0; step < 240 * 400 && laps < 2; step++) {
  const ld = 10 + Math.max(c.u, 0) * 0.45, j = tr.wrap(c.idx + Math.round(ld));
  const dx = line.x[j] - c.x, dz = line.z[j] - c.z, fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), lx = Math.cos(c.yaw), lz = -Math.sin(c.yaw);
  const fwd = dx * fx + dz * fz, left = dx * lx + dz * lz, ang = Math.atan2(left, fwd);
  // key logic with human-like reaction: re-decide every ~70 ms
  holdT -= dt;
  if (holdT <= 0) { holdT = 0.05 + rnd() * 0.05; steerKey = ang > 0.012 ? 1 : ang < -0.012 ? -1 : 0; }
  const vt = vp[tr.wrap(c.idx + 3 + Math.round(c.u * 0.15))] * aggr;
  const input = { steer: steerKey, throttle: c.u < vt - 1 ? 1 : 0, brake: c.u > vt + 2 ? 1 : 0, analog: false };
  stepCar(c, input, tr, dt, opts);
  t += dt;
  const along = Math.sin(c.yaw) * tr.TX[c.idx] + Math.cos(c.yaw) * tr.TZ[c.idx];
  const beta = Math.abs(Math.atan2(c.v, Math.max(1, Math.abs(c.u))));
  maxRear = Math.max(maxRear, c.slipR);
  if ((beta > 0.35 || along < -0.2) && c.u > 5) { if (!spinning) { spins++; spinning = true; if (process.env.V) console.log("SPIN at", c.idx, "kmh", Math.round(c.u * 3.6), "beta", beta.toFixed(2), "thr", input.throttle, "brk", input.brake); } } else if (beta < 0.1) spinning = false;
  if (Math.abs(c.lat) > tr.half + 1.5) { if (!off) { offs++; off = true; } } else off = false;
  if (c.impact > 0) { hits++; if (process.env.H) console.log("hit idx", c.idx, "lat", c.lat.toFixed(1), "side", c.hit?.side, "v", c.impact.toFixed(1), "onPit", c.onPit); }
  if (lastS > tr.len * 0.9 && c.s < tr.len * 0.1) { if (lapStart !== null) { console.log("lap", laps, (t - lapStart).toFixed(2), "spins", spins, "offs", offs, "wallhits", hits, "maxRearSlip", maxRear.toFixed(3)); laps++; spins = 0; offs = 0; hits = 0; maxRear = 0; } lapStart = t; }
  lastS = c.s;
}
console.log("end t", t.toFixed(0), "idx", c.idx);

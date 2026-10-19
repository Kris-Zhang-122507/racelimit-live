// Real track data for the racing game, one file per circuit in public/data/race/.
//
// For each circuit we have an outline for, this finds its most recent Grand Prix on OpenF1 and saves:
//  - the official track map line (MultiViewer's circuit info: the same x/y coordinates as F1's car
//    positions) and its corners,
//  - where the cars actually went on a few of the fastest laps, including height (F1's position
//    data has x, y and z), so the game's hills are the real ones,
//  - where cars went on a few normal pit stops, from before the pit entry to after the exit, so the
//    game's pit lane is on the right side, leaves and rejoins at the right places, and has the
//    speed-limit lines and garages where the real ones are.
// Positions stay in F1's units (tenths of a metre); the game converts them.
//
// Runs in GitHub Actions (see .github/workflows/race-tracks.yml). Polite to the APIs: about one
// request every two seconds.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";

const TRACKS = "public/data/tracks", OUT = "public/data/race";
const UA = { "User-Agent": "racelimit-live fan project (github.com/Kris-Zhang-122507/racelimit-live)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const force = process.argv.includes("--force");
const NOW = Date.now();
mkdirSync(OUT, { recursive: true });

let last = 0;
async function json(url) {
  for (let i = 0; i < 5; i++) {
    const wait = last + 2100 - Date.now(); if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const r = await fetch(url, { headers: UA });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
      console.log(`  ${r.status} for ${url.slice(0, 120)}…`);
    } catch (e) { console.log(`  ${e.message} for ${url.slice(0, 120)}…`); }
    await sleep(4000 * (i + 1));
  }
  return null;
}
const iso = (ms) => new Date(ms).toISOString().replace("Z", "");
const q = (s) => encodeURIComponent(s);
async function locations(session, driver, from, to) {
  const rows = (await json(`https://api.openf1.org/v1/location?session_key=${session}&driver_number=${driver}&date${q(">=")}${q(iso(from))}&date${q("<=")}${q(iso(to))}`)) ?? [];
  return rows.filter((r) => r.x != null && r.y != null && !(r.x === 0 && r.y === 0)).map((r) => [r.x, r.y, r.z ?? 0, +((Date.parse(r.date + (r.date.endsWith("Z") || r.date.includes("+") ? "" : "Z")) - from) / 1000).toFixed(2)]);
}

// all Grands Prix (races) OpenF1 has, newest first
const races = [];
for (let y = new Date().getUTCFullYear(); y >= 2023; y--) {
  const ss = (await json(`https://api.openf1.org/v1/sessions?year=${y}&session_name=Race`)) ?? [];
  for (const s of ss) if (Date.parse(s.date_end ?? s.date_start) < NOW - 3 * 3600e3) races.push(s);
}
races.sort((a, b) => Date.parse(b.date_start) - Date.parse(a.date_start));
console.log(`${races.length} races on OpenF1`);

for (const file of readdirSync(TRACKS).filter((f) => f.endsWith(".json"))) {
  const slug = file.replace(/\.json$/, ""), out = `${OUT}/${slug}.json`;
  if (only.length && !only.includes(slug)) continue;
  if (existsSync(out) && !force) { console.log(`${slug}: already done`); continue; }
  const t = JSON.parse(readFileSync(`${TRACKS}/${file}`, "utf8"));
  const cands = races.filter((s) => s.circuit_short_name === t.circuit);
  if (!cands.length) { console.log(`${slug}: no race on OpenF1`); continue; }
  let done = false;
  for (const s of cands.slice(0, 3)) {
    console.log(`${slug}: ${s.year} ${s.country_name} (session ${s.session_key})`);
    const laps = ((await json(`https://api.openf1.org/v1/laps?session_key=${s.session_key}`)) ?? []).filter((l) => l.lap_duration && l.date_start && !l.is_pit_out_lap && l.lap_number > 1);
    if (laps.length < 10) { console.log("  not enough laps"); continue; }
    laps.sort((a, b) => a.lap_duration - b.lap_duration);
    // the fastest few laps, from different drivers
    const picked = [], seen = new Set();
    for (const l of laps) { if (seen.has(l.driver_number)) continue; seen.add(l.driver_number); picked.push(l); if (picked.length === 3) break; }
    const lapData = [];
    for (const l of picked) {
      const t0 = Date.parse(l.date_start + (l.date_start.endsWith("Z") || l.date_start.includes("+") ? "" : "Z"));
      const pts = await locations(s.session_key, l.driver_number, t0 - 1500, t0 + l.lap_duration * 1000 + 1500);
      if (pts.length > 100) lapData.push({ driver: l.driver_number, lap: l.lap_number, time: l.lap_duration, startAt: 1.5, pts });
    }
    if (!lapData.length) { console.log("  no position data"); continue; }
    // normal pit stops (not the odd long one), different drivers
    const pits = ((await json(`https://api.openf1.org/v1/pit?session_key=${s.session_key}`)) ?? []).filter((p) => p.pit_duration > 5 && p.pit_duration < 60 && p.date);
    const med = pits.map((p) => p.pit_duration).sort((a, b) => a - b)[Math.floor(pits.length / 2)] ?? 0;
    const pitData = [], pseen = new Set();
    for (const p of pits.filter((p) => Math.abs(p.pit_duration - med) < 4)) {
      if (pseen.has(p.driver_number)) continue; pseen.add(p.driver_number);
      const t0 = Date.parse(p.date + (p.date.endsWith("Z") || p.date.includes("+") ? "" : "Z"));
      const pts = await locations(s.session_key, p.driver_number, t0 - 45000, t0 + (p.pit_duration + 45) * 1000);
      if (pts.length > 60) pitData.push({ driver: p.driver_number, lap: p.lap_number, laneTime: p.pit_duration, at: 45, pts });
      if (pitData.length === 3) break;
    }
    // the official map line and corners
    let mv = null;
    for (let y = s.year; y >= 2018 && !mv?.x?.length; y--) mv = await json(`https://api.multiviewer.app/api/v1/circuits/${s.circuit_key}/${y}`);
    writeFileSync(out, JSON.stringify({
      circuit: t.circuit, circuitKey: s.circuit_key, session: { key: s.session_key, year: s.year, country: s.country_name, location: s.location, date: s.date_start },
      units: "F1 position units (1/10 m)",
      map: mv?.x?.length ? { x: mv.x, y: mv.y, rotation: mv.rotation ?? 0, corners: (mv.corners ?? []).map((c) => ({ n: c.number, l: c.letter || "", x: c.trackPosition.x, y: c.trackPosition.y, angle: c.angle })) } : null,
      laps: lapData, pits: pitData, fetched: new Date().toISOString(),
    }));
    console.log(`  saved: ${lapData.length} laps (${lapData.map((l) => l.pts.length).join("/")} points), ${pitData.length} pit stops, map ${mv?.x?.length ? mv.x.length + " points" : "missing"}`);
    done = true; break;
  }
  if (!done) console.log(`${slug}: nothing usable`);
}

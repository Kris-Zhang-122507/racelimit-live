// The Track Builder's corner library: famous corners taken from the web game's real tracks, plus a basic kit, as
// 5 m steps of turn (degrees, + = left) and climb (m). Writes unity/com.racelimit.game/Library/corners.json.
// Run: node scripts/unity/export-corners.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const ROOT = new URL("../../", import.meta.url).pathname, D = ROOT + "public/data/";
const { CIRCUITS, buildTrack } = await import(ROOT + "public/race/trackdata.js");
const load = (id) => { const cfg = CIRCUITS[id]; const raw = JSON.parse(readFileSync(D + "tracks/" + cfg.slug + ".json")); let real = null; try { real = JSON.parse(readFileSync(D + "race/" + cfg.slug + ".json")); } catch {} let map = null; try { map = JSON.parse(readFileSync(D + "race-world/" + cfg.slug + ".json")); } catch {} return buildTrack(raw, cfg, real, map); };
// [track, corner numbers, name, where, metres before the first corner, metres after it]
const famous = [
  ["spa", [2, 3], "Eau Rouge – Raidillon", "Spa-Francorchamps", -140, 260],
  ["spa", [1], "La Source", "Spa-Francorchamps", -90, 110],
  ["spa", [10], "Pouhon", "Spa-Francorchamps", -160, 200],
  ["spa", [18, 19], "Bus Stop", "Spa-Francorchamps", -80, 160],
  ["monza", [11], "Parabolica", "Monza", -120, 260],
  ["monza", [1], "Variante del Rettifilo", "Monza", -120, 160],
  ["monza", [8, 9], "Ascari", "Monza", -100, 220],
  ["silverstone", [10, 11], "Maggotts – Becketts – Chapel", "Silverstone", -120, 420],
  ["silverstone", [9], "Copse", "Silverstone", -150, 170],
  ["suzuka", [15], "130R", "Suzuka", -160, 200],
  ["suzuka", [3], "S Curves", "Suzuka", -60, 520],
  ["suzuka", [11], "Hairpin", "Suzuka", -80, 100],
  ["monte-carlo", [6], "Grand Hotel Hairpin", "Monaco", -70, 80],
  ["monte-carlo", [13], "Swimming Pool", "Monaco", -70, 230],
  ["interlagos", [1], "Senna S", "Interlagos", -110, 260],
  ["zandvoort", [3], "Hugenholtz (banked)", "Zandvoort", -100, 150],
  ["austin", [1], "Turn 1 (uphill hairpin)", "Austin", -150, 110],
  ["austin", [3, 4, 5, 6], "The Esses", "Austin", -60, 420],
];
const out = [], tracks = {};
const steps = (pts) => { const st = []; for (let k = 5; k < pts.length; k += 5) { const a = pts[k - 5], b = pts[k]; st.push({ len: 5, turn: Math.round(((b.th - a.th + 3 * Math.PI) % (2 * Math.PI) - Math.PI) * 57.2958 * 100) / 100, rise: Math.round((b.y - a.y) * 100) / 100 }); } return st; };
for (const [id, cs, name, where, a, b] of famous) {
  const tr = tracks[id] ??= load(id); const idx = cs.map((n) => tr.cIdx[n]).filter((v) => v != null); if (!idx.length) { console.log("no corner", id, cs); continue; }
  const i0 = Math.min(...idx), pts = [];
  for (let d = i0 + a; d <= i0 + b; d++) { const i = tr.wrap(d), j = tr.wrap(d + 1), h = tr.wrap(d - 1); pts.push({ th: Math.atan2(tr.X[j] - tr.X[h], tr.Z[j] - tr.Z[h]), y: tr.Y[i] }); }
  out.push({ name, where, half: tr.half, real: true, steps: steps(pts) });
}
// the basic kit: [length, curvature (1/m, + = left)] pieces
const kit = [
  ["Hairpin", "180°, 15 m radius", [[30, 0], [47, 1 / 15], [30, 0]]],
  ["Chicane (left–right)", "slow, 25 m radius", [[20, 0], [30, 1 / 25], [25, 0], [30, -1 / 25], [20, 0]]],
  ["Chicane (right–left)", "slow, 25 m radius", [[20, 0], [30, -1 / 25], [25, 0], [30, 1 / 25], [20, 0]]],
  ["Double apex", "two clipping points", [[20, 0], [40, 1 / 45], [30, 1 / 120], [40, 1 / 45], [20, 0]]],
  ["Esses", "flowing left–right–left", [[20, 0], [60, 1 / 80], [60, -1 / 80], [60, 1 / 80], [20, 0]]],
  ["Kink", "flat out, 15°", [[20, 0], [80, 1 / 300], [20, 0]]],
  ["Crest", "a hill over a straight", [[150, 0, 8], [150, 0, -8]]],
  ["Dip", "down and back up", [[120, 0, -6], [120, 0, 6]]],
];
for (const [name, where, segs] of kit) {
  const st = []; for (const [len, k, climb = 0] of segs) for (let s = 0; s < len; s += 5) { const l = Math.min(5, len - s); st.push({ len: l, turn: Math.round(k * l * 57.2958 * 100) / 100, rise: Math.round(climb * (l / len) * 100) / 100 }); }
  out.push({ name, where, half: 7, real: false, steps: st });
}
mkdirSync(ROOT + "unity/com.racelimit.game/Library", { recursive: true });
writeFileSync(ROOT + "unity/com.racelimit.game/Library/corners.json", JSON.stringify({ corners: out }));
console.log(out.map((c) => `${c.name}: ${c.steps.length * 5} m, ${Math.round(c.steps.reduce((a, s) => a + s.turn, 0))}°`).join("\n"));

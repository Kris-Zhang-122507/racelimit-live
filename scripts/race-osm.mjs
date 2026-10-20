// OpenStreetMap data round each circuit, for the racing game's scenery: roads (the track itself, with
// its tunnels and bridges, and the roads that cross over it), buildings with their heights, water (lakes,
// harbours, swimming pools, the sea's coastline), gravel and sand traps, grass, tarmac run-off, woods and
// single trees. Saved raw, in metres east/north of the circuit's centre, to data/race-osm/<slug>.json;
// scripts/race-align.mjs then lines it up with the game's track and writes what the game loads.
//
// Map data © OpenStreetMap contributors, available under the Open Database Licence (ODbL).
// Runs in GitHub Actions (.github/workflows/race-osm.yml): one Overpass query per circuit, politely spaced.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

// circuit slug → its centre (lat, lon) and how far out to look (m)
const CIRCUITS = {
  melbourne: [-37.8497, 144.968, 2600], shanghai: [31.3389, 121.2197, 2600], suzuka: [34.8431, 136.541, 2600],
  miami: [25.9581, -80.2389, 2400], montreal: [45.5, -73.5228, 2800], "monte-carlo": [43.7347, 7.4206, 1800],
  catalunya: [41.57, 2.2611, 2200], spielberg: [47.2197, 14.7647, 2200], silverstone: [52.0786, -1.0169, 2800],
  "spa-francorchamps": [50.4372, 5.9714, 3400], hungaroring: [47.5789, 19.2486, 2200], zandvoort: [52.3888, 4.5409, 2000],
  monza: [45.6156, 9.2811, 2800], madring: [40.468, -3.612, 3200], baku: [40.3725, 49.8533, 2800],
  "kuala-lumpur": [2.7608, 101.7382, 2600], singapore: [1.2914, 103.864, 2200], austin: [30.1328, -97.6411, 2600],
  "mexico-city": [19.4042, -99.0907, 2400], interlagos: [-23.7036, -46.6997, 2000], "las-vegas": [36.1147, -115.1678, 3000],
  lusail: [25.49, 51.454, 2600], "yas-marina-circuit": [24.4672, 54.6031, 2600], sakhir: [26.0325, 50.5106, 2600],
  jeddah: [21.6319, 39.1044, 3400],
};
const OUT = "data/race-osm";
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
const UA = { "User-Agent": "racelimit-live fan project (github.com/Kris-Zhang-122507/racelimit-live)", "Content-Type": "application/x-www-form-urlencoded" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const only = process.argv.slice(2).filter((a) => !a.startsWith("--")), force = process.argv.includes("--force");
mkdirSync(OUT, { recursive: true });

async function overpass(query) {
  for (let i = 0; i < 6; i++) {
    const url = ENDPOINTS[i % ENDPOINTS.length];
    try {
      const r = await fetch(url, { method: "POST", headers: UA, body: "data=" + encodeURIComponent(query), signal: AbortSignal.timeout(240e3) });
      if (r.ok) return await r.json();
      console.log(`  ${r.status} from ${url}`);
    } catch (e) { console.log(`  ${e.message} from ${url}`); }
    await sleep(15000 * (i + 1));
  }
  return null;
}

// Douglas–Peucker, so long smooth outlines don't carry thousands of points
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let best = -1, bd = tol;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > bd) { bd = d; best = i; } }
    if (best > 0) { keep[best] = 1; st.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const num = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
function classify(t) {
  if (t.highway) return t.highway === "raceway" ? "raceway" : "road";
  if (t.building || t["building:part"]) return "building";
  if (t.leisure === "swimming_pool") return "pool";
  if (t.natural === "coastline") return "coastline";
  if (t.natural === "water" || t.waterway === "riverbank" || t.landuse === "basin" || t.landuse === "reservoir" || t.water) return "water";
  if (t.waterway === "river" || t.waterway === "canal") return "river";
  if (t.surface === "gravel" || t.surface === "fine_gravel" || t.surface === "pebblestone" || t.surface === "sand" || t.landuse === "gravel" || t.natural === "shingle") return "gravel";
  if (t.natural === "sand" || t.natural === "beach") return "sand";
  if (t["area:highway"] || t.surface === "asphalt" || t.surface === "paved" || t.surface === "concrete" || t.amenity === "parking" || t.highway === "pedestrian") return "paved";
  if (t.natural === "wood" || t.landuse === "forest") return "wood";
  if (t.natural === "scrub" || t.natural === "heath") return "scrub";
  if (t.landuse === "grass" || t.landuse === "meadow" || t.leisure === "park" || t.natural === "grassland" || t.landuse === "recreation_ground" || t.surface === "grass") return "grass";
  if (t.man_made === "bridge") return "bridgearea";
  if (t.barrier) return "barrier";
  return null;
}

for (const [slug, [lat0, lon0, R]] of Object.entries(CIRCUITS)) {
  const out = `${OUT}/${slug}.json`;
  if (only.length && !only.includes(slug)) continue;
  if (existsSync(out) && !force) { console.log(`${slug}: already done`); continue; }
  const kx = Math.cos((lat0 * Math.PI) / 180) * 111320, ky = 110574;
  const loc = (p) => [Math.round((p.lon - lon0) * kx * 10) / 10, Math.round((p.lat - lat0) * ky * 10) / 10];
  const A = `(around:${R},${lat0},${lon0})`, B = `(around:${Math.round(R * 0.85)},${lat0},${lon0})`;
  const query = `[out:json][timeout:200][maxsize:536870912];
(
  way["highway"]${A};
  way["building"]${B}; way["building:part"]${B}; relation["building"]${B};
  way["natural"~"^(water|coastline|sand|beach|wood|scrub|heath|grassland|shingle)$"]${A}; relation["natural"="water"]${A};
  way["water"]${A}; way["waterway"~"^(riverbank|river|canal)$"]${A}; way["landuse"~"^(basin|reservoir|grass|meadow|forest|recreation_ground|gravel)$"]${A}; relation["landuse"="forest"]${A};
  way["leisure"~"^(swimming_pool|park)$"]${A};
  way["surface"]["area"="yes"]${A}; way["area:highway"]${A}; way["amenity"="parking"]${A};
  way["man_made"="bridge"]${A};
  way["barrier"~"^(guard_rail|wall|jersey_barrier|fence|tyres)$"](around:${Math.round(R * 0.7)},${lat0},${lon0});
  node["natural"="tree"]${A};
);
out geom qt;`;
  console.log(`${slug}: querying (r ${R} m)…`);
  const res = await overpass(query);
  if (!res) { console.log(`${slug}: no answer, skipped`); continue; }
  const f = { slug, center: [lat0, lon0], radius: R, roads: [], buildings: [], areas: [], lines: [], trees: [], attribution: "© OpenStreetMap contributors, ODbL" };
  const count = {};
  for (const el of res.elements) {
    const t = el.tags ?? {};
    if (el.type === "node") { if (t.natural === "tree") f.trees.push(loc(el)); continue; }
    const kind = classify(t); if (!kind) continue;
    count[kind] = (count[kind] ?? 0) + 1;
    // outlines: a way's own geometry, or a relation's outer rings
    const rings = [];
    if (el.type === "way" && el.geometry) rings.push(el.geometry.map(loc));
    else if (el.type === "relation") for (const m of el.members ?? []) if (m.type === "way" && m.geometry && (m.role === "outer" || m.role === "")) rings.push(m.geometry.map(loc));
    for (const r0 of rings) {
      if (r0.length < 2) continue;
      const closed = r0.length > 3 && r0[0][0] === r0[r0.length - 1][0] && r0[0][1] === r0[r0.length - 1][1];
      if (kind === "raceway" || kind === "road") {
        f.roads.push({ k: kind === "raceway" ? "race" : t.highway, p: simplify(r0, 0.6), ...(t.tunnel && t.tunnel !== "no" ? { tunnel: 1 } : {}), ...(t.bridge && t.bridge !== "no" ? { bridge: 1 } : {}), ...(num(t.layer) ? { layer: num(t.layer) } : {}), ...(t.area === "yes" ? { area: 1 } : {}), ...(t.name ? { name: t.name.slice(0, 40) } : {}) });
      } else if (kind === "building") {
        if (!closed) continue;
        const lv = num(t["building:levels"]), h = num(t.height) ?? (lv != null ? lv * 3.2 + 1.5 : null), mh = num(t.min_height) ?? (num(t["building:min_level"]) != null ? num(t["building:min_level"]) * 3.2 : null);
        f.buildings.push({ p: simplify(r0, 0.5).slice(0, -1), ...(h ? { h: Math.round(h * 10) / 10 } : {}), ...(mh ? { mh } : {}), ...(t.building && t.building !== "yes" ? { b: t.building } : {}), ...(t["building:part"] ? { part: 1 } : {}), ...(t.name ? { name: t.name.slice(0, 40) } : {}), ...(t["roof:shape"] ? { roof: t["roof:shape"] } : {}), ...(t["building:colour"] ? { c: t["building:colour"] } : {}) });
      } else if (kind === "coastline" || kind === "river" || kind === "barrier") {
        f.lines.push({ k: kind === "barrier" ? t.barrier : kind, p: simplify(r0, 0.8) });
      } else {
        if (!closed) continue;
        f.areas.push({ k: kind, p: simplify(r0, 0.8).slice(0, -1), ...(t.water ? { w: t.water } : {}), ...(t.name ? { name: t.name.slice(0, 40) } : {}) });
      }
    }
  }
  writeFileSync(out, JSON.stringify(f));
  console.log(`${slug}: ${f.roads.length} roads (${f.roads.filter((r) => r.k === "race").length} raceway), ${f.buildings.length} buildings, ${f.areas.length} areas, ${f.lines.length} lines, ${f.trees.length} trees`, JSON.stringify(count));
  await sleep(8000);
}

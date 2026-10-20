// The racing game's menus: the main menu (modes), a race weekend (pick a circuit and a session),
// the garage (your team's colours) and settings. Plain DOM, shown before any 3D is built; resolves
// with what to drive: { track, session }.
import { load, save } from "../games/common.js?v=mvgcbjuz";

// the 2026 calendar, in order (the Bahrain GP was held at Sepang), then circuits only raced in 2025
export const CALENDAR = ["melbourne", "shanghai", "suzuka", "miami", "montreal", "monte-carlo", "catalunya", "spielberg", "silverstone", "spa", "hungaroring", "zandvoort", "monza", "madring", "baku", "kuala-lumpur", "singapore", "austin", "mexico-city", "interlagos", "las-vegas", "lusail", "yas-marina-circuit", "sakhir", "jeddah"];
const OFF_2026 = new Set(["sakhir", "jeddah"]);

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ICONS = {
  live: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="5"/><path d="M15 15a13 13 0 0 0 0 18M33 15a13 13 0 0 1 0 18M9 9a21 21 0 0 0 0 30M39 9a21 21 0 0 1 0 30"/></svg>',
  beat: '<svg viewBox="0 0 48 48"><path d="M6 34l12-12 8 7 16-17M6 42h36"/></svg>',
  career: '<svg viewBox="0 0 48 48"><path d="M14 6h20v10a10 10 0 0 1-20 0zM14 10H7a7 7 0 0 0 7 9M34 10h7a7 7 0 0 1-7 9M24 26v10M16 42h16"/></svg>',
  moments: '<svg viewBox="0 0 48 48"><path d="M24 5l5.6 12.2L43 19l-10 9.2 2.7 13.3L24 34.8l-11.7 6.7L15 28.2 5 19l13.4-1.8z"/></svg>',
  friends: '<svg viewBox="0 0 48 48"><circle cx="18" cy="16" r="7"/><circle cx="34" cy="18" r="5"/><path d="M5 40c1-8 6-12 13-12s12 4 13 12M30 30c6 0 10 3 12 9"/></svg>',
  replay: '<svg viewBox="0 0 48 48"><rect x="5" y="13" width="38" height="28" rx="4"/><circle cx="24" cy="27" r="8"/><path d="M17 13l3-6h8l3 6"/></svg>',
  daily: '<svg viewBox="0 0 48 48"><rect x="7" y="10" width="34" height="32" rx="4"/><path d="M7 19h34M16 5v9M32 5v9"/></svg>',
};

export function dailyTrack(date = new Date()) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5);
  const pool = CALENDAR.filter((c) => !OFF_2026.has(c));
  return pool[(day * 7) % pool.length];
}

export function openMenus({ CIRCUITS, settings, saveSettings, TEAMS }) {
  return new Promise((resolve) => {
    const root = el("div", "mm"); document.body.append(root);
    const done = (choice) => { root.remove(); resolve(choice); };
    const header = (title, back) => {
      const h = el("header", "mm-head");
      h.innerHTML = `<div class="brand">RACELIMIT <small>RACE</small></div><b class="mm-title">${esc(title)}</b><span class="spacer"></span>`;
      if (back) { const b = el("button", "btn ghost", "← Back"); b.type = "button"; b.onclick = back; h.append(b); }
      else {
        const g = el("button", "btn", "Garage"); g.type = "button"; g.onclick = garage;
        const s = el("button", "btn", "Settings · controls"); s.type = "button"; s.onclick = settingsScreen;
        const games = el("a", "btn ghost", "← Games"); games.href = "../games/";
        h.append(g, s, games);
      }
      return h;
    };

    // ---------- main menu ----------
    function main() {
      root.innerHTML = ""; root.append(header("Main menu"));
      const grid = el("div", "mm-grid");
      const hero = el("button", "mm-card hero"); hero.type = "button";
      hero.innerHTML = `<img src="img/hero.jpg?v=mvgcbjuz" alt="" loading="eager"><div class="mm-card-body"><span class="pill gold">Main mode</span><h2>Race weekend</h2><p>Practice and hot laps at any of the ${CALENDAR.length} circuits, with their real shapes, hills and pit lanes. Races against AI cars are coming.</p></div>`;
      hero.onclick = weekend; grid.append(hero);
      const today = dailyTrack(), dbest = load(`race.daily.${new Date().toISOString().slice(0, 10)}`, null);
      const cards = [
        ["live", "Live race", "During a real Grand Prix, race alongside it: the real cars' positions from live timing appear as ghosts.", "Only on RaceLimit"],
        ["beat", "Beat the driver", "Race a real driver's fastest lap as a ghost, then compare speed, braking and throttle with their telemetry."],
        ["career", "Career", "Start at a back-of-the-grid team, develop upgrades, manage the budget and get offers from bigger teams."],
        ["moments", "Famous moments", "Jump into real races at the moment it mattered: defend for 10 laps, win from the pit lane, survive the restart."],
        ["friends", "With friends", "Race online with a room code, or share a ghost lap link and see who's fastest this week."],
        ["replay", "Replays & photo mode", "Watch your laps from TV cameras, onboard or the helicopter; pause and frame a shot."],
        ["daily", "Daily challenge", `Today: ${esc(CIRCUITS[today].short)}. One lap, same for everyone; your best today: ${dbest ? fmt(dbest) : "none yet"}.`, null, () => done({ track: today, session: "daily" })],
      ];
      for (const [icon, title, text, badge, go] of cards) {
        const c = el(go ? "button" : "div", "mm-card" + (go ? "" : " soon")); if (go) { c.type = "button"; c.onclick = go; }
        c.innerHTML = `<div class="mm-icon">${ICONS[icon]}</div><div class="mm-card-body">${badge ? `<span class="pill green">${badge}</span>` : ""}${go ? "" : '<span class="pill">Coming soon</span>'}<h2>${title}</h2><p>${text}</p></div>`;
        grid.append(c);
      }
      root.append(grid);
      root.append(el("p", "muted small mm-credit", 'Circuit surroundings from map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>. All teams, sponsors and brands are made up.'));
    }

    // ---------- race weekend ----------
    const cache = {};
    const getJSON = (url) => (cache[url] ??= fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null));
    const outline = (pts, w = 60) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); const minX = Math.min(...xs), minY = Math.min(...ys), sz = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1; const sc = (w - 8) / sz, ox = (w - (Math.max(...xs) - minX) * sc) / 2, oy = (w - (Math.max(...ys) - minY) * sc) / 2; return pts.map((p, i) => `${i ? "L" : "M"}${(ox + (p[0] - minX) * sc).toFixed(1)},${(oy + (p[1] - minY) * sc).toFixed(1)}`).join("") + "Z"; };
    let sel = load("race.track", "spa") in CIRCUITS ? load("race.track", "spa") : "spa", session = load("race.session", "practice");
    function weekend() {
      root.innerHTML = ""; root.append(header("New race weekend", main));
      const wrap = el("div", "mm-week");
      const list = el("div", "mm-list"); list.innerHTML = `<div class="k">Circuit · 2026 calendar</div>`;
      const detail = el("div", "mm-detail"), side = el("div", "mm-side");
      wrap.append(list, detail, side); root.append(wrap);
      for (const id of CALENDAR) {
        const c = CIRCUITS[id]; if (!c) continue;
        const b = el("button", "mm-track" + (id === sel ? " on" : "")); b.type = "button"; b.dataset.id = id;
        b.innerHTML = `<svg viewBox="0 0 60 60" class="mm-thumb"><path d=""/></svg><div><b>${esc(c.short)}</b><span>${(c.lengthM / 1000).toFixed(3)} km · ${c.laps} laps${OFF_2026.has(id) ? " · 2025" : ""}</span></div>`;
        b.onclick = () => { sel = id; for (const x of list.querySelectorAll(".mm-track")) x.classList.toggle("on", x.dataset.id === id); show(); };
        list.append(b);
        getJSON(`../data/tracks/${c.slug}.json`).then((t) => { if (t) b.querySelector("path").setAttribute("d", outline(t.points)); });
      }
      // session and assists
      const seg = (label, key, opts, cur, onPick) => { const d = el("div", "set"); d.innerHTML = `<span class="k">${label}</span>`; const s = el("div", "seg"); for (const [v, t, dis] of opts) { const b = el("button", "", t); b.type = "button"; b.disabled = !!dis; b.setAttribute("aria-pressed", String(v === cur())); b.onclick = () => { onPick(v); for (const x of s.children) x.setAttribute("aria-pressed", String(x === b)); }; s.append(b); } d.append(s); return d; };
      side.append(el("h3", "", "Weekend settings"));
      side.append(seg("Session", "session", [["practice", "Practice"], ["hotlap", "Hot laps"], ["race", "Race · soon", true]], () => session, (v) => { session = v; save("race.session", v); note(); }));
      const preset = () => (settings.auto && settings.abs && settings.tc && settings.stability ? "lots" : !settings.abs && !settings.tc && !settings.stability ? "none" : "some");
      side.append(seg("Assists", "assists", [["lots", "Lots"], ["some", "Some"], ["none", "None"]], preset, (v) => {
        Object.assign(settings, v === "lots" ? { auto: true, abs: true, tc: true, stability: true, line: "full" } : v === "some" ? { auto: true, abs: true, tc: true, stability: false, line: "braking" } : { auto: false, abs: false, tc: false, stability: false, line: "off" }); saveSettings();
      }));
      side.append(seg("Starting tyres", "tyre", [["soft", "Soft"], ["medium", "Medium"], ["hard", "Hard"]], () => load("race.tyre", "medium"), (v) => save("race.tyre", v)));
      side.append(seg("Weather", "weather", [["dry", "Dry"], ["wet", "Rain · soon", true]], () => "dry", () => {}));
      const sNote = el("p", "muted small"); side.append(sNote);
      const note = () => { sNote.textContent = session === "practice" ? "You start in your team's garage and drive out of the pit lane (tyres come off the blankets at 70 °C, so warm them up). Laps are timed from the line. Stop in your box to change tyres." : session === "hotlap" ? "Flying laps: you start on the way to the line at speed, then every lap is timed." : ""; };
      note();
      const go = el("button", "btn primary big", "Start weekend →"); go.type = "button"; go.onclick = () => { save("race.track", sel); done({ track: sel, session }); };
      side.append(go);
      show();
      async function show() {
        const id = sel, c = CIRCUITS[id];
        detail.innerHTML = `<h2>${esc(c.name)}</h2><div class="mm-stats"><div><span class="k">Lap length</span><b>${(c.lengthM / 1000).toFixed(3)} km</b></div><div><span class="k">Race laps</span><b>${c.laps}</b></div><div><span class="k">Height difference</span><b id="mmH">…</b></div><div><span class="k">Corners</span><b id="mmC">…</b></div><div><span class="k">Race time</span><b>${c.time === "night" ? "Night, under lights" : c.time === "dusk" ? "Sunset into night" : "Day"}</b></div><div><span class="k">Type</span><b>${c.street ? "Street circuit" : "Permanent circuit"}</b></div></div><svg class="mm-map" viewBox="0 0 400 300"></svg><div class="k">Height · metres along the lap</div><svg class="mm-elev" viewBox="0 0 600 120" preserveAspectRatio="none"></svg><p class="muted small" id="mmSrc"></p>`;
        const [t, real] = await Promise.all([getJSON(`../data/tracks/${c.slug}.json`), getJSON(`../data/race/${c.slug}.json`)]);
        if (sel !== id) return;
        if (t) {
          const xs = t.points.map((p) => p[0]), ys = t.points.map((p) => p[1]), minX = Math.min(...xs), minY = Math.min(...ys), sz = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY), sc = 270 / sz, ox = 200 - ((Math.max(...xs) + minX) / 2 - minX) * sc, oy = 150 - ((Math.max(...ys) + minY) / 2 - minY) * sc;
          const P = (p) => [ox + (p[0] - minX) * sc, oy + (p[1] - minY) * sc];
          let svg = `<path d="${t.points.map((p, i) => `${i ? "L" : "M"}${P(p).map((v) => v.toFixed(1)).join(",")}`).join("")}Z" class="mm-line"/>`;
          const [sx, sy] = P(t.points[0]); svg += `<circle cx="${sx}" cy="${sy}" r="5" class="mm-start"/>`;
          for (const cn of t.corners ?? []) { const [x, y] = P(cn.p); svg += `<g class="mm-corner"><circle cx="${x}" cy="${y}" r="8"/><text x="${x}" y="${y + 3.5}">${cn.n}</text></g>`; }
          detail.querySelector(".mm-map").innerHTML = svg;
          detail.querySelector("#mmC").textContent = String(t.corners?.length || real?.map?.corners?.length || "–");
        }
        if (real?.laps?.length) {
          const lap = real.laps[0].pts; let d = 0; const prof = [];
          for (let k = 0; k < lap.length; k++) { if (k) d += Math.hypot(lap[k][0] - lap[k - 1][0], lap[k][1] - lap[k - 1][1]) / 10; prof.push([d, lap[k][2] / 10]); }
          const zs = prof.map((p) => p[1]), zmin = Math.min(...zs), zmax = Math.max(...zs), dmax = d || 1;
          detail.querySelector("#mmH").textContent = `${Math.round(zmax - zmin)} m`;
          const sm = prof.map((p, i) => { let a = 0, n = 0; for (let q = -3; q <= 3; q++) { const r = prof[i + q]; if (r) { a += r[1]; n++; } } return [p[0], a / n]; });
          const y = (z) => 110 - ((z - zmin) / Math.max(1, zmax - zmin)) * 95;
          detail.querySelector(".mm-elev").innerHTML = `<path class="mm-elev-fill" d="M0,120 ${sm.map(([dd, z]) => `L${((dd / dmax) * 600).toFixed(1)},${y(z).toFixed(1)}`).join(" ")} L600,120Z"/><path class="mm-elev-line" d="${sm.map(([dd, z], i) => `${i ? "L" : "M"}${((dd / dmax) * 600).toFixed(1)},${y(z).toFixed(1)}`).join(" ")}"/>`;
          detail.querySelector("#mmSrc").textContent = `Shape, heights and pit lane from F1's car position data (${real.session.year} ${real.session.country} GP), via OpenF1.`;
        } else detail.querySelector("#mmH").textContent = "–";
      }
    }

    // ---------- garage: your colours ----------
    function garage() {
      root.innerHTML = ""; root.append(header("Garage · your car", main));
      const wrap = el("div", "mm-garage");
      wrap.innerHTML = `<p class="muted">Pick your team's colours (all made-up teams). Engine sound and the rest of the car's settings are in Settings; car setup and engine tuning are coming.</p>`;
      const grid = el("div", "mm-teams"), cur = load("race.team", "RACELIMIT");
      for (const t of TEAMS) {
        const b = el("button", "mm-team" + (t.team === cur ? " on" : "")); b.type = "button";
        b.innerHTML = `<span class="sw" style="background:linear-gradient(135deg, ${t.body} 0 55%, ${t.accent} 55% 80%, ${t.stripe} 80%)"></span><b>${esc(t.team)}</b><span class="muted small">#${t.number}</span>`;
        b.onclick = () => { save("race.team", t.team); for (const x of grid.children) x.classList.toggle("on", x === b); };
        grid.append(b);
      }
      wrap.append(grid); root.append(wrap);
    }

    // ---------- settings ----------
    function settingsScreen() {
      root.innerHTML = ""; root.append(header("Settings · controls", main));
      const wrap = el("div", "mm-settings panel menu");
      const rows = [
        ["Gears", "auto", [["true", "Automatic"], ["false", "Manual"]]], ["Anti-lock brakes", "abs", [["true", "On"], ["false", "Off"]]], ["Traction control", "tc", [["true", "On"], ["false", "Off"]]],
        ["Stability help", "stability", [["true", "On"], ["false", "Off"]]], ["Racing line", "line", [["full", "Full"], ["braking", "Braking only"], ["off", "Off"]]],
        ["Engine sound", "engine", [["raw", "Raw"], ["deep", "Deep"]]], ["Graphics", "quality", [["high", "High"], ["low", "Low (faster)"]]], ["On-screen info", "hudInfo", [["full", "Full"], ["simple", "Simple"]]], ["On-screen display size", "hud", [["normal", "Normal"], ["large", "Large"], ["xl", "Extra large"]]], ["Camera", "camera", [["chase", "Chase"], ["far", "Far"], ["tcam", "T-cam"], ["cockpit", "Cockpit"]]],
      ];
      for (const [label, k, opts] of rows) {
        const d = el("div", "set"); d.innerHTML = `<span>${label}</span>`; const s = el("div", "seg");
        for (const [v, t] of opts) { const b = el("button", "", t); b.type = "button"; b.setAttribute("aria-pressed", String(String(settings[k]) === v)); b.onclick = () => { settings[k] = v === "true" ? true : v === "false" ? false : v; saveSettings(); for (const x of s.children) x.setAttribute("aria-pressed", String(x === b)); }; s.append(b); }
        d.append(s); wrap.append(d);
      }
      wrap.append(el("div", "keys", `<div><b>↑ / W</b> throttle</div><div><b>↓ / S</b> brake (hold when stopped to reverse)</div><div><b>← → / A D</b> steer</div><div><b>E / Q</b> gear up / down</div><div><b>Space</b> overtake (full battery power)</div><div><b>C</b> change camera</div><div><b>B</b> look behind</div><div><b>R</b> back on track</div><div><b>L</b> racing line</div><div><b>[ ]</b> brake bias back / forward</div><div><b>Tab</b> more / less on-screen info</div><div><b>M</b> sound · <b>Esc</b> pause</div>`));
      wrap.append(el("p", "muted small", "A game controller works too: right trigger throttle, left trigger brake, stick to steer, bumpers for gears, A for overtake, Y for camera, d-pad up / down for brake bias."));
      root.append(wrap);
    }

    main();
  });
}
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(3).padStart(6, "0")}`;

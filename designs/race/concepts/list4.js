import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, tag, drv, chart, trackSvg, mount, TEAMS, A, pin } from "./common.js";
const AA = {};
await Promise.all(["n-explain", "n-spotter", "n-wind", "n-kerbs", "n-blankets", "n-trackwalk", "n-museum", "n-pa", "tv-1", "tv-2", "s-split1"].map(async (n) => (AA[n] = await A(n))));

const S = {};
const key = (k) => `<span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">${k}</span>`;

// 1 · jump into a real race
S.realrace = () => top("Real races · <b>Jump in at any lap</b>", `<span class="chip">From your live timing archive</span>`, "s-night") + `
  <div class="grid" style="grid-template-columns:1.35fr 1fr;height:727px">
    <div class="panel" style="padding:0;overflow:hidden;display:grid;grid-template-rows:400px auto">
      <div style="background:url(bg/n-realrace.png) center/cover;position:relative"><div class="hudbox" style="left:12px;top:12px"><div class="lbl2 acc">Singapore 2026 · lap 30 of 62</div><b style="font:700 22px BC">As it really was</b></div></div>
      <div style="padding:14px 18px;display:grid;gap:8px"><div class="muted" style="font:500 14px B">The AI grid starts from the real order, gaps, tyres and pit stops at that lap. Then it's yours: can you change the result?</div>
        <div class="row">${["Real gaps", "Real tyres and ages", "Real weather", "Safety car as it happened (optional)"].map((x) => `<span class="chip">${x}</span>`).join("")}</div></div></div>
    <div class="panel"><h2>Pick the moment</h2>
      <table>${[["Singapore", "Race · 11 Oct", "1"], ["Bahrain", "Race · 4 Oct", ""], ["Baku", "Race · 26 Sep", ""], ["Monza", "Race · 6 Sep", ""]].map(([a, b, on]) => `<tr${on ? ` style="background:#1E1A12"` : ""}><td><b>${a}</b></td><td class="muted">${b}</td></tr>`).join("")}</table>
      <div class="lbl2" style="margin:14px 0 6px">Start at</div>${sl("Lap", 48, "30")}
      <div class="lbl2" style="margin:14px 0 6px">You drive</div>
      <div style="display:grid;gap:5px">${[["3", "BRD", "M · 12 laps", "+5.1"], ["4", "YOU", "H · 4 laps", "+6.0"], ["5", "SLV", "M · 14 laps", "+7.9"]].map(([p, c, t, g], i) => `<div class="row card2" style="padding:6px 10px;${i === 1 ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><b class="mono" style="width:22px">${p}</b><span style="flex:1">${drv(c === "YOU" ? "YOU" : c)}</span><span class="muted" style="font:600 12px B">${t}</span><b class="mono">${g}</b></div>`).join("")}</div>
      <div class="lbl2" style="margin:14px 0 6px">Goal</div>${tg(["Beat their real result (P6)", "Podium", "Win"], 0)}
      <span class="btn primary" style="margin-top:14px">Start at lap 30</span></div>
  </div>${concept("Concept render · jump into a real race")}`;

// 2 · this weekend's real weather
S.realweather = () => top("Race weekend · <b>Mexico City · real forecast</b>", `<span class="chip">Updated 12 min ago</span>`, "s-weather") + `
  <div class="grid" style="grid-template-columns:repeat(3,1fr);height:727px">
    ${[["Fri 31 Oct", "FP1 · FP2", "☀", "24°", "Track 41°", "0%"], ["Sat 1 Nov", "FP3 · Qualifying", "⛅", "22°", "Track 36°", "10%"], ["Sun 2 Nov", "Race", "🌧", "19°", "Track 27°", "60%"]].map(([d, s2, i, t, tt, r], k) => `<div class="panel" style="${k === 2 ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b style="font:700 24px BC">${d}</b><span class="chip">${s2}</span></div><div class="row" style="margin-top:8px;gap:16px"><span style="font-size:52px">${i}</span><div><b class="big mono">${t}</b><div class="muted">${tt}</div></div><div style="margin-left:auto;text-align:right"><div class="lbl2">Rain</div><b class="mono ${k === 2 ? "blue" : ""}" style="font-size:26px">${r}</b></div></div></div>`).join("")}
    <div class="panel" style="grid-column:span 2"><h2>Race day, hour by hour</h2>
      ${chart(880, 150, [{ pts: [0.05, 0.08, 0.15, 0.4, 0.7, 0.62, 0.35, 0.2], c: "#5AA9FF" }], { extra: `<rect x="330" y="0" width="250" height="150" fill="#5AA9FF" opacity=".08"/><text x="336" y="16" fill="#7FC4FF" font-family="B" font-weight="600" font-size="12">race 14:00–15:40</text>` })}
      <div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2;margin-top:4px"><span>11:00</span><span>12:00</span><span>13:00</span><span>14:00</span><span>15:00</span><span>16:00</span><span>17:00</span></div>
      <div class="muted" style="margin-top:8px;font:500 13px B">Rain chance peaks around lap 30. Your race in the game uses this forecast: light rain from about two-thirds distance.</div></div>
    <div class="panel"><h2>Weather in the game</h2>${tg(["Real forecast", "Real, updated live", "Pick my own"], 0)}
      <div style="display:grid;gap:6px;margin-top:12px">${kv("Source", "public weather forecast")}${kv("Altitude", "2,240 m · thin air")}${kv("Wind", "8 km/h from the north")}</div>
      <div class="card2" style="margin-top:12px"><b class="acc">Tip:</b> <span class="muted">thin air here means less downforce and less cooling. Open up the brake ducts.</span></div></div>
  </div>${concept("Concept render · this weekend's real weather")}`;

// 3 · rejoin predictor on the HUD
const ring = () => { const C = 110, R = 82, pt = (f, r = R) => [C + r * Math.sin(f * 2 * Math.PI), C - r * Math.cos(f * 2 * Math.PI)];
  const cars = [[0.02, "#16245C", "OKA"], [0.09, "#C8102E", "BRD"], [0.16, "#FFA51F", "YOU"], [0.21, "#16B8A6", "SLV"], [0.33, "#0F4D3A", "ISH"], [0.45, "#F2F3F5", "VRG"], [0.52, "#FF7A1A", "DEL"], [0.6, "#5B2A86", "KAI"]];
  const arc = (a, b, r) => { const [x0, y0] = pt(a, r), [x1, y1] = pt(b, r); return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`; };
  return `<svg width="220" height="220" viewBox="0 0 220 220"><circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#262B36" stroke-width="5"/><path d="${arc(0.47, 0.5, R)}" stroke="#2FD27A" stroke-width="16" fill="none" opacity=".45"/><path d="${arc(0.16, 0.485, R - 16)}" stroke="#FFB547" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
    ${cars.map(([f, c, n]) => { const [x, y] = pt(f); return `<circle cx="${x}" cy="${y}" r="${n === "YOU" ? 8 : 6}" fill="${c}" stroke="${n === "YOU" ? "#FFB547" : "#0B0D12"}" stroke-width="2"/>`; }).join("")}
    <text x="${C}" y="${C - 6}" text-anchor="middle" fill="#E8EAF0" font-family="BC" font-weight="700" font-size="22">PIT NOW</text><text x="${C}" y="${C + 16}" text-anchor="middle" fill="#6EE7A8" font-family="B" font-weight="600" font-size="14">→ P6</text></svg>`; };
S.rejoin = () => `${bg("s-split1")}
  ${note("Rejoin predictor", "Where you'd come out if you pitted now", ["The circle of doom from your live timing site, on the HUD: every car round one lap, placed by its gap.", "The green band is where you'd rejoin after a stop, so you can see who you'd come out behind (and if there's traffic) before you call it.", "Under a safety car the band jumps forward, because a stop costs less."])}
  <div class="hudbox" style="left:18px;bottom:16px;display:flex;gap:14px;align-items:center">${ring()}<div style="display:grid;gap:6px;width:200px">${kv("Rejoin", `<span class="good">P6</span>`)}${kv("Behind", "VRG · 1.8 s")}${kv("Ahead of", "DEL · 3.1 s")}${kv("Stop costs", "21.4 s")}<div class="muted" style="font:600 11px B">${key("B")} box this lap</div></div></div>
  ${hb([gear(8, 312), t2("P3 · Lap 31/44", "+0.9 to BRD"), t2(`Tyres <span class="mono acc">M 23 laps</span>`, "wear 68%")], "left:60%;bottom:16px;transform:translateX(-50%)")}
  ${concept("Concept render · rejoin predictor on the HUD")}`;

// 4 · explain it simply
S.explain = () => `${bg("n-explain")}
  ${pin(AA["n-explain"], "vsc", `${pill("VSC BOARD", "#2A2310", "#F2C230")}`, { up: 50 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);width:760px;padding:14px 18px"><div class="row"><span class="pill" style="background:#2A2310;color:#F2C230;font-size:13px">VIRTUAL SAFETY CAR</span><span class="muted" style="font:600 12px B;margin-left:auto">explain it simply · on</span></div>
    <div style="font:600 18px/1.45 B;margin-top:8px">Everyone has to slow to the same speed, so the gaps stay the same. No overtaking.</div>
    <div class="muted" style="font:500 14px B;margin-top:4px">Good time to pit: a stop costs about 12 s now instead of 21 s. Keep your delta bar in the green.</div></div>
  ${note("Explain it simply", "Rules explained as they happen", ["When something happens (a safety car, a penalty, track limits, blue flags), one short line says what it means for you.", "The same plain-English notes as your live timing site.", "Turn it off once you know the rules."], "left:18px;top:200px", 400)}
  ${hb([gear(5, 168), `<div class="lbl2">VSC delta</div><div style="width:180px;height:8px;border-radius:4px;background:#2A2F3B;position:relative"><i style="position:absolute;left:30%;width:40%;top:0;bottom:0;background:#2FD27A;border-radius:4px;opacity:.5"></i><i style="position:absolute;left:44%;top:-4px;bottom:-4px;width:3px;background:#E8EAF0"></i></div><div class="good" style="font:600 11px B">+0.4 s · fine</div>`, t2("Box now?", `${key("B")} costs ~12 s`)])}
  ${concept("Concept render · explain it simply")}`;

// 5 · spotter arrows and mirrors
S.spotter = () => { const a = AA["n-spotter"].side ?? [200, 500], left = a[0] < 800; return `${bg("n-spotter")}
  <div style="position:absolute;${left ? "left:0" : "right:0"};top:240px;width:26px;height:360px;background:linear-gradient(${left ? "90deg" : "270deg"},rgba(255,181,71,.9),rgba(255,181,71,0))"></div>
  <div class="hudbox" style="${left ? "left:40px" : "right:40px"};top:380px;display:flex;align-items:center;gap:10px"><span style="font:700 30px BC;color:#FFB547">${left ? "◀" : "▶"}</span>${t2("CAR " + (left ? "LEFT" : "RIGHT"), "BRD · alongside · 0.4 m behind")}</div>
  ${note("Spotter and mirrors", "Know who's beside you", ["A bar lights up on the side of the screen when a car is alongside, like a spotter in your ear.", "The mirrors show the real cars behind you, sharp enough to judge a gap.", "An optional voice says 'car left', 'still there', 'clear'."], `${left ? "right" : "left"}:18px;top:18px`)}
  ${box(`${left ? "right" : "left"}:18px;bottom:16px`, 300, `<div class="lbl2" style="margin-bottom:6px">Spotter</div>${tg(["Bar", "Bar + voice", "Off"], 1)}<div class="lbl2" style="margin:10px 0 6px">Mirrors</div>${tg(["High detail", "Normal", "Off (faster)"], 1)}`)}
  ${concept("Concept render · spotter arrows and mirrors")}`; };

// 6 · brake migration and engine braking
S.migration = () => `${bg("n-migration")}
  ${note("Brake migration and engine braking", "The settings drivers change every few corners", ["Brake migration moves the brake balance rearward as you come off the pedal, so the car turns in better without locking the fronts.", "Engine braking sets how much the engine slows the rear when you lift: more is stable, less helps rotation.", "Both are optional. Leave them on Auto and the car sets them for each corner."], "left:18px;top:18px", 440)}
  ${box("right:18px;top:18px", 380, `<div class="lbl2" style="margin-bottom:8px">Brake balance through this braking zone</div>
    ${chart(350, 120, [{ pts: [0.75, 0.75, 0.74, 0.7, 0.6, 0.48, 0.4, 0.36], c: "#FFB547" }], { extra: `<text x="4" y="14" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11">front 62%</text><text x="290" y="104" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11">56%</text>` })}
    <div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2;margin-top:4px"><span>full pedal</span><span>trail braking</span><span>turn in</span></div>
    <div style="display:grid;gap:10px;margin-top:12px">${sl("Brake migration", 60, "3 / 5")}${sl("Engine braking", 40, "EB 4")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Mode</div>${tg(["Auto per corner", "Manual (wheel)", "Off"], 1)}`)}
  ${hb([gear(6, 251), t2(`BBAL <span class="mono acc">62.0</span>`, "MIG 3 · EB 4"), t2("La Source", "brake at 100 m")])}
  ${concept("Concept render · brake migration and engine braking")}`;

// 7 · wind
S.wind = () => `${bg("n-wind")}
  ${pin(AA["n-wind"], "sock", `${pill("WINDSOCK", "#2A1A10", "#FFB060")} <span class="muted" style="font:600 12px B">gusting 28 km/h</span>`, { up: 50 })}
  ${note("Wind", "Gusts change your top speed and balance", ["A headwind on a straight costs top speed but gives more downforce into the next corner; a tailwind does the opposite.", "A crosswind in a fast corner can make the car snap. Windsocks and flags show which way it's blowing.", "Strength and direction change during a session."])}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">Wind now</div><div class="row" style="gap:16px"><svg width="110" height="110" viewBox="0 0 110 110"><circle cx="55" cy="55" r="48" fill="none" stroke="#2A2F3B" stroke-width="3"/><text x="55" y="16" text-anchor="middle" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11">N</text><path d="M55 92 L55 22 M42 36 L55 22 L68 36" stroke="#FFB547" stroke-width="5" fill="none" stroke-linecap="round" transform="rotate(-40 55 55)"/></svg><div style="display:grid;gap:4px">${kv("Speed", "18 km/h")}${kv("Gusts", "28 km/h")}${kv("On this straight", `<span class="bad">headwind</span>`)}</div></div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Top speed", `<span class="bad">−6 km/h</span>`)}${kv("Into Stowe", `<span class="good">+3% downforce</span>`)}</div>
    <div class="lbl2" style="margin:12px 0 6px">Wind</div>${tg(["Real (forecast)", "Calm", "Gusty", "Off"], 0)}`)}
  ${hb([gear(8, 304), t2(`Wind <span class="mono acc">18 km/h</span>`, "headwind on the Hangar straight"), t2("Gust", "in 4 s")])}
  ${concept("Concept render · wind")}`;

// 8 · kerb types
S.kerbs = () => `${bg("n-kerbs")}
  ${pin(AA["n-kerbs"], "sausage", `${pill("SAUSAGE KERB", "#2A2310", "#F2C230")} <span class="bad" style="font:600 12px B">launches the car</span>`, { up: 80 })}
  ${pin(AA["n-kerbs"], "rumble", `${pill("RUMBLE STRIP", "#1C2230", "#E8EAF0")} <span class="good" style="font:600 12px B">use it</span>`, { up: 70 })}
  ${pin(AA["n-kerbs"], "paint", `${pill("PAINTED RUN-OFF", "#14361F", "#6EE7A8")} <span class="blue" style="font:600 12px B">slippery when wet</span>`, { up: 60 })}
  ${note("Kerb types", "Every kerb does something different", ["Flat kerbs: free to use, a little bumpy.", "Rumble strips: fine, but they unsettle the car if you hit them hard.", "Sausage kerbs: there to stop you cutting the corner. Hit one and the car jumps, maybe breaks the floor.", "Painted run-off: grippy when dry, like ice when it's wet."], "left:18px;top:18px", 410)}
  ${concept("Concept render · kerb types")}`;

// 9 · tyre blankets and warm-up
S.blankets = () => `${bg("n-blankets")}
  ${pin(AA["n-blankets"], "blanket", `${pill("BLANKETS · 70°", "#3A1218", "#FF8A8A")}`, { up: 70, dx: -40 })}
  ${note("Tyre blankets and warm-up", "Warm tyres out of the garage, cold ones by Turn 3", ["The tyres sit in blankets at 70 °C. Out of the garage they start cooling straight away.", "Weave, brake hard and accelerate hard on the out lap to put heat back in.", "On a cold day, a lap on cold tyres means no grip and an easy spin."])}
  ${box("right:18px;top:18px", 380, `<div class="lbl2" style="margin-bottom:8px">Tyre temperature on the out lap</div>
    ${chart(350, 120, [{ pts: [0.8, 0.68, 0.56, 0.5, 0.55, 0.62, 0.7, 0.78, 0.84], c: "#FF8A3A" }, { pts: [0.8, 0.66, 0.5, 0.4, 0.35, 0.33, 0.32, 0.31, 0.3], c: "#5AA9FF", dash: "6 5" }], { extra: `<rect x="0" y="12" width="350" height="34" fill="#2FD27A" opacity=".1"/><text x="4" y="40" fill="#6EE7A8" font-family="B" font-weight="600" font-size="11">window</text>` })}
    <div style="display:flex;gap:14px;font:600 11px B;margin-top:6px"><span style="color:#FF8A3A">— weaving and pushing</span><span class="blue">- - cruising</span></div>
    <div class="lbl2" style="margin:12px 0 6px">Blankets</div>${tg(["70 °C (real)", "Off (2021+ rules)", "Hotter"], 0)}`)}
  ${concept("Concept render · tyre blankets and warm-up")}`;

// 10 · mirror and reverse tracks
const spaMap = [[18, 26], [24, 14], [32, 20], [34, 34], [46, 44], [64, 50], [82, 62], [90, 78], [80, 88], [62, 82], [48, 76], [36, 66], [26, 54], [18, 40]];
S.mirror = () => `${bg("n-mirror")}
  ${note("Reverse and mirror tracks", "Every circuit, backwards or flipped", ["Reverse: drive the lap the other way. Eau Rouge becomes a plunge downhill into a hairpin.", "Mirror: the circuit flipped left to right, so every left turn becomes a right.", "Same scenery, brand-new corners. Your times are kept separately."])}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">Spa-Francorchamps</div>
    <div style="display:grid;place-items:center;background:#0E1117;border-radius:10px;padding:8px">${trackSvg(spaMap, 280, 170, { c: "#FFB547", extra: `<path d="M150 70 l-14 -4 l6 12 Z" fill="#FFB547"/><text x="8" y="16" fill="#FFB547" font-family="B" font-weight="600" font-size="12">◀ reverse direction</text>` })}</div>
    <div class="lbl2" style="margin:12px 0 6px">Layout</div>${tg(["Normal", "Reverse", "Mirror", "Reverse + mirror"], 1)}
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Your best (reverse)", "1:44.81")}${kv("Hardest corner", "Raidillon downhill")}</div>`)}
  ${hb([gear(5, 201), t2("Reverse Spa", "Lap 2 · first time here"), t2("Next", "Eau Rouge, downhill")])}
  ${concept("Concept render · reverse and mirror tracks")}`;

// 11 · track walk
S.trackwalk = () => `${bg("n-trackwalk")}
  ${pin(AA["n-trackwalk"], "board", `<div style="display:grid;gap:2px"><b style="font:600 13px B">Brake at the 100 board</b><span class="muted" style="font:600 12px B">down to 2nd gear · 70 km/h</span></div>`, { up: 70, dx: -80 })}
  ${pin(AA["n-trackwalk"], "apex", `<div style="display:grid;gap:2px"><b style="font:600 13px B">Apex: the inside kerb</b><span class="muted" style="font:600 12px B">it's flat, use all of it</span></div>`, { up: 90, dx: 60 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);text-align:center;padding:10px 22px"><div class="lbl2 acc">Track walk · Thursday</div><b style="font:700 26px BC">Spa · La Source</b><div class="muted" style="font:600 12px B">Turn 1 of 19 · walk with ${key("W")} ${key("A")} ${key("S")} ${key("D")}</div></div>
  ${note("Track walk", "Walk the circuit before the weekend", ["Like the real drivers on Thursday: walk the lap on foot with your engineer.", "Notes pop up at each corner: braking point, gear, which kerbs you can use and where the bumps are.", "Jump to any corner, or drive it slowly in a road car."], "left:18px;top:150px", 400)}
  ${box("right:18px;top:150px", 300, `<div class="lbl2" style="margin-bottom:8px">La Source</div><div style="display:grid;gap:6px">${kv("Gear", "2nd")}${kv("Speed", "70 km/h")}${kv("Braking", "from 300 km/h")}${kv("Watch out", "bump at the entry")}</div>`)}
  ${concept("Concept render · track walk")}`;

// 12 · car museum
S.museum = () => `${bg("n-museum")}
  ${[["e1998", "1998–2008", "V10 · grooved tyres"], ["e2009", "2009–2013", "KERS · slicks again"], ["e2014", "2014–2016", "turbo hybrid"], ["e2017", "2017–2021", "wide cars"], ["e2022", "2022–2025", "ground effect"], ["e2026", "2026", "active aero"]].map(([k, a, b]) => pin(AA["n-museum"], k, `<div style="display:grid;gap:1px"><b style="font:700 18px BC">${a}</b><span class="muted" style="font:600 11px B">${b}</span></div>`, { up: 60 })).join("")}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);text-align:center;padding:10px 22px"><div class="lbl2 acc">Garage</div><b style="font:700 28px BC">Car museum · 6 of 9 unlocked</b></div>
  ${note("Car museum", "Every car you've unlocked", ["One car from each era, on its own plinth. Walk round them, open the engine cover, read how they changed.", "Each era unlocks by racing it, or by finishing a famous moment.", "Pick one and take it straight onto the track."], "left:18px;bottom:16px", 400)}
  ${box("right:18px;bottom:16px", 300, `<div class="lbl2" style="margin-bottom:6px">Still locked</div><div style="display:grid;gap:5px;font:600 13px B"><div>🔒 1990s turbo era · win 5 races</div><div>🔒 1970s · finish the Hockenheim challenge</div><div>🔒 Prototype · beat 10 real poles</div></div>`)}
  ${concept("Concept render · car museum")}`;

// 13 · PA announcer
S.pa = () => `${bg("n-pa")}
  ${pin(AA["n-pa"], "speaker", `${pill("PA SPEAKERS", "#1C2230", "#E8EAF0")}`, { up: 50 })}
  <div class="hudbox" style="left:50%;bottom:110px;transform:translateX(-50%);width:760px;padding:12px 18px;display:flex;gap:14px;align-items:center"><span style="font-size:26px">📢</span><div><div class="lbl2 acc">Circuit announcer</div><div style="font:600 17px/1.4 B">"…and it's RACELIMIT, number 27, now up to third place! Can they catch Brandt in the VELOCE?"</div></div></div>
  ${note("Track PA announcer", "The circuit's speakers talk about your race", ["As you pass the grandstands you hear the announcer calling the order, overtakes and fastest laps, echoing round the circuit.", "It fades in and out with the speakers, like being at the track.", "Pick the language and how chatty it is."])}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:6px">Announcer</div>${tg(["On", "Big moments only", "Off"], 0)}<div style="margin-top:10px">${sl("Volume", 55, "55%")}</div>`)}
  ${hb([gear(7, 286), t2("P3 · +1", "passed SLV"), t2("Main grandstand", "speakers 2 of 14")])}
  ${concept("Concept render · track PA announcer")}`;

// 14 · sound that reacts to the place
S.sound = () => `${bg("n-sound", "brightness(.9)")}
  ${note("Sound that reacts to the place", "Hear the walls, the tunnel and the bridges", ["In Monaco's tunnel the engine booms and echoes, then it's suddenly quiet as you burst back into daylight.", "Close walls throw the sound back at you; open run-off makes it fade away.", "Under bridges and past grandstands you hear the reflection change."])}
  ${box("right:18px;top:18px", 360, `<div class="lbl2" style="margin-bottom:8px">Echo right now</div>
    <svg width="330" height="90" viewBox="0 0 330 90">${Array.from({ length: 66 }, (_, i) => { const h = 10 + Math.abs(Math.sin(i * 0.7) * 30 + Math.sin(i * 2.3) * 12) * (i > 20 && i < 50 ? 1.6 : 0.8); return `<rect x="${i * 5}" y="${45 - h / 2}" width="3" height="${h}" rx="1.5" fill="${i > 20 && i < 50 ? "#FFB547" : "#3A4150"}"/>`; }).join("")}</svg>
    <div style="display:grid;gap:6px;margin-top:6px">${kv("Place", "Tunnel")}${kv("Echo", `<span class="acc">long · 0.8 s</span>`)}${kv("Walls", "both sides, 3 m")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Sound detail</div>${tg(["Full", "Simple", "Off"], 0)}`)}
  ${hb([gear(7, 268), t2("Monaco tunnel", "exit in 3 s"), t2("Engine", "echoing")])}
  ${concept("Concept render · sound that reacts to the place")}`;

// 15 · auto graphics
S.graphics = () => top("Settings · <b>Graphics</b>", `<span class="chip" style="color:#6EE7A8">● 58 FPS</span>`, "s-ticker") + `
  <div class="grid" style="grid-template-columns:1fr 1.2fr;height:727px">
    <div class="panel"><h2>Your computer</h2><div style="display:grid;gap:6px">${kv("Graphics", "Intel Arc (built into the CPU)")}${kv("Screen", "built-in laptop screen")}${kv("Memory", "16 GB")}</div>
      <div class="card2" style="margin-top:12px;box-shadow:inset 0 0 0 1px #2FD27A"><div class="lbl2 good">Picked for you</div><b style="font:700 24px BC">Balanced · 60 FPS target</b><div class="muted" style="font:600 12px B;margin-top:4px">Tested on the first lap: high detail would drop to about 38 FPS in Monaco.</div></div>
      <div class="lbl2" style="margin:14px 0 6px">FPS counter</div>${tg(["Off", "Corner", "Detailed"], 1)}
      <div class="lbl2" style="margin:12px 0 6px">Keep it smooth</div>${tg(["Lower detail if FPS drops", "Never change"], 0)}</div>
    <div class="panel"><h2>Presets</h2>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${[["Low", "90+", 0], ["Balanced", "60", 1], ["High", "40", 0], ["Ultra", "25", 0]].map(([a, b, on]) => `<div class="card2" style="text-align:center;${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><b>${a}</b><div class="mono ${on ? "acc" : "muted"}" style="font-size:20px">${b}</div><div class="lbl2">FPS here</div></div>`).join("")}</div>
      <div style="display:grid;gap:10px;margin-top:14px">${sl("Resolution scale", 70, "80%")}${sl("Shadows", 50, "medium")}${sl("Trees and crowd", 60, "medium")}${sl("Reflections", 30, "low")}${sl("Draw distance", 70, "1.5 km")}</div>
      <div class="lbl2" style="margin:14px 0 6px">Biggest win on your computer</div><div class="muted">Resolution scale: 80% looks almost the same on a 14-inch screen and gives about +15 FPS.</div></div>
  </div>${concept("Concept render · auto graphics for your laptop")}`;

// 16 · live TV: what spectators see
const towerTV = [["1", "OKA", "AXIOM", "Leader"], ["2", "BRD", "VELOCE", "+0.8"], ["3", "KIRI", "RACELIMIT", "+1.6"], ["4", "SLV", "NOVA", "+2.9"], ["5", "ISH", "KESTREL", "+4.4"], ["6", "VRG", "HALCYON", "+7.0"]];
S.tvwatch = () => `<div style="position:absolute;inset:0;background:#07080B"></div>
  <div class="top" style="background:#0B0D12"><div class="brand">RACELIMIT<small>TV</small></div><div class="crumbs"><b>Kiri's race</b> · Silverstone · lap 12 of 20</div><div class="sp"></div><span class="pill" style="background:#E8002D;color:#fff;font-size:13px">● LIVE</span><span class="chip">👁 14 watching</span><span class="btn">Share</span></div>
  <div style="position:absolute;left:20px;top:84px;width:1180px;height:664px;border-radius:10px;overflow:hidden;background:url(bg/tv-1.png) center/cover">
    <div style="position:absolute;left:14px;top:14px;width:210px;background:rgba(11,13,18,.88);border-radius:8px;overflow:hidden"><div style="background:#FFB547;color:#17120A;padding:5px 10px;font:700 15px BC">LAP 12 / 20</div>${towerTV.map(([p, c, t, g]) => `<div class="row" style="padding:4px 10px;gap:8px;${c === "KIRI" ? "background:#2A2310;" : ""}border-top:1px solid #FFFFFF10"><b class="mono" style="width:16px">${p}</b><i style="width:4px;height:16px;background:${TEAMS[t]}"></i><b style="font:700 16px BC;width:44px">${c}</b><span class="mono" style="margin-left:auto;font-size:12px;color:#C3C9D4">${g}</span></div>`).join("")}</div>
    <div style="position:absolute;right:14px;top:14px;display:flex;gap:8px"><span class="pill" style="background:#E8002D;color:#fff">● LIVE</span><span class="pill" style="background:rgba(11,13,18,.85);color:#C3C9D4">TV CAMERA · COPSE</span></div>
    <div style="position:absolute;left:50%;bottom:16px;transform:translateX(-50%);display:flex;background:rgba(11,13,18,.9);border-radius:8px;overflow:hidden"><div style="padding:8px 16px;background:#5B1C22"><div class="lbl2" style="color:#FFB0B0">Battle for P2</div><b style="font:700 22px BC">BRD vs KIRI</b></div><div style="padding:8px 16px"><div class="lbl2">Gap</div><b class="mono" style="font-size:20px">0.8</b></div><div style="padding:8px 16px"><div class="lbl2">Closing</div><b class="mono good" style="font-size:20px">−0.2 /lap</b></div></div>
    ${pin(AA["tv-1"], "you", `${pill("KIRI", "#2A2310", "#FFB547")}`, { up: 50, scale: 1180 / 1600 })}</div>
  <div class="hudbox" style="left:20px;top:760px;width:1180px;display:flex;gap:8px;align-items:center;padding:10px 12px"><span class="lbl2" style="margin-right:6px">Camera</span>${tg(["Director (auto)", "TV cameras", "Onboard: Kiri", "Onboard: any car", "Helicopter", "Map only"], 0)}<span class="muted" style="margin-left:auto;font:600 12px B">about 3 s behind the race</span></div>
  <div class="panel" style="position:absolute;left:1216px;top:84px;width:364px;height:792px;display:grid;grid-template-rows:auto 1fr auto;gap:10px"><h2 style="margin:0">Chat</h2>
    <div style="display:grid;gap:9px;align-content:end;font:500 14px B">${[["Sam", "send it at Stowe 👀", "#7FC4FF"], ["Leo", "that tow down Hangar is huge", "#6EE7A8"], ["Mum", "go Kiri!!", "#FFB547"], ["Sam", "BRD defending hard", "#7FC4FF"], ["Ana", "0.8… doable", "#FF8AA8"], ["Leo", "replay that last lap 🔁", "#6EE7A8"]].map(([n, t, c]) => `<div><b style="color:${c}">${n}</b> <span>${t}</span></div>`).join("")}</div>
    <div class="card2 muted">Say something…</div></div>
  ${concept("Concept render · live TV: what spectators see")}`;

// 17 · live TV: going live and directing
S.tvhost = () => top("Live TV · <b>You're on air</b>", `<span class="pill" style="background:#E8002D;color:#fff;font-size:13px">● LIVE · 14:32</span>`, "tv-2") + `
  <div class="grid" style="grid-template-columns:1.4fr 1fr;height:727px">
    <div class="panel" style="padding:0;overflow:hidden;display:grid;grid-template-rows:440px auto">
      <div style="background:url(bg/tv-2.png) center/cover;position:relative"><div class="hudbox" style="left:12px;top:12px"><div class="lbl2" style="color:#FF8A8A">Viewers see now</div><b style="font:700 22px BC">Helicopter · Silverstone</b></div></div>
      <div style="padding:12px 16px"><div class="lbl2" style="margin-bottom:6px">Director</div>${tg(["Auto: follows battles and overtakes", "Manual"], 0)}
        <div class="lbl2" style="margin:12px 0 6px">Cameras</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">${[["TV", 0], ["Onboard", 0], ["Helicopter", 1], ["Pit lane", 0], ["Map", 0]].map(([a, on]) => `<div class="card2" style="text-align:center;padding:8px;${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><b style="font:600 13px B">${a}</b></div>`).join("")}</div></div></div>
    <div class="panel"><h2>Share</h2>
      <div class="card2 mono" style="font-size:22px;letter-spacing:.06em;color:#FFB547;text-align:center">TV-KIRI-8QF2</div>
      <div class="row" style="margin-top:8px"><span class="btn primary">Copy watch link</span><span class="btn">Show QR code</span></div>
      <div class="muted" style="font:500 13px B;margin-top:8px">Friends open the link in any browser, no game needed. It plays like a TV broadcast, with the timing tower and battle graphics.</div>
      <div class="lbl2" style="margin:14px 0 6px">Instant replay</div><div class="row"><span class="btn">🔁 Replay last 10 s</span><span class="btn">⭐ Mark a moment</span></div>
      <div class="muted" style="font:500 12px B;margin-top:6px">Replays show to viewers with a REPLAY label, then cut back to live.</div>
      <div class="lbl2" style="margin:14px 0 6px">Delay</div>${tg(["None", "3 s", "30 s (no spoilers for you)"], 1)}
      <div class="lbl2" style="margin:14px 0 6px">Watching (14)</div><div class="row" style="flex-wrap:wrap;gap:6px">${["Sam", "Leo", "Ana", "Mum", "Jae", "+9"].map((n) => `<span class="chip">${n}</span>`).join("")}</div>
      <div class="lbl2" style="margin:14px 0 6px">Who can watch</div>${tg(["Anyone with the link", "Friends only"], 0)}</div>
  </div>${concept("Concept render · live TV: going live")}`;

mount(S);
export default S;

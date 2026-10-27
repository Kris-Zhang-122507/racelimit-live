import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, tag, drv, chart, trackSvg, mount, TEAMS, clone, CAR } from "./common.js";

const S = {};

// 1 · crowd reactions
S.crowd = () => `${bg("spa-chase")}
  <svg style="position:absolute;inset:0" width="1600" height="900">${Array.from({ length: 70 }, (_, i) => { const x = 440 + (i * 97) % 680, y = 352 + ((i * 53) % 34); return `<rect x="${x}" y="${y}" width="5" height="${8 + (i % 4) * 2}" fill="${["#FFB547", "#E8EAF0", "#5AA9FF", "#E8002D"][i % 4]}" opacity=".9" transform="rotate(${(i % 7) * 9 - 27} ${x} ${y})"/>`; }).join("")}</svg>
  ${tag(780, 330, `${pill("GRANDSTAND · CHEERING", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">you just took P3</span>`)}
  ${note("Crowd reactions", "The fans react to what you do", ["Pass someone in front of a grandstand and it erupts: flags wave, the noise jumps.", "Crash and you hear the groan. Your team's fans cheer louder for you.", "The sound changes as you drive past each stand, so you hear the crowd come and go."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">Crowd noise</div>
    <div style="display:flex;gap:3px;align-items:end;height:80px">${[0.2, 0.25, 0.3, 0.28, 0.35, 0.6, 0.95, 1, 0.9, 0.7, 0.55, 0.4, 0.35, 0.3].map((v, i) => `<i style="flex:1;height:${v * 80}px;border-radius:2px;background:${i > 5 && i < 10 ? "#FFB547" : "#3A4150"}"></i>`).join("")}</div>
    <div class="muted" style="font:600 11px B;margin-top:4px">overtake at 0:06 →</div>
    <div class="lbl2" style="margin:12px 0 6px">Reacts to</div>${tg(["Overtakes", "Crashes", "Pole / win", "Home driver"], [0, 1, 2, 3])}
    <div style="margin-top:10px">${sl("Crowd volume", 65, "65%")}</div>`)}
  ${hb([gear(5, 196), t2("P3 · +1", "passed SLV at Bus Stop"), t2("Main grandstand", "38,000 fans")])}
  ${concept("Concept render · crowd reactions")}`;

// 2 · podium ceremony (illustration)
const person = (x, y, suit, helmetless = true, arm = 0) => `<g transform="translate(${x} ${y})"><rect x="-22" y="-120" width="44" height="80" rx="14" fill="${suit}"/><rect x="-20" y="-40" width="16" height="60" rx="6" fill="${suit}"/><rect x="4" y="-40" width="16" height="60" rx="6" fill="${suit}"/><circle cx="0" cy="-140" r="20" fill="#E0B08A"/><rect x="${arm ? 18 : -36}" y="-118" width="16" height="${arm ? 70 : 60}" rx="6" fill="${suit}" transform="rotate(${arm ? -150 : 12} ${arm ? 26 : -28} -112)"/></g>`;
S.podium = () => `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#2A3346,#0B0D12 70%)"></div>
  <svg style="position:absolute;inset:0" width="1600" height="900">
    ${Array.from({ length: 140 }, (_, i) => `<rect x="${(i * 131) % 1600}" y="${(i * 71) % 520}" width="8" height="4" fill="${["#FFB547", "#E8EAF0", "#5AA9FF", "#2FD27A"][i % 4]}" transform="rotate(${i * 23} ${(i * 131) % 1600} ${(i * 71) % 520})" opacity=".8"/>`).join("")}
    <rect x="300" y="160" width="1000" height="70" rx="6" fill="#16181F"/><text x="800" y="206" text-anchor="middle" fill="#FFB547" font-family="BC" font-weight="700" font-size="40" letter-spacing="4">SPA-FRANCORCHAMPS · RACE WINNER</text>
    <rect x="520" y="620" width="200" height="140" fill="#2A2F3B"/><rect x="700" y="560" width="200" height="200" fill="#343A48"/><rect x="880" y="660" width="200" height="100" fill="#2A2F3B"/>
    <text x="800" y="680" text-anchor="middle" fill="#FFB547" font-family="BC" font-weight="700" font-size="64">1</text><text x="620" y="720" text-anchor="middle" fill="#C3C9D4" font-family="BC" font-weight="700" font-size="52">2</text><text x="980" y="735" text-anchor="middle" fill="#C98A4A" font-family="BC" font-weight="700" font-size="48">3</text>
    ${person(620, 600, TEAMS.AXIOM)}${person(800, 540, TEAMS.RACELIMIT, true, 1)}${person(980, 640, TEAMS.VELOCE)}
    <path d="M832,380 l10,-28 l22,0 l-8,26 Z" fill="#C9A23A"/><rect x="838" y="380" width="22" height="16" fill="#C9A23A"/>
    ${Array.from({ length: 40 }, (_, i) => `<circle cx="${640 + i * 4 + Math.sin(i) * 8}" cy="${420 - Math.sin(i / 12) * 90}" r="${3 + (i % 3)}" fill="#F2E6B0" opacity="${0.7 - i / 80}"/>`).join("")}
    <rect x="0" y="760" width="1600" height="140" fill="#0E1117"/>${Array.from({ length: 60 }, (_, i) => `<circle cx="${i * 27 + 10}" cy="${800 + (i % 3) * 18}" r="12" fill="#1C2230"/>`).join("")}</svg>
  ${note("Podium ceremony", "Stand on the top step", ["Win and you walk out to the podium. A made-up anthem plays, the trophy is handed over, then the champagne.", "Press a button to spray, or aim at the other drivers. Cameras sweep round like the TV.", "Skip it any time."], "left:18px;top:250px", 380)}
  ${box("right:18px;top:250px", 300, `<div class="lbl2" style="margin-bottom:6px">Camera</div>${tg(["TV sweep", "Your view", "Free"], 0)}<div class="lbl2" style="margin:12px 0 6px">Controls</div><div style="display:grid;gap:6px;font:600 13px B"><div><span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">Space</span> spray</div><div><span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">← →</span> aim</div><div><span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">P</span> photo</div></div>`)}
  ${concept("Concept render · podium ceremony (illustration)")}`;

// 3 · grid walk
S.gridwalk = () => `${bg("silver-grid")}${[[975, 505, .72, "hue-rotate(200deg) saturate(1.4)"], [835, 468, .58, "hue-rotate(320deg) saturate(1.6)"], [935, 446, .47, "grayscale(1) brightness(1.4)"], [828, 430, .39, "hue-rotate(140deg)"], [905, 418, .32, "hue-rotate(260deg) saturate(1.5)"]].reverse().map(([x, y, s, f]) => clone("silver-grid", CAR["silver-grid"], x, y, s, f)).join("")}
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),transparent 30%,transparent 70%,rgba(0,0,0,.5))"></div>
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);text-align:center;padding:12px 26px"><div class="lbl2" style="color:#FFB547">Silverstone · race start</div><b style="font:700 34px BC;letter-spacing:.04em">GRID WALK · 8:20 TO THE START</b></div>
  ${tag(800, 520, `${pill("P3 · YOU", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">blankets on · engineer at the car</span>`)}
  ${note("Grid walk before the start", "The build-up, like on TV", ["Before the formation lap the camera walks down the grid: mechanics with tyre blankets, umbrellas, team bosses, the national anthem.", "Each car shows its starting tyre and grid slot as you pass.", "Skip straight to the formation lap whenever you like."], "left:18px;top:130px")}
  ${box("right:18px;top:130px", 300, `<div class="lbl2" style="margin-bottom:8px">Starting tyres</div>
    <div style="display:grid;gap:5px;font:600 13px B">${[["1", "OKA", "M"], ["2", "BRD", "S"], ["3", "YOU", "M"], ["4", "SLV", "H"], ["5", "ISH", "M"], ["6", "VRG", "S"]].map(([p, c, t]) => `<div class="row" style="justify-content:space-between"><span><span class="mono">${p}</span> ${drv(c)}</span><span class="pill" style="background:#1C2230;color:${{ S: "#FF5A6A", M: "#F2C230", H: "#E8EAF0" }[t]}">${t}</span></div>`).join("")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Show</div>${tg(["Full grid walk", "Short", "Skip"], 0)}`)}
  <div class="hudbox" style="left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:10px"><span class="btn">⏭ Skip to formation lap</span><span class="btn">Talk to engineer</span></div>
  ${concept("Concept render · grid walk")}`;

// 4 · onboard of other cars
S.onboard = () => `${bg("monaco-cockpit")}
  <div class="hudbox" style="left:18px;top:18px;padding:10px 14px"><div class="lbl2" style="color:#FFB547">Onboard</div><b style="font:700 28px BC">${drv("OKA")} · AXIOM #1</b><div class="muted" style="font:600 12px B">P1 · Lap 41 · 1.2 s ahead of you</div></div>
  <div class="hudbox" style="left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:6px;padding:8px">${[["OKA", "AXIOM", "P1", 1], ["BRD", "VELOCE", "P2"], ["YOU", "RACELIMIT", "P3"], ["SLV", "NOVA", "P4"], ["ISH", "KESTREL", "P5"], ["VRG", "HALCYON", "P6"], ["DEL", "VORTEX", "P7"]].map(([c, t, p, on]) => `<div style="padding:6px 10px;border-radius:8px;background:${on ? "#2A2310" : "#1A1E27"};${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""};text-align:center"><i style="display:block;height:4px;border-radius:2px;background:${TEAMS[t]};margin-bottom:4px"></i><b style="font:700 16px BC">${c}</b><div class="muted mono" style="font-size:11px">${p}</div></div>`).join("")}<div style="padding:6px 10px;display:grid;place-items:center" class="muted">← → to switch</div></div>
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:6px">Their data</div><div style="display:grid;gap:6px">${kv("Speed", "212 km/h")}${kv("Gear", "5")}${kv("Throttle", `<span class="good">100%</span>`)}${kv("Tyres", "Medium · 14 laps")}${kv("Battery", "48%")}</div>
    <div class="lbl2" style="margin:12px 0 6px">When</div>${tg(["Replays", "Spectating", "During your race"], [0, 1])}`)}
  ${note("Onboard with any car", "Ride along with the other drivers", ["Switch to any AI car's cockpit, like the TV onboard feed. See how the leader takes the corners.", "In your own race it's only for replays and when you're out, so it can't help you mid-race."], "left:18px;top:130px", 380)}
  ${concept("Concept render · onboard of other cars")}`;

// 5 · steering wheel dash pages
const wheel = (page) => `<svg width="620" height="430" viewBox="0 0 620 430"><path d="M60,120 C60,60 120,40 200,40 L420,40 C500,40 560,60 560,120 L560,250 C560,330 520,380 470,390 L430,330 L190,330 L150,390 C100,380 60,330 60,250 Z" fill="#1A1C22" stroke="#2E333E" stroke-width="3"/>
  <rect x="20" y="110" width="70" height="230" rx="30" fill="#24272F"/><rect x="530" y="110" width="70" height="230" rx="30" fill="#24272F"/>
  ${Array.from({ length: 15 }, (_, i) => `<circle cx="${200 + i * 15}" cy="62" r="5" fill="${i < 5 ? "#2FD27A" : i < 10 ? "#E8002D" : "#5AA9FF"}"/>`).join("")}
  <rect x="190" y="80" width="240" height="170" rx="8" fill="#05070A" stroke="#3A4150"/>${page}
  ${[[110, 140, "#E8002D", "N"], [110, 200, "#2FD27A", "OT"], [110, 260, "#5AA9FF", "BB"], [510, 140, "#FFB547", "RAD"], [510, 200, "#C3C9D4", "PIT"], [510, 260, "#9B6BFF", "MODE"]].map(([x, y, c, t]) => `<circle cx="${x}" cy="${y}" r="20" fill="${c}"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="#0B0D12" font-family="B" font-weight="700" font-size="11">${t}</text>`).join("")}
  <circle cx="250" cy="295" r="18" fill="#2A2F3B" stroke="#FFB547" stroke-width="3"/><circle cx="370" cy="295" r="18" fill="#2A2F3B" stroke="#7FC4FF" stroke-width="3"/><text x="250" y="300" text-anchor="middle" fill="#E8EAF0" font-family="B" font-weight="600" font-size="11">PAGE</text><text x="370" y="300" text-anchor="middle" fill="#E8EAF0" font-family="B" font-weight="600" font-size="11">ERS</text></svg>`;
const T = (x, y, s, t, c = "#E8EAF0", w = 600, a = "start") => `<text x="${x}" y="${y}" fill="${c}" font-family="JB" font-weight="${w}" font-size="${s}" text-anchor="${a}">${t}</text>`;
const pageTyres = `${T(200, 100, 11, "TYRES · page 2/5", "#9AA3B2")}${[[205, 115, "98°", "#6EE7A8"], [315, 115, "104°", "#FFB060"], [205, 180, "92°", "#6EE7A8"], [315, 180, "95°", "#6EE7A8"]].map(([x, y, t, c]) => `<rect x="${x}" y="${y}" width="100" height="56" rx="6" fill="#10141B" stroke="${c}"/>${T(x + 50, y + 36, 22, t, c, 600, "middle")}`).join("")}`;
S.dash = () => top("Cockpit · <b>Steering wheel screen</b>", `<span class="chip">Flip pages with the PAGE button</span>`, "monaco-cockpit") + `
  <div class="grid" style="grid-template-columns:1.25fr 1fr;height:727px">
    <div class="panel" style="display:grid;place-items:center;background:radial-gradient(ellipse at 50% 40%,#1E2330,#13161D 70%)">${wheel(pageTyres)}<div class="muted" style="font:600 13px B">The wheel turns with your steering, and the screen is readable from the cockpit camera.</div></div>
    <div class="panel"><h2>Pages</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[["1 · Race", "gear, speed, delta, position, lap", 0], ["2 · Tyres", "temperatures and pressures", 1], ["3 · ERS", "battery %, deploy mode, harvest", 0], ["4 · Fuel", "target, used, laps left", 0], ["5 · Car", "brake temps, oil, damage", 0], ["Your page", "pick up to 6 items", 0]].map(([a, b, on]) => `<div class="card2" style="${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><b>${a}</b><div class="muted" style="font:600 12px B">${b}</div></div>`).join("")}</div>
      <div class="lbl2" style="margin:16px 0 6px">Shift lights</div>${tg(["Green · red · blue (2026)", "All one colour", "Off"], 0)}
      <div class="lbl2" style="margin:12px 0 6px">Also show on the HUD</div>${tg(["Off", "Small copy, bottom right"], 1)}
      <div class="lbl2" style="margin:12px 0 6px">Wheel turns</div>${tg(["Real (360°)", "Less (180°)", "Hidden wheel"], 0)}
      <div class="card2" style="margin-top:14px"><b class="acc">Shift lights are steady:</b> <span class="muted">they fill up, but nothing flashes.</span></div></div>
  </div>${concept("Concept render · steering wheel dash pages")}`;

// 6 · visible suspension
S.suspension = () => `${bg("spa-tcam")}
  ${note("Visible suspension", "Watch the car work over the kerbs", ["The wishbones, pushrods and uprights are modelled and move with the wheels.", "From the T-cam you see the front wheels rise over a kerb and the car roll in corners.", "Stiffer springs in the setup mean less movement, and a bumpier ride over kerbs."])}
  ${box("right:18px;top:18px", 400, `<div class="lbl2" style="margin-bottom:8px">Front left corner · live</div>
    <svg width="370" height="210" viewBox="0 0 370 210"><rect x="0" y="0" width="370" height="210" rx="10" fill="#0E1117"/>
      <rect x="40" y="70" width="60" height="70" rx="8" fill="#2A2F3B"/><rect x="270" y="40" width="40" height="140" rx="10" fill="#1A1C22" stroke="#4A5060" stroke-width="3"/>
      <line x1="100" y1="80" x2="270" y2="70" stroke="#C3C9D4" stroke-width="5"/><line x1="100" y1="130" x2="270" y2="150" stroke="#C3C9D4" stroke-width="5"/><line x1="265" y1="150" x2="130" y2="60" stroke="#FFB547" stroke-width="4"/>
      <line x1="100" y1="80" x2="270" y2="60" stroke="#C3C9D4" stroke-width="2" opacity=".25" stroke-dasharray="4 4"/><text x="150" y="50" fill="#FFB547" font-family="B" font-weight="600" font-size="12">pushrod</text><text x="150" y="175" fill="#C3C9D4" font-family="B" font-weight="600" font-size="12">wishbones</text><text x="250" y="200" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11">wheel +18 mm (kerb)</text></svg>
    <div class="lbl2" style="margin:10px 0 4px">Wheel travel this lap</div>
    ${chart(370, 70, [{ pts: [0.5, 0.52, 0.48, 0.9, 0.45, 0.5, 0.55, 0.3, 0.52, 0.85, 0.5, 0.5], c: "#7FC4FF", wd: 2 }])}
    <div style="margin-top:10px">${sl("Front springs", 55, "medium")}</div>`)}
  ${hb([gear(4, 151), t2(`Front left <span class="mono">+18 mm</span>`, "kerb at Turn 9"), t2(`Roll <span class="mono">1.4°</span>`, "right-hander")])}
  ${concept("Concept render · visible suspension")}`;

// 7 · heat haze
S.haze = () => `${bg("monza-chase")}
  <svg width="0" height="0" style="position:absolute"><filter id="haze"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.12" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="26"/></filter></svg>
  <div style="position:absolute;left:660px;top:400px;width:280px;height:130px;background:url(bg/monza-chase.png) -660px -400px/1600px 900px;filter:url(#haze);-webkit-mask-image:radial-gradient(ellipse 48% 45% at 50% 40%,#000 40%,transparent 80%)"></div>
  ${clone("monza-chase", CAR["monza-chase"], 800, 418, 0.6, "hue-rotate(150deg) saturate(1.3)")}
  ${tag(800, 375, `${pill("HEAT HAZE", "#2A1A10", "#FFB060")} <span class="muted" style="font:600 12px B">hot air behind ${"SLV"}</span>`)}
  ${note("Heat haze", "The air shimmers behind the cars", ["Hot air from the exhaust and the radiators bends the light: the track behind each car wobbles slightly.", "It's strongest when you're following closely on a hot day, and on the grid before the start.", "On low graphics it's switched off."])}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">Settings</div>${sl("Strength", 55, "55%")}<div class="lbl2" style="margin:12px 0 6px">Shown on</div>${tg(["All cars", "Only close cars", "Off"], 1)}<div class="lbl2" style="margin:12px 0 6px">Also</div>${tg(["Hot track shimmer", "Grid start haze"], [1])}`)}
  ${hb([gear(8, 329), t2(`Air <span class="mono">33°</span>`, `track <span class="mono">51°</span>`), t2(`Following ${drv("SLV")}`, "0.5 s")])}
  ${concept("Concept render · heat haze")}`;

// 8 · dirty car
S.dirty = () => top("Garage · <b>How the car looks after the race</b>", "", "spa-chase") + `
  <div class="grid" style="grid-template-columns:1fr 1fr;height:727px">
    ${[["Lap 1", ""], ["Lap 52 · after the race", "dirty"]].map(([t, d]) => `<div class="panel" style="padding:0;overflow:hidden;position:relative;height:540px"><div style="position:absolute;inset:0;background:url(bg/spa-chase.png) 50% 60%/260% auto"></div>${d ? `<svg style="position:absolute;inset:0" width="100%" height="100%"><filter id="dirt"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .18  0 0 0 0 .14  0 0 0 0 .1  0 0 0 1.6 -.75"/></filter><ellipse cx="50%" cy="58%" rx="22%" ry="20%" filter="url(#dirt)" opacity=".85"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${33 + (i * 37) % 34}%" cy="${47 + (i * 17) % 22}%" r="${2 + (i % 3)}" fill="#1B1611" opacity=".7"/>`).join("")}</svg>` : ""}<div class="hudbox" style="left:14px;top:14px"><b>${t}</b></div></div>`).join("")}
    <div class="panel" style="grid-column:span 2;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">${[["Rubber", "black specks on the sidepods and rear wing from the cars in front"], ["Brake dust", "dark grey around the wheels and on the floor edges"], ["Dirt and grass", "after a trip off track, stuck in the floor and on the nose"], ["Oil and fluid", "a light film on the engine cover if you've had a failure"]].map(([a, b]) => `<div><h2>${a}</h2><div class="muted">${b}</div></div>`).join("")}</div>
  </div>${concept("Concept render · dirty car")}`;

// 9 · rivals
S.rivals = () => top("Career · <b>Rivals</b>", `<span class="chip">Season 2 · Round 9</span>`, "inter-chase") + `
  <div class="grid" style="grid-template-columns:1fr 1.3fr;height:727px">
    <div class="panel" style="display:grid;gap:12px;align-content:start"><div class="lbl2 bad">Your rival</div>
      <div class="row" style="gap:16px"><div style="width:110px;height:110px;border-radius:50%;background:${TEAMS.VELOCE};display:grid;place-items:center;font:700 40px BC">16</div><div><b style="font:700 40px/1 BC">BRD</b><div class="muted">T. Brandt · VELOCE</div><div class="row" style="margin-top:6px"><span class="pill" style="background:#3A1218;color:#FF8A8A">GRUDGE</span><span class="pill" style="background:#1C2230;color:#C3C9D4">AGGRESSIVE</span></div></div></div>
      <div class="card2"><div class="lbl2">Why</div><div style="font:600 14px B;margin-top:4px">You took him out at Monza (round 7). He hasn't forgotten.</div></div>
      <div class="lbl2">What it means</div><div style="display:grid;gap:6px;font:500 14px B;color:#C3C9D4"><div>• He defends harder against you than anyone else.</div><div>• He won't give you room on the outside.</div><div>• Beat him three races in a row and it turns into respect.</div></div></div>
    <div class="panel"><h2>Head to head this season</h2>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${[["Races ahead", "5 – 3"], ["Quali ahead", "4 – 4"], ["Points", "71 – 66"], ["Contact", "2"]].map(([a, b]) => `<div class="card2"><div class="lbl2">${a}</div><b class="big mono">${b}</b></div>`).join("")}</div>
      <div class="lbl2" style="margin:16px 0 6px">History</div>
      <table>${[["R9 Spa", "P3 vs P5", "You passed him at Les Combes", "good"], ["R8 Zandvoort", "P6 vs P4", "He blocked you into Turn 1 for 4 laps", "bad"], ["R7 Monza", "P2 vs DNF", "Contact at the first chicane: he went out", "bad"], ["R6 Austria", "P4 vs P7", "Clean", ""]].map(([a, b, c, k]) => `<tr><td>${a}</td><td class="mono">${b}</td><td class="${k}">${c}</td></tr>`).join("")}</table>
      <div class="lbl2" style="margin:16px 0 6px">Relationship</div><div style="height:12px;border-radius:6px;background:linear-gradient(90deg,#FF6B6B,#3A4150 50%,#6EE7A8);position:relative"><i style="position:absolute;left:22%;top:-5px;bottom:-5px;width:4px;background:#E8EAF0;border-radius:2px"></i></div><div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2;margin-top:4px"><span>grudge</span><span>neutral</span><span>respect</span></div></div>
  </div>${concept("Concept render · rivals mode")}`;

// 10 · survive the wet scenarios
S.wet = () => `${bg("zand-chase", "brightness(.5) saturate(.6) blur(3px)")}<div class="rain"></div>` + top("Challenges · <b>Survive the wet</b>", `<span class="chip">⭐ 7 of 24</span>`, null) + `
  <div class="grid" style="grid-template-columns:repeat(3,1fr);height:727px;position:relative;align-content:start">
    ${[["Slicks in the drizzle", "Zandvoort · 5 laps on soft slicks in light rain. Don't crash.", "⭐⭐⭐", "Done · 3 stars"], ["Last lap on inters", "Spa · the track dries. Hold P1 on worn inters for one lap.", "⭐⭐", "Done · 2 stars"], ["Monaco downpour", "Monaco · full wets, no ABS, finish in the top 5.", "", "Not tried"], ["Aquaplane alley", "Silverstone · standing water at Stowe. Brake early, survive 3 laps.", "⭐", "Done · 1 star"], ["Gamble", "Interlagos · rain in 4 laps. Pick the lap to pit for inters.", "", "Not tried"], ["Night rain", "Singapore · wet, at night, behind the safety car restart.", "", "Locked"]].map(([n, d, st, s], i) => `<div class="panel" style="background:rgba(19,22,29,.92);${i === 2 ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b style="font:700 24px BC">${n}</b><span style="font-size:16px">${st}</span></div><div class="muted" style="font:500 14px B;margin:6px 0 10px">${d}</div><span class="pill" style="background:#1C2230;color:${s.startsWith("Done") ? "#6EE7A8" : s === "Locked" ? "#6B7383" : "#FFB547"}">${s.toUpperCase()}</span></div>`).join("")}
    <div class="panel" style="grid-column:span 3;background:rgba(19,22,29,.92);display:grid;grid-template-columns:1.3fr 1fr;gap:24px"><div><h2>Monaco downpour</h2><div class="muted">Full wet tyres, no ABS, no traction control. The barriers are close and the track is shiny. Finish in the top 5 from P9.</div><div class="row" style="margin-top:10px"><span class="chip">⭐ finish</span><span class="chip">⭐⭐ top 5</span><span class="chip">⭐⭐⭐ podium, no contact</span></div></div><div style="display:grid;gap:8px;align-content:center"><span class="btn primary" style="justify-content:center;height:48px">Start</span><span class="btn" style="justify-content:center">Watch the best attempt</span></div></div>
  </div>${concept("Concept render · survive the wet challenges")}`;

// 11 · pit stop crew view
S.crewcam = () => `${bg("silver-grid", "brightness(.95)")}
  <svg style="position:absolute;inset:0" width="1600" height="900">${[[690, 600, 1], [905, 600, 1], [715, 520, .8], [885, 520, .8], [800, 470, .7]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-16" y="-58" width="32" height="44" rx="10" fill="#FFA51F"/><rect x="-16" y="-16" width="13" height="30" rx="5" fill="#16171B"/><rect x="3" y="-16" width="13" height="30" rx="5" fill="#16171B"/><circle cx="0" cy="-70" r="14" fill="#16171B"/><rect x="-10" y="-74" width="20" height="7" rx="3" fill="#7FC4FF" opacity=".7"/></g>`).join("")}
    <line x1="1000" y1="430" x2="960" y2="520" stroke="#8C939E" stroke-width="5"/><circle cx="1000" cy="425" r="26" fill="#2FD27A" stroke="#E8EAF0" stroke-width="4"/></svg>
  <div style="position:absolute;inset:0;box-shadow:inset 0 0 160px rgba(0,0,0,.6)"></div>
  <div class="hudbox" style="left:18px;top:18px"><div class="lbl2" style="color:#FFB547">Pit stop camera</div><b style="font:700 26px BC">Crew view · front jack</b></div>
  ${note("Pit stop crew view", "See your stop from the crew's side", ["A camera from the pit crew: the jack, the wheel guns, the lollipop light going green.", "It's only a camera. You don't play the stop (the pit mini-game stays an optional setting).", "Switch between the crew angles, or watch the replay after."], "left:18px;top:110px", 400)}
  ${box("right:18px;top:18px", 320, `<div class="lbl2" style="margin-bottom:8px">This stop · 2.4 s</div>
    <div style="display:grid;gap:6px">${[["Front left", "2.1 s", "#6EE7A8"], ["Front right", "2.2 s", "#6EE7A8"], ["Rear left", "2.4 s", "#FFB060"], ["Rear right", "2.0 s", "#6EE7A8"]].map(([a, b, c]) => kv(a, `<span style="color:${c}" class="mono">${b}</span>`)).join("")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Camera</div>${tg(["Front jack", "Wheel gun", "Lollipop", "From above", "TV"], 0)}
    <div class="lbl2" style="margin:12px 0 6px">Show the stop camera</div>${tg(["Every stop", "Fast stops only", "Never"], 1)}`)}
  <div class="hudbox" style="left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:14px;align-items:center"><div style="width:40px;height:40px;border-radius:50%;background:#2FD27A"></div>${t2("GO", "release light is green · steady")}<b class="mono" style="font-size:30px">2.4</b></div>
  ${concept("Concept render · pit stop crew view")}`;

// 12 · endurance mode
S.endurance = () => top("Race settings · <b>Race distance</b>", `<span class="btn primary">Start race</span>`, "silver-grid") + `
  <div class="grid" style="grid-template-columns:repeat(4,1fr);height:727px">
    ${[["5 laps", "Sprint", "about 8 minutes"], ["25%", "Short", "about 25 minutes"], ["50%", "Half", "about 50 minutes · 1 stop"], ["100%", "Full race", "about 1 h 30 · 1–2 stops", true]].map(([a, b, c, on]) => `<div class="panel" style="${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><b class="mono" style="font-size:40px;color:${on ? "#FFB547" : "#E8EAF0"}">${a}</b><div style="font:700 22px BC">${b}</div><div class="muted">${c}</div></div>`).join("")}
    <div class="panel" style="grid-column:span 4"><h2>A full race, in parts</h2>
      <svg width="100%" height="140" viewBox="0 0 1500 140"><rect x="0" y="50" width="1500" height="34" rx="8" fill="#232836"/><rect x="0" y="50" width="560" height="34" rx="8" fill="#FFB547"/>${[[0, "Start"], [375, "Save point"], [560, "You stopped here · lap 20"], [750, "Save point"], [1125, "Save point"], [1500, "Finish · lap 52"]].map(([x, t], i) => `<line x1="${x}" x2="${x}" y1="40" y2="94" stroke="#E8EAF0" stroke-width="2"/><text x="${x}" y="${i % 2 ? 120 : 28}" text-anchor="${x === 0 ? "start" : x === 1500 ? "end" : "middle"}" fill="#C3C9D4" font-family="B" font-weight="600" font-size="14">${t}</text>`).join("")}</svg>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:10px">
        <div class="card2"><div class="lbl2">Saves</div><b>Every 25% of the race, and whenever you pause</b><div class="muted" style="font:600 12px B;margin-top:4px">Come back later and carry on from the same lap, tyres and gaps.</div></div>
        <div class="card2"><div class="lbl2">Long-race stuff</div><b>Tyre wear, fuel, fatigue and parts wear all count</b><div class="muted" style="font:600 12px B;margin-top:4px">2 pit stops likely. Weather may change.</div></div>
        <div class="card2"><div class="lbl2">Saved race</div><b>Silverstone · lap 20 of 52 · P4</b><div class="row" style="margin-top:6px"><span class="btn primary">Carry on</span><span class="btn">Delete</span></div></div></div></div>
  </div>${concept("Concept render · endurance mode")}`;

// 13 · famous laps
S.famous = () => top("Challenges · <b>Famous laps</b>", `<span class="chip">Recreated laps, made-up names</span>`, "suzuka-far") + `
  <div class="grid" style="grid-template-columns:1.2fr 1fr;height:727px">
    <div class="panel"><h2>Race the ghost of a legendary lap</h2>
      <table><tr><th>Lap</th><th>Circuit</th><th>Car</th><th class="r">Time</th><th>You</th></tr>
      ${[["\"The wet Monaco pole\"", "Monaco", "1996", "1:22.40", "—"], ["\"Ten-tenths at Suzuka\"", "Suzuka", "2005", "1:31.54", "+0.81", 1], ["\"The 360 km/h tow\"", "Monza", "2004", "1:20.10", "+1.22"], ["\"Last-lap Interlagos\"", "Interlagos", "2008", "1:12.60", "🥇"], ["\"Night pole\"", "Singapore", "2023", "1:30.98", "—"], ["\"Eau Rouge flat\"", "Spa", "2026", "1:40.56", "+0.66"]].map(([a, b, c, d, e, on]) => `<tr${on ? ` style="background:#1E1A12"` : ""}><td><b>${a}</b></td><td>${b}</td><td class="mono">${c}</td><td class="r mono">${d}</td><td class="mono">${e}</td></tr>`).join("")}</table></div>
    <div class="panel" style="display:grid;gap:12px;align-content:start"><div class="lbl2 acc">Selected</div><b style="font:700 34px/1.05 BC">"Ten-tenths at Suzuka"</b>
      <div style="height:220px;border-radius:10px;background:url(bg/suzuka-far.png) center/cover"></div>
      <div class="muted" style="font:500 14px B">A 2005 V10 car on a qualifying lap, pushed to the limit through the Esses and 130R. The ghost follows the same speeds and lines, rebuilt from timing data.</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${[["Ghost", "1:31.54"], ["Your best", "1:32.35"], ["Gap", "+0.81"]].map(([a, b], i) => `<div class="card2"><div class="lbl2">${a}</div><b class="mono ${i === 2 ? "bad" : ""}">${b}</b></div>`).join("")}</div>
      <div class="row"><span class="btn primary">Race the ghost</span><span class="btn">Watch it</span></div></div>
  </div>${concept("Concept render · famous laps to race")}`;

// 14 · assist ladder
S.ladder = () => top("Settings · <b>Assist ladder</b>", `<span class="chip">On · steps up when you're ready</span>`, "zand-chase") + `
  <div class="grid" style="grid-template-columns:1.3fr 1fr;height:727px">
    <div class="panel"><h2>Your ladder</h2>
      <div style="display:grid;gap:10px">${[["1", "All assists on", "racing line, auto brake help, ABS, TC, auto gears", "done"], ["2", "Braking line only", "the full racing line goes, braking zones stay", "done"], ["3", "ABS off", "lock-ups and flat spots become possible", "now"], ["4", "Traction control: medium", "power down more carefully out of slow corners", ""], ["5", "Manual gears", "", ""], ["6", "No assists", "the real thing", ""]].map(([n, a, b, s]) => `<div class="card2 row" style="gap:14px;${s === "now" ? "box-shadow:inset 0 0 0 2px #FFB547" : ""};opacity:${s === "" ? .6 : 1}"><b class="mono" style="font-size:26px;width:30px;color:${s === "done" ? "#6EE7A8" : s === "now" ? "#FFB547" : "#6B7383"}">${n}</b><div style="flex:1"><b style="font:600 16px B">${a}</b><div class="muted" style="font:600 12px B">${b}</div></div><span class="pill" style="background:#1C2230;color:${s === "done" ? "#6EE7A8" : s === "now" ? "#FFB547" : "#6B7383"}">${s === "done" ? "DONE" : s === "now" ? "TRY NOW" : "LATER"}</span></div>`).join("")}</div></div>
    <div class="panel" style="display:grid;gap:12px;align-content:start"><div class="card2" style="box-shadow:inset 0 0 0 1px #FFB547"><div class="lbl2 acc">Ready for step 3</div><div style="font:700 26px BC;margin:4px 0">You're ready to try ABS off</div><div class="muted">Your last 20 laps: no lock-ups, smooth braking, 0.3 s off your best. With ABS off you can brake a little later.</div><div class="row" style="margin-top:10px"><span class="btn primary">Try it</span><span class="btn">Not yet</span></div></div>
      <h2 style="margin-top:6px">How it decides</h2><div style="display:grid;gap:6px">${kv("Clean laps in a row", `<span class="good">20 / 20</span>`)}${kv("Lock-ups (would have been)", `<span class="good">1</span>`)}${kv("Spins", `<span class="good">0</span>`)}</div>
      <div class="lbl2">If it gets too hard</div>${tg(["Offer to step back", "Never step back"], 0)}</div>
  </div>${concept("Concept render · assist ladder")}`;

// 15 · colourblind and accessibility
S.access = () => top("Settings · <b>Accessibility</b>", "", "spa-chase") + `
  <div class="grid" style="grid-template-columns:1fr 1fr;height:727px">
    <div class="panel"><h2>Colours</h2><div class="lbl2" style="margin-bottom:6px">Colour mode</div>${tg(["Normal", "Red-green (deuteranopia)", "Red-green (protanopia)", "Blue-yellow", "High contrast"], 1)}
      <div class="lbl2" style="margin:16px 0 6px">Preview</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">${[["Normal", ["#9B6BFF", "#2FD27A", "#F2C230", "#E8002D"]], ["Red-green", ["#9B6BFF", "#3AA0FF", "#F2C230", "#FF7A1A"]]].map(([n, cs]) => `<div class="card2"><b>${n}</b><div class="lbl2" style="margin:8px 0 4px">Minisectors</div><div class="row" style="gap:4px">${cs.map((c, i) => `<i style="flex:1;height:10px;border-radius:3px;background:${c}"></i>`).join("")}</div><div class="lbl2" style="margin:8px 0 4px">Flags</div><div class="row" style="gap:6px">${cs.slice(1).map((c) => `<i style="width:34px;height:22px;border-radius:3px;background:${c}"></i>`).join("")}</div></div>`).join("")}</div>
      <div class="lbl2" style="margin:16px 0 6px">Flags also show</div>${tg(["Colour only", "Colour + symbol", "Colour + word"], 2)}
      <div class="row" style="margin-top:10px;gap:8px">${[["#F2C230", "! YELLOW", "#0B0D12"], ["#1F6FD6", "» BLUE", "#FFFFFF"], ["#C8102E", "■ RED", "#FFFFFF"]].map(([c, t, fg]) => `<span style="padding:6px 12px;border-radius:6px;background:${c};color:${fg};font:700 13px B">${t}</span>`).join("")}</div></div>
    <div class="panel"><h2>Text and HUD</h2><div style="display:grid;gap:12px">${sl("Text size", 60, "120%")}${sl("HUD size", 50, "large")}${sl("HUD contrast", 80, "high")}</div>
      <div class="lbl2" style="margin:16px 0 6px">Motion</div>${tg(["Camera shake", "Head movement", "Screen darkening at high g"], [])}
      <div class="lbl2" style="margin:12px 0 6px">Sound cues</div>${tg(["Beep for flags", "Beep for braking points", "Read radio out loud"], [0, 2])}
      <div class="lbl2" style="margin:12px 0 6px">Controls</div>${tg(["Hold to accelerate", "Toggle accelerate", "One-hand layout"], 0)}
      <div class="card2" style="margin-top:14px"><b class="acc">Never flashes:</b> <span class="muted">flags, lights and warnings stay steady colours in every mode.</span></div></div>
  </div>${concept("Concept render · colourblind and accessibility modes")}`;

// 16 · wheel and pedal calibration
S.calib = () => top("Settings · <b>Wheel and pedals</b>", `<span class="chip">Detected: wheel + 3 pedals</span>`, "spa-cockpit") + `
  <div class="grid" style="grid-template-columns:1fr 1.2fr;height:727px">
    <div class="panel" style="display:grid;gap:14px;align-content:start"><h2>Steering</h2>
      <div style="display:grid;place-items:center"><svg width="280" height="280" viewBox="0 0 280 280"><circle cx="140" cy="140" r="120" fill="none" stroke="#2A2F3B" stroke-width="22"/><path d="M140,20 A120,120 0 0 1 248,88" fill="none" stroke="#FFB547" stroke-width="22"/><g transform="rotate(64 140 140)"><rect x="40" y="128" width="200" height="24" rx="10" fill="#3A4150"/><rect x="132" y="20" width="16" height="30" rx="4" fill="#FFB547"/></g><text x="140" y="150" text-anchor="middle" fill="#E8EAF0" font-family="JB" font-weight="600" font-size="30">+64°</text></svg></div>
      ${sl("Rotation", 50, "360°")}${sl("Dead zone", 8, "2%")}${sl("Linearity", 50, "1.0")}${sl("Force feedback", 70, "70%")}${sl("Kerb rumble", 45, "45%")}
      <span class="btn" style="justify-self:start">Turn the wheel fully left, then right</span></div>
    <div class="panel"><h2>Pedals</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${[["Throttle", 82, "#2FD27A", [0, .3, .55, .75, .9, 1]], ["Brake", 46, "#FF6B6B", [0, .1, .25, .45, .7, 1]], ["Clutch", 0, "#7FC4FF", [0, .2, .4, .6, .8, 1]]].map(([n, v, c, curve]) => `<div class="card2"><div class="row" style="justify-content:space-between"><b>${n}</b><b class="mono" style="color:${c}">${v}%</b></div>
        <div style="height:150px;display:flex;gap:10px;align-items:end;margin-top:8px"><div style="width:22px;height:100%;border-radius:6px;background:#232836;position:relative"><i style="position:absolute;left:0;right:0;bottom:0;height:${v}%;background:${c};border-radius:6px"></i></div>${chart(150, 150, [{ pts: curve, c }])}</div>
        <div class="lbl2" style="margin-top:8px">Curve</div>${tg(["Linear", "Soft", "Hard"], n === "Brake" ? 2 : 0)}</div>`).join("")}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px"><div style="display:grid;gap:10px">${sl("Brake force for 100%", 75, "75% press")}${sl("Throttle dead zone", 6, "3%")}</div>
        <div class="card2"><div class="lbl2">Buttons</div><div style="display:grid;gap:5px;margin-top:6px;font:600 13px B">${kv("Overtake", "button 4")}${kv("Pit limiter", "button 7")}${kv("Wheel screen page", "button 9")}${kv("Radio answer 1 / 2 / 3", "D-pad")}</div></div></div>
      <div class="muted" style="margin-top:12px;font:500 13px B">Profiles are saved per wheel, so a controller and a wheel can each keep their own settings.</div></div>
  </div>${concept("Concept render · wheel and pedal calibration")}`;

mount(S);
export default S;

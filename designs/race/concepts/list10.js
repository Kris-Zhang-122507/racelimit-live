import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, drv, chart, mount, TEAMS, A, pin } from "./common.js";
const AA = {};
await Promise.all(["l10-medical", "l10-tunnel", "l10-sand", "l10-fog", "l10-launch", "l10-fanzone", "l10-garage", "l10-hill", "l10-demo"].map(async (n) => (AA[n] = await A(n))));

const S = {};

// 1 · medical car on lap one
S.medicalcar = () => `${bg("l10-medical")}
  ${pin(AA["l10-medical"], "med", `${pill("MEDICAL CAR", "#14361F", "#6EE7A8")} <span class="muted" style="font:600 12px B">lights on, steady</span>`, { up: 90, dx: 120 })}
  ${pin(AA["l10-medical"], "pack", `<b style="font:600 13px B">the whole field, lap 1</b>`, { up: 70, dx: -80 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);display:flex;gap:12px;align-items:center;padding:10px 18px"><span class="pill" style="background:#1C2230;color:#E8EAF0">LAP 1 / 52</span><b style="font:600 14px B">Medical car follows the field</b></div>
  ${note("Medical car on lap one", "Right behind the pack", ["Like the real one, the medical car follows the cars round the opening lap, when crashes are most likely.", "It pulls into the pits at the end of the lap. You see it in replays and on the TV cameras."], "left:18px;top:18px", 400)}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:8px">Who's in it</div><div style="display:grid;gap:6px">${kv("Driver", "made-up")}${kv("Doctor", "on board")}${kv("After lap 1", "back to the pits")}</div>`)}
  ${concept("Concept render · medical car on lap one")}`;

// 2 · radio dropouts
const wave = `<svg width="330" height="46" viewBox="0 0 330 46">${Array.from({ length: 66 }, (_, k) => { const gap = (k > 18 && k < 27) || (k > 44 && k < 52); const h = gap ? 2 : 6 + Math.abs(Math.sin(k * 1.3) * 18) + (k % 5) * 2; return `<rect x="${k * 5}" y="${23 - h / 2}" width="3" height="${h}" rx="1.5" fill="${gap ? "#3A4150" : "#7FC4FF"}"/>`; }).join("")}</svg>`;
S.radiodrop = () => `${bg("l10-tunnel")}
  ${pin(AA["l10-tunnel"], "car", `${pill("IN THE TUNNEL", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">radio breaking up</span>`, { up: 80, dx: 140 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);padding:12px 18px;width:400px"><div class="row" style="justify-content:space-between"><span class="pill" style="background:#10213A;color:#7FC4FF">RADIO</span><span class="muted" style="font:600 12px B">signal weak</span></div>${wave}<b style="font:600 16px B;display:block">"Box th— … —ap. Bo—"</b><div class="muted" style="font:600 12px B">your engineer will repeat it out of the tunnel</div></div>
  ${note("Radio dropouts", "Tunnels and bridges cut the signal", ["Team radio crackles and drops out in tunnels and under big bridges, like Monaco's tunnel.", "The message comes again once you're back in the open, unless it's too late."], "left:18px;top:18px", 400)}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:6px">Dropouts</div>${tg(["Real", "Light", "Off"], 0)}<div class="muted" style="font:500 12px B;margin-top:8px">Off: messages wait until you leave the tunnel.</div>`)}
  ${hb([gear(7, 268), t2("Tunnel", "Monaco · 0.4 km"), t2("Radio", `<span class="bad">broken up</span>`)])}
  ${concept("Concept render · radio dropouts")}`;

// 3 · sand on the track
S.sand = () => `${bg("l10-sand")}
  ${pin(AA["l10-sand"], "sand", `${pill("SAND ON THE LINE", "#2A2310", "#E8C88A")} <span class="muted" style="font:600 12px B">less grip until it's swept clean</span>`, { up: 110, dx: 140 })}
  ${note("Sand on the track", "The desert blows onto the circuit", ["At desert circuits the wind blows sand across the track. Grip drops where it lands, mostly on the racing line.", "Every car that passes sweeps a little away, so the line cleans up through the session. Stronger wind, more sand."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Track</div><div style="display:grid;gap:6px">${kv("Wind", "34 km/h from the west")}${kv("Sand", `<span class="acc">sectors 1 and 3</span>`)}${kv("Grip on the line", "−12%")}${kv("Clears in", "about 15 laps")}</div>`)}
  ${hb([gear(6, 244), t2("Grip", `<span class="acc">sandy · T1–T4</span>`), t2("Wind", "34 km/h · gusting")])}
  ${concept("Concept render · sand on the track")}`;

// 4 · morning fog
S.fog = () => `${bg("l10-fog")}
  ${pin(AA["l10-fog"], "post", `<b style="font:600 13px B">Marshal post 9</b> <span class="muted" style="font:600 12px B">can't see post 10</span>`, { up: 70, dx: 120 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);display:flex;gap:14px;align-items:center;padding:12px 20px"><div style="width:52px;height:36px;border-radius:4px;background:#E8002D"></div><div><b style="font:700 26px/1 BC;letter-spacing:.04em">SESSION DELAYED · FOG</b><div class="muted" style="font:600 13px B">next update 09:40</div></div></div>
  ${note("Morning fog", "Wait for it to lift", ["Early sessions can start in thick fog. The session waits until each marshal post can see the next one.", "The medical helicopter also has to be able to fly. When the fog lifts, the track is cold and damp."], "left:18px;top:130px", 400)}
  ${box("right:18px;top:130px", 280, `<div class="lbl2" style="margin-bottom:8px">Conditions</div><div style="display:grid;gap:6px">${kv("Visibility", `<span class="bad">80 m</span>`)}${kv("Needed", "300 m")}${kv("Helicopter", `<span class="bad">can't fly</span>`)}${kv("Forecast", "clearing by 10:00")}</div>`)}
  ${concept("Concept render · morning fog")}`;

// 5 · session debrief
const tr1 = [0.95, 0.96, 0.96, 0.97, 0.97, 0.96, 0.7, 0.42, 0.3, 0.28, 0.33, 0.45, 0.6, 0.72, 0.8, 0.86];
const tr2 = [0.95, 0.96, 0.96, 0.97, 0.97, 0.97, 0.88, 0.5, 0.33, 0.3, 0.36, 0.48, 0.62, 0.74, 0.82, 0.88];
S.debrief = () => top("FP2 · <b>Debrief with Rosa</b>", `<span class="btn primary">Back on track</span>`, "l7-stack") + `
  <div class="grid" style="grid-template-columns:1.5fr 1fr;height:727px">
    <div class="panel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Turn 4 · speed</h2><span class="chip">your best lap vs your fastest bits</span></div>
      ${chart(780, 220, [{ pts: tr1, c: "#FFB547" }, { pts: tr2, c: "#7FC4FF", dash: "6 5" }], { extra: `<line x1="290" x2="290" y1="0" y2="220" stroke="#FF8A8A" stroke-dasharray="4 4"/><line x1="335" x2="335" y1="0" y2="220" stroke="#6EE7A8" stroke-dasharray="4 4"/><text x="296" y="16" fill="#FF8A8A" font-family="B" font-weight="600" font-size="12">you brake</text><text x="341" y="34" fill="#6EE7A8" font-family="B" font-weight="600" font-size="12">could brake here</text>` })}
      <div class="row" style="gap:16px;margin-top:8px;font:600 12px B"><span style="color:#FFB547">— your lap</span><span style="color:#7FC4FF">- - best of your own laps</span></div>
      <div class="card2" style="margin-top:12px"><b style="font:600 15px B">"You're braking about 10 m early into Turn 4 and coasting in. Brake later and harder, and you'll keep 0.15 s."</b><div class="muted" style="font:600 12px B;margin-top:4px">Rosa · from your own laps, not someone else's</div></div></div>
    <div class="panel"><h2>Three things</h2>${[["Turn 4 braking", "−0.15 s", 1], ["Exit of Turn 9", "−0.08 s", 0], ["Tyres too hot in sector 3", "manage on long runs", 0]].map(([a, b, on]) => `<div class="card2 row" style="justify-content:space-between;margin-top:8px;${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><b style="font:600 14px B">${a}</b><span class="mono ${on ? "acc" : "muted"}">${b}</span></div>`).join("")}
      <div class="lbl2" style="margin:14px 0 6px">Work on next session</div>${tg(["Turn 4 braking", "Turn 9 exit", "Tyre temps"], 0)}
      <div class="muted" style="font:500 12px B;margin-top:8px">In FP3 the HUD shows a marker where to brake into Turn 4.</div></div>
  </div>${concept("Concept render · session debrief")}`;

// 6 · car launch
S.launch = () => `${bg("l10-launch")}
  ${pin(AA["l10-launch"], "car", `${pill("RL27", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">your livery, first time on show</span>`, { up: 40, dx: 330 })}
  <div class="hudbox" style="left:1250px;top:240px;padding:6px 10px;white-space:nowrap"><b style="font:600 13px B">Big screen · countdown, then the reveal</b></div>
  ${note("Car launch", "Show off the new car", ["Before the season, reveal your car at a launch event: lights down, a countdown, smoke, then the lights come up on your new livery.", "Your livery from the editor, your team name, your season's number."], "left:18px;top:18px", 400)}
  ${box("right:18px;top:18px", 270, `<div class="lbl2" style="margin-bottom:8px">Launch</div><div style="display:grid;gap:6px">${kv("Venue", "Studio")}${kv("Guests", "team, sponsors, press")}${kv("Photo", "saved to your album")}</div><div class="lbl2" style="margin:10px 0 6px">Show</div>${tg(["Full", "Short", "Skip"], 0)}`)}
  ${concept("Concept render · car launch")}`;

// 7 · your race number
const taken = { 1: "OKA (champion)", 16: "BRD", 63: "SLV", 14: "ISH", 31: "VRG", 81: "DEL", 22: "KAI", 44: "MOR", 10: "PEL", 5: "TAN", 55: "FOX" };
S.number = () => top("Career · <b>Your race number</b>", `<span class="btn primary">Keep 27</span>`, "l6-era09") + `
  <div class="grid" style="grid-template-columns:1.25fr 1fr;height:727px">
    <div class="panel"><h2>Pick a number</h2><div style="display:grid;grid-template-columns:repeat(14,1fr);gap:5px">${Array.from({ length: 98 }, (_, k) => { const n = k + 2, t = taken[n], on = n === 27; return `<div style="height:34px;border-radius:6px;display:grid;place-items:center;font:600 13px JB;background:${on ? "#2A2310" : t ? "#11141A" : "#1A1E27"};color:${on ? "#FFB547" : t ? "#3A4150" : "#C3C9D4"};${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}">${n}</div>`; }).join("")}</div>
      <div class="muted" style="font:500 13px B;margin-top:10px">Grey numbers belong to other drivers. Number 1 is only for the reigning champion, if they want it.</div></div>
    <div class="panel" style="display:grid;gap:12px;align-content:start"><h2>27 on everything</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="card2" style="display:grid;place-items:center;height:170px"><svg width="200" height="140" viewBox="0 0 200 140"><path d="M10 80 L120 60 L185 70 L190 86 L120 92 L10 96 Z" fill="#FFA51F"/><path d="M60 64 L120 60 L118 70 L64 74 Z" fill="#16171B"/><text x="128" y="84" font-family="BC" font-weight="700" font-size="22" fill="#16171B">27</text><circle cx="40" cy="100" r="22" fill="#16171B"/><circle cx="160" cy="100" r="20" fill="#16171B"/></svg></div>
        <div class="card2" style="display:grid;place-items:center;height:170px"><svg width="150" height="140" viewBox="0 0 150 140"><path d="M20 90 Q20 20 80 20 Q135 22 135 80 L135 110 L30 110 Z" fill="#FFA51F"/><path d="M60 58 L132 58 L132 82 L66 82 Z" fill="#16171B"/><text x="38" y="102" font-family="BC" font-weight="700" font-size="26" fill="#16171B">27</text></svg></div></div>
      <div style="display:grid;gap:6px">${kv("On the car", "nose, engine cover")}${kv("Helmet", "back and side")}${kv("Cards and timing", "#27 KIRI")}</div>
      <div class="muted" style="font:500 12px B">You keep it for your whole career. Change it once, between seasons.</div></div>
  </div>${concept("Concept render · your race number")}`;

// 8 · fan zone signings
S.fanzone = () => `${bg("l10-fanzone")}
  ${pin(AA["l10-fanzone"], "driver", `${pill("YOU · SIGNING", "#2A2310", "#FFB547")}`, { up: 70, dx: 60 })}
  ${pin(AA["l10-fanzone"], "queue", `<b style="font:600 13px B">Queue: 214 fans</b> <span class="muted" style="font:600 12px B">longer after good results</span>`, { up: 80, dx: -60 })}
  ${note("Fan zone signings", "Thursday autograph session", ["Before the weekend, sign caps, cards and photos in the fan zone. Quick and optional: a short scene, not a mini-game you have to play.", "The queue grows with your results and your home race. More fans means more banners and more noise on Sunday."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:8px">This week</div><div style="display:grid;gap:6px">${kv("Signing", "Thu 15:00")}${kv("Queue", `<span class="acc">214</span>`)}${kv("New fans", "+1,200")}</div>`)}
  ${concept("Concept render · fan zone signings")}`;

// 9 · calendar travel map
const cal = [["Melbourne", -37.8, 145], ["Shanghai", 31.3, 121.2], ["Suzuka", 34.8, 136.5], ["Bahrain", 26, 50.5], ["Jeddah", 21.6, 39.1], ["Miami", 26, -80.2], ["Montreal", 45.5, -73.5], ["Monaco", 43.7, 7.4], ["Barcelona", 41.6, 2.3], ["Spielberg", 47.2, 14.8], ["Silverstone", 52.1, -1], ["Spa", 50.4, 6], ["Budapest", 47.6, 19.3], ["Zandvoort", 52.4, 4.5], ["Monza", 45.6, 9.3], ["Madrid", 40.5, -3.6], ["Baku", 40.4, 49.9], ["Singapore", 1.3, 103.9], ["Austin", 30.1, -97.6], ["Mexico City", 19.4, -99.1], ["São Paulo", -23.7, -46.7], ["Las Vegas", 36.1, -115.2], ["Lusail", 25.5, 51.5], ["Abu Dhabi", 24.5, 54.6]];
const MX = (lon) => ((lon + 130) / 300) * 900, MY = (lat) => ((65 - lat) / 115) * 520;
S.travel = () => top("Career · <b>Calendar and travel</b>", `<span class="chip">Season 2 · 24 rounds</span>`, "l7-yas") + `
  <div class="grid" style="grid-template-columns:900px 1fr;height:727px;zoom:1.05">
    <div class="panel" style="padding:12px"><svg width="900" height="560" viewBox="0 -20 900 560" style="display:block;background:#0E1117;border-radius:10px">
      ${[-30, 0, 30, 60].map((la) => `<line x1="0" x2="900" y1="${MY(la)}" y2="${MY(la)}" stroke="#1C2029"/>`).join("")}${[-120, -60, 0, 60, 120].map((lo) => `<line y1="-20" y2="540" x1="${MX(lo)}" x2="${MX(lo)}" stroke="#1C2029"/>`).join("")}
      ${cal.slice(0, -1).map(([, la, lo], k) => { const [, la2, lo2] = cal[k + 1], x1 = MX(lo), y1 = MY(la), x2 = MX(lo2), y2 = MY(la2), d = Math.hypot(x2 - x1, y2 - y1), on = k === 16; return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - d * 0.25} ${x2} ${y2}" fill="none" stroke="${on ? "#FFB547" : "#3A4150"}" stroke-width="${on ? 3 : 1.5}" ${on ? "" : `stroke-dasharray="4 4"`}/>`; }).join("")}
      ${cal.map(([n, la, lo], k) => `<circle cx="${MX(lo)}" cy="${MY(la)}" r="${k === 16 || k === 17 ? 7 : 5}" fill="${k < 16 ? "#6B7383" : k === 16 || k === 17 ? "#FFB547" : "#C3C9D4"}"/>${[0, 5, 10, 16, 17, 20, 23].includes(k) ? `<text x="${MX(lo) + 9}" y="${MY(la) + 4}" fill="#C3C9D4" font-family="B" font-weight="600" font-size="13">${n}</text>` : ""}`).join("")}
    </svg><div class="muted" style="font:500 12px B;margin-top:6px">Grey: done · amber: next trip · white: still to come</div></div>
    <div style="display:grid;gap:16px;align-content:start"><div class="panel"><h2>Next trip</h2><div style="display:grid;gap:6px">${kv("From", "Baku")}${kv("To", `<span class="acc">Singapore</span>`)}${kv("Distance", "6,500 km")}${kv("Freight", "sea freight left 5 weeks ago")}${kv("Time zone", "+4 h")}</div></div>
      <div class="panel"><h2>Crew</h2>${sl("Energy", 64, "64%")}<div class="muted" style="font:500 13px B;margin-top:8px">Back-to-back and triple-header weekends tire the crew: slower stops and more mistakes. Rest days help.</div><div class="lbl2" style="margin:10px 0 6px">Travel effects</div>${tg(["On", "Off"], 0)}</div></div>
  </div>${concept("Concept render · calendar travel map")}`;

// 10 · waiting in the garage
S.garagewait = () => `${bg("l10-garage")}
  ${pin(AA["l10-garage"], "screen", `${pill("TIMING", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">you're P4 · BRD just went quicker</span>`, { up: 110, dx: -150 })}
  ${pin(AA["l10-garage"], "tv", `${pill("TV FEED", "#3A1218", "#FF8A8A")}`, { up: 70, dx: 150 })}
  ${note("Waiting in the garage", "Sit tight while they fix it", ["When the car needs work in practice, you stay in the cockpit. The screens hanging in front show timing and the TV feed.", "Watch your rivals' laps, check the weather, and go straight back out when the crew is done."], "left:18px;top:18px", 400)}
  ${box("right:18px;top:18px", 290, `<div class="lbl2" style="margin-bottom:8px">Repair</div><div style="display:grid;gap:6px">${kv("Job", "new floor")}${kv("Time left", `<span class="acc">6 min</span>`)}${kv("Session left", "22 min")}</div>${sl("Progress", 62, "62%")}<div class="lbl2" style="margin:10px 0 6px">While you wait</div>${tg(["Watch", "Skip ahead"], 0)}`)}
  ${concept("Concept render · waiting in the garage")}`;

// 11 · hillclimb festival
S.hillclimb = () => `${bg("l10-hill")}
  ${pin(AA["l10-hill"], "car", `${pill("1998 VELOCE", "#3A1218", "#FF8A8A")} <span class="muted" style="font:600 12px B">run 2 of 3</span>`, { up: 90, dx: 120 })}
  ${pin(AA["l10-hill"], "bales", `<b style="font:600 13px B">hay bales and fans right by the road</b>`, { up: 60, dx: 120 })}
  ${note("Hillclimb festival", "One car, one hill, against the clock", ["A made-up summer festival: classic and modern cars go one at a time up a narrow hill road lined with hay bales.", "Short runs, big crowds, and a paddock full of old cars to try."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Fastest up the hill</div><table>${[["1", "OKA · 2026", "44.81"], ["2", "YOU · 1998", "46.02"], ["3", "BRD · 2009", "46.40"], ["4", "SLV · 1998", "47.13"]].map(([p, a, t]) => `<tr${a.startsWith("YOU") ? ` style="color:#FFB547"` : ""}><td class="mono">${p}</td><td>${a}</td><td class="r mono">${t}</td></tr>`).join("")}</table>`)}
  ${hb([gear(4, 176), t2("Split 2", `<span class="good">−0.21</span>`), t2("Run", "2 of 3")])}
  ${concept("Concept render · hillclimb festival")}`;

// 12 · city demo runs
S.demorun = () => `${bg("l10-demo")}
  ${pin(AA["l10-demo"], "car", `${pill("DEMO RUN", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">burnout for the crowd</span>`, { up: 130, dx: 110 })}
  ${pin(AA["l10-demo"], "crowd", `<b style="font:600 13px B">fans behind the barriers</b>`, { up: 50, dx: -80 })}
  ${note("City demo runs", "Take the car to town", ["A fan event on closed city streets: drive up and down, do burnouts and doughnuts, then sign autographs.", "No timing, no rivals. Unlocks new cities as your team grows."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 270, `<div class="lbl2" style="margin-bottom:8px">Show</div><div style="display:grid;gap:6px;font:600 13px B">${[["Launch down the street", 1], ["Burnout", 1], ["Doughnuts", 0], ["Wave to the crowd", 0]].map(([a, on]) => `<div class="row"><span class="dot" style="background:${on ? "#2FD27A" : "#3A4150"}"></span>${a}</div>`).join("")}</div>${sl("Crowd", 78, "78%")}`)}
  ${concept("Concept render · city demo runs")}`;

// 13 · challenge twists
S.twists = () => top("Challenges · <b>Twists</b>", `<span class="btn primary">Start</span>`, "monza-chase") + `
  <div class="grid" style="grid-template-columns:repeat(3,1fr);height:727px">
    ${[["One gear only", "Stuck in 4th for a whole lap of Monza.", "4", 1], ["Wets on a dry track", "Full wet tyres, sunny day. They overheat fast.", "W", 0], ["No HUD", "No speed, no map, no delta. Just the car and the track.", "—", 0], ["Half power", "Corner speed is everything.", "½", 0], ["No brakes into Turn 1", "Lift early, scrub speed, hope.", "!", 0], ["Mirrors only", "Drive the lap looking backwards in the mirrors.", "◐", 0]].map(([a, b, ic, on]) => `<div class="panel" style="${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><div style="width:56px;height:56px;border-radius:12px;background:${on ? "#2A2310" : "#1C2230"};display:grid;place-items:center;font:700 28px BC;color:${on ? "#FFB547" : "#C3C9D4"}">${ic}</div><h2 style="margin:12px 0 4px">${a}</h2><div class="muted" style="font:500 14px B">${b}</div><div class="row" style="gap:6px;margin-top:12px">${["Bronze", "Silver", "Gold"].map((m, i) => `<span class="chip" style="${on && i < 2 ? "color:#FFB547" : ""}">${m}</span>`).join("")}</div></div>`).join("")}
  </div>${concept("Concept render · challenge twists")}`;

// 14 · community contests
const liv = (b, a, s) => `<svg width="190" height="78" viewBox="0 0 190 78"><path d="M6 46 L118 30 L180 38 L184 52 L118 58 L6 60 Z" fill="${b}"/><path d="M50 34 L118 30 L116 40 L54 44 Z" fill="${a}"/><path d="M6 52 L184 46" stroke="${s}" stroke-width="4"/><circle cx="36" cy="62" r="13" fill="#0B0D12"/><circle cx="150" cy="60" r="12" fill="#0B0D12"/></svg>`;
S.contests = () => top("Community · <b>This week's contests</b>", `<span class="chip">Voting ends Sunday</span>`, "s-photo") + `
  <div class="grid" style="grid-template-columns:1.25fr 1fr;height:727px">
    <div class="panel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Livery contest · "Night race"</h2><span class="chip">412 entries</span></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px">
      ${[["#16245C", "#F2C230", "#E8EAF0", "Sam", 841, 1], ["#0B0D12", "#FF5AC8", "#5AF0FF", "Leo", 802, 0], ["#C8102E", "#F2F2F2", "#16171B", "Ana", 640, 0], ["#2A6B3A", "#E8EAF0", "#F2C230", "Kiri", 512, 0], ["#5B2A86", "#FFA51F", "#E8EAF0", "Max", 488, 0], ["#E8EAF0", "#16B8A6", "#0B0D12", "Ivy", 377, 0]].map(([b, a, s, n, v, on]) => `<div class="card2" style="${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}">${liv(b, a, s)}<div class="row" style="justify-content:space-between"><b style="font:600 13px B">${n}</b><span class="mono ${on ? "acc" : "muted"}">${v} ♥</span></div></div>`).join("")}</div>
      <div class="muted" style="font:500 13px B;margin-top:10px">The winning livery races in next week's weekly event, on an AI car with the maker's name on it.</div></div>
    <div class="panel"><h2>Photo contest · "Spray"</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${["s-weather", "l6-donuts", "l7-flypast", "s-haze"].map((p, k) => `<div><div style="height:118px;border-radius:8px;background:url(bg/${p}.png) center/cover"></div><div class="row" style="justify-content:space-between;margin-top:4px;font:600 12px B"><span>${["Ana", "Leo", "Sam", "Ivy"][k]}</span><span class="mono muted">${[233, 198, 176, 120][k]} ♥</span></div></div>`).join("")}</div>
      <div class="lbl2" style="margin:12px 0 6px">Your vote</div>${tg(["One per contest"], 0)}</div>
  </div>${concept("Concept render · community contests")}`;

mount(S);
export default S;

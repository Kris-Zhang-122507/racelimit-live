import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, drv, chart, mount, TEAMS, A, pin } from "./common.js";
const AA = {};
await Promise.all(["l9-reverse", "l9-puncture", "l9-flowvis", "l9-banners", "l9-twoseater", "l9-drag", "l6-train", "l7-swap"].map(async (n) => (AA[n] = await A(n))));

const S = {};
const key = (k) => `<span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">${k}</span>`;
const ring = (x, y, r = 26, c = "#FFB547") => `<svg style="position:absolute;inset:0;pointer-events:none;z-index:4" width="1600" height="900"><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="3"/></svg>`;
const bo = `<i style="display:inline-block;width:34px;height:34px;border-radius:4px;background:#0B0B0D;box-shadow:inset 0 0 0 1px #3A3F4B;position:relative;vertical-align:middle"><i style="position:absolute;left:9px;top:9px;width:16px;height:16px;border-radius:50%;background:#FF7A1A"></i></i>`;

// 1 · sprint weekends
S.sprint = () => top("Race weekend · <b>Lusail · sprint weekend</b>", `<span class="btn primary">Start FP1</span>`, "l7-hot") + `
  <div class="grid" style="grid-template-columns:repeat(3,1fr) 1.05fr;height:727px">
    ${[["Friday", [["FP1", "60 min · the only practice", 1], ["Sprint qualifying", "SQ1 · SQ2 · SQ3, 12 / 10 / 8 min", 0]]], ["Saturday", [["Sprint", "19 laps · about 100 km · no stops needed", 0], ["Qualifying", "sets the grid for Sunday", 0]]], ["Sunday", [["Grand Prix", "57 laps · full points", 0]]]].map(([d, items]) => `<div class="panel"><div class="lbl2">${d}</div><div style="display:grid;gap:10px;margin-top:10px">${items.map(([a, b, on]) => `<div class="card2" style="${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><b style="font:700 22px BC">${a}</b><div class="muted" style="font:600 13px B">${b}</div></div>`).join("")}</div></div>`).join("")}
    <div class="panel"><h2>Points</h2><table><tr><th>Pos</th><th class="r">Sprint</th><th class="r">Race</th></tr>${[[1, 8, 25], [2, 7, 18], [3, 6, 15], [4, 5, 12], [5, 4, 10], [6, 3, 8], [7, 2, 6], [8, 1, 4]].map(([p, s, r]) => `<tr><td class="mono">P${p}</td><td class="r mono acc">${s}</td><td class="r mono">${r}</td></tr>`).join("")}</table>
      <div class="lbl2" style="margin:12px 0 6px">Sprint weekends</div>${tg(["Real calendar (6)", "Every round", "Off"], 0)}
      <div class="muted" style="font:500 12px B;margin-top:8px">Only one practice, so setup choices count early.</div></div>
  </div>${concept("Concept render · sprint weekends")}`;

// 2 · reverse-grid races
S.reversegrid = () => `${bg("l9-reverse")}
  ${pin(AA["l9-reverse"], "you", `${pill("YOU · STARTS P12", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">fastest in qualifying</span>`, { up: 90, dx: -140 })}
  ${pin(AA["l9-reverse"], "pole", `${pill("STARTS P1", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">slowest in qualifying</span>`, { up: 60, dx: 40 })}
  ${note("Reverse-grid races", "The fastest start at the back", ["A fun event: the qualifying order is turned upside down, so the quickest drivers have to fight through the whole field.", "Also as a short second race on the same day, with the top 8 reversed."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 290, `<div class="lbl2" style="margin-bottom:6px">Reverse</div>${tg(["Whole grid", "Top 8", "Top 10"], 0)}<div class="lbl2" style="margin:10px 0 6px">Where</div>${tg(["Fun events", "Leagues", "Custom races"], [0, 2])}`)}
  ${hb([gear("N", 0), t2("Grid P12", "11 cars to pass"), t2("Race", "12 laps · fun event")])}
  ${concept("Concept render · reverse-grid races")}`;

// 3 · punctures and the black-and-orange flag
S.puncture = () => `${bg("l9-puncture")}
  ${pin(AA["l9-puncture"], "flat", `${pill("REAR-LEFT PUNCTURE", "#3A1218", "#FF8A8A")} <span class="muted" style="font:600 12px B">rim sparking on the road</span>`, { up: 150, dx: 120 })}
  ${pin(AA["l9-puncture"], "bits", `<b style="font:600 12px B">rubber left on the track</b>`, { up: 50, dx: -60 })}
  ${note("Punctures", "Limp it back to the pits", ["Drive on three wheels: slow, sparky, and hard on the floor. Too fast and the tyre flails and breaks more of the car.", "If something is hanging off, race control shows you the black-and-orange flag with your number. Pit to get it fixed."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 330, `<div class="row" style="gap:12px">${bo}<div><b style="font:600 14px B">Black-and-orange flag · car 27</b><div class="muted" style="font:600 12px B">loose part · pit this lap</div></div></div><div style="display:grid;gap:6px;margin-top:10px">${kv("Damage", `<span class="bad">floor · rear-left</span>`)}${kv("Safe speed", "120 km/h")}${kv("Pits in", "1.8 km")}</div>`)}
  ${hb([gear(3, 118), t2("3 wheels", "floor wearing"), t2("Box this lap", `<span class="acc">new softs ready</span>`)])}
  ${concept("Concept render · punctures and the black-and-orange flag")}`;

// 4 · switch fixes
S.switchfix = () => `${bg("monaco-cockpit")}
  ${ring(800, 780, 30)}${ring(740, 770, 22, "#7FC4FF")}
  <div class="hudbox" style="left:50%;top:24px;transform:translateX(-50%);display:flex;gap:14px;align-items:center;padding:12px 18px"><span class="pill" style="background:#10213A;color:#7FC4FF">RADIO</span><div><b style="font:600 17px B">"We've lost a sensor. Strat 5, position 8. Then Mode 2."</b><div class="muted" style="font:600 12px B">your engineer · power down 30 kW until it's fixed</div></div></div>
  ${note("Switch fixes", "Fix it from the wheel", ["When something breaks, your engineer reads out the switch changes. You turn the dials on the wheel while you drive.", "Get it right and the power comes back. Get it wrong and the engineer tries another fix."], "left:18px;top:120px", 400)}
  ${box("right:18px;top:120px", 300, `<div class="lbl2" style="margin-bottom:8px">Fix</div><div style="display:grid;gap:8px;font:600 13px B">${[["Strategy dial → 5", 1], ["Position → 8", 1], ["Mode dial → 2", 0], ["Press OK", 0]].map(([a, on]) => `<div class="row"><span class="dot" style="background:${on ? "#2FD27A" : "#3A4150"}"></span>${a}</div>`).join("")}</div><div class="lbl2" style="margin:12px 0 6px">Faults</div>${tg(["Off", "Sometimes", "Realistic"], 1)}`)}
  ${concept("Concept render · switch fixes")}`;

// 5 · title decider
const pts = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0];
const KIRI = 404, BRD = 392;
const cell = (you, him) => { const a = KIRI + pts[you - 1], b = BRD + pts[him - 1]; return a > b ? ["#14361F", "#6EE7A8", "title"] : a === b ? ["#2A2310", "#FFB547", "tie · you (more wins)"] : ["#3A1218", "#FF8A8A", "BRD"]; };
S.titledecider = () => top("Championship · <b>Final round · Abu Dhabi</b>", `<span class="btn primary">To the grid</span>`, "yas-chase") + `
  <div class="grid" style="grid-template-columns:1fr 1.7fr;height:727px">
    <div class="panel"><h2>Standings</h2>${[["KIRI", "RACELIMIT", KIRI, "#FFB547"], ["BRD", "VELOCE", BRD, "#E8EAF0"], ["OKA", "AXIOM", 371, "#9AA3B2"]].map(([n, t, p, c]) => `<div class="card2 row" style="justify-content:space-between;margin-top:8px"><span class="row"><i style="width:5px;height:22px;background:${TEAMS[t]}"></i><b style="font:700 24px BC">${n}</b></span><b class="mono" style="font-size:22px;color:${c}">${p}</b></div>`).join("")}
      <div class="muted" style="font:500 13px B;margin-top:10px">OKA can't catch you any more. It's you or BRD: 12 points between you.</div>
      <div class="card2" style="margin-top:14px;box-shadow:inset 0 0 0 1px #FFB547"><div class="lbl2 acc">In short</div><b style="font:700 22px BC">Finish P3 or better and you're champion, whatever BRD does.</b></div></div>
    <div class="panel"><h2>What you need</h2><div class="muted" style="font:500 13px B;margin-bottom:8px">Your finish across, BRD's finish down. Green = you're champion.</div>
      <table><tr><th>BRD ↓ · you →</th>${[1, 2, 3, 4, 5, 6, 8, 11].map((p) => `<th class="r">${p === 11 ? "out" : "P" + p}</th>`).join("")}</tr>
      ${[1, 2, 3, 4, 6, 11].map((h) => `<tr><td class="mono">${h === 11 ? "out" : "P" + h}</td>${[1, 2, 3, 4, 5, 6, 8, 11].map((y) => { if (y === h) return `<td></td>`; const [b, c] = cell(y, h); return `<td class="r"><span style="display:inline-block;width:46px;height:22px;border-radius:5px;background:${b};box-shadow:inset 0 0 0 1px ${c}55"></span></td>`; }).join("")}</tr>`).join("")}</table>
      <div class="row" style="gap:16px;margin-top:10px;font:600 12px B"><span class="row"><i style="width:14px;height:14px;border-radius:3px;background:#14361F"></i>you</span><span class="row"><i style="width:14px;height:14px;border-radius:3px;background:#2A2310"></i>tie: you win on wins</span><span class="row"><i style="width:14px;height:14px;border-radius:3px;background:#3A1218"></i>BRD</span></div></div>
  </div>${concept("Concept render · title decider")}`;

// 6 · flow-vis paint and rakes
const streaks = (bend) => `<svg width="250" height="120" viewBox="0 0 250 120"><rect width="250" height="120" rx="10" fill="#16171B"/><path d="M20 40 Q120 20 230 30 L230 92 Q120 100 20 82 Z" fill="#FFA51F" opacity=".9"/>${Array.from({ length: 14 }, (_, k) => { const y0 = 42 + k * 3; return `<path d="M${30 + (k % 3) * 6} ${y0} Q120 ${y0 + bend * (k - 6)} 225 ${y0 + bend * 1.6 * (k - 7)}" stroke="#B8FF4A" stroke-width="1.6" fill="none" opacity=".85"/>`; }).join("")}</svg>`;
S.flowvis = () => `${bg("l9-flowvis")}
  ${pin(AA["l9-flowvis"], "rake", `${pill("AERO RAKE", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">dozens of little tubes measure the air</span>`, { up: 150, dx: 60 })}
  ${note("Flow-vis and rakes", "See the air on a new part", ["In practice, new parts get painted with bright flow-vis paint and the car carries a rake of sensors behind the front wheel.", "After the run you look at the paint streaks and the rake's numbers, and decide whether the part stays."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 560, `<div class="lbl2" style="margin-bottom:8px">Paint after the run · sidepod from above</div><div class="row" style="gap:12px;align-items:start"><div>${streaks(0.2)}<div style="font:600 12px B;margin-top:4px">Old floor edge <span class="muted">· air stays attached</span></div></div><div>${streaks(1.6)}<div style="font:600 12px B;margin-top:4px">New floor edge <span class="bad">· air breaks away</span></div></div></div>
    <div class="row" style="margin-top:10px;gap:8px"><span class="chip">Rake: −3% downforce at the front</span><span class="btn" style="height:32px">Keep old part</span><span class="btn" style="height:32px">Try again</span></div>`)}
  ${concept("Concept render · flow-vis paint and aero rakes")}`;

// 7 · FP1 outings
S.fp1 = () => `${bg("l7-swap")}
  ${pin(AA["l7-swap"], "out", `${pill("YOU · SITTING THIS ONE OUT", "#1C2230", "#E8EAF0")}`, { up: 40, dx: -190 })}
  ${pin(AA["l7-swap"], "in", `${pill("TAN · JUNIOR DRIVER", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">his first F1 session</span>`, { up: 100, dx: 150 })}
  ${note("FP1 outings", "Lend your seat to a junior", ["A few times a year your team puts a junior driver in your car for first practice. You watch from the garage and get the data.", "In career mode as a junior, these sessions are your chance: go fast, don't crash, and the team notices."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 310, `<div class="lbl2" style="margin-bottom:8px">This season · junior FP1s</div><div style="display:grid;gap:6px">${[["Monza", "TAN · your car", 1], ["Austin", "TAN · teammate's car", 0], ["Abu Dhabi", "rookie test day", 0]].map(([a, b, on]) => `<div class="row" style="justify-content:space-between;${on ? "color:#FFB547" : ""}"><b style="font:600 13px B">${a}</b><span style="font:600 12px B">${b}</span></div>`).join("")}</div><div class="lbl2" style="margin:10px 0 6px">His setup</div>${tg(["Same as yours", "Engineer's choice"], 0)}`)}
  ${concept("Concept render · FP1 outings for junior drivers")}`;

// 8 · fan banners
S.banners = () => `${bg("l9-banners")}
  ${pin(AA["l9-banners"], "b0", `${pill("FAN BANNER", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">made by fans, not sponsors</span>`, { up: 60, dx: 60 })}
  ${pin(AA["l9-banners"], "b1", `${pill("FAN BANNER", "#2A2310", "#FFB547")}`, { up: 50, dx: -40 })}
  ${note("Fan banners", "The fans start making signs for you", ["As you get famous, homemade banners with your name and number appear on the fences and in the stands.", "More of them at your home race and after big wins. Fans make up their own slogans."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Your fans</div><div style="display:grid;gap:6px">${kv("Fans", "41,200")}${kv("Banners this weekend", `<span class="acc">23</span>`)}${kv("Next", "a whole flag section")}</div>${sl("Fame", 58, "58%")}`)}
  ${concept("Concept render · fan banners")}`;

// 9 · two-seater hot laps
S.twoseater = () => `${bg("l9-twoseater")}
  ${pin(AA["l9-twoseater"], "driver", `${pill("YOU · DRIVING", "#2A2310", "#FFB547")}`, { up: 90, dx: 120 })}
  ${pin(AA["l9-twoseater"], "guest", `${pill("SAM · PASSENGER", "#10213A", "#7FC4FF")} <span class="muted" style="font:600 12px B">holding on tight</span>`, { up: 110, dx: -120 })}
  ${note("Two-seater hot laps", "Give someone the ride of their life", ["A lengthened car with a seat behind the driver. Take a friend round (they join with a room code) or a made-up VIP.", "Their camera sits in the back seat. Friends see your lap from there; VIPs react to every corner."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 290, `<div class="lbl2" style="margin-bottom:6px">Passenger</div>${tg(["Friend (room code)", "Made-up VIP"], 0)}<div style="display:grid;gap:6px;margin-top:10px">${kv("Sam's top g", "4.6 g · Parabolica")}${kv("Sam's camera", "back seat")}${kv("Rating", `<span class="acc">"Unreal"</span>`)}</div>`)}
  ${hb([gear(7, 312), t2("Hot lap", "Monza · 2 of 3"), t2("Passenger", "Sam")])}
  ${concept("Concept render · two-seater hot laps")}`;

// 10 · straight-line duels
S.drag = () => `${bg("l9-drag")}
  ${pin(AA["l9-drag"], "you", `${pill("YOU", "#2A2310", "#FFB547")}`, { up: 70, dx: 60 })}
  ${pin(AA["l9-drag"], "rival", `${pill("BRD", "#3A1218", "#FF8A8A")}`, { up: 70, dx: 60 })}
  ${pin(AA["l9-drag"], "lights", `<b style="font:600 13px B">Start lights · steady, they don't flash</b>`, { up: 40, dx: -200 })}
  ${pin(AA["l9-drag"], "trap", `${pill("SPEED TRAP · 330 m", "#1C2230", "#E8EAF0")}`, { up: 110, dx: 0 })}
  ${note("Straight-line duels", "Launch, shift, top speed", ["Two cars, the longest straight, a standing start. Fastest to the speed trap wins.", "Good for testing a setup: low wing and long gears versus a quick launch."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Best runs</div><div style="display:grid;gap:6px">${kv("0–100 km/h", "2.6 s")}${kv("0–200 km/h", "4.7 s")}${kv("Trap speed", `<span class="acc">298 km/h</span>`)}${kv("Reaction", "0.21 s")}</div><div class="lbl2" style="margin:10px 0 6px">Against</div>${tg(["Friend", "AI", "Your ghost"], 0)}`)}
  ${hb([gear(1, 0), t2("Launch revs", "10,800"), t2("Lights", "4 of 5 on")])}
  ${concept("Concept render · straight-line duels")}`;

// 11 · party games
S.party = () => `${bg("l6-train")}
  ${pin(AA["l6-train"], "VELOCE", `${pill("IT", "#3A1218", "#FF8A8A")} <b style="font:600 13px B">VELOCE · Leo</b>`, { up: 130, dx: -140 })}
  ${pin(AA["l6-train"], "AXIOM", `${pill("SAFE", "#14361F", "#6EE7A8")} <b style="font:600 13px B">Sam</b>`, { up: 110, dx: 140 })}
  ${note("Party games", "Silly modes for a room full of friends", ["Tag: pass the car that's 'it' and you become it. Whoever is it for the shortest time wins.", "Latest braker: everyone brakes for the hairpin; latest without missing the corner wins.", "No points, no ranks, just for fun."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:8px">Game</div><div style="display:grid;gap:6px;font:600 13px B">${[["Tag", 1], ["Latest braker", 0], ["King of the corner", 0], ["Follow the leader", 0]].map(([a, on]) => `<div class="card2" style="padding:8px 12px;${on ? "box-shadow:inset 0 0 0 1px #FFB547;color:#FFB547" : ""}">${a}</div>`).join("")}</div>`)}
  ${hb([gear(7, 301), t2("You", "safe · 0:42 as it so far"), t2("Leo", `<span class="bad">it · 1:10</span>`)])}
  ${concept("Concept render · party games")}`;

// 12 · fantasy picks on the live timing site
const fdrv = [["OKA", "AXIOM", 31, 1], ["BRD", "VELOCE", 28, 1], ["SLV", "NOVA", 22, 0], ["ISH", "KESTREL", 17, 1], ["VRG", "HALCYON", 12, 0], ["DEL", "VORTEX", 10, 1], ["KAI", "ORBITA", 8, 0], ["MOR", "MERIDIAN", 6, 1], ["PEL", "BRAVO", 5, 0]];
S.fantasy = () => `<div style="position:absolute;inset:0;background:#0B0D12"></div>
  <div class="top"><div class="brand">RACELIMIT<small>LIVE</small></div><div class="crumbs">Fantasy · <b>Lusail weekend</b></div><div class="sp"></div>${["Live", "Strategy", "Compare", "Fantasy", "My races"].map((t) => `<span class="chip" style="${t === "Fantasy" ? "background:#2A2310;color:#FFB547" : ""}">${t}</span>`).join("")}</div>
  <div class="grid" style="grid-template-columns:1.3fr 1fr;height:836px;zoom:1;padding:18px 24px;align-content:start">
    <div class="panel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Pick 5 drivers</h2><span class="chip">Budget 100 · used <b class="acc">92</b></span></div>
      <table><tr><th></th><th>Driver</th><th class="r">Price</th><th class="r">Last race</th><th class="r">Picked by</th></tr>${fdrv.map(([c, t, p, on], k) => `<tr${on ? ` style="background:#1E1A12"` : ""}><td>${on ? `<span class="pill" style="background:#2A2310;color:#FFB547">✓</span>` : `<span class="pill" style="background:#1C2230;color:#9AA3B2">+</span>`}</td><td><i style="display:inline-block;width:4px;height:14px;background:${TEAMS[t]};margin-right:6px;vertical-align:middle"></i><b>${c}</b> <span class="muted" style="font:600 12px B">${t}</span></td><td class="r mono">${p}</td><td class="r mono">${[42, 38, 21, 30, 9, 18, 4, 15, 2][k]} pts</td><td class="r mono">${[61, 54, 33, 28, 12, 19, 8, 11, 3][k]}%</td></tr>`).join("")}</table></div>
    <div style="display:grid;gap:16px;align-content:start"><div class="panel"><h2>Your team · live</h2>${[["OKA", 18], ["BRD", 12], ["ISH", 9], ["DEL", 6], ["MOR", 4]].map(([c, p]) => `<div class="row" style="justify-content:space-between;margin-top:6px"><span>${drv(c)}</span><b class="mono acc">${p}</b></div>`).join("")}<div class="row" style="justify-content:space-between;margin-top:10px;border-top:1px solid #262B36;padding-top:8px"><b>Total so far</b><b class="mono acc" style="font-size:20px">49</b></div><div class="muted" style="font:500 12px B">Updates live from the timing during the race.</div></div>
      <div class="panel"><h2>Unlocks in the game</h2>${[["40 pts", "Lusail night helmet", 1], ["60 pts", "Gold-trim livery", 0], ["Season top 10%", "Trophy for your cabinet", 0]].map(([a, b, on]) => `<div class="row" style="justify-content:space-between;margin-top:6px"><span class="mono ${on ? "good" : "muted"}">${a}</span><b style="font:600 13px B">${b}</b></div>`).join("")}<div class="muted" style="font:500 12px B;margin-top:8px">Saved in this browser and passed to the game on the same site. No account needed.</div></div></div>
  </div>${concept("Concept render · fantasy picks on the live timing site")}`;

// 13 · race length
S.racelength = () => top("Race weekend · <b>Race length</b>", `<span class="btn primary">Save</span>`, "silver-grid") + `
  <div class="grid" style="grid-template-columns:1.4fr 1fr;height:727px">
    <div class="panel"><h2>How long is the race?</h2><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:8px">${[["5 laps", "about 8 min", 0], ["25%", "13 laps · 22 min", 1], ["50%", "26 laps · 44 min", 0], ["Full", "52 laps · 1 h 28", 0], ["Custom", "you choose", 0]].map(([a, b, on]) => `<div class="card2" style="text-align:center;padding:16px 8px;${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><b style="font:700 28px BC;${on ? "color:#FFB547" : ""}">${a}</b><div class="muted" style="font:600 12px B">${b}</div></div>`).join("")}</div>
      <div style="margin-top:18px;display:grid;gap:12px">${sl("Custom laps", 25, "13")}</div>
      <div class="lbl2" style="margin:16px 0 6px">Scale with the length</div><div style="display:grid;gap:8px">${[["Tyre wear", "faster on short races, so stops still matter"], ["Fuel", "starts with what the distance needs"], ["Pit window", "moves with the distance"]].map(([a, b]) => `<div class="row" style="justify-content:space-between"><span><b style="font:600 14px B">${a}</b> <span class="muted" style="font:600 12px B">${b}</span></span>${tg(["On", "Off"], 0)}</div>`).join("")}</div></div>
    <div class="panel"><h2>At 25%</h2><div style="display:grid;gap:8px">${kv("Laps", "13")}${kv("Expected stops", "1")}${kv("Tyre wear", "×3.8")}${kv("Safety car chance", "same as full race")}</div><div class="muted" style="font:500 13px B;margin-top:12px">Career and championships keep one length for the whole season, so every round is fair.</div></div>
  </div>${concept("Concept render · race length")}`;

// 14 · mid-race saves
S.midsave = () => `${bg("spa-chase", "blur(3px) brightness(.45)")}
  <div class="hudbox" style="left:50%;top:50%;transform:translate(-50%,-50%);width:560px;padding:24px 26px"><div class="lbl2">Paused · lap 23 of 52 · P4</div><b style="font:700 34px BC">Spa · Race</b>
    <div style="display:grid;gap:10px;margin-top:14px">${[["Resume", 0], ["Save and quit · carry on later", 1], ["Restart", 0], ["Settings", 0]].map(([a, on]) => `<div class="card2" style="font:600 16px B;${on ? "box-shadow:inset 0 0 0 2px #FFB547;color:#FFB547" : ""}">${a}</div>`).join("")}</div>
    <div class="card2" style="margin-top:14px;display:grid;gap:4px"><div class="lbl2">This save</div>${kv("Cars, gaps, tyres, fuel, damage", "all kept")}${kv("Weather", "carries on as forecast")}${kv("Saved", "Sat 15:41")}</div></div>
  ${note("Mid-race saves", "Stop now, finish later", ["Save in the middle of a race and pick it up later, exactly where you left it.", "One save per race. Online races and challenges can't be saved."], "left:18px;top:18px", 380)}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Saved races</div><div style="display:grid;gap:6px">${[["Spa", "lap 23/52 · P4"], ["Monza", "lap 9/53 · P2"]].map(([a, b]) => `<div class="row" style="justify-content:space-between"><b style="font:600 13px B">${a}</b><span class="muted" style="font:600 12px B">${b}</span></div>`).join("")}</div>`)}
  ${concept("Concept render · mid-race saves")}`;

mount(S);
export default S;

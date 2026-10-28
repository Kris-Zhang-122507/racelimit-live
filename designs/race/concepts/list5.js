import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, tag, drv, chart, mount, TEAMS, A, pin } from "./common.js";
const AA = {};
await Promise.all(["l5-ladder", "l5-speedtrap", "l5-media", "l5-pack", "l5-bag", "l5-groundhog", "l5-stall", "l5-weighin", "l5-lockup", "tv-1"].map(async (n) => (AA[n] = await A(n))));

const S = {};
const key = (k) => `<span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">${k}</span>`;
const tick = (ok) => `<span style="display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:${ok ? "#14361F" : "#3A1218"};color:${ok ? "#6EE7A8" : "#FF8A8A"};font:700 12px B">${ok ? "✓" : "!"}</span>`;

// 1 · junior ladder
S.ladder = () => `${bg("l5-ladder")}
  ${pin(AA["l5-ladder"], "c2009", `<div style="display:grid;gap:1px"><b style="font:700 18px BC">Formula RL3</b><span class="muted" style="font:600 11px B">first step · smaller, slower cars</span></div>`, { up: 90, dx: 30 })}
  ${pin(AA["l5-ladder"], "c2017", `<div style="display:grid;gap:1px"><b style="font:700 18px BC">Formula RL2</b><span class="muted" style="font:600 11px B">the last step before the top</span></div>`, { up: 120 })}
  ${pin(AA["l5-ladder"], "c2026", `<div style="display:grid;gap:1px"><b style="font:700 18px BC;color:#FFB547">Grand Prix</b><span class="muted" style="font:600 11px B">the top class</span></div>`, { up: 90, dx: -30 })}
  ${note("Junior ladder", "Earn your way to the top class", ["Career mode starts in made-up feeder series with lighter, slower cars and shorter races.", "Finish top 3 in the championship (or impress a team scout) to be promoted.", "Each step adds something new: pit stops in RL2, battery and overtake mode in the top class."])}
  ${box("right:18px;top:18px", 340, `<div class="lbl2" style="margin-bottom:8px">Your path</div>
    <div style="display:grid;gap:8px">${[["Formula RL3", "Season 1 · P2 in the standings", "done", "#6EE7A8"], ["Formula RL2", "Season 2 · round 6 of 12 · P4", "now", "#FFB547"], ["Grand Prix", "3 teams watching you", "next", "#9AA3B2"]].map(([a, b, s, c]) => `<div class="card2" style="${s === "now" ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b>${a}</b><span class="pill" style="background:#1C2230;color:${c}">${s.toUpperCase()}</span></div><div class="muted" style="font:600 12px B">${b}</div></div>`).join("")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Promotion</div>${kv("Needed", "top 3, or a scout's offer")}${kv("Scout watching", `<span class="acc">this weekend</span>`)}`)}
  ${concept("Concept render · junior ladder")}`;

// 2 · sponsor goals
S.sponsors = () => `${bg("l5-speedtrap")}
  ${pin(AA["l5-speedtrap"], "trap", `${pill("SPEED TRAP", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">sponsored by NORTHWIND</span>`, { up: 40 })}
  ${pin(AA["l5-speedtrap"], "vortex", `${drv("DEL")} <span class="muted" style="font:600 12px B">fastest so far · 343.8</span>`, { up: 70, dx: 120 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);width:600px;padding:12px 16px"><div class="row"><span class="pill" style="background:#10213A;color:#7FC4FF;font-size:13px">SPONSOR GOAL · NORTHWIND</span><span class="muted" style="margin-left:auto;font:600 12px B">ends at the flag</span></div>
    <div style="font:700 24px BC;margin-top:6px">Be fastest through the speed trap this race</div>
    <div class="row" style="margin-top:6px;font:600 13px B"><span>Your best <b class="mono">341.2</b></span><span class="muted">·</span><span>Best of anyone <b class="mono">343.8</b> (DEL)</span><span class="muted">·</span><span class="good">bonus 40,000 credits</span></div></div>
  ${note("Sponsor goals", "Your sponsors pay for results they care about", ["Every made-up sponsor sets its own target each weekend: top the speed trap, beat a rival team, finish without a penalty, lead a lap.", "Hitting them pays credits for upgrades in career mode, and keeps the sponsor happy for next season."], "left:18px;top:160px", 400)}
  ${box("right:18px;top:160px", 320, `<div class="lbl2" style="margin-bottom:8px">This weekend</div><div style="display:grid;gap:8px">${[["NORTHWIND", "Top the speed trap", "in progress", "#FFB547"], ["ARCLIGHT", "Finish ahead of VORTEX", "on track: P5 vs P7", "#6EE7A8"], ["TIDELINE", "No penalties", "✓ so far", "#6EE7A8"]].map(([a, b, c, col]) => `<div class="card2"><div class="lbl2">${a}</div><b style="font:600 14px B">${b}</b><div style="font:600 12px B;color:${col}">${c}</div></div>`).join("")}</div>`)}
  ${hb([gear(8, 341), t2("Speed trap in 180 m", "slipstream DEL for a tow"), t2("Lap 22 / 53", "P5")])}
  ${concept("Concept render · sponsor goals")}`;

// 3 · driver market
S.market = () => top("Career · <b>Driver market</b>", `<span class="chip">Your contract ends after round 18</span>`, "l5-pack") + `
  <div class="grid" style="grid-template-columns:repeat(3,1fr);height:727px">
    ${[["AXIOM", "Front-runner", "1 year", "No. 2 driver", "Teammate: OKA (champion)", 0], ["MERIDIAN", "Midfield, rising", "2 years", "Equal status", "New wind tunnel next year", 1], ["RACELIMIT", "Your team now", "1 year + option", "Lead driver", "Wants you to stay", 0]].map(([t, a, len, role, note2, on]) => `<div class="panel" style="${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><div class="row"><i style="width:8px;height:44px;border-radius:3px;background:${TEAMS[t]}"></i><div><b style="font:700 30px BC">${t}</b><div class="muted">${a}</div></div></div>
      <div style="display:grid;gap:6px;margin-top:14px">${kv("Length", len)}${kv("Role", role)}${kv("Note", note2)}</div>
      <div class="lbl2" style="margin:14px 0 6px">They want</div><div class="muted" style="font:600 13px B">${["a podium before round 18", "top 8 in the championship", "your answer by round 16"][["AXIOM", "MERIDIAN", "RACELIMIT"].indexOf(t)]}</div>
      <div class="row" style="margin-top:14px"><span class="btn ${on ? "primary" : ""}">Talk</span><span class="btn">Later</span></div></div>`).join("")}
    <div class="panel" style="grid-column:span 2"><h2>Who's moving</h2><table>${[["VRG", "HALCYON → AXIOM", "rumour", "#FFB547"], ["KAI", "ORBITA, extended to 2028", "signed", "#6EE7A8"], ["SLV", "NOVA → ?", "talking to 3 teams", "#9AA3B2"], ["MAX", "RACELIMIT junior → RACELIMIT", "if you leave", "#7FC4FF"]].map(([d, m, s, c]) => `<tr><td><b>${d}</b></td><td>${m}</td><td style="color:${c}">${s}</td></tr>`).join("")}</table></div>
    <div class="panel"><h2>Your value</h2>${chart(400, 110, [{ pts: [0.3, 0.35, 0.5, 0.45, 0.62, 0.7, 0.68, 0.8], c: "#6EE7A8" }])}<div class="muted" style="font:600 12px B;margin-top:6px">Up after the Monza podium. One more strong result and AXIOM may offer equal status.</div></div>
  </div>${concept("Concept render · driver market")}`;

// 4 · media moments
S.media = () => `${bg("l5-media")}
  <div class="hudbox" style="left:50%;bottom:22px;transform:translateX(-50%);width:820px;padding:14px 18px"><div class="row"><span class="pill" style="background:#2A2310;color:#FFB547;font-size:13px">AFTER THE RACE · P4</span><span class="muted" style="margin-left:auto;font:600 12px B">pick an answer or skip</span></div>
    <div style="font:600 19px/1.4 B;margin:8px 0 12px">"You and Brandt touched at Turn 1 again. Was that his fault?"</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${[["1", "\"Racing incident, we move on.\"", "team calm · rival neutral", "#9AA3B2"], ["2", "\"He never leaves room. Ask him.\"", "rival grudge + · fans love it", "#FF8A8A"], ["3", "\"I'll learn from it.\"", "team trust + · sponsor happy", "#6EE7A8"]].map(([k, a, b, c]) => `<div class="card2"><div class="row" style="align-items:flex-start">${key(k)}<b style="font:600 14px B">${a}</b></div><div style="font:600 12px B;color:${c};margin-top:6px">${b}</div></div>`).join("")}</div></div>
  ${note("Media moments", "What you say has consequences", ["After a race, a short interview in front of the sponsor board. Two or three questions about what happened.", "Your answers change your team's mood, your rival's attitude on track and what the sponsors think.", "Skip it whenever you like."], "left:18px;top:18px", 400)}
  ${concept("Concept render · media moments")}`;

// 5 · AI personalities
const trait = (t, c) => `<span class="pill" style="background:#1C2230;color:${c}">${t}</span>`;
S.personalities = () => `${bg("l5-pack")}
  ${pin(AA["l5-pack"], "AXIOM", `${drv("OKA")} ${trait("TYRE SAVER", "#6EE7A8")}`, { up: 60, dx: -150 })}
  ${pin(AA["l5-pack"], "VELOCE", `${drv("BRD")} ${trait("DEFENDS HARD", "#FF8A8A")}`, { up: 80, dx: 140 })}
  ${pin(AA["l5-pack"], "NOVA", `${drv("SLV")} ${trait("LATE BRAKER", "#FFB547")}`, { up: 110, dx: -120 })}
  ${pin(AA["l5-pack"], "HALCYON", `${drv("VRG")} ${trait("WET SPECIALIST", "#7FC4FF")}`, { up: 120, dx: 130 })}
  ${note("AI personalities", "Every driver races differently", ["Each AI driver has a few traits: saves tyres, defends hard, brakes late, strong in the wet, nervous under pressure.", "You learn who to pass where: a late braker is hard to pass into Turn 1 but slow out of it.", "Traits come from their career: a driver who keeps winning in the rain gets 'wet specialist'."], "left:18px;top:18px", 410)}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">BRD · VELOCE</div><div style="display:grid;gap:8px">${sl("Racecraft", 82, "82")}${sl("Defending", 94, "94")}${sl("Tyre care", 40, "40")}${sl("Wet", 61, "61")}${sl("Mistakes", 30, "low")}</div>`)}
  ${concept("Concept render · AI personalities")}`;

// 6 · visor tear-offs
S.visor = () => `${bg("l5-visor", "brightness(.7) saturate(.75)")}
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 38% 26% at 34% 38%,rgba(70,58,40,.55),transparent 70%),radial-gradient(ellipse 22% 16% at 66% 30%,rgba(60,50,36,.45),transparent 70%),radial-gradient(ellipse 30% 20% at 58% 62%,rgba(90,96,104,.35),transparent 70%)"></div>
  <svg style="position:absolute;inset:0" width="1600" height="900">${Array.from({ length: 70 }, (_, i) => { const x = (i * 211) % 1600, y = (i * 97) % 860, l = 18 + (i % 5) * 9; return `<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + l}" stroke="rgba(220,232,245,.35)" stroke-width="2" stroke-linecap="round"/><circle cx="${(i * 137) % 1600}" cy="${(i * 59) % 880}" r="${3 + (i % 4)}" fill="rgba(220,232,245,.18)"/>`; }).join("")}</svg>
  <svg style="position:absolute;inset:0" width="1600" height="900"><path d="M0,0 L120,0 C140,250 90,520 150,900 L0,900 Z" fill="rgba(240,244,248,.16)" stroke="rgba(255,255,255,.45)" stroke-width="2"/><path d="M118,0 C138,250 88,520 148,900" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3"/><rect x="20" y="420" width="44" height="80" rx="6" fill="#E8EAF0"/><rect x="28" y="432" width="28" height="56" rx="4" fill="#C3C9D4"/></svg>
  ${tag(190, 470, `${pill("TEAR-OFF", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">pulling one off clears the view</span>`, "translate(0,-50%)")}
  ${note("Visor tear-offs", "Oil, rain and rubber build up on your visor", ["In the cockpit view the visor slowly gets dirty: rubber specks, oil mist, rain drops.", "Press a button to pull off a tear-off strip and get a clean view. You start with 5.", "Drop one on the track and it can blow into someone's brake duct."], "right:18px;top:18px")}
  ${hb([gear(6, 236), t2(`Tear-offs <span class="mono acc">3 left</span>`, `${key("T")} pull one off`), t2("Visor", "dirty · 40%")])}
  ${concept("Concept render · visor tear-offs")}`;

// 7 · blocked radiator
S.radiator = () => `${bg("l5-bag")}
  ${pin(AA["l5-bag"], "bag", `${pill("PLASTIC BAG IN THE SIDEPOD", "#3A1218", "#FF8A8A")}`, { up: 110, dx: -60 })}
  ${note("Blocked radiator", "Something's stuck in your sidepod", ["Litter or a bit of debris sticks over a sidepod inlet. Less air gets to the radiator, so the temperatures start climbing.", "Weave to shake it loose, or tuck in close behind another car so the dirty air blows it away.", "Leave it too long and the engine has to lift and save itself."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 340, `<div class="lbl2" style="margin-bottom:8px">Temperatures</div><div style="display:grid;gap:10px">
    ${[["Water", 128, 92, "#FF8A8A"], ["Oil", 141, 82, "#FFB060"], ["Engine power", "−3%", 30, "#FF8A8A"]].map(([a, b, v, c]) => `<div><div class="kv"><span>${a}</span><b style="color:${c}" class="mono">${typeof b === "number" ? b + "°" : b}</b></div><div style="height:6px;border-radius:3px;background:#2A2F3B;margin-top:4px"><i style="display:block;height:100%;width:${v}%;background:${c};border-radius:3px"></i></div></div>`).join("")}</div>
    ${chart(310, 70, [{ pts: [0.3, 0.32, 0.33, 0.4, 0.52, 0.63, 0.74, 0.82], c: "#FF8A8A" }])}
    <div class="card2" style="margin-top:10px;box-shadow:inset 0 0 0 1px #FFB547"><b class="acc">Engineer:</b> "Debris in the left sidepod. Weave on the straight, or get close behind VORTEX."</div>`)}
  ${hb([gear(8, 318), `${pill("WATER 128°", "#3A1218", "#FF8A8A")}<div style="font:600 11px B;color:#9AA3B2">rising 3° a lap</div>`, t2("Clear it", "weave · follow a car")])}
  ${concept("Concept render · blocked radiator")}`;

// 8 · track invaders
S.invader = () => `${bg("l5-groundhog")}
  ${pin(AA["l5-groundhog"], "hog", `${pill("GROUNDHOG ON TRACK", "#2A2310", "#F2C230")}`, { up: 70, dx: 60 })}
  ${pin(AA["l5-groundhog"], "marshal", `${pill("YELLOW · SECTOR 2", "#2A2310", "#F2C230")}`, { up: 50 })}
  ${note("Track invaders", "Sometimes something wanders on", ["A groundhog in Montreal, a dog at the hairpin, a stray hare at Silverstone. Rare and harmless: they always scurry off.", "A yellow flag comes out for the sector, and the marshals shoo it away.", "Can be turned off."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:6px">Track invaders</div>${tg(["On (rare)", "Off"], 0)}<div class="muted" style="font:600 12px B;margin-top:8px">They never cause a crash, and you can't hit them: they run off as you get close.</div>`)}
  ${hb([gear(5, 188), `<div style="display:flex;gap:8px;align-items:center"><i style="width:28px;height:20px;border-radius:3px;background:#F2C230"></i><b style="font:600 13px B">YELLOW · sector 2</b></div><div style="font:600 11px B;color:#9AA3B2">animal on track · no overtaking</div>`, t2("Montreal", "lap 14 / 70")])}
  ${concept("Concept render · track invaders")}`;

// 9 · grid dramas
S.stall = () => `${bg("l5-stall")}
  ${pin(AA["l5-stall"], "stalled", `${pill("STALLED · BRD", "#3A1218", "#FF8A8A")} <span class="muted" style="font:600 12px B">starts from the pit lane</span>`, { up: 90, dx: -80 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);display:flex;align-items:center;gap:18px;padding:14px 20px"><div style="display:flex;gap:8px">${Array.from({ length: 5 }, () => `<i style="width:26px;height:26px;border-radius:50%;background:#FFA51F;box-shadow:0 0 0 3px #2A2310"></i>`).join("")}</div><div><b style="font:700 28px/1 BC;letter-spacing:.04em">START ABORTED</b><div class="muted" style="font:600 13px B">a car has stalled · extra formation lap · race is one lap shorter</div></div></div>
  ${note("Grid dramas", "Starts don't always go to plan", ["A car can stall on the grid: marshals wave yellow, the start is aborted and everyone does an extra formation lap.", "Move before the lights go out and you get a jump-start penalty.", "Stall yourself (with clutch control on) and you start from the pit lane."], "left:18px;top:130px", 400)}
  ${box("right:18px;top:130px", 300, `<div class="lbl2" style="margin-bottom:6px">Start lights</div><div class="muted" style="font:600 12px B">Orange lights, steady (they don't flash), mean the start is aborted.</div><div class="lbl2" style="margin:12px 0 6px">Grid dramas</div>${tg(["Real", "Rare", "Off"], 0)}<div class="lbl2" style="margin:12px 0 6px">Jump starts</div>${tg(["Penalty", "Warning only"], 0)}`)}
  ${concept("Concept render · grid dramas")}`;

// 10 · after the flag
S.weighin = () => `${bg("l5-weighin")}
  ${pin(AA["l5-weighin"], "scale", `${pill("801.6 kg", "#14361F", "#6EE7A8")} <span class="muted" style="font:600 12px B">limit 800 kg</span>`, { up: 50 })}
  ${pin(AA["l5-weighin"], "plank", `${pill("PLANK", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">measured next</span>`, { up: 110, dx: 120 })}
  ${note("After the flag", "Slow-down lap, then the checks", ["After the chequered flag: a slow lap with the marshals waving, then into parc fermé.", "Stewards weigh the car, take a fuel sample and measure the plank. Too light, not enough fuel, or a worn plank and you're disqualified.", "It's why you might be told to pick up rubber on the slow-down lap."], "left:18px;top:18px", 420)}
  ${box("right:18px;top:18px", 320, `<div class="lbl2" style="margin-bottom:8px">Post-race checks</div><div style="display:grid;gap:8px">${[[1, "Car weight", "801.6 kg · limit 800"], [1, "Fuel sample", "1.1 kg left · need 1.0"], [0, "Plank wear", "0.9 mm · limit 1.0"], [1, "Tyres returned", "4 of 4"]].map(([ok, a, b]) => `<div class="row">${tick(ok)}<div><b style="font:600 14px B">${a}</b><div class="muted" style="font:600 12px B">${b}</div></div></div>`).join("")}</div>
    <div class="card2" style="margin-top:12px"><b class="good">Result stands: P4</b><div class="muted" style="font:600 12px B">plank close to the limit: raise the rear 1 mm next time</div></div>`)}
  ${concept("Concept render · after the flag")}`;

// 11 · race simulator
S.racesim = () => top("Before the race · <b>Strategy simulator</b>", `<span class="chip">From your practice laps</span>`, "l5-pack") + `
  <div class="grid" style="grid-template-columns:1.4fr 1fr;height:727px">
    <div class="panel"><h2>One stop or two? · Suzuka, 53 laps</h2>
      ${[["1 stop", [["M", 24, "#F2C230"], ["H", 29, "#E8EAF0"]], "1:28:41.2", "#6EE7A8", "fastest if there's no safety car"], ["2 stops", [["S", 14, "#FF5A6A"], ["M", 20, "#F2C230"], ["M", 19, "#F2C230"]], "1:28:44.9", "#FFB547", "+3.7 s · better if a safety car comes"], ["2 stops (H start)", [["H", 30, "#E8EAF0"], ["S", 23, "#FF5A6A"]], "1:28:51.0", "#9AA3B2", "+9.8 s"]].map(([n, st, t, c, d], k) => `<div class="card2" style="margin-top:10px;${k === 0 ? "box-shadow:inset 0 0 0 1px #6EE7A8" : ""}"><div class="row" style="justify-content:space-between"><b style="font:600 16px B">${n}</b><b class="mono" style="color:${c}">${t}</b></div>
        <div style="display:flex;gap:3px;margin:8px 0 4px">${st.map(([ty, l, col]) => `<div style="flex:${l};height:22px;border-radius:4px;background:${col};color:#0B0D12;font:700 12px B;display:grid;place-items:center">${ty} · ${l}</div>`).join("")}</div><div class="muted" style="font:600 12px B">${d}</div></div>`).join("")}
      <div style="margin-top:14px">${sl("Safety car chance", 38, "38%")}</div></div>
    <div class="panel"><h2>Lap times on each plan</h2>${chart(470, 220, [{ pts: [0.5, 0.48, 0.45, 0.42, 0.38, 0.33, 0.62, 0.6, 0.57, 0.53, 0.5, 0.46], c: "#6EE7A8" }, { pts: [0.58, 0.5, 0.42, 0.66, 0.6, 0.53, 0.47, 0.66, 0.6, 0.55, 0.5, 0.45], c: "#FFB547", dash: "6 4" }])}
      <div style="display:flex;gap:14px;font:600 12px B;margin-top:6px"><span class="good">— 1 stop</span><span class="acc">- - 2 stops</span></div>
      <div class="lbl2" style="margin:14px 0 6px">Built from</div><div style="display:grid;gap:6px">${kv("Your long run on mediums", "1:33.4, −0.06 s a lap")}${kv("Hards (FP2, 8 laps)", "1:33.9, −0.03 s a lap")}${kv("Pit stop here", "22.1 s")}</div>
      <span class="btn primary" style="margin-top:14px">Use the 1-stop plan</span></div>
  </div>${concept("Concept render · strategy simulator")}`;

// 12 · team simulator
S.teamsim = () => `${bg("l5-sim")}
  ${note("Team simulator", "Practise in the factory, not on the track", ["Between race weekends, drive the next circuit in the team's simulator. It doesn't use your tyres, your engine parts or track time.", "Try setups and see the lap time change. Your best setup is ready in the garage when the weekend starts.", "Each session costs a few hours of simulator time from your budget (career mode)."], "left:18px;top:18px", 430)}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">Prep for Mexico City</div><div style="display:grid;gap:6px">${kv("Sim hours left", "6 of 10")}${kv("Best lap", "1:17.94")}${kv("Setups tried", "4")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Runs</div><table>${[["Base setup", "1:18.61"], ["Rear wing +2", "1:18.20"], ["Softer front", "1:17.94", 1], ["Brake ducts open", "1:18.05"]].map(([a, b, on]) => `<tr${on ? ` style="background:#1E1A12"` : ""}><td>${a}</td><td class="r mono">${b}</td></tr>`).join("")}</table>
    <span class="btn primary" style="margin-top:12px">Take this setup to Mexico</span>`)}
  ${concept("Concept render · team simulator")}`;

// 13 · this week's circuit
S.thisweek = () => `${bg("l5-mexico", "blur(10px) brightness(.32)")}` + top("Main menu", `<span class="chip">Synced with the F1 calendar</span>`, null) + `
  <div class="grid" style="grid-template-columns:1.5fr 1fr;height:727px">
    <div class="panel" style="padding:0;overflow:hidden;display:grid;grid-template-rows:430px auto"><div style="background:url(bg/l5-mexico.png) center/cover;position:relative"><div class="hudbox" style="left:14px;top:14px"><div class="lbl2 acc">This week's circuit</div><b style="font:700 30px BC">Mexico City</b></div><div class="hudbox" style="right:14px;bottom:14px;text-align:right"><div class="lbl2">Real race starts in</div><b class="mono" style="font-size:26px">4d 02h 17m</b></div></div>
      <div style="padding:14px 18px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${[["Hot lap", "beat the real 2026 pole once it's set"], ["Practice the weekend", "same sessions, same times as the real one"], ["Weekly challenge", "Mexico in thin air · 1 clean lap"]].map(([a, b], k) => `<div class="card2" style="${k === 0 ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><b>${a}</b><div class="muted" style="font:600 12px B">${b}</div></div>`).join("")}</div></div>
    <div class="panel"><h2>Coming up</h2><table>${[["Mexico City", "Sun 1 Nov", "this week"], ["São Paulo", "Sun 8 Nov", ""], ["Las Vegas", "Sat 21 Nov", ""], ["Qatar", "Sun 29 Nov", ""], ["Abu Dhabi", "Sun 6 Dec", ""]].map(([a, b, c], k) => `<tr${k === 0 ? ` style="background:#1E1A12"` : ""}><td><b>${a}</b></td><td class="muted">${b}</td><td class="acc">${c}</td></tr>`).join("")}</table>
      <div class="muted" style="font:500 13px B;margin-top:12px">The same countdown as the live timing site. After the real race, its result and pole time are added to the game for that circuit.</div>
      <div class="lbl2" style="margin:14px 0 6px">Open in the live timing site</div><span class="btn">Mexico City weekend ↗</span></div>
  </div>${concept("Concept render · this week's circuit")}`;

// 14 · games for TV viewers
S.tvgames = () => `<div style="position:absolute;inset:0;background:#07080B"></div>
  <div class="top" style="background:#0B0D12"><div class="brand">RACELIMIT<small>TV</small></div><div class="crumbs"><b>Kiri's race</b> · Silverstone · lap 12 of 20</div><div class="sp"></div><span class="pill" style="background:#E8002D;color:#fff;font-size:13px">● LIVE</span><span class="chip">👁 14 watching</span></div>
  <div style="position:absolute;left:20px;top:84px;width:1060px;height:596px;border-radius:10px;overflow:hidden;background:url(bg/tv-1.png) center/cover">
    <div style="position:absolute;right:14px;top:14px"><span class="pill" style="background:#E8002D;color:#fff">● LIVE</span></div>
    <div class="hudbox" style="left:14px;bottom:14px;width:330px"><div class="lbl2 acc">Viewers' pit calls</div><div style="display:flex;gap:3px;align-items:end;height:84px;margin-top:8px">${[1, 2, 6, 3, 1, 1].map((v, i) => `<div style="flex:1;display:grid;gap:3px;justify-items:center"><i style="width:100%;height:${v * 9}px;border-radius:3px;background:${i === 2 ? "#FFB547" : "#3A4150"}"></i><span class="mono" style="font-size:11px">L${13 + i}</span></div>`).join("")}</div><div class="muted" style="font:600 11px B;margin-top:4px">most think Kiri pits on lap 15</div></div></div>
  <div class="hudbox" style="left:20px;top:694px;width:1060px;padding:12px 16px"><b style="font:700 20px BC">Watching on a phone? Play along.</b><div class="muted" style="font:600 13px B">The same pit-call game as the live timing site, and a driver of the day vote at the flag. Scores are kept for the whole season.</div></div>
  <div style="position:absolute;left:1150px;top:96px;width:390px;height:770px;border-radius:44px;background:#0E1117;box-shadow:0 0 0 10px #1A1E27,0 20px 60px rgba(0,0,0,.6);overflow:hidden;padding:22px 18px;display:grid;gap:12px;align-content:start">
    <div class="row" style="justify-content:space-between"><b class="brand" style="font-size:18px">RACELIMIT<small>TV</small></b><span class="pill" style="background:#E8002D;color:#fff">● LIVE</span></div>
    <div style="height:170px;border-radius:12px;background:url(bg/tv-1.png) center/cover"></div>
    <div class="card2"><div class="lbl2 acc">Pit-call game</div><b style="font:600 15px B">When does Kiri pit?</b><div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px">${[13, 14, 15, 16, 17].map((l) => `<span class="chip" style="${l === 15 ? "background:#2A2310;color:#FFB547;box-shadow:inset 0 0 0 1px #FFB547" : ""}">L${l}</span>`).join("")}</div><div class="muted" style="font:600 12px B;margin-top:6px">exact = 10 points · within 2 laps = 5</div></div>
    <div class="card2"><div class="lbl2 acc">Driver of the day</div><div style="display:grid;gap:6px;margin-top:6px">${[["KIRI", 46, "#FFA51F"], ["BRD", 28, "#C8102E"], ["SLV", 15, "#16B8A6"], ["OKA", 11, "#16245C"]].map(([n, v, c]) => `<div><div class="kv"><span>${n}</span><b class="mono">${v}%</b></div><div style="height:6px;border-radius:3px;background:#2A2F3B;margin-top:3px"><i style="display:block;height:100%;width:${v}%;background:${c};border-radius:3px"></i></div></div>`).join("")}</div><div class="muted" style="font:600 12px B;margin-top:6px">voting closes at the flag</div></div>
    <div class="card2"><div class="lbl2">Your season</div><div class="kv"><span>Points</span><b class="mono">85</b></div><div class="kv"><span>Rank among viewers</span><b>3rd of 14</b></div></div></div>
  ${concept("Concept render · games for TV viewers")}`;

// 15 · webcam head tracking
const face = `<svg width="260" height="190" viewBox="0 0 260 190"><rect width="260" height="190" rx="10" fill="#1A1E27"/>
  <g transform="rotate(-14 130 100)"><ellipse cx="130" cy="96" rx="52" ry="66" fill="none" stroke="#7FC4FF" stroke-width="2.5"/>${[[108, 82], [152, 82], [130, 108], [114, 132], [146, 132], [130, 136], [98, 70], [162, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#7FC4FF"/>`).join("")}<path d="M114 132 Q130 142 146 132" fill="none" stroke="#7FC4FF" stroke-width="2"/></g>
  <path d="M200 40 l-40 0 M172 30 l-12 10 l12 10" stroke="#FFB547" stroke-width="3" fill="none"/><text x="206" y="45" fill="#FFB547" font-family="B" font-weight="600" font-size="14">24°</text>
  <text x="12" y="180" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11">no video leaves your computer</text></svg>`;
S.headtrack = () => `${bg("l5-headlook")}
  ${note("Webcam head tracking", "Turn your head, the view follows", ["Your laptop's camera watches where your head points. Turn a little to the right and the cockpit view looks further into the corner, like a real driver looking for the apex.", "It's done in the browser with free face tracking: no extra hardware, and the video never leaves your computer.", "Works with keyboard, controller or wheel."], "left:18px;top:18px", 420)}
  ${box("right:18px;top:18px", 290, `<div class="lbl2" style="margin-bottom:8px">Camera · face found</div>${face}
    <div style="display:grid;gap:10px;margin-top:10px">${sl("Look amount", 60, "×2.5")}${sl("Smoothing", 45, "medium")}${sl("Dead zone", 15, "3°")}</div>
    <div class="row" style="margin-top:10px"><span class="btn">Re-centre</span><span class="muted" style="font:600 12px B">or ${key("C")}</span></div>`)}
  ${hb([gear(2, 82), t2("Looking into the turn", "24° · La Source"), t2("Head tracking", "on · webcam")])}
  ${concept("Concept render · webcam head tracking")}`;

// 16 · controller rumble
const pad = `<svg width="300" height="190" viewBox="0 0 300 190"><path d="M60 50 Q150 30 240 50 Q290 60 292 120 Q296 178 258 178 Q230 178 212 140 L88 140 Q70 178 42 178 Q4 178 8 120 Q10 60 60 50 Z" fill="#24272F" stroke="#3A4150" stroke-width="2"/>
  <rect x="46" y="22" width="56" height="22" rx="8" fill="#FF6B6B"/><rect x="198" y="22" width="56" height="22" rx="8" fill="#3A4150"/>
  ${[0, 1, 2].map((k) => `<path d="M${40 - k * 8} ${18 - k * 6} q-8 -6 0 -12" stroke="#FF8A8A" stroke-width="2.5" fill="none" opacity="${1 - k * 0.3}"/><path d="M${108 + k * 8} ${18 - k * 6} q8 -6 0 -12" stroke="#FF8A8A" stroke-width="2.5" fill="none" opacity="${1 - k * 0.3}"/>`).join("")}
  <text x="74" y="14" fill="#FF8A8A" text-anchor="middle" font-family="B" font-weight="600" font-size="12">LT · brake</text><text x="226" y="14" fill="#9AA3B2" text-anchor="middle" font-family="B" font-weight="600" font-size="12">RT · throttle</text>
  <circle cx="92" cy="96" r="22" fill="#1A1C22"/><circle cx="196" cy="118" r="20" fill="#1A1C22"/>${[[226, 80, "#2FD27A"], [246, 98, "#E8002D"], [206, 98, "#5AA9FF"], [226, 116, "#F2C230"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/>`).join("")}</svg>`;
S.rumble = () => `${bg("l5-lockup")}
  ${pin(AA["l5-lockup"], "fl", `${pill("FRONT LEFT LOCKING", "#3A1218", "#FF8A8A")} <span class="muted" style="font:600 12px B">brake trigger buzzes</span>`, { up: 130, dx: -60 })}
  ${note("Controller rumble", "Feel the grip through your fingers", ["The brake trigger buzzes just before a front wheel locks, so you can ease off at the limit.", "The throttle trigger buzzes when the rear wheels spin.", "Kerbs, gravel and bumps come through the whole controller."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:6px">Controller</div><div style="display:grid;place-items:center">${pad}</div>
    <div style="display:grid;gap:10px;margin-top:6px">${sl("Trigger buzz", 70, "70%")}${sl("Kerbs and bumps", 50, "50%")}${sl("Starts buzzing at", 80, "90% grip")}</div>`)}
  ${hb([gear(3, 128), t2("Brake 100%", "front left locking"), t2("Turn 1 · Tarzan", "brake earlier")])}
  ${concept("Concept render · controller rumble")}`;

mount(S);
export default S;

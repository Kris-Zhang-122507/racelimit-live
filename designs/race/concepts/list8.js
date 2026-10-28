import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, tag, drv, chart, mount, TEAMS, A, pin } from "./common.js";
const AA = {};
await Promise.all(["l8-oil", "l8-impede", "l8-multi", "l8-pitboard", "l8-driver", "l8-cruise", "l8-parade"].map(async (n) => (AA[n] = await A(n))));

const S = {};
const key = (k) => `<span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">${k}</span>`;
const stripes = `<i style="display:inline-block;width:30px;height:20px;border-radius:3px;background:repeating-linear-gradient(90deg,#E8002D 0 5px,#F2C230 5px 10px);vertical-align:middle"></i>`;

// 1 · oil on track
S.oil = () => `${bg("l8-oil")}
  ${pin(AA["l8-oil"], "oil", `${pill("OIL ON TRACK", "#1C2230", "#E8EAF0")} <span class="bad" style="font:600 12px B">very slippery</span>`, { up: 80, dx: -90 })}
  ${pin(AA["l8-oil"], "flag", `${stripes} <b style="font:600 13px B">Surface flag</b>`, { up: 50, dx: 40 })}
  ${pin(AA["l8-oil"], "blown", `${pill("KESTREL · ENGINE GONE", "#3A1218", "#FF8A8A")}`, { up: 60, dx: -40 })}
  ${note("Oil on track", "Something's made the track slippery", ["When an engine blows it can drop oil on the racing line. Run over it and the car slides like it's wet.", "Marshals show the red-and-yellow striped flag: slippery surface ahead. It's held steady, never waved fast.", "Take a different line, or brake earlier, until it's cleaned up."], "left:18px;top:18px")}
  ${hb([gear(6, 241), `<div style="display:flex;gap:8px;align-items:center">${stripes}<b style="font:600 13px B">SLIPPERY · sector 2</b></div><div style="font:600 11px B;color:#9AA3B2">oil on the left of the racing line</div>`, t2("Grip there", `<span class="bad">−45%</span>`)])}
  ${concept("Concept render · oil on track")}`;

// 2 · thunderstorm delay
S.thunder = () => `${bg("l8-storm")}<div class="rain"></div>
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);display:flex;gap:16px;align-items:center;padding:14px 20px"><div style="width:56px;height:40px;border-radius:4px;background:#E8002D"></div><div><b style="font:700 28px/1 BC;letter-spacing:.04em">SESSION SUSPENDED · WEATHER</b><div class="muted" style="font:600 13px B">lightning nearby · next update in 15 min</div></div></div>
  ${note("Thunderstorm delays", "Wait it out in the garage", ["When lightning gets close, the session is stopped for safety. Everyone waits in the garage, watching the radar.", "Lightning is shown on the radar and heard as thunder. Nothing flashes on screen.", "When it's safe, the session restarts behind the safety car, often on full wets."], "left:18px;top:140px")}
  ${box("right:18px;top:140px", 360, `<div class="lbl2" style="margin-bottom:8px">Storm radar</div>
    <div style="height:180px;border-radius:10px;background:radial-gradient(circle at 60% 45%,#7A2A9A 0 10%,#2F6FB8 22%,#1F4E86 34%,transparent 50%),#10141C;position:relative">
      <svg width="332" height="180" style="position:absolute;inset:0"><circle cx="150" cy="100" r="7" fill="#FFB547"/><text x="160" y="104" fill="#FFB547" font-family="B" font-weight="600" font-size="12">circuit</text>${[[200, 70], [214, 84], [190, 60]].map(([x, y]) => `<path d="M${x} ${y} l-6 10 h6 l-6 10" stroke="#F2C230" stroke-width="2" fill="none"/>`).join("")}<circle cx="150" cy="100" r="60" fill="none" stroke="#E8EAF0" stroke-dasharray="4 4" opacity=".5"/><text x="96" y="36" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11">8 km</text></svg></div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Lightning", `<span class="acc">8 km away</span>`)}${kv("Moving", "away, 20 km/h")}${kv("Restart", "in about 25 min")}</div>`)}
  ${concept("Concept render · thunderstorm delays")}`;

// 3 · impeding in qualifying
S.impede = () => `${bg("l8-impede")}
  ${pin(AA["l8-impede"], "fast", `${pill("BRD · PUSH LAP", "#2A1840", "#C9A0FF")} <span class="muted" style="font:600 12px B">0.9 s behind, closing fast</span>`, { up: 70, dx: -110 })}
  ${pin(AA["l8-impede"], "you", `${pill("YOU · COOL-DOWN LAP", "#1C2230", "#E8EAF0")}`, { up: 60, dx: 90 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);display:flex;gap:12px;align-items:center;padding:12px 18px"><i style="width:30px;height:20px;border-radius:3px;background:#3A7AE8"></i><div><b style="font:600 17px B">"Car behind on a push lap. Move right, stay off the line."</b><div class="muted" style="font:600 12px B">your engineer · 2 s before the braking zone</div></div></div>
  ${note("Impeding in qualifying", "Don't ruin someone's lap", ["In qualifying, cars on slow laps share the track with cars on fast laps. Get in the way and the stewards give you a grid penalty.", "Your engineer warns you, and a blue light on the dash shows which side to move to.", "The AI can get in your way too, and you can report it."], "left:18px;top:130px", 400)}
  ${box("right:18px;top:130px", 300, `<div class="lbl2" style="margin-bottom:8px">Stewards</div>${kv("Impeding", "3-place grid penalty")}${kv("Reprimand", "if minor")}${kv("Your record", "0 this season")}`)}
  ${concept("Concept render · impeding in qualifying")}`;

// 4 · mixed-class races
S.multiclass = () => `${bg("l8-multi")}
  ${pin(AA["l8-multi"], "e1998", `${pill("CLASS C · 1998", "#10213A", "#7FC4FF")}`, { up: 60, dx: -80 })}
  ${pin(AA["l8-multi"], "e2009", `${pill("CLASS B · 2009", "#14361F", "#6EE7A8")}`, { up: 70, dx: 90 })}
  ${pin(AA["l8-multi"], "e2017", `${pill("CLASS A · 2017", "#3A1218", "#FF8A8A")}`, { up: 70, dx: -40 })}
  ${note("Mixed-class races", "Different eras, one race", ["Cars from different eras race on track at the same time, like endurance racing. Each class fights for its own win.", "Faster classes have to get past the slower ones cleanly, and the slower cars have to stay predictable."], "left:18px;top:18px", 400)}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">Class B · you</div><table>${[["1", "YOU", "—"], ["2", "AXIOM", "+2.1"], ["3", "ORBITA", "+5.0"]].map(([a, b, c]) => `<tr${b === "YOU" ? ` style="background:#1E1A12"` : ""}><td class="mono">${a}</td><td>${b}</td><td class="r mono">${c}</td></tr>`).join("")}</table><div class="lbl2" style="margin:10px 0 6px">Classes</div><div class="row" style="flex-wrap:wrap">${pill("A · 2017", "#3A1218", "#FF8A8A")}${pill("B · 2009", "#14361F", "#6EE7A8")}${pill("C · 1998", "#10213A", "#7FC4FF")}</div>`)}
  ${concept("Concept render · mixed-class races")}`;

// 5 · pit boards
S.pitboard = () => `${bg("l8-pitboard")}
  ${pin(AA["l8-pitboard"], "board", `${pill("PIT BOARD", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">P3 · 2.4 s to the car ahead · lap 23</span>`, { up: 60 })}
  ${note("Pit boards", "No radio? Read the board", ["In the classic eras there was little or no radio. Your crew holds a board out on the pit wall as you pass the pits.", "It shows your position, the gap and the lap, and sometimes 'IN' to call you into the pits.", "Blink and you miss it, so glance at it each lap."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:6px">Radio in classic cars</div>${tg(["Board only (real)", "Board + radio", "Radio only"], 0)}`)}
  ${concept("Concept render · pit boards")}`;

// 6 · H-pattern gearbox
const gate = `<svg width="300" height="230" viewBox="0 0 300 230" font-family="BC" font-weight="700" font-size="22"><rect width="300" height="230" rx="12" fill="#1A1E27"/>
  <path d="M60 40 V190 M120 40 V190 M180 40 V190 M240 40 V190 M60 115 H240" stroke="#3A4150" stroke-width="14" stroke-linecap="round"/>
  ${[[60, 40, "R"], [60, 190, "1"], [120, 40, "2"], [120, 190, "3"], [180, 40, "4"], [180, 190, "5"], [240, 40, "6"]].map(([x, y, g]) => `<text x="${x}" y="${y < 100 ? y - 14 : y + 32}" fill="#C3C9D4" text-anchor="middle">${g}</text>`).join("")}
  <circle cx="180" cy="40" r="16" fill="#FFB547"/><path d="M120 190 V115 H180 V40" stroke="#FFB547" stroke-width="4" fill="none" stroke-dasharray="6 6"/></svg>`;
S.hpattern = () => `${bg("l8-classic")}
  ${note("H-pattern gearbox", "Classic cars, classic shifting", ["Cars from before the 1990s used a gear stick and a clutch pedal: clutch in, move the stick through the gate, clutch out.", "Miss a gear and you over-rev the engine. Blip the throttle on the way down for a smooth shift.", "Works with keyboard, controller or a wheel with a shifter. Auto clutch is an option."], "left:18px;top:18px", 420)}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">Gate</div>${gate}
    <div style="display:grid;gap:8px;margin-top:10px">${sl("Clutch", 0, "out")}${kv("Shift 3 → 4", `<span class="good">0.31 s · clean</span>`)}${kv("Missed shifts", "1")}</div>
    <div class="lbl2" style="margin:10px 0 6px">Clutch</div>${tg(["Manual", "Auto clutch"], 0)}`)}
  ${hb([gear(4, 241), t2("Clutch out", "8,400 rpm"), t2("1998 car", "H-pattern on")])}
  ${concept("Concept render · H-pattern gearbox")}`;

// 7 · licence penalty points
S.licence = () => top("Career · <b>Super licence</b>", `<span class="chip">Season 2</span>`, "s-defend") + `
  <div class="grid" style="grid-template-columns:1fr 1.2fr;height:727px">
    <div class="panel" style="display:grid;gap:14px;align-content:start"><div style="border-radius:14px;padding:18px;background:linear-gradient(135deg,#1F2A40,#141A26);box-shadow:inset 0 0 0 1px #3A4A66"><div class="row" style="justify-content:space-between"><b style="font:700 14px B;letter-spacing:.14em;color:#7FC4FF">RACELIMIT · SUPER LICENCE</b><span class="mono muted">#27</span></div>
      <div class="row" style="gap:16px;margin-top:14px"><svg width="84" height="100" viewBox="0 0 84 100"><rect width="84" height="100" rx="8" fill="#2A3346"/><path d="M14 70 Q12 26 44 22 Q74 22 72 58 L72 74 Q54 80 14 74 Z" fill="#FFA51F"/><path d="M30 46 H70 V60 H34 Q28 54 30 46 Z" fill="#10141C"/><path d="M14 66 Q40 70 72 66" stroke="#16171B" stroke-width="5" fill="none"/></svg><div><b style="font:700 30px BC">KIRI</b><div class="muted">RACELIMIT · Grand Prix</div><div class="muted mono" style="font-size:12px">valid to Dec 2027</div></div></div></div>
      <div><div class="row" style="justify-content:space-between"><b>Penalty points</b><b class="mono acc">7 / 12</b></div><div style="display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-top:8px">${Array.from({ length: 12 }, (_, i) => `<i style="height:22px;border-radius:4px;background:${i < 7 ? (i < 5 ? "#FFB547" : "#FF8A3A") : "#2A2F3B"}"></i>`).join("")}</div>
      <div class="muted" style="font:600 12px B;margin-top:8px">12 points within a year = a one-race ban. Points drop off after 12 months.</div></div></div>
    <div class="panel"><h2>Points on your licence</h2><table><tr><th>Race</th><th>What happened</th><th class="r">Points</th><th>Expires</th></tr>${[["Monza", "Collision with BRD, Turn 1", "2", "Sep 2027"], ["Zandvoort", "Track limits, 3rd time", "1", "Aug 2027"], ["Baku", "Unsafe rejoin", "2", "Sep 2027"], ["Spa", "Impeding in Q2", "2", "Jul 2027"]].map(([a, b, c, d]) => `<tr><td>${a}</td><td>${b}</td><td class="r mono acc">+${c}</td><td class="muted">${d}</td></tr>`).join("")}</table>
      <div class="card2" style="margin-top:14px;box-shadow:inset 0 0 0 1px #FF8A3A"><b style="color:#FF8A3A">Careful:</b> <span class="muted">5 more points before the ban. Your team boss has noticed.</span></div>
      <div class="lbl2" style="margin:14px 0 6px">Penalty points</div>${tg(["Real", "Off"], 0)}</div>
  </div>${concept("Concept render · licence penalty points")}`;

// 8 · pre-season testing
S.testing = () => `${bg("l8-testing")}
  ${note("Pre-season testing", "Three days to learn the new car", ["Before the season, every team tests at one circuit. Run your plan: reliability laps, setup tests, a few fast laps.", "The other teams hide their real pace: some run heavy fuel, some show off. The timesheet doesn't tell the whole story.", "Testing cars wear camouflage liveries."], "left:18px;top:18px", 420)}
  ${box("right:18px;top:18px", 340, `<div class="lbl2" style="margin-bottom:8px">Day 2 · timesheet</div><table>${[["1", "VORTEX", "1:31.2", "?"], ["2", "AXIOM", "1:31.6", ""], ["3", "YOU", "1:31.9", ""], ["4", "VELOCE", "1:32.4", "?"]].map(([p, t, l, q]) => `<tr${t === "YOU" ? ` style="background:#1E1A12"` : ""}><td class="mono">${p}</td><td>${t}</td><td class="r mono">${l}</td><td class="acc">${q}</td></tr>`).join("")}</table><div class="muted" style="font:600 11px B;margin-top:4px">? = engineer thinks they're hiding pace</div>
    <div class="lbl2" style="margin:12px 0 6px">Today's plan</div><div style="display:grid;gap:5px;font:600 13px B">${[["✓", "Reliability · 60 laps"], ["✓", "Aero tests · 12 laps"], ["▶", "Race sim · 25 laps"], ["", "Low-fuel run"]].map(([a, b]) => `<div><span class="acc">${a || "·"}</span> ${b}</div>`).join("")}</div>`)}
  ${concept("Concept render · pre-season testing")}`;

// 9 · pit crew training
S.crewtraining = () => `${bg("l8-crew")}
  ${note("Pit crew training", "A faster crew, without playing the stop", ["Your crew gets quicker with practice sessions and better staff. You choose how much to train them between races.", "Tired crews make more mistakes: a stuck wheel nut costs seconds. (The pit stop mini-game stays an optional setting.)"], "left:18px;top:18px", 400)}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">Crew</div><div style="display:grid;gap:8px">${sl("Speed", 72, "2.4 s")}${sl("Consistency", 60, "good")}${sl("Fitness", 45, "tired")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Average stop this season</div>${chart(300, 70, [{ pts: [0.3, 0.38, 0.45, 0.5, 0.55, 0.62, 0.66, 0.7], c: "#6EE7A8" }])}
    <div class="lbl2" style="margin:12px 0 6px">This week</div>${tg(["Rest", "Light practice", "Hard practice"], 1)}`)}
  <div class="hudbox" style="left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:14px;align-items:center"><b style="font:700 18px BC">PRACTICE STOP</b><b class="mono good" style="font-size:28px">2.28 s</b><span class="muted" style="font:600 12px B">best this week</span></div>
  ${concept("Concept render · pit crew training")}`;

// 10 · adaptive AI
S.adaptive = () => `${bg("s-tow")}
  ${note("Adaptive AI", "Close racing at any skill level", ["The AI quietly adjusts to your pace, so there's always someone to race, whether you're new or fast.", "It doesn't cheat or teleport: it just drives a little faster or slower overall.", "Optional, and always off in ranked challenges and time trials."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 360, `<div class="lbl2" style="margin-bottom:8px">AI pace vs yours · last 10 laps</div>${chart(330, 110, [{ pts: [0.5, 0.52, 0.55, 0.5, 0.48, 0.52, 0.55, 0.57, 0.56, 0.58], c: "#FFB547" }, { pts: [0.3, 0.38, 0.45, 0.48, 0.5, 0.52, 0.54, 0.56, 0.57, 0.58], c: "#7FC4FF", dash: "6 4" }])}
    <div class="row" style="gap:14px;font:600 12px B;margin-top:6px"><span class="acc">— you</span><span class="blue">- - AI pack</span></div>
    <div style="display:grid;gap:8px;margin-top:10px">${sl("AI level now", 64, "64")}${kv("Mode", "Adaptive")}</div>
    <div class="lbl2" style="margin:10px 0 6px">AI difficulty</div>${tg(["Adaptive", "Fixed", "Custom"], 0)}`)}
  ${hb([gear(7, 284), t2("P4", "+0.6 to SLV"), t2("Pack", "within 3 s")])}
  ${concept("Concept render · adaptive AI")}`;

// 11 · animated driver
S.animdriver = () => `${bg("l8-driver")}
  ${pin(AA["l8-driver"], "helmet", `<div style="display:grid;gap:2px"><b style="font:600 13px B">Head leans into the corner</b><span class="muted" style="font:600 11px B">and glances at the mirrors on straights</span></div>`, { up: 110, dx: -120 })}
  ${pin(AA["l8-driver"], "wheel", `<div style="display:grid;gap:2px"><b style="font:600 13px B">Hands turn the wheel</b><span class="muted" style="font:600 11px B">thumbs press the buttons you use</span></div>`, { up: 80, dx: 150 })}
  ${note("Animated driver", "The driver moves like a real one", ["The steering wheel turns with your input and the hands go with it.", "The head tilts with the g-forces and looks into corners; the visor turns towards the mirror when a car is close.", "You see it in every camera: TV, onboard and replays."], "left:18px;top:18px", 400)}
  ${concept("Concept render · animated driver")}`;

// 12 · seasonal events
S.seasonal = () => top("Events · <b>Seasonal</b>", `<span class="chip">New event every few weeks</span>`, "l8-halloween") + `
  <div class="grid" style="grid-template-columns:repeat(3,1fr);height:727px">
    ${[["l8-halloween", "", "Halloween night race", "31 Oct – 7 Nov", "Singapore after dark, pumpkins on the barriers, an orange-and-black livery for finishing.", 1], ["l8-festive", "", "Festive liveries", "December", "Red, white and green liveries, a frosty Silverstone and a snowy podium.", 0], ["s-haze", "saturate(1.2) sepia(.2)", "Summer heat special", "January", "Hottest track of the year: tyres and brakes on the edge, drink button on.", 0]].map(([img, flt, a, d, b, on]) => `<div class="panel" style="padding:0;overflow:hidden;${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><div style="height:330px;background:url(bg/${img}.png) center/cover;filter:${flt}"></div><div style="padding:12px 16px"><div class="row" style="justify-content:space-between"><b style="font:700 22px BC">${a}</b><span class="chip">${d}</span></div><div class="muted" style="margin-top:4px">${b}</div>${on ? `<span class="btn primary" style="margin-top:10px">Race now · 6 days left</span>` : ""}</div></div>`).join("")}
    <div class="panel" style="grid-column:span 3;display:grid;grid-template-columns:1.4fr 1fr;gap:24px"><div><h2>Event rewards</h2><div class="row" style="flex-wrap:wrap">${["Pumpkin livery", "Night helmet", "Halloween card (legend)", "Trophy"].map((x) => `<span class="chip">🎃 ${x}</span>`).join("")}</div></div><div><h2>Your progress</h2>${sl("Event points", 60, "60 / 100")}</div></div>
  </div>${concept("Concept render · seasonal events")}`;

// 13 · cruise mode
S.cruise = () => `${bg("l8-cruise")}
  ${pin(AA["l8-cruise"], "car", `${pill("PARKED", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">no timing, no rules</span>`, { up: 60 })}
  ${note("Cruise mode", "Just drive", ["Any circuit, no session, no timing. Drive slowly, stop where you like, go the wrong way, take photos.", "Alone, or with friends in the same room code.", "A good way to learn a new circuit."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:6px">Cruise</div><div style="display:grid;gap:6px;font:600 13px B"><div>${key("P")} photo mode</div><div>${key("C")} change camera</div><div>${key("T")} time of day</div><div>${key("R")} back on track</div></div><div class="lbl2" style="margin:10px 0 6px">Others</div>${tg(["Alone", "Friends (room code)"], 0)}`)}
  ${concept("Concept render · cruise mode")}`;

// 14 · drivers' parade
S.parade = () => `${bg("l8-parade")}
  ${pin(AA["l8-parade"], "truck", `${pill("DRIVERS' PARADE", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">1 h 50 min before the start</span>`, { up: 50 })}
  ${note("Drivers' parade", "A lap of the circuit to wave to the fans", ["About two hours before the race, all the drivers ride round the circuit on an open truck, waving to the grandstands.", "The camera follows the truck, cuts to fans and to quick TV interviews on the back of it.", "Different vehicle each year: open truck, classic open-top cars, or tiny parade buggies."], "left:18px;top:18px", 420)}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">Race day</div><div style="display:grid;gap:6px">${[["12:10", "Drivers' parade", 1], ["13:30", "Pit lane opens", 0], ["13:45", "Grid walk", 0], ["13:56", "Anthem", 0], ["14:03", "Formation lap", 0]].map(([t, a, on]) => `<div class="row" style="justify-content:space-between;${on ? "color:#FFB547" : ""}"><b class="mono">${t}</b><span style="font:600 13px B">${a}</span></div>`).join("")}</div>
    <div class="lbl2" style="margin:10px 0 6px">Parade vehicle</div>${tg(["Open truck", "Classic cars", "Parade buggies"], 0)}<div class="lbl2" style="margin:10px 0 6px">Show</div>${tg(["Full", "Short", "Skip"], 0)}`)}
  ${concept("Concept render · drivers' parade")}`;

mount(S);
export default S;

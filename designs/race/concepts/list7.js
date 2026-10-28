import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, tag, drv, chart, trackSvg, mount, TEAMS, A, pin } from "./common.js";
const AA = {};
await Promise.all(["l7-stack", "l7-restart", "l7-karts", "l7-flypast", "l7-crane", "l7-ghost", "l7-swap"].map(async (n) => (AA[n] = await A(n))));

const S = {};
const key = (k) => `<span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">${k}</span>`;
const sil = [[18, 70], [12, 42], [20, 22], [40, 14], [60, 18], [74, 10], [90, 20], [88, 40], [74, 50], [80, 66], [64, 80], [40, 84], [26, 80]];

// 1 · double-stacking
S.doublestack = () => `${bg("l7-stack")}
  ${pin(AA["l7-stack"], "a", `${pill("MAX · IN THE BOX", "#14361F", "#6EE7A8")} <span class="muted" style="font:600 12px B">2.3 s stop</span>`, { up: 60, dx: 80 })}
  ${pin(AA["l7-stack"], "b", `${pill("YOU · WAITING", "#2A1A10", "#FFB060")} <span class="muted" style="font:600 12px B">+3.1 s lost</span>`, { up: 70, dx: -80 })}
  ${note("Double-stacking", "Both cars in on the same lap", ["When a safety car comes out, both team cars often pit together. The second car waits behind the first, so it loses a few seconds, but still gains on everyone who stayed out.", "Arrive too close and you wait longer; leave a gap and you might not need to stop at all."], "left:18px;top:18px", 420)}
  ${box("right:18px;top:18px", 320, `<div class="lbl2" style="margin-bottom:8px">Pit wall</div><div class="card2" style="box-shadow:inset 0 0 0 1px #FFB547"><b class="acc">Engineer:</b> "Safety car. Double stack, you're second. Leave 2 seconds to Max."</div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Max stop", "2.3 s")}${kv("Your wait", "3.1 s")}${kv("Rejoin", "P5 (from P4)")}</div>`)}
  ${concept("Concept render · double-stacking")}`;

// 2 · fastest-lap gamble
S.fastestlap = () => `${bg("l7-yas")}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);width:620px;padding:12px 16px"><div class="row"><span class="pill" style="background:#2A1840;color:#C9A0FF;font-size:13px">FASTEST LAP GAMBLE</span><span class="muted" style="margin-left:auto;font:600 12px B">3 laps to go</span></div>
    <div style="font:600 17px/1.4 B;margin:8px 0">You're 24 s clear of the car behind. Stop for new softs and chase the extra point?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="card2" style="box-shadow:inset 0 0 0 2px #FFB547"><b>${key("1")} Box for softs</b><div class="good" style="font:600 12px B">rejoin P5 with 2.5 s spare · +1 point if it works</div></div><div class="card2"><b>${key("2")} Stay out</b><div class="muted" style="font:600 12px B">safe P5 · fastest lap stays with BRD</div></div></div></div>
  ${note("Fastest-lap gamble", "Risk a place for a bonus point", ["Late in the race, if there's a big enough gap behind, stop for fresh soft tyres and go for the fastest lap.", "Get it right and you score an extra point; misjudge the gap or traffic and you lose a place."], "left:18px;top:180px", 400)}
  ${box("right:18px;top:180px", 300, `<div class="lbl2" style="margin-bottom:8px">Fastest lap</div>${kv("Now", "1:26.410 · BRD")}${kv("New softs here", `<span style="color:#C9A0FF">~1:25.9</span>`)}<div class="lbl2" style="margin:10px 0 6px">This lap</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;text-align:center;font:600 12px B">${[["S1", "purple"], ["S2", "purple"], ["S3", "—"]].map(([a, b]) => `<div class="card2" style="padding:6px 0;${b === "purple" ? "background:#2A1840;color:#C9A0FF" : ""}">${a}<div class="mono" style="font-size:11px">${b === "purple" ? "best" : "…"}</div></div>`).join("")}</div>`)}
  ${hb([gear(7, 284), t2(`Delta <span class="mono" style="color:#C9A0FF">−0.42</span>`, "to the fastest lap"), t2("Soft · new", "lap 1 of 3")])}
  ${concept("Concept render · fastest-lap gamble")}`;

// 3 · safety car restarts
S.restart = () => `${bg("l7-restart")}
  ${pin(AA["l7-restart"], "you", `${pill("YOU · LEADER", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">you choose when to go</span>`, { up: 80, dx: -60 })}
  ${pin(AA["l7-restart"], "pack", `${pill("PACK BUNCHED UP", "#1C2230", "#E8EAF0")}`, { up: 60, dx: 60 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);text-align:center;padding:10px 22px"><div class="lbl2" style="color:#6EE7A8">Safety car in this lap</div><b style="font:700 28px BC">RESTART · YOU CONTROL THE PACE</b></div>
  ${note("Safety car restarts", "Time your jump", ["The safety car pulls in and the leader sets the pace until the line. Back the pack up, then go early (or late) to catch them out.", "Behind, watch the car ahead: too close and you might crash into them; too far and you lose the tow."], "left:18px;top:130px", 400)}
  ${box("right:18px;top:130px", 280, `<div class="lbl2" style="margin-bottom:8px">Restart</div>${kv("To the line", "620 m")}${kv("Gap behind", "0.4 s")}<div class="muted" style="font:600 12px B;margin-top:8px">No overtaking before the line. You can't brake hard (that's a penalty).</div>`)}
  ${hb([gear(3, 92), t2("Restart", `go with ${key("↑")}`), t2("P1", "BRD 0.4 s behind")])}
  ${concept("Concept render · safety car restarts")}`;

// 4 · hot races
S.hot = () => `${bg("l7-hot", "saturate(1.1) sepia(.15)")}<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%,rgba(255,120,40,.18),transparent 60%)"></div>
  ${note("Hot races", "Stay cool, stay sharp", ["At Singapore and Qatar the cockpit gets above 50 °C.", "Press the drink button on the straights. Forget to drink and late in the race your reactions get slower and the screen edges blur a little.", "Cooling also matters for the car: open more bodywork, lose a little speed."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 320, `<div class="lbl2" style="margin-bottom:8px">Driver</div><div style="display:grid;gap:10px">${[["Cockpit", "52 °C", 90, "#FF8A3A"], ["Drink left", "0.6 L", 45, "#5AA9FF"], ["Hydration", "OK", 70, "#6EE7A8"]].map(([a, b, v, c]) => `<div><div class="kv"><span>${a}</span><b style="color:${c}">${b}</b></div><div style="height:6px;border-radius:3px;background:#2A2F3B;margin-top:4px"><i style="display:block;height:100%;width:${v}%;background:${c};border-radius:3px"></i></div></div>`).join("")}</div>
    <div class="card2" style="margin-top:10px"><b>${key("D")} drink</b> <span class="muted" style="font:600 12px B">use it on the straights</span></div>`)}
  ${hb([gear(8, 308), t2(`Cockpit <span class="mono" style="color:#FF8A3A">52°</span>`, "Lusail · lap 34"), t2("Reactions", "normal")])}
  ${concept("Concept render · hot races")}`;

// 5 · karting start
S.karting = () => `${bg("l7-karts")}
  ${pin(AA["l7-karts"], "you", `${pill("YOU · AGE 12", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">kart championship · round 3</span>`, { up: 70, dx: 60 })}
  ${note("Karting start", "Every career starts in karts", ["Career mode begins in made-up kart championships: tiny, twitchy, no gears, flat out.", "Win races to get noticed and move up to the junior single-seaters.", "Karts use the circuits' short layouts, and there are three made-up kart tracks too."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">Your path</div><div style="display:grid;gap:6px">${[["Karts", "now", "#FFB547"], ["Formula RL3", "next", "#9AA3B2"], ["Formula RL2", "", "#6B7383"], ["Grand Prix", "", "#6B7383"]].map(([a, b, c]) => `<div class="row" style="justify-content:space-between"><b style="color:${c}">${a}</b><span class="muted" style="font:600 12px B">${b}</span></div>`).join("")}</div>`)}
  ${hb([`<div style="display:flex;gap:10px;align-items:end"><span style="font:700 46px/0.8 BC;color:#FFB547">P2</span><div><div class="mono" style="font-size:22px">94</div><div class="lbl2">km/h</div></div></div>`, t2("Kart final", "lap 6 of 12"), t2("+0.3", "to the leader")])}
  ${concept("Concept render · karting start")}`;

// 6 · paddock walk
S.paddock = () => `${bg("l7-paddock")}
  ${note("Paddock walk", "Explore between sessions", ["Walk the paddock behind the garages: team motorhomes, mechanics, other drivers.", "Talk to people for small things: a rival's mood, a tip from your engineer, a sponsor event.", "Optional: skip straight to the next session."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:6px">Nearby</div><div style="display:grid;gap:6px;font:600 13px B"><div>${key("E")} talk to BRD (VELOCE)</div><div>${key("E")} sponsor event · NORTHWIND</div><div>${key("E")} your engineer</div></div><div class="lbl2" style="margin:10px 0 6px">Next session</div>${kv("FP3", "in 1 h 40 min")}`)}
  ${concept("Concept render · paddock walk")}`;

// 7 · choose your engineer
const face = (skin, hair, mouth) => `<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" fill="#1A1E27"/><circle cx="60" cy="56" r="30" fill="${skin}"/><path d="M30 50 Q60 10 90 50 Q80 30 60 28 Q40 30 30 50 Z" fill="${hair}"/><circle cx="49" cy="56" r="3.5" fill="#1A1C22"/><circle cx="71" cy="56" r="3.5" fill="#1A1C22"/><path d="${mouth}" stroke="#1A1C22" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M28 112 Q60 84 92 112" fill="#FFA51F"/><rect x="24" y="44" width="10" height="20" rx="4" fill="#2A2F3B"/><path d="M29 64 Q34 78 48 76" stroke="#2A2F3B" stroke-width="3" fill="none"/></svg>`;
S.engineer = () => top("Team · <b>Choose your engineer</b>", "", "l7-stack") + `
  <div class="grid" style="grid-template-columns:repeat(3,1fr);height:727px">
    ${[["Sam", "Calm", face("#E0B08A", "#3A2A1C", "M50 70 Q60 74 70 70"), "Short, quiet messages. Only talks when it matters.", "\"Gap 1.2. Box this lap. Box.\"", 0], ["Rosa", "Chatty", face("#C68A60", "#1A1C22", "M48 68 Q60 80 72 68"), "Lots of info and encouragement, explains the why.", "\"Great sector! BRD's tyres are fading, he's lost three tenths, keep pushing.\"", 1], ["Jonas", "Blunt", face("#F0C8A0", "#8A6A3A", "M50 72 L70 72"), "Straight to the point, tells you when you mess up.", "\"You lost half a second at Turn 4. Again.\"", 0]].map(([n, st, f, d, ex, on]) => `<div class="panel" style="${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""};display:grid;gap:10px;justify-items:start;align-content:start"><div class="row" style="gap:14px">${f}<div><b style="font:700 32px BC">${n}</b><div><span class="pill" style="background:#1C2230;color:#FFB547">${st.toUpperCase()}</span></div></div></div><div class="muted">${d}</div><div class="card2" style="width:100%"><div class="lbl2">Sounds like</div><div style="font:600 14px/1.45 B;margin-top:4px">${ex}</div></div><span class="btn">▶ Play a sample</span></div>`).join("")}
    <div class="panel" style="grid-column:span 3;display:grid;grid-template-columns:repeat(3,1fr);gap:24px"><div><div class="lbl2" style="margin-bottom:6px">How often they talk</div>${tg(["Only important", "Normal", "Lots"], 1)}</div><div><div class="lbl2" style="margin-bottom:6px">Voice</div>${tg(["Spoken", "Text only"], 0)}</div><div><div class="lbl2" style="margin-bottom:6px">Radio effect</div>${tg(["Crackly radio", "Clean"], 0)}</div></div>
  </div>${concept("Concept render · choose your engineer")}`;

// 8 · race-day newspaper
S.newspaper = () => `${bg("s-crowd", "blur(10px) brightness(.3)")}
  <div style="position:absolute;left:50%;top:40px;transform:translateX(-50%) rotate(-1.2deg);width:1000px;height:800px;background:#EDE8DC;color:#16171B;box-shadow:0 20px 60px rgba(0,0,0,.6);padding:28px 36px;font-family:Georgia,'Times New Roman',serif">
    <div style="display:flex;justify-content:space-between;font:600 13px Georgia;border-bottom:2px solid #16171B;padding-bottom:6px"><span>Monday 12 October</span><span>THE PADDOCK POST</span><span>Race edition</span></div>
    <div style="font:700 64px/1.02 Georgia;margin:14px 0 8px;letter-spacing:-.01em">KIRI STUNS SINGAPORE WITH FIRST WIN</div>
    <div style="font:italic 20px Georgia;color:#3A3A3A;margin-bottom:12px">Rookie holds off Brandt under the lights after a bold safety-car call</div>
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:22px"><div><div style="height:330px;background:url(bg/l6-donuts.png) center/cover;filter:grayscale(.15)"></div><div style="font:italic 13px Georgia;color:#555;margin-top:4px">Kiri celebrates on the main straight. Photo: RaceLimit</div></div>
      <div style="font:15px/1.5 Georgia;column-count:1"><p style="margin:0 0 10px"><b>MARINA BAY</b> — The RACELIMIT driver pitted under the lap-31 safety car while the leaders stayed out, and never looked back.</p><p style="margin:0 0 10px">"I just kept it off the walls," Kiri said. Brandt was less pleased: "He moved twice into Turn 7. The stewards should look at it."</p>
        <div style="border-top:1px solid #16171B;border-bottom:1px solid #16171B;padding:8px 0;margin:10px 0;font:700 15px Georgia">RESULT: 1 Kiri · 2 Brandt +1.8 s · 3 Okafor +6.0 s</div>
        <p style="margin:0">Inside: Is VELOCE's tyre problem back? · Paddock gossip: who's moving to AXIOM?</p></div></div></div>
  ${note("Race-day newspaper", "The headlines, after every race", ["In career mode, a made-up newspaper writes up each race: big headline, photo, quotes from you and your rival.", "What you said in the interview and how you raced change the story."], "left:18px;bottom:18px", 360)}
  ${concept("Concept render · race-day newspaper")}`;

// 9 · season review
S.review = () => top("Season 2 · <b>Your year in review</b>", `<span class="btn primary">▶ Play highlights · 3:20</span>`, "s-podium") + `
  <div class="grid" style="grid-template-columns:1.3fr 1fr;height:727px">
    <div class="panel"><h2>Best moments</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${[["l6-donuts", "First win · Singapore"], ["s-ticker", "Pass of the year · Stowe"], ["s-weather", "Wet podium · Spa"], ["s-broadcast", "Last-lap battle · Spa"]].map(([img, t]) => `<div style="border-radius:10px;overflow:hidden;background:#1A1E27"><div style="height:150px;background:url(bg/${img}.png) center/cover;position:relative"><span style="position:absolute;left:8px;bottom:8px" class="pill">▶</span></div><div style="padding:8px 10px;font:600 14px B">${t}</div></div>`).join("")}</div></div>
    <div style="display:grid;gap:16px;align-content:start"><div class="panel"><h2>Season stats</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${[["Finish", "P4"], ["Wins", "2"], ["Podiums", "6"], ["Poles", "3"], ["Points", "214"], ["Overtakes", "47"]].map(([a, b]) => `<div class="card2"><div class="lbl2">${a}</div><b class="big mono">${b}</b></div>`).join("")}</div></div>
      <div class="panel"><h2>Points through the year</h2>${chart(470, 120, [{ pts: [0.02, 0.08, 0.15, 0.2, 0.3, 0.38, 0.42, 0.55, 0.62, 0.7, 0.78, 0.86, 0.94], c: "#FFB547" }, { pts: [0.05, 0.12, 0.2, 0.3, 0.38, 0.45, 0.55, 0.6, 0.66, 0.72, 0.78, 0.82, 0.88], c: "#C8102E", dash: "6 4" }])}<div class="row" style="gap:14px;font:600 12px B;margin-top:6px"><span class="acc">— you</span><span style="color:#FF8A8A">- - your rival BRD</span></div></div>
      <div class="panel"><h2>Awards</h2><div class="row" style="flex-wrap:wrap">${["Driver of the day ×3", "Best start", "Most improved"].map((x) => `<span class="chip">🏆 ${x}</span>`).join("")}</div></div></div>
  </div>${concept("Concept render · end-of-season review")}`;

// 10 · pre-race flypast
S.flypast = () => `${bg("l7-flypast")}
  ${pin(AA["l7-flypast"], "jets", `${pill("FLYPAST", "#10213A", "#7FC4FF")} <span class="muted" style="font:600 12px B">a made-up display team</span>`, { up: -70 })}
  ${note("Pre-race flypast", "Look up before the anthem", ["A few minutes before the anthem, a display team flies low over the grid trailing coloured smoke.", "The camera tilts up from the grid as the jets roar overhead. Skip it any time."], "left:18px;bottom:18px", 400)}
  ${concept("Concept render · pre-race flypast")}`;

// 11 · crane recovery
S.crane = () => `${bg("l7-crane")}
  ${pin(AA["l7-crane"], "car", `${pill("DEL · OUT", "#3A1218", "#FF8A8A")} <span class="muted" style="font:600 12px B">lifted over the barrier</span>`, { up: 70, dx: 90 })}
  ${note("Crane recovery", "Clearing up after a crash", ["After a crash, marshals hook the car to a crane and lift it over the barrier. Others sweep the gravel and debris off the track.", "A yellow flag (or a safety car) covers the sector until they're done.", "If it's you, you watch from the side of the track."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Sector 1</div><div class="row"><i style="width:28px;height:20px;border-radius:3px;background:#F2C230"></i><b>Double yellow</b></div><div style="display:grid;gap:6px;margin-top:8px">${kv("Recovery", "about 1 lap")}${kv("Then", "green")}</div>`)}
  ${concept("Concept render · crane recovery")}`;

// 12 · scenario editor
S.scenario = () => top("Challenges · <b>Scenario editor</b>", `<span class="btn primary">Test drive</span>`, "s-ticker") + `
  <div class="grid" style="grid-template-columns:1fr 1.25fr;height:727px">
    <div class="panel"><h2>Silverstone · 8 laps to go</h2><div style="display:grid;place-items:center;height:330px;background:#0E1117;border-radius:10px">${trackSvg(sil, 420, 290, { extra: [[60, 18, "#16245C"], [66, 15, "#C8102E"], [72, 12, "#FFA51F"], [88, 32, "#16B8A6"]].map(([x, y, c]) => `<circle cx="${x * 4.2}" cy="${y * 2.9}" r="9" fill="${c}" stroke="#0B0D12" stroke-width="2"/>`).join("") })}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px"><div><div class="lbl2" style="margin-bottom:4px">Weather</div>${tg(["Dry", "Damp", "Wet", "Rain coming"], 3)}</div><div style="align-self:end">${sl("Laps left", 30, "8")}</div></div></div>
    <div class="panel"><h2>The grid</h2><table><tr><th>P</th><th>Car</th><th class="r">Gap</th><th>Tyres</th><th>Note</th></tr>
      ${[["1", "OKA", "AXIOM", "—", "H 30", ""], ["2", "BRD", "VELOCE", "+0.8", "H 31", "defends hard"], ["3", "YOU", "RACELIMIT", "+1.6", "S 4", "just pitted"], ["4", "SLV", "NOVA", "+9.0", "M 12", ""]].map(([p, c, t, g, ty, n2]) => `<tr${c === "YOU" ? ` style="background:#1E1A12"` : ""}><td class="mono">${p}</td><td><i style="display:inline-block;width:4px;height:14px;background:${TEAMS[t]};margin-right:6px;vertical-align:middle"></i><b>${c}</b></td><td class="r mono">${g}</td><td class="mono">${ty}</td><td class="muted">${n2}</td></tr>`).join("")}</table>
      <div class="lbl2" style="margin:14px 0 6px">Goal</div>${tg(["Win", "Podium", "Finish ahead of BRD", "Custom"], 0)}
      <div class="lbl2" style="margin:14px 0 6px">Share code</div><div class="card2 mono" style="font-size:22px;color:#FFB547;letter-spacing:.06em">SCN-SIL-8L-R4KQ</div>
      <div class="muted" style="font:500 13px B;margin-top:8px">Anyone can paste the code to try your scenario. The best results are listed together.</div></div>
  </div>${concept("Concept render · scenario editor")}`;

// 13 · hot-seat
S.hotseat = () => `${bg("l7-ghost")}
  ${pin(AA["l7-ghost"], "ghost", `${pill("SAM'S LAP · 1:46.902", "#10213A", "#7FC4FF")}`, { up: 60, dx: 80 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);text-align:center;padding:12px 26px"><div class="lbl2 acc">Hot-seat · round 2 of 3</div><b style="font:700 30px BC">LEO'S TURN</b><div class="muted" style="font:600 13px B">beat Sam's ghost · pass the keyboard on after this lap</div></div>
  ${note("Hot-seat", "Take turns on one computer", ["Friends take turns: each driver races the ghost of the best lap so far.", "Scores are kept round by round, with a results screen at the end."], "left:18px;top:140px", 360)}
  ${box("right:18px;top:140px", 280, `<div class="lbl2" style="margin-bottom:8px">Standings</div><table>${[["Sam", "1:46.902", "🥇"], ["Kiri", "1:47.315", ""], ["Leo", "on track", ""], ["Ana", "next", ""]].map(([a, b, c]) => `<tr><td>${a} ${c}</td><td class="r mono">${b}</td></tr>`).join("")}</table>`)}
  ${hb([gear(8, 301), t2(`Delta <span class="mono good">−0.12</span>`, "to Sam"), t2("Leo", "lap 2")])}
  ${concept("Concept render · hot-seat")}`;

// 14 · driver-swap relay
S.relay = () => `${bg("l7-swap")}
  ${pin(AA["l7-swap"], "out", `${pill("KIRI OUT", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">stint 2 done</span>`, { up: 60, dx: 60 })}
  ${pin(AA["l7-swap"], "in", `${pill("SAM IN", "#10213A", "#7FC4FF")}`, { up: 50, dx: -60 })}
  ${note("Driver-swap relay", "Share a car, hand over at the stops", ["Friends share one car in an endurance race. At each pit stop the next driver takes over (online or passing the controller).", "Every driver's laps are tracked, so you can see who's fastest on the team."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">Team KIRI · 50% race</div><table>${[["Stint 1", "Sam", "1:29.4"], ["Stint 2", "Kiri", "1:29.1"], ["Stint 3", "Sam", "now"], ["Stint 4", "Leo", ""]].map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td class="r mono">${c}</td></tr>`).join("")}</table>`)}
  ${concept("Concept render · driver-swap relay")}`;

// 15 · install as an app
S.installapp = () => `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#1A2A44,#2A1A3A 60%,#3A2410)"></div>
  <div style="position:absolute;left:40px;top:40px;display:grid;gap:22px">${[["RL", "#FFA51F", "RaceLimit Race"], ["RL", "#16171B", "RaceLimit Live"], ["📁", "#5A6A88", "Documents"]].map(([i, c, n]) => `<div style="display:grid;justify-items:center;gap:6px;width:90px"><div style="width:62px;height:62px;border-radius:14px;background:${c};display:grid;place-items:center;font:700 24px BC;color:${c === "#16171B" ? "#FFB547" : "#16171B"};box-shadow:0 6px 16px rgba(0,0,0,.4)">${i}</div><span style="font:600 12px B;text-shadow:0 1px 3px #000">${n}</span></div>`).join("")}</div>
  <div style="position:absolute;left:260px;top:90px;width:1080px;height:620px;border-radius:12px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);background:#0B0D12">
    <div class="row" style="height:38px;padding:0 14px;background:#161A22"><b style="font:600 13px B">RaceLimit Race</b><span class="muted" style="margin-left:auto;font:600 13px B">—  ▢  ✕</span></div>
    <div style="position:relative;height:582px;background:url(bg/l7-yas.png) center/cover"><div class="hudbox" style="left:50%;top:50%;transform:translate(-50%,-50%);width:440px;padding:20px"><b style="font:700 26px BC">Playing offline</b><div class="muted" style="font:500 14px B;margin-top:6px">All circuits you've opened before are saved on this computer. Online features come back when you're connected.</div><div style="display:grid;gap:6px;margin-top:12px">${kv("Saved circuits", "12 of 24")}${kv("Space used", "380 MB")}</div></div></div></div>
  <div class="hudbox" style="right:40px;top:40px;width:340px;padding:16px"><div class="row"><div style="width:44px;height:44px;border-radius:10px;background:#FFA51F;display:grid;place-items:center;font:700 18px BC;color:#16171B">RL</div><div><b>Install RaceLimit Race?</b><div class="muted" style="font:600 12px B">from kris-zhang-122507.github.io</div></div></div><div class="row" style="margin-top:12px"><span class="btn primary">Install</span><span class="btn">Not now</span></div></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:52px;background:rgba(14,17,23,.92);display:flex;gap:10px;align-items:center;justify-content:center">${["#5A6A88", "#FFA51F", "#16171B", "#2A6AB8"].map((c) => `<div style="width:36px;height:36px;border-radius:8px;background:${c};${c === "#FFA51F" ? "box-shadow:0 3px 0 -1px #FFB547" : ""}"></div>`).join("")}</div>
  ${note("Install as an app", "Play from your desktop, even offline", ["Install the game from the browser and it opens in its own window from the desktop or start menu, like any other game.", "Circuits you've played are saved, so it works without internet. Updates download by themselves."], "left:40px;bottom:80px", 400)}
  ${concept("Concept render · install as an app", "bottom:62px")}`;

// 16 · my races on the live timing site
const myrows = [["1", "OKA", "AXIOM", "Leader", "1:29.102", "M 18", "1"], ["2", "BRD", "VELOCE", "+1.8", "1:29.340", "H 9", "1"], ["3", "KIRI", "RACELIMIT", "+6.0", "1:29.011", "H 12", "1"], ["4", "SLV", "NOVA", "+9.4", "1:29.880", "M 20", "1"], ["5", "ISH", "KESTREL", "+14.2", "1:30.020", "H 6", "2"]];
S.myraces = () => `<div style="position:absolute;inset:0;background:#0B0D12"></div>
  <div class="top"><div class="brand">RACELIMIT<small>LIVE</small></div><div class="crumbs">My races · <b>Silverstone · 27 Oct</b></div><div class="sp"></div>${["Live", "Strategy", "Compare", "Replays", "My races"].map((t) => `<span class="chip" style="${t === "My races" ? "background:#2A2310;color:#FFB547" : ""}">${t}</span>`).join("")}</div>
  <div class="grid" style="grid-template-columns:1.5fr 1fr;height:836px;zoom:1;padding:18px 24px;align-content:start">
    <div class="panel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Race result · from the game</h2><span class="chip">52 laps · 1:28:41</span></div>
      <table><tr><th>P</th><th>Driver</th><th class="r">Gap</th><th class="r">Best</th><th>Tyre</th><th class="r">Stops</th></tr>${myrows.map(([p, c, t, g, b, ty, s]) => `<tr${c === "KIRI" ? ` style="background:#1E1A12"` : ""}><td class="mono">${p}</td><td><i style="display:inline-block;width:4px;height:14px;background:${TEAMS[t]};margin-right:6px;vertical-align:middle"></i><b>${c}</b></td><td class="r mono">${g}</td><td class="r mono" style="${c === "KIRI" ? "color:#C9A0FF" : ""}">${b}</td><td class="mono">${ty}</td><td class="r mono">${s}</td></tr>`).join("")}</table>
      <h2 style="margin:16px 0 6px">Your lap times</h2>${chart(880, 120, [{ pts: [0.3, 0.55, 0.6, 0.62, 0.6, 0.58, 0.2, 0.7, 0.72, 0.74, 0.73, 0.75, 0.76, 0.74], c: "#FFB547" }])}</div>
    <div style="display:grid;gap:16px;align-content:start"><div class="panel"><h2>Your battles</h2>${[["SLV", "passed at Stowe, lap 31", "#6EE7A8"], ["BRD", "1.8 s behind at the flag", "#FFB547"], ["ISH", "lost P3 at the stops, got it back", "#C3C9D4"]].map(([a, b, c]) => `<div class="row" style="margin-top:6px">${drv(a)}<span style="font:600 13px B;color:${c}">${b}</span></div>`).join("")}</div>
      <div class="panel"><h2>Earlier races</h2><table>${[["Silverstone", "27 Oct", "P3"], ["Monza", "24 Oct", "P1"], ["Spa", "20 Oct", "P5"]].map(([a, b, c]) => `<tr><td>${a}</td><td class="muted">${b}</td><td class="r mono">${c}</td></tr>`).join("")}</table><div class="muted" style="font:500 12px B;margin-top:8px">Saved in this browser. Open one to replay it with the circle of doom and the track map.</div></div></div>
  </div>${concept("Concept render · your game races on the live timing site")}`;

// 17 · mods folder
S.mods = () => top("Settings · <b>Mods</b>", `<span class="btn">Open the mods folder</span>`, "s-photo") + `
  <div class="grid" style="grid-template-columns:1fr 1.2fr;height:727px">
    <div class="panel"><h2>Installed</h2><div style="display:grid;gap:8px">${[["🏁", "Kiri's Ring", "circuit · Track Builder", 1, 1], ["🏁", "Night City", "circuit · from Sam", 1, 0], ["🎨", "Halloween RACELIMIT", "livery", 1, 0], ["🎨", "Old-school VELOCE", "livery · 1998 car", 0, 0], ["🔊", "V10 sound pack", "engine sound", 1, 0]].map(([i, a, b, on, sel]) => `<div class="card2 row" style="gap:12px;${sel ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><span style="font-size:22px">${i}</span><div style="flex:1"><b>${a}</b><div class="muted" style="font:600 12px B">${b}</div></div><span class="pill" style="background:${on ? "#14361F" : "#1C2230"};color:${on ? "#6EE7A8" : "#9AA3B2"}">${on ? "ON" : "OFF"}</span></div>`).join("")}</div>
      <div class="card2" style="margin-top:12px;border:2px dashed #3A4150;text-align:center;padding:18px"><b>Drop a file here</b><div class="muted" style="font:600 12px B">.track.json · .livery.json · sound packs</div></div></div>
    <div class="panel"><h2>Kiri's Ring</h2><div style="height:300px;border-radius:10px;background:#0E1117;display:grid;place-items:center">${trackSvg([[10, 80], [10, 30], [24, 12], [50, 12], [56, 30], [72, 26], [90, 34], [92, 64], [74, 72], [60, 60], [44, 74], [30, 88]], 480, 250, { c: "#FFB547", wd: 14, wd2: 4 })}</div>
      <div style="display:grid;gap:6px;margin-top:12px">${kv("Made with", "Track Builder")}${kv("Length", "4.3 km · 14 corners")}${kv("Checked", `<span class="good">✓ safe to load (data only, no code)</span>`)}</div>
      <div class="muted" style="font:500 13px B;margin-top:10px">Mods are data files only: circuits, liveries and sounds. They can't run code, so they're safe to share.</div>
      <div class="row" style="margin-top:12px"><span class="btn primary">Race here</span><span class="btn">Share code</span><span class="btn">Remove</span></div></div>
  </div>${concept("Concept render · mods folder")}`;

mount(S);
export default S;

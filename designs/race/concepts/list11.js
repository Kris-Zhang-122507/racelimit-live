import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, drv, chart, mount, TEAMS, A, pin } from "./common.js";
const AA = {};
await Promise.all(["l11-fireup", "l11-install", "l11-flap", "l11-wave", "l11-support", "l11-drones", "l11-lines", "l11-cooldown", "l11-walk", "l11-record", "l11-rebuild", "l11-corner", "l11-doc", "l11-factory", "l11-ice"].map(async (n) => (AA[n] = await A(n))));

const S = {};
const key = (k) => `<span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">${k}</span>`;
const chk = (items) => `<div style="display:grid;gap:7px;font:600 13px B">${items.map(([a, on, b]) => `<div class="row" style="justify-content:space-between"><span class="row"><span class="dot" style="background:${on ? "#2FD27A" : "#3A4150"}"></span>${a}</span>${b ? `<span class="muted" style="font:600 12px B">${b}</span>` : ""}</div>`).join("")}</div>`;
const thumb = (p, h = 90) => `<div style="height:${h}px;border-radius:8px;background:url(bg/${p}.png) center/cover"></div>`;

// 1 · engine fire-up
S.fireup = () => `${bg("l11-fireup")}
  ${pin(AA["l11-fireup"], "starter", `${pill("STARTER", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">plugged into the back</span>`, { up: 70, dx: -120 })}
  ${pin(AA["l11-fireup"], "heat", `${pill("HEATERS", "#3A1218", "#FF8A8A")} <span class="muted" style="font:600 12px B">oil and water warmed first</span>`, { up: 80, dx: 120 })}
  ${note("Engine fire-up", "Wake the engine up", ["Before each session the crew warms the oil and water, plugs in the starter and fires the engine. It barks, idles rough, then settles.", "Up and down the pit lane you hear the other garages firing up too."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Fire-up</div>${chk([["Water 60 °C", 1], ["Oil 82 °C", 1], ["Starter in", 1], ["Fire", 0, "press F"]])}`)}
  ${concept("Concept render · engine fire-up")}`;

// 2 · install laps
S.installlap = () => `${bg("l11-install")}
  ${pin(AA["l11-install"], "car", `${pill("INSTALL LAP", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">one lap, then straight back in</span>`, { up: 100, dx: 140 })}
  ${note("Install laps", "Check everything works", ["The first run of practice is a single slow lap to check the car: radio, DRS, brakes, pit limiter, gear changes.", "The checklist ticks off as you go. Back in the garage, the crew looks over the car before the real running starts."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:8px">Systems check</div>${chk([["Radio", 1], ["Pit limiter", 1], ["Gear changes", 1], ["Brakes", 0, "next corner"], ["DRS", 0, "on the straight"]])}`)}
  ${hb([gear(2, 80), t2("Pit limiter", "80 km/h · on"), t2("Install lap", "then box")])}
  ${concept("Concept render · install laps")}`;

// 3 · front wing flap at a stop
S.wingflap = () => `${bg("l11-flap")}
  ${pin(AA["l11-flap"], "flap", `${pill("FRONT WING · +2 TURNS", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">more front grip</span>`, { up: 150, dx: -160 })}
  ${note("Wing change at the stop", "Fix the balance mid-race", ["Car understeering? Ask on the radio for more front wing. At your next stop a mechanic turns the adjuster on the front wing while the tyres go on.", "It costs a few tenths if it slows the stop."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">Radio</div><div style="display:grid;gap:6px;font:600 13px B"><div><span class="acc">You:</span> "Lots of understeer in the slow corners."</div><div><span class="blue">Engineer:</span> "Copy. Two turns of front wing at the stop."</div></div><div class="lbl2" style="margin:10px 0 6px">Front wing</div>${tg(["−1", "0", "+1", "+2"], 3)}`)}
  ${hb([t2("Stop", "2.6 s"), t2("Wing", "+0.3 s"), t2("Balance", `<span class="good">understeer → neutral</span>`)])}
  ${concept("Concept render · front wing change at a pit stop")}`;

// 4 · hand gestures
S.gestures = () => `${bg("l11-wave")}
  ${pin(AA["l11-wave"], "hand", `${pill("THANKS!", "#14361F", "#6EE7A8")}`, { up: 80, dx: -100 })}
  ${pin(AA["l11-wave"], "back", `${pill("MOR · LET YOU BY", "#1C2230", "#E8EAF0")}`, { up: 70, dx: -40 })}
  ${note("Hand gestures", "Say thanks, or not", ["Wave thanks to a backmarker who moved over, give a thumbs up after a fair fight, or point to say 'go by'.", "AI drivers remember: thank them and they're easier to pass next time. In online races others see your gestures."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:8px">Gestures</div><div style="display:grid;gap:7px;font:600 13px B">${[["G", "Wave thanks"], ["G G", "Thumbs up"], ["Hold G", "Point: go by"]].map(([k, a]) => `<div class="row">${key(k)} ${a}</div>`).join("")}</div>`)}
  ${hb([gear(7, 286), t2("Lapped", "MOR · blue flag done"), t2("Gap", "+1.4 to P3")])}
  ${concept("Concept render · hand gestures")}`;

// 5 · rivals' radio
S.rivalradio = () => `${bg("s-broadcast")}
  <div class="hudbox" style="left:36px;bottom:110px;padding:12px 16px;width:460px;border-left:4px solid #C8102E"><div class="row" style="justify-content:space-between"><span class="row"><span class="pill" style="background:#3A1218;color:#FF8A8A">RADIO</span><b style="font:700 18px BC">BRD · VELOCE</b></span><span class="muted" style="font:600 12px B">lap 38</span></div><b style="font:600 17px B;display:block;margin-top:6px">"These tyres are done. I can't hold him."</b></div>
  <div class="hudbox" style="left:36px;bottom:30px;padding:8px 14px;width:460px"><span class="muted" style="font:600 12px B">Earlier · OKA: "Plan B, plan B." · SLV: "Box, box."</span></div>
  ${note("Rivals' radio", "Hear what the TV hears", ["Some of the other (made-up) drivers' radio messages play during the race, like on TV: moans about tyres, strategy calls, the odd joke.", "Only what the TV would play, so you can't steal their whole plan, but it might hint who's struggling."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:6px">Rivals' radio</div>${tg(["Play out loud", "Captions only", "Off"], 0)}`)}
  ${concept("Concept render · rivals' radio")}`;

// 6 · support races
S.support = () => `${bg("l11-support")}
  ${pin(AA["l11-support"], "lead", `${pill("RL JUNIOR · RACE 2", "#10213A", "#7FC4FF")}`, { up: 70, dx: 100 })}
  <div class="hudbox" style="left:800px;top:560px;transform:translate(-50%,-100%);padding:6px 10px;white-space:nowrap">${pill("YOU · JUNIOR CAR", "#2A2310", "#FFB547")}</div>
  ${note("Support races", "The weekend has more than one race", ["A junior series races before the Grand Prix. Watch from the garage, or race in it yourself.", "Their cars lay rubber on the line, so the track gets quicker for your race."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 290, `<div class="lbl2" style="margin-bottom:8px">Sunday</div><div style="display:grid;gap:6px">${[["10:15", "RL Junior · race 2", 1], ["11:40", "One-make cup", 0], ["12:10", "Drivers' parade", 0], ["15:00", "Grand Prix", 0]].map(([t, a, on]) => `<div class="row" style="justify-content:space-between;${on ? "color:#FFB547" : ""}"><b class="mono">${t}</b><span style="font:600 13px B">${a}</span></div>`).join("")}</div><div class="lbl2" style="margin:10px 0 6px">You</div>${tg(["Race it", "Watch", "Skip"], 0)}`)}
  ${hb([gear(6, 254), t2("Junior race", "lap 9 of 16"), t2("P4", "+0.9 to P3")])}
  ${concept("Concept render · support races")}`;

// 7 · drone show
S.drones = () => `${bg("l11-drones")}
  ${pin(AA["l11-drones"], "drones", `${pill("DRONE SHOW", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">500 drones · steady lights</span>`, { up: 20, dx: 0 })}
  ${note("Drone show", "Before the night race", ["Hundreds of drones draw shapes and words over the main straight before the start of night races.", "Lights are steady and move slowly. Nothing flashes or strobes. Skip it any time."], "left:18px;top:18px", 400)}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:6px">Pre-race show</div>${tg(["Full", "Short", "Skip"], 0)}<div class="muted" style="font:500 12px B;margin-top:8px">Night races only: Singapore, Las Vegas, Lusail, Jeddah, Bahrain.</div>`)}
  ${concept("Concept render · drone show before night races")}`;

// 8 · slippery white lines
S.whitelines = () => `${bg("l11-lines")}<div class="rain"></div>
  ${pin(AA["l11-lines"], "line", `${pill("WHITE LINE", "#10213A", "#7FC4FF")} <span class="muted" style="font:600 12px B">like ice when it's wet</span>`, { up: 110, dx: 60 })}
  ${note("Slippery white lines", "Paint is ice in the rain", ["In the wet, the painted lines and kerbs have much less grip than the tarmac.", "Put a wheel on the white line under braking or on the throttle and the car snaps sideways."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:8px">Grip in the wet</div><div style="display:grid;gap:6px">${kv("Tarmac", "62%")}${kv("Kerbs", "38%")}${kv("White lines", `<span class="bad">25%</span>`)}</div>`)}
  ${hb([gear(5, 196), t2("Intermediates", "lap 6"), t2("Left wheels", `<span class="bad">on the line</span>`)])}
  ${concept("Concept render · slippery white lines")}`;

// 9 · cool-down room
S.cooldown = () => `${bg("l11-cooldown")}
  ${pin(AA["l11-cooldown"], "tv", `${pill("REPLAY", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">the lap-41 pass, again</span>`, { up: 50, dx: -120 })}
  ${pin(AA["l11-cooldown"], "p1", `${pill("TOP THREE", "#2A2310", "#FFB547")}`, { up: 90, dx: -60 })}
  ${note("Cool-down room", "Before the podium", ["The top three wait together in a small room and watch the replays on TV before going out to the podium.", "They chat about the race: friendly, or not, depending on what happened."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">In the room</div><div style="display:grid;gap:8px;font:600 13px B"><div><span style="color:#FF8A8A">BRD:</span> "You moved twice there."</div><div><span class="acc">You:</span> "Once! Watch it again."</div><div><span style="color:#7FC4FF">OKA:</span> "Here it comes…"</div></div><div class="lbl2" style="margin:10px 0 6px">Your reply</div>${tg(["Joke", "Stay quiet", "Argue"], 0)}`)}
  ${concept("Concept render · cool-down room")}`;

// 10 · retirement walk
S.retirewalk = () => `${bg("l11-walk")}
  ${pin(AA["l11-walk"], "driver", `${pill("YOU · WALKING BACK", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">fans applaud</span>`, { up: 70, dx: 100 })}
  ${pin(AA["l11-walk"], "car", `${pill("OUT · ENGINE", "#3A1218", "#FF8A8A")}`, { up: 70, dx: -60 })}
  ${note("Retirement walk", "The long way back", ["When your race ends early, climb out, wave to the fans and walk (or catch a scooter ride) back to the pits.", "Skip it any time and go straight to the pit wall."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 270, `<div class="lbl2" style="margin-bottom:6px">After retiring</div>${tg(["Walk back", "Scooter", "Skip"], 0)}<div class="lbl2" style="margin:10px 0 6px">Then</div>${tg(["Pit wall", "Watch on TV", "Results"], 0)}`)}
  ${concept("Concept render · retirement walk")}`;

// 11 · finish from the pit wall
S.pitwall = () => top("Race · <b>Pit wall · running MAX's race</b>", `<span class="chip" style="background:#3A1218;color:#FF8A8A">You: out on lap 22</span>`, "l8-pitboard") + `
  <div class="grid" style="grid-template-columns:1fr 1.3fr 1fr;height:727px">
    <div class="panel"><h2>Order · lap 34/52</h2><table>${[["1", "OKA", "AXIOM", "—", "H 18"], ["2", "BRD", "VELOCE", "+3.1", "H 20"], ["3", "MAX", "RACELIMIT", "+5.6", "M 26"], ["4", "SLV", "NOVA", "+6.0", "H 9"], ["5", "ISH", "KESTREL", "+11.4", "H 14"]].map(([p, c, t, g, ty]) => `<tr${c === "MAX" ? ` style="background:#1E1A12"` : ""}><td class="mono">${p}</td><td><i style="display:inline-block;width:4px;height:14px;background:${TEAMS[t]};margin-right:6px;vertical-align:middle"></i><b>${c}</b></td><td class="r mono">${g}</td><td class="mono">${ty}</td></tr>`).join("")}</table><div class="muted" style="font:500 12px B;margin-top:8px">SLV on fresh hards, 0.4 s behind and closing.</div></div>
    <div class="panel"><h2>MAX's tyres and gap</h2>${chart(470, 170, [{ pts: [0.8, 0.76, 0.72, 0.69, 0.66, 0.62, 0.57, 0.52, 0.46], c: "#FFB547" }, { pts: [0.2, 0.26, 0.33, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8], c: "#16B8A6", dash: "6 5" }])}
      <div class="row" style="gap:16px;margin-top:6px;font:600 12px B"><span style="color:#FFB547">— MAX's pace</span><span style="color:#16B8A6">- - SLV catching</span></div>
      <div class="lbl2" style="margin:14px 0 6px">Call</div><div class="row" style="gap:8px"><span class="btn primary">Box this lap · hards</span><span class="btn">Stay out</span><span class="btn">Box next lap</span></div></div>
    <div class="panel"><h2>Radio to MAX</h2><div style="display:grid;gap:8px">${["\"Push now, gap 0.4.\"", "\"Defend into Turn 1.\"", "\"Save the tyres.\"", "\"Box, box.\""].map((m, k) => `<div class="card2" style="font:600 13px B;${k === 3 ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}">${m}</div>`).join("")}</div><div class="muted" style="font:500 12px B;margin-top:10px">Team points still count, so your race isn't over.</div></div>
  </div>${concept("Concept render · finish the race from the pit wall")}`;

// 12 · lap records
S.laprecord = () => `${bg("l11-record")}
  ${pin(AA["l11-record"], "screen", `${pill("NEW LAP RECORD", "#2A1840", "#C9A0FF")} <span class="muted" style="font:600 12px B">your name on the big screen</span>`, { up: 0, dx: 70, side: "right" })}
  ${note("Lap records", "Beat the circuit's best", ["Each circuit keeps a race lap record and a qualifying record. Beat one and your name goes up on the big screen and the record board in the paddock.", "Records are kept per era, so a 1998 car has its own."], "left:18px;top:18px", 400)}
  ${box("right:18px;top:280px", 300, `<div class="lbl2" style="margin-bottom:8px">Silverstone records</div><div style="display:grid;gap:6px">${kv("Race lap", `<span class="acc">1:26.104 · you</span>`)}${kv("Qualifying", "1:24.880 · OKA")}${kv("1998 cars", "1:31.552 · BRD")}</div>`)}
  ${hb([gear(7, 309), t2("Lap 47", `<span style="color:#C9A0FF">1:26.104 · record</span>`), t2("Previous", "1:27.097 · OKA")])}
  ${concept("Concept render · lap records")}`;

// 13 · overnight rebuild
S.rebuild = () => `${bg("l11-rebuild")}
  ${pin(AA["l11-rebuild"], "clock", `${pill("02:40", "#3A1218", "#FF8A8A")} <span class="muted" style="font:600 12px B">past the curfew</span>`, { up: 50, dx: 140 })}
  ${pin(AA["l11-rebuild"], "car", `${pill("NEW FLOOR + FRONT WING", "#2A2310", "#FFB547")}`, { up: 110, dx: 120 })}
  ${note("Overnight rebuild", "Crash in qualifying, work all night", ["After a big crash the crew rebuilds the car overnight. Work through the curfew and it costs one of the team's few exceptions, or a penalty.", "If the chassis is broken, you switch to the spare and start from the pit lane."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">Jobs</div>${chk([["New floor", 1, "done"], ["Front wing and nose", 1, "done"], ["Gearbox check", 0, "1 h"], ["Fire up", 0, "05:30"]])}<div class="lbl2" style="margin:10px 0 6px">Curfew exceptions left</div><div class="mono acc">1 of 2</div>`)}
  ${concept("Concept render · overnight rebuild")}`;

// 14 · fastest pit stop award
S.fastestpit = () => `${bg("l8-crew")}
  <div class="hudbox" style="left:36px;bottom:40px;padding:14px 20px;display:flex;gap:16px;align-items:center;border-left:4px solid #FFA51F"><div><div class="lbl2 acc">Fastest pit stop</div><b style="font:700 34px/1 BC">RACELIMIT · 1.98 s</b><div class="muted" style="font:600 12px B">lap 31 · KIRI · new season best</div></div></div>
  ${note("Fastest pit stop award", "A prize for the crew", ["Every race, the fastest stop gets a TV graphic and points towards a season-long award for the pit crew.", "Win it and there's a trophy for the factory cabinet."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Season award</div><table>${[["1", "RACELIMIT", 212], ["2", "VELOCE", 198], ["3", "AXIOM", 171], ["4", "NOVA", 140]].map(([p, t, v]) => `<tr${t === "RACELIMIT" ? ` style="color:#FFB547"` : ""}><td class="mono">${p}</td><td><i style="display:inline-block;width:4px;height:14px;background:${TEAMS[t]};margin-right:6px;vertical-align:middle"></i>${t}</td><td class="r mono">${v}</td></tr>`).join("")}</table>`)}
  ${concept("Concept render · fastest pit stop award")}`;

// 15 · a corner named after you
S.corner = () => `${bg("l11-corner")}
  ${pin(AA["l11-corner"], "sign", `${pill("TURN 5 IS NOW 'KIRI'", "#2A2310", "#FFB547")}`, { up: 40, dx: -60 })}
  ${note("A corner named after you", "Win enough and it's yours", ["Win five times at a circuit and one of its corners gets your name: on the sign, the track map and the commentary.", "Lose the record for most wins there and someone else can take it."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Your corners</div><div style="display:grid;gap:6px">${kv("Spa · Turn 5", `<span class="acc">KIRI</span>`)}${kv("Monza · Turn 8", "4 of 5 wins")}${kv("Suzuka", "2 of 5 wins")}</div>`)}
  ${hb([gear(7, 298), t2("Next corner", `<span class="acc">KIRI</span> · 180 m`), t2("Wins here", "5")])}
  ${concept("Concept render · a corner named after you")}`;

// 16 · documentary crew
S.documentary = () => `${bg("l11-doc")}
  ${pin(AA["l11-doc"], "crew", `${pill("FILM CREW", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">episode 6 · rebuild night</span>`, { up: 70, dx: 120 })}
  ${pin(AA["l11-doc"], "driver", `${pill("YOU", "#2A2310", "#FFB547")}`, { up: 60, dx: -80 })}
  ${note("Documentary crew", "Your season becomes a show", ["A film crew follows your team. Each episode is cut from your real moments: best overtakes, crashes, radio rows, the podiums.", "Watch the episodes from the menu. They're made from your replays, so every player's show is different."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 320, `<div class="lbl2" style="margin-bottom:8px">Episodes</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${[["l6-donuts", "5 · The Singapore call"], ["l7-crane", "6 · Rebuild night"]].map(([p, t]) => `<div>${thumb(p, 80)}<div style="font:600 12px B;margin-top:4px">${t}</div></div>`).join("")}</div>`)}
  ${concept("Concept render · documentary crew")}`;

// 17 · factory tour
S.factory = () => `${bg("l11-factory")}
  ${pin(AA["l11-factory"], "car", `${pill("LAST YEAR'S CAR", "#1C2230", "#E8EAF0")}`, { up: 50, dx: 230 })}
  <div class="hudbox" style="left:24px;top:330px;padding:6px 10px;white-space:nowrap">${pill("TROPHY CABINET", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">←</span></div>
  ${pin(AA["l11-factory"], "sim", `${pill("SIMULATOR", "#10213A", "#7FC4FF")}`, { up: 50, dx: -60 })}
  ${pin(AA["l11-factory"], "tunnel", `${pill("WIND TUNNEL", "#10213A", "#7FC4FF")}`, { up: 10, dx: 300, side: "right" })}
  ${note("Factory tour", "Walk round your team's base", ["Between races, walk round the factory: the wind tunnel, the simulator, the race bays and the trophy cabinet.", "Each room opens its menu: upgrades, sim practice, trophies. It grows as your team does."], "left:18px;bottom:18px", 420)}
  ${concept("Concept render · factory tour")}`;

// 18 · race director mode
S.racedirector = () => top("Race control · <b>Friends' race · Silverstone · lap 12</b>", `<span class="chip">You are race director</span>`, "s-redflag") + `
  <div class="grid" style="grid-template-columns:1.5fr 1fr;height:727px">
    <div class="panel"><h2>Cameras</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${["s-defend", "s-broadcast", "l6-replay3d", "s-marshals", "l7-crane", "s-tow"].map((p, k) => `<div style="position:relative">${thumb(p, 130)}<span class="pill" style="position:absolute;left:6px;top:6px;background:${k === 3 ? "#3A1218" : "#0B0D12cc"};color:${k === 3 ? "#FF8A8A" : "#C3C9D4"}">CAM ${k + 1}${k === 3 ? " · INCIDENT" : ""}</span></div>`).join("")}</div>
      <div class="row" style="gap:8px;margin-top:14px">${[["Yellow · sector 2", "#2A2310", "#FFB547"], ["Virtual safety car", "#1C2230", "#E8EAF0"], ["Safety car", "#1C2230", "#E8EAF0"], ["Red flag", "#3A1218", "#FF8A8A"]].map(([a, b, c]) => `<span class="btn" style="background:${b};color:${c};border-color:${c}55">${a}</span>`).join("")}</div></div>
    <div class="panel"><h2>Incidents</h2>${[["L11 · T7", "Leo and Sam touch, Sam spins", 1], ["L9 · T15", "Ana off track, gained a place", 0], ["L4 · pit exit", "Max crossed the line", 0]].map(([a, b, on]) => `<div class="card2" style="margin-top:8px;${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b class="mono" style="font-size:13px">${a}</b><span class="muted" style="font:600 12px B">${on ? "replay ready" : "decided"}</span></div><div style="font:600 13px B;margin-top:2px">${b}</div>${on ? `<div class="lbl2" style="margin:8px 0 4px">Decision</div>${tg(["No action", "Warning", "5 s", "10 s", "Drive-through"], 2)}` : ""}</div>`).join("")}</div>
  </div>${concept("Concept render · race director mode")}`;

// 19 · knockout cups
const pl = ["Kiri", "Sam", "Leo", "Ana", "Max", "Ivy", "Tom", "Jo"];
const node = (x, y, n, win, live) => `<div style="position:absolute;left:${x}px;top:${y}px;width:170px;height:40px;border-radius:8px;background:${live ? "#2A2310" : "#1A1E27"};box-shadow:inset 0 0 0 1px ${live ? "#FFB547" : win ? "#2FD27A55" : "#262B36"};display:flex;align-items:center;justify-content:space-between;padding:0 12px;font:600 14px B;color:${win ? "#E8EAF0" : "#9AA3B2"}">${n}${win ? `<span class="good">✓</span>` : ""}</div>`;
S.knockout = () => top("Friends · <b>Knockout cup · Monza week</b>", `<span class="chip">Room code hidden</span>`, "monza-chase") + `
  <div class="panel" style="position:absolute;left:26px;top:86px;width:1100px;height:790px;background:rgba(19,22,29,.95)"><h2>Bracket</h2><div style="position:relative;height:700px">
    ${pl.map((n, k) => node(20, 20 + k * 82, n, [0, 3, 4, 6].includes(k), false)).join("")}
    ${["Kiri", "Ana", "Max", "Tom"].map((n, k) => node(330, 61 + k * 164, n, k === 0 || k === 2, false)).join("")}
    ${["Kiri", "Max"].map((n, k) => node(640, 143 + k * 328, n, false, true)).join("")}
    ${node(920, 307, "Winner", false, false)}
    <svg style="position:absolute;inset:0" width="1100" height="700">${[0, 1, 2, 3].map((k) => `<path d="M190 ${40 + k * 164} H260 V${81 + k * 164} H330 M190 ${122 + k * 164} H260 V${81 + k * 164}" stroke="#3A4150" fill="none"/>`).join("")}${[0, 1].map((k) => `<path d="M500 ${81 + k * 328} H570 V${163 + k * 328} H640 M500 ${245 + k * 328} H570 V${163 + k * 328}" stroke="#3A4150" fill="none"/>`).join("")}<path d="M810 163 H865 V327 H920 M810 491 H865 V327" stroke="#3A4150" fill="none"/></svg>
    <div style="position:absolute;left:20px;top:-6px;font:600 12px B;color:#9AA3B2">Quarter-finals · Monza</div><div style="position:absolute;left:330px;top:35px;font:600 12px B;color:#9AA3B2">Semi-finals · Suzuka</div><div style="position:absolute;left:640px;top:117px;font:600 12px B;color:#FFB547">Final · Spa · 3 laps · now</div></div></div>
  ${box("right:26px;top:86px", 420, `<div class="lbl2" style="margin-bottom:8px">Knockout cup</div><div style="display:grid;gap:8px;font:500 14px/1.4 B;color:#C3C9D4"><div>Head-to-head races, two players at a time. Lose and you're out; win and you move on until one is left.</div><div>Friends who are out can watch the next race live, or play the race director.</div></div><div class="lbl2" style="margin:12px 0 6px">Format</div>${tg(["One race", "Best of 3"], 0)}<div class="lbl2" style="margin:12px 0 6px">Cars</div>${tg(["Same car for all", "Own cars"], 0)}`)}
  ${concept("Concept render · knockout cups")}`;

// 20 · replay files
S.replayfile = () => `${bg("s-defend")}
  <div class="hudbox" style="left:50%;top:24px;transform:translateX(-50%);display:flex;gap:14px;align-items:center;padding:12px 18px"><div style="width:44px;height:52px;border-radius:6px;background:#1C2230;display:grid;place-items:center;font:700 12px B;color:#FFB547;box-shadow:inset 0 0 0 1px #FFB547">RL</div><div><b style="font:600 16px B">silverstone-27-oct.rlreplay</b><div class="muted" style="font:600 12px B">1.4 MB · from Sam · 52 laps, every car</div></div><span class="btn primary" style="height:34px">Watch</span></div>
  ${note("Replay files", "Send a race to a friend", ["Save any race as a small file. It holds where every car was, not a video, so it stays tiny.", "Your friend drops it into the game and watches it from any camera, any car, as if they were there."], "left:18px;top:120px", 400)}
  ${hb([`<div class="row" style="gap:10px"><b style="font:700 18px BC">▶</b><span class="mono">L38 · 1:02:41</span></div>`, `<div style="width:420px;height:6px;border-radius:3px;background:#2A2F3B;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:72%;border-radius:3px;background:#FFB547"></i></div>`, t2("Camera", "Drone · follow BRD"), t2("Speed", "×1")])}
  ${box("right:18px;top:120px", 270, `<div class="lbl2" style="margin-bottom:6px">Camera</div>${tg(["TV", "Drone", "Onboard", "Helicopter", "Free"], 1)}<div class="lbl2" style="margin:10px 0 6px">Follow</div>${tg(["BRD", "Sam", "Leader"], 0)}`)}
  ${concept("Concept render · replay files")}`;

// 21 · streamer mode
S.streamer = () => `${bg("s-tow")}
  <div class="hudbox" style="right:18px;top:18px;width:330px;padding:14px 16px"><div class="row" style="justify-content:space-between"><span class="lbl2 acc">Viewers vote · next twist</span><span class="mono muted">0:24</span></div>${[["One gear only", 48], ["Wets on a dry track", 31], ["No HUD", 21]].map(([a, v], k) => `<div style="margin-top:8px"><div class="row" style="justify-content:space-between;font:600 13px B"><span>${a}</span><span class="mono">${v}%</span></div><div style="height:6px;border-radius:3px;background:#2A2F3B"><i style="display:block;height:6px;border-radius:3px;width:${v}%;background:${k ? "#5A6272" : "#FFB547"}"></i></div></div>`).join("")}<div class="muted" style="font:600 12px B;margin-top:8px">Viewers type 1, 2 or 3 in chat</div></div>
  <div class="hudbox" style="left:18px;bottom:18px;padding:8px 14px;display:flex;gap:10px;align-items:center"><span class="pill" style="background:#1C2230;color:#9AA3B2">ROOM CODE HIDDEN</span><span class="pill" style="background:#1C2230;color:#9AA3B2">FRIENDS' NAMES HIDDEN</span></div>
  ${note("Streamer mode", "Made for streaming", ["A clean overlay that looks good on stream. Room codes and friends' names are hidden, so viewers can't join or find them.", "Viewers can vote in chat for your next challenge twist."], "left:18px;top:18px", 400)}
  ${concept("Concept render · streamer mode")}`;

// 22 · frozen lake show
S.frozenlake = () => `${bg("l11-ice")}
  ${pin(AA["l11-ice"], "car", `${pill("FROZEN LAKE SHOW", "#10213A", "#7FC4FF")} <span class="muted" style="font:600 12px B">studded tyres</span>`, { up: 110, dx: 120 })}
  ${note("Frozen lake show", "Slide an F1 car on ice", ["A made-up winter exhibition on a frozen lake. Studded tyres, very little grip, and lots of sliding.", "Time trials, drift scores, and a race against friends on an oval cut into the snow."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 260, `<div class="lbl2" style="margin-bottom:8px">On ice</div><div style="display:grid;gap:6px">${kv("Grip", "about 15%")}${kv("Tyres", "studded")}${kv("Air", "−12 °C")}</div><div class="lbl2" style="margin:10px 0 6px">Event</div>${tg(["Time trial", "Drift score", "Race"], 1)}`)}
  ${hb([gear(3, 112), t2("Drift", `<span class="acc">42° · 3,200 pts</span>`), t2("Lap", "1:12.4")])}
  ${concept("Concept render · frozen lake show")}`;

mount(S);
export default S;

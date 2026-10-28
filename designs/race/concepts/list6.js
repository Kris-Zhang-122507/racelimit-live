import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, tag, drv, chart, trackSvg, mount, TEAMS, A, pin } from "./common.js";
const AA = {};
await Promise.all(["l6-safetycar", "l6-train", "l6-replay3d", "l6-concept", "l6-era09", "l6-rewind", "l6-bigscreen", "l6-donuts", "l6-crowd", "l6-easter", "l6-team"].map(async (n) => (AA[n] = await A(n))));

const S = {};
const key = (k) => `<span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">${k}</span>`;
const sing = [[30, 10], [40, 20], [60, 18], [70, 30], [88, 34], [92, 52], [80, 60], [70, 74], [52, 80], [40, 72], [24, 78], [10, 66], [12, 40], [20, 24]];

// 1 · drive the safety car
S.safetycar = () => `${bg("l6-safetycar")}
  ${pin(AA["l6-safetycar"], "sc", `${pill("YOU · SAFETY CAR", "#2A2310", "#FFB547")} <span class="muted" style="font:600 12px B">lights on, steady</span>`, { up: 80, dx: 60 })}
  ${pin(AA["l6-safetycar"], "leader", `${drv("OKA")} <span class="muted" style="font:600 12px B">leader · must stay within 10 car lengths</span>`, { up: 90, dx: -90 })}
  ${note("Drive the safety car", "Lead the pack under caution", ["You drive the safety car: fast enough to keep the tyres and brakes warm, slow enough for the marshals to work.", "Race control tells you when the track is clear. Turn the lights off, then pull into the pit lane without slowing the field.", "Score points for a smooth job: no one bunching up, no one losing heat."])}
  ${box("right:18px;top:18px", 320, `<div class="lbl2" style="margin-bottom:8px">Race control</div>
    <div class="card2"><b>Recovery at Turn 9 · 1 lap more</b><div class="muted" style="font:600 12px B">then "safety car in this lap"</div></div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Target lap", "2:05 – 2:15")}${kv("This lap", `<span class="good">2:09.4</span>`)}${kv("Field behind", "18 cars · all in line")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Lights</div>${tg(["On", "Off (coming in)"], 0)}`)}
  ${hb([gear(5, 172), t2("Safety car", "lap 2 of 3"), t2(`Pit entry ${key("P")}`, "turn the lights off first")])}
  ${concept("Concept render · drive the safety car")}`;

// 2 · elimination race
const elim = [["1", "OKA", "AXIOM", "Leader", ""], ["2", "BRD", "VELOCE", "+0.6", ""], ["3", "YOU", "RACELIMIT", "+1.1", ""], ["4", "SLV", "NOVA", "+1.9", ""], ["5", "VRG", "HALCYON", "+2.6", "danger"], ["6", "KAI", "ORBITA", "+3.3", "out"], ["7", "DEL", "VORTEX", "out L4", "gone"], ["8", "MOR", "MERIDIAN", "out L3", "gone"]];
S.elimination = () => `${bg("l6-train")}
  <div class="hudbox" style="left:18px;top:18px;width:250px;padding:0;overflow:hidden"><div style="background:#E8002D;color:#fff;padding:6px 12px;font:700 16px BC;letter-spacing:.06em">ELIMINATION · LAP 5</div>
    ${elim.map(([p, c, t, g, st]) => `<div class="row" style="padding:5px 12px;gap:8px;${c === "YOU" ? "background:#2A2310;" : st === "out" ? "background:#3A1218;" : ""}border-top:1px solid #FFFFFF10;opacity:${st === "gone" ? 0.4 : 1}"><b class="mono" style="width:18px">${p}</b><i style="width:4px;height:18px;background:${TEAMS[t]}"></i><b style="font:700 17px BC;width:44px;${st === "gone" ? "text-decoration:line-through" : ""}">${c}</b><span class="mono" style="margin-left:auto;font-size:13px;color:${st === "out" ? "#FF8A8A" : "#C3C9D4"}">${st === "out" ? "OUT AT LINE" : g}</span></div>`).join("")}</div>
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);text-align:center;padding:12px 24px"><div class="lbl2" style="color:#FF8A8A">Last place at the line is out</div><b style="font:700 32px BC">KAI ELIMINATED IN 0:12</b><div class="muted" style="font:600 13px B">VRG is 0.7 s ahead of KAI · 6 cars left</div></div>
  ${note("Elimination race", "Last car at the line is out", ["Every lap, whoever is last when they cross the line is out of the race.", "It gets tense fast: you can't just sit at the back and wait.", "Works with AI, friends in split-screen, or the hot-seat."], "right:18px;top:150px", 380)}
  ${hb([gear(8, 322), t2("P3 of 6", "safe by 2.2 s"), t2("Lap 5", "2 eliminated")])}
  ${concept("Concept render · elimination race")}`;

// 3 · watch real races in 3D
S.watch3d = () => `${bg("l6-replay3d")}
  ${pin(AA["l6-replay3d"], "lead", `${drv("OKA")} <span class="muted" style="font:600 12px B">P1 · lap 41</span>`, { up: 60, dx: 60 })}
  <div class="hudbox" style="left:18px;top:18px;width:420px"><div class="lbl2" style="color:#FFB547">Watch a real race in 3D</div><div style="font:700 25px BC;margin:3px 0 6px">Singapore Grand Prix 2026 · race</div>
    <div style="display:grid;gap:5px;font:500 14px/1.4 B;color:#C3C9D4"><div>The real race from your live timing archive, played out on the 3D circuit: every car where it really was, lap by lap.</div><div>Cars wear made-up liveries. Pick any camera, or jump to the big moments.</div></div></div>
  <div class="hudbox" style="right:18px;top:18px;width:270px"><div class="lbl2" style="margin-bottom:6px">Camera</div>${tg(["TV director", "Helicopter", "Onboard", "Follow a car"], 1)}<div class="lbl2" style="margin:10px 0 6px">Follow</div>${tg(["Leader", "Battle for P3", "Pick a car"], 1)}</div>
  <div class="hudbox" style="left:18px;right:18px;bottom:18px;padding:12px 16px"><div class="row" style="gap:14px"><span class="btn primary">❚❚</span><span class="btn">×1</span><b class="mono">Lap 41 / 62</b><span class="muted" style="font:600 12px B">1:12:40 into the race</span><span style="margin-left:auto" class="chip">Spoiler shield on</span></div>
    <div style="position:relative;height:10px;border-radius:5px;background:#2A2F3B;margin-top:10px"><i style="position:absolute;left:0;top:0;bottom:0;width:66%;background:#FFB547;border-radius:5px"></i>${[[12, "#F2C230"], [30, "#5AA9FF"], [48, "#FF5A6A"], [58, "#F2C230"]].map(([x, c]) => `<i style="position:absolute;left:${x}%;top:-4px;width:4px;height:18px;border-radius:2px;background:${c}"></i>`).join("")}</div>
    <div class="row" style="gap:16px;margin-top:6px;font:600 11px B;color:#9AA3B2"><span><i class="dot" style="background:#F2C230"></i> safety car</span><span><i class="dot" style="background:#5AA9FF"></i> pit stops</span><span><i class="dot" style="background:#FF5A6A"></i> overtakes</span></div></div>
  ${concept("Concept render · watch real races in 3D", "bottom:118px")}`;

// 4 · concept cars
S.conceptcars = () => `${bg("l6-concept")}
  ${pin(AA["l6-concept"], "c0", `<div style="display:grid;gap:1px"><b style="font:700 18px BC">Six-wheeler</b><span class="muted" style="font:600 11px B">four small front wheels: more grip, less drag</span></div>`, { up: 70 })}
  ${pin(AA["l6-concept"], "c1", `<div style="display:grid;gap:1px"><b style="font:700 18px BC">Fan car</b><span class="muted" style="font:600 11px B">a fan sucks the car to the ground</span></div>`, { up: 90 })}
  ${pin(AA["l6-concept"], "c2", `<div style="display:grid;gap:1px"><b style="font:700 18px BC">Skirt car</b><span class="muted" style="font:600 11px B">sliding skirts seal the floor</span></div>`, { up: 70 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);text-align:center;padding:10px 22px"><div class="lbl2 acc">Fun races</div><b style="font:700 28px BC">Concept cars</b></div>
  ${note("Concept cars", "Wild ideas, made up for fun", ["Made-up designs built around ideas engineers have tried: extra wheels, a fan, sliding skirts.", "Race them against each other, or against today's cars, in fun events.", "Each has its own handling: the fan car sticks in slow corners, the six-wheeler turns in sharply."], "left:18px;bottom:18px", 420)}
  ${box("right:18px;bottom:52px", 300, `<div class="lbl2" style="margin-bottom:6px">Fun event</div>${tg(["Concept cup", "Concept vs today", "Free drive"], 0)}<div class="muted" style="font:600 12px B;margin-top:8px">Not in career mode or ranked challenges.</div>`)}
  ${concept("Concept render · concept cars")}`;

// 5 · engine modes
S.enginemodes = () => `${bg("l6-cockpit")}
  ${note("Engine modes", "Push, standard or save", ["A dial on the wheel picks how hard the engine works.", "Push: fastest, but uses more fuel, runs hotter and wears the engine. Save: slower, cooler, lasts longer.", "The engineer asks for modes during the race: 'Mode push for two laps, then back to standard.'"], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 380, `<div class="lbl2" style="margin-bottom:8px">Engine mode</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${[["SAVE", "−0.4 s", "#6EE7A8", 0], ["STD", "base", "#C3C9D4", 0], ["PUSH", "+0.3 s", "#FFB547", 1], ["QUALI", "+0.5 s", "#FF8A8A", 0]].map(([a, b, c, on]) => `<div class="card2" style="text-align:center;padding:8px 4px;${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><b style="color:${c}">${a}</b><div class="muted mono" style="font-size:11px">${b}</div></div>`).join("")}</div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Fuel per lap", `<span class="acc">1.71 kg (+6%)</span>`)}${kv("Engine temp", `<span class="acc">+8°</span>`)}${kv("Engine life", "−2 laps per lap used")}</div>
    <div class="card2" style="margin-top:10px;box-shadow:inset 0 0 0 1px #FFB547"><b class="acc">Engineer:</b> "Push for two laps to get the undercut, then back to standard."</div>`)}
  ${hb([gear(8, 331), t2(`Mode <span class="mono acc">PUSH</span>`, "lap 2 of 2"), t2("Gap to BRD", "1.4 s")])}
  ${concept("Concept render · engine modes")}`;

// 6 · era gadgets
S.eragadgets = () => `${bg("l6-era09")}
  ${pin(AA["l6-era09"], "cockpit", `<div style="display:grid;gap:2px"><b style="font:600 13px B">Boost button</b><span class="muted" style="font:600 11px B">2009 · 80 hp for ~7 s a lap</span></div>`, { up: 110, dx: -60 })}
  ${pin(AA["l6-era09"], "rear", `<div style="display:grid;gap:2px"><b style="font:600 13px B">Duct to the rear wing</b><span class="muted" style="font:600 11px B">2010 · block it with your hand on the straights</span></div>`, { up: 90, dx: 90 })}
  ${note("Era gadgets", "Every era had its tricks", ["2009: a boost button on the wheel, a few seconds of extra power every lap.", "2010: a hole in the cockpit linked to the rear wing. Cover it with your hand on the straight and the wing stalls for more top speed, but you only steer with one hand.", "2012: a second DRS-style system linked to the main one."], "left:18px;top:18px", 440)}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">This car · 2009–2013</div><div style="display:grid;gap:8px">${[["Boost button", `${key("Space")} 6.7 s left`, 1], ["Hand duct", `${key("H")} hold on straights`, 1], ["Second DRS", "2012 only", 0]].map(([a, b, on]) => `<div class="card2" style="opacity:${on ? 1 : 0.5}"><b>${a}</b><div class="muted" style="font:600 12px B">${b}</div></div>`).join("")}</div>`)}
  ${concept("Concept render · era gadgets")}`;

// 7 · start reaction meter
S.reaction = () => `${bg("l6-grid", "brightness(.95)")}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);display:flex;gap:10px;padding:14px 18px">${Array.from({ length: 5 }, () => `<div style="display:grid;gap:6px">${[0, 1].map(() => `<i style="width:30px;height:30px;border-radius:50%;background:#2A2F3B;box-shadow:inset 0 0 0 2px #3A4150"></i>`).join("")}</div>`).join("")}<div style="display:grid;align-content:center;margin-left:8px"><b style="font:700 26px BC">LIGHTS OUT</b><div class="muted" style="font:600 12px B">and away you go</div></div></div>
  <div class="hudbox" style="left:50%;top:150px;transform:translateX(-50%);text-align:center;padding:12px 26px"><div class="lbl2">Your reaction</div><b class="mono good" style="font-size:44px;line-height:1.1">0.198 s</b><div class="row" style="justify-content:center;margin-top:4px">${pill("GREAT LAUNCH", "#14361F", "#6EE7A8")}<span class="muted" style="font:600 12px B">wheelspin 4% · gained 1 place</span></div></div>
  ${note("Start reaction meter", "How fast did you go?", ["After lights out, see your reaction time and how clean the launch was: too much wheelspin, bogging down, or just right.", "Your best and average starts are kept, and you can practise starts in the garage."], "left:18px;top:300px", 380)}
  ${box("right:18px;top:300px", 300, `<div class="lbl2" style="margin-bottom:8px">Your starts</div>${chart(270, 80, [{ pts: [0.4, 0.55, 0.35, 0.6, 0.7, 0.62, 0.8], c: "#6EE7A8" }])}<div style="display:grid;gap:6px;margin-top:8px">${kv("Best", "0.172 s")}${kv("Average", "0.231 s")}${kv("Jump starts", "1")}</div>`)}
  ${concept("Concept render · start reaction meter")}`;

// 8 · rewind
S.rewind = () => `${bg("l6-rewind")}
  ${pin(AA["l6-rewind"], "car", `${pill("OFF AT LA SOURCE", "#3A1218", "#FF8A8A")}`, { up: 70 })}
  <div class="hudbox" style="left:50%;bottom:22px;transform:translateX(-50%);width:820px;padding:12px 16px"><div class="row"><b style="font:700 22px BC">◀◀ REWIND</b><span class="muted" style="font:600 12px B">drag back, then press ${key("Enter")} to drive from there</span><span style="margin-left:auto" class="chip">2 of 3 left this race</span></div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:10px">${[0, 1, 2, 3, 4, 5].map((k) => `<div style="height:70px;border-radius:6px;background:url(bg/l6-rewind.png) ${20 + k * 12}% 50%/400% auto;${k === 2 ? "box-shadow:0 0 0 2px #FFB547" : "opacity:.75"}"></div>`).join("")}</div>
    <div class="row" style="justify-content:space-between;font:600 11px B;color:#9AA3B2;margin-top:4px"><span>−10 s</span><span class="acc">−6 s · braking point</span><span>now</span></div></div>
  ${note("Rewind", "Undo a mistake, if you want to", ["Went off? Rewind up to 10 seconds and try that corner again.", "A few uses per race. Turned off in challenges, rankings and with friends, so times stay fair."], "left:18px;top:18px", 380)}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:6px">Rewinds per race</div>${tg(["Off", "1", "3", "Unlimited"], 2)}`)}
  ${concept("Concept render · rewind")}`;

// 9 · big screens
S.bigscreen = () => `${bg("l6-bigscreen")}
  ${pin(AA["l6-bigscreen"], "screen", `${pill("BIG SCREEN", "#1C2230", "#E8EAF0")} <span class="muted" style="font:600 12px B">showing your race, live</span>`, { up: 40 })}
  ${note("Big screens", "The circuit's screens show the race", ["Giant screens round the circuit show the TV pictures: the battle you're in, replays and the timing tower.", "Glance up as you pass and you might see yourself."], "left:18px;top:18px", 380)}
  ${hb([gear(7, 278), t2("P3", "+0.8 to BRD"), t2("Lap 14 / 52", "Silverstone")])}
  ${concept("Concept render · big screens round the circuit")}`;

// 10 · celebrations
S.celebrate = () => `${bg("l6-donuts")}
  ${pin(AA["l6-donuts"], "car", `${pill("WINNER · DONUTS", "#2A2310", "#FFB547")}`, { up: 60 })}
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);text-align:center;padding:12px 26px"><div class="lbl2 acc">Singapore · race winner</div><b style="font:700 34px BC">P1 · KIRI · RACELIMIT</b></div>
  ${note("Celebrations", "Enjoy the win", ["After a win: donuts on the main straight (hold the throttle and full lock), fireworks over night races, and your team cheering from the pit wall as you cross the line.", "A short replay of your best moment plays as you slow down."], "left:18px;top:140px", 400)}
  ${box("right:18px;top:140px", 280, `<div class="lbl2" style="margin-bottom:6px">Controls</div><div style="display:grid;gap:6px;font:600 13px B"><div>${key("↑")} + full lock: donuts</div><div>${key("Space")} skip to the podium</div></div><div class="lbl2" style="margin:10px 0 6px">Fireworks</div>${tg(["Night races", "Always", "Off"], 0)}`)}
  ${concept("Concept render · celebrations")}`;

// 11 · local crowds
S.crowds = () => `${bg("l6-crowd")}
  ${pin(AA["l6-crowd"], "smoke", `${pill("ORANGE SMOKE", "#2A1A10", "#FFB060")} <span class="muted" style="font:600 12px B">the home crowd</span>`, { up: 40 })}
  ${note("Local crowds", "Every circuit's fans look different", ["Each circuit has its own crowd: orange smoke and flags at Zandvoort, a sea of red at Monza, umbrellas at Silverstone, packed hillsides at Spa.", "Made-up flags and colours for each place, so it feels like a home race."], "left:18px;top:18px", 400)}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">Crowds by circuit</div><div style="display:grid;gap:6px">${[["Zandvoort", "orange smoke, flags", "#FF7A1A"], ["Monza", "red flags, track invasion after", "#E8002D"], ["Silverstone", "umbrellas, picnic banks", "#5AA9FF"], ["Mexico City", "stadium section, masks", "#2FD27A"]].map(([a, b, c]) => `<div class="row"><i class="dot" style="background:${c}"></i><b style="font:600 13px B">${a}</b><span class="muted" style="font:600 12px B">${b}</span></div>`).join("")}</div>`)}
  ${concept("Concept render · local crowds")}`;

// 12 · easter eggs
S.easter = () => `${bg("l6-easter")}
  ${pin(AA["l6-easter"], "duck", `${pill("FOUND ONE!", "#14361F", "#6EE7A8")} <span class="muted" style="font:600 12px B">the La Source duck · 4 of 12</span>`, { up: 60, dx: 40 })}
  ${note("Hidden easter eggs", "Little secrets round every circuit", ["A tiny duck on a tyre wall, a sign with a joke, a mechanic having a nap behind the garages.", "Spot one while driving (or in cruise mode) and it's added to your collection. Find them all for a trophy."], "left:18px;top:18px", 380)}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Spa · 4 of 12</div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px">${Array.from({ length: 12 }, (_, i) => `<i style="height:28px;border-radius:6px;display:grid;place-items:center;font:700 13px B;font-style:normal;background:${i < 4 ? "#2A2310" : "#1C2230"};color:${i < 4 ? "#FFB547" : "#3A4150"}">${i < 4 ? "★" : "?"}</i>`).join("")}</div><div class="muted" style="font:600 12px B;margin-top:8px">Hint: look up at Eau Rouge.</div>`)}
  ${concept("Concept render · hidden easter eggs")}`;

// 13 · era camera looks
const look = (lbl, sub, css, extra = "") => `<div class="panel" style="padding:0;overflow:hidden;position:relative"><div style="height:330px;position:relative;overflow:hidden;background:#000">${css}${extra}</div><div style="padding:12px 16px"><b style="font:700 22px BC">${lbl}</b><div class="muted">${sub}</div></div></div>`;
S.eralooks = () => top("Settings · <b>Camera look</b>", `<span class="chip">Matches the car's era</span>`, "l6-classic98") + `
  <div class="grid" style="grid-template-columns:repeat(3,1fr);height:727px">
    ${look("1990s TV", "square, soft and grainy, with a wobbly picture", `<div style="position:absolute;left:12.5%;right:12.5%;top:0;bottom:0;background:url(bg/l6-classic98.png) center/cover;filter:saturate(.55) contrast(1.15) blur(1.1px) sepia(.25)"></div><div style="position:absolute;left:12.5%;right:12.5%;top:0;bottom:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.14) 0 1px,transparent 1px 4px)"></div>`, `<div style="position:absolute;left:16%;top:10px;font:700 14px Arial;color:#fff;text-shadow:1px 1px 0 #000;background:#1A3FA0;padding:2px 8px">LAP 23</div>`)}
    ${look("2000s", "early widescreen, sharper, warmer", `<div style="position:absolute;inset:0;background:url(bg/l6-classic98.png) center/cover;filter:saturate(.85) contrast(1.08) sepia(.12)"></div>`, `<div style="position:absolute;left:10px;top:10px;font:700 13px Arial;color:#fff;background:linear-gradient(#C8102E,#8A0A1E);padding:3px 10px;border-radius:3px">P3 · +2.4</div>`)}
    ${look("Today", "sharp HD, full colour", `<div style="position:absolute;inset:0;background:url(bg/l6-classic98.png) center/cover"></div>`)}
    <div class="panel" style="grid-column:span 3;display:grid;grid-template-columns:1.4fr 1fr;gap:24px"><div><h2>Era look</h2><div class="muted">The TV and onboard cameras take on the look of the time: square 1990s onboards, early-2000s graphics, today's sharp pictures. It changes how replays and the TV camera look, not how you drive.</div></div>
      <div style="display:grid;gap:8px;align-content:start"><div class="lbl2">Camera look</div>${tg(["Match the car's era", "Always today", "Always 1990s"], 0)}<div class="lbl2">Apply to</div>${tg(["TV cameras", "Onboards", "Replays", "Photos"], [0, 1, 2])}</div></div>
  </div>${concept("Concept render · era camera looks")}`;

// 14 · setup wizard
S.setupwizard = () => top("Garage · <b>Setup wizard</b>", `<span class="chip">Your engineer: Sam</span>`, "l6-team") + `
  <div class="grid" style="grid-template-columns:1fr 1.15fr;height:727px">
    <div class="panel"><h2>What's the car doing?</h2>
      <div class="lbl2" style="margin:8px 0 6px">Where</div>${tg(["Slow corners", "Fast corners", "Braking", "Kerbs", "Straights"], 0)}
      <div class="lbl2" style="margin:12px 0 6px">What happens</div>${tg(["Won't turn in (understeer)", "Rear slides (oversteer)", "Locks a wheel", "Bounces", "Too slow on straights"], 0)}
      <div class="lbl2" style="margin:12px 0 6px">When</div>${tg(["Entry", "Middle", "Exit"], 1)}
      <div class="card2" style="margin-top:16px"><div class="lbl2">You said</div><b style="font:600 15px B">"Understeer in the middle of slow corners."</b></div>
      <div class="muted" style="font:500 13px B;margin-top:10px">Based on your last 6 laps too: you're 0.2 s slower than your best in Turns 3 and 6.</div></div>
    <div class="panel"><h2>Sam suggests</h2>
      <div style="display:grid;gap:10px">${[["1", "Front anti-roll bar softer", "4 → 3", "more front grip in slow corners", 1], ["2", "Differential on entry more open", "60% → 55%", "helps the car rotate", 0], ["3", "Front wing +1", "if it's still pushing", "more front downforce, a bit less top speed", 0]].map(([n, a, b, c, on]) => `<div class="card2" style="${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b><span class="mono acc">${n}</span> ${a}</b><b class="mono">${b}</b></div><div class="muted" style="font:600 12px B">${c}</div></div>`).join("")}</div>
      <div class="row" style="margin-top:14px"><span class="btn primary">Try change 1</span><span class="btn">Try all three</span><span class="btn">Explain why</span></div>
      <div class="muted" style="font:500 12px B;margin-top:10px">One change at a time is best: you'll feel what each one does.</div></div>
  </div>${concept("Concept render · setup wizard")}`;

// 15 · your lap in the live timing site's Compare tab
S.compare = () => `<div style="position:absolute;inset:0;background:#0B0D12"></div>
  <div class="top"><div class="brand">RACELIMIT<small>LIVE</small></div><div class="crumbs">Compare · <b>Spa-Francorchamps</b></div><div class="sp"></div>${["Live", "Strategy", "Compare", "Replays", "Schedule"].map((t) => `<span class="chip" style="${t === "Compare" ? "background:#2A2310;color:#FFB547" : ""}">${t}</span>`).join("")}</div>
  <div class="grid" style="grid-template-columns:1.5fr 1fr;height:836px;zoom:1;padding:18px 24px;align-content:start">
    <div class="panel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Speed over the lap</h2><div class="row"><span class="chip"><i class="dot" style="background:#FFB547"></i> Your lap (game) 1:41.220</span><span class="chip"><i class="dot" style="background:#7FC4FF"></i> 2026 pole lap 1:40.562</span></div></div>
      ${chart(880, 230, [{ pts: [0.6, 0.85, 0.9, 0.3, 0.55, 0.92, 0.96, 0.97, 0.45, 0.6, 0.8, 0.5, 0.42, 0.75, 0.9, 0.95, 0.58, 0.35, 0.7, 0.88], c: "#7FC4FF" }, { pts: [0.6, 0.84, 0.9, 0.27, 0.52, 0.9, 0.95, 0.96, 0.42, 0.55, 0.76, 0.46, 0.4, 0.72, 0.88, 0.94, 0.54, 0.33, 0.66, 0.86], c: "#FFB547" }], { extra: `<rect x="230" y="0" width="80" height="230" fill="#FF6B6B" opacity=".1"/>` })}
      <div class="row" style="justify-content:space-between;font:600 11px B;color:#9AA3B2;margin-top:4px"><span>La Source</span><span>Eau Rouge</span><span>Les Combes</span><span>Pouhon</span><span>Blanchimont</span><span>Bus Stop</span></div>
      <h2 style="margin:16px 0 6px">Throttle and brake</h2>${chart(880, 90, [{ pts: [1, 1, 1, 0, 0.6, 1, 1, 1, 0, 0.4, 1, 0.3, 0, 1, 1, 1, 0.2, 0, 0.8, 1], c: "#2FD27A", wd: 2 }, { pts: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0.4, 1, 0, 0, 0, 0.6, 1, 0, 0], c: "#FF6B6B", wd: 2 }])}</div>
    <div style="display:grid;gap:16px;align-content:start"><div class="panel"><h2>Where the time went</h2><table>${[["Sector 1", "+0.04"], ["Sector 2", "+0.51"], ["Sector 3", "+0.11"], ["Lap", "+0.658"]].map(([a, b]) => `<tr><td>${a}</td><td class="r mono bad">${b}</td></tr>`).join("")}</table>
      <div class="card2" style="margin-top:10px"><b class="acc">Biggest gap:</b> <span class="muted">Pouhon. The pole lap carries 12 km/h more through the middle of the corner.</span></div></div>
      <div class="panel"><h2>Your laps from the game</h2><div class="muted" style="font:500 13px B">Sent from the race game with one click. They stay on this computer.</div><div style="display:grid;gap:6px;margin-top:8px">${kv("Spa · 2026 car", "1:41.220")}${kv("Monza · 2026 car", "1:21.840")}${kv("Suzuka · 2005 car", "1:32.350")}</div></div></div>
    <div class="panel" style="grid-column:span 2"><h2>Corner by corner · slowest point</h2><table><tr><th>Corner</th>${["La Source", "Eau Rouge", "Les Combes", "Bruxelles", "Pouhon", "Campus", "Blanchimont", "Bus Stop"].map((c) => `<th class="r">${c}</th>`).join("")}</tr>
      <tr><td><span class="dot" style="background:#7FC4FF"></span> Pole lap</td>${[68, 289, 142, 96, 223, 118, 305, 74].map((v) => `<td class="r mono">${v}</td>`).join("")}</tr>
      <tr><td><span class="dot" style="background:#FFB547"></span> You</td>${[[67, 0], [284, 1], [140, 0], [97, 2], [211, 1], [116, 0], [301, 0], [72, 0]].map(([v, b]) => `<td class="r mono ${b === 1 ? "bad" : b === 2 ? "good" : ""}">${v}</td>`).join("")}</tr></table><div class="muted" style="font:600 12px B;margin-top:6px">km/h at the slowest point of each corner</div></div>
  </div>${concept("Concept render · your lap on the live timing site")}`;

// 16 · loading-screen trivia
S.trivia = () => `${bg("l6-replay3d", "blur(14px) brightness(.28)")}
  <div style="position:absolute;left:0;right:0;top:120px;display:grid;justify-items:center;gap:20px">
    <div class="brand" style="font-size:40px">RACELIMIT<small>RACE</small></div>
    <div style="display:grid;place-items:center">${trackSvg(sing, 380, 240, { c: "#FFB547", wd: 14, wd2: 4 })}</div>
    <b style="font:700 30px BC">Marina Bay · Singapore</b>
    <div class="panel" style="width:760px;background:rgba(19,22,29,.95)"><div class="lbl2 acc">Quick question while it loads</div><div style="font:600 20px/1.4 B;margin:6px 0 12px">Why do drivers lose up to 3 kg of body weight during the Singapore race?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${[["A", "The heat and humidity in the cockpit", 1], ["B", "The night-time cold"], ["C", "The bumpy street surface"], ["D", "Extra fuel weight"]].map(([k, t, ok]) => `<div class="card2" style="${ok ? "box-shadow:inset 0 0 0 2px #2FD27A" : ""}"><b class="mono acc">${k}</b> ${t}${ok ? ` <span class="good">✓</span>` : ""}</div>`).join("")}</div>
      <div class="muted" style="font:500 13px B;margin-top:10px">Right! The cockpit gets above 50 °C, and drivers sweat it out over two hours. Streak: 7 correct.</div></div>
    <div style="width:760px"><div style="height:6px;border-radius:3px;background:#2A2F3B"><i style="display:block;height:100%;width:72%;background:#FFB547;border-radius:3px"></i></div><div class="muted" style="font:600 12px B;margin-top:6px">Building the circuit… 72%</div></div></div>
  ${concept("Concept render · loading-screen trivia")}`;

// 17 · teammates with a friend
S.teammates = () => `${bg("l6-team")}
  ${pin(AA["l6-team"], "mate", `<span class="dot" style="background:#FFA51F"></span> <b>SAM</b> <span class="muted" style="font:600 12px B">your teammate (friend) · P4</span>`, { up: 60, dx: -60 })}
  ${note("Teammates with a friend", "Same team, same garage", ["Race with a friend as teammates: same livery, shared constructors' points, and you see each other's data.", "Give each other team orders over the radio ('let me by, I'm faster') or race it out.", "Online with a room code, or in split-screen."])}
  ${box("right:18px;top:18px", 320, `<div class="lbl2" style="margin-bottom:8px">RACELIMIT · constructors</div><div style="display:grid;gap:6px">${kv("You", "P3 · 18 pts")}${kv("Sam", "P4 · 12 pts")}${kv("Team", `<span class="acc">30 pts · 2nd</span>`)}</div>
    <div class="lbl2" style="margin:12px 0 6px">Ask Sam to</div><div style="display:grid;gap:6px">${[["1", "Let me by"], ["2", "Hold position"], ["3", "Defend from BRD"]].map(([k, t]) => `<div class="row">${key(k)}<span style="font:600 13px B">${t}</span></div>`).join("")}</div>`)}
  ${hb([gear(7, 266), t2("P3 · Lap 18", "teammate 0.6 s behind"), t2("Team", "2nd in constructors")])}
  ${concept("Concept render · teammates with a friend")}`;

// 18 · collectible cards
const cardImg = ["l8-classic", "l6-team", "s-broadcast", "l6-concept", "s-night", "l6-era09", "s-crowd", "l6-donuts"];
S.cards = () => top("Collection · <b>Cards</b>", `<span class="chip">43 of 120</span>`, "s-podium") + `
  <div class="grid" style="grid-template-columns:repeat(4,1fr);height:727px">
    ${[["BRD", "Driver", "VELOCE", "rare", 0], ["Your first win", "Moment", "Monza", "epic", 1], ["AXIOM 2026", "Car", "full livery", "common", 2], ["Fan car", "Concept", "won the concept cup", "epic", 3], ["Singapore at night", "Circuit", "", "rare", 4], ["Boost button", "Era gadget", "2009", "common", 5], ["SLV", "Driver", "NOVA", "rare", 6], ["Donuts", "Moment", "Singapore", "legend", 7]].map(([a, b, c, r, img]) => { const col = { common: "#9AA3B2", rare: "#5AA9FF", epic: "#B98CFF", legend: "#FFB547" }[r]; return `<div class="panel" style="padding:10px;box-shadow:inset 0 0 0 2px ${col}55;display:grid;gap:8px"><div style="height:170px;border-radius:8px;background:url(bg/${cardImg[img]}.png) center/cover"></div><div class="row" style="justify-content:space-between"><b style="font:700 20px BC">${a}</b><span class="pill" style="background:#1C2230;color:${col}">${r.toUpperCase()}</span></div><div class="muted" style="font:600 12px B">${b}${c ? " · " + c : ""}</div></div>`; }).join("")}
  </div>${concept("Concept render · collectible cards")}`;

// 19 · voice commands
S.voice = () => `${bg("s-gforce")}
  <div class="hudbox" style="left:50%;top:60px;transform:translateX(-50%);width:640px;padding:14px 18px"><div class="row"><span class="pill" style="background:#3A1218;color:#FF8A8A">● MIC</span><span class="muted" style="font:600 12px B">hold ${key("V")} to talk</span></div>
    <div style="display:flex;gap:3px;align-items:center;height:40px;margin:8px 0">${Array.from({ length: 60 }, (_, i) => `<i style="flex:1;height:${8 + Math.abs(Math.sin(i * 0.7) * 26 + Math.sin(i * 2.1) * 6)}px;border-radius:2px;background:#FFB547"></i>`).join("")}</div>
    <div style="display:grid;gap:8px;font:600 16px B"><div><span class="acc">You:</span> "What's the gap to Brandt?"</div><div><span class="blue">Engineer:</span> "1.4 seconds, and he's on older tyres. He's losing two tenths a lap."</div></div></div>
  ${note("Voice commands", "Talk to your engineer", ["Hold a button and ask: 'gap?', 'box this lap', 'how are the tyres?', 'what's the weather doing?'.", "Speech is recognised in the browser, on your computer.", "Keyboard shortcuts still work for everything."], "left:18px;bottom:110px", 400)}
  ${box("right:18px;bottom:110px", 300, `<div class="lbl2" style="margin-bottom:6px">Things you can say</div><div style="display:grid;gap:5px;font:600 13px B">${["\"Box this lap\"", "\"Gap ahead / behind\"", "\"Tyres?\"", "\"Mode push\"", "\"Weather?\""].map((t) => `<div>${t}</div>`).join("")}</div>`)}
  ${concept("Concept render · voice commands")}`;

mount(S);
export default S;

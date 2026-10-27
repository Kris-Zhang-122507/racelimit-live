import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, tag, drv, chart, trackSvg, mount, TEAMS, clone, CAR } from "./common.js";

const S = {};

// 1 · weather that changes mid-race
S.weather = () => `${bg("spa-eau", "brightness(.72) saturate(.7) contrast(1.05)")}<div class="rain"></div>
  <svg style="position:absolute;inset:0" width="1600" height="900"><defs><radialGradient id="pud"><stop offset="0" stop-color="#9FB4CC" stop-opacity=".5"/><stop offset="1" stop-color="#9FB4CC" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="520" cy="700" rx="190" ry="26" fill="url(#pud)"/><ellipse cx="1080" cy="640" rx="130" ry="18" fill="url(#pud)"/><ellipse cx="760" cy="790" rx="120" ry="16" fill="url(#pud)"/></svg>
  ${tag(520, 672, `${pill("STANDING WATER", "#10213A", "#7FC4FF")} <span class="muted" style="font:600 12px B">brake earlier here</span>`)}
  ${note("Weather that changes", "Rain on lap 18, drying by lap 30", ["Clouds roll in during the race. Rain starts light, then a dry line forms through the corners as cars clear the water.", "Puddles sit in the braking zones: aquaplane through them and you lose the brakes for a moment.", "Pit for inters too early and you lose time; too late and you're sliding off."])}
  ${box("right:18px;top:18px", 360, `<div class="lbl2" style="margin-bottom:8px">Rain radar · next 15 min</div>
    <div style="height:150px;border-radius:10px;background:radial-gradient(circle at 70% 40%,#2F6FB8 0 18%,#1F4E86 26%,transparent 42%),radial-gradient(circle at 40% 70%,#2A5E9E 0 10%,transparent 26%),#10141C;position:relative">
      <svg width="332" height="150" style="position:absolute;inset:0"><path d="M60,110 C90,40 160,30 210,60 C250,85 280,70 300,40" fill="none" stroke="#E8EAF0" stroke-width="3"/><circle cx="210" cy="60" r="6" fill="#FFB547"/><text x="220" y="58" fill="#FFB547" font-family="B" font-weight="600" font-size="12">YOU</text><path d="M290,24 l-40,18" stroke="#7FC4FF" stroke-width="2" marker-end="url(#a)"/></svg></div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:10px;text-align:center;font:600 11px B">${[["L16", "☁", "#9AA3B2"], ["L17", "☁", "#9AA3B2"], ["L18", "🌧", "#7FC4FF"], ["L20", "🌧", "#7FC4FF"], ["L25", "🌦", "#C3C9D4"], ["L30", "☀", "#FFB547"]].map(([l, i, c]) => `<div class="card2" style="padding:6px 0"><div style="font-size:18px;color:${c}">${i}</div>${l}</div>`).join("")}</div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Track", `<span class="blue">damp → wet</span>`)}${kv("Best tyre now", `<span class="pill" style="background:#14361F;color:#6EE7A8">INTER</span>`)}${kv("Crossover to slicks", "≈ lap 29")}</div>`)}
  ${hb([gear(4, 162), t2(`Grip <span class="mono blue">64%</span>`, "wet patch at Turn 1"), `${pill("SLICKS ON A WET TRACK", "#2A1A10", "#FFB060")}<div style="font:600 11px B;color:#9AA3B2">box for inters? radio says: your call</div>`])}
  ${concept("Concept render · weather that changes mid-race")}`;

// 2 · track rubbering in
S.rubber = () => `${bg("spa-top")}
  <svg style="position:absolute;inset:0" width="1600" height="900"><path d="M520,140 C650,280 900,380 1000,520 C1060,620 990,720 880,745 C760,770 560,735 300,690" fill="none" stroke="#121317" stroke-width="22" stroke-linecap="round" opacity=".6"/>
    ${Array.from({ length: 70 }, (_, i) => { const t = i / 70, x = i < 40 ? 1050 + Math.sin(i * 1.7) * 18 + (t * 40) : 480 + (i - 40) * 12 + Math.sin(i * 2.3) * 10, y = i < 40 ? 560 + t * 380 + Math.cos(i * 2.9) * 14 : 790 + Math.cos(i * 3.1) * 12; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + (i % 3)).toFixed(0)}" fill="#1A1B20" opacity=".85"/>`; }).join("")}</svg>
  ${tag(780, 330, `${pill("RUBBER LINE", "#1C2230", "#E8EAF0")} <span class="good" style="font:600 12px B">+4% grip</span>`)}
  ${tag(1130, 600, `${pill("MARBLES", "#2A1A10", "#FFB060")} <span class="bad" style="font:600 12px B">−25% grip off line</span>`, "translate(0,-50%)")}
  ${note("Track rubbering in", "The track gets faster all weekend", ["Every lap lays rubber on the racing line. It shows as a darker line and gives a little more grip each session.", "Off the line, bits of worn tyre (marbles) collect. Run wide on them and you slide.", "Rain washes the rubber away, so the track is 'green' again after a shower."])}
  ${box("right:18px;top:18px", 380, `<div class="lbl2" style="margin-bottom:8px">Track grip over the weekend</div>
    ${chart(350, 140, [{ pts: [0.1, 0.22, 0.31, 0.38, 0.46, 0.5, 0.58, 0.62, 0.66, 0.74, 0.78, 0.82, 0.84], c: "#6EE7A8" }], { extra: `<rect x="175" y="0" width="30" height="140" fill="#5AA9FF" opacity=".12"/><text x="168" y="134" fill="#7FC4FF" font-family="B" font-weight="600" font-size="11">shower</text>` })}
    <div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2;margin-top:4px"><span>FP1</span><span>FP2</span><span>FP3</span><span>Quali</span><span>Race</span></div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Now (Quali)", `<span class="good">+1.4 s a lap vs FP1</span>`)}${kv("Marbles", "heavy at Turns 1, 5, 9")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Track evolution</div>${tg(["Off", "Real", "Fast (×3)"], 1)}`)}
  ${concept("Concept render · track rubbering in")}`;

// 3 · debris and failures
const shard = (x, y, r, s = 1) => `<polygon points="${[[0, 0], [26, 4], [34, 14], [8, 18]].map(([a, b]) => `${x + a * s},${y + b * s}`).join(" ")}" fill="${["#FFA51F", "#16171B", "#C8C8C8"][r % 3]}" transform="rotate(${r * 37} ${x} ${y})" stroke="#0007"/>`;
S.debris = () => `${bg("monza-chase")}
  <svg style="position:absolute;inset:0" width="1600" height="900">${[[700, 520, 1, .8], [760, 545, 2, .6], [880, 560, 4, 1], [640, 610, 5, 1.2], [930, 640, 7, 1.3], [800, 600, 8, .7], [560, 700, 9, 1.6], [1010, 720, 11, 1.4]].map(([x, y, r, s]) => shard(x, y, r, s)).join("")}
    <rect x="1010" y="520" width="80" height="34" fill="#16171B" stroke="#FFA51F" stroke-width="3" transform="rotate(-12 1050 537)"/></svg>
  ${tag(1050, 505, `${pill("FRONT WING ENDPLATE", "#2A1A10", "#FFB060")} <span class="muted" style="font:600 12px B">stays on track</span>`)}
  ${note("Debris and failures", "Bits come off, and stay off", ["Hit a kerb or a car and pieces break off. They stay on the track until marshals clear them, and running over one can cut a tyre.", "Big debris brings a yellow flag, a virtual safety car or a safety car.", "Optional failures give warnings first, so you can nurse the car to the end."])}
  ${box("right:18px;top:18px", 360, `<div class="lbl2" style="margin-bottom:8px">Car health</div>
    <div style="display:grid;gap:8px">${[["Front wing", 62, "#FFB060", "left endplate gone · −8% front grip"], ["Oil temp", 84, "#FF8A8A", "128° and rising · lift and coast to cool"], ["Gearbox", 30, "#6EE7A8", "fine"], ["Brakes", 45, "#6EE7A8", "fine"]].map(([n, v, c, d]) => `<div><div class="kv"><span>${n}</span><b style="color:${c}">${d.split(" · ")[0]}</b></div><div style="height:6px;border-radius:3px;background:#2A2F3B;margin:4px 0"><i style="display:block;height:100%;width:${v}%;background:${c};border-radius:3px"></i></div>${d.includes("·") ? `<div class="muted" style="font:600 11px B">${d.split(" · ")[1]}</div>` : ""}</div>`).join("")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Failures</div>${tg(["Off", "Rare, with warnings", "Realistic"], 1)}`)}
  <div class="hudbox" style="left:18px;bottom:16px;display:flex;align-items:center;gap:12px"><div style="width:46px;height:46px;border-radius:6px;background:#F2C230"></div>${t2("YELLOW · sector 2", "debris on the racing line · no overtaking")}</div>
  ${hb([gear(7, 286), t2(`Oil <span class="mono bad">128°</span>`, "rising 2° a lap"), `${pill("NURSE IT HOME", "#2A1A10", "#FFB060")}<div style="font:600 11px B;color:#9AA3B2">short-shift 500 rpm early</div>`])}
  ${concept("Concept render · debris and failures")}`;

// 4 · night races
S.night = () => `${bg("sing-chase", "contrast(1.08)")}
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 10%,rgba(255,230,180,.22),transparent 40%),radial-gradient(ellipse at 80% 8%,rgba(255,230,180,.18),transparent 35%)"></div>
  ${note("Night races", "Floodlights, glare and reflections", ["Singapore, Las Vegas, Bahrain, Jeddah and Qatar run under lights. Hundreds of light towers line the track.", "The lights bounce off the car and the track. Wet patches shine like mirrors.", "Sparks, brake glow and the lit-up city stand out more at night."])}
  ${box("right:18px;top:18px", 340, `<div class="lbl2" style="margin-bottom:8px">Night settings</div>
    <div style="display:grid;gap:10px">${sl("Light brightness", 72, "72%")}${sl("Glare and bloom", 45, "45%")}${sl("Reflections", 80, "high")}</div>
    <div class="lbl2" style="margin:12px 0 6px">City lights</div>${tg(["Full skyline", "Fewer (faster)", "Off"], 0)}
    <div class="lbl2" style="margin:12px 0 6px">Race start</div>${tg(["At night", "Sunset (like Abu Dhabi)", "Day"], 0)}`)}
  ${hb([gear(5, 214), t2(`Track <span class="mono">31°</span>`, "cooler than day: more grip"), t2("Marina Bay", "lap 12 / 62 · under the lights")])}
  ${concept("Concept render · night races")}`;

// 5 · marshals and flag panels
const marshal = (x, y, c) => `<g transform="translate(${x} ${y})"><rect x="-22" y="-60" width="44" height="60" rx="4" fill="#E8EAF0" opacity=".9"/><rect x="-18" y="-56" width="36" height="20" rx="2" fill="${c}"/><circle cx="40" cy="-50" r="7" fill="#F2B98A"/><rect x="33" y="-42" width="14" height="30" rx="4" fill="#FF7A1A"/><rect x="34" y="-12" width="5" height="18" fill="#2A2F3B"/><rect x="41" y="-12" width="5" height="18" fill="#2A2F3B"/><line x1="46" y1="-40" x2="62" y2="-74" stroke="#8C939E" stroke-width="3"/><rect x="62" y="-96" width="40" height="28" fill="${c}"/></g>`;
S.marshals = () => `${bg("silver-far")}
  <svg style="position:absolute;inset:0" width="1600" height="900">${marshal(1240, 470, "#F2C230")}${marshal(380, 470, "#2FD27A")}</svg>
  ${tag(1250, 360, `${pill("POST 14 · YELLOW", "#2A2310", "#F2C230")}`)}
  ${tag(390, 360, `${pill("POST 13 · GREEN", "#14361F", "#6EE7A8")} <span class="muted" style="font:600 12px B">end of the yellow zone</span>`)}
  ${note("Marshals and flag panels", "Real people at every post", ["Marshals stand at posts all round the track and hold out flags. Next to each post an LED panel shows the same colour.", "Flags are shown as steady colours, never flashing or waving fast.", "After a crash, marshals run out with brooms and recovery trucks."], "left:18px;top:18px")}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">What the colours mean</div>
    <div style="display:grid;gap:7px">${[["#F2C230", "Yellow", "danger ahead · slow, no overtaking"], ["#2FD27A", "Green", "danger cleared"], ["#5AA9FF", "Blue", "let the faster car through"], ["#E8002D", "Red", "session stopped"], ["#E8EAF0", "White", "slow car on track"]].map(([c, n, d]) => `<div class="row"><i style="width:30px;height:20px;border-radius:3px;background:${c};flex:none"></i><div><b>${n}</b> <span class="muted" style="font:600 12px B">${d}</span></div></div>`).join("")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Flags shown as</div>${tg(["Marshals + panels", "Panels only", "HUD only"], 0)}`)}
  ${concept("Concept render · marshals and flag panels")}`;

// 6 · a full race weekend
const sess = [["FP1", "Fri 12:30", "done", "#6EE7A8"], ["FP2", "Fri 16:00", "done", "#6EE7A8"], ["FP3", "Sat 11:30", "now", "#FFB547"], ["Quali", "Sat 15:00", "", "#9AA3B2"], ["Race", "Sun 14:00", "", "#9AA3B2"]];
S.weekend = () => top("Race weekend · <b>Silverstone</b>", `<span class="chip">Parc fermé starts at qualifying</span><span class="btn primary">Start FP3 →</span>`, "silver-far") + `
  <div class="grid" style="grid-template-columns:1fr 1fr 1fr 1fr 1fr;height:727px">
    ${sess.map(([n, t, s, c]) => `<div class="panel" style="${s === "now" ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b style="font:700 26px BC">${n}</b><span class="pill" style="background:#1C2230;color:${c}">${s === "done" ? "DONE" : s === "now" ? "NEXT" : "LOCKED"}</span></div><div class="muted mono">${t}</div></div>`).join("")}
    <div class="panel" style="grid-column:span 3"><h2>FP3 run plan</h2>
      <table><tr><th>Run</th><th>What to do</th><th>Tyres</th><th class="r">Laps</th><th>You learn</th></tr>
      ${[["1", "Setup check: rear wing −1", "Medium · used", "4", "Is the car stable in Copse?"], ["2", "Quali sim: push lap", "Soft · new", "3", "Your quali pace"], ["3", "Long run, race fuel", "Hard · new", "10", "Tyre wear per lap"], ["4", "Practice starts", "—", "2", "Clutch bite point"]].map(([a, b, c2, d, e], i) => `<tr${i === 1 ? ` style="background:#1E1A12"` : ""}><td class="mono">${a}</td><td>${b}</td><td>${c2}</td><td class="r mono">${d}</td><td class="muted">${e}</td></tr>`).join("")}</table>
      <div class="lbl2" style="margin:14px 0 6px">What FP1 and FP2 told you</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${[["Balance", "understeer in slow corners", "#FFB060"], ["Long-run pace", "1:29.8 · P6", "#6EE7A8"], ["Tyre wear", "soft −0.12 s per lap", "#C3C9D4"]].map(([a, b, c]) => `<div class="card2"><div class="lbl2">${a}</div><b style="color:${c}">${b}</b></div>`).join("")}</div></div>
    <div class="panel" style="grid-column:span 2"><h2>Parc fermé</h2>
      <div style="display:grid;gap:8px">${["Rear wing", "Front wing", "Ride height", "Springs", "Gearbox ratios"].map((x) => kv(x, `<span class="acc">locks at quali 🔒</span>`)).join("")}${kv("Brake bias, diff, engine modes", `<span class="good">free all weekend</span>`)}</div>
      <div class="muted" style="margin-top:10px;font:500 13px B">Change a locked part after qualifying and you start from the pit lane, like the real rules.</div>
      <div class="lbl2" style="margin:14px 0 6px">Weekend length</div>${tg(["Full (3 practices)", "Short (1 practice)", "Sprint weekend", "Race only"], 0)}</div>
  </div>${concept("Concept render · full race weekend")}`;

// 7 · tyre allocation
const set = (c, st, laps) => { const col = { S: "#E8002D", M: "#F2C230", H: "#E8EAF0" }[c]; return `<div class="card2" style="text-align:center;padding:10px 4px;opacity:${st === "gone" ? .35 : 1}"><div style="width:52px;height:52px;margin:0 auto 6px;border-radius:50%;background:#16181D;box-shadow:inset 0 0 0 7px ${col},inset 0 0 0 13px #16181D,inset 0 0 0 15px #30343E;display:grid;place-items:center;font:700 16px BC;color:${col}">${c}</div><div style="font:600 12px B">${st === "new" ? "New" : st === "gone" ? "Returned" : `${laps} laps`}</div></div>`; };
S.tyres = () => top("Race weekend · <b>Tyre allocation</b>", `<span class="chip">13 sets for the weekend</span>`, "silver-grid") + `
  <div class="grid" style="grid-template-columns:1.5fr 1fr;height:727px">
    <div class="panel"><h2>Your sets</h2>
      ${[["Soft", "S", ["gone", "gone", "used:3", "used:4", "new", "new", "new", "new"]], ["Medium", "M", ["used:6", "new", "new"]], ["Hard", "H", ["new", "new"]]].map(([n, c, sets]) => `<div class="lbl2" style="margin:12px 0 6px">${n} · ${sets.filter((s) => s !== "gone").length} left</div><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:8px">${sets.map((s) => set(c, s.split(":")[0], s.split(":")[1])).join("")}</div>`).join("")}
      <div class="lbl2" style="margin:16px 0 6px">Plan</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${[["FP3", "2 soft (used)"], ["Q1", "1 new soft"], ["Q2", "1 new soft"], ["Q3", "2 new soft"]].map(([a, b]) => `<div class="card2"><b>${a}</b><div class="muted" style="font:600 12px B">${b}</div></div>`).join("")}</div>
      <div class="lbl2" style="margin:16px 0 6px">Race: must use</div>${tg(["2 different dry compounds", "1 medium and 1 hard set kept for the race"], 0)}</div>
    <div class="panel"><h2>Why it matters</h2>
      <div style="display:grid;gap:10px;font:500 14px/1.45 B;color:#C3C9D4"><div>You only get a fixed number of sets, like the real teams. Use too many softs in practice and you'll go into Q3 on used ones.</div><div>New tyres are about <b class="good">0.4 s</b> a lap faster for the first two laps. Used ones lose that.</div><div>Sets you've finished with go back to the supplier and can't be used again.</div></div>
      <div class="card2" style="margin-top:14px;box-shadow:inset 0 0 0 1px #FFB060"><div class="lbl2" style="color:#FFB060">Engineer</div><div style="font:600 14px B;margin-top:4px">"If we make Q3 we only have 2 new softs. Skip the second soft run in FP3?"</div><div class="row" style="margin-top:8px"><span class="btn primary">Yes, save a set</span><span class="btn">No, keep the plan</span></div></div>
      <div class="lbl2" style="margin:14px 0 6px">Allocation</div>${tg(["Real (13 sets)", "Generous", "Unlimited"], 0)}</div>
  </div>${concept("Concept render · tyre allocation")}`;

// 8 · rule sets from other eras
S.rules = () => top("Custom race · <b>Rule set</b>", `<span class="btn primary">Use these rules</span>`, "monza-chase") + `
  <div class="grid" style="grid-template-columns:repeat(4,1fr);height:727px">
    ${[["2005", "Refuelling era", "Stop for fuel and tyres. Light cars on a 3-stop plan fly; heavy ones save a stop.", "#FFB547", true], ["1998", "Grooved tyres, no DRS", "Narrow cars, tyres with grooves, no DRS or battery. Overtaking is hard.", "#7FC4FF"], ["2014", "Hybrid start", "Turbo V6 and battery, DRS, no refuelling. Fuel limited to 100 kg.", "#6EE7A8"], ["2026", "Today", "Active aero, 50/50 power split, overtake mode instead of DRS.", "#C3C9D4"]].map(([y, n, d, c, on]) => `<div class="panel" style="${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><div class="mono" style="font-size:40px;color:${c};line-height:1">${y}</div><b style="font:700 22px BC">${n}</b><div class="muted" style="font:500 13px B;margin-top:6px">${d}</div></div>`).join("")}
    <div class="panel" style="grid-column:span 2"><h2>Refuelling (2005 rules)</h2>
      <div style="display:grid;gap:10px">${sl("Fuel flow", 60, "12 L/s")}${sl("Fuel at the start", 35, "3 stops")}</div>
      <svg width="100%" height="120" viewBox="0 0 640 120" style="margin-top:12px">${[[0, 200, "#E8002D"], [200, 420, "#F2C230"], [420, 640, "#E8002D"]].map(([a, b, c]) => `<rect x="${a}" y="40" width="${b - a - 4}" height="30" rx="5" fill="${c}" opacity=".85"/>`).join("")}${[200, 420].map((x) => `<line x1="${x - 2}" x2="${x - 2}" y1="26" y2="84" stroke="#E8EAF0" stroke-width="2"/><text x="${x - 2}" y="104" text-anchor="middle" fill="#C3C9D4" font-family="B" font-weight="600" font-size="12">stop · 8.2 s fuel</text>`).join("")}<text x="0" y="20" fill="#9AA3B2" font-family="B" font-weight="600" font-size="12">Your plan: 3 stints</text></svg>
      <div class="muted" style="font:500 13px B">Every 10 kg of fuel costs about 0.3 s a lap, so a light car is faster but has to stop again.</div></div>
    <div class="panel" style="grid-column:span 2"><h2>Mix your own rules</h2>
      <div style="display:grid;gap:10px">${[["Reverse grid", ["Off", "Top 8", "Top 10", "Whole grid"], 0], ["Points", ["Today", "2003 (8 places)", "Double last race", "Fastest lap +1"], 0], ["DRS / overtake", ["Off", "DRS zones", "Overtake mode", "Both"], 2], ["Tyre rule", ["Free", "Must use 2 compounds", "One tyre all race"], 1], ["Refuelling", ["Banned", "Allowed"], 1], ["Safety car", ["Off", "Real", "Lots"], 1]].map(([n, o, on]) => `<div><div class="lbl2" style="margin-bottom:4px">${n}</div>${tg(o, on)}</div>`).join("")}</div></div>
  </div>${concept("Concept render · rule sets from other eras")}`;

// 9 · driving school
const cone = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><polygon points="-9,0 9,0 3,-26 -3,-26" fill="#FF7A1A"/><rect x="-6" y="-16" width="12" height="4" fill="#F2F3F5"/><rect x="-12" y="0" width="24" height="4" fill="#1A1A1A"/></g>`;
S.school = () => `${bg("spa-chase")}
  <svg style="position:absolute;inset:0" width="1600" height="900">${cone(470, 640, 1.6)}${cone(560, 560, 1.2)}${cone(1010, 470, .7)}${cone(1050, 455, .6)}
    <path d="M430,880 C520,720 640,560 820,480 C930,440 1060,430 1180,440" fill="none" stroke="#5AA9FF" stroke-width="10" stroke-dasharray="20 14" opacity=".8"/>
    <rect x="610" y="520" width="200" height="16" rx="3" fill="#E8002D" opacity=".75" transform="skewX(-30)"/></svg>
  ${tag(600, 505, `${pill("BRAKE HERE", "#3A1218", "#FF8A8A")} <span class="muted" style="font:600 12px B">100 m board</span>`)}
  ${tag(1030, 430, `${pill("APEX", "#10213A", "#7FC4FF")}`)}
  ${note("Driving school", "Lesson 3 · La Source hairpin", ["Brake in a straight line at the red bar, turn in at the first cone, touch the apex cone, then let the car run out to the kerb.", "Each lesson teaches one corner of the real circuit. Pass all of them to unlock the circuit's licence."])}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">Medals for this lesson</div>
    <div style="display:grid;gap:8px">${[["🥇", "Gold", "2.95 s", "#F2C230"], ["🥈", "Silver", "3.20 s", "#C9CED6"], ["🥉", "Bronze", "3.60 s", "#C98A4A"]].map(([i, n, t, c]) => `<div class="row" style="justify-content:space-between"><span style="font:600 14px B;color:${c}">${i} ${n}</span><b class="mono">${t}</b></div>`).join("")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Spa licence · 3 of 9 lessons</div>
    <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px">${Array.from({ length: 9 }, (_, i) => `<i style="height:10px;border-radius:3px;background:${i < 2 ? "#F2C230" : i === 2 ? "#FFB547" : "#2A2F3B"}"></i>`).join("")}</div>
    <div class="muted" style="font:600 12px B;margin-top:10px">Mistakes: missed apex −0.2 s · cone hit = fail</div>`)}
  ${hb([gear(2, 74), t2(`Attempt <span class="mono">3.08 s</span>`, "0.13 s off gold"), `${pill("APEX HIT", "#14361F", "#6EE7A8")}<div style="font:600 11px B;color:#9AA3B2">braked 6 m late</div>`])}
  ${concept("Concept render · driving school and licence tests")}`;

// 10 · daily challenge with share codes
S.daily = () => `${bg("zand-chase", "blur(6px) brightness(.45)")}` + top("Daily challenge · <b>Tuesday 27 October</b>", `<span class="chip">New challenge in 4 h 12 m</span>`, null) + `
  <div class="grid" style="grid-template-columns:1.2fr 1fr;height:727px;position:relative">
    <div class="panel" style="background:rgba(19,22,29,.92)"><div class="lbl2 acc">Today</div><div style="font:700 44px/1.05 BC;margin:4px 0 10px">Zandvoort in the rain, on mediums</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${[["Car", "2026 · RACELIMIT"], ["Track", "Zandvoort · wet"], ["Tyres", "Medium (slicks!)"], ["Goal", "1 clean lap"]].map(([a, b]) => `<div class="card2"><div class="lbl2">${a}</div><b>${b}</b></div>`).join("")}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px">${[["🥇", "1:31.40"], ["🥈", "1:33.00"], ["🥉", "1:35.50"]].map(([a, b]) => `<div class="card2" style="text-align:center"><div style="font-size:24px">${a}</div><b class="mono">${b}</b></div>`).join("")}</div>
      <div class="row" style="margin-top:18px"><span class="btn primary" style="height:48px;font-size:16px">Start challenge</span><span class="btn">3 tries left today</span></div>
      <div class="muted" style="margin-top:14px;font:500 13px B">Everyone in the world gets the same car, track and weather today. Your time turns into a short code you can send to friends.</div></div>
    <div class="panel" style="background:rgba(19,22,29,.92)"><h2>Friends today</h2>
      <table><tr><th>#</th><th>Name</th><th class="r">Time</th></tr>${[["1", "Kiri", "1:31.88", "🥈"], ["2", "You", "1:32.41", "🥈"], ["3", "Sam", "1:34.02", "🥈"], ["4", "Leo", "1:36.77", "—"]].map(([a, b, c, d], i) => `<tr${i === 1 ? ` style="background:#1E1A12"` : ""}><td class="mono">${a}</td><td>${b} <span style="font-size:12px">${d}</span></td><td class="r mono">${c}</td></tr>`).join("")}</table>
      <div class="lbl2" style="margin:16px 0 6px">Your code</div><div class="card2 mono" style="font-size:22px;letter-spacing:.08em;color:#FFB547">ZAN-27W-13241</div>
      <div class="row" style="margin-top:10px"><span class="btn">Copy code</span><span class="btn">Paste a friend's code</span></div>
      <div class="lbl2" style="margin:16px 0 6px">Your streak</div><div class="row">${Array.from({ length: 7 }, (_, i) => `<i style="width:34px;height:34px;border-radius:8px;display:grid;place-items:center;background:${i < 5 ? "#2A2310" : "#1C2230"};color:${i < 5 ? "#FFB547" : "#6B7383"};font:700 13px B;font-style:normal">${"MTWTFSS"[i]}</i>`).join("")}<b class="acc">5 days</b></div></div>
  </div>${concept("Concept render · daily challenge")}`;

// 11 · ghost and coach
S.ghost = () => `${bg("monza-chase")}
  ${clone("monza-chase", CAR["monza-chase"], 845, 412, 0.5, "hue-rotate(170deg) saturate(1.8) brightness(1.4)", 0.5)}
  ${tag(845, 388, `${pill("GHOST · your best", "#10213A", "#7FC4FF")} <span class="mono blue">−0.21</span>`)}
  ${note("Ghost and coach", "Race your best lap, then see where the time went", ["A see-through car drives your best lap. It never gets in the way.", "After the lap the coach lays the two laps over each other: speed, brake and throttle, corner by corner.", "Then it tells you the one corner where you lost the most."])}
  ${box("right:18px;top:18px", 470, `<div class="lbl2" style="margin-bottom:8px">This lap vs your best · Monza</div>
    ${chart(440, 120, [{ pts: [0.9, 0.95, 0.97, 0.4, 0.25, 0.6, 0.85, 0.92, 0.5, 0.42, 0.7, 0.96, 0.98, 0.55, 0.62, 0.9], c: "#7FC4FF", wd: 2 }, { pts: [0.9, 0.95, 0.96, 0.44, 0.3, 0.62, 0.86, 0.93, 0.46, 0.36, 0.66, 0.95, 0.98, 0.56, 0.64, 0.91], c: "#FFB547", wd: 2 }], { extra: `<rect x="230" y="0" width="60" height="120" fill="#FF6B6B" opacity=".12"/>` })}
    <div style="display:flex;gap:14px;font:600 11px B;margin:6px 0"><span class="blue">— best 1:21.84</span><span class="acc">— this lap 1:22.05</span><span class="bad">▮ lost 0.17 s</span></div>
    <div class="lbl2" style="margin:8px 0 4px">Time gained and lost</div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;text-align:center;font:600 12px B">${[["T1", "+0.02", 1], ["T4", "−0.03", 0], ["Lesmo 1", "+0.04", 1], ["Ascari", "+0.17", 1], ["Parab.", "−0.05", 0], ["Total", "+0.21", 1]].map(([a, b, bad]) => `<div class="card2" style="padding:6px 2px"><div class="muted">${a}</div><b class="${bad ? "bad" : "good"} mono">${b}</b></div>`).join("")}</div>
    <div class="card2" style="margin-top:10px;box-shadow:inset 0 0 0 1px #FFB547"><b class="acc">Coach:</b> at Ascari you braked 12 m earlier and got back on the throttle 0.2 s later. Try braking at the 100 m board.</div>`)}
  ${hb([gear(8, 331), t2(`Delta <span class="mono bad">+0.21</span>`, "to your best"), t2("Sector 3", "ghost 18 m ahead")])}
  ${concept("Concept render · ghost and coach")}`;

// 12 · broadcast graphics
const tower = [["1", "OKA", "AXIOM", "Leader"], ["2", "BRD", "VELOCE", "+1.204"], ["3", "YOU", "RACELIMIT", "+1.877"], ["4", "SLV", "NOVA", "+4.310"], ["5", "ISH", "KESTREL", "+6.022"], ["6", "VRG", "HALCYON", "+9.551"], ["7", "DEL", "VORTEX", "+11.04"], ["8", "KAI", "ORBITA", "+13.87"], ["9", "MOR", "MERIDIAN", "+15.20"], ["10", "PEL", "BRAVO", "+18.66"]];
S.broadcast = () => `${bg("monaco-chase")}
  <div class="hudbox" style="left:18px;top:18px;width:250px;padding:0;overflow:hidden"><div style="background:#FFB547;color:#17120A;padding:6px 12px;font:700 16px BC;letter-spacing:.06em">LAP 34 / 71</div>
    ${tower.map(([p, c, t, g], i) => `<div class="row" style="padding:5px 12px;gap:8px;${i === 2 ? "background:#2A2310;" : ""}border-top:1px solid #FFFFFF10"><b class="mono" style="width:20px">${p}</b><i style="width:4px;height:18px;background:${TEAMS[t]};border-radius:2px"></i><b style="font:700 17px BC;width:44px">${c}</b><span class="mono" style="margin-left:auto;font-size:13px;color:#C3C9D4">${g}</span></div>`).join("")}</div>
  <div class="hudbox" style="left:50%;bottom:24px;transform:translateX(-50%);display:flex;gap:0;padding:0;overflow:hidden">
    <div style="padding:10px 18px;background:#5B1C22"><div class="lbl2" style="color:#FFB0B0">Battle for P2</div><b style="font:700 26px BC">BRD vs YOU</b></div>
    <div style="padding:10px 18px;display:grid;align-content:center"><div class="lbl2">Gap</div><b class="mono" style="font-size:22px">0.673</b></div>
    <div style="padding:10px 18px;display:grid;align-content:center"><div class="lbl2">Closing</div><b class="mono good" style="font-size:22px">−0.18 /lap</b></div>
    <div style="padding:10px 18px;display:grid;align-content:center"><div class="lbl2">Tyres</div><b>M 12 laps · S 4 laps</b></div></div>
  <div class="hudbox" style="right:18px;top:18px;width:240px"><div class="lbl2">Speed trap</div><div class="row" style="justify-content:space-between;margin-top:6px"><b style="font:700 20px BC">${drv("SLV")}</b><b class="mono" style="font-size:22px">352.4</b></div><div class="muted" style="font:600 12px B">km/h · fastest of the race</div></div>
  <div class="hudbox" style="right:18px;top:120px;width:240px"><div class="lbl2">Pit stop</div><div class="row" style="justify-content:space-between;margin-top:6px"><b style="font:700 20px BC">${drv("ISH")}</b><b class="mono" style="font-size:22px">2.4 s</b></div><div class="muted" style="font:600 12px B">Medium → Hard</div></div>
  ${note("Broadcast graphics", "Watch it like it's on TV", ["The same tower, battle and speed-trap graphics as your live timing site, laid over the TV cameras.", "Turns on with the TV camera, in replays and in spectator mode."], "left:300px;top:18px", 420)}
  ${concept("Concept render · broadcast graphics")}`;

// 13 · split-screen
S.split = () => `<div style="position:absolute;left:0;top:0;width:1600px;height:448px;overflow:hidden">${bg("spa-chase")}${hb([gear(7, 268), t2("P3 · Lap 6/12", "+0.84 to P2 (Player 2)"), t2("Player 1", "keyboard")], "left:18px;bottom:12px")}<div class="hudbox" style="right:18px;top:12px"><b style="font:700 20px BC;color:#FFB547">PLAYER 1</b></div></div>
  <div style="position:absolute;left:0;top:452px;width:1600px;height:448px;overflow:hidden">${bg("spa-tcam")}${hb([gear(8, 301), t2("P2 · Lap 6/12", "−0.84 ahead of Player 1"), t2("Player 2", "controller")], "left:18px;bottom:12px")}<div class="hudbox" style="right:18px;top:12px"><b style="font:700 20px BC;color:#7FC4FF">PLAYER 2</b></div></div>
  <div style="position:absolute;left:0;top:448px;width:1600px;height:4px;background:#0B0D12"></div>
  <div class="hudbox" style="left:50%;top:450px;transform:translate(-50%,-50%);display:flex;gap:16px;align-items:center;z-index:6"><b style="font:700 18px BC;letter-spacing:.06em">SPLIT-SCREEN</b>${tg(["Top / bottom", "Side by side"], 0)}${tg(["AI cars: 18", "Catch-up off"], [0])}</div>
  ${concept("Concept render · split-screen on one PC")}`;

// 14 · radio choices
S.radio = () => `${bg("spa-cockpit")}
  <div class="hudbox" style="left:50%;top:70px;transform:translateX(-50%);width:640px;padding:16px 18px"><div class="row" style="justify-content:space-between"><div class="lbl2" style="color:#FFB547">Team radio · Engineer</div><span class="mono muted" style="font-size:12px">answer in 8 s</span></div>
    <div style="font:600 19px/1.4 B;margin:8px 0 12px">"Rain in 3 laps. Box this lap for inters, or stay out and gamble?"</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${[["1", "Box this lap", "safe · lose 6 s now"], ["2", "Stay out", "gamble · gain if it stays light"], ["3", "Your call next lap", "decide later"]].map(([k, a, b], i) => `<div class="card2" style="${i === 0 ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}"><div class="row"><span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">${k}</span><b>${a}</b></div><div class="muted" style="font:600 12px B;margin-top:4px">${b}</div></div>`).join("")}</div>
    <div style="height:4px;border-radius:2px;background:#2A2F3B;margin-top:12px"><i style="display:block;height:100%;width:62%;background:#FFB547;border-radius:2px"></i></div></div>
  ${note("Radio choices", "Your answer changes the race", ["The engineer asks real questions: box or stay out, push or save tyres, let your teammate by.", "Answer with 1, 2 or 3 (or a wheel button). No answer means the engineer decides.", "Questions can be read out or shown only."], "left:18px;bottom:110px", 400)}
  ${box("right:18px;bottom:110px", 320, `<div class="lbl2" style="margin-bottom:6px">Earlier this race</div><div style="display:grid;gap:6px;font:600 13px B"><div>L12 · "Push now?" → <span class="good">Push</span> · gained P5</div><div>L19 · "Save tyres?" → <span class="acc">Engineer decided</span></div></div>`)}
  ${concept("Concept render · radio choices mid-race")}`;

mount(S);
export default S;

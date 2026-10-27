import { top, sl, tg, hb, gear, t2, note, box, concept, bg, kv, pill, tag, drv, chart, trackSvg, mount, TEAMS, clone, CAR } from "./common.js";

const S = {};
const tyreBox = (n, t, p, c) => `<div class="card2" style="text-align:center;box-shadow:inset 0 0 0 1px ${c}"><b>${n}</b><div class="mono" style="font-size:20px;color:${c}">${t}</div><div class="muted mono" style="font-size:12px">${p}</div></div>`;

// 1 · G-force and fatigue
S.gforce = () => `<div style="position:absolute;inset:-40px;background:url(bg/spa-cockpit.png) center/cover;transform:rotate(-4deg) translateX(-30px)"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 45%,rgba(0,0,0,.55) 80%,rgba(0,0,0,.85))"></div>
  ${note("G-force and fatigue", "Feel the corner through the camera", ["In a fast corner your head leans: the camera tilts and slides a little to the outside, like a real onboard.", "Around 5 g the edges of the screen darken slightly.", "In long races your reactions slow a touch near the end. All of this can be turned down or off."])}
  ${box("right:18px;top:18px", 300, `<div class="lbl2" style="margin-bottom:8px">G-meter</div>
    <svg width="270" height="200" viewBox="0 0 270 200"><circle cx="135" cy="100" r="90" fill="none" stroke="#262B36"/><circle cx="135" cy="100" r="60" fill="none" stroke="#262B36"/><circle cx="135" cy="100" r="30" fill="none" stroke="#262B36"/><line x1="45" x2="225" y1="100" y2="100" stroke="#262B36"/><line x1="135" x2="135" y1="10" y2="190" stroke="#262B36"/>
      <path d="M135,100 C110,100 70,95 60,110" fill="none" stroke="#FFB547" stroke-width="2" opacity=".6"/><circle cx="60" cy="110" r="8" fill="#FFB547"/><text x="70" y="140" fill="#FFB547" font-family="JB" font-weight="600" font-size="14">5.2 g</text><text x="230" y="104" fill="#6B7383" font-family="B" font-size="11">6g</text></svg>
    <div style="display:grid;gap:8px">${sl("Head movement", 60, "60%")}${sl("Dark edges", 35, "light")}${sl("Fatigue", 20, "low")}</div>`)}
  ${hb([gear(7, 296), t2(`Lateral <span class="mono acc">5.2 g</span>`, "Pouhon · left"), t2(`Neck <span class="mono">82%</span>`, "fresh: 34 laps to go")])}
  ${concept("Concept render · G-force and fatigue")}`;

// 2 · brake temperatures
S.brakes = () => `${bg("spa-chase", "brightness(.85)")}
  <div style="position:absolute;left:712px;top:527px;width:36px;height:46px;border-radius:50%;background:radial-gradient(#FFD08A,#FF6A1A 50%,transparent 72%);mix-blend-mode:screen"></div>
  <div style="position:absolute;left:853px;top:527px;width:36px;height:46px;border-radius:50%;background:radial-gradient(#FFD08A,#FF6A1A 50%,transparent 72%);mix-blend-mode:screen"></div>
  ${tag(800, 505, `${pill("BRAKES 980°", "#2A1A10", "#FFB060")}`)}
  ${note("Brake temperatures", "Cold brakes won't stop, hot ones fade", ["Carbon brakes work best between about 400 and 1000 °C.", "On the formation lap or behind the safety car they cool: brake gently at first or you'll lock up.", "Behind another car they overheat and start to fade. Open the brake ducts in the setup, or move over for cool air."])}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">Brakes on the dash</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${tyreBox("FL", "980°", "fading soon", "#FF8A3A")}${tyreBox("FR", "940°", "hot", "#FFB060")}${tyreBox("RL", "610°", "good", "#6EE7A8")}${tyreBox("RR", "590°", "good", "#6EE7A8")}</div>
    <div style="margin-top:10px;height:10px;border-radius:5px;background:linear-gradient(90deg,#5AA9FF 0,#5AA9FF 20%,#2FD27A 30%,#2FD27A 70%,#FF8A3A 82%,#FF4D4D)"></div><div style="display:flex;justify-content:space-between;font:600 10px B;color:#9AA3B2;margin-top:3px"><span>cold 200°</span><span>best 400–900°</span><span>fade 1100°</span></div>
    <div class="lbl2" style="margin:12px 0 6px">Brake ducts</div>${tg(["Closed", "Small", "Medium", "Large"], 2)}`)}
  ${hb([gear(6, 241), t2(`Front brakes <span class="mono acc">980°</span>`, "following VRG · 0.6 s"), `${pill("BRAKE FADE RISK", "#2A1A10", "#FFB060")}<div style="font:600 11px B;color:#9AA3B2">pull out of the tow for a lap</div>`])}
  ${concept("Concept render · brake temperatures")}`;

// 3 · tyre pressures
S.pressures = () => `${bg("suzuka-far")}
  ${note("Tyre pressures", "Pressures rise as the tyres heat up", ["You set cold pressures in the garage. As the tyres warm, the air inside expands and the pressure climbs.", "Too high: a smaller contact patch, less grip, more sliding. Too low: the tyre flexes, overheats and wears on the edges.", "Aim to be in the green window once the tyres are warm."])}
  ${box("right:18px;top:18px", 420, `<div class="lbl2" style="margin-bottom:8px">Hot pressures · lap 9</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${tyreBox("FL", "24.1 psi", "+2.6 · in window", "#6EE7A8")}${tyreBox("FR", "25.3 psi", "+3.8 · high", "#FFB060")}${tyreBox("RL", "22.0 psi", "+2.4 · in window", "#6EE7A8")}${tyreBox("RR", "22.4 psi", "+2.8 · in window", "#6EE7A8")}</div>
    <div class="lbl2" style="margin:12px 0 4px">Front right over the stint</div>
    ${chart(390, 100, [{ pts: [0.1, 0.35, 0.55, 0.66, 0.72, 0.76, 0.8, 0.83, 0.86], c: "#FFB060" }], { extra: `<rect x="0" y="35" width="390" height="30" fill="#2FD27A" opacity=".12"/><text x="4" y="58" fill="#6EE7A8" font-family="B" font-weight="600" font-size="11">window</text>` })}
    <div class="muted" style="font:600 12px B;margin-top:8px">Engineer: "Front right is high. Start 0.5 psi lower next stint."</div>
    <div style="margin-top:10px">${sl("Start pressure FR", 40, "21.0")}</div>`)}
  ${hb([gear(6, 228), t2(`FR <span class="mono acc">25.3 psi</span>`, "lots of right-handers here"), t2("Grip", "−3% on the front right")])}
  ${concept("Concept render · tyre pressure build-up")}`;

// 4 · fuel saving
S.fuel = () => `${bg("monza-chase")}
  ${note("Fuel targets", "Hit the number each lap", ["The engineer gives you a fuel target for the lap. The dash shows if you're over or under as you go.", "Lifting before the braking zones saves the most. Each target you hit scores a small bonus in career mode.", "Run out and the car stops on the last lap."])}
  ${box("right:18px;top:18px", 340, `<div class="lbl2" style="margin-bottom:8px">Fuel</div>
    <div class="row" style="justify-content:space-between"><span class="big mono">41.2<span style="font-size:16px"> kg</span></span><span class="pill" style="background:#14361F;color:#6EE7A8">ON TARGET</span></div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Target this lap", "1.62 kg")}${kv("Used so far", `<span class="good">1.05 · −0.03</span>`)}${kv("Laps of fuel left", "25.4 (need 25)")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Last 8 laps</div>
    <div style="display:flex;gap:4px;align-items:end;height:60px">${[0.6, 0.8, 0.5, 0.4, 0.9, 0.3, 0.45, 0.35].map((v, i) => `<i style="flex:1;height:${v * 60}px;border-radius:3px;background:${v > 0.7 ? "#FF8A8A" : "#6EE7A8"}"></i>`).join("")}</div>
    <div class="muted" style="font:600 11px B;margin-top:4px">red = over target</div>
    <div class="lbl2" style="margin:12px 0 6px">Fuel saving</div>${tg(["Off", "Targets only", "Targets + score"], 2)}`)}
  ${hb([gear(8, 338), `<div class="lbl2">This lap</div><div style="width:200px;height:10px;border-radius:5px;background:#2A2F3B;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:65%;background:#6EE7A8;border-radius:5px"></i><i style="position:absolute;left:68%;top:-4px;bottom:-4px;width:3px;background:#E8EAF0"></i></div><div style="font:600 11px B;color:#9AA3B2">used 1.05 of 1.62 kg · 65% of the lap</div>`, `${pill("LIFT AT 50 m", "#10213A", "#7FC4FF")}<div style="font:600 11px B;color:#9AA3B2">into the Rettifilo</div>`])}
  ${concept("Concept render · fuel targets with lift and coast")}`;

// 5 · porpoising
S.porpoise = () => `<div style="position:absolute;inset:-20px;background:url(bg/spa-tcam.png) center/cover;transform:translateY(-8px)"></div>
  <div style="position:absolute;inset:0;background:url(bg/spa-tcam.png) center/cover;opacity:.25;transform:translateY(10px);filter:blur(2px)"></div>
  ${note("Bottoming out and porpoising", "Run it low and it bounces", ["Lower ride height means more downforce, until the floor hits the ground. Then the car bounces on the straights (porpoising) and sparks fly.", "Bumpy tracks punish a low car more. Stiffer springs help but make kerbs harder.", "Too much bouncing wears the plank, and a worn plank can mean disqualification."])}
  ${box("right:18px;top:18px", 380, `<div class="lbl2" style="margin-bottom:8px">Ride height on the Kemmel straight</div>
    ${chart(350, 110, [{ pts: [0.6, 0.55, 0.4, 0.2, 0.5, 0.15, 0.45, 0.12, 0.42, 0.1, 0.4, 0.12, 0.45, 0.2, 0.5], c: "#FFB547" }], { extra: `<rect x="0" y="94" width="350" height="16" fill="#FF6B6B" opacity=".2"/><text x="4" y="106" fill="#FF8A8A" font-family="B" font-weight="600" font-size="11">floor touching</text>` })}
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Bounces a lap", `<span class="bad">14</span>`)}${kv("Plank wear", `<span class="acc">0.6 of 1.0 mm allowed</span>`)}${kv("Downforce", `<span class="good">+4%</span>`)}</div>
    <div style="margin-top:10px;display:grid;gap:8px">${sl("Rear ride height", 22, "38 mm")}${sl("Springs", 70, "stiff")}</div>`)}
  ${hb([gear(8, 312), `${pill("PORPOISING", "#2A1A10", "#FFB060")}<div style="font:600 11px B;color:#9AA3B2">raise the rear 2 mm in the garage</div>`, t2(`Plank <span class="mono acc">0.6 mm</span>`, "limit 1.0 mm")])}
  ${concept("Concept render · bottoming out and porpoising")}`;

// 6 · spins and flat-spots
S.flatspot = () => `${bg("zand-chase")}
  <svg style="position:absolute;inset:0" width="1600" height="900"><path d="M520,900 C600,760 700,640 780,570" stroke="#141519" stroke-width="16" fill="none" opacity=".55"/><path d="M640,900 C700,770 780,650 850,575" stroke="#141519" stroke-width="16" fill="none" opacity=".55"/></svg>
  ${tag(620, 760, `${pill("LOCKED UP", "#3A1218", "#FF8A8A")} <span class="muted" style="font:600 12px B">front left · 0.8 s</span>`)}
  ${note("Spins and flat-spots", "Lock a wheel and you'll feel it", ["Lock up under braking and the tyre slides on one spot, wearing it flat.", "A flat-spotted tyre vibrates every lap after: the camera shakes and the wheel pulls slightly.", "Spin and stop, and you can stall the engine (optional): hold the clutch to restart."])}
  ${box("right:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px">Front left tyre</div>
    <svg width="300" height="180" viewBox="0 0 300 180"><circle cx="90" cy="90" r="78" fill="#1A1C22" stroke="#F2C230" stroke-width="10"/><circle cx="90" cy="90" r="40" fill="#2A2F3B"/><path d="M33,36 L14,62" stroke="#FF6B6B" stroke-width="14"/><text x="190" y="70" fill="#FF8A8A" font-family="B" font-weight="600" font-size="14">flat spot</text><text x="190" y="90" fill="#C3C9D4" font-family="JB" font-weight="600" font-size="14">0.9 mm deep</text><text x="190" y="115" fill="#9AA3B2" font-family="B" font-weight="600" font-size="12">vibration: medium</text></svg>
    <div style="display:grid;gap:6px">${kv("Lap time cost", `<span class="bad">+0.15 s</span>`)}${kv("Gets worse with", "more lock-ups")}${kv("Fix", "new tyres")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Engine stalls after a spin</div>${tg(["Never", "Optional (hold clutch)", "Real"], 1)}`)}
  ${hb([gear(2, 86), `${pill("VIBRATION", "#2A1A10", "#FFB060")}<div style="font:600 11px B;color:#9AA3B2">flat spot front left</div>`, t2("Lock-ups this race", "2 · Turn 1, Turn 11")])}
  ${concept("Concept render · spins and flat-spots")}`;

// 7 · defending rules
S.defend = () => `${bg("inter-chase")}
  <svg style="position:absolute;inset:0" width="1600" height="900"><path d="M800,880 C790,760 760,660 700,600" stroke="#FFB547" stroke-width="5" fill="none" stroke-dasharray="12 8"/><path d="M700,600 C740,570 790,555 830,545" stroke="#FF6B6B" stroke-width="5" fill="none" stroke-dasharray="12 8"/><text x="840" y="548" fill="#FF8A8A" font-family="B" font-weight="600" font-size="16">2nd move</text></svg>
  ${tag(800, 210, `<div style="display:grid;gap:4px;text-align:center"><span class="pill" style="background:#3A1218;color:#FF8A8A;font-size:13px">STEWARDS · WARNING 1 OF 2</span><b style="font:600 16px B">More than one change of direction while defending</b><span class="muted" style="font:600 12px B">next time: 5-second penalty</span></div>`, "translate(-50%,0)")}
  ${note("Defending rules", "One move only, and never under braking", ["You can move once to defend. Moving back to the racing line is fine, but a second move to block is not.", "Moving while the car behind is braking, or squeezing them off the track, gets a warning, then a penalty.", "Weaving on the straight to break the tow is also a warning."], "left:18px;top:300px")}
  ${box("right:18px;top:300px", 320, `<div class="lbl2" style="margin-bottom:8px">Your defending this race</div>
    <div style="display:grid;gap:6px">${kv("Clean defences", `<span class="good">7</span>`)}${kv("Warnings", `<span class="acc">1</span>`)}${kv("Penalties", "0")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Stewards</div>${tg(["Relaxed", "Real", "Strict"], 1)}
    <div class="lbl2" style="margin:12px 0 6px">AI defends</div>${tg(["Fairly", "Hard but fair", "Like a rival"], 1)}`)}
  ${hb([gear(7, 287), t2(`${drv("BRD")} behind`, "0.3 s · alongside soon"), t2("Moves this straight", "1 used of 1")])}
  ${concept("Concept render · defending rules")}`;

// 8 · team orders
S.orders = () => `${bg("monaco-cockpit")}
  <div class="hudbox" style="left:50%;top:70px;transform:translateX(-50%);width:600px;padding:16px 18px"><div class="lbl2" style="color:#FFB547">Team radio · Team principal</div>
    <div style="font:600 19px/1.4 B;margin:8px 0 12px">"Kai is faster and on fresher tyres. Let him through at the chicane, please."</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${[["1", "OK, letting him by", "team trust +", "#6EE7A8"], ["2", "No, I'll hold my place", "team trust −, contract talk later", "#FF8A8A"]].map(([k, a, b, c]) => `<div class="card2"><div class="row"><span class="mono" style="background:#C3C9D4;color:#0B0D12;border-radius:4px;padding:1px 7px">${k}</span><b>${a}</b></div><div style="font:600 12px B;color:${c};margin-top:4px">${b}</div></div>`).join("")}</div></div>
  ${note("Team orders", "In career mode, the team can tell you what to do", ["Let your teammate through, hold position, or don't fight each other.", "Say no and you might win the race, but the team trusts you less: worse upgrades, or no new contract.", "You can give orders too, once you lead the team."], "left:18px;bottom:110px", 420)}
  ${box("right:18px;bottom:110px", 320, `<div class="lbl2" style="margin-bottom:8px">Team trust</div>
    <div style="height:10px;border-radius:5px;background:#2A2F3B"><i style="display:block;height:100%;width:72%;background:#6EE7A8;border-radius:5px"></i></div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("You vs teammate", "P7 vs P8")}${kv("Teammate", drv("KAI"))}${kv("Orders obeyed", "3 of 4")}</div>`)}
  ${concept("Concept render · team orders")}`;

// 9 · red flag restart
S.redflag = () => `${bg("silver-grid", "brightness(.8)")}
  <div style="position:absolute;inset:0;box-shadow:inset 0 0 0 6px #E8002D"></div>
  <div class="hudbox" style="left:50%;top:40px;transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:14px 20px"><div style="width:56px;height:40px;border-radius:4px;background:#E8002D"></div><div><b style="font:700 30px/1 BC;letter-spacing:.04em">RED FLAG · SESSION STOPPED</b><div class="muted" style="font:600 13px B">Barrier repair at Copse · restart in 12:40</div></div></div>
  ${note("Red flag and restart", "Everyone stops in the pit lane", ["Cars line up in the pit lane in race order. Teams can change tyres for free and fix small damage.", "Then a standing restart from the grid, or a rolling one behind the safety car.", "Your engineer asks which tyres you want while you wait."], "left:18px;top:170px")}
  ${box("right:18px;top:170px", 360, `<div class="lbl2" style="margin-bottom:8px">While you wait</div>
    <div class="lbl2" style="margin-bottom:4px">Tyres for the restart (free change)</div>${tg(["Soft · new", "Medium · new", "Hard · used 8 laps", "Keep current"], 1)}
    <div class="lbl2" style="margin:12px 0 4px">Repairs</div>${tg(["New front wing (free)", "Leave it"], 0)}
    <div class="lbl2" style="margin:12px 0 4px">Pit lane queue</div>
    <div style="display:grid;gap:4px;font:600 13px B">${[["1", "OKA", "M · new"], ["2", "YOU", "?"], ["3", "BRD", "S · new"], ["4", "SLV", "M · new"]].map(([p, c, t]) => `<div class="row" style="justify-content:space-between"><span><span class="mono">${p}</span> ${drv(c)}</span><span class="muted">${t}</span></div>`).join("")}</div>
    <div class="lbl2" style="margin:12px 0 4px">Restart type</div>${tg(["Standing start", "Rolling (safety car)"], 0)}`)}
  ${concept("Concept render · red flag and restart")}`;

// 10 · quali tow games
S.towgame = () => `${bg("monza-chase")}
  ${clone("monza-chase", CAR["monza-chase"], 742, 410, 0.36, "hue-rotate(150deg) saturate(1.3)")}
  ${clone("monza-chase", CAR["monza-chase"], 806, 396, 0.27, "grayscale(1) brightness(1.5)")}
  ${clone("monza-chase", CAR["monza-chase"], 770, 384, 0.21, "hue-rotate(310deg) saturate(1.6)")}
  ${clone("monza-chase", CAR["monza-chase"], 830, 432, 0.5, "hue-rotate(-40deg) saturate(1.5) brightness(.9)")}
  ${tag(885, 432, `${pill("SLV · slowing for a tow", "#2A1A10", "#FFB060")}`, "translate(0,-50%)")}
  ${tag(700, 395, `${pill("3 cars waiting", "#1C2230", "#C3C9D4")}`, "translate(-100%,-50%)")}
  ${note("Qualifying tow games", "Everyone wants the car in front", ["At Monza the AI slows on the out lap so nobody gets their tow. Cars bunch up, and the clock keeps running.", "Leave the pits at the right moment, find a gap, or follow a car for a tow down the straights.", "Get it wrong and you don't start your lap before the flag."])}
  ${box("right:18px;top:18px", 360, `<div class="lbl2" style="margin-bottom:8px">Q3 · 2:41 left</div>
    <div style="display:grid;gap:6px">${kv("Time to the line at this pace", `<span class="bad">2:48 · too slow</span>`)}${kv("Car ahead", "SLV · 120 m")}${kv("Tow worth", `<span class="good">−0.25 s on the lap</span>`)}</div>
    <div class="lbl2" style="margin:12px 0 6px">Out-lap queue</div>
    <svg width="330" height="70" viewBox="0 0 330 70"><line x1="0" x2="330" y1="40" y2="40" stroke="#2A2F3B" stroke-width="12" stroke-linecap="round"/>${[[40, "#E8EAF0", "VRG"], [90, "#16B8A6", "SLV"], [150, "#FFA51F", "YOU"], [205, "#C8102E", "BRD"], [240, "#16245C", "OKA"]].map(([x, c, n]) => `<circle cx="${x}" cy="40" r="9" fill="${c}" stroke="#0B0D12" stroke-width="2"/><text x="${x}" y="22" fill="#C3C9D4" text-anchor="middle" font-family="B" font-weight="600" font-size="11">${n}</text>`).join("")}<text x="326" y="64" fill="#9AA3B2" text-anchor="end" font-family="B" font-weight="600" font-size="11">line →</text></svg>
    <div class="card2" style="margin-top:8px;box-shadow:inset 0 0 0 1px #FFB547"><b class="acc">Engineer:</b> "Pass two cars now or we miss the flag."</div>`)}
  ${hb([gear(5, 162), t2("Out lap", "need 2:30 to make it"), t2(`Q3 clock <span class="mono acc">2:41</span>`, "Monza · Parabolica next")])}
  ${concept("Concept render · qualifying tow games")}`;

// 11 · classic tracks
const hock = [[10, 70], [12, 40], [30, 20], [70, 8], [92, 18], [88, 34], [70, 42], [55, 60], [42, 66], [30, 78], [14, 82]];
const spaOld = [[8, 85], [12, 55], [26, 20], [44, 8], [60, 18], [74, 40], [92, 60], [90, 78], [70, 84], [48, 90], [28, 92]];
const monzaOld = [[10, 60], [16, 30], [40, 20], [70, 18], [90, 28], [94, 50], [86, 70], [60, 76], [36, 76], [16, 72]];
const kyalami = [[12, 72], [20, 30], [44, 18], [62, 26], [84, 18], [92, 44], [74, 58], [64, 80], [40, 84], [22, 84]];
S.classic = () => top("Circuits · <b>Classic layouts</b>", `<span class="chip">Uses each era's cars</span>`, "spa-eau") + `
  <div class="grid" style="grid-template-columns:repeat(4,1fr);height:727px">
    ${[["Hockenheim", "1970–2001", "Long flat-out runs through the forest, broken by chicanes. Low wing, huge top speed.", "6.8 km", hock, true], ["Spa-Francorchamps", "1950–1970", "The original 14 km road course through the Ardennes villages. Very fast, very dangerous.", "14.1 km", spaOld], ["Monza with banking", "1955–1969", "The road course plus the steep oval banking. Cars ran flat out for minutes at a time.", "10.0 km", monzaOld], ["Kyalami", "1967–1985", "A fast old layout with a long downhill straight into Crowthorne.", "4.1 km", kyalami]].map(([n, y, d, l, pts, on]) => `<div class="panel" style="${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""};display:grid;gap:8px;align-content:start"><div style="height:250px;border-radius:10px;background:#0E1117;display:grid;place-items:center">${trackSvg(pts, 300, 210, { c: on ? "#FFB547" : "#C3C9D4" })}</div><b style="font:700 26px BC">${n}</b><div class="row"><span class="chip">${y}</span><span class="chip">${l}</span></div><div class="muted" style="font:500 13px B">${d}</div></div>`).join("")}
    <div class="panel" style="grid-column:span 4;display:grid;grid-template-columns:1.4fr 1fr;gap:24px"><div><h2>Hockenheim · forest loop</h2><div style="font:500 14px/1.5 B;color:#C3C9D4">Built from old maps and photos. The forest straights are over a kilometre long, with three chicanes that slow you from 340 to 90 km/h. The stadium section at the end is the same as today.</div>
      <div class="row" style="margin-top:10px">${["Run-off: grass and gravel", "Barriers: armco", "No DRS zones in its era"].map((x) => `<span class="chip">${x}</span>`).join("")}</div></div>
      <div style="display:grid;gap:8px;align-content:start"><div class="lbl2">Cars</div>${tg(["Its own era (1990s)", "Today's cars", "Any"], 0)}<div class="lbl2">Track look</div>${tg(["Period (old barriers, signs)", "Modernised"], 0)}<span class="btn primary" style="justify-self:start;margin-top:6px">Race here</span></div></div>
  </div>${concept("Concept render · classic track layouts")}`;

// 12 · track builder share codes
const mine = [[10, 80], [10, 30], [24, 12], [50, 12], [56, 30], [72, 26], [90, 34], [92, 64], [74, 72], [60, 60], [44, 74], [30, 88]];
S.sharecode = () => top("Track Builder · <b>Share your circuit</b>", `<span class="btn">Back to the editor</span>`, "spa-top") + `
  <div class="grid" style="grid-template-columns:1.2fr 1fr;height:727px">
    <div class="panel" style="display:grid;gap:12px;align-content:start"><div style="height:420px;border-radius:10px;background:#0E1117;display:grid;place-items:center">${trackSvg(mine, 560, 380, { c: "#FFB547", wd: 14, wd2: 4, extra: `<rect x="50" y="200" width="16" height="16" fill="#E8EAF0"/><text x="76" y="214" fill="#C3C9D4" font-family="B" font-weight="600" font-size="13">start</text>` })}</div>
      <div class="row" style="justify-content:space-between"><div><b style="font:700 30px BC">Kiri's Ring</b><div class="muted">by you · 4.3 km · 14 corners · 2 DRS zones</div></div><div class="row"><span class="chip">Hills: medium</span><span class="chip">Run-off: gravel</span><span class="chip">Night</span></div></div></div>
    <div class="panel"><h2>Share code</h2>
      <div class="card2 mono" style="font-size:26px;letter-spacing:.06em;color:#FFB547;text-align:center;padding:18px">RLT-7KQ2-M9XW-44HB</div>
      <div class="row" style="margin-top:10px"><span class="btn primary">Copy code</span><span class="btn">Copy link</span></div>
      <div class="muted" style="margin-top:10px;font:500 13px B">The whole circuit fits in this code: pieces, run-off, barriers, pit lane and scenery. Friends paste it into the game to race your track. No server or account needed.</div>
      <div class="lbl2" style="margin:18px 0 6px">Paste a friend's code</div>
      <div class="card2 mono" style="color:#6B7383">RLT-____-____-____</div>
      <div class="lbl2" style="margin:18px 0 6px">Friends' circuits</div>
      <table>${[["Sam's Hairpins", "3.1 km", "1:12.4 (Sam)"], ["Leo GP", "5.9 km", "1:44.0 (you)"], ["Night City", "4.8 km", "—"]].map(([a, b, c]) => `<tr><td>${a}</td><td class="muted">${b}</td><td class="r mono">${c}</td></tr>`).join("")}</table></div>
  </div>${concept("Concept render · track builder share codes")}`;

// 13 · seasons and time of day
S.seasons = () => top("Race settings · <b>Season and time of day</b>", "", "yas-chase") + `
  <div class="grid" style="grid-template-columns:repeat(3,1fr);height:727px">
    ${[["spa-chase", "sepia(.25) saturate(1.2) brightness(1.05) hue-rotate(-12deg)", "07:10", "Dawn practice", "Low sun, cold track, mist in the valleys"], ["silver-far", "saturate(1.5) sepia(.45) hue-rotate(-18deg) brightness(.95)", "16:30", "Autumn", "Orange trees, leaves blown onto the run-off, cooler air"], ["yas-chase", "", "18:40", "Sunset race", "Sun on the horizon, lights coming on"]].map(([f, flt, t, a, b]) => `<div class="panel" style="padding:0;overflow:hidden"><div style="height:330px;background:url(bg/${f}.png) center/cover;filter:${flt}"></div><div style="padding:12px 16px"><div class="row" style="align-items:baseline"><b class="mono acc" style="font-size:22px">${t}</b><b style="font:600 18px B">${a}</b></div><div class="muted" style="margin-top:4px">${b}</div></div></div>`).join("")}
    <div class="panel" style="grid-column:span 3;display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      <div><h2>Season</h2>${tg(["Real (race date)", "Spring", "Summer", "Autumn", "Winter testing"], 0)}<div class="muted" style="margin-top:8px;font:500 13px B">Changes tree colours, grass, how warm the track is, and how low the sun sits.</div></div>
      <div><h2>Start time</h2>${tg(["Real", "Dawn", "Midday", "Sunset", "Night"], 0)}<div style="margin-top:10px">${sl("Time speed", 30, "×4")}</div></div>
      <div><h2>Track temperature</h2>${chart(400, 90, [{ pts: [0.15, 0.3, 0.55, 0.75, 0.82, 0.7, 0.45, 0.25], c: "#FF8A3A" }])}<div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2;margin-top:4px"><span>dawn 14°</span><span>afternoon 46°</span><span>night 22°</span></div></div></div>
  </div>${concept("Concept render · seasons and time of day")}`;

// 14 · hot lap vs real pole
S.pole = () => `${bg("spa-chase")}
  ${note("Hot lap vs the real pole", "Can you beat this year's pole time?", ["Every circuit has the real 2026 pole lap time (from live timing). Beat it for a gold star.", "The delta bar compares you with the pole lap sector by sector, so you know where you're losing."])}
  ${box("right:18px;top:18px", 340, `<div class="lbl2" style="margin-bottom:8px">Spa · 2026 pole</div><div class="row" style="justify-content:space-between"><span class="big mono">1:40.562</span><span class="pill" style="background:#1C2230;color:#C3C9D4">REAL POLE</span></div>
    <div style="display:grid;gap:6px;margin-top:10px">${kv("Your best", "1:41.220")}${kv("Gap", `<span class="bad">+0.658</span>`)}${kv("Sector 1", `<span class="good">−0.04</span>`)}${kv("Sector 2", `<span class="bad">+0.51</span>`)}${kv("Sector 3", `<span class="bad">+0.19</span>`)}</div>
    <div class="lbl2" style="margin:12px 0 6px">Circuits beaten</div><div style="display:grid;grid-template-columns:repeat(12,1fr);gap:4px">${Array.from({ length: 24 }, (_, i) => `<i style="height:14px;border-radius:3px;background:${[1, 4, 7, 12, 19].includes(i) ? "#F2C230" : "#2A2F3B"}"></i>`).join("")}</div><div class="muted" style="font:600 11px B;margin-top:4px">5 of 24</div>`)}
  <div class="hudbox" style="left:50%;top:18px;transform:translateX(-50%);text-align:center;padding:10px 22px"><div class="lbl2">vs real pole</div><b class="mono good" style="font-size:34px">−0.112</b><div style="width:260px;height:8px;border-radius:4px;background:#2A2F3B;margin-top:6px;position:relative"><i style="position:absolute;left:50%;top:0;bottom:0;width:22%;background:#6EE7A8;border-radius:4px"></i><i style="position:absolute;left:50%;top:-4px;bottom:-4px;width:2px;background:#E8EAF0"></i></div></div>
  ${hb([gear(7, 289), t2("Sector 1", `<span class="good">−0.112 to pole</span>`), t2("Lap 3 · hot lap", "tyres: soft · new")])}
  ${concept("Concept render · hot lap vs the real pole")}`;

// 15 · photo mode
S.photo = () => `<div style="position:absolute;inset:0;background:url(bg/monaco-chase.png) center/cover;filter:blur(5px) brightness(.9)"></div>
  <div style="position:absolute;inset:0;background:url(bg/monaco-chase.png) center/cover;mask-image:radial-gradient(ellipse 22% 26% at 50% 58%,#000 60%,transparent 100%);filter:saturate(1.15) contrast(1.06)"></div>
  <div style="position:absolute;left:470px;top:250px;width:660px;height:420px;border:1px solid rgba(255,255,255,.35)"><i style="position:absolute;left:33%;top:0;bottom:0;border-left:1px solid rgba(255,255,255,.18)"></i><i style="position:absolute;left:66%;top:0;bottom:0;border-left:1px solid rgba(255,255,255,.18)"></i><i style="position:absolute;top:33%;left:0;right:0;border-top:1px solid rgba(255,255,255,.18)"></i><i style="position:absolute;top:66%;left:0;right:0;border-top:1px solid rgba(255,255,255,.18)"></i></div>
  ${box("left:18px;top:18px", 330, `<div class="lbl2" style="margin-bottom:8px;color:#FFB547">Photo mode · paused</div>
    <div style="display:grid;gap:10px">${sl("Focus distance", 35, "6.2 m")}${sl("Blur (aperture)", 70, "f/1.8")}${sl("Field of view", 30, "28°")}${sl("Tilt", 50, "0°")}${sl("Exposure", 55, "+0.3")}</div>
    <div class="lbl2" style="margin:12px 0 6px">Filter</div>${tg(["None", "Film", "Black & white", "Warm", "Cold"], 1)}
    <div class="lbl2" style="margin:12px 0 6px">Show</div>${tg(["Car", "Driver", "Other cars", "HUD", "Grid"], [0, 1, 2, 4])}`)}
  ${box("right:18px;top:18px", 280, `<div class="lbl2" style="margin-bottom:8px">Livery</div>${tg(["RACELIMIT", "Your livery", "Night special"], 0)}<div class="lbl2" style="margin:12px 0 6px">Size</div>${tg(["Screen", "4K", "Square", "Phone"], 1)}`)}
  <div class="hudbox" style="left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:10px;align-items:center"><span class="btn primary">📷 Take photo</span><span class="btn">Move camera (WASD)</span><span class="btn">Gallery · 23</span></div>
  ${concept("Concept render · photo mode")}`;

// 16 · commentary feed
S.ticker = () => `${bg("silver-far")}
  <div style="position:absolute;left:0;right:0;bottom:0;height:46px;background:#0B0D12E8;border-top:2px solid #FFB547;display:flex;align-items:center;gap:26px;padding:0 18px;white-space:nowrap;overflow:hidden;z-index:4"><span class="pill" style="background:#FFB547;color:#17120A;font-size:13px">LAP 23</span>${["<b>Overtake!</b> BRD passes SLV into Brooklands for P4", "<b>Fastest lap</b> OKA · 1:28.904", "<b>Pit stop</b> ISH · 2.3 s · Medium → Hard", "<b>Investigation</b> DEL and KAI, Turn 1, lap 22"].map((x) => `<span style="font:600 15px B">${x}</span><span class="faint">·</span>`).join("")}</div>
  <div class="hudbox" style="left:50%;top:22px;transform:translateX(-50%);text-align:center;padding:12px 24px"><div class="lbl2" style="color:#FFB547">Just now</div><b style="font:700 32px BC">OVERTAKE INTO BROOKLANDS!</b><div class="muted" style="font:600 14px B">${drv("BRD")} passes ${drv("SLV")} for P4</div></div>
  ${note("Commentary feed", "What's happening, as it happens", ["A ticker along the bottom shows overtakes, fastest laps, pit stops and penalties, written like a TV caption.", "Big moments get a headline for a few seconds.", "Choose how chatty it is, or only show things about you."], "left:18px;top:140px", 400)}
  ${box("right:18px;top:140px", 300, `<div class="lbl2" style="margin-bottom:6px">Ticker</div>${tg(["Everything", "Big moments", "Only me", "Off"], 0)}<div class="lbl2" style="margin:12px 0 6px">Headlines</div>${tg(["On", "Off"], 0)}<div class="lbl2" style="margin:12px 0 6px">Read out loud</div>${tg(["Off", "On (computer voice)"], 0)}`)}
  ${concept("Concept render · commentary feed", "bottom:58px")}`;

// 17 · pit wall mode
S.pitwall = () => top("Pit wall · <b>You're the strategist</b>", `<span class="chip">Driver: AI · ${"MOR"}</span><span class="chip">Lap 31 / 52</span>`, "silver-far") + `
  <div class="grid" style="grid-template-columns:1.15fr 1fr 0.9fr;grid-template-rows:1fr 1fr;height:727px">
    <div class="panel" style="grid-row:span 2"><h2>Timing</h2><table><tr><th>P</th><th>Car</th><th class="r">Gap</th><th class="r">Last</th><th>Tyre</th></tr>
      ${[["1", "OKA", "AXIOM", "—", "1:29.10", "M 18"], ["2", "BRD", "VELOCE", "+2.4", "1:29.32", "H 9"], ["3", "SLV", "NOVA", "+5.0", "1:29.55", "M 20"], ["4", "MOR", "MERIDIAN", "+6.1", "1:29.41", "M 22"], ["5", "ISH", "KESTREL", "+9.8", "1:29.20", "H 6"], ["6", "VRG", "HALCYON", "+13.0", "1:29.90", "M 21"], ["7", "DEL", "VORTEX", "+18.4", "1:30.02", "H 11"], ["8", "KAI", "ORBITA", "+20.2", "1:30.11", "M 25"]].map(([p, c, t, g, l, ty], i) => `<tr${c === "MOR" ? ` style="background:#1E1A12"` : ""}><td class="mono">${p}</td><td><i style="display:inline-block;width:4px;height:14px;background:${TEAMS[t]};margin-right:6px;vertical-align:middle"></i><b>${c}</b></td><td class="r mono">${g}</td><td class="r mono">${l}</td><td><span class="pill" style="background:${ty[0] === "M" ? "#2A2310" : "#22252C"};color:${ty[0] === "M" ? "#F2C230" : "#E8EAF0"}">${ty}</span></td></tr>`).join("")}</table>
      <div class="lbl2" style="margin:12px 0 6px">Undercut check · ${"MOR"} vs SLV</div><div class="card2">${kv("Pit now, rejoin", "P6 · 2.1 s behind VRG")}${kv("Fresh tyre gain", `<span class="good">~1.1 s a lap</span>`)}${kv("Undercut works if SLV stays 2+ laps", `<span class="good">likely</span>`)}</div></div>
    <div class="panel" style="padding:0;overflow:hidden;position:relative"><div style="height:100%;background:url(bg/silver-far.png) center/cover"></div><div class="hudbox" style="left:12px;top:12px"><b>Onboard · MOR</b> <span class="muted">· 287 km/h</span></div></div>
    <div class="panel"><h2>Call it</h2><div style="display:grid;gap:8px"><span class="btn primary" style="justify-content:center;height:48px">Box this lap → Hard</span><span class="btn" style="justify-content:center">Stay out 3 more laps</span><span class="btn" style="justify-content:center">Push now</span><span class="btn" style="justify-content:center">Save tyres</span><span class="btn" style="justify-content:center">Swap places with teammate</span></div></div>
    <div class="panel"><h2>Tyre wear · MOR</h2>${chart(400, 120, [{ pts: [0.9, 0.86, 0.83, 0.79, 0.76, 0.72, 0.67, 0.6, 0.52], c: "#F2C230" }], { extra: `<line x1="0" x2="400" y1="90" y2="90" stroke="#FF6B6B" stroke-dasharray="6 4"/><text x="4" y="86" fill="#FF8A8A" font-family="B" font-weight="600" font-size="11">cliff</text>` })}<div class="muted" style="font:600 12px B;margin-top:6px">Mediums 22 laps old · about 4 laps before the cliff</div></div>
    <div class="panel"><h2>Radio</h2><div style="display:grid;gap:8px;font:600 13px B"><div><span class="acc">MOR:</span> "Rears are going, I can't hold SLV much longer."</div><div><span class="blue">You:</span> "Copy, box box this lap."</div><div class="muted">Weather: dry · rain 8% in 20 min</div></div></div>
  </div>${concept("Concept render · pit wall mode")}`;

// 18 · records and trophies
S.trophies = () => top("Profile · <b>Records and trophies</b>", `<span class="chip">142 h played</span>`, "yas-chase") + `
  <div class="grid" style="grid-template-columns:1fr 1.3fr;height:727px">
    <div class="panel"><h2>Personal bests</h2><table><tr><th>Circuit</th><th class="r">Best lap</th><th>Car</th><th>Medal</th></tr>
      ${[["Spa", "1:41.220", "2026", "🥇"], ["Monza", "1:21.840", "2026", "🥇"], ["Silverstone", "1:28.731", "2026", "🥈"], ["Monaco", "1:13.902", "2004", "🥈"], ["Suzuka", "1:31.050", "2026", "🥉"], ["Zandvoort", "1:12.400", "1998", "🥉"], ["Interlagos", "1:11.990", "2026", "—"], ["Singapore", "—", "—", "—"]].map(([a, b, c, d]) => `<tr><td>${a}</td><td class="r mono">${b}</td><td class="muted">${c}</td><td>${d}</td></tr>`).join("")}</table></div>
    <div class="panel"><h2>Trophy cabinet</h2>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">${[["🏆", "First win", "Monza", 1], ["🏆", "Champion", "Season 1", 1], ["🥇", "Licence", "Spa", 1], ["⏱", "Beat real pole", "5 circuits", 1], ["🌧", "Rain master", "won in the wet", 1], ["🔧", "Nursed it home", "finished with damage", 1], ["🔥", "7-day streak", "daily challenge", 1], ["🏁", "100 races", "64 of 100", 0], ["🧊", "Ice cool", "no lock-ups in a race", 0], ["🎯", "Perfect weekend", "pole, win, fastest lap", 0]].map(([i, n, d, got]) => `<div class="card2" style="text-align:center;opacity:${got ? 1 : .4};${got ? "box-shadow:inset 0 0 0 1px #3A3120" : ""}"><div style="font-size:42px;line-height:1.2;${got ? "" : "filter:grayscale(1)"}">${i}</div><b style="font:600 14px B">${n}</b><div class="muted" style="font:600 11px B">${d}</div></div>`).join("")}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px">${[["Races", "64"], ["Wins", "9"], ["Poles", "12"], ["Podiums", "21"]].map(([a, b]) => `<div class="card2"><div class="lbl2">${a}</div><b class="big mono">${b}</b></div>`).join("")}</div></div>
  </div>${concept("Concept render · records and trophies")}`;

mount(S);
export default S;

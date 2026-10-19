// Design concepts: garage, livery, driver kit, parts, engine (maker, build, wear), your own team, upgrades
const screen = new URLSearchParams(location.search).get("screen") || "garage";
const root = document.getElementById("root");
const top = (crumb, right = "") => `<div class="top"><div class="brand">RACELIMIT<small>RACE</small></div><div class="crumbs">${crumb}</div><div class="sp"></div>${right}</div>`;
const isOn = (on, i) => (Array.isArray(on) ? on.includes(i) : i === on);
const tg = (opts, on) => `<div class="tg">${opts.map((o, i) => `<span class="${isOn(on, i) ? "on" : ""}">${o}</span>`).join("")}</div>`;
const sl = (label, v, txt) => `<div class="sl"><span>${label}</span><div class="tr"><i style="width:${v}%"></i><b style="left:${v}%"></b></div><span class="mono" style="text-align:right">${txt}</span></div>`;
const sw = (cols, on, size = 26) => `<div style="display:flex;gap:7px;flex-wrap:wrap">${cols.map((c, i) => `<span style="width:${size}px;height:${size}px;border-radius:7px;background:${c};box-shadow:${i === on ? "0 0 0 2px #0E1117,0 0 0 4px #FFB547" : "inset 0 0 0 1px rgba(255,255,255,.15)"}"></span>`).join("")}</div>`;
const lbl = (t, extra = "") => `<div class="lbl2" style="${extra}">${t}</div>`;
const bar = (label, v, col = "#FFB547", txt = "", lw = 120) => `<div style="display:grid;grid-template-columns:${lw}px 1fr 64px;gap:8px;align-items:center;font:600 12px B;color:#C3C9D4"><span>${label}</span><div class="bar"><i style="width:${v}%;background:${col}"></i></div><span class="mono" style="text-align:right;font-size:12px;color:#E8EAF0">${txt}</span></div>`;
const eff = (t, g) => `<span class="pill" style="background:${g === 1 ? "#12301F" : g === 0 ? "#1C2230" : "#3A1717"};color:${g === 1 ? "#6EE7A8" : g === 0 ? "#C3C9D4" : "#FF8A8A"};font-size:11px;padding:2px 8px;letter-spacing:0">${t}</span>`;
const concept = (t) => `<div class="concept" style="text-shadow:0 1px 4px #000">${t}</div>`;
const hb = (cells) => `<div class="hudbox" style="left:50%;bottom:18px;transform:translateX(-50%);display:flex;padding:0;overflow:hidden;white-space:nowrap">${cells.map((c, i) => `<div style="padding:10px 18px;${i ? "border-left:1px solid rgba(255,255,255,.07)" : ""};display:grid;gap:2px;align-content:center">${c}</div>`).join("")}</div>`;
const cell = (k, v, sub = "") => `<div class="lbl2">${k}</div><div style="font:600 17px B">${v}</div>${sub ? `<div style="font:500 11px B;color:#9AA3B2">${sub}</div>` : ""}`;
const imgCrop = (f, x, y, w, h, cw, ch) => { const s = cw / w; return `background:#0E1014 url(${f}) no-repeat;background-size:${1600 * s}px ${900 * s}px;background-position:${-x * s}px ${-y * s}px;width:${cw}px;height:${ch}px`; };
let html = "";

// ------------------------------------------------------------------ garage
if (screen === "garage") {
  const tabs = [["Paint & livery", "colours, stickers, finish"], ["Parts", "wings, sidepods, nose, cooling"], ["Engine", "maker, build & tune, wear"], ["Driver kit", "helmet, suit, gloves"], ["Details", "rims, T-cam, halo, wheel", 1], ["Setups", "saved for each track"]];
  html = `<div class="bgimg" style="background-image:url(g-garage.png)"></div>
  <div style="position:absolute;left:0;right:0;top:0">${top("Garage · <b>KOWHAI GP #7</b>", `<span class="chip">2026 car · Kestrel engine · your team</span><span class="btn primary">Drive at Spa →</span>`)}</div>
  <div class="hudbox" style="left:18px;top:82px;width:236px;padding:8px">${tabs.map(([a, b, on]) => `<div style="padding:9px 12px;border-radius:9px;${on ? "background:#2A2310;box-shadow:inset 3px 0 0 #FFB547" : ""}"><b style="font:600 15px B;color:${on ? "#FFB547" : "#E8EAF0"}">${a}</b><div style="font:500 12px B;color:#9AA3B2">${b}</div></div>`).join("")}</div>
  <div class="hudbox" style="right:18px;top:82px;width:370px;display:grid;gap:8px;padding:14px 16px">
    <div style="font:700 22px BC">Details</div>
    ${lbl("Wheel rims")}${sw(["#C9A227", "#15161A", "#B8BEC8", "#0F3D2E", "#F5C518"], 0)}
    ${lbl("T-cam on top of the car", "margin-top:4px")}${tg(["Black · first driver", "Yellow · second driver"], 1)}
    <div style="font:500 12px B;color:#9AA3B2">Like the real cars: it tells TV viewers which teammate is which.</div>
    ${lbl("Halo", "margin-top:4px")}${tg(["Body colour", "Accent", "Bare carbon"], 1)}
    ${lbl("Mirrors")}${tg(["Body colour", "Carbon"], 1)}
    ${lbl("Steering wheel")}${tg(["Carbon", "Team colours", "Retro suede"], 1)}
    ${lbl("Number style")}<div style="display:flex;gap:8px">${[["700 30px BC", 1], ["600 25px JB"], ["italic 700 30px BC"], ["700 27px B"]].map(([f, on]) => `<span style="width:52px;height:44px;border-radius:9px;display:grid;place-items:center;font:${f};background:#1C2230;color:#E8EAF0;${on ? "box-shadow:inset 0 0 0 2px #FFB547" : ""}">7</span>`).join("")}</div>
  </div>
  <div class="hudbox" style="left:18px;top:520px;width:236px;font:600 12px B;color:#C3C9D4;padding:10px 12px;display:grid;gap:4px"><div class="lbl2">Controls</div><div>Drag to spin the car</div><div>Scroll to zoom</div><div><b class="mono">P</b> photo mode</div></div>
  ${hb([cell("Top speed", "341 km/h", "medium wing"), cell("Downforce", "●●●○○", "front 6 · rear medium"), cell("Cooling", "Normal", "4 louvres each side"), cell("Weight", "770 kg", "minimum is 768 kg"), cell("Engine", "Kestrel", "≈1,000 hp · 62% worn")])}
  ${concept("Design concept · 3D garage (team, colours and sponsors are made up)")}`;
}

// ------------------------------------------------------------------ livery editor
if (screen === "livery") {
  const layers = [["Base paint", "Green · satin", "#0F3D2E", 0, "🔒"], ["Pattern: split", "yellow lower half", "#F5C518"], ["Pinstripe", "white, 9 mm", "#FFFFFF"], ["Sticker: KOWHAI", "sidepods · team name", "#FFFFFF"], ["Sticker: AROHA SOLAR", "sidepods · sponsor", "#F5C518", 1], ["Number 7", "fin and nose", "#FFFFFF"], ["Rear wing text", "KOWHAI", "#FFFFFF"]];
  const stickers = [["AROHA SOLAR", "#F5C518", "#0F3D2E", "600 15px B"], ["NORTHWIND", "#FFFFFF", "#1F4E9A", "700 18px BC"], ["PEAKLINE", "#0B0D12", "#E8EAF0", "italic 700 18px BC"], ["SKYFERN AIR", "#7FE0B8", "#0E1117", "600 14px B"], ["VOLTAN", "#FF6B3A", "#16171B", "700 20px BC"], ["QUARTZ CLOUD", "#C9B6FF", "#1A1530", "600 13px B"], ["TIDEWAY", "#5AA9FF", "#0E1117", "700 18px BC"], ["EMBERLY", "#FFB547", "#2A1A10", "italic 700 18px BC"]];
  const V = { x: 342, y: 82, w: 916, h: 515 }, s = V.w / 1600;
  const box = { x: V.x + 790 * s, y: V.y + 437 * s, w: 80 * s, h: 15 * s };
  const pats = [["Split", (a, b) => `<path d="M4,30 L76,30 L76,22 C50,24 30,20 4,26Z" fill="${b}"/>`], ["Stripe", (a, b) => `<path d="M4,16 L76,12 L76,18 L4,22Z" fill="${b}"/>`], ["Fade", (a, b) => `<defs><linearGradient id="fd"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient></defs><rect x="4" y="8" width="72" height="22" fill="url(#fd)"/>`], ["Chevrons", (a, b) => `<path d="M20,30 L28,8 L32,8 L24,30Z M34,30 L42,8 L46,8 L38,30Z M48,30 L56,8 L60,8 L52,30Z" fill="${b}"/>`], ["Halves", (a, b) => `<path d="M40,8 L76,8 L76,30 L30,30Z" fill="${b}"/>`], ["Blank", () => ""]];
  const car = (a, b, p) => `<svg width="80" height="36" viewBox="0 0 80 36"><clipPath id="cl${p[0]}"><path d="M2,26 L10,20 L30,18 L40,10 L50,10 L56,16 L72,18 L78,24 L78,30 L2,30Z"/></clipPath><g clip-path="url(#cl${p[0]})"><rect width="80" height="36" fill="${a}"/>${p[1](a, b)}</g><circle cx="16" cy="30" r="5" fill="#111" stroke="#444"/><circle cx="66" cy="30" r="5" fill="#111" stroke="#444"/></svg>`;
  html = top("Garage · <b>Livery editor</b>", `<span class="btn">↶ Undo</span><span class="btn">Share as a code</span><span class="btn primary">Save livery</span>`) + `
  <div class="panel" style="position:absolute;left:24px;top:82px;width:302px;bottom:20px;display:grid;gap:6px;align-content:start;padding:14px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Layers</h2><span class="chip">+ Add</span></div>
    ${layers.map(([a, b, c, sel, lock]) => `<div style="display:grid;grid-template-columns:22px 1fr auto;gap:10px;align-items:center;padding:8px 10px;border-radius:9px;background:${sel ? "#2A2310" : "#181C25"};${sel ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><span style="width:20px;height:20px;border-radius:5px;background:${c};box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)"></span><div><b style="font:600 14px B;color:${sel ? "#FFB547" : "#E8EAF0"}">${a}</b><div style="font:500 12px B;color:#9AA3B2">${b}</div></div><span style="font:600 13px B;color:#6B7383">${lock || "👁"}</span></div>`).join("")}
    <div style="height:6px"></div>
    <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;font:600 13px B"><span>Paint both sides the same</span>${tg(["On", "Off"], 0)}<span>Snap to the car's lines</span>${tg(["On", "Off"], 0)}</div>
    <div style="font:500 12px B;color:#9AA3B2;margin-top:4px">Stickers are text and shapes only, so nobody can upload pictures onto their car.</div>
  </div>
  <div style="position:absolute;left:${V.x}px;top:${V.y}px;width:${V.w}px;height:${V.h}px;border-radius:12px;overflow:hidden;background:url(g-livery.png) center/cover;box-shadow:0 0 0 1px #262B36">
    <div class="hudbox" style="left:12px;top:12px;padding:5px;display:flex;gap:4px">${["Left side", "Right side", "Top", "Front", "3D"].map((t, i) => `<span style="padding:5px 10px;border-radius:7px;font:600 12px B;${i === 1 ? "background:#2A2310;color:#FFB547" : "color:#C3C9D4"}">${t}</span>`).join("")}</div>
    <div class="hudbox" style="right:12px;top:12px;padding:6px 12px;font:600 12px B;color:#C3C9D4">Finish preview: <b style="color:#FFB547">satin</b> · studio light</div>
  </div>
  <div style="position:absolute;left:${box.x - 6}px;top:${box.y - 6}px;width:${box.w + 12}px;height:${box.h + 12}px;border:1.5px dashed #FFB547;border-radius:3px">${[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => `<i style="position:absolute;left:${a ? "100%" : "0"};top:${b ? "100%" : "0"};width:9px;height:9px;background:#FFB547;border-radius:2px;transform:translate(-50%,-50%)"></i>`).join("")}<i style="position:absolute;left:50%;top:-24px;width:14px;height:14px;border:2px solid #FFB547;border-radius:50%;transform:translateX(-50%)"></i><i style="position:absolute;left:50%;top:-10px;width:1.5px;height:10px;background:#FFB547"></i></div>
  <div class="hudbox" style="left:${box.x + box.w + 18}px;top:${box.y - 56}px;padding:7px 11px;font:600 12px B;line-height:1.45"><b style="color:#FFB547">AROHA SOLAR</b><br><span style="color:#C3C9D4">drag to move · corners to resize · circle to rotate</span></div>
  <div class="panel" style="position:absolute;left:${V.x}px;top:${V.y + V.h + 14}px;width:${V.w}px;bottom:20px;padding:12px 16px;display:grid;gap:8px;align-content:start">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Sticker library</h2>${tg(["Sponsors", "Shapes", "Text", "Numbers"], 0)}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${stickers.map(([t, c, bg, f], i) => `<div style="height:48px;border-radius:9px;background:${bg};display:grid;place-items:center;font:${f};color:${c};letter-spacing:.06em;box-shadow:${i === 0 ? "inset 0 0 0 2px #FFB547" : "inset 0 0 0 1px rgba(255,255,255,.1)"}">${t}</div>`).join("")}</div>
    <div style="font:500 12px B;color:#9AA3B2">All sponsors are made up. Drag one onto the car; it wraps round the bodywork.</div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:300px;bottom:20px;display:grid;gap:7px;align-content:start;padding:14px">
    <h2 style="margin:0">Selected sticker</h2>
    ${lbl("Colour")}${sw(["#F5C518", "#FFFFFF", "#0B0D12", "#0F3D2E", "#FF6B3A", "#5AA9FF"], 0, 24)}
    ${lbl("Font")}${tg(["Barlow", "Condensed", "Mono", "Italic"], 0)}
    ${sl("Size", 38, "38%")}${sl("Rotate", 50, "0°")}
    ${lbl("Put it on")}${tg(["Sidepods", "Engine cover", "Nose", "Rear wing", "Halo", "Front wing"], 0)}
    <div style="height:1px;background:#262B36;margin:6px 0"></div>
    <h2 style="margin:0">Whole car</h2>
    ${lbl("Colours")}<div style="display:flex;gap:10px;align-items:center">${sw(["#0F3D2E", "#F5C518", "#FFFFFF"], -1, 30)}<span class="chip">Pick…</span></div>
    ${lbl("Finish")}${tg(["Gloss", "Satin", "Matte", "Chrome"], 1)}
    ${lbl("Pattern")}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${pats.map((p, i) => `<div style="background:#181C25;border-radius:8px;padding:4px 2px 2px;text-align:center;${i === 0 ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}">${car("#0F3D2E", "#F5C518", p)}<div style="font:600 11px B;color:${i === 0 ? "#FFB547" : "#9AA3B2"}">${p[0]}</div></div>`).join("")}</div>
  </div>
  ${concept("Design concept · livery editor")}`;
}

// ------------------------------------------------------------------ driver kit
if (screen === "kit") {
  const W = 1036, H = 470;
  const suit = (a, b, c) => `<svg width="190" height="300" viewBox="0 0 190 300">
    <path d="M60,40 Q95,28 130,40 L162,70 L176,160 L158,164 L146,96 L142,170 L144,290 L104,290 L96,182 L88,290 L48,290 L50,170 L46,96 L34,164 L16,160 L30,70 Z" fill="${a}" stroke="rgba(255,255,255,.15)"/>
    <path d="M46,96 L60,40 Q95,28 130,40 L144,96 L142,130 L50,130Z" fill="${b}"/>
    <path d="M50,128 L142,128 L142,138 L50,138Z" fill="${c}"/>
    <path d="M78,34 Q95,46 112,34 L110,26 Q95,32 80,26Z" fill="#1B1C20"/>
    <rect x="66" y="66" width="24" height="10" rx="2" fill="${c}"/><text x="118" y="80" text-anchor="middle" font-family="BC" font-weight="700" font-size="20" fill="${c}">7</text>
    <path d="M16,160 L34,164 L32,186 L14,184Z M158,164 L176,160 L178,184 L160,186Z" fill="${b}"/>
    <path d="M48,272 L88,272 L88,290 L44,294Z M104,272 L144,272 L148,294 L104,290Z" fill="#16171B"/></svg>`;
  const glove = (a, b) => `<svg width="70" height="86" viewBox="0 0 70 86"><path d="M14,84 L14,44 Q8,30 12,22 L20,40 L20,10 Q24,4 28,10 L30,34 L32,6 Q36,0 40,6 L41,34 L44,10 Q48,5 51,11 L50,38 L56,22 Q61,20 61,28 L56,56 Q52,70 52,84Z" fill="${a}" stroke="rgba(255,255,255,.15)"/><path d="M14,70 L52,70 L52,84 L14,84Z" fill="${b}"/></svg>`;
  html = top("Garage · <b>Driver kit</b>", `<span class="chip">Seen in the mirrors, onboard, replays and on the podium</span><span class="btn primary">Save</span>`) + `
  <div style="position:absolute;left:24px;top:82px;width:${W}px;height:${H}px;border-radius:12px;overflow:hidden;background:#0E1014 url(h-helmets.png) no-repeat;background-size:${W}px ${W * 900 / 1600}px;background-position:0 -50px;box-shadow:0 0 0 1px #262B36">
    ${[["Your helmet", "editing", 0.215], ["KOWHAI team", "teammate's", 0.5], ["Storm", "weekly event reward", 0.785]].map(([a, b, x], i) => `<div class="hudbox" style="left:${x * 100}%;bottom:14px;transform:translateX(-50%);text-align:center;padding:6px 14px;${i === 0 ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><b style="font:600 14px B;color:${i === 0 ? "#FFB547" : "#E8EAF0"}">${a}</b><div style="font:500 11px B;color:#9AA3B2">${b}</div></div>`).join("")}
    <div class="hudbox" style="right:12px;top:12px;padding:6px 12px;font:600 12px B;color:#C3C9D4">Drag to turn · they're 3D</div>
  </div>
  <div class="panel" style="position:absolute;left:24px;top:${82 + H + 14}px;width:${W}px;bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;align-content:start;padding:14px 18px">
    <h2 style="margin:0;grid-column:span 2">Helmet</h2>
    <div style="display:grid;gap:7px;align-content:start">${lbl("Design")}${tg(["Stripes", "Swirl", "Lightning", "Halves", "Retro ring", "Plain"], 0)}${lbl("Colours")}${sw(["#FFA51F", "#16171B", "#FFFFFF", "#E8EAF0"], 0, 26)}${lbl("Finish")}${tg(["Gloss", "Matte", "Chrome flakes"], 0)}</div>
    <div style="display:grid;gap:7px;align-content:start">${lbl("Visor")}${tg(["Clear", "Smoke", "Gold", "Blue mirror", "Rainbow"], 1)}
      <div style="display:grid;grid-template-columns:auto 1fr auto 1fr;gap:8px;align-items:center;font:600 13px B">${lbl("Number")}<span class="mono" style="background:#0E1117;border:1px solid #262B36;border-radius:7px;padding:5px 10px">27</span>${lbl("Name on back")}<span class="mono" style="background:#0E1117;border:1px solid #262B36;border-radius:7px;padding:5px 10px">KRIS</span></div>
      ${lbl("One-off designs")}<div style="font:500 13px B;color:#C3C9D4">Use a special helmet for one race, like drivers do at their home Grand Prix.</div></div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:476px;bottom:20px;display:grid;gap:10px;align-content:start;padding:14px 18px">
    <h2 style="margin:0">Race suit and gloves</h2>
    <div style="display:flex;gap:18px;align-items:flex-end;justify-content:center;background:#0E1117;border-radius:12px;padding:16px 0 10px">${suit("#16171B", "#FFA51F", "#FFFFFF")}<div style="display:grid;gap:10px">${glove("#16171B", "#FFA51F")}<div style="font:600 11px B;color:#9AA3B2;text-align:center">gloves</div></div></div>
    ${lbl("Suit")}${tg(["Match my team", "Match my helmet", "Custom"], 1)}
    ${lbl("Suit colours")}${sw(["#16171B", "#FFA51F", "#FFFFFF"], 0, 26)}
    ${lbl("Gloves")}${tg(["Suit colours", "Black", "White", "Helmet colours"], 0)}
    ${lbl("Boots")}${tg(["Black", "White", "Team colour"], 0)}
    <div style="background:#181C25;border-radius:10px;padding:10px 12px;font:500 13px/1.45 B;color:#C3C9D4">Your gloves are the ones on the wheel in the cockpit view, and your helmet is what other players see in their mirrors.</div>
  </div>
  ${concept("Design concept · driver kit")}`;
}

// ------------------------------------------------------------------ parts that change the car
if (screen === "parts") {
  const CW = 366, CH = 156;
  const rows = [
    ["Rear wing", "how much the back of the car is pushed down", [
      ["Low drag", "v-rw-low.png", [250, 120, 1100, 470], [["+9 km/h top speed", 1], ["−20% rear grip", -1]], "Monza, Las Vegas"],
      ["Medium", "v-rw-med.png", [250, 120, 1100, 470], [["balanced", 0]], "most tracks", 1],
      ["High downforce", "v-rw-high.png", [250, 120, 1100, 470], [["+18% grip in slow corners", 1], ["−8 km/h", -1]], "Monaco, Singapore"]]],
    ["Sidepods", "shape changes airflow, drag and cooling", [
      ["Downwash", "v-pod-downwash.png", [300, 220, 1100, 470], [["balanced", 0]], "works everywhere", 1],
      ["Slim", "v-pod-slim.png", [300, 220, 1100, 470], [["−3% drag", 1], ["engine runs hotter", -1]], "cool, fast tracks"],
      ["Wide inlet + max cooling", "v-pod-wide.png", [300, 220, 1100, 470], [["best cooling", 1], ["+3% drag", -1]], "hot races: Bahrain, Singapore"]]],
    ["Nose", "where the nose meets the front wing", [
      ["Short (standard)", "v-nose-standard.png", [20, 300, 1100, 470], [["calmer front end", 0]], "easier to drive", 1],
      ["Long", "v-nose-long.png", [20, 300, 1100, 470], [["+4% front grip", 1], ["+1.5 kg", -1]], "twisty tracks"],
      null]],
  ];
  const card = (c) => c ? `<div style="background:#181C25;border-radius:12px;overflow:hidden;${c[5] ? "box-shadow:0 0 0 2px #FFB547" : ""}"><div style="${imgCrop(c[1], ...c[2], CW, CH)}"></div><div style="padding:8px 12px;display:grid;gap:5px"><div class="row" style="justify-content:space-between"><b style="font:600 15px B;color:${c[5] ? "#FFB547" : "#E8EAF0"}">${c[0]}</b><span style="font:500 11px B;color:#9AA3B2">${c[4]}</span></div><div style="display:flex;gap:5px;flex-wrap:wrap">${c[3].map(([t, g]) => eff(t, g)).join("")}</div></div></div>`
    : `<div style="background:#181C25;border-radius:12px;padding:12px 14px;display:grid;gap:8px;align-content:start"><b style="font:600 15px B">Engine cover cooling</b><div style="font:500 12px B;color:#9AA3B2">More louvres = cooler engine, more drag. You can see them on the car.</div>${tg(["Closed", "Normal", "Max"], 1)}<svg width="330" height="70" viewBox="0 0 330 70">${[0, 4, 9].map((n, k) => `<g transform="translate(${k * 112},0)"><path d="M6,58 C30,18 70,10 100,14 L100,58Z" fill="#FFA51F"/>${Array.from({ length: n }, (_, j) => `<rect x="${28 + j * 7}" y="${30 - j * 1.2}" width="3" height="14" rx="1" fill="#0B0D12" transform="rotate(-20 ${30 + j * 7} 36)"/>`).join("")}<text x="52" y="69" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11" text-anchor="middle">${["closed", "normal", "max"][k]}</text></g>`).join("")}</svg>${eff("Spa in summer: Normal is enough", 0)}</div>`;
  html = top("Garage · <b>Parts</b> · they change how the car looks and drives", `<span class="chip">Spa · 2026 cars · dry</span><span class="btn">Try on track</span><span class="btn primary">Fit parts</span>`) + `
  <div style="position:absolute;left:24px;top:80px;width:1132px;display:grid;gap:8px">
    ${rows.map(([t, sub, cards]) => `<div><div class="row" style="gap:12px;margin-bottom:6px"><b style="font:700 20px BC;letter-spacing:.03em">${t}</b><span style="font:500 13px B;color:#9AA3B2">${sub}</span></div><div style="display:grid;grid-template-columns:repeat(3,${CW}px);gap:17px">${cards.map(card).join("")}</div></div>`).join("")}
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:396px;bottom:20px;display:grid;gap:10px;align-content:start">
    <h2 style="margin:0">What these parts do at Spa</h2>
    <div style="font:500 13px B;color:#9AA3B2">Compared with the standard car</div>
    ${bar("Top speed", 62, "#5AA9FF", "+0 km/h")}${bar("Slow corners", 55, "#FFB547", "±0%")}${bar("Fast corners", 60, "#FFB547", "+1%")}${bar("Cooling", 50, "#6EE7A8", "normal")}${bar("Tyre wear", 45, "#FF8A8A", "−2%")}
    ${lbl("Balance", "margin-top:6px")}
    <div style="position:relative;height:28px"><div style="position:absolute;left:0;right:0;top:11px;height:6px;border-radius:3px;background:linear-gradient(90deg,#5AA9FF,#3A4150 45%,#3A4150 55%,#FF8A8A)"></div><i style="position:absolute;left:44%;top:3px;width:4px;height:22px;border-radius:2px;background:#E8EAF0"></i></div>
    <div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2;margin-top:-6px"><span>understeer (safer)</span><span>oversteer (twitchy)</span></div>
    <div style="background:#181C25;border-radius:10px;padding:10px 12px;font:500 13px/1.45 B;color:#C3C9D4"><b style="color:#E8EAF0">Engineer:</b> Spa has long straights and fast corners. The low-drag wing gains time in sectors 1 and 3 but you'll lose it through Pouhon. Try medium first.</div>
    ${lbl("Where parts come from", "margin-top:4px")}
    <div style="font:500 13px/1.45 B;color:#C3C9D4">In quick races every part is open. In career you unlock them with upgrades, and the AI teams bring new parts too.</div>
    ${lbl("Older eras", "margin-top:4px")}
    <div style="font:500 13px/1.45 B;color:#C3C9D4">Each era has its own parts: high or low noses for 2009, bargeboards for 2017, beam wings for 2022.</div>
  </div>
  ${concept("Concept renders · swappable parts on the 2026 car")}`;
}

// ------------------------------------------------------------------ engine maker + sounds
if (screen === "engine") {
  const makers = [
    ["VOLTAN", "Raw power", "#FF6B3A", [92, 60, 58, 48, 55], "Loud and harsh, big turbo whistle", "2 AI teams"],
    ["KESTREL", "Best at recovering battery energy", "#7FE0B8", [76, 94, 72, 66, 70], "Smooth, strong electric whine", "3 AI teams + you", 1],
    ["IRONBARK", "Hardly ever breaks", "#C9A227", [70, 70, 96, 62, 60], "Deep and steady", "3 AI teams"],
    ["AURA", "Uses the least fuel", "#B9A7FF", [68, 78, 74, 95, 82], "Quiet, high-pitched", "2 AI teams"]];
  const stats = ["Power", "Battery recovery", "Reliability", "Fuel saving", "Light weight"];
  const wave = (f, a, n, col, noise) => { let d = "M0,40"; for (let x = 0; x <= 300; x += 2) { const y = 40 + Math.sin(x * f) * a * (0.6 + 0.4 * Math.sin(x * 0.05)) + (noise ? Math.sin(x * 2.7) * noise : 0); d += ` L${x},${y.toFixed(1)}`; } return `<path d="${d}" fill="none" stroke="${col}" stroke-width="2"/>`; };
  const eras = [["1998–2005", "3.0 L V10", "up to 19,000 rpm", "a high, screaming howl", 0.9, 22, "#FF8A3A", 0], ["2006–2013", "2.4 L V8", "18,000 rpm limit", "still high, a bit rougher, KERS hum from 2009", 0.7, 20, "#FFB547", 2], ["2014–2025", "1.6 L V6 turbo hybrid", "15,000 rpm limit", "deeper growl, turbo whistle, quieter", 0.35, 16, "#5AA9FF", 3], ["2026", "1.6 L V6 + 50% electric", "bigger battery push", "electric whine out of slow corners, note drops when the battery runs low", 0.28, 14, "#7FE0B8", 5, 1]];
  html = top("Garage · <b>Engine</b>", `${tg(["Maker", "Build & tune", "Wear"], 0)}<span class="btn primary">Use Kestrel</span>`) + `
  <div style="position:absolute;left:24px;top:82px;right:24px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
    ${makers.map(([n, tag, col, v, snd, used, on]) => `<div class="panel" style="display:grid;gap:8px;${on ? "box-shadow:0 0 0 2px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b style="font:700 30px BC;letter-spacing:.08em;color:${col}">${n}</b>${on ? '<span class="pill" style="background:#2A2310;color:#FFB547">PICKED</span>' : ""}</div><div style="font:600 14px B;margin-top:-6px">${tag}</div>${v.map((x, i) => bar(stats[i], x, col, "", 110).replace('<span class="mono" style="text-align:right;font-size:12px;color:#E8EAF0"></span>', "")).join("")}<div style="font:500 12px B;color:#9AA3B2">🔊 ${snd}</div><div style="font:500 12px B;color:#6B7383">Used by ${used}</div></div>`).join("")}
  </div>
  <div class="panel" style="position:absolute;left:24px;top:342px;width:1060px;bottom:20px;display:grid;gap:10px;align-content:start">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Engine sounds change with the era</h2><span class="chip">made with Web Audio, no recordings</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${eras.map(([y, t, rpm, d, f, a, col, nz, on]) => `<div style="background:#181C25;border-radius:12px;padding:12px;display:grid;gap:6px;${on ? "box-shadow:inset 0 0 0 1px #7FE0B8" : ""}"><div class="row" style="justify-content:space-between"><b class="mono" style="font-size:15px;color:${col}">${y}</b><span style="width:30px;height:30px;border-radius:50%;background:${col};display:grid;place-items:center;color:#0B0D12;font-size:12px">▶</span></div><b style="font:600 15px B">${t}</b><div style="font:600 12px B;color:#9AA3B2">${rpm}</div><svg width="100%" height="150" viewBox="0 0 300 80" preserveAspectRatio="none" style="background:#0E1117;border-radius:8px">${wave(f, a, 0, col, nz)}</svg><div style="font:500 13px/1.45 B;color:#C3C9D4;min-height:56px">${d}</div><div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2"><span>onboard</span><span>TV</span><span>grandstand</span></div><div class="bar" style="height:5px"><i style="width:${[30, 50, 70, 50][eras.findIndex((e) => e[0] === y)]}%;background:${col}"></i></div></div>`).join("")}</div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:342px;width:476px;bottom:20px;display:grid;gap:9px;align-content:start">
    <h2 style="margin:0">Sound mixer</h2>
    ${sl("Engine", 80, "80%")}${sl("Turbo whistle", 55, "55%")}${sl("Battery whine", 45, "45%")}${sl("Gear-shift crack", 60, "60%")}${sl("Tyres and wind", 35, "35%")}
    ${lbl("Exhaust note", "margin-top:4px")}${tg(["Real for the era", "Louder", "V10 on any car (just for fun)"], 0)}
    ${lbl("Each maker sounds a bit different")}${tg(["On", "Off"], 0)}
    ${lbl("Where you hear it from", "margin-top:4px")}${tg(["Onboard", "TV camera", "Grandstand"], 0)}
    <div style="font:500 12px B;color:#9AA3B2">The Lights Out game stays engine-free, with only the light beeps.</div>
  </div>
  ${concept("Design concept · engine makers (all made up) and sounds by era")}`;
}

// ------------------------------------------------------------------ engine builder (customisable)
if (screen === "build") {
  const comp = [
    ["Combustion engine", "V6 · 1.6 L turbo", [["Tune", "slider", 62, "Power +2% · life −1 race"]], 8],
    ["Turbo", "squeezes more air into the engine", [["Size", ["Small · quick response", "Medium", "Large · more top end, lag below 9,000 rpm"], 1]], 6, 1],
    ["Electric motor (MGU-K)", "350 kW out, charges under braking", [["Deploy map", ["Short bursts", "Even", "Long straights"], 1]], 6],
    ["Battery", "where the energy is stored", [["Size", ["Light · −4 kg, less storage", "Standard", "Big · +6 kg, more storage"], 1]], 5],
    ["Fuel map", "how rich the engine runs", [["Map", ["Lean · saves fuel", "Standard", "Rich · more power, hotter"], 1]], 4],
    ["Gearbox", "8 gears", [["Ratios", ["Short · quick out of corners", "Medium", "Long · more top speed"], 2]], 4],
    ["Cooling", "matches the louvres on the bodywork", [["Level", ["Closed", "Normal", "Max"], 1]], 3],
  ];
  const opt = ([n, kind, v, txt]) => kind === "slider" ? `<div style="display:grid;grid-template-columns:1fr 70px;gap:10px;align-items:center"><div><div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2"><span>longer life</span><span>more power</span></div><div style="position:relative;height:6px;border-radius:3px;background:linear-gradient(90deg,#6EE7A8,#3A4150 50%,#FF6B3A);margin-top:6px"><b style="position:absolute;left:${v}%;top:50%;width:15px;height:15px;border-radius:50%;background:#E8EAF0;transform:translate(-50%,-50%)"></b></div></div><span style="font:600 11px B;color:#FFB547;text-align:right">${txt}</span></div>` : tg(kind, v);
  const rpm = (r) => 30 + (r / 15000) * 520, pw = (k) => 300 - (k / 800) * 260;
  let ice = "", ele = "", stock = "";
  for (let r = 4000; r <= 15000; r += 250) { const k = r < 11500 ? 120 + ((r - 4000) / 7500) * 290 : 410 - ((r - 11500) / 3500) ** 2 * 60; ice += `${ice ? "L" : "M"}${rpm(r).toFixed(1)},${pw(k).toFixed(1)}`; ele += `${ele ? "L" : "M"}${rpm(r).toFixed(1)},${pw(k + (r > 6000 ? 350 : 350 * ((r - 4000) / 2000))).toFixed(1)}`; stock += `${stock ? "L" : "M"}${rpm(r).toFixed(1)},${pw((r < 11500 ? 120 + ((r - 4000) / 7500) * 280 : 400 - ((r - 11500) / 3500) ** 2 * 60) + (r > 6000 ? 350 : 350 * ((r - 4000) / 2000))).toFixed(1)}`; }
  const iceArea = ice + `L${rpm(15000)},${pw(0)}L${rpm(4000)},${pw(0)}Z`;
  const eleArea = ele + "L" + ice.slice(1).split("L").reverse().join("L") + "Z";
  html = top("Garage · Engine · <b>Build & tune</b>", `${tg(["Maker", "Build & tune", "Wear"], 1)}<span class="chip">Budget <b class="mono" style="color:#FFB547">36 / 40</b> points</span><span class="btn primary">Test on the dyno</span>`) + `
  <div class="panel" style="position:absolute;left:24px;top:82px;width:740px;height:420px;padding:12px 16px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">KESTREL power unit · 2026</h2>${tg(["2026 rules", "Free build (fun)"], 0)}</div>
    <svg width="706" height="360" viewBox="0 0 706 360" style="margin-top:4px">
      <defs><linearGradient id="blk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3F4A"/><stop offset="1" stop-color="#22262E"/></linearGradient></defs>
      <rect x="0" y="0" width="706" height="360" rx="12" fill="#0E1117"/>
      <g transform="translate(205,110)"><rect x="0" y="40" width="300" height="130" rx="14" fill="url(#blk)" stroke="#4A505C"/>${[0, 1, 2].map((k) => `<rect x="${24 + k * 92}" y="0" width="70" height="56" rx="8" fill="#2E333D" stroke="#4A505C"/>`).join("")}<text x="150" y="112" fill="#E8EAF0" font-family="BC" font-weight="700" font-size="22" text-anchor="middle">V6 · 1.6 L</text><text x="150" y="134" fill="#FFB547" font-family="B" font-weight="600" font-size="12" text-anchor="middle">tune: power +2%</text></g>
      <g transform="translate(60,40)"><circle cx="60" cy="60" r="50" fill="#2A2310" stroke="#FFB547" stroke-width="2.5"/><path d="M60,60 m-30,0 a30,30 0 1,1 30,30" fill="none" stroke="#FFB547" stroke-width="5"/><circle cx="60" cy="60" r="9" fill="#FFB547"/><text x="60" y="132" fill="#FFB547" font-family="B" font-weight="700" font-size="13" text-anchor="middle">TURBO · medium</text><text x="60" y="148" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11" text-anchor="middle">editing</text></g>
      <path d="M170,100 C190,110 200,140 215,160" stroke="#FFB547" stroke-width="2" fill="none" stroke-dasharray="5 4"/>
      <g transform="translate(540,120)"><rect x="0" y="0" width="140" height="80" rx="40" fill="#10213A" stroke="#5AA9FF" stroke-width="2"/><text x="70" y="36" fill="#7FC4FF" font-family="B" font-weight="700" font-size="13" text-anchor="middle">ELECTRIC MOTOR</text><text x="70" y="54" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11" text-anchor="middle">350 kW · even map</text></g>
      <path d="M505,190 L540,170" stroke="#5AA9FF" stroke-width="2"/>
      <g transform="translate(230,300)"><rect x="0" y="0" width="250" height="44" rx="8" fill="#12301F" stroke="#2FD27A" stroke-width="2"/>${Array.from({ length: 10 }, (_, k) => `<rect x="${12 + k * 23}" y="10" width="16" height="24" rx="3" fill="#2FD27A" opacity="${k < 7 ? 0.9 : 0.25}"/>`).join("")}</g>
      <text x="355" y="292" fill="#6EE7A8" font-family="B" font-weight="700" font-size="13" text-anchor="middle">BATTERY · standard</text>
      <g transform="translate(550,250)"><rect x="0" y="0" width="120" height="60" rx="8" fill="#1C2230" stroke="#4A505C"/><text x="60" y="27" fill="#C3C9D4" font-family="B" font-weight="700" font-size="12" text-anchor="middle">ELECTRONICS</text><text x="60" y="44" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11" text-anchor="middle">controls it all</text></g>
      <g transform="translate(20,240)"><path d="M0,30 L110,30 L130,10 L150,10" stroke="#9AA3B2" stroke-width="10" fill="none" stroke-linecap="round"/><text x="70" y="62" fill="#C3C9D4" font-family="B" font-weight="700" font-size="12" text-anchor="middle">EXHAUST · raw note</text></g>
    </svg>
  </div>
  <div class="panel" style="position:absolute;left:24px;top:516px;width:740px;bottom:20px;padding:12px 16px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Dyno</h2><span style="display:flex;gap:12px;font:600 12px B"><span style="color:#FF8A3A">■ engine</span><span style="color:#5AA9FF">■ electric</span><span style="color:#9AA3B2">- - stock</span></span></div>
    <div style="display:grid;grid-template-columns:560px 1fr;gap:14px;align-items:center">
      <svg width="560" height="310" viewBox="0 0 560 310"><g stroke="#262B36">${[0, 200, 400, 600, 800].map((k) => `<line x1="30" x2="560" y1="${pw(k)}" y2="${pw(k)}"/><text x="0" y="${pw(k) + 4}" fill="#6B7383" font-family="JB" font-size="10">${k}</text>`).join("")}</g>
        <path d="${eleArea}" fill="#5AA9FF" opacity=".35"/><path d="${iceArea}" fill="#FF8A3A" opacity=".35"/><path d="${ice}" fill="none" stroke="#FF8A3A" stroke-width="2.5"/><path d="${ele}" fill="none" stroke="#5AA9FF" stroke-width="2.5"/><path d="${stock}" fill="none" stroke="#9AA3B2" stroke-width="1.5" stroke-dasharray="5 4"/>
        ${[4000, 8000, 12000, 15000].map((r) => `<text x="${rpm(r)}" y="306" fill="#6B7383" font-family="JB" font-size="10" text-anchor="middle">${r / 1000}k</text>`).join("")}<text x="34" y="14" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11">kW</text><text x="552" y="290" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11" text-anchor="end">rpm</text></svg>
      <div style="display:grid;gap:10px">${[["Peak power", "≈1,010 hp", "+10 hp vs stock", 1], ["Fuel per lap", "1.62 kg", "+0.03 kg", -1], ["Engine life", "6 races", "−1 race", -1], ["Weight", "+0 kg", "", 0]].map(([a, b, c, g]) => `<div><div class="lbl2">${a}</div><div style="font:600 18px B">${b}</div>${c ? `<div style="font:600 11px B;color:${g > 0 ? "#6EE7A8" : g < 0 ? "#FF8A8A" : "#9AA3B2"}">${c}</div>` : ""}</div>`).join("")}</div>
    </div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:788px;bottom:20px;display:grid;gap:7px;align-content:start;padding:14px 18px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Parts and tuning</h2><span style="font:600 12px B;color:#9AA3B2">points</span></div>
    ${comp.map(([n, sub, opts, cost, sel]) => `<div style="display:grid;grid-template-columns:200px 1fr 34px;gap:14px;align-items:center;padding:9px 12px;border-radius:10px;background:${sel ? "#2A2310" : "#181C25"};${sel ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><div><b style="font:600 15px B;color:${sel ? "#FFB547" : "#E8EAF0"}">${n}</b><div style="font:500 12px B;color:#9AA3B2">${sub}</div></div><div>${opts.map(opt).join("")}</div><b class="mono" style="text-align:right;color:#C3C9D4">${cost}</b></div>`).join("")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">
      <div style="background:#181C25;border-radius:10px;padding:10px 12px;font:500 13px/1.45 B;color:#C3C9D4"><b style="color:#E8EAF0">2026 rules:</b> power and battery are capped like the real cars, so tuning moves performance around rather than adding lots of it.</div>
      <div style="background:#181C25;border-radius:10px;padding:10px 12px;font:500 13px/1.45 B;color:#C3C9D4"><b style="color:#E8EAF0">Free build:</b> no caps, for fun races only. Builds can be shared as a code, like setups.</div>
    </div>
    ${lbl("Saved builds", "margin-top:6px")}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${[["Spa race", "even deploy · long gears", 1], ["Monaco", "small turbo · short gears"], ["Fuel saver", "lean map · max life"]].map(([a, b, on]) => `<div style="background:${on ? "#2A2310" : "#181C25"};border-radius:10px;padding:10px 12px;${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><b style="font:600 14px B;color:${on ? "#FFB547" : "#E8EAF0"}">${a}</b><div style="font:500 12px B;color:#9AA3B2">${b}</div></div>`).join("")}</div>
  </div>
  ${concept("Design concept · customisable engine")}`;
}

// ------------------------------------------------------------------ wear and penalties
if (screen === "wear") {
  const C = [["Engine", 4, 3, 71, "~2 races", "#FFB547"], ["Turbo", 4, 3, 64, "~3 races", "#FFB547"], ["Electric motor", 4, 2, 48, "~5 races", "#6EE7A8"], ["Battery", 2, 2, 33, "~8 races", "#6EE7A8"], ["Electronics", 2, 1, 86, "~1 race", "#FF8A8A"], ["Exhaust", 8, 5, 40, "~4 races", "#6EE7A8"], ["Gearbox", 4, 2, 58, "~4 races", "#FFB547"]];
  const dots = (n, used) => Array.from({ length: n }, (_, i) => `<i style="width:13px;height:13px;border-radius:50%;${i < used - 1 ? "background:#3A4150" : i === used - 1 ? "background:#FFB547" : "box-shadow:inset 0 0 0 2px #3A4150"}"></i>`).join("");
  html = top("Career · <b>Engine and gearbox wear</b>", `<span class="chip">Round 14 of 24 · Spa</span>${tg(["Wear off", "Light", "Real"], 2)}`) + `
  <div class="panel" style="position:absolute;left:24px;top:82px;width:960px;height:428px;display:grid;gap:6px;align-content:start">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Your car's parts</h2><span style="font:600 12px B;color:#9AA3B2">● fitted now · ○ still in your allowance · ● used up</span></div>
    <div style="display:grid;grid-template-columns:170px 160px 1fr 110px;gap:14px;padding:4px 10px" class="lbl2"><span>Part</span><span>Season allowance</span><span>Wear on the one fitted now</span><span style="text-align:right">Lasts about</span></div>
    ${C.map(([n, a, u, w, left, col]) => `<div style="display:grid;grid-template-columns:170px 160px 1fr 110px;gap:14px;align-items:center;padding:10px;border-radius:10px;background:${w > 80 ? "#2A1717" : "#181C25"}"><b style="font:600 15px B">${n}</b><span style="display:flex;gap:5px">${dots(a, u)}<span class="mono" style="font-size:12px;color:#9AA3B2;margin-left:6px">${u}/${a}</span></span><div style="display:grid;grid-template-columns:1fr 46px;gap:10px;align-items:center"><div class="bar" style="height:10px"><i style="width:${w}%;background:${col}"></i></div><span class="mono" style="font-size:13px;color:${col}">${w}%</span></div><span style="text-align:right;font:600 14px B;color:${w > 80 ? "#FF8A8A" : "#E8EAF0"}">${left}</span></div>`).join("")}
    <div style="font:500 12px B;color:#9AA3B2;margin-top:4px">Allowances are the game's, based on the real rules. Hot races, rich fuel maps and kerb-hopping wear parts faster.</div>
  </div>
  <div class="panel" style="position:absolute;left:24px;top:524px;width:960px;bottom:20px;display:grid;gap:10px;align-content:start">
    <h2 style="margin:0">Season plan</h2>
    <div style="position:relative;height:70px">
      <div style="position:absolute;left:0;right:0;top:30px;height:4px;background:#262B36;border-radius:2px"></div>
      ${Array.from({ length: 24 }, (_, i) => `<i style="position:absolute;left:${(i / 23) * 100}%;top:26px;width:12px;height:12px;border-radius:50%;transform:translateX(-50%);background:${i < 13 ? "#3A4150" : i === 13 ? "#FFB547" : "#1C2230"};box-shadow:inset 0 0 0 2px ${i === 13 ? "#FFB547" : "#3A4150"}"></i>`).join("")}
      ${[[0, "E1"], [5, "E2"], [10, "E3"], [14, "E4?", 1]].map(([r, t, plan]) => `<span style="position:absolute;left:${(r / 23) * 100}%;top:0;transform:translateX(-50%);font:700 12px JB;color:${plan ? "#7FC4FF" : "#C3C9D4"};${plan ? "border:1px dashed #7FC4FF;border-radius:5px;padding:0 4px" : ""}">${t}</span>`).join("")}
      <span style="position:absolute;left:${(13 / 23) * 100}%;top:46px;transform:translateX(-50%);font:600 12px B;color:#FFB547">Spa</span><span style="position:absolute;left:${(14 / 23) * 100}%;top:46px;font:600 12px B;color:#7FC4FF;padding-left:12px">Monza</span>
    </div>
    <div style="font:500 13px B;color:#C3C9D4">E = new engine fitted. Your engineer suggests fitting engine 4 at Monza, where the long straights make it easier to recover places.</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${[["Engine 4 + turbo 4", "Monza · round 15", "no penalty"], ["Gearbox 3", "Singapore · round 18", "no penalty"], ["Engine 5 (over the limit)", "only if one breaks", "+10 places"]].map(([a, b, c], i) => `<div style="background:#181C25;border-radius:10px;padding:10px 12px"><b style="font:600 14px B">${a}</b><div style="font:500 12px B;color:#9AA3B2">${b}</div><div style="font:600 12px B;color:${i === 2 ? "#FF8A8A" : "#6EE7A8"};margin-top:2px">${c}</div></div>`).join("")}</div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:568px;bottom:20px;display:grid;gap:10px;align-content:start">
    <span class="pill" style="background:#3A1717;color:#FF8A8A;justify-self:start">DECISION BEFORE SPA</span>
    <h2 style="margin:0">Electronics at 86%</h2>
    <div style="font:500 14px/1.5 B;color:#C3C9D4">You're on the first of two allowed. Changing now is free; running it longer risks losing power or retiring.</div>
    ${[["Fit electronics #2 now", "No penalty. But the next one after this costs 10 grid places.", "Recommended", 1], ["Keep it for one more race", "About a 14% chance it fails during the race.", "Risky", 0], ["Change everything now (engine 4 + electronics 2)", "No penalty today, but engine 4 then has to last the final 11 races, so you'll probably need a 5th later (+10 places).", "Strategic", 0]].map(([a, b, tag, on]) => `<div style="background:${on ? "#2A2310" : "#181C25"};border-radius:12px;padding:12px 14px;display:grid;gap:4px;${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b style="font:600 15px B">${a}</b><span class="pill" style="background:#1C2230;color:${on ? "#FFB547" : "#9AA3B2"}">${tag}</span></div><div style="font:500 13px B;color:#C3C9D4">${b}</div></div>`).join("")}
    ${lbl("Failure chance as parts wear", "margin-top:6px")}
    <svg width="520" height="150" viewBox="0 0 520 150"><g stroke="#262B36"><line x1="30" x2="520" y1="130" y2="130"/><line x1="30" x2="520" y1="70" y2="70"/><line x1="30" x2="520" y1="10" y2="10"/></g><text x="0" y="134" fill="#6B7383" font-family="JB" font-size="10">0%</text><text x="0" y="74" fill="#6B7383" font-family="JB" font-size="10">15%</text><text x="0" y="14" fill="#6B7383" font-family="JB" font-size="10">30%</text>
      <path d="M30,129 C200,128 330,120 400,100 C450,84 490,50 520,12" fill="none" stroke="#FF8A8A" stroke-width="3"/><line x1="451" x2="451" y1="10" y2="130" stroke="#FFB547" stroke-dasharray="4 4"/><circle cx="451" cy="82" r="5" fill="#FFB547"/><text x="444" y="76" fill="#FFB547" font-family="B" font-weight="700" font-size="12" text-anchor="end">electronics now</text>
      <text x="30" y="148" fill="#6B7383" font-family="B" font-weight="600" font-size="10">new</text><text x="520" y="148" fill="#6B7383" font-family="B" font-weight="600" font-size="10" text-anchor="end">worn out</text></svg>
    ${lbl("Going over the allowance", "margin-top:6px")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[["First extra part", "10 places back on the grid"], ["Each one after that", "5 places back"]].map(([a, b]) => `<div style="background:#181C25;border-radius:10px;padding:10px 12px"><b style="font:600 14px B">${a}</b><div style="font:500 13px B;color:#FF8A8A">${b}</div></div>`).join("")}</div>
    <div style="font:500 12px B;color:#9AA3B2">Same idea as the real penalties. With "Light" wear you get double the allowance; with "Wear off" parts never wear out.</div>
  </div>
  ${concept("Design concept · engine and gearbox wear (optional)")}`;
}

// ------------------------------------------------------------------ your own team
if (screen === "team") {
  const shapes = ["Shield", "Circle", "Wing", "Hexagon", "Badge"], syms = ["Flower", "Bird", "Bolt", "Star", "Mountain", "Letter"];
  const flower = (cx, cy, r, col) => Array.from({ length: 5 }, (_, k) => { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; return `<ellipse cx="${cx + Math.cos(a) * r * 0.55}" cy="${cy + Math.sin(a) * r * 0.55}" rx="${r * 0.32}" ry="${r * 0.6}" transform="rotate(${(a * 180) / Math.PI + 90} ${cx + Math.cos(a) * r * 0.55} ${cy + Math.sin(a) * r * 0.55})" fill="${col}"/>`; }).join("") + `<circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="#0F3D2E"/>`;
  const drivers = [["Tane Walker", "New Zealand", 81, "Great in the rain", 1], ["Sofia Brandt", "Germany", 84, "Fast over one lap"], ["Leo Okafor", "Britain", 77, "Young and cheap, improves quickly"]];
  html = top("Career · <b>Create your team</b>", `${["Name & colours", "Logo", "Engine", "Drivers", "Start"].map((t, i) => `<span class="chip" style="${i === 3 ? "background:#2A2310;color:#FFB547" : ""}">${i < 3 ? "✓ " : `${i + 1} `}${t}</span>`).join("")}<span class="btn primary">Next →</span>`) + `
  <div class="panel" style="position:absolute;left:24px;top:82px;width:470px;bottom:20px;display:grid;gap:9px;align-content:start">
    <h2 style="margin:0">Name and colours</h2>
    ${lbl("Team name")}<div style="background:#0E1117;border:1px solid #262B36;border-radius:8px;padding:9px 12px;font:600 17px B">KOWHAI GP</div>
    ${lbl("Short name (timing tower)")}<div class="mono" style="background:#0E1117;border:1px solid #262B36;border-radius:8px;padding:7px 12px;width:90px">KOW</div>
    ${lbl("Colours")}${sw(["#0F3D2E", "#F5C518", "#FFFFFF"], -1, 34)}
    ${lbl("Home base")}<div style="background:#0E1117;border:1px solid #262B36;border-radius:8px;padding:8px 12px;font:600 14px B">Christchurch, New Zealand</div>
    ${lbl("Engine")}${tg(["Voltan", "Kestrel", "Ironbark", "Aura"], 1)}
    ${lbl("Start as")}
    ${[["Backmarker", "slow car, big budget for upgrades, low expectations"], ["Midfield", "fight for points, normal budget", 1], ["Front-runner", "fast car, small budget, must win"]].map(([a, b, on]) => `<div style="background:${on ? "#2A2310" : "#181C25"};border-radius:10px;padding:8px 12px;${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><b style="font:600 14px B;color:${on ? "#FFB547" : "#E8EAF0"}">${a}</b><div style="font:500 12px B;color:#9AA3B2">${b}</div></div>`).join("")}
  </div>
  <div class="panel" style="position:absolute;left:510px;top:82px;width:470px;bottom:20px;display:grid;gap:10px;align-content:start">
    <h2 style="margin:0">Logo</h2>
    <div style="background:#0E1117;border-radius:12px;display:grid;place-items:center;padding:16px"><svg width="230" height="250" viewBox="0 0 230 250"><path d="M115,8 L210,40 L200,150 Q180,210 115,240 Q50,210 30,150 L20,40Z" fill="#0F3D2E" stroke="#F5C518" stroke-width="6"/>${flower(115, 110, 62, "#F5C518")}<text x="115" y="205" fill="#FFFFFF" font-family="BC" font-weight="700" font-size="34" text-anchor="middle" letter-spacing="3">KOWHAI</text></svg></div>
    ${lbl("Shape")}${tg(shapes, 0)}${lbl("Symbol")}${tg(syms, 0)}${lbl("Text")}${tg(["Condensed", "Wide", "Italic", "None"], 0)}
    <div style="font:500 13px B;color:#C3C9D4">Built from shapes, so it stays sharp everywhere: on the car, the crew's shirts, the garage and the timing tower.</div>
    ${lbl("On the timing tower", "margin-top:4px")}
    <div style="background:#0E1117;border-radius:10px;overflow:hidden;width:280px">${[["5", "AXM", "#5AA9FF", "+4.218"], ["6", "KOW", "#F5C518", "+5.031", 1], ["7", "KOW", "#F5C518", "+6.940"]].map(([p, n, c, g, me]) => `<div style="display:flex;gap:10px;align-items:center;padding:6px 12px;font:600 14px B;${me ? "background:#2A2310" : ""}"><span class="mono" style="width:16px;color:#9AA3B2">${p}</span><i style="width:4px;height:16px;border-radius:2px;background:${c}"></i><b style="font:700 16px BC;letter-spacing:.05em">${n}</b><span class="mono" style="margin-left:auto;font-size:13px;color:#9AA3B2">${g}</span></div>`).join("")}</div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:572px;bottom:20px;display:grid;gap:10px;align-content:start">
    <div style="border-radius:10px;${imgCrop("g-garage.png", 300, 230, 960, 470, 536, 262)}"></div>
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Pick a teammate</h2><span style="font:600 12px B;color:#9AA3B2">you are driver #7</span></div>
    ${drivers.map(([n, c, r, d, on]) => `<div style="display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;background:${on ? "#2A2310" : "#181C25"};border-radius:10px;padding:9px 12px;${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><span style="width:46px;height:46px;border-radius:50%;background:#262B36;display:grid;place-items:center;font:700 18px BC;color:#C3C9D4">${n.split(" ").map((x) => x[0]).join("")}</span><div><b style="font:600 15px B;color:${on ? "#FFB547" : "#E8EAF0"}">${n}</b><div style="font:500 12px B;color:#9AA3B2">${c} · ${d}</div></div><b class="mono" style="font-size:20px">${r}</b></div>`).join("")}
    <div style="font:500 12px B;color:#9AA3B2">All drivers are made up. Or invite a friend to be your teammate in co-op career.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">${[["Budget", "$140m a season"], ["Board's target", "6th in the championship"]].map(([a, b]) => `<div style="background:#181C25;border-radius:10px;padding:10px 12px"><div class="lbl2">${a}</div><b style="font:600 16px B">${b}</b></div>`).join("")}</div>
  </div>
  ${concept("Design concept · create your team")}`;
}

// ------------------------------------------------------------------ upgrades + fair/realistic
if (screen === "upgrades") {
  const T = {
    Aero: [["Front wing B", "done"], ["Floor edge", "done"], ["Sidepods B", "build", "arrives next race · changes the look"], ["Low-drag rear wing", "open", 6], ["Diffuser C", "locked"]],
    Chassis: [["Lighter tub −2 kg", "done"], ["Stiffer suspension", "open", 4], ["Brake ducts", "open", 3], ["Steering response", "locked"], ["Lighter tub −3 kg", "locked"]],
    Engine: [["Turbo response", "done"], ["Battery recovery +5%", "build", "2 races"], ["Deploy map v2", "open", 5], ["Power +1%", "locked"], ["Power +1% (2)", "locked"]],
    Reliability: [["Gearbox life", "done"], ["Engine cooling", "open", 3], ["Electronics", "open", 4], ["Fewer failures", "locked"], ["Fit parts faster", "locked"]],
  };
  const col = { done: "#2FD27A", build: "#FFB547", open: "#E8EAF0", locked: "#3A4150" };
  const node = ([n, st, extra]) => `<div style="position:relative;background:${st === "build" ? "#2A2310" : "#181C25"};border-radius:10px;padding:9px 11px;box-shadow:inset 0 0 0 ${st === "open" ? 1 : st === "build" ? 1.5 : 0}px ${st === "open" ? "#3A4150" : "#FFB547"};opacity:${st === "locked" ? 0.45 : 1}"><div class="row" style="justify-content:space-between;gap:6px"><b style="font:600 13px B;color:${st === "locked" ? "#9AA3B2" : "#E8EAF0"}">${n}</b><span style="font:700 12px B;color:${col[st]}">${st === "done" ? "✓" : st === "build" ? "⚙" : st === "open" ? `<span class="mono">${extra}</span> pts` : "🔒"}</span></div>${st === "build" ? `<div class="bar" style="height:5px;margin-top:6px"><i style="width:${n.startsWith("Side") ? 70 : 35}%;background:#FFB547"></i></div><div style="font:500 11px B;color:#FFB547;margin-top:4px">${extra}</div>` : ""}</div>`;
  html = top("Career · <b>Upgrades</b>", `<span class="chip">Points <b class="mono" style="color:#FFB547">18</b></span><span class="chip">Next race in 6 days</span><span class="btn primary">Start building</span>`) + `
  <div class="panel" style="position:absolute;left:24px;top:82px;width:960px;bottom:20px;display:grid;gap:10px;align-content:start">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Development tree</h2><span style="font:600 12px B;color:#9AA3B2">✓ done · ⚙ being built · pts = cost · 🔒 needs the one above</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">${Object.entries(T).map(([k, ns]) => `<div style="display:grid;gap:0;align-content:start"><div class="lbl2" style="margin-bottom:8px;color:#FFB547">${k}</div>${ns.map((n, i) => `${i ? `<div style="width:2px;height:16px;background:#3A4150;margin-left:18px"></div>` : ""}${node(n)}`).join("")}</div>`).join("")}</div>
    <div class="row" style="justify-content:space-between;margin-top:10px"><h2 style="margin:0">Pace through the season</h2><span style="font:600 12px B;color:#9AA3B2">gap to the fastest car, per race</span></div>
    <svg width="912" height="190" viewBox="0 0 912 190"><g stroke="#262B36">${[20, 70, 120, 170].map((y) => `<line x1="40" x2="912" y1="${y}" y2="${y}"/>`).join("")}</g>${["0.0", "0.5", "1.0", "1.5"].map((t, i) => `<text x="0" y="${24 + i * 50}" fill="#6B7383" font-family="JB" font-size="10">${t}s</text>`).join("")}
      ${[["#5AA9FF", [0.1, 0.1, 0.05, 0, 0, 0.05, 0, 0, 0.1, 0.05, 0, 0, 0.05, 0]], ["#FF6B3A", [0, 0, 0.1, 0.2, 0.15, 0.1, 0.15, 0.2, 0.1, 0.2, 0.25, 0.2, 0.15, 0.2]], ["#C9B6FF", [0.5, 0.45, 0.5, 0.4, 0.45, 0.35, 0.4, 0.3, 0.35, 0.3, 0.3, 0.35, 0.3, 0.25]], ["#F5C518", [1.2, 1.15, 1.05, 1.0, 0.95, 0.8, 0.75, 0.7, 0.6, 0.55, 0.5, 0.45, 0.42, 0.35], 1]].map(([c, v, me]) => `<path d="${v.map((g, i) => `${i ? "L" : "M"}${40 + i * 67},${20 + g * 100}`).join("")}" fill="none" stroke="${c}" stroke-width="${me ? 3.5 : 2}" opacity="${me ? 1 : 0.6}"/>`).join("")}
      <text x="908" y="82" fill="#F5C518" font-family="B" font-weight="700" font-size="12" text-anchor="end">KOWHAI (you)</text><text x="40" y="186" fill="#6B7383" font-family="B" font-weight="600" font-size="10">round 1</text><text x="911" y="186" fill="#6B7383" font-family="B" font-weight="600" font-size="10" text-anchor="end">round 14</text></svg>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:8px">${[["Points come from", "race results, sponsor goals and practice programmes"], ["AI teams upgrade too", "the order changes through the season, like the real thing"], ["Spending cap", "a limit per season, so you can't buy everything"]].map(([a, b]) => `<div style="background:#181C25;border-radius:10px;padding:10px 12px"><b style="font:600 14px B">${a}</b><div style="font:500 13px B;color:#9AA3B2">${b}</div></div>`).join("")}</div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:568px;height:322px;display:grid;gap:8px;align-content:start">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Arriving next race: Sidepods B</h2><span class="pill" style="background:#2A2310;color:#FFB547">70%</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[["Now", "v-pod-downwash.png"], ["Spec B", "v-pod-slim.png"]].map(([t, f], i) => `<div><div style="border-radius:10px;${imgCrop(f, 330, 230, 900, 520, 258, 149)}"></div><div style="font:600 13px B;margin-top:5px;color:${i ? "#FFB547" : "#C3C9D4"}">${t}</div></div>`).join("")}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${eff("−3% drag", 1)}${eff("+0.12 s a lap at Spa", 1)}${eff("needs more cooling in hot races", -1)}</div>
    <div style="font:500 13px B;color:#C3C9D4">Upgrades change the car you see as well as how it drives, so rivals spot your new parts too.</div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:418px;width:568px;bottom:20px;display:grid;gap:8px;align-content:start">
    <h2 style="margin:0">Fair or realistic cars?</h2>
    ${[["Identical cars", "Same speed for everyone. Liveries and kit only. Default for ranked online races.", 0], ["Real team differences", "Each team has its own strengths, like the real grid.", 1], ["Career progress", "Start where you picked and upgrade from there; AI teams develop too.", 0]].map(([a, b, on]) => `<div style="background:${on ? "#2A2310" : "#181C25"};border-radius:10px;padding:9px 12px;${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><b style="font:600 14px B;color:${on ? "#FFB547" : "#E8EAF0"}">${a}</b><div style="font:500 12px B;color:#9AA3B2">${b}</div></div>`).join("")}
    <div style="font:500 12px B;color:#9AA3B2">In friends' lobbies the host picks. Setups and engine tunes still work in identical-car races.</div>
  </div>
  ${concept("Design concept · upgrades, and fair vs realistic cars")}`;
}

root.innerHTML = html;
await new Promise((r) => setTimeout(r, 800));
document.title = "done";

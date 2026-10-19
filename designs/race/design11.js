// Design concepts: gearbox ratios, how the engine fires, driveline controls on the wheel
const screen = new URLSearchParams(location.search).get("screen") || "gears";
const root = document.getElementById("root");
const top = (crumb, right = "") => `<div class="top"><div class="brand">RACELIMIT<small>RACE</small></div><div class="crumbs">${crumb}</div><div class="sp"></div>${right}</div>`;
const tg = (opts, on) => `<div class="tg">${opts.map((o, i) => `<span class="${i === on ? "on" : ""}">${o}</span>`).join("")}</div>`;
const sl = (label, v, txt) => `<div class="sl"><span>${label}</span><div class="tr"><i style="width:${v}%"></i><b style="left:${v}%"></b></div><span class="mono" style="text-align:right">${txt}</span></div>`;
const lbl = (t, extra = "") => `<div class="lbl2" style="${extra}">${t}</div>`;
const eff = (t, g) => `<span class="pill" style="background:${g === 1 ? "#12301F" : g === 0 ? "#1C2230" : "#3A1717"};color:${g === 1 ? "#6EE7A8" : g === 0 ? "#C3C9D4" : "#FF8A8A"};font-size:11px;padding:2px 8px;letter-spacing:0">${t}</span>`;
const concept = (t) => `<div class="concept" style="text-shadow:0 1px 4px #000">${t}</div>`;
const imgCrop = (f, x, y, w, h, cw, ch) => { const s = cw / w; return `background:#0B0D12 url(${f}) no-repeat;background-size:${1600 * s}px ${900 * s}px;background-position:${-x * s}px ${-y * s}px;width:${cw}px;height:${ch}px`; };
const tabs = (on) => tg(["Maker", "Build & tune", "Gearbox", "How it fires", "Wear"], on);
const GC = ["#8B6CFF", "#5B7CFF", "#3FA0FF", "#2FC6D6", "#3FD79A", "#9BDB4F", "#F2C94C", "#FF8A3A"];
let html = "";

// ------------------------------------------------------------------ gearbox
if (screen === "gears") {
  const tops = [86, 128, 166, 200, 234, 266, 300, 346]; // km/h at the 12,000 rpm shift point
  // Spa speed profile from the outline: corner speed from curvature, then accelerate / brake limits
  const d = await (await fetch("./t-spa.json")).json(), P = d.points, N = P.length;
  const seg = P.map((p, i) => Math.hypot(P[(i + 1) % N][0] - p[0], P[(i + 1) % N][1] - p[1]));
  const len = seg.reduce((a, b) => a + b, 0), m = 7004 / len;
  const vc = P.map((p, i) => { const a = P[(i - 5 + N) % N], c = P[(i + 5) % N]; const A = Math.hypot(p[0] - a[0], p[1] - a[1]) * m, B = Math.hypot(c[0] - p[0], c[1] - p[1]) * m, C = Math.hypot(c[0] - a[0], c[1] - a[1]) * m; const area = Math.abs((p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1])) / 2 * m * m; const R = area < 1e-6 ? 1e9 : (A * B * C) / (4 * area); const c0 = 2.3 * 9.81, c1 = 0.00045 * 9.81; return R * c1 >= 1 ? 96 : Math.min(96, Math.sqrt((R * c0) / (1 - R * c1))); });
  const v = vc.slice();
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i <= N; i++) { const j = i % N, k = i - 1, acc = Math.max(2, 13 * (1 - v[k] / 100)); v[j] = Math.min(v[j], Math.sqrt(v[k] ** 2 + 2 * acc * seg[k] * m)); }
    for (let i = N - 1; i >= 0; i--) { const j = (i + 1) % N; v[i] = Math.min(v[i], Math.sqrt(v[j] ** 2 + 2 * 42 * seg[i] * m)); }
  }
  const kmh = v.map((x) => x * 3.6), gearOf = (s) => { for (let g = 0; g < 8; g++) if (s <= tops[g] * 0.985) return g; return 7; };
  const gears = kmh.map(gearOf), time = Array(8).fill(0); seg.forEach((s, i) => (time[gears[i]] += (s * m) / v[i]));
  const lap = time.reduce((a, b) => a + b, 0), vmax = Math.max(...kmh);
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]), sc = 470 / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)), ox = Math.min(...xs), oy = Math.min(...ys);
  const X = (p) => (60 + (p[0] - ox) * sc * 0.88).toFixed(1), Y = (p) => (40 + (p[1] - oy) * sc * 0.88).toFixed(1);
  let map = ""; for (let i = 0; i < N; i++) { const a = P[i], b = P[(i + 1) % N]; map += `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${GC[gears[i]]}" stroke-width="9" stroke-linecap="round"/>`; }
  const near = (c) => P.reduce((bi, p, i) => (Math.hypot(p[0] - c[0], p[1] - c[1]) < Math.hypot(P[bi][0] - c[0], P[bi][1] - c[1]) ? i : bi), 0);
  const minG = (i0, i1) => { let g = 7, s = 999; for (let i = i0; i <= i1; i++) if (kmh[i % N] < s) { s = kmh[i % N]; g = gears[i % N]; } return [g, s]; };
  const labels = [["La Source", 1, 14, -10], ["Eau Rouge", 3, 18, -4], ["Les Combes", 5, -128, -10], ["Bruxelles", 8, -40, 26], ["Pouhon", 10, 18, -6], ["Stavelot", 15, -20, 30], ["Blanchimont", 17, 18, 4], ["Bus Stop", 18, -108, 22]].map(([n, cn, dx, dy]) => { const c = d.corners.find((k) => k.n === cn).p, i = near(c); const [g, s] = minG(i - 4, i + 4); return `<g><circle cx="${X(c)}" cy="${Y(c)}" r="4" fill="#E8EAF0"/><text x="${+X(c) + dx}" y="${+Y(c) + dy}" fill="#E8EAF0" font-family="B" font-weight="600" font-size="12" stroke="#13161D" stroke-width="4" paint-order="stroke">${n} <tspan fill="${GC[g]}" font-family="JB">${g + 1} · ${Math.round(s)}</tspan></text></g>`; }).join("");
  // speed / rpm sawtooth
  const SX = (s) => 36 + (s / 360) * 470, SY = (r) => 250 - ((r - 4000) / 11000) * 230;
  let saw = ""; for (let g = 0; g < 8; g++) { const v0 = g ? tops[g - 1] : 0, r0 = g ? (12000 * tops[g - 1]) / tops[g] : 4000, v1 = g === 7 ? vmax : tops[g], r1 = (12000 * v1) / tops[g]; saw += `<line x1="${SX(v0)}" y1="${SY(r0)}" x2="${SX(v1)}" y2="${SY(r1)}" stroke="${GC[g]}" stroke-width="3"/>${g ? `<line x1="${SX(v0)}" y1="${SY(12000)}" x2="${SX(v0)}" y2="${SY(r0)}" stroke="${GC[g]}" stroke-width="1.2" stroke-dasharray="3 3"/>` : ""}<text x="${SX((v0 + v1) / 2) - 4}" y="${SY((r0 + r1) / 2) - 8}" fill="${GC[g]}" font-family="JB" font-size="12" font-weight="600">${g + 1}</text>`; }
  html = top("Garage · Engine · <b>Gearbox</b>", `${tabs(2)}<span class="btn primary">Save ratios</span>`) + `
  <div class="panel" style="position:absolute;left:24px;top:82px;width:470px;bottom:20px;display:grid;gap:7px;align-content:start;padding:14px 18px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">8 gears</h2><span style="font:600 12px B;color:#9AA3B2">top speed in each gear</span></div>
    ${lbl("Start from")}${tg(["Spa (long)", "Monaco (short)", "Monza (very long)", "Even steps"], 0)}
    ${tops.map((t, g) => { const pct = ((t - 70) / 300) * 100, drop = g ? Math.round(12000 - (12000 * tops[g - 1]) / t) : null; return `<div style="display:grid;grid-template-columns:30px 1fr 70px 64px;gap:10px;align-items:center;padding:4px 0"><span style="width:28px;height:28px;border-radius:7px;background:${GC[g]};color:#0B0D12;display:grid;place-items:center;font:700 16px BC">${g + 1}</span><div style="height:6px;border-radius:3px;background:#2A2F3B;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;border-radius:3px;background:${GC[g]}"></i><b style="position:absolute;left:${pct}%;top:50%;width:15px;height:15px;border-radius:50%;background:#E8EAF0;transform:translate(-50%,-50%)"></b></div><b class="mono" style="text-align:right;font-size:14px">${t} km/h</b><span class="mono" style="text-align:right;font-size:11px;color:#9AA3B2">${drop ? `−${drop.toLocaleString()}` : "launch"}</span></div>`; }).join("")}
    <div style="display:flex;justify-content:flex-end;font:600 10px B;color:#6B7383;margin-top:-4px">rpm drop when you shift up ↑</div>
    ${sl("Final drive", 52, "×1.00")}
    <div style="font:500 12px B;color:#9AA3B2;margin-top:-2px">Final drive moves every gear at once: longer for top speed, shorter for acceleration.</div>
    <div style="background:#181C25;border-radius:10px;padding:10px 12px;font:500 13px/1.45 B;color:#C3C9D4;margin-top:4px"><b style="color:#E8EAF0">Real rule:</b> since 2014 teams pick their 8 ratios once for the whole season. Career mode copies that; quick races let you change them any time.</div>
  </div>
  <div class="panel" style="position:absolute;left:510px;top:82px;width:540px;bottom:20px;display:grid;gap:8px;align-content:start;padding:14px 18px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Speed and revs</h2><span style="font:600 12px B;color:#9AA3B2">shift at 12,000 rpm</span></div>
    <svg width="506" height="270" viewBox="0 0 506 270"><g stroke="#262B36">${[4000, 8000, 12000, 15000].map((r) => `<line x1="36" x2="506" y1="${SY(r)}" y2="${SY(r)}"/><text x="0" y="${SY(r) + 4}" fill="#6B7383" font-family="JB" font-size="10" stroke="none">${r / 1000}k</text>`).join("")}</g>
      <rect x="36" y="${SY(15000)}" width="470" height="${SY(12000) - SY(15000)}" fill="#FF6B6B" opacity=".06"/><text x="500" y="${SY(15000) + 14}" fill="#FF8A8A" font-family="B" font-weight="600" font-size="11" text-anchor="end">rev limit 15,000</text>
      ${saw}${[0, 100, 200, 300].map((s) => `<text x="${SX(s)}" y="266" fill="#6B7383" font-family="JB" font-size="10" text-anchor="middle">${s}</text>`).join("")}<text x="506" y="266" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11" text-anchor="end">km/h</text></svg>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${[["Top speed at Spa", `${Math.round(vmax)} km/h`, "end of Kemmel, in 8th"], ["Lap (simulated)", `${Math.floor(lap / 60)}:${(lap % 60).toFixed(1).padStart(4, "0")}`, "with these ratios"], ["Hits the limiter?", "No", `8th tops out at ${Math.round((12000 * vmax) / tops[7]).toLocaleString()} rpm`]].map(([a, b, c]) => `<div style="background:#181C25;border-radius:10px;padding:10px 12px"><div class="lbl2">${a}</div><div style="font:600 19px B">${b}</div><div style="font:500 11px B;color:#9AA3B2">${c}</div></div>`).join("")}</div>
    ${lbl("Time spent in each gear", "margin-top:6px")}
    <div style="display:flex;height:30px;border-radius:8px;overflow:hidden">${time.map((t, g) => `<div style="width:${(t / lap) * 100}%;background:${GC[g]};display:grid;place-items:center;font:700 12px BC;color:#0B0D12">${t / lap > 0.04 ? g + 1 : ""}</div>`).join("")}</div>
    <div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2"><span>1st</span><span>8th: ${Math.round((time[7] / lap) * 100)}% of the lap</span></div>
    ${lbl("Shifting", "margin-top:6px")}
    <div style="display:grid;grid-template-columns:150px 1fr;gap:8px;align-items:center;font:600 13px B"><span>Gearbox</span>${tg(["Manual (paddles)", "Automatic"], 0)}<span>Auto shift up at</span><span class="mono">11,800 rpm</span><span>Block a bad downshift</span>${tg(["On", "Off"], 0)}</div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:510px;bottom:20px;display:grid;gap:8px;align-content:start;padding:14px 18px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Gear you'll be in at Spa</h2><span style="font:600 12px B;color:#9AA3B2">lowest gear · km/h</span></div>
    <svg width="474" height="${(Math.max(...ys) - oy) * sc * 0.88 + 80}" viewBox="0 0 474 ${(Math.max(...ys) - oy) * sc * 0.88 + 80}" style="display:block">${map}${labels}</svg>
    <div style="display:flex;gap:5px;flex-wrap:wrap">${GC.map((c, g) => `<span style="display:inline-flex;gap:5px;align-items:center;font:600 12px B;color:#C3C9D4"><i style="width:14px;height:8px;border-radius:2px;background:${c}"></i>${g + 1}</span>`).join("")}</div>
  </div>
  ${concept("Design concept · gearbox ratios (lap and speeds from a simple simulation)")}`;
}

// ------------------------------------------------------------------ how it fires
if (screen === "firing") {
  const cyl = (cx, cy, n, on, ang) => `<g transform="rotate(${ang} ${cx} ${cy})"><rect x="${cx - 22}" y="${cy - 34}" width="44" height="68" rx="9" fill="${on ? "#2A2310" : "#1C2230"}" stroke="${on ? "#FFB547" : "#3A4150"}" stroke-width="2"/><text x="${cx}" y="${cy + 7}" fill="${on ? "#FFB547" : "#C3C9D4"}" font-family="BC" font-weight="700" font-size="22" text-anchor="middle">${n}</text></g>`;
  const orders = [["Even fire", "1-4-2-5-3-6", [0, 120, 240, 360, 480, 600], "smooth, high note", [["smoothest power", 1]]], ["Paired", "1-4 · 2-5 · 3-6", [0, 40, 240, 280, 480, 520], "rougher, throbbing note", [["+traction out of slow corners", 1], ["more vibration", -1]]], ["Big bang (fun)", "all in one burst", [0, 20, 40, 60, 80, 100], "very rough, like a bike", [["most traction", 1], ["engine life −15%", -1]]]];
  const pulses = (arr, col) => `<svg width="100%" height="36" viewBox="0 0 720 36" preserveAspectRatio="none"><line x1="0" x2="720" y1="30" y2="30" stroke="#262B36"/>${arr.map((a) => `<rect x="${a + 4}" y="6" width="14" height="24" rx="3" fill="${col}"/>`).join("")}</svg>`;
  const T = (p) => 30 + p * 210; // throttle chart x
  const curve = (f) => { let s = ""; for (let q = 0; q <= 20; q++) { const p = q / 20; s += `${s ? "L" : "M"}${T(p).toFixed(1)},${(150 - f(p) * 130).toFixed(1)}`; } return s; };
  html = top("Garage · Engine · <b>How it fires</b>", `${tabs(3)}<span class="btn primary">Hear it on the dyno</span>`) + `
  <div class="panel" style="position:absolute;left:24px;top:82px;width:740px;height:450px;display:grid;gap:8px;align-content:start;padding:14px 18px">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Firing order</h2><span style="font:600 12px B;color:#9AA3B2">which cylinder fires when · changes sound and grip</span></div>
    <div style="display:grid;grid-template-columns:250px 1fr;gap:18px;align-items:start">
      <svg width="250" height="250" viewBox="0 0 250 250"><rect width="250" height="250" rx="12" fill="#0E1117"/>
        <text x="125" y="22" fill="#9AA3B2" font-family="B" font-weight="600" font-size="11" text-anchor="middle">V6 from above · two banks of 3</text>
        <rect x="40" y="36" width="170" height="176" rx="16" fill="#1A1D24" stroke="#3A4150"/>
        <line x1="125" x2="125" y1="40" y2="208" stroke="#4A505C" stroke-width="6" stroke-linecap="round"/>
        ${[1, 2, 3].map((n, k) => `<circle cx="82" cy="${70 + k * 54}" r="24" fill="${n === 1 ? "#2A2310" : "#22262E"}" stroke="${n === 1 ? "#FFB547" : "#4A505C"}" stroke-width="2.5"/><text x="82" y="${77 + k * 54}" fill="${n === 1 ? "#FFB547" : "#C3C9D4"}" font-family="BC" font-weight="700" font-size="20" text-anchor="middle">${n}</text>`).join("")}
        ${[4, 5, 6].map((n, k) => `<circle cx="168" cy="${84 + k * 54}" r="24" fill="#22262E" stroke="${n === 4 ? "#FFB547" : "#4A505C"}" stroke-width="2.5" stroke-dasharray="${n === 4 ? "5 4" : ""}"/><text x="168" y="${91 + k * 54}" fill="${n === 4 ? "#FFB547" : "#C3C9D4"}" font-family="BC" font-weight="700" font-size="20" text-anchor="middle">${n}</text>`).join("")}
        <text x="58" y="56" font-size="16">⚡</text>
        <path d="M104,74 Q126,70 142,80" fill="none" stroke="#FFB547" stroke-width="2" marker-end="url(#ah)"/><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8Z" fill="#FFB547"/></marker></defs>
        <text x="125" y="232" fill="#6B7383" font-family="B" font-weight="600" font-size="10" text-anchor="middle">crankshaft · front of the car ↑</text>
        <text x="20" y="128" fill="#6B7383" font-family="B" font-weight="600" font-size="10" text-anchor="middle" transform="rotate(-90 20 128)">left bank</text><text x="232" y="128" fill="#6B7383" font-family="B" font-weight="600" font-size="10" text-anchor="middle" transform="rotate(90 232 128)">right bank</text></svg>
      <div style="display:grid;gap:8px">${orders.map(([n, seq, arr, snd, fx], i) => `<div style="background:${i === 0 ? "#2A2310" : "#181C25"};border-radius:10px;padding:8px 12px;${i === 0 ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b style="font:600 15px B;color:${i === 0 ? "#FFB547" : "#E8EAF0"}">${n}</b><span class="mono" style="font-size:12px;color:#9AA3B2">${seq}</span></div>${pulses(arr, i === 0 ? "#FFB547" : "#5A6070")}<div class="row" style="justify-content:space-between;gap:6px"><span style="font:500 12px B;color:#9AA3B2">🔊 ${snd}</span><span style="display:flex;gap:4px">${fx.map(([t, g]) => eff(t, g)).join("")}</span></div></div>`).join("")}
        <div style="display:flex;justify-content:space-between;font:600 10px B;color:#6B7383"><span>0°</span><span>one full cycle = 2 turns of the crank (720°)</span><span>720°</span></div></div>
    </div>
    <div style="font:500 12px B;color:#9AA3B2">Real teams keep this secret. In the game it's mostly about sound and how the power comes in when you get on the throttle.</div>
  </div>
  <div class="panel" style="position:absolute;left:24px;top:546px;width:740px;bottom:20px;display:grid;grid-template-columns:240px 1fr;gap:18px;align-items:center;padding:14px 18px">
    <svg width="240" height="300" viewBox="0 0 240 300"><circle cx="120" cy="140" r="100" fill="#0E1117" stroke="#3A4150" stroke-width="2"/>
      ${Array.from({ length: 36 }, (_, k) => { const a = (k / 36) * Math.PI * 2 - Math.PI / 2; return `<line x1="${120 + Math.cos(a) * 92}" y1="${140 + Math.sin(a) * 92}" x2="${120 + Math.cos(a) * (k % 3 ? 96 : 86)}" y2="${140 + Math.sin(a) * (k % 3 ? 96 : 86)}" stroke="#4A505C" stroke-width="2"/>`; }).join("")}
      <text x="120" y="30" fill="#E8EAF0" font-family="B" font-weight="700" font-size="12" text-anchor="middle">TOP</text>
      ${(() => { const a = (-14 / 360) * Math.PI * 2 - Math.PI / 2; return `<line x1="120" y1="140" x2="${120 + Math.cos(a) * 88}" y2="${140 + Math.sin(a) * 88}" stroke="#FFB547" stroke-width="3"/><circle cx="${120 + Math.cos(a) * 88}" cy="${140 + Math.sin(a) * 88}" r="8" fill="#FFB547"/><text x="${120 + Math.cos(a) * 64 - 20}" y="${140 + Math.sin(a) * 64 + 14}" fill="#FFB547" font-family="B" font-weight="700" font-size="12">⚡ spark</text>`; })()}
      <path d="M120,140 m0,-70 a70,70 0 0,0 -17,2" fill="none" stroke="#FFB547" stroke-width="2"/><text x="120" y="160" fill="#C3C9D4" font-family="JB" font-size="20" text-anchor="middle" font-weight="600">14°</text><text x="120" y="178" fill="#9AA3B2" font-family="B" font-size="11" text-anchor="middle" font-weight="600">before the top</text>
      <text x="120" y="270" fill="#9AA3B2" font-family="B" font-size="11" text-anchor="middle" font-weight="600">crank angle when the spark fires</text></svg>
    <div style="display:grid;gap:8px;align-content:start">
      <h2 style="margin:0">Spark timing</h2>
      <div><div style="display:flex;justify-content:space-between;font:600 12px B;color:#9AA3B2"><span>later · cooler, safer</span><span>earlier · more power</span></div><div style="position:relative;height:6px;border-radius:3px;background:linear-gradient(90deg,#5AA9FF,#3A4150 50%,#FF6B3A);margin-top:8px"><b style="position:absolute;left:58%;top:50%;width:16px;height:16px;border-radius:50%;background:#E8EAF0;transform:translate(-50%,-50%)"></b></div></div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">${eff("+4 hp", 1)}${eff("+12° exhaust temp", -1)}${eff("knock risk: low", 0)}</div>
      <div style="font:500 13px/1.45 B;color:#C3C9D4">Firing the spark a little earlier gives the fuel more time to burn, so you get more power. Too early and the fuel explodes instead of burning ("knock"), which damages the engine.</div>
      <div style="display:grid;grid-template-columns:130px 1fr;gap:8px;align-items:center;font:600 13px B;margin-top:4px"><span>Fuel mix</span>${tg(["Lean", "Standard", "Rich"], 1)}<span>Rev limiter</span>${tg(["Soft (bounces)", "Hard cut"], 0)}</div>
    </div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:788px;height:420px;padding:0;overflow:hidden">
    <div style="${imgCrop("x-flame.png", 160, 100, 1300, 693, 788, 420)}"></div>
    <div class="hudbox" style="left:16px;top:14px;width:300px;display:grid;gap:7px"><b style="font:700 20px BC">Overrun pops</b><div style="font:500 13px/1.45 B;color:#C3C9D4">When you lift off at high revs, unburnt fuel lights in the hot exhaust: crackles and a flicker of flame.</div>${tg(["Off", "Real (small crackles)", "Fun (big flames)"], 2)}<div style="font:500 11px B;color:#9AA3B2">Just for looks and sound. No speed change.</div></div>
    <div class="hudbox" style="right:16px;bottom:16px;padding:6px 12px;font:600 12px B;color:#FFB547">exhaust glows with heat after a long straight</div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:516px;width:788px;bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:22px;padding:14px 18px">
    <div style="display:grid;gap:6px;align-content:start"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Throttle map</h2><span style="font:600 11px B;color:#9AA3B2">pedal → power</span></div>
      <svg width="260" height="170" viewBox="0 0 260 170"><g stroke="#262B36"><line x1="30" x2="240" y1="150" y2="150"/><line x1="30" x2="30" y1="20" y2="150"/></g>
        <path d="${curve((p) => p)}" fill="none" stroke="#9AA3B2" stroke-width="2" stroke-dasharray="4 3"/><path d="${curve((p) => p ** 1.9)}" fill="none" stroke="#5AA9FF" stroke-width="2.5"/><path d="${curve((p) => 1 - (1 - p) ** 2.2)}" fill="none" stroke="#FFB547" stroke-width="3"/>
        <text x="236" y="166" fill="#6B7383" font-family="B" font-size="10" font-weight="600" text-anchor="end">pedal</text><text x="34" y="16" fill="#6B7383" font-family="B" font-size="10" font-weight="600">power</text></svg>
      ${tg(["Linear", "Gentle (rain)", "Sharp"], 2)}<div style="font:500 12px B;color:#9AA3B2">Gentle makes wheelspin easier to avoid in the wet.</div></div>
    <div style="display:grid;gap:6px;align-content:start"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Engine braking</h2><span style="font:600 11px B;color:#9AA3B2">when you lift off</span></div>
      <div style="display:flex;gap:4px;margin:6px 0">${Array.from({ length: 11 }, (_, k) => `<span style="flex:1;height:34px;border-radius:5px;display:grid;place-items:center;font:700 14px BC;background:${k === 6 ? "#FFB547" : k < 6 ? "#2A2310" : "#1C2230"};color:${k === 6 ? "#0B0D12" : "#C3C9D4"}">${k + 1}</span>`).join("")}</div>
      <div style="display:flex;justify-content:space-between;font:600 11px B;color:#9AA3B2"><span>1 · car rolls freely</span><span>11 · strong slowing</span></div>
      <div style="font:500 13px/1.45 B;color:#C3C9D4;margin-top:6px">More engine braking helps the car slow and turn in, but the rear can step out on corner entry. It's the EB setting real drivers change on the wheel lap by lap.</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">${eff("stable entry", 1)}${eff("rear lock-ups on bumpy brakes", -1)}</div></div>
  </div>
  ${concept("Design concept · how the engine fires (render: overrun flame, fun setting)")}`;
}

// ------------------------------------------------------------------ driveline on the wheel
if (screen === "drive") {
  const W = { x: 520, y: 82, w: 560, h: 430 }, s = W.w / 880; // crop of the wheel render x 360..1240, y 180..
  const P = (x, y) => [W.x + (x - 360) * s, W.y + (y - 175) * s];
  const PINS = [[800, 240, "Shift lights", "pattern and colours (left)"], [626, 489, "ENT · diff on entry", "rotary, 1–11"], [973, 489, "EXIT · diff on exit", "rotary, 1–11"], [692, 551, "MODE · engine mode", "quali, race, save, tow"], [907, 551, "TRQ · engine braking", "the EB setting, 1–11"], [1078, 511, "DIFF button", "cycles entry / mid / exit"]];
  const pin = ([x, y], k) => { const [px, py] = P(x, y); return `<div style="position:absolute;left:${px - 13}px;top:${py - 13}px;width:26px;height:26px;border-radius:50%;background:#FFB547;color:#0B0D12;display:grid;place-items:center;font:700 14px BC;box-shadow:0 0 0 3px rgba(11,13,18,.7)">${k + 1}</div>`; };
  const leds = (cols) => `<div style="display:flex;gap:5px">${cols.map((c) => `<i style="width:16px;height:16px;border-radius:50%;background:${c};box-shadow:${c === "#20242E" ? "none" : `0 0 8px ${c}`}"></i>`).join("")}</div>`;
  const G = "#4ADE80", R = "#FF5A4A", B = "#4A7BFF", O = "#20242E";
  html = top("Garage · <b>Driveline and wheel controls</b>", `<span class="chip">Everything here can also go on the wheel's rotaries</span><span class="btn primary">Save</span>`) + `
  <div style="position:absolute;left:${W.x}px;top:${W.y}px;width:${W.w}px;height:${W.h}px;border-radius:12px;overflow:hidden;${imgCrop("s2-wheel.png", 360, 175, 880, 676, W.w, W.h)}"></div>
  ${PINS.map(pin).join("")}
  <div class="panel" style="position:absolute;left:24px;top:82px;width:460px;bottom:20px;display:grid;gap:9px;align-content:start">
    <h2 style="margin:0">Shift lights</h2>
    ${[["Classic", [G, G, G, G, G, R, R, R, R, R, B, B, B, B, B], 1], ["One colour fill", [R, R, R, R, R, R, R, R, R, O, O, O, O, O, O]], ["Centre out", [O, O, O, O, G, G, R, R, R, G, G, O, O, O, O]], ["At the shift point", [B, B, B, B, B, B, B, B, B, B, B, B, B, B, B]]].map(([n, c, on], i) => `<div style="background:${on ? "#2A2310" : "#181C25"};border-radius:10px;padding:9px 12px;display:grid;gap:7px;${on ? "box-shadow:inset 0 0 0 1px #FFB547" : ""}"><div class="row" style="justify-content:space-between"><b style="font:600 14px B;color:${on ? "#FFB547" : "#E8EAF0"}">${n}</b>${i === 3 ? '<span style="font:600 11px B;color:#9AA3B2">solid, no flashing</span>' : ""}</div>${leds(c)}</div>`).join("")}
    ${sl("First light at", 40, "10,500")}${sl("All lit at", 70, "11,800")}
    <div style="height:1px;background:#262B36;margin:4px 0"></div>
    <h2 style="margin:0">Launch</h2>
    ${sl("Clutch bite point", 42, "42%")}${sl("Launch revs", 55, "10,800")}
    <svg width="420" height="110" viewBox="0 0 420 110"><g stroke="#262B36"><line x1="0" x2="420" y1="96" y2="96"/></g>
      <path d="M0,90 C60,88 90,40 140,30 C200,20 300,18 420,16" fill="none" stroke="#6EE7A8" stroke-width="3"/><path d="M0,90 C50,86 70,70 110,64 C140,60 150,72 170,70 C220,64 300,30 420,24" fill="none" stroke="#FF8A8A" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="420" y="12" fill="#6EE7A8" font-family="B" font-weight="600" font-size="11" text-anchor="end">your settings: clean getaway</text><text x="420" y="80" fill="#FF8A8A" font-family="B" font-weight="600" font-size="11" text-anchor="end">too many revs: wheelspin</text><text x="0" y="108" fill="#6B7383" font-family="B" font-weight="600" font-size="10">first 2 seconds</text></svg>
  </div>
  <div class="panel" style="position:absolute;left:${W.x}px;top:${W.y + W.h + 14}px;width:${1100 - W.x + 476 - 476 + 4}px;bottom:20px;display:grid;gap:8px;align-content:start;width:560px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px">${PINS.map(([, , t, sub], k) => `<div style="display:flex;gap:8px;align-items:center"><span style="flex:none;width:22px;height:22px;border-radius:50%;background:#FFB547;color:#0B0D12;display:grid;place-items:center;font:700 12px BC">${k + 1}</span><div><b style="font:600 13px B">${t}</b><div style="font:500 11px B;color:#9AA3B2">${sub}</div></div></div>`).join("")}</div>
    <div style="height:1px;background:#262B36;margin:2px 0"></div>
    <h2 style="margin:0">Other drivetrain settings</h2>
    <div style="display:grid;grid-template-columns:170px 1fr;gap:9px 12px;align-items:center;font:600 13px B">
      <span>Brake migration</span><div>${tg(["Off", "Low", "High"], 1)}<div style="font:500 11px B;color:#9AA3B2;margin-top:3px">bias moves rearwards as you ease off the brake</div></div>
      <span>Battery charging under braking</span><div>${tg(["Less", "Normal", "Max"], 1)}<div style="font:500 11px B;color:#9AA3B2;margin-top:3px">more charging = rear wheels can lock</div></div>
      <span>Anti-stall</span>${tg(["On", "Off"], 0)}
    </div>
  </div>
  <div class="panel" style="position:absolute;right:24px;top:82px;width:476px;bottom:20px;display:grid;gap:9px;align-content:start">
    <h2 style="margin:0">Differential</h2>
    <div style="font:500 13px/1.45 B;color:#C3C9D4">Controls how much the two rear wheels are locked together. More lock = stable but pushes wide. Less lock = turns better but spins up the inside wheel.</div>
    <svg width="440" height="220" viewBox="0 0 440 220"><rect width="440" height="220" rx="12" fill="#0E1117"/>
      <path d="M40,200 L40,120 Q40,40 140,40 L400,40" fill="none" stroke="#2A2F3B" stroke-width="44" stroke-linecap="round"/>
      <path d="M40,200 L40,140" fill="none" stroke="#5AA9FF" stroke-width="10" stroke-linecap="round"/><path d="M40,128 Q42,62 90,48" fill="none" stroke="#FFB547" stroke-width="10" stroke-linecap="round"/><path d="M104,42 L380,40" fill="none" stroke="#6EE7A8" stroke-width="10" stroke-linecap="round"/>
      <text x="62" y="190" fill="#7FC4FF" font-family="B" font-weight="700" font-size="13">ENTRY · 6</text><text x="70" y="108" fill="#FFB547" font-family="B" font-weight="700" font-size="13">MID · 5</text><text x="220" y="78" fill="#6EE7A8" font-family="B" font-weight="700" font-size="13">EXIT · 8</text></svg>
    ${sl("Entry (off throttle)", 50, "6")}${sl("Mid-corner", 42, "5")}${sl("Exit (on throttle)", 70, "8")}
    <div style="display:flex;gap:5px;flex-wrap:wrap">${eff("good traction out of La Source", 1)}${eff("slight understeer at Pouhon", -1)}</div>
    <div style="background:#181C25;border-radius:10px;padding:10px 12px;font:500 13px/1.45 B;color:#C3C9D4"><b style="color:#E8EAF0">Tip:</b> if the rear steps out when you get on the power, raise Exit. If the car won't turn in, lower Entry.</div>
  </div>
  ${concept("Design concept · driveline and wheel controls")}`;
}

root.innerHTML = html;
await new Promise((r) => setTimeout(r, 800));
document.title = "done";

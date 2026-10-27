// Shared look for the concept renders (same style as designs/race/design9–11), 1600×900.
const F = "../../../public/vendor/fonts/";
document.head.insertAdjacentHTML("beforeend", `<style>
@font-face { font-family: BC; font-weight: 700; src: url(${F}barlow-condensed-latin-700-normal.woff2); }
@font-face { font-family: BC; font-weight: 600; src: url(${F}barlow-condensed-latin-600-normal.woff2); }
@font-face { font-family: B; font-weight: 500; src: url(${F}barlow-latin-500-normal.woff2); }
@font-face { font-family: B; font-weight: 600; src: url(${F}barlow-latin-600-normal.woff2); }
@font-face { font-family: B; font-weight: 700; src: url(${F}barlow-latin-600-normal.woff2); }
@font-face { font-family: JB; font-weight: 600; src: url(${F}jetbrains-mono-latin-600-normal.woff2); }
:root { --bg: #0B0D12; --card: #13161D; --card2: #1A1E27; --line: #262B36; --text: #E8EAF0; --soft: #C3C9D4; --muted: #9AA3B2; --faint: #6B7383; --accent: #FFB547; --good: #2FD27A; --bad: #FF6B6B; --blue: #5AA9FF; }
* { box-sizing: border-box; }
html, body { margin: 0; width: 1600px; height: 900px; overflow: hidden; background: var(--bg); color: var(--text); font: 500 14px/1.4 B; }
#root { position: relative; width: 1600px; height: 900px; overflow: hidden; }
.top { height: 64px; display: flex; align-items: center; gap: 18px; padding: 0 28px; border-bottom: 1px solid var(--line); background: #0E1117; position: relative; z-index: 2; }
.brand { font: 700 24px BC; letter-spacing: .05em; color: var(--accent); } .brand small { font: 700 11px B; letter-spacing: .14em; color: var(--faint); border: 1px solid var(--line); border-radius: 4px; padding: 3px 7px; margin-left: 8px; vertical-align: middle; }
.crumbs { font: 600 18px BC; letter-spacing: .04em; color: var(--muted); } .crumbs b { color: var(--text); } .sp { flex: 1; }
.btn { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid var(--line); background: var(--card); font: 600 14px B; color: var(--text); white-space: nowrap; } .btn.primary { background: var(--accent); border-color: var(--accent); color: #17120A; }
.panel { background: var(--card); border: 1px solid #1C2029; border-radius: 12px; padding: 16px 18px; min-width: 0; position: relative; }
h2 { margin: 0 0 8px; font: 600 22px BC; letter-spacing: .03em; }
.chip { display: inline-flex; gap: 6px; align-items: center; padding: 4px 10px; border-radius: 14px; background: #1C2230; font: 600 12px B; color: var(--soft); white-space: nowrap; }
.mono { font-family: JB; font-weight: 600; }
.row { display: flex; align-items: center; gap: 10px; }
.concept { position: absolute; right: 22px; bottom: 12px; z-index: 50; font: 600 15px B; letter-spacing: .12em; color: rgba(232,234,240,.66); text-transform: uppercase; text-shadow: 0 1px 4px #000, 0 0 12px rgba(0,0,0,.6); }
.grid { display: grid; gap: 16px; padding: 16px 20px; align-content: center; position: relative; zoom: 1.15; }
.grid > .panel { background: rgba(19,22,29,.95); box-shadow: 0 10px 40px rgba(0,0,0,.35); }
table { border-collapse: collapse; width: 100%; } td, th { padding: 7px 6px; border-top: 1px solid #1F2430; font: 600 14px B; text-align: left; } th { font: 600 11px B; letter-spacing: .12em; color: var(--muted); text-transform: uppercase; border-top: 0; } td.r, th.r { text-align: right; }
.bgimg { position: absolute; inset: 0; background-size: cover; background-position: center; }
.hudbox { position: absolute; background: rgba(11,13,18,.82); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 10px 14px; z-index: 5; }
.lbl2 { font: 600 10px B; letter-spacing: .14em; color: #9AA3B2; text-transform: uppercase; }
.pill { display: inline-block; padding: 3px 9px; border-radius: 12px; font: 700 11px B; letter-spacing: .06em; }
.sl { display: grid; grid-template-columns: 130px 1fr 64px; gap: 10px; align-items: center; font: 600 13px B; color: #C3C9D4; }
.sl .tr { height: 6px; border-radius: 3px; background: #2A2F3B; position: relative; } .sl .tr i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: #FFB547; } .sl .tr b { position: absolute; top: 50%; width: 15px; height: 15px; border-radius: 50%; background: #E8EAF0; transform: translate(-50%,-50%); }
.tg { display: flex; gap: 4px; flex-wrap: wrap; } .tg span { padding: 4px 9px; border-radius: 12px; background: #1C2230; font: 600 12px B; color: #C3C9D4; } .tg span.on { background: #2A2310; color: #FFB547; box-shadow: inset 0 0 0 1px #FFB547; }
.kv { display: flex; justify-content: space-between; gap: 12px; font: 600 13px B; } .kv span { color: var(--soft); }
.card2 { background: var(--card2); border-radius: 10px; padding: 12px 14px; }
.muted { color: var(--muted); } .faint { color: var(--faint); } .good { color: #6EE7A8; } .bad { color: #FF8A8A; } .acc { color: #FFB547; } .blue { color: #7FC4FF; }
.big { font: 700 34px/1 BC; letter-spacing: .02em; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; vertical-align: middle; }
.rain { position: absolute; inset: 0; pointer-events: none; background:
  repeating-linear-gradient(103deg, transparent 0 22px, rgba(200,215,235,.10) 22px 23px, transparent 23px 47px),
  repeating-linear-gradient(98deg, transparent 0 37px, rgba(200,215,235,.07) 37px 38px, transparent 38px 71px),
  linear-gradient(180deg, rgba(30,38,52,.55), rgba(20,26,36,.25)); }
</style>`);

export const TEAMS = { RACELIMIT: "#FFA51F", VELOCE: "#C8102E", KESTREL: "#0F4D3A", NOVA: "#16B8A6", AXIOM: "#16245C", HALCYON: "#F2F3F5", VORTEX: "#FF7A1A", ORBITA: "#5B2A86", MERIDIAN: "#8C939E", BRAVO: "#C9A23A" };
// made-up drivers
export const DRV = [["YOU", "RACELIMIT", 27], ["OKA", "AXIOM", 1], ["BRD", "VELOCE", 16], ["SLV", "NOVA", 63], ["ISH", "KESTREL", 14], ["VRG", "HALCYON", 31], ["DEL", "VORTEX", 81], ["KAI", "ORBITA", 22], ["MOR", "MERIDIAN", 44], ["PEL", "BRAVO", 10], ["TAN", "AXIOM", 5], ["FOX", "VELOCE", 55]];

export const top = (crumb, right = "", back = "spa-chase") => `${back ? bg(back, "blur(10px) brightness(.3) saturate(.8)") : ""}<div class="top"><div class="brand">RACELIMIT<small>RACE</small></div><div class="crumbs">${crumb}</div><div class="sp"></div>${right}</div>`;
export const sl = (label, v, txt) => `<div class="sl"><span>${label}</span><div class="tr"><i style="width:${v}%"></i><b style="left:${v}%"></b></div><span class="mono" style="text-align:right">${txt}</span></div>`;
export const tg = (opts, on) => `<div class="tg">${opts.map((o, i) => `<span class="${(Array.isArray(on) ? on.includes(i) : i === on) ? "on" : ""}">${o}</span>`).join("")}</div>`;
export const hb = (cells, pos = "left:50%;bottom:16px;transform:translateX(-50%)") => `<div class="hudbox" style="${pos};display:flex;padding:0;overflow:hidden;white-space:nowrap">${cells.map((c, i) => `<div style="padding:10px 16px;${i ? "border-left:1px solid rgba(255,255,255,.07)" : ""};display:grid;gap:2px;align-content:center">${c}</div>`).join("")}</div>`;
export const gear = (g, v) => `<div style="display:flex;gap:10px;align-items:end"><span style="font:700 46px/0.8 BC;color:#FFB547">${g}</span><div><div class="mono" style="font-size:22px">${v}</div><div class="lbl2">km/h</div></div></div>`;
export const t2 = (a, b) => `<div style="font:600 13px B">${a}</div><div style="font:600 11px B;color:#9AA3B2">${b}</div>`;
export const note = (k, title, lines, pos = "left:18px;top:18px", w = 430) => `<div class="hudbox" style="${pos};width:${w}px"><div class="lbl2" style="color:#FFB547">${k}</div><div style="font:700 25px BC;margin:3px 0 6px">${title}</div><div style="display:grid;gap:5px;font:500 14px/1.4 B;color:#C3C9D4">${lines.map((l) => `<div>${l}</div>`).join("")}</div></div>`;
export const box = (pos, w, inner) => `<div class="hudbox" style="${pos};width:${w}px">${inner}</div>`;
export const concept = (t, st = "") => `<div class="concept" style="${st}">${t}</div>`;
export const bg = (name, filter = "") => `<div class="bgimg" style="background-image:url(bg/${name}.png);${filter ? "filter:" + filter : ""}"></div>`;
export const kv = (a, b) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`;
export const pill = (t, bgc, fg) => `<span class="pill" style="background:${bgc};color:${fg}">${t}</span>`;
export const tag = (x, y, inner, anchor = "translate(-50%,-100%)") => `<div class="hudbox" style="left:${x}px;top:${y}px;transform:${anchor};padding:6px 10px;white-space:nowrap">${inner}</div>`;
export const drv = (code) => { const d = DRV.find((x) => x[0] === code) ?? [code, "NOVA", 0]; return `<span class="dot" style="background:${TEAMS[d[1]]};box-shadow:0 0 0 1px #0007"></span> <b>${code}</b>`; };
// a simple line chart: series = [{ pts: [y…], c: colour, dash }], y in 0–1 (1 = top)
export function chart(w, h, series, opts = {}) {
  const grid = [0.25, 0.5, 0.75].map((g) => `<line x1="0" x2="${w}" y1="${g * h}" y2="${g * h}" stroke="#262B36"/>`).join("");
  const lines = series.map((s) => `<polyline fill="none" stroke="${s.c}" stroke-width="${s.wd ?? 2.5}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ""} stroke-linejoin="round" points="${s.pts.map((y, i) => `${(i / (s.pts.length - 1)) * w},${(1 - y) * h}`).join(" ")}"/>`).join("");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;overflow:visible">${grid}${opts.extra ?? ""}${lines}</svg>`;
}
// a circuit outline from a list of [x, y] points (0–100)
export function trackSvg(pts, w, h, opts = {}) {
  // smooth closed curve through the points (Catmull-Rom)
  const P = pts.map(([x, y]) => [(x / 100) * w, (y / 100) * h]), n = P.length;
  let d = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n], k = opts.tension ?? 0.18;
    d += ` C${(p1[0] + (p2[0] - p0[0]) * k).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) * k).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) * k).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) * k).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  d += " Z";
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;overflow:visible"><path d="${d}" fill="none" stroke="${opts.under ?? "#2A2F3B"}" stroke-width="${opts.wd ?? 10}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${opts.c ?? "#C3C9D4"}" stroke-width="${opts.wd2 ?? 3}" stroke-linejoin="round"/>${opts.extra ?? ""}</svg>`;
}
export function mount(screens) {
  const q = new URLSearchParams(location.search).get("screen");
  const fn = screens[q] ?? Object.values(screens)[0];
  document.getElementById("root").innerHTML = fn();
  document.title = q ?? "";
}
// another car: the player's car copied out of the same shot, scaled down, moved up the road and recoloured
// crop = [x, y, w, h] of the car in the shot; (x, y) = where its centre goes
export const clone = (name, crop, x, y, scale, filter = "", opacity = 1) => `<div style="position:absolute;left:${x - (crop[2] * scale) / 2}px;top:${y - (crop[3] * scale) / 2}px;width:${crop[2] * scale}px;height:${crop[3] * scale}px;background:url(bg/${name}.png) ${-crop[0] * scale}px ${-crop[1] * scale}px/${1600 * scale}px ${900 * scale}px;filter:${filter};opacity:${opacity};-webkit-mask-image:radial-gradient(ellipse 60% 62% at 50% 52%,#000 72%,transparent 92%)"></div>`;
export const CAR = { "monza-chase": [700, 452, 200, 125], "spa-chase": [700, 460, 200, 130], "inter-chase": [700, 455, 200, 130], "spa-eau": [700, 452, 200, 150], "silver-grid": [700, 478, 200, 165] };

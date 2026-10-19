// The racing game's on-screen display: timing (top left), track map (top right), the driving
// cluster (bottom centre: gear, speed, revs, battery, aero), messages and the start lights.
const fmt = (t) => { if (t == null || !isFinite(t)) return "–:––.–––"; const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s.toFixed(3).padStart(6, "0")}`; };
const fmtS = (t) => (t == null || !isFinite(t) ? "––.–––" : t.toFixed(3));

export function createHud(root, tr) {
  root.innerHTML = `
  <div class="h-time box">
    <div class="h-row"><span class="k" id="hLap">LAP 1</span><span class="k h-inv" id="hInv" hidden>LAP DELETED</span></div>
    <div class="h-cur mono" id="hCur">0:00.000</div>
    <div class="h-delta mono" id="hDelta"></div>
    <div class="h-secs">${[0, 1, 2].map((i) => `<div class="h-sec" id="hS${i}"><span class="k">S${i + 1}</span><b class="mono">––.–––</b></div>`).join("")}</div>
    <div class="h-row h-sub"><span class="k">Last</span><b class="mono" id="hLast">–:––.–––</b></div>
    <div class="h-row h-sub"><span class="k">Best</span><b class="mono" id="hBest">–:––.–––</b></div>
  </div>
  <div class="h-map box"><svg id="hMap" viewBox="0 0 200 200"></svg></div>
  <div class="h-msg" id="hMsg" hidden></div>
  <div class="h-lights" id="hLights" hidden>${"<i></i>".repeat(5)}</div>
  <div class="h-cluster box">
    <div class="h-gearspeed"><b class="h-gear" id="hGear">N</b><div><div class="h-speed mono" id="hSpeed">0</div><div class="k">km/h</div></div></div>
    <div class="h-revs"><div class="h-leds" id="hLeds">${"<i></i>".repeat(15)}</div><div class="h-rpm"><i id="hRpm"></i></div><div class="k"><span id="hRpmT">0</span> rpm</div></div>
    <div class="h-ers"><div class="k">Battery <span id="hErsMode"></span></div><div class="h-bar"><i id="hErs"></i></div><div class="mono h-small" id="hErsT">100%</div></div>
    <div class="h-aero"><span class="h-chip" id="hAero">CORNER</span><span class="h-chip pit" id="hPit" hidden>PIT LIMITER</span><span class="k" id="hGearMode">AUTO</span></div>
  </div>
  <div class="h-hint box" id="hHint">↑ ↓ ← → or W A S D to drive · E / Q gears · C camera · R reset · L racing line · Esc pause</div>`;
  const $ = (id) => root.querySelector("#" + id);
  const el = { lap: $("hLap"), inv: $("hInv"), cur: $("hCur"), delta: $("hDelta"), last: $("hLast"), best: $("hBest"), msg: $("hMsg"), lights: $("hLights"), gear: $("hGear"), speed: $("hSpeed"), rpm: $("hRpm"), rpmT: $("hRpmT"), ers: $("hErs"), ersT: $("hErsT"), ersMode: $("hErsMode"), aero: $("hAero"), pit: $("hPit"), gearMode: $("hGearMode"), hint: $("hHint"), map: $("hMap"), secs: [0, 1, 2].map((i) => $("hS" + i)) };
  const leds = [...$("hLeds").children];

  // track map from the centre line
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < tr.N; i += 10) { minX = Math.min(minX, tr.X[i]); maxX = Math.max(maxX, tr.X[i]); minZ = Math.min(minZ, tr.Z[i]); maxZ = Math.max(maxZ, tr.Z[i]); }
  const sc = 180 / Math.max(maxX - minX, maxZ - minZ), ox = 100 - ((minX + maxX) / 2) * sc, oz = 100 - ((minZ + maxZ) / 2) * sc;
  const mx = (x) => (ox + x * sc).toFixed(1), mz = (z) => (oz + z * sc).toFixed(1);
  let d = ""; for (let i = 0; i < tr.N; i += 12) d += `${d ? "L" : "M"}${mx(tr.X[i])},${mz(tr.Z[i])}`;
  let dp = ""; if (tr.pitRoad) { const R = tr.pitRoad; for (let i = 0; i < R.N; i += 6) dp += `${dp ? "L" : "M"}${mx(R.X[i])},${mz(R.Z[i])}`; }
  el.map.innerHTML = `${dp ? `<path d="${dp}" fill="none" stroke="#5B6372" stroke-width="2" stroke-linejoin="round"/>` : ""}<path d="${d}Z" fill="none" stroke="#3A4150" stroke-width="7" stroke-linejoin="round"/><path d="${d}Z" fill="none" stroke="#C3C9D4" stroke-width="2.5" stroke-linejoin="round"/><rect x="${+mx(tr.X[0]) - 1.5}" y="${+mz(tr.Z[0]) - 5}" width="3" height="10" fill="#FFB547" transform="rotate(${(Math.atan2(tr.TX[0], -tr.TZ[0]) * 180) / Math.PI + 90} ${mx(tr.X[0])} ${mz(tr.Z[0])})"/><circle id="hDot" r="5" fill="#FFB547" stroke="#0B0D12" stroke-width="2"/>`;
  const dot = el.map.querySelector("#hDot");

  let msgUntil = 0, last = {};
  const put = (k, node, v) => { if (last[k] !== v) { last[k] = v; node.textContent = v; } };
  setTimeout(() => el.hint.classList.add("fade"), 12000);

  return {
    message(text, secs = 2.5, kind = "") { el.msg.textContent = text; el.msg.className = "h-msg " + kind; el.msg.hidden = false; msgUntil = performance.now() + secs * 1000; },
    lights(n) { if (n < 0) { el.lights.hidden = true; return; } el.lights.hidden = false; [...el.lights.children].forEach((x, i) => x.classList.toggle("on", i < n)); },
    update(c, t, opts) {
      if (msgUntil && performance.now() > msgUntil) { el.msg.hidden = true; msgUntil = 0; }
      put("gear", el.gear, c.reverse ? "R" : c.u < 0.5 && c.throttle < 0.05 && !t.running ? "N" : String(c.gear));
      put("speed", el.speed, String(Math.round(Math.abs(c.u) * 3.6)));
      const r = Math.min(1, (c.rpm - 4000) / 8500);
      el.rpm.style.transform = `scaleX(${Math.max(0, r)})`; put("rpmT", el.rpmT, (Math.round(c.rpm / 100) * 100).toLocaleString());
      // shift lights: green, red, then all blue at the shift point (solid, no flashing)
      const lit = Math.max(0, Math.min(15, Math.round(((c.rpm - 10200) / (11800 - 10200)) * 15)));
      const allBlue = c.rpm >= 11800;
      const key = allBlue ? "B" : String(lit);
      if (last.leds !== key) { last.leds = key; leds.forEach((x, i) => { x.className = allBlue ? "b" : i < lit ? (i < 5 ? "g" : i < 10 ? "r" : "b") : ""; }); }
      el.ers.style.transform = `scaleX(${c.ers / 4e6})`; put("ersT", el.ersT, Math.round((c.ers / 4e6) * 100) + "%");
      put("ersMode", el.ersMode, c.deploying ? "· DEPLOY" : c.harvesting ? "· CHARGE" : "");
      el.ers.className = c.deploying ? "dep" : c.harvesting ? "harv" : "";
      put("aero", el.aero, c.aeroMode === "straight" ? "STRAIGHT MODE" : "CORNER MODE"); el.aero.classList.toggle("on", c.aeroMode === "straight");
      put("gearMode", el.gearMode, opts.auto ? "AUTO GEARS" : "MANUAL");
      el.pit.hidden = !c.onPit; el.aero.hidden = !!c.onPit; put("pit", el.pit, c.pitLimiter ? "PIT LIMITER · 80" : "PIT LANE"); el.pit.classList.toggle("on", !!c.pitLimiter);
      // timing
      put("lap", el.lap, `LAP ${t.lap}`);
      el.inv.hidden = !t.invalid;
      put("cur", el.cur, t.running ? fmt(t.now - t.lapStart) : fmt(0));
      if (t.delta != null && t.running) { const dd = t.delta; put("delta", el.delta, `${dd >= 0 ? "+" : "−"}${Math.abs(dd).toFixed(2)}`); el.delta.className = "h-delta mono " + (dd < 0 ? "good" : "bad"); } else put("delta", el.delta, "");
      put("last", el.last, fmt(t.lastLap)); put("best", el.best, fmt(t.bestLap));
      t.sectors.forEach((s, i) => { const b = el.secs[i].querySelector("b"); put("s" + i, b, fmtS(s?.time)); el.secs[i].className = "h-sec " + (s?.cls ?? ""); });
      dot.setAttribute("cx", mx(c.x)); dot.setAttribute("cy", mz(c.z));
    },
  };
}
export { fmt };

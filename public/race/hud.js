// The racing game's on-screen display, laid out like the approved "compact HUD" concept:
//   top left    timing: lap, current time, live delta, sectors, last / best / predicted, lap progress
//   top centre  session and the next corner (name, how far, the speed you'll take it at)
//   top right   track map, coloured by where you last deployed (orange) and harvested (blue) battery energy
//   bottom      one bar: battery and power, tyres, gear / speed / delta with pedal bars, aero mode and the
//               driver aids as they work, brake bias and top speed; the rev lights run along its top edge
// Tab switches between this and a simpler version (gear, speed, delta, battery, tyres). Nothing flashes.
const fmt = (t) => { if (t == null || !isFinite(t)) return "–:––.–––"; const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s.toFixed(3).padStart(6, "0")}`; };
const fmtS = (t) => (t == null || !isFinite(t) ? "––.–––" : t.toFixed(3));

export function createHud(root, tr, info = {}) {
  const { vp = null, session = "", circuit = "" } = info, N = tr.N;
  root.innerHTML = `
  <div class="h-time box">
    <div class="h-row"><span class="k" id="hLap">LAP 1</span><span class="k h-inv" id="hInv" hidden>LAP DELETED</span></div>
    <div class="h-cur mono" id="hCur">0:00.000</div>
    <div class="h-delta mono" id="hDelta"></div>
    <div class="h-secs">${[0, 1, 2].map((i) => `<div class="h-sec" id="hS${i}"><span class="k">S${i + 1}</span><b class="mono">––.–––</b></div>`).join("")}</div>
    <div class="h-row h-sub"><span class="k">Last</span><b class="mono" id="hLast">–:––.–––</b></div>
    <div class="h-row h-sub"><span class="k">Best</span><b class="mono" id="hBest">–:––.–––</b></div>
    <div class="h-row h-sub fo"><span class="k">Predicted</span><b class="mono" id="hPred">–:––.–––</b></div>
    <div class="h-prog fo"><i id="hProg"></i></div>
  </div>
  <div class="h-info box fo"><span class="h-sess" id="hSess"></span><span class="h-next"><span class="k">Next</span> <b id="hNextN">–</b> <span class="mono" id="hNextD"></span> <span class="h-apex" id="hNextV"></span></span></div>
  <div class="h-map box"><div class="h-maphead fo"><span class="k" id="hMapT"></span></div><svg id="hMap" viewBox="0 0 200 200"></svg><div class="h-legend fo"><i class="dep"></i>deploy <i class="harv"></i>harvest</div></div>
  <div class="h-msg" id="hMsg" hidden></div>
  <div class="h-lights" id="hLights" hidden>${"<i></i>".repeat(5)}</div>
  <div class="h-cluster box">
    <div class="h-leds" id="hLeds">${"<i></i>".repeat(15)}</div>
    <div class="h-ers">
      <div class="h-row"><span class="k">Batt</span><b class="mono" id="hErsT">100%</b></div>
      <div class="h-bar"><i id="hErs"></i></div>
      <div class="h-row"><b class="h-mode" id="hErsMode">–</b><span class="mono h-small muted" id="hErsP"></span></div>
      <div class="h-row h-small muted fo"><span>Lap</span><span class="mono" id="hErsLap"></span></div>
    </div>
    <div class="h-tyrebox">
      <div class="h-tyre-grid">${[0, 1, 2, 3].map((k) => `<div class="h-tyre" id="hT${k}">–</div>`).join("")}</div>
      <div class="h-tyreinfo"><div class="h-row" style="justify-content:flex-start"><i class="h-comp" id="hComp">M</i><b id="hCompN">Medium</b></div><div class="h-small muted mono" id="hTyreAge"></div></div>
    </div>
    <div class="h-gearspeed">
      <div class="h-pedals"><span><i id="hThr"></i></span><span class="brk"><i id="hBrk"></i></span></div>
      <b class="h-gear" id="hGear">N</b>
      <div class="h-spd"><div class="h-speed mono" id="hSpeed">0</div><div class="k">km/h · <span id="hRpmT">0</span> rpm</div></div>
      <div class="h-bigdelta"><div class="mono" id="hDelta2">–</div><div class="k">delta</div></div>
    </div>
    <div class="h-aero">
      <span class="h-chip" id="hAero">CORNER MODE</span><span class="h-chip pit" id="hPit" hidden>PIT LIMITER</span>
      <div class="h-aids"><span id="hAbs">ABS</span><span id="hTc">TC</span><span id="hSc">SC</span><span id="hGearMode">AUTO</span></div>
    </div>
    <div class="h-carset fo">
      <div class="h-row"><span class="k">BB</span><b class="mono" id="hBias">62.0</b></div>
      <div class="h-row"><span class="k">Top</span><b class="mono" id="hTop">–</b></div>
      <div class="h-row"><span class="k">Overtake</span><b id="hOvt">–</b></div>
    </div>
  </div>
  <div class="h-choice box" id="hChoice" hidden><div class="k">New tyres · press 1 2 3 or click</div><div class="h-choice-row">${["soft", "medium", "hard"].map((t, i) => `<button type="button" data-tyre="${t}"><i class="c-${t}">${t[0].toUpperCase()}</i>${i + 1} ${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div></div>
  <div class="h-hint box" id="hHint">↑ ↓ ← → or W A S D drive · E / Q gears · Space overtake · [ ] brake bias · Tab more / less info · C camera · R reset · L racing line · Esc pause</div>`;
  const $ = (id) => root.querySelector("#" + id);
  const ids = ["hLap", "hInv", "hCur", "hDelta", "hDelta2", "hLast", "hBest", "hPred", "hProg", "hSess", "hNextN", "hNextD", "hNextV", "hMapT", "hMsg", "hLights", "hGear", "hSpeed", "hRpmT", "hErs", "hErsT", "hErsMode", "hErsP", "hErsLap", "hComp", "hCompN", "hTyreAge", "hThr", "hBrk", "hAero", "hPit", "hAbs", "hTc", "hSc", "hGearMode", "hBias", "hTop", "hOvt", "hHint", "hMap"];
  const el = Object.fromEntries(ids.map((i) => [i, $(i)]));
  const secs = [0, 1, 2].map((i) => $("hS" + i)), leds = [...$("hLeds").children], tyreCells = [0, 1, 2, 3].map((k) => $("hT" + k)), choice = $("hChoice");
  const tCol = (temp, C) => (temp < C.window[0] - 8 ? "cold" : temp > C.window[1] + 8 ? "hot" : temp > C.window[1] ? "warm" : "ok");
  el.hSess.textContent = [session, circuit].filter(Boolean).join(" · ");
  el.hMapT.textContent = (circuit || "").toUpperCase();

  // ---- the track map: the lap in short pieces, so each can show what the battery did there ----
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < N; i += 10) { minX = Math.min(minX, tr.X[i]); maxX = Math.max(maxX, tr.X[i]); minZ = Math.min(minZ, tr.Z[i]); maxZ = Math.max(maxZ, tr.Z[i]); }
  const sc = 180 / Math.max(maxX - minX, maxZ - minZ), ox = 100 - ((minX + maxX) / 2) * sc, oz = 100 - ((minZ + maxZ) / 2) * sc;
  const mx = (x) => (ox + x * sc).toFixed(1), mz = (z) => (oz + z * sc).toFixed(1);
  const SEG = 24, nSeg = Math.ceil(N / SEG);
  let d = ""; for (let i = 0; i < N; i += 12) d += `${d ? "L" : "M"}${mx(tr.X[i])},${mz(tr.Z[i])}`;
  let dp = ""; if (tr.pitRoad) { const R = tr.pitRoad; for (let i = 0; i < R.N; i += 6) dp += `${dp ? "L" : "M"}${mx(R.X[i])},${mz(R.Z[i])}`; }
  let segs = ""; for (let s = 0; s < nSeg; s++) { let p = ""; for (let i = s * SEG; i <= Math.min(N, (s + 1) * SEG); i += 6) { const j = i % N; p += `${p ? "L" : "M"}${mx(tr.X[j])},${mz(tr.Z[j])}`; } segs += `<path class="ms" d="${p}"/>`; }
  el.hMap.innerHTML = `${dp ? `<path d="${dp}" fill="none" stroke="#5B6372" stroke-width="2" stroke-linejoin="round"/>` : ""}<path d="${d}Z" fill="none" stroke="#3A4150" stroke-width="7" stroke-linejoin="round"/><g class="h-segs" fill="none" stroke-width="2.6" stroke-linecap="round">${segs}</g><rect x="${+mx(tr.X[0]) - 1.5}" y="${+mz(tr.Z[0]) - 5}" width="3" height="10" fill="#FFB547" transform="rotate(${(Math.atan2(tr.TX[0], -tr.TZ[0]) * 180) / Math.PI + 90} ${mx(tr.X[0])} ${mz(tr.Z[0])})"/><circle id="hDot" r="5" fill="#FFB547" stroke="#0B0D12" stroke-width="2"/>`;
  const dot = el.hMap.querySelector("#hDot"), segEls = [...el.hMap.querySelectorAll(".ms")], segState = new Int8Array(nSeg).fill(-1), segAcc = { s: -1, dep: 0, harv: 0, n: 0 };

  // ---- corners in lap order, and the speed the ideal lap takes each one at ----
  const corners = (tr.corners ?? []).filter((k) => k.i >= 0).slice().sort((a, b) => a.i - b.i);
  const apexV = corners.map((k) => { if (!vp) return null; let m = Infinity; for (let w = -40; w <= 40; w++) m = Math.min(m, vp[tr.wrap(k.i + w)]); return Math.round(m * 3.6); });
  const cornerLabel = (k) => { const num = `T${k.n}${k.l || ""}`; return /^Turn /.test(k.name) ? num : `${num} ${k.name}`; };

  let msgUntil = 0, last = {}, simple = false;
  const put = (k, node, v) => { if (last[k] !== v) { last[k] = v; node.textContent = v; } };
  const cls = (k, node, v) => { if (last["c" + k] !== v) { last["c" + k] = v; node.className = v; } };
  setTimeout(() => el.hHint.classList.add("fade"), 14000);
  // per-lap tallies: battery energy in and out, top speed, and which lap these tyres went on
  const lap = { n: null, dep: 0, harv: 0, top: 0, ers: null, tyres: null, tyreLap: 0 };

  return {
    message(text, secs = 2.5, kind = "") { el.hMsg.textContent = text; el.hMsg.className = "h-msg " + kind; el.hMsg.hidden = false; msgUntil = performance.now() + secs * 1000; },
    // the pit stop's tyre choice (null hides it)
    tyreChoice(k) { choice.hidden = !k; for (const b of choice.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.tyre === k)); },
    lights(n) { if (n < 0) { el.hLights.hidden = true; return; } el.hLights.hidden = false; [...el.hLights.children].forEach((x, i) => x.classList.toggle("on", i < n)); },
    // "simple": just what you need to drive (Tab)
    setSimple(v) { simple = !!v; root.classList.toggle("simple", simple); },
    get simple() { return simple; },
    update(c, t, opts) {
      const now = performance.now();
      if (msgUntil && now > msgUntil) { el.hMsg.hidden = true; msgUntil = 0; }
      const kmh = Math.max(0, c.u) * 3.6;
      // ---- per-lap tallies ----
      if (lap.n !== t.lap) { lap.n = t.lap; lap.dep = lap.harv = 0; lap.top = 0; }
      if (lap.ers != null) { const de = c.ers - lap.ers; if (de < 0) lap.dep -= de; else lap.harv += de; } lap.ers = c.ers;
      lap.top = Math.max(lap.top, kmh);
      if (c.tyres && lap.tyres !== c.tyres) { lap.tyres = c.tyres; lap.tyreLap = t.lap; }

      // ---- centre: gear, speed, pedals, delta ----
      put("gear", el.hGear, c.reverse ? "R" : c.u < 0.5 && c.throttle < 0.05 && !t.running ? "N" : String(c.gear));
      put("speed", el.hSpeed, String(Math.round(Math.abs(c.u) * 3.6)));
      put("rpm", el.hRpmT, (Math.round(c.rpm / 100) * 100).toLocaleString());
      el.hThr.style.transform = `scaleY(${Math.max(0, Math.min(1, c.throttle))})`; el.hBrk.style.transform = `scaleY(${Math.max(0, Math.min(1, c.brake))})`;
      // rev lights: green, red, then all blue at the shift point (solid, no flashing)
      const lit = Math.max(0, Math.min(15, Math.round(((c.rpm - 10200) / (11800 - 10200)) * 15))), allBlue = c.rpm >= 11800, key = allBlue ? "B" : String(lit);
      if (last.leds !== key) { last.leds = key; leds.forEach((x, i) => { x.className = allBlue ? "b" : i < lit ? (i < 5 ? "g" : i < 10 ? "r" : "b") : ""; }); }
      const dd = t.delta != null && t.running ? t.delta : null;
      const dTxt = dd == null ? "" : `${dd >= 0 ? "+" : "−"}${Math.abs(dd).toFixed(dd != null && Math.abs(dd) < 10 ? 3 : 1)}`;
      put("delta", el.hDelta, dd == null ? "" : `${dd >= 0 ? "+" : "−"}${Math.abs(dd).toFixed(2)}`); cls("delta", el.hDelta, "h-delta mono " + (dd == null ? "" : dd < 0 ? "good" : "bad"));
      put("delta2", el.hDelta2, dd == null ? "–" : dTxt); cls("delta2", el.hDelta2, "mono " + (dd == null ? "" : dd < 0 ? "good" : "bad"));

      // ---- battery ----
      const soc = c.ers / 4e6;
      el.hErs.style.transform = `scaleX(${soc})`; put("ersT", el.hErsT, Math.round(soc * 100) + "%");
      const mode = c.overtake ? "Overtake" : c.clipping ? "Clipping" : c.deploying && (c.pDeploy ?? 0) > 1000 ? "Deploy" : c.harvesting && (c.pHarvest ?? 0) > 1000 ? "Harvest" : "Hold";
      put("ersMode", el.hErsMode, mode); cls("ersMode", el.hErsMode, "h-mode m-" + mode.toLowerCase());
      const kw = mode === "Deploy" || mode === "Overtake" ? `+${Math.round((c.pDeploy ?? 0) / 1000)} kW` : mode === "Harvest" || mode === "Clipping" ? `−${Math.round((c.pHarvest ?? 0) / 1000)} kW` : "";
      put("ersP", el.hErsP, kw);
      cls("ers", el.hErs, c.overtake || c.deploying ? "dep" : c.harvesting ? "harv" : "");
      put("ersLap", el.hErsLap, `▲${(lap.dep / 1e6).toFixed(1)} ▼${(lap.harv / 1e6).toFixed(1)} MJ`);
      put("ovt", el.hOvt, c.overtake ? "ON" : c.pitLimiter ? "–" : soc > 0.08 ? "Ready" : "Low battery"); cls("ovt", el.hOvt, c.overtake ? "on" : soc > 0.08 && !c.pitLimiter ? "ready" : "");

      // ---- aero, pit limiter, the driver aids (lit while they're working) ----
      put("aero", el.hAero, c.aeroMode === "straight" ? "STRAIGHT MODE" : "CORNER MODE"); el.hAero.classList.toggle("on", c.aeroMode === "straight");
      el.hPit.hidden = !c.onPit; el.hAero.hidden = !!c.onPit; put("pit", el.hPit, c.pitLimiter ? "PIT LIMITER · 80" : "PIT LANE"); el.hPit.classList.toggle("on", !!c.pitLimiter);
      cls("abs", el.hAbs, !opts.abs ? "off" : c.absOn || c.lockF || c.lockR ? "act" : "");
      cls("tc", el.hTc, !opts.tc ? "off" : c.tcOn ? "act" : "");
      cls("sc", el.hSc, !opts.stability ? "off" : c.scOn ? "act" : "");
      put("gearMode", el.hGearMode, opts.auto ? "AUTO" : "MANUAL");
      put("bias", el.hBias, `${((c.bias ?? 0.62) * 100).toFixed(1)}% front`);
      put("top", el.hTop, lap.top > 1 ? `${Math.round(lap.top)} km/h` : "–");

      // ---- timing ----
      put("lap", el.hLap, t.outLap ? "OUT LAP" : `LAP ${t.lap}`);
      el.hInv.hidden = !t.invalid;
      put("cur", el.hCur, t.running ? fmt(t.now - t.lapStart) : fmt(0));
      put("last", el.hLast, fmt(t.lastLap)); put("best", el.hBest, fmt(t.bestLap));
      put("pred", el.hPred, dd != null && t.bestLap != null && !t.outLap ? fmt(t.bestLap + dd) : fmt(null));
      t.sectors.forEach((s, i) => { const b = secs[i].querySelector("b"); put("s" + i, b, fmtS(s?.time)); cls("sec" + i, secs[i], "h-sec " + (s?.cls ?? "")); });
      const frac = tr.dist[c.idx] / tr.len; el.hProg.style.transform = `scaleX(${frac})`;
      dot.setAttribute("cx", mx(c.x)); dot.setAttribute("cy", mz(c.z));

      // ---- map: what the battery did in each piece of track, the last time through ----
      const sNow = Math.floor(c.idx / SEG) % nSeg;
      if (sNow !== segAcc.s) {
        if (segAcc.s >= 0 && segAcc.n > 0 && !c.onPit) { const st = segAcc.dep > segAcc.n * 0.4 ? 1 : segAcc.harv > segAcc.n * 0.4 ? 2 : 0; if (segState[segAcc.s] !== st) { segState[segAcc.s] = st; segEls[segAcc.s].setAttribute("class", "ms " + ["", "dep", "harv"][st]); } }
        segAcc.s = sNow; segAcc.dep = segAcc.harv = segAcc.n = 0;
      }
      segAcc.n++; if (c.deploying && (c.pDeploy ?? 0) > 1000) segAcc.dep++; else if (c.harvesting) segAcc.harv++;

      // ---- the next corner ----
      if (corners.length && (last.cornerAt ?? 0) < now - 120) {
        last.cornerAt = now; const d0 = tr.dist[c.idx];
        let best = 0, bd = Infinity; corners.forEach((k, j) => { let dd2 = tr.dist[k.i] - d0; if (dd2 < -15) dd2 += tr.len; if (dd2 < bd) { bd = dd2; best = j; } });
        const k = corners[best];
        put("nextN", el.hNextN, cornerLabel(k)); put("nextD", el.hNextD, bd < 15 ? "now" : `${Math.round(bd / 10) * 10} m`); put("nextV", el.hNextV, apexV[best] != null ? `· ${apexV[best]} km/h` : "");
      }

      // ---- tyres: temperature (blue cold, green right, orange/red too hot), wear left, age — a few times a second ----
      if (c.tyres && opts.compounds && (last.tyreAt ?? 0) < now - 250) {
        last.tyreAt = now; const C = opts.compounds[c.compound];
        put("comp", el.hComp, C.letter); cls("comp", el.hComp, "h-comp c-" + c.compound);
        put("compN", el.hCompN, c.compound[0].toUpperCase() + c.compound.slice(1));
        const wearAvg = c.tyres.reduce((a, ty) => a + ty.wear, 0) / 4, laps = Math.max(0, t.lap - lap.tyreLap);
        put("tyreAge", el.hTyreAge, `${laps ? laps + (laps === 1 ? " lap" : " laps") : "New"} · ${Math.round((1 - wearAvg) * 100)}%`);
        c.tyres.forEach((ty, k) => { const e = tyreCells[k], lock = (k < 2 && c.lockF) || (k >= 2 && c.lockR); e.className = "h-tyre " + tCol(ty.temp, C) + (lock || ty.wear > 0.75 || ty.flat > 0.35 || ty.blister > 0.25 ? " warn" : ""); e.textContent = `${Math.round(ty.temp)}°`; });
      }
    },
  };
}
export { fmt };

// Engine and car sounds for the racing game, made live with the Web Audio API (no recordings).
// A 2026 V6 turbo hybrid: the exhaust note follows the revs (3 firing pulses per turn of the crank),
// plus turbo whistle, the electric motor's whine, tyre squeal, wind, kerb rumble and bumps.
import { load, save } from "../games/common.js?v=mvdq8sd5";

export function createEngineAudio() {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return { update() {}, shift() {}, thump() {}, setMuted() {}, muted: () => true, resume() {} };
  const ctx = new C(), master = ctx.createGain();
  let muted = load("muted", false);
  master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(); return s; };
  const gain = (v = 0, to = comp) => { const g = ctx.createGain(); g.gain.value = v; g.connect(to); return g; };
  const osc = (type, f, to) => { const o = ctx.createOscillator(); if (typeof type === "string") o.type = type; else o.setPeriodicWave(type); o.frequency.value = f; o.connect(to); o.start(); return o; };

  // exhaust note: a harmonic-rich wave + a slightly detuned saw, through soft clipping and a filter that opens with throttle
  const harm = [0, 1, 0.62, 0.48, 0.3, 0.26, 0.16, 0.13, 0.08, 0.07, 0.05, 0.04];
  const wave = ctx.createPeriodicWave(new Float32Array(harm.length), Float32Array.from(harm));
  const engGain = gain(0), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 2.5; lp.connect(engGain);
  const shaper = ctx.createWaveShaper(); { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * 2.2); } shaper.curve = c; } shaper.connect(lp);
  const mix = ctx.createGain(); mix.gain.value = 0.5; mix.connect(shaper);
  const oA = osc(wave, 200, mix), oB = osc("sawtooth", 200, gain(0.35, mix)), oSub = osc("triangle", 100, gain(0.45, mix));
  // rough combustion texture: noise shaped around the firing frequency
  const roughBP = ctx.createBiquadFilter(); roughBP.type = "bandpass"; roughBP.Q.value = 1.4; const roughG = gain(0, comp); roughBP.connect(roughG); noise().connect(roughBP);
  // turbo whistle and the electric motor (MGU-K) whine
  const turboG = gain(0), turbo = osc("sine", 3000, turboG);
  const whineG = gain(0), whine = osc("triangle", 800, whineG), whine2 = osc("sine", 1600, gain(0.3, whineG));
  // tyres, wind, kerbs
  const squealBP = ctx.createBiquadFilter(); squealBP.type = "bandpass"; squealBP.frequency.value = 1700; squealBP.Q.value = 7; const squealG = gain(0); squealBP.connect(squealG); noise().connect(squealBP);
  const windLP = ctx.createBiquadFilter(); windLP.type = "lowpass"; windLP.frequency.value = 420; const windG = gain(0); windLP.connect(windG); noise().connect(windLP);
  const kerbG = gain(0), kerb = osc("square", 38, kerbG);

  const set = (p, v, tc = 0.03) => p.setTargetAtTime(v, ctx.currentTime, tc);
  let duck = 0;
  return {
    resume() { if (ctx.state === "suspended") ctx.resume(); },
    muted: () => muted,
    setMuted(m) { muted = m; save("muted", m); set(master.gain, m ? 0 : 0.5, 0.05); },
    // car state from the physics, once per frame
    update(c, { paused = false, view = "chase" } = {}) {
      if (paused) { set(master.gain, 0, 0.05); return; }
      set(master.gain, muted ? 0 : 0.5, 0.05);
      const rpm = c.rpm, f = (rpm / 60) * 3, thr = c.throttle, u = Math.max(0, c.u);
      const inside = view === "cockpit" || view === "tcam";
      set(oA.frequency, f, 0.012); set(oB.frequency, f * 1.004, 0.012); set(oSub.frequency, f / 2, 0.012);
      set(lp.frequency, 500 + 4200 * (0.25 + 0.75 * thr) * (rpm / 12000) ** 1.2, 0.03);
      const load = 0.22 + 0.78 * thr;
      set(engGain.gain, Math.max(0, (0.32 + 0.4 * (rpm / 12000)) * load * (inside ? 0.85 : 1) - duck), 0.02);
      set(roughBP.frequency, f * 2, 0.02); set(roughG.gain, 0.05 * load * (rpm / 12000), 0.03);
      set(turbo.frequency, 2400 + rpm * 0.32, 0.05); set(turboG.gain, 0.012 * thr * (rpm / 12000) ** 2, 0.08);
      const ers = c.deploying ? 1 : c.harvesting ? 0.6 : 0;
      set(whine.frequency, 300 + u * 38, 0.03); set(whine2.frequency, 600 + u * 76, 0.03); set(whineG.gain, 0.022 * ers * Math.min(1, u / 20), 0.08);
      const slip = Math.max(0, Math.max(c.slipF, c.slipR) - 0.09) * 6 + (c.lockF || c.lockR ? 0.6 : 0) + c.spin;
      set(squealG.gain, Math.min(0.12, 0.12 * slip) * Math.min(1, u / 8), 0.04);
      set(windG.gain, Math.min(0.12, 0.000012 * u * u * (inside ? 1.3 : 1)), 0.1);
      set(kerbG.gain, c.kerb ? Math.min(0.06, u * 0.0012) : 0, 0.02); set(kerb.frequency, 20 + u * 0.8, 0.05);
      duck = Math.max(0, duck - 0.04);
    },
    // gear change: a quick cut and a crack from the exhaust
    shift() {
      duck = 0.18;
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 0.8; const g = ctx.createGain();
      const t = ctx.currentTime; g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07); s.connect(bp).connect(g).connect(comp); s.start(t, Math.random()); s.stop(t + 0.08);
    },
    // hitting a wall
    thump(strength) {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 260; const g = ctx.createGain();
      const t = ctx.currentTime, v = Math.min(0.9, 0.15 + strength * 0.05); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); s.connect(f).connect(g).connect(comp); s.start(t, Math.random()); s.stop(t + 0.4);
    },
  };
}

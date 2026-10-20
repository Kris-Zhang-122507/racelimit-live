// Engine and car sounds for the racing game, made with the Web Audio API (no recordings).
// The engine is a 2026-style 1.6 L V6 turbo. Its sound comes from a physical model running on the
// audio thread (engine-worklet.js): six cylinders, valves and real pipe lengths, worked out sample by
// sample from the revs and the throttle. Browsers without audio worklets fall back to the older
// method below: short pre-built loops of exhaust pulses at four rpm and two loads, blended live.
// On top: turbo whoosh, a little electric-motor whine, gear-change cracks, overrun pops,
// tyres, wind and kerbs. With no MGU-H the 2026 exhaust note is rawer, and the engine keeps
// working (charging the battery) through slow corners, so the note stays up there.
import { load, save } from "../games/common.js?v=mvg3lsn9";

// ---------- small DSP helpers (run once, when the game starts) ----------
function biquad(type, f, Q, sr) {
  const w = (2 * Math.PI * f) / sr, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  if (type === "lp") { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if (type === "hp") { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; } // band-pass, 0 dB peak
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}
function filt(x, c) { const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = c.b0 * x[i] + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; } return y; }

// One looping buffer of engine sound at `rpm`. kind "on" = under power, "off" = lifting (overrun).
export function engineLoop(ctx, rpm, kind, seed = 1) {
  const sr = ctx.sampleRate, cyc = Math.round((sr * 120) / rpm), nCyc = 24, L = cyc * nCyc;
  let s = seed * 9301 + (kind === "on" ? 7 : 3); const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const on = kind === "on";
  // each cylinder is a bit different (that unevenness is what gives a V6 its growl)
  const cyl = [1.0, 0.86, 1.1, 0.93, 1.06, 0.84];
  const fire = []; // the same random firings in both passes, so the loop joins up seamlessly
  for (let c = 0; c < nCyc; c++) for (let k = 0; k < 6; k++) {
    const misfire = !on && rnd() < 0.06, pop = !on && rnd() < 0.035;
    // real combustion is never the same twice: vary the strength and timing of every firing
    fire.push({ t: c * cyc + (k * cyc) / 6 + (rnd() - 0.5) * cyc * 0.02, a: cyl[k] * (1 + (rnd() - 0.5) * (on ? 0.32 : 0.7)) * (misfire ? 0.15 : 1) * (on ? 1 : 0.38), pop, r: 0.7 + rnd() * 0.6 });
  }
  const x = new Float32Array(L * 2), tr = (on ? 0.00011 : 0.00016) * sr, td = (on ? 0.00075 : 0.0006) * sr, tn = 0.0006 * sr, und = 0.0022 * sr;
  for (let pass = 0; pass < 2; pass++) for (const f of fire) {
    const t0 = pass * L + f.t, len = Math.min(cyc, Math.ceil(td * 9 + und * 3));
    for (let j = 0; j < len; j++) {
      const i = Math.floor(t0) + j; if (i >= x.length) break;
      const tt = j + (Math.floor(t0) - t0);
      // pressure pulse: quick rise, fast decay, then a slower suck-back (keeps the average at zero)
      let v = (Math.exp(-tt / td) - Math.exp(-tt / tr)) - 0.22 * Math.exp(-tt / und) * (1 - Math.exp(-tt / (tr * 3)));
      v += (rnd() * 2 - 1) * (on ? 0.55 : 0.3) * f.r * Math.exp(-tt / tn); // combustion rasp
      if (f.pop) v += (rnd() * 2 - 1) * 2.2 * Math.exp(-tt / (0.004 * sr)); // a crackle from unburnt fuel
      x[i] += f.a * v;
    }
  }
  // turbulent gas rushing through the exhaust between the pulses (the same in both passes)
  const hiss = new Float32Array(L); for (let i = 0; i < L; i++) hiss[i] = (rnd() * 2 - 1) * (on ? 0.022 : 0.015);
  for (let i = 0; i < L * 2; i++) x[i] += hiss[i % L];
  // exhaust resonances (fixed in the pipe, so they don't follow the revs)
  let y = filt(x, biquad("hp", 45, 0.7, sr));
  const bands = on ? [[190, 1.1, 0.55], [470, 1.8, 0.75], [980, 2.4, 0.6], [2100, 2.6, 0.38], [3900, 3, 0.18]] : [[170, 1.1, 0.6], [420, 1.8, 0.6], [900, 2.4, 0.35], [1900, 2.6, 0.15]];
  const sum = new Float32Array(y.length);
  const dry = filt(y, biquad("lp", on ? 5200 : 2400, 0.7, sr));
  for (let i = 0; i < y.length; i++) sum[i] = dry[i] * 0.45;
  for (const [f, Q, g] of bands) { const b = filt(y, biquad("bp", f, Q, sr)); for (let i = 0; i < y.length; i++) sum[i] += b[i] * g * 2.2; }
  // keep the second (settled) pass, normalise, and squash a little for rasp
  const out = sum.subarray(L);
  let rms = 0; for (let i = 0; i < L; i++) rms += out[i] * out[i]; rms = Math.sqrt(rms / L) || 1;
  const buf = ctx.createBuffer(1, L, sr), d = buf.getChannelData(0), drive = on ? 1.5 : 1.2;
  for (let i = 0; i < L; i++) d[i] = (0.8 * Math.tanh((out[i] / rms) * 0.28 * drive)) / Math.tanh(drive * 0.9);
  return { buf, rpm: (120 * sr) / cyc };
}

const BASES = [4500, 7500, 10500, 13500];

export function createEngineAudio({ engine = "raw" } = {}) {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return { update() {}, shift() {}, thump() {}, setMuted() {}, setEngine() {}, muted: () => true, resume() {} };
  const ctx = new C(), master = ctx.createGain();
  let muted = load("muted", false);
  master.gain.value = muted ? 0 : 0.55; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.12; comp.connect(master);
  // a little space: the sound bouncing off barriers and grandstands (a short made-up echo, darker and fainter
  // than the direct sound, slightly different left and right)
  const verb = ctx.createConvolver(), verbG = ctx.createGain(); verbG.gain.value = 0.1;
  { const sr = ctx.sampleRate, n = Math.floor(sr * 0.45), ir = ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < n; i++) { const t = i / sr; lp += ((Math.random() * 2 - 1) - lp) * 0.35; d[i] = lp * Math.exp(-t / 0.09) * (t < 0.012 + ch * 0.004 ? 0 : 1); } }
    verb.buffer = ir; }
  verb.connect(verbG).connect(comp);

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const noise = () => { const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.start(); return n; };
  const gain = (v = 0, to = comp) => { const g = ctx.createGain(); g.gain.value = v; g.connect(to); return g; };
  const osc = (type, f, to) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(to); o.start(); return o; };

  // ---- engine: 4 rpm × 2 loads of looping exhaust sound, blended by revs and throttle ----
  const engBus = ctx.createGain(); engBus.gain.value = 0;
  const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.Q.value = 0.6; tone.frequency.value = 8000;
  const body = ctx.createBiquadFilter(); body.type = "lowshelf"; body.frequency.value = 220; body.gain.value = 0;
  engBus.connect(body).connect(tone).connect(comp); tone.connect(verb);
  const layers = [];
  let model = null, engineName = engine;
  const useLoops = () => {
    if (layers.length) return;
    for (const b of BASES) for (const kind of ["on", "off"]) {
      const { buf, rpm } = engineLoop(ctx, b, kind, b);
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const g = ctx.createGain(); g.gain.value = 0; src.connect(g).connect(engBus); src.start(0, Math.random() * buf.duration);
      layers.push({ base: rpm, kind, src, g });
    }
  };
  // the modelled engine; if this browser can't run it, the loops instead
  if (ctx.audioWorklet && typeof AudioWorkletNode === "function") {
    ctx.audioWorklet.addModule(new URL("./engine-worklet.js?v=mvg3lsn9", import.meta.url)).then(() => {
      model = new AudioWorkletNode(ctx, "engine-synth", { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] });
      model.port.postMessage({ engine: engineName, gain: 1.1 });
      model.connect(engBus);
    }).catch(useLoops);
  } else useLoops();
  // ---- turbo (whoosh plus a faint whistle), electric motor whine ----
  const turboBP = ctx.createBiquadFilter(); turboBP.type = "bandpass"; turboBP.Q.value = 5; const turboG = gain(0); turboBP.connect(turboG); noise().connect(turboBP);
  const whistleG = gain(0), whistle = osc("sine", 5000, whistleG);
  const whineG = gain(0), whine = osc("triangle", 800, whineG);
  // ---- tyres, wind, kerbs ----
  const squealBP = ctx.createBiquadFilter(); squealBP.type = "bandpass"; squealBP.frequency.value = 1500; squealBP.Q.value = 6; const squealG = gain(0); squealBP.connect(squealG); noise().connect(squealBP);
  const windLP = ctx.createBiquadFilter(); windLP.type = "lowpass"; windLP.frequency.value = 450; const windG = gain(0); windLP.connect(windG); noise().connect(windLP);
  const kerbG = gain(0), kerb = osc("square", 38, kerbG);

  const set = (p, v, tc = 0.03) => p.setTargetAtTime(v, ctx.currentTime, tc);
  let cut = 0, popT = 0, spool = 0, lastRpm = 4000;
  const burst = (f, q, v, dur, at = 0) => { const n = ctx.createBufferSource(); n.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q; const g = ctx.createGain(); const t = ctx.currentTime + at; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); n.connect(bp).connect(g).connect(comp); n.start(t, Math.random() * 1.5); n.stop(t + dur + 0.02); };

  return {
    resume() { if (ctx.state === "suspended") ctx.resume(); },
    muted: () => muted,
    kind: () => (model ? "model" : layers.length ? "loops" : "loading"),
    setMuted(m) { muted = m; save("muted", m); set(master.gain, m ? 0 : 0.55, 0.05); },
    // engine tone: "raw" (short pipes, rasp) or "deep" (longer pipes, rounder)
    setEngine(name) { engineName = name; model?.port.postMessage({ engine: name }); },
    update(c, { paused = false, view = "chase", dt = 1 / 60 } = {}) {
      if (paused) { set(master.gain, 0, 0.05); return; }
      set(master.gain, muted ? 0 : 0.55, 0.05);
      const inside = view === "cockpit" || view === "tcam";
      let rpm = Math.max(3800, c.rpm);
      const limiter = c.rpm > 12400 && c.throttle > 0.5;
      // 2026: off the throttle in slow corners the engine keeps working to charge the battery
      const harvestLoad = c.throttle < 0.1 && c.harvesting && c.u > 15 && c.u < 55 && c.brake < 0.3 ? 0.45 : 0;
      const load = Math.max(c.throttle, harvestLoad);
      cut = Math.max(0, cut - dt);
      // the limiter cuts the sparks in quick bursts; a gear change cuts them for a moment
      const sparks = cut > 0 ? 0.05 : limiter && Math.sin(ctx.currentTime * 2 * Math.PI * 22) < 0 ? 0.05 : 1;
      if (model) {
        model.port.postMessage({ rpm: c.rpm < 3000 ? 3000 : c.rpm, load: load * sparks });
        const vol = (0.5 + 0.5 * Math.min(1, rpm / 12000)) * (0.62 + 0.38 * load);
        set(engBus.gain, vol, 0.02);
        set(tone.frequency, inside ? 3800 + 3600 * load : 9000 + 6000 * load, 0.05); set(body.gain, inside ? 3.5 : 0.5, 0.1); set(verbG.gain, inside ? 0.04 : 0.11, 0.2);
      } else {
        // which loops to use: equal-power crossfade between the two nearest rpm bases
        let i = 0; while (i < BASES.length - 2 && rpm > BASES[i + 1]) i++;
        const t = Math.min(1, Math.max(0, Math.log(rpm / BASES[i]) / Math.log(BASES[i + 1] / BASES[i])));
        const wR = BASES.map((_, k) => (k === i ? Math.cos((t * Math.PI) / 2) : k === i + 1 ? Math.sin((t * Math.PI) / 2) : 0));
        const wOn = Math.sqrt(load), wOff = Math.sqrt(1 - load) * 0.75;
        for (const L of layers) {
          const k = BASES.findIndex((b) => Math.abs(L.base - b) < 60);
          set(L.src.playbackRate, rpm / L.base, 0.012);
          set(L.g.gain, wR[k] * (L.kind === "on" ? wOn : wOff), 0.02);
        }
        const vol = (0.42 + 0.58 * Math.min(1, rpm / 12000)) * (0.55 + 0.45 * load) * (sparks < 1 ? 0.3 : 1);
        set(engBus.gain, vol, 0.01);
        set(tone.frequency, inside ? 2600 + 2400 * load : 7000 + 4000 * load, 0.05); set(body.gain, inside ? 5 : 1, 0.1);
      }
      // overrun pops when lifting at high revs
      if (c.throttle < 0.05 && rpm > 7500 && c.u > 20) { popT -= dt; if (popT <= 0) { popT = 0.05 + Math.random() * 0.18; burst(900 + Math.random() * 1400, 1.2, (0.05 + Math.random() * 0.08) * (model ? 0.5 : 1), 0.04); } }
      // turbo spools up with load and revs
      spool += ((load > 0.6 ? Math.min(1, rpm / 11000) : 0.1) - spool) * Math.min(1, dt * (load > 0.6 ? 2.5 : 5));
      set(turboBP.frequency, 2500 + spool * 3500, 0.05); set(turboG.gain, 0.03 * spool, 0.05);
      set(whistle.frequency, 4200 + spool * 3800, 0.05); set(whistleG.gain, 0.0025 * spool * (inside ? 1.3 : 0.6), 0.05);
      // lift at high boost: a short wastegate "pshh"
      if (lastRpm > 9000 && c.throttle < 0.05 && spool > 0.6 && !this._bov) { burst(3200, 0.8, 0.06, 0.25); this._bov = true; }
      if (c.throttle > 0.5) this._bov = false;
      lastRpm = rpm;
      const ers = c.deploying ? 1 : c.harvesting ? 0.5 : 0, u = Math.max(0, c.u);
      set(whine.frequency, 250 + u * 30, 0.03); set(whineG.gain, 0.006 * ers * Math.min(1, u / 15) * (inside ? 1.4 : 0.6), 0.08);
      const slip = Math.max(0, Math.max(c.slipF, c.slipR) - 0.1) * 5 + (c.lockF || c.lockR ? 0.6 : 0) + c.spin;
      set(squealG.gain, Math.min(0.1, 0.1 * slip) * Math.min(1, u / 8), 0.04);
      set(windG.gain, Math.min(0.12, 0.000011 * u * u * (inside ? 1.3 : 1)), 0.1);
      set(kerbG.gain, c.kerb ? Math.min(0.05, u * 0.001) : 0, 0.02); set(kerb.frequency, 20 + u * 0.8, 0.05);
    },
    // gear change: the power cuts for a moment and the exhaust cracks; downshifts get a blip
    shift(up = true) {
      cut = up ? 0.035 : 0.02;
      const k = model ? 0.55 : 1;
      burst(up ? 1100 : 750, 0.9, (up ? 0.22 : 0.16) * k, up ? 0.06 : 0.09);
      if (!up) burst(1600, 1.5, 0.08 * k, 0.05, 0.04);
    },
    thump(strength) {
      const n = ctx.createBufferSource(); n.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 260; const g = ctx.createGain();
      const t = ctx.currentTime, v = Math.min(0.9, 0.15 + strength * 0.05); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); n.connect(f).connect(g).connect(comp); n.start(t, Math.random()); n.stop(t + 0.4);
    },
  };
}

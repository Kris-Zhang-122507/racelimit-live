// Sound effects, made on the fly with the Web Audio API (no sound files to download).
// Off switch in the header, remembered in this browser.
import { load, save } from "./common.js?v=mvd6llni";

let ctx = null, master = null;
let muted = load("muted", false);
export const isMuted = () => muted;
export function setMuted(m) { muted = m; save("muted", m); if (master) master.gain.value = m ? 0 : 0.6; }

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq = 440, to = null, dur = 0.12, type = "sine", vol = 0.3, at = 0, attack = 0.005 }) {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise({ dur = 0.2, vol = 0.3, at = 0, filter = 2000, q = 1, type = "bandpass", rate = null }) {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + at;
  const len = Math.ceil(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    let v = Math.random() * 2 - 1;
    if (rate) v *= Math.sin((i / c.sampleRate) * rate * Math.PI * 2) > 0 ? 1 : 0.15; // a rattle, like a wheel gun
    d[i] = v;
  }
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = buf; f.type = type; f.frequency.value = filter; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t);
}

// ---- F1 engines on the grid ----
// A 1.6 V6 fires 3 times per turn, so the basic note is rpm / 20 Hz (about 550 Hz at 11,000 rpm).
// Each car is a few harmonics through a little distortion, a rasp of filtered noise for the exhaust,
// a turbo whistle on top, and a fast wobble so it sounds rough rather than like a synth.
export function engineBank(c, out, { cars = 5 } = {}) {
  const t0 = c.currentTime;
  const shaper = (k) => { const n = 1024, curve = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(k * x) / Math.tanh(k); } return curve; };
  const noiseBuf = (() => { const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < len; i++) { last = last * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = last; } return b; })();
  const voices = [];
  for (let v = 0; v < cars; v++) {
    const near = v === 0, detune = 1 + (v - (cars - 1) / 2) * 0.012;
    const vg = c.createGain(); vg.gain.value = 0.0001;
    const pan = c.createStereoPanner ? c.createStereoPanner() : null; if (pan) pan.pan.value = near ? 0 : ((v % 2 ? 1 : -1) * (0.3 + 0.15 * v)) / 1.2;
    const ws = c.createWaveShaper(); ws.curve = shaper(near ? 2.6 : 2.0); ws.oversample = "2x";
    const body = c.createBiquadFilter(); body.type = "lowpass"; body.frequency.value = near ? 3800 : 2200; body.Q.value = 0.7;
    const f1 = c.createBiquadFilter(); f1.type = "peaking"; f1.frequency.value = 900; f1.Q.value = 1.2; f1.gain.value = 6;
    const pre = c.createGain(); pre.gain.value = 0.55;
    ws.connect(f1).connect(body).connect(vg);
    if (pan) vg.connect(pan).connect(out); else vg.connect(out);
    // harmonics of the firing note
    const parts = [[1, "sawtooth", 0.5], [0.5, "square", 0.22], [1.5, "sawtooth", 0.16], [2, "triangle", 0.12], [3, "sine", 0.05]];
    const oscs = parts.map(([mul, type, amp]) => { const o = c.createOscillator(); o.type = type; const g = c.createGain(); g.gain.value = amp; o.connect(g).connect(pre); o.start(t0); return { o, mul }; });
    // roughness: a fast random wobble on pitch and loudness
    const lfo = c.createOscillator(); lfo.type = "triangle"; lfo.frequency.value = 23 + v * 3.7;
    const lfoG = c.createGain(); lfoG.gain.value = 6; lfo.connect(lfoG); oscs.forEach(({ o }) => lfoG.connect(o.frequency)); lfo.start(t0);
    const am = c.createGain(); am.gain.value = 0.8; const amL = c.createOscillator(); amL.frequency.value = 41 + v * 5; const amG = c.createGain(); amG.gain.value = 0.2; amL.connect(amG).connect(am.gain); amL.start(t0);
    pre.connect(am).connect(ws);
    // exhaust rasp
    const ns = c.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true; ns.playbackRate.value = 0.9 + v * 0.05;
    const nf = c.createBiquadFilter(); nf.type = "bandpass"; nf.Q.value = 1.4; const ng = c.createGain(); ng.gain.value = near ? 0.35 : 0.25;
    ns.connect(nf).connect(ng).connect(f1); ns.start(t0);
    // turbo whistle
    const tw = c.createOscillator(); tw.type = "sine"; const twg = c.createGain(); twg.gain.value = near ? 0.012 : 0.006; tw.connect(twg).connect(vg); tw.start(t0);
    voices.push({ vg, oscs, nf, tw, body, detune, near, lfo, amL, ns });
  }
  const hz = (rpm) => rpm / 20;
  // move every voice to an rpm over `dur` seconds, starting `at` seconds from now
  const setRpm = (voice, rpm, at, dur) => {
    const t = c.currentTime + at, f = hz(rpm) * voice.detune;
    for (const { o, mul } of voice.oscs) { o.frequency.setTargetAtTime(f * mul, t, Math.max(0.01, dur / 3)); }
    voice.nf.frequency.setTargetAtTime(f * 2.2, t, Math.max(0.01, dur / 3));
    voice.tw.frequency.setTargetAtTime(2800 + rpm * 0.35, t, Math.max(0.05, dur));
  };
  const setVol = (voice, vol, at, dur) => voice.vg.gain.setTargetAtTime(Math.max(0.0001, vol), c.currentTime + at, Math.max(0.01, dur / 3));
  voices.forEach((v) => { setRpm(v, 4200 + Math.random() * 300, 0, 0.01); setVol(v, v.near ? 0.11 : 0.055, 0, 0.3); });
  return {
    // drivers bring the revs up as the lights come on, and blip around the launch rpm
    rev(level = 1) {
      voices.forEach((v, i) => {
        const base = 6500 + level * 900 + Math.random() * 400;
        setRpm(v, Math.min(11500, base), i * 0.05, 0.25);
        setVol(v, (v.near ? 0.16 : 0.08) * (0.7 + level * 0.08), i * 0.05, 0.2);
        for (let k = 0; k < 4; k++) { const at = 0.3 + k * 0.17 + Math.random() * 0.05 + i * 0.03; setRpm(v, Math.min(12000, base + (k % 2 ? -900 : 500) + Math.random() * 300), at, 0.08); }
      });
    },
    // clutch out: revs dip, then rise through the gears while the cars pull away
    launch() {
      voices.forEach((v, i) => {
        const d = v.near ? 0 : 0.05 + Math.random() * 0.12;
        setRpm(v, 9000, d, 0.06); setVol(v, v.near ? 0.26 : 0.12, d, 0.08);
        let at = d + 0.12, rpm = 9000;
        for (let gear = 1; gear <= 4; gear++) { setRpm(v, 11800, at, 0.55 + gear * 0.12); at += 0.6 + gear * 0.2; rpm = 10600; setRpm(v, rpm, at, 0.04); at += 0.05; }
        // driving away: quieter and duller
        setVol(v, 0.0001, d + 1.2, 2.4); v.body.frequency.setTargetAtTime(700, c.currentTime + d + 0.8, 1.2);
      });
      return 4;
    },
    // jump start / stall: revs fall away
    bog() { voices.forEach((v, i) => { if (i === 0) { setRpm(v, 2500, 0, 0.25); setVol(v, 0.0001, 0.2, 0.6); } }); },
    stop(after = 0) {
      voices.forEach((v) => setVol(v, 0.0001, after, 0.3));
      const end = c.currentTime + after + 1.2;
      voices.forEach((v) => { for (const { o } of v.oscs) o.stop(end); v.lfo.stop(end); v.amL.stop(end); v.ns.stop(end); v.tw.stop(end); });
    },
  };
}
export function grid() {
  const c = ac(); if (!c || muted) return { rev() {}, launch() {}, bog() {}, stop() {} };
  const out = c.createGain(); out.gain.value = 0.9;
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  out.connect(comp).connect(master);
  return engineBank(c, out);
}

export const sfx = {
  // start lights: the short "pip" as each light comes on
  light: () => { tone({ freq: 1046, dur: 0.11, type: "sine", vol: 0.16, attack: 0.004 }); tone({ freq: 2092, dur: 0.06, type: "sine", vol: 0.03, attack: 0.004 }); },
  // jump start / mistakes
  buzz: () => { tone({ freq: 150, dur: 0.35, type: "sawtooth", vol: 0.18 }); tone({ freq: 155, dur: 0.35, type: "sawtooth", vol: 0.12 }); },
  // good result: two rising notes
  chime: () => { tone({ freq: 784, dur: 0.14, vol: 0.2 }); tone({ freq: 1175, dur: 0.22, vol: 0.2, at: 0.1 }); },
  // personal best: three notes
  fanfare: () => { tone({ freq: 784, dur: 0.12, vol: 0.2 }); tone({ freq: 988, dur: 0.12, vol: 0.2, at: 0.1 }); tone({ freq: 1319, dur: 0.3, vol: 0.22, at: 0.2 }); },
  // a launch: engine note sweeping up
  launch: () => { tone({ freq: 90, to: 420, dur: 0.6, type: "sawtooth", vol: 0.12 }); noise({ dur: 0.4, vol: 0.08, filter: 900 }); },
  // wrong guess: a soft low thud
  thud: () => { tone({ freq: 140, to: 70, dur: 0.18, type: "triangle", vol: 0.28 }); },
  // pit lane: limiter hum (returns a stop function)
  limiter() {
    const c = ac(); if (!c || muted) return () => {};
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = "sawtooth"; o.frequency.value = 118; o2.type = "square"; o2.frequency.value = 59;
    lfo.frequency.value = 9; lg.gain.value = 6; lfo.connect(lg).connect(o.frequency);
    g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 0.15);
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
    o.connect(f); o2.connect(f); f.connect(g).connect(master);
    o.start(); o2.start(); lfo.start();
    return () => { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); [o, o2, lfo].forEach((x) => x.stop(t + 0.15)); };
  },
  // wheel gun: a fast rattle
  gun: () => noise({ dur: 0.16, vol: 0.35, filter: 2600, q: 2, rate: 55 }),
  // jacks dropping / car settling
  clunk: () => { tone({ freq: 110, to: 55, dur: 0.12, type: "triangle", vol: 0.35 }); noise({ dur: 0.08, vol: 0.2, filter: 500, type: "lowpass" }); },
  // brakes on the marks
  brake: () => noise({ dur: 0.18, vol: 0.12, filter: 3500, q: 6 }),
  // green light
  go: () => tone({ freq: 988, dur: 0.12, type: "square", vol: 0.1 }),
  // tick for the reveal
  tick: () => tone({ freq: 1400, dur: 0.03, type: "square", vol: 0.05 }),
};

// the speaker button in the header
export function soundButton() {
  const b = document.getElementById("sound");
  if (!b) return;
  const draw = () => {
    b.setAttribute("aria-pressed", String(!muted));
    b.title = muted ? "Sound off — click to turn on" : "Sound on — click to turn off";
    b.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/>${muted ? '<path d="M17 9l5 6M22 9l-5 6"/>' : '<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'}</svg><span class="sr">${muted ? "Sound off" : "Sound on"}</span>`;
  };
  b.addEventListener("click", () => { setMuted(!muted); draw(); if (!muted) sfx.chime(); });
  draw();
}

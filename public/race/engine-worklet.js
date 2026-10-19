// Physically-modelled engine sound, run in an AudioWorklet (its own audio thread).
// A JavaScript port of the generator in "enginesound" by DasEtwas (MIT licence,
// https://github.com/DasEtwas/enginesound), which follows the paper "Physically informed car engine
// sound synthesis for virtual and augmented environments" (Baldan, Lachambre, Delle Monache, 2015).
//
// Each cylinder makes a pressure signal from its piston and its combustion; valves open and close the
// ends of small "waveguides" (delay lines that behave like pipes, with sound bouncing between their
// ends). Exhaust pipes feed a collector, then a straight pipe and the tailpipe; the intake has its
// own pipes and noise. The pipe lengths are physical, so the resonances stay put while the revs
// change, like a real engine.
//
// Tuned for a 2026 F1 power unit: 1.6 L V6, 90°, even firing, short equal-length exhaust headers into
// a single tailpipe with no silencer, intake trumpets in the airbox above the driver.
//
// MIT License (the ported generator): Copyright (c) 2020 DasEtwas. See ENGINE-SOUND-LICENSE.txt next to this file.

const PI2 = Math.PI * 2, PI4 = Math.PI * 4, MAXAMP = 20;

class Delay {
  constructor(n) { this.d = new Float32Array(Math.max(1, n)); this.p = 0; }
  pop() { return this.d[(this.p + 1) % this.d.length]; }
  push(v) { this.d[this.p % this.d.length] = v; }
  adv() { this.p++; }
}
const damp = (s) => { const a = Math.abs(s); return a > MAXAMP ? Math.sign(s) * (-1 / (a - MAXAMP + 1) + 1 + MAXAMP) : s; };
class WaveGuide {
  constructor(n, alpha, beta) { this.c0 = new Delay(n); this.c1 = new Delay(n); this.alpha = alpha; this.beta = beta; this.c0o = 0; this.c1o = 0; }
  pop() { this.c1o = damp(this.c1.pop()); this.c0o = damp(this.c0.pop()); return [this.c1o * (1 - Math.abs(this.alpha)), this.c0o * (1 - Math.abs(this.beta))]; }
  push(x0, x1) { this.c0.push(this.c1o * this.alpha + x0); this.c1.push(this.c0o * this.beta + x1); this.c0.adv(); this.c1.adv(); }
}
class LowPass {
  constructor(freq, sr) { const w = (PI2 / sr) * freq; this.a = w / (w + 1); this.last = 0; }
  f(x) { this.last += (x - this.last) * this.a; return this.last; }
}
const exhaustValve = (c) => (c > 0.75 && c < 1 ? -Math.sin(c * PI4) : 0);
const intakeValve = (c) => (c > 0 && c < 0.25 ? Math.sin(c * PI4) : 0);
const pistonMotion = (c) => Math.cos(c * PI4);
const ignition = (c, t) => (c > 0.5 && c < t / 2 + 0.5 ? Math.sin(PI2 * ((c - 0.5) / t)) : 0);
const frac = (x) => x - Math.floor(x);

// the engines (parameters are in seconds for pipe delays, as in the original)
const v6 = ({ hdr, coll, intake, ign, ignT, pipe, exVol, inVol, vib, noise, blow = 0.18, rasp = 0.3 }) => ({
  // blow: turbulent gas noise when each exhaust valve opens; rasp: harmonics from the gas shock waves
  blowNoise: blow, rasp, raspHP: 1400,
  intakeVolume: inVol, exhaustVolume: exVol, vibrationVolume: vib,
  intakeNoiseFactor: noise, intakeNoiseLP: 9000, vibrationLP: 220,
  intakeValveShift: 0.02, exhaustValveShift: 0.16, crankFluctuation: 0.006, crankFluctuationLP: 40,
  // even firing, 120° of crank (1/6 of the 720° cycle) apart; the two banks have slightly different pipes
  cylinders: [0, 1, 2, 3, 4, 5].map((k) => {
    const bank = k % 2, firing = [0, 3, 1, 4, 2, 5][k] / 6;
    return {
      crankOffset: firing,
      exhaust: { delay: hdr + bank * 0.00006 + k * 0.000012, alpha: 0.06, beta: 0.06 },
      intake: { delay: intake + k * 0.00001, alpha: 0.8, beta: -0.28 },
      extractor: { delay: coll + bank * 0.00008, alpha: 0, beta: 0.02 },
      intakeOpen: 0.012, intakeClosed: 0.8, exhaustOpen: -0.012, exhaustClosed: 0.95,
      piston: 1.5, ignitionFactor: ign, ignitionTime: ignT,
    };
  }),
  straightPipe: { delay: pipe, alpha: 0.1, beta: -0.24 },
  muffler: [0.00022, 0.00018, 0.00014].map((d) => ({ delay: d, alpha: 0, beta: 0.05 })),
});
export const ENGINES = {
  // short headers and a sharp, fast burn: the raspy 2026 note (no MGU-H to soften the exhaust)
  raw: v6({ hdr: 0.00062, coll: 0.0003, intake: 0.00046, ign: 6.5, ignT: 0.065, pipe: 0.0008, exVol: 0.85, inVol: 0.28, vib: 0.04, noise: 0.4 }),
  // longer pipes and a slower burn: deeper, rounder
  deep: v6({ hdr: 0.00095, coll: 0.00045, intake: 0.0006, ign: 5.6, ignT: 0.11, pipe: 0.0012, exVol: 0.8, inVol: 0.32, vib: 0.06, noise: 0.3 }),
};
export const F1_2026 = ENGINES.raw;

export class EngineSynth {
  constructor(sr, P = F1_2026) {
    this.sr = sr; this.P = P;
    const n = (s) => Math.max(1, Math.round(s * sr));
    this.cyl = P.cylinders.map((c) => ({ ...c, ex: new WaveGuide(n(c.exhaust.delay), c.exhaust.alpha, c.exhaust.beta), in: new WaveGuide(n(c.intake.delay), c.intake.alpha, c.intake.beta), xt: new WaveGuide(n(c.extractor.delay), c.extractor.alpha, c.extractor.beta), snd: 0, xtOut: 0, ign: c.ignitionFactor }));
    this.pipe = new WaveGuide(n(P.straightPipe.delay), P.straightPipe.alpha, P.straightPipe.beta);
    this.muff = P.muffler.map((m) => new WaveGuide(n(m.delay), m.alpha, m.beta));
    this.inLP = new LowPass(P.intakeNoiseLP, sr); this.vibLP = new LowPass(P.vibrationLP, sr); this.flLP = new LowPass(P.crankFluctuationLP, sr); this.dc = new LowPass(0.5, sr); this.blowLP = new LowPass(6000, sr); this.rHP = new LowPass(P.raspHP || 1400, sr);
    this.crank = 0; this.exColl = 0; this.inColl = 0; this.seed = 22222;
    this.rpm = 4000; this.load = 0.3; this.misfire = 0;
  }
  rnd() { let x = this.seed; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.seed = x >>> 0; return this.seed / 2147483648 - 1; }
  // load 0..1: how hard the engine is working (throttle); low load = overrun crackle
  sample() {
    const P = this.P, nc = this.cyl.length, inc = this.rpm / (this.sr * 120);
    const prevCrank = this.crank; this.crank = frac(this.crank + inc);
    const inNoise = this.inLP.f(this.rnd()) * P.intakeNoiseFactor * (0.4 + 0.6 * this.load);
    const fl = this.flLP.f(this.rnd()) * P.crankFluctuation;
    const lastEx = this.exColl / nc; this.exColl = 0; this.inColl = 0; let vib = 0;
    for (const c of this.cyl) {
      const crank = frac(this.crank + fl + c.crankOffset);
      // a new combustion each time this cylinder passes the firing point: its strength depends on load,
      // varies a little every time, and on overrun some cycles misfire or pop
      if (crank >= 0.5 && frac(prevCrank + fl + c.crankOffset) < 0.5) {
        const l = this.load, r = this.rnd();
        c.ign = c.ignitionFactor * (0.12 + 0.88 * l) * (1 + 0.12 * r);
        if (l < 0.15) { const q = (this.rnd() + 1) / 2; if (q < 0.25) c.ign *= 0.2; else if (q > 0.93) c.ign = c.ignitionFactor * 1.1; }
      }
      c.snd = pistonMotion(crank) * c.piston + ignition(crank, c.ignitionTime) * c.ign;
      const exV = exhaustValve(frac(crank + P.exhaustValveShift)), inV = intakeValve(frac(crank + P.intakeValveShift));
      c.ex.alpha = c.exhaustClosed + (c.exhaustOpen - c.exhaustClosed) * exV;
      c.in.alpha = c.intakeClosed + (c.intakeOpen - c.intakeClosed) * inV;
      const exR = c.ex.pop(), inR = c.in.pop(), xtR = c.xt.pop();
      c.xtOut = xtR[0]; c.xt.push(exR[1], lastEx);
      this.inColl += inR[1]; this.exColl += xtR[1]; vib += c.snd;
    }
    const spR = this.pipe.pop(); let m0 = 0, m1 = 0; for (const m of this.muff) { const r = m.pop(); m0 += r[0]; m1 += r[1]; }
    const blowN = this.blowLP.f(this.rnd()) * (P.blowNoise || 0) * (0.25 + 0.75 * this.load);
    for (const c of this.cyl) { const crank = frac(this.crank + c.crankOffset); const intake = this.inColl / nc + inNoise * intakeValve(crank); const blow = blowN * exhaustValve(frac(crank + P.exhaustValveShift)) * c.ign / c.ignitionFactor; c.ex.push((1 - Math.abs(c.ex.alpha)) * (c.snd * 0.5 + blow), c.xtOut); c.in.push((1 - Math.abs(c.in.alpha)) * c.snd * 0.5, intake); }
    this.pipe.push(this.exColl, m0); this.exColl += spR[0];
    for (const m of this.muff) m.push(spR[1] / this.muff.length, 0);
    vib = this.vibLP.f(vib);
    let mixed = this.inColl * P.intakeVolume + vib * P.vibrationVolume + m1 * P.exhaustVolume;
    mixed -= this.dc.f(mixed);
    // rasp: the loud pressure waves in a short open exhaust distort (they steepen into shocks), which adds
    // high harmonics that follow the revs; only the top end of the distortion is mixed back in
    if (P.rasp) { const d = Math.tanh(mixed * 2.2) / 2.2, hp = d - this.rHP.f(d); mixed += hp * P.rasp * 3 * (0.4 + 0.6 * this.load); }
    return mixed;
  }
}

// the audio-thread side: parameters arrive as messages (rpm, load), output is mono
if (typeof registerProcessor === "function") {
  registerProcessor("engine-synth", class extends AudioWorkletProcessor {
    constructor() {
      super(); this.e = new EngineSynth(sampleRate, ENGINES.raw); this.tRpm = 4000; this.tLoad = 0.3; this.gain = 0.12;
      this.port.onmessage = (ev) => { const d = ev.data; if (d.rpm != null) this.tRpm = d.rpm; if (d.load != null) this.tLoad = d.load; if (d.gain != null) this.gain = d.gain; if (d.engine && ENGINES[d.engine]) { const r = this.e.rpm, l = this.e.load; this.e = new EngineSynth(sampleRate, ENGINES[d.engine]); this.e.rpm = r; this.e.load = l; } };
    }
    process(_in, outputs) {
      const out = outputs[0][0], e = this.e, n = out.length;
      for (let i = 0; i < n; i++) {
        e.rpm += (this.tRpm - e.rpm) * 0.002; e.load += (this.tLoad - e.load) * 0.004; // glide like a real crank
        const v = e.sample() * this.gain;
        out[i] = Math.tanh(v);
      }
      for (let ch = 1; ch < outputs[0].length; ch++) outputs[0][ch].set(out);
      return true;
    }
  });
}

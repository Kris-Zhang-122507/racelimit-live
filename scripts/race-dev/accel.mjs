// straight-line test on a synthetic 6 km straight: 0-100, 0-200, 0-300 and top speed, plus battery use
const ROOT = new URL("../../", import.meta.url).pathname; // the repo
const R = ROOT + "public/race/";
const { newCar, stepCar, CAR } = await import(R + "physics.js?" + Date.now());
Object.assign(CAR, JSON.parse(process.env.CAR || "{}"));
const N = 7000, X = new Float32Array(N), Z = new Float32Array(N).map((_, i) => i), Y = new Float32Array(N), TX = new Float32Array(N), TZ = new Float32Array(N).fill(1), LX = new Float32Array(N).fill(1), LZ = new Float32Array(N), K = new Float32Array(N), slope = new Float32Array(N), dist = Float32Array.from(Z), kerb = new Uint8Array(N);
const tr = { N, len: N, X, Y, Z, TX, TZ, LX, LZ, K, slope, dist, kerb, half: 7.5, run: 13, wrap: (i) => Math.max(0, Math.min(N - 1, i)), nearestFrom: (x, z) => Math.max(0, Math.min(N - 1, Math.round(z))), frame: (x, z, i) => ({ lat: x, along: z - i, y: 0, s: z }), wall: [new Float32Array(N).fill(21), new Float32Array(N).fill(21)], wallType: [new Uint8Array(N), new Uint8Array(N)] };
const c = newCar(tr, 5, 0); const soc0 = +(process.env.SOC || 1); c.ers *= soc0;
let t = 0, marks = { 100: null, 200: null, 300: null }, dt = 1 / 240, out = [];
for (let s = 0; s < 240 * 40; s++) {
  stepCar(c, { throttle: 1, brake: 0, steer: 0, analog: true }, tr, dt, {});
  t += dt; const kmh = c.u * 3.6;
  for (const k of [100, 200, 300]) if (marks[k] == null && kmh >= k) marks[k] = t.toFixed(2);
  if (s % 480 === 0) out.push(`${t.toFixed(0)}s ${kmh.toFixed(0)}km/h g${c.gear} bat${(c.ers / 4e6 * 100).toFixed(0)}% ${c.aeroMode[0]}`);
  if (c.z > N - 50) break;
}
console.log("0-100", marks[100], "0-200", marks[200], "0-300", marks[300], "| top", (c.u * 3.6).toFixed(0), "at", c.z.toFixed(0), "m");
console.log(out.join(" | "));

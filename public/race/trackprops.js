// The things round a circuit that aren't the track itself: city buildings (several kinds, never on top
// of the track), floodlights for the night races, marshal posts, billboards, sponsor bridges over the
// track, TV camera towers, the paddock behind the garages, street lamps, barns and rocks. Everything is
// generated and drawn with instancing; `ctx` comes from buildCircuit (trackmesh.js).
import * as THREE from "three";
import { facadeMaterials } from "./trackworld.js?v=mvlhim90";

let seed = 911; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), V = new THREE.Vector3(), Sv = new THREE.Vector3(), col = new THREE.Color();
const SPONSORS = [["NORTHWIND", "#1D4E89", "#F2F4F7"], ["ARCLIGHT", "#F2F4F7", "#E2502B"], ["TIDELINE", "#0E7C7B", "#F2F4F7"], ["QUILLON", "#16181D", "#F5C518"], ["BLUEFERN", "#F2F4F7", "#2E7D4F"], ["RACELIMIT", "#16181D", "#FFA51F"], ["VELOCE", "#B3122E", "#F2F4F7"], ["SUMMIT AIR", "#F2F4F7", "#1D4E89"]];

// boxes merged into one geometry, with per-face uv (windows scale with the wall's size) and a darker roof
function boxes(list) {
  const pos = [], nor = [], uv = [], colA = [];
  for (const b of list) {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d).toNonIndexed(); g.translate(b.x ?? 0, (b.y ?? 0) + b.h / 2, b.z ?? 0);
    const P = g.attributes.position, Nn = g.attributes.normal, U = g.attributes.uv;
    for (let v = 0; v < P.count; v++) {
      pos.push(P.getX(v), P.getY(v), P.getZ(v)); nor.push(Nn.getX(v), Nn.getY(v), Nn.getZ(v));
      const top = Math.abs(Nn.getY(v)) > 0.5, side = Math.abs(Nn.getX(v)) > 0.5 ? b.d : b.w;
      uv.push(top ? 0.995 : U.getX(v) * side / (b.uw ?? 24) + (b.u0 ?? 0), top ? 0.995 : U.getY(v) * b.h / (b.vh ?? 48));
      const c = top ? b.roof ?? 0.42 : b.shade ?? 1; colA.push(c, c, c);
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3));
  return g;
}
// a few small boxes on a roof (air conditioning, lift housings)
const roofKit = (w, d, h, n) => Array.from({ length: n }, () => ({ w: 2 + rnd() * 4, d: 2 + rnd() * 4, h: 1.2 + rnd() * 2.4, x: (rnd() - 0.5) * w * 0.6, z: (rnd() - 0.5) * d * 0.6, y: h, roof: 0.6, shade: 0.55 }));

export function addProps(ctx) {
  const { mapRes, tr, group, tex, canvas, hAt, sideK, clearOfTrack, inKeepOut, keepOut, groundAt, fenceOff, lit, isNight, pitInfo } = ctx;
  const { N, X, Z, LX, LZ, TX, TZ } = tr, W = tr.wall, WT = tr.wallType, at = tr.wrap, half = tr.half;
  const SC = tr.cfg.scenery ?? "forest", city = SC === "city";
  const add = (m, pad = 8) => { if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); m.boundingSphere.radius += pad; group.add(m); return m; };
  const cellsOf = (list, size = 400) => { const cells = new Map(); for (const t of list) { const key = Math.floor(t.x / size) * 10007 + Math.floor(t.z / size); if (!cells.has(key)) cells.set(key, []); cells.get(key).push(t); } return [...cells.values()]; };
  const yawAt = (i, s) => Math.atan2(-LX[i] * s, -LZ[i] * s); // facing the track from side s

  // is the whole rectangle (centre, half-sizes, angle) clear of the track, the pits, the stands and what's already been put down?
  const taken = [];
  const rectClear = (x, z, hl, hw, ang, margin, keep = true) => {
    const c = Math.cos(ang), s = Math.sin(ang), nl = Math.max(2, Math.ceil((hl * 2) / 7)), nw = Math.max(2, Math.ceil((hw * 2) / 7));
    for (let a = 0; a <= nl; a++) for (let b = 0; b <= nw; b++) {
      const u = -hl + (2 * hl * a) / nl, v = -hw + (2 * hw * b) / nw, px = x + s * u + c * v, pz = z + c * u - s * v;
      if (!clearOfTrack(px, pz, margin) || (keep && inKeepOut(px, pz, 2)) || mapRes?.blocked(px, pz, 1)) return false;
    }
    const r = Math.hypot(hl, hw); for (const t of taken) if ((t.x - x) ** 2 + (t.z - z) ** 2 < (t.r + r) ** 2 * 0.72) return false;
    return true;
  };
  const take = (x, z, hl, hw) => taken.push({ x, z, r: Math.hypot(hl, hw) });

  // ---------- the paddock behind the garages: team motorhomes and trucks ----------
  if (tr.pitRoad && pitInfo.garageRow && !pitInfo.garageRow.trackSide) {
    const R = tr.pitRoad, gr = pitInfo.garageRow, ts = R.tk === 0 ? 1 : -1;
    const mhG = boxes([{ w: 15, h: 4.6, d: 5.2, uw: 15, vh: 4.6, roof: 0.85 }]), trG = boxes([{ w: 16, h: 4, d: 2.6, uw: 16, vh: 4, roof: 0.8 }, { w: 2.6, h: 3.4, d: 2.5, x: 9.4, roof: 0.8, shade: 0.9 }]);
    const mhTex = tex(canvas(256, 80, (g, w, h) => { g.fillStyle = "#F4F5F7"; g.fillRect(0, 0, w, h); g.fillStyle = "#1A1E26"; g.fillRect(8, 16, w - 16, 26); g.fillStyle = "rgba(0,0,0,.18)"; for (let x = 24; x < w; x += 40) g.fillRect(x, 16, 2, 26); g.fillStyle = "#C9CDD4"; g.fillRect(0, h - 10, w, 10); }));
    const mhM = new THREE.MeshStandardMaterial({ map: mhTex, vertexColors: true, roughness: 0.4, metalness: 0.2 }), trM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3 });
    const list = [], trucks = [];
    for (let t = 0; t < 10; t++) {
      const pg = gr.at[t], back = -ts * (gr.out[t] + gr.depth + 12), x = R.X[pg] + R.LX[pg] * back, z = R.Z[pg] + R.LZ[pg] * back, ang = Math.atan2(R.TX[pg], R.TZ[pg]);
      // (only where there's room: at Monaco, say, the garages back right onto another part of the track)
      if (rectClear(x, z, 8, 3.2, ang + Math.PI / 2, 4, false)) { list.push({ x, z, y: R.Y[pg], ang, c: gr.cols[t] }); take(x, z, 8, 3); }
      const b2 = -ts * (gr.out[t] + gr.depth + 24), x2 = R.X[pg] + R.LX[pg] * b2, z2 = R.Z[pg] + R.LZ[pg] * b2;
      if (rectClear(x2, z2, 8.5, 2, ang + Math.PI / 2, 4, false)) { trucks.push({ x: x2, z: z2, y: R.Y[pg], ang, c: gr.cols[t] }); take(x2, z2, 8.5, 2); }
    }
    const mh = new THREE.InstancedMesh(mhG, mhM, Math.max(1, list.length)), tk = new THREE.InstancedMesh(trG, trM, Math.max(1, trucks.length)); mh.count = list.length; tk.count = trucks.length;
    list.forEach((p, j) => { q.setFromAxisAngle(up, p.ang + Math.PI / 2); m4.compose(V.set(p.x, groundAt(p.x, p.z).h + 0.1, p.z), q, Sv.set(1, 1, 1)); mh.setMatrixAt(j, m4); mh.setColorAt(j, col.set(p.c).lerp(new THREE.Color(1, 1, 1), 0.35)); });
    trucks.forEach((p, j) => { q.setFromAxisAngle(up, p.ang + Math.PI / 2); m4.compose(V.set(p.x, groundAt(p.x, p.z).h + 0.1, p.z), q, Sv.set(1, 1, 1)); tk.setMatrixAt(j, m4); tk.setColorAt(j, col.set(p.c)); });
    if (list.length) add(mh); if (trucks.length) add(tk);
    const mid = list[Math.floor(list.length / 2)]; if (mid) keepOut.push({ x: mid.x, z: mid.z, hl: gr.len / 2 + 20, hw: 22, ang: mid.ang });
  }

  // ---------- floodlights (night races; Abu Dhabi at dusk): poles behind the barrier, an arm over the run-off,
  // a bank of lamps, and a soft glow round each head ----------
  if (lit && ctx.lamps.length) {
    const L = ctx.lamps;
    const poleG = new THREE.CylinderGeometry(0.17, 0.3, 1, 6, 1, true); poleG.translate(0, 0.5, 0);
    const armG = new THREE.BoxGeometry(0.16, 0.16, 1); armG.translate(0, 0, 0.5);
    const headG = new THREE.BoxGeometry(2.8, 0.5, 0.9);
    const steel = new THREE.MeshStandardMaterial({ color: 0x5E646D, metalness: 0.6, roughness: 0.5 }), headM = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFF3DC, emissiveIntensity: isNight ? 4 : 1.6 });
    for (const list of cellsOf(L, 500)) {
      const poles = new THREE.InstancedMesh(poleG, steel, list.length), arms = new THREE.InstancedMesh(armG, steel, list.length), heads = new THREE.InstancedMesh(headG, headM, list.length);
      list.forEach((l, j) => {
        const yaw = Math.atan2(l.hx - l.px, l.hz - l.pz), reach = Math.hypot(l.hx - l.px, l.hz - l.pz);
        q.setFromAxisAngle(up, yaw); m4.compose(V.set(l.px, l.py, l.pz), q, Sv.set(1, l.hy - l.py + 0.4, 1)); poles.setMatrixAt(j, m4);
        m4.compose(V.set(l.px, l.hy + 0.3, l.pz), q, Sv.set(1, 1, reach)); arms.setMatrixAt(j, m4);
        const e = new THREE.Euler(0.55, yaw, 0, "YXZ"); q.setFromEuler(e); m4.compose(V.set(l.hx, l.hy, l.hz), q, Sv.set(1, 1, 1)); heads.setMatrixAt(j, m4);
      });
      add(poles, 20); add(arms, 20); add(heads, 20);
    }
    const glowTex = tex(canvas(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, "rgba(255,250,235,1)"); gr.addColorStop(0.12, "rgba(255,240,205,.85)"); gr.addColorStop(0.4, "rgba(255,220,170,.22)"); gr.addColorStop(1, "rgba(255,210,160,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, w); }));
    const gp = new Float32Array(L.length * 3); L.forEach((l, j) => { gp[j * 3] = l.hx; gp[j * 3 + 1] = l.hy - 0.3; gp[j * 3 + 2] = l.hz; });
    const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(gp, 3));
    const glow = new THREE.Points(gg, new THREE.PointsMaterial({ map: glowTex, size: isNight ? 11 : 6, sizeAttenuation: true, transparent: true, opacity: isNight ? 0.95 : 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    glow.renderOrder = 2; group.add(glow);
  }

  // ---------- buildings: several kinds (glass towers, stepped towers, offices, flats, low brick blocks),
  // lined up with the streets round the track, and never over the track, the pits or each other ----------
  // (made-up buildings only where the map hasn't got the real ones)
  const MIXB = (mapRes?.buildings ?? 0) > 40 ? 0 : { city: 760, park: tr.cfg.cc === "MC" ? 0 : 0, tropical: tr.cfg.street ? 220 : 40, desert: tr.cfg.street ? 260 : 60, countryside: 0, plains: 30, dunes: 25, alpine: 0, forest: 0 }[SC] ?? 0;
  if (MIXB) {
    const mats = facadeMaterials({ tex, canvas, isNight, dusk: tr.cfg.time === "dusk" });
    // the kinds: [weight, style, size along the street, size back, build(h) → boxes]
    const KINDS = [
      { w: 3, st: "glass", L: 20, D: 20, hs: [60, 120], b: (h) => [{ w: 20, d: 20, h }, { w: 15, d: 15, h: 4, y: h, shade: 0.7 }, ...roofKit(15, 15, h + 4, 2)] },
      { w: 2, st: "glass", L: 28, D: 28, hs: [50, 95], b: (h) => [{ w: 28, d: 28, h: h * 0.45 }, { w: 22, d: 22, h: h * 0.33, y: h * 0.45 }, { w: 15, d: 15, h: h * 0.22, y: h * 0.78 }, { w: 0.6, d: 0.6, h: 12, y: h, shade: 0.6 }] },
      { w: 4, st: "office", L: 34, D: 24, hs: [18, 40], b: (h) => [{ w: 34, d: 24, h }, ...roofKit(34, 24, h, 4)] },
      { w: 3, st: "office", L: 40, D: 30, hs: [40, 70], b: (h) => [{ w: 40, d: 30, h: 12, shade: 0.85 }, { w: 20, d: 20, h: h - 12, y: 12, x: 4 }, ...roofKit(20, 20, h, 2).map((r) => ({ ...r, x: r.x + 4 }))] },
      { w: 4, st: "flats", L: 46, D: 14, hs: [16, 30], b: (h) => [{ w: 46, d: 14, h }, { w: 44, d: 0.8, h: 0.3, y: h, z: 6.6, shade: 0.8 }, ...roofKit(46, 14, h, 3)] },
      { w: 3, st: "flats", L: 24, D: 22, hs: [12, 24], b: (h) => [{ w: 24, d: 22, h }, { w: 26, d: 24, h: 0.6, y: h, roof: 0.5 }] },
      { w: 4, st: "brick", L: 22, D: 16, hs: [7, 13], b: (h) => [{ w: 22, d: 16, h }, { w: 23, d: 17, h: 0.8, y: h, roof: 0.35, shade: 0.7 }] },
      { w: 2, st: "brick", L: 30, D: 20, hs: [10, 18], b: (h) => [{ w: 30, d: 20, h }, ...roofKit(30, 20, h, 2)] },
    ];
    const wsum = KINDS.reduce((a, k) => a + k.w, 0), pickKind = () => { let r = rnd() * wsum; for (const k of KINDS) { if ((r -= k.w) < 0) return k; } return KINDS[0]; };
    // the same few heights per kind, so they can share a geometry (instancing)
    const geoms = new Map(), geomFor = (kind, hk) => { const key = KINDS.indexOf(kind) * 10 + hk; if (!geoms.has(key)) { const h = kind.hs[0] + ((kind.hs[1] - kind.hs[0]) * hk) / 3; geoms.set(key, { g: boxes(kind.b(h)), kind, h }); } return key; };
    const placed = []; let tries = 0;
    while (placed.length < MIXB && tries++ < MIXB * 30) {
      const i = Math.floor(rnd() * N), s = rnd() < 0.5 ? -1 : 1, k = sideK(s), kind = pickKind(), tall = kind.hs[1] > 50;
      const near = city ? 8 : 20, far = city ? (tall ? 420 : 260) : 300, sc = 0.85 + rnd() * 0.3;
      const turn = rnd() < 0.75 ? 0 : Math.PI / 2, hl = ((turn ? kind.D : kind.L) * sc) / 2, hw = ((turn ? kind.L : kind.D) * sc) / 2;
      const off = W[k][i] + fenceOff + near + (tall ? 40 : 0) + hw + rnd() ** 1.5 * far, x = X[i] + LX[i] * s * off, z = Z[i] + LZ[i] * s * off;
      const ang = Math.atan2(TX[i], TZ[i]) + (rnd() - 0.5) * 0.12;
      if (!rectClear(x, z, hl + 1, hw + 1, ang, 5)) continue;
      take(x, z, hl, hw);
      placed.push({ x, z, ang: ang + turn, sc, key: geomFor(kind, Math.floor(rnd() * 4)), r: rnd() });
    }
    for (const cell of cellsOf(placed, 450)) {
      const by = new Map(); for (const p of cell) { if (!by.has(p.key)) by.set(p.key, []); by.get(p.key).push(p); }
      for (const [key, ls] of by) {
        const { g, kind } = geoms.get(key), m = new THREE.InstancedMesh(g, mats[kind.st], ls.length);
        ls.forEach((p, j) => { q.setFromAxisAngle(up, p.ang); m4.compose(V.set(p.x, groundAt(p.x, p.z).h - 0.4, p.z), q, Sv.set(p.sc, 1, p.sc)); m.setMatrixAt(j, m4); col.setHSL(0.06 + p.r * 0.5, 0.05 + p.r * 0.1, 0.78 + (1 - p.r) * 0.2); m.setColorAt(j, col); });
        m.receiveShadow = true; add(m, 80);
      }
    }
  }

  // ---------- marshal posts: a small hut behind the fence with two marshals in orange, every ~300 m ----------
  {
    const hutG = boxes([{ w: 2.4, h: 2.3, d: 2.2, shade: 1, roof: 0.9 }, { w: 2.8, h: 0.18, d: 2.6, y: 2.3, shade: 0.9, roof: 0.9 }]);
    const hutM = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xF1F2F4, roughness: 0.7 });
    const stripeG = new THREE.BoxGeometry(2.42, 0.35, 2.22); stripeG.translate(0, 1.8, 0);
    const stripeM = new THREE.MeshStandardMaterial({ color: 0xFF7A1A, roughness: 0.6 });
    const bodyG = new THREE.CapsuleGeometry(0.24, 0.95, 3, 8); bodyG.translate(0, 0.72, 0);
    const headG = new THREE.SphereGeometry(0.15, 8, 6); headG.translate(0, 1.55, 0);
    const suitM = new THREE.MeshStandardMaterial({ color: 0xFF6A10, roughness: 0.75 }), headM = new THREE.MeshStandardMaterial({ color: 0xF2F2F2, roughness: 0.5 });
    const posts = [], people = [];
    for (let i = 120; i < N - 60; i += 280 + Math.floor(rnd() * 60)) {
      // on the outside of the nearest corner if there is one
      let sumK = 0; for (let d = -80; d <= 80; d += 8) sumK += tr.K[at(i + d)];
      const s = sumK > 0.02 ? 1 : sumK < -0.02 ? -1 : rnd() < 0.5 ? 1 : -1, k = sideK(s);
      if (WT[k][i] === 2 || tr.tunnel?.[i] > 0) continue;
      const o = ctx.fo(k, i) + 2.6, x = X[i] + LX[i] * s * o, z = Z[i] + LZ[i] * s * o, ang = yawAt(i, s);
      if (!rectClear(x, z, 2, 2, ang, 1.5)) continue;
      take(x, z, 2, 2); const y = groundAt(x, z).h;
      posts.push({ x, y, z, ang });
      for (const d of [-0.9, 1.0]) people.push({ x: x + TX[i] * d - LX[i] * s * 1.6, y, z: z + TZ[i] * d - LZ[i] * s * 1.6, ang: ang + (rnd() - 0.5) });
    }
    if (posts.length) {
      const hut = new THREE.InstancedMesh(hutG, hutM, posts.length), stripe = new THREE.InstancedMesh(stripeG, stripeM, posts.length);
      posts.forEach((p, j) => { q.setFromAxisAngle(up, p.ang); m4.compose(V.set(p.x, p.y, p.z), q, Sv.set(1, 1, 1)); hut.setMatrixAt(j, m4); stripe.setMatrixAt(j, m4); });
      const body = new THREE.InstancedMesh(bodyG, suitM, people.length), head = new THREE.InstancedMesh(headG, headM, people.length);
      people.forEach((p, j) => { q.setFromAxisAngle(up, p.ang); m4.compose(V.set(p.x, p.y, p.z), q, Sv.set(1, 1, 1)); body.setMatrixAt(j, m4); head.setMatrixAt(j, m4); });
      for (const m of [hut, stripe, body, head]) { m.castShadow = true; add(m, 30); }
    }
  }

  // ---------- billboards behind the fences, and TV camera towers ----------
  {
    const boardMats = SPONSORS.map(([name, bg, fg]) => new THREE.MeshStandardMaterial({ map: tex(canvas(512, 160, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = "700 92px BC, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name, w / 2, h / 2 + 4); g.fillRect(30, h - 22, w - 60, 7); })), roughness: 0.6, emissive: isNight ? 0xFFFFFF : 0x000000, emissiveIntensity: isNight ? 0.35 : 0 }));
    for (const m of boardMats) if (isNight) m.emissiveMap = m.map;
    const panelG = new THREE.BoxGeometry(12, 4, 0.25); panelG.translate(0, 5.2, 0);
    const legsG = boxes([{ w: 0.3, h: 3.4, d: 0.3, x: -4.5 }, { w: 0.3, h: 3.4, d: 0.3, x: 4.5 }]), legM = new THREE.MeshStandardMaterial({ color: 0x6E747C, metalness: 0.5, roughness: 0.5, vertexColors: true });
    const towerG = boxes([{ w: 2.2, h: 9, d: 2.2, shade: 0.75 }, { w: 3.2, h: 0.3, d: 3.2, y: 9 }, { w: 3.4, h: 1.2, d: 0.08, y: 9.3, z: 1.6 }, { w: 0.8, h: 0.6, d: 1.2, y: 9.6, x: 0.4, z: 0.6, shade: 0.3 }]), towerM = new THREE.MeshStandardMaterial({ color: 0x9AA1AA, metalness: 0.4, roughness: 0.6, vertexColors: true });
    const boards = SPONSORS.map(() => []), legs = [], towers = [];
    for (let i = 60, n = 0; i < N - 60; i += 330 + Math.floor(rnd() * 180), n++) {
      const s = rnd() < 0.5 ? 1 : -1, k = sideK(s); if (WT[k][i] === 2 || tr.tunnel?.[i] > 0) continue;
      const tv = n % 3 === 2, o = ctx.fo(k, i) + (tv ? 5 : 4.5), x = X[i] + LX[i] * s * o, z = Z[i] + LZ[i] * s * o, ang = yawAt(i, s);
      if (!rectClear(x, z, tv ? 2 : 6.5, 2, ang, 1.5)) continue;
      take(x, z, tv ? 2 : 6.5, 2); const y = groundAt(x, z).h, p = { x, y, z, ang };
      if (tv) towers.push(p); else { boards[n % SPONSORS.length].push(p); legs.push(p); }
    }
    const put = (g, m, list) => { if (!list.length) return; const im = new THREE.InstancedMesh(g, m, list.length); list.forEach((p, j) => { q.setFromAxisAngle(up, p.ang); m4.compose(V.set(p.x, p.y, p.z), q, Sv.set(1, 1, 1)); im.setMatrixAt(j, m4); }); im.castShadow = true; add(im, 30); };
    boards.forEach((list, n) => put(panelG, boardMats[n], list)); put(legsG, legM, legs); put(towerG, towerM, towers);

    // sponsor bridges over the track on a couple of straights (legs beyond the barriers on both sides)
    let bridges = 0;
    for (let i = 500; i < N - 300 && bridges < 3; i += 37) {
      let straight = true; for (let d = -50; d <= 50; d += 5) if (Math.abs(tr.K[at(i + d)]) > 0.0025) straight = false;
      if (!straight || W[0][i] > 26 || W[1][i] > 26 || WT[0][i] === 2 || WT[1][i] === 2 || tr.bank[i] || tr.tunnel?.[i] > 0 || (tr.map?.crossings ?? []).some((c) => Math.abs(c.i - i) < 120)) continue;
      const oL = ctx.fo(0, i) + 1.2, oR = ctx.fo(1, i) + 1.2, span = oL + oR, cx = X[i] + LX[i] * (oL - oR) / 2, cz = Z[i] + LZ[i] * (oL - oR) / 2;
      const yL = groundAt(X[i] + LX[i] * oL, Z[i] + LZ[i] * oL).h, yR = groundAt(X[i] - LX[i] * oR, Z[i] - LZ[i] * oR).h, y0 = Math.max(hAt(i, 0), Math.min(yL, yR));
      const [name, bg, fg] = SPONSORS[(bridges * 3 + 1) % SPONSORS.length];
      const faceT = tex(canvas(1024, 128, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = "700 84px BC, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; for (let n = 0; n < 2; n++) g.fillText(name, w * (0.25 + n * 0.5), h / 2 + 4); }));
      const bridge = new THREE.Group(), steelM = new THREE.MeshStandardMaterial({ color: 0x3A3F48, metalness: 0.5, roughness: 0.5 });
      const beam = new THREE.Mesh(new THREE.BoxGeometry(span + 2, 2.4, 1.6), [steelM, steelM, steelM, steelM, new THREE.MeshStandardMaterial({ map: faceT, roughness: 0.6, emissive: isNight ? 0xFFFFFF : 0, emissiveMap: isNight ? faceT : null, emissiveIntensity: 0.35 }), new THREE.MeshStandardMaterial({ map: faceT, roughness: 0.6, emissive: isNight ? 0xFFFFFF : 0, emissiveMap: isNight ? faceT : null, emissiveIntensity: 0.35 })]);
      beam.position.y = 8.6; bridge.add(beam);
      for (const sx of [-1, 1]) { const legY = sx > 0 ? yL : yR, hL = y0 + 9.8 - legY; const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, hL, 1.2), steelM); leg.position.set(sx * span / 2, legY - y0 + hL / 2 - 0.6, 0); bridge.add(leg); }
      bridge.position.set(cx, y0, cz); bridge.rotation.y = Math.atan2(TX[i], TZ[i]); // its x axis points across the track, to the left
      bridge.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      group.add(bridge); bridges++; i += 900;
    }
  }

  // ---------- street lamps along the walls of street circuits run in daylight ----------
  if (tr.street && !isNight) {
    const lampG = boxes([{ w: 0.22, h: 9, d: 0.22, shade: 1 }, { w: 0.14, h: 0.14, d: 2.4, y: 8.8, z: 1.1 }, { w: 0.5, h: 0.22, d: 1.0, y: 8.6, z: 2.2, shade: 0.35 }]);
    const lampM = new THREE.MeshStandardMaterial({ color: 0x4B5058, metalness: 0.5, roughness: 0.5, vertexColors: true }), list = [];
    for (let i = 0; i < N; i += 45) { const s = (i / 45) % 2 ? 1 : -1, k = sideK(s); if (WT[k][i] !== 3 || tr.tunnel?.[i] > 0) continue; const o = W[k][i] + 1.4, x = X[i] + LX[i] * s * o, z = Z[i] + LZ[i] * s * o; if (!clearOfTrack(x, z, 0.8) || inKeepOut(x, z, 1)) continue; list.push({ x, z, y: groundAt(x, z).h, ang: yawAt(i, s) }); } // (the arm reaches out over the wall)
    if (list.length) { const im = new THREE.InstancedMesh(lampG, lampM, list.length); list.forEach((p, j) => { q.setFromAxisAngle(up, p.ang); m4.compose(V.set(p.x, p.y, p.z), q, Sv.set(1, 1, 1)); im.setMatrixAt(j, m4); }); add(im, 20); }
  }

  // ---------- out in the country: barns and farm buildings; rocks on hills and in the desert ----------
  {
    const barns = { countryside: 40, plains: 35, park: 14, alpine: 30, forest: 8 }[SC] ?? 0;
    if (barns) {
      const roofShape = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 3, 1); g.rotateZ(Math.PI / 2); g.rotateX(Math.PI / 6 + Math.PI / 2); g.scale(1, 0.5, 1); return g; })();
      const wallG = boxes([{ w: 1, h: 1, d: 1, uw: 1, vh: 1 }]), barnM = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.85, vertexColors: true }), roofM = new THREE.MeshStandardMaterial({ color: 0x4A4F57, roughness: 0.7 });
      const list = []; let tries = 0;
      while (list.length < barns && tries++ < barns * 40) {
        const i = Math.floor(rnd() * N), s = rnd() < 0.5 ? -1 : 1, k = sideK(s), w = 14 + rnd() * 14, d = 9 + rnd() * 6, h = 4 + rnd() * 3;
        const off = W[k][i] + 60 + rnd() * 320, x = X[i] + LX[i] * s * off, z = Z[i] + LZ[i] * s * off, ang = rnd() * 6.28;
        if (!rectClear(x, z, w / 2 + 2, d / 2 + 2, ang, 8)) continue;
        take(x, z, w / 2, d / 2); list.push({ x, z, y: groundAt(x, z).h - 0.2, w, d, h, ang, r: rnd() });
      }
      if (list.length) {
        const walls = new THREE.InstancedMesh(wallG, barnM, list.length), roofs = new THREE.InstancedMesh(roofShape, roofM, list.length);
        list.forEach((b, j) => { q.setFromAxisAngle(up, b.ang); m4.compose(V.set(b.x, b.y, b.z), q, Sv.set(b.w, b.h, b.d)); walls.setMatrixAt(j, m4); walls.setColorAt(j, col.set(b.r < 0.45 ? 0x8E3B2E : b.r < 0.75 ? 0xD9D2C3 : 0x6F5A44)); m4.compose(V.set(b.x, b.y + b.h + b.d * 0.22, b.z), q, Sv.set(b.w * 1.04, b.d * 0.62, b.d * 0.62)); roofs.setMatrixAt(j, m4); });
        walls.castShadow = roofs.castShadow = true; add(walls, 30); add(roofs, 30);
      }
    }
    const rocks = { alpine: 260, desert: 180, dunes: 60, countryside: 40 }[SC] ?? 0;
    if (rocks) {
      const g = new THREE.IcosahedronGeometry(1, 0), mat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.95, flatShading: true });
      const list = []; let tries = 0;
      while (list.length < rocks && tries++ < rocks * 20) {
        const i = Math.floor(rnd() * N), s = rnd() < 0.5 ? -1 : 1, k = sideK(s), off = W[k][i] + 20 + rnd() ** 1.3 * 380, x = X[i] + LX[i] * s * off, z = Z[i] + LZ[i] * s * off, r = 0.6 + rnd() ** 2 * 4;
        if (!clearOfTrack(x, z, 6 + r) || inKeepOut(x, z, r + 2)) continue;
        list.push({ x, z, y: groundAt(x, z).h, r, a: rnd() * 6.28, t: rnd() });
      }
      const im = new THREE.InstancedMesh(g, mat, Math.max(1, list.length));
      list.forEach((p, j) => { q.setFromEuler(new THREE.Euler(p.t, p.a, p.t * 0.5)); m4.compose(V.set(p.x, p.y + p.r * 0.25, p.z), q, Sv.set(p.r * 1.3, p.r * 0.8, p.r)); im.setMatrixAt(j, m4); im.setColorAt(j, col.setHSL(0.08, SC === "desert" || SC === "dunes" ? 0.3 : 0.05, 0.42 + p.t * 0.2)); });
      im.count = list.length; im.castShadow = true; if (list.length) add(im, 20);
    }
  }
  // for the trees placed after this: is (x, z) on something already here?
  return { blocked: (x, z, pad = 0) => taken.some((t) => (t.x - x) ** 2 + (t.z - z) ** 2 < (t.r + pad) ** 2) };
}

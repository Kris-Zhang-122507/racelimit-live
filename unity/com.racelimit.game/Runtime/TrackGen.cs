using System;
using System.Collections.Generic;
using UnityEngine;

namespace RaceLimit
{
    // A piece of generated circuit: a mesh for one material (named as the circuit model's are: rl_ground_<surface> for
    // ground the tyres feel, rl_<thing> for the rest)
    public class GenMesh
    {
        public string mat;
        public List<Vector3> v = new List<Vector3>();
        public List<Vector2> uv = new List<Vector2>();
        public List<int> t = new List<int>();
        public bool doubleSided;
    }

    public class GenResult
    {
        public TrackInfo.Data data;
        public List<GenMesh> meshes = new List<GenMesh>();
        public List<Vector3> trees = new List<Vector3>();
        public List<Vector3> pieceStarts = new List<Vector3>(); // where each piece begins (for labels in the Scene view)
        public Vector3 min, max;
        public string log = "";
    }

    // The Track Builder's generator: turns a list of pieces into a circuit — centre line, track surface, kerbs, run-off
    // zones (tarmac, gravel, sand, grass), barriers (armco, concrete, Tecpro), catch fences, a pit lane with garages,
    // the start line and grid — plus the track data the game runs on (TrackInfo.Data, in this scene's own coordinates).
    // No Unity objects here (TrackLayout makes those), so it can be run and checked outside Unity.
    public static class TrackGen
    {
        const float HW = 3.2f, PITWALL = 0.45f; // half the pit lane's fast lane; the pit wall's thickness

        class Sample
        {
            public Vector3 p; public float psi, k, half, bank; public int piece;
            public SideSetup[] side = new SideSetup[2];
            public float[] near = new float[2], far = new float[2], face = new float[2];
            public RunoffType[] nearT = new RunoffType[2], farT = new RunoffType[2];
            public BarrierType[] bar = new BarrierType[2]; public bool[] fence = new bool[2], kerb = new bool[2]; public int[] rows = new int[2];
            public bool[] pitSide = new bool[2];
        }

        public static GenResult Generate(string name, float half, List<TrackPiece> pieces, PitSetup pit, Vector3 start, float headingDeg)
        {
            var R = new GenResult();
            if (pieces == null || pieces.Count == 0) { R.log = "No pieces"; return R; }
            // ---- 1. the pieces as 1 m steps: turn (radians, + = left), climb, which piece ----
            var turn = new List<float>(); var rise = new List<float>(); var owner = new List<int>();
            for (int pi = 0; pi < pieces.Count; pi++)
            {
                var pc = pieces[pi]; int before = turn.Count;
                if (pc.kind == PieceKind.Straight)
                {
                    int n = Mathf.Max(1, Mathf.RoundToInt(pc.length));
                    for (int s = 0; s < n; s++) { turn.Add(0); rise.Add(0); owner.Add(pi); }
                }
                else if (pc.kind == PieceKind.Corner)
                {
                    float A = pc.angle * Mathf.Deg2Rad * (pc.direction == TurnDirection.Left ? 1 : -1), Rr = Mathf.Max(5, pc.radius);
                    float e = Mathf.Clamp(pc.ease, 0, Mathf.Abs(A) * Rr), L = Mathf.Abs(A) * Rr + e; int n = Mathf.Max(2, Mathf.RoundToInt(L));
                    var raw = new float[n]; float sum = 0;
                    for (int s = 0; s < n; s++) { float m = s + 0.5f; float r = e > 0.5f ? Mathf.Min(1, Mathf.Min(m / e, (n - m) / e)) : 1; raw[s] = r; sum += r; }
                    for (int s = 0; s < n; s++) { turn.Add(A * raw[s] / sum); rise.Add(0); owner.Add(pi); }
                }
                else if (pc.shape != null)
                {
                    foreach (var st in pc.shape)
                    {
                        float len = st.len * pc.scale; int n = Mathf.Max(1, Mathf.RoundToInt(len));
                        float tr = st.turn * Mathf.Deg2Rad * (pc.mirror ? -1 : 1);
                        for (int s = 0; s < n; s++) { turn.Add(tr / n); rise.Add(st.rise / n); owner.Add(pi); }
                    }
                }
                int added = turn.Count - before;
                if (added > 0 && Mathf.Abs(pc.rise) > 0) for (int s = before; s < turn.Count; s++) rise[s] += pc.rise / added;
            }
            // ---- 2. walk it ----
            var S = new List<Sample>();
            float psi = headingDeg * Mathf.Deg2Rad; Vector3 pos = start;
            for (int s = 0; s < turn.Count; s++)
            {
                if (s == 0 || owner[s] != owner[s - 1]) { while (R.pieceStarts.Count < owner[s]) R.pieceStarts.Add(pos); R.pieceStarts.Add(pos); }
                S.Add(new Sample { p = pos, psi = psi, piece = owner[s] });
                float pm = psi - turn[s] / 2; pos += new Vector3(Mathf.Sin(pm), 0, Mathf.Cos(pm)); pos.y += rise[s]; psi -= turn[s];
            }
            // ---- 3. join the end back to the start (a smooth curve) ----
            {
                Vector3 a = pos, b = start; float da = psi, db = headingDeg * Mathf.Deg2Rad;
                Vector3 fa = new Vector3(Mathf.Sin(da), 0, Mathf.Cos(da)), fb = new Vector3(Mathf.Sin(db), 0, Mathf.Cos(db));
                Vector3 flat = b - a; flat.y = 0; float D = flat.magnitude;
                if (D > 0.6f)
                {
                    float m = D * 1.1f; var pts = new List<Vector3>();
                    for (int q = 0; q <= 400; q++)
                    {
                        float t = q / 400f, t2 = t * t, t3 = t2 * t;
                        Vector3 h = (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * m * fa + (-2 * t3 + 3 * t2) * b + (t3 - t2) * m * fb;
                        float sm = t * t * (3 - 2 * t); h.y = a.y + (b.y - a.y) * sm; pts.Add(h);
                    }
                    // (at 1 m spacing, not including the start itself)
                    float acc = 0; Vector3 last = pts[0];
                    S.Add(new Sample { p = pts[0], piece = pieces.Count - 1 });
                    for (int q = 1; q < pts.Count; q++)
                    {
                        Vector3 d = pts[q] - last; d.y = 0; acc += d.magnitude; last = pts[q];
                        if (acc >= 1f && q < pts.Count - 1) { var fl = pts[q] - start; fl.y = 0; if (fl.magnitude < 0.6f) break; S.Add(new Sample { p = pts[q], piece = pieces.Count - 1 }); acc = 0; }
                    }
                    R.log += "Closing the lap took " + Mathf.RoundToInt(D) + " m. ";
                }
            }
            int N = S.Count;
            if (N < 30) { R.log += "Too short"; return R; }
            Func<int, int> W = (i) => ((i % N) + N) % N;
            // headings and curvature from the points themselves (+ = turning left)
            for (int i = 0; i < N; i++) { Vector3 d = S[W(i + 1)].p - S[W(i - 1)].p; S[i].psi = Mathf.Atan2(d.x, d.z); }
            var kr = new float[N];
            for (int i = 0; i < N; i++) { float a = S[W(i - 2)].psi, b = S[W(i + 2)].psi, d = b - a; while (d > Mathf.PI) d -= 2 * Mathf.PI; while (d < -Mathf.PI) d += 2 * Mathf.PI; kr[i] = -d / Mathf.Max(0.5f, Dist(S[W(i - 2)].p, S[W(i + 2)].p)); }
            for (int i = 0; i < N; i++) { float a = 0; for (int d = -3; d <= 3; d++) a += kr[W(i + d)]; S[i].k = a / 7; }
            Vector3[] left = new Vector3[N], fwd = new Vector3[N];
            for (int i = 0; i < N; i++) { fwd[i] = new Vector3(Mathf.Sin(S[i].psi), 0, Mathf.Cos(S[i].psi)); left[i] = new Vector3(-fwd[i].z, 0, fwd[i].x); }
            var dist = new float[N]; for (int i = 1; i < N; i++) dist[i] = dist[i - 1] + Dist(S[i].p, S[i - 1].p);
            float lapLen = dist[N - 1] + Dist(S[0].p, S[N - 1].p);

            // ---- 4. what's beside each metre ----
            var kmax = new float[N]; // the tightest bend nearby (signed by the side it turns to)
            for (int i = 0; i < N; i++) { float best = 0; for (int d = -25; d <= 25; d += 2) { float k = S[W(i + d)].k; if (Mathf.Abs(k) > Mathf.Abs(best)) best = k; } kmax[i] = best; }
            for (int i = 0; i < N; i++)
            {
                var sm = S[i]; var pc = pieces[Mathf.Clamp(sm.piece, 0, pieces.Count - 1)];
                sm.half = pc.width > 0 ? pc.width / 2 : half;
                sm.bank = pc.bank * Mathf.Deg2Rad * Mathf.Sign(kmax[i] == 0 ? 1 : kmax[i]) * (Mathf.Abs(kmax[i]) > 1 / 600f ? 1 : 0);
                for (int k = 0; k < 2; k++)
                {
                    var sd = k == 0 ? pc.left : pc.right; sm.side[k] = sd;
                    sm.nearT[k] = sd.near; sm.farT[k] = sd.far; sm.near[k] = sd.near == RunoffType.None ? 0 : sd.nearWidth; sm.far[k] = sd.far == RunoffType.None ? 0 : sd.farWidth;
                    sm.bar[k] = sd.barrier; sm.fence[k] = sd.fence && sd.barrier != BarrierType.None;
                    sm.kerb[k] = sd.kerb && Mathf.Abs(kmax[i]) > 1 / 400f;
                    // (Tecpro: three rows on the outside of a bend, two elsewhere)
                    bool outside = (k == 0 && kmax[i] < -1 / 600f) || (k == 1 && kmax[i] > 1 / 600f);
                    sm.rows[k] = sd.barrier == BarrierType.Tecpro ? (outside ? 3 : 2) : 0;
                }
            }
            // smooth the widths and the banking between pieces
            for (int k = 0; k < 2; k++) { Smooth(S, N, (s) => s.near[k], (s, v) => s.near[k] = v, 12, 2); Smooth(S, N, (s) => s.far[k], (s, v) => s.far[k] = v, 12, 2); }
            Smooth(S, N, (s) => s.bank, (s, v) => s.bank = v, 15, 2); Smooth(S, N, (s) => s.half, (s, v) => s.half = v, 20, 1);
            // ---- 5. the pit lane ----
            int pitE = -1, pitL = 0; float laneC = half + 3 + PITWALL + HW, mergeO = half - 2.5f, TL = 0; float ps = 0;
            if (pit != null && pit.enabled)
            {
                pitE = W(Mathf.RoundToInt(pit.entry)); int pitX = W(Mathf.RoundToInt(pit.exit)); pitL = W(pitX - pitE);
                if (pitL < 200) { pitE = -1; R.log += "The pit lane is too short (it needs 200 m or more). "; }
                else { ps = pit.side == TurnDirection.Left ? 1 : -1; TL = Mathf.Min(140, pitL * 0.28f); }
            }
            Func<int, float> laneOff = (j) => mergeO + (laneC - mergeO) * Sm(0, TL, j) * (1 - Sm(pitL - TL, pitL, j));
            int pk = ps > 0 ? 0 : 1;
            if (pitE >= 0)
                for (int j = -10; j <= pitL + 10; j++)
                {
                    var sm = S[W(pitE + j)]; int jj = Mathf.Clamp(j, 0, pitL);
                    sm.pitSide[pk] = true; sm.nearT[pk] = RunoffType.Asphalt; sm.near[pk] = Mathf.Max(0.5f, laneOff(jj) - HW - sm.half); sm.far[pk] = 0; sm.bar[pk] = BarrierType.None; sm.fence[pk] = false; sm.rows[pk] = 0; sm.kerb[pk] = false;
                }
            // ---- 6. keep run-off and barriers clear of the inside of bends and of other parts of the track ----
            var grid = new Dictionary<long, List<int>>();
            for (int i = 0; i < N; i++) { long key = Key(S[i].p, 20); List<int> l; if (!grid.TryGetValue(key, out l)) grid[key] = l = new List<int>(); l.Add(i); }
            for (int i = 0; i < N; i++)
                for (int k = 0; k < 2; k++)
                {
                    var sm = S[i]; float s = k == 0 ? 1 : -1, tot = sm.near[k] + sm.far[k];
                    if (sm.pitSide[k]) continue;
                    float kin = kmax[i] * s; // > 0: this side is the inside of the bend
                    if (kin > 1e-4f) { float lim = Mathf.Max(1.5f, 0.85f / kin - sm.half - 1.5f); if (tot > lim) Scale(sm, k, lim / tot); tot = sm.near[k] + sm.far[k]; }
                    float maxOff = sm.half + tot + 2;
                    for (float o = sm.half + 2; o <= maxOff; o += 2)
                    {
                        Vector3 q = sm.p + left[i] * (s * o); bool hit = false;
                        foreach (int j in Near(grid, q, 20))
                        {
                            int dj = Mathf.Abs(i - j); dj = Mathf.Min(dj, N - dj); if (dj < 60) continue;
                            if (Mathf.Abs(S[j].p.y - sm.p.y) > 6) continue;
                            if (Dist(q, S[j].p) < S[j].half + 3) { hit = true; break; }
                        }
                        if (hit) { float lim = Mathf.Max(1f, o - sm.half - 5); if (tot > lim) Scale(sm, k, lim / tot); break; }
                    }
                }
            for (int k = 0; k < 2; k++)
            {
                MinFilter(S, N, (s) => s.near[k] + s.far[k], k, 6);
                for (int i = 0; i < N; i++) S[i].face[k] = S[i].half + S[i].near[k] + S[i].far[k];
                Smooth(S, N, (s) => s.face[k], (s, v) => s.face[k] = v, 4, 1);
            }

            // ---- 7. heights across: the track tilts with the banking, the run-off carries on flat ----
            Func<int, float, float> Y = (i, o) => { var sm = S[i]; float oc = Mathf.Clamp(o, -sm.half - 3, sm.half + 3); return sm.p.y - Mathf.Tan(sm.bank) * oc; };
            Func<int, float, Vector3> P = (i, o) => S[i].p + left[i] * o + Vector3.up * (Y(i, o) - S[i].p.y);

            // ---- 8. meshes ----
            var meshes = new Dictionary<string, GenMesh>();
            Func<string, GenMesh> M = (mat) => { GenMesh g; if (!meshes.TryGetValue(mat, out g)) { meshes[mat] = g = new GenMesh { mat = mat }; } return g; };
            // a strip along the track from sample a to b (b may run past the end of the lap), between two offsets
            Action<string, int, int, Func<int, float>, Func<int, float>, float, float, float> Strip = (mat, a, b, oA, oB, lift, uTile, vTile) =>
            {
                for (int c0 = a; c0 < b; c0 += 2000)
                {
                    int c1 = Mathf.Min(b, c0 + 2000); var g = M(mat); int baseV = g.v.Count;
                    for (int q = c0; q <= c1; q++)
                    {
                        int i = W(q); float A = oA(i), B = oB(i), dd = dist[i] + (q >= N ? lapLen : 0) - (q < 0 ? lapLen : 0);
                        g.v.Add(P(i, A) + Vector3.up * lift); g.v.Add(P(i, B) + Vector3.up * lift);
                        g.uv.Add(new Vector2(A / uTile, dd / vTile)); g.uv.Add(new Vector2(B / uTile, dd / vTile));
                        if (q > c0) { int v0 = baseV + 2 * (q - c0 - 1); Quad(g.t, v0, v0 + 1, v0 + 2, v0 + 3); }
                    }
                }
            };
            Strip("rl_ground_track", 0, N, (i) => -S[i].half, (i) => S[i].half, 0, 8, 8);
            for (int k = 0; k < 2; k++)
            {
                float s = k == 0 ? 1 : -1; int kk = k;
                // the white line just inside each edge
                Strip("rl_ground_line", 0, N, (i) => s * (S[i].half - 0.32f), (i) => s * (S[i].half - 0.12f), 0.004f, 1, 4);
                // kerbs
                foreach (var run in Runs(N, (i) => S[i].kerb[kk])) Strip("rl_ground_kerb", run.x - 6, run.y + 6, (i) => s * (S[i].half - 0.12f), (i) => s * (S[i].half + 1.1f), 0.012f, 1, 2);
                // run-off: the near zone, then the far one
                foreach (RunoffType rt in new[] { RunoffType.Asphalt, RunoffType.Gravel, RunoffType.Sand, RunoffType.Grass })
                {
                    string mat = RunoffMat(rt); RunoffType t0 = rt;
                    foreach (var run in Runs(N, (i) => S[i].nearT[kk] == t0 && S[i].near[kk] > 0.05f)) Strip(mat, run.x, run.y + 1, (i) => s * S[i].half, (i) => s * (S[i].half + S[i].near[kk]), -0.006f, 8, 8);
                    foreach (var run in Runs(N, (i) => S[i].farT[kk] == t0 && S[i].far[kk] > 0.05f && !S[i].pitSide[kk])) Strip(mat, run.x, run.y + 1, (i) => s * (S[i].half + S[i].near[kk]), (i) => s * S[i].face[kk], -0.01f, 8, 8);
                }
                // barriers
                foreach (BarrierType bt in new[] { BarrierType.Armco, BarrierType.Concrete, BarrierType.Tecpro })
                {
                    BarrierType b0 = bt;
                    foreach (var run in Runs(N, (i) => S[i].bar[kk] == b0))
                    {
                        if (bt == BarrierType.Concrete) Wall(M("rl_concrete"), S, W, P, left, run.x, run.y, k, (i) => S[i].face[kk], 1.0f, 0.5f);
                        else if (bt == BarrierType.Armco) Armco(M("rl_armco"), M("rl_post"), S, W, P, left, dist, run.x, run.y, k, (i) => S[i].face[kk]);
                        else Wall(M("rl_concrete"), S, W, P, left, run.x, run.y, k, (i) => S[i].face[kk] + TecDepth(S[i].rows[kk]) + 0.05f, 1.35f, 0.4f);
                    }
                }
                // catch fences, behind the barrier
                foreach (var run in Runs(N, (i) => S[i].fence[kk]))
                    Fence(M("rl_fence"), M("rl_post"), S, W, P, left, dist, run.x, run.y, k, (i) => S[i].face[kk] + (S[i].bar[kk] == BarrierType.Tecpro ? TecDepth(S[i].rows[kk]) + 0.3f : S[i].bar[kk] == BarrierType.Concrete ? 0.3f : 0.5f), (i) => S[i].bar[kk] == BarrierType.Tecpro ? 1.35f : 1.0f);
            }
            // the start line and the grid
            {
                Strip("rl_ground_line_paint", N - 1, N + 1, (i) => -S[i].half, (i) => S[i].half, 0.006f, 1, 1);
                for (int slot = 0; slot < 20; slot++)
                {
                    int i = W(-12 - slot * 8); float o = (slot % 2 == 0 ? 1 : -1) * S[i].half * 0.45f;
                    // a box: a bar across and two short lines back
                    Strip("rl_ground_line_paint", i - 1, i, (j) => o - 1.4f, (j) => o + 1.4f, 0.006f, 1, 1);
                    Strip("rl_ground_line_paint", i - 6, i, (j) => o - 1.5f, (j) => o - 1.35f, 0.006f, 1, 1);
                    Strip("rl_ground_line_paint", i - 6, i, (j) => o + 1.35f, (j) => o + 1.5f, 0.006f, 1, 1);
                }
            }
            // ---- 9. the pit lane ----
            var pitPts = new List<Vector3>(); var pitOut = new List<float>(); var pitBar = new List<bool>(); var pitDist = new List<float>();
            float limFrom = 0, limTo = 0;
            if (pitE >= 0)
            {
                // garages in the middle of the lane, outer wall close in elsewhere
                int g0 = Mathf.RoundToInt(TL + 30), g1 = Mathf.RoundToInt(pitL - TL - 30); int ng = pit.garages; float gl = 12f;
                int gMid = (g0 + g1) / 2, gHalf = Mathf.Min((g1 - g0) / 2, Mathf.RoundToInt(ng * gl / 2));
                int gA = gMid - gHalf, gB = gMid + gHalf;
                Func<int, float> outer = (j) => HW + 1.6f + 4.4f * Sm(gA - 25, gA - 5, j) * (1 - Sm(gB + 5, gB + 25, j));
                float acc = 0; Vector3 prev = Vector3.zero;
                for (int j = 0; j <= pitL; j++)
                {
                    int i = W(pitE + j); float o = laneOff(j);
                    Vector3 c = P(i, ps * o);
                    if (j > 0) acc += Dist(c, prev); prev = c;
                    pitPts.Add(c); pitDist.Add(acc); pitOut.Add(outer(j)); pitBar.Add(o - HW - PITWALL - S[i].half >= 0.5f);
                }
                limFrom = pitDist[Mathf.Clamp(Mathf.RoundToInt(TL + 12), 0, pitL)]; limTo = pitDist[Mathf.Clamp(Mathf.RoundToInt(pitL - TL - 12), 0, pitL)];
                // surfaces: from the fast lane's inside edge out to the outer wall / garages
                Func<int, float> oIn = (j) => laneOff(j) - HW, oOut = (j) => laneOff(j) + pitOut[j];
                PitStrip(M("rl_ground_track_pit"), S, W, P, pitE, pitL, ps, oIn, oOut, 0.002f);
                // the line between the fast lane and the working lane, along the garages
                PitStrip(M("rl_ground_line_paint"), S, W, P, pitE + gA, gB - gA, ps, (j) => laneOff(gA + j) + HW, (j) => laneOff(gA + j) + HW + 0.15f, 0.008f);
                // the speed limit lines
                foreach (float lim in new[] { limFrom, limTo }) { int j = pitDist.FindIndex((d) => d >= lim); if (j < 0) continue; PitStrip(M("rl_ground_line_paint"), S, W, P, pitE + j, 1, ps, (q) => laneOff(j) - HW, (q) => laneOff(j) + pitOut[j], 0.009f); }
                // the pit wall where there's room for one, with a debris fence on it
                foreach (var run in Runs(pitL + 1, (j) => pitBar[j], false))
                {
                    var g = M("rl_concrete"); var f = M("rl_fence");
                    for (int j = run.x; j <= run.y; j++)
                    {
                        int i = W(pitE + j); float o1 = ps * (laneOff(j) - HW - PITWALL), o2 = ps * (laneOff(j) - HW);
                        AddProfile(g, P(i, o1), P(i, o2), j == run.x);
                        AddFence(f, P(i, ps * (laneOff(j) - HW - PITWALL / 2)), 1.0f, 3.5f, dist[i], j == run.x);
                    }
                }
                // the outer wall: garages along the middle, a concrete wall elsewhere
                {
                    var g = M("rl_concrete");
                    for (int j = 0; j <= pitL; j++) { int i = W(pitE + j); float o = ps * (laneOff(j) + pitOut[j]); AddProfile(g, P(i, o), P(i, o + ps * 0.5f), j == 0); }
                    var gb = M("rl_garage"); var gd = M("rl_garage_door");
                    for (int gi = 0; gi < ng && gA + gi * gl < gB; gi++)
                    {
                        int ja = Mathf.RoundToInt(gA + gi * gl), jb = Mathf.Min(gB, Mathf.RoundToInt(gA + (gi + 1) * gl));
                        int ia = W(pitE + ja), ib = W(pitE + jb);
                        float oa = ps * (laneOff(ja) + pitOut[ja] + 0.5f), ob = ps * (laneOff(jb) + pitOut[jb] + 0.5f);
                        Building(gb, gd, P(ia, oa), P(ib, ob), left[ia] * ps, 15f, 7.5f);
                    }
                }
            }

            // ---- 10. trees, away from everything ----
            {
                var rnd = new System.Random(7); Vector3 mn = S[0].p, mx = S[0].p;
                foreach (var sm in S) { mn = Vector3.Min(mn, sm.p); mx = Vector3.Max(mx, sm.p); }
                R.min = mn; R.max = mx;
                for (int a = 0; a < 9000 && R.trees.Count < 1800; a++)
                {
                    Vector3 q = new Vector3(Mathf.Lerp(mn.x - 250, mx.x + 250, (float)rnd.NextDouble()), 0, Mathf.Lerp(mn.z - 250, mx.z + 250, (float)rnd.NextDouble()));
                    int j = Nearest(grid, S, q, N); if (j < 0) continue;
                    float d = Dist(q, S[j].p), clear = Mathf.Max(S[j].face[0], S[j].face[1]) + 12;
                    if (d < clear || d > 260) continue;
                    if (pitPts.Count > 0) { bool nearPit = false; for (int pq = 0; pq < pitPts.Count; pq += 10) if (Dist(q, pitPts[pq]) < 45) { nearPit = true; break; } if (nearPit) continue; }
                    q.y = S[j].p.y - 0.3f - Mathf.Min(20, (d - clear) * 0.03f);
                    R.trees.Add(q);
                }
            }

            // ---- 11. the track data the game runs on ----
            var TD = new TrackInfo.Data { slug = Slug(name), name = name, half = half, len = lapLen, n = N, street = false, carEyeZ = 0.15f, wheelRadius = 0.352f };
            TD.x = new float[N]; TD.y = new float[N]; TD.z = new float[N]; TD.wallL = new float[N]; TD.wallR = new float[N];
            TD.edgeL = new float[N]; TD.edgeR = new float[N]; TD.outL = new float[N]; TD.outR = new float[N]; TD.tecL = new int[N]; TD.tecR = new int[N]; TD.wallYL = new float[N]; TD.wallYR = new float[N];
            for (int i = 0; i < N; i++)
            {
                var sm = S[i]; TD.x[i] = sm.p.x; TD.y[i] = sm.p.y; TD.z[i] = sm.p.z;
                TD.wallL[i] = sm.face[0]; TD.wallR[i] = sm.face[1];
                TD.edgeL[i] = Y(i, sm.half + 0.5f); TD.edgeR[i] = Y(i, -sm.half - 0.5f); TD.outL[i] = Y(i, sm.face[0] + 2); TD.outR[i] = Y(i, -sm.face[1] - 2);
                TD.wallYL[i] = Y(i, sm.face[0]); TD.wallYR[i] = Y(i, -sm.face[1]); TD.tecL[i] = sm.rows[0]; TD.tecR[i] = sm.rows[1];
            }
            // corners: one per corner piece, at its tightest point
            var corners = new List<TrackInfo.Corner>(); int cn = 0;
            for (int pi = 0; pi < pieces.Count; pi++)
            {
                if (pieces[pi].kind == PieceKind.Straight || pieces[pi].name == "Straight" || pieces[pi].name == "Kink") continue;
                int best = -1; float bk = 0; for (int i = 0; i < N; i++) if (S[i].piece == pi && Mathf.Abs(S[i].k) > bk) { bk = Mathf.Abs(S[i].k); best = i; }
                if (best < 0 || bk < 1 / 500f) continue;
                corners.Add(new TrackInfo.Corner { n = ++cn, name = string.IsNullOrEmpty(pieces[pi].name) || pieces[pi].name == "Corner" ? "Turn " + cn : pieces[pi].name, i = best });
            }
            TD.corners = corners.ToArray();
            // the barriers' faces, for the collision boxes (Tecpro's is the concrete behind it)
            var walls = new List<TrackInfo.WallRun>();
            for (int k = 0; k < 2; k++)
            {
                int kk = k; float s = k == 0 ? 1 : -1;
                foreach (var run in Runs(N, (i) => S[i].bar[kk] != BarrierType.None))
                {
                    var w = new TrackInfo.WallRun { name = k == 0 ? "RL_Wall_L" : "RL_Wall_R", thick = 0.8f }; var lx = new List<float>(); var ly = new List<float>(); var lz = new List<float>(); var ox = new List<float>(); var oz = new List<float>();
                    for (int q = run.x; q <= run.y + 1; q++)
                    {
                        int i = W(q); float o = S[i].face[kk] + (S[i].bar[kk] == BarrierType.Tecpro ? TecCrush(S[i].rows[kk]) : 0);
                        Vector3 c = P(i, s * o); lx.Add(c.x); ly.Add(c.y); lz.Add(c.z); ox.Add(left[i].x * s); oz.Add(left[i].z * s);
                    }
                    w.x = lx.ToArray(); w.y = ly.ToArray(); w.z = lz.ToArray(); w.ox = ox.ToArray(); w.oz = oz.ToArray(); walls.Add(w);
                }
            }
            if (pitE >= 0)
            {
                // the pit wall (its lane side, facing the track behind it) and the outer wall
                var pw = new TrackInfo.WallRun { name = "RL_PitWall", thick = PITWALL }; var ow = new TrackInfo.WallRun { name = "RL_PitOuter", thick = 0.8f };
                var a = new List<float>[5]; var b = new List<float>[5]; for (int q = 0; q < 5; q++) { a[q] = new List<float>(); b[q] = new List<float>(); }
                Action<TrackInfo.WallRun, List<float>[]> flush = (wr, l) => { if (l[0].Count > 1) { var c = new TrackInfo.WallRun { name = wr.name, thick = wr.thick, x = l[0].ToArray(), y = l[1].ToArray(), z = l[2].ToArray(), ox = l[3].ToArray(), oz = l[4].ToArray() }; walls.Add(c); } for (int q = 0; q < 5; q++) l[q].Clear(); };
                for (int j = 0; j <= pitL; j++)
                {
                    int i = W(pitE + j);
                    if (pitBar[j]) { Vector3 c = P(i, ps * (laneOff(j) - HW)); a[0].Add(c.x); a[1].Add(c.y); a[2].Add(c.z); a[3].Add(-left[i].x * ps); a[4].Add(-left[i].z * ps); } else flush(pw, a);
                    Vector3 e = P(i, ps * (laneOff(j) + pitOut[j])); b[0].Add(e.x); b[1].Add(e.y); b[2].Add(e.z); b[3].Add(left[i].x * ps); b[4].Add(left[i].z * ps);
                }
                flush(pw, a); flush(ow, b);
                TD.hasPit = true; TD.pitLimitFrom = limFrom; TD.pitLimitTo = limTo;
                int np = (pitPts.Count + 1) / 2; TD.pitX = new float[np]; TD.pitY = new float[np]; TD.pitZ = new float[np]; TD.pitDist = new float[np]; TD.pitWallL = new float[np]; TD.pitWallR = new float[np];
                for (int q = 0; q < np; q++)
                {
                    int j = q * 2; TD.pitX[q] = pitPts[j].x; TD.pitY[q] = pitPts[j].y; TD.pitZ[q] = pitPts[j].z; TD.pitDist[q] = pitDist[j];
                    float toTrack = pitBar[j] ? HW : 40, away = pitOut[j];
                    // (the pit lane's own left and right, as the driver sees them)
                    if (ps < 0) { TD.pitWallL[q] = toTrack; TD.pitWallR[q] = away; } else { TD.pitWallL[q] = away; TD.pitWallR[q] = toTrack; }
                }
            }
            TD.walls = walls.ToArray();
            R.data = TD;
            // ground faces up; everything else (walls, garages, posts) gets a back too, so it's solid from both sides
            foreach (var g in meshes.Values)
            {
                if (g.mat.StartsWith("rl_ground_")) FaceUp(g);
                else if (g.mat != "rl_fence") TwoSided(g);
                g.doubleSided = g.mat == "rl_fence";
                R.meshes.Add(g);
            }
            R.log += N + " m, " + corners.Count + " corners" + (pitE >= 0 ? ", pit lane " + Mathf.RoundToInt(pitDist[pitDist.Count - 1]) + " m" : "") + ".";
            return R;
        }

        // ---- the ground beside the track, for the terrain: a height per square of a res × res grid ----
        public static float[,] Heights(GenResult r, int res, float margin, out Vector3 origin, out Vector3 size)
        {
            var d = r.data; int N = d.n;
            Vector3 mn = new Vector3(float.MaxValue, float.MaxValue, float.MaxValue), mx = -mn;
            for (int i = 0; i < N; i++) { var p = new Vector3(d.x[i], d.y[i], d.z[i]); mn = Vector3.Min(mn, p); mx = Vector3.Max(mx, p); }
            float ext = Mathf.Max(mx.x - mn.x, mx.z - mn.z) + 2 * margin;
            float bottom = mn.y - 30, top = mx.y + 10;
            origin = new Vector3((mn.x + mx.x) / 2 - ext / 2, bottom, (mn.z + mx.z) / 2 - ext / 2); size = new Vector3(ext, top - bottom, ext);
            var grid = new Dictionary<long, List<int>>();
            for (int i = 0; i < N; i++) { long key = Key(new Vector3(d.x[i], 0, d.z[i]), 25); List<int> l; if (!grid.TryGetValue(key, out l)) grid[key] = l = new List<int>(); l.Add(i); }
            // away from the track: a smooth surface through the track's heights (inverse-distance weighted, on a coarse grid)
            const int CR = 65; var coarse = new float[CR, CR]; float cc = ext / (CR - 1);
            for (int zi = 0; zi < CR; zi++)
                for (int xi = 0; xi < CR; xi++)
                {
                    float qx = origin.x + xi * cc, qz = origin.z + zi * cc, sw = 0, sh = 0;
                    for (int i = 0; i < N; i += 10) { float w = 1f / (Sq(d.x[i] - qx) + Sq(d.z[i] - qz) + 2500f); sw += w; sh += w * d.y[i]; }
                    coarse[zi, xi] = sh / sw;
                }
            var h = new float[res, res]; float cell = ext / (res - 1);
            for (int zi = 0; zi < res; zi++)
                for (int xi = 0; xi < res; xi++)
                {
                    var q = new Vector3(origin.x + xi * cell, 0, origin.z + zi * cell);
                    int best = -1; float bd = float.MaxValue;
                    for (int ring = 0; ring <= 6 && (best < 0 || ring * 25 < Mathf.Sqrt(bd) + 25); ring++)
                        foreach (int i in Ring(grid, q, 25, ring)) { float dd = Sq(d.x[i] - q.x) + Sq(d.z[i] - q.z); if (dd < bd) { bd = dd; best = i; } }
                    // (the coarse surface here, bilinear)
                    float fx = (q.x - origin.x) / cc, fz = (q.z - origin.z) / cc; int x0 = Mathf.Clamp((int)fx, 0, CR - 2), z0 = Mathf.Clamp((int)fz, 0, CR - 2); float tx = fx - x0, tz = fz - z0;
                    float far = Mathf.Lerp(Mathf.Lerp(coarse[z0, x0], coarse[z0, x0 + 1], tx), Mathf.Lerp(coarse[z0 + 1, x0], coarse[z0 + 1, x0 + 1], tx), tz) - 0.5f;
                    if (best < 0) { h[zi, xi] = far; continue; }
                    float dist = Mathf.Sqrt(bd), corridor = Mathf.Max(d.wallL[best], d.wallR[best]) + 4;
                    float near = d.y[best] - 0.35f;
                    h[zi, xi] = dist <= corridor ? near : Mathf.Lerp(near, far, Sm(corridor, corridor + 90, dist));
                }
            for (int zi = 0; zi < res; zi++) for (int xi = 0; xi < res; xi++) h[zi, xi] = Mathf.Clamp01((h[zi, xi] - bottom) / size.y);
            return h;
        }

        // (Unity draws a triangle from the side where Cross(b - a, c - a) points)
        static void FaceUp(GenMesh g)
        {
            for (int t = 0; t < g.t.Count; t += 3)
            {
                Vector3 a = g.v[g.t[t]], b = g.v[g.t[t + 1]], c = g.v[g.t[t + 2]];
                Vector3 e1 = b - a, e2 = c - a; float ny = e1.z * e2.x - e1.x * e2.z;
                if (ny < 0) { int q = g.t[t + 1]; g.t[t + 1] = g.t[t + 2]; g.t[t + 2] = q; }
            }
        }
        static void TwoSided(GenMesh g)
        {
            int n = g.v.Count, nt = g.t.Count;
            for (int i = 0; i < n; i++) { g.v.Add(g.v[i]); g.uv.Add(g.uv[i]); }
            for (int t = 0; t < nt; t += 3) { g.t.Add(g.t[t] + n); g.t.Add(g.t[t + 2] + n); g.t.Add(g.t[t + 1] + n); }
        }

        // ---- building blocks ----
        static float TecDepth(int rows) { return rows <= 0 ? 0 : rows * (TecproModel.Depth + 0.03f) - 0.03f; }
        static float TecCrush(int rows) { return rows <= 0 ? 0 : rows * 0.31f + (rows - 1) * 0.16f; }
        static string RunoffMat(RunoffType t) { switch (t) { case RunoffType.Asphalt: return "rl_ground_runoff"; case RunoffType.Gravel: return "rl_ground_gravel"; case RunoffType.Sand: return "rl_ground_gravel_sand"; default: return "rl_ground_grass"; } }
        static float Sm(float a, float b, float x) { if (b <= a) return x >= b ? 1 : 0; float t = Mathf.Clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
        static float Sq(float v) { return v * v; }
        static float Dist(Vector3 a, Vector3 b) { float dx = a.x - b.x, dz = a.z - b.z; return Mathf.Sqrt(dx * dx + dz * dz); }
        static void Quad(List<int> t, int a, int b, int c, int d) { t.Add(a); t.Add(c); t.Add(b); t.Add(b); t.Add(c); t.Add(d); }
        static void Scale(Sample s, int k, float f) { s.near[k] *= f; s.far[k] *= f; }
        static string Slug(string n) { var sb = new System.Text.StringBuilder(); foreach (char c in (n ?? "track").ToLowerInvariant()) sb.Append(char.IsLetterOrDigit(c) ? c : '-'); return sb.ToString().Trim('-'); }
        static long Key(Vector3 p, float cell) { long x = (long)Mathf.Floor(p.x / cell), z = (long)Mathf.Floor(p.z / cell); return x * 1000003L + z; }
        static IEnumerable<int> Near(Dictionary<long, List<int>> g, Vector3 p, float cell)
        {
            long x = (long)Mathf.Floor(p.x / cell), z = (long)Mathf.Floor(p.z / cell);
            for (long a = -1; a <= 1; a++) for (long b = -1; b <= 1; b++) { List<int> l; if (g.TryGetValue((x + a) * 1000003L + z + b, out l)) foreach (int i in l) yield return i; }
        }
        static IEnumerable<int> Ring(Dictionary<long, List<int>> g, Vector3 p, float cell, int r)
        {
            long x = (long)Mathf.Floor(p.x / cell), z = (long)Mathf.Floor(p.z / cell);
            for (long a = -r; a <= r; a++) for (long b = -r; b <= r; b++)
            {
                if (Math.Max(Math.Abs(a), Math.Abs(b)) != r) continue;
                List<int> l; if (g.TryGetValue((x + a) * 1000003L + z + b, out l)) foreach (int i in l) yield return i;
            }
        }
        static int Nearest(Dictionary<long, List<int>> g, List<Sample> S, Vector3 q, int N)
        {
            int best = -1; float bd = float.MaxValue;
            for (int r = 0; r <= 16 && (best < 0 || r * 20 < Mathf.Sqrt(bd) + 20); r++)
                foreach (int i in Ring(g, q, 20, r)) { float d = Sq(S[i].p.x - q.x) + Sq(S[i].p.z - q.z); if (d < bd) { bd = d; best = i; } }
            return best;
        }

        delegate float Get(Sample s); delegate void Set(Sample s, float v);
        static void Smooth(List<Sample> S, int N, Get get, Set set, int win, int passes)
        {
            var a = new float[N];
            for (int p = 0; p < passes; p++)
            {
                for (int i = 0; i < N; i++) a[i] = get(S[i]);
                // (a running sum round the lap)
                float sum = 0; for (int d = -win; d <= win; d++) sum += a[((d % N) + N) % N];
                for (int i = 0; i < N; i++) { set(S[i], sum / (2 * win + 1)); sum += a[(i + win + 1) % N] - a[((i - win) % N + N) % N]; }
            }
        }
        // the narrowest total run-off nearby, so a squeeze isn't smoothed away into the obstacle
        static void MinFilter(List<Sample> S, int N, Get total, int k, int win)
        {
            var t = new float[N]; for (int i = 0; i < N; i++) t[i] = total(S[i]);
            for (int i = 0; i < N; i++)
            {
                float m = t[i]; for (int d = -win; d <= win; d++) m = Mathf.Min(m, t[((i + d) % N + N) % N]);
                if (m < t[i] - 0.01f && t[i] > 0) Scale(S[i], k, m / t[i]);
            }
        }
        static List<Vector2Int> Runs(int N, Func<int, bool> on, bool loop = true)
        {
            var list = new List<Vector2Int>(); int start = 0;
            if (loop) { while (start < N && on(start)) start++; if (start >= N) { list.Add(new Vector2Int(0, N - 1)); return list; } }
            int a = -1, end = loop ? start + N : N;
            for (int q = start; q <= end; q++)
            {
                bool v = q < end && on(((q % N) + N) % N);
                if (v && a < 0) a = q;
                if (!v && a >= 0) { list.Add(new Vector2Int(a, q - 1)); a = -1; }
            }
            return list;
        }

        // a wall's cross-section (face, top, back) along a run
        static void Wall(GenMesh g, List<Sample> S, Func<int, int> W, Func<int, float, Vector3> P, Vector3[] left, int a, int b, int k, Func<int, float> face, float h, float thick)
        {
            float s = k == 0 ? 1 : -1;
            for (int q = a; q <= b + 1; q++)
            {
                int i = W(q); float o = face(i);
                Vector3 f = P(i, s * o), bk = P(i, s * (o + thick));
                int v0 = g.v.Count;
                g.v.Add(f + Vector3.down * 0.3f); g.v.Add(f + Vector3.up * h); g.v.Add(bk + Vector3.up * h); g.v.Add(bk + Vector3.down * 0.3f);
                float u = q; g.uv.Add(new Vector2(u / 3, 0)); g.uv.Add(new Vector2(u / 3, h / 3)); g.uv.Add(new Vector2(u / 3, (h + thick) / 3)); g.uv.Add(new Vector2(u / 3, (2 * h + thick) / 3));
                if (q > a) { int p0 = v0 - 4; for (int e = 0; e < 3; e++) Quad(g.t, p0 + e, p0 + e + 1, v0 + e, v0 + e + 1); }
            }
        }
        static void AddProfile(GenMesh g, Vector3 f, Vector3 bk, bool first)
        {
            int v0 = g.v.Count; float h = 1.0f;
            g.v.Add(f + Vector3.down * 0.3f); g.v.Add(f + Vector3.up * h); g.v.Add(bk + Vector3.up * h); g.v.Add(bk + Vector3.down * 0.3f);
            for (int e = 0; e < 4; e++) g.uv.Add(new Vector2(v0 * 0.1f, e * 0.3f));
            if (!first) { int p0 = v0 - 4; for (int e = 0; e < 3; e++) Quad(g.t, p0 + e, p0 + e + 1, v0 + e, v0 + e + 1); }
        }
        static void Armco(GenMesh rails, GenMesh posts, List<Sample> S, Func<int, int> W, Func<int, float, Vector3> P, Vector3[] left, float[] dist, int a, int b, int k, Func<int, float> face)
        {
            float s = k == 0 ? 1 : -1;
            foreach (var hh in new[] { new Vector2(0.42f, 0.74f) })
                for (int q = a; q <= b + 1; q++)
                {
                    int i = W(q); Vector3 f = P(i, s * face(i)); int v0 = rails.v.Count;
                    rails.v.Add(f + Vector3.up * hh.x); rails.v.Add(f + Vector3.up * hh.y);
                    rails.uv.Add(new Vector2(q / 4f, 0)); rails.uv.Add(new Vector2(q / 4f, 1));
                    if (q > a) Quad(rails.t, v0 - 2, v0 - 1, v0, v0 + 1);
                }
            for (int q = a; q <= b; q += 4) { int i = W(q); Vector3 f = P(i, s * (face(i) + 0.12f)); Block(posts, f + Vector3.up * 0.35f, new Vector3(0.1f, 0.85f, 0.1f)); }
        }
        static void Fence(GenMesh mesh, GenMesh posts, List<Sample> S, Func<int, int> W, Func<int, float, Vector3> P, Vector3[] left, float[] dist, int a, int b, int k, Func<int, float> off, Func<int, float> baseH)
        {
            float s = k == 0 ? 1 : -1;
            for (int q = a; q <= b + 1; q++)
            {
                int i = W(q); Vector3 f = P(i, s * off(i)); float h0 = baseH(i);
                AddFence(mesh, f, h0, 4.2f, dist[i] + q * 0.0001f, q == a);
                if ((q - a) % 4 == 0) Block(posts, f + Vector3.up * (h0 + 4.2f) / 2, new Vector3(0.08f, 4.2f - h0 + 0.2f, 0.08f));
            }
        }
        static void AddFence(GenMesh g, Vector3 f, float h0, float h1, float d, bool first)
        {
            int v0 = g.v.Count; g.v.Add(f + Vector3.up * h0); g.v.Add(f + Vector3.up * h1);
            g.uv.Add(new Vector2(v0 * 0.5f / 0.15f / 2, h0 / 0.15f)); g.uv.Add(new Vector2(v0 * 0.5f / 0.15f / 2, h1 / 0.15f));
            if (!first) Quad(g.t, v0 - 2, v0 - 1, v0, v0 + 1);
        }
        static void Block(GenMesh g, Vector3 c, Vector3 size)
        {
            Vector3 h = size / 2; int v0 = g.v.Count;
            for (int i = 0; i < 8; i++) { g.v.Add(c + new Vector3((i & 1) == 0 ? -h.x : h.x, (i & 2) == 0 ? -h.y : h.y, (i & 4) == 0 ? -h.z : h.z)); g.uv.Add(new Vector2(i & 1, (i >> 1) & 1)); }
            int[] f = { 0, 2, 1, 3, 4, 5, 6, 7, 0, 1, 4, 5, 2, 6, 3, 7, 0, 4, 2, 6, 1, 3, 5, 7 };
            for (int q = 0; q < 24; q += 4) Quad(g.t, v0 + f[q], v0 + f[q + 1], v0 + f[q + 2], v0 + f[q + 3]);
        }
        // a strip along the pit lane: offsets (from the track's centre line, on the pit's side) as functions of metres along it
        static void PitStrip(GenMesh g, List<Sample> S, Func<int, int> W, Func<int, float, Vector3> P, int start, int len, float ps, Func<int, float> oA, Func<int, float> oB, float lift)
        {
            int v0 = g.v.Count;
            for (int j = 0; j <= len; j++)
            {
                int i = W(start + j); g.v.Add(P(i, ps * oA(j)) + Vector3.up * lift); g.v.Add(P(i, ps * oB(j)) + Vector3.up * lift);
                g.uv.Add(new Vector2(oA(j) / 8, j / 8f)); g.uv.Add(new Vector2(oB(j) / 8, j / 8f));
                if (j > 0) Quad(g.t, v0 + 2 * j - 2, v0 + 2 * j - 1, v0 + 2 * j, v0 + 2 * j + 1);
            }
        }
        // a garage block: its front on the pit lane (a to b), going back `depth`, `h` tall, with a dark door
        static void Building(GenMesh walls, GenMesh doors, Vector3 a, Vector3 b, Vector3 back, float depth, float h)
        {
            Vector3 c = (a + b) / 2 + back * (depth / 2); Vector3 along = b - a; along.y = 0; float L = along.magnitude; if (L < 0.5f) return; along /= L;
            Vector3 up = Vector3.up, A = a + back * depth, B = b + back * depth; int v0 = walls.v.Count;
            Vector3[] pts = { a, b, B, A }; float y0 = Mathf.Min(a.y, b.y) - 0.3f;
            for (int i = 0; i < 4; i++) { var p = pts[i]; walls.v.Add(new Vector3(p.x, y0, p.z)); walls.v.Add(new Vector3(p.x, y0 + h + 0.3f, p.z)); walls.uv.Add(new Vector2(i, 0)); walls.uv.Add(new Vector2(i, 1)); }
            for (int i = 0; i < 4; i++) { int p0 = v0 + 2 * i, p1 = v0 + 2 * ((i + 1) % 4); Quad(walls.t, p0, p0 + 1, p1, p1 + 1); }
            int r = walls.v.Count; foreach (var p in pts) { walls.v.Add(new Vector3(p.x, y0 + h + 0.3f, p.z)); walls.uv.Add(Vector2.zero); }
            walls.t.Add(r); walls.t.Add(r + 1); walls.t.Add(r + 2); walls.t.Add(r); walls.t.Add(r + 2); walls.t.Add(r + 3);
            // the door: a dark opening on the front, a little in front of it
            Vector3 m = (a + b) / 2 - back * 0.03f; float dw = Mathf.Min(L - 2, 8) / 2; int d0 = doors.v.Count;
            doors.v.Add(new Vector3(m.x, y0 + 0.3f, m.z) - along * dw); doors.v.Add(new Vector3(m.x, y0 + 0.3f, m.z) + along * dw);
            doors.v.Add(new Vector3(m.x, y0 + 5f, m.z) - along * dw); doors.v.Add(new Vector3(m.x, y0 + 5f, m.z) + along * dw);
            for (int i = 0; i < 4; i++) doors.uv.Add(new Vector2(i & 1, i >> 1));
            Quad(doors.t, d0, d0 + 1, d0 + 2, d0 + 3);
        }

        // ---- a real track as pieces: corners where it bends (named from the track's corner list), straights between,
        // each as 5 m steps of turn and climb, so it can be stretched, tightened and edited piece by piece ----
        public static List<TrackPiece> FitPieces(float[] x3, float[] y3, float[] z3, TrackInfo.Corner[] named, float half, out Vector3 start, out float headingDeg, int pitEntry, int pitExit, out PitSetup pit, int pitSideSign)
        {
            int n = x3.Length; Func<int, int> W = (i) => ((i % n) + n) % n;
            // in this scene's terms (x mirrored, as the circuit model is imported)
            var th = new float[n];
            for (int i = 0; i < n; i++) th[i] = Mathf.Atan2(-(x3[W(i + 2)] - x3[W(i - 2)]), z3[W(i + 2)] - z3[W(i - 2)]);
            var turn = new float[n]; // + = left, per metre
            for (int i = 0; i < n; i++) { float d = th[W(i + 1)] - th[i]; while (d > Mathf.PI) d -= 2 * Mathf.PI; while (d < -Mathf.PI) d += 2 * Mathf.PI; turn[i] = -d; }
            var k = new float[n]; for (int i = 0; i < n; i++) { float a = 0; for (int d = -8; d <= 8; d++) a += turn[W(i + d)]; k[i] = a / 17; }
            // bends: where it turns tighter than a 450 m radius
            var bend = new bool[n]; for (int i = 0; i < n; i++) bend[i] = Mathf.Abs(k[i]) > 1 / 450f;
            // (bridge short gaps, drop tiny bends)
            for (int pass = 0; pass < 2; pass++)
            {
                bool want = pass == 0;
                for (int i = 0; i < n;) { int e = i; while (e < n && bend[e] == bend[i]) e++; if (bend[i] == want && e - i < (want ? 25 : 20) && i > 0 && e < n) for (int q = i; q < e; q++) bend[q] = !want; i = e; }
            }
            // pieces start at the start line; a bend that runs over it is split there
            var pieces = new List<TrackPiece>(); int cornerNo = 0;
            for (int i = 0; i < n;)
            {
                int e = i; while (e < n && bend[e] == bend[i]) e++;
                var pc = new TrackPiece { kind = PieceKind.Shape };
                var steps = new List<ShapeStep>();
                for (int a = i; a < e; a += 5)
                {
                    int b = Mathf.Min(e, a + 5); float t = 0; for (int q = a; q < b; q++) t += turn[q];
                    steps.Add(new ShapeStep(b - a, t * Mathf.Rad2Deg, y3[W(b)] - y3[a]));
                }
                pc.shape = steps.ToArray();
                if (bend[i])
                {
                    // its name from the corner list (the first named corner inside it)
                    string nm = null; float minR = float.MaxValue; bool leftTurn = false; float sumT = 0;
                    if (named != null) foreach (var c in named) if (c.i >= i && c.i < e) { nm = nm == null ? c.name : nm + " – " + c.name; }
                    for (int q = i; q < e; q++) { if (Mathf.Abs(k[q]) > 1e-5f) minR = Mathf.Min(minR, 1 / Mathf.Abs(k[q])); sumT += turn[q]; }
                    leftTurn = sumT > 0;
                    pc.name = nm ?? "Kink"; cornerNo++;
                    pc.SetCornerRunoff(minR, leftTurn);
                }
                else
                {
                    pc.name = "Straight";
                    pc.left = SideSetup.Make(RunoffType.Asphalt, 3, RunoffType.Grass, 7, BarrierType.Armco);
                    pc.right = SideSetup.Make(RunoffType.Asphalt, 3, RunoffType.Grass, 7, BarrierType.Armco);
                }
                pieces.Add(pc); i = e;
            }
            start = new Vector3(-x3[0], y3[0], z3[0]); headingDeg = th[0] * Mathf.Rad2Deg;
            // the pit lane alongside, between where the real one leaves and joins (not round a hairpin: it stops at the
            // first bend tighter than 60 m)
            pit = null;
            if (pitEntry >= 0 && pitExit >= 0)
            {
                int ex = pitExit; int span = W(pitExit - pitEntry);
                for (int j = 0; j <= span; j++) { int i = W(pitEntry + j); if (Mathf.Abs(k[i]) > 1 / 60f && j > span / 2) { ex = W(i - 40); break; } }
                int en = pitEntry; for (int j = span / 2; j >= 0; j--) { int i = W(pitEntry + j); if (Mathf.Abs(k[i]) > 1 / 60f) { en = W(i + 40); break; } }
                float e0 = en > n / 2 ? en - n : en, e1 = ex > n / 2 ? ex - n : ex; if (e1 < e0) e1 += n;
                pit = new PitSetup { enabled = true, side = pitSideSign > 0 ? TurnDirection.Left : TurnDirection.Right, entry = e0, exit = e1, garages = 20 };
            }
            return pieces;
        }
    }
}

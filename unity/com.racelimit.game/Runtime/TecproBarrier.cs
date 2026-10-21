using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace RaceLimit
{
    // Tecpro like the real thing (the approved style A): two or three rows of blue and white blocks (TecproModel), laid
    // like bricks and strapped together, with a printed sponsor cover over the front row (folded over its top), in front
    // of a concrete wall. A car going in is slowed hard by the
    // foam — harder the less room is left — and its sides are gripped; the rows get pushed back and squashed where it
    // went in, and stay that way. Behind them, as far back as they can be squashed, is the hard wall (the circuit's
    // rl_col_wall strip). Built from the track data when the game starts; drawn with GPU instancing, in ~120 m sections.
    [DefaultExecutionOrder(60)]
    public class TecproBarrier : MonoBehaviour
    {
        public TrackInfo track;
        public RaceCar car;
        public Texture2D bannerTexture;
        [Tooltip("Left empty, they're made when the game starts (from the colours below)")]
        public Material blueMaterial, whiteMaterial, darkMaterial, coverMaterial;
        public Color blueColour = new Color(0.18f, 0.37f, 0.68f), whiteColour = new Color(0.9f, 0.91f, 0.93f), darkColour = new Color(0.08f, 0.085f, 0.1f);
        [Tooltip("Sections further than this from the camera aren't drawn (m)")]
        public float drawDistance = 480f;

        // how deep the barrier has been pushed in, per side (0 = the driver's left) and per metre of track
        [System.NonSerialized] public float[][] dent;
        [System.NonSerialized] public float lastImpact; // m/s the car was going into the foam at, the last time it went in
        [System.NonSerialized] public bool carInFoam;

        // (blocks end to end with 3 cm between them, rows 3 cm apart; the cover's six sponsors repeat every 20 m)
        const float ROWD = TecproModel.Depth, GAP = 0.03f, PITCH = ROWD + GAP, MODL = TecproModel.Length, ALONG = MODL + 0.03f, BANNER_LEN = 20f;
        const float CRUSH_ROW = 0.31f, CRUSH_GAP = 0.16f; // how far each row squashes (as the exported hard wall assumes)

        class Block { public int i, k, row, rows, chunk, slot; public bool white; public float s, w, yaw, twist, d; public Vector3 dir, extra; }
        class Chunk { public int k; public List<Block> blocks = new List<Block>(); public Matrix4x4[] blue, white; public int nBlue, nWhite; public Bounds bounds; public bool dirty = true; }
        class Banner { public int k; public float s; public int[] idx; public Mesh mesh, fold; public List<Vector3> v = new List<Vector3>(), fv = new List<Vector3>(); public bool dirty; }

        float[][] crush; int[][] rows; float[][] wallY;
        readonly List<Block> blocks = new List<Block>();
        readonly List<Chunk> chunks = new List<Chunk>();
        readonly List<Banner> banners = new List<Banner>();
        Mesh moduleMesh;
        Material blueMat, whiteMat, darkMat, coverMat, foldMat;
        BoxCollider carBox;
        int carIdx = -1;
        bool ready;

        void Start()
        {
            if (track == null) track = FindAnyObjectByType<TrackInfo>();
            if (car == null) car = FindAnyObjectByType<RaceCar>();
            if (track == null || !track.Load() || track.data.tecL == null || track.data.tecL.Length != track.N)
            {
                Debug.LogWarning("RaceLimit: no Tecpro data in this circuit's .track.json (re-export it), so its Tecpro isn't drawn");
                return;
            }
            if (car != null) carBox = car.GetComponent<BoxCollider>();
            Build();
            ready = true;
        }

        public static Material Mat(Color c, float smooth)
        {
            var sh = Shader.Find("Universal Render Pipeline/Lit"); if (sh == null) sh = Shader.Find("Standard");
            var m = new Material(sh) { enableInstancing = true, color = c };
            m.SetFloat("_Smoothness", smooth); m.SetFloat("_Glossiness", smooth);
            return m;
        }

        public static Material BannerMat(Texture2D tex)
        {
            var m = Mat(Color.white, 0.25f); if (tex != null) m.mainTexture = tex;
            m.SetFloat("_Cull", 0f); m.doubleSidedGI = true; // (seen from either side)
            return m;
        }

        void Build()
        {
            int n = track.N; var d = track.data;
            rows = new[] { d.tecL, d.tecR };
            wallY = new[] { d.wallYL ?? d.y, d.wallYR ?? d.y };
            dent = new[] { new float[n], new float[n] }; crush = new[] { new float[n], new float[n] };
            for (int k = 0; k < 2; k++) for (int i = 0; i < n; i++) crush[k][i] = rows[k][i] > 0 ? rows[k][i] * CRUSH_ROW + (rows[k][i] - 1) * CRUSH_GAP : 0;
            moduleMesh = TecproModel.Module();
            blueMat = blueMaterial != null ? blueMaterial : Mat(blueColour, 0.4f); whiteMat = whiteMaterial != null ? whiteMaterial : Mat(whiteColour, 0.4f);
            darkMat = darkMaterial != null ? darkMaterial : Mat(darkColour, 0.3f);
            coverMat = coverMaterial != null ? coverMaterial : BannerMat(bannerTexture);
            foreach (var m in new[] { blueMat, whiteMat, darkMat, coverMat }) m.enableInstancing = true;
            foldMat = new Material(darkMat); foldMat.SetFloat("_Cull", 0f); // (the cover's top, seen from above or below)

            for (int k = 0; k < 2; k++)
            {
                float s = k == 0 ? 1 : -1;
                foreach (var run in Runs(k))
                {
                    // the modules, evenly along the barrier itself (round the outside of a hairpin it's much longer than the
                    // centre line), end to end with a small gap
                    var pts = new List<Vector3>(); var ids = new List<int>();
                    for (int q = run.x; q <= run.y; q++) { int i = track.Wrap(q); ids.Add(i); pts.Add(Face(k, i, 0)); }
                    // (each row laid separately, the odd ones half a block along: like bricks)
                    for (int row = 0; row < 3; row++)
                    {
                        int seg = 0, nBlk = 0; float acc = 0;
                        for (float target = MODL / 2 + (row % 2) * ALONG / 2; ; target += ALONG, nBlk++)
                        {
                            while (seg < pts.Count - 1) { float sl = Flat(pts[seg + 1] - pts[seg]).magnitude; if (acc + sl >= target) break; acc += sl; seg++; }
                            if (seg >= pts.Count - 1) break;
                            Vector3 p0 = pts[seg], p1 = pts[seg + 1]; float L = Flat(p1 - p0).magnitude; if (L < 1e-4f) L = 1e-4f;
                            float f = (target - acc) / L; int i = f < 0.5f ? ids[seg] : ids[seg + 1];
                            int nr = rows[k][i] > 0 ? rows[k][i] : 2; if (row >= nr) continue;
                            Vector3 at = Vector3.Lerp(p0, p1, f), dir = Flat(p1 - p0).normalized;
                            float h = Mathf.Abs(Mathf.Sin(track.dist[i] * 12.9898f + row * 78.233f) * 43758.5453f) % 1f;
                            blocks.Add(new Block { i = i, k = k, s = s, row = row, rows = nr, white = ((nBlk + row) & 1) == 1, w = Wall(k, i), dir = dir, extra = Flat(at - Face(k, i, 0)), d = track.dist[i], twist = 0, yaw = (h - 0.5f) * 0.015f });
                        }
                    }
                    // the cover over the front row, and its top folded over
                    var bn = new Banner { k = k, s = s, idx = ids.ToArray(), mesh = new Mesh { name = "RL_TecproCover" }, fold = new Mesh { name = "RL_TecproCoverTop" } };
                    bn.mesh.MarkDynamic(); bn.fold.MarkDynamic();
                    var uv = new List<Vector2>(); var tri = new List<int>(); float along = 0;
                    for (int q = 0; q < ids.Count; q++)
                    {
                        if (q > 0) along += Flat(pts[q] - pts[q - 1]).magnitude;
                        float u = (s > 0 ? along : -along) / BANNER_LEN; // (flipped on the right so the words read the right way round)
                        uv.Add(new Vector2(u, 0.02f)); uv.Add(new Vector2(u, 0.98f));
                        if (q > 0) { int b = 2 * (q - 1); tri.Add(b); tri.Add(b + 2); tri.Add(b + 1); tri.Add(b + 1); tri.Add(b + 2); tri.Add(b + 3); }
                    }
                    BannerVerts(bn);
                    bn.mesh.SetVertices(bn.v); bn.mesh.SetUVs(0, uv); bn.mesh.SetTriangles(tri, 0); bn.mesh.RecalculateNormals(); bn.mesh.RecalculateBounds();
                    bn.fold.SetVertices(bn.fv); bn.fold.SetTriangles(tri, 0); bn.fold.RecalculateNormals(); bn.fold.RecalculateBounds();
                    banners.Add(bn);
                }
            }
            // sections of ~120 m (and at most 500 modules) per side
            var byKey = new Dictionary<long, int>();
            foreach (var bl in blocks)
            {
                long key = bl.k * 1000000L + Mathf.FloorToInt(bl.d / 120f) * 10L; int ci;
                while (byKey.TryGetValue(key, out ci) && chunks[ci].blocks.Count >= 500) key++;
                if (!byKey.TryGetValue(key, out ci)) { ci = chunks.Count; chunks.Add(new Chunk { k = bl.k }); byKey[key] = ci; }
                var ch = chunks[ci]; bl.chunk = ci;
                ch.blocks.Add(bl); bl.slot = bl.white ? ch.nWhite++ : ch.nBlue++;
            }
            foreach (var ch in chunks) { ch.blue = new Matrix4x4[Mathf.Max(1, ch.nBlue)]; ch.white = new Matrix4x4[Mathf.Max(1, ch.nWhite)]; }
            Debug.Log("RaceLimit: " + blocks.Count + " Tecpro blocks in " + chunks.Count + " sections");
        }

        // runs of track (index from..to, may run past the end of the lap) with Tecpro on side k
        List<Vector2Int> Runs(int k)
        {
            var list = new List<Vector2Int>(); int n = track.N, start = 0;
            while (start < n && rows[k][start] > 0) start++;
            if (start >= n) { list.Add(new Vector2Int(0, n)); return list; }
            int a = -1;
            for (int q = start; q <= start + n; q++)
            {
                bool on = q < start + n && rows[k][track.Wrap(q)] > 0;
                if (on && a < 0) a = q;
                if (!on && a >= 0) { if (q - 1 - a >= 2) list.Add(new Vector2Int(a, q - 1)); a = -1; }
            }
            return list;
        }

        static Vector3 Flat(Vector3 v) { v.y = 0; return v; }
        float Wall(int k, int i) { return k == 0 ? track.data.wallL[i] : track.data.wallR[i]; }
        Vector3 Face(int k, int i, float extra) { float s = k == 0 ? 1 : -1; return track.Beside(i, s * (Wall(k, i) + extra), wallY[k][i]); }

        float Squash(int rowsHere, float D) { float T0 = rowsHere * PITCH - GAP; return Mathf.Max(0.25f, (T0 - D) / T0); }

        void BannerVerts(Banner bn)
        {
            bn.v.Clear(); bn.fv.Clear(); var dk = dent[bn.k];
            foreach (int i in bn.idx)
            {
                float D = dk[i], sq = Squash(rows[bn.k][i] > 0 ? rows[bn.k][i] : 2, D);
                Vector3 p = Face(bn.k, i, D - 0.05f), back = Face(bn.k, i, D + 0.24f * sq);
                bn.v.Add(p + Vector3.up * 0.04f); bn.v.Add(p + Vector3.up * (TecproModel.Height + 0.02f));
                bn.fv.Add(p + Vector3.up * (TecproModel.Height + 0.02f)); bn.fv.Add(back + Vector3.up * (TecproModel.Height + 0.07f));
            }
        }

        // where a module sits: the rows between the dent and the concrete are squashed evenly, so the front face is exactly
        // where the barrier now is; hit modules are also knocked a bit crooked
        void Pose(Block bl, Chunk ch)
        {
            int n = track.N, i = bl.i; var dk = dent[bl.k];
            float D = Mathf.Max(dk[i], Mathf.Max(dk[(i + n - 1) % n], dk[(i + 1) % n]));
            float sq = Squash(bl.rows, D);
            float o = bl.s * (bl.w + D + bl.row * PITCH * sq + ROWD * sq / 2);
            Vector3 p = track.Beside(i, o, wallY[bl.k][i]) + bl.extra;
            Quaternion q = Quaternion.LookRotation(bl.dir, Vector3.up) * Quaternion.Euler(0, (bl.yaw + bl.twist * Mathf.Min(1, D / 0.4f)) * Mathf.Rad2Deg, 0);
            // (squashed blocks also sag a little)
            var m = Matrix4x4.TRS(p, q, new Vector3(sq, 1 - 0.08f * (1 - sq), 1));
            if (bl.white) ch.white[bl.slot] = m; else ch.blue[bl.slot] = m;
        }

        void FixedUpdate()
        {
            if (!ready || car == null || car.body == null) return;
            // ---- the car going into the foam ----
            var body = car.body; float dt = Time.fixedDeltaTime;
            Vector3 p = car.transform.position;
            carIdx = track.Nearest(p, carIdx, carIdx < 0 ? 60 : 12);
            int i = carIdx; float lat = track.Lateral(p, i); int k = lat >= 0 ? 0 : 1;
            bool was = carInFoam; carInFoam = false;
            if (rows[k][i] == 0) return;
            // how far the car's outline reaches towards the barrier (its body box's corners)
            Vector3 nOut = track.left[i] * (k == 0 ? 1 : -1);
            float reach = 1.0f;
            if (carBox != null)
            {
                Vector3 c = carBox.center, h = carBox.size * 0.5f; reach = 0;
                for (int sx = -1; sx <= 1; sx += 2) for (int sz = -1; sz <= 1; sz += 2)
                    reach = Mathf.Max(reach, Vector3.Dot(car.transform.TransformPoint(c + new Vector3(sx * h.x, 0, sz * h.z)) - p, nOut));
            }
            float alat = Mathf.Abs(lat), wb = Wall(k, i), face = wb + dent[k][i] - reach, backW = wb + crush[k][i] - reach;
            if (alat <= face) return;
            Vector3 V = body.linearVelocity, nIn = -nOut, t = track.forward[i];
            float vn = Vector3.Dot(V, nIn), vt = Vector3.Dot(V, t);
            if (vn >= -0.4f || alat > backW + 0.05f) return;
            // pushing into the foam: it slows the car hard (more the less room is left) and grips its sides
            carInFoam = true;
            float room = Mathf.Max(0.05f, backW - alat), A = Mathf.Clamp(vn * vn / (1.6f * room), 300f, 900f), dv = Mathf.Min(-vn, A * dt);
            body.AddForce(nIn * dv - t * vt * Mathf.Min(1, dt * 1.0f), ForceMode.VelocityChange);
            body.angularVelocity *= Mathf.Max(0, 1 - dt * 6);
            if (!was) lastImpact = -vn;
            // the barrier's new face is where the car is now; neighbouring modules get dragged back too
            float dd = Mathf.Min(crush[k][i], alat + reach - wb); int n = track.N; bool moved = false;
            for (int j = -5; j <= 5; j++) { int q = (i + j + n) % n; float v = dd * Mathf.Exp(-(j / 2.6f) * (j / 2.6f)); if (v > dent[k][q]) { dent[k][q] = v; moved = true; } }
            if (!moved) return;
            float d0 = track.dist[i], len = track.length;
            foreach (var ch in chunks)
            {
                if (ch.k != k) continue;
                bool near = false;
                foreach (var bl in ch.blocks)
                {
                    float e = bl.d - d0; if (e > len / 2) e -= len; if (e < -len / 2) e += len;
                    if (Mathf.Abs(e) > 8) continue;
                    near = true;
                    // (a glancing hit drags the modules round a little in the direction the car was going)
                    float tw = Mathf.Clamp((0.05f + Mathf.Abs(vt) * 0.005f) * (((bl.d * 7.31f + bl.row * 3.7f) % 2f) < 1 ? 1 : -1), -0.28f, 0.28f);
                    if (Mathf.Abs(tw) > Mathf.Abs(bl.twist)) bl.twist = tw;
                }
                if (near) ch.dirty = true;
            }
            foreach (var bn in banners) if (bn.k == k) bn.dirty = true;
        }

        // the barrier as new again
        public void ResetAll()
        {
            if (!ready) return;
            for (int k = 0; k < 2; k++) System.Array.Clear(dent[k], 0, dent[k].Length);
            foreach (var bl in blocks) bl.twist = 0;
            foreach (var ch in chunks) ch.dirty = true;
            foreach (var bn in banners) bn.dirty = true;
        }

        void Update()
        {
            if (!ready) return;
            var cam = Camera.main; Vector3 cp = cam != null ? cam.transform.position : car != null ? car.transform.position : Vector3.zero;
            foreach (var ch in chunks)
            {
                if (ch.dirty)
                {
                    foreach (var bl in ch.blocks) Pose(bl, ch);
                    var b = new Bounds(ch.blocks[0].white ? ch.white[0].GetColumn(3) : ch.blue[0].GetColumn(3), Vector3.one);
                    for (int q = 0; q < ch.nBlue; q++) b.Encapsulate(ch.blue[q].GetColumn(3));
                    for (int q = 0; q < ch.nWhite; q++) b.Encapsulate(ch.white[q].GetColumn(3));
                    b.Expand(3f); ch.bounds = b; ch.dirty = false;
                }
                if ((ch.bounds.ClosestPoint(cp) - cp).sqrMagnitude > drawDistance * drawDistance) continue;
                var rp = new RenderParams(blueMat) { worldBounds = ch.bounds, shadowCastingMode = ShadowCastingMode.On, receiveShadows = true };
                if (ch.nBlue > 0) { Graphics.RenderMeshInstanced(rp, moduleMesh, 0, ch.blue, ch.nBlue); rp.material = darkMat; Graphics.RenderMeshInstanced(rp, moduleMesh, 1, ch.blue, ch.nBlue); }
                if (ch.nWhite > 0) { rp.material = whiteMat; Graphics.RenderMeshInstanced(rp, moduleMesh, 0, ch.white, ch.nWhite); rp.material = darkMat; Graphics.RenderMeshInstanced(rp, moduleMesh, 1, ch.white, ch.nWhite); }
            }
            foreach (var bn in banners)
            {
                if (bn.dirty)
                {
                    BannerVerts(bn); bn.mesh.SetVertices(bn.v); bn.mesh.RecalculateNormals(); bn.mesh.RecalculateBounds();
                    bn.fold.SetVertices(bn.fv); bn.fold.RecalculateNormals(); bn.fold.RecalculateBounds(); bn.dirty = false;
                }
                Graphics.RenderMesh(new RenderParams(coverMat) { receiveShadows = true, shadowCastingMode = ShadowCastingMode.On }, bn.mesh, 0, Matrix4x4.identity);
                Graphics.RenderMesh(new RenderParams(foldMat) { receiveShadows = true, shadowCastingMode = ShadowCastingMode.On }, bn.fold, 0, Matrix4x4.identity);
            }
        }
    }
}

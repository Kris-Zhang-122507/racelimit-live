using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace RaceLimit
{
    // Tecpro, as in the web game: two or three rows of plastic-and-foam modules (TecproModel) with red spacers between
    // the rows and a sponsor banner across the front, in front of a concrete wall. A car going in is slowed hard by the
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
        public Material bodyMaterial, darkMaterial, spacerMaterial, bannerMaterial;
        public Color moduleColour = new Color(0.15f, 0.16f, 0.18f), darkColour = new Color(0.05f, 0.05f, 0.06f), spacerColour = new Color(0.69f, 0.14f, 0.16f);
        [Tooltip("Sections further than this from the camera aren't drawn (m)")]
        public float drawDistance = 480f;

        // how deep the barrier has been pushed in, per side (0 = the driver's left) and per metre of track
        [System.NonSerialized] public float[][] dent;
        [System.NonSerialized] public float lastImpact; // m/s the car was going into the foam at, the last time it went in
        [System.NonSerialized] public bool carInFoam;

        const float ROWD = TecproModel.Depth, GAP = 0.16f, PITCH = ROWD + GAP, MODL = TecproModel.Length, BANNER_LEN = 42f;

        class Block { public int i, k, row, rows, chunk, slot, spSlot = -1; public float s, w, yaw, twist, d; public Vector3 dir, extra; }
        class Chunk { public int k; public List<Block> blocks = new List<Block>(); public Matrix4x4[] mods, sps; public int nSp; public Bounds bounds; public bool dirty = true; }
        class Banner { public int k; public float s; public int[] idx; public Mesh mesh; public List<Vector3> v = new List<Vector3>(); public bool dirty; }

        float[][] crush; int[][] rows; float[][] wallY;
        readonly List<Block> blocks = new List<Block>();
        readonly List<Chunk> chunks = new List<Chunk>();
        readonly List<Banner> banners = new List<Banner>();
        Mesh moduleMesh, spacerMesh;
        Material bodyMat, darkMat, spacerMat, bannerMat;
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
            for (int k = 0; k < 2; k++) for (int i = 0; i < n; i++) crush[k][i] = rows[k][i] > 0 ? rows[k][i] * ROWD * 0.62f + (rows[k][i] - 1) * GAP : 0;
            moduleMesh = TecproModel.Module(); spacerMesh = TecproModel.Spacer(GAP);
            bodyMat = bodyMaterial != null ? bodyMaterial : Mat(moduleColour, 0.35f); darkMat = darkMaterial != null ? darkMaterial : Mat(darkColour, 0.2f);
            spacerMat = spacerMaterial != null ? spacerMaterial : Mat(spacerColour, 0.4f);
            bannerMat = bannerMaterial != null ? bannerMaterial : BannerMat(bannerTexture);
            foreach (var m in new[] { bodyMat, darkMat, spacerMat, bannerMat }) m.enableInstancing = true;

            for (int k = 0; k < 2; k++)
            {
                float s = k == 0 ? 1 : -1;
                foreach (var run in Runs(k))
                {
                    // the modules, evenly along the barrier itself (round the outside of a hairpin it's much longer than the
                    // centre line), end to end with a small gap
                    var pts = new List<Vector3>(); var ids = new List<int>();
                    for (int q = run.x; q <= run.y; q++) { int i = track.Wrap(q); ids.Add(i); pts.Add(Face(k, i, 0)); }
                    int seg = 0; float acc = 0;
                    for (float target = MODL / 2; ; target += MODL + 0.04f)
                    {
                        while (seg < pts.Count - 1) { float sl = Flat(pts[seg + 1] - pts[seg]).magnitude; if (acc + sl >= target) break; acc += sl; seg++; }
                        if (seg >= pts.Count - 1) break;
                        Vector3 p0 = pts[seg], p1 = pts[seg + 1]; float L = Flat(p1 - p0).magnitude; if (L < 1e-4f) L = 1e-4f;
                        float f = (target - acc) / L; int i = f < 0.5f ? ids[seg] : ids[seg + 1];
                        Vector3 at = Vector3.Lerp(p0, p1, f), dir = Flat(p1 - p0).normalized;
                        int nr = rows[k][i] > 0 ? rows[k][i] : 2;
                        for (int row = 0; row < nr; row++)
                        {
                            float h = Mathf.Abs(Mathf.Sin(track.dist[i] * 12.9898f + row * 78.233f) * 43758.5453f) % 1f;
                            blocks.Add(new Block { i = i, k = k, s = s, row = row, rows = nr, w = Wall(k, i), dir = dir, extra = Flat(at - Face(k, i, 0)), d = track.dist[i], twist = 0, yaw = (h - 0.5f) * 0.02f });
                        }
                    }
                    // the banner across the front row
                    var bn = new Banner { k = k, s = s, idx = ids.ToArray(), mesh = new Mesh { name = "RL_TecproBanner" } };
                    bn.mesh.MarkDynamic();
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
                bl.slot = ch.blocks.Count; ch.blocks.Add(bl);
                if (bl.row > 0) bl.spSlot = ch.nSp++;
            }
            foreach (var ch in chunks) { ch.mods = new Matrix4x4[ch.blocks.Count]; ch.sps = new Matrix4x4[Mathf.Max(1, ch.nSp)]; }
            Debug.Log("RaceLimit: " + blocks.Count + " Tecpro modules in " + chunks.Count + " sections");
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

        void BannerVerts(Banner bn)
        {
            bn.v.Clear(); var dk = dent[bn.k];
            foreach (int i in bn.idx)
            {
                Vector3 p = Face(bn.k, i, dk[i] - 0.025f);
                bn.v.Add(p + Vector3.up * 0.14f); bn.v.Add(p + Vector3.up * 0.98f);
            }
        }

        // where a module sits: the rows between the dent and the concrete are squashed evenly, so the front face is exactly
        // where the barrier now is; hit modules are also knocked a bit crooked
        void Pose(Block bl, Chunk ch)
        {
            int n = track.N, i = bl.i; var dk = dent[bl.k];
            float D = Mathf.Max(dk[i], Mathf.Max(dk[(i + n - 1) % n], dk[(i + 1) % n]));
            float T0 = bl.rows * PITCH - GAP, sq = Mathf.Max(0.2f, (T0 - D) / T0);
            float o = bl.s * (bl.w + D + bl.row * PITCH * sq + ROWD * sq / 2);
            Vector3 p = track.Beside(i, o, wallY[bl.k][i]) + bl.extra;
            Quaternion q = Quaternion.LookRotation(bl.dir, Vector3.up) * Quaternion.Euler(0, (bl.yaw + bl.twist * Mathf.Min(1, D / 0.4f)) * Mathf.Rad2Deg, 0);
            ch.mods[bl.slot] = Matrix4x4.TRS(p, q, new Vector3(sq, 1, 1));
            if (bl.spSlot >= 0)
            {
                float os = bl.s * (bl.w + D + (bl.row * PITCH - GAP / 2) * sq);
                ch.sps[bl.spSlot] = Matrix4x4.TRS(track.Beside(i, os, wallY[bl.k][i]) + bl.extra, Quaternion.LookRotation(bl.dir, Vector3.up), new Vector3(sq, 1, 1));
            }
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
                    var b = new Bounds(ch.mods[0].GetColumn(3), Vector3.one);
                    for (int q = 0; q < ch.mods.Length; q++) b.Encapsulate(ch.mods[q].GetColumn(3));
                    b.Expand(3f); ch.bounds = b; ch.dirty = false;
                }
                if ((ch.bounds.ClosestPoint(cp) - cp).sqrMagnitude > drawDistance * drawDistance) continue;
                var rp = new RenderParams(bodyMat) { worldBounds = ch.bounds, shadowCastingMode = ShadowCastingMode.On, receiveShadows = true };
                Graphics.RenderMeshInstanced(rp, moduleMesh, 0, ch.mods, ch.mods.Length);
                rp.material = darkMat; Graphics.RenderMeshInstanced(rp, moduleMesh, 1, ch.mods, ch.mods.Length);
                if (ch.nSp > 0) { rp.material = spacerMat; Graphics.RenderMeshInstanced(rp, spacerMesh, 0, ch.sps, ch.nSp); }
            }
            foreach (var bn in banners)
            {
                if (bn.dirty) { BannerVerts(bn); bn.mesh.SetVertices(bn.v); bn.mesh.RecalculateNormals(); bn.mesh.RecalculateBounds(); bn.dirty = false; }
                Graphics.RenderMesh(new RenderParams(bannerMat) { receiveShadows = true, shadowCastingMode = ShadowCastingMode.On }, bn.mesh, 0, Matrix4x4.identity);
            }
        }
    }
}

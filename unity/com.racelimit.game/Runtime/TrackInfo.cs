using System;
using UnityEngine;

namespace RaceLimit
{
    // The circuit's centre line and barriers (from <slug>.track.json, exported with the circuit's .glb), turned into
    // this scene's coordinates using the four axis markers the export put in the model (RL_O, RL_X, RL_Y, RL_Z, 100 m
    // apart). Answers "where along the lap is this point", for timing, resets and the map.
    public class TrackInfo : MonoBehaviour
    {
        [Serializable]
        public class Corner { public int n; public string name; public int i; }

        [Serializable]
        public class WallRun { public string name; public float thick; public float[] x, y, z, ox, oz; } // a barrier's face, and which way is away from the road

        [Serializable]
        public class Data
        {
            public string slug, name;
            public float half, len;
            public bool street;
            public int n;
            public float[] x, y, z, wallL, wallR;
            public float[] edgeL, edgeR, outL, outR; // ground height at ±(half + 0.5) and just behind each barrier
            public int[] tecL, tecR;                 // rows of Tecpro in front of each barrier (0 = none)
            public float[] wallYL, wallYR;           // ground height at each barrier
            public Corner[] corners;
            public bool hasPit;
            public float pitLimitFrom, pitLimitTo;
            public float[] pitX, pitY, pitZ, pitDist;
            public float[] pitWallL, pitWallR;       // the pit lane's walls either side of its middle (40 = open)
            public WallRun[] walls;
            public float carEyeZ, wheelRadius;
        }

        public TextAsset trackJson;
        [Tooltip("The imported circuit model (holds the RL_O/X/Y/Z markers). Defaults to this object.")]
        public Transform model;

        [NonSerialized] public Data data;
        [NonSerialized] public Vector3[] centre;   // world positions, one per metre
        [NonSerialized] public Vector3[] forward;  // along the lap, flattened
        [NonSerialized] public Vector3[] left;     // the driver's left, flattened
        [NonSerialized] public float[] dist;       // metres from the start line
        [NonSerialized] public Vector3[] pit;      // the pit lane's middle, one per 2 m
        [NonSerialized] public float length;
        public int N { get { return centre == null ? 0 : centre.Length; } }

        Vector3 o, ex, ey, ez;
        bool ready;

        void Awake()
        {
            if (!Load()) return;
            int ground, walls; AddColliders(out ground, out walls);
            if (data.walls != null && data.walls.Length > 0) walls = BuildWalls();
            BuildSafetyGround();
            Debug.Log("RaceLimit: " + data.name + " — " + ground + " ground pieces and " + walls + " barrier pieces made solid, plus the safety ground under the track");
        }

        // Every piece of the circuit model whose material says what it is gets a collider, every time the game starts
        // (not saved in the scene, so a re-exported model can't leave the track hollow): rl_ground_<surface> → ground
        // with that surface for the tyres, rl_col_wall → an invisible barrier.
        public void AddColliders(out int ground, out int walls)
        {
            ground = walls = 0;
            var seen = new System.Collections.Generic.HashSet<string>();
            foreach (var r in model.GetComponentsInChildren<MeshRenderer>(true))
            {
                var mf = r.GetComponent<MeshFilter>(); if (mf == null || mf.sharedMesh == null) continue;
                string mn = r.sharedMaterial != null ? r.sharedMaterial.name : "";
                if (seen.Count < 40) seen.Add(mn);
                bool wall = mn.Contains("rl_col_wall"); SurfaceKind kind;
                bool isGround = !wall && RLSurface.TryParse(mn, out kind);
                if (!wall && !isGround) continue;
                if (mf.sharedMesh.name.StartsWith("Combined Mesh")) { Debug.LogWarning("RaceLimit: the circuit is static-batched, so its pieces can't be made solid (the safety ground still holds the car). Rebuild the scene with RaceLimit > Build Spa scene."); continue; }
                if (!mf.sharedMesh.isReadable) Debug.LogWarning("RaceLimit: mesh " + mf.sharedMesh.name + " isn't readable, so it can't be made solid. Select the circuit's .glb and tick Read/Write in its import settings.");
                var mc = r.GetComponent<MeshCollider>(); if (mc == null) mc = r.gameObject.AddComponent<MeshCollider>();
                mc.sharedMesh = mf.sharedMesh;
                if (wall) { r.enabled = false; mc.sharedMaterial = RLWall.Material; walls++; if (data.walls != null && data.walls.Length > 0) mc.enabled = false; continue; }
                var sf = r.GetComponent<RLSurface>(); if (sf == null) sf = r.gameObject.AddComponent<RLSurface>();
                RLSurface.TryParse(mn, out sf.kind); ground++;
            }
            if (ground == 0) Debug.LogError("RaceLimit: no ground pieces found in the circuit model. Material names seen: " + string.Join(", ", seen));
        }

        // The barriers: solid boxes standing behind each barrier's face, end to end along it (a new box every 3 m, or
        // sooner where it bends), 2.5 m tall, as thick as a wall. Solid from every side, so nothing gets through them
        // (the old wall strips were one-sided: from behind, a car went straight through).
        public int BuildWalls()
        {
            if (transform.Find("RL_Walls") != null) return 0;
            var root = new GameObject("RL_Walls").transform; root.SetParent(transform, false);
            root.position = Vector3.zero; root.rotation = Quaternion.identity; root.localScale = Vector3.one;
            int count = 0;
            foreach (var w in data.walls)
            {
                if (w.x == null || w.x.Length < 2) continue;
                int n = w.x.Length; float thick = w.thick > 0 ? w.thick : 0.8f;
                var p = new Vector3[n]; var outw = new Vector3[n];
                for (int i = 0; i < n; i++) { p[i] = Map(w.x[i], w.y[i], w.z[i]); Vector3 d = ex * w.ox[i] + ez * w.oz[i]; d.y = 0; outw[i] = d.sqrMagnitude > 1e-6f ? d.normalized : Vector3.zero; }
                int a = 0;
                while (a < n - 1)
                {
                    // as far along as stays nearly straight (and no more than 3 m)
                    int b = a + 1; Vector3 dir0 = p[b] - p[a]; dir0.y = 0;
                    while (b < n - 1)
                    {
                        Vector3 d2 = p[b + 1] - p[a]; Vector3 f2 = d2; f2.y = 0;
                        Vector3 step = p[b + 1] - p[b]; step.y = 0;
                        if (f2.magnitude > 3f || Vector3.Angle(dir0, step) > 4f || Vector3.Distance(p[b + 1], p[b]) > 3f) break;
                        b++;
                    }
                    Vector3 A = p[a], B = p[b], along = B - A;
                    if (along.sqrMagnitude > 1e-4f)
                    {
                        Vector3 ow = (outw[a] + outw[b]); ow.y = 0; if (ow.sqrMagnitude < 1e-6f) ow = Vector3.Cross(Vector3.up, along); ow.Normalize();
                        var go = new GameObject(w.name + "_" + a); go.transform.SetParent(root, false);
                        go.transform.SetPositionAndRotation((A + B) / 2 + ow * (thick / 2) + Vector3.up * 0.65f, Quaternion.LookRotation(along.normalized, Vector3.up));
                        var bc = go.AddComponent<BoxCollider>(); bc.size = new Vector3(thick, 2.5f, along.magnitude + 0.06f); bc.sharedMaterial = RLWall.Material;
                        count++;
                    }
                    a = b;
                }
            }
            return count;
        }

        // An invisible surface just under the road, from barrier to barrier all the way round (and along the pit lane),
        // built from the centre line: whatever happens to the model, the car can't fall through the world.
        public void BuildSafetyGround()
        {
            if (transform.Find("RL_SafetyGround") != null) return;
            var root = new GameObject("RL_SafetyGround").transform; root.SetParent(transform, false);
            root.position = Vector3.zero; root.rotation = Quaternion.identity; root.localScale = Vector3.one;
            int n = N;
            // (heights from the export where it has them — the camber, the run-off's slope — else the centre line's)
            bool hs = data.edgeL != null && data.edgeL.Length == n && data.outL != null && data.outL.Length == n;
            Off cy = (i) => data.y[i];
            Off eL = hs ? (Off)((i) => data.edgeL[i]) : cy, eR = hs ? (Off)((i) => data.edgeR[i]) : cy, oL = hs ? (Off)((i) => data.outL[i]) : cy, oR = hs ? (Off)((i) => data.outR[i]) : cy;
            Off c0 = (i) => 0f, tL = (i) => data.half + 0.5f, tR = (i) => -data.half - 0.5f;
            Band(root, "trackL", SurfaceKind.Track, n, c0, cy, tL, eL, 0.07f);
            Band(root, "trackR", SurfaceKind.Track, n, tR, eR, c0, cy, 0.07f);
            Band(root, "left", SurfaceKind.Runoff, n, tL, eL, (i) => Mathf.Max(data.half + 1f, data.wallL[i] + 2f), oL, 0.12f);
            Band(root, "right", SurfaceKind.Runoff, n, (i) => -Mathf.Max(data.half + 1f, data.wallR[i] + 2f), oR, tR, eR, 0.12f);
            if (pit != null && pit.Length > 2)
            {
                var v = new System.Collections.Generic.List<Vector3>(); var t = new System.Collections.Generic.List<int>();
                for (int i = 0; i < pit.Length; i++)
                {
                    Vector3 f = pit[Mathf.Min(pit.Length - 1, i + 1)] - pit[Mathf.Max(0, i - 1)]; f.y = 0; f.Normalize();
                    Vector3 l = -Vector3.Cross(Vector3.up, f);
                    v.Add(pit[i] + l * 7f - Vector3.up * 0.09f); v.Add(pit[i] - l * 7f - Vector3.up * 0.09f);
                    if (i > 0) { int b = 2 * i; t.Add(b - 2); t.Add(b); t.Add(b - 1); t.Add(b - 1); t.Add(b); t.Add(b + 1); }
                }
                Piece(root, "pit", SurfaceKind.Track, v, t);
            }
        }

        delegate float Off(int i);
        // a strip between two lines beside the centre line (sideways offset + ground height, in the export's terms)
        void Band(Transform root, string name, SurfaceKind kind, int n, Off from, Off fromY, Off to, Off toY, float below)
        {
            // in pieces of 600 m, each its own collider
            for (int a = 0; a < n; a += 600)
            {
                var v = new System.Collections.Generic.List<Vector3>(); var t = new System.Collections.Generic.List<int>();
                int b = Mathf.Min(n, a + 601);
                for (int i = a; i <= b; i++)
                {
                    int j = Wrap(i);
                    v.Add(centre[j] + left[j] * from(j) + ey * (fromY(j) - data.y[j]) - Vector3.up * below);
                    v.Add(centre[j] + left[j] * to(j) + ey * (toY(j) - data.y[j]) - Vector3.up * below);
                    if (i > a) { int q = 2 * (i - a); t.Add(q - 2); t.Add(q - 1); t.Add(q); t.Add(q - 1); t.Add(q + 1); t.Add(q); }
                }
                Piece(root, name + "_" + a, kind, v, t);
            }
        }

        static void Piece(Transform root, string name, SurfaceKind kind, System.Collections.Generic.List<Vector3> v, System.Collections.Generic.List<int> t)
        {
            var go = new GameObject(name); go.transform.SetParent(root, false);
            var m = new Mesh { name = "RL_Safety_" + name, indexFormat = UnityEngine.Rendering.IndexFormat.UInt32 };
            m.SetVertices(v); m.SetTriangles(t, 0); m.RecalculateNormals(); m.RecalculateBounds();
            go.AddComponent<MeshCollider>().sharedMesh = m;
            go.AddComponent<RLSurface>().kind = kind;
        }

        public bool Load()
        {
            if (ready) return true;
            if (trackJson == null) { Debug.LogError("RaceLimit: TrackInfo has no track .json"); return false; }
            data = JsonUtility.FromJson<Data>(trackJson.text);
            if (model == null) model = transform;
            Transform mo = Find(model, "RL_O"), mx = Find(model, "RL_X"), my = Find(model, "RL_Y"), mz = Find(model, "RL_Z");
            if (mo == null || mx == null || my == null || mz == null)
            {
                Debug.LogWarning("RaceLimit: the axis markers RL_O/X/Y/Z weren't found in the circuit model; assuming glTF axes with X mirrored");
                o = model.position; ex = model.TransformVector(-1, 0, 0); ey = model.TransformVector(0, 1, 0); ez = model.TransformVector(0, 0, 1);
            }
            else
            {
                o = mo.position; ex = (mx.position - o) / 100f; ey = (my.position - o) / 100f; ez = (mz.position - o) / 100f;
            }
            int n = data.n;
            centre = new Vector3[n]; forward = new Vector3[n]; left = new Vector3[n]; dist = new float[n];
            for (int i = 0; i < n; i++) centre[i] = Map(data.x[i], data.y[i], data.z[i]);
            for (int i = 0; i < n; i++)
            {
                Vector3 f = centre[(i + 2) % n] - centre[(i - 2 + n) % n]; f.y = 0; f.Normalize();
                forward[i] = f;
                left[i] = -Vector3.Cross(Vector3.up, f); // (Cross(up, forward) is the right in Unity)
            }
            for (int i = 1; i < n; i++) dist[i] = dist[i - 1] + Vector3.Distance(centre[i], centre[i - 1]);
            length = dist[n - 1] + Vector3.Distance(centre[0], centre[n - 1]);
            if (data.hasPit && data.pitX != null)
            {
                pit = new Vector3[data.pitX.Length];
                for (int i = 0; i < pit.Length; i++) pit[i] = Map(data.pitX[i], data.pitY[i], data.pitZ[i]);
            }
            ready = true;
            return true;
        }

        public Vector3 Map(float x, float y, float z) { return o + ex * x + ey * y + ez * z; }
        // ...and back: a point in this scene in the export's (three.js) terms
        public Vector3 Unmap(Vector3 p) { Vector3 d = p - o; return new Vector3(Vector3.Dot(d, ex) / ex.sqrMagnitude, Vector3.Dot(d, ey) / ey.sqrMagnitude, Vector3.Dot(d, ez) / ez.sqrMagnitude); }

        // a point beside centre-line sample i (lateral: + = the driver's left), at ground height groundY (the export's terms)
        public Vector3 Beside(int i, float lateral, float groundY) { return centre[i] + left[i] * lateral + ey * (groundY - data.y[i]); }

        static Transform Find(Transform t, string name)
        {
            if (t.name == name) return t;
            for (int i = 0; i < t.childCount; i++) { Transform r = Find(t.GetChild(i), name); if (r != null) return r; }
            return null;
        }

        public int Wrap(int i) { int n = N; return ((i % n) + n) % n; }

        // the nearest centre-line sample, searching around a guess (cheap) or the whole lap (guess < 0)
        public int Nearest(Vector3 p, int guess = -1, int span = 60)
        {
            int best = 0; float bd = float.MaxValue;
            if (guess < 0) { for (int i = 0; i < N; i += 4) { float d = (centre[i] - p).sqrMagnitude; if (d < bd) { bd = d; best = i; } } guess = best; span = 8; bd = float.MaxValue; }
            for (int k = -span; k <= span; k++) { int i = Wrap(guess + k); float d = (centre[i] - p).sqrMagnitude; if (d < bd) { bd = d; best = i; } }
            return best;
        }

        // sideways distance from the centre line (+ = the driver's left)
        public float Lateral(Vector3 p, int i) { Vector3 d = p - centre[i]; return Vector3.Dot(d, left[i]); }

        // distance along the lap of a point near sample i
        public float Along(Vector3 p, int i) { return dist[i] + Vector3.Dot(p - centre[i], forward[i]); }

        public bool NearPitLane(Vector3 p, float within = 6f)
        {
            if (pit == null) return false;
            float w2 = within * within;
            for (int i = 0; i < pit.Length; i++) if ((pit[i] - p).sqrMagnitude < w2) return true;
            return false;
        }

        // Is a point in the pit lane (between its walls, or within the lane's width where a side is open to the track)?
        // If so, how far along it (m).
        public bool InPitLane(Vector3 p, out float along)
        {
            along = -1;
            if (pit == null || pit.Length < 2) return false;
            int best = 0; float bd = float.MaxValue;
            for (int i = 0; i < pit.Length; i++) { Vector3 d = pit[i] - p; d.y = 0; float q = d.sqrMagnitude; if (q < bd) { bd = q; best = i; } }
            if (bd > 30f * 30f || Mathf.Abs(pit[best].y - p.y) > 4f) return false;
            Vector3 f = pit[Mathf.Min(pit.Length - 1, best + 1)] - pit[Mathf.Max(0, best - 1)]; f.y = 0; f.Normalize();
            Vector3 l = -Vector3.Cross(Vector3.up, f), dp = p - pit[best]; dp.y = 0;
            float lat = Vector3.Dot(dp, l), fwd = Vector3.Dot(dp, f);
            if ((best == 0 && fwd < -1f) || (best == pit.Length - 1 && fwd > 1f)) return false;
            float wl = data.pitWallL != null && best < data.pitWallL.Length ? data.pitWallL[best] : 40, wr = data.pitWallR != null && best < data.pitWallR.Length ? data.pitWallR[best] : 40;
            float L = wl >= 40 ? 3.7f : wl + 0.5f, R = wr >= 40 ? 3.7f : wr + 0.5f;
            if (lat > L || -lat > R) return false;
            along = data.pitDist[best] + fwd;
            return true;
        }

        // where along the pit lane (m) a point is, or -1 if it isn't in it
        public float PitDistance(Vector3 p, float within = 5f)
        {
            if (pit == null) return -1;
            int best = -1; float bd = within * within;
            for (int i = 0; i < pit.Length; i++) { float d = (pit[i] - p).sqrMagnitude; if (d < bd) { bd = d; best = i; } }
            return best < 0 ? -1 : data.pitDist[best];
        }

        public Pose PoseAt(int i, float lateral = 0f, float lift = 0.6f)
        {
            i = Wrap(i);
            return new Pose(centre[i] + left[i] * lateral + Vector3.up * lift, Quaternion.LookRotation(forward[i], Vector3.up));
        }

        void OnDrawGizmosSelected()
        {
            if (centre == null) return;
            Gizmos.color = Color.yellow;
            for (int i = 0; i < N; i += 10) Gizmos.DrawLine(centre[i], centre[Wrap(i + 10)]);
        }
    }
}

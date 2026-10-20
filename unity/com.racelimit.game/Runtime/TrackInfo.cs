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
        public class Data
        {
            public string slug, name;
            public float half, len;
            public bool street;
            public int n;
            public float[] x, y, z, wallL, wallR;
            public Corner[] corners;
            public bool hasPit;
            public float pitLimitFrom, pitLimitTo;
            public float[] pitX, pitY, pitZ, pitDist;
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
                if (wall) { r.enabled = false; mc.sharedMaterial = RLWall.Material; walls++; continue; }
                var sf = r.GetComponent<RLSurface>(); if (sf == null) sf = r.gameObject.AddComponent<RLSurface>();
                RLSurface.TryParse(mn, out sf.kind); ground++;
            }
            if (ground == 0) Debug.LogError("RaceLimit: no ground pieces found in the circuit model. Material names seen: " + string.Join(", ", seen));
        }

        // An invisible surface just under the road, from barrier to barrier all the way round (and along the pit lane),
        // built from the centre line: whatever happens to the model, the car can't fall through the world.
        public void BuildSafetyGround()
        {
            if (transform.Find("RL_SafetyGround") != null) return;
            var root = new GameObject("RL_SafetyGround").transform; root.SetParent(transform, false);
            root.position = Vector3.zero; root.rotation = Quaternion.identity; root.localScale = Vector3.one;
            int n = N;
            Band(root, "track", SurfaceKind.Track, n, (i) => -data.half - 0.5f, (i) => data.half + 0.5f, 0.07f);
            Band(root, "left", SurfaceKind.Runoff, n, (i) => data.half + 0.5f, (i) => Mathf.Max(data.half + 1f, data.wallL[i] + 2f), 0.09f);
            Band(root, "right", SurfaceKind.Runoff, n, (i) => -Mathf.Max(data.half + 1f, data.wallR[i] + 2f), (i) => -data.half - 0.5f, 0.09f);
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
        void Band(Transform root, string name, SurfaceKind kind, int n, Off from, Off to, float below)
        {
            // in pieces of 600 m, each its own collider
            for (int a = 0; a < n; a += 600)
            {
                var v = new System.Collections.Generic.List<Vector3>(); var t = new System.Collections.Generic.List<int>();
                int b = Mathf.Min(n, a + 601);
                for (int i = a; i <= b; i++)
                {
                    int j = Wrap(i);
                    v.Add(centre[j] + left[j] * from(j) - Vector3.up * below); v.Add(centre[j] + left[j] * to(j) - Vector3.up * below);
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

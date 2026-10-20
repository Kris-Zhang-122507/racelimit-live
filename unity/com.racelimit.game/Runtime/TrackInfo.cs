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

        void Awake() { Load(); }

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

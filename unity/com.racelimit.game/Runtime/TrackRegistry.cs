using System;
using System.Collections.Generic;
using UnityEngine;

namespace RaceLimit
{
    // The circuits the main menu offers: one entry per playable scene (the real circuits and the ones made with the
    // Track Builder), written by the editor when it builds a scene (Assets/RaceLimit/Resources/RL_Tracks.json).
    [Serializable]
    public class TrackEntry
    {
        public string name, scene, kind;   // kind: "Real circuit" or "Track Builder"
        public float km, climb;
        public int corners;
        public bool pit;
        public float[] map;      // the lap in the map's 200 × 200 box: x, y, x, y…
        public float[] heights;  // 60 heights along the lap (m)
    }

    [Serializable]
    public class TrackList { public TrackEntry[] tracks = new TrackEntry[0]; }

    public static class TrackRegistry
    {
        public const string ResourceName = "RL_Tracks";

        public static TrackList Load()
        {
            var t = Resources.Load<TextAsset>(ResourceName);
            if (t == null) return new TrackList();
            var l = JsonUtility.FromJson<TrackList>(t.text);
            if (l == null || l.tracks == null) l = new TrackList();
            return l;
        }

        // what the menu shows of a circuit, from its track data (its map drawn as the web game draws maps)
        public static TrackEntry Describe(TrackInfo.Data d, string scene, bool built)
        {
            var e = new TrackEntry { name = d.name, scene = scene, kind = built ? "Track Builder" : "Real circuit", km = d.len / 1000f, pit = d.hasPit, corners = d.corners != null ? d.corners.Length : 0 };
            int n = d.n; float minX = float.MaxValue, maxX = float.MinValue, minY = float.MaxValue, maxY = float.MinValue, lo = float.MaxValue, hi = float.MinValue;
            Func<int, float> X = (i) => built ? -d.x[i] : d.x[i], Y = (i) => d.z[i]; // (built ones are in this scene's terms, x mirrored from the web game's: drawn the same way round)
            for (int i = 0; i < n; i++) { minX = Mathf.Min(minX, X(i)); maxX = Mathf.Max(maxX, X(i)); minY = Mathf.Min(minY, Y(i)); maxY = Mathf.Max(maxY, Y(i)); lo = Mathf.Min(lo, d.y[i]); hi = Mathf.Max(hi, d.y[i]); }
            float sc = 180f / Mathf.Max(1, Mathf.Max(maxX - minX, maxY - minY)), ox = 100 - (minX + maxX) / 2 * sc, oy = 100 - (minY + maxY) / 2 * sc;
            var m = new List<float>(); int step = Mathf.Max(1, n / 240);
            for (int i = 0; i <= n; i += step) { int j = i % n; m.Add(Mathf.Round((ox + X(j) * sc) * 10) / 10); m.Add(Mathf.Round((oy + Y(j) * sc) * 10) / 10); }
            e.map = m.ToArray();
            e.heights = new float[60]; for (int k = 0; k < 60; k++) e.heights[k] = Mathf.Round(d.y[k * n / 60] * 10) / 10;
            e.climb = Mathf.Round(hi - lo);
            return e;
        }

        public static HudMap MapOf(TrackEntry e)
        {
            var m = new HudMap { showCar = false };
            int n = e.map != null ? e.map.Length / 2 : 0; var pts = new Vector2[n];
            for (int i = 0; i < n; i++) pts[i] = new Vector2(e.map[2 * i], e.map[2 * i + 1]);
            m.lap = pts; m.segs = new[] { pts }; m.segState = new sbyte[1];
            if (n > 1) { m.start = pts[0]; Vector2 d = pts[1] - pts[0]; m.startAngle = Mathf.Atan2(d.x, -d.y) * Mathf.Rad2Deg + 90; }
            return m;
        }
    }
}

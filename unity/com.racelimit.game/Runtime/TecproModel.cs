using System.Collections.Generic;
using UnityEngine;

namespace RaceLimit
{
    // The shapes TecproBarrier draws, made in code (no model files): one Tecpro block, like the real ones — a moulded
    // block 1.0 m long, 0.55 m deep and 1.2 m tall with rounded corners, a little narrower at the top, three ribs down
    // each long face, two dark ratchet straps round it, an oval dip and a lifting slot in its top (the approved remodel,
    // style A). Long side along +Z, depth along X, standing on y = 0. Submesh 0 is the plastic, submesh 1 the dark bits.
    public static class TecproModel
    {
        public const float Length = 1.0f, Depth = 0.55f, Height = 1.2f;
        const float Taper = 0.05f; // narrower at the top by this share

        public static Mesh Module()
        {
            var v = new List<Vector3>(); var nr = new List<Vector3>(); var body = new List<int>(); var dark = new List<int>();
            float L = Length / 2, D = Depth / 2, r = 0.11f;
            // the outline, anticlockwise from above: four rounded corners
            var ol = new List<Vector2>(); var on = new List<Vector2>(); const int CS = 4;
            Vector2[] cc = { new Vector2(D - r, L - r), new Vector2(-D + r, L - r), new Vector2(-D + r, -L + r), new Vector2(D - r, -L + r) };
            for (int c = 0; c < 4; c++)
                for (int a = 0; a <= CS; a++)
                {
                    float t = (c * 90f + a * 90f / CS) * Mathf.Deg2Rad; var n = new Vector2(Mathf.Cos(t), Mathf.Sin(t));
                    ol.Add(cc[c] + n * r); on.Add(n);
                }
            int n0 = ol.Count;
            // the sides (x, z shrink towards the top)
            int b = v.Count;
            for (int k = 0; k < n0; k++)
            {
                var nn = new Vector3(on[k].x, 0.05f, on[k].y).normalized;
                v.Add(new Vector3(ol[k].x, 0, ol[k].y)); v.Add(new Vector3(ol[k].x * (1 - Taper), Height, ol[k].y * (1 - Taper))); nr.Add(nn); nr.Add(nn);
            }
            for (int k = 0; k < n0; k++) { int a0 = b + 2 * k, a1 = b + 2 * ((k + 1) % n0); Vector3 o = nr[a0] + nr[a1]; Tri(v, body, a0, a1, a0 + 1, o); Tri(v, body, a0 + 1, a1, a1 + 1, o); }
            // the top
            int c0 = v.Count; v.Add(new Vector3(0, Height, 0)); nr.Add(Vector3.up);
            for (int k = 0; k < n0; k++) { v.Add(new Vector3(ol[k].x * (1 - Taper), Height, ol[k].y * (1 - Taper))); nr.Add(Vector3.up); }
            for (int k = 0; k < n0; k++) Tri(v, body, c0, c0 + 1 + k, c0 + 1 + (k + 1) % n0, Vector3.up);
            // ribs down both long faces
            float xf = D * (1 - Taper * 0.5f);
            foreach (float s in new[] { 1f, -1f })
                foreach (float z in new[] { -0.3f, 0f, 0.3f })
                    Box(v, nr, body, new Vector3(s * (xf + 0.004f), Height * 0.55f, z), new Vector3(0.03f, Height * 0.62f, 0.07f));
            // the straps, round the long faces at two heights
            foreach (float s in new[] { 1f, -1f })
                foreach (float y in new[] { 0.34f, 0.86f })
                    Box(v, nr, dark, new Vector3(s * (D * (1 - Taper * y / Height) + 0.024f), y, 0), new Vector3(0.012f, 0.05f, Length * 0.96f));
            // the dip and the lifting slot in the top
            Dip(v, nr, body, new Vector3(0, Height + 0.004f, -0.08f), D * 0.52f, L * 0.6f, 0f);
            Box(v, nr, dark, new Vector3(0, Height + 0.004f, 0.3f), new Vector3(0.05f, 0.008f, 0.16f));
            var m = new Mesh { name = "RL_TecproBlock" };
            m.SetVertices(v); m.SetNormals(nr); m.subMeshCount = 2; m.SetTriangles(body, 0); m.SetTriangles(dark, 1); m.RecalculateBounds();
            return m;
        }

        static void Box(List<Vector3> v, List<Vector3> nr, List<int> t, Vector3 o, Vector3 s)
        {
            Vector3[] ax = { Vector3.right, Vector3.left, Vector3.up, Vector3.down, Vector3.forward, Vector3.back };
            foreach (var n in ax)
            {
                Vector3 a = Mathf.Abs(n.y) > 0.5f ? Vector3.right : Vector3.up, b = Vector3.Cross(n, a);
                Vector3 c = o + Vector3.Scale(n, s) * 0.5f, ha = Vector3.Scale(a, s) * 0.5f, hb = Vector3.Scale(b, s) * 0.5f;
                int q = v.Count; v.Add(c - ha - hb); v.Add(c + ha - hb); v.Add(c + ha + hb); v.Add(c - ha + hb); for (int k = 0; k < 4; k++) nr.Add(n);
                Tri(v, t, q, q + 1, q + 2, n); Tri(v, t, q, q + 2, q + 3, n);
            }
        }

        // a shallow oval dip in the top: its sloping sides catch the light differently, so it reads as a hollow
        static void Dip(List<Vector3> v, List<Vector3> nr, List<int> t, Vector3 c, float rx, float rz, float depth)
        {
            int b = v.Count; const int S = 16; v.Add(c + Vector3.down * depth); nr.Add(Vector3.up);
            for (int k = 0; k < S; k++) { float a = 2 * Mathf.PI * k / S; var dir = new Vector3(Mathf.Cos(a), 0, Mathf.Sin(a)); v.Add(c + new Vector3(dir.x * rx, 0, dir.z * rz)); nr.Add((Vector3.up * 0.75f + dir * 0.65f).normalized); /* (tilted as if the surface sloped down into it) */ }
            for (int k = 0; k < S; k++) Tri(v, t, b, b + 1 + k, b + 1 + (k + 1) % S, Vector3.up);
        }

        static void Ellipse(List<Vector3> v, List<Vector3> nr, List<int> t, Vector3 c, float rx, float rz)
        {
            int b = v.Count; const int S = 16; v.Add(c); nr.Add(Vector3.up);
            for (int k = 0; k < S; k++) { float a = 2 * Mathf.PI * k / S; v.Add(c + new Vector3(Mathf.Cos(a) * rx, 0, Mathf.Sin(a) * rz)); nr.Add(Vector3.up); }
            for (int k = 0; k < S; k++) Tri(v, t, b, b + 1 + k, b + 1 + (k + 1) % S, Vector3.up);
        }

        // a triangle facing `outward` (Unity draws the side where Cross(b - a, c - a) points)
        static void Tri(List<Vector3> v, List<int> t, int a, int b, int c, Vector3 outward)
        {
            if (Vector3.Dot(Vector3.Cross(v[b] - v[a], v[c] - v[a]), outward) < 0) { t.Add(a); t.Add(c); t.Add(b); }
            else { t.Add(a); t.Add(b); t.Add(c); }
        }
    }
}

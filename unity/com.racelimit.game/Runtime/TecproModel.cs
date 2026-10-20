using System.Collections.Generic;
using UnityEngine;

namespace RaceLimit
{
    // The shapes TecproBarrier draws, made in code (no model files): one module and the spacer between two rows.
    // Same as the web game's: a grey moulded "pill" (rounded ends) 1.5 m long, 0.5 m deep and 1.1 m tall, a dark strap
    // round its middle and an oval dip in its top. Long side along +Z, depth along X, standing on y = 0.
    // Submesh 0 is the plastic body, submesh 1 the dark bits (strap, dip).
    public static class TecproModel
    {
        public const float Length = 1.5f, Depth = 0.5f, Height = 1.1f;

        public static Mesh Module()
        {
            float r = Depth / 2, half = Length / 2 - r;
            // the outline, round the module: the +Z end, then the -Z end (normals point straight out, smooth all round)
            var ol = new List<Vector2>(); var on = new List<Vector2>(); const int SEG = 8;
            for (int a = 0; a <= SEG; a++) { float t = Mathf.PI * a / SEG; var n = new Vector2(Mathf.Cos(t), Mathf.Sin(t)); ol.Add(new Vector2(0, half) + n * r); on.Add(n); }
            for (int a = 0; a <= SEG; a++) { float t = Mathf.PI + Mathf.PI * a / SEG; var n = new Vector2(Mathf.Cos(t), Mathf.Sin(t)); ol.Add(new Vector2(0, -half) + n * r); on.Add(n); }
            var v = new List<Vector3>(); var nr = new List<Vector3>(); var body = new List<int>(); var dark = new List<int>();
            int n0 = ol.Count;
            // the sides
            Ring(v, nr, body, ol, on, 0f, Height, 1f);
            // the strap: a band just proud of the sides
            Ring(v, nr, dark, ol, on, 0.52f, 0.60f, 1.012f);
            // the top, with the dip in it
            int c = v.Count; v.Add(new Vector3(0, Height, 0)); nr.Add(Vector3.up);
            for (int k = 0; k < n0; k++) { v.Add(new Vector3(ol[k].x, Height, ol[k].y)); nr.Add(Vector3.up); }
            for (int k = 0; k < n0; k++) Tri(v, body, c, c + 1 + k, c + 1 + (k + 1) % n0, Vector3.up);
            Ellipse(v, nr, dark, new Vector3(0, Height + 0.004f, 0), r * 0.6f, Length * 0.32f);
            var m = new Mesh { name = "RL_TecproModule" };
            m.SetVertices(v); m.SetNormals(nr); m.subMeshCount = 2; m.SetTriangles(body, 0); m.SetTriangles(dark, 1); m.RecalculateBounds();
            return m;
        }

        // the red spacer between two rows: 0.34 m along, 1 m tall, as thick as the gap
        public static Mesh Spacer(float gap)
        {
            var m = new Mesh { name = "RL_TecproSpacer" };
            var v = new List<Vector3>(); var nr = new List<Vector3>(); var t = new List<int>();
            Vector3 s = new Vector3(gap + 0.02f, 1.0f, 0.34f), o = new Vector3(0, 0.54f, 0);
            Vector3[] ax = { Vector3.right, Vector3.left, Vector3.up, Vector3.down, Vector3.forward, Vector3.back };
            foreach (var n in ax)
            {
                Vector3 a = Mathf.Abs(n.y) > 0.5f ? Vector3.right : Vector3.up, b = Vector3.Cross(n, a);
                Vector3 cc = o + Vector3.Scale(n, s) * 0.5f, ha = Vector3.Scale(a, s) * 0.5f, hb = Vector3.Scale(b, s) * 0.5f;
                int q = v.Count; v.Add(cc - ha - hb); v.Add(cc + ha - hb); v.Add(cc + ha + hb); v.Add(cc - ha + hb); for (int k = 0; k < 4; k++) nr.Add(n);
                Tri(v, t, q, q + 1, q + 2, n); Tri(v, t, q, q + 2, q + 3, n);
            }
            m.SetVertices(v); m.SetNormals(nr); m.SetTriangles(t, 0); m.RecalculateBounds();
            return m;
        }

        static void Ring(List<Vector3> v, List<Vector3> nr, List<int> t, List<Vector2> ol, List<Vector2> on, float y0, float y1, float grow)
        {
            int b = v.Count, n = ol.Count;
            for (int k = 0; k < n; k++) { var p = ol[k] * grow; var nn = new Vector3(on[k].x, 0, on[k].y); v.Add(new Vector3(p.x, y0, p.y)); v.Add(new Vector3(p.x, y1, p.y)); nr.Add(nn); nr.Add(nn); }
            for (int k = 0; k < n; k++)
            {
                int a0 = b + 2 * k, a1 = b + 2 * ((k + 1) % n);
                Vector3 out0 = nr[a0] + nr[a1];
                Tri(v, t, a0, a1, a0 + 1, out0); Tri(v, t, a0 + 1, a1, a1 + 1, out0);
            }
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

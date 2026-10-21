using UnityEngine;

namespace RaceLimit
{
    // Draws HudLayout's (and the menus') boxes, text and the track map with Unity's immediate GUI, scaled from the web
    // page's pixels to the screen. Also the menus' buttons: Hit tells whether a click landed in a box.
    public class ImguiPainter : IMenuPainter
    {
        public float scale = 1;
        public float Opacity { get; set; }
        readonly System.Func<HudFont, Font> fonts;
        readonly System.Collections.Generic.Dictionary<int, GUIStyle> styles = new System.Collections.Generic.Dictionary<int, GUIStyle>();
        readonly GUIContent content = new GUIContent();
        class MapTex { public Texture2D tex; public int version = -1; public float drawn; }
        readonly System.Collections.Generic.Dictionary<HudMap, MapTex> maps = new System.Collections.Generic.Dictionary<HudMap, MapTex>();
        public ImguiPainter(System.Func<HudFont, Font> fontFor) { fonts = fontFor; Opacity = 1; }
        public Rect ToScreen(Rect r) { return S(r); }
        // a click (mouse up) inside r, in the page's pixels; call during OnGUI
        public bool Hit(Rect r) { var e = Event.current; return e != null && e.type == EventType.MouseUp && e.button == 0 && S(r).Contains(e.mousePosition); }
        public bool Hover(Rect r) { var e = Event.current; return e != null && S(r).Contains(e.mousePosition); }

        Rect S(Rect r) { return new Rect(r.x * scale, r.y * scale, r.width * scale, r.height * scale); }
        Color A(Color c) { c.a *= Opacity; return c; }

        public void Fill(Rect r, Color c, float radius) { GUI.DrawTexture(S(r), Texture2D.whiteTexture, ScaleMode.StretchToFill, true, 0, A(c), 0, radius * scale); }
        public void Border(Rect r, Color c, float radius, float width) { GUI.DrawTexture(S(r), Texture2D.whiteTexture, ScaleMode.StretchToFill, true, 0, A(c), Mathf.Max(1, width * scale), radius * scale); }

        Font FontFor(HudFont f) { return fonts != null ? fonts(f) : null; }
        GUIStyle Style(HudFont f, float size, TextAnchor a)
        {
            int px = Mathf.Max(6, Mathf.RoundToInt(size * scale)), key = ((int)f * 1000 + px) * 16 + (int)a;
            GUIStyle st;
            if (!styles.TryGetValue(key, out st))
            {
                st = new GUIStyle(GUI.skin.label) { fontSize = px, alignment = a, wordWrap = a == TextAnchor.UpperLeft, clipping = TextClipping.Overflow, richText = false, padding = new RectOffset(0, 0, 0, 0), margin = new RectOffset(0, 0, 0, 0) };
                var font = FontFor(f); if (font != null) st.font = font; else st.fontStyle = f == HudFont.B500 ? FontStyle.Normal : FontStyle.Bold;
                styles[key] = st;
            }
            return st;
        }
        public void Text(Rect r, string s, HudFont f, float size, Color c, TextAnchor a)
        {
            if (string.IsNullOrEmpty(s)) return;
            var st = Style(f, size, a); st.normal.textColor = A(c); content.text = s;
            GUI.Label(S(r), content, st);
        }
        public float Width(string s, HudFont f, float size)
        {
            if (string.IsNullOrEmpty(s)) return 0;
            content.text = s; return Style(f, size, TextAnchor.MiddleLeft).CalcSize(content).x / scale;
        }

        public void Map(Rect r, HudMap m)
        {
            if (Event.current != null && Event.current.type != EventType.Repaint) return;
            const int T = 332;
            MapTex mt; if (!maps.TryGetValue(m, out mt)) { maps[m] = mt = new MapTex { tex = new Texture2D(T, T, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear } }; }
            if (mt.version < 0 || (mt.version != m.version && Time.unscaledTime - mt.drawn > 0.25f)) { Raster(m, T, mt.tex); mt.version = m.version; mt.drawn = Time.unscaledTime; }
            GUI.DrawTexture(S(r), mt.tex, ScaleMode.StretchToFill, true, 0, A(Color.white), 0, 0);
            if (!m.showCar) return;
            // the car: an orange dot with a dark rim
            float k = r.width / 200f; var c = new Vector2(r.x + m.car.x * k, r.y + m.car.y * k);
            Fill(new Rect(c.x - 6 * k, c.y - 6 * k, 12 * k, 12 * k), HudLayout.Hex(0x0B0D12), 6 * k);
            Fill(new Rect(c.x - 4.5f * k, c.y - 4.5f * k, 9 * k, 9 * k), HudLayout.Accent, 4.5f * k);
        }
        Color32[] px;
        void Raster(HudMap m, int T, Texture2D mapTex)
        {
            if (px == null || px.Length != T * T) px = new Color32[T * T];
            for (int i = 0; i < px.Length; i++) px[i] = new Color32(0, 0, 0, 0);
            float k = T / 200f;
            if (m.pit != null) Poly(m.pit, HudLayout.Hex(0x5B6372), 2f * k, k, T, false);
            Poly(m.lap, HudLayout.Hex(0x3A4150), 7f * k, k, T, false);
            if (m.segs != null) for (int s = 0; s < m.segs.Length; s++) Poly(m.segs[s], m.segState[s] == 1 ? HudLayout.Deploy : m.segState[s] == 2 ? HudLayout.Harvest : HudLayout.Soft, 2.6f * k, k, T, true);
            // the start line: a short orange bar across the track
            float a = m.startAngle * Mathf.Deg2Rad; Vector2 dir = new Vector2(Mathf.Sin(a), -Mathf.Cos(a)) * 5f; // (the web's rect, rotated: 3 wide, 10 long)
            Line(m.start - dir, m.start + dir, HudLayout.Accent, 3f * k, k, T, true);
            // (y down in the box, but row 0 of a texture is at the bottom)
            var flip = new Color32[T * T]; for (int y = 0; y < T; y++) System.Array.Copy(px, y * T, flip, (T - 1 - y) * T, T);
            mapTex.SetPixels32(flip); mapTex.Apply(false);
        }
        void Poly(Vector2[] p, Color c, float w, float k, int T, bool round) { for (int i = 1; i < p.Length; i++) Line(p[i - 1], p[i], c, w, k, T, true); }
        // an antialiased thick line (round ends, so the pieces join smoothly), painted over what's there
        void Line(Vector2 a0, Vector2 b0, Color c, float w, float k, int T, bool round)
        {
            Vector2 a = a0 * k, b = b0 * k; float h = w / 2;
            int x0 = Mathf.Max(0, Mathf.FloorToInt(Mathf.Min(a.x, b.x) - h - 1)), x1 = Mathf.Min(T - 1, Mathf.CeilToInt(Mathf.Max(a.x, b.x) + h + 1));
            int y0 = Mathf.Max(0, Mathf.FloorToInt(Mathf.Min(a.y, b.y) - h - 1)), y1 = Mathf.Min(T - 1, Mathf.CeilToInt(Mathf.Max(a.y, b.y) + h + 1));
            Vector2 ab = b - a; float L2 = Mathf.Max(1e-6f, ab.sqrMagnitude);
            for (int y = y0; y <= y1; y++) for (int x = x0; x <= x1; x++)
            {
                Vector2 q = new Vector2(x + 0.5f, y + 0.5f); float t = Mathf.Clamp01(Vector2.Dot(q - a, ab) / L2);
                float d = (q - (a + ab * t)).magnitude, cov = Mathf.Clamp01(h + 0.5f - d);
                if (cov <= 0) continue;
                int i = y * T + x; Color o = px[i]; float al = cov * c.a, oa = o.a;
                float na = al + oa * (1 - al);
                Color n = na > 0 ? new Color((c.r * al + o.r * oa * (1 - al)) / na, (c.g * al + o.g * oa * (1 - al)) / na, (c.b * al + o.b * oa * (1 - al)) / na, na) : o;
                px[i] = n;
            }
        }
    }
}

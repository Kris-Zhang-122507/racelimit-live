using UnityEngine;

namespace RaceLimit
{
    // The on-screen display: the web game's layout (HudLayout) with its fonts (Barlow, Barlow Condensed, JetBrains Mono),
    // drawn with Unity's immediate GUI. Fills a HudState from the car and the session each frame, keeps the per-lap
    // tallies (battery energy in and out, top speed), colours the map by where the battery deployed and harvested, and
    // finds the next corner. Tab: more / less. hudSize scales it (1 = as big as the web game's default).
    public class RaceHud : MonoBehaviour
    {
        public RaceSession session;
        public RaceCar car;
        public Font barlow500, barlow600, barlow700, barlowCondensed700, jetBrainsMono600;
        [Tooltip("1 = the web game's normal size (1.2 large, 1.4 extra large)")]
        [Range(0.6f, 1.6f)] public float hudSize = 1f;
        public bool full = true;

        readonly HudState st = new HudState();
        HudMap map; Painter painter;
        TrackInfo track;
        TrackInfo.Corner[] corners;
        float startT, cornerAt, lastErs = -1, lapDep, lapHarv, lapTop; int lapN = -1;
        int segAcc = -1, segN, segDep, segHarv;
        const int SEG = 24;

        void Start()
        {
            if (session == null) session = FindAnyObjectByType<RaceSession>();
            if (car == null) car = FindAnyObjectByType<RaceCar>();
            startT = Time.unscaledTime;
            painter = new Painter(this);
            st.hint = "Arrows or W A S D drive · E / Q gears · Space overtake · [ ] brake bias · F aero · Tab more / less info · C camera · B look back · R reset · Esc pause";
        }

        bool Ready()
        {
            if (map != null) return true;
            if (session == null || car == null || session.track == null || session.track.data == null || session.track.centre == null) return false;
            track = session.track; var d = track.data; int n = d.n;
            // the map, in the web map's 200 × 200 box
            float minX = float.MaxValue, maxX = float.MinValue, minZ = float.MaxValue, maxZ = float.MinValue;
            for (int i = 0; i < n; i += 10) { minX = Mathf.Min(minX, d.x[i]); maxX = Mathf.Max(maxX, d.x[i]); minZ = Mathf.Min(minZ, d.z[i]); maxZ = Mathf.Max(maxZ, d.z[i]); }
            sc = 180f / Mathf.Max(maxX - minX, maxZ - minZ); ox = 100 - (minX + maxX) / 2 * sc; oz = 100 - (minZ + maxZ) / 2 * sc;
            map = new HudMap();
            var lap = new System.Collections.Generic.List<Vector2>(); for (int i = 0; i < n; i += 12) lap.Add(M(d.x[i], d.z[i])); lap.Add(M(d.x[0], d.z[0])); map.lap = lap.ToArray();
            if (d.hasPit && d.pitX != null && d.pitX.Length > 1) { var pl = new System.Collections.Generic.List<Vector2>(); for (int i = 0; i < d.pitX.Length; i += 3) pl.Add(M(d.pitX[i], d.pitZ[i])); map.pit = pl.ToArray(); }
            int nSeg = (n + SEG - 1) / SEG; map.segs = new Vector2[nSeg][]; map.segState = new sbyte[nSeg];
            for (int s = 0; s < nSeg; s++) { var sp = new System.Collections.Generic.List<Vector2>(); for (int i = s * SEG; i <= Mathf.Min(n, (s + 1) * SEG); i += 6) { int j = i % n; sp.Add(M(d.x[j], d.z[j])); } map.segs[s] = sp.ToArray(); }
            map.start = M(d.x[0], d.z[0]); map.startAngle = Mathf.Atan2(d.x[1] - d.x[0], -(d.z[1] - d.z[0])) * Mathf.Rad2Deg + 90;
            // corners in lap order
            var cl = new System.Collections.Generic.List<TrackInfo.Corner>(); if (d.corners != null) foreach (var c in d.corners) if (c.i >= 0 && c.i < n) cl.Add(c);
            cl.Sort((a, b) => a.i.CompareTo(b.i)); corners = cl.ToArray();
            st.session = "Practice · " + d.name; st.circuit = d.name;
            return true;
        }
        float sc = 1, ox, oz;
        Vector2 M(float x, float z) { return new Vector2(ox + x * sc, oz + z * sc); }

        void Update()
        {
            if (car != null && car.input != null && car.input.info) full = !full;
            if (!Ready()) return;
            // ---- per-lap tallies ----
            if (lapN != session.lap) { lapN = session.lap; lapDep = lapHarv = 0; lapTop = 0; }
            if (lastErs >= 0) { float de = car.ers - lastErs; if (de < 0) lapDep -= de; else lapHarv += de; }
            lastErs = car.ers; lapTop = Mathf.Max(lapTop, car.kmh);
            // ---- the map: what the battery did in each piece of track, the last time through ----
            int sNow = (session.idx / SEG) % map.segs.Length;
            if (sNow != segAcc)
            {
                if (segAcc >= 0 && segN > 0 && !session.onPit) { sbyte v = (sbyte)(segDep > segN * 0.4f ? 1 : segHarv > segN * 0.4f ? 2 : 0); if (map.segState[segAcc] != v) { map.segState[segAcc] = v; map.version++; } }
                segAcc = sNow; segN = segDep = segHarv = 0;
            }
            segN++; if (car.deploying && car.deployW > 1000) segDep++; else if (car.harvesting) segHarv++;
            // ---- the next corner (a few times a second) ----
            if (corners.Length > 0 && Time.unscaledTime - cornerAt > 0.12f)
            {
                cornerAt = Time.unscaledTime; float d0 = track.dist[session.idx], bd = float.MaxValue; int best = 0;
                for (int j = 0; j < corners.Length; j++) { float dd = track.dist[corners[j].i] - d0; if (dd < -15) dd += track.length; if (dd < bd) { bd = dd; best = j; } }
                var k = corners[best];
                st.nextName = "T" + k.n + (k.name != null && !k.name.StartsWith("Turn ") && k.name.Length > 0 ? " " + k.name : "");
                st.nextDist = bd < 15 ? "now" : Mathf.RoundToInt(bd / 10f) * 10 + " m";
            }
        }

        static string Signed(float d, int dp) { return (d >= 0 ? "+" : "−") + Mathf.Abs(d).ToString(dp == 3 ? "0.000" : dp == 2 ? "0.00" : "0.0"); }
        static string Abbrev(SurfaceKind k)
        {
            switch (k) { case SurfaceKind.Track: return "TRK"; case SurfaceKind.Line: return "LINE"; case SurfaceKind.Kerb: return "KERB"; case SurfaceKind.Apron: return "APR"; case SurfaceKind.Runoff: return "RUN"; case SurfaceKind.Escape: return "ESC"; case SurfaceKind.Street: return "ROAD"; case SurfaceKind.Grass: return "GRS"; case SurfaceKind.Gravel: return "GRV"; default: return "DIRT"; }
        }

        void Fill()
        {
            var s = session; var c = car;
            st.simple = !full; st.paused = s.paused;
            // timing
            st.lapLabel = s.running ? "LAP " + s.lap : "OUT LAP"; st.invalid = s.lapInvalid;
            st.cur = RaceSession.Fmt(s.running ? s.lapTime : 0); st.last = RaceSession.Fmt(s.lastLap); st.best = RaceSession.Fmt(s.bestLap);
            bool hd = s.hasDelta && s.running;
            st.delta = hd ? Signed(s.delta, 2) : ""; st.deltaCls = hd ? (s.delta < 0 ? 1 : 2) : 0;
            st.delta2 = hd ? Signed(s.delta, Mathf.Abs(s.delta) < 10 ? 3 : 1) : "–"; st.delta2Cls = st.deltaCls;
            st.pred = hd && s.bestTraceLap > 0 ? RaceSession.Fmt(s.bestTraceLap + s.delta) : RaceSession.Fmt(-1);
            for (int i = 0; i < 3; i++) { st.secTimes[i] = s.sectors[i] < 0 ? "––.–––" : s.sectors[i].ToString("0.000"); st.secCls[i] = s.sectors[i] < 0 ? 0 : s.sectorCls[i]; }
            st.progress = track.length > 0 ? track.dist[s.idx] / track.length : 0;
            // map
            st.map = map; Vector3 q = track.Unmap(c.transform.position); map.car = M(q.x, q.z);
            // message
            st.message = Time.unscaledTime < s.messageUntil ? s.message : null;
            st.messageCls = st.message == null ? 0 : st.message.Contains("deleted") ? 2 : st.message.StartsWith("Best") ? 1 : 0;
            // battery
            float soc = c.batteryJ > 0 ? c.ers / c.batteryJ : 0; st.soc = soc; st.battPct = Mathf.RoundToInt(soc * 100) + "%";
            st.mode = c.overtake ? "Overtake" : c.clipping ? "Clipping" : c.deploying && c.deployW > 1000 ? "Deploy" : c.harvesting && c.harvestW_now > 1000 ? "Harvest" : "Hold";
            st.modeKw = st.mode == "Deploy" || st.mode == "Overtake" ? "+" + Mathf.RoundToInt(c.deployW / 1000) + " kW" : st.mode == "Harvest" || st.mode == "Clipping" ? "−" + Mathf.RoundToInt(c.harvestW_now / 1000) + " kW" : "";
            st.barCls = c.overtake || c.deploying ? 1 : c.harvesting ? 2 : 0;
            st.lapEnergy = "▲" + (lapDep / 1e6f).ToString("0.0") + " ▼" + (lapHarv / 1e6f).ToString("0.0") + " MJ";
            st.overtake = c.overtake ? "ON" : c.pitLimiter ? "–" : soc > 0.08f ? "Ready" : "Low battery"; st.overtakeCls = c.overtake ? 2 : soc > 0.08f && !c.pitLimiter ? 1 : 0;
            // tyres: what each one is on (FL FR / RL RR)
            int off = 0;
            for (int k = 0; k < 4; k++)
            {
                var sf = c.wheelSurface[k]; bool o = RLSurface.OffTrack(sf); if (o) off++;
                st.tyres[k] = c.wheelsDown == 0 ? "–" : Abbrev(sf); st.tyreCls[k] = c.wheelsDown == 0 ? 0 : o ? 2 : 1;
            }
            st.compLetter = "M"; st.compName = "Medium"; st.tyreSub = c.wheelsDown == 0 ? "In the air" : off == 0 ? "All on track" : off == 4 ? "All four off" : off + " off track";
            // gear, speed, revs, pedals
            st.rpm = c.rpm; st.throttle = c.throttle; st.brake = c.brake;
            st.gear = c.reverse ? "R" : c.kmh < 1.8f && c.throttle < 0.05f && !s.running ? "N" : c.gear.ToString();
            st.speed = Mathf.RoundToInt(c.kmh).ToString(); st.rpmText = (Mathf.Round(c.rpm / 100) * 100).ToString("#,0");
            // aero, pit lane, aids
            st.straightMode = c.straightMode; st.onPit = s.onPit; st.pitLimiter = c.pitLimiter;
            st.abs = !c.abs ? 2 : c.absActive || c.lockFront || c.lockRear ? 1 : 0;
            st.tc = !c.tractionControl ? 2 : c.tcActive || c.wheelspin ? 1 : 0;
            st.sc = !c.stabilityHelp ? 2 : c.stabilityActive ? 1 : 0;
            st.gearMode = c.autoGears ? "AUTO" : "MANUAL";
            st.bias = (c.brakeBias * 100).ToString("0.0") + "% front"; st.top = lapTop > 1 ? Mathf.RoundToInt(lapTop) + " km/h" : "–";
            // the keys, for the first 14 seconds
            float age = Time.unscaledTime - startT; st.hintAlpha = Mathf.Clamp01(15f - age);
        }

        void OnGUI()
        {
            if (Event.current.type != EventType.Repaint || !Ready()) return;
            Fill();
            // the web page's pixels are the screen's at 96 dpi, more on a high-resolution screen (Windows' display scaling)
            float dpi = Screen.dpi > 30 ? Screen.dpi : 96f * Screen.height / 1080f, scale = hudSize * Mathf.Clamp(dpi / 96f, 0.75f, 3f);
            painter.scale = scale; painter.Opacity = 1;
            HudLayout.Draw(painter, st, Screen.width / scale, Screen.height / scale);
        }

        // ---- drawing with Unity's immediate GUI ----
        class Painter : IHudPainter
        {
            public float scale = 1;
            public float Opacity { get; set; }
            readonly RaceHud hud;
            readonly System.Collections.Generic.Dictionary<int, GUIStyle> styles = new System.Collections.Generic.Dictionary<int, GUIStyle>();
            readonly GUIContent content = new GUIContent();
            Texture2D mapTex; int mapVersion = -1; HudMap mapFor;
            public Painter(RaceHud h) { hud = h; Opacity = 1; }

            Rect S(Rect r) { return new Rect(r.x * scale, r.y * scale, r.width * scale, r.height * scale); }
            Color A(Color c) { c.a *= Opacity; return c; }

            public void Fill(Rect r, Color c, float radius) { GUI.DrawTexture(S(r), Texture2D.whiteTexture, ScaleMode.StretchToFill, true, 0, A(c), 0, radius * scale); }
            public void Border(Rect r, Color c, float radius, float width) { GUI.DrawTexture(S(r), Texture2D.whiteTexture, ScaleMode.StretchToFill, true, 0, A(c), Mathf.Max(1, width * scale), radius * scale); }

            Font FontFor(HudFont f)
            {
                switch (f) { case HudFont.B500: return hud.barlow500; case HudFont.B600: return hud.barlow600; case HudFont.B700: return hud.barlow700; case HudFont.BC700: return hud.barlowCondensed700; default: return hud.jetBrainsMono600; }
            }
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
                const int T = 332;
                if (mapTex == null) { mapTex = new Texture2D(T, T, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear }; }
                if (mapFor != m || (mapVersion != m.version && Time.unscaledTime - lastDraw > 0.25f)) { Raster(m, T); mapFor = m; mapVersion = m.version; lastDraw = Time.unscaledTime; }
                GUI.DrawTexture(S(r), mapTex, ScaleMode.StretchToFill, true, 0, A(Color.white), 0, 0);
                // the car: an orange dot with a dark rim
                float k = r.width / 200f; var c = new Vector2(r.x + m.car.x * k, r.y + m.car.y * k);
                Fill(new Rect(c.x - 6 * k, c.y - 6 * k, 12 * k, 12 * k), HudLayout.Hex(0x0B0D12), 6 * k);
                Fill(new Rect(c.x - 4.5f * k, c.y - 4.5f * k, 9 * k, 9 * k), HudLayout.Accent, 4.5f * k);
            }
            float lastDraw;
            Color32[] px;
            void Raster(HudMap m, int T)
            {
                if (px == null || px.Length != T * T) px = new Color32[T * T];
                for (int i = 0; i < px.Length; i++) px[i] = new Color32(0, 0, 0, 0);
                float k = T / 200f;
                if (m.pit != null) Poly(m.pit, HudLayout.Hex(0x5B6372), 2f * k, k, T, false);
                Poly(m.lap, HudLayout.Hex(0x3A4150), 7f * k, k, T, false);
                for (int s = 0; s < m.segs.Length; s++) Poly(m.segs[s], m.segState[s] == 1 ? HudLayout.Deploy : m.segState[s] == 2 ? HudLayout.Harvest : HudLayout.Soft, 2.6f * k, k, T, true);
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
}

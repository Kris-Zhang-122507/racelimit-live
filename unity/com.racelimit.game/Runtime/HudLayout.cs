using UnityEngine;

namespace RaceLimit
{
    // The on-screen display's layout, the same as the web game's (public/race/hud.js and race.css), in the web page's
    // pixels: RaceHud fills a HudState from the car and the session, and draws this through a painter that scales it to
    // the screen. (Kept apart from Unity's drawing so it can also be drawn to a picture outside Unity, to check it.)
    //   top left    timing: lap, current time, live delta, sectors, last / best / predicted, lap progress
    //   top centre  session and the next corner
    //   top right   track map, coloured by where you last deployed (orange) and harvested (blue) battery energy
    //   bottom      one bar: battery and power, tyres, gear / speed / delta with pedal bars, aero mode and the driver
    //               aids as they work, brake bias, top speed and overtake; the rev lights run along its top edge
    // Tab switches to a simpler version (the "fo" parts hidden). Nothing flashes.
    public enum HudFont { B500, B600, B700, BC700, JB600 }

    public interface IHudPainter
    {
        void Fill(Rect r, Color c, float radius);
        void Border(Rect r, Color c, float radius, float width);
        void Text(Rect r, string s, HudFont f, float size, Color c, TextAnchor a);
        float Width(string s, HudFont f, float size);
        void Map(Rect r, HudMap m);
        float Opacity { get; set; }
    }

    // the track map in the web map's 200 × 200 box (x right, y down)
    public class HudMap
    {
        public Vector2[] lap, pit;      // the lap, and the pit lane
        public Vector2[][] segs;        // the lap in 24 m pieces
        public sbyte[] segState;        // per piece: 0 neither, 1 deployed, 2 harvested (the last time through)
        public int version;             // goes up when segState changes
        public Vector2 start; public float startAngle; // the start line marker (degrees)
        public Vector2 car;
    }

    public class HudState
    {
        public bool simple, paused;
        // timing
        public string lapLabel = "LAP 1", cur = "0:00.000", last = "", best = "", pred = "", delta = ""; public bool invalid; public int deltaCls; // 0 none, 1 good, 2 bad
        public string[] secTimes = { "––.–––", "––.–––", "––.–––" }; public int[] secCls = new int[3]; // 0 none, 1 purple, 2 green, 3 yellow, 4 deleted
        public float progress;
        // top centre
        public string session = "", nextName = "–", nextDist = "";
        // map
        public HudMap map; public string circuit = "";
        // message
        public string message; public int messageCls;
        // cluster
        public float rpm, throttle, brake, soc;
        public string battPct = "100%", mode = "Hold", modeKw = "", lapEnergy = ""; public int barCls; // 0 green, 1 deploy, 2 harvest
        public string[] tyres = { "–", "–", "–", "–" }; public int[] tyreCls = new int[4]; // 0 plain, 1 ok, 2 off track
        public string compLetter = "M", compName = "Medium", tyreSub = "";
        public string gear = "N", speed = "0", rpmText = "0", delta2 = "–"; public int delta2Cls;
        public bool straightMode, onPit, pitLimiter;
        public int abs, tc, sc; // 0 standing by, 1 working, 2 off
        public string gearMode = "AUTO", bias = "62.0% front", top = "–", overtake = "–"; public int overtakeCls; // 0 muted, 1 ready, 2 on
        public string hint = ""; public float hintAlpha;
    }

    public static class HudLayout
    {
        // the web page's colours
        public static readonly Color Text = Hex(0xE8EAF0), Soft = Hex(0xC3C9D4), Muted = Hex(0x9AA3B2), Accent = Hex(0xFFB547), Good = Hex(0x2FD27A), Bad = Hex(0xFF6B6B),
            BoxBg = new Color(11 / 255f, 13 / 255f, 18 / 255f, 0.74f), BoxLine = new Color(1, 1, 1, 0.07f), Track = Hex(0x262B36), Chip = Hex(0x1C2230),
            Deploy = Hex(0xFF9F2E), Harvest = Hex(0x4FA3FF), LedOff = Hex(0x20242E), LedG = Hex(0x4ADE80), LedR = Hex(0xFF5A4A), LedB = Hex(0x4A7BFF);
        static readonly Color[] SecBg = { Hex(0x1A1E27), Hex(0x3A1F5C), Hex(0x12301F), Hex(0x3A3110), Hex(0x3A1717) };

        public static Color Hex(int rgb, float a = 1) { return new Color(((rgb >> 16) & 255) / 255f, ((rgb >> 8) & 255) / 255f, (rgb & 255) / 255f, a); }

        static void Box(IHudPainter p, Rect r) { p.Fill(r, BoxBg, 12); p.Border(r, BoxLine, 12, 1); }
        static float L(float size) { return size * 1.45f; } // the page's line height
        // a small capitals label (".k")
        static void K(IHudPainter p, float x, float y, float w, string s, Color c, TextAnchor a = TextAnchor.MiddleLeft, float size = 10) { p.Text(new Rect(x, y, w, L(size)), s.ToUpperInvariant(), HudFont.B600, size, c, a); }

        public static void Draw(IHudPainter p, HudState s, float W, float H)
        {
            bool fo = !s.simple;
            Timing(p, s, fo);
            if (fo) Info(p, s, W);
            MapBox(p, s, W, fo);
            Cluster(p, s, W, H, fo);
            if (!string.IsNullOrEmpty(s.message)) Message(p, s, W, H);
            if (s.hintAlpha > 0.01f && !string.IsNullOrEmpty(s.hint))
            {
                float o = p.Opacity; p.Opacity = s.hintAlpha;
                var r = new Rect(14, 248, 300, 8 + 3 * L(12) + 8); Box(p, r);
                p.Text(new Rect(r.x + 12, r.y + 8, r.width - 24, r.height - 16), s.hint, HudFont.B600, 12, Soft, TextAnchor.UpperLeft);
                p.Opacity = o;
            }
            if (s.paused)
            {
                p.Fill(new Rect(0, 0, W, H), new Color(0, 0, 0, 0.5f), 0);
                float w = 360; var r = new Rect(W / 2 - w / 2, H / 2 - 40, w, 80); Box(p, r);
                p.Text(new Rect(r.x, r.y + 12, w, 30), "PAUSED", HudFont.BC700, 26, Accent, TextAnchor.MiddleCenter);
                p.Text(new Rect(r.x, r.y + 44, w, 20), "Esc to carry on", HudFont.B600, 13, Soft, TextAnchor.MiddleCenter);
            }
        }

        // ---- top left: timing ----
        static void Timing(IHudPainter p, HudState s, bool fo)
        {
            float x = 14, y = 14, w = 214, cx = x + 14, cw = w - 28, gap = 4;
            float h = 10 + L(10) + gap + 29.7f + gap + 21 + gap + 38 + gap + L(14) + gap + L(14) + (fo ? gap + L(14) + gap + 5 : 0) + 10;
            Box(p, new Rect(x, y, w, h));
            float yy = y + 10;
            K(p, cx, yy, cw, s.lapLabel, Muted);
            if (s.invalid) K(p, cx, yy, cw, "LAP DELETED", Bad, TextAnchor.MiddleRight);
            yy += L(10) + gap;
            p.Text(new Rect(cx, yy, cw, 29.7f), s.cur, HudFont.JB600, 27, Text, TextAnchor.MiddleLeft); yy += 29.7f + gap;
            if (!string.IsNullOrEmpty(s.delta)) p.Text(new Rect(cx, yy, cw, 21), s.delta, HudFont.JB600, 15, s.deltaCls == 1 ? Good : s.deltaCls == 2 ? Bad : Text, TextAnchor.MiddleLeft);
            yy += 21 + gap;
            float sw = (cw - 8) / 3f;
            for (int i = 0; i < 3; i++)
            {
                var r = new Rect(cx + i * (sw + 4), yy, sw, 38); p.Fill(r, SecBg[Mathf.Clamp(s.secCls[i], 0, 4)], 6);
                K(p, r.x + 6, r.y + 3, sw - 12, "S" + (i + 1), Muted);
                p.Text(new Rect(r.x + 6, r.y + 3 + L(10), sw - 12, L(12)), s.secTimes[i], HudFont.JB600, 12, Text, TextAnchor.MiddleLeft);
            }
            yy += 38 + gap;
            Row(p, cx, yy, cw, "Last", s.last); yy += L(14) + gap;
            Row(p, cx, yy, cw, "Best", s.best); yy += L(14) + gap;
            if (fo)
            {
                Row(p, cx, yy, cw, "Predicted", s.pred); yy += L(14) + gap;
                p.Fill(new Rect(cx, yy + 2, cw, 3), Track, 2); p.Fill(new Rect(cx, yy + 2, cw * Mathf.Clamp01(s.progress), 3), Accent, 2);
            }
        }
        static void Row(IHudPainter p, float x, float y, float w, string k, string v)
        {
            K(p, x, y + (L(14) - L(10)) / 2, w, k, Muted);
            p.Text(new Rect(x, y, w, L(14)), v, HudFont.JB600, 14, Text, TextAnchor.MiddleRight);
        }

        // ---- top centre: session and the next corner ----
        static void Info(IHudPainter p, HudState s, float W)
        {
            string sess = s.session.ToUpperInvariant();
            float w1 = p.Width(sess, HudFont.B600, 11), wk = p.Width("NEXT", HudFont.B600, 10), wn = p.Width(s.nextName, HudFont.BC700, 15), wd = string.IsNullOrEmpty(s.nextDist) ? 0 : p.Width(s.nextDist, HudFont.JB600, 13);
            float inner = (w1 > 0 ? w1 + 14 : 0) + wk + 4 + wn + (wd > 0 ? 4 + wd : 0), w = inner + 28, h = L(15) + 14, x = W / 2 - w / 2, y = 14;
            Box(p, new Rect(x, y, w, h));
            float xx = x + 14, cy = y + 7;
            if (w1 > 0) { p.Text(new Rect(xx, cy, w1 + 2, L(15)), sess, HudFont.B600, 11, Muted, TextAnchor.MiddleLeft); xx += w1 + 14; }
            p.Text(new Rect(xx, cy, wk + 2, L(15)), "NEXT", HudFont.B600, 10, Muted, TextAnchor.MiddleLeft); xx += wk + 4;
            p.Text(new Rect(xx, cy, wn + 2, L(15)), s.nextName, HudFont.BC700, 15, Text, TextAnchor.MiddleLeft); xx += wn + 4;
            if (wd > 0) p.Text(new Rect(xx, cy, wd + 2, L(15)), s.nextDist, HudFont.JB600, 13, Soft, TextAnchor.MiddleLeft);
        }

        // ---- top right: the map ----
        static void MapBox(IHudPainter p, HudState s, float W, bool fo)
        {
            float w = 182, h = 6 + (fo ? 13 + 2 : 0) + 166 + (fo ? 2 + L(10) : 0) + 6, x = W - 14 - w, y = 14;
            Box(p, new Rect(x, y, w, h));
            float yy = y + 6;
            if (fo) { K(p, x + 8, yy, w - 16, s.circuit, Muted, TextAnchor.MiddleLeft, 9); yy += 13 + 2; }
            if (s.map != null) p.Map(new Rect(x + 8, yy, 166, 166), s.map);
            yy += 166 + 2;
            if (fo)
            {
                float lx = x + 8, ly = yy + L(10) / 2 - 1.5f;
                p.Fill(new Rect(lx, ly, 10, 3), Deploy, 2); lx += 16;
                float a = p.Width("deploy", HudFont.B600, 10); p.Text(new Rect(lx, yy, a + 2, L(10)), "deploy", HudFont.B600, 10, Muted, TextAnchor.MiddleLeft); lx += a + 12;
                p.Fill(new Rect(lx, ly, 10, 3), Harvest, 2); lx += 16;
                p.Text(new Rect(lx, yy, 60, L(10)), "harvest", HudFont.B600, 10, Muted, TextAnchor.MiddleLeft);
            }
        }

        static void Message(IHudPainter p, HudState s, float W, float H)
        {
            float tw = p.Width(s.message, HudFont.BC700, 22), w = tw + 36, h = L(22) + 16, x = W / 2 - w / 2, y = H * 0.18f;
            p.Fill(new Rect(x, y, w, h), new Color(11 / 255f, 13 / 255f, 18 / 255f, 0.82f), 10); p.Border(new Rect(x, y, w, h), new Color(1, 1, 1, 0.1f), 10, 1);
            p.Text(new Rect(x, y, w, h), s.message, HudFont.BC700, 22, s.messageCls == 1 ? Good : s.messageCls == 2 ? Bad : Text, TextAnchor.MiddleCenter);
        }

        // ---- bottom: the driving bar ----
        static void Cluster(IHudPainter p, HudState s, float W, float H, bool fo)
        {
            // column widths (the web bar's, as it lays out with typical values; fixed so nothing shifts about)
            float wErs = 150, wTyre = fo ? 174 : 24 + 71, wGs = 276, wAero = 142, wSet = fo ? 128 : 0;
            float colH = 82, w = wErs + wTyre + wGs + wAero + wSet, h = 7 + colH, x = W / 2 - w / 2, y = H - 12 - h;
            Box(p, new Rect(x, y, w, h));
            // rev lights along the top edge: green, red, then all blue at the shift point (solid, never flashing)
            int lit = Mathf.Clamp(Mathf.RoundToInt((s.rpm - 10200f) / 1600f * 15f), 0, 15); bool allBlue = s.rpm >= 11800;
            float lw = (w - 14 * 2) / 15f;
            for (int i = 0; i < 15; i++) p.Fill(new Rect(x + i * (lw + 2), y, lw, 4), allBlue ? LedB : i < lit ? (i < 5 ? LedG : i < 10 ? LedR : LedB) : LedOff, 0);
            float cx = x, top = y + 7;
            // battery
            {
                float px = cx + 12, pw = wErs - 24, n = fo ? 4 : 3, inner = L(13) + 7 + L(14) + (fo ? L(11) : 0) + 3 * (n - 1), yy = top + (colH - inner) / 2;
                K(p, px, yy + (L(13) - L(10)) / 2, pw, "Batt", Muted); p.Text(new Rect(px, yy, pw, L(13)), s.battPct, HudFont.JB600, 13, Text, TextAnchor.MiddleRight); yy += L(13) + 3;
                p.Fill(new Rect(px, yy, pw, 7), Track, 4); p.Fill(new Rect(px, yy, pw * Mathf.Clamp01(s.soc), 7), s.barCls == 1 ? Deploy : s.barCls == 2 ? Harvest : Good, 4); yy += 7 + 3;
                Color mc = s.mode == "Deploy" ? Deploy : s.mode == "Overtake" ? Accent : s.mode == "Harvest" || s.mode == "Clipping" ? Harvest : Muted;
                p.Text(new Rect(px, yy, pw, L(14)), s.mode, HudFont.BC700, 14, mc, TextAnchor.MiddleLeft);
                p.Text(new Rect(px, yy, pw, L(14)), s.modeKw, HudFont.JB600, 11, Muted, TextAnchor.MiddleRight); yy += L(14) + 3;
                if (fo) { p.Text(new Rect(px, yy, pw, L(11)), "Lap", HudFont.B500, 11, Muted, TextAnchor.MiddleLeft); p.Text(new Rect(px, yy, pw, L(11)), s.lapEnergy, HudFont.JB600, 11, Muted, TextAnchor.MiddleRight); }
                cx += wErs;
            }
            Sep(p, cx, top, colH);
            // tyres: a cell each (FL FR / RL RR), the compound and how old they are
            {
                float px = cx + 12, gy = top + (colH - 47) / 2;
                for (int k = 0; k < 4; k++)
                {
                    var r = new Rect(px + (k % 2) * 37, gy + (k / 2) * 25, 34, 22);
                    int c = s.tyreCls[k];
                    p.Fill(r, c == 1 ? Hex(0x12301F) : c == 2 ? Hex(0x3D1416) : Chip, 5);
                    p.Text(r, s.tyres[k], HudFont.JB600, s.tyres[k].Length > 4 ? 9 : 11, c == 1 ? Hex(0x7FE0A8) : c == 2 ? Hex(0xFF7A7A) : Soft, TextAnchor.MiddleCenter);
                }
                if (fo)
                {
                    float ix = px + 71 + 10, iy = top + (colH - (L(14) + 3 + L(11))) / 2;
                    var ring = new Rect(ix, iy + (L(14) - 18) / 2, 18, 18);
                    p.Fill(ring, Hex(0xFFD12E), 9); p.Fill(new Rect(ring.x + 3, ring.y + 3, 12, 12), Hex(0x0B0D12), 6);
                    p.Text(ring, s.compLetter, HudFont.BC700, 10, Hex(0xFFD12E), TextAnchor.MiddleCenter);
                    p.Text(new Rect(ix + 26, iy, 70, L(14)), s.compName, HudFont.BC700, 14, Text, TextAnchor.MiddleLeft);
                    p.Text(new Rect(ix, iy + L(14) + 3, 90, L(11)), s.tyreSub, HudFont.JB600, 11, Muted, TextAnchor.MiddleLeft);
                }
                cx += wTyre;
            }
            Sep(p, cx, top, colH);
            // pedals, gear, speed, delta
            {
                float px = cx + 12, mid = top + colH / 2;
                for (int k = 0; k < 2; k++)
                {
                    var r = new Rect(px + k * 9, mid - 20, 6, 40); float v = Mathf.Clamp01(k == 0 ? s.throttle : s.brake);
                    p.Fill(r, Track, 3); if (v > 0.01f) p.Fill(new Rect(r.x, r.yMax - 40 * v, 6, 40 * v), k == 0 ? Good : LedR, 3);
                }
                px += 15 + 12;
                p.Text(new Rect(px - 4, mid - 22, 36, 44), s.gear, HudFont.BC700, 46, Accent, TextAnchor.MiddleCenter); px += 28 + 12;
                float sh = 27 + L(10);
                p.Text(new Rect(px, mid - sh / 2, 100, 27), s.speed, HudFont.JB600, 27, Text, TextAnchor.MiddleLeft);
                K(p, px, mid - sh / 2 + 27, 110, "km/h · " + s.rpmText + " rpm", Muted);
                px += 104 + 12;
                float dh = 18 * 1.1f + L(10);
                p.Text(new Rect(px, mid - dh / 2, 80, 18 * 1.1f), s.delta2, HudFont.JB600, 18, s.delta2Cls == 1 ? Good : s.delta2Cls == 2 ? Bad : Text, TextAnchor.MiddleLeft);
                K(p, px, mid - dh / 2 + 18 * 1.1f, 80, "delta", Muted);
                cx += wGs;
            }
            Sep(p, cx, top, colH);
            // aero mode (or the pit lane), the driver aids
            {
                float pw = wAero - 24, inner = 11 * 1.45f + 8 + 3 + 10 * 1.45f + 4, yy = top + (colH - inner) / 2, mx = cx + wAero / 2;
                string chip = s.onPit ? (s.pitLimiter ? "PIT LIMITER · 80" : "PIT LANE") : s.straightMode ? "STRAIGHT MODE" : "CORNER MODE";
                Color bg = s.onPit ? (s.pitLimiter ? Hex(0x4A3A10) : Hex(0x2A2416)) : s.straightMode ? Hex(0x10213A) : Chip, fg = s.onPit ? (s.pitLimiter ? Accent : Hex(0xE8C27A)) : s.straightMode ? Hex(0x7FC4FF) : Soft;
                float cw = p.Width(chip, HudFont.B700, 11) * 1.08f + 18, ch = 11 * 1.45f + 8;
                var cr = new Rect(mx - cw / 2, yy, cw, ch); p.Fill(cr, bg, 10); p.Text(cr, chip, HudFont.B700, 11, fg, TextAnchor.MiddleCenter);
                yy += ch + 3;
                string[] aid = { "ABS", "TC", "SC" }; int[] st = { s.abs, s.tc, s.sc };
                float[] aw = new float[3]; float tot = 0;
                for (int i = 0; i < 3; i++) { aw[i] = p.Width(aid[i], HudFont.B700, 10) * 1.06f + 10; tot += aw[i] + 4; }
                float gw = p.Width(s.gearMode, HudFont.B700, 10) * 1.06f + 3; tot += gw;
                float ax = mx - tot / 2, ah = 10 * 1.45f + 4;
                for (int i = 0; i < 3; i++)
                {
                    var r = new Rect(ax, yy, aw[i], ah); float o = p.Opacity; if (st[i] == 2) p.Opacity = o * 0.4f;
                    p.Fill(r, st[i] == 1 ? Hex(0x3A2A10) : Chip, 4); p.Text(r, aid[i], HudFont.B700, 10, st[i] == 1 ? Accent : Muted, TextAnchor.MiddleCenter);
                    if (st[i] == 2) p.Fill(new Rect(r.x + 4, r.center.y, r.width - 8, 1), Muted, 0); // (crossed out: off)
                    p.Opacity = o; ax += aw[i] + 4;
                }
                p.Text(new Rect(ax, yy, gw + 4, ah), s.gearMode, HudFont.B700, 10, Muted, TextAnchor.MiddleLeft);
                cx += wAero;
            }
            if (fo)
            {
                Sep(p, cx, top, colH);
                float px = cx + 12, pw = wSet - 24, rh = L(13), yy = top + (colH - 3 * rh - 6) / 2;
                K(p, px, yy + (rh - L(10)) / 2, pw, "BB", Muted); p.Text(new Rect(px, yy, pw, rh), s.bias, HudFont.JB600, 12, Text, TextAnchor.MiddleRight); yy += rh + 3;
                K(p, px, yy + (rh - L(10)) / 2, pw, "Top", Muted); p.Text(new Rect(px, yy, pw, rh), s.top, HudFont.JB600, 12, Text, TextAnchor.MiddleRight); yy += rh + 3;
                K(p, px, yy + (rh - L(10)) / 2, pw, "Overtake", Muted); p.Text(new Rect(px, yy, pw, rh), s.overtake, HudFont.B700, 12, s.overtakeCls == 2 ? Accent : s.overtakeCls == 1 ? Good : Muted, TextAnchor.MiddleRight);
            }
        }
        static void Sep(IHudPainter p, float x, float top, float h) { p.Fill(new Rect(x, top, 1, h), new Color(1, 1, 1, 0.07f), 0); }
    }
}

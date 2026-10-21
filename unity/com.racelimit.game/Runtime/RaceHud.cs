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
        HudMap map; ImguiPainter painter;
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
            hudSize = RaceSettings.HudScale; full = RaceSettings.FullHud;
            painter = new ImguiPainter((f) => FontFor(f));
            st.hint = "Arrows or W A S D drive · E / Q gears · Space overtake · [ ] brake bias · F aero · Tab more / less info · C camera · B look back · R reset · Esc pause";
        }

        bool Ready()
        {
            if (map != null) return true;
            if (session == null || car == null || session.track == null || session.track.data == null || session.track.centre == null) return false;
            track = session.track; var d = track.data; int n = d.n;
            // the map, in the web map's 200 × 200 box
            float minX = float.MaxValue, maxX = float.MinValue, minZ = float.MaxValue, maxZ = float.MinValue;
            mx = track.worldSpace ? -1 : 1; // (built circuits: x mirrored, so the map is drawn as the web game draws them)
            for (int i = 0; i < n; i += 10) { minX = Mathf.Min(minX, mx * d.x[i]); maxX = Mathf.Max(maxX, mx * d.x[i]); minZ = Mathf.Min(minZ, d.z[i]); maxZ = Mathf.Max(maxZ, d.z[i]); }
            sc = 180f / Mathf.Max(maxX - minX, maxZ - minZ); ox = 100 - (minX + maxX) / 2 * sc; oz = 100 - (minZ + maxZ) / 2 * sc;
            map = new HudMap();
            var lap = new System.Collections.Generic.List<Vector2>(); for (int i = 0; i < n; i += 12) lap.Add(M(d.x[i], d.z[i])); lap.Add(M(d.x[0], d.z[0])); map.lap = lap.ToArray();
            if (d.hasPit && d.pitX != null && d.pitX.Length > 1) { var pl = new System.Collections.Generic.List<Vector2>(); for (int i = 0; i < d.pitX.Length; i += 3) pl.Add(M(d.pitX[i], d.pitZ[i])); map.pit = pl.ToArray(); }
            int nSeg = (n + SEG - 1) / SEG; map.segs = new Vector2[nSeg][]; map.segState = new sbyte[nSeg];
            for (int s = 0; s < nSeg; s++) { var sp = new System.Collections.Generic.List<Vector2>(); for (int i = s * SEG; i <= Mathf.Min(n, (s + 1) * SEG); i += 6) { int j = i % n; sp.Add(M(d.x[j], d.z[j])); } map.segs[s] = sp.ToArray(); }
            map.start = M(d.x[0], d.z[0]); map.startAngle = Mathf.Atan2(mx * (d.x[1] - d.x[0]), -(d.z[1] - d.z[0])) * Mathf.Rad2Deg + 90;
            // corners in lap order
            var cl = new System.Collections.Generic.List<TrackInfo.Corner>(); if (d.corners != null) foreach (var c in d.corners) if (c.i >= 0 && c.i < n) cl.Add(c);
            cl.Sort((a, b) => a.i.CompareTo(b.i)); corners = cl.ToArray();
            st.session = "Practice · " + d.name; st.circuit = d.name;
            return true;
        }
        float sc = 1, ox, oz, mx = 1;
        Vector2 M(float x, float z) { return new Vector2(ox + mx * x * sc, oz + z * sc); }

        void Update()
        {
            if (car != null && car.input != null && car.input.info) { full = !full; RaceSettings.FullHud = full; }
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

        Font FontFor(HudFont f)
        {
            switch (f) { case HudFont.B500: return barlow500; case HudFont.B600: return barlow600; case HudFont.B700: return barlow700; case HudFont.BC700: return barlowCondensed700; default: return jetBrainsMono600; }
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
            if (!Ready()) return;
            float scale = hudSize * MenuUi.ScreenScale(); painter.scale = scale;
            float W = Screen.width / scale, H = Screen.height / scale;
            if (Event.current.type == EventType.Repaint)
            {
                Fill(); st.paused = false; painter.Opacity = 1;
                HudLayout.Draw(painter, st, W, H);
            }
            if (session.paused) PauseMenu(W, H);
        }

        // Esc: carry on, start again, or back to the main menu
        void PauseMenu(float W, float H)
        {
            painter.Opacity = 1;
            if (Event.current.type == EventType.Repaint) painter.Fill(new Rect(0, 0, W, H), new Color(0.02f, 0.03f, 0.05f, 0.6f), 0);
            bool menu = RaceSettings.MenuAvailable; float pw = 340, ph = 96 + (menu ? 3 : 2) * 52, x = W / 2 - pw / 2, y = H / 2 - ph / 2;
            MenuUi.Panel(painter, new Rect(x, y, pw, ph));
            painter.Text(new Rect(x + 24, y + 20, pw - 48, 34), "Paused", HudFont.BC700, 28, HudLayout.Text, TextAnchor.MiddleLeft);
            painter.Text(new Rect(x + 24, y + 54, pw - 48, 20), session.track != null && session.track.data != null ? session.track.data.name : "", HudFont.B600, 13, HudLayout.Muted, TextAnchor.MiddleLeft);
            float by = y + 88;
            if (MenuUi.Button(painter, new Rect(x + 24, by, pw - 48, 42), "Carry on", true)) session.TogglePause(); by += 52;
            if (MenuUi.Button(painter, new Rect(x + 24, by, pw - 48, 42), "Start again", false)) session.Restart(); by += 52;
            if (menu && MenuUi.Button(painter, new Rect(x + 24, by, pw - 48, 42), "Main menu", false)) session.ToMenu();
        }

    }
}

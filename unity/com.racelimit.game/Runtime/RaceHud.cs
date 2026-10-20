using UnityEngine;

namespace RaceLimit
{
    // A first on-screen display (Unity's immediate GUI, so it needs no setup): timing top left, messages top centre,
    // a track map top right, and the driving bar along the bottom — battery, tyres' surface, gear, speed, revs, aero
    // mode and the aids lit while they work. Tab hides the extra bits. To be redone in UI Toolkit later.
    public class RaceHud : MonoBehaviour
    {
        public RaceSession session;
        public RaceCar car;
        public bool full = true;

        GUIStyle big, mid, small, label, box;
        Texture2D white, mapTex;
        float scale = 1;
        static readonly Color panel = new Color(0.043f, 0.05f, 0.07f, 0.78f), accent = new Color(1f, 0.71f, 0.28f), soft = new Color(0.76f, 0.79f, 0.83f), muted = new Color(0.6f, 0.64f, 0.7f), good = new Color(0.18f, 0.82f, 0.48f), bad = new Color(1f, 0.42f, 0.42f), blue = new Color(0.31f, 0.64f, 1f), orange = new Color(1f, 0.62f, 0.18f);

        void Start()
        {
            if (session == null) session = FindAnyObjectByType<RaceSession>();
            if (car == null) car = FindAnyObjectByType<RaceCar>();
            white = Texture2D.whiteTexture;
        }

        void Update() { if (car != null && car.input != null && car.input.info) full = !full; }

        void Styles()
        {
            scale = Mathf.Clamp(Screen.height / 1080f, 0.6f, 2f);
            if (big != null && Mathf.Approximately(big.fontSize, Mathf.Round(46 * scale))) return;
            big = new GUIStyle(GUI.skin.label) { fontSize = Mathf.RoundToInt(46 * scale), fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter };
            big.normal.textColor = accent;
            mid = new GUIStyle(GUI.skin.label) { fontSize = Mathf.RoundToInt(26 * scale), fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleLeft };
            mid.normal.textColor = Color.white;
            small = new GUIStyle(GUI.skin.label) { fontSize = Mathf.RoundToInt(13 * scale), alignment = TextAnchor.MiddleLeft };
            small.normal.textColor = muted;
            label = new GUIStyle(GUI.skin.label) { fontSize = Mathf.RoundToInt(16 * scale), alignment = TextAnchor.MiddleLeft };
            label.normal.textColor = soft;
            box = new GUIStyle(GUI.skin.label) { fontSize = Mathf.RoundToInt(22 * scale), fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter };
            box.normal.textColor = Color.white;
        }

        void Rect(Rect r, Color c) { var o = GUI.color; GUI.color = c; GUI.DrawTexture(r, white); GUI.color = o; }
        void Text(Rect r, string s, GUIStyle st, Color c) { var o = st.normal.textColor; st.normal.textColor = c; GUI.Label(r, s, st); st.normal.textColor = o; }
        Rect R(float x, float y, float w, float h) { return new Rect(x * scale, y * scale, w * scale, h * scale); }

        void OnGUI()
        {
            if (car == null || session == null) return;
            Styles();
            float W = Screen.width / scale, H = Screen.height / scale;

            // ---- timing ----
            Rect(R(14, 14, 230, full ? 168 : 92), panel);
            Text(R(26, 20, 200, 20), session.running ? "LAP " + session.lap : "OUT LAP", small, muted);
            if (session.lapInvalid) Text(R(140, 20, 100, 20), "LAP DELETED", small, bad);
            Text(R(26, 40, 210, 34), session.running ? RaceSession.Fmt(session.lapTime) : RaceSession.Fmt(0), mid, Color.white);
            Text(R(26, 74, 210, 20), "Best  " + RaceSession.Fmt(session.bestLap), label, soft);
            if (full)
            {
                Text(R(26, 96, 210, 20), "Last  " + RaceSession.Fmt(session.lastLap), label, soft);
                for (int s = 0; s < 3; s++)
                {
                    float t = session.sectors[s], b = session.bestSectors[s];
                    Color c = t < 0 ? new Color(0.1f, 0.12f, 0.15f) : b > 0 && t <= b + 0.0005f ? new Color(0.23f, 0.12f, 0.36f) : new Color(0.07f, 0.19f, 0.12f);
                    Rect(R(26 + s * 70, 124, 64, 42), c);
                    Text(R(32 + s * 70, 126, 60, 16), "S" + (s + 1), small, muted);
                    Text(R(32 + s * 70, 144, 60, 20), t < 0 ? "––.–––" : t.ToString("0.000"), label, Color.white);
                }
            }

            // ---- message ----
            if (Time.unscaledTime < session.messageUntil && !string.IsNullOrEmpty(session.message))
            {
                Rect(R(W / 2 - 260, H * 0.16f, 520, 44), panel);
                Text(R(W / 2 - 260, H * 0.16f, 520, 44), session.message, box, session.message.Contains("deleted") ? bad : session.message.StartsWith("Best") ? good : Color.white);
            }
            if (session.paused)
            {
                Rect(new Rect(0, 0, Screen.width, Screen.height), new Color(0, 0, 0, 0.5f));
                Text(R(W / 2 - 200, H / 2 - 40, 400, 80), "PAUSED  ·  Esc to carry on", box, Color.white);
            }

            // ---- map ----
            if (full) DrawMap(R(W - 214, 14, 200, 200));

            // ---- the driving bar ----
            float bw = full ? 760 : 420, bx = W / 2 - bw / 2, by = H - 96;
            Rect(R(bx, by, bw, 84), panel);
            // rev lights along the top edge: green, red, then all blue at the shift point (solid, never flashing)
            int lit = Mathf.Clamp(Mathf.RoundToInt((car.rpm - 10200f) / 1600f * 15f), 0, 15); bool allBlue = car.rpm >= 11800;
            for (int i = 0; i < 15; i++) Rect(R(bx + i * bw / 15f + 1, by, bw / 15f - 2, 4), allBlue ? blue : i < lit ? (i < 5 ? good : i < 10 ? bad : blue) : new Color(0.13f, 0.14f, 0.18f));
            float x = bx + 16;
            // battery
            float soc = car.ers / car.batteryJ;
            Text(R(x, by + 10, 150, 18), "BATT  " + Mathf.RoundToInt(soc * 100) + "%", small, muted);
            Rect(R(x, by + 32, 140, 8), new Color(0.15f, 0.17f, 0.21f)); Rect(R(x, by + 32, 140 * soc, 8), car.deploying ? orange : car.harvesting ? blue : good);
            string mode = car.overtake ? "Overtake" : car.clipping ? "Clipping" : car.deployW > 1000 ? "Deploy +" + Mathf.RoundToInt(car.deployW / 1000) + " kW" : car.harvestW_now > 1000 ? "Harvest −" + Mathf.RoundToInt(car.harvestW_now / 1000) + " kW" : "Hold";
            Text(R(x, by + 46, 160, 22), mode, label, car.deployW > 1000 || car.overtake ? orange : car.harvestW_now > 1000 ? blue : muted);
            x += 170;
            // gear, speed, revs
            Text(R(x, by + 8, 50, 70), car.reverse ? "R" : car.kmh < 1 && car.throttle < 0.05f ? "N" : car.gear.ToString(), big, accent);
            Text(R(x + 54, by + 12, 120, 36), Mathf.RoundToInt(car.kmh).ToString(), mid, Color.white);
            Text(R(x + 54, by + 48, 140, 20), "km/h · " + (Mathf.Round(car.rpm / 100) * 100).ToString("#,0") + " rpm", small, muted);
            // pedals
            Rect(R(x + 168, by + 16, 6, 52), new Color(0.15f, 0.17f, 0.21f)); Rect(R(x + 168, by + 16 + 52 * (1 - car.throttle), 6, 52 * car.throttle), good);
            Rect(R(x + 178, by + 16, 6, 52), new Color(0.15f, 0.17f, 0.21f)); Rect(R(x + 178, by + 16 + 52 * (1 - car.brake), 6, 52 * car.brake), bad);
            x += 200;
            if (full)
            {
                // aero, aids, brake bias, surfaces
                Text(R(x, by + 8, 170, 22), car.pitLimiter ? "PIT LIMITER · 80" : car.straightMode ? "STRAIGHT MODE" : "CORNER MODE", label, car.pitLimiter ? accent : car.straightMode ? blue : soft);
                Chip(R(x, by + 34, 44, 18), "ABS", car.abs, car.absActive || car.lockFront || car.lockRear);
                Chip(R(x + 48, by + 34, 36, 18), "TC", car.tractionControl, car.tcActive || car.wheelspin);
                Chip(R(x + 88, by + 34, 36, 18), "SC", car.stabilityHelp, car.stabilityActive);
                Text(R(x, by + 56, 180, 20), "BB " + (car.brakeBias * 100).ToString("0.0") + "% front", small, muted);
                x += 190;
                // the surface under each tyre (FL FR / RL RR)
                for (int k = 0; k < 4; k++)
                {
                    var s = car.wheelSurface[k]; bool off = RLSurface.OffTrack(s);
                    Rect(R(x + (k % 2) * 60, by + 12 + (k / 2) * 32, 56, 28), off ? new Color(0.24f, 0.08f, 0.09f) : new Color(0.07f, 0.19f, 0.12f));
                    Text(R(x + (k % 2) * 60 + 4, by + 12 + (k / 2) * 32, 52, 28), s.ToString(), small, off ? bad : good);
                }
            }
        }

        void Chip(Rect r, string s, bool on, bool active)
        {
            Rect(r, active ? new Color(0.23f, 0.16f, 0.06f) : new Color(0.11f, 0.13f, 0.19f));
            Text(new Rect(r.x + 4 * scale, r.y, r.width, r.height), on ? s : s + " off", small, active ? accent : on ? muted : new Color(0.4f, 0.42f, 0.46f));
        }

        void DrawMap(Rect area)
        {
            var t = session.track; if (t == null || t.centre == null) return;
            Rect(area, panel);
            if (mapTex == null)
            {
                // the lap drawn once into a small texture
                int S = 256; mapTex = new Texture2D(S, S, TextureFormat.RGBA32, false); var px = new Color32[S * S];
                float minX = float.MaxValue, maxX = float.MinValue, minZ = float.MaxValue, maxZ = float.MinValue;
                foreach (var c in t.centre) { minX = Mathf.Min(minX, c.x); maxX = Mathf.Max(maxX, c.x); minZ = Mathf.Min(minZ, c.z); maxZ = Mathf.Max(maxZ, c.z); }
                mapScale = (S - 24) / Mathf.Max(maxX - minX, maxZ - minZ); mapOx = (minX + maxX) / 2; mapOz = (minZ + maxZ) / 2; mapS = S;
                foreach (var c in t.centre) { int u = MapX(c.x), v = MapY(c.z); for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) { int q = (v + b) * S + u + a; if (q >= 0 && q < px.Length) px[q] = new Color32(195, 201, 212, 255); } }
                mapTex.SetPixels32(px); mapTex.Apply();
            }
            GUI.DrawTexture(area, mapTex);
            Vector3 p = car.transform.position; float k = area.width / mapS;
            Rect(new Rect(area.x + MapX(p.x) * k - 5 * scale, area.y + (mapS - MapY(p.z)) * k - 5 * scale, 10 * scale, 10 * scale), accent);
        }
        float mapScale = 1, mapOx, mapOz; int mapS = 256;
        int MapX(float x) { return Mathf.RoundToInt(mapS / 2 + (x - mapOx) * mapScale); }
        int MapY(float z) { return Mathf.RoundToInt(mapS / 2 + (z - mapOz) * mapScale); }
    }
}

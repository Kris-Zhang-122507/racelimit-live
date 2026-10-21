using UnityEngine;
using UnityEngine.SceneManagement;

namespace RaceLimit
{
    // The main menu, in the web game's style: the game modes as cards (Race weekend opens; the rest are coming), the
    // race weekend screen (pick a circuit — the real ones and the ones made with the Track Builder — the session and the
    // assists, then start), and settings · controls. The car turns slowly in the studio behind the Race weekend card
    // (a camera rendering into a texture the card shows).
    public class MainMenu : MonoBehaviour
    {
        public Font barlow500, barlow600, barlow700, barlowCondensed700, jetBrainsMono600;
        [Tooltip("The camera that films the car for the Race weekend card")] public Camera studioCamera;
        [Tooltip("The car on the turntable")] public Transform turntable;

        enum Screen_ { Main, Weekend, Settings }
        Screen_ screen = Screen_.Main;
        ImguiPainter ip; IMenuPainter p;
        RenderTexture studio;
        TrackList tracks; HudMap[] maps; int pick;

        void Start()
        {
            p = ip = new ImguiPainter((f) => f == HudFont.B500 ? barlow500 : f == HudFont.B600 ? barlow600 : f == HudFont.B700 ? barlow700 : f == HudFont.BC700 ? barlowCondensed700 : jetBrainsMono600);
            tracks = TrackRegistry.Load(); maps = new HudMap[tracks.tracks.Length];
            for (int i = 0; i < maps.Length; i++) maps[i] = TrackRegistry.MapOf(tracks.tracks[i]);
            string last = PlayerPrefs.GetString("RaceLimit.lastTrack", "");
            for (int i = 0; i < tracks.tracks.Length; i++) if (tracks.tracks[i].scene == last) pick = i;
            if (studioCamera != null) { studio = new RenderTexture(1120, 800, 24) { antiAliasing = 4 }; studioCamera.targetTexture = studio; }
            Time.timeScale = 1; AudioListener.pause = false;
        }

        void OnDestroy() { if (studio != null) { if (studioCamera != null) studioCamera.targetTexture = null; studio.Release(); } }

        void Update()
        {
            if (turntable != null) turntable.Rotate(0, 9f * Time.deltaTime, 0, Space.World);
#if RL_INPUTSYSTEM && ENABLE_INPUT_SYSTEM
            var k = UnityEngine.InputSystem.Keyboard.current;
            bool esc = k != null && k.escapeKey.wasPressedThisFrame, enter = k != null && (k.enterKey.wasPressedThisFrame || k.numpadEnterKey.wasPressedThisFrame);
#else
            bool esc = Input.GetKeyDown(KeyCode.Escape), enter = Input.GetKeyDown(KeyCode.Return);
#endif
            if (esc && screen != Screen_.Main) screen = Screen_.Main;
            if (enter) { if (screen == Screen_.Main) screen = Screen_.Weekend; else if (screen == Screen_.Weekend) StartWeekend(); }
        }

        void OnGUI()
        {
            float sc = MenuUi.ScreenScale(); ip.scale = sc; p = ip; p.Opacity = 1;
            float W = Screen.width / sc, H = Screen.height / sc;
            p.Fill(new Rect(0, 0, W, H), MenuUi.Bg, 0);
            if (screen == Screen_.Main) Main(W, H); else if (screen == Screen_.Weekend) Weekend(W, H); else Settings(W, H);
        }

        // the bar along the top: the name, where you are, buttons on the right
        float Header(float W, string title, bool back)
        {
            p.Text(new Rect(24, 14, 160, 40), "RACELIMIT", HudFont.BC700, 24, HudLayout.Accent, TextAnchor.MiddleLeft);
            var tag = new Rect(134, 24, 46, 20); p.Border(tag, MenuUi.Line, 4, 1); p.Text(tag, "RACE", HudFont.B700, 10, HudLayout.Hex(0x6B7383), TextAnchor.MiddleCenter);
            p.Text(new Rect(194, 14, 400, 40), title, HudFont.BC700, 19, HudLayout.Text, TextAnchor.MiddleLeft);
            p.Fill(new Rect(0, 66, W, 1), MenuUi.Line, 0);
            if (back) { if (MenuUi.Button(p, new Rect(W - 24 - 96, 12, 96, 42), "Back", false)) screen = Screen_.Main; }
            return 84;
        }

        // ---- main menu ----
        void Main(float W, float H)
        {
            Header(W, "Main menu", false);
            float bx = W - 24;
            bx -= 92; if (MenuUi.Button(p, new Rect(bx, 12, 92, 42), "Quit", false)) Quit();
            bx -= 186; if (MenuUi.Button(p, new Rect(bx, 12, 176, 42), "Settings · controls", false)) screen = Screen_.Settings;
            float y = 84, cw = W - 48, gap = 16, heroW = Mathf.Round(cw * 0.405f), colW = (cw - heroW - 2 * gap) / 2, rowH = Mathf.Max(170, (H - y - 70 - 2 * gap) / 3);
            // Race weekend: the car in the studio behind it
            var hero = new Rect(24, y, heroW, rowH * 2 + gap);
            bool hov = p.Hover(hero);
            if (studio != null && Event.current.type == EventType.Repaint) GUI.DrawTexture(ip.ToScreen(hero), studio, ScaleMode.ScaleAndCrop, false, 0, Color.white, 0, 12 * ip.scale);
            else p.Fill(hero, MenuUi.CardDark, 12);
            p.Fill(new Rect(hero.x, hero.yMax - 170, hero.width, 170), new Color(0.04f, 0.05f, 0.07f, 0.72f), 12);
            p.Border(hero, hov ? HudLayout.Accent : MenuUi.Line, 12, 1);
            MenuUi.Pill(p, hero.x + 18, hero.yMax - 150, "Main mode", HudLayout.Accent, MenuUi.Dark);
            p.Text(new Rect(hero.x + 18, hero.yMax - 124, hero.width - 36, 42), "Race weekend", HudFont.BC700, 34, HudLayout.Text, TextAnchor.MiddleLeft);
            p.Text(new Rect(hero.x + 18, hero.yMax - 78, Mathf.Min(380, hero.width - 36), 66), "Practice and hot laps at " + (tracks.tracks.Length == 1 ? "Spa" : tracks.tracks.Length + " circuits") + ", and at circuits you build yourself with the Track Builder. Races against AI cars are coming.", HudFont.B500, 13, HudLayout.Text, TextAnchor.UpperLeft);
            if (p.Hit(hero)) screen = Screen_.Weekend;
            // the other modes (coming)
            string[,] cards = {
                { "Live race", "During a real Grand Prix, race alongside it: the real cars' positions from live timing appear as ghosts." },
                { "Beat the driver", "Race a real driver's fastest lap as a ghost, then compare speed, braking and throttle with their telemetry." },
                { "Career", "Start at a back-of-the-grid team, develop upgrades, manage the budget and get offers from bigger teams." },
                { "Famous moments", "Jump into real races at the moment it mattered: defend for 10 laps, win from the pit lane, survive the restart." },
                { "With friends", "Race online with a room code, or share a ghost lap link and see who's fastest this week." },
                { "Replays & photo mode", "Watch your laps from TV cameras, onboard or the helicopter; pause and frame a shot." },
            };
            Rect[] at = {
                new Rect(24 + heroW + gap, y, colW, rowH), new Rect(24 + heroW + gap + colW + gap, y, colW, rowH),
                new Rect(24 + heroW + gap, y + rowH + gap, colW, rowH), new Rect(24 + heroW + gap + colW + gap, y + rowH + gap, colW, rowH),
                new Rect(24, y + 2 * (rowH + gap), heroW, rowH), new Rect(24 + heroW + gap, y + 2 * (rowH + gap), colW, rowH),
            };
            for (int i = 0; i < 6; i++)
            {
                var r = at[i]; MenuUi.CardBox(p, r, false);
                MenuUi.Pill(p, r.x + 18, r.yMax - 118, "Coming soon", HudLayout.Hex(0x1C2230), HudLayout.Muted);
                p.Text(new Rect(r.x + 18, r.yMax - 94, r.width - 36, 34), cards[i, 0], HudFont.BC700, 26, HudLayout.Hex(0x8F96A3), TextAnchor.MiddleLeft);
                p.Text(new Rect(r.x + 18, r.yMax - 56, r.width - 36, 48), cards[i, 1], HudFont.B500, 13, HudLayout.Muted, TextAnchor.UpperLeft);
            }
            // the Track Builder
            {
                var r = new Rect(24 + heroW + gap + colW + gap, y + 2 * (rowH + gap), colW, rowH); MenuUi.CardBox(p, r, false);
                MenuUi.Pill(p, r.x + 18, r.yMax - 118, "In the Unity editor", HudLayout.Hex(0x1F8A4C), HudLayout.Hex(0xEFFFF5));
                p.Text(new Rect(r.x + 18, r.yMax - 94, r.width - 36, 34), "Track Builder", HudFont.BC700, 26, HudLayout.Text, TextAnchor.MiddleLeft);
                p.Text(new Rect(r.x + 18, r.yMax - 56, r.width - 36, 48), "Build circuits from straights, corners and famous corners (RaceLimit > Track Builder). They appear here.", HudFont.B500, 13, HudLayout.Text, TextAnchor.UpperLeft);
            }
            p.Text(new Rect(28, H - 40, W - 56, 24), "Circuit surroundings from map data © OpenStreetMap contributors. All teams, sponsors and brands are made up.", HudFont.B500, 12, HudLayout.Soft, TextAnchor.MiddleLeft);
        }

        // ---- race weekend ----
        void Weekend(float W, float H)
        {
            float y = Header(W, "New race weekend", true), bottom = H - 24, ph = bottom - y;
            var T = tracks.tracks;
            float lw = 270, rw = 330, mw = W - 48 - lw - rw - 32;
            var list = new Rect(24, y, lw, ph); var mid = new Rect(24 + lw + 16, y, mw, ph); var side = new Rect(mid.xMax + 16, y, rw, ph);
            MenuUi.Panel(p, list); MenuUi.Panel(p, mid); MenuUi.Panel(p, side);
            if (T.Length == 0)
            {
                p.Text(new Rect(mid.x + 22, mid.y + 22, mid.width - 44, 120), "No circuits yet. In the Unity editor, use RaceLimit > Build Spa scene, or make one with RaceLimit > Track Builder and press Make it playable.", HudFont.B500, 15, HudLayout.Soft, TextAnchor.UpperLeft);
                return;
            }
            pick = Mathf.Clamp(pick, 0, T.Length - 1);
            // the circuits
            float iy = list.y + 12;
            for (int i = 0; i < T.Length && iy + 60 < list.yMax; i++)
            {
                var r = new Rect(list.x + 12, iy, lw - 24, 60); bool on = i == pick, hov = p.Hover(r);
                if (on || hov) { p.Fill(r, HudLayout.Hex(on ? 0x1A1F2B : 0x161A23), 9); if (on) p.Border(r, HudLayout.Accent, 9, 1); }
                p.Map(new Rect(r.x + 8, r.y + 7, 46, 46), maps[i]);
                p.Text(new Rect(r.x + 64, r.y + 9, r.width - 70, 22), T[i].name, HudFont.B600, 15, HudLayout.Text, TextAnchor.MiddleLeft);
                MenuUi.Label(p, r.x + 64, r.y + 33, r.width - 70, T[i].km.ToString("0.000") + " km · " + (T[i].kind == "Track Builder" ? "built" : "real"), 11);
                if (p.Hit(r)) pick = i;
                iy += 64;
            }
            // the circuit
            var e = T[pick];
            p.Text(new Rect(mid.x + 22, mid.y + 16, mid.width - 44, 36), e.name, HudFont.BC700, 28, HudLayout.Text, TextAnchor.MiddleLeft);
            string[,] stats = { { "Lap length", e.km.ToString("0.000") + " km" }, { "Corners", e.corners.ToString() }, { "Height difference", Mathf.RoundToInt(e.climb) + " m" }, { "Type", e.kind }, { "Pit lane", e.pit ? "Yes" : "No" }, { "Laps of 300 km", Mathf.CeilToInt(305f / Mathf.Max(1, e.km)).ToString() } };
            float colW = (mid.width - 44) / 3;
            for (int i = 0; i < 6; i++)
            {
                float sx = mid.x + 22 + (i % 3) * colW, sy = mid.y + 62 + (i / 3) * 58;
                MenuUi.Label(p, sx, sy, colW, stats[i, 0]);
                p.Text(new Rect(sx, sy + 15, colW, 28), stats[i, 1], HudFont.JB600, 19, HudLayout.Text, TextAnchor.MiddleLeft);
            }
            float mapTop = mid.y + 186, profH = 110, mapSize = Mathf.Max(120, Mathf.Min(mid.width - 44, mid.yMax - mapTop - profH - 60));
            p.Map(new Rect(mid.x + mid.width / 2 - mapSize / 2, mapTop, mapSize, mapSize), maps[pick]);
            // the height along the lap
            float gy = mapTop + mapSize + 26; MenuUi.Label(p, mid.x + 22, gy, 300, "Height · along the lap"); gy += 20;
            if (e.heights != null && e.heights.Length > 1)
            {
                float lo = float.MaxValue, hi = float.MinValue; foreach (float h in e.heights) { lo = Mathf.Min(lo, h); hi = Mathf.Max(hi, h); }
                float bw = (mid.width - 44) / e.heights.Length, span = Mathf.Max(5, hi - lo);
                for (int i = 0; i < e.heights.Length; i++)
                {
                    float hh = 8 + (e.heights[i] - lo) / span * (profH - 18);
                    p.Fill(new Rect(mid.x + 22 + i * bw, gy + profH - hh, bw + 0.5f, hh), new Color(1f, 0.71f, 0.28f, 0.18f), 0);
                    p.Fill(new Rect(mid.x + 22 + i * bw, gy + profH - hh, bw + 0.5f, 2), HudLayout.Accent, 0);
                }
            }
            // the weekend's settings
            float x = side.x + 22, sy2 = side.y + 18;
            p.Text(new Rect(x, sy2, rw - 44, 30), "Weekend settings", HudFont.BC700, 22, HudLayout.Text, TextAnchor.MiddleLeft); sy2 += 44;
            MenuUi.Label(p, x, sy2, 200, "Session"); sy2 += 18;
            int c = MenuUi.Chips(p, x, sy2, new[] { "Practice", "Hot laps", "Race · soon" }, RaceSettings.Session, new[] { true, true, false }); if (c >= 0) RaceSettings.Session = c; sy2 += 46;
            MenuUi.Label(p, x, sy2, 200, "Assists"); sy2 += 18;
            c = MenuUi.Chips(p, x, sy2, new[] { "Lots", "Some", "None" }, RaceSettings.Assists); if (c >= 0) RaceSettings.Assists = c; sy2 += 46;
            MenuUi.Label(p, x, sy2, 200, "Weather"); sy2 += 18;
            MenuUi.Chips(p, x, sy2, new[] { "Dry", "Rain · soon" }, 0, new[] { true, false }); sy2 += 52;
            string about = RaceSettings.Session == 1 ? "You start rolling, 350 m before the line at 200 km/h. Every lap is timed; your best is kept." : "You start on the grid. Laps are timed from the line; your best is kept. The pit lane has an 80 km/h limiter.";
            about += RaceSettings.Assists == 0 ? " Lots: ABS, traction control and the stability help." : RaceSettings.Assists == 1 ? " Some: ABS and traction control." : " None: no ABS, no traction control, no stability help.";
            p.Text(new Rect(x, sy2, rw - 44, 120), about, HudFont.B500, 13, HudLayout.Soft, TextAnchor.UpperLeft);
            if (MenuUi.Button(p, new Rect(x, side.yMax - 72, rw - 44, 50), "Start weekend", true)) StartWeekend();
        }

        void StartWeekend()
        {
            var T = tracks.tracks; if (T.Length == 0) return;
            var e = T[Mathf.Clamp(pick, 0, T.Length - 1)];
            if (!Application.CanStreamedLevelBeLoaded(e.scene)) { Debug.LogError("RaceLimit: the scene " + e.scene + " isn't in the build settings; build it again from the RaceLimit menu"); return; }
            PlayerPrefs.SetString("RaceLimit.lastTrack", e.scene); PlayerPrefs.Save();
            RaceSettings.FromMenu = true;
            SceneManager.LoadScene(e.scene);
        }

        // ---- settings and controls ----
        void Settings(float W, float H)
        {
            float y = Header(W, "Settings · controls", true);
            float pw = Mathf.Min(1040, W - 48), x0 = W / 2 - pw / 2, half = (pw - 16) / 2;
            var a = new Rect(x0, y, half, 330); var b = new Rect(x0 + half + 16, y, half, Mathf.Min(H - y - 24, 560));
            MenuUi.Panel(p, a); MenuUi.Panel(p, b);
            float x = a.x + 22, sy = a.y + 18;
            p.Text(new Rect(x, sy, half - 44, 30), "Settings", HudFont.BC700, 22, HudLayout.Text, TextAnchor.MiddleLeft); sy += 44;
            MenuUi.Label(p, x, sy, 300, "On-screen display size"); sy += 18;
            int c = MenuUi.Chips(p, x, sy, new[] { "Normal", "Large", "Extra large" }, RaceSettings.HudSize); if (c >= 0) RaceSettings.HudSize = c; sy += 46;
            MenuUi.Label(p, x, sy, 300, "On-screen info"); sy += 18;
            c = MenuUi.Chips(p, x, sy, new[] { "Full", "Simple" }, RaceSettings.FullHud ? 0 : 1); if (c >= 0) RaceSettings.FullHud = c == 0; sy += 46;
            MenuUi.Label(p, x, sy, 300, "Gears"); sy += 18;
            c = MenuUi.Chips(p, x, sy, new[] { "Automatic", "Manual (E / Q)" }, RaceSettings.AutoGears ? 0 : 1); if (c >= 0) RaceSettings.AutoGears = c == 0; sy += 46;
            MenuUi.Label(p, x, sy, 300, "Assists"); sy += 18;
            c = MenuUi.Chips(p, x, sy, new[] { "Lots", "Some", "None" }, RaceSettings.Assists); if (c >= 0) RaceSettings.Assists = c;
            // controls
            x = b.x + 22; sy = b.y + 18;
            p.Text(new Rect(x, sy, half - 44, 30), "Controls", HudFont.BC700, 22, HudLayout.Text, TextAnchor.MiddleLeft); sy += 42;
            string[,] keys = {
                { "↑ / W", "Throttle" }, { "↓ / S", "Brake (hold when stopped to reverse)" }, { "← → / A D", "Steer" }, { "E / Q", "Gear up / down (manual)" },
                { "Space", "Overtake boost" }, { "[ ]", "Brake bias back / forward" }, { "F", "Aero mode" }, { "C", "Camera" }, { "B", "Look back" },
                { "Tab", "More / less on screen" }, { "R", "Back on track" }, { "Esc", "Pause" },
                { "Controller", "Triggers, stick, bumpers (gears), A boost, Y camera" },
            };
            for (int i = 0; i < keys.GetLength(0) && sy + 24 < b.yMax; i++)
            {
                p.Text(new Rect(x, sy, 120, 24), keys[i, 0], HudFont.JB600, 13, HudLayout.Text, TextAnchor.MiddleLeft);
                p.Text(new Rect(x + 128, sy, half - 44 - 128, 24), keys[i, 1], HudFont.B500, 14, HudLayout.Soft, TextAnchor.MiddleLeft);
                sy += 30;
            }
        }

        void OnDisable() { PlayerPrefs.Save(); }

        void Quit()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}

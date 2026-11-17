using UnityEngine;
using UnityEngine.SceneManagement;

namespace RaceLimit
{
    // The menus, in the web game's style:
    //   Main menu      Race weekend (the big card), Time trial, Garage, Settings, the Track Builder, and what's coming
    //   Race weekend   the circuit and the car you've chosen, the session (practice, hot laps, time trial), assists → Start
    //   Circuits       every circuit as a card (map outline, country, length); the chosen one in full on the right:
    //                  corners, race laps, lap record, your best, day or night
    //   Garage         the car: its era (1998 V10 … 2026) and the team's livery, turning in the studio
    //   Settings       driving · graphics · sound · controls (click a key to change it)
    //   Loading        the circuit's facts and a tip while it loads
    // Mouse, keyboard (arrows, Enter, Esc) or a controller (d-pad / stick, A, B) all work everywhere.
    // What you choose is saved (RaceSettings) and is there the next time.
    public class MainMenu : MonoBehaviour
    {
        public Font barlow500, barlow600, barlow700, barlowCondensed700, jetBrainsMono600;
        [Tooltip("The camera that films the car for the cards")] public Camera studioCamera;
        [Tooltip("The car on the turntable")] public Transform turntable;
        [Tooltip("Puts the chosen era and team on the turntable's car")] public CarGarage garage;

        enum Screen_ { Main, Weekend, Tracks, Cars, Settings, Loading }
        Screen_ screen = Screen_.Main, carsBack = Screen_.Main;
        ImguiPainter ip; IMenuPainter p;
        RenderTexture studio;
        TrackList tracks; HudMap[] maps; int pick, page, tab;
        int bindAction = -1, bindSlot;
        AsyncOperation loading; float loadStart; string tip = ""; TrackEntry loadingTrack; HudMap loadingMap;

        void Start()
        {
            p = ip = new ImguiPainter((f) => f == HudFont.B500 ? barlow500 : f == HudFont.B600 ? barlow600 : f == HudFont.B700 ? barlow700 : f == HudFont.BC700 ? barlowCondensed700 : jetBrainsMono600);
            tracks = TrackRegistry.Load();
            // the calendar's order, then the circuits made with the Track Builder
            System.Array.Sort(tracks.tracks, (a, b) => { int c = GameData.CircuitOrder(a.kind == "Track Builder" ? "" : a.slug).CompareTo(GameData.CircuitOrder(b.kind == "Track Builder" ? "" : b.slug)); return c != 0 ? c : string.CompareOrdinal(a.name, b.name); });
            maps = new HudMap[tracks.tracks.Length];
            for (int i = 0; i < maps.Length; i++) maps[i] = TrackRegistry.MapOf(tracks.tracks[i]);
            string last = RaceSettings.LastTrack;
            for (int i = 0; i < tracks.tracks.Length; i++) if (tracks.tracks[i].scene == last) pick = i;
            if (studioCamera != null) { studio = new RenderTexture(1120, 800, 24) { antiAliasing = 4 }; studioCamera.targetTexture = studio; }
            Time.timeScale = 1; AudioListener.pause = false;
            var core = RLCore.Get(); core.ApplyGraphics(); core.ApplySound(); core.Music(MusicMood.Menu);
            if (garage != null) garage.Build(RaceSettings.Era, RaceSettings.Team);
        }

        void OnDestroy() { if (studio != null) { if (studioCamera != null) studioCamera.targetTexture = null; studio.Release(); } }
        void OnDisable() { PlayerPrefs.Save(); }

        void Update()
        {
            if (turntable != null) turntable.Rotate(0, (screen == Screen_.Cars ? 14f : 9f) * Time.unscaledDeltaTime, 0, Space.World);
            if (screen == Screen_.Loading)
            {
                // (shown for at least a couple of seconds, so there's time to read it)
                if (loading != null && loading.progress >= 0.9f && Time.unscaledTime - loadStart > 2.2f) loading.allowSceneActivation = true;
                return;
            }
            if (bindAction >= 0) return; // (waiting for a key for the controls: it isn't a menu move)
            int dx, dy; bool submit, back; RLKeys.Nav(out dx, out dy, out submit, out back);
            if (back) { Back(); return; }
            if (ip != null) ip.Navigate(dx, dy, submit);
        }

        void Back()
        {
            if (screen == Screen_.Tracks) Go(Screen_.Weekend);
            else if (screen == Screen_.Cars) Go(carsBack);
            else if (screen != Screen_.Main) Go(Screen_.Main);
        }
        void Go(Screen_ s)
        {
            screen = s; bindAction = -1;
            RLCore.Get().Music(s == Screen_.Cars ? MusicMood.Garage : MusicMood.Menu);
            if (s == Screen_.Tracks) page = PageOf(pick);
        }

        void OnGUI()
        {
            float sc = MenuUi.ScreenScale(); ip.scale = sc; p = ip; p.Opacity = 1;
            float W = Screen.width / sc, H = Screen.height / sc;
            p.Fill(new Rect(0, 0, W, H), MenuUi.Bg, 0);
            CatchKey();
            switch (screen)
            {
                case Screen_.Main: Main(W, H); break;
                case Screen_.Weekend: Weekend(W, H); break;
                case Screen_.Tracks: Tracks(W, H); break;
                case Screen_.Cars: Cars(W, H); break;
                case Screen_.Settings: Settings(W, H); break;
                default: Loading(W, H); break;
            }
            ip.EndNav();
        }

        // ---- shared pieces ----

        // the bar along the top: the name, where you are, Back on the right
        float Header(float W, string title, bool back)
        {
            p.Text(new Rect(24, 14, 160, 40), "RACELIMIT", HudFont.BC700, 24, HudLayout.Accent, TextAnchor.MiddleLeft);
            var tag = new Rect(134, 24, 46, 20); p.Border(tag, MenuUi.Line, 4, 1); p.Text(tag, "RACE", HudFont.B700, 10, HudLayout.Hex(0x6B7383), TextAnchor.MiddleCenter);
            p.Text(new Rect(194, 14, 500, 40), title, HudFont.BC700, 19, HudLayout.Text, TextAnchor.MiddleLeft);
            p.Fill(new Rect(0, 66, W, 1), MenuUi.Line, 0);
            if (back) { if (MenuUi.Button(p, new Rect(W - 24 - 96, 12, 96, 42), "Back", false)) Back(); }
            return 84;
        }

        // the car in the studio, filling a box
        void Studio(Rect r, float radius)
        {
            if (studio != null && ip != null) { if (Event.current.type == EventType.Repaint) GUI.DrawTexture(ip.ToScreen(r), studio, ScaleMode.ScaleAndCrop, false, 0, Color.white, 0, radius * ip.scale); }
            else p.Fill(r, HudLayout.Hex(0x0C0E13), radius);
        }

        TrackEntry Picked { get { var T = tracks.tracks; return T.Length == 0 ? null : T[Mathf.Clamp(pick, 0, T.Length - 1)]; } }
        static CircuitFact Fact(TrackEntry e) { return e == null || e.kind == "Track Builder" ? null : GameData.Circuit(e.slug); }
        static string Place(TrackEntry e) { var f = Fact(e); return f != null ? f.country : "Made with the Track Builder"; }
        static string Slug(TrackEntry e) { return string.IsNullOrEmpty(e.slug) ? e.scene : e.slug; }
        static string Time_(float t) { return t > 0 ? RaceSession.Fmt(t) : "–"; }
        static string CarName() { return GameData.Era(RaceSettings.Era).label + " · " + RaceSettings.Team; }

        // a card on the main menu: a small tag, a title, a line or two; lit and clickable unless it's "coming"
        bool Card(Rect r, string tagText, string title, string text, bool live, bool green = false)
        {
            bool hov = live && p.Hover(r);
            MenuUi.CardBox(p, r, hov);
            if (live) MenuUi.Pill(p, r.x + 18, r.yMax - 118, tagText, green ? HudLayout.Hex(0x1F8A4C) : HudLayout.Accent, green ? HudLayout.Hex(0xEFFFF5) : MenuUi.Dark);
            else MenuUi.Pill(p, r.x + 18, r.yMax - 118, tagText, HudLayout.Hex(0x1C2230), HudLayout.Muted);
            p.Text(new Rect(r.x + 18, r.yMax - 94, r.width - 36, 34), title, HudFont.BC700, 26, live ? HudLayout.Text : HudLayout.Hex(0x8F96A3), TextAnchor.MiddleLeft);
            p.Text(new Rect(r.x + 18, r.yMax - 56, r.width - 36, 48), text, HudFont.B500, 13, live ? HudLayout.Text : HudLayout.Muted, TextAnchor.UpperLeft);
            return live && p.Hit(r);
        }

        // ---- main menu ----
        void Main(float W, float H)
        {
            Header(W, "Main menu", false);
            if (MenuUi.Button(p, new Rect(W - 24 - 92, 12, 92, 42), "Quit", false)) Quit();
            float y = 84, cw = W - 48, gap = 16, heroW = Mathf.Round(cw * 0.405f), colW = (cw - heroW - 2 * gap) / 2, rowH = Mathf.Max(150, (H - y - 70 - 2 * gap) / 3);
            int n = tracks.tracks.Length;
            // Race weekend: the car in the studio behind it
            var hero = new Rect(24, y, heroW, rowH * 2 + gap);
            bool hov = p.Hover(hero);
            Studio(hero, 12);
            p.Fill(new Rect(hero.x, hero.yMax - 170, hero.width, 170), new Color(0.04f, 0.05f, 0.07f, 0.72f), 12);
            p.Border(hero, hov ? HudLayout.Accent : MenuUi.Line, 12, 1);
            MenuUi.Pill(p, hero.x + 18, hero.yMax - 150, "Main mode", HudLayout.Accent, MenuUi.Dark);
            p.Text(new Rect(hero.x + 18, hero.yMax - 124, hero.width - 36, 42), "Race weekend", HudFont.BC700, 34, HudLayout.Text, TextAnchor.MiddleLeft);
            var pe = Picked;
            p.Text(new Rect(hero.x + 18, hero.yMax - 78, Mathf.Min(420, hero.width - 36), 66), "Races, practice, hot laps and time trials at " + (n == 1 ? "1 circuit" : n + " circuits") + ", in cars from 1998 to 2026." + (pe != null ? " Last time: " + pe.name + ", " + CarName() + "." : ""), HudFont.B500, 13, HudLayout.Text, TextAnchor.UpperLeft);
            if (p.Hit(hero)) Go(Screen_.Weekend);
            float x1 = 24 + heroW + gap, x2 = x1 + colW + gap, y2 = y + rowH + gap, y3 = y + 2 * (rowH + gap);
            if (Card(new Rect(x1, y, colW, rowH), "Against the clock", "Time trial", "A full battery every lap. Your best is saved for each circuit and each car.", true)) { RaceSettings.Session = 2; Go(Screen_.Weekend); }
            if (Card(new Rect(x2, y, colW, rowH), "Your car", "Garage", "Choose the car: six eras from the 1998 V10s to 2026, in ten teams' colours. Now: " + CarName() + ".", true)) { carsBack = Screen_.Main; Go(Screen_.Cars); }
            if (Card(new Rect(x1, y2, colW, rowH), "Display, graphics, sound, keys", "Settings · controls", "Graphics presets for laptop graphics, music volume, and every key can be changed.", true)) Go(Screen_.Settings);
            Card(new Rect(x2, y2, colW, rowH), "In the Unity editor", "Track Builder", "Build circuits from straights, corners and famous corners (RaceLimit > Track Builder). They appear with the others.", true, true);
            if (Card(new Rect(24, y3, heroW, rowH), "Against other cars", "Race", "A grid of 10 or 20 cars, the start lights, a standing start, penalties and a results table. Formation lap and safety car come next.", true)) { RaceSettings.Session = 3; Go(Screen_.Weekend); }
            Card(new Rect(x1, y3, colW, rowH), "Coming", "Career", "Start at a back-of-the-grid team, develop upgrades, manage the budget and earn a better seat.", false);
            Card(new Rect(x2, y3, colW, rowH), "Coming", "Replays & photo mode", "Watch your laps from the TV cameras, onboard or the helicopter; pause and frame a shot.", false);
            p.Text(new Rect(28, H - 40, W - 56, 24), "Circuit surroundings from map data © OpenStreetMap contributors. All teams, sponsors and brands are made up.", HudFont.B500, 12, HudLayout.Soft, TextAnchor.MiddleLeft);
        }

        // ---- race weekend: what you've chosen, the session, Start ----
        void Weekend(float W, float H)
        {
            float y = Header(W, "Race weekend", true), bottom = H - 24, ph = bottom - y;
            var e = Picked;
            float rw = 340, cw = (W - 48 - rw - 32) / 2;
            var a = new Rect(24, y, cw, ph); var b = new Rect(a.xMax + 16, y, cw, ph); var side = new Rect(b.xMax + 16, y, rw, ph);
            MenuUi.Panel(p, a); MenuUi.Panel(p, b); MenuUi.Panel(p, side);
            // the circuit
            MenuUi.Label(p, a.x + 22, a.y + 18, 200, "Circuit");
            if (e == null)
            {
                p.Text(new Rect(a.x + 22, a.y + 44, a.width - 44, 120), "No circuits yet. In the Unity editor, use RaceLimit > Build all circuits (or Build Spa scene), or make one with RaceLimit > Track Builder and press Make it playable.", HudFont.B500, 15, HudLayout.Soft, TextAnchor.UpperLeft);
            }
            else
            {
                var f = Fact(e); bool night = RLDayNight.IsNight(Slug(e), RaceSettings.TimeOfDay);
                p.Text(new Rect(a.x + 22, a.y + 36, a.width - 44, 36), e.name, HudFont.BC700, 28, HudLayout.Text, TextAnchor.MiddleLeft);
                p.Text(new Rect(a.x + 22, a.y + 72, a.width - 44, 20), Place(e) + " · " + e.km.ToString("0.000") + " km · " + e.corners + " corners · " + (night ? "night" : "day"), HudFont.B600, 13, HudLayout.Soft, TextAnchor.MiddleLeft);
                float ms = Mathf.Max(120, Mathf.Min(a.width - 44, a.height - 260));
                p.Map(new Rect(a.x + a.width / 2 - ms / 2, a.y + 104, ms, ms), maps[Mathf.Clamp(pick, 0, maps.Length - 1)]);
                float sy = a.yMax - 136;
                MenuUi.Label(p, a.x + 22, sy, 160, "Lap record"); MenuUi.Label(p, a.x + 22 + (a.width - 44) / 2, sy, 160, "Your best");
                p.Text(new Rect(a.x + 22, sy + 15, a.width / 2 - 30, 28), f != null && f.record != "" ? f.record : "–", HudFont.JB600, 19, HudLayout.Text, TextAnchor.MiddleLeft);
                int bestEra; float best = RaceSettings.BestAny(Slug(e), out bestEra);
                p.Text(new Rect(a.x + 22 + (a.width - 44) / 2, sy + 15, a.width / 2 - 30, 28), Time_(best), HudFont.JB600, 19, best > 0 ? HudLayout.Accent : HudLayout.Text, TextAnchor.MiddleLeft);
            }
            if (MenuUi.Button(p, new Rect(a.x + 22, a.yMax - 72, a.width - 44, 50), e == null ? "No circuits" : "Change circuit", false, e != null)) Go(Screen_.Tracks);
            // the car
            var era = GameData.Era(RaceSettings.Era); var team = GameData.Team(RaceSettings.Team);
            MenuUi.Label(p, b.x + 22, b.y + 18, 200, "Car");
            p.Text(new Rect(b.x + 22, b.y + 36, b.width - 44, 36), team.name + " · " + era.label, HudFont.BC700, 28, HudLayout.Text, TextAnchor.MiddleLeft);
            p.Text(new Rect(b.x + 22, b.y + 72, b.width - 44, 20), era.engine + " · " + team.engine + " power · no. " + team.number, HudFont.B600, 13, HudLayout.Soft, TextAnchor.MiddleLeft);
            var st = new Rect(b.x + 22, b.y + 104, b.width - 44, Mathf.Max(120, b.height - 260)); Studio(st, 10); p.Border(st, MenuUi.Line, 10, 1);
            {
                float sy = b.yMax - 136, q = (b.width - 44) / 3;
                string[,] s3 = { { "Weight", Mathf.RoundToInt(era.mass) + " kg" }, { "Power", Mathf.RoundToInt((era.power + era.ers) / 745.7f) + " hp" }, { "Top speed", era.top } };
                for (int i = 0; i < 3; i++) { MenuUi.Label(p, b.x + 22 + i * q, sy, q, s3[i, 0]); p.Text(new Rect(b.x + 22 + i * q, sy + 15, q, 28), s3[i, 1], HudFont.JB600, 19, HudLayout.Text, TextAnchor.MiddleLeft); }
            }
            if (MenuUi.Button(p, new Rect(b.x + 22, b.yMax - 72, b.width - 44, 50), "Change car", false)) { carsBack = Screen_.Weekend; Go(Screen_.Cars); }
            // the session
            float x = side.x + 22, sy2 = side.y + 18;
            p.Text(new Rect(x, sy2, rw - 44, 30), "Session", HudFont.BC700, 22, HudLayout.Text, TextAnchor.MiddleLeft); sy2 += 42;
            int c = MenuUi.Chips(p, x, sy2, new[] { "Practice", "Hot laps", "Time trial" }, RaceSettings.Session); if (c >= 0) RaceSettings.Session = c; sy2 += 36;
            c = MenuUi.Chips(p, x, sy2, new[] { "Race" }, RaceSettings.Session == 3 ? 0 : -1); if (c >= 0) RaceSettings.Session = 3; sy2 += 46;
            bool isRace = RaceSettings.Session == 3;
            if (isRace)
            {
                MenuUi.Label(p, x, sy2, 200, "Race length"); sy2 += 18;
                c = MenuUi.Chips(p, x, sy2, new[] { "3", "5", "10", "Quarter", "Full" }, RaceSettings.RaceLaps); if (c >= 0) RaceSettings.RaceLaps = c; sy2 += 40;
                MenuUi.Label(p, x, sy2, 200, "Other drivers"); sy2 += 18;
                c = MenuUi.Chips(p, x, sy2, RaceSettings.LevelNames, RaceSettings.AiLevel); if (c >= 0) RaceSettings.AiLevel = c; sy2 += 40;
                MenuUi.Label(p, x, sy2, 200, "Cars · you start"); sy2 += 18;
                c = MenuUi.Chips(p, x, sy2, new[] { "10", "20" }, RaceSettings.GridSize); if (c >= 0) RaceSettings.GridSize = c;
                c = MenuUi.Chips(p, x + MenuUi.ChipWidth(p, "10") + MenuUi.ChipWidth(p, "20") + 26, sy2, new[] { "Pole", "Middle", "Back" }, RaceSettings.GridStart); if (c >= 0) RaceSettings.GridStart = c;
                sy2 += 40;
            }
            MenuUi.Label(p, x, sy2, 200, "Assists"); sy2 += 18;
            c = MenuUi.Chips(p, x, sy2, new[] { "Lots", "Some", "None" }, RaceSettings.Assists); if (c >= 0) RaceSettings.Assists = c; sy2 += 46;
            MenuUi.Label(p, x, sy2, 200, "Gears"); sy2 += 18;
            c = MenuUi.Chips(p, x, sy2, new[] { "Automatic", "Manual" }, RaceSettings.AutoGears ? 0 : 1); if (c >= 0) RaceSettings.AutoGears = c == 0; sy2 += 46;
            if (!isRace) { MenuUi.Label(p, x, sy2, 200, "Weather"); sy2 += 18; MenuUi.Chips(p, x, sy2, new[] { "Dry", "Rain · coming" }, 0, new[] { true, false }); sy2 += 48; }
            int s = RaceSettings.Session;
            var fct = e != null ? GameData.Circuit(Slug(e)) : null;
            string about = s == 3 ? "Race: " + RaceSettings.LapsFor(RaceSettings.RaceLaps, fct != null ? fct.raceLaps : 20) + " laps against " + (RaceSettings.GridSize == 0 ? 9 : 19) + " cars, from " + (RaceSettings.GridStart == 0 ? "pole" : RaceSettings.GridStart == 1 ? "the middle of the grid" : "the back") + ". Five red lights, then go when they all go out. Moving early, running wide four times or ramming a car costs 5 seconds."
                : s == 2 ? "Time trial: you start rolling, 350 m before the line. Every lap starts with a full battery, and your best lap is saved for this circuit and this car."
                : s == 1 ? "Hot laps: you start rolling, 350 m before the line at 200 km/h. Every lap is timed."
                : "Practice: you start on the grid. Laps are timed from the line. The pit lane has an 80 km/h limiter.";
            about += RaceSettings.Assists == 0 ? " Lots: ABS, traction control and the stability help." : RaceSettings.Assists == 1 ? " Some: ABS and traction control." : " None: no ABS, no traction control, no stability help.";
            p.Text(new Rect(x, sy2, rw - 44, 110), about, HudFont.B500, 13, HudLayout.Soft, TextAnchor.UpperLeft);
            if (e != null && side.yMax - 150 > sy2 + 96)
            {
                float t = RaceSettings.Best(Slug(e), RaceSettings.Era, s == 2);
                MenuUi.Label(p, x, side.yMax - 132, rw - 44, (s == 2 ? "Your time trial best" : "Your best") + " · this car");
                p.Text(new Rect(x, side.yMax - 116, rw - 44, 30), Time_(t), HudFont.JB600, 22, t > 0 ? HudLayout.Accent : HudLayout.Muted, TextAnchor.MiddleLeft);
            }
            if (MenuUi.Button(p, new Rect(x, side.yMax - 72, rw - 44, 50), "Start", true, e != null)) StartWeekend();
        }

        // ---- circuits ----
        const float CardH = 66, CardGap = 8;
        int cols = 3, perPage = 27;
        int PageOf(int i) { return perPage > 0 ? i / perPage : 0; }
        void Tracks(float W, float H)
        {
            float y = Header(W, "Choose a circuit", true), bottom = H - 24, ph = bottom - y;
            var T = tracks.tracks; if (T.Length == 0) { Go(Screen_.Weekend); return; }
            pick = Mathf.Clamp(pick, 0, T.Length - 1);
            float dw = Mathf.Min(420, W * 0.34f), lw = W - 48 - dw - 16;
            var list = new Rect(24, y, lw, ph); var det = new Rect(list.xMax + 16, y, dw, ph);
            MenuUi.Panel(p, list); MenuUi.Panel(p, det);
            cols = Mathf.Max(2, Mathf.FloorToInt((lw - 24 + CardGap) / 250f));
            float cwid = (lw - 24 - (cols - 1) * CardGap) / cols;
            int rows = Mathf.Max(1, Mathf.FloorToInt((ph - 24 - 44 + CardGap) / (CardH + CardGap)));
            if (rows * cols >= T.Length) rows = Mathf.Max(1, Mathf.FloorToInt((ph - 24 + CardGap) / (CardH + CardGap)));
            perPage = rows * cols; int pages = (T.Length + perPage - 1) / perPage; page = Mathf.Clamp(page, 0, pages - 1);
            for (int k = 0; k < perPage; k++)
            {
                int i = page * perPage + k; if (i >= T.Length) break;
                var r = new Rect(list.x + 12 + (k % cols) * (cwid + CardGap), list.y + 12 + (k / cols) * (CardH + CardGap), cwid, CardH);
                bool on = i == pick, hov = p.Hover(r); var f = Fact(T[i]);
                p.Fill(r, HudLayout.Hex(on ? 0x1A1F2B : hov ? 0x161A23 : 0x11141B), 9); p.Border(r, on || hov ? HudLayout.Accent : MenuUi.Line, 9, 1);
                p.Map(new Rect(r.x + 8, r.y + 8, 50, 50), maps[i]);
                p.Text(new Rect(r.x + 68, r.y + 10, r.width - 76, 22), f != null ? f.shortName : T[i].name, HudFont.B600, 15, HudLayout.Text, TextAnchor.MiddleLeft);
                MenuUi.Label(p, r.x + 68, r.y + 36, r.width - 76, (f != null ? f.country : "Track Builder") + " · " + T[i].km.ToString("0.0") + " km", 11);
                if (f != null && f.night) { float nw = p.Width("NIGHT", HudFont.B700, 9) + 12; var nr = new Rect(r.xMax - nw - 8, r.y + 8, nw, 16); p.Fill(nr, HudLayout.Hex(0x1B2440), 8); p.Text(nr, "NIGHT", HudFont.B700, 9, HudLayout.Hex(0x9DB8FF), TextAnchor.MiddleCenter); }
                if (p.Hit(r)) { if (on) { Choose(); return; } pick = i; }
            }
            if (pages > 1)
            {
                float py = list.yMax - 42, px = list.x + 12;
                if (MenuUi.Chip(p, new Rect(px, py, 90, 30), "‹ Earlier", false, page > 0)) page--;
                p.Text(new Rect(px + 98, py, 120, 30), "Page " + (page + 1) + " of " + pages, HudFont.B600, 13, HudLayout.Soft, TextAnchor.MiddleCenter);
                if (MenuUi.Chip(p, new Rect(px + 226, py, 76, 30), "Later ›", false, page < pages - 1)) page++;
            }
            // the chosen one, in full
            var e = T[pick]; var fe = Fact(e); float x = det.x + 22, w = det.width - 44, sy = det.y + 16;
            p.Text(new Rect(x, sy, w, 36), e.name, HudFont.BC700, 28, HudLayout.Text, TextAnchor.MiddleLeft); sy += 38;
            p.Text(new Rect(x, sy, w, 20), Place(e) + (fe != null && fe.street ? " · street circuit" : ""), HudFont.B600, 13, HudLayout.Soft, TextAnchor.MiddleLeft); sy += 30;
            float room = det.yMax - 72 - 12 - sy - 3 * 54 - 64, ms = Mathf.Clamp(room, 110, w);
            p.Map(new Rect(x + w / 2 - ms / 2, sy, ms, ms), maps[pick]); sy += ms + 10;
            int bestEra; float best = RaceSettings.BestAny(Slug(e), out bestEra);
            string[,] stats = {
                { "Lap length", e.km.ToString("0.000") + " km" }, { "Corners", e.corners.ToString() },
                { "Lap record", fe != null && fe.record != "" ? fe.record + "  (" + fe.recordYear + ")" : "–" }, { "Your best", best > 0 ? RaceSession.Fmt(best) + "  (" + GameData.Era(bestEra).label + ")" : "–" },
                { "Race distance", (fe != null ? fe.raceLaps : Mathf.CeilToInt(305f / Mathf.Max(1, e.km))) + " laps" }, { "Height difference", Mathf.RoundToInt(e.climb) + " m" },
            };
            for (int i = 0; i < 6; i++)
            {
                float sx = x + (i % 2) * (w / 2), yy = sy + (i / 2) * 54;
                MenuUi.Label(p, sx, yy, w / 2, stats[i, 0]);
                p.Text(new Rect(sx, yy + 15, w / 2, 28), stats[i, 1], HudFont.JB600, i == 2 || i == 3 ? 15 : 18, i == 3 && best > 0 ? HudLayout.Accent : HudLayout.Text, TextAnchor.MiddleLeft);
            }
            sy += 3 * 54 + 2;
            MenuUi.Label(p, x, sy, w, "Time of day" + (fe != null ? " · really a " + (fe.night ? "night" : "day") + " race" : "")); sy += 18;
            int c = MenuUi.Chips(p, x, sy, new[] { "As in real life", "Day", "Night" }, RaceSettings.TimeOfDay); if (c >= 0) RaceSettings.TimeOfDay = c;
            if (MenuUi.Button(p, new Rect(x, det.yMax - 72, w, 50), "Choose " + (fe != null ? fe.shortName : e.name), true)) Choose();
        }
        void Choose() { var e = Picked; if (e != null) RaceSettings.LastTrack = e.scene; PlayerPrefs.Save(); Go(Screen_.Weekend); }

        // ---- garage: the car's era and the team ----
        void Cars(float W, float H)
        {
            float y = Header(W, "Garage · choose your car", true), bottom = H - 24, ph = bottom - y;
            float lw = Mathf.Min(310, W * 0.24f), rw = Mathf.Min(330, W * 0.25f), mw = W - 48 - lw - rw - 32;
            var left = new Rect(24, y, lw, ph); var mid = new Rect(left.xMax + 16, y, mw, ph); var right = new Rect(mid.xMax + 16, y, rw, ph);
            MenuUi.Panel(p, left); MenuUi.Panel(p, mid); MenuUi.Panel(p, right);
            int eraNow = RaceSettings.Era; string teamNow = RaceSettings.Team; bool changed = false;
            // eras
            MenuUi.Label(p, left.x + 22, left.y + 18, 200, "Era");
            float rh = Mathf.Clamp((ph - 52) / GameData.Eras.Length - 8, 50, 74), iy = left.y + 42;
            foreach (var e in GameData.Eras)
            {
                var r = new Rect(left.x + 12, iy, lw - 24, rh); bool on = e.year == eraNow, hov = p.Hover(r);
                p.Fill(r, HudLayout.Hex(on ? 0x1A1F2B : hov ? 0x161A23 : 0x11141B), 9); p.Border(r, on || hov ? HudLayout.Accent : MenuUi.Line, 9, 1);
                p.Text(new Rect(r.x + 14, r.y + rh / 2 - 22, r.width - 28, 26), e.label, HudFont.BC700, 22, on ? HudLayout.Accent : HudLayout.Text, TextAnchor.MiddleLeft);
                p.Text(new Rect(r.x + 14, r.y + rh / 2 + 4, r.width - 28, 18), e.engine, HudFont.B500, 12, HudLayout.Soft, TextAnchor.MiddleLeft);
                if (p.Hit(r) && !on) { RaceSettings.Era = e.year; changed = true; }
                iy += rh + 8;
            }
            // teams
            MenuUi.Label(p, right.x + 22, right.y + 18, 200, "Team · all made up");
            float th = Mathf.Clamp((ph - 52) / GameData.Teams.Length - 6, 38, 56); iy = right.y + 42;
            foreach (var t in GameData.Teams)
            {
                var r = new Rect(right.x + 12, iy, rw - 24, th); bool on = t.name == teamNow, hov = p.Hover(r);
                p.Fill(r, HudLayout.Hex(on ? 0x1A1F2B : hov ? 0x161A23 : 0x11141B), 9); p.Border(r, on || hov ? HudLayout.Accent : MenuUi.Line, 9, 1);
                // the livery's three colours
                p.Fill(new Rect(r.x + 10, r.y + 8, 14, th - 16), t.body, 3); p.Fill(new Rect(r.x + 26, r.y + 8, 7, th - 16), t.accent, 2); p.Fill(new Rect(r.x + 35, r.y + 8, 4, th - 16), t.stripe, 2);
                p.Text(new Rect(r.x + 50, r.y, r.width - 150, th), t.name, HudFont.B700, 15, HudLayout.Text, TextAnchor.MiddleLeft);
                p.Text(new Rect(r.xMax - 112, r.y, 102, th), "no. " + t.number + " · " + t.engine, HudFont.B500, 12, HudLayout.Soft, TextAnchor.MiddleRight);
                if (p.Hit(r) && !on) { RaceSettings.Team = t.name; changed = true; }
                iy += th + 6;
            }
            if (changed) { PlayerPrefs.Save(); if (garage != null) garage.Build(RaceSettings.Era, RaceSettings.Team); }
            // the car
            var era = GameData.Era(RaceSettings.Era); var team = GameData.Team(RaceSettings.Team);
            float x = mid.x + 22, w = mid.width - 44;
            p.Text(new Rect(x, mid.y + 16, w, 36), team.name + " · " + era.label, HudFont.BC700, 28, HudLayout.Text, TextAnchor.MiddleLeft);
            p.Text(new Rect(x, mid.y + 52, w, 20), team.about, HudFont.B500, 13, HudLayout.Soft, TextAnchor.MiddleLeft);
            float infoH = 168, sh = Mathf.Max(140, mid.height - 84 - infoH - 16);
            var st = new Rect(x, mid.y + 84, w, sh); Studio(st, 10); p.Border(st, MenuUi.Line, 10, 1);
            float sy = st.yMax + 14;
            p.Text(new Rect(x, sy, w, 40), era.about, HudFont.B500, 14, HudLayout.Text, TextAnchor.UpperLeft); sy += 48;
            string[,] stats = { { "Weight", Mathf.RoundToInt(era.mass) + " kg" }, { "Power", Mathf.RoundToInt((era.power + era.ers) / 745.7f) + " hp" }, { "Top speed", era.top }, { "0–100 km/h", era.zeroTo100 }, { "Battery", !era.battery ? "None" : Mathf.RoundToInt(era.ers / 1000f) + " kW" } };
            float q = w / 5;
            for (int i = 0; i < 5; i++)
            {
                MenuUi.Label(p, x + i * q, sy, q, stats[i, 0]);
                p.Text(new Rect(x + i * q, sy + 15, q, 26), stats[i, 1], HudFont.JB600, 17, HudLayout.Text, TextAnchor.MiddleLeft);
            }
            sy += 52;
            p.Text(new Rect(x, sy, w, 20), "The model, weight, power, downforce and grip change with the era. " + (era.activeAero ? "The wings open on the straights." : "No active wings: a smaller gain on the straights."), HudFont.B500, 12, HudLayout.Muted, TextAnchor.MiddleLeft);
        }

        // ---- settings ----
        static readonly string[] Tabs = { "Driving", "Graphics", "Sound", "Controls" };
        void Settings(float W, float H)
        {
            float y = Header(W, "Settings · controls", true);
            float pw = Mathf.Min(1040, W - 48), x0 = W / 2 - pw / 2;
            int c = MenuUi.Chips(p, x0, y, Tabs, tab); if (c >= 0) { tab = c; bindAction = -1; }
            var a = new Rect(x0, y + 44, pw, H - y - 44 - 24); MenuUi.Panel(p, a);
            float x = a.x + 22, sy = a.y + 20, w = pw - 44;
            if (tab == 0)
            {
                MenuUi.Label(p, x, sy, 300, "Assists"); sy += 18;
                c = MenuUi.Chips(p, x, sy, new[] { "Lots", "Some", "None" }, RaceSettings.Assists); if (c >= 0) RaceSettings.Assists = c; sy += 36;
                p.Text(new Rect(x, sy, w, 20), RaceSettings.Assists == 0 ? "ABS, traction control and the stability help." : RaceSettings.Assists == 1 ? "ABS and traction control." : "No ABS, no traction control, no stability help.", HudFont.B500, 13, HudLayout.Soft, TextAnchor.MiddleLeft); sy += 34;
                MenuUi.Label(p, x, sy, 300, "Gears"); sy += 18;
                c = MenuUi.Chips(p, x, sy, new[] { "Automatic", "Manual (" + RLKeys.Names(RLAction.GearUp) + " up, " + RLKeys.Names(RLAction.GearDown) + " down)" }, RaceSettings.AutoGears ? 0 : 1); if (c >= 0) RaceSettings.AutoGears = c == 0; sy += 50;
                MenuUi.Label(p, x, sy, 300, "On-screen display size"); sy += 18;
                c = MenuUi.Chips(p, x, sy, new[] { "Normal", "Large", "Extra large" }, RaceSettings.HudSize); if (c >= 0) RaceSettings.HudSize = c; sy += 50;
                MenuUi.Label(p, x, sy, 300, "On-screen info"); sy += 18;
                c = MenuUi.Chips(p, x, sy, new[] { "Full", "Simple" }, RaceSettings.FullHud ? 0 : 1); if (c >= 0) RaceSettings.FullHud = c == 0; sy += 36;
                p.Text(new Rect(x, sy, w, 20), RLKeys.Names(RLAction.Info) + " switches between them while driving.", HudFont.B500, 13, HudLayout.Soft, TextAnchor.MiddleLeft);
            }
            else if (tab == 1)
            {
                MenuUi.Label(p, x, sy, 300, "Quality"); sy += 18;
                c = MenuUi.Chips(p, x, sy, RaceSettings.GraphicsNames, RaceSettings.Graphics); if (c >= 0) { RaceSettings.Graphics = c; RLCore.Get().ApplyGraphics(); } sy += 38;
                for (int i = 0; i < 3; i++) { p.Text(new Rect(x, sy, w, 20), RaceSettings.GraphicsAbout[i], HudFont.B500, 13, i == RaceSettings.Graphics ? HudLayout.Text : HudLayout.Muted, TextAnchor.MiddleLeft); sy += 22; }
                sy += 20;
                MenuUi.Label(p, x, sy, 300, "Frame rate"); sy += 18;
                c = MenuUi.Chips(p, x, sy, new[] { "Match the screen (smooth)", "As fast as it can" }, RaceSettings.VSync ? 0 : 1); if (c >= 0) { RaceSettings.VSync = c == 0; RLCore.Get().ApplyGraphics(); } sy += 50;
                MenuUi.Label(p, x, sy, 300, "Frames-per-second counter"); sy += 18;
                c = MenuUi.Chips(p, x, sy, new[] { "Off", "On" }, RaceSettings.ShowFps ? 1 : 0); if (c >= 0) RaceSettings.ShowFps = c == 1; sy += 38;
                p.Text(new Rect(x, sy, w, 40), "The counter sits at the bottom of the screen: green at 55 or more, amber from 30, red below. If it's amber or red while driving, go down a quality step.", HudFont.B500, 13, HudLayout.Soft, TextAnchor.UpperLeft);
            }
            else if (tab == 2)
            {
                var core = RLCore.Get();
                MenuUi.Label(p, x, sy, 300, "Music"); sy += 20;
                int v = MenuUi.Stepper(p, x, sy, RaceSettings.MusicVolume); if (v != RaceSettings.MusicVolume) RaceSettings.MusicVolume = v; sy += 52;
                MenuUi.Label(p, x, sy, 300, "Overall volume"); sy += 20;
                v = MenuUi.Stepper(p, x, sy, RaceSettings.SoundVolume); if (v != RaceSettings.SoundVolume) { RaceSettings.SoundVolume = v; core.ApplySound(); } sy += 56;
                p.Text(new Rect(x, sy, w, 110), core.HasMusic
                    ? core.MusicCount + " music files found. The three menu songs take turns here; the garage, the loading screen, the grid and the pause menu have their own. There is no music while you drive."
                    : "No music files yet. Export the pieces from MuseScore (File > Export > MP3 or OGG) and put them in the project's Assets/RaceLimit/Resources/RL_Music folder. The game finds each one by its name (Main Theme, Full Throttle, Dusk, Garage, Loading, Formation, Pause, Replay, Podium, Win Sting, Pole Position, Race Finish, Retired). There is no music while you drive.",
                    HudFont.B500, 13, HudLayout.Soft, TextAnchor.UpperLeft);
            }
            else Controls(a);
        }

        void Controls(Rect a)
        {
            float x = a.x + 22, sy = a.y + 18, kw = 118, colL = Mathf.Min(560, a.width * 0.56f);
            MenuUi.Label(p, x, sy, 200, "Keyboard · click a key to change it"); MenuUi.Label(p, x + colL - 2 * kw - 8, sy, kw, "Key"); MenuUi.Label(p, x + colL - kw, sy, kw, "Second key"); sy += 20;
            float rh = Mathf.Clamp((a.yMax - 16 - sy) / RLKeys.Count, 22, 32);
            for (int i = 0; i < RLKeys.Count; i++)
            {
                p.Text(new Rect(x, sy, colL - 2 * kw - 16, rh), RLKeys.Labels[i], HudFont.B500, 14, HudLayout.Text, TextAnchor.MiddleLeft);
                for (int s = 0; s < 2; s++)
                {
                    var r = new Rect(x + colL - (2 - s) * kw - (s == 0 ? 8 : 0), sy + 2, kw - 8, rh - 4); bool waiting = bindAction == i && bindSlot == s;
                    if (MenuUi.Chip(p, r, waiting ? "Press a key…" : RLKeys.Name(RLKeys.Get((RLAction)i, s)), waiting)) { bindAction = i; bindSlot = s; }
                }
                sy += rh;
            }
            // the controller, and help
            float rx = x + colL + 28, rw = a.xMax - 22 - rx; sy = a.y + 18;
            MenuUi.Label(p, rx, sy, rw, "Changing a key"); sy += 20;
            p.Text(new Rect(rx, sy, rw, 76), "Click a key, then press the new one. Esc cancels; Backspace clears it. A key does one thing: giving it to a new action takes it off the old one.", HudFont.B500, 13, HudLayout.Soft, TextAnchor.UpperLeft); sy += 84;
            if (MenuUi.Button(p, new Rect(rx, sy, 190, 40), "Back to the usual keys", false)) { RLKeys.ResetAll(); bindAction = -1; }
            sy += 62;
            MenuUi.Label(p, rx, sy, rw, "Controller"); sy += 22;
            string[,] pad = { { "Right trigger", "Throttle" }, { "Left trigger", "Brake" }, { "Left stick", "Steer" }, { "Bumpers", "Gear up / down" }, { "A", "Overtake boost" }, { "Y", "Camera" }, { "D-pad up / down", "Brake bias" }, { "Back", "Back on track" }, { "Start", "Pause" }, { "In menus", "D-pad or stick, A choose, B back" } };
            for (int i = 0; i < pad.GetLength(0) && sy + 22 < a.yMax; i++)
            {
                p.Text(new Rect(rx, sy, 130, 22), pad[i, 0], HudFont.JB600, 12, HudLayout.Text, TextAnchor.MiddleLeft);
                p.Text(new Rect(rx + 136, sy, rw - 136, 22), pad[i, 1], HudFont.B500, 13, HudLayout.Soft, TextAnchor.MiddleLeft);
                sy += 24;
            }
        }

        // the next key pressed goes to the action that's waiting for one
        void CatchKey()
        {
            if (bindAction < 0) return;
            var e = Event.current; if (e == null || e.type != EventType.KeyDown || e.keyCode == KeyCode.None) return;
            if (e.keyCode == KeyCode.Backspace || e.keyCode == KeyCode.Delete) RLKeys.Set((RLAction)bindAction, bindSlot, KeyCode.None);
            else if (e.keyCode != KeyCode.Escape) RLKeys.Set((RLAction)bindAction, bindSlot, e.keyCode);
            bindAction = -1; PlayerPrefs.Save(); e.Use();
        }

        // ---- start: the loading screen while the circuit loads ----
        void StartWeekend()
        {
            var e = Picked; if (e == null) return;
            if (!Application.CanStreamedLevelBeLoaded(e.scene)) { Debug.LogError("RaceLimit: the scene " + e.scene + " isn't in the build settings; build it again from the RaceLimit menu"); return; }
            RaceSettings.LastTrack = e.scene; PlayerPrefs.Save();
            RaceSettings.FromMenu = true;
            loadingTrack = e; loadingMap = maps[Mathf.Clamp(pick, 0, maps.Length - 1)];
            tip = GameData.Tips[Random.Range(0, GameData.Tips.Length)];
            screen = Screen_.Loading; loadStart = Time.unscaledTime;
            RLCore.Get().Music(MusicMood.Loading);
            loading = SceneManager.LoadSceneAsync(e.scene);
            if (loading != null) loading.allowSceneActivation = false; else SceneManager.LoadScene(e.scene);
        }

        void Loading(float W, float H)
        {
            var e = loadingTrack ?? Picked; if (e == null) return;
            var f = Fact(e); bool night = RLDayNight.IsNight(Slug(e), RaceSettings.TimeOfDay);
            float ms = Mathf.Min(H - 300, W * 0.36f), cx = W * 0.5f, top = (H - ms - 150) / 2;
            float lx = cx - ms - 40, rx = cx + 40, rw = Mathf.Min(460, W - rx - 40);
            p.Map(new Rect(lx, top, ms, ms), loadingMap ?? maps[Mathf.Clamp(pick, 0, maps.Length - 1)]);
            MenuUi.Label(p, rx, top + 6, rw, RaceSettings.SessionName(RaceSettings.Session) + " · " + (night ? "night" : "day"), 12);
            p.Text(new Rect(rx, top + 26, rw, 54), e.name, HudFont.BC700, 44, HudLayout.Text, TextAnchor.MiddleLeft);
            p.Text(new Rect(rx, top + 82, rw, 22), Place(e), HudFont.B600, 15, HudLayout.Soft, TextAnchor.MiddleLeft);
            string[,] stats = { { "Lap length", e.km.ToString("0.000") + " km" }, { "Corners", e.corners.ToString() }, { "Lap record", f != null && f.record != "" ? f.record : "–" }, { "Your best · this car", Time_(RaceSettings.Best(Slug(e), RaceSettings.Era, RaceSettings.Session == 2)) } };
            for (int i = 0; i < 4; i++)
            {
                float sx = rx + (i % 2) * (rw / 2), sy = top + 124 + (i / 2) * 58;
                MenuUi.Label(p, sx, sy, rw / 2, stats[i, 0]);
                p.Text(new Rect(sx, sy + 15, rw / 2, 28), stats[i, 1], HudFont.JB600, 19, HudLayout.Text, TextAnchor.MiddleLeft);
            }
            MenuUi.Label(p, rx, top + 250, rw, "Car");
            p.Text(new Rect(rx, top + 266, rw, 26), CarName(), HudFont.B600, 16, HudLayout.Text, TextAnchor.MiddleLeft);
            // the tip, and how far along
            float by = top + ms + 36, bw = Mathf.Min(900, W - 80), bx = W / 2 - bw / 2;
            var tipBox = new Rect(bx, by, bw, 62); MenuUi.Panel(p, tipBox);
            MenuUi.Pill(p, bx + 16, by + 21, "Tip", HudLayout.Accent, MenuUi.Dark);
            p.Text(new Rect(bx + 66, by, bw - 82, 62), tip, HudFont.B500, 15, HudLayout.Text, TextAnchor.MiddleLeft);
            float prog = loading != null ? Mathf.Clamp01(loading.progress / 0.9f) : 0.3f;
            p.Fill(new Rect(bx, by + 82, bw, 6), HudLayout.Hex(0x1C2230), 3); p.Fill(new Rect(bx, by + 82, Mathf.Max(6, bw * prog), 6), HudLayout.Accent, 3);
            p.Text(new Rect(bx, by + 94, bw, 22), prog >= 1 ? "Ready" : "Loading the circuit…", HudFont.B600, 12, HudLayout.Muted, TextAnchor.MiddleLeft);
        }

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

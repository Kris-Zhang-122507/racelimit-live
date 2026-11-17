using UnityEngine;
using System.Collections.Generic;

namespace RaceLimit
{
    // A race: the grid, the five start lights (solid red, never flashing), the other cars, the running order, laps,
    // penalties (jump start, track limits, causing a collision), the blue flag, the chequered flag and the results.
    // RaceSession adds one of these when the session is a race. Not here yet: formation lap, safety car, pit stops.
    public class RaceDirector : MonoBehaviour
    {
        public static RaceDirector Active;
        public enum Phase { Grid, Lights, Racing, Finished }
        public Phase phase = Phase.Grid;
        public int laps = 5, lightsOn;
        public float raceT;                    // seconds since the lights went out
        public AiCar[] cars = new AiCar[0];
        public int playerPos = 1, fieldSize = 1;
        public float playerPenalty; public int limitStrikes; public bool jumpStart, playerFinished; public float playerFinishT = -1;
        public string flag; float flagUntil;   // "blue", "green", "chequered"

        RaceSession session; TrackInfo track; RaceCar player; RaceHud hud; ImguiPainter painter;
        float[] line, vline; float L, half; int N;
        float phaseT, goDelay, cf = 1f, accP = 662500f, accMass = 800f, accGrip = 1f, dragK = 0.000966f;
        Vector3 gridPos; float playerProg, playerLat, playerV; int playerLapSeen; bool raceOver; float lastContact = -99, finishedAt = -1, lastBlue = -99;
        int playerSlot;
        readonly List<Row> order = new List<Row>();
        class Row { public AiCar ai; public float prog, time, best, pen; public bool done; public string code, team; public Color col; public bool you; }

        static readonly string[] Drivers = { "KAI", "ROS", "VEL", "MAR", "KES", "TRE", "NOV", "AST", "AXI", "OMR", "HAL", "CYO", "VOR", "TEX", "ORB", "ITA", "MER", "IDA", "BRA", "VOX" };
        static readonly float[] LevelPace = { 0.88f, 0.93f, 0.965f, 0.995f };

        public void Setup(RaceSession s)
        {
            Active = this; session = s; track = s.track; player = s.car; hud = FindAnyObjectByType<RaceHud>();
            var d = track.data; N = track.N; L = track.length; half = d.half;
            var fact = GameData.Circuit(d.slug);
            laps = RaceSettings.LapsFor(RaceSettings.RaceLaps, fact != null ? fact.raceLaps : 20);
            BuildLine();
            // how this era's car compares with the 2026 one the line's speeds were worked out for
            var garage = player.GetComponent<CarGarage>(); int era = garage != null && garage.era != 0 ? garage.era : RaceSettings.Era;
            var e = GameData.Era(era);
            cf = Mathf.Sqrt(e.grip * (0.4f + 0.6f * e.downforce * 800f / e.mass));
            accP = e.power + e.ers * 0.75f; accMass = e.mass; accGrip = e.grip; dragK = 0.000966f * e.drag * 800f / e.mass * (e.activeAero ? 1f : 1.12f);

            // the field: two cars for each team (the player has one of their own team's)
            int want = RaceSettings.GridSize == 0 ? 10 : 20; fieldSize = want;
            int myTeam = GameData.TeamIndex(RaceSettings.Team);
            var seats = new List<int>(); // team index for each other car
            if (want == 20) { for (int t = 0; t < GameData.Teams.Length; t++) { seats.Add(t); if (t != myTeam) seats.Add(t); } }
            else { for (int t = 0; t < GameData.Teams.Length && seats.Count < want - 1; t++) if (t != myTeam) seats.Add(t); }
            // quicker teams towards the front, with some luck
            var rnd = new System.Random(System.Environment.TickCount);
            var entries = new List<KeyValuePair<float, int>>();
            for (int k = 0; k < seats.Count; k++) entries.Add(new KeyValuePair<float, int>(seats[k] * 0.0028f + (float)rnd.NextDouble() * 0.012f, k));
            entries.Sort((a, b) => a.Key.CompareTo(b.Key));
            int total = seats.Count + 1;
            playerSlot = RaceSettings.GridStart == 0 ? 0 : RaceSettings.GridStart == 1 ? total / 2 : total - 1;
            float level = LevelPace[Mathf.Clamp(RaceSettings.AiLevel, 0, 3)];
            var list = new List<AiCar>(); var used = new Dictionary<int, int>();
            GameObject[] models = garage != null ? garage.eraModels : new GameObject[0]; int[] years = garage != null ? garage.eraYears : new int[0];
            int slot = 0;
            foreach (var en in entries)
            {
                if (slot == playerSlot) slot++;
                int t = seats[en.Value]; int nth; used.TryGetValue(t, out nth); used[t] = nth + 1;
                var go = new GameObject("AI " + GameData.Teams[t].name + " " + (nth + 1));
                var ai = go.AddComponent<AiCar>();
                ai.Setup(models, years, era, GameData.Teams[t], Drivers[(t * 2 + (t == myTeam ? 1 : nth)) % Drivers.Length], player.gameObject.layer);
                ai.skill = level * (1f - en.Key) * (0.997f + (float)rnd.NextDouble() * 0.006f);
                ai.launchDelay = 0.16f + (float)rnd.NextDouble() * (0.5f - RaceSettings.AiLevel * 0.07f);
                SlotPose(slot, out ai.s, out ai.lat); ai.v = 0; ai.Place(track, 0, 0);
                if (RaceSettings.Graphics == 0) foreach (var r in go.GetComponentsInChildren<Renderer>(true)) r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                list.Add(ai); slot++;
            }
            cars = list.ToArray();
            float ps, pl; SlotPose(playerSlot, out ps, out pl);
            player.Teleport(track.PoseAt(Mathf.RoundToInt(ps / L * N), pl, 0.45f));
            gridPos = player.transform.position; playerProg = ps; playerLat = pl;
            phase = Phase.Grid; phaseT = 0; goDelay = 0.7f + (float)rnd.NextDouble() * 1.8f;
            session.Say("Race · " + laps + " laps · you start P" + (playerSlot + 1) + " of " + total, 4f);
        }

        void OnDestroy() { if (Active == this) Active = null; }

        // grid slots: 8 m apart, staggered left and right, the first one 8 m behind the line
        void SlotPose(int k, out float s, out float lat) { s = -(8f + 8f * k); lat = (k % 2 == 0 ? 1f : -1f) * Mathf.Min(2.9f, half - 2.2f); }

        int IndexAt(float s) { float m = s % L; if (m < 0) m += L; return Mathf.Clamp(Mathf.FloorToInt(m / L * N), 0, N - 1); }

        // the racing line and its speeds: from the circuit's data, or (circuits from the Track Builder) worked out from its bends
        void BuildLine()
        {
            var d = track.data;
            if (d.line != null && d.vline != null && d.line.Length == N && d.vline.Length == N) { line = d.line; vline = d.vline; return; }
            line = new float[N]; vline = new float[N];
            float ds = L / N;
            for (int i = 0; i < N; i++)
            {
                Vector3 a = track.forward[track.Wrap(i - 6)], b = track.forward[track.Wrap(i + 6)];
                float k = Mathf.Deg2Rad * Vector3.Angle(a, b) / (12f * ds);
                vline[i] = Mathf.Min(92f, Mathf.Sqrt(30f / Mathf.Max(k, 0.0035f)));
            }
            for (int pass = 0; pass < 2; pass++)
            {
                for (int n = 2 * N; n >= 0; n--) { int i = n % N, j = (i + 1) % N; vline[i] = Mathf.Min(vline[i], Mathf.Sqrt(vline[j] * vline[j] + 2 * 36f * ds)); }
                for (int n = 0; n < 2 * N; n++) { int i = n % N, j = (i + 1) % N; vline[j] = Mathf.Min(vline[j], Mathf.Sqrt(vline[i] * vline[i] + 2 * 9f * ds)); }
            }
        }

        float Wrapped(float gap) { gap %= L; if (gap > L / 2) gap -= L; else if (gap < -L / 2) gap += L; return gap; }

        void FixedUpdate()
        {
            if (track == null || player == null) return;
            float dt = Time.fixedDeltaTime;
            // where the player is
            Vector3 pp = player.transform.position; int pi = session.idx;
            float along = track.Along(pp, pi); playerLat = track.Lateral(pp, pi);
            playerV = Vector3.Dot(player.body.linearVelocity, track.forward[pi]);
            int lapsDone = Mathf.Max(0, session.lap - 1);
            playerProg = session.lap <= 0 ? (along > L / 2 ? along - L : along) : lapsDone * L + along;

            phaseT += dt;
            if (phase == Phase.Grid) { if (phaseT > 3.5f) { phase = Phase.Lights; phaseT = 0; lightsOn = 0; } }
            else if (phase == Phase.Lights)
            {
                lightsOn = Mathf.Min(5, 1 + (int)phaseT);
                if (phaseT > 5f + goDelay) { phase = Phase.Racing; phaseT = 0; raceT = 0; lightsOn = 0; SetFlag("green", 2.5f); RLCore.Get().Music(MusicMood.None); foreach (var c in cars) c.lapStartT = 0; }
            }
            if (phase == Phase.Grid || phase == Phase.Lights)
            {
                if (!jumpStart && (pp - gridPos).magnitude > 0.8f) { jumpStart = true; playerPenalty += 5; session.Say("Jump start: 5 second penalty", 3.5f); }
                foreach (var c in cars) c.Place(track, dt, 0);
                Order();
                return;
            }
            raceT += dt;

            // ---- the other cars ----
            for (int a = 0; a < cars.Length; a++)
            {
                var c = cars[a]; int i = IndexAt(c.s);
                float want = Mathf.Clamp(line[i], -(half - 1.2f), half - 1.2f), vt = vline[i] * cf * c.skill;
                if (c.finished) vt = Mathf.Min(vt, 50f);                       // the lap back to the pits
                if (c.bump > 0) { c.bump -= dt; vt *= 0.9f; }
                // who's just ahead, and who's alongside
                float gapA = 70f, latA = 0, vA = 0; bool aheadIsPlayer = false, any = false, lapping = false;
                bool leftBusy = false, rightBusy = false; float push = 0;
                for (int b = -1; b < cars.Length; b++)
                {
                    if (b == a) continue;
                    float os = b < 0 ? playerProg : cars[b].s, ol = b < 0 ? playerLat : cars[b].lat, ov = b < 0 ? Mathf.Max(0, playerV) : cars[b].v;
                    float gap = Wrapped(os - c.s), dl = ol - c.lat;
                    if (gap > -7f && gap < 13f && Mathf.Abs(dl) < 4.6f && Mathf.Abs(dl) > 1.2f) { if (dl > 0) leftBusy = true; else rightBusy = true; }
                    if (Mathf.Abs(gap) < 5.8f && Mathf.Abs(dl) < 2.2f) push += (dl > 0 ? -1f : 1f) * (2.2f - Mathf.Abs(dl)); // right beside it: keep apart
                    if (gap > 0 && gap < gapA && Mathf.Abs(dl) < 2.15f) { gapA = gap; latA = ol; vA = ov; aheadIsPlayer = b < 0; any = true; }
                    // a car a lap ahead coming up behind: let it by
                    if (gap < 0 && gap > -28f && os - c.s > L * 0.5f && ov > c.v - 2) lapping = true;
                }
                float latRate;
                if (any)
                {
                    float closing = c.v - vA, need = 6.3f + Mathf.Max(0, closing) * 0.85f + (aheadIsPlayer ? 2.5f : 0);
                    if (gapA < 34f) vt *= 1.012f;                              // the tow
                    if (gapA < need + 8f && c.passSide == 0 && closing > -1.5f)
                    {
                        float roomL = (half - 1.2f) - (latA + 2.4f), roomR = (latA - 2.4f) + (half - 1.2f);
                        bool canL = roomL >= 0 && !leftBusy, canR = roomR >= 0 && !rightBusy;
                        if (canL || canR) { c.passSide = canL && (!canR || roomL > roomR) ? 1 : -1; c.passHold = 2.2f; }
                    }
                    if (Mathf.Abs(c.lat - latA) < 2.0f && gapA < need) vt = Mathf.Min(vt, Mathf.Max(0, vA + (gapA - 6.3f) * 1.4f));
                    if (c.passSide != 0) want = Mathf.Clamp(latA + c.passSide * 2.5f, -(half - 1.2f), half - 1.2f);
                    if (Mathf.Abs(c.lat - latA) < 1.9f && gapA < 5.6f) { if (!aheadIsPlayer) c.s -= (5.6f - gapA) * 0.5f; c.v = Mathf.Min(c.v, vA); }
                }
                else if (c.passSide != 0)
                {
                    c.passHold -= dt;
                    bool beside = c.passSide > 0 ? rightBusy : leftBusy;       // still next to the car it's passing
                    if (beside) { c.passHold = Mathf.Max(c.passHold, 0.6f); want = c.lat; }
                    else if (c.passHold <= 0) c.passSide = 0;
                    else want = c.lat;
                }
                if (lapping) { want = Mathf.Clamp(want + (want > 0 ? -2.6f : 2.6f), -(half - 1.2f), half - 1.2f); vt *= 0.94f; }
                if (push > 0) want = Mathf.Max(want, c.lat + Mathf.Min(1.5f, push * 2)); else if (push < 0) want = Mathf.Min(want, c.lat + Mathf.Max(-1.5f, push * 2));
                want = Mathf.Clamp(want, -(half - 1.0f), half - 1.0f);
                // off the line through a corner costs a little speed
                if (vline[i] < 70f) vt *= 1f - 0.05f * Mathf.Clamp01(Mathf.Abs(c.lat - line[i]) / 3f);
                // the launch
                if (raceT < c.launchDelay) vt = 0;
                float acc = Mathf.Min(12.5f * accGrip, accP / (accMass * Mathf.Max(c.v, 8f))) - dragK * c.v * c.v;
                c.v = c.v < vt ? Mathf.Min(vt, c.v + acc * dt) : Mathf.Max(vt, c.v - 42f * dt);
                latRate = Mathf.Clamp((want - c.lat) * 2.4f, -3.4f, 3.4f) * Mathf.Clamp01(Mathf.Max(c.v, c.passSide != 0 || push != 0 ? 5f : 0f) / 14f); // (it can still edge round a stopped car)
                c.lat += latRate * dt;
                float before = c.s; c.s += c.v * dt;
                // over the line
                int lb = Mathf.FloorToInt(before / L), la = Mathf.FloorToInt(c.s / L);
                if (la > lb && c.s > 0)
                {
                    float tCross = raceT - (c.s - la * L) / Mathf.Max(c.v, 1f);
                    if (la >= 1 && lb >= 0) { float lt = tCross - c.lapStartT; if (c.bestLap < 0 || lt < c.bestLap) c.bestLap = lt; }
                    c.lapStartT = tCross; c.lapsDone = la;
                    if (!c.finished && (la >= laps || raceOver)) { c.finished = true; c.finishTime = tCross; raceOver = true; }
                }
                c.Place(track, dt, latRate);
            }

            // ---- the player ----
            if (session.lap != playerLapSeen)
            {
                playerLapSeen = session.lap;
                if (!playerFinished && session.lap >= 2 && (lapsDone >= laps || raceOver)) FinishPlayer();
                else if (!playerFinished && lapsDone == laps - 1 && laps > 1) session.Say("Last lap", 2.5f);
            }
            Order();
            // blue flag: a car a lap ahead is right behind
            if (!playerFinished && Time.time - lastBlue > 1f)
            {
                lastBlue = Time.time;
                foreach (var c in cars) { float gap = Wrapped(c.s - playerProg); if (gap < 0 && gap > -45f && c.s - playerProg > L * 0.5f) { SetFlag("blue", 2.2f); break; } }
            }
            if (phase == Phase.Finished && finishedAt > 0 && Time.time - finishedAt > 3f && session.input != null) session.input.locked = true;
        }

        void FinishPlayer()
        {
            playerFinished = true; playerFinishT = raceT; raceOver = true; phase = Phase.Finished; finishedAt = Time.time;
            SetFlag("chequered", 6f); Order();
            var core = RLCore.Get();
            if (playerPos == 1) core.Sting("win sting"); else core.Sting("race finish");
            session.Say(playerPos == 1 ? "You win!" : "Finished P" + playerPos, 4f);
        }

        void SetFlag(string f, float secs) { flag = f; flagUntil = Time.time + secs; }

        // the running order: finished cars by their time (penalties added), the rest by how far they've got
        void Order()
        {
            order.Clear();
            foreach (var c in cars) order.Add(new Row { ai = c, prog = c.s, done = c.finished, time = c.finishTime + c.penalty, best = c.bestLap, code = c.code, team = c.team, col = c.colour, pen = c.penalty });
            var me = new Row { you = true, prog = playerProg, done = playerFinished, time = playerFinishT + playerPenalty, best = session.bestTraceLap > 0 ? session.bestTraceLap : -1, code = "YOU", team = RaceSettings.Team, col = GameData.Team(RaceSettings.Team).body, pen = playerPenalty };
            order.Add(me);
            // (once the player has finished, the cars still running are given the time they'd finish in)
            if (playerFinished) foreach (var r in order) if (!r.done && r.ai != null) { float left = Mathf.Max(0, (Mathf.Floor(r.prog / L) + 1) * L - r.prog); r.time = raceT + left / Mathf.Max(r.ai.v, 30f); r.done = true; }
            order.Sort((a, b) => a.done != b.done ? (a.done ? -1 : 1) : a.done ? a.time.CompareTo(b.time) : b.prog.CompareTo(a.prog));
            playerPos = order.IndexOf(me) + 1; fieldSize = order.Count;
        }

        // ---- penalties ----
        public void TrackLimits()
        {
            if (phase != Phase.Racing || playerFinished) return;
            limitStrikes++;
            if (limitStrikes <= 3) session.Say("Track limits: warning " + limitStrikes + " of 3", 2.4f);
            else { playerPenalty += 5; session.Say("Track limits: 5 second penalty", 3f); }
        }
        public static void Contact(AiCar ai, float speed)
        {
            var d = Active; if (d == null || d.phase != Phase.Racing || d.playerFinished) return;
            // the player ran into the back of another car, hard
            float gap = d.Wrapped(ai.s - d.playerProg);
            if (gap > 0 && speed > 7f && Time.time - d.lastContact > 12f) { d.lastContact = Time.time; d.playerPenalty += 5; d.session.Say("Causing a collision: 5 second penalty", 3.5f); }
        }

        // ---- what's on screen: the lights, position and lap, the order, the flag, the results ----
        static string Gap(float t) { return t < 0 ? "" : "+" + (t < 60 ? t.ToString("0.0") : RaceSession.Fmt(t)); }
        static readonly Color Red = HudLayout.Hex(0xE5252A), Off = HudLayout.Hex(0x23262E), Blue = HudLayout.Hex(0x2F7BFF), Green = HudLayout.Hex(0x2FD27A);

        void Update()
        {
            if (phase == Phase.Finished && finishedAt > 0 && Time.time - finishedAt > 3f && painter != null)
            {
                int dx, dy; bool submit, back; RLKeys.Nav(out dx, out dy, out submit, out back);
                painter.Navigate(dx, dy, submit);
            }
        }

        void OnGUI()
        {
            if (hud == null || track == null || session.paused) return;
            if (painter == null) painter = new ImguiPainter((f) => hud.FontFor(f));
            float scale = hud.hudSize * MenuUi.ScreenScale(); painter.scale = scale; painter.Opacity = 1;
            float W = Screen.width / scale, H = Screen.height / scale;
            var p = painter; bool paint = Event.current.type == EventType.Repaint;
            if (paint)
            {
                // the start lights: five, coming on one at a time, all going out together
                if (phase == Phase.Lights || (phase == Phase.Grid && phaseT > 1.5f))
                {
                    float lw = 5 * 46 + 22, lx = W / 2 - lw / 2, ly = H * 0.18f + 58;
                    p.Fill(new Rect(lx, ly, lw, 62), new Color(0.04f, 0.05f, 0.07f, 0.92f), 12); p.Border(new Rect(lx, ly, lw, 62), MenuUi.Line, 12, 1);
                    for (int k = 0; k < 5; k++) p.Fill(new Rect(lx + 16 + k * 46, ly + 12, 38, 38), k < lightsOn ? Red : Off, 19);
                }
                // position and lap
                {
                    string a = "P" + playerPos, b = " / " + fieldSize, lapTxt = phase == Phase.Racing || phase == Phase.Finished ? "LAP " + Mathf.Clamp(session.lap, 1, laps) + " / " + laps : laps + " LAPS";
                    float wa = p.Width(a, HudFont.BC700, 26), wb = p.Width(b, HudFont.B600, 13), wl = p.Width(lapTxt, HudFont.JB600, 13), pw = wa + wb + wl + 54, px = W / 2 - pw / 2, py = 74;
                    p.Fill(new Rect(px, py, pw, 36), new Color(0.07f, 0.085f, 0.115f, 0.9f), 10);
                    p.Text(new Rect(px + 14, py, wa + 2, 36), a, HudFont.BC700, 26, HudLayout.Accent, TextAnchor.MiddleLeft);
                    p.Text(new Rect(px + 16 + wa, py + 3, wb + 2, 33), b, HudFont.B600, 13, HudLayout.Muted, TextAnchor.MiddleLeft);
                    p.Text(new Rect(px + 30 + wa + wb, py, wl + 10, 36), lapTxt, HudFont.JB600, 13, HudLayout.Text, TextAnchor.MiddleLeft);
                    if (playerPenalty > 0) { string pt = "+" + playerPenalty.ToString("0") + " s penalty"; float wp = p.Width(pt, HudFont.B600, 12) + 20; p.Fill(new Rect(W / 2 - wp / 2, py + 42, wp, 22), HudLayout.Hex(0x3A1518, 0.92f), 8); p.Text(new Rect(W / 2 - wp / 2, py + 42, wp, 22), pt, HudFont.B600, 12, HudLayout.Bad, TextAnchor.MiddleCenter); }
                }
                // the flag: a solid coloured tag
                if (flag != null && Time.time < flagUntil)
                {
                    string t = flag == "blue" ? "BLUE FLAG · let the faster car by" : flag == "green" ? "GREEN · GO" : "CHEQUERED FLAG";
                    Color bg = flag == "blue" ? Blue : flag == "green" ? Green : HudLayout.Hex(0xE8EAF0), fg = flag == "blue" ? Color.white : HudLayout.Hex(0x0B0D12);
                    float fw = p.Width(t, HudFont.B700, 14) + 34, fy = H * 0.18f + (phase == Phase.Lights ? 130 : 58);
                    p.Fill(new Rect(W / 2 - fw / 2, fy, fw, 30), bg, 8); p.Text(new Rect(W / 2 - fw / 2, fy, fw, 30), t, HudFont.B700, 14, fg, TextAnchor.MiddleCenter);
                }
                Tower(p, H);
            }
            if (phase == Phase.Finished && finishedAt > 0 && Time.time - finishedAt > 3f) Results(p, W, H);
        }

        // the running order down the left, under the timing box
        void Tower(IHudPainter p, float H)
        {
            if (order.Count == 0 || phase == Phase.Finished && Time.time - finishedAt > 3f) return;
            float x = 14, y = 250, w = 214, rh = 21;
            int rows = Mathf.Clamp((int)((H - y - 150) / rh), 3, order.Count);
            if (!hud.full) rows = Mathf.Min(rows, 5);
            int first = Mathf.Clamp(playerPos - 1 - rows / 2, 0, Mathf.Max(0, order.Count - rows));
            p.Fill(new Rect(x, y, w, rows * rh + 10), new Color(0.07f, 0.085f, 0.115f, 0.86f), 12);
            for (int k = 0; k < rows; k++)
            {
                var r = order[first + k]; float ry = y + 5 + k * rh;
                if (r.you) p.Fill(new Rect(x + 4, ry, w - 8, rh), new Color(1f, 0.71f, 0.28f, 0.16f), 6);
                p.Text(new Rect(x + 8, ry, 22, rh), (first + k + 1).ToString(), HudFont.JB600, 12, r.you ? HudLayout.Accent : HudLayout.Muted, TextAnchor.MiddleRight);
                p.Fill(new Rect(x + 36, ry + 4, 4, rh - 8), r.col, 2);
                p.Text(new Rect(x + 46, ry, 60, rh), r.code, HudFont.B700, 13, r.you ? HudLayout.Accent : HudLayout.Text, TextAnchor.MiddleLeft);
                string g;
                if (first + k == 0) g = phase == Phase.Racing || phase == Phase.Finished ? "Leader" : "";
                else
                {
                    var ahead = order[first + k - 1];
                    if (r.done && ahead.done) g = Gap(r.time - ahead.time);
                    else { float dm = ahead.prog - r.prog, v = r.you ? Mathf.Max(playerV, 20f) : Mathf.Max(r.ai != null ? r.ai.v : 20f, 20f); g = dm > L ? "+" + (int)(dm / L) + " lap" : phase == Phase.Racing ? Gap(dm / v) : ""; }
                }
                p.Text(new Rect(x + w - 92, ry, 82, rh), g, HudFont.JB600, 11, HudLayout.Soft, TextAnchor.MiddleRight);
            }
        }

        void Results(ImguiPainter p, float W, float H)
        {
            bool paint = Event.current.type == EventType.Repaint;
            int n = order.Count; float rh = n > 12 ? 24 : 30, pw = Mathf.Min(760, W - 40), ph = 128 + n * rh + 86, x = W / 2 - pw / 2, y = Mathf.Max(10, H / 2 - ph / 2);
            if (paint)
            {
                p.Fill(new Rect(0, 0, W, H), new Color(0.02f, 0.03f, 0.05f, 0.66f), 0);
                MenuUi.Panel(p, new Rect(x, y, pw, ph));
                p.Text(new Rect(x + 26, y + 18, pw - 52, 40), playerPos == 1 ? "You win" : "Race result · P" + playerPos + " of " + n, HudFont.BC700, 32, playerPos == 1 ? HudLayout.Accent : HudLayout.Text, TextAnchor.MiddleLeft);
                p.Text(new Rect(x + 26, y + 58, pw - 52, 22), track.data.name + " · " + laps + " laps" + (playerPenalty > 0 ? " · your penalties: " + playerPenalty.ToString("0") + " s" : ""), HudFont.B500, 14, HudLayout.Soft, TextAnchor.MiddleLeft);
                float ty = y + 96; string[] heads = { "Pos", "Driver", "Team", "Time / gap", "Best lap", "Pen." }; float[] cx = { 26, 80, 170, pw - 330, pw - 190, pw - 70 };
                for (int h = 0; h < heads.Length; h++) MenuUi.Label(p, x + cx[h], ty, 140, heads[h]);
                ty += 22;
                for (int k = 0; k < n; k++)
                {
                    var r = order[k]; float ry = ty + k * rh;
                    if (r.you) p.Fill(new Rect(x + 14, ry, pw - 28, rh - 2), new Color(1f, 0.71f, 0.28f, 0.14f), 6);
                    Color tc = r.you ? HudLayout.Accent : HudLayout.Text;
                    p.Text(new Rect(x + cx[0], ry, 40, rh), (k + 1).ToString(), HudFont.JB600, 14, tc, TextAnchor.MiddleLeft);
                    p.Fill(new Rect(x + cx[1] - 12, ry + 6, 4, rh - 14), r.col, 2);
                    p.Text(new Rect(x + cx[1], ry, 80, rh), r.code, HudFont.B700, 14, tc, TextAnchor.MiddleLeft);
                    p.Text(new Rect(x + cx[2], ry, 200, rh), r.team, HudFont.B500, 13, HudLayout.Soft, TextAnchor.MiddleLeft);
                    p.Text(new Rect(x + cx[3], ry, 130, rh), k == 0 ? RaceSession.Fmt(r.time) : Gap(r.time - order[0].time), HudFont.JB600, 13, tc, TextAnchor.MiddleLeft);
                    p.Text(new Rect(x + cx[4], ry, 110, rh), r.best > 0 ? RaceSession.Fmt(r.best) : "–", HudFont.JB600, 13, HudLayout.Soft, TextAnchor.MiddleLeft);
                    p.Text(new Rect(x + cx[5], ry, 60, rh), r.pen > 0 ? "+" + r.pen.ToString("0") + " s" : "", HudFont.JB600, 12, HudLayout.Bad, TextAnchor.MiddleLeft);
                }
            }
            float by = y + ph - 68, bw = (pw - 52 - 12) / 2;
            if (MenuUi.Button(p, new Rect(x + 26, by, bw, 48), "Race again", true)) session.Restart();
            if (MenuUi.Button(p, new Rect(x + 26 + bw + 12, by, bw, 48), RaceSettings.MenuAvailable ? "Back to the menu" : "Keep driving", false))
            {
                if (RaceSettings.MenuAvailable) session.ToMenu(); else { finishedAt = -1; if (session.input != null) session.input.locked = false; }
            }
            p.EndNav();
        }
    }
}

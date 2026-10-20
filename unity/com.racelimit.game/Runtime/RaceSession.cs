using UnityEngine;

namespace RaceLimit
{
    // A practice session: start on the grid, laps timed from the line (three sectors, best lap kept between runs),
    // a lap deleted for running wide (all four wheels off), the pit limiter (80 km/h between the lines), R to go
    // back on track, Esc to pause, brake bias on [ ].
    public class RaceSession : MonoBehaviour
    {
        public TrackInfo track;
        public RaceCar car;
        public CarInput input;

        [Header("Timing (read only)")]
        public int lap = 0;
        public float lapTime, lastLap = -1, bestLap = -1;
        public float[] sectors = { -1, -1, -1 }, bestSectors = { -1, -1, -1 };
        public int[] sectorCls = new int[3];      // how each sector this lap went: 1 best yet (purple), 3 slower (yellow), 4 lap deleted
        public bool onPit;                        // in the pit lane
        public bool hasDelta; public float delta; // against the best lap this session, where it was at this point
        public bool lapInvalid, running, paused;
        public int idx;
        public string message; public float messageUntil;

        float lapStart, secStart, offT, lastAlong, airT;
        float[] curTrace, bestTrace; // lap time at each metre of the lap: this lap, the best one
        int sector;
        [System.NonSerialized] public float bestTraceLap; // the lap the delta is against
        string BestKey { get { return "RaceLimit.best." + (track && track.data != null ? track.data.slug : "track"); } }

        void Start()
        {
            if (track == null) track = FindAnyObjectByType<TrackInfo>();
            if (car == null) car = FindAnyObjectByType<RaceCar>();
            if (input == null) input = FindAnyObjectByType<CarInput>();
            if (!track.Load()) { enabled = false; return; }
            bestLap = PlayerPrefs.GetFloat(BestKey, -1);
            curTrace = new float[track.N]; for (int i = 0; i < curTrace.Length; i++) curTrace[i] = -1;
            // on the grid: 40 m behind the line, left of the middle
            car.Teleport(track.PoseAt(-40, track.data.half * 0.4f, 0.45f));
            idx = track.Nearest(car.transform.position);
            lastAlong = track.Along(car.transform.position, idx);
            Say("Practice — the clock starts at the line", 3);
            var cam = FindAnyObjectByType<ChaseCamera>(); if (cam != null) cam.eyeZ = track.data.carEyeZ;
        }

        public void Say(string text, float secs) { message = text; messageUntil = Time.unscaledTime + secs; }

        void Update()
        {
            if (input == null || car == null) return;
            if (input.pause) { paused = !paused; Time.timeScale = paused ? 0 : 1; AudioListener.pause = paused; }
            if (paused) return;
            if (input.reset) { int i = track.Nearest(car.transform.position, idx); car.Teleport(track.PoseAt(i, 0, 0.45f)); Say("Back on track", 1.2f); lapInvalid = running; }
            if (input.biasUp || input.biasDown) { car.brakeBias = Mathf.Round(Mathf.Clamp(car.brakeBias + (input.biasUp ? 0.005f : -0.005f), 0.5f, 0.7f) * 1000f) / 1000f; Say("Brake bias " + (car.brakeBias * 100).ToString("0.0") + "% front", 1.1f); }

            Vector3 p = car.transform.position;
            idx = track.Nearest(p, idx);
            // fallen through or off the world, or stuck with no wheels on anything: back on track
            float below = track.centre[idx].y - p.y;
            if (below > 4f || (car.wheelsDown == 0 && car.kmh < 5 && (airT += Time.deltaTime) > 2f)) { airT = 0; int i = idx; car.Teleport(track.PoseAt(i, 0, 0.45f)); Say("Back on track", 1.2f); lapInvalid = running; return; }
            if (car.wheelsDown > 0) airT = 0;
            float along = track.Along(p, idx), L = track.length;
            // crossing the line forwards: a lap done (or the first one starting)
            if (lastAlong > L * 0.9f && along < L * 0.1f)
            {
                float now = Time.time;
                if (running)
                {
                    float t = now - lapStart; sectors[2] = now - secStart;
                    lastLap = t;
                    // (the delta is against the best lap driven in this session)
                    bool sessionBest = !lapInvalid && (bestTrace == null || t < bestTraceLap);
                    if (sessionBest) { bestTraceLap = t; bestTrace = (float[])curTrace.Clone(); float lastT = 0; for (int i = 0; i < bestTrace.Length; i++) { if (bestTrace[i] < 0) bestTrace[i] = lastT; else lastT = bestTrace[i]; } }
                    if (!lapInvalid && (bestLap < 0 || t < bestLap)) { bestLap = t; PlayerPrefs.SetFloat(BestKey, t); PlayerPrefs.Save(); Say("Best lap " + Fmt(t), 3); }
                    else Say(lapInvalid ? "Lap deleted: track limits" : "Lap " + Fmt(t), 2.5f);
                    for (int s = 0; s < 3; s++) if (!lapInvalid && sectors[s] > 0 && (bestSectors[s] < 0 || sectors[s] < bestSectors[s])) bestSectors[s] = sectors[s];
                }
                else Say("Timed lap", 1.4f);
                running = true; lap++; lapStart = secStart = now; sector = 0; lapInvalid = false; sectors = new float[] { -1, -1, -1 }; sectorCls = new int[3];
                for (int i = 0; i < curTrace.Length; i++) curTrace[i] = -1;
            }
            if (running)
            {
                lapTime = Time.time - lapStart;
                int sNow = Mathf.Clamp((int)(along / (L / 3f)), 0, 2);
                if (sNow == sector + 1) { float st = Time.time - secStart; sectors[sector] = st; sectorCls[sector] = lapInvalid ? 4 : bestSectors[sector] < 0 || st < bestSectors[sector] ? 1 : 3; secStart = Time.time; sector = sNow; }
                if (curTrace[idx] < 0) curTrace[idx] = lapTime;
                hasDelta = bestTrace != null; if (hasDelta) delta = lapTime - bestTrace[idx];
            }
            if (!running) hasDelta = false;
            lastAlong = along;
            // track limits: all four wheels on grass or gravel for a moment
            if (car.offTrack && car.kmh > 30) { offT += Time.deltaTime; if (offT > 0.25f && running && !lapInvalid) { lapInvalid = true; Say("Track limits: lap deleted", 2.2f); } } else offT = 0;
            // the pit limiter, between the lines
            // (in the pit lane: between its walls, measured from the lane's own middle — the working lane by the garages too)
            float pd; bool inLane = track.InPitLane(p, out pd);
            if (inLane && Mathf.Abs(track.Lateral(p, idx)) < track.data.half - 0.3f) inLane = false; // (still on the track where the lane leaves or joins it)
            if (inLane && !onPit && !car.pitLimiter) Say("Pit lane", 1.2f);
            onPit = inLane;
            bool lim = inLane && pd >= track.data.pitLimitFrom && pd <= track.data.pitLimitTo;
            if (lim != car.pitLimiter)
            {
                car.pitLimiter = lim;
                if (lim) Say(car.kmh > 82 ? "Pit limiter on — you came in at " + Mathf.RoundToInt(car.kmh) + " km/h!" : "Pit limiter on · 80 km/h", 2.2f);
                else Say("Limiter off", 1.4f);
            }
        }

        public static string Fmt(float t)
        {
            if (t < 0) return "–:––.–––";
            int m = (int)(t / 60); float s = t - m * 60;
            return m + ":" + s.ToString("00.000");
        }
    }
}

using UnityEngine;

namespace RaceLimit
{
    // The player's choices from the menus, kept between runs (PlayerPrefs): the circuit, car and team, session type,
    // assists, display, graphics and sound. Applied to the car and the display when a session starts.
    public static class RaceSettings
    {
        public const string MenuScene = "RaceLimit Menu";

        static int I(string k, int d) { return PlayerPrefs.GetInt("RaceLimit." + k, d); }
        static void I_(string k, int v) { PlayerPrefs.SetInt("RaceLimit." + k, v); }

        public static int Assists { get { return I("assists", 0); } set { I_("assists", value); } }   // 0 lots, 1 some, 2 none
        public static int Session { get { return I("session", 0); } set { I_("session", value); } }   // 0 practice, 1 hot laps, 2 time trial
        public static int HudSize { get { return I("hudSize", 0); } set { I_("hudSize", value); } }   // 0 normal, 1 large, 2 extra large
        public static bool AutoGears { get { return I("autoGears", 1) == 1; } set { I_("autoGears", value ? 1 : 0); } }
        public static bool FullHud { get { return I("fullHud", 1) == 1; } set { I_("fullHud", value ? 1 : 0); } }
        public static float HudScale { get { return HudSize == 2 ? 1.4f : HudSize == 1 ? 1.2f : 1f; } }

        // the car
        public static int Era { get { return I("era", 2026); } set { I_("era", value); } }
        public static string Team { get { return PlayerPrefs.GetString("RaceLimit.team", "RACELIMIT"); } set { PlayerPrefs.SetString("RaceLimit.team", value); } }
        // the circuit: the scene last chosen, and day or night there
        public static string LastTrack { get { return PlayerPrefs.GetString("RaceLimit.lastTrack", ""); } set { PlayerPrefs.SetString("RaceLimit.lastTrack", value); } }
        public static int TimeOfDay { get { return I("timeOfDay", 0); } set { I_("timeOfDay", value); } } // 0 as in real life, 1 day, 2 night
        // graphics and sound
        public static int Graphics { get { return I("graphics", 1); } set { I_("graphics", value); } }   // 0 low, 1 medium, 2 high
        public static bool ShowFps { get { return I("fps", 0) == 1; } set { I_("fps", value ? 1 : 0); } }
        public static bool VSync { get { return I("vsync", 1) == 1; } set { I_("vsync", value ? 1 : 0); } }
        public static int MusicVolume { get { return I("music", 7); } set { I_("music", Mathf.Clamp(value, 0, 10)); } } // 0–10
        public static int SoundVolume { get { return I("sound", 8); } set { I_("sound", Mathf.Clamp(value, 0, 10)); } } // 0–10

        // the graphics presets: Low and Medium are meant for a laptop's built-in graphics
        public static readonly string[] GraphicsNames = { "Low", "Medium", "High" };
        public static readonly string[] GraphicsAbout =
        {
            "Low: drawn at 70% size, no shadows, shorter view distance. For the smoothest driving on laptop graphics.",
            "Medium: drawn at 85% size, shadows near the car, 2× smoothing. A good balance on laptop graphics.",
            "High: full size, shadows far out, 4× smoothing. For a graphics card.",
        };

        public static string SessionName(int s) { return s == 1 ? "Hot laps" : s == 2 ? "Time trial" : "Practice"; }

        // the best lap, kept for each circuit and each era of car (time trials and everything else separately)
        public static string BestKey(string slug, int era, bool timeTrial) { return "RaceLimit.best." + slug + "." + era + (timeTrial ? ".tt" : ""); }
        public static float Best(string slug, int era, bool timeTrial) { return PlayerPrefs.GetFloat(BestKey(slug, era, timeTrial), -1); }
        // the best with any car
        public static float BestAny(string slug, out int era)
        {
            float best = -1; era = 0;
            foreach (var e in GameData.Eras) foreach (bool tt in new[] { false, true }) { float t = Best(slug, e.year, tt); if (t > 0 && (best < 0 || t < best)) { best = t; era = e.year; } }
            return best;
        }

        // set when a session is started from the menu (so a scene opened straight in the editor keeps its own settings)
        public static bool FromMenu;

        public static void Apply(RaceCar car)
        {
            if (car == null) return;
            int a = Assists;
            car.abs = a <= 1; car.tractionControl = a <= 1; car.stabilityHelp = a == 0;
            car.autoGears = AutoGears;
        }

        public static bool MenuAvailable { get { return Application.CanStreamedLevelBeLoaded(MenuScene); } }
    }
}

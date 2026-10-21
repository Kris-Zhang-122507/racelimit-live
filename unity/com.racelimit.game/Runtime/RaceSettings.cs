using UnityEngine;

namespace RaceLimit
{
    // The player's choices from the menus, kept between runs (PlayerPrefs): assists, session type, on-screen display
    // size, gears. Applied to the car and the display when a session starts.
    public static class RaceSettings
    {
        public const string MenuScene = "RaceLimit Menu";

        public static int Assists { get { return PlayerPrefs.GetInt("RaceLimit.assists", 0); } set { PlayerPrefs.SetInt("RaceLimit.assists", value); } }   // 0 lots, 1 some, 2 none
        public static int Session { get { return PlayerPrefs.GetInt("RaceLimit.session", 0); } set { PlayerPrefs.SetInt("RaceLimit.session", value); } }   // 0 practice, 1 hot laps
        public static int HudSize { get { return PlayerPrefs.GetInt("RaceLimit.hudSize", 0); } set { PlayerPrefs.SetInt("RaceLimit.hudSize", value); } }   // 0 normal, 1 large, 2 extra large
        public static bool AutoGears { get { return PlayerPrefs.GetInt("RaceLimit.autoGears", 1) == 1; } set { PlayerPrefs.SetInt("RaceLimit.autoGears", value ? 1 : 0); } }
        public static bool FullHud { get { return PlayerPrefs.GetInt("RaceLimit.fullHud", 1) == 1; } set { PlayerPrefs.SetInt("RaceLimit.fullHud", value ? 1 : 0); } }
        public static float HudScale { get { return HudSize == 2 ? 1.4f : HudSize == 1 ? 1.2f : 1f; } }

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

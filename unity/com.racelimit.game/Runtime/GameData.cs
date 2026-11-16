using UnityEngine;

namespace RaceLimit
{
    // The game's fixed lists: the made-up teams and engine makers, the car eras, facts about each circuit and the
    // tips shown on the loading screen. All teams, sponsors and engine makers are made up.
    public class TeamInfo
    {
        public string name, engine, number, about;
        public Color body, accent, stripe;
        public TeamInfo(string name, int body, int accent, int stripe, string number, string engine, string about)
        { this.name = name; this.body = HudLayout.Hex(body); this.accent = HudLayout.Hex(accent); this.stripe = HudLayout.Hex(stripe); this.number = number; this.engine = engine; this.about = about; }
    }

    public class EraInfo
    {
        public int year; public string label, engine, about;
        // how the car differs from the 2026 one the physics was set up for
        public float mass, power, ers, downforce, drag, grip, limiterRpm;
        public bool battery, activeAero;
        public string top, zeroTo100;
    }

    public class CircuitFact
    {
        public string slug, shortName, country, cc, record; public int recordYear, raceLaps; public bool night, street;
        public CircuitFact(string slug, string shortName, string country, string cc, int raceLaps, bool night, bool street, string record, int recordYear)
        { this.slug = slug; this.shortName = shortName; this.country = country; this.cc = cc; this.raceLaps = raceLaps; this.night = night; this.street = street; this.record = record; this.recordYear = recordYear; }
    }

    public static class GameData
    {
        public static readonly TeamInfo[] Teams =
        {
            new TeamInfo("RACELIMIT", 0xFFA51F, 0x16171B, 0xF4F4F4, "27", "Aurex", "The works team. Orange and black, quick everywhere."),
            new TeamInfo("VELOCE", 0xC8102E, 0xF2F2F2, 0x111111, "16", "Veloce", "The oldest name on the grid, in red. Builds its own engine."),
            new TeamInfo("KESTREL", 0x0F4D3A, 0x9BE33A, 0xF2F2F2, "14", "Norden", "Dark green with a lime flash. Strong on fast circuits."),
            new TeamInfo("NOVA", 0x16B8A6, 0x0E0F12, 0xF2F2F2, "63", "Norden", "Teal and black. Clever strategy, kind on its tyres."),
            new TeamInfo("AXIOM", 0x16245C, 0xF2C230, 0xE8002D, "1", "Aurex", "Navy and gold. The reigning champions."),
            new TeamInfo("HALCYON", 0xF2F3F5, 0x121316, 0xE8002D, "31", "Kaito", "White with a red stripe. Good in the rain."),
            new TeamInfo("VORTEX", 0xFF7A1A, 0x1C3F8C, 0x7FD3FF, "81", "Norden", "Orange and blue. The fastest pit crew."),
            new TeamInfo("ORBITA", 0x5B2A86, 0xC9CED6, 0xFF4FA3, "22", "Kaito", "Purple and silver. A young team on the way up."),
            new TeamInfo("MERIDIAN", 0x8C939E, 0x0B8F86, 0x0E0F12, "44", "Veloce", "Silver and sea green. Best top speed."),
            new TeamInfo("BRAVO", 0x101114, 0xC9A23A, 0xC9A23A, "10", "Aurex", "Black and gold. At the back of the grid, for now."),
        };

        public static TeamInfo Team(string name) { foreach (var t in Teams) if (t.name == name) return t; return Teams[0]; }
        public static int TeamIndex(string name) { for (int i = 0; i < Teams.Length; i++) if (Teams[i].name == name) return i; return 0; }

        // (mass in kg with the driver, power in kW at the wheels' side of the gearbox; rough figures for each set of rules)
        public static readonly EraInfo[] Eras =
        {
            new EraInfo { year = 1998, label = "1998–2008", engine = "3.0 litre V10", about = "Light, narrow and loud. Grooved tyres, no battery, and a V10 that revs to 19,000.", mass = 605, power = 610e3f, ers = 0, downforce = 0.86f, drag = 0.96f, grip = 0.90f, limiterRpm = 19000, battery = false, activeAero = false, top = "350 km/h", zeroTo100 = "2.5 s" },
            new EraInfo { year = 2009, label = "2009–2013", engine = "2.4 litre V8", about = "Wide front wing, tall narrow rear wing and a V8. Slick tyres are back.", mass = 640, power = 550e3f, ers = 60e3f, downforce = 0.84f, drag = 0.95f, grip = 0.97f, limiterRpm = 18000, battery = true, activeAero = false, top = "330 km/h", zeroTo100 = "2.6 s" },
            new EraInfo { year = 2014, label = "2014–2016", engine = "1.6 litre V6 turbo hybrid", about = "The first hybrids: a turbo V6 with a battery, lots of torque and less downforce.", mass = 702, power = 470e3f, ers = 120e3f, downforce = 0.80f, drag = 0.92f, grip = 0.96f, limiterRpm = 12500, battery = true, activeAero = false, top = "350 km/h", zeroTo100 = "2.6 s" },
            new EraInfo { year = 2017, label = "2017–2021", engine = "1.6 litre V6 turbo hybrid", about = "Wide cars with wide tyres and huge downforce. The fastest through corners.", mass = 746, power = 560e3f, ers = 120e3f, downforce = 1.12f, drag = 1.08f, grip = 1.04f, limiterRpm = 12500, battery = true, activeAero = false, top = "345 km/h", zeroTo100 = "2.5 s" },
            new EraInfo { year = 2022, label = "2022–2025", engine = "1.6 litre V6 turbo hybrid", about = "Ground-effect cars on 18-inch wheels: heavy, stiff, and easier to follow.", mass = 798, power = 590e3f, ers = 120e3f, downforce = 1.08f, drag = 1.02f, grip = 1.02f, limiterRpm = 12500, battery = true, activeAero = false, top = "350 km/h", zeroTo100 = "2.6 s" },
            new EraInfo { year = 2026, label = "2026", engine = "1.6 litre V6 hybrid, 350 kW battery", about = "The new rules: smaller and lighter, wings that open on the straights, and half the power from the battery.", mass = 800, power = 400e3f, ers = 350e3f, downforce = 1f, drag = 1f, grip = 1f, limiterRpm = 12500, battery = true, activeAero = true, top = "355 km/h", zeroTo100 = "2.6 s" },
        };
        public static EraInfo Era(int year) { foreach (var e in Eras) if (e.year == year) return e; return Eras[Eras.Length - 1]; }
        public static int EraIndex(int year) { for (int i = 0; i < Eras.Length; i++) if (Eras[i].year == year) return i; return Eras.Length - 1; }

        // The fastest lap in a Formula 1 race at each circuit, up to the end of 2025 ("" where there hasn't been one yet).
        public static readonly CircuitFact[] Circuits =
        {
            new CircuitFact("melbourne", "Melbourne", "Australia", "AU", 58, false, true, "1:19.813", 2024),
            new CircuitFact("shanghai", "Shanghai", "China", "CN", 56, false, false, "1:32.238", 2004),
            new CircuitFact("suzuka", "Suzuka", "Japan", "JP", 53, false, false, "1:30.965", 2025),
            new CircuitFact("miami", "Miami", "USA", "US", 57, false, true, "1:29.708", 2023),
            new CircuitFact("montreal", "Montreal", "Canada", "CA", 70, false, true, "1:13.078", 2019),
            new CircuitFact("monte-carlo", "Monaco", "Monaco", "MC", 78, false, true, "1:12.909", 2021),
            new CircuitFact("catalunya", "Barcelona", "Spain", "ES", 66, false, false, "1:15.743", 2025),
            new CircuitFact("spielberg", "Spielberg", "Austria", "AT", 71, false, false, "1:05.619", 2020),
            new CircuitFact("silverstone", "Silverstone", "Great Britain", "GB", 52, false, false, "1:27.097", 2020),
            new CircuitFact("spa-francorchamps", "Spa", "Belgium", "BE", 44, false, false, "1:44.701", 2024),
            new CircuitFact("hungaroring", "Hungaroring", "Hungary", "HU", 70, false, false, "1:16.627", 2020),
            new CircuitFact("zandvoort", "Zandvoort", "Netherlands", "NL", 72, false, false, "1:11.097", 2021),
            new CircuitFact("monza", "Monza", "Italy", "IT", 53, false, false, "1:20.901", 2025),
            new CircuitFact("madring", "Madrid", "Spain", "ES", 57, false, true, "", 0),
            new CircuitFact("baku", "Baku", "Azerbaijan", "AZ", 51, false, true, "1:43.009", 2019),
            new CircuitFact("kuala-lumpur", "Sepang", "Malaysia", "MY", 56, false, false, "1:34.080", 2017),
            new CircuitFact("singapore", "Singapore", "Singapore", "SG", 62, true, true, "1:33.808", 2025),
            new CircuitFact("austin", "Austin", "USA", "US", 56, false, false, "1:36.169", 2019),
            new CircuitFact("mexico-city", "Mexico City", "Mexico", "MX", 71, false, false, "1:17.774", 2021),
            new CircuitFact("interlagos", "São Paulo", "Brazil", "BR", 71, false, false, "1:10.540", 2018),
            new CircuitFact("las-vegas", "Las Vegas", "USA", "US", 50, true, true, "1:33.365", 2025),
            new CircuitFact("lusail", "Lusail", "Qatar", "QA", 57, true, false, "1:22.384", 2024),
            new CircuitFact("yas-marina-circuit", "Abu Dhabi", "UAE", "AE", 58, true, false, "1:25.637", 2024),
            new CircuitFact("sakhir", "Bahrain", "Bahrain", "BH", 57, true, false, "1:31.447", 2005),
            new CircuitFact("jeddah", "Jeddah", "Saudi Arabia", "SA", 50, true, true, "1:30.734", 2021),
        };
        public static CircuitFact Circuit(string slug) { foreach (var c in Circuits) if (c.slug == slug) return c; return null; }
        public static int CircuitOrder(string slug) { for (int i = 0; i < Circuits.Length; i++) if (Circuits[i].slug == slug) return i; return 999; }

        public static readonly string[] Tips =
        {
            "Brake in a straight line, then ease off the brake as you turn in.",
            "Slow in, fast out: a good exit matters more than a late braking point.",
            "The racing line turns amber and red where you need to lift or brake.",
            "Move the brake bias forward ( ] ) if the rear feels loose under braking, back ( [ ) if the fronts lock.",
            "Kerbs are fine to use, but grass and gravel cost a lot of grip, and all four wheels off deletes the lap.",
            "Hold Space for the overtake boost. It drains the battery fast, so save it for the straights.",
            "The pit lane has an 80 km/h limit. The limiter comes on by itself between the lines.",
            "Cold tyres have less grip. Take the first corners of a run a little easier.",
            "Tab switches between the full display and a simple one.",
            "Press C to change camera: chase, far chase, T-cam or cockpit.",
            "Press R if you get stuck: it puts the car back on the track (and deletes the lap).",
            "In a time trial your best lap is saved for each circuit and each car.",
            "Older cars have less downforce: brake earlier and be gentle on the throttle.",
            "The delta shows how far ahead or behind your best lap you are, right now.",
        };
    }
}

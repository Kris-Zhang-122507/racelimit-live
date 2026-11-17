# RaceLimit for Unity

The racing game, moving from the web (three.js) to Unity 6 with URP. Built for Unity **6000.6.6f1**.

## First time
1. Pull the repo (GitHub Desktop: Fetch origin → Pull).
2. Unity Hub → **New project** → **Universal 3D** template → name it `RaceLimit` → any folder (not inside the repo).
3. In Unity: **Window → Package Manager → + → Install package from disk…** → choose `racelimit-live/unity/com.racelimit.game/package.json`.
4. Say **Install** when it asks for glTFast (Unity's glTF importer). Wait for the spinner at the bottom right to stop.
5. Menu **RaceLimit → Build one circuit → 10 Spa** to try one circuit first (importing it takes a minute or two), or
   **RaceLimit → Build all circuits** for all 25 (the first time this takes a while: each circuit's model is 20 to 95 MB, and
   Unity's Library folder grows by a few GB; you can cancel part-way and carry on later).
6. The **RaceLimit Menu** scene opens (it's the first scene of the game). Press **Play**.

After pulling updates, Unity picks up the code by itself. Build a circuit again when its model changed (and after this update,
build at least one again so the main menu and the car are made afresh: they are rebuilt with every circuit).

## The menus
- **Main menu → Race weekend**: the circuit and car you chose last time, the session (practice, hot laps, time trial), assists
  and gears, then **Start**. A loading screen shows the circuit's facts and a tip.
- **Change circuit**: every circuit with its map, country, length, corners, race distance, lap record, your best lap, and day
  or night. **Change car** / **Garage**: six eras (1998 V10 to 2026) and ten made-up teams' liveries.
- **Settings**: driving (assists, gears, display), graphics (Low / Medium / High, frame-rate counter), sound, and controls:
  click a key to change it.
- Mouse, keyboard (arrows, Enter, Esc) or a controller (d-pad or stick, A, B) work in every menu. Everything you choose is saved.
- Esc in a session: carry on, start again, assists, music, or back to the menu.

## Racing

Pick **Race** on the race weekend screen (or the Race card on the main menu), then:

- **Race length:** 3, 5 or 10 laps, a quarter of the real distance, or all of it.
- **Other drivers:** Easy, Medium, Hard or Expert.
- **Cars:** 10 or 20 on the grid (10 is kinder to laptop graphics). **You start** from pole, the middle or the back.

Five red lights come on one at a time, then all go out: go. Moving before that is a jump start (5 seconds). Running wide
with all four wheels gets three warnings, then 5 seconds each time. Ramming the car in front costs 5 seconds. A blue
flag means a car a lap ahead is behind you. The order is down the left; the results table comes up at the end.

The other cars follow the racing line that comes with each circuit, pass each other and you, and go round a stopped car.
They are solid but don't run the full physics. Not here yet: formation lap, safety car, pit stops, rain.

`scripts/unity/racesim/racesim.py` runs the same driving rules outside Unity (lap times, passes, cars touching).

## Music
Export the pieces in `designs/race/music/` from MuseScore (File → Export → MP3 or OGG) and put the files in your Unity project's
`Assets/RaceLimit/Resources/RL_Music/` folder (made the first time you build a circuit). The game finds each by words in its file
name (Main Theme, Full Throttle, Dusk, Garage, Loading, Formation, Pause, Replay, Podium, Win Sting, Pole Position, Race Finish,
Retired). The three menu songs take turns; there is no music while driving. Without the files the game is simply silent.

## Track Builder (make your own circuits)
- **RaceLimit → Track Builder → New circuit**: a new scene with a short starter circuit. Select **Track Builder** in the Hierarchy.
- **RaceLimit → Track Builder → Spa from pieces**: Spa rebuilt from pieces (its real shape and hills, within about half a metre),
  with F1-style run-off, ready to drive and to change.
- In its Inspector: **+ Straight**, **+ Left/Right corner**, **+ From library** (famous corners — Eau Rouge, Parabolica, Maggotts–
  Becketts, 130R, the Grand Hotel hairpin… — and a basic kit: hairpin, chicanes, esses, crest, dip), then change any piece in the
  **Pieces** list: length, angle and radius, climb, banking, width, and on each side the run-off (two zones: tarmac, gravel, sand,
  grass), the barrier (armco, concrete, Tecpro), a catch fence, kerbs. The Scene view rebuilds as you change things.
- The last piece is joined smoothly back to the start line, so the lap always closes. **Pit**: which side, where it leaves and
  joins the track, how many garages.
- **Make it playable** adds the car, timing and display, saves the scene in `Assets/RaceLimit/Scenes/` and puts it in the main
  menu's list. Nothing generated is saved in the scene: the circuit is built again when the game starts.

## Controls
(All keys can be changed in Settings → Controls.) ↑/W throttle · ↓/S brake (hold when stopped to reverse) · ←→/A D steer · E/Q gears (when auto gears are off on the car) ·
Space overtake · [ ] brake bias · C camera · B look back · R back on track · F aero mode · Tab more/less on screen · Esc pause.
A controller works too (triggers, left stick, bumpers for gears, A overtake, Y camera, d-pad brake bias).

## What's in here
| Folder | |
|---|---|
| `Tracks/<circuit>/` | The circuit as the web game builds it (`.glb`: track, kerbs, run-off, barriers, terrain, real buildings, trees) and its centre line (`.track.json`). Exported by `scripts/unity/export-track.mjs`. |
| `Cars/car_<era>.glb` | One car per era (1998, 2009, 2014, 2017, 2022, 2026): wheels `RL_Wheel_FL/FR/RL/RR`, steering wheel `RL_Steering`, its screen `RL_WheelScreen`, paint materials `rl_livery` / `rl_paint` / `rl_accent`. Exported by `scripts/unity/export-cars.mjs`. `Runtime/Resources/RL_Liveries/` has each team's livery. |
| `Runtime/` | `RaceCar` (physics), `CarInput`, `ChaseCamera`, `RaceSession` (timing, delta, limiter, resets), `RaceHud` + `HudLayout` (the web game's on-screen display), `TecproBarrier` + `TecproModel` (Tecpro that squashes), `TrackInfo`, `RLSurface`, `RLWall`. |
| `Runtime/` (Track Builder) | `TrackLayout` (the pieces, in the scene), `TrackPieces` (what a piece is), `TrackGen` (pieces → meshes, run-off, barriers, pit lane, terrain, track data), `TrackMaterials`. Menus: `MainMenu`, `MenuUi`, `ImguiPainter`, `RaceSettings`, `TrackRegistry`. Also `GameData` (teams, eras, circuit facts, tips), `CarGarage` (era model, livery, steering wheel and its display), `RLKeys` (changeable keys, controller), `RLCore` (music, graphics presets, FPS counter), `RLDayNight`. |
| `Library/corners.json` | The Track Builder's corner library (`scripts/unity/export-corners.mjs`). |
| `Fonts/` | Barlow, Barlow Condensed and JetBrains Mono, as on the web (SIL Open Font License, see the `OFL-*.txt` files). |
| `Textures/` | The Tecpro sponsor banner (made-up sponsors). |
| `Editor/` | `RaceLimitSetup`: the RaceLimit menu (installs glTFast, builds scenes). |

Ground pieces are found by material name (`rl_ground_track`, `_kerb`, `_grass`, `_gravel`…): they get a Mesh Collider and a surface
type for the tyres. Barriers are invisible solid boxes that `TrackInfo` stands behind each barrier's face (the faces come in the
`.track.json`); in front of Tecpro the box is the concrete behind the rows, and `TecproBarrier` slows the car in the foam before that and squashes the rows where it went in. Car settings (grip, aero, power, springs, aids) are on
the **RaceCar** component of `PlayerCar` and can be changed in the Inspector while playing.

Map data © OpenStreetMap contributors (ODbL).

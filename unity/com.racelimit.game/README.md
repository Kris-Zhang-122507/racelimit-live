# RaceLimit for Unity

The racing game, moving from the web (three.js) to Unity 6 with URP. Built for Unity **6000.6.6f1**.

## First time
1. Pull the repo (GitHub Desktop: Fetch origin → Pull).
2. Unity Hub → **New project** → **Universal 3D** template → name it `RaceLimit` → any folder (not inside the repo).
3. In Unity: **Window → Package Manager → + → Install package from disk…** → choose `racelimit-live/unity/com.racelimit.game/package.json`.
4. Say **Install** when it asks for glTFast (Unity's glTF importer). Wait for the spinner at the bottom right to stop.
5. Menu **RaceLimit → Build Spa scene**. The first time, importing the circuit takes a minute or two.
6. Press **Play**.

After pulling updates, Unity picks them up by itself. Run **RaceLimit → Build Spa scene** again when a circuit or the car changes.

The first build also makes the **main menu** (`Assets/RaceLimit/Scenes/RaceLimit Menu.unity`, the first scene of the game): open it and
press Play to start from the menu (Race weekend → pick a circuit, session and assists → Start weekend). **RaceLimit → Build main menu**
makes it again. Esc in a session: carry on, start again, or back to the menu.

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
↑/W throttle · ↓/S brake (hold when stopped to reverse) · ←→/A D steer · E/Q gears (when auto gears are off on the car) ·
Space overtake · [ ] brake bias · C camera · B look back · R back on track · F aero mode · Tab more/less on screen · Esc pause.
A controller works too (triggers, left stick, bumpers for gears, A overtake, Y camera, d-pad brake bias).

## What's in here
| Folder | |
|---|---|
| `Tracks/<circuit>/` | The circuit as the web game builds it (`.glb`: track, kerbs, run-off, barriers, terrain, real buildings, trees) and its centre line (`.track.json`). Exported by `scripts/unity/export-track.mjs`. |
| `Cars/car.glb` | The car, wheels named `RL_Wheel_FL/FR/RL/RR`. |
| `Runtime/` | `RaceCar` (physics), `CarInput`, `ChaseCamera`, `RaceSession` (timing, delta, limiter, resets), `RaceHud` + `HudLayout` (the web game's on-screen display), `TecproBarrier` + `TecproModel` (Tecpro that squashes), `TrackInfo`, `RLSurface`, `RLWall`. |
| `Runtime/` (Track Builder) | `TrackLayout` (the pieces, in the scene), `TrackPieces` (what a piece is), `TrackGen` (pieces → meshes, run-off, barriers, pit lane, terrain, track data), `TrackMaterials`. Menus: `MainMenu`, `MenuUi`, `ImguiPainter`, `RaceSettings`, `TrackRegistry`. |
| `Library/corners.json` | The Track Builder's corner library (`scripts/unity/export-corners.mjs`). |
| `Fonts/` | Barlow, Barlow Condensed and JetBrains Mono, as on the web (SIL Open Font License, see the `OFL-*.txt` files). |
| `Textures/` | The Tecpro sponsor banner (made-up sponsors). |
| `Editor/` | `RaceLimitSetup`: the RaceLimit menu (installs glTFast, builds scenes). |

Ground pieces are found by material name (`rl_ground_track`, `_kerb`, `_grass`, `_gravel`…): they get a Mesh Collider and a surface
type for the tyres. Barriers are invisible solid boxes that `TrackInfo` stands behind each barrier's face (the faces come in the
`.track.json`); in front of Tecpro the box is the concrete behind the rows, and `TecproBarrier` slows the car in the foam before that and squashes the rows where it went in. Car settings (grip, aero, power, springs, aids) are on
the **RaceCar** component of `PlayerCar` and can be changed in the Inspector while playing.

Map data © OpenStreetMap contributors (ODbL).

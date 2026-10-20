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

## Controls
↑/W throttle · ↓/S brake (hold when stopped to reverse) · ←→/A D steer · E/Q gears (when auto gears are off on the car) ·
Space overtake · [ ] brake bias · C camera · B look back · R back on track · F aero mode · Tab more/less on screen · Esc pause.
A controller works too (triggers, left stick, bumpers for gears, A overtake, Y camera, d-pad brake bias).

## What's in here
| Folder | |
|---|---|
| `Tracks/<circuit>/` | The circuit as the web game builds it (`.glb`: track, kerbs, run-off, barriers, terrain, real buildings, trees) and its centre line (`.track.json`). Exported by `scripts/unity/export-track.mjs`. |
| `Cars/car.glb` | The car, wheels named `RL_Wheel_FL/FR/RL/RR`. |
| `Runtime/` | `RaceCar` (physics), `CarInput`, `ChaseCamera`, `RaceSession` (timing, limiter, resets), `RaceHud`, `TrackInfo`, `RLSurface`, `RLWall`. |
| `Editor/` | `RaceLimitSetup`: the RaceLimit menu (installs glTFast, builds scenes). |

Ground pieces are found by material name (`rl_ground_track`, `_kerb`, `_grass`, `_gravel`…): they get a Mesh Collider and a surface
type for the tyres. Barriers collide through invisible strips (`rl_col_wall`). Car settings (grip, aero, power, springs, aids) are on
the **RaceCar** component of `PlayerCar` and can be changed in the Inspector while playing.

Map data © OpenStreetMap contributors (ODbL).

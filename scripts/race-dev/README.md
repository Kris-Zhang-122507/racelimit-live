# Racing game test tools

Checks used while building the racing game (`public/race/`). They aren't part of the site.

## Without a browser (Node only)

Run these from this folder.

| Script | What it checks |
|---|---|
| `node accel.mjs` | Straight-line run: 0–100, 0–200, 0–300 km/h, top speed, battery use. `CAR='{"pErs":260e3}'` overrides car settings. |
| `node alltracks.mjs [id]` | Builds every circuit (or one) from the real data: height range, pit side, entry/exit, limiter zone, garages, tightest pit bend. |
| `node pitreal.mjs [ids…]` | Drives through each circuit's pit lane, from before the entry to after the exit. Reports whether it made it, plus any wall touches. Light touches are normal with this simple path follower. |
| `TRACK=spa node kb.mjs '{}' 1 1` | A keyboard-style driver (on/off steering and pedals) laps a circuit. Prints lap times, spins, offs and wall hits. Arguments: options JSON, aggression, seed. |
| `./kbs.sh '{"stability":false}'` | `kb.mjs` with 4 seeds. |
| `TRACK=spa C=soft LAPS=6 node tyretest.mjs` | Tyre temperatures, wear and lap times, lap by lap. |

Circuit ids are the keys of `CIRCUITS` in `public/race/trackdata.js`, for example `spa`, `monte-carlo` or `yas-marina-circuit`.

## In a headless browser

1. Install Playwright once from the repo root. Use `--no-save` so it stays out of `package.json`:

   ```
   npm i --no-save playwright
   ```

2. Serve `public/` with `cd public && python3 -m http.server 8791`.

| Script | What it does |
|---|---|
| `node run.mjs "race/index.html?auto=1&autopilot=1&warp=0.5" "10,20"` | Loads the game with the autopilot driving. Screenshots after 10 s and 20 s, and prints car state and page errors. |
| `node tracks.mjs spa:300:150 monte-carlo:hot` | Screenshot per circuit. The spec is `id:place:speed:cam`, where place is metres along the lap, or `hot` for a hot-lap start. |
| `node menutest.mjs` | Main menu → race weekend → practice start in the garage. Takes screenshots. |

Settings for the browser scripts:
- Screenshots go to `$OUT` (default `./shots`).
- Chromium is taken from `$CHROMIUM` (default `/opt/pw-browsers/chromium`).
- The base URL is `$BASE` (default `http://localhost:8791/`).

## Game URL options

| Option | Effect |
|---|---|
| `?track=<id>` | Skips the menus and loads that circuit. |
| `&session=practice\|hotlap\|grid` | Picks the session. |
| `&place=<m>&speed=<km/h>` | Starts the car at that point at that speed. |
| `&cam=chase\|cockpit\|…` | Picks the camera. |
| `&auto=1` | Grid start. |
| `&autopilot=1` | The AI drives. |
| `&warp=` | Sets the time scale. |

The page exposes `window.__race` (`{ c, tr, T, phase, frames, … }`) for tests.

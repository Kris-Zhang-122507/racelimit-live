# Racing game design mockups

These are the screen designs drawn while planning the racing game (October 2026). They're the reference for features that haven't been built yet. They're plain HTML and are not part of the site.

To view a screen, open a file with `?screen=<name>`, for example `design9.html?screen=camedit`. Background renders and fonts aren't included, so pages show with a plain background and fallback fonts.

| File | Screens (`?screen=`) |
|---|---|
| `design.html` | `weekend` race weekend settings · `setup` car setup (wings, ride height, springs, brakes, diff, pressures, what each change does) · `pit` in-race pit menu (tyres, wing, repairs, strategy, rejoin) |
| `design2.html` | `menu` main menu (built) · `era` era picker |
| `design3.html` | `beat` beat the driver (real driver's ghost lap + telemetry) · `career` · `daily` (built) · `friends` room codes and ghost links · `moments` famous moments · `photo` replays and photo mode · `wheel` |
| `design4.html` | energy plan: where to deploy the battery around Spa |
| `design5.html` | `wheel` / `wheel26` steering wheel and its buttons · `start` formation lap and standing starts (clutch optional) |
| `design6.html` | `controls` keyboard, controller and wheel mapping · `rules` overtaking rules and the stewards |
| `design7.html` | `assists` · `phone` phone as a controller |
| `design8.html` | `pad` phone controller features · `second` phone as a second screen (race engineer, telemetry, extra camera, voice radio, live timing) |
| `design9.html` | `camedit` camera editor · `champ` custom championships · `glow` brake glow · `highlights` auto highlights · `lift` lift and coast · `pitgame` optional pit stop mini-game · `setup` setup sharing codes · `slip` slipstream and dirty air · `tod` time of day · `weekly` weekly events |
| `design10.html` (+ `.js`) | `garage` 3D garage · `livery` livery editor · `kit` driver kit · `parts` parts that change the car · `engine` engine makers · `build` engine builder · `wear` engine and gearbox wear · `team` create your team · `upgrades` |
| `design11.html` (+ `.js`) | `gears` gearbox ratios · `firing` how the engine fires (sound) · `drive` driveline and wheel controls |
| `concepts/list1.html` | `weather` `rubber` `debris` `night` `marshals` `weekend` `tyres` `rules` `school` `daily` `ghost` `broadcast` `split` `radio` |
| `concepts/list2.html` | `gforce` `brakes` `pressures` `fuel` `porpoise` `flatspot` `defend` `orders` `redflag` `towgame` `classic` `sharecode` `seasons` `pole` `photo` `ticker` `pitwall` `trophies` |
| `concepts/list3.html` | `crowd` `podium` `gridwalk` `onboard` `dash` `suspension` `haze` `dirty` `rivals` `wet` `crewcam` `endurance` `famous` `ladder` `access` `calib` |
| `concepts/list4.html` | `realrace` `realweather` `rejoin` `explain` `spotter` `migration` `wind` `kerbs` `blankets` `mirror` `trackwalk` `museum` `pa` `sound` `graphics` `tvwatch` `tvhost` |
| `concepts/list5.html` | `ladder` `sponsors` `market` `media` `personalities` `visor` `radiator` `invader` `stall` `weighin` `racesim` `teamsim` `thisweek` `tvgames` `headtrack` `rumble` |
| `concepts/list6.html` | `safetycar` `elimination` `watch3d` `conceptcars` `enginemodes` `eragadgets` `reaction` `rewind` `bigscreen` `celebrate` `crowds` `easter` `eralooks` `setupwizard` `compare` `trivia` `teammates` `cards` `voice` |
| `concepts/list7.html` | `doublestack` `fastestlap` `restart` `hot` `karting` `paddock` `engineer` `newspaper` `review` `flypast` `crane` `scenario` `hotseat` `relay` `installapp` `myraces` `mods` |
| `concepts/list8.html` | `oil` `thunder` `impede` `multiclass` `pitboard` `hpattern` `licence` `testing` `crewtraining` `adaptive` `animdriver` `seasonal` `cruise` `parade` |
| `concepts/list9.html` | `sprint` `reversegrid` `puncture` `switchfix` `titledecider` `flowvis` `fp1` `banners` `twoseater` `drag` `party` `fantasy` `racelength` `midsave` |
| `concepts/list10.html` | `medicalcar` `radiodrop` `sand` `fog` `debrief` `launch` `number` `fanzone` `travel` `garagewait` `hillclimb` `demorun` `twists` `contests` |
| `concepts/list11.html` | `fireup` `installlap` `wingflap` `gestures` `rivalradio` `support` `drones` `whitelines` `cooldown` `retirewalk` `pitwall` `laprecord` `rebuild` `fastestpit` `corner` `documentary` `factory` `racedirector` `knockout` `replayfile` `streamer` `frozenlake` |

Rules that apply to everything here:
- All teams, brands, sponsors and engine makers are made up.
- Flags and lights are solid colours and never flash.
- The pit stop mini-game is only a custom, optional setting.

## Concept renders, October 2026 (`concepts/`)
181 ideas for the game in eleven lists (lists 1–5 redone on October 28 with everything staged in 3D; lists 6–8 added the same day, including the drivers' parade; lists 9–11 added on October 31). The pages are ES modules, so serve the folder (`python3 -m http.server`) and open e.g. `list4.html?screen=tvwatch`.

How the pictures are made:
- `shots.mjs` (and `shots9.mjs` for lists 9–11, which also builds made-up rooms: garages, a launch studio, the factory, a fan zone, a frozen lake) lists each staged shot: the circuit, where the car is, and a setup script that runs inside the real game page with `kit.js` loaded. The kit pauses the game and adds things to its 3D scene: other cars (the real car model in other team colours, or a see-through ghost), lines and patches laid on the track surface, cones, debris, marshals, flag panels, pit crew, boards, windsocks, a podium, a safety car, karts, the drivers' parade truck, display jets, a recovery crane, smoke and fireworks; it also sets the camera and lighting, and records where named points land on screen.
- `node shoot.mjs [names…]` (with `public/` served on port 8791) renders them to `bg/<name>.png`, plus `bg/<name>.json` with the screen positions that the pages use for their pointer labels (`pin()` in `common.js`). Shots on the same circuit share one page load.
- `node render.mjs list1` writes every screen of a list to `out/`. `bg/` and `out/` aren't committed.

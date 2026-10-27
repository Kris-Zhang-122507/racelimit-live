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

Rules that apply to everything here:
- All teams, brands, sponsors and engine makers are made up.
- Flags and lights are solid colours and never flash.
- The pit stop mini-game is only a custom, optional setting.

## Concept renders, October 27 2026 (`concepts/`)
48 ideas for the game, in three lists. The pages are ES modules, so serve the folder (`python3 -m http.server`) and open e.g. `list2.html?screen=pitwall`.
Backgrounds are game screenshots without the HUD, made with `node bgshot.mjs 'name|track|place|speed|cam|eye'` (saved to `bg/`, not committed); `node render.mjs list1` writes every screen of a list to `out/`.
Other cars in these shots are copies of the player's car (`clone()` in `common.js`), because the game has no AI cars yet.

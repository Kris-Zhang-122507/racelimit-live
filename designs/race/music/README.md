# RaceLimit game music (MusicXML for MuseScore)

Open any `.musicxml` file in MuseScore (File → Open). They all share one motif: the first bar of the main theme.

| File | Use in the game | Key / tempo | Length | Loops? |
|---|---|---|---|---|
| **Main menu (rotate these three)** | | | | |
| `racelimit-main-theme.musicxml` | Main menu 1 — orchestra + band | D minor, 120 | 44 bars, ~1:30 | yes |
| `racelimit-menu-full-throttle.musicxml` | Main menu 2 — rock band + strings | E minor, 140 | 36 bars, ~1:05 | yes |
| `racelimit-menu-dusk.musicxml` | Main menu 3 — calm piano, strings, flute | G major, 84 | 32 bars, ~1:30 | yes |
| **Race weekend** | | | | |
| `racelimit-loading.musicxml` | Loading screens | D minor, 126 | 32 bars, ~1:00 | yes |
| `racelimit-starting-grid.musicxml` | On the grid, until the formation lap | C minor, 108 | 32 bars, ~1:10 | yes |
| `racelimit-garage.musicxml` | Setup / livery / car screens | F major (D dorian), 96 | 32 bars, ~1:20 | yes |
| `racelimit-pause.musicxml` | Pause menu (very quiet) | F major, 72 | 16 bars, ~55 s | yes |
| `racelimit-replay.musicxml` | Replays and auto highlights | A major, 132 | 32 bars, ~1:00 | yes |
| **Results** | | | | |
| `racelimit-podium.musicxml` | Results + podium | D major, 100 | 24 bars, ~1:00 | no, ends |
| `racelimit-win-sting.musicxml` | Winning a race | D major, 112 | 5 bars, ~11 s | no |
| `racelimit-sting-pole-position.musicxml` | Taking pole in qualifying | F major, 120 | 3 bars, ~8 s | no |
| `racelimit-sting-race-finish.musicxml` | Finishing a race (not a win) | G major, 100 | 4 bars, ~12 s | no |
| `racelimit-sting-retired.musicxml` | Retired / DNF | D minor, 66 | 4 bars, ~15 s | no |

No music while driving or during the start lights, so the engine and the lights can be heard. The starting grid song should fade out when the formation lap starts.

Exporting for the game: File → Export → Audio (MP3 or OGG). For looping tracks, export once (no repeat) and let the game loop the file.
If MuseScore picks a solo instrument where a section was meant (e.g. "Violin" instead of "Violins"), right-click the staff → Replace instrument.

`source/` holds the Python scripts that write the files (`python3 theme.py` etc., output goes to `out/`).

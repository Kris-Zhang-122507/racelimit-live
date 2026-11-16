# RaceLimit game music (MusicXML for MuseScore)

Open any `.musicxml` file in MuseScore (File → Open). They all share one motif: the first bar of the main theme.

| File | Use in the game | Key / tempo | Length | Loops? |
|---|---|---|---|---|
| `racelimit-main-theme.musicxml` | Main menu | D minor, 120 | 44 bars, ~1:28 | yes (bar 44 → bar 1) |
| `racelimit-garage.musicxml` | Setup / livery / car screens | F major (D dorian), 96 | 32 bars, ~1:20 | yes |
| `racelimit-grid.musicxml` | Loading / pre-race (stops before the lights) | D minor, 126 | 32 bars, ~1:01 | yes |
| `racelimit-podium.musicxml` | Results + podium | D major, 100 | 24 bars, ~1:00 + held chord | no, ends |
| `racelimit-win-sting.musicxml` | Short jingle for a win | D major, 112 | 5 bars, ~11 s | no |

No music while driving, so the engine can be heard.

Exporting for the game: File → Export → Audio (MP3 or OGG). For looping tracks, export once (no repeat) and let the game loop the file.
If MuseScore picks a solo instrument where a section was meant (e.g. "Violin" instead of "Violins"), right-click the staff → Replace instrument.

`source/` holds the Python scripts that write the files (`python3 theme.py` etc., output goes to `out/`).

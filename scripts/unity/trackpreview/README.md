Runs the Track Builder's generator (`unity/com.racelimit.game/Runtime/TrackGen.cs`) outside Unity: Spa rebuilt from pieces
(how close it stays to the real line, how many meshes, the terrain), or the starter layout, and writes the meshes to a JSON that
`render.mjs` draws with three.js (the picture is mirrored left–right: three.js and Unity turn the x axis opposite ways).

    mcs -langversion:7.2 -out:tp.exe PreviewUnity.cs Program.cs ../../../unity/com.racelimit.game/Runtime/TrackGen.cs ../../../unity/com.racelimit.game/Runtime/TrackPieces.cs
    mono tp.exe ../../../unity/com.racelimit.game/Tracks/spa-francorchamps/spa-francorchamps.track.json spa.json
    mono tp.exe default default.json
    node render.mjs spa.json shots/spa top "lasource:300:6:30:60"     # name:index:height:back:ahead

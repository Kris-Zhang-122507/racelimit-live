Draws the Unity HUD's layout (`unity/com.racelimit.game/Runtime/HudLayout.cs`) to an SVG with sample values, outside Unity,
to compare with the web game's HUD (sizes in the web page's pixels; text widths are estimated).

    mcs -langversion:7.2 -out:hud.exe PreviewUnity.cs Program.cs ../../../unity/com.racelimit.game/Runtime/HudLayout.cs
    mono hud.exe ../../../unity/com.racelimit.game/Tracks/spa-francorchamps/spa-francorchamps.track.json 1536 864 [simple] hud.svg

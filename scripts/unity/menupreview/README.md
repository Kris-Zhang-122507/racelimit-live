Draws the Unity main menu's three screens (`MainMenu.cs`, through `MenuUi` and an SVG painter) with sample circuits, outside
Unity, to compare with the web game's menu (text widths are estimated; the car in the Race weekend card isn't drawn).

    mcs -langversion:7.2 -out:menu.exe PreviewUnity.cs Program.cs ../../../unity/com.racelimit.game/Runtime/{MainMenu,MenuUi,HudLayout,TrackRegistry,RaceSettings}.cs
    mono menu.exe ../../../unity/com.racelimit.game/Tracks/spa-francorchamps/spa-francorchamps.track.json menu   # menu-Main.svg, menu-Weekend.svg, menu-Settings.svg

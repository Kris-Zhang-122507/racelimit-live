Draws the Unity menus (`MainMenu.cs`, through `MenuUi` and an SVG painter) outside Unity, with every exported circuit, to
check the layout (text widths are estimated; the car in the studio is a placeholder picture, `car.png`, if there is one).

    R=../../../unity/com.racelimit.game
    mcs -langversion:7.2 -out:menu.exe PreviewUnity.cs Program.cs $R/Runtime/{MainMenu,MenuUi,HudLayout,TrackRegistry,RaceSettings,GameData,RLKeys}.cs
    mono menu.exe $R/Tracks menu [width height]   # menu-Main.svg, -Weekend, -Tracks, -Cars, -Settings0…3, -Loading

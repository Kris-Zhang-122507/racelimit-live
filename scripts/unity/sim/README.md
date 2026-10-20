Drives `unity/com.racelimit.game/Runtime/RaceCar.cs` on a flat test surface without Unity (a small stand-in for the Unity API with a
working rigid body): settling, 0–100/200/300, braking, steady corners, full lock with and without the aids, pulling away, trail braking.

    mcs -langversion:7.2 -out:sim.exe SimUnity.cs Program.cs ../../../unity/com.racelimit.game/Runtime/RaceCar.cs ../../../unity/com.racelimit.game/Runtime/RLSurface.cs
    mono sim.exe

using System;
using UnityEngine;

namespace RaceLimit
{
    // The pieces a circuit is made of in the Track Builder (TrackLayout): straights, corners, corners from the library
    // (real ones like Eau Rouge, or the basic kit) and pieces fitted to a real track. They join end to end; the last
    // one is joined smoothly back to the start. Each piece says what's beside it on each side: the run-off (two zones,
    // e.g. tarmac then gravel), the barrier, a catch fence, kerbs.

    public enum PieceKind { Straight, Corner, Shape }
    public enum TurnDirection { Left, Right }
    public enum RunoffType { Grass, Asphalt, Gravel, Sand, None }
    public enum BarrierType { Armco, Concrete, Tecpro, None }

    [Serializable]
    public class SideSetup
    {
        [Tooltip("Next to the track (e.g. tarmac run-off)")] public RunoffType near = RunoffType.Asphalt;
        [Min(0)] public float nearWidth = 6f;
        [Tooltip("Behind that (e.g. a gravel trap)")] public RunoffType far = RunoffType.Grass;
        [Min(0)] public float farWidth = 6f;
        public BarrierType barrier = BarrierType.Armco;
        [Tooltip("A catch fence above the barrier")] public bool fence = true;
        [Tooltip("Kerb along this edge (only drawn where the piece turns)")] public bool kerb = true;

        public float Total { get { return (near == RunoffType.None ? 0 : nearWidth) + (far == RunoffType.None ? 0 : farWidth); } }
        public SideSetup Clone() { return (SideSetup)MemberwiseClone(); }

        public static SideSetup Make(RunoffType near, float nw, RunoffType far, float fw, BarrierType b, bool fence = true, bool kerb = true)
        { return new SideSetup { near = near, nearWidth = nw, far = far, farWidth = fw, barrier = b, fence = fence, kerb = kerb }; }
    }

    // a bit of a piece's shape: so long, turning so much (+ = left), climbing so much
    [Serializable]
    public struct ShapeStep { public float len, turn, rise; public ShapeStep(float l, float t, float r) { len = l; turn = t; rise = r; } }

    [Serializable]
    public class TrackPiece
    {
        public string name = "";
        public PieceKind kind = PieceKind.Straight;
        [Tooltip("Straight: its length (m)")] [Min(1)] public float length = 200f;
        [Tooltip("Corner: which way it turns")] public TurnDirection direction = TurnDirection.Right;
        [Tooltip("Corner: how far it turns (degrees)")] [Range(1, 270)] public float angle = 90f;
        [Tooltip("Corner: its radius at the apex (m)")] [Min(5)] public float radius = 40f;
        [Tooltip("Corner: how gradually it tightens and opens (m of the corner at each end)")] [Min(0)] public float ease = 20f;
        [Tooltip("Shape pieces (from the library or a real track): the shape, step by step")] public ShapeStep[] shape;
        [Tooltip("Shape pieces: stretch it (1 = as it is)")] [Range(0.3f, 3f)] public float scale = 1f;
        [Tooltip("Shape pieces: mirror it (left becomes right)")] public bool mirror;
        [Tooltip("Climb (m) over the piece; minus goes downhill")] public float rise;
        [Tooltip("Banking (degrees; leans towards the inside of the turn)")] [Range(0, 30)] public float bank;
        [Tooltip("Track width here (m); 0 = the layout's")] [Min(0)] public float width;
        public SideSetup left = SideSetup.Make(RunoffType.Grass, 8, RunoffType.None, 0, BarrierType.Armco);
        public SideSetup right = SideSetup.Make(RunoffType.Grass, 8, RunoffType.None, 0, BarrierType.Armco);

        public TrackPiece Clone()
        {
            var p = (TrackPiece)MemberwiseClone(); p.left = left.Clone(); p.right = right.Clone();
            if (shape != null) p.shape = (ShapeStep[])shape.Clone();
            return p;
        }

        // F1-style run-off for a corner: on the outside tarmac then gravel (more room the slower it is), on the inside a
        // strip of tarmac then grass
        public void SetCornerRunoff(float minRadius, bool turnsLeft)
        {
            float room = minRadius < 40 ? 34 : minRadius < 90 ? 26 : minRadius < 200 ? 20 : 14;
            var outside = SideSetup.Make(RunoffType.Asphalt, room * 0.6f, RunoffType.Gravel, room * 0.4f, minRadius < 200 ? BarrierType.Tecpro : BarrierType.Armco);
            var inside = SideSetup.Make(RunoffType.Asphalt, 2.5f, RunoffType.Grass, Mathf.Clamp(minRadius * 0.15f, 3f, 10f), BarrierType.Armco);
            if (turnsLeft) { left = inside; right = outside; } else { left = outside; right = inside; }
        }

        public static TrackPiece Straight(float len)
        {
            return new TrackPiece { name = "Straight", kind = PieceKind.Straight, length = len, left = SideSetup.Make(RunoffType.Asphalt, 3, RunoffType.Grass, 6, BarrierType.Armco), right = SideSetup.Make(RunoffType.Asphalt, 3, RunoffType.Grass, 6, BarrierType.Armco) };
        }

        public static TrackPiece Corner(TurnDirection dir, float angle, float radius, string name = "Corner")
        {
            var p = new TrackPiece { name = name, kind = PieceKind.Corner, direction = dir, angle = angle, radius = radius, ease = Mathf.Min(25f, radius * angle * Mathf.Deg2Rad * 0.3f) };
            p.SetCornerRunoff(radius, dir == TurnDirection.Left);
            return p;
        }
    }

    // The pit lane: beside the track between two points, on one side
    [Serializable]
    public class PitSetup
    {
        public bool enabled = true;
        public TurnDirection side = TurnDirection.Right;
        [Tooltip("Where the pit lane leaves the track (m from the start line; minus = before it)")] public float entry = -300f;
        [Tooltip("Where it joins the track again (m from the start line)")] public float exit = 300f;
        [Tooltip("Garages in a row along the pit lane")] [Range(0, 30)] public int garages = 10;
    }
}

using UnityEngine;

namespace RaceLimit
{
    // What a piece of ground is, for the tyres: grip (times the tyre's own) and the extra drag of
    // ploughing through it (in g, plus a bit more per m/s). Added by the scene builder to every
    // mesh whose material is named rl_ground_<kind>.
    public enum SurfaceKind { Track, Line, Kerb, Apron, Runoff, Escape, Street, Grass, Gravel, Terrain }

    public class RLSurface : MonoBehaviour
    {
        public SurfaceKind kind = SurfaceKind.Track;

        public static float Grip(SurfaceKind k)
        {
            switch (k)
            {
                case SurfaceKind.Track: return 1f;
                case SurfaceKind.Line: return 0.97f;
                case SurfaceKind.Kerb: return 0.95f;
                case SurfaceKind.Apron: return 0.92f;
                case SurfaceKind.Runoff: case SurfaceKind.Escape: case SurfaceKind.Street: return 0.9f;
                case SurfaceKind.Grass: case SurfaceKind.Terrain: return 0.55f;
                case SurfaceKind.Gravel: return 0.42f;
            }
            return 1f;
        }

        // drag in g at speed u (m/s)
        public static float Drag(SurfaceKind k, float u)
        {
            switch (k)
            {
                case SurfaceKind.Grass: case SurfaceKind.Terrain: return 0.06f + 0.0018f * u;
                case SurfaceKind.Gravel: return Mathf.Min(0.95f, 0.32f + 0.0075f * u);
            }
            return 0f;
        }

        public static bool OffTrack(SurfaceKind k) { return k == SurfaceKind.Grass || k == SurfaceKind.Terrain || k == SurfaceKind.Gravel; }

        public static bool TryParse(string materialName, out SurfaceKind kind)
        {
            kind = SurfaceKind.Track;
            if (string.IsNullOrEmpty(materialName)) return false;
            string n = materialName.ToLowerInvariant();
            int at = n.IndexOf("rl_ground_");
            if (at < 0) return false;
            n = n.Substring(at + 10);
            int cut = n.IndexOfAny(new[] { ' ', '(', '.', '_' });
            if (cut >= 0) n = n.Substring(0, cut);
            switch (n)
            {
                case "track": kind = SurfaceKind.Track; return true;
                case "line": kind = SurfaceKind.Line; return true;
                case "kerb": kind = SurfaceKind.Kerb; return true;
                case "apron": kind = SurfaceKind.Apron; return true;
                case "runoff": kind = SurfaceKind.Runoff; return true;
                case "escape": kind = SurfaceKind.Escape; return true;
                case "street": kind = SurfaceKind.Street; return true;
                case "grass": kind = SurfaceKind.Grass; return true;
                case "gravel": kind = SurfaceKind.Gravel; return true;
                case "terrain": kind = SurfaceKind.Terrain; return true;
            }
            return false;
        }
    }
}

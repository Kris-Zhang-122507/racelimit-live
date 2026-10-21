// Just enough of UnityEngine (working maths) for TrackGen.cs and TrackPieces.cs to run outside Unity.
using System;
namespace UnityEngine
{
    public struct Vector2 { public float x, y; public Vector2(float x, float y) { this.x = x; this.y = y; } public static Vector2 zero = new Vector2(0, 0); }
    public struct Vector2Int { public int x, y; public Vector2Int(int x, int y) { this.x = x; this.y = y; } }
    public struct Vector3
    {
        public float x, y, z; public Vector3(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
        public static Vector3 zero = new Vector3(0, 0, 0), up = new Vector3(0, 1, 0), down = new Vector3(0, -1, 0);
        public static Vector3 operator +(Vector3 a, Vector3 b) { return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z); }
        public static Vector3 operator -(Vector3 a, Vector3 b) { return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z); }
        public static Vector3 operator -(Vector3 a) { return new Vector3(-a.x, -a.y, -a.z); }
        public static Vector3 operator *(Vector3 a, float d) { return new Vector3(a.x * d, a.y * d, a.z * d); }
        public static Vector3 operator *(float d, Vector3 a) { return new Vector3(a.x * d, a.y * d, a.z * d); }
        public static Vector3 operator /(Vector3 a, float d) { return new Vector3(a.x / d, a.y / d, a.z / d); }
        public float magnitude { get { return (float)Math.Sqrt(x * x + y * y + z * z); } }
        public static Vector3 Min(Vector3 a, Vector3 b) { return new Vector3(Math.Min(a.x, b.x), Math.Min(a.y, b.y), Math.Min(a.z, b.z)); }
        public static Vector3 Max(Vector3 a, Vector3 b) { return new Vector3(Math.Max(a.x, b.x), Math.Max(a.y, b.y), Math.Max(a.z, b.z)); }
    }
    public static class Mathf
    {
        public const float PI = (float)Math.PI, Deg2Rad = PI / 180f, Rad2Deg = 180f / PI;
        public static float Sin(float v) { return (float)Math.Sin(v); } public static float Cos(float v) { return (float)Math.Cos(v); } public static float Tan(float v) { return (float)Math.Tan(v); }
        public static float Atan2(float y, float x) { return (float)Math.Atan2(y, x); } public static float Sqrt(float v) { return (float)Math.Sqrt(v); }
        public static float Abs(float v) { return Math.Abs(v); } public static int Abs(int v) { return Math.Abs(v); } public static float Sign(float v) { return v >= 0 ? 1 : -1; }
        public static float Min(float a, float b) { return Math.Min(a, b); } public static int Min(int a, int b) { return Math.Min(a, b); }
        public static float Max(float a, float b) { return Math.Max(a, b); } public static int Max(int a, int b) { return Math.Max(a, b); }
        public static float Clamp(float v, float a, float b) { return v < a ? a : v > b ? b : v; } public static int Clamp(int v, int a, int b) { return v < a ? a : v > b ? b : v; }
        public static float Clamp01(float v) { return Clamp(v, 0, 1); } public static float Lerp(float a, float b, float t) { return a + (b - a) * Clamp01(t); }
        public static int RoundToInt(float v) { return (int)Math.Round(v); } public static float Floor(float v) { return (float)Math.Floor(v); }
    }
    public class MinAttribute : Attribute { public MinAttribute(float v) { } }
    public class TooltipAttribute : Attribute { public TooltipAttribute(string s) { } }
    public class RangeAttribute : Attribute { public RangeAttribute(float a, float b) { } }
}
namespace RaceLimit
{
    public static class TecproModel { public const float Length = 1.0f, Depth = 0.55f, Height = 1.2f; }
    public class TrackInfo
    {
        public class Corner { public int n; public string name; public int i; }
        public class WallRun { public string name; public float thick; public float[] x, y, z, ox, oz; }
        public class Data
        {
            public string slug, name; public float half, len; public bool street; public int n;
            public float[] x, y, z, wallL, wallR, edgeL, edgeR, outL, outR; public int[] tecL, tecR; public float[] wallYL, wallYR;
            public Corner[] corners; public bool hasPit; public float pitLimitFrom, pitLimitTo; public float[] pitX, pitY, pitZ, pitDist, pitWallL, pitWallR;
            public WallRun[] walls; public float carEyeZ, wheelRadius;
        }
    }
}

// Just enough of UnityEngine for HudLayout.cs to run outside Unity (see README.md).
using System;
namespace UnityEngine
{
    public struct Vector2 { public float x, y; public Vector2(float x, float y) { this.x = x; this.y = y; } }
    public struct Vector3 { public float x, y, z; }
    public struct Rect
    {
        public float x, y, width, height; public Rect(float x, float y, float w, float h) { this.x = x; this.y = y; width = w; height = h; }
        public float xMax { get { return x + width; } } public float yMax { get { return y + height; } } public Vector2 center { get { return new Vector2(x + width / 2, y + height / 2); } }
    }
    public struct Color { public float r, g, b, a; public Color(float r, float g, float b, float a = 1) { this.r = r; this.g = g; this.b = b; this.a = a; } public static Color white = new Color(1, 1, 1); }
    public enum TextAnchor { UpperLeft, UpperCenter, UpperRight, MiddleLeft, MiddleCenter, MiddleRight, LowerLeft, LowerCenter, LowerRight }
    public static class Mathf
    {
        public static float Clamp01(float v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
        public static int Clamp(int v, int a, int b) { return v < a ? a : v > b ? b : v; }
        public static int RoundToInt(float v) { return (int)Math.Round(v); }
    }
}

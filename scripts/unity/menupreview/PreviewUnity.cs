// Just enough of UnityEngine for the menu (MainMenu.cs, MenuUi.cs, HudLayout.cs, TrackRegistry.cs) to draw outside Unity.
using System;
namespace UnityEngine
{
    public class Object { public string name; public static implicit operator bool(Object o) { return o != null; } }
    public class Component : Object { public Transform transform; public GameObject gameObject; }
    public class Behaviour : Component { public bool enabled; }
    public class MonoBehaviour : Behaviour { }
    public class GameObject : Object { }
    public class Transform : Component { public void Rotate(float x, float y, float z, Space s) { } }
    public enum Space { World, Self }
    public class Texture : Object { } public class Texture2D : Texture { } public class RenderTexture : Texture { public RenderTexture(int w, int h, int d) { } public int antiAliasing; public void Release() { } }
    public class Font : Object { }
    public class Camera : Behaviour { public RenderTexture targetTexture; }
    public class TextAsset : Object { public string text; }
    public struct Vector2 { public float x, y; public Vector2(float x, float y) { this.x = x; this.y = y; } public static Vector2 operator -(Vector2 a, Vector2 b) { return new Vector2(a.x - b.x, a.y - b.y); } }
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
        public const float Rad2Deg = 57.29578f;
        public static float Clamp01(float v) { return v < 0 ? 0 : v > 1 ? 1 : v; } public static float Clamp(float v, float a, float b) { return v < a ? a : v > b ? b : v; }
        public static int Clamp(int v, int a, int b) { return v < a ? a : v > b ? b : v; } public static int RoundToInt(float v) { return (int)Math.Round(v); } public static float Round(float v) { return (float)Math.Round(v); }
        public static float Min(float a, float b) { return Math.Min(a, b); } public static float Max(float a, float b) { return Math.Max(a, b); } public static int Max(int a, int b) { return Math.Max(a, b); }
        public static int CeilToInt(float v) { return (int)Math.Ceiling(v); } public static float Atan2(float y, float x) { return (float)Math.Atan2(y, x); }
    }
    public static class Screen { public static int width = 1440, height = 860; public static float dpi = 96; }
    public static class PlayerPrefs { public static int GetInt(string k, int d) { return d; } public static void SetInt(string k, int v) { } public static string GetString(string k, string d) { return d; } public static void SetString(string k, string v) { } public static void Save() { } }
    public static class Application { public static bool CanStreamedLevelBeLoaded(string s) { return true; } public static void Quit() { } }
    public static class Resources { public static T Load<T>(string p) where T : Object { return null; } }
    public static class JsonUtility { public static T FromJson<T>(string s) { return default(T); } }
    public static class Time { public static float deltaTime, unscaledTime, timeScale; }
    public static class AudioListener { public static bool pause; }
    public static class Debug { public static void LogError(object o) { } }
    public enum KeyCode { Escape, Return }
    public static class Input { public static bool GetKeyDown(KeyCode k) { return false; } }
    public enum EventType { Repaint, MouseUp }
    public class Event { public static Event current; public EventType type; }
    public enum ScaleMode { ScaleAndCrop }
    public static class GUI { public static void DrawTexture(Rect r, Texture t, ScaleMode m, bool a, float asp, Color c, float bw, float br) { } }
    public class TooltipAttribute : Attribute { public TooltipAttribute(string s) { } }
}
namespace UnityEngine.SceneManagement { public static class SceneManager { public static void LoadScene(string s) { } } }
namespace RaceLimit
{
    public class RaceCar { public bool abs, tractionControl, stabilityHelp, autoGears; }
    public class ImguiPainter : IMenuPainter
    {
        public float scale; public float Opacity { get; set; }
        public ImguiPainter(Func<HudFont, UnityEngine.Font> f) { }
        public UnityEngine.Rect ToScreen(UnityEngine.Rect r) { return r; }
        public void Fill(UnityEngine.Rect r, UnityEngine.Color c, float radius) { } public void Border(UnityEngine.Rect r, UnityEngine.Color c, float radius, float w) { }
        public void Text(UnityEngine.Rect r, string s, HudFont f, float size, UnityEngine.Color c, UnityEngine.TextAnchor a) { } public float Width(string s, HudFont f, float size) { return 0; }
        public void Map(UnityEngine.Rect r, HudMap m) { } public bool Hover(UnityEngine.Rect r) { return false; } public bool Hit(UnityEngine.Rect r) { return false; }
    }
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

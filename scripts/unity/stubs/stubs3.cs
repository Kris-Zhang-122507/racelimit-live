using System;
namespace UnityEngine
{
    public class RenderTexture : Texture { public static RenderTexture active; public RenderTexture(int w, int h, int d) { } public int antiAliasing; public void Release() { } }
    public class TerrainData : Object { public int heightmapResolution; public Vector3 size; public void SetHeights(int x, int y, float[,] h) { } public TerrainLayer[] terrainLayers; }
    public class TerrainLayer : Object { public Texture2D diffuseTexture; public Vector2 tileSize; }
    public class Terrain : Behaviour { public static GameObject CreateTerrainGameObject(TerrainData d) { return null; } public Material materialTemplate; public float heightmapPixelError, basemapDistance; }
    public static class Resources { public static T Load<T>(string p) where T : Object { return null; } public static T[] LoadAll<T>(string p) where T : Object { return null; } }
    public enum PrimitiveType { Plane, Cube }
    public enum CameraClearFlags { Skybox, SolidColor }
    public enum Space { World, Self }
    [Flags] public enum HideFlags { None = 0, DontSave = 52 }
}
namespace UnityEngine.SceneManagement
{
    public static class SceneManager { public static void LoadScene(string n) { } public static UnityEngine.AsyncOperation LoadSceneAsync(string n) { return null; } public static Scene GetActiveScene() { return new Scene(); } }
    public struct SceneX { }
}
namespace UnityEditor
{
    public class Editor : UnityEngine.ScriptableObject { public UnityEngine.Object target; public virtual void OnInspectorGUI() { } public bool DrawDefaultInspector() { return true; } }
    public class CustomEditor : Attribute { public CustomEditor(Type t) { } }
    public enum MessageType { None, Info, Warning, Error }
    public static class EditorGUILayout { public static void HelpBox(string s, MessageType t) { } public static void BeginHorizontal() { } public static void EndHorizontal() { } public static int Popup(int i, string[] o) { return i; } public static void Space() { } }
    public static class EditorStyles { public static UnityEngine.GUIStyle boldLabel; }
    public static class Handles { public static void Label(UnityEngine.Vector3 p, string s, UnityEngine.GUIStyle st) { } }
    public static class Undo { public static void RecordObject(UnityEngine.Object o, string n) { } }
}

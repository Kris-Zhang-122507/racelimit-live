using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace RaceLimit.EditorTools
{
    // Menu RaceLimit > Track Builder:
    //   New circuit      — a new scene with a short starting layout to change: select "Track Builder" and edit its pieces.
    //   Spa from pieces  — Spa-Francorchamps rebuilt from pieces (its real shape and hills, F1-style run-off), playable.
    // And the Track Builder's Inspector: add straights, corners and library corners, rebuild, make it playable.
    public static class TrackBuilderMenu
    {
        const string PKG = "Packages/com.racelimit.game";

        [MenuItem("RaceLimit/Track Builder/New circuit", priority = 10)]
        public static void NewCircuit()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            RaceLimitSetup.NewScene();
            var go = new GameObject("Track Builder"); var layout = go.AddComponent<TrackLayout>();
            layout.Reset(); layout.Build();
            Selection.activeGameObject = go;
            if (SceneView.lastActiveSceneView != null) { SceneView.lastActiveSceneView.Frame(new Bounds(Vector3.zero, Vector3.one * 900), false); }
            Debug.Log("RaceLimit: a new circuit. Select \"Track Builder\" to change its pieces; then press \"Make it playable\" in its Inspector.");
        }

        [MenuItem("RaceLimit/Track Builder/Spa from pieces", priority = 11)]
        public static void SpaFromPieces()
        {
            var json = AssetDatabase.LoadAssetAtPath<TextAsset>(PKG + "/Tracks/spa-francorchamps/spa-francorchamps.track.json");
            if (json == null) { EditorUtility.DisplayDialog("RaceLimit", "Couldn't load Spa's track data.", "OK"); return; }
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            var d = JsonUtility.FromJson<TrackInfo.Data>(json.text);
            // where the real pit lane leaves and joins, and which side it's on
            int pe = -1, px = -1, side = -1;
            if (d.hasPit && d.pitX != null && d.pitX.Length > 2)
            {
                pe = Nearest(d, d.pitX[0], d.pitZ[0]); px = Nearest(d, d.pitX[d.pitX.Length - 1], d.pitZ[d.pitZ.Length - 1]);
                int m = d.pitX.Length / 2, mi = Nearest(d, d.pitX[m], d.pitZ[m]), n = d.n;
                float tx = -(d.x[(mi + 1) % n] - d.x[mi]), tz = d.z[(mi + 1) % n] - d.z[mi]; // (in this scene's terms: x mirrored)
                side = (-d.pitX[m] + d.x[mi]) * -tz + (d.pitZ[m] - d.z[mi]) * tx > 0 ? 1 : -1;
            }
            Vector3 start; float head; PitSetup pit;
            var pieces = TrackGen.FitPieces(d.x, d.y, d.z, d.corners, d.half, out start, out head, pe, px, out pit, side);
            RaceLimitSetup.NewScene();
            var go = new GameObject("Track Builder"); var layout = go.AddComponent<TrackLayout>();
            layout.trackName = "Spa (Track Builder)"; layout.halfWidth = d.half; layout.startPosition = start; layout.startHeading = head;
            layout.pieces = pieces; layout.pit = pit ?? new PitSetup { enabled = false };
            layout.Build();
            MakePlayable(layout);
        }

        static int Nearest(TrackInfo.Data d, float x, float z) { int b = 0; float bd = float.MaxValue; for (int i = 0; i < d.n; i++) { float q = (d.x[i] - x) * (d.x[i] - x) + (d.z[i] - z) * (d.z[i] - z); if (q < bd) { bd = q; b = i; } } return b; }

        // the car, the game and the camera; save the scene, put it in the build and in the menu's list
        public static void MakePlayable(TrackLayout layout)
        {
            if (RaceLimitSetup.CarAsset() == null) { EditorUtility.DisplayDialog("RaceLimit", "Couldn't load the car model (" + PKG + "/Cars/car.glb). Is glTFast installed? (RaceLimit > Install glTFast)", "OK"); return; }
            layout.Build();
            var info = layout.GetComponent<TrackInfo>();
            if (info.data == null) { EditorUtility.DisplayDialog("RaceLimit", "The layout didn't build: " + layout.report, "OK"); return; }
            if (Object.FindAnyObjectByType<RaceSession>() == null) RaceLimitSetup.AddGame(info);
            SaveMaterials(layout);
            info.model = null; // (the circuit is built again when the game starts; nothing generated is saved in the scene)
            if (Object.FindAnyObjectByType<Light>() == null) { var sun = new GameObject("Sun").AddComponent<Light>(); sun.type = LightType.Directional; sun.intensity = 1.7f; sun.shadows = LightShadows.Soft; sun.transform.rotation = Quaternion.Euler(42, -40, 0); }
            string name = SceneName(layout.trackName);
            var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            RaceLimitSetup.SaveAndList(scene, name, info, true);
            if (!File.Exists("Assets/RaceLimit/Scenes/" + RaceSettings.MenuScene + ".unity")) RaceLimitSetup.BuildMenu(name);
            Selection.activeGameObject = layout.gameObject;
        }

        // the built-in materials (and their textures) saved as assets, so a build of the game keeps their shaders; also
        // where to change them: Assets/RaceLimit/Generated/Track
        static void SaveMaterials(TrackLayout layout)
        {
            const string dir = "Assets/RaceLimit/Generated/Track";
            Directory.CreateDirectory(dir);
            var keys = new List<string> { "rl_tree_leaves", "rl_tree_trunk" };
            if (layout.result != null) foreach (var g in layout.result.meshes) if (!keys.Contains(g.mat)) keys.Add(g.mat);
            if (!keys.Contains("rl_ground_grass")) keys.Add("rl_ground_grass");
            foreach (var key in keys)
            {
                if (layout.materials.Any(m => m != null && m.name == key)) continue;
                string path = dir + "/" + key + ".mat";
                var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (mat == null)
                {
                    var src = TrackMaterials.Get(key); mat = new Material(src) { name = key };
                    AssetDatabase.CreateAsset(mat, path);
                    var tex = src.mainTexture as Texture2D;
                    if (tex != null && string.IsNullOrEmpty(AssetDatabase.GetAssetPath(tex))) { var copy = Object.Instantiate(tex); copy.name = key + "_tex"; AssetDatabase.AddObjectToAsset(copy, mat); mat.mainTexture = copy; }
                }
                layout.materials.Add(mat);
            }
            var sh = Shader.Find("Universal Render Pipeline/Terrain/Lit");
            if (sh != null && !layout.materials.Any(m => m != null && m.name == "rl_terrain_template"))
            {
                string path = dir + "/rl_terrain_template.mat"; var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (mat == null) { mat = new Material(sh) { name = "rl_terrain_template" }; AssetDatabase.CreateAsset(mat, path); }
                layout.materials.Add(mat);
            }
            AssetDatabase.SaveAssets();
            EditorUtility.SetDirty(layout);
        }

        static string SceneName(string n)
        {
            var s = new string((n ?? "Circuit").Select(c => char.IsLetterOrDigit(c) || c == ' ' || c == '-' ? c : ' ').ToArray()).Trim();
            return s.Length == 0 ? "Circuit" : s;
        }

        // ---- the corner library ----
        [System.Serializable] public class LibCorner { public string name, where; public float half; public bool real; public ShapeStep[] steps; }
        [System.Serializable] public class LibFile { public LibCorner[] corners; }
        static LibFile lib;
        public static LibFile Library()
        {
            if (lib != null) return lib;
            var t = AssetDatabase.LoadAssetAtPath<TextAsset>(PKG + "/Library/corners.json");
            lib = t != null ? JsonUtility.FromJson<LibFile>(t.text) : new LibFile { corners = new LibCorner[0] };
            return lib;
        }

        public static TrackPiece FromLibrary(LibCorner c)
        {
            var p = new TrackPiece { kind = PieceKind.Shape, name = c.name, shape = (ShapeStep[])c.steps.Clone() };
            float turn = 0, minR = 9999; foreach (var s in c.steps) { turn += s.turn; if (Mathf.Abs(s.turn) > 0.01f) minR = Mathf.Min(minR, s.len / (Mathf.Abs(s.turn) * Mathf.Deg2Rad)); }
            p.SetCornerRunoff(minR, turn > 0);
            return p;
        }
    }

    [CustomEditor(typeof(TrackLayout))]
    public class TrackLayoutEditor : Editor
    {
        int libPick;

        public override void OnInspectorGUI()
        {
            var t = (TrackLayout)target;
            EditorGUILayout.HelpBox("The circuit is built from the pieces below, in order, starting at the start line; the end is joined smoothly back to the start. Change anything and the Scene view updates. Each piece has its own run-off, barriers, fences and kerbs on each side.", MessageType.Info);
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("+ Straight")) Add(t, TrackPiece.Straight(200));
            if (GUILayout.Button("+ Left corner")) Add(t, TrackPiece.Corner(TurnDirection.Left, 90, 40, "Corner"));
            if (GUILayout.Button("+ Right corner")) Add(t, TrackPiece.Corner(TurnDirection.Right, 90, 40, "Corner"));
            EditorGUILayout.EndHorizontal();
            var L = TrackBuilderMenu.Library().corners;
            if (L != null && L.Length > 0)
            {
                EditorGUILayout.BeginHorizontal();
                libPick = EditorGUILayout.Popup(libPick, L.Select(c => c.name + " (" + c.where + ")").ToArray());
                if (GUILayout.Button("+ From library", GUILayout.Width(120))) Add(t, TrackBuilderMenu.FromLibrary(L[Mathf.Clamp(libPick, 0, L.Length - 1)]));
                EditorGUILayout.EndHorizontal();
            }
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Remove last piece") && t.pieces.Count > 0) { Undo.RecordObject(t, "Remove piece"); t.pieces.RemoveAt(t.pieces.Count - 1); t.Build(); }
            if (GUILayout.Button("Rebuild")) t.Build();
            EditorGUILayout.EndHorizontal();
            GUI.backgroundColor = new Color(1f, 0.75f, 0.35f);
            if (GUILayout.Button("Make it playable (car, timing, display) and save", GUILayout.Height(30))) TrackBuilderMenu.MakePlayable(t);
            GUI.backgroundColor = Color.white;
            EditorGUILayout.Space();
            DrawDefaultInspector();
        }

        void Add(TrackLayout t, TrackPiece p) { Undo.RecordObject(t, "Add piece"); t.pieces.Add(p); EditorUtility.SetDirty(t); t.Build(); }

        // the pieces' names in the Scene view, where each one starts
        void OnSceneGUI()
        {
            var t = (TrackLayout)target; if (t.result == null || t.result.pieceStarts == null) return;
            var style = new GUIStyle(EditorStyles.boldLabel); style.normal.textColor = new Color(1f, 0.75f, 0.3f);
            for (int i = 0; i < t.pieces.Count && i < t.result.pieceStarts.Count; i++)
                Handles.Label(t.result.pieceStarts[i] + Vector3.up * 6, (i + 1) + ". " + t.pieces[i].name, style);
        }
    }
}

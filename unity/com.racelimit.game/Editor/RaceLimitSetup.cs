using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.PackageManager;
using UnityEditor.PackageManager.Requests;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace RaceLimit.EditorTools
{
    // Menu RaceLimit:
    //   Build Spa scene   — makes Assets/RaceLimit/Scenes/Spa.unity: the circuit (with colliders and surface types on the
    //                       ground, invisible collision walls), the sun and sky, the car on the grid, the cameras, the
    //                       timing and the on-screen display. Press Play to drive. (And the menu, the first time.)
    //   Build main menu   — makes Assets/RaceLimit/Scenes/RaceLimit Menu.unity, the first scene of the game.
    //   Track Builder     — see TrackBuilderMenu.
    //   Install glTFast   — Unity's glTF importer, which the circuit and car models need (asked for automatically).
    [InitializeOnLoad]
    public static class RaceLimitSetup
    {
        const string PKG = "Packages/com.racelimit.game";
        const string OUT = "Assets/RaceLimit";
        static AddRequest addRequest;

        static RaceLimitSetup()
        {
            EditorApplication.delayCall += () =>
            {
                if (HasGltfast() || SessionState.GetBool("RaceLimit.askedGltf", false)) return;
                SessionState.SetBool("RaceLimit.askedGltf", true);
                if (EditorUtility.DisplayDialog("RaceLimit", "RaceLimit needs Unity's glTF importer (glTFast) to load the circuit and car models. Install it now?", "Install", "Later"))
                    InstallGltfast();
            };
        }

        static bool HasGltfast()
        {
            return AppDomain.CurrentDomain.GetAssemblies().Any(a => a.GetName().Name == "glTFast");
        }

        [MenuItem("RaceLimit/Install glTFast", priority = 20)]
        public static void InstallGltfast()
        {
            if (addRequest != null) return;
            addRequest = Client.Add("com.unity.cloud.gltfast");
            EditorApplication.update += WaitForAdd;
            Debug.Log("RaceLimit: installing glTFast…");
        }

        static void WaitForAdd()
        {
            if (addRequest == null || !addRequest.IsCompleted) return;
            EditorApplication.update -= WaitForAdd;
            if (addRequest.Status == StatusCode.Success) Debug.Log("RaceLimit: glTFast " + addRequest.Result.version + " installed. Now use RaceLimit > Build Spa scene.");
            else Debug.LogError("RaceLimit: couldn't install glTFast: " + (addRequest.Error != null ? addRequest.Error.message : "unknown error") + ". Install it from Window > Package Manager > + > Add package by name: com.unity.cloud.gltfast");
            addRequest = null;
        }

        [MenuItem("RaceLimit/Build Spa scene", priority = 1)]
        public static void BuildSpa() { Build("spa-francorchamps", "Spa"); }

        [MenuItem("RaceLimit/Build main menu", priority = 2)]
        public static void BuildMenuItem() { if (EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) { BuildMenu(); } }

        public static void Build(string slug, string sceneName)
        {
            if (!HasGltfast())
            {
                if (EditorUtility.DisplayDialog("RaceLimit", "The circuit and car are glTF models, so Unity's glTF importer (glTFast) has to be installed first. Install it now? (Then run Build again.)", "Install", "Cancel")) InstallGltfast();
                return;
            }
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            string dir = PKG + "/Tracks/" + slug + "/", glbPath = dir + slug + ".glb";
            var trackAsset = LoadModel(glbPath);
            var json = AssetDatabase.LoadAssetAtPath<TextAsset>(dir + slug + ".track.json");
            if (trackAsset == null || json == null || CarAsset() == null)
            {
                EditorUtility.DisplayDialog("RaceLimit", "Couldn't load " + (trackAsset == null ? glbPath : json == null ? dir + slug + ".track.json" : PKG + "/Cars/car.glb") + ". Check the Console for import errors.", "OK");
                return;
            }
            try
            {
                EditorUtility.DisplayProgressBar("RaceLimit", "Building the " + sceneName + " scene…", 0.1f);
                var scene = NewScene();
                // ---- the circuit ----
                var track = (GameObject)PrefabUtility.InstantiatePrefab(trackAsset);
                track.name = "Track · " + sceneName;
                // (colliders are added by TrackInfo each time the game starts, so a re-exported model can't leave the track hollow;
                // and no static batching: it swaps each piece's mesh for one combined mesh, which the colliders can't use)
                var info = track.AddComponent<TrackInfo>(); info.trackJson = json; info.model = track.transform;
                info.Load();
                EditorUtility.DisplayProgressBar("RaceLimit", "Sun, sky and car…", 0.6f);
                AddGame(info);
                SaveAndList(scene, sceneName, info, false);
                if (!MenuExists()) BuildMenu(sceneName);
            }
            finally { EditorUtility.ClearProgressBar(); }
        }

        // ---- the pieces every scene shares ----

        public static GameObject CarAsset() { return LoadModel(PKG + "/Cars/car.glb"); }

        // an empty scene with the sun, the sky and the lighting
        public static Scene NewScene()
        {
            Directory.CreateDirectory(OUT + "/Scenes"); Directory.CreateDirectory(OUT + "/Generated"); Directory.CreateDirectory(OUT + "/Resources");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var sunGo = new GameObject("Sun"); var sun = sunGo.AddComponent<Light>();
            sun.type = LightType.Directional; sun.intensity = 1.7f; sun.color = new Color(1f, 0.96f, 0.9f); sun.shadows = LightShadows.Soft; sun.shadowStrength = 0.85f;
            sunGo.transform.rotation = Quaternion.Euler(42f, -40f, 0f);
            RenderSettings.sun = sun;
            var skyShader = Shader.Find("Skybox/Procedural");
            if (skyShader != null)
            {
                var sky = new Material(skyShader) { name = "RL_Sky" };
                sky.SetFloat("_SunSize", 0.035f); sky.SetFloat("_AtmosphereThickness", 0.9f); sky.SetColor("_SkyTint", new Color(0.55f, 0.62f, 0.72f)); sky.SetColor("_GroundColor", new Color(0.4f, 0.42f, 0.42f)); sky.SetFloat("_Exposure", 1.25f);
                RenderSettings.skybox = SaveAsset(sky, OUT + "/Generated/RL_Sky.mat");
            }
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.62f, 0.7f, 0.82f); RenderSettings.ambientEquatorColor = new Color(0.52f, 0.54f, 0.52f); RenderSettings.ambientGroundColor = new Color(0.28f, 0.27f, 0.24f);
            RenderSettings.fog = true; RenderSettings.fogMode = FogMode.ExponentialSquared; RenderSettings.fogDensity = 0.00045f; RenderSettings.fogColor = new Color(0.74f, 0.79f, 0.85f);
            return scene;
        }

        // the car on the grid, the game (input, timing, display, Tecpro) and the camera
        public static RaceCar AddGame(TrackInfo info)
        {
            var carRoot = new GameObject("PlayerCar");
            var model = (GameObject)PrefabUtility.InstantiatePrefab(CarAsset()); model.transform.SetParent(carRoot.transform, false);
            // (the car should face +Z: if the importer turned it round, turn it back)
            float zf = 0, zr = 0;
            foreach (var t in model.GetComponentsInChildren<Transform>(true)) { if (t.name.StartsWith("RL_Wheel_F")) zf += t.position.z; else if (t.name.StartsWith("RL_Wheel_R")) zr += t.position.z; }
            if (zf < zr) model.transform.localRotation = Quaternion.Euler(0, 180, 0);
            carRoot.AddComponent<Rigidbody>();
            var box = carRoot.AddComponent<BoxCollider>(); box.center = new Vector3(0, 0.62f, 0.1f); box.size = new Vector3(1.8f, 0.5f, 5.2f);
            var car = carRoot.AddComponent<RaceCar>();
            SetLayer(carRoot, 2); // (Ignore Raycast: the wheels' rays don't hit the car itself)
            var grid = info.PoseAt(-40, info.data.half * 0.4f, 0.45f);
            carRoot.transform.SetPositionAndRotation(grid.position, grid.rotation);

            var game = new GameObject("RaceLimit");
            var input = game.AddComponent<CarInput>(); var session = game.AddComponent<RaceSession>(); var hud = game.AddComponent<RaceHud>();
            session.track = info; session.car = car; session.input = input; car.input = input; hud.session = session; hud.car = car;
            hud.barlow500 = LoadFont("Barlow_500Medium"); hud.barlow600 = LoadFont("Barlow_600SemiBold"); hud.barlow700 = LoadFont("Barlow_700Bold"); hud.barlowCondensed700 = LoadFont("BarlowCondensed_700Bold"); hud.jetBrainsMono600 = LoadFont("JetBrainsMono_600SemiBold");
            var tec = game.AddComponent<TecproBarrier>(); tec.track = info; tec.car = car;
            tec.bannerTexture = AssetDatabase.LoadAssetAtPath<Texture2D>(PKG + "/Textures/tecpro_banner.png");
            // (saved as assets, so a build keeps their shader and they can be changed in the editor)
            tec.blueMaterial = SaveMat(TecproBarrier.Mat(tec.blueColour, 0.4f), "RL_TecproBlue"); tec.whiteMaterial = SaveMat(TecproBarrier.Mat(tec.whiteColour, 0.4f), "RL_TecproWhite");
            tec.darkMaterial = SaveMat(TecproBarrier.Mat(tec.darkColour, 0.3f), "RL_TecproStrap"); tec.coverMaterial = SaveMat(TecproBarrier.BannerMat(tec.bannerTexture), "RL_TecproCover");
            var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
            var cam = camGo.AddComponent<Camera>(); cam.nearClipPlane = 0.1f; cam.farClipPlane = 6000f; cam.fieldOfView = 58f;
            camGo.AddComponent<AudioListener>();
            var chase = camGo.AddComponent<ChaseCamera>(); chase.car = car; chase.eyeZ = info.data.carEyeZ;
            camGo.transform.position = grid.position - grid.rotation * Vector3.forward * 6.2f + Vector3.up * 1.9f; camGo.transform.LookAt(grid.position + Vector3.up * 0.9f);
            UrpCameraExtras(camGo);
            UrpShadows();
            return car;
        }

        public static Font LoadFont(string file) { return AssetDatabase.LoadAssetAtPath<Font>(PKG + "/Fonts/" + file + ".ttf"); }

        // save the scene, put it in the build (after the menu) and in the menu's list of circuits
        public static void SaveAndList(Scene scene, string sceneName, TrackInfo info, bool built)
        {
            string path = OUT + "/Scenes/" + sceneName + ".unity";
            EditorSceneManager.SaveScene(scene, path);
            AddToBuild(path, false);
            if (info != null && info.data != null)
            {
                var list = ReadList(); var entries = list.tracks.Where(t => t.scene != sceneName).ToList();
                entries.Add(TrackRegistry.Describe(info.data, sceneName, built));
                list.tracks = entries.ToArray(); WriteList(list);
            }
            Debug.Log("RaceLimit: built " + path + ". Press Play to drive" + (MenuExists() ? ", or open the RaceLimit Menu scene to start from the menu." : "."));
        }

        static void AddToBuild(string path, bool first)
        {
            var list = EditorBuildSettings.scenes.Where(s => s.path != path).ToList();
            var item = new EditorBuildSettingsScene(path, true);
            if (first) list.Insert(0, item); else { int at = list.FindIndex(s => s.path.EndsWith("/" + RaceSettings.MenuScene + ".unity")); list.Insert(at >= 0 ? at + 1 : 0, item); }
            EditorBuildSettings.scenes = list.ToArray();
        }

        const string ListPath = OUT + "/Resources/" + TrackRegistry.ResourceName + ".json";
        static TrackList ReadList()
        {
            if (!File.Exists(ListPath)) return new TrackList();
            var l = JsonUtility.FromJson<TrackList>(File.ReadAllText(ListPath)); return l != null && l.tracks != null ? l : new TrackList();
        }
        static void WriteList(TrackList l) { Directory.CreateDirectory(OUT + "/Resources"); File.WriteAllText(ListPath, JsonUtility.ToJson(l)); AssetDatabase.ImportAsset(ListPath); }

        static bool MenuExists() { return File.Exists(OUT + "/Scenes/" + RaceSettings.MenuScene + ".unity"); }

        // ---- the main menu scene: a dark studio with the car on a turntable, filmed for the Race weekend card ----
        public static void BuildMenu(string reopen = null)
        {
            var carAsset = CarAsset(); if (carAsset == null) { Debug.LogError("RaceLimit: couldn't load the car model for the menu"); return; }
            Directory.CreateDirectory(OUT + "/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat; RenderSettings.ambientLight = new Color(0.16f, 0.17f, 0.2f); RenderSettings.skybox = null; RenderSettings.fog = false;
            // the floor, the car, the lights
            var floor = GameObject.CreatePrimitive(PrimitiveType.Plane); floor.name = "Studio floor"; floor.transform.localScale = new Vector3(4, 1, 4);
            floor.GetComponent<Renderer>().sharedMaterial = SaveMat(TrackMaterials.Lit(new Color(0.07f, 0.075f, 0.09f), 0.75f), "RL_StudioFloor");
            var turntable = new GameObject("Turntable");
            var car = (GameObject)PrefabUtility.InstantiatePrefab(carAsset); car.transform.SetParent(turntable.transform, false);
            float zf = 0, zr = 0;
            foreach (var t in car.GetComponentsInChildren<Transform>(true)) { if (t.name.StartsWith("RL_Wheel_F")) zf += t.position.z; else if (t.name.StartsWith("RL_Wheel_R")) zr += t.position.z; }
            if (zf < zr) car.transform.localRotation = Quaternion.Euler(0, 180, 0);
            turntable.transform.rotation = Quaternion.Euler(0, 140, 0);
            StudioLight(new Vector3(50, -30, 0), 1.3f, new Color(1f, 0.95f, 0.88f), true);
            StudioLight(new Vector3(25, 150, 0), 0.7f, new Color(0.7f, 0.8f, 1f), false);
            StudioLight(new Vector3(15, 60, 0), 0.5f, new Color(1f, 0.75f, 0.45f), false);
            // the light strips on the studio ceiling, seen in the background
            var strip = SaveMat(TrackMaterials.Lit(new Color(1f, 0.82f, 0.45f), 0.2f), "RL_StudioStrip"); strip.EnableKeyword("_EMISSION"); strip.SetColor("_EmissionColor", new Color(1f, 0.78f, 0.4f) * 2.2f);
            for (int i = -3; i <= 3; i++) { var s = GameObject.CreatePrimitive(PrimitiveType.Cube); s.name = "Light strip"; s.transform.position = new Vector3(i * 3.2f, 3.2f, 6.5f); s.transform.localScale = new Vector3(2.4f, 0.06f, 0.06f); s.GetComponent<Renderer>().sharedMaterial = strip; UnityEngine.Object.DestroyImmediate(s.GetComponent<Collider>()); }
            // the camera that films the car (into the card), and the one that draws the menu on the screen
            var studioGo = new GameObject("Studio camera"); var studio = studioGo.AddComponent<Camera>();
            studio.clearFlags = CameraClearFlags.SolidColor; studio.backgroundColor = new Color(0.03f, 0.035f, 0.05f); studio.fieldOfView = 30; studio.nearClipPlane = 0.1f; studio.farClipPlane = 100;
            studioGo.transform.position = new Vector3(0, 1.35f, -8.6f); studioGo.transform.LookAt(new Vector3(0, 0.45f, 0));
            UrpCameraExtras(studioGo);
            var screenGo = new GameObject("Main Camera") { tag = "MainCamera" }; var sc = screenGo.AddComponent<Camera>();
            sc.clearFlags = CameraClearFlags.SolidColor; sc.backgroundColor = new Color(0.043f, 0.05f, 0.07f); sc.cullingMask = 0; sc.depth = 10; screenGo.AddComponent<AudioListener>();
            var menu = new GameObject("RaceLimit Menu").AddComponent<MainMenu>();
            menu.studioCamera = studio; menu.turntable = turntable.transform;
            menu.barlow500 = LoadFont("Barlow_500Medium"); menu.barlow600 = LoadFont("Barlow_600SemiBold"); menu.barlow700 = LoadFont("Barlow_700Bold"); menu.barlowCondensed700 = LoadFont("BarlowCondensed_700Bold"); menu.jetBrainsMono600 = LoadFont("JetBrainsMono_600SemiBold");
            string path = OUT + "/Scenes/" + RaceSettings.MenuScene + ".unity";
            EditorSceneManager.SaveScene(scene, path);
            AddToBuild(path, true);
            Debug.Log("RaceLimit: built " + path + " (the first scene in the build). Press Play here to start from the menu.");
            if (reopen != null) EditorSceneManager.OpenScene(OUT + "/Scenes/" + reopen + ".unity");
        }

        static void StudioLight(Vector3 euler, float intensity, Color c, bool shadows)
        {
            var go = new GameObject("Studio light"); var l = go.AddComponent<Light>(); l.type = LightType.Directional; l.intensity = intensity; l.color = c; l.shadows = shadows ? LightShadows.Soft : LightShadows.None;
            go.transform.rotation = Quaternion.Euler(euler);
        }

        static GameObject LoadModel(string path)
        {
            var go = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (go == null) { AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate); go = AssetDatabase.LoadAssetAtPath<GameObject>(path); }
            return go;
        }

        public static Material SaveMat(Material m, string name) { return SaveAsset(m, OUT + "/Generated/" + name + ".mat"); }

        public static T SaveAsset<T>(T obj, string path) where T : UnityEngine.Object
        {
            var existing = AssetDatabase.LoadAssetAtPath<T>(path);
            if (existing != null) { EditorUtility.CopySerialized(obj, existing); EditorUtility.SetDirty(existing); return existing; }
            AssetDatabase.CreateAsset(obj, path); return obj;
        }

        static void SetLayer(GameObject go, int layer) { go.layer = layer; foreach (Transform c in go.transform) SetLayer(c.gameObject, layer); }

        // URP, when it's the active pipeline: post-processing and anti-aliasing on the camera, shadows drawn further out.
        // (Done by name so this still compiles in a project without URP.)
        static void UrpCameraExtras(GameObject camGo)
        {
            var t = Type.GetType("UnityEngine.Rendering.Universal.UniversalAdditionalCameraData, Unity.RenderPipelines.Universal.Runtime");
            if (t == null) return;
            var data = camGo.GetComponent(t); if (data == null) data = camGo.AddComponent(t);
            Set(data, "renderPostProcessing", true);
            var aa = t.GetProperty("antialiasing");
            if (aa != null) { try { aa.SetValue(data, Enum.Parse(aa.PropertyType, "SubpixelMorphologicalAntiAliasing")); } catch { } }
        }

        static void UrpShadows()
        {
            var rp = UnityEngine.Rendering.GraphicsSettings.currentRenderPipeline;
            QualitySettings.shadowDistance = 300f;
            if (rp == null) return;
            Set(rp, "shadowDistance", 300f); Set(rp, "shadowCascadeCount", 4);
            EditorUtility.SetDirty(rp);
        }

        static void Set(object o, string prop, object value)
        {
            var p = o.GetType().GetProperty(prop);
            if (p != null && p.CanWrite) { try { p.SetValue(o, value); } catch { } }
        }
    }
}

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
    //                       timing and the on-screen display. Press Play to drive.
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

        public static void Build(string slug, string sceneName)
        {
            if (!HasGltfast())
            {
                if (EditorUtility.DisplayDialog("RaceLimit", "The circuit and car are glTF models, so Unity's glTF importer (glTFast) has to be installed first. Install it now? (Then run Build again.)", "Install", "Cancel")) InstallGltfast();
                return;
            }
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            string dir = PKG + "/Tracks/" + slug + "/", glbPath = dir + slug + ".glb", carPath = PKG + "/Cars/car.glb";
            var trackAsset = LoadModel(glbPath); var carAsset = LoadModel(carPath);
            var json = AssetDatabase.LoadAssetAtPath<TextAsset>(dir + slug + ".track.json");
            if (trackAsset == null || carAsset == null || json == null)
            {
                EditorUtility.DisplayDialog("RaceLimit", "Couldn't load " + (trackAsset == null ? glbPath : carAsset == null ? carPath : dir + slug + ".track.json") + ". Check the Console for import errors.", "OK");
                return;
            }
            try
            {
                EditorUtility.DisplayProgressBar("RaceLimit", "Building the " + sceneName + " scene…", 0.1f);
                Directory.CreateDirectory(OUT + "/Scenes"); Directory.CreateDirectory(OUT + "/Generated");
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

                // ---- the circuit ----
                var track = (GameObject)PrefabUtility.InstantiatePrefab(trackAsset);
                track.name = "Track · " + sceneName;
                // (colliders are added by TrackInfo each time the game starts, so a re-exported model can't leave the track hollow;
                // and no static batching: it swaps each piece's mesh for one combined mesh, which the colliders can't use)
                var info = track.AddComponent<TrackInfo>(); info.trackJson = json; info.model = track.transform;
                info.Load();
                EditorUtility.DisplayProgressBar("RaceLimit", "Sun, sky and car…", 0.6f);

                // ---- sun and sky ----
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

                // ---- the car ----
                var carRoot = new GameObject("PlayerCar");
                var model = (GameObject)PrefabUtility.InstantiatePrefab(carAsset); model.transform.SetParent(carRoot.transform, false);
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

                // ---- game: input, session, display; the camera ----
                var game = new GameObject("RaceLimit");
                var input = game.AddComponent<CarInput>(); var session = game.AddComponent<RaceSession>(); var hud = game.AddComponent<RaceHud>();
                session.track = info; session.car = car; session.input = input; car.input = input; hud.session = session; hud.car = car;
                hud.barlow500 = AssetDatabase.LoadAssetAtPath<Font>(PKG + "/Fonts/Barlow_500Medium.ttf"); hud.barlow600 = AssetDatabase.LoadAssetAtPath<Font>(PKG + "/Fonts/Barlow_600SemiBold.ttf");
                hud.barlow700 = AssetDatabase.LoadAssetAtPath<Font>(PKG + "/Fonts/Barlow_700Bold.ttf"); hud.barlowCondensed700 = AssetDatabase.LoadAssetAtPath<Font>(PKG + "/Fonts/BarlowCondensed_700Bold.ttf");
                hud.jetBrainsMono600 = AssetDatabase.LoadAssetAtPath<Font>(PKG + "/Fonts/JetBrainsMono_600SemiBold.ttf");
                var tec = game.AddComponent<TecproBarrier>(); tec.track = info; tec.car = car;
                tec.bannerTexture = AssetDatabase.LoadAssetAtPath<Texture2D>(PKG + "/Textures/tecpro_banner.png");
                // (saved as assets, so a build keeps their shader and they can be changed in the editor)
                tec.bodyMaterial = SaveMat(TecproBarrier.Mat(tec.moduleColour, 0.35f), "RL_Tecpro"); tec.darkMaterial = SaveMat(TecproBarrier.Mat(tec.darkColour, 0.2f), "RL_TecproStrap");
                tec.spacerMaterial = SaveMat(TecproBarrier.Mat(tec.spacerColour, 0.4f), "RL_TecproSpacer"); tec.bannerMaterial = SaveMat(TecproBarrier.BannerMat(tec.bannerTexture), "RL_TecproBanner");
                var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
                var cam = camGo.AddComponent<Camera>(); cam.nearClipPlane = 0.1f; cam.farClipPlane = 6000f; cam.fieldOfView = 58f;
                camGo.AddComponent<AudioListener>();
                var chase = camGo.AddComponent<ChaseCamera>(); chase.car = car; chase.eyeZ = info.data.carEyeZ;
                camGo.transform.position = grid.position - grid.rotation * Vector3.forward * 6.2f + Vector3.up * 1.9f; camGo.transform.LookAt(grid.position + Vector3.up * 0.9f);
                UrpCameraExtras(camGo);
                UrpShadows();

                string path = OUT + "/Scenes/" + sceneName + ".unity";
                EditorSceneManager.SaveScene(scene, path);
                var list = EditorBuildSettings.scenes.Where(s => s.path != path).ToList(); list.Insert(0, new EditorBuildSettingsScene(path, true)); EditorBuildSettings.scenes = list.ToArray();
                Debug.Log("RaceLimit: built " + path + ". Press Play to drive.");
                Selection.activeGameObject = carRoot;
                if (SceneView.lastActiveSceneView != null) SceneView.lastActiveSceneView.FrameSelected();
            }
            finally { EditorUtility.ClearProgressBar(); }
        }

        static GameObject LoadModel(string path)
        {
            var go = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (go == null) { AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate); go = AssetDatabase.LoadAssetAtPath<GameObject>(path); }
            return go;
        }

        static Material SaveMat(Material m, string name) { return SaveAsset(m, OUT + "/Generated/" + name + ".mat"); }

        static T SaveAsset<T>(T obj, string path) where T : UnityEngine.Object
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

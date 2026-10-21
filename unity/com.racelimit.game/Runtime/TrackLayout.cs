using System.Collections.Generic;
using UnityEngine;

namespace RaceLimit
{
    // The Track Builder: a circuit made of pieces (TrackPiece) — straights, corners, corners from the library, or a real
    // track's shape — with what's beside each piece (run-off, barriers, fences, kerbs), a pit lane, and terrain and trees
    // round it. Change anything in the Inspector and the circuit is rebuilt in the Scene view; the game builds it again
    // when it starts (nothing generated is saved in the scene). Its TrackInfo gets the track data, so timing, the map,
    // the pit limiter, Tecpro and the collisions work as on the real circuits.
    [ExecuteAlways]
    [DefaultExecutionOrder(-200)]
    [RequireComponent(typeof(TrackInfo))]
    public class TrackLayout : MonoBehaviour
    {
        public string trackName = "My circuit";
        [Tooltip("Half the track's width (m)")] [Range(4, 10)] public float halfWidth = 7f;
        [Tooltip("Where the start line is, and which way the track leaves it")] public Vector3 startPosition;
        [Range(-180, 180)] public float startHeading;
        public List<TrackPiece> pieces = new List<TrackPiece>();
        public PitSetup pit = new PitSetup();
        [Header("Surroundings")]
        public bool terrain = true;
        public bool trees = true;
        [Tooltip("Your own materials in place of the built-in ones: name one like the one it replaces (e.g. rl_ground_grass)")]
        public List<Material> materials = new List<Material>();
        [Header("Last build")] [TextArea(1, 3)] public string report;

        [System.NonSerialized] public GenResult result;
        Transform root;
        bool dirty;

        void Awake() { if (Application.isPlaying) Build(); }
        void OnEnable() { if (!Application.isPlaying) Build(); }
        void OnDisable() { if (!Application.isPlaying) Clear(); }

#if UNITY_EDITOR
        void OnValidate()
        {
            if (Application.isPlaying || dirty) return;
            dirty = true;
            UnityEditor.EditorApplication.delayCall += () => { if (this == null) return; dirty = false; if (isActiveAndEnabled) Build(); };
        }
#endif

        void Clear()
        {
            var old = transform.Find("RL_Generated");
            while (old != null) { if (Application.isPlaying) { old.name = "RL_Old"; old.gameObject.SetActive(false); Destroy(old.gameObject); } else DestroyImmediate(old.gameObject); old = transform.Find("RL_Generated"); }
        }

        T Keep<T>(T o) where T : Object { if (!Application.isPlaying) o.hideFlags = HideFlags.DontSave; return o; }

        public void Build()
        {
            Clear();
            result = TrackGen.Generate(trackName, halfWidth, pieces, pit, startPosition, startHeading);
            report = result.log;
            if (result.data == null) return;
            root = Keep(new GameObject("RL_Generated")).transform; root.SetParent(transform, false);
            root.position = Vector3.zero; root.rotation = Quaternion.identity; root.localScale = Vector3.one;
            foreach (var g in result.meshes) MakeMesh(g.mat, g.v, g.uv, g.t);
            if (terrain) MakeTerrain();
            if (trees) MakeTrees();
            var info = GetComponent<TrackInfo>(); info.model = root; info.UseData(result.data);
        }

        void MakeMesh(string mat, List<Vector3> v, List<Vector2> uv, List<int> t)
        {
            if (v.Count == 0 || t.Count == 0) return;
            var go = Keep(new GameObject(mat)); go.transform.SetParent(root, false);
            var m = Keep(new Mesh { name = mat, indexFormat = UnityEngine.Rendering.IndexFormat.UInt32 });
            m.SetVertices(v); if (uv != null && uv.Count == v.Count) m.SetUVs(0, uv); m.SetTriangles(t, 0); m.RecalculateNormals(); m.RecalculateBounds();
            go.AddComponent<MeshFilter>().sharedMesh = m;
            var r = go.AddComponent<MeshRenderer>(); r.sharedMaterial = TrackMaterials.Get(mat, materials);
            r.shadowCastingMode = mat.StartsWith("rl_ground_") ? UnityEngine.Rendering.ShadowCastingMode.Off : UnityEngine.Rendering.ShadowCastingMode.On;
        }

        void MakeTerrain()
        {
            int res = 513; Vector3 o, size;
            var h = TrackGen.Heights(result, res, 450f, out o, out size);
            var td = Keep(new TerrainData()); td.heightmapResolution = res; td.size = size; td.SetHeights(0, 0, h);
            var layer = Keep(new TerrainLayer()); var grass = TrackMaterials.Get("rl_ground_grass", materials);
            layer.diffuseTexture = grass.mainTexture as Texture2D; layer.tileSize = new Vector2(8, 8);
            td.terrainLayers = new[] { layer };
            var go = Keep(Terrain.CreateTerrainGameObject(td)); go.name = "RL_Terrain"; go.transform.SetParent(root, false); go.transform.position = o;
            var t = go.GetComponent<Terrain>();
            Material tm = null; foreach (var m in materials) if (m != null && m.name == "rl_terrain_template") tm = m;
            if (tm != null) t.materialTemplate = tm;
            else { var sh = Shader.Find("Universal Render Pipeline/Terrain/Lit"); if (sh != null) t.materialTemplate = Keep(new Material(sh)); }
            t.heightmapPixelError = 4; t.basemapDistance = 600;
            go.AddComponent<RLSurface>().kind = SurfaceKind.Terrain;
        }

        // simple pines (a cone on a trunk), in a few combined meshes
        void MakeTrees()
        {
            var lv = new List<Vector3>(); var lt = new List<int>(); var tv = new List<Vector3>(); var tt = new List<int>();
            var rnd = new System.Random(3);
            foreach (var p in result.trees)
            {
                float s = 0.75f + (float)rnd.NextDouble() * 0.6f, rot = (float)rnd.NextDouble() * 6.28f;
                Cone(lv, lt, p + Vector3.up * 2.2f * s, 2.6f * s, 9f * s, 7, rot);
                Cone(tv, tt, p, 0.35f * s, 2.6f * s, 5, rot);
                if (lv.Count > 60000) { MakeMesh("rl_tree_leaves", lv, null, lt); lv = new List<Vector3>(); lt = new List<int>(); }
                if (tv.Count > 60000) { MakeMesh("rl_tree_trunk", tv, null, tt); tv = new List<Vector3>(); tt = new List<int>(); }
            }
            MakeMesh("rl_tree_leaves", lv, null, lt); MakeMesh("rl_tree_trunk", tv, null, tt);
        }
        static void Cone(List<Vector3> v, List<int> t, Vector3 b, float r, float h, int sides, float rot)
        {
            int c = v.Count; v.Add(b + Vector3.up * h);
            for (int k = 0; k < sides; k++) { float a = rot + k * 2 * Mathf.PI / sides; v.Add(b + new Vector3(Mathf.Cos(a) * r, 0, Mathf.Sin(a) * r)); }
            for (int k = 0; k < sides; k++) { t.Add(c); t.Add(c + 1 + (k + 1) % sides); t.Add(c + 1 + k); }
        }

        // a starting layout: a short club circuit
        public void Reset()
        {
            trackName = "My circuit"; halfWidth = 7f; startPosition = Vector3.zero; startHeading = 0;
            pieces = new List<TrackPiece>
            {
                TrackPiece.Straight(420),
                TrackPiece.Corner(TurnDirection.Right, 90, 50, "Turn 1"),
                TrackPiece.Straight(420),
                TrackPiece.Corner(TurnDirection.Right, 45, 120, "Turn 2"),
                TrackPiece.Straight(150),
                TrackPiece.Corner(TurnDirection.Left, 45, 90, "Turn 3"),
                TrackPiece.Corner(TurnDirection.Right, 135, 30, "Hairpin"),
                TrackPiece.Straight(680),
                TrackPiece.Corner(TurnDirection.Right, 45, 60, "Turn 6"),
                TrackPiece.Straight(200),
                TrackPiece.Corner(TurnDirection.Right, 90, 50, "Last corner"),
                TrackPiece.Straight(200),
            };
            pit = new PitSetup { enabled = true, side = TurnDirection.Right, entry = -150, exit = 380, garages = 12 };
        }
    }
}

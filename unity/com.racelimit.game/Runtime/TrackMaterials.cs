using System.Collections.Generic;
using UnityEngine;

namespace RaceLimit
{
    // The Track Builder's materials, made in code with small generated textures: asphalt, kerbs, paint, tarmac run-off,
    // gravel, sand, grass, concrete, armco, catch fence, garages, trees. Each is named after its key (rl_ground_<surface>
    // for ground, so TrackInfo gives it a collider and the tyres the right grip). A material can be swapped for your own
    // on the TrackLayout (Materials list): same name, your look.
    public static class TrackMaterials
    {
        static readonly Dictionary<string, Material> cache = new Dictionary<string, Material>();

        public static Material Get(string key, IList<Material> overrides = null)
        {
            if (overrides != null) foreach (var m in overrides) if (m != null && m.name == key) return m;
            Material mat;
            if (cache.TryGetValue(key, out mat) && mat != null) return mat;
            mat = Make(key); mat.name = key; cache[key] = mat;
            return mat;
        }

        public static Material Lit(Color c, float smooth, Texture2D tex = null, float metal = 0)
        {
            var sh = Shader.Find("Universal Render Pipeline/Lit"); if (sh == null) sh = Shader.Find("Standard");
            var m = new Material(sh) { color = c, enableInstancing = true };
            if (tex != null) m.mainTexture = tex;
            m.SetFloat("_Smoothness", smooth); m.SetFloat("_Glossiness", smooth); m.SetFloat("_Metallic", metal);
            return m;
        }

        static Material Make(string key)
        {
            switch (key)
            {
                case "rl_ground_track": return Lit(Color.white, 0.18f, Noise(new Color(0.26f, 0.27f, 0.29f), 0.07f, 1));
                case "rl_ground_track_pit": return Lit(Color.white, 0.2f, Noise(new Color(0.31f, 0.32f, 0.34f), 0.06f, 2));
                case "rl_ground_runoff": return Lit(Color.white, 0.15f, Noise(new Color(0.34f, 0.36f, 0.4f), 0.06f, 3));
                case "rl_ground_line": case "rl_ground_line_paint": return Lit(new Color(0.93f, 0.93f, 0.92f), 0.3f);
                case "rl_ground_kerb": return Lit(Color.white, 0.35f, Kerb());
                case "rl_ground_gravel": return Lit(Color.white, 0.05f, Noise(new Color(0.76f, 0.68f, 0.52f), 0.16f, 4));
                case "rl_ground_gravel_sand": return Lit(Color.white, 0.05f, Noise(new Color(0.87f, 0.8f, 0.62f), 0.08f, 5));
                case "rl_ground_grass": return Lit(Color.white, 0.08f, Grass());
                case "rl_concrete": return Lit(Color.white, 0.15f, Noise(new Color(0.76f, 0.75f, 0.71f), 0.06f, 6));
                case "rl_armco": return Lit(new Color(0.78f, 0.8f, 0.83f), 0.6f, null, 0.7f);
                case "rl_post": return Lit(new Color(0.45f, 0.47f, 0.5f), 0.4f, null, 0.5f);
                case "rl_fence": return Fence();
                case "rl_garage": return Lit(new Color(0.9f, 0.91f, 0.93f), 0.3f);
                case "rl_garage_door": return Lit(new Color(0.08f, 0.09f, 0.11f), 0.2f);
                case "rl_tree_leaves": return TwoSided(Lit(new Color(0.15f, 0.3f, 0.16f), 0.05f));
                case "rl_tree_trunk": return TwoSided(Lit(new Color(0.3f, 0.22f, 0.16f), 0.05f));
                case "rl_terrain": return Lit(Color.white, 0.05f, Grass());
            }
            return Lit(Color.magenta, 0.2f);
        }

        static Material TwoSided(Material m) { m.SetFloat("_Cull", 0); m.doubleSidedGI = true; return m; }

        static Texture2D Tex(int w, int h, System.Func<int, int, Color> px)
        {
            var t = new Texture2D(w, h, TextureFormat.RGBA32, true) { wrapMode = TextureWrapMode.Repeat, filterMode = FilterMode.Trilinear, anisoLevel = 8 };
            var c = new Color[w * h]; for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) c[y * w + x] = px(x, y);
            t.SetPixels(c); t.Apply(true); return t;
        }
        static float Hash(int x, int y, int seed) { uint h = (uint)(x * 374761393 + y * 668265263 + seed * 2147483647); h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) & 0xffff) / 65535f; }
        // speckled: a base colour with fine grains lighter and darker
        static Texture2D Noise(Color b, float amt, int seed) { return Tex(256, 256, (x, y) => { float n = Hash(x, y, seed) - 0.5f, m = Hash(x / 8, y / 8, seed + 9) - 0.5f; float k = 1 + n * amt * 2 + m * amt * 0.6f; return new Color(b.r * k, b.g * k, b.b * k, 1); }); }
        // red and white, one colour per metre along the track (the strip's v runs half a texture per metre)
        static Texture2D Kerb() { return Tex(8, 64, (x, y) => y < 32 ? new Color(0.78f, 0.14f, 0.15f) : new Color(0.93f, 0.93f, 0.92f)); }
        // mown grass: stripes and grain
        static Texture2D Grass() { return Tex(256, 256, (x, y) => { float n = Hash(x, y, 11) - 0.5f, st = ((y / 64) % 2 == 0) ? 1.04f : 0.95f; float k = st * (1 + n * 0.18f); return new Color(0.27f * k, 0.48f * k, 0.2f * k, 1); }); }
        static Material Fence()
        {
            var t = Tex(64, 64, (x, y) => { int a = (x + y) % 32, b = (x - y + 64) % 32; bool wire = a < 2 || b < 2; return wire ? new Color(0.72f, 0.75f, 0.78f, 1) : new Color(0, 0, 0, 0); });
            var m = Lit(Color.white, 0.4f, t, 0.5f);
            m.SetFloat("_AlphaClip", 1); m.SetFloat("_Cutoff", 0.5f); m.EnableKeyword("_ALPHATEST_ON"); m.SetFloat("_Cull", 0); m.doubleSidedGI = true;
            m.renderQueue = 2450;
            return m;
        }
    }
}

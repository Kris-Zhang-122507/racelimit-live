using UnityEngine;

namespace RaceLimit
{
    // Day or night at a circuit. Night is a floodlit night race: a black sky, the track lit evenly from above in
    // cool white (the floodlights), darker away from it. One light, so it costs nothing extra to draw.
    public static class RLDayNight
    {
        public static bool IsNight(string slug, int timeOfDay)
        {
            if (timeOfDay == 1) return false;
            if (timeOfDay == 2) return true;
            var f = GameData.Circuit(slug); return f != null && f.night;
        }

        public static void Apply(string slug, int timeOfDay)
        {
            if (!IsNight(slug, timeOfDay)) return; // (day: as the scene was built)
            var sun = RenderSettings.sun;
            if (sun == null) { var go = GameObject.Find("Sun"); if (go != null) sun = go.GetComponent<Light>(); }
            if (sun != null)
            {
                sun.transform.rotation = Quaternion.Euler(68f, -35f, 0f);
                sun.color = new Color(0.86f, 0.92f, 1f); sun.intensity = 1.25f; sun.shadowStrength = 0.55f;
            }
            RenderSettings.skybox = null;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.10f, 0.12f, 0.18f); RenderSettings.ambientEquatorColor = new Color(0.09f, 0.10f, 0.14f); RenderSettings.ambientGroundColor = new Color(0.05f, 0.05f, 0.06f);
            RenderSettings.fog = true; RenderSettings.fogColor = new Color(0.02f, 0.025f, 0.045f); RenderSettings.fogDensity = 0.0011f;
            foreach (var cam in Camera.allCameras)
            {
                if (!cam.CompareTag("MainCamera")) continue;
                cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = new Color(0.012f, 0.016f, 0.035f);
            }
        }
    }
}

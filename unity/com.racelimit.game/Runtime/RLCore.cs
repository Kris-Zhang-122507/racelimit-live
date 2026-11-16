using UnityEngine;

namespace RaceLimit
{
    public enum MusicMood { None, Menu, Garage, Loading, Grid, Pause, Replay, Podium }

    // What stays alive from the menu into every session: the music, the graphics preset and the frames-per-second
    // counter. Made the first time anything asks for it.
    //
    // Music: put the audio exported from MuseScore (mp3, ogg or wav) in Assets/RaceLimit/Resources/RL_Music/. The files
    // are matched by words in their names ("Main Theme", "Full Throttle", "Dusk", "Garage", "Loading", "Formation" or
    // "Starting Grid", "Pause", "Replay", "Podium", "Win Sting", "Pole Position", "Race Finish", "Retired"), so the
    // names MuseScore gives them work as they are. Anything missing is simply silent.
    public class RLCore : MonoBehaviour
    {
        static RLCore inst;
        public static RLCore Get()
        {
            if (inst != null) return inst;
            var go = new GameObject("RaceLimit Core"); DontDestroyOnLoad(go);
            inst = go.AddComponent<RLCore>(); inst.Setup();
            return inst;
        }

        AudioSource a, b, sting; bool aLive = true;
        AudioClip[] clips = new AudioClip[0];
        MusicMood mood = MusicMood.None; AudioClip current; int menuAt = -1; float lastVol = -1;
        static readonly string[] MenuSongs = { "main theme", "full throttle", "dusk" };

        void Setup()
        {
            a = NewSource(); b = NewSource(); sting = NewSource(); sting.loop = false;
            var loaded = Resources.LoadAll<AudioClip>("RL_Music"); if (loaded != null) clips = loaded;
            ApplyGraphics(); ApplySound();
        }
        AudioSource NewSource() { var s = gameObject.AddComponent<AudioSource>(); s.playOnAwake = false; s.loop = true; s.volume = 0; s.spatialBlend = 0; s.ignoreListenerPause = true; s.priority = 0; return s; }

        AudioClip Find(params string[] words)
        {
            foreach (var w in words) foreach (var c in clips) if (c != null && c.name.ToLowerInvariant().Replace("-", " ").Replace("_", " ").Contains(w)) return c;
            return null;
        }
        public bool HasMusic { get { return clips.Length > 0; } }
        public int MusicCount { get { return clips.Length; } }

        // which music should be playing now (None = silence: driving)
        public void Music(MusicMood m)
        {
            if (m == mood) return;
            mood = m;
            AudioClip c = null; bool loop = true;
            switch (m)
            {
                case MusicMood.Menu: c = NextMenuSong(); loop = false; break;
                case MusicMood.Garage: c = Find("garage") ?? current; break;
                case MusicMood.Loading: c = Find("loading"); break;
                case MusicMood.Grid: c = Find("formation", "starting grid"); break;
                case MusicMood.Pause: c = Find("pause"); break;
                case MusicMood.Replay: c = Find("replay"); break;
                case MusicMood.Podium: c = Find("podium"); loop = false; break;
            }
            Play(c, loop);
        }
        AudioClip NextMenuSong()
        {
            for (int k = 0; k < MenuSongs.Length; k++) { menuAt = (menuAt + 1) % MenuSongs.Length; var c = Find(MenuSongs[menuAt]); if (c != null) return c; }
            return null;
        }
        void Play(AudioClip c, bool loop)
        {
            if (c == current && c != null) return;
            current = c; aLive = !aLive;
            var s = aLive ? a : b;
            s.clip = c; s.loop = loop; s.volume = 0;
            if (c != null) s.Play(); else s.Stop();
        }
        // a short one-off over whatever is playing: "win sting", "pole position", "race finish", "retired"
        public void Sting(string words) { var c = Find(words); if (c == null) return; sting.clip = c; sting.volume = Volume; sting.Play(); }
        static float Volume { get { float v = RaceSettings.MusicVolume / 10f; return v * v * 0.9f; } }

        // the overall volume (music included)
        public void ApplySound() { AudioListener.volume = Mathf.Clamp01(RaceSettings.SoundVolume / 10f); }

        float fpsT, fps; int fpsN;
        void Update()
        {
            // fade the live source in and the other out
            float dt = Time.unscaledDeltaTime, vol = Volume;
            var live = aLive ? a : b; var old = aLive ? b : a;
            live.volume = Mathf.MoveTowards(live.volume, live.clip != null ? vol : 0, dt * 0.9f);
            old.volume = Mathf.MoveTowards(old.volume, 0, dt * 1.2f);
            if (old.volume <= 0 && old.isPlaying) old.Stop();
            if (vol != lastVol) { lastVol = vol; sting.volume = vol; }
            // the menu's songs follow one another
            if (mood == MusicMood.Menu && current != null && !live.isPlaying && live.volume > 0) { var c = NextMenuSong(); current = null; Play(c, false); }
            fpsN++; fpsT += dt; if (fpsT >= 0.5f) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
        }

        GUIStyle fpsStyle;
        void OnGUI()
        {
            if (!RaceSettings.ShowFps || Event.current.type != EventType.Repaint) return;
            if (fpsStyle == null) fpsStyle = new GUIStyle(GUI.skin.label) { fontSize = 13, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter };
            var r = new Rect(Screen.width / 2f - 44, Screen.height - 26, 88, 22);
            GUI.DrawTexture(r, Texture2D.whiteTexture, ScaleMode.StretchToFill, true, 0, new Color(0.04f, 0.05f, 0.07f, 0.75f), 0, 6);
            fpsStyle.normal.textColor = fps >= 55 ? new Color(0.35f, 0.85f, 0.5f) : fps >= 30 ? new Color(1f, 0.71f, 0.28f) : new Color(1f, 0.36f, 0.36f);
            GUI.Label(r, Mathf.RoundToInt(fps) + " FPS", fpsStyle);
        }

        // ---- graphics presets: Low and Medium are meant for integrated graphics ----
        public void ApplyGraphics()
        {
            int g = Mathf.Clamp(RaceSettings.Graphics, 0, 2);
            QualitySettings.vSyncCount = RaceSettings.VSync ? 1 : 0;
            Application.targetFrameRate = RaceSettings.VSync ? -1 : 240;
            QualitySettings.lodBias = g == 0 ? 0.7f : g == 1 ? 1f : 1.5f;
            QualitySettings.antiAliasing = g == 2 ? 4 : g == 1 ? 2 : 0;
            float shadows = g == 0 ? 0f : g == 1 ? 110f : 300f;
            QualitySettings.shadowDistance = shadows;
            var rp = UnityEngine.Rendering.GraphicsSettings.currentRenderPipeline;
            if (rp != null)
            {
                // (the Universal Render Pipeline's own settings, set by name so this compiles without it)
                SetProp(rp, "renderScale", g == 0 ? 0.7f : g == 1 ? 0.85f : 1f);
                SetProp(rp, "shadowDistance", shadows);
                SetProp(rp, "msaaSampleCount", g == 2 ? 4 : g == 1 ? 2 : 1);
                SetProp(rp, "shadowCascadeCount", g == 2 ? 4 : 2);
            }
            foreach (var cam in Camera.allCameras) if (cam.CompareTag("MainCamera") && cam.farClipPlane > 500) cam.farClipPlane = g == 0 ? 2500f : 6000f;
        }
        static void SetProp(object o, string prop, object value)
        {
            var p = o.GetType().GetProperty(prop);
            if (p != null && p.CanWrite) { try { p.SetValue(o, value, null); } catch { } }
        }
    }
}

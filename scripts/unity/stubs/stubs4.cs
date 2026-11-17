using System;
namespace UnityEngine
{
    public class AudioClip : Object { public float length; }
    public class AudioSource : Behaviour { public AudioClip clip; public bool loop, playOnAwake, isPlaying, ignoreListenerPause; public float volume, spatialBlend, pitch; public int priority; public void Play() { } public void Stop() { } }
    public class AsyncOperation { public float progress; public bool allowSceneActivation, isDone; }
}
namespace UnityEngine
{
    public static class GL { public static void PushMatrix() { } public static void PopMatrix() { } public static void LoadPixelMatrix(float l, float r, float b, float t) { } public static void Clear(bool d, bool c, Color col) { } }
    public static class Random { public static int Range(int a, int b) { return a; } }
}

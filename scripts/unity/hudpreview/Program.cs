// Draws the Unity HUD (HudLayout.cs) as an SVG with sample values, to compare with the web game's HUD.
using System; using System.Text; using System.IO; using System.Globalization; using System.Text.RegularExpressions; using UnityEngine; using RaceLimit;

class Svg : IHudPainter
{
    public StringBuilder sb = new StringBuilder(); public float Opacity { get; set; }
    static readonly CultureInfo CI = CultureInfo.InvariantCulture;
    static string F(float v) { return v.ToString("0.##", CI); }
    static string C(Color c) { return string.Format(CI, "rgba({0},{1},{2},{3:0.###})", (int)(c.r * 255), (int)(c.g * 255), (int)(c.b * 255), 1f); }
    float Al(Color c) { return c.a * Opacity; }
    public Svg() { Opacity = 1; }
    public void Fill(Rect r, Color c, float rad) { sb.AppendFormat(CI, "<rect x='{0}' y='{1}' width='{2}' height='{3}' rx='{4}' fill='{5}' fill-opacity='{6:0.###}'/>\n", F(r.x), F(r.y), F(r.width), F(r.height), F(Math.Min(rad, Math.Min(r.width, r.height) / 2)), C(c), Al(c)); }
    public void Border(Rect r, Color c, float rad, float w) { sb.AppendFormat(CI, "<rect x='{0}' y='{1}' width='{2}' height='{3}' rx='{4}' fill='none' stroke='{5}' stroke-opacity='{6:0.###}' stroke-width='{7}'/>\n", F(r.x + w / 2), F(r.y + w / 2), F(r.width - w), F(r.height - w), F(rad), C(c), Al(c), F(w)); }
    static string Fam(HudFont f) { return f == HudFont.JB600 ? "JB" : f == HudFont.BC700 ? "BC" : "B"; }
    static int Wt(HudFont f) { return f == HudFont.B500 ? 500 : f == HudFont.B600 || f == HudFont.JB600 ? 600 : 700; }
    public float Width(string s, HudFont f, float size) { if (string.IsNullOrEmpty(s)) return 0; float k = f == HudFont.JB600 ? 0.6f : f == HudFont.BC700 ? 0.43f : f == HudFont.B700 ? 0.55f : 0.52f; return s.Length * size * k; }
    public void Text(Rect r, string s, HudFont f, float size, Color c, TextAnchor a)
    {
        if (string.IsNullOrEmpty(s)) return;
        string anchor = a == TextAnchor.MiddleCenter ? "middle" : a == TextAnchor.MiddleRight ? "end" : "start"; float x = a == TextAnchor.MiddleCenter ? r.x + r.width / 2 : a == TextAnchor.MiddleRight ? r.xMax : r.x;
        if (a == TextAnchor.UpperLeft) { sb.AppendFormat(CI, "<foreignObject x='{0}' y='{1}' width='{2}' height='{3}'><div xmlns='http://www.w3.org/1999/xhtml' style='font:{4} {5}px/1.45 {6};color:{7};opacity:{8:0.###}'>{9}</div></foreignObject>\n", F(r.x), F(r.y), F(r.width), F(r.height), Wt(f), F(size), Fam(f), C(c), Al(c), Esc(s)); return; }
        sb.AppendFormat(CI, "<text x='{0}' y='{1}' font-family='{2}' font-weight='{3}' font-size='{4}' fill='{5}' fill-opacity='{6:0.###}' text-anchor='{7}' dominant-baseline='central'>{8}</text>\n", F(x), F(r.y + r.height / 2), Fam(f), Wt(f), F(size), C(c), Al(c), anchor, Esc(s));
    }
    static string Esc(string s) { return s.Replace("&", "&amp;").Replace("<", "&lt;"); }
    public void Map(Rect r, HudMap m)
    {
        float k = r.width / 200f; Func<Vector2, string> P = (v) => F(r.x + v.x * k) + "," + F(r.y + v.y * k);
        Action<Vector2[], string, float> Path = (pts, col, w) => { var d = new StringBuilder(); for (int i = 0; i < pts.Length; i++) d.Append(i == 0 ? "M" : "L").Append(P(pts[i])); sb.AppendFormat(CI, "<path d='{0}' fill='none' stroke='{1}' stroke-width='{2}' stroke-linejoin='round' stroke-linecap='round'/>\n", d, col, F(w * k)); };
        if (m.pit != null) Path(m.pit, "#5B6372", 2); Path(m.lap, "#3A4150", 7);
        for (int s = 0; s < m.segs.Length; s++) Path(m.segs[s], m.segState[s] == 1 ? "#FF9F2E" : m.segState[s] == 2 ? "#4FA3FF" : "#C3C9D4", 2.6f);
        sb.AppendFormat(CI, "<circle cx='{0}' cy='{1}' r='{2}' fill='#FFB547' stroke='#0B0D12' stroke-width='{3}'/>\n", F(r.x + m.car.x * k), F(r.y + m.car.y * k), F(5 * k), F(2 * k));
    }
}

static class Program
{
    static float[] Arr(string json, string key) { var m = Regex.Match(json, "\"" + key + "\":\\[([^\\]]*)\\]"); var p = m.Groups[1].Value.Split(','); var a = new float[p.Length]; for (int i = 0; i < p.Length; i++) a[i] = float.Parse(p[i], CultureInfo.InvariantCulture); return a; }
    static void Main(string[] args)
    {
        string json = File.ReadAllText(args[0]); float W = float.Parse(args[1]), H = float.Parse(args[2]); bool simple = args.Length > 4 && args[3] == "simple";
        float[] x = Arr(json, "x"), z = Arr(json, "z"); int n = x.Length;
        float minX = 1e9f, maxX = -1e9f, minZ = 1e9f, maxZ = -1e9f; for (int i = 0; i < n; i += 10) { minX = Math.Min(minX, x[i]); maxX = Math.Max(maxX, x[i]); minZ = Math.Min(minZ, z[i]); maxZ = Math.Max(maxZ, z[i]); }
        float sc = 180f / Math.Max(maxX - minX, maxZ - minZ), ox = 100 - (minX + maxX) / 2 * sc, oz = 100 - (minZ + maxZ) / 2 * sc;
        Func<int, Vector2> M = (i) => new Vector2(ox + x[i % n] * sc, oz + z[i % n] * sc);
        var map = new HudMap(); var lap = new System.Collections.Generic.List<Vector2>(); for (int i = 0; i < n; i += 12) lap.Add(M(i)); lap.Add(M(0)); map.lap = lap.ToArray();
        int nSeg = (n + 23) / 24; map.segs = new Vector2[nSeg][]; map.segState = new sbyte[nSeg];
        for (int s = 0; s < nSeg; s++) { var sp = new System.Collections.Generic.List<Vector2>(); for (int i = s * 24; i <= Math.Min(n, (s + 1) * 24); i += 6) sp.Add(M(i)); map.segs[s] = sp.ToArray(); map.segState[s] = (sbyte)(s < nSeg * 0.3 ? (s % 9 < 6 ? 1 : 2) : 0); }
        map.car = M((int)(n * 0.3));
        var st = new HudState { simple = simple, map = map, circuit = "Spa-Francorchamps", session = "Practice · Spa-Francorchamps", lapLabel = "LAP 3", cur = "0:41.207", delta = "−0.21", deltaCls = 1, last = "1:47.912", best = "1:46.530", pred = "1:46.320", progress = 0.3f,
            nextName = "T5 Les Combes", nextDist = "320 m", message = "Best lap 1:46.530", messageCls = 1, rpm = 11000, throttle = 1, brake = 0, soc = 0.64f, battPct = "64%", mode = "Deploy", modeKw = "+260 kW", lapEnergy = "▲1.8 ▼1.2 MJ", barCls = 1,
            gear = "7", speed = "301", rpmText = "11,000", delta2 = "−0.214", delta2Cls = 1, bias = "62.0% front", top = "318 km/h", overtake = "Ready", overtakeCls = 1, tyreSub = "All on track", hint = "Arrows or W A S D drive · E / Q gears · Space overtake · [ ] brake bias · F aero · Tab more / less info · C camera · B look back · R reset · Esc pause", hintAlpha = 1 };
        st.secTimes = new[] { "31.884", "––.–––", "––.–––" }; st.secCls = new[] { 1, 0, 0 };
        st.tyres = new[] { "TRK", "TRK", "TRK", "KERB" }; st.tyreCls = new[] { 1, 1, 1, 1 }; st.tc = 1; st.abs = 0; st.sc = 0;
        var p = new Svg(); HudLayout.Draw(p, st, W, H);
        File.WriteAllText(args[args.Length - 1], "<svg xmlns='http://www.w3.org/2000/svg' width='" + W + "' height='" + H + "' viewBox='0 0 " + W + " " + H + "'>\n" + p.sb + "</svg>", new UTF8Encoding(false));
    }
}

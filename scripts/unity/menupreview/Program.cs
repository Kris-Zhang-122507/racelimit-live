// Draws the Unity main menu's screens (MainMenu.cs) to SVGs, to compare with the web game's menu.
using System; using System.Text; using System.IO; using System.Globalization; using System.Reflection; using System.Text.RegularExpressions; using UnityEngine; using RaceLimit;
class Svg : IMenuPainter
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
    public bool Hover(Rect r) { return false; } public bool Hit(Rect r) { return false; }
    public void Map(Rect r, HudMap m)
    {
        float k = r.width / 200f; Func<Vector2, string> P = (v) => F(r.x + v.x * k) + "," + F(r.y + v.y * k);
        Action<Vector2[], string, float> Path = (pts, col, w) => { var d = new StringBuilder(); for (int i = 0; i < pts.Length; i++) d.Append(i == 0 ? "M" : "L").Append(P(pts[i])); sb.AppendFormat(CI, "<path d='{0}' fill='none' stroke='{1}' stroke-width='{2}' stroke-linejoin='round' stroke-linecap='round'/>\n", d, col, F(w * k)); };
        if (m.pit != null) Path(m.pit, "#5B6372", 2); Path(m.lap, "#3A4150", 7);
        if (m.segs != null) for (int s = 0; s < m.segs.Length; s++) Path(m.segs[s], m.segState[s] == 1 ? "#FF9F2E" : m.segState[s] == 2 ? "#4FA3FF" : "#C3C9D4", 2.6f);
        if (m.showCar) sb.AppendFormat(CI, "<circle cx='{0}' cy='{1}' r='{2}' fill='#FFB547' stroke='#0B0D12' stroke-width='{3}'/>\n", F(r.x + m.car.x * k), F(r.y + m.car.y * k), F(5 * k), F(2 * k));
    }
}


static class Program
{
    static float[] Arr(string j, string k) { var m = Regex.Match(j, "\"" + k + "\":\\[([^\\]]*)\\]"); var p = m.Groups[1].Value.Split(','); var a = new float[p.Length]; for (int i = 0; i < p.Length; i++) a[i] = float.Parse(p[i], CultureInfo.InvariantCulture); return a; }
    static void Main(string[] args)
    {
        string j = File.ReadAllText(args[0]); float W = 1440, H = 860;
        var d = new TrackInfo.Data { name = "Spa-Francorchamps", x = Arr(j, "x"), y = Arr(j, "y"), z = Arr(j, "z"), hasPit = true, corners = new TrackInfo.Corner[19] };
        d.n = d.x.Length; d.len = 7004;
        var list = new TrackList { tracks = new[] { TrackRegistry.Describe(d, "Spa", false), TrackRegistry.Describe(d, "Spa (Track Builder)", true), TrackRegistry.Describe(d, "My circuit", true) } };
        list.tracks[1].name = "Spa (Track Builder)"; list.tracks[2].name = "My circuit"; list.tracks[2].km = 2.643f;
        var menu = new MainMenu(); var t = typeof(MainMenu); var bf = BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public;
        t.GetField("tracks", bf).SetValue(menu, list);
        var maps = new HudMap[3]; for (int i = 0; i < 3; i++) maps[i] = TrackRegistry.MapOf(list.tracks[i]); t.GetField("maps", bf).SetValue(menu, maps);
        foreach (var screen in new[] { "Main", "Weekend", "Settings" })
        {
            var p = new Svg(); t.GetField("p", bf).SetValue(menu, p);
            p.Fill(new Rect(0, 0, W, H), MenuUi.Bg, 0);
            t.GetMethod(screen, bf).Invoke(menu, new object[] { W, H });
            File.WriteAllText(args[1] + "-" + screen + ".svg", "<svg xmlns='http://www.w3.org/2000/svg' width='" + W + "' height='" + H + "' viewBox='0 0 " + W + " " + H + "'>\n" + p.sb + "</svg>", new UTF8Encoding(false));
        }
    }
}

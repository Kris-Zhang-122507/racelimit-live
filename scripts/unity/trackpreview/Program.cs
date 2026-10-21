// Builds Spa from pieces with the Track Builder's generator (TrackGen.cs), checks it and writes the meshes to a JSON
// for a look in three.js (see README.md).
using System; using System.Collections.Generic; using System.Globalization; using System.IO; using System.Text; using System.Text.RegularExpressions;
using UnityEngine; using RaceLimit;
static class Program
{
    static float[] Arr(string j, string k) { var m = Regex.Match(j, "\"" + k + "\":\\[([^\\]]*)\\]"); if (!m.Success || m.Groups[1].Value.Length == 0) return new float[0]; var p = m.Groups[1].Value.Split(','); var a = new float[p.Length]; for (int i = 0; i < p.Length; i++) a[i] = float.Parse(p[i], CultureInfo.InvariantCulture); return a; }
    static string F(float v) { return v.ToString("0.###", CultureInfo.InvariantCulture); }
    static void Main(string[] args)
    {
        if (args[0] == "default") { Default(args.Length > 1 ? args[1] : null); return; }
        string j = File.ReadAllText(args[0]);
        float[] x = Arr(j, "x"), y = Arr(j, "y"), z = Arr(j, "z"), px = Arr(j, "pitX"), pz = Arr(j, "pitZ");
        float half = float.Parse(Regex.Match(j, "\"half\":([0-9.]+)").Groups[1].Value, CultureInfo.InvariantCulture);
        var corners = new List<TrackInfo.Corner>();
        foreach (Match m in Regex.Matches(j, "\\{\"n\":(\\d+),\"name\":\"([^\"]*)\",\"i\":(\\d+)\\}")) corners.Add(new TrackInfo.Corner { n = int.Parse(m.Groups[1].Value), name = m.Groups[2].Value, i = int.Parse(m.Groups[3].Value) });
        // where the real pit lane leaves and joins, and which side it's on
        int n = x.Length; Func<float, float, int> near = (qx, qz) => { int b = 0; float bd = float.MaxValue; for (int i = 0; i < n; i++) { float d = (x[i] - qx) * (x[i] - qx) + (z[i] - qz) * (z[i] - qz); if (d < bd) { bd = d; b = i; } } return b; };
        int pe = near(px[0], pz[0]), pxi = near(px[px.Length - 1], pz[pz.Length - 1]);
        int mid = px.Length / 2, mi = near(px[mid], pz[mid]); float tx = -(x[(mi + 1) % n] - x[mi]), tz = z[(mi + 1) % n] - z[mi], lx = -tz, lz = tx; // (scene terms: x mirrored)
        int side = ((-px[mid]) - (-x[mi])) * lx + (pz[mid] - z[mi]) * lz > 0 ? 1 : -1;
        Vector3 start; float head; PitSetup pit;
        var pieces = TrackGen.FitPieces(x, y, z, corners.ToArray(), half, out start, out head, pe, pxi, out pit, side);
        Console.WriteLine(pieces.Count + " pieces; pit " + (pit == null ? "none" : pit.side + " " + pit.entry + " → " + pit.exit));
        foreach (var pc in pieces) if (pc.name != "Straight") Console.Write(pc.name + " · ");
        Console.WriteLine();
        var t0 = DateTime.Now; var r = TrackGen.Generate("Spa (pieces)", half, pieces, pit, start, head);
        Console.WriteLine(r.log + "  " + (DateTime.Now - t0).TotalMilliseconds.ToString("0") + " ms");
        // how close the rebuilt line stays to the real one
        float worst = 0, sum = 0; var td = r.data; int cnt = 0;
        for (int i = 0; i < n; i += 10) { float bx = -x[i], bz = z[i]; float bd = float.MaxValue; for (int q = 0; q < td.n; q++) { float dd = (td.x[q] - bx) * (td.x[q] - bx) + (td.z[q] - bz) * (td.z[q] - bz); if (dd < bd) bd = dd; } bd = (float)Math.Sqrt(bd); worst = Math.Max(worst, bd); sum += bd; cnt++; }
        Console.WriteLine("rebuilt line vs real: mean " + (sum / cnt).ToString("0.00") + " m, worst " + worst.ToString("0.00") + " m");
        int tv = 0; foreach (var g in r.meshes) tv += g.v.Count; Console.WriteLine(r.meshes.Count + " materials, " + tv + " vertices, " + r.trees.Count + " trees, " + td.walls.Length + " wall runs, corners: " + td.corners.Length);
        Vector3 o, s; var t1 = DateTime.Now; var h = TrackGen.Heights(r, 257, 300, out o, out s); Console.WriteLine("terrain " + (DateTime.Now - t1).TotalMilliseconds.ToString("0") + " ms, size " + F(s.x) + " × " + F(s.y));
        if (args.Length < 2) return;
        Write(r, h, o, s, args[1]);
    }

    // the Track Builder's starting layout (as TrackLayout.Reset makes it)
    static void Default(string outFile)
    {
        var pieces = new List<TrackPiece> { TrackPiece.Straight(420), TrackPiece.Corner(TurnDirection.Right, 90, 50, "Turn 1"), TrackPiece.Straight(420), TrackPiece.Corner(TurnDirection.Right, 45, 120, "Turn 2"), TrackPiece.Straight(150), TrackPiece.Corner(TurnDirection.Left, 45, 90, "Turn 3"), TrackPiece.Corner(TurnDirection.Right, 135, 30, "Hairpin"), TrackPiece.Straight(680), TrackPiece.Corner(TurnDirection.Right, 45, 60, "Turn 6"), TrackPiece.Straight(200), TrackPiece.Corner(TurnDirection.Right, 90, 50, "Last corner"), TrackPiece.Straight(200) };
        var pit = new PitSetup { enabled = true, side = TurnDirection.Right, entry = -150, exit = 380, garages = 12 };
        var r = TrackGen.Generate("My circuit", 7, pieces, pit, Vector3.zero, 0);
        Console.WriteLine(r.log);
        if (outFile == null) return;
        Vector3 o, s; var h = TrackGen.Heights(r, 257, 300, out o, out s); Write(r, h, o, s, outFile);
    }

    static void Write(GenResult r, float[,] h, Vector3 o, Vector3 s, string file)
    {
        var td = r.data;
        // ---- the meshes, for three.js ----
        var sb = new StringBuilder("{\"meshes\":[");
        bool first = true;
        foreach (var g in r.meshes)
        {
            if (!first) sb.Append(','); first = false;
            sb.Append("{\"mat\":\"" + g.mat + "\",\"v\":["); for (int i = 0; i < g.v.Count; i++) { if (i > 0) sb.Append(','); sb.Append(F(g.v[i].x)).Append(',').Append(F(g.v[i].y)).Append(',').Append(F(g.v[i].z)); }
            sb.Append("],\"t\":["); for (int i = 0; i < g.t.Count; i++) { if (i > 0) sb.Append(','); sb.Append(g.t[i]); } sb.Append("]}");
        }
        sb.Append("],\"trees\":["); for (int i = 0; i < r.trees.Count; i++) { if (i > 0) sb.Append(','); sb.Append(F(r.trees[i].x) + "," + F(r.trees[i].y) + "," + F(r.trees[i].z)); }
        sb.Append("],\"terrain\":{\"o\":[" + F(o.x) + "," + F(o.y) + "," + F(o.z) + "],\"s\":[" + F(s.x) + "," + F(s.y) + "," + F(s.z) + "],\"res\":257,\"h\":[");
        for (int zi = 0; zi < 257; zi++) for (int xi = 0; xi < 257; xi++) { if (zi + xi > 0) sb.Append(','); sb.Append(F(h[zi, xi])); }
        sb.Append("]},\"cx\":[" ); for (int i = 0; i < td.n; i += 1) { if (i > 0) sb.Append(','); sb.Append(F(td.x[i]) + "," + F(td.y[i]) + "," + F(td.z[i])); }
        sb.Append("],\"tec\":["); for (int i = 0; i < td.n; i++) { if (i > 0) sb.Append(','); sb.Append(td.tecL[i] + "," + td.tecR[i] + "," + F(td.wallL[i]) + "," + F(td.wallR[i])); }
        sb.Append("],\"walls\":["); first = true;
        foreach (var w in td.walls) { if (!first) sb.Append(','); first = false; sb.Append("{\"t\":" + F(w.thick) + ",\"p\":["); for (int i = 0; i < w.x.Length; i++) { if (i > 0) sb.Append(','); sb.Append(F(w.x[i]) + "," + F(w.y[i]) + "," + F(w.z[i]) + "," + F(w.ox[i]) + "," + F(w.oz[i])); } sb.Append("]}"); }
        sb.Append("]}");
        File.WriteAllText(file, sb.ToString());
    }
}

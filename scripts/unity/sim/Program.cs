using System;
using System.Reflection;
using UnityEngine;
using RaceLimit;

namespace RaceLimit { public class CarInput : MonoBehaviour { public float throttle, brake, steer; public bool analog, boost, lookBack, gearUp, gearDown, camera, reset, biasUp, biasDown, aero, info, pause; } }

public static class Program
{
    static RaceCar car; static Rigidbody rb; static CarInput inp; static Action fixedUpd, upd;
    static void Make(bool stability = true)
    {
        Sim.all.Clear();
        var g = new GameObject("PlayerCar"); rb = g.AddComponent<Rigidbody>(); g.AddComponent<Collider>();
        var model = new GameObject("RL_Car"); model.transform.parent = g.transform;
        foreach (var w in new[] { ("FL", -0.78f, 1.7f), ("FR", 0.78f, 1.7f), ("RL", -0.76f, -1.7f), ("RR", 0.76f, -1.7f) })
        {
            var p = new GameObject("RL_Wheel_" + w.Item1); p.transform.parent = model.transform; p.transform.localPosition = new Vector3(w.Item2, 0.352f, w.Item3);
            var s = new GameObject("RL_WheelSpin_" + w.Item1); s.transform.parent = p.transform;
        }
        var ig = new GameObject("RaceLimit"); inp = ig.AddComponent<CarInput>();
        car = g.AddComponent<RaceCar>(); car.input = inp; car.stabilityHelp = stability;
        var t = typeof(RaceCar); var bf = BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public;
        t.GetMethod("Awake", bf).Invoke(car, null);
        var fu = t.GetMethod("FixedUpdate", bf); var up = t.GetMethod("Update", bf);
        fixedUpd = () => fu.Invoke(car, null); upd = () => up.Invoke(car, null);
        g.transform.position = new Vector3(0, 0.45f, 0);
    }
    static float T;
    static void Step(float secs, Func<float, bool> stop = null)
    {
        float dt = Time.fixedDeltaTime; int n = (int)(secs / dt);
        for (int i = 0; i < n; i++) { upd(); fixedUpd(); rb.Integrate(dt); T += dt; Time.time = T; if (stop != null && stop(T)) break; }
    }
    static float Kmh { get { return Vector3.Dot(rb.linearVelocity, car.transform.forward) * 3.6f; } }
    static string State() { var e = car.transform.rotation; var f = car.transform.forward; var u = car.transform.up; return string.Format("pos {0} kmh {1:0.0} gear {2} rpm {3:0} y {4:0.000} pitch {5:0.00}° roll {6:0.00}° yawrate {7:0.00} latG {8:0.00} lonG {9:0.00}", car.transform.position, Kmh, car.gear, car.rpm, car.transform.position.y, Math.Asin(f.y) * 57.3, Math.Asin(car.transform.right.y) * 57.3, car.transform.InverseTransformDirection(rb.angularVelocity).y, car.lateralG, car.longitudinalG); }

    public static void Main()
    {
        // 1. settle at rest
        Make(); Step(3f); Console.WriteLine("REST     " + State());
        // 2. full throttle
        T = 0; float t100 = -1, t200 = -1, t300 = -1; inp.throttle = 1;
        Step(40f, (t) => { float k = Kmh; if (t100 < 0 && k >= 100) t100 = t; if (t200 < 0 && k >= 200) t200 = t; if (t300 < 0 && k >= 300) t300 = t; return false; });
        Console.WriteLine(string.Format("ACCEL    0-100 {0:0.00}s 0-200 {1:0.00}s 0-300 {2:0.00}s  after 40 s: {3}", t100, t200, t300, State()));
        // 3. brake from top speed to 80
        Vector3 p0 = car.transform.position; float v0 = Kmh; inp.throttle = 0; inp.brake = 1; T = 0;
        Step(15f, (t) => Kmh < 80); Console.WriteLine(string.Format("BRAKE    {0:0} -> 80 km/h in {1:0.0} m, {2:0.00} s  {3}", v0, Vector3.Distance(p0, car.transform.position), T, State()));
        Step(6f, (t) => Kmh < 0.5f); Console.WriteLine("STOPPED  " + State());
        // 4. steady corners at fixed speeds, analog steer
        foreach (var target in new[] { 80f, 150f, 230f })
        foreach (var st in new[] { 0.3f, 0.6f, 1f })
        {
            Make(); rb.linearVelocity = new Vector3(0, 0, target / 3.6f); car.gear = 4; Step(0.5f);
            inp.analog = true; inp.steer = st; float maxYaw = 0, sumLat = 0; int n = 0; bool spun = false;
            Step(6f, (t) => { float k = Kmh; inp.throttle = Mathf.Clamp((target - k) * 0.2f, 0, 1); inp.brake = Mathf.Clamp((k - target - 4) * 0.2f, 0, 1); var lv = car.transform.InverseTransformDirection(rb.linearVelocity); if (Math.Abs(Math.Atan2(lv.x, Math.Max(1, lv.z))) > 0.5) spun = true; if (t > 3) { sumLat += car.lateralG; n++; } return false; });
            Console.WriteLine(string.Format("CORNER   {0,3} km/h steer {1:0.0}: {2}  avg latG {3:0.00}{4}", target, st, State(), sumLat / Math.Max(1, n), spun ? "  SPUN" : ""));
        }
        // 5. keyboard: full lock at 150 km/h, aids on and off
        foreach (var stab in new[] { true, false })
        {
            Make(stab); rb.linearVelocity = new Vector3(0, 0, 150 / 3.6f); car.gear = 5; Step(0.3f); inp.analog = false; inp.steer = 1; inp.throttle = 0.6f; bool spun = false;
            Step(4f, (t) => { var lv = car.transform.InverseTransformDirection(rb.linearVelocity); if (Math.Abs(Math.Atan2(lv.x, Math.Max(1, lv.z))) > 0.5) spun = true; return false; });
            Console.WriteLine("KEYLOCK  stability " + stab + ": " + State() + (spun ? "  SPUN" : ""));
        }
        // 6. pulling away on full lock
        Make(); Step(1f); inp.analog = false; inp.steer = -1; inp.throttle = 1; Step(3f); Console.WriteLine("PULLAWAY " + State());
        // 7. lift mid-corner at 200 (lift-off oversteer?)
        Make(); rb.linearVelocity = new Vector3(0, 0, 200 / 3.6f); car.gear = 6; Step(0.3f); inp.analog = true; inp.steer = 0.5f; inp.throttle = 0.7f; Step(2f); inp.throttle = 0; inp.brake = 0.6f; bool sp = false;
        Step(2f, (t) => { var lv = car.transform.InverseTransformDirection(rb.linearVelocity); if (Math.Abs(Math.Atan2(lv.x, Math.Max(1, lv.z))) > 0.5) sp = true; return false; });
        Console.WriteLine("TRAILBRK " + State() + (sp ? "  SPUN" : ""));
    }
}

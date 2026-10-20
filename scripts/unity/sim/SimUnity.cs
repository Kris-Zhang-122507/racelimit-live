// A working stand-in for the bits of Unity the car uses, so RaceCar.cs can be driven in a test.
using System;
using System.Collections.Generic;
namespace UnityEngine
{
    public class Object { public string name = ""; public static implicit operator bool(Object o) { return !ReferenceEquals(o, null); } public static T FindAnyObjectByType<T>() where T : Object { foreach (var o in Sim.all) if (o is T) return (T)o; return null; } }
    public class Component : Object
    {
        public GameObject gameObject; public Transform transform { get { return gameObject.transform; } } public new string name { get { return gameObject.name; } }
        public T GetComponent<T>() { return gameObject.GetComponent<T>(); }
        public T[] GetComponents<T>() { return gameObject.comps.FindAll(c => c is T).ConvertAll(c => (T)(object)c).ToArray(); }
        public T[] GetComponentsInChildren<T>(bool inc = false) { var l = new List<T>(); gameObject.Collect(l); return l.ToArray(); }
    }
    public class Behaviour : Component { public bool enabled = true; }
    public class MonoBehaviour : Behaviour { }
    public class GameObject : Object
    {
        public List<Component> comps = new List<Component>(); public Transform transform; public int layer;
        public GameObject(string n) { name = n; transform = new Transform(); transform.gameObject = this; comps.Add(transform); Sim.all.Add(this); }
        public T AddComponent<T>() where T : Component, new() { var c = new T(); c.gameObject = this; comps.Add(c); Sim.all.Add(c); return c; }
        public T GetComponent<T>() { foreach (var c in comps) if (c is T) return (T)(object)c; return default(T); }
        public void Collect<T>(List<T> l) { foreach (var c in comps) if (c is T) l.Add((T)(object)c); foreach (var ch in transform.children) ch.gameObject.Collect(l); }
    }
    public class Transform : Component
    {
        public List<Transform> children = new List<Transform>(); Transform _parent;
        public Vector3 localPosition; public Quaternion localRotation = Quaternion.identity;
        public Transform parent { get { return _parent; } set { _parent = value; value.children.Add(this); } }
        public int childCount { get { return children.Count; } }
        public Transform GetChild(int i) { return children[i]; }
        public Quaternion rotation { get { return _parent == null ? localRotation : _parent.rotation * localRotation; } set { localRotation = _parent == null ? value : Quaternion.Inverse(_parent.rotation) * value; } }
        public Vector3 position { get { return _parent == null ? localPosition : _parent.TransformPoint(localPosition); } set { localPosition = _parent == null ? value : _parent.InverseTransformPoint(value); } }
        public Vector3 forward { get { return rotation * Vector3.forward; } } public Vector3 up { get { return rotation * Vector3.up; } } public Vector3 right { get { return rotation * Vector3.right; } }
        public Vector3 TransformPoint(Vector3 p) { return position + rotation * p; }
        public Vector3 TransformPoint(float x, float y, float z) { return TransformPoint(new Vector3(x, y, z)); }
        public Vector3 InverseTransformPoint(Vector3 p) { return Quaternion.Inverse(rotation) * (p - position); }
        public Vector3 TransformDirection(Vector3 v) { return rotation * v; }
        public Vector3 InverseTransformDirection(Vector3 v) { return Quaternion.Inverse(rotation) * v; }
        public Vector3 TransformVector(float x, float y, float z) { return rotation * new Vector3(x, y, z); }
        public void SetPositionAndRotation(Vector3 p, Quaternion q) { position = p; rotation = q; }
    }
    public struct Vector3
    {
        public float x, y, z; public Vector3(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
        public static Vector3 up { get { return new Vector3(0, 1, 0); } } public static Vector3 forward { get { return new Vector3(0, 0, 1); } } public static Vector3 right { get { return new Vector3(1, 0, 0); } } public static Vector3 zero { get { return new Vector3(); } }
        public float sqrMagnitude { get { return x * x + y * y + z * z; } } public float magnitude { get { return (float)Math.Sqrt(sqrMagnitude); } }
        public Vector3 normalized { get { float m = magnitude; return m > 1e-6f ? this / m : new Vector3(); } } public void Normalize() { this = normalized; }
        public static Vector3 Cross(Vector3 a, Vector3 b) { return new Vector3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
        public static float Dot(Vector3 a, Vector3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
        public static float Distance(Vector3 a, Vector3 b) { return (a - b).magnitude; }
        public static Vector3 ProjectOnPlane(Vector3 v, Vector3 n) { return v - n * Dot(v, n); }
        public static Vector3 operator +(Vector3 a, Vector3 b) { return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z); } public static Vector3 operator -(Vector3 a, Vector3 b) { return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z); } public static Vector3 operator -(Vector3 a) { return new Vector3(-a.x, -a.y, -a.z); }
        public static Vector3 operator *(Vector3 a, float d) { return new Vector3(a.x * d, a.y * d, a.z * d); } public static Vector3 operator *(float d, Vector3 a) { return a * d; } public static Vector3 operator /(Vector3 a, float d) { return new Vector3(a.x / d, a.y / d, a.z / d); }
        public override string ToString() { return string.Format("({0:0.00},{1:0.00},{2:0.00})", x, y, z); }
    }
    public struct Quaternion
    {
        public float x, y, z, w; public Quaternion(float x, float y, float z, float w) { this.x = x; this.y = y; this.z = z; this.w = w; }
        public static Quaternion identity { get { return new Quaternion(0, 0, 0, 1); } }
        public static Quaternion AngleAxis(float deg, Vector3 a) { a = a.normalized; float h = deg * Mathf.Deg2Rad / 2, s = (float)Math.Sin(h); return new Quaternion(a.x * s, a.y * s, a.z * s, (float)Math.Cos(h)); }
        public static Quaternion Euler(float x, float y, float z) { return AngleAxis(y, Vector3.up) * AngleAxis(x, Vector3.right) * AngleAxis(z, Vector3.forward); }
        public static Quaternion Inverse(Quaternion q) { return new Quaternion(-q.x, -q.y, -q.z, q.w); }
        public static Quaternion operator *(Quaternion a, Quaternion b) { return new Quaternion(a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y, a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x, a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w, a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z); }
        public static Vector3 operator *(Quaternion q, Vector3 v) { var p = q * new Quaternion(v.x, v.y, v.z, 0) * Inverse(q); return new Vector3(p.x, p.y, p.z); }
        public Quaternion Normalized() { float m = (float)Math.Sqrt(x * x + y * y + z * z + w * w); return new Quaternion(x / m, y / m, z / m, w / m); }
        public static Quaternion LookRotation(Vector3 f, Vector3 u) { float yaw = (float)Math.Atan2(f.x, f.z) * Mathf.Rad2Deg; return AngleAxis(yaw, Vector3.up); }
    }
    public struct Pose { public Vector3 position; public Quaternion rotation; public Pose(Vector3 p, Quaternion r) { position = p; rotation = r; } }
    public static class Mathf
    {
        public const float Rad2Deg = 57.29578f, Deg2Rad = 0.01745329f;
        public static float Clamp(float v, float a, float b) { return v < a ? a : v > b ? b : v; } public static int Clamp(int v, int a, int b) { return v < a ? a : v > b ? b : v; } public static float Clamp01(float v) { return Clamp(v, 0, 1); }
        public static float Max(float a, float b) { return a > b ? a : b; } public static float Min(float a, float b) { return a < b ? a : b; } public static float Abs(float a) { return Math.Abs(a); } public static float Sign(float a) { return a >= 0 ? 1 : -1; }
        public static float Atan2(float a, float b) { return (float)Math.Atan2(a, b); } public static float Atan(float a) { return (float)Math.Atan(a); } public static float Sin(float a) { return (float)Math.Sin(a); } public static float Tan(float a) { return (float)Math.Tan(a); } public static float Sqrt(float a) { return (float)Math.Sqrt(a); }
        public static float Lerp(float a, float b, float t) { return a + (b - a) * Clamp01(t); } public static float MoveTowards(float a, float b, float d) { return Math.Abs(b - a) <= d ? b : a + Math.Sign(b - a) * d; }
        public static float Round(float a) { return (float)Math.Round(a); } public static int RoundToInt(float a) { return (int)Math.Round(a); } public static float Exp(float a) { return (float)Math.Exp(a); } public static float Pow(float a, float b) { return (float)Math.Pow(a, b); }
    }
    public enum RigidbodyInterpolation { None, Interpolate } public enum CollisionDetectionMode { Discrete, ContinuousDynamic } public enum QueryTriggerInteraction { Ignore }
    public class Rigidbody : Component
    {
        public float mass = 1, linearDamping, angularDamping, maxAngularVelocity = 7; public RigidbodyInterpolation interpolation; public CollisionDetectionMode collisionDetectionMode;
        public Vector3 centerOfMass, inertiaTensor = new Vector3(1, 1, 1), linearVelocity, angularVelocity; public Quaternion inertiaTensorRotation;
        public Vector3 position { get { return transform.position; } set { transform.position = value; } } public Quaternion rotation { get { return transform.rotation; } set { transform.rotation = value; } }
        Vector3 F, T;
        public Vector3 WorldCoM { get { return transform.TransformPoint(centerOfMass); } }
        public void AddForceAtPosition(Vector3 f, Vector3 p) { F = F + f; T = T + Vector3.Cross(p - WorldCoM, f); }
        public void AddTorque(Vector3 t) { T = T + t; }
        public Vector3 GetPointVelocity(Vector3 p) { return linearVelocity + Vector3.Cross(angularVelocity, p - WorldCoM); }
        public void Integrate(float dt)
        {
            F = F + new Vector3(0, -9.81f * mass, 0);
            linearVelocity = linearVelocity + F / mass * dt;
            var q = transform.rotation; var inv = Quaternion.Inverse(q);
            Vector3 wb = inv * angularVelocity, tb = inv * T;
            Vector3 Iw = new Vector3(inertiaTensor.x * wb.x, inertiaTensor.y * wb.y, inertiaTensor.z * wb.z), gyro = Vector3.Cross(wb, Iw);
            wb = wb + new Vector3((tb.x - gyro.x) / inertiaTensor.x, (tb.y - gyro.y) / inertiaTensor.y, (tb.z - gyro.z) / inertiaTensor.z) * dt;
            angularVelocity = q * wb;
            Vector3 com = WorldCoM + linearVelocity * dt;
            var w = angularVelocity; var dq = new Quaternion(w.x * dt / 2, w.y * dt / 2, w.z * dt / 2, 0) * q;
            q = new Quaternion(q.x + dq.x, q.y + dq.y, q.z + dq.z, q.w + dq.w).Normalized();
            transform.rotation = q; transform.position = com - q * centerOfMass;
            F = new Vector3(); T = new Vector3();
        }
    }
    public struct RaycastHit { public Vector3 point, normal; public float distance; public Collider collider; }
    public static class Physics
    {
        public const int DefaultRaycastLayers = -5;
        public static Func<float, float, float> ground = (x, z) => 0f; public static Collider groundCollider;
        public static bool Raycast(Vector3 o, Vector3 d, out RaycastHit h, float max, int mask, QueryTriggerInteraction q)
        {
            h = new RaycastHit(); float gy = ground(o.x, o.z); if (d.y >= -1e-4f) return false; float t = (gy - o.y) / d.y; if (t < 0 || t > max) return false;
            h.point = o + d * t; h.normal = Vector3.up; h.distance = t; h.collider = groundCollider; return true;
        }
    }
    public enum PhysicsMaterialCombine { Average, Minimum }
    public class PhysicsMaterial : Object { public PhysicsMaterial(string n) { } public float dynamicFriction, staticFriction, bounciness; public PhysicsMaterialCombine frictionCombine, bounceCombine; }
    public class Collider : Component { public PhysicsMaterial sharedMaterial; }
    public static class Time { public static float fixedDeltaTime = 0.02f, deltaTime = 1 / 60f, time; }
    public static class Debug { public static void Log(object o) { Console.WriteLine(o); } public static void LogWarning(object o) { Console.WriteLine("WARN " + o); } public static void LogError(object o) { Console.WriteLine("ERR " + o); } }
    public class HeaderAttribute : Attribute { public HeaderAttribute(string s) { } } public class RangeAttribute : Attribute { public RangeAttribute(float a, float b) { } }
    public class RequireComponent : Attribute { public RequireComponent(Type t) { } }
    public static class Sim { public static List<Object> all = new List<Object>(); }
}

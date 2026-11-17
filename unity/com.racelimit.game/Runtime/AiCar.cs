using UnityEngine;

namespace RaceLimit
{
    // One of the other cars in a race. It doesn't run the full physics: it follows the racing line at the speed a
    // quick driver carries there (both come with the circuit), limited by how hard its era's car can accelerate,
    // and moves off the line to pass or to leave room. It is solid, so the player's car can hit it.
    // The race director (RaceDirector) tells it its target each physics step.
    public class AiCar : MonoBehaviour
    {
        public string team, code; public int number;
        [System.NonSerialized] public float s;          // metres from the start line along the lap, counting every lap (negative on the grid)
        [System.NonSerialized] public float lat;        // metres left of the centre line
        [System.NonSerialized] public float v;          // m/s
        [System.NonSerialized] public float skill = 0.93f, launchDelay, bump; // (bump: seconds of lost pace after contact)
        [System.NonSerialized] public int passSide;     // -1 right, 1 left, 0 on its line
        [System.NonSerialized] public float passHold;
        [System.NonSerialized] public bool finished; [System.NonSerialized] public float finishTime = -1, bestLap = -1, lapStartT;
        [System.NonSerialized] public int lapsDone;
        [System.NonSerialized] public float penalty;    // (the other cars don't get penalties yet: kept for the results table)
        [System.NonSerialized] public Color colour = Color.white;

        Rigidbody rb; Transform[] spins; Transform[] steers; Quaternion[] steerRest; float spinAngle, wheelR = 0.352f;
        Vector3 upSmooth = Vector3.up; float ySmooth; bool placed; float yawOff;

        public void Setup(GameObject[] eraModels, int[] eraYears, int era, TeamInfo t, string driver, int layer)
        {
            team = t.name; code = driver; colour = t.body;
            gameObject.layer = layer;
            rb = gameObject.AddComponent<Rigidbody>(); rb.isKinematic = true; rb.interpolation = RigidbodyInterpolation.Interpolate; rb.collisionDetectionMode = CollisionDetectionMode.ContinuousSpeculative;
            var box = gameObject.AddComponent<BoxCollider>(); box.center = new Vector3(0, 0.62f, 0.1f); box.size = new Vector3(1.8f, 0.5f, 5.2f);
            var g = gameObject.AddComponent<CarGarage>(); g.applyPerformance = false; g.wheelDisplay = false; g.eraModels = eraModels; g.eraYears = eraYears;
            g.Build(era, t.name);
            var sp = new System.Collections.Generic.List<Transform>(); var stl = new System.Collections.Generic.List<Transform>();
            foreach (var c in GetComponentsInChildren<Transform>(true))
            {
                if (c.name.StartsWith("RL_WheelSpin_")) sp.Add(c);
                else if (c.name.StartsWith("RL_Wheel_F")) stl.Add(c);
                if (c.name == "RL_Wheel_FL") { float y = transform.InverseTransformPoint(c.position).y; if (y > 0.25f && y < 0.45f) wheelR = y; }
            }
            spins = sp.ToArray(); steers = stl.ToArray(); steerRest = new Quaternion[steers.Length]; for (int i = 0; i < steers.Length; i++) steerRest[i] = steers[i].localRotation;
            foreach (var cam in GetComponentsInChildren<Camera>(true)) cam.enabled = false;
            foreach (var al in GetComponentsInChildren<AudioListener>(true)) al.enabled = false;
        }

        // put the car where its numbers say it is (s, lat), resting on the ground, pointing along its path
        public void Place(TrackInfo track, float dt, float latRate)
        {
            float L = track.length; int n = track.N;
            float sm = s % L; if (sm < 0) sm += L;
            float fi = sm / L * n; int i0 = track.Wrap(Mathf.FloorToInt(fi)), i1 = track.Wrap(i0 + 1); float f = fi - Mathf.Floor(fi);
            Vector3 c = Vector3.Lerp(track.centre[i0], track.centre[i1], f), fw = Vector3.Slerp(track.forward[i0], track.forward[i1], f), lf = Vector3.Slerp(track.left[i0], track.left[i1], f);
            Vector3 p = c + lf * lat, up = Vector3.up; float gy = p.y;
            RaycastHit hit;
            if (Physics.Raycast(p + Vector3.up * 2.5f, Vector3.down, out hit, 7f, Physics.DefaultRaycastLayers, QueryTriggerInteraction.Ignore) && hit.rigidbody == null && Mathf.Abs(hit.point.y - p.y) < 2.5f) { gy = hit.point.y; up = hit.normal; }
            if (!placed) { ySmooth = gy; upSmooth = up; placed = true; }
            float k = 1f - Mathf.Exp(-dt * 14f);
            ySmooth = Mathf.Lerp(ySmooth, gy, k); upSmooth = Vector3.Slerp(upSmooth, up, k).normalized;
            p.y = ySmooth;
            // (pointing a little across the track while it moves sideways)
            yawOff = Mathf.Lerp(yawOff, v > 3 ? Mathf.Atan2(latRate, Mathf.Max(v, 8f)) : 0, 1f - Mathf.Exp(-dt * 8f));
            Vector3 dir = (fw + lf * Mathf.Tan(yawOff)).normalized; dir = Vector3.ProjectOnPlane(dir, upSmooth).normalized;
            if (dir.sqrMagnitude < 0.5f) dir = fw;
            var rot = Quaternion.LookRotation(dir, upSmooth);
            if (dt <= 0 || rb == null) { transform.SetPositionAndRotation(p, rot); if (rb != null) { rb.position = p; rb.rotation = rot; } }
            else { rb.MovePosition(p); rb.MoveRotation(rot); }
            spinAngle = (spinAngle + v / wheelR * Mathf.Rad2Deg * dt) % 360f;
        }

        void LateUpdate()
        {
            if (spins == null) return;
            for (int i = 0; i < spins.Length; i++) if (spins[i] != null) spins[i].localRotation = Quaternion.Euler(spinAngle, 0, 0);
            for (int i = 0; i < steers.Length; i++) if (steers[i] != null && steers[i] != (i < spins.Length ? spins[i] : null)) steers[i].localRotation = steerRest[i] * Quaternion.Euler(0, Mathf.Clamp(yawOff * Mathf.Rad2Deg * 2.5f, -18, 18), 0);
        }

        void OnCollisionEnter(Collision c)
        {
            // hit by the player's car: it loses a little pace for a moment
            if (c.rigidbody != null && c.rigidbody.GetComponent<RaceCar>() != null) { bump = 0.8f; v *= 0.9f; RaceDirector.Contact(this, c.relativeVelocity.magnitude); }
        }
    }
}

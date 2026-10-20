using UnityEngine;

namespace RaceLimit
{
    // The car: a Rigidbody on four ray-cast wheels. Each wheel has a spring and damper, and a tyre whose grip
    // comes from its load (weight + downforce, less sensitive the harder it's pressed), its slip angle (a Pacejka
    // "magic formula" curve) and the surface under it (RLSurface). Drive and braking share the same grip (friction
    // ellipse), so braking while turning costs cornering grip. Power unit, gears, battery, aero modes, ABS, traction
    // control and the stability help follow the web game (physics.js). Numbers are a 2026 car, roughly.
    [RequireComponent(typeof(Rigidbody))]
    public class RaceCar : MonoBehaviour
    {
        [Header("Car")]
        public float mass = 800f;
        public float frontWeight = 0.45f;          // share of the weight on the front axle
        public float cgHeight = 0.28f;             // centre of mass above the ground
        public Vector3 inertia = new Vector3(1100f, 1150f, 260f); // pitch, yaw, roll (kg m²)

        [Header("Aero (lift and drag coefficient × area, m²)")]
        public float clCorner = 5.2f, cdCorner = 1.3f, clStraight = 3.4f, cdStraight = 0.72f;
        public float aeroFront = 0.41f;            // share of the downforce on the front axle

        [Header("Power unit")]
        public float pIce = 400e3f, pErs = 260e3f, pErsBoost = 350e3f, batteryJ = 4e6f, harvestW = 350e3f, efficiency = 0.92f;
        public float[] gearTops = { 100, 140, 176, 211, 246, 281, 317, 356 }; // km/h at 12,000 rpm
        public float shiftRpm = 11800f, limiterRpm = 12500f, idleRpm = 4000f;

        [Header("Tyres and suspension")]
        // Set up like the web game's car: at the limit it runs wide (understeers) rather than spinning. The wide rear
        // tyres have a lot more sideways grip than the fronts and don't lose it past their limit (cRear 1), and
        // traction control and ABS always leave the tyres enough grip to keep turning.
        public float muFront = 1.95f;                 // front tyres, any direction
        public float muRearSide = 2.75f;              // rear tyres, sideways
        public float muRearDrive = 1.95f;             // rear tyres, driving and braking (traction-limited off the line)
        public float loadSensitivity = 0.04f;         // grip lost for each extra "static load" pressed on (0.04 = 4 %)
        public float bFront = 12f, cFront = 1.45f, bRear = 17f, cRear = 1.0f; // slip curve shape
        public float springRate = 110000f, damping = 7000f, bumpStop = 0.065f;
        public float wheelRadius = 0.352f;
        public float steerLock = 0.34f;            // radians at the front wheels, at low speed

        [Header("Driver aids")]
        public bool autoGears = true, abs = true, tractionControl = true, stabilityHelp = true;
        [Range(0.5f, 0.7f)] public float brakeBias = 0.62f;

        [Header("State (read only)")]
        public int gear = 1;
        public float rpm, kmh, ers, steerAngle, throttle, brake;
        public bool reverse, deploying, harvesting, overtake, clipping, straightMode, pitLimiter;
        public bool absActive, tcActive, stabilityActive, lockFront, lockRear, wheelspin;
        public float deployW, harvestW_now;
        public SurfaceKind[] wheelSurface = new SurfaceKind[4];
        public bool offTrack;
        public int wheelsDown;
        public float lateralG, longitudinalG;

        public CarInput input;
        public Rigidbody body { get; private set; }

        class Wheel
        {
            public Transform pivot, spin;
            public bool front, left;
            public Vector3 restLocal;   // wheel centre at rest, in the car's frame
            public Quaternion pivotRest;
            public float compression, lastCompression, load, grip, gripX, spinAngle, fy, staticLoad;
            public bool grounded;
            public RaycastHit hit;
            public SurfaceKind surface;
        }
        Wheel[] wheels;
        float wheelbase = 3.4f, aDist = 1.87f, bDist = 1.53f;
        float shiftT, revT;
        const float G = 9.81f, RHO = 1.225f, RAY_UP = 1.2f; // (the wheels look for the ground from well above the axle, so a dip or a lump can't put the ray's start below the road)

        void Awake()
        {
            body = GetComponent<Rigidbody>();
            if (input == null) input = FindAnyObjectByType<CarInput>();
            Time.fixedDeltaTime = 1f / 200f; // (stiff springs and tyres need small steps)
            FindWheels();
            body.mass = mass;
            body.linearDamping = 0f; body.angularDamping = 0.05f;
            body.interpolation = RigidbodyInterpolation.Interpolate;
            body.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
            body.maxAngularVelocity = 20f;
            // centre of mass between the axles by the weight split, low down
            float zF = 0, zR = 0; int nf = 0, nr = 0;
            foreach (var w in wheels) { if (w.front) { zF += w.restLocal.z; nf++; } else { zR += w.restLocal.z; nr++; } }
            if (nf > 0 && nr > 0) { zF /= nf; zR /= nr; wheelbase = Mathf.Abs(zF - zR); aDist = wheelbase * (1 - frontWeight); bDist = wheelbase * frontWeight; }
            body.centerOfMass = new Vector3(0f, cgHeight, zF - aDist);
            body.inertiaTensor = inertia; body.inertiaTensorRotation = Quaternion.identity;
            foreach (var w in wheels) w.staticLoad = mass * G * (w.front ? frontWeight : 1 - frontWeight) / 2f;
            ers = batteryJ;
            Physics.queriesHitBackfaces = true; // (a ground piece facing the wrong way still holds the car up)
            // the body's box only has to meet barriers: kept clear of the road so kerbs and bumps can't snag it and push it under
            foreach (var bc in GetComponents<BoxCollider>()) { bc.center = new Vector3(0, 0.62f, 0.1f); bc.size = new Vector3(1.8f, 0.5f, 5.2f); }
            // (the body slides along barriers rather than sticking to them)
            foreach (var c in GetComponents<Collider>()) c.sharedMaterial = new PhysicsMaterial("RL_Car") { dynamicFriction = 0.15f, staticFriction = 0.15f, bounciness = 0.1f, frictionCombine = PhysicsMaterialCombine.Minimum, bounceCombine = PhysicsMaterialCombine.Average };
        }

        void FindWheels()
        {
            var list = new System.Collections.Generic.List<Wheel>();
            foreach (var t in GetComponentsInChildren<Transform>(true))
            {
                if (!t.name.StartsWith("RL_Wheel_") || t.name.Length < 11) continue;
                string tag = t.name.Substring(9, 2);
                var w = new Wheel { pivot = t, front = tag[0] == 'F', left = tag[1] == 'L', pivotRest = t.localRotation };
                w.spin = FindChild(t, "RL_WheelSpin_") ?? (t.childCount > 0 ? t.GetChild(0) : t);
                w.restLocal = transform.InverseTransformPoint(t.position);
                list.Add(w);
            }
            if (list.Count != 4)
            {
                Debug.LogWarning("RaceLimit: expected 4 wheels named RL_Wheel_FL/FR/RL/RR, found " + list.Count + "; using default positions");
                list.Clear();
                for (int k = 0; k < 4; k++) { bool f = k < 2, l = k % 2 == 0; list.Add(new Wheel { front = f, left = l, restLocal = new Vector3(l ? -0.78f : 0.78f, wheelRadius, f ? 1.7f : -1.7f) }); }
            }
            // (the order FL, FR, RL, RR, to match the HUD)
            list.Sort((a, b) => (a.front ? 0 : 2) + (a.left ? 0 : 1) - ((b.front ? 0 : 2) + (b.left ? 0 : 1)));
            wheels = list.ToArray();
        }

        static Transform FindChild(Transform t, string prefix)
        {
            for (int i = 0; i < t.childCount; i++) { var c = t.GetChild(i); if (c.name.StartsWith(prefix)) return c; var r = FindChild(c, prefix); if (r != null) return r; }
            return null;
        }

        public void Teleport(Pose pose)
        {
            body.position = pose.position; body.rotation = pose.rotation;
            transform.SetPositionAndRotation(pose.position, pose.rotation);
            body.linearVelocity = Vector3.zero; body.angularVelocity = Vector3.zero;
            gear = 1; rpm = idleRpm; reverse = false; steerAngle = 0; throttle = brake = 0;
        }

        static float Smooth(float a, float b, float x) { float t = Mathf.Clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
        float IceShape(float r) { return r < 10500 ? Mathf.Clamp(0.3f + 0.7f * (r - 4000) / 6500, 0.3f, 1f) : r < limiterRpm ? 1 - (r - 10500) / 2000 * 0.08f : 0; }

        bool wantUp, wantDown, wantAero;
        void Update()
        {
            if (input == null) return;
            if (input.gearUp) wantUp = true;
            if (input.gearDown) wantDown = true;
            if (input.aero) wantAero = true;
        }

        void FixedUpdate()
        {
            float dt = Time.fixedDeltaTime;
            Vector3 up = transform.up, fwd = transform.forward;
            Vector3 lv = transform.InverseTransformDirection(body.linearVelocity);
            float u = lv.z, yawRate = transform.InverseTransformDirection(body.angularVelocity).y;
            kmh = Mathf.Max(0, u) * 3.6f;

            // ---- pedals and steering (keys squeeze the throttle in over ~0.2 s and steer at a steady rate) ----
            float thrIn = input ? Mathf.Clamp01(input.throttle) : 0, brkIn = input ? Mathf.Clamp01(input.brake) : 0, steerIn = input ? Mathf.Clamp(input.steer, -1, 1) : 0;
            bool analog = input && input.analog;
            float thrRate = thrIn > throttle ? (analog ? 14 : 5) : 16;
            throttle += (thrIn - throttle) * Mathf.Clamp01(dt * thrRate);
            brake += (brkIn - brake) * Mathf.Clamp01(dt * 18);
            // reverse: stop, keep holding the brake a moment, then the brake pedal backs up
            if (!reverse && Mathf.Abs(u) < 0.6f && brkIn > 0.5f && thrIn < 0.05f) { revT += dt; if (revT > 0.35f) { reverse = true; gear = 1; } } else if (!reverse) revT = 0;
            if (reverse && (thrIn > 0.05f || u > 0.8f)) { reverse = false; revT = 0; }

            float dMax = steerLock / (1 + Mathf.Max(0, u - 8) / (analog ? 36 : 27)) + 0.14f * Mathf.Clamp01(1 - Mathf.Abs(u) / 14);
            float target = steerIn * dMax;
            stabilityActive = false;
            if (stabilityHelp && u > 8)
            {
                // never ask the front tyres for more than their best slip angle (measured from where the front is really going)
                float betaF = Mathf.Atan2(lv.x + yawRate * aDist, u), t0 = target;
                target = Mathf.Clamp(target, Mathf.Max(-dMax * 1.6f, betaF - 0.135f), Mathf.Min(dMax * 1.6f, betaF + 0.135f));
                if (steerIn == 0) { float rearSlide = Mathf.Atan2(lv.x - yawRate * bDist, u); if (Mathf.Abs(rearSlide) > 0.06f) target += Mathf.Clamp(rearSlide * 0.6f, -0.08f, 0.08f); }
                if (Mathf.Abs(target - t0) > 0.02f) stabilityActive = true;
            }
            bool back = Mathf.Abs(target) < Mathf.Abs(steerAngle) || target * steerAngle < 0;
            float rate = analog ? 3.5f * steerLock : Mathf.Max(0.3f, 1.3f / (1 + Mathf.Max(0, u) / 25)) * (back ? 2 : 1);
            steerAngle = Mathf.MoveTowards(steerAngle, target, rate * dt);

            // ---- gears and revs ----
            if (shiftT > 0) shiftT -= dt;
            float rpmRaw = 12000f * kmh / gearTops[Mathf.Clamp(gear, 1, 8) - 1];
            if (autoGears && !reverse)
            {
                if (gear < 8 && rpmRaw > shiftRpm) { gear++; shiftT = 0.04f; }
                else if (gear > 1 && 12000f * kmh / gearTops[gear - 2] < (brake > 0.1f ? 11000f : 8200f)) { gear--; shiftT = 0.03f; }
            }
            else if (!reverse)
            {
                if (wantUp && gear < 8) { gear++; shiftT = 0.04f; }
                if (wantDown && gear > 1 && 12000f * kmh / gearTops[gear - 2] < limiterRpm) { gear--; shiftT = 0.03f; }
            }
            wantUp = wantDown = false;
            rpmRaw = 12000f * kmh / gearTops[gear - 1];
            rpm = Mathf.Max(idleRpm + throttle * 3000 * (1 - Smooth(0, 60, kmh)), Mathf.Min(rpmRaw, limiterRpm + 50));

            // ---- aero: straight mode on the straights at full throttle, back to corner mode on the brakes ----
            if (!straightMode && throttle > 0.95f && kmh > 170 && Mathf.Abs(lateralG) < 0.8f && Mathf.Abs(steerAngle) < 0.02f) straightMode = true;
            else if (straightMode && (brake > 0.05f || throttle < 0.6f || Mathf.Abs(steerAngle) > 0.04f)) straightMode = false;
            if (wantAero) { straightMode = !straightMode && brake < 0.05f; wantAero = false; }
            float cl = straightMode ? clStraight : clCorner, cd = straightMode ? cdStraight : cdCorner;
            float q = 0.5f * RHO * u * u;
            Vector3 frontAxle = transform.TransformPoint(new Vector3(0, 0.2f, body.centerOfMass.z + aDist)), rearAxle = transform.TransformPoint(new Vector3(0, 0.2f, body.centerOfMass.z - bDist));
            body.AddForceAtPosition(-up * q * cl * aeroFront, frontAxle);
            body.AddForceAtPosition(-up * q * cl * (1 - aeroFront), rearAxle);
            if (body.linearVelocity.sqrMagnitude > 0.01f) body.AddForceAtPosition(-body.linearVelocity.normalized * 0.5f * RHO * body.linearVelocity.sqrMagnitude * cd, transform.TransformPoint(body.centerOfMass + Vector3.up * 0.15f));

            // ---- power unit (2026: the electric motor fades from 290 km/h and is gone at 355) ----
            overtake = input && input.boost && ers > 0.08f * batteryJ && throttle > 0.5f && !pitLimiter;
            float vmaxErs = 355f / 3.6f, taperFrom = overtake ? 325f : 290f, taper = Mathf.Clamp01((vmaxErs - u) / ((355f - taperFrom) / 3.6f));
            deploying = throttle > 0.9f && ers > 0 && u > 3 && !reverse;
            float iceW = throttle * pIce * IceShape(rpm) * (rpmRaw > limiterRpm ? 0 : 1);
            float soc = ers / batteryJ, mode = soc > 0.7f ? 1 : soc > 0.25f ? 0.25f + (soc - 0.25f) / 0.45f * 0.75f : soc;
            float ersW = deploying ? (overtake ? pErsBoost : pErs * mode) * taper : 0;
            clipping = throttle > 0.9f && u > 318f / 3.6f && ers < 0.45f * batteryJ;
            float clipW = clipping ? 130e3f * Mathf.Clamp01((u - 318f / 3.6f) / 5f) : 0;
            float drive = shiftT > 0.02f ? 0 : efficiency * (iceW + ersW - clipW) / Mathf.Max(u, 4);
            if (throttle < 0.05f && u > 2) drive = -(350 + 1100 * (rpm / 12000f)); // engine braking
            if (pitLimiter && u > 79.5f / 3.6f && drive > 0) drive = 0;
            if (reverse) drive = u > -9.5f ? -6500 * brake : 0;
            float brakeTotal = Mathf.Abs(u) > 0.6f && !reverse ? brake : 0;
            // the pit limiter holds 80 km/h: no power above it, and it brings a car that came in too fast down to it
            if (pitLimiter && u > 80.5f / 3.6f) brakeTotal = Mathf.Max(brakeTotal, Mathf.Clamp((u * 3.6f - 80f) / 25f, 0.08f, 0.5f));

            // ---- wheels: first where each one touches and how hard it's pressed down ----
            absActive = tcActive = lockFront = lockRear = wheelspin = false; offTrack = true;
            float dFront = 0, dRear = 0, rearLoad = 0;
            for (int k = 0; k < wheels.Length; k++)
            {
                var w = wheels[k];
                Vector3 mount = transform.TransformPoint(w.restLocal + Vector3.up * RAY_UP);
                float maxLen = RAY_UP + wheelRadius + 0.09f;
                w.grounded = Physics.Raycast(mount, -up, out w.hit, maxLen, Physics.DefaultRaycastLayers, QueryTriggerInteraction.Ignore); // (the car itself is on Ignore Raycast)
                if (!w.grounded) { w.compression = 0; w.lastCompression = 0; w.load = 0; w.grip = w.gripX = 0; w.fy = 0; continue; }
                w.compression = RAY_UP + wheelRadius - w.hit.distance;
                float cvel = (w.compression - w.lastCompression) / dt; w.lastCompression = w.compression;
                float fz = Mathf.Max(0, springRate * w.compression + damping * cvel);
                if (w.compression > bumpStop) fz += 400000f * (w.compression - bumpStop);
                w.load = fz;
                body.AddForceAtPosition(up * fz, w.hit.point + up * wheelRadius * 0.5f);
                var surf = w.hit.collider ? w.hit.collider.GetComponent<RLSurface>() : null;
                w.surface = surf ? surf.kind : SurfaceKind.Track; wheelSurface[k] = w.surface;
                if (!RLSurface.OffTrack(w.surface)) offTrack = false;
                float sens = Mathf.Clamp(1 - loadSensitivity * (fz / Mathf.Max(1, w.staticLoad) - 1), 0.8f, 1.05f), sg = sens * RLSurface.Grip(w.surface) * fz;
                w.grip = (w.front ? muFront : muRearSide) * sg;   // the most sideways force this tyre can make
                w.gripX = (w.front ? muFront : muRearDrive) * sg; // ...and along the car
                if (w.front) dFront += w.gripX; else { dRear += w.gripX; rearLoad += fz; }
            }
            // ---- then the tyre forces ----
            float usedDrive = 0; wheelsDown = 0; foreach (var w in wheels) if (w.grounded) wheelsDown++;
            for (int k = 0; k < wheels.Length; k++)
            {
                var w = wheels[k];
                if (!w.grounded) continue;
                float D = w.grip, fz = w.load; // (D: sideways grip)
                Vector3 n = w.hit.normal;
                Vector3 heading = w.front ? Quaternion.AngleAxis(steerAngle * Mathf.Rad2Deg, up) * fwd : fwd;
                Vector3 wf = Vector3.ProjectOnPlane(heading, n).normalized, wr = Vector3.Cross(n, wf);
                Vector3 pv = body.GetPointVelocity(w.hit.point);
                float vx = Vector3.Dot(pv, wf), vy = Vector3.Dot(pv, wr);

                // longitudinal: drive (rear wheels, by load), brakes (as strong as all four tyres' grip, split by the bias), rolling, ploughing
                float DX = w.gripX, fx = 0, wLow = Smooth(3f, 9f, Mathf.Abs(vx));
                if (!w.front && rearLoad > 0) fx += drive * (fz / rearLoad);
                float axleD = w.front ? dFront : dRear;
                float fb = brakeTotal * (dFront + dRear) * (w.front ? brakeBias : 1 - brakeBias) * (axleD > 0 ? DX / axleD : 0);
                float dir = vx >= 0 ? 1 : -1;
                fx -= fb * dir;
                fx -= (0.012f + RLSurface.Drag(w.surface, Mathf.Abs(vx))) * fz * Mathf.Clamp(vx, -1, 1);
                // (slip angle, from where this tyre is really going)
                float alpha = Mathf.Atan2(vy, Mathf.Max(Mathf.Abs(vx), 3f));
                // traction control and ABS keep back enough grip for cornering: what the tyre is making now plus a
                // margin, so getting on the power out of a corner can't snap the rear round, nor braking into one
                // push the front straight on
                float keep = Mathf.Min(D * 0.97f, Mathf.Max((w.front ? 1.2f : 1.3f) * Mathf.Abs(w.fy) * wLow, (w.front ? 0.4f : 0.5f) * D));
                float room = DX * Mathf.Sqrt(Mathf.Max(0, 1 - (keep / D) * (keep / D)));
                bool locked = false, spun = false;
                if (fb > 0 && fx * dir < 0)
                {
                    float hard = w.front ? 0.92f : 0.86f, soft = w.front ? 0.6f : 0.45f;
                    if (abs && -fx * dir > Mathf.Max(room, soft * DX)) { fx = -dir * Mathf.Min(DX * hard, Mathf.Max(room, soft * DX)); absActive = Mathf.Abs(u) > 3; }
                    else if (!abs && -fx * dir > DX) { fx = -dir * DX * 0.85f; locked = true; if (w.front) lockFront = true; else lockRear = true; }
                }
                else if (fx > 0)
                {
                    float lim = tractionControl ? Mathf.Max(room, 0.25f * DX) : DX;
                    if (stabilityHelp) lim *= Mathf.Clamp(1 - (Mathf.Abs(alpha) * wLow - 0.07f) * 7f, 0.25f, 1f); // (and eases the power while the rear slides)
                    if (fx > lim)
                    {
                        if (!tractionControl && fx > DX) { spun = true; wheelspin = true; fx = DX * 0.7f; }
                        else { if (tractionControl && u > 2 && fx > lim * 1.03f) tcActive = true; fx = lim; }
                    }
                }
                if (fx > 0) usedDrive += fx;
                if (Mathf.Abs(u) < 0.4f && thrIn < 0.05f && !reverse) fx = Mathf.Clamp(-vx * (fz / G) / dt * 0.5f, -DX, DX); // (parked: hold it)

                // lateral: the slip-angle curve, limited by what's left after braking or driving (friction ellipse)
                float dy = w.front ? Mathf.Sqrt(Mathf.Max((locked ? 0.15f : 1f) * D * D - fx * fx, 0.0144f * D * D))
                                   : D * Mathf.Sqrt(Mathf.Max((locked ? 0.35f : spun ? 0.5f : 1f) - (fx / DX) * (fx / DX), 0.0144f));
                float fy = -dy * Mathf.Sin((w.front ? cFront : cRear) * Mathf.Atan((w.front ? bFront : bRear) * alpha));
                // (below ~30 km/h the car moves as if on rails, like the web game: each tyre simply doesn't slide sideways)
                float fyStill = Mathf.Clamp(-vy * (fz / G) / dt * 0.25f, -dy, dy);
                fy = Mathf.Lerp(fyStill, fy, wLow);
                w.fy = fy;

                body.AddForceAtPosition(wf * fx + wr * fy, w.hit.point + up * 0.05f);
            }

            // ---- stability help: if the car rotates faster than its grip allows, a calming turn force ----
            if (stabilityHelp && u > 8)
            {
                float rLim = 0.95f * (17.5f + 0.006f * u * u) / u, rRef = Mathf.Clamp(u * Mathf.Tan(steerAngle) / wheelbase, -rLim, rLim);
                float err = yawRate - rRef, rearSlip = Mathf.Atan2(lv.x - yawRate * bDist, u);
                if (Mathf.Abs(rearSlip) > 0.08f || Mathf.Abs(yawRate) > rLim) { body.AddTorque(up * Mathf.Clamp(-err * inertia.y * 9f, -9000f, 9000f)); if (Mathf.Abs(err) > 0.02f) stabilityActive = true; }
            }

            // ---- battery: pays for what the tyres put down; charges under braking, lifting and clipping ----
            deployW = ersW > 0 && usedDrive > 0 ? Mathf.Min(ersW, Mathf.Max(0, usedDrive * Mathf.Max(u, 4) / efficiency - iceW)) : 0;
            ers = Mathf.Max(0, ers - deployW * dt);
            harvesting = u > 5 && (brake > 0.05f || throttle < 0.9f || clipping);
            harvestW_now = !harvesting || ers >= batteryJ ? 0 : brake > 0.05f ? harvestW * Mathf.Min(1, brake * 2) : clipping ? clipW : throttle < 0.05f ? 250e3f : throttle < 0.9f && u > 15 ? 120e3f : 0;
            ers = Mathf.Min(batteryJ, ers + harvestW_now * dt);

            Vector3 acc = (body.linearVelocity - lastVel) / dt; lastVel = body.linearVelocity;
            lateralG = Mathf.Lerp(lateralG, Vector3.Dot(acc, transform.right) / G, 0.1f);
            longitudinalG = Mathf.Lerp(longitudinalG, Vector3.Dot(acc, fwd) / G, 0.1f);
        }
        Vector3 lastVel;

        float FrontLoad() { float s = 0; foreach (var w in wheels) if (w.front && w.grounded) s += w.load; return s; }

        // the wheels follow the suspension, spin with the road and steer
        void LateUpdate()
        {
            if (wheels == null) return;
            float u = transform.InverseTransformDirection(body.linearVelocity).z;
            foreach (var w in wheels)
            {
                if (w.pivot == null) continue;
                Vector3 rest = w.restLocal;
                float drop = w.grounded ? w.compression : -0.06f;
                w.pivot.position = transform.TransformPoint(rest + Vector3.up * drop);
                w.pivot.localRotation = w.front ? w.pivotRest * Quaternion.Euler(0, steerAngle * Mathf.Rad2Deg, 0) : w.pivotRest;
                w.spinAngle = (w.spinAngle + u * Time.deltaTime / wheelRadius * Mathf.Rad2Deg) % 360f;
                if (w.spin != null && w.spin != w.pivot) w.spin.localRotation = Quaternion.Euler(w.spinAngle, 0, 0);
            }
        }

    }
}

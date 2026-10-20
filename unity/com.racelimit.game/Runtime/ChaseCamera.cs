using UnityEngine;

namespace RaceLimit
{
    // Cameras, switched with C: chase, far chase, T-cam (above the airbox) and cockpit. B looks back.
    public class ChaseCamera : MonoBehaviour
    {
        public enum View { Chase, Far, TCam, Cockpit }
        public RaceCar car;
        public View view = View.Chase;
        public float eyeZ = 0.15f; // the driver's eyes, forward of the car's origin (from the export)

        Camera cam;
        Vector3 smoothPos, smoothFwd;
        bool init;
        Renderer[] hideInCockpit, cockpitOnly;

        void Awake()
        {
            cam = GetComponent<Camera>();
            if (car == null) car = FindAnyObjectByType<RaceCar>();
            if (car != null)
            {
                var hide = new System.Collections.Generic.List<Renderer>(); var only = new System.Collections.Generic.List<Renderer>();
                foreach (var r in car.GetComponentsInChildren<Renderer>(true))
                {
                    for (var t = r.transform; t != null && t != car.transform; t = t.parent)
                    {
                        if (t.name.StartsWith("RL_HideInCockpit")) { hide.Add(r); break; }
                        if (t.name.StartsWith("RL_CockpitOnly")) { only.Add(r); break; }
                    }
                }
                hideInCockpit = hide.ToArray(); cockpitOnly = only.ToArray();
            }
        }

        public void Next() { view = (View)(((int)view + 1) % 4); init = false; }

        void LateUpdate()
        {
            if (car == null) return;
            var input = car.input;
            if (input != null && input.camera) Next();
            bool back = input != null && input.lookBack;
            Transform t = car.transform;
            bool inside = view == View.Cockpit;
            if (hideInCockpit != null) { foreach (var r in hideInCockpit) r.enabled = !inside; foreach (var r in cockpitOnly) r.enabled = inside; }

            if (view == View.Cockpit || view == View.TCam)
            {
                Vector3 eye = view == View.Cockpit ? new Vector3(0, 0.83f, eyeZ - 0.14f) : new Vector3(0, 1.2f, eyeZ - 0.62f);
                transform.position = t.TransformPoint(eye);
                Vector3 look = t.TransformPoint(view == View.Cockpit ? new Vector3(0, 0.3f, eyeZ + (back ? -14f : 14f)) : new Vector3(0, 0.75f, eyeZ + (back ? -20f : 20f)));
                transform.rotation = Quaternion.LookRotation(look - transform.position, t.up);
                cam.fieldOfView = view == View.Cockpit ? 66 : 62; cam.nearClipPlane = 0.02f;
                init = false;
                return;
            }
            // chase: behind the car's direction of travel, smoothed, a little lower and closer as it speeds up
            float dist = view == View.Far ? 9.5f : 6.2f, height = view == View.Far ? 2.9f : 1.85f;
            Vector3 fwd = t.forward; fwd.y *= 0.3f; fwd.Normalize();
            if (back) fwd = -fwd;
            float dt = Time.deltaTime;
            if (!init) { smoothFwd = fwd; init = true; }
            smoothFwd = Vector3.Slerp(smoothFwd, fwd, 1 - Mathf.Exp(-dt * 6f));
            Vector3 target = t.position + Vector3.up * height - smoothFwd * dist;
            smoothPos = init && (smoothPos - target).sqrMagnitude < 400 ? Vector3.Lerp(smoothPos, target, 1 - Mathf.Exp(-dt * 12f)) : target;
            transform.position = smoothPos;
            transform.rotation = Quaternion.LookRotation(t.position + Vector3.up * 0.9f + smoothFwd * 5f - smoothPos, Vector3.up);
            cam.fieldOfView = 58 + Mathf.Min(10, car.kmh / 3.6f * 0.09f); cam.nearClipPlane = 0.1f;
        }
    }
}

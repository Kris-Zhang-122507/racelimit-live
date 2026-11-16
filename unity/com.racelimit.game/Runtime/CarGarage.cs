using UnityEngine;

namespace RaceLimit
{
    // Puts the chosen car on the PlayerCar (and on the menu's turntable): the model for its era (1998 … 2026), painted
    // in the chosen team's colours, with that era's weight, power, downforce and grip. Also turns the steering wheel
    // with the front wheels and keeps the display on it up to date (gear, speed, delta, battery) in the cockpit view.
    // The era models are set by the editor when it builds a scene; the liveries are in Resources/RL_Liveries.
    [DefaultExecutionOrder(-200)]
    public class CarGarage : MonoBehaviour
    {
        public GameObject[] eraModels = new GameObject[0];
        public int[] eraYears = new int[0];
        [Tooltip("Off on the menu's turntable: only the look changes there")] public bool applyPerformance = true;
        [Tooltip("Set to -1 if the steering wheel turns the wrong way")] public float steeringSign = 1f;
        [Tooltip("How far the steering wheel turns for the front wheels' angle")] public float steeringRatio = 4.2f;
        public bool wheelDisplay = true;

        [System.NonSerialized] public int era; [System.NonSerialized] public string team;
        public const string ModelName = "RL_Model";
        Transform model, steering; Quaternion steeringRest; float steeringDir = 1f;
        Renderer screen; RenderTexture screenTex; float screenAt;
        RaceCar car; RaceSession session; ChaseCamera chase;
        // the 2026 car's numbers, which the other eras are worked out from
        float baseCl, baseClS, baseCd, baseCdS, baseMuF, baseMuRS, baseMuRD; Vector3 baseInertia; bool gotBase;

        void Awake()
        {
            car = GetComponent<RaceCar>();
            Build(RaceSettings.Era, RaceSettings.Team);
        }

        public void Build(int wantEra, string wantTeam)
        {
            GameObject prefab = null; int year = wantEra;
            for (int i = 0; i < eraModels.Length && i < eraYears.Length; i++) if (eraYears[i] == wantEra && eraModels[i] != null) prefab = eraModels[i];
            // the model that's there already (the one the scene was built with)
            if (model == null) { var t = transform.Find(ModelName); if (t == null && transform.childCount > 0 && prefab == null) t = transform.GetChild(0); model = t; }
            if (prefab != null && (model == null || era != wantEra || !built))
            {
                if (model != null) { var old = model.gameObject; old.transform.SetParent(null, false); old.SetActive(false); Destroy(old); }
                var go = Instantiate(prefab, transform, false); go.name = ModelName; model = go.transform;
                model.localPosition = Vector3.zero; model.localRotation = Quaternion.identity;
                // (the car should face +Z: if the importer turned it round, turn it back)
                float zf = 0, zr = 0;
                foreach (var t in go.GetComponentsInChildren<Transform>(true)) { if (t.name.StartsWith("RL_Wheel_F")) zf += transform.InverseTransformPoint(t.position).z; else if (t.name.StartsWith("RL_Wheel_R")) zr += transform.InverseTransformPoint(t.position).z; }
                if (zf < zr) model.localRotation = Quaternion.Euler(0, 180, 0);
                SetLayer(go, gameObject.layer);
            }
            else if (prefab == null) year = model != null ? (era != 0 ? era : 2026) : wantEra; // (no model for that era in this scene: keep the car that's here)
            built = true; era = year; team = wantTeam;
            if (model == null) return;
            Paint(GameData.Team(wantTeam));
            steering = Find(model, "RL_Steering");
            if (steering != null)
            {
                steeringRest = steering.localRotation;
                // (the wheel turns about its own column. Turning right is clockwise for the driver: a positive turn
                // about that axis when it points back at the driver, a negative one when it points forward)
                steeringDir = transform.InverseTransformDirection(steering.TransformDirection(Vector3.forward)).z <= 0 ? 1f : -1f;
            }
            var sc = Find(model, "RL_WheelScreen"); screen = sc != null ? sc.GetComponent<Renderer>() : null;
            if (applyPerformance && car != null) Performance(GameData.Era(era));
        }
        bool built;

        static Transform Find(Transform t, string name)
        {
            if (t.name == name) return t;
            for (int i = 0; i < t.childCount; i++) { var r = Find(t.GetChild(i), name); if (r != null) return r; }
            return null;
        }
        static void SetLayer(GameObject go, int layer) { go.layer = layer; foreach (Transform c in go.transform) SetLayer(c.gameObject, layer); }

        // ---- the team's colours: the livery texture on the bodywork, the two colours on the plain painted parts ----
        static readonly string[] TexProps = { "baseColorTexture", "_BaseMap", "_MainTex" }, ColProps = { "baseColorFactor", "_BaseColor", "_Color" };
        void Paint(TeamInfo t)
        {
            var livery = Resources.Load<Texture2D>("RL_Liveries/" + t.name);
            foreach (var r in model.GetComponentsInChildren<Renderer>(true))
            {
                var shared = r.sharedMaterials; bool any = false;
                foreach (var m in shared) if (m != null && m.name.StartsWith("rl_")) any = true;
                if (!any) continue;
                var mats = r.materials; // (this car's own copies)
                foreach (var m in mats)
                {
                    if (m == null) continue;
                    if (m.name.StartsWith("rl_livery")) { if (livery != null) foreach (var p in TexProps) if (m.HasProperty(p)) m.SetTexture(p, livery); }
                    else if (m.name.StartsWith("rl_paint")) { foreach (var p in ColProps) if (m.HasProperty(p)) m.SetColor(p, t.body); }
                    else if (m.name.StartsWith("rl_accent")) { foreach (var p in ColProps) if (m.HasProperty(p)) m.SetColor(p, t.accent); }
                }
            }
        }

        // ---- how each era's car drives, from the 2026 car's numbers ----
        void Performance(EraInfo e)
        {
            if (!gotBase) { baseCl = car.clCorner; baseClS = car.clStraight; baseCd = car.cdCorner; baseCdS = car.cdStraight; baseMuF = car.muFront; baseMuRS = car.muRearSide; baseMuRD = car.muRearDrive; baseInertia = car.inertia; gotBase = true; }
            float m = e.mass / 800f;
            car.mass = e.mass; car.inertia = baseInertia * m;
            car.pIce = e.power; car.pErs = e.ers * 0.75f; car.pErsBoost = e.ers;
            car.clCorner = baseCl * e.downforce; car.cdCorner = baseCd * e.drag;
            // (only the 2026 car opens its wings on the straights; the others get a smaller gain, like a drag-reduction flap)
            car.clStraight = e.activeAero ? baseClS : car.clCorner * 0.93f; car.cdStraight = e.activeAero ? baseCdS : car.cdCorner * 0.84f;
            car.muFront = baseMuF * e.grip; car.muRearSide = baseMuRS * e.grip; car.muRearDrive = baseMuRD * e.grip;
            car.rpmShown = e.limiterRpm / 12500f;
            var wr = Find(model, "RL_Wheel_FL"); // (the wheels' size differs between eras: the physics rolls on the model's own)
            if (wr != null) { float y = transform.InverseTransformPoint(wr.position).y; if (y > 0.25f && y < 0.45f) car.wheelRadius = y; }
        }

        // where the driver's eyes are in each era's car, forward of the car's origin (the cockpit moved back and forth)
        public static float EyeZ(int year) { return year == 1998 ? -0.025f : year == 2009 ? 0.05f : year == 2017 || year == 2022 ? 0.25f : 0.15f; }

        void Start()
        {
            session = FindAnyObjectByType<RaceSession>(); chase = FindAnyObjectByType<ChaseCamera>();
            if (chase != null && applyPerformance && era != 0) chase.eyeZ = EyeZ(era);
        }

        void LateUpdate()
        {
            if (steering != null && car != null) steering.localRotation = steeringRest * Quaternion.Euler(0, 0, steeringSign * steeringDir * car.steerAngle * steeringRatio * Mathf.Rad2Deg);
        }

        // ---- the steering wheel's display, drawn into a texture a few times a second while you can see it ----
        GUIStyle big, small;
        void OnGUI()
        {
            if (!wheelDisplay || screen == null || car == null || Event.current.type != EventType.Repaint) return;
            if (chase != null && chase.view != ChaseCamera.View.Cockpit) return;
            if (Time.unscaledTime - screenAt < 0.08f) return;
            screenAt = Time.unscaledTime;
            const int W = 256, H = 144;
            if (screenTex == null)
            {
                screenTex = new RenderTexture(W, H, 0) { name = "RL_WheelScreenTex" };
                foreach (var p in TexProps) if (screen.material.HasProperty(p)) screen.material.SetTexture(p, screenTex);
                foreach (var p in ColProps) if (screen.material.HasProperty(p)) screen.material.SetColor(p, Color.white);
                big = new GUIStyle(GUI.skin.label) { fontSize = 84, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter };
                small = new GUIStyle(GUI.skin.label) { fontSize = 22, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter };
            }
            var prev = RenderTexture.active; RenderTexture.active = screenTex;
            GL.PushMatrix(); GL.LoadPixelMatrix(0, W, H, 0);
            GL.Clear(true, true, new Color(0.03f, 0.035f, 0.05f, 1));
            // rev lights along the top: green, red, then blue at the limiter
            float rev = Mathf.InverseLerp(9000, 12300, car.rpm);
            for (int i = 0; i < 12; i++)
            {
                bool on = rev > i / 12f; Color c = i < 5 ? new Color(0.2f, 0.9f, 0.4f) : i < 9 ? new Color(1f, 0.25f, 0.2f) : new Color(0.3f, 0.5f, 1f);
                GUI.DrawTexture(new Rect(8 + i * 20, 6, 16, 10), Texture2D.whiteTexture, ScaleMode.StretchToFill, true, 0, on ? c : new Color(0.13f, 0.15f, 0.19f), 0, 3);
            }
            big.normal.textColor = new Color(1f, 0.71f, 0.28f);
            GUI.Label(new Rect(78, 18, 100, 96), car.reverse ? "R" : car.gear.ToString(), big);
            small.normal.textColor = Color.white; small.alignment = TextAnchor.MiddleLeft;
            GUI.Label(new Rect(10, 30, 80, 28), Mathf.RoundToInt(car.kmh).ToString(), small);
            small.normal.textColor = new Color(0.55f, 0.6f, 0.68f); small.fontSize = 12; GUI.Label(new Rect(10, 54, 80, 18), "KM/H", small);
            // the battery
            float soc = car.batteryJ > 0 ? car.ers / car.batteryJ : 0;
            small.fontSize = 22; small.alignment = TextAnchor.MiddleRight; small.normal.textColor = new Color(0.25f, 0.85f, 0.45f);
            GUI.Label(new Rect(166, 30, 80, 28), car.pErsBoost > 1 ? Mathf.RoundToInt(soc * 100) + "%" : "", small);
            small.normal.textColor = new Color(0.55f, 0.6f, 0.68f); small.fontSize = 12; GUI.Label(new Rect(166, 54, 80, 18), car.pErsBoost > 1 ? "BATT" : "", small);
            // the delta to your best lap
            small.fontSize = 22; small.alignment = TextAnchor.MiddleCenter;
            if (session != null && session.hasDelta) { small.normal.textColor = session.delta <= 0 ? new Color(0.25f, 0.85f, 0.45f) : new Color(1f, 0.36f, 0.36f); GUI.Label(new Rect(0, 110, W, 28), (session.delta <= 0 ? "−" : "+") + Mathf.Abs(session.delta).ToString("0.00"), small); }
            else if (car.pitLimiter) { small.normal.textColor = new Color(0.4f, 0.65f, 1f); GUI.Label(new Rect(0, 110, W, 28), "PIT LIMITER", small); }
            GL.PopMatrix(); RenderTexture.active = prev;
        }

        void OnDestroy() { if (screenTex != null) screenTex.Release(); }
    }
}

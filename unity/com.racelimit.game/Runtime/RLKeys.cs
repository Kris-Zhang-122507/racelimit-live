using UnityEngine;
#if RL_INPUTSYSTEM && ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace RaceLimit
{
    public enum RLAction { Throttle, Brake, Left, Right, GearUp, GearDown, Boost, Aero, Camera, LookBack, Reset, BiasUp, BiasDown, Info, Pause }

    // The keys for each action (two per action, changeable in Settings and saved), and the game controller, read the
    // same way whichever of Unity's two input systems the project uses.
    public static class RLKeys
    {
        public static readonly string[] Labels = { "Throttle", "Brake", "Steer left", "Steer right", "Gear up", "Gear down", "Overtake boost", "Aero mode", "Camera", "Look back", "Back on track", "Brake bias forward", "Brake bias back", "More / less on screen", "Pause" };
        static readonly KeyCode[,] Defaults =
        {
            { KeyCode.UpArrow, KeyCode.W }, { KeyCode.DownArrow, KeyCode.S }, { KeyCode.LeftArrow, KeyCode.A }, { KeyCode.RightArrow, KeyCode.D },
            { KeyCode.E, KeyCode.RightShift }, { KeyCode.Q, KeyCode.RightControl }, { KeyCode.Space, KeyCode.O }, { KeyCode.F, KeyCode.None },
            { KeyCode.C, KeyCode.None }, { KeyCode.B, KeyCode.None }, { KeyCode.R, KeyCode.None }, { KeyCode.RightBracket, KeyCode.None },
            { KeyCode.LeftBracket, KeyCode.None }, { KeyCode.Tab, KeyCode.None }, { KeyCode.Escape, KeyCode.P },
        };
        public const int Count = 15;
        static KeyCode[,] keys;

        static void Load()
        {
            if (keys != null) return;
            keys = new KeyCode[Count, 2];
            for (int a = 0; a < Count; a++) for (int s = 0; s < 2; s++) keys[a, s] = (KeyCode)PlayerPrefs.GetInt("RaceLimit.key." + a + "." + s, (int)Defaults[a, s]);
        }

        public static KeyCode Get(RLAction a, int slot) { Load(); return keys[(int)a, slot]; }
        public static void Set(RLAction a, int slot, KeyCode k)
        {
            Load();
            // (a key does one thing: taken off whatever had it)
            if (k != KeyCode.None) for (int i = 0; i < Count; i++) for (int s = 0; s < 2; s++) if (keys[i, s] == k) { keys[i, s] = KeyCode.None; PlayerPrefs.SetInt("RaceLimit.key." + i + "." + s, 0); }
            keys[(int)a, slot] = k; PlayerPrefs.SetInt("RaceLimit.key." + (int)a + "." + slot, (int)k);
        }
        public static void ResetAll() { Load(); for (int a = 0; a < Count; a++) for (int s = 0; s < 2; s++) { keys[a, s] = Defaults[a, s]; PlayerPrefs.DeleteKey("RaceLimit.key." + a + "." + s); } }

        public static string Name(KeyCode k)
        {
            switch (k)
            {
                case KeyCode.None: return "–";
                case KeyCode.UpArrow: return "↑"; case KeyCode.DownArrow: return "↓"; case KeyCode.LeftArrow: return "←"; case KeyCode.RightArrow: return "→";
                case KeyCode.LeftBracket: return "["; case KeyCode.RightBracket: return "]"; case KeyCode.Return: return "Enter"; case KeyCode.Escape: return "Esc";
                case KeyCode.RightShift: return "Right Shift"; case KeyCode.LeftShift: return "Left Shift"; case KeyCode.RightControl: return "Right Ctrl"; case KeyCode.LeftControl: return "Left Ctrl";
                case KeyCode.Comma: return ","; case KeyCode.Period: return "."; case KeyCode.Slash: return "/"; case KeyCode.Semicolon: return ";"; case KeyCode.Minus: return "-"; case KeyCode.Equals: return "=";
            }
            string s = k.ToString();
            if (s.StartsWith("Alpha")) return s.Substring(5);
            if (s.StartsWith("Keypad")) return "Num " + s.Substring(6);
            return s;
        }
        public static string Names(RLAction a)
        {
            KeyCode k0 = Get(a, 0), k1 = Get(a, 1);
            return k1 == KeyCode.None ? Name(k0) : k0 == KeyCode.None ? Name(k1) : Name(k0) + " / " + Name(k1);
        }

        public static bool Held(RLAction a) { Load(); return KeyHeld(keys[(int)a, 0]) || KeyHeld(keys[(int)a, 1]); }
        public static bool Down(RLAction a) { Load(); return KeyDown(keys[(int)a, 0]) || KeyDown(keys[(int)a, 1]); }

        // ---- one key, in either input system ----
#if RL_INPUTSYSTEM && ENABLE_INPUT_SYSTEM
        static readonly System.Collections.Generic.Dictionary<KeyCode, Key> map = new System.Collections.Generic.Dictionary<KeyCode, Key>();
        static bool ToKey(KeyCode k, out Key key)
        {
            if (map.TryGetValue(k, out key)) return key != Key.None;
            string n = k.ToString();
            if (n.StartsWith("Alpha")) n = "Digit" + n.Substring(5);
            else if (n.StartsWith("Keypad") && n.Length == 7) n = "Numpad" + n.Substring(6);
            else if (n == "Return") n = "Enter"; else if (n == "KeypadEnter") n = "NumpadEnter";
            else if (n == "LeftControl") n = "LeftCtrl"; else if (n == "RightControl") n = "RightCtrl";
            else if (n == "BackQuote") n = "Backquote"; else if (n == "Equals") n = "Equals";
            Key parsed = Key.None;
            try { parsed = (Key)System.Enum.Parse(typeof(Key), n); } catch { parsed = Key.None; }
            map[k] = parsed; key = parsed; return parsed != Key.None;
        }
        public static bool KeyHeld(KeyCode k) { Key key; var kb = Keyboard.current; return k != KeyCode.None && kb != null && ToKey(k, out key) && kb[key].isPressed; }
        public static bool KeyDown(KeyCode k) { Key key; var kb = Keyboard.current; return k != KeyCode.None && kb != null && ToKey(k, out key) && kb[key].wasPressedThisFrame; }
#else
        public static bool KeyHeld(KeyCode k) { return k != KeyCode.None && Input.GetKey(k); }
        public static bool KeyDown(KeyCode k) { return k != KeyCode.None && Input.GetKeyDown(k); }
#endif

        // ---- the controller ----
        public struct Pad
        {
            public bool there;
            public float throttle, brake, x, y;
            public bool a, b, x_, y_, lb, rb, start, back, up, down, left, right;
        }
        static Pad cur, prev; static int frame = -1;
        static void Refresh()
        {
            if (frame == Time.frameCount) return;
            frame = Time.frameCount; prev = cur; cur = Read();
        }
        static Pad Read()
        {
            var p = new Pad();
#if RL_INPUTSYSTEM && ENABLE_INPUT_SYSTEM
            var g = Gamepad.current;
            if (g == null) return p;
            p.there = true;
            p.throttle = g.rightTrigger.ReadValue(); p.brake = g.leftTrigger.ReadValue();
            Vector2 st = g.leftStick.ReadValue(); p.x = st.x; p.y = st.y;
            p.a = g.buttonSouth.isPressed; p.b = g.buttonEast.isPressed; p.x_ = g.buttonWest.isPressed; p.y_ = g.buttonNorth.isPressed;
            p.lb = g.leftShoulder.isPressed; p.rb = g.rightShoulder.isPressed; p.start = g.startButton.isPressed; p.back = g.selectButton.isPressed;
            p.up = g.dpad.up.isPressed; p.down = g.dpad.down.isPressed; p.left = g.dpad.left.isPressed; p.right = g.dpad.right.isPressed;
#else
            // (the old input manager: an Xbox-style controller's buttons; its triggers aren't set up by default, so
            // A is the throttle and X the brake there)
            string[] names = Input.GetJoystickNames(); bool any = false;
            if (names != null) foreach (var n in names) if (!string.IsNullOrEmpty(n)) any = true;
            if (!any) return p;
            p.there = true;
            p.a = Input.GetKey(KeyCode.JoystickButton0); p.b = Input.GetKey(KeyCode.JoystickButton1); p.x_ = Input.GetKey(KeyCode.JoystickButton2); p.y_ = Input.GetKey(KeyCode.JoystickButton3);
            p.lb = Input.GetKey(KeyCode.JoystickButton4); p.rb = Input.GetKey(KeyCode.JoystickButton5); p.back = Input.GetKey(KeyCode.JoystickButton6); p.start = Input.GetKey(KeyCode.JoystickButton7);
#endif
            return p;
        }
        public static Pad Now { get { Refresh(); return cur; } }
        public static Pad Before { get { Refresh(); return prev; } }

        // ---- moving round the menus: arrows / d-pad / stick, Enter or A to choose, Esc or B to go back ----
        static float stickAt;
        public static void Nav(out int dx, out int dy, out bool submit, out bool back)
        {
            Refresh();
            dx = (KeyDown(KeyCode.RightArrow) ? 1 : 0) - (KeyDown(KeyCode.LeftArrow) ? 1 : 0);
            dy = (KeyDown(KeyCode.DownArrow) ? 1 : 0) - (KeyDown(KeyCode.UpArrow) ? 1 : 0);
            submit = KeyDown(KeyCode.Return) || KeyDown(KeyCode.KeypadEnter);
            back = KeyDown(KeyCode.Escape);
            if (!cur.there) return;
            if (cur.right && !prev.right) dx = 1; if (cur.left && !prev.left) dx = -1;
            if (cur.down && !prev.down) dy = 1; if (cur.up && !prev.up) dy = -1;
            // the stick: one step, then repeats while it's held
            int sx = cur.x > 0.6f ? 1 : cur.x < -0.6f ? -1 : 0, sy = cur.y > 0.6f ? -1 : cur.y < -0.6f ? 1 : 0;
            if (sx == 0 && sy == 0) stickAt = 0;
            else if (Time.unscaledTime >= stickAt) { if (sx != 0) dx = sx; else dy = sy; stickAt = Time.unscaledTime + (stickAt == 0 ? 0.4f : 0.16f); }
            if (cur.a && !prev.a) submit = true;
            if (cur.b && !prev.b) back = true;
        }
    }
}

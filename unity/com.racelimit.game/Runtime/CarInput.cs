using UnityEngine;
#if RL_INPUTSYSTEM && ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace RaceLimit
{
    // Keyboard and game controller, read once a frame. Keys as in the web game:
    //   ↑/W throttle, ↓/S brake (hold when stopped to reverse), ←→/A D steer, E/Q gears, Space overtake,
    //   [ ] brake bias, C camera, B look back, R reset, F aero, Tab more/less info, Esc pause.
    // Controller: right trigger throttle, left trigger brake, left stick steer, bumpers gears, A overtake,
    //   Y camera, d-pad up/down brake bias, Back reset, Start pause.
    public class CarInput : MonoBehaviour
    {
        public float throttle, brake, steer; // steer: -1 left … +1 right
        public bool analog;                  // true when a controller is driving (smooth values)
        public bool boost, lookBack;
        public bool gearUp, gearDown, camera, reset, biasUp, biasDown, aero, info, pause; // this frame only

        void Update()
        {
            float kThr = 0, kBrk = 0, kSteer = 0; bool any = false;
#if RL_INPUTSYSTEM && ENABLE_INPUT_SYSTEM
            var k = Keyboard.current; var g = Gamepad.current;
            if (k != null)
            {
                kThr = (k.upArrowKey.isPressed || k.wKey.isPressed) ? 1 : 0;
                kBrk = (k.downArrowKey.isPressed || k.sKey.isPressed) ? 1 : 0;
                kSteer = ((k.rightArrowKey.isPressed || k.dKey.isPressed) ? 1 : 0) - ((k.leftArrowKey.isPressed || k.aKey.isPressed) ? 1 : 0);
                gearUp = k.eKey.wasPressedThisFrame || k.rightShiftKey.wasPressedThisFrame;
                gearDown = k.qKey.wasPressedThisFrame || k.rightCtrlKey.wasPressedThisFrame;
                camera = k.cKey.wasPressedThisFrame; reset = k.rKey.wasPressedThisFrame; aero = k.fKey.wasPressedThisFrame;
                biasUp = k.rightBracketKey.wasPressedThisFrame; biasDown = k.leftBracketKey.wasPressedThisFrame;
                info = k.tabKey.wasPressedThisFrame; pause = k.escapeKey.wasPressedThisFrame || k.pKey.wasPressedThisFrame;
                boost = k.spaceKey.isPressed || k.oKey.isPressed; lookBack = k.bKey.isPressed;
            }
            else { gearUp = gearDown = camera = reset = aero = biasUp = biasDown = info = pause = boost = lookBack = false; }
            any = kThr > 0 || kBrk > 0 || kSteer != 0;
            if (g != null)
            {
                float gt = g.rightTrigger.ReadValue(), gb = g.leftTrigger.ReadValue(), gs = g.leftStick.x.ReadValue();
                if (Mathf.Abs(gs) < 0.08f) gs = 0; else gs = Mathf.Sign(gs) * Mathf.Pow((Mathf.Abs(gs) - 0.08f) / 0.92f, 1.4f);
                gearUp |= g.rightShoulder.wasPressedThisFrame || g.buttonEast.wasPressedThisFrame;
                gearDown |= g.leftShoulder.wasPressedThisFrame || g.buttonWest.wasPressedThisFrame;
                camera |= g.buttonNorth.wasPressedThisFrame; reset |= g.selectButton.wasPressedThisFrame; pause |= g.startButton.wasPressedThisFrame;
                biasUp |= g.dpad.up.wasPressedThisFrame; biasDown |= g.dpad.down.wasPressedThisFrame;
                boost |= g.buttonSouth.isPressed;
                if (!any && (gt > 0.02f || gb > 0.02f || gs != 0 || analog)) { throttle = gt; brake = gb; steer = gs; analog = true; return; }
            }
#else
            kThr = (Input.GetKey(KeyCode.UpArrow) || Input.GetKey(KeyCode.W)) ? 1 : 0;
            kBrk = (Input.GetKey(KeyCode.DownArrow) || Input.GetKey(KeyCode.S)) ? 1 : 0;
            kSteer = ((Input.GetKey(KeyCode.RightArrow) || Input.GetKey(KeyCode.D)) ? 1 : 0) - ((Input.GetKey(KeyCode.LeftArrow) || Input.GetKey(KeyCode.A)) ? 1 : 0);
            gearUp = Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.RightShift);
            gearDown = Input.GetKeyDown(KeyCode.Q) || Input.GetKeyDown(KeyCode.RightControl);
            camera = Input.GetKeyDown(KeyCode.C); reset = Input.GetKeyDown(KeyCode.R); aero = Input.GetKeyDown(KeyCode.F);
            biasUp = Input.GetKeyDown(KeyCode.RightBracket); biasDown = Input.GetKeyDown(KeyCode.LeftBracket);
            info = Input.GetKeyDown(KeyCode.Tab); pause = Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.P);
            boost = Input.GetKey(KeyCode.Space) || Input.GetKey(KeyCode.O); lookBack = Input.GetKey(KeyCode.B);
            any = kThr > 0 || kBrk > 0 || kSteer != 0;
#endif
            if (any) analog = false;
            throttle = kThr; brake = kBrk; steer = kSteer;
        }
    }
}

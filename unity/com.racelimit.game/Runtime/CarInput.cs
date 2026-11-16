using UnityEngine;

namespace RaceLimit
{
    // Keyboard and game controller, read once a frame. The keys can be changed in Settings (RLKeys); by default, as in
    // the web game:
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
        [System.NonSerialized] public bool locked; // (while a menu is open over the game: nothing but pause gets through)

        void Update()
        {
            float kThr = RLKeys.Held(RLAction.Throttle) ? 1 : 0, kBrk = RLKeys.Held(RLAction.Brake) ? 1 : 0;
            float kSteer = (RLKeys.Held(RLAction.Right) ? 1 : 0) - (RLKeys.Held(RLAction.Left) ? 1 : 0);
            gearUp = RLKeys.Down(RLAction.GearUp); gearDown = RLKeys.Down(RLAction.GearDown);
            camera = RLKeys.Down(RLAction.Camera); reset = RLKeys.Down(RLAction.Reset); aero = RLKeys.Down(RLAction.Aero);
            biasUp = RLKeys.Down(RLAction.BiasUp); biasDown = RLKeys.Down(RLAction.BiasDown);
            info = RLKeys.Down(RLAction.Info); pause = RLKeys.Down(RLAction.Pause);
            boost = RLKeys.Held(RLAction.Boost); lookBack = RLKeys.Held(RLAction.LookBack);
            bool any = kThr > 0 || kBrk > 0 || kSteer != 0;

            var g = RLKeys.Now; var was = RLKeys.Before;
            if (g.there)
            {
                float gt = g.throttle, gb = g.brake, gs = g.x;
                if (Mathf.Abs(gs) < 0.08f) gs = 0; else gs = Mathf.Sign(gs) * Mathf.Pow((Mathf.Abs(gs) - 0.08f) / 0.92f, 1.4f);
                gearUp |= g.rb && !was.rb; gearDown |= g.lb && !was.lb;
                camera |= g.y_ && !was.y_; reset |= g.back && !was.back; pause |= g.start && !was.start;
                biasUp |= g.up && !was.up; biasDown |= g.down && !was.down;
                boost |= g.a;
                if (!any && (gt > 0.02f || gb > 0.02f || gs != 0 || analog))
                {
                    throttle = gt; brake = gb; steer = gs; analog = true;
                    if (locked) Lock();
                    return;
                }
            }
            if (any) analog = false;
            throttle = kThr; brake = kBrk; steer = kSteer;
            if (locked) Lock();
        }

        void Lock() { throttle = 0; brake = 0; steer = 0; boost = lookBack = gearUp = gearDown = camera = reset = biasUp = biasDown = aero = info = false; }
    }
}

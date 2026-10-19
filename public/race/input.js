// Keyboard and game controller input for the racing game.
// Keyboard: ↑/W throttle, ↓/S brake, ←→/A D steer, E/Q gears, C camera, R reset, L racing line,
// B look back, Space overtake (extra battery power), M sound, Esc/P pause. Controllers use the standard
// layout (Xbox / PlayStation); A / cross is overtake.
const BIND = {
  throttle: ["ArrowUp", "KeyW"], brake: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"],
  up: ["KeyE", "ShiftRight"], down: ["KeyQ", "ControlRight"], camera: ["KeyC"], reset: ["KeyR"], line: ["KeyL"], back: ["KeyB"],
  mute: ["KeyM"], pause: ["Escape", "KeyP"], aero: ["KeyF"], boost: ["Space", "KeyO"],
};
const ONE_SHOT = ["up", "down", "camera", "reset", "line", "mute", "pause", "aero"];

export function createInput() {
  const held = new Set(), events = new Set();
  const action = (code) => Object.keys(BIND).find((k) => BIND[k].includes(code));
  const onDown = (e) => {
    const a = action(e.code); if (!a) return;
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    e.preventDefault();
    if (!held.has(a) && ONE_SHOT.includes(a)) events.add(a);
    held.add(a);
  };
  const onUp = (e) => { const a = action(e.code); if (a) held.delete(a); };
  const onBlur = () => held.clear();
  addEventListener("keydown", onDown); addEventListener("keyup", onUp); addEventListener("blur", onBlur);

  // controller: buttons that were down last frame, so presses fire once
  let padPrev = [], usingPad = false;
  function pad() {
    const p = navigator.getGamepads?.()?.find((g) => g && g.connected);
    if (!p) return null;
    const b = (i) => p.buttons[i]?.value ?? 0, pressed = (i) => b(i) > 0.5 && !(padPrev[i] > 0.5);
    let steer = -(p.axes[0] ?? 0); if (Math.abs(steer) < 0.08) steer = 0; else steer = Math.sign(steer) * ((Math.abs(steer) - 0.08) / 0.92) ** 1.4;
    const out = { throttle: b(7), brake: b(6), steer, up: pressed(5) || pressed(1), down: pressed(4) || pressed(2), camera: pressed(3), reset: pressed(8), pause: pressed(9), boost: b(0) > 0.5 };
    padPrev = p.buttons.map((x) => x.value);
    if (out.throttle > 0.05 || out.brake > 0.05 || Math.abs(out.steer) > 0.1) usingPad = true;
    return out;
  }

  return {
    // one reading per frame: analogue values plus one-shot actions
    poll() {
      const g = pad();
      const kSteer = (held.has("left") ? 1 : 0) - (held.has("right") ? 1 : 0);
      const kb = { throttle: held.has("throttle") ? 1 : 0, brake: held.has("brake") ? 1 : 0, steer: kSteer };
      const useKb = kb.throttle || kb.brake || kSteer || !g || !usingPad;
      const r = {
        throttle: Math.max(kb.throttle, g?.throttle ?? 0), brake: Math.max(kb.brake, g?.brake ?? 0),
        steer: kSteer !== 0 ? kSteer : g?.steer ?? 0, analog: !useKb && !!g,
        back: held.has("back"), boost: held.has("boost") || !!g?.boost,
      };
      for (const k of ONE_SHOT) r[k] = events.has(k) || !!g?.[k];
      events.clear();
      return r;
    },
    hasPad: () => !!navigator.getGamepads?.()?.some((g) => g && g.connected),
    dispose() { removeEventListener("keydown", onDown); removeEventListener("keyup", onUp); removeEventListener("blur", onBlur); },
  };
}

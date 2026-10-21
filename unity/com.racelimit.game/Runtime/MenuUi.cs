using UnityEngine;

namespace RaceLimit
{
    // The menus' pieces, in the web game's style (race.css): panels, cards, buttons, choice chips. Drawn through an
    // ImguiPainter in the web page's pixels; a button returns true when it's clicked.
    public static class MenuUi
    {
        public static readonly Color Bg = HudLayout.Hex(0x0B0D12), Card = HudLayout.Hex(0x13161D), CardDark = HudLayout.Hex(0x11141B), Line = HudLayout.Hex(0x262B36), ChipBg = HudLayout.Hex(0x181C25), ChipOn = HudLayout.Hex(0x2A2310), Dark = HudLayout.Hex(0x17120A);

        // the web page's pixels are the screen's at 96 dpi, more on a high-resolution screen (Windows' display scaling)
        public static float ScreenScale()
        {
            float dpi = Screen.dpi > 30 ? Screen.dpi : 96f * Screen.height / 1080f;
            return Mathf.Clamp(dpi / 96f, 0.75f, 3f);
        }

        public static void Panel(IMenuPainter p, Rect r) { p.Fill(r, new Color(14 / 255f, 17 / 255f, 23 / 255f, 0.96f), 14); p.Border(r, Line, 14, 1); }
        public static void CardBox(IMenuPainter p, Rect r, bool hover) { p.Fill(r, CardDark, 12); p.Border(r, hover ? HudLayout.Accent : Line, 12, 1); }

        public static bool Button(IMenuPainter p, Rect r, string label, bool primary, bool enabled = true)
        {
            bool hover = enabled && p.Hover(r);
            p.Fill(r, primary ? (hover ? HudLayout.Hex(0xFFC46A) : HudLayout.Accent) : Card, 8);
            p.Border(r, primary ? HudLayout.Accent : hover ? HudLayout.Accent : Line, 8, 1);
            float o = p.Opacity; if (!enabled) p.Opacity = o * 0.45f;
            p.Text(r, label, HudFont.B600, 14, primary ? Dark : HudLayout.Text, TextAnchor.MiddleCenter);
            p.Opacity = o;
            return enabled && p.Hit(r);
        }

        public static float ChipWidth(IMenuPainter p, string label) { return p.Width(label, HudFont.B600, 13) + 26; }
        // a choice in a row of choices (".seg button"); on = chosen
        public static bool Chip(IMenuPainter p, Rect r, string label, bool on, bool enabled = true)
        {
            bool hover = enabled && p.Hover(r);
            p.Fill(r, on ? ChipOn : ChipBg, 16); p.Border(r, on || hover ? HudLayout.Accent : Line, 16, 1);
            float o = p.Opacity; if (!enabled) p.Opacity = o * 0.45f;
            p.Text(r, label, HudFont.B600, 13, on ? HudLayout.Accent : HudLayout.Soft, TextAnchor.MiddleCenter);
            p.Opacity = o;
            return enabled && p.Hit(r);
        }

        // a row of chips; returns the one clicked (or -1)
        public static int Chips(IMenuPainter p, float x, float y, string[] labels, int on, bool[] enabled = null)
        {
            int hit = -1;
            for (int i = 0; i < labels.Length; i++)
            {
                float w = ChipWidth(p, labels[i]);
                if (Chip(p, new Rect(x, y, w, 30), labels[i], i == on, enabled == null || enabled[i])) hit = i;
                x += w + 6;
            }
            return hit;
        }

        // a small capitals label (".k")
        public static void Label(IMenuPainter p, float x, float y, float w, string s, float size = 10)
        {
            p.Text(new Rect(x, y, w, size * 1.45f), s.ToUpperInvariant(), HudFont.B600, size, HudLayout.Muted, TextAnchor.MiddleLeft);
        }

        public static void Pill(IMenuPainter p, float x, float y, string s, Color bg, Color fg)
        {
            float w = p.Width(s, HudFont.B700, 11) + 18; var r = new Rect(x, y, w, 20);
            p.Fill(r, bg, 10); p.Text(r, s, HudFont.B700, 11, fg, TextAnchor.MiddleCenter);
        }
    }
}

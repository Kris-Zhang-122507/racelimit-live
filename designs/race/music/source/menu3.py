# Main menu 3 — "Dusk": calm and cinematic, piano + strings + flute + horn, G major, 84 BPM, 32 bars (~1:31), loops.
from lib2 import *

PROG = {}
layout(PROG, 1, ["G", "Em", "C", "D"])
layout(PROG, 5, ["G", "Em", "C", "D", "G", "Em", "Am", "D"])
layout(PROG, 13, ["C", "D", "Bm", "Em", "C", "Am", "D", "D"])
layout(PROG, 21, ["G", "Em", "C", "D", "G", "Em", "Am", "D"])
layout(PROG, 29, ["G", "Em", "C", "D"])
BARS = 32
MA = [
    [(6, "G4"), (2, "D4"), (2, "G4"), (2, "A4"), (4, "B4")],
    [(6, "B4"), (2, "A4"), (8, "G4")],
    [(6, "C5"), (2, "B4"), (4, "G4"), (4, "E4")],
    [(12, "F#4"), (4, "A4")],
    [(6, "G4"), (2, "D4"), (2, "G4"), (2, "A4"), (4, "B4")],
    [(6, "B4"), (2, "C5"), (4, "B4"), (4, "G4")],
    [(6, "A4"), (2, "B4"), (4, "C5"), (2, "B4"), (2, "A4")],
    [(16, "A4")],
]
MB = [
    [(6, "E5"), (2, "D5"), (4, "C5"), (4, "G4")],
    [(6, "F#5"), (2, "E5"), (4, "D5"), (4, "A4")],
    [(6, "D5"), (2, "B4"), (8, "F#5")],
    [(6, "G5"), (2, "F#5"), (8, "E5")],
    [(6, "E5"), (2, "D5"), (4, "C5"), (4, "E5")],
    [(6, "A5"), (2, "G5"), (4, "E5"), (4, "C5")],
    [(8, "A5"), (4, "F#5"), (4, "D5")],
    [(16, "D5")],
]

s = Score("RaceLimit – Dusk", BARS, 84, key=1)
fl, hn, ti, pn = s.add(flute()), s.add(solo_horn()), s.add(timpani()), s.add(piano())
v1, v2, va, vc, cb = [s.add(x) for x in strings()]
for b, name in [(1, "Intro"), (5, "Theme"), (13, "Strings"), (21, "Theme 2"), (29, "Outro")]: s.mark(s.bar(b), name)
s.loop = True; B = s.bar; A = Arr(s, PROG)
R = lambda a, b: range(a, b + 1)

# piano left hand: a flowing arpeggio the whole way through
for b in R(1, BARS):
    ch = PROG[b]; r = root(ch, M("E2")); f5 = above(fifth(ch), M(r) + 1); r8 = above(pcs(ch)[0], M(f5) + 1); t10 = above(pcs(ch)[1], M(r8) + 1)
    seq = [r, f5, r8, t10, r8, f5, r8, f5]
    for i in range(8): pn.n(B(b) + 2 * i, 2, seq[i], staff=2)
pn.dyn(B(1), "p", staff=2).words(B(1), "with pedal", staff=2, above=False)
# piano right hand
A.rhythm(pn, R(1, 4), lambda c: tri(c, "D5"), [8, 8])
melody(s, pn, 5, MA, arts_first=())
A.rhythm(pn, R(13, 28), lambda c: tri(c, "D5"), [8, 8])
melody(s, pn, 29, [MA[0], [(16, "B4")], [(6, "C5"), (2, "B4"), (8, "G4")], [(16, "F#4")]], arts_first=())
pn.dyn(B(1), "pp").dyn(B(5), "mp").dyn(B(13), "p").dyn(B(29), "p")

# strings
A.hold(va, R(5, 32), lambda c: tones(c, M("G3"), M("D4"))[-1])
A.hold(vc, R(5, 32), lambda c: root(c, M("C2")))
A.hold(cb, R(13, 28), lambda c: root(c, M("E1")))
A.hold(v2, R(13, 28), lambda c: tones(c, M("D4"), M("A4"))[-1])
melody(s, v1, 13, MB, arts_first=()); melody(s, v1, 21, MA, arts_first=())
A.hold(v1, R(29, 31), lambda c: tones(c, M("B4"), M("B5"))[-1])
for p in (va, vc): p.dyn(B(5), "pp").dyn(B(13), "p").dyn(B(21), "mp").dyn(B(29), "pp")
v2.dyn(B(13), "p").dyn(B(21), "mp"); cb.dyn(B(13), "p")
v1.dyn(B(13), "mp").wedge(B(17), B(20) - 1).dyn(B(21), "mf").dyn(B(29), "pp")

# flute takes the tune an octave up the second time
melody(s, fl, 21, up(MA), arts_first=()); fl.dyn(B(21), "mp")
# horn: warm long notes under the strings, then a counter-line
A.hold(hn, R(13, 20), lambda c: tones(c, M("C4"), M("G4"))[0])
for b in R(21, 28):
    ts = tones(PROG[b], M("B3"), M("G4"))
    hn.n(B(b), 8, ts[0]).n(B(b) + 8, 8, ts[1])
hn.dyn(B(13), "p").dyn(B(21), "mp").wedge(B(27), B(29) - 1, "diminuendo")
# timpani: one soft swell into the second theme
ti.n(B(20), 16, "D2", trem=3).n(B(21), 4, "G2"); ti.dyn(B(20), "pp").wedge(B(20), B(21) - 1)

if __name__ == "__main__":
    s.write("out/racelimit-menu-dusk.musicxml"); print("ok")

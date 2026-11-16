# Pause menu — "Pause": very quiet piano + pad + low strings, F major, 72 BPM, 16 bars (~53 s), loops.
from lib2 import *

PROG = {}
layout(PROG, 1, ["Dm7", "Bbmaj7", "Fmaj7", "C7sus"])
layout(PROG, 5, ["Dm7", "Bbmaj7", "Gm7", "C7sus"])
layout(PROG, 9, ["Gm7", "Am7", "Bbmaj7", "C7sus"])
layout(PROG, 13, ["Dm7", "Bbmaj7", "Fmaj7", "C7sus"])
BARS = 16

s = Score("RaceLimit – Pause", BARS, 72, key=-1)
pn, pd = s.add(piano()), s.add(pad())
va, vc = s.add(strings()[2]), s.add(strings()[3])
s.loop = True; B = s.bar; A = Arr(s, PROG)
R = lambda a, b: range(a, b + 1)

# left hand: root, then fifth and tenth
for b in R(1, BARS):
    ch = PROG[b]; r = root(ch, M("C2")); f5 = above(fifth(ch), M(r) + 1); t10 = above(pcs(ch)[1], M(f5) + 1)
    pn.n(B(b), 8, r, staff=2).n(B(b) + 8, 8, [f5, t10], staff=2)
# right hand: soft dyads, the motif once, slowly
DY = lambda c: tones(c, M("A4"), M("F5"))[:2]
A.hold(pn, list(R(1, 4)) + list(R(9, 12)) + list(R(14, 16)), DY)
melody(s, pn, 5, [[(6, "D5"), (2, "A4"), (2, "D5"), (2, "E5"), (4, "F5")], [(16, "D5")], [(6, "Bb4"), (2, "A4"), (8, "G4")], [(16, "F4")]], arts_first=())
pn.n(B(13), 6, "D5").n(B(13) + 6, 2, "A4").n(B(13) + 8, 8, "D5")
pn.dyn(B(1), "p").dyn(B(1), "p", staff=2).words(B(1), "with pedal, slowly")
A.hold(pd, R(1, BARS), lambda c: close(c, M("A4"), 3)); pd.dyn(B(1), "pp")
A.hold(vc, R(5, BARS), lambda c: root(c, M("C2"))); vc.dyn(B(5), "pp")
A.hold(va, R(9, 12), lambda c: tones(c, M("A3"), M("A4"))[-1]); va.dyn(B(9), "pp")

if __name__ == "__main__":
    s.write("out/racelimit-pause.musicxml"); print("ok")

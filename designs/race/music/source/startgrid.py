# Starting grid — "Formation": ceremonial, half-time, C minor, 108 BPM, 32 bars (~1:11), loops until the formation lap.
from lib2 import *

PROG = {}
layout(PROG, 1, ["Cm", "Cm", "Ab", "Bb"])
layout(PROG, 5, ["Cm", "Eb", "Gm", "Bb", "Cm", "Eb", "Fm", "G"])
layout(PROG, 13, ["Ab", "Bb", "Gm", "Cm", "Ab", "Bb", "Fm", "G"])
layout(PROG, 21, ["Cm", "Eb", "Gm", "Bb", "Cm", "Eb", "Fm", "G"])
layout(PROG, 29, ["Cm", "Ab", "Bb", "G"])
BARS = 32
# the motif at half speed: every note twice as long
HN = [
    [(12, "C4"), (4, "G3")],
    [(4, "C4"), (4, "D4"), (8, "Eb4")],
    [(12, "G4"), (4, "Bb4")],
    [(16, "F4")],
    [(12, "C4"), (4, "G3")],
    [(4, "C4"), (4, "D4"), (8, "Eb4")],
    [(8, "F4"), (8, "Ab4")],
    [(16, "G4")],
]
TB = [
    [(12, "C5"), (4, "Eb5")],
    [(12, "D5"), (4, "F5")],
    [(8, "G5"), (8, "D5")],
    [(16, "Eb5")],
    [(12, "C5"), (4, "Eb5")],
    [(8, "F5"), (8, "D5")],
    [(8, "F5"), (8, "Ab5")],
    [(16, "G5")],
]

s = Score("RaceLimit – Formation (Starting Grid)", BARS, 108, key=-3)
hn, tp, tb, ti, dr, gt, bs, pn = s.add(horns()), s.add(trumpets()), s.add(trombones()), s.add(timpani()), s.add(drumset()), s.add(eguitar()), s.add(ebass()), s.add(piano())
v1, v2, va, vc, cb = [s.add(x) for x in strings()]
for b, name in [(1, "Drums"), (5, "Anthem"), (13, "Rise"), (21, "Anthem – full"), (29, "Drums (loop)")]: s.mark(s.bar(b), name)
s.loop = True; B = s.bar; A = Arr(s, PROG)
R = lambda a, b: range(a, b + 1)

# low strings and bass: the march
A.roots(vc, R(1, 32), "F2", acc=(0, 3, 6))
A.hold(cb, R(1, 32), lambda c: root(c, M("E1")))
A.roots(bs, R(5, 28), "E1", other=())
A.ost(va, R(5, 32), "G3", "A4"); A.ost(v2, R(13, 20), "C4", "E5", (2, 1, 3, 1))
A.ost(v2, R(21, 28), "C4", "E5", (2, 1, 3, 1, 2, 1, 3, 1), step=1)
vc.dyn(B(1), "mp").dyn(B(5), "mf").dyn(B(13), "f").dyn(B(21), "ff").dyn(B(29), "mp")
cb.dyn(B(1), "mp").dyn(B(13), "f").dyn(B(29), "mp")
va.dyn(B(5), "mp").dyn(B(13), "f").dyn(B(21), "ff").dyn(B(29), "mp")
v2.dyn(B(13), "f").dyn(B(21), "ff"); bs.dyn(B(5), "mf").dyn(B(13), "f")

# melody
melody(s, hn, 5, HN); hn.dyn(B(5), "mf")
A.hold(hn, R(13, 20), lambda c: tones(c, M("F3"), M("A4"))[-3:-1]); hn.dyn(B(13), "f")
melody(s, hn, 21, HN); hn.dyn(B(21), "ff")
melody(s, tp, 13, TB); melody(s, tp, 21, up(HN)); tp.dyn(B(13), "f").dyn(B(21), "ff")
melody(s, v1, 13, TB); melody(s, v1, 21, up(HN)); v1.dyn(B(13), "f").dyn(B(21), "ff")
A.hold(v1, R(29, 32), lambda c: tones(c, M("C5"), M("C6"))[-1], trem=3); v1.dyn(B(29), "pp")
A.hold(tb, R(5, 12), lambda c: r5(c)); A.hold(tb, R(13, 20), lambda c: r5(c))
A.rhythm(tb, R(21, 28), lambda c: r5(c), [8, 8], arts=(">",))
tb.dyn(B(5), "p").dyn(B(13), "f").dyn(B(21), "ff")

# guitar: big held chords
A.hold(gt, R(13, 28), lambda c: powerchord(c)); gt.words(B(13), "let ring"); gt.dyn(B(13), "mf").dyn(B(21), "f")

# piano: low octaves, high bell-like octaves on the beat
A.hold(pn, R(1, 32), lambda c: octs(c, "C1"), staff=2)
for b in R(5, 28):
    r = root(PROG[b], M("C5"))
    for i in range(4): pn.n(B(b) + 4 * i, 4, [r, above(pcs(PROG[b])[0], M(r) + 1)], arts=("st",))
pn.dyn(B(1), "mp", staff=2).dyn(B(5), "mf").dyn(B(21), "f")

# timpani
for b in R(1, 4): ti.n(B(b), 3, root(PROG[b], M("C2")), arts=(">",)).n(B(b) + 3, 3, root(PROG[b], M("C2"))).n(B(b) + 6, 2, root(PROG[b], M("C2")))
for b in R(29, 31): ti.n(B(b), 3, root(PROG[b], M("C2")), arts=(">",)).n(B(b) + 3, 3, root(PROG[b], M("C2"))).n(B(b) + 6, 2, root(PROG[b], M("C2")))
for b in list(R(5, 11)) + list(R(13, 19)) + list(R(21, 27)):
    ti.n(B(b), 4, root(PROG[b], M("C2")), arts=(">",)).n(B(b) + 8, 4, root(PROG[b], M("C2")))
for b in (12, 20, 28, 32): ti.n(B(b), 16, "G2", trem=3)
ti.dyn(B(1), "f").wedge(B(12), B(13) - 1).wedge(B(20), B(21) - 1).dyn(B(29), "mf")

# drums: half-time, big snare on beat 3
A.groove(dr, R(1, 2), top=None, kick=(), snare=(), extra={0: ["ftom"], 3: ["ftom"], 6: ["ftom"], 8: ["ftom2"], 12: ["ftom2"]})
A.groove(dr, R(3, 4), top=None, kick=(0, 6), snare=(), extra={0: ["ftom"], 3: ["ftom"], 6: ["ftom"], 8: ["ftom2"], 12: ["tom2"], 14: ["tom3"]})
A.groove(dr, R(5, 20), top="ride", step=4, kick=(0, 6, 10), snare=(8,), crash=(5, 9, 13, 15, 17, 19))
A.groove(dr, R(21, 28), top="ride", step=2, kick=(0, 3, 6, 10), snare=(8,), crash=(21, 23, 25, 27))
A.groove(dr, R(29, 32), top=None, kick=(0,), snare=(), extra={0: ["ftom"], 3: ["ftom"], 6: ["ftom"], 8: ["ftom2"], 12: ["ftom2"]})
for b in (12, 20, 28): A.fill(dr, b, 2)
A.fill(dr, 32, 2, seq=["ftom", "ftom", "ftom2", "ftom2", "tom3", "tom3", "tom2", "tom2"])
dr.dyn(B(1), "mf").dyn(B(5), "f").dyn(B(21), "ff").dyn(B(29), "mf")

if __name__ == "__main__":
    s.write("out/racelimit-starting-grid.musicxml"); print("ok")

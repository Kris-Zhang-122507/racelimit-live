# Main menu 2 — "Full Throttle": rock band + strings, E minor, 140 BPM, 36 bars (~1:02), loops.
from lib2 import *

PROG = {}
layout(PROG, 1, ["Em", "Em", "C", "D"])                                   # riff
layout(PROG, 5, ["Em", "C", "G", "D", "Em", "C", "Am", "B"])              # verse
layout(PROG, 13, ["C", "D", "G", "Em", "C", "D", "Am", "B"])              # chorus
layout(PROG, 21, ["Em", "C", "G", "D"])                                   # break
layout(PROG, 25, ["C", "D", "G", "Em", "C", "D", "Am", "B"])              # chorus 2
layout(PROG, 33, ["Em", "C", "D", "B"])                                   # outro -> bar 1
BARS = 36
VERSE = [
    [(6, "E4"), (2, "B3"), (2, "E4"), (2, "F#4"), (4, "G4")],
    [(6, "G4"), (2, "F#4"), (8, "E4")],
    [(6, "G4"), (2, "D4"), (2, "G4"), (2, "A4"), (4, "B4")],
    [(6, "A4"), (2, "G4"), (8, "F#4")],
    [(6, "E4"), (2, "B3"), (2, "E4"), (2, "F#4"), (4, "G4")],
    [(6, "G4"), (2, "A4"), (4, "G4"), (4, "E4")],
    [(6, "A4"), (2, "B4"), (4, "C5"), (2, "B4"), (2, "A4")],
    [(16, "B4")],
]
CHORUS = [
    [(6, "E5"), (2, "D5"), (4, "E5"), (4, "G5")],
    [(6, "F#5"), (2, "E5"), (4, "D5"), (4, "A4")],
    [(6, "D5"), (2, "B4"), (8, "G4")],
    [(16, "E5")],
    [(6, "E5"), (2, "D5"), (4, "E5"), (4, "G5")],
    [(6, "A5"), (2, "G5"), (4, "F#5"), (4, "D5")],
    [(6, "E5"), (2, "C5"), (4, "E5"), (4, "A5")],
    [(12, "F#5"), (4, "D#5")],
]
BREAK = [
    [(6, "E5"), (2, "B4"), (2, "E5"), (2, "F#5"), (4, "G5")],
    [(16, "E5")],
    [(6, "G5"), (2, "D5"), (2, "G5"), (2, "A5"), (4, "B5")],
    [(16, "A5")],
]

s = Score("RaceLimit – Full Throttle", BARS, 140, key=1)
ld, rg, bs, dr, pn = s.add(lead_gtr()), s.add(rhythm_gtr()), s.add(ebass()), s.add(drumset()), s.add(piano())
v1, v2, va, vc, cb = [s.add(x) for x in strings()]
for b, name in [(1, "Riff"), (5, "Verse"), (13, "Chorus"), (21, "Break"), (25, "Chorus 2"), (33, "Outro")]: s.mark(s.bar(b), name)
s.loop = True; B = s.bar; A = Arr(s, PROG)
R = lambda a, b: range(a, b + 1)
VERSEY = list(R(1, 12)) + list(R(33, 36))
CHORUSY = list(R(13, 20)) + list(R(25, 32))

# rhythm guitar: palm-muted 3-3-2 accents in verses, big open chords in choruses
for b in VERSEY:
    pc = powerchord(PROG[b], full=False)
    for i in range(8): rg.n(B(b) + 2 * i, 2, pc, arts=(">",) if i in (0, 3, 6) else ())
A.rhythm(rg, CHORUSY, lambda c: powerchord(c), [6, 6, 4], arts=(">",))
A.hold(rg, R(21, 24), lambda c: powerchord(c))
rg.words(B(1), "palm mute").words(B(13), "open").words(B(21), "let ring").words(B(25), "open").words(B(33), "palm mute")
rg.dyn(B(1), "mf").dyn(B(13), "f").dyn(B(21), "mp").dyn(B(25), "f").dyn(B(33), "mf")

# lead guitar: the motif in the verse, the chorus tune an octave under the violins
melody(s, ld, 5, VERSE); melody(s, ld, 25, up(CHORUS, -1))
ld.dyn(B(5), "f").dyn(B(25), "f")

# bass
A.roots(bs, [b for b in R(1, 36) if not 21 <= b <= 24 and b > 2], "E1", other=())
A.hold(bs, R(21, 24), lambda c: root(c, M("E1")))
bs.dyn(B(3), "mf").dyn(B(13), "f").dyn(B(21), "mp").dyn(B(25), "f").dyn(B(33), "mf")

# drums
for i in range(4): dr.n(B(3) + 4 * i, 4, ["kick", "ftom"])
for i in range(8): dr.n(B(4) + 2 * i, 2, ["snare"] + (["kick"] if i % 2 == 0 else []))
A.groove(dr, R(5, 12), kick=(0, 6, 8, 10), snare=(4, 12), crash=(5, 9))
A.groove(dr, R(13, 20), top="ride", kick=(0, 3, 6, 8, 10), snare=(4, 12), crash=(13, 15, 17, 19))
A.groove(dr, R(21, 24), top="hh", step=4, kick=(0, 10), snare=(8,), crash=(21,))
A.groove(dr, R(25, 32), top="ride", kick=(0, 3, 6, 8, 10), snare=(4, 12), crash=(25, 27, 29, 31))
A.groove(dr, R(33, 36), kick=(0, 6, 8, 10), snare=(4, 12), crash=(33,))
for b in (12, 20, 32, 36): A.fill(dr, b, 2)
A.fill(dr, 24, 1, seq=["snare"] * 12)
dr.dyn(B(3), "mf").dyn(B(5), "f").dyn(B(21), "mp").wedge(B(24), B(25) - 1).dyn(B(25), "ff").dyn(B(33), "f")

# piano: off-beat stabs in verses, chords in choruses, the motif in the break
for b in R(5, 12):
    for i in range(4): pn.n(B(b) + 4 * i + 2, 2, tri(PROG[b], "E5"), arts=("st",))
A.rhythm(pn, CHORUSY, lambda c: close(c, M("B5"), 4), [4, 4, 4, 4])
melody(s, pn, 21, BREAK, arts_first=())
A.hold(pn, list(R(9, 24)) + list(R(25, 32)), lambda c: octs(c), staff=2)
pn.dyn(B(5), "mf").dyn(B(13), "f").dyn(B(21), "mp").dyn(B(25), "f")
pn.dyn(B(9), "mf", staff=2)

# strings
A.hold(va, R(5, 12), lambda c: tones(c, M("G3"), M("D4"))[-1]); A.hold(vc, R(5, 12), lambda c: root(c, M("E2")))
A.hold(v2, R(9, 12), lambda c: tones(c, M("D4"), M("A4"))[-1])
melody(s, v1, 13, CHORUS); melody(s, v1, 25, CHORUS)
for rng in (R(13, 20), R(25, 32)):
    A.ost(v2, rng, "C4", "E5", (2, 1, 3, 1)); A.ost(va, rng, "G3", "A4"); A.roots(vc, rng, "E2"); A.hold(cb, rng, lambda c: root(c, M("E1")))
for p, lo, hi in ((v1, "B4", "B5"), (v2, "E4", "E5"), (va, "G3", "G4"), (vc, "E2", "E3")):
    A.hold(p, R(21, 24), lambda c, lo=lo, hi=hi: tones(c, M(lo), M(hi))[-1], trem=3)
A.hold(cb, R(21, 24), lambda c: root(c, M("E1")))
for p in (v1, v2, va, vc): p.dyn(B(21), "pp"); p.wedge(B(23), B(25) - 1)
va.dyn(B(5), "p"); vc.dyn(B(5), "p"); v2.dyn(B(9), "p")
for p in (v1, v2, va, vc, cb): p.dyn(B(13), "f"); p.dyn(B(25), "ff")
cb.dyn(B(21), "pp")

if __name__ == "__main__":
    s.write("out/racelimit-menu-full-throttle.musicxml"); print("ok")

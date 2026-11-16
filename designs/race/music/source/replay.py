# Replays / highlights — "Replay": upbeat funk-rock with brass, A major, 132 BPM, 32 bars (~58 s), loops.
from lib2 import *

PROG = {}
layout(PROG, 1, ["A", "D", "F#m", "E"])
layout(PROG, 5, ["A", "D", "F#m", "E", "A", "D", "F#m", "E"])
layout(PROG, 13, ["D", "E", "C#m", "F#m", "D", "E", "Bm", "E"])
layout(PROG, 21, ["A", "D", "F#m", "E", "A", "D", "F#m", "E"])
layout(PROG, 29, ["A", "D", "F#m", "E"])
BARS = 32
TA = [
    [(6, "A4"), (2, "E4"), (2, "A4"), (2, "B4"), (4, "C#5")],
    [(6, "D5"), (2, "C#5"), (8, "A4")],
    [(6, "C#5"), (2, "A4"), (2, "C#5"), (2, "D5"), (4, "E5")],
    [(6, "E5"), (2, "D5"), (8, "B4")],
    [(6, "A4"), (2, "E4"), (2, "A4"), (2, "B4"), (4, "C#5")],
    [(6, "F#5"), (2, "E5"), (4, "D5"), (4, "A4")],
    [(6, "C#5"), (2, "E5"), (8, "F#5")],
    [(16, "E5")],
]
PB = [
    [(4, "F#5"), (4, "A5"), (4, "F#5"), (4, "D5")],
    [(6, "E5"), (2, "G#5"), (8, "B5")],
    [(6, "C#5"), (2, "E5"), (8, "G#5")],
    [(16, "F#5")],
    [(4, "F#5"), (4, "A5"), (4, "F#5"), (4, "D5")],
    [(6, "E5"), (2, "G#5"), (8, "B5")],
    [(6, "D5"), (2, "F#5"), (8, "B5")],
    [(8, "B5"), (8, "G#5")],
]

s = Score("RaceLimit – Replay", BARS, 132, key=3)
tp, tb, dr, gt, bs, pn = s.add(trumpets()), s.add(trombones()), s.add(drumset()), s.add(clean_gtr()), s.add(ebass()), s.add(piano())
for b, name in [(1, "Groove"), (5, "Horns"), (13, "Bridge"), (21, "Horns 2"), (29, "Groove (loop)")]: s.mark(s.bar(b), name)
s.loop = True; B = s.bar; A = Arr(s, PROG)
R = lambda a, b: range(a, b + 1)

# rhythm section
A.groove(dr, R(1, 32), top="hh", step=1, kick=(0, 6, 10), snare=(4, 12), crash=(5, 13, 17, 21))
for b in (4, 12, 20, 28, 32): A.fill(dr, b, 3, seq=["snare", "tom1", "tom2", "ftom"])
dr.dyn(B(1), "mf").dyn(B(5), "f")
for b in R(1, 32):
    ch = PROG[b]; r = root(ch, M("E1")); r8 = above(pcs(ch)[0], M(r) + 1); f5 = above(fifth(ch), M(r) + 1)
    bs.seq(B(b), [(3, r, {"arts": (">",)}), (1, r), (2, r8), (2, r), (2, f5), (2, r), (4, r)])
bs.dyn(B(1), "f")
for b in R(1, 32):
    for p in (2, 6, 10, 14): gt.n(B(b) + p, 2, tri(PROG[b], "A4"), arts=("st",))
gt.words(B(1), "muted chops").dyn(B(1), "mf")

# horns: the motif, bright
melody(s, tp, 5, TA); melody(s, tp, 21, TA)
melody(s, tb, 21, up(TA, -1))
tp.dyn(B(5), "f").dyn(B(21), "f"); tb.dyn(B(21), "f")
for b in R(13, 20):   # bridge: horn stabs
    hi = tones(PROG[b], M("C#5"), M("A5"))[-2:]
    for p in (0, 6, 10): tp.n(B(b) + p, 2, hi, arts=("^",)); tb.n(B(b) + p, 2, r5(PROG[b]), arts=("^",))
tb.dyn(B(13), "f")
for b in R(5, 12): tb.n(B(b), 16, r5(PROG[b]))
tb.dyn(B(5), "mp")

# piano: the bridge tune, then doubling the horns an octave up
melody(s, pn, 13, PB, arts_first=()); melody(s, pn, 21, up(TA), arts_first=())
A.hold(pn, R(13, 28), lambda c: octs(c), staff=2)
pn.dyn(B(13), "f").dyn(B(21), "mf").dyn(B(13), "f", staff=2)

if __name__ == "__main__":
    s.write("out/racelimit-replay.musicxml"); print("ok")

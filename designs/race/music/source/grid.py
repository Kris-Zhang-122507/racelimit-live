# 3. Pre-race / loading — D minor, 126 BPM, 32 bars (~1:01): ticking tension, a peak, then settles and loops.
from mx import *
from common import *

PROG = {}
layout(PROG, 1, ["Dm", "Dm", "Eb", "Dm", "Dm", "Dm", "Bb", "A"])        # tension (over a low D)
layout(PROG, 9, ["Dm", "Bb", "Gm", "Eb", "Dm", "Bb", "C", "A"])         # pulse
layout(PROG, 17, ["Dm", "Bb", "Gm", "Eb", "Dm", "Bb", "Eb", "A"])       # peak
layout(PROG, 25, ["Dm", "Dm", "Eb", "Dm", "Dm", "Dm", "Bb", "A"])       # settle -> loops
BARS = 32
PEDAL = set(range(1, 9)) | set(range(25, 33))

HN = [
    [(6, "D4"), (2, "A3"), (2, "D4"), (2, "E4"), (4, "F4")],
    [(16, "D4")],
    [(6, "G4"), (2, "D4"), (2, "G4"), (2, "A4"), (4, "Bb4")],
    [(16, "G4")],
    [(6, "D4"), (2, "A3"), (2, "D4"), (2, "E4"), (4, "F4")],
    [(8, "F4"), (8, "D4")],
    [(6, "G4"), (2, "E4"), (2, "G4"), (2, "A4"), (4, "G4")],
    [(8, "E4"), (8, "C#4")],
]
PEAK = HN[:6] + [[(16, "G4")], [(8, "E4"), (8, "C#4")]]

s = Score("RaceLimit – Loading", BARS, 126, key=-1)
hn, tb, ti, dr, bs, pn = s.add(horns()), s.add(trombones()), s.add(timpani()), s.add(drumset()), s.add(ebass()), s.add(piano())
v1, v2, va, vc, cb = [s.add(x) for x in strings()]
for b, name in [(1, "Tension"), (9, "Pulse"), (17, "Peak"), (25, "Settle")]: s.mark(s.bar(b), name)
B = s.bar
s.loop = True

# ---- strings: the ticking machine ----
for b in range(1, BARS + 1):
    ch = PROG[b]; t = B(b)
    lo = tones(ch, M("D3"), M("D4")); hi = tones(ch, M("A3"), M("A4"))
    for i in range(16): va.n(t + i, 1, lo[[0, 2, 1, 2][i % 4] % len(lo)], arts=("st",))
    if b >= 5:
        for i in range(16): v2.n(t + i, 1, hi[[0, 1, 2, 1][i % 4] % len(hi)], arts=("st",))
    r = "D3" if b in PEDAL else root(ch, M("F2"))
    for i in range(8): vc.n(t + 2 * i, 2, r, arts=(">",) if i in (0, 3, 6) else ("st",))
    cb.n(t, 16, "D2" if b in PEDAL else root(ch, M("E1")))
va.dyn(B(1), "p").dyn(B(9), "mf").dyn(B(17), "f").dyn(B(25), "mf").wedge(B(29), B(33) - 1, "diminuendo")
v2.dyn(B(5), "p").dyn(B(9), "mf").dyn(B(17), "f").dyn(B(25), "mf").wedge(B(29), B(33) - 1, "diminuendo")
vc.dyn(B(1), "p").dyn(B(9), "mf").dyn(B(17), "f").dyn(B(25), "mf").wedge(B(29), B(33) - 1, "diminuendo")
cb.dyn(B(1), "p").dyn(B(9), "mf").dyn(B(17), "f").dyn(B(25), "mp")
va.words(B(1), "spiccato"); v2.words(B(5), "spiccato")
for b in range(9, 17): v1.n(B(b), 16, tones(PROG[b], M("D5"), M("D6"))[-1], trem=3)
v1.dyn(B(9), "pp").wedge(B(13), B(17) - 1)
melody(s, v1, 17, up(PEAK)); v1.dyn(B(17), "ff")
for b in range(25, 33): v1.n(B(b), 16, "D6" if b < 32 else "A5", trem=3)
v1.dyn(B(25), "p").wedge(B(29), B(33) - 1, "diminuendo")

# ---- brass ----
melody(s, hn, 5, [[(6, "D4"), (2, "A3"), (2, "D4"), (2, "E4"), (4, "F4")], [(16, "D4")], [(16, "D4")], [(16, "C#4")]])
hn.dyn(B(5), "p").words(B(5), "distant")
melody(s, hn, 9, HN); hn.dyn(B(9), "mf")
melody(s, hn, 17, PEAK); hn.dyn(B(17), "ff")
for b in range(25, 29): hn.n(B(b), 16, tones(PROG[b], M("D4"), M("G4"))[:2])
hn.dyn(B(25), "p").wedge(B(25), B(29) - 1, "diminuendo")
for b in range(13, 25):
    r = root(PROG[b], M("E2")); tb.n(B(b), 16, [r, above(fifth(PROG[b]), M(r) + 1)])
tb.dyn(B(13), "p").wedge(B(13), B(17) - 1).dyn(B(17), "f")

# ---- timpani: a heartbeat ----
for b in range(1, BARS + 1):
    if b in PEDAL: ti.n(B(b), 3, "D2", arts=(">",)).n(B(b) + 3, 1, "D2")
    elif b in (16, 24): ti.n(B(b), 16, "A2", trem=3)
    else: ti.n(B(b), 3, root(PROG[b], M("D2")), arts=(">",)).n(B(b) + 3, 1, root(PROG[b], M("D2"))).n(B(b) + 8, 4, root(PROG[b], M("D2")))
ti.dyn(B(1), "p").dyn(B(9), "mf").wedge(B(16), B(17) - 1).dyn(B(17), "f").dyn(B(25), "p")

# ---- drums ----
for b in range(1, BARS + 1):
    t = B(b)
    for i in range(16):
        x = ["hh"] if (i % 2 == 0 or b >= 9) else []
        if b in PEDAL:
            x = ["hh"]
            if i in (0, 3): x.append("kick")
        elif b < 17:
            if i in (0, 3, 8): x.append("kick")
            if i == 4: x.append("tom2")
            if i in (10, 12, 14): x.append("ftom")
        else:
            if i in (0, 3, 8, 11): x.append("kick")
            if i in (4, 12): x.append("snare")
            if i == 0 and b in (17, 21): x = ["crash", "kick"]
        dr.n(t + i, 1, x)
kill(dr, B(24) + 8, B(25))
for i in range(8): dr.n(B(24) + 8 + i, 1, ["snare"] + (["kick"] if i % 4 == 0 else []))
dr.dyn(B(1), "pp").dyn(B(9), "mp").dyn(B(17), "f").dyn(B(25), "pp")
dr.wedge(B(24) + 8, B(25) - 1, "diminuendo")

# ---- bass ----
for b in range(9, 25):
    r = root(PROG[b], M("E1"))
    for i in range(8 if b < 17 else 16):
        n = 2 if b < 17 else 1
        bs.n(B(b) + n * i, n, r)
for b in range(25, 29): bs.n(B(b), 16, "D2")
bs.dyn(B(9), "mf").dyn(B(17), "f").dyn(B(25), "p")

# ---- piano: a clock, then the pulse ----
for b in sorted(PEDAL):
    for i in range(4): pn.n(B(b) + 4 * i, 4, {"Eb": "Eb6", "A": "C#6"}.get(PROG[b], "D6"), arts=("st",))
    if b % 2: pn.n(B(b), 16, ["D1", "D2"], staff=2)
for b in range(9, 25):
    ch = PROG[b]; r = root(ch, M("G4")); notes = [r, above(fifth(ch), M(r) + 1), above(pcs(ch)[0], M(r) + 1)]
    for i in range(8): pn.n(B(b) + 2 * i, 2, notes[[0, 1, 2, 1][i % 4]], arts=("st",))
    pn.n(B(b), 16, [root(ch, M("C2")), root(ch, M("C3"))], staff=2)
pn.dyn(B(1), "p").dyn(B(9), "mf").dyn(B(17), "f").dyn(B(25), "p")
pn.dyn(B(1), "p", staff=2).dyn(B(9), "mf", staff=2)

if __name__ == "__main__":
    s.write("out/racelimit-loading.musicxml"); print("ok")

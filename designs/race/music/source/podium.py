# 4. Results + podium — D major (the main theme's motif turned major), 100 BPM, 24 bars (~1:00 + held chord)
# 5. Win sting — the same motif as a 5-bar fanfare (~11 s)
from mx import *
from common import *

def orchestra(title, bars, bpm):
    s = Score(title, bars, bpm, key=2)
    P = dict(hn=s.add(horns()), tp=s.add(trumpets()), tb=s.add(trombones()), ti=s.add(timpani()), gl=s.add(glock()),
             dr=s.add(drumset()), gt=s.add(eguitar()), bs=s.add(ebass()), pn=s.add(piano()))
    for k, p in zip(("v1", "v2", "va", "vc", "cb"), strings()): P[k] = s.add(p)
    return s, P

def drive(s, P, PROG, b, level="A"):
    """strings ostinato, low drive, guitar, bass, piano chords for one bar"""
    ch, t = PROG[b], s.bar(b)
    lo = tones(ch, M("G3"), M("A4")); hi = tones(ch, M("C4"), M("E5"))
    for i in range(8): P["va"].n(t + 2 * i, 2, lo[[0, 1, 2, 1][i % 4] % len(lo)], arts=("st",))
    for i in range(8): P["v2"].n(t + 2 * i, 2, hi[[2, 1, 3, 1][i % 4] % len(hi)], arts=("st",))
    for i in range(8): P["vc"].n(t + 2 * i, 2, root(ch, M("F2")), arts=(">",) if i in (0, 3) else ("st",))
    P["cb"].n(t, 16, root(ch, M("E1")))
    for i in range(8): P["bs"].n(t + 2 * i, 2, root(ch, M("E1")), arts=(">",) if i in (0, 3) else ())
    pc = powerchord(ch)
    for d in (6, 6, 4): P["gt"].n(t, d, pc, arts=(">",)); t += d
    t = s.bar(b)
    v = close(ch, M("A5"), 4)
    for i in range(4): P["pn"].n(t + 4 * i, 4, v, arts=(">",) if i == 0 else ())
    r = root(ch, M("C2")); P["pn"].n(t, 16, [r, root(ch, M("C3"))], staff=2)

def groove(s, P, b, top="ride", crash=False, kick=(0, 6, 8, 10)):
    for i in range(8):
        x = ["crash"] if (crash and i == 0) else [top]
        if 2 * i in kick: x.append("kick")
        if 2 * i in (4, 12): x.append("snare")
        P["dr"].n(s.bar(b) + 2 * i, 2, x)

def fill(s, P, b, beat=2):
    t = s.bar(b) + beat * 4
    kill(P["dr"], t, s.bar(b + 1))
    for i, x in enumerate(["snare", "snare", "tom1", "tom1", "tom2", "tom2", "ftom", "ftom"][-(16 - beat * 4):]):
        P["dr"].n(t + i, 1, [x] + (["kick"] if i % 4 == 0 else []))

# ===================================== PODIUM =====================================
PROG = {}
layout(PROG, 1, ["G", "A", "Bm", "A"])
layout(PROG, 5, ["D", "G", "Bm", "A", "D", "G", "Em", "A"])
layout(PROG, 13, ["G", "A", "F#m", "Bm", "G", "A", "G", "A"])
layout(PROG, 21, ["D", "A", "D", "D"])
BARS = 24
ANTH = [
    [(6, "D4"), (2, "A3"), (2, "D4"), (2, "E4"), (4, "F#4")],
    [(6, "G4"), (2, "F#4"), (8, "D4")],
    [(6, "F#4"), (2, "D4"), (2, "F#4"), (2, "A4"), (4, "B4")],
    [(6, "A4"), (2, "G4"), (8, "E4")],
    [(6, "D4"), (2, "A3"), (2, "D4"), (2, "E4"), (4, "F#4")],
    [(6, "B4"), (2, "A4"), (4, "G4"), (4, "D4")],
    [(6, "G4"), (2, "A4"), (4, "B4"), (2, "A4"), (2, "G4")],
    [(16, "A4")],
]
ANTH_B = [
    [(6, "D5"), (2, "B4"), (4, "D5"), (4, "G5")],
    [(6, "E5"), (2, "D5"), (4, "C#5"), (4, "A4")],
    [(6, "A4"), (2, "C#5"), (8, "F#5")],
    [(6, "F#5"), (2, "E5"), (8, "D5")],
    [(6, "D5"), (2, "B4"), (4, "D5"), (4, "G5")],
    [(6, "A5"), (2, "G5"), (4, "E5"), (4, "C#5")],
    [(4, "B4"), (4, "D5"), (8, "G5")],
    [(12, "A5"), (4, None)],
]
FIN = [[(6, "D5"), (2, "A4"), (2, "D5"), (2, "E5"), (4, "F#5")], [(8, "E5"), (8, "C#5")]]

s, P = orchestra("RaceLimit – Podium", BARS, 100)
B = s.bar
for b, name in [(1, "Build"), (5, "Anthem"), (13, "Anthem – higher"), (21, "Finish")]: s.mark(B(b), name)
hn, tp, tb, ti, gl, dr, gt, bs, pn, v1, v2, va, vc, cb = [P[k] for k in ("hn", "tp", "tb", "ti", "gl", "dr", "gt", "bs", "pn", "v1", "v2", "va", "vc", "cb")]

# build: tremolo strings, rolls, everything swelling into bar 5
for b in range(1, 5):
    ch = PROG[b]
    v1.n(B(b), 16, tones(ch, M("D5"), M("D6"))[-1], trem=3); v2.n(B(b), 16, tones(ch, M("G4"), M("G5"))[-1], trem=3)
    va.n(B(b), 16, tones(ch, M("D4"), M("D5"))[0], trem=3); vc.n(B(b), 16, root(ch, M("F2")), trem=3); cb.n(B(b), 16, root(ch, M("E1")), trem=3)
    bs.n(B(b), 16, root(ch, M("E1")))
    if b >= 3:
        hn.n(B(b), 16, tones(ch, M("F3"), M("A4"))[-3:-1]); tb.n(B(b), 16, [root(ch, M("E2")), above(fifth(ch), M(root(ch, M("E2"))) + 1)])
        gt.n(B(b), 16, powerchord(ch))
    pn.n(B(b), 16, [root(ch, M("C2")), root(ch, M("C3"))], staff=2)
for p in (v1, v2, va, vc, cb): p.dyn(B(1), "p").wedge(B(1), B(5) - 1)
for p in (hn, tb, gt): p.dyn(B(3), "p").wedge(B(3), B(5) - 1)
bs.dyn(B(1), "mp").wedge(B(3), B(5) - 1)
pn.dyn(B(1), "mp", staff=2)
ti.n(B(3), 16, "F#2", trem=3).n(B(4), 16, "A2", trem=3); ti.dyn(B(3), "pp").wedge(B(3), B(5) - 1)
for i in range(8): dr.n(B(3) + 2 * i, 2, ["snare"])
for i in range(16): dr.n(B(4) + i, 1, ["snare"] + (["kick"] if i % 4 == 0 else []))
dr.dyn(B(3), "p").wedge(B(3), B(5) - 1)

# anthem
for b in range(5, 21): drive(s, P, PROG, b, "A" if b < 13 else "B")
for b in range(5, 21): groove(s, P, b, top="hh" if b < 13 else "ride", crash=b in (5, 9, 13, 15, 17, 19))
fill(s, P, 12); fill(s, P, 20)
melody(s, hn, 5, ANTH); melody(s, gl, 5, up(ANTH, 2), slur=False, arts_first=())
melody(s, v1, 5, up(ANTH)); v1.dyn(B(5), "f")
for b in range(5, 13):
    r = root(PROG[b], M("E2")); tb.n(B(b), 16, [r, above(fifth(PROG[b]), M(r) + 1)])
for b in range(13, 21): hn.n(B(b), 16, tones(PROG[b], M("F3"), M("A4"))[-3:-1])
melody(s, tp, 13, ANTH_B); melody(s, v1, 13, ANTH_B); melody(s, gl, 13, up(ANTH_B), slur=False, arts_first=())
for b in range(13, 21):
    r = root(PROG[b], M("E2")); tb.n(B(b), 8, [r, above(fifth(PROG[b]), M(r) + 1)], arts=(">",)).n(B(b) + 8, 8, [r, above(fifth(PROG[b]), M(r) + 1)], arts=(">",))
for b in range(5, 21):
    ti.n(B(b), 4, root(PROG[b], M("D2")), arts=(">",))
    if b >= 13: ti.n(B(b) + 8, 4, root(PROG[b], M("D2")))
for p, m in ((hn, "f"), (gl, "mf"), (tb, "mf"), (ti, "f"), (dr, "f"), (gt, "f"), (bs, "f"), (pn, "f"), (va, "f"), (vc, "f"), (cb, "f")): p.dyn(B(5), m)
pn.dyn(B(5), "f", staff=2)
for p in (tp, v1, v2, tb, dr, va, vc, cb, hn): p.dyn(B(13), "ff")

# finish: the motif in everyone, then a held D major chord
for p, mel in ((tp, FIN), (v1, FIN), (hn, up(FIN, -1)), (gl, up(FIN, 1))):
    melody(s, p, 21, mel, slur=p is not gl, arts_first=(">",) if p is not gl else ())
DCH = {"hn": ["D4", "F#4"], "tp": ["A4", "D5"], "tb": ["D2", "A2", "D3"], "v1": ["D5", "A5", "D6"], "v2": ["F#4", "A4", "D5"], "va": ["A3", "D4", "F#4"],
       "vc": ["D2", "A2", "D3"], "cb": ["D2"], "gt": powerchord("D"), "bs": ["D2"], "gl": ["D6"]}
for b in (21, 22):
    ch = PROG[b]
    for i in range(8):
        vc.n(B(b) + 2 * i, 2, root(ch, M("F2")), arts=(">",) if i in (0, 3) else ())
        bs.n(B(b) + 2 * i, 2, root(ch, M("E1")))
        gt.n(B(b) + 2 * i, 2, powerchord(ch))
        v2.n(B(b) + 2 * i, 2, tones(ch, M("C4"), M("E5"))[[2, 1, 3, 1][i % 4]], arts=("st",))
        va.n(B(b) + 2 * i, 2, tones(ch, M("G3"), M("A4"))[[0, 1, 2, 1][i % 4]], arts=("st",))
    cb.n(B(b), 16, root(ch, M("E1"))); tb.n(B(b), 16, [root(ch, M("E2")), above(fifth(ch), M(root(ch, M("E2"))) + 1)])
    v = close(ch, M("A5"), 4)
    for i in range(4): pn.n(B(b) + 4 * i, 4, v)
    pn.n(B(b), 16, [root(ch, M("C2")), root(ch, M("C3"))], staff=2)
    groove(s, P, b, crash=b == 21)
    ti.n(B(b), 4, root(ch, M("D2")), arts=(">",)).n(B(b) + 8, 4, root(ch, M("D2")))
fill(s, P, 22)
for k, notes in DCH.items(): P[k].n(B(23), 32, notes, arts=("^",), fermata=True)
pn.n(B(23), 32, ["D5", "F#5", "A5", "D6"], arts=("^",), fermata=True).n(B(23), 32, ["D2", "D3"], staff=2, fermata=True)
ti.n(B(23), 32, "D2", trem=3, fermata=True); dr.n(B(23), 4, ["crash", "kick"]); dr.n(B(23) + 4, 28, ["crash2"], fermata=True)
for p in P.values(): p.dyn(B(23), "ff")

# ===================================== WIN STING =====================================
WP = {1: "A", 2: "D", 3: "G", 4: "A", 5: "D"}
w, Q = orchestra("RaceLimit – Win Sting", 5, 112)
W = w.bar
roll_ch = "A"
for k, notes in (("v1", ["A5"]), ("v2", ["C#5", "E5"]), ("va", ["A3", "E4"]), ("vc", ["A2"]), ("cb", ["A1"])):
    Q[k].n(W(1), 16, notes, trem=3); Q[k].dyn(W(1), "p"); Q[k].wedge(W(1), W(2) - 1)
Q["hn"].n(W(1), 16, ["C#4", "E4"]); Q["tb"].n(W(1), 16, ["A2", "E3"]); Q["bs"].n(W(1), 16, "A1")
for k in ("hn", "tb", "bs"): Q[k].dyn(W(1), "p").wedge(W(1), W(2) - 1)
Q["ti"].n(W(1), 16, "A2", trem=3); Q["ti"].dyn(W(1), "pp").wedge(W(1), W(2) - 1)
for i in range(16): Q["dr"].n(W(1) + i, 1, ["snare"] + (["kick"] if i % 4 == 0 else []))
Q["dr"].dyn(W(1), "p").wedge(W(1), W(2) - 1)
FAN = [[(6, "D5"), (2, "A4"), (2, "D5"), (2, "E5"), (4, "F#5")], [(6, "G5"), (2, "F#5"), (8, "D5")], [(8, "E5"), (8, "C#5")]]
for k, mel in (("tp", FAN), ("v1", FAN), ("hn", up(FAN, -1)), ("gl", up(FAN, 1))):
    melody(w, Q[k], 2, mel, slur=k != "gl", arts_first=(">",) if k != "gl" else ())
for b in (2, 3, 4):
    ch = WP[b]
    for i in range(8):
        Q["vc"].n(W(b) + 2 * i, 2, root(ch, M("F2")), arts=(">",) if i in (0, 3) else ())
        Q["bs"].n(W(b) + 2 * i, 2, root(ch, M("E1")))
        Q["gt"].n(W(b) + 2 * i, 2, powerchord(ch))
        Q["va"].n(W(b) + 2 * i, 2, tones(ch, M("G3"), M("A4"))[[0, 1, 2, 1][i % 4]], arts=("st",))
        Q["v2"].n(W(b) + 2 * i, 2, tones(ch, M("C4"), M("E5"))[[2, 1, 3, 1][i % 4]], arts=("st",))
    Q["cb"].n(W(b), 16, root(ch, M("E1"))); Q["tb"].n(W(b), 16, [root(ch, M("E2")), above(fifth(ch), M(root(ch, M("E2"))) + 1)])
    v = close(ch, M("A5"), 4)
    for i in range(4): Q["pn"].n(W(b) + 4 * i, 4, v)
    Q["pn"].n(W(b), 16, [root(ch, M("C2")), root(ch, M("C3"))], staff=2)
    groove(w, Q, b, crash=b == 2)
    Q["ti"].n(W(b), 4, root(ch, M("D2")), arts=(">",))
fill(w, Q, 4)
for k, notes in DCH.items(): Q[k].n(W(5), 16, notes, arts=("^",), fermata=True)
Q["pn"].n(W(5), 16, ["D5", "F#5", "A5", "D6"], arts=("^",), fermata=True).n(W(5), 16, ["D2", "D3"], staff=2, fermata=True)
Q["ti"].n(W(5), 16, "D2", trem=3, fermata=True); Q["dr"].n(W(5), 16, ["crash", "kick"], fermata=True)
for p in Q.values(): p.dyn(W(2), "f")
for p in Q.values(): p.dyn(W(5), "ff")
Q["pn"].dyn(W(2), "f", staff=2)

if __name__ == "__main__":
    s.write("out/racelimit-podium.musicxml"); w.write("out/racelimit-win-sting.musicxml"); print("ok")

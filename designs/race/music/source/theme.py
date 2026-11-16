# 1. Main menu theme — D minor, 120 BPM, 44 bars (~1:28), loops: the last bar (A major) leads back into bar 1.
from mx import *
from th import *

PROG = {}
def lay(start, chords):
    for i, c in enumerate(chords): PROG[start + i] = c
lay(1, ["Dm", "Dm", "Bb", "C"])                                   # Intro
lay(5, ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"])             # Theme
lay(13, ["Bb", "C", "Am", "Dm", "Bb", "C", "Gm", "A"])            # Lift
lay(21, ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"])            # Breakdown
lay(29, ["Bb", "C", "Dm", "A"])                                   # Build
lay(33, ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"])            # Theme, full
lay(41, ["Dm", "Dm", "Bb", "A"])                                  # Outro -> loops to bar 1
BARS = 44

# The RaceLimit motif: long-short-short-short-long, a 4th down then climbing (bar 1 of MEL_A)
MEL_A = [
    [(6, "D4"), (2, "A3"), (2, "D4"), (2, "E4"), (4, "F4")],
    [(6, "F4"), (2, "E4"), (8, "D4")],
    [(6, "F4"), (2, "C4"), (2, "F4"), (2, "G4"), (4, "A4")],
    [(6, "G4"), (2, "F4"), (8, "E4")],
    [(6, "D4"), (2, "A3"), (2, "D4"), (2, "E4"), (4, "F4")],
    [(6, "F4"), (2, "G4"), (4, "F4"), (4, "D4")],
    [(6, "G4"), (2, "A4"), (4, "Bb4"), (2, "A4"), (2, "G4")],
    [(16, "A4")],
]
MEL_B = [
    [(6, "D5"), (2, "C5"), (4, "D5"), (4, "F5")],
    [(6, "E5"), (2, "D5"), (4, "C5"), (4, "G4")],
    [(6, "C5"), (2, "D5"), (8, "E5")],
    [(6, "F5"), (2, "E5"), (8, "D5")],
    [(6, "D5"), (2, "C5"), (4, "D5"), (4, "F5")],
    [(6, "G5"), (2, "F5"), (4, "E5"), (4, "C5")],
    [(4, "D5"), (4, "G5"), (8, "Bb5")],
    [(12, "A5"), (2, "G5"), (2, "E5")],
]

def up(mel, octs=1):
    from mx import transpose
    return [[(d, transpose(p, 7 * octs, 12 * octs)) for d, p in bar] for bar in mel]

def melody(part, bar0, mel, slur=True, arts_first=(">",)):
    for i, bar in enumerate(mel):
        t = s.bar(bar0 + i)
        for j, (d, p) in enumerate(bar):
            kw = {}
            if slur and j == 0: kw["slur"] = "start"
            if slur and j == len(bar) - 1: kw["slur"] = "stop"
            if j == 0 and arts_first: kw["arts"] = arts_first
            if len(bar) == 1: kw.pop("slur", None)
            part.n(t, d, p, **kw); t += d

s = Score("RaceLimit – Main Theme", BARS, 120, key=-1, subtitle="Main menu · loops from the last bar back to bar 1")
hn, tp, tb, ti = s.add(horns()), s.add(trumpets()), s.add(trombones()), s.add(timpani())
dr, gt, bs, pn = s.add(drumset()), s.add(eguitar()), s.add(ebass()), s.add(piano())
v1, v2, va, vc, cb = [s.add(x) for x in strings()]
for b, name in [(1, "Intro"), (5, "Theme"), (13, "Lift"), (21, "Breakdown"), (29, "Build"), (33, "Theme – full"), (41, "Outro")]:
    s.mark(s.bar(b), name)
B = s.bar
s.loop = True
SEC = lambda b: "intro" if b <= 4 else "A" if b <= 12 else "B" if b <= 20 else "BD" if b <= 28 else "build" if b <= 32 else "A2" if b <= 40 else "outro"

# ---------------- low strings, bass, guitar: the engine room ----------------
for b in range(1, BARS + 1):
    ch, sec, t = PROG[b], SEC(b), B(b)
    r_vc, r_cb, r_bs = root(ch, M("F2")), root(ch, M("E1")), root(ch, M("E1"))
    if sec in ("intro", "A", "B", "A2", "outro"):
        for i in range(8): vc.n(t + 2 * i, 2, r_vc, arts=(">",) if i in (0, 3) else ("st",))
        cb.n(t, 16, r_cb)
        for i in range(8): bs.n(t + 2 * i, 2, r_bs, arts=(">",) if i in (0, 3) else ())
    elif sec == "BD":
        vc.n(t, 16, r_vc); cb.n(t, 16, r_cb)
        if b >= 25: bs.n(t, 16, r_bs)
    else:  # build: tremolo strings, bass pulses
        vc.n(t, 16, r_vc, trem=3); cb.n(t, 16, r_cb, trem=3)
        if b <= 30: bs.n(t, 16, r_bs)
        else:
            for i in range(8): bs.n(t + 2 * i, 2, r_bs)
    # guitar power chords (written an octave up, sounds as concert)
    gr = root(ch, M("E2"))
    pc = [gr, above(fifth(ch), M(gr) + 1), above(pcs(ch)[0], M(gr) + 1)]
    if sec in ("intro", "A", "outro"):
        for i in range(8): gt.n(t + 2 * i, 2, pc[:2], arts=(">",) if i in (0, 3) else ())
    elif sec == "B":
        for d, a in ((6, (">",)), (6, (">",)), (4, (">",))): gt.n(t, d, pc, arts=a); t += d
    elif sec == "build" and b >= 31:
        for i in range(8): gt.n(t + 2 * i, 2, pc[:2])
    elif sec == "A2":
        for i in range(8): gt.n(t + 2 * i, 2, pc, arts=(">",) if i in (0, 3) else ())
gt.words(B(1), "palm mute").words(B(13), "open, let ring").words(B(31), "palm mute").words(B(33), "open").words(B(41), "palm mute")
for p, marks in [(vc, [(1, "mf"), (13, "f"), (21, "p"), (29, "pp"), (33, "ff"), (41, "mf")]),
                 (cb, [(1, "mf"), (13, "f"), (21, "p"), (29, "pp"), (33, "ff"), (41, "mf")]),
                 (bs, [(1, "mf"), (13, "f"), (25, "p"), (29, "p"), (33, "f"), (41, "mf")]),
                 (gt, [(1, "mp"), (5, "mf"), (13, "f"), (31, "mp"), (33, "f"), (41, "mf")])]:
    for b, m in marks: p.dyn(B(b), m)
for p in (vc, cb): p.wedge(B(29), B(33) - 1)
bs.wedge(B(31), B(33) - 1); gt.wedge(B(31), B(33) - 1)
gt.wedge(B(3), B(5) - 1)

# ---------------- violas / violins II ostinato ----------------
def ost(part, b, lo, hi, order, arts="st"):
    t = B(b); ts = tones(PROG[b], M(lo), M(hi))
    for i in range(8): part.n(t + 2 * i, 2, ts[order[i % len(order)] % len(ts)], arts=(arts,))
for b in range(1, BARS + 1):
    sec = SEC(b)
    if sec in ("A", "B", "A2") or (sec == "intro" and b >= 3) or sec == "outro":
        ost(va, b, "G3", "A4", [0, 1, 2, 1])
    if (sec == "A" and b >= 9) or sec == "A2":
        ost(v2, b, "C4", "E5", [2, 1, 3, 1])
    if sec == "BD":
        va.n(B(b), 16, tones(PROG[b], M("A3"), M("A4"))[1])
        if b >= 25: v2.n(B(b), 16, tones(PROG[b], M("D4"), M("D5"))[-1])
    if sec == "build":
        va.n(B(b), 16, tones(PROG[b], M("A3"), M("A4"))[1], trem=3)
        v2.n(B(b), 16, tones(PROG[b], M("D4"), M("D5"))[-1], trem=3)
# violins II double the Lift melody an octave down
melody(v2, 13, up(MEL_B, -1))
va.dyn(B(3), "mp").dyn(B(5), "mf").dyn(B(13), "f").dyn(B(21), "p").dyn(B(29), "pp").dyn(B(33), "ff").dyn(B(41), "mf")
va.wedge(B(29), B(33) - 1)
v2.dyn(B(9), "mf").dyn(B(13), "f").dyn(B(25), "pp").dyn(B(29), "pp").dyn(B(33), "ff")
v2.wedge(B(29), B(33) - 1)

# ---------------- violins I ----------------
for b in range(9, 13): v1.n(B(b), 16, tones(PROG[b], M("A4"), M("A5"))[-1])
v1.dyn(B(9), "mp")
melody(v1, 13, MEL_B); v1.dyn(B(13), "f")
for b in range(25, 29): v1.n(B(b), 16, tones(PROG[b], M("D5"), M("D6"))[-1])
v1.dyn(B(25), "pp")
for b, n in zip(range(29, 33), ["D5", "E5", "F5", "A5"]): v1.n(B(b), 16, n, trem=3)
v1.dyn(B(29), "pp").wedge(B(29), B(33) - 1)
melody(v1, 33, up(MEL_A)); v1.dyn(B(33), "ff")
for b in range(41, 45): v1.n(B(b), 16, tones(PROG[b], M("D5"), M("D6"))[-1])
v1.dyn(B(41), "mp").wedge(B(43), B(45) - 1, "diminuendo")

# ---------------- brass ----------------
melody(hn, 5, MEL_A); hn.dyn(B(5), "mf").wedge(B(11), B(13) - 1)
for b in range(13, 21): hn.n(B(b), 16, tones(PROG[b], M("F3"), M("A4"))[-3:-1])
hn.dyn(B(13), "f")
melody(hn, 25, MEL_A[4:]); hn.dyn(B(25), "p").words(B(25), "solo")
for b in range(29, 33): hn.n(B(b), 16, tones(PROG[b], M("F3"), M("A4"))[-3:-1])
hn.dyn(B(29), "p").wedge(B(29), B(33) - 1)
melody(hn, 33, MEL_A); hn.dyn(B(33), "ff")
for b in range(41, 44): hn.n(B(b), 16, tones(PROG[b], M("F3"), M("F4"))[-2:])
hn.dyn(B(41), "mf").wedge(B(42), B(44) - 1, "diminuendo")

for b in range(13, 21):   # trumpets: stabs that lock with the cellos' accents
    ts = tones(PROG[b], M("D4"), M("A5"))[-2:]
    tp.n(B(b), 2, ts, arts=("^",)).n(B(b) + 6, 2, ts, arts=("^",))
tp.dyn(B(13), "f")
for b in (31, 32): tp.n(B(b), 16, tones(PROG[b], M("D4"), M("G5"))[-2:])
tp.dyn(B(31), "p").wedge(B(31), B(33) - 1)
melody(tp, 33, up(MEL_A)); tp.dyn(B(33), "ff")

for b in list(range(9, 21)) + list(range(29, 33)):
    r = root(PROG[b], M("E2"))
    tb.n(B(b), 16, [r, above(fifth(PROG[b]), M(r) + 1)])
for b in range(33, 41):
    r = root(PROG[b], M("E2"))
    tb.n(B(b), 8, [r, above(fifth(PROG[b]), M(r) + 1)], arts=(">",)).n(B(b) + 8, 8, [r, above(fifth(PROG[b]), M(r) + 1)], arts=(">",))
tb.n(B(41), 4, ["D2", "A2"], arts=("^",))
tb.dyn(B(9), "mp").dyn(B(13), "f").dyn(B(29), "p").wedge(B(29), B(33) - 1).dyn(B(33), "ff")

# ---------------- timpani ----------------
TR = lambda ch: root(ch, M("D2"))
ti.n(B(1), 4, "D2", arts=(">",)); ti.dyn(B(1), "f")
for b in (5, 9, 13, 17): ti.n(B(b), 4, TR(PROG[b]), arts=(">",))
for b in (12, 20): ti.n(B(b), 16, "A2", trem=3)
ti.wedge(B(12), B(13) - 1).wedge(B(20) + 8, B(21) - 1, "diminuendo")
ti.n(B(31), 16, "A2", trem=3).n(B(32), 16, "A2", trem=3); ti.dyn(B(31), "pp").wedge(B(31), B(33) - 1)
for b in range(33, 41):
    ti.n(B(b), 4, TR(PROG[b]), arts=(">",))
    if b != 40: ti.n(B(b) + 8, 4, TR(PROG[b]))
ti.dyn(B(33), "ff")
ti.n(B(40) + 8, 8, "A2", trem=3); ti.n(B(41), 4, "D2", arts=(">",)); ti.dyn(B(41), "f")
ti.n(B(44), 16, "A2", trem=3); ti.dyn(B(44), "p"); ti.wedge(B(44), B(45) - 1)

# ---------------- drums ----------------
def groove(b, top="hh", kick=(0, 8, 10), snare=(4, 12), crash=False):
    t = B(b)
    for i in range(8):
        x = [top]
        if crash and i == 0: x = ["crash"]
        if 2 * i in kick: x.append("kick")
        if 2 * i in snare: x.append("snare")
        dr.n(t + 2 * i, 2, x)
def fill(b, start_beat=2, kind="toms"):
    t = B(b) + start_beat * 4
    seq = ["tom1", "tom1", "tom2", "tom2", "tom3", "tom3", "ftom", "ftom"] if kind == "toms" else ["snare"] * 8
    for i, x in enumerate(seq): dr.n(t + i, 1, [x] + (["kick"] if i % 4 == 0 else []))
# intro
for i in range(4): dr.n(B(1) + 4 * i, 4, "kick")
for i in range(4): dr.n(B(2) + 4 * i, 4, ["kick"] + (["ftom"] if i % 2 else []))
for i in range(8): dr.n(B(3) + 2 * i, 2, ["hh"] + (["kick"] if i % 2 == 0 else []) + (["snare"] if i in (2, 6) else []))
for i in range(4): dr.n(B(4) + 2 * i, 2, ["snare"] + (["kick"] if i % 2 == 0 else []))
fill(4, 2, "snare")
dr.dyn(B(1), "mf").wedge(B(4), B(5) - 1)
# theme
for b in range(5, 13):
    if b in (12,): groove(b, crash=False); continue
    groove(b, crash=b in (5, 9))
# bar 12 ends with a tom fill
dr.ev[(1, 1)] = [e for e in dr.ev[(1, 1)] if not (B(12) + 8 <= e.t < B(13))]
dr.ev[(1, 2)] = [e for e in dr.ev[(1, 2)] if not (B(12) + 8 <= e.t < B(13))]
fill(12, 2)
dr.dyn(B(5), "f")
# lift: ride, busier kick
for b in range(13, 21):
    if b == 20:
        for i in range(4): dr.n(B(20) + 2 * i, 2, ["ride"] + (["kick"] if i in (0, 3) else []) + (["snare"] if i == 2 else []))
        dr.n(B(20) + 8, 8, ["crash", "kick"]); continue
    groove(b, top="ride", kick=(0, 6, 8, 10), crash=b in (13, 17))
dr.ev[(1, 1)] = [e for e in dr.ev[(1, 1)] if not (B(16) + 12 <= e.t < B(17))]
dr.ev[(1, 2)] = [e for e in dr.ev[(1, 2)] if not (B(16) + 12 <= e.t < B(17))]
for i in range(4): dr.n(B(16) + 12 + i, 1, ["snare"])
dr.wedge(B(20) + 8, B(21) - 1, "diminuendo")
# breakdown: bars 25-28 a soft rim-click groove
for b in range(25, 29):
    for i in range(8): dr.n(B(b) + 2 * i, 2, ["hh"] + (["kick"] if i == 0 else []) + (["rim"] if i in (2, 6) else []))
dr.dyn(B(25), "p")
# build
for i in range(4): dr.n(B(29) + 4 * i, 4, ["snare", "kick"])
for i in range(8): dr.n(B(30) + 2 * i, 2, ["snare"] + (["kick"] if i % 2 == 0 else []))
for i in range(16): dr.n(B(31) + i, 1, ["snare"] + (["kick"] if i % 4 == 0 else []))
for i in range(8): dr.n(B(32) + i, 1, ["snare"] + (["kick"] if i % 4 == 0 else []))
fill(32, 2)
dr.dyn(B(29), "p").wedge(B(29), B(33) - 1)
# full theme
for b in range(33, 41):
    groove(b, top="ride", kick=(0, 6, 8, 10), crash=b in (33, 37))
for b in (36, 40):
    dr.ev[(1, 1)] = [e for e in dr.ev[(1, 1)] if not (B(b) + 8 <= e.t < B(b + 1))]
    dr.ev[(1, 2)] = [e for e in dr.ev[(1, 2)] if not (B(b) + 8 <= e.t < B(b + 1))]
    fill(b, 2, "snare" if b == 36 else "toms")
dr.dyn(B(33), "ff")
# outro
for b in range(41, 45): groove(b, crash=b == 41)
dr.ev[(1, 1)] = [e for e in dr.ev[(1, 1)] if not (B(44) + 8 <= e.t)]
dr.ev[(1, 2)] = [e for e in dr.ev[(1, 2)] if not (B(44) + 8 <= e.t)]
fill(44, 2)
dr.dyn(B(41), "f").dyn(B(42), "mf")

# ---------------- piano ----------------
def pulse(b, octave_lo="C5", octave_hi="C6", pat=(0, 1, 2, 1)):
    ch = PROG[b]; r = root(ch, M(octave_lo)); f5 = above(fifth(ch), M(r) + 1); r8 = above(pcs(ch)[0], M(r) + 1)
    notes = [r, f5, r8]
    for i in range(8): pn.n(B(b) + 2 * i, 2, notes[pat[i % 4]], arts=("st",))
for b in list(range(3, 21)) + list(range(25, 29)) + list(range(33, 44)):
    pulse(b, "C5" if SEC(b) == "A2" else "G4")
melody(pn, 21, up(MEL_A[:4]), slur=True, arts_first=())
for b in range(9, 21): pn.n(B(b), 16, [root(PROG[b], M("C2")), root(PROG[b], M("C3"))], staff=2)
for b in range(21, 29):
    r = root(PROG[b], M("D2")); f5 = above(fifth(PROG[b]), M(r) + 1); third = above(pcs(PROG[b])[1], M(f5) + 1)
    pn.n(B(b), 16, [r, f5, third], staff=2)
for b in range(29, 33):
    r = root(PROG[b], M("D4"))
    for i in range(8): pn.n(B(b) + 2 * i, 2, [r, above(pcs(PROG[b])[0], M(r) + 1)], arts=(">",) if i % 2 == 0 else ())
    rl = root(PROG[b], M("D2"))
    for i in range(8): pn.n(B(b) + 2 * i, 2, [rl, above(pcs(PROG[b])[0], M(rl) + 1)], staff=2)
for b in range(33, 41): pn.n(B(b), 16, [root(PROG[b], M("C2")), root(PROG[b], M("C3"))], staff=2)
pn.dyn(B(3), "mp").dyn(B(13), "f").dyn(B(21), "mp").dyn(B(25), "p").dyn(B(29), "p").dyn(B(33), "f").dyn(B(41), "mp")
pn.wedge(B(29), B(33) - 1)
pn.dyn(B(9), "mf", staff=2).dyn(B(21), "p", staff=2)

if __name__ == "__main__":
    s.write("out/racelimit-main-theme.musicxml")
    print("ok", BARS, "bars")

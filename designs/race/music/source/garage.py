# 2. Garage / setup loop — F major / D dorian, 96 BPM, 32 bars (~1:20), calm, loops back to bar 1.
from mx import *
from common import *

PROG = {}
layout(PROG, 1, ["Dm7", "Bbmaj7", "Fmaj7", "C7sus"])
layout(PROG, 5, ["Dm7", "Bbmaj7", "Fmaj7", "C7sus", "Dm7", "Bbmaj7", "Fmaj7", "C"])
layout(PROG, 13, ["Gm7", "Am7", "Bbmaj7", "C7sus", "Gm7", "Am7", "Bbmaj7", "A7"])
layout(PROG, 21, ["Dm7", "Bbmaj7", "Fmaj7", "C7sus", "Dm7", "Bbmaj7", "Fmaj7", "C"])
layout(PROG, 29, ["Dm7", "Bbmaj7", "Fmaj7", "C7sus"])
BARS = 32

# the RaceLimit motif, relaxed (same shape as the main theme's first bar)
MEL = [
    [(6, "D5"), (2, "A4"), (2, "D5"), (2, "E5"), (4, "F5")],
    [(8, "F5"), (4, "D5"), (4, "A4")],
    [(6, "C5"), (2, "A4"), (2, "C5"), (2, "D5"), (4, "E5")],
    [(12, "F5"), (4, None)],
    [(6, "D5"), (2, "A4"), (2, "D5"), (2, "E5"), (4, "F5")],
    [(6, "A5"), (2, "G5"), (4, "F5"), (4, "D5")],
    [(4, "C5"), (4, "E5"), (8, "A5")],
    [(8, "G5"), (8, "E5")],
]
MEL2 = MEL[:7] + [[(4, "G5"), (4, "E5"), (4, "C5"), (4, None)]]
GTR_B = [
    [(4, "D4"), (4, "F4"), (4, "G4"), (4, "Bb4")],
    [(12, "A4"), (4, "G4")],
    [(4, "F4"), (4, "A4"), (4, "Bb4"), (4, "D5")],
    [(12, "C5"), (4, "Bb4")],
    [(4, "D5"), (4, "F5"), (4, "G5"), (4, "F5")],
    [(8, "E5"), (8, "C5")],
    [(4, "D5"), (4, "C5"), (4, "Bb4"), (4, "A4")],
    [(8, "G4"), (4, "A4"), (4, "C#5")],
]

s = Score("RaceLimit – Garage", BARS, 96, key=-1, subtitle="Setup, livery and car screens · loops from the last bar back to bar 1")
vb = s.add(vibes()); gt = s.add(eguitar("Electric Guitar (clean)", 27)); ep = s.add(epiano())
pd = s.add(pad()); bs = s.add(ebass()); dr = s.add(drumset())
for b, name in [(1, "Intro"), (5, "Theme"), (13, "Bridge"), (21, "Theme 2"), (29, "Outro")]: s.mark(s.bar(b), name)
B = s.bar
s.loop = True

# electric piano: soft chords, re-struck on the "and" of 2; left hand root + fifth
for b in range(1, BARS + 1):
    ch = PROG[b]; v = close(ch, M("F5"), 4)
    if b in (4, 8, 12, 16, 20, 24, 28, 32):
        ep.n(B(b), 6, v).n(B(b) + 6, 10, v)
    else:
        ep.n(B(b), 6, v).n(B(b) + 6, 6, v).n(B(b) + 12, 4, v[-2:] if b % 2 else v)
    r = root(ch, M("C2")); ep.n(B(b), 16, [r, above(fifth(ch), M(r) + 1)], staff=2)
ep.dyn(B(1), "p").dyn(B(1), "p", staff=2)
ep.words(B(1), "with pedal, gently")

# pad: long chords from bar 3
for b in range(3, BARS + 1): pd.n(B(b), 16, close(PROG[b], M("A4"), 3))
pd.dyn(B(3), "ppp").wedge(B(3), B(5) - 1).dyn(B(5), "pp")

# vibraphone: the motif
melody(s, vb, 5, MEL, arts_first=())
melody(s, vb, 21, MEL2, arts_first=())
vb.n(B(29), 6, "D5").n(B(29) + 6, 2, "A4").n(B(29) + 8, 2, "D5").n(B(29) + 10, 2, "E5").n(B(29) + 12, 4, "F5")
vb.n(B(31), 6, "C5").n(B(31) + 6, 2, "A4").n(B(31) + 8, 8, "C5")
vb.dyn(B(5), "mp").dyn(B(21), "mp").dyn(B(29), "p").dyn(B(31), "pp")

# clean guitar: melody in the bridge, arpeggios under the second theme
melody(s, gt, 13, up(GTR_B, -1), arts_first=())
for b in range(21, 29):
    ts = tones(PROG[b], M("G3"), M("C5"))
    order = [0, 1, 2, 3, 2, 1, 2, 3]
    for i in range(8): gt.n(B(b) + 2 * i, 2, ts[order[i] % len(ts)])
gt.dyn(B(13), "mp").dyn(B(21), "p").words(B(21), "let ring")

# bass: relaxed root/third/fifth
for b in range(5, BARS + 1):
    ch = PROG[b]; r = root(ch, M("E1")); t3 = above(pcs(ch)[1], M(r) + 1); f5 = above(fifth(ch), M(r) + 1)
    if b >= 31: bs.n(B(b), 16, r); continue
    if 13 <= b <= 20:
        bs.seq(B(b), [(6, r), (2, r), (4, t3), (4, f5)])
    else:
        bs.seq(B(b), [(6, r), (2, r), (8, f5)])
bs.dyn(B(5), "mp").dyn(B(29), "p")

# drums: soft groove with a side stick
def groove(b, top="hh", kick=(0, 6, 10), rim=(4, 12), ghost=True, crash=False):
    for i in range(8):
        x = [top]
        if crash and i == 0: x = ["crash"]
        if 2 * i in kick: x.append("kick")
        if 2 * i in rim: x.append("rim")
        dr.n(B(b) + 2 * i, 2, x)
for b in (3, 4):
    for i in range(8): dr.n(B(b) + 2 * i, 2, ["hh"])
for b in range(5, 13): groove(b)
for b in range(13, 21): groove(b, top="ride", kick=(0, 6, 8, 10), crash=b == 13)
for b in range(21, 29): groove(b, crash=b == 21)
kill(dr, B(20) + 12, B(21))
for i in range(4): dr.n(B(20) + 12 + i, 1, ["snare"])
for b in (29, 30): groove(b, kick=(0,), rim=(4, 12))
for b in (31, 32):
    for i in range(8): dr.n(B(b) + 2 * i, 2, ["hh"])
dr.dyn(B(3), "pp").dyn(B(5), "p").dyn(B(13), "mp").dyn(B(21), "p").dyn(B(29), "pp")

if __name__ == "__main__":
    s.write("out/racelimit-garage.musicxml"); print("ok")

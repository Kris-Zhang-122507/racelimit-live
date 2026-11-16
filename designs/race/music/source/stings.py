# Short stings: pole position, race finish (not a win), retired / DNF
from lib2 import *

def finale(P, B, bar, notes, dyn="ff", dur=16):
    for k, n in notes.items():
        P[k].n(B(bar), dur, n, arts=("^",) if dyn in ("f", "ff") else (), fermata=True)
        P[k].dyn(B(bar), dyn)

# ---------------- pole position: bright fanfare, F major ----------------
PP = {1: "F", 2: "C", 3: "F"}
p = Score("RaceLimit – Pole Position", 3, 120, key=-1)
P = dict(hn=p.add(horns()), tp=p.add(trumpets()), tb=p.add(trombones()), ti=p.add(timpani()), gl=p.add(glock()), dr=p.add(drumset()), bs=p.add(ebass()))
for k, x in zip(("v1", "v2", "va", "vc", "cb"), strings()): P[k] = p.add(x)
B = p.bar; A = Arr(p, PP)
FAN = [[(6, "F5"), (2, "C5"), (2, "F5"), (2, "G5"), (4, "A5")], [(8, "G5"), (8, "E5")]]
melody(p, P["tp"], 1, FAN); melody(p, P["v1"], 1, FAN); melody(p, P["hn"], 1, up(FAN, -1)); melody(p, P["gl"], 1, up(FAN), slur=False, arts_first=())
A.ost(P["v2"], range(1, 3), "C4", "E5", (2, 1, 3, 1)); A.ost(P["va"], range(1, 3), "G3", "A4")
A.roots(P["vc"], range(1, 3), "F2"); A.roots(P["bs"], range(1, 3), "E1", other=())
A.hold(P["cb"], range(1, 3), lambda c: root(c, M("E1"))); A.hold(P["tb"], range(1, 3), lambda c: r5(c))
A.groove(P["dr"], range(1, 3), top="ride", kick=(0, 6, 8, 10), snare=(4, 12), crash=(1,)); A.fill(P["dr"], 2, 3, seq=["snare", "tom1", "tom2", "ftom"])
P["ti"].n(B(1), 4, "F2", arts=(">",)).n(B(2), 4, "C3", arts=(">",)).n(B(2) + 8, 8, "C3", trem=3)
for k in P: P[k].dyn(B(1), "f")
finale(P, B, 3, {"hn": ["F4", "A4"], "tp": ["C5", "F5"], "tb": ["F2", "C3", "F3"], "gl": ["F6"], "v1": ["F5", "C6", "F6"], "v2": ["A4", "C5", "F5"],
                 "va": ["C4", "F4", "A4"], "vc": ["F2", "C3", "F3"], "cb": ["F2"], "bs": ["F1"], "ti": ["F2"], "dr": ["crash", "kick"]})

# ---------------- race finish (not a win): warm and short, G major ----------------
FP = {1: "G", 2: "C", 3: "D", 4: "G"}
f = Score("RaceLimit – Race Finish", 4, 100, key=1)
F = dict(hn=f.add(solo_horn()), pn=f.add(piano()), ti=f.add(timpani()), dr=f.add(drumset()))
for k, x in zip(("v1", "v2", "va", "vc", "cb"), strings()): F[k] = f.add(x)
B = f.bar; A = Arr(f, FP)
FM = [[(6, "G4"), (2, "D4"), (2, "G4"), (2, "A4"), (4, "B4")], [(6, "C5"), (2, "B4"), (8, "G4")], [(8, "A4"), (8, "F#4")]]
melody(f, F["hn"], 1, FM, arts_first=()); melody(f, F["v1"], 1, up(FM), arts_first=())
A.hold(F["v2"], range(1, 4), lambda c: tones(c, M("D4"), M("A4"))[-1]); A.hold(F["va"], range(1, 4), lambda c: tones(c, M("G3"), M("D4"))[-1])
A.hold(F["vc"], range(1, 4), lambda c: root(c, M("C2"))); A.hold(F["cb"], range(1, 4), lambda c: root(c, M("E1")))
for b in range(1, 4):
    ch = FP[b]; r = root(ch, M("E2")); seq = [r, above(fifth(ch), M(r) + 1), above(pcs(ch)[0], M(r) + 1), above(pcs(ch)[1], M(r) + 13)]
    for i in range(8): F["pn"].n(B(b) + 2 * i, 2, seq[[0, 1, 2, 3, 2, 1, 2, 1][i]], staff=2)
A.groove(F["dr"], range(1, 4), top="ride", step=4, kick=(0, 8), snare=(), extra={4: ["rim"], 12: ["rim"]})
F["ti"].n(B(3), 16, "D2", trem=3)
for k in F: F[k].dyn(B(1), "mf")
F["pn"].dyn(B(1), "mf", staff=2); F["ti"].dyn(B(3), "p"); F["ti"].wedge(B(3), B(4) - 1)
finale(F, B, 4, {"hn": ["G4"], "v1": ["G5"], "v2": ["B4", "D5"], "va": ["G3", "D4"], "vc": ["G2"], "cb": ["G2"], "ti": ["G2"], "dr": ["crash2"]}, dyn="f")
F["pn"].n(B(4), 16, ["G4", "B4", "D5", "G5"], fermata=True).n(B(4), 16, ["G2", "D3"], staff=2, fermata=True)

# ---------------- retired / DNF: falling, quiet, D minor ----------------
DP = {1: "Dm", 2: "Bb", 3: "Gm", 4: "Dm"}
d = Score("RaceLimit – Retired", 4, 66, key=-1)
D_ = dict(hn=d.add(solo_horn()), pn=d.add(piano()))
for k, x in zip(("v1", "v2", "va", "vc", "cb"), strings()): D_[k] = d.add(x)
B = d.bar; A = Arr(d, DP)
melody(d, D_["pn"], 1, [[(6, "A4"), (2, "F4"), (8, "D4")], [(6, "F4"), (2, "D4"), (8, "Bb3")], [(8, "Bb3"), (8, "D4")], [(16, "D4", )]], arts_first=())
D_["pn"].ev[(1, 1)][-1].fermata = True
A.hold(D_["pn"], range(1, 5), lambda c: octs(c), staff=2); D_["pn"].ev[(2, 5)][-1].fermata = True
D_["hn"].n(B(3), 8, "D4").n(B(3) + 8, 8, "Bb3").n(B(4), 16, "A3", fermata=True)
for k, lo, hi in (("v1", "D5", "D6"), ("v2", "F4", "F5"), ("va", "A3", "A4")):
    A.hold(D_[k], range(1, 5), lambda c, lo=lo, hi=hi: tones(c, M(lo), M(hi))[0]); D_[k].ev[(1, 1)][-1].fermata = True
A.hold(D_["vc"], range(1, 5), lambda c: root(c, M("C2"))); D_["vc"].ev[(1, 1)][-1].fermata = True
A.hold(D_["cb"], range(1, 5), lambda c: root(c, M("E1"))); D_["cb"].ev[(1, 1)][-1].fermata = True
for k in D_: D_[k].dyn(B(1), "p")
D_["pn"].dyn(B(1), "p", staff=2); D_["hn"].dyn(B(3), "pp")
for k in ("v1", "v2", "va", "vc", "cb"): D_[k].wedge(B(3), B(5) - 1, "diminuendo")

STINGS = [(p, PP, "pole-position"), (f, FP, "race-finish"), (d, DP, "retired")]
if __name__ == "__main__":
    for sc, _, name in STINGS: sc.write(f"out/racelimit-sting-{name}.musicxml")
    print("ok")

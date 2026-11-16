# Reusable textures for the second batch of pieces
from mx import *
from common import *

def flute(): return Part("Flute", "Fl.", "wind.flutes.flute", 73)
def clean_gtr(): return eguitar("Electric Guitar (clean)", 27)
def rhythm_gtr():
    g = eguitar("Rhythm Guitar", 29); g.abbr = "R. Gtr."; return g
def lead_gtr():
    g = eguitar("Lead Guitar", 30); g.abbr = "L. Gtr."; return g
def solo_horn(): return Part("Horn in F", "Hn.", "brass.french-horn", 60, trans=(-4, -7), group="brass")

class Arr:
    def __init__(self, s, prog): self.s, self.P, self.B = s, prog, s.bar
    def ost(self, part, bars, lo, hi, order=(0, 1, 2, 1), step=2, arts=("st",)):
        for b in bars:
            ts = tones(self.P[b], M(lo), M(hi))
            for i in range(16 // step): part.n(self.B(b) + step * i, step, ts[order[i % len(order)] % len(ts)], arts=arts)
    def roots(self, part, bars, lo, step=2, acc=(0, 3), other=("st",)):
        for b in bars:
            r = root(self.P[b], M(lo))
            for i in range(16 // step): part.n(self.B(b) + step * i, step, r, arts=(">",) if i in acc else other)
    def hold(self, part, bars, fn, trem=0, staff=1):
        for b in bars: part.n(self.B(b), 16, fn(self.P[b]), staff=staff, trem=trem)
    def rhythm(self, part, bars, fn, durs, arts=(), staff=1):
        """durs: list of note lengths; a negative length is a rest"""
        for b in bars:
            t = self.B(b)
            for d in durs:
                if d > 0: part.n(t, d, fn(self.P[b]), arts=arts, staff=staff)
                t += abs(d)
    def groove(self, dr, bars, top="hh", step=2, kick=(0, 8, 10), snare=(8,), crash=(), extra=None, top_at=None):
        for b in bars:
            hands, feet = {}, {}
            for pos in range(16):
                h, f = [], []
                if top and pos % step == 0 and (top_at is None or pos in top_at): h.append(top)
                if pos in kick: f.append("kick")
                if pos in snare: h.append("snare")
                for x in (extra or {}).get(pos, []): (f if DRUMS[x][4] == 2 else h).append(x)
                if pos == 0 and b in crash:
                    h = [x for x in h if x not in ("hh", "ride", "ohh")] + ["crash"]
                if h: hands[pos] = h
                if f: feet[pos] = f
            for grp, mx_ in ((hands, step), (feet, 2)):
                ps = sorted(grp)
                for i, p in enumerate(ps):
                    gap = (ps[i + 1] if i + 1 < len(ps) else 16) - p
                    dr.n(self.B(b) + p, min(gap, mx_, 1 if p % 2 else 16), grp[p])
    def fill(self, dr, b, beat=2, seq=("tom1", "tom1", "tom2", "tom2", "tom3", "tom3", "ftom", "ftom"), kick_every=4):
        t = self.B(b) + beat * 4
        kill(dr, t, self.B(b + 1))
        seq = list(seq)[-(16 - beat * 4):]
        for i, x in enumerate(seq): dr.n(t + i, 1, [x] + (["kick"] if i % kick_every == 0 else []))

def tri(ch, top):           # close triad under `top`
    return close(ch, M(top), 3)
def octs(ch, lo="C2"):      # bass octave for piano left hand
    r = root(ch, M(lo)); return [r, above(pcs(ch)[0], M(r) + 1)]
def r5(ch, lo="E2"):
    r = root(ch, M(lo)); return [r, above(fifth(ch), M(r) + 1)]

from mx import transpose
from th import *

def melody(s, part, bar0, mel, slur=True, arts_first=(">",)):
    """mel: list of bars, each a list of (dur, pitch or None)"""
    for i, bar in enumerate(mel):
        t = s.bar(bar0 + i)
        idx = [j for j, x in enumerate(bar) if x[1]]
        for j, (d, p) in enumerate(bar):
            if p:
                kw = {}
                if slur and len(idx) > 1 and j == idx[0]: kw["slur"] = "start"
                if slur and len(idx) > 1 and j == idx[-1]: kw["slur"] = "stop"
                if j == idx[0] and arts_first: kw["arts"] = arts_first
                part.n(t, d, p, **kw)
            t += d

def up(mel, octs=1):
    return [[(d, transpose(p, 7 * octs, 12 * octs) if p else None) for d, p in bar] for bar in mel]

def layout(prog, start, chords):
    for i, c in enumerate(chords): prog[start + i] = c

def kill(dr, t0, t1):
    for k in list(dr.ev): dr.ev[k] = [e for e in dr.ev[k] if not (t0 <= e.t < t1)]

def powerchord(ch, lo="E2", full=True):
    gr = root(ch, M(lo))
    pc = [gr, above(fifth(ch), M(gr) + 1), above(pcs(ch)[0], M(gr) + 1)]
    return pc if full else pc[:2]

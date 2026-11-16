from mx import midi
from th import pcs, pc_midi
def check(score, prog, minlen=4, allow=()):
    bad = []
    B = score.BAR
    for p in score.parts:
        if p.drums: continue
        for key, evs in p.ev.items():
            for e in evs:
                if e.d < minlen: continue
                bar = e.t // B + 1
                ch = prog.get(bar)
                if not ch: continue
                ok = {pc_midi(x) for x in pcs(ch)}
                for n in e.p:
                    if midi(n) % 12 not in ok and (p.name, bar) not in allow:
                        bad.append(f"{p.name:16s} bar {bar:2d} beat {(e.t % B)/4+1:.2f} {n} over {ch} (len {e.d})")
    print("\n".join(bad) or "no clashes"); return bad

# Harmony helpers shared by all pieces
from mx import midi, parse, NAT

CH = {
    "Dm": "D F A", "Bb": "Bb D F", "F": "F A C", "C": "C E G", "Gm": "G Bb D", "A": "A C# E", "Am": "A C E",
    "Asus": "A D E", "Eb": "Eb G Bb", "D": "D F# A", "G": "G B D", "Bm": "B D F#", "Em": "E G B", "F#m": "F# A C#",
    "Dm7": "D F A C", "Bbmaj7": "Bb D F A", "Fmaj7": "F A C E", "Cadd9": "C E G D", "Gm7": "G Bb D F", "Am7": "A C E G",
    "C7sus": "C F G Bb", "Csus": "C F G", "A7": "A C# E G", "Dm9": "D F A C E", "Ebmaj7": "Eb G Bb D", "Gsus": "G C D",
    "Bm7": "B D F# A", "Em7": "E G B D", "Gmaj7": "G B D F#", "Dsus": "D G A", "Esus": "E A B", "E": "E G# B", "B": "B D# F#", "Cm": "C Eb G", "Ab": "Ab C Eb", "Fm": "F Ab C", "C#m": "C# E G#", "Esus": "E A B", "Bbsus": "Bb Eb F", "Gsus4": "G C D",
}

def pcs(ch): return CH[ch].split()

def pc_midi(pc):  # pitch class number of a spelled pitch class like "Bb"
    return midi(pc + "4") % 12

def at(pc, near):
    """the pitch with spelling `pc` nearest to midi `near`, as a name"""
    best = None
    for o in range(0, 9):
        n = f"{pc}{o}"; d = abs(midi(n) - near)
        if best is None or d < best[0]: best = (d, n)
    return best[1]

def above(pc, lo):
    """lowest pitch with spelling pc at or above midi lo"""
    for o in range(0, 9):
        n = f"{pc}{o}"
        if midi(n) >= lo: return n

def tones(ch, lo, hi):
    out = []
    for pc in pcs(ch):
        for o in range(0, 9):
            n = f"{pc}{o}"
            if lo <= midi(n) <= hi: out.append(n)
    return sorted(out, key=midi)

def root(ch, lo):
    return above(pcs(ch)[0], lo)

def fifth(ch):
    """root + perfect fifth spelled (power chord)"""
    r = pcs(ch)[0]
    for pc in pcs(ch):
        if (pc_midi(pc) - pc_midi(r)) % 12 == 7: return pc
    return pcs(ch)[2]

def close(ch, top_near, n=3):
    """a close-position voicing of n notes whose top note is near `top_near`"""
    ts = tones(ch, top_near - 14, top_near + 2)
    return ts[-n:]

def M(name): return midi(name)

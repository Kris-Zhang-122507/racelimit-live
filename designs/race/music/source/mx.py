# A small MusicXML writer for MuseScore: parts, voices, ties, drums, transposing instruments,
# dynamics, wedges, tempo and rehearsal marks. Time is counted in 16th notes (4 per beat, 16 per bar in 4/4).
import re
from collections import defaultdict
from xml.sax.saxutils import escape

STEPS = "CDEFGAB"
NAT = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

def parse(name):
    m = re.fullmatch(r"([A-G])(##|bb|#|b)?(-?\d)", name)
    if not m: raise ValueError(name)
    L, acc, o = m.groups()
    alter = {"#": 1, "##": 2, "b": -1, "bb": -2, None: 0}[acc]
    return L, alter, int(o)

def midi(name):
    L, a, o = parse(name); return 12 * (o + 1) + NAT[L] + a

def spell(L, alter, o): return L + {0: "", 1: "#", 2: "##", -1: "b", -2: "bb"}[alter] + str(o)

def transpose(name, dia, chrom):
    """move a spelled pitch by `dia` letter steps and `chrom` semitones (keeps proper spelling)"""
    L, a, o = parse(name)
    idx = STEPS.index(L) + dia + 7 * o
    L2, o2 = STEPS[idx % 7], idx // 7
    target = midi(name) + chrom
    a2 = target - (12 * (o2 + 1) + NAT[L2])
    return spell(L2, a2, o2)

TYPES = {16: ("whole", 0), 12: ("half", 1), 8: ("half", 0), 6: ("quarter", 1), 4: ("quarter", 0), 3: ("eighth", 1), 2: ("eighth", 0), 1: ("16th", 0)}

def fits(s, L, rest):
    if L not in TYPES: return False
    if rest: return L in (16, 8, 4, 2, 1) and s % L == 0 or (L == 6 and s % 4 == 0 and s != 4 and s + 6 <= 16 and False)
    if L == 16: return s == 0
    if L == 12: return s in (0, 4)
    if L == 8: return s in (0, 4, 8)
    if L == 6: return s % 2 == 0 and s + 6 <= 16
    if L == 4: return s % 2 == 0
    if L == 3: return s // 4 == (s + 2) // 4
    if L == 2: return s % 2 == 0 or s // 4 == (s + 1) // 4
    return True

def pieces(s, e, rest):
    if fits(s, e - s, rest): return [(s, e - s)]
    for g in (8, 4, 2, 1):
        b = (s // g + 1) * g
        if b < e: return pieces(s, b, rest) + pieces(b, e, rest)
    raise ValueError((s, e))

# General MIDI drum kit: name -> (midi note, display step, display octave, notehead, voice)
DRUMS = {
    "kick": (36, "F", 4, None, 2), "kick2": (35, "E", 4, None, 2), "snare": (38, "C", 5, None, 1), "rim": (37, "C", 5, "x", 1),
    "hh": (42, "G", 5, "x", 1), "ohh": (46, "G", 5, "circle-x", 1), "pedal": (44, "D", 4, "x", 2), "crash": (49, "A", 5, "x", 1),
    "crash2": (57, "B", 5, "x", 1), "ride": (51, "F", 5, "x", 1), "bell": (53, "F", 5, "diamond", 1), "tom1": (50, "E", 5, None, 1),
    "tom2": (47, "D", 5, None, 1), "tom3": (45, "B", 4, None, 1), "ftom": (43, "A", 4, None, 1), "ftom2": (41, "G", 4, None, 1),
    "clap": (39, "D", 5, "x", 1), "tamb": (54, "B", 5, "triangle", 1), "china": (52, "C", 6, "x", 1),
}
DRUM_NAMES = {36: "Bass Drum 1", 35: "Acoustic Bass Drum", 38: "Acoustic Snare", 37: "Side Stick", 42: "Closed Hi-Hat", 46: "Open Hi-Hat",
              44: "Pedal Hi-Hat", 49: "Crash Cymbal 1", 57: "Crash Cymbal 2", 51: "Ride Cymbal 1", 53: "Ride Bell", 50: "High Tom",
              47: "Low-Mid Tom", 45: "Low Tom", 43: "High Floor Tom", 41: "Low Floor Tom", 39: "Hand Clap", 54: "Tambourine", 52: "Chinese Cymbal"}

class Ev:
    __slots__ = ("t", "d", "p", "arts", "trem", "slur", "text", "fermata")
    def __init__(self, t, d, p, arts=(), trem=0, slur=None, fermata=False):
        self.t, self.d, self.p, self.arts, self.trem, self.slur, self.fermata = t, d, p, tuple(arts), trem, slur, fermata

class Part:
    def __init__(self, name, abbr, sound, program=0, clefs=("G2",), trans=(0, 0), drums=False, ensemble=False, group=None):
        self.name, self.abbr, self.sound, self.program, self.clefs = name, abbr, sound, program, list(clefs)
        self.trans, self.drums, self.ensemble, self.group = trans, drums, ensemble, group
        self.staves = len(self.clefs)
        self.ev = defaultdict(list)       # (staff, voice) -> [Ev]
        self.dirs = []                    # (t, staff, xml)
    # -- adding notes ------------------------------------------------------
    def n(self, t, d, p, staff=1, voice=None, **kw):
        if isinstance(p, str): p = p.split()
        if self.drums:
            by = defaultdict(list)
            for x in p: by[DRUMS[x][4] if voice is None else voice].append(x)
            for v, xs in by.items(): self.ev[(staff, v)].append(Ev(t, d, xs, **kw))
        else:
            self.ev[(staff, voice or (1 if staff == 1 else 5))].append(Ev(t, d, p, **kw))
        return self
    def seq(self, t, items, staff=1, voice=None, **kw):
        """items: list of (dur, pitches) ; pitches '' or None = rest. Returns end time."""
        for it in items:
            d, p = it[0], it[1]
            extra = dict(kw); extra.update(it[2] if len(it) > 2 else {})
            if p: self.n(t, d, p, staff, voice, **extra)
            t += d
        return t
    # -- markings ----------------------------------------------------------
    def dyn(self, t, mark, staff=1):
        vel = {"ppp": 16, "pp": 33, "p": 49, "mp": 64, "mf": 80, "f": 96, "ff": 112, "fff": 126, "sfz": 112, "fp": 96}[mark]
        self.dirs.append((t, staff, f'<direction placement="below"><direction-type><dynamics><{mark}/></dynamics></direction-type>{{STAFF}}<sound dynamics="{round(vel / 90 * 100)}"/></direction>'))
        return self
    def wedge(self, t0, t1, kind="crescendo", staff=1):
        self.dirs.append((t0, staff, f'<direction placement="below"><direction-type><wedge type="{kind}"/></direction-type>{{STAFF}}</direction>'))
        self.dirs.append((t1, staff, '<direction placement="below"><direction-type><wedge type="stop"/></direction-type>{STAFF}</direction>'))
        return self
    def words(self, t, text, staff=1, above=True, italic=True):
        st = ' font-style="italic"' if italic else ""
        self.dirs.append((t, staff, f'<direction placement="{"above" if above else "below"}"><direction-type><words{st}>{escape(text)}</words></direction-type>{{STAFF}}</direction>'))
        return self

class Score:
    def __init__(self, title, bars, tempo, key=-1, subtitle="", beats=4):
        self.title, self.bars, self.key, self.subtitle = title, bars, key, subtitle
        self.BAR = beats * 4
        self.parts = []
        self.tempos = [(0, tempo, None)]
        self.marks = []
        self.keys = {}
        self.ending = "light-heavy"
    def add(self, part): self.parts.append(part); return part
    def tempo(self, t, bpm, text=None): self.tempos.append((t, bpm, text))
    def mark(self, t, text): self.marks.append((t, text))
    def bar(self, b, beat=0): return (b - 1) * self.BAR + beat   # bar numbers from 1

    def write(self, path):
        o = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">',
             '<score-partwise version="4.0">', f"<work><work-title>{escape(self.title)}</work-title></work>",
             '<identification><creator type="composer">RaceLimit Live</creator><encoding><software>RaceLimit music script</software></encoding></identification>',
             '<defaults><scaling><millimeters>7.05</millimeters><tenths>40</tenths></scaling><page-layout><page-height>1683</page-height><page-width>1190</page-width>'
             '<page-margins type="both"><left-margin>70</left-margin><right-margin>70</right-margin><top-margin>70</top-margin><bottom-margin>70</bottom-margin></page-margins></page-layout></defaults>',
             "<credit page=\"1\"><credit-type>title</credit-type><credit-words justify=\"center\" valign=\"top\" font-size=\"22\" default-x=\"595\" default-y=\"1613\">"
             + escape(self.title) + "</credit-words></credit>"]
        if False and self.subtitle:
            o.append("<credit page=\"1\"><credit-type>subtitle</credit-type><credit-words justify=\"center\" valign=\"top\" font-size=\"12\" default-x=\"595\" default-y=\"1560\">" + escape(self.subtitle) + "</credit-words></credit>")
        o.append("<part-list>")
        open_group = None; ch = 0
        for i, p in enumerate(self.parts, 1):
            p.id = f"P{i}"
            if p.group != open_group:
                if open_group: o.append(f'<part-group type="stop" number="1"/>')
                if p.group: o.append(f'<part-group type="start" number="1"><group-symbol>bracket</group-symbol><group-barline>yes</group-barline></part-group>')
                open_group = p.group
            o.append(f'<score-part id="{p.id}"><part-name>{escape(p.name)}</part-name><part-abbreviation>{escape(p.abbr)}</part-abbreviation>')
            if p.drums:
                used = sorted({DRUMS[x][0] for evs in p.ev.values() for e in evs for x in e.p})
                for m in used:
                    o.append(f'<score-instrument id="{p.id}-I{m}"><instrument-name>{DRUM_NAMES[m]}</instrument-name><instrument-sound>drum.group.set</instrument-sound></score-instrument>')
                for m in used:
                    o.append(f'<midi-instrument id="{p.id}-I{m}"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>{m + 1}</midi-unpitched><volume>80</volume><pan>0</pan></midi-instrument>')
                p.used = used
            else:
                ch += 1
                if ch == 10: ch += 1
                ens = "<ensemble/>" if p.ensemble else ""
                o.append(f'<score-instrument id="{p.id}-I1"><instrument-name>{escape(p.name)}</instrument-name><instrument-sound>{p.sound}</instrument-sound>{ens}</score-instrument>')
                o.append(f'<midi-instrument id="{p.id}-I1"><midi-channel>{ch}</midi-channel><midi-program>{p.program + 1}</midi-program><volume>80</volume><pan>0</pan></midi-instrument>')
            o.append("</score-part>")
        if open_group: o.append('<part-group type="stop" number="1"/>')
        o.append("</part-list>")
        if getattr(self, "loop", False):
            self.parts[0].words((self.bars - 1) * self.BAR, "Loop: go back to bar 1", italic=False)
        for p in self.parts: o += self._part(p)
        o.append("</score-partwise>")
        open(path, "w").write("\n".join(o))

    def _part(self, p):
        B = self.BAR; first = p is self.parts[0]
        dia, chrom = p.trans[0], p.trans[1]
        out = [f'<part id="{p.id}">']
        # split every event at barlines
        per_bar = defaultdict(lambda: defaultdict(list))   # bar -> (staff,voice) -> [(s,e,Ev,tieStart,tieStop)]
        for key, evs in p.ev.items():
            evs.sort(key=lambda e: e.t)
            for a, b in zip(evs, evs[1:]):
                if b.t < a.t + a.d: raise ValueError(f"{p.name} {key}: overlap at bar {a.t // B + 1} beat {(a.t % B) / 4 + 1}: {a.p} / {b.p}")
            for e in evs:
                t, end = e.t, e.t + e.d
                while t < end:
                    bar = t // B; ce = min(end, (bar + 1) * B)
                    per_bar[bar][key].append((t - bar * B, ce - bar * B, e, ce < end, t > e.t))
                    t = ce
        dirs = defaultdict(list)
        for t, staff, x in p.dirs: dirs[t // B].append((t % B, staff, x))
        if first:
            for t, bpm, text in self.tempos:
                words = f"<direction-type><words font-weight=\"bold\">{escape(text)}</words></direction-type>" if text else ""
                dirs[t // B].append((t % B, 1, f'<direction placement="above">{words}<direction-type><metronome parentheses="no"><beat-unit>quarter</beat-unit><per-minute>{bpm}</per-minute></metronome></direction-type>{{STAFF}}<sound tempo="{bpm}"/></direction>'))
            for t, text in self.marks:
                dirs[t // B].append((t % B, 1, f'<direction placement="above"><direction-type><rehearsal font-weight="bold" enclosure="square">{escape(text)}</rehearsal></direction-type>{{STAFF}}</direction>'))
        wfifths = lambda f: f if (p.drums or chrom % 12 == 0) else ((f + (-chrom * 7) % 12) + 6) % 12 - 6
        for bar in range(self.bars):
            out.append(f'<measure number="{bar + 1}">')
            if bar == 0 or (bar in self.keys):
                att = ["<attributes>"]
                if bar == 0: att.append("<divisions>4</divisions>")
                f = self.keys.get(bar, self.key)
                att.append(f"<key><fifths>{wfifths(f) if not p.drums else 0}</fifths>{'<mode>none</mode>' if p.drums else ''}</key>")
                if bar == 0:
                    att.append(f"<time><beats>{B // 4}</beats><beat-type>4</beat-type></time>")
                    if p.staves > 1: att.append(f"<staves>{p.staves}</staves>")
                    for i, c in enumerate(p.clefs, 1):
                        num = f' number="{i}"' if p.staves > 1 else ""
                        if c == "perc": att.append(f"<clef{num}><sign>percussion</sign></clef>")
                        else:
                            sign, line = c[0], c[1]
                            oc = f"<clef-octave-change>{c[2:]}</clef-octave-change>" if len(c) > 2 else ""
                            att.append(f"<clef{num}><sign>{sign}</sign><line>{line}</line>{oc}</clef>")
                    if chrom:
                        octs = chrom // 12 if chrom % 12 == 0 else 0
                        dd, cc = (dia - 7 * octs, chrom - 12 * octs) if octs else (dia, chrom)
                        oc = f"<octave-change>{octs}</octave-change>" if octs else ""
                        att.append(f"<transpose><diatonic>{dd}</diatonic><chromatic>{cc}</chromatic>{oc}</transpose>")
                att.append("</attributes>")
                out.append("".join(att))
            bd = sorted(dirs.get(bar, []), key=lambda x: x[0])
            keys = sorted(per_bar[bar].keys()) or []
            staffs_needed = sorted({k[0] for k in keys} | set(range(1, p.staves + 1)))
            first_voice = True
            for staff in staffs_needed:
                vkeys = sorted([k for k in keys if k[0] == staff]) or [(staff, 1 if staff == 1 else 5)]
                main = vkeys[0]
                for vk in vkeys:
                    if not first_voice: out.append(f"<backup><duration>{B}</duration></backup>")
                    first_voice = False
                    segs = sorted(per_bar[bar].get(vk, []), key=lambda x: x[0])
                    my_dirs = [d for d in bd if d[1] == staff] if vk == main else []
                    out += self._voice(p, staff, vk[1], segs, my_dirs, vk == main, dia, chrom)
            if bar == self.bars - 1: out.append(f'<barline location="right"><bar-style>{self.ending}</bar-style></barline>')
            out.append("</measure>")
        out.append("</part>")
        return out

    def _voice(self, p, staff, voice, segs, my_dirs, main, dia, chrom):
        B = self.BAR; out = []; pos = 0; stf = f"<staff>{staff}</staff>" if p.staves > 1 else ""
        items = []   # (s, L, Ev|None, tieStart, tieStop, firstPiece)
        for s, e, ev, ts, tp in segs:
            if s > pos: items.append((pos, s - pos, None))
            pcs = pieces(s, e, False)
            for i, (ps, pl) in enumerate(pcs):
                items.append((ps, pl, (ev, ts or i < len(pcs) - 1, tp or i > 0, i == 0 and not tp)))
            pos = e
        if pos < B: items.append((pos, B - pos, None))
        whole_rest = all(it[2] is None for it in items)
        dq = list(my_dirs)
        def emit_dirs(upto_s, upto_e):
            while dq and dq[0][0] < upto_e:
                t, _, x = dq.pop(0)
                off = t - upto_s
                x = x.replace("{STAFF}", f"{'<offset>%d</offset>' % off if off > 0 else ''}{stf}")
                out.append(x)
        if whole_rest:
            emit_dirs(0, B)
            if main: out.append(f'<note><rest measure="yes"/><duration>{B}</duration><voice>{voice}</voice>{stf}</note>')
            else: out.append(f"<forward><duration>{B}</duration><voice>{voice}</voice>{stf}</forward>")
            return out
        for s, L, info in items:
            if info is None:
                if main:
                    for rs, rl in pieces(s, s + L, True):
                        emit_dirs(rs, rs + rl)
                        typ, dots = TYPES[rl]
                        out.append(f"<note><rest/><duration>{rl}</duration><voice>{voice}</voice><type>{typ}</type>{'<dot/>' * dots}{stf}</note>")
                else:
                    out.append(f"<forward><duration>{L}</duration><voice>{voice}</voice>{stf}</forward>")
                continue
            emit_dirs(s, s + L)
            ev, ts, tp, firstp = info
            typ, dots = TYPES[L]
            pitches = ev.p
            if not p.drums: pitches = sorted(pitches, key=midi)
            for j, x in enumerate(pitches):
                n = ["<note>"]
                if j: n.append("<chord/>")
                if p.drums:
                    m, step, octv, head, _v = DRUMS[x]
                    n.append(f"<unpitched><display-step>{step}</display-step><display-octave>{octv}</display-octave></unpitched>")
                else:
                    w = transpose(x, -dia, -chrom) if chrom else x
                    Lr, a, oc = parse(w)
                    n.append(f"<pitch><step>{Lr}</step>{'<alter>%d</alter>' % a if a else ''}<octave>{oc}</octave></pitch>")
                n.append(f"<duration>{L}</duration>")
                if tp: n.append('<tie type="stop"/>')
                if ts: n.append('<tie type="start"/>')
                if p.drums: n.append(f'<instrument id="{p.id}-I{DRUMS[x][0]}"/>')
                n.append(f"<voice>{voice}</voice><type>{typ}</type>{'<dot/>' * dots}")
                if p.drums:
                    n.append(f"<stem>{'up' if voice == 1 else 'down'}</stem>")
                    if DRUMS[x][3]: n.append(f"<notehead>{DRUMS[x][3]}</notehead>")
                n.append(stf)
                nt = []
                if tp: nt.append('<tied type="stop"/>')
                if ts: nt.append('<tied type="start"/>')
                if j == 0:
                    if ev.slur == "start" and firstp: nt.append('<slur type="start" number="1"/>')
                    if ev.slur == "stop" and not ts: nt.append('<slur type="stop" number="1"/>')
                    if ev.fermata and not ts: nt.append("<fermata type=\"upright\"/>")
                    if firstp and ev.arts:
                        a = "".join({"st": "<staccato/>", ">": "<accent/>", "^": "<strong-accent/>", "-": "<tenuto/>"}[q] for q in ev.arts)
                        nt.append(f"<articulations>{a}</articulations>")
                    if ev.trem: nt.append(f'<ornaments><tremolo type="single">{ev.trem}</tremolo></ornaments>')
                if nt: n.append(f"<notations>{''.join(nt)}</notations>")
                n.append("</note>")
                out.append("".join(n))
        emit_dirs(0, 10 ** 9)
        return out

# ---- instrument presets (MusicXML standard sound ids; MuseScore picks its own instrument from these) ----
def horns(): return Part("Horns in F", "Hn.", "brass.french-horn", 60, trans=(-4, -7), ensemble=True, group="brass")
def trumpets(): return Part("Trumpets in B♭", "Tpt.", "brass.trumpet", 56, trans=(-1, -2), ensemble=True, group="brass")
def trombones(): return Part("Trombones", "Tbn.", "brass.trombone", 57, clefs=("F4",), ensemble=True, group="brass")
def timpani(): return Part("Timpani", "Timp.", "drum.timpani", 47, clefs=("F4",))
def drumset(): return Part("Drum Set", "D. Set", "drum.group.set", drums=True, clefs=("perc",))
def eguitar(name="Electric Guitar", program=29): return Part(name, "E. Gtr.", "pluck.guitar.electric", program, clefs=("G2-1",), trans=(-7, -12))
def ebass(): return Part("Bass Guitar", "B. Gtr.", "pluck.bass.electric", 33, clefs=("F4",), trans=(-7, -12))
def piano(): return Part("Piano", "Pno.", "keyboard.piano", 0, clefs=("G2", "F4"))
def epiano(): return Part("Electric Piano", "E. Pno.", "keyboard.piano.electric", 4, clefs=("G2", "F4"))
def pad(): return Part("Synth Pad", "Pad", "synth.pad.warm", 89)
def vibes(): return Part("Vibraphone", "Vib.", "pitched-percussion.vibraphone", 11)
def glock(): return Part("Glockenspiel", "Glock.", "pitched-percussion.glockenspiel", 9, trans=(14, 24))
def strings():
    return [Part("Violins I", "Vln. I", "strings.violin", 48, ensemble=True, group="str"),
            Part("Violins II", "Vln. II", "strings.violin", 48, ensemble=True, group="str"),
            Part("Violas", "Vla.", "strings.viola", 48, clefs=("C3",), ensemble=True, group="str"),
            Part("Cellos", "Vc.", "strings.cello", 48, clefs=("F4",), ensemble=True, group="str"),
            Part("Contrabasses", "Cb.", "strings.contrabass", 48, clefs=("F4",), trans=(-7, -12), ensemble=True, group="str")]

# A stand-alone copy of RaceDirector's driving rules (Runtime/RaceDirector.cs, FixedUpdate), to check them without Unity:
#   python3 racesim.py <track.json> [cars=20] [laps=3] [level=0.905] [player: parked|none|slow]
# Prints lap times, the worst overlap between two cars, passes, and the finishing order.
import json, sys, math, random
d = json.load(open(sys.argv[1])); cars_n = int(sys.argv[2]) if len(sys.argv) > 2 else 20; laps = int(sys.argv[3]) if len(sys.argv) > 3 else 3
level = float(sys.argv[4]) if len(sys.argv) > 4 else 0.905; pmode = sys.argv[5] if len(sys.argv) > 5 else "parked"
N, L, half = d["n"], d["len"], d["half"]; line, vline = d["line"], d["vline"]
random.seed(4)
cf, accP, accMass, accGrip, dragK = 1.0, 662500.0, 800.0, 1.0, 0.000966
def wrapped(g):
    g = math.fmod(g, L)
    return g - L if g > L / 2 else g + L if g < -L / 2 else g
def idx(s): return min(N - 1, int((s % L) / L * N))
class C: pass
cars = []; slot = 0; pslot = cars_n // 2
for k in range(cars_n - 1):
    if slot == pslot: slot += 1
    c = C(); c.s = -(8 + 8 * slot); c.lat = (1 if slot % 2 == 0 else -1) * min(2.9, half - 2.2); c.v = 0; c.skill = level * (1 - (k * 0.0028 / 2 + random.random() * 0.012)) * (0.997 + random.random() * 0.006)
    c.launch = 0.16 + random.random() * 0.4; c.passSide = 0; c.passHold = 0; c.fin = False; c.ft = -1; c.best = -1; c.lapStart = 0; c.name = "AI%02d" % k; c.laps = []; cars.append(c); slot += 1
ps, pl, pv = -(8 + 8 * pslot), (1 if pslot % 2 == 0 else -1) * 2.9, 0.0
dt = 0.02; t = 0; raceOver = False; worst = 9; passes = 0; minv_run = 99; stuck = 0
order0 = sorted(range(len(cars)), key=lambda i: -cars[i].s)
while t < 1200 and not all(c.fin for c in cars):
    t += dt
    if pmode == "slow": pv = min(45, pv + 6 * dt); ps += pv * dt; pl = 0.0
    for a, c in enumerate(cars):
        i = idx(c.s); want = max(-(half - 1.2), min(half - 1.2, line[i])); vt = vline[i] * cf * c.skill
        if c.fin: vt = min(vt, 50)
        gapA, latA, vA, aP, anyA, lapping, leftBusy, rightBusy = 70, 0, 0, False, False, False, False, False; push = 0.0
        for b in range(-1, len(cars)):
            if b == a: continue
            if b < 0:
                if pmode == "none": continue
                os_, ol, ov = ps, pl, max(0, pv)
            else: os_, ol, ov = cars[b].s, cars[b].lat, cars[b].v
            gap = wrapped(os_ - c.s); dl = ol - c.lat
            if -7 < gap < 13 and 1.2 < abs(dl) < 4.6:
                if dl > 0: leftBusy = True
                else: rightBusy = True
            if abs(gap) < 5.8 and abs(dl) < 2.2: push += (-1 if dl > 0 else 1) * (2.2 - abs(dl))
            if 0 < gap < gapA and abs(dl) < 2.15: gapA, latA, vA, aP, anyA = gap, ol, ov, b < 0, True
            if -28 < gap < 0 and os_ - c.s > L * 0.5 and ov > c.v - 2: lapping = True
        if anyA:
            closing = c.v - vA; need = 6.3 + max(0, closing) * 0.85 + (2.5 if aP else 0)
            if gapA < 34: vt *= 1.012
            if gapA < need + 8 and c.passSide == 0 and closing > -1.5:
                roomL = (half - 1.2) - (latA + 2.4); roomR = (latA - 2.4) + (half - 1.2)
                canL = roomL >= 0 and not leftBusy; canR = roomR >= 0 and not rightBusy
                if canL or canR: c.passSide = 1 if (canL and (not canR or roomL > roomR)) else -1; c.passHold = 2.2
            if abs(c.lat - latA) < 2.0 and gapA < need: vt = min(vt, max(0, vA + (gapA - 6.3) * 1.4))
            if c.passSide != 0: want = max(-(half - 1.2), min(half - 1.2, latA + c.passSide * 2.5))
            if abs(c.lat - latA) < 1.9 and gapA < 5.6:
                if not aP: c.s -= (5.6 - gapA) * 0.5
                c.v = min(c.v, vA)
        elif c.passSide != 0:
            c.passHold -= dt; beside = rightBusy if c.passSide > 0 else leftBusy
            if beside: c.passHold = max(c.passHold, 0.6); want = c.lat
            elif c.passHold <= 0: c.passSide = 0
            else: want = c.lat
        if lapping: want = max(-(half - 1.2), min(half - 1.2, want + (-2.6 if want > 0 else 2.6))); vt *= 0.94
        if push > 0: want = max(want, c.lat + min(1.5, push * 2))
        elif push < 0: want = min(want, c.lat + max(-1.5, push * 2))
        want = max(-(half - 1.0), min(half - 1.0, want))
        if vline[i] < 70: vt *= 1 - 0.05 * max(0, min(1, abs(c.lat - line[i]) / 3))
        if t < c.launch: vt = 0
        acc = min(12.5 * accGrip, accP / (accMass * max(c.v, 8))) - dragK * c.v * c.v
        c.v = min(vt, c.v + acc * dt) if c.v < vt else max(vt, c.v - 42 * dt)
        latRate = max(-3.4, min(3.4, (want - c.lat) * 2.4)) * max(0, min(1, max(c.v, 5 if (c.passSide != 0 or push != 0) else 0) / 14)); c.lat += latRate * dt
        before = c.s; c.s += c.v * dt
        lb, la = math.floor(before / L), math.floor(c.s / L)
        if la > lb and c.s > 0:
            tc = t - (c.s - la * L) / max(c.v, 1)
            if la >= 1 and lb >= 0: c.laps.append(tc - c.lapStart)
            c.lapStart = tc
            if not c.fin and (la >= laps or raceOver): c.fin = True; c.ft = tc; raceOver = True
        if t > 8 and not c.fin and c.v < 3: stuck += 1
    for a in range(len(cars)):
        for b in range(a + 1, len(cars)):
            g = abs(wrapped(cars[a].s - cars[b].s)); dl = abs(cars[a].lat - cars[b].lat)
            if g < 5.2 and dl < 1.8: worst = min(worst, max(g / 5.2, dl / 1.8))
    o = sorted(range(len(cars)), key=lambda i: -cars[i].s)
    passes += sum(1 for x, y in zip(o, order0) if x != y) // 2; order0 = o
fin = sorted(cars, key=lambda c: c.ft)
print("race", round(t, 1), "s  cars", len(cars), " passes", passes, " stuck car-steps", stuck, " worst overlap (1 = just touching, <1 = inside each other)", round(worst, 2))
allLaps = [x for c in cars for x in c.laps]
if allLaps: print("flying laps: best %.2f  median %.2f  worst %.2f" % (min(allLaps), sorted(allLaps)[len(allLaps) // 2], max(allLaps)))
print("order:", " ".join(c.name[2:] for c in fin), " | winner", round(fin[0].ft, 1), "last +%.1f" % (fin[-1].ft - fin[0].ft))
print("max |lat|", round(max(abs(c.lat) for c in cars), 2), "of", half)

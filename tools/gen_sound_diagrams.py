#!/usr/bin/env python3
"""Generates the sound-guide diagrams (DE + EN) in the KAC house style."""
# Usage: python3 tools/gen_sound_diagrams.py images   (writes KAC_*.svg + KAC_*_EN.svg)
import os, sys

OUT = sys.argv[1]
FONT = "Helvetica Neue, Helvetica, Arial, sans-serif"
BG, INK, GREY, RED = "#f2f1ec", "#16150f", "#6b6a62", "#e02718"
GREEN, YELLOW, ORANGE = "#2e8b57", "#e0a800", "#e86a10"
WHITE = "#faf9f5"

LANG = "de"
def L(de, en): return de if LANG == "de" else en
def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


class SVG:
    def __init__(self, w, h):
        self.w, self.h, self.p = w, h, []
        self.p.append(f'<rect x="0" y="0" width="{w}" height="{h}" fill="{BG}"/>')

    def rect(self, x, y, w, h, fill=BG, stroke=INK, sw=2, rx=12, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" ry="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')

    def text(self, x, y, s, size=22, bold=True, fill=INK, anchor="middle", italic=False):
        lines = s.split("\n")
        for i, ln in enumerate(lines):
            fw = ' font-weight="bold"' if bold else ""
            fs = ' font-style="italic"' if italic else ""
            self.p.append(f'<text x="{x}" y="{y + i * size * 1.25:.1f}" text-anchor="{anchor}" font-family="{FONT}" font-size="{size}"{fw}{fs} fill="{fill}">{esc(ln)}</text>')

    def box(self, x, y, w, h, title, sub=None, fill=BG, stroke=INK, tcol=INK, scol=RED, tsize=24, ssize=18, sw=2, dash=None):
        self.rect(x, y, w, h, fill=fill, stroke=stroke, sw=sw, dash=dash)
        tl = title.count("\n") + 1
        sl = (sub.count("\n") + 1) if sub else 0
        total = tl * tsize * 1.25 + (sl * ssize * 1.25 + 6 if sub else 0)
        ty = y + h / 2 - total / 2 + tsize * 0.95
        self.text(x + w / 2, ty, title, tsize, True, tcol)
        if sub:
            self.text(x + w / 2, ty + tl * tsize * 1.25 - tsize * 0.3 + ssize + 4, sub, ssize, True, scol)

    def line(self, x1, y1, x2, y2, col=GREY, sw=3, arrow=True, dash=None):
        m = f' marker-end="url(#ah{"r" if col == RED else ""})"' if arrow else ""
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="{sw}"{m}{d}/>')

    def path(self, d, col=GREY, sw=3, arrow=True, dash=None, fill="none"):
        m = f' marker-end="url(#ah{"r" if col == RED else ""})"' if arrow else ""
        da = f' stroke-dasharray="{dash}"' if dash else ""
        self.p.append(f'<path d="{d}" fill="{fill}" stroke="{col}" stroke-width="{sw}"{m}{da}/>')

    def circle(self, cx, cy, r, fill=INK, stroke=INK, sw=2):
        self.p.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

    def raw(self, s): self.p.append(s)

    def diamond(self, cx, cy, w, h, label, size=22):
        pts = f"{cx},{cy - h / 2} {cx + w / 2},{cy} {cx},{cy + h / 2} {cx - w / 2},{cy}"
        self.p.append(f'<polygon points="{pts}" fill="{WHITE}" stroke="{INK}" stroke-width="2.5"/>')
        n = label.count("\n") + 1
        self.text(cx, cy - (n - 1) * size * 0.625 + size * 0.35, label, size)

    def svg(self):
        defs = ('<defs>'
                f'<marker id="ah" markerWidth="11" markerHeight="11" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="{GREY}"/></marker>'
                f'<marker id="ahr" markerWidth="11" markerHeight="11" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="{RED}"/></marker>'
                '</defs>')
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}">'
                + defs + "".join(self.p) + "</svg>")


# ---------------------------------------------------------------- Gain-Staging
def gs_kette():
    s = SVG(1500, 440)
    s.text(750, 44, L("Die Pegel-Kette: an jeder Station genug Signal — aber nie ins Rote",
                      "The level chain: enough signal at every stage — but never into the red"), 26)
    items = [
        (L("Quelle", "Source"), L("Mikro · Instrument", "Mic · instrument")),
        ("Gain", L("Spitzen\n−18…−12 dBFS", "Peaks\n−18…−12 dBFS")),
        (L("Bearbeitung", "Processing"), "Gate · Comp · EQ"),
        (L("Kanal-Fader", "Channel fader"), L("um 0 dB", "around 0 dB")),
        ("Master", L("ca. 0 dB", "approx. 0 dB")),
        (L("PA / Box", "PA / speaker"), L("Regler fest", "Knob fixed")),
    ]
    x0, w, gap, y, h = 30, 190, 56, 110, 120
    for i, (t, sub) in enumerate(items):
        x = x0 + i * (w + gap)
        dark = t == "Master"
        s.box(x, y, w, h, t, sub, fill=INK if dark else BG, tcol=BG if dark else INK,
              scol="#ff8a7f" if dark else RED, tsize=25, ssize=17)
        if i < len(items) - 1:
            s.line(x + w + 2, y + h / 2, x + w + gap - 4, y + h / 2)
    # brackets
    def bracket(xa, xb, label, col):
        yb = 262
        s.path(f"M {xa} {yb} L {xa} {yb + 14} L {xb} {yb + 14} L {xb} {yb}", col=col, sw=2.5, arrow=False)
        s.text((xa + xb) / 2, yb + 48, label, 19, True, col)
    bracket(x0 + 1 * (w + gap), x0 + 2 * (w + gap) + w, L("einmal im Soundcheck einstellen", "set once during soundcheck"), INK)
    bracket(x0 + 3 * (w + gap), x0 + 3 * (w + gap) + w, L("laufend mischen", "mix continuously"), RED)
    bracket(x0 + 4 * (w + gap), x0 + 5 * (w + gap) + w, L("Richtwert — kaum anfassen", "reference — rarely touch"), INK)
    s.text(750, 385, L("Ist eine Station zu leise, rauscht es danach. Ist sie zu laut, verzerrt es — und das kann keine spätere Station reparieren.",
                       "If one stage is too low, everything after it hisses. If it is too hot, it distorts — and no later stage can fix that."),
           19, False, GREY)
    return s


def gs_fader():
    s = SVG(1500, 600)
    s.text(750, 44, L("Der Fader: 0 dB (Unity) = Signal unverändert", "The fader: 0 dB (unity) = signal unchanged"), 26)
    # fader track
    tx, top, bot = 330, 100, 560
    marks = [("+10", 0.0), ("+5", 0.10), ("0", 0.25), ("−5", 0.38), ("−10", 0.50), ("−20", 0.66), ("−30", 0.77), ("−40", 0.85), ("−∞", 1.0)]
    def ypos(f): return top + f * (bot - top)
    # working range band
    s.rect(tx - 50, ypos(0.10) - 6, 260, ypos(0.50) - ypos(0.10) + 12, fill="#dcebe2", stroke=GREEN, sw=2, rx=10)
    s.text(tx + 80, ypos(0.36) - 6, L("Arbeits-", "Working"), 20, True, GREEN, anchor="start")
    s.text(tx + 80, ypos(0.36) + 20, L("bereich", "range"), 20, True, GREEN, anchor="start")
    s.rect(tx - 7, top, 14, bot - top, fill="#d8d6cc", stroke=INK, sw=1.5, rx=7)
    for lab, f in marks:
        y = ypos(f)
        s.line(tx - 60, y, tx - 18, y, col=INK, sw=2 if lab != "0" else 4, arrow=False)
        s.line(tx + 18, y, tx + 60, y, col=INK, sw=2 if lab != "0" else 4, arrow=False)
        s.text(tx - 75, y + 8, lab, 22 if lab != "0" else 26, True, RED if lab == "0" else INK, anchor="end")
    # knob at 0
    y0 = ypos(0.25)
    s.rect(tx - 55, y0 - 22, 110, 44, fill=INK, stroke=INK, rx=6)
    s.line(tx - 50, y0, tx + 50, y0, col=BG, sw=3, arrow=False)
    # explanations
    ex = 640
    rows = [
        (L("0 dB = Unity", "0 dB = unity"), L("Der Fader lässt das Signal genau so durch, wie es reinkommt.\nUm 0 dB herum ist die Auflösung am feinsten.",
                                              "The fader passes the signal exactly as it comes in.\nAround 0 dB the resolution is finest."), INK),
        (L("Fader ganz oben (+10) und trotzdem zu leise?", "Fader at the top (+10) and still too quiet?"),
         L("→ Gain zu niedrig. Gain hoch, Fader zurück Richtung 0.", "→ Gain too low. Raise the gain, bring the fader back towards 0."), RED),
        (L("Fader ganz unten (−30 und tiefer) und trotzdem zu laut?", "Fader near the bottom (−30 or lower) and still too loud?"),
         L("→ Gain zu hoch. Gain runter, Fader wieder Richtung 0.", "→ Gain too hot. Lower the gain, bring the fader back towards 0."), RED),
        (L("Master", "Master"), L("Gleiche Regel: Master um 0 dB. Muss er weit runter,\nsind PA-Regler oder Gains zu hoch eingestellt.",
                                   "Same rule: master around 0 dB. If it has to go far down,\nthe PA knobs or the gains are set too high."), INK),
    ]
    y = 130
    for head, body, col in rows:
        s.text(ex, y, head, 23, True, col, anchor="start")
        s.text(ex, y + 32, body, 19, False, INK, anchor="start")
        y += 32 + (body.count("\n") + 1) * 24 + 40
    return s


def gs_prepost():
    s = SVG(1500, 600)
    s.text(750, 44, L("Pre-Fader & Post-Fader: wo das Signal abgezweigt wird", "Pre-fader & post-fader: where the signal is tapped off"), 26)
    y, h = 110, 100
    xs = [(40, 170, L("Eingang", "Input"), None), (270, 170, "Gain", None), (500, 230, L("Gate · Comp · EQ", "Gate · Comp · EQ"), None),
          (850, 170, "Fader", None), (1270, 190, "Master", None)]
    for x, w, t, sub in xs:
        dark = t == "Master"
        s.box(x, y, w, h, t, sub, fill=INK if dark else BG, tcol=BG if dark else INK, tsize=24)
    cy = y + h / 2
    s.line(212, cy, 266, cy); s.line(442, cy, 496, cy)
    s.line(732, cy, 846, cy); s.line(1022, cy, 1266, cy)
    # tap points
    px, qx = 790, 1140
    s.circle(px, cy, 11, fill=RED, stroke=RED); s.circle(qx, cy, 11, fill=INK, stroke=INK)
    s.text(px, cy - 30, "PRE", 18, True, RED); s.text(qx, cy - 30, "POST", 18, True, INK)
    # branches
    s.path(f"M {px} {cy + 12} L {px} 330", col=RED, sw=3)
    s.path(f"M {qx} {cy + 12} L {qx} 330", col=INK, sw=3)
    s.box(px - 200, 335, 330, 110, L("Monitor / In-Ear", "Monitor / in-ear"), L("Pre-Fader-Send", "Pre-fader send"), tsize=24, stroke=RED, sw=3)
    s.box(qx - 165, 335, 330, 110, L("Hall · Effekte", "Reverb · effects"), L("Post-Fader-Send", "Post-fader send"), tsize=24, scol=INK)
    s.text(px - 35, 480, L("bleibt gleich, wenn FOH den Fader bewegt", "stays the same when FOH moves the fader"), 18, True, RED)
    s.text(qx, 480, L("folgt dem Fader", "follows the fader"), 18, True, INK)
    # gain warning
    s.rect(40, 520, 1420, 56, fill="#fbe3e0", stroke=RED, sw=2, rx=10)
    s.text(750, 556, L("Gain sitzt VOR beiden Abzweigungen: Wer den Gain dreht, verändert Saal UND alle Monitor-/In-Ear-Mixe.",
                       "Gain sits BEFORE both taps: turning the gain changes the room AND every monitor/in-ear mix."), 21, True, RED)
    return s


def db_x(db, x0=170, x1=1330, lo=-60, hi=0):
    return x0 + (db - lo) / (hi - lo) * (x1 - x0)


def gs_meter():
    s = SVG(1500, 620)
    s.text(750, 44, L("Das Meter lesen (digital, dBFS)", "Reading the meter (digital, dBFS)"), 26)
    y, h = 150, 46
    zones = [(-60, -18, GREEN), (-18, -6, YELLOW), (-6, 0, RED)]
    for a, b, c in zones:
        s.rect(db_x(a), y, db_x(b) - db_x(a), h, fill=c, stroke=c, sw=1, rx=0)
    s.rect(db_x(-60), y, db_x(0) - db_x(-60), h, fill="none", stroke=INK, sw=2, rx=4)
    # clip box
    s.rect(db_x(0) + 14, y, 110, h, fill=RED, stroke=INK, sw=2, rx=6)
    s.text(db_x(0) + 69, y + 32, "CLIP", 24, True, WHITE)
    for d in [-60, -48, -36, -24, -18, -12, -6, -3, 0]:
        x = db_x(d)
        s.line(x, y + h, x, y + h + 12, col=INK, sw=2, arrow=False)
        s.text(x, y + h + 38, str(d).replace("-", "−"), 20, True, INK)
    # target bracket
    xa, xb = db_x(-18), db_x(-12)
    s.path(f"M {xa} {y - 12} L {xa} {y - 26} L {xb} {y - 26} L {xb} {y - 12}", col=INK, sw=3, arrow=False)
    s.text((xa + xb) / 2, y - 40, L("Ziel für die Spitzen", "Target for peaks"), 20, True, INK)
    s.text(db_x(-39), y - 18, L("grün: sauber, genug Reserve", "green: clean, plenty of headroom"), 18, False, GREEN)
    s.text(db_x(0) + 69, y - 18, L("0 dBFS = Ende", "0 dBFS = the end"), 18, True, RED)
    # peak vs average bars
    by = 330
    s.text(60, by + 30, "Peak", 24, True, INK, anchor="start")
    s.rect(db_x(-60), by, db_x(-14) - db_x(-60), 40, fill=INK, stroke=INK, sw=1, rx=3)
    s.rect(db_x(-11) - 3, by - 6, 6, 52, fill=RED, stroke=RED, sw=1, rx=1)
    s.text(db_x(-11) + 14, by - 12, L("Peak-Hold", "Peak hold"), 17, True, RED, anchor="start")
    s.text(60, by + 110, L("Ø", "Avg"), 24, True, GREY, anchor="start")
    s.text(60, by + 136, "RMS", 16, True, GREY, anchor="start")
    s.rect(db_x(-60), by + 80, db_x(-26) - db_x(-60), 40, fill=GREY, stroke=GREY, sw=1, rx=3)
    s.text(db_x(-24), by + 108, L("Durchschnitt — so laut wirkt es", "Average — how loud it feels"), 19, True, GREY, anchor="start")
    s.text(db_x(-11) + 20, by + 30, L("kurze Spitzen", "short peaks"), 19, True, INK, anchor="start")
    s.text(750, 540, L("Peak = die kurzen Spitzen (wichtig gegen Clipping). Durchschnitt = was wir als Lautstärke hören.",
                       "Peak = the short spikes (what matters for clipping). Average = what we hear as loudness."), 20, False, INK)
    s.text(750, 575, L("Die meisten Pult-Meter zeigen Peaks — deshalb stellst du den Gain nach den Spitzen ein.",
                       "Most console meters show peaks — that's why you set the gain by the peaks."), 20, False, INK)
    return s


def vmeter(s, x, top, bot, peak_db, clip=False, w=70):
    def y(db): return bot - (db + 60) / 60 * (bot - top)
    s.rect(x, top, w, bot - top, fill="#e4e2da", stroke=INK, sw=2, rx=4)
    for a, b, c in [(-60, -18, GREEN), (-18, -6, YELLOW), (-6, 0, RED)]:
        if peak_db <= a: continue
        hi = min(b, peak_db)
        s.rect(x + 4, y(hi), w - 8, y(a) - y(hi), fill=c, stroke=c, sw=0, rx=0)
    s.rect(x, top - 46, w, 32, fill=RED if clip else "#e4e2da", stroke=INK, sw=2, rx=5)
    s.text(x + w / 2, top - 23, "CLIP", 17, True, WHITE if clip else GREY)
    for d in [0, -12, -18, -36, -60]:
        s.text(x - 12, y(d) + 7, str(d).replace("-", "−"), 16, True, INK, anchor="end")
        s.line(x - 8, y(d), x, y(d), col=INK, sw=2, arrow=False)


def wave_pts(x0, w, cy, amp, clip=None, noise=0.0, seed=1, n=420):
    """Polyline points for a speech/music-like waveform (fixed shape, scaled by amp)."""
    import math, random
    rnd = random.Random(seed)
    pts, clipped = [], []
    for i in range(n + 1):
        t = i / n
        env = 0.35 + 0.65 * abs(math.sin(math.pi * (t * 1.6 + 0.1))) * (0.7 + 0.3 * math.sin(9 * t))
        v = env * (0.62 * math.sin(2 * math.pi * 11 * t) + 0.28 * math.sin(2 * math.pi * 27 * t + 1.3)
                   + 0.10 * math.sin(2 * math.pi * 53 * t + 0.4)) / 1.0
        y = v * amp + (rnd.uniform(-1, 1) * noise)
        hit = clip is not None and abs(y) > clip
        if hit: y = clip if y > 0 else -clip
        pts.append((x0 + t * w, cy - y)); clipped.append(hit)
    return pts, clipped


def draw_wave(s, pts, clipped, col=INK, ccol=RED, sw=2.4):
    s.path("M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts), col=col, sw=sw, arrow=False)
    seg = []
    for (x, y), c in zip(pts, clipped):
        if c: seg.append((x, y))
        elif seg:
            if len(seg) > 1: s.path("M " + " L ".join(f"{a:.1f} {b:.1f}" for a, b in seg), col=ccol, sw=6, arrow=False)
            seg = []
    if len(seg) > 1: s.path("M " + " L ".join(f"{a:.1f} {b:.1f}" for a, b in seg), col=ccol, sw=6, arrow=False)


def gs_welle():
    s = SVG(1500, 780)
    s.text(750, 44, L("Was Gain mit der Wellenform macht", "What gain does to the waveform"), 27)
    # --- top: Gain = zoom, same shape bigger
    cy = 175
    p, c = wave_pts(60, 360, cy, 26, seed=3)
    s.rect(40, 95, 400, 160, fill=WHITE, stroke=GREY, sw=1.5, rx=10)
    draw_wave(s, p, c)
    s.text(240, 285, L("Mikrofon: schwaches Signal", "Mic: weak signal"), 20, True, INK)
    s.line(452, cy, 586, cy)
    s.circle(650, cy, 60, fill=INK, stroke=INK)
    s.line(650, cy, 650 + 42 * 0.64, cy - 42 * 0.77, col=BG, sw=5, arrow=False)
    s.text(650, cy + 92, "GAIN", 22, True, INK)
    s.line(714, cy, 848, cy)
    s.rect(860, 95, 600, 160, fill=WHITE, stroke=GREY, sw=1.5, rx=10)
    p, c = wave_pts(880, 560, cy, 60, seed=3)
    draw_wave(s, p, c)
    s.text(1160, 285, L("gleiche Form — nur größer", "same shape — just bigger"), 20, True, INK)
    s.text(750, 345, L("Gain verändert nicht den Klang, sondern nur die Größe der Welle — bevor irgendetwas anderes im Pult passiert.",
                       "Gain doesn't change the sound, only the size of the wave — before anything else happens in the console."), 19, False, GREY)
    # --- bottom: three cases
    panels = [
        (40, 20, None, L("Zu wenig Gain", "Too little gain"), INK,
         L("Welle kaum größer als das Rauschen", "wave barely bigger than the noise"), L("→ später hochdrehen = Rauschen mit", "→ boosting later = noise comes along")),
        (520, 64, None, L("Richtig", "Just right"), GREEN,
         L("groß und sauber, mit Platz nach oben", "big and clean, with room above"), L("→ Headroom bis 0 dBFS", "→ headroom up to 0 dBFS")),
        (1000, 330, 88, L("Zu viel Gain", "Too much gain"), RED,
         L("Spitzen werden abgeschnitten (Clipping)", "peaks get chopped off (clipping)"), L("→ verzerrt, nicht reparierbar", "→ distorted, can't be repaired")),
    ]
    top, h = 420, 220
    for x, amp, clip, title, col, d1, d2 in panels:
        w = 460
        mid = top + h / 2
        s.text(x + w / 2, top - 18, title, 24, True, col)
        s.rect(x, top, w, h, fill=WHITE, stroke=GREY, sw=1.5, rx=10)
        # ceiling lines = 0 dBFS
        for yy in (mid - 88, mid + 88):
            s.line(x + 8, yy, x + w - 8, yy, col=RED, sw=1.6, arrow=False, dash="7,6")
        s.text(x + w - 12, mid - 94, "0 dBFS", 14, True, RED, anchor="end")
        # noise floor band
        s.rect(x + 8, mid - 9, w - 16, 18, fill="#e4e2da", stroke="#e4e2da", sw=0, rx=3)
        p, c = wave_pts(x + 14, w - 28, mid, amp, clip=clip, noise=5, seed=7)
        draw_wave(s, p, c, sw=2)
        s.text(x + w / 2, top + h + 34, d1, 18, True, INK)
        s.text(x + w / 2, top + h + 60, d2, 18, False, GREY)
    s.text(750, 765, L("Grauer Streifen = Grundrauschen · rote Linien = 0 dBFS, die Decke des Pults",
                       "Grey band = noise floor · red lines = 0 dBFS, the console's ceiling"), 18, False, GREY)
    return s


def gs_fehler():
    s = SVG(1500, 600)
    cols = [
        (250, -42, False, L("Zu wenig Gain", "Too little gain"), INK,
         L("rauscht · Fader muss weit hoch\nGate/Kompressor reagieren nicht", "hiss · fader has to go way up\ngate/compressor don't react")),
        (750, -14, False, L("Richtig", "Just right"), GREEN,
         L("Spitzen bei −18 … −12 dBFS\nsauber, mit Reserve", "peaks at −18 … −12 dBFS\nclean, with headroom")),
        (1250, 0, True, L("Zu viel Gain", "Too much gain"), RED,
         L("verzerrt / kratzt · Clip-LED\nnicht mehr reparierbar", "distorts / crackles · clip LED\ncannot be repaired later")),
    ]
    for cx, pk, clip, title, col, desc in cols:
        s.text(cx, 46, title, 28, True, col)
        vmeter(s, cx - 35, 120, 440, pk, clip)
        s.text(cx, 495, desc, 20, False, INK)
    return s


# ---------------------------------------------------------------- DCA & Gruppen
def dca_monitor():
    s = SVG(1500, 620)
    s.text(750, 44, L("Ein DCA bewegt den Kanal-Fader — die Pre-Fader-Monitore merken davon nichts",
                      "A DCA moves the channel fader — pre-fader monitors don't notice"), 25)
    y, h = 200, 100
    s.box(40, y, 200, h, L("Kanal", "Channel"), "Gain · EQ", tsize=24)
    s.box(560, y, 180, h, L("Kanal-\nFader", "Channel\nfader"), tsize=22)
    s.box(1180, y, 260, h, L("Master (Saal)", "Master (room)"), fill=INK, tcol=BG, tsize=24)
    cy = y + h / 2
    s.line(242, cy, 556, cy); s.line(742, cy, 1176, cy)
    px = 420
    s.circle(px, cy, 11, fill=RED, stroke=RED); s.text(px, cy - 26, "PRE", 18, True, RED)
    s.path(f"M {px} {cy + 12} L {px} 440", col=RED)
    s.box(px - 160, 445, 320, 90, L("In-Ear / Monitor", "In-ear / monitor"), tsize=24, stroke=RED, sw=3)
    # DCA
    s.box(560, 70, 180, 70, L("DCA-Fader", "DCA fader"), tsize=22, stroke=RED, sw=3)
    s.line(650, 142, 650, 196, col=RED, sw=3, dash="7,6")
    s.text(668, 178, L("steuert", "controls"), 18, True, RED, anchor="start")
    # results
    s.text(960, 400, L("DCA-Fader runter:", "DCA fader down:"), 22, True, INK, anchor="start")
    s.text(960, 432, L("✓ Saal wird leiser", "✓ room gets quieter"), 20, False, INK, anchor="start")
    s.text(960, 462, L("✓ In-Ear bleibt gleich", "✓ in-ear stays the same"), 20, False, INK, anchor="start")
    s.text(960, 510, L("DCA-Mute:", "DCA mute:"), 22, True, RED, anchor="start")
    s.text(960, 542, L("! Kanäle sind stumm — auf den meisten", "! channels are muted — on most consoles"), 20, False, RED, anchor="start")
    s.text(960, 570, L("  Pulten auch im In-Ear / Monitor", "  in the in-ear / monitor as well"), 20, False, RED, anchor="start")
    return s


def dca_doppelt():
    s = SVG(1500, 520)
    s.line(750, 30, 750, 490, col="#d0cec4", sw=2, arrow=False)
    s.text(375, 50, L("Falsch: doppelt geroutet", "Wrong: routed twice"), 27, True, RED)
    s.text(1125, 50, L("Richtig: nur über die Gruppe", "Right: only via the group"), 27, True, GREEN)
    for off, wrong in [(0, True), (750, False)]:
        s.box(40 + off, 200, 170, 90, L("Kanal", "Channel"), tsize=24)
        s.box(300 + off, 90, 170, 90, L("Gruppe", "Group"), "EQ · Comp", tsize=24)
        s.box(540 + off, 200, 170, 90, "Master", fill=INK, tcol=BG, tsize=24)
        s.path(f"M {212 + off} 230 L {296 + off} 150")
        s.path(f"M {472 + off} 135 L {536 + off} 225")
        if wrong:
            s.path(f"M {212 + off} 260 L {536 + off} 260", col=RED, sw=3.5)
            s.text(375 + off, 300, L("Kanal → Master direkt", "channel → master direct"), 18, True, RED)
            s.text(375 + off, 380, L("Das Signal kommt zweimal an:", "The signal arrives twice:"), 21, True, INK)
            s.text(375 + off, 412, L("lauter als gedacht, Klang verfärbt,", "louder than expected, colouration,"), 20, False, INK)
            s.text(375 + off, 440, L("Gruppen-Fader regelt nicht richtig.", "the group fader doesn't control it properly."), 20, False, INK)
        else:
            s.path(f"M {212 + off} 260 L {536 + off} 260", col="#c9c7bd", sw=3, arrow=False, dash="8,8")
            s.text(375 + off, 300, L("Kanal → Master: AUS", "channel → master: OFF"), 18, True, GREEN)
            s.text(375 + off, 380, L("Kanal nur auf die Gruppe routen,", "Route the channel only to the group,"), 21, True, INK)
            s.text(375 + off, 412, L("die Gruppe geht auf den Master.", "the group goes to the master."), 20, False, INK)
            s.text(375 + off, 440, L("Ein Weg — ein Fader regelt alles.", "One path — one fader controls it all."), 20, False, INK)
    return s


def dca_hall():
    s = SVG(1500, 560)
    s.line(750, 30, 750, 530, col="#d0cec4", sw=2, arrow=False)
    s.text(375, 50, L("Gruppen-Fader runter", "Group fader down"), 27, True, INK)
    s.text(1125, 50, L("DCA-Fader runter", "DCA fader down"), 27, True, INK)
    # left: group
    o = 0
    s.box(40, 200, 160, 90, L("Kanal", "Channel"), tsize=24)
    s.box(300, 100, 170, 80, L("Gruppe", "Group"), L("Fader unten", "fader down"), tsize=22, stroke=GREY)
    s.box(300, 310, 170, 80, L("Hall", "Reverb"), L("Post-Send", "post send"), tsize=22, scol=INK)
    s.box(560, 200, 160, 90, "Master", fill=INK, tcol=BG, tsize=24)
    s.path("M 202 230 L 296 150"); s.path("M 202 260 L 296 345")
    s.path("M 472 140 L 556 225", col="#c9c7bd", dash="8,8")
    s.path("M 472 350 L 556 265", col=RED, sw=3.5)
    s.text(375, 450, L("Trockenes Signal weg —", "Dry signal gone —"), 21, True, INK)
    s.text(375, 482, L("aber der Hall ist noch zu hören!", "but the reverb is still audible!"), 21, True, RED)
    # right: DCA
    o = 750
    s.box(40 + o, 200, 160, 90, L("Kanal", "Channel"), L("Fader ↓", "fader ↓"), tsize=24)
    s.box(40 + o, 80, 160, 70, "DCA", tsize=24, stroke=RED, sw=3)
    s.line(120 + o, 152, 120 + o, 196, col=RED, dash="7,6")
    s.box(300 + o, 310, 170, 80, L("Hall", "Reverb"), L("Post-Send", "post send"), tsize=22, scol=INK)
    s.box(560 + o, 200, 160, 90, "Master", fill=INK, tcol=BG, tsize=24)
    s.path(f"M {202 + o} 245 L {556 + o} 245", col="#c9c7bd", dash="8,8")
    s.path(f"M {202 + o} 265 L {296 + o} 345", col="#c9c7bd", dash="8,8")
    s.path(f"M {472 + o} 350 L {556 + o} 268", col="#c9c7bd", dash="8,8")
    s.text(375 + o, 450, L("Kanal-Fader geht mit runter —", "The channel fader goes down —"), 21, True, INK)
    s.text(375 + o, 482, L("Signal UND Hall werden leiser.", "signal AND reverb get quieter."), 21, True, GREEN)
    return s


# ---------------------------------------------------------------- Kein Ton
def kt_flow():
    s = SVG(1500, 800)
    s.box(600, 30, 300, 70, L("Kein Ton!", "No sound!"), fill=RED, stroke=RED, tcol=WHITE, tsize=30)
    s.line(750, 102, 750, 146)
    s.diamond(750, 230, 520, 160, L("Zeigt das KANAL-Meter\nein Signal?", "Does the CHANNEL meter\nshow a signal?"), 23)
    # no -> left
    s.path("M 490 230 L 270 230 L 270 386")
    s.text(380, 218, L("NEIN", "NO"), 22, True, RED)
    s.box(40, 390, 460, 250, L("Eingangsseite", "Input side"),
          L("Quelle an? Lautstärke am Instrument?\nFunk: Akku, Mute-Schalter, Empfänger\nKabel richtig & eingerastet?\nRichtiger Eingang laut Patchliste?\nInput-Patch im Pult · 48 V · Gain",
            "Source on? Volume on the instrument?\nWireless: battery, mute switch, receiver\nCable correct & locked in?\nRight input per patch list?\nInput patch in the desk · 48 V · gain"),
          tsize=26, ssize=19, scol=INK)
    # yes -> down
    s.line(750, 312, 750, 386)
    s.text(782, 356, L("JA", "YES"), 22, True, GREEN, anchor="start")
    s.diamond(750, 470, 520, 160, L("Zeigt das MASTER-Meter\nein Signal?", "Does the MASTER meter\nshow a signal?"), 23)
    s.path("M 750 552 L 750 600")
    s.text(782, 585, L("NEIN", "NO"), 22, True, RED, anchor="start")
    s.box(560, 604, 380, 170, L("Im Pult", "Inside the desk"),
          L("Kanal-Mute · Fader · DCA\nMute-Gruppe · Routing auf Main\nMaster-Mute / -Fader",
            "Channel mute · fader · DCA\nmute group · routing to main\nmaster mute / fader"), tsize=26, ssize=19, scol=INK)
    s.path("M 1010 470 L 1230 470 L 1230 386")
    s.text(1120, 458, L("JA", "YES"), 22, True, GREEN)
    s.box(1030, 130, 440, 250, L("Ausgangsseite", "Output side"),
          L("Output-Patch (Main → richtiger Ausgang)\nKabel Pult/Stagebox → Box/Endstufe\nBox / Endstufe an? Strom? LEDs?\nLautstärke-Regler an der Box\nProtect-/Clip-LED an der Endstufe",
            "Output patch (main → correct output)\nCable desk/stagebox → speaker/amp\nSpeaker / amp on? Power? LEDs?\nVolume knob on the speaker\nProtect/clip LED on the amp"),
          tsize=26, ssize=19, scol=INK)
    s.text(1230, 700, L("Tipp: Mit Kopfhörer + PFL/Solo", "Tip: use headphones + PFL/solo"), 19, True, GREY)
    s.text(1230, 726, L("hörst du jeden Kanal direkt vor.", "to listen to any channel directly."), 19, False, GREY)
    return s


def kt_kette():
    s = SVG(1500, 470)
    s.text(750, 42, L("Dem Signal folgen: von vorne nach hinten prüfen", "Follow the signal: check from front to back"), 26)
    steps = [
        (L("Quelle", "Source"), L("an? laut genug? Akku?", "on? loud enough? battery?")),
        (L("Kabel / DI", "Cable / DI"), L("steckt? richtig herum?", "plugged in? right way?")),
        (L("Eingang & Patch", "Input & patch"), L("laut Patchliste?", "per patch list?")),
        ("48 V", L("bei Kondensator / aktiver DI", "condenser / active DI")),
        (L("Gain & Meter", "Gain & meter"), L("kommt etwas an?", "is anything arriving?")),
        (L("Mute · Fader · DCA", "Mute · fader · DCA"), L("alles offen?", "everything open?")),
        (L("Routing / Bus", "Routing / bus"), L("auf Main / Mix?", "to main / mix?")),
        ("Master", L("Mute? Fader?", "mute? fader?")),
        (L("Output-Patch", "Output patch"), L("richtiger Ausgang?", "correct output?")),
        (L("Box / Endstufe", "Speaker / amp"), L("Strom? Regler? LEDs?", "power? knob? LEDs?")),
    ]
    w, gap, x0 = 240, 50, 50
    for i, (t, sub) in enumerate(steps):
        row = i // 5
        col = i % 5 if row == 0 else 4 - (i % 5)
        x = x0 + col * (w + gap)
        y = 90 if row == 0 else 280
        s.box(x, y, w, 120, t, sub, tsize=23, ssize=16, scol=GREY)
        s.circle(x + 2, y + 2, 18, fill=RED, stroke=BG, sw=3)
        s.text(x + 2, y + 9, str(i + 1), 18, True, WHITE)
        if i < len(steps) - 1:
            if i == 4:
                s.line(x + w / 2, y + 122, x + w / 2, 276)
            elif row == 0:
                s.line(x + w + 2, y + 60, x + w + gap - 4, y + 60)
            else:
                s.line(x - 2, y + 60, x - gap + 4, y + 60)
    s.text(750, 448, L("Signal da → weiter zum nächsten Punkt. Signal weg → der Fehler liegt zwischen dem letzten guten und diesem Punkt.",
                       "Signal present → go to the next point. Signal gone → the fault is between the last good point and this one."), 19, False, GREY)
    return s


# ---------------------------------------------------------------- Soundcheck
def sc_ablauf():
    s = SVG(1500, 470)
    s.text(750, 44, L("Soundcheck in 7 Schritten", "Soundcheck in 7 steps"), 28)
    steps = [
        (L("Vorbereiten", "Prepare"), L("Szene laden\nPA-Check\nAkkus", "load scene\nPA check\nbatteries")),
        ("Line-Check", L("jeder Kanal\nkommt an?", "does every\nchannel arrive?")),
        (L("Gain & Klang", "Gain & tone"), L("jede Quelle\neinzeln", "each source\non its own")),
        (L("Monitore", "Monitors"), L("In-Ears &\nWedges", "in-ears &\nwedges")),
        (L("Band zusammen", "Full band"), L("ein Song\nSaal-Mix", "one song\nroom mix")),
        (L("Sprache", "Speech"), L("Predigt &\nModeration", "sermon &\nhosting")),
        (L("Speichern", "Save"), L("Szene sichern\nMikros muten", "save scene\nmute mics")),
    ]
    n = len(steps); x0, x1, y = 120, 1380, 170
    s.line(x0, y, x1, y, col=INK, sw=4, arrow=False)
    for i, (t, sub) in enumerate(steps):
        x = x0 + i * (x1 - x0) / (n - 1)
        last = i == n - 1
        s.circle(x, y, 38, fill=RED if last else INK, stroke=RED if last else INK)
        s.text(x, y + 12, str(i + 1), 32, True, WHITE)
        s.text(x, y + 90, t, 23, True, INK)
        s.text(x, y + 128, sub, 19, False, GREY)
    s.text(750, 440, L("Erst prüfen, ob alles ankommt — dann einstellen — dann sichern.",
                       "First check everything arrives — then set it up — then save."), 21, True, RED)
    return s


def sc_reihenfolge():
    s = SVG(1500, 330)
    s.text(750, 44, L("Reihenfolge beim Gain-Einstellen: vom Fundament nach oben", "Order for setting gain: from the foundation up"), 26)
    items = [("Drums", "Kick · Snare\nToms · OH"), ("Bass", "DI / Amp"), ("Keys", "L / R"),
             (L("Gitarren", "Guitars"), L("E- & Akustik", "electric & acoustic")),
             ("Playback", L("Laptop · Musik", "laptop · music")), ("Vocals", "Lead → Backing"),
             (L("Sprache", "Speech"), L("Predigt · Funk", "sermon · wireless"))]
    w, gap, x0 = 180, 30, 30
    for i, (t, sub) in enumerate(items):
        x = x0 + i * (w + gap)
        s.box(x, 110, w, 110, t, sub, tsize=24, ssize=15, scol=GREY)
        if i < len(items) - 1:
            s.line(x + w + 2, 165, x + w + gap - 4, 165, sw=2.5)
    s.text(750, 280, L("Jede Quelle allein, in Gottesdienst-Lautstärke — am lautesten Teil des Songs.",
                       "Each source on its own, at service volume — at the loudest part of the song."), 21, False, INK)
    return s


# ---------------------------------------------------------------- Lautstärke
def spl_x(db): return 150 + (db - 40) / 80 * 1200


def ls_skala():
    s = SVG(1500, 580)
    s.text(750, 44, L("Wie laut ist laut? — Schallpegel in dB(A)", "How loud is loud? — sound level in dB(A)"), 27)
    y, h = 275, 50
    for a, b, c in [(40, 80, GREEN), (80, 90, YELLOW), (90, 100, ORANGE), (100, 120, RED)]:
        s.rect(spl_x(a), y, spl_x(b) - spl_x(a), h, fill=c, stroke=c, sw=0, rx=0)
    s.rect(spl_x(40), y, spl_x(120) - spl_x(40), h, fill="none", stroke=INK, sw=2, rx=4)
    for d in range(40, 121, 10):
        s.line(spl_x(d), y + h, spl_x(d), y + h + 12, col=INK, sw=2, arrow=False)
        s.text(spl_x(d), y + h + 40, str(d), 21, True, INK)
    # KAC targets above
    def target(a, b, yy, label, col):
        s.rect(spl_x(a), yy - 14, spl_x(b) - spl_x(a), 28, fill=col, stroke=INK, sw=2, rx=8)
        s.text(spl_x(a) - 14, yy + 7, label, 19, True, INK, anchor="end")
        s.text(spl_x(b) + 14, yy + 7, f"{a}–{b}", 19, True, GREY, anchor="start")
    target(65, 75, 135, L("Musik vorher", "Pre-service music"), "#c9c7bd")
    target(70, 80, 180, L("Predigt / Sprache", "Sermon / speech"), "#c9c7bd")
    target(80, 92, 225, L("Lobpreis (Band)", "Worship (band)"), INK)
    s.text(spl_x(40), 90, L("Unsere Richtwerte (Vorschlag, gemessen am FOH):", "Our guide values (suggestion, measured at FOH):"), 20, True, INK, anchor="start")
    # references below
    refs = [(45, L("ruhiger\nRaum", "quiet\nroom")), (60, L("Gespräch", "conversation")),
            (85, L("ab hier: lange\nDauer = Risiko", "from here: long\nexposure = risk")),
            (99, L("Grenzwert\nKonzerte (DE)", "limit for\nconcerts (DE)")),
            (110, L("Rockkonzert\nvorne", "rock concert\nfront row")), (120, L("Schmerz-\ngrenze", "pain\nthreshold"))]
    for d, lab in refs:
        x = spl_x(d)
        s.line(x, y + h + 56, x, y + h + 80, col=GREY, sw=2, arrow=False)
        s.text(x, y + h + 106, lab, 18, d in (85, 99), RED if d in (85, 99) else GREY)
    s.text(750, 545, L("+3 dB = doppelte Schallenergie · +10 dB ≈ doppelt so laut empfunden",
                       "+3 dB = double the sound energy · +10 dB ≈ perceived as twice as loud"), 21, True, INK)
    return s


def ls_zeit():
    s = SVG(1500, 550)
    s.text(750, 44, L("Wie lange ist es sicher? (pro Tag, ohne Gehörschutz)", "How long is it safe? (per day, without hearing protection)"), 26)
    data = [(85, 480, "8 h"), (88, 240, "4 h"), (91, 120, "2 h"), (94, 60, "1 h"), (97, 30, "30 min"), (100, 15, "15 min")]
    cols = [GREEN, YELLOW, YELLOW, ORANGE, ORANGE, RED]
    y = 90
    for (db, mins, lab), c in zip(data, cols):
        s.text(200, y + 38, f"{db} dB(A)", 24, True, INK, anchor="end")
        w = 1050 * mins / 480
        s.rect(230, y + 10, w, 42, fill=c, stroke=c, sw=0, rx=4)
        s.text(230 + w + 14, y + 40, lab, 22, True, INK, anchor="start")
        y += 62
    s.text(750, 520, L("Faustregel: je +3 dB halbiert sich die sichere Zeit (Richtwert nach NIOSH).",
                       "Rule of thumb: every +3 dB halves the safe time (NIOSH guideline)."), 21, True, RED)
    return s


FIGS = {
    "gs_welle": gs_welle, "gs_kette": gs_kette, "gs_fader": gs_fader, "gs_prepost": gs_prepost, "gs_meter": gs_meter, "gs_fehler": gs_fehler,
    "dca_monitor": dca_monitor, "dca_doppelt": dca_doppelt, "dca_hall": dca_hall,
    "kt_flow": kt_flow, "kt_kette": kt_kette,
    "sc_ablauf": sc_ablauf, "sc_reihenfolge": sc_reihenfolge,
    "ls_skala": ls_skala, "ls_zeit": ls_zeit,
}

for name, fn in FIGS.items():
    for lang in ("de", "en"):
        LANG = lang
        s = fn()
        fn_out = os.path.join(OUT, f"KAC_{name}{'_EN' if lang == 'en' else ''}.svg")
        with open(fn_out, "w", encoding="utf-8") as f:
            f.write(s.svg())
        if lang == "de":
            print(name, f"{s.w} / {s.h}")

"""
Synthesize Pencilmark's sound effects (original, license-free) into assets/sounds/*.wav.

Soft, short, low-volume sounds that suit a calm puzzle game: a woody tap for selection, a pencil-like
"tock" for placing a digit, a gentle low thud for an error, a soft paper swish for erase/notes, and a
warm three-note chime for completion. 22.05 kHz mono 16-bit PCM keeps each file a few KB.

Run: python scripts/make-sounds.py
"""
import math
import os
import random
import struct
import wave

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


def write(name, samples, gain=0.5):
    os.makedirs(OUT, exist_ok=True)
    peak = max(1e-9, max(abs(s) for s in samples))
    scale = gain / peak
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s * scale)) * 32767)) for s in samples))


def env(i, n, attack=0.004, decay=8.0):
    t = i / RATE
    a = min(1.0, t / attack) if attack > 0 else 1.0
    return a * math.exp(-decay * t / (n / RATE))


def tone(freqs, dur, decay=6.0, attack=0.004, partials=((1, 1.0),)):
    n = int(RATE * dur)
    out = []
    for i in range(n):
        t = i / RATE
        s = 0.0
        for f in freqs:
            for mult, amp in partials:
                s += amp * math.sin(2 * math.pi * f * mult * t)
        out.append(s * env(i, n, attack, decay))
    return out


def noise(dur, decay=10.0, lp=0.15, seed=7):
    rnd = random.Random(seed)
    n = int(RATE * dur)
    out, y = [], 0.0
    for i in range(n):
        y += lp * (rnd.uniform(-1, 1) - y)  # one-pole low-pass: soft, papery
        out.append(y * env(i, n, 0.002, decay))
    return out


def mix(*tracks):
    n = max(len(t) for t in tracks)
    return [sum(t[i] if i < len(t) else 0.0 for t in tracks) for i in range(n)]


def offset(track, seconds):
    return [0.0] * int(RATE * seconds) + track


# Woody tap: short high partial stack, very quick decay.
write('tap.wav', tone([1180], 0.06, decay=7, partials=((1, 1), (2.7, 0.35))), gain=0.28)
# Pencil "tock": a lower body plus a tiny noise transient.
write('place.wav', mix(tone([660], 0.12, decay=6, partials=((1, 1), (2.0, 0.3), (3.1, 0.12))), noise(0.03, decay=6, lp=0.5)), gain=0.4)
# Soft error: low, rounded, two close tones (never harsh).
write('error.wav', tone([196, 207.6], 0.22, decay=5, partials=((1, 1), (2, 0.2))), gain=0.35)
# Erase / notes swish: filtered noise.
write('erase.wav', noise(0.14, decay=5, lp=0.08), gain=0.3)
# Completion chime: C5, E5, G5 arpeggio with gentle bell partials.
bell = ((1, 1), (2.0, 0.25), (3.0, 0.1))
write(
    'complete.wav',
    mix(
        tone([523.25], 1.1, decay=4, partials=bell),
        offset(tone([659.25], 1.0, decay=4, partials=bell), 0.12),
        offset(tone([783.99], 0.9, decay=3.5, partials=bell), 0.24),
    ),
    gain=0.45,
)
print('wrote', sorted(os.listdir(OUT)))

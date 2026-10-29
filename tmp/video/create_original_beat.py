import wave
import numpy as np

SR = 48000
DURATION = 15.0
N = int(SR * DURATION)
TEMPO = 108.0
BEAT = 60.0 / TEMPO
rng = np.random.default_rng(20261029)

left = np.zeros(N, dtype=np.float64)
right = np.zeros(N, dtype=np.float64)


def add(signal, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    count = min(len(signal), N - i)
    # equal-power stereo pan
    lg = np.cos((pan + 1.0) * np.pi / 4.0)
    rg = np.sin((pan + 1.0) * np.pi / 4.0)
    left[i:i + count] += signal[:count] * gain * lg
    right[i:i + count] += signal[:count] * gain * rg


def kick(length=0.42):
    t = np.arange(int(SR * length)) / SR
    phase = 2 * np.pi * (48 * t + (150 - 48) * (1 - np.exp(-t * 28)) / 28)
    body = np.sin(phase) * np.exp(-t * 9.5)
    click = rng.normal(0, 1, len(t)) * np.exp(-t * 85)
    return 0.95 * body + 0.12 * click


def snare(length=0.30):
    t = np.arange(int(SR * length)) / SR
    noise = rng.normal(0, 1, len(t))
    # remove some low-frequency energy without scipy
    smooth = np.convolve(noise, np.ones(20) / 20, mode="same")
    bright = noise - smooth
    tone = np.sin(2 * np.pi * 185 * t) + 0.45 * np.sin(2 * np.pi * 330 * t)
    return (0.55 * bright * np.exp(-t * 15) + 0.34 * tone * np.exp(-t * 19))


def hat(open_hat=False):
    length = 0.22 if open_hat else 0.075
    t = np.arange(int(SR * length)) / SR
    noise = rng.normal(0, 1, len(t))
    smooth = np.convolve(noise, np.ones(8) / 8, mode="same")
    bright = noise - smooth
    decay = 18 if open_hat else 60
    return bright * np.exp(-t * decay)


def bass(freq, length=0.48):
    t = np.arange(int(SR * length)) / SR
    glide = freq * (1.06 - 0.06 * np.minimum(t / 0.08, 1))
    phase = 2 * np.pi * np.cumsum(glide) / SR
    sub = np.sin(phase)
    harmonic = 0.22 * np.sin(2 * phase) + 0.10 * np.sin(3 * phase)
    env = (1 - np.exp(-t * 45)) * np.exp(-t * 2.7)
    return (sub + harmonic) * env


def pluck(freqs, length=0.55):
    t = np.arange(int(SR * length)) / SR
    x = np.zeros_like(t)
    for f in freqs:
        x += np.sin(2 * np.pi * f * t) + 0.22 * np.sin(4 * np.pi * f * t)
    x /= len(freqs)
    env = (1 - np.exp(-t * 90)) * np.exp(-t * 7.5)
    return x * env


k = kick()
s = snare()
closed_hat = hat(False)
open_hat = hat(True)

# Four-beat drum patterns with syncopated kicks.
bar = 4 * BEAT
for bar_start in np.arange(0, DURATION + bar, bar):
    for pos, gain in [(0, 1.0), (1.5, 0.76), (2.0, 0.94), (3.25, 0.72)]:
        add(k, bar_start + pos * BEAT, gain=0.78)
    for pos in (1.0, 3.0):
        add(s, bar_start + pos * BEAT, gain=0.40)
    # 8th-note hats, with a quick roll before beat 4.
    for step in range(8):
        pos = step * 0.5
        add(closed_hat, bar_start + pos * BEAT, gain=0.095 if step % 2 == 0 else 0.07,
            pan=-0.35 if step % 2 == 0 else 0.35)
    for pos in (2.75, 2.875):
        add(closed_hat, bar_start + pos * BEAT, gain=0.065, pan=0.45)
    add(open_hat, bar_start + 3.5 * BEAT, gain=0.055, pan=0.25)

# D-minor bass progression: D, Bb, C, A with rhythmic repeats.
bass_notes = [73.42, 58.27, 65.41, 55.00]
for bar_index, bar_start in enumerate(np.arange(0, DURATION, bar)):
    root = bass_notes[bar_index % len(bass_notes)]
    for pos, ratio, gain in [(0, 1.0, 0.42), (1.5, 1.0, 0.30), (2, 1.5, 0.34), (3.25, 1.0, 0.28)]:
        add(bass(root * ratio), bar_start + pos * BEAT, gain=gain)

# Sparse chord plucks for some air above the drums.
chords = [
    (293.66, 349.23, 440.00),  # Dm
    (233.08, 293.66, 349.23),  # Bb
    (261.63, 329.63, 392.00),  # C
    (220.00, 261.63, 329.63),  # Am
]
for bar_index, bar_start in enumerate(np.arange(0, DURATION, bar)):
    chord = chords[bar_index % len(chords)]
    add(pluck(chord), bar_start + 0.5 * BEAT, gain=0.12, pan=-0.32)
    add(pluck(tuple(f * 2 for f in chord), length=0.34), bar_start + 2.5 * BEAT, gain=0.07, pan=0.36)

# Short fade in/out and soft saturation.
fade = int(SR * 0.08)
left[:fade] *= np.linspace(0, 1, fade)
right[:fade] *= np.linspace(0, 1, fade)
fade_out = int(SR * 0.35)
left[-fade_out:] *= np.linspace(1, 0, fade_out)
right[-fade_out:] *= np.linspace(1, 0, fade_out)
left = np.tanh(left * 1.35)
right = np.tanh(right * 1.35)

peak = max(np.max(np.abs(left)), np.max(np.abs(right)), 1e-9)
scale = 0.92 / peak
stereo = np.column_stack((left * scale, right * scale))
pcm = (stereo * 32767).astype("<i2")

out = "/Users/nwork/csr/tmp/video/original_beat_15s.wav"
with wave.open(out, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(pcm.tobytes())
print(out)

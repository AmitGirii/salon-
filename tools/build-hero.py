"""
Builds the hero film from the salon's commercial.

    python tools/build-hero.py <ffmpeg> "<source.mp4>" public/media

Produces:
    hero-desktop.mp4     1920x1080 H.264   (Safari, and the universal fallback)
    hero-desktop.webm    1920x1080 VP9     (Chrome/Firefox/Edge pick this: ~30% smaller)
    hero-mobile.mp4       720x1280 H.264   (9:16 centre crop, for phones)
    hero-poster.jpg / hero-poster-sm.jpg / hero-poster-mobile.jpg
                         the first frame of each edit, so the poster->video
                         handover is pixel-identical

WHAT THE EDIT IS
----------------
The source ("Final3 (3).mp4", 45 s, 1080p30) is the salon's own commercial.
It contains a receptionist at 2.9-4.0 s, a hand holding the door at
1.3-1.8 s, a hard cut to black at 26.5 s, a staff lineup from 33.2 s to the
closing title card at 43.9 s, plus a QR-sign insert, two SHILLS product
inserts and the exterior signboard.

None of that belongs in a looping interior hero, and none of the people can be
removed cleanly by inpainting - a lineup of ten walking across the whole
frame is not a job for a clean-plate reconstruction. So the edit takes only
the shots with nobody in them, in walk-through order, cross-fades them, and
loops back on the original editor's own cut (waiting area -> styling room),
which hides the loop seam as just another cut.

THE WATERMARK
-------------
A circular badge is burned into the top-right of every source frame. It is
removed by `tools/inpaint-badge.py`, which inpaints only the badge's own disc
(OpenCV Telea) and writes a small lossless stream of that corner; this script
overlays it back. ffmpeg's `delogo` was tried first and rejected: it fills a
rectangle by linear interpolation from its edges, and a bright LED line on the
top edge was dragged down through the box as a faint vertical streak. The
disc inpaint touches nothing outside the badge's outline. The corner stream is
cached under node_modules/.cache/hero/ and rebuilt if missing.

Colour is left alone bar a 4% contrast lift. No warmth, no saturation - the
room supplies its own.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PATCH = os.path.join(ROOT, "node_modules", ".cache", "hero", "badge-patch.mkv")

# Must match X0/Y0 in inpaint-badge.py.
PATCH_X, PATCH_Y = 1580, 0

# (start, end) in source seconds.
SHOTS = [
    (6.87, 9.97),    # styling room: push in from the doorway to the oval mirrors (opener)
    (9.97, 11.60),   # styling wall, second angle
    (11.60, 14.63),  # corridor of LED strips to the doorway
    (14.63, 16.90),  # diamond ceiling figure, tilt down to the floor
    (16.90, 20.13),  # L'Oreal wall
    (20.13, 21.70),  # wash bay
    (21.70, 23.10),  # product still life
    (23.10, 26.45),  # Nail Art wall (stops before the black dip at 26.5)
    (27.40, 28.87),  # nail room wide
    (30.10, 33.15),  # makeup room, long mirror
    (5.07, 6.87),    # waiting area: calm closer that loops into the opener
]
FADE = 0.5
GRADE = "eq=contrast=1.04:saturation=0.98"


def ensure_patch(ff, src):
    if os.path.exists(PATCH):
        return
    os.makedirs(os.path.dirname(PATCH), exist_ok=True)
    subprocess.run([sys.executable, os.path.join(HERE, "inpaint-badge.py"), ff, src, PATCH], check=True)


def graph(variant):
    # Put the inpainted corner back, then grade.
    pre = f"[0:v][1:v]overlay=x={PATCH_X}:y={PATCH_Y}:eof_action=pass,{GRADE}"
    if variant == "mobile":
        # 9:16 centre crop at source height, then 720x1280.
        pre += ",crop=608:1080:656:0,scale=720:1280:flags=lanczos,setsar=1"
    n = len(SHOTS)
    parts = [f"{pre},split={n}" + "".join(f"[c{i}]" for i in range(n))]
    for i, (a, b) in enumerate(SHOTS):
        parts.append(f"[c{i}]trim=start={a}:end={b},setpts=PTS-STARTPTS[s{i}]")
    durs = [b - a for a, b in SHOTS]
    prev, running = "s0", durs[0]
    for i in range(1, n):
        off = running - FADE
        label = f"x{i}" if i < n - 1 else "merged"
        parts.append(f"[{prev}][s{i}]xfade=transition=fade:duration={FADE}:offset={off:.3f}[{label}]")
        prev, running = label, off + durs[i]
    parts.append("[merged]format=yuv420p[v]")
    return ";".join(parts), running


def encode(ff, src, out, variant):
    g, length = graph(variant)
    if out.endswith(".webm"):
        codec = ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "33", "-row-mt", "1",
                 "-deadline", "good", "-cpu-used", "2"]
    else:
        crf = "24" if variant == "desktop" else "25"
        codec = ["-c:v", "libx264", "-preset", "slow", "-crf", crf, "-profile:v", "high",
                 "-level", "4.1", "-movflags", "+faststart"]
    cmd = [ff, "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-i", PATCH,
           "-filter_complex", g, "-map", "[v]", "-an", "-r", "30", "-g", "60",
           "-keyint_min", "60"] + codec + [out]
    print("encoding %s (edit length ~%.1f s)" % (os.path.basename(out), length))
    subprocess.run(cmd, check=True)


def poster(ff, video, out, scale=None):
    vf = ["-vf", f"scale={scale}:-2"] if scale else []
    subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", video,
                    "-frames:v", "1"] + vf + ["-q:v", "3", out], check=True)
    print("wrote", os.path.basename(out))


def main():
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    ff, src, outdir = sys.argv[1:4]
    os.makedirs(outdir, exist_ok=True)
    ensure_patch(ff, src)
    d_mp4 = os.path.join(outdir, "hero-desktop.mp4")
    d_webm = os.path.join(outdir, "hero-desktop.webm")
    m_mp4 = os.path.join(outdir, "hero-mobile.mp4")
    encode(ff, src, d_mp4, "desktop")
    encode(ff, src, d_webm, "desktop")
    encode(ff, src, m_mp4, "mobile")
    poster(ff, d_mp4, os.path.join(outdir, "hero-poster.jpg"))
    poster(ff, d_mp4, os.path.join(outdir, "hero-poster-sm.jpg"), scale=960)
    poster(ff, m_mp4, os.path.join(outdir, "hero-poster-mobile.jpg"))


if __name__ == "__main__":
    main()

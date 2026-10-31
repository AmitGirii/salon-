"""
Animated-image fallbacks for the two films.

Some phones refuse to autoplay ANY video — an iPhone in Low Power Mode is the
common one — and no page can override that. They do, however, still animate
images. So each film also ships as an animated AVIF (small, real video
compression; iOS 16.4+, Chrome, Firefox) with an animated WebP behind it for
older iOS. The page shows one only when the browser has actually refused
`play()`, so nobody else downloads them.

Usage:
    python tools/build-fallbacks.py <ffmpeg> public/media

The sources are the shipped films themselves, so this runs after build-hero.py.
"""
import os
import subprocess
import sys

FFMPEG, OUT = sys.argv[1], sys.argv[2]

# (source, stem, filter, avif crf, webp quality)
#
# Frame rates and sizes are chosen for the one screen these ever appear on: a
# phone that is trying to save power. 12 fps reads as motion; 480 px across a
# 9:16 phone screen, under the page's grade, reads as the film.
JOBS = [
    ('hero-mobile.mp4', 'hero-mobile', 'fps=12,scale=480:-2:flags=lanczos', 34, 60),
    ('hero-desktop.mp4', 'hero-desktop', 'fps=12,scale=640:-2:flags=lanczos', 34, 60),
    ('intro-badge.mp4', 'intro-badge', 'fps=15,scale=448:-2:flags=lanczos', 30, 70),
]


def run(args):
    print('  $', ' '.join(a if ' ' not in a else f'"{a}"' for a in args[1:]))
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


for src, stem, vf, crf, q in JOBS:
    inp = os.path.join(OUT, src)
    avif = os.path.join(OUT, stem + '.avif')
    webp = os.path.join(OUT, stem + '.webp')
    print(stem)
    run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-i', inp, '-an', '-vf', vf,
         '-c:v', 'libaom-av1', '-crf', str(crf), '-b:v', '0', '-cpu-used', '6', '-row-mt', '1',
         '-pix_fmt', 'yuv420p', '-loop', '0', '-f', 'avif', avif])
    run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-i', inp, '-an', '-vf', vf,
         '-c:v', 'libwebp_anim', '-lossless', '0', '-q:v', str(q), '-compression_level', '6',
         '-loop', '0', webp])
    for p in (avif, webp):
        print(f'  {os.path.basename(p):24s} {os.path.getsize(p) / 1048576:.2f} MB')
print('done')

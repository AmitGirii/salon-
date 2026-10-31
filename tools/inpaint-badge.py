"""
Removes the circular badge burned into the top-right of the salon commercial.

    python tools/inpaint-badge.py <ffmpeg> "<source.mp4>" <patch.mkv>

Three fills were compared on a flat wall, a wall with gold inlay lines, and a
frame with an LED strip crossing the corner:

  ffmpeg `delogo`   fills a rectangle by linear interpolation from its edges.
                    A bright LED line on the top edge is dragged straight
                    down through the box as a faint vertical streak.
  OpenCV Telea/NS   fast-marching inpainting. Leaves a radial "pinwheel"
                    converging on the disc centre - visible as a ghost disc on
                    a flat cream wall - and drags a crossing line into a wedge.
  push-pull         a pyramid of known-pixel averages pulled back up into the
                    hole: a diffusion-style fill with no marching order and no
                    edge to streak from. Invisible on flat plaster; a crossing
                    line dissolves softly into the disc instead of wedging.

Push-pull is what ships, with a gentle blur inside the disc to take out any
pyramid blockiness. Only the badge's own disc is replaced - it is located
automatically on two bright reference frames, which must agree - and the paste
feathers OUTWARD from the disc edge, so no badge pixel can ever bleed back in.

The result is a small lossless video of just the corner, frame-exact with the
source, that `build-hero.py` overlays back onto the film.
"""
import subprocess
import sys

import cv2
import numpy as np

# Region of the 1920x1080 frame that contains the badge, with margin.
X0, Y0, W, H = 1580, 0, 340, 310
# Extra radius so the badge's soft edge and drop shadow are inside the disc.
FEATHER = 8
# Outward paste ramp, px.
RAMP = 12


def locate_badge(frame_bgr):
    """Centre and radius of the badge within the crop, from one bright frame."""
    crop = frame_bgr[Y0:Y0 + H, X0:X0 + W]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    dark = (gray < 70).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, _, stats, _ = cv2.connectedComponentsWithStats(dark, 8)
    if n < 2:
        raise SystemExit("badge not found in reference frame")
    i = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = stats[i, :4]
    return x + w / 2.0, y + h / 2.0, max(w, h) / 2.0


def pushpull(img, valid):
    """Diffusion-style fill: known-pixel averages down a pyramid, pulled back up."""
    num = img.astype(np.float32) * valid[..., None]
    den = valid.copy()
    levels = [(num, den)]
    while den.min() < 0.999 and min(den.shape) > 4:
        num = cv2.pyrDown(num)
        den = cv2.pyrDown(den)
        levels.append((num, den))
    n, d = levels[-1]
    fill = n / np.maximum(d, 1e-6)[..., None]
    for n, d in reversed(levels[:-1]):
        up = cv2.pyrUp(fill, dstsize=(n.shape[1], n.shape[0]))
        w = np.clip(d, 0, 1)[..., None]
        fill = (n / np.maximum(d, 1e-6)[..., None]) * w + up * (1 - w)
    return fill


def main():
    ff, src, out = sys.argv[1:4]
    cap = cv2.VideoCapture(src)
    if not cap.isOpened():
        raise SystemExit("cannot open " + src)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    def frame_at(t):
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, f = cap.read()
        if not ok:
            raise SystemExit("cannot read frame at %.1fs" % t)
        return f

    a = locate_badge(frame_at(8.0))
    b = locate_badge(frame_at(29.0))
    if abs(a[0] - b[0]) > 4 or abs(a[1] - b[1]) > 4 or abs(a[2] - b[2]) > 6:
        raise SystemExit("badge position disagrees between frames: %r vs %r" % (a, b))
    cx, cy = int(round((a[0] + b[0]) / 2)), int(round((a[1] + b[1]) / 2))
    r = int(round(max(a[2], b[2]) + FEATHER))
    print("badge at crop (%d, %d) r=%d  => frame (%d, %d)" % (cx, cy, r, X0 + cx, Y0 + cy))

    hole = np.zeros((H, W), np.uint8)
    cv2.circle(hole, (cx, cy), r, 255, -1)
    valid = (hole == 0).astype(np.float32)
    inside = (hole > 0)[..., None]

    outer = np.zeros((H, W), np.uint8)
    cv2.circle(outer, (cx, cy), r + RAMP, 255, -1)
    soft = cv2.GaussianBlur(outer.astype(np.float32) / 255.0, (0, 0), 4)
    soft = np.clip(np.maximum(soft, hole.astype(np.float32) / 255.0), 0, 1)[..., None]

    enc = subprocess.Popen(
        [ff, "-hide_banner", "-loglevel", "error", "-y",
         "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "%dx%d" % (W, H), "-r", "%.6f" % fps, "-i", "-",
         "-c:v", "ffv1", "-level", "3", out],
        stdin=subprocess.PIPE,
    )

    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    n = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        crop = frame[Y0:Y0 + H, X0:X0 + W]
        fill = pushpull(crop, valid)
        fill = np.where(inside, cv2.GaussianBlur(fill, (0, 0), 3), fill)
        patched = (crop.astype(np.float32) * (1 - soft) + fill * soft).astype(np.uint8)
        enc.stdin.write(patched.tobytes())
        n += 1
        if n % 300 == 0:
            print("  %d / %d frames" % (n, total))
    enc.stdin.close()
    enc.wait()
    if enc.returncode != 0:
        raise SystemExit("ffmpeg failed writing " + out)
    print("wrote %s (%d frames at %.3f fps)" % (out, n, fps))


if __name__ == "__main__":
    main()

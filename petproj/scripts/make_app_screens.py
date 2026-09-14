"""
Builds the phone mockups used by components/home/AppSection.tsx.

Adapted from the store-screenshot generator documented in
~/Desktop/ev-charge-app/store-assets/SCREENSHOT_MECHANISM.md, with three
changes for web use:

  * transparent background instead of a brand fill, so the frames sit on
    whatever the section background happens to be
  * no baked title/subtitle: the landing page renders those as real text, which
    stays selectable, translatable and crawlable
  * no baked shadow: CSS drop-shadow follows the alpha silhouette and can be
    retuned without regenerating anything

Source captures are the App Store marketing frames in
~/Desktop/Paltuu/app-screenshots/ios. The phone sits at a slightly different
height in each of those, so the screen rectangle is detected per image rather
than hardcoded.

Setup (Homebrew python@3.14 has a broken pyexpat, so 3.13 is required):
    /opt/homebrew/bin/python3.13 -m venv /tmp/shotvenv
    /tmp/shotvenv/bin/pip install Pillow
    /tmp/shotvenv/bin/python scripts/make_app_screens.py
"""

import os
from PIL import Image, ImageDraw

_HERE = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.expanduser("~/Desktop/Paltuu/app-screenshots/ios")
OUT_DIR = os.path.join(_HERE, "..", "public", "app-screens")

FRAME_COLOR = (17, 17, 20)
FRAME_EDGE = (82, 84, 92)
BUTTON_COLOR = (30, 30, 35)

# (source file, output name)
ITEMS = [
    ("1.png", "feed.png"),
    ("2.png", "pet-profile.png"),
    ("4.png", "adopt.png"),
    ("6.png", "vets.png"),
]

SCREEN_W = 600          # rendered screen width; ~2.3x the 260px CSS box
SCREEN_H = 1180         # fixed, so all four frames come out identical and the
                        # row lines up; sources differ by ~12px otherwise
BEZEL = 22
EDGE_WIDTH = 2
BTN_PROTRUDE = 6
BTN_INSET = 18
BTN_RADIUS = 4


def luma(px):
    return 0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2]


def find_screen_rect(img):
    """Locate the phone's screen area inside a marketing frame.

    Walks down a column in the left quarter of the image, which is plain white
    status bar inside the phone and clear of the dynamic island. The first
    bright pixel that follows a dark one is the top of the screen; the bezel
    above it is what makes that transition unambiguous on both the white and
    the maroon marketing backgrounds.
    """
    w, h = img.size
    px = img.load()

    probe_x = int(w * 0.25)
    seen_dark = False
    top = None
    for y in range(int(h * 0.20), int(h * 0.45)):
        l = luma(px[probe_x, y])
        if l < 60:
            seen_dark = True
        elif seen_dark and l > 200:
            top = y
            break
    if top is None:
        raise SystemExit(f"could not find screen top (probe_x={probe_x})")

    # Find the side edges by walking outward from the centre until the dark
    # bezel stops us. A single scan line is not enough: near the top the
    # screen's own rounded corners make the lit area narrower than the screen,
    # and any line crossing the dynamic island stops immediately. Sampling a
    # band and keeping the widest result sidesteps both, and the bezel is far
    # darker than even the maroon marketing background, so the threshold holds
    # on every source.
    cx = w // 2
    left, right = cx, cx
    for scan_y in range(top + 60, top + 260, 4):
        l = cx
        while l > 0 and luma(px[l, scan_y]) > 50:
            l -= 1
        r = cx
        while r < w - 1 and luma(px[r, scan_y]) > 50:
            r += 1
        left = min(left, l)
        right = max(right, r)

    return left + 1, top, right, h


def build(src_path, out_path):
    img = Image.open(src_path).convert("RGB")
    left, top, right, bottom = find_screen_rect(img)
    screen = img.crop((left, top, right, bottom))

    # Trim the bottom to a fixed aspect before scaling, so every frame ends up
    # the same size. The sources are all cut off at the bottom of the phone
    # anyway, so there is nothing meaningful down there to lose.
    target_aspect = SCREEN_H / SCREEN_W
    max_h = int(screen.size[0] * target_aspect)
    if screen.size[1] > max_h:
        screen = screen.crop((0, 0, screen.size[0], max_h))
    screen_h = SCREEN_H
    screen = screen.resize((SCREEN_W, screen_h), Image.LANCZOS)

    dev_w = SCREEN_W + BEZEL * 2
    dev_h = screen_h + BEZEL * 2
    outer_r = int(dev_w * 0.14)
    inner_r = max(1, outer_r - BEZEL + 4)

    pad = BTN_PROTRUDE
    canvas = Image.new("RGBA", (dev_w + pad * 2, dev_h), (0, 0, 0, 0))
    ox = pad

    # Buttons first: the frame drawn next overlaps their inner half, so they
    # read as protruding from behind the body rather than stuck on top of it.
    bd = ImageDraw.Draw(canvas)
    bw = BTN_PROTRUDE + BTN_INSET

    def button(x_left, y_frac, h_frac):
        y0 = int(dev_h * y_frac)
        bd.rounded_rectangle(
            [x_left, y0, x_left + bw, y0 + int(dev_h * h_frac)],
            radius=BTN_RADIUS, fill=BUTTON_COLOR + (255,))

    lx = ox - BTN_PROTRUDE
    button(lx, 0.125, 0.032)   # silent switch
    button(lx, 0.195, 0.068)   # volume up
    button(lx, 0.280, 0.068)   # volume down
    button(ox + dev_w - BTN_INSET, 0.225, 0.105)  # power

    body = Image.new("RGBA", (dev_w, dev_h), (0, 0, 0, 0))
    mask = Image.new("L", (dev_w, dev_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, dev_w - 1, dev_h - 1], radius=outer_r, fill=255)
    body.paste(Image.new("RGBA", (dev_w, dev_h), FRAME_COLOR + (255,)), (0, 0), mask)
    ImageDraw.Draw(body).rounded_rectangle(
        [1, 1, dev_w - 2, dev_h - 2], radius=outer_r,
        outline=FRAME_EDGE + (255,), width=EDGE_WIDTH)

    screen_mask = Image.new("L", (SCREEN_W, screen_h), 0)
    ImageDraw.Draw(screen_mask).rounded_rectangle(
        [0, 0, SCREEN_W - 1, screen_h - 1], radius=inner_r, fill=255)
    body.paste(screen.convert("RGBA"), (BEZEL, BEZEL), screen_mask)

    canvas.paste(body, (ox, 0), body)
    canvas.save(out_path, "PNG")
    return canvas.size, (left, top, right - left)


os.makedirs(OUT_DIR, exist_ok=True)
for src, out in ITEMS:
    size, detected = build(os.path.join(SRC_DIR, src),
                           os.path.join(OUT_DIR, out))
    print(f"{out:16s} -> {size[0]}x{size[1]}   "
          f"detected screen: x={detected[0]} y={detected[1]} w={detected[2]}")

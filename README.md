# Cut N Curl — Salon & Aesthetic

A luxury salon website for **Cut N Curl, 281/L Model Town, Rewari** — the salon's own
interior film as a full-screen cinematic hero, a minimal editorial site beneath it, and the
interactive 3D reconstruction of the room kept as a section for anyone who wants to look
around for themselves.

> *"Where Beauty Meets Art"* · Est. 2016 · Founded by Rjnish · Unisex · L'Oréal Professionnel partner

**Everything on this site comes from the salon's own material:**

| Source | Used for |
| --- | --- |
| `Final3 (3).mp4` (the salon's commercial) | The hero film (§3), and the authoritative reference for the 3D reconstruction |
| `IMG_3296.MP4`, `IMG_0550.jpeg`, the wide interior still | Gallery stills, and detail the walkthrough passes over |
| `lv_0_*.mp4` (brand film) | Wordmark, tagline, address |
| `Screenshot_*_Gallery.jpg` | The circular badge logo |
| `price catologe/Catalouge.pdf` | All 135 services and prices |
| Supplied by the owner | The 15 team members and their roles |

---

## 1. Running it locally

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check, then production build into `dist/` |
| `npm run preview` | Serve the production build on :4173 |
| `npm run typecheck` | TypeScript only, no emit |
| `npm run test:camera` | Proves no camera pose can end up inside a wall |
| `npm run test` | `typecheck` + `test:camera` |

Requires Node 18+.

---

## 2. Project structure

```
.
├── index.html                  Meta, fonts, BeautySalon JSON-LD
├── public/
│   ├── favicon.svg
│   ├── media/                  Hero film (webm/mp4/mobile), posters, stills, badge
│   └── models/                 Drop salon.glb here (see §9)
├── tools/
│   └── camera.test.ts         Camera containment proof, run by npm test
└── src/
    ├── main.tsx                Entry
    ├── App.tsx                 Shell: picks 3D vs. fallback, mounts chrome
    ├── config/                 ← EVERYTHING TUNABLE LIVES HERE
    │   ├── site.config.ts      Brand, copy, services, prices, team, contact
    │   ├── room.config.ts      Room dimensions, furniture layout, collision, GLB switch
    │   ├── camera.config.ts    Camera poses, section mapping, orbit + walk tuning
    │   ├── lighting.config.ts  Intensities, exposure, shadows, bloom
    │   ├── materials.config.ts Palette and physical material values
    │   └── animation.config.ts Durations and easings
    ├── components/
    │   ├── 3d/
    │   │   ├── SalonScene.tsx           Everything inside <Canvas>
    │   │   ├── SalonModel.tsx           Procedural ↔ GLB switch
    │   │   ├── GltfSalon.tsx            Draco/Meshopt GLB loader
    │   │   ├── SalonRoom.tsx            Assembles the procedural salon
    │   │   ├── SalonFloor.tsx           Marble + real reflection pass
    │   │   ├── SalonWalls.tsx           Wall segments, shopfront, gold inlays
    │   │   ├── SalonCeiling.tsx         Tray ceiling, reveals, bulkhead
    │   │   ├── CeilingLights.tsx        Diamond LED figure, strips, downlights
    │   │   ├── SalonMirror.tsx          Capsule mirror bank + long makeup mirror
    │   │   ├── SalonStation.tsx         Styling stations
    │   │   ├── SalonChair.tsx           Styling chair, with LOD
    │   │   ├── SalonVanity.tsx          Makeup counter, drawers, 4 chairs
    │   │   ├── Reception.tsx            Desk, niche, gold stag, shelves, sofa
    │   │   ├── WashStation.tsx          L'Oréal wall, lit niches, basins
    │   │   ├── NailBar.tsx              Nail Art wall, product shelf, treatment bed
    │   │   ├── Curtains.tsx             Folded fabric
    │   │   ├── Decorations.tsx          Feather, framed print, signage, planter
    │   │   ├── LightingSystem.tsx       Environment rig + real lights
    │   │   ├── CameraController.tsx     GSAP cinematic camera + OrbitControls
    │   │   └── Effects.tsx              Bloom + vignette
    │   ├── ui/                 Logo, Button, IntroTheatre, Section, DatePicker, CameraModeBar, SocialLink
    │   ├── navigation/         Navbar + mobile drawer
    │   └── sections/           The eight page sections
    ├── scenes/
    │   ├── SalonExperience.tsx  The <Canvas> (lazy-loaded chunk)
    │   └── StaticSalon.tsx      Cinematic fallback
    ├── models/geometries.ts     Shared cached geometry
    ├── materials/               Procedural textures, shared materials, HDR emissives
    ├── animations/              GSAP ScrollTrigger wiring
    ├── hooks/                   Device profile, media queries, experience store
    ├── utils/                   Camera bounds, device tiering, dates, formatting
    ├── pages/HomePage.tsx       The scroll narrative
    └── styles/                  Tokens + global + components
```

---

## 3. The film behind the site

The salon's own commercial is the site's environment. A 21-second, looping, muted, inline
edit of it plays in ONE fixed, full-viewport `<video>` element behind the entire page
(`src/components/ui/VideoBackdrop.tsx`, mounted once in `App.tsx`), and every section
scrolls over it. The homepage opens on one clean screen of the film with a caption's worth
of type; the sections that follow sit on translucent ivory surfaces — blurred glass
panels for the copy, a lighter full-width sheet for the gallery grid, the team, the 3D
viewer and the footer — so the room reads through their edges and between them. There
is no player chrome, no play button, no border, and no opaque plate over the film. The 3D
room that used to fill the screen is a viewer further down the page (§4).

Layer order: 0 the film, 1 its grade, 2 the page, 3 the header, 4 the drawer and lightbox.
The film layer has `pointer-events: none`, so nothing about it can intercept a tap.

### How the edit was made

`tools/build-hero.py` rebuilds every hero asset from the source with one command:

```bash
python tools/build-hero.py <path-to-ffmpeg> "images n videos/Final3 (3).mp4" public/media
```

Requires `opencv-python-headless` and `numpy` (`pip install opencv-python-headless numpy`)
for the watermark stage; the inpainted corner is cached under `node_modules/.cache/hero/`.

Then `tools/build-fallbacks.py` derives the animated-image stand-ins (see "Behaviour"
below) from the films it just produced:

```bash
python tools/build-fallbacks.py <path-to-ffmpeg> public/media
```

The source is 45 s. **Every shot with a person in it is cut** — the receptionist at
2.9–4.0 s, the hand holding the door at 1.3–1.8 s, and the staff lineup that runs from
33.2 s to the closing title card at 43.9 s. So are the hard cut to black at 26.5 s, the
QR-sign insert, two product-lamp inserts, the exterior signboard and the title card. What
remains is 26 s of clean interior, taken in walk-through order — styling room, corridor of
LED strips, the diamond ceiling, the L'Oréal wall, the wash bay, a product still, the nail
wall, the makeup room, the waiting area — and cross-faded to 21 s.

Two decisions worth knowing:

- **No inpainting was attempted on the staff.** A lineup of ten people walking across
  the full frame for eleven seconds is not something a clean-plate reconstruction can do
  invisibly, and a visibly reconstructed salon is worse than a shorter film. The brief
  allowed for exactly this: prefer a shorter clean film over a longer one with people in
  it. There are no artefacts because nothing was painted over.
- **The loop lands on the editor's own cut.** The last shot (waiting area, 5.07–6.87 s in
  the source) is immediately followed in the original by the first shot (styling room,
  6.87 s onward). Looping back across that boundary reads as just another cut — which
  also hides the small hitch browsers make when a `<video loop>` wraps.

The circular badge burned into the top-right of every source frame is removed by
`tools/inpaint-badge.py`, which finds the badge automatically on two bright reference
frames (and insists they agree) and replaces **only its disc** with a push-pull pyramid
fill — a diffusion-style estimate from the surrounding pixels, softened inside the disc and
feathered outward so no badge pixel can bleed back. Nothing outside the badge's outline is
touched. Three fills were compared on a flat wall, a wall with gold inlay lines and a frame
with an LED strip crossing the corner. ffmpeg's `delogo` (rectangular linear interpolation)
dragged the LED line down through the box as a faint streak; OpenCV's Telea and
Navier–Stokes inpainting left a radial pinwheel that read as a ghost disc on plain plaster.
The push-pull fill is invisible on the wall, and where a line crosses the disc it dissolves
softly instead of wedging. The 9:16 mobile crop excludes that region entirely. Colour is
left alone bar a 4% contrast lift — no warmth, no saturation.

### What ships

| File | Size | Used |
| --- | --- | --- |
| `hero-desktop.mp4` | 7.5 MB | Every browser (listed first; H.264 High 4.1, CRF 24, hardware-decoded) |
| `hero-desktop.webm` | 5.1 MB | Fallback for a browser without H.264 (VP9) |
| `hero-mobile.mp4` | 3.0 MB | Viewports ≤ 900 px — a 720×1280 centre crop, not a squeeze |
| `hero-poster*.jpg` | 25–73 kB | The first frame of each edit, so the poster→video handover is pixel-identical |

The source is chosen once per page load from the viewport width and never swapped
afterwards; swapping restarts playback mid-shot. Posters are preloaded with `media`
attributes so a phone never fetches the 1080p plate.

### Behaviour

- Fades in from the poster on `playing`, not on a network event.
- If autoplay is refused (Low Power Mode, data saver), the poster stays and the video
  element itself stays at opacity 0 — a paused video is never visible, so no browser can
  paint a play glyph over it. WebKit's overlay play button is also hidden outright with
  its `::-webkit-media-controls-start-playback-button` pseudo-element, and the element
  carries `controls={false}`. The first genuine activation — `pointerup`, `touchend`,
  `click` or `keydown`; a `touchstart` does not count and is deliberately not listened
  for — retries `play()` on the same element, and the retry stays armed until playback has
  actually begun. The opening title card's film works the same way: its first frame is an
  `<img>` underneath, and the film only appears once it reports `playing`.
- **When a browser refuses to play video at all — an iPhone in Low Power Mode is the
  common case, and no page can override it — the film still moves.** The same edit ships
  as an animated image (`hero-*.avif`, with `hero-*.webp` behind it for iOS before 16.4;
  `intro-badge.avif`/`.webp` for the title card), and images animate under any policy. It
  is requested only at the moment `play()` is refused, so no other visitor downloads it,
  and it sits between the poster and the (invisible) video. If the visitor then touches the
  screen, the real video starts, fades in over the animation, and the animation is
  dropped. Built by `tools/build-fallbacks.py` from the shipped films: 12 fps at 480 px
  (phone) / 640 px (desktop), 15 fps for the badge.
- **The film has a keeper.** Nothing on the page pauses it except a hidden tab, so a pause
  from anywhere else — a browser's power policy, a decoder dropped under memory pressure, a
  stall at the loop point on a slow connection, a media error — is treated as an
  interruption to undo: a `pause` while the tab is visible is answered with `play()`;
  `ended` (a browser that ignores `loop`) restarts it; a media error, or a clip that has not
  advanced for eight seconds, reloads the element and plays again, with the animated
  stand-in showing until the film is back; and a two-second check backs all of that up.
  Verified by pausing the element from outside (playing again within two seconds) and by
  firing a media error on it (the animated stand-in appears, the element reloads, and the
  film is playing again with the same single element).
- The `muted` attribute is written onto the element by hand (`defaultMuted`, plus
  `setAttribute`). React sets the property but never the attribute, and Safari's autoplay
  policy reads the attribute.
- The MP4 is the first `<source>` — H.264 is hardware-decoded on effectively every device,
  VP9 is not (see §7) — and the WebM behind it names its codec (`video/webm;
  codecs="vp9"`), so nothing tries it by mistake.
- `prefers-reduced-motion`: no video element at all, the poster is the hero, and the
  scroll fade is skipped.
- Scrolling does nothing to it. There is no IntersectionObserver, no scroll listener, no
  scroll-linked opacity, scale or seek, and no React state that changes during playback.
  The element is created on first render and is never remounted; the only thing the page
  ever asks of it is `play()`.
- If autoplay is refused, one retry is armed on the first pointer, touch or key event —
  on the same element. Nothing is duplicated.
- The one pause is a hidden tab (`visibilitychange`), which has nothing to do with
  scrolling and simply avoids decoding 1080p for a page nobody is looking at.
- The layer is `100lvh` tall, so a phone's collapsing address bar never exposes a strip of
  body colour under the film.

### The grade

Global (`.backdrop__grade`, on top of the film for the whole page): a band at the top for
the navigation, a wide vignette that never reaches the centre, a little extra shade in the
top-right where the cleaned watermark was, and a 10% veil — all in neutral near-black,
none warm-tinted. The walls stay ivory and the marble stays white. Local to the hero
(`.section--hero::before`, scrolls away with it): a directional scrim from the bottom-left
behind the type, and on phones a bottom band instead. Both live in CSS, not in the file, so
they can be tuned without re-encoding.

---

## 4. The reconstruction

**This is not a generic salon.** Every element was read off the supplied photos and video,
and `src/config/room.config.ts` documents observed-vs-inferred in detail.

It lives in **"The Salon"** section as a contained viewer with its own view switcher. It
is not fetched, mounted or drawn until that section is within ~900 px of the viewport,
and its render loop stops whenever the box is scrolled well past — so the three.js chunk
is never on the path to first paint and never burns GPU time behind the page. On a device
without usable WebGL the box shows the cross-fading photography instead.

### Revised against the 1080p walkthrough

The first reconstruction was built from portrait phone footage that only ever showed one
wall at a time. The later landscape walkthrough shows the whole room, and it corrected
several things that were simply wrong:

| Was | Actually |
| --- | --- |
| Mirrors on one wall, facing an empty room | **Symmetric** — mirrors and chairs down *both* long walls, facing each other |
| Free-standing ovals stuck on flat plaster | **Arched niches recessed into the wall**, lit from behind so the halo falls inside the recess |
| Hall 6.8 m wide | **4.6 m** — scaled off staff standing in frame |
| Squared box chairs with slab armrests | **Shield-backed tubs** with a champagne rim along the top edge |
| Gold inlay picture frames | **Plain recessed panel reveals** in ivory plaster |
| A sofa with arms | An **armless bench** on a plinth against the panelled end wall |
| Straight ceiling strips over reception | **Seven curved strips** arcing off the soffit and down the wall |
| A joinery reception desk | A **solid marble block** with a lit reveal along its base |

The arches are the important one. They are cut as real holes: a lining panel the depth of
the recess is extruded from a rectangle with capsule-shaped holes punched through it, so
`ExtrudeGeometry` gives each opening its own side walls and the reveal comes out of the
geometry rather than being faked with shading. The structural wall behind shows through
the opening and becomes the back of the recess, which is what the concealed LED washes.

### Observed in the reference

- Warm ivory matte plaster; large-format Calacatta marble, polished but not mirrored
- Seven arched backlit mirrors — four west, three east — with slim consoles beneath
- Shield-backed white chairs on champagne columns and heavy round discs, bracket footrests
- A tight bundle of parallel LED runs down the centre of the hall ceiling, ends stepped
- Recessed downlights and flush ceiling speakers
- Recessed rectangular panel moulding; nested rectangles on the end wall
- Reception: marble block, lit base reveal, curved light comb, arched product niche, cabinet
- Back studio: L'Oréal wash wall with backlit niches, the long backlit makeup mirror over a
  drawered vanity, the "Nail Art" shelving, a treatment bed, nested-diamond ceiling figure

### Inferred

Absolute room lengths, and how the two rooms connect — the video never shows a floor plan.
The back studio also consolidates elements the footage shows across adjacent back-of-house
spaces, so that every real element is present in a coherent, correctly-proportioned room.

### Coordinates

Metres. `+X` right, `+Y` up, `+Z` toward the back. The visitor enters at the south end.

- Main hall: `x ∈ [-2.3, 2.3]`, `z ∈ [-8.0, 3.6]`, 3.0 m ceiling
- Back studio: `x ∈ [-7.4, -2.3]`, `z ∈ [0.4, 4.4]`, 2.88 m ceiling
- Doorway between them at `x = -2.3`, `z ∈ [1.2, 2.7]`

### Brand assets

Two marks, both the salon's own, and both used:

- **The circular badge** ("Cut 'N' Curl · Makeup | Nails | Hair") — extracted from the
  supplied screenshot, cropped and masked to a clean transparent circle at
  `public/media/logo-badge.png`. It appears in the navigation, in
  the footer, and as the favicon and Apple touch icon.
- **Typography.** Cormorant Garamond carries the wordmark, the hero and every section
  title; Manrope carries navigation, buttons, body copy and the whole booking UI. Two
  families, weights 400–600, and restrained letter-spacing — uppercase labels sit at
  0.15em rather than the 0.34em that reads as decoration.
- **The typographic wordmark** from the brand film — set in Cormorant Garamond with the
  middle "N" dropped to a smaller optical size, matching the film's lockup. Used wherever
  the name needs to read at a glance.

### The opening title sequence

The salon's own logo film opens the site. The badge blooms out of black, then the
wordmark is struck in one word at a time — **Cut**, then **N**, then **Curl** — each
arriving soft, oversized and gold before pulling into focus and cooling to ivory. The
card then pushes forward and dissolves into the salon.

Beats live in `ANIM.theatre` (`src/config/animation.config.ts`), written as absolute
seconds so the whole thing reads as a storyboard. The component is
`src/components/ui/IntroTheatre.tsx`.

The whole card runs **four seconds** — from the moment it appears to fully faded,
measured at 4.07s across runs.

Making it *feel* slow inside that budget is a question of **stagger, not duration**. An
earlier cut ran the words 1.3s each but only 0.40s apart: each word was barely a third
resolved when the next began, so all three arrived as a single event and it read as fast
however long the individual tweens were. The gap is now **0.80s against a 1.05s reveal**,
so each word holds the stage almost alone — at the moment N is 38% in, Cut has fully
landed and Curl has not started at all. Three deliberate beats: *Cut … N … Curl*.

It plays on **every load, including a refresh** — the salon wants the film in front of
every arrival. It is skippable by button, click, or any key, and `?intro=0` turns it off
(which is what the test suites use; `?intro=1` forces it on). The salon film behind the
site (§3) starts at the same moment, underneath the black card, so the dissolve lands on
a room that is already moving rather than on a poster waiting for its video. A deep link with a hash
(`/#booking`) goes straight to the section — arriving at a section is a request for that
section, not for a film. `src/utils/intro.ts` owns that decision, memoised, because three
places must agree on it: the card, App, and the experience store.

This is the **only** thing between the visitor and the salon. There was previously a
second opening curtain that held a plate while WebGL warmed up; it has been removed, and
the title card does that job instead.

#### Keeping it smooth

The sequence plays during the busiest few seconds of the whole page's life, so four
things were done to stop anything else stealing frames from it. Each was measured, and
two things that *sounded* like causes turned out not to be.

1. **The 3D layer does not mount until the card starts to dissolve.** Booting WebGL means
   evaluating the three.js chunk, building every geometry in the room and compiling its
   shaders — all on the main thread. Run underneath the card, it drew **15 frames in 8
   seconds and dropped 80% of them behind a single 26-second task**. The scene is now
   released by `onFinished`, which fires at the *start* of the exit: the dissolve is a
   compositor-driven CSS transition and keeps running regardless, so the boot happens
   under a fade nobody can see.
2. **The card is animated entirely in CSS.** Driving the words from GSAP cost a forced
   synchronous layout each time a word's tween initialised and read computed style —
   tracing showed 340 ms `Layout` events firing inside `FireAnimationFrame`, one per
   word, landing exactly on the reveals. Timings still come from `ANIM.theatre`, handed
   to the stylesheet as custom properties.
3. **The keyframes touch only opacity, transform and filter.** Chrome can composite those
   three. `color` was in there too and is the one property in that set it cannot — it
   forced a main-thread repaint of the text every frame. The middle N gets its gold from
   a static rule instead.
4. **The page underneath is taken out of the render pipeline** (`content-visibility:
   hidden` via `body.is-theatre`), and the scroll wiring waits for `introDone`. Building
   a ScrollTrigger costs a forced layout, and while the card is up the content is
   collapsed — so a trigger built then is both expensive *and* measured against nothing.
   Waiting means each is built once, against real geometry.

Two red herrings, recorded so nobody re-chases them: the animated **blur** is not the
problem (removing it changed the stall profile not at all), and neither is the **video
decode** (removing the element entirely changed nothing). The cost was never paint — it
was layout.

Measured with an in-page `requestAnimationFrame` recorder over the card's whole run:

| CPU | Frames | Median | p95 | Dropped |
| --- | --- | --- | --- | --- |
| Before, 4x throttle | 15 | 83.3 ms | — | **80%** |
| After, no throttle | 314 | 18.0 ms | 18.5 ms | 3.2% |
| After, 2x throttle | 301 | 18.0 ms | 18.2 ms | 2.3% |
| After, 4x throttle | 245 | 18.0 ms | 18.6 ms | 4.1% |

One caveat on that table: `requestAnimationFrame` runs on the main thread, so it cannot
see compositor frames — which is precisely what the card now animates on. A CDP
screencast of real compositor output was used to sanity-check the visuals, but its frame
counts swing by 50% run to run on identical builds, so it is not a tuning instrument.
Do not micro-tune cue timings against it; that noise was briefly mistaken for signal.

**Source and transcode.** `images n videos/intro.mp4` is a 4K portrait HEVC 10-bit
HDR (BT.2020/HLG, Dolby Vision profile 8) phone capture — a format most browsers cannot
decode at all, at a resolution no page should ship. It is transcoded once, by hand, to
`public/media/intro-badge.mp4` (**210 kB**) plus a poster frame (**18 kB**):

```bash
TM="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv"
KEY="$TM,crop=2160:2160:0:798,format=rgba,colorkey=0x5D5D5D:0.10:0.06,scale=512:512:flags=lanczos"

ffmpeg -f lavfi -i "color=c=0x1F1A16:s=512x512:r=25,vignette=angle=PI/3.2"   -i "images n videos/intro.mp4" -an   -filter_complex "[1:v]$KEY,fps=25[k];[0:v][k]overlay=shortest=1,gradfun=strength=1.2:radius=16,format=yuv420p[v]"   -map "[v]" -c:v libx264 -profile:v high -preset slow -crf 24   -pix_fmt yuv420p -movflags +faststart public/media/intro-badge.mp4
```

Four things that recipe is doing, in order:

1. **Tone-maps HDR to SDR.** Handing BT.2020/HLG straight to an SDR browser gives washed,
   milky greys. Hable tone-mapping keeps the gold saturated and the blacks black.
2. **Crops square around the badge.** The source is 9:16, which would either letterbox or
   crop savagely on a desktop. The badge sits dead centre, so a square crop loses nothing
   and gives an element that scales predictably at any viewport.
3. **Keys out the flat grey field and drops the badge onto a warm vignette.** The film was
   shot on a perfectly uniform `#5D5D5D`, which keys with no halo and no spill. The
   vignette replacing it is what makes the medallion read as lit rather than as a phone
   clip pasted on the page.
4. **Bakes no gradient the page could draw better.** `gradfun` dithers what little
   gradient there is, because dark gradients band badly at video bitrates. The larger
   warm bloom around the medallion is a CSS radial gradient, and the square frame is
   feathered into the black with a CSS mask — so the video never reads as a rectangle.

The single H.264 file is deliberate. A VP9 alpha WebM was built and tested first — it
keys just as cleanly — but it came out **376 kB against 210 kB**, needed a second encode
for Safari, and would have made the two paths look different from one another. One file,
one look, decoded by everything.

### The menu

All **135 services** are transcribed from the printed catalogue, including its two-column
pricing — Male/Female for hair, Regular/Premium for colour, bleach and waxing. The site
renders those columns rather than flattening everything to a single "from" figure, because
that distinction is most of the menu's information.

Groupings were verified against the rendered catalogue pages, not just its text layer: the
text extracts in document order, which interleaves headings and prices and would have
mis-assigned several rows.

Two judgement calls worth knowing about:

- **Waxing flat rates.** Upper lip, chin, side locks, face and bikini wax are printed with
  a single figure aligned under the *Premium* column. They are shown as one flat rate
  spanning both columns, since a "—" under Regular would wrongly suggest they are
  premium-only. Change `flat` to `prices` in `site.config.ts` to show them the other way.
- **Spellings normalised.** The catalogue prints "Neno plastic", "THINING/VOLUME",
  "CUTE,FILE & POLISH" and "PEEL OF MASK"; the site shows *Nanoplastia*,
  *Thinning / Volume*, *Cut, File & Polish* and *Peel-Off Mask*. Revert any of these in
  `site.config.ts` if the printed wording is preferred.

## 5. Changing things

Almost nothing requires touching a component.

| I want to… | Edit |
| --- | --- |
| Change prices, services, hours, address, phone | `config/site.config.ts` |
| Add a service, or a whole new group with its own price columns | `SERVICE_CATEGORIES` in `config/site.config.ts` |
| Add a team member or a headshot | `TEAM` in `config/site.config.ts` |
| Move a chair, mirror, or the reception desk | `config/room.config.ts` |
| Resize a room | `ROOM` in `config/room.config.ts` — `CAMERA_VOLUMES` follows automatically; run `npm run test:camera` |
| Move / add a styling station | `STYLING_STATIONS` in `config/room.config.ts` — the arch, console and chair all follow |
| Resize the arched mirrors | `MIRROR_ARCH` in `config/room.config.ts` |
| Reframe a camera shot | `CAMERA_POSES` in `config/camera.config.ts` |
| Change which shot a page section flies to | `SECTION_CAMERA` |
| Brighten / dim the salon | `toneMappingExposure` in `config/lighting.config.ts` — the whole rig is balanced around it |
| Change how much things glow | `LIGHTING.emissive` (see §7) |
| Retune a material | `MATERIALS` in `config/materials.config.ts` |
| Speed up / slow down animation | `config/animation.config.ts` |

### Cameras

Nine poses: `hero`, `reception`, `nails`, `stations`, `mirror`, `wash`, `floor`,
`station_detail`, `entrance`. Each carries a position, target, FOV, an orbit window
(`azimuthRange`), and an optional `mobile` override for portrait screens.

There is **one** 3D experience, not two. A first-person walkthrough used to sit alongside
these views; it was a second way of showing the same room and only ever competed with the
first, so it is gone. What remains is the salon and a set of composed views onto it.

Two ways the camera moves, and `resolvePoseId` in `hooks/useExperienceStore.ts` is the
single function that decides between them:

1. **Scrolling the page.** `SECTION_CAMERA` maps each section to a pose, so reading the
   story walks the camera through the salon as a backdrop. This is the default.
2. **Picking a view.** The visitor asked to see one part of the room, so the camera goes
   there **and the page does not move.**

The second rule is the important one. Someone reading the price list who wants to see the
mirror should get the mirror — not a scroll jump to a different section. `CAMERA_VIEWS`
therefore carries no section reference: the switcher is a viewer for the room, not a set
of anchor links.

Scrolling to a *genuinely different* section hands control back to rule 1. Same-section
re-fires are ignored, so nudging the scroll around a trigger boundary can never snatch a
chosen view away.

**Controls**

| | Desktop | Touch |
| --- | --- | --- |
| Orbit | drag, clamped to the pose's azimuth window | two fingers |
| Zoom | — (the wheel scrolls the page) | pinch |
| Scroll the page | wheel | one finger |

**Four bugs live here, and all four wore the same disguise — "it shows me a wall":**

- **The wheel no longer dollies.** On a scroll-driven page the wheel belongs to the page.
  Letting OrbitControls zoom on the same gesture drove the camera backwards through the
  shopfront.
- **One finger no longer orbits.** It scrolls the page. With one finger bound to rotate, a
  phone visitor could not get past the hero at all — the canvas ate every swipe.
- **OrbitControls is left alone mid-flight.** During a move the tween writes
  `camera.position` and `camera.lookAt` directly and does *not* call `controls.update()`.
  It used to, which let OrbitControls clamp the camera every frame against the
  **previous** pose's distance limits, dragging the fly path off course and landing it
  somewhere unrelated to the pose it was flying to.
- **The dolly limit is measured against the walls.** `cameraRange` marches the view ray
  through the room volumes in `room.config.ts` and returns the span that is actually
  inside the building. Its predecessor stopped at the first point outside — and since
  nearly every pose aims AT something (a mirror, the wash wall, the nail shelves), the
  target itself is outside by definition, so it reported a maximum dolly of zero and
  OrbitControls hauled the camera to its minimum distance from the wall.

The pose's own distance is always kept inside the computed range: clamping the camera away
from the framing it was authored for would be a cure worse than the disease.
`npm run test:camera` proves both properties for every pose, desktop and mobile.

### Two failure modes worth knowing about

**Instanced meshes and frustum culling.** Every instanced batch in the scene carries
`frustumCulled={false}`, and it is load-bearing. An `InstancedMesh` keeps the bounding
sphere of its *base* geometry, centred on the object's own origin — it knows nothing about
where the instances were scattered to. Three.js therefore culls the whole batch whenever
the world origin falls outside the frustum, which in a room this size is most of the time.
The entire wall of nail polish disappeared the moment the camera turned to look at it.

**GSAP lag smoothing.** GSAP's ticker assumes that a frame longer than half a second means
the tab was backgrounded, and clamps the step to 33 ms. On a device slow enough to trigger
that, a two-second camera move takes closer to a minute of real time and visibly hangs
part-way between two views. Every move therefore carries a wall-clock deadline; when it
passes, the camera is snapped to its destination. On normal hardware this never fires.

---

## 6. Booking

The salon takes bookings on WhatsApp, so that is what the form does: it validates the
request, composes the whole message, and hands it over. There is no backend, and adding a
fake one would be worse than useless. Swap in a real one later by replacing the `submit`
handler in `components/sections/BookingSection.tsx`.

Four browser defaults were replaced because they were actively wrong here:

- **The date field.** `<input type="date">` renders as an American `mm/dd/yyyy` box in most
  browsers whatever the page language, and it cannot grey out days the salon is shut. It is
  now a real calendar (`components/ui/DatePicker.tsx`): day-first `Thu, 12 Sep 2026`,
  Monday-first weeks, today ringed, past days and any closed day disabled, Today/Tomorrow
  shortcuts, and it flips above the trigger when the field sits low on a phone. Arrow keys
  move by day and week, Page Up/Down by month, Home/End across the week, Enter selects,
  Escape closes and returns focus.
- **The service list.** 135 options in one dropdown is unusable. Pick a category chip first
  and the list drops to ~30.
- **The time field.** Times are tappable slots generated from the real opening hours, at
  half-hour steps, stopping 45 minutes before close so the last appointment can finish.
  On the current day, slots that have already passed — or are less than an hour away — are
  removed rather than accepted and then quietly declined.
- **The phone field.** A fixed `+91` sits inside the field; the input takes ten digits and
  strips anything else as you type.

### A time-zone bug worth knowing about

The obvious way to get today's date is `new Date().toISOString().slice(0, 10)`. That
converts to UTC first, and India is UTC+5:30 — so between midnight and 05:30 IST it
returns **yesterday**. A late-night visitor would have been told their booking was in the
past, or offered a slot that had already gone.

Everything in `utils/dates.ts` therefore builds ISO strings from local date parts and
parses them back with the numeric `Date(y, m, d)` constructor, which is local by
definition. The same trap applies to `new Date('2026-09-12')`, which parses as UTC
midnight.

## 7. Performance

### Device tiers

`utils/perf.ts` profiles the device once, before three.js is even imported.

| Tier | Trigger | Gets |
| --- | --- | --- |
| `high` | WebGL2, >4 cores, >4 GB, desktop | Floor + mirror reflections, shadows, bloom, DPR ≤ 2 |
| `medium` | Mobile, WebGL1, or modest hardware | Mirror reflections at half res, no shadows, no post, DPR ≤ 1.5 |
| `low` | ≤2 cores or ≤1 GB | Environment lighting only, reduced detail, DPR 1 |
| `none` | No WebGL context, or a software renderer (SwiftShader / llvmpipe) | The static cinematic experience |

A software renderer is deliberately sent to the fallback: it *can* draw the scene, but
never at a frame rate worth shipping.

### What keeps it fast

- **Code splitting** — three.js is its own 946 kB chunk (255 kB gzipped) that loads in
  parallel with the page. The marketing shell paints without it.
- **Shared geometry and materials** — seven chairs upload one seat and compile one
  leather shader (`models/geometries.ts`, `materials/sharedMaterials.ts`).
- **Instancing** — 36 nail-polish bottles, 22 wash-bay products, 12 downlights, 5 ceiling
  speakers, 6 drawer pulls and the sofa tufting are instanced.
- **LOD** — chairs drop to a simpler build at 6.5 m and a 4-primitive silhouette at 13 m.
- **One reflection pass per surface group** — the three capsule mirrors are merged into a
  single `ShapeGeometry`, so they cost one render, not three.
- **Baked shadows** — nothing in the salon moves, so shadow maps are drawn once.
- **Zero texture downloads** — the marble, wall break-up, fabric and all signage lettering
  are generated to canvas at runtime.
- **AdaptiveDpr** — resolution drops before frame rate does. It is driven by
  OrbitControls' `regress`, so it only ever acts during a drag, and floored at 3/4 so
  the dip is not visible.
- **Frame watchdog** — sustained drops below 30 fps degrade the scene automatically.

### Why phones could not scroll, and what changed

The film is a fixed layer behind the page, and every content panel was frosted glass —
`backdrop-filter: blur(18px)` — with more glass nested inside the team sheet (the
founder card and the groups) and the story's point cards standing on their own. A backdrop blur is not painted once: it is
re-done on every frame the backdrop changes, at device resolution, once per blurred
surface, and the backdrop here is a video that changes 30 times a second. On a Samsung
S10 (1440×3040, ~3.5× pixel density) with two panels and their nested cards in view that
was four or five full-screen blur passes per video frame on a mobile GPU, and the page
could not scroll at all.

Now: **no backdrop blur on any content surface, on any device.** A laptop simulation
(1366×768, 2× CPU throttle, GPU work in software) scrolled past the gallery and team sheets
at an average of 46.7 ms a frame with the blur and 18.2 ms without — eighteen frames over
50 ms against one — so the blur was the laptop's lag as well as the phone's. Every panel and
sheet and the story's point cards keep the translucent ivory surface, made a little more
opaque (90% rather than 82%) so the type reads as it did through the blur; the film shows
through just the same. The only blurs left are the small ones, the header bar and the view
chips on pointer devices; touch devices have none at all, nor the menu, the lightbox scrim
or the date picker. The idle-time 3D warm-up also never runs while the page is being
scrolled, and a phone gets six seconds after the title card before it starts.

**The room must always appear on a phone.** Two things once stopped it. First, the device
rule sent any two-core device to the photographs — and every iPhone and iPad reports at
most two cores to a website, whatever the chip (WebKit caps `navigator.hardwareConcurrency`
for privacy), so no iPhone ever saw the room. The core count is no longer evidence on iOS;
a genuinely two-core Android gets the light room, and only a device without WebGL2, with a
software renderer or with a gigabyte of memory gets the photographs. Second, the phone
warm-up yielded to every scroll with no upper limit, so the room could wait behind its
photograph indefinitely. Now each idle step waits at most five seconds for the page to go still;
the moment the visitor is actually looking at the box and has stopped scrolling, the
warm-up stops yielding and finishes at once (`salonHurry`); and a fail-safe shows the room regardless six seconds
after they started looking (fifteen if it mounted off screen), compiling whatever is left
on the first frames.

**Android specifics.** Two things an Android browser does that a desktop never shows.
The page declares `color-scheme: only light` (meta tag and `:root`), because Chrome on
Android (Auto Dark Theme) and Samsung Internet (dark mode) otherwise recolour a light site
on their own whenever the phone is in dark mode — ivory panels turn charcoal, gold turns
mud. And Android reclaims WebGL contexts under memory pressure and after a long spell in
the background: a lost context used to be a black box that never redrew (the loop is on
demand and nothing asks), so the canvas now reports `webglcontextlost` and the section
rebuilds the viewer with a fresh context, the photograph covering the box while it warms
again; after three losses the photographs take over for good.

**A phone builds the room by itself, but never draws it before it is ready.** The warm-up
on a phone is the same staged, idle-time sequence as on a desktop (with a six-second
breather after the title card), one shader program per idle slice and never while the
page is being scrolled. The one extra guard: the photograph stays on top until every
program is compiled and the first frame has been drawn off screen (`salonWarm` in the
experience store), and the room then fades in under it — a phone never draws a frame of
the room before it is ready, so the handover is a fade, never a freeze. The phone also
gets the environment-mapped metal for the mirrors — the same rule the marble floor always
had — so a frame is one scene pass, not four: the three true reflections re-rendered the
whole room into their own buffers on every drawn frame, which is what saturated the
phone's GPU (and the browser's compositor with it) during every camera flight.

**Found in a review pass over the source, then fixed:** the header turned ivory over
the charcoal drawer when the menu was opened after scrolling on a phone (a touch-device
rule of the same specificity came later in the file than `.nav.is-open`; it now excludes
the open state); the booking dropdowns could widen the form past the screen on a 360 px
phone (a `<select>` is as wide as its longest option unless its grid track is
`minmax(0, 1fr)`, which every booking track and the services price rows now are); the
`svh`/`lvh` heights had no `vh` fallback, which would collapse the hero to zero on
Samsung Internet before 23 and iOS before 15.4 (fallback lines added); the page scrolled
underneath the lightbox and the drawer on iOS Safari, which ignores `body { overflow:
hidden }` once its toolbar collapses (`utils/scrollLock.ts` cancels touch panning at the
source, with the drawer's own list exempted); the section ScrollTriggers were measured while
the page was still `content-visibility: hidden` under the title card (the class is removed
first now and the refresh runs two frames later); the camera flew its two-second tween and
resized the drawing buffer twice on every section crossing even while the box was off
screen (it snaps when the loop is stopped); fiber re-measured the canvas 50 ms after every
scroll gesture (`resize.scroll` off); and fixed chrome ignored the safe-area insets of a
notched iPhone in landscape (honoured on the header, hero type, lightbox close and skip
button).

**The gallery is a dark boutique wall over the film.** A translucent espresso-rose band
(74%) — the salon film stays visible through it, as behind every other section — holding
the eight photographs in rows authored for each breakpoint — two rows of four on a desktop,
2 + 3 + 3 on a tablet, and on a phone a full-width frame, two pairs of portraits, the sign
full width and a final pair — every photograph whole at its own proportions, nothing
cropped, every row filling the width exactly with 14 px gaps (10 px on a phone) and nothing
left over. Each tile has a 3 px radius, a 1 px gold hairline and a short italic serif caption
over a soft gradient, no numbers. Hover zooms the photograph to 1.045 and turns the border
gold; there is no scroll animation in this section. The heading is "Step inside Cut N Curl"
with an italic line beside it; the foot is a gold rule, one line, and a solid gold button to
the booking section. The seven colours live in one labelled block at the top of
`tokens.css`, scoped to the wall, the lightbox and the nav's dark state. Body text and the
button are set in Jost (300–500, self-hosted like the other fonts); headings and captions
in Cormorant Garamond. Every tile is a real button with a visible gold focus ring; the
lightbox is a dialog with Escape, the arrow keys, and a click outside the photograph to
close; `prefers-reduced-motion` removes the zoom. A photograph that fails to load shows a
soft gold-brown block, never a broken image.

**The nav over the gallery.** The bar is shared by every section, so it wears the wall's
palette only while the gallery is the active section — a dark translucent bar, blush links,
gold underline on hover and on the current section, a gold-outlined Book that fills on hover
— and fades back as the next section takes over. Colours only; layout, type and the blur
policy are unchanged.

**Every gallery photograph is shown whole.** The grid used to crop each frame to a fixed
box, so the portraits lost their tops and the signage its edges — on the page, not only in
the lightbox. The gallery is a justified flexbox layout now: each frame's share of a row is
its own aspect ratio, so the frames in a row scale together, the row fills the width
exactly, and nothing is cropped (`.gallery__grid` in components.css; natural sizes in
`GALLERY`). Boxes are sized from the ratio before the image arrives, so there is no layout
shift. On a phone a wide frame takes the full width and two portraits pair up.

**The gallery on a phone.** Two things the client saw as "the photo overflows": the
lightbox sized its image with `vh`, which on Android is the viewport with the address bar
hidden, so with the bar showing — and a toolbar at the bottom on Samsung Internet — the
image ran off the bottom of the screen with its caption and close button; it is sized in
`svh` now, the height with every bar showing. And the gallery's slow hover zoom stuck on
touch screens (`:hover` clings to the last tap), leaving a photo at 104% in its frame; the
zoom is now pointer-only, and each frame isolates its rounded clip so a transformed image
can never paint outside it.

Related, and found by the same investigation: **the gallery lightbox hung off the bottom
of a laptop screen.** A `backdrop-filter` makes an element the containing block for its
`position: fixed` descendants, and the lightbox was rendered inside the gallery panel —
so on a desktop (where the panel was still glass) it was positioned against the panel,
not the viewport, and its image landed 100 px below the fold. It is rendered through a
portal into `<body>` now, out of reach of any ancestor's filter or transform.

**The film decodes in hardware.** The WebM (VP9) was listed first and Chrome took it; on
a laptop without VP9 hardware decoding — anything Intel before 2017, and many machines
since — that is a 1080p30 stream decoded on the CPU, a core to itself, and the page
stutters. The H.264 MP4 is listed first now: 2 MB larger, decoded for free everywhere.
The WebM remains as the fallback for a browser without H.264.

Two more things the same phone profile turned up, both fixed:

- **Section reveals were ScrollTrigger tweens, and every refresh thrashed layout.** A
  ScrollTrigger refresh (on load, after the title card, on every resize) reverts each
  `from()` tween to measure the page without its transforms, then re-applies it — a style
  write between every pair of measurements, so each of the sixteen triggers forced its own
  full layout. Under a 4× CPU throttle that was a single 1.4 s task at load. Reveals are
  now an IntersectionObserver that adds a class, and the motion is a CSS transition on
  opacity and transform (`.reveal-pending` / `.is-revealed` in global.css), which the
  compositor runs without touching layout. ScrollTrigger keeps only the eight section
  triggers that drive the camera, which write nothing.
- **Web fonts caused a second page-wide layout.** The families came from Google Fonts,
  so the page was laid out first with fallback fonts, then again — every text node
  re-measured — as each family arrived. The trace showed that reflow as the single longest
  task of the load, 1.1 s of pure layout under a 4× throttle. The fonts are now
  self-hosted (`public/fonts/`, latin subset, fetched by `tools/fetch-fonts.py`;
  `src/styles/fonts.css`), and every face is preloaded
  from `index.html`, so the page is laid out once, with the real fonts. It also removes
  two third-party connections and their Content-Security-Policy entries.
- **ScrollTrigger creation.** Each section created its trigger inline in its effect, between
  the other sections' style writes, so registering eight triggers cost eight layouts. They
  are now created in a microtask after the commit and measured against one layout. The
  two fixed-time `refresh()` calls in `App.tsx` are gone as well; the refresh on `load`
  and on `document.fonts.ready` remain.
- **The title card is lighter on touch devices.** The words arrive on opacity and transform
  alone — no animated blur filter on three text layers at 3× density during the busiest
  second of the load — and the grain layer, a full-screen texture re-composited seven times
  a second, is not drawn. The card reads the same.
- **The address bar.** On a phone the viewport height changes every time the browser's
  address bar collapses or expands during a scroll, and each change fired a ScrollTrigger
  refresh mid-gesture. `ScrollTrigger.config({ ignoreMobileResize: true })` ignores
  height-only changes on touch devices; a rotation still refreshes.

And two things for the phones at the far end of the range:

- A device without WebGL2 (iOS 14 and older, some old Android WebViews) now gets the
  photography in the 3D section instead of a renderer exception — three.js r163+ is WebGL2
  only — and a device with two cores or a gigabyte of memory gets the photography too,
  rather than a chunk parse and shader compile it would feel.
- The viewer is wrapped in an error boundary: a failed chunk download, a refused GPU
  context or a driver fault shows the photographs instead of taking the page down.

Measured in a phone simulation (412×915 at 3× density, 4× CPU throttle, GPU work in
software so GPU costs show up as frame time): see the "phones" row in §10.

### Why the salon section used to stall the page, and what changed

Two separate costs used to land on the visitor at the same scroll position, and together
they read as the page hanging when the 3D section came into view.

1. **A freeze on arrival.** The viewer mounted when the section was within 900 px, and
   mounting is the expensive part: parsing the three.js chunk, building the room, painting
   the procedural textures and — via drei's `<Preload>` — compiling twenty-odd shader
   programs *synchronously*. On a mid-range laptop that was a second or more of blocked
   main thread, timed exactly to the moment of scrolling.
2. **Constant redrawing once visible.** The render loop ran every frame while the box was
   near the screen, and every frame is heavy: the marble floor and the three mirror banks
   are true reflections, so one frame is four extra renders of the room before bloom and
   4× MSAA at up to 2× pixel density. A settled, motionless room was costing that
   continuously, and the page's scrolling was starved of the GPU for as long as the box
   stayed on screen.

Neither is visible any more, and nothing about the room's appearance changed:

- **The viewer warms up in idle time, in stages, not at a scroll position.** Two
  seconds after the title card leaves, `requestIdleCallback` (`utils/idle.ts`) runs the
  warm-up one step per idle moment: fetch and parse the three.js chunk; paint the
  procedural textures and build the shared geometry (`warmAssets`); mount the canvas and
  its WebGL context; mount the room; compile its shaders in the background; draw one
  frame off screen. Done as a single step the mount was about a second of blocked main
  thread, and it landed on whatever the visitor was doing at that moment — usually
  scrolling through the services — which is exactly the "hang" that was reported after
  the first fix. No stage is now long enough to be felt. The 900 px trigger remains as
  the fallback for someone who scrolls straight down. The idle helper also refuses to fire
  while the page is being scrolled (compositor scrolling leaves the main thread "idle"
  at exactly the wrong moment), waiting for 350 ms of stillness first.
- **Shaders compile one program at a time, in idle moments, and the first frame is drawn
  off screen.** `<Preload>` compiled everything in one synchronous call; a single
  `renderer.compileAsync(scene)` is no better on a phone whose driver links synchronously
  regardless of `KHR_parallel_shader_compile` — twenty-odd programs in one block held the
  main thread and the GPU for seconds on a Samsung, and because the compositor shares that
  GPU the whole phone appeared to freeze a few seconds after the page opened. `WarmShaders`
  in `SalonScene.tsx` now walks the room, compiles each distinct material's program with
  its own `compileAsync(object, camera, scene)` call, and yields to the idle helper between
  programs (which also waits for the page to be still). Once the last one is ready, one
  frame is stepped by hand while the loop is still stopped — that frame bakes the
  environment and allocates the reflection and bloom buffers, and used to be the hitch on
  arrival.
- **Camera flights ease resolution the way drags do.** Each tween tick calls
  `performance.regress()`, so `<AdaptiveDpr>` drops the pixel ratio (never below 3/4)
  while the camera is moving and restores it on landing.
- **Frames are drawn on demand.** The canvas runs `frameloop="demand"` while near the
  screen and `never` otherwise. The camera controller asks for a frame on every tween tick
  and on landing, OrbitControls asks for one on every change (which is how damping keeps
  running), and a small `Wake` component asks for four when the box becomes active so the
  environment map, reflections and bloom converge. A room nobody is moving draws nothing:
  measured as **zero WebGL draw calls** over ten seconds with the box on screen, and zero
  when scrolled past. The watchdog ignores the gap between two demand frames, so a settled
  room is never mistaken for a dropped one.

### Bundle

| Chunk | Raw | Gzip |
| --- | --- | --- |
| `index.html` | 3.60 kB | 1.42 kB |
| CSS | 33.06 kB | 7.36 kB |
| app shell | 55.08 kB | 17.60 kB |
| scene | 61.71 kB | 18.34 kB |
| gsap | 114.85 kB | 45.47 kB |
| react | 242.57 kB | 76.73 kB |
| **three (deferred)** | 945.91 kB | 254.55 kB |

Plus ~670 kB of salon photography and brand marks, all under 130 kB per file.

### A note on bloom

Every light-emitting surface uses an **HDR colour above 1.0** (`materials/emissive.ts`)
and bloom's threshold sits exactly at 1.0. This matters: tone-mapped ivory plaster lands
around 0.9, so any lower threshold blooms the walls and washes the entire salon out.
Relative glow strengths are tuned via `LIGHTING.emissive`.

### Exposure, measured

The rig was rebalanced against **histograms of the actual render**, not by eye. Each
camera pose is screenshotted and its luminance distribution measured. The old rig:

| | mean luminance | clipped white | in shadow |
| --- | --- | --- | --- |
| Before | 228–239 / 255 | **44–60%** of every frame | 0% |
| After the rebalance | 180–189 / 255 | 0–4.5% | 0% |
| After tone mapping was connected | 156–170 / 255 | **0.00–0.07%** | 0–0.3% |

Measured across every camera pose; the spread between the brightest and darkest is now
14 luminance levels, so the room holds up wherever the camera goes rather than being tuned
for the hero frame. Peak luminance sits at 195–219 — nothing in the salon reaches white,
which is what leaves the highlights somewhere to go.

44–60% of the frame at pure white is why the salon read as a glare: walls, ceiling,
chairs and marble had all clipped onto the same value, so nothing could separate from
anything. Three things fixed it, in order of how much they mattered.

1. **The whites were spread apart in value.** Wall, ceiling, marble, leather and lacquer
   were authored between 94% and 98% white — under two stops between the five biggest
   surfaces in the room. No exposure exists at which those separate. They now step:
   lacquer > ceiling > wall > marble > leather. **Keep that order and keep the gaps.**
2. **Every emitter came down in proportion to how much of the frame it filled.** The key
   spot went 16 → 7.2, the LED fills 3.5 → 1.25, the environment rig's central band
   3.8 → 2.1. A point light behind the bench was printing a blown hotspot on the back
   wall — the brightest thing in the hero frame was a lamp lighting flat plaster — so it
   moved 1.7 m off the wall and dropped to 1.5.
3. **Exposure came last**, 0.84 → 0.67, as a trim. It is the wrong first move: turning it
   up re-clips the highlights immediately, and turning it down just greys the room.

Shadow sits at 0% deliberately. The brief is a bright luxury interior with detail
everywhere, so "no pixels below 28/255" is the target, not a failure — depth comes from
the midtone gradient and the vignette, not from black.

### Tone mapping was never running on the top tier

Worth its own heading, because it is the kind of bug that hides behind a plausible-looking
image. `SalonScene` sets `gl.toneMapping = ACESFilmicToneMapping`, which is correct — and
which the **effect composer ignores**. The composer renders the scene into its own HDR
buffer, so on the top tier there was no filmic curve at all, only clamping, and
`toneMappingExposure` was inert.

It was invisible until someone asked for the room to be dimmed a little and nothing
happened. Proven by setting exposure to an absurd 0.25 and measuring both tiers:

| Tier | mean luminance at exposure 0.25 |
| --- | --- |
| medium (no composer) | 104 — responds |
| high (composer) | 201 — does not move |

`Effects` now carries an explicit `<ToneMapping mode={ACES_FILMIC} />` pass, placed after
Bloom so the glow is gathered in HDR and tone-mapped with everything else, and before
Vignette so the corner falloff lands on the finished image. Consequences:

- The top tier gained real highlight rolloff. Nothing clips any more — peak luminance
  went 255 → 240 and the clipped-white figure to **0.00%**.
- All three tiers now share one exposure knob and sit within about ten luminance levels
  of each other. They used to diverge wildly depending on the device.
- Part of why the salon blew out so easily in the first place was simply that the curve
  meant to prevent it was not connected.

Two things this pass fixed that were not cosmetic:

- **The mirror view rendered with a red channel of exactly zero** — a cyan-green frame.
  It was the HDR emissive values saturating the reflector's render target; bringing the
  emitters under control fixed it. Worth knowing, because the symptom looked like a
  colour-space bug and was really an exposure one.
- **The ceiling strips were cool white.** They are 3000K in the reference; driven from
  `ledCool` they tone-mapped to paper and read as white bars painted on the ceiling
  rather than as warm light. They now key off `PALETTE.led`.

### The mobile menu

The drawer is **charcoal, not ivory** — the one deliberate inversion in an otherwise
light palette. It used to be ivory at 94% opacity floating over an ivory 3D salon, which
is the single background it could not separate from: the room showed through the type and
the menu read as a watermark. Charcoal is the only value here the salon cannot swallow.
Measured contrast is **11.1:1** (WCAG AAA wants 7:1).

The links are uppercase **Manrope 500**, not the display serif — navigation is Manrope
everywhere else in this site, and a 300-weight serif reversed out of a dark panel is
exactly the thin type that disappears on a phone in sunlight. Tap targets measure 60–65px
at every width. The header bar goes dark with the drawer so the two read as one surface,
the toggle carries its own ring so it stays findable over both blown marble and the black
gloss band, and the booking CTA lives in the drawer because the desktop Book button is
hidden at this width.

**One real bug fixed here.** `backdrop-filter` makes an element a containing block for
its `position: fixed` descendants. The drawer is a child of the header, so the filter on
`.nav.is-scrolled` meant that opening the menu **anywhere below the fold** collapsed it:
`inset: 62px 0 0` resolved against the 62px bar instead of the viewport, giving a 40px
sliver with the links spilling out of it. `.nav.is-open` now clears the filter — it is
96.5% opaque and has nothing to blur anyway. If you ever put a filter back on `.nav`,
this breaks again.

---

## 8. The fallback

When WebGL is unavailable or the device cannot cope, `scenes/StaticSalon.tsx` plays the
real photography as a slow cross-fading Ken Burns sequence. **Every section of the site
keeps working** — services, gallery, booking, contact. Only the interactive camera is
missing.

Force it with `?fallback=1`.

---

## 9. Swapping in the real GLB

The salon currently renders as a **fully procedural blockout**. Nothing imports a `.glb`,
and no placeholder file is referenced, so the build is never broken by a missing asset.

When a photogrammetry / Blender export is ready:

1. Export with these settings:
   - **Metres**, Y-up, origin at the shopfront centre (`x=0, z=-8.0` in room space)
   - Draco or Meshopt compression; KTX2 textures where possible
   - Baked lighting is welcome — the rig in `LightingSystem` will still add fill
2. Save it to `public/models/salon.glb`
3. Set `MODEL.useGltf = true` in `src/config/room.config.ts`

`SalonModel` then HEAD-probes the URL and only imports the loader chunk if the file is
genuinely there. If it 404s, is served as HTML by a dev server, or fails to parse, the
site silently falls back to the procedural salon — flipping the flag early cannot break
production.

Adjust `MODEL.scale`, `MODEL.position` and `MODEL.rotationY` if the export's origin
differs. Cameras, collision, lighting and UI all carry over untouched.

**Optional:** to serve Draco decoders yourself instead of from a CDN, copy
`node_modules/three/examples/jsm/libs/draco/gltf/` into `public/draco/`.

---

## 10. QA

Query-string overrides:

| URL | Effect |
| --- | --- |
| `?fallback=1` | Force the static experience |
| `?tier=low` | Force the low render tier |
| `?tier=medium` | Force the medium tier |
| `?tier=high` | Force the high tier (bypasses software-renderer detection) |
| `?intro=1` | Replay the opening title sequence |
| `?intro=0` | Skip the opening title sequence |

### What has been verified

- `npm run typecheck` — clean, with `noUnusedLocals` / `noUnusedParameters` on
- `npm run test:camera` — all checks pass
- `npm audit --omit=dev` — 0 vulnerabilities
- Rendered in headless Chrome at `low`, `medium` and `high` tiers — **no console errors,
  no failed requests**, at 1000×620 and 960×560
- Static fallback checked at 390×844 (mobile) and 1440×900 (desktop)
- Camera switching, the Explore transition, the mobile nav drawer, the gallery lightbox
  and the booking form all exercised
- The opening title sequence checked frame by frame at 1440×900 and 390×844: the words
  land in order (Cut, then N, then Curl), the film decodes (`readyState 4`, 512×512, no
  media error), and the card leaves cleanly — skip button, Escape, once-per-tab,
  `?intro=1` replay and hash deep-links all verified, with the page's own `overflow`
  restored rather than clobbered
- Frame pacing across the sequence profiled at 1x, 2x and 4x CPU throttle (table above),
  and section reveals confirmed to still fire after the card, on both the intro and
  no-intro paths
- Lighting measured as a luminance histogram at every camera pose, before and after
  (table under "Exposure, measured")
- Mobile menu checked at **320 / 375 / 390 / 414 / 430 / 768px**: all eight links present,
  60–65px tap targets, 11.1:1 text contrast, no overlap, no clipping, no horizontal
  scroll, CTA reachable, and the drawer scrolls rather than clips on short screens
- Menu data asserted against the live DOM: 135 services in 21 groups, Indian digit
  grouping (₹1,500 / ₹18,000), duplicate service names disambiguated by their qualifier,
  15 team members rendered, and management and the founder correctly excluded from bookable stylists
- The film driven in a real browser, desktop (1440×900) and mobile (390×844):
  autoplay succeeds muted and inline with no controls; the WebM is chosen on desktop and
  the 9:16 MP4 on a phone; the poster is the film's own first frame; the navigation reads
  in ivory over the film and settles onto the glass bar once the hero is mostly gone; the
  mobile drawer opens as a solid charcoal panel
- The film scroll-tested as a persistent background: the page was jumped to every one of
  the eight sections in turn and back to the top, sampling the element each time. On both
  desktop and mobile the video was never paused, `currentTime` only ever moved forward
  (wrapping once at the 21 s loop point), the element tagged at the start was the same one
  at the end, exactly one `<video>` existed throughout, the layer stayed fixed at 0,0 and
  full-viewport, `elementFromPoint` at the centre of the screen never returned the film
  layer, and there were no console errors
- Horizontal overflow checked at **320 / 375 / 390 / 414 / 430 / 768 / 1024 / 1440 / 1920 px**:
  zero at every width, with the film layer measuring exactly the viewport
- The contained 3D viewer verified with the tier override: mounts inside its box, draws,
  lists its six views, and opens on the styling stations. Note for anyone re-running this
  under a software renderer: GSAP's lag-smoothing caps each starved frame at 33 ms of tween
  time, so a large canvas can show a camera move still in flight for minutes — a smaller
  viewport lands in seconds. A real GPU does not have this problem.
- Camera behaviour driven in a real browser: every view in the switcher moved the camera
  with `window.scrollY` unchanged, including from deep in the page; genuinely scrolling
  afterwards handed the camera back to the section in view; each of the six views was
  screenshotted and confirmed to frame its subject rather than a wall; and a one-finger
  swipe on a phone scrolls the page (`touch-action: pan-y`)
- **Phones.** A phone simulation (412×915 at 3× pixel density, Android user agent, 4× CPU
  throttle, GPU work in software so GPU costs show up as frame time) scrolled like a thumb
  through hero → services → the salon → team, measuring every frame. Before the fixes in
  §7: services → salon averaged 20.6 ms per frame with a worst frame of 150 ms and six
  frames over 50 ms across the run; the longest main-thread tasks at load were 1379 ms and
  887 ms. After: every segment averages 16.6 ms with a worst frame of 17 ms (one of 50 ms),
  zero frames over 50 ms, and the longest tasks at load are the initial React render and
  the one initial layout under the title card (0.7–1.0 s each in the simulation, which
  inflates them four-fold). On the final build every segment averages 16.6 ms with a worst
  frame of 17 ms. On the phone itself every panel, the header, the drawer and the chips are
  confirmed to carry no backdrop blur, and the film plays through every section.
- **A Samsung S20 Ultra, end to end**, in a Chrome profile (Exynos, Mali-G77, 412×915 at
  3.5×) and a Samsung Internet profile (Snapdragon, Adreno 650, 384×854), with the phone in
  dark mode, 3× CPU throttle and the page's own device detection: the title card shows and
  leaves; the film plays by itself (the H.264 phone edit) and is still playing in every
  section; the site keeps its own palette in dark mode; a top-to-bottom scroll of the whole
  page stays within 1% slow frames; the 3D room appears by itself with six views, a tap
  moves the camera and one finger still scrolls the page over the box; after a forced loss
  of the WebGL context the viewer is rebuilt with a fresh canvas and shown again; the menu
  opens with eight links on a dark header; the gallery shows eight whole photographs; the
  lightbox fits the screen; the booking form fits and composes the WhatsApp request; no
  sideways scrolling; no page errors.
- **The 3D room on phones**, with the page's own device detection running (no tier override;
  only the software renderer's name masked so it behaves as on the real GPU): an iPhone
  profile (reports 2 cores and no `deviceMemory`), a Samsung S10/S20 profile (8 cores, 8 GB)
  and a budget Android profile (2 cores, 2 GB) each get the WebGL canvas, the six views and
  the photograph gone, by themselves, with no page errors and no photos-only fallback. The
  iPhone profile is the one the old two-core rule sent to the photographs.
- **The film's keeper**, desktop and phone: the element paused from outside is playing again
  within two seconds; a media error fired on it hides the frozen frame, shows the animated
  stand-in, reloads the element and has the film playing again — the same single element
  throughout — and it keeps advancing afterwards, with no page errors.
- **The gallery wall**, measured at fifteen widths from 320 px to 1920 px: eight tiles
  covering every cell of the grid (120 of 120 at twelve columns, 84 of 84 at six, 24 of 24 at
  two), none escaping, none overlapping, eight captions with no numbers, the espresso band
  behind the section, the nav in its dark state over it on desktop and touch widths, Jost
  loaded, zero horizontal overflow. Keyboard: Tab reaches a tile with a visible gold ring,
  Enter opens the lightbox (focus lands on Close), ArrowRight advances, Escape closes, and a
  click outside the photograph closes.
- **The editorial gallery** (superseded by the wall; kept for the record), measured at fifteen widths from 320 px to 1920 px: all eight
  frames at their true proportions (nothing cropped), every frame, label and the caption
  block inside the panel, no two frames overlapping each other, the oversized word inside
  the panel at every width and partly covered by the tall frame from 600 px up, and zero
  horizontal overflow. Section screenshots at phone, tablet and desktop sizes reviewed by
  eye. Items are confirmed to settle at `transform: none` and full opacity after the reveal.
- **The client's two phone reports, reproduced and closed.** The lightbox opened on a
  portrait photo at Samsung S10 and S20 sizes with the address bar and bottom toolbar
  showing (360×600, 360×640) and at iPhone size with bars (390×664): image, caption and
  close button all inside the viewport in every case, and the thumbnail is back at scale 1
  after the tap (no sticky hover zoom). The hero reads name → location line → headline on
  phone and desktop, with 22–24 px between the name and the line.
- **A full review pass over the source**, then fixes, then everything re-run. The code was
  read four times with a different concern each time (main-thread stalls, GPU/compositor
  stalls, narrow-screen layout and Samsung/Chrome quirks, iOS Safari), and every suspected
  problem was checked against the code and against its real effect on a phone before being
  fixed. Four were real (the mirrors' reflections on phones, the header over the open
  drawer, the booking dropdowns, the price rows), all fixed; the cheap hardening found
  along the way was done too (viewport-unit fallbacks, the iOS scroll lock, the trigger
  refresh after the card, the off-screen camera snap, safe areas). See §7.
- **The phone path, re-verified after the audit:** the section offers the button with no
  canvas built; after the tap the room is warm and shown with its six views (174 s under
  software GL, where every shader program compiles on the CPU — a real phone's GPU links
  them in a few seconds); the menu opened after scrolling has a charcoal header
  (`rgb(16,14,12)`) with an ivory wordmark; the booking controls stay inside the panel after
  a long service is chosen (350 px panel); and horizontal overflow is zero at every width.
- **Full functional regression**, desktop and phone, after all of the above: the title
  card shows and leaves; the film plays as a single element from top to bottom; the hero
  and section reveals run; desktop nav links scroll to their section and mark it active;
  the phone drawer opens with eight links and a link closes it and scrolls; the services
  tabs switch categories; the 3D viewer mounts with six views, a view chip activates, and
  the canvas keeps `touch-action: pan-y`; the gallery lightbox opens and closes on Escape;
  the booking form rejects an empty submit with five errors and focuses the name, strips
  letters from the phone and caps it at ten digits, renders a 42-cell calendar, offers
  25 slots for a chosen day, and composes the WhatsApp request to +91 70158 05946 with the
  visitor's name; the contact section carries the phone, email, WhatsApp, Instagram and
  map; and no page errors anywhere. Horizontal overflow is zero at 320 / 375 / 390 / 414 /
  430 / 768 / 1024 / 1440 / 1920 px.
- The built site served with the exact headers from `public/.htaccess` (CSP included) and
  driven in a real browser on desktop and mobile: no CSP violations, both self-hosted
  webfonts loaded,
  the background film playing muted and inline with the `muted` attribute present and no
  controls, the opening card playing and leaving, the map embed present, and the 3D viewer
  mounting with its six views
- The films withheld entirely (every request for `/media/*.mp4|webm` blocked — what the
  live WordPress domain does today): the page opens on the poster, no play control or
  media chrome is visible, the video element stays at opacity 0, and the intro still
  stands in for its film
- Autoplay refusal simulated (`play()` rejecting with `NotAllowedError` until the first
  click, which is what iOS Low Power Mode does): the opening card shows the animated badge
  over its still with the film at opacity 0; the background shows the animated film over
  its poster with the video at opacity 0 and no `is-ready`; the animated images are
  decoded and sized to the viewport; a scroll gesture does not trigger a retry; and the
  first click starts the same single video element, after which the animation is removed
- Booking form driven end to end in a real browser: empty submit raises all five errors and
  focuses the first; the phone field strips letters and caps at ten digits; the calendar
  renders 42 cells with past days disabled and today ringed; picking Tomorrow yields the
  25 slots between 9:00 AM and 9:00 PM; category chips cut the service list from 40 to 31;
  and the composed WhatsApp URL carries the correct number and message

> Headless testing ran on SwiftShader (software rendering), which reaches ~8 fps — this
> is why the software-renderer path is routed to the fallback. Frame rates on real GPU
> hardware have not been measured; that needs a physical device.

---

## 11. Deploying

The build is fully static — `dist/` can go on any host. **Upload the build, never the
source.** The `src/` folder, `package.json` and `node_modules/` are the workshop; a host
handed those will try to run them and complain — "JSX" is not something a web server
serves, and any `npm install` on a host prints its own audit of the developer tooling.
None of it belongs online. The published site is `dist/`: one HTML file, a handful of
hashed JS/CSS files, the media, and an `.htaccess`.

**First: what is on the domain today.** At the time of writing, `cutncurl.in` serves a
WordPress site (Elementor, Astra theme) that Hostinger installed — every path of this
build, including `/media/hero-mobile.mp4`, answers 404 there. That is why a visitor saw a
broken video with a play control: there was no video on the server to play. This site
replaces that WordPress install; the two cannot share `public_html`, because WordPress's
own `.htaccess` sends every request to `index.php`. Either remove the WordPress site
first (hPanel → Websites → the site's menu → Delete, or simply empty `public_html`), or
deploy this build to a subdomain (hPanel → Domains → Subdomains, e.g. `new.cutncurl.in`,
whose folder is `public_html/new`) to preview it, then move it to the root.

**Hostinger (shared / cloud hosting, hPanel)**

```bash
npm ci
npm run package          # builds, then zips the CONTENTS of dist/ → cut-n-curl-site.zip
```

1. hPanel → Files → **File Manager** → open `public_html`. Delete whatever is in it
   (the Hostinger placeholder page, or the previous upload).
2. Upload `cut-n-curl-site.zip` into `public_html` and choose **Extract** on it, so
   `index.html`, `assets/`, `media/` and `.htaccess` sit directly inside `public_html`
   (not inside a `dist/` or `cut-n-curl-site/` sub-folder). Delete the zip afterwards.
   Turn on "show hidden files" if you want to see the `.htaccess`.
3. hPanel → **SSL** → make sure the free certificate is active and "Force HTTPS" is on.
   The `.htaccess` asks browsers to upgrade insecure requests, which assumes HTTPS.
4. If the site had been opened before, hPanel → Performance → **Cache Manager** → purge,
   and hard-refresh the browser. `index.html` is sent with `no-cache`, so from then on a
   new upload is live immediately.
5. **Check the films arrived.** Open `https://<your domain>/media/hero-mobile.mp4` and
   `/media/hero-desktop.webm` directly in the browser; each must play, not show a 404
   page. The File Manager occasionally skips large files in a drag-and-drop upload, which
   is exactly why the archive is the recommended route. Without those files the page still
   opens on the poster and never shows a play control, but it is a poster, not the film.

That is the whole deployment. No Node.js on the host, no `npm`, no build step there, so
nothing for the host's scanner to report.

`public/.htaccess` (copied into `dist/` by the build) does four things on Apache or
LiteSpeed, which is what Hostinger runs: registers the MIME types for the films and the
model in case the host's table lacks one; enables gzip for text files; sets caching
(`assets/*` a year, immutable, since the names are content hashes; media a month;
`index.html` never); and sends the security headers — `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a Content-Security-Policy
that allows exactly what the page loads: its own files (fonts included) and the Google
Maps embed. It was tested against the built site in a real browser with those exact headers
(see §10). If the site is ever moved into a sub-folder rather than the domain root, set
`base` in `vite.config.ts` and `RewriteBase` in the `.htaccess` to match.

If Hostinger's Git deployment is used instead (hPanel → Advanced → Git), the build
command is `npm ci && npm run build` and the publish directory is `dist`. The build script
is the bundler alone — `vite build` — so it never depends on a TypeScript step on the
host; types are checked by `npm test` (and `npm run verify` runs both). Node 20.19 or
newer is required (`.nvmrc` says 22).

**Dependencies.** `npm audit` reports **0 vulnerabilities** across all dependencies,
development tooling included. The earlier report came from Vite 5's bundled esbuild
(GHSA-67mh-4wv8-2f99) and three Vite 5 dev-server advisories — all in the development
server, none in anything that ships, but noise nobody wants on a host. The project is on
Vite 7 and `@vitejs/plugin-react` 5 now, which clears them.

**Netlify**

```bash
npm run build
# Build command: npm run build   ·   Publish directory: dist
```

**Vercel**

```bash
npx vercel --prod     # auto-detects Vite
```

**Cloudflare Pages** — build `npm run build`, output `dist`.

**GitHub Pages** — set `base: '/<repo-name>/'` in `vite.config.ts` first, then publish
`dist`.

**Any other Apache/LiteSpeed host / cPanel** — same as Hostinger: upload the contents of
`dist/`; the `.htaccess` carries the rewrite, caching and headers. On Nginx, replicate
them in the server block: `try_files $uri /index.html;`, the cache headers above, and the
same CSP.

---

## 12. Before this goes live

Prices, services, the team, the contact details, the hours and the Instagram profile are
all real now. What is left is optional:

- [ ] Confirm the founder's name spelling. The catalogue cover and the framed vision
      statement both print **"Rjnish"**, so that is what the site shows — but if it is a
      typo for *Rajnish*, change `BRAND.founder` and `VISION_STATEMENT`.
- [ ] Confirm the professional-brand signage on the wash-bay wall should stay
      (`BRAND.partner` in site.config drives it)
- [ ] Optional: **headshots**. Add a `photo` path to any member of `TEAM` and their
      monogram tile becomes a portrait — no markup changes.
- [ ] Optional: the salon's Google listing shows **4.8 ★ from 972 reviews**. That is a
      strong trust signal and worth putting near the booking form, but it changes over
      time, so it is not hard-coded here.

Also worth knowing: the booking form has no backend. It validates the request and hands a
fully-composed message to WhatsApp, with an email fallback — which is how the salon
already takes bookings. Add a backend later by replacing the `submit` handler in
`components/sections/BookingSection.tsx`.

---

## Credits

Built with React 18, TypeScript, Three.js, React Three Fiber, drei, GSAP and Vite.
Interior reconstructed from photography and video of the salon itself.

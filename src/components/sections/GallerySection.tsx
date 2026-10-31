import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { GALLERY, GALLERY_COPY } from '@/config/site.config'
import { lockScroll } from '@/utils/scrollLock'

/**
 * The gallery wall — the one dark room on the site.
 *
 * A translucent espresso-rose band — the salon film stays visible through it
 * — holding eight photographs of the salon in rows authored for desktop,
 * tablet and phone: every photograph whole at its own proportions, every row
 * filling the width exactly, no gaps and nothing left over (see `.wall__grid`).
 * Each tile carries a short italic caption over a soft gradient — no
 * numbers — and opens the lightbox. Hover is a slow zoom and a gold border;
 * there is no scroll animation here on purpose.
 *
 * The colours are the seven variables at the top of tokens.css
 * (`--bg`, `--surface`, `--gold`, `--gold-soft`, `--blush`, `--ivory`,
 * `--line`), scoped to this section, the lightbox and the nav's dark state.
 *
 * Accessibility: every tile is a real <button> (Tab reaches it, Enter or
 * Space opens it) with a visible gold focus ring; the lightbox is a dialog
 * with Escape, the arrow keys, and a click outside the photo to close.
 */
export default function GallerySection() {
  const [open, setOpen] = useState<number | null>(null)
  /** Files that failed to load show a gradient block instead of a broken image. */
  const [missing, setMissing] = useState<Record<number, true>>({})

  const close = useCallback(() => setOpen(null), [])
  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? null : (i + delta + GALLERY.length) % GALLERY.length)),
    [],
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    const unlock = lockScroll()
    window.addEventListener('keydown', onKey)
    return () => {
      unlock()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close, step])

  return (
    <div className="gallery gallery-wall">
      <header className="wall__head">
        <h2 className="wall__title">{GALLERY_COPY.title}</h2>
        <p className="wall__lede">{GALLERY_COPY.lede}</p>
      </header>

      <ul className="wall__grid" aria-label="Photographs of the salon">
        {GALLERY.map((item, i) => (
          <li
            key={item.src}
            className={`wall__tile wall__tile--${item.tile}${missing[i] ? ' is-missing' : ''}`}
            /* Its own proportions size its box and its share of the row. */
            style={{ ['--r' as string]: (item.width / item.height).toFixed(4) }}
          >
            <button
              type="button"
              className="wall__btn gallery__btn"
              onClick={() => setOpen(i)}
              aria-label={`${item.caption} — view larger`}
            >
              {!missing[i] && (
                <img
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={() => setMissing((m) => ({ ...m, [i]: true }))}
                />
              )}
              <span className="wall__cap" aria-hidden="true">
                {item.caption}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <footer className="wall__foot">
        <p className="wall__foot-text">{GALLERY_COPY.closing}</p>
        <a className="wall__cta" href="#booking">
          {GALLERY_COPY.cta}
        </a>
      </footer>

      {/*
        Rendered into <body>, not inside the section: a `position: fixed`
        box is positioned against the viewport only if no ancestor has a
        transform or a filter, and the portal takes every ancestor out of
        the question.
      */}
      {open !== null && createPortal(
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={GALLERY[open].caption}>
          <button type="button" className="lightbox__scrim" onClick={close} aria-label="Close gallery" />
          <figure className="lightbox__figure">
            {missing[open] ? (
              <div className="lightbox__missing" aria-hidden="true" />
            ) : (
              <img src={GALLERY[open].src} alt={GALLERY[open].alt} />
            )}
            <figcaption>{GALLERY[open].caption}</figcaption>
          </figure>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => step(-1)}>
            <span className="visually-hidden">Previous photograph</span>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => step(1)}>
            <span className="visually-hidden">Next photograph</span>
            <span aria-hidden="true">›</span>
          </button>
          <button type="button" className="lightbox__close" onClick={close} autoFocus>
            <span className="visually-hidden">Close</span>
            <span aria-hidden="true">×</span>
          </button>
        </div>,
        document.body,
      )}
    </div>
  )
}

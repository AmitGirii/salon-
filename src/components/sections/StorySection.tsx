import { BRAND, STORY_POINTS, VISION_STATEMENT } from '@/config/site.config'

/**
 * Our Story.
 *
 * The copy is the salon's own framed vision statement, transcribed and lightly
 * tidied — it says more about the place than anything written from outside it
 * would. Everything here comes from `site.config.ts`.
 */
export default function StorySection() {
  return (
    <div className="story">
      <div className="panel panel--narrow story__panel">
        <p className="label" data-reveal>
          Our Story
        </p>
        <h2 className="display step-h2 story__title" data-reveal>
          A salon built on
          <em> standards</em>, not shortcuts
        </h2>
        <span className="rule" data-reveal />
        <p className="story__vision" data-reveal>
          {VISION_STATEMENT}
        </p>
        <p className="story__sign" data-reveal>
          — {BRAND.founder}, Founder
        </p>
      </div>

      <ul className="story__points">
        {STORY_POINTS.map((p) => (
          <li key={p.k} className="story__point" data-reveal>
            <span className="story__key label">{p.k}</span>
            <h3 className="story__point-title display">{p.title}</h3>
            <p className="story__point-body">{p.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

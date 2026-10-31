import { TEAM, type TeamMember } from '@/config/site.config'

const DISCIPLINE_ORDER: TeamMember['discipline'][] = ['Hair', 'Makeup & Nails', 'Skin', 'Front of House']

/** Initials for the monogram tile — first letters of up to two words. */
const monogram = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/**
 * The team.
 *
 * Fifteen people, grouped by what they actually do rather than listed flat —
 * with nine on hair alone, an undifferentiated grid would tell a visitor
 * nothing. The founder is featured; everyone else is grouped by discipline.
 *
 * Add a `photo` path to any member in site.config and their monogram tile is
 * replaced by the headshot, no markup changes needed.
 */
export default function TeamSection() {
  const founder = TEAM.find((m) => m.role.toLowerCase().includes('founder'))
  const rest = TEAM.filter((m) => m !== founder)

  const groups = DISCIPLINE_ORDER.map((d) => ({
    discipline: d,
    members: rest.filter((m) => m.discipline === d),
  })).filter((g) => g.members.length > 0)

  return (
    <div className="panel panel--sheet team">
      <header className="team__head">
        <p className="label" data-reveal>
          Our Team
        </p>
        <h2 className="display team__title" data-reveal>
          The people behind the chair
        </h2>
        <p className="team__intro" data-reveal>
          {TEAM.length} stylists, colourists, artists and therapists — the people who actually
          do the work.
        </p>
      </header>

      {founder && (
        <article className="team__founder" data-reveal>
          <div className="team__portrait team__portrait--lg">
            {founder.photo ? (
              <img src={founder.photo} alt={founder.name} loading="lazy" decoding="async" />
            ) : (
              <span className="team__monogram display" aria-hidden="true">
                {monogram(founder.name)}
              </span>
            )}
          </div>
          <div className="team__founder-body">
            <h3 className="team__name display">{founder.name}</h3>
            <p className="team__role label">{founder.role}</p>
            {founder.bio && <p className="team__bio">{founder.bio}</p>}
          </div>
        </article>
      )}

      <div className="team__groups">
        {groups.map((g) => (
          <section className="team__group" key={g.discipline} data-reveal>
            <h3 className="team__group-title label">
              {g.discipline}
              <span className="team__count">{g.members.length}</span>
            </h3>
            <ul className="team__list">
              {g.members.map((m) => (
                <li className="team__member" key={`${m.name}-${m.role}`}>
                  <span className="team__portrait">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} loading="lazy" decoding="async" />
                    ) : (
                      <span className="team__monogram display" aria-hidden="true">
                        {monogram(m.name)}
                      </span>
                    )}
                  </span>
                  <span className="team__member-body">
                    <span className="team__name display">{m.name}</span>
                    <span className="team__role label">{m.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

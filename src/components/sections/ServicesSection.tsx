import { useState } from 'react'
import { BRAND, PRICING_NOTE, SERVICE_CATEGORIES, type ServiceGroup } from '@/config/site.config'
import { countServices, formatPrice } from '@/utils/format'

/**
 * The service menu, transcribed from the salon's printed catalogue.
 *
 * The catalogue prices many services two ways — Male/Female for hair, and
 * Regular/Premium for colour, bleach and waxing — so the table carries those
 * columns rather than flattening everything to a single "from" figure. That
 * distinction is most of the menu's information.
 */
function PriceRow({ group, index }: { group: ServiceGroup; index: number }) {
  const s = group.services[index]
  const columned = Boolean(group.columns)

  return (
    <li className={`menu__row${columned ? ' menu__row--cols' : ''}`}>
      <span className="menu__name">
        {s.name}
        {s.note && <span className="menu__note">{s.note}</span>}
      </span>

      {columned ? (
        s.flat !== undefined ? (
          // Printed under the second column in the catalogue, but it is one
          // flat rate — so it spans both rather than implying "premium only".
          <span className="menu__flat">{formatPrice(s.flat)}</span>
        ) : (
          <>
            <span className="menu__price">{formatPrice(s.prices?.[0] ?? null)}</span>
            <span className="menu__price">{formatPrice(s.prices?.[1] ?? null)}</span>
          </>
        )
      ) : (
        <>
          <span className="menu__dots" aria-hidden="true" />
          <span className="menu__price">{formatPrice(s.price ?? null, s.from)}</span>
        </>
      )}
    </li>
  )
}

export default function ServicesSection() {
  const [active, setActive] = useState(SERVICE_CATEGORIES[0].id)
  const category = SERVICE_CATEGORIES.find((c) => c.id === active) ?? SERVICE_CATEGORIES[0]
  const total = countServices(SERVICE_CATEGORIES)

  return (
    <div className="panel panel--wide services">
      <header className="services__head">
        <p className="label" data-reveal>
          Services
        </p>
        <h2 className="display services__title" data-reveal>
          The menu
        </h2>
        <p className="services__partner" data-reveal>
          {total} services · Colour and care on {BRAND.partner}
        </p>
      </header>

      <div className="services__tabs" role="tablist" aria-label="Service categories" data-reveal>
        {SERVICE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            type="button"
            id={`tab-${c.id}`}
            aria-selected={c.id === active}
            aria-controls={`panel-${c.id}`}
            className={`services__tab${c.id === active ? ' is-active' : ''}`}
            onClick={() => setActive(c.id)}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div
        className="services__body"
        role="tabpanel"
        id={`panel-${category.id}`}
        aria-labelledby={`tab-${category.id}`}
        data-reveal
      >
        <p className="services__blurb lede">{category.blurb}</p>

        <div className="menu">
          {category.groups.map((group) => (
            <section className="menu__group" key={group.title}>
              <header className={`menu__head${group.columns ? ' menu__head--cols' : ''}`}>
                <h3 className="menu__group-title display">{group.title}</h3>
                {group.columns && (
                  <>
                    <span className="menu__col label">{group.columns[0]}</span>
                    <span className="menu__col label">{group.columns[1]}</span>
                  </>
                )}
              </header>
              <ul className="menu__list">
                {group.services.map((s, i) => (
                  <PriceRow key={`${s.name}-${s.note ?? ''}-${i}`} group={group} index={i} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <p className="services__foot">
        *{PRICING_NOTE} Prices may vary with hair length, density and product choice.
      </p>
    </div>
  )
}

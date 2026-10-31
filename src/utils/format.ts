import type { Price, Service, ServiceCategory } from '@/config/site.config'

/**
 * Formats a catalogue price.
 *
 * Amounts are plain rupee figures with Indian digit grouping. A few catalogue
 * entries are printed as ranges rather than single figures — those are stored
 * as pre-formatted strings and pass through untouched. `null` means the column
 * does not apply to that service.
 */
export function formatPrice(p: Price, from = false): string {
  if (p === null || p === undefined) return '—'
  if (typeof p === 'string') return p
  return `₹${p.toLocaleString('en-IN')}${from ? '+' : ''}`
}

/** A service's headline price, used where only one figure fits. */
export function leadPrice(s: Service): string {
  if (s.flat !== undefined) return formatPrice(s.flat)
  if (s.price !== undefined) return formatPrice(s.price, s.from)
  if (s.prices) {
    const first = s.prices.find((v) => v !== null)
    return first === undefined ? '—' : formatPrice(first)
  }
  return '—'
}

export type FlatService = {
  /** "Hair — Colour & Texture — Global Colour" */
  value: string
  category: string
  group: string
  service: Service
}

/**
 * Flattens the whole menu into a single list, for the booking form's service
 * picker. Duplicate names (the catalogue lists "Temporary Extensions" twice
 * with different qualifiers) are disambiguated by their note.
 */
export function flattenServices(categories: ServiceCategory[]): FlatService[] {
  const out: FlatService[] = []
  for (const c of categories) {
    for (const g of c.groups) {
      for (const s of g.services) {
        const label = s.note ? `${s.name} (${s.note})` : s.name
        out.push({
          value: `${c.title} — ${g.title} — ${label}`,
          category: c.title,
          group: g.title,
          service: s,
        })
      }
    }
  }
  return out
}

/** Total number of individual services on the menu. */
export const countServices = (categories: ServiceCategory[]) =>
  categories.reduce((n, c) => n + c.groups.reduce((m, g) => m + g.services.length, 0), 0)

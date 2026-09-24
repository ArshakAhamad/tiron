import Link from 'next/link'
import type { Facets } from '@/lib/aggregations'
import { INDUSTRIES, labelFor, SERVICES } from '@/lib/constants'
import { buildHref, isFiltered, type Filters as FilterState } from '@/lib/filters'

const BASE = '/case-studies'

type ChipProps = { href: string; active: boolean; count?: number; children: React.ReactNode }

function Chip({ href, active, count, children }: ChipProps) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={`inline-flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
        active
          ? 'border-ink bg-ink text-paper'
          : 'border-line bg-transparent hover:border-ink'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={active ? 'text-paper/70' : 'text-muted'}>
          <span className="sr-only"> (</span>
          {count}
          <span className="sr-only"> projects)</span>
        </span>
      )}
    </Link>
  )
}

/**
 * Pure server component: chips are real links and search is a GET form, so
 * filtering works without JS, is shareable, and every state is crawlable.
 */
export function Filters({ filters, facets }: { filters: FilterState; facets: Facets }) {
  const industryCounts = new Map(facets.industries.map((f) => [f.value, f.count]))
  const serviceCounts = new Map(facets.services.map((f) => [f.value, f.count]))
  const allIndustries = facets.industries.reduce((n, f) => n + f.count, 0)
  // Every project has exactly one industry, so summing industries gives the
  // count for "All" under the current service + search filters.

  return (
    <section aria-label="Filter case studies" className="space-y-5">
      <form action={BASE} method="get" role="search" className="flex max-w-xl gap-2">
        {filters.industry && <input type="hidden" name="industry" value={filters.industry} />}
        {filters.service && <input type="hidden" name="service" value={filters.service} />}
        <label htmlFor="q" className="sr-only">
          Search case studies
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Search by project or client"
          className="min-w-0 flex-1 rounded-md border border-line bg-white px-4 py-2.5 text-base placeholder:text-muted/70"
        />
        <button
          type="submit"
          className="rounded-md bg-cobalt px-5 py-2.5 font-medium text-white transition-colors hover:bg-cobalt-deep"
        >
          Search
        </button>
      </form>

      <nav aria-label="Filter by industry">
        <p className="mb-2 text-sm font-medium">Industry</p>
        <ul className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <li>
            <Chip
              href={buildHref(BASE, { service: filters.service, q: filters.q })}
              active={!filters.industry}
              count={allIndustries}
            >
              All
            </Chip>
          </li>
          {INDUSTRIES.filter((i) => industryCounts.has(i.value) || filters.industry === i.value).map((i) => (
            <li key={i.value}>
              <Chip
                href={buildHref(BASE, { industry: i.value, service: filters.service, q: filters.q })}
                active={filters.industry === i.value}
                count={industryCounts.get(i.value) ?? 0}
              >
                {i.label}
              </Chip>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Filter by service">
        <p className="mb-2 text-sm font-medium">Service</p>
        <ul className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <li>
            <Chip
              href={buildHref(BASE, { industry: filters.industry, q: filters.q })}
              active={!filters.service}
            >
              Any
            </Chip>
          </li>
          {SERVICES.filter((s) => serviceCounts.has(s.value) || filters.service === s.value).map((s) => (
            <li key={s.value}>
              <Chip
                href={buildHref(BASE, { industry: filters.industry, service: s.value, q: filters.q })}
                active={filters.service === s.value}
                count={serviceCounts.get(s.value) ?? 0}
              >
                {s.label}
              </Chip>
            </li>
          ))}
        </ul>
      </nav>

      {isFiltered(filters) && (
        <p className="text-sm text-muted">
          Showing {[
            filters.industry && labelFor(INDUSTRIES, filters.industry),
            filters.service && labelFor(SERVICES, filters.service),
            filters.q && `“${filters.q}”`,
          ]
            .filter(Boolean)
            .join(', ')}.{' '}
          <Link href={BASE} className="font-medium text-cobalt underline underline-offset-4">
            Clear filters
          </Link>
        </p>
      )}
    </section>
  )
}

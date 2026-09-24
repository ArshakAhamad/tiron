import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { Filters } from '@/components/Filters'
import { JsonLd } from '@/components/JsonLd'
import { Pagination } from '@/components/Pagination'
import { getFacets, listCaseStudies } from '@/lib/case-studies'
import { SITE } from '@/lib/constants'
import { buildHref, isFiltered, pageRange, parseFilters, type SearchParams } from '@/lib/filters'

type Props = { searchParams: Promise<SearchParams> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseFilters(await searchParams)
  const filtered = isFiltered(f)
  const title = f.page > 1 ? `Case studies, page ${f.page}` : 'Case studies'
  const description =
    'Selected client work from Northwind: what we built, the constraints we worked within, and the results it delivered.'

  return {
    title,
    description,
    // Paginated pages are indexable and self-canonical. Filter/search combinations are
    // near-infinite thin variations, so they point back to the main listing and stay out of the index.
    alternates: { canonical: filtered ? '/case-studies' : buildHref('/case-studies', { page: f.page }) },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: '/case-studies' },
  }
}

export default async function CaseStudiesPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams)
  const [result, facets] = await Promise.all([listCaseStudies(filters), getFacets(filters)])

  // A stale/hand-edited ?page=99 lands on the last real page instead of an empty screen.
  if (result.docs.length === 0 && result.totalPages > 0 && filters.page > result.totalPages) {
    redirect(buildHref('/case-studies', { ...filters, page: result.totalPages }))
  }

  const { from, to } = pageRange(result.page, result.totalDocs)
  const filtered = isFiltered(filters)
  // On the first unfiltered page the newest project leads as a larger "hero" card.
  const leadFirst = !filtered && result.page === 1 && result.docs.length > 2

  return (
    <div className="container-page py-12 sm:py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Case studies',
          url: `${SITE.url}/case-studies`,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: result.docs.map((d, i) => ({
              '@type': 'ListItem',
              position: from + i,
              url: `${SITE.url}/case-studies/${d.slug}`,
              name: d.title,
            })),
          },
        }}
      />

      <header className="max-w-3xl">
        <h1 className="font-display text-5xl font-semibold leading-[0.95] sm:text-7xl">Our work</h1>
        <p className="mt-5 max-w-xl text-lg text-muted text-pretty">
          What we built, what got in the way, and what changed for the client afterwards.
        </p>
      </header>

      <div className="mt-10">
        <Filters filters={filters} facets={facets} />
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <p className="text-sm text-muted" role="status" aria-live="polite">
          {result.totalDocs === 0
            ? 'No case studies found'
            : `Showing ${from}–${to} of ${result.totalDocs} ${result.totalDocs === 1 ? 'case study' : 'case studies'}`}
        </p>

        {result.docs.length > 0 ? (
          <div className="mt-8 grid gap-x-8 gap-y-14 md:grid-cols-2">
            {result.docs.map((study, i) => (
              <CaseStudyCard
                key={study.id}
                study={study}
                featured={leadFirst && i === 0}
                priority={i < 2}
              />
            ))}
          </div>
        ) : (
          <EmptyState filtered={filtered} />
        )}

        <Pagination filters={filters} page={result.page} totalPages={result.totalPages} />
      </div>
    </div>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="mt-8 max-w-lg rounded-md bg-tint p-8">
      <h2 className="font-display text-2xl font-semibold">
        {filtered ? 'Nothing matches those filters' : 'Case studies are on the way'}
      </h2>
      <p className="mt-2 text-muted">
        {filtered
          ? 'Try a different industry or service, or search for something broader.'
          : 'We are writing up our recent projects. Check back soon, or get in touch to hear about the work directly.'}
      </p>
      {filtered ? (
        <Link
          href="/case-studies"
          className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-cobalt"
        >
          Clear filters
        </Link>
      ) : (
        <a
          href={`mailto:${SITE.email}`}
          className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-cobalt"
        >
          Get in touch
        </a>
      )}
    </div>
  )
}

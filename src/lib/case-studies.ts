import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'
import type { CaseStudy } from '@/payload-types'
import { runFacetAggregation, type FacetFilters, type Facets } from './aggregations'
import { CACHE_TAG, COLLECTION_SLUG, PAGE_SIZE, REVALIDATE_SECONDS } from './constants'
import type { Filters } from './filters'

/**
 * Caching model
 * - Payload's Local API doesn't go through `fetch`, so Next's data cache never
 *   sees it. Each read is wrapped in `unstable_cache` and tagged.
 * - Publishing/unpublishing/deleting in the admin calls `revalidateTag` (see the
 *   collection hooks) → instant freshness.
 * - `revalidate: 1h` is the safety net if a hook is ever skipped (e.g. direct DB edits).
 */
const cacheOptions = { tags: [CACHE_TAG], revalidate: REVALIDATE_SECONDS }

// Local API bypasses collection access by default, so "published only" is
// enforced explicitly on every public query.
const PUBLISHED: Where = { _status: { equals: 'published' } }

function buildWhere(f: FacetFilters): Where {
  const and: Where[] = [PUBLISHED]
  if (f.industry) and.push({ industry: { equals: f.industry } })
  if (f.service) and.push({ services: { in: [f.service] } })
  if (f.q) {
    and.push({
      or: [
        { title: { like: f.q } },
        { client: { like: f.q } },
        { summary: { like: f.q } },
      ],
    })
  }
  return { and }
}

export type CaseStudyPage = {
  docs: CaseStudy[]
  page: number
  totalPages: number
  totalDocs: number
}

export const listCaseStudies = unstable_cache(
  async (f: Filters): Promise<CaseStudyPage> => {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: COLLECTION_SLUG,
      where: buildWhere(f),
      // Newest first. `featured` is a curation flag for the home page, not a sort key —
      // mixing it in would make pagination order unpredictable for editors.
      sort: '-publishedAt',
      page: f.page,
      limit: PAGE_SIZE,
      depth: 1,
      draft: false,
    })
    return {
      docs: res.docs as CaseStudy[],
      page: res.page ?? f.page,
      totalPages: res.totalPages,
      totalDocs: res.totalDocs,
    }
  },
  ['case-studies:list'],
  cacheOptions,
)

export const getFacets = unstable_cache(
  async (f: FacetFilters): Promise<Facets> => {
    const payload = await getPayload({ config })
    return runFacetAggregation(payload, f)
  },
  ['case-studies:facets'],
  cacheOptions,
)

export const getFeaturedCaseStudies = unstable_cache(
  async (limit = 3): Promise<CaseStudy[]> => {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: COLLECTION_SLUG,
      where: { and: [PUBLISHED, { featured: { equals: true } }] },
      sort: '-publishedAt',
      limit,
      depth: 1,
      draft: false,
    })
    return res.docs as CaseStudy[]
  },
  ['case-studies:featured'],
  cacheOptions,
)

export const getCaseStudyBySlug = unstable_cache(
  async (slug: string): Promise<CaseStudy | null> => {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: COLLECTION_SLUG,
      where: { and: [PUBLISHED, { slug: { equals: slug } }] },
      limit: 1,
      depth: 2,
      draft: false,
    })
    return (res.docs[0] as CaseStudy | undefined) ?? null
  },
  ['case-studies:by-slug'],
  cacheOptions,
)

/** Same-industry neighbours for the "More work" strip on the detail page. */
export const getRelatedCaseStudies = unstable_cache(
  async (slug: string, industry: string, limit = 2): Promise<CaseStudy[]> => {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: COLLECTION_SLUG,
      where: { and: [PUBLISHED, { slug: { not_equals: slug } }, { industry: { equals: industry } }] },
      sort: '-publishedAt',
      limit,
      depth: 1,
      draft: false,
    })
    return res.docs as CaseStudy[]
  },
  ['case-studies:related'],
  cacheOptions,
)

/** Uncached — used by generateStaticParams and the sitemap. */
export async function getAllPublishedSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: COLLECTION_SLUG,
    where: PUBLISHED,
    limit: 1000,
    depth: 0,
    pagination: false,
    select: { slug: true, updatedAt: true },
    draft: false,
  })
  return res.docs.map((d) => ({ slug: d.slug as string, updatedAt: d.updatedAt as string }))
}

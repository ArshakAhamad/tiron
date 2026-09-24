import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { PipelineStage } from 'mongoose'
import type { Payload } from 'payload'
import { COLLECTION_SLUG } from './constants'
import type { Filters } from './filters'

export type FacetFilters = Pick<Filters, 'industry' | 'service' | 'q'>
export type FacetKey = 'industry' | 'service'
export type FacetCount = { value: string; count: number }
export type Facets = {
  industries: FacetCount[]
  services: FacetCount[]
  /** Published case studies matching *all* current filters. */
  total: number
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * $match stage for published documents. `omit` drops one facet's own filter so
 * its counts show what you'd get by switching that facet (standard faceted-search
 * behaviour: the industry chips ignore the selected industry, but respect the
 * selected service and search text).
 */
export function buildMatch(filters: FacetFilters, omit: FacetKey[] = []) {
  const match: Record<string, unknown> = { _status: 'published' }
  if (filters.industry && !omit.includes('industry')) match.industry = filters.industry
  // `services` is an array field; equality on an array field matches "contains".
  if (filters.service && !omit.includes('service')) match.services = filters.service
  if (filters.q) {
    const rx = { $regex: escapeRegex(filters.q), $options: 'i' }
    match.$or = [{ title: rx }, { client: rx }, { summary: rx }]
  }
  return match
}

/**
 * One round-trip, three facets. Kept as a pure function so it can be unit-tested
 * without a database.
 */
export function buildFacetPipeline(filters: FacetFilters) {
  return [
    {
      $facet: {
        industries: [
          { $match: buildMatch(filters, ['industry']) },
          { $group: { _id: '$industry', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ],
        services: [
          { $match: buildMatch(filters, ['service']) },
          { $unwind: '$services' },
          { $group: { _id: '$services', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ],
        total: [{ $match: buildMatch(filters) }, { $count: 'count' }],
      },
    },
  ]
}

type RawFacetResult = {
  industries: Array<{ _id: string; count: number }>
  services: Array<{ _id: string; count: number }>
  total: Array<{ count: number }>
}

export function normalizeFacets(raw: RawFacetResult | undefined): Facets {
  const map = (rows: Array<{ _id: string; count: number }> = []) =>
    rows.map((r) => ({ value: r._id, count: r.count }))
  return {
    industries: map(raw?.industries),
    services: map(raw?.services),
    total: raw?.total?.[0]?.count ?? 0,
  }
}

/** Runs the pipeline directly on the underlying Mongoose model. */
export async function runFacetAggregation(payload: Payload, filters: FacetFilters) {
  const adapter = payload.db as unknown as MongooseAdapter
  const model = adapter.collections[COLLECTION_SLUG]
  const [raw] = await model.aggregate<RawFacetResult>(buildFacetPipeline(filters) as PipelineStage[])
  return normalizeFacets(raw)
}

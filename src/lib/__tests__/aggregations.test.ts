import { describe, expect, it } from 'vitest'
import { buildFacetPipeline, buildMatch, escapeRegex, normalizeFacets } from '../aggregations'
import { buildHref, getPageWindow, parseFilters } from '../filters'

type Facet = { $facet: Record<string, Array<Record<string, any>>> }
const facet = (f: Parameters<typeof buildFacetPipeline>[0]) =>
  (buildFacetPipeline(f)[0] as Facet).$facet

describe('buildMatch', () => {
  it('always restricts to published documents', () => {
    expect(buildMatch({})).toEqual({ _status: 'published' })
  })

  it('applies industry, service and text filters', () => {
    const m = buildMatch({ industry: 'fintech', service: 'seo', q: 'bank' })
    expect(m.industry).toBe('fintech')
    expect(m.services).toBe('seo')
    expect(m.$or).toHaveLength(3)
  })

  it('omits the requested facet but keeps the others', () => {
    const m = buildMatch({ industry: 'fintech', service: 'seo' }, ['industry'])
    expect(m.industry).toBeUndefined()
    expect(m.services).toBe('seo')
  })

  it('escapes regex metacharacters in user search text', () => {
    expect(escapeRegex('a.b*(c)')).toBe('a\\.b\\*\\(c\\)')
    const m = buildMatch({ q: '.*' })
    expect((m.$or as any[])[0].title.$regex).toBe('\\.\\*')
  })
})

describe('buildFacetPipeline', () => {
  it('produces industries, services and total in a single $facet', () => {
    expect(Object.keys(facet({}))).toEqual(['industries', 'services', 'total'])
  })

  it('unwinds the services array before grouping', () => {
    const stages = facet({}).services.map((s) => Object.keys(s)[0])
    expect(stages).toEqual(['$match', '$unwind', '$group', '$sort'])
  })

  it('industry counts ignore the selected industry but respect the selected service', () => {
    const match = facet({ industry: 'fintech', service: 'seo' }).industries[0].$match
    expect(match.industry).toBeUndefined()
    expect(match.services).toBe('seo')
  })

  it('service counts ignore the selected service but respect the selected industry', () => {
    const match = facet({ industry: 'fintech', service: 'seo' }).services[0].$match
    expect(match.services).toBeUndefined()
    expect(match.industry).toBe('fintech')
  })

  it('total respects every filter', () => {
    const match = facet({ industry: 'fintech', service: 'seo' }).total[0].$match
    expect(match).toMatchObject({ _status: 'published', industry: 'fintech', services: 'seo' })
  })
})

describe('normalizeFacets', () => {
  it('maps grouped rows and total', () => {
    const out = normalizeFacets({
      industries: [{ _id: 'fintech', count: 3 }],
      services: [{ _id: 'seo', count: 2 }],
      total: [{ count: 5 }],
    })
    expect(out).toEqual({
      industries: [{ value: 'fintech', count: 3 }],
      services: [{ value: 'seo', count: 2 }],
      total: 5,
    })
  })

  it('returns zeros for an empty collection ($count emits no row)', () => {
    expect(normalizeFacets({ industries: [], services: [], total: [] }).total).toBe(0)
    expect(normalizeFacets(undefined).industries).toEqual([])
  })
})

describe('parseFilters / buildHref / getPageWindow', () => {
  it('drops unknown values and clamps page', () => {
    expect(parseFilters({ industry: 'nope', service: 'seo', page: '-4', q: '  hi  ' })).toEqual({
      industry: undefined,
      service: 'seo',
      q: 'hi',
      page: 1,
    })
  })

  it('omits defaults from hrefs', () => {
    expect(buildHref('/case-studies', { page: 1 })).toBe('/case-studies')
    expect(buildHref('/case-studies', { industry: 'saas', page: 2 })).toBe(
      '/case-studies?industry=saas&page=2',
    )
  })

  it('builds a compact page window with ellipses', () => {
    expect(getPageWindow(1, 3)).toEqual([1, 2, 3])
    expect(getPageWindow(6, 12)).toEqual([1, '…', 5, 6, 7, '…', 12])
    expect(getPageWindow(1, 1)).toEqual([1])
  })
})

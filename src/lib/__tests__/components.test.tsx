import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { Filters } from '@/components/Filters'
import { Pagination } from '@/components/Pagination'
import type { CaseStudy } from '@/payload-types'

const study = {
  id: '1',
  title: 'A calmer sign-up',
  slug: 'a-calmer-sign-up',
  client: 'Lumen Bank',
  industry: 'fintech',
  services: ['design'],
  summary: 'Halved time to open an account.',
  results: [{ metric: '-52%', label: 'Time to open an account' }],
  content: { root: { type: 'root', children: [], direction: 'ltr', format: '', indent: 0, version: 1 } },
  createdAt: '',
  updatedAt: '',
} as CaseStudy

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    expect(renderToStaticMarkup(<Pagination filters={{ page: 1 }} page={1} totalPages={1} />)).toBe('')
  })

  it('marks the current page, exposes rel=prev/next and preserves filters in hrefs', () => {
    const html = renderToStaticMarkup(
      <Pagination filters={{ page: 2, industry: 'fintech' }} page={2} totalPages={3} />,
    )
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('rel="prev"')
    expect(html).toContain('rel="next"')
    expect(html).toContain('href="/case-studies?industry=fintech"') // page 1 drops ?page
    expect(html).toContain('href="/case-studies?industry=fintech&amp;page=3"')
  })

  it('shows Previous as disabled text (not a link) on the first page', () => {
    const html = renderToStaticMarkup(<Pagination filters={{ page: 1 }} page={1} totalPages={3} />)
    expect(html).toContain('aria-disabled="true"')
    expect(html).not.toContain('rel="prev"')
  })
})

describe('CaseStudyCard', () => {
  it('has a single link named by the title and shows the lead result', () => {
    const html = renderToStaticMarkup(<CaseStudyCard study={study} />)
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).toContain('href="/case-studies/a-calmer-sign-up"')
    expect(html).toContain('A calmer sign-up')
    expect(html).toContain('-52%')
  })
})

describe('Filters', () => {
  const facets = {
    industries: [{ value: 'fintech', count: 2 }],
    services: [{ value: 'design', count: 1 }],
    total: 2,
  }

  it('renders labelled search, links for chips and flags the active one', () => {
    const html = renderToStaticMarkup(<Filters filters={{ page: 1, industry: 'fintech' }} facets={facets} />)
    expect(html).toContain('for="q"')
    expect(html).toContain('role="search"')
    expect(html).toContain('aria-current="true"')
    expect(html).toContain('Clear filters')
    expect(html).toContain('type="hidden" name="industry" value="fintech"')
  })

  it('only offers options that exist in the data', () => {
    const html = renderToStaticMarkup(<Filters filters={{ page: 1 }} facets={facets} />)
    expect(html).toContain('Fintech')
    expect(html).not.toContain('Healthcare')
  })
})

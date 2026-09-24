import { INDUSTRIES, PAGE_SIZE, SERVICES } from './constants'

export type Filters = {
  industry?: string
  service?: string
  q?: string
  page: number
}

export type SearchParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export function parseFilters(sp: SearchParams): Filters {
  const industry = first(sp.industry)
  const service = first(sp.service)
  const q = first(sp.q)?.trim().slice(0, 80)
  const page = Number.parseInt(first(sp.page) ?? '1', 10)

  return {
    industry: INDUSTRIES.some((i) => i.value === industry) ? industry : undefined,
    service: SERVICES.some((s) => s.value === service) ? service : undefined,
    q: q || undefined,
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
  }
}

export const isFiltered = (f: Filters) => Boolean(f.industry || f.service || f.q)


export function buildHref(base: string, f: Partial<Filters>) {
  const params = new URLSearchParams()
  if (f.industry) params.set('industry', f.industry)
  if (f.service) params.set('service', f.service)
  if (f.q) params.set('q', f.q)
  if (f.page && f.page > 1) params.set('page', String(f.page))
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}


export function getPageWindow(current: number, total: number, siblings = 1): Array<number | '…'> {
  if (total <= 1) return [1]
  const pages = new Set<number>([1, total])
  for (let p = current - siblings; p <= current + siblings; p++) {
    if (p >= 1 && p <= total) pages.add(p)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const out: Array<number | '…'> = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

export const pageRange = (page: number, totalDocs: number) => ({
  from: totalDocs === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
  to: Math.min(page * PAGE_SIZE, totalDocs),
})

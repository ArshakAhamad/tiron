import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { INDUSTRIES, SERVICES } from '../src/lib/constants'
import { slugify } from '../src/lib/slug'
import type { CaseStudy } from '../src/payload-types'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

type Row = Record<string, string>

const text = (t: string) => ({ type: 'text', text: t, detail: 0, format: 0, mode: 'normal', style: '', version: 1 })
const node = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
  type,
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  ...extra,
})

function toLexical(source: string) {
  const blocks = source.replace(/\\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  const children = blocks.map((block) => {
    if (block.startsWith('## ')) return node('heading', [text(block.slice(3))], { tag: 'h2' })
    if (block.split('\n').every((l) => l.startsWith('- '))) {
      const items = block.split('\n').map((l, i) => node('listitem', [text(l.slice(2))], { value: i + 1 }))
      return node('list', items, { listType: 'bullet', start: 1, tag: 'ul' })
    }
    return node('paragraph', [text(block)], { textFormat: 0 })
  })
  return { root: node('root', children) }
}

const list = (v: string) => (v ? v.split('|').map((s) => s.trim()).filter(Boolean) : [])

function assertOption(list: readonly { value: string }[], value: string, field: string, title: string) {
  if (!list.some((o) => o.value === value)) {
    throw new Error(`seed.csv: invalid ${field} "${value}" in row "${title}"`)
  }
}

function toData(row: Row) {
  assertOption(INDUSTRIES, row.industry, 'industry', row.title)
  const services = list(row.services)
  services.forEach((s) => assertOption(SERVICES, s, 'service', row.title))

  return {
    title: row.title,
    slug: row.slug || slugify(row.title),
    client: row.client,
    industry: row.industry as CaseStudy['industry'],
    services: services as CaseStudy['services'],
    summary: row.summary,
    year: row.year ? Number(row.year) : undefined,
    duration: row.duration || undefined,
    projectUrl: row.projectUrl || undefined,
    featured: row.featured === 'true',
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : undefined,
    technologies: list(row.technologies).map((name) => ({ name })),
    results: list(row.results).map((pair) => {
      const i = pair.indexOf(':')
      return { metric: pair.slice(0, i).trim(), label: pair.slice(i + 1).trim() }
    }),
    testimonial: {
      quote: row.testimonialQuote || undefined,
      author: row.testimonialAuthor || undefined,
      role: row.testimonialRole || undefined,
    },
    content: toLexical(row.content) as CaseStudy['content'],
    _status: 'published' as const,
  }
}

async function main() {
  const rows = parse(readFileSync(path.join(root, 'seed/seed.csv'), 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Row[]

  const payload = await getPayload({ config })
  // Skip the revalidateTag/revalidatePath hooks — we're outside a Next.js request.
  const context = { disableRevalidate: true }

  if (process.argv.includes('--reset')) {
    await payload.delete({ collection: 'case-studies', where: { id: { exists: true } }, context })
    payload.logger.info('Deleted existing case studies')
  }

  let created = 0
  let updated = 0
  for (const row of rows) {
    const data = toData(row)
    const existing = await payload.find({
      collection: 'case-studies',
      where: { slug: { equals: data.slug } },
      limit: 1,
      draft: true,
      depth: 0,
    })
    if (existing.docs[0]) {
      await payload.update({ collection: 'case-studies', id: existing.docs[0].id, data, context })
      updated++
    } else {
      await payload.create({ collection: 'case-studies', data, context })
      created++
    }
  }

  payload.logger.info(`Seed complete: ${created} created, ${updated} updated (${rows.length} rows)`)
}


try {
  await main()
} catch (err) {
  console.error(err)
  process.exit(1)
}

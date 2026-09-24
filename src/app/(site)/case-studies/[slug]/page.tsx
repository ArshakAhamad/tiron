import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { CoverArt } from '@/components/CoverArt'
import { JsonLd } from '@/components/JsonLd'
import {
  getAllPublishedSlugs,
  getCaseStudyBySlug,
  getRelatedCaseStudies,
} from '@/lib/case-studies'
import { INDUSTRIES, labelFor, SERVICES, SITE } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

// ISR: pre-render known slugs at build, render new ones on first request, and refresh
// hourly. Publishing in the admin also triggers on-demand revalidation (collection hooks).
export const revalidate = 3600 // must be a literal for Next's segment config; keep in sync with REVALIDATE_SECONDS
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    return (await getAllPublishedSlugs()).map(({ slug }) => ({ slug }))
  } catch {
    // No database at build time (e.g. CI) — fall back to on-demand rendering.
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const study = await getCaseStudyBySlug(slug)
  if (!study) return { title: 'Case study not found', robots: { index: false } }

  const title = study.seo?.metaTitle || study.title
  const description = study.seo?.metaDescription || study.summary
  const url = `/case-studies/${study.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    // The social image comes from ./opengraph-image.tsx (generated per case study).
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      publishedTime: study.publishedAt ?? undefined,
      modifiedTime: study.updatedAt,
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const study = await getCaseStudyBySlug(slug)
  if (!study) notFound()

  const related = await getRelatedCaseStudies(study.slug, study.industry, 2)
  const results = study.results ?? []
  const testimonial = study.testimonial?.quote ? study.testimonial : null
  const industryLabel = labelFor(INDUSTRIES, study.industry)

  return (
    <article>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: study.title,
          description: study.summary,
          datePublished: study.publishedAt,
          dateModified: study.updatedAt,
          mainEntityOfPage: `${SITE.url}/case-studies/${study.slug}`,
          author: { '@type': 'Organization', name: SITE.name },
          publisher: { '@type': 'Organization', name: SITE.name },
          about: { '@type': 'Organization', name: study.client },
        }}
      />

      <header className="container-page pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link href="/case-studies" className="underline underline-offset-4 hover:text-ink">
                Our work
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{study.client}</li>
          </ol>
        </nav>

        <h1 className="font-display mt-6 max-w-5xl text-5xl font-semibold leading-[0.95] text-balance sm:text-7xl">
          {study.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted text-pretty sm:text-xl">{study.summary}</p>

        <CoverArt
          study={study}
          priority
          sizes="(min-width: 1216px) 1216px, 100vw"
          className="mt-10 aspect-[16/9] rounded-md sm:aspect-[16/8]"
        />
      </header>

      {results.length > 0 && (
        <section aria-labelledby="results-heading" className="mt-12 bg-cobalt text-white">
          <div className="container-page py-12 sm:py-16">
            <h2 id="results-heading" className="font-display text-2xl font-semibold text-white/80">
              What changed
            </h2>
            <dl className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((r) => (
                <div key={r.id ?? r.label}>
                  <dt className="order-2 mt-2 text-white/80">{r.label}</dt>
                  <dd className="font-display order-1 text-5xl font-semibold sm:text-6xl">{r.metric}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <div className="container-page mt-14 grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
        <aside aria-label="Project details" className="lg:sticky lg:top-24 lg:self-start">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm lg:grid-cols-1">
            <Detail label="Client">{study.client}</Detail>
            <Detail label="Industry">{industryLabel}</Detail>
            <Detail label="Services">
              <ul>
                {study.services.map((s) => (
                  <li key={s}>{labelFor(SERVICES, s)}</li>
                ))}
              </ul>
            </Detail>
            {study.year && <Detail label="Year">{study.year}</Detail>}
            {study.duration && <Detail label="Duration">{study.duration}</Detail>}
            {study.technologies && study.technologies.length > 0 && (
              <Detail label="Built with">
                <ul>
                  {study.technologies.map((t) => (
                    <li key={t.id ?? t.name}>{t.name}</li>
                  ))}
                </ul>
              </Detail>
            )}
            {study.projectUrl && (
              <Detail label="Live site">
                <a
                  href={study.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cobalt underline underline-offset-4"
                >
                  Visit {new URL(study.projectUrl).hostname.replace(/^www\./, '')}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Detail>
            )}
          </dl>
          {study.publishedAt && (
            <p className="mt-6 text-sm text-muted">
              Published <time dateTime={study.publishedAt}>{formatDate(study.publishedAt)}</time>
            </p>
          )}
        </aside>

        <div className="min-w-0">
          <RichText
            data={study.content}
            className="prose prose-lg max-w-[42rem] prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-cobalt prose-p:text-ink/85 prose-li:text-ink/85"
          />

          {testimonial && (
            <figure className="mt-14 max-w-[42rem] border-l-4 border-cobalt pl-6">
              <blockquote className="font-display text-2xl font-medium leading-snug sm:text-3xl">
                <p>{testimonial.quote}</p>
              </blockquote>
              {(testimonial.author || testimonial.role) && (
                <figcaption className="mt-4 text-muted">
                  {testimonial.author}
                  {testimonial.author && testimonial.role ? ', ' : ''}
                  {testimonial.role}
                </figcaption>
              )}
            </figure>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="container-page mt-24">
          <h2 id="related-heading" className="font-display text-3xl font-semibold">
            More {industryLabel.toLowerCase()} work
          </h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2">
            {related.map((r) => (
              <CaseStudyCard key={r.id} study={r} />
            ))}
          </div>
        </section>
      )}

      <section className="container-page mt-24">
        <div className="rounded-md bg-ink p-8 text-paper sm:p-12">
          <h2 className="font-display max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">
            Have something similar in mind?
          </h2>
          <a
            href={`mailto:${SITE.email}?subject=${encodeURIComponent(`Project enquiry, after reading ${study.title}`)}`}
            className="mt-6 inline-flex rounded-full bg-paper px-6 py-3 font-medium text-ink transition-colors hover:bg-white"
          >
            Tell us about your project
          </a>
        </div>
      </section>
    </article>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  )
}

import Link from 'next/link'
import { INDUSTRIES, labelFor } from '@/lib/constants'
import type { CaseStudy } from '@/payload-types'
import { CoverArt } from './CoverArt'

type Props = { study: CaseStudy; featured?: boolean; priority?: boolean }

export function CaseStudyCard({ study, featured = false, priority = false }: Props) {
  const topResult = study.results?.[0]

  return (
    <article
      className={`group relative flex flex-col ${featured ? 'md:col-span-2 md:grid md:grid-cols-5 md:gap-8' : ''}`}
    >
      <CoverArt
        study={study}
        priority={priority}
        sizes={featured ? '(min-width: 768px) 60vw, 100vw' : '(min-width: 768px) 50vw, 100vw'}
        className={`rounded-md ${featured ? 'aspect-[16/10] md:col-span-3 md:aspect-auto md:min-h-[22rem]' : 'aspect-[3/2]'}`}
      />

      <div className={`flex flex-1 flex-col ${featured ? 'mt-5 md:col-span-2 md:mt-0 md:justify-end' : 'mt-4'}`}>
        <p className="text-sm text-muted">
          {study.client}, {labelFor(INDUSTRIES, study.industry)}
        </p>

        <h2
          className={`font-display mt-1 font-semibold leading-[1.05] text-balance ${featured ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}
        >
          {/* Stretched link: the whole card is clickable, but the accessible name is just the title. */}
          <Link
            href={`/case-studies/${study.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-8"
          >
            {study.title}
          </Link>
        </h2>

        <p className={`mt-3 text-pretty text-muted ${featured ? 'max-w-md' : 'line-clamp-2'}`}>
          {study.summary}
        </p>

        {topResult && (
          <p className="mt-4 text-sm">
            <span className="font-display text-xl font-semibold text-cobalt">{topResult.metric}</span>{' '}
            <span className="text-muted">{topResult.label}</span>
          </p>
        )}
      </div>
    </article>
  )
}

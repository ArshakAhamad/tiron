import Link from 'next/link'
import { CaseStudyCard } from '@/components/CaseStudyCard'
import { getFacets, getFeaturedCaseStudies } from '@/lib/case-studies'

export const revalidate = 3600

export default async function HomePage() {
  const [featured, facets] = await Promise.all([getFeaturedCaseStudies(3), getFacets({})])

  return (
    <>
      <section className="container-page pb-16 pt-16 sm:pt-24">
        <h1 className="font-display max-w-4xl text-5xl font-semibold leading-[0.95] text-balance sm:text-7xl lg:text-8xl">
          Websites and platforms that earn their keep.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted text-pretty">
          Northwind designs and builds content-led sites for teams who need to publish fast and rank
          well. {facets.total > 0 && `${facets.total} projects across ${facets.industries.length} industries so far.`}
        </p>
        <Link
          href="/case-studies"
          className="mt-8 inline-flex rounded-full bg-cobalt px-6 py-3 font-medium text-white transition-colors hover:bg-cobalt-deep"
        >
          See our work
        </Link>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="container-page">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="featured-heading" className="font-display text-3xl font-semibold">
              Selected work
            </h2>
            <Link href="/case-studies" className="text-sm font-medium text-cobalt underline underline-offset-4">
              View all case studies
            </Link>
          </div>
          <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2">
            {featured.map((study, i) => (
              <CaseStudyCard key={study.id} study={study} featured={i === 0} priority={i === 0} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

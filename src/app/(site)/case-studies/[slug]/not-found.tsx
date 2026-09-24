import Link from 'next/link'

export default function CaseStudyNotFound() {
  return (
    <div className="container-page py-28">
      <h1 className="font-display max-w-2xl text-5xl font-semibold leading-none sm:text-6xl">
        We can&apos;t find that case study.
      </h1>
      <p className="mt-5 max-w-md text-lg text-muted">
        It may have been renamed or taken down. The full list is a click away.
      </p>
      <Link
        href="/case-studies"
        className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 font-medium text-paper hover:bg-cobalt"
      >
        Browse all case studies
      </Link>
    </div>
  )
}

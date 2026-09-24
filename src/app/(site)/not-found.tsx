import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-page py-28">
      <h1 className="font-display max-w-2xl text-5xl font-semibold leading-none sm:text-6xl">
        That page doesn&apos;t exist.
      </h1>
      <p className="mt-5 max-w-md text-lg text-muted">
        The link may be old or mistyped. Browse our work to find what you were after.
      </p>
      <Link
        href="/case-studies"
        className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 font-medium text-paper hover:bg-cobalt"
      >
        See all case studies
      </Link>
    </div>
  )
}

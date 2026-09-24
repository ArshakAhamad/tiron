'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function CaseStudiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Hook up your error reporter (Sentry etc.) here.
    console.error(error)
  }, [error])

  return (
    <div className="container-page py-24" role="alert">
      <h1 className="font-display max-w-2xl text-4xl font-semibold leading-none sm:text-6xl">
        We couldn&apos;t load our work.
      </h1>
      <p className="mt-5 max-w-md text-lg text-muted">
        This is on our side, not yours. Try again, and if it keeps happening let us know.
      </p>
      {error.digest && <p className="mt-2 text-sm text-muted">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-cobalt px-6 py-3 font-medium text-white hover:bg-cobalt-deep"
        >
          Try again
        </button>
        <Link href="/" className="rounded-full border border-line px-6 py-3 font-medium hover:border-ink">
          Back to home
        </Link>
      </div>
    </div>
  )
}

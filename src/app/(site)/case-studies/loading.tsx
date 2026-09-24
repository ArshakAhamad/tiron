export default function Loading() {
  return (
    <div className="container-page py-12 sm:py-16" role="status" aria-busy="true">
      <span className="sr-only">Loading case studies…</span>
      <div className="h-14 w-64 animate-pulse rounded bg-tint sm:h-20 sm:w-96" />
      <div className="mt-6 h-5 w-full max-w-md animate-pulse rounded bg-tint" />
      <div className="mt-10 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-tint" />
        ))}
      </div>
      <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/2] animate-pulse rounded-md bg-tint" />
            <div className="mt-4 h-4 w-40 animate-pulse rounded bg-tint" />
            <div className="mt-3 h-7 w-3/4 animate-pulse rounded bg-tint" />
          </div>
        ))}
      </div>
    </div>
  )
}

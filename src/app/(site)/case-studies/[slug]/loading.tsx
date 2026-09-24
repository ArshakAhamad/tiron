export default function Loading() {
  return (
    <div className="container-page py-12 sm:py-16" role="status" aria-busy="true">
      <span className="sr-only">Loading case study…</span>
      <div className="h-4 w-48 animate-pulse rounded bg-tint" />
      <div className="mt-6 h-16 w-full max-w-3xl animate-pulse rounded bg-tint sm:h-24" />
      <div className="mt-6 h-5 w-full max-w-xl animate-pulse rounded bg-tint" />
      <div className="mt-10 aspect-[16/8] animate-pulse rounded-md bg-tint" />
      <div className="mt-10 space-y-3">
        {[90, 100, 75, 95].map((w, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-tint" style={{ width: `${w}%`, maxWidth: '42rem' }} />
        ))}
      </div>
    </div>
  )
}

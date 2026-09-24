import Link from 'next/link'
import { buildHref, getPageWindow, type Filters } from '@/lib/filters'

type Props = { filters: Filters; page: number; totalPages: number }

export function Pagination({ filters, page, totalPages }: Props) {
  if (totalPages <= 1) return null
  const href = (p: number) => buildHref('/case-studies', { ...filters, page: p })
  const step =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm transition-colors'

  return (
    <nav aria-label="Pagination" className="mt-14 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted" aria-live="polite">
        Page {page} of {totalPages}
      </p>
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} rel="prev" className={`${step} border-line hover:border-ink`}>
              Previous
            </Link>
          ) : (
            <span aria-disabled="true" className={`${step} border-transparent text-muted/50`}>
              Previous
            </span>
          )}
        </li>
        {getPageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={`${step} ${p === page ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link href={href(page + 1)} rel="next" className={`${step} border-line hover:border-ink`}>
              Next
            </Link>
          ) : (
            <span aria-disabled="true" className={`${step} border-transparent text-muted/50`}>
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}

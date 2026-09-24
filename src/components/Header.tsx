import Link from 'next/link'
import { SITE } from '@/lib/constants'

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl font-semibold" aria-label={`${SITE.name} home`}>
          Northwind
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-5 text-sm sm:gap-8">
          <Link href="/case-studies" className="py-2 hover:text-cobalt">
            Work
          </Link>
          <a
            href={`mailto:${SITE.email}`}
            className="rounded-full bg-ink px-4 py-2 font-medium text-paper transition-colors hover:bg-cobalt"
          >
            Start a project
          </a>
        </nav>
      </div>
    </header>
  )
}

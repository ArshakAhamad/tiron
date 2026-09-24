import Link from 'next/link'
import { SITE } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2">
        <div>
          <p className="font-display text-2xl font-semibold">Northwind</p>
          <p className="mt-2 max-w-sm text-sm text-muted">{SITE.description}</p>
        </div>
        <ul className="flex flex-col gap-2 text-sm sm:items-end">
          <li>
            <Link href="/case-studies" className="hover:text-cobalt">
              All case studies
            </Link>
          </li>
          <li>
            <a href={`mailto:${SITE.email}`} className="hover:text-cobalt">
              {SITE.email}
            </a>
          </li>
          <li className="text-muted">&copy; {new Date().getFullYear()} {SITE.name}. Fictional agency for a demo.</li>
        </ul>
      </div>
    </footer>
  )
}

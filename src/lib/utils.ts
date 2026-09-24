import type { CaseStudy, Media } from '@/payload-types'

export const formatDate = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(iso))
    : ''

/** Populated upload or undefined (depth 0 returns just an id string). */
export const getMedia = (value: CaseStudy['coverImage']): Media | undefined =>
  value && typeof value === 'object' ? value : undefined

export const hashString = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

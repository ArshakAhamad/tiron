import Image from 'next/image'
import type { CaseStudy } from '@/payload-types'
import { getMedia, hashString } from '@/lib/utils'

// Curated duotone pairs so generated covers stay on-brand instead of random hues.
const PALETTES = [
  ['#2a46ff', '#9fb0ff', '#0b1230'],
  ['#0f766e', '#7fe0cf', '#062a27'],
  ['#c2410c', '#ffc59e', '#2b1005'],
  ['#6d28d9', '#c9b2ff', '#1a0b3a'],
  ['#0369a1', '#9ad8ff', '#04263a'],
  ['#be123c', '#ffb3c4', '#33061a'],
] as const

type Props = {
  study: Pick<CaseStudy, 'slug' | 'client' | 'coverImage'>
  /** Card covers are decorative; the title link already names the card. */
  sizes?: string
  priority?: boolean
  className?: string
}

/**
 * Uses the uploaded cover when there is one, otherwise a generated cover built
 * from the client name so every card still looks intentional.
 */
export function CoverArt({ study, sizes, priority, className = '' }: Props) {
  const media = getMedia(study.coverImage)
  if (media?.url) {
    const src = media.sizes?.card?.url ?? media.url
    return (
      <div className={`relative overflow-hidden bg-tint ${className}`}>
        <Image
          src={src}
          alt={media.alt || ''}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
    )
  }

  const h = hashString(study.slug)
  const [a, b, base] = PALETTES[h % PALETTES.length]
  const angle = 100 + (h % 80)
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: base,
        backgroundImage: `radial-gradient(70% 90% at ${20 + (h % 30)}% 0%, ${a}cc 0%, transparent 62%), radial-gradient(60% 80% at 100% 100%, ${b}66 0%, transparent 60%), linear-gradient(${angle}deg, ${base}, ${a}55)`,
      }}
    >
      <span className="font-display absolute bottom-3 left-4 right-4 truncate text-3xl font-semibold text-white/90 sm:text-4xl">
        {study.client}
      </span>
    </div>
  )
}

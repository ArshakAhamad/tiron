import type { MetadataRoute } from 'next'
import { getAllPublishedSlugs } from '@/lib/case-studies'
import { SITE } from '@/lib/constants'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/case-studies`, changeFrequency: 'weekly', priority: 0.9 },
  ]
  try {
    const studies = await getAllPublishedSlugs()
    return [
      ...staticRoutes,
      ...studies.map((s) => ({
        url: `${SITE.url}/case-studies/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ]
  } catch {
    return staticRoutes
  }
}

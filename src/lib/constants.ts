export const INDUSTRIES = [
  { label: 'Fintech', value: 'fintech' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'E-commerce', value: 'ecommerce' },
  { label: 'Education', value: 'education' },
  { label: 'Hospitality', value: 'hospitality' },
  { label: 'Sustainability', value: 'sustainability' },
  { label: 'Real estate', value: 'real-estate' },
  { label: 'SaaS', value: 'saas' },
] as const

export const SERVICES = [
  { label: 'Web development', value: 'web-development' },
  { label: 'Headless CMS', value: 'cms' },
  { label: 'Product design', value: 'design' },
  { label: 'SEO', value: 'seo' },
  { label: 'E-commerce build', value: 'ecommerce' },
  { label: 'Branding', value: 'branding' },
  { label: 'Performance', value: 'performance' },
] as const

export const COLLECTION_SLUG = 'case-studies'
export const CACHE_TAG = 'case-studies'
export const REVALIDATE_SECONDS = 3600
export const PAGE_SIZE = 6

export const SITE = {
  name: 'Northwind Studio',
  description:
    'Northwind is an independent digital studio building fast, content-led websites and platforms for ambitious teams.',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  email: 'hello@northwind.example',
}

type Option = { readonly label: string; readonly value: string }
export const labelFor = (options: readonly Option[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value

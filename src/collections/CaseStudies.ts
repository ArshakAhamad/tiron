import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  FieldHook,
} from 'payload'
import { CACHE_TAG, COLLECTION_SLUG, INDUSTRIES, SERVICES } from '../lib/constants'
import { slugify } from '../lib/slug'

const generateSlug: FieldHook = ({ value, data }) => {
  if (typeof value === 'string' && value.trim()) return slugify(value)
  if (typeof data?.title === 'string') return slugify(data.title)
  return value
}

/**
 * On-demand revalidation: editors publish in the admin and the site updates
 * within seconds instead of waiting for the time-based ISR window.
 * `context.disableRevalidate` lets the seed script skip this (it runs outside Next).
 */
const safeRevalidate = (slugs: Array<string | undefined>) => {
  try {
    revalidateTag(CACHE_TAG)
    revalidatePath('/')
    revalidatePath('/case-studies')
    revalidatePath('/sitemap.xml')
    for (const slug of slugs) if (slug) revalidatePath(`/case-studies/${slug}`)
  } catch {
    // Not running inside a Next.js request (CLI, tests) — nothing to revalidate.
  }
}

const afterChange: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  if (!req.context?.disableRevalidate) safeRevalidate([doc.slug, previousDoc?.slug])
  return doc
}

const afterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context?.disableRevalidate) safeRevalidate([doc.slug])
  return doc
}

export const CaseStudies: CollectionConfig = {
  slug: COLLECTION_SLUG,
  labels: { singular: 'Case study', plural: 'Case studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'industry', 'featured', 'publishedAt', '_status'],
    listSearchableFields: ['title', 'client', 'slug'],
  },
  // Drafts give editors a proper publish workflow; the public site only ever
  // reads `_status: published` (see src/lib/case-studies.ts).
  versions: { drafts: true, maxPerDoc: 10 },
  access: {
    read: ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } }),
  },
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 120 },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Generated from the title if left blank.' },
      hooks: { beforeValidate: [generateSlug] },
    },
    { name: 'client', type: 'text', required: true, index: true },
    {
      name: 'industry',
      type: 'select',
      required: true,
      index: true,
      options: [...INDUSTRIES],
      admin: { position: 'sidebar' },
    },
    {
      name: 'services',
      type: 'select',
      hasMany: true,
      required: true,
      index: true,
      options: [...SERVICES],
      admin: { position: 'sidebar' },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 220,
      admin: { description: 'Shown on cards and used as the default meta description.' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional. Without one, the site renders a generated cover.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'number', min: 2000, max: 2100 },
        { name: 'duration', type: 'text', admin: { description: 'e.g. "14 weeks"' } },
      ],
    },
    { name: 'projectUrl', type: 'text', admin: { description: 'Live site, if public.' } },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar', description: 'Shown on the home page.' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
      hooks: {
        beforeChange: [
          ({ value, siblingData }) =>
            !value && siblingData?._status === 'published' ? new Date().toISOString() : value,
        ],
      },
    },
    {
      name: 'results',
      type: 'array',
      maxRows: 4,
      labels: { singular: 'Result', plural: 'Results' },
      admin: { description: 'Headline outcomes, e.g. "+142%" / "Qualified leads".' },
      fields: [
        { name: 'metric', type: 'text', required: true, maxLength: 16 },
        { name: 'label', type: 'text', required: true, maxLength: 60 },
      ],
    },
    { name: 'content', type: 'richText', required: true, label: 'Case study' },
    {
      name: 'testimonial',
      type: 'group',
      fields: [
        { name: 'quote', type: 'textarea' },
        { name: 'author', type: 'text' },
        { name: 'role', type: 'text' },
      ],
    },
    {
      name: 'technologies',
      type: 'array',
      labels: { singular: 'Technology', plural: 'Technologies' },
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO overrides',
      fields: [
        { name: 'metaTitle', type: 'text', maxLength: 70 },
        { name: 'metaDescription', type: 'textarea', maxLength: 160 },
      ],
    },
  ],
}

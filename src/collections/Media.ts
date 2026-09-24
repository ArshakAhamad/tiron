import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  upload: {
    // Local disk is fine for the assignment. On serverless hosts swap in a
    // storage adapter (S3 / Vercel Blob / R2) via @payloadcms/storage-*.
    staticDir: 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'card', width: 900, height: 600, position: 'centre' },
      { name: 'hero', width: 1800, height: undefined },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for screen readers and search engines.' },
    },
  ],
}

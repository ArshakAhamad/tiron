import { ImageResponse } from 'next/og'
import { getCaseStudyBySlug } from '@/lib/case-studies'
import { INDUSTRIES, labelFor, SITE } from '@/lib/constants'

export const alt = 'Northwind case study'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const study = await getCaseStudyBySlug(slug)
  const title = study?.title ?? 'Case study'
  const meta = study ? `${study.client}, ${labelFor(INDUSTRIES, study.industry)}` : SITE.name

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #0c1413 0%, #1a2fc4 100%)',
          color: '#f3f5f4',
        }}
      >
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>Northwind</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 32, opacity: 0.8 }}>{meta}</div>
          <div
            style={{
              display: 'flex',
              marginTop: 16,
              fontSize: title.length > 60 ? 60 : 76,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </div>
        </div>
      </div>
    ),
    size,
  )
}

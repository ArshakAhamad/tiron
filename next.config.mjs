import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // If media moves to S3 / Vercel Blob, add its hostname here - THANK YOU.
  images: { remotePatterns: [] },
}

export default withPayload(nextConfig)

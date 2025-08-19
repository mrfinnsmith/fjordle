/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async redirects() {
    return [
      { source: '/about', destination: '/om', permanent: true },
      { source: '/faq', destination: '/spoersmaal-og-svar', permanent: true },
      { source: '/how-to-play', destination: '/hvordan-spille', permanent: true },
      { source: '/privacy', destination: '/personvern', permanent: true },
      { source: '/past', destination: '/tidligere', permanent: true },
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: `https://${process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '')}/:path*`,
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
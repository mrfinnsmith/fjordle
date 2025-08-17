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
    ]
  },
}

module.exports = nextConfig
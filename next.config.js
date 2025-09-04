/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Disabled due to critters dependency issue
  },
  // Enable compression
  compress: true,
  // Optimize bundle
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Reduce bundle size in production
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }
    return config
  },
  async redirects() {
    return [
      { source: '/about', destination: '/om', permanent: true },
      { source: '/faq', destination: '/spoersmaal-og-svar', permanent: true },
      { source: '/how-to-play', destination: '/hvordan-spille', permanent: true },
      { source: '/privacy', destination: '/personvern', permanent: true },
      { source: '/past', destination: '/tidligere', permanent: true },
      { source: '/past-puzzles', destination: '/tidligere', permanent: true },
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
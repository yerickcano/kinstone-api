/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless']
  },
  webpack: (config) => {
    // Neon serverless doesn't need native bindings
    config.externals.push({
      'pg-native': 'commonjs pg-native'
    });
    return config;
  },
  // Serve static files from docs directory
  async rewrites() {
    return [
      {
        source: '/docs/:path*',
        destination: '/docs/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

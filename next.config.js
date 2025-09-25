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
  }
};

module.exports = nextConfig;

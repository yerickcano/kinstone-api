/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  webpack: (config) => {
    // Handle PostgreSQL native bindings
    config.externals.push({
      'pg-native': 'commonjs pg-native'
    });
    return config;
  }
};

module.exports = nextConfig;

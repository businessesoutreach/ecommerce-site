const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.DOCKER_BUILD ? { output: 'standalone' } : {}),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' }
    ],
  },
  turbopack: {
    resolveAlias: {
      'react-router-dom': './src/lib/react-router-dom.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias['react-router-dom'] = path.resolve(__dirname, 'src/lib/react-router-dom.js');
    return config;
  }
};

module.exports = nextConfig;

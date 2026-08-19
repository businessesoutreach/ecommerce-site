const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'images.pexels.com'
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

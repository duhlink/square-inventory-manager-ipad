/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: true
}

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig,
  {
    org: "ryan-dev",
    project: "oh-canyonmarket",
    silent: process.env.NODE_ENV !== 'development',
    widenClientFileUpload: false,
    hideSourceMaps: true
  }
);

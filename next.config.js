/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Remove static route badge
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Optimize production builds
  experimental: {
    optimizeCss: true,
    esmExternals: true
  },

  // Configure output
  output: 'standalone',

  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        concatenateModules: true,
        moduleIds: 'deterministic',
        usedExports: true,
        providedExports: true,
        sideEffects: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 70000,
          cacheGroups: {
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            radix: {
              name: 'radix',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 30,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            forms: {
              name: 'forms',
              test: /[\\/]node_modules[\\/](@hookform|react-hook-form|zod)[\\/]/,
              priority: 20,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            square: {
              name: 'square',
              test: /[\\/]node_modules[\\/](@square|square)[\\/]/,
              priority: 25,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](class-variance-authority|clsx|tailwind-merge|cmdk|lucide-react)[\\/]/,
              priority: 15,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            vendors: {
              name: 'vendors',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'all',
              reuseExistingChunk: true,
            },
          },
        },
      }

      config.resolve = {
        ...config.resolve,
        symlinks: false,
        modules: ['node_modules'],
        preferRelative: true,
        cache: true,
      }
    }

    // Development optimizations
    if (dev) {
      config.watchOptions = {
        ignored: [
          '**/node_modules',
          '**/.git',
          '**/.next',
        ],
        poll: false,
        aggregateTimeout: 300,
      }

      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        providedExports: false,
        usedExports: false,
        minimize: false,
        minimizer: [],
      }

      config.resolve.cache = true
    }

    // Shared optimizations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }

    return config
  }
}

// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig,
  {
    org: "ryan-dev",
    project: "oh-canyonmarket",
    silent: process.env.NODE_ENV !== 'development',
    widenClientFileUpload: false,
    hideSourceMaps: true,
    reactComponentAnnotation: {
      enabled: process.env.NODE_ENV === 'production',
    },
    disableLogger: true,
    include: '.',
    ignore: [
      'node_modules',
      '.next',
      'public',
      '.git',
      '*.test.*',
      '*.spec.*',
      'jest.config.*',
      '.eslintrc.*',
      '.prettierrc.*',
      'README.md',
    ],
    automaticVercelMonitors: process.env.NODE_ENV === 'production',
  },
  {
    transpileClientSDK: process.env.NODE_ENV === 'production',
    tunnelRoute: undefined,
  }
);

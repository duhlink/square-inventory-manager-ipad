/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Remove static route badge
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Output standalone build for better Vercel compatibility
  output: 'standalone',

  // Optimize production builds
  experimental: {
    optimizeCss: true,
    esmExternals: true
  },

  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        // Enable module concatenation
        concatenateModules: true,
        // Optimize module loading
        moduleIds: 'deterministic',
        // Enable scope hoisting
        usedExports: true,
        providedExports: true,
        sideEffects: true,
        // Optimize chunk splitting
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 70000,
          cacheGroups: {
            // Bundle core dependencies together
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            // Bundle all Radix UI components together
            radix: {
              name: 'radix',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 30,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            // Bundle form-related dependencies
            forms: {
              name: 'forms',
              test: /[\\/]node_modules[\\/](@hookform|react-hook-form|zod)[\\/]/,
              priority: 20,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            // Square SDK bundle
            square: {
              name: 'square',
              test: /[\\/]node_modules[\\/](@square|square)[\\/]/,
              priority: 25,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            // UI utilities bundle
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](class-variance-authority|clsx|tailwind-merge|cmdk|lucide-react)[\\/]/,
              priority: 15,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: true,
            },
            // Other dependencies
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

      // Add ModuleConcatenationPlugin options
      config.resolve = {
        ...config.resolve,
        // Ensure modules can be optimized
        symlinks: false,
        // Add module directories for faster resolution
        modules: ['node_modules'],
        // Optimize module resolution
        preferRelative: true,
        // Cache module resolution
        cache: true,
      }
    }

    // Development optimizations
    if (dev) {
      // Exclude certain dependencies from hot module replacement
      config.watchOptions = {
        ignored: [
          '**/node_modules',
          '**/.git',
          '**/.next',
        ],
        // Reduce filesystem polling
        poll: false,
        // Aggregate changes
        aggregateTimeout: 300,
      }

      // Optimize development build time
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        // Minimize module lookup
        providedExports: false,
        usedExports: false,
        minimize: false,
        minimizer: [],
      }

      // Cache module resolution in development
      config.resolve.cache = true
    }

    // Shared optimizations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Reduce polyfills
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }

    return config
  },

  // Reduce memory usage
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 15 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  }
}

// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig,
  {
    org: "ryan-dev",
    project: "oh-canyonmarket",

    // Reduce noise in development
    silent: process.env.NODE_ENV !== 'development',

    // Optimize source map handling
    widenClientFileUpload: false,
    hideSourceMaps: true,

    // Disable React component annotation in development
    reactComponentAnnotation: {
      enabled: process.env.NODE_ENV === 'production',
    },

    // Optimize bundle size
    disableLogger: true,
    
    // Exclude unnecessary files from source map generation
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

    // Disable automatic instrumentation in development
    automaticVercelMonitors: process.env.NODE_ENV === 'production',
  },
  {
    // Disable unnecessary features in development
    transpileClientSDK: process.env.NODE_ENV === 'production',
    
    // Reduce bundle size
    tunnelRoute: undefined,
  }
);

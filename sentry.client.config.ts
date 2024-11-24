// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b2e169ef0ef5552c2bfe76b76c76961b@o4508272017604608.ingest.us.sentry.io/4508351393759232",

  // Reduce sample rate in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Disable session replay to reduce bundle size
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Ignore common errors
  ignoreErrors: [
    // Network errors
    'Network request failed',
    'Failed to fetch',
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Common third-party errors
    'top.GLOBALS',
    'Script error',
  ],

  // Limit breadcrumbs to reduce noise
  maxBreadcrumbs: 50,

  // Only send errors from our domain
  allowUrls: [
    typeof window !== 'undefined' ? window.location.origin : ''
  ],

  // Optimize performance
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    return event;
  },
  
  // Reduce payload size
  normalizeDepth: 5,
  maxValueLength: 1000,

  // Remove debug option as it's not needed
  enabled: process.env.NODE_ENV === 'production',
});

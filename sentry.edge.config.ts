// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b2e169ef0ef5552c2bfe76b76c76961b@o4508272017604608.ingest.us.sentry.io/4508351393759232",

  // Reduce sample rate in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Ignore common errors
  ignoreErrors: [
    'Error: connect ECONNREFUSED',
    'Error: socket hang up',
    'TypeError: cancelled',
    'Error: read ECONNRESET',
  ],

  // Limit breadcrumbs to reduce noise
  maxBreadcrumbs: 50,
  
  // Reduce payload size
  normalizeDepth: 5,
  maxValueLength: 1000,

  // Only send errors in production
  beforeSend(event) {
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    return event;
  },

  // Enable only in production
  enabled: process.env.NODE_ENV === 'production',

  // Optimize for edge runtime
  integrations: [],
  
  // Disable features not needed in edge runtime
  enableTracing: false,
  autoSessionTracking: false
});

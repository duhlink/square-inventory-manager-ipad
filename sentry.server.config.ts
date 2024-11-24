// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

  // Optimize performance
  shutdownTimeout: 2000,
  
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

  // Sample traces based on request path
  tracesSampler: (samplingContext) => {
    if (process.env.NODE_ENV !== 'production') {
      return 0.0; // Don't sample in development
    }
    
    const path = samplingContext?.request?.url || '';
    // Higher sampling for Square API routes
    if (path.includes('/api/square/')) {
      return 0.5;
    }
    // Lower sampling for other routes
    return 0.1;
  },

  // Enable only in production
  enabled: process.env.NODE_ENV === 'production',
});

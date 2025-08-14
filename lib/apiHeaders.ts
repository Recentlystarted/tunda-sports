/**
 * Professional API Headers Utility for Real-Time Data
 * This is the proper way to handle cache control in Next.js
 */

export const REAL_TIME_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
} as const;

export const STATIC_HEADERS = {
  'Cache-Control': 'public, max-age=3600', // 1 hour for less critical data
} as const;

export const IMMUTABLE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable', // 1 year for static assets
} as const;

/**
 * Create a Response with real-time headers
 * Use this for admin/auction APIs that need immediate updates
 */
export function createRealTimeResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...REAL_TIME_HEADERS,
    },
  });
}

/**
 * Create a Response with static headers
 * Use this for data that can be cached for a short time
 */
export function createStaticResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...STATIC_HEADERS,
    },
  });
}

/**
 * Add real-time headers to NextResponse
 * Use with NextResponse.json() for convenience
 */
export function addRealTimeHeaders(response: Response) {
  Object.entries(REAL_TIME_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

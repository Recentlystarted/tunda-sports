/**
 * Professional API Middleware for Real-Time Data
 * This ensures ALL admin/auction APIs have proper cache headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { REAL_TIME_HEADERS } from './apiHeaders';

/**
 * Middleware wrapper for real-time APIs
 * Automatically adds no-cache headers to responses
 */
export function withRealTimeHeaders(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const response = await handler(req, context);
      
      // Add real-time headers to any successful response
      if (response && response.status < 400) {
        Object.entries(REAL_TIME_HEADERS).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      
      // Return error response with real-time headers
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      Object.entries(REAL_TIME_HEADERS).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      
      return errorResponse;
    }
  };
}

/**
 * Helper to check if a route needs real-time headers
 */
export function isRealTimeRoute(pathname: string): boolean {
  const realTimePatterns = [
    '/api/registrations',
    '/api/tournaments/.*/auction',
    '/api/tournaments/.*/auction-players',
    '/api/tournaments/.*/team-owners',
    '/api/tournaments/.*/players',
    '/api/admin'
  ];
  
  return realTimePatterns.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/\.\*/g, '[^/]+') + '(/.*)?$');
    return regex.test(pathname);
  });
}

/**
 * Create a standardized API response with proper headers
 */
export function createApiResponse(data: any, options: {
  status?: number;
  realTime?: boolean;
  cache?: string;
} = {}) {
  const { status = 200, realTime = false, cache } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (realTime) {
    Object.assign(headers, REAL_TIME_HEADERS);
  } else if (cache) {
    headers['Cache-Control'] = cache;
  }
  
  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Professional SWR Provider for Real-Time Data Management
 */

'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

const swrConfig = {
  // Global error handler
  onError: (error: any, key: string) => {
    console.error('SWR Error:', { key, error });
    
    // Don't log 404s for optional resources
    if (error?.status === 404) return;
    
    // Could integrate with error reporting service here
    // Example: Sentry.captureException(error, { extra: { swrKey: key } });
  },
  
  // Global loading delay
  loadingTimeout: 10000,
  
  // Global success handler
  onSuccess: (data: any, key: string) => {
    // Could integrate with analytics here
    // Example: analytics.track('api_success', { endpoint: key });
  },
  
  // Global configuration
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 2000,
  
  // Focus revalidation
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  
  // Deduplication
  dedupingInterval: 2000,
};

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}

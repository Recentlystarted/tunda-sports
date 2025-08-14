/**
 * API Utility Functions
 * Provides consistent cache-busting and error handling for all API calls
 */

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  cacheBust?: boolean;
  timeout?: number;
}

/**
 * Enhanced fetch with automatic cache busting for admin operations
 */
export async function apiFetch(url: string, options: ApiRequestOptions = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    cacheBust = true,
    timeout = 10000
  } = options;

  // Add cache busting for GET requests and admin operations
  let finalUrl = url;
  if (cacheBust && (method === 'GET' || url.includes('/admin') || url.includes('/auction') || url.includes('/registration'))) {
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}t=${Date.now()}`;
  }

  // Default headers for cache busting
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...headers
  };

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(finalUrl, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      // Force no cache at request level
      cache: 'no-store'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}

/**
 * Tournament API calls
 */
export const tournamentApi = {
  getAll: () => apiFetch('/api/tournaments?status=all'),
  
  getAuctionPlayers: (tournamentId: string) => 
    apiFetch(`/api/tournaments/${tournamentId}/auction-players`),
  
  getTeamOwners: (tournamentId: string) => 
    apiFetch(`/api/tournaments/${tournamentId}/team-owners`),
  
  getTeamRegistrations: (tournamentId: string) => 
    apiFetch(`/api/tournaments/${tournamentId}/team-registration`),
  
  getAuctionLive: (tournamentId: string) => 
    apiFetch(`/api/tournaments/${tournamentId}/auction/live`),
  
  updatePlayerStatus: (tournamentId: string, playerId: string, auctionStatus: string) =>
    apiFetch(`/api/tournaments/${tournamentId}/auction-players/${playerId}`, {
      method: 'PATCH',
      body: { auctionStatus }
    }),
  
  updateOwnerStatus: (tournamentId: string, ownerId: string, action: string) =>
    apiFetch(`/api/tournaments/${tournamentId}/team-owners/${ownerId}`, {
      method: 'PATCH',
      body: { action }
    }),
  
  updateRegistrationStatus: (registrationId: string, status: string) =>
    apiFetch(`/api/registrations/${registrationId}`, {
      method: 'PATCH',
      body: { status }
    })
};

/**
 * Auction API calls
 */
export const auctionApi = {
  getPlayers: (tournamentId: string) => 
    apiFetch(`/api/auction/players?tournamentId=${tournamentId}`),
  
  updateAuctionStatus: (tournamentId: string, action: string, data?: any) =>
    apiFetch(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: { action, ...data }
    })
};

/**
 * Clear all browser caches (useful for debugging)
 */
export async function clearAllCaches() {
  try {
    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Service worker caches cleared');
    }

    // Clear localStorage tournament selection
    localStorage.removeItem('admin-selected-tournament-id');
    console.log('✅ LocalStorage cleared');

    // Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('✅ Service workers unregistered');
    }

    return true;
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
}

/**
 * Force refresh page data (for debugging)
 */
export function forceRefresh() {
  // Clear caches first
  clearAllCaches().then(() => {
    // Hard reload
    window.location.reload();
  });
}

// Export for global access in development
if (typeof window !== 'undefined') {
  (window as any).adminDebug = {
    clearAllCaches,
    forceRefresh,
    apiFetch
  };
}

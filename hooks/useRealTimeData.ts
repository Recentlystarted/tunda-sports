/**
 * Professional SWR Hooks for Real-Time Data
 * This is the proper Next.js way to handle real-time data with automatic revalidation
 */

import useSWR, { SWRConfiguration } from 'swr';
import { useState, useCallback, useEffect } from 'react';

// Professional fetcher with cache-busting for real-time data
const realTimeFetcher = async (url: string) => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  const response = await fetch(`${url}${separator}_t=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Standard fetcher for less critical data
const standardFetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Real-time SWR configuration for admin/auction data
const realTimeConfig: SWRConfiguration = {
  refreshInterval: 2000, // Refresh every 2 seconds
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 1000, // Dedupe requests within 1 second
  fetcher: realTimeFetcher,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

// Standard SWR configuration for less critical data
const standardConfig: SWRConfiguration = {
  refreshInterval: 30000, // Refresh every 30 seconds
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  fetcher: standardFetcher,
  errorRetryCount: 2,
  errorRetryInterval: 2000,
};

/**
 * Hook for admin registrations with real-time updates
 */
export function useAdminRegistrations(params: {
  status?: string;
  tournamentId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const url = `/api/registrations?${queryParams.toString()}`;
  
  const { data, error, isLoading, mutate } = useSWR(url, realTimeConfig);
  
  return {
    registrations: data?.registrations || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refresh: mutate, // Manual refresh function
  };
}

/**
 * Hook for auction live data with real-time updates
 */
export function useAuctionLive(tournamentId: string) {
  const url = tournamentId ? `/api/tournaments/${tournamentId}/auction/live` : null;
  
  const { data, error, isLoading, mutate } = useSWR(url, realTimeConfig);
  
  return {
    auctionData: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook for tournament players with real-time updates
 */
export function useTournamentPlayers(tournamentId: string) {
  const url = `/api/tournaments/${tournamentId}/players`;
  
  const { data, error, isLoading, mutate } = useSWR(url, realTimeConfig);
  
  return {
    players: data?.players || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook for auction players with real-time updates
 */
export function useAuctionPlayers(tournamentId: string) {
  const url = tournamentId ? `/api/tournaments/${tournamentId}/auction-players` : null;
  
  const { data, error, isLoading, mutate } = useSWR(url, realTimeConfig);
  
  return {
    players: data?.players || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook for tournament list (less frequent updates)
 */
export function useTournaments() {
  const { data, error, isLoading, mutate } = useSWR('/api/tournaments', standardConfig);
  
  return {
    tournaments: data?.tournaments || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Generic mutation hook for admin actions
 */
export function useAdminMutation() {
  const [isLoading, setIsLoading] = useState(false);
  
  const mutate = useCallback(async (url: string, options: RequestInit = {}) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setIsLoading(false);
      return data;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);
  
  return { mutate, isLoading };
}

/**
 * Professional action hooks for common admin operations
 */
export function useRegistrationActions() {
  const { mutate, isLoading } = useAdminMutation();
  
  const approveRegistration = useCallback(async (registrationId: string) => {
    return mutate(`/api/registrations/${registrationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED' }),
    });
  }, [mutate]);
  
  const rejectRegistration = useCallback(async (registrationId: string) => {
    return mutate(`/api/registrations/${registrationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'REJECTED' }),
    });
  }, [mutate]);
  
  const approveForAuction = useCallback(async (registrationId: string) => {
    return mutate(`/api/registrations/${registrationId}/auction-approval`, {
      method: 'POST',
    });
  }, [mutate]);
  
  return {
    approveRegistration,
    rejectRegistration,
    approveForAuction,
    isLoading,
  };
}

/**
 * Professional auction control hooks
 */
export function useAuctionControls(tournamentId: string) {
  const { mutate, isLoading } = useAdminMutation();
  
  const startAuction = useCallback(async () => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'start' }),
    });
  }, [mutate, tournamentId]);
  
  const pauseAuction = useCallback(async () => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'pause' }),
    });
  }, [mutate, tournamentId]);
  
  const endAuction = useCallback(async () => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'end' }),
    });
  }, [mutate, tournamentId]);
  
  return {
    startAuction,
    pauseAuction,
    endAuction,
    isLoading,
  };
}

/**
 * Extended auction control hooks for live auction management
 */
export function useAuctionControlsExtended(tournamentId: string) {
  const { mutate, isLoading } = useAdminMutation();
  
  const startAuction = useCallback(async () => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'START_AUCTION' }),
    });
  }, [mutate, tournamentId]);

  const pauseAuction = useCallback(async () => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'PAUSE_AUCTION' }),
    });
  }, [mutate, tournamentId]);

  const endAuction = useCallback(async () => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'END_AUCTION' }),
    });
  }, [mutate, tournamentId]);

  const setCurrentPlayer = useCallback(async (playerId: string) => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'SET_CURRENT_PLAYER', playerId }),
    });
  }, [mutate, tournamentId]);

  const sellPlayer = useCallback(async (teamId: string, finalAmount: number) => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'SELL_PLAYER', teamId, finalAmount }),
    });
  }, [mutate, tournamentId]);

  const unsoldPlayer = useCallback(async () => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ action: 'UNSOLD_PLAYER' }),
    });
  }, [mutate, tournamentId]);

  const createRound = useCallback(async (roundName: string, playerIds: string[] = []) => {
    return mutate(`/api/tournaments/${tournamentId}/auction/live`, {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'CREATE_ROUND', 
        roundName, 
        playerIds 
      }),
    });
  }, [mutate, tournamentId]);
  
  return {
    startAuction,
    pauseAuction,
    endAuction,
    setCurrentPlayer,
    sellPlayer,
    unsoldPlayer,
    createRound,
    isLoading,
  };
}

/**
 * Enhanced auction management hooks with network resilience and bid timestamping
 */
export function useEnhancedAuctionManagement(tournamentId: string) {
  const { mutate, isLoading } = useAdminMutation();
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');

  // Network status monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      setNetworkStatus(isOnline ? 'online' : 'offline');
      
      // Process pending actions when back online
      if (isOnline && pendingActions.length > 0) {
        processPendingActions();
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, [pendingActions]);

  // Enhanced mutation with offline support
  const enhancedMutate = useCallback(async (action: any, allowOffline = true) => {
    try {
      if (networkStatus === 'offline' && allowOffline) {
        // Queue action for later
        const actionWithTimestamp = {
          ...action,
          timestamp: Date.now(),
          id: Math.random().toString(36).substr(2, 9)
        };
        setPendingActions(prev => [...prev, actionWithTimestamp]);
        return { success: true, queued: true };
      }

      const response = await mutate(`/api/tournaments/${tournamentId}/auction/live`, {
        method: 'POST',
        body: JSON.stringify({
          ...action,
          timestamp: Date.now() // Add timestamp to all actions
        }),
      });

      return response;
    } catch (error) {
      if (allowOffline) {
        // Network error - queue for retry
        const actionWithTimestamp = {
          ...action,
          timestamp: Date.now(),
          id: Math.random().toString(36).substr(2, 9),
          retryCount: (action.retryCount || 0) + 1
        };
        setPendingActions(prev => [...prev, actionWithTimestamp]);
        return { success: false, queued: true, error: error };
      }
      throw error;
    }
  }, [mutate, tournamentId, networkStatus]);

  // Process pending actions when network returns
  const processPendingActions = useCallback(async () => {
    const actionsToProcess = [...pendingActions];
    setPendingActions([]);

    for (const action of actionsToProcess) {
      try {
        await mutate(`/api/tournaments/${tournamentId}/auction/live`, {
          method: 'POST',
          body: JSON.stringify(action),
        });
      } catch (error) {
        console.error('Failed to process pending action:', error);
        // Re-queue failed actions with retry limit
        if ((action.retryCount || 0) < 3) {
          setPendingActions(prev => [...prev, { ...action, retryCount: (action.retryCount || 0) + 1 }]);
        }
      }
    }
  }, [pendingActions, mutate, tournamentId]);

  // Enhanced bid placement with conflict resolution
  const placeBidWithTimestamp = useCallback(async (teamId: string, bidAmount: number) => {
    return enhancedMutate({
      action: 'PLACE_BID',
      teamId,
      bidAmount,
      bidTimestamp: Date.now(),
      sessionId: sessionStorage.getItem('auctionSessionId') || Math.random().toString(36)
    });
  }, [enhancedMutate]);

  // Round management functions
  const createRoundEnhanced = useCallback(async (roundName: string, playerIds: string[] = [], config: any = {}) => {
    return enhancedMutate({
      action: 'CREATE_ROUND',
      roundName,
      playerIds,
      config,
      createdBy: 'admin', // Add admin context
    });
  }, [enhancedMutate]);

  const assignPlayersToRound = useCallback(async (roundId: string, playerIds: string[]) => {
    return enhancedMutate({
      action: 'ASSIGN_PLAYERS_TO_ROUND',
      roundId,
      playerIds
    });
  }, [enhancedMutate]);

  const reSelectUnsoldPlayer = useCallback(async (playerId: string) => {
    return enhancedMutate({
      action: 'RESELECT_PLAYER',
      playerId,
      reason: 'team_owner_request'
    });
  }, [enhancedMutate]);

  const bulkCreateRounds = useCallback(async (rounds: Array<{name: string, playerIds: string[]}>) => {
    return enhancedMutate({
      action: 'BULK_CREATE_ROUNDS',
      rounds
    });
  }, [enhancedMutate]);

  return {
    // Network status
    networkStatus,
    pendingActions,
    pendingActionsCount: pendingActions.length,
    
    // Enhanced actions
    placeBidWithTimestamp,
    createRoundEnhanced,
    assignPlayersToRound,
    reSelectUnsoldPlayer,
    bulkCreateRounds,
    processPendingActions,
    
    // Status
    isLoading,
    hasOfflineData: pendingActions.length > 0
  };
}

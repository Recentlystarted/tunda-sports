"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, DollarSign, Gavel, Play, Pause, Square, Users, Search, Filter, Plus, User, Crown, Trophy, CheckCircle, XCircle, RefreshCw, Settings, Wifi, WifiOff, Monitor, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuctionLive, useTournaments, useAuctionPlayers, useAuctionControlsExtended } from '@/hooks/useRealTimeData';

// Types for auction live data
interface AuctionPlayerData {
  id: string;
  name: string;
  position?: string;
  category?: string;
  auctionRound?: string; // Add this field which comes from API
  basePrice?: number | null; // Database field name
  icon_player?: boolean;
  profileImageUrl?: string;
  stats?: any;
  age?: number;
  city?: string;
  auctionStatus?: string;
}

interface Player {
  id: string;
  name: string;
  position: string;
  category: string;
  base_price: number; // Component interface field name
  icon_player: boolean;
  profileImageUrl?: string;
  stats?: any;
  auctionStatus?: string; // Include auction status for debugging
}

interface Team {
  id: string;
  name: string;
  owner_name: string;
  budget_remaining: number;
  players_count: number;
  max_players: number;
}

interface Bid {
  id: string;
  team_id: string;
  team_name: string;
  amount: number;
  timestamp: Date;
}

interface Round {
  id: string;
  name: string;
  players: Player[];
  completed: boolean;
}

interface Auction {
  id: string;
  tournament_id: string;
  status: 'setup' | 'live' | 'paused' | 'completed' | 'ongoing';
  current_player_id?: string;
  current_round_id?: string;
  teams: Team[];
  rounds: Round[];
  current_bids: Bid[];
  winner_team_id?: string;
  final_amount?: number;
}

interface Tournament {
  id: string;
  name: string;
  isAuctionBased: boolean;
}

export default function AuctionLiveAdminPage() {
  // Local state for UI interactions
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTournament, setSelectedTournament] = useState('');
  const [newRoundName, setNewRoundName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateRoundOpen, setIsCreateRoundOpen] = useState(false);
  const [selectedRoundForPlayers, setSelectedRoundForPlayers] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeView, setActiveView] = useState<'auction' | 'management'>('auction');

  // Navigation
  const router = useRouter();

  // Get tournament ID from URL search params
  const searchParams = useSearchParams();
  const tournamentIdFromUrl = searchParams.get('tournamentId');

  // Professional SWR hooks for real-time data - only run when we have a tournament ID
  const { tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { auctionData, isLoading: auctionLoading, refresh: refreshAuction } = useAuctionLive(selectedTournament || '');
  const { players, isLoading: playersLoading, refresh: refreshPlayers } = useAuctionPlayers(selectedTournament || '');
  const { 
    startAuction, 
    pauseAuction, 
    endAuction, 
    setCurrentPlayer, 
    sellPlayer, 
    unsoldPlayer, 
    createRound,
    isLoading: actionLoading 
  } = useAuctionControlsExtended(selectedTournament || '');

  // Derived state from SWR data
  const currentTournament = tournaments.find((t: Tournament) => t.id === selectedTournament);
  const auction: Auction | null = auctionData ? transformAuctionData(auctionData) : null;

  // Professional data transformation function
  function transformPlayersData(rawPlayers: AuctionPlayerData[]): Player[] {
    // Only show players that are APPROVED or AVAILABLE for auction
    return rawPlayers
      .filter((rawPlayer) => 
        rawPlayer.auctionStatus === 'APPROVED' || 
        rawPlayer.auctionStatus === 'AVAILABLE'
      )
      .map((rawPlayer) => ({
        id: rawPlayer.id,
        name: rawPlayer.name || 'Unknown Player',
        position: rawPlayer.position || 'Unknown',
        category: rawPlayer.category || rawPlayer.auctionRound || 'GENERAL', 
        base_price: rawPlayer.basePrice || 0, 
        icon_player: rawPlayer.icon_player || false,
        profileImageUrl: rawPlayer.profileImageUrl,
        stats: rawPlayer.stats,
        auctionStatus: rawPlayer.auctionStatus 
      }));
  }

  // Transform raw players data for consistent usage
  const transformedPlayers = transformPlayersData(players || []);
  
  // Debug logging
  console.log('🔍 Raw players from API:', players);
  console.log('🔍 Transformed players:', transformedPlayers);

  // Derived values
  const currentPlayer = auction?.current_player_id 
    ? transformedPlayers.find((p: Player) => p.id === auction.current_player_id)
    : null;

  const highestBid = auction?.current_bids.length 
    ? Math.max(...auction.current_bids.map((b: Bid) => b.amount))
    : currentPlayer?.base_price || 0;

  const leadingTeam = auction?.current_bids.length
    ? auction.current_bids.find((b: Bid) => b.amount === highestBid)
    : null;

  const filteredPlayers = transformedPlayers.filter((player: Player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
    const matchesCategory = categoryFilter === 'all' || player.category === categoryFilter;
    return matchesSearch && matchesPosition && matchesCategory;
  });
  
  // Debug transformed players
  console.log('🔍 Filtered players:', filteredPlayers);
  console.log('📊 Total players:', players?.length || 0);
  console.log('🎮 Current auction status:', auction?.status);
  console.log('🎯 Current player:', currentPlayer?.name);
  console.log('💰 Current bid:', currentBid);
  console.log('🔍 Position filter:', positionFilter);
  console.log('🔍 Category filter:', categoryFilter);

  // Helper function to transform API data to component format
  function transformAuctionData(data: any): Auction {
    return {
      id: data.tournament?.id || '',
      tournament_id: data.tournament?.id || '',
      status: data.tournament?.auctionStatus?.toLowerCase() || 'setup',
      current_player_id: data.currentRound?.currentPlayer?.id,
      current_round_id: data.currentRound?.id,
      teams: data.teamOwners?.map((owner: any) => ({
        id: owner.id,
        name: owner.teamName,
        owner_name: owner.ownerName,
        budget_remaining: owner.remainingBudget || 0,
        players_count: owner.currentPlayers || 0,
        max_players: data.tournament?.maxPlayersPerTeam || 11
      })) || [],
      rounds: [], // Will be managed separately
      current_bids: data.currentRound?.currentPlayer?.bids?.map((bid: any) => ({
        id: bid.id,
        team_id: bid.teamOwner.id,
        team_name: bid.teamOwner.teamName,
        amount: bid.bidAmount,
        timestamp: new Date(bid.createdAt)
      })) || []
    };
  }

  // Helper function to convert Google Drive sharing link to proxied image URL
  const getDirectImageUrl = (googleDriveUrl: string) => {
    if (!googleDriveUrl) return null;
    return `/api/image-proxy?url=${encodeURIComponent(googleDriveUrl)}`;
  };

  // Auto-select tournament from URL or first auction tournament
  useEffect(() => {
    if (tournamentIdFromUrl && tournamentIdFromUrl !== selectedTournament) {
      setSelectedTournament(tournamentIdFromUrl);
    } else if (tournaments.length > 0 && !selectedTournament) {
      const auctionTournament = tournaments.find((t: Tournament) => t.isAuctionBased);
      if (auctionTournament) {
        setSelectedTournament(auctionTournament.id);
      }
    }
  }, [tournaments, selectedTournament, tournamentIdFromUrl]);

  // Network status monitoring for offline functionality
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Action handlers - UI focused player selection
  const handleSetCurrentPlayer = async (playerId: string) => {
    console.log('🎯 UI: Setting current player:', playerId);
    console.log('🏟️ UI: Selected tournament:', selectedTournament);
    
    if (!selectedTournament) {
      console.log('❌ UI: No tournament selected');
      alert('Please select a tournament first');
      return;
    }
    
    try {
      const player = transformedPlayers.find((p: Player) => p.id === playerId);
      console.log('👤 UI: Found player:', player?.name);
      
      if (!player) {
        console.log('❌ UI: Player not found in available players');
        alert('Player not found. Please refresh the page and try again.');
        return;
      }
      
      console.log('🔄 UI: Making API call to set current player...');
      
      // Direct API call instead of using SWR hook
      const response = await fetch(`/api/tournaments/${selectedTournament}/auction/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'SET_CURRENT_PLAYER',
          playerId: playerId
        })
      });
      
      console.log('📊 UI: API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ UI: Player set successfully:', data);
        
        setCurrentBid(player.base_price || 0);
        
        // Force refresh the auction data
        console.log('🔄 UI: Refreshing auction data...');
        await refreshAuction();
        
        alert(`✅ ${player.name} is now the current player!`);
      } else {
        const errorData = await response.json();
        console.error('❌ UI: API Error:', errorData);
        alert(`Failed to set current player: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ UI: Error setting current player:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to set current player'}`);
    }
  };

  const handleSellPlayer = async () => {
    if (!auction || !currentPlayer || !selectedTournament || !leadingTeam) return;
    
    try {
      await sellPlayer(leadingTeam.team_id, highestBid);
      refreshAuction();
      refreshPlayers();
    } catch (error) {
      console.error('Error selling player:', error);
    }
  };

  const handleDirectSellToTeam = async (teamId: string) => {
    if (!auction || !currentPlayer || !selectedTournament) return;
    
    try {
      await sellPlayer(teamId, currentPlayer.base_price || 0);
      refreshAuction();
      refreshPlayers();
    } catch (error) {
      console.error('Error selling player:', error);
    }
  };

  const handleUnsoldPlayer = async () => {
    if (!auction || !selectedTournament) return;
    
    try {
      await unsoldPlayer();
      refreshAuction();
      refreshPlayers();
    } catch (error) {
      console.error('Error marking player unsold:', error);
    }
  };

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshAuction(), refreshPlayers()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAuction, refreshPlayers]);

  // Handle round creation
  const handleCreateRound = async () => {
    if (!selectedTournament || !newRoundName.trim()) return;
    
    try {
      console.log('🔄 Creating round:', newRoundName, 'with players:', selectedPlayers);
      await createRound(newRoundName.trim(), selectedPlayers);
      setNewRoundName('');
      setSelectedPlayers([]);
      setIsCreateRoundOpen(false);
      refreshAuction();
      alert(`✅ Round "${newRoundName.trim()}" created successfully!`);
    } catch (error) {
      console.error('Error creating round:', error);
      alert(`Failed to create round: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle assigning players to round
  const handleAssignPlayersToRound = async (roundId: string, playerIds: string[]) => {
    if (!selectedTournament) return;
    
    try {
      // Call API to assign players to round
      const response = await fetch(`/api/tournaments/${selectedTournament}/auction/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN_PLAYERS_TO_ROUND',
          roundId,
          playerIds
        })
      });
      
      if (response.ok) {
        refreshAuction();
        refreshPlayers();
      }
    } catch (error) {
      console.error('Error assigning players to round:', error);
    }
  };

  if (auctionLoading || tournamentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading auction data...</p>
        </div>
      </div>
    );
  }

  if (!selectedTournament) {
    return (
      <div className="container mx-auto p-4 max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Live Auction Admin</CardTitle>
            <CardDescription>Select a tournament to begin managing the auction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tournaments.length > 0 ? (
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament: Tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No tournaments found. Please create a tournament first.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No auction data found for the selected tournament.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto p-4">
          <div className="flex flex-col space-y-3">
            {/* Title and Network Status */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Live Auction Admin</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Manage the live auction process</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Network Status Indicator */}
                <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                  {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                {/* View Toggle */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/admin/auction-management-enhanced')}
                  className="hidden md:flex"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>

            {/* Tournament Selection and Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              {tournaments.length > 0 && (
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament: Tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={manualRefresh} 
                  variant="outline" 
                  size="sm"
                  disabled={refreshing}
                  className="flex-shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''} sm:mr-2`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                
                {/* Mobile Management Button */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/admin/auction-management-enhanced')}
                  className="md:hidden flex-shrink-0"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            {currentTournament?.isAuctionBased && (
              <div className="flex flex-wrap gap-2">
                {auction?.status === 'setup' && (
                  <Button 
                    onClick={startAuction} 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700" 
                    disabled={actionLoading}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Live Auction
                  </Button>
                )}
                {(auction?.status === 'live' || auction?.status === 'ongoing') && (
                  <Button onClick={pauseAuction} variant="outline" size="sm" disabled={actionLoading}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Auction
                  </Button>
                )}
                {auction?.status === 'paused' && (
                  <Button onClick={startAuction} size="sm" className="bg-green-600 hover:bg-green-700" disabled={actionLoading}>
                    <Play className="w-4 h-4 mr-2" />
                    Resume Auction
                  </Button>
                )}
                {(auction?.status !== 'completed' && auction?.status !== 'setup') && (
                  <Button onClick={endAuction} variant="destructive" size="sm" disabled={actionLoading}>
                    <Square className="w-4 h-4 mr-2" />
                    End Auction
                  </Button>
                )}
                <Dialog open={isCreateRoundOpen} onOpenChange={setIsCreateRoundOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Round
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Auction Round</DialogTitle>
                      <DialogDescription>
                        Create a new round. You can assign players now or add them later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Round Name</label>
                        <Input
                          placeholder="e.g., Icon Players, Category A, etc."
                          value={newRoundName}
                          onChange={(e) => setNewRoundName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Select Players for Round (Optional)</label>
                        <div className="text-xs text-muted-foreground mb-2">
                          You can create the round now and assign players later through the round management.
                        </div>
                        <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                          {transformedPlayers.length > 0 ? transformedPlayers.map((player: Player) => (
                            <div key={player.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={player.id}
                                checked={selectedPlayers.includes(player.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPlayers([...selectedPlayers, player.id]);
                                  } else {
                                    setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                                  }
                                }}
                              />
                              <label htmlFor={player.id} className="text-sm">
                                {player.name} ({player.position}) - ₹{player.base_price.toLocaleString()}
                              </label>
                            </div>
                          )) : (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              No players available. Create the round and add players later.
                            </div>
                          )}
                        </div>
                        {transformedPlayers.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedPlayers(transformedPlayers.map(p => p.id))}
                            >
                              Select All
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedPlayers([])}
                            >
                              Clear All
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                const randomPlayers = transformedPlayers
                                  .sort(() => 0.5 - Math.random())
                                  .slice(0, Math.min(5, transformedPlayers.length))
                                  .map(p => p.id);
                                setSelectedPlayers(randomPlayers);
                              }}
                            >
                              Random 5
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateRoundOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateRound}
                          disabled={!newRoundName.trim() || actionLoading}
                        >
                          Create Round
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {/* Show message for non-auction tournaments */}
            {currentTournament && !currentTournament.isAuctionBased && (
              <Badge variant="secondary" className="px-4 py-2 w-fit">
                League Tournament - No Auction Controls
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="container mx-auto p-4 pt-2">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  auction.status === 'live' || auction.status === 'ongoing' ? 'bg-green-500 animate-pulse' :
                  auction.status === 'paused' ? 'bg-yellow-500' :
                  auction.status === 'completed' ? 'bg-gray-500' : 'bg-blue-500'
                }`} />
                <span className="font-semibold capitalize text-sm">{auction.status}</span>
                {(auction.status === 'live' || auction.status === 'ongoing') && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Live Now
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {currentPlayer && (
                  <Badge variant="outline" className="text-xs">
                    Current: {currentPlayer.name}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  Players: {transformedPlayers.length}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Teams: {auction.teams.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="container mx-auto p-4 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Auction Display - Mobile First, then Desktop 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current Player on Stage */}
            {currentPlayer ? (
              <Card className="border-2 border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {currentPlayer.icon_player && <Crown className="w-4 h-4 text-yellow-500" />}
                        {currentPlayer.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {currentPlayer.position} • Base Price: ₹{(currentPlayer.base_price || 0).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={currentPlayer.icon_player ? "default" : "secondary"} className="text-xs">
                      {currentPlayer.category}
                    </Badge>
                  </div>
                  {/* Player Image if available */}
                  {currentPlayer.profileImageUrl && (
                    <div className="mt-3">
                      <img 
                        src={getDirectImageUrl(currentPlayer.profileImageUrl) || currentPlayer.profileImageUrl} 
                        alt={currentPlayer.name}
                        className="w-20 h-20 rounded-full object-cover mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Player Sold Notice */}
                  {auction.winner_team_id && auction.final_amount && (
                    <Alert className="border-green-500 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-sm text-green-800">
                        <strong>SOLD!</strong> {currentPlayer.name} sold to{' '}
                        <strong>{auction.teams.find((t: Team) => t.id === auction.winner_team_id)?.name}</strong> for{' '}
                        <strong>₹{auction.final_amount.toLocaleString()}</strong>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Current Bid Display */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current Highest Bid</span>
                      <Gavel className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold">₹{highestBid.toLocaleString()}</div>
                    {leadingTeam && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Leading: {leadingTeam.team_name}
                      </div>
                    )}
                  </div>

                  {/* Current Bids List */}
                  {auction.current_bids.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recent Bids</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {auction.current_bids
                          .sort((a, b) => b.amount - a.amount)
                          .slice(0, 5)
                          .map((bid: Bid) => (
                            <div key={bid.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                              <span className="font-medium">{bid.team_name}</span>
                              <span className="text-green-600 font-bold">₹{bid.amount.toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {leadingTeam ? (
                      <Button 
                        onClick={handleSellPlayer}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={actionLoading}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sell to {leadingTeam?.team_name} for ₹{highestBid.toLocaleString()}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground text-center">
                          No bids yet. Sell directly to a team at base price (₹{(currentPlayer.base_price || 0).toLocaleString()}) or mark as unsold.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {auction.teams.slice(0, 4).map((team: Team) => (
                            <Button
                              key={team.id}
                              size="sm"
                              variant="outline"
                              onClick={() => handleDirectSellToTeam(team.id)}
                              className="text-xs h-8"
                              disabled={team.budget_remaining < (currentPlayer.base_price || 0) || actionLoading}
                            >
                              Sell to {team.name.split(' ')[0]}
                            </Button>
                          ))}
                        </div>
                        {auction.teams.length > 4 && (
                          <div className="grid grid-cols-2 gap-2">
                            {auction.teams.slice(4, 8).map((team: Team) => (
                              <Button
                                key={team.id}
                                size="sm"
                                variant="outline"
                                onClick={() => handleDirectSellToTeam(team.id)}
                                className="text-xs h-8"
                                disabled={team.budget_remaining < (currentPlayer.base_price || 0) || actionLoading}
                              >
                                Sell to {team.name.split(' ')[0]}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <Button 
                      onClick={handleUnsoldPlayer} 
                      variant="outline" 
                      className="w-full" 
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Mark Unsold
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Ready for Auction</h3>
                      <p className="text-sm text-muted-foreground">Select a player from the list below to start bidding</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Player Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Player Selection</span>
                  <Badge variant="outline" className="text-xs">
                    {filteredPlayers.length} of {transformedPlayers.length} players
                  </Badge>
                </CardTitle>
                <CardDescription>Search and select players for auction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      <SelectItem value="BATSMAN">Batsman</SelectItem>
                      <SelectItem value="BOWLER">Bowler</SelectItem>
                      <SelectItem value="ALL_ROUNDER">All-Rounder</SelectItem>
                      <SelectItem value="WICKET_KEEPER">Wicket-Keeper</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="Icon">Icon</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Player List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player: Player) => {
                      const isCurrentPlayer = auction?.current_player_id === player.id;
                      return (
                        <Card 
                          key={player.id} 
                          className={`${
                            isCurrentPlayer 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50 cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!isCurrentPlayer) {
                              handleSetCurrentPlayer(player.id);
                            }
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {player.icon_player && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                                <div className="min-w-0 flex-1">
                                  <div className={`font-medium text-sm truncate ${isCurrentPlayer ? 'text-primary' : ''}`}>
                                    {player.name}
                                    {isCurrentPlayer && <Badge variant="default" className="ml-2 text-xs px-1 py-0">CURRENT</Badge>}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{player.position} • {player.category}</div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <div className="text-sm font-medium">₹{(player.base_price || 0).toLocaleString()}</div>
                                <Button 
                                  size="sm" 
                                  variant={isCurrentPlayer ? "default" : "outline"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isCurrentPlayer) {
                                      handleSetCurrentPlayer(player.id);
                                    }
                                  }}
                                  disabled={isCurrentPlayer || actionLoading}
                                  className="text-xs h-6 px-2 mt-1"
                                >
                                  {isCurrentPlayer ? 'Live' : 'Select'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                          {players.length === 0 ? 'No players found for this tournament' : 'No players match your search criteria'}
                        </p>
                        {players.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Try adjusting your filters - Position: {positionFilter}, Category: {categoryFilter}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Team Budgets and Stats */}
          <div className="space-y-4">
            {/* Team Budgets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5" />
                  Team Budgets
                </CardTitle>
                <CardDescription>Real-time budget tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {auction.teams.map((team: Team) => {
                  const budgetUsed = ((team.budget_remaining || 0) / 1000000) * 100; // Assuming 10 lakh total budget
                  const remainingPercent = ((team.budget_remaining || 0) / 1000000) * 100;
                  return (
                    <Card key={team.id} className="p-3">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{team.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{team.owner_name}</div>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {team.players_count}/{team.max_players}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Remaining Budget</span>
                            <span className="text-sm font-bold text-green-600">
                              ₹{team.budget_remaining.toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Budget Bar */}
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all" 
                              style={{ width: `${Math.max(remainingPercent, 5)}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Used: ₹{(1000000 - team.budget_remaining).toLocaleString()}</span>
                            <span>{Math.round(remainingPercent)}% left</span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        {currentPlayer && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDirectSellToTeam(team.id)}
                            disabled={team.budget_remaining < (currentPlayer.base_price || 0) || actionLoading}
                            className="w-full text-xs"
                          >
                            {team.budget_remaining >= (currentPlayer.base_price || 0) 
                              ? `Sell to ${team.name.split(' ')[0]}` 
                              : 'Insufficient Budget'
                            }
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>

            {/* Auction Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5" />
                  Auction Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{transformedPlayers.length}</div>
                    <div className="text-xs text-muted-foreground">Total Players</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{auction.teams.length}</div>
                    <div className="text-xs text-muted-foreground">Teams</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {transformedPlayers.filter(p => p.auctionStatus === 'SOLD').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Sold</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {transformedPlayers.filter(p => p.auctionStatus === 'UNSOLD').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Unsold</div>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Total Budget Used</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{auction.teams.reduce((total, team) => total + (1000000 - team.budget_remaining), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Across all {auction.teams.length} teams
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Offline Setup Explanation */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Alert className="border-yellow-500 bg-yellow-50">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              <strong>Offline Mode:</strong> Actions are queued and will sync when connection returns.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

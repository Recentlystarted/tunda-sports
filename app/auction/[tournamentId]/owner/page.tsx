'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Award, 
  DollarSign, 
  Phone, 
  Mail, 
  MapPin, 
  Gavel, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  Trophy,
  Target,
  Timer,
  Crown,
  Star,
  Activity
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  city: string;
  position: string;
  experience: string;
  basePrice: number;
  soldPrice?: number;
  auctionStatus: string;
  profileImageUrl?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  auctionTeam?: {
    name: string;
    ownerName: string;
  };
}

interface Bid {
  id: string;
  bidAmount: number;
  teamOwner: {
    teamName: string;
    ownerName: string;
  };
  createdAt: string;
}

interface TeamOwner {
  id: string;
  teamName: string;
  teamIndex: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerCity: string;
  sponsorName?: string;
  totalBudget?: number;
  remainingBudget?: number;
  currentPlayers?: number;
  minPlayersNeeded?: number;
  isParticipating?: boolean;
}

interface Tournament {
  id: string;
  name: string;
  auctionDate?: string;
  venue: string;
  auctionStatus?: string;
  minPlayerPoints?: number;
  ownerParticipationCost?: number;
  minPlayersPerTeam?: number;
}

function OwnerAuctionPortalContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tournamentId = params.tournamentId as string;
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teamOwner, setTeamOwner] = useState<TeamOwner | null>(null);
  const [myPlayers, setMyPlayers] = useState<Player[]>([]);
  const [recentlySoldPlayers, setRecentlySoldPlayers] = useState<Player[]>([]);
  const [teamStatistics, setTeamStatistics] = useState<any>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  // Live auction states
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBids, setCurrentBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [auctionLive, setAuctionLive] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [lastPlayerId, setLastPlayerId] = useState<string | null>(null);
  const [userTypedAmount, setUserTypedAmount] = useState(false);

  // Helper function to calculate suggested bid amount
  const getSuggestedBid = () => {
    if (!currentPlayer || !tournament) return 0;
    
    if (currentBids.length > 0) {
      const highestBid = Math.max(...currentBids.map((b: Bid) => b.bidAmount));
      const minBid = tournament.minPlayerPoints || 500;
      return Math.max(highestBid + minBid, minBid);
    } else {
      return Math.max(currentPlayer.basePrice, tournament.minPlayerPoints || 500);
    }
  };

  // Helper function to convert Google Drive sharing link to proxied image URL
  const getDirectImageUrl = (googleDriveUrl: string) => {
    if (!googleDriveUrl) return null;
    
    // Use our proxy API to handle CORS issues with Google Drive and other images
    return `/api/image-proxy?url=${encodeURIComponent(googleDriveUrl)}`;
  };

  useEffect(() => {
    // Check for token from URL or localStorage
    let authToken = token;
    if (!authToken) {
      // Try to get token from localStorage as fallback
      authToken = localStorage.getItem(`auction-token-${tournamentId}`);
    }
    
    if (authToken) {
      // Save token to localStorage for persistence
      localStorage.setItem(`auction-token-${tournamentId}`, authToken);
      verifyTokenAndFetchData(authToken);
    } else {
      toast({
        title: 'Access Denied',
        description: 'Invalid or missing auction token. Please use the correct auction link.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  }, [tournamentId, token]);

  // Auto-refresh live auction data - PRODUCTION OPTIMIZED
  useEffect(() => {
    if (authorized && teamOwner) {
      // Use faster polling for production-ready real-time experience
      const interval = setInterval(() => {
        fetchLiveAuctionData();
        fetchTeamDashboardData();
      }, 500); // Ultra-fast 500ms updates for near real-time experience
      return () => clearInterval(interval);
    }
  }, [authorized, tournamentId, teamOwner]);

  const fetchTeamDashboardData = async () => {
    if (!teamOwner) return;
    
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/team-owners/${teamOwner.id}/dashboard`);
      const data = await response.json();
      
      if (data.success) {
        setTeamOwner(data.teamOwner);
        setMyPlayers(data.myPlayers);
        setRecentlySoldPlayers(data.recentlySoldPlayers);
        setTeamStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching team dashboard data:', error);
    }
  };

  const fetchLiveAuctionData = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/auction/bid`);
      const data = await response.json();
      
      console.log('🔄 Live auction data fetched:', data); // Debug log
      
      if (data.success) {
        const newPlayer = data.currentPlayer;
        let newBids = data.bids || [];
        
        console.log('🎯 Current player:', newPlayer?.name);
        console.log('💰 Current bids count:', newBids.length);
        
        // Transform bids if they have nested teamOwner structure
        if (newBids.length > 0 && newBids[0].teamOwner) {
          newBids = newBids.map((bid: any) => ({
            ...bid,
            teamOwner: {
              id: bid.teamOwner.id || bid.teamOwnerId,
              teamName: bid.teamOwner.teamName,
              ownerName: bid.teamOwner.ownerName
            }
          }));
        }
        
        setCurrentPlayer(newPlayer);
        setCurrentBids(newBids);
        setAuctionLive(newPlayer !== null);
        
        // PRODUCTION-READY BID AUTO-INCREMENT LOGIC
        // Smart update that preserves user input while providing real-time suggestions
        const playerChanged = newPlayer?.id !== lastPlayerId;
        
        if (playerChanged) {
          // New player - reset everything
          setLastPlayerId(newPlayer?.id || null);
          setUserTypedAmount(false);
          
          if (newPlayer) {
            const suggestedBid = getSuggestedBid();
            setBidAmount(suggestedBid.toString());
          } else {
            setBidAmount('');
          }
        } else if (newPlayer && !userTypedAmount) {
          // Same player - only auto-update if user is NOT actively typing
          // This prevents input interference during real-time updates
          const currentBidValue = parseInt(bidAmount) || 0;
          const suggestedBid = getSuggestedBid();
          
          // Only update if suggested bid is significantly higher (prevents flicker)
          if (suggestedBid > currentBidValue && (suggestedBid - currentBidValue) >= (tournament?.minPlayerPoints || 500)) {
            setBidAmount(suggestedBid.toString());
          }
        }
        // If user is typing (userTypedAmount = true), NEVER interfere with their input
      }
    } catch (error) {
      console.error('Error fetching live auction data:', error);
    }
  };

  const verifyTokenAndFetchData = async (authToken?: string) => {
    try {
      setLoading(true);
      
      // Use provided token or fallback to URL token
      const tokenToUse = authToken || token;
      
      // Verify token and get team owner details
      const ownerRes = await fetch(`/api/tournaments/${tournamentId}/team-owners/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToUse }),
      });

      if (!ownerRes.ok) {
        throw new Error('Invalid token');
      }

      const ownerData = await ownerRes.json();
      setTeamOwner(ownerData);
      setAuthorized(true);

      // Fetch tournament details
      const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
      const tournamentResponse = await tournamentRes.json();
      const tournamentData = tournamentResponse.success ? tournamentResponse.tournament : tournamentResponse;
      setTournament(tournamentData);

      // Fetch team dashboard data (includes players, stats, etc.)
      const dashboardRes = await fetch(`/api/tournaments/${tournamentId}/team-owners/${ownerData.id}/dashboard`);
      const dashboardResponse = await dashboardRes.json();
      
      if (dashboardResponse.success) {
        setMyPlayers(dashboardResponse.myPlayers);
        setRecentlySoldPlayers(dashboardResponse.recentlySoldPlayers);
        setTeamStatistics(dashboardResponse.statistics);
        // Update team owner with latest data
        setTeamOwner(dashboardResponse.teamOwner);
      }

      // Also fetch all auction players for reference
      const playersRes = await fetch(`/api/tournaments/${tournamentId}/auction-players`);
      const playersResponse = await playersRes.json();
      const playersData = playersResponse.success ? playersResponse.players : [];
      setAllPlayers(playersData);

    } catch (error) {
      console.error('Error verifying token:', error);
      toast({
        title: 'Access Denied',
        description: 'Invalid auction token or session expired',
        variant: 'destructive',
      });
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async () => {
    if (!currentPlayer || !bidAmount || !teamOwner) return;
    
    const bidValue = parseInt(bidAmount);
    if (isNaN(bidValue) || bidValue < (tournament?.minPlayerPoints || 500)) {
      toast({
        title: 'Invalid Bid',
        description: `Minimum bid is ${tournament?.minPlayerPoints || 500} points`,
        variant: 'destructive'
      });
      return;
    }

    setBidding(true);
    
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/auction/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamOwnerId: teamOwner.id,
          playerId: currentPlayer.id,
          bidAmount: bidValue
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Bid Placed!',
          description: `Successfully bid ${bidValue.toLocaleString()} points for ${currentPlayer.name}`,
        });
        
        // IMMEDIATE UPDATE - No waiting for polling
        // Add the bid immediately to current bids for instant feedback
        const newBid = {
          id: `temp-${Date.now()}`, // Temporary ID
          bidAmount: bidValue,
          teamOwner: {
            id: teamOwner.id,
            teamName: teamOwner.teamName,
            ownerName: teamOwner.ownerName
          },
          createdAt: new Date().toISOString()
        };
        
        setCurrentBids(prevBids => [...prevBids, newBid]);
        
        // Clear user input to show fresh suggested bid
        setBidAmount('');
        setUserTypedAmount(false);
        
        // Refresh data for accuracy (but user already sees immediate update)
        fetchLiveAuctionData();
        verifyTokenAndFetchData(); // Update budget info
        
      } else {
        throw new Error(data.error || data.warning || 'Failed to place bid');
      }
    } catch (error) {
      toast({
        title: 'Bid Failed',
        description: error instanceof Error ? error.message : 'Failed to place bid',
        variant: 'destructive'
      });
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 md:h-32 md:w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-sm md:text-base">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized || !teamOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="text-destructive text-4xl md:text-6xl mb-4">🚫</div>
            <h2 className="text-lg md:text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              You don't have permission to access this auction portal.
              Please check your auction link or contact the tournament administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const soldPlayers = allPlayers.filter(p => p.auctionStatus === 'SOLD');
  const unsoldPlayers = allPlayers.filter(p => p.auctionStatus === 'UNSOLD');
  const myTeamTotalSpent = teamStatistics?.totalSpent || myPlayers.reduce((total, player) => total + (player.soldPrice || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4 md:space-y-6 max-w-7xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 md:p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Award className="h-6 w-6 md:h-8 md:w-8" />
            <h1 className="text-lg md:text-2xl font-bold">{teamOwner.teamName} - Auction Portal</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm md:text-base">{tournament?.name}</p>
          <p className="text-primary-foreground/80 text-sm md:text-base">Owner: {teamOwner.ownerName}</p>
          {tournament?.auctionDate && (
            <p className="text-primary-foreground/80 text-sm md:text-base">
              Auction Date: {new Date(tournament.auctionDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Budget & Team Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Budget</p>
                  <p className="text-2xl font-bold">{teamOwner.totalBudget?.toLocaleString() || 'N/A'}</p>
                  <p className="text-muted-foreground text-xs">points allocated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-blue-100 text-sm font-medium">Remaining Budget</p>
                  <p className="text-2xl font-bold">{teamOwner.remainingBudget?.toLocaleString() || 'N/A'}</p>
                  <p className="text-blue-100 text-xs">points available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8" />
                <div>
                  <p className="text-purple-100 text-sm font-medium">Team Progress</p>
                  <p className="text-2xl font-bold">
                    {teamOwner.currentPlayers || 0} / {teamOwner.minPlayersNeeded || 0}
                  </p>
                  <p className="text-purple-100 text-xs">players acquired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Auction Interface */}
        {auctionLive && currentPlayer ? (
          <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <Gavel className="h-5 w-5 animate-pulse" />
                🔴 LIVE AUCTION - {currentPlayer.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Player Details */}
                <div className="flex gap-4">
                  {currentPlayer.profileImageUrl ? (
                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-lg bg-muted border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-lg">
                      <img 
                        src={getDirectImageUrl(currentPlayer.profileImageUrl) || undefined} 
                        alt={currentPlayer.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide image if it fails to load (Google Drive tracking prevention)
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-muted"><span class="text-3xl font-bold text-muted-foreground">${currentPlayer.name.charAt(0)}</span></div>`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-lg bg-muted border-2 border-primary/20 flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-muted-foreground">{currentPlayer.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground">{currentPlayer.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Position:</strong> {currentPlayer.position}</p>
                      <p><strong>Age:</strong> {currentPlayer.age} • <strong>City:</strong> {currentPlayer.city}</p>
                      <p><strong>Base Price:</strong> {currentPlayer.basePrice.toLocaleString()} points</p>
                      <p><strong>Experience:</strong> {currentPlayer.experience}</p>
                      {currentPlayer.battingStyle && (
                        <p><strong>Batting:</strong> {currentPlayer.battingStyle}</p>
                      )}
                      {currentPlayer.bowlingStyle && (
                        <p><strong>Bowling:</strong> {currentPlayer.bowlingStyle}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bidding Interface */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Current Bids
                    </h4>
                    {currentBids.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {currentBids.map((bid, index) => (
                          <div 
                            key={bid.id} 
                            className={`flex justify-between items-center p-3 rounded-lg border ${
                              index === 0 ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' : 'bg-muted border-border'
                            }`}
                          >
                            <div>
                              <div className="font-medium text-sm text-foreground">{bid.teamOwner.teamName}</div>
                              <div className="text-xs text-muted-foreground">{bid.teamOwner.ownerName}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-foreground">{bid.bidAmount.toLocaleString()} pts</div>
                              {index === 0 && <Badge variant="default" className="text-xs">Highest</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-muted/50 rounded-lg">
                        <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">No bids yet - Start bidding!</p>
                      </div>
                    )}
                  </div>

                  {/* Bid Input */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="number"
                        placeholder="Enter bid amount (in 100s)"
                        value={bidAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          
                          // Allow empty input for typing
                          if (value === '') {
                            setBidAmount('');
                            // Reset typing flag when empty
                            setUserTypedAmount(false);
                            return;
                          }
                          
                          const numValue = parseInt(value);
                          
                          // Mark that user is actively typing (prevents auto-updates)
                          setUserTypedAmount(true);
                          
                          // Check if it's a valid number and divisible by 100
                          if (!isNaN(numValue) && numValue % 100 === 0) {
                            setBidAmount(value);
                          } else if (!isNaN(numValue)) {
                            // Round to nearest 100 for better UX
                            const rounded = Math.round(numValue / 100) * 100;
                            setBidAmount(rounded.toString());
                          }
                        }}
                        onFocus={() => {
                          // When user focuses input, prevent auto-updates
                          setUserTypedAmount(true);
                        }}
                        onBlur={(e) => {
                          // On blur, reset typing flag to allow auto-updates again
                          setTimeout(() => {
                            setUserTypedAmount(false);
                          }, 1000); // Small delay to ensure they're done typing
                          
                          // Ensure value is in 100s
                          const value = e.target.value;
                          if (value && !isNaN(parseInt(value))) {
                            const numValue = parseInt(value);
                            if (numValue % 100 !== 0) {
                              const rounded = Math.round(numValue / 100) * 100;
                              setBidAmount(rounded.toString());
                            }
                          }
                        }}
                        className="flex-1 text-base md:text-lg font-mono"
                        min={tournament?.minPlayerPoints || 500}
                        step={100}
                      />
                      <Button 
                        onClick={placeBid}
                        disabled={bidding || !bidAmount || parseInt(bidAmount) % 100 !== 0}
                        className="w-full sm:w-auto px-4 md:px-6 h-10 md:h-11"
                        size="default"
                      >
                        {bidding ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span className="hidden sm:inline">Bidding...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <Gavel className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Place Bid</span>
                            <span className="sm:hidden">Bid</span>
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Suggested Bid Indicator */}
                    {currentPlayer && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Suggested bid: <span className="font-semibold text-green-600 dark:text-green-400">
                            {getSuggestedBid().toLocaleString()} pts
                          </span>
                        </span>
                        {parseInt(bidAmount) !== getSuggestedBid() && bidAmount && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBidAmount(getSuggestedBid().toString());
                              setUserTypedAmount(false);
                            }}
                            className="h-7 px-2 text-xs"
                          >
                            Use suggested
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Validation Message */}
                    {bidAmount && parseInt(bidAmount) % 100 !== 0 && (
                      <div className="text-sm text-amber-600 dark:text-amber-400">
                        Bid amount must be in multiples of 100 (e.g., 1000, 1100, 1200)
                      </div>
                    )}
                    
                    {/* Budget Info */}
                    {teamOwner.remainingBudget !== undefined && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between font-medium">
                            <span>Your Budget:</span>
                            <span className="font-mono text-blue-700 dark:text-blue-300">{teamOwner.remainingBudget.toLocaleString()} pts</span>
                          </div>
                          {teamOwner.currentPlayers !== undefined && teamOwner.minPlayersNeeded !== undefined && (
                            <div className="flex justify-between">
                              <span>Players Needed:</span>
                              <span className="font-medium">{Math.max(0, teamOwner.minPlayersNeeded - teamOwner.currentPlayers)} more</span>
                            </div>
                          )}
                          <div className="text-muted-foreground">
                            Min bid: {tournament?.minPlayerPoints || 500} points
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Auction Status */
          <Card className="bg-muted/50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                {tournament?.auctionStatus === 'ONGOING' ? (
                  <>
                    <Timer className="h-5 w-5" />
                    <span>Auction in progress - Waiting for next player...</span>
                  </>
                ) : tournament?.auctionStatus === 'COMPLETED' ? (
                  <>
                    <Trophy className="h-5 w-5" />
                    <span>Auction completed!</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5" />
                    <span>Auction hasn't started yet</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 md:p-4 text-center">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300">{myPlayers.length}</p>
              <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400">My Players</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-3 md:p-4 text-center">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-300">₹{myTeamTotalSpent.toLocaleString()}</p>
              <p className="text-xs md:text-sm text-green-600 dark:text-green-400">Total Spent</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-3 md:p-4 text-center">
              <Award className="h-6 w-6 md:h-8 md:w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300">{soldPlayers.length}</p>
              <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400">Total Players Sold</p>
            </CardContent>
          </Card>
        </div>

        {/* Recently Sold Players */}
        {recentlySoldPlayers && recentlySoldPlayers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                Recently Sold Players
              </CardTitle>
              <CardDescription>Latest player acquisitions across all teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentlySoldPlayers.slice(0, 5).map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {player.profileImageUrl ? (
                        <img 
                          src={getDirectImageUrl(player.profileImageUrl) || ''} 
                          alt={player.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {player.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">₹{player.soldPrice?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.auctionTeam?.name || 'Unknown Team'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Team Squad */}
        {myPlayers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Crown className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                My Team Squad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {myPlayers.map((player) => (
                  <Card key={player.id} className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm md:text-base truncate pr-2">{player.name}</h4>
                        <Badge variant="default" className="bg-green-600 text-xs shrink-0">{player.position}</Badge>
                      </div>
                      
                      <div className="space-y-1 text-xs md:text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Phone className="h-3 w-3" />
                          <span className="truncate">{player.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{player.email}</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{player.city}</span>
                        </div>
                        <div>
                          <span className="font-medium">Experience:</span> {player.experience}
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Base: ₹{player.basePrice.toLocaleString()}</span>
                        <span className="font-bold text-green-600">
                          Bought: ₹{player.soldPrice?.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auction Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Recently Sold Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                Recently Sold Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
                {soldPlayers.slice(0, 10).map((player) => (
                  <div key={player.id} className="flex justify-between items-center p-2 md:p-3 bg-muted rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">{player.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {player.position} • {player.auctionTeam?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Owner: {player.auctionTeam?.ownerName}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-green-600 text-sm md:text-base">₹{player.soldPrice?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Base: ₹{player.basePrice.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {soldPlayers.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No players sold yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Star className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-muted-foreground text-sm md:text-base">Team Details</h4>
                  <div className="mt-2 space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between">
                      <span>Team Name:</span>
                      <span className="font-medium truncate ml-2">{teamOwner.teamName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team Index:</span>
                      <span className="font-medium">#{teamOwner.teamIndex}</span>
                    </div>
                    {teamOwner.sponsorName && (
                      <div className="flex justify-between">
                        <span>Sponsor:</span>
                        <span className="font-medium truncate ml-2">{teamOwner.sponsorName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-muted-foreground text-sm md:text-base">Owner Contact</h4>
                  <div className="mt-2 space-y-2 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="truncate">{teamOwner.ownerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="truncate">{teamOwner.ownerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="truncate">{teamOwner.ownerCity}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-muted-foreground mb-2 text-sm md:text-base">Squad Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                    <div>
                      <p className="text-muted-foreground">Players Bought:</p>
                      <p className="text-xl md:text-2xl font-bold text-green-600">{myPlayers.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Investment:</p>
                      <p className="text-xl md:text-2xl font-bold text-primary">₹{myTeamTotalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unsold Players (for reference) */}
        {unsoldPlayers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Available Players</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">Players available for auction</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                {unsoldPlayers.map((player) => (
                  <div key={player.id} className="p-2 md:p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm md:text-base truncate">{player.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{player.position}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Base: ₹{player.basePrice.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function OwnerAuctionPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading Auction Portal...</h1>
            <p className="text-gray-600">Please wait while we load your auction dashboard.</p>
          </div>
        </div>
      </div>
    }>
      <OwnerAuctionPortalContent />
    </Suspense>
  );
}

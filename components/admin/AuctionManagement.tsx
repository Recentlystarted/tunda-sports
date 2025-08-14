"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, DollarSign, Gavel, Play, Pause, Square, Users, Search, Filter, Plus, User, Crown, Trophy, CheckCircle, XCircle, RefreshCw, Shuffle, Settings, Layers, Timer, Wifi, WifiOff, AlertTriangle, CheckCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuctionLive, useTournaments, useAuctionPlayers, useAuctionControlsExtended } from '@/hooks/useRealTimeData';

interface AuctionManagementProps {
  tournamentId: string;
}

interface Player {
  id: string;
  name: string;
  position: string;
  category: string;
  base_price: number;
  icon_player: boolean;
  profileImageUrl?: string;
  stats?: any;
  auctionStatus?: string;
}

interface Round {
  id: string;
  name: string;
  roundNumber: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  players: Player[];
  totalPlayers: number;
}

export default function AuctionManagement({ tournamentId }: AuctionManagementProps) {
  // State management
  const [activeTab, setActiveTab] = useState('rounds');
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [newRoundName, setNewRoundName] = useState('');
  const [isCreateRoundOpen, setIsCreateRoundOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  // Data hooks
  const { auctionData, isLoading: auctionLoading, refresh: refreshAuction } = useAuctionLive(tournamentId);
  const { players, isLoading: playersLoading, refresh: refreshPlayers } = useAuctionPlayers(tournamentId);
  const { createRound, isLoading: actionLoading } = useAuctionControlsExtended(tournamentId);

  // Transform data
  const transformedPlayers = players?.filter((p: any) => 
    p.auctionStatus === 'APPROVED' || p.auctionStatus === 'AVAILABLE'
  ).map((p: any) => ({
    id: p.id,
    name: p.name || 'Unknown Player',
    position: p.position || 'Unknown',
    category: p.category || p.auctionRound || 'GENERAL',
    base_price: p.basePrice || 0,
    icon_player: p.icon_player || false,
    profileImageUrl: p.profileImageUrl,
    stats: p.stats,
    auctionStatus: p.auctionStatus
  })) || [];

  // Mock rounds data - in real implementation, this would come from API
  const [rounds, setRounds] = useState<Round[]>([
    {
      id: '1',
      name: 'Icon Players',
      roundNumber: 1,
      status: 'PENDING',
      players: [],
      totalPlayers: 0
    },
    {
      id: '2',
      name: 'Category A+',
      roundNumber: 2,
      status: 'PENDING',
      players: [],
      totalPlayers: 0
    }
  ]);

  // Network monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Auto-sync on network reconnect
  useEffect(() => {
    if (networkStatus === 'online' && pendingActions.length > 0) {
      processPendingActions();
    }
  }, [networkStatus]);

  // Filter players
  const filteredPlayers = transformedPlayers.filter((player: Player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
    const matchesCategory = categoryFilter === 'all' || player.category === categoryFilter;
    return matchesSearch && matchesPosition && matchesCategory;
  });

  // Auto-categorize players by category
  const categorizePlayersByCategory = () => {
    const categories = ['Icon', 'A+', 'A', 'B+', 'B', 'GENERAL'];
    const newRounds: Round[] = [];

    categories.forEach((category, index) => {
      const categoryPlayers = transformedPlayers.filter((p: Player) => p.category === category);
      if (categoryPlayers.length > 0) {
        newRounds.push({
          id: `auto-${category}`,
          name: `${category} Players`,
          roundNumber: index + 1,
          status: 'PENDING',
          players: categoryPlayers,
          totalPlayers: categoryPlayers.length
        });
      }
    });

    setRounds(newRounds);
  };

  // Auto-categorize players by position
  const categorizePlayersByPosition = () => {
    const positions = ['WICKET_KEEPER', 'BATSMAN', 'ALL_ROUNDER', 'BOWLER'];
    const newRounds: Round[] = [];

    positions.forEach((position, index) => {
      const positionPlayers = transformedPlayers.filter((p: Player) => p.position === position);
      if (positionPlayers.length > 0) {
        newRounds.push({
          id: `auto-${position}`,
          name: `${position.replace('_', ' ')} Round`,
          roundNumber: index + 1,
          status: 'PENDING',
          players: positionPlayers,
          totalPlayers: positionPlayers.length
        });
      }
    });

    setRounds(newRounds);
  };

  // Random distribution
  const randomDistributePlayers = (roundCount: number = 4) => {
    const shuffledPlayers = [...transformedPlayers].sort(() => Math.random() - 0.5);
    const playersPerRound = Math.ceil(shuffledPlayers.length / roundCount);
    const newRounds: Round[] = [];

    for (let i = 0; i < roundCount; i++) {
      const startIndex = i * playersPerRound;
      const endIndex = Math.min(startIndex + playersPerRound, shuffledPlayers.length);
      const roundPlayers = shuffledPlayers.slice(startIndex, endIndex);

      if (roundPlayers.length > 0) {
        newRounds.push({
          id: `random-${i + 1}`,
          name: `Random Round ${i + 1}`,
          roundNumber: i + 1,
          status: 'PENDING',
          players: roundPlayers,
          totalPlayers: roundPlayers.length
        });
      }
    }

    setRounds(newRounds);
  };

  // Handle creating a round
  const handleCreateRound = async () => {
    if (!newRoundName.trim()) return;

    try {
      await createRound(newRoundName.trim(), selectedPlayers);
      setNewRoundName('');
      setSelectedPlayers([]);
      setIsCreateRoundOpen(false);
      refreshAuction();
      setLastSync(new Date());
    } catch (error) {
      console.error('Error creating round:', error);
      if (networkStatus === 'offline') {
        // Queue action for later
        setPendingActions(prev => [...prev, {
          type: 'CREATE_ROUND',
          data: { roundName: newRoundName.trim(), playerIds: selectedPlayers },
          timestamp: new Date()
        }]);
      }
    }
  };

  // Process pending actions when network comes back
  const processPendingActions = async () => {
    const actionsToProcess = [...pendingActions];
    setPendingActions([]);

    for (const action of actionsToProcess) {
      try {
        if (action.type === 'CREATE_ROUND') {
          await createRound(action.data.roundName, action.data.playerIds);
        }
        // Add other action types as needed
      } catch (error) {
        console.error('Failed to process pending action:', error);
        // Re-queue failed actions
        setPendingActions(prev => [...prev, action]);
      }
    }

    refreshAuction();
    setLastSync(new Date());
  };

  // Bulk player selection
  const selectAllPlayers = () => {
    setSelectedPlayers(filteredPlayers.map((p: Player) => p.id));
  };

  const clearAllPlayers = () => {
    setSelectedPlayers([]);
  };

  const selectRandomPlayers = (count: number = 5) => {
    const shuffled = [...filteredPlayers].sort(() => Math.random() - 0.5);
    setSelectedPlayers(shuffled.slice(0, count).map(p => p.id));
  };

  if (auctionLoading || playersLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Status Banner */}
      <Card className={`border-l-4 ${networkStatus === 'online' ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {networkStatus === 'online' ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className={`font-medium ${networkStatus === 'online' ? 'text-green-700' : 'text-red-700'}`}>
                {networkStatus === 'online' ? 'Connected' : 'Offline Mode'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {pendingActions.length > 0 && (
                <Badge variant="secondary">
                  {pendingActions.length} pending actions
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
              <Button size="sm" variant="outline" onClick={() => { refreshAuction(); refreshPlayers(); setLastSync(new Date()); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rounds" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Round Management
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Player Assignment
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Auction Settings
          </TabsTrigger>
        </TabsList>

        {/* Round Management Tab */}
        <TabsContent value="rounds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auction Rounds Setup</CardTitle>
              <CardDescription>
                Pre-configure all auction rounds and assign players automatically or manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Setup Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={categorizePlayersByCategory} variant="outline" className="h-20 flex-col">
                  <Crown className="w-6 h-6 mb-2" />
                  <span>By Category</span>
                  <span className="text-xs text-muted-foreground">Icon, A+, A, B+, B</span>
                </Button>
                <Button onClick={categorizePlayersByPosition} variant="outline" className="h-20 flex-col">
                  <User className="w-6 h-6 mb-2" />
                  <span>By Position</span>
                  <span className="text-xs text-muted-foreground">WK, BAT, AR, BOW</span>
                </Button>
                <Button onClick={() => randomDistributePlayers(4)} variant="outline" className="h-20 flex-col">
                  <Shuffle className="w-6 h-6 mb-2" />
                  <span>Random Split</span>
                  <span className="text-xs text-muted-foreground">4 random rounds</span>
                </Button>
              </div>

              {/* Manual Round Creation */}
              <div className="flex gap-2">
                <Dialog open={isCreateRoundOpen} onOpenChange={setIsCreateRoundOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Custom Round
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Create New Auction Round</DialogTitle>
                      <DialogDescription>
                        Create a custom round and assign players manually
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

                      {/* Player Selection with Filters */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Select Players for Round</label>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={selectAllPlayers}>
                              Select All ({filteredPlayers.length})
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => selectRandomPlayers(5)}>
                              Random 5
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => selectRandomPlayers(10)}>
                              Random 10
                            </Button>
                            <Button size="sm" variant="outline" onClick={clearAllPlayers}>
                              Clear All
                            </Button>
                          </div>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="max-h-96 overflow-y-auto border rounded p-4 space-y-2">
                          {filteredPlayers.map((player: Player) => (
                            <div key={player.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                              <Checkbox
                                id={player.id}
                                checked={selectedPlayers.includes(player.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPlayers([...selectedPlayers, player.id]);
                                  } else {
                                    setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                                  }
                                }}
                              />
                              <div className="flex items-center gap-2 flex-1">
                                {player.icon_player && <Crown className="w-4 h-4 text-yellow-500" />}
                                <div>
                                  <div className="font-medium">{player.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {player.position} • {player.category} • ₹{player.base_price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {selectedPlayers.length} players selected
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateRoundOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateRound}
                          disabled={!newRoundName.trim() || actionLoading}
                        >
                          {actionLoading ? 'Creating...' : 'Create Round'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Current Rounds */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Rounds ({rounds.length})</h3>
                {rounds.map((round) => (
                  <Card key={round.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          round.status === 'ACTIVE' ? 'default' :
                          round.status === 'COMPLETED' ? 'secondary' : 'outline'
                        }>
                          Round {round.roundNumber}
                        </Badge>
                        <span className="font-medium">{round.name}</span>
                      </div>
                      <Badge variant="outline">{round.totalPlayers} players</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Status: {round.status} • Players assigned: {round.players.length}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Player Assignment Tab */}
        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Assignment & Management</CardTitle>
              <CardDescription>
                Assign players to rounds, manage unsold players, and handle re-selections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Advanced player assignment features coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auction Safety & Settings</CardTitle>
              <CardDescription>
                Configure network resilience, bid timestamping, and live auction safety features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Network Resilience */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Network Resilience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCheck className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Offline Mode</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Actions are queued when offline and synced when connection returns
                    </p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Bid Timestamping</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All bids are timestamped for conflict resolution
                    </p>
                  </Card>
                </div>
              </div>

              {/* Bid Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bid Management</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Automatic bid conflict resolution</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Real-time bid validation</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Network retry attempts</span>
                    <Badge variant="outline">3 attempts</Badge>
                  </div>
                </div>
              </div>

              {/* Data Safety */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Data Safety</h3>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    All auction data is automatically backed up every 30 seconds during live auctions.
                    Network interruptions won't cause data loss.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

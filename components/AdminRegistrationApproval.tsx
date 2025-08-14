"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Crown, 
  Trophy,
  Search, 
  Filter,
  Check, 
  X, 
  Mail, 
  Phone, 
  MapPin,
  Edit,
  Eye,
  SendHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  position?: string;
  experience?: string;
  basePrice: number;
  auctionStatus: string;
  tournament: {
    id: string;
    name: string;
  };
}

interface TeamOwner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  teamName: string;
  budget: number;
  remainingBudget: number;
  status?: string;
  tournament: {
    id: string;
    name: string;
  };
}

interface Tournament {
  id: string;
  name: string;
  format: string;
  isAuctionBased: boolean;
}

export default function AdminRegistrationApproval() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamOwners, setTeamOwners] = useState<TeamOwner[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tournamentFilter, setTournamentFilter] = useState('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<TeamOwner | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
    fetchPlayers();
    fetchTeamOwners();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments?status=ACTIVE');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.filter((t: Tournament) => t.isAuctionBased));
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/auction-players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to load players",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamOwners = async () => {
    try {
      const response = await fetch('/api/auction/team-owners');
      if (response.ok) {
        const data = await response.json();
        setTeamOwners(data);
      }
    } catch (error) {
      console.error('Error fetching team owners:', error);
      toast({
        title: "Error",
        description: "Failed to load team owners",
        variant: "destructive"
      });
    }
  };

  const handlePlayerAction = async (playerId: string, action: 'APPROVE' | 'REJECT', basePrice?: number) => {
    try {
      setProcessing(playerId);
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const status = action === 'APPROVE' ? 'AVAILABLE' : 'REJECTED';
      const response = await fetch(`/api/tournaments/${player.tournament.id}/auction-players/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          auctionStatus: status,
          basePrice: basePrice || player.basePrice
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Player ${action.toLowerCase()}ed successfully. Email notification sent.`,
        });
        fetchPlayers();
      } else {
        throw new Error('Failed to update player');
      }
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: "Error",
        description: "Failed to update player status",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleOwnerAction = async (ownerId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setProcessing(ownerId);
      const response = await fetch(`/api/auction/team-owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Team owner ${action.toLowerCase()}ed successfully. Email notification sent.`,
        });
        fetchTeamOwners();
      } else {
        throw new Error('Failed to update team owner');
      }
    } catch (error) {
      console.error('Error updating team owner:', error);
      toast({
        title: "Error",
        description: "Failed to update team owner status",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || player.auctionStatus === statusFilter;
    const matchesTournament = tournamentFilter === 'ALL' || player.tournament.id === tournamentFilter;
    
    return matchesSearch && matchesStatus && matchesTournament;
  });

  const filteredOwners = teamOwners.filter(owner => {
    const matchesSearch = owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || owner.status === statusFilter;
    const matchesTournament = tournamentFilter === 'ALL' || owner.tournament.id === tournamentFilter;
    
    return matchesSearch && matchesStatus && matchesTournament;
  });

  const pendingPlayersCount = players.filter(p => p.auctionStatus === 'PENDING').length;
  const pendingOwnersCount = teamOwners.filter(o => o.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Registration Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve player and team owner registrations for auction tournaments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Players</p>
                <p className="text-2xl font-bold">{pendingPlayersCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Owners</p>
                <p className="text-2xl font-bold">{pendingOwnersCount}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Players</p>
                <p className="text-2xl font-bold">{players.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Owners</p>
                <p className="text-2xl font-bold">{teamOwners.length}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="AVAILABLE">Approved</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tournament Filter</Label>
              <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Tournaments</SelectItem>
                  {tournaments.map(tournament => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Players ({filteredPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="owners" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Team Owners ({filteredOwners.length})
          </TabsTrigger>
        </TabsList>

        {/* Players Tab */}
        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Player Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No players found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{player.name}</h3>
                          {getStatusBadge(player.auctionStatus)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {player.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {player.email}
                            </span>
                          )}
                          {player.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {player.phone}
                            </span>
                          )}
                          {player.position && (
                            <Badge variant="outline">{player.position}</Badge>
                          )}
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Tournament:</span> {player.tournament.name}
                          <span className="ml-4 text-muted-foreground">Base Price:</span> ₹{player.basePrice.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPlayer(player)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Player Details</DialogTitle>
                              <DialogDescription>
                                View detailed information about this registered player.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPlayer && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Name</Label>
                                  <p className="font-medium">{selectedPlayer.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Email</Label>
                                    <p>{selectedPlayer.email || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p>{selectedPlayer.phone || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Position</Label>
                                    <p>{selectedPlayer.position || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label>Experience</Label>
                                    <p>{selectedPlayer.experience || 'N/A'}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label>Base Price</Label>
                                  <p>₹{selectedPlayer.basePrice.toLocaleString()}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {player.auctionStatus === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handlePlayerAction(player.id, 'APPROVE')}
                              disabled={processing === player.id}
                            >
                              {processing === player.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handlePlayerAction(player.id, 'REJECT')}
                              disabled={processing === player.id}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Owners Tab */}
        <TabsContent value="owners">
          <Card>
            <CardHeader>
              <CardTitle>Team Owner Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredOwners.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No team owners found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOwners.map((owner) => (
                    <div key={owner.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{owner.name}</h3>
                          {getStatusBadge(owner.status || 'PENDING')}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {owner.email}
                          </span>
                          {owner.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {owner.phone}
                            </span>
                          )}
                          <Badge variant="outline">Team: {owner.teamName}</Badge>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Tournament:</span> {owner.tournament.name}
                          <span className="ml-4 text-muted-foreground">Budget:</span> ₹{owner.budget.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedOwner(owner)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Team Owner Details</DialogTitle>
                              <DialogDescription>
                                View detailed information about this team owner registration.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedOwner && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Owner Name</Label>
                                  <p className="font-medium">{selectedOwner.name}</p>
                                </div>
                                <div>
                                  <Label>Team Name</Label>
                                  <p className="font-medium">{selectedOwner.teamName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Email</Label>
                                    <p>{selectedOwner.email}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p>{selectedOwner.phone || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Budget</Label>
                                    <p>₹{selectedOwner.budget.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label>Remaining</Label>
                                    <p>₹{selectedOwner.remainingBudget.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {owner.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleOwnerAction(owner.id, 'APPROVE')}
                              disabled={processing === owner.id}
                            >
                              {processing === owner.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOwnerAction(owner.id, 'REJECT')}
                              disabled={processing === owner.id}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Gavel, Users, Award, Mail, DollarSign, Eye, Link, MessageCircle, Copy, ExternalLink } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  basePrice: number;
  soldPrice?: number;
  auctionStatus: string;
  auctionTeam?: {
    name: string;
    ownerName: string;
  };
}

interface TeamOwner {
  id: string;
  teamName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  auctionToken: string;
  verified: boolean;
  totalBudget?: number;
  remainingBudget?: number;
}

interface Tournament {
  id: string;
  name: string;
  auctionDate?: string;
  venue: string;
  totalGroups?: number;
  teamsPerGroup?: number;
  groupNames?: string;
  auctionTeamCount?: number;
  auctionBudget?: number;
  isAuctionBased?: boolean;
}

export default function AdminAuctionPortal() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const { toast } = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamOwners, setTeamOwners] = useState<TeamOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [soldPrice, setSoldPrice] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  
  // Group management states
  const [groups, setGroups] = useState<any[]>([]);
  const [editingGroups, setEditingGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupAssignments, setGroupAssignments] = useState<{[teamId: string]: string}>({});

  useEffect(() => {
    fetchAuctionData();
  }, [tournamentId]);

  useEffect(() => {
    if (tournament) {
      initializeGroups();
    }
  }, [tournament, teamOwners]);

  const initializeGroups = () => {
    if (!tournament) return;
    
    let groupNames = [];
    try {
      groupNames = tournament.groupNames ? JSON.parse(tournament.groupNames) : [];
    } catch (e) {
      groupNames = [];
    }

    // If no groups defined, create default groups
    if (groupNames.length === 0 && tournament.totalGroups) {
      groupNames = Array.from({length: tournament.totalGroups}, (_, i) => `Group ${String.fromCharCode(65 + i)}`);
    }

    const groupsData = groupNames.map((name: string, index: number) => ({
      id: `group-${index}`,
      name,
      teams: []
    }));

    setGroups(groupsData);
  };

  const fetchAuctionData = async () => {
    try {
      setLoading(true);
      
      // Fetch tournament details
      const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
      const tournamentData = await tournamentRes.json();
      // Handle API response format
      const tournament = tournamentData.success ? tournamentData.tournament : tournamentData;
      setTournament(tournament);

      // Fetch auction players
      const playersRes = await fetch(`/api/tournaments/${tournamentId}/auction-players`);
      const playersData = await playersRes.json();
      // Handle API response format
      const playersList = playersData.success ? playersData.players : playersData;
      setPlayers(Array.isArray(playersList) ? playersList : []);

      // Fetch team owners
      const ownersRes = await fetch(`/api/tournaments/${tournamentId}/team-owners`);
      const ownersData = await ownersRes.json();
      // Handle API response format
      const ownersList = ownersData.success ? ownersData.teamOwners : ownersData;
      setTeamOwners(Array.isArray(ownersList) ? ownersList : []);
    } catch (error) {
      console.error('Error fetching auction data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load auction data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSold = async () => {
    if (!selectedPlayer || !soldPrice || !selectedTeam) {
      toast({
        title: 'Error',
        description: 'Please select player, team, and enter sold price',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/auction-players`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          auctionStatus: 'SOLD',
          soldPrice: parseFloat(soldPrice),
          teamOwnerId: selectedTeam,
        }),
      });

      if (response.ok) {
        await fetchAuctionData();
        setSelectedPlayer(null);
        setSoldPrice('');
        setSelectedTeam('');
        toast({
          title: 'Success',
          description: 'Player sold successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update player status',
        variant: 'destructive',
      });
    }
  };

  const handlePlayerUnsold = async (playerId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/auction-players`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          auctionStatus: 'UNSOLD',
        }),
      });

      if (response.ok) {
        await fetchAuctionData();
        toast({
          title: 'Success',
          description: 'Player marked as unsold',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update player status',
        variant: 'destructive',
      });
    }
  };

  const sendAuctionCompletionNotifications = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/auction-notifications`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Auction completion notifications sent to all players and owners',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send notifications',
        variant: 'destructive',
      });
    }
  };

  const copyOwnerAuctionLink = (owner: TeamOwner) => {
    const link = `${window.location.origin}/auction/${tournamentId}/owner?token=${owner.auctionToken}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied',
      description: `Auction link for ${owner.teamName} copied to clipboard`,
    });
  };

  // WhatsApp sharing functions (completely FREE!)
  const shareOnWhatsApp = (phone: string, message: string) => {
    // Remove all non-numeric characters and ensure country code
    const cleanPhone = phone.replace(/\D/g, '')
    let whatsappPhone = cleanPhone
    
    // Add +91 for Indian numbers if not already present
    if (cleanPhone.length === 10) {
      whatsappPhone = '91' + cleanPhone
    } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      whatsappPhone = cleanPhone
    }
    
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`
    
    // Open WhatsApp Web/App
    window.open(whatsappUrl, '_blank')
  }

  const shareAuctionLinkOnWhatsApp = (owner: TeamOwner) => {
    if (!tournament) return
    
    const auctionUrl = `${window.location.origin}/auction/${tournamentId}/owner?token=${owner.auctionToken}`
    
    const message = `🏏 *${tournament.name}* - Auction Portal Access

Hello ${owner.ownerName}! 

Your team "${owner.teamName}" has been approved for the auction! 🎉

🔗 *Your Auction Link:*
${auctionUrl}

⚡ *How to Access:*
1. Click the link above
2. Start bidding for your players
3. Build your dream team!

📅 *Auction Details:*
• Tournament: ${tournament.name}
• Team: ${owner.teamName}
• Budget: ₹${owner.totalBudget || tournament.auctionBudget || 30000}

Good luck with your bidding! 🏆

_Tunda Sports Club_`

    shareOnWhatsApp(owner.ownerPhone || '', message)
  }

  const copyAuctionLink = async (owner: TeamOwner) => {
    if (!tournament) return
    
    const auctionUrl = `${window.location.origin}/auction/${tournamentId}/owner?token=${owner.auctionToken}`
    
    try {
      await navigator.clipboard.writeText(auctionUrl)
      toast({
        title: "Link Copied!",
        description: `Auction link for ${owner.teamName} copied to clipboard`,
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = auctionUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      toast({
        title: "Link Copied!",
        description: `Auction link for ${owner.teamName} copied to clipboard`,
      })
    }
  }

  // Group management functions
  const createNewGroup = async () => {
    if (!newGroupName.trim() || !tournament) return;
    
    try {
      const updatedGroups = [...groups, { 
        id: `group-${groups.length}`, 
        name: newGroupName.trim(), 
        teams: [] 
      }];
      
      const groupNames = updatedGroups.map(g => g.name);
      
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groupNames: JSON.stringify(groupNames),
          totalGroups: groupNames.length
        })
      });

      if (response.ok) {
        setGroups(updatedGroups);
        setNewGroupName('');
        toast({
          title: 'Success',
          description: 'Group created successfully'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive'
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    
    try {
      const updatedGroups = groups.filter(g => g.id !== groupId);
      const groupNames = updatedGroups.map(g => g.name);
      
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groupNames: JSON.stringify(groupNames),
          totalGroups: groupNames.length
        })
      });

      if (response.ok) {
        setGroups(updatedGroups);
        toast({
          title: 'Success',
          description: 'Group deleted successfully'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive'
      });
    }
  };

  const assignTeamToGroup = async (teamId: string, groupId: string) => {
    try {
      // Here you would update the team's group assignment in the database
      // For now, we'll update local state
      setGroupAssignments(prev => ({...prev, [teamId]: groupId}));
      
      toast({
        title: 'Success',
        description: 'Team assigned to group successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign team to group',
        variant: 'destructive'
      });
    }
  };

  const autoAssignTeamsToGroups = () => {
    if (groups.length === 0 || teamOwners.length === 0) return;
    
    const assignments: {[teamId: string]: string} = {};
    const teamsPerGroup = Math.ceil(teamOwners.length / groups.length);
    
    teamOwners.forEach((team, index) => {
      const groupIndex = Math.floor(index / teamsPerGroup);
      const groupId = groups[groupIndex]?.id || groups[0].id;
      assignments[team.id] = groupId;
    });
    
    setGroupAssignments(assignments);
    toast({
      title: 'Success',
      description: 'Teams auto-assigned to groups'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 md:h-32 md:w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-sm md:text-base">Loading auction portal...</p>
        </div>
      </div>
    );
  }

  const soldPlayers = Array.isArray(players) ? players.filter(p => p.auctionStatus === 'SOLD') : [];
  const unsoldPlayers = Array.isArray(players) ? players.filter(p => p.auctionStatus === 'UNSOLD') : [];
  const pendingPlayers = Array.isArray(players) ? players.filter(p => p.auctionStatus === 'PENDING') : [];

  return (
    <div className="container mx-auto p-4 space-y-4 md:space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 md:p-6 rounded-lg">
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <Gavel className="h-6 w-6 md:h-8 md:w-8" />
          <h1 className="text-lg md:text-2xl font-bold">Admin Auction Portal</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm md:text-base">{tournament?.name}</p>
        {tournament?.auctionDate && (
          <p className="text-primary-foreground/80 text-sm md:text-base">
            Auction Date: {new Date(tournament.auctionDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
            <p className="text-xl md:text-2xl font-bold">{players.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Players</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Award className="h-6 w-6 md:h-8 md:w-8 text-green-600 mx-auto mb-2" />
            <p className="text-xl md:text-2xl font-bold">{soldPlayers.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-red-600 mx-auto mb-2" />
            <p className="text-xl md:text-2xl font-bold">{unsoldPlayers.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Unsold</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Eye className="h-6 w-6 md:h-8 md:w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-xl md:text-2xl font-bold">{pendingPlayers.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Auction Links */}
      {teamOwners.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Link className="h-5 w-5" />
              Quick Auction Access
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {teamOwners.filter(owner => owner.verified && owner.auctionToken).map((owner) => (
                <div key={owner.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{owner.teamName}</p>
                    <p className="text-xs text-muted-foreground truncate">{owner.ownerName}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyAuctionLink(owner)}
                      className="h-8 w-8 p-0"
                      title="Copy Link"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {owner.ownerPhone && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => shareAuctionLinkOnWhatsApp(owner)}
                        className="h-8 w-8 p-0"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(`/auction/${tournamentId}/owner?token=${owner.auctionToken}`, '_blank')}
                      className="h-8 w-8 p-0"
                      title="Open Portal"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {teamOwners.filter(owner => owner.verified && owner.auctionToken).length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                No verified team owners found. Team owners need to be verified to access auction links.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 text-xs md:text-sm">
          <TabsTrigger value="pending" className="px-2 py-1 md:px-3 md:py-2">
            <span className="hidden sm:inline">Pending </span>({pendingPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="sold" className="px-2 py-1 md:px-3 md:py-2">
            <span className="hidden sm:inline">Sold </span>({soldPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="unsold" className="px-2 py-1 md:px-3 md:py-2">
            <span className="hidden sm:inline">Unsold </span>({unsoldPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="owners" className="px-2 py-1 md:px-3 md:py-2">
            <span className="hidden md:inline">Team </span>Owners
          </TabsTrigger>
          <TabsTrigger value="groups" className="px-2 py-1 md:px-3 md:py-2">
            <span className="hidden md:inline">Groups &amp; </span>Teams
          </TabsTrigger>
        </TabsList>

        {/* Pending Players */}
        <TabsContent value="pending" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-base md:text-lg font-semibold">Players Available for Auction</h3>
            {selectedPlayer && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Input
                  type="number"
                  placeholder="Sold price"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  className="w-full sm:w-32 text-sm"
                />
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="">Select Team</option>
                  {teamOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.teamName}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button onClick={handlePlayerSold} size="sm">Mark as Sold</Button>
                  <Button variant="outline" onClick={() => setSelectedPlayer(null)} size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {pendingPlayers.map((player) => (
              <Card key={player.id} className={selectedPlayer?.id === player.id ? "border-primary border-2" : ""}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm md:text-base truncate pr-2">{player.name}</h4>
                    <Badge variant="secondary" className="text-xs">{player.position}</Badge>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2">Age: {player.age}</p>
                  <p className="text-xs md:text-sm font-medium mb-3">Base Price: ₹{player.basePrice.toLocaleString()}</p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedPlayer?.id === player.id ? "default" : "outline"}
                      onClick={() => setSelectedPlayer(player)}
                      className="flex-1 text-xs"
                    >
                      Select
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handlePlayerUnsold(player.id)}
                      className="text-xs"
                    >
                      Unsold
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sold Players */}
        <TabsContent value="sold" className="space-y-4">
          <h3 className="text-base md:text-lg font-semibold">Sold Players</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {soldPlayers.map((player) => (
              <Card key={player.id}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm md:text-base truncate pr-2">{player.name}</h4>
                    <Badge variant="default" className="text-xs">SOLD</Badge>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1 truncate">Team: {player.auctionTeam?.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2 truncate">Owner: {player.auctionTeam?.ownerName}</p>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span>Base: ₹{player.basePrice.toLocaleString()}</span>
                    <span className="font-bold text-green-600">Sold: ₹{player.soldPrice?.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Unsold Players */}
        <TabsContent value="unsold" className="space-y-4">
          <h3 className="text-base md:text-lg font-semibold">Unsold Players</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {unsoldPlayers.map((player) => (
              <Card key={player.id}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm md:text-base truncate pr-2">{player.name}</h4>
                    <Badge variant="destructive" className="text-xs">UNSOLD</Badge>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2">Base Price: ₹{player.basePrice.toLocaleString()}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPlayer(player)}
                    className="w-full text-xs"
                  >
                    Move to Auction
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Team Owners */}
        <TabsContent value="owners" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-base md:text-lg font-semibold">Team Owners &amp; Auction Links</h3>
            <Button onClick={sendAuctionCompletionNotifications} className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Send Completion </span>Notifications
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {teamOwners.map((owner) => (
              <Card key={owner.id}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm md:text-base truncate">{owner.teamName}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{owner.ownerName}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{owner.ownerEmail}</p>
                      {owner.ownerPhone && (
                        <p className="text-xs md:text-sm text-muted-foreground truncate">📞 {owner.ownerPhone}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      <Badge variant={owner.verified ? "default" : "secondary"} className="text-xs">
                        {owner.verified ? "✅ Auction Ready" : "Pending"}
                      </Badge>
                      {owner.verified && (
                        <Badge variant="outline" className="text-xs">
                          Budget: ₹{(owner.totalBudget || tournament?.auctionBudget || 30000).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {owner.verified && owner.auctionToken && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAuctionLink(owner)}
                          className="flex items-center gap-1 flex-1 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                          Copy Link
                        </Button>
                        
                        {owner.ownerPhone && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => shareAuctionLinkOnWhatsApp(owner)}
                            className="flex items-center gap-1 flex-1 text-xs"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(`/auction/${tournamentId}/owner?token=${owner.auctionToken}`, '_blank')}
                        className="flex items-center gap-1 w-full text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open Portal
                      </Button>
                    </div>
                  )}
                  
                  {!owner.verified && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Owner needs to be verified to access auction
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Groups & Teams */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-base md:text-lg font-semibold">Tournament Groups &amp; Team Management</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={autoAssignTeamsToGroups} variant="outline" size="sm" className="text-xs">
                Auto Assign Teams
              </Button>
              <Button onClick={() => setEditingGroups(!editingGroups)} size="sm" className="text-xs">
                {editingGroups ? 'Finish Editing' : 'Edit Groups'}
              </Button>
            </div>
          </div>

          {/* Tournament Info */}
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">Total Teams</p>
                  <p className="text-lg md:text-xl font-bold">{teamOwners.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">Total Groups</p>
                  <p className="text-lg md:text-xl font-bold">{groups.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">Teams Per Group</p>
                  <p className="text-lg md:text-xl font-bold">{tournament?.teamsPerGroup || Math.ceil(teamOwners.length / groups.length)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">Auction Budget</p>
                  <p className="text-lg md:text-xl font-bold">₹{tournament?.auctionBudget?.toLocaleString() || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create New Group */}
          {editingGroups && (
            <Card>
              <CardContent className="p-3 md:p-4">
                <h4 className="font-semibold mb-3 text-sm md:text-base">Create New Group</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Group name (e.g., Group A)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <Button onClick={createNewGroup} size="sm" className="text-xs">Add Group</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Groups Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base md:text-lg truncate pr-2">{group.name}</CardTitle>
                    {editingGroups && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteGroup(group.id)}
                        className="text-xs"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xs md:text-sm text-muted-foreground mb-3">
                      Teams: {teamOwners.filter(team => groupAssignments[team.id] === group.id).length}
                    </p>
                    
                    {/* Teams in this group */}
                    <div className="space-y-1">
                      {teamOwners.filter(team => groupAssignments[team.id] === group.id).map((team) => (
                        <div key={team.id} className="flex justify-between items-center p-2 bg-muted rounded text-xs md:text-sm">
                          <span className="font-medium truncate pr-2">{team.teamName}</span>
                          {editingGroups && (
                            <select
                              value={groupAssignments[team.id] || ''}
                              onChange={(e) => assignTeamToGroup(team.id, e.target.value)}
                              className="text-xs px-2 py-1 border rounded bg-background"
                            >
                              <option value="">No Group</option>
                              {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Unassigned teams for this group */}
                    {editingGroups && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Unassigned Teams:</p>
                        <div className="space-y-1">
                          {teamOwners.filter(team => !groupAssignments[team.id]).map((team) => (
                            <div key={team.id} className="flex justify-between items-center">
                              <span className="text-xs truncate pr-2">{team.teamName}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => assignTeamToGroup(team.id, group.id)}
                                className="text-xs px-2 py-1 h-auto"
                              >
                                Assign
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Unassigned Teams */}
          {teamOwners.filter(team => !groupAssignments[team.id]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Unassigned Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                  {teamOwners.filter(team => !groupAssignments[team.id]).map((team) => (
                    <div key={team.id} className="flex justify-between items-center p-3 border rounded">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm md:text-base truncate">{team.teamName}</p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{team.ownerName}</p>
                      </div>
                      {editingGroups && groups.length > 0 && (
                        <select
                          onChange={(e) => assignTeamToGroup(team.id, e.target.value)}
                          className="text-xs md:text-sm px-2 py-1 border rounded bg-background ml-2"
                        >
                          <option value="">Select Group</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

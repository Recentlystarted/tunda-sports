"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Gavel, 
  Calendar, 
  Users, 
  Settings, 
  Clock, 
  Play, 
  AlertCircle, 
  Target,
  Crown,
  Shield,
  Timer,
  Trophy,
  Search,
  Eye,
  UserCheck
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  isAuctionBased: boolean;
  totalGroups: number;
  teamsPerGroup: number;
  auctionDate: string | null;
  auctionBudget: number | null;
  venue: string;
  startDate: string;
  status: string;
  _count: {
    auctionPlayers: number;
    teamOwners: number;
  };
}

interface Player {
  id: string;
  name: string;
  auctionStatus: string;
  basePrice: number;
  soldPrice?: number;
}

interface TeamOwner {
  id: string;
  ownerName: string;
  teamName: string;
  verified: boolean;
  auctionToken: string | null;
}

export default function AuctionManagementPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, searchTerm, statusFilter]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tournaments?includeAuctionStats=true');
      if (response.ok) {
        const data = await response.json();
        // Handle API response format
        const tournamentsList = data.success ? data.tournaments : data;
        // Filter only auction-based tournaments
        const auctionTournaments = Array.isArray(tournamentsList) 
          ? tournamentsList.filter((t: Tournament) => t.isAuctionBased)
          : [];
        setTournaments(auctionTournaments);
      } else {
        throw new Error('Failed to fetch tournaments');
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load auction tournaments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTournaments = () => {
    let filtered = tournaments;

    if (searchTerm) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.status === statusFilter);
    }

    setFilteredTournaments(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auction tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.PNG" 
            alt="Tunda Sports Club" 
            className="h-8 w-auto"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Auction Management
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage auction tournaments, players, and team owners
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{tournaments.length}</p>
            <p className="text-sm text-gray-600">Total Auctions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {tournaments.reduce((sum, t) => sum + (t._count?.auctionPlayers || 0), 0)}
            </p>
            <p className="text-sm text-gray-600">Total Players</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {tournaments.reduce((sum, t) => sum + (t._count?.teamOwners || 0), 0)}
            </p>
            <p className="text-sm text-gray-600">Team Owners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {tournaments.filter(t => t.status === 'active').length}
            </p>
            <p className="text-sm text-gray-600">Active Auctions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Auction Tournaments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Tournaments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by tournament name or venue..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tournament List */}
          <div className="space-y-4">
            {filteredTournaments.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Auction Tournaments Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? "No tournaments match your search criteria" 
                    : "No auction tournaments have been created yet"
                  }
                </p>
                <Link href="/admin/tournaments/create">
                  <Button>
                    <Trophy className="h-4 w-4 mr-2" />
                    Create Auction Tournament
                  </Button>
                </Link>
              </div>
            ) : (
              filteredTournaments.map((tournament) => (
                <Card key={tournament.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Tournament Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{tournament.name}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`${getStatusColor(tournament.status)} text-white`}
                          >
                            {tournament.status}
                          </Badge>
                          <Badge variant="outline" className="border-purple-200 text-purple-700">
                            🎯 Auction
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p className="font-medium text-foreground">Venue</p>
                            <p>{tournament.venue}</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Start Date</p>
                            <p>{formatDate(tournament.startDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Auction Date</p>
                            <p>{tournament.auctionDate ? formatDate(tournament.auctionDate) : 'TBD'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Budget/Team</p>
                            <p>{tournament.auctionBudget ? formatCurrency(tournament.auctionBudget) : 'TBD'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mt-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span>{tournament._count?.auctionPlayers || 0} Players</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Crown className="h-4 w-4 text-purple-600" />
                            <span>{tournament._count?.teamOwners || 0} Team Owners</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-green-600" />
                            <span>{tournament.totalGroups} Groups</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/auction/${tournament.id}/admin`}>
                          <Button variant="default" size="sm">
                            <Target className="h-4 w-4 mr-1" />
                            Auction Portal
                          </Button>
                        </Link>
                        <Link href={`/admin/auction-players?tournament=${tournament.id}`}>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-1" />
                            Players
                          </Button>
                        </Link>
                        <Link href={`/admin/registrations-new?tournament=${tournament.id}&tab=owners`}>
                          <Button variant="outline" size="sm">
                            <Crown className="h-4 w-4 mr-1" />
                            Owners
                          </Button>
                        </Link>
                        <Link href={`/tournament/${tournament.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/tournaments/create" className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Create Auction Tournament</h3>
                  <p className="text-sm text-muted-foreground">Set up a new auction-based tournament</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/auction-players" className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Manage Players</h3>
                  <p className="text-sm text-muted-foreground">View and approve auction player registrations</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/registrations-new" className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <UserCheck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Registration Hub</h3>
                  <p className="text-sm text-muted-foreground">Manage all tournament registrations</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

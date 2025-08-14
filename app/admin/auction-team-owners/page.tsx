"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  Users, 
  IndianRupee, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Check,
  X,
  Mail,
  Phone
} from 'lucide-react';

interface TeamOwner {
  id: string;
  teamName: string;
  teamIndex: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerCity?: string;
  sponsorName?: string;
  verified: boolean;
  entryFeePaid: boolean;
  auctionToken?: string;
  tournamentId: string;
  tournament: {
    id: string;
    name: string;
    teamEntryFee?: number;
  };
  createdAt: string;
}

export default function AuctionTeamOwnersPage() {
  const { toast } = useToast();
  const [owners, setOwners] = useState<TeamOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tournamentFilter, setTournamentFilter] = useState<string>('');
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    fetchTournaments();
    // Restore tournament filter from localStorage on page load
    const savedTournament = localStorage.getItem('admin-auction-team-owners-tournament');
    if (savedTournament && savedTournament !== 'ALL') {
      setTournamentFilter(savedTournament);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
    // Save tournament filter to localStorage when changed
    if (tournamentFilter && tournamentFilter !== 'ALL') {
      localStorage.setItem('admin-auction-team-owners-tournament', tournamentFilter);
    }
  }, [tournamentFilter]);

  const fetchOwners = async () => {
    try {
      // If no tournament filter selected, don't fetch owners
      if (!tournamentFilter) {
        setOwners([]);
        return;
      }
      
      const response = await fetch(`/api/tournaments/${tournamentFilter}/team-owners`);
      if (!response.ok) throw new Error('Failed to fetch team owners');
      
      const data = await response.json();
      // Handle API response format
      const ownersList = data.success ? data.teamOwners : data;
      setOwners(Array.isArray(ownersList) ? ownersList : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load team owners",
        variant: "destructive"
      });
      setOwners([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments?format=AUCTION');
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      
      const data = await response.json();
      // Handle API response format
      const tournamentsList = data.success ? data.tournaments : data;
      // Ensure it's an array and filter only auction-based tournaments
      const auctionTournaments = Array.isArray(tournamentsList) 
        ? tournamentsList.filter((t: any) => t.isAuctionBased)
        : [];
      setTournaments(auctionTournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]); // Set empty array on error
    }
  };

  const handleStatusUpdate = async (ownerId: string, action: 'VERIFY' | 'REJECT') => {
    const actionId = `owner-${ownerId}-${action}`;
    setActionLoading(actionId);
    
    try {
      // If no tournament selected, show error
      if (!tournamentFilter) {
        throw new Error('Please select a specific tournament first');
      }
      
      const response = await fetch(`/api/tournaments/${tournamentFilter}/team-owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: "Success",
        description: `Team owner ${action === 'VERIFY' ? 'verified' : 'unverified'} successfully. Email notification sent.`
      });

      fetchOwners(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update team owner status",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePaymentUpdate = async (ownerId: string, action: 'MARK_PAID' | 'UNMARK_PAID') => {
    const actionId = `owner-${ownerId}-${action}`;
    setActionLoading(actionId);
    
    try {
      // If no tournament selected, show error
      if (!tournamentFilter) {
        throw new Error('Please select a specific tournament first');
      }
      
      const response = await fetch(`/api/tournaments/${tournamentFilter}/team-owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) throw new Error('Failed to update payment status');

      toast({
        title: "Success",
        description: `Payment status updated successfully. Email notification sent.`
      });

      fetchOwners(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment status",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (ownerId: string) => {
    if (!confirm('Are you sure you want to delete this team owner registration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/auction/team-owners/${ownerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete team owner');

      toast({
        title: "Success",
        description: "Team owner deleted successfully"
      });

      fetchOwners(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team owner",
        variant: "destructive"
      });
    }
  };

  const filteredOwners = owners.filter(owner => {
    const matchesSearch = owner.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'VERIFIED' && owner.verified) ||
                         (statusFilter === 'PENDING' && !owner.verified) ||
                         (statusFilter === 'PAID' && owner.entryFeePaid);
    
    const matchesTournament = tournamentFilter === 'ALL' || owner.tournamentId === tournamentFilter;
    
    return matchesSearch && matchesStatus && matchesTournament;
  });

  const getStatusBadge = (verified: boolean, entryFeePaid: boolean) => {
    if (verified && entryFeePaid) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Verified & Paid</Badge>;
    } else if (verified) {
      return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">Verified</Badge>;
    } else {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team owners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auction Team Owners</h1>
          <p className="text-gray-600 mt-2">Manage team owner registrations for auction tournaments</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tournament">Tournament</Label>
              <Select value={tournamentFilter || ""} onValueChange={setTournamentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Tournament" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(tournaments) && tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchOwners} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Crown className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Owners</p>
                <p className="text-lg md:text-2xl font-bold">{owners.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Check className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-lg md:text-2xl font-bold">{owners.filter(o => o.verified).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <X className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-lg md:text-2xl font-bold">{owners.filter(o => !o.verified).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IndianRupee className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Payment Complete</p>
                <p className="text-lg md:text-2xl font-bold">
                  {owners.filter(o => o.entryFeePaid).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Owners List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Owners ({filteredOwners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOwners.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="mx-auto h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">No team owners found</h3>
              <p className="text-sm md:text-base text-muted-foreground">No team owners match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-0">
              {/* Mobile Cards - visible on small screens */}
              <div className="md:hidden space-y-4">
                {filteredOwners.map((owner) => (
                  <Card key={owner.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{owner.ownerName}</div>
                          <div className="text-xs text-muted-foreground">{owner.teamName}</div>
                        </div>
                        {getStatusBadge(owner.verified, owner.entryFeePaid)}
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{owner.ownerEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{owner.ownerPhone}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {!owner.verified ? (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(owner.id, 'VERIFY')}
                            className="flex-1 h-8 text-xs"
                            disabled={actionLoading === `owner-${owner.id}-VERIFY`}
                          >
                            {actionLoading === `owner-${owner.id}-VERIFY` ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Verify
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(owner.id, 'REJECT')}
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            disabled={actionLoading === `owner-${owner.id}-REJECT`}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Unverify
                          </Button>
                        )}
                        
                        {!owner.entryFeePaid ? (
                          <Button
                            size="sm"
                            onClick={() => handlePaymentUpdate(owner.id, 'MARK_PAID')}
                            variant="secondary"
                            className="flex-1 h-8 text-xs"
                            disabled={actionLoading === `owner-${owner.id}-MARK_PAID`}
                          >
                            <IndianRupee className="h-3 w-3 mr-1" />
                            Mark Paid
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handlePaymentUpdate(owner.id, 'UNMARK_PAID')}
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            disabled={actionLoading === `owner-${owner.id}-UNMARK_PAID`}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Unmark
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table - hidden on small screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Owner</th>
                      <th className="text-left py-3 px-4">Team</th>
                      <th className="text-left py-3 px-4">Tournament</th>
                      <th className="text-left py-3 px-4">Budget</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOwners.map((owner) => (
                      <tr key={owner.id} className="border-b hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium">{owner.ownerName}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              <span className="truncate">{owner.ownerEmail}</span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {owner.ownerPhone}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium">{owner.teamName} - {owner.ownerCity || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            Team #{owner.teamIndex}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">{owner.tournament.name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium">₹{owner.tournament.teamEntryFee?.toLocaleString() || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {owner.entryFeePaid ? 'Paid' : 'Pending Payment'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(owner.verified, owner.entryFeePaid)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {new Date(owner.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col space-y-2">
                            {/* Verification Actions */}
                            <div className="flex space-x-2">
                              {!owner.verified ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(owner.id, 'VERIFY')}
                                  disabled={actionLoading === `owner-${owner.id}-VERIFY`}
                                >
                                  {actionLoading === `owner-${owner.id}-VERIFY` ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                      Verifying...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Verify
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(owner.id, 'REJECT')}
                                  variant="outline"
                                  disabled={actionLoading === `owner-${owner.id}-REJECT`}
                                >
                                  {actionLoading === `owner-${owner.id}-REJECT` ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-3 w-3 mr-1" />
                                      Unverify
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                            
                            {/* Payment Actions */}
                            <div className="flex space-x-2">
                              {!owner.entryFeePaid ? (
                                <Button
                                  size="sm"
                                  onClick={() => handlePaymentUpdate(owner.id, 'MARK_PAID')}
                                  variant="secondary"
                                  disabled={actionLoading === `owner-${owner.id}-MARK_PAID`}
                                >
                                  {actionLoading === `owner-${owner.id}-MARK_PAID` ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                      Marking Paid...
                                    </>
                                  ) : (
                                    <>
                                      <IndianRupee className="h-3 w-3 mr-1" />
                                      Mark Paid
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handlePaymentUpdate(owner.id, 'UNMARK_PAID')}
                                  variant="outline"
                                  disabled={actionLoading === `owner-${owner.id}-UNMARK_PAID`}
                                >
                                  {actionLoading === `owner-${owner.id}-UNMARK_PAID` ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                                      Unmarking...
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-3 w-3 mr-1" />
                                      Unmark Paid
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(owner.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

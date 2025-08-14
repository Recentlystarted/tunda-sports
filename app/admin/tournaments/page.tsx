"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Users,
  Search,
  Filter,
  Share2,
  Eye,
  Zap,
  DollarSign
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Tournament {
  id: string;
  name: string;
  format: string;
  status: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  registeredTeams: number;
  venue: string;
  description: string;
  totalPrizePool: number;
  entryFee: number;
  isAuctionBased?: boolean;
  totalGroups?: number;
  teamsPerGroup?: number;
  registeredPlayers?: number;
  // New IPL-style auction fields
  auctionTeamCount?: number;
  auctionTeamNames?: string;
  groupsOptional?: boolean;
  pointsBased?: boolean;
  playerPoolSize?: number;
  minPlayersPerTeam?: number;
  maxPlayersPerTeam?: number;
  retentionAllowed?: boolean;
  tradingEnabled?: boolean;
  playerEntryFee?: number;
}

export default function TournamentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTournaments();
  }, []);
  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/tournaments");
      if (response.ok) {
        const data = await response.json();
        // Handle both formats: direct array or object with tournaments property
        const tournamentsData = data.success ? data.tournaments : (Array.isArray(data) ? data : []);
        
        // Transform the data to map _count.registrations to registeredTeams and _count.auctionPlayers to registeredPlayers
        const transformedTournaments = tournamentsData.map((tournament: any) => ({
          ...tournament,
          registeredTeams: tournament._count?.registrations || 0,
          registeredPlayers: tournament._count?.auctionPlayers || 0
        }));
        
        setTournaments(transformedTournaments || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tournaments",
          variant: "destructive",
        });
        setTournaments([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the deleted tournament from the local state immediately
        setTournaments(prevTournaments => 
          prevTournaments.filter(tournament => tournament.id !== id)
        );
        
        toast({
          title: "Success",
          description: "Tournament deleted successfully",
        });
        
        // Optional: Refresh the data from server to ensure consistency
        // fetchTournaments();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete tournament",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive",
      });
    }
  };

  const handleAutoArrangeMatches = async (tournamentId: string, tournamentName: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/auto-arrange`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message || "Matches arranged successfully",
        });
        
        // Optionally redirect to matches page
        router.push(`/admin/matches?tournament=${tournamentId}`);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to arrange matches",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to arrange matches",
        variant: "destructive",
      });
    }
  };

  const generateOwnerLink = async (tournamentId: string, ownerId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/team-owner-verification`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamOwnerId: ownerId })
      });

      const data = await response.json();
      
      if (data.success) {
        navigator.clipboard.writeText(data.verificationUrl);
        toast({
          title: "Link Copied!",
          description: "Team owner verification link copied to clipboard",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate owner link",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      UPCOMING: { variant: "secondary" as const, label: "Upcoming" },
      ONGOING: { variant: "default" as const, label: "Ongoing" },
      COMPLETED: { variant: "outline" as const, label: "Completed" },
      CANCELLED: { variant: "destructive" as const, label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UPCOMING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stripHtmlTags = (html: string) => {
    if (!html) return "";
    // Remove HTML tags and decode HTML entities
    return html
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&lt;/g, "<") // Replace &lt; with <
      .replace(/&gt;/g, ">") // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim(); // Remove leading/trailing whitespace
  };const filteredTournaments = (tournaments || []).filter(tournament =>
    tournament?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament?.format?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tournament?.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground text-sm md:text-base">Manage cricket tournaments and competitions</p>
        </div>
        <Button onClick={() => router.push("/admin/tournaments/create")} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      {/* Payment Management Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Payment Management</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Each tournament has its own payment settings. Click the <strong>"Payment"</strong> button on any tournament card to:
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1 ml-4">
                <li>• Set up tournament-specific payment methods</li>
                <li>• Generate custom QR codes with tournament details</li>
                <li>• Configure different fees for players vs team owners</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredTournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-8 w-8 text-primary" />
                  {tournament.isAuctionBased && (
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 border-orange-500/30">
                      🎯 Auction
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-2">
                  {getStatusBadge(tournament.status)}
                </div>
              </div>              <CardTitle className="line-clamp-2">{tournament.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {stripHtmlTags(tournament.description)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Format</p>
                  <p className="font-medium">{tournament.format}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Venue</p>
                  <p className="font-medium">{tournament.venue}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {tournament.isAuctionBased ? 'Players' : 'Teams'}
                  </p>
                  <p className="font-medium">
                    {tournament.isAuctionBased 
                      ? `${tournament.registeredPlayers || 0} registered`
                      : `${tournament.registeredTeams}/${tournament.maxTeams}`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dates</p>
                  <p className="font-medium text-xs">
                    {new Date(tournament.startDate).toLocaleDateString()} - 
                    {new Date(tournament.endDate).toLocaleDateString()}
                  </p>
                </div>
                {tournament.isAuctionBased && tournament.totalGroups && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Groups</p>
                      <p className="font-medium">{tournament.totalGroups} groups</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Teams/Group</p>
                      <p className="font-medium">{tournament.teamsPerGroup} teams</p>
                    </div>
                  </>
                )}
              </div>

              {/* Actions - Mobile Responsive Grid */}
              <div className="space-y-2">
                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/admin/tournaments/${tournament.id}`)}
                    className="text-xs h-8"
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/registrations-new?tournament=${tournament.id}`)}
                    className="text-xs h-8"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/tournament/${tournament.id}`, '_blank')}
                    className="text-xs h-8"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Public
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/tournament/${tournament.id}`;
                      const text = `🏏 ${tournament.name}\n\n📅 ${new Date(tournament.startDate).toLocaleDateString('en-IN')}\n📍 ${tournament.venue}\n💰 Prize Pool: ₹${tournament.totalPrizePool}\n\n${tournament.isAuctionBased ? 'Register as a player for auction!' : 'Register now!'}`;
                      const registrationUrl = tournament.isAuctionBased ? '/auction-registration' : url;
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + "\n\n" + window.location.origin + registrationUrl)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="text-xs h-8"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/tournaments/${tournament.id}/payment`)}
                    className="text-xs h-8"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    Payment
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/tournaments/${tournament.id}/edit`)}
                    className="text-xs h-8"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>

                {/* Auction Specific Actions */}
                {tournament.isAuctionBased && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/auction-players?tournament=${tournament.id}`)}
                    className="w-full text-xs h-8 border-primary/30 hover:bg-primary/10"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Manage Players
                  </Button>
                )}
                
                {/* Auto-arrange matches button */}
                {((tournament.isAuctionBased && (tournament.registeredPlayers || 0) >= (tournament.minPlayersPerTeam || 8)) || 
                  (!tournament.isAuctionBased && tournament.registeredTeams >= 2)) && 
                 ['LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT', 'ROUND_ROBIN', 'VILLAGE_CHAMPIONSHIP', 'INTER_VILLAGE', 'AUCTION_BASED_GROUPS', 'AUCTION_BASED_FIXED_TEAMS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(tournament.format) && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAutoArrangeMatches(tournament.id, tournament.name)}
                    className="w-full text-xs h-8"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Auto-arrange Matches
                  </Button>
                )}

                {/* Delete Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full text-xs h-8"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Tournament
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        tournament "{tournament.name}" and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(tournament.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Tournament
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTournaments.length === 0 && (
        <Card className="text-center py-16">
          <CardContent>
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tournaments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search criteria" : "Get started by creating your first tournament"}
            </p>
            <Button onClick={() => router.push("/admin/tournaments/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tournament
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

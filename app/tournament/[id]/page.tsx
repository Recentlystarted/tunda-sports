"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Calendar, 
  Users, 
  MapPin, 
  User, 
  Award, 
  ExternalLink, 
  Download,
  Copy,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TournamentPosterGenerator from "@/components/TournamentPosterGenerator";

interface Tournament {
  id: string;
  name: string;
  description: string;
  format: string;
  customFormat?: string;
  status: string;
  venue: string;
  venueAddress?: string;
  customMapsLink?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxTeams: number;
  entryFee: number;
  totalPrizePool: number;
  ageLimit?: string;
  teamSize: number;
  substitutes: number;
  rules?: string;
  organizers?: string;
  winners?: string;
  otherPrizes?: string;
  overs?: number;
  competitionType?: string;
  isAuctionBased?: boolean;
  requireTeamOwners?: boolean;
  playerTradingAllowed?: boolean;
  retentionAllowed?: boolean;
  _count?: {
    registrations: number;
  };
}

export default function PublicTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPosterGenerator, setShowPosterGenerator] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchTournamentData();
    }
  }, [params.id]);

  const fetchTournamentData = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTournament(data.tournament || data);
      } else {
        toast({
          title: "Error",
          description: "Tournament not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tournament",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'UPCOMING': { label: 'Upcoming', className: 'bg-blue-500 hover:bg-blue-600' },
      'REGISTRATION_OPEN': { label: 'Registration Open', className: 'bg-green-500 hover:bg-green-600' },
      'REGISTRATION_CLOSED': { label: 'Registration Closed', className: 'bg-orange-500 hover:bg-orange-600' },
      'ONGOING': { label: 'Ongoing', className: 'bg-purple-500 hover:bg-purple-600' },
      'COMPLETED': { label: 'Completed', className: 'bg-gray-500 hover:bg-gray-600' },
      'CANCELLED': { label: 'Cancelled', className: 'bg-red-500 hover:bg-red-600' },
      'POSTPONED': { label: 'Postponed', className: 'bg-yellow-500 hover:bg-yellow-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, className: 'bg-gray-500 hover:bg-gray-600' };

    return (
      <Badge className={`${config.className} text-white font-semibold px-3 py-1 text-sm`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseJsonField = (jsonString?: string) => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  const shareOnWhatsApp = () => {
    if (!tournament) return;
    const url = window.location.href;
    const text = `🏏 ${tournament.name}\n\n📅 ${formatDate(tournament.startDate)}\n📍 ${tournament.venue}\n💰 Prize Pool: ₹${tournament.totalPrizePool}\n\nRegister now!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + "\n\n" + url)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Tournament link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };
  const downloadPoster = () => {
    setShowPosterGenerator(true);
  };

  const isAuctionTournament = () => {
    if (!tournament) return false;
    
    // Primary check: isAuctionBased flag
    if (tournament.isAuctionBased === true) {
      return true;
    }
    
    // Secondary check: competition type includes auction
    const hasAuctionType = tournament.competitionType?.toLowerCase().includes('auction');
    
    return hasAuctionType;
  };

  const isRegistrationOpen = () => {
    if (!tournament) return false;
    
    // Check if registration deadline has passed
    const now = new Date();
    const deadline = new Date(tournament.registrationDeadline || tournament.startDate);
    console.log('🕒 Registration Check:', {
      now: now.toISOString(),
      deadline: deadline.toISOString(),
      isBeforeDeadline: now <= deadline,
      status: tournament.status
    });
    
    // Registration is open if current time is BEFORE or EQUAL to deadline
    if (now > deadline) {
      console.log('❌ Registration closed: Past deadline');
      return false;
    }
    
    // Check tournament status - allow UPCOMING and REGISTRATION_OPEN
    if (tournament.status === 'REGISTRATION_CLOSED' || 
        tournament.status === 'ONGOING' || 
        tournament.status === 'COMPLETED' || 
        tournament.status === 'CANCELLED') {
      console.log('❌ Registration closed: Status is', tournament.status);
      return false;
    }
    
    // Check if tournament is full
    const currentRegistrations = tournament._count?.registrations || 0;
    if (currentRegistrations >= tournament.maxTeams) {
      console.log('❌ Registration closed: Tournament full');
      return false;
    }
    
    console.log('✅ Registration is open!');
    return true;
  };

  const handleRegisterClick = () => {
    if (!tournament) return;
    
    // Navigate to universal registration page with tournament pre-selected
    router.push(`/tournament/${tournament.id}/register`);
  };

  const getRegistrationButtonText = () => {
    if (!tournament) return "Loading...";
    
    const isAuction = isAuctionTournament();
    
    if (!isRegistrationOpen()) {
      if (tournament.registrationDeadline && new Date() > new Date(tournament.registrationDeadline)) {
        return "Registration Deadline Passed";
      }
      if (tournament.status === 'ONGOING') {
        return "Tournament Started";
      }
      if (tournament.status === 'COMPLETED') {
        return "Tournament Completed";
      }
      if (tournament.status === 'REGISTRATION_CLOSED') {
        return "Registration Closed";
      }
      if (tournament.status === 'CANCELLED') {
        return "Tournament Cancelled";
      }
      if ((tournament._count?.registrations || 0) >= tournament.maxTeams) {
        return "Tournament Full";
      }
      return "Registration Closed";
    }
    
    // Return appropriate text based on tournament type
    return isAuction ? "Register as Player" : "Register Your Team";
  };

  const getFormatDisplay = () => {
    if (!tournament) return 'Unknown'
    
    if (tournament.format === 'CUSTOM') {
      return tournament.overs ? `${tournament.overs} Overs` : 'Custom Format'
    }
    
    // Convert T6, T8, T10, etc. to "6 Overs", "8 Overs", etc.
    if (tournament.format.startsWith('T') && tournament.format.length <= 3) {
      const overs = tournament.format.substring(1)
      return `${overs} Overs`
    }
    
    return tournament.format
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
        <p className="text-muted-foreground">The tournament you're looking for doesn't exist.</p>
      </div>
    );
  }

  const organizers = parseJsonField(tournament.organizers);
  const winners = parseJsonField(tournament.winners);
  const otherPrizes = parseJsonField(tournament.otherPrizes);
  const registeredTeams = tournament._count?.registrations || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Tournament Poster Style */}
      <div className="relative bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-8 md:py-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <Trophy className="h-12 w-12 md:h-16 md:w-16 text-yellow-300" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight leading-tight px-2">
              {tournament.name}
            </h1>
            <div className="flex justify-center">
              {getStatusBadge(tournament.status)}
            </div>
            
            {/* Key Info Row - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8 max-w-4xl mx-auto">
              <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-yellow-300" />
                <p className="text-lg md:text-xl font-semibold">{formatDate(tournament.startDate)}</p>
                <p className="text-xs md:text-sm opacity-90">{formatTime(tournament.startDate)}</p>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <MapPin className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-yellow-300" />
                <p className="text-lg md:text-xl font-semibold">{tournament.venue}</p>
                <p className="text-xs md:text-sm opacity-90 truncate">{tournament.venueAddress}</p>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                <Award className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-yellow-300" />
                <p className="text-lg md:text-xl font-semibold">₹{tournament.totalPrizePool}</p>
                <p className="text-xs md:text-sm opacity-90">Total Prize Pool</p>
              </div>
            </div>            {/* Registration Button - Prominent placement */}
            {isRegistrationOpen() ? (
              <div className="mt-6 px-4 max-w-md mx-auto">
                {isAuctionTournament() ? (
                  // Auction Tournament - Show both Player and Team Owner Registration
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push(`/tournament/${tournament.id}/register?type=player`)}
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-14 text-base shadow-lg"
                    >
                      <User className="h-5 w-5 mr-2" />
                      Player Registration
                    </Button>
                    <Button
                      onClick={() => router.push(`/tournament/${tournament.id}/register?type=owner`)}
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-14 text-base shadow-lg"
                    >
                      <Trophy className="h-5 w-5 mr-2" />
                      Team Owner Registration
                    </Button>
                    <p className="text-center text-xs text-white/80">
                      Auction-based tournament with separate player and team owner registrations
                    </p>
                  </div>
                ) : (
                  // Regular Tournament - Show single registration button
                  <Button
                    onClick={handleRegisterClick}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-14 text-base shadow-lg"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    {getRegistrationButtonText()}
                  </Button>
                )}
                {tournament.registrationDeadline && (
                  <p className="text-center text-xs text-white/80 mt-2">
                    Registration closes: {formatDate(tournament.registrationDeadline)}
                  </p>
                )}
              </div>
            ) : (
              // Registration Closed - Show status message
              <div className="mt-6 px-4 max-w-md mx-auto text-center">
                <div className="bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-white text-lg font-semibold mb-2">
                    {getRegistrationButtonText()}
                  </p>
                  {tournament.status === 'UPCOMING' && (
                    <p className="text-white/80 text-sm">
                      Registration will open soon. Stay tuned!
                    </p>
                  )}
                  {tournament.status === 'REGISTRATION_CLOSED' && tournament.registrationDeadline && (
                    <p className="text-white/80 text-sm">
                      Registration closed on {formatDate(tournament.registrationDeadline)}
                    </p>
                  )}
                  {tournament.status === 'ONGOING' && (
                    <p className="text-white/80 text-sm">
                      Tournament is currently in progress
                    </p>
                  )}
                  {tournament.status === 'COMPLETED' && (
                    <p className="text-white/80 text-sm">
                      Tournament has concluded
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Share Buttons - Mobile Optimized with Fixed Layout */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 md:mt-8 px-4 max-w-lg mx-auto">
              <Button
                onClick={shareOnWhatsApp}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex-1 min-w-[120px] max-w-[160px] h-12 text-xs"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.382"/>
                </svg>
                WhatsApp
              </Button>
              <Button
                onClick={copyLink}
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 min-w-[100px] max-w-[140px] h-12 text-xs"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy Link
              </Button>
              <Button
                onClick={downloadPoster}
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 min-w-[110px] max-w-[150px] h-12 text-xs"
              >
                <Download className="h-4 w-4 mr-1" />
                Poster
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <div className="space-y-4 md:space-y-6">
          {/* Quick Stats - Mobile Optimized */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                  <p className="text-xl md:text-2xl font-bold text-primary">{getFormatDisplay()}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Format</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
                  <p className="text-xl md:text-2xl font-bold text-primary">{registeredTeams}/{tournament.maxTeams}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Teams</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg">
                  <p className="text-xl md:text-2xl font-bold text-primary">₹{tournament.entryFee}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Entry Fee</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
                  <p className="text-xl md:text-2xl font-bold text-primary">{tournament.teamSize}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Team Size</p>
                </div>
              </div>
              {tournament.overs && (
                <div className="mt-4 text-center">
                  <div className="inline-block p-3 md:p-4 bg-primary/10 rounded-lg">
                    <p className="text-lg md:text-xl font-bold text-primary">{tournament.overs} Overs</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Per Side</p>
                  </div>
                </div>
              )}
              {tournament.ageLimit && (
                <div className="mt-3 text-center">
                  <div className="inline-block px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      Age Limit: {tournament.ageLimit}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {tournament.description && (
            <Card>
              <CardHeader>
                <CardTitle>About Tournament</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: tournament.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Schedule Details - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Calendar className="h-5 w-5" />
                Tournament Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Tournament Dates</h4>
                  <p className="text-sm text-muted-foreground mb-1">Start: {formatDate(tournament.startDate)} at {formatTime(tournament.startDate)}</p>
                  <p className="text-sm text-muted-foreground">End: {formatDate(tournament.endDate)} at {formatTime(tournament.endDate)}</p>
                </div>
                {tournament.registrationDeadline && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">Registration Deadline</h4>
                    <p className="text-sm text-muted-foreground">{formatDate(tournament.registrationDeadline)}</p>
                  </div>
                )}
              </div>
              
              {/* Venue Information */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Venue Details
                </h4>
                <p className="font-medium mb-1">{tournament.venue}</p>
                {tournament.venueAddress && (
                  <p className="text-sm text-muted-foreground mb-2">{tournament.venueAddress}</p>
                )}
                {(tournament.venue === "Tunda Cricket Ground" || tournament.customMapsLink) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-8 text-xs"
                    onClick={() => {
                      const mapsUrl = tournament.customMapsLink || "https://maps.google.com/?q=Tunda+Cricket+Ground";
                      window.open(mapsUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on Maps
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prizes */}
          {(winners.length > 0 || otherPrizes.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Prizes & Awards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {winners.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {winners.map((winner: any, index: number) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                          <Badge variant="secondary">Position {winner.position}</Badge>
                        </div>
                        <p className="font-medium text-lg">{winner.prize || "Prize TBD"}</p>
                      </div>
                    ))}
                  </div>
                )}

                {otherPrizes.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Special Awards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {otherPrizes.map((prize: any, index: number) => (
                        <div key={index} className="p-4 bg-muted rounded-lg">
                          <p className="font-medium">{prize.prize}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Organizers */}
          {organizers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Organizers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizers.map((organizer: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-lg">{organizer.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{organizer.role}</p>
                      <p className="text-sm">{organizer.contact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules */}
          {tournament.rules && (
            <Card>
              <CardHeader>
                <CardTitle>Tournament Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: tournament.rules }}
                />
              </CardContent>
            </Card>
          )}          {/* Footer CTA - Registration */}
          <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <CardContent className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Join?</h2>
              <p className="mb-6">Don't miss out on this exciting cricket tournament!</p>
              
              {/* Registration Status */}
              <div className="mb-6">
                {isRegistrationOpen() ? (
                  <div className="bg-green-500/20 text-green-100 px-4 py-2 rounded-full inline-block mb-4">
                    ✅ Registration is Open
                  </div>
                ) : (
                  <div className="bg-red-500/20 text-red-100 px-4 py-2 rounded-full inline-block mb-4">
                    ❌ Registration Closed
                  </div>
                )}
                {tournament.registrationDeadline && (
                  <p className="text-sm opacity-90">
                    Registration deadline: {formatDate(tournament.registrationDeadline)}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={handleRegisterClick}
                  disabled={!isRegistrationOpen()}
                >
                  {getRegistrationButtonText()}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  onClick={shareOnWhatsApp}
                >
                  Share Tournament
                </Button>
              </div>
              
              {/* Contact organizers for questions */}
              {organizers.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-sm opacity-90 mb-3">Questions? Contact organizers:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {organizers.map((organizer: any, index: number) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                        onClick={() => {
                          if (organizer?.contact) {
                            const message = `Hi! I have questions about ${tournament.name}. Can you help?`;
                            const whatsappUrl = `https://wa.me/${organizer.contact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                          }
                        }}
                      >
                        📱 {organizer.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Poster Generator */}
      {showPosterGenerator && tournament && (
        <TournamentPosterGenerator 
          tournament={tournament}
          onDownload={() => {
            toast({
              title: "Poster Downloaded!",
              description: "Your tournament poster has been saved to your device.",
            });
            setShowPosterGenerator(false);
          }}
        />
      )}
    </div>
  );
}

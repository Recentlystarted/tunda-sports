"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowLeft, Calendar, Users, MapPin, User, Award, ExternalLink, Edit, Share2, Eye, DollarSign } from "lucide-react";
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
}

export default function ViewTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  // Add state for registration statistics
  const [registrationStats, setRegistrationStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

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
          description: "Failed to fetch tournament data",
          variant: "destructive",
        });
        router.push("/admin/tournaments");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
      router.push("/admin/tournaments");
    } finally {
      setLoading(false);
    }
  };

  // Fetch registration statistics
  useEffect(() => {
    const fetchRegistrationStats = async () => {
      try {
        const response = await fetch(`/api/registrations?tournamentId=${params.id}&summary=true`);
        if (response.ok) {
          const stats = await response.json();
          setRegistrationStats(stats);
        }
      } catch (error) {
        console.error('Failed to fetch registration stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (params.id) {
      fetchRegistrationStats();
    }
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      UPCOMING: { variant: "secondary" as const, label: "Upcoming" },
      REGISTRATION_OPEN: { variant: "default" as const, label: "Registration Open" },
      REGISTRATION_CLOSED: { variant: "outline" as const, label: "Registration Closed" },
      ONGOING: { variant: "default" as const, label: "Ongoing" },
      COMPLETED: { variant: "outline" as const, label: "Completed" },
      CANCELLED: { variant: "destructive" as const, label: "Cancelled" },
      POSTPONED: { variant: "secondary" as const, label: "Postponed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UPCOMING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-card-foreground mb-4">Tournament Not Found</h1>
          <Button onClick={() => router.push("/admin/tournaments")}>
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  const organizers = parseJsonField(tournament.organizers);
  const winners = parseJsonField(tournament.winners);
  const otherPrizes = parseJsonField(tournament.otherPrizes);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-card-foreground truncate">{tournament.name}</h1>
            <p className="text-muted-foreground text-sm">Tournament Details</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:gap-4">
          <div className="flex justify-center sm:justify-start">
            {getStatusBadge(tournament.status)}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:gap-4">
            <Button
              onClick={() => window.open(`/tournament/${tournament.id}`, '_blank')}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Eye className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Public View</span>
              <span className="sm:hidden">View</span>
            </Button>
            <Button
              onClick={() => {
                const url = `${window.location.origin}/tournament/${tournament.id}`;
                navigator.clipboard.writeText(url);
                toast({
                  title: "Link Copied!",
                  description: "Public tournament link copied to clipboard",
                });
              }}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Share2 className="h-4 w-4 mr-1 sm:mr-2" />
              Share
            </Button>
            {(tournament as any).isAuctionBased && tournament.status !== 'COMPLETED' && (
              <Button
                onClick={() => router.push(`/admin/tournaments/${tournament.id}/complete`)}
                size="sm"
                variant="default"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Trophy className="h-4 w-4 mr-1 sm:mr-2" />
                Complete
              </Button>
            )}
            <Button
              onClick={() => router.push(`/admin/tournaments/${tournament.id}/payment`)}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <DollarSign className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Payment Settings</span>
              <span className="sm:hidden">Payment</span>
            </Button>
            <Button
              onClick={() => router.push(`/admin/tournaments/${tournament.id}/edit`)}
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Edit className="h-4 w-4 mr-1 sm:mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Format</h3>
                <p className="text-base lg:text-lg">
                  {tournament.format}
                  {tournament.format === "CUSTOM" && tournament.customFormat && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({tournament.customFormat})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Entry Fee</h3>
                <p className="text-base lg:text-lg">₹{tournament.entryFee}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Total Prize Pool</h3>
                <p className="text-base lg:text-lg">₹{tournament.totalPrizePool}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Age Limit</h3>
                <p className="text-base lg:text-lg">{tournament.ageLimit || "No limit"}</p>
              </div>
            </div>{tournament.description && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Description</h3>
                <div 
                  className="text-base prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: tournament.description }}
                />
              </div>
            )}          </CardContent>
        </Card>

        {/* Registration Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {registrationStats.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Teams</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {registrationStats.pending}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {registrationStats.approved}
                  </div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {registrationStats.rejected}
                  </div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/registrations?tournamentId=' + params.id)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Manage Registrations
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tournament/${params.id}/register`)}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Public Registration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Venue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule & Venue
            </CardTitle>
          </CardHeader>          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Start Date</h3>
                <p className="text-sm lg:text-base">{formatDate(tournament.startDate)}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">End Date</h3>
                <p className="text-sm lg:text-base">{formatDate(tournament.endDate)}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Registration Deadline</h3>
                <p className="text-sm lg:text-base">{formatDate(tournament.registrationDeadline || "")}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Venue
                </span>
                {(tournament.venue === "Tunda Cricket Ground" || tournament.customMapsLink) && (
                  <a 
                    href={tournament.venue === "Tunda Cricket Ground" 
                      ? "https://maps.app.goo.gl/ZAS2CffMQdNqweqe6" 
                      : tournament.customMapsLink
                    }
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on Maps                  </a>
                )}
              </h3>
              <p className="text-sm lg:text-base">{tournament.venue}</p>
              {tournament.venueAddress && (
                <p className="text-xs text-muted-foreground mt-1">{tournament.venueAddress}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Configuration
            </CardTitle>
          </CardHeader>          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Maximum Teams</h3>
                <p className="text-lg">{tournament.maxTeams}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Team Size</h3>
                <p className="text-lg">{tournament.teamSize} players</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Substitutes</h3>
                <p className="text-lg">{tournament.substitutes} players</p>
              </div>
            </div>
            {tournament.overs && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Show as Overs</h3>
                <p className="text-lg">{tournament.overs} Overs Match</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organizers */}
        {organizers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Organizers
              </CardTitle>
            </CardHeader>            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {organizers.map((organizer: any, index: number) => (
                  <div key={index} className="p-3 sm:p-4 border rounded-lg">
                    <h4 className="font-medium text-sm sm:text-base">{organizer.name}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{organizer.role}</p>
                    <p className="text-xs sm:text-sm break-words">{organizer.contact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tournament Rules */}
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
        )}

        {/* Winners & Awards */}
        {(winners.length > 0 || otherPrizes.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Winners & Awards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {winners.length > 0 && (
                <div>
                  <h3 className="font-medium text-base mb-4">Winner Positions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {winners.map((winner: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Position {winner.position}</Badge>
                        </div>
                        <p className="font-medium mt-2">{winner.prize || "TBD"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {otherPrizes.length > 0 && (
                <div>
                  <h3 className="font-medium text-base mb-4">Other Awards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherPrizes.map((prize: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium">{prize.prize}</h4>
                        <p className="text-sm text-muted-foreground">{prize.winner || "TBD"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}            </CardContent>
          </Card>
        )}

        {/* Registration Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registration Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingStats ? (
              <div className="flex items-center justify-center h-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground">Total Registrations</h4>
                  <p className="text-lg">{registrationStats.total}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground">Pending Approval</h4>
                  <p className="text-lg">{registrationStats.pending}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground">Approved</h4>
                  <p className="text-lg">{registrationStats.approved}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm text-muted-foreground">Rejected</h4>
                  <p className="text-lg">{registrationStats.rejected}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tournament Poster Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Tournament Poster & Sharing
            </CardTitle>
            <CardDescription>
              Generate beautiful posters for social media sharing and download shareable links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TournamentPosterGenerator 
              tournament={tournament}
              onDownload={() => {
                toast({
                  title: "Poster Downloaded!",
                  description: "Your tournament poster has been saved to your device",
                });
              }}
            />
              <div className="mt-6 p-4 bg-muted rounded-lg space-y-4">
              <h4 className="font-medium mb-2">Share Tournament</h4>
              
              {/* Shareable Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Public Link</label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                  <input
                    type="text"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/tournament/${tournament.id}`}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded text-sm bg-background min-w-0"
                  />
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/tournament/${tournament.id}`;
                        navigator.clipboard.writeText(url);
                        toast({
                          title: "Link Copied!",
                          description: "Tournament link copied to clipboard",
                        });
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      Copy Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = `${window.location.origin}/tournament/${tournament.id}`;
                        const text = `🏏 ${tournament.name}\n\n📅 ${new Date(tournament.startDate).toLocaleDateString('en-IN')}\n📍 ${tournament.venue}\n💰 Prize Pool: ₹${tournament.totalPrizePool}\n\nRegister now!`;
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + "\n\n" + url)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

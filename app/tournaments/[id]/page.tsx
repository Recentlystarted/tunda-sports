"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, Trophy, Camera, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface Tournament {
  id: string;
  name: string;
  description: string;
  format: string;
  competitionType: string;
  venue: string;
  venueAddress: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  entryFee: number;
  totalPrizePool: number;
  status: string;
  overs: number;
  isAuctionBased: boolean;
  auctionDate: string;
  auctionBudget: number;
  minPlayerPoints: number;
  ownerParticipationCost: number;
  playerEntryFee: number;
  _count: {
    registrations: number;
    matches: number;
    auctionPlayers: number;
  };
  registrations: Array<{
    team: {
      id: string;
      name: string;
    };
    status: string;
  }>;
}

export default function TournamentDetailsPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
    }
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (response.ok) {
        const data = await response.json();
        setTournament(data.tournament);
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'REGISTRATION_OPEN':
        return 'bg-green-500';
      case 'ONGOING':
        return 'bg-blue-500';
      case 'COMPLETED':
        return 'bg-gray-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading tournament details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Tournament Not Found</h1>
            <p className="text-muted-foreground">
              The tournament you're looking for could not be found.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/#tournaments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {tournament.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(tournament.status)}>
                {tournament.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">
                {tournament.competitionType ? tournament.competitionType.replace('_', ' ') : tournament.format}
              </Badge>
              {tournament.isAuctionBased && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  🎯 Auction Tournament
                </Badge>
              )}
            </div>
          </div>
          <Link href={`/tournaments/${tournament.id}/photos`}>
            <Button variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              View Photos
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About the Tournament</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {tournament.description}
                </p>
              </CardContent>
            </Card>

            {/* Tournament Details */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Competition Type</p>
                      <p className="text-sm text-muted-foreground">
                        {tournament.competitionType ? tournament.competitionType.replace('_', ' ') : tournament.format}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(tournament.startDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(tournament.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Venue</p>
                      <p className="text-sm text-muted-foreground">
                        {tournament.venue}
                      </p>
                      {tournament.venueAddress && (
                        <p className="text-xs text-muted-foreground">
                          {tournament.venueAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Prize Pool</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{tournament.totalPrizePool?.toLocaleString() || 'TBD'}
                      </p>
                    </div>
                  </div>
                  {tournament.isAuctionBased && tournament.auctionDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Auction Date</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(tournament.auctionDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Registered Teams */}
            {tournament.registrations && tournament.registrations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Participating Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tournament.registrations.map((registration, index) => (
                      <div 
                        key={registration.team.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{registration.team.name}</span>
                        </div>
                        <Badge 
                          variant={registration.status === 'APPROVED' ? 'default' : 'secondary'}
                        >
                          {registration.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Teams Registered</span>
                  <span className="font-medium">
                    {tournament._count?.registrations || 0} / {tournament.maxTeams}
                  </span>
                </div>
                {tournament.isAuctionBased ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Player Entry Fee</span>
                      <span className="font-medium">₹{tournament.playerEntryFee || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Auction Budget</span>
                      <span className="font-medium">{tournament.auctionBudget?.toLocaleString() || 'TBD'} pts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Min Player Points</span>
                      <span className="font-medium">{tournament.minPlayerPoints || 500} pts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Registered Players</span>
                      <span className="font-medium">{tournament._count?.auctionPlayers || 0}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-medium">₹{tournament.entryFee}</span>
                  </div>
                )}
                {tournament.overs && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Overs</span>
                    <span className="font-medium">{tournament.overs}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Matches</span>
                  <span className="font-medium">{tournament._count?.matches || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/tournaments/${tournament.id}/photos`} className="block">
                  <Button className="w-full" variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    View Photo Gallery
                  </Button>
                </Link>
                {tournament.status === 'REGISTRATION_OPEN' && (
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Register Team
                  </Button>
                )}
                <Button className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Matches
                </Button>
              </CardContent>
            </Card>

            {/* Registration Deadline */}
            {tournament.registrationDeadline && tournament.status === 'REGISTRATION_OPEN' && (
              <Card>
                <CardHeader>
                  <CardTitle>Registration Deadline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(tournament.registrationDeadline)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  IndianRupee,
  Clock,
  ArrowRight,
  CalendarDays
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: string;
  customFormat?: string;
  status: string;
  venue: string;
  venueAddress?: string;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  maxTeams?: number;
  entryFee: number;
  totalPrizePool: number;
  ageLimit?: string;
  contactInfo?: string;
  rules?: string;
  requirements?: string;
  organizers?: string;
  winners?: string;
  otherPrizes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
      } else {
        console.error('Failed to fetch tournaments');
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'ONGOING':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getRegistrationStatus = (tournament: Tournament) => {
    if (!tournament.registrationDeadline) {
      return tournament.status === 'UPCOMING' ? 'Open' : 'Closed';
    }
    
    const deadline = new Date(tournament.registrationDeadline);
    const now = new Date();
    
    if (now > deadline) {
      return 'Closed';
    }
    
    return tournament.status === 'UPCOMING' ? 'Open' : 'Closed';
  };

  const isRegistrationOpen = (tournament: Tournament) => {
    return getRegistrationStatus(tournament) === 'Open';
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (filter === 'ALL') return true;
    if (filter === 'OPEN') return isRegistrationOpen(tournament);
    if (filter === 'UPCOMING') return tournament.status === 'UPCOMING';
    if (filter === 'ONGOING') return tournament.status === 'ONGOING';
    return tournament.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            🏏 Tunda Sports Club Tournaments
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join exciting cricket tournaments in Kutch, Gujarat. Register your team and compete with the best!
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {[
            { key: 'ALL', label: 'All Tournaments' },
            { key: 'OPEN', label: 'Open for Registration' },
            { key: 'UPCOMING', label: 'Upcoming' },
            { key: 'ONGOING', label: 'Ongoing' },
            { key: 'COMPLETED', label: 'Completed' }
          ].map((filterOption) => (
            <Button
              key={filterOption.key}
              variant={filter === filterOption.key ? 'default' : 'outline'}
              onClick={() => setFilter(filterOption.key)}
              size="sm"
            >
              {filterOption.label}
            </Button>
          ))}
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Tournaments Found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'ALL' 
                  ? 'No tournaments are currently available.' 
                  : `No tournaments match the "${filter.toLowerCase()}" filter.`}
              </p>
              <Button variant="outline" onClick={() => setFilter('ALL')}>
                View All Tournaments
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">
                      {tournament.name}
                    </CardTitle>
                    <Badge className={getStatusColor(tournament.status)}>
                      {tournament.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tournament Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span>{tournament.format}</span>
                      {tournament.customFormat && (
                        <span className="text-muted-foreground">({tournament.customFormat})</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{tournament.venue}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(tournament.startDate)}</span>
                      {tournament.endDate && (
                        <span> - {formatDate(tournament.endDate)}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span>Entry: ₹{tournament.entryFee}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>Prize: ₹{tournament.totalPrizePool}</span>
                    </div>

                    {tournament.maxTeams && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Max {tournament.maxTeams} teams</span>
                      </div>
                    )}

                    {tournament.registrationDeadline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Registration until: {formatDate(tournament.registrationDeadline)}</span>
                      </div>
                    )}
                  </div>

                  {/* Registration Status */}
                  <div className="pt-2">
                    {isRegistrationOpen(tournament) ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        ✅ Registration Open
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        ❌ Registration Closed
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {tournament.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tournament.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/tournament/${tournament.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                    
                    {isRegistrationOpen(tournament) && (
                      <Link href={`/tournament/${tournament.id}/register`} className="flex-1">
                        <Button className="w-full" size="sm">
                          Register Team
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold mb-4">Want to organize a tournament?</h2>
              <p className="text-muted-foreground mb-6">
                Contact our admin team to create and manage your cricket tournament.
              </p>
              <Button asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

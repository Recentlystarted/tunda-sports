"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  ArrowLeft, 
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Save,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Tournament {
  id: string;
  name: string;
  status: string;
  format: string;
  overs?: number;
  startDate: string;
  endDate: string;
}

interface Team {
  id: string;
  name: string;
  city?: string;
  captainName?: string;
}

interface TeamRegistration {
  id: string;
  teamId: string;
  status: string;
  team: Team;
}

const MATCH_TYPES = [
  { value: 'LEAGUE', label: 'League Match' },
  { value: 'QUALIFIER', label: 'Qualifier' },
  { value: 'ELIMINATOR', label: 'Eliminator' },
  { value: 'QUARTER_FINAL', label: 'Quarter Final' },
  { value: 'SEMI_FINAL', label: 'Semi Final' },
  { value: 'FINAL', label: 'Final' },
  { value: 'FRIENDLY', label: 'Friendly' },
  { value: 'PRACTICE', label: 'Practice' },
];

export default function CreateMatchPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<TeamRegistration[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  const [formData, setFormData] = useState({
    tournamentId: '',
    homeTeamId: '',
    awayTeamId: '',
    matchDate: undefined as Date | undefined,
    matchTime: '',
    venue: '',
    matchType: '',
    overs: '',
    umpire1: '',
    umpire2: '',
    scorer: '',
    matchReport: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentTeams(selectedTournament);
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentTeams = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/registrations`);
      if (response.ok) {
        const data = await response.json();
        // Filter only approved teams
        const approvedTeams = data.registrations?.filter(
          (reg: TeamRegistration) => reg.status === 'APPROVED'
        ) || [];
        setTeams(approvedTeams);
      }
    } catch (error) {
      console.error('Error fetching tournament teams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournament teams",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tournamentId) newErrors.tournamentId = 'Tournament is required';
    if (!formData.homeTeamId) newErrors.homeTeamId = 'Home team is required';
    if (!formData.awayTeamId) newErrors.awayTeamId = 'Away team is required';
    if (formData.homeTeamId === formData.awayTeamId) {
      newErrors.awayTeamId = 'Away team must be different from home team';
    }
    if (!formData.matchDate) newErrors.matchDate = 'Match date is required';
    if (!formData.matchTime) newErrors.matchTime = 'Match time is required';
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
    if (!formData.matchType) newErrors.matchType = 'Match type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors and try again",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time
      const matchDateTime = new Date(formData.matchDate!);
      const [hours, minutes] = formData.matchTime.split(':');
      matchDateTime.setHours(parseInt(hours), parseInt(minutes));

      const matchData = {
        tournamentId: formData.tournamentId,
        homeTeamId: formData.homeTeamId,
        awayTeamId: formData.awayTeamId,
        matchDate: matchDateTime.toISOString(),
        venue: formData.venue.trim(),
        matchType: formData.matchType,
        overs: formData.overs ? parseInt(formData.overs) : null,
        umpire1: formData.umpire1.trim() || null,
        umpire2: formData.umpire2.trim() || null,
        scorer: formData.scorer.trim() || null,
        matchReport: formData.matchReport.trim() || null,
      };

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Match scheduled successfully",
        });
        router.push('/admin/matches');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create match');
      }
    } catch (error) {
      console.error('Error creating match:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule match",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    setFormData(prev => ({
      ...prev,
      tournamentId,
      homeTeamId: '',
      awayTeamId: '',
      overs: ''
    }));
    
    // Set default overs based on tournament format
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament?.overs) {
      setFormData(prev => ({ ...prev, overs: tournament.overs!.toString() }));
    }
  };

  const getFormatDisplay = (tournament: Tournament) => {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Logo */}
        <div className="flex items-center gap-4">
          <Link href="/admin/matches">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Image
            src="/logo.PNG"
            alt="Tunda Sports Club"
            width={60}
            height={60}
            className="rounded-lg"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Schedule Match
            </h1>
            <p className="text-muted-foreground">
              Create a new match for tournament competition
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tournament & Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tournament">Tournament *</Label>
                <Select 
                  value={formData.tournamentId} 
                  onValueChange={handleTournamentChange}
                >
                  <SelectTrigger className={errors.tournamentId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select tournament..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tournament.name}</span>
                          <Badge variant={tournament.status === 'ONGOING' ? 'default' : 'secondary'}>
                            {tournament.status}
                          </Badge>
                          <Badge variant="outline">
                            {getFormatDisplay(tournament)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tournamentId && (
                  <p className="text-sm text-red-500 mt-1">{errors.tournamentId}</p>
                )}
              </div>

              {selectedTournament && teams.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No approved teams found for this tournament. Please ensure teams are registered and approved.
                  </AlertDescription>
                </Alert>
              )}

              {teams.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="homeTeam">Home Team *</Label>
                    <Select 
                      value={formData.homeTeamId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, homeTeamId: value }))}
                    >
                      <SelectTrigger className={errors.homeTeamId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select home team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((registration) => (
                          <SelectItem key={registration.team.id} value={registration.team.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{registration.team.name}</span>
                              {registration.team.city && (
                                <Badge variant="outline">{registration.team.city}</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.homeTeamId && (
                      <p className="text-sm text-red-500 mt-1">{errors.homeTeamId}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="awayTeam">Away Team *</Label>
                    <Select 
                      value={formData.awayTeamId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, awayTeamId: value }))}
                    >
                      <SelectTrigger className={errors.awayTeamId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select away team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(reg => reg.team.id !== formData.homeTeamId).map((registration) => (
                          <SelectItem key={registration.team.id} value={registration.team.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{registration.team.name}</span>
                              {registration.team.city && (
                                <Badge variant="outline">{registration.team.city}</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.awayTeamId && (
                      <p className="text-sm text-red-500 mt-1">{errors.awayTeamId}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Match Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Match Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="matchDate">Match Date *</Label>
                  <DatePicker
                    date={formData.matchDate}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, matchDate: date }))}
                    placeholder="Select match date..."
                    className={errors.matchDate ? 'border-red-500' : ''}
                  />
                  {errors.matchDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.matchDate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="matchTime">Match Time *</Label>
                  <Input
                    id="matchTime"
                    type="time"
                    value={formData.matchTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, matchTime: e.target.value }))}
                    className={errors.matchTime ? 'border-red-500' : ''}
                  />
                  {errors.matchTime && (
                    <p className="text-sm text-red-500 mt-1">{errors.matchTime}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="Enter match venue..."
                  className={errors.venue ? 'border-red-500' : ''}
                />
                {errors.venue && (
                  <p className="text-sm text-red-500 mt-1">{errors.venue}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="matchType">Match Type *</Label>
                  <Select 
                    value={formData.matchType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, matchType: value }))}
                  >
                    <SelectTrigger className={errors.matchType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select match type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MATCH_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.matchType && (
                    <p className="text-sm text-red-500 mt-1">{errors.matchType}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="overs">Overs</Label>
                  <Input
                    id="overs"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.overs}
                    onChange={(e) => setFormData(prev => ({ ...prev, overs: e.target.value }))}
                    placeholder="e.g., 20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Officials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Match Officials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="umpire1">Umpire 1</Label>
                  <Input
                    id="umpire1"
                    value={formData.umpire1}
                    onChange={(e) => setFormData(prev => ({ ...prev, umpire1: e.target.value }))}
                    placeholder="First umpire name..."
                  />
                </div>

                <div>
                  <Label htmlFor="umpire2">Umpire 2</Label>
                  <Input
                    id="umpire2"
                    value={formData.umpire2}
                    onChange={(e) => setFormData(prev => ({ ...prev, umpire2: e.target.value }))}
                    placeholder="Second umpire name..."
                  />
                </div>

                <div>
                  <Label htmlFor="scorer">Scorer</Label>
                  <Input
                    id="scorer"
                    value={formData.scorer}
                    onChange={(e) => setFormData(prev => ({ ...prev, scorer: e.target.value }))}
                    placeholder="Scorer name..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="matchReport">Match Notes</Label>
                <Textarea
                  id="matchReport"
                  value={formData.matchReport}
                  onChange={(e) => setFormData(prev => ({ ...prev, matchReport: e.target.value }))}
                  placeholder="Any additional notes or special instructions for this match..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4 justify-end">
            <Link href="/admin/matches">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Schedule Match
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

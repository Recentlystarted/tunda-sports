"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  Target,
  Award
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Tournament {
  id: string;
  name: string;
  status: string;
  format: string;
}

interface Team {
  id: string;
  name: string;
  city?: string;
}

interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: string;
  venue: string;
  matchType: string;
  overs?: number;
  status: string;
  homeTeamScore?: string;
  awayTeamScore?: string;
  winnerTeamId?: string;
  winType?: string;
  winMargin?: string;
  tossWinner?: string;
  tossDecision?: string;
  umpire1?: string;
  umpire2?: string;
  scorer?: string;
  matchReport?: string;
  tournament: Tournament;
  homeTeam: Team;
  awayTeam: Team;
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

const MATCH_STATUSES = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'POSTPONED', label: 'Postponed' },
  { value: 'ABANDONED', label: 'Abandoned' },
  { value: 'NO_RESULT', label: 'No Result' },
];

const WIN_TYPES = [
  { value: 'RUNS', label: 'By Runs' },
  { value: 'WICKETS', label: 'By Wickets' },
  { value: 'WALKOVER', label: 'Walkover' },
  { value: 'NO_RESULT', label: 'No Result' },
  { value: 'ABANDONED', label: 'Abandoned' },
];

const TOSS_DECISIONS = [
  { value: 'BAT', label: 'Chose to Bat' },
  { value: 'BOWL', label: 'Chose to Bowl' },
];

export default function EditMatchPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const matchId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);

  const [formData, setFormData] = useState({
    matchDate: undefined as Date | undefined,
    matchTime: '',
    venue: '',
    matchType: '',
    overs: '',
    status: '',
    homeTeamScore: '',
    awayTeamScore: '',
    winnerTeamId: '',
    winType: '',
    winMargin: '',
    tossWinner: '',
    tossDecision: '',
    umpire1: '',
    umpire2: '',
    scorer: '',
    matchReport: '',
  });

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (response.ok) {
        const matchData = await response.json();
        setMatch(matchData);
        
        // Parse date and time
        const matchDateTime = new Date(matchData.matchDate);
        const timeString = matchDateTime.toTimeString().slice(0, 5);
        
        setFormData({
          matchDate: matchDateTime,
          matchTime: timeString,
          venue: matchData.venue || '',
          matchType: matchData.matchType || '',
          overs: matchData.overs?.toString() || '',
          status: matchData.status || '',
          homeTeamScore: matchData.homeTeamScore || '',
          awayTeamScore: matchData.awayTeamScore || '',
          winnerTeamId: matchData.winnerTeamId || '',
          winType: matchData.winType || '',
          winMargin: matchData.winMargin || '',
          tossWinner: matchData.tossWinner || '',
          tossDecision: matchData.tossDecision || '',
          umpire1: matchData.umpire1 || '',
          umpire2: matchData.umpire2 || '',
          scorer: matchData.scorer || '',
          matchReport: matchData.matchReport || '',
        });
      } else {
        throw new Error('Failed to fetch match');
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      toast({
        title: "Error",
        description: "Failed to load match details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.matchDate || !formData.matchTime || !formData.venue.trim()) {
      toast({
        title: "Validation Error",
        description: "Date, time, and venue are required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time
      const matchDateTime = new Date(formData.matchDate);
      const [hours, minutes] = formData.matchTime.split(':');
      matchDateTime.setHours(parseInt(hours), parseInt(minutes));

      const updateData = {
        matchDate: matchDateTime.toISOString(),
        venue: formData.venue.trim(),
        matchType: formData.matchType,
        overs: formData.overs ? parseInt(formData.overs) : null,
        status: formData.status,
        homeTeamScore: formData.homeTeamScore.trim() || null,
        awayTeamScore: formData.awayTeamScore.trim() || null,
        winnerTeamId: formData.winnerTeamId || null,
        winType: formData.winType || null,
        winMargin: formData.winMargin.trim() || null,
        tossWinner: formData.tossWinner || null,
        tossDecision: formData.tossDecision || null,
        umpire1: formData.umpire1.trim() || null,
        umpire2: formData.umpire2.trim() || null,
        scorer: formData.scorer.trim() || null,
        matchReport: formData.matchReport.trim() || null,
      };

      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Match updated successfully",
        });
        router.push('/admin/matches');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update match');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update match",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Match not found</h2>
          <p className="text-muted-foreground">The requested match could not be loaded.</p>
          <Link href="/admin/matches">
            <Button>Back to Matches</Button>
          </Link>
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
              Edit Match
            </h1>
            <p className="text-muted-foreground">
              {match.homeTeam.name} vs {match.awayTeam.name} - {match.tournament.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Match Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tournament</Label>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <span className="font-medium">{match.tournament.name}</span>
                    <Badge variant="outline">{match.tournament.status}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Teams</Label>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <span className="font-medium">{match.homeTeam.name}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-medium">{match.awayTeam.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Venue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule & Venue
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
                  />
                </div>

                <div>
                  <Label htmlFor="matchTime">Match Time *</Label>
                  <Input
                    id="matchTime"
                    type="time"
                    value={formData.matchTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, matchTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="Enter match venue..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="matchType">Match Type</Label>
                  <Select 
                    value={formData.matchType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, matchType: value }))}
                  >
                    <SelectTrigger>
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
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MATCH_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          {/* Match Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Match Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homeTeamScore">{match.homeTeam.name} Score</Label>
                  <Input
                    id="homeTeamScore"
                    value={formData.homeTeamScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, homeTeamScore: e.target.value }))}
                    placeholder="e.g., 180/5 (20 overs)"
                  />
                </div>

                <div>
                  <Label htmlFor="awayTeamScore">{match.awayTeam.name} Score</Label>
                  <Input
                    id="awayTeamScore"
                    value={formData.awayTeamScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, awayTeamScore: e.target.value }))}
                    placeholder="e.g., 175/8 (20 overs)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="winnerTeamId">Winner</Label>
                  <Select 
                    value={formData.winnerTeamId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, winnerTeamId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select winner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Winner</SelectItem>
                      <SelectItem value={match.homeTeamId}>{match.homeTeam.name}</SelectItem>
                      <SelectItem value={match.awayTeamId}>{match.awayTeam.name}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="winType">Win Type</Label>
                  <Select 
                    value={formData.winType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, winType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select win type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {WIN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="winMargin">Win Margin</Label>
                  <Input
                    id="winMargin"
                    value={formData.winMargin}
                    onChange={(e) => setFormData(prev => ({ ...prev, winMargin: e.target.value }))}
                    placeholder="e.g., 5 runs, 3 wickets"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tossWinner">Toss Winner</Label>
                  <Select 
                    value={formData.tossWinner} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tossWinner: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select toss winner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not Set</SelectItem>
                      <SelectItem value={match.homeTeamId}>{match.homeTeam.name}</SelectItem>
                      <SelectItem value={match.awayTeamId}>{match.awayTeam.name}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tossDecision">Toss Decision</Label>
                  <Select 
                    value={formData.tossDecision} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tossDecision: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TOSS_DECISIONS.map((decision) => (
                        <SelectItem key={decision.value} value={decision.value}>
                          {decision.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="matchReport">Match Report</Label>
                <Textarea
                  id="matchReport"
                  value={formData.matchReport}
                  onChange={(e) => setFormData(prev => ({ ...prev, matchReport: e.target.value }))}
                  placeholder="Match summary, highlights, or special notes..."
                  rows={4}
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Match
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

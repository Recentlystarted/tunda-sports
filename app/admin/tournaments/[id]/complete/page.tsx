"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowLeft, Users, CheckCircle, AlertCircle, Crown, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Tournament {
  id: string;
  name: string;
  status: string;
  isAuctionBased: boolean;
  totalAuctionPlayers: number;
  auctionPlayerStatus: Record<string, number>;
}

interface CompletionResult {
  movedPlayers: number;
  updatedPlayers: number;
  errors: number;
  details: {
    moved: Array<{ name: string; action: string }>;
    updated: Array<{ name: string; action: string }>;
    errors: Array<{ name: string; error: string }>;
  };
}

export default function CompleteTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchTournamentStatus();
    }
  }, [params.id]);

  const fetchTournamentStatus = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/complete`);
      if (response.ok) {
        const data = await response.json();
        setTournament(data.tournament);
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

  const completeTournament = async (markCompleted: boolean = false) => {
    if (!tournament) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/tournaments/${params.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'move_auction_players',
          markCompleted 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompletionResult(data.results);
        
        toast({
          title: "Tournament Completed! 🎉",
          description: `Successfully processed ${data.results.movedPlayers + data.results.updatedPlayers} players.`
        });

        // Refresh tournament status
        await fetchTournamentStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete tournament');
      }
    } catch (error) {
      console.error('Tournament completion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete tournament';
      toast({
        title: "Completion Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Tournament not found or not accessible.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'AVAILABLE': { variant: 'secondary', label: 'Available' },
      'SOLD': { variant: 'default', label: 'Sold' },
      'UNSOLD': { variant: 'destructive', label: 'Unsold' },
      'APPROVED': { variant: 'default', label: 'Approved' },
      'MOVED_TO_PLAYER_TABLE': { variant: 'outline', label: 'Moved to Players' }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary', label: status };
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/tournaments")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tournaments
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Complete Tournament</h1>
          <p className="text-muted-foreground">Move approved auction players to the main player database</p>
        </div>
      </div>

      {/* Tournament Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            {tournament.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={tournament.status === 'COMPLETED' ? 'default' : 'secondary'}>
              {tournament.status}
            </Badge>
            {tournament.isAuctionBased && (
              <Badge variant="outline">
                <Crown className="h-3 w-3 mr-1" />
                Auction Tournament
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tournament.totalAuctionPlayers}</div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </div>
            {Object.entries(tournament.auctionPlayerStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  {getStatusBadge(status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {!tournament.isAuctionBased ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tournament is not auction-based. Player completion is only available for auction tournaments.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Complete Tournament</CardTitle>
            <CardDescription>
              This will move all approved auction players to the main player database. 
              If a player already exists, their information will be updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => completeTournament(false)}
                disabled={processing}
                size="lg"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing Players...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Move Approved Players
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => completeTournament(true)}
                disabled={processing}
                variant="default"
                size="lg"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Tournament & Move Players
                  </>
                )}
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Move Approved Players:</strong> Only moves players to the database without changing tournament status.<br/>
                <strong>Complete Tournament:</strong> Moves players AND marks the tournament as completed.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Completion Results */}
      {completionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completion Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">{completionResult.movedPlayers}</div>
                <div className="text-sm text-muted-foreground">New Players Created</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">{completionResult.updatedPlayers}</div>
                <div className="text-sm text-muted-foreground">Existing Players Updated</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-red-50">
                <div className="text-2xl font-bold text-red-600">{completionResult.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {completionResult.details.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                <div className="space-y-2">
                  {completionResult.details.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{error.name}:</strong> {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

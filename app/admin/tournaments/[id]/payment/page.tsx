"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Settings } from "lucide-react";
import Link from "next/link";
import TournamentPaymentManager from "@/components/admin/TournamentPaymentManager";

interface Tournament {
  id: string;
  name: string;
  isAuctionBased: boolean;
  entryFee?: number; // Main entry fee for regular tournaments
  playerEntryFee?: number;
  teamEntryFee?: number;
  competitionType: string;
  format: string;
  status: string;
}

export default function TournamentPaymentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchTournament();
    }
  }, [params.id]);

  const fetchTournament = async () => {
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
        router.push('/admin/tournaments');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Tournament not found</p>
          <Link href="/admin/tournaments">
            <Button variant="outline">Back to Tournaments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/admin/tournaments/${tournament.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournament
            </Button>
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Payment Settings</h1>
                <p className="text-muted-foreground">{tournament.name}</p>
              </div>
            </div>
          </div>

          <Link href="/admin/settings/payment">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Global Settings
            </Button>
          </Link>
        </div>

        {/* Tournament Payment Manager */}
        <TournamentPaymentManager
          tournamentId={tournament.id}
          tournament={tournament}
          onPaymentMethodsChange={(methods) => {
            console.log('Payment methods updated:', methods);
          }}
        />

        {/* Instructions */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-800 dark:text-amber-200 text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700 dark:text-amber-300 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Auto-Generated Features:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Custom QR codes with tournament details</li>
                  <li>• Dynamic pricing from tournament settings</li>
                  <li>• UPI payment strings with proper metadata</li>
                  <li>• Automatic method creation for auction tournaments</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Tournament-Specific Benefits:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Different payment types for different roles</li>
                  <li>• Read-only tournament information display</li>
                  <li>• Integrated with club branding and logo</li>
                  <li>• Real-time QR code generation and preview</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

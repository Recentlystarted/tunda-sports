"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  IndianRupee, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';

interface TeamOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  teamName: string;
  budget: number;
  remainingBudget: number;
  status: string;
  tournament: {
    id: string;
    name: string;
    format: string;
    venue: string;
    startDate: string;
    auctionDate?: string;
    status: string;
  };
  players?: Array<{
    id: string;
    name: string;
    position: string;
    soldPrice: number;
  }>;
}

interface TeamOwnerPortalProps {
  params: {
    token: string;
  };
}

export default function TeamOwnerPortal({ params }: TeamOwnerPortalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [teamOwner, setTeamOwner] = useState<TeamOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTeamOwnerData();
  }, [params.token]);

  const fetchTeamOwnerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/team-owners/${params.token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Invalid or expired team owner token');
        } else {
          setError('Failed to load team owner data');
        }
        return;
      }
      
      const data = await response.json();
      setTeamOwner(data);
    } catch (error) {
      console.error('Error fetching team owner data:', error);
      setError('Failed to load team owner data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !teamOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Team owner not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-yellow-600" />
            <div>
              <CardTitle className="text-2xl">Team Owner Portal</CardTitle>
              <p className="text-muted-foreground">Welcome, {teamOwner.name}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Team Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Name:</span>
                  <span className="font-medium">{teamOwner.teamName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(teamOwner.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">₹{teamOwner.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium text-green-600">₹{teamOwner.remainingBudget.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Tournament Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{teamOwner.tournament.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{teamOwner.tournament.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">{new Date(teamOwner.tournament.startDate).toLocaleDateString()}</span>
                </div>
                {teamOwner.tournament.auctionDate && (
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Auction: {new Date(teamOwner.tournament.auctionDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Squad */}
      {teamOwner.players && teamOwner.players.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Squad ({teamOwner.players.length} players)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamOwner.players.map((player) => (
                <Card key={player.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <h4 className="font-medium">{player.name}</h4>
                      <p className="text-sm text-muted-foreground">{player.position}</p>
                      <p className="text-sm font-semibold text-green-600">₹{player.soldPrice.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {teamOwner.status === 'PENDING' && (
        <Alert className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your team owner registration is pending approval. You will be notified once it's approved.
          </AlertDescription>
        </Alert>
      )}

      {teamOwner.status === 'REJECTED' && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your team owner registration has been rejected. Please contact the tournament organizers for more information.
          </AlertDescription>
        </Alert>
      )}

      {teamOwner.status === 'APPROVED' && (!teamOwner.players || teamOwner.players.length === 0) && (
        <Alert className="mb-6">
          <Crown className="h-4 w-4" />
          <AlertDescription>
            Your team owner registration is approved! The auction will begin soon where you can bid for players.
          </AlertDescription>
        </Alert>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={teamOwner.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={teamOwner.phone}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            If you need to update your contact information, please contact the tournament organizers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  description?: string;
  captainName?: string;
  captainPhone?: string;
  captainEmail?: string;
  homeGround?: string;
  logoUrl?: string;
  players: any[];
  tournaments?: any[];
}

interface EditTeamPageProps {
  params: { id: string };
}

export default function EditTeamPage({ params }: EditTeamPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    captainName: "",
    captainPhone: "",
    captainEmail: "",
    homeGround: "",
    logoUrl: "",
  });

  useEffect(() => {
    fetchTeam();
  }, [params.id]);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${params.id}`);
      if (response.ok) {
        const teamData = await response.json();
        setTeam(teamData);
        setFormData({
          name: teamData.name || "",
          description: teamData.description || "",
          captainName: teamData.captainName || "",
          captainPhone: teamData.captainPhone || "",
          captainEmail: teamData.captainEmail || "",
          homeGround: teamData.homeGround || "",
          logoUrl: teamData.logoUrl || "",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load team data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching team:", error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.captainName) {
      toast({
        title: "Validation Error",
        description: "Team name and captain name are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/teams/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Team updated successfully",
        });
        router.push("/admin/teams");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update team",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating team:", error);
      toast({
        title: "Error",
        description: "Failed to update team",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Team not found or failed to load.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => router.push("/admin/teams")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Team</h1>
          <p className="text-muted-foreground">Update team information and details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>
                Update basic team details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter team name"
                  />
                </div>
                <div>
                  <Label htmlFor="homeGround">Home Ground</Label>
                  <Input
                    id="homeGround"
                    value={formData.homeGround}
                    onChange={(e) => handleInputChange("homeGround", e.target.value)}
                    placeholder="Enter home ground"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Captain Information</CardTitle>
              <CardDescription>
                Update team captain contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="captainName">Captain Name *</Label>
                <Input
                  id="captainName"
                  value={formData.captainName}
                  onChange={(e) => handleInputChange("captainName", e.target.value)}
                  placeholder="Enter captain name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="captainPhone">Captain Phone</Label>
                  <Input
                    id="captainPhone"
                    value={formData.captainPhone}
                    onChange={(e) => handleInputChange("captainPhone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="captainEmail">Captain Email</Label>
                  <Input
                    id="captainEmail"
                    type="email"
                    value={formData.captainEmail}
                    onChange={(e) => handleInputChange("captainEmail", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="logoUrl">Team Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                  placeholder="Enter logo URL (optional)"
                />
              </div>
            </CardContent>
          </Card>
        </div>          {/* Players Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Players ({team.players?.length || 0})
              </CardTitle>
              <CardDescription>
                View and manage team players
              </CardDescription>
            </CardHeader>
            <CardContent>
              {team.players && team.players.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {team.players.map((player, index) => (
                    <div key={player.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{player.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Age: {player.age}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {player.position}
                          </Badge>
                          {player.jerseyNumber && (
                            <Badge variant="outline" className="text-xs">
                              #{player.jerseyNumber}
                            </Badge>
                          )}
                        </div>
                        {player.phone && (
                          <p className="text-xs text-muted-foreground mt-1">{player.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No players registered yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Players</span>
                <span className="font-semibold">{team.players?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tournaments</span>
                <span className="font-semibold">{team.tournaments?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/admin/teams")}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

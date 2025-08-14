"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Users, Plus, X, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id?: string;
  name: string;
  age: number;
  city?: string;
  fatherName?: string;
  position: 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';
  experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';
  phone: string;
  email?: string;
  isSubstitute: boolean;
  jerseyNumber?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
}

interface TeamFormData {
  name: string;
  description: string;
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  captainAge: number;
  homeGround: string;
  city: string;
  logoUrl: string;
  teamColor: string;
  foundedYear?: number;
  players: Player[];
}

// Enhanced PlayerSearchInput for admin
function PlayerSearchInput({ 
  onPlayerSelect, 
  placeholder = "Search existing player...",
  className = "" 
}: { 
  onPlayerSelect: (player: any) => void
  placeholder?: string
  className?: string
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const searchPlayers = async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true)
        try {
          const response = await fetch(`/api/players?q=${encodeURIComponent(searchTerm)}&limit=8`)
          if (response.ok) {
            const players = await response.json()
            setSearchResults(players)
            setShowResults(true)
          }
        } catch (error) {
          console.error('Error searching players:', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }

    const timeoutId = setTimeout(searchPlayers, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handlePlayerSelect = (player: any) => {
    onPlayerSelect(player)
    setSearchTerm('')
    setShowResults(false)
    setSearchResults([])
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowResults(searchResults.length > 0)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        {isSearching && (
          <div className="absolute right-8 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {searchResults.map((player) => (
            <div
              key={player.id}
              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
              onClick={() => handlePlayerSelect(player)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-sm">{player.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {player.city && <span>📍 {player.city}</span>}
                    {player.phone && <span className="ml-2">📞 {player.phone}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  {player.age && <Badge variant="outline" className="text-xs">{player.age}y</Badge>}
                  {player.position && <Badge variant="secondary" className="text-xs">{player.position}</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CreateTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    description: "",
    captainName: "",
    captainPhone: "",
    captainEmail: "",
    captainAge: 18,
    homeGround: "",
    city: "",
    logoUrl: "",
    teamColor: "",
    foundedYear: new Date().getFullYear(),
    players: Array(11).fill(null).map(() => ({
      name: "",
      age: 18,
      position: 'BATSMAN' as const,
      experience: 'BEGINNER' as const,
      phone: "",
      email: "",
      isSubstitute: false
    }))
  });

  const handleInputChange = (field: keyof TeamFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updatePlayer = (index: number, field: keyof Player, value: any) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }));
  };

  const handlePlayerSelect = (index: number, selectedPlayer: any) => {
    updatePlayer(index, 'name', selectedPlayer.name);
    updatePlayer(index, 'age', selectedPlayer.age || 18);
    updatePlayer(index, 'city', selectedPlayer.city || '');
    updatePlayer(index, 'fatherName', selectedPlayer.fatherName || '');
    updatePlayer(index, 'phone', selectedPlayer.phone || '');
    updatePlayer(index, 'email', selectedPlayer.email || '');
    updatePlayer(index, 'position', selectedPlayer.position || 'BATSMAN');
    updatePlayer(index, 'experience', selectedPlayer.experience || 'BEGINNER');
    updatePlayer(index, 'jerseyNumber', selectedPlayer.jerseyNumber || undefined);
    
    toast({
      title: "Player Auto-filled",
      description: `${selectedPlayer.name}'s details have been loaded`,
    });
  };

  const addSubstitute = () => {
    const substitutes = formData.players.filter(p => p.isSubstitute).length;
    if (substitutes < 4) { // Max 4 substitutes
      setFormData(prev => ({
        ...prev,
        players: [...prev.players, {
          name: "",
          age: 18,
          position: 'BATSMAN' as const,
          experience: 'BEGINNER' as const,
          phone: "",
          email: "",
          isSubstitute: true
        }]
      }));
    }
  };

  const removeSubstitute = (index: number) => {
    const player = formData.players[index];
    if (player.isSubstitute) {
      setFormData(prev => ({
        ...prev,
        players: prev.players.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.captainName || !formData.city) {
      toast({
        title: "Validation Error",
        description: "Team name, captain name, and city are required",
        variant: "destructive",
      });
      return;
    }

    const mainPlayers = formData.players.filter(p => !p.isSubstitute);
    if (mainPlayers.length !== 11) {
      toast({
        title: "Validation Error",
        description: "You must have exactly 11 main players",
        variant: "destructive",
      });
      return;
    }

    // Check if all main players have required fields
    const invalidPlayers = mainPlayers.filter(p => !p.name.trim() || !p.phone.trim());
    if (invalidPlayers.length > 0) {
      toast({
        title: "Validation Error",
        description: "All main players must have name and phone number",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/teams', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Team data
          name: formData.name,
          description: formData.description,
          captainName: formData.captainName,
          captainPhone: formData.captainPhone,
          captainEmail: formData.captainEmail,
          captainAge: formData.captainAge,
          homeGround: formData.homeGround,
          city: formData.city,
          logoUrl: formData.logoUrl,
          teamColor: formData.teamColor,
          foundedYear: formData.foundedYear,
          // Players data
          players: formData.players.filter(p => p.name.trim()) // Only include players with names
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Team created successfully with all players",
        });
        router.push("/admin/teams");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create team",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const mainPlayers = formData.players.filter(p => !p.isSubstitute);
  const substitutes = formData.players.filter(p => p.isSubstitute);

  // Mobile-optimized scrollbar styles
  const scrollbarStyles = {
    scrollbarWidth: 'thin' as const,
    scrollbarColor: 'rgb(203 213 225) transparent',
  };

  return (
    <div className="container mx-auto px-3 md:px-6 py-6 max-w-6xl">
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
          <h1 className="text-2xl md:text-3xl font-bold">Create New Team</h1>
          <p className="text-muted-foreground text-sm md:text-base">Add a new team with complete player roster</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Form - Team Details */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>
                Basic team details and contact information
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
                  <Label htmlFor="city">City/Village *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="e.g., Tunda, Bhuj, Anjar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homeGround">Home Ground</Label>
                  <Input
                    id="homeGround"
                    value={formData.homeGround}
                    onChange={(e) => handleInputChange("homeGround", e.target.value)}
                    placeholder="Home ground name"
                  />
                </div>
                <div>
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={formData.foundedYear || ''}
                    onChange={(e) => handleInputChange("foundedYear", parseInt(e.target.value) || undefined)}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamColor">Team Color</Label>
                  <Input
                    id="teamColor"
                    value={formData.teamColor}
                    onChange={(e) => handleInputChange("teamColor", e.target.value)}
                    placeholder="e.g., Blue, Red, Green"
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">Team Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description about the team"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Captain Information */}
          <Card>
            <CardHeader>
              <CardTitle>Captain Information</CardTitle>
              <CardDescription>
                Team captain contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="captainName">Captain Name *</Label>
                  <Input
                    id="captainName"
                    value={formData.captainName}
                    onChange={(e) => handleInputChange("captainName", e.target.value)}
                    placeholder="Captain's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="captainAge">Captain Age</Label>
                  <Input
                    id="captainAge"
                    type="number"
                    value={formData.captainAge}
                    onChange={(e) => handleInputChange("captainAge", parseInt(e.target.value) || 18)}
                    min="16"
                    max="60"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="captainPhone">Captain Phone</Label>
                  <Input
                    id="captainPhone"
                    value={formData.captainPhone}
                    onChange={(e) => handleInputChange("captainPhone", e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label htmlFor="captainEmail">Captain Email</Label>
                  <Input
                    id="captainEmail"
                    type="email"
                    value={formData.captainEmail}
                    onChange={(e) => handleInputChange("captainEmail", e.target.value)}
                    placeholder="captain@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Players (11) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Main Players
                </div>
                <Badge variant="outline">
                  {mainPlayers.filter(p => p.name.trim()).length}/11 players
                </Badge>
              </CardTitle>
              <CardDescription>
                Add 11 main players for the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="space-y-4 max-h-96 overflow-y-auto pr-2" 
                style={scrollbarStyles}
              >
                {mainPlayers.map((player, index) => (
                  <div key={index} className="border rounded-lg p-3 md:p-4 space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">Player {index + 1}</h4>
                      {player.jerseyNumber && (
                        <Badge variant="outline" className="text-xs">#{player.jerseyNumber}</Badge>
                      )}
                    </div>

                    {/* Player search */}
                    <div>
                      <Label className="text-xs">Search Existing Player (Optional)</Label>
                      <PlayerSearchInput
                        onPlayerSelect={(selectedPlayer) => handlePlayerSelect(index, selectedPlayer)}
                        placeholder="Search by name, city, or phone..."
                        className="mt-1"
                      />
                    </div>

                    {/* Player details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Player Name *</Label>
                        <Input
                          value={player.name}
                          onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                          placeholder="Full name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Age</Label>
                        <Input
                          type="number"
                          value={player.age}
                          onChange={(e) => updatePlayer(index, 'age', parseInt(e.target.value) || 18)}
                          min={16}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Jersey #</Label>
                        <Input
                          type="number"
                          value={player.jerseyNumber || ''}
                          onChange={(e) => updatePlayer(index, 'jerseyNumber', parseInt(e.target.value) || undefined)}
                          placeholder="1-99"
                          min={1}
                          max={99}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">City/Village</Label>
                        <Input
                          value={player.city || ''}
                          onChange={(e) => updatePlayer(index, 'city', e.target.value)}
                          placeholder="Player's city"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Father's Name</Label>
                        <Input
                          value={player.fatherName || ''}
                          onChange={(e) => updatePlayer(index, 'fatherName', e.target.value)}
                          placeholder="Father's name"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Phone *</Label>
                        <Input
                          value={player.phone}
                          onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                          placeholder="+91 98765 43210"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          value={player.email || ''}
                          onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                          placeholder="player@example.com"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Position</Label>
                        <Select 
                          value={player.position} 
                          onValueChange={(value) => updatePlayer(index, 'position', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BATSMAN">Batsman</SelectItem>
                            <SelectItem value="BOWLER">Bowler</SelectItem>
                            <SelectItem value="ALL_ROUNDER">All-rounder</SelectItem>
                            <SelectItem value="WICKET_KEEPER">Wicket-keeper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Experience</Label>
                        <Select 
                          value={player.experience} 
                          onValueChange={(value) => updatePlayer(index, 'experience', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BEGINNER">Beginner</SelectItem>
                            <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                            <SelectItem value="ADVANCED">Advanced</SelectItem>
                            <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Substitute Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Substitute Players
                </div>
                <Badge variant="outline">
                  {substitutes.length}/4 substitutes
                </Badge>
              </CardTitle>
              <CardDescription>
                Add up to 4 substitute players (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {substitutes.map((player, index) => {
                  const actualIndex = formData.players.indexOf(player);
                  return (
                    <div key={actualIndex} className="border rounded-lg p-3 md:p-4 space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">Substitute {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">SUB</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSubstitute(actualIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Same player form as main players but for substitutes */}
                      <div>
                        <Label className="text-xs">Search Existing Player (Optional)</Label>
                        <PlayerSearchInput
                          onPlayerSelect={(selectedPlayer) => handlePlayerSelect(actualIndex, selectedPlayer)}
                          placeholder="Search by name, city, or phone..."
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Player Name</Label>
                          <Input
                            value={player.name}
                            onChange={(e) => updatePlayer(actualIndex, 'name', e.target.value)}
                            placeholder="Full name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Age</Label>
                          <Input
                            type="number"
                            value={player.age}
                            onChange={(e) => updatePlayer(actualIndex, 'age', parseInt(e.target.value) || 18)}
                            min={16}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Phone</Label>
                          <Input
                            value={player.phone}
                            onChange={(e) => updatePlayer(actualIndex, 'phone', e.target.value)}
                            placeholder="+91 98765 43210"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Position</Label>
                          <Select 
                            value={player.position} 
                            onValueChange={(value) => updatePlayer(actualIndex, 'position', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BATSMAN">Batsman</SelectItem>
                              <SelectItem value="BOWLER">Bowler</SelectItem>
                              <SelectItem value="ALL_ROUNDER">All-rounder</SelectItem>
                              <SelectItem value="WICKET_KEEPER">Wicket-keeper</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Experience</Label>
                          <Select 
                            value={player.experience} 
                            onValueChange={(value) => updatePlayer(actualIndex, 'experience', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BEGINNER">Beginner</SelectItem>
                              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                              <SelectItem value="ADVANCED">Advanced</SelectItem>
                              <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add substitute button */}
                {substitutes.length < 4 && (
                  <Button
                    variant="outline"
                    onClick={addSubstitute}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Substitute Player ({substitutes.length}/4)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Main Players</span>
                <span className="font-semibold">{mainPlayers.filter(p => p.name.trim()).length}/11</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Substitutes</span>
                <span className="font-semibold">{substitutes.filter(p => p.name.trim()).length}/4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Players</span>
                <span className="font-semibold">{formData.players.filter(p => p.name.trim()).length}</span>
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
                {saving ? "Creating Team..." : "Create Team"}
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

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.name ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Team name</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.captainName ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Captain name</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.city ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Team city</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${mainPlayers.filter(p => p.name.trim()).length === 11 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>11 main players</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

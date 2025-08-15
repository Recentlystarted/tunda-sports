"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Plus,
  Trash2,
  User,
  Award,
  ExternalLink,
  Settings,
  Crown,
  DollarSign,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from '@/components/ui/checkbox'
import { PhoneInput } from '@/components/ui/phone-input'

const COMPETITION_TYPES = [
  { value: 'LEAGUE', label: 'League Tournament' },
  { value: 'KNOCKOUT', label: 'Knockout Tournament' },
  { value: 'ONE_DAY_KNOCKOUT', label: 'One Day Knockout' },
  { value: 'GROUP_KNOCKOUT', label: 'Group + Knockout' },
  { value: 'ROUND_ROBIN', label: 'Round Robin' },
  { value: 'AUCTION_BASED_FIXED_TEAMS', label: 'Auction with Fixed Teams' },
  { value: 'AUCTION_BASED_GROUPS', label: 'Auction with Groups' },
  { value: 'DOUBLE_ELIMINATION', label: 'Double Elimination' },
  { value: 'SWISS_SYSTEM', label: 'Swiss System' },
  { value: 'VILLAGE_CHAMPIONSHIP', label: 'Village Championship' },
  { value: 'CITY_CHAMPIONSHIP', label: 'City Championship' },
  { value: 'INTER_VILLAGE', label: 'Inter-Village Tournament' },
  { value: 'INTER_CITY', label: 'Inter-City Tournament' },
  { value: 'FRIENDLY_SERIES', label: 'Friendly Series' },
  { value: 'KNOCKOUT_PLUS_FINAL', label: 'Knockout Plus Final' },
  { value: 'BEST_OF_THREE', label: 'Best of Three' },
  { value: 'BEST_OF_FIVE', label: 'Best of Five' },
  { value: 'AUCTION_LEAGUE', label: 'Auction League' },
  { value: 'AUCTION_KNOCKOUT', label: 'Auction Knockout' },
  { value: 'CUSTOM', label: 'Custom Competition' }
]

const statusOptions = [
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'REGISTRATION_OPEN', label: 'Registration Open' },
  { value: 'REGISTRATION_CLOSED', label: 'Registration Closed' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'POSTPONED', label: 'Postponed' }
]

const VENUE_OPTIONS = [
  { value: 'Tunda Cricket Ground', label: '🏟️ Tunda Cricket Ground', hasMap: true, mapLink: 'https://maps.app.goo.gl/ZAS2CffMQdNqweqe6' },
  { value: 'Custom', label: '📍 Custom Venue', hasMap: false }
]

const TUNDA_LOCATIONS = ["Tunda Cricket Ground", "Custom Location"];

interface Organizer {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  contact?: string; // Keep for backward compatibility
  customRole?: string;
}

interface Winner {
  position: number;
  prize: string;
}

interface OtherPrize {
  prize: string;
  winner: string;
}

export default function EditTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    format: "",
    competitionType: "",
    customFormat: "",
    startDate: "",
    endDate: "",
    venue: "",
    venueAddress: "",
    customMapsLink: "",
    maxTeams: "",
    registrationDeadline: "",
    entryFee: "",
    totalPrizePool: "",
    ageLimit: "",
    teamSize: "11",
    substitutes: "4",
    status: "",
    overs: "",
    // Auction-based fields
    isAuctionBased: false,
    requireTeamOwners: false,
    playerEntryFee: "",
    teamEntryFee: "",
    entryFeeType: "COMBINED",
    minPlayerPoints: "",
    ownerParticipationCost: "",
    auctionTeamCount: "",
    playerPoolSize: "",
    auctionDate: "",
    auctionBudget: "",
    // Group settings
    totalGroups: "",
    teamsPerGroup: "",
    groupsOptional: false,
    pointsBased: true,
    // Advanced settings
    minPlayersPerTeam: "",
    maxPlayersPerTeam: "",
    retentionAllowed: false,
    tradingEnabled: false,
    autoArrangeMatches: true,
    enableLiveScoring: false,
    scoringMethod: "BOOK"
  });

  const [rules, setRules] = useState("");
  
  // Date state variables for DatePicker components
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();

  const [organizers, setOrganizers] = useState<Organizer[]>([
    { name: "", role: "", phone: "", email: "", customRole: "" },
  ]);
  const [winners, setWinners] = useState<Winner[]>([
    { position: 1, prize: "" },
    { position: 2, prize: "" },
    { position: 3, prize: "" },
  ]);
  const [otherPrizes, setOtherPrizes] = useState<OtherPrize[]>([
    { prize: "", winner: "" },
  ]);

  const tournamentFormats = [
    { value: "T20", label: "T20 (20 Overs)" },
    { value: "T15", label: "T15 (15 Overs)" },
    { value: "T12", label: "T12 (12 Overs)" },
    { value: "T10", label: "T10 (10 Overs)" },
    { value: "CUSTOM", label: "Custom Format" },
  ];

  const statusOptions = [
    { value: "UPCOMING", label: "Upcoming" },
    { value: "REGISTRATION_OPEN", label: "Registration Open" },
    { value: "REGISTRATION_CLOSED", label: "Registration Closed" },
    { value: "ONGOING", label: "Ongoing" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "POSTPONED", label: "Postponed" },
  ];

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
        const tournament = data.tournament || data;        // Format dates for datetime-local input and DatePicker components
        const formatDateForInput = (dateString: string) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().slice(0, 16);
        };
        
        // Set Date objects for DatePicker components
        if (tournament.startDate) {
          setStartDate(new Date(tournament.startDate));
        }
        if (tournament.endDate) {
          setEndDate(new Date(tournament.endDate));
        }
        if (tournament.registrationDeadline) {
          setRegistrationDeadline(new Date(tournament.registrationDeadline));
        }
        
        // Handle format and competitionType properly for existing tournaments
        let loadedFormat = tournament.format || "T20"
        let loadedCompetitionType = tournament.competitionType || "LEAGUE"
        
        // If the tournament has format but no competitionType, try to infer it
        if (!tournament.competitionType && tournament.format) {
          // If the format is actually a competition type, move it to competitionType
          const competitionTypes = [
            'LEAGUE', 'KNOCKOUT', 'ONE_DAY_KNOCKOUT', 'GROUP_KNOCKOUT', 'ROUND_ROBIN',
            'AUCTION_BASED_FIXED_TEAMS', 'AUCTION_BASED_GROUPS', 'DOUBLE_ELIMINATION',
            'SWISS_SYSTEM', 'VILLAGE_CHAMPIONSHIP', 'CITY_CHAMPIONSHIP', 'INTER_VILLAGE',
            'INTER_CITY', 'FRIENDLY_SERIES', 'KNOCKOUT_PLUS_FINAL', 'BEST_OF_THREE',
            'BEST_OF_FIVE', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT', 'CUSTOM'
          ]
          
          if (competitionTypes.includes(tournament.format)) {
            loadedCompetitionType = tournament.format
            loadedFormat = "T20" // Default format for competitions
          }
        }
        
        setFormData({
          name: tournament.name || "",
          description: tournament.description || "",
          format: loadedFormat,
          competitionType: loadedCompetitionType,
          customFormat: tournament.customFormat || "",
          startDate: formatDateForInput(tournament.startDate),
          endDate: formatDateForInput(tournament.endDate),
          venue: tournament.venue || "Tunda Cricket Ground",
          venueAddress: tournament.venueAddress || "",
          customMapsLink: tournament.customMapsLink || "",
          maxTeams: tournament.maxTeams?.toString() || "",
          registrationDeadline: formatDateForInput(
            tournament.registrationDeadline
          ),
          entryFee: tournament.entryFee?.toString() || "",
          totalPrizePool: tournament.totalPrizePool?.toString() || "",
          ageLimit: tournament.ageLimit || "",
          teamSize: tournament.teamSize?.toString() || "11",
          substitutes: tournament.substitutes?.toString() || "4",
          status: tournament.status || "UPCOMING",
          overs: tournament.overs?.toString() || "",
          // Auction-based fields
          isAuctionBased: tournament.isAuctionBased || false,
          requireTeamOwners: tournament.requireTeamOwners || false,
          playerEntryFee: tournament.playerEntryFee?.toString() || "",
          teamEntryFee: tournament.teamEntryFee?.toString() || "",
          entryFeeType: tournament.entryFeeType || "COMBINED",
          minPlayerPoints: tournament.minPlayerPoints?.toString() || "",
          ownerParticipationCost: tournament.ownerParticipationCost?.toString() || "",
          auctionTeamCount: tournament.auctionTeamCount?.toString() || "",
          playerPoolSize: tournament.playerPoolSize?.toString() || "",
          auctionDate: formatDateForInput(tournament.auctionDate),
          auctionBudget: tournament.auctionBudget?.toString() || "",
          // Group settings
          totalGroups: tournament.totalGroups?.toString() || "",
          teamsPerGroup: tournament.teamsPerGroup?.toString() || "",
          groupsOptional: tournament.groupsOptional || false,
          pointsBased: tournament.pointsBased !== undefined ? tournament.pointsBased : true,
          // Advanced settings
          minPlayersPerTeam: tournament.minPlayersPerTeam?.toString() || "",
          maxPlayersPerTeam: tournament.maxPlayersPerTeam?.toString() || "",
          retentionAllowed: tournament.retentionAllowed || false,
          tradingEnabled: tournament.tradingEnabled || false,
          autoArrangeMatches: tournament.autoArrangeMatches !== undefined ? tournament.autoArrangeMatches : true,
          enableLiveScoring: tournament.enableLiveScoring || false,
          scoringMethod: tournament.scoringMethod || "BOOK"
        });

        setRules(tournament.rules || "");

        // Parse organizers from JSON string
        try {
          const organizersData = tournament.organizers
            ? JSON.parse(tournament.organizers)
            : [];          setOrganizers(
            organizersData.length > 0
              ? organizersData.map((org: any) => ({
                  name: org.name || "",
                  role: org.role || "",
                  phone: org.phone || org.contact || "", // Use phone if available, fallback to contact for backward compatibility
                  email: org.email || "",
                  customRole: org.customRole || ""
                }))
              : [{ name: "", role: "", phone: "", email: "", customRole: "" }]
          );
        } catch {
          setOrganizers([{ name: "", role: "", phone: "", email: "", customRole: "" }]);
        } // Parse winners from JSON string
        try {
          const winnersData = tournament.winners
            ? JSON.parse(tournament.winners)
            : [];
          setWinners(
            winnersData.length > 0
              ? winnersData
              : [
                  { position: 1, prize: "" },
                  { position: 2, prize: "" },
                  { position: 3, prize: "" },
                ]
          );
        } catch {
          setWinners([
            { position: 1, prize: "" },
            { position: 2, prize: "" },
            { position: 3, prize: "" },
          ]);
        }

        // Parse other prizes from JSON string
        try {
          const otherPrizesData = tournament.otherPrizes
            ? JSON.parse(tournament.otherPrizes)
            : [];
          setOtherPrizes(
            otherPrizesData.length > 0
              ? otherPrizesData
              : [{ prize: "", winner: "" }]
          );
        } catch {
          setOtherPrizes([{ prize: "", winner: "" }]);
        }
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
      setFetchingData(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompetitionTypeChange = (competitionType: string) => {
    handleInputChange('competitionType', competitionType)
    
    // Set auction-based flag for auction tournaments
    const isAuction = ['AUCTION_BASED_GROUPS', 'AUCTION_BASED_FIXED_TEAMS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(competitionType)
    
    if (isAuction) {
      // Set recommended settings for auction-based tournaments
      if (competitionType === 'AUCTION_BASED_GROUPS') {
        setFormData(prev => ({
          ...prev,
          isAuctionBased: true,
          totalGroups: prev.totalGroups || '3',
          teamsPerGroup: prev.teamsPerGroup || '4',
          auctionTeamCount: prev.auctionTeamCount || '12',
          playerPoolSize: prev.playerPoolSize || '150',
          minPlayersPerTeam: prev.minPlayersPerTeam || '11',
          maxPlayersPerTeam: prev.maxPlayersPerTeam || '15',
          // Auction-specific settings
          entryFeeType: 'BOTH',
          requireTeamOwners: true,
          ownerVerificationRequired: true
        }))
      } else if (competitionType === 'AUCTION_BASED_FIXED_TEAMS') {
        setFormData(prev => ({
          ...prev,
          isAuctionBased: true,
          auctionTeamCount: prev.auctionTeamCount || '8',
          playerPoolSize: prev.playerPoolSize || '120',
          minPlayersPerTeam: prev.minPlayersPerTeam || '11',
          maxPlayersPerTeam: prev.maxPlayersPerTeam || '15',
          // Auction-specific settings
          entryFeeType: 'BOTH',
          requireTeamOwners: true,
          ownerVerificationRequired: true
        }))
      } else {
        // For other auction tournaments, just set auction-specific defaults
        setFormData(prev => ({
          ...prev,
          isAuctionBased: true,
          entryFeeType: 'BOTH',
          requireTeamOwners: true,
          ownerVerificationRequired: true
        }))
      }
    } else {
      // For NON-AUCTION tournaments, reset auction-specific fields to appropriate defaults
      setFormData(prev => ({
        ...prev,
        isAuctionBased: false,
        entryFeeType: 'TEAM', // Regular tournaments should use team entry fees only
        requireTeamOwners: false, // Regular tournaments don't require team owners
        ownerVerificationRequired: false,
        playerEntryFee: '0', // Reset player entry fee for non-auction tournaments
        teamEntryFee: '0' // Will use entryFee instead
      }))
    }
  }

  const addOrganizer = () => {
    setOrganizers([...organizers, { name: "", role: "", phone: "", email: "", customRole: "" }]);
  };

  const removeOrganizer = (index: number) => {
    setOrganizers(organizers.filter((_, i) => i !== index));
  };

  const updateOrganizer = (
    index: number,
    field: keyof Organizer,
    value: string
  ) => {
    const updated = [...organizers];
    updated[index] = { ...updated[index], [field]: value };
    setOrganizers(updated);
  };
  const addWinner = () => {
    const nextPosition = Math.max(...winners.map((w) => w.position)) + 1;
    setWinners([...winners, { position: nextPosition, prize: "" }]);
  };

  const removeWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index));
  };

  const updateWinner = (
    index: number,
    field: keyof Winner,
    value: string | number
  ) => {
    const updated = [...winners];
    updated[index] = { ...updated[index], [field]: value };
    setWinners(updated);
  };

  const addOtherPrize = () => {
    setOtherPrizes([...otherPrizes, { prize: "", winner: "" }]);
  };

  const removeOtherPrize = (index: number) => {
    setOtherPrizes(otherPrizes.filter((_, i) => i !== index));
  };

  const updateOtherPrize = (
    index: number,
    field: keyof OtherPrize,
    value: string
  ) => {
    const updated = [...otherPrizes];
    updated[index] = { ...updated[index], [field]: value };
    setOtherPrizes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/tournaments/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          // Keep format and competitionType separate - don't override format with competitionType
          maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null,
          entryFee: formData.entryFee ? parseFloat(formData.entryFee) : 0,
          totalPrizePool: formData.totalPrizePool
            ? parseFloat(formData.totalPrizePool)
            : 0,
          teamSize: parseInt(formData.teamSize),
          substitutes: parseInt(formData.substitutes),
          overs: formData.overs ? parseInt(formData.overs) : null,
          // Auction fields - ensure proper types
          playerEntryFee: formData.playerEntryFee ? parseFloat(formData.playerEntryFee) : 0,
          teamEntryFee: formData.teamEntryFee ? parseFloat(formData.teamEntryFee) : 0,
          minPlayerPoints: formData.minPlayerPoints ? parseInt(formData.minPlayerPoints) : 500,
          ownerParticipationCost: formData.ownerParticipationCost ? parseInt(formData.ownerParticipationCost) : 500,
          auctionTeamCount: formData.auctionTeamCount ? parseInt(formData.auctionTeamCount) : null,
          playerPoolSize: formData.playerPoolSize ? parseInt(formData.playerPoolSize) : null,
          auctionBudget: formData.auctionBudget ? parseInt(formData.auctionBudget) : null,
          minPlayersPerTeam: formData.minPlayersPerTeam ? parseInt(formData.minPlayersPerTeam) : null,
          maxPlayersPerTeam: formData.maxPlayersPerTeam ? parseInt(formData.maxPlayersPerTeam) : null,
          rules,          organizers: JSON.stringify(
            organizers.filter((org) => org.name.trim()).map(org => ({
              name: org.name,
              role: org.role === 'Custom Role' ? org.customRole : org.role,
              phone: org.phone || "",
              email: org.email || "",
              contact: org.phone || org.email || "" // Backward compatibility
            }))
          ),
          winners: JSON.stringify(winners.filter((w) => w.prize.trim())),
          otherPrizes: JSON.stringify(
            otherPrizes.filter((p) => p.prize.trim() && p.winner.trim())
          ),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Tournament updated successfully!",
        });
        router.push("/admin/tournaments");
      } else {
        const error = await response.text();
        toast({
          title: "Error",
          description: error || "Failed to update tournament",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tournament",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">
            Edit Tournament
          </h1>
          <p className="text-muted-foreground">Update tournament information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Update the basic details of the tournament
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Tunda Premier League 2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>{" "}
            {formData.format === "CUSTOM" && (
              <div className="space-y-2">
                <Label htmlFor="customFormat">Custom Format Details *</Label>
                <Input
                  id="customFormat"
                  required={formData.format === "CUSTOM"}
                  value={formData.customFormat}
                  onChange={(e) =>
                    handleInputChange("customFormat", e.target.value)
                  }
                  placeholder="e.g., 8 Overs due to weather conditions"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="overs">Show as Overs</Label>
              <Input
                id="overs"
                type="number"
                value={formData.overs}
                onChange={(e) => handleInputChange("overs", e.target.value)}
                placeholder="e.g., 20"
              />
              <p className="text-xs text-muted-foreground">
                Number of overs per side (optional)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                content={formData.description}
                onChange={(content) => handleInputChange("description", content)}
                placeholder="Enter tournament description with rich formatting..."
              />
            </div>

            {/* Tournament Format and Competition Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="format">Format (Overs) *</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) => handleInputChange("format", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T6">T6 (6 Overs)</SelectItem>
                    <SelectItem value="T8">T8 (8 Overs)</SelectItem>
                    <SelectItem value="T10">T10 (10 Overs)</SelectItem>
                    <SelectItem value="T12">T12 (12 Overs)</SelectItem>
                    <SelectItem value="T15">T15 (15 Overs)</SelectItem>
                    <SelectItem value="T20">T20 (20 Overs)</SelectItem>
                    <SelectItem value="CUSTOM">Custom Format</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="competitionType">Competition Type *</Label>
                <Select
                  value={formData.competitionType}
                  onValueChange={handleCompetitionTypeChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select competition type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPETITION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.format === 'CUSTOM' || formData.competitionType === 'CUSTOM') && (
              <div className="space-y-2">
                <Label htmlFor="customFormat">Custom Format Details</Label>
                <Input
                  id="customFormat"
                  value={formData.customFormat}
                  onChange={(e) => handleInputChange("customFormat", e.target.value)}
                  placeholder="Describe your custom format..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="overs">Number of Overs (Optional)</Label>
              <Input
                id="overs"
                type="number"
                min="1"
                max="50"
                value={formData.overs}
                onChange={(e) => handleInputChange("overs", e.target.value)}
                placeholder="e.g., 20"
              />
              <p className="text-xs text-muted-foreground">
                Specific number of overs per side if different from format
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Date & Venue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule & Venue
            </CardTitle>
            <CardDescription>
              Update tournament dates and location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">              <div className="space-y-2">
                <Label>Start Date *</Label>
                <DatePicker
                  date={startDate}
                  onDateChange={(date) => {
                    setStartDate(date);
                    if (date) {
                      handleInputChange("startDate", date.toISOString().slice(0, 16));
                    }
                  }}
                  placeholder="Select start date"
                  allowFutureDates={true}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  date={endDate}
                  onDateChange={(date) => {
                    setEndDate(date);
                    if (date) {
                      handleInputChange("endDate", date.toISOString().slice(0, 16));
                    }
                  }}
                  placeholder="Select end date"
                  allowFutureDates={true}
                />
              </div><div className="space-y-2">
                <Label>Registration Deadline</Label>
                <DatePicker
                  date={registrationDeadline}
                  onDateChange={(date) => {
                    setRegistrationDeadline(date);
                    if (date) {
                      handleInputChange("registrationDeadline", date.toISOString().slice(0, 16));
                    }
                  }}
                  placeholder="Select deadline"
                  allowFutureDates={true}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <Label>Venue Information</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue Name *</Label>
                  <Select
                    value={formData.venue}
                    onValueChange={(value) => handleInputChange("venue", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {TUNDA_LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.venue === "Custom Location" && (
                  <div className="space-y-2">
                    <Label htmlFor="venueAddress">
                      Custom Location Details *
                    </Label>
                    <Input
                      id="venueAddress"
                      placeholder="Enter custom location name/address"
                      value={formData.venueAddress}
                      onChange={(e) =>
                        handleInputChange("venueAddress", e.target.value)
                      }
                      required={formData.venue === "Custom Location"}
                    />
                  </div>
                )}

                {formData.venue === "Custom Location" && (
                  <div className="space-y-2">
                    <Label htmlFor="customMapsLink">
                      Custom Maps Link (Optional)
                    </Label>
                    <Input
                      id="customMapsLink"
                      placeholder="https://maps.google.com/..."
                      value={formData.customMapsLink || ""}
                      onChange={(e) =>
                        handleInputChange("customMapsLink", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              {formData.venue && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      let mapsUrl = "";
                      if (formData.venue === "Tunda Cricket Ground") {
                        mapsUrl = "https://maps.app.goo.gl/ZAS2CffMQdNqweqe6";
                      } else if (
                        formData.venue === "Custom Location" &&
                        formData.customMapsLink
                      ) {
                        mapsUrl = formData.customMapsLink;
                      }
                      if (mapsUrl) {
                        window.open(mapsUrl, "_blank");
                      }
                    }}
                    disabled={
                      formData.venue === "Custom Location" &&
                      !formData.customMapsLink
                    }
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Maps
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maxTeams">Maximum Teams *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="maxTeams"
                    type="number"
                    required
                    min="2"
                    max="32"
                    value={formData.maxTeams}
                    onChange={(e) =>
                      handleInputChange("maxTeams", e.target.value)
                    }
                    placeholder="e.g., 8"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageLimit">Age Limit</Label>
                <Input
                  id="ageLimit"
                  value={formData.ageLimit}
                  onChange={(e) =>
                    handleInputChange("ageLimit", e.target.value)
                  }
                  placeholder="e.g., Under 25"
                />
              </div>
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
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size *</Label>
                <Input
                  id="teamSize"
                  type="number"
                  required
                  min="1"
                  max="25"
                  value={formData.teamSize}
                  onChange={(e) =>
                    handleInputChange("teamSize", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="substitutes">Substitutes</Label>
                <Input
                  id="substitutes"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.substitutes}
                  onChange={(e) =>
                    handleInputChange("substitutes", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>{" "}
        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
            <CardDescription>
              Set entry fee and total prize pool. The prize pool is the total
              amount available for all winners and awards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Regular Tournament Entry Fee */}
            {!formData.isAuctionBased && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.entryFee}
                    onChange={(e) =>
                      handleInputChange("entryFee", e.target.value)
                    }
                    placeholder="e.g., 1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount each team pays to participate
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPrizePool">Total Prize Pool (₹)</Label>
                  <Input
                    id="totalPrizePool"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalPrizePool}
                    onChange={(e) =>
                      handleInputChange("totalPrizePool", e.target.value)
                    }
                    placeholder="e.g., 25000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total amount available for all winners and awards combined
                  </p>
                </div>
              </div>
            )}

            {/* Auction Tournament Entry Fees */}
            {formData.isAuctionBased && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="playerEntryFee">Player Entry Fee (₹) *</Label>
                    <Input
                      id="playerEntryFee"
                      type="number"
                      min="0"
                      step="0.01"
                      required={formData.isAuctionBased}
                      value={formData.playerEntryFee}
                      onChange={(e) =>
                        handleInputChange("playerEntryFee", e.target.value)
                      }
                      placeholder="e.g., 500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount each player pays to participate in auction
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerParticipationCost">Owner Participation Cost (₹) *</Label>
                    <Input
                      id="ownerParticipationCost"
                      type="number"
                      min="0"
                      step="1"
                      required={formData.isAuctionBased}
                      value={formData.ownerParticipationCost}
                      onChange={(e) =>
                        handleInputChange("ownerParticipationCost", e.target.value)
                      }
                      placeholder="e.g., 500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Points deducted from budget if owner plays
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="minPlayerPoints">Minimum Player Points *</Label>
                    <Input
                      id="minPlayerPoints"
                      type="number"
                      min="100"
                      step="50"
                      required={formData.isAuctionBased}
                      value={formData.minPlayerPoints}
                      onChange={(e) =>
                        handleInputChange("minPlayerPoints", e.target.value)
                      }
                      placeholder="e.g., 500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum bidding amount for any player
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auctionBudget">Auction Budget per Team *</Label>
                    <Input
                      id="auctionBudget"
                      type="number"
                      min="1000"
                      step="1000"
                      required={formData.isAuctionBased}
                      value={formData.auctionBudget}
                      onChange={(e) =>
                        handleInputChange("auctionBudget", e.target.value)
                      }
                      placeholder="e.g., 10000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Total points each team gets for auction
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPrizePool">Total Prize Pool (₹)</Label>
                  <Input
                    id="totalPrizePool"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalPrizePool}
                    onChange={(e) =>
                      handleInputChange("totalPrizePool", e.target.value)
                    }
                    placeholder="e.g., 25000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total amount available for all winners and awards combined
                  </p>
                </div>
              </div>
            )}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">
                💡 Prize Pool vs Winner Awards
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>
                  • <strong>Prize Pool:</strong> Total money available for
                  distribution
                </li>
                <li>
                  • <strong>Winner Awards:</strong> Specific prizes for each
                  position (1st, 2nd, 3rd, etc.)
                </li>
                <li>
                  • Example: ₹25,000 prize pool → 1st: ₹15,000, 2nd: ₹7,000,
                  3rd: ₹3,000
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Auction Configuration - Show when competition type is auction-based */}
        {(formData.competitionType === 'AUCTION_BASED_FIXED_TEAMS' || 
          formData.competitionType === 'AUCTION_BASED_GROUPS' ||
          formData.competitionType === 'AUCTION_LEAGUE' ||
          formData.competitionType === 'AUCTION_KNOCKOUT') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Auction Configuration
              </CardTitle>
              <CardDescription>
                Configure auction-specific settings for IPL-style tournament
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auction Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="auctionTeamCount">Number of Teams *</Label>
                  <Input
                    id="auctionTeamCount"
                    type="number"
                    min="4"
                    max="16"
                    value={formData.auctionTeamCount}
                    onChange={(e) => handleInputChange("auctionTeamCount", e.target.value)}
                    placeholder="e.g., 8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playerPoolSize">Player Pool Size *</Label>
                  <Input
                    id="playerPoolSize"
                    type="number"
                    min="50"
                    max="500"
                    value={formData.playerPoolSize}
                    onChange={(e) => handleInputChange("playerPoolSize", e.target.value)}
                    placeholder="e.g., 150"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auctionDate">Auction Date *</Label>
                  <Input
                    id="auctionDate"
                    type="datetime-local"
                    value={formData.auctionDate}
                    onChange={(e) => handleInputChange("auctionDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auctionBudget">Points per Team *</Label>
                  <Input
                    id="auctionBudget"
                    type="number"
                    min="10000"
                    value={formData.auctionBudget}
                    onChange={(e) => handleInputChange("auctionBudget", e.target.value)}
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>

              {/* Entry Fees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="playerEntryFee">Player Entry Fee (₹)</Label>
                  <Input
                    id="playerEntryFee"
                    type="number"
                    min="0"
                    value={formData.playerEntryFee}
                    onChange={(e) => handleInputChange("playerEntryFee", e.target.value)}
                    placeholder="e.g., 500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount each player pays to register for auction
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamEntryFee">Team Owner Fee (₹)</Label>
                  <Input
                    id="teamEntryFee"
                    type="number"
                    min="0"
                    value={formData.teamEntryFee}
                    onChange={(e) => handleInputChange("teamEntryFee", e.target.value)}
                    placeholder="e.g., 2000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount team owners pay to participate in auction
                  </p>
                </div>
              </div>

              {/* Auction Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="minPlayerPoints">Minimum Bid per Player (Points)</Label>
                  <Input
                    id="minPlayerPoints"
                    type="number"
                    min="100"
                    max="5000"
                    value={formData.minPlayerPoints}
                    onChange={(e) => handleInputChange("minPlayerPoints", e.target.value)}
                    placeholder="e.g., 500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum points teams must bid for any player
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerParticipationCost">Owner Participation Cost (Points)</Label>
                  <Input
                    id="ownerParticipationCost"
                    type="number"
                    min="0"
                    max="2000"
                    value={formData.ownerParticipationCost}
                    onChange={(e) => handleInputChange("ownerParticipationCost", e.target.value)}
                    placeholder="e.g., 500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Points deducted from team budget if owner plays as participant
                  </p>
                </div>
              </div>

              {/* Team Composition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="minPlayersPerTeam">Min Players per Team</Label>
                  <Input
                    id="minPlayersPerTeam"
                    type="number"
                    min="8"
                    max="15"
                    value={formData.minPlayersPerTeam}
                    onChange={(e) => handleInputChange("minPlayersPerTeam", e.target.value)}
                    placeholder="e.g., 11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPlayersPerTeam">Max Players per Team</Label>
                  <Input
                    id="maxPlayersPerTeam"
                    type="number"
                    min="11"
                    max="20"
                    value={formData.maxPlayersPerTeam}
                    onChange={(e) => handleInputChange("maxPlayersPerTeam", e.target.value)}
                    placeholder="e.g., 15"
                  />
                </div>
              </div>

              {/* Auction Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="retentionAllowed"
                    checked={formData.retentionAllowed}
                    onCheckedChange={(checked) => handleInputChange("retentionAllowed", checked)}
                  />
                  <Label htmlFor="retentionAllowed" className="text-sm cursor-pointer">
                    Allow Player Retention
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tradingEnabled"
                    checked={formData.tradingEnabled}
                    onCheckedChange={(checked) => handleInputChange("tradingEnabled", checked)}
                  />
                  <Label htmlFor="tradingEnabled" className="text-sm cursor-pointer">
                    Enable Player Trading
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireTeamOwners"
                    checked={formData.requireTeamOwners}
                    onCheckedChange={(checked) => handleInputChange("requireTeamOwners", checked)}
                  />
                  <Label htmlFor="requireTeamOwners" className="text-sm cursor-pointer">
                    Require Team Owner Registration
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organizers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Organizers
            </CardTitle>
            <CardDescription>
              Manage multiple organizers for this tournament
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {organizers.map((organizer, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
              >
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={organizer.name}
                    onChange={(e) =>
                      updateOrganizer(index, "name", e.target.value)
                    }
                    placeholder="Organizer name"
                  />
                </div>                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={organizer.role}
                    onValueChange={(value) =>
                      updateOrganizer(index, "role", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tournament Director">Tournament Director</SelectItem>
                      <SelectItem value="Event Manager">Event Manager</SelectItem>
                      <SelectItem value="Ground Manager">Ground Manager</SelectItem>
                      <SelectItem value="Scorer">Scorer</SelectItem>
                      <SelectItem value="Umpire Coordinator">Umpire Coordinator</SelectItem>
                      <SelectItem value="Media Manager">Media Manager</SelectItem>
                      <SelectItem value="Sponsor Coordinator">Sponsor Coordinator</SelectItem>
                      <SelectItem value="Custom Role">Custom Role</SelectItem>
                    </SelectContent>
                  </Select>
                  {organizer.role === "Custom Role" && (
                    <Input
                      value={organizer.customRole || ""}
                      onChange={(e) =>
                        updateOrganizer(index, "customRole", e.target.value)
                      }
                      placeholder="Enter custom role"
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="flex gap-2">
                    <PhoneInput
                      label=""
                      value={organizer.phone || ""}
                      onChange={(value) => updateOrganizer(index, "phone", value)}
                      placeholder="Enter 10-digit mobile number"
                    />
                    {organizers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOrganizer(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email (Optional)</Label>
                  <Input
                    type="email"
                    value={organizer.email || ""}
                    onChange={(e) => updateOrganizer(index, "email", e.target.value)}
                    placeholder="Email address"
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addOrganizer}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Organizer
            </Button>
          </CardContent>
        </Card>
        {/* Tournament Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Tournament Rules</CardTitle>
            <CardDescription>
              Update the rules and regulations for the tournament with rich text
              formatting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {" "}
            <RichTextEditor
              content={rules}
              onChange={setRules}
              placeholder="Enter tournament rules with formatting options like bold, italic, bullet points, numbers..."
            />
          </CardContent>
        </Card>
        {/* Winners Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Winners & Awards
            </CardTitle>
            <CardDescription>
              Update winner positions and other special awards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Winner Positions */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Winner Positions</Label>
              {winners.map((winner, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      type="number"
                      min="1"
                      value={winner.position}
                      onChange={(e) =>
                        updateWinner(
                          index,
                          "position",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>{" "}
                  <div className="space-y-2">
                    <Label>Prize/Award</Label>
                    <Input
                      value={winner.prize}
                      onChange={(e) =>
                        updateWinner(index, "prize", e.target.value)
                      }
                      placeholder="e.g., Trophy + ₹10,000"
                    />
                  </div>{" "}
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeWinner(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addWinner}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Winner Position
              </Button>
            </div>

            {/* Other Prizes */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Other Awards</Label>
              {otherPrizes.map((prize, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <Label>Award Name</Label>
                    <Input
                      value={prize.prize}
                      onChange={(e) =>
                        updateOtherPrize(index, "prize", e.target.value)
                      }
                      placeholder="e.g., Best Bowler, Man of the Match"
                    />
                  </div>{" "}
                  <div className="space-y-2">
                    <Label>Winner</Label>
                    <div className="flex gap-2">
                      <Input
                        value={prize.winner}
                        onChange={(e) =>
                          updateOtherPrize(index, "winner", e.target.value)
                        }
                        placeholder="Winner name (if known)"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOtherPrize(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addOtherPrize}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Other Award
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Tournament"}
          </Button>
        </div>
      </form>
    </div>
  );
}

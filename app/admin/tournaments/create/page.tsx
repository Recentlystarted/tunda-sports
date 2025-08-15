'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus, X, MapPin, Trophy, Users, Settings, FileText, Target, Clock, Zap, Home } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import RichTextEditor from '@/components/ui/rich-text-editor'
import { PhoneInput } from '@/components/ui/phone-input'

const TOURNAMENT_FORMATS = [
  { value: 'T6', label: 'T6 (6 Overs)' },
  { value: 'T8', label: 'T8 (8 Overs)' },
  { value: 'T10', label: 'T10 (10 Overs)' },
  { value: 'T12', label: 'T12 (12 Overs)' },
  { value: 'T15', label: 'T15 (15 Overs)' },
  { value: 'T20', label: 'T20 (20 Overs)' },
  { value: 'CUSTOM', label: 'Custom Format' }
]

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

const VENUE_OPTIONS = [
  { value: 'Tunda Cricket Ground', label: '🏟️ Tunda Cricket Ground', hasMap: true, mapLink: 'https://maps.app.goo.gl/ZAS2CffMQdNqweqe6' },
  { value: 'Custom', label: '📍 Custom Venue', hasMap: false }
]

const SCORING_METHODS = [
  { value: 'BOOK', label: '📚 Book Scoring (Manual)' },
  { value: 'ONLINE_CIRHEROES', label: '🌐 Online - CricHeroes' },
  { value: 'ONLINE_CRICCLUBS', label: '🌐 Online - CricClubs' },
  { value: 'MANUAL', label: '✍️ Manual Entry' }
]

const ORGANIZER_ROLES = [
  'Tournament Director',
  'Sports Coordinator',
  'Village Elder',
  'Youth Leader',
  'Community Representative',
  'Cricket Captain',
  'Event Manager',
  'Custom Role'
]

const TUNDA_LOCATIONS = [
  'Tunda Cricket Ground',
  'Custom Location'
]

const CreateTournamentPage = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState('basic')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>()
  const [auctionDate, setAuctionDate] = useState<Date>()
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: '',
    overs: '',
    competitionType: '',
    maxTeams: '',
    entryFee: '',
    totalPrizePool: '',
    venue: '',
    venueAddress: '',
    customMapsLink: '',
    customFormat: '',
    rules: '',
    // Auto-arrangement settings
    autoArrangeMatches: false,
    groupSize: '',
    qualifiersPerGroup: '',
    matchDuration: '120',
    breakBetweenMatches: '30',
    maxMatchesPerDay: '4',
    preferredMatchTimes: '09:00,14:00,18:00',
    // Venue enhancements
    multiVenue: false,
    venueCapacity: '',
    venueFacilities: '',
    // Scoring settings
    defaultScoringMethod: 'BOOK',
    allowMultipleScoringMethods: false,
    // Auction-specific settings (defaults for non-auction tournaments)
    isAuctionBased: false,
    auctionBudget: '50000',
    totalGroups: '3',
    teamsPerGroup: '4',
    matchesPerTeam: '3',
    auctionRules: '',
    // Team management for auctions
    auctionTeamCount: '12',
    auctionTeamNames: [],
    groupsOptional: true, // Groups can be enabled/disabled later
    pointsBased: true, // Use points instead of real money
    playerPoolSize: '60', // Expected number of players
    minPlayersPerTeam: '11',
    maxPlayersPerTeam: '15',
    retentionAllowed: false, // Allow teams to retain players from previous seasons
    tradingEnabled: false, // Allow player trading between teams
    entryFeeType: 'TEAM', // Default to TEAM for regular tournaments (changed from BOTH)
    playerEntryFee: '0', // Default 0 for non-auction tournaments (changed from 500)
    minPlayerPoints: '500', // Minimum points per player in auction
    ownerParticipationCost: '500', // Points deducted if owner plays
    // Team ownership/sponsorship (defaults for non-auction tournaments)
    teamEntryFee: '0', // Default 0 for non-auction (changed from 5000)
    requireTeamOwners: false, // Default false for regular tournaments (changed from true)
    ownershipMode: 'REGISTRATION', // REGISTRATION (owners register), ADMIN_ASSIGN (admin assigns)
    maxTeamsPerOwner: '1', // How many teams one owner can own
    ownerVerificationRequired: false // Default false for regular tournaments (changed from true)
  })// Dynamic fields
  const [winners, setWinners] = useState([{ position: 1, prize: '' }])
  const [organizers, setOrganizers] = useState([{ name: '', role: '', phone: '', email: '', customRole: '' }])
  const [otherAwards, setOtherAwards] = useState([{ prize: '', winner: '' }])
  const [additionalVenues, setAdditionalVenues] = useState([{ name: '', address: '', mapsLink: '' }])
  const [scorers, setScorers] = useState([{ name: '', phone: '', email: '', experience: 'INTERMEDIATE', scoringMethods: ['BOOK'] }])
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [matchTimes, setMatchTimes] = useState(['09:00', '14:00', '18:00'])
  const [playersPool, setPlayersPool] = useState([{ name: '', basePrice: '', position: 'ALL_ROUNDER', city: '' }])
  const [groupNames, setGroupNames] = useState<string[]>([])
  const [auctionTeamNames, setAuctionTeamNames] = useState<string[]>([])
  const [teamOwners, setTeamOwners] = useState<Array<{
    teamIndex: number;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    sponsorName?: string;
    sponsorContact?: string;
    verified: boolean;
  }>>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateGroupName = (index: number, name: string) => {
    setGroupNames(prev => {
      const newGroupNames = [...prev]
      newGroupNames[index] = name
      return newGroupNames
    })
  }

  const addWinner = () => {
    setWinners(prev => [...prev, { position: prev.length + 1, prize: '' }])
  }

  const removeWinner = (index: number) => {
    setWinners(prev => prev.filter((_, i) => i !== index))
  }

  const updateWinner = (index: number, field: string, value: string) => {
    setWinners(prev => prev.map((winner, i) => 
      i === index ? { ...winner, [field]: field === 'position' ? parseInt(value) || 1 : value } : winner
    ))
  }
  const addOrganizer = () => {
    setOrganizers(prev => [...prev, { name: '', role: '', phone: '', email: '', customRole: '' }])
  }

  const removeOrganizer = (index: number) => {
    setOrganizers(prev => prev.filter((_, i) => i !== index))
  }
  const updateOrganizer = (index: number, field: string, value: string) => {
    setOrganizers(prev => prev.map((org, i) => 
      i === index ? { ...org, [field]: value } : org
    ))
  }

  const addOtherAward = () => {
    setOtherAwards(prev => [...prev, { prize: '', winner: '' }])
  }

  const removeOtherAward = (index: number) => {
    setOtherAwards(prev => prev.filter((_, i) => i !== index))
  }

  const updateOtherAward = (index: number, field: string, value: string) => {
    setOtherAwards(prev => prev.map((award, i) => 
      i === index ? { ...award, [field]: value } : award
    ))
  }

  // Additional venue management
  const addAdditionalVenue = () => {
    setAdditionalVenues(prev => [...prev, { name: '', address: '', mapsLink: '' }])
  }

  const removeAdditionalVenue = (index: number) => {
    setAdditionalVenues(prev => prev.filter((_, i) => i !== index))
  }

  const updateAdditionalVenue = (index: number, field: string, value: string) => {
    setAdditionalVenues(prev => prev.map((venue, i) => 
      i === index ? { ...venue, [field]: value } : venue
    ))
  }

  const addScorer = () => {
    setScorers(prev => [...prev, { name: '', phone: '', email: '', experience: 'INTERMEDIATE', scoringMethods: ['BOOK'] }])
  }

  const removeScorer = (index: number) => {
    setScorers(prev => prev.filter((_, i) => i !== index))
  }

  const updateScorer = (index: number, field: string, value: string) => {
    setScorers(prev => prev.map((scorer, i) => 
      i === index ? { ...scorer, [field]: value } : scorer
    ))
  }

  // Players pool management for auction tournaments
  const addPlayer = () => {
    setPlayersPool(prev => [...prev, { name: '', basePrice: '', position: 'ALL_ROUNDER', city: '' }])
  }

  const removePlayer = (index: number) => {
    setPlayersPool(prev => prev.filter((_, i) => i !== index))
  }

  const updatePlayer = (index: number, field: string, value: string) => {
    setPlayersPool(prev => prev.map((player, i) => 
      i === index ? { ...player, [field]: value } : player
    ))
  }

  // Auction team management
  const updateAuctionTeamName = (index: number, name: string) => {
    setAuctionTeamNames(prev => {
      const newTeamNames = [...prev]
      newTeamNames[index] = name
      return newTeamNames
    })
  }

  const addAuctionTeam = () => {
    setAuctionTeamNames(prev => [...prev, ''])
    setFormData(prev => ({ ...prev, auctionTeamCount: (parseInt(prev.auctionTeamCount) + 1).toString() }))
  }

  const removeAuctionTeam = (index: number) => {
    setAuctionTeamNames(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({ ...prev, auctionTeamCount: Math.max(1, parseInt(prev.auctionTeamCount) - 1).toString() }))
  }

  // Team ownership management
  const updateTeamOwner = (teamIndex: number, field: string, value: string | boolean) => {
    setTeamOwners(prev => {
      const existing = prev.find(owner => owner.teamIndex === teamIndex)
      if (existing) {
        return prev.map(owner => 
          owner.teamIndex === teamIndex 
            ? { ...owner, [field]: value }
            : owner
        )
      } else {
        return [...prev, {
          teamIndex,
          ownerName: field === 'ownerName' ? value as string : '',
          ownerPhone: field === 'ownerPhone' ? value as string : '',
          ownerEmail: field === 'ownerEmail' ? value as string : '',
          sponsorName: field === 'sponsorName' ? value as string : '',
          sponsorContact: field === 'sponsorContact' ? value as string : '',
          verified: field === 'verified' ? value as boolean : false
        }]
      }
    })
  }

  const getTeamOwner = (teamIndex: number) => {
    return teamOwners.find(owner => owner.teamIndex === teamIndex) || {
      teamIndex,
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      sponsorName: '',
      sponsorContact: '',
      verified: false
    }
  }

  const handleCompetitionTypeChange = (competitionType: string) => {
    handleInputChange('competitionType', competitionType)
    
    // Set auction-based flag for auction tournaments
    const isAuction = ['AUCTION_BASED_GROUPS', 'AUCTION_BASED_FIXED_TEAMS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(competitionType)
    handleInputChange('isAuctionBased', isAuction.toString())
    
    if (isAuction) {
      // Set recommended settings for auction-based tournaments
      if (competitionType === 'AUCTION_BASED_GROUPS') {
        setFormData(prev => ({
          ...prev,
          isAuctionBased: true,
          totalGroups: prev.totalGroups || '3',
          teamsPerGroup: prev.teamsPerGroup || '4',
          matchesPerTeam: prev.matchesPerTeam || '3',
          autoArrangeMatches: true,
          groupSize: prev.groupSize || '4',
          qualifiersPerGroup: prev.qualifiersPerGroup || '2',
          maxTeams: prev.maxTeams || '12', // Default: 3 groups × 4 teams
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
    
    if (formData.autoArrangeMatches && formData.maxTeams) {
      const recommendations = getRecommendedSettings(competitionType, parseInt(formData.maxTeams))
      setFormData(prev => ({ ...prev, ...recommendations }))
    }
  }

  // Auto-arrangement logic
  const getRecommendedSettings = (competitionType: string, maxTeams: number) => {
    const recommendations: any = {
      autoArrangeMatches: true,
      matchDuration: 120,
      breakBetweenMatches: 30,
      maxMatchesPerDay: 4
    }

    switch (competitionType) {
      case 'LEAGUE':
        recommendations.groupSize = Math.min(8, maxTeams)
        recommendations.qualifiersPerGroup = Math.min(2, Math.floor(maxTeams / 4))
        break
      case 'KNOCKOUT':
        recommendations.groupSize = 0
        recommendations.qualifiersPerGroup = 0
        break
      case 'GROUP_KNOCKOUT':
        recommendations.groupSize = Math.min(4, maxTeams / 2) // Flexible based on total teams
        recommendations.qualifiersPerGroup = Math.min(2, Math.floor(recommendations.groupSize / 2))
        break
      case 'VILLAGE_CHAMPIONSHIP':
        recommendations.matchDuration = 90
        recommendations.maxMatchesPerDay = 6
        break
      case 'INTER_VILLAGE':
        recommendations.matchDuration = 150
        recommendations.maxMatchesPerDay = 3
        break
    }

    return recommendations
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || !registrationDeadline) {
      alert('Please select all required dates')
      return
    }

    setLoading(true)
    try {      const payload = {
        ...formData,
        maxTeams: parseInt(formData.maxTeams) || 0,
        entryFee: parseFloat(formData.entryFee) || 0,
        totalPrizePool: parseFloat(formData.totalPrizePool) || 0,
        overs: parseInt(formData.overs) || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        registrationDeadline: registrationDeadline.toISOString(),
        auctionDate: auctionDate?.toISOString() || null,
        auctionBudget: parseInt(formData.auctionBudget) || null,
        totalGroups: parseInt(formData.totalGroups) || null,
        teamsPerGroup: parseInt(formData.teamsPerGroup) || null,
        matchesPerTeam: parseInt(formData.matchesPerTeam) || null,
        groupNames: groupNames.filter(name => name.trim()).length > 0 ? JSON.stringify(groupNames.filter(name => name.trim())) : null,
        // New auction fields
        auctionTeamCount: parseInt(formData.auctionTeamCount) || null,
        auctionTeamNames: JSON.stringify(auctionTeamNames.filter(name => name.trim())),
        groupsOptional: formData.groupsOptional,
        pointsBased: formData.pointsBased,
        playerPoolSize: parseInt(formData.playerPoolSize) || null,
        minPlayersPerTeam: parseInt(formData.minPlayersPerTeam) || null,
        maxPlayersPerTeam: parseInt(formData.maxPlayersPerTeam) || null,
        retentionAllowed: formData.retentionAllowed,
        tradingEnabled: formData.tradingEnabled,
        playerEntryFee: parseFloat(formData.playerEntryFee) || 0,
        minPlayerPoints: parseInt(formData.minPlayerPoints) || 500,
        ownerParticipationCost: parseInt(formData.ownerParticipationCost) || 500,
        // Existing fields
        winners: winners.filter(w => w.prize.trim()),
        organizers: organizers.filter(o => o.name.trim()).map(org => ({
          name: org.name,
          role: org.role === 'Custom Role' ? org.customRole : org.role,
          phone: org.phone,
          email: org.email
        })),
        otherAwards: otherAwards.filter(a => a.prize.trim()),
        additionalVenues: additionalVenues.filter(v => v.name.trim()),
        scorers: scorers.filter(s => s.name.trim()),
        teamOwners: teamOwners.filter(owner => owner.ownerName.trim())
      }

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.push('/admin/tournaments')
      } else {
        const error = await response.text()
        alert(`Error: ${error}`)
      }
    } catch (error) {
      console.error('Error creating tournament:', error)
      alert('Failed to create tournament')
    } finally {
      setLoading(false)
    }
  }

  const isNextDisabled = () => {
    switch (currentTab) {
      case 'basic':
        return !formData.name || !formData.format || !formData.competitionType
      case 'details':
        const isAuctionFormat = ['AUCTION_BASED_GROUPS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(formData.competitionType)
        const auctionFieldsValid = !isAuctionFormat || (
          auctionDate && 
          formData.auctionBudget && 
          formData.totalGroups && 
          formData.teamsPerGroup && 
          formData.matchesPerTeam
        )
        return !startDate || !endDate || !registrationDeadline || !formData.venue || !auctionFieldsValid
      case 'awards':
        return winners.length === 0 || !winners[0].prize
      case 'organizers':
        return organizers.length === 0 || !organizers[0].name
      case 'rules':
        return !formData.rules
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src="/logo.PNG" 
            alt="Tunda Sports Club" 
            className="h-12 w-12 object-contain rounded-lg border shadow-sm"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create Tournament</h1>
            <p className="text-muted-foreground text-sm md:text-base">Set up a new cricket tournament for the community</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl md:text-2xl">Tournament Setup</CardTitle>
          <CardDescription className="text-sm md:text-base">Complete all sections to create your tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid grid-cols-7 w-full mb-6">
                <TabsTrigger value="basic" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Settings className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Basic</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <CalendarIcon className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                <TabsTrigger value="venue" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Venues</span>
                </TabsTrigger>
                <TabsTrigger value="scoring" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Target className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Scoring</span>
                </TabsTrigger>
                <TabsTrigger value="awards" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Awards</span>
                </TabsTrigger>
                <TabsTrigger value="organizers" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Users className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Team</span>
                </TabsTrigger>
                <TabsTrigger value="rules" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <FileText className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Rules</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tournament Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Tunda Cricket Championship 2024"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Format *</Label>
                    <Select value={formData.format} onValueChange={(value) => handleInputChange('format', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {TOURNAMENT_FORMATS.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>                  {formData.format === 'CUSTOM' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="customFormat">Custom Format Details</Label>
                      <Input
                        id="customFormat"
                        placeholder="e.g., 8 overs per side with powerplay"
                        value={formData.customFormat}
                        onChange={(e) => handleInputChange('customFormat', e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="overs">Show as Overs</Label>
                    <Input
                      id="overs"
                      type="number"
                      placeholder="e.g., 20"
                      value={formData.overs}
                      onChange={(e) => handleInputChange('overs', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Number of overs per side (optional)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="competitionType">Competition Type *</Label>
                    <Select value={formData.competitionType} onValueChange={(value) => handleCompetitionTypeChange(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
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

                  <div className="space-y-2">
                    <Label htmlFor="maxTeams">Maximum Teams</Label>
                    <Input
                      id="maxTeams"
                      type="number"
                      placeholder="e.g., 16"
                      value={formData.maxTeams}
                      onChange={(e) => handleInputChange('maxTeams', e.target.value)}
                    />
                  </div>

                  {/* Regular Tournament Entry Fee */}
                  {!['AUCTION_BASED_GROUPS', 'AUCTION_BASED_FIXED_TEAMS'].includes(formData.competitionType) && (
                    <div className="space-y-2">
                      <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                      <Input
                        id="entryFee"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1000"
                        value={formData.entryFee}
                        onChange={(e) => handleInputChange('entryFee', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Amount each team pays</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="totalPrizePool">Total Prize Pool (₹)</Label>
                    <Input
                      id="totalPrizePool"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 25000"
                      value={formData.totalPrizePool}
                      onChange={(e) => handleInputChange('totalPrizePool', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Total amount for all awards</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">
                    💡 Prize Pool vs Winner Awards
                  </h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• <strong>Prize Pool:</strong> Total money available for distribution</li>
                    <li>• <strong>Winner Awards:</strong> Specific prizes for each position (1st, 2nd, 3rd, etc.)</li>
                    <li>• Example: ₹25,000 prize pool → 1st: ₹15,000, 2nd: ₹7,000, 3rd: ₹3,000</li>
                  </ul>
                </div><div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="min-h-[200px] max-h-[400px] overflow-y-auto border rounded-md">
                    <RichTextEditor
                      content={formData.description}
                      onChange={(content: string) => handleInputChange('description', content)}
                      placeholder="Brief description of the tournament..."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-6">
                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-sm",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(d) => d < new Date("1900-01-01")} // Allow future dates
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-sm",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(d) => d < new Date("1900-01-01")} // Allow future dates
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>                  <div className="space-y-2">
                    <Label>Registration Deadline *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-sm",
                            !registrationDeadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {registrationDeadline ? format(registrationDeadline, "PPP") : "Pick a date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={registrationDeadline}
                          onSelect={setRegistrationDeadline}
                          disabled={(d) => d < new Date("1900-01-01")} // Allow future dates
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>                {/* Auction-Based Tournament Settings */}
                {['AUCTION_BASED_GROUPS', 'AUCTION_BASED_FIXED_TEAMS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(formData.competitionType) && (
                  <div className="space-y-6 p-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                        <Trophy className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                          🏏 IPL-Style Auction Configuration
                        </h3>
                        <p className="text-sm text-orange-600 dark:text-orange-300">
                          Set up your auction tournament with teams, points budget, and flexible groups
                        </p>
                      </div>
                    </div>

                    {/* Auction Basic Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Auction Date *
                          <span className="text-orange-600 ml-1">🎯</span>
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !auctionDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {auctionDate ? format(auctionDate, "PPP") : "Select auction date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={auctionDate}
                              onSelect={setAuctionDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="auctionBudget">
                          Points Budget per Team
                          <span className="text-orange-600 ml-1">💰</span>
                        </Label>
                        <Input
                          id="auctionBudget"
                          type="number"
                          placeholder="e.g., 50000"
                          value={formData.auctionBudget}
                          onChange={(e) => handleInputChange('auctionBudget', e.target.value)}
                          className="border-orange-200"
                        />
                        <p className="text-xs text-orange-600">Teams will bid using points, not real money</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="auctionTeamCount">
                          Number of Teams
                          <span className="text-orange-600 ml-1">🏆</span>
                        </Label>
                        <Input
                          id="auctionTeamCount"
                          type="number"
                          min="4"
                          max="16"
                          placeholder="e.g., 12"
                          value={formData.auctionTeamCount}
                          onChange={(e) => handleInputChange('auctionTeamCount', e.target.value)}
                          className="border-orange-200"
                        />
                        <p className="text-xs text-orange-600">Can be modified later if more players register</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="playerPoolSize">
                          Expected Player Pool
                          <span className="text-orange-600 ml-1">👥</span>
                        </Label>
                        <Input
                          id="playerPoolSize"
                          type="number"
                          placeholder="e.g., 60"
                          value={formData.playerPoolSize}
                          onChange={(e) => handleInputChange('playerPoolSize', e.target.value)}
                          className="border-orange-200"
                        />
                        <p className="text-xs text-orange-600">Estimated number of players who will register</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minPlayersPerTeam">
                          Min Players per Team
                          <span className="text-orange-600 ml-1">⬇️</span>
                        </Label>
                        <Input
                          id="minPlayersPerTeam"
                          type="number"
                          min="7"
                          max="15"
                          placeholder="e.g., 11"
                          value={formData.minPlayersPerTeam}
                          onChange={(e) => handleInputChange('minPlayersPerTeam', e.target.value)}
                          className="border-orange-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxPlayersPerTeam">
                          Max Players per Team
                          <span className="text-orange-600 ml-1">⬆️</span>
                        </Label>
                        <Input
                          id="maxPlayersPerTeam"
                          type="number"
                          min="11"
                          max="20"
                          placeholder="e.g., 15"
                          value={formData.maxPlayersPerTeam}
                          onChange={(e) => handleInputChange('maxPlayersPerTeam', e.target.value)}
                          className="border-orange-200"
                        />
                      </div>
                    </div>

                    {/* Team Names Configuration */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-orange-800 dark:text-orange-200">
                          Team Names (Can be modified later)
                          <span className="text-orange-600 ml-1">📝</span>
                        </Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={addAuctionTeam}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Team
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({ length: parseInt(formData.auctionTeamCount) || 0 }, (_, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm text-orange-700 dark:text-orange-300">
                                Team {i + 1}
                              </Label>
                              {parseInt(formData.auctionTeamCount) > 4 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAuctionTeam(i)}
                                  className="h-6 w-6 p-0 text-orange-600 hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            <Input
                              placeholder={`Team ${String.fromCharCode(65 + i)} (e.g., Mumbai Indians)`}
                              value={auctionTeamNames[i] || ''}
                              onChange={(e) => updateAuctionTeamName(i, e.target.value)}
                              className="border-orange-200 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-orange-600">
                        💡 Team names can be changed anytime. If many players register, you can add more teams later.
                      </p>
                    </div>

                    {/* Groups Configuration (Optional) */}
                    <div className="space-y-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="groupsOptional"
                          checked={!formData.groupsOptional}
                          onCheckedChange={(checked) => handleInputChange('groupsOptional', (!checked).toString())}
                          className="border-orange-300"
                        />
                        <Label htmlFor="groupsOptional" className="text-orange-800 dark:text-orange-200 cursor-pointer">
                          Enable Groups (Optional - can be toggled later)
                          <span className="text-orange-600 ml-1">🏆</span>
                        </Label>
                      </div>

                      {!formData.groupsOptional && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="totalGroups">Number of Groups</Label>
                            <Select value={formData.totalGroups} onValueChange={(value) => handleInputChange('totalGroups', value)}>
                              <SelectTrigger className="border-orange-200">
                                <SelectValue placeholder="Select groups" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2">2 Groups</SelectItem>
                                <SelectItem value="3">3 Groups</SelectItem>
                                <SelectItem value="4">4 Groups</SelectItem>
                                <SelectItem value="6">6 Groups</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="teamsPerGroup">Teams per Group</Label>
                            <Input
                              id="teamsPerGroup"
                              type="number"
                              min="3"
                              max="8"
                              value={formData.teamsPerGroup}
                              onChange={(e) => handleInputChange('teamsPerGroup', e.target.value)}
                              className="border-orange-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="matchesPerTeam">Matches per Team</Label>
                            <Input
                              id="matchesPerTeam"
                              type="number"
                              min="2"
                              max="10"
                              value={formData.matchesPerTeam}
                              onChange={(e) => handleInputChange('matchesPerTeam', e.target.value)}
                              className="border-orange-200"
                            />
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-orange-600">
                        🔄 Groups can be enabled/disabled even after tournament creation based on registrations
                      </p>
                    </div>

                    {/* Player Registration Settings */}
                    <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Player Registration & Auction Rules
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="playerEntryFee">Player Entry Fee (₹)</Label>
                          <Input
                            id="playerEntryFee"
                            type="number"
                            placeholder="e.g., 500"
                            value={formData.playerEntryFee}
                            onChange={(e) => handleInputChange('playerEntryFee', e.target.value)}
                            className="border-blue-200"
                          />
                          <p className="text-xs text-blue-600">Individual players pay this fee to register</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="minPlayerPoints">Minimum Bid per Player (Points)</Label>
                          <Input
                            id="minPlayerPoints"
                            type="number"
                            min="100"
                            max="5000"
                            placeholder="e.g., 500"
                            value={formData.minPlayerPoints}
                            onChange={(e) => handleInputChange('minPlayerPoints', e.target.value)}
                            className="border-blue-200"
                          />
                          <p className="text-xs text-blue-600">Minimum points teams must bid for any player</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ownerParticipationCost">Owner Participation Cost (Points)</Label>
                          <Input
                            id="ownerParticipationCost"
                            type="number"
                            min="0"
                            max="2000"
                            placeholder="e.g., 500"
                            value={formData.ownerParticipationCost}
                            onChange={(e) => handleInputChange('ownerParticipationCost', e.target.value)}
                            className="border-blue-200"
                          />
                          <p className="text-xs text-blue-600">Points deducted from team budget if owner plays as participant</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="retentionAllowed"
                              checked={formData.retentionAllowed}
                              onCheckedChange={(checked) => handleInputChange('retentionAllowed', checked.toString())}
                            />
                            <Label htmlFor="retentionAllowed" className="text-sm cursor-pointer">
                              Allow player retention (for recurring tournaments)
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="tradingEnabled"
                              checked={formData.tradingEnabled}
                              onCheckedChange={(checked) => handleInputChange('tradingEnabled', checked.toString())}
                            />
                            <Label htmlFor="tradingEnabled" className="text-sm cursor-pointer">
                              Enable player trading between teams
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Ownership & Sponsorship */}
                    <div className="space-y-4 p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Team Ownership & Sponsorship
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="teamEntryFee">Team Entry Fee (₹)</Label>
                          <Input
                            id="teamEntryFee"
                            type="number"
                            placeholder="e.g., 5000"
                            value={formData.teamEntryFee}
                            onChange={(e) => handleInputChange('teamEntryFee', e.target.value)}
                            className="border-purple-200"
                          />
                          <p className="text-xs text-purple-600">Amount each team owner/sponsor pays to own a team</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="entryFeeType">Entry Fee Structure</Label>
                          <Select value={formData.entryFeeType} onValueChange={(value) => handleInputChange('entryFeeType', value)}>
                            <SelectTrigger className="border-purple-200">
                              <SelectValue placeholder="Select fee structure" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PLAYER">Only Player Fees</SelectItem>
                              <SelectItem value="TEAM">Only Team Owner Fees</SelectItem>
                              <SelectItem value="BOTH">Both Player & Team Fees</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-purple-600">How registration fees are collected</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxTeamsPerOwner">Max Teams per Owner</Label>
                          <Input
                            id="maxTeamsPerOwner"
                            type="number"
                            min="1"
                            max="5"
                            placeholder="e.g., 1"
                            value={formData.maxTeamsPerOwner}
                            onChange={(e) => handleInputChange('maxTeamsPerOwner', e.target.value)}
                            className="border-purple-200"
                          />
                          <p className="text-xs text-purple-600">How many teams one person can own</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="requireTeamOwners"
                              checked={formData.requireTeamOwners}
                              onCheckedChange={(checked) => handleInputChange('requireTeamOwners', checked.toString())}
                            />
                            <Label htmlFor="requireTeamOwners" className="text-sm cursor-pointer">
                              Require team owners for all teams
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="ownerVerificationRequired"
                              checked={formData.ownerVerificationRequired}
                              onCheckedChange={(checked) => handleInputChange('ownerVerificationRequired', checked.toString())}
                            />
                            <Label htmlFor="ownerVerificationRequired" className="text-sm cursor-pointer">
                              Require verification of team owners
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Team Ownership Mode */}
                      <div className="space-y-3">
                        <Label className="text-purple-800 dark:text-purple-200">Ownership Management</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="ownershipRegistration"
                              name="ownershipMode"
                              value="REGISTRATION"
                              checked={formData.ownershipMode === 'REGISTRATION'}
                              onChange={(e) => handleInputChange('ownershipMode', e.target.value)}
                              className="text-purple-600"
                            />
                            <Label htmlFor="ownershipRegistration" className="text-sm cursor-pointer">
                              Owners register themselves
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="ownershipAdmin"
                              name="ownershipMode"
                              value="ADMIN_ASSIGN"
                              checked={formData.ownershipMode === 'ADMIN_ASSIGN'}
                              onChange={(e) => handleInputChange('ownershipMode', e.target.value)}
                              className="text-purple-600"
                            />
                            <Label htmlFor="ownershipAdmin" className="text-sm cursor-pointer">
                              Admin assigns owners
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Team Owner Assignment */}
                      {formData.ownershipMode === 'ADMIN_ASSIGN' && parseInt(formData.auctionTeamCount) > 0 && (
                        <div className="space-y-4">
                          <Label className="text-purple-800 dark:text-purple-200">
                            Assign Team Owners/Sponsors
                          </Label>
                          <div className="space-y-3">
                            {Array.from({ length: parseInt(formData.auctionTeamCount) || 0 }, (_, i) => {
                              const owner = getTeamOwner(i)
                              return (
                                <div key={i} className="p-3 border border-purple-200 rounded-lg space-y-3">
                                  <h5 className="font-medium text-purple-700">
                                    {auctionTeamNames[i] || `Team ${i + 1}`} Owner
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                      placeholder="Owner Name"
                                      value={owner.ownerName}
                                      onChange={(e) => updateTeamOwner(i, 'ownerName', e.target.value)}
                                      className="border-purple-200 text-sm"
                                    />
                                    <PhoneInput
                                      label=""
                                      value={owner.ownerPhone}
                                      onChange={(value) => updateTeamOwner(i, 'ownerPhone', value)}
                                      placeholder="Enter 10-digit mobile number"
                                    />
                                    <Input
                                      placeholder="Owner Email"
                                      type="email"
                                      value={owner.ownerEmail}
                                      onChange={(e) => updateTeamOwner(i, 'ownerEmail', e.target.value)}
                                      className="border-purple-200 text-sm"
                                    />
                                    <Input
                                      placeholder="Sponsor Name (Optional)"
                                      value={owner.sponsorName}
                                      onChange={(e) => updateTeamOwner(i, 'sponsorName', e.target.value)}
                                      className="border-purple-200 text-sm"
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded border border-purple-200">
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          <strong>💡 Team Ownership:</strong> Each team needs an owner/sponsor who pays the team entry fee 
                          and manages the team budget. {formData.ownershipMode === 'REGISTRATION' 
                            ? 'Owners will register themselves and claim teams.' 
                            : 'You can assign owners to teams here.'}
                        </p>
                      </div>
                    </div>

                    {/* Auction Rules */}
                    <div className="space-y-2">
                      <Label htmlFor="auctionRules">
                        Auction Rules & Guidelines
                        <span className="text-orange-600 ml-1">📋</span>
                      </Label>
                      <Textarea
                        id="auctionRules"
                        placeholder="Enter auction rules, player categories, bidding guidelines, points system..."
                        value={formData.auctionRules}
                        onChange={(e) => handleInputChange('auctionRules', e.target.value)}
                        className="min-h-[120px] border-orange-200"
                      />
                      <p className="text-xs text-orange-600 dark:text-orange-300">
                        Define how the auction will work, player categories, bidding rules, points system, etc.
                      </p>
                    </div>

                    {/* Tournament Preview */}
                    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-orange-200 dark:border-orange-700">
                      <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        IPL-Style Tournament Preview
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            🏆 {formData.auctionTeamCount} Teams
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            👥 {formData.playerPoolSize} Players Expected
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            💰 {formData.auctionBudget} Points/Team
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            🎯 {formData.groupsOptional ? 'No Groups' : `${formData.totalGroups} Groups`}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/30 rounded border border-orange-200">
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          <strong>🎉 IPL-Style Setup:</strong> Players register individually, teams bid with points budget, 
                          {formData.groupsOptional ? ' flexible tournament format without groups initially' : ` ${formData.totalGroups} groups format`}. 
                          Everything can be modified later based on registration numbers!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Venue Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <Label>Venue Information</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue Name *</Label>
                      <Select value={formData.venue} onValueChange={(value) => handleInputChange('venue', value)}>
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

                    {formData.venue === 'Custom Location' && (
                      <div className="space-y-2">
                        <Label htmlFor="venueAddress">Custom Location Details *</Label>
                        <Input
                          id="venueAddress"
                          placeholder="Enter custom location name/address"
                          value={formData.venueAddress}
                          onChange={(e) => handleInputChange('venueAddress', e.target.value)}
                          required={formData.venue === 'Custom Location'}
                        />
                      </div>
                    )}

                    {formData.venue === 'Custom Location' && (
                      <div className="space-y-2">
                        <Label htmlFor="customMapsLink">Custom Maps Link (Optional)</Label>
                        <Input
                          id="customMapsLink"
                          placeholder="https://maps.google.com/..."
                          value={formData.customMapsLink || ''}
                          onChange={(e) => handleInputChange('customMapsLink', e.target.value)}
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
                          let mapsUrl = '';
                          if (formData.venue === 'Tunda Cricket Ground') {
                            mapsUrl = 'https://maps.app.goo.gl/ZAS2CffMQdNqweqe6';
                          } else if (formData.venue === 'Custom Location' && formData.customMapsLink) {
                            mapsUrl = formData.customMapsLink;
                          }
                          if (mapsUrl) {
                            window.open(mapsUrl, '_blank');
                          }
                        }}
                        disabled={formData.venue === 'Custom Location' && !formData.customMapsLink}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        View on Maps
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="awards" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <Label>Prize Structure</Label>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addWinner}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Prize
                  </Button>
                </div>

                <div className="space-y-4">
                  {winners.map((winner, index) => (
                    <div key={index} className="flex gap-4 items-end">
                      <div className="space-y-2 w-24">
                        <Label>Position</Label>
                        <Input
                          type="number"
                          min="1"
                          value={winner.position}
                          onChange={(e) => updateWinner(index, 'position', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label>Prize/Award</Label>
                        <Input
                          placeholder="e.g., Trophy + KES 10,000"
                          value={winner.prize}
                          onChange={(e) => updateWinner(index, 'prize', e.target.value)}
                        />
                      </div>
                      {winners.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeWinner(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>                {winners.length > 0 && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Prize Preview:</h4>
                    <div className="space-y-1">
                      {winners
                        .filter(w => w.prize.trim())
                        .sort((a, b) => a.position - b.position)
                        .map((winner) => (
                          <div key={winner.position} className="flex items-center gap-2">
                            <Badge variant="secondary">{winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : `#${winner.position}`}</Badge>
                            <span className="text-sm">{winner.prize}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Other Awards Section */}
                <div className="space-y-4 mt-8 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <Label>Other Awards</Label>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addOtherAward}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Award
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {otherAwards.map((award, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>Award Name</Label>
                          <Input
                            placeholder="e.g., Best Bowler, Man of the Match"
                            value={award.prize}
                            onChange={(e) => updateOtherAward(index, 'prize', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Winner (Optional)</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Winner name (leave empty if TBD)"
                              value={award.winner}
                              onChange={(e) => updateOtherAward(index, 'winner', e.target.value)}
                            />
                            {otherAwards.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeOtherAward(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {otherAwards.some(a => a.prize.trim()) && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Other Awards Preview:</h4>
                      <div className="space-y-1">
                        {otherAwards
                          .filter(a => a.prize.trim())
                          .map((award, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge variant="outline">🏆</Badge>
                              <span className="text-sm">{award.prize}</span>
                              {award.winner && <span className="text-xs text-muted-foreground">- {award.winner}</span>}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="organizers" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <Label>Organizing Team</Label>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addOrganizer}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Organizer
                  </Button>
                </div>                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {organizers.map((organizer, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          placeholder="Full name"
                          value={organizer.name}
                          onChange={(e) => updateOrganizer(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select 
                          value={organizer.role} 
                          onValueChange={(value) => updateOrganizer(index, 'role', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORGANIZER_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {organizer.role === 'Custom Role' && (
                          <Input
                            placeholder="Enter custom role"
                            value={organizer.customRole}
                            onChange={(e) => updateOrganizer(index, 'customRole', e.target.value)}
                            className="mt-2"
                          />
                        )}
                      </div>
                      <div className="space-y-2 relative">
                        <Label>Phone Number</Label>
                        <div className="flex gap-2">
                          <PhoneInput
                            label=""
                            value={organizer.phone}
                            onChange={(value) => updateOrganizer(index, 'phone', value)}
                            placeholder="Enter 10-digit mobile number"
                          />
                          {organizers.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOrganizer(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email (Optional)</Label>
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={organizer.email}
                          onChange={(e) => updateOrganizer(index, 'email', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-6 mt-6">                <div className="space-y-2">
                  <Label htmlFor="rules">Tournament Rules & Regulations</Label>
                  <p className="text-sm text-muted-foreground">
                    Define the rules, regulations, and special conditions for your tournament
                  </p>
                </div>

                <div className="min-h-[300px] max-h-[500px] overflow-y-auto border rounded-md">
                  <RichTextEditor
                    content={formData.rules}
                    onChange={(content: string) => handleInputChange('rules', content)}
                    placeholder="Enter tournament rules, regulations, player eligibility, match conditions..."
                  />
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">💡 Suggested Rule Sections:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Player eligibility and registration requirements</li>
                    <li>• Match format and playing conditions</li>
                    <li>• Team composition and substitution rules</li>
                    <li>• Code of conduct and disciplinary procedures</li>
                    <li>• Weather and ground conditions policy</li>
                    <li>• Equipment and uniform specifications</li>
                  </ul>
                </div>
              </TabsContent>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-6 border-t">
                <div className="order-2 sm:order-1">
                  {currentTab !== 'basic' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        const tabs = ['basic', 'details', 'venue', 'scoring', 'awards', 'organizers', 'rules']
                        const currentIndex = tabs.indexOf(currentTab)
                        if (currentIndex > 0) setCurrentTab(tabs[currentIndex - 1])
                      }}
                    >
                      Previous
                    </Button>
                  )}
                </div>

                <div className="order-1 sm:order-2 flex gap-2">
                  {currentTab !== 'rules' ? (
                    <Button
                      type="button"
                      className="flex-1 sm:flex-none"
                      disabled={isNextDisabled()}
                      onClick={() => {
                        const tabs = ['basic', 'details', 'venue', 'scoring', 'awards', 'organizers', 'rules']
                        const currentIndex = tabs.indexOf(currentTab)
                        if (currentIndex < tabs.length - 1) setCurrentTab(tabs[currentIndex + 1])
                      }}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading || isNextDisabled()}
                      className="flex-1 sm:flex-none"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Trophy className="h-4 w-4 mr-2" />
                          Create Tournament
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Tabs>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateTournamentPage

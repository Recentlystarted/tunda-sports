'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Calendar, MapPin, Users, IndianRupee, Loader2, CheckCircle, AlertCircle, Search, DollarSign, X, Plus, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from "@/hooks/use-toast"

// Type definitions matching the API and schema
interface Tournament {
  id: string
  name: string
  format: string
  customFormat?: string
  venue: string
  venueAddress?: string
  startDate: string
  endDate?: string
  registrationDeadline?: string
  entryFee: number | null
  maxTeams?: number
  teamSize: number
  substitutes?: number
  ageLimit?: string
  status: string
  overs?: number
  description?: string
  requirements?: string[]
  registeredTeams?: number
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
}

interface Player {
  name: string
  age: number
  city?: string
  fatherName?: string
  position: 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER' | ''
  experience?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL' | ''
  phone: string
  email: string
  jerseyNumber?: number
  isSubstitute?: boolean
}

interface TeamRegistrationData {
  teamName: string
  captainName: string
  captainPhone: string
  captainEmail: string
  captainAge: number
  captainCity?: string
  captainFatherName?: string
  players: Player[]
  specialRequests?: string
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'
}

interface TeamRegistration {
  tournamentId: string
  teamName: string
  teamCity: string
  captainName: string
  captainPhone: string
  captainEmail: string
  captainAge: number
  players: Array<{
    name: string
    age: number
    city?: string
    fatherName?: string
    position: 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER' | ''
    experience?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL' | ''
    phone: string
    email: string
    isSubstitute?: boolean
    jerseyNumber?: number
  }>
  emergencyContact: {
    name: string
    phone: string
    relation: string
  }
  agreementAccepted: boolean
  paymentMethod: string
  specialRequests?: string
}

interface PaymentSettings {
  upiId: string;
  upiMobile: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  qrCodeUrl: string | null;
}

const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Tunda Premier League 2025',
    format: 'T20',
    startDate: '2025-07-15',
    endDate: '2025-07-25',
    registrationDeadline: '2025-07-01',
    venue: 'Tunda Cricket Ground, Kutch, Gujarat',
    entryFee: 2500,
    maxTeams: 16,
    registeredTeams: 8,
    teamSize: 11,
    substitutes: 4,
    ageLimit: '16+',
    status: 'registration-open',
    requirements: [
      'All players must be above 16 years of age',
      'Valid ID proof required for all players',
      'Team must have exactly 11 players and up to 4 substitutes',
      'Entry fee must be paid before registration deadline'
    ],
    contactPerson: 'Rajesh Patel',
    contactPhone: '+91 98765 43210',
    contactEmail: 'tournaments@tundacricket.com'
  }
]

// Debounce hook for search
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Enhanced PlayerSearchInput component
function PlayerSearchInput({ 
  onPlayerSelect, 
  placeholder = "Search player by name, city, or phone...",
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
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      searchPlayers(debouncedSearchTerm)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [debouncedSearchTerm])

  const searchPlayers = async (query: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/players?q=${encodeURIComponent(query)}&limit=8`)
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
  }

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
      
      {/* Search Results Dropdown */}
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
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    {player.city && <div>📍 {player.city}</div>}
                    {player.phone && <div>📞 {player.phone}</div>}
                    {player.team && <div>🏏 {player.team.name}</div>}
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

interface PlayerRegistrationProps {
  tournamentId?: string;
}

export default function PlayerRegistration({ tournamentId }: PlayerRegistrationProps) {
  const { toast } = useToast()
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [registration, setRegistration] = useState<TeamRegistration>({
    tournamentId: '',
    teamName: '',
    teamCity: '',
    captainName: '',
    captainPhone: '',
    captainEmail: '',
    captainAge: 18,
    players: [],
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    },
    agreementAccepted: false,
    paymentMethod: 'upi'
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tournament, setTournament] = useState<any>(null);
  const [error, setError] = useState('');

  // Fetch tournament data when tournamentId is provided
  useEffect(() => {
    if (tournamentId) {
      fetchTournament()
    }
    fetchPaymentSettings()
  }, [tournamentId])

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/admin/payment-settings')
      if (response.ok) {
        const data = await response.json()
        setPaymentSettings(data)
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error)
    }
  }

  const fetchTournament = async () => {
    if (!tournamentId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      if (response.ok) {
        const data = await response.json()
        const tournamentData = data.tournament
        setTournament(tournamentData)
        
        // Convert API tournament data to component format and initialize
        const formattedTournament: Tournament = {
          id: tournamentData.id.toString(),
          name: tournamentData.name,
          format: tournamentData.format,
          startDate: tournamentData.startDate.split('T')[0],
          endDate: tournamentData.endDate.split('T')[0],
          registrationDeadline: tournamentData.registrationDeadline ? tournamentData.registrationDeadline.split('T')[0] : tournamentData.startDate.split('T')[0],
          venue: tournamentData.venue,
          entryFee: tournamentData.entryFee || 0,
          maxTeams: tournamentData.maxTeams || 16,
          registeredTeams: tournamentData._count?.registrations || 0,
          teamSize: tournamentData.teamSize || 11,
          substitutes: tournamentData.substitutes || 4,
          ageLimit: tournamentData.ageLimit || '',
          status: tournamentData.status === 'REGISTRATION_OPEN' ? 'registration-open' : 'registration-closed',
          requirements: [
            'All players must be at least 16 years old',
            'Team captain must provide valid contact information',
            'Registration fee must be paid before the deadline',
            'All players must submit required documents',
            'Team must have minimum required players'
          ],
          contactPerson: 'Tournament Organizer',
          contactPhone: '7878601525',
          contactEmail: 'info@tundasportsclub.com'
        }
        
        // Initialize registration with this tournament
        initializeRegistration(formattedTournament)
      } else {
        setError('Tournament not found')
      }
    } catch (error) {
      console.error('Error fetching tournament:', error)
      setError('Failed to load tournament details')
    } finally {
      setLoading(false)
    }
  }

  const initializeRegistration = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    
    // Initialize players array
    const playersArray = Array(tournament.teamSize).fill(null).map((_, index) => ({
      name: index === 0 ? '' : '', // Captain will be auto-filled
      age: 18,
      city: '',
      fatherName: '',
      position: 'BATSMAN' as const,
      experience: 'BEGINNER' as const,
      phone: '',
      email: '',
      isSubstitute: false
    }))
    
    setRegistration(prev => ({
      ...prev,
      tournamentId: tournament.id,
      players: playersArray
    }))
  }

  // Update captain and sync with Player 1
  const updateCaptainAndFirstPlayer = (field: string, value: any) => {
    setRegistration(prev => {
      const updated = { ...prev, [field]: value }
      
      // Sync captain details to Player 1
      if (updated.players.length > 0) {
        const updatedPlayers = [...updated.players]
        const captainMapping: Record<string, string> = {
          'captainName': 'name',
          'captainPhone': 'phone', 
          'captainEmail': 'email',
          'captainAge': 'age'
        }
        
        if (captainMapping[field]) {
          updatedPlayers[0] = {
            ...updatedPlayers[0],
            [captainMapping[field]]: value
          }
        }
        
        updated.players = updatedPlayers
      }
      
      return updated
    })
  }

  const addSubstitute = () => {
    if (!selectedTournament) return
    const substitutes = registration.players.filter(p => p.isSubstitute).length
    if (substitutes < (selectedTournament.substitutes || 0)) {
      setRegistration(prev => ({
        ...prev,
        players: [...prev.players, {
          name: '',
          age: 18,
          position: 'BATSMAN',
          experience: 'BEGINNER',
          phone: '',
          email: '',
          isSubstitute: true
        }]
      }))
    }
  }

  const removePlayer = (index: number) => {
    if (!selectedTournament) return
    const player = registration.players[index]
    if (player.isSubstitute) {
      setRegistration(prev => ({
        ...prev,
        players: prev.players.filter((_, i) => i !== index)
      }))
    }
  }

  const updatePlayer = (index: number, field: keyof Player, value: any) => {
    setRegistration(prev => ({
      ...prev,
      players: prev.players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }))
  }

  const handlePlayerSelect = (index: number, selectedPlayer: any) => {
    updatePlayer(index, 'name', selectedPlayer.name)
    updatePlayer(index, 'age', selectedPlayer.age || 18)
    updatePlayer(index, 'city', selectedPlayer.city || '')
    updatePlayer(index, 'fatherName', selectedPlayer.fatherName || '')
    updatePlayer(index, 'phone', selectedPlayer.phone || '')
    updatePlayer(index, 'email', selectedPlayer.email || '')
    updatePlayer(index, 'position', selectedPlayer.position || 'BATSMAN')
    updatePlayer(index, 'experience', selectedPlayer.experience || 'BEGINNER')
    updatePlayer(index, 'jerseyNumber', selectedPlayer.jerseyNumber || undefined)
    
    toast({
      title: "Player Auto-filled",
      description: `${selectedPlayer.name}'s details have been loaded`,
    })
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []
    
    // Team details validation
    if (!registration.teamName.trim()) newErrors.push('Team name is required')
    if (!registration.teamCity?.trim()) newErrors.push('Team city/village is required')
    if (!registration.captainName.trim()) newErrors.push('Captain name is required')
    if (!registration.captainPhone.trim()) newErrors.push('Captain phone is required')
    if (!registration.captainEmail.trim()) newErrors.push('Captain email is required')
    
    // Players validation
    const mainPlayers = registration.players.filter(p => !p.isSubstitute)
    if (mainPlayers.length !== selectedTournament?.teamSize) {
      newErrors.push(`You need exactly ${selectedTournament?.teamSize} main players`)
    }
    
    registration.players.forEach((player, index) => {
      if (!player.name.trim()) newErrors.push(`Player ${index + 1} name is required`)
      if (!player.phone.trim()) newErrors.push(`Player ${index + 1} phone is required`)
      if (player.age < 16) newErrors.push(`Player ${index + 1} must be at least 16 years old`)
    })

    // Emergency contact validation
    if (!registration.emergencyContact.name.trim()) newErrors.push('Emergency contact name is required')
    if (!registration.emergencyContact.phone.trim()) newErrors.push('Emergency contact phone is required')
    if (!registration.emergencyContact.relation.trim()) newErrors.push('Emergency contact relation is required')
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  // Mobile-optimized scrollbar styles
  const scrollbarStyles = {
    scrollbarWidth: 'thin' as const,
    scrollbarColor: 'rgb(203 213 225) transparent',
  }

  if (submitSuccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your team "{registration.teamName}" has been successfully registered for {selectedTournament?.name}.
            </p>
            <Button onClick={() => window.location.reload()}>
              Register Another Team
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-3 py-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading tournament details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-3 py-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!selectedTournament) {
    // If we have tournamentId but no selectedTournament yet, show loading
    if (tournamentId) {
      return (
        <div className="container mx-auto px-3 py-6 max-w-4xl">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading tournament details...</p>
            </div>
          </div>
        </div>
      )
    }

    // Show tournament selection only if no tournamentId provided
    return (
      <div className="container mx-auto px-3 py-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Team Registration</h1>
          <p className="text-muted-foreground">Choose a tournament to register your team</p>
        </div>
        
        <div className="space-y-4 max-w-4xl mx-auto">
          {mockTournaments.map(tournament => (
            <Card key={tournament.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-lg md:text-xl font-semibold">{tournament.name}</h3>
                      <Badge variant="secondary">{tournament.format}</Badge>
                      <Badge variant={tournament.status === 'registration-open' ? 'default' : 'secondary'}>
                        {tournament.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{tournament.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>₹{tournament.entryFee?.toLocaleString() || 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{tournament.registeredTeams}/{tournament.maxTeams} teams</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => initializeRegistration(tournament)}
                    disabled={tournament.status !== 'registration-open'}
                    className="w-full sm:w-auto"
                  >
                    Register Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-2">{selectedTournament.name}</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">{selectedTournament.format}</Badge>
          <span className="text-muted-foreground">₹{selectedTournament.entryFee?.toLocaleString() || 'TBA'}</span>
        </div>
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Team Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Details
            </CardTitle>
            <CardDescription>
              Provide basic information about your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  value={registration.teamName}
                  onChange={(e) => setRegistration(prev => ({ ...prev, teamName: e.target.value }))}
                  placeholder="Enter your team name"
                />
              </div>
              <div>
                <Label htmlFor="teamCity">Team City/Village *</Label>
                <Input
                  id="teamCity"
                  value={registration.teamCity || ''}
                  onChange={(e) => setRegistration(prev => ({ ...prev, teamCity: e.target.value }))}
                  placeholder="e.g., Tunda, Bhuj, Anjar"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="captainName">Captain Name *</Label>
                <Input
                  id="captainName"
                  value={registration.captainName}
                  onChange={(e) => updateCaptainAndFirstPlayer('captainName', e.target.value)}
                  placeholder="Captain's full name"
                />
              </div>
              <div>
                <Label htmlFor="captainAge">Captain Age *</Label>
                <Input
                  id="captainAge"
                  type="number"
                  value={registration.captainAge}
                  onChange={(e) => updateCaptainAndFirstPlayer('captainAge', parseInt(e.target.value) || 18)}
                  min={16}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="captainPhone">Captain Phone *</Label>
                <Input
                  id="captainPhone"
                  value={registration.captainPhone}
                  onChange={(e) => updateCaptainAndFirstPlayer('captainPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label htmlFor="captainEmail">Captain Email *</Label>
                <Input
                  id="captainEmail"
                  type="email"
                  value={registration.captainEmail}
                  onChange={(e) => updateCaptainAndFirstPlayer('captainEmail', e.target.value)}
                  placeholder="captain@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Players
              </div>
              <Badge variant="outline">
                {registration.players.filter(p => !p.isSubstitute).length}/{selectedTournament.teamSize} + {registration.players.filter(p => p.isSubstitute).length} subs
              </Badge>
            </CardTitle>
            <CardDescription>
              Add {selectedTournament.teamSize} main players and up to {selectedTournament.substitutes} substitutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="space-y-4 max-h-96 overflow-y-auto pr-2"
              style={scrollbarStyles}
            >
              {registration.players.map((player, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">
                      {player.isSubstitute ? `Substitute ${registration.players.filter(p => p.isSubstitute).indexOf(player) + 1}` : `Player ${index + 1}`}
                      {index === 0 && !player.isSubstitute && (
                        <Badge variant="secondary" className="ml-2 text-xs">Captain</Badge>
                      )}
                    </h4>
                    <div className="flex items-center gap-2">
                      {player.isSubstitute && (
                        <Badge variant="secondary" className="text-xs">SUB</Badge>
                      )}
                      {player.isSubstitute && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePlayer(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Captain auto-fill notice */}
                  {index === 0 && !player.isSubstitute && (
                    <Alert className="mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Player 1 is automatically filled with captain details. You can modify them if needed.
                      </AlertDescription>
                    </Alert>
                  )}

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <Label className="text-xs">Age *</Label>
                      <Input
                        type="number"
                        value={player.age}
                        onChange={(e) => updatePlayer(index, 'age', parseInt(e.target.value) || 18)}
                        min={16}
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
                        value={player.email}
                        onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                        placeholder="player@example.com"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                </div>
              ))}
            </div>

            {/* Add substitute button */}
            {registration.players.filter(p => p.isSubstitute).length < (selectedTournament.substitutes || 0) && (
              <Button
                variant="outline"
                onClick={addSubstitute}
                className="w-full mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Substitute Player ({registration.players.filter(p => p.isSubstitute).length}/{selectedTournament.substitutes})
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
            <CardDescription>
              Provide emergency contact details for the team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emergencyName">Emergency Contact Name *</Label>
              <Input
                id="emergencyName"
                value={registration.emergencyContact.name}
                onChange={(e) => setRegistration(prev => ({
                  ...prev,
                  emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                }))}
                placeholder="Contact person name"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyPhone">Emergency Phone *</Label>
                <Input
                  id="emergencyPhone"
                  value={registration.emergencyContact.phone}
                  onChange={(e) => setRegistration(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                  }))}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label htmlFor="emergencyRelation">Relation *</Label>
                <Select 
                  value={registration.emergencyContact.relation}
                  onValueChange={(value) => setRegistration(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relation: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <Textarea
                id="specialRequests"
                value={registration.specialRequests || ''}
                onChange={(e) => setRegistration(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="Any special requirements or requests..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment & Agreement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment & Agreement
            </CardTitle>
            <CardDescription>
              Complete payment and accept terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment details */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Registration Fee</h4>
              <div className="text-2xl font-bold text-primary">₹{selectedTournament.entryFee?.toLocaleString() || 'TBA'}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Entry fee for {selectedTournament.name}
              </p>
            </div>

            {/* Payment method */}
            <div>
              <Label>Payment Method *</Label>
              <Select 
                value={registration.paymentMethod}
                onValueChange={(value) => setRegistration(prev => ({ ...prev, paymentMethod: value as any }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI Payment</SelectItem>
                  <SelectItem value="online">Online Banking</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="cash">Cash (Pay at venue)</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Details */}
            {registration.paymentMethod && ['upi', 'bank-transfer'].includes(registration.paymentMethod) && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {registration.paymentMethod === 'upi' ? (
                      <>📱 UPI Payment Details</>
                    ) : (
                      <>🏦 Bank Transfer Details</>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingPaymentSettings ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Loading payment details...
                    </div>
                  ) : paymentSettings ? (
                    <>
                      {registration.paymentMethod === 'upi' && paymentSettings.upiId && (
                        <div className="space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">UPI ID</Label>
                              <div className="p-3 bg-white dark:bg-gray-800 border rounded-lg font-mono text-sm">
                                {paymentSettings.upiId}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</Label>
                              <div className="p-3 bg-white dark:bg-gray-800 border rounded-lg font-mono text-sm">
                                {paymentSettings.upiMobile}
                              </div>
                            </div>
                          </div>
                          
                          {paymentSettings.qrCodeUrl && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">QR Code</Label>
                              <div className="flex justify-center p-4 bg-white dark:bg-gray-800 border rounded-lg">
                                <img 
                                  src={paymentSettings.qrCodeUrl} 
                                  alt="UPI QR Code" 
                                  className="w-32 h-32 sm:w-40 sm:h-40"
                                />
                              </div>
                            </div>
                          )}
                          
                          <div className="p-3 bg-white dark:bg-gray-800 border-l-4 border-blue-500 rounded-r-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Amount:</strong> ₹{selectedTournament.entryFee}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Scan the QR code or use the UPI ID above to make payment. 
                              After payment, your registration will be confirmed.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {registration.paymentMethod === 'bank-transfer' && paymentSettings.bankAccountName && (
                        <div className="space-y-4">
                          <div className="grid gap-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Name</Label>
                                <div className="p-3 bg-white dark:bg-gray-800 border rounded-lg text-sm">
                                  {paymentSettings.bankAccountName}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</Label>
                                <div className="p-3 bg-white dark:bg-gray-800 border rounded-lg font-mono text-sm">
                                  {paymentSettings.bankAccountNumber}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</Label>
                                <div className="p-3 bg-white dark:bg-gray-800 border rounded-lg text-sm">
                                  {paymentSettings.bankName}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">IFSC Code</Label>
                                <div className="p-3 bg-white dark:bg-gray-800 border rounded-lg font-mono text-sm">
                                  {paymentSettings.ifscCode}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch</Label>
                              <div className="p-3 bg-white dark:bg-gray-800 border rounded-lg text-sm">
                                {paymentSettings.branchName}
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-white dark:bg-gray-800 border-l-4 border-blue-500 rounded-r-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Amount:</strong> ₹{selectedTournament.entryFee}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Transfer the exact amount to the above bank account. 
                              Please use your team name as reference while making the transfer.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Payment details are not configured yet. Please contact the organizers for payment information.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Agreement */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Tournament Requirements</Label>
              <div className="space-y-2 text-sm">
                {selectedTournament.requirements?.map((req, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={registration.agreementAccepted}
                  onChange={(e) => setRegistration(prev => ({ ...prev, agreementAccepted: e.target.checked }))}
                  className="mt-0.5"
                />
                <Label htmlFor="agreement" className="text-sm leading-relaxed">
                  I accept all tournament rules and requirements. I understand that the registration fee is non-refundable and that all player information provided is accurate.
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit button */}
      <div className="flex justify-end mt-6">
        <Button 
          onClick={async () => {
            if (validateForm() && registration.agreementAccepted) {
              setIsSubmitting(true)
              try {
                // Prepare registration data
                const registrationData = {
                  tournamentId: selectedTournament.id.toString(),
                  teamName: registration.teamName,
                  captainName: registration.captainName,
                  captainPhone: registration.captainPhone,
                  captainEmail: registration.captainEmail,
                  captainAge: registration.captainAge,
                  homeGround: registration.teamCity || '',
                  description: `Team from ${registration.teamCity || 'Unknown'}`,
                  emergencyContact: registration.emergencyContact,
                  paymentMethod: registration.paymentMethod,
                  players: registration.players.map(player => ({
                    name: player.name,
                    age: player.age,
                    position: player.position,
                    experience: player.experience,
                    city: player.city || '',
                    fatherName: player.fatherName || '',
                    phone: player.phone,
                    email: player.email,
                    jerseyNumber: player.jerseyNumber,
                    isSubstitute: player.isSubstitute
                  })),
                  specialRequests: registration.specialRequests || ''
                }

                const response = await fetch('/api/teams/register', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(registrationData)
                })

                if (response.ok) {
                  const result = await response.json()
                  setSubmitSuccess(true)
                  toast({
                    title: "Registration Successful!",
                    description: "Your team has been registered. You will receive a confirmation email shortly.",
                  })
                } else {
                  const errorData = await response.json()
                  throw new Error(errorData.error || 'Registration failed')
                }
              } catch (error) {
                console.error('Registration error:', error)
                toast({
                  title: "Registration Failed",
                  description: error instanceof Error ? error.message : "Please try again later.",
                  variant: "destructive",
                })
              } finally {
                setIsSubmitting(false)
              }
            } else if (!registration.agreementAccepted) {
              toast({
                title: "Agreement Required",
                description: "Please accept the tournament rules and requirements",
                variant: "destructive",
              })
            }
          }}
          disabled={isSubmitting || !registration.agreementAccepted}
          className="w-full sm:w-auto min-w-48"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </div>
    </div>
  )
}

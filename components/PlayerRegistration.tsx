'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Users, Phone, Mail, Calendar, MapPin, Trophy, DollarSign, AlertCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Tournament {
  id: number
  name: string
  format: string
  startDate: string
  endDate: string
  registrationDeadline: string
  venue: string
  entryFee: number
  prizePool: number
  maxTeams: number
  registeredTeams: number
  teamSize: number
  substitutes: number
  ageLimit: string
  status: 'registration-open' | 'registration-closed' | 'upcoming' | 'ongoing' | 'completed'
  requirements: string[]
  contactPerson: string
  contactPhone: string
  contactEmail: string
}

interface Player {
  name: string
  age: number
  position: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper'
  experience: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional'
  phone: string
  email: string
  isSubstitute: boolean
  jerseyNumber?: number
}

interface TeamRegistration {
  tournamentId: number
  teamName: string
  captainName: string
  captainPhone: string
  captainEmail: string
  captainAge: number
  teamLogo?: string
  players: Player[]
  emergencyContact: {
    name: string
    phone: string
    relation: string
  }
  specialRequests?: string
  agreementAccepted: boolean
  paymentMethod: 'online' | 'cash' | 'bank-transfer' | 'upi' | 'card'
}

const mockTournaments: Tournament[] = [
  {
    id: 1,
    name: 'Tunda Premier League 2025',
    format: 'T20',
    startDate: '2025-07-15',
    endDate: '2025-07-25',
    registrationDeadline: '2025-07-01',
    venue: 'Tunda Cricket Ground, Kutch, Gujarat',
    entryFee: 2500,
    prizePool: 50000,
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
      'Entry fee must be paid before registration deadline',
      'Teams must arrive 30 minutes before match time',
      'All players must sign the waiver form'
    ],
    contactPerson: 'Rajesh Patel',
    contactPhone: '+91 98765 43210',
    contactEmail: 'tournaments@tundacricket.com'
  },
  {
    id: 2,
    name: 'Village Championship Cup',
    format: 'ODI',
    startDate: '2025-08-10',
    endDate: '2025-08-20',
    registrationDeadline: '2025-07-25',
    venue: 'Tunda Cricket Ground, Kutch, Gujarat',
    entryFee: 3000,
    prizePool: 75000,
    maxTeams: 12,
    registeredTeams: 4,
    teamSize: 11,
    substitutes: 4,
    ageLimit: '18+',
    status: 'registration-open',
    requirements: [
      'All players must be above 18 years of age',
      'Valid government ID proof required',
      'Team must have exactly 11 players and up to 4 substitutes',
      'Entry fee must be paid in full before deadline',
      'Medical certificate required for all players',
      'Team jersey must be uniform'
    ],
    contactPerson: 'Manish Shah',
    contactPhone: '+91 98765 43211',
    contactEmail: 'village.championship@tundacricket.com'
  }
]

export default function PlayerRegistration() {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [registration, setRegistration] = useState<TeamRegistration>({
    tournamentId: 0,
    teamName: '',
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
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [existingTeams, setExistingTeams] = useState<any[]>([])
  const [teamSearchTerm, setTeamSearchTerm] = useState('')
  const [showTeamSearch, setShowTeamSearch] = useState(false)
  const [selectedExistingTeam, setSelectedExistingTeam] = useState<any>(null)

  // Fetch existing teams for search
  useEffect(() => {
    fetchExistingTeams();
  }, []);

  const fetchExistingTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const teams = await response.json();
        setExistingTeams(teams);
      }
    } catch (error) {
      console.error('Error fetching existing teams:', error);
    }
  };

  const handleExistingTeamSelect = (team: any) => {
    setSelectedExistingTeam(team);
    setRegistration(prev => ({
      ...prev,
      teamName: team.name,
      captainName: team.captainName || '',
      captainPhone: team.captainPhone || '',
      captainEmail: team.captainEmail || '',
      // Auto-fill players if they exist
      players: team.players && team.players.length > 0 
        ? team.players.map((player: any) => ({
            name: player.name || '',
            age: player.age || 18,
            position: player.position || 'Batsman',
            experience: player.experience || 'Beginner',
            phone: player.phone || '',
            email: player.email || '',
            isSubstitute: player.isSubstitute || false,
            jerseyNumber: player.jerseyNumber
          }))
        : prev.players
    }));
    setShowTeamSearch(false);
    setTeamSearchTerm('');
  };

  const filteredTeams = existingTeams.filter(team =>
    team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
    (team.captainName && team.captainName.toLowerCase().includes(teamSearchTerm.toLowerCase()))
  );

  const initializeRegistration = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setRegistration(prev => ({
      ...prev,
      tournamentId: tournament.id,
      players: Array(tournament.teamSize).fill(null).map(() => ({
        name: '',
        age: 18,
        position: 'Batsman',
        experience: 'Beginner',
        phone: '',
        email: '',
        isSubstitute: false
      }))
    }))
    setCurrentStep(1)
  }

  const addSubstitute = () => {
    if (!selectedTournament) return
    const substitutes = registration.players.filter(p => p.isSubstitute).length
    if (substitutes < selectedTournament.substitutes) {
      setRegistration(prev => ({
        ...prev,
        players: [...prev.players, {
          name: '',
          age: 18,
          position: 'Batsman',
          experience: 'Beginner',
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

  const validateRegistration = (): boolean => {
    const newErrors: string[] = []

    // Team details validation
    if (!registration.teamName.trim()) newErrors.push('Team name is required')
    if (!registration.captainName.trim()) newErrors.push('Captain name is required')
    if (!registration.captainPhone.trim()) newErrors.push('Captain phone is required')
    if (!registration.captainEmail.trim()) newErrors.push('Captain email is required')
    if (registration.captainAge < (selectedTournament?.ageLimit === '18+' ? 18 : 16)) {
      newErrors.push(`Captain must be ${selectedTournament?.ageLimit}`)
    }

    // Players validation
    const mainPlayers = registration.players.filter(p => !p.isSubstitute)
    const substitutes = registration.players.filter(p => p.isSubstitute)

    if (mainPlayers.length !== selectedTournament?.teamSize) {
      newErrors.push(`Must have exactly ${selectedTournament?.teamSize} main players`)
    }

    registration.players.forEach((player, index) => {
      if (!player.name.trim()) newErrors.push(`Player ${index + 1} name is required`)
      if (!player.phone.trim()) newErrors.push(`Player ${index + 1} phone is required`)
      if (player.age < (selectedTournament?.ageLimit === '18+' ? 18 : 16)) {
        newErrors.push(`Player ${player.name || index + 1} must be ${selectedTournament?.ageLimit}`)
      }
    })

    // Emergency contact validation
    if (!registration.emergencyContact.name.trim()) newErrors.push('Emergency contact name is required')
    if (!registration.emergencyContact.phone.trim()) newErrors.push('Emergency contact phone is required')

    // Agreement validation
    if (!registration.agreementAccepted) newErrors.push('You must accept the terms and conditions')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const submitRegistration = async () => {
    if (!validateRegistration()) {
      return;
    }

    try {
      setErrors([]);
      
      // Prepare the data for submission
      const registrationData = {
        tournamentId: selectedTournament?.id?.toString() || '',
        teamName: registration.teamName,
        captainName: registration.captainName,
        captainPhone: registration.captainPhone,
        captainEmail: registration.captainEmail,
        captainAge: registration.captainAge,
        emergencyContact: registration.emergencyContact,
        paymentMethod: registration.paymentMethod,
        players: registration.players.filter(p => p.name), // Only include filled players
        specialRequests: registration.specialRequests || '' // Properly handle special requests
      };

      const response = await fetch('/api/teams/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration submitted successfully! You will receive a confirmation email shortly.');
        // Reset form
        setSelectedTournament(null);
        setCurrentStep(1);
        setRegistration({
          tournamentId: 0,
          teamName: '',
          captainName: '',
          captainPhone: '',
          captainEmail: '',
          captainAge: 18,
          players: [],
          emergencyContact: { name: '', phone: '', relation: '' },
          specialRequests: '',
          agreementAccepted: false,
          paymentMethod: 'upi'
        });
      } else {
        const errorMessage = data.error || 'Failed to submit registration';
        setErrors([errorMessage]);
        if (data.details) {
          setErrors(prev => [...prev, ...data.details]);
        }
      }
    } catch (error) {
      console.error('Registration submission error:', error);
      setErrors(['Failed to submit registration. Please try again.']);
    }
  }

  if (!selectedTournament) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tournament Registration</h2>
          <p className="text-xl text-gray-600">
            Register your team for upcoming cricket tournaments at Tunda Cricket Ground
          </p>
        </div>

        <div className="grid gap-6">
          {mockTournaments.filter(t => t.status === 'registration-open').map(tournament => (
            <Card key={tournament.id} className="w-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      {tournament.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {tournament.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {tournament.registeredTeams}/{tournament.maxTeams} teams
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Open for Registration
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{tournament.format}</div>
                    <div className="text-sm text-gray-600">Format</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₹{tournament.entryFee}</div>
                    <div className="text-sm text-gray-600">Entry Fee</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">₹{tournament.prizePool}</div>
                    <div className="text-sm text-gray-600">Prize Pool</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{tournament.ageLimit}</div>
                    <div className="text-sm text-gray-600">Age Limit</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {tournament.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <strong>Registration Deadline:</strong> {new Date(tournament.registrationDeadline).toLocaleDateString()}
                  </div>
                  <Button 
                    onClick={() => initializeRegistration(tournament)}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Register Team
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>Contact:</strong> {tournament.contactPerson} | 
                    <span className="mx-2">{tournament.contactPhone}</span> | 
                    <span className="mx-2">{tournament.contactEmail}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Team Registration</h2>
          <p className="text-gray-600">{selectedTournament.name}</p>
        </div>
        <Button variant="outline" onClick={() => setSelectedTournament(null)}>
          ← Back to Tournaments
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3, 4].map(step => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 4 && (
              <div className={`w-16 h-1 ${currentStep > step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Team Details */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Team Details</CardTitle>
            <CardDescription>Provide basic information about your team or select an existing team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Team Search */}
            <div className="space-y-2">
              <Label>Register Existing Team (Optional)</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search for existing team..."
                    value={teamSearchTerm}
                    onChange={(e) => {
                      setTeamSearchTerm(e.target.value);
                      setShowTeamSearch(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowTeamSearch(teamSearchTerm.length > 0)}
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  
                  {/* Search Results Dropdown */}
                  {showTeamSearch && filteredTeams.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredTeams.slice(0, 5).map((team) => (
                        <div
                          key={team.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleExistingTeamSelect(team)}
                        >
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Captain: {team.captainName || 'Not specified'} | 
                            Players: {team.players?.length || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setSelectedExistingTeam(null);
                    setRegistration(prev => ({
                      ...prev,
                      teamName: '',
                      captainName: '',
                      captainPhone: '',
                      captainEmail: '',
                      players: Array(selectedTournament?.teamSize || 11).fill(null).map(() => ({
                        name: '',
                        age: 18,
                        position: 'Batsman',
                        experience: 'Beginner',
                        phone: '',
                        email: '',
                        isSubstitute: false
                      }))
                    }));
                  }}
                >
                  Clear
                </Button>
              </div>
              {selectedExistingTeam && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Team "{selectedExistingTeam.name}" selected. Details have been auto-filled. You can still modify them below.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                value={registration.teamName}
                onChange={(e) => setRegistration(prev => ({ ...prev, teamName: e.target.value }))}
                placeholder="Enter your team name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="captainName">Captain Name *</Label>
                <Input
                  id="captainName"
                  value={registration.captainName}
                  onChange={(e) => setRegistration(prev => ({ ...prev, captainName: e.target.value }))}
                  placeholder="Captain's full name"
                />
              </div>
              <div>
                <Label htmlFor="captainAge">Captain Age *</Label>
                <Input
                  id="captainAge"
                  type="number"
                  value={registration.captainAge}
                  onChange={(e) => setRegistration(prev => ({ ...prev, captainAge: parseInt(e.target.value) || 18 }))}
                  min={selectedTournament.ageLimit === '18+' ? 18 : 16}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="captainPhone">Captain Phone *</Label>
                <Input
                  id="captainPhone"
                  value={registration.captainPhone}
                  onChange={(e) => setRegistration(prev => ({ ...prev, captainPhone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label htmlFor="captainEmail">Captain Email *</Label>
                <Input
                  id="captainEmail"
                  type="email"
                  value={registration.captainEmail}
                  onChange={(e) => setRegistration(prev => ({ ...prev, captainEmail: e.target.value }))}
                  placeholder="captain@email.com"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)}>
                Next: Add Players
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Player Details */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Step 2: Player Details</CardTitle>
                <CardDescription>
                  Add {selectedTournament.teamSize} main players and up to {selectedTournament.substitutes} substitutes
                </CardDescription>
              </div>
              <Button 
                onClick={addSubstitute}
                variant="outline"
                disabled={registration.players.filter(p => p.isSubstitute).length >= selectedTournament.substitutes}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Substitute
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {registration.players.map((player, index) => (
              <div key={index} className={`p-4 border rounded-lg ${player.isSubstitute ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">
                    {player.isSubstitute ? `Substitute ${registration.players.filter((p, i) => p.isSubstitute && i <= index).length}` : `Player ${index + 1}`}
                  </h4>
                  {player.isSubstitute && (
                    <Button variant="destructive" size="sm" onClick={() => removePlayer(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Player Name *</Label>
                    <Input
                      value={player.name}
                      onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label>Age *</Label>
                    <Input
                      type="number"
                      value={player.age}
                      onChange={(e) => updatePlayer(index, 'age', parseInt(e.target.value) || 18)}
                      min={selectedTournament.ageLimit === '18+' ? 18 : 16}
                    />
                  </div>
                  <div>
                    <Label>Position *</Label>
                    <Select value={player.position} onValueChange={(value) => updatePlayer(index, 'position', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Batsman">Batsman</SelectItem>
                        <SelectItem value="Bowler">Bowler</SelectItem>
                        <SelectItem value="All-rounder">All-rounder</SelectItem>
                        <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Experience *</Label>
                    <Select value={player.experience} onValueChange={(value) => updatePlayer(index, 'experience', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      value={player.phone}
                      onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={player.email}
                      onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                      placeholder="player@email.com"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                ← Previous
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                Next: Emergency Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Emergency Contact */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Emergency Contact</CardTitle>
            <CardDescription>Provide emergency contact details</CardDescription>
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
                placeholder="Full name of emergency contact"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
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
                <Label htmlFor="emergencyRelation">Relation</Label>
                <Input
                  id="emergencyRelation"
                  value={registration.emergencyContact.relation}
                  onChange={(e) => setRegistration(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relation: e.target.value }
                  }))}
                  placeholder="e.g., Father, Mother, Brother"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                ← Previous
              </Button>
              <Button onClick={() => setCurrentStep(4)}>
                Next: Review & Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Review & Submit</CardTitle>
            <CardDescription>Review your registration details and submit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Registration Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Team Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Team Name:</strong> {registration.teamName}</div>
                  <div><strong>Captain:</strong> {registration.captainName} ({registration.captainAge} years)</div>
                  <div><strong>Phone:</strong> {registration.captainPhone}</div>
                  <div><strong>Email:</strong> {registration.captainEmail}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Tournament Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Tournament:</strong> {selectedTournament.name}</div>
                  <div><strong>Format:</strong> {selectedTournament.format}</div>
                  <div><strong>Entry Fee:</strong> ₹{selectedTournament.entryFee}</div>
                  <div><strong>Date:</strong> {new Date(selectedTournament.startDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Players Summary</h4>
              <div className="text-sm">
                <div>Main Players: {registration.players.filter(p => !p.isSubstitute).length}</div>
                <div>Substitutes: {registration.players.filter(p => p.isSubstitute).length}</div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label>Payment Method *</Label>
              <Select value={registration.paymentMethod} onValueChange={(value: any) => 
                setRegistration(prev => ({ ...prev, paymentMethod: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI Payment</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash Payment</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="agreement"
                checked={registration.agreementAccepted}
                onChange={(e) => setRegistration(prev => ({ ...prev, agreementAccepted: e.target.checked }))}
                className="mt-1"
              />
              <Label htmlFor="agreement" className="text-sm">
                I agree to the tournament terms and conditions, understand that entry fees are non-refundable, 
                and confirm that all provided information is accurate. I also acknowledge that participants 
                play at their own risk.
              </Label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                ← Previous
              </Button>
              <Button 
                onClick={submitRegistration}
                className="bg-green-600 hover:bg-green-700"
                disabled={!registration.agreementAccepted}
              >
                <Save className="h-4 w-4 mr-2" />
                Submit Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

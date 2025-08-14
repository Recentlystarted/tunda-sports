'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Edit, Trash2, Save, Trophy, Calendar, Users, MapPin, 
  Clock, Award, Phone, Mail, User, IndianRupee, Crown, 
  Medal, Gift, X, AlertTriangle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import RichTextEditor from '@/components/ui/rich-text-editor'

interface Tournament {
  id: string
  name: string
  description: string
  format: string
  customFormat?: string
  venue: string
  startDate: string
  endDate: string
  registrationDeadline: string
  maxTeams: number
  entryFee: number
  prizePool: number
  ageLimit: string
  teamSize: number
  substitutes: number
  status: string
  rules: string
  requirements: string[]
  organizers: TournamentOrganizer[]
  winner?: string
  runnerUp?: string
  manOfTheSeries?: string
  winnerPrize?: number
  runnerUpPrize?: number
  manOfTheSeriesAwards: TournamentAward[]
  _count?: {
    registrations: number
  }
}

interface TournamentOrganizer {
  id?: string
  name: string
  phone: string
  email?: string
  role: string
}

interface TournamentAward {
  id?: string
  awardType: string
  brand?: string
  description?: string
  value?: number
}

const TOURNAMENT_FORMATS = [
  { value: 'T10', label: 'T10 (10 Overs)' },
  { value: 'T12', label: 'T12 (12 Overs)' },
  { value: 'T15', label: 'T15 (15 Overs)' },
  { value: 'T20', label: 'T20 (20 Overs)' },
  { value: 'T30', label: 'T30 (30 Overs)' },
  { value: 'CUSTOM', label: 'कस्टम फॉर्मेट (Custom Format)' }
]

const AWARD_TYPES = [
  'Cricket Bat', 'Cricket Shoes', 'Track Suit', 'Trophy', 'Medal', 
  'Cricket Kit', 'Helmet', 'Gloves', 'Pads', 'Cash Prize', 'Other'
]

const ORGANIZER_ROLES = [
  'मुख्य आयोजक (Main Aayojak)', 
  'सह-आयोजक (Co-Aayojak)', 
  'Tournament Coordinator', 
  'Ground Manager', 
  'Registration Officer'
]

export default function TournamentManagerAdvanced() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [isAddingTournament, setIsAddingTournament] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { toast } = useToast()

  const defaultTournament: Omit<Tournament, 'id'> = {
    name: '',
    description: '',
    format: 'T20',
    customFormat: '',
    venue: 'Tunda Cricket Ground, Tunda Village, Kutch, Gujarat',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxTeams: 16,
    entryFee: 2500,
    prizePool: 50000,
    ageLimit: 'Open (18+)',
    teamSize: 11,
    substitutes: 4,
    status: 'REGISTRATION_OPEN',
    rules: '',
    requirements: [
      'सभी खिलाड़ियों के लिए वैध पहचान पत्र (Valid ID for all players)',
      '30 वर्ष से अधिक उम्र के खिलाड़ियों के लिए मेडिकल सर्टिफिकेट (Medical certificate for 30+ players)',
      'पंजीकरण शुल्क का भुगतान (Registration fee payment)',
      'खिलाड़ियों के नाम के साथ टीम जर्सी (Team jersey with player names)'
    ],
    organizers: [{
      name: '',
      phone: '',
      email: '',
      role: 'मुख्य आयोजक (Main Aayojak)'
    }],
    manOfTheSeriesAwards: [],
    winnerPrize: 25000,
    runnerUpPrize: 15000
  }

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tournaments')
      const data = await response.json()
      
      if (data.success) {
        setTournaments(data.tournaments)
        toast({
          title: "सफलता (Success)",
          description: `${data.tournaments.length} tournaments loaded successfully`,
        })
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error)
      toast({
        title: "त्रुटि (Error)",
        description: "Failed to load tournaments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveTournament = async (tournamentData: Omit<Tournament, 'id'>) => {
    try {
      setIsLoading(true)
      
      const apiData = {
        name: tournamentData.name,
        description: tournamentData.description,
        format: tournamentData.format,
        customFormat: tournamentData.customFormat,
        venue: tournamentData.venue,
        startDate: tournamentData.startDate,
        endDate: tournamentData.endDate,
        registrationDeadline: tournamentData.registrationDeadline,
        maxTeams: tournamentData.maxTeams,
        entryFee: tournamentData.entryFee,
        prizePool: tournamentData.prizePool,
        ageLimit: tournamentData.ageLimit,
        teamSize: tournamentData.teamSize,
        substitutes: tournamentData.substitutes,
        status: tournamentData.status,
        rules: tournamentData.rules,
        requirements: tournamentData.requirements,
        organizers: tournamentData.organizers,
        winner: tournamentData.winner,
        runnerUp: tournamentData.runnerUp,
        manOfTheSeries: tournamentData.manOfTheSeries,
        winnerPrize: tournamentData.winnerPrize,
        runnerUpPrize: tournamentData.runnerUpPrize,
        manOfTheSeriesAwards: tournamentData.manOfTheSeriesAwards
      }

      let response
      if (editingTournament) {
        response = await fetch(`/api/tournaments/${editingTournament.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        })
      } else {
        response = await fetch('/api/tournaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        })
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "सफलता (Success)",
          description: editingTournament 
            ? "Tournament updated successfully!" 
            : "नया टूर्नामेंट सफलतापूर्वक बनाया गया! (New tournament created successfully!)",
        })
        
        await loadTournaments()
        setEditingTournament(null)
        setIsAddingTournament(false)
      } else {
        toast({
          title: "त्रुटि (Error)",
          description: result.error || "Failed to save tournament",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to save tournament:', error)
      toast({
        title: "त्रुटि (Error)",
        description: "Failed to save tournament",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTournament = async (id: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "सफलता (Success)",
          description: "Tournament deleted successfully!",
        })
        
        await loadTournaments()
      } else {
        toast({
          title: "त्रुटि (Error)",
          description: result.error || "Failed to delete tournament",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error)
      toast({
        title: "त्रुटि (Error)",
        description: "Failed to delete tournament",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setDeleteConfirmId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return 'bg-green-100 text-green-800'
      case 'REGISTRATION_CLOSED': return 'bg-yellow-100 text-yellow-800'
      case 'ONGOING': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-purple-100 text-purple-800'
    }
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            🏏 Tournament Management
          </h2>
          <p className="text-gray-600 mt-1">टूर्नामेंट प्रबंधन (Tournament Management)</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={loadTournaments}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Trophy className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsAddingTournament(true)} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            नया टूर्नामेंट (New Tournament)
          </Button>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{tournament.name}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(tournament.status)}>
                      {tournament.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                      {tournament.format === 'CUSTOM' ? tournament.customFormat : tournament.format}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              {/* Tournament Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span>{new Date(tournament.startDate).toLocaleDateString('hi-IN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{tournament._count?.registrations || 0}/{tournament.maxTeams}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <span>{formatCurrency(tournament.prizePool)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="truncate">{tournament.venue.split(',')[0]}</span>
                </div>
              </div>

              {/* Tournament Results */}
              {tournament.winner && (
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Winner:</span>
                    <span className="text-green-600 font-bold">{tournament.winner}</span>
                  </div>
                  {tournament.runnerUp && (
                    <div className="flex items-center gap-2 text-sm">
                      <Medal className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Runner-up:</span>
                      <span>{tournament.runnerUp}</span>
                    </div>
                  )}
                  {tournament.manOfTheSeries && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Man of Series:</span>
                      <span>{tournament.manOfTheSeries}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Organizers */}
              {tournament.organizers && tournament.organizers.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">आयोजक (Organizers):</p>
                  {tournament.organizers.slice(0, 2).map((org, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{org.name} ({org.role.split('(')[0]})</span>
                    </div>
                  ))}
                  {tournament.organizers.length > 2 && (
                    <p className="text-xs text-gray-500">+{tournament.organizers.length - 2} more</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingTournament(tournament)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Tournament Delete करना चाहते हैं?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        यह Tournament <strong>{tournament.name}</strong> को permanently delete कर देगा। 
                        सभी registrations, matches और data भी delete हो जाएगा। 
                        यह action undo नहीं हो सकता।
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTournament(tournament.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        हाँ, Delete करें (Yes, Delete)
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Tournament Dialog */}
      <TournamentFormDialog
        tournament={editingTournament || (isAddingTournament ? defaultTournament : null)}
        onSave={saveTournament}
        onCancel={() => {
          setEditingTournament(null)
          setIsAddingTournament(false)
        }}
        isLoading={isLoading}
      />
    </div>
  )
}

// Separate component for the form dialog
function TournamentFormDialog({ 
  tournament, 
  onSave, 
  onCancel, 
  isLoading 
}: {
  tournament: Omit<Tournament, 'id'> | null
  onSave: (data: Omit<Tournament, 'id'>) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<Omit<Tournament, 'id'> | null>(tournament)

  useEffect(() => {
    setFormData(tournament)
  }, [tournament])

  if (!tournament || !formData) return null

  const addOrganizer = () => {
    setFormData({
      ...formData,
      organizers: [
        ...formData.organizers,
        { name: '', phone: '', email: '', role: 'सह-आयोजक (Co-Aayojak)' }
      ]
    })
  }

  const updateOrganizer = (index: number, field: keyof TournamentOrganizer, value: string) => {
    const newOrganizers = [...formData.organizers]
    newOrganizers[index] = { ...newOrganizers[index], [field]: value }
    setFormData({ ...formData, organizers: newOrganizers })
  }

  const removeOrganizer = (index: number) => {
    setFormData({
      ...formData,
      organizers: formData.organizers.filter((_, i) => i !== index)
    })
  }

  const addAward = () => {
    setFormData({
      ...formData,
      manOfTheSeriesAwards: [
        ...formData.manOfTheSeriesAwards,
        { awardType: 'Cricket Bat', brand: '', description: '', value: 0 }
      ]
    })
  }

  const updateAward = (index: number, field: keyof TournamentAward, value: string | number) => {
    const newAwards = [...formData.manOfTheSeriesAwards]
    newAwards[index] = { ...newAwards[index], [field]: value }
    setFormData({ ...formData, manOfTheSeriesAwards: newAwards })
  }

  const removeAward = (index: number) => {
    setFormData({
      ...formData,
      manOfTheSeriesAwards: formData.manOfTheSeriesAwards.filter((_, i) => i !== index)
    })
  }

  return (
    <Dialog open={!!tournament} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            {formData.name ? 'Edit Tournament' : 'नया टूर्नामेंट बनाएं (Create New Tournament)'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">मूल जानकारी (Basic)</TabsTrigger>
              <TabsTrigger value="organizers">आयोजक (Organizers)</TabsTrigger>
              <TabsTrigger value="results">परिणाम (Results)</TabsTrigger>
              <TabsTrigger value="awards">पुरस्कार (Awards)</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tournament Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tunda Cricket Championship 2025"
                  />
                </div>
                <div>
                  <Label>Format *</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => setFormData({ ...formData, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_FORMATS.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.format === 'CUSTOM' && (
                <div>
                  <Label>Custom Format Details</Label>
                  <Input
                    value={formData.customFormat || ''}
                    onChange={(e) => setFormData({ ...formData, customFormat: e.target.value })}
                    placeholder="e.g., 8 Overs, 6 Overs, etc."
                  />
                </div>
              )}

              <div>
                <Label>Description</Label>
                <RichTextEditor
                  content={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  placeholder="Tournament description with formatting..."
                />
              </div>

              <div>
                <Label>Rules</Label>
                <RichTextEditor
                  content={formData.rules}
                  onChange={(content) => setFormData({ ...formData, rules: content })}
                  placeholder="Tournament rules with formatting..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Registration Deadline *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Venue</Label>
                <Input
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Max Teams</Label>
                  <Input
                    type="number"
                    value={formData.maxTeams}
                    onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Entry Fee (₹)</Label>
                  <Input
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Total Prize Pool (₹)</Label>
                  <Input
                    type="number"
                    value={formData.prizePool}
                    onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Age Limit</Label>
                  <Input
                    value={formData.ageLimit}
                    onChange={(e) => setFormData({ ...formData, ageLimit: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Organizers Tab */}
            <TabsContent value="organizers" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">आयोजक विवरण (Organizer Details)</h3>
                <Button onClick={addOrganizer} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Organizer
                </Button>
              </div>

              {formData.organizers.map((organizer, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Organizer {index + 1}</h4>
                    {formData.organizers.length > 1 && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeOrganizer(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={organizer.name}
                        onChange={(e) => updateOrganizer(index, 'name', e.target.value)}
                        placeholder="Organizer name"
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select
                        value={organizer.role}
                        onValueChange={(value) => updateOrganizer(index, 'role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORGANIZER_ROLES.map(role => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Phone *</Label>
                      <Input
                        value={organizer.phone}
                        onChange={(e) => updateOrganizer(index, 'phone', e.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={organizer.email || ''}
                        onChange={(e) => updateOrganizer(index, 'email', e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              <h3 className="text-lg font-semibold">Tournament Results</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Winner Team</Label>
                  <Input
                    value={formData.winner || ''}
                    onChange={(e) => setFormData({ ...formData, winner: e.target.value })}
                    placeholder="Winning team name"
                  />
                </div>
                <div>
                  <Label>Runner-up Team</Label>
                  <Input
                    value={formData.runnerUp || ''}
                    onChange={(e) => setFormData({ ...formData, runnerUp: e.target.value })}
                    placeholder="Runner-up team name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Man of the Series</Label>
                  <Input
                    value={formData.manOfTheSeries || ''}
                    onChange={(e) => setFormData({ ...formData, manOfTheSeries: e.target.value })}
                    placeholder="Player name"
                  />
                </div>
                <div>
                  <Label>Winner Prize (₹)</Label>
                  <Input
                    type="number"
                    value={formData.winnerPrize || ''}
                    onChange={(e) => setFormData({ ...formData, winnerPrize: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Runner-up Prize (₹)</Label>
                  <Input
                    type="number"
                    value={formData.runnerUpPrize || ''}
                    onChange={(e) => setFormData({ ...formData, runnerUpPrize: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Awards Tab */}
            <TabsContent value="awards" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Man of the Series Awards</h3>
                <Button onClick={addAward} size="sm">
                  <Gift className="h-4 w-4 mr-1" />
                  Add Award
                </Button>
              </div>

              {formData.manOfTheSeriesAwards.map((award, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Award {index + 1}</h4>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeAward(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Award Type</Label>
                      <Select
                        value={award.awardType}
                        onValueChange={(value) => updateAward(index, 'awardType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AWARD_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Brand</Label>
                      <Input
                        value={award.brand || ''}
                        onChange={(e) => updateAward(index, 'brand', e.target.value)}
                        placeholder="e.g., MRF, SG, Kookaburra"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={award.description || ''}
                        onChange={(e) => updateAward(index, 'description', e.target.value)}
                        placeholder="Award description"
                      />
                    </div>
                    <div>
                      <Label>Value (₹)</Label>
                      <Input
                        type="number"
                        value={award.value || ''}
                        onChange={(e) => updateAward(index, 'value', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {formData.manOfTheSeriesAwards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No awards added yet. Click "Add Award" to add equipment/prizes.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSave(formData)} 
            disabled={isLoading || !formData.name}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Saving...' : 'Save Tournament'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

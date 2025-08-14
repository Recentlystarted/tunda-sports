'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Edit, Trash2, Save, Trophy, Calendar, Users, MapPin, 
  Clock, Award, Phone, Mail, User, IndianRupee, Crown, 
  Medal, Gift, X, AlertTriangle, CalendarIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

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
  awards: TournamentPrize[]
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

interface TournamentPrize {
  id?: string
  type: string
  name: string
  description?: string
  amount?: number
  recipient?: string
}

const TOURNAMENT_FORMATS = [
  { value: 'T10', label: 'T10 (10 Overs)' },
  { value: 'T12', label: 'T12 (12 Overs)' },
  { value: 'T15', label: 'T15 (15 Overs)' },
  { value: 'T20', label: 'T20 (20 Overs)' },
  { value: 'T30', label: 'T30 (30 Overs)' },
  { value: 'CUSTOM', label: 'Custom Format' }
]

const PRIZE_TYPES = [
  'Entry Fee',
  'Winner Prize', 
  'Runner-up Prize',
  'Man of the Match',
  'Man of the Series',
  'Best Bowler',
  'Best Batsman',
  'Most Sixes',
  'Most Catches',
  'Fair Play Award',
  'Custom Award'
]

const ORGANIZER_ROLES = [
  'Main Organizer', 
  'Co-Organizer', 
  'Tournament Director', 
  'Ground Manager', 
  'Registration Officer',
  'Coordinator'
]

const AGE_LIMITS = [
  'Open (18+)',
  'Under 16',
  'Under 19', 
  'Under 23',
  'Above 35',
  'Above 40',
  'Mixed Age'
]

const TOURNAMENT_STATUS = [
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED', 
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
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
      'Valid ID for all players',
      'Medical certificate for 30+ players', 
      'Registration fee payment',
      'Team jersey with player names'
    ],
    organizers: [{
      name: '',
      phone: '',
      email: '',
      role: 'Main Organizer'
    }],
    awards: [
      { type: 'Entry Fee', name: 'Registration', amount: 2500 },
      { type: 'Winner Prize', name: 'Championship Trophy', amount: 25000 }
    ]
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
          title: "Success",
          description: `${data.tournaments.length} tournaments loaded successfully`,
        })
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error)
      toast({
        title: "Error",
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
      
      // Transform awards data for API
      const manOfTheSeriesAwards = tournamentData.awards.filter(award => 
        !['Entry Fee', 'Winner Prize', 'Runner-up Prize'].includes(award.type)
      )
      
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
        entryFee: tournamentData.awards.find(a => a.type === 'Entry Fee')?.amount || tournamentData.entryFee,
        prizePool: tournamentData.prizePool,
        ageLimit: tournamentData.ageLimit,
        teamSize: tournamentData.teamSize,
        substitutes: tournamentData.substitutes,
        status: tournamentData.status,
        rules: tournamentData.rules,
        requirements: tournamentData.requirements,
        organizers: tournamentData.organizers,
        winnerPrize: tournamentData.awards.find(a => a.type === 'Winner Prize')?.amount || 0,
        runnerUpPrize: tournamentData.awards.find(a => a.type === 'Runner-up Prize')?.amount || 0,
        manOfTheSeriesAwards: manOfTheSeriesAwards.map(award => ({
          awardType: award.type,
          brand: award.name,
          description: award.description,
          value: award.amount
        }))
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
          title: "Success",
          description: `Tournament ${editingTournament ? 'updated' : 'created'} successfully`,
        })
        loadTournaments()
        setEditingTournament(null)
        setIsAddingTournament(false)
      } else {
        throw new Error(result.error || 'Failed to save tournament')
      }
    } catch (error) {
      console.error('Failed to save tournament:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save tournament",
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
          title: "Success",
          description: "Tournament deleted successfully",
        })
        loadTournaments()
      } else {
        throw new Error(result.error || 'Failed to delete tournament')
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete tournament",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setDeleteConfirmId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'REGISTRATION_CLOSED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Tournament Management
          </h2>
          <p className="text-muted-foreground mt-1">Manage cricket tournaments and competitions</p>
        </div>
        <div className="flex gap-3">
          <ThemeToggle />
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
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Tournament
          </Button>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{tournament.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className={getStatusColor(tournament.status)}>
                      {tournament.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="secondary">
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
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{tournament._count?.registrations || 0}/{tournament.maxTeams}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  <span>{formatCurrency(tournament.prizePool)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="truncate">{tournament.venue.split(',')[0]}</span>
                </div>
              </div>

              {/* Organizers */}
              {tournament.organizers && tournament.organizers.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Organizers:</p>
                  {tournament.organizers.slice(0, 2).map((org, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{org.name} ({org.role})</span>
                    </div>
                  ))}
                  {tournament.organizers.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{tournament.organizers.length - 2} more</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
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
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{tournament.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteTournament(tournament.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tournament Form Dialog */}
      <TournamentForm
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

interface TournamentFormProps {
  tournament: Tournament | Omit<Tournament, 'id'> | null
  onSave: (tournament: Omit<Tournament, 'id'>) => void
  onCancel: () => void
  isLoading: boolean
}

function TournamentForm({ tournament, onSave, onCancel, isLoading }: TournamentFormProps) {
  const [formData, setFormData] = useState<Omit<Tournament, 'id'>>(
    tournament ? { ...tournament } as Omit<Tournament, 'id'> : {
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
      requirements: [],
      organizers: [],
      awards: []
    }
  )

  useEffect(() => {
    if (tournament) {
      setFormData({ ...tournament } as Omit<Tournament, 'id'>)
    }
  }, [tournament])

  const addOrganizer = () => {
    setFormData({
      ...formData,
      organizers: [
        ...formData.organizers,
        { name: '', phone: '', email: '', role: 'Main Organizer' }
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

  const addPrize = () => {
    setFormData({
      ...formData,
      awards: [
        ...formData.awards,
        { type: 'Custom Award', name: '', description: '', amount: 0 }
      ]
    })
  }

  const updatePrize = (index: number, field: keyof TournamentPrize, value: string | number) => {
    const newAwards = [...formData.awards]
    newAwards[index] = { ...newAwards[index], [field]: value }
    setFormData({ ...formData, awards: newAwards })
  }

  const removePrize = (index: number) => {
    setFormData({
      ...formData,
      awards: formData.awards.filter((_, i) => i !== index)
    })
  }

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, '']
    })
  }

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...formData.requirements]
    newRequirements[index] = value
    setFormData({ ...formData, requirements: newRequirements })
  }

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    })
  }

  return (
    <Dialog open={!!tournament} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {formData.name ? 'Edit Tournament' : 'Create New Tournament'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="organizers">Organizers</TabsTrigger>
              <TabsTrigger value="results">Prizes</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Tournament Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tunda Cricket Championship 2025"
                    className="text-base"
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

                <div>
                  <Label>Age Limit</Label>
                  <Select
                    value={formData.ageLimit}
                    onValueChange={(value) => setFormData({ ...formData, ageLimit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_LIMITS.map(limit => (
                        <SelectItem key={limit} value={limit}>
                          {limit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.format === 'CUSTOM' && (
                  <div className="md:col-span-2">
                    <Label>Custom Format Details</Label>
                    <Input
                      value={formData.customFormat || ''}
                      onChange={(e) => setFormData({ ...formData, customFormat: e.target.value })}
                      placeholder="e.g., 8 Overs, Box Cricket, etc."
                    />
                  </div>
                )}

                <div>
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(new Date(formData.startDate), "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.startDate ? new Date(formData.startDate) : undefined}
                        onSelect={(date) => setFormData({ 
                          ...formData, 
                          startDate: date ? format(date, "yyyy-MM-dd") : ''
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(new Date(formData.endDate), "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.endDate ? new Date(formData.endDate) : undefined}
                        onSelect={(date) => setFormData({ 
                          ...formData, 
                          endDate: date ? format(date, "yyyy-MM-dd") : ''
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Registration Deadline *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.registrationDeadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.registrationDeadline ? format(new Date(formData.registrationDeadline), "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined}
                        onSelect={(date) => setFormData({ 
                          ...formData, 
                          registrationDeadline: date ? format(date, "yyyy-MM-dd") : ''
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_STATUS.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Max Teams</Label>
                  <Input
                    type="number"
                    value={formData.maxTeams}
                    onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) || 0 })}
                    min="2"
                    max="64"
                  />
                </div>

                <div>
                  <Label>Team Size</Label>
                  <Input
                    type="number"
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: parseInt(e.target.value) || 0 })}
                    min="7"
                    max="15"
                  />
                </div>

                <div>
                  <Label>Substitutes</Label>
                  <Input
                    type="number"
                    value={formData.substitutes}
                    onChange={(e) => setFormData({ ...formData, substitutes: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="10"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Venue *</Label>
                  <Input
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Tournament venue"
                    className="text-base"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tournament description..."
                    className="min-h-[100px] resize-y"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Organizers Tab */}
            <TabsContent value="organizers" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Tournament Organizers</h3>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <Label>Email (Optional)</Label>
                      <Input
                        type="email"
                        value={organizer.email || ''}
                        onChange={(e) => updateOrganizer(index, 'email', e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {formData.organizers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No organizers added yet. Click "Add Organizer" to add tournament organizers.</p>
                </div>
              )}
            </TabsContent>

            {/* Results/Prizes Tab */}
            <TabsContent value="results" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Prizes & Awards</h3>
                <Button onClick={addPrize} size="sm">
                  <Gift className="h-4 w-4 mr-1" />
                  Add Prize
                </Button>
              </div>

              {formData.awards.map((prize, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Prize {index + 1}</h4>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removePrize(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Prize Type</Label>
                      <Select
                        value={prize.type}
                        onValueChange={(value) => updatePrize(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIZE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prize Name</Label>
                      <Input
                        value={prize.name}
                        onChange={(e) => updatePrize(index, 'name', e.target.value)}
                        placeholder="e.g., Championship Trophy, Cricket Bat"
                      />
                    </div>
                    <div>
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        value={prize.amount || ''}
                        onChange={(e) => updatePrize(index, 'amount', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Recipient</Label>
                      <Input
                        value={prize.recipient || ''}
                        onChange={(e) => updatePrize(index, 'recipient', e.target.value)}
                        placeholder="Winner team/player (optional)"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={prize.description || ''}
                        onChange={(e) => updatePrize(index, 'description', e.target.value)}
                        placeholder="Prize description (optional)"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {formData.awards.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No prizes added yet. Click "Add Prize" to define tournament prizes and awards.</p>
                </div>
              )}
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div>
                <Label>Tournament Rules</Label>
                <Textarea
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder="Enter tournament rules and regulations..."
                  className="min-h-[150px] resize-y"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Requirements</Label>
                  <Button onClick={addRequirement} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Requirement
                  </Button>
                </div>
                
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      placeholder="Enter requirement..."
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeRequirement(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSave(formData)} 
            disabled={isLoading || !formData.name || !formData.venue}
          >
            {isLoading ? 'Saving...' : 'Save Tournament'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Plus, Edit, Trash2, Save, Trophy, Calendar, Users, DollarSign, Image as ImageIcon, Link, MapPin, Clock, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/hooks/use-toast'
import ImageUploadManager from './ImageUploadManager'

interface Tournament {
  id: number
  name: string
  description: string
  startDate: string
  endDate: string
  registrationDeadline: string
  venue: string
  format: 'T20' | 'ODI' | 'Test' | 'T10'
  maxTeams: number
  registeredTeams: number
  entryFee: number
  prizePool: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'registration-open' | 'registration-closed'
  images: TournamentImage[]
  requirements: string[]
  contactPerson: string
  contactPhone: string
  contactEmail: string
  ageLimit: string
  teamSize: number
  substitutes: number
  rules: string
}

interface TournamentImage {
  id: string
  url: string
  title: string
  description: string
  category: 'poster' | 'venue' | 'trophy' | 'action' | 'winners'
  uploadedAt: string
}

interface PlayerRegistration {
  id: number
  tournamentId: number
  teamName: string
  captainName: string
  captainPhone: string
  captainEmail: string
  players: Player[]
  registrationDate: string
  status: 'pending' | 'approved' | 'rejected'
  paymentStatus: 'pending' | 'paid' | 'failed'
}

interface Player {
  name: string
  age: number
  position: string
  experience: string
  phone: string
  email: string
  isSubstitute: boolean
}

export default function TournamentManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [registrations, setRegistrations] = useState<PlayerRegistration[]>([])
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [isAddingTournament, setIsAddingTournament] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [uploadedImages, setUploadedImages] = useState<TournamentImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load tournaments from database on component mount
  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tournaments')
      const data = await response.json()
      
      if (data.success) {
        // Convert API data to component format
        const formattedTournaments = data.tournaments.map((t: any) => ({
          id: parseInt(t.id),
          name: t.name,
          description: t.description,
          startDate: t.startDate,
          endDate: t.endDate,
          registrationDeadline: t.registrationDeadline,
          venue: t.venue,
          format: t.format,
          maxTeams: t.maxTeams,
          registeredTeams: t._count?.registrations || 0,
          entryFee: t.entryFee,
          prizePool: t.prizePool,
          status: mapApiStatusToComponentStatus(t.status),
          images: t.images || [],
          requirements: t.requirements || [],
          contactPerson: t.contactPerson || '',
          contactPhone: t.contactPhone || '',
          contactEmail: t.contactEmail || '',
          ageLimit: t.ageLimit || '',
          teamSize: t.teamSize,
          substitutes: t.substitutes,
          rules: t.rules || ''
        }))
        setTournaments(formattedTournaments)
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error)
      toast({
        title: "Error",
        description: "Failed to load tournaments from database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const mapApiStatusToComponentStatus = (apiStatus: string) => {
    switch (apiStatus) {
      case 'REGISTRATION_OPEN': return 'registration-open'
      case 'REGISTRATION_CLOSED': return 'registration-closed'
      case 'ONGOING': return 'ongoing'
      case 'COMPLETED': return 'completed'
      case 'DRAFT': return 'upcoming'
      default: return 'upcoming'
    }
  }

  const mapComponentStatusToApiStatus = (componentStatus: string) => {
    switch (componentStatus) {
      case 'registration-open': return 'REGISTRATION_OPEN'
      case 'registration-closed': return 'REGISTRATION_CLOSED'
      case 'ongoing': return 'ONGOING'
      case 'completed': return 'COMPLETED'
      case 'upcoming': return 'DRAFT'
      default: return 'DRAFT'
    }
  }

  const defaultTournament: Omit<Tournament, 'id'> = {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    venue: 'Tunda Cricket Ground, Tunda Village, Kutch, Gujarat',
    format: 'T20',
    maxTeams: 16,
    registeredTeams: 0,
    entryFee: 2500,
    prizePool: 50000,
    status: 'upcoming',
    images: [],
    requirements: [
      'All players must be above 16 years of age',
      'Valid ID proof required for all players',
      'Team must have minimum 11 players and maximum 4 substitutes',
      'Entry fee must be paid before registration deadline',
      'Teams must arrive 30 minutes before match time'
    ],
    contactPerson: 'Tournament Coordinator',
    contactPhone: '+91 98765 43210',
    contactEmail: 'tournaments@tundacricket.com',
    ageLimit: '16+',
    teamSize: 11,
    substitutes: 4,
    rules: 'Standard cricket rules apply. Umpire decision is final.'
  }

  // Image Upload Handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: TournamentImage = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          url: e.target?.result as string,
          title: file.name.split('.')[0],
          description: '',
          category: 'poster',
          uploadedAt: new Date().toISOString()
        }
        setUploadedImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleGoogleDriveLink = (driveUrl: string, title: string, category: TournamentImage['category']) => {
    // Convert Google Drive sharing link to direct image URL
    const fileId = driveUrl.match(/\/d\/(.*?)\//)?.[1] || driveUrl.match(/id=([^&]*)/)?.[1]
    if (fileId) {
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
      const newImage: TournamentImage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url: directUrl,
        title: title || 'Tournament Image',
        description: '',
        category,
        uploadedAt: new Date().toISOString()
      }
      setUploadedImages(prev => [...prev, newImage])
    }
  }

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId))
  }
  // Tournament CRUD Operations
  const saveTournament = async (tournamentData: Omit<Tournament, 'id'>) => {
    try {
      setIsLoading(true)
      
      const apiData = {
        name: tournamentData.name,
        description: tournamentData.description,
        format: tournamentData.format,
        venue: tournamentData.venue,
        startDate: tournamentData.startDate,
        endDate: tournamentData.endDate,
        registrationDeadline: tournamentData.registrationDeadline,
        maxTeams: tournamentData.maxTeams.toString(),
        entryFee: tournamentData.entryFee.toString(),
        prizePool: tournamentData.prizePool.toString(),
        ageLimit: tournamentData.ageLimit,
        teamSize: tournamentData.teamSize.toString(),
        substitutes: tournamentData.substitutes.toString(),
        status: mapComponentStatusToApiStatus(tournamentData.status),
        rules: tournamentData.rules,
        requirements: tournamentData.requirements,
        contactPerson: tournamentData.contactPerson,
        contactPhone: tournamentData.contactPhone,
        contactEmail: tournamentData.contactEmail
      }

      let response
      if (editingTournament) {
        // Update existing tournament
        response = await fetch(`/api/tournaments/${editingTournament.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        })
      } else {
        // Create new tournament
        response = await fetch('/api/tournaments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        })
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Success",
          description: editingTournament 
            ? "Tournament updated successfully!" 
            : "Tournament created successfully!",
        })
        
        // Reload tournaments from database to get the latest data
        await loadTournaments()
        
        setEditingTournament(null)
        setIsAddingTournament(false)
        setUploadedImages([])
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save tournament",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to save tournament:', error)
      toast({
        title: "Error",
        description: "Failed to save tournament. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTournament = async (id: number) => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Tournament deleted successfully!",
        })
        
        // Reload tournaments from database
        await loadTournaments()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete tournament",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error)
      toast({
        title: "Error",
        description: "Failed to delete tournament. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tournaments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="images">Image Gallery</TabsTrigger>
        </TabsList>

        {/* Tournament Management Tab */}
        <TabsContent value="tournaments" className="space-y-4">          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">Tournament Management</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={loadTournaments}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Trophy className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
              <Button onClick={() => setIsAddingTournament(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Tournament
              </Button>
            </div>
          </div>

          {/* Tournament List */}
          <div className="grid gap-4">
            {tournaments.map(tournament => (
              <Card key={tournament.id} className="w-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        {tournament.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(tournament.startDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {tournament.registeredTeams}/{tournament.maxTeams} teams
                        </span>
                        <Badge variant={tournament.status === 'upcoming' ? 'default' : 'secondary'}>
                          {tournament.status}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingTournament(tournament)
                        setUploadedImages(tournament.images)
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteTournament(tournament.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{tournament.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <strong>Format:</strong> {tournament.format}
                    </div>
                    <div>
                      <strong>Entry Fee:</strong> ₹{tournament.entryFee}
                    </div>
                    <div>
                      <strong>Prize Pool:</strong> ₹{tournament.prizePool}
                    </div>
                    <div>
                      <strong>Age Limit:</strong> {tournament.ageLimit}
                    </div>
                  </div>
                  {tournament.images.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Tournament Images:</p>
                      <div className="flex gap-2 flex-wrap">
                        {tournament.images.slice(0, 3).map(img => (
                          <img key={img.id} src={img.url} alt={img.title} className="w-16 h-16 object-cover rounded" />
                        ))}
                        {tournament.images.length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs">
                            +{tournament.images.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-4">
          <h3 className="text-2xl font-bold">Team Registrations</h3>
          <div className="grid gap-4">
            {registrations.map(registration => (
              <Card key={registration.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{registration.teamName}</span>
                    <div className="flex gap-2">
                      <Badge variant={registration.status === 'approved' ? 'default' : 'secondary'}>
                        {registration.status}
                      </Badge>
                      <Badge variant={registration.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                        {registration.paymentStatus}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Captain: {registration.captainName} | {registration.captainPhone}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">
                    Registered on: {new Date(registration.registrationDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <strong>Players:</strong> {registration.players.length}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Image Gallery Tab */}
        <TabsContent value="images" className="space-y-4">
          <ImageGalleryManager 
            images={uploadedImages}
            onImageUpload={handleImageUpload}
            onGoogleDriveLink={handleGoogleDriveLink}
            onRemoveImage={removeImage}
            fileInputRef={fileInputRef}
          />
        </TabsContent>
      </Tabs>

      {/* Tournament Form Dialog */}
      <TournamentFormDialog
        isOpen={isAddingTournament || !!editingTournament}
        onClose={() => {
          setIsAddingTournament(false)
          setEditingTournament(null)
          setUploadedImages([])
        }}
        tournament={editingTournament || defaultTournament}
        onSave={saveTournament}
        images={uploadedImages}
        onImageUpload={handleImageUpload}
        onGoogleDriveLink={handleGoogleDriveLink}
        onRemoveImage={removeImage}
        fileInputRef={fileInputRef}
      />
    </div>
  )
}

// Image Gallery Manager Component
function ImageGalleryManager({ 
  images, 
  onImageUpload, 
  onGoogleDriveLink, 
  onRemoveImage,
  fileInputRef 
}: {
  images: TournamentImage[]
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onGoogleDriveLink: (url: string, title: string, category: TournamentImage['category']) => void
  onRemoveImage: (id: string) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}) {
  const [driveUrl, setDriveUrl] = useState('')
  const [imageTitle, setImageTitle] = useState('')
  const [imageCategory, setImageCategory] = useState<TournamentImage['category']>('poster')

  const handleGoogleDriveSubmit = () => {
    if (driveUrl && imageTitle) {
      onGoogleDriveLink(driveUrl, imageTitle, imageCategory)
      setDriveUrl('')
      setImageTitle('')
      setImageCategory('poster')
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Tournament Image Gallery</h3>
      
      {/* Upload Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload from Device
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Images
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
              />
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, GIF. Max 5MB per image.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Google Drive Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Paste Google Drive sharing link"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
              />
              <Input
                placeholder="Image title"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
              />
              <Select value={imageCategory} onValueChange={(value: TournamentImage['category']) => setImageCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poster">Tournament Poster</SelectItem>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="trophy">Trophy</SelectItem>
                  <SelectItem value="action">Action Shots</SelectItem>
                  <SelectItem value="winners">Winners</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGoogleDriveSubmit} className="w-full">
                Add Image
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="relative group">
            <img 
              src={image.url} 
              alt={image.title}
              className="w-full h-32 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveImage(image.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium truncate">{image.title}</p>
              <Badge variant="outline" className="text-xs">
                {image.category}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Tournament Form Dialog Component
function TournamentFormDialog({
  isOpen,
  onClose,
  tournament,
  onSave,
  images,
  onImageUpload,
  onGoogleDriveLink,
  onRemoveImage,
  fileInputRef
}: {
  isOpen: boolean
  onClose: () => void
  tournament: Omit<Tournament, 'id'> | Tournament
  onSave: (tournament: Omit<Tournament, 'id'>) => void
  images: TournamentImage[]
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onGoogleDriveLink: (url: string, title: string, category: TournamentImage['category']) => void
  onRemoveImage: (id: string) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}) {
  const [formData, setFormData] = useState(tournament)

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {'id' in tournament ? 'Edit Tournament' : 'Add New Tournament'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter tournament name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tournament description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select value={formData.format} onValueChange={(value: Tournament['format']) => 
                    setFormData(prev => ({ ...prev, format: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T10">T10</SelectItem>
                      <SelectItem value="T20">T20</SelectItem>
                      <SelectItem value="ODI">ODI</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates and Registration */}
          <Card>
            <CardHeader>
              <CardTitle>Dates & Registration</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <DatePicker
                    date={formData.startDate ? new Date(formData.startDate) : undefined}
                    onDateChange={(date) => setFormData(prev => ({ 
                      ...prev, 
                      startDate: date ? date.toISOString().split('T')[0] : '' 
                    }))}
                    placeholder="Select start date"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <DatePicker
                    date={formData.endDate ? new Date(formData.endDate) : undefined}
                    onDateChange={(date) => setFormData(prev => ({ 
                      ...prev, 
                      endDate: date ? date.toISOString().split('T')[0] : '' 
                    }))}
                    placeholder="Select end date"
                  />
                </div>

                <div>
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <DatePicker
                    date={formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined}
                    onDateChange={(date) => setFormData(prev => ({ 
                      ...prev, 
                      registrationDeadline: date ? date.toISOString().split('T')[0] : '' 
                    }))}
                    placeholder="Select deadline"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxTeams">Maximum Teams</Label>
                  <Input
                    id="maxTeams"
                    type="number"
                    value={formData.maxTeams}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxTeams: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="ageLimit">Age Limit</Label>
                  <Input
                    id="ageLimit"
                    value={formData.ageLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, ageLimit: e.target.value }))}
                    placeholder="e.g., 16+, 18-35, No limit"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                <Input
                  id="entryFee"
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, entryFee: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="prizePool">Prize Pool (₹)</Label>
                <Input
                  id="prizePool"
                  type="number"
                  value={formData.prizePool}
                  onChange={(e) => setFormData(prev => ({ ...prev, prizePool: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Images */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageGalleryManager
                images={images}
                onImageUpload={onImageUpload}
                onGoogleDriveLink={onGoogleDriveLink}
                onRemoveImage={onRemoveImage}
                fileInputRef={fileInputRef}
              />
            </CardContent>
          </Card>

          {/* Rules and Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Rules & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label htmlFor="rules">Tournament Rules</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                  rows={4}
                  placeholder="Tournament rules and regulations"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    value={formData.teamSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, teamSize: parseInt(e.target.value) || 11 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="substitutes">Substitutes Allowed</Label>
                  <Input
                    id="substitutes"
                    type="number"
                    value={formData.substitutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, substitutes: parseInt(e.target.value) || 4 }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Tournament
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

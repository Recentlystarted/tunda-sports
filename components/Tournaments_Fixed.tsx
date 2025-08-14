'use client'

import { useState, useEffect } from 'react'
import { Calendar, Trophy, Users, MapPin, Clock, Plus, Edit, Trash2, Star, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Tournament {
  id: string
  name: string
  description: string
  format: string
  venue: string
  startDate: string
  endDate: string
  registrationDeadline: string
  maxTeams: number
  entryFee: number
  prizePool: number
  ageLimit?: string
  teamSize: number
  substitutes: number
  status: 'DRAFT' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  rules?: string
  requirements?: string[]
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  createdAt: string
  _count?: {
    registrations: number
  }
  images?: {
    id: string
    url: string
    title: string
    description?: string
    category: string
    storageType: string
    thumbnailUrl?: string
  }[]
}

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch('/api/tournaments?limit=20')
      const data = await response.json()

      if (response.ok && data.success) {
        setTournaments(data.tournaments)
        console.log('Loaded tournaments from database:', data.tournaments.length)
      } else {
        setError(data.error || 'Failed to load tournaments')
        console.error('Failed to load tournaments:', data.error)
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error)
      setError('Failed to load tournaments. Please check your internet connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return 'bg-green-500/10 text-green-700 border-green-200'
      case 'REGISTRATION_CLOSED': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      case 'ONGOING': return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'COMPLETED': return 'bg-muted text-muted-foreground border-border'
      case 'CANCELLED': return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'DRAFT': return 'bg-purple-500/10 text-purple-700 border-purple-200'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN': return 'Registration Open'
      case 'REGISTRATION_CLOSED': return 'Registration Closed'
      case 'ONGOING': return 'Ongoing'
      case 'COMPLETED': return 'Completed'
      case 'CANCELLED': return 'Cancelled'
      case 'DRAFT': return 'Draft'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getTournamentImage = (tournament: Tournament) => {
    // Check if tournament has images from database
    if (tournament.images && tournament.images.length > 0) {
      const image = tournament.images[0]
      
      // Handle different storage types
      if (image.storageType === 'GOOGLE_DRIVE') {
        // For Google Drive images, optimize the URL for web display
        if (image.thumbnailUrl) {
          return image.thumbnailUrl
        }
        
        // Extract file ID and create optimized thumbnail URL
        const fileIdMatch = image.url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || 
                           image.url.match(/id=([a-zA-Z0-9-_]+)/)
        
        if (fileIdMatch) {
          return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w600`
        }
        
        // Fallback to direct Google Drive view URL
        return image.url.replace('/view', '/preview')
      } else if (image.storageType === 'URL') {
        // For local URLs, prepend the base URL if needed
        if (image.url.startsWith('/')) {
          return `http://localhost:3000${image.url}`
        }
        return image.url
      }
      
      return image.url
    }
    
    // Fallback images based on tournament format
    const fallbackImages = {
      'T20': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&h=400&fit=crop&crop=center',
      'T15': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&h=400&fit=crop&crop=center',
      'ODI': 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=400&fit=crop&crop=center',
      'Test': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&crop=center',
      'T10': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&h=400&fit=crop&crop=center'
    }
    
    return fallbackImages[tournament.format as keyof typeof fallbackImages] || fallbackImages['T20']
  }

  const isRegistrationOpen = (tournament: Tournament) => {
    const now = new Date()
    const deadline = new Date(tournament.registrationDeadline)
    return tournament.status === 'REGISTRATION_OPEN' && now <= deadline
  }

  const getRegistrationProgress = (tournament: Tournament) => {
    if (!tournament._count?.registrations) return 0
    return Math.round((tournament._count.registrations / tournament.maxTeams) * 100)
  }

  if (isLoading) {
    return (
      <section id="tournaments" className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Cricket Tournaments
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Loading tournament information...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="tournaments" className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Cricket
            <span className="text-green-600"> Tournaments</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join exciting cricket tournaments throughout the year. From local leagues to 
            championship matches, there's something for every skill level at Tunda Cricket Ground.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 text-center">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg inline-block">
              {error}
            </div>
          </div>
        )}

        {/* No Tournaments Message */}
        {!error && tournaments.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No Tournaments Available
              </h3>
              <p className="text-gray-600 mb-6">
                There are currently no tournaments scheduled. Check back soon for exciting cricket tournaments at Tunda Sports Club!
              </p>
              <Button variant="outline" size="lg" asChild>
                <a href="#contact">
                  Contact Us for Updates
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Tournament Cards */}
        {tournaments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg">
                {/* Tournament Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={getTournamentImage(tournament)}
                    alt={tournament.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to default image if Google Drive image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&h=400&fit=crop&crop=center';
                    }}
                  />
                  {/* Tournament Images Count Badge */}
                  {tournament.images && tournament.images.length > 0 && (
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                      📷 {tournament.images.length}
                    </div>
                  )}
                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 left-3">
                    <Badge className={`${getStatusColor(tournament.status)} border`}>
                      {getStatusLabel(tournament.status)}
                    </Badge>
                  </div>
                </div>

                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-1 text-green-100">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">{tournament.format}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">
                    {tournament.name}
                  </h3>
                  
                  <p className="text-green-100 text-sm line-clamp-2">
                    {tournament.description}
                  </p>
                </div>

                <CardContent className="p-6">
                  {/* Key Details */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div>
                        <div className="font-medium">
                          {formatDate(tournament.startDate)}
                          {tournament.startDate !== tournament.endDate && 
                            ` - ${formatDate(tournament.endDate)}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          Starts at {formatTime(tournament.startDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{tournament.venue}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">
                            {tournament._count?.registrations || 0} / {tournament.maxTeams} teams
                          </span>
                          <span className="text-sm text-gray-500">
                            {getRegistrationProgress(tournament)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getRegistrationProgress(tournament)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700">
                      <Trophy className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-green-700">
                          {formatCurrency(tournament.prizePool)} Prize Pool
                        </div>
                        <div className="text-sm text-gray-500">
                          Entry Fee: {formatCurrency(tournament.entryFee)}
                        </div>
                      </div>
                    </div>

                    {tournament.ageLimit && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Clock className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{tournament.ageLimit}</span>
                      </div>
                    )}
                  </div>

                  {/* Registration Deadline */}
                  {isRegistrationOpen(tournament) && (
                    <div className="bg-green-500/10 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 text-green-800">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Registration deadline: {formatDate(tournament.registrationDeadline)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isRegistrationOpen(tournament) ? (
                      <Button className="flex-1 bg-green-600 hover:bg-green-700" asChild>
                        <a href="#register">
                          <Plus className="h-4 w-4 mr-2" />
                          Register Team
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" className="flex-1" disabled>
                        {tournament.status === 'COMPLETED' ? 'Tournament Ended' : 
                         tournament.status === 'ONGOING' ? 'In Progress' : 
                         'Registration Closed'}
                      </Button>
                    )}
                    
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Contact Info */}
                  {tournament.contactPerson && (
                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                      <div>Contact: {tournament.contactPerson}</div>
                      {tournament.contactPhone && (
                        <div>Phone: {tournament.contactPhone}</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action - Only show when there are tournaments */}
        {tournaments.length > 0 && (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Join a Tournament?
              </h3>
              <p className="text-gray-600 mb-6">
                Register your team today and be part of the exciting cricket action at Tunda Sports Club.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                  <a href="#register">
                    <Plus className="h-5 w-5 mr-2" />
                    Register Your Team
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#contact">
                    Contact Us
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

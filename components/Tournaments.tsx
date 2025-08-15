'use client'

import { useState, useEffect } from 'react'
import { Calendar, Trophy, Users, MapPin, Clock, Plus, Edit, Trash2, Star, Eye, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

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
  totalPrizePool: number
  ageLimit?: string
  teamSize: number
  substitutes: number
  status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED'
  rules?: string
  requirements?: string[]
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  createdAt: string
  // Auction-related fields
  isAuctionBased?: boolean
  playerEntryFee?: number
  teamEntryFee?: number
  entryFeeType?: string
  auctionBudget?: number
  auctionCurrency?: string
  pointsBased?: boolean
  requireTeamOwners?: boolean
  _count?: {
    registrations: number
  }
  images?: {
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    googleDriveId?: string
    googleDriveUrl?: string
    publicUrl?: string
    category: string
    description?: string
    isPublic: boolean
  }[]
}

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast } = useToast()
  useEffect(() => {
    console.log('🔄 Tournaments component mounted, loading tournaments...')
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('🔄 Fetching tournaments from API...')
      const response = await fetch('/api/tournaments?limit=20', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const data = await response.json()

      console.log('📡 API Response:', { 
        status: response.status, 
        success: data.success, 
        tournamentsCount: data.tournaments?.length || 0,
        tournaments: data.tournaments 
      })

      if (response.ok && data.success) {
        setTournaments(data.tournaments)
        console.log('✅ Loaded tournaments from database:', data.tournaments.length)
        
        // Show success toast only on manual refresh, not on initial load
        if (tournaments.length > 0) {
          toast({
            title: "Refreshed",
            description: `Loaded ${data.tournaments.length} tournaments from database`,
          })
        }
        
        if (data.tournaments.length === 0) {
          console.log('⚠️ No tournaments found in database')
        }
      } else {
        setError(data.error || 'Failed to load tournaments')
        console.error('❌ Failed to load tournaments:', data.error)
        toast({
          title: "Error",
          description: data.error || 'Failed to load tournaments',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Network error loading tournaments:', error)
      setError('Failed to load tournaments. Please check your internet connection.')
      toast({
        title: "Connection Error",
        description: 'Failed to load tournaments. Please check your internet connection.',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-primary text-primary-foreground'
      case 'REGISTRATION_OPEN': return 'bg-primary text-primary-foreground'
      case 'REGISTRATION_CLOSED': return 'bg-secondary text-secondary-foreground'
      case 'ONGOING': return 'bg-accent text-accent-foreground'
      case 'COMPLETED': return 'bg-muted text-muted-foreground'
      case 'CANCELLED': return 'bg-destructive text-destructive-foreground'
      case 'POSTPONED': return 'bg-orange-600 text-white'
      default: return 'bg-muted text-muted-foreground'
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

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0'
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPoints = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 Points'
    }
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount) + ' Points'
  }

  const getTournamentImage = (tournament: Tournament) => {
    // Check if tournament has images from database
    if (tournament.images && tournament.images.length > 0) {
      const image = tournament.images[0]
      
      // Use publicUrl if available, otherwise googleDriveUrl
      if (image.publicUrl) {
        return image.publicUrl
      }
      
      if (image.googleDriveUrl) {
        return image.googleDriveUrl
      }
      
      // If we have a Google Drive ID, construct the URL
      if (image.googleDriveId) {
        return `https://drive.google.com/thumbnail?id=${image.googleDriveId}&sz=w600`
      }
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
    return (tournament.status === 'UPCOMING' || tournament.status === 'REGISTRATION_OPEN') && now <= deadline
  }

  const getRegistrationProgress = (tournament: Tournament) => {
    if (!tournament._count?.registrations) return 0
    return Math.round((tournament._count.registrations / tournament.maxTeams) * 100)
  }

  const formatEntryFees = (tournament: Tournament) => {
    if (tournament.isAuctionBased) {
      const fees = []
      
      // Entry fees are always in real money (INR), regardless of points-based setting
      if (tournament.playerEntryFee && tournament.playerEntryFee > 0) {
        fees.push(`Player Entry: ${formatCurrency(tournament.playerEntryFee)}`)
      }
      
      if (tournament.teamEntryFee && tournament.teamEntryFee > 0) {
        fees.push(`Team Owner: ${formatCurrency(tournament.teamEntryFee)}`)
      }
      
      // Only auction budget is in points
      if (tournament.auctionBudget && tournament.auctionBudget > 0) {
        fees.push(`Auction Budget: ${formatPoints(tournament.auctionBudget)}`)
      }
      
      return fees.length > 0 ? fees.join(' • ') : 'Free Auction Entry'
    } else {
      // Regular tournament - show standard entry fee
      return tournament.entryFee > 0 
        ? `Entry Fee: ${formatCurrency(tournament.entryFee)}`
        : 'Free Entry'
    }
  }

  if (isLoading) {
    return (
      <section id="tournaments" className="py-12 sm:py-16 lg:py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Cricket Tournaments
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Loading tournament information...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="tournaments" className="py-12 sm:py-16 lg:py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
              Cricket
              <span className="text-primary"> Tournaments</span>
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadTournaments}
              disabled={isLoading}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Join exciting cricket tournaments throughout the year. From local leagues to 
            championship matches, there's something for every skill level at Tunda Cricket Ground.
          </p>
          <div className="text-sm text-muted-foreground mt-2">
            {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} found
          </div>
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
          <div className="text-center py-12 sm:py-16">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6 sm:p-8">
                <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  No Tournaments Available
                </h3>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                  There are currently no tournaments scheduled. Check back soon for exciting cricket tournaments at Tunda Sports Club!
                </p>
                <Button variant="outline" size="lg" asChild>
                  <a href="#contact">
                    Contact Us for Updates
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tournament Cards */}
        {tournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Tournament Image */}
                <div className="relative h-40 sm:h-48 overflow-hidden">
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
                    <Badge className={getStatusColor(tournament.status)}>
                      {getStatusLabel(tournament.status)}
                    </Badge>
                  </div>
                </div>

                {/* Header with gradient */}
                <div className="bg-primary p-4 sm:p-6 text-primary-foreground">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-1 text-primary-foreground/80">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">{tournament.format}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold mb-2 line-clamp-2">
                    {tournament.name}
                  </h3>
                  
                  <div 
                    className="text-primary-foreground/80 text-sm line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: tournament.description || '' }}
                  />
                </div>

                <CardContent className="p-4 sm:p-6">
                  {/* Key Details */}
                  <div className="space-y-3 sm:space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-foreground">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <div>
                        <div className="font-medium text-sm sm:text-base">
                          {formatDate(tournament.startDate)}
                          {tournament.startDate !== tournament.endDate && 
                            ` - ${formatDate(tournament.endDate)}`}
                        </div>
                        {/* Only show time if it's not midnight (00:00) */}
                        {new Date(tournament.startDate).getHours() !== 0 || new Date(tournament.startDate).getMinutes() !== 0 ? (
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Starts at {formatTime(tournament.startDate)}
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            All day event
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-foreground">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{tournament.venue}</span>
                    </div>

                    <div className="flex items-center gap-3 text-foreground">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs sm:text-sm font-medium">
                            {tournament._count?.registrations || 0} / {tournament.maxTeams} teams
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {getRegistrationProgress(tournament)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getRegistrationProgress(tournament)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-foreground">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <div>
                        <div className="font-medium text-primary text-sm sm:text-base">
                          {formatCurrency(tournament.totalPrizePool)} Prize Pool
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {formatEntryFees(tournament)}
                        </div>
                        {tournament.isAuctionBased && (
                          <div className="text-xs text-accent-foreground font-medium mt-1">
                            🏆 Auction Tournament
                          </div>
                        )}
                      </div>
                    </div>

                    {tournament.ageLimit && (
                      <div className="flex items-center gap-3 text-foreground">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{tournament.ageLimit}</span>
                      </div>
                    )}
                  </div>

                  {/* Registration Deadline */}
                  {isRegistrationOpen(tournament) && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 text-primary">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs sm:text-sm font-medium">
                          Registration deadline: {formatDate(tournament.registrationDeadline)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {isRegistrationOpen(tournament) ? (
                      <Button className="flex-1 text-sm" asChild>
                        <Link href={`/tournament/${tournament.id}/register`}>
                          <Plus className="h-4 w-4 mr-2" />
                          Register Team
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" className="flex-1 text-sm" disabled>
                        {tournament.status === 'COMPLETED' ? 'Tournament Ended' : 
                         tournament.status === 'ONGOING' ? 'In Progress' : 
                         'Registration Closed'}
                      </Button>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/tournaments/${tournament.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/tournaments/${tournament.id}/photos`}>
                          <ImageIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {tournament.contactPerson && (
                    <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
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
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">
                  Ready to Join a Tournament?
                </h3>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                  Register your team today and be part of the exciting cricket action at Tunda Sports Club.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {(() => {
                    // Find the first tournament that's open for registration
                    const openTournament = tournaments.find(t => isRegistrationOpen(t))
                    
                    if (openTournament) {
                      return (
                        <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                          <Link href={`/tournament/${openTournament.id}/register`}>
                            <Plus className="h-5 w-5 mr-2" />
                            Register for {openTournament.name}
                          </Link>
                        </Button>
                      )
                    } else {
                      return (
                        <Button size="lg" variant="outline" disabled>
                          <Plus className="h-5 w-5 mr-2" />
                          No Open Tournaments
                        </Button>
                      )
                    }
                  })()}
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#contact">
                      Contact Us
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}

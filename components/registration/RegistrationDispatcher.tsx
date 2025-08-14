'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Trophy, Calendar, MapPin } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Import the main registration components
import AuctionRegistration from './AuctionRegistration'
import UniversalRegistration from '../UniversalRegistration'

interface Tournament {
  id: string
  name: string
  format: string
  competitionType?: string
  overs?: number
  startDate: string
  endDate: string
  registrationDeadline: string
  venue: string
  entryFee: number
  totalPrizePool: number
  maxTeams: number
  teamSize: number
  substitutes: number
  status: string
  isAuctionBased: boolean
  playerEntryFee: number
  teamEntryFee: number
  requireTeamOwners: boolean
  entryFeeType: string
  auctionTeamCount: number
  playerPoolSize: number
  _count: {
    registrations: number
    auctionPlayers: number
  }
}

export default function RegistrationDispatcher() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tournamentId = params.id as string
  const registrationType = searchParams.get('type') // 'player' or 'owner'
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tournamentId) {
      fetchTournament()
    }
  }, [tournamentId])

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      if (response.ok) {
        const data = await response.json()
        setTournament(data.tournament || data)
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

  const getRegistrationComponent = () => {
    if (!tournament) return null

    const competitionType = tournament.competitionType || tournament.format
    
    // EXPLICIT CHECK: ONE_DAY_KNOCKOUT should ALWAYS use UniversalRegistration  
    if (competitionType === 'ONE_DAY_KNOCKOUT') {
      // Pass tournament data directly to ensure correct behavior
      return (
        <div className="space-y-6">
          {/* Tournament Info Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="flex justify-center items-center gap-2 mb-4">
                  <Trophy className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold">{tournament.name}</h1>
                </div>
                
                <div className="flex justify-center gap-2 mb-4">
                  <Badge variant="default">
                    Knockout Tournament
                  </Badge>
                  <Badge variant="outline">
                    {getFormatDisplay()}
                  </Badge>
                  <Badge variant="secondary">
                    REGISTRATION OPEN
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{tournament.venue}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>Prize Pool: ₹{tournament.totalPrizePool}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Use UniversalRegistration but with tournament pre-selected */}
          <div style={{ display: 'none' }}>
            {/* Hidden parameter to indicate this is from dispatcher */}
            <input type="hidden" id="fromDispatcher" value="true" />
          </div>
          <UniversalRegistration />
        </div>
      )
    }
    
    // EXTREMELY RESTRICTIVE: Only tournaments with AUCTION in competitionType should be auction
    const isAuctionCompetition = ['AUCTION_BASED_GROUPS', 'AUCTION_BASED_FIXED_TEAMS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(competitionType);
    
    if (isAuctionCompetition) {
      return <AuctionRegistration tournament={tournament} defaultTab={registrationType || 'player'} />
    }
    
    // For all other non-auction tournaments, use UniversalRegistration
    return <UniversalRegistration />
  }

  const getCompetitionTypeInfo = () => {
    if (!tournament) return { color: 'secondary', label: 'Unknown' }
    
    const competitionType = tournament.competitionType || tournament.format
    
    // EXTREMELY RESTRICTIVE: Only tournaments with AUCTION in competitionType should be auction
    if (['AUCTION_BASED_GROUPS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT', 'AUCTION_BASED_FIXED_TEAMS'].includes(competitionType)) {
      return { color: 'destructive', label: 'Auction Tournament' }
    }
    
    if (['KNOCKOUT', 'ONE_DAY_KNOCKOUT', 'GROUP_KNOCKOUT', 'KNOCKOUT_PLUS_FINAL', 'DOUBLE_ELIMINATION'].includes(competitionType)) {
      return { color: 'default', label: 'Knockout Tournament' }
    }
    
    if (['LEAGUE', 'ROUND_ROBIN', 'SWISS_SYSTEM'].includes(competitionType)) {
      return { color: 'secondary', label: 'League Tournament' }
    }
    
    if (['VILLAGE_CHAMPIONSHIP', 'CITY_CHAMPIONSHIP', 'INTER_VILLAGE', 'INTER_CITY'].includes(competitionType)) {
      return { color: 'default', label: 'Championship Tournament' }
    }
    
    if (['FRIENDLY_SERIES', 'BEST_OF_THREE', 'BEST_OF_FIVE'].includes(competitionType)) {
      return { color: 'secondary', label: 'Series Tournament' }
    }
    
    if (competitionType === 'CUSTOM') {
      return { color: 'outline', label: 'Custom Tournament' }
    }
    
    // Format other competition types nicely
    const formattedType = competitionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return { color: 'outline', label: formattedType }
  }

  const getFormatDisplay = () => {
    if (!tournament) return 'Unknown'
    
    if (tournament.format === 'CUSTOM') {
      return tournament.overs ? `${tournament.overs} Overs` : 'Custom Format'
    }
    
    // Convert T6, T8, T10, etc. to "6 Overs", "8 Overs", etc.
    if (tournament.format.startsWith('T') && tournament.format.length <= 3) {
      const overs = tournament.format.substring(1)
      return `${overs} Overs`
    }
    
    return tournament.format
  }

  if (loading) {
    return (
      <div className="min-h-screen mobile-viewport-fix bg-gradient-to-br from-background via-background to-muted/50 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-32 sm:h-64">
            <div className="text-center">
              <div className="mobile-spinner h-8 w-8 sm:h-12 sm:w-12 border-2 sm:border-b-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm sm:text-base">Loading tournament details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen mobile-viewport-fix bg-gradient-to-br from-background via-background to-muted/50 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-32 sm:h-64">
            <Alert className="max-w-md mx-2 sm:mx-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm sm:text-base">
                {error || 'Tournament not found'}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  const competitionInfo = getCompetitionTypeInfo()

  return (
    <div className="min-h-screen mobile-viewport-fix bg-gradient-to-br from-background via-background to-muted/50 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Tournament Header */}
        <Card className="mb-4 sm:mb-6 border-0 sm:border shadow-lg sm:shadow-md">
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex justify-center items-center gap-2 mb-3 sm:mb-4">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{tournament.name}</h1>
              </div>
              
              <div className="flex justify-center gap-2 mb-3 sm:mb-4 flex-wrap">
                <Badge variant={competitionInfo.color as any} className="text-xs sm:text-sm">
                  {competitionInfo.label}
                </Badge>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {getFormatDisplay()}
                </Badge>
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {tournament.status ? tournament.status.replace(/_/g, ' ') : 'Unknown Status'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">{tournament.venue}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Prize Pool: ₹{tournament.totalPrizePool}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Component */}
        {getRegistrationComponent()}
      </div>
    </div>
  )
}

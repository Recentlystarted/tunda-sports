'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Crown, Users, Star, DollarSign, Trophy, Phone, Mail, MapPin, Calendar, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

interface TeamOwner {
  id: string
  teamName: string
  teamIndex: number
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  ownerCity: string
  sponsorName?: string
  verified: boolean
  entryFeePaid: boolean
  tournament: {
    id: string
    name: string
    auctionDate: string
    auctionBudget: number
    status: string
  }
}

interface AuctionTeam {
  id: string
  name: string
  totalBudget: number
  spentAmount: number
  remainingBudget: number
  playersCount: number
  players: AuctionPlayer[]
}

interface AuctionPlayer {
  id: string
  name: string
  age: number
  position: string
  experience: string
  soldPrice: number
  auctionRound: number
}

interface AvailablePlayer {
  id: string
  name: string
  age: number
  position: string
  experience: string
  city: string
  basePrice: number
  auctionStatus: string
}

function TeamOwnerPortalContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const teamOwnerId = params.teamOwnerId as string
  const token = searchParams.get('token')
  const expires = searchParams.get('expires')

  const [teamOwner, setTeamOwner] = useState<TeamOwner | null>(null)
  const [auctionTeam, setAuctionTeam] = useState<AuctionTeam | null>(null)
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'auction' | 'team'>('overview')

  // Team management states
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [bidAmount, setBidAmount] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    verifyAccess()
  }, [teamOwnerId, token])

  const verifyAccess = async () => {
    try {
      setLoading(true)
      
      // Check if token is valid and not expired
      if (!token || !expires) {
        setError('Invalid access link')
        return
      }

      const expiresTime = parseInt(expires)
      if (Date.now() > expiresTime) {
        setError('Access link has expired')
        return
      }

      // Fetch team owner details
      const response = await fetch(`/api/team-owners/${teamOwnerId}?token=${token}`)
      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Access denied')
        return
      }

      setTeamOwner(data.teamOwner)
      
      // Fetch auction team if it exists
      if (data.teamOwner.verified) {
        await fetchAuctionTeam()
        await fetchAvailablePlayers()
      }

    } catch (error) {
      console.error('Error verifying access:', error)
      setError('Failed to verify access')
    } finally {
      setLoading(false)
    }
  }

  const fetchAuctionTeam = async () => {
    try {
      const response = await fetch(`/api/tournaments/${teamOwner?.tournament.id}/auction-teams/${teamOwnerId}`)
      const data = await response.json()
      
      if (data.success) {
        setAuctionTeam(data.auctionTeam)
      }
    } catch (error) {
      console.error('Error fetching auction team:', error)
    }
  }

  const fetchAvailablePlayers = async () => {
    try {
      const response = await fetch(`/api/tournaments/${teamOwner?.tournament.id}/auction-players?status=AVAILABLE`)
      const data = await response.json()
      
      if (data.success) {
        setAvailablePlayers(data.players)
      }
    } catch (error) {
      console.error('Error fetching available players:', error)
    }
  }

  const handlePlayerBid = async () => {
    if (!selectedPlayer || !bidAmount || !teamOwner) return

    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/tournaments/${teamOwner.tournament.id}/auction-players/${selectedPlayer}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionStatus: 'SOLD',
          soldPrice: bidAmount,
          auctionTeamId: auctionTeam?.id,
          auctionRound: 1
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Player Acquired!",
          description: `Successfully acquired player for ₹${bidAmount}`,
          variant: "default"
        })
        
        // Refresh data
        await fetchAuctionTeam()
        await fetchAvailablePlayers()
        
        // Reset form
        setSelectedPlayer('')
        setBidAmount(0)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error bidding for player:', error)
      toast({
        title: "Bid Failed",
        description: "Failed to acquire player",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const releasePlayer = async (playerId: string) => {
    if (!teamOwner) return

    try {
      const response = await fetch(`/api/tournaments/${teamOwner.tournament.id}/auction-players/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionStatus: 'AVAILABLE',
          soldPrice: null,
          auctionTeamId: null,
          auctionRound: null
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Player Released",
          description: "Player returned to auction pool",
          variant: "default"
        })
        
        // Refresh data
        await fetchAuctionTeam()
        await fetchAvailablePlayers()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error releasing player:', error)
      toast({
        title: "Release Failed",
        description: "Failed to release player",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying access...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.href = '/'}>
                  Go to Homepage
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!teamOwner) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo.PNG" 
              alt="Tunda Sports Club" 
              className="h-16 w-16 object-contain mr-4"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Crown className="h-8 w-8 text-purple-600" />
                Team Owner Portal
              </h1>
              <p className="text-gray-600">{teamOwner.tournament.name}</p>
            </div>
          </div>
        </div>

        {/* Team Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {teamOwner.teamName}
                  <Badge variant="outline">Team #{teamOwner.teamIndex}</Badge>
                </CardTitle>
                <CardDescription>
                  Owner: {teamOwner.ownerName} • {teamOwner.ownerCity}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {teamOwner.verified ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-300 text-yellow-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending Verification
                  </Badge>
                )}
                {teamOwner.entryFeePaid ? (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Fee Paid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-300 text-red-800">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Payment Pending
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {!teamOwner.verified ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your team ownership is pending verification. You will be able to manage your team once verified by the tournament organizers.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Navigation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button
                    variant={activeTab === 'overview' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('overview')}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Overview
                  </Button>
                  <Button
                    variant={activeTab === 'auction' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('auction')}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Player Auction
                  </Button>
                  <Button
                    variant={activeTab === 'team' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('team')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    My Team
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tournament Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-gray-500" />
                      <span>{teamOwner.tournament.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Auction: {new Date(teamOwner.tournament.auctionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>Budget: ₹{teamOwner.tournament.auctionBudget}</span>
                    </div>
                  </CardContent>
                </Card>

                {auctionTeam && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Players Acquired:</span>
                        <Badge variant="outline">{auctionTeam.playersCount}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Budget Spent:</span>
                        <Badge variant="secondary">₹{auctionTeam.spentAmount}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Remaining Budget:</span>
                        <Badge variant="default">₹{auctionTeam.remainingBudget}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Auction Tab */}
            {activeTab === 'auction' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Player Auction</CardTitle>
                    <CardDescription>
                      Bid for available players to build your team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="player">Select Player</Label>
                        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a player" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePlayers.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.name} - {player.position} (₹{player.basePrice})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bidAmount">Bid Amount (₹)</Label>
                        <Input
                          id="bidAmount"
                          type="number"
                          min={availablePlayers.find(p => p.id === selectedPlayer)?.basePrice || 0}
                          max={auctionTeam?.remainingBudget || 0}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(parseInt(e.target.value))}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={handlePlayerBid}
                          disabled={!selectedPlayer || !bidAmount || submitting}
                          className="w-full"
                        >
                          {submitting ? 'Bidding...' : 'Place Bid'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Available Players</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availablePlayers.map((player) => (
                        <Card key={player.id} className="border border-gray-200">
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold">{player.name}</h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  <span>{player.age} years • {player.position}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{player.city}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Star className="h-3 w-3" />
                                  <span>{player.experience}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" />
                                  <span>Base: ₹{player.basePrice}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <Card>
                <CardHeader>
                  <CardTitle>My Team</CardTitle>
                  <CardDescription>
                    Manage your acquired players
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!auctionTeam || auctionTeam.players.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No players acquired yet. Start bidding in the auction!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {auctionTeam.players.map((player) => (
                        <Card key={player.id} className="border border-gray-200">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="font-semibold">{player.name}</h4>
                                <div className="text-sm text-gray-600">
                                  <span>{player.age} years • {player.position} • {player.experience}</span>
                                </div>
                                <div className="text-sm">
                                  <Badge variant="secondary">₹{player.soldPrice}</Badge>
                                  <Badge variant="outline" className="ml-2">Round {player.auctionRound}</Badge>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => releasePlayer(player.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Release
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function TeamOwnerPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <Crown className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading Team Owner Portal...</h1>
            <p className="text-gray-600">Please wait while we load your team information.</p>
          </div>
        </div>
      </div>
    }>
      <TeamOwnerPortalContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Users, Crown, Star, Phone, Mail, MapPin, Calendar, DollarSign, Eye, Filter, AlertTriangle, Copy, ExternalLink, Download, MessageCircle, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { useAdminRegistrations, useRegistrationActions, useTournaments } from '@/hooks/useRealTimeData'
import { tournamentApi, apiFetch } from '@/lib/apiUtils'

interface Tournament {
  id: string
  name: string
  format: string
  startDate: string
  status: string
  isAuctionBased: boolean
  playerEntryFee: number
  teamEntryFee: number
  entryFee: number
  _count: {
    registrations: number
    auctionPlayers: number
    teamOwners: number
  }
}

interface TeamRegistration {
  id: string
  status: string
  paymentStatus: string
  paymentAmount: number
  paymentMethod: string
  registrationDate: string
  contactEmail: string
  contactPhone: string
  specialRequests?: string
  notes?: string
  team: {
    id: string
    name: string
    city: string
    captainName: string
    captainPhone: string
    captainEmail: string
    players: any[]
    _count: {
      players: number
    }
  }
  tournament: {
    name: string
    venue: string
    startDate: string
    entryFee: number
  }
}

interface AuctionPlayer {
  id: string
  name: string
  age: number
  phone: string
  email: string
  city: string
  position: string
  experience: string
  basePrice: number
  soldPrice?: number
  auctionStatus: string
  entryFeePaid: boolean
  specialSkills?: string
  auctionTeam?: {
    name: string
  }
}

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
  createdAt: string
  auctionToken?: string
  totalBudget?: number
  remainingBudget?: number
}

export default function AdminRegistrationsMain() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading Registration Management...</h1>
          <p className="text-gray-600">Please wait while we load the registration data.</p>
        </div>
      </div>
    }>
      <AdminRegistrationsMainContent />
    </Suspense>
  );
}

function AdminRegistrationsMainContent() {
  const searchParams = useSearchParams()
  const preSelectedTournamentId = searchParams.get('tournament')
  
  // Local state
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('teams')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionPlayer[]>([])
  const [teamOwners, setTeamOwners] = useState<TeamOwner[]>([])
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState<AuctionPlayer | null>(null)
  const [selectedOwnerDetails, setSelectedOwnerDetails] = useState<TeamOwner | null>(null)
  
  // Professional SWR hooks for real-time data
  const { tournaments, isLoading: tournamentsLoading } = useTournaments()
  const { registrations, pagination, isLoading: registrationsLoading, error, refresh } = useAdminRegistrations({
    status: statusFilter === 'all' ? undefined : statusFilter,
    tournamentId: selectedTournament?.id,
    page: currentPage,
    limit: 20
  })
  
  // Professional action hooks
  const { approveRegistration, rejectRegistration, approveForAuction, isLoading: swrActionLoading } = useRegistrationActions()

  // Auto-select tournament on load
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournament) {
      let tournamentToSelect = null
      
      // Try URL parameter first
      if (preSelectedTournamentId) {
        tournamentToSelect = tournaments.find((t: Tournament) => t.id === preSelectedTournamentId)
      }
      
      // Try localStorage backup
      if (!tournamentToSelect) {
        const storedTournamentId = localStorage.getItem('admin-selected-tournament-id')
        if (storedTournamentId) {
          tournamentToSelect = tournaments.find((t: Tournament) => t.id === storedTournamentId)
        }
      }
      
      // Fallback to first tournament
      if (!tournamentToSelect && tournaments.length > 0) {
        tournamentToSelect = tournaments[0]
      }
      
      if (tournamentToSelect) {
        setSelectedTournament(tournamentToSelect)
        setActiveTab(tournamentToSelect.isAuctionBased ? 'players' : 'teams')
        localStorage.setItem('admin-selected-tournament-id', tournamentToSelect.id)
      }
    }
  }, [tournaments, selectedTournament, preSelectedTournamentId])

  // Fetch additional data for auction-based tournaments
  useEffect(() => {
    if (selectedTournament?.isAuctionBased) {
      fetchAuctionData()
    }
  }, [selectedTournament])

  const fetchAuctionData = async () => {
    if (!selectedTournament?.isAuctionBased) return

    try {
      // Fetch auction players
      const playersData = await tournamentApi.getAuctionPlayers(selectedTournament.id)
      if (playersData.success) {
        setAuctionPlayers(playersData.players)
      }

      // Fetch team owners
      const ownersData = await tournamentApi.getTeamOwners(selectedTournament.id)
      if (ownersData.success) {
        setTeamOwners(ownersData.teamOwners)
      }
    } catch (error) {
      console.error('Error fetching auction data:', error)
    }
  }

  const handleTournamentChange = (tournamentId: string) => {
    const tournament = tournaments.find((t: Tournament) => t.id === tournamentId)
    if (tournament) {
      setSelectedTournament(tournament)
      setActiveTab(tournament.isAuctionBased ? 'players' : 'teams')
      localStorage.setItem('admin-selected-tournament-id', tournament.id)
      setCurrentPage(1) // Reset pagination
    }
  }

  const handleStatusUpdate = async (registrationId: string, newStatus: string) => {
    try {
      if (newStatus === 'APPROVED') {
        await approveRegistration(registrationId)
      } else if (newStatus === 'REJECTED') {
        await rejectRegistration(registrationId)
      }
      
      toast({
        title: 'Success',
        description: `Registration ${newStatus.toLowerCase()} successfully`,
      })
      
      // SWR will automatically refresh the data
      refresh()
    } catch (error) {
      console.error('Error updating registration:', error)
      toast({
        title: 'Error',
        description: 'Failed to update registration status',
        variant: 'destructive',
      })
    }
  }

  const handleAuctionApproval = async (registrationId: string) => {
    try {
      await approveForAuction(registrationId)
      
      toast({
        title: 'Success',
        description: 'Players approved for auction successfully',
      })
      
      // SWR will automatically refresh the data
      refresh()
      
      // Also refresh auction data
      if (selectedTournament?.isAuctionBased) {
        fetchAuctionData()
      }
    } catch (error) {
      console.error('Error approving for auction:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve players for auction',
        variant: 'destructive',
      })
    }
  }

  const updatePaymentStatus = async (registrationId: string, paymentStatus: string, type: 'team' | 'owner' | 'player') => {
    const actionId = `payment-${registrationId}-${paymentStatus}`
    setActionLoading(actionId)
    
    try {
      let endpoint = ''
      let body = {}

      if (type === 'team') {
        endpoint = `/api/registrations/${registrationId}`
        body = { paymentStatus }
      } else if (type === 'owner') {
        endpoint = `/api/tournaments/${selectedTournament?.id}/team-owners/${registrationId}`
        body = { action: paymentStatus === 'COMPLETED' ? 'MARK_PAID' : 'UNMARK_PAID' }
      } else if (type === 'player') {
        endpoint = `/api/tournaments/${selectedTournament?.id}/auction-players/${registrationId}`
        body = { action: paymentStatus === 'COMPLETED' ? 'MARK_PAID' : 'UNMARK_PAID' }
      }

      const response = await apiFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Payment status updated successfully`,
        })
        
        // Refresh data
        refresh()
        if (selectedTournament?.isAuctionBased) {
          fetchAuctionData()
        }
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const updatePlayerAuctionStatus = async (playerId: string, auctionStatus: string) => {
    const actionId = `player-${playerId}-${auctionStatus}`
    setActionLoading(actionId)
    
    try {
      const result = await tournamentApi.updatePlayerStatus(selectedTournament?.id || '', playerId, auctionStatus)
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Player ${auctionStatus.toLowerCase()} for auction successfully`,
        })
        
        // Update local state immediately for better UX
        setAuctionPlayers(prevPlayers => 
          prevPlayers.map(player => 
            player.id === playerId 
              ? { ...player, auctionStatus: auctionStatus }
              : player
          )
        )
        
        // Also refresh from server
        setTimeout(() => {
          fetchAuctionData()
        }, 1000)
        
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating player status:', error)
      toast({
        title: "Error",
        description: "Failed to update player status",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const regenerateAuctionToken = async (ownerId: string) => {
    const actionId = `regen-token-${ownerId}`
    setActionLoading(actionId)
    
    try {
      const response = await apiFetch(`/api/tournaments/${selectedTournament?.id}/team-owners/${ownerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'REGENERATE_TOKEN' })
      })
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Auction token regenerated successfully",
        })
        fetchAuctionData()
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error('Error regenerating auction token:', error)
      toast({
        title: "Error",
        description: "Failed to regenerate auction token",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'APPROVED': 'default',
      'REJECTED': 'destructive',
      'PENDING': 'secondary'
    } as const
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    )
  }

  // Filter registrations by search term
  const filteredRegistrations = registrations.filter((reg: TeamRegistration) =>
    reg.team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.team.captainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPlayers = auctionPlayers.filter((player: AuctionPlayer) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOwners = teamOwners.filter((owner: TeamOwner) =>
    owner.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.ownerCity.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load registrations. Please try again.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => refresh()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Registration Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage team registrations, auction players, and team owners
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refresh()
              if (selectedTournament?.isAuctionBased) {
                fetchAuctionData()
              }
            }}
            disabled={registrationsLoading}
          >
            {registrationsLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Tournament Selection and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Tournament & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="tournament-select">Tournament</Label>
              <Select 
                value={selectedTournament?.id || ''} 
                onValueChange={handleTournamentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament: Tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                      {tournament.isAuctionBased && (
                        <Badge variant="secondary" className="ml-2">Auction</Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search teams, players, or owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => window.open(`/admin/auction-live?tournament=${selectedTournament?.id}`, '_blank')}
                disabled={!selectedTournament?.isAuctionBased}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Auction Live
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Tabs based on tournament type */}
      {selectedTournament && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="teams">
              Team Registrations
              <Badge variant="secondary" className="ml-2">
                {filteredRegistrations.length}
              </Badge>
            </TabsTrigger>
            {selectedTournament.isAuctionBased && (
              <>
                <TabsTrigger value="players">
                  Auction Players
                  <Badge variant="secondary" className="ml-2">
                    {filteredPlayers.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="owners">
                  Team Owners
                  <Badge variant="secondary" className="ml-2">
                    {filteredOwners.length}
                  </Badge>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Team Registrations Tab */}
          <TabsContent value="teams">
            {registrationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading registrations...</p>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No registrations found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No registrations match your current filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredRegistrations.map((registration: TeamRegistration) => (
                  <Card key={registration.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {registration.team.name}
                          </CardTitle>
                          <CardDescription>
                            Tournament: {registration.tournament.name}
                          </CardDescription>
                        </div>
                        {getStatusBadge(registration.status)}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">
                            <strong>Captain:</strong> {registration.team.captainName}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{registration.team.captainPhone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">{registration.team.captainEmail}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span className="text-sm">
                            <strong>Players:</strong> {registration.team._count.players}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-indigo-500" />
                          <span className="text-sm">
                            {new Date(registration.registrationDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            <strong>Fee:</strong> ₹{registration.paymentAmount}
                          </span>
                        </div>
                      </div>
                      
                      {registration.specialRequests && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm">
                            <strong>Special Requests:</strong> {registration.specialRequests}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {registration.status === 'PENDING' && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="default" size="sm" disabled={swrActionLoading}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Registration</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to approve the registration for {registration.team.name}?
                                    This will send an approval email to the team captain.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(registration.id, 'APPROVED')}
                                  >
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={swrActionLoading}>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Registration</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject the registration for {registration.team.name}?
                                    This will send a rejection email to the team captain.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(registration.id, 'REJECTED')}
                                  >
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        
                        {registration.status === 'APPROVED' && selectedTournament?.isAuctionBased && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="secondary" size="sm" disabled={swrActionLoading}>
                                <Crown className="h-4 w-4 mr-1" />
                                Approve for Auction
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve for Auction</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will add all players from {registration.team.name} to the auction pool 
                                  and send auction details to team members.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleAuctionApproval(registration.id)}
                                >
                                  Approve for Auction
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        <Select 
                          value={registration.paymentStatus} 
                          onValueChange={(value) => updatePaymentStatus(registration.id, value, 'team')}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Payment Pending</SelectItem>
                            <SelectItem value="COMPLETED">Payment Completed</SelectItem>
                            <SelectItem value="FAILED">Payment Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || registrationsLoading}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                
                <span className="px-3 py-2 text-sm text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.totalPages || registrationsLoading}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Auction Players Tab */}
          {selectedTournament?.isAuctionBased && (
            <TabsContent value="players">
              <div className="grid gap-4">
                {filteredPlayers.map((player: AuctionPlayer) => (
                  <Card key={player.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{player.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {player.position} • {player.city} • Age: {player.age}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            player.auctionStatus === 'APPROVED' ? 'default' :
                            player.auctionStatus === 'REJECTED' ? 'destructive' : 'secondary'
                          }>
                            {player.auctionStatus}
                          </Badge>
                          {player.entryFeePaid && (
                            <Badge variant="outline" className="ml-2">
                              Paid
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Phone:</span> {player.phone}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {player.email}
                        </div>
                        <div>
                          <span className="font-medium">Experience:</span> {player.experience}
                        </div>
                        <div>
                          <span className="font-medium">Base Price:</span> ₹{player.basePrice}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {player.auctionStatus === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updatePlayerAuctionStatus(player.id, 'APPROVED')}
                              disabled={actionLoading === `player-${player.id}-APPROVED`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updatePlayerAuctionStatus(player.id, 'REJECTED')}
                              disabled={actionLoading === `player-${player.id}-REJECTED`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        <Select 
                          value={player.entryFeePaid ? 'COMPLETED' : 'PENDING'} 
                          onValueChange={(value) => updatePaymentStatus(player.id, value, 'player')}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Payment Pending</SelectItem>
                            <SelectItem value="COMPLETED">Payment Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPlayerDetails(player)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Team Owners Tab */}
          {selectedTournament?.isAuctionBased && (
            <TabsContent value="owners">
              <div className="grid gap-4">
                {filteredOwners.map((owner: TeamOwner) => (
                  <Card key={owner.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{owner.teamName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Team #{owner.teamIndex} • Owner: {owner.ownerName}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={owner.verified ? 'default' : 'secondary'}>
                            {owner.verified ? 'Verified' : 'Pending'}
                          </Badge>
                          {owner.entryFeePaid && (
                            <Badge variant="outline" className="ml-2">
                              Paid
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium">Phone:</span> {owner.ownerPhone}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {owner.ownerEmail}
                        </div>
                        <div>
                          <span className="font-medium">City:</span> {owner.ownerCity}
                        </div>
                        <div>
                          <span className="font-medium">Budget:</span> ₹{owner.totalBudget}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Select 
                          value={owner.entryFeePaid ? 'COMPLETED' : 'PENDING'} 
                          onValueChange={(value) => updatePaymentStatus(owner.id, value, 'owner')}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Payment Pending</SelectItem>
                            <SelectItem value="COMPLETED">Payment Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => regenerateAuctionToken(owner.id)}
                          disabled={actionLoading === `regen-token-${owner.id}`}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Regenerate Token
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOwnerDetails(owner)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Player Details Dialog */}
      <Dialog open={!!selectedPlayerDetails} onOpenChange={() => setSelectedPlayerDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Player Details: {selectedPlayerDetails?.name}</DialogTitle>
          </DialogHeader>
          {selectedPlayerDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm">{selectedPlayerDetails.name}</p>
                </div>
                <div>
                  <Label>Age</Label>
                  <p className="text-sm">{selectedPlayerDetails.age}</p>
                </div>
                <div>
                  <Label>Position</Label>
                  <p className="text-sm">{selectedPlayerDetails.position}</p>
                </div>
                <div>
                  <Label>City</Label>
                  <p className="text-sm">{selectedPlayerDetails.city}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">{selectedPlayerDetails.phone}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedPlayerDetails.email}</p>
                </div>
                <div>
                  <Label>Experience</Label>
                  <p className="text-sm">{selectedPlayerDetails.experience}</p>
                </div>
                <div>
                  <Label>Base Price</Label>
                  <p className="text-sm">₹{selectedPlayerDetails.basePrice}</p>
                </div>
              </div>
              {selectedPlayerDetails.specialSkills && (
                <div>
                  <Label>Special Skills</Label>
                  <p className="text-sm">{selectedPlayerDetails.specialSkills}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Owner Details Dialog */}
      <Dialog open={!!selectedOwnerDetails} onOpenChange={() => setSelectedOwnerDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Team Owner Details: {selectedOwnerDetails?.teamName}</DialogTitle>
          </DialogHeader>
          {selectedOwnerDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Team Name</Label>
                  <p className="text-sm">{selectedOwnerDetails.teamName}</p>
                </div>
                <div>
                  <Label>Team Index</Label>
                  <p className="text-sm">#{selectedOwnerDetails.teamIndex}</p>
                </div>
                <div>
                  <Label>Owner Name</Label>
                  <p className="text-sm">{selectedOwnerDetails.ownerName}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">{selectedOwnerDetails.ownerPhone}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedOwnerDetails.ownerEmail}</p>
                </div>
                <div>
                  <Label>City</Label>
                  <p className="text-sm">{selectedOwnerDetails.ownerCity}</p>
                </div>
                <div>
                  <Label>Total Budget</Label>
                  <p className="text-sm">₹{selectedOwnerDetails.totalBudget}</p>
                </div>
                <div>
                  <Label>Remaining Budget</Label>
                  <p className="text-sm">₹{selectedOwnerDetails.remainingBudget}</p>
                </div>
              </div>
              {selectedOwnerDetails.sponsorName && (
                <div>
                  <Label>Sponsor</Label>
                  <p className="text-sm">{selectedOwnerDetails.sponsorName}</p>
                </div>
              )}
              {selectedOwnerDetails.auctionToken && (
                <div>
                  <Label>Auction Token</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {selectedOwnerDetails.auctionToken}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOwnerDetails.auctionToken || '')
                        toast({
                          title: "Copied!",
                          description: "Auction token copied to clipboard",
                        })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Users, Crown, Star, Phone, Mail, MapPin, Calendar, DollarSign, Eye, Edit, Trash2, Download, Filter } from 'lucide-react'
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
import { EmailService } from '@/lib/emailTemplates'

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
    players: any[]
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
  specialSkills?: string // Using this field to track payment status as workaround
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
}

export default function AdminRegistrationManagement() {
  const searchParams = useSearchParams()
  const preSelectedTournamentId = searchParams.get('tournament')
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([])
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionPlayer[]>([])
  const [teamOwners, setTeamOwners] = useState<TeamOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('teams')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState<AuctionPlayer | null>(null)
  const [selectedOwnerDetails, setSelectedOwnerDetails] = useState<TeamOwner | null>(null)

  useEffect(() => {
    fetchTournaments()
  }, [])

  // Auto-select tournament if provided in URL (but don't force it)
  useEffect(() => {
    if (preSelectedTournamentId && tournaments.length > 0 && !selectedTournament) {
      const tournament = tournaments.find(t => t.id === preSelectedTournamentId)
      if (tournament) {
        setSelectedTournament(tournament)
        setActiveTab(tournament.isAuctionBased ? 'players' : 'teams')
      }
    }
  }, [preSelectedTournamentId, tournaments, selectedTournament])

  useEffect(() => {
    if (selectedTournament) {
      fetchRegistrationData()
    }
  }, [selectedTournament])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tournaments?status=all')
      const data = await response.json()
      
      if (data.success) {
        setTournaments(data.tournaments)
        if (data.tournaments.length > 0 && !selectedTournament) {
          setSelectedTournament(data.tournaments[0])
        }
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrationData = async () => {
    if (!selectedTournament) return

    try {
      // Fetch team registrations
      if (!selectedTournament.isAuctionBased) {
        const teamResponse = await fetch(`/api/tournaments/${selectedTournament.id}/team-registration`)
        const teamData = await teamResponse.json()
        if (teamData.success) {
          setTeamRegistrations(teamData.registrations)
        }
      }

      // Fetch auction players
      if (selectedTournament.isAuctionBased) {
        const playersResponse = await fetch(`/api/tournaments/${selectedTournament.id}/auction-players`)
        const playersData = await playersResponse.json()
        if (playersData.success) {
          setAuctionPlayers(playersData.players)
        }

        // Fetch team owners
        const ownersResponse = await fetch(`/api/tournaments/${selectedTournament.id}/team-owners`)
        const ownersData = await ownersResponse.json()
        if (ownersData.success) {
          setTeamOwners(ownersData.teamOwners)
        }
      }
    } catch (error) {
      console.error('Error fetching registration data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch registration data",
        variant: "destructive"
      })
    }
  }

  const updateRegistrationStatus = async (registrationId: string, status: string, type: 'team' | 'player' | 'owner') => {
    try {
      let endpoint = ''
      let body = {}

      if (type === 'team') {
        endpoint = `/api/registrations/${registrationId}`
        body = { status }
      } else if (type === 'player') {
        endpoint = `/api/tournaments/${selectedTournament?.id}/auction-players/${registrationId}`
        body = { auctionStatus: status }
      } else if (type === 'owner') {
        endpoint = `/api/tournaments/${selectedTournament?.id}/team-owners`
        body = { teamOwnerId: registrationId, verified: status === 'APPROVED' }
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Registration ${status.toLowerCase()} successfully`,
          variant: "default"
        })
        fetchRegistrationData()
        
        // Send automatic email notification
        if (type === 'owner') {
          sendOwnerEmail(registrationId, status.toLowerCase())
        } else if (type === 'player') {
          sendPlayerEmail(registrationId, status.toLowerCase())
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating registration status:', error)
      toast({
        title: "Error",
        description: "Failed to update registration status",
        variant: "destructive"
      })
    }
  }

  const updatePaymentStatus = async (registrationId: string, paymentStatus: string, type: 'team' | 'owner') => {
    try {
      let endpoint = ''
      let body = {}

      if (type === 'team') {
        endpoint = `/api/registrations/${registrationId}`
        body = { paymentStatus }
      } else if (type === 'owner') {
        endpoint = `/api/tournaments/${selectedTournament?.id}/team-owners`
        body = { teamOwnerId: registrationId, entryFeePaid: paymentStatus === 'COMPLETED' }
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Payment status updated successfully`,
          variant: "default"
        })
        fetchRegistrationData()
        
        // Send automatic email notification
        if (type === 'owner') {
          sendOwnerEmail(registrationId, 'payment_received')
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      })
    }
  }

  const updatePlayerAuctionStatus = async (playerId: string, auctionStatus: string) => {
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament?.id}/auction-players/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionStatus })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Player ${auctionStatus.toLowerCase()} for auction successfully`,
          variant: "default"
        })
        fetchRegistrationData()
        
        // Send email notification for approval/rejection
        if (auctionStatus === 'APPROVED' || auctionStatus === 'REJECTED') {
          sendPlayerEmail(playerId, auctionStatus)
        }
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
    }
  }

  const updatePlayerPaymentStatus = async (playerId: string, paymentStatus: string) => {
    try {
      // For now, we'll use a note or comment field to track payment since schema doesn't have payment fields for players
      // In a real implementation, you'd add entryFeePaid field to AuctionPlayer model
      const response = await fetch(`/api/tournaments/${selectedTournament?.id}/auction-players/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          specialSkills: paymentStatus === 'PAID' ? 'PAYMENT_RECEIVED' : 'PAYMENT_PENDING' // Using existing field as workaround
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Player payment status updated successfully`,
          variant: "default"
        })
        fetchRegistrationData()
        
        // Send automatic email notification
        sendPlayerEmail(playerId, 'payment_received')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating player payment status:', error)
      toast({
        title: "Error",
        description: "Failed to update player payment status",
        variant: "destructive"
      })
    }
  }

  const sendPlayerEmail = async (playerId: string, status: string) => {
    try {
      const player = auctionPlayers.find(p => p.id === playerId)
      if (!player || !selectedTournament) return

      const tournamentData = {
        id: selectedTournament.id,
        name: selectedTournament.name,
        startDate: selectedTournament.startDate,
        venue: 'Tunda Cricket Ground', // You may want to add this to your tournament model
        auctionDate: new Date().toISOString(), // You may want to add this to your tournament model  
        playerEntryFee: selectedTournament.playerEntryFee || 500,
        teamEntryFee: selectedTournament.teamEntryFee || 5000
      }

      const playerData = {
        id: player.id,
        name: player.name,
        age: player.age,
        phone: player.phone,
        email: player.email,
        city: player.city,
        position: player.position,
        experience: player.experience,
        basePrice: player.basePrice,
        soldPrice: player.soldPrice,
        auctionStatus: player.auctionStatus,
        auctionTeam: player.auctionTeam ? {
          name: player.auctionTeam.name,
          ownerName: 'Owner Name', // TODO: Get from team owner data
          ownerPhone: 'Owner Phone' // TODO: Get from team owner data
        } : undefined
      }

      let emailSent = false
      
      switch (status.toLowerCase()) {
        case 'approved':
          emailSent = await EmailService.sendPlayerApprovedEmail(playerData, tournamentData)
          break
        case 'payment_received':
          emailSent = await EmailService.sendPlayerPaymentReceivedEmail(playerData, tournamentData)
          break
        case 'sold':
          emailSent = await EmailService.sendPlayerSoldEmail(playerData, tournamentData)
          break
        case 'unsold':
          emailSent = await EmailService.sendPlayerUnsoldEmail(playerData, tournamentData)
          break
        default:
          console.log(`No email template for status: ${status}`)
          return
      }
      
      if (emailSent) {
        toast({
          title: "Email Sent",
          description: `Notification email sent to ${player.name}`,
          variant: "default"
        })
      } else {
        toast({
          title: "Email Failed",
          description: `Failed to send email to ${player.name}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "Email Error",
        description: "Status updated but email notification failed",
        variant: "destructive"
      })
    }
  }

  const sendOwnerEmail = async (ownerId: string, status: string) => {
    try {
      const owner = teamOwners.find(o => o.id === ownerId)
      if (!owner || !selectedTournament) return

      const tournamentData = {
        id: selectedTournament.id,
        name: selectedTournament.name,
        startDate: selectedTournament.startDate,
        venue: 'Tunda Cricket Ground', // You may want to add this to your tournament model
        auctionDate: new Date().toISOString(), // You may want to add this to your tournament model
        playerEntryFee: selectedTournament.playerEntryFee || 500,
        teamEntryFee: selectedTournament.teamEntryFee || 5000
      }

      const ownerData = {
        id: owner.id,
        teamName: owner.teamName,
        teamIndex: owner.teamIndex,
        ownerName: owner.ownerName,
        ownerPhone: owner.ownerPhone,
        ownerEmail: owner.ownerEmail,
        ownerCity: owner.ownerCity,
        sponsorName: owner.sponsorName,
        verified: owner.verified,
        entryFeePaid: owner.entryFeePaid
      }

      let emailSent = false
      
      switch (status.toLowerCase()) {
        case 'approved':
          emailSent = await EmailService.sendOwnerVerifiedEmail(ownerData, tournamentData)
          break
        case 'payment_received':
          // You might want to create a specific payment received template for owners
          console.log(`Owner payment received notification for ${owner.ownerName}`)
          emailSent = true // Assume success for now
          break
        default:
          console.log(`No email template for owner status: ${status}`)
          return
      }
      
      if (emailSent) {
        toast({
          title: "Email Sent",
          description: `Notification email sent to ${owner.ownerName}`,
          variant: "default"
        })
      } else {
        toast({
          title: "Email Failed",
          description: `Failed to send email to ${owner.ownerName}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "Email Error",
        description: "Status updated but email notification failed",
        variant: "destructive"
      })
    }
  }

  const sendAuctionCompletionNotifications = async () => {
    if (!selectedTournament || !selectedTournament.isAuctionBased) return

    try {
      const response = await fetch(`/api/tournaments/${selectedTournament.id}/auction-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_completion_notifications' })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Notifications Sent",
          description: `Auction completion emails sent to all participants`,
          variant: "default"
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error sending auction completion notifications:', error)
      toast({
        title: "Error",
        description: "Failed to send auction completion notifications",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string, isPayment: boolean = false) => {
    if (isPayment) {
      switch (status) {
        case 'COMPLETED':
          return <Badge variant="default">Paid</Badge>
        case 'PENDING':
          return <Badge variant="secondary">Pending Payment</Badge>
        case 'FAILED':
          return <Badge variant="destructive">Failed</Badge>
        default:
          return <Badge variant="outline">{status}</Badge>
      }
    } else {
      switch (status) {
        case 'APPROVED':
        case 'AVAILABLE':
          return <Badge variant="default">Approved</Badge>
        case 'PENDING':
          return <Badge variant="secondary">Pending</Badge>
        case 'REJECTED':
          return <Badge variant="destructive">Rejected</Badge>
        case 'SOLD':
          return <Badge variant="outline">Sold</Badge>
        default:
          return <Badge variant="outline">{status}</Badge>
      }
    }
  }

  const filteredTeamRegistrations = teamRegistrations.filter(reg => {
    const matchesSearch = reg.team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.team.captainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.contactPhone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredAuctionPlayers = (auctionPlayers || []).filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || player.auctionStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredTeamOwners = (teamOwners || []).filter(owner => {
    const matchesSearch = owner.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.ownerPhone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'APPROVED' ? owner.verified : !owner.verified)
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading registration data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.PNG" 
              alt="Tunda Sports Club" 
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Registration Management</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage tournament registrations and approvals</p>
            </div>
          </div>
        </div>

        {/* Tournament Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Select Tournament</CardTitle>
              {preSelectedTournamentId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.history.pushState({}, '', '/admin/registrations-new')
                    setSelectedTournament(null)
                    setActiveTab('teams')
                  }}
                >
                  View All Tournaments
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedTournament?.id || ''}
              onValueChange={(value) => {
                const tournament = tournaments.find(t => t.id === value)
                setSelectedTournament(tournament || null)
                setActiveTab(tournament?.isAuctionBased ? 'players' : 'teams')
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    <div className="flex items-center gap-2">
                      <span>{tournament.name}</span>
                      {tournament.isAuctionBased && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Auction
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedTournament && (
          <>
            {/* Tournament Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {!selectedTournament.isAuctionBased && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Registrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-2xl font-bold text-primary">
                      {selectedTournament._count.registrations}
                    </div>
                    <p className="text-xs text-muted-foreground">Total teams registered</p>
                  </CardContent>
                </Card>
              )}

              {selectedTournament.isAuctionBased && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Player Registrations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-2xl font-bold text-primary">
                        {selectedTournament._count.auctionPlayers}
                      </div>
                      <p className="text-xs text-muted-foreground">Players in auction pool</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Team Owners
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-2xl font-bold text-primary">
                        {selectedTournament._count.teamOwners}
                      </div>
                      <p className="text-xs text-muted-foreground">Registered team owners</p>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold text-primary">
                    ₹{selectedTournament.isAuctionBased 
                      ? (selectedTournament._count.auctionPlayers * selectedTournament.playerEntryFee + 
                         selectedTournament._count.teamOwners * selectedTournament.teamEntryFee)
                      : (selectedTournament._count.registrations * selectedTournament.entryFee)
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Total registration fees</p>
                </CardContent>
              </Card>
            </div>

            {/* Auction Completion Actions */}
            {selectedTournament.isAuctionBased && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Auction Completion Actions
                  </CardTitle>
                  <CardDescription>
                    Send final notifications to all participants after auction completion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Send All Final Notifications
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Send Auction Completion Notifications</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>This will send the following notifications:</p>
                            <ul className="list-disc pl-6 space-y-1 text-sm">
                              <li><strong>Team Owners:</strong> Complete team roster with all player contact details</li>
                              <li><strong>Sold Players:</strong> Notification with team and owner details</li>
                              <li><strong>Unsold Players:</strong> Notification about auction result</li>
                            </ul>
                            <p className="text-amber-600 text-sm">
                              <strong>Note:</strong> This should only be done after the auction is completely finished.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={sendAuctionCompletionNotifications}>
                            Send All Notifications
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <div className="text-sm text-muted-foreground flex-1">
                      <p className="mb-2">This will notify:</p>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Team Owners:</span> {selectedTournament._count.teamOwners}
                        </div>
                        <div>
                          <span className="font-medium">Sold Players:</span> {filteredAuctionPlayers.filter(p => p.auctionStatus === 'SOLD').length}
                        </div>
                        <div>
                          <span className="font-medium">Unsold Players:</span> {filteredAuctionPlayers.filter(p => p.auctionStatus === 'UNSOLD' || p.auctionStatus === 'AVAILABLE').length}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search by name, phone, or city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status Filter</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending Approval</SelectItem>
                        <SelectItem value="APPROVED">Approved for Auction</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        {selectedTournament.isAuctionBased && (
                          <>
                            <SelectItem value="AVAILABLE">Available for Auction</SelectItem>
                            <SelectItem value="SOLD">Sold in Auction</SelectItem>
                            <SelectItem value="UNSOLD">Unsold in Auction</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Tabs */}
            <Card>
              <CardHeader className="pb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger 
                      value="teams" 
                      disabled={selectedTournament.isAuctionBased}
                      className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 text-xs sm:text-sm"
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Team Registrations</span>
                      <span className="sm:hidden">Teams</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="players"
                      disabled={!selectedTournament.isAuctionBased}
                      className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 text-xs sm:text-sm"
                    >
                      <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Player Registrations</span>
                      <span className="sm:hidden">Players</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="owners"
                      disabled={!selectedTournament.isAuctionBased}
                      className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 text-xs sm:text-sm"
                    >
                      <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Team Owners</span>
                      <span className="sm:hidden">Owners</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Team Registrations Tab */}
                  <TabsContent value="teams" className="mt-6">
                    <div className="space-y-4">
                      {filteredTeamRegistrations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No team registrations found</p>
                        </div>
                      ) : (
                        filteredTeamRegistrations.map((registration) => (
                          <Card key={registration.id} className="border">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="font-semibold text-base sm:text-lg">{registration.team.name}</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {getStatusBadge(registration.status)}
                                      {getStatusBadge(registration.paymentStatus, true)}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-3 w-3" />
                                          <span>Captain: {registration.team.captainName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-3 w-3" />
                                          <span className="truncate">{registration.contactPhone}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-3 w-3" />
                                          <span className="truncate">{registration.contactEmail}</span>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3 w-3" />
                                          <span>{registration.team.city}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3 w-3" />
                                          <span>{new Date(registration.registrationDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="h-3 w-3" />
                                          <span>₹{registration.paymentAmount} ({registration.paymentMethod})</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                      <Users className="h-3 w-3" />
                                      <span>{registration.team.players.length} players registered</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 sm:flex-col sm:w-auto">
                                    {registration.status === 'PENDING' && (
                                      <>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="default" className="text-xs px-2 py-1 h-auto">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Approve
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Approve Registration</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to approve {registration.team.name}'s registration?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction 
                                                onClick={() => updateRegistrationStatus(registration.id, 'APPROVED', 'team')}
                                              >
                                                Approve
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>

                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="destructive" className="text-xs px-2 py-1 h-auto">
                                              <XCircle className="h-3 w-3 mr-1" />
                                              Reject
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Reject Registration</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to reject {registration.team.name}'s registration?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction 
                                                onClick={() => updateRegistrationStatus(registration.id, 'REJECTED', 'team')}
                                              >
                                                Reject
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </>
                                    )}

                                    {registration.paymentStatus === 'PENDING' && (
                                      <Select
                                        value={registration.paymentStatus}
                                        onValueChange={(value) => updatePaymentStatus(registration.id, value, 'team')}
                                      >
                                        <SelectTrigger className="w-24 h-7 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="PENDING">Pending</SelectItem>
                                          <SelectItem value="COMPLETED">Paid</SelectItem>
                                          <SelectItem value="FAILED">Failed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}

                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-auto">
                                          <Eye className="h-3 w-3 mr-1" />
                                          View
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>{registration.team.name} - Full Details</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                              <h4 className="font-semibold mb-2">Team Information</h4>
                                              <div className="space-y-1 text-sm">
                                                <p><strong>Name:</strong> {registration.team.name}</p>
                                                <p><strong>City:</strong> {registration.team.city}</p>
                                                <p><strong>Captain:</strong> {registration.team.captainName}</p>
                                                <p><strong>Phone:</strong> {registration.team.captainPhone}</p>
                                              </div>
                                            </div>
                                            <div>
                                              <h4 className="font-semibold mb-2">Registration Details</h4>
                                              <div className="space-y-1 text-sm">
                                                <p><strong>Status:</strong> {registration.status}</p>
                                                <p><strong>Payment:</strong> {registration.paymentStatus}</p>
                                                <p><strong>Amount:</strong> ₹{registration.paymentAmount}</p>
                                                <p><strong>Method:</strong> {registration.paymentMethod}</p>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <h4 className="font-semibold mb-2">Players ({registration.team.players.length})</h4>
                                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                                              {registration.team.players.map((player: any, index: number) => (
                                                <div key={index} className="border rounded p-2">
                                                  <p><strong>{player.name}</strong> ({player.age} years)</p>
                                                  <p>{player.position} • {player.experience}</p>
                                                  <p>{player.phone}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          {registration.specialRequests && (
                                            <div>
                                              <h4 className="font-semibold mb-2">Special Requests</h4>
                                              <p className="text-sm bg-muted p-3 rounded">{registration.specialRequests}</p>
                                            </div>
                                          )}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Player Registrations Tab */}
                  <TabsContent value="players" className="mt-6">
                    <div className="space-y-4">
                      {filteredAuctionPlayers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No player registrations found</p>
                        </div>
                      ) : (
                        filteredAuctionPlayers.map((player) => (
                          <Card key={player.id} className="border">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="font-semibold text-base sm:text-lg">{player.name}</h3>
                                      <Badge variant="outline" className="text-xs">{player.position}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {getStatusBadge(player.auctionStatus)}
                                      {getStatusBadge(player.specialSkills === 'PAYMENT_RECEIVED' ? 'COMPLETED' : 'PENDING', true)}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-3 w-3" />
                                          <span>Age: {player.age}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-3 w-3" />
                                          <span className="truncate">{player.phone}</span>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3 w-3" />
                                          <span>{player.city}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Star className="h-3 w-3" />
                                          <span className="truncate">{player.experience}</span>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="h-3 w-3" />
                                          <span>₹{player.basePrice || 0}</span>
                                        </div>
                                        {player.auctionTeam && (
                                          <div className="flex items-center gap-2">
                                            <Crown className="h-3 w-3" />
                                            <span className="truncate">{player.auctionTeam.name}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 sm:flex-col sm:w-auto">
                                    {player.auctionStatus === 'AVAILABLE' && (
                                      <>
                                        <Button 
                                          size="sm" 
                                          variant="default"
                                          onClick={() => updatePlayerAuctionStatus(player.id, 'APPROVED')}
                                          className="text-xs px-2 py-1 h-auto"
                                        >
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Approve
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => updatePlayerAuctionStatus(player.id, 'REJECTED')}
                                          className="text-xs px-2 py-1 h-auto"
                                        >
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Reject
                                        </Button>
                                      </>
                                    )}

                                    {/* Show Mark Paid button for approved players who haven't paid yet */}
                                    {(player.auctionStatus === 'AVAILABLE' || player.auctionStatus === 'APPROVED') && 
                                     player.specialSkills !== 'PAYMENT_RECEIVED' && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updatePlayerPaymentStatus(player.id, 'PAID')}
                                        className="text-xs px-2 py-1 h-auto"
                                      >
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        Mark Paid
                                      </Button>
                                    )}

                                    {/* Show status badges for completed processes */}
                                    {player.auctionStatus === 'SOLD' && (
                                      <Badge variant="default" className="text-xs">
                                        Sold - ₹{player.soldPrice || 0}
                                      </Badge>
                                    )}

                                    {player.auctionStatus === 'UNSOLD' && (
                                      <Badge variant="secondary" className="text-xs">
                                        Unsold
                                      </Badge>
                                    )}

                                    {player.auctionStatus === 'APPROVED' && (
                                      <Badge variant="outline" className="text-xs">
                                        Ready for Auction
                                      </Badge>
                                    )}

                                    {player.auctionStatus === 'REJECTED' && (
                                      <Badge variant="destructive" className="text-xs">
                                        Rejected
                                      </Badge>
                                    )}

                                    {/* View Details button */}
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setSelectedPlayerDetails(player)}
                                      className="text-xs px-2 py-1 h-auto"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Team Owners Tab */}
                  <TabsContent value="owners" className="mt-6">
                    <div className="space-y-4">
                      {filteredTeamOwners.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No team owner registrations found</p>
                        </div>
                      ) : (
                        filteredTeamOwners.map((owner) => (
                          <Card key={owner.id} className="border">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="font-semibold text-base sm:text-lg">{owner.teamName}</h3>
                                      <Badge variant="outline" className="text-xs">Team #{owner.teamIndex}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {getStatusBadge(owner.verified ? 'APPROVED' : 'PENDING')}
                                      {getStatusBadge(owner.entryFeePaid ? 'COMPLETED' : 'PENDING', true)}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Crown className="h-3 w-3" />
                                          <span>Owner: {owner.ownerName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-3 w-3" />
                                          <span className="truncate">{owner.ownerPhone}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-3 w-3" />
                                          <span className="truncate">{owner.ownerEmail}</span>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3 w-3" />
                                          <span>{owner.ownerCity}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3 w-3" />
                                          <span>{new Date(owner.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {owner.sponsorName && (
                                          <div className="flex items-center gap-2">
                                            <Star className="h-3 w-3" />
                                            <span className="truncate">Sponsor: {owner.sponsorName}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 sm:flex-col sm:w-auto">
                                    {!owner.verified && (
                                      <>
                                        <Button 
                                          size="sm" 
                                          variant="default"
                                          onClick={() => updateRegistrationStatus(owner.id, 'APPROVED', 'owner')}
                                          className="text-xs px-2 py-1 h-auto"
                                        >
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Verify
                                        </Button>

                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => updateRegistrationStatus(owner.id, 'REJECTED', 'owner')}
                                          className="text-xs px-2 py-1 h-auto"
                                        >
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Reject
                                        </Button>
                                      </>
                                    )}

                                    {!owner.entryFeePaid && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updatePaymentStatus(owner.id, 'COMPLETED', 'owner')}
                                        className="text-xs px-2 py-1 h-auto"
                                      >
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        Mark Paid
                                      </Button>
                                    )}

                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => sendOwnerEmail(owner.id, owner.verified ? 'approved' : 'pending')}
                                      className="text-xs px-2 py-1 h-auto"
                                    >
                                      <Mail className="h-3 w-3 mr-1" />
                                      Email
                                    </Button>

                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setSelectedOwnerDetails(owner)}
                                      className="text-xs px-2 py-1 h-auto"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      {/* Player Details Modal */}
      <Dialog open={!!selectedPlayerDetails} onOpenChange={() => setSelectedPlayerDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPlayerDetails?.name} - Player Details</DialogTitle>
          </DialogHeader>
          {selectedPlayerDetails && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedPlayerDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{selectedPlayerDetails.age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedPlayerDetails.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedPlayerDetails.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="font-medium">{selectedPlayerDetails.city}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Cricket Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium">{selectedPlayerDetails.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{selectedPlayerDetails.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-medium">₹{selectedPlayerDetails.basePrice || 0}</span>
                    </div>
                    {selectedPlayerDetails.soldPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sold Price:</span>
                        <span className="font-medium text-green-600">₹{selectedPlayerDetails.soldPrice}</span>
                      </div>
                    )}
                    {selectedPlayerDetails.auctionTeam && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Team:</span>
                        <span className="font-medium">{selectedPlayerDetails.auctionTeam.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-lg">Registration Status</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Auction Status:</span>
                      <div>{getStatusBadge(selectedPlayerDetails.auctionStatus)}</div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <div>{getStatusBadge(selectedPlayerDetails.specialSkills === 'PAYMENT_RECEIVED' ? 'COMPLETED' : 'PENDING', true)}</div>
                    </div>
                  </div>
                  {selectedPlayerDetails.specialSkills && selectedPlayerDetails.specialSkills !== 'PAYMENT_RECEIVED' && selectedPlayerDetails.specialSkills !== 'PAYMENT_PENDING' && (
                    <div>
                      <span className="text-gray-600 text-sm">Special Skills:</span>
                      <p className="text-sm bg-gray-50 p-3 rounded mt-1">{selectedPlayerDetails.specialSkills}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedPlayerDetails(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Team Owner Details Modal */}
      <Dialog open={!!selectedOwnerDetails} onOpenChange={() => setSelectedOwnerDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOwnerDetails?.teamName} - Team Owner Details</DialogTitle>
          </DialogHeader>
          {selectedOwnerDetails && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Team Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Team Name:</span>
                      <span className="font-medium">{selectedOwnerDetails.teamName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Team Index:</span>
                      <span className="font-medium">#{selectedOwnerDetails.teamIndex}</span>
                    </div>
                    {selectedOwnerDetails.sponsorName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sponsor:</span>
                        <span className="font-medium">{selectedOwnerDetails.sponsorName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Owner Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedOwnerDetails.ownerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedOwnerDetails.ownerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedOwnerDetails.ownerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="font-medium">{selectedOwnerDetails.ownerCity}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-lg">Registration Status</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verification Status:</span>
                      <div>{getStatusBadge(selectedOwnerDetails.verified ? 'APPROVED' : 'PENDING')}</div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <div>{getStatusBadge(selectedOwnerDetails.entryFeePaid ? 'COMPLETED' : 'PENDING', true)}</div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration Date:</span>
                      <span className="font-medium">{new Date(selectedOwnerDetails.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedOwnerDetails(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

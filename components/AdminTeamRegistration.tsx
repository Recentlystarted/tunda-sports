'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Crown, 
  UserCheck, 
  UserX, 
  CreditCard, 
  Eye, 
  Mail, 
  Check, 
  X, 
  DollarSign,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface AuctionPlayer {
  id: string
  name: string
  age?: number
  phone?: string
  email?: string
  city?: string
  position?: string
  battingStyle?: string
  bowlingStyle?: string
  experience?: string
  basePrice?: number
  soldPrice?: number
  auctionStatus: string
  auctionTeamId?: string
  auctionTeam?: {
    name: string
    ownerName: string
  }
  tournament: {
    id: string
    name: string
    playerEntryFee?: number
  }
  createdAt: string
}

interface TeamOwner {
  id: string
  teamName: string
  teamIndex: number
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  ownerCity?: string
  sponsorName?: string
  sponsorContact?: string
  entryFeePaid: boolean
  verified: boolean
  paymentProof?: string
  tournament: {
    id: string
    name: string
    teamEntryFee?: number
  }
  createdAt: string
}

interface Tournament {
  id: string
  name: string
  format: string
  status: string
}

export default function AdminTeamRegistration() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>('')
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionPlayer[]>([])
  const [teamOwners, setTeamOwners] = useState<TeamOwner[]>([])
  const [loading, setLoading] = useState(false)
  const [playersFilter, setPlayersFilter] = useState('ALL')
  const [ownersFilter, setOwnersFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  // Load tournaments on component mount
  useEffect(() => {
    loadTournaments()
  }, [])

  // Load data when tournament is selected
  useEffect(() => {
    if (selectedTournament) {
      loadData()
    }
  }, [selectedTournament])

  const loadTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments')
      const data = await response.json()
      if (data.success) {
        setTournaments(data.tournaments)
      }
    } catch (error) {
      console.error('Error loading tournaments:', error)
      toast({
        title: "Error",
        description: "Failed to load tournaments",
        variant: "destructive"
      })
    }
  }

  const loadData = async () => {
    if (!selectedTournament) return
    
    setLoading(true)
    try {
      // Load auction players
      const playersResponse = await fetch(`/api/tournaments/${selectedTournament}/players`)
      if (playersResponse.ok) {
        const playersData = await playersResponse.json()
        setAuctionPlayers(playersData.players || [])
      }

      // Load team owners
      const ownersResponse = await fetch(`/api/tournaments/${selectedTournament}/team-owners`)
      if (ownersResponse.ok) {
        const ownersData = await ownersResponse.json()
        setTeamOwners(ownersData.owners || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load registration data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePlayerStatus = async (playerId: string, action: string, soldPrice?: number, teamId?: string) => {
    try {
      const body: any = { action }
      if (soldPrice) body.soldPrice = soldPrice
      if (teamId) body.auctionTeamId = teamId

      const response = await fetch(`/api/tournaments/${selectedTournament}/players/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Player ${action.toLowerCase()} successfully`
        })
        loadData() // Reload data
      } else {
        throw new Error('Failed to update player')
      }
    } catch (error) {
      console.error('Error updating player:', error)
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()} player`,
        variant: "destructive"
      })
    }
  }

  const updateOwnerStatus = async (ownerId: string, action: string) => {
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament}/team-owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Team owner ${action.toLowerCase()} successfully`
        })
        loadData() // Reload data
      } else {
        throw new Error('Failed to update owner')
      }
    } catch (error) {
      console.error('Error updating owner:', error)
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()} owner`,
        variant: "destructive"
      })
    }
  }

  const sendEmail = async (type: 'player' | 'owner', recipientId: string, emailType: string) => {
    try {
      const response = await fetch(`/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          recipientId,
          emailType,
          tournamentId: selectedTournament
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Email sent successfully"
        })
      } else {
        throw new Error('Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      })
    }
  }

  const filteredPlayers = auctionPlayers.filter(player => {
    const matchesFilter = playersFilter === 'ALL' || player.auctionStatus === playersFilter
    const matchesSearch = searchTerm === '' || 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.phone?.includes(searchTerm)
    return matchesFilter && matchesSearch
  })

  const filteredOwners = teamOwners.filter(owner => {
    let matchesFilter = false
    if (ownersFilter === 'ALL') matchesFilter = true
    else if (ownersFilter === 'VERIFIED') matchesFilter = owner.verified
    else if (ownersFilter === 'UNVERIFIED') matchesFilter = !owner.verified
    else if (ownersFilter === 'PAID') matchesFilter = owner.entryFeePaid
    else if (ownersFilter === 'UNPAID') matchesFilter = !owner.entryFeePaid

    const matchesSearch = searchTerm === '' || 
      owner.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.ownerPhone?.includes(searchTerm)
    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status: string, isPaid?: boolean, isVerified?: boolean) => {
    if (status === 'SOLD') return <Badge className="bg-green-500">Sold</Badge>
    if (status === 'UNSOLD') return <Badge variant="destructive">Unsold</Badge>
    if (status === 'AVAILABLE') return <Badge variant="secondary">Available</Badge>
    if (isPaid !== undefined && isVerified !== undefined) {
      if (isVerified && isPaid) return <Badge className="bg-green-500">Verified & Paid</Badge>
      if (isVerified) return <Badge className="bg-blue-500">Verified</Badge>
      if (isPaid) return <Badge className="bg-yellow-500">Paid</Badge>
      return <Badge variant="outline">Pending</Badge>
    }
    return <Badge variant="outline">{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Registration Management</h2>
          <p className="text-gray-600">Manage player and team owner registrations for auction tournaments</p>
        </div>
        <Button onClick={loadData} disabled={!selectedTournament || loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a tournament to manage" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map(tournament => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name} ({tournament.format})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTournament && (
        <>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="players" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Auction Players ({filteredPlayers.length})
              </TabsTrigger>
              <TabsTrigger value="owners" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Team Owners ({filteredOwners.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>Filter:</Label>
                <Select value={playersFilter} onValueChange={setPlayersFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Players</SelectItem>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="SOLD">Sold</SelectItem>
                    <SelectItem value="UNSOLD">Unsold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4">
                {loading ? (
                  <div className="text-center py-8">Loading players...</div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No players found</div>
                ) : (
                  filteredPlayers.map(player => (
                    <Card key={player.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{player.name}</h3>
                              {getStatusBadge(player.auctionStatus)}
                              {player.soldPrice && (
                                <Badge variant="outline">₹{player.soldPrice}</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                              <div>Age: {player.age || 'N/A'}</div>
                              <div>Position: {player.position || 'N/A'}</div>
                              <div>Experience: {player.experience || 'N/A'}</div>
                              <div>Base Price: ₹{player.basePrice || 0}</div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              <div>📧 {player.email}</div>
                              <div>📞 {player.phone}</div>
                            </div>
                            {player.auctionTeam && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Team: </span>
                                {player.auctionTeam.name} (Owner: {player.auctionTeam.ownerName})
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {player.auctionStatus === 'AVAILABLE' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => updatePlayerStatus(player.id, 'MARK_SOLD')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark Sold
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => updatePlayerStatus(player.id, 'MARK_UNSOLD')}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Mark Unsold
                                </Button>
                              </>
                            )}
                            {player.auctionStatus === 'SOLD' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updatePlayerStatus(player.id, 'MARK_AVAILABLE')}
                              >
                                Reset to Available
                              </Button>
                            )}
                            {player.auctionStatus === 'UNSOLD' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => updatePlayerStatus(player.id, 'MARK_SOLD')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark Sold
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updatePlayerStatus(player.id, 'MARK_AVAILABLE')}
                                >
                                  Reset to Available
                                </Button>
                              </>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => sendEmail('player', player.id, 'status_update')}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Email
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Player Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Name</Label>
                                      <div className="font-medium">{player.name}</div>
                                    </div>
                                    <div>
                                      <Label>Age</Label>
                                      <div>{player.age || 'N/A'}</div>
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <div>{player.email}</div>
                                    </div>
                                    <div>
                                      <Label>Phone</Label>
                                      <div>{player.phone}</div>
                                    </div>
                                    <div>
                                      <Label>City</Label>
                                      <div>{player.city || 'N/A'}</div>
                                    </div>
                                    <div>
                                      <Label>Position</Label>
                                      <div>{player.position || 'N/A'}</div>
                                    </div>
                                    <div>
                                      <Label>Batting Style</Label>
                                      <div>{player.battingStyle || 'N/A'}</div>
                                    </div>
                                    <div>
                                      <Label>Bowling Style</Label>
                                      <div>{player.bowlingStyle || 'N/A'}</div>
                                    </div>
                                    <div>
                                      <Label>Experience</Label>
                                      <div>{player.experience || 'N/A'}</div>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div>{getStatusBadge(player.auctionStatus)}</div>
                                    </div>
                                  </div>
                                  {player.auctionTeam && (
                                    <div>
                                      <Label>Current Team</Label>
                                      <div className="font-medium">
                                        {player.auctionTeam.name} (Owner: {player.auctionTeam.ownerName})
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Registration Date</Label>
                                    <div>{new Date(player.createdAt).toLocaleString()}</div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="owners" className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>Filter:</Label>
                <Select value={ownersFilter} onValueChange={setOwnersFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Owners</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4">
                {loading ? (
                  <div className="text-center py-8">Loading team owners...</div>
                ) : filteredOwners.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No team owners found</div>
                ) : (
                  filteredOwners.map(owner => (
                    <Card key={owner.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{owner.ownerName}</h3>
                              {getStatusBadge('', owner.entryFeePaid, owner.verified)}
                              <Badge variant="outline">Team #{owner.teamIndex}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                              <div><strong>Team:</strong> {owner.teamName}</div>
                              <div><strong>City:</strong> {owner.ownerCity || 'N/A'}</div>
                              <div><strong>Entry Fee:</strong> ₹{owner.tournament.teamEntryFee || 0}</div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              <div>📧 {owner.ownerEmail}</div>
                              <div>📞 {owner.ownerPhone}</div>
                            </div>
                            {owner.sponsorName && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Sponsor: </span>
                                {owner.sponsorName}
                                {owner.sponsorContact && ` (${owner.sponsorContact})`}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {!owner.verified && (
                              <Button 
                                size="sm" 
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => updateOwnerStatus(owner.id, 'VERIFY')}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                            )}
                            {!owner.entryFeePaid && (
                              <Button 
                                size="sm" 
                                className="bg-blue-500 hover:bg-blue-600"
                                onClick={() => updateOwnerStatus(owner.id, 'MARK_PAID')}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Mark Paid
                              </Button>
                            )}
                            {owner.verified && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateOwnerStatus(owner.id, 'REJECT')}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => sendEmail('owner', owner.id, 'status_update')}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Email
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Team Owner Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Owner Name</Label>
                                      <div className="font-medium">{owner.ownerName}</div>
                                    </div>
                                    <div>
                                      <Label>Team Name</Label>
                                      <div className="font-medium">{owner.teamName}</div>
                                    </div>
                                    <div>
                                      <Label>Team Index</Label>
                                      <div>#{owner.teamIndex}</div>
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <div>{owner.ownerEmail}</div>
                                    </div>
                                    <div>
                                      <Label>Phone</Label>
                                      <div>{owner.ownerPhone}</div>
                                    </div>
                                    <div>
                                      <Label>City</Label>
                                      <div>{owner.ownerCity || 'N/A'}</div>
                                    </div>
                                    <div>
                                      <Label>Verified</Label>
                                      <div>{owner.verified ? '✅ Yes' : '❌ No'}</div>
                                    </div>
                                    <div>
                                      <Label>Entry Fee Paid</Label>
                                      <div>{owner.entryFeePaid ? '✅ Yes' : '❌ No'}</div>
                                    </div>
                                  </div>
                                  {owner.sponsorName && (
                                    <div>
                                      <Label>Sponsor Details</Label>
                                      <div className="space-y-1">
                                        <div><strong>Name:</strong> {owner.sponsorName}</div>
                                        {owner.sponsorContact && (
                                          <div><strong>Contact:</strong> {owner.sponsorContact}</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Registration Date</Label>
                                    <div>{new Date(owner.createdAt).toLocaleString()}</div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

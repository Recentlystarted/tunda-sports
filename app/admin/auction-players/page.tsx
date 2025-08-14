'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  UserPlus,
  Trophy,
  Target,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AuctionPlayer {
  id: string
  name: string
  age: number | null
  phone: string
  email: string
  city: string | null
  position: string
  battingStyle: string | null
  bowlingStyle: string | null
  experience: string
  basePrice: number
  auctionStatus: 'AVAILABLE' | 'SOLD' | 'UNSOLD'
  auctionTeamId: string | null
  createdAt: string
}

interface Tournament {
  id: string
  name: string
  auctionDate: string | null
  totalGroups: number | null
  teamsPerGroup: number | null
  isAuctionBased: boolean
}

export default function AuctionPlayersManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>('')
  const [players, setPlayers] = useState<AuctionPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPlayer, setSelectedPlayer] = useState<AuctionPlayer | null>(null)

  useEffect(() => {
    fetchAuctionTournaments()
  }, [])

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentPlayers(selectedTournament)
    } else {
      setPlayers([])
    }
  }, [selectedTournament])

  const fetchAuctionTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments?status=all')
      if (response.ok) {
        const data = await response.json()
        const auctionTournaments = (data.tournaments || []).filter((t: any) => t.isAuctionBased)
        setTournaments(auctionTournaments)
        
        // Auto-select first tournament if available
        if (auctionTournaments.length > 0 && !selectedTournament) {
          setSelectedTournament(auctionTournaments[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive"
      })
    }
  }

  const fetchTournamentPlayers = async (tournamentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/auction-players`)
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch players",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching players:', error)
      toast({
        title: "Error",
        description: "Failed to fetch players",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePlayerStatus = async (playerId: string, status: string) => {
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament}/auction-players`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, auctionStatus: status })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Player status updated successfully"
        })
        fetchTournamentPlayers(selectedTournament)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update player status",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update player status",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      AVAILABLE: { variant: "default" as const, label: "Available", color: "bg-green-100 text-green-800" },
      SOLD: { variant: "secondary" as const, label: "Sold", color: "bg-blue-100 text-blue-800" },
      UNSOLD: { variant: "outline" as const, label: "Unsold", color: "bg-gray-100 text-gray-800" }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.AVAILABLE
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    )
  }

  const getPositionIcon = (position: string) => {
    const icons = {
      BATSMAN: '🏏',
      BOWLER: '⚡',
      ALL_ROUNDER: '🌟',
      WICKET_KEEPER: '🥅'
    }
    return icons[position as keyof typeof icons] || '🏏'
  }

  const filteredPlayers = players.filter(player => {
    const matchesSearch = 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.phone.includes(searchTerm) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.city && player.city.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || player.auctionStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.PNG" 
            alt="Tunda Sports Club" 
            className="h-8 w-auto"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Auction Players</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage individual player registrations for auction tournaments
            </p>
          </div>
        </div>
        <Button 
          onClick={() => window.open('/auction-registration', '_blank')} 
          className="w-full sm:w-auto"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Registration Link
        </Button>
      </div>

      {/* Tournament Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Select Tournament
          </CardTitle>
          <CardDescription>
            Choose an auction tournament to view registered players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an auction tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {tournament.name}
                        {tournament.auctionDate && (
                          <span className="text-xs text-muted-foreground">
                            (Auction: {new Date(tournament.auctionDate).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTournamentData && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {selectedTournamentData.totalGroups} Groups
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  {selectedTournamentData.teamsPerGroup} Teams/Group
                </span>
                {selectedTournamentData.auctionDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedTournamentData.auctionDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      {selectedTournament && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players by name, phone, email, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="UNSOLD">Unsold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statistics */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {players.filter(p => p.auctionStatus === 'AVAILABLE').length}
                </div>
                <div className="text-sm text-green-600">Available</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {players.filter(p => p.auctionStatus === 'SOLD').length}
                </div>
                <div className="text-sm text-blue-600">Sold</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {players.filter(p => p.auctionStatus === 'UNSOLD').length}
                </div>
                <div className="text-sm text-gray-600">Unsold</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{players.length}</div>
                <div className="text-sm text-purple-600">Total Players</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Players Table */}
      {selectedTournament && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registered Players ({filteredPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading players...</p>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Players Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? "No players match your search criteria" 
                    : "No players have registered for this tournament yet"
                  }
                </p>
                <Button 
                  onClick={() => window.open('/auction-registration', '_blank')} 
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Share Registration Link
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            {player.age && (
                              <div className="text-sm text-muted-foreground">
                                Age: {player.age}
                              </div>
                            )}
                            {player.city && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {player.city}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{getPositionIcon(player.position)}</span>
                            <span className="text-sm">{player.position.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {player.phone}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {player.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {player.experience.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">₹{player.basePrice.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(player.auctionStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedPlayer(player)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Player Details</DialogTitle>
                                  <DialogDescription>
                                    Complete information for {player.name}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedPlayer && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Name</Label>
                                        <p>{selectedPlayer.name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Age</Label>
                                        <p>{selectedPlayer.age || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Phone</Label>
                                        <p>{selectedPlayer.phone}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Email</Label>
                                        <p>{selectedPlayer.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">City</Label>
                                        <p>{selectedPlayer.city || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Position</Label>
                                        <p>{selectedPlayer.position.replace('_', ' ')}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Batting Style</Label>
                                        <p>{selectedPlayer.battingStyle?.replace('_', ' ') || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Bowling Style</Label>
                                        <p>{selectedPlayer.bowlingStyle?.replace('_', ' ') || 'Not specified'}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Registered</Label>
                                      <p>{new Date(selectedPlayer.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {player.auctionStatus === 'AVAILABLE' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updatePlayerStatus(player.id, 'SOLD')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updatePlayerStatus(player.id, 'UNSOLD')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

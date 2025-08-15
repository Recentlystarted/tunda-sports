'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { Plus, Trash2, Users, Phone, Mail, Calendar, MapPin, Trophy, DollarSign, AlertCircle, Search, Crown, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePicker } from '@/components/ui/date-picker'
import { PaymentMethodSelector } from '@/components/ui/payment-method-selector'
import { PhoneInput } from '@/components/ui/phone-input'
import { toast } from '@/hooks/use-toast'

// Types
interface Tournament {
  id: string
  name: string
  format: string
  competitionType?: string
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

interface PlayerRegistrationData {
  name: string
  age: number
  phone: string
  email: string
  city: string
  address: string
  dateOfBirth: string
  fatherName: string
  position: string
  battingStyle: string
  bowlingStyle: string
  experience: string
  paymentMethod: string
  paymentAmount: number
  emergencyContact: string
  emergencyPhone: string
  emergencyRelation: string
  profileImageUrl: string
}

interface TeamRegistrationData {
  teamName: string
  captainName: string
  captainPhone: string
  captainEmail: string
  captainAge: number
  captainDateOfBirth: string
  teamCity: string
  players: PlayerRegistrationData[]
  emergencyContact: {
    name: string
    phone: string
    relation: string
  }
  paymentMethod: string
  paymentAmount: number
  specialRequests?: string
}

interface TeamOwnerRegistrationData {
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  ownerCity: string
  ownerAge: number
  ownerDateOfBirth: string
  teamName: string
  sponsorName?: string
  sponsorContact?: string
  businessName?: string
  businessType?: string
  experience?: string
  paymentMethod: string
  paymentAmount: number
  specialRequests?: string
  emergencyContact: string
  emergencyPhone: string
}

interface PaymentSettings {
  id?: string;
  methodName?: string;
  methodType?: string;
  upiId: string;
  upiMobile: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  qrCodeUrl: string | null;
  amount?: number;
  isActive?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  age: number;
  position: string;
  experience: string;
}

export default function UniversalRegistrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const preSelectedTournamentId = searchParams.get('tournament') || (params.id as string)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [registrationType, setRegistrationType] = useState<'player' | 'team' | 'owner'>('team')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [duplicateCheck, setDuplicateCheck] = useState<boolean>(false)
  const [duplicatePlayer, setDuplicatePlayer] = useState<any>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")

  // Helper function to create empty player data
  const createEmptyPlayerData = (paymentAmount = 0): PlayerRegistrationData => ({
    name: '',
    age: 18,
    phone: '',
    email: '',
    city: '',
    address: '',
    dateOfBirth: '',
    fatherName: '',
    position: 'BATSMAN',
    battingStyle: 'RIGHT_HANDED',
    bowlingStyle: 'RIGHT_ARM_MEDIUM',
    experience: 'INTERMEDIATE',
    paymentMethod: 'UPI',
    paymentAmount,
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelation: '',
    profileImageUrl: ''
  })

  // Registration data states
  const [playerData, setPlayerData] = useState<PlayerRegistrationData>(createEmptyPlayerData())

  const [teamData, setTeamData] = useState<TeamRegistrationData>({
    teamName: '',
    captainName: '',
    captainPhone: '',
    captainEmail: '',
    captainAge: 18,
    captainDateOfBirth: '',
    teamCity: '',
    players: [],
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    },
    paymentMethod: 'UPI',
    paymentAmount: 0
  })

  const [ownerData, setOwnerData] = useState<TeamOwnerRegistrationData>({
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerCity: '',
    ownerAge: 18,
    ownerDateOfBirth: '',
    teamName: '',
    sponsorName: '',
    sponsorContact: '',
    businessName: '',
    businessType: '',
    experience: 'INTERMEDIATE',
    paymentMethod: 'UPI',
    paymentAmount: 0,
    specialRequests: '',
    emergencyContact: '',
    emergencyPhone: ''
  })

  // Enhanced states for payment and search
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showNoResults, setShowNoResults] = useState(false)

  useEffect(() => {
    if (preSelectedTournamentId && tournaments.length > 0) {
      const tournament = tournaments.find(t => t.id === preSelectedTournamentId)
      if (tournament) {
        console.log('🎯 Auto-selecting tournament from URL:', tournament.name)
        handleTournamentSelect(tournament)
        
        // IMMEDIATE auto-generation check - no timeout needed
        if (!isAuctionTournament(tournament) && teamData.players.length === 0) {
          console.log('🚀 Immediate auto-generation triggered...')
          const playersArray = Array.from({ length: tournament.teamSize }, (_, index) => 
            createEmptyPlayerData(tournament.entryFee || 0)
          )
          
          setTeamData(prev => ({
            ...prev,
            players: playersArray,
            paymentAmount: tournament.entryFee || 0
          }))
          
          console.log(`✅ Immediately generated ${playersArray.length} players`)
        }
      }
    }
  }, [preSelectedTournamentId, tournaments])

  useEffect(() => {
    fetchTournaments()
    fetchPaymentSettings()
  }, [])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tournaments?status=open')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      console.log('API Response text:', text)
      
      if (!text) {
        throw new Error('Empty response from server')
      }
      
      const data = JSON.parse(text)
      
      if (data.success) {
        const availableTournaments = data.tournaments.filter((tournament: Tournament) => 
          !isRegistrationClosed(tournament)
        )
        setTournaments(availableTournaments)
        
        // If we have a pre-selected tournament and it's in the list, select it
        if (preSelectedTournamentId) {
          const tournament = availableTournaments.find((t: Tournament) => t.id === preSelectedTournamentId)
          if (tournament) {
            handleTournamentSelect(tournament)
          }
        }
      } else {
        console.error('Failed to fetch tournaments:', data.error)
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
      // Try to fetch the specific tournament if we have an ID
      if (preSelectedTournamentId) {
        try {
          const response = await fetch(`/api/tournaments/${preSelectedTournamentId}`)
          if (response.ok) {
            const data = await response.json()
            const tournament = data.tournament || data
            setTournaments([tournament])
            handleTournamentSelect(tournament)
          }
        } catch (fallbackError) {
          console.error('Fallback fetch failed:', fallbackError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentSettings = async (tournamentId?: string) => {
    try {
      let response;
      
      // Use provided tournamentId or fall back to selectedTournament
      const targetTournamentId = tournamentId || selectedTournament?.id
      
      // If we have a tournament ID, try to fetch tournament-specific payment methods first
      if (targetTournamentId) {
        console.log('🔍 Fetching tournament payment methods for ID:', targetTournamentId)
        response = await fetch(`/api/tournaments/${targetTournamentId}/payment-methods`)
        if (response.ok) {
          const methods = await response.json()
          console.log('🔥 Fetched tournament payment methods:', methods)
          
          // If we have tournament-specific methods, use the first active one
          const activeMethod = methods.find((m: any) => m.isActive)
          if (activeMethod) {
            console.log('✅ Using tournament-specific payment method:', {
              name: activeMethod.methodName,
              amount: activeMethod.amount,
              upiId: activeMethod.upiId,
              hasQR: !!activeMethod.qrCodeUrl
            })
            setPaymentSettings(activeMethod)
            return
          }
        } else {
          console.warn('❌ Failed to fetch tournament payment methods:', response.status)
        }
      } else {
        console.log('⚠️ No tournament ID provided, using global settings')
      }
      
      // Fallback to global payment settings
      console.log('⚙️ Fetching global payment settings as fallback')
      response = await fetch('/api/settings/payment')
      if (response.ok) {
        const data = await response.json()
        console.log('⚙️ Using global payment settings:', data)
        setPaymentSettings(data)
      } else {
        console.warn('❌ Failed to fetch global payment settings:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching payment settings:', error)
    }
  }

  const isAuctionTournament = (tournament: Tournament): boolean => {
    // EXTREMELY RESTRICTIVE: Only tournaments with AUCTION in competitionType should be auction
    // EXPLICIT CHECK: ONE_DAY_KNOCKOUT should NEVER be auction
    const competitionType = tournament.competitionType || '';
    
    // If we're on a tournament-specific registration page, check the URL path
    const currentPath = window.location.pathname;
    if (currentPath.includes('/tournament/') && currentPath.includes('/register')) {
      // For tournament-specific pages, be extra strict about auction detection
      if (competitionType === 'ONE_DAY_KNOCKOUT') {
        return false;
      }
      
      // Only explicit auction competition types should be treated as auction
      const explicitAuctionTypes = ['AUCTION_BASED_FIXED_TEAMS', 'AUCTION_BASED_GROUPS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'];
      return explicitAuctionTypes.includes(competitionType);
    }
    
    // Fallback for general cases
    if (competitionType === 'ONE_DAY_KNOCKOUT') {
      return false;
    }
    
    const isAuction = ['AUCTION_BASED_FIXED_TEAMS', 'AUCTION_BASED_GROUPS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(competitionType);
    
    return isAuction;
  }

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setErrors([])
    
    const isAuction = isAuctionTournament(tournament);
    
    // Set appropriate registration type based on tournament
    if (isAuction) {
      // For auction tournaments, default to player registration
      setRegistrationType('player')
    } else {
      // For regular tournaments, show team registration
      setRegistrationType('team')
      
      // IMMEDIATE AUTO-GENERATION PLAYER FORMS based on teamSize 
      console.log('🔄 Auto-generating player forms for tournament:', tournament.name)
      console.log(`   Team Size: ${tournament.teamSize}`)
      console.log(`   Entry Fee: ${tournament.entryFee}`)
      
      // Main team players (required) - Generate immediately
      const mainTeamPlayers = Array.from({ length: tournament.teamSize }, (_, index) => {
        const playerData = createEmptyPlayerData(tournament.entryFee || 0)
        console.log(`   Generated player ${index + 1}:`, playerData.name || '(empty)')
        return playerData
      });
      
      console.log(`✅ Generated ${mainTeamPlayers.length} player forms`)
      
      // Update team data immediately
      setTeamData(prev => ({ 
        ...prev, 
        players: mainTeamPlayers,
        paymentAmount: tournament.entryFee || 0 
      }))
    }
    
    // Set payment amounts
    if (isAuction) {
      setPlayerData(prev => ({ ...prev, paymentAmount: tournament.playerEntryFee || 0 }))
      setOwnerData(prev => ({ ...prev, paymentAmount: tournament.teamEntryFee || 0 }))
    } else {
      setTeamData(prev => ({ ...prev, paymentAmount: tournament.entryFee || 0 }))
    }
    
    // Fetch tournament-specific payment settings
    console.log('🔄 Fetching payment settings for tournament:', tournament.name)
    fetchPaymentSettings(tournament.id)
  }

  const isRegistrationClosed = (tournament: Tournament): boolean => {
    // Check if registration deadline has passed
    const now = new Date()
    const deadline = new Date(tournament.registrationDeadline)
    
    if (now > deadline) {
      return true
    }
    
    // Check if tournament is not in registration open status (allow UPCOMING and REGISTRATION_OPEN)
    if (tournament.status !== 'REGISTRATION_OPEN' && tournament.status !== 'UPCOMING') {
      return true
    }
    
    // Check capacity
    if (isAuctionTournament(tournament)) {
      return tournament._count.auctionPlayers >= (tournament.playerPoolSize || 100)
    } else {
      return tournament._count.registrations >= tournament.maxTeams
    }
  }

  // Duplicate checking function
  const checkForDuplicatePlayer = async (name: string, phone: string, email: string) => {
    if (!selectedTournament || !name.trim() || !phone.trim()) return false
    
    setDuplicateCheck(true)
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament.id}/auction-players/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim() })
      })
      
      const result = await response.json()
      
      if (result.exists) {
        setDuplicatePlayer(result.player)
        return true
      }
      
      setDuplicatePlayer(null)
      return false
    } catch (error) {
      console.error('Error checking duplicate:', error)
      return false
    } finally {
      setDuplicateCheck(false)
    }
  }

  // Photo upload functions
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Photo size must be less than 5MB",
          variant: "destructive",
        })
        return
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please select a valid image file (JPG, PNG, or WebP)",
          variant: "destructive",
        })
        return
      }

      setSelectedPhoto(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return null
    
    setUploadingPhoto(true)
    try {
      const photoFormData = new FormData()
      photoFormData.append('file', selectedPhoto)
      photoFormData.append('category', 'PLAYERS')
      photoFormData.append('title', `Player Photo - ${playerData.name || 'Auction Player'}`)
      photoFormData.append('description', `Profile photo for ${playerData.name || 'player'}`)
      
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: photoFormData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload photo')
      }
      
      const result = await response.json()
      return result.publicUrl || result.url
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      })
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const clearPhoto = () => {
    setSelectedPhoto(null)
    setPhotoPreview("")
    setPlayerData(prev => ({ ...prev, profileImageUrl: "" }))
  }

  const validatePlayerRegistration = (): boolean => {
    const newErrors: string[] = []
    
    if (!playerData.name.trim()) newErrors.push('Player name is required')
    if (!playerData.phone.trim()) newErrors.push('Phone number is required')
    if (!playerData.email.trim()) newErrors.push('Email is required')
    if (!playerData.city.trim()) newErrors.push('City is required')
    if (playerData.age < 16) newErrors.push('Player must be at least 16 years old')
    if (!playerData.position) newErrors.push('Playing position is required')
    if (!playerData.emergencyContact.trim()) newErrors.push('Emergency contact is required')
    if (!playerData.emergencyPhone.trim()) newErrors.push('Emergency phone is required')
    
    // Email validation
    if (playerData.email && !/\S+@\S+\.\S+/.test(playerData.email)) {
      newErrors.push('Please enter a valid email address')
    }
    
    // Phone validation
    if (playerData.phone && !/^\d{10}$/.test(playerData.phone.replace(/\D/g, ''))) {
      newErrors.push('Please enter a valid 10-digit phone number')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const validateOwnerRegistration = (): boolean => {
    const newErrors: string[] = []
    
    if (!ownerData.ownerName.trim()) newErrors.push('Owner name is required')
    if (!ownerData.ownerPhone.trim()) newErrors.push('Owner phone is required')
    if (!ownerData.ownerEmail.trim()) newErrors.push('Owner email is required')
    if (!ownerData.ownerCity.trim()) newErrors.push('Owner city is required')
    if (ownerData.ownerAge < 18) newErrors.push('Owner must be at least 18 years old')
    if (!ownerData.teamName.trim()) newErrors.push('Team name is required')
    if (!ownerData.emergencyContact.trim()) newErrors.push('Emergency contact is required')
    if (!ownerData.emergencyPhone.trim()) newErrors.push('Emergency phone is required')
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const submitPlayerRegistration = async () => {
    if (!selectedTournament || !validatePlayerRegistration()) return

    // Check for duplicates first
    const isDuplicate = await checkForDuplicatePlayer(playerData.name, playerData.phone, playerData.email)
    if (isDuplicate) {
      toast({
        title: "Player Already Registered",
        description: `${playerData.name} is already registered for this tournament.`,
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      // Upload photo first if selected
      let profileImageUrl = playerData.profileImageUrl
      if (selectedPhoto) {
        const uploadedPhotoUrl = await handlePhotoUpload()
        if (uploadedPhotoUrl) {
          profileImageUrl = uploadedPhotoUrl
        }
      }
      
      const response = await fetch(`/api/tournaments/${selectedTournament.id}/auction-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...playerData,
          profileImageUrl,
          registrationType: 'PUBLIC'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Redirect to tournament registration success page with player details
        const params = new URLSearchParams({
          type: 'player',
          tournament: selectedTournament.name,
          name: playerData.name,
          id: result.id
        })
        router.push(`/tournament-registration-success?${params.toString()}`)
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to submit registration",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Error",
        description: "Failed to submit registration",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const submitOwnerRegistration = async () => {
    if (!selectedTournament || !validateOwnerRegistration()) return

    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/tournaments/${selectedTournament.id}/team-owners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerData)
      })

      const result = await response.json()
      
      if (result.success) {
        // Redirect to tournament registration success page with owner details
        const params = new URLSearchParams({
          type: 'owner',
          tournament: selectedTournament.name,
          name: ownerData.ownerName,
          team: ownerData.teamName,
          id: result.id
        })
        router.push(`/tournament-registration-success?${params.toString()}`)
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to submit registration",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Error",
        description: "Failed to submit registration",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const searchPlayers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      setShowNoResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/players?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        const players = data.players || data
        setSearchResults(Array.isArray(players) ? players : [])
        
        if (Array.isArray(players) && players.length > 0) {
          setShowResults(true)
          setShowNoResults(false)
        } else {
          setShowResults(false)
          setShowNoResults(true)
          setTimeout(() => {
            setShowNoResults(false)
          }, 1000)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      setShowResults(false)
      setShowNoResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  // Team registration functions
  const updateCaptainAndFirstPlayer = (field: string, value: any) => {
    setTeamData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Sync captain details to Player 1 if players exist
      if (prev.players.length > 0) {
        const updatedPlayers = [...prev.players]
        if (field === 'captainName') {
          updatedPlayers[0] = { ...updatedPlayers[0], name: value }
        } else if (field === 'captainAge') {
          updatedPlayers[0] = { ...updatedPlayers[0], age: value }
        } else if (field === 'captainPhone') {
          updatedPlayers[0] = { ...updatedPlayers[0], phone: value }
        } else if (field === 'captainEmail') {
          updatedPlayers[0] = { ...updatedPlayers[0], email: value }
        }
        updated.players = updatedPlayers
      }
      
      return updated
    })
  }

  const updatePlayer = (index: number, field: string, value: any) => {
    setTeamData(prev => {
      const updatedPlayers = [...prev.players]
      updatedPlayers[index] = { ...updatedPlayers[index], [field]: value }
      
      // If Player 1 is updated, sync with captain
      if (index === 0) {
        const updated = { ...prev, players: updatedPlayers }
        if (field === 'name') updated.captainName = value
        else if (field === 'age') updated.captainAge = value
        else if (field === 'phone') updated.captainPhone = value
        else if (field === 'email') updated.captainEmail = value
        return updated
      }
      
      return { ...prev, players: updatedPlayers }
    })
  }

  const addPlayer = () => {
    if (!selectedTournament) return
    const maxPlayers = selectedTournament.teamSize + selectedTournament.substitutes
    
    if (teamData.players.length < maxPlayers) {
      setTeamData(prev => ({
        ...prev,
        players: [
          ...prev.players,
          createEmptyPlayerData(0)
        ]
      }))
    }
  }

  const removePlayer = (index: number) => {
    if (index === 0) return // Cannot remove captain
    
    setTeamData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }))
  }

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTournament) return

    setSubmitting(true)
    setErrors([])

    try {
      // Validation
      const newErrors: string[] = []
      
      if (!teamData.teamName.trim()) newErrors.push('Team name is required')
      if (!teamData.captainName.trim()) newErrors.push('Captain name is required')
      if (!teamData.captainPhone.trim()) newErrors.push('Captain phone is required')
      if (!teamData.captainEmail.trim()) newErrors.push('Captain email is required')
      if (!teamData.emergencyContact.name.trim()) newErrors.push('Emergency contact name is required')
      if (!teamData.emergencyContact.phone.trim()) newErrors.push('Emergency contact phone is required')
      
      // Validate all players
      for (let i = 0; i < teamData.players.length; i++) {
        const player = teamData.players[i]
        if (!player.name.trim()) newErrors.push(`Player ${i + 1} name is required`)
        if (!player.phone.trim()) newErrors.push(`Player ${i + 1} phone is required`)
        // Only captain (player 1) email is required, others are optional
        if (i === 0 && !player.email.trim()) newErrors.push(`Captain email is required`)
        if (!player.position) newErrors.push(`Player ${i + 1} position is required`)
        // Validate email format if provided
        if (player.email && !/\S+@\S+\.\S+/.test(player.email)) {
          newErrors.push(`${i === 0 ? 'Captain' : `Player ${i + 1}`} email format is invalid`)
        }
      }

      // Check minimum team size
      if (teamData.players.length < selectedTournament.teamSize) {
        newErrors.push(`Minimum ${selectedTournament.teamSize} players required`)
      }

      if (newErrors.length > 0) {
        setErrors(newErrors)
        toast({
          title: "Registration Error",
          description: `Please fix the following errors: ${newErrors.join(', ')}`,
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      // Submit team registration
      const registrationData = {
        tournamentId: selectedTournament.id,
        type: 'TEAM',
        teamName: teamData.teamName,
        captainName: teamData.captainName,
        captainPhone: teamData.captainPhone,
        captainEmail: teamData.captainEmail,
        captainAge: teamData.captainAge,
        teamCity: teamData.teamCity,
        players: teamData.players,
        emergencyContact: teamData.emergencyContact,
        paymentMethod: teamData.paymentMethod,
        paymentAmount: teamData.paymentAmount,
        specialRequests: teamData.specialRequests,
        status: 'PENDING'
      }

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Registration Successful! 🎉",
          description: `Team "${teamData.teamName}" has been registered for ${selectedTournament.name}. Check your email for confirmation.`,
        })
        
        // Reset form
        setTeamData({
          teamName: '',
          captainName: '',
          captainPhone: '',
          captainEmail: '',
          captainAge: 18,
          captainDateOfBirth: '',
          teamCity: '',
          players: [
            createEmptyPlayerData(0)
          ],
          emergencyContact: {
            name: '',
            phone: '',
            relation: ''
          },
          paymentMethod: 'UPI',
          paymentAmount: selectedTournament.entryFee || 0,
          specialRequests: ''
        })
        
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setErrors([errorMessage])
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Separate effect to sync captain data to first player when captain fields change
  useEffect(() => {
    if (selectedTournament && !isAuctionTournament(selectedTournament) && teamData.players.length > 0) {
      setTeamData(prev => {
        const updatedPlayers = [...prev.players]
        if (updatedPlayers[0]) {
          updatedPlayers[0] = {
            ...updatedPlayers[0],
            name: teamData.captainName || updatedPlayers[0].name,
            age: teamData.captainAge || updatedPlayers[0].age,
            phone: teamData.captainPhone || updatedPlayers[0].phone,
            email: teamData.captainEmail || updatedPlayers[0].email,
          }
        }
        return { ...prev, players: updatedPlayers }
      })
    }
  }, [teamData.captainName, teamData.captainAge, teamData.captainPhone, teamData.captainEmail])

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 18
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tournaments...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4">
            <img 
              src="/logo.PNG" 
              alt="Tunda Sports Club" 
              className="h-10 w-10 sm:h-16 sm:w-16 object-contain"
            />
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Tournament Registration</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Register for upcoming tournaments</p>
            </div>
          </div>
        </div>

        {!selectedTournament ? (
          // Tournament Selection
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Available Tournaments
                </CardTitle>
                <CardDescription>
                  Select a tournament to register for
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tournaments.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tournaments open for registration</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {tournaments.map((tournament) => (
                      <Card 
                        key={tournament.id} 
                        className="border-2 transition-colors cursor-pointer hover:border-primary/50"
                        onClick={() => handleTournamentSelect(tournament)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{tournament.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{tournament.format}</Badge>
                                {isAuctionTournament(tournament) && (
                                  <Badge variant="secondary">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Auction
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge 
                              variant="default"
                            >
                              Open
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{tournament.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {isAuctionTournament(tournament)
                                  ? `₹${tournament.playerEntryFee || 0} (Player) / ₹${tournament.teamEntryFee || 0} (Team)`
                                  : `₹${tournament.entryFee}`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {isAuctionTournament(tournament)
                                  ? `${tournament._count.auctionPlayers}/${tournament.playerPoolSize || 100} Players`
                                  : `${tournament._count.registrations}/${tournament.maxTeams} Teams`
                                }
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Registration Form
          <div className="space-y-6">
            {/* Tournament Info Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedTournament.name}
                      {isAuctionTournament(selectedTournament) && (
                        <Badge variant="secondary">
                          <Crown className="h-3 w-3 mr-1" />
                          Auction
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{selectedTournament.format} • {selectedTournament.venue}</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTournament(null)}
                  >
                    Back to Tournaments
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Registration Type Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Type</CardTitle>
                <CardDescription>
                  {isAuctionTournament(selectedTournament) 
                    ? "For auction tournaments, you can register as a player or team owner. Teams will be formed during the auction."
                    : "Register your complete team for this tournament."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={registrationType} onValueChange={(value) => setRegistrationType(value as any)}>
                  {isAuctionTournament(selectedTournament) ? (
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="player" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Player Registration
                      </TabsTrigger>
                      <TabsTrigger value="owner" className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Team Owner Registration
                      </TabsTrigger>
                    </TabsList>
                  ) : (
                    <TabsList className="grid w-full grid-cols-1">
                      <TabsTrigger value="team" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Registration
                      </TabsTrigger>
                    </TabsList>
                  )}

                  {/* Player Registration Tab - Only for Auction Tournaments */}
                  {isAuctionTournament(selectedTournament) && (
                    <TabsContent value="player" className="space-y-6 mt-6">
                      <Alert>
                        <Star className="h-4 w-4" />
                        <AlertDescription>
                          Register as an individual player for the auction. You will be assigned to a team during the auction process.
                        </AlertDescription>
                      </Alert>

                      {/* Player Form */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="playerName">Full Name *</Label>
                            <div className="relative">
                              <Input
                                id="playerName"
                                value={playerData.name}
                                onChange={(e) => {
                                  setPlayerData(prev => ({ ...prev, name: e.target.value }))
                                  searchPlayers(e.target.value)
                                }}
                                placeholder="Enter your full name or search existing players"
                              />
                              {isSearching && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                </div>
                              )}
                              
                              {(showResults || showNoResults) && (
                                <div className="absolute z-50 w-full -mt-px bg-popover border border-t-0 rounded-b-xl rounded-t-none shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 overflow-hidden">
                                  {showResults && searchResults.length > 0 ? (
                                    <div className="max-h-60 overflow-y-auto">
                                      <div className="sticky top-0 z-10 px-3 py-2 bg-muted/80 border-b text-xs font-medium text-muted-foreground">
                                        Found {searchResults.length} player{searchResults.length !== 1 ? 's' : ''} - click to auto-fill
                                      </div>
                                      <div className="divide-y divide-border">
                                        {searchResults.map((result, index) => (
                                          <button
                                            key={index}
                                            type="button"
                                            onClick={() => {
                                              // Auto-fill player data from search result
                                              setPlayerData(prev => ({
                                                ...prev,
                                                name: result.name,
                                                phone: result.phone || prev.phone,
                                                email: result.email || prev.email,
                                                city: result.city || prev.city,
                                                age: result.age || prev.age,
                                                position: result.position || prev.position,
                                                experience: result.experience || prev.experience
                                              }))
                                              setShowResults(false)
                                              setShowNoResults(false)
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors duration-150 focus:bg-muted/50 focus:outline-none"
                                          >
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <div className="font-medium text-foreground">{result.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                  {result.position} • {result.city} • Age {result.age}
                                                </div>
                                              </div>
                                              <Badge variant="outline" className="text-xs">
                                                {result.experience}
                                              </Badge>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ) : showNoResults ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      No players found. Continue typing to register as new player.
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="playerAge">Age</Label>
                            <Input
                              id="playerAge"
                              type="number"
                              min="16"
                              max="50"
                              value={calculateAge(playerData.dateOfBirth)}
                              disabled
                              placeholder="Calculated from date of birth"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Calculated automatically from date of birth: {calculateAge(playerData.dateOfBirth)} years
                            </p>
                          </div>

                          <div>
                            <PhoneInput
                              label="Phone Number *"
                              value={playerData.phone}
                              onChange={(value) => setPlayerData(prev => ({ ...prev, phone: value }))}
                              placeholder="Enter 10-digit mobile number"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="playerEmail">Email *</Label>
                            <Input
                              id="playerEmail"
                              type="email"
                              value={playerData.email}
                              onChange={(e) => setPlayerData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Your email address"
                            />
                          </div>

                          <div>
                            <Label htmlFor="playerCity">City/Village *</Label>
                            <Input
                              id="playerCity"
                              value={playerData.city}
                              onChange={(e) => setPlayerData(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="Your city or village"
                            />
                          </div>

                          <div>
                            <Label htmlFor="playerAddress">Address</Label>
                            <Input
                              id="playerAddress"
                              value={playerData.address}
                              onChange={(e) => setPlayerData(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Your full address"
                            />
                          </div>

                          <div>
                            <Label htmlFor="playerFatherName">Father's Name</Label>
                            <Input
                              id="playerFatherName"
                              value={playerData.fatherName}
                              onChange={(e) => setPlayerData(prev => ({ ...prev, fatherName: e.target.value }))}
                              placeholder="Father's name"
                            />
                          </div>

                          <div>
                            <Label htmlFor="playerDateOfBirth">Date of Birth</Label>
                            <DatePicker
                              date={playerData.dateOfBirth ? new Date(playerData.dateOfBirth) : undefined}
                              onDateChange={(date: Date | undefined) => 
                                setPlayerData(prev => ({ 
                                  ...prev, 
                                  dateOfBirth: date ? date.toISOString().split('T')[0] : '',
                                  age: date ? calculateAge(date.toISOString().split('T')[0]) : 18
                                }))
                              }
                              placeholder="Select date of birth"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Photo Upload Section */}
                          <div>
                            <Label>Player Photo (Optional)</Label>
                            {!photoPreview ? (
                              <div>
                                <input
                                  id="playerPhoto"
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoSelect}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById('playerPhoto')?.click()}
                                  className="w-full h-24 border-dashed border-2 flex flex-col items-center justify-center space-y-2"
                                >
                                  <div className="text-muted-foreground">📷</div>
                                  <span className="text-sm text-muted-foreground">
                                    Click to upload photo
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    JPG, PNG, WebP (Max 5MB)
                                  </span>
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="relative">
                                  <img
                                    src={photoPreview}
                                    alt="Player photo preview"
                                    className="w-full h-32 object-cover rounded-lg border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={clearPhoto}
                                    className="absolute top-2 right-2"
                                  >
                                    ✕
                                  </Button>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById('playerPhoto')?.click()}
                                  className="w-full"
                                >
                                  Change Photo
                                </Button>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="position">Playing Position *</Label>
                            <Select
                              value={playerData.position}
                              onValueChange={(value) => setPlayerData(prev => ({ ...prev, position: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BATSMAN">Batsman</SelectItem>
                                <SelectItem value="BOWLER">Bowler</SelectItem>
                                <SelectItem value="ALL_ROUNDER">All-rounder</SelectItem>
                                <SelectItem value="WICKET_KEEPER">Wicket Keeper</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="battingStyle">Batting Style</Label>
                            <Select
                              value={playerData.battingStyle}
                              onValueChange={(value) => setPlayerData(prev => ({ ...prev, battingStyle: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="RIGHT_HANDED">Right Handed</SelectItem>
                                <SelectItem value="LEFT_HANDED">Left Handed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="bowlingStyle">Bowling Style</Label>
                            <Select
                              value={playerData.bowlingStyle}
                              onValueChange={(value) => setPlayerData(prev => ({ ...prev, bowlingStyle: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="RIGHT_ARM_FAST">Right Arm Fast</SelectItem>
                                <SelectItem value="LEFT_ARM_FAST">Left Arm Fast</SelectItem>
                                <SelectItem value="RIGHT_ARM_MEDIUM">Right Arm Medium</SelectItem>
                                <SelectItem value="LEFT_ARM_MEDIUM">Left Arm Medium</SelectItem>
                                <SelectItem value="RIGHT_ARM_SPIN">Right Arm Spin</SelectItem>
                                <SelectItem value="LEFT_ARM_SPIN">Left Arm Spin</SelectItem>
                                <SelectItem value="WICKET_KEEPER">Wicket Keeper</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="experience">Experience Level</Label>
                            <Select
                              value={playerData.experience}
                              onValueChange={(value) => setPlayerData(prev => ({ ...prev, experience: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BEGINNER">Beginner</SelectItem>
                                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                                <SelectItem value="ADVANCED">Advanced</SelectItem>
                                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                            <Input
                              id="emergencyContact"
                              value={playerData.emergencyContact}
                              onChange={(e) => setPlayerData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                              placeholder="Emergency contact name"
                            />
                          </div>

                          <div>
                            <PhoneInput
                              label="Emergency Phone *"
                              value={playerData.emergencyPhone}
                              onChange={(value) => setPlayerData(prev => ({ ...prev, emergencyPhone: value }))}
                              placeholder="Emergency contact number"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="emergencyRelation">Emergency Contact Relation</Label>
                            <Input
                              id="emergencyRelation"
                              value={playerData.emergencyRelation}
                              onChange={(e) => setPlayerData(prev => ({ ...prev, emergencyRelation: e.target.value }))}
                              placeholder="e.g., Father, Mother, Brother"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Payment Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <PaymentMethodSelector
                            value={playerData.paymentMethod}
                            onChange={(value) => setPlayerData(prev => ({ ...prev, paymentMethod: value }))}
                            paymentSettings={paymentSettings}
                            amount={playerData.paymentAmount}
                          />
                        </CardContent>
                      </Card>

                      {/* Errors */}
                      {errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <ul className="list-disc list-inside space-y-1">
                              {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Submit Button */}
                      <div className="flex gap-4">
                        <Button 
                          onClick={submitPlayerRegistration}
                          disabled={submitting}
                          className="flex-1"
                        >
                          {submitting ? 'Submitting...' : 'Register as Player'}
                        </Button>
                      </div>
                    </TabsContent>
                  )}

                  {/* Team Owner Registration Tab - Only for Auction Tournaments */}
                  {isAuctionTournament(selectedTournament) && (
                    <TabsContent value="owner" className="space-y-6 mt-6">
                      <Alert>
                        <Crown className="h-4 w-4" />
                        <AlertDescription>
                          Register as a team owner/sponsor for the auction tournament. You will be able to bid for players during the auction.
                        </AlertDescription>
                      </Alert>

                      {/* Owner Form */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="ownerName">Owner Name *</Label>
                            <Input
                              id="ownerName"
                              value={ownerData.ownerName}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, ownerName: e.target.value }))}
                              placeholder="Your full name"
                            />
                          </div>

                          <div>
                            <Label htmlFor="ownerDateOfBirth">Date of Birth *</Label>
                            <DatePicker
                              date={ownerData.ownerDateOfBirth ? new Date(ownerData.ownerDateOfBirth) : undefined}
                              onDateChange={(date: Date | undefined) => 
                                setOwnerData(prev => ({ 
                                  ...prev, 
                                  ownerDateOfBirth: date ? date.toISOString().split('T')[0] : '',
                                  ownerAge: date ? calculateAge(date.toISOString().split('T')[0]) : 18
                                }))
                              }
                              placeholder="Select date of birth"
                            />
                          </div>

                          <div>
                            <Label htmlFor="ownerAge">Age</Label>
                            <Input
                              id="ownerAge"
                              type="number"
                              min="18"
                              max="70"
                              value={calculateAge(ownerData.ownerDateOfBirth)}
                              disabled
                              placeholder="Calculated from date of birth"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Calculated automatically from date of birth: {calculateAge(ownerData.ownerDateOfBirth)} years
                            </p>
                          </div>

                          <div>
                            <PhoneInput
                              label="Phone Number *"
                              value={ownerData.ownerPhone}
                              onChange={(value) => setOwnerData(prev => ({ ...prev, ownerPhone: value }))}
                              placeholder="Enter 10-digit mobile number"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="ownerEmail">Email *</Label>
                            <Input
                              id="ownerEmail"
                              type="email"
                              value={ownerData.ownerEmail}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                              placeholder="Your email address"
                            />
                          </div>

                          <div>
                            <Label htmlFor="ownerCity">City/Village *</Label>
                            <Input
                              id="ownerCity"
                              value={ownerData.ownerCity}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, ownerCity: e.target.value }))}
                              placeholder="Your city or village"
                            />
                          </div>

                          <div>
                            <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                            <Input
                              id="emergencyContact"
                              value={ownerData.emergencyContact}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                              placeholder="Emergency contact name"
                            />
                          </div>

                          <div>
                            <PhoneInput
                              label="Emergency Phone *"
                              value={ownerData.emergencyPhone}
                              onChange={(value) => setOwnerData(prev => ({ ...prev, emergencyPhone: value }))}
                              placeholder="Emergency contact number"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="teamName">Preferred Team Name *</Label>
                            <Input
                              id="teamName"
                              value={ownerData.teamName}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, teamName: e.target.value }))}
                              placeholder="Preferred team name"
                            />
                          </div>

                          <div>
                            <Label htmlFor="experience">Team Management Experience</Label>
                            <Select
                              value={ownerData.experience || 'INTERMEDIATE'}
                              onValueChange={(value) => setOwnerData(prev => ({ ...prev, experience: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BEGINNER">First Time</SelectItem>
                                <SelectItem value="INTERMEDIATE">Some Experience</SelectItem>
                                <SelectItem value="ADVANCED">Experienced</SelectItem>
                                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="sponsorName">Sponsor/Company Name (Optional)</Label>
                            <Input
                              id="sponsorName"
                              value={ownerData.sponsorName || ''}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, sponsorName: e.target.value }))}
                              placeholder="Sponsor/Company name"
                            />
                          </div>

                          <div>
                            <Label htmlFor="businessName">Business Name (Optional)</Label>
                            <Input
                              id="businessName"
                              value={ownerData.businessName || ''}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, businessName: e.target.value }))}
                              placeholder="Your business name"
                            />
                          </div>

                          <div>
                            <Label htmlFor="businessType">Business Type (Optional)</Label>
                            <Input
                              id="businessType"
                              value={ownerData.businessType || ''}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, businessType: e.target.value }))}
                              placeholder="Type of business"
                            />
                          </div>

                          <div>
                            <Label htmlFor="sponsorContact">Sponsor Contact (Optional)</Label>
                            <Input
                              id="sponsorContact"
                              value={ownerData.sponsorContact || ''}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, sponsorContact: e.target.value }))}
                              placeholder="Sponsor contact details"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Payment Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <PaymentMethodSelector
                            value={ownerData.paymentMethod}
                            onChange={(value) => setOwnerData(prev => ({ ...prev, paymentMethod: value }))}
                            paymentSettings={paymentSettings}
                            amount={ownerData.paymentAmount}
                          />

                          <div>
                            <Label htmlFor="ownerSpecialRequests">Special Requests (Optional)</Label>
                            <Textarea
                              id="ownerSpecialRequests"
                              value={ownerData.specialRequests || ''}
                              onChange={(e) => setOwnerData(prev => ({ ...prev, specialRequests: e.target.value }))}
                              placeholder="Any special requests or notes"
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Errors */}
                      {errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <ul className="list-disc list-inside space-y-1">
                              {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Submit Button */}
                      <div className="flex gap-4">
                        <Button 
                          onClick={submitOwnerRegistration}
                          disabled={submitting}
                          className="flex-1"
                        >
                          {submitting ? 'Submitting...' : 'Register as Team Owner'}
                        </Button>
                      </div>
                    </TabsContent>
                  )}

                  {/* Team Registration Tab - Only for Regular Tournaments */}
                  {!isAuctionTournament(selectedTournament) && (
                    <TabsContent value="team" className="space-y-6 mt-6">
                      <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                          Register your complete team for this tournament. All team members must be added during registration.
                        </AlertDescription>
                      </Alert>

                      <form onSubmit={handleTeamSubmit} className="space-y-6">
                        {/* Team Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Team Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="teamName">Team Name *</Label>
                              <Input
                                id="teamName"
                                value={teamData.teamName}
                                onChange={(e) => setTeamData(prev => ({ ...prev, teamName: e.target.value }))}
                                placeholder="Enter your team name"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="teamCity">Team City *</Label>
                              <Input
                                id="teamCity"
                                value={teamData.teamCity}
                                onChange={(e) => setTeamData(prev => ({ ...prev, teamCity: e.target.value }))}
                                placeholder="Enter team city"
                                required
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Captain Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Crown className="h-5 w-5" />
                              Captain Information
                            </CardTitle>
                            <CardDescription>
                              Captain details will automatically sync with Player 1
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="captainName">Captain Name *</Label>
                                <Input
                                  id="captainName"
                                  value={teamData.captainName}
                                  onChange={(e) => updateCaptainAndFirstPlayer('captainName', e.target.value)}
                                  placeholder="Enter captain name"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="captainDateOfBirth">Captain Date of Birth *</Label>
                                <DatePicker
                                  date={teamData.captainDateOfBirth ? new Date(teamData.captainDateOfBirth) : undefined}
                                  onDateChange={(date: Date | undefined) => {
                                    const dateString = date ? date.toISOString().split('T')[0] : ''
                                    const calculatedAge = date ? calculateAge(dateString) : 18
                                    setTeamData(prev => ({ 
                                      ...prev, 
                                      captainDateOfBirth: dateString,
                                      captainAge: calculatedAge
                                    }))
                                    // Also update the first player since captain is the first player
                                    if (teamData.players.length > 0) {
                                      const updatedPlayers = [...teamData.players]
                                      updatedPlayers[0] = {
                                        ...updatedPlayers[0],
                                        dateOfBirth: dateString,
                                        age: calculatedAge
                                      }
                                      setTeamData(prev => ({ ...prev, players: updatedPlayers }))
                                    }
                                  }}
                                  placeholder="Select captain's date of birth"
                                />
                              </div>
                              <div>
                                <Label htmlFor="captainAge">Captain Age</Label>
                                <Input
                                  id="captainAge"
                                  type="number"
                                  value={calculateAge(teamData.captainDateOfBirth)}
                                  disabled
                                  placeholder="Calculated from date of birth"
                                  min="16"
                                  max="60"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Calculated from date of birth: {calculateAge(teamData.captainDateOfBirth)} years
                                </p>
                              </div>
                              <div>
                                <PhoneInput
                                  label="Captain Phone"
                                  value={teamData.captainPhone}
                                  onChange={(value) => updateCaptainAndFirstPlayer('captainPhone', value)}
                                  placeholder="Enter 10-digit mobile number"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="captainEmail">Captain Email *</Label>
                                <Input
                                  id="captainEmail"
                                  type="email"
                                  value={teamData.captainEmail}
                                  onChange={(e) => updateCaptainAndFirstPlayer('captainEmail', e.target.value)}
                                  placeholder="Enter email address"
                                  required
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Players Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Star className="h-5 w-5" />
                              Team Players ({selectedTournament.teamSize} players + {selectedTournament.substitutes} substitutes)
                              {/* Debug indicator */}
                              {teamData.players.length === 0 && (
                                <span className="text-red-500 text-sm ml-2">[AUTO-GENERATION FAILED]</span>
                              )}
                              {teamData.players.length === selectedTournament.teamSize && (
                                <span className="text-green-500 text-sm ml-2">[AUTO-GENERATED ✅]</span>
                              )}
                            </CardTitle>
                            <CardDescription>
                              Player 1 is automatically set as your team captain. Add remaining {selectedTournament.teamSize + selectedTournament.substitutes - 1} players below.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {teamData.players.map((player, index) => (
                              <div key={index} className="p-4 border rounded-lg space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <Badge variant={index === 0 ? "default" : index < selectedTournament.teamSize ? "secondary" : "outline"}>
                                    {index === 0 ? "Captain" : 
                                     index < selectedTournament.teamSize ? `Player ${index + 1}` : 
                                     `Substitute ${index - selectedTournament.teamSize + 1}`}
                                  </Badge>
                                  {index >= selectedTournament.teamSize && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removePlayer(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                    <Label>Player Name *</Label>
                                    <Input
                                      value={player.name}
                                      onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                                      placeholder={index === 0 ? "Captain name (auto-filled)" : "Enter player name"}
                                      required
                                      className={index === 0 ? "font-medium border-primary" : ""}
                                      disabled={index === 0}
                                    />
                                  </div>
                                  <div>
                                    <Label>Date of Birth *</Label>
                                    <DatePicker
                                      date={player.dateOfBirth ? new Date(player.dateOfBirth) : undefined}
                                      onDateChange={(date: Date | undefined) => {
                                        const dateString = date ? date.toISOString().split('T')[0] : ''
                                        updatePlayer(index, 'dateOfBirth', dateString)
                                        updatePlayer(index, 'age', date ? calculateAge(dateString) : 18)
                                      }}
                                      placeholder="Select date of birth"
                                      disabled={index === 0}
                                    />
                                  </div>
                                  <div>
                                    <Label>Age</Label>
                                    <Input
                                      type="number"
                                      value={calculateAge(player.dateOfBirth)}
                                      min="16"
                                      max="60"
                                      disabled
                                      placeholder="Calculated from date of birth"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Age: {calculateAge(player.dateOfBirth)} years
                                    </p>
                                  </div>
                                  <div>
                                    <PhoneInput
                                      label="Phone *"
                                      value={player.phone}
                                      onChange={(value) => updatePlayer(index, 'phone', value)}
                                      placeholder="Enter mobile number"
                                      required
                                      disabled={index === 0}
                                    />
                                  </div>
                                  <div>
                                    <Label>Email {index === 0 ? '*' : '(Optional)'}</Label>
                                    <Input
                                      type="email"
                                      value={player.email}
                                      onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                                      placeholder="Email address"
                                      required={index === 0} // Only captain email is required
                                      disabled={index === 0}
                                    />
                                  </div>
                                  <div>
                                    <Label>City *</Label>
                                    <Input
                                      value={player.city}
                                      onChange={(e) => updatePlayer(index, 'city', e.target.value)}
                                      placeholder="City"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label>Position *</Label>
                                    <Select
                                      value={player.position}
                                      onValueChange={(value) => updatePlayer(index, 'position', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select position" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="BATSMAN">Batsman</SelectItem>
                                        <SelectItem value="BOWLER">Bowler</SelectItem>
                                        <SelectItem value="ALL_ROUNDER">All Rounder</SelectItem>
                                        <SelectItem value="WICKET_KEEPER">Wicket Keeper</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Batting Style</Label>
                                    <Select
                                      value={player.battingStyle}
                                      onValueChange={(value) => updatePlayer(index, 'battingStyle', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select batting style" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="RIGHT_HANDED">Right Handed</SelectItem>
                                        <SelectItem value="LEFT_HANDED">Left Handed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Bowling Style</Label>
                                    <Select
                                      value={player.bowlingStyle}
                                      onValueChange={(value) => updatePlayer(index, 'bowlingStyle', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select bowling style" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="RIGHT_ARM_FAST">Right Arm Fast</SelectItem>
                                        <SelectItem value="LEFT_ARM_FAST">Left Arm Fast</SelectItem>
                                        <SelectItem value="RIGHT_ARM_MEDIUM">Right Arm Medium</SelectItem>
                                        <SelectItem value="LEFT_ARM_MEDIUM">Left Arm Medium</SelectItem>
                                        <SelectItem value="RIGHT_ARM_SPIN">Right Arm Spin</SelectItem>
                                        <SelectItem value="LEFT_ARM_SPIN">Left Arm Spin</SelectItem>
                                        <SelectItem value="LEG_SPIN">Leg Spin</SelectItem>
                                        <SelectItem value="OFF_SPIN">Off Spin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Experience *</Label>
                                    <Select
                                      value={player.experience}
                                      onValueChange={(value) => updatePlayer(index, 'experience', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select experience" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {/* Show Add Player button only if substitutes are allowed and we haven't reached the limit */}
                            {selectedTournament.substitutes > 0 && teamData.players.length < (selectedTournament.teamSize + selectedTournament.substitutes) && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={addPlayer}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Substitute ({teamData.players.length - selectedTournament.teamSize}/{selectedTournament.substitutes})
                              </Button>
                            )}
                            
                            {/* Show info about substitute availability */}
                            {selectedTournament.substitutes === 0 && (
                              <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                  No substitutes allowed for this tournament
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Emergency Contact */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Phone className="h-5 w-5" />
                              Emergency Contact
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="emergencyName">Contact Name *</Label>
                                <Input
                                  id="emergencyName"
                                  value={teamData.emergencyContact.name}
                                  onChange={(e) => setTeamData(prev => ({
                                    ...prev,
                                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                                  }))}
                                  placeholder="Emergency contact name"
                                  required
                                />
                              </div>
                              <div>
                                <PhoneInput
                                  label="Contact Phone"
                                  value={teamData.emergencyContact.phone}
                                  onChange={(value) => setTeamData(prev => ({
                                    ...prev,
                                    emergencyContact: { ...prev.emergencyContact, phone: value }
                                  }))}
                                  placeholder="Emergency contact number"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="emergencyRelation">Relationship *</Label>
                                <Input
                                  id="emergencyRelation"
                                  value={teamData.emergencyContact.relation}
                                  onChange={(e) => setTeamData(prev => ({
                                    ...prev,
                                    emergencyContact: { ...prev.emergencyContact, relation: e.target.value }
                                  }))}
                                  placeholder="Relationship"
                                  required
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Payment Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              Payment Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <PaymentMethodSelector
                              value={teamData.paymentMethod}
                              onChange={(value) => setTeamData(prev => ({ ...prev, paymentMethod: value }))}
                              paymentSettings={paymentSettings}
                              amount={teamData.paymentAmount}
                            />
                          </CardContent>
                        </Card>

                        {/* Special Requests */}
                        <Card>
                          <CardContent className="pt-6">
                            <div>
                              <Label htmlFor="teamSpecialRequests">Special Requests (Optional)</Label>
                              <Textarea
                                id="teamSpecialRequests"
                                value={teamData.specialRequests}
                                onChange={(e) => setTeamData(prev => ({ ...prev, specialRequests: e.target.value }))}
                                placeholder="Any special requirements or requests..."
                                rows={3}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-center">
                          <Button 
                            type="submit" 
                            size="lg" 
                            disabled={submitting}
                            className="min-w-[200px]"
                          >
                            {submitting ? 'Registering...' : `Register Team (₹${teamData.paymentAmount})`}
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

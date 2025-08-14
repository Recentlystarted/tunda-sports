'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Users, Phone, Mail, Calendar, MapPin, Trophy, DollarSign, AlertCircle, Search, Crown, Star, Upload, X } from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import { getAuctionTerms } from '@/lib/termsConfig'

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
  playersPool?: string
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

interface TeamOwnerRegistrationData {
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  ownerCity: string
  ownerAge: number
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
  description?: string;
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

interface AuctionRegistrationProps {
  tournament: Tournament
  defaultTab?: string
}

// Payment Details Component
const PaymentDetailsSection = ({ paymentSettings, amount }: { paymentSettings: PaymentSettings | null, amount: number }) => {
  if (!paymentSettings || !paymentSettings.upiId) return null

  const displayAmount = paymentSettings.amount || amount

  return (
    <div className="mt-6 p-4 border rounded-lg bg-muted/50">
      <h4 className="font-semibold text-lg mb-4 text-center">
        {paymentSettings.methodName || 'UPI Payment Details'}
      </h4>
      {paymentSettings.description && (
        <p className="text-sm text-muted-foreground text-center mb-4">
          {paymentSettings.description}
        </p>
      )}
      <div className="space-y-3">
        <div className="flex justify-between items-center p-2 bg-background rounded border">
          <span className="text-sm font-medium">Amount:</span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">₹{displayAmount}</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-background rounded border">
          <span className="text-sm font-medium">UPI ID:</span>
          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
            {paymentSettings.upiId}
          </span>
        </div>
        <div className="flex justify-between items-center p-2 bg-background rounded border">
          <span className="text-sm font-medium">Mobile:</span>
          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
            {paymentSettings.upiMobile}
          </span>
        </div>
        {paymentSettings.qrCodeUrl ? (
          <div className="text-center mt-4">
            <p className="text-sm font-medium mb-2">Scan QR Code to Pay</p>
            <div className="inline-block p-2 bg-white rounded-lg border">
              <img 
                src={paymentSettings.qrCodeUrl} 
                alt="UPI QR Code" 
                className="w-48 h-48 object-contain mx-auto"
                onError={(e) => {
                  console.error('QR Code image failed to load:', paymentSettings.qrCodeUrl)
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.parentElement?.nextElementSibling
                  if (fallback) fallback.classList.remove('hidden')
                }}
              />
            </div>
            <div className="hidden text-center mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                QR Code not available. Please use the UPI ID above for payment.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              QR Code not available. Please use the UPI ID above for payment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuctionRegistration({ tournament, defaultTab = 'player' }: AuctionRegistrationProps) {
  const router = useRouter()
  
  // Get terms and conditions from centralized config
  const TERMS_AND_CONDITIONS = getAuctionTerms()
  
  const [registrationType, setRegistrationType] = useState<'player' | 'owner'>(
    defaultTab === 'owner' ? 'owner' : 'player'
  )
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  
  // Search states
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showNoResults, setShowNoResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Duplicate checking states
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false)
  const [duplicateFound, setDuplicateFound] = useState(false)
  const [duplicateMessage, setDuplicateMessage] = useState('')

  // Photo upload states
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)

  // Registration data states
  const [playerData, setPlayerData] = useState<PlayerRegistrationData>({
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
    paymentAmount: tournament.playerEntryFee || 0,
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelation: '',
    profileImageUrl: ''
  })

  const [ownerData, setOwnerData] = useState<TeamOwnerRegistrationData>({
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerCity: '',
    ownerAge: 18,
    teamName: '',
    sponsorName: '',
    sponsorContact: '',
    businessName: '',
    businessType: '',
    experience: '',
    paymentMethod: 'UPI',
    paymentAmount: tournament.teamEntryFee || 0,
    specialRequests: '',
    emergencyContact: '',
    emergencyPhone: ''
  })

  useEffect(() => {
    fetchPaymentSettings()
  }, [registrationType, tournament.id])

  useEffect(() => {
    // Reset terms acceptance when switching between tabs
    setTermsAccepted(false)
  }, [registrationType])

  const fetchPaymentSettings = async () => {
    try {
      // First try to get tournament-specific payment methods
      const tournamentResponse = await fetch(`/api/tournaments/${tournament.id}/payment-methods`)
      if (tournamentResponse.ok) {
        const methods = await tournamentResponse.json()
        
        // Find the appropriate payment method based on registration type
        let targetMethod = null
        if (registrationType === 'player') {
          targetMethod = methods.find((m: any) => m.methodType === 'PLAYER_REGISTRATION')
        } else if (registrationType === 'owner') {
          targetMethod = methods.find((m: any) => m.methodType === 'TEAM_OWNER_REGISTRATION')  
        }
        
        // Fallback to general registration or first method
        if (!targetMethod) {
          targetMethod = methods.find((m: any) => m.methodType === 'GENERAL_REGISTRATION') || methods[0]
        }
        
        if (targetMethod) {
          setPaymentSettings(targetMethod)
          return
        }
      }
      
      // Fallback to global payment settings
      const response = await fetch('/api/settings/payment')
      if (response.ok) {
        const data = await response.json()
        setPaymentSettings(data)
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error)
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

  const selectPlayer = (selectedPlayer: SearchResult) => {
    setPlayerData(prev => ({
      ...prev,
      name: selectedPlayer.name,
      age: selectedPlayer.age || 18,
      phone: selectedPlayer.phone || '',
      email: selectedPlayer.email || '',
      city: selectedPlayer.city || '',
      position: selectedPlayer.position || 'BATSMAN',
      experience: selectedPlayer.experience || 'INTERMEDIATE',
      // Keep existing values for new fields
      address: prev.address,
      dateOfBirth: prev.dateOfBirth,
      fatherName: prev.fatherName,
      emergencyContact: prev.emergencyContact,
      emergencyPhone: prev.emergencyPhone,
      emergencyRelation: prev.emergencyRelation,
      profileImageUrl: prev.profileImageUrl
    }))
    setShowResults(false)
    setShowNoResults(false)
  }

  const isRegistrationClosed = (): boolean => {
    const now = new Date()
    const deadline = new Date(tournament.registrationDeadline)
    
    if (now > deadline) return true
    if (tournament.status !== 'REGISTRATION_OPEN' && tournament.status !== 'UPCOMING') return true
    
    // Check capacity for auction players
    return (tournament._count?.auctionPlayers || 0) >= (tournament.playerPoolSize || 100)
  }

  const validatePlayerRegistration = (): boolean => {
    const newErrors: string[] = []
    
    if (!playerData.name.trim()) newErrors.push('Name is required')
    if (!playerData.phone.trim()) newErrors.push('Phone is required')
    if (!playerData.email.trim()) newErrors.push('Email is required')
    if (!playerData.city.trim()) newErrors.push('City is required')
    if (!playerData.position) newErrors.push('Position is required')
    if (!playerData.age || playerData.age < 16 || playerData.age > 60) newErrors.push('Age must be between 16 and 60')
    if (!termsAccepted) newErrors.push('You must accept the terms and conditions to register')
    if (duplicateFound) newErrors.push(duplicateMessage || 'Player already registered')
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const validateOwnerRegistration = (): boolean => {
    const newErrors: string[] = []
    
    if (!ownerData.ownerName.trim()) newErrors.push('Owner name is required')
    if (!ownerData.ownerPhone.trim()) newErrors.push('Owner phone is required')
    if (!ownerData.ownerEmail.trim()) newErrors.push('Owner email is required')
    if (!ownerData.teamName.trim()) newErrors.push('Team name is required')
    if (!ownerData.ownerAge || ownerData.ownerAge < 18 || ownerData.ownerAge > 70) newErrors.push('Owner age must be between 18 and 70')
    if (!termsAccepted) newErrors.push('You must accept the terms and conditions to register')
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const submitPlayerRegistration = async () => {
    // First check for duplicates
    await checkForDuplicates(playerData.name, playerData.phone, playerData.email)
    
    if (!validatePlayerRegistration()) return

    setSubmitting(true)
    try {
      let profileImageUrl = playerData.profileImageUrl

      // Upload photo if one is selected
      if (selectedPhoto) {
        setPhotoUploading(true)
        const uploadedUrl = await uploadPhotoToGoogleDrive(selectedPhoto, playerData.name)
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl
          // Update preview with uploaded URL
          if (photoPreview && photoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreview)
          }
          setPhotoPreview(uploadedUrl)
        }
        setPhotoUploading(false)
      }

      const registrationData = {
        name: playerData.name,
        age: playerData.age,
        phone: playerData.phone,
        email: playerData.email,
        city: playerData.city,
        address: playerData.address,
        dateOfBirth: playerData.dateOfBirth,
        fatherName: playerData.fatherName,
        position: playerData.position,
        battingStyle: playerData.battingStyle,
        bowlingStyle: playerData.bowlingStyle,
        experience: playerData.experience,
        emergencyContact: playerData.emergencyContact,
        emergencyPhone: playerData.emergencyPhone,
        emergencyRelation: playerData.emergencyRelation,
        profileImageUrl,
        basePrice: 0,
        specialSkills: ''
      }

      const response = await fetch(`/api/tournaments/${tournament.id}/auction-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      })

      if (response.ok) {
        toast({
          title: "Registration Successful! 🎉",
          description: "Your player registration has been submitted for the auction tournament."
        })
        
        // Reset form
        setPlayerData({
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
          paymentAmount: tournament.playerEntryFee || 0,
          emergencyContact: '',
          emergencyPhone: '',
          emergencyRelation: '',
          profileImageUrl: ''
        })
        
        // Reset photo states
        setPhotoPreview(null)
        setSelectedPhoto(null)
        if (photoPreview && photoPreview.startsWith('blob:')) {
          URL.revokeObjectURL(photoPreview)
        }
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
      setPhotoUploading(false)
    }
  }

  const submitOwnerRegistration = async () => {
    if (!validateOwnerRegistration()) return

    setSubmitting(true)
    try {
      const registrationData = {
        tournamentId: tournament.id,
        type: 'OWNER',
        ...ownerData
      }

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      })

      if (response.ok) {
        toast({
          title: "Registration Successful! 🎉",
          description: "Your team owner registration has been submitted. You will receive a confirmation email."
        })
        
        // Reset form
        setOwnerData({
          ownerName: '',
          ownerPhone: '',
          ownerEmail: '',
          ownerCity: '',
          ownerAge: 18,
          teamName: '',
          sponsorName: '',
          sponsorContact: '',
          businessName: '',
          businessType: '',
          experience: '',
          paymentMethod: 'UPI',
          paymentAmount: tournament.teamEntryFee || 0,
          specialRequests: '',
          emergencyContact: '',
          emergencyPhone: ''
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

  // Duplicate checking function
  const checkForDuplicates = async (name: string, phone: string, email: string) => {
    if (!name || !phone || !email) return

    setIsDuplicateChecking(true)
    setDuplicateFound(false)
    setDuplicateMessage('')

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/auction-players/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.isDuplicate) {
          setDuplicateFound(true)
          setDuplicateMessage(data.message || 'Player already registered')
        }
      }
    } catch (error) {
      console.error('Error checking duplicates:', error)
    } finally {
      setIsDuplicateChecking(false)
    }
  }

  // Photo upload function - now just creates preview, actual upload happens on form submit
  const handlePhotoUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    // Create immediate preview
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    
    // Store the file for later upload
    setSelectedPhoto(file)
    
    toast({
      title: "Photo Selected!",
      description: "Photo will be uploaded when you submit the registration"
    })
  }

  // Function to upload photo to Google Drive using tournament section-based approach
  const uploadPhotoToGoogleDrive = async (file: File, playerName: string): Promise<string | null> => {
    try {
      // Use the same system as tournament photos - section-based approach
      // First, check if "Auction Players" section exists for this tournament
      let auctionPlayersSectionId = null;
      
      // Try to get existing "Auction Players" section
      const sectionsResponse = await fetch(`/api/tournaments/${tournament.id}/sections`);
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        const existingSection = sectionsData.sections?.find((s: any) => 
          s.name.toLowerCase().includes('auction') && s.name.toLowerCase().includes('player')
        );
        if (existingSection) {
          auctionPlayersSectionId = existingSection.id;
        }
      }
      
      // If no section exists, create "Auction Players" section
      if (!auctionPlayersSectionId) {
        const createSectionResponse = await fetch(`/api/tournaments/${tournament.id}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Auction Players',
            description: 'Player profile photos for the auction',
            emoji: '👤'
          })
        });
        
        if (createSectionResponse.ok) {
          const sectionData = await createSectionResponse.json();
          auctionPlayersSectionId = sectionData.section?.id;
        }
      }
      
      // Upload photo to the "Auction Players" section using tournament images API
      if (auctionPlayersSectionId) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('sectionId', auctionPlayersSectionId);
        formData.append('title', `${playerName} - Profile Photo`);
        formData.append('description', `Profile photo for auction player ${playerName}`);
        
        const uploadResponse = await fetch(`/api/tournaments/${tournament.id}/images`, {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          return uploadData.image?.googleDriveUrl || uploadData.image?.publicUrl;
        }
      }
      
      // Fallback to basic upload if section-based approach fails
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'AUCTION_PLAYER')
      formData.append('description', `Profile photo for ${playerName} in ${tournament.name}`)

      const response = await fetch('/api/images/google-drive', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return data.webViewLink || data.url || data.publicUrl
      } else {
        console.error('Photo upload failed:', await response.text())
        return null
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      return null
    }
  }

  if (isRegistrationClosed()) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Registration for this auction tournament is currently closed.
              {(tournament._count?.auctionPlayers || 0) >= (tournament.playerPoolSize || 100) 
                ? " Player pool is full." 
                : " Registration deadline has passed."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Tournament Details - Single Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            {tournament.name}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive">🏆 Auction Tournament</Badge>
            <Badge variant="secondary">
              {tournament.status ? tournament.status.replace(/_/g, ' ') : 'Unknown Status'}
            </Badge>
            <Badge variant="outline">{tournament.format}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium">Start Date</div>
                <div className="text-muted-foreground">{new Date(tournament.startDate).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">Venue</div>
                <div className="text-muted-foreground">{tournament.venue}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-600" />
              <div>
                <div className="font-medium">Prize Pool</div>
                <div className="text-muted-foreground">₹{tournament.totalPrizePool}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <div className="font-medium">Teams</div>
                <div className="text-muted-foreground">{tournament.auctionTeamCount} teams</div>
              </div>
            </div>
          </div>
          
          {/* Additional tournament details */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{tournament.playerEntryFee}</div>
              <div className="text-sm text-muted-foreground">Player Entry Fee</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">₹{tournament.teamEntryFee}</div>
              <div className="text-sm text-muted-foreground">Team Owner Fee</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{tournament._count?.auctionPlayers || 0}/{tournament.playerPoolSize || 100}</div>
              <div className="text-sm text-muted-foreground">Registered Players</div>
            </div>
          </div>
          
          {tournament.registrationDeadline && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Registration Deadline:</strong> {new Date(tournament.registrationDeadline).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">{/* Auction Tournament Registration section content */}
        {errors.length > 0 && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={registrationType} onValueChange={(value) => setRegistrationType(value as 'player' | 'owner')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="player" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Player Registration
            </TabsTrigger>
            <TabsTrigger value="owner" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Team Owner Registration
            </TabsTrigger>
          </TabsList>

          {/* Player Registration Tab */}
          <TabsContent value="player" className="space-y-6 mt-6">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Register as a player to enter the auction pool. Team owners will bid for you during the auction.
                Current Players: {tournament._count?.auctionPlayers || 0}/{tournament.playerPoolSize || 100}
              </AlertDescription>
            </Alert>

            <form onSubmit={(e) => { e.preventDefault(); submitPlayerRegistration(); }} className="space-y-6">
              {/* Player Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Player Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Label htmlFor="playerName">Player Name *</Label>
                    <Input
                      id="playerName"
                      value={playerData.name}
                      onChange={(e) => {
                        setPlayerData(prev => ({ ...prev, name: e.target.value }))
                        if (e.target.value.length >= 2) {
                          searchPlayers(e.target.value)
                        } else {
                          setShowResults(false)
                          setShowNoResults(false)
                        }
                      }}
                      placeholder="Enter your full name"
                      required
                    />
                    
                    {/* Search Results */}
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((result, idx) => (
                          <div
                            key={result.id || idx}
                            className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => selectPlayer(result)}
                          >
                            <div className="font-medium">{result.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.position} • {result.city} • Age {result.age}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="playerAge">Age *</Label>
                      <Input
                        id="playerAge"
                        type="number"
                        value={playerData.age || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || value === '0') {
                            setPlayerData(prev => ({ ...prev, age: 0 }))
                          } else {
                            const numValue = parseInt(value, 10)
                            if (!isNaN(numValue) && numValue >= 0) {
                              setPlayerData(prev => ({ ...prev, age: numValue }))
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value, 10)
                          if (isNaN(value) || value < 16) {
                            setPlayerData(prev => ({ ...prev, age: 18 }))
                          }
                        }}
                        min="16"
                        max="60"
                        placeholder="Enter age (16-60)"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="playerCity">Village/City *</Label>
                      <Input
                        id="playerCity"
                        value={playerData.city}
                        onChange={(e) => setPlayerData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Your city"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="playerPhone">Phone *</Label>
                      <Input
                        id="playerPhone"
                        value={playerData.phone}
                        onChange={(e) => {
                          setPlayerData(prev => ({ ...prev, phone: e.target.value }))
                          // Trigger duplicate check when phone changes and we have name and email
                          if (e.target.value && playerData.name && playerData.email) {
                            checkForDuplicates(playerData.name, e.target.value, playerData.email)
                          }
                        }}
                        placeholder="Your phone number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="playerEmail">Email *</Label>
                      <Input
                        id="playerEmail"
                        type="email"
                        value={playerData.email}
                        onChange={(e) => {
                          setPlayerData(prev => ({ ...prev, email: e.target.value }))
                          // Trigger duplicate check when email changes and we have name and phone
                          if (e.target.value && playerData.name && playerData.phone) {
                            checkForDuplicates(playerData.name, playerData.phone, e.target.value)
                          }
                        }}
                        placeholder="Your email address"
                        required
                      />
                    </div>
                  </div>

                  {/* Additional Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="playerAddress">Address</Label>
                      <Textarea
                        id="playerAddress"
                        value={playerData.address}
                        onChange={(e) => setPlayerData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Your complete address"
                        rows={3}
                        className="resize-y"
                      />
                    </div>
                    <div>
                      <Label htmlFor="playerDateOfBirth">Date of Birth</Label>
                      <DatePicker
                        date={playerData.dateOfBirth ? new Date(playerData.dateOfBirth) : undefined}
                        onDateChange={(date) => 
                          setPlayerData(prev => ({ 
                            ...prev, 
                            dateOfBirth: date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '' 
                          }))
                        }
                        placeholder="Select date of birth"
                      />
                    </div>
                    <div>
                      <Label htmlFor="playerFatherName">Father's Name</Label>
                      <Input
                        id="playerFatherName"
                        value={playerData.fatherName}
                        onChange={(e) => setPlayerData(prev => ({ ...prev, fatherName: e.target.value }))}
                        placeholder="Father's full name"
                      />
                    </div>
                    <div>
                      <Label>Profile Photo</Label>
                      <div className="space-y-3">
                        {photoPreview || playerData.profileImageUrl ? (
                          <div className="relative inline-block">
                            <img 
                              src={photoPreview || playerData.profileImageUrl} 
                              alt="Profile preview" 
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={() => {
                                setPhotoPreview(null)
                                setPlayerData(prev => ({ ...prev, profileImageUrl: '' }))
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Upload profile photo</p>
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handlePhotoUpload(file)
                          }}
                          disabled={photoUploading}
                          className="text-sm"
                        />
                        {photoUploading && (
                          <p className="text-sm text-blue-600">Uploading photo...</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact Information */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-4">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="emergencyContact">Contact Name</Label>
                        <Input
                          id="emergencyContact"
                          value={playerData.emergencyContact}
                          onChange={(e) => setPlayerData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                          placeholder="Emergency contact name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyPhone">Contact Phone</Label>
                        <Input
                          id="emergencyPhone"
                          value={playerData.emergencyPhone}
                          onChange={(e) => setPlayerData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                          placeholder="Emergency contact phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyRelation">Relation</Label>
                        <Select
                          value={playerData.emergencyRelation}
                          onValueChange={(value) => setPlayerData(prev => ({ ...prev, emergencyRelation: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select relation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Brother">Brother</SelectItem>
                            <SelectItem value="Sister">Sister</SelectItem>
                            <SelectItem value="Spouse">Spouse</SelectItem>
                            <SelectItem value="Friend">Friend</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Position *</Label>
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
                          <SelectItem value="ALL_ROUNDER">All Rounder</SelectItem>
                          <SelectItem value="WICKET_KEEPER">Wicket Keeper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Batting Style</Label>
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
                      <Label>Experience *</Label>
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
                  </div>

                  {/* Duplicate Check Status */}
                  {isDuplicateChecking && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Checking for existing registration...
                    </div>
                  )}
                  
                  {duplicateFound && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {duplicateMessage}
                      </AlertDescription>
                    </Alert>
                  )}
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
                <CardContent className="space-y-4">
                  <div>
                    <Label>Player Entry Fee: ₹{playerData.paymentAmount}</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select
                      value={playerData.paymentMethod}
                      onValueChange={(value) => setPlayerData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="ONLINE">Online Banking</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Details */}
                  {playerData.paymentMethod === 'UPI' && (
                    <PaymentDetailsSection 
                      paymentSettings={paymentSettings} 
                      amount={playerData.paymentAmount} 
                    />
                  )}
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Terms and Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto border rounded p-4 bg-muted/20">
                    {TERMS_AND_CONDITIONS.map((term, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">{index + 1}.</span>
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="terms-player"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    />
                    <Label htmlFor="terms-player" className="text-sm">
                      I have read and agree to all the terms and conditions mentioned above *
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={submitting || !termsAccepted || duplicateFound || isDuplicateChecking}
                  className="min-w-[200px]"
                >
                  {submitting ? 'Registering...' : 
                   isDuplicateChecking ? 'Checking...' :
                   duplicateFound ? 'Cannot Register (Duplicate)' :
                   `Register as Player (₹${playerData.paymentAmount})`}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Team Owner Registration Tab */}
          <TabsContent value="owner" className="space-y-6 mt-6">
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                Register as a team owner to participate in the auction and build your team by bidding for players.
              </AlertDescription>
            </Alert>

            <form onSubmit={(e) => { e.preventDefault(); submitOwnerRegistration(); }} className="space-y-6">
              {/* Owner Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Team Owner Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ownerName">Owner Name *</Label>
                      <Input
                        id="ownerName"
                        value={ownerData.ownerName}
                        onChange={(e) => setOwnerData(prev => ({ ...prev, ownerName: e.target.value }))}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerAge">Age *</Label>
                      <Input
                        id="ownerAge"
                        type="number"
                        value={ownerData.ownerAge || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || value === '0') {
                            setOwnerData(prev => ({ ...prev, ownerAge: 0 }))
                          } else {
                            const numValue = parseInt(value, 10)
                            if (!isNaN(numValue) && numValue >= 0) {
                              setOwnerData(prev => ({ ...prev, ownerAge: numValue }))
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value, 10)
                          if (isNaN(value) || value < 18) {
                            setOwnerData(prev => ({ ...prev, ownerAge: 18 }))
                          }
                        }}
                        min="18"
                        max="70"
                        placeholder="Enter age (18-70)"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerPhone">Phone *</Label>
                      <Input
                        id="ownerPhone"
                        value={ownerData.ownerPhone}
                        onChange={(e) => setOwnerData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                        placeholder="Your phone number"
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
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerCity">Village/City</Label>
                      <Input
                        id="ownerCity"
                        value={ownerData.ownerCity}
                        onChange={(e) => setOwnerData(prev => ({ ...prev, ownerCity: e.target.value }))}
                        placeholder="Your city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamName">Team Name *</Label>
                      <Input
                        id="teamName"
                        value={ownerData.teamName}
                        onChange={(e) => setOwnerData(prev => ({ ...prev, teamName: e.target.value }))}
                        placeholder="Choose your team name"
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
                <CardContent className="space-y-4">
                  <div>
                    <Label>Team Owner Entry Fee: ₹{ownerData.paymentAmount}</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="ownerPaymentMethod">Payment Method *</Label>
                    <Select
                      value={ownerData.paymentMethod}
                      onValueChange={(value) => setOwnerData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="ONLINE">Online Banking</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Details for Owner */}
                  {ownerData.paymentMethod === 'UPI' && (
                    <PaymentDetailsSection 
                      paymentSettings={paymentSettings} 
                      amount={ownerData.paymentAmount} 
                    />
                  )}
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Terms and Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto border rounded p-4 bg-muted/20">
                    {TERMS_AND_CONDITIONS.map((term, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">{index + 1}.</span>
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="terms-owner"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    />
                    <Label htmlFor="terms-owner" className="text-sm">
                      I have read and agree to all the terms and conditions mentioned above *
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={submitting || !termsAccepted}
                  className="min-w-[200px]"
                >
                  {submitting ? 'Registering...' : `Register as Team Owner (₹${ownerData.paymentAmount})`}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Users, Phone, Mail, Calendar, MapPin, Trophy, DollarSign, AlertCircle, Crown, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'

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

interface PlayerData {
  name: string
  age: number
  phone: string
  email: string
  city: string
  position: string
  battingStyle: string
  bowlingStyle: string
  experience: string
}

interface TeamRegistrationData {
  teamName: string
  captainName: string
  captainPhone: string
  captainEmail: string
  captainAge: number
  homeGround: string
  city: string
  foundedYear: number
  teamColor: string
  players: PlayerData[]
  paymentMethod: string
  paymentAmount: number
  specialRequests: string
  emergencyContact: string
  emergencyPhone: string
  agreeToTerms: boolean
  availableDays: string[]
  preferredTimeSlot: string
}

interface PaymentSettings {
  upiId: string;
  upiMobile: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  qrCodeUrl: string | null;
}

interface LeagueRegistrationProps {
  tournament: Tournament
}

export default function LeagueRegistration({ tournament }: LeagueRegistrationProps) {
  const router = useRouter()
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [formData, setFormData] = useState<TeamRegistrationData>({
    teamName: '',
    captainName: '',
    captainPhone: '',
    captainEmail: '',
    captainAge: 18,
    homeGround: '',
    city: '',
    foundedYear: new Date().getFullYear(),
    teamColor: '',
    players: [],
    paymentMethod: 'UPI',
    paymentAmount: tournament.entryFee,
    specialRequests: '',
    emergencyContact: '',
    emergencyPhone: '',
    agreeToTerms: false,
    availableDays: [],
    preferredTimeSlot: 'MORNING'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchPaymentSettings()
  }, [])

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/admin/payment-settings')
      if (response.ok) {
        const data = await response.json()
        setPaymentSettings(data)
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error)
    }
  }

  const addPlayer = () => {
    if (formData.players.length < tournament.teamSize + tournament.substitutes) {
      setFormData(prev => ({
        ...prev,
        players: [...prev.players, {
          name: '',
          age: 18,
          phone: '',
          email: '',
          city: '',
          position: 'BATSMAN',
          battingStyle: 'RIGHT_HANDED',
          bowlingStyle: 'RIGHT_ARM_FAST',
          experience: 'INTERMEDIATE'
        }]
      }))
    }
  }

  const removePlayer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }))
  }

  const updatePlayer = (index: number, field: keyof PlayerData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }))
  }

  const toggleAvailableDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Team validation
    if (!formData.teamName.trim()) newErrors.teamName = 'Team name is required'
    if (!formData.captainName.trim()) newErrors.captainName = 'Captain name is required'
    if (!formData.captainPhone.trim()) newErrors.captainPhone = 'Captain phone is required'
    if (!formData.captainEmail.trim()) newErrors.captainEmail = 'Captain email is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Emergency contact is required'
    if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = 'Emergency phone is required'

    // Players validation
    if (formData.players.length < tournament.teamSize) {
      newErrors.players = `Minimum ${tournament.teamSize} players required`
    }

    // League-specific validation
    if (formData.availableDays.length === 0) {
      newErrors.availableDays = 'Please select at least one available day'
    }

    // Validate each player
    formData.players.forEach((player, index) => {
      if (!player.name.trim()) newErrors[`player_${index}_name`] = 'Player name is required'
      if (!player.phone.trim()) newErrors[`player_${index}_phone`] = 'Player phone is required'
      if (!player.city.trim()) newErrors[`player_${index}_city`] = 'Player city is required'
    })

    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const registrationData = {
        tournamentId: tournament.id,
        registrationType: 'PUBLIC',
        teamData: {
          name: formData.teamName,
          captainName: formData.captainName,
          captainPhone: formData.captainPhone,
          captainEmail: formData.captainEmail,
          captainAge: formData.captainAge,
          homeGround: formData.homeGround,
          city: formData.city,
          foundedYear: formData.foundedYear,
          teamColor: formData.teamColor,
        },
        players: formData.players,
        paymentData: {
          method: formData.paymentMethod,
          amount: formData.paymentAmount,
        },
        additionalInfo: {
          specialRequests: formData.specialRequests,
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone,
          availableDays: formData.availableDays,
          preferredTimeSlot: formData.preferredTimeSlot,
        }
      }

      const response = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Registration Successful!",
          description: `Team "${formData.teamName}" has been registered for ${tournament.name}.`
        })
        router.push(`/registration-success?id=${result.id}`)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const registrationStatus = (tournament._count?.registrations || 0) >= tournament.maxTeams ? 'FULL' : 
                           new Date() > new Date(tournament.registrationDeadline) ? 'CLOSED' : 'OPEN'

  if (registrationStatus !== 'OPEN') {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {registrationStatus === 'FULL' 
                ? 'Registration is full. All available spots have been taken.'
                : 'Registration deadline has passed.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const weekdays = [
    { key: 'MONDAY', label: 'Monday' },
    { key: 'TUESDAY', label: 'Tuesday' },
    { key: 'WEDNESDAY', label: 'Wednesday' },
    { key: 'THURSDAY', label: 'Thursday' },
    { key: 'FRIDAY', label: 'Friday' },
    { key: 'SATURDAY', label: 'Saturday' },
    { key: 'SUNDAY', label: 'Sunday' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Team Registration - League Tournament
        </CardTitle>
        <CardDescription>
          Register your team for this league tournament. Your team will play multiple matches over the course of the league.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Team Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  value={formData.teamName}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                  placeholder="Enter team name"
                  className={errors.teamName ? 'border-red-500' : ''}
                />
                {errors.teamName && <p className="text-red-500 text-sm mt-1">{errors.teamName}</p>}
              </div>
              
              <div>
                <Label htmlFor="city">City/Village *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city/village"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              
              <div>
                <Label htmlFor="homeGround">Home Ground</Label>
                <Input
                  id="homeGround"
                  value={formData.homeGround}
                  onChange={(e) => setFormData(prev => ({ ...prev, homeGround: e.target.value }))}
                  placeholder="Home ground name (optional)"
                />
              </div>
              
              <div>
                <Label htmlFor="foundedYear">Founded Year</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.foundedYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, foundedYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                  placeholder="Team founded year"
                />
              </div>
              
              <div>
                <Label htmlFor="teamColor">Team Color</Label>
                <Input
                  id="teamColor"
                  value={formData.teamColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamColor: e.target.value }))}
                  placeholder="Primary team color (optional)"
                />
              </div>
            </div>
          </div>

          {/* Captain Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Captain Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="captainName">Captain Name *</Label>
                <Input
                  id="captainName"
                  value={formData.captainName}
                  onChange={(e) => setFormData(prev => ({ ...prev, captainName: e.target.value }))}
                  placeholder="Enter captain name"
                  className={errors.captainName ? 'border-red-500' : ''}
                />
                {errors.captainName && <p className="text-red-500 text-sm mt-1">{errors.captainName}</p>}
              </div>
              
              <div>
                <Label htmlFor="captainAge">Captain Age *</Label>
                <Input
                  id="captainAge"
                  type="number"
                  min="16"
                  max="60"
                  value={formData.captainAge}
                  onChange={(e) => setFormData(prev => ({ ...prev, captainAge: parseInt(e.target.value) || 18 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="captainPhone">Captain Phone *</Label>
                <Input
                  id="captainPhone"
                  value={formData.captainPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, captainPhone: e.target.value }))}
                  placeholder="Enter phone number"
                  className={errors.captainPhone ? 'border-red-500' : ''}
                />
                {errors.captainPhone && <p className="text-red-500 text-sm mt-1">{errors.captainPhone}</p>}
              </div>
              
              <div>
                <Label htmlFor="captainEmail">Captain Email *</Label>
                <Input
                  id="captainEmail"
                  type="email"
                  value={formData.captainEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, captainEmail: e.target.value }))}
                  placeholder="Enter email address"
                  className={errors.captainEmail ? 'border-red-500' : ''}
                />
                {errors.captainEmail && <p className="text-red-500 text-sm mt-1">{errors.captainEmail}</p>}
              </div>
            </div>
          </div>

          {/* League Schedule Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule Preferences
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label>Available Days *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {weekdays.map((day) => (
                    <div key={day.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.key}
                        checked={formData.availableDays.includes(day.key)}
                        onCheckedChange={() => toggleAvailableDay(day.key)}
                      />
                      <Label htmlFor={day.key} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.availableDays && <p className="text-red-500 text-sm mt-1">{errors.availableDays}</p>}
              </div>
              
              <div>
                <Label htmlFor="preferredTimeSlot">Preferred Time Slot</Label>
                <Select
                  value={formData.preferredTimeSlot}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, preferredTimeSlot: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">Morning (9:00 AM - 12:00 PM)</SelectItem>
                    <SelectItem value="AFTERNOON">Afternoon (1:00 PM - 4:00 PM)</SelectItem>
                    <SelectItem value="EVENING">Evening (5:00 PM - 8:00 PM)</SelectItem>
                    <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({formData.players.length}/{tournament.teamSize + tournament.substitutes})
              </h3>
              <Button
                type="button"
                onClick={addPlayer}
                disabled={formData.players.length >= tournament.teamSize + tournament.substitutes}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>
            
            {errors.players && <p className="text-red-500 text-sm">{errors.players}</p>}
            
            <div className="space-y-4">
              {formData.players.map((player, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Player {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePlayer(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={player.name}
                        onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                        placeholder="Player name"
                        className={errors[`player_${index}_name`] ? 'border-red-500' : ''}
                      />
                      {errors[`player_${index}_name`] && 
                        <p className="text-red-500 text-sm mt-1">{errors[`player_${index}_name`]}</p>
                      }
                    </div>
                    
                    <div>
                      <Label>Age *</Label>
                      <Input
                        type="number"
                        min="16"
                        max="60"
                        value={player.age}
                        onChange={(e) => updatePlayer(index, 'age', parseInt(e.target.value) || 18)}
                      />
                    </div>
                    
                    <div>
                      <Label>Phone *</Label>
                      <Input
                        value={player.phone}
                        onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                        placeholder="Phone number"
                        className={errors[`player_${index}_phone`] ? 'border-red-500' : ''}
                      />
                      {errors[`player_${index}_phone`] && 
                        <p className="text-red-500 text-sm mt-1">{errors[`player_${index}_phone`]}</p>
                      }
                    </div>
                    
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={player.email}
                        onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                        placeholder="Email (optional)"
                      />
                    </div>
                    
                    <div>
                      <Label>City *</Label>
                      <Input
                        value={player.city}
                        onChange={(e) => updatePlayer(index, 'city', e.target.value)}
                        placeholder="City/Village"
                        className={errors[`player_${index}_city`] ? 'border-red-500' : ''}
                      />
                      {errors[`player_${index}_city`] && 
                        <p className="text-red-500 text-sm mt-1">{errors[`player_${index}_city`]}</p>
                      }
                    </div>
                    
                    <div>
                      <Label>Position</Label>
                      <Select
                        value={player.position}
                        onValueChange={(value) => updatePlayer(index, 'position', value)}
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
                        value={player.battingStyle}
                        onValueChange={(value) => updatePlayer(index, 'battingStyle', value)}
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
                      <Label>Experience</Label>
                      <Select
                        value={player.experience}
                        onValueChange={(value) => updatePlayer(index, 'experience', value)}
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
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Entry Fee</Label>
                <div className="text-2xl font-bold text-primary">₹{tournament.entryFee}</div>
              </div>
              
              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {paymentSettings && formData.paymentMethod !== 'CASH' && (
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Payment Details</h4>
                {formData.paymentMethod === 'UPI' && (
                  <div className="space-y-2">
                    <p><strong>UPI ID:</strong> {paymentSettings.upiId}</p>
                    <p><strong>Mobile:</strong> {paymentSettings.upiMobile}</p>
                  </div>
                )}
                {formData.paymentMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-2">
                    <p><strong>Account Name:</strong> {paymentSettings.bankAccountName}</p>
                    <p><strong>Account Number:</strong> {paymentSettings.bankAccountNumber}</p>
                    <p><strong>Bank:</strong> {paymentSettings.bankName}</p>
                    <p><strong>IFSC:</strong> {paymentSettings.ifscCode}</p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  placeholder="Emergency contact person"
                  className={errors.emergencyContact ? 'border-red-500' : ''}
                />
                {errors.emergencyContact && <p className="text-red-500 text-sm mt-1">{errors.emergencyContact}</p>}
              </div>
              
              <div>
                <Label htmlFor="emergencyPhone">Emergency Phone *</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                  placeholder="Emergency phone number"
                  className={errors.emergencyPhone ? 'border-red-500' : ''}
                />
                {errors.emergencyPhone && <p className="text-red-500 text-sm mt-1">{errors.emergencyPhone}</p>}
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="Any special requirements or requests..."
                rows={3}
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
              />
              <Label htmlFor="agreeToTerms" className={errors.agreeToTerms ? 'text-red-500' : ''}>
                I agree to the tournament terms and conditions *
              </Label>
            </div>
            {errors.agreeToTerms && <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : `Register Team - ₹${tournament.entryFee}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

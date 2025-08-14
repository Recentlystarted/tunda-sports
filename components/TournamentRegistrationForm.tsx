"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Save, Send } from 'lucide-react';

interface TournamentRegistrationFormProps {
  tournamentId: string;
  mode?: 'create' | 'edit';
  registrationId?: string;
}

interface PlayerData {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  position?: string;
  contact?: string;
  experience?: string;
}

interface FormData {
  tournamentId: string;
  teamName: string;
  captainName: string;
  captainAge: number;
  captainGender: 'MALE' | 'FEMALE';
  contactNumber: string;
  email: string;
  alternateContact?: string;
  teamPlayers: PlayerData[];
  emergencyContact: string;
  emergencyContactNumber: string;
  medicalInfo?: string;
  paymentMethod: string;
  specialRequirements?: string;
  agreedToTerms: boolean;
}

export default function TournamentRegistrationForm({ 
  tournamentId, 
  mode = 'create',
  registrationId 
}: TournamentRegistrationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tournament, setTournament] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    tournamentId,
    teamName: '',
    captainName: '',
    captainAge: 18,
    captainGender: 'MALE',
    contactNumber: '',
    email: '',
    alternateContact: '',
    teamPlayers: [{ name: '', age: 18, gender: 'MALE', position: '', contact: '', experience: '' }],
    emergencyContact: '',
    emergencyContactNumber: '',
    medicalInfo: '',
    paymentMethod: '',
    specialRequirements: '',
    agreedToTerms: false
  });

  useEffect(() => {
    fetchTournamentData();
    if (mode === 'edit' && registrationId) {
      fetchRegistrationData();
    }
  }, [tournamentId, registrationId, mode]);

  const fetchTournamentData = async () => {
    try {
      const [tournamentRes, paymentRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/payment-methods`)
      ]);

      if (!tournamentRes.ok || !paymentRes.ok) {
        throw new Error('Failed to fetch tournament data');
      }

      const tournamentData = await tournamentRes.json();
      const paymentData = await paymentRes.json();

      setTournament(tournamentData);
      setPaymentMethods(paymentData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tournament information",
        variant: "destructive"
      });
    }
  };

  const fetchRegistrationData = async () => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`);
      if (!response.ok) throw new Error('Failed to fetch registration data');

      const data = await response.json();
      setFormData({
        ...data,
        teamPlayers: data.teamPlayers || [{ name: '', age: 18, gender: 'MALE', position: '', contact: '', experience: '' }]
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load registration data",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPlayer = () => {
    if (tournament?.maxPlayers && formData.teamPlayers.length >= tournament.maxPlayers) {
      toast({
        title: "Maximum Players Reached",
        description: `Maximum ${tournament.maxPlayers} players allowed`,
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      teamPlayers: [...prev.teamPlayers, { name: '', age: 18, gender: 'MALE', position: '', contact: '', experience: '' }]
    }));
  };

  const removePlayer = (index: number) => {
    if (formData.teamPlayers.length === 1) {
      toast({
        title: "Minimum Players Required",
        description: "At least one player is required",
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      teamPlayers: prev.teamPlayers.filter((_, i) => i !== index)
    }));
  };

  const updatePlayer = (index: number, field: keyof PlayerData, value: any) => {
    setFormData(prev => ({
      ...prev,
      teamPlayers: prev.teamPlayers.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.teamName.trim()) errors.push('Team name is required');
    if (!formData.captainName.trim()) errors.push('Captain name is required');
    if (!formData.contactNumber.trim()) errors.push('Contact number is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.paymentMethod) errors.push('Payment method is required');
    if (!formData.agreedToTerms) errors.push('You must agree to terms and conditions');

    // Validate players
    formData.teamPlayers.forEach((player, index) => {
      if (!player.name.trim()) {
        errors.push(`Player ${index + 1} name is required`);
      }
      if (player.age < 10 || player.age > 100) {
        errors.push(`Player ${index + 1} age must be between 10 and 100`);
      }
    });

    return errors;
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft) {
      const errors = validateForm();
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors[0],
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      const url = mode === 'edit' 
        ? `/api/registrations/${registrationId}`
        : `/api/tournaments/${tournamentId}/register`;
      
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? 'DRAFT' : 'PENDING'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit registration');
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: isDraft 
          ? "Registration saved as draft" 
          : "Registration submitted successfully!",
      });

      if (!isDraft) {
        router.push(`/tournament/${tournamentId}/register/success`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {mode === 'edit' ? 'Edit Registration' : 'Tournament Registration'}
            </CardTitle>
            <p className="text-gray-600">
              Register your team for {tournament.name}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Team Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamName">Team Name *</Label>
                  <Input
                    id="teamName"
                    value={formData.teamName}
                    onChange={(e) => handleInputChange('teamName', e.target.value)}
                    placeholder="Enter team name"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name} - {method.details}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Captain Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Captain Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="captainName">Captain Name *</Label>
                  <Input
                    id="captainName"
                    value={formData.captainName}
                    onChange={(e) => handleInputChange('captainName', e.target.value)}
                    placeholder="Captain's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="captainAge">Captain Age *</Label>
                  <Input
                    id="captainAge"
                    type="number"
                    min="16"
                    max="100"
                    value={formData.captainAge}
                    onChange={(e) => handleInputChange('captainAge', parseInt(e.target.value) || 18)}
                  />
                </div>
                <div>
                  <Label htmlFor="captainGender">Captain Gender *</Label>
                  <Select 
                    value={formData.captainGender} 
                    onValueChange={(value) => handleInputChange('captainGender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="captain@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Team Players */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Team Players</h3>
                <Button type="button" onClick={addPlayer} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </div>
              {formData.teamPlayers.map((player, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Player {index + 1}</h4>
                    {formData.teamPlayers.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removePlayer(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Player Name"
                      value={player.name}
                      onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Age"
                      min="10"
                      max="100"
                      value={player.age}
                      onChange={(e) => updatePlayer(index, 'age', parseInt(e.target.value) || 18)}
                    />
                    <Select 
                      value={player.gender} 
                      onValueChange={(value) => updatePlayer(index, 'gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Position (optional)"
                      value={player.position || ''}
                      onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                    />
                    <Input
                      placeholder="Contact (optional)"
                      value={player.contact || ''}
                      onChange={(e) => updatePlayer(index, 'contact', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactNumber">Emergency Contact Number</Label>
                  <Input
                    id="emergencyContactNumber"
                    value={formData.emergencyContactNumber}
                    onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div>
                <Label htmlFor="medicalInfo">Medical Information (Optional)</Label>
                <Textarea
                  id="medicalInfo"
                  value={formData.medicalInfo || ''}
                  onChange={(e) => handleInputChange('medicalInfo', e.target.value)}
                  placeholder="Any medical conditions, allergies, or special requirements for team members..."
                />
              </div>
              <div>
                <Label htmlFor="specialRequirements">Special Requirements (Optional)</Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements || ''}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  placeholder="Any special requirements or requests..."
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Registration Fee:</strong> ₹{tournament.entryFee || 0}
                  <br />
                  <strong>Tournament Date:</strong> {new Date(tournament.startDate).toLocaleDateString()}
                  <br />
                  <strong>Venue:</strong> {tournament.venue}
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="agreedToTerms" className="text-sm">
                  I agree to the tournament terms and conditions, and acknowledge that all information provided is accurate. *
                </Label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="button"
                onClick={() => handleSubmit(true)}
                variant="outline"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button 
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

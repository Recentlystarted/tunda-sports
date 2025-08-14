"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar, Plus, Upload, X, Camera } from "lucide-react";
import Image from "next/image";

interface Team {
  id: string;
  name: string;
}

export default function CreatePlayerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    dateOfBirth: string;
    position: string | undefined;
    age: string;
    fatherName: string;
    emergencyContact: string;
    emergencyPhone: string;
    jerseyNumber: string;
    isSubstitute: boolean;
    experience: string | undefined;
    isActive: boolean;
    teamId: string;
    profileImageUrl: string;
  }>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    dateOfBirth: "",
    position: undefined,
    age: "",
    fatherName: "",
    emergencyContact: "",
    emergencyPhone: "",
    jerseyNumber: "",
    isSubstitute: false,
    experience: undefined,
    isActive: true,
    teamId: "none",
    profileImageUrl: ""
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const teams = await response.json();
        // Transform the teams data to extract just id and name
        const simplifiedTeams = teams.map((team: any) => ({
          id: team.id,
          name: team.name
        }));
        setTeams(simplifiedTeams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Photo size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please select a valid image file (JPG, PNG, or WebP)",
          variant: "destructive",
        });
        return;
      }

      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return null;
    
    setUploadingPhoto(true);
    try {
      const photoFormData = new FormData();
      photoFormData.append('file', selectedPhoto);
      photoFormData.append('category', 'PLAYERS');
      photoFormData.append('title', `Player Photo - ${formData.name || 'New Player'}`);
      photoFormData.append('description', `Profile photo for ${formData.name || 'player'}`);
      
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: photoFormData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }
      
      const result = await response.json();
      return result.publicUrl || result.url;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const clearPhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview("");
    setFormData(prev => ({ ...prev, profileImageUrl: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload photo first if selected
      let profileImageUrl = formData.profileImageUrl;
      if (selectedPhoto) {
        const uploadedPhotoUrl = await handlePhotoUpload();
        if (uploadedPhotoUrl) {
          profileImageUrl = uploadedPhotoUrl;
        }
      }

      const createData = {
        ...formData,
        profileImageUrl,
        age: formData.age ? parseInt(formData.age) : null,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : null,
        dateOfBirth: formData.dateOfBirth || null,
        teamId: formData.teamId && formData.teamId !== "none" ? formData.teamId : null
      };

      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      if (!response.ok) {
        throw new Error('Failed to create player');
      }

      toast({
        title: "Success",
        description: "Player created successfully",
      });

      router.push('/admin/players');
    } catch (error) {
      console.error('Error creating player:', error);
      toast({
        title: "Error",
        description: "Failed to create player",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Logo */}
      <div className="flex items-center space-x-4">
        <Image
          src="/logo.PNG"
          alt="Tunda Sports Club"
          width={60}
          height={60}
          className="rounded-lg"
        />
        <div>
          <h1 className="text-3xl font-bold">Add New Player</h1>
          <p className="text-muted-foreground">Create a new player profile</p>
        </div>
      </div>

      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push('/admin/players')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Players
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Player Photo
              </CardTitle>
              <CardDescription>
                Upload a profile photo for the player (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!photoPreview ? (
                <div>
                  <Label htmlFor="photo">Upload Photo</Label>
                  <div className="mt-2">
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('photo')?.click()}
                      className="w-full h-32 border-dashed border-2 flex flex-col items-center justify-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload photo
                      </span>
                      <span className="text-xs text-muted-foreground">
                        JPG, PNG, WebP (Max 5MB)
                      </span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Player photo preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={clearPhoto}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('photo')?.click()}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Basic player details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter player's full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="fatherName">Father's Name</Label>
                <Input
                  id="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  placeholder="Enter father's name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="Age"
                    min="15"
                    max="50"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <DatePicker
                    date={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                    onDateChange={(date) => {
                      handleInputChange('dateOfBirth', date ? date.toISOString().split('T')[0] : '');
                    }}
                    placeholder="Select date of birth"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Contact details and location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="player@email.com"
                />
              </div>

              <div>
                <Label htmlFor="city">City/Village</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city or village"
                />
              </div>

              <div>
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cricket Information */}
          <Card>
            <CardHeader>
              <CardTitle>Cricket Details</CardTitle>
              <CardDescription>
                Playing position, experience, and team information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="position">Playing Position</Label>
                <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
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
                <Label htmlFor="experience">Experience Level</Label>
                <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
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

              <div>
                <Label htmlFor="jerseyNumber">Jersey Number</Label>
                <Input
                  id="jerseyNumber"
                  type="number"
                  value={formData.jerseyNumber}
                  onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
                  placeholder="Enter jersey number"
                  min="1"
                  max="99"
                />
              </div>

              <div>
                <Label htmlFor="team">Team</Label>
                <Select value={formData.teamId} onValueChange={(value) => handleInputChange('teamId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isSubstitute"
                  checked={formData.isSubstitute}
                  onCheckedChange={(checked) => handleInputChange('isSubstitute', checked)}
                />
                <Label htmlFor="isSubstitute">Substitute Player</Label>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Emergency Contact
              </CardTitle>
              <CardDescription>
                Emergency contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <Label htmlFor="emergencyPhone">Emergency Phone Number</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/players')}
            disabled={saving || uploadingPhoto}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || uploadingPhoto}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {uploadingPhoto ? 'Uploading Photo...' : 'Creating Player...'}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Player
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

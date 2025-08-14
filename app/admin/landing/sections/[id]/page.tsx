"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Plus, Edit, Trash2, Image, Upload, Eye, Save, X, 
  Users, Camera, Star, Calendar, Mail, Phone, ExternalLink,
  Facebook, Twitter, Linkedin, Globe, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import SectionImageManager from "@/components/SectionImageManager";
import ProfileImageUpload from "@/components/ProfileImageUpload";

interface LandingPageSection {
  id: string;
  sectionType: string;
  title: string;
  subtitle?: string;
  content?: string;
  isActive: boolean;
  sortOrder: number;
  bgColor?: string;
  textColor?: string;
  bannerImage?: string;
  backgroundImage?: string;
  people: Person[];
  images: SectionImage[];
}

interface Person {
  id: string;
  name: string;
  role: string;
  designation?: string;
  bio?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  department?: string;
  joinDate?: string;
  isActive: boolean;
  sortOrder: number;
  showOnLanding: boolean;
  showContact: boolean;
}

interface SectionImage {
  id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  altText?: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

export default function SectionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [section, setSection] = useState<LandingPageSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSection();
  }, [params.id]);

  const fetchSection = async () => {
    try {
      const response = await fetch(`/api/landing/sections/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSection(data.section);
      } else {
        throw new Error("Section not found");
      }
    } catch (error) {
      console.error("Error fetching section:", error);
      toast({
        title: "Error",
        description: "Failed to fetch section",
        variant: "destructive",
      });
      router.push("/admin/landing-content");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async (formData: any) => {
    try {
      const response = await fetch("/api/landing/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, sectionId: section?.id }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Person added successfully",
        });
        setIsPersonDialogOpen(false);
        fetchSection();
      } else {
        throw new Error("Failed to create person");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add person",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePerson = async (personId: string, formData: any) => {
    try {
      const response = await fetch(`/api/landing/people/${personId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Person updated successfully",
        });
        setIsPersonDialogOpen(false);
        setSelectedPerson(null);
        fetchSection();
      } else {
        throw new Error("Failed to update person");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update person",
        variant: "destructive",
      });
    }
  };

  const handleDeletePerson = async (personId: string) => {
    try {
      const response = await fetch(`/api/landing/people/${personId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Person deleted successfully",
        });
        fetchSection();
      } else {
        throw new Error("Failed to delete person");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete person",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="p-3 md:p-6">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4">Section Not Found</h1>
          <Button onClick={() => router.push("/admin/landing-content")} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <Button variant="outline" onClick={() => router.push("/admin/landing-content")} size="sm" className="h-9">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Back to Sections</span>
          <span className="sm:hidden">Back</span>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">{section.title}</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm lg:text-base">
            Manage content, images, and team members for this section
          </p>
        </div>
        <Badge variant={section.isActive ? "default" : "secondary"} className="shrink-0 h-6">
          {section.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="people" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted">
          <TabsTrigger 
            value="people" 
            className="flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm font-medium data-[state=active]:bg-background"
          >
            <Users className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
            <span className="hidden sm:inline">People ({section.people.length})</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
          <TabsTrigger 
            value="images" 
            className="flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm font-medium data-[state=active]:bg-background"
          >
            <Camera className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
            <span className="hidden sm:inline">Images ({section.images.length})</span>
            <span className="sm:hidden">Media</span>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm font-medium data-[state=active]:bg-background"
          >
            <Settings className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
        </TabsList>

        {/* People Tab */}
        <TabsContent value="people" className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Team Members</h2>
            <Button onClick={() => setIsPersonDialogOpen(true)} size="sm" className="w-full sm:w-auto h-9">
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Person</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            {section.people.map((person) => (
              <Card key={person.id} className="hover:shadow-md transition-all duration-300 border border-border">
                <CardHeader className="pb-2 md:pb-3">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-full flex items-center justify-center shrink-0">
                      {person.profileImage ? (
                        <img
                          src={person.profileImage}
                          alt={person.name}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-4 w-4 md:h-6 md:w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm md:text-lg font-semibold truncate">{person.name}</CardTitle>
                      <CardDescription className="text-xs md:text-sm text-muted-foreground">{person.role}</CardDescription>
                    </div>
                    <Badge 
                      variant={person.isActive ? "default" : "secondary"} 
                      className="shrink-0 text-xs h-5 px-2"
                    >
                      {person.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2 md:space-y-3 pt-0">
                  {person.designation && (
                    <p className="text-xs md:text-sm text-muted-foreground">{person.designation}</p>
                  )}

                  {person.bio && (
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">{person.bio}</p>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1">
                    {person.email && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                        <span className="truncate">{person.email}</span>
                      </div>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                        <span>{person.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-1 md:gap-2">
                    {person.linkedin && (
                      <a href={person.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="p-1 h-6 w-6 md:h-8 md:w-8 md:p-2">
                          <Linkedin className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </a>
                    )}
                    {person.twitter && (
                      <a href={person.twitter} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="p-1 h-6 w-6 md:h-8 md:w-8 md:p-2">
                          <Twitter className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </a>
                    )}
                    {person.facebook && (
                      <a href={person.facebook} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="p-1 h-6 w-6 md:h-8 md:w-8 md:p-2">
                          <Facebook className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Settings */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant={person.showOnLanding ? "default" : "outline"} className="text-xs">
                      {person.showOnLanding ? "On Landing" : "Hidden"}
                    </Badge>
                    <Badge variant={person.showContact ? "default" : "outline"} className="text-xs">
                      {person.showContact ? "Contact Shown" : "Contact Hidden"}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPerson(person);
                        setIsPersonDialogOpen(true);
                      }}
                      className="flex-1 text-xs md:text-sm h-8 md:h-9"
                    >
                      <Edit className="h-3 w-3 mr-1 md:mr-2" />
                      <span>Edit Person</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full sm:w-auto px-3 h-8 md:h-9 text-xs md:text-sm text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1 md:mr-2" />
                          <span>Delete Person</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Person</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {person.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePerson(person.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State for People */}
          {section.people.length === 0 && (
            <Card className="p-8 md:p-12 text-center">
              <Users className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">No people added yet</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Add team members, board members, donors, or other people to this section.
              </p>
              <Button onClick={() => setIsPersonDialogOpen(true)} size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add First Person
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <SectionImageManager
            sectionId={section.id}
            sectionTitle={section.title}
            onImagesUploaded={fetchSection}
            existingImages={section.images}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Settings</CardTitle>
              <CardDescription>
                Configure display settings and styling for this section
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Section Type</Label>
                  <Input value={section.sectionType} disabled />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input value={section.sortOrder} disabled />
                </div>
              </div>
              
              <div>
                <Label>Subtitle</Label>
                <Input value={section.subtitle || ''} disabled />
              </div>
              
              <div>
                <Label>Content</Label>
                <Textarea value={section.content || ''} disabled rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <Input value={section.bgColor || ''} disabled />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input value={section.textColor || ''} disabled />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Section Status</h4>
                  <p className="text-sm text-gray-600">
                    {section.isActive ? 'This section is active and visible on the landing page' : 'This section is inactive and hidden from the landing page'}
                  </p>
                </div>
                <Badge variant={section.isActive ? "default" : "secondary"}>
                  {section.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <Button variant="outline" onClick={() => router.push(`/admin/landing-content`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Section Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Person Dialog */}
      <PersonDialog
        isOpen={isPersonDialogOpen}
        onClose={() => {
          setIsPersonDialogOpen(false);
          setSelectedPerson(null);
        }}
        onSubmit={selectedPerson ? 
          (formData) => handleUpdatePerson(selectedPerson.id, formData) : 
          handleCreatePerson
        }
        person={selectedPerson}
      />

      {/* Image Manager Dialog */}
      {isImageManagerOpen && (
        <Dialog open={isImageManagerOpen} onOpenChange={setIsImageManagerOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Image Manager</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p>Image management will be integrated here.</p>
              <p>For now, you can manually add images through the gallery section.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Person Dialog Component
function PersonDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  person 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: any) => void; 
  person?: Person | null;
}) {
  const [formData, setFormData] = useState({
    name: person?.name || '',
    role: person?.role || '',
    designation: person?.designation || '',
    bio: person?.bio || '',
    email: person?.email || '',
    phone: person?.phone || '',
    profileImage: person?.profileImage || '',
    linkedin: person?.linkedin || '',
    twitter: person?.twitter || '',
    facebook: person?.facebook || '',
    department: person?.department || '',
    joinDate: person?.joinDate || '',
    isActive: person?.isActive ?? true,
    sortOrder: person?.sortOrder || 0,
    showOnLanding: person?.showOnLanding ?? true,
    showContact: person?.showContact ?? false
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (person) {
      setFormData({
        name: person.name,
        role: person.role,
        designation: person.designation || '',
        bio: person.bio || '',
        email: person.email || '',
        phone: person.phone || '',
        profileImage: person.profileImage || '',
        linkedin: person.linkedin || '',
        twitter: person.twitter || '',
        facebook: person.facebook || '',
        department: person.department || '',
        joinDate: person.joinDate || '',
        isActive: person.isActive,
        sortOrder: person.sortOrder,
        showOnLanding: person.showOnLanding,
        showContact: person.showContact
      });
    }
  }, [person]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Prevent dialog closing when uploading or interacting with file inputs
  const handleDialogOpenChange = (open: boolean) => {
    // Never close automatically - only allow explicit close
    if (!open) {
      // Only close if explicitly requested and not uploading
      if (!isUploading) {
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="person-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">{person ? 'Edit Person' : 'Add New Person'}</DialogTitle>
        </DialogHeader>
        <div id="person-dialog-description" className="sr-only">
          {person ? 'Edit person details including profile image, contact information, and display settings' : 'Add a new person with profile details and settings'}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., President, Secretary, Coach"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Additional title or position"
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Management, Sports"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description about the person"
              rows={3}
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Social Media */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter URL</Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook URL</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>

          {/* Profile Image */}
          <div onClick={(e) => e.stopPropagation()}>
            <ProfileImageUpload
              currentImageUrl={formData.profileImage}
              onImageUploaded={(imageUrl) => setFormData({ ...formData, profileImage: imageUrl })}
              onUploadStateChange={setIsUploading}
              personName={formData.name}
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="joinDate">Join Date</Label>
              <Input
                id="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium text-base md:text-lg">Display Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive" className="text-sm md:text-base">Active (visible in admin)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="showOnLanding"
                  checked={formData.showOnLanding}
                  onCheckedChange={(checked) => setFormData({ ...formData, showOnLanding: checked })}
                />
                <Label htmlFor="showOnLanding" className="text-sm md:text-base">Show on Landing Page</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="showContact"
                  checked={formData.showContact}
                  onCheckedChange={(checked) => setFormData({ ...formData, showContact: checked })}
                />
                <Label htmlFor="showContact" className="text-sm md:text-base">Show Contact Information</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.role} className="w-full sm:w-auto">
              {person ? 'Update Person' : 'Add Person'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, Edit, Trash2, Image, Upload, Eye, Download, Settings, 
  Users, Camera, MapPin, Trophy, Heart, Star, Building, Award,
  Save, X, Calendar, Mail, Phone, ExternalLink
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
  createdAt: string;
  updatedAt: string;
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

const SECTION_TYPES = [
  { value: 'HERO_BANNER', label: 'Hero Banner', icon: Star },
  { value: 'ABOUT_US', label: 'About Us', icon: Building },
  { value: 'FACILITIES', label: 'Facilities', icon: MapPin },
  { value: 'TEAM_MEMBERS', label: 'Team Members', icon: Users },
  { value: 'BOARD_MEMBERS', label: 'Board Members', icon: Award },
  { value: 'DONORS', label: 'Donors', icon: Heart },
  { value: 'SPONSORS', label: 'Sponsors', icon: Trophy },
  { value: 'GALLERY_SHOWCASE', label: 'Gallery Showcase', icon: Camera },
  { value: 'TESTIMONIALS', label: 'Testimonials', icon: Users },
  { value: 'CONTACT_INFO', label: 'Contact Info', icon: Phone },
  { value: 'CUSTOM', label: 'Custom Section', icon: Settings }
];

export default function LandingPageManager() {
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<LandingPageSection | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch("/api/landing/sections");
      if (response.ok) {
        const data = await response.json();
        setSections(data.success ? data.sections : []);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast({
        title: "Error",
        description: "Failed to fetch sections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSectionTypeConfig = (sectionType: string) => {
    return SECTION_TYPES.find(type => type.value === sectionType) || SECTION_TYPES[0];
  };

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.sectionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSection = async (formData: any) => {
    try {
      const response = await fetch("/api/landing/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Section created successfully",
        });
        setIsAddDialogOpen(false);
        fetchSections();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create section");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateSection = async (sectionId: string, formData: any) => {
    try {
      const response = await fetch(`/api/landing/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Section updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedSection(null);
        fetchSections();
      } else {
        throw new Error("Failed to update section");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/landing/sections/${sectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Section deleted successfully",
        });
        fetchSections();
      } else {
        throw new Error("Failed to delete section");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete section",
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

  return (
    <div className="p-3 md:p-4 lg:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Landing Page Manager</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm lg:text-base">
            Manage sections, content, images, and team members for your landing page
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          className="flex items-center gap-2 w-full sm:w-auto h-9"
          size="default"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Section</span>
        </Button>
      </div>

      {/* Search */}
      <div className="w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search sections by title, type, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredSections.map((section) => {
          const config = getSectionTypeConfig(section.sectionType);
          const IconComponent = config.icon;

          return (
            <Card key={section.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base md:text-lg truncate">{section.title}</CardTitle>
                      <CardDescription className="text-sm">{config.label}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={section.isActive ? "default" : "secondary"}
                    className="shrink-0 text-xs"
                  >
                    {section.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {section.subtitle && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{section.subtitle}</p>
                )}

                {/* Stats */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{section.people.length} People</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span>{section.images.length} Images</span>
                  </span>
                </div>

                {/* People Preview */}
                {section.people.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Team Members:</h4>
                    <div className="space-y-2">
                      {section.people.slice(0, 2).map((person) => (
                        <div key={person.id} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center shrink-0">
                            {person.profileImage ? (
                              <img
                                src={person.profileImage}
                                alt={person.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-sm truncate block">{person.name}</span>
                            <span className="text-muted-foreground text-xs truncate block">{person.role}</span>
                          </div>
                        </div>
                      ))}
                      {section.people.length > 2 && (
                        <div className="text-xs text-muted-foreground pl-8">
                          +{section.people.length - 2} more members
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3">
                  <div className="flex gap-2 flex-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSection(section);
                        setIsEditDialogOpen(true);
                      }}
                      className="flex-1 text-xs md:text-sm h-8 md:h-9"
                    >
                      <Edit className="h-3 w-3 mr-1 md:mr-2" />
                      <span>Edit Section</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="flex-1 text-xs md:text-sm h-8 md:h-9"
                    >
                      <a href={`/admin/landing/sections/${section.id}`}>
                        <Settings className="h-3 w-3 mr-1 md:mr-2" />
                        <span>Manage</span>
                      </a>
                    </Button>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full sm:w-auto px-3 h-8 md:h-9 text-xs md:text-sm text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1 md:mr-2" />
                        <span>Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[95vw] md:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Section</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{section.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSection(section.id)}
                          className="bg-destructive hover:bg-destructive/80"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSections.length === 0 && (
        <Card className="p-6 md:p-12 text-center">
          <Camera className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">No sections found</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4 px-4">
            {searchTerm ? "No sections match your search criteria." : "Get started by creating your first landing page section."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create First Section
            </Button>
          )}
        </Card>
      )}

      {/* Add Section Dialog */}
      <AddSectionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleCreateSection}
      />

      {/* Edit Section Dialog */}
      {selectedSection && (
        <EditSectionDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedSection(null);
          }}
          onSubmit={(formData) => handleUpdateSection(selectedSection.id, formData)}
          section={selectedSection}
        />
      )}
    </div>
  );
}

// Add Section Dialog Component
function AddSectionDialog({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    sectionType: '',
    title: '',
    subtitle: '',
    content: '',
    isActive: true,
    sortOrder: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Section</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sectionType">Section Type</Label>
              <Select
                value={formData.sectionType}
                onValueChange={(value) => setFormData({ ...formData, sectionType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section type" />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.sectionType || !formData.title}>
              Create Section
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Section Dialog Component
function EditSectionDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  section 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: any) => void; 
  section: LandingPageSection;
}) {
  const [formData, setFormData] = useState({
    title: section.title,
    subtitle: section.subtitle || '',
    content: section.content || '',
    isActive: section.isActive,
    sortOrder: section.sortOrder,
    bgColor: section.bgColor || '',
    textColor: section.textColor || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Section: {section.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
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
          
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bgColor">Background Color</Label>
              <Input
                id="bgColor"
                value={formData.bgColor}
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                placeholder="#ffffff"
              />
            </div>
            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <Input
                id="textColor"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                placeholder="#000000"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Section
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

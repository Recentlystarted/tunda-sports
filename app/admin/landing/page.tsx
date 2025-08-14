"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, Edit, Trash2, Image, Upload, Eye, Download, Settings, 
  Users, Camera, MapPin, Trophy, Heart, Star, Building, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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
  { value: 'CONTACT_INFO', label: 'Contact Info', icon: Settings },
  { value: 'CUSTOM', label: 'Custom Section', icon: Settings }
];

export default function AdminLandingPage() {
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch("/api/landing/sections");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSections(data.sections);
        }
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast({
        title: "Error",
        description: "Failed to fetch landing page sections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSectionTypeConfig = (sectionType: string) => {
    return SECTION_TYPES.find(type => type.value === sectionType) || 
           { value: sectionType, label: sectionType, icon: Settings };
  };

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.sectionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (section.subtitle && section.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Landing Page Sections</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage individual sections, content, and media for your landing page
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/admin/landing-content">
            <Button variant="outline" className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Landing Content Manager</span>
              <span className="sm:hidden">Content Manager</span>
            </Button>
          </Link>
        </div>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.filter(s => s.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sections.reduce((sum, section) => sum + section.people.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sections.reduce((sum, section) => sum + section.images.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 md:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="all" className="flex items-center gap-1 p-2 h-auto">
            <Building className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-xs">All Sections</span>
            <span className="sm:hidden text-xs">All</span>
          </TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-1 p-2 h-auto">
            <Star className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline text-xs">Hero & About</span>
            <span className="md:hidden text-xs">Hero</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-1 p-2 h-auto">
            <Users className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-xs">Team & People</span>
            <span className="sm:hidden text-xs">Team</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1 p-2 h-auto">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline text-xs">Content & Info</span>
            <span className="md:hidden text-xs">Content</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-1 p-2 h-auto">
            <Camera className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-xs">Media & Gallery</span>
            <span className="sm:hidden text-xs">Media</span>
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="flex items-center gap-1 p-2 h-auto">
            <Trophy className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline text-xs">Donors & Sponsors</span>
            <span className="md:hidden text-xs">Sponsors</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <SectionGrid sections={filteredSections} />
        </TabsContent>

        <TabsContent value="hero">
          <SectionGrid 
            sections={filteredSections.filter(s => 
              ['HERO_BANNER', 'ABOUT_US'].includes(s.sectionType)
            )} 
          />
        </TabsContent>

        <TabsContent value="team">
          <SectionGrid 
            sections={filteredSections.filter(s => 
              ['TEAM_MEMBERS', 'BOARD_MEMBERS'].includes(s.sectionType)
            )} 
          />
        </TabsContent>

        <TabsContent value="content">
          <SectionGrid 
            sections={filteredSections.filter(s => 
              ['FACILITIES', 'CONTACT_INFO', 'TESTIMONIALS', 'CUSTOM'].includes(s.sectionType)
            )} 
          />
        </TabsContent>

        <TabsContent value="media">
          <SectionGrid 
            sections={filteredSections.filter(s => 
              ['GALLERY_SHOWCASE'].includes(s.sectionType)
            )} 
          />
        </TabsContent>

        <TabsContent value="sponsors">
          <SectionGrid 
            sections={filteredSections.filter(s => 
              ['DONORS', 'SPONSORS'].includes(s.sectionType)
            )} 
          />
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredSections.length === 0 && (
        <Card className="p-6 md:p-12 text-center">
          <Building className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">No sections found</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4 px-4">
            {searchTerm ? "No sections match your search criteria." : "Use the Landing Content Manager to create your first section."}
          </p>
          {!searchTerm && (
            <Link href="/admin/landing-content">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Go to Content Manager
              </Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
}

function SectionGrid({ sections }: { sections: LandingPageSection[] }) {
  const getSectionTypeConfig = (sectionType: string) => {
    return SECTION_TYPES.find(type => type.value === sectionType) || 
           { value: sectionType, label: sectionType, icon: Settings };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {sections.map((section) => {
        const config = getSectionTypeConfig(section.sectionType);
        const IconComponent = config.icon;

        return (
          <Card key={section.id} className="hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <IconComponent className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base md:text-lg truncate">{section.title}</CardTitle>
                    <CardDescription className="text-xs md:text-sm">{config.label}</CardDescription>
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

            <CardContent className="space-y-3 md:space-y-4">
              {section.subtitle && (
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{section.subtitle}</p>
              )}

              {/* Stats */}
              <div className="flex gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="hidden xs:inline">{section.people.length} People</span>
                  <span className="xs:hidden">{section.people.length}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  <span className="hidden xs:inline">{section.images.length} Images</span>
                  <span className="xs:hidden">{section.images.length}</span>
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-1 md:gap-2 pt-2">
                <Link href={`/admin/landing/sections/${section.id}`} className="flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs md:text-sm"
                  >
                    <Eye className="h-3 w-3 md:mr-1" />
                    <span className="hidden md:inline">Manage</span>
                  </Button>
                </Link>
                <Link href={`/admin/landing-content`} className="flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs md:text-sm"
                  >
                    <Edit className="h-3 w-3 md:mr-1" />
                    <span className="hidden md:inline">Edit</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

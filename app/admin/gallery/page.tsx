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
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  tags?: string[];
  uploadDate: string;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  tournament?: {
    name: string;
  };
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    fetchImages();
  }, []);
  const fetchImages = async () => {
    try {
      const response = await fetch("/api/images");
      if (response.ok) {
        const data = await response.json();
        setImages(data.success ? data.images : data);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchImages();
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig: Record<string, { variant: any; label: string }> = {
      // Landing Page Categories
      HERO_BANNER: { variant: "default", label: "Hero Banner" },
      ABOUT_SECTION: { variant: "secondary", label: "About Section" },
      FACILITIES_SHOWCASE: { variant: "outline", label: "Facilities" },
      TEAM_PHOTOS: { variant: "default", label: "Team Photos" },
      BOARD_MEMBERS: { variant: "secondary", label: "Board Members" },
      DONORS_WALL: { variant: "outline", label: "Donors Wall" },
      SPONSORS_GALLERY: { variant: "default", label: "Sponsors" },
      
      // Tournament Categories
      TOURNAMENT: { variant: "default", label: "Tournament" },
      TEAM: { variant: "secondary", label: "Team" },
      PLAYER: { variant: "outline", label: "Player" },
      FACILITY: { variant: "default", label: "Facility" },
      GALLERY: { variant: "secondary", label: "Gallery" },
      MATCH: { variant: "default", label: "Match" },
      TRAINING: { variant: "outline", label: "Training" },
      EVENT: { variant: "default", label: "Event" },
      POSTER: { variant: "secondary", label: "Poster" },
      TROPHY: { variant: "default", label: "Trophy" },
      VENUE: { variant: "outline", label: "Venue" },
    };

    const config = categoryConfig[category] || { variant: "outline", label: category };
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || image.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(images.map(img => img.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gallery</h1>
          <p className="text-muted-foreground">
            Manage tournament photos, team images, and media assets
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/gallery/upload">
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Images
            </Button>
          </Link>
          <Link href="/admin/gallery/bulk">
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Bulk Upload
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search images by title, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0) + category.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {images.filter(img => {
                const uploadDate = new Date(img.uploadDate);
                const now = new Date();
                return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(images.reduce((sum, img) => sum + (img.size || 0), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs for Different Sections */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 md:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="all" className="flex items-center gap-1 p-2 h-auto">
            <Image className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-xs">All Images</span>
            <span className="sm:hidden text-xs">All</span>
          </TabsTrigger>
          <TabsTrigger value="landing" className="flex items-center gap-1 p-2 h-auto">
            <Star className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline text-xs">Landing Page</span>
            <span className="lg:hidden hidden md:inline text-xs">Landing</span>
            <span className="md:hidden text-xs">Home</span>
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="flex items-center gap-1 p-2 h-auto">
            <Trophy className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-xs">Tournaments</span>
            <span className="sm:hidden text-xs">Events</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-1 p-2 h-auto">
            <Users className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline text-xs">Teams & People</span>
            <span className="lg:hidden hidden md:inline text-xs">Teams</span>
            <span className="md:hidden text-xs">Team</span>
          </TabsTrigger>
          <TabsTrigger value="facilities" className="flex items-center gap-1 p-2 h-auto">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-xs">Facilities</span>
            <span className="sm:hidden text-xs">Places</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-1 p-2 h-auto">
            <Camera className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline text-xs">Events & Gallery</span>
            <span className="lg:hidden hidden md:inline text-xs">Gallery</span>
            <span className="md:hidden text-xs">Media</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ImageGrid images={filteredImages} />
        </TabsContent>

        <TabsContent value="landing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Landing Page Images
                </CardTitle>
                <CardDescription>
                  Manage images for hero banners, about section, team photos, donors, sponsors, and other landing page content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button asChild>
                    <Link href="/admin/landing-content">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Landing Page Content
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            <ImageGrid 
              images={filteredImages.filter(img => 
                ['HERO_BANNER', 'ABOUT_SECTION', 'FACILITIES_SHOWCASE', 'TEAM_PHOTOS', 'BOARD_MEMBERS', 'DONORS_WALL', 'SPONSORS_GALLERY'].includes(img.category)
              )} 
            />
          </div>
        </TabsContent>

        <TabsContent value="tournaments">
          <ImageGrid 
            images={filteredImages.filter(img => 
              ['TOURNAMENT', 'MATCH', 'TROPHY', 'POSTER'].includes(img.category)
            )} 
          />
        </TabsContent>

        <TabsContent value="team">
          <ImageGrid 
            images={filteredImages.filter(img => 
              ['TEAM', 'PLAYER', 'TEAM_PHOTOS', 'BOARD_MEMBERS'].includes(img.category)
            )} 
          />
        </TabsContent>

        <TabsContent value="facilities">
          <ImageGrid 
            images={filteredImages.filter(img => 
              ['FACILITY', 'VENUE', 'FACILITIES_SHOWCASE'].includes(img.category)
            )} 
          />
        </TabsContent>

        <TabsContent value="events">
          <ImageGrid 
            images={filteredImages.filter(img => 
              ['EVENT', 'GALLERY', 'TRAINING'].includes(img.category)
            )} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Image Grid Component
function ImageGrid({ images }: { images: any[] }) {
  const { toast } = useToast();

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Image deleted successfully",
        });
        // Refresh would be handled by parent component
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig: Record<string, { variant: any; label: string }> = {
      // Landing Page Categories
      HERO_BANNER: { variant: "default", label: "Hero Banner" },
      ABOUT_SECTION: { variant: "secondary", label: "About Section" },
      FACILITIES_SHOWCASE: { variant: "outline", label: "Facilities" },
      TEAM_PHOTOS: { variant: "default", label: "Team Photos" },
      BOARD_MEMBERS: { variant: "secondary", label: "Board Members" },
      DONORS_WALL: { variant: "outline", label: "Donors Wall" },
      SPONSORS_GALLERY: { variant: "default", label: "Sponsors" },
      
      // Tournament Categories
      TOURNAMENT: { variant: "default", label: "Tournament" },
      TEAM: { variant: "secondary", label: "Team" },
      PLAYER: { variant: "outline", label: "Player" },
      FACILITY: { variant: "default", label: "Facility" },
      GALLERY: { variant: "secondary", label: "Gallery" },
      MATCH: { variant: "default", label: "Match" },
      TRAINING: { variant: "outline", label: "Training" },
      EVENT: { variant: "default", label: "Event" },
      POSTER: { variant: "secondary", label: "Poster" },
      TROPHY: { variant: "default", label: "Trophy" },
      VENUE: { variant: "outline", label: "Venue" },
    };

    const config = categoryConfig[category] || { variant: "outline", label: category };
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Image className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No images found</h3>
          <p className="text-muted-foreground text-center mb-4">
            No images match your current filter criteria.
          </p>
          <Button asChild>
            <Link href="/admin/gallery/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((image) => (
        <Card key={image.id} className="overflow-hidden">
          <div className="aspect-square relative group">
            <img
              src={image.imageUrl}
              alt={image.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{image.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full max-h-[70vh] object-contain rounded-lg"
                    />
                    {image.description && (
                      <p className="text-muted-foreground">{image.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {getCategoryBadge(image.category)}
                      {image.tags?.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {image.dimensions && (
                      <p className="text-sm text-muted-foreground">
                        {image.dimensions.width} × {image.dimensions.height} • {formatFileSize(image.size)}
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Link href={`/admin/gallery/${image.id}/edit`}>
                <Button size="sm" variant="secondary">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Image</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{image.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteImage(image.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <CardContent className="p-3">
            <h3 className="font-medium text-sm truncate">{image.title}</h3>
            <div className="flex justify-between items-center mt-2">
              {getCategoryBadge(image.category)}
              <span className="text-xs text-muted-foreground">
                {new Date(image.uploadDate).toLocaleDateString()}
              </span>
            </div>
            {image.tournament && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {image.tournament.name}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Image as ImageIcon, 
  FolderOpen, 
  Trophy, 
  Medal, 
  Star,
  Users,
  Camera,
  FileText,
  Calendar,
  MapPin,
  ExternalLink,
  Trash2,
  Eye
} from 'lucide-react';
import Image from 'next/image';

interface TournamentImage {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string;
  originalUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  fileSize: number;
  mimeType: string;
}

interface Tournament {
  id: string;
  name: string;
  description?: string;
  venue: string;
  startDate: string;
  endDate?: string;
  googleDriveFolderId?: string;
}

const IMAGE_CATEGORIES = [
  { value: 'tournament_photos', label: '🏆 Tournament Photos', icon: Trophy },
  { value: 'winners', label: '🥇 Winners & Awards', icon: Medal },
  { value: 'runners_up', label: '🥈 Runners Up', icon: Medal },
  { value: 'man_of_series', label: '⭐ Man of the Series', icon: Star },
  { value: 'best_batsman', label: '🏏 Best Batsman', icon: Star },
  { value: 'best_bowler', label: '🎯 Best Bowler', icon: Star },
  { value: 'best_keeper', label: '🧤 Best Wicket Keeper', icon: Star },
  { value: 'officials', label: '👨‍💼 Tournament Officials', icon: Users },
  { value: 'opening_ceremony', label: '🎉 Opening Ceremony', icon: Calendar },
  { value: 'closing_ceremony', label: '🏁 Closing Ceremony', icon: Calendar },
  { value: 'team_photos', label: '👥 Team Photos', icon: Users },
  { value: 'supporters', label: '🤝 Supporters & Sponsors', icon: Users },
  { value: 'donors', label: '💰 Tournament Donors', icon: Users },
  { value: 'match_highlights', label: '📸 Match Highlights', icon: Camera },
  { value: 'cultural_events', label: '🎭 Cultural Events', icon: Calendar },
  { value: 'food_refreshments', label: '🍽️ Food & Refreshments', icon: Users },
  { value: 'documents', label: '📋 Documents & Certificates', icon: FileText },
  { value: 'background_images', label: '🖼️ Background Images', icon: ImageIcon }
];

export default function TournamentImageManager({ tournamentId }: { tournamentId: string }) {
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [images, setImages] = useState<TournamentImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<TournamentImage | null>(null);

  // Upload form states
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    category: '',
    tags: ''
  });

  useEffect(() => {
    fetchTournament();
    fetchImages();
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (response.ok) {
        const data = await response.json();
        setTournament(data.tournament);
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
    }
  };

  const fetchImages = async (category?: string) => {
    try {
      const url = category 
        ? `/api/tournaments/${tournamentId}/images?category=${category}`
        : `/api/tournaments/${tournamentId}/images`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    fetchImages(category || undefined);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setUploadForm(prev => ({ ...prev, file }));
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title || !uploadForm.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('category', uploadForm.category);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);

      const response = await fetch(`/api/tournaments/${tournamentId}/images`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Upload Successful",
          description: "Image uploaded to Google Drive successfully"
        });
        
        // Reset form and close dialog
        setUploadForm({
          file: null,
          title: '',
          description: '',
          category: '',
          tags: ''
        });
        setUploadDialogOpen(false);
        
        // Refresh images
        fetchImages(selectedCategory || undefined);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    return IMAGE_CATEGORIES.find(cat => cat.value === category) || 
           { label: category, icon: ImageIcon };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Images</h2>
          <p className="text-muted-foreground">
            Manage photos and documents for {tournament?.name}
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Image
        </Button>
      </div>

      {/* Google Drive Info */}
      {tournament?.googleDriveFolderId && (
        <Alert>
          <FolderOpen className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Images are automatically organized in Google Drive folders for easy management.
            </span>
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <a 
                href={`https://drive.google.com/drive/folders/${tournament.googleDriveFolderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Open in Drive
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryFilter('')}
            >
              All Images ({images.length})
            </Button>
            {IMAGE_CATEGORIES.map((category) => {
              const categoryImages = images.filter(img => img.category === category.value);
              const Icon = category.icon;
              return (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryFilter(category.value)}
                  className="gap-2"
                >
                  <Icon className="h-3 w-3" />
                  {category.label.split(' ').slice(1).join(' ')} ({categoryImages.length})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image) => {
          const categoryInfo = getCategoryInfo(image.category);
          const CategoryIcon = categoryInfo.icon;
          
          return (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative bg-gray-100">
                {image.thumbnailUrl ? (
                  <Image
                    src={image.thumbnailUrl}
                    alt={image.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="gap-1">
                    <CategoryIcon className="h-3 w-3" />
                    {categoryInfo.label.split(' ').slice(1).join(' ')}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-medium line-clamp-1">{image.title}</h3>
                {image.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {image.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(image.fileSize)}</span>
                  <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedImage(image);
                      setViewDialogOpen(true);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-2"
                  >
                    <a
                      href={image.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Drive
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {images.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-medium">No images found</h3>
              <p className="text-muted-foreground">
                {selectedCategory 
                  ? `No images in the selected category. Upload some images to get started.`
                  : 'Upload some images to get started.'
                }
              </p>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload First Image
            </Button>
          </div>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Tournament Image</DialogTitle>
            <DialogDescription>
              Upload and organize images for this tournament section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="file">Select Image *</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={uploadForm.category} onValueChange={(value) => 
                setUploadForm(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select image category" />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Final Match Winner Photo"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of the image..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g., final, winner, trophy (comma separated)"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !uploadForm.file || !uploadForm.title || !uploadForm.category}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload to Drive
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Image Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title}</DialogTitle>
            <DialogDescription>
              View and manage image details, including download options.
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4 py-4">
              <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                {selectedImage.thumbnailUrl ? (
                  <Image
                    src={selectedImage.thumbnailUrl}
                    alt={selectedImage.title}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Image Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Category:</strong> {getCategoryInfo(selectedImage.category).label}</div>
                    <div><strong>File Size:</strong> {formatFileSize(selectedImage.fileSize)}</div>
                    <div><strong>Upload Date:</strong> {new Date(selectedImage.createdAt).toLocaleDateString()}</div>
                    {selectedImage.tags && (
                      <div><strong>Tags:</strong> {selectedImage.tags}</div>
                    )}
                  </div>
                </div>
                
                {selectedImage.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedImage.description}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  asChild
                  className="gap-2"
                >
                  <a
                    href={selectedImage.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Google Drive
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

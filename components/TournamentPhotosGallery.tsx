"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FolderOpen, 
  Image as ImageIcon,
  Eye,
  ExternalLink,
  Camera,
  Grid3x3,
  ZoomIn,
  Download,
  Calendar,
  MapPin
} from 'lucide-react';
import Image from 'next/image';

interface Tournament {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
}

interface PhotoSection {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  order: number;
  _count: {
    images: number;
  };
  images: TournamentImage[];
}

interface TournamentImage {
  id: string;
  filename: string;
  originalName: string;
  description: string | null;
  googleDriveUrl: string | null;
  publicUrl: string | null;
  createdAt: string;
}

interface TournamentPhotosGalleryProps {
  tournamentId: string;
  tournament?: Tournament;
  isPublic?: boolean;
  className?: string;
}

export default function TournamentPhotosGallery({ 
  tournamentId, 
  tournament, 
  isPublic = true,
  className = '' 
}: TournamentPhotosGalleryProps) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<PhotoSection[]>([]);
  const [selectedImage, setSelectedImage] = useState<TournamentImage | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  useEffect(() => {
    fetchSections();
  }, [tournamentId]);

  const fetchSections = async () => {
    if (!tournamentId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/sections`);
      if (response.ok) {
        const data = await response.json();
        // Filter sections that have images for public view
        const sectionsWithImages = isPublic 
          ? data.sections.filter((section: PhotoSection) => section._count.images > 0)
          : data.sections;
        setSections(sectionsWithImages || []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const openImageDialog = (image: TournamentImage) => {
    setSelectedImage(image);
    setImageDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading tournament photos...</p>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert>
          <Camera className="h-4 w-4" />
          <AlertDescription>
            No photos have been uploaded for this tournament yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tournament Header (for public view) */}
      {isPublic && tournament && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-6 w-6" />
              {tournament.name} - Photo Gallery
            </CardTitle>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {tournament.venue}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Photo Sections */}
      {sections.map((section) => (
        <Card key={section.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {section.emoji && <span className="text-xl">{section.emoji}</span>}
                {section.name}
                <Badge variant="secondary">
                  {section._count.images} photo{section._count.images !== 1 ? 's' : ''}
                </Badge>
              </div>
              {!isPublic && (
                <Button variant="outline" size="sm">
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              )}
            </CardTitle>
            {section.description && (
              <p className="text-muted-foreground">{section.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {section.images.length === 0 ? (
              <Alert>
                <ImageIcon className="h-4 w-4" />
                <AlertDescription>
                  No photos in this section yet.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {section.images.map((image) => (
                  <div 
                    key={image.id} 
                    className="relative group cursor-pointer"
                    onClick={() => openImageDialog(image)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                      {image.publicUrl ? (
                        <Image
                          src={image.publicUrl}
                          alt={image.originalName}
                          width={200}
                          height={200}
                          className="object-cover w-full h-full transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" className="bg-white/90 text-black hover:bg-white">
                          <ZoomIn className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      {image.description || image.originalName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedImage?.description || selectedImage?.originalName}</span>
              <div className="flex gap-2">
                {selectedImage?.publicUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a 
                      href={selectedImage.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </Button>
                )}
                {selectedImage?.googleDriveUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={selectedImage.googleDriveUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Drive
                    </a>
                  </Button>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              View tournament photo details and download options.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[70vh] overflow-hidden">
            {selectedImage?.publicUrl ? (
              <Image
                src={selectedImage.publicUrl}
                alt={selectedImage.originalName}
                width={800}
                height={600}
                className="object-contain max-w-full max-h-full rounded-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-64 w-full bg-muted rounded-lg">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          {selectedImage?.description && (
            <p className="text-sm text-muted-foreground mt-4">
              {selectedImage.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Uploaded on {selectedImage?.createdAt ? formatDate(selectedImage.createdAt) : 'Unknown date'}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

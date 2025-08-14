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
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  FolderOpen, 
  Image as ImageIcon,
  Eye,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Tournament {
  id: string;
  name: string;
  status: string;
  googleDriveFolderId: string | null;
}

interface TournamentImage {
  id: string;
  filename: string;
  originalName: string;
  category: string;
  description: string | null;
  googleDriveUrl: string | null;
  publicUrl: string | null;
  createdAt: string;
}

const imageCategories = [
  { value: 'tournament_photos', label: '🏆 Tournament Photos' },
  { value: 'winners', label: '🥇 Winners & Awards' },
  { value: 'runners_up', label: '🥈 Runners Up' },
  { value: 'man_of_series', label: '⭐ Man of the Series' },
  { value: 'best_batsman', label: '🏏 Best Batsman' },
  { value: 'best_bowler', label: '🎯 Best Bowler' },
  { value: 'best_keeper', label: '🧤 Best Wicket Keeper' },
  { value: 'officials', label: '👨‍💼 Tournament Officials' },
  { value: 'opening_ceremony', label: '🎉 Opening Ceremony' },
  { value: 'closing_ceremony', label: '🏁 Closing Ceremony' },
  { value: 'team_photos', label: '👥 Team Photos' },
  { value: 'supporters', label: '🤝 Supporters & Sponsors' },
  { value: 'donors', label: '💰 Tournament Donors' },
  { value: 'match_highlights', label: '📸 Match Highlights' },
  { value: 'cultural_events', label: '🎭 Cultural Events' },
  { value: 'food_refreshments', label: '🍽️ Food & Refreshments' },
  { value: 'documents', label: '📋 Documents & Certificates' },
  { value: 'background_images', label: '🖼️ Background Images' }
];

export default function GoogleDriveTournamentImages() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [images, setImages] = useState<TournamentImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Upload form state
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    tags: '',
    category: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentImages();
    }
  }, [selectedTournament, filterCategory]);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentImages = async () => {
    if (!selectedTournament) return;
    
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      
      const response = await fetch(`/api/tournaments/${selectedTournament}/images?${params}`);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching tournament images:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setUploadData(prev => ({ ...prev, file }));
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an image file (PNG, JPG, JPEG)",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedTournament || !uploadData.file || !uploadData.category || !uploadData.title) {
      toast({
        title: "Missing Information",
        description: "Please select tournament, category, title, and file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadData.file);
      formData.append('category', uploadData.category);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('tags', uploadData.tags);

      const response = await fetch(`/api/tournaments/${selectedTournament}/images`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Upload Successful",
          description: "Image has been uploaded to Google Drive successfully!"
        });
        
        // Reset form
        setUploadData({
          title: '',
          description: '',
          tags: '',
          category: '',
          file: null
        });
        
        // Refresh images
        fetchTournamentImages();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tournament Image Manager</h1>
            <p className="text-muted-foreground">
              Upload and manage tournament photos in Google Drive with organized categories
            </p>
          </div>
        </div>

        {/* Tournament Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Select Tournament
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tournament to manage images" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    <div className="flex items-center gap-2">
                      <span>{tournament.name}</span>
                      <Badge variant="outline">{tournament.status}</Badge>
                      {tournament.googleDriveFolderId && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTournament && !tournaments.find(t => t.id === selectedTournament)?.googleDriveFolderId && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This tournament doesn't have Google Drive folders set up. Folders will be created automatically when you upload the first image.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {selectedTournament && (
          <>
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload New Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={uploadData.category} onValueChange={(value) => setUploadData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select image category" />
                      </SelectTrigger>
                      <SelectContent>
                        {imageCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={uploadData.title}
                      onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Image title"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={uploadData.tags}
                    onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="cricket, tournament, team, winner"
                  />
                </div>
                
                <div>
                  <Label htmlFor="imageFile">Image File</Label>
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                
                <Button onClick={handleUpload} disabled={uploading} className="w-full">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading to Google Drive...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Image Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Tournament Images
                  <Badge variant="outline">{images.length} images</Badge>
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Label htmlFor="filter">Filter by category:</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {imageCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {images.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No images uploaded yet</p>
                    <p className="text-sm">Upload your first image to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="border rounded-lg p-4 space-y-3">
                        {image.publicUrl && (
                          <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={image.publicUrl}
                              alt={image.originalName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <h4 className="font-medium truncate">{image.originalName}</h4>
                          <Badge variant="secondary">
                            {imageCategories.find(cat => cat.value === image.category)?.label || image.category}
                          </Badge>
                          
                          {image.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {image.description}
                            </p>
                          )}
                          
                          <div className="flex gap-2">
                            {image.publicUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={image.publicUrl} target="_blank">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                            )}
                            {image.googleDriveUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={image.googleDriveUrl} target="_blank">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Drive
                                </Link>
                              </Button>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {new Date(image.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

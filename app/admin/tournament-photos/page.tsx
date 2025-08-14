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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  Plus,
  Edit2,
  Trash2,
  FolderOpen, 
  Image as ImageIcon,
  Eye,
  ExternalLink,
  Camera,
  Grid3x3,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Tournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface PhotoSection {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  order: number;
  googleDriveFolderId: string | null;
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
  sectionId: string | null;
}

export default function TournamentPhotosAdmin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [sections, setSections] = useState<PhotoSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  // Dialog states
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditImageDialog, setShowEditImageDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<PhotoSection | null>(null);
  const [editingImage, setEditingImage] = useState<TournamentImage | null>(null);
  
  // AlertDialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'section' | 'image' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  
  // Form states
  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    emoji: ''
  });
  
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null as File | null
  });

  const [imageEditForm, setImageEditForm] = useState({
    title: '',
    description: '',
    sectionId: ''
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchSections();
    }
  }, [selectedTournament]);

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

  const fetchSections = async () => {
    if (!selectedTournament) return;
    
    setSectionsLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament}/sections`);
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleCreateSection = async () => {
    if (!sectionForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Section name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/tournaments/${selectedTournament}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Photo section created successfully"
        });
        setSectionForm({ name: '', description: '', emoji: '' });
        setShowSectionDialog(false);
        fetchSections();
      } else {
        throw new Error('Failed to create section');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create photo section",
        variant: "destructive"
      });
    }
  };

  const handleEditSection = (section: PhotoSection) => {
    setEditingSection(section);
    setSectionForm({
      name: section.name,
      description: section.description || '',
      emoji: section.emoji || ''
    });
    setShowSectionDialog(true);
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;

    try {
      const response = await fetch(
        `/api/tournaments/${selectedTournament}/sections/${editingSection.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sectionForm)
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Photo section updated successfully"
        });
        setSectionForm({ name: '', description: '', emoji: '' });
        setEditingSection(null);
        setShowSectionDialog(false);
        fetchSections();
      } else {
        throw new Error('Failed to update section');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update photo section",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    setDeleteType('section');
    setItemToDelete(sectionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteImage = async (imageId: string) => {
    setDeleteType('image');
    setItemToDelete(imageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    try {
      let response;
      if (deleteType === 'section') {
        response = await fetch(
          `/api/tournaments/${selectedTournament}/sections/${itemToDelete}`,
          { method: 'DELETE' }
        );
      } else {
        response = await fetch(
          `/api/tournaments/${selectedTournament}/images/${itemToDelete}`, 
          { method: 'DELETE' }
        );
      }

      if (response.ok) {
        toast({
          title: "Success",
          description: `${deleteType === 'section' ? 'Photo section' : 'Image'} deleted successfully`
        });
        fetchSections();
      } else {
        throw new Error(`Failed to delete ${deleteType}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${deleteType}`,
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteType(null);
      setItemToDelete(null);
    }
  };

  const handleUploadImage = async () => {
    if (!uploadForm.file || !selectedSection || !uploadForm.title.trim()) {
      toast({
        title: "Validation Error",
        description: "File, section, and title are required",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadForm.file); // Changed from 'file' to 'image'
      formData.append('sectionId', selectedSection);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);

      // Debug logging
      console.log('Frontend sending:', {
        hasFile: !!uploadForm.file,
        fileName: uploadForm.file?.name,
        fileSize: uploadForm.file?.size,
        sectionId: selectedSection,
        title: uploadForm.title,
        description: uploadForm.description
      });

      const response = await fetch(`/api/tournaments/${selectedTournament}/images`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Image uploaded successfully"
        });
        setUploadForm({ title: '', description: '', file: null });
        setShowUploadDialog(false);
        fetchSections();
      } else {
        const error = await response.json();
        console.log('API Error Response:', error);
        throw new Error(error.error || 'Failed to upload image');
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

  const handleEditImage = (image: TournamentImage) => {
    setEditingImage(image);
    setImageEditForm({
      title: image.originalName,
      description: image.description || '',
      sectionId: image.sectionId || ''
    });
    setShowEditImageDialog(true);
  };

  const handleUpdateImage = async () => {
    if (!editingImage || !selectedTournament) return;

    try {
      const response = await fetch(`/api/tournaments/${selectedTournament}/images/${editingImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: imageEditForm.title,
          description: imageEditForm.description,
          sectionId: imageEditForm.sectionId
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Image updated successfully"
        });
        setShowEditImageDialog(false);
        setEditingImage(null);
        setImageEditForm({ title: '', description: '', sectionId: '' });
        fetchSections();
      } else {
        throw new Error('Failed to update image');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update image",
        variant: "destructive"
      });
    }
  };

  const resetSectionDialog = () => {
    setSectionForm({ name: '', description: '', emoji: '' });
    setEditingSection(null);
    setShowSectionDialog(false);
  };

  const resetImageEditDialog = () => {
    setImageEditForm({ title: '', description: '', sectionId: '' });
    setEditingImage(null);
    setShowEditImageDialog(false);
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Camera className="h-8 w-8" />
              Tournament Photo Management
            </h1>
            <p className="text-muted-foreground">
              Manage photo sections and upload images for tournaments
            </p>
          </div>
        </div>

        {/* Tournament Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Tournament</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose a tournament..." />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tournament.name}</span>
                      <Badge variant={tournament.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {tournament.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedTournament && (
          <>
            {/* Section Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Photo Sections
                  </CardTitle>
                  <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => resetSectionDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingSection ? 'Edit Photo Section' : 'Create Photo Section'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sectionName">Section Name</Label>
                          <Input
                            id="sectionName"
                            value={sectionForm.name}
                            onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Final Winners, Best Bowler Award"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sectionEmoji">Emoji (optional)</Label>
                          <Input
                            id="sectionEmoji"
                            value={sectionForm.emoji}
                            onChange={(e) => setSectionForm(prev => ({ ...prev, emoji: e.target.value }))}
                            placeholder="🏆"
                            className="w-20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sectionDescription">Description (optional)</Label>
                          <Textarea
                            id="sectionDescription"
                            value={sectionForm.description}
                            onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe this photo section..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={resetSectionDialog}>
                            Cancel
                          </Button>
                          <Button onClick={editingSection ? handleUpdateSection : handleCreateSection}>
                            {editingSection ? 'Update' : 'Create'} Section
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {sectionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <p className="text-muted-foreground">Loading sections from Google Drive...</p>
                    </div>
                  </div>
                ) : sections.length === 0 ? (
                  <Alert>
                    <ImageIcon className="h-4 w-4" />
                    <AlertDescription>
                      No photo sections created yet. Create sections to organize tournament photos by category.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map((section) => (
                      <Card key={section.id} className="border-dashed">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold flex items-center gap-2">
                                {section.emoji && <span className="text-lg">{section.emoji}</span>}
                                {section.name}
                              </h3>
                              {section.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {section.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary">
                                  {section._count.images} image{section._count.images !== 1 ? 's' : ''}
                                </Badge>
                                {section.googleDriveFolderId && (
                                  <Badge variant="outline">
                                    <FolderOpen className="h-3 w-3 mr-1" />
                                    Drive
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditSection(section)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteSection(section.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Upload */}
            {sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Tournament Image</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="uploadSection">Select Section</Label>
                          <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a section..." />
                            </SelectTrigger>
                            <SelectContent>
                              {sections.map((section) => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.emoji && `${section.emoji} `}{section.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="uploadFile">Image File</Label>
                          <Input
                            id="uploadFile"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setUploadForm(prev => ({ 
                              ...prev, 
                              file: e.target.files?.[0] || null 
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="uploadTitle">Title *</Label>
                          <Input
                            id="uploadTitle"
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Image title (required)..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="uploadDescription">Description (optional)</Label>
                          <Textarea
                            id="uploadDescription"
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Image description..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleUploadImage} disabled={uploading}>
                            {uploading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Image Dialog */}
                  <Dialog open={showEditImageDialog} onOpenChange={setShowEditImageDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Image</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="editTitle">Title</Label>
                          <Input
                            id="editTitle"
                            value={imageEditForm.title}
                            onChange={(e) => setImageEditForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Image title..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="editDescription">Description</Label>
                          <Textarea
                            id="editDescription"
                            value={imageEditForm.description}
                            onChange={(e) => setImageEditForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Image description..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editSection">Section</Label>
                          <Select value={imageEditForm.sectionId} onValueChange={(value) => setImageEditForm(prev => ({ ...prev, sectionId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a section..." />
                            </SelectTrigger>
                            <SelectContent>
                              {sections.map((section) => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.emoji && `${section.emoji} `}{section.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={resetImageEditDialog}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdateImage}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {/* Display Images by Section */}
            {sections.length > 0 && (
              <div className="space-y-6">
                {sections.map((section) => (
                  section._count.images > 0 && (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {section.emoji && <span className="text-lg">{section.emoji}</span>}
                          {section.name}
                          <Badge variant="secondary">
                            {section._count.images} image{section._count.images !== 1 ? 's' : ''}
                          </Badge>
                        </CardTitle>
                        {section.description && (
                          <p className="text-muted-foreground">{section.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {section.images.map((image) => (
                            <div key={image.id} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                {image.publicUrl ? (
                                  <Image
                                    src={image.publicUrl}
                                    alt={image.originalName}
                                    width={200}
                                    height={200}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    onClick={() => handleEditImage(image)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleDeleteImage(image.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                  {image.publicUrl && (
                                    <Button size="sm" variant="secondary" asChild>
                                      <a href={image.publicUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  )}
                                  {image.googleDriveUrl && (
                                    <Button size="sm" variant="secondary" asChild>
                                      <a href={image.googleDriveUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {image.originalName}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'section' 
                ? 'This will delete the photo section. All images in this section will be moved to "uncategorized". This action cannot be undone.'
                : 'This will permanently delete the image. This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {deleteType === 'section' ? 'Section' : 'Image'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

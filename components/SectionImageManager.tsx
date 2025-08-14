'use client'

import { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Plus,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'

interface SectionImage {
  id: string
  title?: string
  description?: string
  imageUrl: string
  altText?: string
  category: string
  isActive: boolean
  sortOrder: number
}

interface ImageUploadProps {
  sectionId: string
  sectionTitle: string
  onImagesUploaded: () => void
  existingImages: SectionImage[]
}

const imageCategories = [
  { value: 'GALLERY', label: 'Gallery' },
  { value: 'EVENT', label: 'Events' },
  { value: 'FACILITY', label: 'Facility' },
  { value: 'TEAM', label: 'Team' },
  { value: 'TOURNAMENT', label: 'Tournament' },
  { value: 'PLAYER', label: 'Player' },
  { value: 'MATCH', label: 'Match' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'POSTER', label: 'Poster' },
  { value: 'TROPHY', label: 'Trophy' },
  { value: 'VENUE', label: 'Venue' },
]

export default function SectionImageManager({ 
  sectionId, 
  sectionTitle, 
  onImagesUploaded,
  existingImages 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    altText: ''
  })
  const [selectedImage, setSelectedImage] = useState<SectionImage | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    setUploadedFiles(fileArray)
    
    // Generate preview URLs
    const urls = fileArray.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)
    
    // Auto-set title if only one file
    if (fileArray.length === 1 && !formData.title) {
      const fileName = fileArray[0].name.split('.')[0]
      setFormData(prev => ({
        ...prev,
        title: fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive"
      })
      return
    }

    if (!formData.title || !formData.category) {
      toast({
        title: "Error",
        description: "Title and category are required",
        variant: "destructive"
      })
      return
    }

    setUploading(true)

    try {
      const uploadFormData = new FormData()
      
      uploadedFiles.forEach(file => {
        uploadFormData.append('files', file)
      })
      
      uploadFormData.append('title', formData.title)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('category', formData.category)
      uploadFormData.append('altText', formData.altText || formData.title)

      const response = await fetch(`/api/landing/sections/${sectionId}/upload`, {
        method: 'POST',
        body: uploadFormData
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message
        })
        
        // Reset form
        setUploadedFiles([])
        setPreviewUrls([])
        setFormData({
          title: '',
          description: '',
          category: '',
          altText: ''
        })
        
        // Callback to refresh parent
        onImagesUploaded()
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/landing/sections/${sectionId}/images/${imageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Image deleted successfully"
        })
        onImagesUploaded()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive"
      })
    }
  }

  const clearFiles = () => {
    setUploadedFiles([])
    setPreviewUrls([])
    previewUrls.forEach(url => URL.revokeObjectURL(url))
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg md:text-xl font-semibold mb-2">Image Management</h3>
        <p className="text-sm text-muted-foreground">
          Upload and manage images for <strong>{sectionTitle}</strong>. Images are stored securely on Google Drive.
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag & Drop Area */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <Upload className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
            <p className="text-base md:text-lg font-medium text-foreground mb-2">
              {isDragActive ? 'Drop images here...' : 'Upload Images'}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop images here, or tap to select files
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Supports: JPEG, PNG, GIF, WebP (Max 10MB each)
            </p>
          </div>

          {/* File Previews */}
          {previewUrls.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <h4 className="font-medium text-sm md:text-base">Selected Images ({uploadedFiles.length})</h4>
                <Button variant="outline" size="sm" onClick={clearFiles} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-16 md:h-20 object-cover rounded border"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => {
                          const newFiles = uploadedFiles.filter((_, i) => i !== index)
                          const newUrls = previewUrls.filter((_, i) => i !== index)
                          URL.revokeObjectURL(url)
                          setUploadedFiles(newFiles)
                          setPreviewUrls(newUrls)
                        }}
                        className="text-white hover:text-red-300"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {uploadedFiles[index].name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter image title"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {imageCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter image description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  value={formData.altText}
                  onChange={(e) => setFormData(prev => ({ ...prev, altText: e.target.value }))}
                  placeholder="Alt text for accessibility (optional)"
                />
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={uploading || !formData.title || !formData.category}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading to Google Drive...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {uploadedFiles.length} Image{uploadedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Existing Images ({existingImages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {existingImages.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No images uploaded yet</p>
              <p className="text-sm text-gray-400">Upload your first image above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingImages
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-video relative group">
                      <img
                        src={image.imageUrl}
                        alt={image.altText || image.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Section image failed to load:', image.imageUrl)
                          // If it's a Google Drive proxy URL that failed, try the direct Google Drive URL
                          if (image.imageUrl.includes('/api/proxy/gdrive?id=')) {
                            const fileId = image.imageUrl.split('id=')[1]
                            const fallbackUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
                            e.currentTarget.src = fallbackUrl
                          }
                        }}
                        onLoad={() => {
                          console.log('Section image loaded successfully:', image.imageUrl)
                        }}
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
                                alt={image.altText || image.title}
                                className="w-full max-h-[70vh] object-contain rounded-lg"
                                onError={(e) => {
                                  console.error('Modal image failed to load:', image.imageUrl)
                                  // If it's a Google Drive proxy URL that failed, try the direct Google Drive URL
                                  if (image.imageUrl.includes('/api/proxy/gdrive?id=')) {
                                    const fileId = image.imageUrl.split('id=')[1]
                                    const fallbackUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
                                    e.currentTarget.src = fallbackUrl
                                  }
                                }}
                              />
                              {image.description && (
                                <p className="text-gray-600">{image.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{image.category}</Badge>
                                {!image.isActive && (
                                  <Badge variant="destructive">Inactive</Badge>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
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
                      <h4 className="font-medium text-sm truncate">{image.title}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline" className="text-xs">
                          {image.category}
                        </Badge>
                        {!image.isActive && (
                          <Badge variant="destructive" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {image.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

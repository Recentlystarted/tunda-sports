'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, Link, Folder, Image as ImageIcon, X, Plus, Eye, Trash2, Download, Grid, List, Search, Filter, Tag, ExternalLink, CheckCircle, AlertCircle, RefreshCw, Move, Copy, Edit3, EyeOff, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface ImageItem {
  id: string
  url: string
  title: string
  description?: string
  category: 'TOURNAMENTS' | 'FACILITIES' | 'GALLERY' | 'EVENTS' | 'TEAMS'
  storageType: 'LOCAL' | 'URL' | 'GOOGLE_DRIVE'
  fileName?: string
  fileSize?: number
  uploadedAt: string
  uploadedBy?: string
  isVisible: boolean
  sortOrder: number
  tags: string[]
  thumbnailUrl?: string
  googleDriveData?: {
    folderId?: string
    folderName?: string
    imageCount?: number
  }
}

interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  preview?: string
}

export default function ImageManager() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url' | 'gdrive'>('file')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    hasMore: false
  })
  const [uploadedImages, setUploadedImages] = useState<ImageItem[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GALLERY' as 'TOURNAMENTS' | 'FACILITIES' | 'GALLERY' | 'EVENTS' | 'TEAMS',
    tags: '',
    url: '',
    gdriveLink: '',
    files: null as FileList | null
  })

  const categories = [
    { value: 'ALL', label: 'All Images' },
    { value: 'TOURNAMENTS', label: 'Tournaments' },
    { value: 'FACILITIES', label: 'Facilities' },
    { value: 'GALLERY', label: 'General Gallery' },
    { value: 'EVENTS', label: 'Events' },
    { value: 'TEAMS', label: 'Teams' }
  ]

  const storageTypeLabels = {
    LOCAL: 'Device Upload',
    URL: 'Direct Link',
    GOOGLE_DRIVE: 'Google Drive'
  }

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  useEffect(() => {
    loadImages()
  }, [selectedCategory, searchTerm, pagination.page])

  const loadImages = async (append = false) => {
    try {
      if (!append) setIsLoading(true)
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: ((pagination.page - 1) * pagination.limit).toString()
      })
      
      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory)
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      const response = await fetch(`/api/images?${params}`)
      const data = await response.json()

      if (response.ok && data.success) {
        const newImages = data.images.map((img: any) => ({
          ...img,
          tags: img.tags || []
        }))
        
        setImages(append ? [...images, ...newImages] : newImages)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        }))
      } else {
        setError(data.error || 'Failed to load images')
      }
    } catch (error) {
      console.error('Load images error:', error)
      setError('Failed to load images')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshImages = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    loadImages()
  }

  const loadMoreImages = () => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newProgress: UploadProgress[] = []
    
    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not a valid image file`)
        continue
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large (max 10MB)`)
        continue
      }

      const preview = await createFilePreview(file)
      newProgress.push({
        file,
        progress: 0,
        status: 'pending',
        preview
      })
    }
    
    setUploadProgress(newProgress)
    setFormData(prev => ({ ...prev, files: files }))
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFilesSelected(e.dataTransfer.files)
  }, [])
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'GALLERY',
      tags: '',
      url: '',
      gdriveLink: '',
      files: null
    })
    setUploadProgress([])
    setUploadedImages([])
    setError('')
    setSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileUpload = async () => {
    if (!formData.files || formData.files.length === 0) {
      setError('Please select files to upload')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a title')
      return
    }

    try {
      setIsUploading(true)
      setError('')
      
      const uploadPromises = Array.from(formData.files).map(async (file, index) => {
        const uploadData = new FormData()
        uploadData.append('file', file)
        uploadData.append('title', `${formData.title}${formData.files!.length > 1 ? ` (${index + 1})` : ''}`)
        uploadData.append('description', formData.description)
        uploadData.append('category', formData.category)
        uploadData.append('tags', formData.tags)

        // Update progress for this file
        setUploadProgress(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'uploading' as const } : item
        ))

        try {
          const response = await fetch('/api/images/upload', {
            method: 'POST',
            body: uploadData,
          })

          if (response.ok) {
            setUploadProgress(prev => prev.map((item, i) => 
              i === index ? { ...item, status: 'completed' as const, progress: 100 } : item
            ))
            return true
          } else {
            const errorData = await response.json()
            setUploadProgress(prev => prev.map((item, i) => 
              i === index ? { ...item, status: 'error' as const, error: errorData.error || 'Upload failed' } : item
            ))
            return false
          }
        } catch (error) {
          setUploadProgress(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'error' as const, error: 'Network error' } : item
          ))
          return false
        }
      })

      const results = await Promise.all(uploadPromises)
      const successCount = results.filter(Boolean).length
      const failureCount = results.length - successCount

      if (successCount > 0) {
        setSuccess(`Successfully uploaded ${successCount} image(s)${failureCount > 0 ? ` (${failureCount} failed)` : ''}`)
        
        // Immediately show uploaded images
        const newImages: ImageItem[] = []
        uploadProgress.forEach((item, index) => {
          if (results[index]) {
            newImages.push({
              id: `temp-${Date.now()}-${index}`,
              url: item.preview || '',
              title: formData.title || item.file.name,
              description: formData.description,
              category: formData.category,
              storageType: 'LOCAL',
              fileName: item.file.name,
              fileSize: item.file.size,
              uploadedAt: new Date().toISOString(),
              isVisible: true,
              sortOrder: 0,
              tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            })
          }
        })
        setUploadedImages(newImages)
        
        resetForm()
        loadImages()
        
        // Close dialog after delay if all succeeded
        if (failureCount === 0) {
          setTimeout(() => {
            setIsUploadDialogOpen(false)
            setUploadedImages([])
          }, 2000)
        }
      } else {
        setError('All uploads failed')
      }
    } catch (error) {
      setError('Upload error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlUpload = async () => {
    if (!formData.url.trim()) {
      setError('Please enter an image URL')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a title')
      return
    }

    try {
      setIsUploading(true)
      setError('')

      const response = await fetch('/api/images/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formData.url,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)        }),
      })

      if (response.ok) {
        setSuccess('Image added successfully')
        
        // Immediately show the uploaded image
        const newImage: ImageItem = {
          id: `temp-url-${Date.now()}`,
          url: formData.url,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          storageType: 'URL',
          uploadedAt: new Date().toISOString(),
          isVisible: true,
          sortOrder: 0,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        }
        setUploadedImages([newImage])
        
        resetForm()
        loadImages()
        
        setTimeout(() => {
          setIsUploadDialogOpen(false)
          setUploadedImages([])
        }, 2000)
      } else {
        setError('Failed to add image')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  const handleGoogleDriveUpload = async () => {
    if (!formData.gdriveLink.trim()) {
      setError('Please enter a Google Drive link')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a title for this collection')
      return
    }

    try {
      setIsUploading(true)
      setError('')

      // Extract folder ID from Google Drive link
      const match = formData.gdriveLink.match(/\/folders\/([a-zA-Z0-9-_]+)/)
      if (!match) {
        setError('Invalid Google Drive folder link. Please use a folder sharing link.')
        return
      }

      const folderId = match[1]

      const response = await fetch('/api/images/google-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId,
          folderLink: formData.gdriveLink,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Successfully connected Google Drive folder with ${data.imageCount} images`)
        resetForm()
        setIsUploadDialogOpen(false)
        loadImages()
      } else {
        setError(data.error || 'Failed to connect Google Drive folder')
      }
    } catch (error) {
      setError('Failed to process Google Drive link')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpload = () => {
    switch (uploadMethod) {
      case 'file':
        return handleFileUpload()
      case 'url':
        return handleUrlUpload()
      case 'gdrive':
        return handleGoogleDriveUpload()
    }
  }

  const deleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Image deleted successfully')
        loadImages()
      } else {
        setError('Failed to delete image')
      }
    } catch (error) {
      setError('Failed to delete image')
    }
  }

  const toggleImageVisibility = async (id: string, isVisible: boolean) => {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVisible: !isVisible })
      })

      if (response.ok) {
        setSuccess(`Image ${!isVisible ? 'shown' : 'hidden'} successfully`)
        loadImages()
      } else {
        setError('Failed to update image visibility')
      }
    } catch (error) {
      setError('Failed to update image')
    }
  }

  const ImageCard = ({ image }: { image: ImageItem }) => (
    <Card className="group relative overflow-hidden">
      <div className="aspect-square relative">
        <img 
          src={image.thumbnailUrl || image.url} 
          alt={image.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => window.open(image.url, '_blank')}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => toggleImageVisibility(image.id, image.isVisible)}>
            {image.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteImage(image.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {!image.isVisible && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">Hidden</Badge>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-white/90">
            {storageTypeLabels[image.storageType]}
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{image.title}</h3>
        <p className="text-xs text-gray-600 truncate">{image.description}</p>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-xs">
            {categories.find(c => c.value === image.category)?.label}
          </Badge>
          {image.tags.length > 0 && (
            <div className="flex gap-1">
              {image.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {image.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{image.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading && images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="mt-2 text-gray-600">Loading images...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Image Management</h2>
          <p className="text-gray-600">Upload and manage images for your website</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshImages} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>          <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
            setIsUploadDialogOpen(open)
            if (open) {
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Images
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Images</DialogTitle>
                <DialogDescription>
                  Upload files or add images via URL
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Files
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Image URL
                  </TabsTrigger>
                </TabsList>
                
                {/* Google Drive Option - Less Prominent */}
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUploadMethod('gdrive')}
                    className={`text-xs ${uploadMethod === 'gdrive' ? 'bg-blue-50 border-blue-300' : ''}`}
                  >
                    <Folder className="h-3 w-3 mr-1" />
                    Or import from Google Drive
                  </Button>
                </div>

                <div className="space-y-4 mt-4">                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Show Uploaded Images Immediately */}
                  {uploadedImages.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Successfully Uploaded!</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={img.url} 
                              alt={img.title}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded">
                              <div className="hidden group-hover:flex items-center justify-center h-full">
                                <span className="text-white text-xs text-center px-2">{img.title}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-green-700">
                        <strong>Where to find these images:</strong>
                        <ul className="mt-1 space-y-1 text-xs">
                          <li>• <strong>Gallery:</strong> Will appear in the main gallery section</li>
                          <li>• <strong>Homepage:</strong> {uploadedImages[0]?.category === 'TOURNAMENTS' ? 'Tournament images will be featured on homepage' : 'May appear on homepage based on category'}</li>
                          <li>• <strong>Category:</strong> Filed under "{categories.find(c => c.value === uploadedImages[0]?.category)?.label}"</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Common Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter image title"
                      />
                    </div>
                    <div>                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.slice(1).map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.category === 'TOURNAMENTS' && '📸 Will appear in tournaments section and may be featured on homepage'}
                        {formData.category === 'FACILITIES' && '🏏 Will appear in facilities gallery'}
                        {formData.category === 'GALLERY' && '🖼️ Will appear in main photo gallery'}
                        {formData.category === 'EVENTS' && '🎉 Will appear in events section'}
                        {formData.category === 'TEAMS' && '👥 Will appear in teams section'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter image description (optional)"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="cricket, tournament, 2024"
                    />
                  </div>

                  {/* Method-specific Fields */}
                  <TabsContent value="file" className="space-y-4">
                    <div>
                      <Label htmlFor="files">Select Files *</Label>
                      <div 
                        className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <Cloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Drag and drop images here, or click to select files
                        </p>
                        <Input
                          ref={fileInputRef}
                          id="files"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleFilesSelected(e.target.files)}
                          className="hidden"
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Select Files
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG, GIF, WebP • Max 10MB per file
                        </p>
                      </div>
                    </div>
                    
                    {/* Upload Progress */}
                    {uploadProgress.length > 0 && (
                      <div className="space-y-2">
                        <Label>Upload Progress</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {uploadProgress.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              {item.preview && (
                                <img 
                                  src={item.preview} 
                                  alt="Preview" 
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(item.file.size)}</p>
                                {item.status === 'error' && item.error && (
                                  <p className="text-xs text-red-600">{item.error}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                {item.status === 'uploading' && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="url">Image URL *</Label>
                      <Input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a direct link to an image file
                      </p>
                    </div>
                    {formData.url && (
                      <div className="bg-gray-50 p-3 rounded">
                        <img 
                          src={formData.url} 
                          alt="Preview" 
                          className="max-w-full h-32 object-cover rounded mx-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling!.classList.remove('hidden')
                          }}
                        />
                        <div className="hidden text-sm text-red-600 text-center mt-2">Failed to load image preview</div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="gdrive" className="space-y-4">
                    <div>
                      <Label htmlFor="gdriveLink">Google Drive Folder Link *</Label>
                      <Input
                        id="gdriveLink"
                        type="url"
                        value={formData.gdriveLink}
                        onChange={(e) => setFormData(prev => ({ ...prev, gdriveLink: e.target.value }))}
                        placeholder="https://drive.google.com/drive/folders/1ABC..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Make sure the folder is publicly accessible or shared with link
                      </p>
                    </div>
                    <Alert>
                      <Folder className="h-4 w-4" />
                      <AlertDescription>
                        <strong>How to share Google Drive folder:</strong><br />
                        1. Open Google Drive and select your folder<br />
                        2. Right-click → Share → Change to "Anyone with the link"<br />
                        3. Set permission to "Viewer" and copy the link<br />
                        4. Paste the link above - all images will be imported
                      </AlertDescription>
                    </Alert>
                    
                    {formData.gdriveLink && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Google Drive Integration</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          This will scan the folder for images and import them automatically
                        </p>
                      </div>
                    )}                  </TabsContent>

                  {/* Submit Buttons - Always Visible */}
                  <div className="sticky bottom-0 bg-white border-t pt-4 mt-4 flex gap-2">
                    <Button 
                      onClick={handleUpload} 
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {uploadMethod === 'file' ? 'Uploading...' : 
                           uploadMethod === 'url' ? 'Adding Image...' : 'Connecting to Google Drive...'}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {uploadMethod === 'file' ? 'Upload Files' : 
                           uploadMethod === 'url' ? 'Add Image' : 'Import from Google Drive'}
                        </>
                      )}
                    </Button>                    <Button variant="outline" onClick={() => {
                      setIsUploadDialogOpen(false)
                      resetForm()
                      setUploadedImages([])
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Success/Error Messages */}
      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">
            {pagination.total} image{pagination.total !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'ALL' 
              ? 'Try adjusting your search or filters' 
              : 'Start by uploading some images'}
          </p>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Image
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
            : 'space-y-4'
        }>
          {images.map((image) => (
            <ImageCard key={image.id} image={image} />
          ))}
        </div>
      )}

      {/* Load More */}
      {pagination.hasMore && (
        <div className="flex justify-center pt-6">
          <Button variant="outline" onClick={loadMoreImages} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading...
              </>
            ) : (
              'Load More Images'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

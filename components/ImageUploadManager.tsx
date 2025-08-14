'use client'

import { useState } from 'react'
import { Upload, Link, Image, X, Check, AlertCircle, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ImageUploadProps {
  onImageAdded: (image: any) => void
  category?: string
}

export default function ImageUploadManager({ onImageAdded, category }: ImageUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url' | 'gdrive'>('file')
  const [uploading, setUploading] = useState(false)
  const [imageData, setImageData] = useState({
    title: '',
    description: '',
    category: category || 'GENERAL',
    tags: '',
    isPublic: true
  })
  const [imageUrl, setImageUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const categories = [
    { value: 'FACILITIES', label: 'Ground & Facilities' },
    { value: 'TOURNAMENTS', label: 'Tournaments' },
    { value: 'EVENTS', label: 'Events & Celebrations' },
    { value: 'TRAINING', label: 'Training Sessions' },
    { value: 'COMMUNITY', label: 'Community Activities' },
    { value: 'AWARDS', label: 'Awards & Trophies' },
    { value: 'PLAYERS', label: 'Players & Teams' },
    { value: 'GENERAL', label: 'General Photos' }
  ]

  const storageOptions = [
    { 
      value: 'GOOGLE_DRIVE', 
      label: 'Google Drive (15GB Free)',
      description: 'Recommended for long-term storage',
      icon: FolderOpen,
      cost: 'FREE (15GB)'
    },
    { 
      value: 'URL', 
      label: 'External URL',
      description: 'Link to existing image online',
      icon: Link,
      cost: 'FREE'
    },
    { 
      value: 'LOCAL', 
      label: 'Server Storage',
      description: 'Upload to your server',
      icon: Upload,
      cost: 'VPS Storage'
    }
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      // Auto-fill title from filename
      if (!imageData.title) {
        const filename = file.name.replace(/\.[^/.]+$/, "") // Remove extension
        setImageData(prev => ({ ...prev, title: filename }))
      }
    }
  }

  const handleUrlChange = (url: string) => {
    setImageUrl(url)
    setPreviewUrl(url)
  }

  const handleSubmit = async () => {
    setUploading(true)
    
    try {
      let finalImageUrl = ''
      let storageType = 'URL'

      if (uploadMethod === 'file' && selectedFile) {
        // Handle file upload
        if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
          alert('File size too large. Please choose a file under 10MB.')
          setUploading(false)
          return
        }

        // For now, we'll implement local storage
        // TODO: Add Google Drive upload logic
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', imageData.title)
        formData.append('category', imageData.category)
        
        // This would be your upload API endpoint
        // const response = await fetch('/api/upload', { method: 'POST', body: formData })
        // const result = await response.json()
        // finalImageUrl = result.url
        
        // For demo, use the preview URL
        finalImageUrl = previewUrl
        storageType = 'LOCAL'
        
      } else if (uploadMethod === 'url') {
        finalImageUrl = imageUrl
        storageType = 'URL'
      }

      const newImage = {
        url: finalImageUrl,
        title: imageData.title,
        description: imageData.description,
        category: imageData.category,
        tags: imageData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        storageType,
        uploadedAt: new Date().toISOString(),
        isPublic: imageData.isPublic
      }

      onImageAdded(newImage)
      
      // Reset form
      setImageData({ title: '', description: '', category: 'GENERAL', tags: '', isPublic: true })
      setImageUrl('')
      setSelectedFile(null)
      setPreviewUrl('')
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Upload Tournament Images
        </CardTitle>
        <CardDescription>
          Add photos to your gallery. Choose between file upload, URL links, or Google Drive integration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Storage Options Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Storage Recommendation:</strong> Use Google Drive for unlimited storage at low cost. 
            15GB free → $2/month for 100GB → Perfect for tournament photos!
          </AlertDescription>
        </Alert>

        {/* Upload Method Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Choose Upload Method</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {storageOptions.map((option) => (
              <div
                key={option.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  uploadMethod === option.value.toLowerCase().replace('_', '') 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setUploadMethod(option.value.toLowerCase().replace('_', '') as any)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <option.icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{option.label}</span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{option.description}</p>
                <p className="text-xs font-medium text-green-600">{option.cost}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Interface */}
        <Tabs value={uploadMethod} className="w-full">
          
          {/* File Upload */}
          <TabsContent value="file" className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Select Image File</Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: JPG, PNG, WebP. Max size: 10MB
              </p>
            </div>
          </TabsContent>

          {/* URL Input */}
          <TabsContent value="url" className="space-y-4">
            <div>
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Direct link to an image (Google Drive, Imgur, etc.)
              </p>
            </div>
          </TabsContent>

          {/* Google Drive */}
          <TabsContent value="gdrive" className="space-y-4">
            <Alert>
              <FolderOpen className="h-4 w-4" />
              <AlertDescription>
                <strong>Google Drive Integration:</strong> Upload to Google Drive first, then paste the public sharing link here.
                <br />
                <small>Coming soon: Direct Google Drive upload from admin panel!</small>
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="gdrive-url">Google Drive Share Link</Label>
              <Input
                id="gdrive-url"
                type="url"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Image Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-48 mx-auto rounded"
                onError={() => setPreviewUrl('')}
              />
            </div>
          </div>
        )}

        {/* Image Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Image Title</Label>
            <Input
              id="title"
              value={imageData.title}
              onChange={(e) => setImageData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Tournament Victory 2024"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={imageData.category} onValueChange={(value) => setImageData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={imageData.description}
            onChange={(e) => setImageData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe this image..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input
            id="tags"
            value={imageData.tags}
            onChange={(e) => setImageData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="cricket, tournament, victory, 2024"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate tags with commas for better searchability
          </p>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={uploading || (!selectedFile && !imageUrl) || !imageData.title}
          className="w-full"
        >
          {uploading ? (
            <>Uploading...</>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Add Image to Gallery
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

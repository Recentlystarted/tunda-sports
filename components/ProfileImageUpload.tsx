'use client'

import { useState, useRef } from 'react'
import { Upload, X, User, Loader2, Check, AlertCircle, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ProfileImageUploadProps {
  currentImageUrl?: string
  onImageUploaded: (imageUrl: string) => void
  onUploadStateChange?: (isUploading: boolean) => void
  personName?: string
}

export default function ProfileImageUpload({ 
  currentImageUrl, 
  onImageUploaded, 
  onUploadStateChange,
  personName 
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '')
  const [urlInput, setUrlInput] = useState(currentImageUrl || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsFileDialogOpen(false) // File dialog closed
    onUploadStateChange?.(false) // Allow dialog to close again
    
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    onUploadStateChange?.(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('category', 'PLAYER') // Use valid enum value
      formData.append('title', `Profile image for ${personName || 'user'}`)
      formData.append('altText', `Profile photo of ${personName || 'user'}`)

      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      const imageUrl = data.imageUrl || data.url
      
      setPreviewUrl(imageUrl)
      onImageUploaded(imageUrl)
      
      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      onUploadStateChange?.(false)
    }
  }

  const handleUrlSubmit = () => {
    if (!urlInput) {
      toast({
        title: "No URL provided",
        description: "Please enter an image URL",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    try {
      new URL(urlInput)
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      })
      return
    }

    setPreviewUrl(urlInput)
    onImageUploaded(urlInput)
    
    toast({
      title: "Success",
      description: "Profile image URL updated successfully",
    })
  }

  const handleRemoveImage = () => {
    setPreviewUrl('')
    setUrlInput('')
    setSelectedFile(null)
    onImageUploaded('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <Label className="text-base font-medium">Profile Image</Label>
      
      {/* Current Image Preview */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-muted rounded-full border-2 border-border overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', previewUrl)
                  // If it's a Google Drive proxy URL that failed, try the direct Google Drive URL
                  if (previewUrl.includes('/api/proxy/gdrive?id=')) {
                    const fileId = previewUrl.split('id=')[1]
                    const fallbackUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
                    e.currentTarget.src = fallbackUrl
                  } else {
                    // Instead of clearing the preview, show a default avatar
                    e.currentTarget.style.display = 'none'
                    const parentDiv = e.currentTarget.parentElement
                    if (parentDiv) {
                      parentDiv.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-muted-foreground bg-muted rounded-full">
                          <svg class="h-8 w-8 md:h-12 md:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        </div>
                      `
                    }
                    toast({
                      title: "Image load failed",
                      description: "Using default avatar instead",
                      variant: "destructive",
                    })
                  }
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', previewUrl)
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <User className="h-8 w-8 md:h-12 md:w-12" />
              </div>
            )}
          </div>
          {previewUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              className="mt-2 w-full"
              type="button"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>

        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'url')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload File</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Image URL</span>
                <span className="sm:hidden">URL</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-3 mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsFileDialogOpen(true)
                  onUploadStateChange?.(true) // Prevent dialog close
                  
                  // Handle file dialog cancel
                  const fileInput = fileInputRef.current
                  if (fileInput) {
                    fileInput.click()
                    
                    // Add event listener for when dialog closes without selection
                    const handleFocus = () => {
                      setTimeout(() => {
                        if (!fileInput.files?.length) {
                          // No file selected, user cancelled
                          setIsFileDialogOpen(false)
                          onUploadStateChange?.(false)
                        }
                      }, 100)
                      window.removeEventListener('focus', handleFocus)
                    }
                    window.addEventListener('focus', handleFocus)
                  }
                }}
                disabled={uploading}
                className="w-full"
                type="button"
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? selectedFile.name : 'Choose Image File'}
              </Button>
              
              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                  type="button"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              )}
              
              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, GIF. Max size: 5MB. Images will be stored securely on Google Drive.
              </p>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-3 mt-4">
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full"
              />
              
              <Button
                onClick={handleUrlSubmit}
                variant="outline"
                className="w-full"
                type="button"
              >
                <Check className="h-4 w-4 mr-2" />
                Use This URL
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Enter the URL of an image hosted elsewhere. Make sure the URL is publicly accessible.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

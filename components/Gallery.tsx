"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Camera, Image, Download, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApiData } from '@/hooks/usePerformance'

interface GalleryImage {
  id: string
  title: string
  imageUrl: string
  altText?: string
  category?: string
  createdAt?: string
}

interface GallerySection {
  id: string
  title: string
  subtitle: string
  content: string
  images: GalleryImage[]
}

export default function Gallery() {
  // All hooks must be called in the same order every time - no conditional hooks
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [imageLoadStates, setImageLoadStates] = useState<{[key: string]: 'loading' | 'loaded' | 'error'}>({})

  // Touch gesture state for mobile swipe
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Use optimized API data fetching with caching
  const { 
    data: apiData, 
    loading, 
    error, 
    refetch 
  } = useApiData<{success: boolean, sections: any[]}>('/api/landing/sections', {
    cacheKey: 'gallery-sections',
    cacheTTL: 10 * 60 * 1000 // 10 minutes cache
  })

  // Always calculate these values, even if apiData is null
  const gallerySection = useMemo(() => {
    return apiData?.success ? 
      apiData.sections.find(section => section.sectionType === 'GALLERY_SHOWCASE') : null
  }, [apiData])

  const images: GalleryImage[] = useMemo(() => {
    return gallerySection?.images || []
  }, [gallerySection])

  const imagesLength = images.length

  // Memoize gallery stats to prevent recalculation on every render
  const galleryStats = useMemo(() => {
    const totalImages = images.length
    
    // Get unique categories
    const categories = new Set(images.map((img: GalleryImage) => img.category).filter(Boolean))
    
    // Get latest year from image upload dates
    const years = images
      .map((img: GalleryImage) => img.createdAt ? new Date(img.createdAt).getFullYear() : new Date().getFullYear())
      .filter((year: number) => !isNaN(year))
    
    const latestYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear()

    return {
      totalImages,
      categories: categories.size || 1, // Default to 1 if no categories
      latestYear
    }
  }, [images])

  // Image viewer functions using useCallback to ensure stable references
  const openImageViewer = useCallback((index: number) => {
    setSelectedImageIndex(index)
  }, [])

  const closeImageViewer = useCallback(() => {
    setSelectedImageIndex(null)
  }, [])

  const nextImage = useCallback(() => {
    if (imagesLength > 0 && selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % imagesLength)
    }
  }, [imagesLength, selectedImageIndex])

  const prevImage = useCallback(() => {
    if (imagesLength > 0 && selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + imagesLength) % imagesLength)
    }
  }, [imagesLength, selectedImageIndex])

  // Handle touch gestures for mobile swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && selectedImageIndex !== null) {
      nextImage()
    }
    if (isRightSwipe && selectedImageIndex !== null) {
      prevImage()
    }
  }, [touchStart, touchEnd, selectedImageIndex, nextImage, prevImage])

  const downloadImage = useCallback(async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      // Fallback: open image in new tab
      window.open(imageUrl, '_blank')
    }
  }, [])

  const handleImageLoad = useCallback((imageId: string) => {
    setImageLoadStates(prev => ({ ...prev, [imageId]: 'loaded' }))
  }, [])

  const handleImageError = useCallback((imageId: string, element: HTMLImageElement, title: string) => {
    setImageLoadStates(prev => ({ ...prev, [imageId]: 'error' }))
    element.src = `https://via.placeholder.com/400x300/cccccc/666666?text=${encodeURIComponent(title || 'Image')}`
  }, [])

  // All useEffect hooks must be called in the same order every time
  // Preload images effect - always called
  useEffect(() => {
    if (images.length > 0) {
      images.slice(0, 4).forEach((image: GalleryImage) => {
        const img = document.createElement('img')
        img.src = image.imageUrl
      })
    }
  }, [images])

  // Keyboard navigation for image viewer - always called
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex !== null) {
        if (e.key === 'ArrowLeft') prevImage()
        if (e.key === 'ArrowRight') nextImage()
        if (e.key === 'Escape') closeImageViewer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImageIndex, prevImage, nextImage, closeImageViewer])

  // IMPORTANT: All conditional rendering must come AFTER all hooks
  if (loading) {
    return (
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse text-muted-foreground">Loading gallery...</div>
        </div>
      </section>
    )
  }

  if (!gallerySection) {
    return null
  }

  return (
    <>
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              🏏 {gallerySection.title}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {gallerySection.subtitle}
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              {gallerySection.content}
            </p>
            
            {/* Dynamic Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="text-center border-border bg-card">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">{galleryStats.totalImages}</div>
                  <div className="text-sm text-muted-foreground">Photos</div>
                </CardContent>
              </Card>
              <Card className="text-center border-border bg-card">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-secondary-foreground">{galleryStats.categories}</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </CardContent>
              </Card>
              <Card className="text-center border-border bg-card">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-accent-foreground">{galleryStats.latestYear}</div>
                  <div className="text-sm text-muted-foreground">Latest Year</div>
                </CardContent>
              </Card>
              <Card className="text-center border-border bg-card">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">HD</div>
                  <div className="text-sm text-muted-foreground">Quality</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Gallery Grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {images.map((image: GalleryImage, index: number) => (
                <Card key={image.id || index} className="group hover:shadow-xl transition-all duration-300 border-border bg-card overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden">
                      {/* Loading placeholder */}
                      {imageLoadStates[image.id] !== 'loaded' && (
                        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      <img
                        src={image.imageUrl}
                        alt={image.altText || image.title || `Gallery image ${index + 1}`}
                        className={`w-full h-full object-cover transition-all duration-300 cursor-pointer ${
                          imageLoadStates[image.id] === 'loaded' 
                            ? 'group-hover:scale-110 opacity-100' 
                            : 'opacity-0'
                        }`}
                        onClick={() => openImageViewer(index)}
                        onLoad={() => handleImageLoad(image.id)}
                        onError={(e) => handleImageError(image.id, e.target as HTMLImageElement, image.title)}
                        loading="lazy"
                      />
                      
                      {/* Professional overlay with better mobile support */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end p-3 md:justify-center">
                        <div className="text-white text-center space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="hidden md:flex items-center justify-center mb-2">
                            <ZoomIn className="h-6 w-6 md:h-8 md:w-8" />
                          </div>
                          <p className="text-xs md:text-sm font-medium px-2 line-clamp-2">{image.title}</p>
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 md:h-8 px-2 md:px-3 text-xs backdrop-blur-sm bg-white/20 border-white/30 text-white hover:bg-white/30"
                              onClick={(e) => {
                                e.stopPropagation()
                                openImageViewer(index)
                              }}
                            >
                              <ZoomIn className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 md:h-8 px-2 md:px-3 text-xs backdrop-blur-sm bg-black/20 border-white/30 text-white hover:bg-black/30"
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadImage(image.imageUrl, image.title)
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Save</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Images Yet</h3>
              <p className="text-muted-foreground">Gallery images will appear here once they are uploaded.</p>
            </div>
          )}
        </div>
      </section>

      {/* Full Screen Image Viewer */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <Dialog open={true} onOpenChange={closeImageViewer}>
          <DialogContent 
            className="max-w-7xl w-full h-full max-h-screen p-0 bg-black/95 border-0 [&>button]:hidden"
            aria-describedby="gallery-description"
          >
            <DialogTitle className="sr-only">
              Image Gallery Viewer - {images[selectedImageIndex].title}
            </DialogTitle>
            <DialogDescription id="gallery-description" className="sr-only">
              Viewing image {selectedImageIndex + 1} of {images.length} in the gallery. 
              Use arrow keys or navigation buttons to browse images.
            </DialogDescription>
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button - Custom positioned */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 md:top-4 md:right-4 z-50 text-white hover:bg-white/20 backdrop-blur-sm bg-black/20 rounded-full h-10 w-10 md:h-12 md:w-12"
                onClick={closeImageViewer}
                aria-label="Close image viewer"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </Button>

              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 backdrop-blur-sm bg-black/20 rounded-full h-10 w-10 md:h-12 md:w-12"
                    onClick={prevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 backdrop-blur-sm bg-black/20 rounded-full h-10 w-10 md:h-12 md:w-12"
                    onClick={nextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
                  </Button>
                </>
              )}

              {/* Main Image */}
              <div 
                className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={images[selectedImageIndex].imageUrl}
                  alt={images[selectedImageIndex].altText || images[selectedImageIndex].title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl touch-none select-none"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement
                    img.src = `https://via.placeholder.com/800x600/cccccc/666666?text=${encodeURIComponent(images[selectedImageIndex].title || 'Image')}`
                  }}
                  draggable={false}
                />
              </div>

              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
                <div className="text-center text-white">
                  <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">
                    {images[selectedImageIndex].title}
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-sm">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      {selectedImageIndex + 1} of {images.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-4 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                      onClick={() => downloadImage(images[selectedImageIndex].imageUrl, images[selectedImageIndex].title)}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

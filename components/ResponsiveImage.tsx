'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface ResponsiveImageProps {
  src: string
  alt: string
  fallbackSrc?: string
  className?: string
  aspectRatio?: 'square' | 'landscape' | 'portrait' | string
  onClick?: () => void
  loading?: 'lazy' | 'eager'
  quality?: number
  priority?: boolean
}

export default function ResponsiveImage({
  src,
  alt,
  fallbackSrc,
  className = '',
  aspectRatio = 'landscape',
  onClick,
  loading = 'lazy',
  priority = false
}: ResponsiveImageProps) {
  const [imageState, setImageState] = useState<{
    loading: boolean
    error: boolean
    currentSrc: string
  }>({
    loading: true,
    error: false,
    currentSrc: src
  })
  
  const imgRef = useRef<HTMLImageElement>(null)
  const [isInView, setIsInView] = useState(!loading || priority)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, loading])

  // Handle image loading
  useEffect(() => {
    if (!isInView) return

    setImageState(prev => ({ ...prev, loading: true, error: false }))
    
    const img = new Image()
    
    img.onload = () => {
      setImageState(prev => ({ 
        ...prev, 
        loading: false, 
        error: false 
      }))
    }
    
    img.onerror = () => {
      if (fallbackSrc && src !== fallbackSrc) {
        setImageState(prev => ({ 
          ...prev, 
          currentSrc: fallbackSrc,
          loading: true,
          error: false 
        }))
        
        // Try loading fallback
        const fallbackImg = new Image()
        fallbackImg.onload = () => {
          setImageState(prev => ({ 
            ...prev, 
            loading: false, 
            error: false 
          }))
        }
        fallbackImg.onerror = () => {
          setImageState(prev => ({ 
            ...prev, 
            loading: false, 
            error: true 
          }))
        }
        fallbackImg.src = fallbackSrc
      } else {
        setImageState(prev => ({ 
          ...prev, 
          loading: false, 
          error: true 
        }))
      }
    }
    
    img.src = src
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, fallbackSrc, isInView])

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square'
      case 'landscape': return 'aspect-[4/3]'
      case 'portrait': return 'aspect-[3/4]'
      default: return aspectRatio
    }
  }

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden bg-muted ${getAspectRatioClass()} ${className}`}
      onClick={onClick}
    >
      {/* Loading placeholder */}
      {(imageState.loading || !isInView) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          {isInView ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <div className="h-6 w-6 bg-muted-foreground/20 rounded animate-pulse" />
          )}
        </div>
      )}
      
      {/* Error placeholder */}
      {imageState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm">Image unavailable</div>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      {isInView && !imageState.error && (
        <img
          src={imageState.currentSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageState.loading ? 'opacity-0' : 'opacity-100'
          } ${onClick ? 'cursor-pointer' : ''}`}
          onLoad={() => setImageState(prev => ({ ...prev, loading: false }))}
          onError={() => setImageState(prev => ({ ...prev, error: true }))}
          draggable={false}
        />
      )}
    </div>
  )
}

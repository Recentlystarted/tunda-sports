'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Play, Award, Users, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroSection {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  bannerImage?: string;
  backgroundImage?: string;
  isActive: boolean;
  images?: Array<{
    id: string;
    imageUrl: string;
    isActive: boolean;
  }>;
}

export default function HeroEnhanced() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null)
  const [loading, setLoading] = useState(true)

  // Fallback hero images from Google Drive and local sources
  const fallbackHeroImages = [
    'https://lh3.googleusercontent.com/p/AF1QipOL2oEJhUIF4cBEcB6r8Lw1WayUSE7CqzNsJEIm=w2000-h1200-k-no', // Real Tunda Cricket Ground
    '/images/cricket-ground-sunrise.jpg',
    '/images/tunda-ground-panorama.jpg'
  ]

  useEffect(() => {
    fetchHeroContent()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % getHeroImages().length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroSection])

  const fetchHeroContent = async () => {
    try {
      const response = await fetch('/api/landing/sections?sectionType=HERO_BANNER&activeOnly=true')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.sections.length > 0) {
          setHeroSection(data.sections[0])
        }
      }
    } catch (error) {
      console.error('Error fetching hero content:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHeroImages = () => {
    const images = []
    
    // Add images from hero section if available
    if (heroSection?.bannerImage) {
      images.push(heroSection.bannerImage)
    }
    if (heroSection?.backgroundImage) {
      images.push(heroSection.backgroundImage)
    }
    
    // Add section images
    if (heroSection?.images && heroSection.images.length > 0) {
      heroSection.images.forEach(img => {
        if (img.isActive) {
          images.push(img.imageUrl)
        }
      })
    }
    
    // Use fallback images if no images from database
    if (images.length === 0) {
      return fallbackHeroImages
    }
    
    return images
  }

  const stats = [
    { icon: Award, label: 'Years Serving', value: '10+' },
    { icon: Users, label: 'Local Players', value: '200+' },
    { icon: MapPin, label: 'Village Location', value: 'Tunda, Kutch' },
  ]

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </section>
    )
  }

  const heroImages = getHeroImages()
  const title = heroSection?.title || 'Welcome to Tunda Sports Club'
  const subtitle = heroSection?.subtitle || 'Your local cricket ground in the heart of Tunda village, Kutch district. Where community spirit meets the love of cricket.'
  const content = heroSection?.content

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Slider */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url('${image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-6 md:space-y-8">
          {/* Main Heading */}
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
              {title.includes('Tunda Sports Club') ? (
                <>
                  <span className="text-foreground">Welcome to</span>
                  <span className="block text-primary">
                    Tunda Sports Club
                  </span>
                </>
              ) : (
                <span className="text-primary">
                  {title}
                </span>
              )}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto px-4">
              {subtitle}
            </p>
            {content && (
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto px-4">
                {content}
              </p>
            )}
          </div>

          {/* CTA Buttons */}
          {/* <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4">
            <Button size="lg" className="w-full sm:w-auto group">
              <Play className="h-4 w-4 md:h-5 md:w-5 mr-2 group-hover:animate-pulse" />
              Book Your Game
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-foreground text-foreground hover:bg-foreground hover:text-background">
              View Tournaments
            </Button>
          </div> */}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-8 md:mt-16 px-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-background/10 backdrop-blur-md rounded-lg md:rounded-xl p-4 md:p-6 border border-border/20 hover:bg-background/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center mb-3 md:mb-4">
                  <stat.icon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1 md:mb-2">{stat.value}</div>
                <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 md:h-8 md:w-8 text-foreground opacity-70" />
      </div>

      {/* Slide Indicators */}
      {heroImages.length > 1 && (
        <div className="absolute bottom-12 md:bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-foreground' : 'bg-foreground/50'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

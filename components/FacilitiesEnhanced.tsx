'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  MapPin, 
  Car, 
  Utensils, 
  WifiIcon,
  ShieldCheck,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SectionImage {
  id: string
  title: string
  description?: string
  imageUrl: string
  altText?: string
  category: string
  isActive: boolean
  sortOrder: number
}

interface LandingPageSection {
  id: string
  sectionType: string
  title: string
  subtitle?: string
  content?: string
  isActive: boolean
  sortOrder: number
  images: SectionImage[]
}

const defaultFacilities = [
  {
    icon: Users,
    title: "Professional Cricket Ground",
    description: "Full-size cricket pitch with proper boundary markings and seating arrangements for spectators.",
    features: ["22-yard pitch", "Natural turf", "Boundary ropes", "Spectator seating"]
  },
  {
    icon: Car,
    title: "Parking Facility",
    description: "Ample parking space available for players and spectators.",
    features: ["Free parking", "Secure area", "Easy access", "Well-lit"]
  },
  {
    icon: Utensils,
    title: "Refreshments",
    description: "Food and beverages available during tournaments and matches.",
    features: ["Local snacks", "Cold drinks", "Tea/Coffee", "Affordable prices"]
  },
  {
    icon: ShieldCheck,
    title: "Safe Environment",
    description: "Well-maintained ground with safety measures for all players and visitors.",
    features: ["Regular maintenance", "First aid", "Emergency contacts", "Secure premises"]
  }
]

export default function FacilitiesEnhanced() {
  const [facilitiesData, setFacilitiesData] = useState<LandingPageSection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFacilitiesData()
  }, [])

  const fetchFacilitiesData = async () => {
    try {
      const response = await fetch('/api/landing/sections?type=FACILITIES')
      if (response.ok) {
        const sections = await response.json()
        if (sections.length > 0) {
          setFacilitiesData(sections[0])
        }
      }
    } catch (error) {
      console.error('Error fetching facilities data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section id="facilities" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  const title = facilitiesData?.title || "Our Facilities"
  const subtitle = facilitiesData?.subtitle || "Everything you need for a perfect cricket experience"
  const content = facilitiesData?.content
  const sectionImages = facilitiesData?.images || []

  return (
    <section id="facilities" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            {subtitle}
          </p>
          {content && (
            <div className="mt-4 md:mt-6 text-sm md:text-base text-muted-foreground max-w-4xl mx-auto px-4">
              <p>{content}</p>
            </div>
          )}
        </div>

        {/* Facility Images Gallery */}
        {sectionImages.length > 0 && (
          <div className="mb-12 md:mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {sectionImages
                .filter(img => img.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((image) => (                    <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                      <div className="relative aspect-video">
                        <img
                          src={image.imageUrl}
                          alt={image.altText || image.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/60" />
                        <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4">
                          <h3 className="text-white font-semibold text-sm md:text-lg mb-1">                        {image.title}
                      </h3>
                      {image.description && (
                        <p className="text-white/90 text-xs md:text-sm line-clamp-2">
                          {image.description}
                        </p>
                      )}
                      <Badge variant="secondary" className="mt-1 md:mt-2 text-xs">
                        {image.category}
                      </Badge>
                    </div>
                  </div>
                </Card>
                ))}
            </div>
          </div>
        )}

        {/* Default Facilities Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {defaultFacilities.map((facility, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:bg-primary/20 transition-colors">
                    <facility.icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 md:mb-3">
                    {facility.title}
                  </h3>
                  
                  <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 leading-relaxed">
                    {facility.description}
                  </p>
                  
                  <div className="space-y-1 md:space-y-2 w-full">
                    {facility.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-xs md:text-sm text-foreground">
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-primary mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Section */}
        <div className="mt-12 md:mt-16 text-center">
          <div className="bg-secondary/50 rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-12">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 md:mb-4">
              Ready to Experience Our Facilities?
            </h3>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Visit us at Tunda Sports Club and see our world-class facilities for yourself. 
              Book your game or tournament today!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Visit Our Ground
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Check Availability
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

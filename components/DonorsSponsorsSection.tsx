'use client'

import { useState, useEffect } from 'react'
import { 
  Heart, 
  Award, 
  Star, 
  ExternalLink,
  Gift,
  Zap,
  Building,
  Users
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Person {
  id: string
  name: string
  role: string
  designation?: string
  bio?: string
  email?: string
  phone?: string
  profileImage?: string
  linkedin?: string
  twitter?: string
  facebook?: string
  department?: string
  joinDate?: string
  isActive: boolean
  sortOrder: number
  showOnLanding: boolean
  showContact: boolean
}

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
  people: Person[]
  images: SectionImage[]
}

export default function DonorsSponsorsSection() {
  const [donorsData, setDonorsData] = useState<LandingPageSection | null>(null)
  const [sponsorsData, setSponsorsData] = useState<LandingPageSection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSupportersData()
  }, [])

  const fetchSupportersData = async () => {
    try {
      const [donorsResponse, sponsorsResponse] = await Promise.all([
        fetch('/api/landing/sections?sectionType=DONORS'),
        fetch('/api/landing/sections?sectionType=SPONSORS')
      ])
      
      if (donorsResponse.ok) {
        const donorsData = await donorsResponse.json()
        if (donorsData.success && donorsData.sections.length > 0) {
          setDonorsData(donorsData.sections[0])
        }
      }
      
      if (sponsorsResponse.ok) {
        const sponsorsData = await sponsorsResponse.json()
        if (sponsorsData.success && sponsorsData.sections.length > 0) {
          setSponsorsData(sponsorsData.sections[0])
        }
      }
    } catch (error) {
      console.error('Error fetching supporters data:', error)
    } finally {
      setLoading(false)
    }
  }

  const PersonCard = ({ person, type }: { person: Person, type: 'donor' | 'sponsor' }) => {
    const icon = type === 'donor' ? Heart : Zap
    const IconComponent = icon

    return (
      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
        <CardContent className="p-6">
          <div className="text-center">
            {/* Profile Image or Icon */}
            <div className="relative mb-4">
              {person.profileImage ? (
                <img
                  src={person.profileImage}
                  alt={person.name}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg">
                  <IconComponent className="w-10 h-10 text-primary" />
                </div>
              )}
              
              {/* Type Badge */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <Badge variant={type === 'donor' ? 'default' : 'secondary'} className="text-xs">
                  {type === 'donor' ? 'Donor' : 'Sponsor'}
                </Badge>
              </div>
            </div>
            
            {/* Name and Role */}
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {person.name}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-2">
              {person.role}
            </p>
            
            {person.designation && (
              <p className="text-xs text-muted-foreground/80 mb-3">
                {person.designation}
              </p>
            )}
            
            {/* Bio Preview */}
            {person.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {person.bio}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const ImageCard = ({ image, type }: { image: SectionImage, type: 'donor' | 'sponsor' }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={image.imageUrl}
          alt={image.altText || image.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-foreground font-semibold text-lg mb-1">
            {image.title}
          </h3>
          {image.description && (
            <p className="text-white/90 text-sm">
              {image.description}
            </p>
          )}
          <Badge 
            variant="secondary" 
            className="mt-2"
          >
            {type === 'donor' ? 'Donor' : 'Sponsor'}
          </Badge>
        </div>
      </div>
    </Card>
  )

  const SupporterSection = ({ 
    data, 
    title, 
    type, 
    icon: IconComponent, 
    description 
  }: { 
    data: LandingPageSection | null
    title: string
    type: 'donor' | 'sponsor'
    icon: any
    description: string
  }) => {
    if (!data || !data.isActive) return null

    const activePeople = data.people
      .filter(person => person.isActive && person.showOnLanding)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const activeImages = data.images
      .filter(img => img.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    if (activePeople.length === 0 && activeImages.length === 0) return null

    return (
      <div className="mb-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <IconComponent className="w-8 h-8 text-primary mr-3" />
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              {data.title || title}
            </h3>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            {data.subtitle || description}
          </p>
          
          {data.content && (
            <div className="text-muted-foreground max-w-3xl mx-auto">
              <p>{data.content}</p>
            </div>
          )}
        </div>

        {/* People Grid */}
        {activePeople.length > 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activePeople.map((person) => (
                <PersonCard key={person.id} person={person} type={type} />
              ))}
            </div>
          </div>
        )}

        {/* Images Grid */}
        {activeImages.length > 0 && (
          <div>
            <h4 className="text-xl font-semibold text-foreground mb-6 text-center">
              {type === 'donor' ? 'Donor Recognition' : 'Sponsor Showcase'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeImages.map((image) => (
                <ImageCard key={image.id} image={image} type={type} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <section id="supporters" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // If no data available, don't render the section
  if (!donorsData && !sponsorsData) {
    return null
  }

  return (
    <section id="supporters" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Supporters
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We are grateful to our donors and sponsors who make our cricket community possible
          </p>
        </div>

        {/* Donors Section */}
        <SupporterSection 
          data={donorsData}
          title="Our Donors"
          type="donor"
          icon={Heart}
          description="Generous individuals and organizations who contribute to our community cricket initiatives"
        />
        
        {/* Sponsors Section */}
        <SupporterSection 
          data={sponsorsData}
          title="Our Sponsors"
          type="sponsor"
          icon={Zap}
          description="Business partners who support our tournaments and club activities"
        />

        {/* Call to Action */}
        {(donorsData || sponsorsData) && (
          <div className="mt-16 text-center">
            <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border">
              <div className="flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-primary mr-3" />
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  Join Our Community
                </h3>
              </div>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Interested in supporting Tunda Sports Club? Join our community of supporters 
                and help us grow cricket in our village.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Gift className="w-5 h-5 mr-2" />
                  Become a Donor
                </Button>
                <Button variant="outline" size="lg">
                  <Building className="w-5 h-5 mr-2" />
                  Sponsor Us
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

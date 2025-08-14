'use client'

import { useState, useEffect } from 'react'
import { Target, Clock, Award, Heart, Camera, Users, Building } from 'lucide-react'

interface AboutSection {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  isActive: boolean;
  people: Array<{
    id: string;
    name: string;
    role: string;
    designation?: string;
    bio?: string;
    profileImage?: string;
    showOnLanding: boolean;
  }>;
  images: Array<{
    id: string;
    imageUrl: string;
    title?: string;
    isActive: boolean;
  }>;
}

export default function AboutEnhanced() {
  const [aboutSection, setAboutSection] = useState<AboutSection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutContent()
  }, [])

  const fetchAboutContent = async () => {
    try {
      const response = await fetch('/api/landing/sections?sectionType=ABOUT_US&activeOnly=true')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.sections.length > 0) {
          setAboutSection(data.sections[0])
        }
      }
    } catch (error) {
      console.error('Error fetching about content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fallback features if no data from database
  const fallbackFeatures = [
    {
      icon: Target,
      title: 'Village Ground',
      description: 'A well-maintained cricket ground serving the local community in Tunda village.',
    },
    {
      icon: Clock,
      title: 'Open for All',
      description: 'Available for local matches, practice sessions, and community events.',
    },
    {
      icon: Award,
      title: 'Local Tournaments',
      description: 'Hosting village and inter-village cricket tournaments in Kutch region.',
    },
    {
      icon: Camera,
      title: 'Photo Gallery',
      description: 'Dynamic photo management system showcasing tournament moments and memories.',
    },
    {
      icon: Heart,
      title: 'Community Hub',
      description: 'Bringing together cricket enthusiasts from Tunda and surrounding villages.',
    },
  ]

  const title = aboutSection?.title || 'About Tunda Sports Club'
  const subtitle = aboutSection?.subtitle || ''
  const content = aboutSection?.content || `Welcome to Tunda Sports Club, located in the beautiful village of Tunda in 
                Kutch district, Mundra Taluka, Gujarat. Our cricket ground serves as the heart 
                of our local cricket community, providing a space for players of all ages to 
                enjoy the game. From friendly village matches to local tournaments, our ground 
                has been witness to countless memorable moments and has helped nurture cricket 
                talent in our region.`

  const teamMembers = aboutSection?.people?.filter(person => person.showOnLanding) || []
  const aboutImages = aboutSection?.images?.filter(img => img.isActive) || []

  return (
    <section id="about" className="py-16 md:py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">
                {title.includes('About') ? title.replace('About ', '') : title}
                {!title.includes('About') && (
                  <span className="text-primary">
                    {' '}Sports Club
                  </span>
                )}
              </h2>
              {subtitle && (
                <p className="text-lg md:text-xl text-muted-foreground mb-3 md:mb-4">{subtitle}</p>
              )}
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {content}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {fallbackFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group p-4 md:p-6 bg-card rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-border"
                >
                  <div className="flex items-start space-x-3 md:space-x-4">
                    <div className="p-2 md:p-3 bg-secondary rounded-lg group-hover:bg-accent transition-colors duration-300 shrink-0">
                      <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Team Members Preview */}
            {teamMembers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Our Team</h3>
                <div className="flex flex-wrap gap-4">
                  {teamMembers.slice(0, 4).map((member) => (
                    <div key={member.id} className="flex items-center gap-3 bg-card p-3 rounded-lg shadow-sm border border-border">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        {member.profileImage ? (
                          <img
                            src={member.profileImage}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                  {teamMembers.length > 4 && (
                    <div className="flex items-center gap-3 bg-card p-3 rounded-lg shadow-sm border border-border">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">+{teamMembers.length - 4} more</p>
                        <p className="text-xs text-muted-foreground">Team Members</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mission Statement */}
            <div className="bg-primary/5 rounded-xl p-6 border-l-4 border-primary">
              <h3 className="text-xl font-semibold mb-3">Our Legacy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built by TATA Corporation as part of their commitment to community development, 
                Tunda Cricket Ground stands as a testament to quality infrastructure. We provide 
                an exceptional cricket experience that nurtures talent, builds character, and brings 
                the community together through the love of the game.
              </p>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              {aboutImages.length > 0 ? (
                <div className="w-full h-96 relative">
                  <img
                    src={aboutImages[0].imageUrl}
                    alt={aboutImages[0].title || 'About Tunda Sports Club'}
                    className="w-full h-full object-cover"
                  />
                  {aboutImages.length > 1 && (                      <div className="absolute bottom-4 right-4 bg-background/80 text-foreground px-2 py-1 rounded text-sm">
                      +{aboutImages.length - 1} more
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-primary flex items-center justify-center relative">
                  {/* Ground illustration */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-primary-foreground">
                      <div className="text-6xl mb-4">🏏</div>
                      <h3 className="text-2xl font-bold mb-2">Tunda Cricket Ground</h3>
                      <p className="text-primary-foreground/80">Village Cricket Stadium</p>
                    </div>
                  </div>
                  {/* Stadium structure */}
                  <div className="absolute bottom-8 left-8 right-8 h-16 bg-background/20 rounded-lg backdrop-blur-sm"></div>
                </div>
              )}
            </div>

            {/* About Images Grid */}
            {aboutImages.length > 1 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {aboutImages.slice(1, 4).map((image, index) => (
                  <div key={image.id} className="aspect-square relative rounded-lg overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.title || `About image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

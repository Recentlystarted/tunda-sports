'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Mail, 
  Phone, 
  Linkedin, 
  Twitter, 
  Facebook,
  User,
  Award,
  Calendar
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

interface LandingPageSection {
  id: string
  sectionType: string
  title: string
  subtitle?: string
  content?: string
  isActive: boolean
  sortOrder: number
  people: Person[]
}

export default function TeamMembersSection() {
  const [teamData, setTeamData] = useState<LandingPageSection | null>(null)
  const [boardData, setBoardData] = useState<LandingPageSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<Person | null>(null)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      console.log('🔍 Fetching team data...')
      const [teamResponse, boardResponse] = await Promise.all([
        fetch('/api/landing/sections?sectionType=TEAM_MEMBERS'),
        fetch('/api/landing/sections?sectionType=BOARD_MEMBERS')
      ])
      
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        console.log('👥 Team data received:', teamData)
        if (teamData.success && teamData.sections.length > 0) {
          console.log('👤 People in team section:', teamData.sections[0].people)
          // Log each person's image URL
          teamData.sections[0].people?.forEach((person: Person, index: number) => {
            console.log(`Person ${index + 1}: ${person.name}`)
            console.log(`  Profile Image: ${person.profileImage || 'NOT SET'}`)
            console.log(`  Show on Landing: ${person.showOnLanding}`)
            console.log(`  Is Active: ${person.isActive}`)
          })
          setTeamData(teamData.sections[0])
        }
      }
      
      if (boardResponse.ok) {
        const boardData = await boardResponse.json()
        console.log('📋 Board data received:', boardData)
        if (boardData.success && boardData.sections.length > 0) {
          console.log('👤 People in board section:', boardData.sections[0].people)
          // Log each person's image URL in board section
          boardData.sections[0].people?.forEach((person: Person, index: number) => {
            console.log(`Board Person ${index + 1}: ${person.name}`)
            console.log(`  Profile Image: ${person.profileImage || 'NOT SET'}`)
            console.log(`  Show on Landing: ${person.showOnLanding}`)
            console.log(`  Is Active: ${person.isActive}`)
            if (person.name.toLowerCase().includes('mohammed') || person.name.toLowerCase().includes('faruk')) {
              console.log(`  🎯 MOHAMMED FARUK FOUND IN BOARD SECTION!`)
            }
          })
          setBoardData(boardData.sections[0])
        } else {
          console.log('❌ No board sections found or invalid response')
        }
      } else {
        console.error('❌ Board response not OK:', boardResponse.status, boardResponse.statusText)
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const PersonCard = ({ person, showContact = false }: { person: Person, showContact?: boolean }) => (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2 cursor-pointer"
      onClick={() => setSelectedMember(person)}
    >
      <CardContent className="p-4 md:p-6">
        <div className="text-center">
          {/* Profile Image */}
          <div className="relative mb-3 md:mb-4">
            {person.profileImage ? (
              <img
                src={person.profileImage}
                alt={person.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto object-cover border-4 border-background shadow-lg"
                onError={(e) => {
                  console.error('Team member image failed to load:', person.profileImage)
                  // Always show fallback avatar on error
                  e.currentTarget.style.display = 'none'
                  const parentDiv = e.currentTarget.parentElement
                  if (parentDiv && !parentDiv.querySelector('.fallback-avatar')) {
                    const fallbackDiv = document.createElement('div')
                    fallbackDiv.className = 'fallback-avatar w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto bg-muted flex items-center justify-center border-4 border-background shadow-lg'
                    fallbackDiv.innerHTML = `
                      <div class="text-center">
                        <svg class="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <div class="text-xs text-primary font-medium">${person.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                      </div>
                    `
                    parentDiv.appendChild(fallbackDiv)
                  }
                }}
                onLoad={() => {
                  console.log('Team member image loaded successfully:', person.profileImage)
                }}
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto bg-muted flex items-center justify-center border-4 border-background shadow-lg">
                <div className="text-center">
                  <User className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-1" />
                  <div className="text-xs text-primary font-medium">{person.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Name and Role */}
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">
            {person.name}
          </h3>
          
          <Badge variant="outline" className="mb-2 text-xs md:text-sm">
            {person.role}
          </Badge>
          
          {person.designation && (
            <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
              {person.designation}
            </p>
          )}
          
          {/* Bio Preview */}
          {person.bio && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3 md:mb-4">
              {person.bio}
            </p>
          )}
          
          {/* Contact Info */}
          {(showContact || person.showContact) && (
            <div className="space-y-1 md:space-y-2">
              {person.email && (
                <div className="flex items-center justify-center text-xs md:text-sm text-muted-foreground">
                  <Mail className="w-3 h-3 md:w-4 md:h-4 mr-2 shrink-0" />
                  <span className="truncate">{person.email}</span>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center justify-center text-xs md:text-sm text-muted-foreground">
                  <Phone className="w-3 h-3 md:w-4 md:h-4 mr-2 shrink-0" />
                  <span>{person.phone}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Social Links */}
          <div className="flex justify-center space-x-2 md:space-x-3 mt-3 md:mt-4">
            {person.linkedin && (
              <a
                href={person.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            )}
            {person.twitter && (
              <a
                href={person.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            )}
            {person.facebook && (
              <a
                href={person.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TeamSection = ({ data, title }: { data: LandingPageSection | null, title: string }) => {
    if (!data || !data.isActive) return null

    const activeMembers = data.people
      .filter(person => person.isActive && person.showOnLanding)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    if (activeMembers.length === 0) return null

    return (
      <div className="mb-16 md:mb-20">
        <div className="text-center mb-8 md:mb-12">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
            {data.title || title}
          </h3>
          {data.subtitle && (
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {data.subtitle}
            </p>
          )}
          {data.content && (
            <div className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground max-w-3xl mx-auto px-4">
              <p>{data.content}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {activeMembers.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <section id="team" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // If no data available, don't render the section
  if (!teamData && !boardData) {
    return null
  }

  return (
    <>
      <section id="team" className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Team
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Meet the dedicated people who make Tunda Sports Club a thriving community cricket hub
            </p>
          </div>

          {/* Board Members */}
          <TeamSection data={boardData} title="Board Members" />
          
          {/* Team Members */}
          <TeamSection data={teamData} title="Team Members" />
        </div>
      </section>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-foreground">
                  {selectedMember.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  {selectedMember.profileImage ? (
                    <img
                      src={selectedMember.profileImage}
                      alt={selectedMember.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-border"
                      onError={(e) => {
                        console.error('Modal team member image failed to load:', selectedMember.profileImage)
                        // If it's a Google Drive proxy URL that failed, try the direct Google Drive URL
                        if (selectedMember.profileImage?.includes('/api/proxy/gdrive?id=')) {
                          const fileId = selectedMember.profileImage.split('id=')[1]
                          const fallbackUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
                          e.currentTarget.src = fallbackUrl
                        } else {
                          // Hide the image and show default avatar
                          e.currentTarget.style.display = 'none'
                          const parentDiv = e.currentTarget.parentElement
                          if (parentDiv) {
                            parentDiv.innerHTML = `
                              <div class="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-border">
                                <svg class="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                              </div>
                            `
                          }
                        }
                      }}
                      onLoad={() => {
                        console.log('Modal team member image loaded successfully:', selectedMember.profileImage)
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-border">
                      <User className="w-16 h-16 text-primary" />
                    </div>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1">
                  <div className="space-y-4">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {selectedMember.role}
                      </Badge>
                      {selectedMember.designation && (
                        <p className="text-muted-foreground">{selectedMember.designation}</p>
                      )}
                      {selectedMember.department && (
                        <p className="text-sm text-muted-foreground/80">{selectedMember.department}</p>
                      )}
                    </div>
                    
                    {selectedMember.bio && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">About</h4>
                        <p className="text-muted-foreground">{selectedMember.bio}</p>
                      </div>
                    )}
                    
                    {selectedMember.joinDate && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Joined: {new Date(selectedMember.joinDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {/* Contact Information */}
                    {(selectedMember.showContact || selectedMember.email || selectedMember.phone) && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Contact</h4>
                        <div className="space-y-2">
                          {selectedMember.email && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="w-4 h-4 mr-2" />
                              <a href={`mailto:${selectedMember.email}`} className="hover:text-primary">
                                {selectedMember.email}
                              </a>
                            </div>
                          )}
                          {selectedMember.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="w-4 h-4 mr-2" />
                              <a href={`tel:${selectedMember.phone}`} className="hover:text-primary">
                                {selectedMember.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Social Links */}
                    {(selectedMember.linkedin || selectedMember.twitter || selectedMember.facebook) && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Connect</h4>
                        <div className="flex space-x-3">
                          {selectedMember.linkedin && (
                            <a
                              href={selectedMember.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Linkedin className="w-6 h-6" />
                            </a>
                          )}
                          {selectedMember.twitter && (
                            <a
                              href={selectedMember.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Twitter className="w-6 h-6" />
                            </a>
                          )}
                          {selectedMember.facebook && (
                            <a
                              href={selectedMember.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Facebook className="w-6 h-6" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

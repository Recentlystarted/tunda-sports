'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/Navigation'
import HeroEnhanced from '@/components/HeroEnhanced'
import AboutEnhanced from '@/components/AboutEnhanced'
import FacilitiesEnhanced from '@/components/FacilitiesEnhanced'
import TeamMembersSection from '@/components/TeamMembersSection'
import DonorsSponsorsSection from '@/components/DonorsSponsorsSection'
import Tournaments from '@/components/Tournaments'
import Gallery from '@/components/Gallery'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import PlayerRegistration from '@/components/UniversalRegistration'

export default function Home() {
  const [showRegistration, setShowRegistration] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Simple, reliable loading timeout
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1200)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-primary">🏏 Tunda Sports Club</div>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation 
        onRegisterToggle={() => setShowRegistration(!showRegistration)}
      />
      
      {showRegistration ? (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
          <div className="sticky top-0 bg-background border-b border-border shadow-sm z-10">
            <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
              <h1 className="text-xl md:text-2xl font-bold">Tournament Registration</h1>
              <Button variant="outline" onClick={() => setShowRegistration(false)} size="sm">
                <X className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Close Registration</span>
                <span className="sm:hidden">Close</span>
              </Button>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <PlayerRegistration />
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          <HeroEnhanced />
          <AboutEnhanced />
          <FacilitiesEnhanced />
          <TeamMembersSection />
          <DonorsSponsorsSection />
          <Tournaments />
          <Gallery />
          <Contact />
        </div>
      )}
      
      <Footer />
    </main>
  )
}

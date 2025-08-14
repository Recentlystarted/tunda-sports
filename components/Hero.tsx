'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Play, Award, Users, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
    const heroImages = [
    'https://lh3.googleusercontent.com/p/AF1QipOL2oEJhUIF4cBEcB6r8Lw1WayUSE7CqzNsJEIm=w2000-h1200-k-no', // Real Tunda Cricket Ground
    // 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=2000&h=1200&fit=crop&crop=center', // Professional cricket ground
    // 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=2000&h=1200&fit=crop&crop=center', // Cricket pitch view
    // 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=2000&h=1200&fit=crop&crop=center', // Cricket stadium
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroImages.length])
  const stats = [
    { icon: Award, label: 'Years Serving', value: '10+' },
    { icon: Users, label: 'Local Players', value: '200+' },
    { icon: MapPin, label: 'Village Location', value: 'Tunda, Kutch' },
  ]

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Slider */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}            style={{
              backgroundImage: `url('${image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Welcome to
              <span className="block text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Tunda Sports Club
              </span>
            </h1>            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              Your local cricket ground in the heart of Tunda village, Kutch district. 
              Where community spirit meets the love of cricket.
            </p>
          </div>          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="group">
              <Play className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              Book Your Game
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
              View Tournaments
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-white opacity-70" />
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  )
}

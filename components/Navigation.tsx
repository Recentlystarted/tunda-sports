'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Trophy, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface NavigationProps {
  onRegisterToggle?: () => void
}

export default function Navigation({ onRegisterToggle }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const navItems = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#facilities', label: 'Facilities' },
    { href: '#tournaments', label: 'Tournaments' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#contact', label: 'Contact' },
  ]

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled 
        ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border" 
        : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <img 
                src="/logo.PNG" 
                alt="Tunda Sports Club" 
                className={cn(
                  "h-8 w-8 transition-all duration-300 object-contain",
                  isScrolled ? "opacity-100" : "opacity-90"
                )}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className={cn(
                "text-xl font-bold transition-colors duration-300",
                isScrolled ? "text-foreground" : "text-white"
              )}>
                Tunda Sports Club
              </h1>
              <p className={cn(
                "text-xs transition-colors duration-300",
                isScrolled ? "text-muted-foreground" : "text-white/90"
              )}>
                Premier Cricket Ground
              </p>
            </div>
          </div>          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "font-medium transition-all duration-300 hover:scale-105",
                  isScrolled 
                    ? "text-foreground hover:text-primary" 
                    : "text-white hover:text-white/80"
                )}
              >
                {item.label}
              </a>
            ))}            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Register Button */}
            <Button
              onClick={() => onRegisterToggle?.()}
              className="transition-all duration-300"
              variant={isScrolled ? "default" : "secondary"}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Register Team
            </Button>
            
            {/* Admin Button */}
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "transition-all duration-300",
                  isScrolled 
                    ? "hover:bg-accent" 
                    : "bg-background/20 hover:bg-background/30 text-white"
                )}
              >
                <Shield className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu button and theme toggle */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Theme Toggle - Always visible on mobile */}
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "transition-colors duration-300",
                isScrolled ? "text-foreground" : "text-white"
              )}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-md rounded-lg mt-2 shadow-lg border border-border mx-2">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-3 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors duration-300 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              
              <button
                onClick={() => {
                  onRegisterToggle?.()
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-3 text-primary hover:text-primary/80 hover:bg-accent rounded-md transition-colors duration-300 flex items-center space-x-2 font-medium"
              >
                <Trophy className="h-4 w-4" />
                <span>Register Team</span>
              </button>
              
              <Link 
                href="/admin"
                className="w-full text-left px-3 py-3 text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors duration-300 flex items-center space-x-2 font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Shield className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

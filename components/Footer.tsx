'use client'

import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Our Facilities', href: '#facilities' },
      { label: 'Tournaments', href: '#tournaments' },
      { label: 'Gallery', href: '#gallery' },
    ],    services: [
      { label: 'Ground Booking', href: '#' },
      { label: 'Local Tournaments', href: '#' },
      { label: 'Community Events', href: '#' },
      { label: 'Village Matches', href: '#' },
    ],
    support: [
      { label: 'Contact Us', href: '#contact' },
      { label: 'FAQs', href: '#' },
      { label: 'Booking Policy', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ]
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-primary' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-primary' },
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-primary' },
    { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:text-primary' },
  ]

  return (
    <footer className="bg-background border-t border-border text-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>              <p className="text-muted-foreground">
                Get the latest news about local tournaments, village events, and cricket activities at Tunda Cricket Ground.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 bg-input border-border text-foreground placeholder-muted-foreground"
              />
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative">
                <img 
                  src="/logo.PNG" 
                  alt="Tunda Sports Club" 
                  className="h-8 w-8 object-contain"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold">Tunda Sports Club</h2>
                <p className="text-sm text-muted-foreground">Village Cricket Ground</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Your local cricket ground in Tunda village, serving the cricket community 
              in Kutch district with passion and dedication.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">Tunda Village, Mundra Taluka, Kutch, Gujarat</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">info@tundasportsclub.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-4 mb-6 md:mb-0">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className={`p-3 bg-secondary rounded-full text-muted-foreground ${social.color} transition-all duration-300 hover:scale-110 hover:bg-accent`}
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="flex space-x-8 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">15+</div>
                <div className="text-xs text-muted-foreground">Years</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-xs text-muted-foreground">Tournaments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">1000+</div>
                <div className="text-xs text-muted-foreground">Players</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center space-x-1 mb-4 md:mb-0">
              <span>© {currentYear} Tunda Sports Club. Made with</span>
              <Heart className="h-4 w-4 text-destructive animate-pulse" />
              <span>for cricket lovers.</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors duration-300">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

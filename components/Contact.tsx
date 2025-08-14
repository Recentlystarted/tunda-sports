'use client'

import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Us',
      details: ['Tunda Village', 'Mundra Taluka, Kutch District', 'Gujarat, India'],
      color: 'bg-primary'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+91 98765 43210', '+91 87654 32109', 'Village Ground Contact'],
      color: 'bg-secondary'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['info@tundasportsclub.com', 'contact@tundasportsclub.com', 'Village Cricket Club'],
      color: 'bg-accent'
    },
    {
      icon: Clock,
      title: 'Ground Hours',
      details: ['Morning: 6 AM - 10 AM', 'Evening: 4 PM - 8 PM', 'Village Events: As scheduled'],
      color: 'bg-muted'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    }, 3000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section id="contact" className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Get In
            <span className="text-primary ml-2">
              Touch
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ready to experience cricket at its finest? Contact us for bookings, tournaments, 
            or any questions about our world-class facility.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contactInfo.map((info, index) => (
                  <Card key={info.title} className="group hover:shadow-lg transition-all duration-300 border-border bg-card">
                    <CardHeader className="pb-4">
                      <div className={`inline-flex p-3 rounded-2xl ${info.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <info.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-lg text-card-foreground">{info.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-muted-foreground text-sm mb-1">
                          {detail}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>            {/* Map - Tunda Cricket Ground */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-64">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3673.3827542598744!2d69.53676191498208!3d22.827157784609586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39512c8d02d2eb5d%3A0xe4a071d8c2e1bea5!2sTunda%20Cricket%20Ground!5e0!3m2!1sen!2sin!4v1719875534821!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  />
                  <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg">
                    <h4 className="text-lg font-bold flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      Tunda Cricket Ground
                    </h4>
                    <p className="text-white/80 text-sm">
                      Coordinates: 22.8271577, 69.5393368
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">Thank you for contacting us. We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Your full name"
                        className="transition-all duration-300 focus:scale-105"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        className="transition-all duration-300 focus:scale-105"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your.email@example.com"
                      className="transition-all duration-300 focus:scale-105"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="What is this regarding?"
                      className="transition-all duration-300 focus:scale-105"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      placeholder="Tell us more about your inquiry..."
                      rows={5}
                      className="transition-all duration-300 focus:scale-105"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-16 text-center">
          <div className="bg-primary rounded-2xl p-8 text-primary-foreground">
            <h3 className="text-2xl font-bold mb-4">Ready to Play?</h3>
            <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
              Don't wait! Book your slot now and experience cricket at the finest facility in the region.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg">
                Book Ground Now
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                View Packages
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

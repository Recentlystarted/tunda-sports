'use client'

import { Target, Clock, Award, Heart, Camera } from 'lucide-react'

export default function About() {
  const features = [    {
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

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-muted to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                About
                <span className="text-gradient bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  {' '}Tunda Sports Club
                </span>
              </h2>              <p className="text-lg text-muted-foreground leading-relaxed">
                Welcome to Tunda Sports Club, located in the beautiful village of Tunda in 
                Kutch district, Mundra Taluka, Gujarat. Our cricket ground serves as the heart 
                of our local cricket community, providing a space for players of all ages to 
                enjoy the game. From friendly village matches to local tournaments, our ground 
                has been witness to countless memorable moments and has helped nurture cricket 
                talent in our region.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors duration-300">
                      <feature.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mission Statement */}            <div className="bg-primary/5 rounded-xl p-6 border-l-4 border-primary">
              <h3 className="text-xl font-semibold mb-3">Our Legacy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built by TATA Corporation as part of their commitment to community development, 
                Tunda Cricket Ground stands as a testament to quality infrastructure. We provide 
                an exceptional cricket experience that nurtures talent, builds character, and brings 
                the community together through the love of the game.
              </p>
            </div>
          </div>          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <div className="w-full h-96 bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center relative">
                {/* Stadium illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <div className="text-6xl mb-4">🏏</div>
                    <h3 className="text-2xl font-bold mb-2">Tunda Cricket Ground</h3>
                    <p className="text-primary-foreground/80">Village Cricket Stadium</p>
                  </div>
                </div>
                {/* Stadium structure */}
                <div className="absolute bottom-8 left-8 right-8 h-16 bg-background/20 rounded-lg backdrop-blur-sm"></div>
                <div className="absolute bottom-12 left-12 right-12 h-8 bg-background/30 rounded"></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-card rounded-xl shadow-lg p-4 border border-border">
              <div className="text-3xl font-bold text-primary">15+</div>
              <div className="text-sm text-muted-foreground">Years of Excellence</div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-card rounded-xl shadow-lg p-4 border border-border">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Happy Members</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { Zap, Wifi, Car, Utensils, Shirt, Shield, Camera, Coffee } from 'lucide-react'

export default function Facilities() {  const facilities = [
    {
      icon: Zap,
      title: 'Basic Lighting',
      description: 'Good lighting for evening matches and practice sessions',
      color: 'from-yellow-400 to-orange-500',
    },
    {
      icon: Car,
      title: 'Parking Area',
      description: 'Open area for parking vehicles during matches',
      color: 'from-gray-400 to-gray-600',
    },
    {
      icon: Utensils,
      title: 'Tea Stall',
      description: 'Local tea and snacks available during matches',
      color: 'from-green-400 to-green-600',
    },
    {
      icon: Shirt,
      title: 'Basic Facilities',
      description: 'Simple changing area and basic amenities',
      color: 'from-purple-400 to-purple-600',
    },
    {
      icon: Shield,
      title: 'Community Care',
      description: 'Local volunteers ensure ground maintenance and safety',
      color: 'from-red-400 to-red-600',
    },    {
      icon: Coffee,
      title: 'Community Space',
      description: 'Gathering area for players and spectators to socialize',
      color: 'from-indigo-400 to-indigo-600',
    },
  ]

  return (
    <section id="facilities" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ground
            <span className="text-gradient bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              {' '}Facilities
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our village cricket ground provides essential facilities for local cricket activities 
            and serves as a community hub for cricket enthusiasts in Tunda and surrounding areas.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {facilities.map((facility, index) => (
            <div
              key={facility.title}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 p-8 border border-gray-100 hover:border-transparent overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${facility.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${facility.color} mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                <facility.icon className="h-8 w-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                {facility.title}
              </h3>
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                {facility.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-primary-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Ground Specifications */}
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Ground Specifications</h3>
            <div className="space-y-4">
              {[
                { label: 'Playing Area', value: '150m x 130m' },
                { label: 'Pitch Length', value: '22 yards (20.12m)' },
                { label: 'Boundary Distance', value: '65-75 meters' },
                { label: 'Grass Type', value: 'Premium Bermuda Grass' },
                { label: 'Seating Capacity', value: '2,000 spectators' },
                { label: 'Pavilion', value: '3-story modern pavilion' },
              ].map((spec, index) => (
                <div key={spec.label} className="flex justify-between items-center py-2 border-b border-primary-100">
                  <span className="text-gray-700 font-medium">{spec.label}</span>
                  <span className="text-primary-600 font-semibold">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>          {/* Ground Image */}
          <div className="relative">
            <div className="w-full h-80 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-2xl shadow-lg overflow-hidden flex items-center justify-center relative">
              {/* Cricket field design */}
              <div className="absolute inset-4 border-4 border-white/30 rounded-xl">
                {/* Cricket pitch */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-4 bg-yellow-200/60 rounded-sm"></div>
                {/* Inner circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/40 rounded-full"></div>
                {/* Boundary */}
                <div className="absolute inset-8 border-2 border-white/30 rounded-full"></div>
              </div>
              
              {/* Text overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h4 className="text-2xl font-bold mb-2">Cricket Ground Layout</h4>
                  <p className="text-white/80">Tunda Village, Kutch</p>
                </div>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
            <div className="absolute bottom-6 left-6 text-white">
              <h4 className="text-xl font-bold">Ground Layout</h4>
              <p className="text-gray-200">Tunda Cricket Ground</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

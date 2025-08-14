'use client'

import { Suspense } from 'react'
import UniversalRegistration from '@/components/UniversalRegistration'
import { Card, CardContent } from '@/components/ui/card'

export default function AuctionPlayerRegistrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.PNG" 
              alt="Tunda Sports Club" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            🏏 Player Registration
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Register yourself for auction-based cricket tournaments. 
            Join the excitement and get picked by team owners!
          </p>
        </div>

        {/* Registration Component */}
        <Suspense fallback={
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading registration form...</p>
            </CardContent>
          </Card>
        }>
          <UniversalRegistration />
        </Suspense>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">Auction Format</h3>
              <p className="text-sm text-muted-foreground">
                Teams bid for players in live auction. Get picked and play for your team!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-semibold mb-2">Email Updates</h3>
              <p className="text-sm text-muted-foreground">
                Get notified about auction date, results, and tournament schedule.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="font-semibold mb-2">Group Matches</h3>
              <p className="text-sm text-muted-foreground">
                Play in group stage format with multiple matches guaranteed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Mail, Clock, Users, Trophy, Home } from 'lucide-react'
import Link from 'next/link'

function RegistrationSuccessContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'player'
  const tournamentName = searchParams.get('tournament') || 'Tournament'
  const playerName = searchParams.get('name') || 'Player'
  const teamName = searchParams.get('team') || 'Team'

  const isPlayer = type === 'player'
  const isOwner = type === 'owner'

  return (
    <div className="min-h-screen mobile-viewport-fix bg-gradient-to-br from-background via-background to-muted/50 py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Registration Successful! 🎉
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            {isPlayer ? `Welcome ${playerName}!` : `Welcome ${teamName}!`}
          </p>
        </div>

        {/* Main Success Card */}
        <Card className="border-l-4 border-l-primary shadow-lg border-0 sm:border sm:border-l-4 sm:border-l-primary">
          <CardHeader className="bg-primary/5 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-foreground text-lg sm:text-xl">
              <Trophy className="w-5 h-5" />
              {isPlayer ? 'Player Registration Confirmed' : 'Team Owner Registration Confirmed'}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base">
              Your registration for <strong>{tournamentName}</strong> has been successfully submitted
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Registration Details */}
              <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Users className="w-4 h-4" />
                  Registration Details
                </h3>
                <div className="grid gap-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {isPlayer ? 'Player Name:' : 'Team Name:'}
                    </span>
                    <span className="font-medium text-foreground">
                      {isPlayer ? playerName : teamName}
                    </span>
                  </div>
                  {isOwner && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Owner Name:</span>
                      <span className="font-medium text-foreground">{playerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tournament:</span>
                    <span className="font-medium text-foreground">{tournamentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Mail className="w-4 h-4 text-primary" />
                  What Happens Next?
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">Email Confirmation:</strong> You'll receive a confirmation email shortly with all the details
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">Admin Review:</strong> Our team will review your registration within 2-3 business days
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trophy className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">Approval Notification:</strong> You'll be notified once your registration is approved
                    </span>
                  </li>
                  {isPlayer && (
                    <li className="flex items-start gap-2">
                      <Users className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>
                        <strong className="text-foreground">Auction Participation:</strong> If approved, you'll be eligible for the player auction
                      </span>
                    </li>
                  )}
                  {isOwner && (
                    <li className="flex items-start gap-2">
                      <Users className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>
                        <strong className="text-foreground">Auction Access:</strong> Once approved, you'll receive a unique auction link to participate
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Important Notes */}
              <div className="bg-accent/50 p-3 sm:p-4 rounded-lg border">
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">📌 Important Notes</h3>
                <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                  <li>• Check your email regularly for updates</li>
                  <li>• Keep your contact details updated</li>
                  <li>• Contact support if you don't hear back within 3 business days</li>
                  {isPlayer && <li>• Ensure you're available for the auction date</li>}
                  {isOwner && <li>• Prepare your budget for the auction</li>}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button asChild className="flex-1 mobile-button touch-target">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1 mobile-button touch-target">
                  <Link href="/tournaments">
                    <Trophy className="w-4 h-4 mr-2" />
                    View Tournaments
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
          <p>
            Need help? Contact us at{' '}
            <a 
              href="mailto:info@tundasportsclub.com" 
              className="text-primary hover:underline font-medium"
            >
              info@tundasportsclub.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen mobile-viewport-fix bg-gradient-to-br from-background via-background to-muted/50 py-6 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full mb-4">
              <div className="mobile-spinner h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    }>
      <RegistrationSuccessContent />
    </Suspense>
  )
}

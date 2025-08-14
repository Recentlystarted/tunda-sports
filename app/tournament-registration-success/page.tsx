"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Calendar, MapPin, Mail, Phone, Home, Trophy } from 'lucide-react';

function TournamentRegistrationSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [registrationData, setRegistrationData] = useState<any>(null);
  const registrationId = searchParams.get('id');

  useEffect(() => {
    if (registrationId) {
      fetchRegistrationData();
    }
  }, [registrationId]);

  const fetchRegistrationData = async () => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`);
      if (!response.ok) throw new Error('Failed to fetch registration data');
      
      const data = await response.json();
      setRegistrationData(data);
    } catch (error) {
      console.error('Error fetching registration data:', error);
    }
  };

  return (
    <div className="min-h-screen mobile-viewport-fix bg-gradient-to-br from-background via-background to-muted/50 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="border-0 shadow-lg sm:border sm:shadow-md">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <div className="mx-auto mb-4 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl text-primary mb-2">
              Registration Successful!
            </CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">
              Your tournament registration has been submitted successfully.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {registrationData && (
              <Alert className="border-primary/20 bg-primary/5">
                <Trophy className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm space-y-1">
                  <div><strong>Registration ID:</strong> {registrationData.id}</div>
                  <div><strong>Tournament:</strong> {registrationData.tournament?.name}</div>
                  <div><strong>Team:</strong> {registrationData.teamName}</div>
                  <div><strong>Status:</strong> <span className="capitalize text-primary">{registrationData.status?.toLowerCase()}</span></div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg font-semibold text-foreground">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Email Confirmation</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      You'll receive a confirmation email with your registration details within a few minutes.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Admin Review</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Our admin team will review your registration within 24-48 hours.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-semibold text-primary">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Approval Notification</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      You'll receive an email notification once your registration is approved or if any additional information is needed.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-semibold text-primary">4</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Tournament Details</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Once approved, you'll receive detailed tournament information including schedule, rules, and venue details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Alert className="border-primary/20 bg-primary/5">
              <Mail className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> Please check your email (including spam/junk folder) for the confirmation email. 
                If you don't receive it within 15 minutes, please contact us.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Need Help?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Email</p>
                    <p className="text-xs text-muted-foreground">info@tundasportsclub.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Phone</p>
                    <p className="text-xs text-muted-foreground">+91 XXXXXXXXXX</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1 mobile-button touch-target"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
              <Button 
                onClick={() => router.push('/tournaments')}
                className="flex-1 mobile-button touch-target"
              >
                <Trophy className="h-4 w-4 mr-2" />
                View All Tournaments
              </Button>
            </div>

            {registrationData && (
              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-muted/30 rounded-lg border">
                <h4 className="font-semibold mb-2 text-foreground">Registration Summary</h4>
                <div className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">Team Name:</strong> {registrationData.teamName}</p>
                  <p><strong className="text-foreground">Captain:</strong> {registrationData.captainName}</p>
                  <p><strong className="text-foreground">Contact:</strong> {registrationData.contactNumber}</p>
                  <p><strong className="text-foreground">Email:</strong> {registrationData.email}</p>
                  <p><strong className="text-foreground">Players:</strong> {registrationData.teamPlayers?.length || 0}</p>
                  <p><strong className="text-foreground">Submitted:</strong> {new Date(registrationData.createdAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TournamentRegistrationSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen mobile-viewport-fix bg-gradient-to-br from-background via-background to-muted/50 py-4 sm:py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-0 shadow-lg sm:border sm:shadow-md">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="mx-auto mb-4 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="mobile-spinner h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
              <CardTitle className="text-xl sm:text-2xl text-primary mb-2">
                Loading...
              </CardTitle>
              <p className="text-muted-foreground text-sm sm:text-base">
                Please wait while we load your registration details.
              </p>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <TournamentRegistrationSuccessContent />
    </Suspense>
  );
}

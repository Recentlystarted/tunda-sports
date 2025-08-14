import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, PaymentMethod, PaymentStatus, RegistrationStatus, RegistrationType } from '@prisma/client';
import { z } from 'zod';
import { sendTeamRegistrationEmail, sendAdminRegistrationNotification } from '@/lib/emailService';

const prisma = new PrismaClient();

// Validation schema for team registration
const TeamRegistrationSchema = z.object({
  tournamentId: z.string().min(1, 'Tournament ID is required'),
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
  captainName: z.string().min(2, 'Captain name must be at least 2 characters'),
  captainPhone: z.string().min(10, 'Valid phone number is required'),
  captainEmail: z.string().email('Valid email address is required'),
  captainAge: z.number().min(16, 'Captain must be at least 16 years old'),
  homeGround: z.string().optional(),
  description: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().min(2, 'Emergency contact name is required'),
    phone: z.string().min(10, 'Emergency contact phone is required'),
    relation: z.string().min(2, 'Relation is required')
  }),
  paymentMethod: z.enum(['online', 'cash', 'bank-transfer', 'upi', 'card']),
  players: z.array(z.object({
    name: z.string().min(2, 'Player name is required'),
    age: z.number().min(16, 'Player must be at least 16 years old'),
    position: z.string(),
    experience: z.string(),
    battingStyle: z.string().optional(),
    bowlingStyle: z.string().optional(),
    jerseyNumber: z.number().optional(),
    isSubstitute: z.boolean().default(false),
    city: z.string().optional(),
    fatherName: z.string().optional(),
    phone: z.string().optional()
  })).min(11, 'At least 11 players are required'),
  specialRequests: z.string().optional()
});

// Map form payment methods to database enum values
const mapPaymentMethod = (formMethod: string): PaymentMethod => {
  const mapping: Record<string, PaymentMethod> = {
    'online': PaymentMethod.ONLINE,
    'cash': PaymentMethod.CASH,
    'bank-transfer': PaymentMethod.BANK_TRANSFER,
    'upi': PaymentMethod.UPI,
    'card': PaymentMethod.CARD
  };
  return mapping[formMethod] || PaymentMethod.ONLINE;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validatedData = TeamRegistrationSchema.parse(body);

    // Check if tournament exists and is accepting registrations
    const tournament = await prisma.tournament.findUnique({
      where: { id: validatedData.tournamentId },
      select: {
        id: true,
        name: true,
        status: true,
        maxTeams: true,
        teamSize: true,
        entryFee: true,
        registrationDeadline: true,
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING]
                }
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament is accepting registrations
    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json(
        { error: 'Tournament is not accepting registrations' },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (tournament.registrationDeadline && new Date() > new Date(tournament.registrationDeadline)) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // Check if tournament is full
    if (tournament.maxTeams && tournament._count.registrations >= tournament.maxTeams) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Check if team name already exists for this tournament
    const existingRegistration = await prisma.teamRegistration.findFirst({
      where: {
        tournamentId: validatedData.tournamentId,
        team: {
          name: validatedData.teamName
        },
        status: {
          in: [RegistrationStatus.PENDING, RegistrationStatus.CONFIRMED]
        }
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'A team with this name is already registered for this tournament' },
        { status: 400 }
      );
    }

    // Create team and registration in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the team first
      const team = await tx.team.create({
        data: {
          name: validatedData.teamName,
          captainName: validatedData.captainName,
          captainPhone: validatedData.captainPhone,
          captainEmail: validatedData.captainEmail,
          homeGround: validatedData.homeGround,
          description: validatedData.description
        }
      });

      // Create or connect players to the team
      for (let index = 0; index < validatedData.players.length; index++) {
        const playerData = validatedData.players[index];
        
        // Prepare player data with proper validation
        const processedPlayerData = {
          name: playerData.name,
          age: playerData.age,
          position: playerData.position && playerData.position.trim() ? playerData.position.toUpperCase() : null,
          experience: playerData.experience && playerData.experience.trim() ? playerData.experience.toUpperCase() : null,
          battingStyle: playerData.battingStyle && playerData.battingStyle.trim() ? playerData.battingStyle.toUpperCase() : null,
          bowlingStyle: playerData.bowlingStyle && playerData.bowlingStyle.trim() ? playerData.bowlingStyle.toUpperCase() : null,
          jerseyNumber: playerData.jerseyNumber || (index + 1),
          isSubstitute: playerData.isSubstitute,
          city: playerData.city || '',
          fatherName: playerData.fatherName,
          phone: playerData.phone || '',
          teamId: team.id,
          searchKeywords: `${playerData.name} ${playerData.city || ''} ${playerData.fatherName || ''}`.trim()
        };

        // Use upsert to handle existing players
        await tx.player.upsert({
          where: {
            name_city_phone: {
              name: playerData.name,
              city: playerData.city || '',
              phone: playerData.phone || ''
            }
          },
          update: {
            // Update the player's team association and other details
            teamId: team.id,
            age: processedPlayerData.age,
            position: processedPlayerData.position as any,
            experience: processedPlayerData.experience as any,
            battingStyle: processedPlayerData.battingStyle as any,
            bowlingStyle: processedPlayerData.bowlingStyle as any,
            jerseyNumber: processedPlayerData.jerseyNumber,
            isSubstitute: processedPlayerData.isSubstitute,
            fatherName: processedPlayerData.fatherName,
            searchKeywords: processedPlayerData.searchKeywords
          },
          create: {
            name: processedPlayerData.name,
            age: processedPlayerData.age,
            position: processedPlayerData.position as any,
            experience: processedPlayerData.experience as any,
            battingStyle: processedPlayerData.battingStyle as any,
            bowlingStyle: processedPlayerData.bowlingStyle as any,
            jerseyNumber: processedPlayerData.jerseyNumber,
            isSubstitute: processedPlayerData.isSubstitute,
            city: processedPlayerData.city,
            fatherName: processedPlayerData.fatherName,
            phone: processedPlayerData.phone,
            teamId: processedPlayerData.teamId,
            searchKeywords: processedPlayerData.searchKeywords
          }
        });
      }

      // Create the registration
      const registration = await tx.teamRegistration.create({
        data: {
          tournamentId: validatedData.tournamentId,
          teamId: team.id,
          registrationType: RegistrationType.PUBLIC,
          contactEmail: validatedData.captainEmail,
          contactPhone: validatedData.captainPhone,
          paymentMethod: mapPaymentMethod(validatedData.paymentMethod),
          paymentStatus: PaymentStatus.PENDING,
          paymentAmount: tournament.entryFee,
          specialRequests: validatedData.specialRequests,
          status: RegistrationStatus.PENDING
        }
      });

      // Fetch the complete registration with team and players for response
      const completeRegistration = await tx.teamRegistration.findUnique({
        where: { id: registration.id },
        include: {
          team: {
            include: {
              players: true
            }
          },
          tournament: {
            select: {
              name: true,
              venue: true,
              startDate: true
            }
          }
        }
      });

      return completeRegistration;
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      );
    }

    // Send email notifications
    try {
      // Send confirmation email to team captain
      await sendTeamRegistrationEmail(
        result.contactEmail,
        result.team.captainName || validatedData.captainName,
        result.team.name,
        result.tournament.name
      );

      // Send notification to admin
      await sendAdminRegistrationNotification(
        result.team.captainName || validatedData.captainName,
        result.team.name,
        result.tournament.name,
        result.id
      );
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Team registered successfully! You will receive a confirmation email shortly.',
      registration: {
        id: result.id,
        teamName: result.team.name,
        tournamentName: result.tournament.name,
        status: result.status,
        paymentStatus: result.paymentStatus,
        paymentMethod: result.paymentMethod,
        registrationDate: result.registrationDate
      }
    });

  } catch (error) {
    console.error('Team registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Please check your form data and try again.',
          userMessage: 'Some required information is missing or invalid. Please review your form and ensure all required fields are completed correctly.',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    // Handle Prisma validation errors
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'PrismaClientValidationError') {
        return NextResponse.json(
          { 
            error: 'Registration validation failed.',
            userMessage: 'There was an issue with the player information provided. Please ensure all player positions and experience levels are properly selected.',
            technical: false
          },
          { status: 400 }
        );
      }
      
      if (error.name === 'PrismaClientKnownRequestError' && 'code' in error) {
        if (error.code === 'P2002') {
          return NextResponse.json(
            { 
              error: 'Registration conflict detected.',
              userMessage: 'One or more players are already registered for this tournament. Please check your player list or contact support if you believe this is an error.',
              technical: false
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      { 
        error: 'Registration failed.',
        userMessage: 'We encountered an unexpected issue while processing your registration. Please try again in a few moments or contact support if the problem persists.',
        technical: false
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, RegistrationStatus, PaymentMethod, PaymentStatus, PlayerPosition, PlayerExperience, RegistrationType } from '@prisma/client';
import { z } from 'zod';
import { sendEmail, sendTeamRegistrationEmail, sendAdminRegistrationNotification } from '@/lib/emailService';
import { validateAdminSession } from '@/lib/auth';

const prisma = new PrismaClient();

// Validation schema for team registration
const TeamRegistrationSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
  captainName: z.string().min(2, 'Captain name must be at least 2 characters'),
  captainPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  captainEmail: z.string().email('Invalid email address'),
  homeGround: z.string().optional(),
  description: z.string().optional(),
  players: z.array(z.object({
    name: z.string().min(2, 'Player name must be at least 2 characters'),
    position: z.enum(['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER']),
    experience: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'])
  })).min(1, 'At least one player is required'),
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'ADMIN']).optional(),
  registrationType: z.enum(['PUBLIC', 'ADMIN']).optional()
});

interface Params {
  id: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const tournamentId = params.id;
    const body = await request.json();

    // Validate input data
    const validatedData = TeamRegistrationSchema.parse(body);

    // Check if this is an admin registration and validate session
    const isAdminRegistration = validatedData.registrationType === 'ADMIN';
    let adminUser = null;

    if (isAdminRegistration) {
      const sessionValidation = await validateAdminSession(request);
      if (!sessionValidation.isValid) {
        return NextResponse.json(
          { error: 'Admin authentication required for admin registrations' },
          { status: 401 }
        );
      }
      adminUser = sessionValidation.admin;
    }

    // Check if tournament exists and is accepting registrations
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if registration is still open
    if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }    // Check if tournament has reached max teams
    if (tournament.maxTeams) {
      const registeredTeamsCount = await prisma.teamRegistration.count({
        where: {
          tournamentId,
          status: { in: [RegistrationStatus.CONFIRMED] }
        }
      });

      if (registeredTeamsCount >= tournament.maxTeams) {
        return NextResponse.json(
          { error: 'Tournament has reached maximum number of teams' },
          { status: 400 }
        );
      }
    }

    // Check if team already registered for this tournament
    const existingRegistration = await prisma.teamRegistration.findFirst({
      where: {
        tournamentId,
        team: {
          name: validatedData.teamName,
          captainEmail: validatedData.captainEmail
        }
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Team has already registered for this tournament' },
        { status: 400 }
      );
    }

    // Start a transaction to create team and registration
    const result = await prisma.$transaction(async (tx) => {
      // Create or find the team
      let team = await tx.team.findFirst({
        where: {
          name: validatedData.teamName,
          captainEmail: validatedData.captainEmail
        }
      });

      if (!team) {
        // Create new team
        team = await tx.team.create({
          data: {
            name: validatedData.teamName,
            captainName: validatedData.captainName,
            captainPhone: validatedData.captainPhone,
            captainEmail: validatedData.captainEmail,
            homeGround: validatedData.homeGround,
            description: validatedData.description
          }
        });        // Create players for the team
        if (validatedData.players && validatedData.players.length > 0) {
          await tx.player.createMany({
            data: validatedData.players.map((player, index) => ({
              name: player.name,
              position: player.position as PlayerPosition,
              experience: player.experience as PlayerExperience,
              teamId: team!.id,
              jerseyNumber: index + 1
            }))
          });
        }
      } else {
        // Update existing team information
        team = await tx.team.update({
          where: { id: team.id },
          data: {
            captainName: validatedData.captainName,
            captainPhone: validatedData.captainPhone,
            captainEmail: validatedData.captainEmail,
            homeGround: validatedData.homeGround,
            description: validatedData.description
          }
        });

        // Update or create players
        // First, remove existing players
        await tx.player.deleteMany({
          where: { teamId: team.id }
        });        // Then create new players
        if (validatedData.players && validatedData.players.length > 0) {
          await tx.player.createMany({
            data: validatedData.players.map((player, index) => ({
              name: player.name,
              position: player.position as PlayerPosition,
              experience: player.experience as PlayerExperience,
              teamId: team!.id, // team is guaranteed to exist at this point
              jerseyNumber: index + 1
            }))
          });
        }
      }      // Create team registration
      const registration = await tx.teamRegistration.create({
        data: {
          tournamentId,
          teamId: team!.id, // team is guaranteed to exist at this point
          registrationType: isAdminRegistration ? RegistrationType.ADMIN : RegistrationType.PUBLIC,
          contactEmail: validatedData.captainEmail,
          contactPhone: validatedData.captainPhone,
          paymentAmount: tournament.entryFee,
          paymentMethod: validatedData.paymentMethod as PaymentMethod,
          specialRequests: validatedData.specialRequests,
          status: isAdminRegistration ? RegistrationStatus.CONFIRMED : RegistrationStatus.PENDING
        }
      });

      return { team, registration };
    });    // Send email notifications (skip for admin registrations)
    if (validatedData.registrationType !== 'ADMIN') {
      try {
        // 1. Confirmation email to team captain
        await sendTeamRegistrationEmail(
          validatedData.captainEmail,
          result.team.captainName || 'Team Captain',
          result.team.name,
          tournament.name
        );

        // 2. Notification email to admins
        await sendAdminRegistrationNotification(
          result.team.captainName || 'Team Captain',
          result.team.name,
          tournament.name,
          result.registration.id
        );

      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
        // Don't fail the registration if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Team registration submitted successfully',
      registrationId: result.registration.id,
      teamId: result.team.id,
      data: {
        teamName: result.team.name,
        registrationDate: result.registration.registrationDate,
        status: result.registration.status,
        paymentAmount: result.registration.paymentAmount
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register team. Please try again.' },
      { status: 500 }
    );
  }
}

// Get registration status for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const tournamentId = params.id;
    const url = new URL(request.url);
    const teamEmail = url.searchParams.get('email');

    if (!teamEmail) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Find registration by tournament and team email
    const registration = await prisma.teamRegistration.findFirst({
      where: {
        tournamentId,
        contactEmail: teamEmail
      },
      include: {
        team: true,
        tournament: {
          select: {
            name: true,
            entryFee: true
          }
        }
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'No registration found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      registrationId: registration.id,
      teamName: registration.team.name,
      tournamentName: registration.tournament.name,
      status: registration.status,
      registrationDate: registration.registrationDate,
      paymentStatus: registration.paymentStatus,
      paymentAmount: registration.paymentAmount,
      paymentMethod: registration.paymentMethod,
      specialRequests: registration.specialRequests,
      approvedAt: registration.approvedAt,
      rejectedAt: registration.rejectedAt,
      rejectionReason: registration.rejectionReason
    });

  } catch (error) {
    console.error('Error fetching registration status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration status' },
      { status: 500 }
    );
  }
}

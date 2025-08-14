import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, RegistrationStatus } from '@prisma/client';
import { 
  sendTeamRegistrationEmail, 
  sendAdminRegistrationNotification, 
  sendTeamRegistrationEmails,
  sendPlayerRegistrationEmails,
  sendTeamOwnerRegistrationEmails
} from '@/lib/emailService';
import { createRealTimeResponse } from '@/lib/apiHeaders';

const prisma = new PrismaClient();

// Get all registrations (with filters)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as RegistrationStatus | null;
    const tournamentId = url.searchParams.get('tournamentId');
    const summary = url.searchParams.get('summary') === 'true';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    // If summary is requested, return statistics only
    if (summary) {
      const [total, pending, approved, rejected] = await Promise.all([
        prisma.teamRegistration.count({ where }),
        prisma.teamRegistration.count({ where: { ...where, status: 'PENDING' } }),
        prisma.teamRegistration.count({ where: { ...where, status: 'APPROVED' } }),
        prisma.teamRegistration.count({ where: { ...where, status: 'REJECTED' } })
      ]);

      return NextResponse.json({
        total,
        pending,
        approved,
        rejected
      });
    }

    // Get registrations with pagination
    const [registrations, total] = await Promise.all([
      prisma.teamRegistration.findMany({
        where,
        include: {
          team: {
            select: {
              name: true,
              captainName: true,
              captainPhone: true,
              captainEmail: true,
              _count: {
                select: {
                  players: true
                }
              }
            }
          },
          tournament: {
            select: {
              name: true,
              venue: true,
              startDate: true,
              entryFee: true
            }
          }
        },
        orderBy: {
          registrationDate: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.teamRegistration.count({ where })
    ]);

    return NextResponse.json({
      registrations: registrations.map(reg => ({
        id: reg.id,
        status: reg.status,
        registrationDate: reg.registrationDate,
        contactEmail: reg.contactEmail,
        contactPhone: reg.contactPhone,
        paymentAmount: reg.paymentAmount,
        paymentMethod: reg.paymentMethod,
        paymentStatus: reg.paymentStatus,
        specialRequests: reg.specialRequests,
        notes: reg.notes,
        approvedAt: reg.approvedAt,
        rejectedAt: reg.rejectedAt,
        rejectionReason: reg.rejectionReason,
        team: {
          name: reg.team.name,
          captainName: reg.team.captainName,
          captainPhone: reg.team.captainPhone,
          captainEmail: reg.team.captainEmail,
          playersCount: reg.team._count.players
        },
        tournament: {
          name: reg.tournament.name,
          venue: reg.tournament.venue,
          startDate: reg.tournament.startDate,
          entryFee: reg.tournament.entryFee
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

// Create new registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tournamentId, 
      type, 
      teamName, 
      captainName, 
      captainPhone, 
      captainEmail, 
      captainAge,
      teamCity,
      players,
      emergencyContact,
      paymentMethod,
      paymentAmount,
      specialRequests,
      status = 'PENDING',
      // Player registration fields
      name,
      age,
      phone,
      email,
      city,
      position,
      battingStyle,
      bowlingStyle,
      experience,
      emergencyPhone,
      // Team owner fields
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerCity,
      ownerAge,
      sponsorName,
      sponsorContact,
      businessName,
      businessType
    } = body;

    // Validate required fields
    if (!tournamentId || !type) {
      return NextResponse.json(
        { error: 'Tournament ID and registration type are required' },
        { status: 400 }
      );
    }

    let registrationResult;

    if (type === 'TEAM') {
      // Validate team registration fields
      if (!teamName || !captainName || !captainPhone || !captainEmail) {
        return NextResponse.json(
          { error: 'Team name, captain name, phone, and email are required' },
          { status: 400 }
        );
      }

      // First create or find the team
      let team = await prisma.team.findFirst({
        where: {
          name: teamName,
          captainPhone: captainPhone
        }
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            name: teamName,
            captainName,
            captainPhone,
            captainEmail,
            captainAge: captainAge || 18,
            city: teamCity || '',
          }
        });
      }

      // Create team registration
      registrationResult = await prisma.teamRegistration.create({
        data: {
          tournamentId,
          teamId: team.id,
          contactEmail: captainEmail,
          contactPhone: captainPhone,
          registrationType: 'PUBLIC',
          paymentMethod: paymentMethod || 'UPI',
          paymentAmount: paymentAmount || 0,
          specialRequests: specialRequests || '',
          status: status as RegistrationStatus,
          registrationDate: new Date(),
        },
        include: {
          team: true,
          tournament: {
            select: {
              id: true,
              name: true,
              venue: true,
              startDate: true,
              entryFee: true,
            }
          }
        }
      });

      // Store player data separately if provided
      if (players && players.length > 0) {
        // You might want to create a separate model for storing player details
        // For now, we'll store them in specialRequests or create a separate system
      }

      // Send email notifications
      try {
        await sendTeamRegistrationEmails(registrationResult, registrationResult.tournament);
      } catch (emailError) {
        console.error('Failed to send team registration emails:', emailError);
        // Don't fail the registration if email fails
      }

    } else if (type === 'PLAYER') {
      // Validate player registration fields
      if (!name || !phone || !email) {
        return NextResponse.json(
          { error: 'Name, phone, and email are required for player registration' },
          { status: 400 }
        );
      }

      // Create auction player registration
      registrationResult = await prisma.auctionPlayer.create({
        data: {
          tournamentId,
          name,
          age: age || 18,
          phone,
          email,
          city: city || '',
          position: position || 'BATSMAN',
          battingStyle: battingStyle || 'RIGHT_HANDED',
          bowlingStyle: bowlingStyle || 'RIGHT_ARM_MEDIUM',
          experience: experience || 'INTERMEDIATE',
          auctionStatus: 'AVAILABLE',
        },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              venue: true,
              startDate: true,
              playerEntryFee: true,
            }
          }
        }
      });

      // Send email notifications
      try {
        await sendPlayerRegistrationEmails(registrationResult, registrationResult.tournament);
      } catch (emailError) {
        console.error('Failed to send player registration emails:', emailError);
        // Don't fail the registration if email fails
      }

    } else if (type === 'OWNER') {
      // Validate team owner fields
      if (!ownerName || !ownerPhone || !ownerEmail || !teamName) {
        return NextResponse.json(
          { error: 'Owner name, phone, email, and team name are required' },
          { status: 400 }
        );
      }

      // Get the next team index for this tournament
      const existingOwners = await prisma.teamOwner.count({
        where: { tournamentId }
      });

      // Create team owner registration
      registrationResult = await prisma.teamOwner.create({
        data: {
          tournamentId,
          ownerName,
          ownerPhone,
          ownerEmail,
          ownerCity: ownerCity || '',
          teamName,
          teamIndex: existingOwners + 1,
          sponsorName: sponsorName || '',
          sponsorContact: sponsorContact || '',
          entryFeePaid: false,
          verified: false,
        },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              venue: true,
              startDate: true,
              teamEntryFee: true,
            }
          }
        }
      });

      // Send email notifications
      try {
        await sendTeamOwnerRegistrationEmails(registrationResult, registrationResult.tournament);
      } catch (emailError) {
        console.error('Failed to send team owner registration emails:', emailError);
        // Don't fail the registration if email fails
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid registration type. Must be TEAM, PLAYER, or OWNER' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      registration: registrationResult,
      message: `${type.toLowerCase()} registration created successfully`
    });

  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

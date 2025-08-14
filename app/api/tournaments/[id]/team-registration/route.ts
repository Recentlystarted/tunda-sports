import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
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
      registrationType = 'PUBLIC'
    } = body

    // Get tournament details
    const tournament = await prisma.tournament.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check if registration is still open
    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json(
        { success: false, error: 'Registration is closed for this tournament' },
        { status: 400 }
      )
    }

    // Check if tournament is full
    if (tournament._count.registrations >= (tournament.maxTeams || 100)) {
      return NextResponse.json(
        { success: false, error: 'Tournament is full' },
        { status: 400 }
      )
    }

    // Check if team name already exists in this tournament
    const existingRegistration = await prisma.teamRegistration.findFirst({
      where: {
        tournamentId: id,
        team: {
          name: teamName
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { success: false, error: 'A team with this name is already registered' },
        { status: 400 }
      )
    }

    // Create or find existing team
    let team = await prisma.team.findFirst({
      where: {
        name: teamName,
        captainPhone: captainPhone
      }
    })

    if (!team) {
      // Create new team
      team = await prisma.team.create({
        data: {
          name: teamName,
          captainName,
          captainPhone,
          captainEmail,
          captainAge,
          city: teamCity,
          // Create players if provided
          players: players && players.length > 0 ? {
            create: players.map((player: any, index: number) => ({
              name: player.name,
              age: player.age,
              phone: player.phone,
              email: player.email || null,
              city: player.city || teamCity,
              position: player.position || 'BATSMAN',
              battingStyle: player.battingStyle || 'RIGHT_HANDED',
              bowlingStyle: player.bowlingStyle || 'RIGHT_ARM_MEDIUM',
              experience: player.experience || 'INTERMEDIATE',
              isSubstitute: index >= (tournament.teamSize || 11),
              emergencyContact: player.emergencyContact || emergencyContact.name,
              emergencyPhone: player.emergencyPhone || emergencyContact.phone,
              emergencyRelation: emergencyContact.relation || 'Team Contact'
            }))
          } : undefined
        }
      })
    } else {
      // Update existing team if needed
      await prisma.team.update({
        where: { id: team.id },
        data: {
          captainName,
          captainPhone,
          captainEmail,
          captainAge,
          city: teamCity
        }
      })

      // Add new players if provided
      if (players && players.length > 0) {
        await prisma.player.createMany({
          data: players.map((player: any, index: number) => ({
            teamId: team!.id,
            name: player.name,
            age: player.age,
            phone: player.phone,
            email: player.email || null,
            city: player.city || teamCity,
            position: player.position || 'BATSMAN',
            battingStyle: player.battingStyle || 'RIGHT_HANDED',
            bowlingStyle: player.bowlingStyle || 'RIGHT_ARM_MEDIUM',
            experience: player.experience || 'INTERMEDIATE',
            isSubstitute: index >= (tournament.teamSize || 11),
            emergencyContact: player.emergencyContact || emergencyContact.name,
            emergencyPhone: player.emergencyPhone || emergencyContact.phone,
            emergencyRelation: emergencyContact.relation || 'Team Contact'
          })),
          skipDuplicates: true
        })
      }
    }

    // Create team registration
    const registration = await prisma.teamRegistration.create({
      data: {
        tournamentId: id,
        teamId: team.id,
        registrationType,
        contactEmail: captainEmail,
        contactPhone: captainPhone,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PENDING',
        paymentAmount,
        paymentMethod,
        specialRequests,
        notes: `Emergency Contact: ${emergencyContact.name} (${emergencyContact.phone}) - ${emergencyContact.relation}`
      }
    })

    // Send notification email (you can implement this)
    // await sendTeamRegistrationEmail(captainEmail, tournament, team, registration)

    return NextResponse.json({
      success: true,
      message: 'Team registration submitted successfully',
      registration: {
        id: registration.id,
        status: registration.status,
        paymentStatus: registration.paymentStatus,
        team: {
          id: team.id,
          name: team.name
        }
      }
    })

  } catch (error) {
    console.error('Error registering team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register team' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrations = await prisma.teamRegistration.findMany({
      where: {
        tournamentId: params.id
      },
      include: {
        team: {
          include: {
            players: true
          }
        }
      },
      orderBy: {
        registrationDate: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      registrations
    })

  } catch (error) {
    console.error('Error fetching team registrations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}

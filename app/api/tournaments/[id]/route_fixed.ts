import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            team: {
              include: {
                players: true
              }
            }
          }
        },
        matches: true,
        images: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            registrations: true,
            matches: true
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tournament
    })
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    
    const {
      name,
      description,
      format,
      customFormat,
      venue,
      venueAddress,
      customMapsLink,
      startDate,
      endDate,
      registrationDeadline,
      maxTeams,
      entryFee,
      totalPrizePool,
      ageLimit,
      teamSize,
      substitutes,
      status,
      rules,
      requirements,
      winners,
      otherPrizes,
      organizers,
      overs
    } = body

    // Basic validation
    if (!name || !description || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        name,
        description,
        format: format || 'T20',
        customFormat: format === 'CUSTOM' ? customFormat : null,
        venue: venue || 'Tunda Cricket Ground',
        venueAddress,
        customMapsLink,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: new Date(registrationDeadline),
        maxTeams: parseInt(maxTeams) || 16,
        entryFee: parseInt(entryFee) || 0,
        totalPrizePool: parseInt(totalPrizePool) || 0,
        ageLimit,
        teamSize: parseInt(teamSize) || 11,
        substitutes: parseInt(substitutes) || 4,
        status: status || 'UPCOMING',
        rules,
        requirements: requirements || null,
        winners,
        otherPrizes,
        organizers,
        overs: parseInt(overs) || null
      },
      include: {
        registrations: {
          include: {
            team: true
          }
        },
        images: true,
        _count: {
          select: {
            registrations: true,
            matches: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      tournament
    })
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tournament' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // First, delete related data in correct order (due to foreign key constraints)
    
    // Delete matches first
    await prisma.match.deleteMany({
      where: { tournamentId: id }
    })

    // Delete tournament images
    await prisma.tournamentImage.deleteMany({
      where: { tournamentId: id }
    })

    // Delete team registrations (this will automatically handle the cascade)
    await prisma.teamRegistration.deleteMany({
      where: { tournamentId: id }
    })

    // Finally, delete the tournament itself
    const deletedTournament = await prisma.tournament.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Tournament deleted successfully',
      deletedTournament: {
        id: deletedTournament.id,
        name: deletedTournament.name
      }
    })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tournament' },
      { status: 500 }
    )
  }
}

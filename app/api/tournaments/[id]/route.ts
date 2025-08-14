import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const {
      name,
      description,
      format,
      competitionType,
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
      overs,
      status,
      rules,
      organizers,
      winners,
      otherPrizes,
      // Auction fields
      playerEntryFee,
      teamEntryFee,
      minPlayerPoints,
      ownerParticipationCost,
      auctionTeamCount,
      playerPoolSize,
      auctionBudget,
      auctionDate,
      minPlayersPerTeam,
      maxPlayersPerTeam,
      retentionAllowed,
      tradingEnabled,
      requireTeamOwners,
      entryFeeType
    } = body

    // Basic validation
    if (!name || !competitionType || !startDate || !venue) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Determine if tournament is auction-based from competition type
    const isAuctionBasedType = ['AUCTION_BASED_FIXED_TEAMS', 'AUCTION_BASED_GROUPS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(competitionType)

    const tournament = await prisma.tournament.update({
      where: { id },      data: {
        name,
        description,
        format: format || 'T20',
        competitionType: competitionType || 'LEAGUE',
        customFormat: (competitionType === 'CUSTOM' || format === 'CUSTOM') ? customFormat : null,
        venue,
        venueAddress,
        customMapsLink,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        maxTeams: maxTeams ? parseInt(maxTeams.toString()) : null,
        entryFee: entryFee ? parseInt(entryFee.toString()) : 0,
        totalPrizePool: totalPrizePool ? parseInt(totalPrizePool.toString()) : 0,        ageLimit,
        teamSize: parseInt(teamSize.toString()) || 11,
        substitutes: parseInt(substitutes.toString()) || 4,
        overs: overs ? parseInt(overs.toString()) : null,
        status: status || 'UPCOMING',
        isAuctionBased: isAuctionBasedType, // Auto-set based on competition type
        // Auction fields
        ...(playerEntryFee !== undefined && { playerEntryFee: parseInt(playerEntryFee.toString()) || 0 }),
        ...(teamEntryFee !== undefined && { teamEntryFee: parseInt(teamEntryFee.toString()) || 0 }),
        ...(minPlayerPoints !== undefined && { minPlayerPoints: parseInt(minPlayerPoints.toString()) || 500 }),
        ...(ownerParticipationCost !== undefined && { ownerParticipationCost: parseInt(ownerParticipationCost.toString()) || 500 }),
        ...(auctionTeamCount !== undefined && { auctionTeamCount: parseInt(auctionTeamCount.toString()) || null }),
        ...(playerPoolSize !== undefined && { playerPoolSize: parseInt(playerPoolSize.toString()) || null }),
        ...(auctionBudget !== undefined && { auctionBudget: parseInt(auctionBudget.toString()) || null }),
        ...(auctionDate && { auctionDate: new Date(auctionDate) }),
        ...(minPlayersPerTeam !== undefined && { minPlayersPerTeam: parseInt(minPlayersPerTeam.toString()) || null }),
        ...(maxPlayersPerTeam !== undefined && { maxPlayersPerTeam: parseInt(maxPlayersPerTeam.toString()) || null }),
        ...(retentionAllowed !== undefined && { retentionAllowed: Boolean(retentionAllowed) }),
        ...(tradingEnabled !== undefined && { tradingEnabled: Boolean(tradingEnabled) }),
        ...(requireTeamOwners !== undefined && { requireTeamOwners: Boolean(requireTeamOwners) }),
        ...(entryFeeType && { entryFeeType }),
        rules,
        organizers,
        winners,
        otherPrizes,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            registrations: true,
            matches: true
          }
        },
        images: {
          take: 3,
          orderBy: {
            createdAt: 'desc'
          }
        },
        registrations: {
          take: 5,          include: {
            team: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      tournament
    });
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log(`Starting deletion process for tournament: ${id}`)
    
    // First, delete related data in correct order (due to foreign key constraints)
    
    // Delete auction-specific data first
    console.log('Deleting auction bids...')
    const deletedBids = await prisma.auctionBid.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedBids.count} auction bids`)
    
    console.log('Deleting auction rounds...')
    const deletedRounds = await prisma.auctionRound.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedRounds.count} auction rounds`)
    
    console.log('Deleting auction players...')
    const deletedPlayers = await prisma.auctionPlayer.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedPlayers.count} auction players`)
    
    console.log('Deleting auction teams...')
    const deletedTeams = await prisma.auctionTeam.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedTeams.count} auction teams`)
    
    console.log('Deleting team owners...')
    const deletedOwners = await prisma.teamOwner.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedOwners.count} team owners`)
    
    console.log('Deleting tournament payment methods...')
    const deletedPaymentMethods = await prisma.tournamentPaymentMethod.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedPaymentMethods.count} payment methods`)
    
    // Delete matches
    console.log('Deleting matches...')
    const deletedMatches = await prisma.match.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedMatches.count} matches`)

    // Delete tournament images and photo sections
    console.log('Deleting tournament images...')
    const deletedImages = await prisma.tournamentImage.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedImages.count} images`)
    
    console.log('Deleting photo sections...')
    const deletedSections = await prisma.tournamentPhotoSection.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedSections.count} photo sections`)

    // Delete team registrations
    console.log('Deleting team registrations...')
    const deletedRegistrations = await prisma.teamRegistration.deleteMany({
      where: { tournamentId: id }
    })
    console.log(`Deleted ${deletedRegistrations.count} team registrations`)

    // Finally, delete the tournament
    console.log('Deleting tournament...')
    const deletedTournament = await prisma.tournament.delete({
      where: { id }
    })
    console.log(`Tournament ${deletedTournament.name} deleted successfully`)

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
      { success: false, error: 'Failed to delete tournament', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
            matches: true,
            images: true,
            photoSections: true
          }
        },
        images: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        registrations: {
          include: {
            team: true
          }
        },
        matches: {
          orderBy: {
            matchDate: 'asc'
          }
        },
        photoSections: {
          where: {
            isActive: true
          },
          include: {
            _count: {
              select: {
                images: true
              }
            }
          },
          orderBy: {
            order: 'asc'
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

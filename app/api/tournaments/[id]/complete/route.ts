import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id
    const body = await request.json()
    const { action } = body

    if (action !== 'move_auction_players') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get the tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        auctionPlayers: {
          where: {
            auctionStatus: 'APPROVED' // Only approved players
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

    if (!tournament.isAuctionBased) {
      return NextResponse.json(
        { success: false, error: 'This is not an auction-based tournament' },
        { status: 400 }
      )
    }

    // Process approved auction players
    const movedPlayers = []
    const updatedPlayers = []
    const errors = []

    for (const auctionPlayer of tournament.auctionPlayers) {
      try {
        // Check if player already exists in Player table
        const existingPlayer = await prisma.player.findFirst({
          where: {
            OR: [
              { 
                AND: [
                  { name: auctionPlayer.name },
                  { phone: auctionPlayer.phone }
                ]
              },
              { 
                AND: [
                  { name: auctionPlayer.name },
                  { email: auctionPlayer.email }
                ]
              },
              {
                AND: [
                  { name: auctionPlayer.name },
                  { city: auctionPlayer.city }
                ]
              }
            ]
          }
        })

        const playerData = {
          name: auctionPlayer.name,
          email: auctionPlayer.email,
          phone: auctionPlayer.phone,
          dateOfBirth: (auctionPlayer as any).dateOfBirth,
          address: (auctionPlayer as any).address,
          city: auctionPlayer.city,
          state: (auctionPlayer as any).state || 'Gujarat',
          pincode: (auctionPlayer as any).pincode,
          position: auctionPlayer.position,
          battingStyle: auctionPlayer.battingStyle,
          bowlingStyle: auctionPlayer.bowlingStyle,
          experience: auctionPlayer.experience,
          age: auctionPlayer.age,
          fatherName: (auctionPlayer as any).fatherName,
          emergencyContact: (auctionPlayer as any).emergencyContact,
          emergencyPhone: (auctionPlayer as any).emergencyPhone,
          emergencyRelation: (auctionPlayer as any).emergencyRelation,
          profileImageUrl: (auctionPlayer as any).profileImageUrl,
          totalMatches: auctionPlayer.totalMatches || 0,
          totalRuns: auctionPlayer.totalRuns || 0,
          totalWickets: auctionPlayer.totalWickets || 0,
          searchKeywords: `${auctionPlayer.name} ${auctionPlayer.city} ${(auctionPlayer as any).fatherName || ''}`.toLowerCase(),
          isActive: true
        }

        if (existingPlayer) {
          // Update existing player with new information
          await prisma.player.update({
            where: { id: existingPlayer.id },
            data: playerData
          })
          updatedPlayers.push({
            auctionPlayerId: auctionPlayer.id,
            playerId: existingPlayer.id,
            name: auctionPlayer.name,
            action: 'updated'
          })
        } else {
          // Create new player
          const newPlayer = await prisma.player.create({
            data: playerData
          })
          movedPlayers.push({
            auctionPlayerId: auctionPlayer.id,
            playerId: newPlayer.id,
            name: auctionPlayer.name,
            action: 'created'
          })
        }

        // Update auction player status to indicate it has been processed
        await prisma.auctionPlayer.update({
          where: { id: auctionPlayer.id },
          data: { auctionStatus: 'MOVED_TO_PLAYER_TABLE' }
        })

      } catch (error) {
        console.error(`Error processing auction player ${auctionPlayer.name}:`, error)
        errors.push({
          auctionPlayerId: auctionPlayer.id,
          name: auctionPlayer.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Update tournament status to completed if requested
    if (body.markCompleted) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'COMPLETED' }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Auction players processed successfully',
      results: {
        movedPlayers: movedPlayers.length,
        updatedPlayers: updatedPlayers.length,
        errors: errors.length,
        details: {
          moved: movedPlayers,
          updated: updatedPlayers,
          errors
        }
      }
    })

  } catch (error) {
    console.error('Error completing tournament:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete tournament' },
      { status: 500 }
    )
  }
}

// Get tournament completion status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: {
            auctionPlayers: true
          }
        },
        auctionPlayers: {
          select: {
            id: true,
            name: true,
            auctionStatus: true
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

    const statusCount = tournament.auctionPlayers.reduce((acc, player) => {
      acc[player.auctionStatus || 'AVAILABLE'] = (acc[player.auctionStatus || 'AVAILABLE'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        isAuctionBased: tournament.isAuctionBased,
        totalAuctionPlayers: tournament._count.auctionPlayers,
        auctionPlayerStatus: statusCount
      }
    })

  } catch (error) {
    console.error('Error getting tournament completion status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get tournament status' },
      { status: 500 }
    )
  }
}

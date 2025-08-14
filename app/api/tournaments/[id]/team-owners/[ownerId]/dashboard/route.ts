import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get team owner data with their players and recent activity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ownerId: string }> }
) {
  try {
    const { id: tournamentId, ownerId } = await params;

    // Get team owner details
    const teamOwner = await prisma.teamOwner.findUnique({
      where: { id: ownerId },
      select: {
        id: true,
        teamName: true,
        teamIndex: true,
        ownerName: true,
        ownerPhone: true,
        ownerEmail: true,
        ownerCity: true,
        sponsorName: true,
        totalBudget: true,
        remainingBudget: true,
        currentPlayers: true,
        minPlayersNeeded: true,
        isParticipating: true
      }
    });

    if (!teamOwner) {
      return NextResponse.json(
        { error: 'Team owner not found' },
        { status: 404 }
      );
    }

    // Get all sold players for this team
    const myPlayers = await prisma.auctionPlayer.findMany({
      where: {
        tournamentId,
        auctionStatus: 'SOLD',
        auctionTeam: {
          ownerName: teamOwner.ownerName,
          name: teamOwner.teamName
        }
      },
      select: {
        id: true,
        name: true,
        position: true,
        age: true,
        city: true,
        experience: true,
        battingStyle: true,
        bowlingStyle: true,
        basePrice: true,
        soldPrice: true,
        profileImageUrl: true,
        specialSkills: true,
        totalMatches: true,
        totalRuns: true,
        totalWickets: true,
        auctionTeam: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Get recently sold players across all teams (last 10)
    const recentlySoldPlayers = await prisma.auctionPlayer.findMany({
      where: {
        tournamentId,
        auctionStatus: 'SOLD'
      },
      include: {
        auctionTeam: {
          select: {
            id: true,
            name: true,
            ownerName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Calculate team statistics
    const totalSpent = myPlayers.reduce((sum, player) => sum + (player.soldPrice || 0), 0);
    const averagePrice = myPlayers.length > 0 ? Math.round(totalSpent / myPlayers.length) : 0;
    
    // Position breakdown
    const positionBreakdown = myPlayers.reduce((acc, player) => {
      const pos = player.position || 'UNKNOWN';
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get current auction status
    const currentRound = await prisma.auctionRound.findFirst({
      where: {
        tournamentId,
        status: 'ACTIVE'
      },
      include: {
        currentPlayer: {
          select: {
            id: true,
            name: true,
            position: true,
            basePrice: true,
            profileImageUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      teamOwner,
      myPlayers,
      recentlySoldPlayers,
      statistics: {
        totalSpent,
        averagePrice,
        positionBreakdown,
        playersNeeded: Math.max(0, teamOwner.minPlayersNeeded - teamOwner.currentPlayers),
        budgetUtilization: Math.round((totalSpent / teamOwner.totalBudget) * 100)
      },
      currentAuction: {
        isActive: currentRound !== null,
        currentPlayer: currentRound?.currentPlayer || null
      }
    });

  } catch (error) {
    console.error('Error fetching team owner data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team owner data' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get auction status and live data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    // Get tournament with auction settings
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        auctionBudget: true,
        minPlayerPoints: true,
        ownerParticipationCost: true,
        minPlayersPerTeam: true,
        maxPlayersPerTeam: true,
        auctionStatus: true,
        auctionDate: true
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get all team owners with their current budget status
    const teamOwners = await prisma.teamOwner.findMany({
      where: { 
        tournamentId,
        verified: true 
      },
      select: {
        id: true,
        teamName: true,
        ownerName: true,
        totalBudget: true,
        remainingBudget: true,
        isParticipating: true,
        currentPlayers: true,
        minPlayersNeeded: true
      },
      orderBy: {
        teamIndex: 'asc'
      }
    });

    // Get current active round with current player and bids
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
            profileImageUrl: true,
            age: true,
            city: true,
            experience: true,
            battingStyle: true,
            bowlingStyle: true
          }
        }
      }
    });

    // If there's a current player, get their bids separately
    let currentPlayerBids: any[] = [];
    if (currentRound?.currentPlayer) {
      currentPlayerBids = await prisma.auctionBid.findMany({
        where: {
          playerId: currentRound.currentPlayer.id,
          status: 'ACTIVE'
        },
        include: {
          teamOwner: {
            select: {
              id: true,
              teamName: true,
              ownerName: true
            }
          }
        },
        orderBy: {
          bidAmount: 'desc'
        }
      });
    }

    return NextResponse.json({
      success: true,
      tournament,
      teamOwners,
      currentRound: currentRound ? {
        ...currentRound,
        currentPlayer: currentRound.currentPlayer ? {
          ...currentRound.currentPlayer,
          bids: currentPlayerBids
        } : null
      } : null,
      auctionLive: currentRound !== null
    });

  } catch (error) {
    console.error('Error fetching auction data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction data' },
      { status: 500 }
    );
  }
}

// Start/Stop auction or manage rounds
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const body = await request.json();
    const { action, roundName, playerIds } = body;

    switch (action) {
      case 'START_AUCTION':
        // Update tournament status
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { auctionStatus: 'ONGOING' }
        });

        return NextResponse.json({
          success: true,
          message: 'Auction started successfully'
        });

      case 'PAUSE_AUCTION':
        // Pause the auction
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { auctionStatus: 'PAUSED' }
        });

        return NextResponse.json({
          success: true,
          message: 'Auction paused successfully'
        });

      case 'RESUME_AUCTION':
        // Resume the auction
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { auctionStatus: 'ONGOING' }
        });

        return NextResponse.json({
          success: true,
          message: 'Auction resumed successfully'
        });

      case 'CREATE_ROUND':
        // Get next round number
        const lastRound = await prisma.auctionRound.findFirst({
          where: { tournamentId },
          orderBy: { roundNumber: 'desc' }
        });

        const roundNumber = (lastRound?.roundNumber || 0) + 1;

        // Create new round
        const newRound = await prisma.auctionRound.create({
          data: {
            tournamentId,
            roundNumber,
            roundName: roundName || `Round ${roundNumber}`,
            status: 'PENDING'
          }
        });

        // Add players to round if provided
        if (playerIds && playerIds.length > 0) {
          await prisma.auctionPlayer.updateMany({
            where: {
              id: { in: playerIds },
              tournamentId
            },
            data: {
              roundId: newRound.id
            }
          });
        }

        return NextResponse.json({
          success: true,
          round: newRound,
          message: 'Round created successfully'
        });

      case 'START_ROUND':
        const { roundId } = body;
        
        // Deactivate any active rounds
        await prisma.auctionRound.updateMany({
          where: {
            tournamentId,
            status: 'ACTIVE'
          },
          data: { status: 'COMPLETED' }
        });

        // Activate the new round
        await prisma.auctionRound.update({
          where: { id: roundId },
          data: { status: 'ACTIVE' }
        });

        return NextResponse.json({
          success: true,
          message: 'Round started successfully'
        });

      case 'SET_CURRENT_PLAYER':
        const { playerId } = body;
        
        console.log('🎯 SET_CURRENT_PLAYER - Player ID:', playerId);
        console.log('🏟️ Tournament ID:', tournamentId);
        
        if (!playerId) {
          return NextResponse.json(
            { error: 'Player ID is required' },
            { status: 400 }
          );
        }

        // Find the active round
        let activeRound = await prisma.auctionRound.findFirst({
          where: {
            tournamentId,
            status: 'ACTIVE'
          }
        });

        console.log('🔍 Found active round:', activeRound);

        if (!activeRound) {
          // If no active round, create one or activate the latest round
          const latestRound = await prisma.auctionRound.findFirst({
            where: { tournamentId },
            orderBy: { createdAt: 'desc' }
          });

          console.log('🔍 Found latest round:', latestRound);

          if (latestRound) {
            activeRound = await prisma.auctionRound.update({
              where: { id: latestRound.id },
              data: { status: 'ACTIVE' }
            });
            console.log('✅ Activated existing round:', activeRound);
          } else {
            // Create a default round if none exists
            activeRound = await prisma.auctionRound.create({
              data: {
                tournamentId,
                roundNumber: 1,
                roundName: 'General Round',
                status: 'ACTIVE'
              }
            });
            console.log('✅ Created new round:', activeRound);
          }
        }

        // Set the current player for the round
        if (activeRound) {
          const updatedRound = await prisma.auctionRound.update({
            where: { id: activeRound.id },
            data: { currentPlayerId: playerId }
          });
          console.log('✅ Updated round with current player:', updatedRound);
        }

        return NextResponse.json({
          success: true,
          message: 'Current player set successfully',
          playerId
        });

      case 'SELL_PLAYER':
        const { teamId, finalAmount } = body;
        
        if (!teamId || !finalAmount) {
          return NextResponse.json(
            { error: 'Team ID and final amount are required' },
            { status: 400 }
          );
        }

        // Find the active round with current player
        const activeRoundForSale = await prisma.auctionRound.findFirst({
          where: {
            tournamentId,
            status: 'ACTIVE',
            currentPlayerId: { not: null }
          },
          include: {
            currentPlayer: true
          }
        });

        if (!activeRoundForSale || !activeRoundForSale.currentPlayer) {
          return NextResponse.json(
            { error: 'No current player to sell' },
            { status: 400 }
          );
        }

        // Find the TeamOwner to get team details
        const teamOwner = await prisma.teamOwner.findUnique({
          where: { id: teamId }
        });

        if (!teamOwner) {
          return NextResponse.json(
            { error: 'Team not found' },
            { status: 400 }
          );
        }

        // Find or create the corresponding AuctionTeam record
        let auctionTeam = await prisma.auctionTeam.findFirst({
          where: {
            tournamentId,
            ownerName: teamOwner.ownerName,
            name: teamOwner.teamName
          }
        });

        if (!auctionTeam) {
          // Create AuctionTeam record if it doesn't exist
          auctionTeam = await prisma.auctionTeam.create({
            data: {
              tournamentId,
              name: teamOwner.teamName,
              ownerName: teamOwner.ownerName,
              ownerEmail: teamOwner.ownerEmail,
              totalBudget: teamOwner.totalBudget,
              remainingBudget: teamOwner.remainingBudget,
              playersCount: teamOwner.currentPlayers
            }
          });
        }

        // Update team owner budget
        await prisma.teamOwner.update({
          where: { id: teamId },
          data: {
            remainingBudget: { decrement: finalAmount },
            currentPlayers: { increment: 1 }
          }
        });

        // Also update auction team budget
        await prisma.auctionTeam.update({
          where: { id: auctionTeam.id },
          data: {
            remainingBudget: { decrement: finalAmount },
            playersCount: { increment: 1 }
          }
        });

        // Mark player as sold
        await prisma.auctionPlayer.update({
          where: { id: activeRoundForSale.currentPlayerId! },
          data: {
            auctionStatus: 'SOLD',
            auctionTeamId: auctionTeam.id,
            soldPrice: finalAmount
          }
        });

        // Clear current player from round
        await prisma.auctionRound.update({
          where: { id: activeRoundForSale.id },
          data: { currentPlayerId: null }
        });

        return NextResponse.json({
          success: true,
          message: 'Player sold successfully',
          soldPlayer: {
            playerId: activeRoundForSale.currentPlayerId,
            teamId: auctionTeam.id,
            finalAmount
          }
        });

      case 'UNSOLD_PLAYER':
        // Find the active round with current player
        const activeRoundForUnsold = await prisma.auctionRound.findFirst({
          where: {
            tournamentId,
            status: 'ACTIVE',
            currentPlayerId: { not: null }
          }
        });

        if (!activeRoundForUnsold || !activeRoundForUnsold.currentPlayerId) {
          return NextResponse.json(
            { error: 'No current player to mark unsold' },
            { status: 400 }
          );
        }

        // Mark player as unsold
        await prisma.auctionPlayer.update({
          where: { id: activeRoundForUnsold.currentPlayerId! },
          data: { auctionStatus: 'UNSOLD' }
        });

        // Clear current player from round
        await prisma.auctionRound.update({
          where: { id: activeRoundForUnsold.id },
          data: { currentPlayerId: null }
        });

        return NextResponse.json({
          success: true,
          message: 'Player marked as unsold'
        });

      case 'END_AUCTION':
        // Complete all rounds and end auction
        await prisma.auctionRound.updateMany({
          where: { tournamentId },
          data: { status: 'COMPLETED' }
        });

        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { auctionStatus: 'COMPLETED' }
        });

        return NextResponse.json({
          success: true,
          message: 'Auction completed successfully'
        });

      case 'PLACE_BID':
        const { teamId: bidTeamId, bidAmount, bidTimestamp, sessionId } = body;
        
        if (!bidTeamId || !bidAmount || bidAmount <= 0) {
          return NextResponse.json(
            { error: 'Team ID and valid bid amount are required' },
            { status: 400 }
          );
        }

        // Find the active round with current player
        const activeRoundForBid = await prisma.auctionRound.findFirst({
          where: {
            tournamentId,
            status: 'ACTIVE',
            currentPlayerId: { not: null }
          },
          include: {
            currentPlayer: true
          }
        });

        if (!activeRoundForBid || !activeRoundForBid.currentPlayer) {
          return NextResponse.json(
            { error: 'No active player for bidding' },
            { status: 400 }
          );
        }

        // Check team budget
        const bidTeamOwner = await prisma.teamOwner.findUnique({
          where: { id: bidTeamId }
        });

        if (!bidTeamOwner || bidTeamOwner.remainingBudget < bidAmount) {
          return NextResponse.json(
            { error: 'Insufficient budget' },
            { status: 400 }
          );
        }

        // Create bid with conflict resolution support
        const newBid = await prisma.auctionBid.create({
          data: {
            tournamentId,
            playerId: activeRoundForBid.currentPlayerId!,
            teamOwnerId: bidTeamId,
            bidAmount,
            status: 'ACTIVE'
          }
        });

        return NextResponse.json({
          success: true,
          bid: newBid,
          message: 'Bid placed successfully'
        });

      case 'ASSIGN_PLAYERS_TO_ROUND':
        const { roundId: assignRoundId, playerIds: assignPlayerIds } = body;
        
        if (!assignRoundId || !assignPlayerIds || assignPlayerIds.length === 0) {
          return NextResponse.json(
            { error: 'Round ID and player IDs are required' },
            { status: 400 }
          );
        }

        // Update players to assign them to the round
        await prisma.auctionPlayer.updateMany({
          where: {
            id: { in: assignPlayerIds },
            tournamentId
          },
          data: {
            roundId: assignRoundId
          }
        });

        return NextResponse.json({
          success: true,
          message: `${assignPlayerIds.length} players assigned to round`
        });

      case 'RESELECT_PLAYER':
        const { playerId: reselectPlayerId, reason } = body;
        
        if (!reselectPlayerId) {
          return NextResponse.json(
            { error: 'Player ID is required' },
            { status: 400 }
          );
        }

        // Mark player as available again (if they were unsold)
        const playerToReselect = await prisma.auctionPlayer.findUnique({
          where: { id: reselectPlayerId }
        });

        if (!playerToReselect) {
          return NextResponse.json(
            { error: 'Player not found' },
            { status: 404 }
          );
        }

        if (playerToReselect.auctionStatus !== 'UNSOLD') {
          return NextResponse.json(
            { error: 'Player is not available for reselection' },
            { status: 400 }
          );
        }

        await prisma.auctionPlayer.update({
          where: { id: reselectPlayerId },
          data: {
            auctionStatus: 'AVAILABLE',
            auctionTeamId: null,
            soldPrice: null
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Player is now available for auction again'
        });

      case 'BULK_CREATE_ROUNDS':
        const { rounds: bulkRounds } = body;
        
        if (!bulkRounds || !Array.isArray(bulkRounds) || bulkRounds.length === 0) {
          return NextResponse.json(
            { error: 'Rounds array is required' },
            { status: 400 }
          );
        }

        const createdRounds = [];
        
        for (let i = 0; i < bulkRounds.length; i++) {
          const roundData = bulkRounds[i];
          
          // Get next round number
          const lastRoundForBulk = await prisma.auctionRound.findFirst({
            where: { tournamentId },
            orderBy: { roundNumber: 'desc' }
          });

          const roundNumber = (lastRoundForBulk?.roundNumber || 0) + 1 + i;

          // Create round
          const newRoundForBulk = await prisma.auctionRound.create({
            data: {
              tournamentId,
              roundNumber,
              roundName: roundData.name,
              status: 'PENDING'
            }
          });

          // Assign players if provided
          if (roundData.playerIds && roundData.playerIds.length > 0) {
            await prisma.auctionPlayer.updateMany({
              where: {
                id: { in: roundData.playerIds },
                tournamentId
              },
              data: {
                roundId: newRoundForBulk.id
              }
            });
          }

          createdRounds.push(newRoundForBulk);
        }

        return NextResponse.json({
          success: true,
          rounds: createdRounds,
          message: `${createdRounds.length} rounds created successfully`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error managing auction:', error);
    return NextResponse.json(
      { error: 'Failed to manage auction' },
      { status: 500 }
    );
  }
}

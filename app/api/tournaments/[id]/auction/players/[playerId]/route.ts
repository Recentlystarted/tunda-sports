import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sell/Assign player to team owner
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const tournamentId = params.id;
    const playerId = params.playerId;
    const body = await request.json();
    const { action, teamOwnerId, finalPrice, bidAmount } = body;

    switch (action) {
      case 'SELL_TO_TEAM':
        // Sell to specific team with specific bid amount (admin override)
        if (!teamOwnerId || !bidAmount) {
          return NextResponse.json(
            { error: 'Team owner ID and bid amount required for direct sale' },
            { status: 400 }
          );
        }

        // Validate team owner
        const targetTeamOwner = await prisma.teamOwner.findUnique({
          where: { id: teamOwnerId },
          select: {
            id: true,
            teamName: true,
            ownerName: true,
            remainingBudget: true,
            currentPlayers: true,
            minPlayersNeeded: true
          }
        });

        if (!targetTeamOwner) {
          return NextResponse.json(
            { error: 'Team owner not found' },
            { status: 404 }
          );
        }

        // Check budget (allow admin override if needed, but warn)
        if (bidAmount > targetTeamOwner.remainingBudget) {
          return NextResponse.json(
            { error: `Team ${targetTeamOwner.teamName} does not have sufficient budget (${targetTeamOwner.remainingBudget} available, ${bidAmount} required)` },
            { status: 400 }
          );
        }

        // Get player details
        const playerToSell = await prisma.auctionPlayer.findUnique({
          where: { id: playerId },
          select: { id: true, name: true, basePrice: true, auctionStatus: true }
        });

        if (!playerToSell || playerToSell.auctionStatus !== 'AVAILABLE') {
          return NextResponse.json(
            { error: 'Player is not available for auction' },
            { status: 400 }
          );
        }

        // Create/update winning bid for this team and manage budgets in transaction
        await prisma.$transaction(async (tx) => {
          // First, restore budgets to all current bidders
          const currentBids = await tx.auctionBid.findMany({
            where: {
              playerId,
              status: 'ACTIVE'
            },
            include: {
              teamOwner: {
                select: {
                  id: true,
                  remainingBudget: true
                }
              }
            }
          });

          // Restore budgets for current bidders and mark as outbid
          for (const bid of currentBids) {
            await tx.auctionBid.update({
              where: { id: bid.id },
              data: {
                status: 'OUTBID',
                isWinning: false
              }
            });

            await tx.teamOwner.update({
              where: { id: bid.teamOwnerId },
              data: {
                remainingBudget: bid.teamOwner.remainingBudget + bid.bidAmount
              }
            });
          }

          // Get current round
          const currentRound = await tx.auctionRound.findFirst({
            where: {
              tournamentId,
              status: 'ACTIVE'
            }
          });

          // Create winning bid entry
          await tx.auctionBid.create({
            data: {
              tournamentId,
              playerId,
              teamOwnerId: targetTeamOwner.id,
              roundId: currentRound?.id || '',
              bidAmount: bidAmount,
              status: 'WINNING',
              isWinning: true
            }
          });

          // Update player as sold
          await tx.auctionPlayer.update({
            where: { id: playerId },
            data: {
              soldPrice: bidAmount,
              auctionStatus: 'SOLD',
              auctionTeamId: targetTeamOwner.id
            }
          });

          // Update team owner budget and player count
          await tx.teamOwner.update({
            where: { id: targetTeamOwner.id },
            data: {
              remainingBudget: targetTeamOwner.remainingBudget - bidAmount,
              currentPlayers: targetTeamOwner.currentPlayers + 1
            }
          });

          // Move to next player if this was current player
          if (currentRound && currentRound.currentPlayerId === playerId) {
            const nextPlayer = await tx.auctionPlayer.findFirst({
              where: {
                roundId: currentRound.id,
                auctionStatus: 'AVAILABLE'
              },
              orderBy: { name: 'asc' }
            });

            await tx.auctionRound.update({
              where: { id: currentRound.id },
              data: { currentPlayerId: nextPlayer?.id || null }
            });
          }
        });

        return NextResponse.json({
          success: true,
          message: `${playerToSell.name} sold to ${targetTeamOwner.teamName} for ${bidAmount} points`,
          player: { ...playerToSell, soldPrice: bidAmount },
          teamOwner: targetTeamOwner
        });

      case 'SELL':
        // Get the winning bid or use finalPrice
        let winningBid = null;
        let soldPrice = finalPrice;

        if (!finalPrice) {
          winningBid = await prisma.auctionBid.findFirst({
            where: {
              playerId,
              isWinning: true,
              status: 'ACTIVE'
            },
            include: {
              teamOwner: true
            }
          });

          if (!winningBid) {
            return NextResponse.json(
              { error: 'No winning bid found for this player' },
              { status: 400 }
            );
          }

          soldPrice = winningBid.bidAmount;
        }

        const finalTeamOwnerId = teamOwnerId || winningBid?.teamOwnerId;

        if (!finalTeamOwnerId) {
          return NextResponse.json(
            { error: 'Team owner not specified' },
            { status: 400 }
          );
        }

        // Update player as sold and assign to winning team
        const soldPlayer = await prisma.auctionPlayer.update({
          where: { id: playerId },
          data: {
            soldPrice,
            auctionStatus: 'SOLD',
            auctionTeamId: finalTeamOwnerId
          }
        });

        // Update team owner player count (budget was already deducted during bidding)
        const teamOwner = await prisma.teamOwner.findUnique({
          where: { id: finalTeamOwnerId }
        });

        if (!teamOwner) {
          return NextResponse.json(
            { error: 'Team owner not found' },
            { status: 404 }
          );
        }

        await prisma.teamOwner.update({
          where: { id: finalTeamOwnerId },
          data: {
            currentPlayers: teamOwner.currentPlayers + 1
          }
        });

        // Restore budget to all OTHER bidders (not the winner)
        const allBids = await prisma.auctionBid.findMany({
          where: {
            playerId,
            status: { in: ['ACTIVE', 'OUTBID'] },
            teamOwnerId: { not: finalTeamOwnerId }
          },
          include: {
            teamOwner: {
              select: {
                id: true,
                remainingBudget: true
              }
            }
          }
        });

        // Restore budgets for losing bidders
        for (const bid of allBids) {
          await prisma.teamOwner.update({
            where: { id: bid.teamOwnerId },
            data: {
              remainingBudget: bid.teamOwner.remainingBudget + bid.bidAmount
            }
          });
        }

        // Mark winning bid
        if (winningBid) {
          await prisma.auctionBid.update({
            where: { id: winningBid.id },
            data: { status: 'WINNING' }
          });
        }

        // Mark other bids as closed
        await prisma.auctionBid.updateMany({
          where: {
            playerId,
            status: { in: ['ACTIVE', 'OUTBID'] }
          },
          data: { status: 'CLOSED' }
        });

        return NextResponse.json({
          success: true,
          player: soldPlayer,
          message: `Player sold for ${soldPrice} points`
        });

      case 'UNSOLD':
        // Mark player as unsold and restore all budgets
        await prisma.$transaction(async (tx) => {
          // Get all active bids for this player
          const activeBids = await tx.auctionBid.findMany({
            where: {
              playerId,
              status: { in: ['ACTIVE', 'OUTBID'] }
            },
            include: {
              teamOwner: {
                select: {
                  id: true,
                  remainingBudget: true
                }
              }
            }
          });

          // Restore budgets to all bidders
          for (const bid of activeBids) {
            await tx.teamOwner.update({
              where: { id: bid.teamOwnerId },
              data: {
                remainingBudget: bid.teamOwner.remainingBudget + bid.bidAmount
              }
            });
          }

          // Mark player as unsold
          await tx.auctionPlayer.update({
            where: { id: playerId },
            data: {
              auctionStatus: 'UNSOLD'
            }
          });

          // Close all bids for this player
          await tx.auctionBid.updateMany({
            where: {
              playerId,
              status: { in: ['ACTIVE', 'OUTBID'] }
            },
            data: { status: 'CLOSED' }
          });
        });

        return NextResponse.json({
          success: true,
          message: 'Player marked as unsold'
        });

      case 'SET_CURRENT':
        // Set this player as currently being auctioned
        const activeRound = await prisma.auctionRound.findFirst({
          where: {
            tournamentId,
            status: 'ACTIVE'
          }
        });

        if (!activeRound) {
          return NextResponse.json(
            { error: 'No active auction round' },
            { status: 400 }
          );
        }

        await prisma.auctionRound.update({
          where: { id: activeRound.id },
          data: { currentPlayerId: playerId }
        });

        // Reset any existing bids for this player and restore budgets
        await prisma.$transaction(async (tx) => {
          const activeBids = await tx.auctionBid.findMany({
            where: {
              playerId,
              status: 'ACTIVE'
            },
            include: {
              teamOwner: {
                select: {
                  id: true,
                  remainingBudget: true
                }
              }
            }
          });

          // Restore budgets and reset bids
          for (const bid of activeBids) {
            await tx.teamOwner.update({
              where: { id: bid.teamOwnerId },
              data: {
                remainingBudget: bid.teamOwner.remainingBudget + bid.bidAmount
              }
            });
          }

          await tx.auctionBid.updateMany({
            where: {
              playerId,
              status: 'ACTIVE'
            },
            data: { status: 'RESET' }
          });
        });

        return NextResponse.json({
          success: true,
          message: 'Player set as current for auction'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error managing player auction:', error);
    return NextResponse.json(
      { error: 'Failed to manage player auction' },
      { status: 500 }
    );
  }
}

// Get player details with bidding history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  try {
    const playerId = params.playerId;

    const player = await prisma.auctionPlayer.findUnique({
      where: { id: playerId },
      include: {
        bids: {
          include: {
            teamOwner: {
              select: {
                teamName: true,
                ownerName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      player
    });

  } catch (error) {
    console.error('Error fetching player details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player details' },
      { status: 500 }
    );
  }
}

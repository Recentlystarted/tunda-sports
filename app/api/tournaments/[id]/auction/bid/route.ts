import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Place a bid on current player
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const body = await request.json();
    const { teamOwnerId, playerId, bidAmount } = body;

    // Validate inputs
    if (!teamOwnerId || !playerId || !bidAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get tournament settings
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        minPlayerPoints: true,
        ownerParticipationCost: true,
        minPlayersPerTeam: true,
        maxPlayersPerTeam: true
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get team owner details
    const teamOwner = await prisma.teamOwner.findUnique({
      where: { id: teamOwnerId },
      select: {
        id: true,
        teamName: true,
        remainingBudget: true,
        isParticipating: true,
        currentPlayers: true,
        minPlayersNeeded: true
      }
    });

    if (!teamOwner) {
      return NextResponse.json(
        { error: 'Team owner not found' },
        { status: 404 }
      );
    }

    // Validate minimum bid amount
    const minBid = tournament.minPlayerPoints || 500;
    if (bidAmount < minBid) {
      return NextResponse.json(
        { error: `Minimum bid amount is ${minBid} points` },
        { status: 400 }
      );
    }

    // Check if team owner has enough budget
    if (bidAmount > teamOwner.remainingBudget) {
      return NextResponse.json(
        { error: 'Insufficient budget for this bid' },
        { status: 400 }
      );
    }

    // Calculate remaining players needed and budget validation
    const playersStillNeeded = teamOwner.minPlayersNeeded - teamOwner.currentPlayers - 1; // -1 for current bid
    const budgetAfterBid = teamOwner.remainingBudget - bidAmount;
    const minimumBudgetNeeded = playersStillNeeded * minBid;

    if (playersStillNeeded > 0 && budgetAfterBid < minimumBudgetNeeded) {
      const maxAllowedBid = teamOwner.remainingBudget - minimumBudgetNeeded;
      return NextResponse.json({
        error: 'Bid too high',
        warning: `You need ${playersStillNeeded} more players. Maximum bid allowed: ${maxAllowedBid} points`,
        maxBid: maxAllowedBid,
        playersRemaining: playersStillNeeded
      }, { status: 400 });
    }

    // Get current round
    const currentRound = await prisma.auctionRound.findFirst({
      where: {
        tournamentId,
        status: 'ACTIVE'
      }
    });

    if (!currentRound) {
      return NextResponse.json(
        { error: 'No active auction round' },
        { status: 400 }
      );
    }

    // Check if this player is currently being auctioned
    if (currentRound.currentPlayerId !== playerId) {
      return NextResponse.json(
        { error: 'This player is not currently being auctioned' },
        { status: 400 }
      );
    }

    // Get current highest bid
    const currentHighestBid = await prisma.auctionBid.findFirst({
      where: {
        playerId,
        status: 'ACTIVE'
      },
      orderBy: {
        bidAmount: 'desc'
      }
    });

    // Validate bid amount against current highest
    let minimumBidRequired = tournament.minPlayerPoints || 500;
    
    if (currentHighestBid) {
      minimumBidRequired = Math.max(minimumBidRequired, currentHighestBid.bidAmount + (tournament.minPlayerPoints || 500));
      
      if (bidAmount <= currentHighestBid.bidAmount) {
        return NextResponse.json(
          { 
            error: `Bid must be higher than current bid of ${currentHighestBid.bidAmount} points`,
            minimumBid: minimumBidRequired,
            currentHighest: currentHighestBid.bidAmount
          },
          { status: 400 }
        );
      }
    } else {
      // No current bids, use base price or minimum
      const player = await prisma.auctionPlayer.findUnique({
        where: { id: playerId },
        select: { basePrice: true }
      });
      
      if (player && player.basePrice) {
        minimumBidRequired = Math.max(minimumBidRequired, player.basePrice);
      }
    }

    // Validate against absolute minimum
    if (bidAmount < minimumBidRequired) {
      return NextResponse.json(
        { 
          error: `Bid amount too low. Minimum required: ${minimumBidRequired} points`,
          minimumBid: minimumBidRequired
        },
        { status: 400 }
      );
    }

    // Mark previous bids as outbid (but don't change budgets - only when sold)
    const outbidBids = await prisma.auctionBid.findMany({
      where: {
        playerId,
        status: 'ACTIVE'
      }
    });

    // Update outbid bids status only
    for (const outbidBid of outbidBids) {
      await prisma.auctionBid.update({
        where: { id: outbidBid.id },
        data: {
          status: 'OUTBID',
          isWinning: false
        }
      });
    }

    // Create new bid WITHOUT reducing budget (only when player is sold)
    const result = await prisma.auctionBid.create({
      data: {
        tournamentId,
        playerId,
        teamOwnerId,
        roundId: currentRound.id,
        bidAmount,
        status: 'ACTIVE',
        isWinning: true
      },
      include: {
        teamOwner: {
          select: {
            teamName: true,
            ownerName: true,
            remainingBudget: true
          }
        },
        player: {
          select: {
            name: true,
            position: true
          }
        }
      }
    });

    const newBid = result;

    // Calculate budget warning for remaining players (based on POTENTIAL spend)
    const potentialSpend = bidAmount;
    const remainingAfterBid = teamOwner.remainingBudget - potentialSpend;
    const playersLeft = teamOwner.minPlayersNeeded - teamOwner.currentPlayers - 1;
    let budgetWarning = null;

    if (playersLeft > 0) {
      const averagePerPlayer = Math.floor(remainingAfterBid / playersLeft);
      if (averagePerPlayer < minBid * 1.5) { // Warning if average is close to minimum
        budgetWarning = `Warning: If you win this bid, you'll have ${remainingAfterBid} points for ${playersLeft} players (avg: ${averagePerPlayer} points/player)`;
      }
    }

    return NextResponse.json({
      success: true,
      bid: newBid,
      budgetWarning,
      message: `Bid placed successfully for ${newBid.player.name}`
    });

  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    );
  }
}

// Get current player being auctioned with bids
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    // Get current round with player and bids
    const currentRound = await prisma.auctionRound.findFirst({
      where: {
        tournamentId,
        status: 'ACTIVE'
      },
      include: {
        currentPlayer: true
      }
    });

    if (!currentRound || !currentRound.currentPlayer) {
      return NextResponse.json({
        success: true,
        currentPlayer: null,
        bids: [],
        message: 'No player currently being auctioned'
      });
    }

    // Get bids for the current player
    const currentPlayerBids = await prisma.auctionBid.findMany({
      where: {
        playerId: currentRound.currentPlayer.id,
        status: 'ACTIVE'
      },
      include: {
        teamOwner: {
          select: {
            id: true,
            teamName: true,
            ownerName: true,
            ownerCity: true
          }
        }
      },
      orderBy: {
        bidAmount: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      currentPlayer: {
        ...currentRound.currentPlayer,
        bids: currentPlayerBids
      },
      bids: currentPlayerBids,
      round: {
        id: currentRound.id,
        roundName: currentRound.roundName,
        roundNumber: currentRound.roundNumber
      }
    });

  } catch (error) {
    console.error('Error fetching current auction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current auction data' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { token } = await request.json();
    const { id: tournamentId } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find team owner by auction token and tournament
    const teamOwner = await prisma.teamOwner.findFirst({
      where: {
        auctionToken: token,
        tournamentId: tournamentId,
        verified: true, // Only verified owners can access
      },
      select: {
        id: true,
        teamName: true,
        teamIndex: true,
        ownerName: true,
        ownerPhone: true,
        ownerEmail: true,
        ownerCity: true,
        sponsorName: true,
        verified: true,
        totalBudget: true,
        remainingBudget: true,
        currentPlayers: true,
        minPlayersNeeded: true,
        isParticipating: true
      }
    });

    if (!teamOwner) {
      return NextResponse.json(
        { error: 'Invalid token or access denied' },
        { status: 403 }
      );
    }

    // Get tournament details separately
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        venue: true,
        auctionDate: true,
      },
    });

    // Return owner data with budget information
    const safeOwnerData = {
      id: teamOwner.id,
      teamName: teamOwner.teamName,
      teamIndex: teamOwner.teamIndex,
      ownerName: teamOwner.ownerName,
      ownerPhone: teamOwner.ownerPhone,
      ownerEmail: teamOwner.ownerEmail,
      ownerCity: teamOwner.ownerCity,
      sponsorName: teamOwner.sponsorName,
      verified: teamOwner.verified,
      totalBudget: teamOwner.totalBudget,
      remainingBudget: teamOwner.remainingBudget,
      currentPlayers: teamOwner.currentPlayers,
      minPlayersNeeded: teamOwner.minPlayersNeeded,
      isParticipating: teamOwner.isParticipating,
      tournament: tournament,
    };

    return NextResponse.json(safeOwnerData);
  } catch (error) {
    console.error('Error verifying auction token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const status = searchParams.get('status');
    const includeAll = searchParams.get('includeAll'); // New parameter to include all players

    const where: any = {};
    if (tournamentId) where.tournamentId = tournamentId;
    
    // If status is specified, use it
    if (status && status !== 'ALL') {
      where.auctionStatus = status;
    } else if (!includeAll) {
      // By default, only show available players (not sold or unsold)
      where.auctionStatus = { notIn: ['SOLD', 'UNSOLD'] };
    }

    const players = await prisma.auctionPlayer.findMany({
      where,
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            format: true
          }
        },
        auctionTeam: {
          select: {
            id: true,
            name: true,
            ownerName: true
          }
        }
      },
      orderBy: [
        { auctionStatus: 'asc' }, // Available players first
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching auction players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction players' },
      { status: 500 }
    );
  }
}

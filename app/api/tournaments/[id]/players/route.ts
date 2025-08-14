import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all auction players for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;

    const players = await prisma.auctionPlayer.findMany({
      where: {
        tournamentId
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            playerEntryFee: true
          }
        },
        auctionTeam: {
          select: {
            name: true,
            ownerName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      players
    });

  } catch (error) {
    console.error('Error fetching auction players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction players' },
      { status: 500 }
    );
  }
}

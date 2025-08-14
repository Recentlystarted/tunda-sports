import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all team owners across tournaments
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get('tournamentId');
    const status = url.searchParams.get('status');

    const where: any = {};
    if (tournamentId) where.tournamentId = tournamentId;
    if (status && status !== 'ALL') where.status = status;

    const teamOwners = await prisma.auctionTeam.findMany({
      where,
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            format: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate remaining budget for each owner
    const ownersWithBudget = await Promise.all(
      teamOwners.map(async (owner) => {
        const spentAmount = await prisma.auctionPlayer.aggregate({
          where: {
            auctionTeamId: owner.id,
            auctionStatus: 'SOLD'
          },
          _sum: {
            soldPrice: true
          }
        });

        return {
          ...owner,
          remainingBudget: (owner.totalBudget || 0) - (spentAmount._sum?.soldPrice || 0),
          _count: {
            auctionTeams: 0 // Placeholder for compatibility
          }
        };
      })
    );

    return NextResponse.json(ownersWithBudget);
  } catch (error) {
    console.error('Error fetching team owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team owners' },
      { status: 500 }
    );
  }
}

// Create new team owner (if needed for admin)
export async function POST(request: NextRequest) {
  try {
    const {
      name,
      email,
      phone,
      age,
      city,
      teamName,
      budget,
      experience,
      tournamentId,
      status = 'APPROVED' // Admin can directly approve
    } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !teamName || !tournamentId || !budget) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if tournament exists and is auction-based
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (!tournament.isAuctionBased) {
      return NextResponse.json(
        { error: 'Tournament is not auction-based' },
        { status: 400 }
      );
    }

    // Check for duplicate team name in the tournament
    const existingTeam = await prisma.auctionTeam.findFirst({
      where: {
        tournamentId,
        name: teamName
      }
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team name already exists in this tournament' },
        { status: 400 }
      );
    }

    // Check for duplicate email in the tournament
    const existingOwner = await prisma.auctionTeam.findFirst({
      where: {
        tournamentId,
        ownerEmail: email
      }
    });

    if (existingOwner) {
      return NextResponse.json(
        { error: 'Email already registered in this tournament' },
        { status: 400 }
      );
    }

    // Create team owner
    const teamOwner = await prisma.auctionTeam.create({
      data: {
        name: teamName,
        ownerName: name,
        ownerEmail: email,
        ownerPhone: phone,
        totalBudget: parseInt(budget),
        tournamentId
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            format: true
          }
        }
      }
    });

    return NextResponse.json(teamOwner, { status: 201 });
  } catch (error) {
    console.error('Error creating team owner:', error);
    return NextResponse.json(
      { error: 'Failed to create team owner' },
      { status: 500 }
    );
  }
}

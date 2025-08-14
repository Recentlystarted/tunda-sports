import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get individual team owner
export async function GET(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    const { ownerId } = params;

    const teamOwner = await prisma.auctionTeam.findUnique({
      where: { id: ownerId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            format: true
          }
        },
        players: {
          select: {
            id: true,
            name: true,
            position: true,
            soldPrice: true,
            auctionStatus: true
          }
        }
      }
    });

    if (!teamOwner) {
      return NextResponse.json(
        { error: 'Team owner not found' },
        { status: 404 }
      );
    }

    // Calculate spent amount
    const spentAmount = await prisma.auctionPlayer.aggregate({
      where: {
        auctionTeamId: ownerId,
        auctionStatus: 'SOLD'
      },
      _sum: {
        soldPrice: true
      }
    });

    const teamOwnerWithBudget = {
      ...teamOwner,
      remainingBudget: (teamOwner.totalBudget || 0) - (spentAmount._sum?.soldPrice || 0),
      spentAmount: spentAmount._sum?.soldPrice || 0
    };

    return NextResponse.json(teamOwnerWithBudget);
  } catch (error) {
    console.error('Error fetching team owner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team owner' },
      { status: 500 }
    );
  }
}

// Update team owner (status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    const { ownerId } = params;
    const data = await request.json();

    // Validate the team owner exists
    const existingOwner = await prisma.auctionTeam.findUnique({
      where: { id: ownerId }
    });

    if (!existingOwner) {
      return NextResponse.json(
        { error: 'Team owner not found' },
        { status: 404 }
      );
    }

    // Update the team owner
    const updatedOwner = await prisma.auctionTeam.update({
      where: { id: ownerId },
      data: {
        ...data,
        updatedAt: new Date()
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

    return NextResponse.json(updatedOwner);
  } catch (error) {
    console.error('Error updating team owner:', error);
    return NextResponse.json(
      { error: 'Failed to update team owner' },
      { status: 500 }
    );
  }
}

// Delete team owner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    const { ownerId } = params;

    // Check if team owner exists
    const existingOwner = await prisma.auctionTeam.findUnique({
      where: { id: ownerId },
      include: {
        players: true
      }
    });

    if (!existingOwner) {
      return NextResponse.json(
        { error: 'Team owner not found' },
        { status: 404 }
      );
    }

    // Check if team owner has any purchased players
    if (existingOwner.players && existingOwner.players.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete team owner with purchased players. Please remove players first.' },
        { status: 400 }
      );
    }

    // Delete the team owner
    await prisma.auctionTeam.delete({
      where: { id: ownerId }
    });

    return NextResponse.json({ 
      message: 'Team owner deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting team owner:', error);
    return NextResponse.json(
      { error: 'Failed to delete team owner' },
      { status: 500 }
    );
  }
}

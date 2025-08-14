import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const player = await prisma.player.findUnique({
      where: {
        id: params.id
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
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

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const player = await prisma.player.update({
      where: {
        id: params.id
      },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        address: body.address,
        city: body.city,
        position: body.position,
        age: body.age,
        fatherName: body.fatherName,
        emergencyContact: body.emergencyContact,
        emergencyPhone: body.emergencyPhone,
        profileImageUrl: body.profileImageUrl,
        jerseyNumber: body.jerseyNumber,
        isSubstitute: body.isSubstitute || false,
        experience: body.experience,
        isActive: body.isActive !== undefined ? body.isActive : true,
        teamId: body.teamId,
        searchKeywords: `${body.name} ${body.city || ''} ${body.fatherName || ''}`.trim()
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      player
    });
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: {
        id: params.id
      }
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false instead of hard delete
    // to preserve data integrity
    await prisma.player.update({
      where: {
        id: params.id
      },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}

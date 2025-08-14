import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const registrations = await prisma.teamRegistration.findMany({
      where: {
        tournamentId: params.id,
        status: 'APPROVED' // Only get approved teams for match scheduling
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            city: true,
            captainName: true,
            captainPhone: true
          }
        }
      },
      orderBy: {
        team: {
          name: 'asc'
        }
      }
    });

    return NextResponse.json({
      success: true,
      registrations
    });
  } catch (error) {
    console.error('Error fetching tournament registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament registrations' },
      { status: 500 }
    );
  }
}

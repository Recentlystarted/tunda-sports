import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    let whereClause: any = {
      isActive: true
    };

    // If query is provided, add search conditions
    if (query.length >= 2) {
      whereClause = {
        isActive: true,
        OR: [
          {
            name: {
              contains: query
            }
          },
          {
            city: {
              contains: query
            }
          },
          {
            phone: {
              contains: query
            }
          },
          {
            fatherName: {
              contains: query
            }
          },
          {
            email: {
              contains: query
            }
          }
        ]
      };
    }

    // Get players with pagination
    const players = await prisma.player.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        age: true,
        city: true,
        address: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        position: true,
        experience: true,
        fatherName: true,
        emergencyContact: true,
        emergencyPhone: true,
        profileImageUrl: true,
        jerseyNumber: true,
        isSubstitute: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { name: 'asc' },
        { city: 'asc' }
      ],
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.player.count({
      where: whereClause
    });

    return NextResponse.json({
      players,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create new player
    const player = await prisma.player.create({
      data: {
        name: body.name,
        age: body.age || null,
        city: body.city || null,
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        position: body.position || null,
        experience: body.experience || null,
        fatherName: body.fatherName || null,
        emergencyContact: body.emergencyContact || null,
        emergencyPhone: body.emergencyPhone || null,
        profileImageUrl: body.profileImageUrl || null,
        isSubstitute: body.isSubstitute || false,
        jerseyNumber: body.jerseyNumber || null,
        teamId: body.teamId || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        // Generate search keywords for faster searching
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
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}

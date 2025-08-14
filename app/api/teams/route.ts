import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        tournaments: {
          select: {
            tournament: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            players: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match our frontend interface
    const transformedTeams = teams.map(team => ({
      id: team.id,
      name: team.name,
      captain: team.captainName || 'Unknown',
      contactNumber: team.captainPhone || 'Not provided',
      village: team.homeGround || 'Not specified',
      playersCount: team._count.players,
      registrationDate: team.createdAt.toISOString(),
      status: 'ACTIVE' as const, // Default status since it's not in the schema
      tournaments: team.tournaments.map((t: any) => ({ name: t.tournament.name }))
    }))

    return NextResponse.json(transformedTeams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.captainName || !body.city) {
      return NextResponse.json(
        { error: 'Team name, captain name, and city are required' },
        { status: 400 }
      )
    }

    // Use transaction to create team and players
    const team = await prisma.$transaction(async (tx) => {
      // Create the team
      const newTeam = await tx.team.create({
        data: {
          name: body.name,
          description: body.description || null,
          captainName: body.captainName,
          captainPhone: body.captainPhone || null,
          captainEmail: body.captainEmail || null,
          captainAge: body.captainAge || null,
          homeGround: body.homeGround || null,
          city: body.city,
          logoUrl: body.logoUrl || null,
          teamColor: body.teamColor || null,
          foundedYear: body.foundedYear || null,
        }
      })

      // Create players if provided
      if (body.players && Array.isArray(body.players) && body.players.length > 0) {
        await tx.player.createMany({
          data: body.players.map((player: any) => ({
            teamId: newTeam.id,
            name: player.name,
            age: player.age || 18,
            city: player.city || null,
            fatherName: player.fatherName || null,
            position: player.position || 'BATSMAN',
            experience: player.experience || 'BEGINNER',
            phone: player.phone || null,
            email: player.email || null,
            isSubstitute: player.isSubstitute || false,
            jerseyNumber: player.jerseyNumber || null,
            emergencyContact: player.emergencyContact || null,
            emergencyPhone: player.emergencyPhone || null,
            emergencyRelation: player.emergencyRelation || null,
            // Generate search keywords for faster searching
            searchKeywords: `${player.name} ${player.city || ''} ${player.fatherName || ''}`.trim()
          }))
        })
      }

      // Return team with players
      return await tx.team.findUnique({
        where: { id: newTeam.id },
        include: {
          players: true,
          tournaments: {
            include: {
              tournament: true
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A team with this name already exists' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: {
        homeTeam: {
          select: {
            name: true
          }
        },
        awayTeam: {
          select: {
            name: true
          }
        },
        tournament: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        matchDate: 'desc'
      }
    })

    // Transform the data to match our frontend interface
    const transformedMatches = matches.map(match => ({
      id: match.id,
      homeTeam: { name: match.homeTeam?.name || 'TBD' },
      awayTeam: { name: match.awayTeam?.name || 'TBD' },
      tournament: { name: match.tournament.name },
      scheduledDate: match.matchDate.toISOString(),
      venue: match.venue,
      status: match.status,
      type: match.matchType,
      homeScore: match.homeTeamScore,
      awayScore: match.awayTeamScore,
      winner: match.winnerTeamId
    }))

    return NextResponse.json(transformedMatches)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      homeTeamId, 
      awayTeamId, 
      tournamentId, 
      matchDate, 
      venue, 
      matchType,
      overs 
    } = body

    const match = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        tournamentId,
        matchDate: new Date(matchDate),
        venue,
        matchType,
        overs,
        status: 'SCHEDULED'
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: true
      }
    })

    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  }
}

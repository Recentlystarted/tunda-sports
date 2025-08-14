import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  console.log('Admin statistics API called')
  
  try {
    // Get basic statistics for admin dashboard
    const [
      totalTournaments,
      totalPlayers,
      totalTeams
    ] = await Promise.all([
      prisma.tournament.count(),
      prisma.player.count(),
      prisma.team.count()
    ])

    console.log('Statistics fetched:', { totalTournaments, totalPlayers, totalTeams })

    // Get recent tournaments
    const recentTournaments = await prisma.tournament.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true
      }
    })

    console.log('Recent tournaments fetched:', recentTournaments.length)

    return NextResponse.json({
      success: true,
      statistics: {
        overview: {
          totalTournaments,
          totalPlayers,
          totalTeams
        },
        recentTournaments
      }
    })
  } catch (error) {
    console.error('Error fetching admin statistics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface MatchArrangement {
  homeTeamId: string
  awayTeamId: string
  matchDate: string
  venue: string
  matchType: string
  round?: string
  group?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id

    // Get tournament with registrations
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: 'APPROVED' },
          include: { team: true }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }

    if (!tournament.autoArrangeMatches) {
      return NextResponse.json(
        { success: false, error: 'Auto-arrangement is not enabled for this tournament' },
        { status: 400 }
      )
    }

    const teams = tournament.registrations.map(reg => reg.team)
    
    if (teams.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 teams are required to arrange matches' },
        { status: 400 }
      )
    }

    let matches: MatchArrangement[] = []
    const startDate = new Date(tournament.startDate)
    const matchDuration = tournament.matchDuration || 120 // minutes
    const breakTime = tournament.breakBetweenMatches || 30 // minutes
    const maxMatchesPerDay = tournament.maxMatchesPerDay || 4
    const preferredTimes = tournament.preferredMatchTimes?.split(',') || ['09:00', '14:00', '18:00']

    switch (tournament.competitionType) {
      case 'LEAGUE':
      case 'ROUND_ROBIN':
        matches = arrangeLeagueMatches(teams, startDate, preferredTimes, maxMatchesPerDay, tournament.venue)
        break
      
      case 'KNOCKOUT':
        matches = arrangeKnockoutMatches(teams, startDate, preferredTimes, maxMatchesPerDay, tournament.venue)
        break
      
      case 'GROUP_KNOCKOUT':
        matches = arrangeGroupKnockoutMatches(
          teams, 
          startDate, 
          preferredTimes, 
          maxMatchesPerDay, 
          tournament.venue,
          tournament.groupSize || 4,
          tournament.qualifiersPerGroup || 2
        )
        break
      
      case 'VILLAGE_CHAMPIONSHIP':
      case 'INTER_VILLAGE':
        matches = arrangeVillageChampionship(teams, startDate, preferredTimes, maxMatchesPerDay, tournament.venue)
        break
      
      default:
        matches = arrangeLeagueMatches(teams, startDate, preferredTimes, maxMatchesPerDay, tournament.venue)
    }

    // Create matches in database
    const createdMatches = []
    for (const match of matches) {
      const createdMatch = await prisma.match.create({
        data: {
          tournamentId,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          matchDate: new Date(match.matchDate),
          venue: match.venue,
          matchType: match.matchType as any,
          round: match.round,
          group: match.group,
          status: 'SCHEDULED'
        },
        include: {
          homeTeam: true,
          awayTeam: true
        }
      })
      createdMatches.push(createdMatch)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully arranged ${createdMatches.length} matches`,
      matches: createdMatches
    })

  } catch (error) {
    console.error('Error auto-arranging matches:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to arrange matches' },
      { status: 500 }
    )
  }
}

// Helper functions for different tournament formats
function arrangeLeagueMatches(teams: any[], startDate: Date, preferredTimes: string[], maxMatchesPerDay: number, venue: string): MatchArrangement[] {
  const matches: MatchArrangement[] = []
  let currentDate = new Date(startDate)
  let timeIndex = 0
  let matchesOnCurrentDay = 0

  // Round-robin: each team plays every other team once
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      if (matchesOnCurrentDay >= maxMatchesPerDay) {
        currentDate.setDate(currentDate.getDate() + 1)
        matchesOnCurrentDay = 0
        timeIndex = 0
      }

      const matchTime = preferredTimes[timeIndex % preferredTimes.length]
      const [hours, minutes] = matchTime.split(':').map(Number)
      const matchDate = new Date(currentDate)
      matchDate.setHours(hours, minutes, 0, 0)

      matches.push({
        homeTeamId: teams[i].id,
        awayTeamId: teams[j].id,
        matchDate: matchDate.toISOString(),
        venue,
        matchType: 'LEAGUE',
        round: `Round ${Math.floor(matches.length / (teams.length / 2)) + 1}`
      })

      timeIndex++
      matchesOnCurrentDay++
    }
  }

  return matches
}

function arrangeKnockoutMatches(teams: any[], startDate: Date, preferredTimes: string[], maxMatchesPerDay: number, venue: string): MatchArrangement[] {
  const matches: MatchArrangement[] = []
  let currentDate = new Date(startDate)
  let timeIndex = 0
  let matchesOnCurrentDay = 0

  // Shuffle teams for random matchups
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
  
  let currentRoundTeams = shuffledTeams
  let roundNumber = 1

  while (currentRoundTeams.length > 1) {
    const roundMatches: MatchArrangement[] = []
    const nextRoundTeams: any[] = []

    // Pair teams for this round
    for (let i = 0; i < currentRoundTeams.length; i += 2) {
      if (i + 1 < currentRoundTeams.length) {
        if (matchesOnCurrentDay >= maxMatchesPerDay) {
          currentDate.setDate(currentDate.getDate() + 1)
          matchesOnCurrentDay = 0
          timeIndex = 0
        }

        const matchTime = preferredTimes[timeIndex % preferredTimes.length]
        const [hours, minutes] = matchTime.split(':').map(Number)
        const matchDate = new Date(currentDate)
        matchDate.setHours(hours, minutes, 0, 0)

        let matchType = 'QUALIFIER'
        if (currentRoundTeams.length === 2) matchType = 'FINAL'
        else if (currentRoundTeams.length === 4) matchType = 'SEMI_FINAL'
        else if (currentRoundTeams.length === 8) matchType = 'QUARTER_FINAL'

        roundMatches.push({
          homeTeamId: currentRoundTeams[i].id,
          awayTeamId: currentRoundTeams[i + 1].id,
          matchDate: matchDate.toISOString(),
          venue,
          matchType,
          round: `Round ${roundNumber}`
        })

        // For knockout simulation, assume home team wins
        nextRoundTeams.push(currentRoundTeams[i])

        timeIndex++
        matchesOnCurrentDay++
      } else {
        // Odd number of teams, this team gets a bye
        nextRoundTeams.push(currentRoundTeams[i])
      }
    }

    matches.push(...roundMatches)
    currentRoundTeams = nextRoundTeams
    roundNumber++

    if (roundMatches.length > 0) {
      // Add a day gap between rounds
      currentDate.setDate(currentDate.getDate() + 1)
      matchesOnCurrentDay = 0
      timeIndex = 0
    }
  }

  return matches
}

function arrangeGroupKnockoutMatches(teams: any[], startDate: Date, preferredTimes: string[], maxMatchesPerDay: number, venue: string, groupSize: number, qualifiersPerGroup: number): MatchArrangement[] {
  const matches: MatchArrangement[] = []
  let currentDate = new Date(startDate)
  let timeIndex = 0
  let matchesOnCurrentDay = 0

  // Shuffle and divide teams into groups
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
  const groups: any[][] = []
  
  for (let i = 0; i < shuffledTeams.length; i += groupSize) {
    groups.push(shuffledTeams.slice(i, i + groupSize))
  }

  // Group stage matches
  groups.forEach((group, groupIndex) => {
    const groupName = String.fromCharCode(65 + groupIndex) // A, B, C, etc.
    
    // Round-robin within group
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (matchesOnCurrentDay >= maxMatchesPerDay) {
          currentDate.setDate(currentDate.getDate() + 1)
          matchesOnCurrentDay = 0
          timeIndex = 0
        }

        const matchTime = preferredTimes[timeIndex % preferredTimes.length]
        const [hours, minutes] = matchTime.split(':').map(Number)
        const matchDate = new Date(currentDate)
        matchDate.setHours(hours, minutes, 0, 0)

        matches.push({
          homeTeamId: group[i].id,
          awayTeamId: group[j].id,
          matchDate: matchDate.toISOString(),
          venue,
          matchType: 'LEAGUE',
          round: 'Group Stage',
          group: `Group ${groupName}`
        })

        timeIndex++
        matchesOnCurrentDay++
      }
    }
  })

  // Add knockout stage (simplified - assumes top teams qualify)
  const qualifiedTeams = groups.flatMap(group => group.slice(0, qualifiersPerGroup))
  
  if (qualifiedTeams.length > 1) {
    // Add a rest day between group and knockout
    currentDate.setDate(currentDate.getDate() + 1)
    matchesOnCurrentDay = 0
    timeIndex = 0

    const knockoutMatches = arrangeKnockoutMatches(qualifiedTeams, currentDate, preferredTimes, maxMatchesPerDay, venue)
    matches.push(...knockoutMatches)
  }

  return matches
}

function arrangeVillageChampionship(teams: any[], startDate: Date, preferredTimes: string[], maxMatchesPerDay: number, venue: string): MatchArrangement[] {
  // Village championships often have shorter matches and more flexible scheduling
  const matches: MatchArrangement[] = []
  let currentDate = new Date(startDate)
  let timeIndex = 0
  let matchesOnCurrentDay = 0

  // Modified round-robin with emphasis on local rivalries
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      if (matchesOnCurrentDay >= maxMatchesPerDay) {
        currentDate.setDate(currentDate.getDate() + 1)
        matchesOnCurrentDay = 0
        timeIndex = 0
      }

      const matchTime = preferredTimes[timeIndex % preferredTimes.length]
      const [hours, minutes] = matchTime.split(':').map(Number)
      const matchDate = new Date(currentDate)
      matchDate.setHours(hours, minutes, 0, 0)

      matches.push({
        homeTeamId: teams[i].id,
        awayTeamId: teams[j].id,
        matchDate: matchDate.toISOString(),
        venue,
        matchType: 'LEAGUE',
        round: 'Village Championship'
      })

      timeIndex++
      matchesOnCurrentDay++
    }
  }

  return matches
}

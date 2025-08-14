import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createGoogleDriveService } from '@/lib/googleDriveService'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = {}
    if (status && status !== 'all') {
      // Map frontend status values to database enum values
      if (status === 'open') {
        whereClause.status = 'REGISTRATION_OPEN'
      } else {
        whereClause.status = status
      }
    }    const tournaments = await prisma.tournament.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            registrations: true,
            matches: true,
            auctionPlayers: true
          }
        },        images: {
          take: 3, // Limit to first 3 images for performance
          orderBy: {
            createdAt: 'desc'
          }
        },
        registrations: {
          take: 5,
          include: {
            team: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit,
      skip: offset
    })

    const total = await prisma.tournament.count({ where: whereClause })

    return NextResponse.json({
      success: true,
      tournaments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      format,
      competitionType, // This is the tournament structure
      customFormat,
      venue,
      venueAddress,
      customMapsLink,
      startDate,
      endDate,
      registrationDeadline,
      maxTeams,
      entryFee,
      totalPrizePool,
      overs,
      status, // Add status field
      rules,
      organizers,
      winners,
      otherAwards,
      // New venue and auto-arrangement fields
      multiVenue,
      additionalVenues,
      venueCapacity,
      venueFacilities,
      autoArrangeMatches,
      groupSize,
      qualifiersPerGroup,
      matchDuration,
      breakBetweenMatches,
      maxMatchesPerDay,
      preferredMatchTimes,
      // Scoring fields
      defaultScoringMethod,
      allowMultipleScoringMethods,
      scorers,
      // Auction-specific fields
      isAuctionBased,
      auctionDate,
      auctionBudget,
      totalGroups,
      teamsPerGroup,
      matchesPerTeam,
      groupNames,
      auctionRules,
      // New IPL-style auction fields
      auctionTeamCount,
      auctionTeamNames,
      groupsOptional,
      pointsBased,
      playerPoolSize,
      minPlayersPerTeam,
      maxPlayersPerTeam,
      retentionAllowed,
      tradingEnabled,
      playerEntryFee,
      minPlayerPoints,
      ownerParticipationCost,
      // Team ownership fields
      teamEntryFee,
      requireTeamOwners,
      ownershipMode,
      maxTeamsPerOwner,
      ownerVerificationRequired,
      entryFeeType,
      teamOwners
    } = body

    // Basic validation
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate organizers
    if (!organizers || organizers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one organizer is required' },
        { status: 400 }
      )
    }

    // Determine if tournament is auction-based from competition type
    const isAuctionBasedType = ['AUCTION_BASED_FIXED_TEAMS', 'AUCTION_BASED_GROUPS', 'AUCTION_LEAGUE', 'AUCTION_KNOCKOUT'].includes(competitionType)
    
    // Set appropriate defaults based on tournament type
    const shouldRequireTeamOwners = isAuctionBasedType ? 
      (requireTeamOwners !== false && requireTeamOwners !== 'false') : 
      false // Non-auction tournaments should default to false
    
    const shouldRequireOwnerVerification = isAuctionBasedType ? 
      (ownerVerificationRequired !== false && ownerVerificationRequired !== 'false') : 
      false // Non-auction tournaments should default to false

    // Debug logging
    console.log('Tournament creation debug:')
    console.log(`- competitionType: ${competitionType}`)
    console.log(`- isAuctionBasedType: ${isAuctionBasedType}`)
    console.log(`- input requireTeamOwners: ${requireTeamOwners}`)
    console.log(`- input ownerVerificationRequired: ${ownerVerificationRequired}`)
    console.log(`- computed shouldRequireTeamOwners: ${shouldRequireTeamOwners}`)
    console.log(`- computed shouldRequireOwnerVerification: ${shouldRequireOwnerVerification}`)

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        format: format || 'T20',
        competitionType: competitionType || 'LEAGUE',
        customFormat: (competitionType === 'CUSTOM' || format === 'CUSTOM') ? customFormat : null,
        venue: venue || 'Tunda Cricket Ground',
        venueAddress,
        customMapsLink,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        maxTeams: maxTeams || 16,
        entryFee: entryFee || 0,
        totalPrizePool: totalPrizePool || 0,
        overs: overs || null,
        status: status || 'UPCOMING', // Add status field with default
        rules,
        organizers: JSON.stringify(organizers),
        winners: JSON.stringify(winners || []),
        otherPrizes: JSON.stringify(otherAwards || []),
        // New venue and auto-arrangement fields
        multiVenue: multiVenue === 'true' || multiVenue === true || false,
        additionalVenues: JSON.stringify(additionalVenues || []),
        venueCapacity: venueCapacity ? parseInt(venueCapacity) : null,
        venueFacilities: JSON.stringify(venueFacilities || []),
        autoArrangeMatches: autoArrangeMatches === 'true' || autoArrangeMatches === true || false,
        groupSize: groupSize ? parseInt(groupSize) : null,
        qualifiersPerGroup: qualifiersPerGroup ? parseInt(qualifiersPerGroup) : null,
        matchDuration: matchDuration ? parseInt(matchDuration) : null,
        breakBetweenMatches: breakBetweenMatches ? parseInt(breakBetweenMatches) : null,
        maxMatchesPerDay: maxMatchesPerDay ? parseInt(maxMatchesPerDay) : null,
        preferredMatchTimes: preferredMatchTimes || null,
        // Auction-specific fields
        isAuctionBased: isAuctionBasedType, // Auto-set based on competition type
        auctionDate: auctionDate ? new Date(auctionDate) : null,
        auctionBudget: auctionBudget ? parseInt(auctionBudget) : null,
        totalGroups: totalGroups ? parseInt(totalGroups) : null,
        teamsPerGroup: teamsPerGroup ? parseInt(teamsPerGroup) : null,
        matchesPerTeam: matchesPerTeam ? parseInt(matchesPerTeam) : null,
        groupNames: groupNames || null,
        auctionRules: auctionRules || null,
        // New IPL-style auction fields
        auctionTeamCount: auctionTeamCount ? parseInt(auctionTeamCount) : null,
        auctionTeamNames: auctionTeamNames || null,
        groupsOptional: groupsOptional === true || groupsOptional === 'true' || true,
        pointsBased: pointsBased === true || pointsBased === 'true' || true,
        playerPoolSize: playerPoolSize ? parseInt(playerPoolSize) : null,
        minPlayersPerTeam: minPlayersPerTeam ? parseInt(minPlayersPerTeam) : 11,
        maxPlayersPerTeam: maxPlayersPerTeam ? parseInt(maxPlayersPerTeam) : 15,
        retentionAllowed: retentionAllowed === true || retentionAllowed === 'true' || false,
        tradingEnabled: tradingEnabled === true || tradingEnabled === 'true' || false,
        // Auction-specific payment fields - only set for auction tournaments
        playerEntryFee: isAuctionBasedType ? (playerEntryFee ? parseInt(playerEntryFee) : 0) : null,
        teamEntryFee: isAuctionBasedType ? (teamEntryFee ? parseInt(teamEntryFee) : 0) : null,
        minPlayerPoints: isAuctionBasedType ? (minPlayerPoints ? parseInt(minPlayerPoints) : 500) : null,
        ownerParticipationCost: isAuctionBasedType ? (ownerParticipationCost ? parseInt(ownerParticipationCost) : 500) : null,
        requireTeamOwners: shouldRequireTeamOwners,
        ownershipMode: ownershipMode || 'REGISTRATION',
        maxTeamsPerOwner: maxTeamsPerOwner ? parseInt(maxTeamsPerOwner) : 1,
        ownerVerificationRequired: shouldRequireOwnerVerification,
        entryFeeType: entryFeeType || (isAuctionBasedType ? 'BOTH' : 'TEAM'),
        teamOwnersData: teamOwners ? JSON.stringify(teamOwners) : null
      },
      include: {
        registrations: {
          include: {
            team: true
          }
        },
        images: true,
        _count: {
          select: {
            registrations: true,
            matches: true
          }
        }
      }
    })

    // Create scorers if provided
    if (scorers && scorers.length > 0) {
      for (const scorer of scorers) {
        if (scorer.name && scorer.phone) {
          try {
            await prisma.scorer.create({
              data: {
                name: scorer.name,
                phone: scorer.phone,
                email: scorer.email || null,
                experience: scorer.experience || 'INTERMEDIATE',
                bookScoring: scorer.scoringMethods?.includes('BOOK') || true,
                onlineScoring: scorer.scoringMethods?.includes('ONLINE_CIRHEROES') || scorer.scoringMethods?.includes('ONLINE_CRICCLUBS') || false,
                scoringApps: JSON.stringify(scorer.scoringMethods || ['BOOK'])
              }
            })
          } catch (error) {
            // Scorer might already exist, skip error
            console.log('Scorer already exists or error creating:', error)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      tournament
    })
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create tournament' },
      { status: 500 }
    )
  }
}

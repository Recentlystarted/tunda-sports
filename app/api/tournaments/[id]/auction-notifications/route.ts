import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuctionNotificationService } from '@/lib/emailTemplates'

const prisma = new PrismaClient()

// Send auction completion notifications to all participants
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action } = body

    if (action !== 'send_completion_notifications') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get tournament details
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        startDate: true,
        auctionDate: true,
        venue: true,
        playerEntryFee: true,
        teamEntryFee: true,
        isAuctionBased: true
      }
    })

    if (!tournament || !tournament.isAuctionBased) {
      return NextResponse.json(
        { error: 'Tournament not found or not auction-based' },
        { status: 404 }
      )
    }

    // Get all team owners
    const teamOwners = await prisma.teamOwner.findMany({
      where: { 
        tournamentId: params.id,
        verified: true 
      }
    })

    // Get all players and their auction status
    const allPlayers = await prisma.auctionPlayer.findMany({
      where: { tournamentId: params.id },
      include: {
        auctionTeam: {
          select: {
            name: true,
            ownerName: true,
            ownerPhone: true
          }
        }
      }
    })

    // Separate sold and unsold players
    const soldPlayers = allPlayers.filter(p => p.auctionStatus === 'SOLD' && p.auctionTeam)
    const unsoldPlayers = allPlayers.filter(p => p.auctionStatus === 'UNSOLD' || p.auctionStatus === 'AVAILABLE')

    // Create team players map for roster emails
    const teamPlayersMap = new Map<string, any[]>()
    
    // Group sold players by team owner
    for (const owner of teamOwners) {
      const teamPlayers = soldPlayers.filter(player => 
        player.auctionTeam?.ownerName === owner.ownerName
      ).map(player => ({
        id: player.id,
        name: player.name,
        age: player.age || 0,
        phone: player.phone || '',
        email: player.email || '',
        city: player.city || '',
        position: player.position || 'All-rounder',
        experience: player.experience || 'INTERMEDIATE',
        basePrice: player.basePrice || 0,
        soldPrice: player.soldPrice || undefined,
        auctionStatus: player.auctionStatus || 'SOLD',
        auctionTeam: player.auctionTeam ? {
          name: player.auctionTeam.name,
          ownerName: player.auctionTeam.ownerName || '',
          ownerPhone: player.auctionTeam.ownerPhone || ''
        } : undefined
      }))
      teamPlayersMap.set(owner.id, teamPlayers)
    }

    // Prepare tournament data
    const tournamentData = {
      id: tournament.id,
      name: tournament.name,
      startDate: tournament.startDate?.toISOString() || new Date().toISOString(),
      venue: tournament.venue || 'Tunda Cricket Ground',
      auctionDate: tournament.auctionDate?.toISOString() || new Date().toISOString(),
      playerEntryFee: tournament.playerEntryFee || 500,
      teamEntryFee: tournament.teamEntryFee || 5000
    }

    // Format team owners data
    const ownerData = teamOwners.map(owner => ({
      id: owner.id,
      teamName: owner.teamName,
      teamIndex: owner.teamIndex,
      ownerName: owner.ownerName,
      ownerPhone: owner.ownerPhone,
      ownerEmail: owner.ownerEmail,
      ownerCity: owner.ownerCity || '',
      sponsorName: owner.sponsorName || undefined,
      verified: owner.verified,
      entryFeePaid: owner.entryFeePaid
    }))

    // Format sold players data
    const soldPlayerData = soldPlayers.map(player => ({
      id: player.id,
      name: player.name,
      age: player.age || 0,
      phone: player.phone || '',
      email: player.email || '',
      city: player.city || '',
      position: player.position || 'All-rounder',
      experience: player.experience || 'INTERMEDIATE',
      basePrice: player.basePrice || 0,
      soldPrice: player.soldPrice || undefined,
      auctionStatus: player.auctionStatus || 'SOLD',
      auctionTeam: player.auctionTeam ? {
        name: player.auctionTeam.name,
        ownerName: player.auctionTeam.ownerName || '',
        ownerPhone: player.auctionTeam.ownerPhone || ''
      } : undefined
    }))

    // Format unsold players data
    const unsoldPlayerData = unsoldPlayers.map(player => ({
      id: player.id,
      name: player.name,
      age: player.age || 0,
      phone: player.phone || '',
      email: player.email || '',
      city: player.city || '',
      position: player.position || 'All-rounder',
      experience: player.experience || 'INTERMEDIATE',
      basePrice: player.basePrice || 0,
      soldPrice: player.soldPrice || undefined,
      auctionStatus: player.auctionStatus || 'UNSOLD'
    }))

    // Send all notifications
    const result = await AuctionNotificationService.sendAuctionCompletionNotifications(
      tournamentData,
      ownerData,
      soldPlayerData,
      unsoldPlayerData,
      teamPlayersMap
    )

    return NextResponse.json({
      success: true,
      message: 'Auction completion notifications sent successfully',
      summary: {
        teamOwners: ownerData.length,
        soldPlayers: soldPlayerData.length,
        unsoldPlayers: unsoldPlayerData.length,
        emailResults: result
      }
    })

  } catch (error) {
    console.error('Error sending auction completion notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendPlayerRegistrationEmail, sendAdminPlayerRegistrationNotification } from '@/lib/emailService'

const prisma = new PrismaClient()

// Get all individual player registrations for an auction tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const tournament = await prisma.tournament.findFirst({
      where: { id },
      select: { isAuctionBased: true, name: true }
    })

    if (!tournament?.isAuctionBased) {
      return NextResponse.json(
        { error: 'This endpoint is only for auction-based tournaments' },
        { status: 400 }
      )
    }

    const players = await prisma.auctionPlayer.findMany({
      where: {
        tournamentId: id
      },
      include: {
        auctionTeam: {
          select: {
            id: true,
            name: true,
            ownerName: true,
            ownerEmail: true
          }
        }
      },
      orderBy: [
        { auctionStatus: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      players,
      tournament: tournament.name
    })
  } catch (error) {
    console.error('Error fetching auction players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auction players' },
      { status: 500 }
    )
  }
}

// Register individual player for auction tournament
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      age,
      phone,
      email,
      city,
      address,
      dateOfBirth,
      fatherName,
      position,
      battingStyle,
      bowlingStyle,
      experience,
      emergencyContact,
      emergencyPhone,
      emergencyRelation,
      profileImageUrl,
      basePrice,
      specialSkills
    } = body

    // Basic validation
    if (!name || !phone || !email || !position) {
      return NextResponse.json(
        { error: 'Name, phone, email, and position are required' },
        { status: 400 }
      )
    }

    // Check if tournament exists and is auction-based
    const tournament = await prisma.tournament.findFirst({
      where: { 
        id,
        isAuctionBased: true
      },
      select: { 
        id: true, 
        name: true, 
        registrationDeadline: true,
        status: true,
        startDate: true,
        venue: true,
        auctionDate: true,
        playerEntryFee: true,
        teamEntryFee: true
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found or not auction-based' },
        { status: 404 }
      )
    }

    // Check registration deadline
    if (tournament.registrationDeadline && new Date() > new Date(tournament.registrationDeadline)) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    // Check if player already registered
    const existingPlayer = await prisma.auctionPlayer.findFirst({
      where: {
        tournamentId: id,
        OR: [
          { phone: phone },
          { email: email },
          { 
            AND: [
              { name: name },
              { phone: phone }
            ]
          }
        ]
      }
    })

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player already registered with this phone/email' },
        { status: 400 }
      )
    }

    // Create player registration
    const player = await prisma.auctionPlayer.create({
      data: {
        tournamentId: id,
        name: name.trim(),
        age: age ? parseInt(age) : null,
        phone: phone.trim(),
        email: email.trim(),
        city: city?.trim() || null,
        position: position,
        battingStyle: battingStyle || null,
        bowlingStyle: bowlingStyle || null,
        experience: experience || 'INTERMEDIATE',
        basePrice: basePrice ? parseInt(basePrice) : 0,
        specialSkills: specialSkills?.trim() || null,
        auctionStatus: 'AVAILABLE',
        // New fields with raw SQL since Prisma client isn't updated yet
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(address && { address: address.trim() }),
        ...(fatherName && { fatherName: fatherName.trim() }),
        ...(emergencyContact && { emergencyContact: emergencyContact.trim() }),
        ...(emergencyPhone && { emergencyPhone: emergencyPhone.trim() }),
        ...(emergencyRelation && { emergencyRelation: emergencyRelation.trim() }),
        ...(profileImageUrl && { profileImageUrl: profileImageUrl.trim() })
      }
    })

    // Send email notification to player and admin
    try {
      // Send professional player registration email
      await sendPlayerRegistrationEmail(
        {
          id: player.id,
          name: player.name,
          age: player.age || 0,
          phone: player.phone,
          email: player.email,
          city: player.city || '',
          position: player.position,
          experience: player.experience || 'INTERMEDIATE',
          basePrice: player.basePrice || 0,
          auctionStatus: player.auctionStatus || 'AVAILABLE'
        },
        {
          id: tournament.id,
          name: tournament.name,
          startDate: tournament.startDate?.toISOString() || new Date().toISOString(),
          venue: tournament.venue || 'Tunda Cricket Ground',
          auctionDate: tournament.auctionDate?.toISOString() || new Date().toISOString(),
          playerEntryFee: tournament.playerEntryFee || 500,
          teamEntryFee: tournament.teamEntryFee || 5000
        }
      );
      
      // Also send admin notification
      await sendAdminPlayerRegistrationNotification(
        player.name,
        player.email || '',
        player.phone || '',
        player.position || '',
        player.experience || '',
        tournament.name,
        player.id
      );
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError)
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Player registered successfully for auction tournament!',
      player: {
        id: player.id,
        name: player.name,
        position: player.position,
        auctionStatus: player.auctionStatus
      }
    })

  } catch (error) {
    console.error('Error registering auction player:', error)
    return NextResponse.json(
      { error: 'Failed to register player' },
      { status: 500 }
    )
  }
}

// Update player registration status (for admin approval and auction results)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const body = await request.json()
    const { playerId, auctionStatus, basePrice, soldPrice, teamOwnerId } = body

    if (!playerId || !auctionStatus) {
      return NextResponse.json(
        { error: 'Player ID and status are required' },
        { status: 400 }
      )
    }

    // Get tournament details first
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        startDate: true,
        venue: true,
        auctionDate: true,
        playerEntryFee: true,
        teamEntryFee: true,
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      auctionStatus,
      basePrice: basePrice ? parseInt(basePrice) : undefined
    }

    // If player is sold, add sold price and team owner
    if (auctionStatus === 'SOLD' && teamOwnerId) {
      updateData.soldPrice = soldPrice ? parseInt(soldPrice) : undefined
      updateData.auctionTeamId = teamOwnerId
    }

    // Update player
    const player = await prisma.auctionPlayer.update({
      where: {
        id: playerId,
        tournamentId: tournamentId
      },
      data: updateData,
      include: {
        auctionTeam: {
          select: {
            name: true,
            ownerName: true,
            ownerPhone: true,
          }
        }
      }
    })

    // Send automatic email notifications based on status change
    try {
      const playerData = {
        id: player.id,
        name: player.name,
        age: player.age || 0,
        phone: player.phone || '',
        email: player.email || '',
        city: player.city || '',
        position: player.position || '',
        experience: player.experience || '',
        basePrice: player.basePrice || 0,
        soldPrice: player.soldPrice || undefined,
        auctionStatus: player.auctionStatus || 'PENDING',
        auctionTeam: player.auctionTeam ? {
          name: player.auctionTeam.name,
          ownerName: player.auctionTeam.ownerName || '',
          ownerPhone: player.auctionTeam.ownerPhone || '',
        } : undefined
      }

      const tournamentData = {
        id: tournament.id,
        name: tournament.name,
        startDate: tournament.startDate?.toISOString() || new Date().toISOString(),
        venue: tournament.venue || 'Tunda Cricket Ground',
        auctionDate: tournament.auctionDate?.toISOString(),
        playerEntryFee: tournament.playerEntryFee || 500,
        teamEntryFee: tournament.teamEntryFee || 5000
      }

      // Import EmailService 
      const emailTemplates = await import('@/lib/emailTemplates')
      const EmailService = emailTemplates.EmailService

      if (auctionStatus === 'APPROVED') {
        await EmailService.sendPlayerApprovedEmail(playerData, tournamentData)
      } else if (auctionStatus === 'SOLD') {
        await EmailService.sendPlayerSoldEmail(playerData, tournamentData)
      } else if (auctionStatus === 'UNSOLD') {
        await EmailService.sendPlayerUnsoldEmail(playerData, tournamentData)
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError)
      // Don't fail the update if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Player status updated successfully',
      player
    })

  } catch (error) {
    console.error('Error updating auction player:', error)
    return NextResponse.json(
      { error: 'Failed to update player status' },
      { status: 500 }
    )
  }
}

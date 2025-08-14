import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendTeamOwnerRegistrationEmail, sendAdminTeamOwnerRegistrationNotification, sendTeamOwnerApprovalWithAuctionLink } from '@/lib/emailService'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerCity,
      teamName,
      sponsorName,
      sponsorContact,
      paymentMethod,
      paymentAmount,
      specialRequests
    } = body

    // Get tournament details
    const tournament = await prisma.tournament.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        status: true,
        isAuctionBased: true,
        auctionTeamCount: true,
        startDate: true,
        venue: true,
        auctionDate: true,
        playerEntryFee: true,
        teamEntryFee: true,
        _count: {
          select: { teamOwners: true }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check if tournament is auction-based
    if (!tournament.isAuctionBased) {
      return NextResponse.json(
        { success: false, error: 'This tournament does not support team ownership registration' },
        { status: 400 }
      )
    }

    // Check if registration is still open
    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json(
        { success: false, error: 'Registration is closed for this tournament' },
        { status: 400 }
      )
    }

    // Check if auction teams are full
    if (tournament._count.teamOwners >= (tournament.auctionTeamCount || 8)) {
      return NextResponse.json(
        { success: false, error: 'All team ownership slots are filled' },
        { status: 400 }
      )
    }

    // Check if owner is already registered
    const existingOwner = await prisma.teamOwner.findFirst({
      where: {
        tournamentId: id,
        OR: [
          { ownerPhone },
          { ownerEmail }
        ]
      }
    })

    if (existingOwner) {
      return NextResponse.json(
        { success: false, error: 'You are already registered as a team owner for this tournament' },
        { status: 400 }
      )
    }

    // Check if team name is already taken
    const existingTeamName = await prisma.teamOwner.findFirst({
      where: {
        tournamentId: id,
        teamName
      }
    })

    if (existingTeamName) {
      return NextResponse.json(
        { success: false, error: 'This team name is already taken' },
        { status: 400 }
      )
    }

    // Get next team index
    const maxTeamIndex = await prisma.teamOwner.findFirst({
      where: { tournamentId: id },
      orderBy: { teamIndex: 'desc' },
      select: { teamIndex: true }
    })

    const nextTeamIndex = (maxTeamIndex?.teamIndex || 0) + 1

    // Create team owner registration
    const teamOwner = await prisma.teamOwner.create({
      data: {
        tournamentId: id,
        teamName,
        teamIndex: nextTeamIndex,
        ownerName,
        ownerPhone,
        ownerEmail,
        ownerCity,
        sponsorName,
        sponsorContact,
        entryFeePaid: paymentMethod === 'CASH' ? false : false, // Will be updated after payment verification
        verified: false // Will be verified by admin
      }
    })

    // Send automatic registration email
    try {
      // Send professional team owner registration email
      await sendTeamOwnerRegistrationEmail(
        {
          id: teamOwner.id,
          teamName: teamOwner.teamName,
          teamIndex: teamOwner.teamIndex,
          ownerName: teamOwner.ownerName,
          ownerPhone: teamOwner.ownerPhone,
          ownerEmail: teamOwner.ownerEmail,
          ownerCity: teamOwner.ownerCity || '',
          sponsorName: teamOwner.sponsorName || undefined,
          verified: teamOwner.verified,
          entryFeePaid: teamOwner.entryFeePaid
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
      await sendAdminTeamOwnerRegistrationNotification(
        teamOwner.ownerName,
        teamOwner.ownerEmail,
        teamOwner.ownerPhone,
        teamOwner.teamName,
        teamOwner.teamIndex,
        tournament.name,
        teamOwner.id
      );
    } catch (emailError) {
      console.error('Failed to send team owner registration email:', emailError)
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Team owner registration submitted successfully',
      teamOwner: {
        id: teamOwner.id,
        teamName: teamOwner.teamName,
        teamIndex: teamOwner.teamIndex,
        verified: teamOwner.verified,
        entryFeePaid: teamOwner.entryFeePaid
      }
    })

  } catch (error) {
    console.error('Error registering team owner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register team owner' },
      { status: 500 }
    )
  }
}

// Get all team owners for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    const owners = await prisma.teamOwner.findMany({
      where: {
        tournamentId
      },
      select: {
        id: true,
        teamName: true,
        teamIndex: true,
        ownerName: true,
        ownerPhone: true,
        ownerEmail: true,
        ownerCity: true,
        sponsorName: true,
        verified: true,
        entryFeePaid: true,
        createdAt: true,
        auctionToken: true,
        tournament: {
          select: {
            id: true,
            name: true,
            teamEntryFee: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      teamOwners: owners
    });

  } catch (error) {
    console.error('Error fetching team owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team owners' },
      { status: 500 }
    );
  }
}

// Update team owner status (verification, payment)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const { teamOwnerId, verified, entryFeePaid } = body

    if (!teamOwnerId) {
      return NextResponse.json(
        { success: false, error: 'Team owner ID is required' },
        { status: 400 }
      )
    }

    // Get tournament details for email
    const tournament = await prisma.tournament.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        startDate: true,
        venue: true,
        auctionDate: true,
        playerEntryFee: true,
        teamEntryFee: true
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Update team owner
    const updateData: any = {}
    if (typeof verified === 'boolean') {
      updateData.verified = verified
    }
    if (typeof entryFeePaid === 'boolean') {
      updateData.entryFeePaid = entryFeePaid
    }

    const updatedOwner = await prisma.teamOwner.update({
      where: { id: teamOwnerId },
      data: updateData
    })

    // Send automatic verification email with unique auction link
    if (verified === true) {
      try {
        // Generate unique auction token for this team owner
        const auctionToken = `auction_${teamOwnerId}_${Date.now()}_${Math.random().toString(36).substring(2)}`
        
        // Update team owner with auction token
        await prisma.teamOwner.update({
          where: { id: teamOwnerId },
          data: { auctionToken }
        })

        // Send verification email with unique auction link
        try {
          await sendTeamOwnerApprovalWithAuctionLink(
            {
              id: updatedOwner.id,
              teamName: updatedOwner.teamName,
              teamIndex: updatedOwner.teamIndex,
              ownerName: updatedOwner.ownerName,
              ownerPhone: updatedOwner.ownerPhone,
              ownerEmail: updatedOwner.ownerEmail,
              ownerCity: updatedOwner.ownerCity || '',
              sponsorName: updatedOwner.sponsorName || undefined,
              verified: updatedOwner.verified,
              entryFeePaid: updatedOwner.entryFeePaid
            },
            {
              id: tournament.id,
              name: tournament.name,
              startDate: tournament.startDate?.toISOString() || new Date().toISOString(),
              venue: tournament.venue || 'Tunda Cricket Ground',
              auctionDate: tournament.auctionDate?.toISOString() || new Date().toISOString(),
              playerEntryFee: tournament.playerEntryFee || 500,
              teamEntryFee: tournament.teamEntryFee || 5000
            },
            auctionToken
          );
        } catch (emailError) {
          console.error('Failed to send owner verification email:', emailError);
        }
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Team owner updated successfully',
      teamOwner: updatedOwner
    })

  } catch (error) {
    console.error('Error updating team owner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update team owner' },
      { status: 500 }
    )
  }
}

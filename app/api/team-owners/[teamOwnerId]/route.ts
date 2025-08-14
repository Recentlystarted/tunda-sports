import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { teamOwnerId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 401 }
      )
    }

    // Get team owner details
    const teamOwner = await prisma.teamOwner.findUnique({
      where: { id: params.teamOwnerId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            auctionDate: true,
            auctionBudget: true,
            status: true
          }
        }
      }
    })

    if (!teamOwner) {
      return NextResponse.json(
        { success: false, error: 'Team owner not found' },
        { status: 404 }
      )
    }

    // In a real implementation, you would verify the token against a stored value
    // For now, we'll just check if the token exists and is valid format
    if (token.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Invalid access token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      teamOwner: {
        ...teamOwner,
        // Map fields for frontend compatibility
        teamLogo: teamOwner.sponsorLogo,
        companyName: teamOwner.sponsorName,
        email: teamOwner.ownerEmail,
        contact: teamOwner.ownerPhone,
        isVerified: teamOwner.verified
      }
    })

  } catch (error) {
    console.error('Error fetching team owner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team owner details' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { teamOwnerId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 401 }
      )
    }

    // Basic token validation
    if (token.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Invalid access token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { teamName, teamLogo, companyName, email, contact } = body

    // Validate required fields
    if (!teamName) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Update team owner
    const updatedTeamOwner = await prisma.teamOwner.update({
      where: { id: params.teamOwnerId },
      data: {
        teamName,
        sponsorLogo: teamLogo || null,
        sponsorName: companyName || null,
        ownerEmail: email || null,
        ownerPhone: contact || null,
        verified: true // Mark as verified when they update
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            venue: true,
            auctionDate: true,
            auctionBudget: true,
            playerEntryFee: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      teamOwner: {
        ...updatedTeamOwner,
        // Map fields for frontend compatibility
        teamLogo: updatedTeamOwner.sponsorLogo,
        companyName: updatedTeamOwner.sponsorName,
        email: updatedTeamOwner.ownerEmail,
        contact: updatedTeamOwner.ownerPhone,
        isVerified: updatedTeamOwner.verified
      }
    })

  } catch (error) {
    console.error('Error updating team owner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update team owner' },
      { status: 500 }
    )
  }
}

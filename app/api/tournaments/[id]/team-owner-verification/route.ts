import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { teamOwnerId, expiresInHours = 72 } = body

    // Get team owner details
    const teamOwner = await prisma.teamOwner.findUnique({
      where: {
        id: teamOwnerId,
        tournamentId: params.id
      },
      include: {
        tournament: true
      }
    })

    if (!teamOwner) {
      return NextResponse.json(
        { success: false, error: 'Team owner not found' },
        { status: 404 }
      )
    }

    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

    // Store verification token (you might want to create a separate table for this)
    // For now, we'll use the teamOwner record's updated timestamp as validation
    await prisma.teamOwner.update({
      where: { id: teamOwnerId },
      data: {
        // Store verification token in a new field if you add it to schema
        updatedAt: new Date()
      }
    })

    // Create verification URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/team-owner-portal/${teamOwnerId}?token=${verificationToken}&expires=${expiresAt.getTime()}`

    return NextResponse.json({
      success: true,
      verificationUrl,
      token: verificationToken,
      expiresAt,
      teamOwner: {
        id: teamOwner.id,
        teamName: teamOwner.teamName,
        ownerName: teamOwner.ownerName,
        ownerEmail: teamOwner.ownerEmail
      }
    })

  } catch (error) {
    console.error('Error generating verification link:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate verification link' },
      { status: 500 }
    )
  }
}

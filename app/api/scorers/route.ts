import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const scorers = await prisma.scorer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      scorers
    })
  } catch (error) {
    console.error('Error fetching scorers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scorers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      phone,
      email,
      experience,
      certifications,
      availableFrom,
      availableTo,
      emergencyContact,
      emergencyPhone,
      bookScoring,
      onlineScoring,
      scoringApps,
      profileImageUrl,
      notes,
      city,
      address
    } = body

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const scorer = await prisma.scorer.create({
      data: {
        name,
        phone,
        email,
        experience: experience || 'INTERMEDIATE',
        certifications: JSON.stringify(certifications || []),
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableTo: availableTo ? new Date(availableTo) : null,
        emergencyContact,
        emergencyPhone,
        bookScoring: bookScoring !== false,
        onlineScoring: onlineScoring === true,
        scoringApps: JSON.stringify(scoringApps || ['BOOK']),
        profileImageUrl,
        notes,
        city,
        address
      }
    })

    return NextResponse.json({
      success: true,
      scorer
    })
  } catch (error: any) {
    console.error('Error creating scorer:', error)
    
    // Handle duplicate entry error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A scorer with this name and phone already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create scorer' },
      { status: 500 }
    )
  }
}

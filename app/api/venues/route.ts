import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      venues
    })
  } catch (error) {
    console.error('Error fetching venues:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch venues' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      capacity,
      groundType,
      pitchCount,
      floodlights,
      coveredStands,
      facilities,
      contactPerson,
      contactPhone,
      contactEmail,
      bookingRequired,
      costPerDay,
      googleMapsLink,
      googlePlaceId,
      notes
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Venue name is required' },
        { status: 400 }
      )
    }

    const venue = await prisma.venue.create({
      data: {
        name,
        address,
        city,
        state: state || 'Gujarat',
        pincode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        capacity: capacity ? parseInt(capacity) : null,
        groundType,
        pitchCount: pitchCount ? parseInt(pitchCount) : 1,
        floodlights: floodlights === true || floodlights === 'true',
        coveredStands: coveredStands === true || coveredStands === 'true',
        facilities: JSON.stringify(facilities || []),
        contactPerson,
        contactPhone,
        contactEmail,
        bookingRequired: bookingRequired === true || bookingRequired === 'true',
        costPerDay: costPerDay ? parseInt(costPerDay) : null,
        googleMapsLink,
        googlePlaceId,
        notes
      }
    })

    return NextResponse.json({
      success: true,
      venue
    })
  } catch (error) {
    console.error('Error creating venue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create venue' },
      { status: 500 }
    )
  }
}

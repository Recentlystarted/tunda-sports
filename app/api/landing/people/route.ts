import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET - List people for a section
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')
    const role = searchParams.get('role')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}
    
    if (sectionId) {
      where.sectionId = sectionId
    }
    
    if (role) {
      where.role = { contains: role, mode: 'insensitive' }
    }
    
    if (activeOnly) {
      where.isActive = true
      where.showOnLanding = true
    }

    const people = await prisma.person.findMany({
      where,
      include: {
        section: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      people
    })
  } catch (error) {
    console.error('Error fetching people:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch people' },
      { status: 500 }
    )
  }
}

// POST - Create new person
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      role,
      designation,
      bio,
      email,
      phone,
      profileImage,
      linkedin,
      twitter,
      facebook,
      department,
      joinDate,
      isActive = true,
      sortOrder = 0,
      showOnLanding = true,
      showContact = false,
      sectionId
    } = body

    const person = await prisma.person.create({
      data: {
        name,
        role,
        designation,
        bio,
        email,
        phone,
        profileImage,
        linkedin,
        twitter,
        facebook,
        department,
        joinDate: joinDate ? new Date(joinDate) : null,
        isActive,
        sortOrder,
        showOnLanding,
        showContact,
        sectionId
      },
      include: {
        section: true
      }
    })

    return NextResponse.json({
      success: true,
      person
    })
  } catch (error) {
    console.error('Error creating person:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create person' },
      { status: 500 }
    )
  }
}

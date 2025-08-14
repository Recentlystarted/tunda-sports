import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET - List all landing page sections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionType = searchParams.get('sectionType')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}
    
    if (sectionType && sectionType !== 'ALL') {
      where.sectionType = sectionType
    }
    
    if (activeOnly) {
      where.isActive = true
    }

    const sections = await prisma.landingPageSection.findMany({
      where,
      include: {
        people: {
          where: activeOnly ? { isActive: true } : {},
          orderBy: { sortOrder: 'asc' }
        },
        images: {
          where: activeOnly ? { isActive: true } : {},
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({
      success: true,
      sections
    })
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

// POST - Create new section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sectionType,
      title,
      subtitle,
      content,
      bgColor,
      textColor,
      customCSS,
      bannerImage,
      backgroundImage,
      metaTitle,
      metaDescription,
      isActive = true,
      sortOrder = 0
    } = body

    // Check if section already exists for this type
    const existingSection = await prisma.landingPageSection.findUnique({
      where: { sectionType }
    })

    if (existingSection) {
      return NextResponse.json(
        { success: false, error: 'Section already exists for this type' },
        { status: 400 }
      )
    }

    const section = await prisma.landingPageSection.create({
      data: {
        sectionType,
        title,
        subtitle,
        content,
        bgColor,
        textColor,
        customCSS,
        bannerImage,
        backgroundImage,
        metaTitle,
        metaDescription,
        isActive,
        sortOrder
      },
      include: {
        people: true,
        images: true
      }
    })

    return NextResponse.json({
      success: true,
      section
    })
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create section' },
      { status: 500 }
    )
  }
}

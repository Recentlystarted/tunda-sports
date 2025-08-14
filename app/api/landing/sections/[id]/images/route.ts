import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = params.id

    const images = await prisma.sectionImage.findMany({
      where: {
        sectionId: sectionId
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error('Error fetching section images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch section images' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = params.id
    const body = await request.json()

    const { title, description, imageUrl, altText, category, sortOrder } = body

    // Validate required fields
    if (!imageUrl || !category) {
      return NextResponse.json(
        { error: 'Image URL and category are required' },
        { status: 400 }
      )
    }

    // Check if section exists
    const section = await prisma.landingPageSection.findUnique({
      where: { id: sectionId }
    })

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    const image = await prisma.sectionImage.create({
      data: {
        title: title || 'Untitled',
        description,
        imageUrl,
        altText,
        category,
        isActive: true,
        sortOrder: sortOrder || 0,
        sectionId
      }
    })

    return NextResponse.json(image, { status: 201 })
  } catch (error) {
    console.error('Error creating section image:', error)
    return NextResponse.json(
      { error: 'Failed to create section image' },
      { status: 500 }
    )
  }
}

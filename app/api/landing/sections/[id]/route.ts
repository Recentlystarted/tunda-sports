import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

// GET - Get specific section
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const section = await prisma.landingPageSection.findUnique({
      where: { id: params.id },
      include: {
        people: {
          orderBy: { sortOrder: 'asc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      section
    })
  } catch (error) {
    console.error('Error fetching section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch section' },
      { status: 500 }
    )
  }
}

// PUT - Update section
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
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
    } = body

    const section = await prisma.landingPageSection.update({
      where: { id: params.id },
      data: {
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
    console.error('Error updating section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

// DELETE - Delete section
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.landingPageSection.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}

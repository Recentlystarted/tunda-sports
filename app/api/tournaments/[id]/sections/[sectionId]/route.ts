import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const { name, description, emoji, order } = await request.json()

    const section = await prisma.tournamentPhotoSection.update({
      where: {
        id: params.sectionId,
        tournamentId: params.id
      },
      data: {
        name,
        description,
        emoji,
        order
      },
      include: {
        images: true,
        _count: {
          select: {
            images: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      section
    })

  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    // Check if section has images
    const section = await prisma.tournamentPhotoSection.findUnique({
      where: {
        id: params.sectionId,
        tournamentId: params.id
      },
      include: {
        _count: {
          select: {
            images: true
          }
        }
      }
    })

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    if (section._count.images > 0) {
      return NextResponse.json(
        { error: 'Cannot delete section with images. Please move or delete images first.' },
        { status: 400 }
      )
    }

    await prisma.tournamentPhotoSection.delete({
      where: {
        id: params.sectionId,
        tournamentId: params.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}

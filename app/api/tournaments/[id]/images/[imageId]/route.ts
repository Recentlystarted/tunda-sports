import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const body = await request.json()
    const { title, description, sectionId } = body

    // Verify the image exists and belongs to the tournament
    const existingImage = await prisma.tournamentImage.findFirst({
      where: {
        id: params.imageId,
        tournamentId: params.id
      }
    })

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Verify the section exists (if provided)
    if (sectionId) {
      const section = await prisma.tournamentPhotoSection.findFirst({
        where: {
          id: sectionId,
          tournamentId: params.id
        }
      })

      if (!section) {
        return NextResponse.json(
          { error: 'Section not found' },
          { status: 404 }
        )
      }
    }

    // Update the image
    const updatedImage = await prisma.tournamentImage.update({
      where: { id: params.imageId },
      data: {
        originalName: title || existingImage.originalName,
        description: description || null,
        sectionId: sectionId || existingImage.sectionId
      },
      include: {
        section: true
      }
    })

    return NextResponse.json({
      success: true,
      image: updatedImage
    })
  } catch (error) {
    console.error('Error updating image:', error)
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    // Verify the image exists and belongs to the tournament
    const existingImage = await prisma.tournamentImage.findFirst({
      where: {
        id: params.imageId,
        tournamentId: params.id
      }
    })

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // TODO: Delete from Google Drive as well
    // This would require implementing Google Drive deletion
    // For now, we'll just remove from database

    // Delete from database
    await prisma.tournamentImage.delete({
      where: { id: params.imageId }
    })

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}

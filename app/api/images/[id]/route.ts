import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get single image
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const image = await prisma.galleryImage.findUnique({
      where: { id: params.id }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      image: {
        id: image.id,
        title: image.title || image.originalName,
        description: image.description,
        imageUrl: image.publicUrl || image.googleDriveUrl || `/uploads/${image.filename}`,
        category: image.category,
        tags: image.tags ? JSON.parse(image.tags) : [],
        uploadDate: image.createdAt.toISOString(),
        size: image.size,
        filename: image.filename,
        originalName: image.originalName,
        mimeType: image.mimeType,
        isPublic: image.isPublic
      }
    })

  } catch (error) {
    console.error('Get image error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
}

// PUT - Update image
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, description, category, tags, isVisible, sortOrder } = await request.json()

    const image = await prisma.galleryImage.findUnique({
      where: { id: params.id }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    if (isVisible !== undefined) updateData.isPublic = isVisible
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const updatedImage = await prisma.galleryImage.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Image updated successfully',
      image: updatedImage
    })

  } catch (error) {
    console.error('Update image error:', error)
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    )
  }
}

// DELETE - Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const image = await prisma.galleryImage.findUnique({
      where: { id: params.id }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Delete from database
    await prisma.galleryImage.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}

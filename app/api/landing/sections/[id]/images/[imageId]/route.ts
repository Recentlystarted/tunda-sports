import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, imageId: string } }
) {
  try {
    const { imageId } = params

    const image = await prisma.sectionImage.findUnique({
      where: { id: imageId },
      include: {
        section: true
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(image)
  } catch (error) {
    console.error('Error fetching section image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch section image' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, imageId: string } }
) {
  try {
    const { imageId } = params
    const body = await request.json()

    const { title, description, imageUrl, altText, category, isActive, sortOrder } = body

    // Check if image exists
    const existingImage = await prisma.sectionImage.findUnique({
      where: { id: imageId }
    })

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    const image = await prisma.sectionImage.update({
      where: { id: imageId },
      data: {
        title,
        description,
        imageUrl,
        altText,
        category,
        isActive,
        sortOrder
      }
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error('Error updating section image:', error)
    return NextResponse.json(
      { error: 'Failed to update section image' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, imageId: string } }
) {
  try {
    const { imageId } = params

    // Check if image exists
    const existingImage = await prisma.sectionImage.findUnique({
      where: { id: imageId }
    })

    if (!existingImage) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    await prisma.sectionImage.delete({
      where: { id: imageId }
    })

    return NextResponse.json({ message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Error deleting section image:', error)
    return NextResponse.json(
      { error: 'Failed to delete section image' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Bulk operations on images
export async function POST(request: NextRequest) {
  try {
    const { action, imageIds } = await request.json()

    if (!action || !imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and image IDs are required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'delete':
        result = await prisma.galleryImage.deleteMany({
          where: {
            id: {
              in: imageIds
            }
          }
        })
        break

      case 'show':
        result = await prisma.galleryImage.updateMany({
          where: {
            id: {
              in: imageIds
            }
          },
          data: {
            isPublic: true
          }
        })
        break

      case 'hide':
        result = await prisma.galleryImage.updateMany({
          where: {
            id: {
              in: imageIds
            }
          },
          data: {
            isPublic: false
          }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${result.count} image(s)`,
      count: result.count
    })

  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

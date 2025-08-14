import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

// GET - List all images with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const publicOnly = searchParams.get('publicOnly') === 'true'

    const where: any = {}
    
    if (category && category !== 'ALL') {
      where.category = category
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Only show visible/public images if publicOnly is true
    if (publicOnly) {
      where.isPublic = true
    }

    const images = await prisma.galleryImage.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const total = await prisma.galleryImage.count({ where })

    return NextResponse.json({
      success: true,
      images: images.map(image => ({
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
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Get images error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
}

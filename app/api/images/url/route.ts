import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { url, title, description, category, tags } = await request.json()

    if (!url || !title) {
      return NextResponse.json(
        { error: 'URL and title are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Test if image is accessible
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Image URL is not accessible' },
          { status: 400 }
        )
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) {
        return NextResponse.json(
          { error: 'URL does not point to an image' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to verify image URL' },
        { status: 400 }
      )
    }

    // Create database entry
    const imageRecord = await prisma.galleryImage.create({
      data: {
        filename: url,
        originalName: title,
        title,
        description: description || null,
        category: category as any,
        size: 0, // Unknown for URLs
        mimeType: 'image/unknown',
        publicUrl: url,
        tags: tags ? JSON.stringify(tags) : null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Image added successfully',
      image: imageRecord
    })

  } catch (error) {
    console.error('URL upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

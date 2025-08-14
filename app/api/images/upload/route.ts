import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const uploadedImages = []

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `File ${file.name} is not an image` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`
      const filePath = join(uploadsDir, fileName)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)      // Create database entry
      const imageRecord = await prisma.galleryImage.create({
        data: {
          filename: fileName,
          originalName: file.name,
          title: files.length === 1 ? title : `${title} - ${file.name}`,
          description: description || null,
          category: category as any,
          size: file.size,
          mimeType: file.type,
          tags: tags ? JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(Boolean)) : null
        }
      })

      uploadedImages.push(imageRecord)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      images: uploadedImages
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error during upload' },
      { status: 500 }
    )
  }
}

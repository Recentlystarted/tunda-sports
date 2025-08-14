import { NextRequest, NextResponse } from 'next/server'

// Configure runtime for better static generation
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fileId = url.searchParams.get('id')
    
    if (!fileId) {
      return new NextResponse('File ID is required', { status: 400 })
    }

    // Use the direct download URL format that works better
    const googleDriveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
    
    const response = await fetch(googleDriveUrl)
    
    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: 404 })
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error proxying Google Drive image:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

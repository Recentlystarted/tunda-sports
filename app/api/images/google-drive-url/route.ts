import { NextRequest, NextResponse } from 'next/server'

/**
 * Utility API for Google Drive URL conversion
 * POST /api/images/google-drive-url
 */
export async function POST(request: NextRequest) {
  try {
    const { url, action = 'optimize' } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'optimize':
        return optimizeGoogleDriveUrl(url)
      
      case 'validate':
        return validateGoogleDriveUrl(url)
      
      case 'extract-id':
        return extractFileId(url)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Google Drive URL processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process Google Drive URL' },
      { status: 500 }
    )
  }
}

function optimizeGoogleDriveUrl(url: string) {
  try {
    // Extract file ID from various Google Drive URL formats
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || 
                       url.match(/id=([a-zA-Z0-9-_]+)/) ||
                       url.match(/\/open\?id=([a-zA-Z0-9-_]+)/)

    if (!fileIdMatch) {
      return NextResponse.json(
        { error: 'Invalid Google Drive URL format' },
        { status: 400 }
      )
    }

    const fileId = fileIdMatch[1]
    
    const optimizedUrls = {
      directView: `https://drive.google.com/uc?export=view&id=${fileId}`,
      thumbnail400: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
      thumbnail600: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
      thumbnail800: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
      originalView: `https://drive.google.com/file/d/${fileId}/view`,
      preview: `https://drive.google.com/file/d/${fileId}/preview`
    }

    return NextResponse.json({
      success: true,
      fileId,
      originalUrl: url,
      optimizedUrls,
      recommended: optimizedUrls.thumbnail600 // Best for web display
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to optimize URL' },
      { status: 500 }
    )
  }
}

function validateGoogleDriveUrl(url: string) {
  const isValidGoogleDrive = url.includes('drive.google.com') || url.includes('googleapis.com')
  const hasFileId = /\/file\/d\/([a-zA-Z0-9-_]+)/.test(url) || 
                   /id=([a-zA-Z0-9-_]+)/.test(url) ||
                   /\/open\?id=([a-zA-Z0-9-_]+)/.test(url)

  return NextResponse.json({
    success: true,
    isValid: isValidGoogleDrive && hasFileId,
    isGoogleDrive: isValidGoogleDrive,
    hasFileId,
    url
  })
}

function extractFileId(url: string) {
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || 
                     url.match(/id=([a-zA-Z0-9-_]+)/) ||
                     url.match(/\/open\?id=([a-zA-Z0-9-_]+)/)

  return NextResponse.json({
    success: true,
    fileId: fileIdMatch ? fileIdMatch[1] : null,
    url
  })
}

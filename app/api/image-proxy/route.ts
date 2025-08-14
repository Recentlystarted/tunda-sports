import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Convert Google Drive URLs to direct download format
    let proxyUrl = imageUrl;
    
    // Handle Google Drive share URLs
    if (imageUrl.includes('drive.google.com/file/d/')) {
      const fileIdMatch = imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        proxyUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }

    // Fetch the image
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Return a placeholder image or error response
    return NextResponse.json(
      { error: 'Failed to load image' },
      { status: 500 }
    );
  }
}

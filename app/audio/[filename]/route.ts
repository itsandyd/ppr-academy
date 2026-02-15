import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    

    
    // Check if we have the audio file in our cache
    const audioCache = (global as any).audioCache as Map<string, ArrayBuffer>;
    
    if (!audioCache || !audioCache.has(filename)) {

      return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
    }
    
    const audioBuffer = audioCache.get(filename);

    
    // Return the audio file with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer?.byteLength.toString() || '0',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Accept-Ranges': 'bytes',
      },
    });
    
  } catch (error) {
    console.error('Audio API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
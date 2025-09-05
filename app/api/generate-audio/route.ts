import { NextRequest, NextResponse } from 'next/server';
import { cleanTextForSpeech, validateTextForSpeech } from '@/lib/text-utils';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { htmlContent, chapterId, voice = 'Adam', voiceId } = body;

    if (!htmlContent || !chapterId) {
      return NextResponse.json(
        { error: 'Missing required fields: htmlContent and chapterId' },
        { status: 400 }
      );
    }

    // Clean the HTML content to plain text
    const cleanedText = cleanTextForSpeech(htmlContent);
    
    // Validate the cleaned text
    const validation = validateTextForSpeech(cleanedText);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Text validation failed', 
          details: validation.errors,
          cleanedText,
          validation 
        },
        { status: 400 }
      );
    }

    // Check if ElevenLabs API key is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      // For development/demo purposes, return a simulated success response
      console.log('ElevenLabs API not configured, returning simulated response');
      
      const estimatedDuration = validation.wordCount / 150; // minutes
      const simulatedAudioSize = cleanedText.length * 100; // rough estimate
      
      // Create a simple base64 audio data placeholder
      const simulatedAudioData = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA";
      
      return NextResponse.json({
        success: true,
        audioData: simulatedAudioData,
        metadata: {
          chapterId,
          cleanedText,
          validation,
          audioSize: simulatedAudioSize,
          estimatedDuration,
          isSimulated: true,
        },
        message: 'Demo mode: ElevenLabs API not configured. This is a simulated response.',
      });
    }

    // Generate audio using ElevenLabs API
    const voiceIdToUse = voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default to Adam if no voiceId provided
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceIdToUse}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: cleanedText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate audio', details: errorText },
        { status: 500 }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // TODO: Upload to Convex file storage and save URL to chapter
    // For now, return the audio data and metadata
    return NextResponse.json({
      success: true,
      audioData: `data:audio/mpeg;base64,${audioBase64}`,
      metadata: {
        chapterId,
        cleanedText,
        validation,
        audioSize: audioBuffer.byteLength,
        estimatedDuration: validation.wordCount / 150, // minutes
      },
    });

  } catch (error) {
    console.error('Audio generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

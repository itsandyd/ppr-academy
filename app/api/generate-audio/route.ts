import { NextRequest, NextResponse } from 'next/server';
import { cleanTextForSpeech, validateTextForSpeech } from '@/lib/text-utils';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Convex client for server-side use
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filesApi: any = api.files;
    const token = await getToken({ template: "convex" });
    if (token) {
      convex.setAuth(token);
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
      // For development/demo purposes, create a simulated audio file and upload it to Convex
      console.log('ElevenLabs API not configured, creating simulated audio file');
      
      const estimatedDuration = validation.wordCount / 150; // minutes
      const simulatedAudioSize = cleanedText.length * 100; // rough estimate
      
      try {
        // Create a minimal MP3 file buffer (silent audio)
        const silentMp3Buffer = Buffer.from([
          0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x23, 0x54, 0x53, 0x53, 0x45,
          0x00, 0x00, 0x00, 0x0F, 0x00, 0x00, 0x03, 0x4C, 0x61, 0x76, 0x66, 0x35, 0x38, 0x2E,
          0x37, 0x36, 0x2E, 0x31, 0x30, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0xFF, 0xFB, 0x90, 0x00
        ]);
        
        const blob = new Blob([silentMp3Buffer], { type: 'audio/mpeg' });
        
        // Generate upload URL from Convex
        const uploadUrl = await convex.mutation(filesApi.generateUploadUrl, {});
        
        // Upload the file
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'audio/mpeg' },
          body: blob,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload simulated audio file');
        }
        
        const { storageId } = await uploadResponse.json();

        // Get the URL for the uploaded file
        const audioUrl = await convex.mutation(filesApi.getUrl, {
          storageId,
        });
        
        return NextResponse.json({
          success: true,
          audioUrl: audioUrl,
          metadata: {
            chapterId,
            cleanedText,
            validation,
            audioSize: simulatedAudioSize,
            estimatedDuration,
            isSimulated: true,
          },
          message: 'Demo mode: ElevenLabs API not configured. Created simulated audio file.',
        });
      } catch (uploadError) {
        console.error('Failed to upload simulated audio:', uploadError);
        
        // Fallback to base64 if upload fails
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
            isBase64Fallback: true,
          },
          message: 'Demo mode: ElevenLabs API not configured. Using base64 fallback.',
        });
      }
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
    
    // Upload audio to Convex file storage
    try {
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      
      // Generate upload URL from Convex
      const uploadUrl = await convex.mutation(filesApi.generateUploadUrl, {});
      
      // Upload the file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/mpeg' },
        body: blob,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio file');
      }
      
      const { storageId } = await uploadResponse.json();

      // Get the URL for the uploaded file
      const audioUrl = await convex.mutation(filesApi.getUrl, {
        storageId,
      });
      
      return NextResponse.json({
        success: true,
        audioUrl: audioUrl,
        metadata: {
          chapterId,
          cleanedText,
          validation,
          audioSize: audioBuffer.byteLength,
          estimatedDuration: validation.wordCount / 150, // minutes
        },
      });
    } catch (uploadError) {
      console.error('Failed to upload to Convex storage:', uploadError);
      
      // Fallback: return base64 data
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      return NextResponse.json({
        success: true,
        audioData: `data:audio/mpeg;base64,${audioBase64}`,
        metadata: {
          chapterId,
          cleanedText,
          validation,
          audioSize: audioBuffer.byteLength,
          estimatedDuration: validation.wordCount / 150, // minutes
          isBase64Fallback: true,
        },
      });
    }

  } catch (error) {
    console.error('Audio generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

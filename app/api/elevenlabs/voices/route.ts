import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if ElevenLabs API key is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({
        error: 'ElevenLabs API key not configured',
        voices: [],
        isDemo: true,
        message: 'Add ELEVENLABS_API_KEY to your environment variables to see your actual voices.',
      });
    }

    // Fetch voices from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json(
        { 
          error: 'Failed to fetch voices from ElevenLabs',
          details: errorText,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the response to include useful information
    const voices = data.voices?.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description,
      preview_url: voice.preview_url,
      available_for_tiers: voice.available_for_tiers,
      settings: voice.settings,
      labels: voice.labels,
      samples: voice.samples?.length || 0,
      high_quality_base_model_ids: voice.high_quality_base_model_ids,
    })) || [];

    return NextResponse.json({
      success: true,
      voices,
      total: voices.length,
      isDemo: false,
    });

  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also create a POST endpoint to test a specific voice
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Rate limiting (strict - 5 requests/min, costs money)
    const identifier = getRateLimitIdentifier(request, userId);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const { voice_id, text = "Hello! This is a test of this voice." } = await request.json();

    if (!voice_id) {
      return NextResponse.json({ error: 'voice_id is required' }, { status: 400 });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({
        error: 'ElevenLabs API key not configured',
        isDemo: true,
      });
    }

    // Generate a short audio sample with the specified voice
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: 'Failed to generate test audio',
        details: errorText,
      }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      audioData: `data:audio/mpeg;base64,${audioBase64}`,
      voice_id,
      text,
      audioSize: audioBuffer.byteLength,
    });

  } catch (error) {
    console.error('Error testing voice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

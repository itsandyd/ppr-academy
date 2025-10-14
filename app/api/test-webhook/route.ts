import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple webhook test endpoint
 * Use this to verify your webhook setup is working
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('🔍 Test webhook verification:', {
    mode,
    token,
    challenge,
    url: request.url,
    expectedToken: process.env.WEBHOOK_VERIFY_TOKEN || 'NOT_SET',
  });

  // For testing, use a simple verify token
  const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN || 'test123';

  if (mode === 'subscribe' && token === expectedToken && challenge) {
    console.log('✅ Test webhook verification successful!');
    return new NextResponse(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return NextResponse.json({
    status: 'failed',
    mode,
    token,
    expectedToken: expectedToken ? 'SET' : 'NOT_SET',
    challenge: challenge ? 'PROVIDED' : 'MISSING'
  }, { status: 200 }); // Return 200 for debugging
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  console.log('📥 Test webhook POST received:', body);
  
  return NextResponse.json({ 
    received: true,
    message: 'Test webhook is working!'
  });
}

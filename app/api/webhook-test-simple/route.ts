import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple test webhook to verify setup
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('🔍 Simple webhook test:', { mode, token, challenge });

    if (mode === 'subscribe' && token === 'ppr_automation_webhook_2024' && challenge) {
      console.log('✅ Verification successful');
      return new NextResponse(challenge, { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return NextResponse.json({
      status: 'test',
      mode,
      token,
      challenge,
      env: process.env.WEBHOOK_VERIFY_TOKEN ? 'SET' : 'NOT_SET'
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

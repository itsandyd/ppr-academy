import { NextRequest, NextResponse } from 'next/server';

/**
 * Instagram Webhook - Simple and Working
 * 
 * This handles Instagram webhook verification and events
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('🔍 Instagram webhook verification:', { 
      mode, 
      token, 
      challenge,
      expectedToken: 'ppr_automation_webhook_2024'
    });

    // Instagram verification
    if (mode === 'subscribe' && token === 'ppr_automation_webhook_2024' && challenge) {
      console.log('✅ Instagram webhook verification SUCCESS');
      return new NextResponse(challenge, { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    console.log('❌ Instagram webhook verification FAILED');
    return NextResponse.json({ 
      error: 'Verification failed',
      mode,
      token,
      challenge
    }, { status: 403 });

  } catch (error) {
    console.error('Webhook verification error:', error);
    return NextResponse.json({ 
      error: 'Server error: ' + String(error) 
    }, { status: 500 });
  }
}

/**
 * Handle Instagram webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    console.log('📥 Instagram webhook event received:', payload);

    // For now, just log and return success
    // TODO: Process webhook for automation triggers
    
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

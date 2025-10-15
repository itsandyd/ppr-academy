import { NextRequest, NextResponse } from 'next/server';

/**
 * Test OAuth callback handling
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 OAuth test callback called');
    console.log('URL:', request.url);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    const searchParams = request.nextUrl.searchParams;
    console.log('Query params:', Object.fromEntries(searchParams.entries()));
    
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Test Success</title></head>
        <body style="text-align: center; padding: 50px; font-family: sans-serif;">
          <h2>✅ OAuth Test Callback Working!</h2>
          <p>URL: ${request.url}</p>
          <p>This proves the callback endpoint is functional.</p>
          <script>
            console.log('OAuth test callback success');
            if (window.opener) {
              window.opener.postMessage({ type: 'test_success' }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('OAuth test error:', error);
    return NextResponse.json({ 
      error: 'OAuth test failed', 
      details: String(error) 
    }, { status: 500 });
  }
}

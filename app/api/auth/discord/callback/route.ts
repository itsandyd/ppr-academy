import { NextRequest, NextResponse } from 'next/server';
import { verifyDiscordAuth } from '@/app/actions/coaching-actions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?discord_error=${encodeURIComponent(error)}`
    );
  }

  // Handle missing code
  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?discord_error=missing_code`
    );
  }

  try {
    // Verify Discord authentication
    const result = await verifyDiscordAuth(code);

    if (result.success) {
      // Redirect to dashboard with success message
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?discord_success=true`
      );
    } else {
      // Redirect with error message
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?discord_error=${encodeURIComponent(result.error || 'verification_failed')}`
      );
    }
  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?discord_error=server_error`
    );
  }
} 
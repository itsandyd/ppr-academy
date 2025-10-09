import { NextRequest, NextResponse } from 'next/server';
import { generateAICourse } from '@/app/actions/admin-actions';
import { requireAdmin } from '@/lib/auth-helpers';
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from '@/lib/rate-limit';

// Configure max duration for AI course generation (5 minutes)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require admin authentication
    const user = await requireAdmin();
    
    // ✅ SECURITY: Rate limiting (strict - admin operations)
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }
    
    const courseData = await request.json();
    
    const result = await generateAICourse(courseData);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 
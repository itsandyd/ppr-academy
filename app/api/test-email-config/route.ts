import { verifyEmailConfig } from '@/lib/email';

export async function GET() {
  try {
    const config = await verifyEmailConfig();
    
    const environmentVars = {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing',
      FROM_EMAIL: process.env.FROM_EMAIL || '⚠️ Using default',
      REPLY_TO_EMAIL: process.env.REPLY_TO_EMAIL || '⚠️ Not configured',
    };

    return Response.json({
      success: true,
      configuration: config,
      environmentVariables: environmentVars,
      message: config.configured 
        ? '🎉 Email configuration is ready!' 
        : '⚠️ Please configure RESEND_API_KEY in your environment variables',
      nextSteps: config.configured 
        ? [
            'Test sending an email via POST /api/test-email',
            'Check your Resend dashboard for analytics',
            'Configure your domain for better deliverability'
          ]
        : [
            'Sign up at resend.com',
            'Get your API key from the dashboard',
            'Add RESEND_API_KEY to your .env.local file',
            'Restart your development server'
          ]
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Configuration check failed',
    }, { status: 500 });
  }
} 
import { sendLeadMagnetEmail, sendAdminNotification } from '@/lib/email';

interface TestEmailRequest {
  type: 'lead-magnet' | 'admin-notification';
  testEmail: string;
  customerName?: string;
  leadMagnetTitle?: string;
}

export async function POST(request: Request) {
  try {
    const body: TestEmailRequest = await request.json();
    
    if (!body.testEmail) {
      return Response.json({
        success: false,
        error: 'testEmail is required'
      }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(body.testEmail)) {
      return Response.json({
        success: false,
        error: 'Please provide a valid email address'
      }, { status: 400 });
    }

    let result;

    if (body.type === 'lead-magnet') {
      // Test lead magnet email
      result = await sendLeadMagnetEmail({
        customerName: body.customerName || 'Test User',
        customerEmail: body.testEmail,
        leadMagnetTitle: body.leadMagnetTitle || 'Test Lead Magnet',
        downloadUrl: 'https://example.com/sample-download.pdf',
        adminName: 'Test Admin',
        adminEmail: body.testEmail,
        storeName: 'Test Store'
      });
    } else if (body.type === 'admin-notification') {
      // Test admin notification email
      result = await sendAdminNotification({
        customerName: body.customerName || 'Test Customer',
        customerEmail: 'test-customer@example.com',
        productName: body.leadMagnetTitle || 'Test Lead Magnet',
        source: 'API Test',
        adminName: body.testEmail, // Send to the test email as admin
      });
    } else {
      return Response.json({
        success: false,
        error: 'Invalid email type. Use "lead-magnet" or "admin-notification"'
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      result,
      message: result.simulation 
        ? '📧 Email would be sent (simulation mode - configure RESEND_API_KEY to send real emails)'
        : '✅ Test email sent successfully! Check your inbox (and spam folder).',
      emailType: body.type,
      sentTo: body.testEmail
    });

  } catch (error) {
    console.error('Test email error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email',
      tip: 'Check your RESEND_API_KEY and FROM_EMAIL configuration'
    }, { status: 500 });
  }
}

// GET endpoint to show usage instructions
export async function GET() {
  return Response.json({
    message: 'Email Testing API',
    usage: {
      method: 'POST',
      url: '/api/test-email',
      body: {
        type: '"lead-magnet" | "admin-notification"',
        testEmail: 'your-email@example.com',
        customerName: 'Optional customer name',
        leadMagnetTitle: 'Optional lead magnet title'
      }
    },
    examples: [
      {
        description: 'Test lead magnet email',
        body: {
          type: 'lead-magnet',
          testEmail: 'your-email@example.com',
          customerName: 'John Doe',
          leadMagnetTitle: 'Ultimate Marketing Guide'
        }
      },
      {
        description: 'Test admin notification',
        body: {
          type: 'admin-notification',
          testEmail: 'admin@yourstore.com',
          customerName: 'Jane Smith',
          leadMagnetTitle: 'Free eBook Download'
        }
      }
    ],
    configuration: {
      checkStatus: 'GET /api/test-email-config',
      requiredEnvVars: [
        'RESEND_API_KEY - Your Resend API key',
        'FROM_EMAIL - Email address to send from',
        'REPLY_TO_EMAIL - Optional reply-to address'
      ]
    }
  });
} 
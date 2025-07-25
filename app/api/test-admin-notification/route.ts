import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

interface TestAdminNotificationRequest {
  storeId?: string; // Optional - will use first available store if not provided
  testEmail: string;
  customerName?: string;
  productName?: string;
  source?: string;
}

export async function POST(request: Request) {
  try {
    const body: TestAdminNotificationRequest = await request.json();
    
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

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    let storeId = body.storeId;

    // If no storeId provided, get the first available store for testing
    if (!storeId) {
      try {
        // Get first store from the database for testing
        const stores = await convex.query(api.stores.getStoresByUser, { userId: "test" });
        if (stores && stores.length > 0) {
          storeId = stores[0]._id;
        } else {
          // If no stores exist, we need to create one for testing
          return Response.json({
            success: false,
            error: 'No stores available for testing. Please provide a valid storeId or create a store first.',
            hint: 'You can get store IDs from /store dashboard or create a new store'
          }, { status: 400 });
        }
      } catch (error) {
        // If getting stores fails, we still need a storeId
        return Response.json({
          success: false,
          error: 'Could not find stores for testing. Please provide a specific storeId.',
          hint: 'Visit /store dashboard to get your store ID'
        }, { status: 400 });
      }
    }

    // Test admin notification with Convex
    const result = await convex.action(api.emails.sendNewLeadAdminNotification, {
      storeId: storeId as any,
      customerName: body.customerName || 'Test Customer',
      customerEmail: body.testEmail,
      productName: body.productName || 'Test Lead Magnet',
      source: body.source || 'Admin Notification Test',
    });

    return Response.json({
      success: result.success,
      result,
      message: result.success 
        ? '✅ Admin notification test sent successfully! Check the admin email inbox.'
        : `❌ Test failed: ${result.error}`,
      testDetails: {
        storeId: storeId,
        customerName: body.customerName || 'Test Customer',
        customerEmail: body.testEmail,
        productName: body.productName || 'Test Lead Magnet',
        source: body.source || 'Admin Notification Test',
      }
    });

  } catch (error) {
    console.error('Admin notification test error:', error);
    return Response.json({
      success: false,
      error: 'Failed to test admin notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function GET() {
  try {
    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Get all users to find their stores
    const allStores: any[] = [];
    
    // Try to get stores for common user IDs or get all stores
    // Since we don't have a "get all stores" function, we'll need to handle this differently
    
    return Response.json({
      success: true,
      message: 'To test admin notifications, you need a store ID.',
      instructions: [
        '1. Visit /store dashboard to see your stores',
        '2. Create a store if you don\'t have one',
        '3. Copy the store ID from the dashboard',
        '4. Use it in the test API: POST /api/test-admin-notification',
      ],
      testExample: {
        url: '/api/test-admin-notification',
        method: 'POST',
        body: {
          storeId: 'your-actual-store-id',
          testEmail: 'your-email@example.com',
          customerName: 'Test Customer',
          productName: 'Test Product'
        }
      }
    });

  } catch (error) {
    console.error('Error getting test stores:', error);
    return Response.json({
      success: false,
      error: 'Failed to get stores',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
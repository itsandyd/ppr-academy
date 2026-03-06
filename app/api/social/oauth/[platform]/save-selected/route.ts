import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { encryptToken } from '@/lib/encryption';

/**
 * Saves the user's selected social media account after they choose from multiple options
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, platform, selectedAccount, accessToken } = body;
    const { platform: platformParam } = await params;

    if (!storeId || !selectedAccount || !accessToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let userData: any;

    // Process the selected account based on platform
    if (platform === 'instagram' || platformParam === 'instagram') {

      
      const instagramAccount = selectedAccount.instagram;
      const connectedPage = selectedAccount.page;

      if (!instagramAccount || !connectedPage) {
        console.error('Missing Instagram account or page data:', { instagramAccount: !!instagramAccount, connectedPage: !!connectedPage });
        return NextResponse.json({ error: 'Invalid Instagram account data' }, { status: 400 });
      }

      userData = {
        id: instagramAccount.id,
        username: instagramAccount.username,
        displayName: instagramAccount.name || instagramAccount.username,
        profileImage: instagramAccount.profile_picture_url,
        platformData: {
          instagramBusinessAccountId: instagramAccount.id,
          facebookPageId: connectedPage.id,
          facebookPageAccessToken: connectedPage.access_token,
        },
      };
      
    } else if (platform === 'facebook' || platformParam === 'facebook') {
      const page = selectedAccount;
      const profilePicture = page.picture?.data?.url;

      userData = {
        id: page.id,
        username: page.name,
        displayName: page.name,
        profileImage: profilePicture,
        platformData: {
          facebookPageId: page.id,
          facebookPageAccessToken: page.access_token,
        },
      };
    } else {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    // Store the connection in Convex
    // For Instagram and Facebook, use the Page Access Token (not User Access Token)
    const accessTokenToStore = userData.platformData?.facebookPageAccessToken || accessToken;

    // Encrypt tokens before storing in database
    const encryptedAccessToken = encryptToken(accessTokenToStore);

    // Encrypt facebookPageAccessToken in platformData if present
    const encryptedPlatformData = userData.platformData
      ? {
          ...userData.platformData,
          ...(userData.platformData.facebookPageAccessToken && {
            facebookPageAccessToken: encryptToken(userData.platformData.facebookPageAccessToken),
          }),
        }
      : undefined;

    // Use ConvexHttpClient with explicit Clerk JWT to authenticate the mutation.
    // fetchMutation() without a token runs unauthenticated, causing requireStoreOwner to fail.
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const convexToken = await getToken({ template: "convex" });
    if (convexToken) {
      convex.setAuth(convexToken);
    }

    await convex.mutation(api.socialMedia.connectSocialAccount, {
      storeId,
      userId,
      platform: platform as any,
      platformUserId: userData.id,
      platformUsername: userData.username,
      platformDisplayName: userData.displayName,
      profileImageUrl: userData.profileImage,
      accessToken: encryptedAccessToken,
      refreshToken: undefined,
      tokenExpiresAt: undefined,
      grantedScopes: [],
      platformData: encryptedPlatformData,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save selected account error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


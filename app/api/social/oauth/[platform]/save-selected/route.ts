import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

/**
 * Saves the user's selected social media account after they choose from multiple options
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { userId } = await auth();
    
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
    await fetchMutation(api.socialMedia.connectSocialAccount, {
      storeId,
      userId,
      platform: platform as any,
      platformUserId: userData.id,
      platformUsername: userData.username,
      platformDisplayName: userData.displayName,
      profileImageUrl: userData.profileImage,
      accessToken: accessToken,
      refreshToken: undefined,
      tokenExpiresAt: undefined,
      grantedScopes: [],
      platformData: userData.platformData,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save selected account error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


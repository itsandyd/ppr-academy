import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

/**
 * OAuth callback handler for social media platforms
 * Handles the redirect after user authorizes the app
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/sign-in`
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains storeId
    const error = searchParams.get('error');

    // Await params (Next.js 15 requirement)
    const { platform } = await params;

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/store/${state}/social?social_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/store/${state}/social?social_error=missing_params`
      );
    }
    const storeId = state;

    // Exchange code for access token based on platform
    let tokenData: any;
    let userData: any;

    switch (platform) {
      case 'instagram':
        tokenData = await exchangeFacebookCode(code, platform);
        userData = await getInstagramBusinessData(tokenData.access_token);
        break;
      
      case 'facebook':
        tokenData = await exchangeFacebookCode(code, platform);
        userData = await getFacebookUserData(tokenData.access_token);
        break;
      
      case 'twitter':
        tokenData = await exchangeTwitterCode(code);
        userData = await getTwitterUserData(tokenData.access_token);
        break;
      
      case 'linkedin':
        tokenData = await exchangeLinkedInCode(code);
        userData = await getLinkedInUserData(tokenData.access_token);
        break;
      
      case 'tiktok':
        tokenData = await exchangeTikTokCode(code);
        userData = await getTikTokUserData(tokenData.access_token);
        break;
      
      default:
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeId}/social?social_error=unsupported_platform`
        );
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
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      grantedScopes: tokenData.scope ? tokenData.scope.split(' ') : [],
      platformData: userData.platformData,
    });

    // Check if this is a popup OAuth flow
    const isPopup = request.nextUrl.searchParams.get('display') === 'popup' || 
                   request.headers.get('referer')?.includes('oauth_popup');

    if (isPopup) {
      // Return HTML that closes popup and notifies parent
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>OAuth Success</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'oauth_success', 
                  platform: '${platform}',
                  storeId: '${storeId}' 
                }, '*');
              }
              window.close();
            </script>
            <div style="text-align: center; padding: 50px; font-family: sans-serif;">
              <h2>✅ Connected Successfully!</h2>
              <p>You can close this window.</p>
            </div>
          </body>
        </html>
      `;
      
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      // Traditional redirect for non-popup flow
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeId}/social?social_success=${platform}`
      );
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    console.error('Error details:', error.message, error.stack);
    const storeId = request.nextUrl.searchParams.get('state');
    
    // Check if this is a popup OAuth flow
    const isPopup = request.nextUrl.searchParams.get('display') === 'popup' || 
                   request.headers.get('referer')?.includes('oauth_popup');

    if (isPopup) {
      // Return HTML that closes popup and notifies parent of error
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>OAuth Error</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'oauth_error', 
                  error: '${error.message}',
                  storeId: '${storeId}' 
                }, '*');
              }
              window.close();
            </script>
            <div style="text-align: center; padding: 50px; font-family: sans-serif;">
              <h2>❌ Connection Failed</h2>
              <p>Please try again or contact support.</p>
            </div>
          </body>
        </html>
      `;
      
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      // Traditional redirect for non-popup flow
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeId}/social?social_error=server_error`
      );
    }
  }
}

// ============================================================================
// TOKEN EXCHANGE FUNCTIONS
// ============================================================================

async function exchangeFacebookCode(code: string, platform: string) {
  // Use the correct callback URL based on whether user connected via instagram or facebook
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/oauth/${platform}/callback`;
  
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?${params}`
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Facebook token exchange failed:', errorData);
    throw new Error(`Failed to exchange Facebook code: ${errorData}`);
  }

  return await response.json();
}

async function exchangeTwitterCode(code: string) {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/oauth/twitter/callback`,
      code_verifier: 'challenge', // Should be stored in session
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Twitter code');
  }

  return await response.json();
}

async function exchangeLinkedInCode(code: string) {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/oauth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange LinkedIn code');
  }

  return await response.json();
}

async function exchangeTikTokCode(code: string) {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/oauth/tiktok/callback`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange TikTok code');
  }

  return await response.json();
}

// ============================================================================
// USER DATA FETCH FUNCTIONS
// ============================================================================

async function getInstagramBusinessData(accessToken: string) {
  // Get user's Facebook Pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  );
  const pagesData = await pagesResponse.json();

  console.log('Facebook Pages API Response:', JSON.stringify(pagesData, null, 2));

  // Check for API errors
  if (pagesData.error) {
    console.error('Facebook API Error:', pagesData.error);
    throw new Error(`Facebook API Error: ${pagesData.error.message}`);
  }

  if (!pagesData.data || pagesData.data.length === 0) {
    console.error('No pages found. Full response:', pagesData);
    throw new Error(
      'No Facebook Pages found. You need a Facebook Page to connect Instagram Business. ' +
      'Create a Facebook Page first, then connect your Instagram Business account to it.'
    );
  }

  // Find Instagram Business Accounts connected to these pages
  const instagramAccounts: any[] = [];
  
  for (const page of pagesData.data) {
    // Check if this page has an Instagram Business Account
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${page.access_token}`
    );
    const igData = await igResponse.json();
    
    if (igData.instagram_business_account) {
      instagramAccounts.push({
        instagram: igData.instagram_business_account,
        page: page,
      });
    }
  }

  console.log(`Found ${instagramAccounts.length} Instagram account(s) connected to your Facebook Pages`);

  if (instagramAccounts.length === 0) {
    throw new Error(
      'No Instagram Business Account found. Please connect an Instagram Business account to one of your Facebook Pages.'
    );
  }

  // Use the first Instagram account (users can connect more by clicking "Add Another")
  const { instagram: instagramAccount, page: connectedPage } = instagramAccounts[0];
  
  if (instagramAccounts.length > 1) {
    console.log(`Note: You have ${instagramAccounts.length} Instagram accounts available. To connect additional accounts, click "Add Another" and authorize again.`);
    console.log('Available Instagram accounts:', instagramAccounts.map(a => `@${a.instagram.username} (via ${a.page.name})`).join(', '));
  }

  return {
    id: instagramAccount.id, // Instagram Business Account ID
    username: instagramAccount.username, // Instagram username
    displayName: instagramAccount.name || instagramAccount.username, // Instagram account name
    profileImage: instagramAccount.profile_picture_url,
    platformData: {
      instagramBusinessAccountId: instagramAccount.id,
      facebookPageId: connectedPage.id,
      facebookPageAccessToken: connectedPage.access_token,
    },
  };
}

async function getFacebookUserData(accessToken: string) {
  // Get user's Facebook Pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture&access_token=${accessToken}`
  );
  const pagesData = await pagesResponse.json();

  console.log('Facebook Pages API Response:', JSON.stringify(pagesData, null, 2));

  // Check for API errors
  if (pagesData.error) {
    console.error('Facebook API Error:', pagesData.error);
    throw new Error(`Facebook API Error: ${pagesData.error.message}`);
  }

  if (!pagesData.data || pagesData.data.length === 0) {
    console.error('No Facebook Pages found. Full response:', pagesData);
    throw new Error(
      'No Facebook Pages found. You need a Facebook Page to post as a Page. ' +
      'Create a Facebook Page first to use this feature.'
    );
  }

  console.log(`Found ${pagesData.data.length} Facebook Page(s)`);

  // Use the first Facebook Page (users can connect more by clicking "Add Another")
  const page = pagesData.data[0];
  
  if (pagesData.data.length > 1) {
    console.log(`Note: You have ${pagesData.data.length} Facebook Pages available. To connect additional Pages, click "Add Another" and authorize again.`);
    console.log('Available Facebook Pages:', pagesData.data.map((p: any) => p.name).join(', '));
  }

  // Get page profile picture
  let profilePicture: string | undefined;
  if (page.picture?.data?.url) {
    profilePicture = page.picture.data.url;
  }

  return {
    id: page.id, // Facebook Page ID (not user ID)
    username: page.name, // Facebook Page name
    displayName: page.name, // Facebook Page display name
    profileImage: profilePicture,
    platformData: {
      facebookPageId: page.id,
      facebookPageAccessToken: page.access_token,
    },
  };
}

async function getTwitterUserData(accessToken: string) {
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Twitter user data');
  }

  const data = await response.json();
  const user = data.data;

  return {
    id: user.id,
    username: user.username,
    displayName: user.name,
    profileImage: user.profile_image_url,
    platformData: {},
  };
}

async function getLinkedInUserData(accessToken: string) {
  const response = await fetch('https://api.linkedin.com/v2/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get LinkedIn user data');
  }

  const user = await response.json();

  return {
    id: user.id,
    username: `${user.localizedFirstName} ${user.localizedLastName}`,
    displayName: `${user.localizedFirstName} ${user.localizedLastName}`,
    profileImage: undefined, // Would need separate API call
    platformData: {},
  };
}

async function getTikTokUserData(accessToken: string) {
  const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get TikTok user data');
  }

  const data = await response.json();
  const user = data.data.user;

  return {
    id: user.open_id,
    username: user.display_name,
    displayName: user.display_name,
    profileImage: user.avatar_url,
    platformData: {},
  };
}

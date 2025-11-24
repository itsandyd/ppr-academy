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
        tokenData = await exchangeFacebookCode(code, platform, request.url);
        userData = await getInstagramBusinessData(tokenData.access_token);
        break;
      
      case 'facebook':
        tokenData = await exchangeFacebookCode(code, platform, request.url);
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

    // Check if multiple accounts were found and user needs to select one
    if (userData.id === 'SELECT_ACCOUNT' && userData.platformData?.multipleAccounts) {
      // Redirect to account selection page
      const accounts = userData.platformData.accounts;
      const accessToken = userData.platformData.accessToken;
      
      const selectionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/oauth/${platform}/select-account?` +
        `storeId=${encodeURIComponent(storeId)}&` +
        `userId=${encodeURIComponent(userId)}&` +
        `accessToken=${encodeURIComponent(accessToken)}&` +
        `accounts=${encodeURIComponent(JSON.stringify(accounts))}`;
      
      // Check if this is a popup OAuth flow
      const isPopupCheck = request.nextUrl.searchParams.get('display') === 'popup' || 
                     request.headers.get('referer')?.includes('oauth_popup');

      if (isPopupCheck) {
        // For popup, redirect within the popup
        return NextResponse.redirect(selectionUrl);
      } else {
        return NextResponse.redirect(selectionUrl);
      }
    }

    // Store the connection in Convex (single account flow)
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

async function exchangeFacebookCode(code: string, platform: string, requestUrl: string) {
  // Use the exact same redirect URI that was used in the OAuth request
  // Extract from the current request URL to ensure perfect matching
  const url = new URL(requestUrl);
  const redirectUri = `${url.origin}/api/social/oauth/${platform}/callback`;
  
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

  const tokenData = await response.json();
  console.log('Facebook token exchange successful:', { 
    hasAccessToken: !!tokenData.access_token,
    scope: tokenData.scope 
  });

  // For business OAuth, extract the client_business_id if present
  if (tokenData.access_token) {
    try {
      // Get user info which includes business context
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${tokenData.access_token}&fields=id,name,business`
      );
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('User business info:', userData);
        
        // Store business context if available
        if (userData.business) {
          tokenData.client_business_id = userData.business.id;
          console.log('✅ Business ID found:', userData.business.id);
        }
      }
    } catch (error) {
      console.log('Note: Could not retrieve business context (not necessarily an error)');
    }
  }

  return tokenData;
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
  // First, let's see who is logged in
  const meResponse = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`
  );
  const meData = await meResponse.json();
  console.log('🔍 Logged in Facebook user:', JSON.stringify(meData, null, 2));

  // Get user's Facebook Pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  );
  const pagesData = await pagesResponse.json();

  console.log('📄 Facebook Pages API Response:', JSON.stringify(pagesData, null, 2));
  console.log('📊 Access Token Scopes (first 100 chars):', accessToken.substring(0, 100));

  // Check for API errors
  if (pagesData.error) {
    console.error('❌ Facebook API Error:', pagesData.error);
    throw new Error(`Facebook API Error: ${pagesData.error.message} - You may need to re-authorize with correct permissions.`);
  }

  if (!pagesData.data || pagesData.data.length === 0) {
    console.error('⚠️ No pages found for user:', meData.name, meData.email);
    console.error('⚠️ Full response:', pagesData);
    console.error('⚠️ This could mean:');
    console.error('   1. You are not an Admin of any Facebook Pages');
    console.error('   2. You need to grant page permissions in Facebook');
    console.error('   3. You are logged into the wrong Facebook account');
    throw new Error(
      `No Facebook Pages found for ${meData.name || 'this user'}. ` +
      'You need to be an Admin of a Facebook Page to connect Instagram Business. ' +
      'Make sure you are logged into the correct Facebook account that manages your Pages.'
    );
  }

  // Find Instagram Business Accounts connected to these pages
  const instagramAccounts: any[] = [];
  
  for (const page of pagesData.data) {
    // Check if this page has an Instagram Business Account
    console.log(`Checking Instagram connection for page: ${page.name} (${page.id})`);
    
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${page.access_token}`
    );
    const igData = await igResponse.json();
    
    console.log(`Instagram API response for ${page.name}:`, igData);
    
    if (igData.instagram_business_account) {
      instagramAccounts.push({
        instagram: igData.instagram_business_account,
        page: page,
      });
    } else {
      // Try alternative API approach for Instagram Business Account
      console.log(`No instagram_business_account found via page query. Trying alternative approach...`);
      
      try {
        // Try getting Instagram accounts directly from user
        const userIgResponse = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=accounts{instagram_business_account{id,username,name,profile_picture_url}}&access_token=${accessToken}`
        );
        const userIgData = await userIgResponse.json();
        console.log('User Instagram accounts:', userIgData);
        
        // Also try page-level Instagram endpoint
        const pageIgResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}/instagram_accounts?access_token=${page.access_token}`
        );
        const pageIgData = await pageIgResponse.json();
        console.log(`Page Instagram accounts for ${page.name}:`, pageIgData);
      } catch (altError) {
        console.log('Alternative Instagram query failed:', altError);
      }
    }
  }

  console.log(`Found ${instagramAccounts.length} Instagram account(s) connected to your Facebook Pages`);

  if (instagramAccounts.length === 0) {
    throw new Error(
      'No Instagram Business Account found. Please connect an Instagram Business account to one of your Facebook Pages.'
    );
  }

  // If multiple accounts, return selection data instead of auto-selecting first one
  if (instagramAccounts.length > 1) {
    console.log(`Found ${instagramAccounts.length} Instagram accounts. User will need to select one.`);
    console.log('Available Instagram accounts:', instagramAccounts.map(a => `@${a.instagram.username} (via ${a.page.name})`).join(', '));
    
    // Return special marker to trigger account selection flow
    return {
      id: 'SELECT_ACCOUNT',
      username: 'multiple_accounts',
      displayName: 'Multiple Accounts Available',
      profileImage: null,
      platformData: {
        multipleAccounts: true,
        accounts: instagramAccounts,
        accessToken: accessToken,
      },
    };
  }

  // Single account - auto-connect
  const { instagram: instagramAccount, page: connectedPage } = instagramAccounts[0];

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
  // First, let's see who is logged in
  const meResponse = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`
  );
  const meData = await meResponse.json();
  console.log('🔍 Logged in Facebook user:', JSON.stringify(meData, null, 2));

  // Get user's Facebook Pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture&access_token=${accessToken}`
  );
  const pagesData = await pagesResponse.json();

  console.log('📄 Facebook Pages API Response:', JSON.stringify(pagesData, null, 2));

  // Check for API errors
  if (pagesData.error) {
    console.error('❌ Facebook API Error:', pagesData.error);
    throw new Error(`Facebook API Error: ${pagesData.error.message} - You may need to re-authorize with correct permissions.`);
  }

  if (!pagesData.data || pagesData.data.length === 0) {
    console.error('⚠️ No Facebook Pages found for user:', meData.name, meData.email);
    console.error('⚠️ Full response:', pagesData);
    console.error('⚠️ This could mean:');
    console.error('   1. You are not an Admin of any Facebook Pages');
    console.error('   2. You need to grant page permissions in Facebook');
    console.error('   3. You are logged into the wrong Facebook account');
    throw new Error(
      `No Facebook Pages found for ${meData.name || 'this user'}. ` +
      'You need to be an Admin of a Facebook Page to post as a Page. ' +
      'Make sure you are logged into the correct Facebook account that manages your Pages.'
    );
  }

  console.log(`Found ${pagesData.data.length} Facebook Page(s)`);

  // If multiple pages, return selection data instead of auto-selecting first one
  if (pagesData.data.length > 1) {
    console.log(`Found ${pagesData.data.length} Facebook Pages. User will need to select one.`);
    console.log('Available Facebook Pages:', pagesData.data.map((p: any) => p.name).join(', '));
    
    // Return special marker to trigger account selection flow
    return {
      id: 'SELECT_ACCOUNT',
      username: 'multiple_pages',
      displayName: 'Multiple Pages Available',
      profileImage: null,
      platformData: {
        multipleAccounts: true,
        accounts: pagesData.data,
        accessToken: accessToken,
      },
    };
  }

  // Single page - auto-connect
  const page = pagesData.data[0];

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

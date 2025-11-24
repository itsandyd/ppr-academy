import { NextRequest, NextResponse } from 'next/server';

/**
 * Account selection page for users with multiple Facebook Pages/Instagram accounts
 * Shows all available accounts and lets user choose which one to connect
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const searchParams = request.nextUrl.searchParams;
  const accounts = searchParams.get('accounts');
  const storeId = searchParams.get('storeId');
  const userId = searchParams.get('userId');
  const accessToken = searchParams.get('accessToken');
  const { platform } = await params;

  if (!accounts || !storeId || !userId || !accessToken) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const accountsData = JSON.parse(decodeURIComponent(accounts));

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Select Account to Connect</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
          }
          h1 {
            font-size: 28px;
            margin-bottom: 12px;
            color: #1a202c;
          }
          p {
            color: #718096;
            margin-bottom: 30px;
            font-size: 16px;
            line-height: 1.6;
          }
          .account-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
          }
          .account-card {
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .account-card:hover {
            border-color: #667eea;
            background: #f7fafc;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
          }
          .account-card.selected {
            border-color: #667eea;
            background: #eef2ff;
          }
          .account-image {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
          }
          .account-image-placeholder {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
            flex-shrink: 0;
          }
          .account-info {
            flex: 1;
          }
          .account-name {
            font-weight: 600;
            font-size: 18px;
            color: #1a202c;
            margin-bottom: 4px;
          }
          .account-username {
            color: #718096;
            font-size: 14px;
          }
          .page-badge {
            font-size: 12px;
            color: #667eea;
            background: #eef2ff;
            padding: 4px 8px;
            border-radius: 4px;
            margin-top: 4px;
            display: inline-block;
          }
          .button-group {
            display: flex;
            gap: 12px;
            margin-top: 24px;
          }
          button {
            flex: 1;
            padding: 14px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }
          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .btn-secondary {
            background: #e2e8f0;
            color: #4a5568;
          }
          .btn-secondary:hover {
            background: #cbd5e0;
          }
          .loading {
            display: none;
            text-align: center;
            padding: 40px;
          }
          .loading.active {
            display: block;
          }
          .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="selection-view">
            <h1>🎯 Select Account to Connect</h1>
            <p>
              You have multiple ${platform === 'instagram' ? 'Instagram' : 'Facebook'} accounts. 
              Choose which one you'd like to connect to your store:
            </p>
            
            <div class="account-list" id="accountList">
              ${accountsData.map((acc, index) => {
                const account = platform === 'instagram' ? acc.instagram : acc;
                const page = acc.page;
                const displayName = account.name || account.username;
                const username = account.username;
                const profileImage = account.profile_picture_url || (page && page.picture && page.picture.data && page.picture.data.url);
                const initials = displayName ? displayName.substring(0, 2).toUpperCase() : '??';
                
                return `
                  <div class="account-card" data-index="${index}" onclick="selectAccount(${index})">
                    ${profileImage 
                      ? `<img src="${profileImage}" alt="${displayName}" class="account-image" />`
                      : `<div class="account-image-placeholder">${initials}</div>`
                    }
                    <div class="account-info">
                      <div class="account-name">${displayName}</div>
                      ${username ? `<div class="account-username">@${username}</div>` : ''}
                      ${page ? `<div class="page-badge">via ${page.name}</div>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="button-group">
              <button type="button" class="btn-secondary" onclick="cancel()">
                Cancel
              </button>
              <button type="button" class="btn-primary" id="connectBtn" onclick="connect()" disabled>
                Connect Selected Account
              </button>
            </div>
          </div>

          <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Connecting your account...</p>
          </div>
        </div>

        <script>
          let selectedIndex = null;
          const accounts = ${JSON.stringify(accountsData)};
          const platform = '${platform}';
          const storeId = '${storeId}';
          const userId = '${userId}';
          const accessToken = '${accessToken}';

          function selectAccount(index) {
            selectedIndex = index;
            
            // Update UI
            document.querySelectorAll('.account-card').forEach((card, i) => {
              if (i === index) {
                card.classList.add('selected');
              } else {
                card.classList.remove('selected');
              }
            });
            
            // Enable connect button
            document.getElementById('connectBtn').disabled = false;
          }

          async function connect() {
            if (selectedIndex === null) return;
            
            // Show loading
            document.getElementById('selection-view').style.display = 'none';
            document.getElementById('loading').classList.add('active');

            try {
              const selectedAccount = accounts[selectedIndex];
              
              // Call API to save this specific account
              const response = await fetch('/api/social/oauth/${platform}/save-selected', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  storeId,
                  userId,
                  platform,
                  selectedAccount,
                  accessToken,
                }),
              });

              if (response.ok) {
                // Notify parent window and close
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'oauth_success', 
                    platform: platform,
                    storeId: storeId 
                  }, '*');
                }
                
                // Show success message briefly before closing
                document.querySelector('.loading p').textContent = '✅ Connected successfully!';
                setTimeout(() => {
                  window.close();
                }, 1500);
              } else {
                throw new Error('Failed to connect account');
              }
            } catch (error) {
              console.error('Connection error:', error);
              alert('Failed to connect account. Please try again.');
              document.getElementById('selection-view').style.display = 'block';
              document.getElementById('loading').classList.remove('active');
            }
          }

          function cancel() {
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'oauth_cancelled',
                platform: platform 
              }, '*');
            }
            window.close();
          }

          // Auto-select if only one account (shouldn't happen, but just in case)
          if (accounts.length === 1) {
            selectAccount(0);
          }
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}


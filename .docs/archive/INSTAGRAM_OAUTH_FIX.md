# Instagram OAuth Fix - Proper Business Account Handling

## 🐛 Problem

When users authorized Instagram, the system was saving their **Facebook profile data** (name, Facebook ID, Facebook profile picture) instead of their **Instagram Business Account data** (Instagram username, Instagram ID, Instagram profile picture).

### Why This Happened

Instagram doesn't have direct OAuth - you must authenticate via Facebook first, then access Instagram Business accounts that are connected to Facebook Pages.

**Incorrect Flow (Before):**
```
1. User authenticates with Facebook
2. System saves Facebook profile data ❌
   - Username: "Andrew Dysart" (Facebook name)
   - ID: Facebook User ID
   - Profile Pic: Facebook profile picture
```

**Correct Flow (After):**
```
1. User authenticates with Facebook
2. System fetches user's Facebook Pages
3. For each page, check if Instagram Business account is connected
4. Fetch Instagram account details ✅
   - Username: "@your_instagram_username"
   - ID: Instagram Business Account ID
   - Profile Pic: Instagram profile picture
```

---

## ✅ Solution

### 1. Created New Function: `getInstagramBusinessData()`

**Location:** `app/api/social/oauth/[platform]/callback/route.ts`

This function:
- Fetches all Facebook Pages the user manages
- For each page, checks if it has an Instagram Business account
- Fetches the **actual Instagram account details**:
  - `id`: Instagram Business Account ID
  - `username`: Instagram username (e.g., "@andrew")
  - `name`: Instagram display name
  - `profile_picture_url`: Instagram profile picture
- Returns Instagram data (not Facebook data)

**API Call Used:**
```javascript
https://graph.facebook.com/v18.0/{pageId}?fields=instagram_business_account{id,username,name,profile_picture_url}
```

### 2. Updated OAuth Route Handler

**Before:**
```javascript
case 'instagram':
case 'facebook':
  tokenData = await exchangeFacebookCode(code, platform);
  userData = await getFacebookUserData(tokenData.access_token);
  break;
```

**After:**
```javascript
case 'instagram':
  tokenData = await exchangeFacebookCode(code, platform);
  userData = await getInstagramBusinessData(tokenData.access_token); // ✅ Instagram-specific
  break;

case 'facebook':
  tokenData = await exchangeFacebookCode(code, platform);
  userData = await getFacebookUserData(tokenData.access_token); // ✅ Facebook-specific
  break;
```

### 3. Added Required OAuth Scope

Added `pages_show_list` to Instagram OAuth scopes to access the user's Facebook Pages:

```javascript
scope=instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_posts,pages_show_list
```

---

## 🔑 Key Changes

### Data Saved to Database

**Before (Incorrect):**
```javascript
{
  platform: "instagram",
  platformUserId: "123456789", // Facebook ID ❌
  platformUsername: "Andrew Dysart", // Facebook name ❌
  profileImageUrl: "https://facebook.com/..." // Facebook pic ❌
}
```

**After (Correct):**
```javascript
{
  platform: "instagram",
  platformUserId: "17841123456789", // Instagram Business ID ✅
  platformUsername: "andrew_dysart", // Instagram username ✅
  profileImageUrl: "https://instagram.com/..." // Instagram pic ✅
  platformData: {
    instagramBusinessAccountId: "17841123456789",
    facebookPageId: "109876543210",
    facebookPageAccessToken: "EAAx..."
  }
}
```

---

## 📋 Requirements for Instagram Connection

For users to successfully connect Instagram, they need:

1. ✅ **A Facebook account** (for authentication)
2. ✅ **A Facebook Page** they manage
3. ✅ **An Instagram Business or Creator account**
4. ✅ **Instagram account connected to the Facebook Page**

### Error Messages

If requirements aren't met, users will see helpful error messages:

- **No Facebook Pages:** "No Facebook Pages found. You need a Facebook Page to connect Instagram."
- **No Instagram Account:** "No Instagram Business Account found. Please connect an Instagram Business account to one of your Facebook Pages."

---

## 🚀 How It Works Now

### User Flow

1. **User clicks "Connect Instagram"**
2. **Redirects to Facebook OAuth**
3. **User authorizes with Facebook** (personal profile)
4. **System fetches user's Facebook Pages**
5. **System checks each page for Instagram Business account**
6. **System fetches Instagram account details**
7. **Saves Instagram data to database** ✅
8. **User sees their Instagram username in the UI** ✅

### For Multiple Instagram Accounts

If a user has multiple Instagram Business accounts (connected to different Facebook Pages):
- **Current behavior:** System connects the first Instagram account found
- **Future improvement:** Add a selection UI to let users choose which account to connect

---

## 🔧 Technical Details

### Instagram Graph API Fields

**Page → Instagram Business Account:**
```
GET /{page-id}?fields=instagram_business_account
```

**Instagram Account Details:**
```
GET /{page-id}?fields=instagram_business_account{id,username,name,profile_picture_url}
```

### Response Structure

```json
{
  "instagram_business_account": {
    "id": "17841123456789",
    "username": "andrew_dysart",
    "name": "Andrew Dysart",
    "profile_picture_url": "https://..."
  },
  "id": "109876543210"
}
```

---

## ✅ Testing Checklist

Before re-connecting Instagram:

1. **Disconnect existing connection** (if any)
   - Go to Social Media page
   - Click "Manage" on Instagram
   - Click "Delete Account Permanently"

2. **Re-connect Instagram**
   - Click "Connect Instagram"
   - Authorize with Facebook
   - Should redirect back successfully

3. **Verify correct data saved**
   - Username should be Instagram username (e.g., "@andrew_dysart")
   - NOT Facebook name (e.g., "Andrew Dysart")
   - Profile picture should be Instagram profile picture

4. **Check Convex database**
   - Go to Convex Dashboard → Data → socialAccounts
   - Verify `platformUsername` is Instagram username
   - Verify `platformUserId` is Instagram Business Account ID

---

## 🎯 What's Next

### Future Enhancements

1. **Multi-Account Selection UI**
   - If user has multiple Instagram accounts, show a selection page
   - Let them choose which one to connect
   - Support connecting multiple Instagram accounts

2. **Account Verification**
   - Periodically verify Instagram connection is still valid
   - Auto-refresh tokens before they expire
   - Notify user if connection breaks

3. **Better Error Handling**
   - If Instagram account becomes disconnected, show clear message
   - Provide "Reconnect" button in UI
   - Log detailed error messages for debugging

---

## 📚 References

- [Instagram Graph API - Business Discovery](https://developers.facebook.com/docs/instagram-api/reference/ig-user)
- [Facebook Pages API](https://developers.facebook.com/docs/graph-api/reference/page/)
- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)

---

## ✅ Summary

**Problem:** Saving Facebook profile data instead of Instagram account data  
**Solution:** Created separate `getInstagramBusinessData()` function that fetches actual Instagram Business Account details  
**Result:** Instagram username, ID, and profile picture are now correctly saved and displayed  

Users will now see their actual Instagram username (e.g., "@andrew_dysart") instead of their Facebook name (e.g., "Andrew Dysart")! 🎉

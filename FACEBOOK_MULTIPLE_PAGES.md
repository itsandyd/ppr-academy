# Facebook Multiple Pages Support

## ✅ What Changed

Facebook connections now work the same way as Instagram - supporting **multiple Facebook Pages** as separate connections!

---

## 🔧 Before vs After

### Before (Incorrect ❌)

When connecting Facebook:
```javascript
{
  id: "123456789", // User's personal Facebook ID
  username: "John Smith", // User's personal name
  profileImage: "..." // User's personal profile pic
}
```

**Problem:** 
- Saved personal profile data
- Could only connect one "Facebook account"
- Couldn't post to specific Pages

### After (Correct ✅)

When connecting Facebook:
```javascript
{
  id: "109876543210", // Facebook Page ID
  username: "My Business Page", // Facebook Page name
  profileImage: "..." // Facebook Page profile pic
  platformData: {
    facebookPageId: "109876543210",
    facebookPageAccessToken: "EAAx..."
  }
}
```

**Benefits:**
- Saves Facebook Page data (not personal profile)
- Can connect multiple Pages as separate accounts
- Each Page has its own posting capabilities

---

## 🎯 How Multiple Facebook Pages Work

### Each Page is a Separate Connection

If you manage 3 Facebook Pages:
1. **Connect first Page** → Click "Connect Facebook"
2. **Connect second Page** → Click "Add Another"
3. **Connect third Page** → Click "Add Another"

### What You'll See

```
┌─────────────────────────────────┐
│ 📘 Facebook                     │
│ 3 accounts connected ✅         │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ My Business Page            │ │
│ │ Business                    │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Client Company              │ │
│ │ Client A                    │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Personal Brand              │ │
│ │ Personal                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Add Another] [Manage]          │
└─────────────────────────────────┘
```

---

## 📋 Technical Details

### What's Fetched

```javascript
GET /me/accounts?fields=id,name,access_token,picture
```

Returns all Facebook Pages you manage:
```json
{
  "data": [
    {
      "id": "109876543210",
      "name": "My Business Page",
      "access_token": "EAAx...",
      "picture": { "data": { "url": "..." } }
    },
    {
      "id": "109876543211",
      "name": "Another Page",
      "access_token": "EAAx...",
      "picture": { "data": { "url": "..." } }
    }
  ]
}
```

### Database Storage

Each Facebook Page is stored separately:

**First Page:**
```javascript
{
  platform: "facebook",
  platformUserId: "109876543210", // Page ID
  platformUsername: "My Business Page",
  platformData: {
    facebookPageId: "109876543210",
    facebookPageAccessToken: "EAAx..."
  }
}
```

**Second Page:**
```javascript
{
  platform: "facebook",
  platformUserId: "109876543211", // Different Page ID
  platformUsername: "Another Page",
  platformData: {
    facebookPageId: "109876543211",
    facebookPageAccessToken: "EAAx..."
  }
}
```

The `by_store_platform_user` index prevents duplicates:
- Same store + same platform + same `platformUserId` = Update existing
- Different `platformUserId` = New connection

---

## 🔍 Terminal Logs

When connecting Facebook, you'll see:

```
Facebook Pages API Response: {
  "data": [
    { "id": "...", "name": "My Business Page" },
    { "id": "...", "name": "Another Page" }
  ]
}

Found 2 Facebook Page(s)

Note: You have 2 Facebook Pages available. 
To connect additional Pages, click "Add Another" and authorize again.

Available Facebook Pages: My Business Page, Another Page
```

---

## 🚀 Use Cases

### 1. Business with Multiple Pages

```
Main Brand Page → Official company updates
Product Line A Page → Product-specific content
Product Line B Page → Different product content
```

### 2. Agency Managing Clients

```
Client A Page → Client A's Facebook content
Client B Page → Client B's Facebook content
Client C Page → Client C's Facebook content
```

### 3. Personal Brand + Business

```
Personal Page → Personal content
Business Page → Business updates
Side Project Page → Side project content
```

---

## ⚠️ Requirements

To connect Facebook Pages:

1. ✅ You must **manage** the Facebook Page (Admin, Editor, or Moderator)
2. ✅ Page must exist (not just your personal profile)
3. ✅ Correct permissions granted during OAuth

---

## 🎯 How to Connect Multiple Pages

### Step 1: Connect First Page

1. Go to **Social Media** page
2. Click **"Connect Facebook"**
3. Authorize with Facebook
4. During OAuth, select all Pages you want to use
5. First Page is connected ✅

### Step 2: Connect Additional Pages

1. Click **"Add Another"** on Facebook card
2. Click **"Connect Facebook"** again
3. Authorize (you may need to select Pages again)
4. Second Page is connected ✅

### Step 3: Repeat

Keep clicking "Add Another" to connect more Pages.

---

## ✅ Benefits

### For Users

✅ **Manage multiple Pages** from one dashboard
✅ **Post to specific Pages** individually
✅ **Track performance** per Page
✅ **Separate content strategies** for different Pages
✅ **No switching** between accounts

### For Platform

✅ **Proper Page-based posting** (not personal profile)
✅ **Scalable** to unlimited Pages
✅ **No duplicates** (indexed by Page ID)
✅ **Independent token management** per Page

---

## 🔄 Posting to Facebook Pages

When creating a scheduled post:

1. **Select platform**: Facebook
2. **Choose Page**: Dropdown shows all connected Pages
   - "My Business Page"
   - "Another Page"
   - "Client Page"
3. **Add content and schedule**
4. Post publishes to **that specific Page**

---

## 📊 Comparison: Personal vs Page Posting

### Personal Profile Posting ❌
- Limited API access
- Can't schedule posts
- No advanced features
- Against Facebook ToS for apps

### Page Posting ✅
- Full API access
- Can schedule posts
- Advanced features (targeting, insights)
- Proper way for apps to post

**That's why we use Page IDs!**

---

## 🆘 Troubleshooting

### "No Facebook Pages found"

**Cause:** You don't manage any Facebook Pages
**Solution:** 
1. Create a Facebook Page: [facebook.com/pages/create](https://facebook.com/pages/create)
2. Or request Admin/Editor access to an existing Page

### "Connected wrong Page"

**Solution:**
1. Click "Manage" on that connection
2. Click "Delete Account Permanently"
3. Connect again and select the correct Page during OAuth

### "Can't see all my Pages"

**Solution:**
- During OAuth, make sure you select ALL Pages
- You must be Admin, Editor, or Moderator (not just a follower)
- Check that `business_management` permission is granted

---

## ✅ Summary

**Before:** Connected personal Facebook profile ❌
**After:** Connect multiple Facebook Pages ✅

**How it works:**
1. Each Facebook Page = One connection
2. Click "Add Another" to connect more Pages
3. Each Page posts independently
4. Proper Page-based posting with full API features

**Your Facebook integration now works exactly like Instagram!** 🎉

---

## 📚 Related Documentation

- `MULTIPLE_INSTAGRAM_ACCOUNTS.md` - Same pattern for Instagram
- `SOCIAL_MEDIA_MULTIPLE_ACCOUNTS.md` - General multi-account support
- `INSTAGRAM_OAUTH_FIX.md` - OAuth implementation details

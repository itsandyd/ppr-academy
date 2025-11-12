# Instagram Connection Troubleshooting

## 🚨 Error: "No Facebook Pages found"

This error means your Facebook account doesn't have any Pages, or the app doesn't have permission to see them.

---

## ✅ Solution: Create a Facebook Page

### Step 1: Check if You Have Pages

1. Go to [facebook.com](https://facebook.com)
2. Click the **menu icon** (☰) in the top right
3. Click **"Pages"**
4. See if any pages are listed

If you see pages listed, skip to **Step 3** below.

### Step 2: Create a Facebook Page (if you don't have one)

1. Go to [facebook.com/pages/create](https://facebook.com/pages/create)
2. Click **"Get Started"**
3. Choose a page type:
   - **Business or Brand** (recommended for most users)
   - **Community or Public Figure**
4. Fill in page details:
   - **Page name**: Your business/brand name (e.g., "PPR Academy")
   - **Category**: Choose relevant category
   - **Bio**: Brief description
5. Click **"Create Page"**
6. Upload profile picture and cover photo (optional)

### Step 3: Connect Instagram to Your Facebook Page

Now you need to link your Instagram account to the Facebook Page:

#### Option A: Via Instagram App (Recommended)

1. **Open Instagram app** on your phone
2. Go to your **profile**
3. Tap the **menu (☰)** → **Settings and Privacy**
4. Tap **"Account type and tools"**
5. Tap **"Switch to professional account"** (if not already)
   - Choose **"Business"** or **"Creator"**
6. After switching, go back to **Settings**
7. Tap **"Account Center"** → **"Accounts"**
8. Tap **"Add accounts"**
9. Select **Facebook**
10. Log in with your Facebook account
11. Select the **Facebook Page** you want to link
12. Confirm the connection

#### Option B: Via Facebook Page Settings

1. Go to your **Facebook Page**
2. Click **"Settings"** in the left sidebar
3. Click **"Instagram"** in the left menu
4. Click **"Connect Account"**
5. Enter your Instagram username and password
6. Click **"Confirm"**

---

## 🔧 Verify Instagram is Connected

After connecting Instagram to your Page:

1. Go to your **Facebook Page**
2. Click **"Settings"** → **"Instagram"**
3. You should see: **"Connected: @your_instagram_username"**

---

## 🎯 Now Try Connecting Again

1. **Go back to PPR Academy**
2. Navigate to **Social Media** page
3. Click **"Connect Instagram"**
4. Authorize with Facebook
5. **It should now work!** ✅

---

## 🔍 Additional Debugging

If you're still getting errors, check the **terminal logs** for:

```
Facebook Pages API Response: {...}
```

This will show what Facebook is actually returning.

### Common Issues

#### Issue 1: "OAuth Error: Invalid Scopes"
**Solution:** Make sure these permissions are added in Facebook Developer Console:
- `instagram_basic`
- `instagram_content_publish`
- `pages_read_engagement`
- `pages_manage_posts`
- `pages_show_list`

#### Issue 2: "You don't have permission to access this page"
**Solution:** You must be an **admin** or **editor** of the Facebook Page, not just a follower.

#### Issue 3: "Instagram account not found"
**Solution:** Your Instagram account must be a **Business** or **Creator** account, not a personal account.

---

## 📋 Requirements Checklist

For Instagram connection to work, you need ALL of these:

- [ ] **Facebook account** (personal profile)
- [ ] **Facebook Page** that you manage
- [ ] **Instagram Business or Creator account**
- [ ] **Instagram connected to the Facebook Page**
- [ ] **Admin or Editor role** on the Facebook Page

---

## 🆘 Still Not Working?

If you've followed all steps and it's still not working:

1. **Check terminal logs** for detailed error messages
2. **Try disconnecting and reconnecting** Instagram from Facebook Page
3. **Wait 5-10 minutes** after creating a new Page (Facebook needs time to sync)
4. **Use a different Facebook Page** (if you have multiple)

---

## 🎓 Learn More

- [Instagram Business Account Setup](https://help.instagram.com/502981923235522)
- [Connect Instagram to Facebook Page](https://www.facebook.com/business/help/898752960195806)
- [Facebook Pages Help](https://www.facebook.com/help/104002523024878)

---

## ✅ Success!

Once you've:
1. ✅ Created a Facebook Page
2. ✅ Connected Instagram to that Page
3. ✅ Reconnected in PPR Academy

You should see your **Instagram username** displayed correctly! 🎉

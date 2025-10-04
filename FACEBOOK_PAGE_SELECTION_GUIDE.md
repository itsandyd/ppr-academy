# Facebook Page Selection Guide

## 🎯 How to Select Your Facebook Page (Not Personal Profile)

When connecting Facebook, you'll see an OAuth dialog. Here's what to look for:

---

## ✅ Step-by-Step: What You'll See

### 1. **Login Screen**
```
Log in to use your Facebook account with PPR Academy
[Continue as Your Name]
```
→ Click "Continue"

### 2. **Permission Request Screen**

You should see something like:

```
PPR Academy wants to access your Facebook account

✓ Manage your Pages
✓ Create content on Pages you manage
✓ Read engagement on Pages you manage

[Choose what PPR Academy can access and see]
```

**IMPORTANT:** Click **"Choose what PPR Academy can access and see"** or **"Edit Settings"**

### 3. **Page Selection Screen** ⭐ THIS IS KEY

You should now see:

```
Pages
Select the Pages you want PPR Academy to access

☐ Your Personal Profile (DO NOT SELECT THIS!)
☑ My Business Page
☑ Client Company Page
☑ Another Business Page

[x] pages selected
```

**Critical Steps:**
1. ✅ **CHECK the Pages** you want to use
2. ❌ **UNCHECK "Your Personal Profile"** if it appears
3. ✅ Make sure **ONLY Pages** are selected

### 4. **Confirmation**
```
[Cancel]  [Done]
```
→ Click "Done"

---

## 🚨 Common Mistakes

### Mistake 1: Selecting Personal Profile
```
☑ Your Personal Profile ❌ DON'T SELECT THIS
☐ My Business Page
```
**Result:** App connects to your personal profile (wrong!)

### Mistake 2: Not Seeing Page Selection
```
[Continue] ← Just clicking without checking permissions
```
**Result:** Default selections applied (might be personal profile)

### Solution: Always Click "Edit Settings" or "Choose what to access"

---

## 🔧 If You Don't See Your Pages

### Scenario 1: "No Pages Listed"

**Possible Causes:**
- You don't manage any Facebook Pages
- You're not an Admin/Editor of the Pages
- Pages haven't loaded yet

**Solutions:**
1. **Create a Facebook Page:**
   - Go to [facebook.com/pages/create](https://facebook.com/pages/create)
   - Create a Page for your business

2. **Check your Page roles:**
   - Go to your Facebook Page
   - Click "Settings" → "Page roles"
   - Make sure you're "Admin" or "Editor"

3. **Try again:**
   - Disconnect and reconnect
   - Wait for Pages to load fully

### Scenario 2: "Pages Not Showing in OAuth"

**Cause:** Permissions not configured correctly

**Solution:**
1. **Revoke app permissions** first:
   - Go to [facebook.com/settings?tab=business_tools](https://facebook.com/settings?tab=business_tools)
   - Find "PPR Academy"
   - Click "Remove"

2. **Try connecting again:**
   - This forces Facebook to show all permissions from scratch
   - Make sure to select your Pages this time

---

## 🎯 What Should Happen After Correct Selection

### Correct Flow:
```
1. You select: "My Business Page" ✅
2. App connects to: "My Business Page" ✅
3. Database saves: Page ID, Page Name, Page Token ✅
4. You see in UI: "My Business Page" ✅
```

### Incorrect Flow (What's Happening Now):
```
1. Personal profile selected by default ❌
2. App connects to: Personal profile ❌
3. Database saves: Personal name, Personal ID ❌
4. You see in UI: "Your Name" (not Page name) ❌
```

---

## 🔍 How to Verify Correct Connection

After connecting, check the Social Media page:

### ✅ Correct (Page Connected):
```
📘 Facebook
1 account connected

┌─────────────────────────┐
│ My Business Page        │ ← Page name, not your name
│ Business                │
└─────────────────────────┘
```

### ❌ Incorrect (Personal Profile Connected):
```
📘 Facebook
1 account connected

┌─────────────────────────┐
│ John Smith              │ ← Your personal name (WRONG!)
│                         │
└─────────────────────────┘
```

If you see your personal name → **Wrong! Disconnect and try again**

---

## 🔄 How to Fix Wrong Connection

### Step 1: Disconnect Current Connection
1. Click **"Manage"** on Facebook card
2. Click **"Delete Account Permanently"**
3. Confirm deletion

### Step 2: Revoke App Access in Facebook
1. Go to [facebook.com/settings?tab=business_tools](https://facebook.com/settings?tab=business_tools)
2. Find **"PPR Academy"**
3. Click **"Remove"**
4. Confirm removal

### Step 3: Connect Again (Carefully!)
1. **Refresh your browser** (loads updated OAuth code)
2. Click **"Connect Facebook"**
3. During OAuth:
   - Click **"Edit Settings"** or **"Choose what to access"**
   - **UNCHECK personal profile**
   - **CHECK your Facebook Pages**
4. Click **"Done"** → **"Continue"**

---

## 📋 OAuth Dialog Checklist

When you see the Facebook OAuth dialog:

- [ ] Click "Edit Settings" or "Choose what to access"
- [ ] See a list of Pages (not just "Continue" button)
- [ ] UNCHECK personal profile (if listed)
- [ ] CHECK the Page(s) you want to use
- [ ] Verify "Pages" is selected at the top (not "Profile")
- [ ] Click "Done" → "Continue"
- [ ] After redirect, see Page name (not personal name)

---

## 💡 Pro Tips

### Tip 1: Multiple Pages
If you manage multiple Pages, you can select them all during one OAuth:
```
☑ Page A
☑ Page B
☑ Page C
```
Then connect each one separately by clicking "Add Another"

### Tip 2: Different Permissions
Make sure these permissions are granted:
- ✅ Manage your Pages
- ✅ Create content
- ✅ Read engagement
- ❌ Don't need personal profile access

### Tip 3: Test First
After connecting, test by:
1. Click "Manage" on the Facebook card
2. Check the username shown
3. Should be Page name, not your personal name

---

## 🆘 Still Connecting Personal Profile?

If you've followed all steps and it's still connecting to your personal profile:

**Check the terminal logs:**
```
Facebook Pages API Response: {
  "data": [
    {
      "id": "109876543210",
      "name": "My Business Page" ← Should see Page names here
    }
  ]
}

Found 1 Facebook Page(s)
```

If you see Page names in logs but personal name in UI → **Share logs with me for debugging**

---

## ✅ Success Criteria

You've successfully connected a Facebook Page when:

✅ OAuth dialog showed Page selection
✅ You selected a specific Page (not personal profile)
✅ Database saved Page ID (not personal ID)
✅ UI shows Page name (not your name)
✅ Terminal logs show "Found X Facebook Page(s)"

**Now your Facebook integration is correctly set up for Page posting!** 🎉

---

## 📚 Why Pages Matter

### Personal Profile Posting ❌
- Against Facebook API ToS
- Can't schedule posts via API
- Limited features
- Will fail

### Page Posting ✅
- Proper API access
- Can schedule posts
- Full features (targeting, insights)
- Supported by Facebook

**Always post as a Page, never as personal profile!**

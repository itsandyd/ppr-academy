# Debug: "No Instagram posts found"

## 🔍 What to Check

I've added a **debug panel** at the top of your DM Automation tab. It shows:

```
🔍 Debug Info
├─ Convex User ID: jxxx... 
├─ Instagram Connected: ✓ Yes / ✗ No
├─ Username: @pauseplayrepeat
├─ Instagram ID: 1234567890
├─ Token: EAABw...*** (first 20 chars)
├─ Active: Yes
└─ Expires: Dec 19, 2025
```

---

## ✅ **What the Debug Panel Tells You**

### **Scenario 1: Instagram Connected = No**

```
Instagram Connected: ✗ No
```

**Meaning:** OAuth didn't save the integration to database

**Fix:** 
1. Try connecting again
2. Check Convex logs during OAuth: https://dashboard.convex.dev/d/fastidious-snake-859
3. Look for errors in `handleOAuthCallback` function

---

### **Scenario 2: Instagram Connected = Yes, but No Posts**

```
Instagram Connected: ✓ Yes
Username: @pauseplayrepeat
Instagram ID: 1234567890
Token: EAABw...***
```

**Meaning:** Integration saved, but API call to get posts is failing

**Possible causes:**

#### **Cause A: No Posts on Instagram Account**

Check: Does your Instagram account have published posts?
- Go to: https://instagram.com/pauseplayrepeat
- If no posts → Post something first!

#### **Cause B: Wrong Instagram Account ID**

The OAuth flow gets the Instagram Business Account ID from your Facebook Page.

**Check:**
1. Is your Instagram account linked to the Facebook Page?
2. Is it a Business/Creator account (not personal)?

**How to verify:**
- Facebook Page → Settings → Instagram
- Should show: "Connected to @pauseplayrepeat"

#### **Cause C: Token Permissions Issue**

The token might not have the right permissions.

**Check Convex logs:**
1. Go to: https://dashboard.convex.dev/d/fastidious-snake-859
2. Look for: `getUserPosts` function calls
3. Check the error message

**Common errors:**
```
(#100) Tried accessing nonexisting field (media)
→ Solution: Instagram account has no posts

(#200) Permissions error
→ Solution: Reconnect with all permissions granted

(#803) Some of the aliases you requested do not exist
→ Solution: Use Business Account ID, not User ID
```

---

## 🔧 **Quick Fixes**

### **Fix 1: Reconnect Instagram**

If the debug panel shows connected but you still have issues:

1. We need to add a "Disconnect" button first (currently not built)
2. For now, manually clear from Convex dashboard:
   - Go to: https://dashboard.convex.dev/d/fastidious-snake-859
   - Click: Data → integrations table
   - Delete your integration row
   - Reconnect via UI

### **Fix 2: Check Facebook Page Link**

**From Facebook:**
1. Go to your Facebook Page
2. Settings → Linked accounts → Instagram
3. Should show your Instagram connected
4. If not, click "Connect" and link it

**From Instagram:**
1. Instagram app → Settings → Account
2. Linked accounts → Facebook  
3. Should show connected to your Facebook Page
4. If not, connect it

### **Fix 3: Verify Account Type**

Instagram → Settings → Account → Account type

Must be:
- ✅ Business account
- ✅ Creator account
- ❌ NOT Personal account

**To convert:**
- Settings → Account → Switch to Professional Account
- Choose "Business" or "Creator"

---

## 🧪 **Test the Debug Panel**

### **Step 1: Reload Page**

```
Go to: /store/kh78hrngdvmxbqy6g6w4faecpd7m63ra/social
Click: DM Automation tab
```

### **Step 2: Check Debug Panel**

Look at the yellow debug card at the top. It should show:

**If OAuth worked:**
```
✓ Instagram Connected: Yes
✓ Username: @pauseplayrepeat
✓ Instagram ID: [some number]
✓ Token: EAABw... (truncated)
✓ Active: Yes
```

**If OAuth didn't work:**
```
✗ Instagram Connected: No
"No integration found in database. Try reconnecting Instagram."
```

### **Step 3: Check Browser Console**

Open browser console (F12) and look for:

```
📡 Fetching Instagram posts for user: jxxx...
📥 Fetch result: { status: 200, data: [...] }
✅ Loaded Instagram posts: 10
```

**Or errors:**
```
❌ No integration found for user: jxxx...
❌ Instagram API error: { error: { message: "...", code: 100 } }
```

---

## 📊 **What the Logs Tell You**

### **In Convex Dashboard:**

Go to: https://dashboard.convex.dev/d/fastidious-snake-859 → Logs

**Successful post fetch:**
```
✅ Integration found. Instagram ID: 17841461234567890
📡 Fetching Instagram posts from: https://graph.facebook.com/v21.0/17841461234567890/media?fields=...
✅ Instagram posts fetched: 10
```

**Failed - No integration:**
```
❌ No integration found for user: jxxx...
```
→ OAuth didn't save. Try reconnecting.

**Failed - API error:**
```
❌ Instagram API error: {
  "error": {
    "message": "Unsupported get request",
    "code": 100
  }
}
```
→ Wrong endpoint or permissions

---

## 🎯 **Most Likely Issue**

Based on "No Instagram posts found" error, one of these is true:

1. ❌ **Integration not saved** → Debug panel shows "Instagram Connected: No"
2. ❌ **Instagram account has no posts** → Post something on Instagram first
3. ❌ **Wrong account linked** → Facebook Page linked to different Instagram
4. ❌ **Token permissions missing** → Didn't grant all permissions during OAuth

---

## ✅ **Next Steps**

### **Step 1: Check Debug Panel**

Reload `/store/[storeId]/social` → DM Automation tab

Look at yellow debug card:
- Does it show "Instagram Connected: Yes"?
- Does it show your Instagram username?
- Does it show an Instagram ID?

### **Step 2: Check Convex Data**

Go to: https://dashboard.convex.dev/d/fastidious-snake-859 → Data → `integrations`

Should see a row with:
- userId: [your Convex user ID]
- name: "INSTAGRAM"
- instagramId: [17-digit number]
- token: [long string starting with "EAAB..."]
- isActive: true

**If no row exists:** OAuth didn't save → Try connecting again

**If row exists:** Check the logs when you try to load posts

### **Step 3: Check Browser Console**

When you click "Refresh Posts", check console for:
- What's the user ID being passed?
- What's the API response?
- Any error messages?

---

**Report back what you see in the debug panel and I'll help you fix it!** 🔍


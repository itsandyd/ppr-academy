# Managing Multiple Instagram Accounts

## ✅ Good News: Multiple Accounts Are Supported!

Your social media scheduler **fully supports multiple Instagram accounts**. You can connect as many Instagram Business accounts as you want!

---

## 🔑 How It Works

### Key Concept: One Instagram Per Facebook Page

- Each **Facebook Page** can have **one Instagram account** connected
- If you have **3 Instagram accounts**, you need **3 Facebook Pages**
- Each Instagram account is managed independently

### Example Setup

```
Facebook Page 1 → Instagram @personal_account
Facebook Page 2 → Instagram @business_account  
Facebook Page 3 → Instagram @brand_account
```

---

## 📋 How to Connect Multiple Instagram Accounts

### Step 1: Connect Your First Instagram Account

1. Go to **Social Media** page
2. Click **"Connect Instagram"**
3. Authorize with Facebook
4. ✅ First account connected!

### Step 2: Connect Additional Instagram Accounts

1. Click **"Add Another"** on the Instagram card
2. Click **"Connect Instagram"** again
3. During Facebook OAuth:
   - You'll see your Facebook Pages listed
   - **Select a DIFFERENT page** than before
   - (One that has a different Instagram account connected)
4. Click **"Continue"**
5. ✅ Second account connected!

### Step 3: Repeat for More Accounts

Repeat Step 2 for each additional Instagram account you want to connect.

---

## 🎯 What You'll See

After connecting multiple accounts, your Instagram card will show:

```
┌─────────────────────────────────┐
│ 🟣 Instagram                    │
│ 3 accounts connected ✅         │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ @personal_account           │ │
│ │ Personal                    │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ @business_account           │ │
│ │ Business                    │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ @brand_account              │ │
│ │ Brand                       │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Add Another] [Manage]          │
└─────────────────────────────────┘
```

---

## 🔍 Terminal Logs

When you connect, you'll see logs like:

```
Found 3 Instagram account(s) connected to your Facebook Pages

Note: You have 3 Instagram accounts available. 
To connect additional accounts, click "Add Another" and authorize again.

Available Instagram accounts: 
  @personal_account (via Personal Page),
  @business_account (via Business Page),
  @brand_account (via Brand Page)
```

This tells you:
- ✅ How many Instagram accounts are available
- ✅ Which one is being connected now
- ✅ How to connect the others

---

## 🛠️ Managing Multiple Accounts

### Viewing All Connected Accounts

All your connected Instagram accounts appear in the Instagram card, each showing:
- Instagram username
- Display name
- Connection status
- Last verified timestamp

### Managing Individual Accounts

Click **"Manage"** to:
- Add custom labels (e.g., "Personal", "Business", "Main Brand")
- View connection details
- Disconnect specific accounts
- Delete accounts

### Scheduling Posts to Specific Accounts

When creating a scheduled post:
1. **Select the platform**: Instagram
2. **Choose the account**: Dropdown shows all connected Instagram accounts
3. **Add content and schedule**
4. Post will be published to **that specific account only**

---

## 📊 Use Cases

### Example 1: Content Creator with Multiple Brands

```
@personal_lifestyle → Personal lifestyle content
@fitness_coaching → Fitness tips and coaching
@recipe_channel → Food and recipes
```

**Workflow:**
- Schedule different content to each account
- Track performance separately
- Maintain distinct brand identities

### Example 2: Agency Managing Client Accounts

```
@client_a_fashion → Fashion brand content
@client_b_tech → Tech company updates
@client_c_food → Restaurant promotions
```

**Workflow:**
- Each client has their own Instagram
- Separate scheduling and analytics
- No cross-posting or confusion

### Example 3: Business with Regional Accounts

```
@brand_usa → US-focused content
@brand_europe → Europe-focused content
@brand_asia → Asia-focused content
```

**Workflow:**
- Localized content per region
- Different posting times
- Regional performance tracking

---

## ⚠️ Requirements for Each Instagram Account

Each Instagram account you want to connect must:

1. ✅ Be an **Instagram Business or Creator** account
2. ✅ Be connected to a **Facebook Page**
3. ✅ You must be **Admin or Editor** of that Facebook Page
4. ✅ The Facebook Page must be selected during OAuth

---

## 🚀 Best Practices

### 1. Label Your Accounts

Immediately after connecting, add labels:
- "Personal Account"
- "Business Account"  
- "Client Name"
- "US Region"

This makes it easy to identify accounts when scheduling posts.

### 2. Verify Each Connection

After connecting multiple accounts:
- Go to each account's **"Manage"** dialog
- Verify the username is correct
- Check connection status
- Test with a post if needed

### 3. Organize by Purpose

Group accounts logically:
- Personal vs Business
- By client
- By region
- By content type

### 4. Monitor Connection Status

Periodically check that all accounts are still connected:
- Green "Connected" badge = ✅ Active
- Red "Disconnected" badge = ❌ Needs reconnection

---

## 🔄 Reconnecting Accounts

If an Instagram account gets disconnected:

1. **Click "Manage"** on that account
2. **Click "Reconnect Account"**
3. **Authorize with Facebook** again
4. **Select the correct Facebook Page**
5. ✅ Connection restored!

---

## 💡 Tips & Tricks

### Tip 1: Create Facebook Pages for Each Instagram

If you have multiple Instagram accounts but only one Facebook Page:
1. Create additional Facebook Pages (one per Instagram)
2. Connect each Instagram to its respective Page
3. Then connect all of them to PPR Academy

### Tip 2: Use Consistent Naming

Name your Facebook Pages clearly:
- "My Brand - Instagram Personal"
- "My Brand - Instagram Business"
- "Client Name - Instagram"

This makes it obvious which Page links to which Instagram.

### Tip 3: Test Before Scheduling

Before scheduling posts to a new account:
1. Connect the account
2. Try a manual test post (if available)
3. Verify it appears on the correct Instagram
4. Then start scheduling

---

## ✅ Summary

**Current Setup (After Your First Connection):**
- ✅ Instagram OAuth working
- ✅ Account connected successfully
- ✅ Can see your Instagram username
- ✅ Can add labels
- ✅ Can disconnect/delete

**To Connect More Accounts:**
1. Click **"Add Another"**
2. Select a **different Facebook Page** during OAuth
3. That page's Instagram will be connected as a **second account**
4. Repeat for each additional Instagram account

**You now have a fully functional multi-account Instagram scheduler!** 🎉

---

## 🆘 Troubleshooting

### "I don't see my other Instagram accounts"

**Solution:** Each Instagram must be connected to a different Facebook Page. During OAuth, make sure you're selecting the Page that has the Instagram you want to connect.

### "I connected the same Instagram twice"

**Solution:** The system prevents duplicates using `platformUserId`. If you reconnect the same Instagram, it will update the existing connection, not create a duplicate.

### "One of my accounts stopped working"

**Solution:** 
1. Click "Manage" on that account
2. Check the error message
3. Click "Reconnect" to re-authorize
4. Or "Delete" and connect fresh

---

## 📚 Related Documentation

- `INSTAGRAM_OAUTH_FIX.md` - How Instagram authentication works
- `INSTAGRAM_CONNECTION_TROUBLESHOOTING.md` - Common connection issues
- `SOCIAL_MEDIA_MULTIPLE_ACCOUNTS.md` - General multi-account support

---

**Questions?** Check the terminal logs for detailed debugging info! 🔍

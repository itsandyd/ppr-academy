# Coaching Call Discord Integration - Setup Summary

## ✅ What's Been Built

### 1. Convex Backend (`convex/coachingProducts.ts`)
- ✅ **Queries**:
  - `getCoachingProductsByStore` - Get all coaching products for a store
  - `getPublishedCoachingProductsByStore` - Get published products for storefront
  - `getCoachingProductById` - Get single coaching product
  - `checkUserDiscordConnection` - Check if user has Discord connected
  
- ✅ **Mutations**:
  - `createCoachingProduct` - Create new coaching product
  - `updateCoachingProduct` - Update existing product
  - `publishCoachingProduct` - Publish coaching product
  - `bookCoachingSession` - Book a session (includes Discord verification)
  
- ✅ **Actions**:
  - `setupDiscordForSession` - Automatic Discord role assignment after booking

### 2. React Components
- ✅ `DiscordVerificationCard` - Shows Discord connection status with connect button
- ✅ Updated `CheckoutForm` - Integrated Discord verification + product creation
- ✅ Updated `AvailabilityForm` - Saves availability settings to context
- ✅ Updated `OptionsForm` - Handles publishing and final submission
- ✅ Enhanced `CoachingPreviewContext` - Shares data across wizard steps

### 3. React Hooks (`hooks/use-coaching-products.ts`)
- ✅ `useCreateCoachingProduct()` - Create coaching products
- ✅ `useUpdateCoachingProduct()` - Update coaching products  
- ✅ `usePublishCoachingProduct()` - Publish products
- ✅ `useBookCoachingSession()` - Book coaching sessions with Discord checks

## 🚀 How It Works

### Creator Flow
1. Navigate to `/store/[storeId]/products/coaching-call/create`
2. **Step 1 (Thumbnail)**: Upload image, select style → Next
3. **Step 2 (Checkout)**: 
   - Enter title, description, price, duration
   - Set session type (video/audio/phone)
   - Add custom info fields to collect
   - **Discord Verification**: System checks if you're connected to Discord
   - Product is created as draft
   - → Next
4. **Step 3 (Availability)**: Configure availability schedule → Next
5. **Step 4 (Options)**: Set up order bumps, affiliates, emails → **Publish**
6. Product is now live on your storefront!

### Student Booking Flow
1. Student visits storefront and sees coaching product
2. Clicks "Book Session"
3. **Discord Check**:
   - ❌ Not connected → Shows "Connect Discord" prompt
   - ✅ Connected → Proceeds to booking
4. Student selects date, time, adds notes
5. **Automatic on Booking**:
   - Session record created in `coachingSessions`
   - Discord role "Coaching Access" assigned automatically
   - Student can now access coaching channels in Discord

## 🔧 What You Need to Configure

### 1. Discord OAuth (Already Done?)
Check if you have these env variables:
```env
NEXT_PUBLIC_DISCORD_CLIENT_ID=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

If not, follow: `DISCORD_QUICK_START.md`

### 2. Create Discord Role

In your Discord server:
1. Go to **Server Settings** → **Roles**
2. Create a new role called **"Coaching Access"**
3. Set permissions:
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Connect (to voice)
   - ✅ Speak (in voice)
4. Copy the **Role ID** (Enable Developer Mode in Discord → Right-click role → Copy ID)

### 3. Configure Role in Database

You need to add the coaching role ID to your Discord guild config. You can do this via Convex dashboard or a script:

**Option A: Via Convex Dashboard**
1. Go to your Convex dashboard
2. Open the `discordGuilds` table
3. Find your store's guild record
4. Edit the `courseRoles` field to include:
```json
{
  "coachingRole": "YOUR_ROLE_ID_HERE"
}
```

**Option B: Via Mutation** (run in Convex dashboard functions tab)
```typescript
// In Convex dashboard, run this mutation:
await ctx.db.patch(guildId, {
  courseRoles: {
    ...existingCourseRoles,
    coachingRole: "YOUR_ROLE_ID_HERE"
  }
});
```

### 4. Create Coaching Channels (Optional but Recommended)

In your Discord server:
1. Create a category: **"🎯 Coaching"**
2. Set category permissions:
   - @everyone: ❌ View Channels
   - Coaching Access role: ✅ View Channels
3. Add channels inside:
   - `#coaching-chat` (text channel)
   - `🎤 coaching-room` (voice channel)

Now only students who book coaching sessions will see these channels!

## 🎯 Quick Test

### Test as Creator:
1. Go to `/store/[storeId]/products/coaching-call/create`
2. Complete wizard (connect Discord if prompted)
3. Publish coaching product
4. Verify it appears on your storefront

### Test as Student (use different browser/incognito):
1. Sign up as new user
2. Connect Discord account
3. Join your Discord server
4. Go to storefront and find coaching product
5. Book a session
6. Check Discord → Should have "Coaching Access" role
7. Verify you can see coaching channels

## 📋 Configuration Checklist

- [ ] Discord OAuth environment variables set
- [ ] "Coaching Access" role created in Discord
- [ ] Role ID added to `discordGuilds.courseRoles.coachingRole`
- [ ] Coaching channels created in Discord
- [ ] Channel permissions set to require "Coaching Access" role
- [ ] Bot has "Manage Roles" permission in Discord
- [ ] Tested creator flow (create → publish)
- [ ] Tested student flow (book → receive role → access channels)

## 🎨 UI Preview

### Discord Verification States

**1. Not Connected (Amber Warning)**
```
⚠️ Discord Connection Required
Coaching sessions use Discord for communication. 
Please connect your Discord account to continue.

[Connect Discord →]
```

**2. Connected but Not in Server (Blue Info)**
```
ℹ️ Join Our Discord Server
You're connected to Discord as YourUsername, but you need 
to join our Discord server to access coaching channels.

[Join Discord Server →]
```

**3. Fully Verified (Green Success)**
```
✅ Discord Connected
You're connected as YourUsername and will receive access to 
coaching channels upon booking.
```

## 🔍 Where to Find Things

### Files Created:
- `convex/coachingProducts.ts` - Backend logic
- `components/coaching/DiscordVerificationCard.tsx` - Discord status UI
- `hooks/use-coaching-products.ts` - React hooks
- `COACHING_CALL_DISCORD_INTEGRATION.md` - Full documentation

### Files Modified:
- `app/.../coaching-call/create/CoachingPreviewContext.tsx` - Enhanced state
- `app/.../coaching-call/create/steps/checkout/CheckoutForm.tsx` - Added Discord check + product creation
- `app/.../coaching-call/create/steps/availability/AvailabilityForm.tsx` - Saves availability data
- `app/.../coaching-call/create/steps/options/OptionsForm.tsx` - Publishing logic

## 💡 Tips

1. **Testing**: Use Discord's developer mode to easily copy role/channel IDs
2. **Debugging**: Check Convex logs for any mutation errors
3. **Permissions**: Ensure your bot role is higher than "Coaching Access" in role hierarchy
4. **Users**: Students must connect Discord AND join your server before booking

## 🆘 Need Help?

Common issues:
- **"Discord Connection Required"**: User needs to connect Discord via OAuth flow
- **Role not assigned**: Check if `coachingRole` is configured in `discordGuilds`
- **Can't see channels**: Verify channel permissions require "Coaching Access" role
- **Bot can't assign role**: Ensure bot has "Manage Roles" permission and is above target role

## 🎉 You're All Set!

The coaching call system with Discord integration is now complete. Students who book coaching sessions will automatically:
- ✅ Be verified to have Discord connected
- ✅ Receive the "Coaching Access" role
- ✅ Gain access to coaching channels
- ✅ Be able to communicate with you via Discord

Happy coaching! 🚀


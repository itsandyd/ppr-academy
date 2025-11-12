# Coaching Call Creation with Discord Integration

## Overview

The coaching call creation system allows creators to offer 1-on-1 coaching sessions with automatic Discord channel access for booked students. When a student books a coaching session, they automatically receive a Discord role that grants them access to coaching channels.

## 🎯 Features

### For Creators
- **Multi-step product creation wizard**: Thumbnail → Checkout → Availability → Options
- **Discord integration setup**: Automatically verify Discord connection
- **Flexible session options**: Video, audio, or phone sessions
- **Custom fields**: Collect specific information from students
- **Availability management**: Set when you're available for coaching
- **Order bumps & affiliates**: Monetization options

### For Students
- **Discord verification**: Must connect Discord before booking
- **Automatic role assignment**: Get coaching channel access upon booking
- **Session scheduling**: Book available time slots
- **Custom info collection**: Provide required information

## 📁 File Structure

### Convex Functions
```
convex/
  ├── coachingProducts.ts       # Main coaching product mutations/queries
  ├── discordPublic.ts          # Public Discord queries/mutations
  ├── discordInternal.ts        # Internal Discord queries/mutations
  └── discord.ts                # Discord actions (role assignment, etc.)
```

### React Components
```
components/
  └── coaching/
      └── DiscordVerificationCard.tsx  # Discord connection status UI

hooks/
  └── use-coaching-products.ts         # Coaching product management hooks

app/(dashboard)/store/[storeId]/products/coaching-call/create/
  ├── page.tsx                         # Main wizard router
  ├── CoachingPreviewContext.tsx       # Shared state across wizard steps
  ├── steps/
  │   ├── thumbnail/
  │   │   └── ThumbnailForm.tsx        # Step 1: Upload/style thumbnail
  │   ├── checkout/
  │   │   └── CheckoutForm.tsx         # Step 2: Title, description, settings
  │   ├── availability/
  │   │   └── AvailabilityForm.tsx     # Step 3: Set availability
  │   └── options/
  │       └── OptionsForm.tsx          # Step 4: Reviews, bumps, publish
```

## 🔧 Implementation Details

### 1. Coaching Product Schema

Coaching products are stored in the `digitalProducts` table with additional fields:

```typescript
{
  productType: "coaching",          // Identifies as coaching product
  duration: number,                 // Session duration in minutes
  sessionType: "video" | "audio" | "phone",
  customFields: Array,              // Custom info to collect
  availability: Object,             // Availability configuration
  discordRoleId: string,           // Discord role for coaching access
  thumbnailStyle: string,          // Display style
}
```

### 2. Discord Integration Flow

#### When Creating a Coaching Product:
1. Creator starts wizard at `/store/[storeId]/products/coaching-call/create`
2. **Thumbnail Step**: Upload image and select display style
3. **Checkout Step**: 
   - Fill in title, description, price, duration
   - Set session type (video/audio/phone)
   - Add custom info fields
   - **Discord Verification**: System checks if creator has Discord connected
4. **Availability Step**: Set available days/times
5. **Options Step**: Configure order bumps, affiliates, emails, then publish

#### When a Student Books:
1. Student clicks "Book Session" on a coaching product
2. System checks if student has Discord connected via `checkUserDiscordConnection`
3. If not connected → show error with connect button
4. If connected → create `coachingSession` record
5. **Automatic Discord Setup** (runs via scheduler):
   - Get store's Discord guild
   - Find or create "Coaching Access" role
   - Assign role to student via `assignDiscordRole`
   - Update product with `discordRoleId`

### 3. Key Convex Functions

#### Queries

**`checkUserDiscordConnection`**
```typescript
// Check if user has Discord connected
const connection = await checkUserDiscordConnection({ userId: user.id });
// Returns: { isConnected, discordUsername, guildMemberStatus }
```

**`getCoachingProductsByStore`**
```typescript
// Get all coaching products for a store
const products = await getCoachingProductsByStore({ storeId });
```

#### Mutations

**`createCoachingProduct`**
```typescript
// Create a new coaching product
const result = await createCoachingProduct({
  title: "1:1 Strategy Call",
  description: "Personal coaching session",
  price: 99,
  duration: 60,
  sessionType: "video",
  storeId,
  userId,
  customFields: [{ label: "What do you want to achieve?", type: "textarea", required: true }]
});
```

**`bookCoachingSession`**
```typescript
// Book a coaching session (checks Discord automatically)
const result = await bookCoachingSession({
  productId,
  studentId: user.id,
  scheduledDate: Date.now(),
  startTime: "14:00",
  notes: "Looking forward to the session"
});
// Returns: { success, sessionId?, requiresDiscordAuth? }
```

#### Actions

**`setupDiscordForSession`** (internal)
- Automatically called when a session is booked
- Gets store's Discord guild
- Ensures coaching role exists
- Assigns role to student
- Updates product with role ID

### 4. React Hooks

**`useCreateCoachingProduct()`**
```tsx
const { createProduct } = useCreateCoachingProduct();

const productId = await createProduct(storeId, {
  title: "1:1 Call",
  duration: 60,
  price: 99,
  sessionType: "video"
});
```

**`usePublishCoachingProduct()`**
```tsx
const { publishProduct } = usePublishCoachingProduct();
const success = await publishProduct(productId);
```

**`useBookCoachingSession()`**
```tsx
const { bookSession } = useBookCoachingSession();
const sessionId = await bookSession(productId, new Date(), "14:00", "My goals...");
```

## 🚀 Setup Instructions

### 1. Environment Variables

Ensure these are set (see `DISCORD_QUICK_START.md`):

```env
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_server_id
```

### 2. Discord Role Configuration

In your Discord server, create a role called **"Coaching Access"** with permissions to:
- View coaching channels
- Send messages in coaching channels
- Connect to coaching voice channels

Then, add the role ID to your store's Discord guild configuration:

```typescript
// In Discord settings
await updateDiscordGuildConfig({
  storeId,
  guildId: "your_guild_id",
  courseRoles: {
    coachingRole: "role_id_here"  // Add this field
  }
});
```

### 3. Create Coaching Channels

In your Discord server:
1. Create a category called "🎯 Coaching"
2. Set permissions so only users with "Coaching Access" role can view it
3. Add text and voice channels inside this category

### 4. Testing the Flow

1. **As Creator**:
   - Go to `/store/[storeId]/products/coaching-call/create`
   - Complete all wizard steps
   - Ensure Discord is connected
   - Publish the coaching product

2. **As Student**:
   - View the coaching product on the storefront
   - Click "Book Session"
   - If Discord not connected → will see prompt to connect
   - Complete booking
   - Check Discord → should have "Coaching Access" role
   - Verify access to coaching channels

## 📊 Database Schema

### coachingSessions
```typescript
{
  coachId: string,              // Clerk ID of coach
  studentId: string,            // Clerk ID of student
  scheduledDate: number,        // Unix timestamp
  startTime: string,            // "14:00"
  endTime: string,              // "15:00"
  duration: number,             // Minutes
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  notes: string?,               // Student's session notes
  sessionType: string,          // "video" | "audio" | "phone"
  totalCost: number,
  discordChannelId: string?,    // Private Discord channel (future)
  discordRoleId: string?,       // Role assigned to student
  discordSetupComplete: boolean,
  reminderSent: boolean,
}
```

### discordIntegrations
```typescript
{
  userId: string,               // Clerk user ID
  discordUserId: string,        // Discord user ID
  discordUsername: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  enrolledCourseIds: Id<"courses">[],
  assignedRoles: string[],      // Array of Discord role IDs
  guildMemberStatus: "invited" | "joined" | "left",
  lastSyncedAt: number,
  connectedAt: number,
}
```

## 🔒 Security Considerations

1. **Discord Verification Required**: Students cannot book without Discord connection
2. **Role Isolation**: Each coaching product can have its own role
3. **Automatic Cleanup**: Roles can be removed when access expires (future feature)
4. **Internal Actions**: Discord setup runs as internal action, not exposed to public API

## 🎨 UI Components

### DiscordVerificationCard

Shows Discord connection status with 3 states:

1. **Not Connected** (Amber):
   - Shows warning
   - "Connect Discord" button

2. **Connected but Not in Guild** (Blue):
   - Shows Discord username
   - "Join Discord Server" button

3. **Fully Verified** (Green):
   - Shows success message
   - Displays Discord username
   - Indicates they'll get channel access upon booking

## 🔄 Future Enhancements

### Planned Features:
- [ ] Automatic private channel creation per session
- [ ] Channel cleanup after session completion
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Automated reminders via Discord DM
- [ ] Session recording storage
- [ ] Payment integration with Stripe
- [ ] Recurring coaching packages
- [ ] Group coaching sessions
- [ ] Coach-specific Discord categories

## 📝 Notes

- Coaching products use the `digitalProducts` table with `productType: "coaching"`
- Discord role assignment happens automatically via scheduler
- Role IDs are stored in `discordGuilds.courseRoles.coachingRole`
- The wizard preserves state using `CoachingPreviewContext`
- All Discord operations go through the internal actions for security

## 🐛 Troubleshooting

### "Discord Connection Required" Error
- Make sure user has connected Discord via OAuth
- Check `discordIntegrations` table for user record
- Verify `guildMemberStatus` is "joined"

### Role Not Assigned
- Check if coaching role ID is configured in `discordGuilds.courseRoles`
- Verify bot has "Manage Roles" permission
- Ensure role is below bot's highest role in hierarchy

### Product Not Saving
- Check browser console for errors
- Verify user has permission to create products in store
- Check Convex logs for mutation errors

## 📚 Related Documentation

- `DISCORD_QUICK_START.md` - Discord OAuth setup
- `DISCORD_SETUP_GUIDE.md` - Detailed Discord bot configuration
- `COACHING_SYSTEM_SETUP.md` - Original coaching system docs
- `CONVEX_INTEGRATION_GUIDE.md` - Convex patterns and best practices


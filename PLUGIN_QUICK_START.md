# Plugin Directory - Quick Start Guide

## 🚀 For First-Time Setup

### Step 1: Export from Prisma/Planetscale

```bash
# Run the export script
npx ts-node scripts/export-plugins.ts
```

This creates:
- `exports/plugin-export.json` - Your export file
- `exports/plugin-export-[timestamp].json` - Timestamped backup

---

### Step 2: Import to Convex

#### Option A: Via Convex Dashboard (Recommended)

1. Go to https://dashboard.convex.dev
2. Select your project
3. Click "Functions" → "Actions"
4. Find `migrations/importPlugins:importPluginsFromJSON`
5. Click "Run Function"
6. Fill in parameters:
   ```json
   {
     "clerkId": "your_admin_clerk_id",
     "jsonData": "paste_entire_json_here"
   }
   ```
7. Click "Run"
8. Wait for completion (check logs)

#### Option B: Via Script

```bash
# Create and run import script
node scripts/import-to-convex.js
```

---

### Step 3: Verify in Admin Panel

1. Navigate to `/admin/plugins`
2. Check all plugins imported
3. Verify images, prices, links

---

### Step 4: Check Marketplace

1. Navigate to `/marketplace/plugins`
2. Test search and filters
3. Click plugin links
4. Verify purchase/download buttons

---

## 📝 Daily Usage

### Creating a Plugin (Admin)

1. Go to `/admin/plugins`
2. Click "Add Plugin"
3. Fill required fields:
   - **Name** (required)
   - Slug (auto-generated if left empty)
   - Author
   - Description
4. Add media:
   - Image URL
   - Video URL
   - Audio URL
5. Set pricing:
   - **Type**: Free, Paid, or Freemium
   - **Price**: $ amount (if paid)
   - **Purchase URL**: Where to buy
   - **Opt-in Form**: For free downloads
6. Toggle "Publish to Marketplace"
7. Click "Create Plugin"

---

### Editing a Plugin (Admin)

1. Go to `/admin/plugins`
2. Find plugin in table
3. Click edit icon (pencil)
4. Update fields
5. Click "Update Plugin"

---

### Deleting a Plugin (Admin)

1. Go to `/admin/plugins`
2. Find plugin
3. Click trash icon
4. Confirm deletion

---

## 🔍 Marketplace Features

### Search
- Type in search bar
- Searches: name, author, description

### Filters
- **Type**: Effect, Instrument, Studio Tool
- **Category**: Mixing, Mastering, Sound Design, etc.
- **Pricing**: Free, Paid, Freemium

### Plugin Cards Show:
- Plugin name & author
- Type and category badges
- Pricing badge
- Price (if paid)
- Description
- Action buttons:
  - Buy Now / Get Free
  - Watch Demo (if video available)
  - Audio Demo (if audio available)

---

## 🎯 Common Tasks

### Add Plugin Type

```typescript
// In admin panel or via mutation
await createPluginType({
  clerkId: "your_clerk_id",
  name: "New Type"
});
```

### Add Plugin Category

```typescript
await createPluginCategory({
  clerkId: "your_clerk_id",
  name: "New Category"
});
```

### Update Plugin Pricing

1. Go to `/admin/plugins`
2. Click edit on plugin
3. Change "Pricing Type"
4. Update "Price" if needed
5. Update "Purchase URL"
6. Save

### Publish/Unpublish Plugin

1. Edit plugin
2. Toggle "Publish to Marketplace"
3. Save

---

## 🛠️ Troubleshooting

### Plugin Not Showing in Marketplace

**Causes:**
1. Not published (check `isPublished` toggle)
2. No name or invalid data
3. Category/Type doesn't exist

**Fix:**
1. Go to admin panel
2. Edit plugin
3. Toggle "Publish to Marketplace" ON
4. Verify all fields
5. Save

---

### Import Failed

**Causes:**
1. JSON format invalid
2. Missing admin permissions
3. Duplicate slugs
4. Invalid relationships

**Fix:**
1. Validate JSON structure
2. Check you're logged in as admin
3. Make slugs unique
4. Import types/categories before plugins

---

### Slug Conflict

**Error:** "A plugin with this slug already exists"

**Fix:**
1. Change plugin slug
2. Or leave slug empty (auto-generated)
3. Try again

---

### Images Not Loading

**Causes:**
1. Invalid image URL
2. CORS issues
3. URL not accessible

**Fix:**
1. Verify image URL in browser
2. Use HTTPS URLs
3. Use image hosting service (Imgur, Cloudinary, etc.)
4. Or upload to Convex storage

---

## 📊 Data Structure

### Plugin Object

```typescript
{
  _id: string,
  name: string,
  slug?: string,
  author?: string,
  description?: string,
  image?: string,
  videoUrl?: string,
  audioUrl?: string,
  categoryId?: Id<"pluginCategories">,
  pluginTypeId?: Id<"pluginTypes">,
  price?: number,
  pricingType: "FREE" | "PAID" | "FREEMIUM",
  purchaseUrl?: string,
  optInFormUrl?: string,
  isPublished?: boolean,
  createdAt: number,
  updatedAt: number
}
```

---

## 🔐 Access Control

### Admin Only:
- `/admin/plugins` - Admin panel
- Create plugin
- Edit plugin
- Delete plugin
- Create types/categories

### Public:
- `/marketplace/plugins` - Browse plugins
- View plugin details
- Click purchase/download links

---

## 📈 Analytics (Future)

Coming soon:
- [ ] Plugin views
- [ ] Click tracking
- [ ] Download counts
- [ ] Popular plugins

---

## 🆘 Need Help?

1. Check logs in Convex dashboard
2. Review error messages
3. See `PLUGIN_MIGRATION_GUIDE.md` for detailed help
4. See `PLUGIN_DIRECTORY_SUMMARY.md` for technical details

---

## 🎉 Quick Links

- Admin Panel: `/admin/plugins`
- Marketplace: `/marketplace/plugins`
- Convex Dashboard: https://dashboard.convex.dev
- Documentation: `PLUGIN_MIGRATION_GUIDE.md`

---

**Version**: 1.0.0  
**Last Updated**: November 4, 2025


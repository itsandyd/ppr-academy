# 🎛️ Plugin Directory System

Complete plugin directory implementation for PPR Academy, migrated from Prisma/Planetscale to Convex.

---

## 📚 Documentation Index

| Document | Purpose | For Who |
|----------|---------|---------|
| **PLUGIN_QUICK_START.md** | Quick reference guide | Admins & Developers |
| **PLUGIN_MIGRATION_GUIDE.md** | Detailed migration steps | Developers |
| **PLUGIN_DIRECTORY_SUMMARY.md** | Technical implementation details | Developers |
| **README_PLUGINS.md** | This overview | Everyone |

---

## ✨ Features

### For Admins
- ✅ Full CRUD operations for plugins
- ✅ Rich plugin editor with all fields
- ✅ Plugin type and category management
- ✅ Publish/unpublish toggle
- ✅ Search and filter interface
- ✅ Dashboard with statistics

### For Users
- ✅ Beautiful marketplace browsing
- ✅ Advanced search and filters
- ✅ Plugin cards with images
- ✅ Direct purchase/download links
- ✅ Video and audio demos
- ✅ Responsive design

### For Developers
- ✅ Type-safe Convex schema
- ✅ Comprehensive queries and mutations
- ✅ Migration tools
- ✅ Export/import scripts
- ✅ Full documentation

---

## 🚀 Quick Start

### 1. First Time Setup

```bash
# Export from Prisma (if migrating existing data)
npx ts-node scripts/export-plugins.ts

# Import to Convex (use Convex dashboard or script)
# See PLUGIN_MIGRATION_GUIDE.md for details
```

### 2. Access Admin Panel

```
https://your-app.com/admin/plugins
```

### 3. Browse Marketplace

```
https://your-app.com/marketplace/plugins
```

---

## 📁 File Structure

```
convex/
├── schema.ts                    # Plugin tables definition
├── plugins.ts                   # Queries & mutations
├── marketplace.ts               # Updated with plugin search
├── lib/
│   └── utils.ts                 # Helper functions
└── migrations/
    └── importPlugins.ts         # Import actions

app/
├── admin/
│   └── plugins/
│       └── page.tsx             # Admin management UI
└── marketplace/
    └── plugins/
        └── page.tsx             # Public marketplace UI

scripts/
└── export-plugins.ts            # Prisma export script

docs/
├── PLUGIN_QUICK_START.md        # Quick reference
├── PLUGIN_MIGRATION_GUIDE.md    # Migration steps
├── PLUGIN_DIRECTORY_SUMMARY.md  # Technical details
└── README_PLUGINS.md            # This file
```

---

## 🗄️ Database Schema

### Tables

1. **pluginTypes** - Main plugin types
   - Effect, Instrument, Studio Tool, etc.

2. **pluginCategories** - General categories
   - Mixing, Mastering, Sound Design, etc.

3. **pluginEffectCategories** - Effect subcategories
   - Reverb, Delay, EQ, Compression, etc.

4. **pluginInstrumentCategories** - Instrument subcategories
   - Synth, Sampler, Drums, etc.

5. **pluginStudioToolCategories** - Tool subcategories
   - Utility, Analyzer, Metering, etc.

6. **plugins** - Main plugin records
   - All plugin data and metadata

### Relationships

```
Plugin
  ├─ belongs to → PluginType
  └─ belongs to → PluginCategory

PluginEffectCategory
  └─ belongs to → PluginType (Effect)

PluginInstrumentCategory
  └─ belongs to → PluginType (Instrument)

PluginStudioToolCategory
  └─ belongs to → PluginType (Studio Tool)
```

---

## 🔌 API Reference

### Queries

#### Public Queries
```typescript
// Get all published plugins
api.plugins.getAllPublishedPlugins()

// Get plugin by slug
api.plugins.getPluginBySlug({ slug: "serum" })

// Get plugin types
api.plugins.getPluginTypes()

// Get plugin categories
api.plugins.getPluginCategories()
```

#### Admin Queries
```typescript
// Get all plugins (admin only)
api.plugins.getAllPlugins({ clerkId: "..." })

// Get plugin by ID
api.plugins.getPluginById({ pluginId: "..." })
```

### Mutations (Admin Only)

```typescript
// Create plugin
api.plugins.createPlugin({
  clerkId: "...",
  name: "Plugin Name",
  author: "Developer",
  description: "Description",
  pricingType: "FREE",
  isPublished: true,
  // ... other fields
})

// Update plugin
api.plugins.updatePlugin({
  clerkId: "...",
  pluginId: "...",
  name: "Updated Name",
  // ... fields to update
})

// Delete plugin
api.plugins.deletePlugin({
  clerkId: "...",
  pluginId: "..."
})

// Create plugin type
api.plugins.createPluginType({
  clerkId: "...",
  name: "New Type"
})

// Create plugin category
api.plugins.createPluginCategory({
  clerkId: "...",
  name: "New Category"
})
```

---

## 🎨 UI Components

### Admin Panel

**Location**: `/app/admin/plugins/page.tsx`

**Features:**
- Dashboard statistics
- Search bar
- Plugin table with actions
- Create dialog
- Edit dialog
- Delete confirmation

### Marketplace Page

**Location**: `/app/marketplace/plugins/page.tsx`

**Features:**
- Hero section
- Statistics cards
- Advanced filters
- Plugin grid
- Plugin cards with actions
- Responsive design

---

## 🔐 Security

### Authentication
- Admin panel requires `user.admin === true`
- All mutations verify admin status
- Non-admins redirected with error message

### Data Validation
- Required fields enforced
- Slug uniqueness checked
- Enum values validated
- ID relationships verified

---

## 🚢 Deployment Checklist

### Before Migration
- [ ] Backup Planetscale database
- [ ] Test export script on sample data
- [ ] Verify Convex deployment is ready
- [ ] Confirm admin user exists in Convex

### During Migration
- [ ] Run export script
- [ ] Review exported JSON
- [ ] Import to dev environment first
- [ ] Verify data integrity
- [ ] Test all features
- [ ] Import to production

### After Migration
- [ ] Verify all plugins visible
- [ ] Test admin CRUD operations
- [ ] Check marketplace functionality
- [ ] Verify all images load
- [ ] Test purchase/download links
- [ ] Monitor for errors

---

## 🐛 Common Issues

### Problem: Import Fails

**Solution:**
1. Check admin permissions
2. Verify JSON structure
3. Look for duplicate slugs
4. Ensure types/categories imported first

### Problem: Plugins Not Visible

**Solution:**
1. Check `isPublished` status
2. Verify plugin has required fields
3. Check Convex logs

### Problem: Images Not Loading

**Solution:**
1. Verify image URLs are public
2. Use HTTPS URLs
3. Check CORS settings
4. Consider using Convex storage

---

## 📊 Statistics & Analytics

### Current Features
- Total plugins count
- Free/Paid/Freemium breakdown
- Published vs draft count

### Coming Soon
- [ ] View counts
- [ ] Click tracking
- [ ] Download statistics
- [ ] Popular plugins
- [ ] Search analytics

---

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- Convex schema
- Admin panel
- Marketplace page
- Migration tools
- Documentation

### Phase 2 (Next)
- [ ] Plugin detail pages
- [ ] User reviews
- [ ] Favorites/bookmarks
- [ ] Analytics dashboard

### Phase 3 (Future)
- [ ] Plugin bundles
- [ ] Discount codes
- [ ] Affiliate tracking
- [ ] User submissions
- [ ] Compatibility checker

---

## 🤝 Contributing

### Adding New Fields

1. Update `convex/schema.ts`:
```typescript
plugins: defineTable({
  // ... existing fields
  newField: v.optional(v.string()),
})
```

2. Update `convex/plugins.ts` mutations:
```typescript
export const createPlugin = mutation({
  args: {
    // ... existing args
    newField: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ... existing code
    newField: args.newField,
  }
})
```

3. Update admin form:
```tsx
// Add to PluginFormFields component
<div className="space-y-2">
  <Label htmlFor="newField">New Field</Label>
  <Input
    id="newField"
    value={formData.newField}
    onChange={(e) => setFormData({ ...formData, newField: e.target.value })}
  />
</div>
```

4. Deploy Convex schema:
```bash
npx convex dev
```

---

## 📞 Support

### Resources
- [Convex Documentation](https://docs.convex.dev)
- [PPR Academy Docs](./CODEBASE_OVERVIEW.md)
- [Plugin Migration Guide](./PLUGIN_MIGRATION_GUIDE.md)

### Getting Help
1. Check documentation files
2. Review Convex dashboard logs
3. Test in development first
4. Join Convex Discord

---

## 📝 License

Part of the PPR Academy platform.

---

## 🙏 Acknowledgments

- **Convex** - Real-time backend
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: November 4, 2025

---

## 📖 Additional Reading

- **Quick Start**: `PLUGIN_QUICK_START.md` - Fast reference for common tasks
- **Migration Guide**: `PLUGIN_MIGRATION_GUIDE.md` - Detailed migration instructions
- **Technical Summary**: `PLUGIN_DIRECTORY_SUMMARY.md` - Implementation details
- **Codebase Overview**: `CODEBASE_OVERVIEW.md` - General platform documentation

---

**Questions?** Check the docs or review the code - everything is well-documented! 🚀


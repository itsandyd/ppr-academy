# Thumbnail Storage Fix

## Problem
The AI thumbnail generation was failing with "Storage quota exceeded" error when trying to upload to UploadThing.

```
Error: Storage quota exceeded
Failed to upload image to storage
```

## Root Cause
UploadThing storage had reached its quota limit and couldn't accept new file uploads.

## Solution
Migrated thumbnail storage from UploadThing to Convex Storage.

### Changes Made

#### 1. Updated `/app/api/generate-thumbnail/route.ts`
- **Removed**: `UTApi` from `uploadthing/server`
- **Added**: `fetchMutation` and `fetchQuery` from `convex/nextjs`
- **Changed**: Upload flow to use Convex storage instead of UploadThing

**Before:**
```typescript
const utapi = new UTApi();
const uploadResponse = await utapi.uploadFiles([imageFile]);
const permanentUrl = uploadResponse[0].data.url;
```

**After:**
```typescript
// Get upload URL from Convex
const uploadUrl = await fetchMutation(api.files.generateUploadUrl, {});

// Upload file to Convex storage
const uploadResult = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": imageFile.type },
  body: imageFile,
});

const { storageId } = await uploadResult.json();

// Get public URL from Convex
const permanentUrl = await fetchQuery(api.files.getStorageUrl, { 
  storageId: storageId as Id<"_storage"> 
});
```

#### 2. Updated `/convex/files.ts`
- **Added**: `getStorageUrl` query to retrieve storage URLs from storage IDs

```typescript
export const getStorageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

### Benefits
1. ✅ **No storage quota issues** - Convex has generous storage limits
2. ✅ **Consistent with project architecture** - Project already uses Convex for data storage
3. ✅ **Better integration** - Files stored alongside other project data
4. ✅ **Cost-effective** - Single storage solution instead of multiple services

### Testing
To test the fix:
1. Go to course creation: `/store/{storeId}/course/create`
2. Fill in course details
3. Click "Generate with AI" button for thumbnail
4. Verify thumbnail generates and uploads successfully to Convex storage

### Notes
- OpenAI image generation is working correctly (gpt-image-1 model)
- Images are generated at 1536x1024 resolution
- Base64 images are properly converted to files before upload
- Authentication is verified through Clerk before Convex operations

# Convex Integration Guide for PPR Academy

## 🚀 Current Integration Status

### ✅ Already Completed
- Convex package installed (`convex: ^1.25.4`)
- ConvexClientProvider integrated in app layout
- Comprehensive schema defined in `convex/schema.ts`
- Functions updated to modern syntax with proper validators
- Basic CRUD functions for users, courses, stores, and digital products

### 🔧 Setup Steps Required

## 1. Initialize Convex Deployment

```bash
# Initialize Convex in your project
npx convex dev

# Follow the prompts:
# - Create a new project or use existing one
# - Choose your team
# - Set your project name (e.g., "ppr-academy")
```

This will:
- Generate `convex/_generated/` directory with API types
- Create `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
- Deploy your functions to Convex cloud

## 2. Environment Configuration

After running `npx convex dev`, verify these are in your `.env.local`:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud

# Other existing variables...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
DATABASE_URL=your_database_url
```

## 3. Package.json Scripts

Add Convex scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "convex:dev": "convex dev",
    "convex:deploy": "convex deploy",
    "convex:dashboard": "convex dashboard",
    "build": "prisma generate && convex deploy && next build",
    // ... other scripts
  }
}
```

## 4. Available Convex Functions

### User Management
```typescript
// Queries
api.users.getUserByClerkId({ clerkId: string })
api.users.getUserByEmail({ email: string })

// Mutations  
api.users.createUser({ clerkId, email, firstName?, lastName?, imageUrl?, name? })
api.users.updateUser({ id, ...updates })
api.users.updateUserByClerkId({ clerkId, ...updates })
api.users.linkClerkIdToUser({ email, clerkId, ...updates })
```

### Course Management
```typescript
// Queries
api.courses.getCourses()
api.courses.getCourseBySlug({ slug: string })
api.courses.getCoursesByUser({ userId: string })
api.courses.getCoursesByInstructor({ instructorId: string })

// Mutations
api.courses.createCourse({ userId, title, description?, imageUrl?, price?, courseCategoryId?, slug? })
api.courses.updateCourse({ id, ...updates })
```

### Store Management
```typescript
// Queries
api.stores.getStoresByUser({ userId: string })
api.stores.getStoreById({ storeId: Id<"stores"> })

// Mutations
api.stores.createStore({ name: string, userId: string })
api.stores.updateStore({ id, name? })
api.stores.deleteStore({ id })
```

### Digital Products
```typescript
// Queries
api.digitalProducts.getProductsByStore({ storeId: string })
api.digitalProducts.getProductsByUser({ userId: string })
api.digitalProducts.getProductById({ productId: Id<"digitalProducts"> })

// Mutations
api.digitalProducts.createProduct({ title, description?, price, imageUrl?, downloadUrl?, storeId, userId, buttonLabel?, style? })
api.digitalProducts.updateProduct({ id, ...updates })
api.digitalProducts.deleteProduct({ id })
```

## 5. React Component Integration

### Using Convex Hooks

```tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function MyComponent({ userId }: { userId: string }) {
  // Real-time queries
  const courses = useQuery(api.courses.getCoursesByUser, { userId });
  const stores = useQuery(api.stores.getStoresByUser, { userId });
  
  // Mutations
  const createCourse = useMutation(api.courses.createCourse);
  const createStore = useMutation(api.stores.createStore);
  
  // Handle loading state
  if (courses === undefined || stores === undefined) {
    return <div>Loading...</div>;
  }
  
  // Handle mutations
  const handleCreateCourse = async () => {
    await createCourse({
      userId,
      title: "New Course",
      description: "Course description"
    });
  };
  
  return (
    <div>
      <h2>Courses: {courses.length}</h2>
      <h2>Stores: {stores.length}</h2>
      <button onClick={handleCreateCourse}>Create Course</button>
    </div>
  );
}
```

## 6. Migration from Server Actions

### Before (Server Actions)
```tsx
// Server Component
import { getCoursesByUser } from "@/app/actions/course-actions";

export default async function CoursesPage() {
  const courses = await getCoursesByUser(userId);
  return <CoursesList courses={courses} />;
}
```

### After (Convex)
```tsx
// Client Component with real-time updates
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CoursesPage({ userId }: { userId: string }) {
  const courses = useQuery(api.courses.getCoursesByUser, { userId });
  
  if (courses === undefined) return <div>Loading...</div>;
  
  return <CoursesList courses={courses} />;
}
```

## 7. Key Benefits After Integration

### Real-time Updates
- Data automatically syncs across all connected clients
- No manual cache invalidation needed
- Live collaborative features work out of the box

### Type Safety
- Full TypeScript support with generated types
- Autocomplete for all function calls
- Compile-time error checking

### Optimistic Updates
```tsx
const addCourse = useMutation(api.courses.createCourse);

const handleAdd = () => {
  addCourse({ 
    userId, 
    title: "New Course" 
  }); // Automatically updates UI optimistically
};
```

### Offline Support
- Convex handles offline scenarios gracefully
- Automatic retry on reconnection
- Queue mutations while offline

## 8. Development Workflow

### Local Development
```bash
# Terminal 1: Start Convex dev server
npm run convex:dev

# Terminal 2: Start Next.js dev server  
npm run dev
```

### Deployment
```bash
# Deploy to production
npm run convex:deploy

# Then deploy your Next.js app normally
npm run build
```

## 9. Monitoring and Debugging

### Convex Dashboard
```bash
# Open Convex dashboard
npm run convex:dashboard
```

Features:
- Real-time function logs
- Database browser
- Performance metrics
- Error tracking

### Debugging Queries
```tsx
// Enable query debugging
const courses = useQuery(api.courses.getCourses);
console.log("Courses data:", courses);
```

## 10. Production Considerations

### Environment Variables
Ensure these are set in production:
- `NEXT_PUBLIC_CONVEX_URL` - Your production Convex deployment URL

### Security
- All queries and mutations are automatically secured
- Use `internalQuery`/`internalMutation` for backend-only functions
- Validate all inputs using Convex validators

### Performance
- Convex automatically optimizes queries
- Use pagination for large datasets
- Consider caching strategies for frequently accessed data

## 11. Next Steps

1. **Run `npx convex dev`** to initialize your deployment
2. **Generate missing functions** for remaining schema tables
3. **Convert components** to use Convex hooks instead of server actions  
4. **Add real-time features** like live course progress, collaborative editing
5. **Monitor performance** using Convex dashboard

## 12. Example Implementation

Check the `components/convex-example.tsx` file for a complete working example that demonstrates:
- Real-time queries
- Mutations with error handling
- Loading states
- Type-safe function calls

This integration will give you real-time, scalable, type-safe database operations with minimal setup! 
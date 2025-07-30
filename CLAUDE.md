# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Start development server with Turbopack (fast refresh)
npm run dev

# Start Convex development server (run in separate terminal)
npm run convex:dev

# Run both development servers (recommended for full development)
npm run dev & npm run convex:dev
```

### Database Management
```bash
# Push schema changes to Planetscale database
npm run db:push

# Generate Prisma client (run after schema changes)
npm run db:generate

# Open Prisma Studio for database GUI
npm run db:studio

# Pull database schema from Planetscale
npm run db:pull
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm run start

# Deploy Convex functions
npm run convex:deploy

# Lint code
npm run lint
```

### Testing
```bash
# Run a single test file (if test framework is added)
# Currently no test framework is configured - consider adding Vitest or Jest
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Databases**: 
  - Prisma with MySQL (Planetscale) for relational data
  - Convex for real-time features and NoSQL operations
- **Authentication**: Clerk with webhook-based user sync
- **UI**: Tailwind CSS + shadcn/ui components
- **File Uploads**: Uploadthing
- **Payments**: Stripe (for future subscription features)
- **Email**: Resend
- **AI**: OpenAI + Langchain for course generation, 11 Labs for text-to-speech

### Project Structure
```
/app                    # Next.js App Router pages
  /(auth)              # Auth pages (sign-in, sign-up)
  /(dashboard)         # Main app dashboard with sidebar layout
  /api                 # API routes including webhooks
/components            # Reusable UI components
  /ui                  # shadcn/ui components
/lib                   # Utility functions and data fetching
  /actions            # Server actions for data mutations
  /data               # Server-side data fetching functions
/hooks                # Custom React hooks
/convex               # Convex schema and functions
/prisma               # Database schema and migrations
```

### Key Architectural Patterns

1. **Server Components by Default**: Use client components only when needed (interactions, hooks)
2. **Server Actions**: All data mutations use server actions in `/lib/actions`
3. **Parallel Routes**: Dashboard uses parallel routes for different user roles
4. **Form Handling**: React Hook Form + Zod for validation
5. **Real-time Features**: Convex for chat, notifications, and live updates
6. **File Organization**: Features are co-located, shared code in `/lib`

### Database Architecture

The app uses a complex relational schema with 60+ tables supporting:
- Multi-tenant stores with agencies and subaccounts
- Course hierarchy: Course → Module → Lesson → Chapter
- Coaching system with availability and bookings
- Email campaigns and automation workflows
- Lead magnets and digital products
- Customer relationship management

### Authentication Flow

1. Clerk handles all authentication
2. Webhook at `/api/webhooks/clerk` syncs users to local database
3. Protected routes defined in `middleware.ts`
4. Role-based access: AGENCY_OWNER, AGENCY_ADMIN, SUBACCOUNT_USER, SUBACCOUNT_GUEST

### Creator Marketplace Pivot

The platform is transitioning from a course platform to a creator marketplace:
- Individual creator storefronts at `/creators/[username]`
- Per-creator subscription models
- 10% platform fee, 90% to creators
- Creator analytics and earnings dashboards

## Development Guidelines

### When Adding New Features

1. **Check Existing Patterns**: Look at similar features for conventions
2. **Use Server Components**: Default to RSC, add "use client" only when needed
3. **Data Fetching**: Use server actions in `/lib/actions` for mutations
4. **Forms**: Use React Hook Form with Zod schemas
5. **Styling**: Use Tailwind classes, extend shadcn/ui components
6. **Real-time**: Use Convex for any real-time features

### Common Tasks

#### Creating a New Page
1. Add route in `/app` following App Router conventions
2. Use layout from parent directory or create new one
3. Implement data fetching in server component
4. Add any client interactivity in separate client components

#### Adding Database Models
1. Update `/prisma/schema.prisma`
2. Run `npm run db:push` to update database
3. Run `npm run db:generate` to update Prisma client
4. Create server actions in `/lib/actions` for CRUD operations

#### Implementing Forms
1. Create Zod schema for validation
2. Use React Hook Form with zodResolver
3. Create server action for form submission
4. Use form components from `/components/ui`

### Environment Variables

Critical environment variables needed:
- `DATABASE_URL` - Planetscale connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk auth
- `CLERK_SECRET_KEY` - Clerk auth
- `CLERK_WEBHOOK_SECRET` - For user sync
- `CONVEX_DEPLOYMENT` - Convex database
- `NEXT_PUBLIC_CONVEX_URL` - Convex client URL
- `UPLOADTHING_TOKEN` - File uploads
- `ELEVEN_LABS_API_KEY` - Text-to-speech
- `OPENAI_API_KEY` - AI features
- `STRIPE_SECRET_KEY` - Payments (future)
- `STRIPE_WEBHOOK_SECRET` - Payment webhooks (future)

### Security Considerations

- All routes under `/dashboard`, `/api/courses/create`, `/api/user`, `/profile` are protected
- Clerk webhook endpoint validates signatures
- Database queries use Prisma's built-in SQL injection protection
- File uploads are validated by Uploadthing
- Environment variables are properly scoped (NEXT_PUBLIC_ for client)

### Performance Optimization

- Turbopack enabled for faster development builds
- Server components reduce client bundle size
- Parallel data fetching in server components
- Image optimization with Next.js Image component
- Database queries optimized with Prisma relations

### Current Development Focus

Based on CREATOR_MARKETPLACE_PIVOT.md, current priorities are:
1. Creator storefront pages
2. Per-creator subscription system
3. Revenue sharing implementation
4. Creator analytics dashboard
5. Enhanced store customization
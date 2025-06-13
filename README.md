# PPR Academy - Music Production Learning Platform

A modern full-stack Next.js application for music production education, built with App Router, Prisma, Tailwind CSS, shadcn/ui, Clerk authentication, and Planetscale.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Planetscale (MySQL) with Prisma ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS + shadcn/ui components
- **Language**: TypeScript

## Features

- 🎵 Browse and enroll in music production courses
- 📚 Track learning progress
- 👨‍🏫 Create and manage courses as an instructor
- 🎯 Featured and popular course sections
- 📊 User dashboard with statistics
- 🔐 Secure authentication with Clerk

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Planetscale account
- Clerk account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ppr-academy.git
cd ppr-academy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```env
# Clerk Authentication (get these from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk URLs (optional - Clerk will use defaults if not set)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook Secret (for syncing users to database)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Database
DATABASE_URL="mysql://username:password@host.planetscale.com/database-name?sslaccept=strict"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Push the database schema:
```bash
npm run db:push
```

5. Generate Prisma client:
```bash
npm run db:generate
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Setting Up Clerk

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application in the Clerk dashboard
3. Copy your API keys from the Clerk dashboard
4. Add the keys to your `.env.local` file
5. Configure your sign-in and sign-up URLs in the Clerk dashboard (optional)

### Setting Up Webhooks (Important!)

To sync Clerk users with your database:

1. Go to the Clerk Dashboard → Webhooks
2. Click "Add Endpoint"
3. Set the endpoint URL to: `https://your-domain.com/api/webhooks/clerk`
   - For local development with ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
4. Select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the signing secret and add it to your `.env.local` as `CLERK_WEBHOOK_SECRET`

## Database Schema

The application uses the following main models:

- **User**: Store user information (synced with Clerk)
- **Course**: Course details including title, description, price, and instructor
- **Enrollment**: Track user enrollments and progress

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/
│   │   └── webhooks/    # Webhook endpoints
│   │       └── clerk/   # Clerk webhook handler
├── components/          
│   ├── ui/              # shadcn/ui components
│   └── ...              # Custom components
├── hooks/
│   └── useAuth.ts       # Clerk authentication hook
├── lib/                 
│   ├── prisma.ts        # Prisma client instance
│   ├── data.ts          # Server-side data fetching functions
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Utility functions
├── prisma/
│   └── schema.prisma    # Database schema
├── middleware.ts        # Clerk middleware for route protection
└── public/              # Static assets
```

## Protected Routes

The following routes are protected by Clerk authentication:
- `/dashboard/*` - User dashboard
- `/courses/create/*` - Course creation
- `/api/courses/create/*` - Course creation API
- `/api/user/*` - User API endpoints
- `/profile/*` - User profile

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# Database URL for Planetscale
DATABASE_URL="mysql://username:password@host/database?ssl={\"rejectUnauthorized\":true}"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Clerk URLs (optional - defaults are fine)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App URL (for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Course Generator (optional - for admin AI course generation)
OPENAI_API_KEY=sk_your_openai_api_key_here
TAVILY_API_KEY=tvly_your_tavily_api_key_here
```

### Setting up Planetscale

1. Create a Planetscale account at https://planetscale.com
2. Create a new database
3. Go to "Connect" and select "Connect with Prisma"
4. Copy the connection string and replace it in your `.env.local` file

### Setting up AI Course Generator (Optional)

The admin dashboard includes an AI course generator that can create comprehensive music production courses. To enable this feature:

1. **OpenAI API Key**:
   - Sign up at https://platform.openai.com
   - Go to API Keys and create a new key
   - Add it as `OPENAI_API_KEY` in your `.env.local`

2. **Tavily API Key** (for web research):
   - Sign up at https://tavily.com
   - Get your API key from the dashboard
   - Add it as `TAVILY_API_KEY` in your `.env.local`

**Note**: These keys are optional. If not provided, the AI course generator will use fallback methods with curated content.

## 🚀 Migrating to Course Slugs (Safe Migration Guide)

The application now supports SEO-friendly course URLs using slugs instead of IDs. Here's how to safely migrate your existing data:

### Step 1: Apply Schema Changes

```bash
# This will add the optional slug field without breaking existing data
npx prisma db push
```

Answer **Yes** when prompted - this is now safe because the slug field is optional.

### Step 2: Generate New Prisma Client

```bash
npx prisma generate
```

### Step 3: Populate Slugs for Existing Courses

You can do this through Prisma Studio or directly in your database:

**Option A: Using Prisma Studio (Recommended)**
```bash
npx prisma studio
```
1. Open the Course table
2. For each course, click to edit the slug field
3. Add a URL-friendly version of the title (e.g., "Advanced Vocal Processing" → "advanced-vocal-processing")

**Option B: Using SQL (Advanced)**
```sql
-- Example: Update course slugs based on titles
UPDATE Course SET slug = 'advanced-vocal-processing' WHERE title LIKE '%Advanced Vocal Processing%';
UPDATE Course SET slug = 'basic-beat-making' WHERE title LIKE '%Basic Beat Making%';
```

### Step 4: Verify Migration

After adding slugs to all courses, test the new URLs:
- Old: `/courses/cuid123`
- New: `/courses/advanced-vocal-processing`

### Step 5: Make Slug Required (Optional)

Once all courses have slugs, you can make the field required:

1. Update `prisma/schema.prisma`: change `slug String?` to `slug String`
2. Run `npx prisma db push`

This migration transforms URLs from `/courses/cuid123` to `/courses/advanced-vocal-processing` for better SEO and user experience.

### Content Scraper Features

The admin dashboard includes a powerful content scraper for research and course development:

**YouTube Video Processing:**
- Extract video transcripts with retry logic for reliability
- Fix transcription errors using AI for better readability
- Support for multiple languages and auto-generated captions
- Metadata extraction (title, author, description)

**Article & Blog Scraping:**
- Extract main content while filtering out navigation and ads
- AI-powered content cleaning and formatting
- Metadata extraction (author, publish date, description)
- Intelligent content selector fallbacks

**AI Enhancement:**
- Automatic text chunking for vector storage
- OpenAI embedding generation for semantic search
- Content optimization for educational use
- Preserves original meaning while improving readability

**Usage:**
1. Go to Admin Dashboard → Content Scraper tab
2. Enter a YouTube URL or article URL
3. Choose whether to fix transcription errors (YouTube only)
4. Click "Scrape Content" to extract and process
5. View extracted content, metadata, and text chunks

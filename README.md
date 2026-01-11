# PPR Academy - Music Production Learning Platform

A modern full-stack Next.js application for music production education and creator marketplace, built with App Router, Convex, Tailwind CSS, shadcn/ui, Clerk authentication, and Stripe.

## Tech Stack

- **Framework**: Next.js 15 with App Router + Turbopack
- **Database**: Convex (real-time NoSQL backend)
- **Authentication**: Clerk
- **Payments**: Stripe (+ Stripe Connect for creator payouts)
- **Email**: Resend with React Email templates
- **File Storage**: UploadThing
- **Styling**: Tailwind CSS + shadcn/ui components
- **Language**: TypeScript 5.7
- **AI**: OpenAI, LangChain, ElevenLabs (TTS), FAL.ai (image generation)

## Features

### For Learners
- Browse and enroll in music production courses
- Track learning progress with completion tracking
- Access purchased content in personal library
- Download digital products (sample packs, presets, MIDI)

### For Creators
- Create and manage courses with modules, lessons, and chapters
- Sell digital products (sample packs, presets, coaching sessions)
- Custom storefront with optional custom domain
- Analytics and revenue tracking
- AI-assisted course generation
- Text-to-speech narration using ElevenLabs

### Platform Features
- Multi-tenant architecture with custom domains
- Credit system for purchases
- Subscription tiers
- Email marketing automation with workflow builder
- Social media integration (Instagram, Discord)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account (free at convex.dev)
- Clerk account
- Stripe account

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

3. Set up Convex:
```bash
npx convex dev
```
This will prompt you to log in and create a new Convex project.

4. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...

# File Storage (UploadThing)
UPLOADTHING_TOKEN=...
UPLOADTHING_SECRET=...

# AI Services (Optional)
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
TAVILY_API_KEY=tvly_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_CLERK_ID=user_...
```

5. Run the development server:
```bash
npm run dev
```

This runs Next.js, Convex, and Stripe webhook listener concurrently.

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Setting Up Clerk

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application in the Clerk dashboard
3. Copy your API keys to `.env.local`

### Setting Up Webhooks

To sync Clerk users with Convex:

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Creator dashboard (route group)
│   ├── [slug]/             # Public storefronts
│   ├── api/                # API routes & webhooks
│   ├── courses/            # Course pages
│   ├── marketplace/        # Marketplace UI
│   └── ...
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── dashboard/          # Dashboard components
│   └── ...
├── convex/                 # Convex backend
│   ├── schema.ts           # Database schema
│   ├── courses.ts          # Course functions
│   ├── users.ts            # User functions
│   └── ...
├── lib/                    # Utilities
├── hooks/                  # Custom React hooks
├── emails/                 # React Email templates
└── public/                 # Static assets
```

## Database Schema

The application uses Convex with 60+ tables including:

- **users** - User profiles synced from Clerk
- **courses**, **courseModules**, **courseLessons**, **courseChapters** - Course structure
- **digitalProducts** - All product types
- **purchases** - Transaction history
- **enrollments** - User course access
- **stores** - Creator storefronts
- **credits** - User credit balances
- **emailWorkflows** - Email automation

## Scripts

```bash
npm run dev          # Start dev server (Next + Convex + Stripe)
npm run dev:next     # Next.js only
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript checking
npx convex dev       # Convex development
npx convex deploy    # Deploy Convex to production
```

## Protected Routes

Routes protected by Clerk authentication:
- `/dashboard/*` - User dashboard
- `/library/*` - User's purchased content
- `/home/*` - Creator dashboard
- `/courses/create/*` - Course creation
- `/profile/*` - User profile

## Course Structure

Courses are organized hierarchically:
- **Courses** contain multiple modules
- **Modules** contain multiple lessons
- **Lessons** contain multiple chapters
- **Chapters** contain the actual content (text, video, audio)

## Audio Generation (ElevenLabs)

To enable text-to-speech for course chapters:

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Add `ELEVENLABS_API_KEY` to environment variables
3. When editing chapters, select a voice and generate audio

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Convex Production

```bash
npx convex deploy
```

## CI/CD

GitHub Actions workflow (`.github/workflows/type-check.yml`) runs:
- TypeScript type checking
- Convex schema validation
- ESLint
- Production build

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

[MIT](https://choosealicense.com/licenses/mit/)

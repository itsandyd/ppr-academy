# Technology Stack Reference

> **Last Updated:** 2026-02-19
> **Pass:** 1 — Foundation

---

## Table of Contents

- [1. Framework & Runtime](#1-framework--runtime)
- [2. Backend & Database](#2-backend--database)
- [3. Authentication](#3-authentication)
- [4. Payments](#4-payments)
- [5. UI Library & Components](#5-ui-library--components)
- [6. AI & Machine Learning](#6-ai--machine-learning)
- [7. PDF & Document Generation](#7-pdf--document-generation)
- [8. Email](#8-email)
- [9. Video & Audio](#9-video--audio)
- [10. Image Processing](#10-image-processing)
- [11. Analytics & Monitoring](#11-analytics--monitoring)
- [12. File Uploads](#12-file-uploads)
- [13. Rate Limiting & Caching](#13-rate-limiting--caching)
- [14. Testing](#14-testing)
- [15. Dev Tools & Build](#15-dev-tools--build)
- [16. Social Media SDKs](#16-social-media-sdks)
- [17. Utility Libraries](#17-utility-libraries)
- [18. Scripts](#18-scripts)

---

## 1. Framework & Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.3.6 | React meta-framework (App Router, SSR, API routes) |
| `react` | 19.0.1 | UI library |
| `react-dom` | 19.0.1 | React DOM renderer |
| `typescript` | 5.7.3 | Type safety |
| `turbopack` | (bundled with Next.js 15) | Dev server bundler (via `next dev --turbopack`) |

## 2. Backend & Database

| Package | Version | Purpose |
|---------|---------|---------|
| `convex` | 1.31.4 | Real-time BaaS (database, functions, file storage) |
| `@convex-dev/workflow` | 0.2.0 | Durable workflow engine for multi-step processes |
| `@convex-dev/ratelimiter` | 0.1.1 | Server-side rate limiting |
| `@convex-dev/aggregate` | 0.1.19 | Data aggregation utilities |
| `convex-helpers` | 0.1.77 | Community utility functions |

## 3. Authentication

| Package | Version | Purpose |
|---------|---------|---------|
| `@clerk/nextjs` | 6.21.0 | Clerk integration for Next.js (middleware, components, hooks) |
| `svix` | 1.62.0 | Webhook signature verification (used by Clerk webhooks) |

## 4. Payments

| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | 18.5.0 | Stripe SDK (checkout, connect, subscriptions, webhooks) |

## 5. UI Library & Components

### Design System Core

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 3.4.17 | Utility-first CSS framework |
| `tailwindcss-animate` | 1.0.7 | Animation utilities for Tailwind |
| `tailwind-merge` | 2.7.0 | Intelligent class name merging (`cn()` utility) |
| `clsx` | 2.1.1 | Conditional class name builder |
| `class-variance-authority` | 0.7.1 | Variant-based component styling |

### Radix UI Primitives (shadcn/ui foundation)

| Package | Version | Component |
|---------|---------|-----------|
| `@radix-ui/react-accordion` | 1.2.3 | Accordion |
| `@radix-ui/react-alert-dialog` | 1.1.6 | Alert dialogs |
| `@radix-ui/react-avatar` | 1.1.3 | Avatar |
| `@radix-ui/react-checkbox` | 1.1.4 | Checkbox |
| `@radix-ui/react-collapsible` | 1.1.3 | Collapsible sections |
| `@radix-ui/react-context-menu` | 2.2.6 | Context menus |
| `@radix-ui/react-dialog` | 1.1.6 | Dialogs/modals |
| `@radix-ui/react-dropdown-menu` | 2.1.6 | Dropdown menus |
| `@radix-ui/react-hover-card` | 1.1.6 | Hover cards |
| `@radix-ui/react-label` | 2.1.2 | Form labels |
| `@radix-ui/react-menubar` | 1.1.6 | Menubars |
| `@radix-ui/react-navigation-menu` | 1.2.5 | Navigation menus |
| `@radix-ui/react-popover` | 1.1.6 | Popovers |
| `@radix-ui/react-progress` | 1.1.2 | Progress bars |
| `@radix-ui/react-radio-group` | 1.2.3 | Radio groups |
| `@radix-ui/react-scroll-area` | 1.2.3 | Scrollable areas |
| `@radix-ui/react-select` | 2.1.6 | Select dropdowns |
| `@radix-ui/react-separator` | 1.1.2 | Separators |
| `@radix-ui/react-slider` | 1.2.3 | Sliders |
| `@radix-ui/react-slot` | 1.1.2 | Slot composition |
| `@radix-ui/react-switch` | 1.1.3 | Toggle switches |
| `@radix-ui/react-tabs` | 1.1.3 | Tabs |
| `@radix-ui/react-toast` | 1.2.6 | Toast notifications |
| `@radix-ui/react-toggle` | 1.1.2 | Toggle buttons |
| `@radix-ui/react-toggle-group` | 1.1.2 | Toggle button groups |
| `@radix-ui/react-tooltip` | 1.1.8 | Tooltips |

### Additional UI Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | 0.483.0 | Icon library (primary icon set) |
| `cmdk` | 1.0.4 | Command palette / search (⌘K) |
| `embla-carousel-react` | 8.6.0 | Carousel component |
| `input-otp` | 1.4.2 | OTP input component |
| `react-day-picker` | 9.7.0 | Date picker |
| `react-resizable-panels` | 2.1.7 | Resizable panel layouts |
| `vaul` | 1.1.2 | Drawer component |
| `sonner` | 1.7.4 | Toast notification library |
| `react-hot-toast` | 2.5.2 | Alternative toast notifications |
| `react-confetti` | 6.2.2 | Confetti animation effects |
| `framer-motion` | 12.6.2 | Animation library |
| `react-beautiful-dnd` | 13.1.1 | Drag and drop |
| `@hello-pangea/dnd` | 18.0.1 | Updated drag and drop (React 18+ fork) |
| `react-dropzone` | 14.3.8 | File drop zone |
| `react-icons` | 5.5.0 | Additional icon set |
| `react-quill` | 2.0.0 | Rich text editor |
| `@tiptap/*` | 2.12+ | Advanced rich text editor framework |

### Charts & Data Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | 2.15.3 | Chart library (dashboard analytics) |

### Workflow / Node Editor

| Package | Version | Purpose |
|---------|---------|---------|
| `@xyflow/react` | 12.6.2 | Node-based visual workflow editor (email automations) |

## 6. AI & Machine Learning

| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | 5.3.0 | OpenAI API client (GPT-4o, GPT-4o-mini) |
| `langchain` | 0.3.28 | LLM orchestration framework |
| `@langchain/core` | 0.3.55 | LangChain core abstractions |
| `@langchain/openai` | 0.5.10 | LangChain OpenAI integration |
| `@langchain/community` | 0.3.50 | LangChain community integrations |
| `@langchain/langgraph` | 0.2.81 | Agent graph orchestration |
| `ai` | 4.3.16 | Vercel AI SDK (streaming responses) |
| `@ai-sdk/openai` | 1.3.22 | Vercel AI SDK OpenAI provider |
| `@tavily/core` | 0.0.7 | Web search API for AI research |

## 7. PDF & Document Generation

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-pdf/renderer` | 4.3.0 | React-based PDF generation |
| `jspdf` | 3.0.1 | Programmatic PDF creation |
| `html2canvas` | 1.4.1 | HTML to canvas conversion (for PDF screenshots) |

## 8. Email

| Package | Version | Purpose |
|---------|---------|---------|
| `resend` | 4.5.1 | Email sending API |
| `@react-email/components` | 0.0.36 | React Email component library |
| `react-email` | 3.0.7 | Email template framework |
| `react-email-renderer` | 1.0.2 | Server-side email rendering |

## 9. Video & Audio

| Package | Version | Purpose |
|---------|---------|---------|
| `@mux/mux-player-react` | 3.4.0 | Mux video player component |
| `@mux/mux-node` | 9.0.1 | Mux server SDK (upload, transcoding) |
| `remotion` | 4.0.332 | Programmatic video rendering |
| `@remotion/cli` | 4.0.332 | Remotion CLI tools |
| `@remotion/renderer` | 4.0.332 | Remotion server-side rendering |
| `@remotion/bundler` | 4.0.332 | Remotion asset bundler |
| `@remotion/lambda` | 4.0.332 | Remotion Lambda rendering |
| `wavesurfer.js` | 7.9.0 | Audio waveform visualization |
| `lamejs` | 1.2.1 | MP3 encoding in JavaScript |
| `audiobuffer-to-wav` | 1.0.0 | Audio format conversion |

## 10. Image Processing

| Package | Version | Purpose |
|---------|---------|---------|
| `sharp` | 0.33.5 | Server-side image processing |
| `@fal-ai/client` | 1.2.3 | FAL AI image generation |

## 11. Analytics & Monitoring

| Package | Version | Purpose |
|---------|---------|---------|
| `@sentry/nextjs` | 9.15.0 | Error tracking & performance monitoring |
| `@vercel/analytics` | 1.5.0 | Vercel web analytics |

## 12. File Uploads

| Package | Version | Purpose |
|---------|---------|---------|
| `uploadthing` | 7.6.0 | File upload service |
| `@uploadthing/react` | 7.3.0 | UploadThing React components |

## 13. Rate Limiting & Caching

| Package | Version | Purpose |
|---------|---------|---------|
| `@upstash/ratelimit` | 2.0.5 | Redis-based rate limiting |
| `@upstash/redis` | 1.34.6 | Redis client for Upstash |

## 14. Testing

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | 2.1.8 | Unit test runner |
| `@playwright/test` | 1.52.0 | E2E browser testing |
| `convex-test` | 0.0.38 | Convex function testing utilities |

## 15. Dev Tools & Build

| Package | Version | Purpose |
|---------|---------|---------|
| `eslint` | 8.57.1 | Code linting |
| `eslint-config-next` | 15.1.3 | Next.js ESLint rules |
| `prettier` | (config in `.prettierrc`) | Code formatting |
| `postcss` | 8.5.1 | CSS processing |
| `autoprefixer` | 10.4.20 | CSS vendor prefixing |
| `concurrently` | 9.1.2 | Run multiple dev processes simultaneously |
| `husky` | (in `.husky/`) | Git hooks |
| `stripe` (CLI) | (via npm script) | Stripe webhook listener for local dev |

### Dev Scripts

```json
{
  "dev": "concurrently \"next dev --turbopack\" \"npx convex dev\" \"stripe listen --forward-to localhost:3000/api/webhooks/stripe\"",
  "build": "next build",
  "lint": "next lint",
  "test": "vitest",
  "typecheck": "tsc --noEmit"
}
```

## 16. Social Media SDKs

| Package | Version | Purpose |
|---------|---------|---------|
| `spotify-web-api-node` | 5.0.2 | Spotify API integration |
| `googleapis` | (via OAuth) | YouTube, Google auth |
| Custom OAuth implementations | — | Instagram, TikTok, Twitter/X, LinkedIn, Discord |

## 17. Utility Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | 4.1.0 | Date manipulation |
| `zod` | 3.24.2 | Schema validation |
| `uuid` | 11.1.0 | UUID generation |
| `nanoid` | 5.1.5 | Short unique ID generation |
| `slugify` | 1.6.6 | URL slug generation |
| `qrcode` | 1.5.4 | QR code generation |
| `jszip` | 3.10.1 | ZIP file creation (sample pack bundling) |
| `cheerio` | 1.0.0 | Server-side HTML parsing (content scraping) |
| `sanitize-html` | 2.15.0 | HTML sanitization |
| `marked` | 15.0.7 | Markdown to HTML |
| `jsonrepair` | 3.12.0 | Repair malformed JSON (AI output cleanup) |
| `music-metadata` | 10.6.5 | Audio file metadata parsing |
| `fuse.js` | 7.1.0 | Fuzzy search |
| `@dnd-kit/*` | 6.3+ | Drag and drop toolkit |
| `react-hook-form` | 7.54.2 | Form management |
| `country-list` | 2.3.0 | Country name/code lookup |
| `canvas-confetti` | 1.9.3 | Confetti effects |
| `next-themes` | 0.4.6 | Dark/light theme support |

## 18. Scripts

The project uses `concurrently` to run three processes simultaneously during development:

1. **Next.js dev server** — `next dev --turbopack` (port 3000)
2. **Convex dev server** — `npx convex dev` (syncs schema, generates types)
3. **Stripe webhook listener** — `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

*NEEDS EXPANSION IN PASS 2: Exact versions of all Radix packages, internal library dependencies (convex helpers), Remotion composition details.*

# COMPONENTS KNOWLEDGE

React components for PPR Academy. Tailwind CSS + shadcn/ui + Radix.

## STRUCTURE

```
components/
├── ui/                 # shadcn/ui primitives (49 files)
├── admin/              # Admin dashboard components
├── ai/                 # AI chat/agent UI
├── analytics/          # Charts, metrics
├── certificates/       # Course certificates
├── coaching/           # Coaching session UI
├── course/             # Course player, cards
├── credits/            # Credit balance, purchase
├── dashboard/          # Dashboard layouts
├── discord/            # Discord integration
├── editor/             # TipTap rich text
├── follow-gates/       # Social follow modals
├── gamification/       # Achievements, leaderboards
├── monetization/       # Affiliate, coupons
├── music/              # Track players
├── notes/              # Note-taking system
├── onboarding/         # Getting started flows
├── payments/           # Stripe checkout
├── products/           # Product cards
├── qa/                 # Q&A sections
├── samples/            # Sample marketplace
├── shared/             # Cross-cutting components
├── social-media/       # Social integrations
├── storefront/         # Public store pages
└── workflow/           # Email automation builder
```

## WHERE TO LOOK

| Task                 | Location                               |
| -------------------- | -------------------------------------- |
| Add primitive        | `ui/` - follow shadcn patterns         |
| Add dashboard widget | `dashboard/`                           |
| Add course feature   | `course/`                              |
| Add admin feature    | `admin/`                               |
| Add form component   | Use `ui/` primitives + React Hook Form |

## UI CONVENTIONS

### Backgrounds (CRITICAL)

```tsx
// Toast notifications
<Toast className="bg-white dark:bg-black" />

// Dropdown menus
<DropdownMenuContent className="bg-white dark:bg-black">
```

### Form Patterns

```tsx
// Required fields: red asterisk
<Label>Name <span className="text-red-500">*</span></Label>

// Validation errors: red border + inline message
<Input className={errors.field ? "border-red-500" : ""} />
{errors.field && <p className="text-red-500 text-sm">{errors.field.message}</p>}
```

### Client Components

Only add `"use client"` when needed:

- Using hooks (useState, useEffect)
- Event handlers (onClick, onChange)
- Browser APIs

```tsx
"use client";
import { useState } from "react";
```

## SHADCN/UI USAGE

Install new components:

```bash
npx shadcn@latest add button
```

Customize in `ui/` folder. Don't modify node_modules.

## KEY COMPONENTS

| Component | File                          | Purpose            |
| --------- | ----------------------------- | ------------------ |
| Button    | `ui/button.tsx`               | Primary actions    |
| Card      | `ui/card.tsx`                 | Content containers |
| Dialog    | `ui/dialog.tsx`               | Modals             |
| Sheet     | `ui/sheet.tsx`                | Side panels        |
| Toast     | `ui/toast.tsx`                | Notifications      |
| Form      | `ui/form-field-with-help.tsx` | Form fields        |
| Editor    | `editor/tiptap-editor.tsx`    | Rich text          |

## ANTI-PATTERNS

| Pattern                          | Fix                                       |
| -------------------------------- | ----------------------------------------- |
| Hardcoded colors                 | Use CSS variables / Tailwind              |
| `className=""` with bg-gray-\*   | Use `bg-white dark:bg-black` for surfaces |
| Missing "use client"             | Add if using hooks/handlers               |
| Direct state in server component | Extract to client component               |

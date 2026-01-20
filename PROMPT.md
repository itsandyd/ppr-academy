# TASK: Enhance the Dashboard Create Product System

You are working on the PPR Academy codebase. Your task is to enhance the unified product creation system located at `app/dashboard/create/`.

## CODEBASE CONTEXT

This is a Next.js 14 app with:
- Convex backend for database and mutations
- TypeScript strict mode
- Framer Motion for animations
- Tailwind CSS + shadcn/ui components
- Clerk for authentication

The product creation system follows this architecture:
- `types.ts` - Shared type definitions for all product categories
- `page.tsx` - Product type selector (entry point)
- `shared/` - Reusable components (CreationLayout, StepProgress, ActionBar, etc.)
- `components/CreationShell.tsx` - Main wizard shell with progress tracking
- Each product type has its own folder with:
  - `context.tsx` - React Context for state management
  - `page.tsx` - Step router and layout
  - `steps/*.tsx` - Individual form step components
  - `layout.tsx` - Provider wrapper

## ENHANCEMENT OBJECTIVES

### Phase 1: Audit & Analysis
1. Read ALL files in `app/dashboard/create/` to understand current state
2. Identify code duplication across product type folders
3. Map all context providers and their state shapes
4. List all step components and their validation logic
5. Create a mental model of the data flow

### Phase 2: Consolidation
1. Extract common form patterns into reusable hooks:
   - `useFormStep(stepId)` - handles step navigation, validation, auto-save
   - `useProductCreation<T>()` - generic context hook with proper typing
2. Create a unified validation schema system using Zod
3. Consolidate duplicate components (FileUploader appears 3+ times)
4. Create a generic `ProductCreationProvider` that can be configured per product type

### Phase 3: UX Improvements
1. Add optimistic updates when saving drafts
2. Implement auto-save with debouncing (save every 5 seconds of inactivity)
3. Add undo/redo support for form changes
4. Improve loading states with skeleton components
5. Add keyboard shortcuts (Cmd+S to save, Cmd+Enter to proceed)

### Phase 4: Type Safety
1. Ensure all product types extend a base `ProductFormData` interface
2. Add discriminated unions for pricing-dependent fields
3. Create strict types for Convex mutations
4. Add runtime validation at context boundaries

### Phase 5: Testing & Verification
1. Run `npm run typecheck` - must pass with zero errors
2. Run `npm run lint` - must pass with zero errors
3. Run `npm run build` - must complete successfully
4. Verify each product creation flow still works:
   - Navigate to `/dashboard/create`
   - Select each product type
   - Confirm wizard loads without errors

## COMPLETION CRITERIA

You must satisfy ALL of the following before outputting the completion signal:

- [ ] All duplicate FileUploader components consolidated into one
- [ ] Created `useFormStep` hook used by at least 3 step components
- [ ] Auto-save implemented in at least 2 product contexts
- [ ] Zod validation schemas created for pack, course, and PDF products
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` completes successfully
- [ ] No new TypeScript `any` types introduced
- [ ] All existing functionality preserved (no regressions)

## SELF-CORRECTION PATTERN

After each code change:
1. Run `npm run typecheck` - if errors, fix them before proceeding
2. If you're stuck on a type error for >2 attempts, step back and reconsider the approach
3. Check that imports resolve correctly
4. Verify no circular dependencies introduced

## IMPORTANT CONSTRAINTS

- DO NOT create new product types
- DO NOT modify Convex schema or mutations
- DO NOT change routing paths
- PRESERVE all existing functionality
- Keep changes minimal and focused
- Prefer editing existing files over creating new ones

## OUTPUT FORMAT

When working, output your progress as:
```
[PHASE X] Working on: <description>
[ACTION] <file>: <change description>
[VERIFY] <command>: <result>
```

## COMPLETION SIGNAL

Only output this AFTER all criteria are met AND all verification commands pass:

<promise>COMPLETE</promise>

If you cannot complete a criterion, explain why and output:

<promise>BLOCKED: <reason></promise>

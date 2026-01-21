# Task: Separate Tip Jar into Its Own Product Type

## Objective
Extract tip jar from the digital products flow and create a dedicated, standalone product type with its own creation flow at `/dashboard/create/tip-jar`.

## Current State
- Tip jar lives in `/app/dashboard/create/digital/` sharing infrastructure with digital products
- Uses `digitalProducts` table with `productCategory: "tip-jar"`
- Special UI logic scattered in PricingStep.tsx and BasicsStep.tsx
- Mapped via `CATEGORY_TO_FLOW["tip-jar"] = "digital"` in types.ts

## Completion Criteria
All of the following must be true:
1. New route exists: `/app/dashboard/create/tip-jar/page.tsx`
2. Tip jar has its own simplified 2-step flow (Basics → Publish, no complex pricing step)
3. `CATEGORY_TO_FLOW["tip-jar"] = "tip-jar"` (own flow, not "digital")
4. Product selector in dashboard routes to new tip-jar flow
5. All existing tip jar products continue to work (backward compatible)
6. `npm run typecheck` passes with 0 errors
7. `npm run lint` passes with 0 errors
8. `npm run build` passes

## Implementation Phases

### Phase 1: Create Tip Jar Route Structure
1. Create `/app/dashboard/create/tip-jar/page.tsx`
2. Create simplified TipJarCreator component with:
   - Step 1: Basics (title, description, image, tags)
   - Step 2: Publish (suggested amount + publish button)
3. Suggested tip amount field inline in publish step (no separate pricing step needed)

### Phase 2: Update Type Mappings
1. In `types.ts`: Change `CATEGORY_TO_FLOW["tip-jar"]` from `"digital"` to `"tip-jar"`
2. Add `"tip-jar"` to `ProductFlow` union type if needed
3. Update any `getFlowPath()` or routing logic

### Phase 3: Create Tip Jar Specific Components
1. Create `/app/dashboard/create/tip-jar/components/TipJarBasicsStep.tsx`
2. Create `/app/dashboard/create/tip-jar/components/TipJarPublishStep.tsx`
3. Keep UI simple: coffee icon, friendly copy, suggested amount slider

### Phase 4: Clean Up Digital Products Flow
1. Remove tip-jar special cases from `/app/dashboard/create/steps/PricingStep.tsx`
2. Remove tip-jar placeholders from `/app/dashboard/create/steps/BasicsStep.tsx`
3. Digital flow should no longer know about tip jars

### Phase 5: Verification
1. Run `npm run typecheck` - fix any errors
2. Run `npm run lint` - fix any errors
3. Run `npm run build` - ensure it succeeds
4. Manually verify routing works in browser if possible

## Self-Correction Rules
- If typecheck fails → read error messages → fix type issues → re-run
- If lint fails → run `npm run lint -- --fix` → manually fix remaining → re-run
- If build fails → analyze error → fix issue → re-run
- If imports are broken → check file paths → fix imports → re-run
- Maximum 5 attempts per verification step before escalating

## Do NOT
- Change the database schema (keep using digitalProducts table)
- Modify Stripe/payment logic
- Break existing tip jar products
- Add new npm dependencies
- Over-engineer - keep it simple

## Completion Signal
When ALL verification steps pass and the tip jar has its own dedicated flow, output:

<promise>TIP_JAR_SEPARATION_COMPLETE</promise>

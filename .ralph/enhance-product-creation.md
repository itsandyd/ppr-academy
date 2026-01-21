# Enhanced Product Creation Flow

## COMPLETION CRITERIA
All of the following must be true:
- [ ] Unified validation layer exists at `app/dashboard/create/shared/validation.ts`
- [ ] AI content assistant integrated into all basics forms
- [ ] Auto-save with draft recovery working for all product types
- [ ] Real-time storefront preview updates as user types
- [ ] Mobile viewport (<768px) fully functional for all creation flows
- [ ] Zero TypeScript errors: `npm run typecheck` passes
- [ ] Zero lint errors: `npm run lint` passes
- [ ] Build succeeds: `npm run build` passes

<promise>COMPLETE</promise>

---

## CONTEXT

### Product Types (20+)
Located in `app/dashboard/create/types.ts`:
- **Packs**: sample-pack, preset-pack, midi-pack → `/dashboard/create/pack`
- **Beat Lease**: beat-lease → `/dashboard/create/beat-lease`
- **Courses**: course, workshop → `/dashboard/create/course`
- **Services**: mixing-service, mastering-service → `/dashboard/create/service`
- **Coaching**: coaching → `/dashboard/create/coaching`
- **Effect Chains**: effect-chain → `/dashboard/create/chain`
- **PDFs**: pdf, cheat-sheet → `/dashboard/create/pdf`
- **Bundles**: bundle → `/dashboard/create/bundle`
- **Memberships**: membership → `/dashboard/create/membership`
- **Playlist Curation**: playlist-curation → `/dashboard/create/playlist-curation`

### Current Flow Pattern
Each product type follows:
1. `page.tsx` - Route with step switching via `?step=` param
2. `context.tsx` - React context with state & mutations
3. `layout.tsx` - Shared layout wrapper
4. `steps/*.tsx` - Individual step form components

### Existing AI Integration
- Thumbnail generation at `/api/generate-thumbnail`
- Used in `PackBasicsForm.tsx` with "AI Generate" button

---

## PHASE 1: Audit & Document Current State

### Tasks
1. Read all context files to understand state shapes:
   ```
   app/dashboard/create/pack/context.tsx
   app/dashboard/create/beat-lease/context.tsx
   app/dashboard/create/course/context.tsx
   app/dashboard/create/service/context.tsx
   app/dashboard/create/coaching/context.tsx
   app/dashboard/create/chain/context.tsx
   app/dashboard/create/pdf/context.tsx
   app/dashboard/create/bundle/context.tsx
   app/dashboard/create/membership/context.tsx
   app/dashboard/create/playlist-curation/context.tsx
   ```

2. Document which fields are:
   - Required vs optional per product type
   - Currently validated vs not validated
   - Have AI assistance vs need it

3. Identify shared patterns that can be extracted

### Verification
```bash
npx tsc --noEmit
```

### Checkpoint
<promise>PHASE_1_COMPLETE</promise>

---

## PHASE 2: Unified Validation Layer

### Tasks
1. Create `app/dashboard/create/shared/validation.ts`:
   ```typescript
   import { z } from "zod";

   // Base schema all products share
   export const baseProductSchema = z.object({
     title: z.string().min(3, "Title must be at least 3 characters").max(100),
     description: z.string().min(10, "Description must be at least 10 characters").max(5000),
     imageUrl: z.string().url().optional(),
     tags: z.array(z.string()).max(10).optional(),
     pricingModel: z.enum(["free_with_gate", "paid"]),
     price: z.number().min(0).optional(),
   });

   // Pack-specific
   export const packSchema = baseProductSchema.extend({
     packType: z.enum(["sample-pack", "preset-pack", "midi-pack"]),
     genre: z.string().optional(),
     bpm: z.number().min(1).max(300).optional(),
     key: z.string().optional(),
   });

   // Beat lease specific
   export const beatLeaseSchema = baseProductSchema.extend({
     bpm: z.number().min(1).max(300),
     key: z.string(),
     genre: z.string(),
     licenses: z.array(z.object({
       type: z.enum(["free", "basic", "premium", "exclusive"]),
       price: z.number().min(0),
       enabled: z.boolean(),
     })),
   });

   // Add schemas for all other product types...
   ```

2. Create validation hook `app/dashboard/create/shared/useValidation.ts`:
   ```typescript
   export function useProductValidation<T extends z.ZodSchema>(
     schema: T,
     data: z.infer<T>
   ) {
     const result = schema.safeParse(data);
     return {
       isValid: result.success,
       errors: result.success ? {} : result.error.flatten().fieldErrors,
       canProceed: result.success,
     };
   }
   ```

3. Integrate validation into each step form's "Continue" button

### Verification
```bash
npm run typecheck
```

### Checkpoint
<promise>PHASE_2_COMPLETE</promise>

---

## PHASE 3: AI Content Assistant

### Tasks
1. Create `app/dashboard/create/shared/AIContentAssistant.tsx`:
   ```typescript
   interface AIAssistantProps {
     productType: ProductCategory;
     currentData: Record<string, any>;
     onSuggest: (field: string, value: string) => void;
   }

   export function AIContentAssistant({ productType, currentData, onSuggest }: AIAssistantProps) {
     // AI-powered suggestions for:
     // - Description generation from title
     // - Tag suggestions based on title/description
     // - Price recommendations based on category
   }
   ```

2. Create API endpoint `/api/generate-content`:
   ```typescript
   // Generates descriptions, tags, pricing suggestions
   // Uses OpenAI/Claude to analyze product metadata
   ```

3. Add AI buttons to all basics forms:
   - "Generate Description" next to description textarea
   - "Suggest Tags" in tags section
   - "AI Generate" for thumbnails (already exists in pack)

4. Ensure all product types have AI thumbnail generation:
   - Check: course, service, coaching, chain, pdf, bundle, membership, playlist-curation
   - Add missing AI generate buttons

### Verification
```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{"title":"Lo-Fi Drum Kit","productType":"sample-pack"}'
```

### Checkpoint
<promise>PHASE_3_COMPLETE</promise>

---

## PHASE 4: Auto-Save & Draft Recovery

### Tasks
1. Create `app/dashboard/create/shared/AutoSaveProvider.tsx`:
   ```typescript
   export function AutoSaveProvider({ children, productType, productId }: Props) {
     // Debounced save (500ms after last change)
     // Shows "Saving..." / "Saved" indicator
     // Handles offline with retry queue
   }
   ```

2. Update all context providers to:
   - Call auto-save on every state change
   - Load draft on mount if productId exists
   - Show recovery prompt if draft found

3. Add save status indicator to `CreationLayout.tsx`:
   ```typescript
   <div className="text-sm text-muted-foreground">
     {saveStatus === 'saving' && <><Loader2 className="animate-spin" /> Saving...</>}
     {saveStatus === 'saved' && <><Check /> Saved</>}
     {saveStatus === 'error' && <><AlertCircle /> Save failed</>}
   </div>
   ```

4. Add draft recovery modal:
   - On mount, check for existing drafts for this product type
   - Show modal: "Continue editing [Title]?" with options to continue or start fresh

### Verification
```bash
# Manual test:
# 1. Start creating a pack, fill in title
# 2. Close browser tab
# 3. Return to /dashboard/create/pack
# 4. Verify draft recovery prompt appears
```

### Checkpoint
<promise>PHASE_4_COMPLETE</promise>

---

## PHASE 5: Real-Time Preview

### Tasks
1. Enhance `app/dashboard/create/shared/StorefrontPreview.tsx`:
   ```typescript
   interface StorefrontPreviewProps {
     productType: ProductCategory;
     data: Partial<BaseProductFormData>;
     variant?: 'card' | 'detail' | 'both';
   }

   export function StorefrontPreview({ productType, data, variant = 'card' }: Props) {
     // Renders exactly how product will appear in storefront
     // Updates in real-time as data changes
     // Shows skeleton for missing required fields
   }
   ```

2. Ensure preview is shown in all creation flows:
   - Desktop: sticky sidebar (use CreationLayout with preview prop)
   - Mobile: collapsible section at top

3. Add preview toggle in header:
   - "Card View" / "Detail View" toggle
   - Shows different preview layouts

4. Match preview styling exactly to:
   - `app/[slug]/components/ProductCard.tsx`
   - `app/[slug]/[productSlug]/page.tsx`

### Verification
```bash
# Manual test:
# 1. Create product with preview visible
# 2. Type in each field
# 3. Verify preview updates immediately
# 4. Compare to actual published product appearance
```

### Checkpoint
<promise>PHASE_5_COMPLETE</promise>

---

## PHASE 6: Mobile Optimization

### Tasks
1. Audit all step forms at 375px viewport:
   ```bash
   # Use Chrome DevTools device mode
   # Check each: /dashboard/create/pack, /course, /service, etc.
   ```

2. Fix any issues found:
   - Horizontal overflow
   - Touch targets < 44x44px
   - Overlapping elements
   - Unreadable text

3. Mobile-specific improvements:
   - Bottom navigation for step switching
   - Collapsible cards for optional sections
   - Full-screen file upload modal

4. Update `CreationLayout.tsx` for mobile:
   - Stack preview below form
   - Collapsible preview accordion
   - Sticky bottom action bar

### Verification
```bash
# Lighthouse mobile audit
npx lighthouse http://localhost:3000/dashboard/create/pack \
  --only-categories=accessibility,best-practices \
  --chrome-flags="--window-size=375,812"
```

### Checkpoint
<promise>PHASE_6_COMPLETE</promise>

---

## PHASE 7: Final Testing & Polish

### Tasks
1. End-to-end creation test for EACH product type:
   - [ ] sample-pack
   - [ ] preset-pack
   - [ ] midi-pack
   - [ ] beat-lease
   - [ ] course
   - [ ] coaching
   - [ ] mixing-service
   - [ ] mastering-service
   - [ ] effect-chain
   - [ ] pdf
   - [ ] bundle
   - [ ] membership
   - [ ] playlist-curation

2. Edit existing products test:
   - Load existing product into creator
   - Modify fields
   - Save and verify changes persist

3. Accessibility check:
   ```bash
   # Run axe-core on creation pages
   npx axe-cli http://localhost:3000/dashboard/create/pack
   ```

4. Final verification:
   ```bash
   npm run typecheck && npm run lint && npm run build
   ```

### Checkpoint
When all tests pass and all product types work:
<promise>PHASE_7_COMPLETE</promise>

---

## SELF-CORRECTION LOOP

For each task:
1. Read relevant files first
2. Make minimal necessary changes
3. Run verification command
4. If FAIL:
   - Read error message
   - Identify root cause
   - Fix issue
   - Return to step 3
5. If PASS:
   - Mark task complete
   - Proceed to next task

## FILES TO CREATE
- `app/dashboard/create/shared/validation.ts`
- `app/dashboard/create/shared/useValidation.ts`
- `app/dashboard/create/shared/AIContentAssistant.tsx`
- `app/dashboard/create/shared/AutoSaveProvider.tsx`
- `app/api/generate-content/route.ts`

## FILES TO MODIFY
- `app/dashboard/create/shared/CreationLayout.tsx`
- `app/dashboard/create/shared/StorefrontPreview.tsx`
- `app/dashboard/create/*/context.tsx` (all contexts)
- `app/dashboard/create/*/steps/*Form.tsx` (all step forms)

## ESCAPE HATCHES
- If blocked on AI integration: skip Phase 3, continue with other phases
- If Convex mutations fail: check `convex/` schema matches expected types
- If mobile tests fail: prioritize desktop completion first

---

## FINAL SUCCESS SIGNAL

When ALL of the following are true:
1. All 7 phase checkpoints achieved
2. `npm run typecheck` passes
3. `npm run lint` passes
4. `npm run build` passes
5. All product types create successfully
6. All product types edit successfully

Then output:
<promise>COMPLETE</promise>

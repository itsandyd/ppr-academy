# Unified Product Creation System - Architecture Proposal

**Date**: 2025-11-17  
**Status**: Proposal  
**Goal**: Unify all 11 product creation flows with consistent UX while preserving uniqueness

---

## Current State Analysis

You have **11 different product creation flows**:

### Existing Flows

1. ✅ `/products/create` - Universal product creator (most advanced)
2. `/course/create` - Course creation with lessons
3. `/products/pack/create` - Sample/Preset/MIDI packs
4. `/products/coaching-call/create` - 1-on-1 coaching sessions
5. `/products/digital-download/create` - Digital downloads
6. `/products/ableton-rack/create` - Ableton racks/presets
7. `/products/bundle/create` - Product bundles
8. `/products/url-media/create` - URL/media products
9. `/products/lead-magnet` - Lead magnet creator
10. `/email-campaigns/create` - Email campaigns
11. `/automations/create` - Automation workflows

### Common Patterns Found

All flows share:
- ✅ **Step-based wizard** (`?step=basics`, `?step=pricing`, etc.)
- ✅ **Progress indicator** at top
- ✅ **Context/Provider** for state management
- ✅ **Conditional steps** (followGate only if free)
- ✅ **Mobile preview pane** (right side)
- ✅ **Save draft** functionality
- ✅ **Publish** button at end

### Differences (Product-Specific)

- Course: Has **lesson builder** step
- Pack: Has **file uploader** for samples/presets
- Coaching: Has **availability scheduler** 
- Ableton: Has **rack configuration**
- Bundle: Has **product selector**

---

## 🎯 Unified Creation System Architecture

### Core Principle

**"Same shell, different steps"**

Every product gets:
1. Same outer shell (layout, progress, navigation)
2. Same core steps (basics, pricing, publish)
3. Product-specific steps injected where needed
4. Consistent visual language

---

## Proposed Structure

```
app/(dashboard)/store/[storeId]/
  create/
    layout.tsx                    ← UNIFIED shell (all products)
    components/
      UnifiedCreationShell.tsx    ← Shell component
      UnifiedProgressBar.tsx      ← Progress indicator
      UnifiedPreviewPane.tsx      ← Preview panel
      
    # Core shared steps (used by ALL products)
    steps/
      BasicsStep.tsx              ← Title, description, thumbnail
      PricingStep.tsx             ← Free vs Paid decision
      CheckoutStep.tsx            ← Payment config (if paid)
      FollowGateStep.tsx          ← Social gates (if free)
      PublishStep.tsx             ← Review & publish
      
    # Product-specific pages
    course/
      page.tsx                    ← Course wizard entry
      steps/
        LessonsStep.tsx           ← Course-specific: lesson builder
        
    pack/
      page.tsx                    ← Pack wizard entry
      steps/
        FilesStep.tsx             ← Pack-specific: file uploader
        
    coaching/
      page.tsx                    ← Coaching wizard entry
      steps/
        AvailabilityStep.tsx      ← Coaching-specific: calendar
        
    rack/
      page.tsx                    ← Ableton rack entry
      steps/
        RackConfigStep.tsx        ← Rack-specific: device chain
        
    bundle/
      page.tsx                    ← Bundle entry
      steps/
        ProductSelectorStep.tsx   ← Bundle-specific: pick products
        
    digital/
      page.tsx                    ← Digital download entry
```

---

## Step Flow Examples

### Course Creation Flow

```
Step 1: Basics       (shared)
Step 2: Lessons      (course-specific) ⭐
Step 3: Pricing      (shared)
Step 4: Checkout OR Follow Gate (shared, conditional)
Step 5: Options      (shared)
Step 6: Publish      (shared)
```

### Sample Pack Creation Flow

```
Step 1: Basics       (shared)
Step 2: Files        (pack-specific) ⭐
Step 3: Pricing      (shared)
Step 4: Checkout OR Follow Gate (shared, conditional)
Step 5: Publish      (shared)
```

### Coaching Call Creation Flow

```
Step 1: Basics       (shared)
Step 2: Pricing      (shared)
Step 3: Checkout     (shared, coaching is always paid)
Step 4: Availability (coaching-specific) ⭐
Step 5: Options      (shared)
Step 6: Publish      (shared)
```

### Bundle Creation Flow

```
Step 1: Basics       (shared)
Step 2: Products     (bundle-specific) ⭐
Step 3: Pricing      (shared)
Step 4: Publish      (shared)
```

---

## Unified Shell Component

```typescript
// app/(dashboard)/store/[storeId]/create/components/UnifiedCreationShell.tsx

interface UnifiedCreationShellProps {
  productType: ProductType;
  steps: Step[];
  currentStep: string;
  onNavigate: (step: string) => void;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  canPublish: boolean;
  children: React.ReactNode;
  preview?: React.ReactNode;
}

export function UnifiedCreationShell({
  productType,
  steps,
  currentStep,
  onNavigate,
  onSave,
  onPublish,
  canPublish,
  children,
  preview
}: UnifiedCreationShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with progress */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Create {productType}</h1>
              <p className="text-sm text-muted-foreground">
                {steps.find(s => s.id === currentStep)?.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              {canPublish && (
                <Button onClick={onPublish} className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          <UnifiedProgressBar
            steps={steps}
            currentStep={currentStep}
            onNavigate={onNavigate}
          />
        </div>
      </div>
      
      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="lg:col-span-2">
            {children}
          </div>
          
          {/* Preview pane */}
          {preview && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {preview}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Shared Step Components

### 1. BasicsStep (Used by ALL products)

```typescript
// Common fields across all products
- Title (required)
- Description (required)
- Thumbnail (required)
- Category/Tags (optional)
- Product type badge

// Product-specific additions can extend this
```

### 2. PricingStep (Used by ALL products)

```typescript
// Two options:
- Free with download gate
- Paid (one-time or subscription)

// If paid → goes to CheckoutStep
// If free → goes to FollowGateStep
```

### 3. CheckoutStep (Paid products only)

```typescript
// Payment configuration:
- Price
- Currency
- Payment description
- Stripe settings
```

### 4. FollowGateStep (Free products only)

```typescript
// Social gates:
- Require email
- Require Instagram follow
- Require Twitter follow
- Custom message
```

### 5. PublishStep (Used by ALL products)

```typescript
// Final review:
- Preview all settings
- Mark as published or draft
- Return to dashboard
```

---

## Product-Specific Steps (Inserted Between Shared Steps)

### Course → LessonsStep

Insert after Basics, before Pricing

```typescript
// Lesson builder:
- Add/edit/reorder lessons
- Upload videos
- Add text content
- Set lesson order
```

### Pack → FilesStep

Insert after Basics, before Pricing

```typescript
// File uploader:
- Upload samples/presets
- Set file metadata
- Preview audio
- Organize files
```

### Coaching → AvailabilityStep

Insert after Checkout, before Options

```typescript
// Scheduling:
- Set available days/times
- Duration per session
- Buffer time
- Max bookings
```

### Rack → RackConfigStep

Insert after Basics, before Pricing

```typescript
// Ableton config:
- Upload .adg file
- Device chain description
- Preset variations
- Demo audio
```

### Bundle → ProductsStep

Insert after Basics, before Pricing

```typescript
// Product selector:
- Choose products to bundle
- Set bundle discount
- Preview bundle value
```

---

## Step Configuration System

Each product defines its step flow:

```typescript
// app/(dashboard)/store/[storeId]/create/course/config.ts

export const courseSteps: StepConfig[] = [
  { id: 'basics', component: BasicsStep, shared: true },
  { id: 'lessons', component: LessonsStep, shared: false }, // UNIQUE
  { id: 'pricing', component: PricingStep, shared: true },
  { id: 'checkout', component: CheckoutStep, shared: true, conditional: 'paid' },
  { id: 'followGate', component: FollowGateStep, shared: true, conditional: 'free' },
  { id: 'options', component: OptionsStep, shared: true },
  { id: 'publish', component: PublishStep, shared: true },
];
```

```typescript
// app/(dashboard)/store/[storeId]/create/pack/config.ts

export const packSteps: StepConfig[] = [
  { id: 'basics', component: BasicsStep, shared: true },
  { id: 'files', component: FilesStep, shared: false }, // UNIQUE
  { id: 'pricing', component: PricingStep, shared: true },
  { id: 'checkout', component: CheckoutStep, shared: true, conditional: 'paid' },
  { id: 'followGate', component: FollowGateStep, shared: true, conditional: 'free' },
  { id: 'publish', component: PublishStep, shared: true },
];
```

---

## Routing Structure

### Unified Entry Point

```
/store/[storeId]/create              → Product type selector
/store/[storeId]/create/course       → Course creation
/store/[storeId]/create/pack         → Pack creation  
/store/[storeId]/create/coaching     → Coaching creation
/store/[storeId]/create/rack         → Rack creation
/store/[storeId]/create/bundle       → Bundle creation
/store/[storeId]/create/digital      → Digital download
```

### URL Pattern

```
/store/[storeId]/create/[productType]?step=basics
/store/[storeId]/create/course?step=lessons
/store/[storeId]/create/pack?step=files
```

**Benefit**: Consistent URL structure across all products

---

## Visual Consistency

### All Product Creation Pages Have

**Top bar**:
- Product type badge
- Step description
- Save draft button
- Publish button (when ready)

**Progress indicator**:
- Step numbers or icons
- Current step highlighted
- Completed steps checked
- Clickable to jump between steps

**Main area** (2-column on desktop):
- Left: Form (2/3 width)
- Right: Preview pane (1/3 width, sticky)

**Mobile**:
- Single column
- Preview accessible via button/dialog

---

## Implementation Strategy

### Phase 1: Create Unified Shell (Week 1)

**Goal**: Build the shell that all products will use

**Tasks**:
- [ ] Create `UnifiedCreationShell` component
- [ ] Create `UnifiedProgressBar` component
- [ ] Create shared step components (Basics, Pricing, etc.)
- [ ] Build step configuration system
- [ ] Test with one product type (Course)

**Deliverable**: Course creation using unified shell

---

### Phase 2: Migrate Simple Products (Week 2)

**Goal**: Migrate products with minimal unique steps

**Order** (easiest first):
1. Digital Download (just basics + pricing)
2. URL Media (basics + pricing)
3. Lead Magnet (basics + email config)

**Tasks**:
- [ ] Define step config for each
- [ ] Move to unified shell
- [ ] Test creation flow
- [ ] Verify old URLs still work

**Deliverable**: 3 more products using unified system

---

### Phase 3: Migrate Complex Products (Week 3)

**Goal**: Migrate products with unique steps

**Order**:
1. Sample Pack (file uploader)
2. Coaching (availability scheduler)
3. Ableton Rack (device config)
4. Bundle (product selector)

**Tasks**:
- [ ] Build product-specific step components
- [ ] Integrate into unified shell
- [ ] Test unique features work
- [ ] Polish transitions

**Deliverable**: All 11 products unified

---

### Phase 4: Polish & Enhance (Week 4)

**Goal**: Refine UX, add power features

**Tasks**:
- [ ] Smooth step transitions
- [ ] Better preview panes
- [ ] Autosave functionality
- [ ] Duplicate product feature
- [ ] Templates system

**Deliverable**: Production-ready unified creation system

---

## Benefits of Unified System

### For Users

✅ **Consistent experience** - Learn once, create anything  
✅ **Faster creation** - Familiar steps, less cognitive load  
✅ **Less confusion** - Same flow every time  
✅ **Better onboarding** - Guided wizard for everything

### For You (Developer)

✅ **Less code duplication** - Shared components  
✅ **Easier maintenance** - Fix once, works everywhere  
✅ **Faster feature adds** - Add to shell, all products get it  
✅ **Consistent bugs** - Same issues, same fixes

---

## Preserving Uniqueness

Each product type keeps its unique aspects:

**Course**:
- Lesson builder with drag-drop
- Video uploads
- Content organization

**Pack**:
- Multi-file uploader
- Audio preview
- File organization

**Coaching**:
- Calendar availability
- Booking settings
- Session duration

**Rack**:
- .adg file upload
- Device chain visualization
- Preset management

**Bundle**:
- Product search/select
- Bundle pricing logic
- Value calculation

**These stay unique** - just wrapped in unified shell.

---

## Migration Risk Assessment

### Low Risk

- Shared steps (basics, pricing) - straightforward extraction
- Shell component - visual wrapper, no logic changes
- Progress bar - cosmetic improvement

### Medium Risk

- Context/state management - need to unify providers
- URL structure - might break existing links (mitigate with redirects)
- Step validation - ensure all conditional logic preserved

### High Risk (Mitigated)

- Data loss - **Mitigated**: Don't change Convex schemas, just UI
- Breaking existing flows - **Mitigated**: Migrate one at a time
- User confusion - **Mitigated**: Keep URLs the same

---

## Comparison: Before vs After

### Before (Current State)

```
Course creation: 5-step wizard, course-specific layout
Pack creation: 4-step wizard, pack-specific layout
Coaching creation: 5-step wizard, coaching-specific layout
...11 different layouts, 11 different patterns
```

**User experience**: "Every product feels like a different tool"

### After (Unified System)

```
All products: Unified shell + progress bar
Course: Shell + [Basics, Lessons⭐, Pricing, Publish]
Pack: Shell + [Basics, Files⭐, Pricing, Publish]
Coaching: Shell + [Basics, Pricing, Availability⭐, Publish]
```

**User experience**: "Same creation flow, product-specific power where needed"

---

## Implementation Checklist

### Week 1: Build Foundation

- [ ] Create `UnifiedCreationShell.tsx`
- [ ] Create `UnifiedProgressBar.tsx`
- [ ] Extract shared steps (Basics, Pricing, Checkout, FollowGate, Publish)
- [ ] Build step configuration system
- [ ] Migrate Course creation to unified shell
- [ ] Test thoroughly

### Week 2: Migrate Simple Products

- [ ] Digital Download
- [ ] URL Media
- [ ] Lead Magnet
- [ ] Test all three
- [ ] Fix any issues

### Week 3: Migrate Complex Products

- [ ] Pack (with FilesStep)
- [ ] Coaching (with AvailabilityStep)
- [ ] Ableton Rack (with RackConfigStep)
- [ ] Bundle (with ProductSelectorStep)
- [ ] Test all four

### Week 4: Polish

- [ ] Smooth animations
- [ ] Better previews
- [ ] Autosave
- [ ] Templates
- [ ] Final testing
- [ ] Deploy

---

## Success Criteria

**Shipping** if:
- ✅ All 11 product types use unified shell
- ✅ Product-specific features still work
- ✅ Same or better UX than before
- ✅ No data loss
- ✅ Old URLs still work (redirects)

**Nice to have** (Phase 2):
- Templates system
- Duplicate product
- Autosave
- Better previews

---

## Next Steps

**Option 1: Start Small**
- Build unified shell
- Migrate just Course creation
- See how it feels
- Then decide on rest

**Option 2: Go Big**
- Build entire unified system
- Migrate all products at once
- 4-week timeline

**Recommendation**: Option 1 (start small, iterate)

---

## Ready to Build?

I can start building the unified product creation system right now. 

**What do you want me to build first?**

1. The unified shell + shared steps?
2. Migrate one specific product (Course? Pack?) as a proof of concept?
3. Create a detailed code guide like we did for the dashboard?

**Let me know and I'll start building!** 🚀



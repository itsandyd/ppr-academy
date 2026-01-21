#!/bin/bash
# Ralph Wiggum Prompt: Cheat Sheet Creation Flow
# This is a dedicated script for the cheat-sheet standalone page task
# Created to avoid conflicts with other Claude Code instances

PROMPT="Create a standalone cheat sheet creation flow at /dashboard/create/cheat-sheet following the exact pattern of /dashboard/create/tip-jar.

COMPLETION CRITERIA:
- All files compile with no TypeScript errors (run npm run typecheck)
- Cheat Sheet flow is accessible at /dashboard/create/cheat-sheet
- Users can create cheat sheet products with title, description, thumbnail, tags, pricing model, and price
- The flow has 2 steps: Basics, Publish
- Types.ts is updated with CreationFlow including 'cheat-sheet' and CATEGORY_TO_FLOW maps 'cheat-sheet' to 'cheat-sheet'
- Header shows 'Create Cheat Sheet' NOT 'Create Create Cheat Sheet'

PHASE 1: Update app/dashboard/create/types.ts
- Add 'cheat-sheet' to CreationFlow type union
- Change CATEGORY_TO_FLOW 'cheat-sheet' mapping from 'digital' to 'cheat-sheet'

PHASE 2: Create app/dashboard/create/cheat-sheet/context.tsx
- CheatSheetData interface: title, description, thumbnail, tags, pricingModel, price
- StepCompletion: basics, publish
- cheatSheetConfig using ProductConfig from '@/lib/create/product-context-factory'
- Set productCategory to 'cheat-sheet', productType to 'digital'
- CheatSheetCreationProvider component
- useCheatSheetCreation hook

PHASE 3: Create app/dashboard/create/cheat-sheet/layout.tsx
- 2 steps: Basics (FileText icon, blue gradient), Publish (Sparkles icon, green gradient)
- CheatSheetCreationProvider wrapper
- AutoSaveProvider with save function
- StepProgress component
- ActionBar component
- StorefrontPreview component
- Header: emoji clipboard, '{Edit/Create} Cheat Sheet' title, 'Digital Content' badge

PHASE 4: Create app/dashboard/create/cheat-sheet/page.tsx
- Suspense with loading fallback
- AnimatePresence with motion.div transitions
- Switch statement: 'basics' -> CheatSheetBasicsForm, 'publish' -> CheatSheetPublishForm

PHASE 5: Create step forms
- steps/CheatSheetBasicsForm.tsx: FileText icon header, ValidatedField for title (min 3 chars), ValidatedField for description textarea (min 10, max 500, showCharCount), ProductAIAssistant, image upload with Convex storage, optional tags input
- steps/CheatSheetPublishForm.tsx: Pricing options (free with gate / paid), price input for paid, preview card with thumbnail/title/description/price

Run npm run typecheck after each phase.
Output CHEATSHEET_FLOW_COMPLETE when done."

MAX_ITERATIONS=30
COMPLETION_PROMISE="CHEATSHEET_FLOW_COMPLETE"

echo "=== Ralph Wiggum Prompt: Cheat Sheet Flow ==="
echo ""
echo "Prompt:"
echo "$PROMPT"
echo ""
echo "Max Iterations: $MAX_ITERATIONS"
echo "Completion Promise: $COMPLETION_PROMISE"
echo ""
echo "To run this prompt, use:"
echo "/ralph-loop:ralph-loop \"$PROMPT\" --max-iterations $MAX_ITERATIONS --completion-promise \"$COMPLETION_PROMISE\""

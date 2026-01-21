---
active: true
iteration: 2
max_iterations: 50
completion_promise: "COMPLETE"
started_at: "2026-01-21T04:13:07Z"
---

Improve PPR Academy dashboard creation system in 5 phases. PHASE 1 TYPE SAFETY: Create lib/convex-typed-hooks.ts with typed wrappers for Convex queries/mutations, replace all direct useQuery/useMutation in dashboard/create/**/context.tsx, target 0 @ts-ignore or eslint-disable comments. PHASE 2 CONTEXT CONSOLIDATION: Create lib/create/product-context-factory.tsx with generic ProductCreationProvider factory and config interface, migrate all 12 context files (pack, course, service, coaching, bundle, membership, pdf, chain, beat-lease, mixing-template, project-files, playlist-curation) to use factory, keep existing hook exports, target total context lines under 1500. PHASE 3 INLINE VALIDATION: Create shared/components/ValidatedField.tsx with inline error display and green checkmarks, create hooks/useFieldValidation.ts, update BasicsStep.tsx PackBasicsForm.tsx CourseInfoForm.tsx ServiceBasicsForm.tsx to use ValidatedField. PHASE 4 PERFORMANCE: Wrap Module/Lesson/Chapter in React.memo, use useCallback for handlers, add @tanstack/react-virtual for lists over 10 items. PHASE 5 AI METADATA: Create lib/audio-analyzer.ts with detectMetadata for BPM/key detection, integrate into FileUploader.tsx. After EACH phase run npm run build and npm run typecheck then commit. COMPLETE when: grep returns 0 suppressions AND context lines under 1500 AND ValidatedField in 4 forms AND React.memo used AND audio-analyzer integrated AND builds pass.

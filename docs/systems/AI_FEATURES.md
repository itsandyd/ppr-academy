# AI Features System

> **Last Updated:** 2026-02-19
> **Pass:** 3 — Updated with cheat sheet/reference PDF model changes, PDF template library
> **Key Files:** `convex/masterAI/` (15+ files), `convex/aiCourseBuilder.ts`, `convex/aiEmailGenerator.ts`, `convex/scriptIllustrations.ts`, `convex/embeddingActions.ts`, `convex/audioGeneration.ts`, `app/api/courses/generate-cheat-sheet-pack/route.ts`, `app/api/courses/generate-reference-pdf/route.ts`, `app/api/courses/publish-cheat-sheet-pack/route.ts`, `app/api/generate-audio/route.ts`, `lib/pdf-templates/`, `lib/cheat-sheet-limits.ts`

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. MasterAI Orchestration System](#2-masterai-orchestration-system)
- [3. Available Models & Providers](#3-available-models--providers)
- [4. AI Course Builder](#4-ai-course-builder)
- [5. Cheat Sheet Generation](#5-cheat-sheet-generation)
- [6. Reference PDF Generation](#6-reference-pdf-generation)
- [7. Social Media AI](#7-social-media-ai)
- [8. Email AI Generation](#8-email-ai-generation)
- [9. Image Generation](#9-image-generation)
- [10. Audio Generation (TTS)](#10-audio-generation-tts)
- [11. Vector Search & Embeddings](#11-vector-search--embeddings)
- [12. Web Research](#12-web-research)
- [13. AI Memory System](#13-ai-memory-system)
- [14. AI Agents](#14-ai-agents)
- [15. Rate Limiting](#15-rate-limiting)
- [16. Cost Analysis](#16-cost-analysis)
- [17. Technical Debt](#17-technical-debt)

---

## 1. System Overview

PPR Academy integrates AI across the entire platform via a modular **MasterAI** orchestration system. The architecture routes between multiple LLM providers (OpenAI, Claude, Gemini, DeepSeek) through OpenRouter, with specialized pipelines for different content types.

**Providers used:**
- **OpenAI** — GPT-4o, GPT-4o-mini, text-embedding-3-small
- **Anthropic** — Claude 4.5 Sonnet, Claude 4.5 Opus, Claude 3.5 Haiku (via OpenRouter)
- **Google** — Gemini 2.5 Flash, Gemini 3 Pro (via OpenRouter)
- **DeepSeek** — DeepSeek Chat, DeepSeek R1 (via OpenRouter)
- **ElevenLabs** — Text-to-speech
- **Fal.ai** — Image generation (Flux models)
- **Tavily** — Web search

---

## 2. MasterAI Orchestration System

**Location:** `convex/masterAI/`

### 7-Stage Pipeline

```
User Query
     ↓
1. PLANNER (decompose into 3-5 facets)
     ↓
2. RETRIEVER (vector search per facet, threshold: 0.7)
     ↓
3. WEB RESEARCH (parallel Tavily search, optional)
     ↓
4. SUMMARIZER (compress retrieved chunks by facet)
     ↓
5. IDEA GENERATOR (creative extrapolation, optional)
     ↓
6. FACT VERIFIER (claim verification, optional)
     ↓
7. CRITIC (quality gate, threshold: 0.4, optional)
     ↓
8. FINAL WRITER (streamed response with citations)
```

### Entry Points

| Function | Pipeline | Use Case |
|----------|----------|----------|
| `askMasterAI` | Full pipeline | Complete Q&A with research |
| `quickAsk` | Speed preset | Fast answers (Gemini Flash) |
| `askAgenticAI` | Full + tools | Tool-aware with action proposals |
| `executeConfirmedActions` | Tool execution | Run user-confirmed actions |

### 5 Quality Presets

| Preset | Models | Cost/Query | Use Case |
|--------|--------|------------|----------|
| `budget` | DeepSeek + Gemini | ~$0.002 | High-volume, low-stakes |
| `speed` | Gemini Flash + Haiku | ~$0.005 | Quick answers |
| `balanced` | Gemini 2.5 + Claude 4.5 Sonnet | ~$0.03 | **Default** |
| `deepReasoning` | Gemini Pro + DeepSeek R1 | ~$0.15 | Complex analysis |
| `premium` | Claude 4.5 Opus + Gemini Pro | ~$0.50 | Highest quality |

### Key Features

- **Model flexibility:** Swappable models per pipeline stage
- **Memory system:** Auto-extracts and stores conversation memories
- **Goal tracking:** Prevents context drift in long conversations
- **Citation building:** Tracks source chunks with titles and types
- **Quality retry:** Auto-retries summarizer if critic score < threshold

---

## 3. Available Models & Providers

**File:** `convex/masterAI/llmClient.ts`

### Routing Logic

```
OpenAI models (gpt-*, o1*) → OpenAI API (direct)
Everything else → OpenRouter (unified proxy)
Fallback → gpt-4o-mini if OpenRouter key missing
```

### Model Catalog (35+ models)

**Fast/Cheap:**
- `gemini-2.5-flash-lite`: $0.075/$0.30 per 1M tokens
- `gpt-4o-mini`: $0.15/$0.60
- `deepseek-chat`: $0.14/$0.28

**Balanced:**
- `claude-4.5-sonnet`: $3/$15
- `gemini-2.5-pro`: $1.25/$10
- `gpt-4o`: $2.50/$10

**Premium:**
- `claude-4.5-opus`: $5/$25 (64K output)
- `gpt-5-mini`: $1.50/$6
- `o1`: $15/$60 (reasoning)

---

## 4. AI Course Builder

**File:** `convex/aiCourseBuilder.ts`

### Full Pipeline

```
1. generateOutline
   → Uses MasterAI pipeline for research
   → Generates JSON: modules → lessons → chapters
   → Validates structure (expected counts)

2. expandChapterContent (per chapter)
   → Uses MasterAI pipeline with course context
   → Generates 800-1200 word detailed content
   → Converts markdown → HTML (for TipTap editor)

3. expandAllChapters (batch)
   → Processes lessons in parallel (max 3 concurrent)
   → 300ms delay between lessons (rate limit)
   → Real-time progress tracking

4. createCourseFromOutline
   → Creates full database structure
   → Links outline to course record

5. processReformattingInBackground
   → Fast gpt-4o-mini pass for formatting
   → 15 chapters per run, scheduled continuation
```

### Timing Estimates

| Operation | Duration |
|-----------|----------|
| Outline generation | 30-45 seconds |
| Chapter expansion | 60-90 seconds each |
| Full course (4 modules × 3 lessons × 3 chapters) | 15-20 minutes |
| Reformatting pass | ~5 seconds per chapter |

---

## 5. Cheat Sheet Generation

**Files:** `app/api/courses/generate-cheat-sheet-pack/route.ts`, `lib/cheat-sheet-limits.ts`, `lib/pdf-templates/`

### Model: Claude 3.5 Haiku via OpenRouter (default, configurable)

Available models: `claude-3.5-haiku`, `claude-4-sonnet`, `claude-4.5-sonnet`

### Hard Constraints (enforced by `enforceCheatSheetLimits()`)

- Max 4 sections per module
- Max 6 items per section
- Max 3 subItems per item
- Item text: < 100 chars, subItem text: < 80 chars
- Total items hard cap: 30 (trimmed from lowest-priority sections)
- Target: 20-25 items per module

### Section Types

| Type | Priority Weight | Purpose |
|------|--------|---------|
| `quick_reference` | 4 (highest) | Settings, values, ranges (50%+) |
| `step_by_step` | 3 | Ordered workflows |
| `comparison` | 2 | A vs B decisions |
| `tips` | 1 | Non-obvious techniques |
| `key_takeaways` | 0 | Only if items contain specific values |
| `glossary` | -1 (lowest) | Key terms — discouraged |

### JSON Repair Strategy (3-tier)

1. Direct clean and parse
2. Fix bracket/brace mismatches (stack-based parser)
3. Remove trailing commas before `]` or `}`

### Prioritization Rules

1. Specific values (Hz, dB, ms, %)
2. Signal chains / workflow steps
3. Quick comparisons
4. Critical warnings
5. Non-obvious pro tips

### PDF Generation

Uses `@react-pdf/renderer` with PausePlayRepeat brand system (`lib/pdf-templates/`). Each module generates a focused 1-2 page PDF. Pack generation creates one PDF per module, all linked to a `cheatSheetPacks` record.

---

## 6. Reference PDF Generation

**Files:** `app/api/courses/generate-reference-pdf/route.ts`, `convex/referenceGuides.ts`, `lib/pdf-templates/`

### Model: Claude 3.5 Haiku via OpenRouter (default, configurable)

Previously used OpenAI gpt-4o-mini (switched to OpenRouter for consistency). Available models: `claude-3.5-haiku`, `claude-4-sonnet`, `claude-4.5-sonnet`.

### Section Types

`key_takeaways`, `quick_reference`, `step_by_step`, `tips`, `comparison`, `glossary`, `custom`

### Requirements

- 3-6 sections per module
- 3-8 items per section
- Preserve exact numbers (frequencies, dB, ms, settings)
- No information additions outside source content
- `maxDuration: 300` (5 minutes for courses with many modules)

### Persistence

Reference PDF info stored on the course record via dedicated `convex/referenceGuides.ts` module:
- `referencePdfStorageId` — Convex storage ID
- `referencePdfUrl` — Public download URL
- `referencePdfGeneratedAt` — Generation timestamp

### PDF Rendering

Uses `@react-pdf/renderer` with shared brand system (`lib/pdf-templates/`). Single multi-page document with optional TOC, badge, and branded footer ("PausePlayRepeat").

---

## 7. Social Media AI

### Multi-Platform Script Generation

**File:** `convex/masterAI/socialMediaGenerator.ts`

| Platform | Model | Output | Special Feature |
|----------|-------|--------|-----------------|
| TikTok | Gemini 2.5 Flash | Script + thumbnail + voiceover | 100+ hook templates |
| Instagram | Gemini 2.5 Flash | 10-slide carousel + captions | Per-slide prompts |
| YouTube | Gemini 2.5 Flash | Full script + scene descriptions | Timing calculation |
| Twitter | Claude 4.5 Sonnet | Thread structure (auto-split) | Engagement optimization |

### Virality Scoring (1-10)

Factors analyzed:
- Emotional triggers (surprise, curiosity, FOMO)
- Hook strength (first 3 seconds critical)
- CTA clarity and urgency
- Platform best practices adherence
- Content relevance and timing

---

## 8. Email AI Generation

**File:** `convex/aiEmailGenerator.ts`

### Model: Claude 4.5 Sonnet

### Email Types

`welcome`, `nurture`, `pitch`, `follow_up`, `thank_you`, `reminder`, `custom`

### Output

- Subject line
- Preview text (40 chars)
- HTML body

### Tones

`professional`, `friendly`, `casual`, `urgent`, `educational`

---

## 9. Image Generation

**File:** `convex/scriptIllustrations.ts`

### Pipeline

```
1. Split script into sentences
2. Generate image prompt from each sentence (LLM)
3. Call Fal.ai (flux-schnell model)
4. Generate image
5. Create embedding for semantic search
6. Track job progress
```

### Model: `fal-ai/flux/schnell`

Fast generation model. Job tracking with per-sentence error handling (continues on failure).

---

## 10. Audio Generation (TTS)

**File:** `app/api/generate-audio/route.ts`

### Provider: ElevenLabs

### Configuration

```
Model: eleven_monolingual_v1
Default voice: Adam (pNInz6obpgDQGcFmaJgB)
Customizable: stability, clarity settings
```

### Rate Limits

- Per-user: 10 requests/hour
- System: 20 requests/minute

### Fallback

If no ElevenLabs API key configured, generates silent MP3 (demo mode).

---

## 11. Vector Search & Embeddings

**File:** `convex/embeddingActions.ts`

### Embedding Model: `text-embedding-3-small` (OpenAI)

### Content Types Indexed

Courses, chapters, lessons, products, plugins, notes

### Configuration

- Batch processing: 50 items per batch
- Similarity threshold: 0.7
- Max results per facet: 20
- Multi-bucket: Separate vectors per content type
- Deduplication: Filters duplicate chunks

---

## 12. Web Research

**File:** `convex/masterAI/webResearch.ts`

### Provider: Tavily API

### Features

- Parallel search by facet (from planner output)
- LLM-powered query extraction (gpt-4o-mini)
- Max 3 results per facet
- Domain inclusion/exclusion filters
- Auto-save results to embeddings for future retrieval
- Search depth: basic or advanced

### Rate Limits

Per-user: 10 searches/minute, 5 burst

---

## 13. AI Memory System

**File:** `convex/aiMemories.ts`

### Automatic Memory Extraction

- Triggered after conversations with 4+ messages
- Extracts: key insights, preferences, goals, context
- Stored per user for future prompt injection
- Runs in background via Convex scheduler

### Purpose

Prevents context drift in long conversations. Enables personalized responses across sessions.

---

## 14. AI Agents

**File:** `convex/aiAgents.ts`

### Available Tools

| Category | Tools |
|----------|-------|
| Course Management | createCourse, createCourseWithModules, addModule, addLesson, addChapter |
| Content | generateLessonContent, generateCourseOutline |
| Social | generateSocialScript, publishSocialPost, scheduleSocialPost |
| Queries | listMyCourses, listConnectedSocialAccounts |
| Settings | updateCourseSettings |

### Permissions

- `creator`: Course creation, content generation, social media
- `admin`: All operations
- `student`: Q&A, content viewing

### Confirmation Model

Most actions require user confirmation before execution. Agent proposes actions, user confirms, then `executeConfirmedActions` runs them.

---

## 15. Rate Limiting

### Convex-Level (`convex/lib/rateLimiter.ts`)

| Limiter | Rate | Burst |
|---------|------|-------|
| `userOpenaiCall` | 30/min | 10 |
| `userElevenlabsTTS` | 5/min | 3 |
| `userFalaiImage` | 10/min | 20 |
| `userTavilySearch` | 10/min | 5 |
| `userCourseGeneration` | 5/hour | — |
| `userAudioGeneration` | 10/hour | — |
| `systemLLMCall` | 100/min | 30 |
| `systemAudioGeneration` | 20/min | 10 |
| `systemImageGeneration` | 30/min | 30 |

### API Route-Level (Upstash Redis — `lib/rate-limit.ts`)

| Tier | Rate | Usage |
|------|------|-------|
| `strict` | 5/min | Payments, expensive operations |
| `standard` | 30/min | Default API routes |
| `generous` | 100/min | Read-heavy endpoints |

**Graceful degradation:** If Upstash unavailable, requests are allowed through.

---

## 16. Cost Analysis

### Per-Feature Estimates

| Feature | Model(s) | Est. Cost |
|---------|----------|-----------|
| MasterAI Q&A (balanced) | Gemini + Claude Sonnet | ~$0.03/query |
| MasterAI Q&A (budget) | DeepSeek + Gemini | ~$0.002/query |
| Course outline generation | Full pipeline | ~$0.10-0.30 |
| Chapter expansion (each) | Full pipeline | ~$0.03-0.05 |
| Full course (36 chapters) | Pipeline × 36 | ~$0.60-0.90 |
| Cheat sheet (per module) | Claude 3.5 Haiku (OpenRouter) | ~$0.003-0.010 |
| Cheat sheet pack (full course) | Claude 3.5 Haiku × N modules | ~$0.020-0.080 |
| Reference PDF (per course) | Claude 3.5 Haiku (OpenRouter) | ~$0.010-0.030 |
| Social media script | Gemini Flash / Claude Sonnet | ~$0.015-0.050 |
| Email generation | Claude Sonnet | ~$0.01-0.03 |
| Audio (ElevenLabs) | — | Usage-based (ElevenLabs pricing) |
| Image (Fal.ai) | Flux Schnell | ~$0.003/image |

### No Built-In Cost Tracking

There is currently no token counting or cost metering. Cost is estimated from model pricing and approximate token usage. **Recommended:** Add token counting to LLM client for monitoring.

---

## 17. Technical Debt

### High Priority

| Issue | Impact |
|-------|--------|
| No token/cost tracking | Cannot monitor AI spend |
| `// @ts-ignore` deep type issues | Convex type system conflicts |
| JSON repair is heuristic-based | Can fail on complex malformed JSON |

### Medium Priority

| Issue | Impact |
|-------|--------|
| Pipeline stages are sequential | Planner → Retriever → Summarizer could partially parallelize |
| No response caching | Identical queries re-run full pipeline |
| Large streaming responses may timeout | Long-form content generation |
| Rate limiter depends on Upstash | External dependency for API routes |

### Low Priority

| Issue | Impact |
|-------|--------|
| No local embedding option | Privacy-sensitive deployments |
| ElevenLabs fallback is silent MP3 | Poor UX in demo mode |
| Memory extraction only after 4+ messages | May miss short but important context |

---

## File Structure

```
convex/masterAI/
├── index.ts                    # Coordinator (entry points)
├── llmClient.ts                # LLM routing + model config
├── types.ts                    # Models, presets, settings
├── planner.ts                  # Task decomposition
├── retriever.ts                # Vector search
├── webResearch.ts              # Tavily integration
├── summarizer.ts               # Text compression
├── ideaGenerator.ts            # Creative ideas
├── factVerifier.ts             # Claim verification
├── critic.ts                   # Quality review
├── finalWriter.ts              # Response generation
├── memoryManager.ts            # Conversation memory
├── goalExtractor.ts            # Intent parsing
├── platformKnowledge.ts        # Domain knowledge
├── socialMediaGenerator.ts     # Multi-platform scripts
├── socialScriptAgent.ts        # Agent interface
├── cheatSheetGenerator.ts      # Cheat sheet generation
├── leadMagnetAnalyzer.ts       # Lead magnet optimization
└── tools/
    ├── schema.ts               # Tool definitions
    └── executor.ts             # Tool execution
```

---

*NEEDS EXPANSION IN PASS 4: Streaming response implementation, token counting architecture, AI agent builder UI, embedding migration strategies, prompt engineering patterns, model evaluation/benchmarking, AI usage analytics dashboard.*

*Updated in Pass 3: Cheat sheet and reference PDF models switched from OpenAI to Claude 3.5 Haiku via OpenRouter. Added cheat sheet limits enforcement utility, PDF template library with PausePlayRepeat branding, cheat sheet pack publishing flow, dedicated referenceGuides module.*

# Script-to-Illustration Generator

## Overview

The Script-to-Illustration Generator is a comprehensive feature that automatically generates AI-powered illustrations for long-form scripts, course content, and lesson materials. Each sentence in the script gets its own custom illustration, complete with semantic embeddings for powerful search and retrieval.

## Features

- **Automatic Sentence Splitting**: Intelligently splits scripts into individual sentences
- **AI Prompt Generation**: Uses GPT-4o-mini to create detailed illustration prompts
- **FAL Image Generation**: Generates high-quality images using FAL AI's Flux models
- **Semantic Embeddings**: Creates vector embeddings for each image using OpenAI's vision API
- **Semantic Search**: Find illustrations by concept, topic, or description
- **Batch Processing**: Handles multiple sentences with progress tracking
- **Course Integration**: Works seamlessly with course and lesson generation

## Architecture

### Database Schema

#### `scriptIllustrations` Table
Stores individual generated illustrations with metadata:
- `sentence`: Original text from the script
- `sentenceIndex`: Position in the script (for ordering)
- `illustrationPrompt`: AI-generated prompt used for image creation
- `imageUrl`: URL to the generated image (Convex storage)
- `embedding`: Vector embedding for semantic search (1536 dimensions)
- `generationStatus`: pending | generating | completed | failed
- `sourceType`: course | lesson | script | custom
- `scriptId`: Reference to parent script/course/lesson

**Indices:**
- `by_scriptId_and_sentenceIndex`: For ordered retrieval of illustrations
- `by_userId`: User's illustrations
- `by_status`: Filter by generation status

#### `scriptIllustrationJobs` Table
Tracks batch generation jobs:
- `userId`: Owner of the job
- `scriptText`: Full script content
- `status`: pending | processing | completed | failed
- `totalSentences`: Number of sentences to process
- `processedSentences`: Current progress
- `illustrationIds`: Array of generated illustration IDs
- `errors`: Any errors encountered

**Indices:**
- `by_userId_and_createdAt`: Recent jobs first
- `by_status`: Filter by job status

### Core Components

#### 1. Script Processing (`convex/scriptIllustrations.ts`)

**Main Action: `generateScriptIllustrations`**
```typescript
{
  userId: string,
  scriptText: string,
  scriptTitle?: string,
  sourceType: "course" | "lesson" | "script" | "custom",
  sourceId?: string,
  storeId?: string,
  imageModel?: string, // Default: "fal-ai/flux/schnell"
  generateEmbeddings?: boolean, // Default: true
  skipEmptySentences?: boolean // Default: true
}
```

**Process Flow:**
1. Split script into sentences (filters out short fragments)
2. Create a tracking job in the database
3. For each sentence:
   - Generate illustration prompt using GPT-4o-mini
   - Generate image using FAL AI
   - Upload image to Convex storage
   - Generate embedding using OpenAI vision API
   - Update progress in job tracker
4. Mark job as complete with results/errors

**Helper Functions:**
- `splitIntoSentences()`: Intelligent sentence splitting
- `generateIllustrationPrompt()`: AI-powered prompt generation
- `generateImageWithFAL()`: FAL API integration
- `uploadImageToConvex()`: Storage management
- `generateImageEmbedding()`: Vision-to-embedding pipeline

#### 2. Semantic Search (`convex/scriptIllustrationSearch.ts`)

**Search Action: `searchIllustrations`**
```typescript
{
  query: string,
  userId?: string,
  scriptId?: string,
  sourceType?: "course" | "lesson" | "script" | "custom",
  limit?: number, // Default: 10
  minSimilarity?: number // Default: 0.7 (0-1 scale)
}
```

Returns illustrations ranked by semantic similarity to the query.

**Find Similar: `findSimilarIllustrations`**
```typescript
{
  illustrationId: Id<"scriptIllustrations">,
  limit?: number, // Default: 5
  minSimilarity?: number // Default: 0.75
}
```

Returns illustrations similar to a given illustration.

**Get Recommendations: `getRecommendedIllustrations`**
```typescript
{
  scriptText: string,
  excludeScriptId?: string,
  limit?: number // Default: 10
}
```

Extracts key concepts from script and finds relevant existing illustrations.

**Search Algorithm:**
1. Generate query embedding using OpenAI
2. Fetch all illustrations with embeddings (up to 100)
3. Calculate cosine similarity for each
4. Filter by minimum similarity threshold
5. Sort by similarity score (highest first)
6. Return top N results

#### 3. UI Components

**`<ScriptIllustrationGenerator />`** (`components/script-illustration-generator.tsx`)

Main React component with:
- **Generate Tab**: 
  - Script input textarea
  - Sentence count preview
  - Generation button
  - Real-time progress tracking
  - Error display
- **Search Tab**:
  - Semantic search interface
  - Results grid with similarity scores
  - Image preview and download
- **Recent Jobs**:
  - Job history with status
  - Progress indicators
  - Error summaries
- **Generated Illustrations**:
  - Grid layout of illustrations
  - Sentence preview
  - Full-screen view modal
  - Download functionality

**`<IllustrationTab />`** (`app/dashboard/create/course/components/IllustrationTab.tsx`)

Course creation workflow integration:
- Pre-filled with lesson content
- How-it-works guide
- Contextual help

#### 4. Course Integration (`lib/course-illustration-integration.ts`)

**Helper Functions:**

```typescript
// Generate illustrations for a single lesson
generateLessonIllustrations({
  convexClient,
  userId,
  lessonId,
  lessonContent,
  lessonTitle
})

// Generate illustrations for all lessons in a course
generateCourseIllustrations({
  convexClient,
  userId,
  courseId,
  lessons: [{ id, title, content }]
})

// Get illustration recommendations for lesson content
getIllustrationRecommendations({
  convexClient,
  lessonContent,
  excludeLessonId
})

// Extract clean script from lesson markdown
extractScriptFromLesson(lessonContent)
```

## Usage Examples

### Basic Usage

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const generateIllustrations = useMutation(
  api.scriptIllustrations.generateScriptIllustrations
);

// Generate illustrations for a script
const result = await generateIllustrations({
  userId: "user_abc123",
  scriptText: "The compressor reduces dynamic range. It attenuates loud sounds. The threshold determines when compression starts.",
  scriptTitle: "Introduction to Compression",
  sourceType: "lesson",
  sourceId: "lesson_xyz",
  generateEmbeddings: true
});

// result = {
//   success: true,
//   jobId: "job_123",
//   totalSentences: 3,
//   message: "Started generation of 3 illustrations"
// }
```

### Search for Illustrations

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const searchIllustrations = useMutation(
  api.scriptIllustrationSearch.searchIllustrations
);

const results = await searchIllustrations({
  query: "audio compression waveform",
  userId: "user_abc123",
  limit: 10,
  minSimilarity: 0.7
});

// results = {
//   success: true,
//   results: [
//     {
//       illustrationId: "ill_1",
//       sentence: "The compressor reduces dynamic range...",
//       imageUrl: "https://...",
//       similarity: 0.89,
//       sentenceIndex: 0
//     },
//     ...
//   ]
// }
```

### Course Integration

```typescript
import { generateLessonIllustrations } from "@/lib/course-illustration-integration";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// After generating lesson content
const lesson = {
  id: "lesson_123",
  title: "EQ Basics",
  content: "Equalization shapes frequency content. Use low-pass filters to remove highs. High-pass filters remove lows."
};

const result = await generateLessonIllustrations({
  convexClient: convex,
  userId: user.id,
  storeId: store.id,
  lessonId: lesson.id,
  lessonContent: lesson.content,
  lessonTitle: lesson.title
});
```

### Monitor Job Progress

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const jobStatus = useQuery(
  api.scriptIllustrationSearch.getJobStatus,
  { jobId: "job_123" }
);

// jobStatus = {
//   status: "processing",
//   totalSentences: 10,
//   processedSentences: 7,
//   failedSentences: 0,
//   progress: 70,
//   errors: []
// }
```

## Configuration

### Environment Variables

Required environment variables:

```env
# FAL AI API Key
FAL_KEY=your_fal_api_key_here

# OpenAI API Key (for embeddings and prompt generation)
OPENAI_API_KEY=your_openai_api_key_here

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
```

### Image Generation Settings

Default FAL model: `fal-ai/flux/schnell`
- Fast generation (4 inference steps)
- Landscape 16:9 aspect ratio
- Good for educational content

Can be customized per request:
```typescript
{
  imageModel: "fal-ai/flux/dev", // Higher quality, slower
  // or "fal-ai/flux/pro" for production
}
```

### Embedding Model

Uses OpenAI's `text-embedding-3-small` (1536 dimensions):
- Fast and cost-effective
- Good for semantic search
- Generated from image descriptions via GPT-4o-mini vision

## Performance Considerations

### Rate Limiting
- 1 second delay between sentence processing
- Prevents overwhelming FAL API
- Configurable in `processSentences` action

### Batch Processing
- Jobs run asynchronously in background
- Progress tracked in real-time
- Errors don't stop the entire job

### Cost Optimization
- Uses GPT-4o-mini for prompt generation (cheap)
- Flux Schnell model for fast generation
- Embeddings generated only if requested
- Can skip empty/short sentences

### Estimated Costs (per 100 sentences)
- Prompt Generation: ~$0.10 (GPT-4o-mini)
- Image Generation: ~$5-10 (FAL Flux Schnell)
- Embedding Generation: ~$0.02 (text-embedding-3-small)
- **Total: ~$5-10 per 100 illustrations**

## Best Practices

### Script Preparation
1. **Clean formatting**: Remove extra whitespace and formatting
2. **Clear sentences**: Write complete, descriptive sentences
3. **Avoid fragments**: Short phrases may be filtered out
4. **Technical accuracy**: Precise language generates better prompts

### Prompt Quality
The AI generates better illustrations when sentences:
- Describe visual concepts clearly
- Include specific technical details
- Reference concrete objects or actions
- Avoid abstract philosophical ideas

### Semantic Search
To get better search results:
- Use specific technical terms
- Include context (e.g., "audio compressor threshold")
- Try different phrasings
- Lower similarity threshold for broader results

### Course Integration
Best workflow:
1. Generate course content with AI
2. Review and edit content
3. Generate illustrations for finalized lessons
4. Use semantic search to find/reuse illustrations
5. Mix generated + recommended illustrations

## Troubleshooting

### Common Issues

**1. "No valid sentences found"**
- Script may be too short or poorly formatted
- Check for proper punctuation
- Minimum 10 characters per sentence

**2. Generation failures**
- FAL API key not configured
- Rate limiting (wait and retry)
- Invalid prompts (very rare)

**3. No search results**
- No illustrations have embeddings yet
- Query too specific (lower minSimilarity)
- Embeddings still generating (wait for job completion)

**4. Order issues with queries**
- Fixed in schema with compound indices
- `by_scriptId_and_sentenceIndex` for ordered illustrations
- `by_userId_and_createdAt` for recent jobs

### Debug Mode

Check Convex logs for detailed information:
```bash
npx convex dashboard
# Navigate to Logs tab
# Filter by function: scriptIllustrations.processSentences
```

## Future Enhancements

Potential improvements:
- [ ] Custom illustration styles per course
- [ ] Manual prompt editing before generation
- [ ] Bulk regeneration of failed illustrations
- [ ] Video thumbnail generation
- [ ] Multi-language support
- [ ] Image editing and refinement
- [ ] Collections and favorites
- [ ] Export as PDF with illustrations
- [ ] A/B testing different prompts
- [ ] Integration with video generation

## API Reference

See inline TypeScript documentation in:
- `convex/scriptIllustrations.ts`
- `convex/scriptIllustrationSearch.ts`
- `lib/course-illustration-integration.ts`
- `components/script-illustration-generator.tsx`

## Related Documentation

- [Course Generation System](./AI_COURSE_GENERATOR.md)
- [Embeddings System](./EMBEDDINGS_SYSTEM.md)
- [FAL AI Integration](./FAL_INTEGRATION.md)
- [Convex Schema](../../convex/schema.ts)






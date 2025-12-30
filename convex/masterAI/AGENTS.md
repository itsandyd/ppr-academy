# MASTERAI KNOWLEDGE

Multi-agent AI orchestration system. GPT-4 powered content generation.

## STRUCTURE

```
masterAI/
├── index.ts              # Main coordinator, entry point
├── llmClient.ts          # OpenAI wrapper, model config
├── types.ts              # Shared TypeScript types
├── queries.ts            # Public read queries
├── mutations.ts          # Public write mutations
├── tools/                # Agent tools
│   ├── schema.ts         # Tool definitions
│   ├── executor.ts       # Tool execution
│   └── mutations.ts      # Tool-triggered writes
├── planner.ts            # Task decomposition agent
├── retriever.ts          # RAG context retrieval
├── critic.ts             # Output quality review
├── finalWriter.ts        # Content generation
├── webResearch.ts        # External research
├── memoryManager.ts      # Conversation context
├── summarizer.ts         # Text summarization
├── factVerifier.ts       # Fact checking
├── goalExtractor.ts      # User intent parsing
├── ideaGenerator.ts      # Content ideas
├── leadMagnetAnalyzer.ts # Lead magnet optimization
└── platformKnowledge.ts  # PPR domain knowledge
```

## AGENT FLOW

```
User Request
    │
    ▼
[goalExtractor] → Parse intent
    │
    ▼
[planner] → Decompose into tasks
    │
    ├─► [retriever] → Get RAG context
    │
    ├─► [webResearch] → External sources (if needed)
    │
    ▼
[finalWriter] → Generate content
    │
    ▼
[critic] → Quality review
    │
    ▼
[memoryManager] → Store context
```

## KEY AGENTS

| Agent       | File             | Input          | Output            |
| ----------- | ---------------- | -------------- | ----------------- |
| Coordinator | `index.ts`       | User query     | Final response    |
| Planner     | `planner.ts`     | Goal           | Task list         |
| Retriever   | `retriever.ts`   | Query          | RAG chunks        |
| FinalWriter | `finalWriter.ts` | Context + plan | Content           |
| Critic      | `critic.ts`      | Draft content  | Feedback/approval |
| WebResearch | `webResearch.ts` | Topic          | External facts    |

## LLM CLIENT

```typescript
import { callLLM } from "./llmClient";

const response = await callLLM({
  model: "gpt-4o",
  messages: [...],
  temperature: 0.7,
});
```

## TOOLS

Agents can invoke tools via `tools/executor.ts`:

- Database queries
- External API calls
- Content mutations

Tool schema in `tools/schema.ts` defines available operations.

## PATTERNS

### New Agent

```typescript
// convex/masterAI/myAgent.ts
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { callLLM } from "./llmClient";

export const process = internalAction({
  args: { input: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const response = await callLLM({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are..." },
        { role: "user", content: args.input },
      ],
    });
    return response.content;
  },
});
```

### Calling from Coordinator

```typescript
const result = await ctx.runAction(internal.masterAI.myAgent.process, {
  input: userQuery,
});
```

## CONVENTIONS

- All agents are `internalAction` (not public)
- Use structured outputs where possible
- Log agent decisions for debugging
- Keep agents focused on single responsibility
- Coordinator handles orchestration logic

## ANTI-PATTERNS

| Pattern                    | Fix                            |
| -------------------------- | ------------------------------ |
| Direct DB access in agents | Use `ctx.runQuery`             |
| Exposing agents publicly   | Use `internalAction`           |
| Large context windows      | Summarize with `summarizer.ts` |
| Unvalidated LLM output     | Use `critic.ts` review         |

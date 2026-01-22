# RALPH: DM Automation List Page

Build the DM automation list page at `/dashboard/social/automation/page.tsx`.

## Context

The automation builder already exists at `/dashboard/social/automation/[id]/page.tsx`. We need a list view to see all automations and create new ones.

### Existing Backend (convex/automations.ts)
- `api.automations.getUserAutomations({ clerkId })` - Returns all automations with keywords, triggers, listeners
- `api.automations.createAutomation({ clerkId, name })` - Creates new automation, returns `{ status, data: { _id } }`
- `api.automations.updateAutomation({ automationId, active?, name? })` - Updates automation
- `api.automations.deleteAutomation({ automationId })` - Deletes automation

### Data Shape from getUserAutomations
```typescript
{
  _id: Id<"automations">,
  name: string,
  active: boolean,
  userId: Id<"users">,
  _creationTime: number,
  keywords: Array<{ _id, word, automationId }>,
  trigger: { _id, type: "COMMENT" | "DM", automationId } | null,
  listener: { _id, listener: "MESSAGE" | "SMARTAI", prompt: string, commentReply?: string } | null,
  posts: Array<{ _id, postId, automationId }>
}
```

## Requirements

### 1. Page Structure (`app/dashboard/social/automation/page.tsx`)
- "use client" directive
- Header: "DM Automations" title with "New Automation" button (top right)
- Grid of automation cards (responsive: 1 col mobile, 2 col md, 3 col lg)
- Empty state when no automations

### 2. Automation Card Display
Each card shows:
- Name (bold, truncate if long)
- Status badge: green "Active" or gray "Paused"
- Keywords as small badges (show first 3, "+N more" if more)
- Trigger type: show DM icon and/or Comment icon based on trigger.type
- Listener type: "Custom Message" or "Smart AI" badge
- Stats (if available): dmCount, commentCount

### 3. Card Actions
- Toggle switch (top right) to enable/disable - calls `updateAutomation({ automationId, active: !current })`
- Edit button - navigates to `/dashboard/social/automation/[id]`
- Delete button - shows AlertDialog confirmation, then calls `deleteAutomation`

### 4. New Automation Flow
"New Automation" button opens a Dialog with template selection:

**Templates:**
1. **Lead Magnet Delivery** - DM trigger, MESSAGE listener
   - Default message: "Hey! Thanks for reaching out. Here's your free download: [LINK]"
   - Suggested keywords: FREE, DOWNLOAD, LINK

2. **Comment Auto-Reply** - COMMENT trigger, MESSAGE listener
   - Default message: "Thanks for the comment! Check your DMs for something special"
   - Suggested keywords: BEATS, FIRE

3. **Smart AI Responder** - DM trigger, SMARTAI listener
   - Default prompt: "You are a helpful music producer assistant..."
   - Suggested keywords: HELP, INFO

4. **Blank** - Start from scratch

On template select:
1. Call `createAutomation({ clerkId, name: templateName })`
2. Navigate to `/dashboard/social/automation/[newId]?template=<type>`

### 5. Empty State
When no automations:
- Zap icon
- "No automations yet"
- "Create your first automation to start engaging with your audience automatically."
- "Create Automation" button

### 6. Loading State
- Show skeleton cards while data loads

## UI Components to Use
```typescript
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Zap, MessageSquare, Instagram, Plus, Pencil, Trash2, Sparkles, Play, Pause } from "lucide-react";
import { toast } from "sonner";
```

## Pattern Reference
Follow the styling patterns from `/dashboard/emails/page.tsx` for consistency.

## Success Criteria
- [x] Page renders at `/dashboard/social/automation`
- [x] Shows list of automations or empty state
- [x] Cards display name, status, keywords, trigger type, listener type
- [x] Toggle switch enables/disables automation
- [x] Edit navigates to builder
- [x] Delete shows confirmation and removes
- [x] New Automation opens template dialog
- [x] Template selection creates and navigates to new automation
- [x] `npm run typecheck` passes

## Output

COMPLETED: DM_AUTOMATION_LOOP_COMPLETE

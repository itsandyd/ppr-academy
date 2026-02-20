# Component Map

> **Last Updated:** 2026-02-19
> **Pass:** 2 — Frontend & UI

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. components/ui/ — Base UI Components](#2-componentsui--base-ui-components)
- [3. components/ — Domain Components by Feature](#3-components--domain-components-by-feature)
- [4. Shared Layouts & Shells](#4-shared-layouts--shells)
- [5. Navigation Components](#5-navigation-components)
- [6. Modal & Dialog Patterns](#6-modal--dialog-patterns)
- [7. Form Patterns](#7-form-patterns)
- [8. Custom Hooks](#8-custom-hooks)
- [9. Composition Patterns](#9-composition-patterns)

---

## 1. Overview

| Category | Count |
|----------|-------|
| shadcn/ui base components | 33 |
| Custom UI components | 20 |
| Domain feature components | 100+ |
| Layout files | 30+ |
| Custom hooks | 13 |

---

## 2. components/ui/ — Base UI Components

### shadcn/ui (Radix + cva)

All follow the standard shadcn pattern: `forwardRef`, `cva` for variant classes, `cn()` utility, Radix primitive underneath.

| Component | Radix Primitive | Variants |
|-----------|----------------|----------|
| `accordion.tsx` | `@radix-ui/react-accordion` | — |
| `alert.tsx` | — | default, destructive |
| `alert-dialog.tsx` | `@radix-ui/react-alert-dialog` | — |
| `avatar.tsx` | `@radix-ui/react-avatar` | — |
| `badge.tsx` | — | default, secondary, destructive, outline |
| `button.tsx` | `@radix-ui/react-slot` | default, destructive, outline, secondary, ghost, link + sizes sm/default/lg/icon |
| `calendar.tsx` | `react-day-picker` | — |
| `card.tsx` | — | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `checkbox.tsx` | `@radix-ui/react-checkbox` | — |
| `collapsible.tsx` | `@radix-ui/react-collapsible` | — |
| `command.tsx` | `cmdk` + Dialog | — |
| `dialog.tsx` | `@radix-ui/react-dialog` | Custom `sidebarOffset` prop |
| `dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` | — |
| `hover-card.tsx` | `@radix-ui/react-hover-card` | — |
| `input.tsx` | — | — |
| `label.tsx` | `@radix-ui/react-label` | — |
| `popover.tsx` | `@radix-ui/react-popover` | — |
| `progress.tsx` | `@radix-ui/react-progress` | — |
| `radio-group.tsx` | `@radix-ui/react-radio-group` | — |
| `scroll-area.tsx` | `@radix-ui/react-scroll-area` | — |
| `select.tsx` | `@radix-ui/react-select` | — |
| `separator.tsx` | `@radix-ui/react-separator` | — |
| `sheet.tsx` | `@radix-ui/react-dialog` | side: top, bottom, left, right |
| `sidebar.tsx` | Custom | SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarTrigger, SidebarRail, SidebarInset + `useSidebar()` hook |
| `skeleton.tsx` | — | — |
| `slider.tsx` | `@radix-ui/react-slider` | — |
| `switch.tsx` | `@radix-ui/react-switch` | — |
| `table.tsx` | — | Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption |
| `tabs.tsx` | `@radix-ui/react-tabs` | — |
| `textarea.tsx` | — | — |
| `toast.tsx` | Sonner-based | — |
| `toaster.tsx` | — | Toast provider |
| `tooltip.tsx` | `@radix-ui/react-tooltip` | — |

### Custom UI Components

| Component | Description |
|-----------|-------------|
| `audio-player.tsx` | Audio playback with volume, seek, time display. Variants: default, compact, minimal |
| `audio-waveform.tsx` | Canvas-based waveform visualization with interactive seeking and customizable bar styles |
| `rich-text-editor.tsx` | Tiptap-based editor with image upload, formatting toolbar (Bold, Italic, Lists, Quote, Code) |
| `wysiwyg-editor.tsx` | Full WYSIWYG editor |
| `wysiwyg-demo.tsx` | WYSIWYG demo |
| `course-card-enhanced.tsx` | Enhanced course card display |
| `course-player-enhanced.tsx` | Enhanced video course player |
| `dashboard-layout-enhanced.tsx` | Enhanced dashboard layout wrapper |
| `metric-card-enhanced.tsx` | Stats/KPI card |
| `empty-state.tsx` | Empty state display |
| `empty-state-enhanced.tsx` | Enhanced empty state with illustrations |
| `form-error-banner.tsx` | Error display banner for forms |
| `form-field-with-help.tsx` | Label + input + help text wrapper |
| `hero-flourishes.tsx` | Decorative floating elements for hero sections |
| `loading-states.tsx` | Loading state variations |
| `masonry-grid.tsx` | Masonry grid layout |
| `step-progress-indicator.tsx` | Multi-step progress indicator |
| `store-url-display.tsx` | Store URL display with copy |
| `product-type-tooltip.tsx` | Product type tooltip |
| `animated-filter-transitions.tsx` | Animated filter transitions |

---

## 3. components/ — Domain Components by Feature

### Admin

| Component | Purpose |
|-----------|---------|
| `admin/admin-command-palette.tsx` | Command palette for admin actions |
| `admin/admin-dashboard.tsx` | Main admin dashboard |
| `admin/bulk-selection-table.tsx` | Table with bulk selection |
| `admin/migration-dashboard.tsx` | Data migration dashboard |
| `admin/real-time-alerts.tsx` | Real-time alert system |

### AI & Agents

| Component | Purpose |
|-----------|---------|
| `ai/AgentPicker.tsx` | AI agent selection |
| `ai/ConversationSidebar.tsx` | Chat conversation sidebar |
| `ai/ProductAIAssistant.tsx` | Product AI assistant interface |

### Analytics

| Component | Purpose |
|-----------|---------|
| `analytics/CreatorAnalyticsDashboard.tsx` | Creator analytics |
| `analytics/StudentLearningDashboard.tsx` | Student learning analytics |

### Beats / Audio Marketplace

| Component | Purpose |
|-----------|---------|
| `beats/BeatLicenseCard.tsx` | Beat license pricing card |
| `beats/LicenseTierPicker.tsx` | License tier selector |

### Certificates

| Component | Purpose |
|-----------|---------|
| `certificates/CertificateCard.tsx` | Certificate display |
| `certificates/CertificateTemplate.tsx` | Printable certificate |

### Coaching

| Component | Purpose |
|-----------|---------|
| `coach-application-form.tsx` | Form for becoming a coach |
| `coach-schedule-manager.tsx` | Coach scheduling |
| `coaching/DiscordVerificationCard.tsx` | Discord verification |

### Course (Central Feature)

| Component | Purpose |
|-----------|---------|
| `course/category-selector.tsx` | Course category selector |
| `course/CheatSheetPackDialog.tsx` | Cheat sheet dialog |
| `course/course-content-editor.tsx` | Content editor |
| `course/course-detail-client.tsx` | Course player (chapters, enrollment, reviews, audio) |
| `course/course-edit-header.tsx` | Course editing header |
| `course/CourseCheatSheets.tsx` | Cheat sheet section |
| `course/CourseQAChat.tsx` | Q&A chat interface |
| `course/drip-content-settings.tsx` | Drip content scheduling |
| `course/ExportReferencePdfDialog.tsx` | PDF export dialog |
| `course/notification-hint-card.tsx` | Notification hint |
| `course-card.tsx` | Course listing card |
| `course-filters.tsx` | Course filtering sidebar |
| `course-grid.tsx` | Grid display of courses |
| `course-management.tsx` | Course admin interface |
| `create-course-form.tsx` | Course creation form (modules > lessons > chapters) |
| `courses/lesson-feedback-prompt.tsx` | Lesson feedback prompt |

### Credits

| Component | Purpose |
|-----------|---------|
| `credits/CreditBalance.tsx` | Credit balance display |

### Dashboard

| Component | Purpose |
|-----------|---------|
| `dashboard-navbar.tsx` | Dashboard top nav |
| `dashboard/BecomeCreatorCard.tsx` | CTA to become creator |
| `dashboard/creator-analytics-tab.tsx` | Creator analytics tab |
| `dashboard/creator-dashboard-content.tsx` | Creator dashboard content |
| `dashboard/dashboard-preference-switcher.tsx` | Store/user switcher |
| `dashboard/dashboard-tabs.tsx` | Dashboard tabs |
| `dashboard/one-click-creator-setup.tsx` | One-click creator onboarding |
| `dashboard/post-setup-guidance.tsx` | Post-setup guidance |
| `dashboard/quick-creator-setup.tsx` | Quick setup wizard |
| `dashboard/store-required-guard.tsx` | Store existence guard |
| `dashboard/store-setup-wizard-enhanced.tsx` | Store setup wizard |

#### Dashboard Analytics (subdirectory)

| Component | Purpose |
|-----------|---------|
| `dashboard/analytics/CoursePerformanceChart.tsx` | Course chart |
| `dashboard/analytics/LiveActivityFeed.tsx` | Real-time activity |
| `dashboard/analytics/RevenueChart.tsx` | Revenue chart |
| `dashboard/analytics/StudentProgress.tsx` | Student progress |
| `dashboard/analytics/TrafficAnalytics.tsx` | Traffic analytics |
| `dashboard/analytics/VideoAnalytics.tsx` | Video analytics |

### Discord

| Component | Purpose |
|-----------|---------|
| `discord/discord-stats-widget.tsx` | Discord server stats |
| `discord/DiscordConnectionCard.tsx` | Discord connection setup |
| `discord/JoinDiscordCTA.tsx` | CTA to join Discord |

### Editor

| Component | Purpose |
|-----------|---------|
| `editor/tiptap-editor.tsx` | Tiptap editor integration |

### Email Marketing

| Component | Purpose |
|-----------|---------|
| `emails/AdminEmailFunnelOverview.tsx` | Admin email funnel |
| `emails/EmailFunnelOverview.tsx` | Email funnel visualization |
| `emails/WorkflowOrchestrationMap.tsx` | Email workflow diagram |

### Follow Gates

| Component | Purpose |
|-----------|---------|
| `follow-gates/FollowGateModal.tsx` | Social follow verification modal |
| `follow-gates/FollowGateSettings.tsx` | Configure follow requirements |
| `follow-gates/FollowGateWizard.tsx` | Follow gate setup wizard |
| `follow-gates/SocialLinkDialog.tsx` | Verify social links |

### Gamification

| Component | Purpose |
|-----------|---------|
| `gamification/achievement-system.tsx` | Achievement badges |
| `gamification/leaderboard.tsx` | Leaderboard display |

### Landing Pages

| Component | Purpose |
|-----------|---------|
| `landing-pages/landing-page-editor.tsx` | Page builder |

### Library

| Component | Purpose |
|-----------|---------|
| `library/beat-licenses-portal.tsx` | Beat license management |

### Marketing

| Component | Purpose |
|-----------|---------|
| `marketing/CampaignBrowser.tsx` | Campaign browser |
| `marketing/CampaignCard.tsx` | Campaign card |
| `marketing/CampaignPreview.tsx` | Campaign preview |
| `marketing/PlatformContentEditor.tsx` | Multi-platform editor |
| `marketing/PlatformTabs.tsx` | Platform selector tabs |
| `marketing/VariableFiller.tsx` | Dynamic variable replacement |

### Messages

| Component | Purpose |
|-----------|---------|
| `messages/ConversationList.tsx` | Conversation list |
| `messages/EmptyInbox.tsx` | Empty inbox state |
| `messages/MessageComposer.tsx` | Message input with file upload |
| `messages/MessageThread.tsx` | Conversation thread |
| `messages/NewConversationDialog.tsx` | New DM dialog |
| `messages/SendMessageButton.tsx` | Send button |

### Monetization

| Component | Purpose |
|-----------|---------|
| `monetization/AffiliateDashboard.tsx` | Affiliate dashboard |
| `monetization/CouponManager.tsx` | Coupon management |
| `monetization/SubscriptionPlansGrid.tsx` | Subscription tier display |

### Music

| Component | Purpose |
|-----------|---------|
| `music/add-track-form.tsx` | Add track form |
| `music/ai-outreach-modal.tsx` | AI artist outreach |
| `music/artist-showcase.tsx` | Artist profile display |

### Notes

| Component | Purpose |
|-----------|---------|
| `notes/ai-note-generator.tsx` | AI note generation |
| `notes/notes-dashboard.tsx` | Notes overview |
| `notes/notes-sidebar.tsx` | Notes navigation |
| `notes/notion-editor.tsx` | Notion-like editor |
| `notes/source-library.tsx` | Notes source library |

### Onboarding

| Component | Purpose |
|-----------|---------|
| `onboarding/getting-started-modal.tsx` | Getting started guide |
| `onboarding/LearnerOnboarding.tsx` | Learner onboarding flow |
| `onboarding/onboarding-hints.tsx` | Contextual hints |

### Payments

| Component | Purpose |
|-----------|---------|
| `payments/stripe-connect-flow.tsx` | Stripe Connect setup |

### Products

| Component | Purpose |
|-----------|---------|
| `products/product-card.tsx` | Product card display |
| `products/product-type-selector.tsx` | Product type picker |
| `products/products-grid.tsx` | Product grid |

### Q&A

| Component | Purpose |
|-----------|---------|
| `qa/AnswerCard.tsx` | Answer display |
| `qa/AskQuestionForm.tsx` | Question form |
| `qa/LessonQASection.tsx` | Lesson Q&A section |
| `qa/PostAnswerForm.tsx` | Answer form |
| `qa/QuestionCard.tsx` | Question display |

### Quiz

| Component | Purpose |
|-----------|---------|
| `quiz/CourseQuizzes.tsx` | Quiz section |
| `quiz/QuizPlayer.tsx` | Interactive quiz |

### Referrals

| Component | Purpose |
|-----------|---------|
| `referrals/ReferralCard.tsx` | Referral program info |

### Samples

| Component | Purpose |
|-----------|---------|
| `samples/SamplesList.tsx` | Audio sample listing |

### Settings

| Component | Purpose |
|-----------|---------|
| `settings/bio-link-editor.tsx` | Bio link customization |
| `settings/custom-domain-setup.tsx` | Custom domain config |
| `settings/domain-health-dashboard.tsx` | Domain health monitoring |
| `settings/email-domain-wizard.tsx` | Email domain setup |

### Shared

| Component | Purpose |
|-----------|---------|
| `shared/GlobalPhonePreview.tsx` | Mobile phone preview wrapper |
| `shared/PhoneShell.tsx` | Phone frame/bezel |
| `shared/report-button.tsx` | Report content button |
| `shared/report-modal.tsx` | Content reporting dialog |

### Social Media (Large Feature)

| Component | Purpose |
|-----------|---------|
| `social-media/account-management-dialog.tsx` | Account settings |
| `social-media/automation-manager.tsx` | Automation config |
| `social-media/social-media-tabs.tsx` | Platform tabs |
| `social-media/social-scheduler.tsx` | Post scheduling |
| `social-media/post-composer.tsx` | Post creation with image crop |
| `social-media/image-crop-editor.tsx` | Image cropping |
| `social-media/account-profiles/AccountProfileCard.tsx` | Profile card |
| `social-media/account-profiles/AccountProfilesList.tsx` | Profile list |
| `social-media/account-profiles/CreateAccountProfileDialog.tsx` | Create profile |
| `social-media/automations/instagram-automations.tsx` | Instagram automations |
| `social-media/agent/GenerationJobStatus.tsx` | AI generation status |
| `social-media/calendar/CalendarWeekView.tsx` | Week calendar |
| `social-media/script-library/ScriptCard.tsx` | Script display |
| `social-media/script-library/ScriptFilters.tsx` | Script filters |
| `social-media/script-library/ScriptLibrary.tsx` | Script browser |
| `social-media/script-library/ViralityBadge.tsx` | Virality score |
| `social-media/script-library/PerformanceFeedbackDialog.tsx` | Performance feedback |

### Social Proof

| Component | Purpose |
|-----------|---------|
| `social-proof/SocialProofWidget.tsx` | Social proof notifications |

### Storefront

| Component | Purpose |
|-----------|---------|
| `storefront/creators-picks.tsx` | Featured products |
| `storefront/follow-creator-cta.tsx` | Follow CTA |
| `storefront/product-filters.tsx` | Product filtering |
| `storefront/product-showcase.tsx` | Product display |
| `storefront/storefront-hero.tsx` | Hero banner |
| `storefront/storefront-layout.tsx` | Storefront wrapper |

### Video

| Component | Purpose |
|-----------|---------|
| `video/DynamicVideoPlayerShell.tsx` | Video player wrapper |
| `video/MuxPlayer.tsx` | Mux video player |
| `video/MuxUploader.tsx` | Mux video upload |
| `video/VideoExport.tsx` | Video export |
| `video/VideoPreview.tsx` | Video preview |

### Workflow (Email Automation)

| Component | Purpose |
|-----------|---------|
| `workflow/WorkflowBuilder.tsx` | Visual workflow builder |
| `workflow/nodes/ActionNode.tsx` | Workflow action node |
| `workflow/nodes/ConditionNode.tsx` | Conditional logic node |
| `workflow/nodes/DelayNode.tsx` | Delay/scheduling node |
| `workflow/nodes/EmailNode.tsx` | Email action node |
| `workflow/nodes/TriggerNode.tsx` | Workflow trigger node |

### Root-Level Components

| Component | Purpose |
|-----------|---------|
| `content-renderer.tsx` | Generic content renderer |
| `convex-example.tsx` | Convex demo component |
| `footer.tsx` | Site footer |
| `marketplace-navbar.tsx` | Marketplace nav |
| `mode-toggle.tsx` | Dark/light mode toggle |
| `navbar-client.tsx` | Main navigation bar |
| `navbar-wrapper.tsx` | Navbar provider wrapper |
| `ppr-pro-upsell.tsx` | PPR Pro subscription upsell |
| `script-illustration-generator.tsx` | Script-to-illustration |
| `theme-provider.tsx` | next-themes provider |
| `user-sync-fallback.tsx` | User sync error fallback |

---

## 4. Shared Layouts & Shells

### App-Level Layouts

| File | Wraps | Features |
|------|-------|----------|
| `app/layout.tsx` | Everything | Metadata, providers, fonts, skip-links |
| `app/(dashboard)/layout.tsx` | Creator sidebar routes | `SidebarWrapper` shell |
| `app/dashboard/layout.tsx` | Dashboard pages | `DashboardShell`, mode toggle, localStorage persistence |
| `app/[slug]/layout.tsx` | Creator storefronts | Server-side `generateMetadata()` |
| `app/admin/layout.tsx` | Admin panel | Force-dynamic |
| `app/courses/layout.tsx` | Course listing | — |
| `app/courses/[slug]/layout.tsx` | Course detail | Course metadata |

### Dashboard Shell Components

| Component | File | Purpose |
|-----------|------|---------|
| `SidebarWrapper` | `app/(dashboard)/components/sidebar-wrapper.tsx` | SidebarProvider + notification + search + preference switcher |
| `AppSidebar` | `app/(dashboard)/components/app-sidebar.tsx` | Navigation items (Home, Analytics, Products, Notes, etc.) |
| `DashboardShell` | `app/dashboard/components/DashboardShell.tsx` | Mode-aware layout with header, mode toggle, sidebar |
| `DashboardSidebar` | `app/dashboard/components/DashboardSidebar.tsx` | Learn/Create mode navigation |
| `ModeToggle` | `app/dashboard/components/ModeToggle.tsx` | Learn/Create switch button |
| `StoreRequiredGuard` | `app/dashboard/components/StoreRequiredGuard.tsx` | Requires store for create mode |

---

## 5. Navigation Components

### Top Navigation

**`navbar-client.tsx`** — Main site navbar:
- Browse dropdown: Marketplace, Creators, Courses
- Learn dropdown: Tutorials, Guides, Community
- Sell dropdown: Dashboard, Store, Become Creator
- Earn section: Affiliates, Referrals
- Icons: Search, Notifications, Profile (UserButton)
- Auth state: SignIn/SignUp buttons vs authenticated user menu

**`dashboard-navbar.tsx`** — Dashboard header:
- SidebarTrigger (mobile only)
- Search bar
- Notifications dropdown (Convex real-time)
- DashboardPreferenceSwitcher (store/user selection)
- Settings access

**`marketplace-navbar.tsx`** — Marketplace-specific navigation

### Sidebar Navigation

**`app/(dashboard)/components/app-sidebar.tsx`** — Creator sidebar:
- Home, Analytics
- Conditional store nav (if `hasStore`): Notes, Customers, Email Campaigns, Inbox, Products, Blog, Store
- Payout settings
- Dynamic store selection
- Mobile: collapses into Sheet

**`app/dashboard/components/DashboardSidebar.tsx`** — Dual-mode sidebar:
- **Learn mode:** 10 flat items (Dashboard, My Courses, My Products, Downloads, My Samples, My Sessions, Messages, My Notes, My Memberships, Certificates)
- **Create mode:** 5 collapsible categories with 22 items total (Core, Content, Marketing, Growth, Account)
- Quick Create shortcuts widget
- Progress stats widget (learn mode)

---

## 6. Modal & Dialog Patterns

### Dialog (Centered Modal)

Used for important confirmations, forms, information dialogs.

```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Notable: `DialogContent` has a custom `sidebarOffset` prop to account for sidebar positioning.

### Sheet (Slide-out Panel)

Used for navigation on mobile, filters, secondary actions.

```typescript
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

Variants: `side` prop — top, bottom, left, right.

### Examples

| Component | Type | Purpose |
|-----------|------|---------|
| `FollowGateModal` | Dialog | Multi-step social follow verification |
| `CheatSheetPackDialog` | Dialog | Cheat sheet management |
| `NewConversationDialog` | Dialog | Start new DM |
| `CreateAccountProfileDialog` | Dialog | Create social profile |
| `upgrade-prompt` | Dialog | Upgrade CTA |
| `ai-outreach-modal` | Dialog | AI outreach config |
| `SocialLinkDialog` | Dialog | Social link verification |
| Mobile sidebar | Sheet | Navigation drawer |

---

## 7. Form Patterns

### React Hook Form + Zod

Used in newer creation wizards (`app/dashboard/create/`):

```typescript
const formSchema = z.object({ title: z.string().min(1), price: z.number() });
const form = useForm({ resolver: zodResolver(formSchema) });
```

### Manual State Forms

Older components use `useState` per field:

```typescript
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
// Submit handler validates manually
```

### Complex Form Examples

| Form | Pattern | Features |
|------|---------|----------|
| `create-course-form.tsx` | Manual state | Nested modules > lessons > chapters, dynamic arrays |
| `post-composer.tsx` | Manual state | Image upload, crop editor, progress tracking |
| `MessageComposer.tsx` | Manual state | File attachments, upload before send |
| `FollowGateSettings.tsx` | Manual state | Toggle switches, multi-select platforms |
| `app/dashboard/create/blog/` | RHF + Zod | Schema-validated blog creation |

### Shared Patterns

- Error display: `FormErrorBanner` or inline messages
- Loading states: `submitStatus: "idle" | "loading" | "success" | "error"`
- Debounced validation: `useDebounce(email, 500)`
- Toast feedback: `useToast()` for submission results

---

## 8. Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useSidebar()` | `components/ui/sidebar.tsx` | Sidebar state (open/closed, mobile, toggle). Keyboard shortcut: Cmd+B. Cookie persistence. |
| `useAuth()` | `hooks/useAuth.ts` | Clerk user + logout with graceful fallback when Clerk not configured |
| `useToast()` | `hooks/use-toast.ts` | Reducer-based toast system (limit: 1), memory state management |
| `useMobile()` | `hooks/use-mobile.tsx` | Responsive breakpoint detection |
| `useStoreId()` | `hooks/useStoreId.tsx` | Extract current store ID from context |
| `useAnalytics()` | `hooks/useAnalytics.ts` | Event tracking via Convex (page_view, purchase, etc.) |
| `useDebounce()` | `hooks/use-debounce.ts` | Debounce utility |
| `useFieldValidation()` | `hooks/useFieldValidation.ts` | Form field validation |
| `useFeatureAccess()` | `hooks/use-feature-access.tsx` | Feature flag / plan gating |
| `useConversionTracking()` | `hooks/useConversionTracking.ts` | Conversion metrics |
| `useProducts()` | `hooks/use-products.ts` | Product query helper |
| `useCoachingProducts()` | `hooks/use-coaching-products.ts` | Coaching product queries |
| `useDiscordAutoSync()` | `hooks/useDiscordAutoSync.ts` | Discord integration sync |
| `useApplyReferral()` | `hooks/use-apply-referral.tsx` | Referral code handling |

---

## 9. Composition Patterns

### Compound Components

The sidebar uses compound component composition:

```typescript
<SidebarProvider>
  <Sidebar>
    <SidebarHeader />
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Section</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive}>
                <a href="/path">Link</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter />
    <SidebarRail />
  </Sidebar>
  <SidebarInset>{content}</SidebarInset>
</SidebarProvider>
```

### Guard Components

- `StoreRequiredGuard` — Wraps create-mode content, shows setup wizard if no store exists
- `BuildProviders` — Gracefully degrades if Clerk or Convex aren't configured

### Barrel Exports

Some feature directories have `index.ts` barrel exports:
- `components/dashboard/analytics/index.ts`
- `components/storefront/index.ts`
- `components/video/index.ts`
- `components/quiz/index.ts`
- `components/settings/index.ts`

Most components are imported directly by file path.

---

*NEEDS EXPANSION IN PASS 3: Detailed prop interfaces for key components, component dependency graph, Remotion video compositions.*

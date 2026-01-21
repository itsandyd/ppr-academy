# Ralph Loop: PPR Samples Desktop Application (Electron)

Build a cross-platform desktop application (Mac & Windows) using Electron that connects to our existing Convex backend. The app should function as a sample marketplace and library manager similar to Splice, allowing users to browse, purchase, and drag samples directly into their DAW.

**IMPORTANT: This desktop app lives in the `/desktop` subfolder of the existing ppr-academy Next.js project. Code is shared via TypeScript path aliases - DO NOT create a separate repository.**

---

## Project Structure Overview

The desktop app is a subfolder within the existing ppr-academy repo:

```
/ppr-academy                    # Existing Next.js web app (root)
├── /app                        # Next.js app routes (unchanged)
├── /components                 # Web components (can be shared)
├── /convex                     # Convex backend (SHARED - import directly)
│   ├── /_generated             # Generated types (SHARED)
│   ├── schema.ts
│   ├── samples.ts
│   ├── samplePacks.ts
│   ├── credits.ts
│   └── ...
├── /lib                        # Shared utilities (can be imported)
├── /desktop                    # NEW: Electron desktop app
│   ├── /src
│   │   ├── /main               # Electron main process
│   │   ├── /preload            # Preload scripts for IPC
│   │   └── /renderer           # React application
│   │       ├── /components     # Desktop-specific components
│   │       ├── /hooks          # Desktop-specific hooks
│   │       ├── /pages          # App views/screens
│   │       ├── /stores         # Zustand stores
│   │       └── App.tsx
│   ├── /resources              # App icons, assets
│   ├── electron-builder.yml    # Build configuration
│   ├── electron.vite.config.ts # Vite config for Electron
│   ├── package.json            # Desktop app dependencies
│   └── tsconfig.json           # TypeScript with path aliases
├── package.json                # Web app package.json
└── tsconfig.json               # Root TypeScript config
```

---

## Phase 1: Project Setup & Electron Foundation

### Goals
1. Initialize Electron project in `/desktop` subfolder with TypeScript, React, and Vite
2. Configure TypeScript path aliases to import from parent directories (Convex, lib, components)
3. Configure build pipelines for Mac (.dmg) and Windows (.exe/.msi) distribution
4. Implement secure IPC (Inter-Process Communication) between main and renderer processes
5. Set up auto-updater infrastructure using electron-updater

### Deliverables
- [ ] Working Electron app shell that launches on both Mac and Windows
- [ ] Hot-reload development environment configured
- [ ] TypeScript path aliases configured to import shared code:
  - `@convex/*` → `../convex/*`
  - `@/lib/*` → `../lib/*`
  - `@/components/*` → `../components/*` (for reusable UI)
- [ ] Electron Forge or electron-builder configured for packaging
- [ ] Main process handles: window management, native file system access, tray icon
- [ ] Renderer process: React app with Tailwind CSS (matching existing web app styling)

### Technical Requirements

#### TypeScript Configuration (desktop/tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@convex/*": ["../convex/*"],
      "@/lib/*": ["../lib/*"],
      "@/components/*": ["../components/*"],
      "@desktop/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../convex" }]
}
```

#### Vite Configuration (electron.vite.config.ts)
```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@convex': resolve(__dirname, '../convex'),
        '@/lib': resolve(__dirname, '../lib'),
        '@/components': resolve(__dirname, '../components'),
        '@desktop': resolve(__dirname, './src')
      }
    },
    plugins: [react()]
  }
})
```

#### Directory Structure
```
/desktop
  /src
    /main              # Electron main process
      index.ts         # Main entry point
      ipc.ts           # IPC handlers
      tray.ts          # System tray
      updater.ts       # Auto-update logic
    /preload           # Preload scripts
      index.ts         # Expose safe APIs to renderer
    /renderer          # React application
      /components      # Desktop-specific components
      /hooks           # Custom hooks
      /pages           # App views
      /stores          # Zustand state
      App.tsx
      main.tsx         # React entry
      index.html
  /resources           # Icons, assets
    icon.icns          # Mac icon
    icon.ico           # Windows icon
    icon.png           # Linux/general icon
  electron-builder.yml
  electron.vite.config.ts
  package.json
  tsconfig.json
```

### Verification
- Run `cd desktop && npm run dev` successfully launches the app
- Run `cd desktop && npm run build:mac` produces a working .dmg
- Run `cd desktop && npm run build:win` produces a working .exe installer
- Imports from `@convex/*` resolve correctly (e.g., `import { api } from '@convex/_generated/api'`)
- No TypeScript errors in strict mode

---

## Phase 2: Convex Integration & Authentication

### Goals
1. Connect to existing Convex backend using shared imports from parent directory
2. Implement Clerk authentication flow for desktop (OAuth device flow or deep linking)
3. Securely store authentication tokens using electron-store or keytar
4. Set up real-time subscriptions for user data synchronization

### Shared Code Imports
Since the desktop app can import directly from the parent Convex directory:

```typescript
// desktop/src/renderer/lib/convex.ts
import { ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";  // Direct import via path alias!

const convexUrl = import.meta.env.VITE_CONVEX_URL;
export const convex = new ConvexReactClient(convexUrl);

// Example usage in a component
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

function SampleBrowser() {
  // Same API as web app!
  const samples = useQuery(api.samples.getPublishedSamples, {
    genre: "hip-hop",
    limit: 50
  });

  const purchaseSample = useMutation(api.samples.purchaseSample);
  // ...
}
```

### Existing Convex Infrastructure to Leverage
- **Authentication**: Clerk JWT tokens (see `convex/auth.config.ts`)
- **User queries**: `users.ts` - getUserByClerkId, getCurrentUser
- **Credits**: `credits.ts` - getUserCredits, getCreditTransactions
- **Samples**: `samples.ts` - getPublishedSamples, getUserLibrary, getFavoriteSamples

### Deliverables
- [ ] Convex client initialized and connected in renderer process
- [ ] Environment variables configured (VITE_CONVEX_URL, VITE_CLERK_PUBLISHABLE_KEY)
- [ ] Login/logout flow using Clerk (deep link callback or device code flow)
- [ ] Secure token storage that persists across app restarts
- [ ] Auto-refresh of authentication tokens
- [ ] User session state management (logged in user, credits balance)
- [ ] Offline detection with graceful degradation

### Technical Implementation

#### Convex Provider Setup (desktop/src/renderer/App.tsx)
```typescript
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

export function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Router />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

#### Secure Token Storage (main process)
```typescript
// desktop/src/main/auth.ts
import Store from 'electron-store';
import keytar from 'keytar';

const SERVICE_NAME = 'ppr-samples-desktop';

// Use keytar for sensitive tokens (OS keychain)
export async function storeToken(token: string) {
  await keytar.setPassword(SERVICE_NAME, 'clerk-token', token);
}

export async function getToken(): Promise<string | null> {
  return keytar.getPassword(SERVICE_NAME, 'clerk-token');
}

// Use electron-store for non-sensitive preferences
const store = new Store();
export const preferences = {
  get: (key: string) => store.get(key),
  set: (key: string, value: any) => store.set(key, value),
};
```

### Verification
- User can log in via Clerk OAuth flow
- App remembers login state after restart
- Convex queries return real data from production backend
- Real-time updates work (change data in web app, see it update in desktop)
- Tokens refresh automatically before expiration
- Imports from `@convex/_generated/api` work correctly

---

## Phase 3: Sample Browser & Marketplace UI

### Goals
1. Build the main sample browsing interface with filters and search
2. Implement audio preview/playback with waveform visualization
3. Create sample pack browsing and detail views
4. Build the credit balance display and purchase flow triggers

### Existing Convex Queries to Use
- `samples.getPublishedSamples` - Marketplace with filtering (genre, category, search, bpm, key)
- `samples.getSample` - Single sample details
- `samplePacks.getAllPublishedSamplePacks` - Published packs
- `samplePacks.getPackWithSamples` - Pack details with all samples
- `digitalProducts.getAllPublishedProducts` - Products including sample-packs
- `digitalProducts.getProductById` - Product details

### UI Components Required
- [ ] **Sidebar Navigation**: Explore, My Library, Favorites, Downloads, Settings
- [ ] **Sample Browser Grid/List**: Thumbnails, name, BPM, key, genre, duration, price
- [ ] **Filter Panel**: Genre, Category, BPM range, Key, Tags, Price range
- [ ] **Search Bar**: Full-text search with autocomplete
- [ ] **Audio Player**: Play/pause, scrub, volume, waveform display
- [ ] **Sample Pack Cards**: Cover art, sample count, total duration, price
- [ ] **Pack Detail View**: Sample list, bulk download, purchase button
- [ ] **Credit Balance Widget**: Current balance, buy more credits link

### Waveform Visualization
- Use existing `waveformData` field from samples table
- Implement with wavesurfer.js or custom canvas rendering
- Show playback position during preview

### Verification
- Can browse all published samples with working filters
- Search returns relevant results
- Audio previews play correctly with waveform
- Sample packs show all contained samples
- UI is responsive and performant with 1000+ samples

---

## Phase 4: Purchase Flow & Credit System

### Goals
1. Implement sample/pack purchase using existing credit system
2. Handle insufficient credits with deep link to web for credit purchase
3. Track purchase state and provide download access
4. Implement purchase history view

### Existing Convex Mutations to Use
- `samples.purchaseSample` - Buy individual sample with credits
- `samplePacks.purchasePack` - Buy sample pack (legacy)
- `samplePacks.purchaseDigitalPack` - Buy from digitalProducts
- `credits.getUserCredits` - Check balance before purchase
- `samples.checkSampleOwnership` - Verify ownership
- `samples.checkFullSampleOwnership` - Check individual or pack ownership

### Purchase Flow
1. User clicks "Buy" on sample/pack
2. Check credit balance via `getUserCredits`
3. If sufficient: Call purchase mutation, show success, enable download
4. If insufficient: Show modal with options:
   - "Buy Credits" - Opens web app via deep link to credit purchase page
   - "Cancel" - Dismiss modal
5. After purchase: Update local library, enable drag-to-DAW

### Deliverables
- [ ] Purchase button with credit price display
- [ ] Pre-purchase ownership check (don't show buy if already owned)
- [ ] Purchase confirmation modal
- [ ] Insufficient credits handling with web deep link
- [ ] Success animation/feedback
- [ ] Purchase history in user profile section
- [ ] Real-time credit balance updates after purchase

### Deep Link Format
```
ppr-academy://credits/purchase?returnTo=desktop
```

### Verification
- Can purchase sample when sufficient credits
- Insufficient credits shows appropriate modal
- Deep link opens web app to credit purchase
- Purchased samples appear in library immediately
- Credit balance updates in real-time after purchase

---

## Phase 5: Download Manager & Local Library

### Goals
1. Implement background download queue for purchased samples
2. Create local file management system with configurable storage location
3. Build the "My Library" view showing downloaded samples
4. Implement smart sync between cloud purchases and local files

### File Storage Architecture
```
~/PPR Samples/
  /Samples/
    /{genre}/
      /{pack-name}/
        sample-file.wav
  /Packs/
    /{pack-name}/
      /metadata.json
      /samples/
  /cache/
    /previews/     # Cached preview files
    /waveforms/    # Cached waveform data
```

### Convex Queries/Mutations
- `samples.getUserLibrary` - All user's purchased/downloaded samples
- `samples.getFavoriteSamples` - User's favorites
- `sampleDownloads` table - Track download history

### Deliverables
- [ ] Download queue UI with progress indicators
- [ ] Configurable download location in settings
- [ ] Automatic folder organization (by genre, pack, or flat)
- [ ] Local SQLite database for offline library browsing
- [ ] Sync status indicators (cloud-only, downloading, downloaded, sync error)
- [ ] Bulk download for entire packs
- [ ] Pause/resume download capability
- [ ] Bandwidth throttling option

### Offline Capability
- Cache sample metadata locally for offline browsing
- Show "offline" badge when no internet
- Queue purchases/favorites for when back online

### Verification
- Downloads complete successfully and files are valid audio
- Can browse library offline
- Sync correctly identifies missing local files
- Storage location change moves files correctly
- Download queue handles interruptions gracefully

---

## Phase 6: DAW Integration - Drag & Drop

### Goals
1. Implement native drag-and-drop from app to any DAW
2. Support dragging to Finder/Explorer for manual import
3. Handle both downloaded files and cloud-only samples (download on drag)

### Technical Implementation

#### Electron Native Drag
```typescript
// Main process
ipcMain.on('start-drag', (event, filePath) => {
  event.sender.startDrag({
    file: filePath,
    icon: nativeImage.createFromPath('drag-icon.png')
  });
});

// Renderer process - on drag start
const handleDragStart = async (sample: Sample) => {
  // If not downloaded, trigger download first
  if (!isDownloaded(sample.id)) {
    await downloadSample(sample);
  }

  window.electron.ipcRenderer.send('start-drag', getLocalPath(sample));
};
```

#### DAW Compatibility Matrix
- Ableton Live: Drag to arrangement/session view
- FL Studio: Drag to channel rack/playlist
- Logic Pro: Drag to tracks area
- Pro Tools: Drag to clips list/timeline
- Cubase/Nuendo: Drag to project window
- Studio One: Drag to song/browser

### Deliverables
- [ ] Drag handle UI element on each sample
- [ ] Visual feedback during drag (ghost image with sample info)
- [ ] On-demand download during drag for cloud-only samples
- [ ] Multi-select and drag multiple samples
- [ ] Drag entire pack as folder
- [ ] Copy metadata to clipboard option
- [ ] "Reveal in Finder/Explorer" context menu

### Verification
- Drag sample from app to Ableton Live works
- Drag sample from app to FL Studio works
- Drag to Finder/Explorer creates valid file
- Multi-file drag creates correct number of files
- Cloud-only samples download seamlessly during drag

---

## Phase 7: Audio Engine & Advanced Playback

### Goals
1. Build robust audio playback engine for sample preview
2. Implement keyboard shortcuts for producer workflow
3. Add tempo-sync preview (stretch to project BPM)
4. Create mini-player that persists across views

### Audio Engine Features
- Web Audio API based playback in renderer
- Gapless preview transitions
- Volume normalization
- Preview quality options (low bandwidth mode)

### Keyboard Shortcuts
```
Space       - Play/Pause current preview
Arrow Up    - Previous sample in list
Arrow Down  - Next sample in list
Enter       - Purchase selected sample
Cmd/Ctrl+D  - Download selected
Cmd/Ctrl+F  - Focus search
Esc         - Clear selection/close modal
```

### Deliverables
- [ ] Persistent mini-player with waveform
- [ ] Keyboard navigation and shortcuts
- [ ] BPM-sync preview (time-stretch to target BPM)
- [ ] A/B comparison mode (quickly switch between samples)
- [ ] Loop mode for previews
- [ ] Preview volume memory (per session)
- [ ] Audio output device selection

### Verification
- Playback is smooth without glitches
- All keyboard shortcuts work
- BPM sync stretches audio correctly
- Can switch between samples rapidly without audio issues

---

## Phase 8: User Experience Polish

### Goals
1. Implement system tray integration
2. Add native notifications
3. Create onboarding flow for first-time users
4. Implement settings panel

### System Tray Features
- Mini-player controls
- Quick search
- Recent downloads
- Credit balance
- Quit app

### Settings Panel
- [ ] Download location
- [ ] Folder organization scheme
- [ ] Audio output device
- [ ] Preview quality (high/low bandwidth)
- [ ] Keyboard shortcuts customization
- [ ] Startup behavior (launch on login, minimize to tray)
- [ ] Sync preferences (auto-download purchases, cache size)
- [ ] Theme (light/dark/system)

### Onboarding Flow
1. Welcome screen with app overview
2. Login/signup prompt
3. Set download location
4. Quick tour of main features
5. First sample preview

### Deliverables
- [ ] System tray icon with context menu
- [ ] Native notifications for: download complete, new releases, low credits
- [ ] First-run onboarding wizard
- [ ] Comprehensive settings panel
- [ ] Theme support (respect system preference)
- [ ] Window state persistence (size, position)

### Verification
- Tray icon shows and functions correctly on both platforms
- Notifications appear and are clickable
- Onboarding completes successfully
- All settings persist and apply correctly

---

## Phase 9: Performance & Optimization

### Goals
1. Optimize for large libraries (10,000+ samples)
2. Implement virtual scrolling for lists
3. Add caching layer for API responses
4. Memory management for audio previews

### Performance Targets
- App launch: < 3 seconds
- Sample list scroll: 60fps with 10,000 items
- Search results: < 200ms
- Audio preview start: < 100ms
- Memory usage: < 500MB typical

### Deliverables
- [ ] Virtual scrolling for all sample lists
- [ ] Image lazy loading with placeholders
- [ ] Waveform rendering optimization
- [ ] API response caching with SWR pattern
- [ ] Audio buffer pooling
- [ ] Background process for heavy operations
- [ ] Memory monitoring and cleanup

### Verification
- Scroll through 10,000 samples smoothly
- Memory stays under 500MB during normal use
- No memory leaks after extended use
- App remains responsive during downloads

---

## Phase 10: Distribution & Auto-Update

### Goals
1. Set up code signing for Mac and Windows
2. Configure auto-update system
3. Create installer customization
4. Implement crash reporting and analytics

### Distribution Checklist
- [ ] Apple Developer ID certificate for Mac signing
- [ ] Windows EV code signing certificate
- [ ] Mac notarization workflow
- [ ] Windows SmartScreen reputation building
- [ ] Auto-update server (GitHub Releases or custom)
- [ ] Delta updates for faster patches
- [ ] Rollback capability

### Analytics & Crash Reporting
- Sentry for crash reporting
- Anonymous usage analytics (opt-in)
- Feature usage tracking for product decisions

### Deliverables
- [ ] Signed Mac .dmg installer
- [ ] Signed Windows .exe/.msi installer
- [ ] Auto-update checks and installs
- [ ] Update available notification
- [ ] Release notes display
- [ ] Crash reporting integration

### Verification
- Mac app passes Gatekeeper without warnings
- Windows app doesn't trigger SmartScreen warnings
- Auto-update downloads and installs correctly
- Crash reports appear in Sentry dashboard

---

## Completion Criteria

The desktop application is COMPLETE when ALL of the following are true:

1. **Build & Distribution**
   - App builds successfully for Mac (.dmg) and Windows (.exe)
   - Installers are properly signed and don't trigger security warnings
   - Auto-update system is functional

2. **Authentication & Sync**
   - Users can log in via Clerk
   - Session persists across app restarts
   - Real-time sync with Convex backend works

3. **Core Functionality**
   - Can browse all published samples and packs
   - Filters and search work correctly
   - Audio preview plays with waveform visualization
   - Can purchase samples/packs with credits
   - Downloads work and files are organized correctly

4. **DAW Integration**
   - Drag and drop works to at least 3 major DAWs (Ableton, FL Studio, Logic)
   - Multi-file drag works
   - Cloud-only samples download seamlessly during drag

5. **User Experience**
   - Keyboard shortcuts work
   - System tray integration functions
   - Settings persist correctly
   - Performance targets are met

6. **No Critical Bugs**
   - No crashes during normal operation
   - No data loss scenarios
   - No security vulnerabilities in IPC or token storage

When all criteria are met, output:

```
<promise>RALPH_COMPLETE</promise>
```

---

## Technical Stack Summary

| Component | Technology |
|-----------|------------|
| Framework | Electron |
| Build Tool | electron-vite |
| UI Framework | React 18+ |
| Styling | Tailwind CSS (shared config from parent) |
| State Management | Zustand |
| Backend | Convex (shared from `../convex`) |
| Auth | Clerk (shared config) |
| Audio | Web Audio API + wavesurfer.js |
| Local Storage | electron-store + better-sqlite3 |
| Secure Storage | keytar (OS keychain) |
| Auto-Update | electron-updater |
| Packaging | electron-builder |
| Analytics | Sentry |

---

## Environment Variables

Create `desktop/.env` (and `desktop/.env.production` for builds):

```env
# Convex - same values as web app
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk - same values as web app
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# Desktop-specific
VITE_APP_VERSION=$npm_package_version
VITE_UPDATE_SERVER_URL=https://updates.ppr-academy.com
```

**Note:** You can symlink or copy these from the root `.env.local` to keep them in sync.

---

## Shared Code Strategy

### What to Import from Parent
| Import Path | What It Provides |
|-------------|------------------|
| `@convex/_generated/api` | Typed API for all queries/mutations |
| `@convex/_generated/dataModel` | TypeScript types for all tables |
| `@/lib/utils` | Utility functions (cn, formatters, etc.) |
| `@/components/ui/*` | Shadcn UI components (if compatible) |

### What to Create Desktop-Specific
| Location | Purpose |
|----------|---------|
| `desktop/src/renderer/components/` | Electron-specific UI (tray, native dialogs) |
| `desktop/src/renderer/hooks/` | Desktop hooks (useDownload, useDrag, etc.) |
| `desktop/src/renderer/stores/` | Local state (download queue, offline cache) |
| `desktop/src/main/` | Main process code (IPC, file system, tray) |

### Reusing Web Components
Many components from the web app can be reused directly:
- UI primitives (Button, Input, Card, etc.)
- Sample cards and list items
- Waveform display components
- Filter/search components

Components that need desktop-specific versions:
- Navigation (sidebar vs. mobile nav)
- Audio player (needs native controls)
- Download/drag components (Electron-specific)

---

## Reference: Existing Convex API Endpoints

### Samples
- `api.samples.getPublishedSamples` - Marketplace samples
- `api.samples.getSample` - Single sample
- `api.samples.getUserLibrary` - User's library
- `api.samples.purchaseSample` - Buy sample
- `api.samples.checkSampleOwnership` - Verify ownership
- `api.samples.toggleFavorite` - Add/remove favorite
- `api.samples.incrementPlayCount` - Track plays

### Sample Packs
- `api.samplePacks.getAllPublishedSamplePacks` - All packs
- `api.samplePacks.getPackWithSamples` - Pack details
- `api.samplePacks.purchaseDigitalPack` - Buy pack

### Credits
- `api.credits.getUserCredits` - Balance
- `api.credits.getCreditTransactions` - History

### Users
- `api.users.getCurrentUser` - Current user
- `api.users.getUserByClerkId` - User lookup

---

## Notes for Implementation

1. **Start with Phase 1-2** to establish the foundation before building features
2. **The desktop app lives in `/desktop` subfolder** - All commands should be run from within this directory (`cd desktop && npm run dev`)
3. **Import shared code via path aliases** - Use `@convex/*`, `@/lib/*`, `@/components/*` to import from parent directories
4. **Reuse web app components** where possible - The React components from the Next.js app can often be adapted with minimal changes
5. **Test on both platforms early** - Don't wait until the end to test Windows builds
6. **Security first** - Electron apps are vulnerable if not configured correctly; follow security best practices
7. **The existing Convex backend is production-ready** - No backend changes needed initially
8. **Keep dependencies separate** - The desktop app has its own `package.json`; don't pollute the root with Electron dependencies
9. **Tailwind config** - Consider extending or importing from root `tailwind.config.ts` for consistent styling

## Quick Start Commands

```bash
# From project root
cd desktop

# Install desktop dependencies
npm install

# Run in development
npm run dev

# Build for Mac
npm run build:mac

# Build for Windows
npm run build:win

# Build for both
npm run build
```

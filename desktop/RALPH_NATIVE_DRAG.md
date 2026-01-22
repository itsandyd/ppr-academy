# RALPH: Native Drag-to-DAW for Electron App

## Goal
Implement native macOS drag-and-drop that allows users to drag audio samples from the Electron desktop app directly into Ableton Live (and other DAWs) - exactly like Splice does.

## Context

### Current State
- Desktop app location: `/Users/adysart/Documents/GitHub/ppr-academy/desktop`
- Tech stack: Electron 28 + React + TypeScript + Vite
- Audio samples are downloaded to: `~/Music/PPR Samples/{genre}/{filename}.mp3`
- Drag handling code is in:
  - `src/renderer/hooks/useDragToDAW.ts` (React hook)
  - `src/main/ipc.ts` (IPC handler calling `event.sender.startDrag()`)
  - `src/renderer/components/SampleCard.tsx` (UI component)

### What Works
- Samples display correctly in the app
- Downloads work and persist between sessions (stored in electron-store)
- Drag gesture is recognized by the app
- Ableton visually accepts the drag (no "prohibited" cursor)

### What Doesn't Work
- When dropping into Ableton, **the audio file doesn't actually load**
- Same issue with other apps expecting native file drops

### Root Cause
Electron's `webContents.startDrag()` API uses a simplified pasteboard format. Professional DAWs like Ableton expect the exact macOS Finder pasteboard format:
- `NSFilenamesPboardType` (legacy)
- `public.file-url` (modern UTI)
- Proper `NSDraggingSession` implementation

## Research Sources
1. https://www.fileside.app/blog/2019-04-22_fixing-drag-and-drop/ - Details how to fix this with native modules
2. https://github.com/electron/electron/issues/34603 - Electron's deprecated drag API issue
3. https://github.com/electron/electron/issues/4622 - Native file drag from Electron
4. https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/DragandDrop/Tasks/DraggingFiles.html - Apple's official docs

## Task Requirements

### Primary Objective
Create a native Node.js addon (using node-addon-api or napi-rs) that:
1. Takes a file path as input
2. Initiates a proper macOS native drag operation using NSPasteboard
3. Sets the correct pasteboard types that DAWs expect
4. Works with Ableton Live, Logic Pro, FL Studio, and other DAWs

### Technical Approach

#### Option A: Native Node Module (Objective-C++)
Create a native module in `src/native/` that:
```objective-c
// Uses NSPasteboard with proper file URLs
// Implements NSDraggingSource protocol
// Sets NSPasteboardTypeFileURL and legacy NSFilenamesPboardType
```

#### Option B: Use Existing Package
Search for and evaluate existing packages:
- `@aspect/native-drag`
- `node-mac-drag`
- `electron-native-dnd`
- Any package that provides proper macOS pasteboard integration

#### Option C: Alternative Approach
If native drag proves too complex:
- Implement a "drag proxy" that copies file to a standard location
- Use AppleScript/JXA to trigger Finder drag
- Create a helper app that handles the native drag

### Integration Points

1. **IPC Handler** (`src/main/ipc.ts`):
   - Replace `event.sender.startDrag()` with native module call
   - Handler name: `start-drag`
   - Input: `filePath: string`

2. **React Hook** (`src/renderer/hooks/useDragToDAW.ts`):
   - Already calls `window.electron.startDrag(localPath)`
   - No changes needed if IPC handler works correctly

3. **Preload** (`src/preload/index.ts`):
   - Already exposes `startDrag` via IPC
   - No changes needed

### Success Criteria
- [ ] Drag a sample from the app
- [ ] Drop into Ableton Live arrangement view
- [ ] Audio file loads and plays correctly
- [ ] Works with files containing spaces in names
- [ ] Works with MP3, WAV, AIFF formats

### Files to Modify/Create
- `src/main/ipc.ts` - Update drag handler
- `src/native/` - New directory for native code (if needed)
- `package.json` - Add native build dependencies
- `binding.gyp` or `Cargo.toml` - Native build config

### Testing
1. Download a sample in the app
2. Drag the sample card toward Ableton
3. Drop in arrangement view
4. Verify audio loads and waveform appears

## Completion Promise
When the task is complete, output: `NATIVE_DRAG_COMPLETE`

## Notes
- Splice (a similar app) successfully does this, so it's definitely possible
- The Fileside blog post has working code examples for macOS
- Consider using `napi-rs` (Rust) instead of node-addon-api for easier development
- The app is currently in development mode (not signed/sandboxed)

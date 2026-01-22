#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
#import <string>
#import <vector>
#import "../include/native_drag.h"

static NSString* toNSString(const std::string& str) {
    return [NSString stringWithUTF8String:str.c_str()];
}

// Drag source delegate
@interface FileDragSource : NSObject <NSDraggingSource>
@property (nonatomic, strong) NSArray<NSURL*>* fileURLs;
@end

@implementation FileDragSource

- (NSDragOperation)draggingSession:(NSDraggingSession *)session
    sourceOperationMaskForDraggingContext:(NSDraggingContext)context {
    return NSDragOperationCopy | NSDragOperationMove | NSDragOperationLink;
}

- (void)draggingSession:(NSDraggingSession *)session
           endedAtPoint:(NSPoint)screenPoint
              operation:(NSDragOperation)operation {
    NSLog(@"[NativeDrag] Session ended, operation: %lu", (unsigned long)operation);
}

@end

// Stored state for pending drag
static NSArray<NSURL*>* g_pendingFileURLs = nil;
static NSView* g_pendingView = nil;
static NSWindow* g_pendingWindow = nil;
static FileDragSource* g_dragSource = nil;
static id g_eventMonitor = nil;

static void cleanupPendingDrag(bool removeMonitor = true) {
    if (removeMonitor && g_eventMonitor) {
        [NSEvent removeMonitor:g_eventMonitor];
        g_eventMonitor = nil;
    }
    g_pendingFileURLs = nil;
    g_pendingView = nil;
    g_pendingWindow = nil;
}

static void startDragWithEvent(NSEvent* event) {
    if (!g_pendingFileURLs || !g_pendingView || !g_pendingWindow) {
        NSLog(@"[NativeDrag] No pending drag data");
        cleanupPendingDrag(false); // Monitor already removed
        return;
    }

    NSLog(@"[NativeDrag] Starting drag from event monitor");

    // Create drag source
    g_dragSource = [[FileDragSource alloc] init];
    g_dragSource.fileURLs = g_pendingFileURLs;

    // Get mouse location
    NSPoint mouseLocation = [event locationInWindow];

    // Create dragging items
    NSMutableArray<NSDraggingItem*>* items = [NSMutableArray array];
    CGFloat yOffset = 0;

    for (NSURL* fileURL in g_pendingFileURLs) {
        NSDraggingItem* item = [[NSDraggingItem alloc] initWithPasteboardWriter:fileURL];

        NSImage* icon = [[NSWorkspace sharedWorkspace] iconForFile:[fileURL path]];
        [icon setSize:NSMakeSize(48, 48)];

        NSRect frame = NSMakeRect(mouseLocation.x - 24, mouseLocation.y - 24 - yOffset, 48, 48);
        [item setDraggingFrame:frame contents:icon];
        [items addObject:item];
        yOffset += 16;
    }

    // Start the drag session
    @try {
        NSDraggingSession* session = [g_pendingView beginDraggingSessionWithItems:items
                                                                            event:event
                                                                           source:g_dragSource];
        if (session) {
            session.animatesToStartingPositionsOnCancelOrFail = YES;
            session.draggingFormation = NSDraggingFormationStack;
            NSLog(@"[NativeDrag] Drag session started!");
        }
    } @catch (NSException* e) {
        NSLog(@"[NativeDrag] Exception: %@", e);
    }

    cleanupPendingDrag(false); // Monitor already removed
}

namespace native_drag {

bool isMacOS() {
    return true;
}

// Prepare drag - this should be called on mousedown
bool prepareDrag(const std::string& filePath, void* nativeWindowHandle) {
    std::vector<std::string> paths = { filePath };
    return startMultiFileDrag(paths, nativeWindowHandle);
}

bool startFileDrag(const std::string& filePath, void* nativeWindowHandle) {
    // If there's already a pending drag, don't set up again
    if (g_pendingFileURLs) {
        NSLog(@"[NativeDrag] Drag already prepared");
        return true;
    }
    std::vector<std::string> paths = { filePath };
    return startMultiFileDrag(paths, nativeWindowHandle);
}

bool startMultiFileDrag(const std::vector<std::string>& filePaths, void* nativeWindowHandle) {
    // Clean up any previous pending drag
    cleanupPendingDrag();

    if (filePaths.empty()) {
        NSLog(@"[NativeDrag] No files provided");
        return false;
    }

    @autoreleasepool {
        NSFileManager* fm = [NSFileManager defaultManager];
        NSMutableArray<NSURL*>* urls = [NSMutableArray array];

        for (const auto& path : filePaths) {
            NSString* nsPath = toNSString(path);
            if ([fm fileExistsAtPath:nsPath]) {
                [urls addObject:[NSURL fileURLWithPath:nsPath]];
                NSLog(@"[NativeDrag] Queued: %@", nsPath);
            }
        }

        if ([urls count] == 0) {
            NSLog(@"[NativeDrag] No valid files");
            return false;
        }

        // Get window/view
        NSView* view = nil;
        NSWindow* window = nil;

        if (nativeWindowHandle) {
            view = (__bridge NSView*)nativeWindowHandle;
            window = [view window];
        }
        if (!window) {
            window = [NSApp keyWindow];
            view = [window contentView];
        }
        if (!window || !view) {
            NSLog(@"[NativeDrag] No window");
            return false;
        }

        // Store for the event monitor
        g_pendingFileURLs = [urls copy];
        g_pendingView = view;
        g_pendingWindow = window;

        // Use a global monitor to catch events before the web view processes them
        g_eventMonitor = [NSEvent addGlobalMonitorForEventsMatchingMask:NSEventMaskLeftMouseDragged
                                                                handler:^(NSEvent* event) {
            // Check if this event is for our window
            if ([event window] == g_pendingWindow || [event window] == nil) {
                NSLog(@"[NativeDrag] Global monitor caught drag event");

                // Remove monitor immediately
                if (g_eventMonitor) {
                    [NSEvent removeMonitor:g_eventMonitor];
                    g_eventMonitor = nil;
                }

                // We need to convert the global event to work with our view
                // Create a synthetic event for our window
                NSPoint windowLocation = [g_pendingWindow mouseLocationOutsideOfEventStream];
                NSEvent* localEvent = [NSEvent mouseEventWithType:NSEventTypeLeftMouseDragged
                                                         location:windowLocation
                                                    modifierFlags:[event modifierFlags]
                                                        timestamp:[event timestamp]
                                                     windowNumber:[g_pendingWindow windowNumber]
                                                          context:nil
                                                      eventNumber:[event eventNumber]
                                                       clickCount:1
                                                         pressure:[event pressure]];

                startDragWithEvent(localEvent);
            }
        }];

        // Also add a local monitor as backup
        static id localMonitor = nil;
        localMonitor = [NSEvent addLocalMonitorForEventsMatchingMask:NSEventMaskLeftMouseDragged
                                                             handler:^NSEvent*(NSEvent* event) {
            if (g_pendingFileURLs) {
                NSLog(@"[NativeDrag] Local monitor caught drag event");

                if (g_eventMonitor) {
                    [NSEvent removeMonitor:g_eventMonitor];
                    g_eventMonitor = nil;
                }
                [NSEvent removeMonitor:localMonitor];
                localMonitor = nil;

                startDragWithEvent(event);
                return nil; // Consume to prevent Electron's drag
            }
            return event;
        }];

        NSLog(@"[NativeDrag] Event monitor installed, waiting for drag...");
        return true;
    }
}

} // namespace native_drag

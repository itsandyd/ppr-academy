#pragma once
#include <string>
#include <vector>

namespace native_drag {
  // Prepare for drag - call on mousedown BEFORE drag starts
  // This installs event monitors to intercept the drag
  bool prepareDrag(const std::string& filePath, void* nativeWindowHandle);

  // Start a native drag operation for a single file (legacy, calls prepareDrag)
  bool startFileDrag(const std::string& filePath, void* nativeWindowHandle);

  // Start a native drag operation for multiple files
  bool startMultiFileDrag(const std::vector<std::string>& filePaths, void* nativeWindowHandle);

  // Check if we're on macOS
  bool isMacOS();
}

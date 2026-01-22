{
  "targets": [
    {
      "target_name": "native_drag",
      "conditions": [
        ["OS=='mac'", {
          "sources": [
            "src/native/native_drag.mm",
            "src/native/native_drag_addon.mm"
          ],
          "include_dirs": [
            "<!@(node -p \"require('node-addon-api').include\")",
            "src/native/include"
          ],
          "libraries": [
            "-framework Foundation",
            "-framework AppKit",
            "-framework Cocoa"
          ],
          "dependencies": [
            "<!(node -p \"require('node-addon-api').gyp\")"
          ],
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "11.0",
            "CLANG_ENABLE_OBJC_ARC": "YES",
            "OTHER_CFLAGS": [
              "-ObjC++",
              "-std=c++17"
            ]
          },
          "defines": [
            "NAPI_DISABLE_CPP_EXCEPTIONS",
            "NODE_ADDON_API_DISABLE_DEPRECATED"
          ]
        }]
      ]
    }
  ]
}

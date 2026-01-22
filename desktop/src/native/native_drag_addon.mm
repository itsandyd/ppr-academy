#include <napi.h>
#include <string>
#include <vector>
#include "../include/native_drag.h"

#import <AppKit/AppKit.h>

// Prepare drag - call on mousedown before drag starts
Napi::Value PrepareDrag(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected file path as string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filePath = info[0].As<Napi::String>();

    void* nativeHandle = nullptr;
    if (info.Length() >= 2 && info[1].IsBuffer()) {
        Napi::Buffer<void*> buffer = info[1].As<Napi::Buffer<void*>>();
        if (buffer.Length() > 0) {
            nativeHandle = *buffer.Data();
        }
    }

    bool result = native_drag::prepareDrag(filePath, nativeHandle);
    return Napi::Boolean::New(env, result);
}

// Start native file drag - called from Node.js
Napi::Value StartFileDrag(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Validate arguments
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected file path as string").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filePath = info[0].As<Napi::String>();

    // Get native window handle if provided (as buffer)
    void* nativeHandle = nullptr;
    if (info.Length() >= 2 && info[1].IsBuffer()) {
        Napi::Buffer<void*> buffer = info[1].As<Napi::Buffer<void*>>();
        if (buffer.Length() > 0) {
            nativeHandle = *buffer.Data();
        }
    }

    bool result = native_drag::startFileDrag(filePath, nativeHandle);
    return Napi::Boolean::New(env, result);
}

// Start native multi-file drag - called from Node.js
Napi::Value StartMultiFileDrag(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Validate arguments
    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Expected array of file paths").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Array pathsArray = info[0].As<Napi::Array>();
    std::vector<std::string> filePaths;

    for (uint32_t i = 0; i < pathsArray.Length(); i++) {
        Napi::Value val = pathsArray[i];
        if (val.IsString()) {
            filePaths.push_back(val.As<Napi::String>());
        }
    }

    // Get native window handle if provided
    void* nativeHandle = nullptr;
    if (info.Length() >= 2 && info[1].IsBuffer()) {
        Napi::Buffer<void*> buffer = info[1].As<Napi::Buffer<void*>>();
        if (buffer.Length() > 0) {
            nativeHandle = *buffer.Data();
        }
    }

    bool result = native_drag::startMultiFileDrag(filePaths, nativeHandle);
    return Napi::Boolean::New(env, result);
}

// Check if running on macOS
Napi::Value IsMacOS(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, native_drag::isMacOS());
}

// Initialize the module
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "prepareDrag"),
                Napi::Function::New(env, PrepareDrag));
    exports.Set(Napi::String::New(env, "startFileDrag"),
                Napi::Function::New(env, StartFileDrag));
    exports.Set(Napi::String::New(env, "startMultiFileDrag"),
                Napi::Function::New(env, StartMultiFileDrag));
    exports.Set(Napi::String::New(env, "isMacOS"),
                Napi::Function::New(env, IsMacOS));
    return exports;
}

NODE_API_MODULE(native_drag, Init)

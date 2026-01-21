# RALPH_SPECTRUM_ANALYZER.md

## Mission
Build a fully functional VST3/AU spectrum analyzer plugin similar to Voxengo SPAN using the JUCE framework. The plugin must compile, load in a DAW, and display real-time frequency analysis.

## Completion Promise
Output "RALPH_COMPLETE" only when ALL of the following are true:
- Plugin compiles without errors using CMake
- VST3 binary is generated in the build folder
- Plugin can be validated using pluginval (if available) or loads in a test host
- Real-time FFT spectrum display is functional

## Phase 1: Project Scaffolding
- [ ] Create JUCE audio plugin project structure with CMake
- [ ] Set up basic PluginProcessor and PluginEditor classes
- [ ] Verify project compiles with empty plugin shell
- **Checkpoint**: `cmake --build build` succeeds

## Phase 2: DSP Core
- [ ] Implement ring buffer for audio sample collection
- [ ] Add FFT processing using JUCE's FFT class (2048 or 4096 samples)
- [ ] Apply windowing function (Hanning/Blackman-Harris)
- [ ] Convert FFT output to dB scale with proper normalization
- **Checkpoint**: FFT data logged correctly in processBlock

## Phase 3: Spectrum Display
- [ ] Create custom Component for spectrum visualization
- [ ] Implement logarithmic frequency scale (20Hz - 20kHz)
- [ ] Draw frequency bins as filled path or line graph
- [ ] Add dB scale on Y-axis (-90dB to 0dB typical range)
- [ ] Implement smooth falloff/decay animation
- **Checkpoint**: Visual spectrum responds to audio input

## Phase 4: Features & Polish
- [ ] Add peak hold indicators with configurable decay
- [ ] Implement stereo L/R or Mid/Side display modes
- [ ] Add grid lines for frequency markers (100Hz, 1kHz, 10kHz)
- [ ] Parameter for FFT size selection (1024/2048/4096/8192)
- [ ] Slope compensation toggle (+3dB/octave pink noise reference)
- **Checkpoint**: All display features working

## Phase 5: Final Validation
- [ ] Run pluginval if available, or test in JUCE AudioPluginHost
- [ ] Verify no memory leaks or audio glitches
- [ ] Ensure CPU usage is reasonable (<5% on test signal)
- **Checkpoint**: Plugin is production-ready

## Technical Requirements
- Framework: JUCE 7.x or 8.x
- Build system: CMake
- Formats: VST3 (AU on macOS optional)
- Sample rates: Support 44.1kHz - 192kHz
- Buffer sizes: Handle 64 - 2048 samples

## Self-Correction Protocol
If build fails:
1. Read the exact error message
2. Search JUCE documentation for the failing API
3. Check CMakeLists.txt for missing modules (juce_dsp, juce_audio_utils)
4. Fix and retry

If FFT output looks wrong:
1. Verify windowing is applied before FFT
2. Check bin-to-frequency mapping: freq = bin * sampleRate / fftSize
3. Ensure magnitude calculation: 20 * log10(abs(complex))
4. Add debug logging to trace data flow

If display doesn't update:
1. Verify repaint() is called from timer (30-60fps)
2. Check atomic/lock-free data transfer from audio thread
3. Ensure graphics context uses correct coordinate transform

## Directory Structure
```
spectrum-analyzer-plugin/
├── CMakeLists.txt
├── src/
│   ├── PluginProcessor.h/.cpp
│   ├── PluginEditor.h/.cpp
│   ├── SpectrumAnalyzer.h/.cpp (DSP)
│   └── SpectrumComponent.h/.cpp (UI)
└── build/
```

## DO NOT
- Use blocking operations on the audio thread
- Allocate memory in processBlock
- Skip error handling on FFT edge cases
- Hardcode sample rate assumptions

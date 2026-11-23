# 5. Frontend Architecture & Accessibility Guide

## 5.1 Technology Stack & Design System

The EthioSign frontend is built with modern, accessible web technologies:
* **Framework**: React 19 + Vite 8
* **Styling**: Tailwind CSS v4 (with `@tailwindcss/vite`)
* **Icons**: `lucide-react` (Accessible SVG iconography)
* **Routing**: `react-router-dom` v7 (Declarative client-side routing)
* **Fonts**: Inter (Sans-serif) and Google Noto Sans Ethiopic for authentic Amharic script rendering.

---

## 5.2 Component Hierarchy

```
App.jsx (SettingsProvider + BrowserRouter + Layout)
│
├── Navbar (Branding, bilingual menu, active route indicators, mobile drawer)
├── Main Content Outlet:
│   ├── LandingPage (Hero, bilingual introduction, feature cards, CTA)
│   ├── DashboardPage (Two-way communication hub toggling Sign-to-Text & Speech-to-Sign)
│   ├── SignToTextPage (WebcamCapture + TranslationCard + Camera setup guide)
│   ├── SpeechToSignPage (SpeechInput + PhraseSequenceViewer + Suggested phrases)
│   ├── DictionaryPage (Search, category pills, sign card grid, demonstration modal)
│   ├── AboutPage (EthSL linguistic rationale, AI research, privacy safeguards)
│   └── SettingsPage (High-contrast, font scaling, TTS rate, camera selection, data wipe)
└── Footer (Privacy guarantees, community credits, WCAG compliance notes)
```

---

## 5.3 Custom Hooks Architecture

### 1. `useWebcam(selectedDeviceId)`
Encapsulates browser camera hardware lifecycle:
* Requests permission via `navigator.mediaDevices.getUserMedia`.
* Detects and lists video input devices via `enumerateDevices`.
* Cleans up hardware streams on unmount (`track.stop()`), ensuring the physical camera LED switches off.
* Exports `captureFrame()`, which grabs a centered square 256×256 snapshot onto an off-screen `<canvas>`.

### 2. `useSpeechRecognition({ lang })`
Integrates browser speech recognition (`webkitSpeechRecognition` / `SpeechRecognition`):
* Supports `am-ET` (Amharic) and `en-US` (English).
* Emits real-time interim results and finalized transcripts.
* Gracefully reports errors (`not-allowed`, `no-speech`, `language-not-supported`) and activates typed fallback.

### 3. `useSpeechSynthesis()`
Controls text-to-speech audio for hearing users:
* Loads browser voices and selects available Amharic or English voices.
* Supports speech rate, pitch, and volume adjustments.
* Exposes `speak(text)` and `stop()` methods with visual speaking state indicator.

---

## 5.4 WCAG 2.2 AA Accessibility Compliance

EthioSign is designed for both Deaf and hearing users, adhering to WCAG 2.2 Level AA accessibility:

1. **Dual Sensory Channels**: Audio information is never isolated. Every speech event emits synchronized visual cues (pulsing live badges, glowing borders, on-screen text transcripts).
2. **Keyboard Navigation & Skip Link**: Includes a high-priority "Skip to main content" link for keyboard/screen-reader users. All buttons and interactive cards carry visible `:focus-visible` outline rings with 2px offset.
3. **High Contrast Mode**: Accessible toggle elevates text and card borders to 7:1 contrast ratios.
4. **Ethiopic Typography**: Utilizes `Noto Sans Ethiopic` with high legibility fallbacks (`Abyssinica SIL`, `system-ui`), ensuring Amharic Fidel characters render without clipping or blurriness.
5. **Slow-Motion Sign Learning**: Sign video demonstrations can be throttled to 0.5x or 0.75x speed to enable comfortable visual comprehension.

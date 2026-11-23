# 2. System Architecture & Component Flows

## 2.1 Multi-Tier Architecture Overview

EthioSign is engineered with a modular, service-oriented architecture ensuring separation of concerns between client rendering, application data services, and heavy computer vision inference:

```mermaid
graph TD
    subgraph Client Tier ["Client Tier (Browser / React 19)"]
        UI["Webcam Capture & Framing UI"]
        AudioIn["Speech Recognition (Web Speech API)"]
        TTS["Speech Synthesis (Web Speech API)"]
        DictUI["EthSL Dictionary & Slow-Mo Video Player"]
        Adapter["Recognition Service Adapter"]
    end

    subgraph AppTier ["Application Backend (Node.js & Express)"]
        ExpServer["Express API Server (Port 5000)"]
        LexiconService["EthSL Vocabulary & Media Registry"]
        SessionService["Opt-in Session History Controller"]
        FeedbackService["Community Validation Controller"]
    end

    subgraph AITier ["AI Inference Tier (Python & FastAPI)"]
        FastAPI["FastAPI Inference Server (Port 8000)"]
        LandmarkEngine["MediaPipe Holistic / Landmark Parser"]
        ModelPipeline["CESLR ResNet18-BiLSTM-CTC Model"]
        ConfidenceCalibrator["Confidence & Out-of-Vocabulary Filter"]
    end

    subgraph DataTier ["Data Tier (MongoDB Atlas)"]
        DBSigns[("Signs Collection")]
        DBCategories[("Categories Collection")]
        DBFeedback[("Community Feedback Collection")]
        DBSessions[("Opt-in Conversations")]
    end

    UI -->|Local Frame / Landmarks| Adapter
    Adapter -->|POST /api/ai/predict| FastAPI
    FastAPI --> LandmarkEngine --> ModelPipeline --> ConfidenceCalibrator
    ConfidenceCalibrator -->|Prediction Result| Adapter

    DictUI -->|GET /api/signs| ExpServer
    AudioIn -->|Spoken Words| ExpServer
    ExpServer --> LexiconService
    LexiconService --> DBSigns
    ExpServer --> SessionService --> DBSessions
    ExpServer --> FeedbackService --> DBFeedback
```

---

## 2.2 Sequence Diagram: Direction A (Sign-to-Text & Speech)

The following sequence diagram details the real-time processing flow from a Deaf user signing in front of the camera to the spoken audio output:

```mermaid
sequenceDiagram
    autonumber
    actor DeafUser as Deaf Signer
    participant Browser as React Frontend
    participant Cam as MediaDevices API
    participant AI as Python AI Service
    participant TTS as Web Speech Synthesis
    actor HearingUser as Hearing Responder

    DeafUser->>Browser: Opens Sign-to-Text & starts camera
    Browser->>Cam: getUserMedia({ video: 640x480, facingMode: 'user' })
    Cam-->>Browser: MediaStream tracks attached to <video>
    DeafUser->>Cam: Performs EthSL sign (e.g. "አመሰግናለሁ")
    Browser->>Browser: Captures square-centered 256x256 frame from Canvas
    Browser->>AI: POST /api/ai/predict { frame: base64, mode: 'frames' }
    AI->>AI: Preprocessing & ResNet18 spatial feature extraction
    AI->>AI: BiLSTM temporal sequence pass + CTC decoder
    AI->>AI: Calculate confidence (e.g. 0.94)
    alt Confidence >= Threshold (0.65)
        AI-->>Browser: { success: true, prediction: "አመሰግናለሁ", english: "Thank you", conf: 0.94 }
        Browser->>Browser: Renders translation card with Ethiopic script
        opt Auto-Speak Enabled
            Browser->>TTS: speak("አመሰግናለሁ")
            TTS-->>HearingUser: Audibly announces translated message
        end
    else Confidence < Threshold or Unrecognized
        AI-->>Browser: { success: false, status: "unrecognized" }
        Browser-->>DeafUser: Visual notification: "Sign not recognized. Please try again."
    end
```

---

## 2.3 Sequence Diagram: Direction B (Speech/Text-to-Sign)

The following sequence diagram details how hearing users communicate back using speech or text:

```mermaid
sequenceDiagram
    autonumber
    actor HearingUser as Hearing Responder
    participant Browser as React Frontend
    participant Mic as SpeechRecognition API
    participant NLP as Lexicon Matcher
    participant DB as Sign Video Registry
    actor DeafUser as Deaf Signer

    HearingUser->>Browser: Clicks microphone or types message
    alt Voice Input
        Browser->>Mic: recognition.start() [lang: 'am-ET' / 'en-US']
        HearingUser->>Mic: Speaks: "ደህና ነኝ አመሰግናለሁ"
        Mic-->>Browser: Returns final transcript
    else Typed Input
        HearingUser->>Browser: Types message in textarea
    end
    Browser->>NLP: translateTextToSigns(transcript)
    NLP->>DB: Query exact phrase match or word lemmas
    DB-->>NLP: Matched EthSL sign entries (videoUrl, gloss, keypoints)
    NLP-->>Browser: { matchedSigns: [...], unmatchedWords: [] }
    Browser-->>DeafUser: Displays sequenced sign video player with slow-mo controls
    opt Words outside 62-gloss corpus
        Browser-->>HearingUser: Notice: "Some words are outside current verified EthSL vocabulary"
    end
```

---

## 2.4 Privacy & Biometric Data Security Model

Because EthioSign processes potentially sensitive visual and audio data, security and user privacy are foundational:

| Privacy Principle | Implementation Details |
| :--- | :--- |
| **Volatile In-Memory Processing** | Camera frames captured to canvas are held strictly in browser RAM or processed in transient server worker memory during inference. Frames are automatically garbage-collected and never written to disk. |
| **No Involuntary Recording** | Raw webcam video streams and microphone audio clips are **never** stored on databases, cloud buckets, or third-party analytical endpoints. |
| **Explicit Hardware Release** | Stopping the camera or microphone calls `MediaStreamTrack.stop()` across all active tracks, completely shutting down hardware sensors and physical indicator LEDs. |
| **Local-Only Opt-in History** | Conversation session logging is disabled by default. If a user explicitly turns on "Save History", data is preserved solely inside the client's private `localStorage` with a single-click "Clear All Data" wipe button. |
| **Human Validation vs AI Prediction** | The user interface maintains a strict visual boundary between validated community demonstrations and automated AI predictions with confidence ratings. |

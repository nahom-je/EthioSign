# EthioSign: System Architecture & Communication Blueprint

## 1. High-Level Architecture

EthioSign adopts a decoupled, multi-tiered service-oriented architecture:

```
+-------------------------------------------------------------------------------+
|                             CLIENT TIER (React.js)                            |
|                                                                               |
|  +--------------------+   +-----------------------+   +--------------------+  |
|  |  Sign-to-Text Cam  |   |  Speech-to-Sign Voice |   |  EthSL Dictionary  |  |
|  |  (MediaPipe JS)    |   |  (Web Speech API)     |   |  & Video Player    |  |
|  +---------+----------+   +-----------+-----------+   +---------+----------+  |
|            |                          |                         |             |
|            +-------------------+------+-------------------------+             |
|                                |                                              |
|                                v                                              |
|                   +------------------------+                                  |
|                   |  Recognition Adapter   |                                  |
|                   |  & Speech Synthesizer  |                                  |
|                   +------------+-----------+                                  |
+--------------------------------|----------------------------------------------+
                                 |
              +------------------+------------------+
              | HTTP / REST                         | HTTP / JSON Landmarks
              v                                     v
+-----------------------------+       +-----------------------------+
|    Node.js / Express API    |       |      Python AI Service      |
|                             |       |          (FastAPI)          |
| - Vocabulary & Categories   |       |                             |
| - Sign Video Metadata       |       | - CESLR PyTorch Model       |
| - Session & Feedback Store  |       | - Skeleton Landmark Engine  |
| - Translation History Opt-in|       | - CTC Sequence Decoder      |
+--------------+--------------+       +--------------+--------------+
               |                                     ^
               v                                     |
+-----------------------------+                      |
|       MongoDB Atlas         |                      |
|  (Signs, Videos, Feedback)  |                      |
+-----------------------------+                      |
               |                                     |
               +-------------------------------------+
```

---

## 2. Component Communication Flows

### 2.1 Direction A: Ethiopian Sign Language → Text & Speech
1. **Camera Capture**: Frontend requests webcam stream via `navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })`.
2. **Keypoint / Frame Processing**:
   - Client-side MediaPipe tracks hand presence, body pose, and spatial bounding box.
   - When active signing gesture motion is detected, frames/landmarks are batched over a rolling window (e.g., 30 frames at 15-20 fps).
3. **Inference Call**: Frontend calls `POST /api/ai/predict` on Python AI service (or via Express API proxy).
4. **Prediction Output**: Returns recognized EthSL gloss (e.g., `"አመሰግናለሁ"`, `"ደህና"`), English equivalent (`"Thank you"`, `"Hello/Fine"`), confidence score, and status (`"recognized"`, `"low_confidence"`, `"uncertain"`).
5. **Speech Synthesis**: Optional Web Speech `speechSynthesis.speak()` or audio playback audibly announces the translation for hearing users.

### 2.2 Direction B: Speech / Text → Ethiopian Sign Language
1. **Audio / Text Input**: Hearing user speaks into microphone via `webkitSpeechRecognition` / `SpeechRecognition` or types into the conversation box.
2. **Grammar & Lexicon Matching**: Express backend / frontend NLP tokenizer normalizes Amharic or English text and resolves lemmas matching EthSL vocabulary and verified phrases.
3. **Validated Video Retrieval**: Corresponding validated sign language video demonstration is displayed with synchronized controls, slow-motion playback, and gloss subtitles.

---

## 3. Privacy & Edge Security Guarantees
- **No Video Persistence**: Raw webcam frames are processed transiently in volatile RAM and immediately discarded.
- **No Audio Surveillance**: Speech recognition is user-initiated (click-to-talk) and stops immediately upon utterance completion.
- **Client Disconnect**: Stopping the camera or microphone completely stops the MediaStream tracks, turning off physical camera/mic indicator lights.

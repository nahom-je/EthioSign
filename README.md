# EthioSign (ኢትዮ-ሳይን)
## AI-Powered Ethiopian Sign Language Communication Platform

EthioSign is an accessible, modern, two-way communication platform designed to bridge the communication barrier between the Deaf community communicating in **Ethiopian Sign Language (EthSL)** and hearing individuals who do not know sign language.

> [!IMPORTANT]
> **Linguistic Authenticity**: The target language is **Ethiopian Sign Language (EthSL)**, *not* American Sign Language (ASL). EthSL has its own distinct phonology, morphology, syntax, and cultural context. All vocabulary and representations in EthioSign are grounded in authentic EthSL datasets and community validation.

---

## 🌟 Key Features

1. **Two-Way Communication Dashboard**:
   - **Direction A (Sign → Text/Speech)**: Real-time visual analysis of EthSL signs captured via camera, producing Amharic and English translations with speech synthesis.
   - **Direction B (Speech/Text → Sign)**: Transcribes spoken Amharic/English voice or typed text, matches verified EthSL grammar and phrases, and presents validated sign demonstrations.
2. **Interactive EthSL Dictionary**:
   - Comprehensive categorized vocabulary (Greetings, Family, Daily Living, Health, Education, Places, Descriptors).
   - Sign breakdown, usage notes, regional variants, and grammatical context.
3. **Privacy by Design**:
   - Zero involuntary video recording. All webcam and microphone streams operate strictly within client memory, extracting features without storing raw biometric video.
4. **Accessible First**:
   - Dual visual/auditory feedback loops, high-contrast WCAG 2.2 AA compliant palette, full keyboard navigation, and bilingual Ethiopic (Amharic) and Latin typography.

---

## 🏗️ Architecture Overview

```
                      +-----------------------------+
                      |       User Browser          |
                      |  React 18 + Vite + Tailwind |
                      |    (MediaPipe / WebSpeech)  |
                      +--------------+--------------+
                                     |
                 +-------------------+-------------------+
                 | REST / WebSocket                      | REST
                 v                                       v
+--------------------------------+      +---------------------------------+
|      Express.js Backend        |      |       Python AI Service         |
| - Vocabulary & Dictionary      |<---->| - Landmark Preprocessing        |
| - Verified Video Registry      |      | - ResNet18-BiLSTM CTC / LSTM    |
| - Session / Privacy Controller |      | - Confidence & Gloss Alignment  |
+---------------+----------------+      +---------------------------------+
                |
                v
+--------------------------------+
|       MongoDB Database         |
| - Signs, Categories, Feedback  |
+--------------------------------+
```

---

## 📂 Repository Structure

```
EthioSign/
├── frontend/             # React + Vite client application
├── backend/              # Node.js + Express REST API server
├── ai-service/           # FastAPI Python computer vision & ML service
├── docs/                 # Architectural specifications, AI research, and guides
│   ├── architecture.md
│   ├── ai-model-research.md
│   ├── api-documentation.md
│   └── setup-guide.md
├── README.md
└── .gitignore
```

---

## 🚀 Quick Start

See the detailed [Setup Guide](file:///docs/setup-guide.md) for full instructions.

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 2. Backend
```bash
cd backend
npm install
npm run dev
```

### 3. AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

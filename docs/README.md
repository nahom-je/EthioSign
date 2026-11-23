# EthioSign Documentation Hub (ኢትዮ-ሳይን)

Welcome to the official technical documentation for **EthioSign**, an AI-powered two-way communication platform connecting the Deaf community communicating in **Ethiopian Sign Language (EthSL)** and hearing individuals.

---

## 📚 Documentation Index

| Document | Description |
| :--- | :--- |
| **[1. Project Overview & Linguistic Foundation](./project-overview.md)** | Mission, problem statement, Ethiopian Sign Language (EthSL) vs ASL, user personas, and two-way interaction models. |
| **[2. System Architecture & Component Flows](./system-architecture.md)** | Full architectural diagrams, React/Express/FastAPI/MongoDB interactions, data flow sequences, and privacy safeguards. |
| **[3. AI & Computer Vision Engineering](./ai-and-computer-vision.md)** | Vision pipeline, MediaPipe landmark extraction, CESLR ResNet18-BiLSTM-CTC model audit, confidence calibration, and model evaluation metrics. |
| **[4. EthSL Linguistic Corpus & Dictionary](./ethsl-dictionary-and-linguistics.md)** | Complete 62-gloss authentic EthSL vocabulary registry, phonological handshapes, non-manual markers, categories, and verified multi-word phrases. |
| **[5. Frontend Architecture & Accessibility Guide](./frontend-guide.md)** | React 19 component hierarchy, Vite + Tailwind CSS v4 setup, custom hooks (`useWebcam`, `useSpeechRecognition`, `useSpeechSynthesis`), and WCAG 2.2 AA accessibility. |
| **[6. API Specifications (REST & AI)](./api-specification.md)** | Complete endpoint specifications for the Node.js Express backend and Python FastAPI inference engine with JSON schemas. |
| **[7. Database Schemas & Models](./database-schema.md)** | MongoDB collections (Signs, Categories, Conversations, Feedback, Users), indexing strategies, and privacy retention rules. |
| **[8. Setup, Installation & Deployment](./setup-guide.md)** | Local development environment setup, dependencies, running services, and free-tier production deployment strategies. |

---

## 🏛️ Core Principles

1. **Linguistic Authenticity**: EthSL is a distinct visual-gestural language with unique grammar, idioms, and cultural signs. EthioSign strictly refuses to substitute American Sign Language (ASL) models or datasets.
2. **Responsible AI & Honest Confidence**: Low-confidence or uncatalogued signs trigger transparent feedback (*"Sign not recognized. Please try again."*) rather than fabricated predictions.
3. **Privacy by Design**: Zero permanent retention of raw camera video or audio recordings. Processing occurs in volatile RAM or locally on client hardware.
4. **Inclusive Accessibility**: Fully supports Deaf, hard-of-hearing, and hearing users through dual sensory feedback channels, bilingual Amharic/English text, and WCAG 2.2 AA compliance.

# EthioSign: AI Model & Dataset Research Investigation

This document details the investigation of existing Ethiopian Sign Language (EthSL) datasets, machine learning models, research papers, and technical accessibility as required by Section 5 and Section 19 of the project specification.

---

## 1. Candidate Source Audit

| Resource | Status | Model Architecture | Pretrained Weights Available? | Findings & Suitability |
| :--- | :--- | :--- | :--- | :--- |
| **AMU ET-Sign-Language-Translator-ML**<br>`github.com/AMU-Final-Project-Team/ET-Sign-Language-Translator-ML` | **Unavailable** | Unknown | ❌ No | Repository is non-existent, made private, or deleted from GitHub. Unusable as a direct source. |
| **CESLR (Continuous Ethiopian Sign Language Recognition)**<br>`github.com/ethio-artifical/CESLR` | **Verified & Accessible** | ResNet-18 (2D CNN) + 1D Conv + BiLSTM + CTC Decoder | ✅ **Yes**<br>Release: `baseline-res18-epoch38`<br>Asset: `dev_02.58_epoch38_model.pt` (380.8 MB) | Validated research project (surafela/ethio-artifical). Contains ground-truth `.stm` annotations, `gloss_dict.npy` with 62 distinct EthSL glosses, and PyTorch inference pipeline (`test_one_video.py`, `demo.py`). |
| **PMC12533181 Research Paper**<br>Scientific Reports 2024:<br>*"A deep learning framework for Ethiopian sign language recognition using skeleton-based representation"* | **Validated Research** | MediaPipe Holistic (Landmarks) + CNN-LSTM / BiLSTM / GRU | ⚠️ Dataset referenced (5,600 annotated videos), weights on academic request | Proves the viability and efficiency of MediaPipe skeleton landmark extraction (pose, hands, face) for EthSL: 94% signer-dependent, 73% signer-independent accuracy. |

---

## 2. Deep Dive: CESLR Dataset & Model Characteristics

### 2.1 Vocabulary Breakdown (62 EthSL Glosses)
The CESLR dataset features 22 native signers performing 30 continuous everyday sentences composed of 62 unique Amharic glosses:

- **Greetings & Core Dialogue**: `አመሰግናለሁ` (Thank you), `ደህና` (Fine/Well/Hello), `ዛሬ` (Today), `ማን` (Who), `የት` (Where)
- **Family & People**: `እናቴ` (My mother), `አባቴ` (My father), `አባቴን` (My father [acc]), `እህቴ` (My sister), `እህቴን` (My sister [acc]), `ወንድሜ` (My brother), `ልጆች` (Children), `ቤተሰብ` (Family), `ዘመድ` (Relative), `ጓደኛ` (Friend), `እኔ` (I/Me), `የእኛ` (Our)
- **Daily Living & Nutrition**: `ሆስፒታሉ` (The hospital), `ሆቴል` (Hotel), `ሆቴሉ` (The hotel), `ቤቱ` (The house), `ዳቦ` (Bread), `እንጀራ` (Injera), `ማር` (Honey), `ሀኪም` (Doctor)
- **Qualities & Colors**: `ቀይ` (Red), `ቢጫ` (Yellow), `አረንጓዴ` (Green), `ሰፊ` (Spacious), `ጠባብ` (Narrow), `ቀጭን` (Slender), `ወፍራም` (Thick/Stout), `ንጽህ` (Clean), `በጣም` (Very)
- **Actions & Relations**: `በላ` (Ate), `በላሁ` (I ate), `እሄዳለሁ` (I will go), `ማየት` (To see), `ማድረግ` (To do), `መዝናናት` (To relax), `እወዳለሁ` (I love/like), `ትወዳለች` (She loves), `ይወዳል` (He loves), `ይወዳሉ` (They love), `ይፈልጋሉ` (They want)
- **Cultural & Civic**: `የኢትዮጵያ` (Ethiopian), `ባንዲራ` (Flag), `አንበሳ` (Lion), `ፍቅር` (Love), `ክብር` (Honor/Respect), `ጸሎት` (Prayer)

### 2.2 Model Specifications
- **Input Format**: Video clip normalized to 256×256 pixels, center-cropped to 224×224, sampled at ~15-25 FPS.
- **Backbone**: ResNet-18 feature extractor per frame -> temporal 1D convolution -> 2-layer Bidirectional LSTM.
- **Loss / Decoding**: Connectionist Temporal Classification (CTC) loss; decoded using `pyctcdecode` or greedy CTC argmax.
- **Trained Metric**: Dev WER: 2.58%, Test WER: 6.67% on CESL multi-signer benchmark.

---

## 3. Technical Risks & Practical Constraints

1. **Signer Independence**: As noted in PMC12533181, accuracy drops from 94% (signer-dependent) to 73% (signer-independent). In real-world web usage, variations in camera angle, lighting, skin tone, and body proportions require conservative confidence thresholds.
2. **Computational Footprint**: 380 MB PyTorch model requires GPU acceleration for multi-frame real-time streaming; CPU inference on a browser webcam feed at 30fps is prone to bottlenecking.
3. **Dual Pipeline Strategy**:
   - **Client-Side / Hybrid Edge**: MediaPipe Hands & Pose landmarks running in browser via WebAssembly/WebGL to detect sign presence, frame bounds, and keypoint sequences with zero latency.
   - **Backend Inference Provider**: Python FastAPI service exposing the CESLR PyTorch sequence model for verified phrase classification and landmark sequence classifier.
   - **Mock / Simulator Mode**: Cleanly isolated adapter allowing frontend development and UI testing with explicit visual badges indicating demonstration mode vs live AI model.

---

## 4. EthSL vs ASL Boundary Policy
- **Absolute Rule**: American Sign Language datasets (e.g., WLASL, ASL Citizen) must **never** be presented as Ethiopian Sign Language.
- Where machine learning techniques are transferred (e.g., landmark sequence processing with BiLSTM), the vocabulary, weights, labels, and validation remain strictly EthSL.

# 3. AI & Computer Vision Engineering

## 3.1 Computer Vision Pipeline Overview

The primary computer vision task in EthioSign is recognizing continuous and isolated Ethiopian Sign Language signs from live webcam streams without introducing prohibitive latency.

```mermaid
flowchart LR
    A[Webcam 640x480] --> B[Center Crop & Resize 256x256]
    B --> C[MediaPipe Holistic / Landmark Extraction]
    C --> D[Temporal Feature Buffer 30 frames]
    D --> E[Spatial-Temporal Neural Network]
    E --> F[CTC Beam Search / Greedy Decoder]
    F --> G[Confidence & Out-of-Vocabulary Filter]
    G --> H[Amharic / English Gloss Output]
```

---

## 3.2 Feature Extraction: Pixels vs Landmarks

EthioSign adopts a hybrid vision strategy based on empirical findings from recent EthSL research:

### Strategy 1: Skeleton Landmark Representation (MediaPipe Holistic)
As validated in the 2024 *Scientific Reports* study (PMC12533181):
* **Why Landmarks?** Raw RGB video contains background clutter, skin tone variance, clothing distractions, and fluctuating lighting conditions. By extracting skeletal landmarks, the input representation is invariant to background and lighting.
* **Extracted Keypoints (543 total landmarks)**:
  - **Pose Landmarks**: 33 keypoints (shoulders, elbows, wrists, neck, torso).
  - **Hand Landmarks (Left & Right)**: 21 keypoints per hand (carpal, metacarpal, proximal, distal, tips).
  - **Facial Landmarks**: 468 keypoints (eyebrow displacement, mouth shapes, head orientation) essential for grammatical non-manual markers.
* **Performance**: Yields 94% signer-dependent accuracy and drastically lowers bandwidth, as sending a vector of coordinates `(x, y, z)` is orders of magnitude smaller than uploading high-definition video frames.

### Strategy 2: Spatio-Temporal Video Encoders (CESLR ResNet18-BiLSTM)
* **Visual Encoder**: ResNet-18 pretrained backbone extracts spatial visual feature vectors per frame.
* **Temporal Convolution (1D)**: Captures localized inter-frame gesture speed and trajectory.
* **Bidirectional LSTM (BiLSTM)**: Evaluates forward and backward dependencies across 30–120 frames.
* **Connectionist Temporal Classification (CTC)**: Solves the continuous sequence alignment problem where the boundary between signs is unsegmented.

---

## 3.3 Verified Pretrained Weights & Research Benchmark Audit

### Audit Details for CESLR (`ethio-artifical/CESLR`):
* **Repository**: `https://github.com/ethio-artifical/CESLR`
* **Pretrained Model Asset**: `dev_02.58_epoch38_model.pt` (380.8 MB)
* **Release Tag**: `baseline-res18-epoch38`
* **Architecture**: ResNet-18 -> 1D Conv -> 2-layer BiLSTM -> CTC Loss
* **Benchmark Results**:
  - Development Word Error Rate (WER): **2.58%**
  - Test Word Error Rate (WER): **6.67%**
  - Exact sentence matches: 129 out of 150 test instances.
* **Vocabulary Matrix**: 62 classes (`num_classes: 63` including CTC blank token) mapped via `gloss_dict.npy`.

---

## 3.4 Confidence Calibration & Uncertainty Handling

A critical directive of the EthioSign specification (Section 5.5) is that the system must **never** present incorrect or low-confidence predictions as guaranteed translations.

### Calibration Thresholds:
$$\text{Threshold} = 0.65$$

* **High Confidence ($\ge 0.85$)**: Prediction rendered with Green badge; auto-speak triggered if enabled.
* **Medium Confidence ($0.65 \le c < 0.85$)**: Prediction rendered with Amber badge and caveat notice.
* **Low Confidence ($c < 0.65$) or Out-of-Vocabulary**: Prediction discarded. The interface displays:
  > *"Sign not recognized. Please try again."*

### Why Out-of-Vocabulary Detection Matters:
Because signers naturally introduce regional slang or gestures outside the 62-gloss catalog, an unrestricted Softmax argmax would dangerously force an incorrect prediction. The CTC blank probability and Softmax entropy are monitored to detect when a sign is outside the model's lexicon.

---

## 3.5 Signer-Independent vs Signer-Dependent Performance

Machine learning models for sign language behave fundamentally differently depending on whether the test user was part of the training set:

| Evaluation Setting | Accuracy | Key Challenges | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Signer-Dependent** (Seen user) | ~94% | Signer-specific quirks memorized by the network. | Good for personalized profile calibration. |
| **Signer-Independent** (Unseen user) | ~73% | Variations in hand anatomy, signing radius, speed, and dialect. | Skeleton normalization (centering wrist/nose), conservative confidence thresholds, and user framing guides. |

EthioSign incorporates visual framing guides on the webcam viewport to assist signers in positioning themselves at the optimal distance and angle, maximizing inference accuracy for unseen users.

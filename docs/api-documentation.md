# EthioSign API Documentation

## Express Backend API (Port 5000)

### 1. Vocabulary & Dictionary
- `GET /api/signs`: Retrieve verified EthSL signs. Query params: `category`, `search`, `language`.
- `GET /api/signs/:id`: Retrieve single sign details by ID or slug.
- `GET /api/categories`: List all sign categories with sign counts.
- `GET /api/phrases`: List verified multi-word conversational phrases.

### 2. Conversations & Session History
- `POST /api/conversations`: Create a new communication session (opt-in history).
- `GET /api/conversations/:id`: Retrieve conversation turns.
- `DELETE /api/conversations/:id`: Permanently delete conversation transcript.

### 3. Community Feedback & Validation
- `POST /api/feedback`: Submit community feedback on sign accuracy, regional variants, or model recognition quality.

---

## Python AI Service API (FastAPI - Port 8000)

### 1. Health & Status
- `GET /api/health`: Returns model readiness, active device (CUDA/MPS/CPU), and loaded vocabulary count.

### 2. Inference
- `POST /api/ai/predict`:
  - Request:
    ```json
    {
      "frames": ["base64_encoded_frame_1", ...],
      "landmarks": [[...], ...],
      "mode": "landmarks" | "frames"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "prediction": {
        "amharic": "አመሰግናለሁ",
        "english": "Thank you",
        "confidence": 0.94,
        "glossId": 29
      },
      "status": "recognized",
      "latencyMs": 42
    }
    ```

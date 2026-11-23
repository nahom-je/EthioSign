# 6. API Specifications (REST & AI)

## 6.1 Node.js Express Backend API (Port 5000)

### 1. Health Status
* **`GET /api/health`**
  * **Response**:
    ```json
    {
      "status": "healthy",
      "service": "EthioSign Backend API",
      "version": "1.0.0",
      "timestamp": "2026-11-23T11:00:00.000Z"
    }
    ```

### 2. Sign Vocabulary & Lexicon
* **`GET /api/signs`**
  * **Query Parameters**:
    - `category` (optional): Filter by category ID (e.g. `greetings`, `family`, `food`).
    - `search` (optional): Keyword search in Amharic or English.
  * **Response**:
    ```json
    {
      "success": true,
      "count": 62,
      "data": [
        {
          "id": "ethsl-01",
          "gloss": "አመሰግናለሁ",
          "english": "Thank you",
          "category": "greetings",
          "meaning": "Expression of gratitude and appreciation.",
          "videoUrl": "/videos/amesegenalehu.mp4",
          "verified": true,
          "source": "CESLR Corpus / Addis Ababa EthSL Community",
          "regionalVariant": "Addis Ababa standard"
        }
      ]
    }
    ```

* **`GET /api/signs/:id`**
  * Retrieves individual sign record and full usage guidelines.

* **`GET /api/categories`**
  * Returns list of supported categories with count of validated signs.

### 3. Community Feedback & Validation
* **`POST /api/feedback`**
  * **Request**:
    ```json
    {
      "signId": "ethsl-01",
      "feedbackType": "accuracy" | "regional_variant" | "suggestion",
      "description": "In Wollo region, this sign starts with an alternate hand orientation.",
      "contactEmail": "signer@example.com"
    }
    ```
  * **Response**:
    ```json
    { "success": true, "message": "Feedback submitted for community review." }
    ```

---

## 6.2 Python FastAPI AI Service (Port 8000)

### 1. AI Service Health & Model Status
* **`GET /api/health`**
  * **Response**:
    ```json
    {
      "status": "healthy",
      "service": "EthioSign AI Inference Service",
      "modelLoaded": true,
      "modelName": "CESLR-ResNet18-BiLSTM-CTC",
      "targetLanguage": "EthSL",
      "vocabularySize": 62,
      "activeDevice": "cuda"
    }
    ```

### 2. Sign Inference
* **`POST /api/ai/predict`**
  * **Request**:
    ```json
    {
      "frame": "data:image/jpeg;base64,...",
      "landmarks": [[0.52, 0.41, -0.02], ...],
      "mode": "landmarks"
    }
    ```
  * **Successful Prediction Response**:
    ```json
    {
      "success": true,
      "prediction": {
        "amharic": "አመሰግናለሁ",
        "english": "Thank you",
        "confidence": 0.94,
        "category": "greetings"
      },
      "status": "recognized",
      "model": "CESLR-ResNet18-CTC-v1",
      "latencyMs": 38.5
    }
    ```
  * **Uncertain / Out-of-Vocabulary Response**:
    ```json
    {
      "success": false,
      "prediction": null,
      "status": "unrecognized",
      "message": "Sign not recognized. Please try again.",
      "latencyMs": 31.0
    }
    ```

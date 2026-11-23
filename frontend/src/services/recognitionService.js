/**
 * recognitionService.js  (Phase 2 & 3 update)
 *
 * Recognition Adapter with three pluggable providers:
 *
 *  1. 'fastapi'   → Live Python CESLR model (Phase 3).
 *                   Sends landmark sequence or frame to FastAPI /api/ai/predict.
 *
 *  2. 'mediapipe' → Client-side landmark-only classification (future phase).
 *
 *  3. 'mock'      → Transparent development simulator using real EthSL 62-gloss
 *                   catalog. Explicitly labelled as DEMONSTRATION in all UI.
 *
 * The frontend never knows which backend provider is active; it only uses the
 * typed PredictionResult interface. Swapping providers requires zero React changes.
 */

import { ETHSL_VOCABULARY } from '../data/ethslVocabulary';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

/** @typedef {{ amharic: string, english: string, category: string, confidence: number, model: string }} Prediction */
/** @typedef {{ success: boolean, prediction: Prediction|null, status: string, isMock?: boolean, error?: string }} PredictionResult */

class RecognitionService {
  constructor() {
    // Auto-detect: try fastapi, fall back to mock
    this._provider = 'mock';
    this._apiOnline = false;
    this._checkApi();
  }

  /** Ping the FastAPI service and switch provider if reachable */
  async _checkApi() {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/api/health`, {
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.modelLoaded) {
          this._provider = 'fastapi';
          this._apiOnline = true;
          console.info('[RecognitionService] FastAPI AI service online → switching to live model.');
        }
      }
    } catch {
      console.info('[RecognitionService] FastAPI offline → using mock provider for development.');
    }
  }

  get provider() { return this._provider; }
  get isLive()   { return this._provider === 'fastapi' && this._apiOnline; }

  setProvider(type) { this._provider = type; }

  /**
   * Primary inference method.
   *
   * @param {Object} opts
   * @param {string|null}   opts.frameDataUrl    - Base-64 JPEG frame (optional)
   * @param {number[]|null} opts.landmarkVector  - Flat 258-value landmark array (preferred)
   * @param {number[][]|null} opts.landmarkSequence - Array of landmark vectors (for sequence model)
   * @param {number|null}   opts.mockGlossIndex  - Force a specific gloss in mock mode (testing only)
   * @returns {Promise<PredictionResult>}
   */
  async predictSign({ frameDataUrl = null, landmarkVector = null, landmarkSequence = null, mockGlossIndex = null }) {

    if (this._provider === 'fastapi') {
      return this._callFastApi({ frameDataUrl, landmarkVector, landmarkSequence });
    }

    // Mock provider — always labeled
    return this._mockPredict(mockGlossIndex);
  }

  // -------------------------------------------------------------------------
  // Provider: FastAPI (Phase 3 - CESLR ResNet18-BiLSTM-CTC)
  // -------------------------------------------------------------------------
  async _callFastApi({ frameDataUrl, landmarkVector, landmarkSequence }) {
    try {
      const payload = {
        frame: frameDataUrl ?? null,
        landmarks: landmarkSequence ?? (landmarkVector ? [landmarkVector] : null),
        mode: landmarkSequence ? 'sequence' : landmarkVector ? 'landmarks' : 'frame'
      };

      const res = await fetch(`${AI_SERVICE_URL}/api/ai/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) {
        throw new Error(`AI service HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.success || !data.prediction) {
        return {
          success: false,
          prediction: null,
          status: data.status ?? 'unrecognized',
          isMock: false
        };
      }

      return {
        success: true,
        prediction: {
          amharic:    data.prediction.amharic,
          english:    data.prediction.english,
          category:   data.prediction.category,
          confidence: data.prediction.confidence,
          model:      data.prediction.model ?? 'CESLR-ResNet18-CTC'
        },
        status: data.status,
        latencyMs: data.latencyMs,
        isMock: false
      };

    } catch (err) {
      console.warn('[RecognitionService] FastAPI call failed:', err.message);
      this._apiOnline = false;
      this._provider  = 'mock';

      return {
        success: false,
        prediction: null,
        status: 'service_unavailable',
        error: 'AI inference service is offline. Using development mock provider.',
        isMock: false
      };
    }
  }

  // -------------------------------------------------------------------------
  // Provider: Mock / Demonstration (always clearly labeled in UI)
  // -------------------------------------------------------------------------
  async _mockPredict(forcedIndex = null) {
    // Simulate realistic ~300–500 ms inference latency
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));

    const sign =
      forcedIndex !== null && ETHSL_VOCABULARY[forcedIndex]
        ? ETHSL_VOCABULARY[forcedIndex]
        : ETHSL_VOCABULARY[Math.floor(Math.random() * ETHSL_VOCABULARY.length)];

    return {
      success: true,
      prediction: {
        amharic:    sign.gloss,
        english:    sign.english,
        category:   sign.category,
        confidence: 0.88 + Math.random() * 0.09,   // 88–97% realistic range
        model:      '[DEMO] Mock Provider – EthSL 62-Gloss Catalog'
      },
      status: 'recognized',
      isMock: true,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton — shared across all pages
export const recognitionService = new RecognitionService();

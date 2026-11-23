# 7. Database Schemas & Data Architecture

EthioSign utilizes **MongoDB** via **Mongoose** object data modeling.

---

## 7.1 Schema Definitions

### 1. `Sign` Schema (`signs` collection)
Stores validated Ethiopian Sign Language vocabulary items:

```javascript
const SignSchema = new mongoose.Schema({
  word: { type: String, required: true, index: true },           // e.g. "አመሰግናለሁ"
  english: { type: String, required: true, index: true },        // e.g. "Thank you"
  language: { type: String, default: "EthSL" },                  // Fixed to EthSL
  meaning: { type: String, required: true },
  category: { type: String, required: true, index: true },       // e.g. "greetings", "food"
  videoUrl: { type: String, required: true },                    // Path or CDN link to demo
  posterUrl: { type: String },
  verified: { type: Boolean, default: true },
  source: { type: String, required: true },                      // e.g. "CESLR Corpus / ENAD"
  regionalVariant: { type: String, default: "National Standard" },
  keypointsDescription: { type: String },                        // Phonological description
  createdAt: { type: Date, default: Date.now }
});

// Full-text index for instant Amharic & English search
SignSchema.index({ word: "text", english: "text", meaning: "text" });
```

---

### 2. `Category` Schema (`categories` collection)
Taxonomy groups for navigation:

```javascript
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },          // e.g. "Food & Dining"
  amharic: { type: String, required: true },                     // e.g. "ምግብ እና መጠጥ"
  slug: { type: String, required: true, unique: true },          // e.g. "food"
  description: { type: String },
  icon: { type: String, default: "Grid" },
  sortOrder: { type: Number, default: 0 }
});
```

---

### 3. `Conversation` Schema (`conversations` collection)
Strictly opt-in session logging for users who explicitly enable conversation persistence:

```javascript
const MessageTurnSchema = new mongoose.Schema({
  sender: { type: String, enum: ['deaf', 'hearing'], required: true },
  amharic: { type: String },
  english: { type: String },
  text: { type: String },
  type: { type: String, enum: ['sign', 'audio', 'text'], required: true },
  confidence: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  messages: [MessageTurnSchema],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24*60*60*1000) } // Auto-expire 24h
});

// TTL index to automatically delete conversations after 24 hours
ConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

### 4. `Feedback` Schema (`feedback` collection)
Enables native signers to submit linguistic corrections:

```javascript
const FeedbackSchema = new mongoose.Schema({
  signId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sign' },
  signGloss: { type: String },
  feedbackType: { 
    type: String, 
    enum: ['accuracy', 'regional_variant', 'video_quality', 'other'], 
    required: true 
  },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
```

---

## 7.2 Strict Data Privacy Rules
1. **TTL Auto-Purging**: Conversations are bound to a Time-To-Live (TTL) index that automatically deletes stored sessions after 24 hours.
2. **Zero Biometrics Stored**: The database contains zero image blobs, camera video clips, or audio waveform recordings. Only textual transcripts and validated sign video URLs are stored.

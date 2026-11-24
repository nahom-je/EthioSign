import mongoose from 'mongoose';
import Sign from '../src/models/Sign.js';

await mongoose.connect('mongodb://localhost:27017/ethiosign');

const result = await Sign.findOneAndUpdate(
  { gloss: 'አመሰግናለሁ' },
  { $set: { videoUrl: '/videos/amaseginalehu.mp4', isValidated: true } },
  { new: true }
);

if (result) {
  console.log('✅ Updated:', result.gloss, '→ videoUrl:', result.videoUrl, '| isValidated:', result.isValidated);
} else {
  console.log('❌ Sign not found in DB');
}

await mongoose.disconnect();

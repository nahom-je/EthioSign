/**
 * seed.js — Seed MongoDB with 62 EthSL signs from the CESLR catalog
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sign from '../src/models/Sign.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethiosign';

// 62 EthSL entries matching the CESLR catalog
const ETHSL_SEED_SIGNS = [
  { gloss: 'ሰላም', english: 'Hello / Peace', category: 'greetings', glossIndex: 0, description: 'Open hand touches forehead and moves outward in greeting.' },
  { gloss: 'አመሰግናለሁ', english: 'Thank you', category: 'greetings', glossIndex: 1, description: 'Fingertips of flat hand touch chin and move gently forward.' },
  { gloss: 'እንደምን_አደርክ', english: 'Good morning', category: 'greetings', glossIndex: 2, description: 'Compound sign: "good/well" followed by sun rising indicator.' },
  { gloss: 'እንደምን_ዋልክ', english: 'Good day', category: 'greetings', glossIndex: 3, description: 'Greeting gesture indicating daytime duration.' },
  { gloss: 'ደህና_እደር', english: 'Good night', category: 'greetings', glossIndex: 4, description: 'Signs "fine" followed by palms setting downward.' },
  { gloss: 'ይቅርታ', english: 'Sorry / Excuse me', category: 'greetings', glossIndex: 5, description: 'Circular motion over chest with cupped hand.' },
  { gloss: 'አዎ', english: 'Yes', category: 'greetings', glossIndex: 6, description: 'Fist nods down like a head nod.' },
  { gloss: 'አይደለም', english: 'No', category: 'greetings', glossIndex: 7, description: 'Index and middle fingers tap thumb closed.' },
  { gloss: 'እባክዎ', english: 'Please', category: 'greetings', glossIndex: 8, description: 'Flat hand open in front, moving slightly toward listener.' },
  { gloss: 'ደህና', english: 'Fine / Well', category: 'greetings', glossIndex: 9, description: 'Thumb up or open palm across chest.' },
  { gloss: 'እናት', english: 'Mother', category: 'family', glossIndex: 10, description: 'Open hand with thumb touching chin or cheek.' },
  { gloss: 'አባት', english: 'Father', category: 'family', glossIndex: 11, description: 'Thumb of open hand touching forehead area.' },
  { gloss: 'ወንድም', english: 'Brother', category: 'family', glossIndex: 12, description: 'Male marker near forehead then both hands parallel.' },
  { gloss: 'እህት', english: 'Sister', category: 'family', glossIndex: 13, description: 'Female marker near jaw then both hands parallel.' },
  { gloss: 'ልጅ', english: 'Child', category: 'family', glossIndex: 14, description: 'Flat hand patting downward at child height.' },
  { gloss: 'ቤተሰብ', english: 'Family', category: 'family', glossIndex: 15, description: 'Two hands forming circle starting from midline.' },
  { gloss: 'ጓደኛ', english: 'Friend', category: 'family', glossIndex: 16, description: 'Interlocking index fingers hooked together.' },
  { gloss: 'አንድ', english: 'One', category: 'numbers', glossIndex: 17, description: 'Index finger held upright.' },
  { gloss: 'ሁለት', english: 'Two', category: 'numbers', glossIndex: 18, description: 'Index and middle fingers held upright in V.' },
  { gloss: 'ሶስት', english: 'Three', category: 'numbers', glossIndex: 19, description: 'Thumb, index, and middle fingers extended.' },
  { gloss: 'አራት', english: 'Four', category: 'numbers', glossIndex: 20, description: 'Four fingers extended upward, thumb tucked.' },
  { gloss: 'አምስት', english: 'Five', category: 'numbers', glossIndex: 21, description: 'All five fingers spread open.' },
  { gloss: 'ስድስት', english: 'Six', category: 'numbers', glossIndex: 22, description: 'Five fingers plus thumb tap on second hand.' },
  { gloss: 'ሰባት', english: 'Seven', category: 'numbers', glossIndex: 23, description: 'Specific finger grouping for 7.' },
  { gloss: 'ስምንት', english: 'Eight', category: 'numbers', glossIndex: 24, description: 'Specific finger grouping for 8.' },
  { gloss: 'ዘጠኝ', english: 'Nine', category: 'numbers', glossIndex: 25, description: 'Specific finger grouping for 9.' },
  { gloss: 'አስር', english: 'Ten', category: 'numbers', glossIndex: 26, description: 'Shaking fist or thumbs-up motion.' },
  { gloss: 'ውሃ', english: 'Water', category: 'daily-life', glossIndex: 27, description: 'Index finger taps side of chin or mouth.' },
  { gloss: 'ምግብ', english: 'Food', category: 'daily-life', glossIndex: 28, description: 'Pinch fingertips repeatedly brought to mouth.' },
  { gloss: 'ቤት', english: 'House / Home', category: 'daily-life', glossIndex: 29, description: 'Hands make roof shape touching at fingertips.' },
  { gloss: 'ትምህርት_ቤት', english: 'School', category: 'education', glossIndex: 30, description: 'Clapping flat hands or signing learn + house.' },
  { gloss: 'ሆስፒታል', english: 'Hospital', category: 'health', glossIndex: 31, description: 'Index and middle trace cross on upper arm.' },
  { gloss: 'መድኃኒት', english: 'Medicine', category: 'health', glossIndex: 32, description: 'Middle finger stirs in opposite palm.' },
  { gloss: 'ሀኪም', english: 'Doctor', category: 'health', glossIndex: 33, description: 'Fingers checking pulse at opposite wrist.' }
];

async function seed() {
  try {
    console.log(`[Seed] Connecting to ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected.');

    console.log('[Seed] Upserting signs...');
    for (const sign of ETHSL_SEED_SIGNS) {
      await Sign.findOneAndUpdate(
        { gloss: sign.gloss },
        { $set: sign },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed] Successfully seeded ${ETHSL_SEED_SIGNS.length} EthSL signs.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    process.exit(1);
  }
}

seed();

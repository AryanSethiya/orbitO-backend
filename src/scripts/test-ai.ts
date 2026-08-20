import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

async function testAI() {
  console.log('🤖 Testing Live Google Gemini API Integration...');
  console.log(`🔑 Key: ${env.GEMINI_API_KEY.slice(0, 8)}...`);

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  // 1. Test Embedding
  console.log(`\n1️⃣ Testing Lightweight Embedding Model (${env.GEMINI_EMBEDDING_MODEL})...`);
  try {
    const embedModel = genAI.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
    const embedRes = await embedModel.embedContent('airport');
    const dim = embedRes.embedding.values.length;
    console.log(`✅ Embedding Success! Generated ${dim}-dimensional vector for "airport".`);
  } catch (err: any) {
    console.error('❌ Embedding API Error:', err.message || err);
  }

  // 2. Test Gemini Flash Text Generation
  console.log(`\n2️⃣ Testing Lightweight Generation Model (${env.GEMINI_CHAT_MODEL})...`);
  try {
    const chatModel = genAI.getGenerativeModel({ model: env.GEMINI_CHAT_MODEL });
    const res = await chatModel.generateContent(
      'Write a 1-sentence funny roast for a player who guessed "banana", "galaxy", and "airplane" before finding "airport".'
    );
    console.log(`✅ Gemini Flash Response:\n"${res.response.text().trim()}"`);
  } catch (err: any) {
    console.error('❌ Chat API Error:', err.message || err);
  }
}

testAI().catch((err) => {
  console.error('Fatal error during AI test:', err);
});

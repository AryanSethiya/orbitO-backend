import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

async function testEmbedOptions() {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

  try {
    const res = await model.embedContent({
      content: 'airport',
      outputDimensionality: 768,
    } as any);
    console.log('✅ String content worked! Length:', res.embedding.values.length);
  } catch (err: any) {
    console.log('❌ String content failed:', err.message);
  }
}

testEmbedOptions();

const fetch = require('cross-fetch');
const key = require('dotenv').config().parsed.VITE_GEMINI_API_KEY;

const schema = {
  type: 'OBJECT', properties: {
    score: { type: 'NUMBER' }, reason: { type: 'STRING' }, third_piece: { type: 'STRING' }
  }, required: ['score', 'reason', 'third_piece']
};

const sys = 'You are a seasoned fashion stylist. Rate the compatibility of two clothing items out of 10. Give a detailed reason (2-3 sentences). Suggest one specific third piece (with color) to complete the look.';
const msg = 'Item 1: shirt. Item 2: pant. Rate how well they pair together.';

async function test(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ role: 'user', parts: [{text: msg}] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    })
  });
  const data = await res.json();
  console.log('[' + model + '] Response:', JSON.stringify(data.error || data?.candidates?.[0]?.content?.parts?.[0]?.text).substring(0, 200));
}

async function run() {
  await test('gemini-2.5-flash');
  await test('gemini-2.0-flash');
  await test('gemini-1.5-flash');
}
run();

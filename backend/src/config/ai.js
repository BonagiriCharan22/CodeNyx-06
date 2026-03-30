//ai.js
// ============================================================
// AI CONFIGURATION - Google Gemini
// 1. Go to: https://aistudio.google.com/app/apikey
// 2. Create a free API key
// 3. Replace YOUR_GEMINI_API_KEY below OR set env variable GEMINI_API_KEY
// ============================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

let genAI = null;

function getAI() {
  if (!genAI) {
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn('[AI] WARNING: Gemini API key not configured. AI features will use fallback responses.');
      return null;
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

async function generateResponse(prompt, systemInstruction = '') {
  const ai = getAI();

  if (!ai) {
    return getFallbackResponse(prompt);
  }

  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction || undefined,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error('[AI] Gemini error:', err.message);
    return getFallbackResponse(prompt);
  }
}

function getFallbackResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('problem') || lowerPrompt.includes('clarity')) {
    return "That's an interesting perspective. Can you describe the core problem your idea solves in one sentence?";
  }
  if (lowerPrompt.includes('feasib')) {
    return "Let's think about feasibility. What resources do you currently have available to start this project?";
  }
  if (lowerPrompt.includes('revenue') || lowerPrompt.includes('investor')) {
    return "Good question about revenue. How do you plan to sustain this financially in the first year?";
  }
  if (lowerPrompt.includes('impact') || lowerPrompt.includes('ngo')) {
    return "Impact is crucial here. How many people does your solution aim to reach in the first 6 months?";
  }
  return "Thank you for sharing. Could you elaborate more on how your idea uniquely addresses this challenge?";
}

module.exports = { generateResponse, getAI };
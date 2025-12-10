// backend/routes/ai.js
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const auth = require('../utils/authMiddleware');

const router = express.Router();
router.use(auth);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL;

// Build prompt wrapper that requests JSON-only output
function buildGeneratePrompt(user, prompt) {
  return `You are a helpful productivity assistant. Respond with VALID JSON ONLY (no extra text).

User context: { "name": "${user.name}" }.

Create a concise task plan for: "${prompt}"

Return only a JSON object with keys:
- title (string)
- description (string)
- priority (one of "low","medium","high","urgent")
- estimatedEffortHours (number)
- subtasks (array of short strings)

Do not include any commentary or markdown — only the JSON object.`;
}

async function listModels() {
  if (!GEMINI_API_KEY) return { error: 'No GEMINI_API_KEY' };
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`;
  const r = await fetch(url);
  return r.ok ? await r.json() : { error: await r.text(), status: r.status };
}

router.post('/generate-task', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) return res.status(500).json({ message: 'GEMINI_API_KEY not set in env' });

    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Missing prompt' });

    const modelName = GEMINI_MODEL;
    if (!modelName) {
      const models = await listModels();
      return res.status(500).json({ message: 'GEMINI_MODEL not configured. Available models:', models });
    }

    const inputText = buildGeneratePrompt(req.user, prompt);

    // Use generateContent endpoint (supportedGenerationMethods: generateContent)
    const modelId = modelName.replace('models/', '');
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
  contents: [
    {
      role: "user",
      parts: [{
        text: inputText
      }]
    }
  ],
  generationConfig: {
    temperature: 0.2,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 800,
    candidateCount: 1
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
};

    // Some API versions expect slightly different body shapes. We try the most common one first.
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const raw = await r.text();

    if (!r.ok) {
      // If model not found or not supported, return available models to help debug
      if (r.status === 404) {
        const models = await listModels();
        console.error('Gemini model not found or not supported:', raw);
        return res.status(500).json({ message: `Model ${modelName} not found or not supported by generateContent. See available models.`, raw, models });
      }
      console.error('Gemini API Error:', raw);
      return res.status(500).json({ message: 'Gemini API error', detail: raw });
    }

    // Parse the response JSON and extract generated text
    let generated = '';
    try {
      const json = JSON.parse(raw);
      console.log('Raw API response:', JSON.stringify(json, null, 2)); // Debug log

      // Handle Gemini 2.5 Flash response format
      if (json?.candidates?.[0]?.content?.parts?.[0]?.text) {
        // Direct text in parts array
        generated = json.candidates[0].content.parts[0].text;
      } else if (json?.candidates?.[0]?.content?.text) {
        // Direct text in content
        generated = json.candidates[0].content.text;
      } else if (json?.text) {
        // Direct text in response
        generated = json.text;
      } else if (json?.candidates?.[0]?.content?.parts) {
        // Multiple parts in response
        generated = json.candidates[0].content.parts
          .map(part => part.text || '')
          .join('');
      } else if (json?.candidates?.[0]?.content) {
        // Fallback: stringify the content if structure is different
        generated = JSON.stringify(json.candidates[0].content);
      } else {
        generated = JSON.stringify(json);
      }
    } catch (err) {
      // failed to parse as JSON — use raw text
      console.warn('Could not parse response as JSON, using raw text:', err);
      generated = raw;
    }

    // Find first JSON object in generated text
    try {
      const match = generated.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : generated;
      const parsed = JSON.parse(jsonStr);
      return res.json({ ai: parsed });
    } catch (err) {
      console.error('Failed to parse AI-generated JSON:', err);
      return res.status(500).json({ message: 'Invalid model output; expected JSON', rawGenerated: generated });
    }

  } catch (err) {
    console.error('Server error in /ai/generate-task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

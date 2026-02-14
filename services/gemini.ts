const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const BASE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// List of Gemini models to try in order (from fastest to most capable)
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

if (!GEMINI_API_KEY) {
  console.warn('GEMINI API key is missing. Set EXPO_PUBLIC_GEMINI_API_KEY in your app config.');
}

export const askGemini = async (prompt: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not set');
  }

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  let lastError: Error | null = null;

  // Try each model in sequence until one works
  for (const model of GEMINI_MODELS) {
    try {
      const apiUrl = `${BASE_API_URL}/${model}:generateContent`;
      const response = await fetch(`${apiUrl}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Model ${model} failed: ${response.status} - ${errorBody}`);
      }

      const data = (await response.json()) as GeminiResponse;
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (candidateText?.trim()) {
        console.log(`✓ Successfully used model: ${model}`);
        return candidateText.trim();
      }

      throw new Error(`Model ${model} returned empty response`);
    } catch (error) {
      console.warn(`✗ Model ${model} failed:`, error instanceof Error ? error.message : 'Unknown error');
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next model
    }
  }

  // If all models failed, throw the last error
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export type { GeminiResponse };

const axios = require('axios');

const apiKey = "AIzaSyCOFOoppNQRakvBcKyKmWHEHpMBPODi9s4";
const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

const prompt = `Generate an array of 5 unique coding challenges in JSON format. Each challenge should have the following structure:
{
  "id": "unique-id",
  "title": "Challenge title",
  "description": "Detailed problem description",
  "difficulty": "easy|medium|hard",
  "timeLimit": 300,
  "inputFormat": "Description of input format",
  "outputFormat": "Description of expected output format",
  "constraints": ["List of constraints"],
  "examples": [
    {
      "input": "Sample input",
      "output": "Expected output",
      "explanation": "Explanation of the example"
    }
  ],
  "testCases": [
    {
      "input": "Test input",
      "output": "Expected output"
    }
  ],
  "boilerplateCode": {
    "python": "Python starter code",
    "cpp": "C++ starter code",
    "java": "Java starter code"
  }
}
Return only the JSON array.`;

async function generatePracticeChallengesGemini(n = 5) {
  try {
    const response = await axios.post(apiUrl, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3000
      }
    });
    // Gemini returns the result in response.data.candidates[0].content.parts[0].text
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No content from Gemini');
    // Try to parse the JSON array
    let challenges;
    try {
      challenges = JSON.parse(text);
    } catch (e) {
      // Sometimes Gemini returns markdown code block, strip it
      const match = text.match(/```json([\s\S]*?)```/);
      if (match) {
        challenges = JSON.parse(match[1]);
      } else {
        throw new Error('Failed to parse Gemini JSON');
      }
    }
    // Optionally, slice to n challenges
    return Array.isArray(challenges) ? challenges.slice(0, n) : [];
  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { generatePracticeChallengesGemini }; 
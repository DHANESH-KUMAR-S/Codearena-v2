const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const generateChallengePrompt = `Generate a coding challenge with the following structure:
{
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
    "javascript": "JavaScript starter code",
    "cpp": "C++ starter code",
    "java": "Java starter code"
  }
}

Make sure the challenge:
1. Has clear instructions
2. Includes 5 test cases of varying difficulty
3. Provides appropriate boilerplate code for each language
4. Has proper input/output handling code in boilerplate
5. Is solvable within the time limit
6. Has consistent input/output formats across examples and test cases`;

async function generateChallenge() {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are a coding challenge generator. Generate challenges that are clear, concise, and solvable.'
          },
          {
            role: 'user',
            content: generateChallengePrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const challenge = JSON.parse(response.data.choices[0].message.content);
    
    // Validate and sanitize test cases to ensure they are strings
    if (challenge.testCases && Array.isArray(challenge.testCases)) {
      challenge.testCases = challenge.testCases.map(testCase => {
        if (Array.isArray(testCase.input)) {
          console.log('Warning: Groq AI generated array input, converting to string:', testCase.input);
        }
        if (Array.isArray(testCase.output)) {
          console.log('Warning: Groq AI generated array output, converting to string:', testCase.output);
        }
        return {
          input: Array.isArray(testCase.input) ? testCase.input.join('\n') : String(testCase.input || ''),
          output: Array.isArray(testCase.output) ? testCase.output.join('\n') : String(testCase.output || '')
        };
      });
    }
    
    // Add a unique ID to the challenge
    challenge.id = require('crypto').randomBytes(16).toString('hex');
    
    return challenge;
  } catch (error) {
    console.error('Error generating challenge with Groq:', error);
    throw error;
  }
}

module.exports = {
  generateChallenge
}; 
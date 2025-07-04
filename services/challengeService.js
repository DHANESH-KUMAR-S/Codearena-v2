const { v4: uuidv4 } = require('uuid');
const { generateChallenge } = require('./groqService');
const { LANGUAGE_BOILERPLATES } = require('../config/judge0');

// Sample challenges for demonstration
const SAMPLE_CHALLENGES = [
  {
    id: 'sum-array',
    title: 'Sum of Array',
    description: 'Given an array of integers, find the sum of all elements.',
    difficulty: 'easy',
    timeLimit: 300, // 5 minutes
    inputFormat: 'A single line containing space-separated integers.',
    outputFormat: 'A single integer representing the sum of all elements.',
    constraints: [
      'Array length is between 1 and 1000',
      'Each element is between -1000 and 1000'
    ],
    examples: [
      {
        input: '1 2 3 4 5',
        output: '15',
        explanation: '1 + 2 + 3 + 4 + 5 = 15'
      },
      {
        input: '-1 -2 3 4',
        output: '4',
        explanation: '(-1) + (-2) + 3 + 4 = 4'
      }
    ],
    testCases: [
      { input: '1 2 3 4 5', output: '15' },
      { input: '-1 -2 3 4', output: '4' },
      { input: '0', output: '0' },
      { input: '10 -10', output: '0' },
      { input: '1 1 1 1 1', output: '5' }
    ],
    boilerplateCode: {
      python: `# Read space-separated integers from input
nums = list(map(int, input().strip().split()))

# Write your code here to find the sum
# Print the result
`,
      javascript: `// Read space-separated integers from input
const nums = input().split(' ').map(Number);

// Write your code here to find the sum
// Print the result
`,
      cpp: `#include <iostream>
#include <string>
#include <sstream>
#include <vector>
using namespace std;

int main() {
    string line;
    getline(cin, line);
    
    istringstream iss(line);
    vector<int> nums;
    int num;
    while (iss >> num) {
        nums.push_back(num);
    }
    
    // Write your code here to find the sum
    // Print the result
    
    return 0;
}`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String line = scanner.nextLine();
        String[] parts = line.trim().split("\\s+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            nums[i] = Integer.parseInt(parts[i]);
        }
        
        // Write your code here to find the sum
        // Print the result
        
        scanner.close();
    }
}`
    }
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    description: 'Given a string, return it reversed.',
    difficulty: 'easy',
    timeLimit: 300, // 5 minutes
    inputFormat: 'A single line containing a string.',
    outputFormat: 'A single line containing the reversed string.',
    constraints: [
      'String length is between 1 and 1000',
      'String contains only ASCII characters'
    ],
    examples: [
      {
        input: 'hello',
        output: 'olleh',
        explanation: 'The characters are reversed in order'
      },
      {
        input: 'world!',
        output: '!dlrow',
        explanation: 'The characters are reversed in order, including punctuation'
      }
    ],
    testCases: [
      { input: 'hello', output: 'olleh' },
      { input: 'world!', output: '!dlrow' },
      { input: 'a', output: 'a' },
      { input: '12345', output: '54321' },
      { input: 'radar', output: 'radar' }
    ],
    boilerplateCode: {
      python: `# Read the input string
s = input().strip()

# Write your code here to reverse the string
# Print the result
`,
      javascript: `// Read the input string
const s = input();

// Write your code here to reverse the string
// Print the result
`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    getline(cin, s);
    
    // Write your code here to reverse the string
    // Print the result
    
    return 0;
}`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String s = scanner.nextLine();
        
        // Write your code here to reverse the string
        // Print the result
        
        scanner.close();
    }
}`
    }
  }
];

async function generateCodingChallenge() {
  try {
    // Try to generate a challenge using Groq
    const challenge = await generateChallenge();
    return challenge;
  } catch (error) {
    console.error('Failed to generate challenge with Groq, falling back to sample:', error);
    // Fall back to a random sample challenge if Groq fails
    const randomIndex = Math.floor(Math.random() * SAMPLE_CHALLENGES.length);
    return SAMPLE_CHALLENGES[randomIndex];
  }
}

module.exports = {
  generateCodingChallenge
}; 
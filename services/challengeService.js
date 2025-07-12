const { v4: uuidv4 } = require('uuid');
const { generateChallenge } = require('./groqService');
const { generateChallengeGemini } = require('./geminiService');
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
  },
  {
    id: 'find-max',
    title: 'Find Maximum',
    description: 'Given an array of integers, find the maximum value.',
    difficulty: 'easy',
    timeLimit: 300,
    inputFormat: 'A single line containing space-separated integers.',
    outputFormat: 'A single integer representing the maximum value.',
    constraints: [
      'Array length is between 1 and 1000',
      'Each element is between -10000 and 10000'
    ],
    examples: [
      {
        input: '1 5 3 9 2',
        output: '9',
        explanation: 'The maximum value in the array is 9'
      },
      {
        input: '-1 -5 -3 -9',
        output: '-1',
        explanation: 'The maximum value in the array is -1'
      }
    ],
    testCases: [
      { input: '1 5 3 9 2', output: '9' },
      { input: '-1 -5 -3 -9', output: '-1' },
      { input: '0', output: '0' },
      { input: '10 20 30 40 50', output: '50' },
      { input: '1 1 1 1 1', output: '1' }
    ],
    boilerplateCode: {
      python: `# Read space-separated integers from input
nums = list(map(int, input().strip().split()))

# Write your code here to find the maximum
# Print the result
`,
      cpp: `#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <algorithm>
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
    
    // Write your code here to find the maximum
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
        
        // Write your code here to find the maximum
        // Print the result
        
        scanner.close();
    }
}`
    }
  },
  {
    id: 'count-vowels',
    title: 'Count Vowels',
    description: 'Given a string, count the number of vowels (a, e, i, o, u) in it.',
    difficulty: 'easy',
    timeLimit: 300,
    inputFormat: 'A single line containing a string.',
    outputFormat: 'A single integer representing the count of vowels.',
    constraints: [
      'String length is between 1 and 1000',
      'String contains only lowercase letters'
    ],
    examples: [
      {
        input: 'hello',
        output: '2',
        explanation: 'The vowels in "hello" are e and o'
      },
      {
        input: 'world',
        output: '1',
        explanation: 'The vowel in "world" is o'
      }
    ],
    testCases: [
      { input: 'hello', output: '2' },
      { input: 'world', output: '1' },
      { input: 'aeiou', output: '5' },
      { input: 'xyz', output: '0' },
      { input: 'programming', output: '3' }
    ],
    boilerplateCode: {
      python: `# Read the input string
s = input().strip()

# Write your code here to count vowels
# Print the result
`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    getline(cin, s);
    
    // Write your code here to count vowels
    // Print the result
    
    return 0;
}`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String s = scanner.nextLine();
        
        // Write your code here to count vowels
        // Print the result
        
        scanner.close();
    }
}`
    }
  },
  {
    id: 'factorial',
    title: 'Factorial',
    description: 'Given a positive integer n, calculate its factorial (n!).',
    difficulty: 'medium',
    timeLimit: 300,
    inputFormat: 'A single line containing a positive integer n.',
    outputFormat: 'A single integer representing n!',
    constraints: [
      '1 ≤ n ≤ 12',
      'n is a positive integer'
    ],
    examples: [
      {
        input: '5',
        output: '120',
        explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120'
      },
      {
        input: '3',
        output: '6',
        explanation: '3! = 3 × 2 × 1 = 6'
      }
    ],
    testCases: [
      { input: '5', output: '120' },
      { input: '3', output: '6' },
      { input: '1', output: '1' },
      { input: '4', output: '24' },
      { input: '6', output: '720' }
    ],
    boilerplateCode: {
      python: `# Read the input integer
n = int(input().strip())

# Write your code here to calculate factorial
# Print the result
`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    
    // Write your code here to calculate factorial
    // Print the result
    
    return 0;
}`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        
        // Write your code here to calculate factorial
        // Print the result
        
        scanner.close();
    }
}`
    }
  }
];

function enforceTraditionalBoilerplate(challenge) {
  if (!challenge.boilerplateCode) challenge.boilerplateCode = {};
  challenge.boilerplateCode.cpp = `#include<iostream>\nint main(){\n    return 0;\n}`;
  challenge.boilerplateCode.java = `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n    }\n}`;
  challenge.boilerplateCode.python = `# Enter your python code below`;
}

async function generateCodingChallenge() {
  try {
    // Try to generate a challenge using Gemini
    console.log('Attempting to generate challenge with Gemini...');
    const challenge = await generateChallengeGemini();
    console.log('Successfully generated challenge with Gemini:', challenge.title);
    enforceTraditionalBoilerplate(challenge);
    return challenge;
  } catch (error) {
    console.error('Failed to generate challenge with Gemini, falling back to sample:', error);
    // Fall back to a random sample challenge if Gemini fails
    const randomIndex = Math.floor(Math.random() * SAMPLE_CHALLENGES.length);
    const challenge = SAMPLE_CHALLENGES[randomIndex];
    enforceTraditionalBoilerplate(challenge);
    return challenge;
  }
}

function getAllChallenges() {
  return SAMPLE_CHALLENGES;
}

module.exports = {
  generateCodingChallenge,
  getAllChallenges
}; 
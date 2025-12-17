const CodeExecutionService = require('./services/codeExecutionService');

async function test() {
  const codeExecutionService = new CodeExecutionService();

  // Test Python code execution
  console.log('\nTesting Python code execution:');
  const pythonResult = await codeExecutionService.executeCode(
    'print("Hello from Python!")',
    'python'
  );
  console.log('Python result:', pythonResult);

  // Test JavaScript code execution
  console.log('\nTesting JavaScript code execution:');
  const jsResult = await codeExecutionService.executeCode(
    'console.log("Hello from JavaScript!")',
    'javascript'
  );
  console.log('JavaScript result:', jsResult);

  // Test Python code with input
  console.log('\nTesting Python code with input:');
  const pythonCode = `
name = input()
age = input()
print(f"Hello, {name}! You are {age} years old.")
  `.trim();
  const pythonInputResult = await codeExecutionService.executeCode(
    pythonCode,
    'python',
    'Alice\n25'
  );
  console.log('Python input result:', pythonInputResult);

  // Test JavaScript code with input
  console.log('\nTesting JavaScript code with input:');
  const jsCode = `
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let name, age;

rl.question('', (answer) => {
  name = answer;
  rl.question('', (answer) => {
    age = answer;
    console.log(\`Hello, \${name}! You are \${age} years old.\`);
    rl.close();
  });
});
  `.trim();
  const jsInputResult = await codeExecutionService.executeCode(
    jsCode,
    'javascript',
    'Bob\n30'
  );
  console.log('JavaScript input result:', jsInputResult);

  // Test validation with test cases
  console.log('\nTesting validation with test cases:');
  const validationResult = await codeExecutionService.validateSubmission(
    `
def add(a, b):
    return a + b

a = int(input())
b = int(input())
print(add(a, b))
    `.trim(),
    'python',
    [
      { input: '2\n3', output: '5' },
      { input: '0\n0', output: '0' },
      { input: '-1\n1', output: '0' }
    ]
  );
  console.log('Validation result:', validationResult);
}

test().catch(console.error); 
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class RailwayCodeExecutionService {
  constructor() {
    this.tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
    console.log('Initializing RailwayCodeExecutionService');
  }

  async executeCode(code, language, input = '') {
    console.log('Received code:', JSON.stringify(code));
    if (!code || !code.trim()) {
      return {
        status: 'Compilation Error',
        output: '',
        error: 'No code submitted',
        time: null,
        memory: null
      };
    }

    // Ensure input is a string
    if (Array.isArray(input)) {
      console.log('Warning: Input was an array, converting to string:', input);
      input = input.join('\n');
    } else {
      input = String(input || '');
    }

    const config = this.languageConfigs[language];
    if (!config) {
      throw new Error('Unsupported language');
    }

    console.log('DEBUG: Language for execution:', language);

    const fileName = `${uuidv4()}${config.fileExtension}`;
    const filePath = path.join(this.tmpDir, fileName);
    const inputPath = path.join(this.tmpDir, `${fileName}.input`);

    try {
      // Write code to file
      fs.writeFileSync(filePath, code, { encoding: 'utf8' });

      // Write input to file if provided
      if (input) {
        fs.writeFileSync(inputPath, input, { encoding: 'utf8' });
      }

      return new Promise((resolve, reject) => {
        const executeCode = async () => {
          // Compile if needed
          if (config.compile) {
            console.log('DEBUG: Compiling code...');
            const compileResult = await this.compileCode(filePath, config);
            if (!compileResult.success) {
              resolve({
                status: 'Compilation Error',
                output: '',
                error: compileResult.error,
                time: null,
                memory: null
              });
              return;
            }
          }

          // Execute the code
          console.log('DEBUG: Executing code...');
          const executeResult = await this.runCode(filePath, inputPath, config);
          
          // Clean up
          this.cleanup(filePath, inputPath);
          
          resolve(executeResult);
        };

        executeCode().catch((error) => {
          console.error('Code execution error:', error);
          this.cleanup(filePath, inputPath);
          resolve({
            status: 'Internal Error',
            output: '',
            error: error.message,
            time: null,
            memory: null
          });
        });
      });
    } catch (error) {
      this.cleanup(filePath, inputPath);
      throw error;
    }
  }

  async compileCode(filePath, config) {
    return new Promise((resolve) => {
      const compileProcess = spawn(config.compileCommand, [filePath], {
        cwd: this.tmpDir,
        shell: true
      });

      let stdout = '';
      let stderr = '';

      compileProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      compileProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      compileProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            success: false,
            error: stderr || 'Compilation failed'
          });
        } else {
          resolve({
            success: true,
            output: stdout
          });
        }
      });

      compileProcess.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        compileProcess.kill();
        resolve({
          success: false,
          error: 'Compilation timed out'
        });
      }, 10000);
    });
  }

  async runCode(filePath, inputPath, config) {
    return new Promise((resolve) => {
      const args = config.runCommand ? config.runCommand(filePath, inputPath) : [filePath];
      const executeProcess = spawn(config.command, args, {
        cwd: this.tmpDir,
        shell: true,
        stdio: inputPath ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      // Provide input if available
      if (inputPath && fs.existsSync(inputPath)) {
        const inputStream = fs.createReadStream(inputPath);
        inputStream.pipe(executeProcess.stdin);
      }

      executeProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      executeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      executeProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            status: 'Runtime Error',
            output: stdout,
            error: stderr || 'Execution failed',
            time: null,
            memory: null
          });
        } else {
          resolve({
            status: 'Accepted',
            output: stdout,
            error: stderr,
            time: null,
            memory: null
          });
        }
      });

      executeProcess.on('error', (error) => {
        resolve({
          status: 'Internal Error',
          output: '',
          error: error.message,
          time: null,
          memory: null
        });
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        executeProcess.kill();
        resolve({
          status: 'Time Limit Exceeded',
          output: stdout,
          error: 'Execution timed out',
          time: 10,
          memory: null
        });
      }, 10000);
    });
  }

  cleanup(filePath, inputPath) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (inputPath && fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  }

  get languageConfigs() {
    return {
      python: {
        fileExtension: '.py',
        command: 'python',
        runCommand: (filePath) => [filePath]
      },
      java: {
        fileExtension: '.java',
        command: 'java',
        compile: true,
        compileCommand: 'javac',
        runCommand: (filePath) => {
          const className = path.basename(filePath, '.java');
          return ['-cp', this.tmpDir, className];
        }
      },
      cpp: {
        fileExtension: '.cpp',
        command: './a.out',
        compile: true,
        compileCommand: 'g++',
        runCommand: (filePath) => {
          // Compile to a.out in the same directory
          return [];
        }
      }
    };
  }

  async validateSubmission(code, language, testCases) {
    const results = [];
    let allTestsPassed = true;

    for (const testCase of testCases) {
      let input = testCase.input;
      if (Array.isArray(input)) {
        console.log('Warning: Test case input was an array, converting to string:', input);
        input = input.join('\n');
      } else {
        input = String(input || '');
      }

      const result = await this.executeCode(code, language, input);
      
      const expected = String(testCase.output || '').trim();
      const actual = String(result.output || '').trim();
      const passed = actual === expected;
      if (!passed) allTestsPassed = false;
      
      results.push({
        passed,
        input: input,
        expected: expected,
        actual: actual,
        error: result.error,
        status: result.status,
        time: result.time,
        memory: result.memory
      });
    }

    return {
      passed: allTestsPassed,
      results
    };
  }
}

module.exports = RailwayCodeExecutionService; 
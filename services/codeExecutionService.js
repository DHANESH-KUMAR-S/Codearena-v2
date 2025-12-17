const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');
const { LANGUAGE_IDS, JUDGE0_API_URL, DEFAULT_OPTIONS } = require('../config/judge0');

const toDockerPath = (p) => {
  if (process.platform === 'win32') {
    // If running under WSL, convert to /mnt/c/... else use /c/Users/... for Docker Desktop
    if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) {
      return p.replace(/^([A-Za-z]):[\\\/]/, (m, d) => `/mnt/${d.toLowerCase()}/`).replace(/\\/g, '/');
    } else {
      // Convert C:\Users\... or C:/Users/... to /c/Users/...
      return p.replace(/^([A-Za-z]):[\\\/]?/, (m, d) => `/${d.toLowerCase()}/`).replace(/\\/g, '/');
    }
  }
  return p;
};

class CodeExecutionService {
  constructor() {
    this.tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
    console.log('Initializing CodeExecutionService');
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

    // Ensure input is a string - handle cases where AI generates arrays
    if (Array.isArray(input)) {
      console.log('Warning: Input was an array, converting to string:', input);
      input = input.join('\n');
    } else {
      input = String(input || '');
    }

    // Remove Judge0 block for Java, revert to Docker logic
    const config = this.languageConfigs[language];
    if (!config) {
      throw new Error('Unsupported language');
    }

    // Debug: Log the language value
    console.log('DEBUG: Language for execution:', language);

    // For Java, use the main tmp directory
    let workDir = this.tmpDir;
    let fileName = `${uuidv4()}${config.fileExtension}`;
    let filePath = path.join(this.tmpDir, fileName);
    let inputPath;
    let javaTempDir = null;
    let javaImageTag = null;
    if (language === 'java') {
      // Create a unique subdirectory for Java execution
      const javaUUID = `java-${uuidv4()}`;
      javaTempDir = path.join(this.tmpDir, javaUUID);
      if (!fs.existsSync(javaTempDir)) {
        fs.mkdirSync(javaTempDir, { recursive: true });
      }
      workDir = javaTempDir;
      fileName = 'Main.java';
      filePath = path.join(workDir, fileName);
      javaImageTag = `java-runner-${javaUUID}`;
    }
    
    // Debug: Print file paths and workDir for C++
    if (language === 'cpp') {
      console.log('DEBUG: C++ workDir:', workDir);
      console.log('DEBUG: C++ fileName:', fileName);
      console.log('DEBUG: C++ filePath:', filePath);
    }
    
    try {
      // Wrap code with input handling if needed
      const wrappedCode = config.inputWrapper ? config.inputWrapper(code) : code;

      // Write code to file
      // For Java, force Unix line endings
      if (language === 'java') {
        fs.writeFileSync(filePath, wrappedCode.replace(/\r\n/g, '\n'), { encoding: 'utf8' });
        let dockerfileContent;
        if (input) {
          // If input is provided, copy input file and use input redirection in CMD
          dockerfileContent = `FROM openjdk:17-slim\nWORKDIR /code\nCOPY Main.java .\nCOPY Main.java.input .\nRUN javac Main.java\nCMD [\"sh\", \"-c\", \"java Main < Main.java.input\"]\n`;
        } else {
          // No input, just run normally
          dockerfileContent = `FROM openjdk:17-slim\nWORKDIR /code\nCOPY Main.java .\nRUN javac Main.java\nCMD [\"java\", \"Main\"]\n`;
        }
        fs.writeFileSync(path.join(workDir, 'Dockerfile'), dockerfileContent, { encoding: 'utf8' });
      } else {
        fs.writeFileSync(filePath, wrappedCode, { encoding: 'utf8' });
      }

      // Create a temporary file for input if provided
      if (input || language === 'python' || language === 'java') {
        inputPath = path.join(workDir, `${fileName}.input`);
        fs.writeFileSync(inputPath, input !== undefined ? input : '\n', { encoding: 'utf8' });
      }

      return new Promise((resolve, reject) => {
        const executeInDocker = async () => {
          if (language === 'java') {
            // Build the Docker image
            await new Promise((resolveBuild, rejectBuild) => {
              const buildProcess = spawn('docker', ['build', '-t', javaImageTag, '.'], { cwd: workDir, shell: true });
              buildProcess.stdout.on('data', (data) => {
                console.log('Docker build output:', data.toString());
              });
              buildProcess.stderr.on('data', (data) => {
                console.error('Docker build error:', data.toString());
              });
              buildProcess.on('close', (code) => {
                if (code !== 0) {
                  rejectBuild(new Error('Docker build failed'));
                } else {
                  resolveBuild();
                }
              });
            });
            // Run the container
            const runArgs = [
              'run',
              '--rm',
              '--network', 'none',
              '--memory', '128m',
              '--memory-swap', '128m',
              '--cpus', '0.5',
              javaImageTag
            ];
            const docker = spawn('docker', runArgs, { cwd: workDir, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
            let stdout = '';
            let stderr = '';
            docker.stdout.on('data', (data) => {
              const output = data.toString();
              stdout += output;
              console.log('stdout:', output);
            });
            docker.stderr.on('data', (data) => {
              const output = data.toString();
              stderr += output;
              console.error('stderr:', output);
            });
            docker.on('close', (code) => {
              // Clean up: remove image and temp dir
              spawn('docker', ['rmi', '-f', javaImageTag], { shell: true });
              if (javaTempDir && fs.existsSync(javaTempDir)) {
                fs.rmSync(javaTempDir, { recursive: true, force: true });
              }
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
            docker.on('error', (error) => {
              spawn('docker', ['rmi', '-f', javaImageTag], { shell: true });
              if (javaTempDir && fs.existsSync(javaTempDir)) {
                fs.rmSync(javaTempDir, { recursive: true, force: true });
              }
              resolve({
                status: 'Internal Error',
                output: '',
                error: error.message,
                time: null,
                memory: null
              });
            });
            setTimeout(() => {
              docker.kill();
              spawn('docker', ['rmi', '-f', javaImageTag], { shell: true });
              if (javaTempDir && fs.existsSync(javaTempDir)) {
                fs.rmSync(javaTempDir, { recursive: true, force: true });
              }
              resolve({
                status: 'Time Limit Exceeded',
                output: '',
                error: 'Execution timed out',
                time: 10,
                memory: null
              });
            }, 10000);
            return;
          }

          // Debug: Entering fallback compile block
          console.log('DEBUG: Entering fallback compile block for language:', language);
          // If compilation is needed
          if (config.compile) {
            // First compile the code
            if (language === 'cpp') {
              console.log('DEBUG: C++ about to run compileCommand:', config.compileCommand(`/code/${fileName}`));
            }
            const compileArgs = [
              'run',
              '--rm',
              '--network', 'none',
              '--memory', '128m',
              '--memory-swap', '128m',
              '--cpus', '0.5',
              '-v', `${toDockerPath(workDir)}:/code`,
              '-w', '/code',
              config.image,
              'bash', '-c', `"${config.compileCommand(`/code/${fileName}`)}"`
            ];

            console.log('Running compile command:', 'docker', compileArgs.join(' '));
            
            const compileProcess = spawn('docker', compileArgs, {
              shell: true
            });

            let compileError = '';
            compileProcess.stderr.on('data', (data) => {
              compileError += data.toString();
              console.error('Compilation error:', data.toString());
            });

            compileProcess.stdout.on('data', (data) => {
              console.log('Compilation output:', data.toString());
            });

            await new Promise((resolveCompile) => {
              compileProcess.on('close', (code) => {
                console.log('Compilation process exited with code:', code);
                if (code !== 0) {
                  console.error('Compilation failed with error:', compileError);
                  resolve({
                    status: 'Compilation Error',
                    output: '',
                    error: compileError,
                    time: null,
                    memory: null
                  });
                  return;
                } else {
                  console.log('Compilation successful');
                  resolveCompile();
                }
              });
            });

            // If compilation failed, we've already resolved
            if (compileError) {
              console.error('Compilation failed, stopping execution');
              return;
            }
          }

          // Run the code
          const dockerArgs = [
            'run',
            '--rm',
            '--network', 'none',
            '--memory', '128m',
            '--memory-swap', '128m',
            '--cpus', '0.5',
            '-v', `${toDockerPath(workDir)}:/code`,
            '-w', '/code',
            ...((input || language === 'python') ? ['-i'] : []),
            config.image
          ];

          if (language === 'python') {
            dockerArgs.push('bash', '-c', `"cat /code/${fileName}.input | python /code/${fileName}"`);
          } else if (language === 'java') {
            // For Java, run 'java Main' in the subdirectory
            if (inputPath) {
              dockerArgs.push('bash', '-c', `java -cp . Main < ${fileName}.input`);
            } else {
              dockerArgs.push('bash', '-c', `java -cp . Main`);
            }
          } else if (config.runCommand) {
            dockerArgs.push('bash', '-c', config.runCommand(`/code/${fileName}`, inputPath ? `/code/${path.basename(fileName)}.input` : undefined));
          } else {
            dockerArgs.push(...config.command, `/code/${fileName}`);
          }

          console.log('Running Docker command:', 'docker', dockerArgs.join(' '));

          const docker = spawn('docker', dockerArgs, {
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe']
          });

          let stdout = '';
          let stderr = '';

          docker.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            console.log('stdout:', output);
          });

          docker.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            console.error('stderr:', output);
          });

          docker.on('close', (code) => {
            console.log('Process exited with code:', code);
            console.log('Final stdout:', stdout);
            console.log('Final stderr:', stderr);

            // Clean up temporary files
            this.cleanup(filePath, inputPath);

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

          docker.on('error', (error) => {
            console.error('Process error:', error);
            
            // Clean up temporary files
            this.cleanup(filePath, inputPath);

            resolve({
              status: 'Internal Error',
              output: '',
              error: error.message,
              time: null,
              memory: null
            });
          });

          // Set a timeout of 10 seconds
          setTimeout(() => {
            docker.kill();
            
            // Clean up temporary files
            this.cleanup(filePath, inputPath);

            resolve({
              status: 'Time Limit Exceeded',
              output: stdout,
              error: 'Execution timed out',
              time: 10,
              memory: null
            });
          }, 10000);
        };

        executeInDocker().catch((error) => {
          console.error('Docker execution error:', error);
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
      // Clean up temporary files
      this.cleanup(filePath, inputPath);
      throw error;
    }
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
        image: 'python:3.9-slim',
        command: ['python'],
        inputWrapper: (code) => code
      },
      java: {
        fileExtension: '.java',
        image: 'openjdk:17-slim',
        compile: true,
        compileCommand: (filePath) => `javac ${filePath}`,
        runCommand: (filePath, inputPath) => inputPath 
          ? `java -cp /code Main < ${inputPath}`
          : `java -cp /code Main`,
        inputWrapper: (code) => code
      },
      cpp: {
        fileExtension: '.cpp',
        image: 'gcc:12.2.0',
        compile: true,
        compileCommand: function(filePath) {
          // Always use /code/<filename> for Docker
          const path = require('path');
          const dockerPath = `/code/${path.basename(filePath)}`;
          console.log('DEBUG: C++ compileCommand using dockerPath:', dockerPath);
          return `g++ -o /code/a.out ${dockerPath}`;
        },
        runCommand: (filePath, inputPath) => inputPath
          ? `"./a.out < ${inputPath}"`
          : '"./a.out"',
        inputWrapper: (code) => code
      }
    };
  }

  async validateSubmission(code, language, testCases) {
    const results = [];
    let allTestsPassed = true;

    for (const testCase of testCases) {
      // Ensure input is a string - handle cases where AI generates arrays
      let input = testCase.input;
      if (Array.isArray(input)) {
        console.log('Warning: Test case input was an array, converting to string:', input);
        input = input.join('\n');
      } else {
        input = String(input || '');
      }

      const result = await this.executeCode(code, language, input);
      
      // Always compare as strings
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

module.exports = CodeExecutionService; 
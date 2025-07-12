const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'http://localhost:2358';
const JUDGE0_API_KEY = null; // Disable authentication for local development

// Language IDs for Judge0 API
const LANGUAGE_IDS = {
  cpp: 54,      // C++ (GCC 9.2.0)
  java: 62,     // Java (OpenJDK 13.0.1)
  python: 71    // Python (3.8.1)
};

// Simple boilerplate code for each language
const LANGUAGE_BOILERPLATES = {
  cpp: `#include<iostream>
int main(){
    return 0;
}`,
  java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
    }
}`,
  python: `# Enter your python code below`
};

// Default options for Judge0 API
const DEFAULT_OPTIONS = {
  base64_encoded: false,
  cpu_time_limit: 5,
  cpu_extra_time: 1,
  wall_time_limit: 10,
  memory_limit: 128000,
  stack_limit: 64000,
  max_processes_and_or_threads: 60,
  enable_per_process_and_thread_time_limit: false,
  enable_per_process_and_thread_memory_limit: false,
  max_file_size: 1024,
  enable_network: false,
  number_of_runs: 1,
  stdin: '',
  expected_output: null,
  wait: true
};

module.exports = {
  JUDGE0_API_URL,
  JUDGE0_API_KEY,
  LANGUAGE_IDS,
  LANGUAGE_BOILERPLATES,
  DEFAULT_OPTIONS,
}; 
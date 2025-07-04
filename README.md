# Coding Challenge Platform

A real-time coding challenge platform with secure Docker-based code execution. This platform allows users to:
- Create and join coding challenges
- Write and execute code in multiple languages (Python, JavaScript)
- Test solutions against predefined test cases
- Compete with other users in real-time

## Features

- Secure code execution using Docker containers
- Resource limits (memory: 128MB, CPU: 50%)
- Network isolation
- 10-second execution timeout
- Support for Python and JavaScript
- Real-time updates using WebSocket
- Test case validation
- Multi-player support

## Prerequisites

- Node.js 14+
- Docker
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coding-challenge-platform
```

2. Install dependencies:
```bash
npm install
```

3. Make sure Docker is running on your system.

## Usage

1. Start the server:
```bash
npm start
```

The server will start on port 5000 by default.

2. Connect to the WebSocket server from your client:
```javascript
const socket = io('http://localhost:5000');
```

3. Available WebSocket events:

### Create a Challenge
```javascript
socket.emit('createChallenge', (response) => {
  const { roomId, challenge, error } = response;
  // Handle response
});
```

### Join a Challenge
```javascript
socket.emit('joinChallenge', roomId, (response) => {
  const { success, challenge, started, startTime, error } = response;
  // Handle response
});
```

### Submit Solution
```javascript
socket.emit('submitSolution', {
  roomId,
  code,
  language // 'python' or 'javascript'
});

socket.on('submissionResult', (result) => {
  // Handle validation result
});
```

### Execute Code (Practice Mode)
```javascript
socket.emit('executeCode', {
  code,
  language,
  input // optional
});

socket.on('executionResult', (result) => {
  // Handle execution result
});
```

### Game Events
```javascript
socket.on('gameStart', ({ challenge, startTime }) => {
  // Game has started
});

socket.on('gameOver', ({ winnerId, solutions }) => {
  // Game has ended
});

socket.on('playerLeft', ({ playerId }) => {
  // A player has left the game
});
```

## Security

The platform implements several security measures:
- Code execution in isolated Docker containers
- Memory limit of 128MB per container
- CPU limit of 50% per container
- Network access disabled
- 10-second execution timeout
- Automatic container cleanup

## Development

For development with auto-restart:
```bash
npm run dev
```

## Testing

Run the test script to verify code execution:
```bash
node test.js
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 
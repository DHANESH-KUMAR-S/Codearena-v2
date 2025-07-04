// require('./services/mongo');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const CodeExecutionService = require('./services/codeExecutionService');
const { generateCodingChallenge } = require('./services/challengeService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active sessions and games
const activeSessions = new Map();
const activeGames = new Map();

// Initialize code execution service
const codeExecutionService = new CodeExecutionService();
    
// Socket.IO error handling
io.on('error', (error) => {
  console.error('Socket.IO error:', error);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('error', (error) => {
    console.error('Socket error for client', socket.id, ':', error);
  });

  // Handle session creation
  socket.on('createSession', ({ language }) => {
    console.log('Creating session for language:', language);
    const sessionId = uuidv4();
    activeSessions.set(sessionId, { language });
    // Send sessionCreated event to the client
    socket.emit('sessionCreated', { sessionId, boilerplate: '' });
  });

  // Create a new challenge room
  socket.on('createChallenge', async (callback) => {
    console.log('DEBUG: Received createChallenge request from:', socket.id);
    try {
      const roomId = uuidv4();
      console.log('DEBUG: Generated room ID:', roomId);
      
      const challenge = await generateCodingChallenge();
      console.log('DEBUG: Generated challenge:', challenge.title);
      
      activeGames.set(roomId, {
        challenge,
        players: [{ id: socket.id, ready: true }],
        solutions: new Map(),
        started: false,
        startTime: null
      });

      socket.join(roomId);
      console.log('DEBUG: Socket joined room:', roomId);
      
      callback({ roomId, challenge });
      console.log('DEBUG: Sent challenge response to client:', { roomId, challengeTitle: challenge.title });
    } catch (error) {
      console.error('DEBUG: Error creating challenge:', error);
      callback({ error: error.message || 'Failed to create challenge' });
    }
  });

  // Join an existing challenge
  socket.on('joinChallenge', (roomId, callback) => {
    const game = activeGames.get(roomId);
    if (!game) {
      callback({ error: 'Game not found' });
      return;
    }

    game.players.push({ id: socket.id, ready: true });
    socket.join(roomId);

    if (game.players.length === 2) {
      game.started = true;
      game.startTime = Date.now();
      io.to(roomId).emit('gameStart', { 
        challenge: game.challenge,
        startTime: game.startTime
      });
    }

    callback({ 
      success: true, 
      challenge: game.challenge,
      started: game.started,
      startTime: game.startTime
    });
  });

  // Submit solution
  socket.on('submitSolution', async ({ roomId, code, language }) => {
    const game = activeGames.get(roomId);
    if (!game || !game.started) {
      socket.emit('submissionResult', { 
        error: 'Game not found or not started' 
      });
      return;
    }

    try {
      const validation = await codeExecutionService.validateSubmission(
        code,
        language,
        game.challenge.testCases
      );
      
      // Store the solution
      game.solutions.set(socket.id, { 
        code, 
        validation,
        lastSubmitTime: Date.now()
      });

      // Emit result to the player
      socket.emit('submissionResult', validation);

      // If player won, end the game
      if (validation.passed) {
        io.to(roomId).emit('gameOver', {
          winnerId: socket.id,
          solutions: Array.from(game.solutions.entries()).map(([playerId, solution]) => ({
            playerId,
            code: solution.code,
            results: solution.validation
          }))
        });
        activeGames.delete(roomId);
      }
    } catch (error) {
      console.error('Error processing submission:', error);
      socket.emit('submissionResult', {
        error: error.message || 'Failed to process submission'
      });
    }
  });

  // Regular code execution (not challenge)
  socket.on('executeCode', async ({ code, language, input }) => {
    console.log('Executing code for language:', language);
    try {
      const result = await codeExecutionService.executeCode(code, language, input);
      console.log('Sending executionResult to client:', result);
      socket.emit('executionResult', result);
    } catch (error) {
      console.error('Execution error:', error);
      socket.emit('executionResult', {
        status: 'error',
        output: '',
        error: error.message || 'Failed to execute code'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up any games this player was in
    for (const [roomId, game] of activeGames.entries()) {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        if (game.players.length === 0) {
          activeGames.delete(roomId);
        } else {
          io.to(roomId).emit('playerLeft', { playerId: socket.id });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 

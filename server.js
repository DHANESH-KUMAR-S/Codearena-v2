// Load environment variables from .env file
require('dotenv').config();

// Load config file
const config = require('./config');

// require('./services/mongo');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const CodeExecutionService = require('./services/railwayCodeExecutionService');
const { generateCodingChallenge, getAllChallenges } = require('./services/challengeService');
const mongoose = require('mongoose');
const Room = require('./models/room');
const { router: authRouter } = require('./routes/auth');
const { generatePracticeChallengesGemini, generateChallengeGemini } = require('./services/geminiService');

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

// Auth routes
app.use('/api/auth', authRouter);

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint for MongoDB connection
app.get('/debug/mongo', (req, res) => {
  const connectionState = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    readyState: connectionState,
    state: stateMap[connectionState] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
  });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Store active sessions and games
const activeSessions = new Map();
const activeGames = new Map();
const activePracticeChallenges = new Map();
const activeChallengeChallenges = new Map(); // Store Gemini-generated challenges for challenge mode
const rematchRequests = new Map(); // Store rematch requests for each room

// Initialize code execution service
const codeExecutionService = new CodeExecutionService();
    
// Socket.IO error handling
io.on('error', (error) => {
  console.error('Socket.IO error:', error);
});

const mongoUri = config.MONGODB_URI;
console.log('DEBUG: Environment variables:');
console.log('DEBUG: MONGODB_URI:', config.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('DEBUG: NODE_ENV:', config.NODE_ENV);
console.log('DEBUG: Using mongoUri:', mongoUri);

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  bufferCommands: false, // Disable mongoose buffering
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
};

mongoose.connect(mongoUri, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log('Connection state:', mongoose.connection.readyState);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Connection failed. Please check your MONGODB_URI environment variable.');
    // Don't exit the process, let it continue without DB
  });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
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
  socket.on('createChallenge', async (dataOrCallback, maybeCallback) => {
    let callback, difficulty;
    if (typeof dataOrCallback === 'function') {
      callback = dataOrCallback;
      difficulty = 'Beginner';
    } else {
      difficulty = dataOrCallback.difficulty || 'Beginner';
      callback = maybeCallback;
    }
    console.log('DEBUG: Received createChallenge request from:', socket.id, 'difficulty:', difficulty);
    try {
      const roomId = uuidv4();
      console.log('DEBUG: Generated room ID:', roomId);
      
      let challenge, source;
      try {
        console.log('DEBUG: Requesting Gemini challenge...');
        challenge = await generateChallengeGemini(difficulty);
        source = 'gemini';
        console.log('DEBUG: Gemini returned challenge:', challenge.title);
        console.log('DEBUG: Full challenge object:', JSON.stringify(challenge, null, 2));
        // Store Gemini challenge for this room
        activeChallengeChallenges.set(roomId, challenge);
      } catch (aiError) {
        console.error('DEBUG: Gemini failed, falling back to sample challenge:', aiError.message);
        challenge = await generateCodingChallenge(); // This will use fallback
        source = 'fallback';
        console.log('DEBUG: Fallback challenge:', challenge.title);
        // Store fallback challenge for this room
        activeChallengeChallenges.set(roomId, challenge);
      }
      
      const gameData = {
        challenge,
        challengeSource: source,
        players: [{ id: socket.id, ready: true }],
        solutions: new Map(),
        started: false,
        startTime: null,
        selectedDifficulty: difficulty
      };
      activeGames.set(roomId, gameData);
      // Save to DB
      await Room.create({
        roomId,
        challenge,
        challengeSource: source,
        players: [{ id: socket.id, ready: true }],
        solutions: {},
        started: false,
        startTime: null,
        selectedDifficulty: difficulty
      });

      socket.join(roomId);
      console.log('DEBUG: Socket joined room:', roomId);
      
      callback({ roomId, challenge, source, selectedDifficulty: difficulty });
      console.log('DEBUG: Sent challenge response to client:', { roomId, challengeTitle: challenge.title, source });
    } catch (error) {
      console.error('DEBUG: Error creating challenge:', error);
      callback({ error: error.message || 'Failed to create challenge' });
    }
  });

  // Join an existing challenge
  socket.on('joinChallenge', async (dataOrCallback, maybeCallback) => {
    let callback, roomId;
    if (typeof dataOrCallback === 'string') {
      roomId = dataOrCallback;
      callback = maybeCallback;
    } else {
      roomId = dataOrCallback.roomId;
      callback = maybeCallback;
    }
    // Always load the latest room state from DB
    const dbRoom = await Room.findOne({ roomId });
    if (!dbRoom) {
      callback({ error: 'Game not found' });
      return;
    }
    // Restore to memory
    let game = activeGames.get(roomId);
    if (!game) {
      game = {
        challenge: dbRoom.challenge,
        challengeSource: dbRoom.challengeSource,
        players: dbRoom.players,
        solutions: new Map(Object.entries(dbRoom.solutions || {})),
        started: dbRoom.started,
        startTime: dbRoom.startTime,
        selectedDifficulty: dbRoom.selectedDifficulty
      };
      activeGames.set(roomId, game);
    } else {
      // Sync players and state from DB
      game.players = dbRoom.players;
      game.started = dbRoom.started;
      game.startTime = dbRoom.startTime;
      game.selectedDifficulty = dbRoom.selectedDifficulty;
    }

    // Add player if not already present
    if (!game.players.some(p => p.id === socket.id)) {
    game.players.push({ id: socket.id, ready: true });
      // Update DB
      await Room.updateOne({ roomId }, { $push: { players: { id: socket.id, ready: true } } });
    }
    socket.join(roomId);

    // If two players, start the game
    if (game.players.length === 2 && !game.started) {
      game.started = true;
      game.startTime = Date.now();
      await Room.updateOne({ roomId }, { started: true, startTime: game.startTime });
      io.to(roomId).emit('gameStart', { 
        challenge: game.challenge,
        challengeSource: game.challengeSource,
        startTime: game.startTime
      });
    }

    // Always emit the current challenge and player list to all in the room
    io.to(roomId).emit('roomUpdate', {
      players: game.players,
      challenge: game.challenge,
      started: game.started,
      startTime: game.startTime
    });

    callback({ 
      success: true, 
      challenge: game.challenge,
      challengeSource: game.challengeSource,
      started: game.started,
      startTime: game.startTime,
      selectedDifficulty: game.selectedDifficulty
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
      // Look up the challenge in the activeChallengeChallenges map for this room
      const storedChallenge = activeChallengeChallenges.get(roomId);
      const challengeToUse = storedChallenge || game.challenge;
      
      const validation = await codeExecutionService.validateSubmission(
        code,
        language,
        challengeToUse.testCases
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
        // Store player information for potential rematch before deleting
        const playersForRematch = game.players;
        
        io.to(roomId).emit('gameOver', {
          winnerId: socket.id,
          solutions: Array.from(game.solutions.entries()).map(([playerId, solution]) => ({
            playerId,
            code: solution.code,
            results: solution.validation
          }))
        });
        
        // Store players for rematch before cleaning up
        if (!rematchRequests.has(roomId)) {
          rematchRequests.set(roomId, {
            requests: new Set(),
            players: playersForRematch
          });
        }
        
        activeGames.delete(roomId);
        activeChallengeChallenges.delete(roomId); // Clean up stored challenge
      }
    } catch (error) {
      console.error('Error processing submission:', error);
      socket.emit('submissionResult', {
        error: error.message || 'Failed to process submission'
      });
    }
  });

  // Handle rematch requests
  socket.on('requestRematch', async ({ roomId, difficulty }) => {
    console.log('Rematch requested for room:', roomId, 'by player:', socket.id);
    
    // Get the stored rematch data or create new one
    let roomRematchData = rematchRequests.get(roomId);
    if (!roomRematchData) {
      console.log('No rematch data found for room:', roomId);
      return;
    }
    
    roomRematchData.requests.add(socket.id);
    
    // Notify all players in the room about the rematch request
    io.to(roomId).emit('rematchRequested', {
      requestingPlayer: socket.id,
      totalRequests: roomRematchData.requests.size
    });
    
    // If both players have requested rematch, start a new game
    if (roomRematchData.requests.size === 2) {
      try {
        console.log('Both players requested rematch, generating new challenge...');
        
        // Generate a new challenge
        let newChallenge, source;
        try {
          newChallenge = await generateChallengeGemini(difficulty);
          source = 'gemini';
          console.log('Generated new challenge for rematch:', newChallenge.title);
        } catch (aiError) {
          console.error('Failed to generate new challenge with Gemini, using fallback:', aiError.message);
          newChallenge = await generateCodingChallenge();
          source = 'fallback';
        }
        
        // Store the new challenge
        activeChallengeChallenges.set(roomId, newChallenge);
        
        // Create new game state with the stored players
        const gameData = {
          challenge: newChallenge,
          challengeSource: source,
          players: roomRematchData.players, // Use the stored players
          solutions: new Map(),
          started: false,
          startTime: null,
          selectedDifficulty: difficulty
        };
        activeGames.set(roomId, gameData);
        
        // Update DB
        await Room.updateOne(
          { roomId },
          { 
            challenge: newChallenge,
            challengeSource: source,
            solutions: {},
            started: false,
            startTime: null,
            selectedDifficulty: difficulty
          }
        );
        
        // Notify all players that rematch is starting
        io.to(roomId).emit('rematchStarting', {
          challenge: newChallenge,
          challengeSource: source,
          selectedDifficulty: difficulty
        });
        
        // Start the game immediately
        gameData.started = true;
        gameData.startTime = Date.now();
        await Room.updateOne({ roomId }, { started: true, startTime: gameData.startTime });
        
        io.to(roomId).emit('gameStart', { 
          challenge: newChallenge,
          challengeSource: source,
          startTime: gameData.startTime
        });
        
        // Clean up rematch requests
        rematchRequests.delete(roomId);
        
      } catch (error) {
        console.error('Error starting rematch:', error);
        io.to(roomId).emit('rematchError', {
          error: 'Failed to start rematch. Please try again.'
        });
      }
    }
  });

  // Handle rematch decline
  socket.on('declineRematch', ({ roomId }) => {
    console.log('Rematch declined for room:', roomId, 'by player:', socket.id);
    
    // Remove the room from rematch requests
    rematchRequests.delete(roomId);
    
    // Notify all players that rematch was declined
    io.to(roomId).emit('rematchDeclined', {
      decliningPlayer: socket.id
    });
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

  // Practice mode handlers
  socket.on('getPracticeChallenges', async (dataOrCallback, maybeCallback) => {
    let callback, difficulty;
    if (typeof dataOrCallback === 'function') {
      callback = dataOrCallback;
      difficulty = 'Beginner';
    } else {
      difficulty = dataOrCallback.difficulty || 'Beginner';
      callback = maybeCallback;
    }
    console.log('Server: Received getPracticeChallenges request from:', socket.id, 'difficulty:', difficulty);
    try {
      let challenges, source;
      try {
        console.log('Server: Requesting Gemini challenges...');
        challenges = await generatePracticeChallengesGemini(5, difficulty);
        source = 'gemini';
        console.log('Server: Gemini returned', challenges.length, 'challenges');
        // Store Gemini challenges for this socket
        activePracticeChallenges.set(socket.id, challenges);
      } catch (aiError) {
        console.error('Server: Gemini failed, falling back to sample challenges:', aiError.message);
        challenges = getAllChallenges();
        source = 'fallback';
        // Store fallback challenges for this socket
        activePracticeChallenges.set(socket.id, challenges);
      }
      if (!challenges || challenges.length === 0) {
        callback({ error: 'No challenges available' });
        return;
      }
      callback({ challenges, source });
    } catch (error) {
      console.error('Server: Error getting practice challenges:', error);
      callback({ error: error.message || 'Failed to get practice challenges' });
    }
  });

  socket.on('submitPracticeSolution', async ({ code, language, challengeId }) => {
    try {
      // Look up the challenge in the activePracticeChallenges map for this socket
      const challenges = activePracticeChallenges.get(socket.id) || [];
      let challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) {
        // Fallback to global set
        const fallback = getAllChallenges();
        challenge = fallback.find(c => c.id === challengeId);
      }
      if (!challenge) {
        socket.emit('practiceSubmissionResult', { 
          error: 'Challenge not found' 
        });
        return;
      }
      const validation = await codeExecutionService.validateSubmission(
        code,
        language,
        challenge.testCases
      );
      socket.emit('practiceSubmissionResult', validation);
    } catch (error) {
      console.error('Error processing practice submission:', error);
      socket.emit('practiceSubmissionResult', {
        error: error.message || 'Failed to process submission'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    activePracticeChallenges.delete(socket.id);
    // Do NOT remove rooms or players from DB or memory on disconnect.
    // Only clean up on gameOver.
    for (const [roomId, game] of activeGames.entries()) {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        // Optionally, mark player as disconnected (not removing from list)
        // game.players[playerIndex].ready = false;
        // Optionally, emit playerLeft event
          io.to(roomId).emit('playerLeft', { playerId: socket.id });
      }
    }
  });
});

const PORT = config.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 

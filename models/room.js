const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  challenge: { type: Object, required: true },
  challengeSource: { type: String, enum: ['gemini', 'fallback'], default: 'fallback' },
  players: [{
    id: String,
    ready: Boolean
  }],
  selectedDifficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: false },
  solutions: { type: Object, default: {} },
  started: { type: Boolean, default: false },
  startTime: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // auto-remove after 1 hour
});

module.exports = mongoose.model('Room', RoomSchema); 
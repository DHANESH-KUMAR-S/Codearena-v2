module.exports = {
  // MongoDB Atlas connection string
  MONGODB_URI: 'mongodb+srv://dhanesh2006:Pass%40123@codearena.f4sihnz.mongodb.net/codearena?retryWrites=true&w=majority&appName=Codearena',
  
  // JWT Secret for authentication
  JWT_SECRET: '8af3f57d0d510dbb903604500dcd6663',
  
  // Gemini API Key for AI challenges
  GEMINI_API_KEY: 'AIzaSyCcB5N7GIAUh1D4jzFZAbmJxtMgjb4Bxa4', // Replace with your actual Gemini API key
  
  // Environment
  NODE_ENV: 'production',
  
  // Port
  PORT: process.env.PORT || 5000
}; 

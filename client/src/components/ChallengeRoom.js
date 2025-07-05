import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import EditorWrapper from './EditorWrapper';
import { socket } from '../socket';

const ChallengeRoom = ({ roomId, onExit }) => {
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [status, setStatus] = useState('waiting');
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [startTime, setStartTime] = useState(null);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const [gameOverDialog, setGameOverDialog] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [finalSubmissionTime, setFinalSubmissionTime] = useState(null);
  const [finalTimeRemaining, setFinalTimeRemaining] = useState(null);
  const [someoneWon, setSomeoneWon] = useState(false);
  const isInitialized = React.useRef(false);

  useEffect(() => {
    if (!roomId) return;

    socket.emit('joinChallenge', roomId, (response) => {
      if (response.error) {
        setNotification({
          open: true,
          message: response.error,
          severity: 'error'
        });
        onExit();
        return;
      }
      
      setChallenge(response.challenge);
      // Only set boilerplate code on first initialization
      if (!isInitialized.current) {
        setCode(response.challenge.boilerplateCode[language]);
        isInitialized.current = true;
      }
      if (response.started && response.startTime) {
        setStatus('started');
        setStartTime(response.startTime);
        const elapsed = Math.floor((Date.now() - response.startTime) / 1000);
        setTimeLeft(Math.max(0, response.challenge.timeLimit - elapsed));
      }
    });

    socket.on('gameStart', ({ challenge, startTime }) => {
      setChallenge(challenge);
      // Only set boilerplate code on first initialization
      if (!isInitialized.current) {
        setCode(challenge.boilerplateCode[language]);
        isInitialized.current = true;
      }
      setStatus('started');
      setStartTime(startTime);
      setTimeLeft(challenge.timeLimit);
      setSomeoneWon(false); // Reset someoneWon state for new game
      setFinalTimeRemaining(null); // Reset final time remaining
      setFinalSubmissionTime(null); // Reset final submission time
      setGameResult(null); // Reset game result
      setGameOverDialog(false); // Close any open dialog
      setNotification({
        open: true,
        message: 'Game started! Good luck!',
        severity: 'success'
      });
    });

    socket.on('submissionResult', (validation) => {
      setResult(validation);
      if (validation.error) {
        setNotification({
          open: true,
          message: `Error: ${validation.error}`,
          severity: 'error'
        });
      } else if (validation.passed) {
        // If this player won, stop their timer immediately and disable submit button
        const currentTimeRemaining = timeLeft; // Capture current time remaining before setting to 0
        setTimeLeft(0);
        setFinalSubmissionTime(Date.now());
        setFinalTimeRemaining(currentTimeRemaining); // Store the actual time remaining when they won
        setSomeoneWon(true);
        setStatus('finished');
        setNotification({
          open: true,
          message: 'All test cases passed!',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Some test cases failed. Check the results below.',
          severity: 'warning'
        });
      }
    });

    socket.on('gameOver', ({ winnerId, solutions }) => {
      setStatus('finished');
      setTimeLeft(0); // Stop the timer
      setFinalSubmissionTime(Date.now());
      // Capture the current time remaining for the losing player
      if (socket.id !== winnerId) {
        setFinalTimeRemaining(timeLeft);
      }
      setSomeoneWon(true);
      setGameResult({
        isWinner: socket.id === winnerId,
        winnerId,
        solutions
      });
      setGameOverDialog(true);
      setNotification({
        open: true,
        message: socket.id === winnerId ? 'Congratulations! You won! 🎉' : 'HARD LUCK BUDDY!! YOUR OPPONENT HAS WON THE GAME',
        severity: socket.id === winnerId ? 'success' : 'error'
      });
    });

    socket.on('playerLeft', () => {
      setNotification({
        open: true,
        message: 'Your opponent has left the game',
        severity: 'warning'
      });
      onExit();
    });

    return () => {
      socket.off('gameStart');
      socket.off('submissionResult');
      socket.off('gameOver');
      socket.off('playerLeft');
    };
  }, [roomId, onExit, language]);

  useEffect(() => {
    let timer;
    if (status === 'started' && timeLeft > 0 && !someoneWon) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, challenge.timeLimit - elapsed);
        
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          setStatus('finished');
          setNotification({
            open: true,
            message: 'Time is up!',
            severity: 'warning'
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, startTime, challenge, someoneWon]);

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    setLanguage(newLang);
    // Only reset to boilerplate if user hasn't typed anything yet
    if (challenge && challenge.boilerplateCode[newLang] && !hasUserTyped) {
      setCode(challenge.boilerplateCode[newLang]);
    }
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      setNotification({
        open: true,
        message: 'Please write some code before submitting',
        severity: 'warning'
      });
      return;
    }

    setNotification({
      open: true,
      message: 'Testing your solution...',
      severity: 'info'
    });

    socket.emit('submitSolution', {
      roomId,
      code,
      language
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCloseGameOverDialog = () => {
    setGameOverDialog(false);
  };

  if (!challenge) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              {challenge.title}
            </Typography>
            <Chip 
              label={challenge.difficulty.toUpperCase()} 
              color={
                challenge.difficulty === 'easy' ? 'success' : 
                challenge.difficulty === 'medium' ? 'warning' : 'error'
              }
              sx={{ mb: 2 }}
            />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
              {challenge.description}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Input Format:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {challenge.inputFormat}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Output Format:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {challenge.outputFormat}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Constraints:
            </Typography>
            <ul>
              {challenge.constraints.map((constraint, index) => (
                <li key={index}>
                  <Typography variant="body2">{constraint}</Typography>
                </li>
              ))}
            </ul>
            <Typography variant="h6" gutterBottom>
              Examples:
            </Typography>
            {challenge.examples.map((example, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Input:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                    {example.input}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Output:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                    {example.output}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Explanation:
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {example.explanation}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  onChange={handleLanguageChange}
                  label="Language"
                >
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="cpp">C++</MenuItem>
                  <MenuItem value="java">Java</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (challenge && challenge.boilerplateCode[language]) {
                      setCode(challenge.boilerplateCode[language]);
                      setHasUserTyped(false);
                      isInitialized.current = false;
                    }
                  }}
                >
                  Reset Code
                </Button>
                {timeLeft !== null && (
                  <Typography variant="h6" color={(someoneWon ? finalTimeRemaining : timeLeft) < 60 ? "error" : "text.primary"}>
                    {someoneWon ? 'Game Over - ' : ''}Time Left: {someoneWon ? formatTime(finalTimeRemaining) : formatTime(timeLeft)}
                  </Typography>
                )}
              </Box>
            </Box>

            <EditorWrapper
              value={code}
              onChange={(value) => {
                setCode(value || '');
                // Mark that user has started typing
                if (!hasUserTyped && value && value.trim() !== '') {
                  setHasUserTyped(true);
                }
              }}
              language={language}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 4,
                wordWrap: 'on',
                overviewRulerBorder: false,
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10
                }
              }}
            />

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={status !== 'started' || timeLeft === 0 || status === 'finished' || someoneWon}
                sx={{ minWidth: 150 }}
              >
                {status === 'waiting' ? 'Waiting for players...' : 
                 timeLeft === 0 ? 'Time is up!' : 
                 status === 'finished' || someoneWon ? 'Game Over' :
                 'Submit Solution'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={onExit}
                sx={{ minWidth: 120 }}
              >
                Exit Challenge
              </Button>
            </Box>

            {result && result.results && (
              <Paper sx={{ mt: 3, p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ mr: 1 }}>
                    Test Results
                  </Typography>
                  {result.passed ? (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="All Tests Passed" 
                      color="success" 
                      variant="outlined" 
                    />
                  ) : (
                    <Chip 
                      icon={<ErrorIcon />} 
                      label="Some Tests Failed" 
                      color="error" 
                      variant="outlined" 
                    />
                  )}
                </Box>
                {result.results.map((testResult, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2, borderColor: testResult.passed ? 'success.main' : 'error.main' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" color={testResult.passed ? "success.main" : "error.main"}>
                          Test Case {index + 1}
                        </Typography>
                        <Chip 
                          size="small"
                          label={testResult.passed ? "Passed" : "Failed"}
                          color={testResult.passed ? "success" : "error"}
                        />
                      </Box>
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Input:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                          {testResult.input}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          Expected Output:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                          {testResult.expected}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          Your Output:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                          {testResult.actual}
                        </Typography>
                        {testResult.error && (
                          <>
                            <Typography variant="subtitle2" color="error">
                              Error:
                            </Typography>
                            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                              {testResult.error}
                            </Typography>
                          </>
                        )}
                        {testResult.time && (
                          <Typography variant="body2" color="text.secondary">
                            Execution time: {testResult.time}ms
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Paper>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Game Over Dialog */}
      <Dialog
        open={gameOverDialog}
        onClose={handleCloseGameOverDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          {gameResult?.isWinner ? (
            <>
              <EmojiEventsIcon sx={{ fontSize: 80, color: '#FFD700', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#FFD700' }}>
                🎉 CONGRATULATIONS! 🎉
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                You Won The Challenge!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                All test cases passed! You've successfully solved the problem and defeated your opponent.
              </Typography>
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)', 
                p: 2, 
                borderRadius: 2, 
                mb: 3,
                backdropFilter: 'blur(10px)'
              }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Final Time: {startTime && finalSubmissionTime ? formatTime(Math.floor((finalSubmissionTime - startTime) / 1000)) : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Time Remaining: {finalTimeRemaining !== null ? formatTime(finalTimeRemaining) : 'N/A'}
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <SentimentVeryDissatisfiedIcon sx={{ fontSize: 80, color: '#ff6b6b', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#ff6b6b' }}>
                HARD LUCK BUDDY!!
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                YOUR OPPONENT HAS WON THE GAME
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your opponent successfully solved the problem before you. Better luck next time!
              </Typography>
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)', 
                p: 2, 
                borderRadius: 2, 
                mb: 3,
                backdropFilter: 'blur(10px)'
              }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Final Time: {startTime && finalSubmissionTime ? formatTime(Math.floor((finalSubmissionTime - startTime) / 1000)) : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Time Remaining: {finalTimeRemaining !== null ? formatTime(finalTimeRemaining) : 'N/A'}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={handleCloseGameOverDialog}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChallengeRoom; 
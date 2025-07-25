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
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditorWrapper from './EditorWrapper';
import { socket } from '../socket';
import './Login.css';

const ChallengeRoom = ({ roomId, challengeSource: initialChallengeSource, onExit, user, onLogout, difficulty: initialDifficulty = 'Beginner' }) => {
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
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [challengeSource, setChallengeSource] = useState(initialChallengeSource);
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialDifficulty);
  const [rematchDialog, setRematchDialog] = useState(false);
  const [rematchTimer, setRematchTimer] = useState(10);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchRequestCount, setRematchRequestCount] = useState(0);
  const isInitialized = React.useRef(false);

  // Profile menu handlers
  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileClose();
    onLogout();
  };

  useEffect(() => {
    if (!roomId) return;

    socket.emit('joinChallenge', { roomId, difficulty: initialDifficulty }, (response) => {
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
      setChallengeSource(response.challengeSource);
      if (response.selectedDifficulty) {
        setSelectedDifficulty(response.selectedDifficulty);
      }
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

    socket.on('gameStart', ({ challenge, challengeSource, startTime }) => {
      setChallenge(challenge);
      setChallengeSource(challengeSource);
      // Always set boilerplate code for new challenges (including rematch)
      setCode(challenge.boilerplateCode[language]);
      isInitialized.current = true;
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

    socket.on('rematchRequested', ({ requestingPlayer, totalRequests }) => {
      setRematchRequestCount(totalRequests);
      if (requestingPlayer !== socket.id) {
        if (totalRequests === 2) {
          setNotification({
            open: true,
            message: 'Both players requested rematch! Starting new game...',
            severity: 'success'
          });
        } else {
          setNotification({
            open: true,
            message: 'Your opponent has requested a rematch!',
            severity: 'info'
          });
        }
      }
    });

    socket.on('rematchStarting', ({ challenge, challengeSource, selectedDifficulty }) => {
      setChallenge(challenge);
      setChallengeSource(challengeSource);
      setSelectedDifficulty(selectedDifficulty);
      setRematchDialog(false);
      setRematchTimer(0); // Stop the timer
      setRematchRequested(false);
      setRematchRequestCount(0);
      
      // Reset game state
      setStatus('waiting');
      setTimeLeft(null);
      setStartTime(null);
      setResult(null);
      setSomeoneWon(false);
      setFinalSubmissionTime(null);
      setFinalTimeRemaining(null);
      setGameResult(null);
      setGameOverDialog(false);
      setHasUserTyped(false);
      isInitialized.current = false;
      
      setNotification({
        open: true,
        message: 'Rematch starting with a new challenge!',
        severity: 'success'
      });
    });

    socket.on('rematchDeclined', ({ decliningPlayer }) => {
      if (decliningPlayer !== socket.id) {
        setNotification({
          open: true,
          message: 'Your opponent declined the rematch.',
          severity: 'warning'
        });
      }
      setRematchDialog(false);
      setRematchTimer(0);
      setRematchRequested(false);
      setRematchRequestCount(0);
    });

    socket.on('rematchError', ({ error }) => {
      setNotification({
        open: true,
        message: error,
        severity: 'error'
      });
      setRematchDialog(false);
      setRematchTimer(0);
      setRematchRequested(false);
      setRematchRequestCount(0);
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
      socket.off('rematchRequested');
      socket.off('rematchStarting');
      socket.off('rematchDeclined');
      socket.off('rematchError');
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
    // Always reset to boilerplate for the new language
    if (challenge && challenge.boilerplateCode && challenge.boilerplateCode[newLang]) {
      setCode(challenge.boilerplateCode[newLang]);
    } else {
      setCode('');
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

    socket.emit('submitSolution', {
      roomId,
      code,
      language
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCloseGameOverDialog = () => {
    setGameOverDialog(false);
    // Start rematch timer after game over dialog closes
    setRematchDialog(true);
    setRematchTimer(10);
  };

  const handleRequestRematch = () => {
    setRematchRequested(true);
    socket.emit('requestRematch', { roomId, difficulty: selectedDifficulty });
    setNotification({
      open: true,
      message: 'Rematch requested! Waiting for opponent...',
      severity: 'info'
    });
  };

  const handleDeclineRematch = () => {
    socket.emit('declineRematch', { roomId });
    setRematchDialog(false);
    setRematchTimer(0);
    setRematchRequested(false);
    setRematchRequestCount(0);
  };

  // Rematch timer effect
  useEffect(() => {
    let timer;
    if (rematchDialog && rematchTimer > 0 && rematchRequestCount < 2) {
      timer = setInterval(() => {
        setRematchTimer(prev => {
          if (prev <= 1) {
            // Auto-decline if timer runs out and not both players have requested
            setTimeout(() => {
              handleDeclineRematch();
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [rematchDialog, rematchTimer, rematchRequestCount]);

  if (!challenge) {
    return (
      <div className="auth-container">
        <div className="auth-background">
          <div className="glow-orb glow-orb-1"></div>
          <div className="glow-orb glow-orb-2"></div>
          <div className="glow-orb glow-orb-3"></div>
        </div>
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ position: 'relative', zIndex: 2 }}>
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {/* Background with glow orbs */}
      <div className="auth-background">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>

      {/* Status Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Code Arena" 
            style={{
              height: '40px',
              width: 'auto',
              filter: 'drop-shadow(0 0 10px rgba(102, 126, 234, 0.6))',
            }}
          />
        </Box>

        {/* Profile Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
              fontSize: '16px',
            }}
          >
            Welcome, {user?.username}!
          </Typography>
          <IconButton
            onClick={handleProfileClick}
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <AccountCircleIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileAnchorEl}
          open={Boolean(profileAnchorEl)}
          onClose={handleProfileClose}
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              mt: 1,
            }
          }}
        >
          <MenuItemComponent onClick={handleLogout} sx={{ minWidth: 150 }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <Typography>Logout</Typography>
          </MenuItemComponent>
        </Menu>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        p: 3, 
        paddingTop: '90px', 
        minHeight: '100vh',
        position: 'relative',
        zIndex: 2,
      }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%', 
                overflow: 'auto',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                {challenge.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={selectedDifficulty ? selectedDifficulty.toUpperCase() : (challenge.difficulty || '').toUpperCase()} 
                  color={
                    (selectedDifficulty === 'Beginner' || challenge.difficulty === 'easy') ? 'success' : 
                    (selectedDifficulty === 'Intermediate' || challenge.difficulty === 'medium') ? 'warning' : 'error'
                  }
                />
                {challengeSource === 'gemini' && (
                  <Chip 
                    label="AI Generated" 
                    color="primary"
                    size="small"
                    icon={<AutoAwesomeIcon />}
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontSize: '0.75rem',
                    }}
                  />
                )}
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
                {challenge.description}
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Input Format:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
                {challenge.inputFormat}
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Output Format:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)' }}>
                {challenge.outputFormat}
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Constraints:
              </Typography>
              <ul style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {challenge.constraints.map((constraint, index) => (
                  <li key={index}>
                    <Typography variant="body2">{constraint}</Typography>
                  </li>
                ))}
              </ul>
              <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Examples:
              </Typography>
              {challenge.examples.map((example, index) => (
                <Card 
                  key={index} 
                  variant="outlined" 
                  sx={{ 
                    mb: 2,
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Input:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                      {example.input}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Output:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                      {example.output}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Explanation:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {example.explanation}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>Language</InputLabel>
                  <Select
                    value={language}
                    onChange={handleLanguageChange}
                    label="Language"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'rgba(255, 255, 255, 0.8)',
                      },
                    }}
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
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Reset Code
                  </Button>
                  {timeLeft !== null && (
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: (someoneWon ? finalTimeRemaining : timeLeft) < 60 ? "#ff6b6b" : "rgba(255, 255, 255, 0.9)",
                        fontWeight: 600,
                      }}
                    >
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
                  onClick={handleSubmit}
                  disabled={status !== 'started' || timeLeft === 0 || status === 'finished' || someoneWon}
                  sx={{ 
                    minWidth: 150,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  {status === 'waiting' ? 'Waiting for players...' : 
                   timeLeft === 0 ? 'Time is up!' : 
                   status === 'finished' || someoneWon ? 'Game Over' :
                   'Submit Solution'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={onExit}
                  sx={{ 
                    minWidth: 120,
                    color: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Exit Challenge
                </Button>
              </Box>

              {result && result.results && (
                <Paper sx={{ 
                  mt: 3, 
                  p: 2, 
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.95)' }}>
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
                    <Card 
                      key={index} 
                      variant="outlined" 
                      sx={{ 
                        mb: 2, 
                        borderColor: testResult.passed ? 'success.main' : 'error.main',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
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
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Input:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                            {testResult.input}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Expected Output:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                            {testResult.expected}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Your Output:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
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
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
                <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
                  You Won The Challenge!
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                  All test cases passed! You've successfully solved the problem and defeated your opponent.
                </Typography>
                <Box sx={{ 
                  bgcolor: 'rgba(102, 126, 234, 0.1)', 
                  p: 2, 
                  borderRadius: 2, 
                  mb: 3,
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                }}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#333' }}>
                    Final Time: {startTime && finalSubmissionTime ? formatTime(Math.floor((finalSubmissionTime - startTime) / 1000)) : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
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
                <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
                  YOUR OPPONENT HAS WON THE GAME
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                  Your opponent successfully solved the problem before you. Better luck next time!
                </Typography>
                <Box sx={{ 
                  bgcolor: 'rgba(240, 147, 251, 0.1)', 
                  p: 2, 
                  borderRadius: 2, 
                  mb: 3,
                  border: '1px solid rgba(240, 147, 251, 0.2)',
                }}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#333' }}>
                    Final Time: {startTime && finalSubmissionTime ? formatTime(Math.floor((finalSubmissionTime - startTime) / 1000)) : 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rematch Dialog */}
        <Dialog
          open={rematchDialog}
          onClose={handleDeclineRematch}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <DialogContent sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                🏆 REMATCH? 🏆
              </Typography>
              <Typography variant="h6" sx={{ mb: 2, color: '#666' }}>
                Ready for another challenge?
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                A new AI-generated problem will be created for both players.
              </Typography>
            </Box>
            
            <Box sx={{ 
              bgcolor: 'rgba(102, 126, 234, 0.1)', 
              p: 2, 
              borderRadius: 2, 
              mb: 3,
              border: '1px solid rgba(102, 126, 234, 0.2)',
            }}>
              <Typography variant="h6" sx={{ mb: 1, color: '#333' }}>
                Time Remaining: {rematchTimer}s
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {rematchRequested ? 'You requested rematch' : 'Waiting for your decision...'}
              </Typography>
              {rematchRequestCount > 0 && (
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  {rematchRequestCount}/2 players ready
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleRequestRematch}
              disabled={rematchRequested}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                minWidth: 120,
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
                '&:disabled': {
                  background: 'rgba(102, 126, 234, 0.5)',
                  color: 'white',
                },
              }}
            >
              {rematchRequested ? 'Requested' : 'REMATCH'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleDeclineRematch}
              sx={{
                color: '#666',
                borderColor: '#666',
                minWidth: 120,
                '&:hover': {
                  borderColor: '#333',
                  color: '#333',
                },
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </div>
  );
};

export default ChallengeRoom; 
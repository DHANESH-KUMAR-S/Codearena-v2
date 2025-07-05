import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodingChallenge from './CodingChallenge';
import ChallengeRoom from './ChallengeRoom';
import { socket } from '../socket';

const runningTexts = [
  'Real-time coding battles',
  'Practice and improve your skills',
  'Challenge your friends',
  'Supports C++, Java, Python',
  'Instant code execution',
  'Fun, competitive, and educational!'
];

function Home({ user, onLogout }) {
  const [mode, setMode] = useState('home'); // 'home', 'practice', 'challenge'
  const [roomId, setRoomId] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [loading, setLoading] = useState(false);
  const [textIndex, setTextIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % runningTexts.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Handlers for UI
  const handleStartPractice = () => setMode('practice');

  const handleCreateChallenge = () => {
    setLoading(true);
    socket.emit('createChallenge', (response) => {
      setLoading(false);
      if (response.error) {
        setError(response.error);
        return;
      }
      setRoomId(response.roomId);
      setChallenge(response.challenge);
      setCreateDialogOpen(true);
    });
  };

  const handleStartChallenge = () => {
    setCreateDialogOpen(false);
    setMode('challenge');
  };

  const handleJoinChallenge = () => {
    if (!joinRoomId.trim()) {
      setError('Please enter a challenge code.');
      return;
    }
    setLoading(true);
    socket.emit('joinChallenge', joinRoomId.trim(), (response) => {
      setLoading(false);
      if (response.error) {
        setError(response.error);
        return;
      }
      setRoomId(joinRoomId.trim());
      setChallenge(response.challenge);
      setJoinDialogOpen(false);
      setMode('challenge');
    });
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setSnackbar('Room ID copied!');
  };

  const handleCloseError = () => setError('');
  const handleCloseSnackbar = () => setSnackbar('');
  const handleExitChallenge = () => {
    setMode('home');
    setRoomId('');
    setJoinRoomId('');
    setChallenge(null);
  };

  // Main UI
  if (mode === 'practice') {
    return <CodingChallenge onExit={handleExitChallenge} />;
  }
  if (mode === 'challenge') {
    return <ChallengeRoom roomId={roomId} challenge={challenge} onExit={handleExitChallenge} />;
  }

  // Home screen
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'linear-gradient(120deg, #0f2027, #2c5364, #1a2980, #26d0ce)',
        backgroundSize: '300% 300%',
        animation: 'glowBG 12s ease-in-out infinite',
      }}
    >
      {/* Glowy background circles */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, #00f2fe 0%, #4facfe 80%, transparent 100%)',
          opacity: 0.5,
          filter: 'blur(60px)',
          zIndex: 0,
          animation: 'glow1 6s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, #43e97b 0%, #38f9d7 80%, transparent 100%)',
          opacity: 0.5,
          filter: 'blur(60px)',
          zIndex: 0,
          animation: 'glow2 8s ease-in-out infinite',
        }}
      />
      {/* User Header */}
      <Box sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        padding: '8px 16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <Typography sx={{ color: '#fff', fontWeight: 600 }}>
          Welcome, {user?.username}!
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={onLogout}
          sx={{
            color: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: '#fff',
              background: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Logout
        </Button>
      </Box>
      <Container maxWidth="sm" sx={{ zIndex: 2, position: 'relative' }}>
        <Paper
          elevation={8}
          sx={{
            p: 5,
            mt: 8,
            borderRadius: 5,
            background: 'rgba(20, 30, 60, 0.92)',
            boxShadow: '0 0 32px #00f2fe44',
            border: '1.5px solid #00f2fe44',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Typography
            variant="h2"
            align="center"
            sx={{
              fontWeight: 900,
              letterSpacing: 2,
              textShadow: '0 0 32px #00f2fe, 0 0 8px #fff',
              mb: 1,
              fontFamily: 'Montserrat, sans-serif',
              userSelect: 'none',
            }}
          >
            Code Arena
          </Typography>
          <Typography
            variant="h5"
            align="center"
            sx={{
              mb: 4,
              minHeight: 40,
              fontWeight: 400,
              color: '#e0e0e0',
              textShadow: '0 0 8px #00f2fe',
              fontFamily: 'Fira Mono, monospace',
              transition: 'opacity 0.5s',
              opacity: 1,
              letterSpacing: 1,
            }}
          >
            {runningTexts[textIndex]}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleStartPractice}
                disabled={loading}
                sx={{
                  px: 6,
                  py: 1.5,
                  fontSize: 22,
                  fontWeight: 700,
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                  boxShadow: '0 0 24px #00f2fe',
                  color: '#222',
                  textShadow: '0 0 8px #fff',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                    transform: 'scale(1.07)',
                    boxShadow: '0 0 40px #43e97b',
                  },
                }}
              >
                Practice Mode
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" align="center" sx={{ my: 2, color: '#aaa' }}>
                - OR -
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleCreateChallenge}
                disabled={loading}
                sx={{
                  px: 6,
                  py: 1.5,
                  fontSize: 22,
                  fontWeight: 700,
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                  boxShadow: '0 0 24px #43e97b',
                  color: '#222',
                  textShadow: '0 0 8px #fff',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                    transform: 'scale(1.07)',
                    boxShadow: '0 0 40px #00f2fe',
                  },
                }}
              >
                {loading ? 'Creating...' : 'Create New Challenge'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => setJoinDialogOpen(true)}
                disabled={loading}
                sx={{
                  px: 6,
                  py: 1.5,
                  fontSize: 22,
                  fontWeight: 700,
                  borderRadius: 3,
                  color: '#43e97b',
                  borderColor: '#43e97b',
                  background: 'rgba(67, 233, 123, 0.08)',
                  boxShadow: '0 0 12px #43e97b44',
                  textShadow: '0 0 8px #fff',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                    color: '#222',
                    borderColor: '#38f9d7',
                    transform: 'scale(1.07)',
                    boxShadow: '0 0 40px #43e97b',
                  },
                }}
              >
                Join Challenge
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
      {/* Join Challenge Dialog */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'rgba(20, 30, 60, 0.97)',
          color: '#fff',
          boxShadow: '0 0 32px #00f2fe44',
          border: '1.5px solid #00f2fe44',
          backdropFilter: 'blur(8px)',
        }
      }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#00f2fe', textShadow: '0 0 8px #00f2fe' }}>Join Challenge</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#e0e0e0' }}>
            Enter the challenge code provided by your friend:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Challenge Code"
            fullWidth
            variant="outlined"
            value={joinRoomId}
            onChange={e => setJoinRoomId(e.target.value)}
            sx={{
              input: { color: '#fff', background: 'rgba(0,0,0,0.12)' },
              label: { color: '#00f2fe' },
              fieldset: { borderColor: '#00f2fe' },
              mt: 2,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)} sx={{ color: '#aaa' }}>Cancel</Button>
          <Button onClick={handleJoinChallenge} color="primary" variant="contained" disabled={loading}
            sx={{
              background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
              color: '#222',
              fontWeight: 700,
              boxShadow: '0 0 12px #43e97b',
              '&:hover': {
                background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                color: '#222',
              },
            }}
          >
            {loading ? 'Joining...' : 'Join'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Create Challenge Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'rgba(20, 30, 60, 0.97)',
          color: '#fff',
          boxShadow: '0 0 32px #43e97b44',
          border: '1.5px solid #43e97b44',
          backdropFilter: 'blur(8px)',
        }
      }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#43e97b', textShadow: '0 0 8px #43e97b' }}>Challenge Created!</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#e0e0e0' }}>
            Share this code with your opponent to start the challenge:
          </DialogContentText>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#fff', letterSpacing: 2, fontWeight: 700 }}>
              {roomId}
            </Typography>
            <IconButton onClick={handleCopyRoomId} color="primary" size="small" sx={{ color: '#43e97b' }}>
              <ContentCopyIcon />
            </IconButton>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ color: '#aaa' }}>Cancel</Button>
          <Button onClick={handleStartChallenge} color="primary" variant="contained"
            sx={{
              background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
              color: '#222',
              fontWeight: 700,
              boxShadow: '0 0 12px #00f2fe',
              '&:hover': {
                background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                color: '#222',
              },
            }}
          >
            Start Challenge
          </Button>
        </DialogActions>
      </Dialog>
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      {/* Success Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbar}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Home; 
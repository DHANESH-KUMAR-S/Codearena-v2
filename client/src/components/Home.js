import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
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

function Home() {
  const [mode, setMode] = useState('home'); // 'home', 'practice', 'challenge'
  const [roomId, setRoomId] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [loading, setLoading] = useState(false);

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
    socket.emit('joinChallenge', joinRoomId.trim().toUpperCase(), (response) => {
      setLoading(false);
      if (response.error) {
        setError(response.error);
        return;
      }
      setRoomId(joinRoomId.trim().toUpperCase());
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
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Coding Challenge Platform
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          Practice coding or challenge your friends!
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleStartPractice}
              disabled={loading}
            >
              Practice Mode
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" align="center" sx={{ my: 2 }}>
              - OR -
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              onClick={handleCreateChallenge}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create New Challenge'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              fullWidth
              onClick={() => setJoinDialogOpen(true)}
              disabled={loading}
            >
              Join Challenge
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {/* Join Challenge Dialog */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)}>
        <DialogTitle>Join Challenge</DialogTitle>
        <DialogContent>
          <DialogContentText>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleJoinChallenge} color="primary" variant="contained" disabled={loading}>
            {loading ? 'Joining...' : 'Join'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Create Challenge Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Challenge Created!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Share this code with your opponent to start the challenge:
          </DialogContentText>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {roomId}
            </Typography>
            <IconButton onClick={handleCopyRoomId} color="primary" size="small">
              <ContentCopyIcon />
            </IconButton>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStartChallenge} color="primary" variant="contained">
            Start Challenge
          </Button>
        </DialogActions>
      </Dialog>
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
    </Container>
  );
}

export default Home; 
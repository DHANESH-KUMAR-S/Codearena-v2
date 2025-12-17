import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Editor from '@monaco-editor/react';
import { socket } from '../socket';

const CodingChallenge = () => {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [executing, setExecuting] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Create a new session when language changes
    socket.emit('createSession', { language });

    socket.on('sessionCreated', ({ sessionId, boilerplate }) => {
      setSessionId(sessionId);
      setCode(boilerplate);
    });

    socket.on('executionResult', (result) => {
      console.log('Received executionResult:', result);
      setExecuting(false);
      if (result.output && result.output.trim() !== '') {
        setOutput(result.output);
      } else if (result.error && result.error.trim() !== '') {
        setOutput(result.error);
      } else {
        setOutput('');
      }
      setError(result.error || '');
    });

    return () => {
      socket.off('sessionCreated');
      socket.off('executionResult');
    };
  }, [language]);

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleExecuteCode = () => {
    setExecuting(true);
    setOutput('');
    setError('');
    socket.emit('executeCode', {
      sessionId,
      code,
      input,
      language
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  label="Language"
                  onChange={handleLanguageChange}
                >
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="java">Java</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleExecuteCode}
                disabled={executing}
              >
                {executing ? 'Executing...' : 'Run Code'}
              </Button>
            </Box>

            <Editor
              height="400px"
              language={language}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Typography variant="h6" gutterBottom>
                  Input
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your input here..."
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" gutterBottom>
                  Output
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  value={output}
                  InputProps={{ readOnly: true }}
                />
                {error && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CodingChallenge; 
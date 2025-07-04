import React, { useRef } from 'react';
import { Button, Typography, Chip, Box, Paper, Fade } from '@mui/material';
import { keyframes } from '@emotion/react';
import Home from './Home';
import CodeIcon from '@mui/icons-material/Code';
import TerminalIcon from '@mui/icons-material/Terminal'; // Use as placeholder for all

const runningTexts = [
  'Real-time coding battles',
  'Practice and improve your skills',
  'Challenge your friends',
  'Supports multiple languages',
  'Instant code execution',
  'Fun, competitive, and educational!'
];

const glowAnimation = keyframes`
  0% { filter: blur(0px) brightness(1.1); }
  50% { filter: blur(4px) brightness(1.4); }
  100% { filter: blur(0px) brightness(1.1); }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const codeWindowAnimation = keyframes`
  0% { transform: translateY(0px) scale(1); box-shadow: 0 0 32px #00f2fe44; }
  50% { transform: translateY(-16px) scale(1.03); box-shadow: 0 0 64px #00f2fe99; }
  100% { transform: translateY(0px) scale(1); box-shadow: 0 0 32px #00f2fe44; }
`;

const printStatements = [
  'Welcome to Code Arena',
  'Ready to battle?',
  'Compete. Code. Conquer!',
  'Let the coding games begin!',
  'Show your skills at Code Arena',
  'Unleash your coding power!',
  'Join the ultimate code challenge!',
];

const codeTemplates = [
  {
    lang: 'C++',
    filename: 'main.cpp',
    color: '#00599C',
    getPrint: (statement) => `cout << "${statement}"`
  },
  {
    lang: 'Python',
    filename: 'main.py',
    color: '#43e97b',
    getPrint: (statement) => `print("${statement}")`
  },
  {
    lang: 'Java',
    filename: 'Main.java',
    color: '#e76f00',
    getPrint: (statement) => `System.out.println("${statement}");`
  }
];

const languageChips = [
  { label: 'C++', color: '#00599C', icon: <TerminalIcon sx={{ color: '#fff' }} /> },
  { label: 'Python', color: '#43e97b', icon: <TerminalIcon sx={{ color: '#fff' }} /> },
  { label: 'Java', color: '#e76f00', icon: <TerminalIcon sx={{ color: '#fff' }} /> },
];

const lineGrow = keyframes`
  0% { width: 0; opacity: 0; }
  30% { opacity: 1; }
  100% { width: 320px; opacity: 1; }
`;

const crackAppear = keyframes`
  0% { opacity: 0; transform: scaleY(0.2); }
  100% { opacity: 1; transform: scaleY(1); }
`;

const verticalLineDrop = keyframes`
  0% { transform: translateY(-200px); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
`;

const codeSlideLeft = keyframes`
  0% { transform: translateX(0); opacity: 0; }
  100% { transform: translateX(-120px); opacity: 1; }
`;

const arenaSlideRight = keyframes`
  0% { transform: translateX(0); opacity: 0; }
  100% { transform: translateX(120px); opacity: 1; }
`;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomPosition() {
  // Returns {top, left} in % for random floating
  return {
    top: `${10 + Math.random() * 40}%`,
    left: `${10 + Math.random() * 60}%`
  };
}

export default function HomePage() {
  const [showHome, setShowHome] = React.useState(false);
  const runningTextRef = useRef(null);
  const [textIndex, setTextIndex] = React.useState(0);
  const [floatingSnippets, setFloatingSnippets] = React.useState(() => {
    return codeTemplates.map(template => {
      const statement = printStatements[getRandomInt(printStatements.length)];
      return {
        ...template,
        code: [template.getPrint(statement)],
        position: getRandomPosition(),
        statement,
        isDragged: false,
      };
    });
  });

  // Track which cards have been manually dragged
  const dragRefs = useRef([null, null, null]);
  const dragOffset = useRef({ x: 0, y: 0, idx: null });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % runningTexts.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFloatingSnippets(snippets =>
        snippets.map((snippet, idx) => {
          if (snippet.isDragged) return snippet; // Don't move if dragged
          const statement = printStatements[getRandomInt(printStatements.length)];
          return {
            ...snippet,
            code: [snippet.getPrint(statement)],
            position: getRandomPosition(),
            statement,
          };
        })
      );
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Drag handlers using pointer events for best responsiveness
  const handlePointerDown = (e, idx) => {
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    const card = dragRefs.current[idx];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    dragOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
      idx,
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
  };

  const handlePointerMove = (e) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    const idx = dragOffset.current.idx;
    if (idx == null) return;
    // Calculate new position in %
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(0, clientX - dragOffset.current.x), vw - 120);
    const top = Math.min(Math.max(0, clientY - dragOffset.current.y), vh - 60);
    setFloatingSnippets(snippets =>
      snippets.map((snippet, i) =>
        i === idx
          ? {
              ...snippet,
              position: {
                top: `${(top / vh) * 100}%`,
                left: `${(left / vw) * 100}%`,
              },
              isDragged: true,
            }
          : snippet
      )
    );
  };

  const handlePointerUp = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    dragOffset.current.idx = null;
  };

  if (showHome) return <Home />;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      background: 'linear-gradient(120deg, #0f2027, #2c5364, #1a2980, #26d0ce)',
      backgroundSize: '300% 300%',
      animation: `${gradientAnimation} 12s ease-in-out infinite`,
    }}>
      {/* Glowy background circles */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, #00f2fe 0%, #4facfe 80%, transparent 100%)',
        opacity: 0.5,
        filter: 'blur(60px)',
        zIndex: 0,
        animation: `${glowAnimation} 6s ease-in-out infinite`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, #43e97b 0%, #38f9d7 80%, transparent 100%)',
        opacity: 0.5,
        filter: 'blur(60px)',
        zIndex: 0,
        animation: `${glowAnimation} 8s ease-in-out infinite`,
      }} />
      {/* Floating code editor mockups for all languages */}
      {floatingSnippets.map((snippet, idx) => (
        <Paper
          key={snippet.lang}
          elevation={8}
          ref={el => (dragRefs.current[idx] = el)}
          sx={{
            position: 'absolute',
            top: snippet.position.top,
            left: snippet.position.left,
            width: 'fit-content',
            minWidth: 0,
            maxWidth: 'fit-content',
            borderRadius: 3,
            background: 'rgba(20, 30, 60, 0.95)',
            boxShadow: `0 0 32px ${snippet.color}44`,
            zIndex: 1,
            px: 2.5,
            py: 1.5,
            animation: `${codeWindowAnimation} 5s ease-in-out infinite`,
            border: `1.5px solid ${snippet.color}44`,
            overflow: 'visible',
            display: { xs: 'none', sm: 'block' },
            transition: 'top 1s, left 1s, width 0.2s',
            textAlign: 'left',
            cursor: 'grab',
            userSelect: 'none',
          }}
          onPointerDown={e => handlePointerDown(e, idx)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <CodeIcon sx={{ color: snippet.color, mr: 1, fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 1, fontSize: 14 }}>
              {snippet.filename}
            </Typography>
          </Box>
          <Box component="pre" sx={{
            color: '#e0e0e0',
            fontFamily: 'Fira Mono, monospace',
            fontSize: 17,
            m: 0,
            p: 0,
            lineHeight: 1.7,
            whiteSpace: 'pre',
            wordBreak: 'break-all',
            background: 'none',
          }}>
            {snippet.code.map((line, i) => (
              <span key={i} style={{
                color: '#fff',
                textShadow: `0 0 8px ${snippet.color}`,
                display: 'block',
                fontWeight: 700,
                padding: 0,
                margin: 0,
              }}>{line}</span>
            ))}
          </Box>
        </Paper>
      ))}
      {/* Floating language chips */}
      <Box sx={{
        position: 'absolute',
        bottom: { xs: 40, md: 80 },
        left: { xs: '50%', md: 80 },
        transform: { xs: 'translateX(-50%)', md: 'none' },
        display: 'flex',
        gap: 2,
        zIndex: 2,
      }}>
        {languageChips.map((chip, idx) => (
          <Chip
            key={chip.label}
            icon={chip.icon}
            label={chip.label}
            sx={{
              background: chip.color,
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              px: 2,
              boxShadow: `0 0 12px ${chip.color}99`,
              textShadow: '0 0 8px #222',
              borderRadius: 2,
              letterSpacing: 1,
              opacity: 0.92,
            }}
          />
        ))}
      </Box>
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -30%)',
        zIndex: 2,
        textAlign: 'center',
        color: '#fff',
        width: '90vw',
        maxWidth: 600,
      }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            letterSpacing: 2,
            textShadow: '0 0 32px #00f2fe, 0 0 8px #fff',
            mb: 3,
            fontFamily: 'Montserrat, sans-serif',
            userSelect: 'none',
          }}
        >
          Code Arena
        </Typography>
        <Typography
          ref={runningTextRef}
          variant="h5"
          sx={{
            mb: 5,
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
        <Button
          variant="contained"
          size="large"
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
          onClick={() => setShowHome(true)}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
} 
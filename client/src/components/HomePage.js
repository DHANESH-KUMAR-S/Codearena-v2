import React, { useRef } from 'react';
import { Chip, Box, Paper } from '@mui/material';
import { keyframes } from '@emotion/react';
import CodeIcon from '@mui/icons-material/Code';
import TerminalIcon from '@mui/icons-material/Terminal';

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

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}



export default function HomePage({ onGetStarted }) {
  const runningTextRef = useRef(null);
  const [textIndex, setTextIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [floatingSnippets, setFloatingSnippets] = React.useState(() => {
    return codeTemplates.map(template => {
      const statement = printStatements[getRandomInt(printStatements.length)];
      return {
        ...template,
        code: [template.getPrint(statement)],
        statement,
        position: { top: `${20 + Math.random() * 20}%`, left: `${10 + Math.random() * 60}%` },
        velocity: { x: 0, y: 0 },
        isDragged: false,
      };
    });
  });

  // Track which cards have been manually dragged
  const dragRefs = useRef([null, null, null]);
  const dragOffset = useRef({ x: 0, y: 0, idx: null });
  const animationFrameRef = useRef(null);

  // Typewriter effect for running texts
  React.useEffect(() => {
    const currentText = runningTexts[textIndex];
    setIsTyping(true);
    setDisplayText('');
    
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < currentText.length) {
        setDisplayText(currentText.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        // Wait before starting to delete
        setTimeout(() => {
          const deleteInterval = setInterval(() => {
            if (charIndex > 0) {
              setDisplayText(currentText.substring(0, charIndex - 1));
              charIndex--;
            } else {
              clearInterval(deleteInterval);
              setIsTyping(false);
              // Move to next text
              setTimeout(() => {
                setTextIndex((prev) => (prev + 1) % runningTexts.length);
              }, 500);
            }
          }, 50); // Delete speed
        }, 1500); // Wait time before deleting
      }
    }, 100); // Type speed
    
    return () => clearInterval(typeInterval);
  }, [textIndex]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFloatingSnippets(snippets =>
        snippets.map((snippet) => {
          if (snippet.isDragged) return snippet; // Don't move if dragged
          const statement = printStatements[getRandomInt(printStatements.length)];
          return {
            ...snippet,
            code: [snippet.getPrint(statement)],
            statement,
          };
        })
      );
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Physics animation loop
  React.useEffect(() => {
    const animate = () => {
      setFloatingSnippets(snippets =>
        snippets.map((snippet) => {
          if (snippet.isDragged) return snippet;

          // Apply velocity
          const newTop = parseFloat(snippet.position.top) + snippet.velocity.y;
          const newLeft = parseFloat(snippet.position.left) + snippet.velocity.x;

          // Apply friction (slow down over time)
          const friction = 0.92; // Increased friction for slower movement
          const newVelocityX = snippet.velocity.x * friction;
          const newVelocityY = snippet.velocity.y * friction;

          // Bounce off boundaries
          let finalTop = newTop;
          let finalLeft = newLeft;
          let finalVelocityX = newVelocityX;
          let finalVelocityY = newVelocityY;

          // Boundary constraints (keep within viewport)
          if (newTop < 5) {
            finalTop = 5;
            finalVelocityY = Math.abs(newVelocityY) * 0.7; // Bounce with energy loss
          } else if (newTop > 70) {
            finalTop = 70;
            finalVelocityY = -Math.abs(newVelocityY) * 0.7;
          }

          if (newLeft < 5) {
            finalLeft = 5;
            finalVelocityX = Math.abs(newVelocityX) * 0.7;
          } else if (newLeft > 85) {
            finalLeft = 85;
            finalVelocityX = -Math.abs(newVelocityX) * 0.7;
          }

          // Stop very small movements
          if (Math.abs(finalVelocityX) < 0.05) finalVelocityX = 0; // Reduced threshold for earlier stopping
          if (Math.abs(finalVelocityY) < 0.05) finalVelocityY = 0; // Reduced threshold for earlier stopping

          return {
            ...snippet,
            position: {
              top: `${finalTop}%`,
              left: `${finalLeft}%`,
            },
            velocity: {
              x: finalVelocityX,
              y: finalVelocityY,
            },
          };
        })
      );
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
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
              velocity: { x: 0, y: 0 }, // Reset velocity while dragging
              isDragged: true,
            }
          : snippet
      )
    );
  };

  const handlePointerUp = (e) => {
    const idx = dragOffset.current.idx;
    if (idx !== null) {
      // Calculate throw velocity based on mouse movement
      const clientX = e.clientX;
      const clientY = e.clientY;
      const card = dragRefs.current[idx];
      if (card) {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate velocity based on distance from center
        const velocityX = (clientX - centerX) * 0.02; // Reduced from 0.1 to 0.02 for much slower movement
        const velocityY = (clientY - centerY) * 0.02; // Reduced from 0.1 to 0.02 for much slower movement

        setFloatingSnippets(snippets =>
          snippets.map((snippet, i) =>
            i === idx
              ? {
                  ...snippet,
                  velocity: { x: velocityX, y: velocityY },
                  isDragged: false,
                }
              : snippet
          )
        );
      }
    }

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    dragOffset.current.idx = null;
  };

  return (
    <div className="auth-container">
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
      <div className="auth-background">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>
      
      {/* Floating code snippets */}
      {floatingSnippets.map((snippet, idx) => (
        <Paper
          key={snippet.lang}
          elevation={8}
          sx={{
            position: 'absolute',
            width: 'fit-content',
            minWidth: 0,
            maxWidth: 'fit-content',
            borderRadius: 3,
            background: 'rgba(20, 30, 60, 0.95)',
            boxShadow: `0 0 32px ${snippet.color}44`,
            zIndex: 10,
            px: 2.5,
            py: 1.5,
            animation: `${codeWindowAnimation} 5s ease-in-out infinite`,
            border: `1.5px solid ${snippet.color}44`,
            overflow: 'visible',
            display: { xs: 'none', sm: 'block' },
            textAlign: 'left',
            cursor: 'grab',
            userSelect: 'none',
          }}
          style={{
            top: snippet.position.top,
            left: snippet.position.left,
          }}
          ref={(el) => {
            dragRefs.current[idx] = el;
          }}
          onPointerDown={(e) => handlePointerDown(e, idx)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <CodeIcon sx={{ color: snippet.color, mr: 1, fontSize: 20 }} />
            <span style={{ color: '#fff', fontWeight: 700, letterSpacing: 1, fontSize: 14 }}>
              {snippet.filename}
            </span>
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
        bottom: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 2,
        zIndex: 15,
      }}>
        {languageChips.map((chip) => (
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

      <div className="auth-card" style={{ maxWidth: '900px', textAlign: 'center', position: 'relative', zIndex: 5 }}>
        <div className="auth-header">
          <img 
            src="/logo.png" 
            alt="Code Arena" 
            style={{
              maxWidth: '600px',
              width: '100%',
              height: 'auto',
              marginBottom: '30px',
              filter: 'drop-shadow(0 0 20px rgba(102, 126, 234, 0.6))',
            }}
          />
          <p className="auth-subtitle" ref={runningTextRef} style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#ffffff',
            textShadow: '0 0 20px rgba(102, 126, 234, 0.8), 0 0 40px rgba(102, 126, 234, 0.4)',
            letterSpacing: '1px',
            margin: '0',
            padding: '0',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            {displayText}<span style={{ 
              animation: 'blink 1s infinite',
              opacity: isTyping ? 1 : 0,
              color: '#667eea',
              fontSize: '28px',
              fontWeight: '600',
              textShadow: '0 0 15px rgba(102, 126, 234, 1)'
            }}>|</span>
          </p>
        </div>

        <div style={{ marginTop: '60px' }}>
          <button 
            className="auth-button"
            onClick={onGetStarted}
            style={{
              fontSize: '26px',
              padding: '22px 60px',
              borderRadius: '15px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 0 24px #667eea',
              color: 'white',
              border: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.07)';
              e.target.style.boxShadow = '0 0 40px #764ba2';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 0 24px #667eea';
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
} 
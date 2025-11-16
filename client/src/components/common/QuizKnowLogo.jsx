import React from 'react';
import { Box, Typography } from '@mui/material';

// QuizKnow Logo Component - Horizontal Flow with 3D Depth (Responsive)
const QuizKnowLogo = ({ size = 40, showText = true, variant = 'default' }) => {
  const letters = ['Q', 'U', 'I', 'Z', 'K', 'N', 'O', 'W'];
  const colors = ['#1e40af', '#059669']; // Blue-Green alternating

  if (variant === 'text-only') {
    return (
      <Typography
        variant="h6"
        component="div"
        sx={{
          fontWeight: 'bold',
          color: '#1e40af',
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          cursor: 'pointer',
        }}
      >
        QUIZKNOW
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
      {/* White Background Container */}
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: { xs: 1, sm: 2 },
          p: { xs: 1, sm: 2 },
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          maxWidth: '100%',
          width: 'auto',
        }}
      >
        {/* Letter Squares */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.15, sm: 0.25 },
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {letters.map((letter, index) => (
            <Box
              key={index}
              sx={{
                width: { xs: size * 0.5, sm: size * 0.7, md: size },
                height: { xs: size * 0.5, sm: size * 0.7, md: size },
                bgcolor: colors[index % 2],
                borderRadius: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: { xs: size * 0.2, sm: size * 0.3, md: size * 0.4 },
                fontWeight: 'bold',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.3)',
                  borderRadius: 0.5,
                  transform: 'translateY(1px)',
                  zIndex: -1,
                },
              }}
            >
              {letter}
            </Box>
          ))}
        </Box>

        {/* Logo Text */}
        {showText && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 'bold',
                color: '#1e40af',
                letterSpacing: { xs: 0.5, sm: 1 },
                mb: 0.5,
                fontSize: { xs: '1rem', sm: '1.5rem', md: '2.125rem' },
              }}
            >
              QUIZKNOW
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#059669',
                fontSize: { xs: '0.6rem', sm: '0.75rem', md: '0.9rem' },
                fontWeight: 500,
                lineHeight: 1.2,
                px: { xs: 0.5, sm: 0 },
              }}
            >
              Master Knowledge Through Interactive Quizzes
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default QuizKnowLogo;

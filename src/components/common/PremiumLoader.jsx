import React from 'react';
import { Box } from '@mui/material';

/**
 * PremiumLoader - A modern, high-end counter-rotating dual-ring loader
 * with pulse glow effects and custom dimensions.
 */
export default function PremiumLoader({ size = 20, sx = {} }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: size,
        height: size,
        verticalAlign: 'middle',
        ...sx
      }}
    >
      {/* Outer glowing animated ring */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: 'primary.main',
          borderBottomColor: 'secondary.main',
          animation: 'premium-spin 0.9s cubic-bezier(0.53, 0.21, 0.29, 0.67) infinite',
          '@keyframes premium-spin': {
            '0%': { transform: 'rotate(0deg) scale(1)' },
            '50%': { transform: 'rotate(180deg) scale(1.12)' },
            '100%': { transform: 'rotate(360deg) scale(1)' },
          },
          filter: 'drop-shadow(0px 0px 4px rgba(25, 118, 210, 0.65))',
        }}
      />
      {/* Inner counter-rotating ring */}
      <Box
        sx={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          border: '1.5px solid transparent',
          borderLeftColor: 'secondary.main',
          borderRightColor: 'primary.main',
          animation: 'premium-spin-reverse 0.7s linear infinite',
          '@keyframes premium-spin-reverse': {
            '0%': { transform: 'rotate(360deg)' },
            '100%': { transform: 'rotate(0deg)' },
          },
          opacity: 0.85,
        }}
      />
    </Box>
  );
}

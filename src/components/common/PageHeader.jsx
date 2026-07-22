import { Box, Typography, Stack } from '@mui/material';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: { xs: 'flex-start', sm: 'center' },
      justifyContent: 'space-between',
      flexDirection: { xs: 'column', sm: 'row' },
      gap: { xs: 1.5, sm: 0 },
      minHeight: 48,
      py: { xs: 1.5, sm: 1 },
      px: 0,
      mb: 0,
    }}>
      {/* Left — Title + subtitle */}
      <Box>
        <Typography variant="h6" fontWeight={700} letterSpacing="-0.02em" color="text.primary" sx={{ lineHeight: 1.25 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Right — action slot */}
      {actions && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
          {actions}
        </Stack>
      )}
    </Box>
  );
}

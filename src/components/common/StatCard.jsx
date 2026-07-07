import { Card, CardContent, Box, Typography, alpha, useTheme } from '@mui/material';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const COLOR_MAP = {
  primary:   { gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', glow: 'rgba(37,99,235,.25)' },
  secondary: { gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', glow: 'rgba(124,58,237,.25)' },
  success:   { gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)', glow: 'rgba(5,150,105,.25)' },
  warning:   { gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', glow: 'rgba(217,119,6,.25)' },
  error:     { gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', glow: 'rgba(220,38,38,.25)' },
  info:      { gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', glow: 'rgba(8,145,178,.25)' },
};

export default function StatCard({ title, value, icon: Icon, color = 'primary', trend, trendLabel, onClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const palette = theme.palette[color];
  const colorDef = COLOR_MAP[color] || COLOR_MAP.primary;
  const mainColor = palette?.main || '#2563eb';

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-3px)',
              boxShadow: `0 12px 24px -4px ${colorDef.glow}, 0 8px 16px -4px rgba(15,23,42,.06)`,
            }
          : {},
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          borderRadius: '0 0 0 80px',
          background: alpha(mainColor, isDark ? 0.1 : 0.06),
        },
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          '&:last-child': { pb: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          height: '100%',
        }}
      >
        {/* Top row: icon + title */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: colorDef.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 12px ${colorDef.glow}`,
            }}
          >
            <Icon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={500}
            textAlign="right"
            sx={{ flex: 1, mt: 0.25, lineHeight: 1.3 }}
          >
            {title}
          </Typography>
        </Box>

        {/* Value */}
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            color="text.primary"
            letterSpacing="-0.03em"
            sx={{ lineHeight: 1 }}
          >
            {value}
          </Typography>

          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: alpha(trend >= 0 ? '#059669' : '#dc2626', isDark ? 0.18 : 0.1),
                }}
              >
                {trend >= 0
                  ? <TrendingUpIcon sx={{ fontSize: 13, color: 'success.main' }} />
                  : <TrendingDownIcon sx={{ fontSize: 13, color: 'error.main' }} />}
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={trend >= 0 ? 'success.main' : 'error.main'}
                  fontSize="0.7rem"
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
              {trendLabel && (
                <Typography variant="caption" color="text.disabled" fontSize="0.7rem">
                  {trendLabel}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

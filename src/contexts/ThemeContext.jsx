import { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext(null);

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8', contrastText: '#fff' },
      secondary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6', contrastText: '#fff' },
      success:  { main: '#059669', light: '#34d399', dark: '#047857', contrastText: '#fff' },
      warning:  { main: '#d97706', light: '#fbbf24', dark: '#b45309', contrastText: '#fff' },
      error:    { main: '#dc2626', light: '#f87171', dark: '#b91c1c', contrastText: '#fff' },
      info:     { main: '#0891b2', light: '#22d3ee', dark: '#0e7490', contrastText: '#fff' },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f8fafc',
        paper:   mode === 'dark' ? '#1e293b' : '#ffffff',
      },
      text: {
        primary:   mode === 'dark' ? '#f1f5f9' : '#0f172a',
        secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
        disabled:  mode === 'dark' ? '#475569' : '#cbd5e1',
      },
      divider: mode === 'dark' ? 'rgba(148,163,184,.12)' : 'rgba(15,23,42,.08)',
      action: {
        hover:    mode === 'dark' ? 'rgba(241,245,249,.06)' : 'rgba(15,23,42,.04)',
        selected: mode === 'dark' ? 'rgba(37,99,235,.18)'  : 'rgba(37,99,235,.08)',
      },
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body1:  { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2:  { fontSize: '0.875rem',  lineHeight: 1.5 },
      caption:{ fontSize: '0.75rem',   lineHeight: 1.4 },
      button: { fontWeight: 600, letterSpacing: 0 },
    },
    shape: { borderRadius: 10 },
    shadows: [
      'none',
      mode === 'dark'
        ? '0 1px 2px 0 rgba(0,0,0,.4)'
        : '0 1px 2px 0 rgba(15,23,42,.05)',
      mode === 'dark'
        ? '0 1px 3px 0 rgba(0,0,0,.4), 0 1px 2px -1px rgba(0,0,0,.3)'
        : '0 1px 3px 0 rgba(15,23,42,.08), 0 1px 2px -1px rgba(15,23,42,.06)',
      mode === 'dark'
        ? '0 4px 6px -1px rgba(0,0,0,.4), 0 2px 4px -2px rgba(0,0,0,.3)'
        : '0 4px 6px -1px rgba(15,23,42,.07), 0 2px 4px -2px rgba(15,23,42,.05)',
      mode === 'dark'
        ? '0 10px 15px -3px rgba(0,0,0,.4), 0 4px 6px -4px rgba(0,0,0,.3)'
        : '0 10px 15px -3px rgba(15,23,42,.07), 0 4px 6px -4px rgba(15,23,42,.04)',
      mode === 'dark'
        ? '0 20px 25px -5px rgba(0,0,0,.4), 0 8px 10px -6px rgba(0,0,0,.3)'
        : '0 20px 25px -5px rgba(15,23,42,.07), 0 8px 10px -6px rgba(15,23,42,.04)',
      ...Array(19).fill('none'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { scrollbarWidth: 'thin', scrollbarColor: mode === 'dark' ? '#334155 transparent' : '#cbd5e1 transparent' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: mode === 'dark'
              ? '0 1px 3px 0 rgba(0,0,0,.3), 0 0 0 1px rgba(148,163,184,.08)'
              : '0 1px 3px 0 rgba(15,23,42,.07), 0 0 0 1px rgba(15,23,42,.05)',
            borderRadius: 12,
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          elevation1: {
            boxShadow: mode === 'dark'
              ? '0 1px 3px 0 rgba(0,0,0,.3), 0 0 0 1px rgba(148,163,184,.08)'
              : '0 1px 3px 0 rgba(15,23,42,.07), 0 0 0 1px rgba(15,23,42,.04)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            lineHeight: 1.5,
            padding: '8px 16px',
            minHeight: 36,
          },
          sizeSmall:  { padding: '5px 12px', fontSize: '0.8125rem', minHeight: 32 },
          sizeLarge:  { padding: '11px 24px', fontSize: '0.9375rem', minHeight: 44 },
          containedPrimary: {
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '0 1px 2px 0 rgba(37,99,235,.3)',
            '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)', boxShadow: '0 4px 6px -1px rgba(37,99,235,.3)' },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 8, transition: 'all 0.15s ease', '&:hover': { transform: 'scale(1.05)' } },
          sizeSmall: { padding: 6 },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'box-shadow 0.15s ease',
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: mode === 'dark' ? '#475569' : '#94a3b8' },
              '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(37,99,235,.15)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb', borderWidth: 1.5 },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: { outlined: { borderRadius: 8 } },
      },
      MuiInputBase: {
        styleOverrides: {
          root: { fontSize: '0.875rem' },
          input: { '&::placeholder': { color: mode === 'dark' ? '#64748b' : '#94a3b8', opacity: 1 } },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, fontSize: '0.75rem', borderRadius: 6 },
          sizeSmall: { height: 22, fontSize: '0.7rem' },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: mode === 'dark' ? '#94a3b8' : '#64748b',
              backgroundColor: mode === 'dark' ? '#1e293b' : '#f8fafc',
              borderBottom: `2px solid ${mode === 'dark' ? 'rgba(148,163,184,.1)' : 'rgba(15,23,42,.08)'}`,
              padding: '10px 16px',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(148,163,184,.06)' : 'rgba(15,23,42,.05)'}`,
            fontSize: '0.875rem',
            padding: '12px 16px',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child .MuiTableCell-root': { borderBottom: 0 },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16, backgroundImage: 'none' },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontSize: '1.0625rem', fontWeight: 700, padding: '20px 24px 16px' },
        },
      },
      MuiDialogContent: {
        styleOverrides: { root: { padding: '20px 24px' } },
      },
      MuiDialogActions: {
        styleOverrides: { root: { padding: '16px 24px' } },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: '12px !important',
            '&:before': { display: 'none' },
            boxShadow: 'none',
            border: `1px solid ${mode === 'dark' ? 'rgba(148,163,184,.12)' : 'rgba(15,23,42,.08)'}`,
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: { root: { padding: '0 20px', minHeight: 52 } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 6, fontSize: '0.75rem', fontWeight: 500 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { borderRadius: 12, boxShadow: '0 10px 40px -4px rgba(15,23,42,.15), 0 4px 6px -2px rgba(15,23,42,.08)', border: `1px solid ${mode === 'dark' ? 'rgba(148,163,184,.1)' : 'rgba(15,23,42,.06)'}` },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { borderRadius: 6, mx: 0.5, fontSize: '0.875rem', minHeight: 40 },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundImage: 'none' },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 10, fontSize: '0.875rem' } },
      },
      MuiSwitch: {
        styleOverrides: { root: { '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { opacity: 0.9 } } },
      },
      MuiBreadcrumbs: {
        styleOverrides: { root: { fontSize: '0.8125rem' } },
      },
      MuiAvatar: {
        styleOverrides: { root: { fontWeight: 700 } },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: { fontSize: '0.8125rem' },
          selectLabel: { fontSize: '0.8125rem' },
          displayedRows: { fontSize: '0.8125rem' },
        },
      },
    },
  });

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('pms_theme') || 'light');

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('pms_theme', next);
      return next;
    });
  };

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

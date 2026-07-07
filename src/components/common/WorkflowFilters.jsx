import React, { useState, useEffect } from 'react';
import {
  Box, TextField, MenuItem, IconButton, Tooltip, InputAdornment, useTheme, useMediaQuery,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

export const defaultFilters = {
  indentNumber: '',
  itemName:     '',
  partyName:    '',
  companyName:  '',
  status:       '',
  dateFrom:     '',
  dateTo:       '',
};

const INPUT_SX = {
  '& .MuiOutlinedInput-root': {
    height: 38,
    borderRadius: '8px',
    fontSize: '0.8rem',
    bgcolor: 'background.paper',
  },
  '& .MuiOutlinedInput-input': { py: 0, fontSize: '0.8rem' },
  '& .MuiInputLabel-root':     { fontSize: '0.78rem', top: '-1px' },
  '& .MuiInputLabel-shrink':   { top: 0 },
};

export default function WorkflowFilters({ appliedFilters, onApply, onReset }) {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [filters, setFilters] = useState(defaultFilters);
  useEffect(() => { setFilters(appliedFilters); }, [appliedFilters]);

  const fi = (key) => (e) => {
    const next = { ...filters, [key]: e.target.value };
    setFilters(next);
    onApply(next);
  };

  const handleReset = () => { setFilters(defaultFilters); onReset(); };
  const hasActiveFilter = Object.values(filters).some(Boolean);

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: isMobile
        ? '1fr 1fr'
        : 'minmax(160px,1fr) 130px 130px 130px minmax(120px,1fr) minmax(120px,1fr) auto',
      gap: 1,
      px: { xs: 1.5, sm: 2 },
      py: 1.25,
      mb: 1,
      border: 1,
      borderColor: 'divider',
      borderRadius: '12px',
      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
      alignItems: 'center',
    }}>
      {/* Search — spans 2 cols on mobile */}
      <TextField
        size="small" placeholder="Search records..."
        value={filters.indentNumber} onChange={fi('indentNumber')}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 15, color: 'text.disabled' }} /></InputAdornment> }}
        sx={{ ...INPUT_SX, gridColumn: isMobile ? '1 / -1' : 'auto' }}
      />

      {/* Status */}
      <TextField select size="small" label="Status"
        value={filters.status} onChange={fi('status')}
        sx={{ ...INPUT_SX }}>
        <MenuItem value="">All</MenuItem>
        <MenuItem value="Pending Approval">Pending Approval</MenuItem>
        <MenuItem value="In Progress">In Progress</MenuItem>
        <MenuItem value="Fully Completed">Fully Completed</MenuItem>
      </TextField>

      {/* From Date */}
      <TextField size="small" type="date" label="From"
        value={filters.dateFrom} onChange={fi('dateFrom')}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ ...INPUT_SX }}
      />

      {/* To Date */}
      <TextField size="small" type="date" label="To"
        value={filters.dateTo} onChange={fi('dateTo')}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ ...INPUT_SX }}
      />

      {/* Supplier */}
      <TextField size="small" label="Supplier"
        value={filters.partyName} onChange={fi('partyName')}
        sx={{ ...INPUT_SX }}
      />

      {/* Company */}
      <TextField size="small" label="Company"
        value={filters.companyName} onChange={fi('companyName')}
        sx={{ ...INPUT_SX }}
      />

      {/* Reset — spans 2 cols on mobile, aligns right */}
      <Box sx={{ gridColumn: isMobile ? '1 / -1' : 'auto', display: 'flex', justifyContent: isMobile ? 'flex-end' : 'center' }}>
        <Tooltip title="Reset Filters" arrow>
          <IconButton size="small" onClick={handleReset} sx={{
            width: 34, height: 34, borderRadius: '8px', border: 1,
            borderColor: hasActiveFilter ? 'error.300' : 'divider',
            color: hasActiveFilter ? 'error.main' : 'text.secondary',
            bgcolor: hasActiveFilter ? (isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)') : 'transparent',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', borderColor: 'error.main', color: 'error.main' },
            transition: 'all 0.2s ease',
          }}>
            <FilterAltOffIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

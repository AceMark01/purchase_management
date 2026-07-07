import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

export default function WorkflowTabs({ tabValue, onChange, pendingCount, historyCount }) {
  const pendingLabel = pendingCount !== undefined ? `Pending (${pendingCount})` : 'Pending';
  const historyLabel = historyCount !== undefined ? `History (${historyCount})` : 'History';

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1, mt: 0.5 }}>
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => onChange(newValue)}
        aria-label="workflow tabs"
        sx={{
          minHeight: 36,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            minHeight: 36,
            py: 0.5,
            px: 2,
            marginRight: 2,
          },
        }}
      >
        <Tab label={pendingLabel} />
        <Tab label={historyLabel} />
      </Tabs>
    </Box>
  );
}

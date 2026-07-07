import { Box, Typography, Button } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
      <BlockIcon sx={{ fontSize: 80, color: 'error.light' }} />
      <Typography variant="h4" fontWeight={700}>Access Denied</Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={400}>
        You don't have permission to access this page. Contact your administrator.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </Box>
  );
}

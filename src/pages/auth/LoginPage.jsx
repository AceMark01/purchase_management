import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, Divider, alpha, useTheme,
} from '@mui/material';
import EmailIcon              from '@mui/icons-material/Email';
import LockIcon               from '@mui/icons-material/Lock';
import VisibilityIcon         from '@mui/icons-material/Visibility';
import VisibilityOffIcon      from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon             from '@mui/icons-material/Person';
import { useAuth }            from '../../contexts/AuthContext';


export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const theme    = useTheme();
  const [showPwd, setShowPwd] = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Controller-based form — gives MUI full access to value so the floating label
  // tracks correctly even after programmatic setValue() calls.
  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { username: '', password: '' },
  });

  if (user) { navigate('/dashboard'); return null; }

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    const result = await login(data.username, data.password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.message);
  };


  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 8px 40px rgba(0,0,0,.08)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>

          {/* ── Header ── */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 52, height: 52, borderRadius: 2.5,
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
                boxShadow: '0 6px 20px rgba(37,99,235,.3)',
              }}
            >
              <AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: 26 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" mb={0.5}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your PMS account
            </Typography>
          </Box>

          {/* ── Error ── */}
          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Username — Controller keeps value in React state so MUI label floats correctly */}
              <Controller
                name="username"
                control={control}
                rules={{
                  required: 'Username is required',
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Username"
                    type="text"
                    autoComplete="username"
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              {/* Password — Controller keeps value in React state so MUI label floats correctly */}
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Password is required',
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small" edge="end" sx={{ mr: -0.5 }}
                            onClick={() => setShowPwd((v) => !v)}
                          >
                            {showPwd
                              ? <VisibilityOffIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                              : <VisibilityIcon   sx={{ fontSize: 18, color: 'text.disabled' }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Button
                fullWidth variant="contained" size="large" type="submit"
                disabled={loading}
                sx={{ py: 1.375, fontSize: '0.9375rem', mt: 0.5 }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </Box>
          </form>


          {/* ── Demo credentials ── */}
          <Box
            sx={{
              mt: 2.5, p: 1.75, borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.06),
              border: 1, borderColor: alpha(theme.palette.info.main, 0.18),
            }}
          >
            <Typography variant="caption" fontWeight={700} color="info.main" display="block" mb={0.75} letterSpacing="0.04em" textTransform="uppercase">
              Demo Credentials
            </Typography>
            {[
              ['Admin', 'admin / admin123'],
              ['User',  'user / user123'],
            ].map(([role, cred]) => (
              <Box key={role} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" color="text.secondary">{role}:</Typography>
                <Typography variant="caption" fontFamily="monospace" color="text.primary">{cred}</Typography>
              </Box>
            ))}
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
}

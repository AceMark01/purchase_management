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

const QUICK = [
  { label: 'Admin Access', sub: 'Full system access', icon: AdminPanelSettingsIcon, email: 'admin@pms.com', password: 'admin123', gradient: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
  { label: 'User Access',  sub: 'Standard access',   icon: PersonIcon,             email: 'user@pms.com',  password: 'user123',  gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)' },
];

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
    defaultValues: { email: '', password: '' },
  });

  if (user) { navigate('/dashboard'); return null; }

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 500));
    const result = login(data.email, data.password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.message);
  };

  // Fills email + password only — no layout change, no extra render
  const fill = (cred) => {
    setValue('email',    cred.email,    { shouldValidate: false, shouldDirty: true });
    setValue('password', cred.password, { shouldValidate: false, shouldDirty: true });
    setError('');
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

              {/* Email — Controller keeps value in React state so MUI label floats correctly */}
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
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
                  minLength: { value: 6, message: 'Minimum 6 characters' },
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

          {/* ── Quick Access ── */}
          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={600} letterSpacing="0.06em" textTransform="uppercase">
              Quick Access
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {QUICK.map((q) => (
              <Box
                key={q.label}
                onClick={() => fill(q)}
                sx={{
                  flex: 1, p: 1.5, borderRadius: 2,
                  border: 1, borderColor: 'divider',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column', gap: 0.5,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 28, height: 28, borderRadius: 1.5,
                    background: q.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                  }}
                >
                  <q.icon sx={{ fontSize: 16, color: '#fff' }} />
                </Box>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{q.label}</Typography>
                <Typography variant="caption" color="text.secondary">{q.sub}</Typography>
              </Box>
            ))}
          </Box>

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
              ['Admin', 'admin@pms.com / admin123'],
              ['User',  'user@pms.com / user123'],
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

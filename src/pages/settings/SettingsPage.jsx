import { useState } from 'react';
import {
  Box, Card, CardContent, CardHeader, Grid, Switch, FormControlLabel,
  Typography, Divider, Button, Chip, Stack, Alert, Table, TableBody,
  TableCell, TableHead, TableRow, Paper, Checkbox, FormGroup,
} from '@mui/material';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';

const PAGES = [
  { key: 'dashboard', label: 'Dashboard', required: true },
  { key: 'indent', label: 'Indent Management' },
  { key: 'purchaseOrder', label: 'Generate PO' },
  { key: 'followUp', label: 'Follow-Up' },
  { key: 'logistics', label: 'Arrange Logistics' },
  { key: 'lifting', label: 'Get Lifting' },
  { key: 'receiveMaterial', label: 'Receive Material' },
  { key: 'liftReceiver', label: 'Lift Receiver Material' },
  { key: 'tallyEntry', label: 'Tally Entry' },
  { key: 'reports', label: 'Reports' },
  { key: 'userManagement', label: 'User Management' },
  { key: 'settings', label: 'Settings' },
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'export', 'print'];
const ROLES = ['admin', 'user'];

const defaultPermissions = {
  admin: { pages: PAGES.map((p) => p.key), actions: Object.fromEntries(ACTIONS.map((a) => [a, true])) },
  user: { pages: ['dashboard', 'indent', 'purchaseOrder', 'followUp', 'logistics', 'lifting', 'receiveMaterial', 'liftReceiver', 'tallyEntry'], actions: { create: true, read: true, update: true, delete: false, export: true, print: true } },
};

export default function SettingsPage() {
  const [perms, setPerms] = useState(() => {
    try { const s = localStorage.getItem('pms_settings_perms'); return s ? JSON.parse(s) : defaultPermissions; }
    catch { return defaultPermissions; }
  });
  const [activeRole, setActiveRole] = useState('admin');

  const togglePage = (page) => {
    if (page === 'dashboard') return;
    setPerms((prev) => {
      const pages = prev[activeRole].pages.includes(page)
        ? prev[activeRole].pages.filter((p) => p !== page)
        : [...prev[activeRole].pages, page];
      return { ...prev, [activeRole]: { ...prev[activeRole], pages } };
    });
  };

  const toggleAction = (action) => {
    setPerms((prev) => ({
      ...prev,
      [activeRole]: { ...prev[activeRole], actions: { ...prev[activeRole].actions, [action]: !prev[activeRole].actions[action] } },
    }));
  };

  const save = () => {
    localStorage.setItem('pms_settings_perms', JSON.stringify(perms));
    toast.success('Permissions saved successfully!');
  };

  const reset = () => { setPerms(defaultPermissions); toast.info('Permissions reset to defaults!'); };

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Manage role-based access permissions"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={reset}>Reset Defaults</Button>
            <Button variant="contained" onClick={save}>Save Settings</Button>
          </Stack>
        }
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure page access and action permissions for each role. Changes will apply to new sessions.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Page Access Permissions"
              subheader="Control which pages each role can access"
              action={
                <Stack direction="row" spacing={1}>
                  {ROLES.map((r) => (
                    <Chip key={r} label={r.toUpperCase()} clickable color={activeRole === r ? 'primary' : 'default'}
                      onClick={() => setActiveRole(r)} />
                  ))}
                </Stack>
              }
            />
            <Divider />
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Role: <strong>{activeRole.toUpperCase()}</strong>
              </Typography>
              <Paper variant="outlined" sx={{ borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Page</TableCell>
                      <TableCell align="center">Access</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PAGES.map((page) => (
                      <TableRow key={page.key} hover>
                        <TableCell>
                          <Typography variant="body2">{page.label}</Typography>
                          {page.required && <Chip label="Required" size="small" sx={{ ml: 1, height: 16, fontSize: '0.65rem' }} />}
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={perms[activeRole]?.pages?.includes(page.key) ?? false}
                            onChange={() => togglePage(page.key)}
                            disabled={page.required}
                            size="small"
                            color="success"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Action Permissions" subheader={`For role: ${activeRole.toUpperCase()}`} />
            <Divider />
            <CardContent>
              <FormGroup>
                {ACTIONS.map((action) => (
                  <FormControlLabel
                    key={action}
                    control={
                      <Checkbox
                        checked={perms[activeRole]?.actions?.[action] ?? false}
                        onChange={() => toggleAction(action)}
                        color="primary"
                      />
                    }
                    label={<Typography variant="body2" textTransform="capitalize">{action}</Typography>}
                  />
                ))}
              </FormGroup>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardHeader title="Permission Summary" />
            <Divider />
            <CardContent>
              {ROLES.map((role) => (
                <Box key={role} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color={role === 'admin' ? 'primary' : 'text.primary'}>
                    {role.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pages: {perms[role]?.pages?.length || 0} / {PAGES.length}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {ACTIONS.map((a) => (
                      <Chip key={a} label={a} size="small" color={perms[role]?.actions?.[a] ? 'success' : 'default'}
                        variant={perms[role]?.actions?.[a] ? 'filled' : 'outlined'} sx={{ height: 18, fontSize: '0.65rem' }} />
                    ))}
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

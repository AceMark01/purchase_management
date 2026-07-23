import { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, MenuItem, Chip, Divider, Checkbox, FormControlLabel, IconButton, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { EditBtn, DeleteBtn } from '../../components/common/ActionButtons';
import { toast } from 'react-toastify';
import { useData } from '../../contexts/DataContext';
import { gasApi } from '../../services/gasApi';
import PremiumLoader from '../../components/common/PremiumLoader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';

const ROLES = ['admin', 'user'];

const PAGES = [
  { key: 'dashboard',       label: 'Dashboard' },
  { key: 'indent',          label: 'Indent Management' },
  { key: 'purchaseOrder',   label: 'Generate Purchase PO' },
  { key: 'approvalPO',      label: 'Approval Purchase PO' },
  { key: 'sendPO',          label: 'Send PO To Party' },
  { key: 'followUp',        label: 'Follow-Up' },
  { key: 'logistics',       label: 'Arrange Logistics & Get Lifting' },
  { key: 'receiveMaterial', label: 'Receive Material' },
  { key: 'liftReceiver',    label: 'Lift Receiver Material' },
  { key: 'tallyEntry',      label: 'Tally Entry' },
  { key: 'orderCancel',     label: 'Order Cancel' },
  { key: 'whatsapp',        label: 'WhatsApp Form' },
  { key: 'master',          label: 'Company Master' },
  { key: 'productData',     label: 'Product Data' },
  { key: 'vendors',         label: 'Vendor' },
  { key: 'settings',        label: 'Settings' },
];

function PasswordCell({ password }) {
  const [show, setShow] = useState(false);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
        {show ? password : '••••••'}
      </Typography>
      <IconButton size="small" onClick={() => setShow(!show)}>
        {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
      </IconButton>
    </Box>
  );
}

const COLUMNS = [
  { key: 'name', label: 'Full Name', minWidth: 140 },
  { key: 'email', label: 'Username', minWidth: 180 },
  { key: 'password', label: 'Password', minWidth: 140, render: (v) => <PasswordCell password={v} /> },
  { key: 'role', label: 'Role', minWidth: 90, render: (v) => <Chip label={v?.toUpperCase()} size="small" color={v === 'admin' ? 'primary' : 'default'} /> },
  {
    key: 'pageAccess',
    label: 'Page Access',
    minWidth: 200,
    render: (v) => {
      if (!v) return '-';
      if (String(v).toUpperCase() === 'ALL') return 'ALL';
      return String(v).split(',').map(key => {
        const page = PAGES.find(p => p.key === key.trim());
        return page ? page.label : key.trim();
      }).join(', ');
    }
  },
];

function UserForm({ open, onClose, editItem, onSave }) {
  const [submitting, setSubmitting] = useState(false);
  const getInitialPages = useCallback(() => {
    const acc = {};
    PAGES.forEach(p => {
      acc[p.key] = false;
    });

    if (editItem) {
      const pa = String(editItem.pageAccess || '').trim();
      if (pa.toUpperCase() === 'ALL') {
        PAGES.forEach(p => {
          acc[p.key] = true;
        });
      } else if (pa) {
        pa.split(',').forEach(k => {
          const key = k.trim();
          if (acc[key] !== undefined) {
            acc[key] = true;
          }
        });
      }
    }
    return acc;
  }, [editItem]);

  const [selectedPages, setSelectedPages] = useState(getInitialPages);
  const [showFormPwd, setShowFormPwd] = useState(false);
  const [pageError, setPageError] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: editItem || { name: '', email: '', password: '', role: 'user' },
  });

  useEffect(() => {
    if (open) {
      setSelectedPages(getInitialPages());
      setPageError('');
      reset(editItem || { name: '', email: '', password: '', role: 'user' });
    }
  }, [editItem, open, getInitialPages, reset]);

  const onSubmit = async (data) => {
    const selectedKeys = Object.keys(selectedPages).filter(k => selectedPages[k]);
    if (selectedKeys.length === 0) {
      setPageError('Required – select at least one');
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        ...data,
        selectedPages: selectedKeys
      });
      reset();
      onClose();
    } catch (err) {
      // Handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  const allChecked = PAGES.every(p => selectedPages[p.key]);
  const handleAllChange = (e) => {
    const checked = e.target.checked;
    setSelectedPages(prev => {
      const next = {};
      PAGES.forEach(p => {
        next[p.key] = checked;
      });
      if (checked) setPageError('');
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>{editItem ? 'Edit User' : 'Create User'}</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Full Name"
                disabled={submitting}
                {...register('name', { required: true })}
                error={!!errors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Username"
                disabled={submitting}
                {...register('email', { required: true })}
                error={!!errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Password"
                type={showFormPwd ? 'text' : 'password'}
                disabled={submitting}
                {...register('password', { required: true })}
                error={!!errors.password}
                InputProps={{
                  endAdornment: (
                    <IconButton size="small" onClick={() => setShowFormPwd(!showFormPwd)} disabled={submitting}>
                      {showFormPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="role"
                control={control}
                render={({ field: f }) => (
                  <TextField {...f} select fullWidth size="small" label="Role" disabled={submitting}>
                    {ROLES.map((r) => <MenuItem key={r} value={r}>{r.toUpperCase()}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                PAGE ACCESS * {pageError && <span style={{ color: 'red', fontSize: '0.75rem', marginLeft: '8px' }}>{pageError}</span>}
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allChecked}
                        indeterminate={!allChecked && PAGES.some(p => selectedPages[p.key])}
                        onChange={handleAllChange}
                        size="small"
                        disabled={submitting}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>ALL</Typography>}
                  />
                </Grid>
                {PAGES.map((page) => (
                  <Grid item xs={12} sm={6} key={page.key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedPages[page.key] || false}
                          disabled={submitting}
                          onChange={(e) => {
                            setSelectedPages(prev => {
                              const next = { ...prev, [page.key]: e.target.checked };
                              if (Object.values(next).some(v => v)) {
                                setPageError('');
                              }
                              return next;
                            });
                          }}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{page.label}</Typography>}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <PremiumLoader size={16} /> : null}>
            {submitting ? 'Saving...' : (editItem ? 'Update' : 'Create') + ' User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function SettingsPage() {
  const { users: items = [], refresh, updateRow } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleSave = async (data) => {
    const isEdit = !!selected;
    try {
      let result;
      const isAllSelected = data.selectedPages.length === PAGES.length;
      const pageAccessStr = isAllSelected ? 'ALL' : data.selectedPages.join(',');

      const payload = {
        "FULLNAME": data.name,
        "USERNAME": data.email,
        "PASSWORD": data.password,
        "ROLE": String(data.role || "user").toUpperCase(),
        "PAGE-ACCESS": pageAccessStr,
      };

      if (isEdit) {
        await updateRow('users', selected._row, payload, false);
        result = { success: true };
      } else {
        const rowValues = [
          payload["FULLNAME"],
          payload["USERNAME"],
          payload["PASSWORD"],
          payload["ROLE"],
          payload["PAGE-ACCESS"]
        ];
        result = await gasApi.insertInColumns("LOGIN", 1, rowValues, 1);
      }

      if (result.success) {
        toast.success(isEdit ? 'User updated!' : 'User created!');
        await refresh(['users'], false);
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save user.");
      throw err; // propagates to onSubmit finally to stop dismiss on error
    }
  };

  const handleDelete = async () => {
    try {
      const result = await gasApi.deleteRow("LOGIN", selected._row);
      if (result.success) {
        toast.success('User deleted!');
        await refresh(['users'], false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setDeleteOpen(false);
      setSelected(null);
    }
  };

  const actions = useCallback((row) => [
    <EditBtn key="edit" onClick={() => { setSelected(row); setFormOpen(true); }} />,
    <DeleteBtn key="delete" onClick={() => { setSelected(row); setDeleteOpen(true); }} />,
  ], []);

  return (
    <Box>
      <PageHeader title="Settings" subtitle={`${items.length} users`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelected(null); setFormOpen(true); }}>Create User</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} title="Users" searchKey={['name', 'email']} actions={actions} hideIndexColumn />
      {formOpen && (
        <UserForm open={formOpen} onClose={() => { setFormOpen(false); setSelected(null); }} editItem={selected} onSave={handleSave} />
      )}
      <ConfirmDialog open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} message={`Delete user "${selected?.name}"?`} />
    </Box>
  );
}

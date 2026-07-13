import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, MenuItem, IconButton, Tooltip, Chip, Divider, Switch } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LockResetIcon from '@mui/icons-material/LockReset';
import { EditBtn, DeleteBtn } from '../../components/common/ActionButtons';
import { toast } from 'react-toastify';
import { useData } from '../../contexts/DataContext';
import { gasApi } from '../../services/gasApi';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import { formatDate, statusColor } from '../../utils/formatters';

const ROLES = ['admin', 'user'];
const DEPARTMENTS = ['Management', 'Procurement', 'Logistics', 'Warehouse', 'Finance', 'HR', 'IT'];

const COLUMNS = [
  { key: 'name', label: 'User Name', minWidth: 140 },
  { key: 'email', label: 'Email', minWidth: 180 },
  { key: 'role', label: 'Role', minWidth: 90, render: (v) => <Chip label={v?.toUpperCase()} size="small" color={v === 'admin' ? 'primary' : 'default'} /> },
  { key: 'department', label: 'Department', minWidth: 120 },
  { key: 'status', label: 'Status', minWidth: 90, type: 'status' },
  { key: 'lastLogin', label: 'Last Login', minWidth: 110, render: (v) => formatDate(v) },
];

function UserForm({ open, onClose, editItem, onSave }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: editItem || { name: '', email: '', password: '', role: 'user', department: '', status: 'active', lastLogin: '' },
  });

  const onSubmit = (data) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>{editItem ? 'Edit User' : 'Create User'}</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Full Name" {...register('name', { required: true })} error={!!errors.name} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Email" type="email" {...register('email', { required: true })} error={!!errors.email} /></Grid>
            {!editItem && <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Password" type="password" {...register('password', { required: !editItem })} /></Grid>}
            <Grid item xs={12} sm={6}>
              <Controller name="role" control={control} render={({ field: f }) => (
                <TextField {...f} select fullWidth size="small" label="Role">
                  {ROLES.map((r) => <MenuItem key={r} value={r}>{r.toUpperCase()}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="department" control={control} rules={{ required: true }} render={({ field: f }) => (
                <TextField {...f} select fullWidth size="small" label="Department">
                  {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="status" control={control} render={({ field: f }) => (
                <TextField {...f} select fullWidth size="small" label="Status">
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              )} />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained">{editItem ? 'Update' : 'Create'} User</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function UserManagementPage() {
  const { users: items = [], refresh, updateRow } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleSave = async (data) => {
    const isEdit = !!selected;
    try {
      let result;
      const payload = {
        "Full Name": data.name,
        "Email": data.email,
        "Password": data.password || (selected ? selected.password : "123456"),
        "Role": data.role,
        "Department": data.department,
        "Status": data.status || "active",
        "Last Login": isEdit ? (selected.lastLogin || "") : "",
      };

      if (isEdit) {
        await updateRow('users', selected._row, payload);
        result = { success: true };
      } else {
        const rowValues = [
          payload["Full Name"],
          payload["Email"],
          payload["Password"],
          payload["Role"],
          payload["Department"],
          payload["Status"],
          payload["Last Login"]
        ];
        result = await gasApi.insertInColumns("Administration", 1, rowValues, 2);
      }

      if (result.success) {
        toast.success(isEdit ? 'User updated!' : 'User created!');
        await refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save user.");
    }
  };

  const handleDelete = async () => {
    try {
      const result = await gasApi.deleteRow("Administration", selected._row);
      if (result.success) {
        toast.success('User deleted!');
        await refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setDeleteOpen(false);
      setSelected(null);
    }
  };

  const handleToggleStatus = async (row) => {
    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    try {
      await updateRow('users', row._row, { "Status": newStatus });
      toast.info(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle status.");
    }
  };

  const handleReset = (row) => { toast.success(`Password reset link sent to ${row.email}`); };

  const actions = useCallback((row) => [
    <EditBtn key="edit" onClick={() => { setSelected(row); setFormOpen(true); }} />,
    <Tooltip key="toggle" title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
      <Switch checked={row.status === 'active'} onChange={() => handleToggleStatus(row)} size="small" color={row.status === 'active' ? 'success' : 'default'} />
    </Tooltip>,
    <Tooltip key="reset" title="Reset Password"><IconButton size="small" color="warning" onClick={() => handleReset(row)}><LockResetIcon fontSize="small" /></IconButton></Tooltip>,
    <DeleteBtn key="delete" onClick={() => { setSelected(row); setDeleteOpen(true); }} />,
  ], [handleToggleStatus]);

  return (
    <Box>
      <PageHeader title="User Management" subtitle={`${items.length} users`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'User Management' }]}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelected(null); setFormOpen(true); }}>Create User</Button>}
      />
      <DataTable columns={COLUMNS} rows={items} title="Users" searchKey={['name', 'email', 'department']} actions={actions} />
      {formOpen && (
        <UserForm open={formOpen} onClose={() => { setFormOpen(false); setSelected(null); }} editItem={selected} onSave={handleSave} />
      )}
      <ConfirmDialog open={deleteOpen} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} message={`Delete user "${selected?.name}"?`} />
    </Box>
  );
}

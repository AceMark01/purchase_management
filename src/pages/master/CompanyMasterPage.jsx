import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, MenuItem, Typography, Divider, Chip, Stack,
  Card, CardContent, InputAdornment, IconButton, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, TableSortLabel, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BusinessIcon from '@mui/icons-material/Business';
import { toast } from 'react-toastify';
import { addCompany, updateCompany, deleteCompany } from '../../store/slices/companySlice';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, statusColor } from '../../utils/formatters';

const DEPARTMENTS = [
  'Procurement', 'Operations', 'Finance', 'HR', 'IT', 'Sales', 'Logistics', 'Admin', 'Legal', 'Management',
];

/* ── helpers ──────────────────────────────────────────────── */
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

/* ── Create / Edit Dialog ──────────────────────────────────── */
function CompanyForm({ open, onClose, editItem }) {
  const dispatch = useDispatch();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: editItem || {
      companyName: '', gstNumber: '', panNumber: '', email: '',
      phoneNumber: '', responsibleDepartment: '', responsiblePerson: '',
      companyAddress: '', billingAddress: '', destination: '', status: 'Active',
    },
  });

  const onSubmit = (data) => {
    if (editItem) {
      dispatch(updateCompany({ ...editItem, ...data }));
      toast.success('Company updated successfully!');
    } else {
      dispatch(addCompany(data));
      toast.success('Company created successfully!');
    }
    reset();
    onClose();
  };

  const F = ({ name, label, required = true, type = 'text', sm = 6 }) => (
    <Grid item xs={12} sm={sm}>
      <TextField
        fullWidth size="small" label={label} type={type}
        {...register(name, {
          required: required ? `${label} is required` : false,
          ...(name === 'email' ? { pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } } : {}),
          ...(name === 'gstNumber' ? { pattern: { value: /^[0-9A-Z]{15}$/, message: 'GST must be 15 alphanumeric chars' } } : {}),
          ...(name === 'panNumber' ? { pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format' } } : {}),
        })}
        error={!!errors[name]}
        helperText={errors[name]?.message}
      />
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
        {editItem ? 'Edit Company' : 'Create New Company'}
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {/* Row 1 */}
            <F name="companyName" label="Company Name" sm={12} />
            {/* Row 2 */}
            <F name="gstNumber" label="Company GST Number" sm={6} />
            <F name="panNumber" label="Company PAN Number" sm={6} />
            {/* Row 3 */}
            <F name="email" label="Company Email" type="email" sm={6} />
            <F name="phoneNumber" label="Company Phone Number" sm={6} />
            {/* Row 4 */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="responsibleDepartment"
                control={control}
                rules={{ required: 'Responsible Department is required' }}
                render={({ field }) => (
                  <TextField
                    {...field} select fullWidth size="small"
                    label="Responsible Department"
                    error={!!errors.responsibleDepartment}
                    helperText={errors.responsibleDepartment?.message}
                  >
                    {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
            <F name="responsiblePerson" label="Responsible Person Name" sm={6} />
            {/* Row 5 */}
            <F name="companyAddress" label="Company Address" sm={12} />
            <F name="billingAddress" label="Billing Address" sm={8} />
            <F name="destination" label="Destination" sm={4} />
            {/* Row 6 */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth size="small" label="Status">
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit">Cancel</Button>
          <Button type="submit" variant="contained">
            {editItem ? 'Update Company' : 'Create Company'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/* ── View Dialog ───────────────────────────────────────────── */
function ViewDialog({ open, onClose, item }) {
  if (!item) return null;
  const rows = [
    ['Company Name', item.companyName],
    ['GST Number', item.gstNumber],
    ['PAN Number', item.panNumber],
    ['Email', item.email],
    ['Phone Number', item.phoneNumber],
    ['Responsible Department', item.responsibleDepartment],
    ['Responsible Person', item.responsiblePerson],
    ['Company Address', item.companyAddress],
    ['Billing Address', item.billingAddress],
    ['Destination', item.destination],
    ['Status', item.status],
    ['Created Date', formatDate(item.createdDate)],
    ['Updated Date', formatDate(item.updatedDate)],
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Company Details — {item.companyName}</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={1.5}>
          {rows.map(([label, value]) => (
            <Grid item xs={12} sm={6} key={label}>
              <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
              {label === 'Status'
                ? <Chip label={value} size="small" color={value === 'Active' ? 'success' : 'default'} />
                : <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
              }
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
const TABLE_COLUMNS = [
  { id: 'companyName',      label: 'Company Name',       minWidth: 160 },
  { id: 'gstNumber',        label: 'GST Number',         minWidth: 160 },
  { id: 'panNumber',        label: 'PAN Number',         minWidth: 120 },
  { id: 'email',            label: 'Email',              minWidth: 170 },
  { id: 'phoneNumber',      label: 'Phone Number',       minWidth: 130 },
  { id: 'responsiblePerson',label: 'Responsible Person', minWidth: 150 },
  { id: 'destination',      label: 'Destination',        minWidth: 120 },
  { id: 'status',           label: 'Status',             minWidth: 100 },
  { id: 'createdDate',      label: 'Created Date',       minWidth: 120 },
];

export default function CompanyMasterPage() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.companies.items);

  const [formOpen,   setFormOpen]   = useState(false);
  const [viewOpen,   setViewOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [order,      setOrder]      = useState('asc');
  const [orderBy,    setOrderBy]    = useState('companyName');
  const [page,       setPage]       = useState(0);
  const [rowsPerPage,setRowsPerPage]= useState(10);

  const handleSort = (col) => {
    const isAsc = orderBy === col && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(col);
    setPage(0);
  };

  const filtered = useMemo(() =>
    items.filter((c) =>
      !search ||
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.gstNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.responsiblePerson.toLowerCase().includes(search.toLowerCase()) ||
      c.destination.toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

  const sorted = useMemo(() =>
    [...filtered].sort(getComparator(order, orderBy)),
    [filtered, order, orderBy]);

  const paginated = useMemo(() =>
    sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]);

  const handleDelete = () => {
    dispatch(deleteCompany(selected.id));
    toast.success('Company deleted successfully!');
    setDeleteOpen(false);
    setSelected(null);
  };

  return (
    <Box>
      <PageHeader
        title="Company Master"
        subtitle={`${filtered.length} companies`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Company Master' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelected(null); setFormOpen(true); }}>
            Create Company
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Search by name, GST, email, person, destination…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ maxWidth: 420, flex: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}><ClearIcon sx={{ fontSize: 16 }} /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <Typography variant="body2" color="text.secondary">{filtered.length} results</Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper} sx={{ borderRadius: 0 }} elevation={0}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'background.default', minWidth: 130 }}>Actions</TableCell>
                {TABLE_COLUMNS.map((col) => (
                  <TableCell
                    key={col.id}
                    sx={{ fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: col.minWidth, bgcolor: 'background.default' }}
                    sortDirection={orderBy === col.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TABLE_COLUMNS.length + 1} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                    <Stack sx={{ alignItems: 'center' }} spacing={1}>
                      <BusinessIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      <Typography variant="body2">No companies found</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : paginated.map((row) => (
                <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="View"><IconButton size="small" color="info" onClick={() => { setSelected(row); setViewOpen(true); }}><VisibilityIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => { setSelected(row); setFormOpen(true); }}><EditIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => { setSelected(row); setDeleteOpen(true); }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{row.companyName}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{row.gstNumber}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{row.panNumber}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>{row.email}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>{row.phoneNumber}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>{row.responsiblePerson}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>{row.destination}</TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color={row.status === 'Active' ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>{formatDate(row.createdDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {formOpen && (
        <CompanyForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setSelected(null); }}
          editItem={selected}
        />
      )}
      <ViewDialog open={viewOpen} onClose={() => { setViewOpen(false); setSelected(null); }} item={selected} />
      <ConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setSelected(null); }}
        message={`Delete company "${selected?.companyName}"? This action cannot be undone.`}
      />
    </Box>
  );
}

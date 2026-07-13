import { useState, useMemo } from 'react';
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
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useData } from '../../contexts/DataContext';
import { gasApi } from '../../services/gasApi';
import { formatDate } from '../../utils/formatters';

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
function VendorForm({ open, onClose, editItem, onSave }) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: editItem || {
      vendorName: '', gstNumber: '', email: '', phoneNumber: '',
      responsibility: '', contactPerson: '', vendorLocation: '', status: 'Active',
    },
  });

  const onSubmit = (data) => {
    onSave(data);
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
        })}
        error={!!errors[name]}
        helperText={errors[name]?.message}
      />
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
        {editItem ? 'Edit Vendor' : 'Create New Vendor'}
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {/* Row 1 */}
            <F name="vendorName" label="Vendor Name" sm={12} />
            {/* Row 2 */}
            <F name="gstNumber" label="GST Number" sm={6} />
            <F name="email" label="Email Address" type="email" sm={6} />
            {/* Row 3 */}
            <F name="phoneNumber" label="Phone Number" sm={6} />
            <F name="responsibility" label="Responsibility" sm={6} />
            {/* Row 4 */}
            <F name="contactPerson" label="Contact Person Name" sm={6} />
            <F name="vendorLocation" label="Vendor Location" sm={6} />
            {/* Row 5 */}
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
            {editItem ? 'Update Vendor' : 'Create Vendor'}
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
    ['Vendor Name', item.vendorName],
    ['GST Number', item.gstNumber],
    ['Email', item.email],
    ['Phone Number', item.phoneNumber],
    ['Responsibility', item.responsibility],
    ['Contact Person', item.contactPerson],
    ['Vendor Location', item.vendorLocation],
    ['Status', item.status],
    ['Created Date', formatDate(item.createdDate)],
    ['Updated Date', formatDate(item.updatedDate)],
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Vendor Details — {item.vendorName}</DialogTitle>
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
  { id: 'vendorName', label: 'Vendor Name', minWidth: 160 },
  { id: 'gstNumber', label: 'GST Number', minWidth: 160 },
  { id: 'email', label: 'Email', minWidth: 170 },
  { id: 'phoneNumber', label: 'Phone Number', minWidth: 130 },
  { id: 'contactPerson', label: 'Contact Person', minWidth: 140 },
  { id: 'vendorLocation', label: 'Vendor Location', minWidth: 140 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdDate', label: 'Created Date', minWidth: 120 },
];

export default function VendorMasterPage() {
  const { vendors: items = [], refresh, updateRow } = useData();

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('vendorName');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSort = (col) => {
    const isAsc = orderBy === col && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(col);
    setPage(0);
  };

  const filtered = useMemo(() =>
    items.filter((v) =>
      !search ||
      v.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      v.gstNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      v.vendorLocation.toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

  const sorted = useMemo(() =>
    [...filtered].sort(getComparator(order, orderBy)),
    [filtered, order, orderBy]);

  const paginated = useMemo(() =>
    sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]);

  const handleSave = async (data) => {
    const isEdit = !!selected;
    try {
      let result;
      const todayStr = formatDate(new Date());
      const payload = {
        "Vendor Name": data.vendorName,
        "GST Number": data.gstNumber,
        "Email Address": data.email,
        "Phone Number": data.phoneNumber,
        "Responsibility": data.responsibility,
        "Contact Person Name": data.contactPerson,
        "Vendor Location": data.vendorLocation,
        "Status": data.status,
        "Created Date": isEdit ? (selected.createdDate || todayStr) : todayStr,
        "Updated Date": todayStr,
      };

      if (isEdit) {
        await updateRow('vendors', selected._row, payload);
        result = { success: true };
      } else {
        const rowValues = [
          payload["Vendor Name"],
          payload["GST Number"],
          payload["Email Address"],
          payload["Phone Number"],
          payload["Responsibility"],
          payload["Contact Person Name"],
          payload["Vendor Location"],
          payload["Status"],
          payload["Created Date"],
          payload["Updated Date"]
        ];
        result = await gasApi.insertInColumns("Master Data", 26, rowValues, 2);
      }

      if (result.success) {
        toast.success(isEdit ? 'Vendor updated!' : 'Vendor created!');
        await refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save vendor.");
    }
  };

  const handleDelete = async () => {
    try {
      const result = await gasApi.deleteRowInColumns("Master Data", selected._row, 26, 10);
      if (result.success) {
        toast.success('Vendor deleted successfully!');
        await refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete vendor.");
    } finally {
      setDeleteOpen(false);
      setSelected(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Vendor / Supplier Master"
        subtitle={`${filtered.length} vendors`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Vendor Master' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelected(null); setFormOpen(true); }}>
            Create Vendor
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Search by name, GST, email, contact person, location…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ maxWidth: 440, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
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
                      <PeopleAltIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      <Typography variant="body2">No vendors found</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : paginated.map((row) => (
                <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="View">
                        <IconButton size="small" color="info" onClick={() => { setSelected(row); setViewOpen(true); }}>
                          <VisibilityIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => { setSelected(row); setFormOpen(true); }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => { setSelected(row); setDeleteOpen(true); }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{row.vendorName}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{row.gstNumber}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>{row.email}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>{row.phoneNumber}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>{row.contactPerson}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>{row.vendorLocation}</TableCell>
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
        <VendorForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setSelected(null); }}
          editItem={selected}
          onSave={handleSave}
        />
      )}
      <ViewDialog open={viewOpen} onClose={() => { setViewOpen(false); setSelected(null); }} item={selected} />
      <ConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setSelected(null); }}
        message={`Delete vendor "${selected?.vendorName}"? This action cannot be undone.`}
      />
    </Box>
  );
}

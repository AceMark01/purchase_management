import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, MenuItem, Typography, Divider, Chip, Stack,
  Card, CardContent, InputAdornment, IconButton, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, TableSortLabel, Paper, Skeleton, Menu, Checkbox, FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
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
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: editItem || {
      vendorName: '', contactPerson: '', phoneNumber: '', email: '',
      gstNumber: '', vendorLocation: '',
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
            <F name="vendorName" label="Vendor Name" sm={6} />
            <F name="contactPerson" label="Contact Person Name" sm={6} />
            {/* Row 2 */}
            <F name="phoneNumber" label="Phone Number" sm={6} />
            <F name="email" label="Email Address" type="email" sm={6} />
            {/* Row 3 */}
            <F name="gstNumber" label="GST Number" sm={6} />
            <F name="vendorLocation" label="Vendor Location" sm={6} />
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

/* ── Main Page ─────────────────────────────────────────────── */
const TABLE_COLUMNS = [
  { id: 'vendorId', label: 'Vendor ID', minWidth: 100 },
  { id: 'vendorName', label: 'Vendor Name', minWidth: 160 },
  { id: 'contactPerson', label: 'Contact Person Name', minWidth: 160 },
  { id: 'phoneNumber', label: 'Phone Number', minWidth: 130 },
  { id: 'email', label: 'Email Address', minWidth: 170 },
  { id: 'gstNumber', label: 'GST Number', minWidth: 160 },
  { id: 'vendorLocation', label: 'Vendor Location', minWidth: 160 },
];

export default function VendorMasterPage() {
  const { vendors: items = [], refresh, updateRow, loading } = useData();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('vendorName');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [visibleCols, setVisibleCols] = useState(() => new Set(TABLE_COLUMNS.map(c => c.id)));
  const [colMenuAnchor, setColMenuAnchor] = useState(null);

  const handleSort = (col) => {
    const isAsc = orderBy === col && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(col);
    setPage(0);
  };

  const filtered = useMemo(() =>
    items.filter((v) =>
      !search ||
      (v.vendorId || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.vendorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.gstNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.contactPerson || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.vendorLocation || '').toLowerCase().includes(search.toLowerCase())
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
      if (isEdit) {
        const payload = {
          "Vendor-ID": selected.vendorId,
          "Vendor Name": data.vendorName,
          "Contact Person Name": data.contactPerson,
          "Phone Number": data.phoneNumber,
          "Email Address": data.email,
          "GST Number": data.gstNumber,
          "Vendor Location": data.vendorLocation,
        };
        await updateRow('vendors', selected._row, payload);
        result = { success: true };
      } else {
        let nextId = "VI-001";
        if (items.length > 0) {
          const ids = items
            .map(item => {
              const match = String(item.vendorId || '').match(/VI-(\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(Boolean);
          const maxId = ids.length > 0 ? Math.max(...ids) : 0;
          nextId = `VI-${String(maxId + 1).padStart(3, '0')}`;
        }
        const rowValues = [
          nextId,
          data.vendorName,
          data.contactPerson,
          data.phoneNumber,
          data.email,
          data.gstNumber,
          data.vendorLocation
        ];
        result = await gasApi.insertInColumns("Master-Vendors", 1, rowValues, 1);
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
      const result = await gasApi.deleteRow("Master-Vendors", selected._row);
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
        title="Vendor Master"
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
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Toggle columns" arrow>
              <IconButton size="small" onClick={e => setColMenuAnchor(e.currentTarget)}
                sx={{ width: 30, height: 30, borderRadius: '8px', border: 1, borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ViewColumnIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={colMenuAnchor} open={Boolean(colMenuAnchor)} onClose={() => setColMenuAnchor(null)}
              PaperProps={{ sx: { minWidth: 180, py: 0.5 } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              disableScrollLock
            >
              <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.disabled', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Columns
              </Typography>
              {TABLE_COLUMNS.map((c) => (
                <MenuItem key={c.id} dense
                  onClick={() => setVisibleCols((prev) => { const next = new Set(prev); next.has(c.id) ? next.delete(c.id) : next.add(c.id); return next; })}
                  sx={{ py: 0.5, mx: 0.5, borderRadius: 1 }}
                >
                  <FormControlLabel
                    control={<Checkbox checked={visibleCols.has(c.id)} size="small" sx={{ py: 0 }} />}
                    label={<Typography variant="body2">{c.label}</Typography>}
                    sx={{ m: 0, width: '100%' }}
                  />
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper} sx={{ borderRadius: 0 }} elevation={0}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'background.default', minWidth: 130 }}>Actions</TableCell>
                {TABLE_COLUMNS.filter(col => visibleCols.has(col.id)).map((col) => (
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: visibleCols.size + 1 }).map((_, j) => (
                      <TableCell key={j}><Skeleton animation="wave" height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleCols.size + 1} align="center" sx={{ py: 4, color: 'text.disabled' }}>
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
                  {visibleCols.has('vendorId') && <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{row.vendorId}</TableCell>}
                  {visibleCols.has('vendorName') && <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{row.vendorName}</TableCell>}
                  {visibleCols.has('contactPerson') && <TableCell sx={{ fontSize: '0.78rem' }}>{row.contactPerson}</TableCell>}
                  {visibleCols.has('phoneNumber') && <TableCell sx={{ fontSize: '0.78rem' }}>{row.phoneNumber}</TableCell>}
                  {visibleCols.has('email') && <TableCell sx={{ fontSize: '0.78rem' }}>{row.email}</TableCell>}
                  {visibleCols.has('gstNumber') && <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{row.gstNumber}</TableCell>}
                  {visibleCols.has('vendorLocation') && <TableCell sx={{ fontSize: '0.78rem' }}>{row.vendorLocation}</TableCell>}
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
      <ConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setSelected(null); }}
        message={`Delete vendor "${selected?.vendorName}"? This action cannot be undone.`}
      />
    </Box>
  );
}

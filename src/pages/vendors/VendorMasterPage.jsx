import { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, InputAdornment, IconButton, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TablePagination, TableSortLabel, Paper, Skeleton, Menu, Checkbox, FormControlLabel, Stack, TextField, MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import PageHeader from '../../components/common/PageHeader';
import { useData } from '../../contexts/DataContext';

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

const TABLE_COLUMNS = [
  { id: 'vendorName', label: 'Vendor Name', minWidth: 160 },
  { id: 'city', label: 'City', minWidth: 120 },
  { id: 'gstNumber', label: 'GST Number', minWidth: 150 },
  { id: 'address', label: 'Address', minWidth: 200 },
  { id: 'phoneNumber', label: 'Phone Number', minWidth: 120 },
  { id: 'transportName', label: 'Transport Name', minWidth: 150 },
];

export default function VendorMasterPage() {
  const { vendors: items = [], loading } = useData();

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
      (v.vendorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.gstNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.phoneNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.address || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.transportName || '').toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

  const sorted = useMemo(() =>
    [...filtered].sort(getComparator(order, orderBy)),
    [filtered, order, orderBy]);

  const paginated = useMemo(() =>
    sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]);

  return (
    <Box>
      <PageHeader
        title="Vendor Master"
        subtitle={`${filtered.length} vendors`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Vendor Master' }]}
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Search by name, city, GST, phone, address, transporter…"
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
                    {Array.from({ length: visibleCols.size }).map((_, j) => (
                      <TableCell key={j}><Skeleton animation="wave" height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleCols.size} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                    <Stack sx={{ alignItems: 'center' }} spacing={1}>
                      <PeopleAltIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      <Typography variant="body2">No vendors found</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : paginated.map((row) => (
                <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  {visibleCols.has('vendorName') && <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{row.vendorName}</TableCell>}
                  {visibleCols.has('city') && <TableCell sx={{ fontSize: '0.78rem' }}>{row.city}</TableCell>}
                  {visibleCols.has('gstNumber') && <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{row.gstNumber}</TableCell>}
                  {visibleCols.has('address') && <TableCell sx={{ fontSize: '0.78rem' }}>{row.address}</TableCell>}
                  {visibleCols.has('phoneNumber') && <TableCell sx={{ fontSize: '0.78rem' }}>{row.phoneNumber}</TableCell>}
                  {visibleCols.has('transportName') && <TableCell sx={{ fontSize: '0.78rem' }}>{row.transportName}</TableCell>}
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
    </Box>
  );
}

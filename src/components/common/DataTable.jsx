import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, TablePagination, Paper, IconButton, Tooltip, Chip,
  TextField, InputAdornment, Stack, Menu, MenuItem, Checkbox,
  FormControlLabel, Typography, Skeleton, alpha, useTheme, useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { statusColor } from '../../utils/formatters';
import { useData } from '../../contexts/DataContext';

/* ── empty state ─────────────────────────────────────── */
function EmptyState() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1.5 }}>
      <Box sx={{ width: 64, height: 64, borderRadius: 4, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
        <TableRowsIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
      </Box>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">No records found</Typography>
      <Typography variant="body2" color="text.disabled" align="center" sx={{ maxWidth: 300 }}>
        Try adjusting the search or filter to find what you're looking for.
      </Typography>
    </Box>
  );
}

/* ── toolbar icon button ─────────────────────────────── */
function ToolBtn({ title, onClick, children, color }) {
  return (
    <Tooltip title={title} arrow>
      <IconButton size="small" onClick={onClick} sx={{
        width: 30, height: 30, borderRadius: '8px', color: color || 'text.secondary',
        border: 1, borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover', borderColor: 'text.disabled' },
        transition: 'all 0.15s ease',
      }}>
        {children}
      </IconButton>
    </Tooltip>
  );
}

/* ── mobile card for one row ─────────────────────────── */
function MobileCard({ row, idx, page, rowsPerPage, visibleColumns, actions, theme }) {
  const isDark = theme.palette.mode === 'dark';
  const statusCol = visibleColumns.find(c => c.type === 'status');
  const otherCols = visibleColumns.filter(c => c.type !== 'status');

  const renderCellValue = (col, row) => {
    if (col.render) return col.render(row[col.key], row);
    if (col.type === 'currency')
      return <Typography variant="body2" fontWeight={600}>₹{Number(row[col.key] || 0).toLocaleString('en-IN')}</Typography>;
    return (
      <Typography variant="body2" fontWeight={500} color="text.primary"
        sx={{ wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {String(row[col.key] ?? '—')}
      </Typography>
    );
  };

  return (
    <Paper elevation={0} sx={{
      border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5,
      bgcolor: isDark ? 'background.paper' : '#fff',
      transition: 'box-shadow 0.15s ease',
      '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
    }}>
      {/* Card header: row # | status chip */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
        <Typography variant="caption" color="text.disabled" fontWeight={700}
          sx={{ bgcolor: isDark ? 'grey.800' : 'grey.100', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.68rem' }}>
          # {page * rowsPerPage + idx + 1}
        </Typography>
        {statusCol && row[statusCol.key] && (
          <Chip
            label={row[statusCol.key]}
            size="small"
            color={statusColor(row[statusCol.key])}
            sx={{ fontWeight: 600, fontSize: '0.68rem', height: 22 }}
          />
        )}
      </Box>

      {/* Data fields — 2 columns grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mb: actions ? 1.25 : 0 }}>
        {otherCols.map(col => (
          <Box key={col.key} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={700}
              sx={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.25 }}>
              {col.label}
            </Typography>
            <Box sx={{ overflow: 'hidden' }}>
              {renderCellValue(col, row)}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Action buttons */}
      {actions && (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', pt: 1.25, borderTop: 1, borderColor: 'divider', mt: 0.5 }}>
          {actions(row)}
        </Box>
      )}
    </Paper>
  );
}

/* ── main component ──────────────────────────────────── */
export default function DataTable({
  columns,
  rows,
  loading,
  title = 'Data',
  searchKey,
  actions,
  density = 'medium',
  showCheckbox = false,
  selectedRowIds = [],
  onSelectedRowIdsChange,
  hideIndexColumn = false,
  hideActionsColumn = false,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  let dataLoading = false;
  try {
    const dataCtx = useData();
    if (dataCtx) {
      dataLoading = dataCtx.loading;
    }
  } catch (e) {
    // Ignore error if context is not present
  }
  const isLoading = loading !== undefined ? loading : dataLoading;
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [visibleCols, setVisibleCols] = useState(() => new Set(columns.map((c) => c.key)));
  const [colMenuAnchor, setColMenuAnchor] = useState(null);
  const prevColKeysRef = useRef(columns.map((c) => c.key).join(','));

  useEffect(() => {
    const newKeys = columns.map((c) => c.key).join(',');
    if (newKeys !== prevColKeysRef.current) {
      prevColKeysRef.current = newKeys;
      setVisibleCols(new Set(columns.map((c) => c.key)));
    }
  }, [columns]);

  /* ── filtering + sorting ── */
  const filtered = useMemo(() => {
    let data = [...(rows || [])];
    if (search && searchKey) {
      const q = search.toLowerCase();
      data = data.filter((r) =>
        (Array.isArray(searchKey) ? searchKey : [searchKey]).some((k) =>
          String(r[k] ?? '').toLowerCase().includes(q)
        )
      );
    }
    if (orderBy) {
      data.sort((a, b) => {
        const av = a[orderBy] ?? '';
        const bv = b[orderBy] ?? '';
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
        return order === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [rows, search, searchKey, order, orderBy]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const visibleColumns = columns.filter((c) => visibleCols.has(c.key));
  const exportCols = visibleColumns.map((c) => ({ key: c.key, header: c.label }));

  const handleSort = (key) => {
    setOrder(orderBy === key && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(key);
  };

  const rowPy = density === 'compact' ? '8px' : '12px';

  const allPageSelected = paginated.length > 0 && paginated.every(r => selectedRowIds.includes(r.id));
  const somePageSelected = paginated.some(r => selectedRowIds.includes(r.id)) && !allPageSelected;

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = [...new Set([...selectedRowIds, ...paginated.map(r => r.id)])];
      if (onSelectedRowIdsChange) onSelectedRowIdsChange(newSelecteds);
    } else {
      const paginatedIds = paginated.map(r => r.id);
      const newSelecteds = selectedRowIds.filter(id => !paginatedIds.includes(id));
      if (onSelectedRowIdsChange) onSelectedRowIdsChange(newSelecteds);
    }
  };

  /* ─────────────────────────────────────────────────── */
  return (
    <Paper elevation={0} sx={{ borderRadius: '12px', border: 1, borderColor: 'divider', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Toolbar ── */}
      <Box sx={{
        px: { xs: 1.5, sm: 2 }, py: 1,
        display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
        borderBottom: 1, borderColor: 'divider',
        bgcolor: isDark ? 'rgba(241,245,249,.02)' : '#fafafa',
        minHeight: 50,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mr: 1 }}>
          <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontWeight={500}>
            ({filtered.length})
          </Typography>
        </Box>

        <TextField
          size="small" placeholder="Search records…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 14, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{
            width: { xs: '100%', sm: 200 },
            '& .MuiOutlinedInput-root': { height: 34, borderRadius: '8px', fontSize: '0.8rem' },
            '& .MuiOutlinedInput-input': { py: 0 },
          }}
        />

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={0.5}>
          {!isMobile && (
            <ToolBtn title="Toggle columns" onClick={(e) => setColMenuAnchor(e.currentTarget)}>
              <ViewColumnIcon sx={{ fontSize: 15 }} />
            </ToolBtn>
          )}
        </Stack>
      </Box>

      {/* Column toggle menu (desktop only) */}
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
        {columns.map((c) => (
          <MenuItem key={c.key} dense
            onClick={() => setVisibleCols((prev) => { const next = new Set(prev); next.has(c.key) ? next.delete(c.key) : next.add(c.key); return next; })}
            sx={{ py: 0.5, mx: 0.5, borderRadius: 1 }}
          >
            <FormControlLabel
              control={<Checkbox checked={visibleCols.has(c.key)} size="small" sx={{ py: 0 }} />}
              label={<Typography variant="body2">{c.label}</Typography>}
              sx={{ m: 0, width: '100%' }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* ── Mobile: Card View ── */}
      {isMobile && (
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25, overflowY: 'auto', maxHeight: 620 }}>
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <Paper key={i} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <Skeleton animation="wave" height={18} sx={{ mb: 1.5 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} animation="wave" height={32} />)}
              </Box>
            </Paper>
          ))}
          {!isLoading && paginated.length === 0 && <EmptyState />}
          {!isLoading && paginated.map((row, idx) => (
            <MobileCard
              key={row.id || idx}
              row={row} idx={idx} page={page} rowsPerPage={rowsPerPage}
              visibleColumns={visibleColumns} actions={actions} theme={theme}
            />
          ))}
        </Box>
      )}

      {/* ── Desktop: Table View ── */}
      {!isMobile && (
        <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
          <Table stickyHeader size={density === 'compact' ? 'small' : 'medium'} sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                {showCheckbox && (
                  <TableCell sx={{ width: 48, minWidth: 48, maxWidth: 48, py: '10px', px: 2, position: 'sticky', left: 0, bgcolor: isDark ? 'grey.900' : 'grey.100', zIndex: 5 }}>
                    <Checkbox
                      size="small"
                      indeterminate={somePageSelected}
                      checked={allPageSelected}
                      onChange={handleSelectAllClick}
                      sx={{ p: 0 }}
                    />
                  </TableCell>
                )}
                {!hideIndexColumn && (
                  <TableCell sx={{ width: 48, minWidth: 48, maxWidth: 48, py: '10px', px: 2, position: 'sticky', left: showCheckbox ? 48 : 0, bgcolor: isDark ? 'grey.900' : 'grey.100', zIndex: 5 }}>
                    #
                  </TableCell>
                )}
                {actions && !hideActionsColumn && (
                  <TableCell align="center" sx={{ width: 140, minWidth: 140, maxWidth: 140, py: '10px', px: 2, position: 'sticky', left: (showCheckbox ? 48 : 0) + (!hideIndexColumn ? 48 : 0), bgcolor: isDark ? 'grey.900' : 'grey.100', zIndex: 4, boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>
                    Actions
                  </TableCell>
                )}
                {visibleColumns.map((col) => (
                  <TableCell key={col.key} sx={{ minWidth: col.minWidth || 100, py: '10px', px: 2, whiteSpace: 'nowrap', zIndex: 3 }}>
                    {col.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === col.key}
                        direction={orderBy === col.key ? order : 'asc'}
                        onClick={() => handleSort(col.key)}
                        sx={{ '& .MuiTableSortLabel-icon': { fontSize: 14 }, '&.Mui-active': { color: 'primary.main' } }}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: visibleColumns.length + (showCheckbox ? 1 : 0) + (!hideIndexColumn ? 1 : 0) + (actions && !hideActionsColumn ? 1 : 0) }).map((_, j) => (
                    <TableCell key={j} sx={{ py: rowPy }}><Skeleton animation="wave" height={20} sx={{ borderRadius: 1 }} /></TableCell>
                  ))}
                </TableRow>
              ))}

              {!isLoading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + (showCheckbox ? 1 : 0) + (!hideIndexColumn ? 1 : 0) + (actions && !hideActionsColumn ? 1 : 0)} sx={{ border: 0, p: 0 }}>
                    <EmptyState />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && paginated.map((row, idx) => {
                const isSelected = selectedRowIds.includes(row.id);
                return (
                  <TableRow key={row.id || idx} hover sx={{
                    transition: 'background 0.1s ease',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.03) },
                    '&:last-child td': { borderBottom: 0 },
                    bgcolor: isSelected ? alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08) : 'inherit',
                  }}>
                    {showCheckbox && (
                      <TableCell sx={{ py: rowPy, px: 2, width: 48, minWidth: 48, maxWidth: 48, position: 'sticky', left: 0, bgcolor: isSelected ? (isDark ? '#2c3b52' : '#f0f7ff') : (isDark ? '#1e293b' : '#fff'), zIndex: 3 }}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSelecteds = e.target.checked
                              ? [...selectedRowIds, row.id]
                              : selectedRowIds.filter(id => id !== row.id);
                            if (onSelectedRowIdsChange) onSelectedRowIdsChange(newSelecteds);
                          }}
                          sx={{ p: 0 }}
                        />
                      </TableCell>
                    )}
                    {!hideIndexColumn && (
                      <TableCell sx={{ py: rowPy, px: 2, color: 'text.disabled', fontSize: '0.75rem', fontWeight: 500, width: 48, minWidth: 48, maxWidth: 48, position: 'sticky', left: showCheckbox ? 48 : 0, bgcolor: isSelected ? (isDark ? '#2c3b52' : '#f0f7ff') : (isDark ? '#1e293b' : '#fff'), zIndex: 3 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                    )}

                    {actions && !hideActionsColumn && (
                      <TableCell align="center" sx={{ py: rowPy, px: 1.5, width: 140, minWidth: 140, maxWidth: 140, position: 'sticky', left: (showCheckbox ? 48 : 0) + (!hideIndexColumn ? 48 : 0), bgcolor: isSelected ? (isDark ? '#2c3b52' : '#f0f7ff') : (isDark ? '#1e293b' : '#fff'), zIndex: 2, boxShadow: '2px 0 5px rgba(0,0,0,0.02)' }}>
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                          {actions(row)}
                        </Stack>
                      </TableCell>
                    )}

                    {visibleColumns.map((col) => (
                      <TableCell key={col.key} sx={{ py: rowPy, px: 2, maxWidth: col.wrap ? (col.maxWidth || 260) : (col.maxWidth || 220), overflow: col.wrap ? 'visible' : 'hidden', textOverflow: col.wrap ? 'clip' : 'ellipsis', whiteSpace: col.wrap ? 'normal' : 'nowrap', wordBreak: col.wrap ? 'break-word' : 'normal' }}>
                        {col.render ? (
                          col.render(row[col.key], row)
                        ) : col.type === 'status' ? (
                          <Chip label={row[col.key]} size="small" color={statusColor(row[col.key])} sx={{ fontWeight: 600 }} />
                        ) : col.type === 'currency' ? (
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            ₹{Number(row[col.key] || 0).toLocaleString('en-IN')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.primary" sx={{ wordBreak: col.wrap ? 'break-word' : 'normal', whiteSpace: col.wrap ? 'normal' : 'nowrap' }}>{String(row[col.key] ?? '')}</Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Pagination (always) ── */}
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={isMobile ? [5, 10, 25] : [5, 10, 25, 50, 100]}
          labelRowsPerPage={isMobile ? '' : 'Rows per page:'}
          sx={{
            '& .MuiTablePagination-toolbar': { minHeight: 48, px: { xs: 1, sm: 2 } },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: 'text.secondary' },
          }}
        />
      </Box>
    </Paper>
  );
}

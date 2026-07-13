import { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  Box, Button, Grid, TextField, MenuItem, Typography, Card, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, IconButton, Divider, alpha, useTheme, Chip, InputAdornment, Tooltip,
  TablePagination, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { toast } from 'react-toastify';
import { formatDate, generateIndentNumber, formatTimestamp } from '../../utils/formatters';
import { useData } from '../../contexts/DataContext';
import { gasApi } from '../../services/gasApi';
import { exportToExcel } from '../../utils/exportUtils';

/* ─── constants ───────────────────────────────────── */
const ORDER_BY_LIST = [

  'Admin User', 'John Smith', 'Sarah Johnson', 'Emma Davis',
  'Mike Wilson', 'Mr. Sharma', 'Amlan Dikshit',
];

const INPUT_SX = {
  '& .MuiInputBase-input': { py: '6px', px: '8px', fontSize: '0.8rem' },
  '& .MuiOutlinedInput-root': { borderRadius: 1 },
};

/* ─── tiny inline number input ────────────────────── */
function NumInput({ regProps, defaultValue }) {
  return (
    <TextField
      {...regProps}
      size="small"
      type="number"
      defaultValue={defaultValue ?? 0}
      inputProps={{ style: { padding: '5px 6px', fontSize: '0.78rem', width: 64 } }}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
    />
  );
}


/* ─── Indent List Table ────────────────────────────── */
const LIST_COLS = [
  { key: 'createdDate', label: 'Timestamp', render: v => formatDate(v, true) },
  { key: 'indentNumber', label: 'Indent Number', render: v => <Chip label={v} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }} /> },
  { key: 'serialNo', label: 'Serial No.' },
  { key: 'orderBy', label: 'Order By' },
  { key: 'partyName', label: 'Party Name', render: v => <Typography variant="body2" fontWeight={600}>{v}</Typography> },
  { key: 'groupName', label: 'Group Name' },
  { key: 'itemName', label: 'Item Name', render: v => <Typography variant="body2" sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</Typography> },
  { key: 'itemCode', label: 'Item Code' },
  { key: 'description', label: 'Description' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit', label: 'Unit' },
  { key: 'rate', label: 'Rate' },
  { key: 'gst', label: 'GST %' },
  { key: 'discount', label: 'Discount Amount' },
  { key: 'image', label: 'Image', render: v => v ? <a href={v} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '0.78rem' }}>View Link</a> : '—' },
  { key: 'leadDays', label: 'Approx Lead Days' },
  { key: 'companyName', label: 'Company Name' },
];

function IndentListTable({ rows }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const exportCols = LIST_COLS.map(c => ({ key: c.key, header: c.label }));

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      {/* toolbar */}
      <Box sx={{
        px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1,
        borderBottom: 1, borderColor: 'divider',
        bgcolor: isDark ? 'rgba(241,245,249,.02)' : '#fafafa',
        minHeight: 50,
      }}>
        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>Indent List</Typography>
        <Typography variant="caption" color="text.disabled" fontWeight={500}>({filtered.length})</Typography>
        <Box flex={1} />
        <TextField
          size="small" placeholder="Search records..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 14, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{
            width: 200,
            '& .MuiOutlinedInput-root': { height: 34, borderRadius: '8px', fontSize: '0.8rem' },
            '& .MuiOutlinedInput-input': { py: 0 },
          }}
        />
        <Tooltip title="Export Excel" arrow>
          <IconButton size="small" onClick={() => exportToExcel(filtered, exportCols, 'Indent List')}
            sx={{ width: 30, height: 30, borderRadius: '8px', border: 1, borderColor: 'divider', color: '#059669', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <FileDownloadIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* table */}
      <TableContainer sx={{ overflowX: 'auto', maxHeight: 500 }}>
        <Table stickyHeader size="small" sx={{ minWidth: 1600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1.2, bgcolor: isDark ? 'grey.900' : 'grey.100', color: 'text.secondary', whiteSpace: 'nowrap', px: 1.5 }}>#</TableCell>
              {LIST_COLS.map(col => (
                <TableCell key={col.key} sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1.2, bgcolor: isDark ? 'grey.900' : 'grey.100', color: 'text.secondary', whiteSpace: 'nowrap', px: 1.5 }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={LIST_COLS.length + 1} align="center" sx={{ py: 5, color: 'text.disabled', fontSize: '0.85rem' }}>
                  No indent records yet. Submit a request to see data here.
                </TableCell>
              </TableRow>
            )}
            {paginated.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                hover
                sx={{
                  '&:last-child td': { borderBottom: 0 },
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                }}
              >
                <TableCell sx={{ py: 1, px: 1.5, color: 'text.disabled', fontSize: '0.75rem', fontWeight: 500 }}>
                  {page * rowsPerPage + idx + 1}
                </TableCell>
                {LIST_COLS.map(col => (
                  <TableCell key={col.key} sx={{ py: 1, px: 1.5, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {col.render ? col.render(row[col.key], row) : <Typography variant="body2" fontSize="0.8rem">{String(row[col.key] ?? '—')}</Typography>}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <TablePagination
          component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ '& .MuiTablePagination-toolbar': { minHeight: 44, px: 2 }, '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: 'text.secondary' } }}
        />
      </Box>
    </Paper>
  );
}

/* ─── Main Page ────────────────────────────────────── */
export default function IndentManagementPage() {
  const dispatch = useDispatch();
  const records = useSelector(s => s.workflow.records);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const imageRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { products, vendors, companies, orderByList, refresh } = useData();

  const {
    register: reg,
    control,
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      companyName: '',
      orderBy: '',
      partyName: '',
      filterGroup: '',
      searchItem: '',
      items: [],
    },
  });

  const { fields, replace, remove } = useFieldArray({ control, name: 'items' });

  const partyName = watch('partyName');
  const filterGroup = watch('filterGroup');
  const searchItem = watch('searchItem');

  /* unique group names for the selected party */
  const partyGroups = useMemo(() => {
    if (!partyName) return [];
    const groups = products
      .filter(p => p.supplierName === partyName)
      .map(p => p.groupName);
    return [...new Set(groups)];
  }, [partyName, products]);

  /* load all party items when party changes */
  useEffect(() => {
    setValue('filterGroup', '');
    if (!partyName) { replace([]); return; }
    const items = products
      .filter(p => p.supplierName === partyName)
      .map(p => ({
        _productId: p.id,
        groupName: p.groupName,
        itemName: p.itemName,
        unit: p.unit,
        rate: p.purchaseRate,
        gst: 0,
        itemCode: p.itemCode,
        leadDays: 0,
        description: '',
        discount: 0,
        quantity: 0,
      }));
    replace(items);
  }, [partyName, products]); // eslint-disable-line react-hooks/exhaustive-deps


  /* filtered visible rows */
  const visibleFields = useMemo(() =>
    fields
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const groupMatch = !filterGroup || item.groupName === filterGroup;
        const nameMatch = !searchItem || item.itemName.toLowerCase().includes(searchItem.toLowerCase());
        return groupMatch && nameMatch;
      }),
    [fields, filterGroup, searchItem]
  );

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const onSubmit = async data => {
    const activeItems = data.items.filter(it => Number(it.quantity) > 0);
    if (activeItems.length === 0) {
      toast.error('Enter a quantity > 0 for at least one item.');
      return;
    }

    setIsSubmitting(true);
    let imageUrl = '';
    const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

    if (imageFile && folderId) {
      try {
        const base64Data = await fileToBase64(imageFile);
        const uploadRes = await gasApi.uploadFile({
          base64Data,
          fileName: imageFile.name,
          mimeType: imageFile.type,
          folderId,
        });
        if (uploadRes.success) {
          imageUrl = uploadRes.fileUrl;
        }
      } catch (err) {
        console.error("Failed to upload image:", err);
        toast.warning("Failed to upload image to Google Drive, proceeding without image.");
      }
    }

    try {
      const timestamp = formatTimestamp();

      const rowsData = activeItems.map((item, idx) => [
        timestamp,
        "", // Indent Number: Will be generated and filled by the backend doPost action
        idx + 1, // Serial No.
        data.orderBy,
        data.partyName,
        item.groupName,
        item.itemName,
        item.itemCode || "",
        item.description || "",
        Number(item.quantity) || 0,
        item.unit,
        Number(item.rate) || 0,
        Number(item.gst) || 0,
        Number(item.discount) || 0,
        imageUrl || "",
        Number(item.leadDays) || 0,
        data.companyName
      ]);

      // Ensure that row 6 (header row) has a value in column A. 
      // The backend's getActualLastRow scans column A to determine where to append.
      // If column A in row 6 was empty, the backend would mistakenly overwrite row 6.
      await gasApi.updateCell("INDENT-PO", 6, 1, "Timestamp");

      const result = await gasApi.batchInsertIndent("INDENT-PO", rowsData);
      if (result.success) {
        const indentNumber = result.indentNumber || "";

        toast.success(`Indent ${indentNumber} submitted with ${activeItems.length} item(s)!`);
        await refresh(['indents']);
        reset({ companyName: data.companyName, orderBy: '', partyName: '', filterGroup: '', searchItem: '', items: [] });
        setImageFile(null);
        if (imageRef.current) imageRef.current.value = '';
        setIsFormOpen(false);
      }
    } catch (err) {
      console.error("Failed to submit indent:", err);
      toast.error(err.message || "Failed to submit indent request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── render ────────────────────────────────────────── */
  return (
    <Box sx={{ width: '100%' }}>

      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AssignmentIcon sx={{ fontSize: 30, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={800} color="primary.main">Indent Form</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Submit your professional request with ease</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsFormOpen(true)}
          sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          Create Indent
        </Button>
      </Box>


      {/* ── Create Indent Dialog ── */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 3,
            width: '850px',
            maxWidth: '96vw',
            maxHeight: '92vh',
            bgcolor: isDark ? 'background.paper' : '#f8fafc'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', borderBottom: 1, borderColor: 'divider', pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AddIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          </Box>
          Create New Indent
        </DialogTitle>
        <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
          <form id="indent-form" onSubmit={handleSubmit(onSubmit)}>

            {/* Row 1 — Company | Order By | Party | Image */}
            <Grid container spacing={2} mb={partyName ? 3 : 2}>

              {/* Company Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Company Name<span style={{ color: 'red' }}>*</span>
                </Typography>
                <Controller name="companyName" control={control} rules={{ required: true }} render={({ field }) => (
                  <TextField
                    {...field} select fullWidth size="small"
                    error={!!errors.companyName}
                    sx={INPUT_SX}
                  >
                    {companies.map(c => <MenuItem key={c.id} value={c.companyName}>{c.companyName}</MenuItem>)}
                    {field.value && !companies.some(c => c.companyName === field.value) && (
                      <MenuItem value={field.value}>{field.value}</MenuItem>
                    )}
                  </TextField>
                )} />
              </Grid>

              {/* Order By */}
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Order By<span style={{ color: 'red' }}>*</span>
                </Typography>
                <Controller name="orderBy" control={control} rules={{ required: true }} render={({ field }) => (
                  <TextField
                    {...field} select fullWidth size="small"
                    error={!!errors.orderBy}
                    sx={INPUT_SX}
                  >
                    {(orderByList && orderByList.length > 0 ? orderByList : ORDER_BY_LIST).map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                )} />
              </Grid>

              {/* Party Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Party Name (Vendor)<span style={{ color: 'red' }}>*</span>
                </Typography>
                <Controller name="partyName" control={control} rules={{ required: true }} render={({ field }) => (
                  <TextField
                    {...field} select fullWidth size="small"
                    error={!!errors.partyName}
                    sx={INPUT_SX}
                  >
                    {vendors.map(v => <MenuItem key={v.id} value={v.vendorName}>{v.vendorName}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>

              {/* Upload Image */}
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Upload Image (Optional)
                </Typography>
                <Button
                  variant="outlined" component="label" fullWidth
                  startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    height: 36, textTransform: 'none', fontSize: '0.8rem',
                    color: 'text.secondary', borderColor: 'divider',
                    '&:hover': { borderColor: 'text.secondary' },
                  }}
                >
                  {imageFile ? imageFile.name.slice(0, 16) + '…' : 'Choose File'}
                  <input
                    type="file" hidden ref={imageRef}
                    onChange={e => setImageFile(e.target.files[0] || null)}
                    accept="image/*"
                  />
                </Button>
              </Grid>
            </Grid>

            {/* ── Dynamic Section: only when party selected ── */}
            {partyName && (
              <Box
                sx={{
                  bgcolor: isDark ? alpha('#3b82f6', 0.05) : '#f8fafc',
                  border: '1px solid',
                  borderColor: isDark ? alpha('#3b82f6', 0.2) : '#e2e8f0',
                  borderRadius: 2,
                  p: 2.5,
                  mb: 3,
                }}
              >
                {/* Section header */}
                <Typography variant="subtitle1" fontWeight={700} color="primary.main" mb={2}>
                  Items for: <span style={{ fontWeight: 800 }}>{partyName}</span>
                </Typography>

                {/* Filter row */}
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Filter by Group</Typography>
                     <TextField
                       {...reg('filterGroup')} select fullWidth size="small"
                       value={watch('filterGroup') || ''}
                       sx={{ ...INPUT_SX, bgcolor: isDark ? 'background.paper' : 'white' }}
                     >
                       <MenuItem value="">All Groups</MenuItem>
                       {partyGroups.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                     </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Search Item</Typography>
                    <TextField
                      {...reg('searchItem')} fullWidth size="small"
                      placeholder="Type to search items…"
                      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
                      sx={{ ...INPUT_SX, bgcolor: isDark ? 'background.paper' : 'white' }}
                    />
                  </Grid>
                </Grid>

                {/* Item count badge */}
                <Typography variant="body2" fontWeight={700} color="primary.main" mb={1}>
                  Total Items: {visibleFields.length}
                </Typography>

                {/* Items table */}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: isDark ? alpha('#94a3b8', 0.15) : '#e2e8f0', borderRadius: 1.5 }}>
                  <Table size="small" sx={{ minWidth: 1100, tableLayout: 'auto' }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: isDark ? 'grey.900' : '#f1f5f9' }}>
                        {['S.No.', 'Group', 'Item', 'Unit', 'Rate', 'GST %', 'Item Code', 'Lead Days', 'Description', 'Discount %', 'Quantity *', 'Action'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1.2, px: 1.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visibleFields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={12} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: '0.85rem' }}>
                            No items found for the selected filter.
                          </TableCell>
                        </TableRow>
                      )}
                      {visibleFields.map(({ item, index }) => (
                        <TableRow key={item.id || index} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ py: 1, px: 1.5, color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600 }}>{index + 1}</TableCell>
                          <TableCell sx={{ py: 1, px: 1.5, fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{item.groupName}</TableCell>
                          <TableCell sx={{ py: 1, px: 1.5, fontSize: '0.82rem', fontWeight: 500, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.itemName}</TableCell>
                          <TableCell sx={{ py: 1, px: 1.5, fontSize: '0.78rem' }}>{item.unit}</TableCell>
                          <TableCell sx={{ py: 1, px: 1 }}><NumInput regProps={reg(`items.${index}.rate`)} defaultValue={item.rate} /></TableCell>
                          <TableCell sx={{ py: 1, px: 1 }}><NumInput regProps={reg(`items.${index}.gst`)} defaultValue={item.gst} /></TableCell>
                          <TableCell sx={{ py: 1, px: 1 }}>
                            <TextField
                              {...reg(`items.${index}.itemCode`)}
                              size="small"
                              defaultValue={item.itemCode}
                              inputProps={{ style: { padding: '5px 6px', fontSize: '0.78rem', width: 90 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1, px: 1 }}><NumInput regProps={reg(`items.${index}.leadDays`)} defaultValue={item.leadDays} /></TableCell>
                          <TableCell sx={{ py: 1, px: 1 }}>
                            <TextField
                              {...reg(`items.${index}.description`)}
                              size="small"
                              defaultValue={item.description}
                              inputProps={{ style: { padding: '5px 6px', fontSize: '0.78rem', width: 120 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1, px: 1 }}><NumInput regProps={reg(`items.${index}.discount`)} defaultValue={item.discount} /></TableCell>
                          <TableCell sx={{ py: 1, px: 1 }}>
                            <TextField
                              {...reg(`items.${index}.quantity`)}
                              size="small"
                              type="number"
                              defaultValue={0}
                              inputProps={{ min: 0, style: { padding: '5px 6px', fontSize: '0.82rem', fontWeight: 600, width: 70 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, '& fieldset': { borderColor: '#3b82f6' } } }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1, px: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => remove(index)}
                              sx={{ bgcolor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626' }, p: 0.5, borderRadius: 1 }}
                            >
                              <DeleteIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="center" mt={1}>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                disabled={isSubmitting}
                onClick={() => setIsFormOpen(false)}
                sx={{
                  px: 5, py: 1.3,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <RocketLaunchIcon />}
                sx={{
                  px: 5, py: 1.3,
                  bgcolor: '#059669',
                  '&:hover': { bgcolor: '#047857' },
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(5,150,105,0.35)',
                  '&:hover': { bgcolor: '#047857', boxShadow: '0 6px 18px rgba(5,150,105,0.45)' },
                }}
              >
                {isSubmitting ? 'Submitting...' : ' Submit Request'}
              </Button>
            </Stack>

          </form>
        </DialogContent>
      </Dialog>

      {/* ── Indent List Table ── */}
      <IndentListTable rows={records} />

    </Box>
  );
}

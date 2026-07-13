import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useSelector } from 'react-redux';
import {
  Box, Button, Grid, TextField, MenuItem, Typography, Card, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, IconButton, Divider, alpha, useTheme, Chip, InputAdornment, Tooltip,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import DeleteIcon       from '@mui/icons-material/Delete';
import CloudUploadIcon  from '@mui/icons-material/CloudUpload';
import WhatsAppIcon     from '@mui/icons-material/WhatsApp';
import SaveIcon         from '@mui/icons-material/Save';
import SearchIcon       from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { toast } from 'react-toastify';
import { useData } from '../../contexts/DataContext';
import { gasApi } from '../../services/gasApi';
import { exportToExcel } from '../../utils/exportUtils';
import { formatTimestamp } from '../../utils/formatters';

const ORDER_BY_LIST = [
  'Admin User', 'John Smith', 'Sarah Johnson', 'Emma Davis',
  'Mike Wilson', 'Mr. Sharma', 'Amlan Dikshit',
];

const INPUT_SX = {
  '& .MuiInputBase-input': { py: '7px', px: '10px', fontSize: '0.875rem' },
  '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
};

const WA_COLS = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'partyName', label: 'Party Name' },
  { key: 'slipImage', label: 'Slip Image' },
  { key: 'orderBy',   label: 'Order By' },
  { key: 'email',     label: 'Email Address' },
];

export default function WhatsAppFormPage() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const slipRef = useRef(null);

  const { whatsappEntries: entries, refresh, addRow } = useData();
  const vendors = useSelector((s) => s.vendorMaster.items) || [];

  const [slipFile, setSlipFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(0);
  const [rpp,      setRpp]      = useState(10);


  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      timestamp: new Date().toISOString().slice(0, 16),
      partyName: '',
      orderBy:   '',
      email:     '',
    },
  });

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const onSave = async (data) => {
    if (!data.partyName) { toast.error('Party Name is required'); return; }
    setIsSubmitting(true);
    let fileUrl = '';
    const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

    if (slipFile && folderId) {
      try {
        const base64Data = await fileToBase64(slipFile);
        const uploadRes = await gasApi.uploadFile({
          base64Data,
          fileName: slipFile.name,
          mimeType: slipFile.type,
          folderId,
        });
        if (uploadRes.success) {
          fileUrl = uploadRes.fileUrl;
        }
      } catch (err) {
        console.error("Failed to upload slip file:", err);
        toast.warning("Failed to upload slip file to Google Drive, proceeding without upload.");
      }
    }

    try {
      const payload = {
        "timestamp": formatTimestamp(data.timestamp),
        "Party Name": data.partyName,
        "Slip Image": fileUrl || (slipFile ? slipFile.name : ''),
        "Order By": data.orderBy || '',
        "Email Address": data.email || ''
      };
      
      const result = await addRow('whatsapp', payload);
      if (result.success) {
        toast.success('WhatsApp order entry saved!');
        await refresh();
        reset({
          timestamp: formatTimestamp().slice(0, 16),
          partyName: '', orderBy: '', email: '',
        });
        setSlipFile(null);
        if (slipRef.current) slipRef.current.value = '';
      }
    } catch (err) {
      console.error("Failed to save WhatsApp entry:", err);
      toast.error(err.message || "Failed to save entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const target = entries.find(e => e.id === id);
    if (!target) return;
    try {
      setIsSubmitting(true);
      const result = await gasApi.removeResource('whatsapp', target.timestamp);
      if (result.success) {
        toast.info('Entry removed');
        await refresh();
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
      toast.error(err.message || "Failed to remove entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    return !q || Object.values(e).some(v => String(v).toLowerCase().includes(q));
  });
  const paginated = filtered.slice(page * rpp, (page + 1) * rpp);
  const exportCols = WA_COLS.map(c => ({ key: c.key, header: c.label }));

  return (
    <Box sx={{ width: '100%' }}>

      {/* ── Page Header ── */}
      <Box
        sx={{
          mb: 3, textAlign: 'center', py: 3, px: 4,
          background: isDark
            ? 'linear-gradient(135deg,rgba(37,211,102,.10) 0%,rgba(18,140,126,.10) 100%)'
            : 'linear-gradient(135deg,rgba(37,211,102,.08) 0%,rgba(18,140,126,.06) 100%)',
          borderRadius: 3, border: '1px solid', borderColor: isDark ? 'rgba(37,211,102,.2)' : 'rgba(37,211,102,.25)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 0.5 }}>
          <Box sx={{ bgcolor: '#25d366', color: 'white', borderRadius: 2, p: 0.8, display: 'flex' }}>
            <WhatsAppIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} color={isDark ? '#4ade80' : '#16a34a'}>
            WhatsApp Form
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Capture and record incoming WhatsApp orders from parties
        </Typography>
      </Box>

      {/* ── Input Card ── */}
      <Card
        elevation={0}
        sx={{
          mb: 3, border: 1, borderColor: isDark ? 'rgba(37,211,102,.2)' : 'rgba(37,211,102,.3)',
          borderRadius: 2,
          background: isDark
            ? 'linear-gradient(135deg,rgba(37,211,102,.05) 0%,rgba(18,140,126,.05) 100%)'
            : 'linear-gradient(135deg,rgba(37,211,102,.04) 0%,rgba(18,140,126,.03) 100%)',
        }}
      >
        <CardContent sx={{ p: 3, pb: '24px !important' }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2.5}>
            📋 New Order Entry
          </Typography>

          <form onSubmit={handleSubmit(onSave)}>
            <Grid container spacing={2.5} alignItems="flex-end">

              {/* Timestamp */}
              <Grid item xs={12} sm={6} md={2.2}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Timestamp
                </Typography>
                <TextField
                  {...register('timestamp')}
                  fullWidth size="small" type="datetime-local"
                  InputLabelProps={{ shrink: true }} sx={INPUT_SX}
                />
              </Grid>

              {/* Party Name */}
              <Grid item xs={12} sm={6} md={2.5}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Party Name <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller name="partyName" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth size="small" sx={INPUT_SX}>
                    <MenuItem value=""><em>— Select Party —</em></MenuItem>
                    {vendors.map(v => <MenuItem key={v.id} value={v.vendorName}>{v.vendorName}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
 
              {/* Slip Image */}
              <Grid item xs={12} sm={6} md={2.2}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Slip Image
                </Typography>
                <Button
                  variant="outlined" component="label" fullWidth
                  startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    height: 38, textTransform: 'none', fontSize: '0.85rem',
                    borderColor: '#25d366', color: '#16a34a', borderRadius: 1.5,
                    '&:hover': { borderColor: '#16a34a', bgcolor: 'rgba(37,211,102,.06)' },
                  }}
                >
                  {slipFile ? slipFile.name.slice(0, 14) + '…' : 'Choose File'}
                  <input
                    ref={slipRef} type="file" hidden accept="image/*,application/pdf"
                    onChange={e => setSlipFile(e.target.files[0] || null)}
                  />
                </Button>
              </Grid>
 
              {/* Order By */}
              <Grid item xs={12} sm={6} md={2.1}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Order By
                </Typography>
                <Controller name="orderBy" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth size="small" sx={INPUT_SX}>
                    <MenuItem value=""><em>— Select —</em></MenuItem>
                    {ORDER_BY_LIST.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
 
              {/* Email */}
              <Grid item xs={12} sm={6} md={2}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  Email Address
                </Typography>
                <TextField
                  {...register('email')}
                  fullWidth size="small" type="email"
                  placeholder="email@example.com" sx={INPUT_SX}
                />
              </Grid>
 
              {/* Save Button */}
              <Grid item xs={12} sm={6} md={1.5}>
                <Button
                  type="submit" variant="contained" fullWidth
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    height: 38, textTransform: 'none', fontWeight: 700,
                    bgcolor: '#25d366', '&:hover': { bgcolor: '#1da851' },
                    borderRadius: 1.5, boxShadow: '0 4px 12px rgba(37,211,102,.35)',
                    fontSize: '0.85rem',
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </Grid>

            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* ── Saved Entries Table ── */}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>

        {/* Table Toolbar */}
        <Box sx={{
          px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
          flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider',
          bgcolor: isDark ? 'rgba(241,245,249,.02)' : 'rgba(15,23,42,.01)',
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ bgcolor: '#25d366', color: 'white', borderRadius: 1, p: 0.3, display: 'flex' }}>
              <WhatsAppIcon sx={{ fontSize: 16 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>Order Entries</Typography>
          </Box>
          <Chip
            label={`${filtered.length} records`} size="small"
            sx={{ fontSize: '0.7rem', height: 22, fontWeight: 600, bgcolor: isDark ? 'rgba(37,211,102,.15)' : 'rgba(37,211,102,.1)', color: '#16a34a' }}
          />
          <Box flex={1} />
          <TextField
            size="small" placeholder="Search entries…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
            sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { height: 34, fontSize: '0.875rem', borderRadius: 1.5 } }}
          />
          <Tooltip title="Export Excel" arrow>
            <IconButton
              size="small"
              onClick={() => exportToExcel(filtered, exportCols, 'WhatsApp Orders')}
              sx={{ border: 1, borderColor: 'divider', color: '#059669', borderRadius: 1.5 }}
            >
              <FileDownloadIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Table */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'grey.900' : '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1.5, px: 2, color: 'text.secondary', borderBottom: '2px solid', borderColor: isDark ? 'rgba(255,255,255,.08)' : '#e2e8f0' }}>
                  #
                </TableCell>
                {WA_COLS.map(col => (
                  <TableCell
                    key={col.key}
                    sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1.5, px: 2, color: 'text.secondary', whiteSpace: 'nowrap', borderBottom: '2px solid', borderColor: isDark ? 'rgba(255,255,255,.08)' : '#e2e8f0' }}
                  >
                    {col.label}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1.5, px: 2, color: 'text.secondary', textAlign: 'center', borderBottom: '2px solid', borderColor: isDark ? 'rgba(255,255,255,.08)' : '#e2e8f0' }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={WA_COLS.length + 2} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ bgcolor: 'rgba(37,211,102,.1)', borderRadius: '50%', p: 2, display: 'flex' }}>
                        <WhatsAppIcon sx={{ fontSize: 32, color: '#25d366' }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        No entries yet
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Fill the form above and click Save to add an order entry
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((entry, idx) => (
                <TableRow
                  key={entry.id}
                  hover
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    '&:hover': { bgcolor: alpha('#25d366', 0.03) },
                    transition: 'background 0.15s ease',
                  }}
                >
                  <TableCell sx={{ py: 1.2, px: 2, color: 'text.disabled', fontSize: '0.75rem', fontWeight: 500 }}>
                    {page * rpp + idx + 1}
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                    {entry.timestamp}
                  </TableCell>

                  {/* Party Name */}
                  <TableCell sx={{ py: 1.2, px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#25d366', flexShrink: 0 }} />
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {entry.partyName}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Slip Image */}
                  <TableCell sx={{ py: 1.2, px: 2 }}>
                    {entry.slipImage && entry.slipImage !== '—' && entry.slipImage !== '' ? (
                      String(entry.slipImage).startsWith('http') ? (
                        <a
                          href={entry.slipImage}
                          target="_blank" rel="noreferrer"
                          style={{ color: '#25d366', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
                        >
                          🔗 View Document
                        </a>
                      ) : (
                        <Typography variant="body2" fontSize="0.8rem">📎 {entry.slipImage}</Typography>
                      )
                    ) : (
                      <Typography variant="body2" color="text.disabled" fontSize="0.8rem">—</Typography>
                    )}
                  </TableCell>

                  {/* Order By */}
                  <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.82rem' }}>
                    {entry.orderBy}
                  </TableCell>

                  {/* Email */}
                  <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.8rem', color: 'text.secondary' }}>
                    {entry.email}
                  </TableCell>

                  {/* Action */}
                  <TableCell align="center" sx={{ py: 1.2, px: 2 }}>
                    <Tooltip title="Delete entry" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(entry.id)}
                        sx={{ bgcolor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626' }, p: 0.5, borderRadius: 1 }}
                      >
                        <DeleteIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <TablePagination
            component="div" count={filtered.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rpp}
            onRowsPerPageChange={e => { setRpp(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              '& .MuiTablePagination-toolbar': { minHeight: 44, px: 2 },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: 'text.secondary' },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, IconButton, Grid, InputAdornment, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { useData } from '../../contexts/DataContext';
import { formatTimestamp } from '../../utils/formatters';
import { gasApi } from '../../services/gasApi';
import { toast } from 'react-toastify';

const SectionLabel = ({ children }) => (
  <Typography variant="caption" fontWeight={700} color="text.secondary"
    sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
    {children}
  </Typography>
);

export default function ArrangeLogisticsForm({ open, onClose, record, groupIds }) {
  const dispatch = useDispatch();
  const allRecords = useSelector((state) => state.workflow.records) || [];
  const { refresh, updateRow, headers, startSync, endSync } = useData();
  const [biltyFile, setBiltyFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productRows, setProductRows] = useState([]);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      transporterName: '',
      partyAddress: '',
      locationLink: '',
      vehicleNo: '',
      driverNo: '',
      biltyNo: '',
      biltyImage: null,
      transportingAmount: '',
    }
  });

  const biltyImageFile = watch('biltyImage');

  useEffect(() => {
    if (open && record) {
      const ids = groupIds?.length ? groupIds : [record.id];
      const matched = allRecords.filter(r => ids.includes(r.id));
      
      setProductRows(matched.map(r => {
        const maxQty = Number(
          (r._pendingLifting !== undefined && r._pendingLifting !== null && r._pendingLifting > 0)
            ? r._pendingLifting
            : (r.pendingLifting !== undefined && r.pendingLifting !== null && r.pendingLifting > 0
                ? r.pendingLifting
                : Math.max(0, Number(r.poQty || r.quantity || 0) - Number(r.totalLifted || 0)))
        );
        const defaultQty = maxQty > 0 ? maxQty : Number(r.poQty || r.quantity || 0);
        return {
          id: r.id,
          groupName: r.groupName || '',
          itemName: r.itemName || '',
          unit: r.unit || '',
          quantity: defaultQty,
          maxQuantity: defaultQty,
          originalRecord: r
        };
      }));

      setValue('partyAddress', record.partyAddress || '');
      setValue('locationLink', record.locationLink || '');
      setValue('transporterName', '');
      setValue('vehicleNo', '');
      setValue('driverNo', '');
      setValue('biltyNo', '');
      setValue('biltyImage', null);
      setValue('transportingAmount', '');
      setBiltyFile(null);
      setIsSubmitting(false);
    }
  }, [open, record, groupIds, allRecords, setValue]);

  const handleQuantityChange = (id, val) => {
    setProductRows(prev => prev.map(row => {
      if (row.id === id) {
        if (val === '') return { ...row, quantity: '' };
        let numVal = parseFloat(val);
        if (isNaN(numVal)) numVal = 0;
        const clampedVal = Math.max(0, Math.min(row.maxQuantity, numVal));
        return { ...row, quantity: clampedVal };
      }
      return row;
    }));
  };

  const handleRemoveRow = (id) => {
    setProductRows(prev => prev.filter(row => row.id !== id));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBiltyFile(file);
      setValue('biltyImage', { name: file.name, url: URL.URL ? URL.createObjectURL(file) : file.name });
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const onSubmit = async (data) => {
    if (!record) return;
    if (!productRows || productRows.length === 0) {
      toast.error("Please include at least one item for lifting.");
      return;
    }

    const invalidItem = productRows.find(item => !item.quantity || Number(item.quantity) <= 0);
    if (invalidItem) {
      toast.error(`Please enter a valid lifting quantity (> 0) for ${invalidItem.itemName}`);
      return;
    }

    setIsSubmitting(true);
    if (startSync) startSync();
    let biltyImageUrl = '';
    const folderId = import.meta.env.VITE_FOLDER_BILTY;

    if (biltyFile && folderId) {
      try {
        const base64Data = await fileToBase64(biltyFile);
        const uploadRes = await gasApi.uploadFile({
          base64Data,
          fileName: biltyFile.name,
          mimeType: biltyFile.type,
          folderId,
        });
        if (uploadRes.success) {
          biltyImageUrl = uploadRes.fileUrl;
        }
      } catch (err) {
        console.error("Failed to upload Bilty image:", err);
        toast.warning("Failed to upload Bilty to Google Drive, proceeding without upload.");
      }
    }

    try {
      const headersList = headers?.logistics || [
        "Timestamp",
        "LN-Lift Number",
        "Indent No.",
        "Party Name",
        "Material Name",
        "Transporter Name",
        "Vehicle No.",
        "Driver No.",
        "Bilty No.",
        "Bilty Image",
        "Transporting Amount",
        "Party Address",
        "Party Location Link",
        "Planned 1",
        "Actual 1",
        "Time Delay 1",
        "Serial Number",
        "Lifting Qty"
      ];

      const timestamp = formatTimestamp();

      const rowsData = productRows.map(row => {
        const rec = row.originalRecord;
        const rowObj = {
          "Timestamp": timestamp,
          "LN-Lift Number": "", // Will be generated by backend
          "Indent No.": rec.indentNumber,
          "Party Name": rec.partyName,
          "Material Name": rec.itemName,
          "Transporter Name": data.transporterName,
          "Vehicle No.": data.vehicleNo,
          "Driver No.": data.driverNo,
          "Bilty No.": data.biltyNo,
          "Bilty Image": biltyImageUrl || (biltyFile ? biltyFile.name : ''),
          "Transporting Amount": Number(data.transportingAmount) || 0,
          "Party Address": data.partyAddress,
          "Party Location Link": data.locationLink,
          "Planned 1": "",
          "Actual 1": "",
          "Time Delay 1": "",
          "Serial Number": rec.serialNo || "",
          "Lifting Qty": Number(row.quantity) || 0,
        };
        return headersList.map(h => rowObj[h] !== undefined ? rowObj[h] : "");
      });

      const result = await gasApi.batchInsertLogistics("LIFT-RECEIVED", rowsData);
      if (result.success && result.liftNumber) {
        // Update Actual3 in INDENT-PO
        for (const row of productRows) {
          await updateRow('indents', row.originalRecord.id, {
            "Actual3": timestamp
          }, false);
        }

        toast.success(`Logistics arranged! Lift Number ${result.liftNumber} generated.`);
        await refresh(['indents', 'logistics'], false);
        onClose();
      } else {
        throw new Error(result.error || "Logistics batch insert failed");
      }
    } catch (err) {
      console.error("Failed to save logistics:", err);
      toast.error(err.message || "Failed to save logistics details to database.");
    } finally {
      setIsSubmitting(false);
      if (endSync) endSync();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>

      <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>Arrange Logistics</Typography>
            {record && (
              <Typography variant="caption" color="text.secondary">
                {record.poNumber} · {record.partyName}
                {productRows.length > 1 ? ` · ${productRows.length} items` : ''}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <Box component="form" id="logistics-form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>
          
          {/* ── Items & Lifting Details Table ─────────────────────────────────────── */}
          <SectionLabel>Items & Lifting Details</SectionLabel>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>S.NO.</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>GROUP</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>ITEM</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>UNIT</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, width: 150 }}>LIFTING QUANTITY *</TableCell>
                  {productRows.length > 1 && (
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, width: 70 }}>ACTION</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {productRows.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{row.groupName || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{row.itemName}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{row.unit || 'KGS'}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                        inputProps={{ min: 1, max: row.maxQuantity, style: { fontSize: '0.8rem', padding: '4px 8px' } }}
                        helperText={`Max: ${row.maxQuantity}`}
                        FormHelperTextProps={{ sx: { fontSize: '0.65rem', m: 0, mt: 0.2 } }}
                      />
                    </TableCell>
                    {productRows.length > 1 && (
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleRemoveRow(row.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <SectionLabel>Logistics Details</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Transporter Name <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField fullWidth size="small"
                  {...register('transporterName', { required: 'Required' })}
                  error={!!errors.transporterName} helperText={errors.transporterName?.message} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Vehicle No. <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField fullWidth size="small"
                  {...register('vehicleNo', { required: 'Required' })}
                  error={!!errors.vehicleNo} helperText={errors.vehicleNo?.message} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Driver No. <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField fullWidth size="small" type="tel"
                  {...register('driverNo', { required: 'Required' })}
                  error={!!errors.driverNo} helperText={errors.driverNo?.message} />
              </Grid>

              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Bilty No. <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField fullWidth size="small"
                  {...register('biltyNo', { required: 'Required' })}
                  error={!!errors.biltyNo} helperText={errors.biltyNo?.message} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Transporting Amount
                </Typography>
                <TextField fullWidth size="small" type="number"
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  {...register('transportingAmount')} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Party Location Link
                </Typography>
                <TextField fullWidth size="small"
                  {...register('locationLink')} />
              </Grid>

              <Grid item xs={8}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Party Address <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField fullWidth size="small" multiline rows={2}
                  {...register('partyAddress', { required: 'Required' })}
                  error={!!errors.partyAddress} helperText={errors.partyAddress?.message} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Bilty Image (Optional)
                </Typography>
                <input accept="image/*,.pdf" style={{ display: 'none' }} id="arrange-bilty-upload" type="file" onChange={handleFileChange} />
                <label htmlFor="arrange-bilty-upload">
                  <Box sx={{
                    border: '2px dashed', borderColor: biltyImageFile ? 'success.main' : 'divider',
                    borderRadius: 2, p: 1, textAlign: 'center', cursor: 'pointer',
                    bgcolor: biltyImageFile ? 'success.50' : 'grey.50',
                    height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
                  }}>
                    {biltyImageFile ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={600} color="success.main" noWrap sx={{ maxWidth: '100px' }}>{biltyImageFile.name}</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudUploadIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>Upload Bilty</Typography>
                      </Box>
                    )}
                  </Box>
                </label>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
          <Button type="submit" form="logistics-form" variant="contained" color="success" disabled={isSubmitting} sx={{ minWidth: 150, height: 38 }}>
            {isSubmitting ? 'Saving...' : 'Save & Submit'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

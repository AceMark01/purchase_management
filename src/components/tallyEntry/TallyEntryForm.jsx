import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, IconButton, Grid, MenuItem, Divider, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { useData } from '../../contexts/DataContext';
import { gasApi } from '../../services/gasApi';
import { formatTimestamp } from '../../utils/formatters';
import { toast } from 'react-toastify';

const SectionLabel = ({ children }) => (
  <Typography variant="caption" fontWeight={700} color="text.secondary"
    sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
    {children}
  </Typography>
);

export default function TallyEntryForm({ open, onClose, record, groupIds }) {
  const allRecords = useSelector((state) => state.workflow.records) || [];
  const { refresh, updateRow } = useData();
  
  const [poFile, setPoFile] = useState(null);
  const [biltyFile, setBiltyFile] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      status: 'Complete',
      plannedDateTime: '',
      remarks: '',
    }
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'po') setPoFile(file);
      if (type === 'bilty') setBiltyFile(file);
      if (type === 'invoice') setInvoiceFile(file);
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
    const ids = groupIds?.length ? groupIds : [record.id];
    const matchedRecords = allRecords.filter(r => ids.includes(r.id));

    setIsSubmitting(true);
    const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

    let poUrl = '';
    let biltyUrl = '';
    let invoiceUrl = '';

    try {
      if (poFile && folderId) {
        const base64Data = await fileToBase64(poFile);
        const res = await gasApi.uploadFile({ base64Data, fileName: poFile.name, mimeType: poFile.type, folderId });
        if (res.success) poUrl = res.fileUrl;
      }
      if (biltyFile && folderId) {
        const base64Data = await fileToBase64(biltyFile);
        const res = await gasApi.uploadFile({ base64Data, fileName: biltyFile.name, mimeType: biltyFile.type, folderId });
        if (res.success) biltyUrl = res.fileUrl;
      }
      if (invoiceFile && folderId) {
        const base64Data = await fileToBase64(invoiceFile);
        const res = await gasApi.uploadFile({ base64Data, fileName: invoiceFile.name, mimeType: invoiceFile.type, folderId });
        if (res.success) invoiceUrl = res.fileUrl;
      }

      const actualTime = new Date();
      const plannedTime = new Date(data.plannedDateTime);
      const diffMs = actualTime - plannedTime;
      const totalSeconds = Math.floor(Math.abs(diffMs) / 1000);
      const hh = Math.floor(totalSeconds / 3600);
      const mm = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
      const ss = (totalSeconds % 60).toString().padStart(2, '0');
      const timeDelay = `${hh}:${mm}:${ss}`;

      for (const rec of matchedRecords) {
        if (rec._receivingRow) {
          await updateRow('receiving', rec._receivingRow, {
            "Planned 3": formatTimestamp(data.plannedDateTime),
            "Actual 3": formatTimestamp(actualTime),
            "Time Delay 3": timeDelay,
            "Status": data.status,
            "PO Attach": poUrl || "",
            "Bilty Attach": biltyUrl || "",
            "Invoice Attach": invoiceUrl || "",
          });
        }
      }
      toast.success(`Tally Entry finalised! ${matchedRecords.length} item(s) — workflow complete.`);
      await refresh();
      onClose();
    } catch (err) {
      console.error("Failed to finalise tally entry:", err);
      toast.error(err.message || "Failed to save tally entry status to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: '720px',
          maxWidth: '96vw',
          maxHeight: '92vh',
        }
      }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'secondary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FactCheckOutlinedIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>Complete Tally Entry</Typography>
            {record && (
              <Typography variant="caption" color="text.secondary">Indent: {record.indentNumber} &nbsp;·&nbsp; {record.itemName}</Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <Box component="form" id="tally-form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>
          
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Please confirm the Tally Entry status for <strong>{record?.indentNumber}</strong>. This is the final step in the workflow process.
            </Typography>
          </Box>

          {/* Section 1: Verification Status */}
          <SectionLabel>Verification Status</SectionLabel>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth size="small" label="Confirmation Status *"
                defaultValue="Complete"
                {...register('status', { required: 'Status is required' })}
                error={!!errors.status} helperText={errors.status?.message}
              >
                <MenuItem value="Complete">Complete</MenuItem>
                <MenuItem value="Not Complete">Not Complete</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Planned DateTime *"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                {...register('plannedDateTime', { required: 'Planned DateTime is required' })}
                error={!!errors.plannedDateTime} helperText={errors.plannedDateTime?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Final Remarks" multiline rows={2}
                placeholder="Any final notes before closing the workflow..."
                {...register('remarks')}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />
          
          <SectionLabel>Tally Document Attachments</SectionLabel>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.75 }}>
                PO Attach
              </Typography>
              <input accept="image/*,.pdf" style={{ display: 'none' }} id="po-file-upload" type="file" onChange={(e) => handleFileChange(e, 'po')} />
              <label htmlFor="po-file-upload">
                <Box sx={{
                  border: '2px dashed', borderColor: poFile ? 'success.main' : 'divider',
                  borderRadius: 2, p: 2, textAlign: 'center', cursor: 'pointer',
                  bgcolor: poFile ? 'success.50' : 'grey.50',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
                }}>
                  {poFile ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18 }} />
                      <Typography variant="caption" fontWeight={600} color="success.main" noWrap>{poFile.name}</Typography>
                    </Box>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ fontSize: 24, color: 'text.disabled', mb: 0.5 }} />
                      <Typography variant="caption" display="block" color="text.secondary">Upload PO Doc</Typography>
                    </>
                  )}
                </Box>
              </label>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.75 }}>
                Bilty Attach
              </Typography>
              <input accept="image/*,.pdf" style={{ display: 'none' }} id="bilty-file-upload" type="file" onChange={(e) => handleFileChange(e, 'bilty')} />
              <label htmlFor="bilty-file-upload">
                <Box sx={{
                  border: '2px dashed', borderColor: biltyFile ? 'success.main' : 'divider',
                  borderRadius: 2, p: 2, textAlign: 'center', cursor: 'pointer',
                  bgcolor: biltyFile ? 'success.50' : 'grey.50',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
                }}>
                  {biltyFile ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18 }} />
                      <Typography variant="caption" fontWeight={600} color="success.main" noWrap>{biltyFile.name}</Typography>
                    </Box>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ fontSize: 24, color: 'text.disabled', mb: 0.5 }} />
                      <Typography variant="caption" display="block" color="text.secondary">Upload Bilty Doc</Typography>
                    </>
                  )}
                </Box>
              </label>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.75 }}>
                Invoice Attach
              </Typography>
              <input accept="image/*,.pdf" style={{ display: 'none' }} id="invoice-file-upload" type="file" onChange={(e) => handleFileChange(e, 'invoice')} />
              <label htmlFor="invoice-file-upload">
                <Box sx={{
                  border: '2px dashed', borderColor: invoiceFile ? 'success.main' : 'divider',
                  borderRadius: 2, p: 2, textAlign: 'center', cursor: 'pointer',
                  bgcolor: invoiceFile ? 'success.50' : 'grey.50',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
                }}>
                  {invoiceFile ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18 }} />
                      <Typography variant="caption" fontWeight={600} color="success.main" noWrap>{invoiceFile.name}</Typography>
                    </Box>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ fontSize: 24, color: 'text.disabled', mb: 0.5 }} />
                      <Typography variant="caption" display="block" color="text.secondary">Upload Invoice</Typography>
                    </>
                  )}
                </Box>
              </label>
            </Grid>
          </Grid>
        </DialogContent>

        {/* ── Footer ── */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="tally-form" variant="contained" color="secondary" sx={{ minWidth: 150, height: 38 }} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

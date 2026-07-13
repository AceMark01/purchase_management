import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, IconButton, Grid, MenuItem, Divider, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
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

export default function LiftReceiverForm({ open, onClose, record, groupIds }) {
  const allRecords = useSelector((state) => state.workflow.records) || [];
  const { refresh, updateRow } = useData();
  const [receiverFile, setReceiverFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      status: 'Completed',
      receiverImage: null,
      remarks: '',
    }
  });

  const receiverImageFile = watch('receiverImage');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiverFile(file);
      setValue('receiverImage', { name: file.name, url: URL.createObjectURL(file) });
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const onSubmit = async (data) => {
    if (!record || !record.liftNo) {
      toast.error("Lift Number not found for verification.");
      return;
    }

    const ids = groupIds?.length ? groupIds : [record.id];
    const matchedRecords = allRecords.filter(r => ids.includes(r.id));

    setIsSubmitting(true);
    let receiverImageUrl = '';
    const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

    if (receiverFile && folderId) {
      try {
        const base64Data = await fileToBase64(receiverFile);
        const uploadRes = await gasApi.uploadFile({
          base64Data,
          fileName: receiverFile.name,
          mimeType: receiverFile.type,
          folderId,
        });
        if (uploadRes.success) {
          receiverImageUrl = uploadRes.fileUrl;
        }
      } catch (err) {
        console.error("Failed to upload receiver verification image:", err);
        toast.warning("Failed to upload image to Google Drive, proceeding without upload.");
      }
    }

    try {
      let updatedCount = 0;
      for (const rec of matchedRecords) {
        if (rec._receivingRow) {
          await updateRow('receiving', rec._receivingRow, {
            "Actual 2": formatTimestamp(),
            "lift Status": data.status,
            "Lifted Image": receiverImageUrl || (receiverFile ? receiverFile.name : '')
          });
          updatedCount++;
        }
      }

      if (updatedCount === 0) {
        toast.error("No receiving row indexes found for the selected records.");
        setIsSubmitting(false);
        return;
      }

      toast.success(`Lift Receiver verified for ${updatedCount} item(s)!`);
      await refresh();
      onClose();
    } catch (err) {
      console.error("Failed to verify lift:", err);
      toast.error(err.message || "Failed to save verification status to database.");
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
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'warning.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MoveToInboxIcon sx={{ color: 'warning.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>Lift Receiver Verification</Typography>
            {record && (
              <Typography variant="caption" color="text.secondary">Indent: {record.indentNumber} &nbsp;·&nbsp; {record.itemName}</Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <Box component="form" id="receiver-form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>

          {/* Section 1: Verification Status */}
          <SectionLabel>Verification Status</SectionLabel>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth size="small" label="Confirmation Status *"
                defaultValue="Completed"
                {...register('status', { required: 'Status is required' })}
                error={!!errors.status} helperText={errors.status?.message}
                SelectProps={{ MenuProps: { PaperProps: { sx: { minWidth: 220 } } } }}
              >
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Not Completed">Not Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* Reserved for future field */}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Remarks" multiline rows={3}
                placeholder="Any observations or notes about the lift receiver process..."
                {...register('remarks')}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2.5 }} />

          {/* Section 2: Document Upload */}
          <SectionLabel>Receiver Image / Document</SectionLabel>
          <input accept="image/*" style={{ display: 'none' }} id="receiver-image-upload" type="file" onChange={handleFileChange} />
          <label htmlFor="receiver-image-upload">
            <Box sx={{
              border: '2px dashed', borderColor: receiverImageFile ? 'success.main' : 'divider',
              borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer',
              bgcolor: receiverImageFile ? 'success.50' : 'grey.50',
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
            }}>
              {receiverImageFile ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
                  <Typography variant="body2" fontWeight={600} color="success.main">{receiverImageFile.name}</Typography>
                </Box>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Click to upload Receiver Image</Typography>
                  <Typography variant="caption" color="text.disabled">JPG, PNG accepted</Typography>
                </>
              )}
            </Box>
          </label>

        </DialogContent>

        {/* ── Footer ── */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
          <Button type="submit" form="receiver-form" variant="contained" color="warning" disabled={isSubmitting} sx={{ minWidth: 150, height: 38, color: 'white' }}>
            {isSubmitting ? 'Saving...' : 'Save & Submit'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

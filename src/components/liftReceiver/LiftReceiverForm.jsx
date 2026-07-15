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
    const folderId = import.meta.env.VITE_FOLDER_LIFTED;

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
      const actualTime = new Date();
      let updatedCount = 0;
      for (const rec of matchedRecords) {
        if (rec._receivingRow) {
          const recPlannedStr = rec.liftPlanned ? String(rec.liftPlanned).trim().replace(' ', 'T') : '';
          let timeDelay = '00:00:00';
          if (recPlannedStr) {
            const recPlannedTime = new Date(recPlannedStr);
            if (!isNaN(recPlannedTime.getTime())) {
              const diffMs = actualTime - recPlannedTime;
              const totalSeconds = Math.floor(Math.abs(diffMs) / 1000);
              const hh = Math.floor(totalSeconds / 3600);
              const mm = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
              const ss = (totalSeconds % 60).toString().padStart(2, '0');
              timeDelay = `${hh}:${mm}:${ss}`;
            }
          }

          await updateRow('receiving', rec._receivingRow, {
            "Actual 2": formatTimestamp(actualTime),
            "Time Delay 2": timeDelay,
            "lift Status": "Completed",
            "Lifted Image": receiverImageUrl || (receiverFile ? receiverFile.name : ''),
            "Remarks": data.remarks || ""
          }, false);
          updatedCount++;
        }
      }

      if (updatedCount === 0) {
        toast.error("No receiving row indexes found for the selected records.");
        setIsSubmitting(false);
        return;
      }

      toast.success(`Lift Receiver verified for ${updatedCount} item(s)!`);
      await refresh(['indents', 'receiving'], false);
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
          borderRadius: 4,
          width: '720px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          boxShadow: '0px 20px 40px rgba(0,0,0,0.1)'
        }
      }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2.5, bgcolor: 'warning.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <DialogContent sx={{ px: 3, py: 3, overflowY: 'auto' }}>
          
          <Grid container spacing={3}>
            {/* Left Column: Image Upload */}
            <Grid item xs={12} md={6}>
              <SectionLabel>Lifted Image</SectionLabel>
              <input accept="image/*" style={{ display: 'none' }} id="receiver-image-upload" type="file" onChange={handleFileChange} />
              <label htmlFor="receiver-image-upload">
                <Box sx={{
                  border: '2px dashed', borderColor: receiverImageFile ? 'success.main' : 'divider',
                  borderRadius: 3, p: 4, height: '170px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  bgcolor: receiverImageFile ? 'success.50' : 'grey.50',
                  transition: 'all 0.25s ease',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50', transform: 'translateY(-2px)' }
                }}>
                  {receiverImageFile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 32 }} />
                      <Typography variant="body2" fontWeight={600} color="success.main" noWrap sx={{ maxWidth: 220 }}>
                        {receiverImageFile.name}
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>Upload Lifted Image</Typography>
                      <Typography variant="caption" color="text.disabled">JPG, PNG accepted</Typography>
                    </>
                  )}
                </Box>
              </label>
            </Grid>

            {/* Right Column: Remarks */}
            <Grid item xs={12} md={6}>
              <SectionLabel>Remarks</SectionLabel>
              <TextField
                fullWidth size="small" multiline rows={7}
                placeholder="Enter any observations, notes, or details about the lifted material..."
                {...register('remarks')}
                InputProps={{
                  sx: { borderRadius: 3, bgcolor: 'background.paper' }
                }}
              />
            </Grid>
          </Grid>

        </DialogContent>

        {/* ── Footer ── */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38, borderRadius: 2 }}>Cancel</Button>
          <Button type="submit" form="receiver-form" variant="contained" color="warning" disabled={isSubmitting} sx={{ minWidth: 150, height: 38, color: 'white', borderRadius: 2 }}>
            {isSubmitting ? 'Saving...' : 'Save & Submit'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

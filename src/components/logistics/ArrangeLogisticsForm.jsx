import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, IconButton, Grid, InputAdornment, Divider, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { toast } from 'react-toastify';
import { completeStage, updateRecord } from '../../store/slices/workflowSlice';

const SectionLabel = ({ children }) => (
  <Typography variant="caption" fontWeight={700} color="text.secondary"
    sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
    {children}
  </Typography>
);

export default function ArrangeLogisticsForm({ open, onClose, record, groupIds }) {
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      transporterName: '',
      partyAddress: '',
      locationLink: '',
      vehicleNo: '',
      driverName: '',
      driverNo: '',
      biltyNo: '',
      biltyImage: null,
      transportingAmount: '',
    }
  });

  const biltyImageFile = watch('biltyImage');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setValue('biltyImage', { name: file.name, url: fileUrl });
    }
  };

  const onSubmit = (data) => {
    const ids = groupIds?.length ? groupIds : [record.id];
    ids.forEach(id => {
      dispatch(updateRecord({ id, logisticsDetails: data }));
      dispatch(completeStage({ id, currentStage: 'logistics', nextStageOverride: 'receiveMaterial' }));
    });
    toast.success(`Logistics arranged! ${ids.length} item(s) moved to Receive Material.`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: 3,
          width: '820px',
          maxWidth: '96vw',
          maxHeight: '92vh',
        }
      }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'success.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LocalShippingIcon sx={{ color: 'success.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>Arrange Logistics & Get Lifting</Typography>
            {record && (
              <Typography variant="caption" color="text.secondary">Indent: {record.indentNumber} &nbsp;·&nbsp; {record.itemName}</Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <Box component="form" id="logistics-form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>

          {/* Section 1: Transporter Details */}
          <SectionLabel>Transporter Details</SectionLabel>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Transporter Name *"
                {...register('transporterName', { required: 'Required' })}
                error={!!errors.transporterName} helperText={errors.transporterName?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Vehicle No. *"
                {...register('vehicleNo', { required: 'Required' })}
                error={!!errors.vehicleNo} helperText={errors.vehicleNo?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Driver Name *"
                {...register('driverName', { required: 'Required' })}
                error={!!errors.driverName} helperText={errors.driverName?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Driver Contact No. *" type="tel"
                {...register('driverNo', { required: 'Required' })}
                error={!!errors.driverNo} helperText={errors.driverNo?.message} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2.5 }} />

          {/* Section 2: Shipment Details */}
          <SectionLabel>Shipment Details</SectionLabel>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Bilty No. *"
                {...register('biltyNo', { required: 'Required' })}
                error={!!errors.biltyNo} helperText={errors.biltyNo?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Transporting Amount"
                type="number"
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                {...register('transportingAmount')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Party Address *" multiline rows={2}
                {...register('partyAddress', { required: 'Required' })}
                error={!!errors.partyAddress} helperText={errors.partyAddress?.message} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Location Link (Google Maps URL)"
                {...register('locationLink')} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2.5 }} />

          {/* Section 3: Document Upload */}
          <SectionLabel>Bilty Document</SectionLabel>
          <input accept="image/*,.pdf" style={{ display: 'none' }} id="bilty-file-upload" type="file" onChange={handleFileChange} />
          <label htmlFor="bilty-file-upload">
            <Box sx={{
              border: '2px dashed', borderColor: biltyImageFile ? 'success.main' : 'divider',
              borderRadius: 2, p: 2.5, textAlign: 'center', cursor: 'pointer',
              bgcolor: biltyImageFile ? 'success.50' : 'grey.50',
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
            }}>
              {biltyImageFile ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
                  <Typography variant="body2" fontWeight={600} color="success.main">{biltyImageFile.name}</Typography>
                </Box>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Click to upload Bilty Image</Typography>
                  <Typography variant="caption" color="text.disabled">JPG, PNG, PDF accepted</Typography>
                </>
              )}
            </Box>
          </label>

        </DialogContent>

        {/* ── Footer ── */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
          <Button type="submit" form="logistics-form" variant="contained" color="success" sx={{ minWidth: 150, height: 38 }}>
            Save & Submit
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

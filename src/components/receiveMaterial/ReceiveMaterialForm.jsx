import React from 'react';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, IconButton, Grid, RadioGroup,
  FormControlLabel, Radio, FormControl, FormLabel, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { toast } from 'react-toastify';
import { completeStage, updateRecord } from '../../store/slices/workflowSlice';

const SectionLabel = ({ children }) => (
  <Typography variant="caption" fontWeight={700} color="text.secondary"
    sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
    {children}
  </Typography>
);

export default function ReceiveMaterialForm({ open, onClose, record, groupIds }) {
  const dispatch = useDispatch();
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, control } = useForm({
    defaultValues: {
      productName: record?.itemName || '',
      quantity: record?.quantity || '',
      billNo: '',
      billImage: null,
      qualityCondition: 'Good',
    }
  });

  const billImageFile = watch('billImage');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setValue('billImage', { name: file.name, url: fileUrl });
    }
  };

  const onSubmit = (data) => {
    const ids = groupIds?.length ? groupIds : [record.id];
    ids.forEach(id => {
      dispatch(updateRecord({ id, receivingDetails: data }));
      dispatch(completeStage({ id, currentStage: 'receiveMaterial', nextStageOverride: 'liftReceiver' }));
    });
    toast.success(`Material received! ${ids.length} item(s) moved to Lift Receiver.`);
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
          width: '800px',
          maxWidth: '96vw',
          maxHeight: '92vh',
        }
      }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'info.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inventory2OutlinedIcon sx={{ color: 'info.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>Receive Material Verification</Typography>
            {record && (
              <Typography variant="caption" color="text.secondary">Indent: {record.indentNumber} &nbsp;·&nbsp; {record.itemName}</Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <Box component="form" id="receive-form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>

          {/* Section 1: Material Info */}
          <SectionLabel>Material Information</SectionLabel>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mb: 3 }}>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Product Name
              </Typography>
              <TextField fullWidth
                value={record?.itemName || ''}
                InputProps={{ readOnly: true, sx: { bgcolor: 'action.hover', '& input': { color: 'text.secondary', fontWeight: 600 } } }}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Quantity <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField fullWidth type="number"
                {...register('quantity', { required: 'Required' })}
                error={!!errors.quantity} helperText={errors.quantity?.message} />
            </Box>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* Section 2: Bill & Quality */}
          <SectionLabel>Bill & Quality Details</SectionLabel>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mb: 3 }}>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Bill No. <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField fullWidth
                {...register('billNo', { required: 'Required' })}
                error={!!errors.billNo} helperText={errors.billNo?.message} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Quality Condition <span style={{ color: 'red' }}>*</span>
              </Typography>
              <FormControl component="fieldset" error={!!errors.qualityCondition} sx={{ width: '100%' }}>
                <Controller
                  name="qualityCondition"
                  control={control}
                  rules={{ required: 'Required' }}
                  render={({ field }) => (
                    <RadioGroup row {...field}>
                      <FormControlLabel value="Good" control={<Radio size="small" color="success" />} label={<Typography variant="body2">Good</Typography>} />
                      <FormControlLabel value="Average" control={<Radio size="small" color="warning" />} label={<Typography variant="body2">Average</Typography>} />
                      <FormControlLabel value="Bad" control={<Radio size="small" color="error" />} label={<Typography variant="body2">Bad</Typography>} />
                    </RadioGroup>
                  )}
                />
              </FormControl>
            </Box>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* Section 3: Bill Upload */}
          <SectionLabel>Bill Document</SectionLabel>
          <input accept="image/*,.pdf" style={{ display: 'none' }} id="bill-file-upload" type="file" onChange={handleFileChange} />
          <label htmlFor="bill-file-upload">
            <Box sx={{
              border: '2px dashed', borderColor: billImageFile ? 'success.main' : 'divider',
              borderRadius: 2, p: 2.5, textAlign: 'center', cursor: 'pointer',
              bgcolor: billImageFile ? 'success.50' : 'grey.50',
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
            }}>
              {billImageFile ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
                  <Typography variant="body2" fontWeight={600} color="success.main">{billImageFile.name}</Typography>
                </Box>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Click to upload Bill Image</Typography>
                  <Typography variant="caption" color="text.disabled">JPG, PNG, PDF accepted</Typography>
                </>
              )}
            </Box>
          </label>

        </DialogContent>

        {/* ── Footer ── */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
          <Button type="submit" form="receive-form" variant="contained" color="primary" sx={{ minWidth: 150, height: 38 }}>
            Save & Submit
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

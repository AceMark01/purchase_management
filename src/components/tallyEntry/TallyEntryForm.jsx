import React from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, IconButton, Grid, MenuItem, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { toast } from 'react-toastify';
import { completeStage, updateRecord } from '../../store/slices/workflowSlice';

const SectionLabel = ({ children }) => (
  <Typography variant="caption" fontWeight={700} color="text.secondary"
    sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
    {children}
  </Typography>
);

export default function TallyEntryForm({ open, onClose, record, groupIds }) {
  const dispatch = useDispatch();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      status: 'Completed',
      remarks: '',
    }
  });

  const onSubmit = (data) => {
    const ids = groupIds?.length ? groupIds : [record.id];
    ids.forEach(id => {
      dispatch(updateRecord({ id, tallyEntryDetails: data }));
      dispatch(completeStage({ id, currentStage: 'tallyEntry' }));
    });
    toast.success(`Tally Entry finalised! ${ids.length} item(s) — workflow complete.`);
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
          width: '650px',
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
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>Complete Tally Entry</Typography>
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
            <Grid item xs={12}>
              <TextField
                select fullWidth size="small" label="Confirmation Status *"
                defaultValue="Completed"
                {...register('status', { required: 'Status is required' })}
                error={!!errors.status} helperText={errors.status?.message}
              >
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Not Completed">Not Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Final Remarks" multiline rows={3}
                placeholder="Any final notes before closing the workflow..."
                {...register('remarks')}
              />
            </Grid>
          </Grid>
        </DialogContent>

        {/* ── Footer ── */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
          <Button type="submit" form="tally-form" variant="contained" color="secondary" sx={{ minWidth: 150, height: 38 }}>
            Confirm & Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

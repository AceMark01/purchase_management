import { useForm, Controller } from 'react-hook-form';
import { useDispatch }         from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Typography
} from '@mui/material';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import { completeStage, updateRecord } from '../../store/slices/workflowSlice';
import { toast } from 'react-toastify';

const SectionLabel = ({ children }) => (
  <Typography variant="caption" fontWeight={700} color="text.secondary"
    sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
    {children}
  </Typography>
);

// groupIds = all record IDs that belong to this PO group
export default function CompleteFollowUpForm({ open, onClose, selectedRow, groupIds }) {
  const dispatch = useDispatch();

  const { control, handleSubmit, watch, register, formState: { errors } } = useForm({
    defaultValues: {
      followUpStatus:       '',
      followUpBy:           '',
      expectedArrivalDate:  '',
      nextFollowDate:       '',
      remarks:              '',
    },
  });

  const followUpStatus = watch('followUpStatus');

  const onSubmit = (data) => {
    if (!selectedRow) return;
    const ids = groupIds?.length ? groupIds : [selectedRow.id];

    if (data.followUpStatus === 'Arrange Logistics') {
      ids.forEach(id => {
        dispatch(updateRecord({ id, followUpDetails: data, followUpType: 'logistics' }));
        dispatch(completeStage({ id, currentStage: 'followUp', nextStageOverride: 'logistics' }));
      });
      toast.success(`Follow-up done! ${ids.length} item(s) moved to Arrange Logistics.`);
      onClose();

    } else if (data.followUpStatus === 'Direct Receiving') {
      ids.forEach(id => {
        dispatch(updateRecord({ id, followUpDetails: data, followUpType: 'directReceiving' }));
        dispatch(completeStage({ id, currentStage: 'followUp', nextStageOverride: 'logistics' }));
      });
      toast.success(`Follow-up done! ${ids.length} item(s) moved to Logistics (Direct Receiving).`);
      onClose();

    } else if (data.followUpStatus === 'Further Follow Up') {
      ids.forEach(id => dispatch(updateRecord({ id, followUpDetails: data })));
      toast.success('Further follow-up scheduled. Record remains Pending.');
      onClose();

    } else if (data.followUpStatus === 'Cancel') {
      ids.forEach(id => dispatch(updateRecord({ id, followUpDetails: data, status: 'Cancelled' })));
      toast.info('Follow-up cancelled.');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false}
      PaperProps={{ sx: { borderRadius: 3, width: '750px', maxWidth: '96vw', maxHeight: '92vh' } }}>

      <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCallbackIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>Complete Follow-Up</Typography>
            {selectedRow && (
              <Typography variant="caption" color="text.secondary">
                {selectedRow.poNumber} · {selectedRow.partyName}
                {(groupIds?.length || 0) > 1 ? ` · ${groupIds.length} items` : ''}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <Box component="form" id="followup-form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>
          <SectionLabel>Follow Up Information</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            <Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                Follow Up Status <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Controller name="followUpStatus" control={control} rules={{ required: 'Required' }}
                render={({ field }) => (
                  <TextField {...field} select fullWidth error={!!errors.followUpStatus} helperText={errors.followUpStatus?.message}>
                    <MenuItem value="Arrange Logistics">Arrange Logistics</MenuItem>
                    <MenuItem value="Direct Receiving">Direct Receiving</MenuItem>
                    <MenuItem value="Further Follow Up">Further Follow Up</MenuItem>
                    <MenuItem value="Cancel">Cancel</MenuItem>
                  </TextField>
                )} />
            </Box>

            {followUpStatus && followUpStatus !== 'Cancel' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                    Follow Up By <span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <TextField fullWidth
                    {...register('followUpBy', { required: 'Required' })}
                    error={!!errors.followUpBy} helperText={errors.followUpBy?.message} />
                </Box>
                {followUpStatus === 'Arrange Logistics' && (
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Expected Arrival Date <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth type="date"
                      {...register('expectedArrivalDate', { required: 'Required' })}
                      error={!!errors.expectedArrivalDate} helperText={errors.expectedArrivalDate?.message} />
                  </Box>
                )}
              </Box>
            )}

            {followUpStatus && (
              <Box>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Remarks <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField fullWidth multiline rows={3}
                  {...register('remarks', { required: 'Remarks are required' })}
                  error={!!errors.remarks} helperText={errors.remarks?.message} />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
          <Button type="submit" form="followup-form" variant="contained" color="primary" sx={{ minWidth: 150, height: 38 }}>
            Submit Follow-Up
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Typography,
  Grid, InputAdornment, Divider
} from '@mui/material';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { useData } from '../../contexts/DataContext';
import { formatTimestamp } from '../../utils/formatters';
import { toast } from 'react-toastify';
import { gasApi } from '../../services/gasApi';

const SectionLabel = ({ children }) => (
  <Typography variant="caption" fontWeight={700} color="text.secondary"
    sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}>
    {children}
  </Typography>
);

// groupIds = all record IDs that belong to this PO group
export default function CompleteFollowUpForm({ open, onClose, selectedRow, groupIds }) {
  const dispatch = useDispatch();
  const allRecords = useSelector((state) => state.workflow.records) || [];
  const { refresh, updateRow, headers } = useData();

  const [biltyFile, setBiltyFile] = useState(null);
  const [billFile, setBillFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, register, setValue, formState: { errors } } = useForm({
    defaultValues: {
      followUpStatus: '',
      followUpBy: '',
      expectedArrivalDate: '',
      nextFollowDate: '',
      remarks: '',
      transporterName: '',
      vehicleNo: '',
      driverNo: '',
      biltyNo: '',
      biltyImage: null,
      transportingAmount: '',
      partyAddress: '',
      locationLink: '',
      quantity: '',
      billNo: '',
      billImage: null,
      qualityCondition: 'Good',
    },
  });

  const followUpStatus = watch('followUpStatus');
  const biltyImageFile = watch('biltyImage');
  const billImageFile = watch('billImage');

  useEffect(() => {
    if (open) {
      setBiltyFile(null);
      setBillFile(null);
      setIsSubmitting(false);
      if (selectedRow) {
        setValue('partyAddress', selectedRow.partyAddress || '');
        setValue('locationLink', selectedRow.locationLink || '');
        setValue('quantity', selectedRow.quantity || '');
        setValue('billNo', '');
        setValue('billImage', null);
        setValue('qualityCondition', 'Good');
      }
    }
  }, [open, selectedRow, setValue]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBiltyFile(file);
      setValue('biltyImage', { name: file.name, url: URL.createObjectURL(file) });
    }
  };

  const handleBillFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBillFile(file);
      setValue('billImage', { name: file.name, url: URL.createObjectURL(file) });
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const onSubmit = async (data) => {
    if (!selectedRow) return;
    const ids = groupIds?.length ? groupIds : [selectedRow.id];
    const matchedRecords = allRecords.filter(r => ids.includes(r.id));

    setIsSubmitting(true);
    try {
      // Other statuses (Direct Receiving, Arrange Logistics, Further Follow Up, Cancel): submit to Flw-up sheet
      const headersList = headers?.followUps || [
        "Timestamp",
        "Indent No.",
        "S-No.",
        "Follow-up Status",
        "Excepted Arrival Date",
        "Remark",
        "Follow Up By",
        "Next Follow-up Date",
        "Actual"
      ];

      const timestamp = formatTimestamp();

      const rowsData = matchedRecords.map(record => {
        const rowObj = {
          "Timestamp": timestamp,
          "Indent No.": record.indentNumber,
          "S-No.": record.serialNo,
          "Follow-up Status": data.followUpStatus,
          "Excepted Arrival Date": "",
          "Remark": data.remarks,
          "Follow Up By": data.followUpBy,
          "Next Follow-up Date": (data.followUpStatus === 'Further Follow Up' || data.followUpStatus === 'Arrange Logistics' || data.followUpStatus === 'Direct Receiving') ? data.nextFollowDate : '',
          "CodeNO": "",
          "Actual": (data.followUpStatus === 'Further Follow Up' || data.followUpStatus === 'Arrange Logistics' || data.followUpStatus === 'Direct Receiving') ? "" : timestamp
        };
        return headersList.map(h => rowObj[h] !== undefined ? rowObj[h] : "");
      });

      const result = await gasApi.batchInsert("Flw-up", rowsData);
      if (!result.success) {
        throw new Error(result.error || "Batch insert failed");
      }

      // If user cancelled, also update the indent status in the main sheet
      if (data.followUpStatus === 'Cancel') {
        for (const record of matchedRecords) {
          await updateRow('indents', record.id, {
            "Order Cancel": "Cancel"
          });
        }
      }

      toast.success('Follow-up status recorded successfully!');

      await refresh();
      onClose();
    } catch (err) {
      console.error("Failed to save follow-up:", err);
      toast.error(err.message || "Failed to save follow-up record to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>

      <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCallbackIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>Complete Follow-Up</Typography>
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

            <Grid container spacing={2.5}>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Follow Up Status <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Controller name="followUpStatus" control={control} rules={{ required: 'Required' }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth size="small" error={!!errors.followUpStatus} helperText={errors.followUpStatus?.message}>
                      <MenuItem value="Arrange Logistics">Arrange Logistics</MenuItem>
                      <MenuItem value="Direct Receiving">Direct Receiving</MenuItem>
                      <MenuItem value="Further Follow Up">Further Follow Up</MenuItem>
                      <MenuItem value="Cancel">Cancel</MenuItem>
                    </TextField>
                  )} />
              </Grid>

              {followUpStatus && followUpStatus !== 'Cancel' && (
                <Grid item xs={4}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                    Follow Up By <span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <TextField fullWidth size="small"
                    {...register('followUpBy', { required: 'Required' })}
                    error={!!errors.followUpBy} helperText={errors.followUpBy?.message} />
                </Grid>
              )}

              {(followUpStatus === 'Further Follow Up' || followUpStatus === 'Arrange Logistics' || followUpStatus === 'Direct Receiving') && (
                <Grid item xs={4}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                    Next Follow Up Date {followUpStatus === 'Further Follow Up' && <span style={{ color: 'red' }}>*</span>}
                  </Typography>
                  <TextField fullWidth type="date" size="small"
                    {...register('nextFollowDate', { required: followUpStatus === 'Further Follow Up' ? 'Required' : false })}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.nextFollowDate} helperText={errors.nextFollowDate?.message} />
                </Grid>
              )}
            </Grid>

            {followUpStatus && (
              <Box>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Remarks <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField fullWidth multiline rows={3} size="small"
                  {...register('remarks', { required: 'Remarks are required' })}
                  error={!!errors.remarks} helperText={errors.remarks?.message} />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSubmitting} sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
          <Button type="submit" form="followup-form" variant="contained" color="primary" disabled={isSubmitting} sx={{ minWidth: 150, height: 38 }}>
            {isSubmitting ? 'Submitting...' : 'Submit Follow-Up'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

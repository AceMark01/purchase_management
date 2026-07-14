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
      if (data.followUpStatus === 'Direct Receiving') {
        // 1. Upload Bilty image (if any)
        let biltyImageUrl = '';
        const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

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

        // 2. Submit to sheet 'LIFT-RECEIVED'
        const logisticsHeaders = headers?.logistics || [
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
          "Party Location Link"
        ];

        const timestamp = formatTimestamp();

        const rowsData = matchedRecords.map(rec => {
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
          };
          return logisticsHeaders.map(h => rowObj[h] !== undefined ? rowObj[h] : "");
        });

        const result = await gasApi.batchInsertLogistics("LIFT-RECEIVED", rowsData);
        if (!result.success || !result.liftNumber) {
          throw new Error(result.error || "Logistics batch insert failed");
        }

        const generatedLiftNumber = result.liftNumber;

        // 3. Upload Bill and submit to RECEIVED-ACCOUNTS
        let billImageUrl = '';
        if (billFile && folderId) {
          try {
            const base64Data = await fileToBase64(billFile);
            const uploadRes = await gasApi.uploadFile({
              base64Data,
              fileName: billFile.name,
              mimeType: billFile.type,
              folderId,
            });
            if (uploadRes.success) {
              billImageUrl = uploadRes.fileUrl;
            }
          } catch (err) {
            console.error("Failed to upload Bill image:", err);
            toast.warning("Failed to upload Bill image to Google Drive, proceeding without upload.");
          }
        }

        const receivingHeaders = headers?.receiving || [
          "Timestamp",
          "Lift No.",
          "Indent No.",
          "Party Name",
          "Product Name",
          "Qty",
          "Product Name2",
          "Qty2",
          "Product Name3",
          "Qty3",
          "Product Name4",
          "Qty4",
          "Product Name5",
          "Qty5",
          "Bill No.",
          "Quality Check",
          "Bill Image",
          "lift Status",
          "Status"
        ];

        const receivingRows = matchedRecords.map(rec => {
          const itemQty = matchedRecords.length === 1 ? Number(data.quantity) : rec.quantity;
          const rowObj = {
            "Timestamp": timestamp,
            "Lift No.": generatedLiftNumber,
            "Indent No.": rec.indentNumber,
            "Party Name": rec.partyName,
            "Product Name": rec.itemName,
            "Qty": itemQty,
            "Product Name2": "",
            "Qty2": "",
            "Product Name3": "",
            "Qty3": "",
            "Product Name4": "",
            "Qty4": "",
            "Product Name5": "",
            "Qty5": "",
            "Bill No.": data.billNo,
            "Quality Check": data.qualityCondition,
            "Bill Image": billImageUrl || (billFile ? billFile.name : ''),
            "lift Status": "Pending",
            "Status": "Pending"
          };
          return receivingHeaders.map(h => rowObj[h] !== undefined ? rowObj[h] : "");
        });

        const recResult = await gasApi.batchInsert("RECEIVED-ACCOUNTS", receivingRows);
        if (!recResult.success) {
          throw new Error(recResult.error || "Receiving batch insert failed");
        }

        // Update Actual2 in INDENT-PO
        for (const rec of matchedRecords) {
          await updateRow('indents', rec.id, {
            "Actual2": timestamp
          }, false);
        }

        toast.success(`Direct Receiving completed! Lift Number ${generatedLiftNumber} generated and received.`);
      } else {
        // Other statuses (Arrange Logistics, Further Follow Up, Cancel): submit to Flw-up sheet
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
            "Next Follow-up Date": (data.followUpStatus === 'Further Follow Up' || data.followUpStatus === 'Arrange Logistics') ? data.nextFollowDate : '',
            "CodeNO": "",
            "Actual": (data.followUpStatus === 'Further Follow Up' || data.followUpStatus === 'Arrange Logistics') ? "" : timestamp
          };
          return headersList.map(h => rowObj[h] !== undefined ? rowObj[h] : "");
        });

        const result = await gasApi.batchInsert("Flw-up", rowsData);
        if (!result.success) {
          throw new Error(result.error || "Batch insert failed");
        }

        // If not Further Follow Up, mark Follow-Up as completed by setting Actual2
        if (data.followUpStatus !== 'Further Follow Up') {
          for (const record of matchedRecords) {
            const updatePayload = {
              "Actual2": timestamp
            };
            if (data.followUpStatus === 'Cancel') {
              updatePayload["Order Cancel"] = "Cancel";
            }
            await updateRow('indents', record.id, updatePayload, false);
          }
        }

        toast.success('Follow-up status recorded successfully!');
      }

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

              {(followUpStatus === 'Further Follow Up' || followUpStatus === 'Arrange Logistics') && (
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

            {followUpStatus === 'Direct Receiving' && (
              <>
                <Divider sx={{ my: 1 }} />
                <SectionLabel>Logistics Details</SectionLabel>
                <Grid container spacing={2.5}>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Transporter Name <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small"
                      {...register('transporterName', { required: followUpStatus === 'Direct Receiving' ? 'Required' : false })}
                      error={!!errors.transporterName} helperText={errors.transporterName?.message} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Vehicle No. <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small"
                      {...register('vehicleNo', { required: followUpStatus === 'Direct Receiving' ? 'Required' : false })}
                      error={!!errors.vehicleNo} helperText={errors.vehicleNo?.message} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Driver No. <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small" type="tel"
                      {...register('driverNo', { required: followUpStatus === 'Direct Receiving' ? 'Required' : false })}
                      error={!!errors.driverNo} helperText={errors.driverNo?.message} />
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Bilty No. <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small"
                      {...register('biltyNo', { required: followUpStatus === 'Direct Receiving' ? 'Required' : false })}
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
                      {...register('partyAddress', { required: followUpStatus === 'Direct Receiving' ? 'Required' : false })}
                      error={!!errors.partyAddress} helperText={errors.partyAddress?.message} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Bilty Image (Optional)
                    </Typography>
                    <input accept="image/*,.pdf" style={{ display: 'none' }} id="complete-bilty-upload" type="file" onChange={handleFileChange} />
                    <label htmlFor="complete-bilty-upload">
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
              </>
            )}

            {followUpStatus === 'Direct Receiving' && (
              <>
                <Divider sx={{ my: 1 }} />
                <SectionLabel>Receiving Details</SectionLabel>
                <Grid container spacing={2.5}>
                  {(!groupIds || groupIds.length <= 1) && (
                    <Grid item xs={4}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                        Received Quantity <span style={{ color: 'red' }}>*</span>
                      </Typography>
                      <TextField fullWidth size="small" type="number"
                        {...register('quantity', { required: followUpStatus === 'Direct Receiving' ? 'Required' : false })}
                        error={!!errors.quantity} helperText={errors.quantity?.message} />
                    </Grid>
                  )}

                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Bill No. <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small"
                      {...register('billNo', { required: followUpStatus === 'Direct Receiving' ? 'Required' : false })}
                      error={!!errors.billNo} helperText={errors.billNo?.message} />
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Quality Check <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <Controller name="qualityCondition" control={control}
                      rules={{ required: followUpStatus === 'Direct Receiving' ? 'Required' : false }}
                      render={({ field }) => (
                        <TextField {...field} select fullWidth size="small" error={!!errors.qualityCondition} helperText={errors.qualityCondition?.message}>
                          <MenuItem value="Good">Good</MenuItem>
                          <MenuItem value="Damaged">Damaged</MenuItem>
                        </TextField>
                      )} />
                  </Grid>

                  {/* Bill Image Upload */}
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Bill Image (Optional)
                    </Typography>
                    <input accept="image/*,.pdf" style={{ display: 'none' }} id="complete-bill-upload" type="file" onChange={handleBillFileChange} />
                    <label htmlFor="complete-bill-upload">
                      <Box sx={{
                        border: '2px dashed', borderColor: billImageFile ? 'success.main' : 'divider',
                        borderRadius: 2, p: 1, textAlign: 'center', cursor: 'pointer',
                        bgcolor: billImageFile ? 'success.50' : 'grey.50',
                        height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
                      }}>
                        {billImageFile ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 20 }} />
                            <Typography variant="body2" fontWeight={600} color="success.main" noWrap sx={{ maxWidth: '100px' }}>{billImageFile.name}</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CloudUploadIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Upload Bill</Typography>
                          </Box>
                        )}
                      </Box>
                    </label>
                  </Grid>
                </Grid>
              </>
            )}

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

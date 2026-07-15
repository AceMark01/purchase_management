import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, IconButton, Grid, Divider, InputAdornment, MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
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

export default function ReceiveMaterialForm({ open, onClose, record, groupIds }) {
  const allRecords = useSelector((state) => state.workflow.records) || [];
  const { refresh, updateRow, headers } = useData();
  const [billFile, setBillFile] = useState(null);
  const [biltyFile, setBiltyFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue, control } = useForm({
    defaultValues: {
      productName: record?.itemName || '',
      quantity: record?.quantity || '',
      billNo: '',
      billImage: null,
      qualityCondition: 'Good',
      transporterName: '',
      vehicleNo: '',
      driverNo: '',
      biltyNo: '',
      biltyImage: null,
      transportingAmount: '',
      partyAddress: '',
      locationLink: '',
    }
  });

  const billImageFile = watch('billImage');
  const biltyImageFile = watch('biltyImage');

  useEffect(() => {
    if (open && record) {
      setValue('productName', record.itemName || '');
      setValue('quantity', record.quantity || '');
      setValue('billNo', '');
      setValue('billImage', null);
      setValue('qualityCondition', 'Good');
      setBillFile(null);

      // Logistics default values
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
  }, [open, record, setValue]);

  const handleBillFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBillFile(file);
      setValue('billImage', { name: file.name, url: URL.createObjectURL(file) });
    }
  };

  const handleBiltyFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBiltyFile(file);
      setValue('biltyImage', { name: file.name, url: URL.createObjectURL(file) });
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
    let billImageUrl = '';
    let biltyImageUrl = '';
    const folderId = import.meta.env.VITE_FOLDER_BILL;

    if (folderId) {
      if (billFile) {
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
          console.error("Failed to upload bill image:", err);
          toast.warning("Failed to upload bill image to Google Drive, proceeding without upload.");
        }
      }

      if (!record.liftNo && biltyFile) {
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
    }

    try {
      let liftNo = record.liftNo || record.liftNumber;
      const timestamp = formatTimestamp();

      if (!liftNo) {
        // Direct receiving: Insert logistics details to generate unique lift number safely on backend
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
          "Time Delay 1"
        ];

        const logisticsRows = matchedRecords.map(rec => {
          const rowObj = {
            "Timestamp": timestamp,
            "LN-Lift Number": "", // Generated by backend
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
            "Planned 1": timestamp,
            "Actual 1": timestamp,
            "Time Delay 1": 0
          };
          return headersList.map(h => rowObj[h] !== undefined ? rowObj[h] : "");
        });

        const logResult = await gasApi.batchInsertLogistics("LIFT-RECEIVED", logisticsRows);
        if (!logResult.success || !logResult.liftNumber) {
          throw new Error("Failed to generate Lift Number for Direct Receiving");
        }
        liftNo = logResult.liftNumber;
      }

      // Loop sequentially to write each receiving row
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
          "Lift No.": liftNo,
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
          "lift Status": "",
          "Status": ""
        };
        return receivingHeaders.map(h => rowObj[h] !== undefined ? rowObj[h] : "");
      });

      const recResult = await gasApi.batchInsert("RECEIVED-ACCOUNTS", receivingRows);
      if (!recResult.success) {
        throw new Error(recResult.error || "Receiving batch insert failed");
      }

      // Update Actual 1 in LIFT-RECEIVED if logistics row existed (arranged flow)
      for (const rec of matchedRecords) {
        if (rec._logisticsRow) {
          await updateRow('logistics', rec._logisticsRow, {
            "Actual 1": timestamp
          }, false);
        }
      }

      toast.success(`Material received! ${matchedRecords.length} item(s) moved to Lift Receiver.`);
      await refresh();
      onClose();
    } catch (err) {
      console.error("Failed to receive material:", err);
      toast.error(err.message || "Failed to record receiving verification in database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>

      <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'info.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inventory2OutlinedIcon sx={{ color: 'info.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>Receive Material Verification</Typography>
            {record && (
              <Typography variant="caption" color="text.secondary">Indent: {record.indentNumber} &nbsp;·&nbsp; {record.itemName}</Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <Box component="form" id="receive-form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>
          <SectionLabel>Material & Receiving Details</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 2 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={8}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Product Name
                </Typography>
                <TextField fullWidth size="small"
                  value={record?.itemName || ''}
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: 'action.hover', '& input': { color: 'text.secondary', fontWeight: 600 } }}
                />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Quantity <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField fullWidth size="small" type="number"
                  {...register('quantity', { required: 'Required' })}
                  error={!!errors.quantity} helperText={errors.quantity?.message} />
              </Grid>
            </Grid>
          </Box>

          {!record?.liftNo && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <SectionLabel>Logistics Details (Direct Receiving)</SectionLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 2 }}>
                <Grid container spacing={2.5}>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Transporter Name <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small"
                      {...register('transporterName', { required: !record?.liftNo ? 'Required' : false })}
                      error={!!errors.transporterName} helperText={errors.transporterName?.message} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Vehicle No. <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small"
                      {...register('vehicleNo', { required: !record?.liftNo ? 'Required' : false })}
                      error={!!errors.vehicleNo} helperText={errors.vehicleNo?.message} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Driver No. <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small" type="tel"
                      {...register('driverNo', { required: !record?.liftNo ? 'Required' : false })}
                      error={!!errors.driverNo} helperText={errors.driverNo?.message} />
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Bilty No. <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <TextField fullWidth size="small"
                      {...register('biltyNo', { required: !record?.liftNo ? 'Required' : false })}
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
                      {...register('partyAddress', { required: !record?.liftNo ? 'Required' : false })}
                      error={!!errors.partyAddress} helperText={errors.partyAddress?.message} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                      Bilty Image (Optional)
                    </Typography>
                    <input accept="image/*,.pdf" style={{ display: 'none' }} id="receive-bilty-upload" type="file" onChange={handleBiltyFileChange} />
                    <label htmlFor="receive-bilty-upload">
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
            </>
          )}

          <Divider sx={{ my: 2.5 }} />
          <SectionLabel>Verification & Billing</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Bill No. <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField fullWidth size="small"
                  {...register('billNo', { required: 'Required' })}
                  error={!!errors.billNo} helperText={errors.billNo?.message} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Quality Condition <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Controller name="qualityCondition" control={control} rules={{ required: 'Required' }}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth size="small" error={!!errors.qualityCondition} helperText={errors.qualityCondition?.message}>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Average">Average</MenuItem>
                      <MenuItem value="Bad">Bad</MenuItem>
                    </TextField>
                  )} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  Bill Image (Optional)
                </Typography>
                <input accept="image/*,.pdf" style={{ display: 'none' }} id="receive-bill-upload" type="file" onChange={handleBillFileChange} />
                <label htmlFor="receive-bill-upload">
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
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
          <Button type="submit" form="receive-form" variant="contained" color="primary" disabled={isSubmitting} sx={{ minWidth: 150, height: 38 }}>
            {isSubmitting ? 'Saving...' : 'Save & Submit'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

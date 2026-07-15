import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import {
  Dialog, DialogContent, Box, Typography, TextField, MenuItem, Button, IconButton, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-toastify';
import { useData } from '../../contexts/DataContext';
import { gasApi } from '../../services/gasApi';
import { formatCurrency, formatDate, formatTimestamp } from '../../utils/formatters';
import aceLogo from '../../assets/ace-logo.png';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const generatePONumber = () => `ACE/PO/25-26-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

// Transparent input used inside the printable PO template
const TransparentInput = ({ readOnly, ...props }) => (
  <TextField
    variant="standard"
    fullWidth
    InputProps={{
      disableUnderline: true,
      readOnly: readOnly || false,
      style: { fontSize: '0.7rem', fontWeight: 600, padding: 0, cursor: readOnly ? 'default' : 'text', color: '#000' }
    }}
    sx={{
      '& .MuiInputBase-input': {
        padding: 0,
        height: 'auto',
        color: '#000 !important',
        WebkitTextFillColor: '#000 !important'
      }
    }}
    {...props}
  />
);

export default function GeneratePOForm({ open, onClose, viewRecord, selectedRowIds = [] }) {
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const vendors = useSelector((state) => state.vendorMaster.items) || [];
  const companies = useSelector((state) => state.companies.items) || [];
  const allRecords = useSelector((state) => state.workflow.records) || [];
  const { refresh, updateRow, pendingPoRecords = [], poHistoryRecords = [] } = useData();

  const { control, register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      poNumber: generatePONumber(),
      poDate: new Date().toISOString().slice(0, 10),
      supplierId: '',
      vendorName: '',
      vendorGst: '',
      vendorAddress: '',
      companyId: '',
      companyName: 'Acemark Stationers',
      companyGst: '',
      companyPan: '',
      billingAddress: '',
      destinationAddress: '',
      items: [],
      priceBasis: 'F.O.R. Destination',
      taxesDuties: 'GST Extra as applicable',
      delivery: 'Within 2-3 Weeks from PO date',
      transport: 'By Supplier',
      paymentTerms: '30 Days credit',
      dispatchDate: '',
    }
  });

  const isViewMode = !!viewRecord;

  // Auto-select supplier if selectedRowIds are passed from parent
  useEffect(() => {
    if (isViewMode) return;
    if (selectedRowIds && selectedRowIds.length > 0 && vendors.length > 0 && pendingPoRecords.length > 0) {
      const firstRec = pendingPoRecords.find(r => r.id === selectedRowIds[0]);
      if (firstRec) {
        const ven = vendors.find(v => v.vendorName === firstRec.partyName);
        if (ven) {
          setValue('supplierId', ven.id);
        }
      }
    }
  }, [selectedRowIds, vendors, pendingPoRecords, isViewMode, setValue]);

  const { replace } = useFieldArray({ control, name: 'items' });

  // Only show vendors that have at least one pending purchaseOrder indent
  const pendingPartyNames = useMemo(() => {
    const names = new Set(
      pendingPoRecords.map(r => r.partyName)
    );
    return names;
  }, [pendingPoRecords]);

  const availableVendors = useMemo(
    () => vendors.filter(v => pendingPartyNames.has(v.vendorName)),
    [vendors, pendingPartyNames]
  );

  // ── View mode: pre-fill from dynamic poHistoryRecords ──────────────────
  useEffect(() => {
    if (!isViewMode || !viewRecord) return;

    if (viewRecord.poNumber) {
      // Find all rows in poHistoryRecords that belong to this PO
      const poGroup = poHistoryRecords.filter(r => r.poNumber && r.poNumber.toLowerCase() === viewRecord.poNumber.toLowerCase());

      setValue('poNumber', viewRecord.poNumber || '');
      setValue('poDate', viewRecord.timestamp ? new Date(viewRecord.timestamp).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      setValue('vendorName', viewRecord.partyName || '');
      setValue('companyName', viewRecord.companyName || '');

      const ven = vendors.find(v => v.vendorName === viewRecord.partyName);
      if (ven) {
        setValue('supplierId', ven.id);
        setValue('vendorGst', ven.gstNumber || '');
        setValue('vendorAddress', ven.vendorLocation || 'Not available');
      }

      const comp = companies.find(c => c.companyName === viewRecord.companyName);
      if (comp) {
        setValue('companyId', comp.id);
        setValue('companyGst', comp.gstNumber || '');
        setValue('companyPan', comp.panNumber || '');
        setValue('billingAddress', comp.billingAddress || '');
        setValue('destinationAddress', comp.destination || '');
      }

      replace(poGroup.map((item, idx) => ({
        sno: idx + 1,
        indentNumber: item.indentNumber || '',
        itemCode: item.itemCode || '',
        groupName: item.groupName || '',
        description: item.itemName || '',
        quantity: item.quantity || 0,
        unit: item.unit || '',
        rate: item.rate || 0,
        discount: item.discount || 0,
        gst: item.gst || 0,
      })));
    } else {
      // Fallback for older records without poDetails
      setValue('poNumber', viewRecord.poNumber || '');
      setValue('poDate', viewRecord.poDate || new Date().toISOString().slice(0, 10));
      setValue('vendorName', viewRecord.partyName || '');
      setValue('companyName', viewRecord.companyName || '');

      const ven = vendors.find(v => v.vendorName === viewRecord.partyName);
      if (ven) {
        setValue('supplierId', ven.id);
        setValue('vendorGst', ven.gstNumber || '');
        setValue('vendorAddress', ven.vendorLocation || 'Not available');
      }

      const comp = companies.find(c => c.companyName === viewRecord.companyName);
      if (comp) {
        setValue('companyId', comp.id);
        setValue('companyGst', comp.gstNumber || '');
        setValue('companyPan', comp.panNumber || '');
        setValue('billingAddress', comp.billingAddress || '');
        setValue('destinationAddress', comp.destination || '');
      }

      replace([{
        sno: 1,
        indentNumber: viewRecord.indentNumber || '',
        itemCode: viewRecord.itemCode || '',
        groupName: viewRecord.groupName || '',
        description: viewRecord.itemName ? `${viewRecord.itemName} - ${viewRecord.description || ''}` : '',
        quantity: viewRecord.quantity || 0,
        unit: viewRecord.unit || '',
        rate: viewRecord.rate || 0,
        discount: viewRecord.discount || 0,
        gst: viewRecord.gst || 0,
      }]);
    }
  }, [isViewMode, viewRecord, setValue, replace, vendors, companies, poHistoryRecords]);

  // ── Auto-batch pending indents when supplier is selected (edit mode) ───
  const selectedSupplierId = watch('supplierId');
  useEffect(() => {
    if (isViewMode) return;
    if (!selectedSupplierId || !vendors.length) { replace([]); return; }

    const ven = vendors.find(v => v.id === selectedSupplierId);
    if (!ven) return;

    setValue('vendorName', ven.vendorName || '');
    setValue('vendorGst', ven.gstNumber || '');
    setValue('vendorAddress', ven.vendorLocation || 'Not available');

    // Batch pending indents for this supplier (filter by selectedRowIds if provided)
    const matchedIndents = pendingPoRecords.filter(
      r => r.partyName === ven.vendorName &&
        (selectedRowIds.length === 0 || selectedRowIds.includes(r.id))
    );

    if (matchedIndents.length === 0) {
      toast.warning(`No pending indents found for ${ven.vendorName}`);
      replace([]);
      return;
    }

    toast.info(`Batched ${matchedIndents.length} item(s) for ${ven.vendorName}`);

    // Auto-fill company from first matched indent
    const comp = companies.find(c => c.companyName === matchedIndents[0].companyName);
    if (comp) {
      setValue('companyId', comp.id);
      setValue('companyName', comp.companyName);
      setValue('companyGst', comp.gstNumber || '');
      setValue('companyPan', comp.panNumber || '');
      setValue('billingAddress', comp.billingAddress || '');
      setValue('destinationAddress', comp.destination || '');
    }

    // Build items — include indentNumber and groupName per row
    replace(matchedIndents.map((ind, idx) => ({
      sno: idx + 1,
      indentNumber: ind.indentNumber || '',
      itemCode: ind.itemCode || '',
      groupName: ind.groupName || '',
      description: ind.itemName || '',
      quantity: ind.quantity || 0,
      unit: ind.unit || '',
      rate: ind.rate || 0,
      discount: ind.discount || 0,
      gst: ind.gst || 0,
    })));
  }, [selectedSupplierId, vendors, pendingPoRecords, companies, setValue, replace, isViewMode, selectedRowIds]);

  // ── Running totals ────────────────────────────────────────────────────
  const watchItems = useWatch({ control, name: 'items' });
  const [totals, setTotals] = useState({ grandTotal: 0 });

  useEffect(() => {
    let sub = 0, gstAmt = 0;
    (watchItems || []).forEach((item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.rate) || 0;
      const d = parseFloat(item.discount) || 0;
      const g = parseFloat(item.gst) || 0;
      const afterDiscount = q * r * (1 - d / 100);
      sub += afterDiscount;
      gstAmt += afterDiscount * (g / 100);
    });
    setTotals({ grandTotal: sub + gstAmt });
  }, [watchItems]);

  const data = watch();
  const emptyRowsCount = 1;
  const emptyRows = Array.from({ length: emptyRowsCount });

  // ── Save & Submit ─────────────────────────────────────────────────────
  const onSubmit = async () => {
    if (isViewMode || submitting) return;
    setSubmitting(true);

    const data = watch();
    if (!data.supplierId) { toast.error('Please select a supplier first.'); return; }

    const matchedIndents = pendingPoRecords.filter(
      r => r.partyName === data.vendorName &&
        (selectedRowIds.length === 0 || selectedRowIds.includes(r.id))
    );

    if (matchedIndents.length === 0) { toast.error('No pending indents to process.'); return; }

    try {
      toast.info("Generating PO PDF...");
      const element = document.getElementById("printable-po-content");
      if (!element) {
        throw new Error("Printable PO content element not found in DOM");
      }

      // Capture element to canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Proportional dimensions matching the container aspect ratio
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      const pdfBase64 = pdf.output('datauristring');

      toast.info("Uploading PDF to Google Drive...");
      const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
      const uploadResponse = await gasApi.uploadFile({
        base64Data: pdfBase64,
        fileName: `${data.poNumber}.pdf`,
        mimeType: 'application/pdf',
        folderId
      });

      if (!uploadResponse || !uploadResponse.success || !uploadResponse.fileUrl) {
        throw new Error(uploadResponse?.error || "Failed to upload PO to Google Drive");
      }

      const fileUrl = uploadResponse.fileUrl;

      // 1. Submit the new PO records to PO-History (Columns A-R)
      const historyRows = [];
      for (const indent of matchedIndents) {
        const matchedFormItem = data.items?.find(
          it => it.indentNumber === indent.indentNumber &&
            it.itemCode === indent.itemCode
        );
        const poQty = matchedFormItem ? parseFloat(matchedFormItem.quantity) : indent.quantity;
        const poRate = matchedFormItem ? parseFloat(matchedFormItem.rate) : indent.rate;
        const poDiscount = matchedFormItem ? parseFloat(matchedFormItem.discount) : indent.discount;
        const poGst = matchedFormItem ? parseFloat(matchedFormItem.gst) : indent.gst;

        const afterDiscount = poQty * poRate * (1 - poDiscount / 100);
        const discounted = afterDiscount;
        const total = afterDiscount * (1 + poGst / 100);

        historyRows.push([
          formatTimestamp(new Date()), // Timestamp (A)
          formatTimestamp(new Date()), // Actual (B)
          data.vendorName || "",       // Party Name (C)
          data.poNumber || "",         // Po Number (D)
          indent.itemCode || "",       // Product Code (E)
          indent.itemName || "",       // Product (F)
          indent.description || "",    // Description (G)
          poQty,                       // Quntity (H)
          indent.unit || "",           // Unit (I)
          poRate,                      // Rate (J)
          poDiscount,                  // Discount% stored as percentage (K)
          poGst,                       // Gst % (L)
          discounted,                  // Amount (M)
          total,                       // Total Amount (N)
          fileUrl,                     // PO Copy (O)
          indent.indentNumber || "",   // Indent No. (P)
          indent.serialNo,             // Product No. (Q)
          data.companyName || ""       // Company Name (R)
        ]);
      }

      await gasApi.batchInsert("PO-History", historyRows);

      toast.success(`Purchase Order ${data.poNumber} generated and saved to Drive!`);
      onClose();
      // Start background refresh without global spinner
      refresh(['indents', 'poHistory'], false).catch(err => console.error("Background refresh failed:", err));
    } catch (err) {
      console.error("Failed to generate PO:", err);
      toast.error(err.message || "Failed to write PO details to spreadsheet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxWidth: '880px' } }}
    >
      {/* ── Top Action Bar (non-printable) ─────────────────────────────── */}
      <Box className="no-print" sx={{
        p: 1.5, bgcolor: 'grey.200', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: 1, borderColor: 'divider',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {isViewMode ? `View PO: ${viewRecord?.poNumber}` : 'Generate Purchase Order'}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => window.print()} disabled={submitting}>Print</Button>
          {!isViewMode && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
            >
              {submitting ? 'Submitting PO...' : 'Save & Submit PO'}
            </Button>
          )}
          <IconButton size="small" onClick={onClose} disabled={submitting}><CloseIcon /></IconButton>
        </Stack>
      </Box>

      {/* ── Printable PO Template ──────────────────────────────────────── */}
      <DialogContent sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fff', '@media print': { p: 0 } }}>
        <Box
          id="printable-po-content"
          sx={{
            maxWidth: '900px', mx: 'auto', border: '2px solid #000',
            fontFamily: '"Arial", sans-serif', color: '#000',
            '& .MuiTypography-root:not(.white-text)': {
              color: '#000 !important'
            },
            '& .MuiInputBase-input, & .MuiSelect-select': {
              color: '#000 !important',
              WebkitTextFillColor: '#000 !important'
            },
            '& td': {
              color: '#000 !important'
            },
            '& p': {
              color: '#000 !important'
            },
            '& *': { borderColor: '#000 !important' }
          }}
        >

          {/* 1. Header */}
          <Box sx={{ display: 'flex', borderBottom: '2px solid #000' }}>
            <Box sx={{ width: '150px', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid #000' }}>
              <img src={aceLogo} alt="ACE Logo" style={{ maxWidth: '100%', maxHeight: '70px', objectFit: 'contain' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ bgcolor: '#4A90E2', color: '#fff', py: 1.5, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: 1 }} className="white-text">{data.companyName}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', py: 0.5, borderBottom: '1px solid #000' }}>
                <Typography variant="body2" fontWeight={600}>Changurabhata, Raipur, Chhattisgarh</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography variant="body2" fontWeight={700}>Purchase Order</Typography>
              </Box>
            </Box>
          </Box>

          {/* 2. Supplier & PO Info */}
          <Box sx={{ display: 'flex', borderBottom: '2px solid #000', minHeight: '80px' }}>
            <Box sx={{ flex: 1, p: 1, borderRight: '2px solid #000' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>Supplier:- </Typography>
                {isViewMode ? (
                  <Typography variant="caption" fontWeight={700} sx={{ flex: 1, color: '#1976d2', fontSize: '0.75rem' }}>
                    {data.vendorName || '—'}
                  </Typography>
                ) : (
                  <Controller name="supplierId" control={control} render={({ field }) => (
                    <TextField
                      {...field} select variant="standard"
                      SelectProps={{ disableUnderline: true, style: { fontSize: '0.75rem', fontWeight: 600, color: '#1976d2' } }}
                      sx={{ flex: 1, '& .MuiSelect-select': { p: 0 } }}
                    >
                      <MenuItem value="" disabled>
                        {availableVendors.length === 0 ? 'No pending indents' : 'Select Supplier...'}
                      </MenuItem>
                      {availableVendors.map(v => <MenuItem key={v.id} value={v.id}>{v.vendorName}</MenuItem>)}
                      {field.value && !availableVendors.some(v => v.id === field.value) && (
                        (() => {
                          const currentVen = vendors.find(v => v.id === field.value);
                          return currentVen ? (
                            <MenuItem key={currentVen.id} value={currentVen.id}>{currentVen.vendorName}</MenuItem>
                          ) : null;
                        })()
                      )}
                    </TextField>
                  )} />
                )}
              </Box>
              <Box sx={{ display: 'flex', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>Address:- </Typography>
                <Typography variant="caption" sx={{ flex: 1 }}>{data.vendorAddress}</Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>GSTIN :- </Typography>
                <Typography variant="caption" sx={{ flex: 1 }}>{data.vendorGst}</Typography>
              </Box>
            </Box>
            <Box sx={{ width: '300px', p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>PO No : </Typography>
                <TransparentInput {...register('poNumber')} readOnly={isViewMode} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px' }}>PO Date : </Typography>
                <TransparentInput type="date" {...register('poDate')} readOnly={isViewMode} />
              </Box>
            </Box>
          </Box>

          {/* 3. Commercial Details */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '2px solid #000' }}>
            <Box sx={{ textAlign: 'center', borderRight: '1px solid #000' }}>
              <Typography variant="caption" fontWeight={700} sx={{ bgcolor: '#4A90E2', color: '#fff', display: 'block', py: 0.5, borderBottom: '1px solid #000' }} className="white-text">Our Commercial Details</Typography>
              <Box sx={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px', borderRight: '1px solid #000', p: 0.5 }}>GSTIN</Typography>
                <Box sx={{ flex: 1, p: 0.5 }}><TransparentInput {...register('companyGst')} readOnly={isViewMode} /></Box>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Typography variant="caption" fontWeight={700} sx={{ width: '60px', borderRight: '1px solid #000', p: 0.5 }}>PAN No.</Typography>
                <Box sx={{ flex: 1, p: 0.5 }}><TransparentInput {...register('companyPan')} readOnly={isViewMode} /></Box>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" fontWeight={700} sx={{ bgcolor: '#4A90E2', color: '#fff', display: 'block', py: 0.5, borderBottom: '1px solid #000' }} className="white-text">Billing Address</Typography>
              <Box sx={{ p: 0.5, borderBottom: '1px solid #000' }}><TransparentInput {...register('companyName')} readOnly={isViewMode} inputProps={{ style: { textAlign: 'center', fontWeight: 600 } }} /></Box>
              <Box sx={{ p: 0.5, flex: 1 }}><TransparentInput multiline {...register('billingAddress')} readOnly={isViewMode} inputProps={{ style: { textAlign: 'center' } }} /></Box>
            </Box>
            <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" fontWeight={700} sx={{ bgcolor: '#4A90E2', color: '#fff', display: 'block', py: 0.5, borderBottom: '1px solid #000' }} className="white-text">Destination Address</Typography>
              <Box sx={{ p: 0.5, borderBottom: '1px solid #000' }}><TransparentInput {...register('companyName')} readOnly={isViewMode} inputProps={{ style: { textAlign: 'center', fontWeight: 600 } }} /></Box>
              <Box sx={{ p: 0.5, flex: 1 }}><TransparentInput multiline {...register('destinationAddress')} readOnly={isViewMode} inputProps={{ style: { textAlign: 'center' } }} /></Box>
            </Box>
          </Box>

          <Box sx={{ p: 1, borderBottom: '1px solid #000' }}>
            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 1 }}>Dear Sir,</Typography>
            <Typography variant="caption" fontWeight={700}>We Are Pleased To Place Our Purchase Order With You, As Per The Following Details.</Typography>
          </Box>

          {/* 4. Items Table — includes Group Name column */}
          <Box component="table" sx={{
            width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed',
            '& th': { bgcolor: '#4A90E2', color: '#fff', fontWeight: 700, py: 0.5, px: 0.5, borderBottom: '1px solid #000', borderRight: '1px solid #000', fontSize: '0.62rem', textAlign: 'center' },
            '& td': { borderBottom: '1px solid #000', borderRight: '1px solid #000', py: 0.5, px: 0.5, fontSize: '0.62rem', textAlign: 'center' },
            '& th:last-child, & td:last-child': { borderRight: 0 }
          }}>
            <thead>
              <tr>
                <th style={{ width: '28px' }}>S/N</th>
                <th style={{ width: '80px' }}>Indent No.</th>
                <th style={{ width: '65px' }}>Product Code</th>
                <th style={{ width: '85px' }}>Group</th>
                <th>Product</th>
                <th style={{ width: '45px' }}>Qty</th>
                <th style={{ width: '40px' }}>Unit</th>
                <th style={{ width: '50px' }}>Rate</th>
                <th style={{ width: '50px' }}>Discount<br />%</th>
                <th style={{ width: '35px' }}>GST %</th>
                <th style={{ width: '65px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => {
                const q = parseFloat(item.quantity) || 0;
                const r = parseFloat(item.rate) || 0;
                const d = parseFloat(item.discount) || 0;
                const g = parseFloat(item.gst) || 0;
                const afterDiscount = q * r * (1 - d / 100);
                const totalWithGst = afterDiscount * (1 + g / 100);
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#1565c0' }}>
                      <TransparentInput {...register(`items.${idx}.indentNumber`)} readOnly inputProps={{ style: { textAlign: 'center', color: '#1565c0', fontWeight: 700 } }} />
                    </td>
                    <td><TransparentInput {...register(`items.${idx}.itemCode`)} readOnly={isViewMode} inputProps={{ style: { textAlign: 'center' } }} /></td>
                    <td style={{ textAlign: 'left' }}><TransparentInput {...register(`items.${idx}.groupName`)} readOnly={isViewMode} /></td>
                    <td style={{ textAlign: 'left' }}><TransparentInput {...register(`items.${idx}.description`)} readOnly={isViewMode} /></td>
                    <td><TransparentInput type="number" {...register(`items.${idx}.quantity`)} readOnly={isViewMode} inputProps={{ step: 'any', style: { textAlign: 'center' } }} /></td>
                    <td><TransparentInput {...register(`items.${idx}.unit`)} readOnly={isViewMode} inputProps={{ style: { textAlign: 'center' } }} /></td>
                    <td><TransparentInput type="number" {...register(`items.${idx}.rate`)} readOnly={isViewMode} inputProps={{ step: 'any', style: { textAlign: 'center' } }} /></td>
                    <td><TransparentInput type="number" {...register(`items.${idx}.discount`)} readOnly={isViewMode} inputProps={{ step: 'any', style: { textAlign: 'center' } }} /></td>
                    <td><TransparentInput type="number" {...register(`items.${idx}.gst`)} readOnly={isViewMode} inputProps={{ step: 'any', style: { textAlign: 'center' } }} /></td>
                    <td style={{ fontWeight: 600 }}>{Math.round(totalWithGst)}</td>
                  </tr>
                );
              })}
              {emptyRows.map((_, idx) => (
                <tr key={`empty-${idx}`} style={{ height: '22px' }}>
                  <td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td />
                </tr>
              ))}
              <tr style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                <td colSpan={10} style={{ textAlign: 'center' }}>Grand Total</td>
                <td>{Math.round(totals.grandTotal)}</td>
              </tr>
            </tbody>
          </Box>

          {/* 5. Terms */}
          <Box sx={{ borderTop: '2px solid #000' }}>
            <Typography variant="caption" sx={{ bgcolor: '#4A90E2', color: '#fff', display: 'block', px: 1, py: 0.25, fontWeight: 700, textTransform: 'uppercase' }} className="white-text">Terms &amp; Conditions</Typography>
            <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: '15px 85px 1fr', gap: 0.5, alignItems: 'center', '& p': { m: 0, fontSize: '0.65rem', fontWeight: 600 } }}>
              <p>1</p><p>Price Basis :</p><TransparentInput {...register('priceBasis')} readOnly={isViewMode} />
              <p>2</p><p>Taxes &amp; Duties :</p><TransparentInput {...register('taxesDuties')} readOnly={isViewMode} />
              <p>3</p><p>Delivery :</p><TransparentInput {...register('delivery')} readOnly={isViewMode} />
              <p>4</p><p>Transport :</p><TransparentInput {...register('transport')} readOnly={isViewMode} />
              <p>5</p><p>Payment :</p><TransparentInput {...register('paymentTerms')} readOnly={isViewMode} />
              <p>6</p><p>Dispatch Date :</p><TransparentInput type="date" {...register('dispatchDate')} readOnly={isViewMode} />
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', p: 1, mt: 1 }}>
              Kindly Acknowledge Receipt Of This Purchase Order Along With Its Enclosures, And Ensure Timely Execution Of The Ordered Material.
            </Typography>
          </Box>

          {/* 6. Signatures */}
          <Box sx={{ display: 'flex', bgcolor: '#4A90E2', color: '#fff', '& div': { flex: 1, py: 0.5, px: 2, fontSize: '0.65rem', fontWeight: 700 } }}>
            <Box className="white-text" sx={{ textAlign: 'left' }}>Prepared By</Box>
            <Box className="white-text" sx={{ textAlign: 'center' }}>Purchase Head</Box>
            <Box className="white-text" sx={{ textAlign: 'right' }} />
          </Box>

        </Box>
      </DialogContent>
    </Dialog>
  );
}

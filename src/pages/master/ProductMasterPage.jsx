import { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Typography, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, TextField, MenuItem, Divider, IconButton, Tooltip,
  FormControl, InputLabel, Select, Checkbox, ListItemText
} from '@mui/material';
import EditIcon   from '@mui/icons-material/Edit';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import DataTable  from '../../components/common/DataTable';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import PremiumLoader from '../../components/common/PremiumLoader';
import { formatCurrency } from '../../utils/formatters';

const COLUMNS = [
  { key: 'productType',  label: 'Product Type',       render: v => <Chip label={v} size="small" sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600 }} /> },
  { key: 'supplierId',   label: 'Vendor ID',          render: v => <Typography variant="body2" fontWeight={600} color="text.secondary">{v}</Typography> },
  { key: 'supplierName', label: 'Vendor Name',        wrap: true, minWidth: 200, maxWidth: 350, render: v => <Typography variant="body2" fontWeight={700} color="primary.main">{v}</Typography> },
  { key: 'groupName',    label: 'Group Name',         render: v => <Chip label={v} size="small" variant="outlined" color="primary" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600 }} /> },
  { key: 'itemName',     label: 'Item Name',          wrap: true, minWidth: 250, maxWidth: 400, render: v => <Typography variant="body2" fontWeight={500}>{v}</Typography> },
  { key: 'unit',         label: 'Unit',               render: v => <Chip label={v} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} /> },
  { key: 'itemCode',     label: 'Item Code',          render: v => <Typography variant="caption" fontFamily="monospace" fontWeight={700} bgcolor="action.hover" px={0.8} py={0.3} borderRadius={0.5}>{v}</Typography> },
  { key: 'purchaseRate', label: 'Purchase Rate',      render: v => <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrency(v)}</Typography> },
  { key: 'mobileNo',     label: 'Mobile NO',          render: v => <Typography variant="body2" color="text.secondary">{v}</Typography> },
];

function ProductForm({ open, onClose, editItem, onSave }) {
  const { vendors = [] } = useData();
  const [submitting, setSubmitting] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);

  const uniqueVendors = useMemo(() => {
    const seen = new Set();
    return vendors.filter(v => {
      const name = String(v.vendorName || '').trim();
      if (!name || seen.has(name.toLowerCase())) {
        return false;
      }
      seen.add(name.toLowerCase());
      return true;
    });
  }, [vendors]);

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      productType: '', supplierId: '', supplierName: [], groupName: '',
      itemName: '', unit: '', itemCode: '', purchaseRate: '', mobileNo: '',
    },
  });

  const watchedVendors = watch('supplierName');
  const selectedVendors = useMemo(() => {
    if (Array.isArray(watchedVendors)) return watchedVendors;
    if (typeof watchedVendors === 'string') {
      return watchedVendors.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [watchedVendors]);

  useEffect(() => {
    if (editItem) {
      const initialVendors = editItem.supplierName
        ? String(editItem.supplierName).split(',').map(s => s.trim()).filter(Boolean)
        : [];
      reset({
        productType: editItem.productType || '',
        supplierId: editItem.supplierId || '',
        supplierName: initialVendors,
        groupName: editItem.groupName || '',
        itemName: editItem.itemName || '',
        unit: editItem.unit || '',
        itemCode: editItem.itemCode || '',
        purchaseRate: editItem.purchaseRate || '',
        mobileNo: editItem.mobileNo || '',
      });
    } else {
      reset({
        productType: '', supplierId: '', supplierName: [], groupName: '',
        itemName: '', unit: '', itemCode: '', purchaseRate: '', mobileNo: '',
      });
    }
  }, [editItem, open, reset]);

  const onSubmit = async data => {
    setSubmitting(true);
    try {
      const finalVendorNames = Array.isArray(data.supplierName)
        ? data.supplierName.join(', ')
        : data.supplierName;
      await onSave({
        ...editItem,
        supplierName: finalVendorNames,
        supplierId: data.supplierId,
        mobileNo: data.mobileNo,
        vendorName: finalVendorNames,
        vendorId: data.supplierId,
      });
      reset();
      onClose();
    } catch (err) {
      // Handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  const INPUT_SX = { '& .MuiInputBase-root': { fontSize: '0.875rem' } };
  const field = (name, label, opts = {}) => (
    <TextField
      fullWidth size="small" label={label} sx={INPUT_SX}
      disabled
      InputProps={{ readOnly: true }}
      {...register(name)}
      error={!!errors[name]} helperText={errors[name]?.message}
      type={opts.type || 'text'}
    />
  );

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Product</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
              gap: 2.5
            }}
          >
            {/* Row 1 */}
            <Box>
              <TextField
                fullWidth size="small" label="Product Type" sx={INPUT_SX}
                disabled
                InputProps={{ readOnly: true }}
                {...register('productType')}
              />
            </Box>
            <Box>
              <FormControl fullWidth size="small" error={!!errors.supplierName}>
                <InputLabel id="vendor-name-label" shrink sx={{ bgcolor: 'background.paper', px: 0.5 }}>Vendor Name</InputLabel>
                <Controller
                  name="supplierName"
                  control={control}
                  rules={{ required: 'Required' }}
                  render={({ field: { value, onChange } }) => {
                    const selectValue = Array.isArray(value) ? value : [];
                    return (
                      <Select
                        labelId="vendor-name-label"
                        multiple
                        notched
                        open={selectOpen}
                        onOpen={() => setSelectOpen(true)}
                        onClose={() => setSelectOpen(false)}
                        value={selectValue}
                        onChange={(e) => {
                          onChange(e.target.value);
                          setSelectOpen(false);
                        }}
                        label="Vendor Name"
                        disabled={submitting}
                        renderValue={(selected) => selected.join(', ')}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {uniqueVendors.map((v) => (
                          <MenuItem key={v.id} value={v.vendorName} sx={{ fontSize: '0.875rem' }}>
                            {v.vendorName}
                          </MenuItem>
                        ))}
                      </Select>
                    );
                  }}
                />
              </FormControl>
              {selectedVendors.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedVendors.map(name => (
                    <Chip
                      key={name}
                      label={name}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                      onDelete={() => {
                        const nextVendors = selectedVendors.filter(v => v !== name);
                        setValue('supplierName', nextVendors);
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
            <Box>
              <Controller name="supplierId" control={control} render={({ field: f }) => (
                <TextField
                  {...f}
                  fullWidth
                  size="small"
                  label="Vendor ID"
                  InputLabelProps={{ shrink: true }}
                  disabled
                  InputProps={{ readOnly: true }}
                  sx={INPUT_SX}
                />
              )} />
            </Box>

            {/* Row 2 */}
            <Box>{field('groupName', 'Group Name')}</Box>
            <Box>{field('itemName', 'Item Name')}</Box>
            <Box>{field('itemCode', 'Item Code')}</Box>

            {/* Row 3 */}
            <Box>
              <TextField
                fullWidth size="small" label="Unit" sx={INPUT_SX}
                disabled
                InputProps={{ readOnly: true }}
                {...register('unit')}
              />
            </Box>
            <Box>{field('purchaseRate', 'Purchase Rate', { type: 'number' })}</Box>
            <Box>{field('mobileNo', 'Mobile NO')}</Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <PremiumLoader size={16} /> : null}>
            {submitting ? 'Saving...' : 'Update Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function ProductMasterPage() {
  const { isAdmin } = useAuth();
  const { products, refresh, updateRow, startSync, endSync } = useData();
  const [formOpen, setFormOpen]  = useState(false);
  const [editItem, setEditItem]  = useState(null);

  const handleSave = async item => {
    if (!editItem) return;
    startSync();
    try {
      const payload = {
        "Product Type": item.productType,
        "Supplier ID": item.supplierId,
        "Supplier Name": item.supplierName,
        "Group Name": item.groupName,
        "Item Name": item.itemName,
        "Unit": item.unit,
        "Item Code": item.itemCode,
        "Purchase Rate": Number(item.purchaseRate) || 0,
        "Mobile NO": item.mobileNo,
      };
      await updateRow('products', editItem._row, payload, false);
      toast.success('Product updated!');
      await refresh(['productsData'], false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save product.");
    } finally {
      endSync();
    }
  };

  const actions = row => {
    if (!isAdmin) return null;
    return (
      <Box display="flex" gap={0.5}>
        <Tooltip title="Edit" arrow>
          <IconButton
            size="small"
            color="primary"
            onClick={() => { setEditItem(row); setFormOpen(true); }}
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Product Data"
        subtitle="Master reference table for all products and their vendor mapping"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Masters' }, { label: 'Product Data' }]}
      />
      <DataTable
        title="Product List"
        columns={COLUMNS}
        rows={products}
        searchKey={['itemName', 'supplierName', 'itemCode', 'groupName']}
        actions={isAdmin ? actions : null}
        hideIndexColumn
      />
      <ProductForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        editItem={editItem}
        onSave={handleSave}
      />
    </Box>
  );
}

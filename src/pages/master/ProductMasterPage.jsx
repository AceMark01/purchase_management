import { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, TextField, MenuItem, Divider, IconButton, Tooltip,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import DataTable  from '../../components/common/DataTable';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { gasApi } from '../../services/gasApi';
import { formatCurrency } from '../../utils/formatters';

const COLUMNS = [
  { key: 'productType',  label: 'Product Type',       render: v => <Chip label={v} size="small" sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600 }} /> },
  { key: 'vendorId',     label: 'Vendor ID',          render: v => <Typography variant="body2" fontWeight={600} color="text.secondary">{v}</Typography> },
  { key: 'vendorName',   label: 'Vendor Name',        render: v => <Typography variant="body2" fontWeight={700} color="primary.main">{v}</Typography> },
  { key: 'groupName',    label: 'Group Name',         render: v => <Chip label={v} size="small" variant="outlined" color="primary" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600 }} /> },
  { key: 'itemName',     label: 'Item Name',          render: v => <Typography variant="body2" fontWeight={500} sx={{ maxWidth: 200 }}>{v}</Typography> },
  { key: 'unit',         label: 'Unit',               render: v => <Chip label={v} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} /> },
  { key: 'itemCode',     label: 'Item Code',          render: v => <Typography variant="caption" fontFamily="monospace" fontWeight={700} bgcolor="action.hover" px={0.8} py={0.3} borderRadius={0.5}>{v}</Typography> },
  { key: 'purchaseRate', label: 'Purchase Rate',      render: v => <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrency(v)}</Typography> },
];

function ProductForm({ open, onClose, editItem, onSave }) {
  const { vendors = [], productTypes = [], units = [] } = useData();
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      productType: '', vendorId: '', vendorName: '', groupName: '',
      itemName: '', unit: '', itemCode: '', purchaseRate: '',
    },
  });

  const selectedVendorName = watch('vendorName');
  useEffect(() => {
    if (selectedVendorName) {
      const ven = vendors.find(v => v.vendorName === selectedVendorName);
      if (ven) {
        setValue('vendorId', ven.vendorId || '');
      }
    } else {
      setValue('vendorId', '');
    }
  }, [selectedVendorName, vendors, setValue]);

  useEffect(() => {
    if (editItem) {
      reset(editItem);
    } else {
      reset({
        productType: '', vendorId: '', vendorName: '', groupName: '',
        itemName: '', unit: '', itemCode: '', purchaseRate: '',
      });
    }
  }, [editItem, open, reset]);

  const onSubmit = async data => {
    setSubmitting(true);
    try {
      await onSave({ ...data, id: editItem?.id || Date.now(), purchaseRate: parseFloat(data.purchaseRate) || 0 });
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
      disabled={submitting}
      {...register(name, { required: opts.required !== false ? `${label} is required` : false })}
      error={!!errors[name]} helperText={errors[name]?.message}
      type={opts.type || 'text'}
    />
  );

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{editItem ? 'Edit Product' : 'Add New Product'}</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller name="productType" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
                <TextField {...f} select fullWidth size="small" label="Product Type" error={!!errors.productType} helperText={errors.productType?.message} sx={INPUT_SX} disabled={submitting}>
                  {productTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  {f.value && !productTypes.includes(f.value) && (
                    <MenuItem value={f.value}>{f.value}</MenuItem>
                  )}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="vendorName" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
                <TextField {...f} select fullWidth size="small" label="Vendor Name" error={!!errors.vendorName} helperText={errors.vendorName?.message} sx={INPUT_SX} disabled={submitting}>
                  {vendors.map(v => <MenuItem key={v.id} value={v.vendorName}>{v.vendorName}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Vendor ID"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                sx={INPUT_SX}
                disabled={submitting}
                {...register('vendorId')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>{field('groupName', 'Group Name')}</Grid>
            <Grid item xs={12} sm={6}>{field('itemName', 'Item Name')}</Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="unit" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
                <TextField {...f} select fullWidth size="small" label="Unit" error={!!errors.unit} helperText={errors.unit?.message} sx={INPUT_SX} disabled={submitting}>
                  {units.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                  {f.value && !units.includes(f.value) && (
                    <MenuItem value={f.value}>{f.value}</MenuItem>
                  )}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>{field('itemCode', 'Item Code')}</Grid>
            <Grid item xs={12} sm={6}>{field('purchaseRate', 'Purchase Rate', { type: 'number' })}</Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : (editItem ? 'Update' : 'Add') + ' Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function ProductMasterPage() {
  const { isAdmin } = useAuth();
  const { products, refresh, updateRow } = useData();
  const [formOpen, setFormOpen]  = useState(false);
  const [editItem, setEditItem]  = useState(null);

  const handleSave = async item => {
    const existing = products.find(p => p.itemCode === item.itemCode);
    const isEdit = !!existing;
    try {
      let result;
      const payload = {
        "Product Type": item.productType,
        "Vendor-ID": item.vendorId,
        "Vendor Name": item.vendorName,
        "Group Name": item.groupName,
        "Item Name": item.itemName,
        "Unit": item.unit,
        "Item Code": item.itemCode,
        "Purchase Rate": Number(item.purchaseRate) || 0,
      };
      if (isEdit) {
        await updateRow('products', existing._row, payload, false);
        result = { success: true };
      } else {
        const rowValues = [
          payload["Product Type"],
          payload["Vendor-ID"],
          payload["Vendor Name"],
          payload["Group Name"],
          payload["Item Name"],
          payload["Unit"],
          payload["Item Code"],
          payload["Purchase Rate"]
        ];
        result = await gasApi.insertInColumns("Master-Products", 1, rowValues, 1);
      }
      if (result.success) {
        toast.success(isEdit ? 'Product updated!' : 'Product added!');
        await refresh(['productsData'], false);
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save product.");
      throw err; // propagates to onSubmit finally to stop dismiss on error
    }
  };

  const handleDelete = async row => {
    if (!window.confirm(`Are you sure you want to delete product "${row.itemName}"?`)) return;
    try {
      const result = await gasApi.deleteRow("Master-Products", row._row);
      if (result.success) {
        toast.success('Product deleted.');
        await refresh(['productsData'], false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete product.");
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
        <Tooltip title="Delete" arrow>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(row)}
          >
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Product Data"
        subtitle="Master reference table for all products and their supplier mapping"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Masters' }, { label: 'Product Data' }]}
        actions={isAdmin && (
          <Button
            variant="contained" startIcon={<AddIcon />}
            onClick={() => { setEditItem(null); setFormOpen(true); }}
          >
            Add Product
          </Button>
        )}
      />
      <DataTable
        title="Product List"
        columns={COLUMNS}
        rows={products}
        searchKey={['itemName', 'vendorName', 'itemCode', 'groupName']}
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

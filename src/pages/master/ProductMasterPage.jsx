import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
import { gasApi } from '../../services/gasApi';
import { formatCurrency } from '../../utils/formatters';

const PRODUCT_TYPES = ['Raw Material', 'Consumables', 'Capital Equipment', 'Office Supply', 'IT Equipment'];

const COLUMNS = [
  { key: 'type',         label: 'Product Type',       render: v => <Chip label={v} size="small" sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600 }} /> },
  { key: 'supplierId',   label: 'Supplier ID',         render: v => <Typography variant="body2" fontWeight={600} color="text.secondary">{v}</Typography> },
  { key: 'supplierName', label: 'Supplier Name',       render: v => <Typography variant="body2" fontWeight={700} color="primary.main">{v}</Typography> },
  { key: 'groupName',    label: 'Group Name',          render: v => <Chip label={v} size="small" variant="outlined" color="primary" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600 }} /> },
  { key: 'itemName',     label: 'Item Name',           render: v => <Typography variant="body2" fontWeight={500} sx={{ maxWidth: 200 }}>{v}</Typography> },
  { key: 'unit',         label: 'Unit',                render: v => <Chip label={v} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} /> },
  { key: 'itemCode',     label: 'Item Code',           render: v => <Typography variant="caption" fontFamily="monospace" fontWeight={700} bgcolor="action.hover" px={0.8} py={0.3} borderRadius={0.5}>{v}</Typography> },
  { key: 'purchaseRate', label: 'Purchase Rate',       render: v => <Typography variant="body2" fontWeight={700} color="success.main">{formatCurrency(v)}</Typography> },
  { key: 'whatsapp',    label: 'Party Whatsapp No.',  render: v => <Typography variant="body2" color="text.secondary">📱 {v}</Typography> },
];

function ProductForm({ open, onClose, editItem, onSave }) {
  const vendors = useSelector(state => state.vendorMaster.items) || [];
  
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      type: '', supplierId: '', supplierName: '', groupName: '',
      itemName: '', unit: '', itemCode: '', purchaseRate: '', whatsapp: '',
    },
  });

  useEffect(() => {
    if (editItem) {
      reset(editItem);
    } else {
      reset({
        type: '', supplierId: '', supplierName: '', groupName: '',
        itemName: '', unit: '', itemCode: '', purchaseRate: '', whatsapp: '',
      });
    }
  }, [editItem, open, reset]);

  const onSubmit = data => {
    onSave({ ...data, id: editItem?.id || Date.now(), purchaseRate: parseFloat(data.purchaseRate) || 0 });
    onClose();
    reset();
  };

  const INPUT_SX = { '& .MuiInputBase-root': { fontSize: '0.875rem' } };
  const field = (name, label, opts = {}) => (
    <TextField
      fullWidth size="small" label={label} sx={INPUT_SX}
      {...register(name, { required: opts.required !== false ? `${label} is required` : false })}
      error={!!errors[name]} helperText={errors[name]?.message}
      type={opts.type || 'text'}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{editItem ? 'Edit Product' : 'Add New Product'}</DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller name="type" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
                <TextField {...f} select fullWidth size="small" label="Product Type" error={!!errors.type} helperText={errors.type?.message} sx={INPUT_SX}>
                  {PRODUCT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>{field('supplierId', 'Supplier ID')}</Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="supplierName" control={control} rules={{ required: 'Required' }} render={({ field: f }) => (
                <TextField 
                  {...f} 
                  select 
                  fullWidth 
                  size="small" 
                  label="Supplier Name" 
                  error={!!errors.supplierName} 
                  helperText={errors.supplierName?.message} 
                  sx={INPUT_SX}
                  onChange={(e) => {
                    f.onChange(e.target.value);
                    const selectedVen = vendors.find(v => v.vendorName === e.target.value);
                    if (selectedVen) {
                      setValue('supplierId', String(selectedVen.id || ''));
                      setValue('whatsapp', selectedVen.phoneNumber || '');
                    }
                  }}
                >
                  {vendors.map(v => <MenuItem key={v.id} value={v.vendorName}>{v.vendorName}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>{field('groupName', 'Group Name')}</Grid>
            <Grid item xs={12} sm={6}>{field('itemName', 'Item Name')}</Grid>
            <Grid item xs={12} sm={6}>{field('unit', 'Unit')}</Grid>
            <Grid item xs={12} sm={6}>{field('itemCode', 'Item Code')}</Grid>
            <Grid item xs={12} sm={6}>{field('purchaseRate', 'Purchase Rate', { type: 'number' })}</Grid>
            <Grid item xs={12} sm={6}>{field('whatsapp', 'Party Whatsapp No.', { required: false })}</Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained">{editItem ? 'Update' : 'Add'} Product</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function ProductMasterPage() {
  const { products, refresh, updateRow } = useData();
  const [formOpen, setFormOpen]  = useState(false);
  const [editItem, setEditItem]  = useState(null);

  const handleSave = async item => {
    const existing = products.find(p => p.itemCode === item.itemCode);
    const isEdit = !!existing;
    try {
      let result;
      const payload = {
        "Product Type": item.type,
        "Supplier ID": item.supplierId,
        "Supplier Name": item.supplierName,
        "Group Name": item.groupName,
        "Item Name": item.itemName,
        "Unit": item.unit,
        "Item Code": item.itemCode,
        "Purchase Rate": Number(item.purchaseRate) || 0,
        "Party Whatsapp No.": item.whatsapp || "",
      };
      if (isEdit) {
        await updateRow('products', existing._row, payload);
        result = { success: true };
      } else {
        const rowData = [
          payload["Product Type"],
          payload["Supplier ID"],
          payload["Supplier Name"],
          payload["Group Name"],
          payload["Item Name"],
          payload["Unit"],
          payload["Item Code"],
          payload["Purchase Rate"],
          payload["Party Whatsapp No."]
        ];
        result = await gasApi.insertInColumns("Master Data", 1, rowData, 2);
      }
      if (result.success) {
        toast.success(isEdit ? 'Product updated!' : 'Product added!');
        await refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save product.");
    }
  };

  const handleDelete = async row => {
    if (!window.confirm(`Are you sure you want to delete product "${row.itemName}"?`)) return;
    try {
      const result = await gasApi.deleteRowInColumns("Master Data", row._row, 1, 9);
      if (result.success) {
        toast.success('Product deleted.');
        await refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete product.");
    }
  };

  const actions = row => (
    <Box display="flex" gap={0.5}>
      <Tooltip title="Edit" arrow>
        <IconButton
          size="small"
          onClick={() => { setEditItem(row); setFormOpen(true); }}
          sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 1, p: 0.5, '&:hover': { bgcolor: 'primary.dark' } }}
        >
          <EditIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete" arrow>
        <IconButton
          size="small"
          onClick={() => handleDelete(row)}
          sx={{ bgcolor: '#ef4444', color: 'white', borderRadius: 1, p: 0.5, '&:hover': { bgcolor: '#dc2626' } }}
        >
          <DeleteIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Product Data"
        subtitle="Master reference table for all products and their supplier mapping"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Masters' }, { label: 'Product Data' }]}
        actions={
          <Button
            variant="contained" startIcon={<AddIcon />}
            onClick={() => { setEditItem(null); setFormOpen(true); }}
          >
            Add Product
          </Button>
        }
      />
      <DataTable
        title="Product List"
        columns={COLUMNS}
        rows={products}
        searchKey={['itemName', 'supplierName', 'itemCode', 'groupName']}
        actions={actions}
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

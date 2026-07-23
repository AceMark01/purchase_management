import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Button, Chip } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import OrderCancelForm from '../../components/orderCancel/OrderCancelForm';
import { useData } from '../../contexts/DataContext';

export default function OrderCancelPage() {
  const records = useSelector((state) => state.workflow.records) || [];
  const { cancelOrders = [] } = useData();

  const [formOpen, setFormOpen] = useState(false);

  // Enrich cancel orders sheet data with full record fields by indentNumber / serialNo match
  const tableData = useMemo(() => {
    return cancelOrders.map((item, idx) => {
      const matched = records.find(r =>
        r.indentNumber &&
        String(r.indentNumber).toLowerCase() === String(item.indentNumber).toLowerCase() &&
        (item.serialNo ? Number(r.serialNo) === Number(item.serialNo) : true)
      );

      const totalQty = Number(matched?.poQty || matched?.quantity || 0);
      const liftedQty = Number(matched?.totalLifted || 0);
      const receivedQty = Number(matched?.receivedQuantity || 0);
      const pendingQty = matched?.pendingLifting ?? Math.max(0, totalQty - liftedQty - receivedQty);
      const totalCanceledQty = Number(matched?.totalCanceledQty || 0);

      return {
        id: item.id || (idx + 1),
        timestamp: item.timestamp || '—',
        cancelStage: item.cancelStage || '—',
        indentNumber: item.indentNumber || '—',
        serialNo: item.serialNo || 1,
        itemName: matched?.itemName || '—',
        itemCode: matched?.itemCode || '—',
        unit: matched?.unit || '',
        totalQty: totalQty,
        liftedQty: liftedQty,
        receivedQty: receivedQty,
        pendingQty: pendingQty,
        totalCanceledQty: totalCanceledQty,
        cancelQty: item.cancelQty || 0,
      };
    });
  }, [cancelOrders, records]);

  const columns = useMemo(() => [
    {
      key: 'timestamp',
      label: 'Timestamp',
      minWidth: 150,
      render: (v) => v || '—'
    },
    {
      key: 'cancelStage',
      label: 'Stage of Cancel',
      minWidth: 140,
      render: (v) => (
        <Chip
          label={v || 'Cancelled'}
          size="small"
          color="error"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
        />
      )
    },
    {
      key: 'indentNumber',
      label: 'Indent Number',
      minWidth: 130,
      render: (v) => (
        <Chip label={v} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
      )
    },
    { key: 'serialNo', label: 'Serial No.', minWidth: 90 },
    {
      key: 'itemName',
      label: 'Item Name',
      minWidth: 200,
      render: (v) => (
        <Box sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, py: 0.5 }}>
          {v || '—'}
        </Box>
      )
    },
    { key: 'itemCode', label: 'Item Code', minWidth: 120 },
    {
      key: 'totalQty',
      label: 'Total Qty',
      minWidth: 100,
      render: (v, r) => `${v} ${r.unit || ''}`
    },
    {
      key: 'liftedQty',
      label: 'Lifted Qty',
      minWidth: 100,
      render: (v, r) => `${v} ${r.unit || ''}`
    },
    {
      key: 'receivedQty',
      label: 'Received Qty',
      minWidth: 100,
      render: (v, r) => `${v} ${r.unit || ''}`
    },
    {
      key: 'pendingQty',
      label: 'Pending Qty',
      minWidth: 100,
      render: (v, r) => `${v} ${r.unit || ''}`
    },
    {
      key: 'cancelQty',
      label: 'Cancelled Qty',
      minWidth: 110,
      render: (v, r) => (
        <Chip
          label={`${v} ${r.unit || ''}`}
          size="small"
          color="error"
          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
        />
      )
    },
    {
      key: 'totalCanceledQty',
      label: 'TOTAL CANCELED QTY',
      minWidth: 140,
      render: (v, r) => (
        <Chip
          label={`${v || 0} ${r.unit || ''}`}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
        />
      )
    },
  ], []);

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <PageHeader
          title="Order Cancel"
          subtitle={`${tableData.length} cancelled order item(s)`}
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Order Cancel' }]}
        />
        <Button
          variant="contained"
          color="error"
          startIcon={<CancelIcon />}
          onClick={() => setFormOpen(true)}
          sx={{ fontWeight: 700, px: 2.5, py: 1, borderRadius: 2 }}
        >
          Cancel Order
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={tableData}
        title="Cancelled Orders List"
        searchKey={['indentNumber', 'itemName', 'cancelStage']}
        density="compact"
        hideActionsColumn
      />

      {formOpen && (
        <OrderCancelForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
        />
      )}
    </Box>
  );
}

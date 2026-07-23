import { useState, useMemo, useCallback } from 'react';
import { useSelector }                     from 'react-redux';
import { Box, Button, Link }               from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon   from '@mui/icons-material/OpenInNew';
import DataTable              from '../../components/common/DataTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs           from '../../components/common/WorkflowTabs';
import PageHeader             from '../../components/common/PageHeader';
import ReceiveMaterialForm    from '../../components/receiveMaterial/ReceiveMaterialForm';
import GeneratePOForm         from '../../components/po/GeneratePOForm';
import { groupByPO, PO_COLUMNS } from '../../utils/poGroupUtils';

const liftNoCol = {
  key: 'liftNo',
  label: 'Lift No.',
  minWidth: 120,
  render: (v) => v || '—'
};

export default function ReceiveMaterialPage() {
  const records = useSelector((s) => s.workflow.records);

  const [tabValue,       setTabValue]       = useState(0);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [receiveOpen,    setReceiveOpen]    = useState(false);
  const [selectedRow,    setSelectedRow]    = useState(null);
  const [poViewOpen,     setPoViewOpen]     = useState(false);
  const [poViewRecord,   setPoViewRecord]   = useState(null);

  const stageRecords = useMemo(() => {
    const recs = tabValue === 0
      ? records.filter(r => r.workflowStage.receiveMaterial === 'Pending')
      : records.filter(r => r.workflowStage.receiveMaterial === 'Completed');
    return groupByPO(recs);
  }, [records, tabValue]);

  const pendingCount = useMemo(() => groupByPO(records.filter(r => r.workflowStage.receiveMaterial === 'Pending')).length, [records]);
  const historyCount = useMemo(() => groupByPO(records.filter(r => r.workflowStage.receiveMaterial === 'Completed')).length, [records]);

  const filtered = useMemo(() =>
    stageRecords.filter((i) => {
      const f = appliedFilters;
      return (
        (!f.partyName   || i.partyName.toLowerCase().includes(f.partyName.toLowerCase()))     &&
        (!f.companyName || i.companyName.toLowerCase().includes(f.companyName.toLowerCase())) &&
        (!f.status      || i.status === f.status)                                             &&
        (!f.dateFrom    || i.createdDate >= f.dateFrom)                                       &&
        (!f.dateTo      || i.createdDate <= f.dateTo)
      );
    }), [stageRecords, appliedFilters]);

  const handleViewPO = useCallback((row) => {
    setPoViewRecord(row);
    setPoViewOpen(true);
  }, []);

  const poDocCol = useMemo(() => ({
    key: 'poViewLink',
    label: 'PO Document',
    minWidth: 120,
    render: (_v, row) => row.poNumber ? (
      <Link component="button" onClick={() => handleViewPO(row)} underline="hover"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.78rem', color: 'primary.main', fontWeight: 600 }}>
        <OpenInNewIcon sx={{ fontSize: 13 }} /> View PO
      </Link>
    ) : '—',
  }), [handleViewPO]);

  const pendingCols = useMemo(() => {
    const [poNoCol, poDateCol, vendorCol, companyCol, itemsCol, _dupPendingCol, amountCol, dateCol] = PO_COLUMNS;
    return [
      liftNoCol,
      poNoCol,
      poDateCol,
      vendorCol,
      companyCol,
      itemsCol,
      {
        key: 'pendingLiftingQty',
        label: 'QUANTITY',
        minWidth: 120,
        render: (_v, r) => {
          const qty = r._liftingQty || r.liftingQty || r.totalLifted || 0;
          return `${qty} ${r.unit || ''}`.trim();
        }
      },
      amountCol,
      dateCol,
      poDocCol,
    ];
  }, [poDocCol]);

  const historyCols = useMemo(() => {
    const [poNoCol, poDateCol, vendorCol, companyCol, itemsCol, _dupPendingCol, amountCol, dateCol] = PO_COLUMNS;
    return [
      liftNoCol,
      poNoCol,
      poDateCol,
      vendorCol,
      companyCol,
      itemsCol,
      {
        key: 'receivedQuantity',
        label: 'RECEIVED QUANTITY',
        minWidth: 160,
        render: (_v, r) => {
          const qty = r._receivedQuantity || r.receivedQuantity || r._liftingQty || r.liftingQty || r._totalQty || r.quantity || 0;
          return `${qty} ${r.unit || ''}`.trim();
        }
      },
      amountCol,
      dateCol,
      {
        key: 'billImage',
        label: 'BILL IMAGE',
        minWidth: 120,
        render: (v, row) => {
          const imgUrl = v || row._billImage || row.billImage || row.receiptImage;
          if (!imgUrl) return '—';
          let targetUrl = String(imgUrl).trim();
          if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://drive.google.com/open?id=${targetUrl}`;
          }
          return (
            <Link
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.78rem', color: 'primary.main', fontWeight: 600 }}
            >
              <OpenInNewIcon sx={{ fontSize: 13 }} /> View
            </Link>
          );
        }
      },
      poDocCol,
    ];
  }, [poDocCol]);

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="receive" size="small" variant="contained" color="success"
          startIcon={<CheckCircleIcon />}
          onClick={() => { setSelectedRow(row); setReceiveOpen(true); }}
          sx={{ minWidth: '120px', fontSize: '0.7rem' }}>
          Receive
        </Button>
      ];
    }
    return [];
  }, [tabValue]);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Receive Material"
        subtitle={`${filtered.length} PO(s) found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Receive Material' }]}
      />
      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} pendingCount={pendingCount} historyCount={historyCount} />
      <WorkflowFilters appliedFilters={appliedFilters} onApply={setAppliedFilters} onReset={() => setAppliedFilters(defaultFilters)} />

      <DataTable
        columns={tabValue === 0 ? pendingCols : historyCols}
        rows={filtered}
        title={tabValue === 0 ? 'Pending Receive' : 'Receive History'}
        searchKey={['poNumber', 'partyName', 'companyName']}
        actions={actions}
        density="compact"
        hideActionsColumn={tabValue === 1}
      />

      {receiveOpen && (
        <ReceiveMaterialForm
          open={receiveOpen}
          onClose={() => { setReceiveOpen(false); setSelectedRow(null); }}
          record={selectedRow}
          groupIds={selectedRow?._groupIds}
        />
      )}

      {poViewOpen && (
        <GeneratePOForm open={poViewOpen} onClose={() => { setPoViewOpen(false); setPoViewRecord(null); }} viewRecord={poViewRecord} />
      )}
    </Box>
  );
}

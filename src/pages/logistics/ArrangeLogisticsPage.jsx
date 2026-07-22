import { useState, useMemo, useCallback } from 'react';
import { useSelector }                     from 'react-redux';
import { Box, Button, Link, Chip }         from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import OpenInNewIcon     from '@mui/icons-material/OpenInNew';
import DataTable              from '../../components/common/DataTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs           from '../../components/common/WorkflowTabs';
import PageHeader             from '../../components/common/PageHeader';
import ArrangeLogisticsForm   from '../../components/logistics/ArrangeLogisticsForm';
import GeneratePOForm         from '../../components/po/GeneratePOForm';
import { groupByPO, PO_COLUMNS } from '../../utils/poGroupUtils';

const getHistoryCols = (onViewPO) => [
  ...PO_COLUMNS,
  {
    key: 'poViewLink',
    label: 'PO Document',
    minWidth: 120,
    render: (_v, row) => row.poNumber ? (
      <Link component="button" onClick={() => onViewPO(row)} underline="hover"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.78rem', color: 'primary.main', fontWeight: 600 }}>
        <OpenInNewIcon sx={{ fontSize: 13 }} /> View PO
      </Link>
    ) : '—',
  },
];

export default function ArrangeLogisticsPage() {
  const records = useSelector((s) => s.workflow.records);

  const [tabValue,       setTabValue]       = useState(0);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [logisticsOpen,  setLogisticsOpen]  = useState(false);
  const [selectedRow,    setSelectedRow]    = useState(null);
  const [poViewOpen,     setPoViewOpen]     = useState(false);
  const [poViewRecord,   setPoViewRecord]   = useState(null);

  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      const recs = records.filter(r => r.workflowStage?.logistics === 'Pending' || (r.pendingLifting && r.pendingLifting > 0));
      return groupByPO(recs);
    } else {
      const historyRows = [];
      records.forEach((r) => {
        if (r.lifts && r.lifts.length > 0) {
          r.lifts.forEach((lift, lIdx) => {
            historyRows.push({
              ...r,
              id: `${r.id}_lift_${lIdx}`,
              liftNo: lift.liftNo || r.liftNo || '—',
              liftingQty: lift.liftingQty || r.liftingQty || 0,
              transporterName: lift.transporterName || r.transporterName || '—',
              vehicleNo: lift.vehicleNo || r.vehicleNo || '—',
              driverNo: lift.driverNo || r.driverNo || '—',
              biltyNo: lift.biltyNo || r.biltyNo || '—',
              biltyImage: lift.biltyImage || r.biltyImage,
              transportingAmount: lift.transportingAmount || r.transportingAmount,
              partyAddress: lift.partyAddress || r.partyAddress,
              locationLink: lift.locationLink || r.locationLink,
              liftDate: lift.date || r.createdDate,
            });
          });
        } else if (r.liftNo || r.workflowStage?.logistics === 'Completed' || (r.totalLifted && r.totalLifted > 0)) {
          historyRows.push({
            ...r,
            liftingQty: r.liftingQty || r.totalLifted || r.quantity || 0,
            liftDate: r.createdDate,
          });
        }
      });
      return historyRows;
    }
  }, [records, tabValue]);

  const filtered = useMemo(() =>
    stageRecords.filter((i) => {
      const f = appliedFilters;
      return (
        (!f.partyName   || i.partyName?.toLowerCase().includes(f.partyName.toLowerCase()))     &&
        (!f.companyName || i.companyName?.toLowerCase().includes(f.companyName.toLowerCase())) &&
        (!f.status      || i.status === f.status)                                             &&
        (!f.dateFrom    || i.createdDate >= f.dateFrom)                                       &&
        (!f.dateTo      || i.createdDate <= f.dateTo)
      );
    }), [stageRecords, appliedFilters]);

  const handleViewPO = (row) => { setPoViewRecord(row); setPoViewOpen(true); };

  const indentCol = useMemo(() => ({
    key: 'indentNumber',
    label: 'Indent Number',
    minWidth: 150,
    render: (_v, row) => {
      const vals = row._indentNumbers || (row.indentNumber ? [row.indentNumber] : []);
      if (!vals.length) return '—';
      return vals.map(num => (
        <Chip 
          key={num} 
          label={num} 
          size="small" 
          color="primary" 
          sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20, mr: 0.5, mb: 0.5 }} 
        />
      ));
    }
  }), []);

  const serialCol = useMemo(() => ({
    key: 'serialNo',
    label: 'Serial No.',
    minWidth: 100,
    render: (_v, row) => {
      const vals = row._serialNos || (row.serialNo !== undefined && row.serialNo !== null && row.serialNo !== '' ? [row.serialNo] : []);
      return vals.length ? vals.join(', ') : '—';
    }
  }), []);

  const liftCol = useMemo(() => ({
    key: 'liftNo',
    label: 'Lift No.',
    minWidth: 120,
    render: (v) => v || '—'
  }), []);

  const totalQtyCol = useMemo(() => ({
    key: '_totalQty',
    label: 'Total PO Qty',
    minWidth: 120,
    render: (_v, r) => r._totalQty || r.poQty || r.quantity || 0
  }), []);

  const liftingQtyCol = useMemo(() => ({
    key: 'liftingQty',
    label: 'Lifting Qty',
    minWidth: 120,
    render: (v, r) => (
      <Chip label={v || r.totalLifted || r.poQty || r.quantity || 0} size="small" color="info" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
    )
  }), []);

  const totalLiftedCol = useMemo(() => ({
    key: '_totalLifted',
    label: 'Total Lifted',
    minWidth: 120,
    render: (_v, r) => r._totalLifted ?? r.totalLifted ?? 0
  }), []);

  const pendingLiftingCol = useMemo(() => ({
    key: '_pendingLifting',
    label: 'Pending Lifting',
    minWidth: 130,
    render: (_v, r) => {
      const val = r._pendingLifting ?? r.pendingLifting ?? Math.max(0, (r._totalQty || r.poQty || r.quantity || 0) - (r._totalLifted || r.totalLifted || 0));
      return (
        <Chip 
          label={val} 
          size="small" 
          color={val > 0 ? 'warning' : 'success'} 
          sx={{ fontWeight: 700, fontSize: '0.75rem' }} 
        />
      );
    }
  }), []);

  const transportingAmountCol = useMemo(() => ({
    key: 'transportingAmount',
    label: 'Transporting Amount',
    minWidth: 160,
    render: (v) => v ? `₹ ${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—',
  }), []);

  const pendingCols = useMemo(() => {
    return [
      indentCol,
      serialCol,
      ...getHistoryCols(handleViewPO).slice(0, 4), // PO Number, PO Date, Vendor, Company
      totalQtyCol,
      totalLiftedCol,
      pendingLiftingCol,
      ...getHistoryCols(handleViewPO).slice(4)
    ];
  }, [handleViewPO, indentCol, serialCol, totalQtyCol, totalLiftedCol, pendingLiftingCol]);

  const historyCols = useMemo(() => {
    const baseCols = getHistoryCols(handleViewPO).filter(c => c.key !== '_totalAmount');
    return [
      liftCol,
      indentCol,
      ...baseCols.slice(0, 4), // PO Number, PO Date, Vendor, Company
      liftingQtyCol,
      totalLiftedCol,
      pendingLiftingCol,
      { key: 'transporterName', label: 'Transporter Name', minWidth: 150 },
      { key: 'vehicleNo', label: 'Vehicle No.', minWidth: 130 },
      { key: 'biltyNo', label: 'Bilty No.', minWidth: 120 },
      transportingAmountCol,
      ...baseCols.slice(4)
    ];
  }, [handleViewPO, indentCol, liftCol, liftingQtyCol, totalLiftedCol, pendingLiftingCol, transportingAmountCol]);

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="logistics" size="small" variant="contained" color="success"
          startIcon={<LocalShippingIcon />}
          onClick={() => { setSelectedRow(row); setLogisticsOpen(true); }}
          sx={{ minWidth: 130, fontSize: '0.7rem', px: 1.5 }}>
          Arrange Logistics
        </Button>
      ];
    }
    return [];
  }, [tabValue]);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Arrange Logistics & Lifting"
        subtitle={`${filtered.length} PO(s) found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Arrange Logistics' }]}
      />
      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />
      <WorkflowFilters appliedFilters={appliedFilters} onApply={setAppliedFilters} onReset={() => setAppliedFilters(defaultFilters)} />

      <DataTable
        columns={tabValue === 1 ? historyCols : pendingCols}
        rows={filtered}
        title={tabValue === 0 ? 'Pending — Logistics & Lifting' : 'History — Logistics & Lifting'}
        searchKey={['poNumber', 'partyName', 'companyName']}
        actions={actions}
        density="compact"
        hideActionsColumn={tabValue === 1}
      />

      {logisticsOpen && (
        <ArrangeLogisticsForm
          open={logisticsOpen}
          onClose={() => { setLogisticsOpen(false); setSelectedRow(null); }}
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

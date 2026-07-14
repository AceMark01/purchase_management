import { useState, useMemo, useCallback } from 'react';
import { useSelector }                     from 'react-redux';
import { Box, Button, Link, Chip }         from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import OpenInNewIcon     from '@mui/icons-material/OpenInNew';
import { ViewBtn }       from '../../components/common/ActionButtons';
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
    const recs = tabValue === 0
      ? records.filter(r => r.workflowStage.logistics === 'Pending')
      : records.filter(r => r.workflowStage.logistics === 'Completed');
    return groupByPO(recs);
  }, [records, tabValue]);

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

  const pendingCols = useMemo(() => {
    return [indentCol, serialCol, ...PO_COLUMNS];
  }, [indentCol, serialCol]);

  const historyCols = useMemo(() => {
    return [indentCol, liftCol, ...getHistoryCols(handleViewPO)];
  }, [handleViewPO, indentCol, liftCol]);

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
    return [<ViewBtn key="view" onClick={() => handleViewPO(row)} />];
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

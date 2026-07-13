import { useState, useMemo, useCallback } from 'react';
import { useSelector }                     from 'react-redux';
import { Box, Button, Link }               from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon   from '@mui/icons-material/OpenInNew';
import { ViewBtn }     from '../../components/common/ActionButtons';
import DataTable              from '../../components/common/DataTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs           from '../../components/common/WorkflowTabs';
import PageHeader             from '../../components/common/PageHeader';
import LiftReceiverForm       from '../../components/liftReceiver/LiftReceiverForm';
import GeneratePOForm         from '../../components/po/GeneratePOForm';
import { groupByPO, PO_COLUMNS } from '../../utils/poGroupUtils';

const getHistoryCols = (onViewPO) => [
  ...PO_COLUMNS,
  { key: 'liftStatus', label: 'Lift Status', minWidth: 110 },
  { key: 'liftPlanned', label: 'Planned 2', minWidth: 155 },
  { key: 'liftActual', label: 'Actual 2', minWidth: 155 },
  { key: 'liftTimeDelay', label: 'Time Delay 2', minWidth: 110 },
  {
    key: 'liftedImage',
    label: 'Lifted Image',
    minWidth: 120,
    render: (_v, row) => row.liftedImage ? (
      <Link href={row.liftedImage} target="_blank" underline="hover" sx={{ fontWeight: 600 }}>
        View Image
      </Link>
    ) : '—',
  },
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

export default function LiftReceiverPage() {
  const records = useSelector((s) => s.workflow.records);

  const [tabValue,      setTabValue]      = useState(0);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [receiverOpen,  setReceiverOpen]  = useState(false);
  const [selectedRow,   setSelectedRow]   = useState(null);
  const [poViewOpen,    setPoViewOpen]    = useState(false);
  const [poViewRecord,  setPoViewRecord]  = useState(null);

  const stageRecords = useMemo(() => {
    const recs = tabValue === 0
      ? records.filter(r => r.workflowStage.liftReceiver === 'Pending')
      : records.filter(r => r.workflowStage.liftReceiver === 'Completed');
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
  const historyCols  = useMemo(() => getHistoryCols(handleViewPO), []);

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="verify" size="small" variant="contained" color="success"
          startIcon={<CheckCircleIcon />}
          onClick={() => { setSelectedRow(row); setReceiverOpen(true); }}
          sx={{ minWidth: '120px', fontSize: '0.7rem' }}>
          Verify
        </Button>
      ];
    }
    return [<ViewBtn key="view" onClick={() => handleViewPO(row)} />];
  }, [tabValue]);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Lift Receiver"
        subtitle={`${filtered.length} PO(s) found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Lift Receiver' }]}
      />
      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />
      <WorkflowFilters appliedFilters={appliedFilters} onApply={setAppliedFilters} onReset={() => setAppliedFilters(defaultFilters)} />

      <DataTable
        columns={tabValue === 1 ? historyCols : PO_COLUMNS}
        rows={filtered}
        title={tabValue === 0 ? 'Pending Receiver' : 'Receiver History'}
        searchKey={['poNumber', 'partyName', 'companyName']}
        actions={actions}
        density="compact"
      />

      {receiverOpen && (
        <LiftReceiverForm
          open={receiverOpen}
          onClose={() => { setReceiverOpen(false); setSelectedRow(null); }}
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

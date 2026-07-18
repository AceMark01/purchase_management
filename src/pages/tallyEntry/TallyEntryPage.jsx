import { useState, useMemo, useCallback } from 'react';
import { useSelector }                     from 'react-redux';
import { Box, Button, Link }               from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon   from '@mui/icons-material/OpenInNew';
import DataTable              from '../../components/common/DataTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs           from '../../components/common/WorkflowTabs';
import PageHeader             from '../../components/common/PageHeader';
import TallyEntryForm         from '../../components/tallyEntry/TallyEntryForm';
import GeneratePOForm         from '../../components/po/GeneratePOForm';
import { groupByPO, PO_COLUMNS } from '../../utils/poGroupUtils';
import { formatDate } from '../../utils/formatters';

const getHistoryCols = (onViewPO) => [
  ...PO_COLUMNS,
  { key: 'tallyPlanned', label: 'PLANNED', minWidth: 155, render: (v) => formatDate(v) },
  { key: 'tallyActual', label: 'ACTUAL', minWidth: 155, render: (v) => formatDate(v) },
  { 
    key: 'tallyTimeDelay', 
    label: 'TIME DELAY', 
    minWidth: 110,
    render: (_v, row) => {
      if (!row.tallyPlanned || !row.tallyActual) return '00:00:00';
      const pTime = new Date(row.tallyPlanned);
      const aTime = new Date(row.tallyActual);
      if (isNaN(pTime.getTime()) || isNaN(aTime.getTime())) return '00:00:00';
      const diffMs = Math.abs(aTime - pTime);
      const totalSeconds = Math.floor(diffMs / 1000);
      const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const ss = String(totalSeconds % 60).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
  },
  {
    key: 'biltyAttach',
    label: 'Bilty Attach',
    minWidth: 110,
    render: (_v, row) => row.biltyAttach ? (
      <Link href={row.biltyAttach} target="_blank" underline="hover" sx={{ fontWeight: 600 }}>
        View Bilty
      </Link>
    ) : '—',
  },
  {
    key: 'invoiceAttach',
    label: 'Invoice Attach',
    minWidth: 120,
    render: (_v, row) => row.invoiceAttach ? (
      <Link href={row.invoiceAttach} target="_blank" underline="hover" sx={{ fontWeight: 600 }}>
        View Invoice
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

const getPendingCols = (onViewPO) => [
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

export default function TallyEntryPage() {
  const records = useSelector((s) => s.workflow.records);

  const [tabValue,       setTabValue]       = useState(0);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [tallyOpen,      setTallyOpen]      = useState(false);
  const [selectedRow,    setSelectedRow]    = useState(null);
  const [poViewOpen,     setPoViewOpen]     = useState(false);
  const [poViewRecord,   setPoViewRecord]   = useState(null);

  const stageRecords = useMemo(() => {
    const recs = records.filter(r => {
      const planned3 = r.tallyPlanned && String(r.tallyPlanned).trim() !== "";
      const actual3 = r.tallyActual && String(r.tallyActual).trim() !== "";

      if (tabValue === 0) {
        return planned3 && !actual3;
      } else {
        return planned3 && actual3;
      }
    });
    return groupByPO(recs);
  }, [records, tabValue]);

  const pendingCount = useMemo(() => {
    return groupByPO(records.filter(r => {
      const planned3 = r.tallyPlanned && String(r.tallyPlanned).trim() !== "";
      const actual3 = r.tallyActual && String(r.tallyActual).trim() !== "";
      return planned3 && !actual3;
    })).length;
  }, [records]);

  const historyCount = useMemo(() => {
    return groupByPO(records.filter(r => {
      const planned3 = r.tallyPlanned && String(r.tallyPlanned).trim() !== "";
      const actual3 = r.tallyActual && String(r.tallyActual).trim() !== "";
      return planned3 && actual3;
    })).length;
  }, [records]);

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
  const pendingCols  = useMemo(() => getPendingCols(handleViewPO), []);

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="tally" size="small" variant="contained" color="success"
          startIcon={<CheckCircleIcon />}
          onClick={() => { setSelectedRow(row); setTallyOpen(true); }}
          sx={{ minWidth: '120px', fontSize: '0.7rem' }}>
          Tally Entry
        </Button>
      ];
    }
    return [];
  }, [tabValue]);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Tally Entry Verification"
        subtitle={`${filtered.length} PO(s) found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tally Entry' }]}
      />
      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} pendingCount={pendingCount} historyCount={historyCount} />
      <WorkflowFilters appliedFilters={appliedFilters} onApply={setAppliedFilters} onReset={() => setAppliedFilters(defaultFilters)} />

      <DataTable
        columns={tabValue === 1 ? historyCols : pendingCols}
        rows={filtered}
        title={tabValue === 0 ? 'Pending Tally Entry' : 'Tally History'}
        searchKey={['poNumber', 'partyName', 'companyName']}
        actions={actions}
        density="compact"
        hideActionsColumn={tabValue === 1}
      />

      {tallyOpen && (
        <TallyEntryForm
          open={tallyOpen}
          onClose={() => { setTallyOpen(false); setSelectedRow(null); }}
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

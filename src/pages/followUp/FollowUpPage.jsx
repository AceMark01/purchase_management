import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Box, Button, Link, Chip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DataTable from '../../components/common/DataTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import PageHeader from '../../components/common/PageHeader';
import CompleteFollowUpForm from '../../components/followUp/CompleteFollowUpForm';
import GeneratePOForm from '../../components/po/GeneratePOForm';
import { groupByPO, PO_COLUMNS } from '../../utils/poGroupUtils';

const getColumns = (onViewPO) => [
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

export default function FollowUpPage() {
  const records = useSelector((s) => s.workflow.records);

  const [tabValue, setTabValue] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [poViewOpen, setPoViewOpen] = useState(false);
  const [poViewRecord, setPoViewRecord] = useState(null);

  const stageRecords = useMemo(() => {
    const recs = tabValue === 0
      ? records.filter(r => r.workflowStage.followUp === 'Pending')
      : records.filter(r => r.workflowStage.followUp === 'Completed');
    return groupByPO(recs);
  }, [records, tabValue]);

  const pendingCount = useMemo(() => groupByPO(records.filter(r => r.workflowStage.followUp === 'Pending')).length, [records]);
  const historyCount = useMemo(() => groupByPO(records.filter(r => r.workflowStage.followUp === 'Completed')).length, [records]);

  const filtered = useMemo(() =>
    stageRecords.filter((i) => {
      const f = appliedFilters;
      return (
        (!f.partyName || i.partyName.toLowerCase().includes(f.partyName.toLowerCase())) &&
        (!f.companyName || i.companyName.toLowerCase().includes(f.companyName.toLowerCase())) &&
        (!f.status || i.status === f.status) &&
        (!f.dateFrom || i.createdDate >= f.dateFrom) &&
        (!f.dateTo || i.createdDate <= f.dateTo)
      );
    }), [stageRecords, appliedFilters]);

  const handleOpenForm = (row) => { setSelectedRow(row); setFormOpen(true); };
  const handleCloseForm = () => { setFormOpen(false); setSelectedRow(null); };
  const handleViewPO = useCallback((row) => { setPoViewRecord(row); setPoViewOpen(true); }, []);

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

  const columns = useMemo(() => {
    const cols = getColumns(handleViewPO);
    cols.splice(2, 0, indentCol, serialCol);
    return cols;
  }, [handleViewPO, indentCol, serialCol]);

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="complete" size="small" variant="contained" color="success"
          onClick={() => handleOpenForm(row)} sx={{ minWidth: '145px', fontSize: '0.7rem' }}>
          Complete Follow-Up
        </Button>
      ];
    }
    return [];
  }, [tabValue]);

  return (
    <Box>
      <PageHeader
        title="Follow-Up"
        subtitle={`${filtered.length} PO(s) found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Follow-Up' }]}
      />
      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} pendingCount={pendingCount} historyCount={historyCount} />
      <WorkflowFilters appliedFilters={appliedFilters} onApply={setAppliedFilters} onReset={() => setAppliedFilters(defaultFilters)} />

      <DataTable
        columns={columns}
        rows={filtered}
        title={tabValue === 0 ? 'Pending Follow-Ups' : 'Follow-Up History'}
        searchKey={['poNumber', 'partyName', 'companyName']}
        actions={actions}
        density="compact"
        hideActionsColumn={tabValue === 1}
      />

      {formOpen && (
        <CompleteFollowUpForm
          open={formOpen}
          onClose={handleCloseForm}
          selectedRow={selectedRow}
          groupIds={selectedRow?._groupIds}
        />
      )}

      {poViewOpen && (
        <GeneratePOForm
          open={poViewOpen}
          onClose={() => { setPoViewOpen(false); setPoViewRecord(null); }}
          viewRecord={poViewRecord}
        />
      )}
    </Box>
  );
}

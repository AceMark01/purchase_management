import { useState, useMemo, useCallback } from 'react';
import { useSelector }  from 'react-redux';
import { Box, Button } from '@mui/material';
import { ViewBtn }     from '../../components/common/ActionButtons';
import DataTable              from '../../components/common/DataTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs           from '../../components/common/WorkflowTabs';
import PageHeader             from '../../components/common/PageHeader';
import CompleteFollowUpForm   from '../../components/followUp/CompleteFollowUpForm';
import { groupByPO, PO_COLUMNS } from '../../utils/poGroupUtils';

export default function FollowUpPage() {
  const records = useSelector((s) => s.workflow.records);

  const [tabValue,       setTabValue]       = useState(0);
  const [formOpen,       setFormOpen]       = useState(false);
  const [selectedRow,    setSelectedRow]    = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

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
        (!f.partyName   || i.partyName.toLowerCase().includes(f.partyName.toLowerCase()))     &&
        (!f.companyName || i.companyName.toLowerCase().includes(f.companyName.toLowerCase())) &&
        (!f.status      || i.status === f.status)                                             &&
        (!f.dateFrom    || i.createdDate >= f.dateFrom)                                       &&
        (!f.dateTo      || i.createdDate <= f.dateTo)
      );
    }), [stageRecords, appliedFilters]);

  const handleOpenForm  = (row) => { setSelectedRow(row); setFormOpen(true); };
  const handleCloseForm = ()    => { setFormOpen(false); setSelectedRow(null); };

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="complete" size="small" variant="contained" color="success"
          onClick={() => handleOpenForm(row)} sx={{ minWidth: '145px', fontSize: '0.7rem' }}>
          Complete Follow-Up
        </Button>
      ];
    }
    return [<ViewBtn key="view" onClick={() => {}} />];
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
        columns={PO_COLUMNS}
        rows={filtered}
        title={tabValue === 0 ? 'Pending Follow-Ups' : 'Follow-Up History'}
        searchKey={['poNumber', 'partyName', 'companyName']}
        actions={actions}
        density="compact"
      />

      {formOpen && (
        <CompleteFollowUpForm
          open={formOpen}
          onClose={handleCloseForm}
          selectedRow={selectedRow}
          groupIds={selectedRow?._groupIds}
        />
      )}
    </Box>
  );
}

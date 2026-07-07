import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button } from '@mui/material';
import { ViewBtn, PrintBtn } from '../../components/common/ActionButtons';
import { toast } from 'react-toastify';
import { completeStage } from '../../store/slices/workflowSlice';
import WorkflowTable, { WORKFLOW_COLUMNS } from '../../components/common/WorkflowTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import PageHeader from '../../components/common/PageHeader';
import { printTable } from '../../utils/exportUtils';

export default function GetLiftingPage() {
  const dispatch = useDispatch();
  const records = useSelector((s) => s.workflow.records);
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: History
  
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      return records.filter(r => r.workflowStage.lifting === 'Pending');
    } else {
      return records.filter(r => r.workflowStage.lifting === 'Completed');
    }
  }, [records, tabValue]);

  const pendingCount = useMemo(() => records.filter(r => r.workflowStage.lifting === 'Pending').length, [records]);
  const historyCount = useMemo(() => records.filter(r => r.workflowStage.lifting === 'Completed').length, [records]);

  const filtered = useMemo(() => stageRecords.filter((i) => {
    const f = appliedFilters;
    return (
      (!f.indentNumber || i.indentNumber.toLowerCase().includes(f.indentNumber.toLowerCase())) &&
      (!f.itemName || i.itemName.toLowerCase().includes(f.itemName.toLowerCase())) &&
      (!f.partyName || i.partyName.toLowerCase().includes(f.partyName.toLowerCase())) &&
      (!f.companyName || i.companyName.toLowerCase().includes(f.companyName.toLowerCase())) &&
      (!f.status || i.status === f.status) &&
      (!f.dateFrom || i.createdDate >= f.dateFrom) &&
      (!f.dateTo || i.createdDate <= f.dateTo)
    );
  }), [stageRecords, appliedFilters]);

  const handleCompleteProcess = (row) => {
    dispatch(completeStage({ id: row.id, currentStage: 'lifting' }));
    toast.success(`Lifting completed for Indent ${row.indentNumber} and moved to Receive Material.`);
  };

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="complete" size="small" variant="contained" color="success" onClick={() => handleCompleteProcess(row)} sx={{ minWidth: '130px', fontSize: '0.7rem' }}>
          Get Lifting
        </Button>
      ];
    } else {
      return [
        <ViewBtn key="view" onClick={() => {}} />,
        <PrintBtn key="print" onClick={() => printTable([row], WORKFLOW_COLUMNS.map((c) => ({ key: c.key, header: c.label })), `Lifting for ${row.indentNumber}`)} />
      ];
    }
  }, [tabValue, dispatch]);

  return (
    <Box>
      <PageHeader
        title="Get Lifting"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Get Lifting' }]}
      />

      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} pendingCount={pendingCount} historyCount={historyCount} />
      
      <WorkflowFilters 
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        onReset={() => setAppliedFilters(defaultFilters)}
      />

      <WorkflowTable 
        rows={filtered} 
        title={tabValue === 0 ? "Pending Lifting" : "Lifting History"} 
        actions={actions} 
      />
    </Box>
  );
}

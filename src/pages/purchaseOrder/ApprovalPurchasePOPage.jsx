import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, TextField, MenuItem, Chip, Link
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { toast } from 'react-toastify';
import { useData } from '../../contexts/DataContext';
import { formatTimestamp } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import PageHeader from '../../components/common/PageHeader';
import GeneratePOForm from '../../components/po/GeneratePOForm';
import { groupByPO, PO_COLUMNS } from '../../utils/poGroupUtils';

const getHistoryCols = (onViewPO) => [
  ...PO_COLUMNS,
  {
    key: 'approvalRemarks',
    label: 'Remarks',
    minWidth: 200,
    render: (v) => (
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: v ? 'normal' : 'italic' }}>
        {v || '—'}
      </Typography>
    ),
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
]; export default function ApprovalPurchasePOPage() {
  const { refresh, updateRow, startSync, endSync } = useData();
  const records = useSelector((s) => s.workflow.records);

  const [tabValue, setTabValue] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [poViewOpen, setPoViewOpen] = useState(false);
  const [poViewRecord, setPoViewRecord] = useState(null);

  const stageRecords = useMemo(() => {
    const recs = tabValue === 0
      ? records.filter(r => r.workflowStage.approvalPO === 'Pending')
      : records.filter(r => r.workflowStage.approvalPO === 'Completed');
    return groupByPO(recs);
  }, [records, tabValue]);

  const filtered = useMemo(() =>
    stageRecords.filter((i) => {
      const f = appliedFilters;
      return (
        (!f.indentNumber || (i.indentNumber || '').toLowerCase().includes(f.indentNumber.toLowerCase())) &&
        (!f.partyName || i.partyName.toLowerCase().includes(f.partyName.toLowerCase())) &&
        (!f.companyName || i.companyName.toLowerCase().includes(f.companyName.toLowerCase())) &&
        (!f.status || i.status === f.status) &&
        (!f.dateFrom || i.createdDate >= f.dateFrom) &&
        (!f.dateTo || i.createdDate <= f.dateTo)
      );
    }), [stageRecords, appliedFilters]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { status: '', remarks: '' }
  });

  const handleOpenConfirm = (row) => {
    setSelectedRow(row);
    reset({ status: '', remarks: '' });
    setConfirmOpen(true);
  };

  const onSubmit = async (data) => {
    if (!selectedRow) return;
    const ids = selectedRow._groupIds || [selectedRow.id];
    const actionDate = formatTimestamp();
    const poNumber = selectedRow.poNumber;
    const status = data.status;

    // Instantly close dialog
    setConfirmOpen(false);
    setSelectedRow(null);

    startSync();

    // Run update sequence in background
    (async () => {
      try {
        for (const id of ids) {
          await updateRow('indents', id, {
            "Actual4": actionDate,
            "Approval Status": status,
            "Remarks": data.remarks
          }, false);
        }

        if (status === 'Approved') {
          toast.success(`PO ${poNumber} Approved!`);
        } else {
          toast.error(`PO ${poNumber} Rejected.`);
        }
        await refresh(['indents'], false);
      } catch (err) {
        console.error("Failed to approve PO in background:", err);
        toast.error(`Failed to submit approval for PO ${poNumber}: ${err.message}`);
      } finally {
        endSync();
      }
    })();
  };

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

  const pendingCols = useMemo(() => {
    const cols = getHistoryCols(handleViewPO);
    cols.splice(2, 0, indentCol, serialCol);
    return cols;
  }, [handleViewPO, indentCol, serialCol]);

  const historyCols = useMemo(() => {
    const cols = getHistoryCols(handleViewPO);
    cols.splice(2, 0, indentCol, serialCol);
    return cols;
  }, [handleViewPO, indentCol, serialCol]);

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="approve" size="small" variant="contained" color="success"
          startIcon={<ThumbUpIcon />} onClick={() => handleOpenConfirm(row)}
          sx={{ minWidth: '110px', fontSize: '0.7rem' }}>
          Approve PO
        </Button>
      ];
    }
    return [];
  }, [tabValue]);

  return (
    <Box>
      <PageHeader
        title="Approval Purchase PO"
        subtitle={`${filtered.length} PO(s) found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Approval Purchase PO' }]}
      />
      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />
      <WorkflowFilters appliedFilters={appliedFilters} onApply={setAppliedFilters} onReset={() => setAppliedFilters(defaultFilters)} />

      <DataTable
        columns={tabValue === 1 ? historyCols : pendingCols}
        rows={filtered}
        title={tabValue === 0 ? 'Pending Approvals' : 'Approval History'}
        searchKey={['poNumber', 'partyName', 'companyName']}
        actions={actions}
        density="compact"
        hideActionsColumn={tabValue === 1}
      />

      {/* Approval Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, maxWidth: '600px' } }}>
        <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>Approve Purchase Order</Typography>
            {selectedRow && (
              <Typography variant="caption" color="text.secondary">
                {selectedRow.poNumber} · {selectedRow.partyName} · {selectedRow._itemCount || 1} item(s)
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <form id="approval-form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ px: 3, py: 2.5 }}>
            <Controller name="status" control={control} rules={{ required: 'Status is required' }}
              render={({ field }) => (
                <TextField {...field} select fullWidth size="small" label="Decision *"
                  error={!!errors.status} helperText={errors.status?.message} sx={{ mb: 2 }}>
                  <MenuItem value="Approved">Approve</MenuItem>
                  <MenuItem value="Rejected">Reject</MenuItem>
                </TextField>
              )} />
            <Controller name="remarks" control={control} rules={{ required: 'Remarks are required' }}
              render={({ field }) => (
                <TextField {...field} multiline rows={3} fullWidth size="small" label="Remarks *"
                  error={!!errors.remarks} helperText={errors.remarks?.message} />
              )} />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
            <Button onClick={() => setConfirmOpen(false)} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
            <Button type="submit" form="approval-form" variant="contained" color="primary" sx={{ minWidth: 150, height: 38 }}>Save Decision</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* PO View Dialog */}
      {poViewOpen && (
        <GeneratePOForm open={poViewOpen} onClose={() => { setPoViewOpen(false); setPoViewRecord(null); }} viewRecord={poViewRecord} />
      )}
    </Box>
  );
}

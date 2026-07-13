import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch }        from 'react-redux';
import { useForm, Controller }             from 'react-hook-form';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, TextField, Link, Chip
} from '@mui/material';
import SendIcon      from '@mui/icons-material/Send';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ViewBtn }   from '../../components/common/ActionButtons';
import { toast }     from 'react-toastify';
import { useData } from '../../contexts/DataContext';
import { formatTimestamp } from '../../utils/formatters';
import DataTable              from '../../components/common/DataTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs           from '../../components/common/WorkflowTabs';
import PageHeader             from '../../components/common/PageHeader';
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

export default function SendPOToPartyPage() {
  const { refresh, updateRow } = useData();
  const records  = useSelector((s) => s.workflow.records);

  const [tabValue,       setTabValue]       = useState(0);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [formOpen,       setFormOpen]       = useState(false);
  const [selectedRow,    setSelectedRow]    = useState(null);
  const [poViewOpen,     setPoViewOpen]     = useState(false);
  const [poViewRecord,   setPoViewRecord]   = useState(null);

  const stageRecords = useMemo(() => {
    const recs = tabValue === 0
      ? records.filter(r => r.workflowStage.sendPO === 'Pending')
      : records.filter(r => r.workflowStage.sendPO === 'Completed');
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { message: '', sentDate: new Date().toISOString().slice(0, 10) }
  });

  const handleOpenForm = (row) => {
    setSelectedRow(row);
    reset({ message: '', sentDate: new Date().toISOString().slice(0, 10) });
    setFormOpen(true);
  };

  const onSubmit = async (data) => {
    if (!selectedRow) return;
    const ids = selectedRow._groupIds || [selectedRow.id];
    const poNumber = selectedRow.poNumber;
    const partyName = selectedRow.partyName;
    const sentDate = data.sentDate;
    const message = data.message;

    // Instantly close dialog
    setFormOpen(false);
    setSelectedRow(null);

    toast.info(`Sending PO ${poNumber} to ${partyName}...`);

    // Run update sequence in background
    (async () => {
      try {
        for (const id of ids) {
          await updateRow('indents', id, {
            "Actual4.1": formatTimestamp(sentDate),
            "PO Sent Status": "Sent",
            "col-37": message
          }, false);
        }

        toast.success(`PO ${poNumber} sent to ${partyName}!`);
        await refresh(['indents'], false);
      } catch (err) {
        console.error("Failed to send PO in background:", err);
        toast.error(`Failed to send PO ${poNumber}: ${err.message}`);
      }
    })();
  };

  const handleViewPO = (row) => { setPoViewRecord(row); setPoViewOpen(true); };

  const historyCols = useMemo(() => getHistoryCols(handleViewPO), []);

  const actions = useCallback((row) => {
    if (tabValue === 0) {
      return [
        <Button key="send" size="small" variant="contained" color="primary"
          startIcon={<SendIcon />} onClick={() => handleOpenForm(row)}
          sx={{ minWidth: '120px', fontSize: '0.7rem' }}>
          Send to Party
        </Button>
      ];
    }
    return [<ViewBtn key="view" onClick={() => handleViewPO(row)} />];
  }, [tabValue]);

  return (
    <Box>
      <PageHeader
        title="Send PO To Party"
        subtitle={`${filtered.length} PO(s) found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Send PO To Party' }]}
      />
      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />
      <WorkflowFilters appliedFilters={appliedFilters} onApply={setAppliedFilters} onReset={() => setAppliedFilters(defaultFilters)} />

      <DataTable
        columns={tabValue === 1 ? historyCols : PO_COLUMNS}
        rows={filtered}
        title={tabValue === 0 ? 'Pending Send' : 'Sent History'}
        searchKey={['poNumber', 'partyName', 'companyName']}
        actions={actions}
        density="compact"
      />

      {/* Send Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth={false}
        PaperProps={{ sx: { borderRadius: 3, width: '600px', maxWidth: '96vw' } }}>
        <DialogTitle sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SendIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>Send PO to Party</Typography>
            {selectedRow && (
              <Typography variant="caption" color="text.secondary">
                {selectedRow.poNumber} · {selectedRow.partyName} · {selectedRow._itemCount || 1} item(s)
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <form id="sendpo-form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              {...register('sentDate', { required: 'Date is required' })}
              type="date" label="Sent Date *" fullWidth size="small"
              error={!!errors.sentDate} helperText={errors.sentDate?.message}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              {...register('message')}
              label="Message (Optional)" multiline rows={3}
              fullWidth size="small"
              placeholder="Enter message to be sent along with the PO..."
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
            <Button onClick={() => setFormOpen(false)} variant="outlined" color="inherit" sx={{ minWidth: 110, height: 38 }}>Cancel</Button>
            <Button type="submit" form="sendpo-form" variant="contained" color="primary" startIcon={<SendIcon />} sx={{ minWidth: 150, height: 38 }}>Send to Party</Button>
          </DialogActions>
        </form>
      </Dialog>

      {poViewOpen && (
        <GeneratePOForm open={poViewOpen} onClose={() => { setPoViewOpen(false); setPoViewRecord(null); }} viewRecord={poViewRecord} />
      )}
    </Box>
  );
}

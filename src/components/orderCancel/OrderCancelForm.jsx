import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Checkbox, InputAdornment, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import { useData } from '../../contexts/DataContext';
import { gasApi } from '../../services/gasApi';
import { formatTimestamp } from '../../utils/formatters';
import { toast } from 'react-toastify';

// Helper to determine if a record is in the pending section of cancellable stages
export const isRecordCancellable = (r) => {
  if (!r) return false;
  const stage = r.workflowStage || {};

  // Stage 1: Generate Purchase PO pending -> NOT ALLOWED to cancel
  if (stage.purchaseOrder === 'Pending') return false;

  // Allowed Stage 2: Approval Purchase PO pending
  if (stage.approvalPO === 'Pending') return true;

  // Allowed Stage 3: Send PO To Party pending
  if (stage.sendPO === 'Pending') return true;

  // Allowed Stage 4: Follow-Up pending
  if (stage.followUp === 'Pending') return true;

  // Allowed Stage 5: Arrange Logistics pending
  if (stage.logistics === 'Pending') return true;

  // Additional check for Arrange Logistics: PO generated & followUp completed with remaining pending lifting
  if (
    stage.purchaseOrder === 'Completed' &&
    stage.followUp === 'Completed' &&
    r.pendingLifting && Number(r.pendingLifting) > 0
  ) {
    return true;
  }

  return false;
};

// Helper to derive human-readable cancel stage label
export const getCancelStageLabel = (r) => {
  if (!r) return '';
  const stage = r.workflowStage || {};
  if (stage.approvalPO === 'Pending') return 'Approval PO';
  if (stage.sendPO === 'Pending') return 'Send PO';
  if (stage.followUp === 'Pending') return 'Follow-Up';
  if (stage.logistics === 'Pending' || (r.pendingLifting && Number(r.pendingLifting) > 0)) return 'Logistics';
  return 'Pending Process';
};

export default function OrderCancelForm({ open, onClose }) {
  const allRecords = useSelector((state) => state.workflow.records) || [];
  const { refresh, startSync, endSync } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [cancelQtyMap, setCancelQtyMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = () => {
    setSubmittedQuery(searchTerm.trim());
    setHasSearched(true);
  };

  // Filter cancellable records matching search term after search is clicked
  const filteredRecords = useMemo(() => {
    if (!hasSearched) return [];
    const cancellable = allRecords.filter(isRecordCancellable);
    if (!submittedQuery) return cancellable;
    const term = submittedQuery.toLowerCase();
    return cancellable.filter(r =>
      (r.indentNumber && String(r.indentNumber).toLowerCase().includes(term)) ||
      (r.poNumber && String(r.poNumber).toLowerCase().includes(term))
    );
  }, [allRecords, hasSearched, submittedQuery]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSubmittedQuery('');
      setHasSearched(false);
      setSelectedIds([]);
      setCancelQtyMap({});
      setIsSubmitting(false);
    }
  }, [open]);

  // Compute pending qty for a record
  const getPendingQty = (r) => {
    if (r.pendingLifting !== undefined && r.pendingLifting !== null && r.pendingLifting > 0) {
      return Number(r.pendingLifting);
    }
    const totalQty = Number(r.poQty || r.quantity || 0);
    const lifted = Number(r.totalLifted || 0);
    const received = Number(r.receivedQuantity || 0);
    return Math.max(0, totalQty - lifted - received);
  };

  const handleToggleSelect = (rec) => {
    const id = rec.id;
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
      setCancelQtyMap(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      const maxPending = getPendingQty(rec);
      setSelectedIds(prev => [...prev, id]);
      setCancelQtyMap(prev => ({
        ...prev,
        [id]: maxPending
      }));
    }
  };

  const handleCancelQtyChange = (rec, val) => {
    const id = rec.id;
    if (val === '') {
      setCancelQtyMap(prev => ({ ...prev, [id]: '' }));
      return;
    }
    const numVal = parseFloat(val);
    const maxPending = getPendingQty(rec);
    if (isNaN(numVal)) {
      setCancelQtyMap(prev => ({ ...prev, [id]: 0 }));
    } else {
      const clamped = Math.max(1, Math.min(maxPending, numVal));
      setCancelQtyMap(prev => ({ ...prev, [id]: clamped }));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one indent to cancel.");
      return;
    }

    const selectedRecords = allRecords.filter(r => selectedIds.includes(r.id));
    const invalidItem = selectedRecords.find(r => {
      const q = cancelQtyMap[r.id];
      return !q || Number(q) <= 0;
    });

    if (invalidItem) {
      toast.error(`Please enter a valid cancel quantity for ${invalidItem.indentNumber}`);
      return;
    }

    setIsSubmitting(true);
    if (startSync) startSync();

    try {
      const timestamp = formatTimestamp();
      // Sheet Cancel-Order columns: A=Timestamp, B=Indent-number, C=Serial-No, D=Cancel-Stage, E=Qty
      const rowsToInsert = selectedRecords.map(r => [
        timestamp,
        r.indentNumber || '',
        r.serialNo || 1,
        getCancelStageLabel(r),
        Number(cancelQtyMap[r.id] || 0)
      ]);

      const res = await gasApi.cancelOrders(JSON.stringify(rowsToInsert));
      if (res && res.success !== false) {
        toast.success(`Successfully cancelled ${rowsToInsert.length} indent item(s).`);
        if (refresh) await refresh();
        onClose();
      } else {
        throw new Error(res?.error || "Failed to cancel orders");
      }
    } catch (err) {
      console.error("Error submitting order cancellation:", err);
      toast.error(err.message || "Failed to cancel orders.");
    } finally {
      setIsSubmitting(false);
      if (endSync) endSync();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CancelIcon color="error" />
          <Typography variant="h6" fontWeight={700}>
            Order Cancel Form
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, pb: 2.5, px: 3 }}>
        {/* Search Bar */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
            Search Indent Number
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', maxWidth: 420 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type indent number (e.g. RI-001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{ whiteSpace: 'nowrap', px: 2.5, height: 40, fontWeight: 700, borderRadius: 1.5 }}
            >
              Search
            </Button>
          </Box>
        </Box>

        {/* Matching Indents Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, maxHeight: 350 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1, bgcolor: 'background.paper', width: 45 }}>
                  Select
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Stage</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Indent No.</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Serial No.</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Item Code</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Total Qty</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Lifted Qty</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Received Qty</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Pending Qty</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper' }}>Canceled Qty</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: 'background.paper', minWidth: 110 }}>Cancel Qty *</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: '0.82rem' }}>
                    {!hasSearched
                      ? "Enter an indent number and click Search to view matching indents."
                      : submittedQuery
                        ? `No cancellable indents found matching "${submittedQuery}".`
                        : "No pending indents available for cancellation."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => {
                  const isChecked = selectedIds.includes(r.id);
                  const stageLabel = getCancelStageLabel(r);
                  const totalQty = Number(r.poQty || r.quantity || 0);
                  const liftedQty = Number(r.totalLifted || 0);
                  const receivedQty = Number(r.receivedQuantity || 0);
                  const pendingQty = getPendingQty(r);
                  const totalCanceledQty = Number(r.totalCanceledQty ?? r.cancelQty ?? 0);
                  const cancelVal = cancelQtyMap[r.id] !== undefined ? cancelQtyMap[r.id] : pendingQty;

                  return (
                    <TableRow key={r.id} hover selected={isChecked} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell align="center" sx={{ py: 0.75, px: 1 }}>
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(r)}
                          color="error"
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5 }}>
                        <Chip
                          label={stageLabel}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5, fontSize: '0.8rem', fontWeight: 600 }}>
                        <Chip label={r.indentNumber} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5, fontSize: '0.78rem' }}>{r.serialNo || 1}</TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5, fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'normal', wordBreak: 'break-word', minWidth: 150 }}>{r.itemName || '—'}</TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5, fontSize: '0.78rem', color: 'text.secondary' }}>{r.itemCode || '—'}</TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5, fontSize: '0.78rem' }}>{totalQty} {r.unit || ''}</TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5, fontSize: '0.78rem' }}>{liftedQty} {r.unit || ''}</TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5, fontSize: '0.78rem' }}>{receivedQty} {r.unit || ''}</TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5, fontSize: '0.8rem', fontWeight: 700, color: 'warning.main' }}>
                        {pendingQty} {r.unit || ''}
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1.5, fontSize: '0.78rem' }}>
                        {totalCanceledQty} {r.unit || ''}
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          disabled={!isChecked}
                          value={cancelVal}
                          onChange={(e) => handleCancelQtyChange(r, e.target.value)}
                          inputProps={{
                            min: 1,
                            max: pendingQty,
                            style: { padding: '5px 6px', fontSize: '0.82rem', fontWeight: 600, width: 75 }
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={selectedIds.length === 0 || isSubmitting}
          startIcon={<CancelIcon />}
        >
          {isSubmitting ? "Cancelling..." : `Cancel Selected (${selectedIds.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

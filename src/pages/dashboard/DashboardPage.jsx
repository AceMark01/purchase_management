import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, CardHeader, Typography, Box, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Divider, Tab, Tabs, useTheme, Skeleton,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useData } from '../../contexts/DataContext';
import DescriptionIcon from '@mui/icons-material/Description';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CallIcon from '@mui/icons-material/Call';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency, formatDate } from '../../utils/formatters';

/* Generic mini table inside cards */
function MiniTable({ columns, rows, emptyLabel = 'No records' }) {
  return (
    <TableContainer sx={{ maxHeight: 350, width: '100%' }}>
      <Table size="small" stickyHeader sx={{ width: '100%', tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell
                key={c.key}
                sx={{
                  py: '10px !important',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: 'background.paper',
                  borderBottom: 2,
                  borderColor: 'divider',
                  whiteSpace: 'nowrap'
                }}
              >
                {c.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: '0.8rem' }}>
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow key={i} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    sx={{
                      py: '10px',
                      fontSize: '0.78rem',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      borderBottom: 1,
                      borderColor: 'action.hover'
                    }}
                  >
                    {c.render ? c.render(row[c.key], row) : row[c.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { loading, pendingPoRecords = [], poHistoryRecords = [] } = useData();

  const records = useSelector((s) => s.workflow.records) || [];
  const [poTab, setPoTab] = useState(0); // 0 = Pending, 1 = Completed

  // Date helper to compare date portion only
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const formatted = formatDate(dateStr, false); // Returns YYYY-MM-DD
    const today = formatDate(new Date(), false);
    return formatted === today;
  };

  // Operational metrics
  const totalIndentsCount = useMemo(() => {
    const uniqueIds = new Set(records.map(r => r.indentNumber).filter(Boolean));
    return uniqueIds.size;
  }, [records]);

  const approvalPendingCount = useMemo(() => {
    const uniqueIds = new Set(
      records
        .filter(r => r.workflowStage.approvalPO === 'Pending')
        .map(r => r.indentNumber)
        .filter(Boolean)
    );
    return uniqueIds.size;
  }, [records]);

  // PO List (grouped or itemized - matching columns: Party, Item, Total PO Qty, Item Qty, PO Amount)
  const poRecordsList = useMemo(() => {
    return records.filter(r => r.poNumber);
  }, [records]);

  const filteredPOs = useMemo(() => {
    if (poTab === 0) {
      return pendingPoRecords;
    } else {
      return poHistoryRecords.length > 0 ? poHistoryRecords : poRecordsList;
    }
  }, [pendingPoRecords, poHistoryRecords, poRecordsList, poTab]);

  // Today's activities
  const receivingToday = useMemo(() => {
    return records.filter(r => {
      const pDate = r.planned1 || r.expectedArrivalDate;
      return (
        pDate && 
        String(pDate).trim() !== "" && 
        isToday(pDate) && 
        (!r.actual1 || String(r.actual1).trim() === "")
      );
    });
  }, [records]);

  const liftingToday = useMemo(() => {
    return records.filter(r => 
      r.planned3 && 
      String(r.planned3).trim() !== "" && 
      isToday(r.planned3) && 
      (!r.actual3 || String(r.actual3).trim() === "")
    );
  }, [records]);

  const followUpToday = useMemo(() => {
    return records.filter(r => {
      const hasNextFollowUp = r.nextFollowUpDate && String(r.nextFollowUpDate).trim() !== "";
      if (hasNextFollowUp) {
        return isToday(r.nextFollowUpDate);
      }

      // Fallback: next follow-up is not filled, check planned2 is today and actual2 is empty
      const hasPlanned = r.planned2 && String(r.planned2).trim() !== "";
      const hasActual = r.actual2 && String(r.actual2).trim() !== "";
      return (
        hasPlanned &&
        isToday(r.planned2) &&
        !hasActual
      );
    });
  }, [records]);

  if (loading) {
    return (
      <Box>
        <PageHeader
          title="Dashboard"
          subtitle="Loading overview details..."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
        />
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {Array.from(new Array(2)).map((_, idx) => (
            <Grid item xs={12} sm={6} key={idx}>
              <Card sx={{ height: 110, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', p: 2.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="40%" height={32} />
                  </Box>
                  <Skeleton variant="circular" width={48} height={48} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Card sx={{ p: 3, mb: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Skeleton variant="text" width="20%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time purchase and operations overview."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
      />

      {/* ── 1. Stat Cards Row ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Total Indents Created"
            value={totalIndentsCount}
            icon={DescriptionIcon}
            color="primary"
            onClick={() => navigate('/indent')}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Total Indent Approval Pending"
            value={approvalPendingCount}
            icon={PendingIcon}
            color="warning"
            onClick={() => navigate('/approval-po')}
          />
        </Grid>
      </Grid>

      {/* ── 2. POs Table ── */}
      <Card sx={{ mb: 3.5, borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,.02)' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, sm: 'alignItems: center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon color="primary" /> Purchase Orders
              </Typography>
              <Tabs
                value={poTab}
                onChange={(_, val) => setPoTab(val)}
                indicatorColor="primary"
                textColor="primary"
                variant="standard"
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': {
                    minHeight: 36,
                    py: 0.5,
                    px: 2,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2
                  }
                }}
              >
                <Tab label="Pending POs" id="po-tab-0" />
                <Tab label="Completed POs" id="po-tab-1" />
              </Tabs>
            </Box>
          }
          sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, px: 2.5 }}
        />
        <CardContent sx={{ p: 0 }}>
          <MiniTable
            columns={[
              { key: 'indentNumber', label: 'Indent No.' },
              { key: 'partyName', label: 'Party (Vendor)' },
              { key: 'itemName', label: 'Item' },
              {
                key: 'poQty',
                label: 'Total PO QTY',
                render: (v, r) => `${v || r.quantity || 0} ${r.unit || 'Nos'}`
              },
              {
                key: 'quantity',
                label: 'Item QTY (Indent)',
                render: (v, r) => `${v || 0} ${r.unit || 'Nos'}`
              },
              {
                key: 'poAmount',
                label: 'PO Amount',
                render: (_, r) => {
                  const qty = r.poQty || r.quantity || 0;
                  const rate = r.poRate || r.rate || 0;
                  const afterDiscount = qty * rate * (1 - (r.discount || 0) / 100);
                  const calculatedAmount = afterDiscount * (1 + (r.gst || 0) / 100);
                  const finalAmount = r.amount || calculatedAmount;
                  return (
                    <Typography variant="caption" fontWeight={700} color="text.primary">
                      {formatCurrency(finalAmount)}
                    </Typography>
                  );
                }
              },
              {
                key: 'poNumber',
                label: 'PO Number',
                render: (v) => (
                  <Chip
                    label={v || 'Pending'}
                    size="small"
                    variant={v ? "outlined" : "filled"}
                    color={v ? "primary" : "warning"}
                    sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                  />
                )
              }
            ]}
            rows={filteredPOs}
            emptyLabel={poTab === 0 ? "No pending Purchase Orders" : "No completed Purchase Orders"}
          />
        </CardContent>
      </Card>

      {/* ── 3. Today's Activities Side-by-Side ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, mb: 3.5, width: '100%' }}>
        {/* Receiving Today */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ height: '100%', borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,.02)' }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" /> Today's Receiving
                </Typography>
              }
              subheader={
                <Typography variant="caption" color="text.secondary">
                  Items scheduled to arrive today
                </Typography>
              }
              sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, px: 2.5 }}
            />
            <CardContent sx={{ p: 0 }}>
              <MiniTable
                columns={[
                  { key: 'indentNumber', label: 'Indent No.' },
                  { key: 'partyName', label: 'Party' },
                  { key: 'itemName', label: 'Item' },
                  {
                    key: 'quantity',
                    label: 'Qty',
                    render: (v, r) => `${v || 0} ${r.unit || ''}`
                  },
                  {
                    key: 'workflowStage',
                    label: 'Status',
                    render: (v) => {
                      const status = v?.receiveMaterial === 'Completed' ? 'Received' : 'Pending';
                      return (
                        <Chip
                          label={status}
                          size="small"
                          color={status === 'Received' ? 'success' : 'warning'}
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                      );
                    }
                  }
                ]}
                rows={receivingToday}
                emptyLabel="No items scheduled for receiving today"
              />
            </CardContent>
          </Card>
        </Box>

        {/* Lifting Today */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ height: '100%', borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,.02)' }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShippingIcon color="info" /> Today's Lifting
                </Typography>
              }
              subheader={
                <Typography variant="caption" color="text.secondary">
                  Items scheduled for lifting today
                </Typography>
              }
              sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, px: 2.5 }}
            />
            <CardContent sx={{ p: 0 }}>
              <MiniTable
                columns={[
                  { key: 'indentNumber', label: 'Indent No.' },
                  { key: 'partyName', label: 'Party' },
                  { key: 'itemName', label: 'Item' },
                  {
                    key: 'quantity',
                    label: 'Qty',
                    render: (v, r) => `${v || 0} ${r.unit || ''}`
                  },
                  {
                    key: 'workflowStage',
                    label: 'Status',
                    render: (v) => {
                      const status = v?.liftReceiver === 'Completed' ? 'Lifted' : 'Pending';
                      return (
                        <Chip
                          label={status}
                          size="small"
                          color={status === 'Lifted' ? 'success' : 'warning'}
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                      );
                    }
                  }
                ]}
                rows={liftingToday}
                emptyLabel="No items scheduled for lifting today"
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* ── 4. Follow-Ups Today ── */}
      <Card sx={{ borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,.02)' }}>
        <CardHeader
          title={
            <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CallIcon color="warning" /> Today's Follow-Ups
            </Typography>
          }
          subheader={
            <Typography variant="caption" color="text.secondary">
              Follow-ups scheduled for today
            </Typography>
          }
          sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, px: 2.5 }}
        />
        <CardContent sx={{ p: 0 }}>
          <MiniTable
            columns={[
              { key: 'indentNumber', label: 'Indent No.' },
              { key: 'partyName', label: 'Party (Vendor)' },
              { key: 'itemName', label: 'Item' },
              {
                key: 'nextFollowUpDate',
                label: 'Follow Date',
                render: (v) => formatDate(v, false)
              },
              {
                key: 'followUpRemarks',
                label: 'Remarks',
                render: (v) => v || '—'
              }
            ]}
            rows={followUpToday}
            emptyLabel="No follow-ups scheduled for today"
          />
        </CardContent>
      </Card>
    </Box>
  );
}

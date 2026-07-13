import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, CardHeader, Typography, Box, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Divider, Stack, alpha, useTheme, Skeleton,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useData } from '../../contexts/DataContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import DescriptionIcon  from '@mui/icons-material/Description';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon    from '@mui/icons-material/Inventory';
import PeopleIcon       from '@mui/icons-material/People';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import PendingIcon      from '@mui/icons-material/Pending';
import CancelIcon       from '@mui/icons-material/Cancel';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import StatCard         from '../../components/common/StatCard';
import PageHeader       from '../../components/common/PageHeader';
import { formatCurrency, formatDate, statusColor } from '../../utils/formatters';

const CHART_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* custom tooltip for recharts */
function ChartTooltip({ active, payload, label, currency }) {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5, boxShadow: 4, minWidth: 140 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>{label}</Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
            <Typography variant="caption" color="text.secondary">{p.name}</Typography>
          </Box>
          <Typography variant="caption" fontWeight={700} color="text.primary">
            {currency ? `₹${Number(p.value).toLocaleString('en-IN')}K` : p.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/* mini table inside card */
function MiniTable({ columns, rows, emptyLabel = 'No records' }) {
  return (
    <TableContainer sx={{ maxHeight: 260 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.key} sx={{ py: '8px !important', fontSize: '0.7rem', fontWeight: 700 }}>{c.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 3, color: 'text.disabled', fontSize: '0.8rem' }}>
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow key={i} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                {columns.map((c) => (
                  <TableCell key={c.key} sx={{ py: '8px', fontSize: '0.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
  const isDark = theme.palette.mode === 'dark';
  const { loading } = useData();

  const records = useSelector((s) => s.workflow.records);
  const vendors = useSelector((s) => s.vendorMaster.items) || [];

  const stats = useMemo(() => ({
    totalIndents:     records.length,
    pendingIndents:   records.filter((i) => i.status === 'Pending').length,
    approvedIndents:  records.filter((i) => i.status === 'Approved').length,
    rejectedIndents:  records.filter((i) => i.status === 'Rejected').length,
    totalPOs:         records.filter((r) => r.workflowStage.purchaseOrder === 'Completed').length,
    pendingFollowUps: records.filter((r) => r.workflowStage.followUp === 'Pending').length,
    receivedMaterials:records.filter((r) => r.workflowStage.receiveMaterial === 'Completed').length,
    totalVendors:     vendors.length,
  }), [records, vendors]);

  const monthlyTrend = useMemo(() =>
    MONTHS.map((month, idx) => {
      const thisMonthRecords = records.filter((i) => new Date(i.createdDate).getMonth() === idx);
      return {
        month,
        POs:     thisMonthRecords.filter((p) => p.workflowStage.purchaseOrder === 'Completed').length,
        Indents: thisMonthRecords.length,
        Amount:  Math.round(
          thisMonthRecords.filter((p) => p.workflowStage.purchaseOrder === 'Completed')
             .reduce((s, p) => s + (p.amount || 0), 0) / 1000
        ),
      };
    }), [records]);

  const statusDist = useMemo(() => {
    const map = {};
    records.forEach((i) => { map[i.status] = (map[i.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [records]);

  const companyDist = useMemo(() => {
    const map = {};
    records.filter(r => r.workflowStage.purchaseOrder === 'Completed').forEach((p) => { map[p.companyName] = (map[p.companyName] || 0) + 1; });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,6)
      .map(([name, value]) => ({ name: name.split(' ')[0], value }));
  }, [records]);

  const STAT_CARDS = [
    { title: 'Total Indents',     value: stats.totalIndents,     icon: DescriptionIcon,  color: 'primary',   path: '/indent' },
    { title: 'Pending Indents',   value: stats.pendingIndents,   icon: PendingIcon,      color: 'warning',   path: '/indent' },
    { title: 'Approved Indents',  value: stats.approvedIndents,  icon: CheckCircleIcon,  color: 'success',   path: '/indent' },
    { title: 'Rejected Indents',  value: stats.rejectedIndents,  icon: CancelIcon,       color: 'error',     path: '/indent' },
    { title: 'Total POs',         value: stats.totalPOs,         icon: ShoppingCartIcon, color: 'secondary', path: '/purchase-order' },
    { title: 'Pending Follow-Ups',value: stats.pendingFollowUps, icon: PendingIcon,      color: 'warning',   path: '/follow-up' },
    { title: 'Received Materials',value: stats.receivedMaterials,icon: InventoryIcon,    color: 'success',   path: '/receive-material' },
    { title: 'Total Vendors',     value: stats.totalVendors,     icon: PeopleIcon,       color: 'info',      path: null },
  ];

  const gridColor = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)';

  const pos = records.filter(r => r.workflowStage.purchaseOrder === 'Completed');
  const receives = records.filter(r => r.workflowStage.receiveMaterial === 'Completed');

  if (loading) {
    return (
      <Box>
        <PageHeader
          title="Dashboard"
          subtitle="Loading overview details..."
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
        />
        {/* Skeleton Stat Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {Array.from(new Array(8)).map((_, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{ height: 110, borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,.03)' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', p: 2 }}>
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
        
        {/* Skeleton Charts */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, mb: 2.5 }}>
          <Card sx={{ flex: 1, p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
            <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
          </Card>
          <Card sx={{ flex: 2, p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
            <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's your purchase overview."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
      />

      {/* ── Stat Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {STAT_CARDS.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.title} sx={{ display: 'flex' }}>
            <Box sx={{ width: '100%' }}>
              <StatCard
                {...s}
                onClick={s.path ? () => navigate(s.path) : undefined}
                trend={Math.floor(Math.random() * 20) - 4}
                trendLabel="vs last month"
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* ── Charts Row 1 ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, mb: 2.5, width: '100%' }}>
        
        {/* Status pie */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight={700}>Indent Status</Typography>}
              subheader={<Typography variant="caption" color="text.secondary">Distribution by status</Typography>}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 2 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%" cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0];
                    return (
                      <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5, boxShadow: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.payload.fill || p.color }} />
                          <Typography variant="caption" fontWeight={700}>{p.name}: {p.value}</Typography>
                        </Box>
                      </Box>
                    );
                  }} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(val) => <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* POs by Company */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight={700}>POs by Company</Typography>}
              subheader={<Typography variant="caption" color="text.secondary">Top companies by order count</Typography>}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 2 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={companyDist} margin={{ top: 0, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="POs" radius={[5, 5, 0, 0]} maxBarSize={40}>
                    {companyDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Monthly Amount */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight={700}>Monthly Amount (₹K)</Typography>}
              subheader={<Typography variant="caption" color="text.secondary">Purchase value per month</Typography>}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 2 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyTrend} margin={{ top: 0, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip currency />} />
                  <Bar dataKey="Amount" name="Amount (₹K)" fill="#059669" radius={[5, 5, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

      </Box>

      {/* ── Recent tables ── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader
              title={<Typography variant="h6" fontWeight={700}>Recent Indents</Typography>}
              sx={{ pb: 0 }}
            />
            <Divider sx={{ mt: 1.5 }} />
            <CardContent sx={{ p: '0 !important' }}>
              <MiniTable
                columns={[
                  { key: 'indentNumber', label: 'Indent No.', render: (v) => <Typography variant="caption" fontWeight={700} color="primary.main">{v}</Typography> },
                  { key: 'itemName', label: 'Item' },
                  { key: 'status', label: 'Status', render: (v) => <Chip label={v} size="small" color={statusColor(v)} /> },
                  { key: 'createdDate', label: 'Date', render: (v) => formatDate(v) },
                ]}
                rows={records.slice(0, 7)}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title={<Typography variant="h6" fontWeight={700}>Recent Purchase Orders</Typography>}
              sx={{ pb: 0 }}
            />
            <Divider sx={{ mt: 1.5 }} />
            <CardContent sx={{ p: '0 !important' }}>
              <MiniTable
                columns={[
                  { key: 'indentNumber', label: 'Indent No.', render: (v) => <Typography variant="caption" fontWeight={700} color="primary.main">{v}</Typography> },
                  { key: 'partyName', label: 'Vendor', render: (v) => v?.split(' ').slice(0,2).join(' ') },
                  { key: 'status', label: 'Status', render: (v) => <Chip label={v} size="small" color={statusColor(v)} /> },
                ]}
                rows={pos.slice(0, 7)}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardHeader
              title={<Typography variant="h6" fontWeight={700}>Recent Receipts</Typography>}
              sx={{ pb: 0 }}
            />
            <Divider sx={{ mt: 1.5 }} />
            <CardContent sx={{ p: '0 !important' }}>
              <MiniTable
                columns={[
                  { key: 'indentNumber', label: 'Indent No.', render: (v) => <Typography variant="caption" fontWeight={700} color="primary.main">{v}</Typography> },
                  { key: 'status', label: 'Status', render: (v) => <Chip label={v} size="small" color={statusColor(v)} /> },
                ]}
                rows={receives.slice(0, 7)}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}


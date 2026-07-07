import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Grid, Card, CardContent, CardHeader, Divider, Typography, TextField, MenuItem, Button, Stack, Chip } from '@mui/material';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { formatCurrency, formatDate, statusColor } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportUtils';

const COLORS = ['#1976d2', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

export default function ReportsPage() {
  const indents = useSelector((s) => s.indents.items);
  const pos = useSelector((s) => s.purchaseOrders.items);
  const receives = useSelector((s) => s.receiveMaterials.items);
  const tally = useSelector((s) => s.tally.items);
  const [reportType, setReportType] = useState('monthly');
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const monthlyData = useMemo(() => {
    const map = {};
    pos.filter((p) => p.poDate >= dateFrom && p.poDate <= dateTo).forEach((p) => {
      const month = p.poDate?.slice(0, 7) || '';
      if (!map[month]) map[month] = { month, POs: 0, Amount: 0 };
      map[month].POs += 1;
      map[month].Amount += parseFloat(p.amount || 0);
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map((d) => ({ ...d, Amount: Math.round(d.Amount) }));
  }, [pos, dateFrom, dateTo]);

  const vendorData = useMemo(() => {
    const map = {};
    pos.forEach((p) => { map[p.vendorName] = (map[p.vendorName] || 0) + (p.amount || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, amount]) => ({ name: name.split(' ')[0], amount: Math.round(amount) }));
  }, [pos]);

  const statusData = useMemo(() => {
    const map = {};
    indents.forEach((i) => { map[i.status] = (map[i.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [indents]);

  const qualityData = useMemo(() => {
    const map = {};
    receives.forEach((r) => { map[r.qualityStatus] = (map[r.qualityStatus] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [receives]);

  const totalAmount = tally.reduce((s, t) => s + (t.totalAmount || 0), 0);
  const totalPOAmount = pos.reduce((s, p) => s + (p.amount || 0), 0);

  const REPORT_COLS = [
    { key: 'poNumber', label: 'PO Number' }, { key: 'vendorName', label: 'Vendor' },
    { key: 'companyName', label: 'Company' }, { key: 'itemName', label: 'Item' },
    { key: 'quantity', label: 'Qty' }, { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' }, { key: 'poDate', label: 'Date' },
  ];

  const filteredPOs = pos.filter((p) => (!dateFrom || p.poDate >= dateFrom) && (!dateTo || p.poDate <= dateTo));

  return (
    <Box>
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive purchase analytics and reporting"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
            <TextField select size="small" label="Report Type" value={reportType} onChange={(e) => setReportType(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="monthly">Monthly Summary</MenuItem>
              <MenuItem value="vendor">Vendor Analysis</MenuItem>
              <MenuItem value="status">Status Report</MenuItem>
              <MenuItem value="quality">Quality Report</MenuItem>
            </TextField>
            <TextField size="small" label="From Date" type="date" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <TextField size="small" label="To Date" type="date" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <Button variant="contained" onClick={() => exportToExcel(filteredPOs, REPORT_COLS, 'PO_Report')}>Export Excel</Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total PO Value', value: formatCurrency(totalPOAmount), color: 'primary' },
          { label: 'Total Billed', value: formatCurrency(totalAmount), color: 'success' },
          { label: 'Total Indents', value: indents.length, color: 'secondary' },
          { label: 'Total Receipts', value: receives.length, color: 'warning' },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" fontWeight={700} color={`${s.color}.main`}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader title="Monthly Purchase Orders" />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [n === 'Amount' ? formatCurrency(v) : v, n]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="POs" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="Amount" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader title="Indent Status" />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title="Top Vendors by Amount" />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={vendorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Amount']} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {vendorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title="Material Quality Distribution" />
            <Divider />
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={qualityData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} fontSize={11}>
                    {qualityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardHeader title="Purchase Order Report" subheader={`${filteredPOs.length} records in selected period`} />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          <DataTable columns={REPORT_COLS} rows={filteredPOs} title="PO Report" searchKey={['poNumber', 'vendorName']} density="compact" />
        </CardContent>
      </Card>
    </Box>
  );
}

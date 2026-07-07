export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

export const formatNumber = (val) =>
  new Intl.NumberFormat('en-IN').format(val || 0);

export const formatDate = (d, withTime = false) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (withTime) {
      return date.toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).replace(',', '');
    }
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return String(d); }
};

export const generateNumber = (prefix, items, key) => {
  const max = items.reduce((m, i) => {
    const n = parseInt((i[key] || '').replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 2024000);
  return `${prefix}-${String(max + 1).padStart(7, '0')}`;
};

// Generates RI-style indent numbers grouped by party
export const generateIndentNumber = (records, partyName) => {
  // If the party already has an RI XX indent, return it
  if (partyName) {
    const existing = records.find(r => r.partyName === partyName && String(r.indentNumber).startsWith('RI'));
    if (existing) return existing.indentNumber;
  }
  // Otherwise find the highest RI XX globally and return the next one
  const max = records.reduce((m, r) => {
    const match = (r.indentNumber || '').match(/RI\s*(\d+)/i);
    if (!match) return m;
    return Math.max(m, parseInt(match[1], 10));
  }, 0);
  const next = max + 1;
  return `RI ${String(next).padStart(2, '0')}`;
};

export const statusColor = (status) => {
  const map = {
    'Pending': 'warning', 'Approved': 'success', 'Rejected': 'error',
    'In Progress': 'info', 'Completed': 'success', 'Draft': 'default',
    'Sent': 'info', 'Confirmed': 'success', 'Cancelled': 'error',
    'Dispatched': 'info', 'In Transit': 'warning', 'Delivered': 'success',
    'Delayed': 'error', 'Scheduled': 'default', 'Stored': 'success',
    'In Use': 'info', 'Transferred': 'secondary', 'Disposed': 'error',
    'Posted': 'success', 'Accepted': 'success', 'Partially Accepted': 'warning',
    'active': 'success', 'inactive': 'error',
  };
  return map[status] || 'default';
};

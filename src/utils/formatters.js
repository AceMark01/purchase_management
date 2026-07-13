export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

export const formatNumber = (val) =>
  new Intl.NumberFormat('en-IN').format(val || 0);

export const formatDate = (d, withTime = true) => {
  if (!d) return '';
  const str = String(d).trim();
  
  // If already matches YYYY-MM-DD HH:mm:ss, return directly
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  // If matches YYYY-MM-DD without time, append time if requested
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return withTime ? `${str} 00:00:00` : str;
  }
  
  try {
    let date;
    // Parse DD-MM-YYYY format safely if encountered
    if (/^\d{2}-\d{2}-\d{4}/.test(str)) {
      const datePart = str.split(' ')[0];
      const timePart = str.split(' ')[1] || '00:00:00';
      const [dd, mm, yyyy] = datePart.split('-');
      date = new Date(`${yyyy}-${mm}-${dd}T${timePart}`);
    } else {
      date = new Date(d);
    }
    
    if (isNaN(date.getTime())) return str;
    
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    
    if (withTime) {
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    }
    return `${yyyy}-${mm}-${dd}`;
  } catch { return str; }
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

export const generateLiftNumber = (receivingRows) => {
  const max = (receivingRows || []).reduce((m, row) => {
    const match = (row["Lift No."] || row["Lift No"] || "").match(/LN\s*-?\s*(\d+)/i);
    if (!match) return m;
    return Math.max(m, parseInt(match[1], 10));
  }, 0);
  return `LN-${max + 1}`;
};

export const generateLogisticsLiftNumber = (logisticsRows) => {
  const max = (logisticsRows || []).reduce((m, row) => {
    const match = (row["LN-Lift Number"] || row["LN-Lift Number "] || "").match(/LN\s*-?\s*(\d+)/i);
    if (!match) return m;
    return Math.max(m, parseInt(match[1], 10));
  }, 0);
  return `LN-${max + 1}`;
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

export const formatTimestamp = (d = new Date()) => {
  const date = new Date(d);
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

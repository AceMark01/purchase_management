// Groups workflow records by poNumber so every downstream stage shows ONE row per PO.
// Records without a poNumber stay as individual entries.
export const groupByPO = (records) => {
  const groups = {};
  records.forEach((r) => {
    const key = r.poNumber || `_solo_${r.id}`;
    if (!groups[key]) {
      groups[key] = {
        ...r,
        _groupIds: [r.id],
        _itemCount: 1,
        _totalAmount: parseFloat(r.amount) || 0,
      };
    } else {
      groups[key]._groupIds.push(r.id);
      groups[key]._itemCount += 1;
      groups[key]._totalAmount += parseFloat(r.amount) || 0;
    }
  });
  return Object.values(groups);
};

// Columns used in all workflow stages AFTER the PO has been generated
export const PO_COLUMNS = [
  { key: 'poNumber',     label: 'PO Number',     minWidth: 190, render: (v) => v || '—' },
  { key: 'poDate',       label: 'PO Date',        minWidth: 110, render: (v) => v || '—' },
  { key: 'partyName',    label: 'Supplier',        minWidth: 180 },
  { key: 'companyName',  label: 'Company',         minWidth: 160 },
  {
    key: '_itemCount',
    label: 'Items',
    minWidth: 90,
    render: (_v, r) => `${r._itemCount || 1} item(s)`,
  },
  {
    key: '_totalAmount',
    label: 'Total Amount',
    minWidth: 140,
    render: (_v, r) =>
      `₹ ${(r._totalAmount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
  },
  { key: 'status',       label: 'Status',    type: 'status', minWidth: 120 },
  { key: 'createdDate',  label: 'Date',               minWidth: 120 },
];

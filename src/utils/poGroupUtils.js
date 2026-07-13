import { formatDate } from './formatters';

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
        _indentNumbers: r.indentNumber ? [r.indentNumber] : [],
        _serialNos: (r.serialNo !== undefined && r.serialNo !== null && r.serialNo !== '') ? [r.serialNo] : [],
      };
    } else {
      groups[key]._groupIds.push(r.id);
      groups[key]._itemCount += 1;
      groups[key]._totalAmount += parseFloat(r.amount) || 0;
      if (r.indentNumber && !groups[key]._indentNumbers.includes(r.indentNumber)) {
        groups[key]._indentNumbers.push(r.indentNumber);
      }
      if (r.serialNo !== undefined && r.serialNo !== null && r.serialNo !== '' && !groups[key]._serialNos.includes(r.serialNo)) {
        groups[key]._serialNos.push(r.serialNo);
      }
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
  { key: 'createdDate',  label: 'Date',               minWidth: 120, render: (v) => formatDate(v) },
];

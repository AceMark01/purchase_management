import React from 'react';
import DataTable from './DataTable';
import { formatDate } from '../../utils/formatters';

export const WORKFLOW_COLUMNS = [
  { key: 'indentNumber', label: 'Indent Number', minWidth: 150 },
  { key: 'serialNo', label: 'Serial No.', minWidth: 100 },
  { key: 'orderBy', label: 'Order By', minWidth: 150 },
  { key: 'partyName', label: 'Party Name', minWidth: 180 },
  { key: 'groupName', label: 'Group Name', minWidth: 150 },
  { key: 'itemName', label: 'Item Name', minWidth: 180 },
  { key: 'itemCode', label: 'Item Code', minWidth: 120 },
  { key: 'description', label: 'Description', minWidth: 200 },
  { key: 'quantity', label: 'Quantity', minWidth: 100 },
  { key: 'unit', label: 'Unit', minWidth: 80 },
  { key: 'rate', label: 'Rate', type: 'currency', minWidth: 100 },
  { key: 'gst', label: 'GST %', minWidth: 80, render: (v) => `${v}%` },
  { key: 'discount', label: 'Discount', minWidth: 100, render: (v) => `${v}%` },
  { key: 'amount', label: 'Amount', type: 'currency', minWidth: 120 },
  { key: 'image', label: 'Image', minWidth: 100, render: (v) => v ? 'Yes' : 'No' },
  { key: 'leadDays', label: 'Approx. Lead Days', minWidth: 150 },
  { key: 'companyName', label: 'Company Name', minWidth: 180 },
  { key: 'status', label: 'Status', type: 'status', minWidth: 130 },
  { key: 'createdDate', label: 'Created Date', minWidth: 130, render: (v) => formatDate(v) },
];

export default function WorkflowTable({ rows, loading, title, actions }) {
  return (
    <DataTable
      columns={WORKFLOW_COLUMNS}
      rows={rows}
      loading={loading}
      title={title}
      searchKey={['indentNumber', 'partyName', 'itemName', 'companyName']}
      actions={actions}
      density="compact"
    />
  );
}

import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useData } from '../../contexts/DataContext';
import { Box, Button, Chip, Link } from '@mui/material';
import { ViewBtn, PrintBtn } from '../../components/common/ActionButtons';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GeneratePOForm from '../../components/po/GeneratePOForm';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import { WORKFLOW_COLUMNS } from '../../components/common/WorkflowTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import PageHeader from '../../components/common/PageHeader';
import { printTable } from '../../utils/exportUtils';

// Generates a fake PO number
const generatePONumber = (indentNumber) => {
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `PO-${new Date().getFullYear()}-${num}`;
};

// History columns includes PO Document link
const getHistoryColumns = (onViewPDF) => [
  {
    key: 'poCopy',
    label: 'PO Copy',
    minWidth: 150,
    render: (v, row) =>
      row.poCopy ? (
        <Link
          href={row.poCopy}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.78rem', color: 'primary.main', fontWeight: 600 }}
        >
          <PictureAsPdfIcon sx={{ fontSize: 16, color: 'error.main' }} />
          View PDF
        </Link>
      ) : (
        <Chip label="N/A" size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
      ),
  },
  {
    key: 'poLink',
    label: 'PO Document',
    minWidth: 130,
    render: (v, row) =>
      row.poNumber ? (
        <Link
          component="button"
          onClick={() => onViewPDF(row)}
          underline="hover"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.78rem', color: 'primary.main', fontWeight: 600 }}
        >
          View Form
        </Link>
      ) : (
        <Chip label="N/A" size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
      ),
  },
  ...WORKFLOW_COLUMNS,
];

export default function PurchaseOrderPage() {
  const { poHistoryRecords: records = [] } = useData();
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: History
  const [generatePOOpen, setGeneratePOOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      return records.filter((r) => !r.actual);
    } else {
      return records.filter((r) => !!r.actual);
    }
  }, [records, tabValue]);

  const filtered = useMemo(
    () =>
      stageRecords.filter((i) => {
        const f = appliedFilters;
        return (
          (!f.indentNumber || i.indentNumber.toLowerCase().includes(f.indentNumber.toLowerCase())) &&
          (!f.itemName || i.itemName.toLowerCase().includes(f.itemName.toLowerCase())) &&
          (!f.partyName || i.partyName.toLowerCase().includes(f.partyName.toLowerCase())) &&
          (!f.companyName || i.companyName.toLowerCase().includes(f.companyName.toLowerCase())) &&
          (!f.status || i.status === f.status) &&
          (!f.dateFrom || i.createdDate >= f.dateFrom) &&
          (!f.dateTo || i.createdDate <= f.dateTo)
        );
      }),
    [stageRecords, appliedFilters]
  );

  const handleOpenGenerate = () => {
    if (selectedRowIds.length === 0) {
      toast.error('Please select at least one indent to generate PO.');
      return;
    }

    const selectedRecs = records.filter(r => selectedRowIds.includes(r.id));
    const uniqueParties = Array.from(new Set(selectedRecs.map(r => r.partyName)));
    if (uniqueParties.length > 1) {
      toast.error('Please select indents belonging to the same Party/Supplier.');
      return;
    }

    setSelectedRow(null);
    setViewRecord(null);
    setGeneratePOOpen(true);
  };

  const handleViewPDF = (row) => {
    setViewRecord(row);
    setGeneratePOOpen(true);
  };

  const actions = useCallback(
    (row) => {
      if (tabValue === 0) {
        return []; // No row-level actions for pending, button is at top right
      } else {
        return [
          <ViewBtn key="view" onClick={() => {}} />,
          <PrintBtn key="print" onClick={() => printTable([row], WORKFLOW_COLUMNS.map((c) => ({ key: c.key, header: c.label })), `PO for ${row.indentNumber}`)} />,
        ];
      }
    },
    [tabValue]
  );

  const historyCols = useMemo(() => getHistoryColumns(handleViewPDF), []);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Generate Purchase PO"
        subtitle={`${filtered.length} records found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Purchase Order' }]}
        actions={
          tabValue === 0 ? (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DescriptionIcon />}
              onClick={handleOpenGenerate}
            >
              Generate PO
            </Button>
          ) : null
        }
      />

      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />

      <WorkflowFilters appliedFilters={appliedFilters} onApply={setAppliedFilters} onReset={() => setAppliedFilters(defaultFilters)} />

      <DataTable
        columns={tabValue === 1 ? historyCols : WORKFLOW_COLUMNS}
        rows={filtered}
        title={tabValue === 0 ? 'Pending PO Generation' : 'PO Generation History'}
        searchKey={['indentNumber', 'partyName', 'itemName', 'companyName']}
        actions={actions}
        density="compact"
        showCheckbox={tabValue === 0}
        selectedRowIds={selectedRowIds}
        onSelectedRowIdsChange={setSelectedRowIds}
        hideIndexColumn={tabValue === 0}
        hideActionsColumn={tabValue === 0}
      />

      {generatePOOpen && (
        <GeneratePOForm 
          open={generatePOOpen} 
          selectedRowIds={selectedRowIds}
          onClose={() => {
            setGeneratePOOpen(false);
            setSelectedRow(null);
            setSelectedRowIds([]);
            setViewRecord(null);
          }}
          viewRecord={viewRecord}
        />
      )}
    </Box>
  );
}

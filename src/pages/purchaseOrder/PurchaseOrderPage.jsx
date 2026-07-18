import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useData } from '../../contexts/DataContext';
import { Box, Button, Chip, Link } from '@mui/material';
import { ViewBtn } from '../../components/common/ActionButtons';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GeneratePOForm from '../../components/po/GeneratePOForm';
import { toast } from 'react-toastify';
import DataTable from '../../components/common/DataTable';
import { WORKFLOW_COLUMNS } from '../../components/common/WorkflowTable';
import WorkflowFilters, { defaultFilters } from '../../components/common/WorkflowFilters';
import WorkflowTabs from '../../components/common/WorkflowTabs';
import PageHeader from '../../components/common/PageHeader';

// Generates a fake PO number
const generatePONumber = (indentNumber) => {
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `PO-${new Date().getFullYear()}-${num}`;
};

// Convert Google Drive download link to view link to force opening in a new tab
const getGoogleDriveViewUrl = (url) => {
  if (!url) return '';
  if (url.includes('drive.google.com/uc') || url.includes('docs.google.com/uc')) {
    try {
      const parsedUrl = new URL(url);
      const id = parsedUrl.searchParams.get('id');
      if (id) {
        return `https://drive.google.com/file/d/${id}/view`;
      }
    } catch (e) {
      const match = url.match(/[?&]id=([^&]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/view`;
      }
    }
  }
  if (url.includes('drive.google.com/file/d/')) {
    return url.replace(/\/view\?usp=drivesdk/, '/view').replace(/\/view.*/, '/view').replace(/\/edit.*/, '/view');
  }
  return url;
};

// History columns includes PO Copy link
const getHistoryColumns = () => [
  {
    key: 'poCopy',
    label: 'PO Copy',
    minWidth: 150,
    render: (v, row) =>
      row.poCopy ? (
        <Link
          href={getGoogleDriveViewUrl(row.poCopy)}
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
  ...WORKFLOW_COLUMNS.filter(col => col.key !== 'orderBy' && col.key !== 'leadDays' && col.key !== 'image' && col.key !== 'status'),
];

export default function PurchaseOrderPage() {
  const { pendingPoRecords = [], poHistoryRecords = [] } = useData();
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: History
  const [generatePOOpen, setGeneratePOOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [poFormMode, setPoFormMode] = useState('generate'); // 'generate' | 'view' | 'revise'

  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const stageRecords = useMemo(() => {
    if (tabValue === 0) {
      return pendingPoRecords;
    } else {
      return poHistoryRecords;
    }
  }, [pendingPoRecords, poHistoryRecords, tabValue]);

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

    const selectedRecs = pendingPoRecords.filter(r => selectedRowIds.includes(r.id));
    const uniqueParties = Array.from(new Set(selectedRecs.map(r => r.partyName)));
    if (uniqueParties.length > 1) {
      toast.error('Please select indents belonging to the same Party/Vendor.');
      return;
    }

    setSelectedRow(null);
    setViewRecord(null);
    setPoFormMode('generate');
    setGeneratePOOpen(true);
  };

  const handleOpenRevise = () => {
    setSelectedRow(null);
    setViewRecord(null);
    setSelectedRowIds([]);
    setPoFormMode('revise');
    setGeneratePOOpen(true);
  };

  const handleViewPDF = useCallback((row) => {
    setViewRecord(row);
    setPoFormMode('view');
    setGeneratePOOpen(true);
  }, []);

  const actions = useCallback(
    (row) => {
      if (tabValue === 0) {
        return []; // No row-level actions for pending, button is at top right
      } else {
        return [
          <ViewBtn key="view" onClick={() => handleViewPDF(row)} />,
        ];
      }
    },
    [tabValue, handleViewPDF]
  );

  const historyCols = useMemo(() => getHistoryColumns(), []);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Generate Purchase PO"
        subtitle={`${filtered.length} records found`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Purchase Order' }]}
        actions={
          <Box display="flex" gap={1}>
            {tabValue === 0 && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<DescriptionIcon />}
                onClick={handleOpenGenerate}
              >
                Generate PO
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<DescriptionIcon />}
              onClick={handleOpenRevise}
            >
              Revise PO
            </Button>
          </Box>
        }
      />

      <WorkflowTabs tabValue={tabValue} onChange={setTabValue} />

      <WorkflowFilters appliedFilters={appliedFilters} onApply={setAppliedFilters} onReset={() => setAppliedFilters(defaultFilters)} />

      <DataTable
        columns={tabValue === 1 ? historyCols : WORKFLOW_COLUMNS.filter(c => c.key !== 'status')}
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
          mode={poFormMode}
        />
      )}
    </Box>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Backdrop, CircularProgress, Box, Typography, Card, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { gasApi } from '../services/gasApi';
import { useAuth } from './AuthContext';
import { mapProductRow, mapWhatsAppRow, mapWorkflowRecords, mapCompanyRow, mapVendorRow, mapUserRow, mapSettingsRow } from '../services/dataMapper';
import { setRecords } from '../store/slices/workflowSlice';
import { setVendors } from '../store/slices/vendorSlice';
import { setCompanies } from '../store/slices/companySlice';
import { setUsers } from '../store/slices/userSlice';
import { formatTimestamp } from '../utils/formatters';

const DataContext = createContext(null);

// Static mapping for vendor metadata based on original mock data
const VENDOR_METADATA_MAP = {
  'Vidadri Paper Raipur': { id: 1, gstNumber: '22AAAAA0000A1Z5', email: 'info@vidadri.com', phoneNumber: '9876543210', contactPerson: 'Vidadri Manager', vendorLocation: 'Raipur, Chhattisgarh' },
  'Raj Suppliers':        { id: 2, gstNumber: 'GST27RAJSU1234F1Z5', email: 'raj@suppliers.com', phoneNumber: '9876543210', contactPerson: 'Rajesh Kumar', vendorLocation: 'Mumbai, Maharashtra' },
  'Sharma Traders':       { id: 3, gstNumber: '22SHART0001B1Z9', email: '', phoneNumber: '', contactPerson: 'Vikram Sharma', vendorLocation: 'Delhi, NCR' },
  'Patel Enterprises':    { id: 4, gstNumber: 'GST29PATEL9012Q3Z7', email: 'patel@enterprises.com', phoneNumber: '9876543212', contactPerson: 'Suresh Patel', vendorLocation: 'Ahmedabad, Gujarat' },
  'CleanPaper Co.':       { id: 5, gstNumber: '22CLEAN0000C1Z3', email: 'clean@paper.com', phoneNumber: '9876543210', contactPerson: 'Manager', vendorLocation: 'Raipur, Chhattisgarh' },
  'NK':                   { id: 6, gstNumber: '22NKMAN0000N1Z1', email: 'nk@tape.com', phoneNumber: '9876543211', contactPerson: 'NK Manager', vendorLocation: 'Raipur, Chhattisgarh' },
  'Acemark Publications': { id: 7, gstNumber: '22ACEPU0000A1Z5', email: 'acemark@pub.com', phoneNumber: '9000000000', contactPerson: 'Manager', vendorLocation: 'Raipur, Chhattisgarh' },
  'Singh Steel Works':    { id: 9, gstNumber: 'GST03SINGH4567L1X3', email: 'singh@steelworks.com', phoneNumber: '9876543213', contactPerson: 'Gurpreet Singh', vendorLocation: 'Ludhiana, Punjab' },
};

// Static companies metadata
const STATIC_COMPANIES = [
  {
    id: 1,
    companyName: 'Acemark Stationers',
    gstNumber: '22ABLFA7973J1Z2',
    panNumber: 'ABLFA7973J',
    email: 'info@acemark.com',
    phoneNumber: '9876543210',
    responsibleDepartment: 'Procurement',
    responsiblePerson: 'Rajesh Kumar',
    companyAddress: 'Infront Of Csidc Office, Mahadev Ghat Road Changurabhata, Raipur - 492013, Chhattisgarh, India',
    billingAddress: 'Infront Of Csidc Office, Mahadev Ghat Road Changurabhata, Raipur - 492013, Chhattisgarh, India',
    destination: 'Infront Of Csidc Office, Mahadev Ghat Road Changurabhata, Raipur - 492013, Chhattisgarh, India',
    status: 'Active',
  },
  {
    id: 2,
    companyName: 'Alpha Industries Ltd',
    gstNumber: 'GST09FGHIJ5678K2Y6',
    panNumber: 'FGHIJ5678K',
    email: 'contact@betamfg.com',
    phoneNumber: '9876543211',
    responsibleDepartment: 'Operations',
    responsiblePerson: 'Vikram Sharma',
    companyAddress: '45, MIDC Estate, Pune - 411018',
    billingAddress: '45, MIDC Estate, Pune - 411018',
    destination: 'Pune',
    status: 'Active',
  },
  {
    id: 3,
    companyName: 'Gamma Enterprises',
    gstNumber: 'GST29LMNOP9012Q3Z7',
    panNumber: 'LMNOP9012Q',
    email: 'hello@gammaent.com',
    phoneNumber: '9876543212',
    responsibleDepartment: 'Finance',
    responsiblePerson: 'Suresh Patel',
    companyAddress: 'Sector 5, Electronic City, Bangalore - 560100',
    billingAddress: 'Sector 5, Electronic City, Bangalore - 560100',
    destination: 'Bangalore',
    status: 'Inactive',
  },
];

const SHEET_MAP = {
  "indents": "INDENT-PO",
  "indentForm": "indent Data",
  "approvals": "Audit/Approval",
  "followUps": "Flw-up",
  "logistics": "LIFT-RECEIVED",
  "receiving": "RECEIVED-ACCOUNTS",
  "products": "Master Data",
  "companies": "Master Data",
  "vendors": "Master Data",
  "masterData": "Master Data",
  "users": "LOGIN",
  "whatsapp": "Whatsapp Form",
  "poSentStatus": "PO Sent Status",
  "poGenerate": "Po Generate",
  "poHistory": "PO-History"
};

const getHeaderRow = (grid) => {
  if (!grid || grid.length === 0) return [];
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const row = grid[i];
    if (Array.isArray(row) && row.some(cell => {
      const s = String(cell || "").trim().toLowerCase();
      return s === "timestamp" || s === "indent number" || s === "request id" || s === "lift no." || s === "product type" || s === "lift no" || s === "po number" || s === "party name" || s === "ln-lift number" || s === "transporter name" || s === "bill no." || s === "lift status";
    })) {
      return row.map(h => String(h || "").trim());
    }
  }
  return grid[0] || [];
};

const raw2DArrayToObjects = (grid, sheetName = "") => {
  if (!grid || grid.length === 0) return [];
  
  // Find header row dynamically within the first 10 rows
  let headerRowIndex = 0;
  
  if (sheetName === "INDENT-PO") {
    headerRowIndex = 5; // Hardcode header to row 6 (index 5) for INDENT-PO
  } else {
    for (let i = 0; i < Math.min(grid.length, 10); i++) {
      const row = grid[i];
      if (Array.isArray(row) && row.some(cell => {
        const s = String(cell || "").trim().toLowerCase();
        return s === "timestamp" || s === "indent number" || s === "request id" || s === "lift no." || s === "product type" || s === "lift no" || s === "ln-lift number" || s === "transporter name" || s === "bill no." || s === "lift status";
      })) {
        headerRowIndex = i;
        break;
      }
    }
  }

  const headers = (grid[headerRowIndex] || []).map(h => String(h || "").trim());
  const objects = [];
  for (let i = headerRowIndex + 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row || row.every(cell => cell === "" || cell === null || cell === undefined)) {
      continue;
    }
    // _row is the physical 1-based row index in spreadsheet (i + 1)
    const obj = { _row: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header) {
        obj[header] = row[j];
      }
    }
    objects.push(obj);
  }
  return objects;
};

export function DataProvider({ children }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(() => {
    try {
      return !!localStorage.getItem('pms_user');
    } catch {
      return true;
    }
  });
  const [writeLoading, setWriteLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Local states for loaded resources
  const [recordsState, setRecordsState] = useState([]);
  const [productsState, setProductsState] = useState([]);
  const [vendorsState, setVendorsState] = useState([]);
  const [companiesState, setCompaniesState] = useState([]);
  const [whatsappEntries, setWhatsappEntries] = useState([]);
  const [usersState, setUsersState] = useState([]);
  const [settingsState, setSettingsState] = useState([]);
  const [rawReceiving, setRawReceiving] = useState([]);
  const [rawLogistics, setRawLogistics] = useState([]);
  const [rawReceiving2D, setRawReceiving2D] = useState([]);
  const [rawLogistics2D, setRawLogistics2D] = useState([]);
  const [rawIndents, setRawIndents] = useState([]);
  const [rawApprovals, setRawApprovals] = useState([]);
  const [rawFollowUps, setRawFollowUps] = useState([]);
  const [rawMasterData, setRawMasterData] = useState([]);
  const [rawUsers, setRawUsers] = useState([]);
  const [rawWhatsapp, setRawWhatsapp] = useState([]);
  const [rawPoSentStatus, setRawPoSentStatus] = useState([]);
  const [rawPoGenerate, setRawPoGenerate] = useState([]);
  const [rawPoHistory, setRawPoHistory] = useState([]);
  const [headersState, setHeadersState] = useState({});
  const [poHistoryRecords, setPoHistoryRecords] = useState([]);
  const [orderByListState, setOrderByListState] = useState([]);

  const loadData = async (showGlobalLoading = true, sheetsToFetch = null) => {
    if (showGlobalLoading) setLoading(true);
    setError(null);
    try {
      let fetchedData = {};
      if (sheetsToFetch && sheetsToFetch.length > 0) {
        const activeSheets = [
          { key: "indents", name: "INDENT-PO" },
          { key: "whatsapp", name: "Whatsapp Form" },
          { key: "followUps", name: "Flw-up" },
          { key: "poGenerate", name: "Po Generate" },
          { key: "poHistory", name: "PO-History" },
          { key: "logistics", name: "LIFT-RECEIVED" },
          { key: "receiving", name: "RECEIVED-ACCOUNTS" },
          { key: "masterData", name: "Master Data" },
          { key: "users", name: "LOGIN" }
        ];

        const targets = activeSheets.filter(s => sheetsToFetch.includes(s.key));
        const promises = targets.map(async (s) => {
          const res = await gasApi.fetchSheet(s.name);
          return { key: s.key, data: res.data || [] };
        });
        const results = await Promise.all(promises);
        for (const r of results) {
          fetchedData[r.key] = r.data;
        }
      } else {
        const result = await gasApi.bootstrap();
        fetchedData = result.data || {};
      }

      const indentsRaw = fetchedData.indents !== undefined ? fetchedData.indents : rawIndents;
      const approvalsRaw = fetchedData.approvals !== undefined ? fetchedData.approvals : rawApprovals;
      const followUpsRaw = fetchedData.followUps !== undefined ? fetchedData.followUps : rawFollowUps;
      const logisticsRaw = fetchedData.logistics !== undefined ? fetchedData.logistics : rawLogistics2D;
      const receivingRaw = fetchedData.receiving !== undefined ? fetchedData.receiving : rawReceiving2D;
      const masterDataRaw = fetchedData.masterData !== undefined ? fetchedData.masterData : rawMasterData;
      const usersRaw = fetchedData.users !== undefined ? fetchedData.users : rawUsers;
      const whatsappRaw = fetchedData.whatsapp !== undefined ? fetchedData.whatsapp : rawWhatsapp;
      const poSentStatusRaw = fetchedData.poSentStatus !== undefined ? fetchedData.poSentStatus : rawPoSentStatus;
      const poGenerateRaw = fetchedData.poGenerate !== undefined ? fetchedData.poGenerate : rawPoGenerate;
      const poHistoryRaw = fetchedData.poHistory !== undefined ? fetchedData.poHistory : rawPoHistory;

      console.log("[DEBUG DataContext] Raw rows fetched:", {
        indents: indentsRaw.length,
        approvals: approvalsRaw.length,
        followUps: followUpsRaw.length,
        logistics: logisticsRaw.length,
        receiving: receivingRaw.length,
        masterData: masterDataRaw.length,
        users: usersRaw.length,
        poHistory: poHistoryRaw.length,
      });

      // Update cached state variables
      if (fetchedData.indents !== undefined || !sheetsToFetch) setRawIndents(indentsRaw);
      if (fetchedData.approvals !== undefined || !sheetsToFetch) setRawApprovals(approvalsRaw);
      if (fetchedData.followUps !== undefined || !sheetsToFetch) setRawFollowUps(followUpsRaw);
      if (fetchedData.logistics !== undefined || !sheetsToFetch) setRawLogistics2D(logisticsRaw);
      if (fetchedData.receiving !== undefined || !sheetsToFetch) setRawReceiving2D(receivingRaw);
      if (fetchedData.masterData !== undefined || !sheetsToFetch) setRawMasterData(masterDataRaw);
      if (fetchedData.users !== undefined || !sheetsToFetch) setRawUsers(usersRaw);
      if (fetchedData.whatsapp !== undefined || !sheetsToFetch) setRawWhatsapp(whatsappRaw);
      if (fetchedData.poSentStatus !== undefined || !sheetsToFetch) setRawPoSentStatus(poSentStatusRaw);
      if (fetchedData.poGenerate !== undefined || !sheetsToFetch) setRawPoGenerate(poGenerateRaw);
      if (fetchedData.poHistory !== undefined || !sheetsToFetch) setRawPoHistory(poHistoryRaw);

      const headersMap = {
        indents: getHeaderRow(indentsRaw),
        approvals: getHeaderRow(approvalsRaw),
        followUps: getHeaderRow(followUpsRaw),
        logistics: getHeaderRow(logisticsRaw),
        receiving: getHeaderRow(receivingRaw),
        users: getHeaderRow(usersRaw),
        whatsapp: getHeaderRow(whatsappRaw),
        poSentStatus: getHeaderRow(poSentStatusRaw),
        poGenerate: getHeaderRow(poGenerateRaw),
        poHistory: getHeaderRow(poHistoryRaw)
      };

      const sliceRowToObj = (row, headers, startColIdx) => {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          if (header) {
            obj[header] = row[startColIdx + j];
          }
        }
        return obj;
      };

      // Products: columns A-I (0-8)
      const productHeaders = (masterDataRaw[1] || []).slice(0, 9).map(h => String(h || "").trim());
      const productsObj = masterDataRaw.slice(2).map((row, idx) => ({
        _row: idx + 3,
        ...sliceRowToObj(row, productHeaders, 0)
      })).filter(r => r["Product Type"] && String(r["Product Type"]).trim() !== "");
      const mappedProducts = productsObj.map((row, idx) => mapProductRow(row, idx));

      // Companies: columns M-Y (12-24)
      const companyHeaders = (masterDataRaw[1] || []).slice(12, 25).map(h => String(h || "").trim());
      const companiesObj = masterDataRaw.slice(2).map((row, idx) => ({
        _row: idx + 3,
        ...sliceRowToObj(row, companyHeaders, 12)
      })).filter(r => r["Company Name"] && String(r["Company Name"]).trim() !== "");
      const mappedCompanies = companiesObj.map((row, idx) => mapCompanyRow(row, idx));

      // Vendors: columns Z-AI (25-34)
      const vendorHeaders = (masterDataRaw[1] || []).slice(25, 35).map(h => String(h || "").trim());
      const vendorsObj = masterDataRaw.slice(2).map((row, idx) => ({
        _row: idx + 3,
        ...sliceRowToObj(row, vendorHeaders, 25)
      })).filter(r => r["Vendor Name"] && String(r["Vendor Name"]).trim() !== "");
      const mappedVendors = vendorsObj.map((row, idx) => mapVendorRow(row, idx));

      // Users: LOGIN sheet, header row = 1
      const userHeaders = (usersRaw[0] || []).map(h => String(h || "").trim());
      const usersObj = usersRaw.slice(1).map((row, idx) => ({
        _row: idx + 2,
        ...sliceRowToObj(row, userHeaders, 0)
      })).filter(r => r["USERNAME"] && String(r["USERNAME"]).trim() !== "");
      
      const mappedUsers = usersObj.map((row, idx) => ({
        id: idx + 1,
        _row: row._row,
        name: row["FULLNAME"] || "",
        email: row["USERNAME"] || "",
        password: row["PASSWORD"] || "",
        role: String(row["ROLE"] || "user").toLowerCase(),
        department: String(row["ROLE"] || "").toLowerCase() === 'admin' ? 'Management' : 'Procurement',
        status: 'active',
        lastLogin: ''
      }));

      // Settings: Loaded dynamically from localStorage/default configs
      let currentPerms = {};
      try {
        const saved = localStorage.getItem('pms_settings_perms');
        if (saved) currentPerms = JSON.parse(saved);
      } catch (e) {}

      const defaultPages = {
        admin: [
          'dashboard', 'indent', 'whatsapp', 'purchaseOrder', 'followUp', 'logistics',
          'lifting', 'receiveMaterial', 'liftReceiver', 'tallyEntry',
          'userManagement', 'settings', 'reports', 'master', 'vendors',
        ],
        user: [
          'dashboard', 'indent', 'whatsapp', 'purchaseOrder', 'followUp', 'logistics',
          'lifting', 'receiveMaterial', 'liftReceiver', 'tallyEntry',
          'master', 'vendors',
        ]
      };

      const mappedSettings = ['admin', 'user'].map((role, idx) => ({
        id: idx + 1,
        _row: idx + 1,
        role: role,
        pages: currentPerms[role]?.pages || defaultPages[role],
        actions: currentPerms[role]?.actions || {
          create: true,
          read: true,
          update: true,
          delete: role === 'admin',
          export: true,
          print: true,
        }
      }));
      setSettingsState(mappedSettings);

      const fullHeaders = (masterDataRaw[1] || []).map(h => String(h || "").trim());
      setHeadersState({
        ...headersMap,
        products: productHeaders,
        companies: companyHeaders,
        vendors: vendorHeaders,
        masterData: fullHeaders,
        users: userHeaders
      });

      const indents = raw2DArrayToObjects(indentsRaw, "INDENT-PO");
      const approvals = raw2DArrayToObjects(approvalsRaw);
      const followUps = raw2DArrayToObjects(followUpsRaw);
      const logistics = raw2DArrayToObjects(logisticsRaw);
      const receiving = raw2DArrayToObjects(receivingRaw);
      const whatsapp = raw2DArrayToObjects(whatsappRaw);
      const poSentStatus = raw2DArrayToObjects(poSentStatusRaw);
      const poHistory = raw2DArrayToObjects(poHistoryRaw);

      console.log("[DEBUG DataContext] Parsed objects:", {
        indents: indents.length,
        approvals: approvals.length,
        masterDataProducts: mappedProducts.length,
        users: mappedUsers.length,
        poHistory: poHistory.length,
      });

      setRawReceiving(receiving);
      setRawLogistics(logistics);

      setProductsState(mappedProducts);
      setVendorsState(mappedVendors);
      dispatch(setVendors(mappedVendors));

      setCompaniesState(mappedCompanies);
      dispatch(setCompanies(mappedCompanies));

      setUsersState(mappedUsers);
      dispatch(setUsers(mappedUsers));

      // Order By (col-K): index 10 in Master Data raw sheet
      const orderByValues = masterDataRaw.slice(2)
        .map(row => String(row[10] || "").trim())
        .filter(val => val !== "");
      const mappedOrderBy = [...new Set(orderByValues)];
      setOrderByListState(mappedOrderBy);

      // Map workflow records (derived)
      const mappedRecords = mapWorkflowRecords(
        indents,
        approvals,
        followUps,
        logistics,
        receiving,
        poSentStatus,
        mappedVendors,
        mappedCompanies,
        poHistory
      );
      setRecordsState(mappedRecords);
      dispatch(setRecords(mappedRecords));

      // Map PO-History records for PO page consumption
      const parseNum = (val) => {
        if (val === undefined || val === null || val === '') return 0;
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      };

      const mappedPoHistory = poHistory.map((row, idx) => ({
        id: row._row || (idx + 1),
        _row: row._row,
        timestamp: row["Timestamp"] || "",
        actual: row["Actual"] || "",
        partyName: row["Party Name"] || "",
        poNumber: row["Po Number"] || "",
        productCode: row["Product Code"] || "",
        product: row["Product"] || "",
        description: row["Description"] || "",
        quantity: parseNum(row["Quntity"]),
        unit: row["Unit"] || "",
        rate: parseNum(row["Rate"]),
        discount: parseNum(row["Discount%"]),
        gst: parseNum(row["Gst %"]),
        amount: parseNum(row["Amount"]),
        totalAmount: parseNum(row["Total Amount"]),
        poCopy: row["PO Copy"] || "",
        indentNumber: row["Indent No."] || "",
        serialNo: parseNum(row["Product No."]),
        companyName: row["Company Name"] || "",
        
        // Compatibility fields with WORKFLOW_COLUMNS in PurchaseOrderPage DataTable
        itemName: row["Product"] || "",
        itemCode: row["Product Code"] || "",
        groupName: row["Description"] || "",
        status: row["Actual"] ? "Completed" : "Pending",
        createdDate: row["Timestamp"] || "",
        orderBy: ""
      }));
      setPoHistoryRecords(mappedPoHistory);

      // Map WhatsApp entries
      const mappedWhatsApp = whatsapp.map((row, idx) => mapWhatsAppRow(row, idx));
      setWhatsappEntries(mappedWhatsApp);

    } catch (err) {
      console.error("Failed to load data from GAS:", err);
      setError(err.message || "Failed to connect to Google Sheets backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const refresh = async (sheetsToFetch = null) => {
    setWriteLoading(true);
    try {
      await loadData(false, sheetsToFetch);
    } finally {
      setWriteLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={50} thickness={4.5} />
        <Typography variant="body1" fontWeight={600} color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: 'background.default',
        }}
      >
        <Card
          sx={{
            maxWidth: 480,
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Database Connection Failed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => loadData(true)}
            sx={{ px: 4, borderRadius: 2 }}
          >
            Retry Connection
          </Button>
        </Card>
      </Box>
    );
  }

  const updateRow = async (resource, rowIndex, columnValues) => {
    const sheetName = SHEET_MAP[resource];
    const headers = headersState[resource] || [];
    let colOffset = 0;
    if (resource === "companies") {
      colOffset = 12;
    } else if (resource === "vendors") {
      colOffset = 25;
    } else if (resource === "products") {
      colOffset = 0;
    }
    
    setWriteLoading(true);
    try {
      for (const [colName, value] of Object.entries(columnValues)) {
        const colIdx = headers.indexOf(colName) + 1;
        if (colIdx > 0) {
          await gasApi.updateCell(sheetName, rowIndex, colIdx + colOffset, value);
        }
      }
    } finally {
      setWriteLoading(false);
    }
  };

  const addRow = async (resource, data) => {
    const sheetName = SHEET_MAP[resource];
    const headers = headersState[resource] || [];
    const rowValues = [];
    // Skip Column A (headers[0]) because backend.js's insert action automatically prepends uniqueId to Column A.
    for (let i = 1; i < headers.length; i++) {
      const header = headers[i];
      if (header === "Timestamp") {
        rowValues.push(formatTimestamp(data.Timestamp || data.timestamp || new Date()));
      } else if (data[header] !== undefined) {
        rowValues.push(data[header]);
      } else {
        rowValues.push("");
      }
    }
    setWriteLoading(true);
    try {
      const res = await gasApi.insertRow(sheetName, rowValues);
      return res;
    } finally {
      setWriteLoading(false);
    }
  };

  const updateSettingsRow = async (rowIndex, roleData, updatedBy) => {
    setWriteLoading(true);
    try {
      let currentPerms = {};
      try {
        const saved = localStorage.getItem('pms_settings_perms');
        if (saved) currentPerms = JSON.parse(saved);
      } catch (e) {}

      currentPerms[roleData.role] = {
        pages: roleData.pages,
        actions: roleData.actions
      };

      localStorage.setItem('pms_settings_perms', JSON.stringify(currentPerms));

      setSettingsState(prev => prev.map(s => {
        if (s.role === roleData.role) {
          return {
            ...s,
            pages: roleData.pages,
            actions: roleData.actions
          };
        }
        return s;
      }));

      return { success: true };
    } finally {
      setWriteLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        records: recordsState,
        products: productsState,
        vendors: vendorsState,
        companies: companiesState,
        whatsappEntries,
        users: usersState,
        settings: settingsState,
        receiving: rawReceiving,
        logistics: rawLogistics,
        headers: headersState,
        refresh,
        updateRow,
        addRow,
        updateSettingsRow,
        poHistoryRecords,
        orderByList: orderByListState
      }}
    >
      {children}
      
      {/* Global backdrop loader for write operations */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999 }}
        open={writeLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" size={45} />
          <Typography variant="body2" fontWeight={600}>
            Saving to Google Sheets...
          </Typography>
        </Box>
      </Backdrop>
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
};
export default DataContext;

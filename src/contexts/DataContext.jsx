import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Backdrop, CircularProgress, Box, Typography, Card, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import PremiumLoader from '../components/common/PremiumLoader';
import { gasApi } from '../services/gasApi';
import { useAuth } from './AuthContext';
import { mapProductRow, mapWhatsAppRow, mapWorkflowRecords, mapCompanyRow, mapVendorRow, mapUserRow } from '../services/dataMapper';
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
  "products": "Product Master",
  "companies": "Master-Company",
  "vendors": "CReditor MAster",
  "users": "LOGIN",
  "whatsapp": "Whatsapp-Orders",
  "poSentStatus": "PO Sent Status",
  "poGenerate": "Po Generate",
  "poHistory": "PO-History"
};

const getHeaderRow = (grid, sheetName = "") => {
  if (!grid || grid.length === 0) return [];
  if (sheetName === "INDENT-PO") {
    return (grid[5] || []).map(h => String(h || "").trim());
  }
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
  const seen = {};
  const uniqueHeaders = headers.map(h => {
    if (!h) return "";
    if (seen[h] !== undefined) {
      seen[h]++;
      return `${h}_${seen[h]}`;
    }
    seen[h] = 1;
    return h;
  });

  const objects = [];
  for (let i = headerRowIndex + 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row || row.every(cell => cell === "" || cell === null || cell === undefined)) {
      continue;
    }
    // _row is the physical 1-based row index in spreadsheet (i + 1)
    const obj = { _row: i + 1, _rawRow: row };
    for (let j = 0; j < uniqueHeaders.length; j++) {
      const header = uniqueHeaders[j];
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
  const [syncing, setSyncing] = useState(false);
  const activeSyncsRef = useRef(0);

  const startSync = () => {
    activeSyncsRef.current += 1;
    setSyncing(true);
  };

  const endSync = () => {
    activeSyncsRef.current = Math.max(0, activeSyncsRef.current - 1);
    if (activeSyncsRef.current === 0) {
      setSyncing(false);
    }
  };
  
  // Local states for loaded resources
  const [recordsState, setRecordsState] = useState([]);
  const [productsState, setProductsState] = useState([]);
  const [vendorsState, setVendorsState] = useState([]);
  const [companiesState, setCompaniesState] = useState([]);
  const [whatsappEntries, setWhatsappEntries] = useState([]);
  const [usersState, setUsersState] = useState([]);
  const [rawReceiving, setRawReceiving] = useState([]);
  const [rawLogistics, setRawLogistics] = useState([]);
  const [rawReceiving2D, setRawReceiving2D] = useState([]);
  const [rawLogistics2D, setRawLogistics2D] = useState([]);
  const [rawIndents, setRawIndents] = useState([]);
  const [rawApprovals, setRawApprovals] = useState([]);
  const [rawFollowUps, setRawFollowUps] = useState([]);
  const [rawVendorsData, setRawVendorsData] = useState([]);
  const [rawCompaniesData, setRawCompaniesData] = useState([]);
  const [rawProductsData, setRawProductsData] = useState([]);
  const [rawDropdowns, setRawDropdowns] = useState([]);
  const [productTypesState, setProductTypesState] = useState([]);
  const [unitsState, setUnitsState] = useState([]);
  const [rawUsers, setRawUsers] = useState([]);
  const [rawWhatsapp, setRawWhatsapp] = useState([]);
  const [rawPoSentStatus, setRawPoSentStatus] = useState([]);
  const [rawPoGenerate, setRawPoGenerate] = useState([]);
  const [rawPoHistory, setRawPoHistory] = useState([]);
  const [headersState, setHeadersState] = useState({});
  const [poHistoryRecords, setPoHistoryRecords] = useState([]);
  const [pendingPoRecords, setPendingPoRecords] = useState([]);
  const [rawCancelOrders, setRawCancelOrders] = useState([]);
  const [cancelOrdersState, setCancelOrdersState] = useState([]);
  const [orderByListState, setOrderByListState] = useState([]);

  const loadData = async (showGlobalLoading = true, sheetsToFetch = null) => {
    if (showGlobalLoading) setLoading(true);
    setError(null);
    try {
      let fetchedData = {};
      if (sheetsToFetch && sheetsToFetch.length > 0) {
        const activeSheets = [
          { key: "indents", name: "INDENT-PO" },
          { key: "whatsapp", name: "Whatsapp-Orders" },
          { key: "followUps", name: "Flw-up" },
          { key: "poGenerate", name: "Po Generate" },
          { key: "poHistory", name: "PO-History" },
          { key: "logistics", name: "LIFT-RECEIVED" },
          { key: "receiving", name: "RECEIVED-ACCOUNTS" },
          { key: "users", name: "LOGIN" },
          { key: "vendorsData", name: "CReditor MAster" },
          { key: "productsData", name: "Product Master" },
          { key: "dropdowns", name: "Dropdown" },
          { key: "companiesData", name: "Master-Company" },
          { key: "cancelOrders", name: "Cancel-Order" }
        ];

        const targets = activeSheets.filter(s => sheetsToFetch.includes(s.key));
        const promises = targets.map(async (s) => {
          const res = s.key === "productsData"
            ? await gasApi.fetchProductSheet(s.name)
            : s.key === "vendorsData"
              ? await gasApi.fetchVendorSheet(s.name)
              : await gasApi.fetchSheet(s.name);
          return { key: s.key, data: res.data || [] };
        });
        const results = await Promise.all(promises);
        for (const r of results) {
          fetchedData[r.key] = r.data;
        }
      } else {
        const [result, prodResult, vendorResult] = await Promise.all([
          gasApi.bootstrap(),
          gasApi.fetchProductSheet("Product Master").catch(err => {
            console.error("Failed to fetch products from new GAS URL", err);
            return { data: [] };
          }),
          gasApi.fetchVendorSheet("CReditor MAster").catch(err => {
            console.error("Failed to fetch vendors from new GAS URL", err);
            return { data: [] };
          })
        ]);
        fetchedData = result.data || {};
        fetchedData.productsData = prodResult.data || [];
        fetchedData.vendorsData = vendorResult.data || [];
      }

      const indentsRaw = fetchedData.indents !== undefined ? fetchedData.indents : rawIndents;
      const approvalsRaw = fetchedData.approvals !== undefined ? fetchedData.approvals : rawApprovals;
      const followUpsRaw = fetchedData.followUps !== undefined ? fetchedData.followUps : rawFollowUps;
      const logisticsRaw = fetchedData.logistics !== undefined ? fetchedData.logistics : rawLogistics2D;
      const receivingRaw = fetchedData.receiving !== undefined ? fetchedData.receiving : rawReceiving2D;
      const vendorsDataRaw = fetchedData.vendorsData !== undefined ? fetchedData.vendorsData : rawVendorsData;
      const productsDataRaw = fetchedData.productsData !== undefined ? fetchedData.productsData : rawProductsData;
      const companiesDataRaw = fetchedData.companiesData !== undefined ? fetchedData.companiesData : rawCompaniesData;
      const dropdownsRaw = fetchedData.dropdowns !== undefined ? fetchedData.dropdowns : rawDropdowns;
      const usersRaw = fetchedData.users !== undefined ? fetchedData.users : rawUsers;
      const whatsappRaw = fetchedData.whatsapp !== undefined ? fetchedData.whatsapp : rawWhatsapp;
      const poSentStatusRaw = fetchedData.poSentStatus !== undefined ? fetchedData.poSentStatus : rawPoSentStatus;
      const poGenerateRaw = fetchedData.poGenerate !== undefined ? fetchedData.poGenerate : rawPoGenerate;
      const poHistoryRaw = fetchedData.poHistory !== undefined ? fetchedData.poHistory : rawPoHistory;
      const cancelOrdersRaw = fetchedData.cancelOrders !== undefined ? fetchedData.cancelOrders : rawCancelOrders;

      console.log("[DEBUG DataContext] Raw rows fetched:", {
        indents: indentsRaw.length,
        approvals: approvalsRaw.length,
        followUps: followUpsRaw.length,
        logistics: logisticsRaw.length,
        receiving: receivingRaw.length,
        users: usersRaw.length,
        poHistory: poHistoryRaw.length,
        cancelOrders: cancelOrdersRaw.length,
      });

      // Update cached state variables
      if (fetchedData.indents !== undefined || !sheetsToFetch) setRawIndents(indentsRaw);
      if (fetchedData.approvals !== undefined || !sheetsToFetch) setRawApprovals(approvalsRaw);
      if (fetchedData.followUps !== undefined || !sheetsToFetch) setRawFollowUps(followUpsRaw);
      if (fetchedData.logistics !== undefined || !sheetsToFetch) setRawLogistics2D(logisticsRaw);
      if (fetchedData.receiving !== undefined || !sheetsToFetch) setRawReceiving2D(receivingRaw);
      if (fetchedData.vendorsData !== undefined || !sheetsToFetch) setRawVendorsData(vendorsDataRaw);
      if (fetchedData.companiesData !== undefined || !sheetsToFetch) setRawCompaniesData(companiesDataRaw);
      if (fetchedData.productsData !== undefined || !sheetsToFetch) setRawProductsData(productsDataRaw);
      if (fetchedData.dropdowns !== undefined || !sheetsToFetch) setRawDropdowns(dropdownsRaw);
      if (fetchedData.users !== undefined || !sheetsToFetch) setRawUsers(usersRaw);
      if (fetchedData.whatsapp !== undefined || !sheetsToFetch) setRawWhatsapp(whatsappRaw);
      if (fetchedData.poSentStatus !== undefined || !sheetsToFetch) setRawPoSentStatus(poSentStatusRaw);
      if (fetchedData.poGenerate !== undefined || !sheetsToFetch) setRawPoGenerate(poGenerateRaw);
      if (fetchedData.poHistory !== undefined || !sheetsToFetch) setRawPoHistory(poHistoryRaw);
      if (fetchedData.cancelOrders !== undefined || !sheetsToFetch) setRawCancelOrders(cancelOrdersRaw);

      const headersMap = {
        indents: getHeaderRow(indentsRaw, "INDENT-PO"),
        approvals: getHeaderRow(approvalsRaw),
        followUps: getHeaderRow(followUpsRaw),
        logistics: getHeaderRow(logisticsRaw),
        receiving: getHeaderRow(receivingRaw),
        users: getHeaderRow(usersRaw),
        whatsapp: getHeaderRow(whatsappRaw),
        cancelOrders: getHeaderRow(cancelOrdersRaw),
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

      // Products: from "Product Master" sheet, using exact column mapping:
      // Product Type(G=index 6), Supplier ID(J=index 9), Supplier Name(K=index 10), Group Name(F=index 5), Item Name(C=index 2), Unit(J=index 9), Item Code(D=index 3), Purchase Rate(M=index 12), Mobile NO(P=index 15)
      const productHeaders = [];
      productHeaders[6] = "Product Type";
      productHeaders[9] = "Supplier ID";
      productHeaders[10] = "Supplier Name";
      productHeaders[5] = "Group Name";
      productHeaders[2] = "Item Name";
      productHeaders[3] = "Item Code";
      productHeaders[12] = "Purchase Rate";
      productHeaders[15] = "Mobile NO";

      const productsObj = productsDataRaw.slice(1).map((row, idx) => {
        return {
          _row: idx + 2,
          "Product Type": row[6] || "",
          "Supplier ID": row[9] || "",
          "Supplier Name": row[10] || "",
          "Group Name": row[5] || "",
          "Item Name": row[2] || "",
          "Unit": row[9] || "",
          "Item Code": row[3] || "",
          "Purchase Rate": row[12] || "",
          "Mobile NO": row[15] || ""
        };
      }).filter(r => r["Product Type"] && String(r["Product Type"]).trim() !== "");
      const mappedProducts = productsObj.map((row, idx) => mapProductRow(row, idx));

      // Dropdowns: from "Dropdown" sheet, header row = 1
      const productTypesList = dropdownsRaw.slice(1)
        .map(row => String(row[1] || "").trim())
        .filter(val => val && val !== "Product Type");
      const unitsList = dropdownsRaw.slice(1)
        .map(row => String(row[2] || "").trim())
        .filter(val => val && val !== "UOM");
      setProductTypesState([...new Set(productTypesList)]);
      setUnitsState([...new Set(unitsList)]);

      // Companies: from "Master-Company" sheet, columns A-G (0-6), header row = 1
      const companyHeaders = (companiesDataRaw[0] || []).map(h => String(h || "").trim());
      const companiesObj = companiesDataRaw.slice(1).map((row, idx) => ({
        _row: idx + 2,
        ...sliceRowToObj(row, companyHeaders, 0)
      })).filter(r => r["Company Name"] && String(r["Company Name"]).trim() !== "");
      const mappedCompanies = companiesObj.map((row, idx) => mapCompanyRow(row, idx));

      // Vendors: from "CReditor MAster" sheet, using index-based mapping
      // VENDOR NAME(C=2), CITY(D=3), GST NUMBER(E=4), ADDRESS(G=6, H=7, I=8), PHONE NUMBER(K=10), TRANSPORT NAME(L=11)
      const vendorHeaders = [];
      vendorHeaders[2] = "Vendor Name";
      vendorHeaders[3] = "City";
      vendorHeaders[4] = "GST Number";
      vendorHeaders[6] = "Address";
      vendorHeaders[10] = "Phone Number";
      vendorHeaders[11] = "Transport Name";

      const vendorsObj = vendorsDataRaw.slice(1).map((row, idx) => {
        const addressParts = [row[6], row[7], row[8]].map(p => String(p || '').trim()).filter(Boolean);
        return {
          _row: idx + 2,
          "Vendor Name": row[2] || "",
          "City": row[3] || "",
          "GST Number": row[4] || "",
          "Address": addressParts.join(", "),
          "Phone Number": row[10] || "",
          "Transport Name": row[11] || ""
        };
      }).filter(r => r["Vendor Name"] && String(r["Vendor Name"]).trim() !== "");
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
        pageAccess: row["PAGE-ACCESS"] || "",
        department: String(row["ROLE"] || "").toLowerCase() === 'admin' ? 'Management' : 'Procurement',
        status: 'active',
        lastLogin: ''
      }));


      setHeadersState({
        ...headersMap,
        products: productHeaders,
        companies: companyHeaders,
        vendors: vendorHeaders,
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

      // Order By: from "Dropdown" sheet, column A (index 0), header row = 1
      const orderByValues = dropdownsRaw.slice(1)
        .map(row => String(row[0] || "").trim())
        .filter(val => val && val !== "Order By");
      setOrderByListState([...new Set(orderByValues)]);

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

      const mappedPoHistory = poHistory.map((row, idx) => {
        const poNo = row["Po Number"] || "";
        const indentNo = row["Indent No."] || "";
        const matchedRec = mappedRecords.find(r => 
          (indentNo && String(r.indentNumber).toLowerCase() === String(indentNo).toLowerCase()) || 
          (poNo && r.poNumber && String(r.poNumber).toLowerCase() === String(poNo).toLowerCase())
        );

        const totalLifted = matchedRec?.totalLifted || 0;
        const pendingLifting = matchedRec?.pendingLifting ?? Math.max(0, (matchedRec?.poQty || matchedRec?.quantity || parseNum(row["Quntity"])) - totalLifted);

        return {
          id: row._row || (idx + 1),
          _row: row._row,
          timestamp: row["Timestamp"] || "",
          partyName: row["Party Name"] || matchedRec?.partyName || "",
          poNumber: poNo,
          productCode: row["Product Code"] || "",
          product: row["Product"] || "",
          description: row["Description"] || "",
          quantity: parseNum(row["Quntity"]),
          poQty: matchedRec?.poQty || parseNum(row["Quntity"]) || 0,
          totalLifted: totalLifted,
          pendingLifting: pendingLifting,
          unit: row["Unit"] || matchedRec?.unit || "",
          rate: parseNum(row["Rate"]),
          discount: parseNum(row["Discount%"]),
          gst: parseNum(row["Gst %"]),
          amount: parseNum(row["Amount"]),
          totalAmount: parseNum(row["Total Amount"]),
          poCopy: row["PO Copy"] || "",
          indentNumber: indentNo,
          serialNo: parseNum(row["Serial No."]),
          companyName: row["Company Name"] || matchedRec?.companyName || "",
          
          // Compatibility fields with WORKFLOW_COLUMNS in PurchaseOrderPage DataTable
          itemName: row["Product"] || matchedRec?.itemName || "",
          itemCode: row["Product Code"] || "",
          groupName: row["Description"] || "",
          status: row["Actual"] ? "Completed" : "Pending",
          createdDate: row["Timestamp"] || "",
          orderBy: ""
        };
      });

      // Map INDENT-PO records for PO page pending consumption
      const mappedIndents = indents.map((row, idx) => {
        const qty = parseNum(row["Quantity"] || row["Quntity"]);
        const rate = parseNum(row["Rate"]);
        const gst = parseNum(row["GST %"] || row["GST"] || row["Gst %"]);
        const discount = parseNum(row["Discount Amount"] || row["Discount"] || row["Discount%"]);
        const afterDiscount = qty * rate * (1 - discount / 100);
        const amount = afterDiscount * (1 + gst / 100);
        
        const indentHeaders = headersMap.indents || [];
        const plannedKey = indentHeaders[17] || "Planned1";
        const actualKey = indentHeaders[18] || "Actual1";
        
        const planned1 = row["Planned1"] || row[plannedKey] || "";
        const actual1 = row["Actual1"] || row[actualKey] || "";

        let totalLifted = 0;
        let pendingLifting = 0;
        let totalCanceledQty = 0;
        if (row._rawRow) {
          totalLifted = parseNum(row._rawRow[24]);
          pendingLifting = parseNum(row._rawRow[26]);
          totalCanceledQty = parseNum(row._rawRow[25]);
        }
        if (!totalLifted && (row["Total Receiving"] || row["Total Lifted"])) totalLifted = parseNum(row["Total Receiving"] || row["Total Lifted"]);
        if (!pendingLifting && (row["Pending Qty"] || row["Pending Lifting"])) pendingLifting = parseNum(row["Pending Qty"] || row["Pending Lifting"]);
        if (!totalCanceledQty && (row["Cancel Qty"] || row["Cancel Quntity"])) totalCanceledQty = parseNum(row["Cancel Qty"] || row["Cancel Quntity"]);

        return {
          id: row._row || (idx + 1),
          _row: row._row,
          timestamp: row["Timestamp"] || "",
          indentNumber: row["Indent Number"] || row["Indent No."] || row["Indent No"] || row["Request ID"] || "",
          serialNo: parseNum(row["Serial No."] || row["Product No."] || row["Product No"]),
          orderBy: row["Order By"] || "",
          partyName: row["Party Name"] || "",
          groupName: row["Group Name"] || "",
          itemName: row["Item Name"] || row["Product"] || "",
          itemCode: row["Item code"] || row["Item Code"] || row["Product Code"] || "",
          description: row["Discription"] || row["Description"] || "",
          quantity: qty,
          totalLifted: totalLifted,
          pendingLifting: pendingLifting || qty,
          totalCanceledQty: totalCanceledQty,
          unit: row["Unit"] || "",
          rate: rate,
          gst: gst,
          discount: discount,
          amount: amount,
          leadDays: parseNum(row["Approx Lead days Item will be dileverd सामान डिलीवर होने में लगभग कितने दिन लगेंगे(लीड डेज़)"] || row["Approx Lead Days"]),
          companyName: row["Company Name"] || "",
          image: row["Image"] || row["PO Copy"] || null,
          planned1: planned1,
          actual1: actual1,
          
          // Compatibility fields with WORKFLOW_COLUMNS in PurchaseOrderPage DataTable
          status: actual1 ? "Completed" : "Pending",
          createdDate: row["Timestamp"] || "",
        };
      });

      // Filter pending: Planned1 is not null/empty AND Actual1 is null/empty
      const pendingPo = mappedIndents.filter(row => 
        row.planned1 && String(row.planned1).trim() !== "" && (!row.actual1 || String(row.actual1).trim() === "")
      );
      
      setPendingPoRecords(pendingPo);
      setPoHistoryRecords(mappedPoHistory);

      // Map Cancel-Order entries (sheet header row = 1)
      const mappedCancelOrders = (cancelOrdersRaw || []).slice(1).map((row, idx) => ({
        id: idx + 1,
        timestamp: row[0] || '',
        indentNumber: row[1] || '',
        serialNo: row[2] || '',
        cancelStage: row[3] || '',
        cancelQty: parseNum(row[4])
      }));
      setCancelOrdersState(mappedCancelOrders);

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

  const refresh = async (sheetsToFetch = null, showSpinner = true) => {
    if (showSpinner) {
      setWriteLoading(true);
    } else {
      startSync();
    }
    try {
      await loadData(false, sheetsToFetch);
    } finally {
      if (showSpinner) {
        setWriteLoading(false);
      } else {
        endSync();
      }
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

  const updateRow = async (resource, rowIndex, columnValues, showSpinner = true) => {
    const sheetName = SHEET_MAP[resource];
    const headers = headersState[resource] || [];
    let colOffset = 0;
    if (resource === "companies") {
      colOffset = 0;
    } else if (resource === "vendors") {
      colOffset = 0;
    } else if (resource === "products") {
      colOffset = 0;
    }
    
    if (showSpinner) setWriteLoading(true);
    try {
      const cells = [];
      for (const [colName, value] of Object.entries(columnValues)) {
        let absoluteColIdx = -1;
        if (colName.startsWith("col-")) {
          absoluteColIdx = parseInt(colName.replace("col-", ""), 10);
        } else {
          let colIdx = headers.indexOf(colName) + 1;
          if (colIdx <= 0) {
            const normCol = colName.replace(/\s+/g, "").toLowerCase();
            colIdx = headers.findIndex(h => String(h || "").replace(/\s+/g, "").toLowerCase() === normCol) + 1;
          }
          if (colIdx > 0) {
            absoluteColIdx = colIdx + colOffset;
          }
        }
        if (absoluteColIdx > 0) {
          cells.push({ rowIndex, columnIndex: absoluteColIdx, value });
        }
      }
      if (cells.length > 0) {
        if (resource === "products") {
          await gasApi.updateProductCells(sheetName, cells);
        } else {
          await gasApi.updateCells(sheetName, cells);
        }
      }
    } finally {
      if (showSpinner) setWriteLoading(false);
    }
  };

  const addRow = async (resource, data, showSpinner = true) => {
    const sheetName = SHEET_MAP[resource];
    const headers = headersState[resource]?.length 
      ? headersState[resource] 
      : (resource === 'whatsapp' ? ["Timestamp", "Party Name", "Slip Image", "Order By", "Email Address"] : []);
    const rowValues = [];
    
    if (resource === 'whatsapp') {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (header === "Timestamp") {
          rowValues.push("'" + formatTimestamp(data.Timestamp || data.timestamp || new Date()));
        } else if (data[header] !== undefined) {
          rowValues.push(data[header]);
        } else {
          rowValues.push("");
        }
      }
      if (showSpinner) setWriteLoading(true);
      try {
        const res = await gasApi.insertInColumns(sheetName, 1, rowValues, 1);
        return res;
      } finally {
        if (showSpinner) setWriteLoading(false);
      }
    }

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
    if (showSpinner) setWriteLoading(true);
    try {
      const res = await gasApi.insertRow(sheetName, rowValues);
      return res;
    } finally {
      if (showSpinner) setWriteLoading(false);
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
        receiving: rawReceiving,
        logistics: rawLogistics,
        headers: headersState,
        refresh,
        updateRow,
        addRow,
        poHistoryRecords,
        pendingPoRecords,
        cancelOrders: cancelOrdersState,
        productTypes: productTypesState,
        units: unitsState,
        orderByList: orderByListState,
        startSync,
        endSync
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

      {/* Floating Background Sync Status widget */}
      {syncing && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 1.25,
            borderRadius: '50px',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            animation: 'premium-fade-in 0.3s ease-out',
            '@keyframes premium-fade-in': {
              '0%': { opacity: 0, transform: 'translateY(10px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <PremiumLoader size={18} />
          <Typography
            variant="body2"
            component="div"
            fontWeight={600}
            sx={{
              color: 'text.primary',
              fontSize: '0.82rem',
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            Syncing Live Data
            <Box
              component="span"
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'success.main',
                display: 'inline-block',
                animation: 'pulse 1.2s infinite ease-in-out',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(0.8)', opacity: 0.5, boxShadow: '0 0 0 0 rgba(46, 125, 50, 0.7)' },
                  '70%': { transform: 'scale(1)', opacity: 1, boxShadow: '0 0 0 6px rgba(46, 125, 50, 0)' },
                  '100%': { transform: 'scale(0.8)', opacity: 0.5, boxShadow: '0 0 0 0 rgba(46, 125, 50, 0)' },
                },
              }}
            />
          </Typography>
        </Paper>
      )}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
};
export default DataContext;

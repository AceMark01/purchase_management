const GAS_URL = import.meta.env.VITE_GAS_URL;

if (!GAS_URL) {
  console.warn("VITE_GAS_URL is not defined in the environment. Please check your .env file.");
}

async function get(params) {
  const query = new URLSearchParams(params).toString();
  const url = `${GAS_URL}?${query}`;
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
  });
  if (!response.ok) {
    throw new Error(`GAS API GET error: ${response.statusText}`);
  }
  const result = await response.json();
  if (result && result.success === false) {
    throw new Error(result.error || "Unknown GAS error");
  }
  return result;
}

async function post(params) {
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  }
  const response = await fetch(GAS_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });
  if (!response.ok) {
    throw new Error(`GAS API POST error: ${response.statusText}`);
  }
  const result = await response.json();
  if (result && result.success === false) {
    throw new Error(result.error || "Unknown GAS error");
  }
  return result;
}

export const gasApi = {
  fetchSheet: (sheetName) => get({ sheet: sheetName }),
  // Read operations (single fetch for all sheets to optimize loading time)
  bootstrap: async () => {
    const activeSheets = [
      { key: "indents", name: "INDENT-PO" },
      { key: "whatsapp", name: "Whatsapp Form" },
      { key: "followUps", name: "Flw-up" },
      { key: "poGenerate", name: "Po Generate" },
      { key: "poHistory", name: "PO-History" },
      { key: "logistics", name: "LIFT-RECEIVED" },
      { key: "receiving", name: "RECEIVED-ACCOUNTS" },
      { key: "masterData", name: "Master Data" },
      { key: "users", name: "LOGIN" },
      { key: "vendorsData", name: "Master-Vendors" },
      { key: "productsData", name: "Master-Products" },
      { key: "dropdowns", name: "Dropdown" },
      { key: "companiesData", name: "Master-Company" }
    ];
    
    const sheetNames = activeSheets.map(s => s.name).join(",");
    const res = await post({ action: "fetchMultiple", sheets: sheetNames });
    
    if (!res || !res.data) {
      throw new Error("Failed to fetch multiple sheets");
    }
    
    const result = {
      indentForm: [["Request ID", "Timestamp", "Serial No.", "Order By", "Party Name", "Group Name", "Item Name", "Item code", "Discription", "Quantity", "Unit", "Rate", "GST %", "Discount Amount", "Image", "Approx Lead days Item will be dileverd ", "Company Name"]],
    };
    
    for (const s of activeSheets) {
      result[s.key] = res.data[s.name] || [];
    }
    
    console.log("[DEBUG gasApi] bootstrap result size:", Object.keys(result).map(k => `${k}: ${result[k].length} rows`));
    
    return { success: true, data: result };
  },

  // Write operations
  insertRow: (sheetName, rowData) => post({ action: 'insert', sheetName, rowData }),
  batchInsert: (sheetName, rowsData) => post({ action: 'batchInsert', sheetName, rowsData }),
  batchInsertIndent: (sheetName, rowsData) => post({ action: 'batchInsertIndent', sheetName, rowsData }),
  batchInsertLogistics: (sheetName, rowsData) => post({ action: 'batchInsertLogistics', sheetName, rowsData }),
  insertInColumns: (sheetName, startCol, dataRow, headerRow) =>
    post({ action: 'insertInColumns', sheetName, startCol, dataRow: JSON.stringify(dataRow), headerRow }),
  updateInColumns: (sheetName, rowIndex, startCol, dataRow) =>
    post({ action: 'updateInColumns', sheetName, rowIndex, startCol, dataRow: JSON.stringify(dataRow) }),
  deleteRowInColumns: (sheetName, rowIndex, startCol, numCols) =>
    post({ action: 'deleteRowInColumns', sheetName, rowIndex, startCol, numCols }),
  updateCell: (sheetName, rowIndex, columnIndex, value) => post({ action: 'updateCell', sheetName, rowIndex, columnIndex, value }),
  deleteRow: (sheetName, rowIndex) => post({ action: 'delete', sheetName, rowIndex }),
  uploadFile: (data) => post({ action: 'uploadFile', ...data }),
  updateFullRow: (sheetName, rowIndex, rowData) => post({ action: 'update', sheetName, rowIndex, rowData: JSON.stringify(rowData) }),

  // Dynamic multi-column row update helper
  updateRow: async (sheetName, rowIndex, headers, columnValues) => {
    for (const [colName, value] of Object.entries(columnValues)) {
      const colIdx = headers.indexOf(colName) + 1;
      if (colIdx > 0) {
        await post({ action: 'updateCell', sheetName, rowIndex, columnIndex: colIdx, value });
      }
    }
    return { success: true };
  }
};


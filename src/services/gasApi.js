const GAS_URL = import.meta.env.VITE_GAS_URL;
const GAS_URL_PRODUCTS = import.meta.env.VITE_GAS_URL_PRODUCTS;

if (!GAS_URL) {
  console.warn("VITE_GAS_URL is not defined in the environment. Please check your .env file.");
}
if (!GAS_URL_PRODUCTS) {
  console.warn("VITE_GAS_URL_PRODUCTS is not defined in the environment. Please check your .env file.");
}

async function get(params, baseUrl = GAS_URL) {
  const query = new URLSearchParams(params).toString();
  const url = `${baseUrl}?${query}`;
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

async function post(params, baseUrl = GAS_URL) {
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  }
  const response = await fetch(baseUrl, {
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
  fetchProductSheet: (sheetName) => get({ sheet: sheetName }, GAS_URL_PRODUCTS),
  fetchVendorSheet: (sheetName) => get({ sheet: sheetName }, GAS_URL_PRODUCTS),
  updateProductCells: (sheetName, cells) => post({ action: 'updateCells', sheetName, cells: JSON.stringify(cells) }, GAS_URL_PRODUCTS),
  // Read operations (single fetch for all sheets to optimize loading time)
  bootstrap: async () => {
    const activeSheets = [
      { key: "indents", name: "INDENT-PO" },
      { key: "whatsapp", name: "Whatsapp-Orders" },
      { key: "followUps", name: "Flw-up" },
      { key: "poGenerate", name: "Po Generate" },
      { key: "poHistory", name: "PO-History" },
      { key: "logistics", name: "LIFT-RECEIVED" },
      { key: "receiving", name: "RECEIVED-ACCOUNTS" },
      { key: "users", name: "LOGIN" },
      { key: "vendorsData", name: "Master-Vendors" },
      { key: "productsData", name: "Master-Products" },
      { key: "dropdowns", name: "Dropdown" },
      { key: "companiesData", name: "Master-Company" },
      { key: "cancelOrders", name: "Cancel-Order" }
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
  cancelOrders: (rowsData) => post({ action: 'batchInsert', sheetName: 'Cancel-Order', rowsData }),
  batchInsertIndent: (sheetName, rowsData) => post({ action: 'batchInsertIndent', sheetName, rowsData }),
  batchInsertLogistics: (sheetName, rowsData) => post({ action: 'batchInsertLogistics', sheetName, rowsData }),
  insertInColumns: (sheetName, startCol, dataRow, headerRow) =>
    post({ action: 'insertInColumns', sheetName, startCol, dataRow: JSON.stringify(dataRow), headerRow }),
  updateInColumns: (sheetName, rowIndex, startCol, dataRow) =>
    post({ action: 'updateInColumns', sheetName, rowIndex, startCol, dataRow: JSON.stringify(dataRow) }),
  deleteRowInColumns: (sheetName, rowIndex, startCol, numCols) =>
    post({ action: 'deleteRowInColumns', sheetName, rowIndex, startCol, numCols }),
  updateCell: (sheetName, rowIndex, columnIndex, value) => post({ action: 'updateCell', sheetName, rowIndex, columnIndex, value }),
  updateCells: (sheetName, cells) => post({ action: 'updateCells', sheetName, cells: JSON.stringify(cells) }),
  updateRange: (sheetName, rowIndex, startCol, values) => post({ action: 'updateRange', sheetName, rowIndex, startCol, values: JSON.stringify(values) }),
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


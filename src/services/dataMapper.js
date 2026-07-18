/**
 * Maps raw spreadsheet rows returned by the GAS API to the frontend data models.
 */

// Helper to safely parse numbers
const parseNum = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// Helper to normalize indent numbers (extract numeric value, e.g. "RI-001" -> "ri1", "RI 01" -> "ri1")
const normalizeIndentNumber = (val) => {
  if (!val) return "";
  const numMatch = String(val).match(/\d+/);
  if (numMatch) {
    return "ri" + parseInt(numMatch[0], 10);
  }
  return String(val).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Helper to format date strings safely
const formatDateString = (d) => {
  if (!d) return '';
  const str = String(d).trim();
  // If already matches DD-MM-YYYY HH:mm:ss or DD-MM-YYYY, return directly
  if (/^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(str) || /^\d{2}-\d{2}-\d{4}$/.test(str)) {
    return str;
  }
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return str;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
  } catch {
    return str;
  }
};

/**
 * Maps product master rows from GAS
 */
export function mapProductRow(row, idx) {
  return {
    id: idx + 1,
    _row: row._row || (idx + 2),
    productType: row["Product Type"] || "",
    vendorId: row["Supplier ID"] || "", // backward compatibility
    vendorName: row["Supplier Name"] || "", // backward compatibility
    supplierId: row["Supplier ID"] || "",
    supplierName: row["Supplier Name"] || "",
    groupName: row["Group Name"] || "",
    itemName: row["Item Name"] || "",
    unit: row["Unit"] || "",
    itemCode: row["Item Code"] || "",
    purchaseRate: parseNum(row["Purchase Rate"]),
    mobileNo: row["Mobile NO"] || "",
  };
}

export function mapCompanyRow(row, idx) {
  return {
    id: idx + 1,
    _row: row._row || (idx + 2),
    companyName: row["Company Name"] || "",
    email: row["Email"] || "",
    phoneNumber: row["Phone Number "] || row["Phone Number"] || "",
    gstNumber: row["GSTIN"] || row["GST number"] || "",
    panNumber: row["PAN"] || row["PAN Number"] || "",
    billingAddress: row["Billing Address"] || "",
    shippingAddress: row["Shipping Address"] || "",
  };
}

export function mapVendorRow(row, idx) {
  return {
    id: idx + 1,
    _row: row._row || (idx + 2),
    vendorName: row["Vendor Name"] || "",         // backward compat
    vendorId:   row["Vendor Name"] || "",          // backward compat alias
    city:       row["City"] || "",
    gstNumber:  row["GST Number"] || "",
    address:    row["Address"] || "",
    phoneNumber: row["Phone Number"] || "",
    transportName: row["Transport Name"] || "",
  };
}

export function mapUserRow(row, idx) {
  return {
    id: idx + 1,
    _row: row._row || (idx + 3),
    name: row["Full Name"] || "",
    email: row["Email"] || "",
    password: row["Password"] || "",
    role: row["Role"] || "user",
    department: row["Department"] || "",
    status: row["Status"] || "active",
    lastLogin: row["Last Login"] || "",
  };
}




const formatToStandardDateTime = (d) => {
  if (!d) return '';
  const str = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return str;
    const pad = (num) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  } catch {
    return str;
  }
};

/**
 * Maps WhatsApp Form rows
 */
export function mapWhatsAppRow(row, idx) {
  return {
    id: idx + 1,
    _row: row._row || (idx + 2),
    timestamp: formatToStandardDateTime(row["Timestamp"]),
    partyName: row["Party Name"] || "",
    slipImage: row["Slip Image"] || "",
    orderBy: row["Order By"] || "",
    email: row["Email Address"] || "",
  };
}

/**
 * Main mapper that takes all resources and derives the workflow records array.
 */
export function mapWorkflowRecords(
  indentsRows = [],
  approvalsRows = [],
  followUpsRows = [],
  logisticsRows = [],
  receivingRows = [],
  poSentStatusRows = [],
  vendors = [],
  companies = [],
  poHistoryRows = []
) {
  // Index related sheets by keys for O(1) lookups
  // 1. Approvals indexed by PO No. (Case Insensitive)
  const approvalsMap = {};
  approvalsRows.forEach(row => {
    const po = String(row["PO No."] || "").trim().toLowerCase();
    if (po) approvalsMap[po] = row;
  });

  // 2. PO Sent Status indexed by PO No.
  const poSentMap = {};
  poSentStatusRows.forEach(row => {
    const po = String(row["PO No"] || "").trim().toLowerCase();
    if (po) poSentMap[po] = row;
  });

  // 3. Follow-Ups indexed by Indent No.
  const followUpsMap = {};
  followUpsRows.forEach(row => {
    const indentNo = normalizeIndentNumber(row["Indent No."]);
    if (indentNo) followUpsMap[indentNo] = row;
  });

  // 4. Logistics indexed by Indent No.
  const logisticsMap = {};
  logisticsRows.forEach(row => {
    const indentNo = normalizeIndentNumber(row["Indent No."]);
    if (indentNo) logisticsMap[indentNo] = row;
  });

  // 5. Receiving indexed by Lift No. (supporting multiple rows per LN)
  const receivingMap = {};
  receivingRows.forEach(row => {
    const liftNo = String(row["Lift No."] || row["Lift No"] || "").trim().toLowerCase();
    if (liftNo) {
      if (!receivingMap[liftNo]) receivingMap[liftNo] = [];
      receivingMap[liftNo].push(row);
    }
  });

  // 6. PO History indexed by PO Number
  const poHistoryMap = {};
  poHistoryRows.forEach(row => {
    const poNum = String(row["Po Number"] || "").trim().toLowerCase();
    if (poNum && row["PO Copy"]) {
      poHistoryMap[poNum] = row["PO Copy"];
    }
  });

  // First pass: Map raw indents (filter out empty/unassigned rows while preserving correct row index mapping)
  const indentsRowsFiltered = indentsRows.filter(row => {
    const id = row["Indent Number"] || row["Indent No."] || row["Indent No"] || row["Request ID"];
    return id && String(id).trim() !== "";
  });
  const mappedRecords = indentsRowsFiltered.map((row, idx) => {
    const indentNoRaw = row["Indent Number"] || row["Indent No."] || row["Indent No"] || row["Request ID"] || "";
    const indentNo = String(indentNoRaw).trim();
    const poNo = String(row["Po No."] || row["Po No"] || "").trim();
    const poNoLower = poNo.toLowerCase();
    const indentNoNorm = normalizeIndentNumber(indentNo);

    // Lookups
    const approval = poNo ? approvalsMap[poNoLower] : null;
    const poSent = poNo ? poSentMap[poNoLower] : null;
    const followUp = followUpsMap[indentNoNorm];
    const logistic = logisticsMap[indentNoNorm];

    const logisticLiftNo = (logistic && (logistic["LN-Lift Number"] || logistic["LN-Lift Number "] || ""))
      ? String(logistic["LN-Lift Number"] || logistic["LN-Lift Number "]).trim().toLowerCase()
      : "";
    const receiveList = logisticLiftNo ? (receivingMap[logisticLiftNo] || []) : [];
    const receive = receiveList.find(r => {
      const receiveProd = String(r["Product Name"] || "").trim().toLowerCase();
      const indentProd = String(row["Item Name"] || "").trim().toLowerCase();
      return receiveProd === indentProd;
    }) || receiveList[0] || null;

    const quantity = parseNum(row["Quantity"]);
    const rate = parseNum(row["Rate"]);
    const gst = parseNum(row["GST %"] || row["GST"]);
    const discount = parseNum(row["Discount Amount"] || row["Discount"]);

    // Calculate Amount
    const afterDiscount = quantity * rate * (1 - discount / 100);
    const amount = afterDiscount * (1 + gst / 100);

    const baseRecord = {
      id: row._row || (idx + 1), // use spreadsheet row number if available
      createdDate: formatDateString(row["Timestamp"]) || "",
      date: formatDateString(row["Timestamp"]),
      indentNumber: indentNo,
      serialNo: parseNum(row["Serial No."]),
      orderBy: row["Order By"] || "",
      partyName: row["Party Name"] || "",
      groupName: row["Group Name"] || "",
      itemName: row["Item Name"] || "",
      itemCode: row["Item code"] || row["Item Code"] || "",
      description: row["Discription"] || row["Description"] || "",
      quantity,
      unit: row["Unit"] || "",
      rate,
      gst,
      discount,
      amount,
      leadDays: parseNum(row["Approx Lead days Item will be dileverd सामान डिलीवर होने में लगभग कितने दिन लगेंगे(लीड डेज़)"] || row["Approx Lead Days"] || row["leadDays"]),
      companyName: row["Company Name"] || "",
      image: row["Image"] || null,
      poNumber: poNo || null,
      poDate: row["Timestamp"] ? formatDateString(row["Timestamp"]) : "", // default PO date
      status: 'In Progress', // default

      // Stage tracking states
      workflowStage: {
        indent: 'Completed', // Always completed if row exists
        purchaseOrder: 'Pending',
        approvalPO: null,
        sendPO: null,
        followUp: null,
        logistics: null,
        receiveMaterial: null,
        liftReceiver: null,
        tallyEntry: null,
      }
    };

    // PO Generate Stage
    if (poNo) {
      baseRecord.workflowStage.purchaseOrder = 'Completed';
      baseRecord.poQty = parseNum(row["PO Qty"]);
      baseRecord.poRate = parseNum(row["Rate 1"] || row["Rate 1 "]);
      baseRecord.poCopy = poHistoryMap[poNoLower] || row["PO Copy"] || null;
    }

    // PO Approval Stage
    const planned4 = row["Planned4"] || row["Planned4 "] || "";
    const actual4 = row["Actual4"] || row["Actual4 "] || "";
    const approvalStatus = row["Approval Status"];

    if (planned4 && String(planned4).trim() !== "") {
      if (!actual4 || String(actual4).trim() === "") {
        baseRecord.workflowStage.approvalPO = 'Pending';
      } else {
        baseRecord.workflowStage.approvalPO = 'Completed';
        baseRecord.approvalStatus = approvalStatus || "";
        baseRecord.approvalRemarks = row["Remarks"] || row["Remarks "] || "";
        baseRecord.actual4 = actual4;
        baseRecord.planned4 = planned4;
        baseRecord.status = approvalStatus === 'Approved' ? 'In Progress' : (approvalStatus === 'Rejected' ? 'Rejected' : baseRecord.status);

        if (approvalStatus === 'Approved') {
          // Driven by Planned2/Actual2 instead of setting followUp stage here
        }
      }
    }

    // PO Sent Status
    const planned4_1 = row["Planned4.1"] || row["Planned4.1 "] || "";
    const actual4_1 = row["Actual4.1"] || row["Actual4.1 "] || "";
    const poSentStatus = row["PO Sent Status"] || row["PO Sent Status "];
    const remarks4_1 = row["Remarks_2"] || "";

    if (planned4_1 && String(planned4_1).trim() !== "") {
      if (!actual4_1 || String(actual4_1).trim() === "") {
        baseRecord.workflowStage.sendPO = 'Pending';
      } else {
        baseRecord.workflowStage.sendPO = 'Completed';
        baseRecord.poSentStatus = poSentStatus || "Sent";
        baseRecord.sentDate = formatDateString(actual4_1);
        baseRecord.sendPORemarks = remarks4_1;
      }
    }

    // Follow-Up Stage - Driven by Planned2 and Actual2 columns
    const planned2 = row["Planned2"] || row["Planned2 "] || "";
    const actual2 = row["Actual2"] || row["Actual2 "] || "";
    if (planned2 && String(planned2).trim() !== "") {
      if (!actual2 || String(actual2).trim() === "") {
        baseRecord.workflowStage.followUp = 'Pending';
      } else {
        baseRecord.workflowStage.followUp = 'Completed';
      }
      baseRecord.planned2 = planned2;
      baseRecord.actual2 = actual2;
    }

    // Vendor Follow-up Stage
    if (followUp) {
      const actualValue = followUp["Actual"] || "";
      const isActualEmpty = !String(actualValue).trim();
      const followUpStatus = followUp["Follow-up Status"] || "";

      const isActual2Empty = !baseRecord.actual2 || String(baseRecord.actual2).trim() === "";
      if (isActualEmpty && isActual2Empty) {
        baseRecord.workflowStage.followUp = 'Pending';
        baseRecord.workflowStage.logistics = null;
      } else {
        baseRecord.workflowStage.followUp = 'Completed';

        if (followUpStatus === 'Cancel') {
          baseRecord.workflowStage.logistics = null;
          baseRecord.workflowStage.receiveMaterial = null;
          baseRecord.status = 'Cancelled';
        } else if (followUpStatus === 'Direct Receiving') {
          baseRecord.workflowStage.logistics = null; // Skip logistics
          if (!receive) {
            baseRecord.workflowStage.receiveMaterial = 'Pending';
          }
        } else {
          // Standard / Arrange Logistics
          if (!logistic) {
            baseRecord.workflowStage.logistics = 'Pending';
          }
        }
      }

      baseRecord.followUpStatus = followUpStatus;
      baseRecord.expectedArrivalDate = formatDateString(followUp["Excepted Arrival Date"]);
      baseRecord.followUpRemarks = followUp["Remark"] || "";
      baseRecord.followUpBy = followUp["Follow Up By"] || "";
      baseRecord.nextFollowUpDate = formatDateString(followUp["Next Follow-up Date"]);
      baseRecord.followUpCode = followUp["CodeNO"] || "";
      baseRecord._followUpRow = followUp._row;
    }

    // Logistics & Lifting Stage
    let planned3 = "";
    let actual3 = "";
    let timeDelay3 = "";
    if (row._rawRow) {
      planned3 = row._rawRow[48] || "";
      actual3 = row._rawRow[49] || "";
      timeDelay3 = row._rawRow[50] || "";
    }
    for (const key in row) {
      if (key === "_rawRow") continue;
      const normalizedKey = key.replace(/\s+/g, "").toLowerCase();
      if (normalizedKey === "planned3") {
        planned3 = row[key] || planned3;
      } else if (normalizedKey === "actual3") {
        actual3 = row[key] || actual3;
      } else if (normalizedKey === "timedelay3") {
        timeDelay3 = row[key] || timeDelay3;
      }
    }

    baseRecord.planned3 = planned3;
    baseRecord.actual3 = actual3;
    baseRecord.timeDelay3 = timeDelay3;

    if (planned3 && String(planned3).trim() !== "") {
      if (!actual3 || String(actual3).trim() === "") {
        baseRecord.workflowStage.logistics = 'Pending';
      } else {
        baseRecord.workflowStage.logistics = 'Completed';
      }
    }

    if (logistic) {
      if (baseRecord.workflowStage.logistics !== 'Pending') {
        baseRecord.workflowStage.logistics = 'Completed';
      }

      // Read columns N to P (Planned 1, Actual 1, Time Delay 1) from LIFT-RECEIVED sheet
      let planned1 = "";
      let actual1 = "";
      let timeDelay1 = "";
      if (logistic._rawRow) {
        planned1 = logistic._rawRow[13] || "";
        actual1 = logistic._rawRow[14] || "";
        timeDelay1 = logistic._rawRow[15] || "";
      }
      for (const key in logistic) {
        if (key === "_rawRow") continue;
        const normalizedKey = key.replace(/\s+/g, "").toLowerCase();
        if (normalizedKey === "planned1") {
          planned1 = logistic[key] || planned1;
        } else if (normalizedKey === "actual1") {
          actual1 = logistic[key] || actual1;
        } else if (normalizedKey === "timedelay1") {
          timeDelay1 = logistic[key] || timeDelay1;
        }
      }

      baseRecord.planned1 = planned1;
      baseRecord.actual1 = actual1;
      baseRecord.timeDelay1 = timeDelay1;

      if (!actual1 || String(actual1).trim() === "") {
        baseRecord.workflowStage.receiveMaterial = 'Pending';
      } else {
        baseRecord.workflowStage.receiveMaterial = 'Completed';
      }

      baseRecord.liftNo = logistic["LN-Lift Number"] || logistic["LN-Lift Number "] || "";
      baseRecord.transporterName = logistic["Transporter Name"] || "";
      baseRecord.vehicleNo = logistic["Vehicle No."] || "";
      baseRecord.driverNo = logistic["Driver No."] || "";
      baseRecord.driverName = logistic["Driver Name"] || "";
      baseRecord.biltyNo = logistic["Bilty No."] || "";
      baseRecord.biltyImage = logistic["Bilty Image"] || null;
      baseRecord.transportingAmount = parseNum(logistic["Transporting Amount"]);
      baseRecord.partyAddress = logistic["Party Address"] || "";
      baseRecord.locationLink = logistic["Party Location Link"] || "";
      baseRecord._logisticsRow = logistic._row;
    }

    // Material Receiving & Lift Receiver
    if (receive) {
      baseRecord.workflowStage.receiveMaterial = 'Completed';
      baseRecord._receivingRow = receive._row;
      baseRecord.liftNo = receive["Lift No."] || receive["Lift No. "] || baseRecord.liftNo || "";

      const liftStatus = receive["lift Status"] || receive["Status"];
      const accountsStatus = receive["Status"];

      baseRecord.receivedQuantity = parseNum(receive["Qty"] || receive["Qty1"]);
      baseRecord.billNo = receive["Bill No."] || "";
      baseRecord.qualityRemarks = receive["Quality Check"] || "";
      baseRecord.receiptImage = receive["Bill Image"] || null;
      baseRecord.grnNo = receive["GRN No."] || "";

      // Lift Receiver columns (Planned 2 = Q, Actual 2 = R)
      let planned2Rec = "";
      let actual2Rec = "";
      if (receive._rawRow) {
        planned2Rec = receive._rawRow[16] || "";
        actual2Rec = receive._rawRow[17] || "";
      }
      for (const key in receive) {
        if (key === "_rawRow") continue;
        const normalizedKey = key.replace(/\s+/g, "").toLowerCase();
        if (normalizedKey === "planned2") {
          planned2Rec = receive[key] || planned2Rec;
        } else if (normalizedKey === "actual2") {
          actual2Rec = receive[key] || actual2Rec;
        }
      }

      if (planned2Rec && String(planned2Rec).trim() !== "") {
        if (!actual2Rec || String(actual2Rec).trim() === "") {
          baseRecord.workflowStage.liftReceiver = 'Pending';
        } else {
          baseRecord.workflowStage.liftReceiver = 'Completed';
        }
      } else {
        baseRecord.workflowStage.liftReceiver = null;
      }

      baseRecord.liftStatus = receive["lift Status"] || "";
      baseRecord.liftPlanned = receive["Planned 2"] || "";
      baseRecord.liftActual = receive["Actual 2"] || "";
      baseRecord.liftTimeDelay = receive["Time Delay 2"] || "";
      baseRecord.liftedImage = receive["Lifted Image"] || null;
      baseRecord.liftRemarks = receive["Remarks"] || "";

      baseRecord.tallyStatus = receive["Status"] || "";
      baseRecord.tallyPlanned = receive["Planned 3"] || "";
      baseRecord.tallyActual = receive["Actual 3"] || "";
      baseRecord.tallyTimeDelay = receive["Time Delay 3"] || "";
      baseRecord.poAttach = receive["PO Attach"] || null;
      baseRecord.biltyAttach = receive["Bilty Attach"] || null;
      baseRecord.invoiceAttach = receive["Invoice Attach"] || null;

      // Tally Entry columns (Planned 3 = V, Actual 3 = W)
      let planned3Rec = "";
      let actual3Rec = "";
      if (receive._rawRow) {
        planned3Rec = receive._rawRow[21] || "";
        actual3Rec = receive._rawRow[22] || "";
      }
      for (const key in receive) {
        if (key === "_rawRow") continue;
        const normalizedKey = key.replace(/\s+/g, "").toLowerCase();
        if (normalizedKey === "planned3") {
          planned3Rec = receive[key] || planned3Rec;
        } else if (normalizedKey === "actual3") {
          actual3Rec = receive[key] || actual3Rec;
        }
      }

      if (planned3Rec && String(planned3Rec).trim() !== "") {
        if (!actual3Rec || String(actual3Rec).trim() === "") {
          baseRecord.workflowStage.tallyEntry = 'Pending';
        } else {
          baseRecord.workflowStage.tallyEntry = 'Completed';
          baseRecord.status = 'Fully Completed';
        }
      } else {
        baseRecord.workflowStage.tallyEntry = null;
      }
    }

    return baseRecord;
  });

  // Second pass: Construct poDetails for PO Generate view templates
  // Group mapped records by PO number to aggregate batched items
  const poGroups = {};
  mappedRecords.forEach(rec => {
    if (rec.poNumber) {
      const key = rec.poNumber.toLowerCase();
      if (!poGroups[key]) poGroups[key] = [];
      poGroups[key].push(rec);
    }
  });

  // Attach full poDetails object to every record in a PO group
  mappedRecords.forEach(rec => {
    if (rec.poNumber) {
      const group = poGroups[rec.poNumber.toLowerCase()] || [];
      const company = companies.find(c => c.companyName === rec.companyName) || {};
      const vendor = vendors.find(v => v.vendorName === rec.partyName) || {};

      rec.poDetails = {
        poNumber: rec.poNumber,
        poDate: rec.poDate,
        vendorId: String(vendor.vendorId || ""),
        vendorName: rec.partyName,
        vendorGst: vendor.gstNumber || "",
        vendorAddress: vendor.vendorLocation || "",
        companyId: String(company.id || ""),
        companyName: rec.companyName,
        companyGst: company.gstNumber || "22ABLFA7973J1Z2",
        companyPan: company.panNumber || "ABLFA7973J",
        billingAddress: company.billingAddress || company.companyAddress || "",
        destinationAddress: company.destination || company.companyAddress || "",
        priceBasis: 'F.O.R. Destination',
        taxesDuties: 'GST Extra as applicable',
        delivery: 'Within 2-3 Weeks from PO date',
        transport: 'By Vendor',
        paymentTerms: '30 Days credit',
        dispatchDate: rec.expectedArrivalDate || "",
        items: group.map((item, idx) => ({
          sno: idx + 1,
          indentNumber: item.indentNumber,
          itemCode: item.itemCode,
          groupName: item.groupName,
          description: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          gst: item.gst,
          discount: item.discount,
        }))
      };
    }
  });

  return mappedRecords;
}

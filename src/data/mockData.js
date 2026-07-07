import { addDays, subDays, format } from 'date-fns';

const today = new Date();
const fmt = (d) => format(d, 'yyyy-MM-dd');

export const USERS = [
  { id: 1, name: 'Admin User', email: 'admin@pms.com', password: 'admin123', role: 'admin', department: 'Management', status: 'active', lastLogin: fmt(subDays(today, 1)) },
  { id: 2, name: 'John Smith', email: 'user@pms.com', password: 'user123', role: 'user', department: 'Procurement', status: 'active', lastLogin: fmt(subDays(today, 2)) },
  { id: 3, name: 'Sarah Johnson', email: 'sarah@pms.com', password: 'sarah123', role: 'user', department: 'Logistics', status: 'active', lastLogin: fmt(subDays(today, 3)) },
  { id: 4, name: 'Mike Wilson', email: 'mike@pms.com', password: 'mike123', role: 'user', department: 'Warehouse', status: 'inactive', lastLogin: fmt(subDays(today, 10)) },
  { id: 5, name: 'Emma Davis', email: 'emma@pms.com', password: 'emma123', role: 'admin', department: 'Finance', status: 'active', lastLogin: fmt(today) },
];

export const COMPANIES = [
  { id: 1, name: 'Acemark Stationers' },
  { id: 2, name: 'Alpha Industries Ltd' },
  { id: 3, name: 'Beta Manufacturing Co.' },
  { id: 4, name: 'Gamma Enterprises' },
  { id: 5, name: 'Delta Corp Ltd' },
  { id: 6, name: 'Epsilon Solutions' },
];

export const VENDORS = [
  { id: 1, name: 'Vidadri Paper Raipur', contact: 'Manager', phone: '9000000000', email: 'vidadri@example.com' },
  { id: 2, name: 'Raj Suppliers', contact: 'Rajesh Kumar', phone: '9876543210', email: 'raj@suppliers.com' },
  { id: 3, name: 'Sharma Traders', contact: 'Vikram Sharma', phone: '9876543211', email: 'sharma@traders.com' },
  { id: 4, name: 'Patel Enterprises', contact: 'Suresh Patel', phone: '9876543212', email: 'patel@enterprises.com' },
  { id: 5, name: 'CleanPaper Co.', contact: 'Manager', phone: '9876543210', email: 'clean@paper.com' },
  { id: 6, name: 'NK', contact: 'NK Manager', phone: '9876543211', email: 'nk@tape.com' },
  { id: 7, name: 'Acemark Publications', contact: 'Manager', phone: '9000000000', email: 'acemark@pub.com' },
];

export const PRODUCTS = [
  { id: 1, type: 'Raw Material', supplierId: 'V001', supplierName: 'CleanPaper Co.', groupName: 'Paper Products', itemName: 'A4 Copier Paper (JK)', unit: 'ream', itemCode: 'PAPER-A4001', purchaseRate: 280, whatsapp: '9876543210' },
  { id: 2, type: 'Raw Material', supplierId: 'V001', supplierName: 'CleanPaper Co.', groupName: 'Paper Products', itemName: 'Graph Paper Pad (A4)', unit: 'pcs', itemCode: 'GRAPH-A401', purchaseRate: 22, whatsapp: '9876543210' },
  { id: 3, type: 'Consumables', supplierId: 'V002', supplierName: 'NK', groupName: 'Cello Tape', itemName: '1.2 X 15 YARD TAPE', unit: 'Pcs', itemCode: 'YT1215', purchaseRate: 11, whatsapp: '9876543211' },
  { id: 4, type: 'Consumables', supplierId: 'V002', supplierName: 'NK', groupName: 'Cello Tape', itemName: '1.2 X30 YARD TAPE', unit: 'Pcs', itemCode: 'YT1230', purchaseRate: 11, whatsapp: '9876543211' },
  { id: 5, type: 'Raw Material', supplierId: 'V003', supplierName: 'Acemark Publications', groupName: 'TNPL RULLING', itemName: 'RADIANT PLATINUM 86CM X 84CM, 54GSM', unit: 'KGS', itemCode: '868454RP', purchaseRate: 0, whatsapp: '9000000000' },
  
  // Adding more dummy products for the other vendors
  { id: 6, type: 'Raw Material', supplierId: 'V004', supplierName: 'Vidadri Paper Raipur', groupName: 'Raw Materials', itemName: 'Vidadri Paper Eco 86Cm, 44Gsm', unit: 'KGS', itemCode: '8644VE', purchaseRate: 46.5, whatsapp: '9000000000' },
  { id: 7, type: 'Raw Material', supplierId: 'V004', supplierName: 'Vidadri Paper Raipur', groupName: 'Raw Materials', itemName: 'Vidadri Paper Eco 52Cm, 44Gsm', unit: 'KGS', itemCode: '5244VE', purchaseRate: 46.5, whatsapp: '9000000000' },
  
  { id: 8, type: 'Electrical', supplierId: 'V005', supplierName: 'Raj Suppliers', groupName: 'Electrical', itemName: 'PVC Cable 4 Core', unit: 'Meter', itemCode: 'ITM003', purchaseRate: 120, whatsapp: '9876543210' },
  { id: 9, type: 'Electrical', supplierId: 'V005', supplierName: 'Raj Suppliers', groupName: 'Electrical', itemName: 'Electric Motor 5HP', unit: 'Piece', itemCode: 'ITM004', purchaseRate: 5000, whatsapp: '9876543210' },

  { id: 10, type: 'Mechanical', supplierId: 'V006', supplierName: 'Sharma Traders', groupName: 'Mechanical', itemName: 'Bearing 6205', unit: 'Piece', itemCode: 'ITM005', purchaseRate: 250, whatsapp: '9876543211' },
  { id: 11, type: 'Mechanical', supplierId: 'V006', supplierName: 'Sharma Traders', groupName: 'Mechanical', itemName: 'Hydraulic Jack 5T', unit: 'Piece', itemCode: 'ITM006', purchaseRate: 3500, whatsapp: '9876543211' },

  { id: 12, type: 'Raw Material', supplierId: 'V007', supplierName: 'Patel Enterprises', groupName: 'Raw Materials', itemName: 'Steel Rod 12mm', unit: 'KG', itemCode: 'ITM001', purchaseRate: 65, whatsapp: '9876543212' },
  { id: 13, type: 'Raw Material', supplierId: 'V007', supplierName: 'Patel Enterprises', groupName: 'Raw Materials', itemName: 'MS Plate 10mm', unit: 'KG', itemCode: 'ITM002', purchaseRate: 55, whatsapp: '9876543212' },
];

export const GROUPS = ['Raw Materials', 'Electrical', 'Mechanical', 'Civil', 'IT Equipment', 'Safety', 'Consumables', 'Chemicals', 'Tools', 'Office Supplies'];
export const UNITS = ['KG', 'Litre', 'Meter', 'Piece', 'Box', 'Ton', 'Set', 'Roll', 'Bag', 'Drum'];

export const STATUSES = [
  'Pending Approval',
  'In Progress',
  'Fully Completed'
];

export const ORDER_BY = [
  'Admin User',
  'John Smith',
  'Sarah Johnson',
  'Emma Davis'
];

const ITEMS = [
  { name: 'Vidadri Paper Eco 86Cm, 44Gsm', code: '8644VE', group: 'Raw Materials' },
  { name: 'Vidadri Paper Eco 52Cm, 44Gsm', code: '5244VE', group: 'Raw Materials' },
  { name: 'Vidadri Paper Eco 77Cm, 44Gsm', code: '7744VE', group: 'Raw Materials' },
  { name: 'Vidadri Paper Eco 57.5Cm, 44Gsm', code: '57544VE', group: 'Raw Materials' },
  { name: 'VIDADRI PAPER ECO 86CM X 42CM, 44GSM', code: '864244VE', group: 'Raw Materials' },
  { name: 'Steel Rod 12mm', code: 'ITM001', group: 'Raw Materials' },
  { name: 'MS Plate 10mm', code: 'ITM002', group: 'Raw Materials' },
  { name: 'PVC Cable 4 Core', code: 'ITM003', group: 'Electrical' },
  { name: 'Electric Motor 5HP', code: 'ITM004', group: 'Electrical' },
  { name: 'Bearing 6205', code: 'ITM005', group: 'Mechanical' },
  { name: 'Hydraulic Jack 5T', code: 'ITM006', group: 'Mechanical' },
];

const STAGES = [
  'indent',
  'purchaseOrder',
  'approvalPO',
  'sendPO',
  'followUp',
  'logistics',
  'receiveMaterial',
  'liftReceiver',
  'tallyEntry'
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

export const generateRecords = () => {
  return Array.from({ length: 150 }, (_, i) => {
    const item = ITEMS[i % ITEMS.length];
    const qty = randomInt(10, 500);
    const rate = randomFloat(50, 5000);
    const gst = randomFrom([5, 12, 18, 28]);
    const discount = randomFrom([0, 2, 5, 10]);
    const amount = parseFloat((qty * rate * (1 + gst / 100) * (1 - discount / 100)).toFixed(2));
    const date = subDays(today, randomInt(0, 180));
    const company = randomFrom(COMPANIES);
    const vendor = randomFrom(VENDORS);
    
    // Randomly assign a current active stage (0 to STAGES.length - 1)
    // 0 = Indent, 7 = TallyEntry. If it passed TallyEntry, it's fully complete.
    const currentStageIndex = randomInt(0, STAGES.length); // STAGES.length means fully completed all
    
    const workflowStage = {};
    for (let s = 0; s < STAGES.length; s++) {
      if (s < currentStageIndex) {
        workflowStage[STAGES[s]] = 'Completed';
      } else if (s === currentStageIndex) {
        workflowStage[STAGES[s]] = 'Pending';
      } else {
        workflowStage[STAGES[s]] = null;
      }
    }

    // For Indent, if it's completed, its status is 'Approved'. 
    // Wait, the workflow uses standard Pending/Completed for internal logic, but we also have a display 'Status'.
    // We'll map the display status based on the current stage if needed, or keep it generic 'Active', 'Completed'.
    let status = 'In Progress';
    if (currentStageIndex === 0) status = 'Pending Approval';
    if (currentStageIndex === STAGES.length) status = 'Fully Completed';

    // If it's one of the specific items, hardcode it to Vidadri and Acemark to guarantee it shows up properly in the demo!
    let finalVendor = vendor;
    let finalCompany = company;
    let currentStageIndexToUse = currentStageIndex;

    if (item.name.includes('Vidadri')) {
      finalVendor = VENDORS[0]; // Vidadri Paper
      finalCompany = COMPANIES[0]; // Acemark Stationers
      // Force them to be Pending in Purchase Order so they get batched
      currentStageIndexToUse = 1; 
      status = 'In Progress';
      for (let s = 0; s < STAGES.length; s++) {
        if (s < currentStageIndexToUse) {
          workflowStage[STAGES[s]] = 'Completed';
        } else if (s === currentStageIndexToUse) {
          workflowStage[STAGES[s]] = 'Pending';
        } else {
          workflowStage[STAGES[s]] = null;
        }
      }
    }

    const baseData = {
      id: i + 1,
      date: fmt(date),
      createdDate: fmt(date),
      orderBy: randomFrom(['Admin User', 'John Smith', 'Sarah Johnson', 'Emma Davis']),
      partyName: finalVendor.name,
      groupName: item.group,
      itemName: item.name,
      itemCode: item.code,
      description: item.name,
      quantity: qty,
      unit: item.name.includes('Vidadri') ? 'KGS' : randomFrom(UNITS),
      rate: item.name.includes('Vidadri') ? 46.5 : rate,
      gst: item.name.includes('Vidadri') ? 12 : gst,
      discount: item.name.includes('Vidadri') ? 0 : discount,
      amount: item.name.includes('Vidadri') ? qty * 46.5 : amount,
      leadDays: randomInt(3, 45),
      companyName: finalCompany.name,
      status: status, // global status display
      image: null,
      workflowStage // the core state machine tracker
    };

    // Add stage-specific mock data
    if (currentStageIndexToUse > STAGES.indexOf('purchaseOrder')) {
      baseData.poNumber = `ACE/PO/25-26-${String(randomInt(100, 999))}`;
      baseData.poDate = fmt(date);

      // Use real vendor data matching the vendorSlice
      const vendorGstMap = {
        'Vidadri Paper Raipur': { gst: '22AAAAA0000A1Z5', address: 'Raipur, Chhattisgarh' },
        'Raj Suppliers':        { gst: 'GST27RAJSU1234F1Z5', address: 'Mumbai, Maharashtra' },
        'Sharma Traders':       { gst: '22SHART0001B1Z9', address: 'Delhi, NCR' },
        'Patel Enterprises':    { gst: 'GST29PATEL9012Q3Z7', address: 'Ahmedabad, Gujarat' },
        'CleanPaper Co.':       { gst: '22CLEAN0000C1Z3', address: 'Raipur, Chhattisgarh' },
        'NK':                   { gst: '22NKMAN0000N1Z1', address: 'Raipur, Chhattisgarh' },
        'Acemark Publications': { gst: '22ACEPU0000A1Z5', address: 'Raipur, Chhattisgarh' },
      };
      const vInfo = vendorGstMap[finalVendor.name] || { gst: '', address: '' };

      baseData.poDetails = {
        // Vendor / Supplier
        supplierId: String(finalVendor.id || 1),
        vendorName: finalVendor.name,
        vendorGst:  vInfo.gst,
        vendorAddress: vInfo.address,
        // Company
        companyId:   '1',
        companyName: finalCompany.name,
        companyGst:  '22ABLFA7973J1Z2',
        companyPan:  'ABLFA7973J',
        billingAddress: 'Infront Of Csidc Office, Mahadev Ghat Road Changurabhata, Raipur - 492013, Chhattisgarh, India',
        destinationAddress: 'Infront Of Csidc Office, Mahadev Ghat Road Changurabhata, Raipur - 492013, Chhattisgarh, India',
        // PO Meta
        poNumber: baseData.poNumber,
        poDate:   baseData.poDate,
        // Terms
        priceBasis:   'F.O.R. Destination',
        taxesDuties:  'GST Extra as applicable',
        delivery:     'Within 2-3 Weeks from PO date',
        transport:    'By Supplier',
        paymentTerms: '30 Days credit',
        dispatchDate: fmt(addDays(date, baseData.leadDays || 7)),
        // Items
        items: [{
          sno: 1,
          itemCode:    baseData.itemCode,
          description: baseData.itemName,
          quantity:    baseData.quantity,
          unit:        baseData.unit,
          rate:        baseData.rate,
          gst:         baseData.gst,
          discount:    baseData.discount,
        }]
      };
    }

    if (currentStageIndexToUse > STAGES.indexOf('followUp')) {
      baseData.followUpType = randomFrom(['arrangeLogistics', 'directReceiving']);
      baseData.followUpDate = fmt(date);
      baseData.followUpRemarks = "Followed up successfully.";
    }

    if (currentStageIndexToUse > STAGES.indexOf('logistics')) {
      baseData.transporterName = "Fast Track Logistics";
      baseData.partyAddress = "Raipur Main Branch";
      baseData.locationLink = "https://maps.google.com";
      baseData.vehicleNo = `CG-04-AB-${randomInt(1000, 9999)}`;
      baseData.driverName = "Ramesh Kumar";
      baseData.driverNo = "9876543210";
      baseData.biltyNo = `BIL-${randomInt(1000, 9999)}`;
      baseData.biltyImage = null;
      baseData.transportingAmount = randomInt(500, 5000);
    }

    if (currentStageIndexToUse > STAGES.indexOf('receiveMaterial')) {
      baseData.receivedQuantity = baseData.quantity;
      baseData.billNo = `BILL-${randomInt(100, 999)}`;
      baseData.qualityRemarks = "Good Condition";
      baseData.receiptImage = null;
    }

    if (currentStageIndexToUse > STAGES.indexOf('liftReceiver')) {
      baseData.liftStatus = 'Completed';
    }

    if (currentStageIndexToUse > STAGES.indexOf('tallyEntry')) {
      baseData.tallyStatus = 'Verified';
      baseData.tallyRemarks = 'All matched perfectly';
    }

    return baseData;
  });
};

const rawBaseRecords = generateRecords();

// Second pass: Group by Party Name to assign RI XX and serial numbers properly
let nextIndentCounter = 3; // starting after our hardcoded dummies
const partyIndentMap = {}; // { 'Party Name': { indent: 'RI 03', nextSerial: 1 } }

const baseRecords = rawBaseRecords.map(r => {
  if (!partyIndentMap[r.partyName]) {
    partyIndentMap[r.partyName] = {
      indent: `RI ${String(nextIndentCounter).padStart(2, '0')}`,
      nextSerial: 1
    };
    nextIndentCounter++;
  }
  const info = partyIndentMap[r.partyName];
  const updatedRecord = {
    ...r,
    indentNumber: info.indent,
    serialNo: info.nextSerial
  };
  info.nextSerial++;
  return updatedRecord;
});
const dummyRecords = [
  {
    id: 10001,
    indentNumber: 'RI 01',
    serialNo: 1,
    createdDate: '2025-08-04T14:25:12Z',
    date: '2025-08-04',
    orderBy: 'Mr. Sharma',
    partyName: 'CleanPaper Co.',
    groupName: 'Paper Products',
    itemName: 'A4 Copier Paper (JK)',
    itemCode: 'PAPER-A4001',
    description: 'A4 paper',
    quantity: 10,
    unit: 'ream',
    rate: 280,
    gst: 0,
    discount: 10, // Amount
    amount: (10 * 280) - 10,
    leadDays: 20,
    companyName: 'Acemark Stationers',
    image: 'https://drive.google.com/file/d/1HMIOm4PLYxposx0CoyMLzCE3Py_szoOT/view?usp=drivesdk',
    status: 'In Progress',
    workflowStage: { indent: 'Completed', purchaseOrder: 'Pending', approvalPO: null, sendPO: null, followUp: null, logistics: null, receiveMaterial: null, liftReceiver: null, tallyEntry: null }
  },
  {
    id: 10002,
    indentNumber: 'RI 01',
    serialNo: 2,
    createdDate: '2025-08-04T14:25:12Z',
    date: '2025-08-04',
    orderBy: 'Mr. Sharma',
    partyName: 'CleanPaper Co.',
    groupName: 'Paper Products',
    itemName: 'Graph Paper Pad (A4)',
    itemCode: 'GRAPH-A401',
    description: 'Graph paper',
    quantity: 20,
    unit: 'pcs',
    rate: 22,
    gst: 0,
    discount: 20,
    amount: (20 * 22) - 20,
    leadDays: 21,
    companyName: 'Acemark Stationers',
    image: 'https://drive.google.com/file/d/1HMIOm4PLYxposx0CoyMLzCE3Py_szoOT/view?usp=drivesdk',
    status: 'In Progress',
    workflowStage: { indent: 'Completed', purchaseOrder: 'Pending', approvalPO: null, sendPO: null, followUp: null, logistics: null, receiveMaterial: null, liftReceiver: null, tallyEntry: null }
  },
  {
    id: 10003,
    indentNumber: 'RI 02',
    serialNo: 1,
    createdDate: '2025-08-06T12:28:00Z',
    date: '2025-08-06',
    orderBy: 'Amlan Dikshit',
    partyName: 'NK',
    groupName: 'Cello Tape',
    itemName: '1.2 X 15 YARD TAPE',
    itemCode: 'YT1215',
    description: '',
    quantity: 3,
    unit: 'Pcs',
    rate: 11,
    gst: 18,
    discount: 1,
    amount: (3 * 11 * 1.18) - 1,
    leadDays: 3,
    companyName: 'Acemark Stationers',
    image: null,
    status: 'In Progress',
    workflowStage: { indent: 'Completed', purchaseOrder: 'Pending', approvalPO: null, sendPO: null, followUp: null, logistics: null, receiveMaterial: null, liftReceiver: null, tallyEntry: null }
  },
  {
    id: 10004,
    indentNumber: 'RI 02',
    serialNo: 2,
    createdDate: '2025-08-06T12:43:11Z',
    date: '2025-08-06',
    orderBy: 'Amlan Dikshit',
    partyName: 'NK',
    groupName: 'Cello Tape',
    itemName: '1.2 X30 YARD TAPE',
    itemCode: 'YT1230',
    description: '',
    quantity: 7,
    unit: 'Pcs',
    rate: 11,
    gst: 18,
    discount: 0,
    amount: (7 * 11 * 1.18) - 0,
    leadDays: 7,
    companyName: 'Acemark Stationers',
    image: null,
    status: 'In Progress',
    workflowStage: { indent: 'Completed', purchaseOrder: 'Pending', approvalPO: null, sendPO: null, followUp: null, logistics: null, receiveMaterial: null, liftReceiver: null, tallyEntry: null }
  }
];

const records = [...dummyRecords, ...baseRecords];

export default {
  users: USERS,
  companies: COMPANIES,
  vendors: VENDORS,
  products: PRODUCTS,
  records,
};


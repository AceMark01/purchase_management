import { createSlice } from '@reduxjs/toolkit';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

const initialVendors = [
  {
    id: 1,
    vendorName: 'Vidadri Paper Raipur',
    gstNumber: '22AAAAA0000A1Z5',
    email: 'info@vidadri.com',
    phoneNumber: '9876543210',
    responsibility: 'Paper Supply',
    contactPerson: 'Vidadri Manager',
    vendorLocation: 'Raipur, Chhattisgarh',
    status: 'Active',
    createdDate: '2024-01-10',
    updatedDate: '2024-01-10',
  },
  {
    id: 2,
    vendorName: 'Raj Suppliers',
    gstNumber: 'GST27RAJSU1234F1Z5',
    email: 'raj@suppliers.com',
    phoneNumber: '9876543210',
    responsibility: 'Raw Material Supply',
    contactPerson: 'Rajesh Kumar',
    vendorLocation: 'Mumbai, Maharashtra',
    status: 'Active',
    createdDate: '2024-01-10',
    updatedDate: '2024-01-10',
  },
  {
    id: 3,
    vendorName: 'Sharma Traders',
    responsibility: 'Electrical Components',
    contactPerson: 'Vikram Sharma',
    vendorLocation: 'Delhi, NCR',
    status: 'Active',
    createdDate: '2024-01-15',
    updatedDate: '2024-02-20',
  },
  {
    id: 4,
    vendorName: 'Patel Enterprises',
    gstNumber: 'GST29PATEL9012Q3Z7',
    email: 'patel@enterprises.com',
    phoneNumber: '9876543212',
    responsibility: 'Mechanical Parts',
    contactPerson: 'Suresh Patel',
    vendorLocation: 'Ahmedabad, Gujarat',
    status: 'Active',
    createdDate: '2024-02-01',
    updatedDate: '2024-03-15',
  },
  {
    id: 9,
    vendorName: 'Singh Steel Works',
    gstNumber: 'GST03SINGH4567L1X3',
    email: 'singh@steelworks.com',
    phoneNumber: '9876543213',
    responsibility: 'Steel & Metal Supply',
    contactPerson: 'Gurpreet Singh',
    vendorLocation: 'Ludhiana, Punjab',
    status: 'Active',
    createdDate: '2024-03-10',
    updatedDate: '2024-03-10',
  },
  {
    id: 5,
    vendorName: 'CleanPaper Co.',
    gstNumber: '22CLEAN0000C1Z3',
    email: 'clean@paper.com',
    phoneNumber: '9876543210',
    responsibility: 'Paper Supply',
    contactPerson: 'Manager',
    vendorLocation: 'Raipur, Chhattisgarh',
    status: 'Active',
    createdDate: '2024-01-10',
    updatedDate: '2024-01-10',
  },
  {
    id: 6,
    vendorName: 'NK',
    gstNumber: '22NKMAN0000N1Z1',
    email: 'nk@tape.com',
    phoneNumber: '9876543211',
    responsibility: 'Tape & Consumables',
    contactPerson: 'NK Manager',
    vendorLocation: 'Raipur, Chhattisgarh',
    status: 'Active',
    createdDate: '2024-01-10',
    updatedDate: '2024-01-10',
  },
  {
    id: 7,
    vendorName: 'Acemark Publications',
    gstNumber: '22ACEPU0000A1Z5',
    email: 'acemark@pub.com',
    phoneNumber: '9000000000',
    responsibility: 'Paper & Publications',
    contactPerson: 'Manager',
    vendorLocation: 'Raipur, Chhattisgarh',
    status: 'Active',
    createdDate: '2024-01-10',
    updatedDate: '2024-01-10',
  },
];

const vendorSlice = createSlice({
  name: 'vendors',
  initialState: {
    items: initialVendors,
  },
  reducers: {
    addVendor: (state, action) => {
      const newId = state.items.length > 0 ? Math.max(...state.items.map((v) => v.id)) + 1 : 1;
      state.items.push({
        ...action.payload,
        id: newId,
        createdDate: today(),
        updatedDate: today(),
      });
    },
    updateVendor: (state, action) => {
      const idx = state.items.findIndex((v) => v.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload, updatedDate: today() };
      }
    },
    deleteVendor: (state, action) => {
      state.items = state.items.filter((v) => v.id !== action.payload);
    },
  },
});

export const { addVendor, updateVendor, deleteVendor } = vendorSlice.actions;
export default vendorSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

const initialCompanies = [
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
    createdDate: '2024-01-15',
    updatedDate: '2024-01-15',
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
    createdDate: '2024-02-10',
    updatedDate: '2024-03-05',
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
    createdDate: '2024-03-01',
    updatedDate: '2024-04-20',
  },
];

const companySlice = createSlice({
  name: 'companies',
  initialState: {
    items: initialCompanies,
  },
  reducers: {
    addCompany: (state, action) => {
      const newId = state.items.length > 0 ? Math.max(...state.items.map((c) => c.id)) + 1 : 1;
      state.items.push({
        ...action.payload,
        id: newId,
        createdDate: today(),
        updatedDate: today(),
      });
    },
    updateCompany: (state, action) => {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload, updatedDate: today() };
      }
    },
    deleteCompany: (state, action) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
  },
});

export const { addCompany, updateCompany, deleteCompany } = companySlice.actions;
export default companySlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

const companySlice = createSlice({
  name: 'companies',
  initialState: {
    items: [],
  },
  reducers: {
    setCompanies: (state, action) => {
      state.items = action.payload;
    },
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

export const { setCompanies, addCompany, updateCompany, deleteCompany } = companySlice.actions;
export default companySlice.reducer;

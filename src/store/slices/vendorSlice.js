import { createSlice } from '@reduxjs/toolkit';
import { format } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

const vendorSlice = createSlice({
  name: 'vendors',
  initialState: {
    items: [],
  },
  reducers: {
    setVendors: (state, action) => {
      state.items = action.payload;
    },
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

export const { setVendors, addVendor, updateVendor, deleteVendor } = vendorSlice.actions;
export default vendorSlice.reducer;

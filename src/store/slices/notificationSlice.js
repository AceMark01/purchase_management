import { createSlice } from '@reduxjs/toolkit';

const INITIAL = [
  { id: 1, message: 'New indent IND-2024001 created', time: '2 min ago', read: false, type: 'indent' },
  { id: 2, message: 'PO-2024001 confirmed by vendor', time: '1 hour ago', read: false, type: 'po' },
  { id: 3, message: 'Material RCV-2024001 received', time: '3 hours ago', read: true, type: 'receive' },
  { id: 4, message: 'Follow-up due for PO-2024002', time: '1 day ago', read: true, type: 'followup' },
  { id: 5, message: 'Logistics LOG-2024001 dispatched', time: '2 days ago', read: true, type: 'logistics' },
];

const slice = createSlice({ name: 'notifications', initialState: { items: INITIAL }, reducers: {
  markRead(state, { payload }) { const n = state.items.find((i) => i.id === payload); if (n) n.read = true; },
  markAllRead(state) { state.items.forEach((i) => { i.read = true; }); },
  addNotification(state, { payload }) { state.items.unshift({ ...payload, id: Date.now(), read: false }); },
}});
export const { markRead, markAllRead, addNotification } = slice.actions;
export default slice.reducer;

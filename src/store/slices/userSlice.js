import { createSlice } from '@reduxjs/toolkit';

const DEFAULT_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@pms.com', password: 'admin123', role: 'admin', department: 'Management', status: 'active', lastLogin: '2026-07-06' },
  { id: 2, name: 'John Smith', email: 'user@pms.com', password: 'user123', role: 'user', department: 'Procurement', status: 'active', lastLogin: '2026-07-05' },
  { id: 3, name: 'Sarah Johnson', email: 'sarah@pms.com', password: 'sarah123', role: 'user', department: 'Logistics', status: 'active', lastLogin: '2026-07-04' },
  { id: 4, name: 'Mike Wilson', email: 'mike@pms.com', password: 'mike123', role: 'user', department: 'Warehouse', status: 'inactive', lastLogin: '2026-06-27' },
  { id: 5, name: 'Emma Davis', email: 'emma@pms.com', password: 'emma123', role: 'admin', department: 'Finance', status: 'active', lastLogin: '2026-07-07' },
];

const load = () => { try { const s = localStorage.getItem('pms_users'); return s ? JSON.parse(s) : DEFAULT_USERS; } catch { return DEFAULT_USERS; } };
const save = (d) => localStorage.setItem('pms_users', JSON.stringify(d));

const slice = createSlice({ name: 'users', initialState: { items: load() }, reducers: {
  addUser(state, { payload }) { const id = state.items.reduce((m, i) => Math.max(m, i.id), 0) + 1; state.items.unshift({ ...payload, id }); save(state.items); },
  updateUser(state, { payload }) { const i = state.items.findIndex((x) => x.id === payload.id); if (i !== -1) { state.items[i] = payload; save(state.items); } },
  deleteUser(state, { payload }) { state.items = state.items.filter((i) => i.id !== payload); save(state.items); },
  toggleStatus(state, { payload }) { const u = state.items.find((i) => i.id === payload); if (u) { u.status = u.status === 'active' ? 'inactive' : 'active'; save(state.items); } },
}});
export const { addUser, updateUser, deleteUser, toggleStatus } = slice.actions;
export default slice.reducer;

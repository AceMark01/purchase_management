import { createSlice } from '@reduxjs/toolkit';
import { USERS } from '../../data/mockData';

const load = () => { try { const s = localStorage.getItem('pms_users'); return s ? JSON.parse(s) : USERS; } catch { return USERS; } };
const save = (d) => localStorage.setItem('pms_users', JSON.stringify(d));

const slice = createSlice({ name: 'users', initialState: { items: load() }, reducers: {
  addUser(state, { payload }) { const id = state.items.reduce((m, i) => Math.max(m, i.id), 0) + 1; state.items.unshift({ ...payload, id }); save(state.items); },
  updateUser(state, { payload }) { const i = state.items.findIndex((x) => x.id === payload.id); if (i !== -1) { state.items[i] = payload; save(state.items); } },
  deleteUser(state, { payload }) { state.items = state.items.filter((i) => i.id !== payload); save(state.items); },
  toggleStatus(state, { payload }) { const u = state.items.find((i) => i.id === payload); if (u) { u.status = u.status === 'active' ? 'inactive' : 'active'; save(state.items); } },
}});
export const { addUser, updateUser, deleteUser, toggleStatus } = slice.actions;
export default slice.reducer;

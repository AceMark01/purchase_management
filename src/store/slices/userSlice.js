import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'users',
  initialState: { items: [] },
  reducers: {
    setUsers(state, { payload }) {
      state.items = payload;
    },
    addUser(state, { payload }) {
      const id = state.items.reduce((m, i) => Math.max(m, i.id), 0) + 1;
      state.items.unshift({ ...payload, id });
    },
    updateUser(state, { payload }) {
      const i = state.items.findIndex((x) => x.id === payload.id);
      if (i !== -1) {
        state.items[i] = payload;
      }
    },
    deleteUser(state, { payload }) {
      state.items = state.items.filter((i) => i.id !== payload);
    },
    toggleStatus(state, { payload }) {
      const u = state.items.find((i) => i.id === payload);
      if (u) {
        u.status = u.status === 'active' ? 'inactive' : 'active';
      }
    },
  }
});

export const { setUsers, addUser, updateUser, deleteUser, toggleStatus } = slice.actions;
export default slice.reducer;

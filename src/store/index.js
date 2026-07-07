import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from './slices/workflowSlice';
import userReducer from './slices/userSlice';
import notificationReducer from './slices/notificationSlice';
import companyReducer from './slices/companySlice';
import vendorReducer from './slices/vendorSlice';

const CACHE_KEY = 'pms_cache_v4';

const loadState = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    // Basic validation - must have workflow.records array
    if (!parsed?.workflow?.records || !Array.isArray(parsed.workflow.records)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      workflow: state.workflow,
      vendorMaster: state.vendorMaster,
      companies: state.companies,
    }));
  } catch {
    // ignore write errors (e.g. storage full)
  }
};

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    workflow: workflowReducer,
    users: userReducer,
    notifications: notificationReducer,
    companies: companyReducer,
    vendorMaster: vendorReducer,
  },
  preloadedState,
});

// Debounced save — writes 400ms after the last state change
let saveTimer;
store.subscribe(() => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(store.getState()), 400);
});

// Expose a helper to clear the cache (useful from browser console: window.resetAppData())
window.resetAppData = () => {
  ['pms_cache_v1','pms_cache_v2','pms_cache_v3','pms_cache_v4'].forEach(k => localStorage.removeItem(k));
  window.location.reload();
};

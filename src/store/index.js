import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from './slices/workflowSlice';
import userReducer from './slices/userSlice';
import notificationReducer from './slices/notificationSlice';
import companyReducer from './slices/companySlice';
import vendorReducer from './slices/vendorSlice';

export const store = configureStore({
  reducer: {
    workflow: workflowReducer,
    users: userReducer,
    notifications: notificationReducer,
    companies: companyReducer,
    vendorMaster: vendorReducer,
  },
});

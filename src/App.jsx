import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import IndentManagementPage from './pages/indent/IndentManagementPage';
import PurchaseOrderPage from './pages/purchaseOrder/PurchaseOrderPage';
import ApprovalPurchasePOPage from './pages/purchaseOrder/ApprovalPurchasePOPage';
import SendPOToPartyPage from './pages/purchaseOrder/SendPOToPartyPage';
import FollowUpPage from './pages/followUp/FollowUpPage';
import ArrangeLogisticsPage from './pages/logistics/ArrangeLogisticsPage';

import ReceiveMaterialPage from './pages/receiveMaterial/ReceiveMaterialPage';
import LiftReceiverPage from './pages/liftReceiver/LiftReceiverPage';
import TallyEntryPage from './pages/tallyEntry/TallyEntryPage';
import SettingsPage from './pages/settings/SettingsPage';
import ReportsPage from './pages/reports/ReportsPage';
import CompanyMasterPage from './pages/master/CompanyMasterPage';
import ProductMasterPage from './pages/master/ProductMasterPage';
import VendorMasterPage from './pages/vendors/VendorMasterPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute page="dashboard"><DashboardPage /></ProtectedRoute>} />
          <Route path="/indent" element={<ProtectedRoute page="indent"><IndentManagementPage /></ProtectedRoute>} />
          <Route path="/purchase-order" element={<ProtectedRoute page="purchaseOrder"><PurchaseOrderPage /></ProtectedRoute>} />
          <Route path="/approval-po" element={<ProtectedRoute page="approvalPO"><ApprovalPurchasePOPage /></ProtectedRoute>} />
          <Route path="/send-po" element={<ProtectedRoute page="sendPO"><SendPOToPartyPage /></ProtectedRoute>} />
          <Route path="/follow-up" element={<ProtectedRoute page="followUp"><FollowUpPage /></ProtectedRoute>} />
          <Route path="/logistics" element={<ProtectedRoute page="logistics"><ArrangeLogisticsPage /></ProtectedRoute>} />
          <Route path="/lifting"   element={<Navigate to="/logistics" replace />} />

          <Route path="/receive-material" element={<ProtectedRoute page="receiveMaterial"><ReceiveMaterialPage /></ProtectedRoute>} />
          <Route path="/lift-receiver" element={<ProtectedRoute page="liftReceiver"><LiftReceiverPage /></ProtectedRoute>} />
          <Route path="/tally-entry" element={<ProtectedRoute page="tallyEntry"><TallyEntryPage /></ProtectedRoute>} />
          <Route path="/settings"         element={<ProtectedRoute page="settings"><SettingsPage /></ProtectedRoute>} />
          <Route path="/reports"          element={<ProtectedRoute page="reports"><ReportsPage /></ProtectedRoute>} />
          <Route path="/master"           element={<ProtectedRoute page="master"><CompanyMasterPage /></ProtectedRoute>} />
          <Route path="/product-data"     element={<ProtectedRoute page="productData"><ProductMasterPage /></ProtectedRoute>} />
          <Route path="/vendors"          element={<ProtectedRoute page="vendors"><VendorMasterPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

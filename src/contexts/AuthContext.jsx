import { createContext, useContext, useState, useEffect } from 'react';
import { gasApi } from '../services/gasApi';

const AuthContext = createContext(null);

const ADMIN_PAGES = [
  'dashboard', 'indent', 'purchaseOrder', 'approvalPO', 'sendPO', 'followUp', 'logistics',
  'receiveMaterial', 'liftReceiver', 'tallyEntry', 'orderCancel', 'master', 'productData', 'vendors',
  'whatsapp', 'settings',
];
const USER_PAGES = [
  'dashboard', 'indent', 'purchaseOrder', 'approvalPO', 'sendPO', 'followUp', 'logistics',
  'receiveMaterial', 'liftReceiver', 'tallyEntry', 'orderCancel', 'master', 'productData', 'vendors',
  'whatsapp',
];


export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pms_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem('pms_permissions');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });


  const login = async (username, password) => {
    try {
      const res = await gasApi.fetchSheet('LOGIN');
      if (!res || !res.success || !Array.isArray(res.data)) {
        return { success: false, message: 'Failed to fetch credentials from Google Sheets.' };
      }

      const rows = res.data;
      if (rows.length < 2) {
        return { success: false, message: 'No credential records found in sheet.' };
      }

      const headers = rows[0].map((h) => String(h || '').trim().toUpperCase());
      const usernameIdx = headers.indexOf('USERNAME');
      const passwordIdx = headers.indexOf('PASSWORD');
      const fullnameIdx = headers.indexOf('FULLNAME');
      const roleIdx = headers.indexOf('ROLE');
      const pageAccessIdx = headers.indexOf('PAGE-ACCESS');

      if (usernameIdx === -1 || passwordIdx === -1) {
        return { success: false, message: 'Invalid LOGIN sheet structure. Missing USERNAME or PASSWORD columns.' };
      }

      let foundUser = null;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const u = String(row[usernameIdx] || '').trim();
        const p = String(row[passwordIdx] || '').trim();

        if (u.toLowerCase() === username.toLowerCase() && p === password) {
          foundUser = {
            fullname: fullnameIdx !== -1 ? String(row[fullnameIdx] || '').trim() : u,
            username: u,
            role: roleIdx !== -1 ? String(row[roleIdx] || '').trim().toLowerCase() : 'user',
            pageAccess: pageAccessIdx !== -1 ? String(row[pageAccessIdx] || '').trim() : '',
          };
          break;
        }
      }

      if (!foundUser) {
        return { success: false, message: 'Invalid username or password.' };
      }

      const safeUser = {
        name: foundUser.fullname,
        email: foundUser.username, // keep email property for UI compatibility
        username: foundUser.username,
        role: foundUser.role,
        department: foundUser.role === 'admin' ? 'Management' : 'Procurement',
        status: 'active',
      };

      let parsedPages = foundUser.role === 'admin' ? ADMIN_PAGES : USER_PAGES;
      if (foundUser.pageAccess) {
        const accessVal = foundUser.pageAccess.trim();
        if (accessVal.toLowerCase() !== 'all') {
          parsedPages = accessVal.split(',').map((p) => p.trim());
        }
      }

      const perms = {
        pages: parsedPages,
        actions: {
          create: true,
          read: true,
          update: true,
          delete: foundUser.role === 'admin',
          export: true,
          print: true,
        },
      };

      setUser(safeUser);
      setPermissions(perms);
      localStorage.setItem('pms_user', JSON.stringify(safeUser));
      localStorage.setItem('pms_permissions', JSON.stringify(perms));
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Error connecting to Google Sheets database.' };
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions(null);
    localStorage.removeItem('pms_user');
    localStorage.removeItem('pms_permissions');
  };

  const hasAccess = (page) => {
    if (!user) return false;
    if (page === 'orderCancel') return true;
    const allowedPages = permissions?.pages || (user.role === 'admin' ? ADMIN_PAGES : USER_PAGES);
    return allowedPages.includes(page);
  };

  const canDo = (action) => {
    if (!permissions) return false;
    return permissions.actions[action] === true;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, permissions, login, logout, hasAccess, canDo, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

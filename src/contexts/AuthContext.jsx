import { createContext, useContext, useState, useEffect } from 'react';
import mockData from '../data/mockData';

const AuthContext = createContext(null);

const ADMIN_PAGES = [
  'dashboard', 'indent', 'whatsapp', 'purchaseOrder', 'followUp', 'logistics',
  'lifting', 'receiveMaterial', 'liftReceiver', 'tallyEntry',
  'userManagement', 'settings', 'reports', 'master', 'vendors',
];
const USER_PAGES = [
  'dashboard', 'indent', 'whatsapp', 'purchaseOrder', 'followUp', 'logistics',
  'lifting', 'receiveMaterial', 'liftReceiver', 'tallyEntry',
  'master', 'vendors',
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

  const getDefaultPermissions = (role) => ({
    pages: role === 'admin' ? ADMIN_PAGES : USER_PAGES,
    actions: {
      create: true,
      read: true,
      update: true,
      delete: role === 'admin',
      export: true,
      print: true,
    },
  });

  const login = (email, password) => {
    const found = mockData.users.find((u) => u.email === email && u.password === password);
    if (!found) return { success: false, message: 'Invalid email or password' };
    if (found.status === 'inactive') return { success: false, message: 'Account is inactive. Contact administrator.' };

    const { password: _, ...safeUser } = found;
    const perms = getDefaultPermissions(found.role);
    setUser(safeUser);
    setPermissions(perms);
    localStorage.setItem('pms_user', JSON.stringify(safeUser));
    localStorage.setItem('pms_permissions', JSON.stringify(perms));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setPermissions(null);
    localStorage.removeItem('pms_user');
    localStorage.removeItem('pms_permissions');
  };

  const hasAccess = (page) => {
    if (!user) return false;
    const allowedPages = user.role === 'admin' ? ADMIN_PAGES : USER_PAGES;
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

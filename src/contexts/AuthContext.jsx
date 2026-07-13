import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const USERS = [
  { id: 1, name: 'Admin User', email: 'admin@pms.com', password: 'admin123', role: 'admin', department: 'Management', status: 'active', lastLogin: '2026-07-06' },
  { id: 2, name: 'John Smith', email: 'user@pms.com', password: 'user123', role: 'user', department: 'Procurement', status: 'active', lastLogin: '2026-07-05' },
  { id: 3, name: 'Sarah Johnson', email: 'sarah@pms.com', password: 'sarah123', role: 'user', department: 'Logistics', status: 'active', lastLogin: '2026-07-04' },
  { id: 4, name: 'Mike Wilson', email: 'mike@pms.com', password: 'mike123', role: 'user', department: 'Warehouse', status: 'inactive', lastLogin: '2026-06-27' },
  { id: 5, name: 'Emma Davis', email: 'emma@pms.com', password: 'emma123', role: 'admin', department: 'Finance', status: 'active', lastLogin: '2026-07-07' },
];

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

  const getDefaultPermissions = (role) => {
    try {
      const savedSettings = localStorage.getItem('pms_settings_perms');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed[role]) {
          return parsed[role];
        }
      }
    } catch (e) {
      console.error(e);
    }
    return {
      pages: role === 'admin' ? ADMIN_PAGES : USER_PAGES,
      actions: {
        create: true,
        read: true,
        update: true,
        delete: role === 'admin',
        export: true,
        print: true,
      },
    };
  };

  const login = (email, password) => {
    const found = USERS.find((u) => u.email === email && u.password === password);
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

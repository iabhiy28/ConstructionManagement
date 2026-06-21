import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { getApiMode, setApiMode, detectApiMode } from '../utils/api';

export type UserRole =
  | 'Super Admin'
  | 'Company Owner'
  | 'Project Manager'
  | 'Site Engineer'
  | 'Accountant'
  | 'Store Manager'
  | 'Contractor'
  | 'Vendor'
  | 'Labour Supervisor';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  apiMode: 'mock' | 'api';
  login: (email: string, password?: string, isOtp?: boolean, otp?: string) => Promise<void>;
  signup: (companyName: string, gstin: string, name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  switchRole: (role: UserRole) => void;
  toggleApiMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('Company Owner');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'mock' | 'api'>('mock');

  // Verify auth session on boot
  useEffect(() => {
    async function initAuth() {
      await detectApiMode();
      setMode(getApiMode());

      const token = localStorage.getItem('buildflow_token');
      const savedRole = localStorage.getItem('buildflow_role') as UserRole;
      const savedUserId = localStorage.getItem('buildflow_user_id');

      if (token && savedRole) {
        setRole(savedRole);
        setUser({
          id: savedUserId || 'u1',
          name: savedRole === 'Company Owner' ? 'Rajesh Sharma' : savedRole === 'Project Manager' ? 'Amit Verma' : savedRole === 'Site Engineer' ? 'Vijay Patil' : 'Sanjay Gupta',
          email: savedRole === 'Project Manager' ? 'pm@buildflow.in' : savedRole === 'Site Engineer' ? 'engineer@buildflow.in' : savedRole === 'Accountant' ? 'accountant@buildflow.in' : 'owner@buildflow.in',
          role: savedRole,
          companyId: 'c1'
        });
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password?: string, isOtp?: boolean, otp?: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, password, isOtp, otp);
      const typedRole = res.user.role as UserRole;
      setRole(typedRole);
      setUser({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: typedRole,
        companyId: res.user.companyId
      });
    } finally {
      setLoading(false);
    }
  };

  const signup = async (companyName: string, gstin: string, name: string, email: string, password: string, role: string) => {
    setLoading(true);
    try {
      const res = await api.signup(companyName, gstin, name, email, password, role);
      const typedRole = res.user.role as UserRole;
      setRole(typedRole);
      setUser({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: typedRole,
        companyId: res.user.companyId
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('buildflow_token');
    localStorage.removeItem('buildflow_role');
    localStorage.removeItem('buildflow_user_id');
    setUser(null);
    setRole('Company Owner');
  };

  const sendOtp = async (phone: string) => {
    return api.sendOtp(phone);
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('buildflow_role', newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    } else {
      setUser({
        id: 'u1',
        name: 'Simulated User',
        email: 'user@buildflow.in',
        role: newRole,
        companyId: 'c1'
      });
    }
  };

  const toggleApiMode = async () => {
    const nextMode = mode === 'mock' ? 'api' : 'mock';
    setApiMode(nextMode);
    setMode(nextMode);
    console.log(`BuildFlow AI: Switched active api mode to: ${nextMode}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        apiMode: mode,
        login,
        signup,
        logout,
        sendOtp,
        switchRole,
        toggleApiMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

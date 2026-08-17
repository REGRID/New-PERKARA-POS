"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "karyawan";

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  username?: string;
  pin?: string;
  outletName?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (user: UserSession) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAdmin: false,
});

const DEFAULT_ADMIN: UserSession = {
  id: "admin-1",
  name: "Owner / Manager",
  username: "admin",
  role: "admin",
  pin: "9999",
  outletName: "Outlet Utama",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("perkara_pos_user_session");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default initial session for quick dev testing: Admin
        setUser(DEFAULT_ADMIN);
        localStorage.setItem("perkara_pos_user_session", JSON.stringify(DEFAULT_ADMIN));
      }
    } catch (e) {
      console.error("Failed to load auth session", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData: UserSession) => {
    setUser(userData);
    localStorage.setItem("perkara_pos_user_session", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("perkara_pos_user_session");
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

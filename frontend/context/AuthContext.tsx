'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '@/lib/types';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  loginUser: (user: Usuario) => void;
  logoutUser: () => void;
  updateCurrentUser: (updatedUser: Usuario) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('trello_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Error al cargar sesión almacenada:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginUser = (userData: Usuario) => {
    setUser(userData);
    localStorage.setItem('trello_user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('trello_user');
  };

  const updateCurrentUser = (updatedUser: Usuario) => {
    setUser(updatedUser);
    localStorage.setItem('trello_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

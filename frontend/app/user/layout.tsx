'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen text-slate-100 flex flex-col">
      {/* Header envolvente con Glassmorfismo */}
      <header className="glass-header sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white glass-card px-3 py-1.5 rounded-lg transition"
          >
            ← Volver al Tablero
          </Link>
          <div className="h-4 w-px bg-slate-700"></div>
          <div>
            <h1 className="text-lg font-bold text-blue-400">Perfil de Usuario</h1>
            <p className="text-xs text-slate-400">Gestión de datos de cuenta y contraseña</p>
          </div>
        </div>

        {/* Enlaces rápidos */}
        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <span className="text-slate-300 glass-card px-3 py-1.5 rounded-lg">
              Conectado como <strong className="text-blue-400">@{user.username}</strong>
            </span>
          ) : (
            <>
              <Link 
                href="/login"
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold transition shadow-md shadow-blue-600/20"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/register"
                className="glass-card hover:bg-slate-700/80 text-slate-200 px-3 py-1.5 rounded-lg font-semibold transition"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

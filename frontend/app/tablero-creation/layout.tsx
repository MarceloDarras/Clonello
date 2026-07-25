'use client';

import React from 'react';
import Link from 'next/link';

export default function TableroCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header envolvente para la sección /user */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600/50 transition"
          >
            ← Volver a tableros
          </Link>
          <div className="h-4 w-px bg-slate-700"></div>
          <div>
            <h1 className="text-lg font-bold text-blue-400">Perfil de Usuario</h1>
            <p className="text-xs text-slate-400">Gestión de datos de cuenta y contraseña</p>
          </div>
        </div>

        {/* Enlaces rápidos */}
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

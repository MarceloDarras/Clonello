'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Board } from '@/lib/types';
import { trelloApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading: authLoading, logoutUser } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingBoards, setLoadingBoards] = useState<boolean>(true);
  const [boardsError, setBoardsError] = useState<string | null>(null);

  const [healthStatus, setHealthStatus] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    trelloApi.checkHealth()
      .then(setHealthStatus)
      .catch(() => setHealthStatus(null));

    // Esperar a que la autenticación termine de cargar la sesión antes de hacer la petición
    if (!authLoading) {
      fetchUserBoards();
    }
  }, [user, authLoading]);

  const fetchUserBoards = async () => {
    // Si no hay un usuario autenticado, NO consultar todos los tableros de la BD
    if (!user) {
      setBoards([]);
      setLoadingBoards(false);
      return;
    }

    try {
      setLoadingBoards(true);
      setBoardsError(null);
      // Petición estricta enviando la ID del usuario conectado
      const data = await trelloApi.getBoards(user.id);
      setBoards(data);
    } catch (err) {
      setBoardsError(err instanceof Error ? err.message : 'Error al cargar tableros');
    } finally {
      setLoadingBoards(false);
    }
  };

  return (
    <main className="min-h-screen text-slate-100 flex flex-col">
      {/* Header Principal con Glassmorfismo */}
      <header className="glass-header sticky top-0 z-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-600/30">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-400">Clonello</h1>
          </div>
        </div>

        {/* Sección de Autenticación y Navegación */}
        <div className="flex items-center gap-4 text-xs">
          {user ? (
            <div className="flex items-center gap-3 glass-card px-3.5 py-1.5 rounded-xl">
              <Link href="/user" className="flex items-center gap-2 hover:opacity-80 transition">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 font-bold flex items-center justify-center text-[10px] text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-slate-200">@{user.username}</span>
              </Link>
              <span className="text-slate-600">|</span>
              <Link href="/user" className="text-slate-300 hover:text-white underline">
                Mi Perfil
              </Link>
              <span className="text-slate-600">|</span>
              <button onClick={logoutUser} className="text-rose-400 hover:underline font-medium">
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/login" 
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-blue-600/20"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/register" 
                className="glass-card hover:bg-slate-700/80 text-slate-200 font-semibold px-4 py-2 rounded-xl transition"
              >
                Registrarse
              </Link>
            </div>
          )}

          {/* Estado API */}
          <div className="hidden sm:flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl text-[11px]">
            <span className={`w-2 h-2 rounded-full ${healthStatus ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="text-slate-400">{healthStatus ? 'Flask Conectado' : 'Flask Desconectado'}</span>
          </div>
        </div>
      </header>

      {/* Contenido Principal de Bienvenida */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-10">
        
        {/* Banner de Bienvenida con Glassmorfismo */}
        <section className="glass-panel rounded-3xl p-8 md:p-10 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/50 inline-block backdrop-blur-md">
              Espacio de Trabajo Kanban
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {user ? `¡Hola de nuevo, ${user.nombre}! 👋` : 'Bienvenido a tu Gestor de Tableros 🚀'}
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Organiza tus proyectos, tareas y flujos de trabajo de forma dinámica con listas, tarjetas e interacción en tiempo real.
            </p>
          </div>

          {!user && (
            <div className="flex flex-wrap gap-3 pt-2 relative z-10">
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition"
              >
                Comenzar Gratis
              </Link>
              <Link
                href="/login"
                className="glass-card hover:bg-slate-700/80 text-slate-200 text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                Ya tengo cuenta
              </Link>
            </div>
          )}
        </section>

        {/* Sección de Tableros */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                📋 Mis Tableros
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {user ? `Tableros creados o asignados a @${user.username}` : 'Inicia sesión para ver tus tableros'}
              </p>
            </div>

            {user && (
              <Link
                href="/tablero-creation"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
              >
                <span>+</span> Crear Nuevo Tablero
              </Link>
            )}
          </div>

          {authLoading || loadingBoards ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
              Cargando tableros...
            </div>
          ) : boardsError ? (
            <div className="glass-panel border-rose-800/50 text-rose-200 p-6 rounded-2xl text-center max-w-md mx-auto">
              <p className="text-xs font-semibold mb-2">Error al cargar tableros</p>
              <p className="text-xs opacity-80 mb-3">{boardsError}</p>
              <button 
                onClick={fetchUserBoards}
                className="bg-rose-800 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
              >
                Reintentar
              </button>
            </div>
          ) : !user ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-300 text-sm space-y-3">
              <p className="font-semibold text-white">Inicia sesión o regístrate para acceder a tus tableros personales</p>
              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-semibold transition"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="glass-card hover:bg-slate-700/80 text-slate-200 text-xs px-4 py-2 rounded-xl font-semibold transition"
                >
                  Registrarse
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              
              {/* Tarjeta para crear nuevo tablero */}
              <Link
                href="/tablero-creation"
                className="group glass-card hover:bg-slate-800/80 border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700/60 group-hover:bg-blue-600 text-slate-300 group-hover:text-white flex items-center justify-center font-bold text-xl mb-2 transition shadow-md">
                  +
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition">
                  Crear un tablero nuevo
                </span>
              </Link>

              {/* Lista de Tableros del Usuario */}
              {boards.map((b) => (
                <Link
                  key={b.id}
                  href={`/tablero/${b.id}`}
                  className="group glass-panel hover:border-blue-500/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition min-h-[140px] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition pointer-events-none"></div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-white text-base group-hover:text-blue-400 transition">
                      {b.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {b.lists ? `${b.lists.length} listas` : 'Tablero activo'}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-700/50 text-[11px] text-slate-400 relative z-10">
                    <span>ID: #{b.id}</span>
                    <span className="text-blue-400 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                      Abrir →
                    </span>
                  </div>
                </Link>
              ))}

              {boards.length === 0 && (
                <div className="col-span-full glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs">
                  Aún no tienes tableros asignados. ¡Crea el primero utilizando el botón de arriba!
                </div>
              )}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

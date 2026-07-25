'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useBoard } from '@/hooks/useBoard';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, Usuario } from '@/lib/types';

export default function TableroDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const boardId = Number(resolvedParams.id);

  const { user, logoutUser } = useAuth();
  const [healthStatus, setHealthStatus] = useState<{ status: string; message: string } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  
  // Carga del tablero por su ID
  const { board, loading, error, addList, addCard, moveCard, refresh } = useBoard(boardId);
  
  const [newListTitle, setNewListTitle] = useState('');
  const [newCardTitles, setNewCardTitles] = useState<Record<number, string>>({});
  const [isSubmittingList, setIsSubmittingList] = useState(false);

  // Estado para Drag and Drop
  const [draggingCardId, setDraggingCardId] = useState<number | null>(null);
  const [dragOverListId, setDragOverListId] = useState<number | null>(null);

  // Estado para el Modal de Agregar Usuario a Tablero
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | string>('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.checkHealth()
      .then(setHealthStatus)
      .catch((err) => setHealthError(err.message));
  }, []);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    setIsSubmittingList(true);
    try {
      await addList(newListTitle.trim());
      setNewListTitle('');
    } catch (err) {
      alert('Error creando lista: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsSubmittingList(false);
    }
  };

  const handleCreateCard = async (listId: number) => {
    const title = newCardTitles[listId];
    if (!title || !title.trim()) return;
    try {
      await addCard(title.trim(), listId);
      setNewCardTitles((prev) => ({ ...prev, [listId]: '' }));
    } catch (err) {
      alert('Error creando tarjeta: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // Manejadores de Drag and Drop
  const handleDragStart = (e: React.DragEvent, card: Card) => {
    e.dataTransfer.setData('text/plain', card.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggingCardId(card.id);
  };

  const handleDragOverList = (e: React.DragEvent, listId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverListId !== listId) {
      setDragOverListId(listId);
    }
  };

  const handleDragLeaveList = () => {
    setDragOverListId(null);
  };

  const handleDropOnList = async (e: React.DragEvent, targetListId: number) => {
    e.preventDefault();
    setDragOverListId(null);

    const cardIdStr = e.dataTransfer.getData('text/plain');
    const cardId = Number(cardIdStr) || draggingCardId;

    if (!cardId || !board) {
      setDraggingCardId(null);
      return;
    }

    const targetList = board.lists.find((l) => l.id === targetListId);
    let newPosition = 1000.0;

    if (targetList && targetList.cards.length > 0) {
      const lastCard = targetList.cards[targetList.cards.length - 1];
      newPosition = lastCard.position + 1000.0;
    }

    setDraggingCardId(null);

    try {
      await moveCard(cardId, targetListId, newPosition);
    } catch (err) {
      console.error('Error al soltar tarjeta:', err);
    }
  };

  // Cargar lista de usuarios y abrir modal
  const abrirModalAgregarUsuario = async () => {
    setIsAddUserModalOpen(true);
    setUserMsg(null);
    setSelectedUserId('');

    try {
      setIsLoadingUsers(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Se produjo un error al cargar los usuarios: ", e);
      setUserMsg({ type: 'error', text: 'Error al cargar lista de usuarios' });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Ejecutar vinculación usuario-tablero
  const handleCreateBoardUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setUserMsg({ type: 'error', text: 'Por favor selecciona un usuario.' });
      return;
    }

    setIsSubmittingUser(true);
    setUserMsg(null);

    try {
      await api.createBoardUser(boardId, Number(selectedUserId));
      setUserMsg({ type: 'success', text: '¡Usuario agregado al tablero con éxito!' });
      setSelectedUserId('');
      
      setTimeout(() => {
        setIsAddUserModalOpen(false);
        setUserMsg(null);
      }, 1200);
    } catch (err) {
      setUserMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al vincular el usuario al tablero',
      });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Mapeo/Filtrado para excluir al usuario actualmente logueado
  const usuariosDisponibles = (users || []).filter((u) => u.id !== user?.id);

  return (
    <main className="min-h-screen text-slate-100 flex flex-col relative">
      {/* Header con Glassmorfismo */}
      <header className="glass-header sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white glass-card px-3 py-1.5 rounded-lg transition"
          >
            ← Mis Tableros
          </Link>
          <div className="h-4 w-px bg-slate-700/60"></div>
          <div>
            <h1 className="text-lg font-bold text-blue-400">Trello Clon</h1>
            <p className="text-xs text-slate-400">Tablero #{boardId}</p>
          </div>
        </div>

        {/* Sección de Acciones de Usuario y Autenticación */}
        <div className="flex items-center gap-4 text-xs">
          <button 
            type="button" 
            onClick={abrirModalAgregarUsuario}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-md shadow-blue-600/20 flex items-center gap-1.5"
          >
            <span>+</span> Agregar usuario a tablero
          </button>

          {user ? (
            <div className="flex items-center gap-3 glass-card px-3 py-1.5 rounded-lg">
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
              <button onClick={logoutUser} className="text-rose-400 hover:underline font-medium">
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/login" 
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-md shadow-blue-600/20"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}

          {/* Indicador de Conexión */}
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg text-xs">
            {healthStatus ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                API OK
              </span>
            ) : healthError ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Error API
              </span>
            ) : (
              <span className="text-amber-400">Cargando API...</span>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal / Tablero con Glassmorfismo */}
      <div className="flex-1 p-6 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            Cargando tablero desde Flask...
          </div>
        ) : error ? (
          <div className="glass-panel border-rose-800/50 text-rose-200 p-6 rounded-xl max-w-xl mx-auto my-12 text-center">
            <h3 className="font-semibold text-lg mb-2">No se pudo cargar el tablero #{boardId}</h3>
            <p className="text-sm opacity-80 mb-4">{error}</p>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-semibold inline-block shadow-md shadow-blue-600/20"
            >
              Volver a la vista principal
            </Link>
          </div>
        ) : (
          <div className="flex items-start gap-6">
            <div className="w-full max-w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  📋 {board?.title || `Tablero #${boardId}`}
                </h2>
                <span className="text-xs text-slate-300 glass-card px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                  💡 Arrastra y suelta tarjetas entre listas para organizarlas
                </span>
              </div>

              {/* Columnas / Listas con Glassmorfismo */}
              <div className="flex items-start gap-5 overflow-x-auto pb-6">
                {board?.lists.map((list) => {
                  const isDragOver = dragOverListId === list.id;
                  return (
                    <div 
                      key={list.id} 
                      onDragOver={(e) => handleDragOverList(e, list.id)}
                      onDragLeave={handleDragLeaveList}
                      onDrop={(e) => handleDropOnList(e, list.id)}
                      className={`w-80 flex-shrink-0 rounded-2xl p-4 shadow-2xl flex flex-col max-h-[calc(100vh-220px)] transition-all ${
                        isDragOver
                          ? 'glass-panel border-blue-500 ring-2 ring-blue-500/50 scale-[1.01]'
                          : 'glass-panel'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
                          {list.title}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full glass-card text-slate-300 font-mono">
                          {list.cards.length}
                        </span>
                      </div>

                      {/* Tarjetas con Glassmorfismo y Draggable */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1 min-h-[100px]">
                        {list.cards.map((card) => {
                          const isDragging = draggingCardId === card.id;
                          return (
                            <div 
                              key={card.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, card)}
                              onDragEnd={() => setDraggingCardId(null)}
                              className={`glass-card-item hover:border-white/30 p-3.5 rounded-xl shadow-md transition group cursor-grab active:cursor-grabbing ${
                                isDragging ? 'opacity-30 border-dashed border-blue-400' : ''
                              }`}
                            >
                              <p className="text-sm text-slate-100 font-medium select-none">{card.title}</p>
                              {card.description && (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2 select-none">{card.description}</p>
                              )}
                            </div>
                          );
                        })}

                        {list.cards.length === 0 && (
                          <div className="h-20 border-2 border-dashed border-slate-700/60 rounded-xl flex items-center justify-center text-xs text-slate-500 italic">
                            {isDragOver ? 'Suelta la tarjeta aquí' : 'Arrastra una tarjeta aquí'}
                          </div>
                        )}
                      </div>

                      {/* Formulario para añadir Tarjeta */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                        <input
                          type="text"
                          placeholder="Nueva tarjeta..."
                          value={newCardTitles[list.id] || ''}
                          onChange={(e) => setNewCardTitles({ ...newCardTitles, [list.id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateCard(list.id)}
                          className="flex-1 glass-input rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleCreateCard(list.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-md shadow-blue-600/20"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Formulario para Crear Nueva Lista */}
                <form 
                  onSubmit={handleCreateList} 
                  className="w-72 flex-shrink-0 glass-panel border-dashed border-slate-700/80 rounded-2xl p-4"
                >
                  <input
                    type="text"
                    placeholder="+ Título de nueva lista"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full glass-input rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 mb-2"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingList}
                    className="w-full glass-card hover:bg-slate-700/80 text-slate-200 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    {isSubmittingList ? 'Creando...' : 'Añadir Lista'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal con Fondo Oscurecido y Glassmorfismo */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsAddUserModalOpen(false)}
          ></div>

          <div className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl space-y-4 border border-white/10">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-blue-400 flex items-center gap-2">
                👤 Agregar Usuario al Tablero #{boardId}
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold w-7 h-7 rounded-full glass-card flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {userMsg && (
              <div
                className={`text-xs p-3 rounded-xl text-center ${
                  userMsg.type === 'success'
                    ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/70 border border-rose-800 text-rose-200'
                }`}
              >
                {userMsg.text}
              </div>
            )}

            {isLoadingUsers ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                Cargando usuarios...
              </div>
            ) : (
              <form onSubmit={handleCreateBoardUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Selecciona el usuario que deseas agregar:
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full glass-input rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">
                      -- Seleccionar usuario --
                    </option>
                    {usuariosDisponibles.map((u) => (
                      <option value={u.id} key={u.id} className="bg-slate-800 text-white">
                        @{u.username} ({u.nombre} {u.apellido || ''})
                      </option>
                    ))}
                  </select>

                  {usuariosDisponibles.length === 0 && (
                    <p className="text-[11px] text-amber-400 mt-2">
                      No hay otros usuarios registrados disponibles para invitar.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingUser || !selectedUserId}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
                  >
                    {isSubmittingUser ? 'Agregando...' : 'Agregar al Tablero'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="glass-card hover:bg-slate-700/80 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { trelloApi } from '@/services/api';

export default function UserProfilePage() {
  const { user, logoutUser, updateCurrentUser } = useAuth();

  // Estado para editar perfil
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [apellido, setApellido] = useState(user?.apellido || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado para cambiar contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <div className="glass-panel border-slate-700/80 rounded-2xl p-8 max-w-md mx-auto my-12 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-bold text-white">Sesión no iniciada</h2>
        <p className="text-xs text-slate-400">
          Debes iniciar sesión para ver y gestionar la información de tu perfil.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-semibold transition shadow-md shadow-blue-600/20"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="glass-card hover:bg-slate-700/80 text-slate-200 text-xs px-4 py-2 rounded-lg font-semibold transition"
          >
            Registrarse
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    setIsUpdatingProfile(true);
    try {
      const updated = await trelloApi.updateProfile(user.id, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });

      updateCurrentUser(updated);
      setProfileMsg({ type: 'success', text: 'Perfil actualizado con éxito.' });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al actualizar perfil.',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'Todos los campos son obligatorios.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await trelloApi.changePassword(user.id, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordMsg({ type: 'success', text: res.message || 'Contraseña cambiada exitosamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al cambiar la contraseña.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tarjeta Principal de Resumen de Perfil con Glassmorfismo */}
      <div className="glass-panel border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 border-2 border-blue-400 flex items-center justify-center font-bold text-2xl text-white shadow-md shadow-blue-600/30">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {user.nombre} {user.apellido}
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/60 backdrop-blur-md">
                @{user.username}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{user.mail}</p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
              <span>Rol: <strong className="text-slate-200 uppercase">{user.rol || 'user'}</strong></span>
              <span>•</span>
              <span>Miembro desde: <strong className="text-slate-200">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Reciente'}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={logoutUser}
          className="glass-card hover:bg-rose-950/80 text-rose-300 border-rose-800/60 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md"
        >
          🚪 Cerrar Sesión
        </button>
      </div>

      {/* Grid de Edición: Datos de Perfil y Cambio de Contraseña */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Formulario 1: Editar Datos Personales */}
        <div className="glass-panel border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4">
          <h3 className="text-base font-semibold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            ✏️ Editar Información Personal
          </h3>

          {profileMsg && (
            <div
              className={`text-xs p-3 rounded-lg text-center ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-200'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nombre:</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full glass-input rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Apellido:</label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className="w-full glass-input rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">URL de Imagen de Perfil (Avatar):</label>
              <input
                type="url"
                placeholder="https://ejemplo.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full glass-input rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Correo Electrónico (No editable):</label>
              <input
                type="email"
                value={user.mail || ''}
                disabled
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 mt-2 shadow-md shadow-blue-600/20"
            >
              {isUpdatingProfile ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Formulario 2: Cambiar Contraseña */}
        <div className="glass-panel border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4">
          <h3 className="text-base font-semibold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            🔑 Cambiar Contraseña
          </h3>

          {passwordMsg && (
            <div
              className={`text-xs p-3 rounded-lg text-center ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-200'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Contraseña Actual (*):</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full glass-input rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Nueva Contraseña (*):</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full glass-input rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Confirmar Nueva Contraseña (*):</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="w-full glass-input rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 mt-2 shadow-md shadow-emerald-600/20"
            >
              {isChangingPassword ? 'Cambiando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

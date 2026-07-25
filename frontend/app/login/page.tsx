'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trelloApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Por favor ingresa tu nombre de usuario o correo y contraseña.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await trelloApi.login({
        username: username.trim(),
        password,
      });

      loginUser(response.user);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Esfera brillante trasera */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Encabezado */}
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold text-blue-400">Iniciar Sesión</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingresa a tu cuenta para administrar tus tableros
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl text-center relative z-10">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs relative z-10">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Nombre de Usuario o Correo (*):</label>
            <input
              type="text"
              placeholder="juanperez o juan@ejemplo.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full glass-input rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Contraseña (*):</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full glass-input rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 mt-2 text-sm shadow-lg shadow-blue-600/30"
          >
            {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Pie con enlace a registro */}
        <div className="text-center pt-2 border-t border-white/10 text-xs text-slate-400 relative z-10">
          ¿No tienes una cuenta aún?{' '}
          <Link href="/register" className="text-blue-400 hover:underline font-medium">
            Regístrate aquí
          </Link>
        </div>

      </div>
    </div>
  );
}

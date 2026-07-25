'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trelloApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [username, setUsername] = useState('');
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !apellido.trim() || !username.trim() || !mail.trim() || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newUser = await trelloApi.register({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        username: username.trim(),
        mail: mail.trim(),
        password,
      });

      loginUser(newUser);
      router.push('/user');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al registrar la cuenta.');
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
          <h1 className="text-2xl font-bold text-blue-400">Crear Cuenta</h1>
          <p className="text-xs text-slate-400 mt-1">
            Regístrate para acceder al gestor de tableros de Trello
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nombre (*):</label>
              <input
                type="text"
                placeholder="Juan"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full glass-input rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Apellido (*):</label>
              <input
                type="text"
                placeholder="Pérez"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className="w-full glass-input rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Nombre de usuario (*):</label>
            <input
              type="text"
              placeholder="juanperez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Correo Electrónico (*):</label>
            <input
              type="email"
              placeholder="juan@ejemplo.com"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              required
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
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
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Confirmación de Contraseña (*):</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 mt-2 text-sm shadow-lg shadow-blue-600/30"
          >
            {isSubmitting ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        {/* Pie con enlace a login */}
        <div className="text-center pt-2 border-t border-white/10 text-xs text-slate-400 relative z-10">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-blue-400 hover:underline font-medium">
            Iniciar Sesión
          </Link>
        </div>

      </div>
    </div>
  );
}

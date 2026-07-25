'use client';

import { trelloApi } from "@/services/api";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CreateTablero() {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    const { user } = useAuth();
    const router = useRouter();

    const Create = async () => {
        if (!title.trim()) {
            setMessage({ type: 'error', text: 'Por favor ingresa un título para el tablero' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const newBoard = await trelloApi.createBoard(title.trim(), user?.id);
            setMessage({ type: 'success', text: `¡Tablero "${newBoard.title}" creado con éxito!` });
            setTitle('');
            
            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (e) {
            console.error("Se produjo un error al crear el tablero: ", e);
            setMessage({ 
                type: 'error', 
                text: e instanceof Error ? e.message : 'Error al crear el tablero' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="flex flex-col justify-center w-full relative z-10">
                    <div className="font-bold text-xl py-2 border-b border-white/10 mb-4 flex justify-between items-center">
                        <h1 className="text-blue-400">Crear Tablero</h1>
                        {user && (
                            <span className="text-xs text-slate-300 font-normal glass-card px-2.5 py-1 rounded-lg">
                                Creador: @{user.username}
                            </span>
                        )}
                    </div>

                    {message && (
                        <div className={`text-xs p-3 rounded-xl mb-4 text-center ${
                            message.type === 'success' ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-800' : 'bg-rose-950/60 text-rose-200 border border-rose-800'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="py-2 space-y-2">
                        <p className="font-semibold text-sm text-slate-300">Ingresa el título del tablero (*)</p>
                        <input 
                            className="w-full glass-input rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && Create()}
                            type="text" 
                            placeholder="ej. Proyecto Trello"
                        />
                    </div>

                    <div className="py-4 flex gap-3">
                        <button 
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition shadow-lg shadow-blue-600/30 disabled:opacity-50" 
                            type="button" 
                            disabled={loading}
                            onClick={Create}
                        >
                            {loading ? 'Creando...' : 'Crear Tablero'}
                        </button>

                        <button 
                            className="glass-card hover:bg-slate-700/80 text-slate-300 font-semibold rounded-xl px-4 py-2.5 text-sm transition" 
                            type="button" 
                            onClick={() => router.push('/')}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TableroPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la página principal de bienvenida donde se listan los tableros
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen text-slate-400 text-xs">
      Redirigiendo a tus tableros...
    </div>
  );
}

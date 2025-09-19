'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Sempre redirecionar para login como primeira tela
    router.push('/login');
  }, [router]);

  // Página de loading enquanto redireciona
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">PagTracker v4.0</h2>
        <p className="text-gray-600">Redirecionando para login...</p>
      </div>
    </div>
  );
}

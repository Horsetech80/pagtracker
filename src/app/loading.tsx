export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Carregando PagTracker...
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Aguarde enquanto preparamos tudo para você
        </p>
      </div>
    </div>
  );
} 
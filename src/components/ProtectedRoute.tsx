import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthorization } from "../context/AuthorizationContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAuthorized, isLoading: authzLoading, permissions } = useAuthorization();

  // Mientras se verifica la autenticación o autorización, mostrar spinner
  if (isLoading || authzLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading ? "Verificando autenticación..." : "Verificando permisos..."}
          </p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero no autorizado (solo después de cargar)
  if (!authzLoading && !isAuthorized) {
    // Si el usuario está inactivo, redirigir a account-disabled
    if (permissions?.user?.status === "inactive") {
      return <Navigate to="/account-disabled" replace />;
    }
    // Si no tiene permisos Y ya terminó de cargar, redirigir a unauthorized
    // IMPORTANTE: Solo redirigir si permissions es null (no se encontraron permisos)
    if (!permissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
}

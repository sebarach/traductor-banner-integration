import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { createApiClient } from "../utils/apiClient";
import { useMsal } from "@azure/msal-react";
import type { UserPermissions } from "../types/auth";

interface AuthorizationContextType {
  permissions: UserPermissions | null;
  isLoading: boolean;
  isAuthorized: boolean;
  error: string | null;
  hasTabAccess: (tabCode: "integrations" | "users-roles") => boolean;
  canAccessIntegrations: () => boolean;
  canManageUsers: () => boolean;
  isAdmin: () => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthorizationContext = createContext<
  AuthorizationContextType | undefined
>(undefined);

export function AuthorizationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { instance } = useMsal();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    if (!user || !user.email) {
      setPermissions(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("🔍 DEBUG - Email del usuario:", user.email);
      console.log("🔍 DEBUG - Usuario completo:", user);

      const apiClient = createApiClient(instance);
      const data = await apiClient.get<UserPermissions>(
        `/auth/user-profile?email=${encodeURIComponent(user.email)}`
      );

      console.log("✅ DEBUG - Permisos recibidos:", data);
      setPermissions(data);
    } catch (err: any) {
      console.error("❌ Error loading permissions:", err);
      console.error("❌ Detalles del error:", err.details);
      setError(err.message || "Error al cargar permisos");
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPermissions();
    } else {
      setPermissions(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  const hasTabAccess = (tabCode: "integrations" | "users-roles"): boolean => {
    if (!permissions || !permissions.permissions) return false;
    return tabCode in permissions.permissions;
  };

  const canAccessIntegrations = (): boolean => {
    if (!permissions || !permissions.permissions) return false;
    return "integrations" in permissions.permissions;
  };

  const canManageUsers = (): boolean => {
    if (!permissions || !permissions.permissions) return false;
    return permissions.permissions["users-roles"] === "WRITE";
  };

  const isAdmin = (): boolean => {
    if (!permissions || !permissions.user) return false;
    return permissions.user.roleId === 1;
  };

  const refreshPermissions = async () => {
    await loadPermissions();
  };

  const value: AuthorizationContextType = {
    permissions,
    isLoading,
    isAuthorized: !!permissions && permissions.user.status === "active",
    error,
    hasTabAccess,
    canAccessIntegrations,
    canManageUsers,
    isAdmin,
    refreshPermissions,
  };

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuthorization() {
  const context = useContext(AuthorizationContext);
  if (context === undefined) {
    throw new Error(
      "useAuthorization must be used within an AuthorizationProvider"
    );
  }
  return context;
}

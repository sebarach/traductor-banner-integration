import { useState, useEffect, useMemo } from "react";
import { useMsal } from "@azure/msal-react";
import { createApiClient } from "../utils/apiClient";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserManagementTab } from "@/components/users-roles/UserManagementTab";
import { RolesPermissionsTab } from "@/components/users-roles/RolesPermissionsTab";
import { useAuthorization } from "@/context/AuthorizationContext";
import type { UserWithRole, RoleWithStats, Module } from "@/types/auth";
import {
  Shield,
  Users,
  UserCheck,
  Layers,
  AlertCircle,
} from "lucide-react";

export default function UsersRoles() {
  const { instance } = useMsal();
  const { isLoading: authLoading } = useAuthorization();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<RoleWithStats[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiClient = createApiClient(instance);

      const [usersData, rolesData, modulesData] = await Promise.all([
        apiClient.get<UserWithRole[]>("/auth/users"),
        apiClient.get<RoleWithStats[]>("/auth/roles"),
        apiClient.get<Module[]>("/auth/modules"),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
      setModules(modulesData);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
      console.error("Error loading users/roles:", err);
    } finally {
      setLoading(false);
    }
  };

  // Estadisticas
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === "active").length;
    const totalRoles = roles.length;

    return {
      totalUsers,
      activeUsers,
      totalRoles,
    };
  }, [users, roles]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Verificando permisos..." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Cargando gestion de usuarios..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadisticas */}
      <PageHeader
        title="Gestion de Usuarios y Roles"
        description="Control de acceso y permisos del sistema"
        icon={<Shield className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: "Total Usuarios",
            value: stats.totalUsers,
            icon: <Users className="h-5 w-5" />,
          },
          {
            label: "Roles Definidos",
            value: stats.totalRoles,
            icon: <Shield className="h-5 w-5" />,
          },
          {
            label: "Usuarios Activos",
            value: stats.activeUsers,
            icon: <UserCheck className="h-5 w-5" />,
          },
        ]}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Card className="overflow-hidden shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/20 px-6 py-3"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/20 px-6 py-3"
            >
              <Layers className="h-4 w-4 mr-2" />
              Roles y Permisos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="p-6">
            <UserManagementTab
              users={users}
              roles={roles}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="roles" className="p-6">
            <RolesPermissionsTab
              roles={roles}
              modules={modules}
              onRefresh={loadData}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

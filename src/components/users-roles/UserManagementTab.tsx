import { useState, useMemo } from "react";
import { useMsal } from "@azure/msal-react";
import type { ColumnDef } from "@tanstack/react-table";
import { createApiClient } from "@/utils/apiClient";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserDialog } from "./UserDialog";
import { useToast } from "@/hooks/use-toast";
import type { UserWithRole, Role } from "@/types/auth";
import {
  UserPlus,
  MoreVertical,
  Edit,
  UserCheck,
  UserX,
} from "lucide-react";

interface UserManagementTabProps {
  users: UserWithRole[];
  roles: Role[];
  onRefresh: () => Promise<void>;
}

export function UserManagementTab({
  users,
  roles,
  onRefresh,
}: UserManagementTabProps) {
  const { instance } = useMsal();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);

  const handleCreateUser = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (user: UserWithRole) => {
    const newStatus = user.status === "active" ? "inactive" : "active";

    try {
      const apiClient = createApiClient(instance);
      await apiClient.put(`/auth/users/${user.userId}`, {
        status: newStatus,
        updatedBy: "system",
      });

      toast({
        title: "Usuario actualizado",
        description: `El usuario ha sido ${newStatus === "active" ? "activado" : "desactivado"}.`,
      });

      await onRefresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = useMemo<ColumnDef<UserWithRole>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: "Usuario",
        cell: (info) => (
          <div>
            <div className="font-medium text-foreground">
              {info.getValue() as string}
            </div>
            <div className="text-xs text-muted-foreground">
              {info.row.original.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role.roleName",
        header: "Rol",
        cell: (info) => (
          <Badge
            variant="outline"
            className="border-indigo-500/50 text-indigo-600 dark:text-indigo-400"
          >
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: (info) => {
          const status = info.getValue() as string;
          const variants: Record<string, string> = {
            active: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400",
            inactive: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400",
            suspended: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400",
          };

          return (
            <Badge variant="outline" className={variants[status]}>
              {status === "active" ? "Activo" : status === "inactive" ? "Inactivo" : "Suspendido"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Fecha de Creación",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue() as string)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: (info) => {
          const user = info.row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar rol
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                  {user.status === "active" ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activar
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Usuarios del Sistema
        </h3>
        <p className="text-sm text-muted-foreground">
          Gestiona los usuarios que tienen acceso al sistema mediante Azure AD SSO
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Buscar por correo o nombre..."
        pageSize={10}
        headerActions={
          <Button
            onClick={handleCreateUser}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        }
      />

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        roles={roles}
        onSuccess={onRefresh}
      />
    </div>
  );
}

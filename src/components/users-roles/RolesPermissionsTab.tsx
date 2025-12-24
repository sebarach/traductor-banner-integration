import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleDialog } from "./RoleDialog";
import type { RoleWithStats, Module, RoleWithPermissions, UserWithRole } from "@/types/auth";
import {
  Shield,
  ShieldPlus,
  Edit,
  Users as UsersIcon,
  Layers,
  Calendar,
  GraduationCap,
  FileText,
  Building,
  Users,
  User,
} from "lucide-react";

interface RolesPermissionsTabProps {
  roles: RoleWithStats[];
  modules: Module[];
  rolesPermissions: RoleWithPermissions[];
  users: UserWithRole[];
  onRefresh: () => Promise<void>;
}

export function RolesPermissionsTab({
  roles,
  modules,
  rolesPermissions,
  users,
  onRefresh,
}: RolesPermissionsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithStats | null>(null);

  const handleCreateRole = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const handleEditRole = (role: RoleWithStats) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Calendar,
      GraduationCap,
      FileText,
      Building,
      Users,
      User,
    };
    const Icon = icons[iconName] || Layers;
    return <Icon className="h-5 w-5" />;
  };

  const getRoleColor = (roleId: number) => {
    const colors = [
      "from-blue-500 to-indigo-500",
      "from-violet-500 to-purple-500",
      "from-emerald-500 to-green-500",
      "from-amber-500 to-orange-500",
    ];
    return colors[(roleId - 1) % colors.length];
  };

  const getUserCountByRole = (roleId: number) => {
    return users.filter(user => user.roleId === roleId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Roles del Sistema
          </h3>
          <p className="text-sm text-muted-foreground">
            Define roles y asigna los módulos que cada rol puede acceder
          </p>
        </div>
        <Button
          onClick={handleCreateRole}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <ShieldPlus className="h-4 w-4 mr-2" />
          Nuevo Rol
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card
            key={role.roleId}
            className="hover:shadow-lg transition-shadow border-border/70"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div
                  className={`rounded-2xl p-3 text-white shadow-lg bg-gradient-to-br ${getRoleColor(role.roleId)}`}
                >
                  <Shield className="h-6 w-6" />
                </div>
                {!role.isSystemRole && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardTitle className="text-xl mt-4">{role.roleName}</CardTitle>
              {role.roleDescription && (
                <p className="text-sm text-muted-foreground mt-1">
                  {role.roleDescription}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <span>
                    {rolesPermissions.find(rp => rp.roleId === role.roleId)?.modules.length || 0} módulos asignados
                  </span>
                </div>
              </div>

              {/* Módulos Permitidos */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Módulos con Acceso:
                </p>
                <div className="flex flex-wrap gap-2">
                  {rolesPermissions
                    .find(rp => rp.roleId === role.roleId)
                    ?.modules.map((module) => (
                      <div
                        key={module.moduleId}
                        className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 border border-border/50"
                      >
                        <div className="text-blue-600 dark:text-blue-400">
                          {getIconComponent(
                            modules.find(m => m.moduleId === module.moduleId)?.iconName || "Layers"
                          )}
                        </div>
                        <span className="text-xs font-medium">
                          {module.moduleName}
                        </span>
                        <div className="flex gap-1">
                          {module.permissions.map((perm, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={
                                perm === "WRITE"
                                  ? "text-xs border-green-500/50 text-green-600 dark:text-green-400 h-5"
                                  : "text-xs border-blue-500/50 text-blue-600 dark:text-blue-400 h-5"
                              }
                            >
                              {perm === "WRITE" ? "RW" : "R"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )) || (
                    <p className="text-xs text-muted-foreground italic">
                      Sin módulos asignados
                    </p>
                  )}
                </div>
              </div>

              {/* User count */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {getUserCountByRole(role.roleId)} {getUserCountByRole(role.roleId) === 1 ? "usuario asignado" : "usuarios asignados"}
                </span>
              </div>

              {role.isSystemRole && (
                <Badge variant="outline" className="w-full justify-center">
                  Rol del Sistema
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Módulos Disponibles */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Módulos del Sistema
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Todos los módulos disponibles para asignar a roles
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules
            .filter((m) => m.isActive)
            .map((module) => (
              <Card key={module.moduleId} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-900/20 p-2.5 text-blue-600 dark:text-blue-400">
                    {getIconComponent(module.iconName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {module.moduleName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {module.moduleDescription}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>

      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={editingRole}
        modules={modules}
        onSuccess={onRefresh}
      />
    </div>
  );
}

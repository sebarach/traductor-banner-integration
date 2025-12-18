import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { createApiClient } from "@/utils/apiClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { RoleWithStats, Module, PermissionType } from "@/types/auth";
import { Layers } from "lucide-react";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleWithStats | null;
  modules: Module[];
  onSuccess: () => Promise<void>;
}

export function RoleDialog({
  open,
  onOpenChange,
  role,
  modules,
  onSuccess,
}: RoleDialogProps) {
  const { instance } = useMsal();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    roleName: "",
    roleDescription: "",
  });
  const [permissions, setPermissions] = useState<
    Record<string, PermissionType | null>
  >({});

  useEffect(() => {
    if (role) {
      setFormData({
        roleName: role.roleName,
        roleDescription: role.roleDescription || "",
      });

      const perms: Record<string, PermissionType | null> = {};
      modules.forEach((module) => {
        const perm = role.permissions.find(
          (p) => p.moduleCode === module.moduleCode
        );
        perms[module.moduleCode] = perm ? perm.permissionType : null;
      });
      setPermissions(perms);
    } else {
      setFormData({
        roleName: "",
        roleDescription: "",
      });
      const perms: Record<string, PermissionType | null> = {};
      modules.forEach((module) => {
        perms[module.moduleCode] = null;
      });
      setPermissions(perms);
    }
  }, [role, modules]);

  const handleToggleModule = (moduleCode: string, checked: boolean) => {
    setPermissions({
      ...permissions,
      [moduleCode]: checked ? "READ" : null,
    });
  };

  const handlePermissionTypeChange = (
    moduleCode: string,
    type: PermissionType
  ) => {
    setPermissions({
      ...permissions,
      [moduleCode]: type,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roleName) {
      toast({
        title: "Error",
        description: "El nombre del rol es requerido",
        variant: "destructive",
      });
      return;
    }

    const selectedPermissions = Object.entries(permissions)
      .filter(([_, type]) => type !== null)
      .map(([moduleCode, permissionType]) => ({
        moduleCode,
        permissionType: permissionType as PermissionType,
      }));

    if (selectedPermissions.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un módulo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const apiClient = createApiClient(instance);

      if (role) {
        // Editar rol existente
        await apiClient.put(`/auth/roles/${role.roleId}`, {
          roleName: formData.roleName,
          roleDescription: formData.roleDescription || undefined,
          permissions: selectedPermissions,
        });

        toast({
          title: "Rol actualizado",
          description: "El rol ha sido actualizado correctamente",
        });
      } else {
        // Crear nuevo rol
        await apiClient.post("/auth/roles", {
          roleName: formData.roleName,
          roleDescription: formData.roleDescription || undefined,
          permissions: selectedPermissions,
        });

        toast({
          title: "Rol creado",
          description: "El rol ha sido creado correctamente",
        });
      }

      await onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo guardar el rol",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = Object.values(permissions).filter((p) => p !== null)
    .length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Modifica el nombre y permisos del rol"
              : "Crea un nuevo rol y asigna los módulos que puede acceder"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roleName">
                Nombre del Rol <span className="text-red-500">*</span>
              </Label>
              <Input
                id="roleName"
                type="text"
                placeholder="Ej: Coordinador Administrativo"
                value={formData.roleName}
                onChange={(e) =>
                  setFormData({ ...formData, roleName: e.target.value })
                }
                disabled={loading || (role?.isSystemRole ?? false)}
                required
              />
              {role?.isSystemRole && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  No se puede modificar el nombre de roles del sistema
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="roleDescription">Descripción (opcional)</Label>
              <Input
                id="roleDescription"
                type="text"
                placeholder="Descripción breve del rol"
                value={formData.roleDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roleDescription: e.target.value,
                  })
                }
                disabled={loading}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">
                  Módulos y Permisos <span className="text-red-500">*</span>
                </Label>
                <Badge variant="secondary">
                  {selectedCount} módulo{selectedCount !== 1 ? "s" : ""}{" "}
                  seleccionado{selectedCount !== 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona los módulos y define si el rol tiene permisos de
                solo lectura (R) o lectura y escritura (RW)
              </p>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {modules.map((module) => {
                  const hasAccess = permissions[module.moduleCode] !== null;
                  const permType = permissions[module.moduleCode];

                  return (
                    <div
                      key={module.moduleId}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`module-${module.moduleCode}`}
                        checked={hasAccess}
                        onCheckedChange={(checked) =>
                          handleToggleModule(
                            module.moduleCode,
                            checked as boolean
                          )
                        }
                        disabled={loading}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`module-${module.moduleCode}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {module.moduleName}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {module.moduleDescription}
                        </p>

                        {hasAccess && (
                          <RadioGroup
                            value={permType || "READ"}
                            onValueChange={(value) =>
                              handlePermissionTypeChange(
                                module.moduleCode,
                                value as PermissionType
                              )
                            }
                            className="flex gap-4 mt-2"
                            disabled={loading}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="READ" id={`${module.moduleCode}-read`} />
                              <Label htmlFor={`${module.moduleCode}-read`} className="text-xs cursor-pointer">
                                Solo Lectura (R)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="WRITE" id={`${module.moduleCode}-write`} />
                              <Label htmlFor={`${module.moduleCode}-write`} className="text-xs cursor-pointer">
                                Lectura y Escritura (RW)
                              </Label>
                            </div>
                          </RadioGroup>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? "Guardando..." : role ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

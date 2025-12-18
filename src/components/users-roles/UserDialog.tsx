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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { UserWithRole, Role } from "@/types/auth";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
  roles: Role[];
  onSuccess: () => Promise<void>;
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSuccess,
}: UserDialogProps) {
  const { instance } = useMsal();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    roleId: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        displayName: user.displayName,
        roleId: user.roleId.toString(),
        status: user.status as "active" | "inactive",
      });
    } else {
      setFormData({
        email: "",
        displayName: "",
        roleId: "",
        status: "active",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.displayName || !formData.roleId) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const apiClient = createApiClient(instance);

      if (user) {
        // Editar usuario existente
        await apiClient.put(`/auth/users/${encodeURIComponent(user.email)}`, {
          roleId: parseInt(formData.roleId),
          status: formData.status,
        });

        toast({
          title: "Usuario actualizado",
          description: "El usuario ha sido actualizado correctamente",
        });
      } else {
        // Crear nuevo usuario
        await apiClient.post("/auth/users", {
          email: formData.email,
          displayName: formData.displayName,
          roleId: parseInt(formData.roleId),
          status: formData.status,
        });

        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado correctamente",
        });
      }

      await onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo guardar el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Modifica el rol y estado del usuario"
              : "Agrega un nuevo usuario al sistema. Debe tener una cuenta de Azure AD válida."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">
                Correo Electrónico <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@uai.cl"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!!user || loading}
                required
              />
              {!user && (
                <p className="text-xs text-muted-foreground">
                  El usuario debe existir en Azure AD
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="displayName">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Nombre completo del usuario"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                disabled={!!user || loading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">
                Rol <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) =>
                  setFormData({ ...formData, roleId: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem
                      key={role.roleId}
                      value={role.roleId.toString()}
                    >
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? "Guardando..." : user ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

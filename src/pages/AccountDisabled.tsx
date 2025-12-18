import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserX, Home, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AccountDisabled() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-black flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-6">
              <UserX className="h-16 w-16 text-orange-600 dark:text-orange-500" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Cuenta Desactivada
            </h1>
            <p className="text-lg text-muted-foreground">
              Tu cuenta ha sido desactivada temporalmente
            </p>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}

          {/* Message */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-3 text-left">
            <p className="text-sm text-muted-foreground">
              Tu cuenta ha sido desactivada y no puedes acceder al sistema en
              este momento.
            </p>
            <p className="text-sm text-muted-foreground">
              Esto puede deberse a:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
              <li>Desactivación temporal por el administrador</li>
              <li>Cambio de rol o permisos pendiente</li>
              <li>Políticas de seguridad de la organización</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "mailto:soporte@uai.cl"}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contactar administrador
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              Para reactivar tu cuenta, contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Home, Mail } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-black flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
              <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-500" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Acceso No Autorizado
            </h1>
            <p className="text-lg text-muted-foreground">
              No tienes permisos para acceder al sistema
            </p>
          </div>

          {/* Message */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-3 text-left">
            <p className="text-sm text-muted-foreground">
              Tu cuenta ha sido autenticada correctamente, pero no tienes
              autorización para usar este sistema.
            </p>
            <p className="text-sm text-muted-foreground">
              Posibles razones:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
              <li>Tu correo electrónico no está registrado en el sistema</li>
              <li>Tu cuenta está pendiente de activación</li>
              <li>No se te han asignado permisos aún</li>
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
              Contactar soporte
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              Si crees que esto es un error, contacta al administrador del
              sistema con tu correo electrónico para solicitar acceso.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

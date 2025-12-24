import { useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import AcademicPeriods from "./AcademicPeriods";
import AcademicLevels from "./AcademicLevels";
import ProgramRules from "./ProgramRules";
import Buildings from "./Buildings";
import Persons from "./Persons";
import Instructors from "./Instructors";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createApiClient } from "@/utils/apiClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Link2,
  Layers,
  FileText,
  Building,
  Users,
  GraduationCap,
  Search,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

type IntegrationModuleConfig = {
  value: string;
  title: string;
  description: string;
  status: "active" | "inactive";
  accent: string;
  icon: LucideIcon;
  component: () => JSX.Element;
};

const integrationModules: IntegrationModuleConfig[] = [
  {
    value: "academic-periods",
    title: "Periodos Academicos",
    description: "Sistema de Gestion Academica Universitaria",
    status: "active",
    accent: "from-blue-500 to-indigo-500",
    icon: Calendar,
    component: AcademicPeriods,
  },
  {
    value: "academic-levels",
    title: "Niveles Academicos",
    description: "Gestion de niveles educativos y programas",
    status: "active",
    accent: "from-violet-500 to-purple-500",
    icon: GraduationCap,
    component: AcademicLevels,
  },
  {
    value: "program-rules",
    title: "Reglas de Programas",
    description: "Configuracion de reglas y requisitos academicos",
    status: "active",
    accent: "from-pink-500 to-rose-500",
    icon: FileText,
    component: ProgramRules,
  },
  {
    value: "buildings",
    title: "Edificios",
    description: "Gestion de infraestructura y espacios fisicos",
    status: "active",
    accent: "from-cyan-500 to-sky-500",
    icon: Building,
    component: Buildings,
  },
  {
    value: "persons",
    title: "Personas",
    description: "Base de datos de estudiantes y personal",
    status: "active",
    accent: "from-emerald-500 to-green-500",
    icon: Users,
    component: Persons,
  },
  {
    value: "instructors",
    title: "Instructores",
    description: "Gestion de docentes y asignaciones",
    status: "active",
    accent: "from-amber-500 to-orange-500",
    icon: GraduationCap,
    component: Instructors,
  },
];

export default function BannerIntegrations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(integrationModules[0]?.value || "");
  const [showGrid, setShowGrid] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { instance } = useMsal();

  const filteredModules = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return integrationModules;

    return integrationModules.filter((module) => {
      return (
        module.title.toLowerCase().includes(normalizedSearch) ||
        module.description.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchTerm]);

  const activeModules = integrationModules.filter(
    (module) => module.status === "active"
  ).length;
  const totalModules = integrationModules.length;
  const activeModule =
    integrationModules.find((module) => module.value === activeTab) ??
    integrationModules[0];
  const ActiveIcon = activeModule?.icon;

  const handleModuleSelect = (value: string) => {
    setActiveTab(value);
    setShowGrid(false);
  };

  const handleModuleClick = (value: string) => {
    if (value === activeTab) {
      setShowGrid(false);
    }
  };

  const handleBackToGrid = () => {
    setShowGrid(true);
  };

  const handleSyncWithBanner = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const apiClient = createApiClient(instance);

      // Mapeo de módulo activo a endpoint de sincronización
      const syncEndpoints: Record<string, string> = {
        "buildings": "/banner/buildings/bulk",
        "academic-periods": "/banner/academic-period/bulk",
        "academic-levels": "/banner/academic-level/bulk",
        "program-rules": "/banner/program-rule/bulk",
        "persons": "/banner/person/bulk",
        "instructors": "/banner/instructor/bulk",
      };

      const endpoint = syncEndpoints[activeTab];

      if (!endpoint) {
        setSyncError("No se encontró endpoint de sincronización para esta integración");
        console.error("No se encontró endpoint de sincronización para:", activeTab);
        return;
      }

      console.log("🔄 Sincronizando con endpoint:", endpoint);
      console.log("📍 Módulo activo:", activeTab);

      // Hacer POST al endpoint de sincronización correspondiente
      await apiClient.post(endpoint, {});

      // Mostrar diálogo de confirmación de éxito
      setShowSyncDialog(true);
    } catch (error: any) {
      console.error("Error al sincronizar con Banner:", error);

      // Mostrar mensaje de error detallado
      let errorMessage = "Error desconocido al sincronizar";

      if (error?.status === 400) {
        errorMessage = "El endpoint de sincronización no está disponible o no acepta esta operación";
      } else if (error?.status === 404) {
        errorMessage = "El endpoint de sincronización no fue encontrado";
      } else if (error?.status === 500) {
        errorMessage = "Error interno del servidor al sincronizar";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setSyncError(errorMessage);
      setShowSyncDialog(true); // Mostrar diálogo con el error
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Integraciones Banner"
        description="Gestion de integraciones con el sistema Banner"
        icon={<Link2 className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: "Modulos Activos",
            value: activeModules,
            icon: <Calendar className="h-5 w-5" />,
          },
          {
            label: "Total Modulos",
            value: totalModules,
            icon: <Layers className="h-5 w-5" />,
          },
          {
            label: "Estado",
            value: "Operativo",
            icon: <Link2 className="h-5 w-5" />,
          },
        ]}
      />

      {/* Diálogo de confirmación */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-full ${syncError ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
                {syncError ? (
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                )}
              </div>
              <DialogTitle className="text-xl">
                {syncError ? "Error en la Sincronización" : "Sincronización Iniciada"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base space-y-3 pt-2">
              {syncError ? (
                <>
                  <p className="font-medium text-foreground">
                    No se pudo iniciar la sincronización con BANNER.
                  </p>
                  <p className="text-red-600 dark:text-red-400 font-medium">
                    {syncError}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Por favor, verifique que el endpoint de sincronización esté configurado correctamente en el backend.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">
                    La sincronización con BANNER ha sido iniciada exitosamente.
                  </p>
                  <p className="text-muted-foreground">
                    Este proceso puede tardar varios minutos en completarse.
                    Por favor, revise los logs del sistema para verificar el estado
                    de la operación.
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowSyncDialog(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs Card */}
      <Card className="overflow-hidden shadow-lg">
        <Tabs
          value={activeTab}
          onValueChange={handleModuleSelect}
          className="w-full">
          {showGrid ? (
            <>
              <div className="border-b border-border/60 px-6 py-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Modulos disponibles
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {activeModules} activos / {totalModules} totales
                    </p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Buscar integraciones..."
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 pt-4">
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  Selecciona una integracion para revisar sus datos o usa el
                  buscador para filtrar modulos.
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4 border-b border-border/60 px-6 py-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-2xl p-3 text-white shadow-inner bg-gradient-to-br ${activeModule.accent}`}>
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase">
                    {activeModule.status === "active"
                      ? "Modulo activo"
                      : "Modulo inactivo"}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {activeModule.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activeModule.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSyncWithBanner}
                  disabled={isSyncing}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Sincronizando..." : "Sincronizar con BANNER"}
                </Button>
                <Button variant="outline" onClick={handleBackToGrid}>
                  Volver a integraciones
                </Button>
              </div>
            </div>
          )}

          {showGrid ? (
            filteredModules.length > 0 ? (
              <TabsList className="!grid !h-auto !items-stretch !justify-start w-full gap-4 bg-transparent px-6 pb-8 pt-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredModules.map((module) => {
                  const Icon = module.icon;
                  const statusClasses =
                    module.status === "active"
                      ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-100 dark:border-blue-500/30"
                      : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

                  return (
                    <TabsTrigger
                      key={module.value}
                      value={module.value}
                      onClick={() => handleModuleClick(module.value)}
                      className="flex h-full w-full flex-col items-start gap-4 rounded-2xl border border-border/70 bg-card px-5 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg data-[state=active]:border-blue-500 data-[state=active]:shadow-xl">
                      <div className="flex w-full items-start justify-between gap-4">
                        <div
                          className={`rounded-2xl p-3 text-white shadow-inner bg-gradient-to-br ${module.accent}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold uppercase ${statusClasses}`}>
                          {module.status === "active" ? "activo" : "inactivo"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-foreground">
                          {module.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No se encontraron integraciones que coincidan con "{searchTerm}
                ".
              </div>
            )
          ) : null}

          {!showGrid && <TabsList className="hidden" />}

          {!showGrid &&
            integrationModules.map((module) => {
              const ModuleContent = module.component;
              return (
                <TabsContent
                  key={module.value}
                  value={module.value}
                  className="border-t border-border/60 p-6">
                  <ModuleContent />
                </TabsContent>
              );
            })}
        </Tabs>
      </Card>
    </div>
  );
}

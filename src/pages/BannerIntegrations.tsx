import { useMemo, useState } from "react";
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
              <Button variant="outline" onClick={handleBackToGrid}>
                Volver a integraciones
              </Button>
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

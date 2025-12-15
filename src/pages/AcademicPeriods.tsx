import { useState, useEffect, useMemo } from "react";
import { useMsal } from "@azure/msal-react";
import type { ColumnDef } from "@tanstack/react-table";
import { createApiClient } from "../utils/apiClient";
import type { AcademicPeriod } from "../types/api";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, AlertCircle } from "lucide-react";

export default function AcademicPeriods() {
  const { instance } = useMsal();
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAcademicPeriods();
  }, []);

  const loadAcademicPeriods = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiClient = createApiClient(instance);
      const data = await apiClient.get<AcademicPeriod[]>(
        "/banner/academic-period"
      );
      setPeriods(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los períodos académicos");
      console.error("Error loading academic periods:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Definir columnas
  const columns = useMemo<ColumnDef<AcademicPeriod>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Código",
        cell: (info) => (
          <Badge
            variant="outline"
            className="border-blue-500/50 text-blue-600 dark:text-blue-400 font-semibold">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: "desc",
        header: "Descripción",
        cell: (info) => (
          <div className="font-medium text-foreground">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "periodDesc",
        header: "Período",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="text-sm font-medium text-foreground">
                {row.periodDesc}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {row.periodGroup}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: "Fecha Inicio",
        cell: (info) => (
          <span className="text-sm text-foreground font-medium">
            {formatDate(info.getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: "endDate",
        header: "Fecha Término",
        cell: (info) => (
          <span className="text-sm text-foreground font-medium">
            {formatDate(info.getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: "trmtDesc",
        header: "Tipo Período",
        cell: (info) => (
          <Badge
            variant="outline"
            className="border-indigo-500/50 text-indigo-600 dark:text-indigo-400">
            {info.getValue() as string}
          </Badge>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Cargando períodos académicos..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold mb-1">Error al cargar datos</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button
            onClick={loadAcademicPeriods}
            variant="outline"
            size="sm"
            className="flex-shrink-0">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Períodos Académicos"
        description="Sistema de Gestión Académica Universitaria"
        icon={<Calendar className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: "Total Registros",
            value: periods.length,
            icon: <Calendar className="h-5 w-5" />,
          },
        ]}
      />

      {/* DataTable con búsqueda y refresh button */}
      <DataTable
        columns={columns}
        data={periods}
        searchPlaceholder="Buscar en todos los campos..."
        pageSize={10}
        headerActions={
          <Button
            onClick={loadAcademicPeriods}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        }
      />
    </div>
  );
}

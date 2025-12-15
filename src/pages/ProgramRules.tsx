import { useState, useEffect, useMemo } from 'react'
import { useMsal } from '@azure/msal-react'
import type { ColumnDef } from '@tanstack/react-table'
import { createApiClient } from '../utils/apiClient'
import type { ProgramRule } from '../types/api'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { BookOpen, RefreshCw, AlertCircle } from 'lucide-react'

export default function ProgramRules() {
  const { instance } = useMsal()
  const [programs, setPrograms] = useState<ProgramRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProgramRules()
  }, [])

  const loadProgramRules = async () => {
    setLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient(instance)
      const data = await apiClient.get<ProgramRule[]>('/banner/program-rule')
      setPrograms(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar las reglas de programas')
      console.error('Error loading program rules:', err)
    } finally {
      setLoading(false)
    }
  }

  // Definir columnas
  const columns = useMemo<ColumnDef<ProgramRule>[]>(
    () => [
      {
        accessorKey: 'program',
        header: 'Código Programa',
        cell: (info) => (
          <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400 font-semibold">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'programDesc',
        header: 'Descripción Programa',
        cell: (info) => (
          <div className="font-medium text-foreground">{info.getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'levlCodeStu',
        header: 'Nivel Estudiante',
        cell: (info) => {
          const row = info.row.original
          return (
            <div>
              <div className="text-sm font-medium text-foreground">{info.getValue() as string}</div>
              <div className="text-xs text-muted-foreground font-medium">{row.levlDesc}</div>
            </div>
          )
        },
      },
      {
        accessorKey: 'campCode',
        header: 'Campus',
        cell: (info) => {
          const row = info.row.original
          return (
            <div>
              <div className="text-sm font-medium text-foreground">{info.getValue() as string}</div>
              <div className="text-xs text-muted-foreground font-medium">{row.campDesc}</div>
            </div>
          )
        },
      },
      {
        accessorKey: 'collCode',
        header: 'Colegio',
        cell: (info) => {
          const row = info.row.original
          return (
            <div>
              <div className="text-sm font-medium text-foreground">{info.getValue() as string}</div>
              <div className="text-xs text-muted-foreground font-medium">{row.collDesc}</div>
            </div>
          )
        },
      },
      {
        accessorKey: 'degcCode',
        header: 'Grado',
        cell: (info) => {
          const row = info.row.original
          return (
            <Badge variant="outline" className="border-indigo-500/50 text-indigo-600 dark:text-indigo-400">
              <div className="text-xs">
                <div>{info.getValue() as string}</div>
                <div className="font-normal">{row.degcDesc}</div>
              </div>
            </Badge>
          )
        },
      },
    ],
    []
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Cargando reglas de programas..." />
      </div>
    )
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
            onClick={loadProgramRules}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Reglas de Programas"
        description="Sistema de Gestión Académica Universitaria"
        icon={<BookOpen className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: 'Total Registros',
            value: programs.length,
            icon: <BookOpen className="h-5 w-5" />
          }
        ]}
      />

      {/* DataTable con búsqueda y refresh button */}
      <DataTable
        columns={columns}
        data={programs}
        searchPlaceholder="Buscar en todos los campos..."
        pageSize={10}
        headerActions={
          <Button
            onClick={loadProgramRules}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        }
      />
    </div>
  )
}

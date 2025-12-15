import { useState, useEffect, useMemo } from 'react'
import { useMsal } from '@azure/msal-react'
import type { ColumnDef } from '@tanstack/react-table'
import { createApiClient } from '../utils/apiClient'
import type { AcademicLevel } from '../types/api'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, RefreshCw, AlertCircle } from 'lucide-react'

export default function AcademicLevels() {
  const { instance } = useMsal()
  const [levels, setLevels] = useState<AcademicLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAcademicLevels()
  }, [])

  const loadAcademicLevels = async () => {
    setLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient(instance)
      const data = await apiClient.get<AcademicLevel[]>('/banner/level')
      setLevels(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los niveles académicos')
      console.error('Error loading academic levels:', err)
    } finally {
      setLoading(false)
    }
  }

  // Definir columnas
  const columns = useMemo<ColumnDef<AcademicLevel>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Código',
        cell: (info) => (
          <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400 font-semibold">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'desc',
        header: 'Descripción',
        cell: (info) => (
          <div className="font-medium text-foreground">{info.getValue() as string}</div>
        ),
      },
    ],
    []
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Cargando niveles académicos..." />
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
            onClick={loadAcademicLevels}
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
        title="Niveles Académicos"
        description="Sistema de Gestión Académica Universitaria"
        icon={<GraduationCap className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: 'Total Registros',
            value: levels.length,
            icon: <GraduationCap className="h-5 w-5" />
          }
        ]}
      />

      {/* DataTable con búsqueda y refresh button */}
      <DataTable
        columns={columns}
        data={levels}
        searchPlaceholder="Buscar niveles académicos..."
        pageSize={10}
        headerActions={
          <Button
            onClick={loadAcademicLevels}
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

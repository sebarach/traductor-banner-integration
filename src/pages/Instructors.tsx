import { useState, useEffect, useMemo, useCallback } from 'react'
import { useMsal } from '@azure/msal-react'
import type { ColumnDef } from '@tanstack/react-table'
import { createApiClient } from '../utils/apiClient'
import type { Instructor } from '../types/api'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { GraduationCap, RefreshCw, AlertCircle, Mail, UserSearch, ArrowLeft, Building2 } from 'lucide-react'

/**
 * Componente de Instructores con búsqueda por Banner ID
 * - Listado completo de instructores
 * - Búsqueda individual por Banner ID
 * - Visualización de departamentos
 */
export default function Instructors() {
  const { instance } = useMsal()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchBannerId, setSearchBannerId] = useState('')
  const [searchMode, setSearchMode] = useState<'browse' | 'search'>('browse')
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    loadInstructors()
  }, [])

  const loadInstructors = async () => {
    setLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient(instance)
      const data = await apiClient.get<Instructor[]>('/banner/instructor')

      console.log('📚 Instructors loaded:', data.length)
      setInstructors(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los instructores')
      console.error('❌ Error loading instructors:', err)
    } finally {
      setLoading(false)
    }
  }

  const searchInstructorByBannerId = useCallback(async () => {
    if (!searchBannerId.trim()) {
      setError('Por favor ingresa un Banner ID')
      return
    }

    setSearchLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient(instance)
      const url = `/banner/instructor/${searchBannerId.trim()}`

      console.log('🔍 Searching instructor by Banner ID:', searchBannerId.trim())

      const instructor = await apiClient.get<Instructor>(url)

      // Si encontró el instructor, mostrarlo en la tabla
      setInstructors([instructor])
      setSearchMode('search')

      console.log('✅ Instructor found:', instructor.bannerId)
    } catch (err: any) {
      if (err.status === 404) {
        setError(`No se encontró ningún instructor con Banner ID: ${searchBannerId}`)
      } else {
        setError(err.message || 'Error al buscar el instructor')
      }
      console.error('❌ Error searching instructor:', err)
    } finally {
      setSearchLoading(false)
    }
  }, [instance, searchBannerId])

  const handleBackToBrowse = useCallback(() => {
    setSearchMode('browse')
    setSearchBannerId('')
    setError(null)
    loadInstructors()
  }, [])

  // Definir columnas
  const columns = useMemo<ColumnDef<Instructor>[]>(
    () => [
      {
        accessorKey: 'bannerId',
        header: 'Banner ID',
        cell: (info) => (
          <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400 font-semibold">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'firstName',
        header: 'Nombre Completo',
        cell: (info) => {
          const row = info.row.original
          return (
            <div>
              <div className="text-sm font-medium text-foreground">
                {row.firstName} {row.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.sex === 'M' ? 'Masculino' : row.sex === 'F' ? 'Femenino' : 'N/A'}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'emailAddress',
        header: 'Email',
        cell: (info) => {
          const email = info.getValue() as string

          if (!email) {
            return <span className="text-xs text-muted-foreground">Sin email</span>
          }

          return (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <div className="text-sm text-foreground truncate max-w-[200px]">
                {email}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'fcstCode',
        header: 'Estado',
        cell: (info) => (
          <Badge variant="secondary" className="text-xs">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'fctgCode',
        header: 'Categoría',
        cell: (info) => (
          <Badge variant="outline" className="border-indigo-500/50 text-indigo-600 dark:text-indigo-400 text-xs">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'departments',
        header: 'Departamentos',
        cell: (info) => {
          const departments = info.getValue() as Instructor['departments']

          if (!departments || departments.length === 0) {
            return <span className="text-xs text-muted-foreground">Sin departamentos</span>
          }

          return (
            <div className="flex flex-wrap gap-1">
              {departments.slice(0, 2).map((dept, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-green-500/50 text-green-600 dark:text-green-400 text-xs"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  {dept.deptCode}
                </Badge>
              ))}
              {departments.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{departments.length - 2}
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'activityDate',
        header: 'Última Actividad',
        cell: (info) => {
          const date = new Date(info.getValue() as string)
          return (
            <div className="text-sm text-muted-foreground">
              {date.toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          )
        },
      },
    ],
    []
  )

  if (loading && searchMode === 'browse') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Cargando instructores..." />
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
            onClick={() => searchMode === 'browse' ? loadInstructors() : searchInstructorByBannerId()}
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
        title="Instructores"
        description="Gestión de instructores académicos"
        icon={<GraduationCap className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: 'Total Instructores',
            value: searchMode === 'browse' ? instructors.length.toLocaleString() : '1',
            icon: <GraduationCap className="h-5 w-5" />
          },
          {
            label: 'Modo',
            value: searchMode === 'browse' ? 'Listado' : 'Búsqueda',
            icon: searchMode === 'browse' ? '📋' : '🔍'
          },
          {
            label: 'Estado',
            value: 'Activo',
            icon: '✅'
          }
        ]}
      />

      {/* Contenido Principal */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-border">
        {/* Header con buscador y controles */}
        <div className="px-6 py-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {searchMode === 'search' ? 'Resultado de Búsqueda' : 'Listado de Instructores'}
              </h2>
              {(loading || searchLoading) && <LoadingSpinner size="sm" />}
            </div>
            <div className="flex items-center gap-2">
              {searchMode === 'search' && (
                <Button
                  onClick={handleBackToBrowse}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al listado
                </Button>
              )}
              <Button
                onClick={() => searchMode === 'browse' ? loadInstructors() : searchInstructorByBannerId()}
                size="sm"
                disabled={loading || searchLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || searchLoading) ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Buscador por Banner ID */}
          <div className="relative max-w-md">
            <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              placeholder="Buscar por Banner ID (ej: 00012345)..."
              value={searchBannerId}
              onChange={(e) => setSearchBannerId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchInstructorByBannerId()
                }
              }}
              className="pl-10 border-primary/30 focus:border-primary"
              disabled={searchLoading}
            />
            {searchBannerId && (
              <Button
                size="sm"
                onClick={searchInstructorByBannerId}
                disabled={searchLoading}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Buscar
              </Button>
            )}
          </div>

          {/* Info de búsqueda (solo en modo search) */}
          {searchMode === 'search' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <UserSearch className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Búsqueda por Banner ID: <span className="text-primary font-bold">{searchBannerId}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {instructors.length > 0 ? 'Instructor encontrado' : 'No se encontró ningún instructor'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabla con DataTable */}
        <div className="p-6">
          <DataTable
            columns={columns}
            data={instructors}
            searchable
            searchPlaceholder="Filtrar en la tabla..."
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  )
}

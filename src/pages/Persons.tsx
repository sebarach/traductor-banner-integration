import { useState, useEffect, useMemo, useCallback } from 'react'
import { useMsal } from '@azure/msal-react'
import type { ColumnDef, PaginationState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { createApiClient } from '../utils/apiClient'
import type { Person } from '../types/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
import { Users, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Mail, Search, ArrowLeft, UserSearch } from 'lucide-react'

/**
 * Componente de Personas con paginación server-side
 * - Cada cambio de página hace un request al API
 * - El API devuelve 500 registros por página
 * - El total de páginas viene en el header `x-total-pages`
 */
export default function Persons() {
  const { instance } = useMsal()
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [globalFilter, setGlobalFilter] = useState('')
  const [searchBannerId, setSearchBannerId] = useState('')
  const [searchMode, setSearchMode] = useState<'browse' | 'search'>('browse')
  const [searchLoading, setSearchLoading] = useState(false)

  // Paginación manejada por TanStack Table
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 500, // El API devuelve 500 por página
  })

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  )

  const loadPersons = useCallback(async (page: number) => {
    setLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient(instance)
      const url = `/banner/person?page=${page}`

      // Debug: Ver la URL que se está llamando
      console.log('🔍 Fetching URL:', url, 'Page:', page)

      const response = await apiClient.getWithHeaders<Person[]>(url)

      // Debug: Ver primeros 3 registros para verificar que son diferentes
      console.log('📦 First 3 records Banner IDs:', response.data.slice(0, 3).map(p => p.bannerId))

      setPersons(response.data)

      // Debug: Ver todos los headers disponibles
      console.log('📦 Response headers:', {
        'x-total-pages': response.headers.get('x-total-pages'),
        'x-total-count': response.headers.get('x-total-count'),
        'records-returned': response.data.length,
        'access-control-expose-headers': response.headers.get('access-control-expose-headers'),
      })

      // Leer headers de paginación (si están expuestos por CORS)
      const xTotalPages = response.headers.get('x-total-pages')
      const xTotalCount = response.headers.get('x-total-count')

      if (xTotalPages) {
        const total = parseInt(xTotalPages, 10)
        setTotalPages(total)
        console.log('✅ Using x-total-pages header:', total)
      } else {
        // FALLBACK: CORS bloquea los headers, usar cálculo basado en registros conocidos
        // Sabemos que el API tiene 92,468 registros totales y 500 por página
        // Total de páginas = Math.ceil(92468 / 500) = 185 páginas
        const KNOWN_TOTAL_RECORDS = 92468
        const PAGE_SIZE = 500
        const calculatedTotalPages = Math.ceil(KNOWN_TOTAL_RECORDS / PAGE_SIZE)

        setTotalPages(calculatedTotalPages)
        console.log('⚠️ FALLBACK: CORS blocking headers. Using known total (92,468 records / 500 per page) = 185 pages')
      }

      if (xTotalCount) {
        const total = parseInt(xTotalCount, 10)
        setTotalRecords(total)
        console.log('✅ Using x-total-count header:', total)
      } else {
        // FALLBACK: Usar el total conocido
        const KNOWN_TOTAL_RECORDS = 92468
        setTotalRecords(KNOWN_TOTAL_RECORDS)
        console.log('⚠️ FALLBACK: Using known total records:', KNOWN_TOTAL_RECORDS)
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar las personas')
      console.error('❌ Error loading persons:', err)
    } finally {
      setLoading(false)
    }
  }, [instance])

  const searchPersonByBannerId = useCallback(async () => {
    if (!searchBannerId.trim()) {
      setError('Por favor ingresa un Banner ID')
      return
    }

    setSearchLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient(instance)
      const url = `/banner/person/${searchBannerId.trim()}`

      console.log('🔍 Searching Banner ID:', searchBannerId.trim())

      const person = await apiClient.get<Person>(url)

      // Si encontró la persona, mostrarla en la tabla
      setPersons([person])
      setSearchMode('search')
      setTotalPages(1)
      setTotalRecords(1)

      console.log('✅ Person found:', person.bannerId)
    } catch (err: any) {
      if (err.status === 404) {
        setError(`No se encontró ninguna persona con Banner ID: ${searchBannerId}`)
      } else {
        setError(err.message || 'Error al buscar la persona')
      }
      console.error('❌ Error searching person:', err)
    } finally {
      setSearchLoading(false)
    }
  }, [instance, searchBannerId])

  const handleBackToBrowse = useCallback(() => {
    setSearchMode('browse')
    setSearchBannerId('')
    setError(null)
    setPagination({ pageIndex: 0, pageSize: 500 })
    loadPersons(1)
  }, [loadPersons])

  // Cargar personas cuando cambia la página (solo en modo browse)
  useEffect(() => {
    if (searchMode === 'browse') {
      loadPersons(pageIndex + 1) // API usa páginas 1-indexed
    }
  }, [pageIndex, loadPersons, searchMode])

  // Definir columnas
  const columns = useMemo<ColumnDef<Person>[]>(
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
        accessorKey: 'legalName',
        header: 'Nombre Legal',
        cell: (info) => (
          <div>
            <div className="text-sm font-medium text-foreground">{info.getValue() as string}</div>
            {info.row.original.prefFirstName && (
              <div className="text-xs text-muted-foreground">Preferido: {info.row.original.prefFirstName}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'firstName',
        header: 'Nombres',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="text-sm text-foreground">
              {row.firstName} {row.middleName || ''}
            </div>
          )
        },
      },
      {
        accessorKey: 'lastName',
        header: 'Apellido',
        cell: (info) => (
          <div className="text-sm font-medium text-foreground">{info.getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'ntypCodeDesc',
        header: 'Tipo',
        cell: (info) => (
          <Badge variant="secondary" className="text-xs">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'emails',
        header: 'Emails',
        cell: (info) => {
          const emails = info.getValue() as Person['emails']

          if (!emails || emails.length === 0) {
            return <span className="text-xs text-muted-foreground">Sin emails</span>
          }

          const preferredEmail = emails.find(e => e.preferredInd === 'Y')
          const displayEmail = preferredEmail || emails[0]

          return (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <div>
                <div className="text-sm text-foreground truncate max-w-[200px]">
                  {displayEmail.emailAddress}
                </div>
                {emails.length > 1 && (
                  <div className="text-xs text-muted-foreground">
                    +{emails.length - 1} más
                  </div>
                )}
              </div>
            </div>
          )
        },
      },
    ],
    []
  )

  // Configurar tabla con paginación manual (server-side)
  const table = useReactTable({
    data: persons,
    columns,
    pageCount: totalPages,
    state: {
      pagination,
      globalFilter,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true, // IMPORTANTE: paginación server-side
  })

  if (loading && pageIndex === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Cargando personas..." />
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
            onClick={() => loadPersons(pageIndex + 1)}
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
        title="Personas"
        description="Sistema de Gestión Académica Universitaria"
        icon={<Users className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: 'Total Registros',
            value: totalRecords.toLocaleString(),
            icon: <Users className="h-5 w-5" />
          },
          {
            label: 'Total Páginas',
            value: totalPages.toLocaleString(),
            icon: '📄'
          },
          {
            label: 'Por Página',
            value: '500',
            icon: '📊'
          }
        ]}
      />

      {/* Tabla con paginación */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-border">
        {/* Header con buscador y botón de actualizar */}
        <div className="px-6 py-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {searchMode === 'search' ? 'Resultado de Búsqueda' : `Página ${pageIndex + 1} de ${totalPages}`}
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
                onClick={() => searchMode === 'browse' ? loadPersons(pageIndex + 1) : searchPersonByBannerId()}
                size="sm"
                disabled={loading || searchLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || searchLoading) ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Buscadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buscar por Banner ID */}
            <div className="relative">
              <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder="Buscar por Banner ID (ej: 00012345)..."
                value={searchBannerId}
                onChange={(e) => setSearchBannerId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchPersonByBannerId()
                  }
                }}
                className="pl-10 border-primary/30 focus:border-primary"
                disabled={searchLoading}
              />
              {searchBannerId && (
                <Button
                  size="sm"
                  onClick={searchPersonByBannerId}
                  disabled={searchLoading}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Buscar
                </Button>
              )}
            </div>

            {/* Filtro en página actual (solo en modo browse) */}
            {searchMode === 'browse' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar en la página actual..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>

          {/* Paginación superior (solo en modo browse) */}
          {searchMode === 'browse' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Mostrando {table.getFilteredRowModel().rows.length} de {persons.length} registros en esta página
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage() || loading}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage() || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">Página</span>
                  <strong>{pageIndex + 1}</strong>
                  <span className="text-muted-foreground">de</span>
                  <strong>{totalPages}</strong>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage() || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage() || loading}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Info de búsqueda (solo en modo search) */}
          {searchMode === 'search' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <UserSearch className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Búsqueda por Banner ID: <span className="text-primary font-bold">{searchBannerId}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {persons.length > 0 ? 'Persona encontrada' : 'No se encontró ninguna persona'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No se encontraron personas
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

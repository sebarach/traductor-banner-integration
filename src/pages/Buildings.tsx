import { useState, useEffect, useMemo, useCallback } from 'react'
import { useMsal } from '@azure/msal-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { createApiClient } from '../utils/apiClient'
import type { Building, BuildingAttribute } from '../types/api'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useDetailsModal } from '@/components/shared/DetailsModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building as BuildingIcon, RefreshCw, AlertCircle, MapPin, Info, Search } from 'lucide-react'

export default function Buildings() {
  const { instance } = useMsal()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const modal = useDetailsModal()

  useEffect(() => {
    loadBuildings()
  }, [])

  const loadBuildings = async () => {
    setLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient(instance)
      const data = await apiClient.get<Building[]>('/banner/buildings')
      setBuildings(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los edificios')
      console.error('Error loading buildings:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handler para abrir modal
  const handleOpenDetails = useCallback((building: Building) => {
    setSelectedBuilding(building)
    modal.open()
  }, [modal])

  // Definir columnas
  const columns = useMemo<ColumnDef<Building>[]>(
    () => [
      {
        accessorKey: 'buildingCode',
        header: 'Código',
        cell: (info) => (
          <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400 font-semibold">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'buildingDesc',
        header: 'Nombre Edificio',
        cell: (info) => (
          <div className="font-medium text-foreground">{info.getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'campCode',
        header: 'Campus',
        cell: (info) => {
          const row = info.row.original
          return (
            <div>
              <div className="text-sm font-medium text-foreground">{info.getValue() as string}</div>
              {row.siteCode && (
                <div className="text-xs text-muted-foreground font-medium">Sitio: {row.siteCode}</div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'city',
        header: 'Ubicación',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-foreground">{row.city}</div>
                <div className="text-xs text-muted-foreground">
                  {row.stateDesc} {row.zip}
                </div>
                {row.streetLine1 && (
                  <div className="text-xs text-muted-foreground mt-1">{row.streetLine1}</div>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'capacity',
        header: 'Capacidad',
        cell: (info) => {
          const row = info.row.original

          if (row.capacity == null || row.maxCapacity == null) {
            return <span className="text-xs text-muted-foreground">N/A</span>
          }

          const utilizationPercent = row.maxCapacity > 0
            ? Math.round((row.capacity / row.maxCapacity) * 100)
            : 0

          return (
            <div>
              <div className="text-sm font-medium text-foreground">
                {row.capacity} / {row.maxCapacity}
              </div>
              <div className="text-xs text-muted-foreground">
                {utilizationPercent}% ocupado
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'buildingAttributes',
        header: 'Atributos',
        cell: (info) => {
          const attributes = info.getValue() as Building['buildingAttributes']
          const building = info.row.original

          if (!attributes || attributes.length === 0) {
            return <span className="text-xs text-muted-foreground">Sin atributos</span>
          }

          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 hover:bg-primary/10"
              onClick={() => handleOpenDetails(building)}
            >
              <div className="flex flex-wrap gap-1 items-center">
                {attributes.slice(0, 2).map((attr, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-indigo-500/50 text-indigo-600 dark:text-indigo-400 text-xs pointer-events-none"
                  >
                    {attr.rdefDesc}
                  </Badge>
                ))}
                {attributes.length > 2 && (
                  <Badge variant="outline" className="text-xs pointer-events-none">
                    +{attributes.length - 2}
                  </Badge>
                )}
                <Info className="h-3 w-3 ml-1 text-primary" />
              </div>
            </Button>
          )
        },
      },
    ],
    [handleOpenDetails]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Cargando edificios..." />
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
            onClick={loadBuildings}
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
        title="Edificios"
        description="Sistema de Gestión Académica Universitaria"
        icon={<BuildingIcon className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: 'Total Edificios',
            value: buildings.length,
            icon: <BuildingIcon className="h-5 w-5" />
          },
          {
            label: 'Capacidad Total',
            value: buildings.reduce((sum, b) => sum + b.maxCapacity, 0),
            icon: <MapPin className="h-5 w-5" />
          }
        ]}
      />

      {/* DataTable con búsqueda y refresh button */}
      <DataTable
        columns={columns}
        data={buildings}
        searchPlaceholder="Buscar edificios..."
        pageSize={10}
        headerActions={
          <Button
            onClick={loadBuildings}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        }
      />

      {/* Modal de Atributos del Edificio */}
      {selectedBuilding && (
        <BuildingAttributesModal
          open={modal.isOpen}
          onOpenChange={modal.setIsOpen}
          building={selectedBuilding}
        />
      )}
    </div>
  )
}

/**
 * Modal especializado para mostrar atributos de edificios
 * con tabla TanStack, buscador y scroll
 */
interface BuildingAttributesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  building: Building
}

function BuildingAttributesModal({ open, onOpenChange, building }: BuildingAttributesModalProps) {
  const [globalFilter, setGlobalFilter] = useState('')

  // Preparar datos: agregar índice a cada atributo
  const attributesWithIndex = useMemo(() => {
    return (building.buildingAttributes || []).map((attr, index) => ({
      ...attr,
      index: index + 1,
    }))
  }, [building.buildingAttributes])

  // Definir columnas de la tabla
  const columns = useMemo<ColumnDef<BuildingAttribute & { index: number }>[]>(
    () => [
      {
        accessorKey: 'index',
        header: '#',
        size: 60,
        cell: (info) => (
          <div className="text-center font-bold text-white text-base">
            {info.getValue() as number}
          </div>
        ),
      },
      {
        accessorKey: 'rdefDesc',
        header: 'Descripción del Atributo',
        cell: (info) => (
          <div className="text-sm font-medium text-slate-100">
            {info.getValue() as string}
          </div>
        ),
      },
    ],
    []
  )

  // Configurar tabla (sin paginación para mostrar todos los atributos)
  const table = useReactTable({
    data: attributesWithIndex,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-slate-950 dark:bg-slate-950 border-slate-700 flex flex-col">
        {/* Header oscuro con gradiente */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 px-6 py-4 flex-shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <BuildingIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Atributos del Edificio
                </DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  {building.buildingDesc}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Buscador y contador */}
        <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700 space-y-3 flex-shrink-0">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar atributos..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary"
            />
          </div>

          {/* Contador */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-400">
              Mostrando {table.getFilteredRowModel().rows.length} de {attributesWithIndex.length} atributos
            </div>
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
              Total: {attributesWithIndex.length}
            </Badge>
          </div>
        </div>

        {/* Tabla con scroll */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-800 border-b-2 border-slate-600">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider"
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-slate-900">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-slate-800">
                        <Info className="h-8 w-8 text-slate-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-400">
                        {globalFilter
                          ? 'No se encontraron atributos con ese criterio'
                          : 'Este edificio no tiene atributos asignados'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`
                      border-b border-slate-700/50
                      hover:bg-slate-800/50
                      transition-all duration-150
                      ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}
                    `}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
